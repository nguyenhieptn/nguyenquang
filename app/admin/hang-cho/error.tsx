'use client';

/**
 * Biên lỗi của Hàng chờ duyệt. Next 16.3: prop tên là `retry` (không còn `reset` —
 * docs/next16-delta.md §8). Lỗi ở đây là lỗi hệ thống thật (mọi kết quả dự kiến được
 * core trả về bằng Result, không throw) — nên màn chỉ cần một đường thử lại.
 *
 * Biên lỗi này nằm TRONG khung `/admin`: layout cha vẫn dựng, nên thanh việc còn đứng và
 * `<h1>` của màn còn đó — chỗ này chỉ thêm `<h2>` nói việc gì hỏng.
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
      <h2 className="text-[19px] font-semibold">Hàng chờ duyệt đang gặp trục trặc</h2>
      <p className="mt-2 max-w-[70ch] text-[17px] text-muted-foreground">
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
    </>
  );
}
