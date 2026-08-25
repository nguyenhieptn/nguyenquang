/**
 * core/identity internal ops — (tx, ctx, args), core-internal + tests only (build contract
 * § layering). The adapter surface (attachment.ts / self.ts, re-exported by index.ts)
 * resolves the session itself (AD-24) and calls these inside withClanContext.
 *
 * Every mutation writes a revision in the SAME transaction (AD-10). Expected failures come
 * back as Result (core/types); only bugs throw.
 */
import { and, desc, eq } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '@/db';
import { attachment, notification, person } from '@/db/schema';
import { writeRevision } from '@/core/revision';
import { err, isUuid, ok, type Result } from '@/core/types';
import type { SessionContext } from './session';

export type AttachmentRole = 'admin' | 'branch-head' | 'member';

export type PendingAttachment = {
  attachmentId: string;
  accountId: string;
  personId: string;
  personName: string;
  requestedAt: Date;
};

export type NotificationItem = {
  id: string;
  kind: 'added-to-tree' | 'record-changed';
  payload: unknown;
  createdAt: Date;
  seenAt: Date | null;
};

/**
 * FR-64/AD-8 — an authenticated account claims a clan node. Lands 'pending' until vouched.
 * Exactly one attachment per (clan, account): an active one blocks, a pending one is
 * REPLACED by the new request (the unique index makes a second row impossible anyway).
 */
export async function requestAttachmentOp(
  tx: Tx,
  ctx: SessionContext,
  args: { personId: string },
): Promise<Result<{ attachmentId: string }>> {
  // `person.id` is a Postgres uuid column: a malformed literal throws 22P02 instead of
  // returning nothing (core/types.isUuid). A bad id is simply an id nobody holds.
  if (!isUuid(args.personId)) return err('not-found', 'Không thấy người này trong phả.');
  const [node] = await tx.select().from(person).where(eq(person.id, args.personId));
  if (!node) return err('not-found', 'Không thấy người này trong phả.');
  if (node.mergedInto) return err('conflict', 'Người này đã được gộp vào một bản ghi khác.');

  const [existing] = await tx
    .select()
    .from(attachment)
    .where(eq(attachment.accountId, ctx.accountId));

  if (existing && existing.status === 'active') {
    return err('conflict', 'Tài khoản đã gắn với một người trong phả.');
  }

  if (existing) {
    /**
     * Hàng cũ không `active` — đang `pending`, hoặc ĐÃ BỊ TỪ CHỐI (story 5-5). Cả hai đều dùng
     * lại chính hàng ấy và đặt về `pending`.
     *
     * Đây là chỗ giữ cho `attachment_account_clan_uq` (unique trên clanId+accountId) không khoá
     * đường quay lại của người bị từ chối: một lần từ chối là một lần chưa nhận, không phải một
     * lệnh cấm vĩnh viễn.
     */
    const before = { personId: existing.personId, status: existing.status };
    await tx
      .update(attachment)
      .set({ personId: args.personId, role: 'member', status: 'pending' })
      .where(eq(attachment.id, existing.id));
    await writeRevision(tx, {
      clanId: ctx.clanId,
      accountId: ctx.accountId,
      entity: 'attachment',
      entityId: existing.id,
      action: 'update',
      before,
      after: { personId: args.personId, status: 'pending' },
      note: 'đổi node xin gắn khi còn chờ duyệt',
    });
    return ok({ attachmentId: existing.id });
  }

  const id = uuidv7();
  await tx.insert(attachment).values({
    id,
    clanId: ctx.clanId,
    accountId: ctx.accountId,
    personId: args.personId,
    role: 'member',
    status: 'pending',
  });
  await writeRevision(tx, {
    clanId: ctx.clanId,
    accountId: ctx.accountId,
    entity: 'attachment',
    entityId: id,
    action: 'create',
    after: { accountId: ctx.accountId, personId: args.personId, status: 'pending' },
  });
  return ok({ attachmentId: id });
}

/** Pending claims awaiting a vouch — admin and branch-head only. */
export async function listPendingAttachmentsOp(
  tx: Tx,
  ctx: SessionContext,
): Promise<Result<PendingAttachment[]>> {
  if (ctx.role !== 'admin' && ctx.role !== 'branch-head') {
    return err('forbidden', 'Chỉ trưởng chi hoặc quản trị mới xem được danh sách chờ duyệt.');
  }
  const rows = await tx
    .select({
      attachmentId: attachment.id,
      accountId: attachment.accountId,
      personId: attachment.personId,
      personName: person.fullName,
      requestedAt: attachment.createdAt,
    })
    .from(attachment)
    .innerJoin(person, eq(person.id, attachment.personId))
    .where(eq(attachment.status, 'pending'))
    .orderBy(desc(attachment.createdAt));
  return ok(rows);
}

/**
 * The vouched act (AD-8). Branch-head may approve plain members; any role above 'member'
 * requires admin. `vouchedByAttachmentId` records WHO vouched — the approver's own active
 * attachment, so the vouch chain stays inside the clan graph.
 */
