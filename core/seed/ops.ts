/**
 * core/seed/ops — FR-51 preview and batch commit, internal to core (story 1-8).
 *
 * Both operations take (tx, ctx, args) and run inside ONE withClanContext transaction opened
 * by index.ts (AD-24). Both are gated on the approval right: the preview shows names and birth
 * years of possibly-living people across the whole clan, which only admin / branch-head may
 * see in bulk (AD-13/AD-21), and FR-51 is their workflow to begin with.
 *
 * previewSeedOp NEVER writes. commitSeedOp writes exclusively through core/person and
 * core/assertion ops, so projection (AD-19), revisions (AD-10), the tentative tier (AD-9),
 * and AD-15 notifications cannot be skipped. Every expected failure is detected BEFORE the
 * first write; a Result err after writes have begun is a bug and throws, rolling the whole
 * import back — a half-imported skeleton is worse than none.
 */
import { and, eq, inArray, isNull } from 'drizzle-orm';
import type { Tx } from '@/db';
import { assertion, person } from '@/db/schema';
import { chuanHoa } from '@/core/so-khop';
import { err, ok, type Result } from '@/core/types';
import type { ViewerContext } from '@/core/identity/session';
import type { NewPersonInput, SourceSpec } from '@/core/assertion';
import { addAssertionOp, createSourceOp, gateApprover, loadPerson } from '@/core/assertion/ops';
import { createPersonOp } from '@/core/person/ops';
import type { SeedGender, SeedRow } from './csv';
import type {
  SeedCandidate,
  SeedCommitResult,
  SeedDecision,
  SeedDecisions,
  SeedPreview,
  SeedPreviewRow,
  SeedRowClassification,
  SeedRowWarning,
} from './index';

/**
 * Birth years within this window still count as the same person — old genealogies routinely
 * drift a few years (same tolerance core/so-khop's soft scoring uses).
 */
const YEAR_NEAR = 3;

type ClanCandidate = { personId: string; name: string; birthYear: number | null };

/** One nameFolded lookup for every name the file mentions — never a bare ILIKE (AD-16). */
async function loadClanCandidates(tx: Tx, foldedNames: string[]): Promise<Map<string, ClanCandidate[]>> {
  const byName = new Map<string, ClanCandidate[]>();
  const names = [...new Set(foldedNames.filter((n) => n.length > 0))];
  if (names.length === 0) return byName;
  const rows = await tx
    .select({
      id: person.id,
      fullName: person.fullName,
      nameFolded: person.nameFolded,
      birthDate: person.birthDate,
    })
    .from(person)
    .where(and(inArray(person.nameFolded, names), isNull(person.mergedInto)));
  for (const row of rows) {
    const candidate: ClanCandidate = {
      personId: row.id,
      name: row.fullName,
      birthYear: row.birthDate ? Number(row.birthDate.slice(0, 4)) : null,
    };
    const list = byName.get(row.nameFolded) ?? [];
    list.push(candidate);
    byName.set(row.nameFolded, list);
  }
  return byName;
}

function yearsNear(a: number | null, b: number | null): boolean {
  return a !== null && b !== null && Math.abs(a - b) <= YEAR_NEAR;
}

// ── Preview (no writes) ──────────────────────────────────────────────────────

