'use server';

/**
 * Server actions của màn Nơi chốn — sửa · gộp · tách (story 6-4, FR-65).
 *
 * Chuyển lời vào `core/place` (AD-24: core tự đọc phiên, tự gác `gateApprover`), trả `Result`
 * nguyên dạng. AD-23: danh mục đổi theo từng mutation ⇒ `revalidatePath` sau khi xong.
 */
import { revalidatePath } from 'next/cache';
import { mergePlaces, unmergePlace, updatePlace, type KetQuaGopNoi, type NoiChon } from '@/core/place';
import { err, type Result } from '@/core/types';

const DUONG = '/admin/noi-chon';

export async function suaNoi(
  placeId: string,
  name: string,
  parentUnit: string,
): Promise<Result<NoiChon>> {
  if (!placeId.trim()) return err('invalid', 'Thiếu mã nơi.');
  const r = await updatePlace({ placeId: placeId.trim(), name, parentUnit });
  if (r.ok) revalidatePath(DUONG);
  return r;
}

export async function gopNoi(loserId: string, winnerId: string): Promise<Result<KetQuaGopNoi>> {
  if (!loserId.trim() || !winnerId.trim()) return err('invalid', 'Chưa chọn đủ hai nơi.');
  const r = await mergePlaces(loserId.trim(), winnerId.trim());
  if (r.ok) revalidatePath(DUONG);
  return r;
}

export async function tachNoi(placeId: string): Promise<Result<NoiChon>> {
  if (!placeId.trim()) return err('invalid', 'Thiếu mã nơi.');
  const r = await unmergePlace(placeId.trim());
  if (r.ok) revalidatePath(DUONG);
  return r;
}
