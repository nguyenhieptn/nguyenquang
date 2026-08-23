/**
 * Attachment surface — FR-64/AD-8: an account is not a person; this is the vouched act that
 * binds one to a clan node, and the ONLY place write permission and privacy radius come from.
 *
 * Adapter surface (AD-24): no identity parameters. Every entry resolves the session itself,
 * opens the clan context, and delegates to ops.ts.
 */
import { withClanContext } from '@/db';
import { err, type Result } from '@/core/types';
import { resolveSession } from './session';
import {
  approveAttachmentOp,
  detachSelfOp,
  listPendingAttachmentsOp,
  requestAttachmentOp,
  type AttachmentRole,
  type PendingAttachment,
} from './ops';

export type { AttachmentRole, PendingAttachment } from './ops';

/** Claim a node in the tree. Lands 'pending' until an approver vouches (AD-8). */
export async function requestAttachment(personId: string): Promise<Result<{ attachmentId: string }>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'Cần đăng nhập trước khi nhận node.');
  if (session.personId) return err('conflict', 'Tài khoản đã gắn với một người trong phả.');
  return withClanContext(session.clanId, (tx) => requestAttachmentOp(tx, session, { personId }));
}

/** Pending claims awaiting a vouch — admin | branch-head. */
export async function listPendingAttachments(): Promise<Result<PendingAttachment[]>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'Cần đăng nhập.');
  return withClanContext(session.clanId, (tx) => listPendingAttachmentsOp(tx, session));
}

/**
 * Vouch for a pending claim. Branch-head may approve plain members; granting any role above
 * 'member' requires admin.
 */
export async function approveAttachment(
  attachmentId: string,
  role: AttachmentRole = 'member',
): Promise<Result<{ attachmentId: string; role: AttachmentRole }>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'Cần đăng nhập.');
  return withClanContext(session.clanId, (tx) => approveAttachmentOp(tx, session, { attachmentId, role }));
}

/** Undo one's own attachment (pending or active). */
export async function detachSelf(): Promise<Result<{ detached: true }>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'Cần đăng nhập.');
  return withClanContext(session.clanId, (tx) => detachSelfOp(tx, session));
}
