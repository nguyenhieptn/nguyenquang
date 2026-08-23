/**
 * /ban-duyet/nap-khung — Nạp khung dòng họ (FR-51), kiêm luôn xem trước + ghi (FR-48, FR-63).
 *
 * Vì sao MỘT trang cho cả ba pha: xem ghi chú đầu `actions.ts` và `nap-khung-client.tsx` —
 * không có chỗ lưu tệp tạm server-side trong core/seed, nên văn bản CSV sống trong state
 * client giữa hai lần gọi (xem trước → ghi), và URL đứng yên ở đây.
 *
 * Server component chỉ lo chrome (ThanhBanDuyet + nhãn người vận hành, FR-39); quyền đã
 * được layout gác, core gác lại lần nữa trong từng action (AD-24).
 */
import type { Metadata } from 'next';
import { ThanhBanDuyet } from '@/components/pha/thanh-ban-duyet';
import { NapKhungClient } from './nap-khung-client';
import { nhanNguoiVanHanh } from './nguoi-van-hanh';

export const metadata: Metadata = { title: 'Nạp khung — Bàn duyệt' };

export default async function NapKhungPage() {
  const nguoiVanHanh = await nhanNguoiVanHanh();
  return (
    <>
      <ThanhBanDuyet hienTai="nap-khung" nguoiVanHanh={nguoiVanHanh} />
      <NapKhungClient />
    </>
  );
}
