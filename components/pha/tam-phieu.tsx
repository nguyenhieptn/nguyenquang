'use client';

/**
 * TẤM PHIẾU — hộp trượt từ đáy màn điện thoại, bày phiếu của người vừa chạm (story 6-10).
 *
 * Trên máy, phiếu là cột phải đứng cạnh canvas. Trên điện thoại không có cột phải nào để đứng,
 * nên phiếu trượt lên từ đáy — vùng ngón cái, cùng lý do thanh điều hướng dính đáy
 * (`EXPERIENCE.md § Điều hướng gốc`). Không phải hộp thoại giữa màn: hộp giữa màn che mất cái
 * người ta vừa chạm.
 *
 * Nếp giấy dó: viền trên, không đổ bóng (`DESIGN.md § Elevation`), lớp phủ là mực loãng chứ không
 * phải kính mờ. Nút Đóng ≥ 44px, `Esc` đóng, tiêu điểm vào tấm khi mở, trả về nút vừa bấm khi
 * đóng — vì đây là `role="dialog"` thật, không phải một `div` trông giống.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function TamPhieu({
  mo,
  nhan,
  onDong,
  children,
}: {
  mo: boolean;
  nhan: string;
  onDong: () => void;
  children: ReactNode;
}) {
  const tam = useRef<HTMLDivElement>(null);
  const nutDong = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mo) return;
    const truoc = document.activeElement as HTMLElement | null;
    nutDong.current?.focus();
    // Khoá cuộn trang dưới tấm — cuộn nhầm là mất chỗ đứng trên danh sách.
    const cu = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDong();
    };
    window.addEventListener('keydown', phim);
    return () => {
      window.removeEventListener('keydown', phim);
      document.body.style.overflow = cu;
      truoc?.focus?.();
    };
  }, [mo, onDong]);

  /**
   * ĐÓNG là GIẤU, không phải gỡ (sửa 29/08 sau code review 6-10).
   *
   * Bản đầu `return null` khi đóng, nên biểu mẫu thêm người đang gõ dở bị gỡ khỏi cây React —
   * mất họ tên, năm sinh, xuất xứ — trong khi nơi gọi hứa *"đóng tấm không phải là bỏ chữ đã gõ;
   * mở lại vẫn còn"*. Lời hứa ấy chỉ đúng khi con của tấm ở nguyên chỗ. `hidden` bỏ nó khỏi cả
   * mắt lẫn cây trợ năng; trạng thái React thì ở lại.
   */
  if (!mo) return <div hidden>{children}</div>;
  return (
    <>
      <div
        className="fixed inset-0 z-20 bg-foreground/30"
        aria-hidden
        onClick={onDong}
      />
      <div
        ref={tam}
        role="dialog"
        aria-modal="true"
        aria-label={nhan}
        className="fixed inset-x-0 bottom-0 z-30 flex max-h-[88dvh] flex-col rounded-t-lg border-t border-border bg-card"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border pl-5 pr-2">
          <p className="text-[15px] font-bold uppercase tracking-wider text-muted-foreground">{nhan}</p>
          <button
            ref={nutDong}
            type="button"
            onClick={onDong}
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-md px-2 text-[17px]"
          >
            <X className="size-5" aria-hidden />
            Đóng
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  );
}
