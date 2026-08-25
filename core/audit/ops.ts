/**
 * core/audit — internal ops (story 1-6, FR-39; AD-4, AD-10, AD-21).
 *
 * Every function takes (tx, ctx, args) per the core layering rule — the adapter surface in
 * index.ts resolves identity itself (AD-24) and opens the clan transaction. Other core modules
 * may call these ops inside their own transaction; adapters may not import this file.
 *
 * What this module is, in one line: the READ side of AD-10's revision log.
 *
 *  - getPersonHistory   — every revision touching one person, as Vietnamese one-liners.
 *  - getTreeAt          — point-in-time reconstruction by replaying revisions (AD-4 proof:
 *                         a value removed from live data is still reconstructible).
 *  - getRecentAdditions — the "Vừa vào phả" home box, privacy-filtered down to guests.
 *  - attributionFor     — batch "ai ghi, khi nào" from the earliest person-create revision;
 *                         the canonical helper for core/tree's node-card attribution.
 *
 * AD-21 — history is a disclosure channel. The revision log permanently holds every value ever
 * withdrawn, so:
 *  - getPersonHistory demands FULL visibility of the person and refuses otherwise;
 *  - getTreeAt is restricted to admin/branch-head outright. Filtering PAST states per viewer
 *    would mean recomputing the privacy radius against every historical edge set — a rabbit
 *    hole; the spine allows treating history as privileged, and this module does.
 *
 * Revision image shapes this module reads (as written by core/person + core/assertion ops):
 *  - person 'create'          after = { id, clanId }            — NO name; names arrive as
 *                                                                 name-assertion revisions.
 *  - assertion 'create'       after = the FULL assertion row    (subjectPersonId, kind, value…)
 *  - assertion 'remove'       before = the FULL assertion row   (AD-4)
 *  - assertion 'promote'      images carry tier/promoted* only  — no subject, no kind
 *  - assertion 'hide'/'restore' images carry status only        — no subject, no kind
 *  - merge 'merge'/'unmerge'  { winnerId, loserId, repointed }  (AD-3; story 1-7)
 * Hence getPersonHistory's two-step fetch: images give the person's assertion ids, then ALL
 * revisions of those assertions (promote/hide/restore included) are pulled by entityId.
 *
 * Privacy distance delegates to core/tree's ops (loadTreeData + bfsDistances) — the canonical
 * AD-13 graph: live parent-child + union-partner edges of ANY tier (a fresh self-declared
 * family's edges are all tentative), with tombstone redirects. Cross-module ops calls inside
 * one transaction are the sanctioned core layering (build contract).
 */
import { and, asc, desc, eq, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import type { Tx } from '@/db';
import { assertion, person, revision, type Tier } from '@/db/schema';
import { err, isUuid, ok, type Result } from '@/core/types';
import { ANONYMOUS_LABEL, PRIVACY_RADIUS, visibilityFor } from '@/core/identity/privacy';
import type { ViewerContext } from '@/core/identity/session';
import { lookupAccountNames } from '@/core/assertion/ops';
import { bfsDistances, loadTreeData } from '@/core/tree/ops';

type RevisionRow = typeof revision.$inferSelect;
export type RevisionAction = RevisionRow['action'];

export type HistoryEntry = {
  at: string; // ISO timestamp
  byName: string; // resolved account display name; 'không rõ' when unresolvable
  action: RevisionAction;
  summary: string; // human Vietnamese one-liner
};

export type TreeSnapshot = {
  persons: { personId: string; fullName: string; tier: Tier }[];
  parentChildEdges: { childId: string; parentId: string }[];
};

export type RecentAddition = { personId: string; fullName: string; byName: string; at: string };

export type Attribution = { byName: string; at: string };

// ── shared helpers ────────────────────────────────────────────────────────────

type Img = Record<string, unknown>;
const asImg = (v: unknown): Img | null =>
  v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Img) : null;
const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);

const UNKNOWN_BY = 'không rõ';

const CONFIDENCE_LABEL: Record<string, string> = {
  'chac-chan': 'chắc chắn',
  'theo-loi-ke': 'theo lời kể',
  'ton-nghi': 'tồn nghi',
};

function formatVN(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return d && m && y ? `${d}/${m}/${y}` : isoDate;
}

/** "năm sinh 1941" / "ngày mất 12/03/2001" / "năm sinh khoảng 1941" / "năm sinh chưa rõ". */
function describeDate(loai: string, value: Img | null): string {
  const date = str(value?.date);
  const year = date ? date.slice(0, 4) : null;
  const precision = str(value?.precision);
  if (precision === 'exact' && date) return `ngày ${loai} ${formatVN(date)}`;
  if (precision === 'approximate') return year ? `năm ${loai} khoảng ${year}` : `năm ${loai} ước chừng`;
  return year ? `năm ${loai} ${year}` : `năm ${loai} chưa rõ`;
}

