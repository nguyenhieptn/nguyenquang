'use client';

/**
 * Ranh giới lỗi của mục Gia phả. Next 16 đổi tên prop: `retry`, KHÔNG còn `reset`
 * (docs/next16-delta.md §8) — viết `reset` thì nhận undefined và nút chết lặng.
 *
 * Giọng: không xưng hô, không từ công nghệ (bề mặt A). Không băng-rôn đỏ — son chỉ dành cho
 * "đã chốt"/hành động chính, và ở màn này hành động chính là thử mở lại.
 */
import { DOC } from '@/components/pha/khung';
import { ThanhDieuHuong } from '@/components/pha/thanh-dieu-huong';

export default function Error({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <>
      <main className="flex-1 pb-28 pt-7 md:pb-8 md:pt-[5.5rem]">
        <div className={DOC}>
          <h1 className="font-[family-name:var(--font-pha)] text-[23px]">Gia phả</h1>
          <div className="mt-6 rounded-md border border-border bg-card px-5 py-6">
            <p className="text-[17px] leading-relaxed">
              Chưa mở được trang này — có thể mạng đang chậm. Cuốn phả vẫn còn nguyên, thử mở
              lại xem.
            </p>
            <button
              type="button"
              onClick={() => retry()}
              className="mt-5 min-h-11 rounded-md bg-primary px-5 py-3 text-[17px] text-primary-foreground"
            >
              Mở lại
            </button>
          </div>
        </div>
      </main>
      <ThanhDieuHuong hienTai="gia-pha" />
    </>
  );
}
