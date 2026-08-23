'use client';

/**
 * Biên lỗi của bàn hợp nhất. Next 16.3: prop tên là `retry` (không còn `reset` —
 * docs/next16-delta.md §8). Mọi kết quả dự kiến core trả bằng Result — rơi vào đây
 * là lỗi hệ thống thật, chỉ cần một đường thử lại.
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
      <h1 className="text-[23px] font-semibold">Bàn hợp nhất đang gặp trục trặc</h1>
      <p className="mt-2 text-[17px] text-muted-foreground">
        Chưa đọc được dữ liệu. Thử lại — chưa gộp gì thì không mất gì.
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