function describeAssertion(image: Img | null): string {
  const kind = str(image?.kind);
  const value = asImg(image?.value);
  switch (kind) {
    case 'name': {
      const n = str(value?.fullName);
      return n ? `tên "${n}"` : 'tên';
    }
    case 'gender': {
      const g = str(value?.gender);
      return `giới tính ${g === 'male' ? 'nam' : g === 'female' ? 'nữ' : 'khác'}`;
    }
    case 'birth':
      return describeDate('sinh', value);
    case 'death':
      return describeDate('mất', value);
    case 'parent-child': {
      const rel = str(value?.relation);
      const suffix = rel === 'adopted' ? ' (con nuôi)' : rel === 'heir' ? ' (thừa tự)' : '';
      return `quan hệ cha mẹ – con${suffix}`;
    }
    case 'union-partner':
      return 'quan hệ vợ chồng';
    case 'note':
      return 'ghi chú';
    case 'place': {
      const vai = str(value?.role);
      return vai === 'que-quan'
        ? 'quê quán'
        : vai === 'tru-quan'
          ? 'trú quán'
          : vai === 'an-tang'
            ? 'nơi an táng'
            : 'nơi chốn';
    }
    default:
      return 'thông tin';
  }
}

/**
 * Human Vietnamese one-liner for one revision row. UI strings live here by story mandate.
 * `assertionInfo` enriches rows whose own images carry no kind/value (promote/hide/restore
 * images are status-only) — it is the FULL row image captured at create/remove time.
 */
function summarize(rev: RevisionRow, assertionInfo?: Img | null): string {
  if (rev.entity === 'person') {
    const name = str(asImg(rev.after)?.fullName);
    switch (rev.action) {
      case 'create':
        return name ? `thêm "${name}" vào phả` : 'thêm vào phả';
      case 'update':
        return 'cập nhật thông tin';
      case 'remove':
        return 'gỡ khỏi phả';
      default:
        break;
    }
  }
  if (rev.entity === 'assertion') {
    const own = asImg(rev.after) ?? asImg(rev.before);
    const image = own && str(own.kind) !== null ? own : (assertionInfo ?? own);
    const desc = describeAssertion(image);
    const conf = str(image?.confidence);
    const confSuffix = conf && conf !== 'chac-chan' ? ` (${CONFIDENCE_LABEL[conf] ?? conf})` : '';
    switch (rev.action) {
      case 'create':
        return `thêm ${desc}${confSuffix}`;
      case 'update':
        return `sửa ${desc}${confSuffix}`;
      case 'promote':
        return `duyệt lên Tầng chính thức — ${desc}`;
      case 'hide':
        return `ẩn theo báo cáo — ${desc}`;
      case 'restore':
        return `khôi phục hiển thị — ${desc}`;
      case 'remove':
        return `gỡ ${desc} (còn giữ trong nhật ký)`;
      default:
        break;
    }
  }
  if (rev.entity === 'merge') {
    return rev.action === 'unmerge' ? 'tách lại bản ghi đã hợp nhất' : 'hợp nhất bản ghi trùng';
  }
  return `${rev.action} ${rev.entity}`;
}

// ── privacy radius (delegated to core/tree ops — the canonical AD-13 graph) ──

/**
 * Distances from the viewer's node, capped at PRIVACY_RADIUS, over core/tree's adjacency
 * (live blood + union edges, tombstones redirected). `get` returns null when unknown or
 * beyond the radius — exactly what visibilityFor expects.
 */
async function viewerDistances(
  tx: Tx,
  viewerPersonId: string,
): Promise<{ get(personId: string): number | null }> {
  const data = await loadTreeData(tx);
  const from = data.redirect(viewerPersonId);
  const dist = from ? bfsDistances(data, from, PRIVACY_RADIUS) : new Map<string, number>();
  return {
    get(personId: string): number | null {
      const to = data.redirect(personId);
      return to !== null ? (dist.get(to) ?? null) : null;
    },
  };
}

// ── getPersonHistory ──────────────────────────────────────────────────────────

/**
 * All revisions touching one person, newest first: entity 'person' rows for them, every
 * revision of every assertion about them (found via full-row images and the live assertion
 * table — see the image-shape table in the file header), and 'merge' rows where they are
 * winner or loser.
 *
 * AD-21: requires FULL visibility of the person — anything less and the log would leak what
 * the person view withholds (withdrawn values included).
 */
