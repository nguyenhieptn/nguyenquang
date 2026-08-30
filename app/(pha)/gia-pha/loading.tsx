/**
 * KHUNG CHỜ của đoạn `/gia-pha/**` — nơi duy nhất của bề mặt A được phép có loading.tsx: các màn
 * cây dựng cả cấu trúc phả lúc đọc (AD-5, không cache — AD-23), nên trên 4G ở quê có thể chậm thấy được.
 *
 * MỘT tệp phục vụ BỐN màn (`/gia-pha` — Phả quanh mình hoặc chi đầu khi chưa gắn — · `ca-toc` ·
 * `chi/[id]` · `duong-cua-toi`), nên nó nhịp theo cái CHUNG: một hàng đầu trang trong KHUNG, rồi
 * khối cây trong RONG (không giới hạn bề ngang — canvas thật tràn hết, skeleton hẹp hơn là giật
 * ngang). Điện thoại: các thẻ xếp DỌC, trọn bề ngang (`hang-doi-quanh-minh.tsx`), không phải dải
 * ngang. Máy: canvas + cột phải 360px với đúng clamp của `quanh-minh-client.tsx` (520 / −13rem).
 * (Sửa ở story 7-6 sau code review — bản đầu vẽ dải thẻ ngang và bỏ hàng đầu trang.)
 *
 * Chất liệu giấy: ô nổi + viền, KHÔNG đổ bóng, không xám lạ — để lúc dữ liệu về, trang không đổi da.
 */
import { KHUNG, RONG } from '@/components/pha/khung';
import { ThanhDieuHuong } from '@/components/pha/thanh-dieu-huong';

function O({ lop }: { lop: string }) {
  return <div aria-hidden className={`animate-pulse rounded-md border border-border bg-card ${lop}`} />;
}

export default function Loading() {
  return (
    <>
      <main className="flex-1 pb-28 pt-7 md:pb-4 md:pt-[5.5rem]" role="status" aria-label="Đang mở cây">
        <div className={KHUNG}>
          {/* Hàng đầu trang: liên kết nhỏ + tiêu đề — cùng nhịp cả bốn màn. */}
          <O lop="h-11 w-40" />
          <O lop="mt-2 h-8 w-64 md:hidden" />
        </div>
        <div className={`${RONG} mt-3`}>
          {/* Điện thoại: ba nhóm đời, mỗi nhóm vài thẻ trọn bề ngang xếp dọc. */}
          <div className="space-y-5 md:hidden">
            {[2, 3, 2].map((n, i) => (
              <div key={i}>
                <O lop="h-5 w-24" />
                <div className="mt-2 space-y-2">
                  {Array.from({ length: n }).map((_, j) => (
                    <O key={j} lop="block h-20 w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Máy: canvas trái + cột phải 360px. */}
          <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_360px] md:gap-4">
            <O lop="h-[clamp(520px,calc(100dvh-13rem),1000px)]" />
            <div className="space-y-3">
              <O lop="h-11" />
              <O lop="h-8 w-2/3" />
              <O lop="h-24" />
              <O lop="h-24" />
              <O lop="h-24" />
            </div>
          </div>
          <p className="sr-only">Đang mở cây…</p>
        </div>
      </main>
      <ThanhDieuHuong hienTai="gia-pha" />
    </>
  );
}
