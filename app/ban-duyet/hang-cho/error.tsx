'use client';

/**
 * Biên lỗi của Hàng chờ duyệt. Next 16.3: prop tên là `retry` (không còn `reset` —
 * docs/next16-delta.md §8). Lỗi ở đây là lỗi hệ thống thật (mọi kết quả dự kiến được
 * core trả về bằng Result, không throw) — nên màn chỉ cần một đường thử lại.
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
    <main className="mx-auto max-w-[720px] px-6 py-16">
      <h1 className="text-[23px] font-semibold">Hàng chờ duyệt đang gặp trục trặc</h1>
      <p className="mt-2 text-[17px] text-muted-foreground">
        Chưa đọc được dữ liệu. Thử lại — không mất gì cả.
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
    </main>
  );
}