export async function getPersonHistory(
  tx: Tx,
  ctx: ViewerContext,
  personId: string,
): Promise<Result<HistoryEntry[]>> {
  // Route params arrive as raw strings: a non-uuid would make Postgres throw 22P02 instead of
  // returning nothing. An id nobody holds and an id nobody could hold read the same here.
  if (!isUuid(personId)) return err('not-found', 'person not found');

  const [subject] = await tx
    .select({
      isLiving: person.isLiving,
      birthDate: person.birthDate,
      hiddenFromPublic: person.hiddenFromPublic,
    })
    .from(person)
    .where(eq(person.id, personId));
  if (!subject) return err('not-found', 'person not found');

  let distance: number | null = null;
  const privileged = ctx.role === 'admin' || ctx.role === 'branch-head';
  if (subject.isLiving && !privileged && ctx.personId !== null && ctx.personId !== personId) {
    distance = (await viewerDistances(tx, ctx.personId)).get(personId);
  }
  const vis = visibilityFor(
    { role: ctx.role, personId: ctx.personId },
    { personId, ...subject },
    distance,
  );
  if (vis !== 'full') {
    return err('forbidden', 'history requires full visibility of the person (AD-21)');
  }

  // Step 1 — rows that name the person directly (person rows, full-image assertion rows, merges).
  const direct = await tx
    .select()
    .from(revision)
    .where(
      or(
        and(eq(revision.entity, 'person'), eq(revision.entityId, personId)),
        and(
          eq(revision.entity, 'assertion'),
          or(
            sql`${revision.after} ->> 'subjectPersonId' = ${personId}`,
            sql`${revision.before} ->> 'subjectPersonId' = ${personId}`,
          ),
        ),
        and(
          eq(revision.entity, 'merge'),
          or(
            sql`${revision.after} ->> 'winnerId' = ${personId}`,
            sql`${revision.after} ->> 'loserId' = ${personId}`,
            sql`${revision.before} ->> 'winnerId' = ${personId}`,
            sql`${revision.before} ->> 'loserId' = ${personId}`,
          ),
        ),
      ),
    );

  // Step 2 — promote/hide/restore images carry no subject: pull the full lifecycle of every
  // assertion id known to be about this person (from step-1 images + the live table).
  const assertionIds = new Set<string>();
  for (const r of direct) if (r.entity === 'assertion') assertionIds.add(r.entityId);
  const liveRows = await tx
    .select({ id: assertion.id })
    .from(assertion)
    .where(eq(assertion.subjectPersonId, personId));
  for (const r of liveRows) assertionIds.add(r.id);

  const lifecycle =
    assertionIds.size > 0
      ? await tx
          .select()
          .from(revision)
          .where(and(eq(revision.entity, 'assertion'), inArray(revision.entityId, [...assertionIds])))
      : [];

  const byId = new Map<string, RevisionRow>();
  for (const r of [...direct, ...lifecycle]) byId.set(r.id, r);
  const rows = [...byId.values()].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id),
  );

  // Full-row images (create/remove) describe the status-only revisions of the same assertion.
  const infoByAssertion = new Map<string, Img>();
  for (const r of rows) {
    if (r.entity !== 'assertion' || infoByAssertion.has(r.entityId)) continue;
    for (const image of [asImg(r.after), asImg(r.before)]) {
      if (image && str(image.kind) !== null) {
        infoByAssertion.set(r.entityId, image);
        break;
      }
    }
  }

  const names = await lookupAccountNames(rows.map((r) => r.accountId));
  return ok(
    rows.map((r) => ({
      at: r.createdAt.toISOString(),
      byName: names.get(r.accountId) ?? UNKNOWN_BY,
      action: r.action,
      summary: summarize(r, infoByAssertion.get(r.entityId)),
    })),
  );
}

// ── getTreeAt ─────────────────────────────────────────────────────────────────

type ReplayAssertion = {
  kind: string;
  subjectPersonId: string | null;
  objectPersonId: string | null;
  tier: Tier;
  status: string;
  value: Img | null;
};

/**
 * Point-in-time reconstruction: replay every revision with createdAt <= at, starting from an
 * empty world. Fidelity is deliberately limited to what the story needs — names, tiers,
 * parent-child edges. Restricted to admin/branch-head (see file header).
 *
 * Names: person-create images carry no name, so the replay projects the leading live name
 * assertion onto the person the same way core/assertion's projection does (official wins,
 * else first live name).
 *
 * Merge/unmerge replay follows the AD-3 record shape ({ winnerId, loserId, repointed }) and is
 * defensive about fields story 1-7 has not fixed yet; unknown shapes degrade to no-ops rather
 * than corrupting the replay.
 */
