'use server';

/**
 * Server actions của Hợp nhất mảnh (story 3-4, FR-48).
 *
 * Gọi core/merge (index — AD-24: core tự resolve session), trả Result nguyên dạng.
 * Vòng đời AD-22: ai đã gắn node cũng ĐỀ XUẤT được; gộp, bác, tách lại cần quyền duyệt
 * (quản trị | đầu mối chi) — core tự gác, đây chỉ chuyển lời.
 * AD-23: dữ liệu động → revalidatePath sau mutation thành công.
 */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  executeMerge,
  proposeMerge,
  rejectProposal,
  unmerge,
  type DuplicateEvidence,
  type ExecuteMergeOutcome,
} from '@/core/merge';
import { err, type Result } from '@/core/types';

const DUONG = '/ban-duyet/hop-nhat';

export type KetQuaDeXuat = Result<{ proposalId: string; evidence: DuplicateEvidence }>;

/**
 * Mở một đề xuất gộp (proposeMerge) — đề xuất KHÔNG gộp gì (AD-22): gộp là bước sau,
 * của người có quyền duyệt. Chữ ký (prev, formData) để dùng thẳng với useActionState.
 */
export async function deXuatGop(_truoc: KetQuaDeXuat | null, formData: FormData): Promise<KetQuaDeXuat> {
  const aId = String(formData.get('aId') ?? '');
  const bId = String(formData.get('bId') ?? '');
  const winnerId = String(formData.get('winnerId') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();
  if (!aId || !bId || (winnerId !== aId && winnerId !== bId)) {
    return err('invalid', 'chưa chọn hồ sơ giữ làm chính');
  }
  if (!reason) return err('invalid', 'cần ghi lý do đề xuất');
  const loserId = winnerId === aId ? bId : aId;
  const ketQua = await proposeMerge(winnerId, loserId, reason);
  if (!ketQua.ok && ketQua.error.code === 'unauthenticated') redirect('/dang-nhap');
  // Cặp đã có đề xuất mở sẽ rời danh sách "máy thấy giống nhau" — làm mới để bảng nói thật.
  if (ketQua.ok) revalidatePath(DUONG);
  return ketQua;
}

/** Gộp một đề xuất đang mở (executeMerge) — MỘT transaction, ghi trọn danh sách mối nối (AD-3). */
export async function gopDeXuat(proposalId: string): Promise<Result<ExecuteMergeOutcome>> {
  if (!proposalId.trim()) return err('invalid', 'thiếu mã đề xuất');
  const ketQua = await executeMerge(proposalId.trim());
  if (!ketQua.ok && ketQua.error.code === 'unauthenticated') redirect('/dang-nhap');
  if (ketQua.ok) revalidatePath(DUONG);
  return ketQua;
}

/** "Không phải một người" = rejectProposal, kèm ghi chú — phán quyết cũng là dữ liệu. */
export async function khongPhaiMotNguoi(proposalId: string, ghiChu: string): Promise<Result<void>> {
  if (!proposalId.trim()) return err('invalid', 'thiếu mã đề xuất');
  if (!ghiChu.trim()) return err('invalid', 'cần ghi chú vì sao là hai người khác nhau');
  const ketQua = await rejectProposal(proposalId.trim(), ghiChu.trim());
  if (!ketQua.ok && ketQua.error.code === 'unauthenticated') redirect('/dang-nhap');
  if (ketQua.ok) revalidatePath(DUONG);
  return ketQua;
}

/** Tách lại (unmerge) — đảo đúng một lần gộp từ danh sách mối nối đã ghi trong nhật ký. */
export async function tachLai(
  proposalId: string,
): Promise<Result<{ winnerId: string; loserId: string; reversed: number }>> {
  if (!proposalId.trim()) return err('invalid', 'thiếu mã đề xuất');
  const ketQua = await unmerge(proposalId.trim());
  if (!ketQua.ok && ketQua.error.code === 'unauthenticated') redirect('/dang-nhap');
  if (ketQua.ok) revalidatePath(DUONG);
  return ketQua;
}
