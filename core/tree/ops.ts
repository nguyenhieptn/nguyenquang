/**
 * core/tree/ops.ts — internal computation layer (story 1-3).
 *
 * Takes (tx, ctx, args) — never resolves identity itself; that is index.ts's job (AD-24).
 * Reads only: this module performs NO mutations, so no revisions originate here (AD-10 n/a).
 *
 * AD-5: everything positional (fragments, provisional roots, generation numbers, branch codes)
 * is computed per call from the live parent-child assertions. Nothing is cached (AD-23).
 * AD-13/AD-21: every card leaving this module has passed visibilityFor/fieldsFor with the
 * viewer's relationship distance. Raw birth dates never appear on a card.
 *
 * Scale note: the clan is < 300 people — two queries (persons + edges), then in-memory graph.
 */
import { and, asc, eq, inArray, isNull, like, or, sql } from 'drizzle-orm';
import { dbGlobal, type Tx } from '@/db';
import { assertion, authUser, person, revision } from '@/db/schema';
import type { Confidence, Tier } from '@/db/schema';
import { chuanHoa } from '@/core/so-khop';
import {
  ANONYMOUS_LABEL,
  PRIVACY_RADIUS,
  visibilityFor,
  type Visibility,
} from '@/core/identity/privacy';
import type { ViewerContext } from '@/core/identity/session';
import { err, ok, type Result } from '@/core/types';
import type { AncestryPath, BranchView, ClanOverview, Fragment, PersonCard } from './index';

// ── Raw shapes: attribution carries the account id; index.ts swaps in the display name ──
// (the "user" table is identity data outside the clan partition — read AFTER the clan tx).

export type RawAttribution = { byAccountId: string; at: string } | null;
export type RawPersonCard = Omit<PersonCard, 'attribution'> & { attribution: RawAttribution };
export type RawCoupleNode = {
  person: RawPersonCard;
  partners: RawPersonCard[];
  childrenIds: string[];
};
export type RawBranchView = Omit<BranchView, 'generations'> & {
  generations: { generation: number; couples: RawCoupleNode[] }[];
};
export type RawAncestryPath = Omit<AncestryPath, 'steps'> & { steps: RawPersonCard[] };
export type RawSearchHit = RawPersonCard & { similar: boolean };

// ── In-memory graph ──

type PersonRow = {
  id: string;
  mergedInto: string | null;
  fullName: string;
  nameFolded: string;
  nameTier: Tier | null;
  nameConfidence: Confidence | null;
  birthDate: string | null;
  deathDate: string | null;
  isLiving: boolean;
  hiddenFromPublic: boolean;
};

type Edge = {
  id: string;
  childId: string;
  parentId: string;
  tier: Tier;
  confidence: Confidence;
  createdAt: Date;
};

export type TreeData = {
  /** Merged persons are excluded — edges referencing them were redirected to the winner. */
  persons: Map<string, PersonRow>;
  redirect: (id: string) => string | null;
  /** child → one best edge per distinct parent. */
  parentsOf: Map<string, Edge[]>;
  /** parent → one best edge per distinct child. */
  childrenOf: Map<string, Edge[]>;
  /** union co-membership: person → distinct partner ids (spouse distance 1 — AD-13). */
  partnersOf: Map<string, string[]>;
  /** Undirected: parent-child both ways + union co-membership. Distance walks read this. */
  adjacency: Map<string, string[]>;
};

