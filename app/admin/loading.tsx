/**
 * Skeleton của KHỐI NỘI DUNG bàn làm việc.
 *
 * ── Nó che gì, và KHÔNG che gì ─────────────────────────────────────────────────────────────
 * `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md`:
 *
 *   > `loading.js` wraps `not-found.js`, `page.js`, and nested `layout.js` files in a
 *   > `<Suspense>` boundary. It does **not** wrap the `layout.js` … in the same segment.
 *
 * Nên file này che khoảng chờ của TRANG, không che khoảng chờ của `app/admin/layout.tsx`. Bản
 * trước dựng cả một bộ chrome giả — thanh trên, ray trái, khối nội dung — với lời hứa ở đầu file
 * là che lượt đọc của chính layout. Hai chỗ sai cùng lúc: khoảng ấy nó không che được, còn khi
 * nó hiện thì chrome thật ĐÃ đứng sẵn quanh nó, nên người dùng thấy hai thanh trên và hai ray
 * lồng nhau.
 *
 * Khoảng chờ của layout (`getClanOverview()` — một lượt `loadTreeData` trên cả dòng họ) vẫn còn
 * đó, và cách chữa THẬT là dời lượt đọc ấy khỏi layout hoặc bọc nó trong `<Suspense>` riêng —
 * đúng như đoạn "Good to know" ngay dưới câu trích trên. Ghi vào `deferred-work.md`, không giả
 * vờ chữa bằng một tấm skeleton không đúng chỗ.
 *
 * `<h1>` do layout dựng và đã có chữ thật, nên ở đây không dựng lại.
 */
export default function Loading() {
  return (
    <div aria-busy="true" className="flex min-h-0 flex-1 flex-col">
      <p className="sr-only">Đang mở màn…</p>
      <div className="min-h-44 flex-1 animate-pulse rounded-md border border-ban-vien bg-ban-o" />
    </div>
  );
}
