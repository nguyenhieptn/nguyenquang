/**
 * core/audit — nhật ký & tái hiện (story 1-6, FR-39; AD-4, AD-10, AD-21).
 *
 * Adapter surface: NO identity parameters (AD-24). Every entry point resolves the viewer from
 * the session itself, opens the clan transaction, and delegates to ops.ts. Adapters import
 * ONLY this file; other core modules may call ops directly inside their own transaction.
 *
 *  - getPersonHistory(personId)  — the person's full revision trail, Vietnamese one-liners;
 *                                  refused unless the viewer sees the person in FULL (AD-21).
 *  - getTreeAt(at)               — point-in-time reconstruction; admin/branch-head only.
 *  - getRecentAdditions(limit)   — "Vừa vào phả" home box; open to guests, radius-filtered.
 *  - attributionFor(personIds)   — batch "ai ghi, khi nào" for tree node cards (canonical).
 */
import { err, ok, type Result } from '@/core/types';
import { resolveSession, resolveViewer } from '@/core/identity/session';
import { withClanContext } from '@/db';
import * as ops from './ops';

export type { Attribution, HistoryEntry, JournalArgs, JournalEntity, JournalEntry, JournalPage, RecentAddition, RevisionAction, TreeSnapshot } from './ops';

/**
 * All revisions touching one person — person rows, every revision of every assertion about
 * them, and merges where they were winner or loser. Newest first. err('forbidden') unless the
 * viewer's visibility of the person is 'full': the log holds every value ever withdrawn, so
 * partial visibility would turn history into a disclosure channel (AD-21).
 */
export async function getPersonHistory(personId: string): Promise<Result<ops.HistoryEntry[]>> {
  const viewer = await resolveViewer();
  if (!viewer) return err('unauthenticated', 'no session and no clan to view');
  return withClanContext(viewer.clanId, (tx) => ops.getPersonHistory(tx, viewer, personId));
}

/**
 * The tree as it stood at `at`, replayed from the revision log (AD-4): names, tiers, and
 * parent-child edges. Requires a signed-in admin or branch-head — past states are treated as
 * privileged wholesale rather than re-filtered per viewer (AD-21; see ops.ts header).
 */
export async function getTreeAt(at: Date): Promise<Result<ops.TreeSnapshot>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'point-in-time reconstruction requires signing in');
  return withClanContext(session.clanId, (tx) => ops.getTreeAt(tx, session, at));
}

/**
 * "Vừa vào phả" (FR-39): latest person-create revisions with current projected names, newest
 * first. Exposed to guests — each entry passes the privacy radius; an anonymous subject keeps
 * its slot under ANONYMOUS_LABEL. Before any clan exists the box is simply empty.
 */
export async function getRecentAdditions(limit = 10): Promise<Result<ops.RecentAddition[]>> {
  const viewer = await resolveViewer();
  if (!viewer) return ok([]);
  return withClanContext(viewer.clanId, (tx) => ops.getRecentAdditions(tx, viewer, limit));
}

/**
 * Batch attribution {personId → {byName, at}} from each person's EARLIEST 'create' revision —
 * the canonical helper behind tree-card lines like "cháu Khánh ghi · hôm nay". Ids without a
 * create revision are absent from the result.
 */
export async function attributionFor(
  personIds: string[],
): Promise<Result<Record<string, ops.Attribution>>> {
  const viewer = await resolveViewer();
  if (!viewer) return ok({});
  return withClanContext(viewer.clanId, (tx) => ops.attributionFor(tx, viewer, personIds));
}

/** Sổ nhật ký chung (story 7-4, FR-39) — quyền duyệt; cổng nằm trong ops. */
export async function listJournal(args: ops.JournalArgs = {}): Promise<Result<ops.JournalPage>> {
  const viewer = await resolveViewer();
  if (!viewer) return err('unauthenticated', 'no session and no clan to view');
  return withClanContext(viewer.clanId, (tx) => ops.listJournalOps(tx, viewer, args));
}
