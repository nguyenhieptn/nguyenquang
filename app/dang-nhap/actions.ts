'use server';

/**
 * Server actions của màn đăng nhập (story 2-2, FR-64/AD-8).
 *
 * Xác thực chạy ở CLIENT qua Better Auth (`lib/auth-client` → app/api/auth/[...all]).
 * Việc duy nhất server phải trả lời sau đó là: *tài khoản này đã có chỗ trong phả chưa?* —
 * câu đó chỉ core trả lời được (AD-24: core tự đọc phiên, adapter không truyền danh tính).
 */
import { resolveSession } from '@/core/identity';

/**
 * Đích đến sau khi vào được tài khoản:
 *   · đã gắn với một người trong phả → về trang chủ;
 *   · chưa gắn → sang màn nhận chỗ (/gan-node). EXPERIENCE.md § State Patterns: "chưa gắn"
 *     là trạng thái thường trực, không phải lỗi — nên đường đi là một lời mời, không phải rào.
 *   · phiên chưa đọc được (cookie chưa kịp tới, clan chưa gieo) → về trang chủ; các hành động
 *     ghi sẽ dẫn lại về đúng luồng khi cần.
 */
export async function dichSauDangNhap(): Promise<'/' | '/gan-node'> {
  const session = await resolveSession();
  if (!session) return '/';
  return session.personId ? '/' : '/gan-node';
}
