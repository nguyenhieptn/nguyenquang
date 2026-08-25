'use client';

/**
 * Lưới cuối cùng: chính `app/layout.tsx` ném lỗi. Hiếm, nhưng khi xảy ra thì không còn biên nào
 * ở dưới đỡ được, và Next thay luôn root layout bằng file này.
 *
 * ── Vì sao style viết thẳng vào thuộc tính, không dùng lớp Tailwind ─────────────────────────
 * `next/dist/docs/…/file-conventions/error.md` § Global Error: *"`global-error` and the built-in
 * 500 page render their own document and do **not** include your global styles"*. Nghĩa là
 * `globals.css` KHÔNG tới đây, mọi token màu (`--ban-nen`, `--foreground`) đều không tồn tại, và
 * font đã nạp ở root layout cũng vậy. Viết bằng lớp Tailwind ở đây là viết ra một màn trắng trơn.
 * File này vì thế cố ý tự chứa, và cố ý ngắn.
 *
 * `metadata` không dùng được trong biên lỗi (phải là Client Component) — tiêu đề đặt bằng thẻ
 * `<title>` của React, đúng như docs chỉ.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="vi">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.25rem',
          padding: '0 1.5rem',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#faf8f4',
          color: '#1c1917',
        }}
      >
        <title>Tộc phả</title>
        <p style={{ fontSize: '23px', margin: 0 }}>Trang không mở được</p>
        <p style={{ fontSize: '17px', lineHeight: 1.6, margin: 0, maxWidth: '60ch', color: '#57534e' }}>
          Trục trặc nằm ở phía máy. Thử lại — không có gì bị ghi, không mất gì cả.
          {error.digest ? ` Mã đối chiếu: ${error.digest}.` : ''}
        </p>
        <button
          type="button"
          onClick={() => retry()}
          style={{
            minHeight: '44px',
            padding: '0 1.5rem',
            fontSize: '17px',
            borderRadius: '6px',
            border: '1px solid #d6d3d1',
            background: '#fff',
            color: 'inherit',
            cursor: 'pointer',
          }}
        >
          Thử lại
        </button>
      </body>
    </html>
  );
}
