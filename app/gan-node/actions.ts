'use server';

/**
 * Server actions của màn nhận chỗ (story 2-2, FR-64/AD-8).
 *
 * Chỉ chuyển tiếp vào core và trả `Result` NGUYÊN VẸN cho UI (build-contract § Phân tầng):
 * core tự đọc phiên (AD-24), tự lọc bán kính riêng tư (AD-13/16) — action không thêm gì,
 * không dịch gì. Việc dịch mã lỗi thành lời bề mặt A là của component.
 */
import { requestAttachment } from '@/core/identity';
import { searchPersons, type SearchHit } from '@/core/tree';
import type { Result } from '@/core/types';

/** Tìm chính mình theo tên — so khớp không dấu/cận âm của core/so-khop (AD-16, NFR-9). */
export async function timChinhMinh(tuKhoa: string): Promise<Result<SearchHit[]>> {
  return searchPersons(tuKhoa);
}

/** Hành vi bảo lãnh (AD-8): xin nhận một chỗ trong phả; nằm 'pending' tới khi được xác nhận. */
export async function nhanChoTrongPha(
  personId: string,
): Promise<Result<{ attachmentId: string }>> {
  return requestAttachment(personId);
}
