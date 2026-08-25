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
import { promoteAssertion, rejectAssertion, restoreAssertion } from '@/core/assertion';
import { err, ok, type Result } from '@/core/types';

const DUONG = '/admin/hang-cho';

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
 *
 * Phiên hết GIỮA CHỪNG thì dừng vòng lặp chứ không `redirect` ngay: những dòng trước đó đã
 * commit thật vào phả, mà `redirect` ném ra ngoài sẽ vứt mất con số ấy — người vận hành quay
 * lại không biết đợt vừa rồi đi tới đâu và duyệt lại từ đầu. Chỉ khi CHƯA nâng được dòng nào
 * (không có gì để mất) mới đưa thẳng về màn đăng nhập; còn lại trả `{ daNang, loi }`, mỗi
 * dòng chưa duyệt một câu — để con số ở đầu khối lỗi vẫn đúng bằng số dòng không nâng được.
 */
export async function duyetHangLoat(
  assertionIds: string[],
): Promise<Result<{ daNang: number; loi: string[] }>> {
  if (assertionIds.length === 0) return err('invalid', 'chưa chọn dòng nào');
  let daNang = 0;
  const loi: string[] = [];
  for (const [viTri, id] of assertionIds.entries()) {
    const ketQua = await promoteAssertion(id);
    if (ketQua.ok) {
      daNang += 1;
      continue;
    }
    if (ketQua.error.code === 'unauthenticated') {
      if (daNang === 0) redirect('/dang-nhap');
      for (let con = viTri; con < assertionIds.length; con += 1)
        loi.push('phiên đã hết giữa chừng — đăng nhập lại rồi duyệt tiếp dòng này');
      break;
    }
    loi.push(ketQua.error.message);
  }
  if (daNang > 0) revalidatePath(DUONG);
  return ok({ daNang, loi });
}

/**
 * Khôi phục một khẳng định đã ẩn theo báo cáo (AD-17: một báo cáo là ẩn ngay, khôi phục thì
 * cần quyền duyệt — core tự gác). Dạng form action bind(assertionId) — thành công thì dòng
 * rời danh sách qua revalidate; hỏng thì danh sách giữ nguyên, không băng-rôn lỗi (bề mặt B
 * vắng lặng như các mục đọc khác của màn).
 */
export async function khoiPhucKhangDinh(assertionId: string): Promise<void> {
  const ketQua = await restoreAssertion(assertionId);
  if (!ketQua.ok && ketQua.error.code === 'unauthenticated') redirect('/dang-nhap');
  if (ketQua.ok) revalidatePath(DUONG);
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
