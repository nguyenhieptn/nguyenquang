/**
 * Skeleton của bàn hợp nhất — màn này đọc gợi ý trùng RỒI đọc đường-về-gốc cho từng ứng
 * viên (tới 40 lần đọc cây), là màn chậm thật sự của bề mặt B nên mới có loading.tsx.
 * Tông theo khung trần của bàn làm việc (ban-*), không phải giấy dó của bề mặt A.
 *
 * Không có vạch giả cho tiêu đề: `<h1>` do layout dựng nên nó ĐÃ đứng sẵn khi màn này hiện —
 * cùng lý do thanh việc không nhấp nháy. Skeleton chỉ đứng chỗ phần đang đọc.
 */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only">Đang soạn bàn hợp nhất…</p>
      <div className="h-5 w-full max-w-[62ch] animate-pulse rounded-md bg-ban-vien" />
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
    </div>
  );
}
