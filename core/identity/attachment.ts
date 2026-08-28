/**
 * Attachment surface — FR-64/AD-8: an account is not a person; this is the vouched act that
 * binds one to a clan node, and the ONLY place write permission and privacy radius come from.
 *
 * Adapter surface (AD-24): no identity parameters. Every entry resolves the session itself,
 * opens the clan context, and delegates to ops.ts.
 */
import { withClanContext } from '@/db';
import { inArray } from 'drizzle-orm';
import { dbGlobal } from '@/db';
import { authUser } from '@/db/schema';
import { err, ok, type Result } from '@/core/types';
import { resolveSession } from './session';
import {
  approveAttachmentOp,
  detachAccountOp,
  detachSelfOp,
  listAttachmentsOp,
  rejectAttachmentOp,
  listPendingAttachmentsOp,
  requestAttachmentOp,
  setAttachmentRoleOp,
  type AttachmentRole,
  type AttachmentRow,
  type PendingAttachment,
} from './ops';

export type { AttachmentRole, AttachmentRow, PendingAttachment } from './ops';

/**
 * Nhãn của một tài khoản — tên hiển thị **kèm** tên đăng nhập hoặc email (AC 6, sửa 27/08 sau
 * code review).
 *
 * `lookupAccountNames` của `core/assertion` chỉ trả `name`, và `name` là chữ người dùng tự đặt,
 * không đảm bảo duy nhất. Trên màn Tài khoản — nơi việc chính là quyết định trao quyền cho ai —
 * hai người trùng tên hiển thị là hai hàng không phân biệt được, với nút trao Quản trị ngay cạnh.
 *
 * Đọc NGOÀI clan context: bảng `user` của Better Auth không mang `clan_id` nên không nằm dưới
 * RLS theo dòng họ (AD-8). Chỉ tra bằng danh sách id lấy từ hàng ĐÃ qua RLS.
 */
async function docNhanTaiKhoan(ids: string[]): Promise<Map<string, string>> {
  const canTra = [...new Set(ids.filter((id) => id.length > 0))];
  if (canTra.length === 0) return new Map();
  const rows = await dbGlobal
    .select({ id: authUser.id, name: authUser.name, username: authUser.username, email: authUser.email })
    .from(authUser)
    .where(inArray(authUser.id, canTra));
  return new Map(
    rows.map((r) => {
      const phu = r.username ?? r.email;
      return [r.id, phu && phu !== r.name ? `${r.name} (${phu})` : r.name];
    }),
  );
}

/** Claim a node in the tree. Lands 'pending' until an approver vouches (AD-8). */
export async function requestAttachment(personId: string): Promise<Result<{ attachmentId: string }>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'Cần đăng nhập trước khi nhận node.');
  if (session.personId) return err('conflict', 'Tài khoản đã gắn với một người trong phả.');
  return withClanContext(session.clanId, (tx) => requestAttachmentOp(tx, session, { personId }));
}

/**
 * Pending claims awaiting a vouch — admin | branch-head.
 *
 * Kèm TÊN tài khoản từ 27/08 (story 6-2): trước đó hàng chỉ mang `accountId`, tức người quản
 * trị đang duyệt biết *node nào* được xin mà không biết *ai* xin.
 */
export async function listPendingAttachments(): Promise<Result<PendingAttachment[]>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'Cần đăng nhập.');
  const rows = await withClanContext(session.clanId, (tx) => listPendingAttachmentsOp(tx, session));
  if (!rows.ok) return rows;
  const ten = await docNhanTaiKhoan(rows.value.map((r) => r.accountId));
  return ok(rows.value.map((r) => ({ ...r, accountName: ten.get(r.accountId) ?? null })));
}

/**
 * MỌI gắn kết của dòng họ — màn Tài khoản (story 6-2). Admin | branch-head.
 *
 * Tên tài khoản tra NGOÀI clan context: bảng `user` của Better Auth không mang `clan_id` nên nó
 * không nằm dưới RLS theo dòng họ. Tra không ra thì để `null`, bề mặt rơi về `accountId` — thà
 * bày một chuỗi id còn hơn bịa một cái tên.
 */
export async function listAttachments(): Promise<Result<AttachmentRow[]>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'Cần đăng nhập.');
  const rows = await withClanContext(session.clanId, (tx) => listAttachmentsOp(tx, session));
  if (!rows.ok) return rows;
  const ten = await docNhanTaiKhoan(rows.value.map((r) => r.accountId));
  return ok(rows.value.map((r) => ({ ...r, accountName: ten.get(r.accountId) ?? null })));
}

/** Trao hoặc hạ vai của một gắn kết đang hoạt động — quản trị. */
export async function setAttachmentRole(
  attachmentId: string,
  role: AttachmentRole,
): Promise<Result<{ attachmentId: string; role: AttachmentRole }>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'Cần đăng nhập.');
  return withClanContext(session.clanId, (tx) =>
    setAttachmentRoleOp(tx, session, { attachmentId, role }),
  );
}

/** Gỡ gắn kết của NGƯỜI KHÁC — quản trị. Hàng ở lại, `status` đổi, lý do đi vào nhật ký. */
export async function detachAccount(
  attachmentId: string,
  note: string,
): Promise<Result<{ attachmentId: string }>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'Cần đăng nhập.');
  return withClanContext(session.clanId, (tx) =>
    detachAccountOp(tx, session, { attachmentId, note }),
  );
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

/**
 * Từ chối một yêu cầu vào phả — story 5-5.
 *
 * Trước 25/08/2026 `core/identity` chỉ có đường DUYỆT, nên một yêu cầu chỉ có hai kết cục: được
 * nhận, hoặc nằm `pending` vĩnh viễn. Đó là nửa còn thiếu của FR-64.
 *
 * Lý do đi vào revision (AD-10), không đi tới người xin: bề mặt A chỉ nói rằng lời nhận chỗ chưa
 * được nhận, và mời chọn lại. Sổ của ban tu phả không phải một hộp thư.
 */
export async function rejectAttachment(
  attachmentId: string,
  note: string,
): Promise<Result<{ attachmentId: string }>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'Cần đăng nhập.');
  return withClanContext(session.clanId, (tx) =>
    rejectAttachmentOp(tx, session, { attachmentId, note }),
  );
}
