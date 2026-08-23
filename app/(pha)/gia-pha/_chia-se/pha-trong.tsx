/**
 * CÂY RỖNG — trạng thái thật của những ngày đầu (EXPERIENCE § State Patterns — Cây rỗng).
 *
 * Không phải màn lỗi: chưa có ai trong phả là điểm xuất phát của mọi dòng họ trên sản phẩm này.
 * Trung thực về sự trống, và chỉ ra đúng một việc làm được ngay — đi tìm rồi thêm một cái tên.
 */
import Link from 'next/link';
import { DOC } from '@/components/pha/khung';
import { ThanhDieuHuong } from '@/components/pha/thanh-dieu-huong';

export function PhaTrong({ tenPha }: { tenPha?: string }) {
  return (
    <>
      <main className="flex-1 pb-28 pt-7 md:pb-16 md:pt-28">
        <div className={DOC}>
          <h1 className="font-[family-name:var(--font-pha)] text-[23px]">Gia phả</h1>
          <div className="mt-6 rounded-md border border-border bg-card px-5 py-6">
            <p className="font-[family-name:var(--font-pha)] text-[19px] font-semibold">
              Cuốn phả còn trống
            </p>
            <p className="mt-2 text-[17px] leading-relaxed text-muted-foreground">
              Chưa có ai được ghi vào. Mỗi cái tên thêm vào là một nhánh của cây bắt đầu mọc —
              bắt đầu từ người nhớ rõ nhất.
            </p>
            {/* Nút chính nền son — hành động chính duy nhất của màn (DESIGN.md § Nút). */}
            <Link
              href="/tim"
              className="mt-5 inline-block rounded-md bg-primary px-5 py-3 text-[17px] text-primary-foreground"
            >
              Tìm và thêm người thân
            </Link>
          </div>
        </div>
      </main>
      <ThanhDieuHuong hienTai="gia-pha" tenPha={tenPha} />
    </>
  );
}
