'use server';

/**
 * Server actions của màn Duyệt vào phả (story 5-5).
 *
 * Cả hai trả `Result` NGUYÊN VẸN từ core. Quyền do core tự gác (`admin` | `branch-head`, và người
 * duyệt phải tự gắn với một node — AD-8), nên POST thẳng không qua UI vẫn bị chặn.
 */
import { revalidatePath } from 'next/cache';
import { approveAttachment, rejectAttachment } from '@/core/identity';
import type { Result } from '@/core/types';

export async function nhanVaoPha(attachmentId: string): Promise<Result<unknown>> {
  const res = await approveAttachment(attachmentId);
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
