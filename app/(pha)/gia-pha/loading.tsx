/**
 * KHUNG CHỜ màn cây — nơi duy nhất của bề mặt A được phép có loading.tsx: ba màn cây dựng cả
 * cấu trúc phả lúc đọc (AD-5, không cache — AD-23), nên trên 4G ở quê có thể chậm thấy được.
 *
 * Chất liệu giấy: các ô nhịp theo bố cục thật (đầu trang + các hàng đời), nền ô nổi + viền,
 * KHÔNG đổ bóng, không xám lạ — để lúc dữ liệu về, trang không đổi da.
 */
import { KHUNG } from '@/components/pha/khung';
import { ThanhDieuHuong } from '@/components/pha/thanh-dieu-huong';

function O({ lop }: { lop: string }) {
  return <div aria-hidden className={`animate-pulse rounded-md border border-border bg-card ${lop}`} />;
}

export default function Loading() {
  return (
    <>
      <main className="flex-1 pb-28 pt-7 md:pb-16 md:pt-28">
        <div className={KHUNG} role="status" aria-label="Đang mở cây">
          <O lop="h-5 w-32" />
          <O lop="mt-4 h-9 w-56" />
          <div className="mt-6 space-y-3">
            <O lop="h-24" />
            <O lop="h-14" />
            <O lop="h-14" />
            <O lop="h-14" />
          </div>
          <p className="sr-only">Đang mở cây…</p>
        </div>
      </main>
      <ThanhDieuHuong hienTai="gia-pha" />
    </>
  );
}
