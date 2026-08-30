/**
 * HAI CỔNG — nơi DUY NHẤT trong `core/` được so `role === 'guest'` và sinh `unauthenticated` /
 * `unattached` (story 7-1, luật lint ở `eslint.config.mjs § Cổng chỉ có hai tên`).
 *
 * Chuyển từ `core/assertion/ops.ts` ngày 29/08/2026 sau retro Epic 6. Cùng ngày `gateWriter` được
 * sửa thứ tự thì `listConflictsOps` chép lại ba dòng kiểm và lặp đúng lỗi ấy; rà lại thấy
 * `core/merge/ops.ts` cũng mang một bản chép (`requireAttached`/`requireApprover`) với đúng thứ tự
 * sai từ Đợt 1. Ba cách viết một cổng là ba chỗ lệch nhau ở lượt sửa sau — nên cổng có tên, có
 * một file, và lint gác phần còn lại.
 *
 * `core/assertion/ops.ts` vẫn re-export hai hàm để 5 nơi gọi cũ không đổi.
 */
import { err, ok, type Result } from '@/core/types';
import type { ViewerContext } from './session';

/** A viewer allowed to write: authenticated AND attached to a node (AD-8). */
export type AttachedContext = {
  accountId: string;
  clanId: string;
  personId: string;
  role: 'admin' | 'branch-head' | 'member';
};

/**
 * Guests and unattached accounts get err on every write — with TWO different codes.
 *
 * ── `unattached` từng là mã chết (sửa 29/08/2026, tầng test adapter đầu tiên bắt được) ──────
 * `resolveSessionImpl` trả `role: 'guest'` cho tài khoản ĐÃ đăng nhập mà chưa gắn chỗ, và bản
 * trước kiểm `role === 'guest'` TRƯỚC `personId === null` — nên tài khoản ấy nhận
 * `unauthenticated`, nhánh `unattached` không bao giờ tới được qua một phiên thật, và adapter
 * không phân biệt nổi *"chưa đăng nhập"* với *"đã đăng nhập, chưa nhận chỗ"*. Mà
 * `EXPERIENCE.md § Chưa gắn node` đòi đúng phép phân biệt ấy: mọi hành động ghi dẫn về luồng
 * nhận chỗ, không phải về màn đăng nhập.
 *
 * Nay: không tài khoản ⇒ `unauthenticated`; có tài khoản mà không có chỗ ⇒ `unattached`.
 * `role === 'guest'` kèm `personId` là trạng thái sản phẩm không tạo ra được, nên gộp về vế sau.
 */
export function gateWriter(ctx: ViewerContext): Result<AttachedContext> {
  // Câu là cho NGƯỜI đọc (adapter có chỗ in thẳng `error.message`); mã là cho máy rẽ nhánh.
  if (ctx.accountId === null) return err('unauthenticated', 'Cần đăng nhập trước đã.');
  if (ctx.personId === null || ctx.role === 'guest')
    return err('unattached', 'Tài khoản chưa gắn vào người nào trong phả — gắn xong mới làm được.');
  return ok(ctx as AttachedContext);
}

/** Promotion / restore / reject / pending queue need the approval right (FR-3). */
export function gateApprover(ctx: ViewerContext): Result<AttachedContext> {
  const writer = gateWriter(ctx);
  if (!writer.ok) return writer;
  if (writer.value.role !== 'admin' && writer.value.role !== 'branch-head')
    return err('forbidden', 'Việc này cần quyền duyệt — quản trị hoặc đầu mối chi.');
  return writer;
}
