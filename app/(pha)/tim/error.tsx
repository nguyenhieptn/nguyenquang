/**
 * LỖI Ở MÀN TÌM — chỉ cho lỗi KHÔNG dự kiến được (mạng, máy chủ). Kết quả rỗng, ngoài bán kính
 * riêng tư… đều là trạng thái tử tế của page.tsx, không bao giờ rơi xuống đây.
 *
 * Next 16: prop là `retry`, không phải `reset` (docs/next16-delta.md §8).
 * Giọng bề mặt A: không xưng hô, không xin lỗi, không từ công nghệ.
 */
'use client';

import { Button } from '@/components/ui/button';
import { DOC } from '@/components/pha/khung';
import { ThanhDieuHuong } from '@/components/pha/thanh-dieu-huong';

export default function LoiManTim({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <>
      <main className={`${DOC} pb-28 pt-7 md:pb-16 md:pt-28`}>
        <h1 className="font-[family-name:var(--font-pha)] text-[23px]">Chưa mở được trang tìm</h1>
        <p className="mt-2 text-[17px]">
          Trang gặp trục trặc, không phải do thao tác. Thử lại là được.
        </p>
        <Button type="button" onClick={() => retry()} className="mt-5 h-12 w-full text-[17px]">
          Thử lại
        </Button>
      </main>
      <ThanhDieuHuong hienTai="them" />
    </>
  );
}
