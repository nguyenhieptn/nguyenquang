/**
 * KHUNG CHỜ màn cây — nơi duy nhất của bề mặt A được phép có loading.tsx: ba màn cây dựng cả
 * cấu trúc phả lúc đọc (AD-5, không cache — AD-23), nên trên 4G ở quê có thể chậm thấy được.
 *
 * Nhịp theo HÌNH THẬT của "Phả quanh mình" (story 6-10, sửa ở 7-6 — nợ 6-10): trên máy là canvas
 * + cột phải 360px; trên điện thoại là các hàng theo đời và tấm phiếu trượt lên từ dưới. Khung chờ
 * lệch hình thì lúc dữ liệu về trang giật một nhịp — đúng thứ khung chờ sinh ra để tránh.
 *
 * Chất liệu giấy: ô nổi + viền, KHÔNG đổ bóng, không xám lạ — để lúc dữ liệu về, trang không đổi da.
 */
import { KHUNG } from '@/components/pha/khung';
import { ThanhDieuHuong } from '@/components/pha/thanh-dieu-huong';

function O({ lop }: { lop: string }) {
  return <div aria-hidden className={`animate-pulse rounded-md border border-border bg-card ${lop}`} />;
}

export default function Loading() {
  return (
    <>
      <main className="flex-1 pb-28 pt-7 md:pb-4 md:pt-[5.5rem]">
        <div className={KHUNG} role="status" aria-label="Đang mở phả quanh mình">
          {/* Điện thoại: ba hàng đời (đời trên · đời mình · đời dưới), mỗi hàng vài thẻ ngang. */}
          <div className="space-y-5 md:hidden">
            {[3, 4, 2].map((n, i) => (
              <div key={i}>
                <O lop="h-5 w-24" />
                <div className="mt-2 flex gap-2 overflow-hidden">
                  {Array.from({ length: n }).map((_, j) => (
                    <O key={j} lop="h-20 w-36 shrink-0" />
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Máy: canvas trái + cột phải 360px, cùng chiều cao với khung thật. */}
          <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_360px] md:gap-4">
            <O lop="h-[clamp(460px,calc(100dvh-14rem),1000px)]" />
            <div className="space-y-3">
              <O lop="h-11" />
              <O lop="h-8 w-2/3" />
              <O lop="h-24" />
              <O lop="h-24" />
              <O lop="h-24" />
            </div>
          </div>
          <p className="sr-only">Đang mở phả quanh mình…</p>
        </div>
      </main>
      <ThanhDieuHuong hienTai="gia-pha" />
    </>
  );
}
