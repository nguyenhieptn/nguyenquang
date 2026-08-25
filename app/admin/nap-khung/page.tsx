/**
 * /admin/nap-khung — Nạp khung dòng họ (FR-51), kiêm luôn xem trước + ghi (FR-48, FR-63).
 *
 * Vì sao MỘT trang cho cả ba pha: xem ghi chú đầu `actions.ts` và `nap-khung-client.tsx` —
 * không có chỗ lưu tệp tạm server-side trong core/seed, nên văn bản CSV sống trong state
 * client giữa hai lần gọi (xem trước → ghi), và URL đứng yên ở đây.
 *
 * Trang không dựng chrome nữa: thanh trên, thanh việc và `<h1>` là của `app/admin/layout.tsx`.
 * Quyền đã được layout gác, core gác lại lần nữa trong từng action (AD-24).
 */
import type { Metadata } from 'next';
import { tieuDeThe } from '@/components/admin/man-admin';
import { NapKhungClient } from './nap-khung-client';

// Cùng một nguồn với nhãn thanh việc và `<h1>` — trước đây chuỗi này tự viết nên đã lệch khỏi
// `tieuDe` trong bảng màn ('Nạp khung' vs 'Nạp khung dòng họ').
export const metadata: Metadata = { title: tieuDeThe('nap-khung') };

export default function NapKhungPage() {
  return <NapKhungClient />;
}
