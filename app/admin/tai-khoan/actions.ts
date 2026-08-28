'use server';

/**
 * Server actions của màn Tài khoản (story 6-2).
 *
 * Trả `Result` NGUYÊN VẸN từ core. Quyền do core tự gác (`setAttachmentRoleOp` và
 * `detachAccountOp` đều đòi `admin`, và cả hai hàng rào an toàn — quản trị cuối cùng, tự hạ vai
 * mình — nằm ở đó), nên POST thẳng không qua giao diện vẫn bị chặn.
 */
import { revalidatePath } from 'next/cache';
import { detachAccount, setAttachmentRole } from '@/core/identity';
import type { AttachmentRole } from '@/core/identity';
import type { Result } from '@/core/types';

export async function doiVai(attachmentId: string, vai: AttachmentRole): Promise<Result<unknown>> {
  const res = await setAttachmentRole(attachmentId, vai);
  if (res.ok) lamMoi();
  return res;
}

export async function goGanKet(attachmentId: string, lyDo: string): Promise<Result<unknown>> {
  const res = await detachAccount(attachmentId, lyDo);
  if (res.ok) lamMoi();
  return res;
}

/** `'layout'`: đổi vai có thể đổi cả cổng vào của chính người ấy, không riêng trang này. */
function lamMoi(): void {
  revalidatePath('/admin', 'layout');
}
