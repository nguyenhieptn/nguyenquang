/**
 * core/person/read-ops — person read surface (gaps flagged by UI stories 2-2/2-7/2-8/2-9).
 *
 * Takes (tx, ctx, args) — never resolves identity itself; that is index.ts's job (AD-24).
 * Reads only: NO mutations, so no revisions originate here (AD-10 n/a).
 *
 * The viewer-distance approach mirrors core/tree/ops (the documented pattern to copy):
 * load the whole clan graph once per call (< 300 people — build contract scale note),
 * BFS the viewer's radius, and pass every card through visibilityFor BEFORE it leaves
 * the core (AD-13/AD-21). Tree ops helpers are imported READ-ONLY.
 */
import { and, asc, eq, inArray } from 'drizzle-orm';
import type { Tx } from '@/db';
import { assertion, revision, source } from '@/db/schema';
import { giaiNoi } from '@/core/place/ops';
import type { AssertionKind, Confidence, Tier } from '@/db/schema';
import {
  ANONYMOUS_LABEL,
  PRIVACY_RADIUS,
  visibilityFor,
  type Visibility,
} from '@/core/identity/privacy';
import type { ViewerContext } from '@/core/identity/session';
import { err, ok, type Result } from '@/core/types';
import {
  bfsDistances,
  computeStructure,
  loadTreeData,
  type RawAttribution,
  type RawPersonCard,
  type Structure,
  type TreeData,
} from '@/core/tree/ops';
import type { PersonAssertion, SourceKind } from './index';

// ── Raw shapes: attribution / authorship carry account ids; index.ts swaps in names ──
// (the "user" table is identity data outside the clan partition — read AFTER the clan tx).

export type RawPersonAssertion = Omit<PersonAssertion, 'createdByName'> & {
  createdByAccountId: string;
};

export type RawPersonProfile = {
  card: RawPersonCard;
  relations: { parents: RawPersonCard[]; children: RawPersonCard[]; partners: RawPersonCard[] };
  visibility: Visibility;
  /** Present ONLY when visibility === 'full' (AD-21 — assertions never leave otherwise). */
  assertions?: RawPersonAssertion[];
  /** Set when the requested id was a tombstone and the winner is returned instead (AD-3). */
  redirectedFrom?: string;
};

// ── Viewer lens + card building (same semantics as core/tree/ops — kept in lockstep) ──

type PersonRow = TreeData['persons'] extends Map<string, infer R> ? R : never;

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

/** FR-39 attribution: earliest 'person'/'create' revision per person (same as tree ops). */
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

// ── Human Vietnamese value text (surface A: no tech words, no pronouns) ──