export async function previewSeedOp(
  tx: Tx,
  viewer: ViewerContext,
  rows: SeedRow[],
): Promise<Result<SeedPreview>> {
  const gate = gateApprover(viewer);
  if (!gate.ok) return gate;

  const foldedOf = (row: SeedRow) => chuanHoa(row.hoTen);
  const nameCounts = new Map<string, number>();
  for (const row of rows) nameCounts.set(foldedOf(row), (nameCounts.get(foldedOf(row)) ?? 0) + 1);

  const clanMatches = await loadClanCandidates(tx, [
    ...rows.map(foldedOf),
    ...rows.filter((r) => r.tenCha).map((r) => chuanHoa(r.tenCha!)),
  ]);

  const previewRows: SeedPreviewRow[] = rows.map((row) => {
    const folded = foldedOf(row);
    const candidates: SeedCandidate[] = [...(clanMatches.get(folded) ?? [])].sort((a, b) => {
      const da = yearsNear(row.namSinh, a.birthYear) ? Math.abs(row.namSinh! - a.birthYear!) : 99;
      const db = yearsNear(row.namSinh, b.birthYear) ? Math.abs(row.namSinh! - b.birthYear!) : 99;
      return da - db || a.personId.localeCompare(b.personId);
    });

    const warnings: SeedRowWarning[] = [];

    // Classification — EXPERIENCE.md § Bảng xem trước: khớp / mới / nghi trùng. A single
    // candidate is a confident match only when the birth years agree; a name-only or
    // year-conflicting match, two candidates, or a duplicate inside the file all land on
    // 'nghi-trung' — the bot suggests, it never decides (nothing is preselected).
    let classification: SeedRowClassification;
    if (candidates.length === 0) classification = 'nguoi-moi';
    else if (candidates.length === 1 && yearsNear(row.namSinh, candidates[0]!.birthYear))
      classification = 'khop-nguoi-co-san';
    else classification = 'nghi-trung';

    if ((nameCounts.get(folded) ?? 0) >= 2) {
      classification = 'nghi-trung';
      warnings.push('duplicate-in-file');
    }

    // FR-63: a named father found NOWHERE — neither on another file row nor in the clan —
    // is a warning, not an error. The row stays importable and becomes a fragment root.
    if (row.tenCha) {
      const fatherFolded = chuanHoa(row.tenCha);
      const inFile = rows.some((r) => r.index !== row.index && foldedOf(r) === fatherFolded);
      const inClan = (clanMatches.get(fatherFolded) ?? []).length > 0;
      if (!inFile && !inClan) warnings.push('father-not-found');
    }

    return {
      index: row.index,
      line: row.line,
      hoTen: row.hoTen,
      namSinh: row.namSinh,
      classification,
      candidates,
      warnings,
    };
  });

  return ok({ rows: previewRows });
}

// ── Commit ───────────────────────────────────────────────────────────────────

type ResolvedRef = { kind: 'row'; index: number } | { kind: 'person'; personId: string };

function mapGender(g: SeedGender | null): NewPersonInput['gender'] {
  if (g === 'nam') return 'male';
  if (g === 'nu') return 'female';
  if (g === 'khac') return 'other';
  return undefined;
}

