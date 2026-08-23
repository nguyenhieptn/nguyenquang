/**
 * KHUNG CHỜ TRANG CHỦ — màu giấy, đúng bố cục thật để không xô trang khi dữ liệu tới.
 *
 * Có mặt vì trang chủ dựng từ ba lời gọi core đều phải dựng lại cấu trúc cây lúc đọc (AD-5):
 * đường về cụ, tổng quan tộc, nhật ký vừa vào phả. Trên 4G ở quê (NFR-5) khoảng chờ ấy có thật.
 *
 * Thuần sắc độ giấy — thanh `bg-muted` bo vừa, KHÔNG đổ bóng, KHÔNG chữ giả. Măng-sét và chân
 * trang không vẽ lại ở đây: chúng tới cùng nội dung, tránh hai lần nhảy bố cục.
 */
import { KHUNG } from "@/components/pha/khung";

/** Một thanh giấy mờ. Kích thước truyền bằng class. */
function Thanh({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col" role="status" aria-label="Đang mở phả">
      <main className={`${KHUNG} flex-1 pt-9 md:pt-32`}>
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
          {/* Cột đời: ô tìm + tựa mục + bốn dòng tên so le như một cột tên thật. */}
          <section aria-hidden>
            <Thanh className="mb-9 h-16" />
            <Thanh className="h-4 w-56" />
            <div className="mt-2 h-px bg-border" />
            <div className="mt-6 space-y-7">
              <Thanh className="h-7 w-3/5" />
              <Thanh className="h-7 w-2/3" />
              <Thanh className="h-7 w-1/2" />
              <Thanh className="h-7 w-3/5" />
            </div>
            <div className="mt-7 h-px bg-border" />
            <Thanh className="mt-4 h-5 w-2/5" />
          </section>

          {/* Rail phải: tựa mục + hai ghi chú lề. */}
          <aside aria-hidden className="mt-12 lg:mt-0 lg:border-l lg:border-border lg:pl-8">
            <Thanh className="h-4 w-32" />
            <div className="mt-2 h-px bg-border" />
            <div className="mt-5 space-y-5">
              <Thanh className="h-14" />
              <Thanh className="h-14" />
            </div>
          </aside>
        </div>
      </main>
      <span className="sr-only">Đang mở phả…</span>
    </div>
  );
}
