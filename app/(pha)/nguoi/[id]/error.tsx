'use client';

/**
 * Rào lỗi trang một người. Next 16: prop tên `retry` (đổi từ `reset` — docs/next16-delta.md §8).
 * Giọng bề mặt A: không xưng hô, không từ công nghệ, nền giấy tự thừa kế từ body.
 */
import { Button } from '@/components/ui/button';
import { DOC } from '@/components/pha/khung';

export default function Error({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className={`${DOC} pb-28 pt-10 md:pb-16 md:pt-28`}>
      <h1 className="font-[family-name:var(--font-pha)] text-[23px]">
        Trang này vừa gặp trục trặc
      </h1>
      <p className="mt-2 text-[17px] text-muted-foreground">
        Những gì đã ghi trong phả vẫn còn nguyên. Thử mở lại xem.
      </p>
      <Button type="button" onClick={() => retry()} className="mt-5 h-12 w-full text-[17px] md:w-auto md:px-8">
        Mở lại
      </Button>
    </main>
  );
}
