'use client';

/**
 * Biên lỗi của màn cây. Next 16.3: prop tên là `retry` (không còn `reset` — docs/next16-delta.md §8).
 *
 * Biên này nằm TRONG khung `/admin`: layout cha vẫn dựng, nên thanh việc còn đứng và `<h1>` của
 * màn còn đó — chỗ này chỉ thêm một `<h2>` nói việc gì hỏng. Lỗi ném từ chính `app/admin/layout.tsx`
 * thì bay lên `app/error.tsx`, không rơi vào đây.
 */
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <>
      <h2 className="text-[19px] font-semibold">Chưa dựng được cây</h2>
      <p className="mt-2 max-w-[70ch] text-[17px] text-muted-foreground">
        Chưa đọc được cấu trúc phả. Thử lại — không có gì bị ghi, không mất gì cả.
        {error.digest ? ` Mã đối chiếu: ${error.digest}.` : ''}
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={() => retry()}
        className="mt-5 h-11 text-[17px]"
      >
        Thử lại
      </Button>
    </>
  );
}
