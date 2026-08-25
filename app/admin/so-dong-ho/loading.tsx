/** Skeleton của Sổ dòng họ. `<h1>` do layout dựng nên đã đứng sẵn. */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only">Đang đọc sổ dòng họ…</p>
      <div className="h-5 w-full max-w-[70ch] animate-pulse rounded-md bg-ban-vien" />
      <div className="mt-6 flex max-w-[52ch] flex-col gap-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-md bg-ban-o" />
        ))}
      </div>
    </div>
  );
}
