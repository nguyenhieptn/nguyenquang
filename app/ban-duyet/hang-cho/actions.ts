'use server';

/**
 * Server actions của Hàng chờ duyệt (story 3-3, FR-3).
 *
 * Gọi core/assertion (index — AD-24: core tự resolve session, không truyền danh tính),
 * trả Result về nguyên dạng cho UI. AD-23: trang đọc dữ liệu động → revalidatePath sau
 * mỗi mutation thành công, không cache gì.
 */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { promoteAssertion, rejectAssertion } from '@/core/assertion';
import { err, ok, type Result } from '@/core/types';

const DUONG = '/ban-duyet/hang-cho';

/** Duyệt = NÂNG MỨC một khẳng định lên Tầng chính thức (không phải "cho phép xuất hiện"). */
export async function duyetKhangDinh(assertionId: string): Promise<Result<void>> {
  const ketQua = await promoteAssertion(assertionId);
  if (!ketQua.ok && ketQua.error.code === 'unauthenticated') redirect('/dang-nhap');
  if (ketQua.ok) revalidatePath(DUONG);
  return ketQua;
}

/**
 * Duyệt hàng loạt — bề mặt B được phép chọn nhiều dòng (EXPERIENCE.md § Interaction Primitives).
 * Mỗi khẳng định vẫn đi qua đúng một đường promoteAssertion; dòng hỏng không chặn dòng lành.
 */
export async function duyetHangLoat(
  assertionIds: string[],
): Promise<Result<{ daNang: number; loi: string[] }>> {
  if (assertionIds.length === 0) return err('invalid', 'chưa chọn dòng nào');
  let daNang = 0;
  const loi: string[] = [];
  for (const id of assertionIds) {
    const ketQua = await promoteAssertion(id);
    if (ketQua.ok) {
      daNang += 1;
    } else if (ketQua.error.code === 'unauthenticated') {
      redirect('/dang-nhap');
    } else {
      loi.push(ketQua.error.message);
    }
  }
  if (daNang > 0) revalidatePath(DUONG);
  return ok({ daNang, loi });
}

/**
 * Trả lại = rejectAssertion, BẮT BUỘC kèm ghi chú lý do (AD-4: giá trị thua rời dữ liệu
 * đang bày nhưng nằm nguyên trong nhật ký, kèm chính ghi chú này).
 * Chữ ký (prev, formData) để dùng thẳng với useActionState.
 */
export async function traLaiKhangDinh(
  _truoc: Result<void> | null,
  formData: FormData,
): Promise<Result<void>> {
  const assertionId = String(formData.get('assertionId') ?? '');
  const ghiChu = String(formData.get('ghiChu') ?? '').trim();
  if (!assertionId) return err('invalid', 'thiếu mã khẳng định');
  if (!ghiChu) return err('invalid', 'cần ghi chú lý do trả lại');
  const ketQua = await rejectAssertion(assertionId, ghiChu);
  if (!ketQua.ok && ketQua.error.code === 'unauthenticated') redirect('/dang-nhap');
  if (ketQua.ok) revalidatePath(DUONG);
  return ketQua;
}
