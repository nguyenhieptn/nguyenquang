'use client';
/**
 * Rào lỗi của luồng thêm. Next 16: prop là `retry` (đổi tên từ `reset` — docs/next16-delta §8).
 * Giọng bề mặt A: không xưng hô, không từ kỹ thuật; lỗi là chuyện của màn, không phải của người.
 */
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Loi({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-md px-5 pb-28 pt-10 md:max-w-lg md:pt-28">
      <h1 className="font-[family-name:var(--font-pha)] text-[23px]">Màn này chưa mở được</h1>
      <p className="mt-2 text-[17px] text-muted-foreground">
        Có trục trặc khi dựng trang. Điều đã khai chưa mất — thử lại một lần, nếu vẫn vậy thì
        về trang chủ rồi quay lại sau.
      </p>
      <div className="mt-6 grid gap-2.5">
        <Button type="button" onClick={() => retry()} className="h-12 w-full text-[17px]">
          Thử lại
        </Button>
        <Button asChild variant="outline" className="h-12 w-full text-[17px]">
          <Link href="/">Về trang chủ</Link>
        </Button>
      </div>
    </main>
  );
}
