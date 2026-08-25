'use client';

/**
 * Biên lỗi GỐC của cả ứng dụng — và đây là chỗ lỗi của `app/admin/layout.tsx` thật sự rơi vào.
 *
 * ── Vì sao file này phải tồn tại ────────────────────────────────────────────────────────────
 * `error.js` bọc `page.js`, `loading.js`, `not-found.js` và những `layout.js` NẰM DƯỚI nó, nhưng
 * KHÔNG bọc `layout.js` cùng segment với nó (`next/dist/docs/…/file-conventions/error.md` §
 * "component hierarchy"). Nên `app/admin/error.tsx` không thể bắt lỗi của `app/admin/layout.tsx`
 * — mà layout ấy lại là chỗ chạy ba lượt đọc cơ sở dữ liệu cho mọi màn admin, tức chỗ dễ ném
 * nhất. Trước khi có file này, một lượt Postgres chết là mọi URL `/admin/*` rơi thẳng vào trang
 * 500 trần của Next: tiếng Anh, không nút thử lại, không đường về.
 *
 * File này nằm ở `app/`, tức TRÊN `app/admin/layout.tsx` một bậc, nên nó bắt được. Root layout
 * vẫn dựng, nghĩa là font và `globals.css` còn nguyên — khác hẳn `global-error.tsx` (xem file
 * ấy), thứ chỉ dùng khi chính root layout hỏng.
 *
 * Next 16.3: prop tên là `retry` (không còn `reset` — docs/next16-delta.md §8).
 */
import Link from 'next/link';

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="font-[family-name:var(--font-pha)] text-[23px] text-foreground">
        Chưa mở được trang này
      </p>
      <p className="max-w-[60ch] text-[17px] leading-relaxed text-muted-foreground">
        Trục trặc nằm ở phía máy, không phải ở dữ liệu. Thử lại — không có gì bị ghi, không mất gì
        cả.
        {error.digest ? ` Mã đối chiếu: ${error.digest}.` : ''}
      </p>
      <div className="flex flex-col items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => retry()}
          className="min-h-11 rounded-md bg-primary px-6 py-3 text-[17px] font-medium text-primary-foreground"
        >
          Thử lại
        </button>
        <Link
          href="/"
          className="min-h-11 text-[17px] text-muted-foreground underline underline-offset-4"
        >
          Về trang chủ
        </Link>
      </div>
    </main>
  );
}
