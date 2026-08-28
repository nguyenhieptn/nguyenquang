'use server';

/**
 * Server actions của màn Duyệt vào phả (story 5-5).
 *
 * Cả hai trả `Result` NGUYÊN VẸN từ core. Quyền do core tự gác (`admin` | `branch-head`, và người
 * duyệt phải tự gắn với một node — AD-8), nên POST thẳng không qua UI vẫn bị chặn.
 */
import { revalidatePath } from 'next/cache';
import { approveAttachment, rejectAttachment } from '@/core/identity';
import type { AttachmentRole } from '@/core/identity';
import type { Result } from '@/core/types';

/**
 * `vai` truyền tường minh từ 27/08 (story 6-2).
 *
 * `approveAttachment` nhận `role` từ Đợt 1, và KHÔNG nơi gọi nào truyền — nên mọi lượt duyệt của
 * cả sản phẩm đều ra `member`, và không màn nào sửa lại được (`core/identity` đặt `role` đúng một
 * lần, trong chính lượt duyệt). `docs/van-hanh.md` đã phải ghi *"nâng vai chưa có màn UI"*.
 *
 * Mặc định vẫn `member` — thứ đổi là **có đường để chọn khác**. Quyền trao vai nào do core gác
 * (`approveAttachmentOp`: vai trên `member` đòi admin), không do lựa chọn trên màn.
 */
export async function nhanVaoPha(
  attachmentId: string,
  vai: AttachmentRole = 'member',
): Promise<Result<unknown>> {
  const res = await approveAttachment(attachmentId, vai);
  if (res.ok) lamMoiSo();
  return res;
}

export async function tuChoiVaoPha(
  attachmentId: string,
  lyDo: string,
): Promise<Result<unknown>> {
  const res = await rejectAttachment(attachmentId, lyDo);
  if (res.ok) lamMoiSo();
  return res;
}

/** `'layout'`: số trên thanh việc do `app/admin/layout.tsx` dựng, không phải trang này. */
function lamMoiSo(): void {
  revalidatePath('/admin', 'layout');
}
