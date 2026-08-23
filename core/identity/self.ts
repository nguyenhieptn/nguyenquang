/**
 * FR-55 self-service surface — the rights of the living over their own record.
 *
 * Adapter surface (AD-24): no identity parameters; the OWN node is taken from the session,
 * never from the caller — so "own node only" is structural, not a check the adapter could
 * forget. Ops carry the AD-19-exception documentation for the two visibility columns.
 */
import { withClanContext } from '@/db';
import { err, type Result } from '@/core/types';
import { resolveSession } from './session';
import {
  getMyNotificationsOp,
  markNotificationSeenOp,
  updateSelfVisibilityOp,
  type NotificationItem,
} from './ops';

export type { NotificationItem } from './ops';

/** Narrow one's own visibility (hiddenFromPublic / refusePrint). Narrows only — AD-13. */
export async function updateSelfVisibility(args: {
  hiddenFromPublic?: boolean;
  refusePrint?: boolean;
}): Promise<Result<{ personId: string }>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'Cần đăng nhập.');
  if (!session.personId) return err('unattached', 'Chưa gắn với ai trong phả nên chưa có gì để chỉnh.');
  const personId = session.personId;
  return withClanContext(session.clanId, (tx) =>
    updateSelfVisibilityOp(tx, session, { personId, ...args }),
  );
}

/** What the record has told me (AD-15 events owed to my node). */
export async function getMyNotifications(): Promise<Result<NotificationItem[]>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'Cần đăng nhập.');
  return withClanContext(session.clanId, (tx) => getMyNotificationsOp(tx, session));
}

/** Mark one of my notifications seen. Idempotent. */
export async function markNotificationSeen(notificationId: string): Promise<Result<{ seenAt: Date }>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'Cần đăng nhập.');
  return withClanContext(session.clanId, (tx) => markNotificationSeenOp(tx, session, { notificationId }));
}