export async function getTreeAt(tx: Tx, ctx: ViewerContext, at: Date): Promise<Result<TreeSnapshot>> {
  if (ctx.role !== 'admin' && ctx.role !== 'branch-head') {
    return err('forbidden', 'point-in-time reconstruction is limited to admin and branch-head (AD-21)');
  }

  const rows = await tx
    .select()
    .from(revision)
    .where(lte(revision.createdAt, at))
    .orderBy(asc(revision.createdAt), asc(revision.id));

  const persons = new Map<string, { fullName: string; tier: Tier }>();
  const live = new Map<string, ReplayAssertion>();

  /** Project a live name assertion onto the replayed person (official wins; else fill empty). */
  const projectName = (a: ReplayAssertion) => {
    if (a.kind !== 'name' || a.status !== 'live' || !a.subjectPersonId) return;
    const p = persons.get(a.subjectPersonId);
    if (!p) return;
    const fullName = str(a.value?.fullName);
    if (fullName === null) return;
    if (a.tier === 'official') {
      p.fullName = fullName;
      p.tier = 'official';
    } else if (p.fullName === '') {
      p.fullName = fullName;
      p.tier = a.tier;
    }
  };

  for (const rev of rows) {
    if (rev.entity === 'person') {
      if (rev.action === 'create') {
        const a = asImg(rev.after);
        persons.set(rev.entityId, {
          fullName: str(a?.fullName) ?? '',
          tier: (str(a?.nameTier) ?? 'tentative') as Tier,
        });
      } else if (rev.action === 'update') {
        const p = persons.get(rev.entityId);
        const a = asImg(rev.after);
        if (p && a) {
          const fullName = str(a.fullName);
          if (fullName !== null) p.fullName = fullName;
          const tier = str(a.nameTier);
          if (tier !== null) p.tier = tier as Tier;
        }
      } else if (rev.action === 'remove') {
        persons.delete(rev.entityId);
      }
    } else if (rev.entity === 'assertion') {
      switch (rev.action) {
        case 'create': {
          const a = asImg(rev.after);
          if (!a) break;
          const created: ReplayAssertion = {
            kind: str(a.kind) ?? '',
            subjectPersonId: str(a.subjectPersonId),
            objectPersonId: str(a.objectPersonId),
            tier: (str(a.tier) ?? 'tentative') as Tier,
            status: str(a.status) ?? 'live',
            value: asImg(a.value),
          };
          live.set(rev.entityId, created);
          projectName(created);
          break;
        }
        case 'update': {
          const a = asImg(rev.after);
          const existing = live.get(rev.entityId);
          if (!a || !existing) break;
          existing.value = asImg(a.value) ?? existing.value;
          existing.tier = (str(a.tier) ?? existing.tier) as Tier;
          existing.status = str(a.status) ?? existing.status;
          projectName(existing);
          break;
        }
        case 'promote': {
          const existing = live.get(rev.entityId);
          if (!existing) break;
          existing.tier = 'official';
          projectName(existing);
          break;
        }
        case 'hide': {
          const existing = live.get(rev.entityId);
          if (existing) existing.status = 'hidden';
          break;
        }
        case 'restore': {
          const existing = live.get(rev.entityId);
          if (existing) existing.status = 'live';
          break;
        }
        case 'remove':
          live.delete(rev.entityId); // AD-4: gone from live, still here in the log — replayable
          break;
        default:
          break;
      }
    } else if (rev.entity === 'merge') {
      const m = asImg(rev.after) ?? asImg(rev.before);
      const winnerId = str(m?.winnerId);
      const loserId = str(m?.loserId);
      if (!winnerId || !loserId) continue;
      if (rev.action === 'merge') {
        persons.delete(loserId); // tombstoned at this instant
        for (const a of live.values()) {
          if (a.subjectPersonId === loserId) a.subjectPersonId = winnerId;
          if (a.objectPersonId === loserId) a.objectPersonId = winnerId;
        }
      } else if (rev.action === 'unmerge') {
        const loserImg = asImg(m?.loser);
        if (loserImg) {
          persons.set(loserId, {
            fullName: str(loserImg.fullName) ?? '',
            tier: (str(loserImg.nameTier) ?? 'tentative') as Tier,
          });
        }
        const repointed = Array.isArray(m?.repointed) ? m.repointed : [];
        for (const entry of repointed) {
          const r = asImg(entry);
          const assertionId = str(r?.assertionId);
          const field = str(r?.field);
          const a = assertionId ? live.get(assertionId) : undefined;
          if (a && (field === 'subjectPersonId' || field === 'objectPersonId')) a[field] = loserId;
        }
      }
    }
  }

  const parentChildEdges: TreeSnapshot['parentChildEdges'] = [];
  for (const a of live.values()) {
    if (a.kind !== 'parent-child' || a.status !== 'live') continue;
    if (!a.subjectPersonId || !a.objectPersonId) continue;
    if (!persons.has(a.subjectPersonId) || !persons.has(a.objectPersonId)) continue;
    parentChildEdges.push({ childId: a.subjectPersonId, parentId: a.objectPersonId });
  }

  return ok({
    persons: [...persons.entries()].map(([personId, p]) => ({ personId, ...p })),
    parentChildEdges,
  });
}

