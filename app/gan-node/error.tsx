'use client';

/**
 * Biên lỗi màn nhận chỗ. Next 16 đổi tên prop `reset` → `retry` (docs/next16-delta.md §8).
 * Khối lỗi mang chàm, không son (son = "đã chốt"); giọng không xưng hô.
 */
import { DOC } from '@/components/pha/khung';

export default function Error({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className={`${DOC} pb-28 pt-7 md:pb-16 md:pt-28`}>
      <div className="rounded-md border-l-4 border-destructive bg-canh-bao-nen px-5 py-4">
        <p className="text-[17px] text-foreground">Màn này vừa gặp trục trặc, chưa mở được.</p>
        <button
          type="button"
          onClick={() => retry()}
          className="mt-4 inline-flex h-12 items-center rounded-md border border-border bg-background px-5 text-[17px] outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          Thử lại
        </button>
      </div>
    </main>
  );
}
