'use server';

/**
 * Server action của khung `/admin`.
 *
 * Chỉ chuyển tiếp vào core (build-contract § Phân tầng): core tự đọc phiên (AD-24) và tự lọc
 * bán kính riêng tư (AD-13/AD-21) — action không thêm gì, không nới gì. Bàn làm việc KHÔNG có
 * đường tìm rộng hơn phần phả người vận hành được phép xem.
 *
 * Ruột ở `lib/ghi-pha.ts § timNguoiTrongPha` từ 6-10 — bộ chọn người của bề mặt thành viên
 * dùng cùng một lối tìm, không dựng đường đọc thứ hai.
 */
import type { KetQuaTim } from '@/components/admin/man-admin';
import { timNguoiTrongPha } from '@/lib/ghi-pha';

/** Tìm người cho ô tìm trên thanh trên. NÉM khi đọc hỏng — xem lý do ở `lib/ghi-pha.ts`. */
export async function timNguoi(tuKhoa: string): Promise<KetQuaTim[]> {
  return timNguoiTrongPha(tuKhoa);
}
