/**
 * core/merge — hợp nhất mảnh (story 1-7). FR-48; AD-3, AD-6, AD-10, AD-16, AD-22.
 *
 * Adapter surface. AD-24: NO identity parameters — every entry point resolves the session
 * itself, then opens withClanContext. Internal logic lives in ./ops.ts (core-internal only).
 *
 * Lifecycle: any attached member may PROPOSE a merge; executing, rejecting, and unmerging
 * require the approval right (admin | branch-head — AD-22). Execution runs as ONE transaction
 * that repoints every reference loser → winner and records the complete repoint list in the
 * merge revision (AD-3) — which is exactly what makes unmerge possible.
 */
import { resolveSession, resolveViewer } from '@/core/identity/session';
import { err, type Result } from '@/core/types';
import { withClanContext } from '@/db';
import {
  executeMergeOp,
  proposeMergeOp,
  rejectProposalOp,
  resolveAliasOp,
  suggestDuplicatesOp,
  unmergeOp,
  type DuplicateCandidate,
  type DuplicateEvidence,
  type ExecuteMergeOutcome,
} from './ops';

export type {
  DuplicateCandidate,
  DuplicateEvidence,
  DuplicatePerson,
  ExecuteMergeOutcome,
  RepointEntry,
} from './ops';
export { resolveAliasOp } from './ops';

/**
 * Duplicate-candidate pairs for the bàn duyệt surface: same folded name or trigram-similar
 * (AD-16), birth years within 2 when both known, with evidence. Admin | branch-head only.
 */
export async function suggestDuplicates(): Promise<Result<DuplicateCandidate[]>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'sign-in required');
  return withClanContext(session.clanId, (tx) => suggestDuplicatesOp(tx, session));
}

/** Open a merge proposal (never an action — AD-22). Any attached member. */
export async function proposeMerge(
  winnerId: string,
  loserId: string,
  reason: string,
): Promise<Result<{ proposalId: string; evidence: DuplicateEvidence }>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'sign-in required');
  return withClanContext(session.clanId, (tx) =>
    proposeMergeOp(tx, session, { winnerId, loserId, reason }),
  );
}

/** Reject an open proposal. Admin | branch-head. */
export async function rejectProposal(proposalId: string, note: string): Promise<Result<void>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'sign-in required');
  return withClanContext(session.clanId, (tx) => rejectProposalOp(tx, session, { proposalId, note }));
}

/**
 * Execute an open proposal: repoint every reference loser → winner, tombstone the loser,
 * record the complete repoint list in the merge revision (AD-3). Admin | branch-head.
 */
export async function executeMerge(proposalId: string): Promise<Result<ExecuteMergeOutcome>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'sign-in required');
  return withClanContext(session.clanId, (tx) => executeMergeOp(tx, session, { proposalId }));
}

/** Reverse an executed merge exactly, from its recorded repoint list. Admin | branch-head. */
export async function unmerge(
  proposalId: string,
): Promise<Result<{ winnerId: string; loserId: string; reversed: number }>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'sign-in required');
  return withClanContext(session.clanId, (tx) => unmergeOp(tx, session, { proposalId }));
}

/** Follow the tombstone chain to the canonical person id (loop-safe). Any viewer. */
export async function resolveAlias(personId: string): Promise<Result<string>> {
  const viewer = await resolveViewer();
  if (!viewer) return err('unauthenticated', 'no session and no clan to view');
  return withClanContext(viewer.clanId, (tx) => resolveAliasOp(tx, personId));
}