function ngayVn(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

function eventText(kind: 'birth' | 'death', v: { date?: string; precision?: string }): string {
  const verb = kind === 'birth' ? 'sinh' : 'mất';
  const yearWord = kind === 'birth' ? 'năm sinh' : 'năm mất';
  const year = v.date ? v.date.slice(0, 4) : null;
  switch (v.precision) {
    case 'exact':
      return v.date ? `${verb} ngày ${ngayVn(v.date)}` : `${yearWord} chưa rõ`;
    case 'year':
      return year ? `${yearWord} ${year}` : `${yearWord} chưa rõ`;
    case 'approximate':
      return year ? `${yearWord} ${year} (ước chừng)` : `${yearWord} chưa rõ (ước chừng)`;
    default:
      return `${yearWord} chưa rõ`;
  }
}

const GENDER_VN = { male: 'nam', female: 'nữ', other: 'khác' } as const;
const RELATION_VN = { blood: 'con ruột', adopted: 'con nuôi', heir: 'con thừa tự' } as const;
/** Ba vai của FR-65 §5b. Ba lần táng (nguyên/cải/di) chưa phân loại ở Đợt 2. */
const VAI_NOI = { 'que-quan': 'quê quán', 'tru-quan': 'trú quán', 'an-tang': 'nơi an táng' } as const;

// ── The op ──

export async function getPersonOps(
  tx: Tx,
  ctx: ViewerContext,
  personId: string,
): Promise<Result<RawPersonProfile>> {
  const data = await loadTreeData(tx);
  const pid = data.redirect(personId);
  if (!pid || !data.persons.has(pid)) return err('not-found', 'person not found');

  const s = computeStructure(data);
  const today = new Date();
  const lens = viewerLens(data, ctx);
  const row = data.persons.get(pid)!;
  const visibility = visibilityOf(lens, row, today);

  /** Name as the viewer may see it — anonymity applied (AD-13). undefined = no such person. */
  const displayName = (id: string | null | undefined): string | undefined => {
    if (!id) return undefined;
    const rid = data.redirect(id);
    const r = rid ? data.persons.get(rid) : undefined;
    if (!r) return undefined;
    return visibilityOf(lens, r, today) === 'anonymous' ? ANONYMOUS_LABEL : r.fullName;
  };

  // ── Relations from live parent-child + union-partner edges; tombstones already redirected
  //    by loadTreeData. Anonymous subject ⇒ EMPTY (the page keeps only the placeholder). ──
  const byBirthThenName = (a: string, b: string): number => {
    const ra = data.persons.get(a)!;
    const rb = data.persons.get(b)!;
    const ya = ra.birthDate ? Number(ra.birthDate.slice(0, 4)) : Number.POSITIVE_INFINITY;
    const yb = rb.birthDate ? Number(rb.birthDate.slice(0, 4)) : Number.POSITIVE_INFINITY;
    if (ya !== yb) return ya - yb;
    if (ra.nameFolded !== rb.nameFolded) return ra.nameFolded < rb.nameFolded ? -1 : 1;
    return a < b ? -1 : 1;
  };
  const parentIds =
    visibility === 'anonymous'
      ? []
      : [...new Set((data.parentsOf.get(pid) ?? []).map((e) => e.parentId))].sort(byBirthThenName);
  const childIds =
    visibility === 'anonymous'
      ? []
      : [...new Set((data.childrenOf.get(pid) ?? []).map((e) => e.childId))].sort(byBirthThenName);
  const partnerIds =
    visibility === 'anonymous'
      ? []
      : (data.partnersOf.get(pid) ?? []).filter((p) => data.persons.has(p));

  const cardIds = [...new Set([pid, ...parentIds, ...childIds, ...partnerIds])];
  const attribution = await fetchAttribution(tx, cardIds);
  const card = (id: string) => cardOf(lens, s, data.persons.get(id)!, attribution, today);

  // ── Assertions: ONLY at full visibility, only LIVE rows about the subject (FR-1/FR-2) ──
  let assertions: RawPersonAssertion[] | undefined;
  if (visibility === 'full') {
    const rows = await tx
      .select({
        assertionId: assertion.id,
        kind: assertion.kind,
        value: assertion.value,
        objectPersonId: assertion.objectPersonId,
        unionId: assertion.unionId,
        placeId: assertion.placeId,
        confidence: assertion.confidence,
        tier: assertion.tier,
        status: assertion.status,
        sourceKind: source.kind,
        sourceDescription: source.description,
        toldByPersonId: source.toldByPersonId,
        createdByAccountId: assertion.createdByAccountId,
        createdAt: assertion.createdAt,
      })
      .from(assertion)
      .innerJoin(source, eq(assertion.sourceId, source.id))
      .where(and(eq(assertion.subjectPersonId, pid), eq(assertion.status, 'live')))
      .orderBy(asc(assertion.createdAt), asc(assertion.id));

    /**
     * Tên nơi cho `kind: 'place'` — một truy vấn cho mọi nơi được nhắc tới.
     *
     * LUÔN dựng kèm đơn vị cha: "Quang Trung" một mình không nói được là Định Hoá hay Vũng Tàu, và
     * đó đúng là cái hỏng FR-65 sinh ra để chặn.
     */
    const placeIds = [...new Set(rows.flatMap((r) => (r.placeId ? [r.placeId] : [])))];
    const tenNoi = new Map<string, string>();
    if (placeIds.length > 0) {
      /**
       * Qua `giaiNoi` chứ không đọc thẳng (sửa 25/08 sau code review): AD-3 nói một nơi đã gộp
       * phải đọc ra NƠI THẮNG, y như `person.redirect`. Đọc thẳng `place.id` thì một khẳng định
       * trỏ vào bên thua sẽ mãi hiện cái tên đã bị gộp đi.
       */
      const daGiai = await giaiNoi(tx, placeIds);
      for (const [id, n] of daGiai) tenNoi.set(id, n.nhan);
    }

    // Union memberships for 'vợ/chồng với <tên>' — one query for every union referenced.
    const unionIds = [...new Set(rows.flatMap((r) => (r.unionId ? [r.unionId] : [])))];
    const unionMembers = new Map<string, string[]>();
    if (unionIds.length > 0) {
      const members = await tx
        .select({ unionId: assertion.unionId, subjectPersonId: assertion.subjectPersonId })
        .from(assertion)
        .where(
          and(
            eq(assertion.kind, 'union-partner'),
            eq(assertion.status, 'live'),
            inArray(assertion.unionId, unionIds),
          ),
        );
      for (const m of members) {
        if (!m.unionId) continue;
        const rid = data.redirect(m.subjectPersonId);
        if (!rid || rid === pid) continue;
        const arr = unionMembers.get(m.unionId);
        if (arr) {
          if (!arr.includes(rid)) arr.push(rid);
        } else unionMembers.set(m.unionId, [rid]);
      }
    }

    const valueText = (r: (typeof rows)[number]): string => {
      const v = r.value as Record<string, unknown>;
      switch (r.kind) {
        case 'name':
          return `tên ${typeof v.fullName === 'string' ? v.fullName : row.fullName}`;
        case 'gender': {
          const g = typeof v.gender === 'string' ? v.gender : '';
          return `giới tính ${GENDER_VN[g as keyof typeof GENDER_VN] ?? 'chưa rõ'}`;
        }
        case 'birth':
          return eventText('birth', v as { date?: string; precision?: string });
        case 'death':
          return eventText('death', v as { date?: string; precision?: string });
        case 'parent-child': {
          const rel =
            RELATION_VN[(typeof v.relation === 'string' ? v.relation : '') as keyof typeof RELATION_VN] ??
            'con';
          const parent = displayName(r.objectPersonId) ?? 'một người trong họ';
          return `là ${rel} của ${parent}`;
        }
        case 'union-partner': {
          const names = (r.unionId ? (unionMembers.get(r.unionId) ?? []) : [])
            .map((id) => displayName(id))
            .filter((n): n is string => n !== undefined);
          return names.length > 0
            ? `vợ/chồng với ${names.join(', ')}`
            : 'vợ/chồng (chưa rõ với ai)';
        }
        case 'note':
          return `ghi chú: ${typeof v.text === 'string' ? v.text : ''}`;
        case 'place': {
          // LUÔN kèm đơn vị cha. Thiếu nó thì dòng này vô nghĩa đúng theo lý do FR-65 tồn tại:
          // "Quang Trung" một mình không nói được là Định Hoá hay Vũng Tàu.
          const vai =
            VAI_NOI[(typeof v.role === 'string' ? v.role : '') as keyof typeof VAI_NOI] ?? 'nơi';
          const noi = r.placeId ? (tenNoi.get(r.placeId) ?? 'một nơi chưa rõ') : 'một nơi chưa rõ';
          return `${vai}: ${noi}`;
        }
      }
    };

    assertions = rows.map((r) => ({
      assertionId: r.assertionId,
      kind: r.kind as AssertionKind,
      valueText: valueText(r),
      confidence: r.confidence as Confidence,
      tier: r.tier as Tier,
      status: r.status as 'live' | 'hidden',
      sourceKind: r.sourceKind as SourceKind,
      sourceDescription: r.sourceDescription,
      ...(r.toldByPersonId ? { toldByName: displayName(r.toldByPersonId) } : {}),
      createdByAccountId: r.createdByAccountId,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  return ok({
    card: card(pid),
    relations: {
      parents: parentIds.map(card),
      children: childIds.map(card),
      partners: partnerIds.map(card),
    },
    visibility,
    ...(assertions !== undefined ? { assertions } : {}),
    ...(pid !== personId ? { redirectedFrom: personId } : {}),
  });
}