export async function approveAttachmentOp(
  tx: Tx,
  ctx: SessionContext,
  args: { attachmentId: string; role?: AttachmentRole },
): Promise<Result<{ attachmentId: string; role: AttachmentRole }>> {
  const grant = args.role ?? 'member';
  if (ctx.role !== 'admin' && ctx.role !== 'branch-head') {
    return err('forbidden', 'Chỉ trưởng chi hoặc quản trị mới duyệt được.');
  }
  if (grant !== 'member' && ctx.role !== 'admin') {
    return err('forbidden', 'Chỉ quản trị mới trao được vai trên thành viên thường.');
  }

  if (!isUuid(args.attachmentId)) return err('not-found', 'Không thấy yêu cầu gắn này.');
  const [target] = await tx.select().from(attachment).where(eq(attachment.id, args.attachmentId));
  if (!target) return err('not-found', 'Không thấy yêu cầu gắn này.');
  if (target.status === 'active') return err('conflict', 'Yêu cầu này đã được duyệt rồi.');
  /**
   * Đã bị TỪ CHỐI thì không duyệt ngược lại được (thêm 25/08 sau code review).
   *
   * Không có nhánh này thì một trang hàng chờ cũ còn giữ id là đủ để lật ngược phán quyết của
   * dòng họ, và nhật ký ghi cả hai verdict mà không nói cái nào có hiệu lực. Muốn nhận lại thì
   * người ấy xin lại — `requestAttachmentOp` dùng lại chính hàng đó và đặt về `pending`.
   */
  if (target.status === 'rejected') {
    return err('conflict', 'Yêu cầu này đã bị từ chối — người ấy cần xin lại.');
  }

  const [voucher] = await tx
    .select()
    .from(attachment)
    .where(and(eq(attachment.accountId, ctx.accountId), eq(attachment.status, 'active')));
  if (!voucher) return err('forbidden', 'Người duyệt phải tự gắn với một node trước đã.');

  const before = { status: target.status, role: target.role, vouchedByAttachmentId: target.vouchedByAttachmentId };
  await tx
    .update(attachment)
    .set({ status: 'active', role: grant, vouchedByAttachmentId: voucher.id })
    .where(eq(attachment.id, target.id));
  await writeRevision(tx, {
    clanId: ctx.clanId,
    accountId: ctx.accountId,
    entity: 'attachment',
    entityId: target.id,
    action: 'update',
    before,
    after: { status: 'active', role: grant, vouchedByAttachmentId: voucher.id },
    note: 'duyệt gắn node',
  });
  return ok({ attachmentId: target.id, role: grant });
}

/** Undo one's own attachment (pending or active). The row goes; the revision remembers. */
/**
 * TỪ CHỐI một yêu cầu vào phả — story 5-5.
 *
 * `core/identity` từ Đợt 1 có `approveAttachment` mà KHÔNG có đường từ chối, nên một yêu cầu chỉ
 * có hai kết cục: được nhận, hoặc nằm `pending` vĩnh viễn. Bản dựng thử đã ghi cảnh báo này.
 *
 * Hàng được GIỮ LẠI ở trạng thái `rejected`, không xoá (tinh thần AD-4), và revision ghi cả lý do
 * (AD-10). Quyền y hệt duyệt: một lần từ chối cũng là một phán quyết về ai thuộc về dòng họ này.
 */
export async function rejectAttachmentOp(
  tx: Tx,
  ctx: SessionContext,
  args: { attachmentId: string; note: string },
): Promise<Result<{ attachmentId: string }>> {
  if (ctx.role !== 'admin' && ctx.role !== 'branch-head') {
    return err('forbidden', 'Chỉ trưởng chi hoặc quản trị mới từ chối được yêu cầu vào phả.');
  }
  if (!isUuid(args.attachmentId)) return err('not-found', 'Không thấy yêu cầu gắn này.');

  const [target] = await tx.select().from(attachment).where(eq(attachment.id, args.attachmentId));
  if (!target) return err('not-found', 'Không thấy yêu cầu gắn này.');
  if (target.status === 'active') {
    return err('conflict', 'Yêu cầu này đã được duyệt — gỡ gắn là việc khác.');
  }
  if (target.status === 'rejected') return err('conflict', 'Yêu cầu này đã bị từ chối rồi.');

  // Người từ chối cũng phải tự gắn với một node, y như người duyệt: phán quyết về dòng họ đến từ
  // một chỗ đứng TRONG dòng họ, không đến từ một tài khoản trôi nổi (AD-8).
  const [voucher] = await tx
    .select()
    .from(attachment)
    .where(and(eq(attachment.accountId, ctx.accountId), eq(attachment.status, 'active')));
  if (!voucher) return err('forbidden', 'Người từ chối phải tự gắn với một node trước đã.');

  const before = { status: target.status, personId: target.personId, role: target.role };
  await tx
    .update(attachment)
    .set({ status: 'rejected' })
    .where(eq(attachment.id, target.id));
  await writeRevision(tx, {
    clanId: ctx.clanId,
    accountId: ctx.accountId,
    entity: 'attachment',
    entityId: target.id,
    action: 'update',
    before,
    after: { status: 'rejected' },
    note: args.note.trim() || 'từ chối yêu cầu vào phả',
  });
  return ok({ attachmentId: target.id });
}

