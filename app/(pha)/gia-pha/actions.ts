'use server';

/**
 * Server actions của "Phả quanh mình" — bề mặt A, người trong họ (story 6-10).
 *
 * Vỏ `'use server'` mỏng trên `lib/ghi-pha.ts`, cùng ruột với `app/admin/cay/actions.ts`. Hai
 * khác biệt, cả hai đều CỐ Ý:
 *
 *   1. **Không có lối duyệt.** `nangTang` và `loaiKhangDinh` không tồn tại ở đây. Core vẫn gác
 *      bằng `gateApprover` nên thiếu chúng không phải là hàng rào — nhưng một bề mặt không bày
 *      thứ nó không cho làm thì không dạy sai mô hình: duyệt là việc của ban tu phả, ở `/admin`.
 *   2. **Làm mới `/gia-pha`**, không phải `/admin`. Số trên thanh việc của bàn tu phả vẫn đổi —
 *      trang ấy `force-dynamic` nên lượt mở kế tiếp đọc lại.
 *
 * Quyền do core tự gác (`gateWriter`): khách và tài khoản chưa gắn chỗ bị chặn ở tầng ấy, kể cả
 * khi POST thẳng (AD-24).
 */
import { revalidatePath } from 'next/cache';
import type { LoaiGhiThem } from '@/components/admin/loai-ghi-them';
import type { KetQuaTim } from '@/components/admin/man-admin';
import type { UngVienNoiChon } from '@/core/place';
import type { Result } from '@/core/types';
import {
  docHoSo,
  ghiKhangDinh,
  ghiNguoiMoi,
  ghiNoi,
  ghiQuanHe,
  taoNoiChon,
  timNguoiTrongPha,
  timNoiChon,
  type HoSoNguoi,
  type NguoiMoi,
  type QuanHeMoi,
  type VaiNoi,
} from '@/lib/ghi-pha';

export type { ChipQuanHe, HoSoNguoi, NguoiMoi, QuanHeMoi, VaiNoi } from '@/lib/ghi-pha';

function lamMoi(): void {
  revalidatePath('/gia-pha');
}

export async function xemHoSo(personId: string): Promise<Result<HoSoNguoi>> {
  return docHoSo(personId);
}

export async function timNguoi(tuKhoa: string): Promise<KetQuaTim[]> {
  return timNguoiTrongPha(tuKhoa);
}

export async function themNguoi(moi: NguoiMoi): Promise<Result<{ personId: string }>> {
  const res = await ghiNguoiMoi(moi);
  if (res.ok) lamMoi();
  return res;
}

export async function ghiThemKhangDinh(
  personId: string,
  loai: LoaiGhiThem,
  giaTri: string,
  xuatXu: string,
): Promise<Result<{ assertionId: string }>> {
  const res = await ghiKhangDinh(personId, loai, giaTri, xuatXu);
  if (res.ok) lamMoi();
  return res;
}

export async function ghiThemQuanHe(
  a: QuanHeMoi,
): Promise<Result<{ assertionId: string; alreadyLinked?: boolean }>> {
  const res = await ghiQuanHe(a);
  if (res.ok) lamMoi();
  return res;
}

export async function timNoi(ten: string, donViCha: string): Promise<Result<UngVienNoiChon[]>> {
  return timNoiChon(ten, donViCha);
}

export async function taoNoi(
  ten: string,
  donViCha: string,
): Promise<Result<{ placeId: string; nhan: string }>> {
  return taoNoiChon(ten, donViCha);
}

export async function ghiThemNoi(
  personId: string,
  placeId: string,
  vai: VaiNoi,
  xuatXu: string,
): Promise<Result<{ assertionId: string }>> {
  const res = await ghiNoi(personId, placeId, vai, xuatXu);
  if (res.ok) lamMoi();
  return res;
}