// ── getRecentAdditions ────────────────────────────────────────────────────────

/**
 * "Vừa vào phả" (FR-39, home box): person-create revisions, newest first, with the CURRENT
 * projected name (read from `person`, not from images — create images carry no name). Open to
 * guests — privacy radius applied per entry; 'anonymous' keeps the entry but replaces the name
 * with ANONYMOUS_LABEL (the link stays, the person does not leak). Tombstoned persons
 * (mergedInto set) are skipped: their current name lives on the winner.
 */
export async function getRecentAdditions(
  tx: Tx,
  ctx: ViewerContext,
  limit = 10,
): Promise<Result<RecentAddition[]>> {
  const n = Math.max(1, Math.min(50, Math.floor(limit)));
  const rows = await tx
    .select({
      personId: revision.entityId,
      accountId: revision.accountId,
      at: revision.createdAt,
      fullName: person.fullName,
      isLiving: person.isLiving,
      birthDate: person.birthDate,
      hiddenFromPublic: person.hiddenFromPublic,
    })
    .from(revision)
    .innerJoin(person, eq(person.id, revision.entityId))
    .where(and(eq(revision.entity, 'person'), eq(revision.action, 'create'), isNull(person.mergedInto)))
    .orderBy(desc(revision.createdAt), desc(revision.id))
    .limit(n);

  const privileged = ctx.role === 'admin' || ctx.role === 'branch-head';
  const viewerNode = ctx.personId;
  const dist =
    !privileged && viewerNode !== null && rows.some((r) => r.isLiving)
      ? await viewerDistances(tx, viewerNode)
      : null;
  const names = await lookupAccountNames(rows.map((r) => r.accountId));

  return ok(
    rows.map((r) => {
      const vis = visibilityFor(
        { role: ctx.role, personId: viewerNode },
        {
          personId: r.personId,
          isLiving: r.isLiving,
          birthDate: r.birthDate,
          hiddenFromPublic: r.hiddenFromPublic,
        },
        dist ? dist.get(r.personId) : null,
      );
      return {
        personId: r.personId,
        fullName: vis === 'anonymous' ? ANONYMOUS_LABEL : r.fullName,
        byName: names.get(r.accountId) ?? UNKNOWN_BY,
        at: r.at.toISOString(),
      };
    }),
  );
}

// ── attributionFor ────────────────────────────────────────────────────────────

/**
 * Batch attribution from the EARLIEST person-create revision — "cháu Khánh ghi · hôm nay" on
 * tree cards. THE canonical helper (core/tree may hold an inline copy until it delegates here).
 *
 * No extra privacy filtering: the caller passes ids it has already radius-filtered, and the
 * payload is only contributor name + timestamp — clan-public by design. Missing ids (never
 * created, or created before the log existed) are simply absent from the result.
 */
export async function attributionFor(
  tx: Tx,
  _ctx: ViewerContext,
  personIds: string[],
): Promise<Result<Record<string, Attribution>>> {
  // Non-uuid ids are dropped rather than refused: this is a batch helper, and one bad id in a
  // caller's list must not cost the whole card row its attribution (nor throw 22P02).
  const ids = personIds.filter(isUuid);
  if (ids.length === 0) return ok({});
  const rows = await tx
    .select({ personId: revision.entityId, accountId: revision.accountId, at: revision.createdAt })
    .from(revision)
    .where(
      and(eq(revision.entity, 'person'), eq(revision.action, 'create'), inArray(revision.entityId, ids)),
    )
    .orderBy(asc(revision.createdAt), asc(revision.id));

  const names = await lookupAccountNames(rows.map((r) => r.accountId));
  const out: Record<string, Attribution> = {};
  for (const r of rows) {
    if (!(r.personId in out)) {
      out[r.personId] = { byName: names.get(r.accountId) ?? UNKNOWN_BY, at: r.at.toISOString() };
    }
  }
  return ok(out);
}
