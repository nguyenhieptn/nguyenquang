'use server';

/**
 * Server actions của màn Nơi chốn — sửa · gộp · tách (story 6-4, FR-65).
 *
 * Chuyển lời vào `core/place` (AD-24: core tự đọc phiên, tự gác `gateApprover`), trả `Result`
 * nguyên dạng. AD-23: danh mục đổi theo từng mutation ⇒ `revalidatePath` sau khi xong.
 */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { mergePlaces, unmergePlace, updatePlace, type KetQuaGopNoi, type NoiChon } from '@/core/place';
import { err, type Result } from '@/core/types';

const DUONG = '/admin/noi-chon';

/**
 * Tham số của server action là NGƯỜI GỌI gửi — một POST tự dựng có thể gửi số, null, mảng. Kiểm
 * kiểu trước khi `.trim()`, kẻo `TypeError` thoát khỏi hợp đồng Result thành 500 trước cả cổng
 * quyền (code review 6-4, 29/08).
 */
const laChuoi = (...xs: unknown[]): boolean => xs.every((x) => typeof x === 'string');

/** Phiên hết hạn trên một màn `force-dynamic` mở lâu: về cửa đăng nhập, như mọi màn anh em. */
function veCuaNeuHetPhien<T>(r: Result<T>): Result<T> {
  if (!r.ok && r.error.code === 'unauthenticated') redirect('/dang-nhap');
  if (r.ok) revalidatePath(DUONG);
  return r;
}

export async function suaNoi(
  placeId: string,
  name: string,
  parentUnit: string,
): Promise<Result<NoiChon>> {
  if (!laChuoi(placeId, name, parentUnit)) return err('invalid', 'Tham số không hợp lệ.');
  if (!placeId.trim()) return err('invalid', 'Thiếu mã nơi.');
  return veCuaNeuHetPhien(await updatePlace({ placeId: placeId.trim(), name, parentUnit }));
}

export async function gopNoi(loserId: string, winnerId: string): Promise<Result<KetQuaGopNoi>> {
  if (!laChuoi(loserId, winnerId)) return err('invalid', 'Tham số không hợp lệ.');
  if (!loserId.trim() || !winnerId.trim()) return err('invalid', 'Chưa chọn đủ hai nơi.');
  return veCuaNeuHetPhien(await mergePlaces(loserId.trim(), winnerId.trim()));
}

export async function tachNoi(placeId: string): Promise<Result<NoiChon>> {
  if (!laChuoi(placeId)) return err('invalid', 'Tham số không hợp lệ.');
  if (!placeId.trim()) return err('invalid', 'Thiếu mã nơi.');
  return veCuaNeuHetPhien(await unmergePlace(placeId.trim()));
}
