/**
 * Skeleton của màn cây. Màn này chạy `loadTreeData` + `computeStructure` trên cả dòng họ rồi mới
 * BFS, nên nó là màn chậm thứ hai của bàn sau Hợp nhất.
 *
 * Không có vạch giả cho tiêu đề: `<h1>` do layout dựng nên nó ĐÃ đứng sẵn khi màn này hiện.
 */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only">Đang dựng cây quanh người này…</p>
      <div className="h-11 w-72 animate-pulse rounded-md bg-ban-vien" />
      <div className="mt-6 h-[60dvh] animate-pulse rounded-md border border-ban-vien bg-ban-o" />
    </div>
  );
}
