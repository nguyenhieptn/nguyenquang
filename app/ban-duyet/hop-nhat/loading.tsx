/**
 * Skeleton của bàn hợp nhất — màn này đọc gợi ý trùng RỒI đọc đường-về-gốc cho từng ứng
 * viên (tới 40 lần đọc cây), là màn chậm thật sự của bề mặt B nên mới có loading.tsx.
 * Tông theo khung trần của bàn duyệt (ban-*), không phải giấy dó của bề mặt A.
 */
export default function Loading() {
  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10" aria-busy="true">
      <p className="sr-only">Đang soạn bàn hợp nhất…</p>
      <div className="h-8 w-56 animate-pulse rounded-md bg-ban-vien" />
      <div className="mt-3 h-5 w-full max-w-[36rem] animate-pulse rounded-md bg-ban-vien" />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-44 animate-pulse rounded-md border border-ban-vien bg-ban-o" />
        ))}
      </div>
      <div className="mt-10 h-6 w-72 animate-pulse rounded-md bg-ban-vien" />
      <div className="mt-5 grid gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-md border border-ban-vien bg-ban-o" />
        ))}
      </div>
    </main>
  );
}