/** Official beats tentative; then oldest createdAt; then smallest id. Deterministic everywhere. */
function preferEdge(a: Edge, b: Edge): number {
  const ta = a.tier === 'official' ? 0 : 1;
  const tb = b.tier === 'official' ? 0 : 1;
  if (ta !== tb) return ta - tb;
  const dt = a.createdAt.getTime() - b.createdAt.getTime();
  if (dt !== 0) return dt;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function birthYear(row: PersonRow): number | null {
  const y = row.birthDate ? Number(row.birthDate.slice(0, 4)) : NaN;
  return Number.isFinite(y) ? y : null;
}

function isTentativeName(row: PersonRow): boolean {
  return row.nameTier === null || row.nameTier === 'tentative';
}

/** The two whole-clan queries; everything else is computed from their result. */
export async function loadTreeData(tx: Tx): Promise<TreeData> {
  const personRows = await tx
    .select({
      id: person.id,
      mergedInto: person.mergedInto,
      fullName: person.fullName,
      nameFolded: person.nameFolded,
      nameTier: person.nameTier,
      nameConfidence: person.nameConfidence,
      birthDate: person.birthDate,
      deathDate: person.deathDate,
      isLiving: person.isLiving,
      hiddenFromPublic: person.hiddenFromPublic,
    })
    .from(person);

  const edgeRows = await tx
    .select({
      id: assertion.id,
      kind: assertion.kind,
      subjectPersonId: assertion.subjectPersonId,
      objectPersonId: assertion.objectPersonId,
      unionId: assertion.unionId,
      tier: assertion.tier,
      confidence: assertion.confidence,
      createdAt: assertion.createdAt,
    })
    .from(assertion)
    .where(
      and(eq(assertion.status, 'live'), inArray(assertion.kind, ['parent-child', 'union-partner'])),
    );

  const all = new Map<string, PersonRow>(personRows.map((r) => [r.id, r]));
  const persons = new Map<string, PersonRow>(
    personRows
      .filter((r) => r.mergedInto === null)
      .sort((a, b) => (a.id < b.id ? -1 : 1))
      .map((r) => [r.id, r]),
  );

  const redirect = (id: string): string | null => {
    let cur = all.get(id);
    for (let hops = 0; cur && hops < 20; hops++) {
      if (cur.mergedInto === null) return cur.id;
      cur = all.get(cur.mergedInto);
    }
    return null;
  };

  const bestEdge = new Map<string, Edge>();
  const unionMembers = new Map<string, Set<string>>();
  for (const e of edgeRows) {
    if (e.kind === 'parent-child') {
      const childId = redirect(e.subjectPersonId);
      const parentId = e.objectPersonId ? redirect(e.objectPersonId) : null;
      if (!childId || !parentId || childId === parentId) continue;
      const edge: Edge = {
        id: e.id,
        childId,
        parentId,
        tier: e.tier,
        confidence: e.confidence,
        createdAt: e.createdAt,
      };
      const key = `${childId}|${parentId}`;
      const prev = bestEdge.get(key);
      if (!prev || preferEdge(edge, prev) < 0) bestEdge.set(key, edge);
    } else if (e.kind === 'union-partner' && e.unionId) {
      const pid = redirect(e.subjectPersonId);
      if (!pid) continue;
      let set = unionMembers.get(e.unionId);
      if (!set) unionMembers.set(e.unionId, (set = new Set()));
      set.add(pid);
    }
  }

  const parentsOf = new Map<string, Edge[]>();
  const childrenOf = new Map<string, Edge[]>();
  const push = (m: Map<string, Edge[]>, k: string, e: Edge) => {
    const arr = m.get(k);
    if (arr) arr.push(e);
    else m.set(k, [e]);
  };
  for (const e of [...bestEdge.values()].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    push(parentsOf, e.childId, e);
    push(childrenOf, e.parentId, e);
  }

  const partnerSets = new Map<string, Set<string>>();
  for (const members of unionMembers.values()) {
    for (const a of members)
      for (const b of members) {
        if (a === b) continue;
        let set = partnerSets.get(a);
        if (!set) partnerSets.set(a, (set = new Set()));
        set.add(b);
      }
  }
  const partnersOf = new Map<string, string[]>();
  for (const [id, set] of partnerSets) partnersOf.set(id, [...set].sort());

  const adjSets = new Map<string, Set<string>>();
  const link = (a: string, b: string) => {
    let set = adjSets.get(a);
    if (!set) adjSets.set(a, (set = new Set()));
    set.add(b);
  };
  for (const e of bestEdge.values()) {
    link(e.childId, e.parentId);
    link(e.parentId, e.childId);
  }
  for (const [id, partners] of partnersOf) for (const p of partners) link(id, p);
  const adjacency = new Map<string, string[]>();
  for (const [id, set] of adjSets) adjacency.set(id, [...set].sort());

  return { persons, redirect, parentsOf, childrenOf, partnersOf, adjacency };
}

// ── Derived structure (AD-5) ──

type FragmentInfo = { rootId: string; members: string[] };

export type Structure = {
  /** Sorted: personCount desc, then rootId asc. Index 0 is the main fragment. */
  fragments: FragmentInfo[];
  fragmentIndexOf: Map<string, number>;
  /** Root = 1; propagated ±1 over parent-child edges (so a married-in parent lands right). */
  generation: Map<string, number>;
  /** "1.3.2" — only for descendants of a fragment root. Roots and married-ins have none. */
  branchCode: Map<string, string>;
  /** The parent whose line a code descends through (official first, then oldest edge). */
  codeParent: Map<string, string>;
  /** parent → children ordered by birth year (nulls last), then folded name, then id. */
  codeChildren: Map<string, string[]>;
};

export function computeStructure(data: TreeData): Structure {
  const seen = new Set<string>();
  const fragments: FragmentInfo[] = [];

  // Connected components over parent-child edges only (both directions).
  for (const id of data.persons.keys()) {
    if (seen.has(id)) continue;
    const members: string[] = [];
    const queue = [id];
    seen.add(id);
    while (queue.length) {
      const x = queue.shift()!;
      members.push(x);
      const neighbours = [
        ...(data.parentsOf.get(x) ?? []).map((e) => e.parentId),
        ...(data.childrenOf.get(x) ?? []).map((e) => e.childId),
      ];
      for (const n of neighbours) {
        if (!seen.has(n) && data.persons.has(n)) {
          seen.add(n);
          queue.push(n);
        }
      }
    }
    members.sort();
    fragments.push({ rootId: '', members });
  }

  const generation = new Map<string, number>();
  const branchCode = new Map<string, string>();
  const codeParent = new Map<string, string>();
  const codeChildren = new Map<string, string[]>();

  // Depth of the deepest descendant line below a person (for root election). Memoized, cycle-safe.
  const depthMemo = new Map<string, number>();
  const inStack = new Set<string>();
  const depthOf = (pid: string): number => {
    const memo = depthMemo.get(pid);
    if (memo !== undefined) return memo;
    if (inStack.has(pid)) return 0;
    inStack.add(pid);
    let d = 1;
    for (const e of data.childrenOf.get(pid) ?? []) d = Math.max(d, 1 + depthOf(e.childId));
    inStack.delete(pid);
    depthMemo.set(pid, d);
    return d;
  };

  for (const frag of fragments) {
    // Provisional root: no live parent edge; deepest line wins; ties → oldest birth, smallest id.
    let candidates = frag.members.filter((m) => !data.parentsOf.has(m));
    if (candidates.length === 0) candidates = frag.members; // cycle in data — still deterministic
    let root = candidates[0];
    for (const c of candidates.slice(1)) {
      const dc = depthOf(c);
      const dr = depthOf(root);
      if (dc !== dr) {
        if (dc > dr) root = c;
        continue;
      }
      const bc = birthYear(data.persons.get(c)!) ?? Number.POSITIVE_INFINITY;
      const br = birthYear(data.persons.get(root)!) ?? Number.POSITIVE_INFINITY;
      if (bc !== br) {
        if (bc < br) root = c;
        continue;
      }
      if (c < root) root = c;
    }
    frag.rootId = root;

    // Generations: BFS from root; parent→child is +1, child→parent is −1.
    generation.set(root, 1);
    const queue = [root];
    while (queue.length) {
      const x = queue.shift()!;
      const g = generation.get(x)!;
      for (const e of data.childrenOf.get(x) ?? [])
        if (!generation.has(e.childId)) {
          generation.set(e.childId, g + 1);
          queue.push(e.childId);
        }
      for (const e of data.parentsOf.get(x) ?? [])
        if (!generation.has(e.parentId)) {
          generation.set(e.parentId, g - 1);
          queue.push(e.parentId);
        }
    }

    // Descendant set of the root (downward only).
    const desc = new Set<string>([root]);
    const dq = [root];
    while (dq.length) {
      const x = dq.shift()!;
      for (const e of data.childrenOf.get(x) ?? [])
        if (!desc.has(e.childId)) {
          desc.add(e.childId);
          dq.push(e.childId);
        }
    }

    // Each descendant descends through ONE parent for its code — prefer official, then oldest.
    for (const d of desc) {
      if (d === root) continue;
      const viaDesc = (data.parentsOf.get(d) ?? []).filter((e) => desc.has(e.parentId));
      viaDesc.sort(preferEdge);
      if (viaDesc.length) codeParent.set(d, viaDesc[0].parentId);
    }
    const childBuckets = new Map<string, string[]>();
    for (const [child, parent] of codeParent) {
      if (!desc.has(child)) continue;
      const arr = childBuckets.get(parent);
      if (arr) arr.push(child);
      else childBuckets.set(parent, [child]);
    }
    for (const [parent, kids] of childBuckets) {
      kids.sort((a, b) => {
        const ra = data.persons.get(a)!;
        const rb = data.persons.get(b)!;
        const ya = birthYear(ra) ?? Number.POSITIVE_INFINITY;
        const yb = birthYear(rb) ?? Number.POSITIVE_INFINITY;
        if (ya !== yb) return ya - yb;
        if (ra.nameFolded !== rb.nameFolded) return ra.nameFolded < rb.nameFolded ? -1 : 1;
        return a < b ? -1 : 1;
      });
      codeChildren.set(parent, kids);
    }

    // Codes: root's children get 1..n; deeper levels append ".i".
    const cq: string[] = [root];
    while (cq.length) {
      const x = cq.shift()!;
      const prefix = x === root ? '' : `${branchCode.get(x)!}.`;
      for (const [i, child] of (codeChildren.get(x) ?? []).entries()) {
        branchCode.set(child, `${prefix}${i + 1}`);
        cq.push(child);
      }
    }
  }

  fragments.sort((a, b) => b.members.length - a.members.length || (a.rootId < b.rootId ? -1 : 1));
  const fragmentIndexOf = new Map<string, number>();
  fragments.forEach((f, i) => {
    for (const m of f.members) fragmentIndexOf.set(m, i);
  });

  return { fragments, fragmentIndexOf, generation, branchCode, codeParent, codeChildren };
}

// ── Distance + privacy ──

/** BFS over blood + union edges, capped. Distances beyond the cap are simply absent. */
export function bfsDistances(data: TreeData, fromId: string, cap: number): Map<string, number> {
  const dist = new Map<string, number>([[fromId, 0]]);
  let frontier = [fromId];
  for (let d = 1; d <= cap && frontier.length; d++) {
    const next: string[] = [];
    for (const x of frontier)
      for (const n of data.adjacency.get(x) ?? []) {
        if (!dist.has(n)) {
          dist.set(n, d);
          next.push(n);
        }
      }
    frontier = next;
  }
  return dist;
}

type ViewerLens = {
  role: ViewerContext['role'];
  personId: string | null;
  dist: Map<string, number>;
};

function viewerLens(data: TreeData, ctx: ViewerContext): ViewerLens {
  const pid = ctx.personId ? data.redirect(ctx.personId) : null;
  return {
    role: ctx.role,
    personId: pid,
    dist: pid ? bfsDistances(data, pid, PRIVACY_RADIUS) : new Map(),
  };
}

function visibilityOf(lens: ViewerLens, row: PersonRow, today: Date): Visibility {
  const distance = lens.personId ? (lens.dist.get(row.id) ?? null) : null;
  return visibilityFor(
    { role: lens.role, personId: lens.personId },
    {
      personId: row.id,
      isLiving: row.isLiving,
      birthDate: row.birthDate,
      hiddenFromPublic: row.hiddenFromPublic,
    },
    distance,
    today,
  );
}

/** Card lifespan. Living people show a YEAR at most, at every visibility level (FR-37). */
function lifespanOf(row: PersonRow, vis: Visibility): string {
  if (vis === 'anonymous') return '';
  const by = row.birthDate ? row.birthDate.slice(0, 4) : null;
  const dy = row.deathDate ? row.deathDate.slice(0, 4) : null;
  if (row.isLiving) return by ? `sinh ${by}` : '';
  if (!by && !dy) return '';
  return `${by ?? '?'}–${dy ?? '?'}`;
}

function displayNameOf(lens: ViewerLens, row: PersonRow, today: Date): string {
  return visibilityOf(lens, row, today) === 'anonymous' ? ANONYMOUS_LABEL : row.fullName;
}

function cardOf(
  lens: ViewerLens,
  s: Structure,
  row: PersonRow,
  attribution: Map<string, RawAttribution>,
  today: Date,
): RawPersonCard {
  const vis = visibilityOf(lens, row, today);
  return {
    personId: row.id,
    fullName: vis === 'anonymous' ? ANONYMOUS_LABEL : row.fullName,
    tier: row.nameTier ?? 'tentative',
    confidence: row.nameConfidence ?? 'ton-nghi',
    isLiving: row.isLiving,
    lifespan: lifespanOf(row, vis),
    generation: s.generation.get(row.id) ?? null,
    branchCode: s.branchCode.get(row.id) ?? null,
    attribution: vis === 'anonymous' ? null : (attribution.get(row.id) ?? null),
  };
}

// ── Attribution (FR-39): earliest 'person'/'create' revision per person ──

async function fetchAttribution(tx: Tx, ids: string[]): Promise<Map<string, RawAttribution>> {
  const map = new Map<string, RawAttribution>();
  if (ids.length === 0) return map;
  const rows = await tx
    .select({
      entityId: revision.entityId,
      accountId: revision.accountId,
      createdAt: revision.createdAt,
    })
    .from(revision)
    .where(
      and(
        eq(revision.entity, 'person'),
        eq(revision.action, 'create'),
        inArray(revision.entityId, ids),
      ),
    )
    .orderBy(asc(revision.createdAt), asc(revision.id));
  for (const r of rows)
    if (!map.has(r.entityId))
      map.set(r.entityId, { byAccountId: r.accountId, at: r.createdAt.toISOString() });
  return map;
}

/**
 * Account id → display name, from the Better Auth "user" table. Identity data (AD-8), read
 * through dbGlobal — call OUTSIDE the clan transaction (index.ts does, after ops return).
 */
export async function accountNames(accountIds: string[]): Promise<Map<string, string>> {
  const ids = [...new Set(accountIds)];
  if (ids.length === 0) return new Map();
  const rows = await dbGlobal
    .select({ id: authUser.id, name: authUser.name })
    .from(authUser)
    .where(inArray(authUser.id, ids));
  return new Map(rows.map((r) => [r.id, r.name]));
}

// ── Ops ──

function subtreeOf(s: Structure, headId: string): string[] {
  const out: string[] = [];
  const queue = [headId];
  while (queue.length) {
    const x = queue.shift()!;
    out.push(x);
    queue.push(...(s.codeChildren.get(x) ?? []));
  }
  return out;
}

function compareCodes(a: string, b: string): number {
  const as = a.split('.').map(Number);
  const bs = b.split('.').map(Number);
  for (let i = 0; i < Math.max(as.length, bs.length); i++) {
    const x = as[i] ?? 0;
    const y = bs[i] ?? 0;
    if (x !== y) return x - y;
  }
  return 0;
}

export async function getClanOverviewOps(
  tx: Tx,
  ctx: ViewerContext,
): Promise<Result<ClanOverview>> {
  const data = await loadTreeData(tx);
  const s = computeStructure(data);
  if (s.fragments.length === 0)
    return ok({ mainFragment: null, branches: [], unconnectedFragments: [] });

  const today = new Date();
  const lens = viewerLens(data, ctx);
  const asFragment = (f: FragmentInfo): Fragment => ({
    rootPersonId: f.rootId,
    rootName: displayNameOf(lens, data.persons.get(f.rootId)!, today),
    personCount: f.members.length,
    tentativeCount: f.members.filter((m) => isTentativeName(data.persons.get(m)!)).length,
  });

  const main = s.fragments[0];
  const branches = (s.codeChildren.get(main.rootId) ?? []).map((headId) => {
    const subtree = subtreeOf(s, headId);
    return {
      branchCode: s.branchCode.get(headId)!,
      headName: displayNameOf(lens, data.persons.get(headId)!, today),
      personCount: subtree.length,
      tentativeCount: subtree.filter((m) => isTentativeName(data.persons.get(m)!)).length,
      headPersonId: headId,
    };
  });

  return ok({
    mainFragment: asFragment(main),
    branches,
    unconnectedFragments: s.fragments.slice(1).map(asFragment),
  });
}

export async function getBranchViewOps(
  tx: Tx,
  ctx: ViewerContext,
  headPersonId: string,
): Promise<Result<RawBranchView>> {
  const data = await loadTreeData(tx);
  const s = computeStructure(data);
  const pid = data.redirect(headPersonId);
  if (!pid || !data.persons.has(pid)) return err('not-found', 'person not found');

  const fragIdx = s.fragmentIndexOf.get(pid)!;
  const rootId = s.fragments[fragIdx].rootId;

  // Branch head: the child-of-root ancestor on the person's code line (or the root itself).
  let head: string;
  if (pid === rootId) head = pid;
  else if (!s.codeParent.has(pid))
    return err('invalid', 'person is not on a descent line of the fragment root');
  else {
    let x = pid;
    while (s.codeParent.get(x) !== rootId) x = s.codeParent.get(x)!;
    head = x;
  }

  const members = subtreeOf(s, head);
  const memberSet = new Set(members);
  members.sort((a, b) => {
    const ga = s.generation.get(a) ?? 0;
    const gb = s.generation.get(b) ?? 0;
    if (ga !== gb) return ga - gb;
    return compareCodes(s.branchCode.get(a) ?? '', s.branchCode.get(b) ?? '');
  });

  const partnerIdsOf = (m: string): string[] =>
    (data.partnersOf.get(m) ?? []).filter((p) => data.persons.has(p));

  const cardIds = new Set<string>(members);
  for (const m of members) for (const p of partnerIdsOf(m)) cardIds.add(p);
  const attribution = await fetchAttribution(tx, [...cardIds]);

  const today = new Date();
  const lens = viewerLens(data, ctx);
  const card = (id: string) => cardOf(lens, s, data.persons.get(id)!, attribution, today);

  // Couples merged: a subtree member already shown as an earlier member's partner gets no node.
  const consumed = new Set<string>();
  const byGeneration = new Map<number, RawCoupleNode[]>();
  for (const m of members) {
    if (consumed.has(m)) continue;
    const partners = partnerIdsOf(m);
    for (const p of partners) if (memberSet.has(p)) consumed.add(p);
    const childIds = new Set<string>(s.codeChildren.get(m) ?? []);
    for (const p of partners) for (const c of s.codeChildren.get(p) ?? []) childIds.add(c);
    const node: RawCoupleNode = {
      person: card(m),
      partners: partners.map(card),
      childrenIds: [...childIds].sort((a, b) =>
        compareCodes(s.branchCode.get(a) ?? '', s.branchCode.get(b) ?? ''),
      ),
    };
    const g = s.generation.get(m) ?? 0;
    const bucket = byGeneration.get(g);
    if (bucket) bucket.push(node);
    else byGeneration.set(g, [node]);
  }

  const generations = [...byGeneration.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([generation, couples]) => ({ generation, couples }));

  const viewerGeneration =
    lens.personId && memberSet.has(lens.personId)
      ? (s.generation.get(lens.personId) ?? null)
      : null;

  return ok({
    branchCode: head === rootId ? '' : s.branchCode.get(head)!,
    headPersonId: head,
    generations,
    viewerGeneration,
  });
}

export async function getAncestryPathOps(
  tx: Tx,
  ctx: ViewerContext,
  personId: string,
): Promise<Result<RawAncestryPath>> {
  const data = await loadTreeData(tx);
  const s = computeStructure(data);
  const pid = data.redirect(personId);
  if (!pid || !data.persons.has(pid)) return err('not-found', 'person not found');

  // Walk child → parent along the preferred edge (official first, then oldest, then smallest id).
  const stepIds = [pid];
  const visited = new Set([pid]);
  let cur = pid;
  for (let i = 0; i < 100; i++) {
    const parents = [...(data.parentsOf.get(cur) ?? [])].sort(preferEdge);
    if (parents.length === 0) break;
    const next = parents[0].parentId;
    if (visited.has(next)) break;
    stepIds.push(next);
    visited.add(next);
    cur = next;
  }

  const attribution = await fetchAttribution(tx, stepIds);
  const today = new Date();
  const lens = viewerLens(data, ctx);
  const fragIdx = s.fragmentIndexOf.get(pid)!;
  const rootRow = data.persons.get(s.fragments[fragIdx].rootId)!;

  return ok({
    steps: stepIds.map((id) => cardOf(lens, s, data.persons.get(id)!, attribution, today)),
    fragmentRootName: displayNameOf(lens, rootRow, today),
    reachesMainRoot: fragIdx === 0,
  });
}

export async function searchPersonsOps(
  tx: Tx,
  ctx: ViewerContext,
  query: string,
): Promise<Result<RawSearchHit[]>> {
  const q = chuanHoa(query);
  if (!q) return ok([]);

  const data = await loadTreeData(tx);
  const s = computeStructure(data);

  // AD-16: match on the folded column only — contains, plus pg_trgm for near-misses.
  const escaped = q.replace(/[\\%_]/g, (m) => `\\${m}`);
  const rows = await tx
    .select({
      id: person.id,
      nameFolded: person.nameFolded,
      sim: sql<number>`similarity(${person.nameFolded}, ${q})`,
    })
    .from(person)
    .where(
      and(
        isNull(person.mergedInto),
        or(
          like(person.nameFolded, `%${escaped}%`),
          sql`similarity(${person.nameFolded}, ${q}) > 0.35`,
        ),
      ),
    )
    .limit(50);

  const today = new Date();
  const lens = viewerLens(data, ctx);

  // A name-matched person the viewer may not name would leak the name by appearing — drop them.
  const visible = rows.filter((r) => {
    const row = data.persons.get(r.id);
    return row !== undefined && visibilityOf(lens, row, today) !== 'anonymous';
  });

  const exact = visible
    .filter((r) => r.nameFolded.includes(q))
    .sort((a, b) => (a.nameFolded !== b.nameFolded ? (a.nameFolded < b.nameFolded ? -1 : 1) : a.id < b.id ? -1 : 1));
  const fuzzy = visible
    .filter((r) => !r.nameFolded.includes(q))
    .sort((a, b) => b.sim - a.sim || (a.id < b.id ? -1 : 1));
  const ordered = [...exact, ...fuzzy].slice(0, 30);

  const attribution = await fetchAttribution(tx, ordered.map((r) => r.id));
  return ok(
    ordered.map((r) => ({
      ...cardOf(lens, s, data.persons.get(r.id)!, attribution, today),
      similar: !r.nameFolded.includes(q),
    })),
  );
}

export async function relationshipDistanceOps(
  tx: Tx,
  _ctx: ViewerContext,
  fromPersonId: string,
  toPersonId: string,
): Promise<Result<number | null>> {
  const data = await loadTreeData(tx);
  const a = data.redirect(fromPersonId);
  const b = data.redirect(toPersonId);
  if (!a || !b || !data.persons.has(a) || !data.persons.has(b))
    return err('not-found', 'person not found');
  if (a === b) return ok(0);
  // Cost cap: at < 300 people a depth-10 BFS is tiny; beyond 10 bậc the answer is "unrelated".
  const dist = bfsDistances(data, a, 10);
  return ok(dist.get(b) ?? null);
}