export async function detachSelfOp(tx: Tx, ctx: SessionContext): Promise<Result<{ detached: true }>> {
  const [own] = await tx.select().from(attachment).where(eq(attachment.accountId, ctx.accountId));
  if (!own) return err('not-found', 'Tài khoản chưa gắn với ai trong phả.');

  await tx.delete(attachment).where(eq(attachment.id, own.id));
  await writeRevision(tx, {
    clanId: ctx.clanId,
    accountId: ctx.accountId,
    entity: 'attachment',
    entityId: own.id,
    action: 'remove',
    before: { accountId: own.accountId, personId: own.personId, role: own.role, status: own.status },
    note: 'tự gỡ gắn node',
  });
  return ok({ detached: true });
}

/**
 * FR-55 self-service — `hiddenFromPublic` / `refusePrint` on the OWN node only.
 *
 * AD-19 exception, documented on the schema too: these two columns are the subject's OWN
 * choice about their visibility, not a projected assertion value — they may only NARROW
 * visibility (AD-13), never widen it, and no assertion/approval flow stands between a living
 * person and their right to hide. That is why core/identity writes them directly instead of
 * going through core/assertion.
 */
export async function updateSelfVisibilityOp(
  tx: Tx,
  ctx: SessionContext,
  args: { personId: string; hiddenFromPublic?: boolean; refusePrint?: boolean },
): Promise<Result<{ personId: string }>> {
  if (!ctx.personId) return err('unattached', 'Chưa gắn với ai trong phả nên chưa có gì để chỉnh.');
  if (args.personId !== ctx.personId) {
    return err('forbidden', 'Quyền FR-55 chỉ áp cho node của chính mình.');
  }
  if (args.hiddenFromPublic === undefined && args.refusePrint === undefined) {
    return err('invalid', 'Không có gì để thay đổi.');
  }

  const [own] = await tx.select().from(person).where(eq(person.id, ctx.personId));
  if (!own) return err('not-found', 'Không thấy node của mình.');

  const patch: { hiddenFromPublic?: boolean; refusePrint?: boolean; updatedAt: Date } = {
    updatedAt: new Date(),
  };
  if (args.hiddenFromPublic !== undefined) patch.hiddenFromPublic = args.hiddenFromPublic;
  if (args.refusePrint !== undefined) patch.refusePrint = args.refusePrint;

  await tx.update(person).set(patch).where(eq(person.id, own.id));
  await writeRevision(tx, {
    clanId: ctx.clanId,
    accountId: ctx.accountId,
    entity: 'person',
    entityId: own.id,
    action: 'update',
    before: { hiddenFromPublic: own.hiddenFromPublic, refusePrint: own.refusePrint },
    after: {
      hiddenFromPublic: args.hiddenFromPublic ?? own.hiddenFromPublic,
      refusePrint: args.refusePrint ?? own.refusePrint,
    },
    note: 'FR-55: tự chỉnh mức hiển thị',
  });
  return ok({ personId: own.id });
}

/** FR-55 — what the record has told this person (AD-15 events owed to the node). */
export async function getMyNotificationsOp(
  tx: Tx,
  ctx: SessionContext,
): Promise<Result<NotificationItem[]>> {
  if (!ctx.personId) return err('unattached', 'Chưa gắn với ai trong phả.');
  const rows = await tx
    .select()
    .from(notification)
    .where(eq(notification.personId, ctx.personId))
    .orderBy(desc(notification.createdAt));
  return ok(
    rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      payload: r.payload,
      createdAt: r.createdAt,
      seenAt: r.seenAt,
    })),
  );
}

/**
 * Mark one of MY notifications seen. Idempotent. No revision row: `seenAt` is delivery
 * bookkeeping, not genealogical record — the revision entity set (schema) deliberately has
 * no 'notification' member, and AD-15 keeps the event itself immutable.
 */
export async function markNotificationSeenOp(
  tx: Tx,
  ctx: SessionContext,
  args: { notificationId: string },
): Promise<Result<{ seenAt: Date }>> {
  if (!ctx.personId) return err('unattached', 'Chưa gắn với ai trong phả.');
  if (!isUuid(args.notificationId)) return err('not-found', 'Không thấy thông báo này.');
  const [row] = await tx
    .select()
    .from(notification)
    .where(eq(notification.id, args.notificationId));
  // Someone else's notification reads as absent — existence is not leaked.
  if (!row || row.personId !== ctx.personId) return err('not-found', 'Không thấy thông báo này.');
  if (row.seenAt) return ok({ seenAt: row.seenAt });

  const seenAt = new Date();
  await tx.update(notification).set({ seenAt }).where(eq(notification.id, row.id));
  return ok({ seenAt });
}
