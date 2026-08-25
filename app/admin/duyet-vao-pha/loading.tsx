/** Skeleton của màn Duyệt vào phả. `<h1>` do layout dựng nên đã đứng sẵn. */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only">Đang đọc danh sách người xin vào phả…</p>
      <div className="h-5 w-full max-w-[62ch] animate-pulse rounded-md bg-ban-vien" />
      <div className="mt-6 flex flex-col gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-md border border-ban-vien bg-ban-o" />
        ))}
      </div>
    </div>
  );
}
