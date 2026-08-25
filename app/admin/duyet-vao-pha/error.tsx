'use client';

/**
 * Biên lỗi của màn Duyệt vào phả. Next 16.3: prop là `retry`, không phải `reset`.
 * Nằm TRONG khung `/admin` nên layout còn nguyên — chỗ này chỉ thêm một `<h2>`.
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
      <h2 className="text-[19px] font-semibold">Chưa đọc được danh sách</h2>
      <p className="mt-2 max-w-[70ch] text-[17px] text-muted-foreground">
        Thử lại — không có gì bị ghi, không mất gì cả.
        {error.digest ? ` Mã đối chiếu: ${error.digest}.` : ''}
      </p>
      <Button type="button" variant="outline" onClick={() => retry()} className="mt-5 h-11 text-[17px]">
        Thử lại
      </Button>
    </>
  );
}
