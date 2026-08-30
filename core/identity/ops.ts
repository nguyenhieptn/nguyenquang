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
import { gateApprover, gateWriter } from './gates';

export type AttachmentRole = 'admin' | 'branch-head' | 'member';

export type PendingAttachment = {
  attachmentId: string;
  accountId: string;
  /** Tên hiển thị của tài khoản; điền ở tầng bề mặt. `null` khi không tra được. */
  accountName: string | null;
  personId: string;
  personName: string;
  requestedAt: Date;
};

/**
 * Một hàng của màn Tài khoản (story 6-2) — gắn kết, KHÔNG phải tài khoản.
 *
 * AD-8: vai sống ở gắn kết, không ở `user`. Màn này quản lý chỗ nối hai lớp, và không đụng một
 * dòng nào của Better Auth. `accountName` điền ở tầng bề mặt (bảng `user` không nằm trong clan
 * context) — xem `listAttachments`.
 */
export type AttachmentRow = {
  attachmentId: string;
  accountId: string;
  /** Tên hiển thị của tài khoản; `null` khi không tra được — bề mặt rơi về `accountId`. */
  accountName: string | null;
  personId: string;
  personName: string;
  role: AttachmentRole;
  status: 'pending' | 'active' | 'rejected' | 'detached';
  vouchedByAttachmentId: string | null;
  createdAt: Date;
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
  const cong = gateApprover(ctx);
  if (!cong.ok) return cong.error.code === 'forbidden' ? err('forbidden', 'Chỉ trưởng chi hoặc quản trị mới xem được danh sách chờ duyệt.') : cong;
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
  return ok(rows.map((r) => ({ ...r, accountName: null })));
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
  const cong = gateApprover(ctx);
  if (!cong.ok) return cong.error.code === 'forbidden' ? err('forbidden', 'Chỉ trưởng chi hoặc quản trị mới duyệt được.') : cong;
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
  /**
   * ĐÃ BỊ GỠ thì cũng không duyệt ngược lại được (thêm 27/08 sau code review story 6-2).
   *
   * `detached` là trạng thái thứ tư, và nhánh này là chỗ nó suýt lọt: hai nhánh trên liệt kê
   * tường minh `active`/`rejected` nên hàng đã gỡ rơi thẳng qua. Mà op này cho **branch-head**
   * đi qua cổng, còn `detachAccountOp` đòi **admin** — nên một đầu mối chi phục hồi được gắn kết
   * mà quản trị vừa gỡ, không cần người bị gỡ xin lại. Đúng con bug đã vá cho `rejected` hôm
   * 25/08, dời sang một trạng thái mới.
   */
  if (target.status === 'detached') {
    return err('conflict', 'Gắn kết này đã bị quản trị gỡ — người ấy cần xin lại.');
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
  const cong = gateApprover(ctx);
  if (!cong.ok) return cong.error.code === 'forbidden' ? err('forbidden', 'Chỉ trưởng chi hoặc quản trị mới từ chối được yêu cầu vào phả.') : cong;
  if (!isUuid(args.attachmentId)) return err('not-found', 'Không thấy yêu cầu gắn này.');

  const [target] = await tx.select().from(attachment).where(eq(attachment.id, args.attachmentId));
  if (!target) return err('not-found', 'Không thấy yêu cầu gắn này.');
  if (target.status === 'active') {
    return err('conflict', 'Yêu cầu này đã được duyệt — gỡ gắn là việc khác.');
  }
  if (target.status === 'rejected') return err('conflict', 'Yêu cầu này đã bị từ chối rồi.');
  // Gỡ và từ chối là hai chuyện khác nhau — biến một hàng đã gỡ thành `rejected` là xoá đúng cái
  // phân biệt mà `detached` sinh ra để giữ, và nói sai về một người từng được nhận vào phả.
  if (target.status === 'detached') {
    return err('conflict', 'Gắn kết này đã bị gỡ — không phải một yêu cầu đang chờ.');
  }

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

  /**
   * ── Đây là cửa THẬT tới 0 quản trị (thêm 27/08 sau code review story 6-2) ─────────────────
   *
   * Story 6-2 dựng hàng rào "không mất quản trị cuối cùng" ở hai phép MỚI rồi ghi *"`detachSelf`
   * đã có và giữ nguyên"*. Nhưng hai hàng rào kia hoá ra không bao giờ chạy được — `ctx.role`
   * chỉ đến từ một gắn kết `active`, nên người bấm luôn được đếm, và cả hai phép kiểm "chính
   * mình" TRƯỚC nên target luôn là một admin khác ⇒ đếm luôn ≥ 2.
   *
   * Còn đường này thì không gác gì, và nó **XOÁ** hàng (khác `detachAccountOp` vốn giữ lại), nên
   * quản trị duy nhất tự gỡ là dòng họ mất sạch quản trị và không còn cả một hàng để sửa lại —
   * chỉ còn `scripts/create-admin.ts`. Một ràng buộc an toàn chỉ gác hai trong ba đường thì
   * không phải ràng buộc.
   */
  if (own.role === 'admin' && own.status === 'active' && (await demAdminDangHoatDong(tx)) <= 1) {
    return err(
      'conflict',
      'Đây là quản trị duy nhất của dòng họ — trao vai quản trị cho một người nữa trước đã, ' +
        'kẻo không ai vào được bàn quản trị nữa.',
    );
  }

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
 * MỌI gắn kết của dòng họ — màn Tài khoản (story 6-2), không chỉ hàng chờ.
 *
 * Cùng cổng quyền với `listPendingAttachmentsOp`: đây là danh sách người thật của cả dòng họ,
 * kèm ai bảo lãnh ai. Không phải dữ liệu công khai.
 */
export async function listAttachmentsOp(
  tx: Tx,
  ctx: SessionContext,
): Promise<Result<AttachmentRow[]>> {
  const cong = gateApprover(ctx);
  if (!cong.ok) return cong.error.code === 'forbidden' ? err('forbidden', 'Chỉ trưởng chi hoặc quản trị mới xem được danh sách tài khoản.') : cong;
  const rows = await tx
    .select({
      attachmentId: attachment.id,
      accountId: attachment.accountId,
      personId: attachment.personId,
      personName: person.fullName,
      role: attachment.role,
      status: attachment.status,
      vouchedByAttachmentId: attachment.vouchedByAttachmentId,
      createdAt: attachment.createdAt,
    })
    .from(attachment)
    .innerJoin(person, eq(person.id, attachment.personId))
    .orderBy(desc(attachment.createdAt));
  return ok(rows.map((r) => ({ ...r, accountName: null })));
}

/**
 * Đếm gắn kết `admin` đang hoạt động — chạy TRONG cùng transaction với lượt ghi sắp tới.
 *
 * Đọc trước rồi ghi sau là một cửa sổ đua: hai admin cùng hạ vai nhau trong hai request song
 * song, cả hai đọc thấy "còn 2", cả hai ghi, và dòng họ mất sạch quản trị. Không có đường nào
 * trong sản phẩm mở lại được — chỉ còn `scripts/`.
 */
async function demAdminDangHoatDong(tx: Tx): Promise<number> {
  const rows = await tx
    .select({ id: attachment.id })
    .from(attachment)
    .where(and(eq(attachment.role, 'admin'), eq(attachment.status, 'active')))
    /**
     * `FOR UPDATE` — KHOÁ tập hàng admin cho tới hết transaction (thêm 27/08 sau code review).
     *
     * Bản đầu chỉ ĐẾM, và chú thích ngay trên lại tuyên bố cửa đua đã đóng. Nó không đóng:
     * `withClanContext` không đặt mức cô lập nên là READ COMMITTED, và hai lượt hạ vai song song
     * ghi HAI HÀNG KHÁC NHAU nên không đụng khoá — cả hai đọc thấy `2`, cả hai commit, còn 0
     * quản trị. Đây là write skew kinh điển, và "đếm trong transaction" không phải thuốc cho nó.
     *
     * `updateClanInfoOp` (`core/identity/info.ts`) đã vá đúng thế này kèm một đoạn giải thích
     * cùng cơ chế — mã mới chỉ là mượn lại nếp đã có trong nhà.
     */
    .for('update');
  return rows.length;
}

/** Gắn kết đang được thao tác có phải của CHÍNH người đang bấm không. */
function laChinhMinh(target: { accountId: string }, ctx: SessionContext): boolean {
  return target.accountId === ctx.accountId;
}

/**
 * TRAO hoặc HẠ vai của một gắn kết đang hoạt động (story 6-2).
 *
 * Phép RIÊNG, không nới `approveAttachmentOp`: duyệt là *nhận một người vào*, đổi vai là *đổi
 * thứ họ làm được*. Gộp chúng buộc phải gỡ ra rồi nhận lại, tức mất `vouchedByAttachmentId` —
 * dấu vết ai bảo lãnh ai, thứ AD-8 dựng ra để giữ. Nên phép này KHÔNG đụng `vouchedBy`,
 * `personId`, hay `status`.
 */
export async function setAttachmentRoleOp(
  tx: Tx,
  ctx: SessionContext,
  args: { attachmentId: string; role: AttachmentRole },
): Promise<Result<{ attachmentId: string; role: AttachmentRole }>> {
  if (ctx.role !== 'admin') return err('forbidden', 'Chỉ quản trị mới đổi được vai.');
  if (!isUuid(args.attachmentId)) return err('invalid', 'Mã gắn kết không hợp lệ.');

  const [target] = await tx.select().from(attachment).where(eq(attachment.id, args.attachmentId));
  if (!target) return err('not-found', 'Không tìm thấy gắn kết này.');
  if (target.status !== 'active') {
    return err(
      'conflict',
      'Chỉ đổi được vai của gắn kết đang hoạt động. Hàng còn chờ thì trao vai ngay ở lượt duyệt.',
    );
  }
  if (target.role === args.role) return ok({ attachmentId: target.id, role: args.role });

  /**
   * Không TỰ hạ vai mình — kể cả khi còn admin khác.
   *
   * Một cú bấm nhầm không được lấy mất quyền của chính người đang bấm; nhờ một admin khác hạ hộ
   * thì có hai người biết việc ấy đã xảy ra.
   */
  if (laChinhMinh(target, ctx) && args.role !== 'admin') {
    return err('conflict', 'Không tự hạ vai của chính mình — nhờ một quản trị khác làm việc này.');
  }

  // Không để phả mất quản trị cuối cùng. Đếm trong CÙNG transaction — xem `demAdminDangHoatDong`.
  if (target.role === 'admin' && args.role !== 'admin') {
    if ((await demAdminDangHoatDong(tx)) <= 1) {
      return err(
        'conflict',
        'Đây là quản trị duy nhất của dòng họ. Trao vai quản trị cho một người nữa trước đã.',
      );
    }
  }

  await tx.update(attachment).set({ role: args.role }).where(eq(attachment.id, target.id));
  await writeRevision(tx, {
    clanId: ctx.clanId,
    accountId: ctx.accountId,
    entity: 'attachment',
    entityId: target.id,
    action: 'update',
    before: { role: target.role },
    after: { role: args.role },
    note: 'đổi vai',
  });
  return ok({ attachmentId: target.id, role: args.role });
}

/**
 * GỠ gắn kết của NGƯỜI KHÁC — quản trị (story 6-2). `detachSelfOp` là đường của chính chủ.
 *
 * KHÔNG xoá hàng (khác `detachSelfOp`, thứ có từ Đợt 1): đây là một hành động lên người khác, và
 * nó phải để lại dấu. Cùng lẽ với `rejected` mà story 5-5 đã chọn. Người bị gỡ vẫn xin lại được
 * — `requestAttachmentOp` dùng lại hàng cũ khi nó không `active`.
 */
export async function detachAccountOp(
  tx: Tx,
  ctx: SessionContext,
  args: { attachmentId: string; note: string },
): Promise<Result<{ attachmentId: string }>> {
  if (ctx.role !== 'admin') return err('forbidden', 'Chỉ quản trị mới gỡ được gắn kết của người khác.');
  if (!isUuid(args.attachmentId)) return err('invalid', 'Mã gắn kết không hợp lệ.');
  const lyDo = args.note.trim();
  if (!lyDo) return err('invalid', 'Cần một dòng lý do — nó đi vào nhật ký, không đi tới người bị gỡ.');

  const [target] = await tx.select().from(attachment).where(eq(attachment.id, args.attachmentId));
  if (!target) return err('not-found', 'Không tìm thấy gắn kết này.');
  /**
   * Chỉ gỡ hàng ĐANG HOẠT ĐỘNG (thắt lại 27/08 sau code review).
   *
   * Bản đầu chỉ chặn `detached`, nên POST thẳng gỡ được cả hàng `pending` lẫn `rejected` — trong
   * khi màn đã ẩn nút cho chúng. Hai bề mặt lệch nhau, và bề mặt rộng hơn là bề mặt POST được:
   * gỡ một hàng `pending` làm một yêu cầu biến khỏi hàng chờ mà người xin không được báo gì, và
   * nhật ký ghi *"quản trị gỡ gắn"* về một gắn kết chưa bao giờ hoạt động.
   *
   * Từ chối một yêu cầu đang chờ là việc của `rejectAttachmentOp`.
   */
  if (target.status !== 'active') {
    return err(
      'conflict',
      target.status === 'detached'
        ? 'Gắn kết này đã được gỡ rồi.'
        : 'Chỉ gỡ được gắn kết đang hoạt động. Yêu cầu còn chờ thì từ chối ở màn Duyệt vào phả.',
    );
  }
  if (laChinhMinh(target, ctx)) {
    return err('conflict', 'Đây là gắn kết của chính mình — dùng đường tự gỡ, hoặc nhờ quản trị khác.');
  }
  if (target.role === 'admin') {
    if ((await demAdminDangHoatDong(tx)) <= 1) {
      return err('conflict', 'Đây là quản trị duy nhất của dòng họ. Trao vai quản trị cho một người nữa trước đã.');
    }
  }

  /**
   * Hạ vai về `member` cùng lúc (thêm 27/08 sau code review).
   *
   * Không hạ thì một quản trị bị gỡ nằm ở `role='admin', status='detached'` — một lời khai sai
   * đứng trong bảng, và bất kỳ đường phục hồi nào sau này chỉ lật `status` sẽ trả lại vai quản
   * trị. Vai cũ không mất: `before` của revision ngay dưới giữ nguyên nó.
   */
  await tx
    .update(attachment)
    .set({ status: 'detached', role: 'member' })
    .where(eq(attachment.id, target.id));
  await writeRevision(tx, {
    clanId: ctx.clanId,
    accountId: ctx.accountId,
    entity: 'attachment',
    entityId: target.id,
    action: 'update',
    before: { status: target.status, role: target.role, personId: target.personId },
    after: { status: 'detached' },
    note: `quản trị gỡ gắn: ${lyDo}`,
  });
  return ok({ attachmentId: target.id });
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
  const gate = gateWriter(ctx);
  if (!gate.ok) return gate;
  if (args.personId !== gate.value.personId) {
    return err('forbidden', 'Quyền FR-55 chỉ áp cho node của chính mình.');
  }
  if (args.hiddenFromPublic === undefined && args.refusePrint === undefined) {
    return err('invalid', 'Không có gì để thay đổi.');
  }

  const [own] = await tx.select().from(person).where(eq(person.id, gate.value.personId));
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
  const gate = gateWriter(ctx);
  if (!gate.ok) return gate;
  const rows = await tx
    .select()
    .from(notification)
    .where(eq(notification.personId, gate.value.personId))
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
  const gate = gateWriter(ctx);
  if (!gate.ok) return gate;
  if (!isUuid(args.notificationId)) return err('not-found', 'Không thấy thông báo này.');
  const [row] = await tx
    .select()
    .from(notification)
    .where(eq(notification.id, args.notificationId));
  // Someone else's notification reads as absent — existence is not leaked.
  if (!row || row.personId !== gate.value.personId) return err('not-found', 'Không thấy thông báo này.');
  if (row.seenAt) return ok({ seenAt: row.seenAt });

  const seenAt = new Date();
  await tx.update(notification).set({ seenAt }).where(eq(notification.id, row.id));
  return ok({ seenAt });
}
