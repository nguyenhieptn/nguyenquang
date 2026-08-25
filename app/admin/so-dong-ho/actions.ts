'use server';

/**
 * Server action của Sổ dòng họ (story 5-8).
 *
 * Quyền do core gác (`admin` — xem `updateClanInfoOp`), nên POST thẳng không qua UI vẫn bị chặn.
 */
import { revalidatePath } from 'next/cache';
import { updateClanInfo, type ClanInfo, type ClanSettings } from '@/core/identity';
import type { Result } from '@/core/types';

export async function ghiSoDongHo(args: {
  name?: string;
  settings?: Partial<ClanSettings>;
}): Promise<Result<ClanInfo>> {
  const res = await updateClanInfo(args);
  if (res.ok) {
    /**
     * `'/'` chứ không phải `'/admin'` — và đây là chỗ story này khác sáu story kia của Epic 5.
     *
     * Sáu màn kia chỉ đổi thứ nằm sau cổng `/admin`. Màn này đổi tiêu đề trang chủ và đề từ mà cả
     * dòng họ nhìn thấy, nên phải làm mới từ gốc cây route.
     */
    revalidatePath('/', 'layout');
  }
  return res;
}
