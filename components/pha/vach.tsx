/**
 * VẠCH VÀ TỰA MỤC — mô-típ dùng chung của bề mặt "Người trong họ".
 *
 * Vì sao tách thành component thay vì mỗi chỗ tự viết `border-t`:
 *
 * `DESIGN.md § Elevation & Depth` cấm đổ bóng — *"Giấy nằm trên bàn, không lơ lửng. Phân tầng
 * bằng **viền** và **sắc độ nền**."* Nghĩa là **viền phải gánh toàn bộ việc phân tầng**. Khi mỗi
 * màn tự chọn một kiểu viền thì thứ duy nhất tạo nhịp cho cả sản phẩm lại là thứ không nhất
 * quán — và đó đọc ra "chưa thuần nhất" trước khi ai gọi được tên nó.
 *
 * Hai mô-típ, không hơn:
 *   · `VachDoi` — dày trên, mảnh dưới. Quy ước trang bìa sách in. Chỉ dùng ở **ranh giới lớn**:
 *     đáy măng-sét, mở chân trang. Rải khắp nơi là mất sức nặng.
 *   · `TuaMuc` — tựa của một mục trong thân trang, kèm vạch mảnh kéo hết bề ngang mục.
 */
import type { ReactNode } from 'react';

/** Vạch đôi dày–mảnh. Chỉ cho ranh giới lớn: đáy măng-sét, mở chân trang. */
export function VachDoi({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden className={className}>
      <div className="h-0.5 bg-border" />
      <div className="mt-[3px] h-px bg-border" />
    </div>
  );
}

/**
 * Tựa một mục: chữ nhỏ giãn rộng + vạch mảnh kéo hết bề ngang.
 *
 * Vạch chạy hết bề ngang chứ không chỉ dưới chữ — nó là **đường kẻ của trang sổ**, việc của nó là
 * chia trang, không phải gạch chân cái tựa. `phu` treo bên phải cùng đường baseline: chỗ cho một
 * mẩu ngữ cảnh mà không phải đẻ thêm một dòng.
 */
export function TuaMuc({
  children,
  phu,
  className = '',
}: {
  children: ReactNode;
  phu?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-4">
        {/* 15px là SÀN TUYỆT ĐỐI (DESIGN.md § Typography) — chữ tựa mục không được xuống dưới,
            kể cả khi nó là chữ nhỏ giãn rộng của ấn phẩm. Giãn chữ rút từ 0.18em xuống 0.1em:
            ở 15px thì 0.18em kéo tựa dài quá bề ngang mục và rời ra thành từng chữ cái. */}
        <h2 className="text-[15px] font-bold uppercase leading-tight tracking-[0.1em] text-muted-foreground">
          {children}
        </h2>
        {phu && <span className="text-[15px] text-muted-foreground">{phu}</span>}
      </div>
      <div aria-hidden className="mt-2 h-px bg-border" />
    </div>
  );
}
