'use server';

/**
 * Server actions của màn cây `/admin` — vỏ `'use server'` MỎNG (story 5-3 … 6-1, gói lại ở 6-10).
 *
 * ── Vì sao NGƯỜI ĐANG CHỌN đi qua action, không qua URL ────────────────────────────────────
 * Neo thì nằm ở URL (`?neo=`) vì dời tâm là một chỗ đứng mới, đáng có mục trong lịch sử. Người
 * đang chọn thì KHÔNG: đưa nó vào URL là mỗi cú bấm một lượt điều hướng, `loading.tsx` thay cả
 * trang, và canvas chớp tắt theo — trong khi luật của 5-2 là *chọn người thì canvas đứng yên*.
 *
 * ── Ruột nằm ở `lib/ghi-pha.ts` (story 6-10) ────────────────────────────────────────────────
 * Bề mặt thành viên (`/gia-pha`) dùng cùng canvas, cùng phiếu, cùng ba biểu mẫu — nên phần KIỂM
 * đầu vào và GỌI CORE dùng chung. Ở đây chỉ còn hai việc riêng của bàn tu phả: hai lối DUYỆT
 * (`nangTang` · `loaiKhangDinh`, core gác `gateApprover`), và làm mới số trên thanh việc.
 *
 * Cả bộ trả `Result` NGUYÊN VẸN từ core. Quyền do core tự gác — POST thẳng không qua UI thì core
 * vẫn chặn (AD-24).
 */
import { revalidatePath } from 'next/cache';
import { promoteAssertion, rejectAssertion } from '@/core/assertion';
import type { LoaiGhiThem } from '@/components/admin/loai-ghi-them';
import type { UngVienNoiChon } from '@/core/place';
import type { Result } from '@/core/types';
import {
  anKhangDinh as anKhangDinhChung,
  docHoSo,
  ghiKhangDinh,
  ghiNguoiMoi,
  ghiNoi,
  ghiQuanHe,
  taoNoiChon,
  timNoiChon,
  type HoSoNguoi,
  type NguoiMoi,
  type QuanHeMoi,
  type VaiNoi,
} from '@/lib/ghi-pha';

export type { ChipQuanHe, HoSoNguoi, NguoiMoi, QuanHeMoi, VaiNoi } from '@/lib/ghi-pha';

export async function xemHoSo(personId: string): Promise<Result<HoSoNguoi>> {
  return docHoSo(personId);
}

/**
 * AD-19: nâng tầng và chiếu giá trị lên `person` là MỘT thao tác trong một transaction, do
 * `core/assertion` làm. Ở đây chỉ gọi và làm mới số.
 */
export async function nangTang(assertionId: string): Promise<Result<void>> {
  const res = await promoteAssertion(assertionId);
  if (res.ok) lamMoiSo();
  return res;
}

/**
 * AD-4: giá trị thua rời DỮ LIỆU SỐNG nhưng ở lại NHẬT KÝ. Đây không phải xoá, và giao diện
 * không được gọi nó là xoá — `rejectAssertionOp` ghi nguyên hàng vào revision trước khi gỡ.
 */
export async function loaiKhangDinh(
  assertionId: string,
  ghiChu: string,
): Promise<Result<{ doiTuongId?: string }>> {
  const res = await rejectAssertion(assertionId, ghiChu);
  if (res.ok) lamMoiSo();
  return res;
}

/**
 * `'layout'` chứ không phải mặc định `'page'`: mọi lượt ghi làm đổi số trên "Hàng chờ khẳng định"
 * và "Mảnh chưa nối", mà con số ấy do `app/admin/layout.tsx` dựng, không phải trang này. Bài học
 * đã trả giá một lần ở `ghiVaoPha` (code review 5-1).
 */
/** AD-17 — ẩn theo báo cáo, không cần duyệt. Hàng chờ có khu "đã ẩn" nên làm mới cả layout. */
export async function anKhangDinh(assertionId: string, lyDo: string): Promise<Result<void>> {
  const res = await anKhangDinhChung(assertionId, lyDo);
  if (res.ok) lamMoiSo();
  return res;
}

function lamMoiSo(): void {
  revalidatePath('/admin', 'layout');
}

/** Ghi một người mới (story 5-4). Người mới vào tồn nghi ⇒ số "Hàng chờ khẳng định" vừa tăng. */
export async function themNguoi(moi: NguoiMoi): Promise<Result<{ personId: string }>> {
  const res = await ghiNguoiMoi(moi);
  if (res.ok) lamMoiSo();
  return res;
}

/** Ghi thêm một khẳng định cho người đã có (story 5-6). */
export async function ghiThemKhangDinh(
  personId: string,
  loai: LoaiGhiThem,
  giaTri: string,
  xuatXu: string,
): Promise<Result<{ assertionId: string }>> {
  const res = await ghiKhangDinh(personId, loai, giaTri, xuatXu);
  if (res.ok) lamMoiSo();
  return res;
}

/** Nối hai người ĐÃ CÓ (story 6-1). Cạnh mới đổi HÌNH của cây ⇒ số "Mảnh chưa nối" đổi theo. */
export async function ghiThemQuanHe(
  a: QuanHeMoi,
): Promise<Result<{ assertionId: string; alreadyLinked?: boolean }>> {
  const res = await ghiQuanHe(a);
  if (res.ok) lamMoiSo();
  return res;
}

/** Gõ tự do → ứng viên nơi (story 5-7). */
export async function timNoi(ten: string, donViCha: string): Promise<Result<UngVienNoiChon[]>> {
  return timNoiChon(ten, donViCha);
}

/** Tạo một nơi mới. */
export async function taoNoi(
  ten: string,
  donViCha: string,
): Promise<Result<{ placeId: string; nhan: string }>> {
  return taoNoiChon(ten, donViCha);
}

/** Gắn một nơi vào người. */
export async function ghiThemNoi(
  personId: string,
  placeId: string,
  vai: VaiNoi,
  xuatXu: string,
): Promise<Result<{ assertionId: string }>> {
  const res = await ghiNoi(personId, placeId, vai, xuatXu);
  if (res.ok) lamMoiSo();
  return res;
}
