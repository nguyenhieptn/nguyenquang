/** Skeleton của danh mục nơi. `<h1>` do layout dựng nên đã đứng sẵn. */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only">Đang đọc danh mục nơi chốn…</p>
      <div className="h-5 w-full max-w-[70ch] animate-pulse rounded-md bg-ban-vien" />
      <div className="mt-6 flex flex-col gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-md border border-ban-vien bg-ban-o" />
        ))}
      </div>
    </div>
  );
}
