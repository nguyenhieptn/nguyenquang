'use client';

/**
 * Biên lỗi của màn NHÀ và của Nạp khung (hai màn không có `error.tsx` riêng).
 *
 * ⚠️ SỬA 24/08/2026 sau code review. Bản đầu ghi rằng file này bắt luôn lỗi ném từ chính
 * `app/admin/layout.tsx` và khi ấy sẽ chạy "không có khung". Cả hai vế đều SAI:
 *   · `error.js` KHÔNG bọc `layout.js` cùng segment với nó — lỗi của `app/admin/layout.tsx` bay
 *     lên `app/error.tsx` (nay đã có, đọc file ấy).
 *   · Nên file này LUÔN chạy bên trong khung: layout cha còn nguyên, thanh việc còn đứng, `<h1>`
 *     của màn đã ở trên đầu rồi.
 * Vì thế nó theo đúng nếp của hai file anh em (`hang-cho/error.tsx`, `hop-nhat/error.tsx`): một
 * `<h2>` trong fragment, không tự dựng nền, không tự dựng `<h1>`, không `min-h-dvh` (lồng một
 * khối 100dvh vào vùng cuộn đã 100dvh thì nút "Thử lại" tụt xuống dưới nếp gấp).
 *
 * Next 16.3: prop tên là `retry` (không còn `reset` — docs/next16-delta.md §8).
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
      <h2 className="text-[19px] font-semibold">Màn này đang gặp trục trặc</h2>
      <p className="mt-2 max-w-[70ch] text-[17px] text-muted-foreground">
        Chưa đọc được dữ liệu. Thử lại — không có gì bị ghi, không mất gì cả.
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