export async function commitSeedOp(
  tx: Tx,
  viewer: ViewerContext,
  args: { rows: SeedRow[]; decisions: SeedDecisions },
): Promise<Result<SeedCommitResult>> {
  const gate = gateApprover(viewer);
  if (!gate.ok) return gate;
  const ctx = gate.value;

  const { rows, decisions } = args;
  if (rows.length === 0) return err('invalid', 'no rows to import');

  // ── Validate everything BEFORE the first write ──
  for (const key of Object.keys(decisions)) {
    const index = Number(key);
    if (!Number.isInteger(index) || index < 0 || index >= rows.length)
      return err('invalid', `decision for unknown row index '${key}'`);
  }
  const decisionOf = (index: number): SeedDecision => decisions[index] ?? { action: 'create' };

  for (const row of rows) {
    const decision = decisionOf(row.index);
    if (decision.action !== 'link') continue;
    const target = await loadPerson(tx, decision.personId);
    if (!target) return err('not-found', `line ${row.line}: linked person not found in this clan`);
    if (target.mergedInto) return err('conflict', `line ${row.line}: linked person was merged into another person`);
  }

  const active = rows.filter((r) => decisionOf(r.index).action !== 'skip');
  const activeByFolded = new Map<string, SeedRow[]>();
  for (const row of active) {
    const folded = chuanHoa(row.hoTen);
    const list = activeByFolded.get(folded) ?? [];
    list.push(row);
    activeByFolded.set(folded, list);
  }

  const clanMatches = await loadClanCandidates(tx, [
    ...active.filter((r) => r.tenCha).map((r) => chuanHoa(r.tenCha!)),
    ...active.filter((r) => r.tenVoChong).map((r) => chuanHoa(r.tenVoChong!)),
  ]);

  /**
   * A name resolves to the FIRST other active file row with that folded name, else to the
   * clan person carrying it — but only when the clan match is unambiguous. Ambiguity or
   * absence resolves to null: the row imports without the edge and starts a fragment
   * (FR-63) — a missing link is repairable, a wrong one corrupts a whole branch.
   */
  const resolveByName = (folded: string, selfIndex: number): ResolvedRef | null => {
    const fileMatch = (activeByFolded.get(folded) ?? []).find((r) => r.index !== selfIndex);
    if (fileMatch) return { kind: 'row', index: fileMatch.index };
    const clanMatch = clanMatches.get(folded) ?? [];
    if (clanMatch.length === 1) return { kind: 'person', personId: clanMatch[0]!.personId };
    return null;
  };

  const fatherOf = new Map<number, ResolvedRef>();
  for (const row of active) {
    if (!row.tenCha) continue;
    const ref = resolveByName(chuanHoa(row.tenCha), row.index);
    if (ref) fatherOf.set(row.index, ref);
  }

  // ── Topological order over in-file father edges: parents before children (Kahn) ──
  const indegree = new Map<number, number>(active.map((r) => [r.index, 0]));
  const childrenOf = new Map<number, number[]>();
  for (const [child, ref] of fatherOf) {
    if (ref.kind !== 'row') continue;
    indegree.set(child, (indegree.get(child) ?? 0) + 1);
    const list = childrenOf.get(ref.index) ?? [];
    list.push(child);
    childrenOf.set(ref.index, list);
  }
  const queue = active.filter((r) => indegree.get(r.index) === 0).map((r) => r.index);
  const order: number[] = [];
  while (queue.length > 0) {
    const index = queue.shift()!;
    order.push(index);
    for (const child of childrenOf.get(index) ?? []) {
      const left = indegree.get(child)! - 1;
      indegree.set(child, left);
      if (left === 0) queue.push(child);
    }
  }
  if (order.length !== active.length) {
    const stuck = active.filter((r) => !order.includes(r.index)).map((r) => `line ${r.line}`);
    return err('invalid', `ten_cha forms a cycle inside the file (${stuck.join(', ')})`);
  }

  // ── Writes — everything tentative (AD-9), everything sourced 'seed-import' ──
  const seedSource: SourceSpec = {
    kind: 'seed-import',
    description: `Nạp khung từ tệp CSV (${rows.length} dòng)`,
  };
  /** One shared source row for the edges and unions this import wires itself. */
  const sharedSourceId = await createSourceOp(tx, ctx, seedSource);

  /** An err from a sub-op after writes began means validation above missed a case — a bug. */
  const must = <T>(result: Result<T>, what: string): T => {
    if (!result.ok) throw new Error(`commitSeedOp invariant broken (${what}): ${result.error.code} — ${result.error.message}`);
    return result.value;
  };

  const personIdOfRow = new Map<number, string>();
  const createdPersonIds: string[] = [];
  let created = 0;
  let linked = 0;

  const wireParentEdge = async (childId: string, parentId: string, line: number) => {
    if (childId === parentId) return; // linked row resolved its own father-name to itself
    const existing = await tx
      .select({ id: assertion.id })
      .from(assertion)
      .where(
        and(
          eq(assertion.subjectPersonId, childId),
          eq(assertion.kind, 'parent-child'),
          eq(assertion.objectPersonId, parentId),
          eq(assertion.status, 'live'),
        ),
      )
      .limit(1);
    if (existing[0]) return; // the clan already knows this edge — do not duplicate it
    must(
      await addAssertionOp(tx, viewer, {
        personId: childId,
        spec: { kind: 'parent-child', parentId },
        source: { kind: 'existing', sourceId: sharedSourceId },
      }),
      `parent-child edge at line ${line}`,
    );
  };

  for (const index of order) {
    const row = rows[index]!;
    const decision = decisionOf(index);
    const fatherRef = fatherOf.get(index);
    const fatherId =
      fatherRef?.kind === 'row' ? personIdOfRow.get(fatherRef.index) : fatherRef?.personId;
    if (fatherRef?.kind === 'row' && !fatherId)
      throw new Error(`commitSeedOp invariant broken: father row ${fatherRef.index} not yet materialised`);

    if (decision.action === 'link') {
      personIdOfRow.set(index, decision.personId);
      linked += 1;
      if (fatherId) await wireParentEdge(decision.personId, fatherId, row.line);
      continue;
    }

    // 'create' — through createPersonOp so person row, name/gender/birth/death/parent-child
    // assertions, projection, revisions, and the AD-15 notification all happen in one path.
    const noteParts = [
      row.ghiChu,
      // AD-5: the branch label is preserved as plain text on the record, never as a code.
      row.chi ? `Chi (theo tệp nạp khung): ${row.chi}` : null,
    ].filter((p): p is string => !!p);
    const result = must(
      await createPersonOp(tx, viewer, {
        fullName: row.hoTen,
        gender: mapGender(row.gioiTinh),
        birth: row.namSinh !== null ? { date: `${row.namSinh}-01-01`, precision: 'year' } : undefined,
        death: row.namMat !== null ? { date: `${row.namMat}-01-01`, precision: 'year' } : undefined,
        parentId: fatherId,
        note: noteParts.length > 0 ? noteParts.join('\n') : undefined,
        source: seedSource,
      }),
      `create person at line ${row.line}`,
    );
    personIdOfRow.set(index, result.personId);
    createdPersonIds.push(result.personId);
    created += 1;
  }

  // ── Unions: ten_vo_chong pairs where BOTH sides resolved to a person ──
  const wiredPairs = new Set<string>();
  for (const row of active) {
    if (!row.tenVoChong) continue;
    const selfId = personIdOfRow.get(row.index)!;
    const spouseRef = resolveByName(chuanHoa(row.tenVoChong), row.index);
    const spouseId =
      spouseRef?.kind === 'row' ? personIdOfRow.get(spouseRef.index) : spouseRef?.personId;
    if (!spouseId || spouseId === selfId) continue;

    const pairKey = [selfId, spouseId].sort().join('|');
    if (wiredPairs.has(pairKey)) continue; // both rows naming each other = ONE union
    wiredPairs.add(pairKey);

    const memberships = await tx
      .select({ unionId: assertion.unionId, subjectPersonId: assertion.subjectPersonId })
      .from(assertion)
      .where(
        and(
          eq(assertion.kind, 'union-partner'),
          eq(assertion.status, 'live'),
          inArray(assertion.subjectPersonId, [selfId, spouseId]),
        ),
      );
    const selfUnions = new Set(memberships.filter((m) => m.subjectPersonId === selfId).map((m) => m.unionId));
    const alreadyJoined = memberships.some(
      (m) => m.subjectPersonId === spouseId && m.unionId !== null && selfUnions.has(m.unionId),
    );
    if (alreadyJoined) continue;

    must(
      await addAssertionOp(tx, viewer, {
        personId: selfId,
        spec: { kind: 'union-partner', partnerId: spouseId },
        source: { kind: 'existing', sourceId: sharedSourceId },
      }),
      `union at line ${row.line}`,
    );
  }

  const skipped = rows.length - active.length;
  return ok({ created, linked, skipped, createdPersonIds });
}
