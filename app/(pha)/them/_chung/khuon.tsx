/**
 * KHUÔN CỦA LUỒNG THÊM — vỏ màn + các mảnh dựng lại từ prototype `them-nguoi-than`
 * (git 8fd4af1^), giữ nguyên lớp/bố cục đã được duyệt; khác duy nhất: lựa chọn giờ là
 * Link/label thật thay vì button trơ của xưởng tĩnh.
 *
 * Spine chi phối: EXPERIENCE.md § Interaction Primitives ("Một câu hỏi một màn. RÀNG BUỘC
 * CỨNG.") · § Voice and Tone (không xưng hô) · § Accessibility Floor (sàn 15/17px, chạm 44px)
 * DESIGN.md § Layout & Spacing · § Components · § Elevation (không đổ bóng).
 */
import Link from 'next/link';
import { ThanhDieuHuong } from '@/components/pha/thanh-dieu-huong';
import { coBanLamViec } from '@/lib/vai-quan-tri';

/**
 * Vỏ của mọi bước. KHÔNG nới rộng trên máy: một câu hỏi một màn là ràng buộc BỐ CỤC, và một
 * câu hỏi kéo ngang 1280px không đọc ra như một câu hỏi (prototype đã chốt, giữ nguyên khung
 * hẹp thay vì DOC 672px — cùng lý do màn "không tìm thấy" cố tình không nới).
 */
export async function KhungThem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-28 pt-7 md:max-w-lg md:pb-16 md:pt-28">
        {children}
      </main>
      <ThanhDieuHuong hienTai="them" banLamViec={await coBanLamViec()} />
    </div>
  );
}

/**
 * Thanh nhịp — "Câu 2 / 4". Chữ, không phải một dãy chấm: dãy chấm là câu đố với người ít
 * dùng máy, và § Accessibility Floor cấm mã hoá trạng thái chỉ bằng hình.
 */
export function Nhip({ so }: { so: number }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="text-[15px] font-semibold uppercase tracking-wider text-muted-foreground">
        Câu {so} / 4
      </span>
      <span className="h-px flex-1 bg-border" aria-hidden />
    </div>
  );
}

export function CauHoi({ children }: { children: React.ReactNode }) {
  return <h1 className="font-[family-name:var(--font-pha)] text-[23px]">{children}</h1>;
}

/**
 * Lựa chọn to, giờ là một Link thật — vùng chạm 44px là sàn, ở đây cao hơn (min-h-14) vì
 * người dùng đích có tay run. Rê chuột chỉ đổi viền, không đổi nền: ô nhấp nháy nền là nút
 * của app, không phải dòng kẻ của cuốn phả.
 */
export function OChonDuong({
  href,
  phu,
  children,
}: {
  href: string;
  phu?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-14 w-full flex-col items-start justify-center rounded-md border border-input bg-card px-4 py-3 text-left transition-colors duration-150 ease-out hover:border-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span className="text-[17px]">{children}</span>
      {phu && <span className="text-[15px] text-muted-foreground">{phu}</span>}
    </Link>
  );
}

/**
 * Khối chàm = GHI CHÚ của hệ thống, KHÔNG phải cảnh báo lỗi (DESIGN.md § Cảnh báo là chàm
 * mực): không có gì hỏng — chỉ có một hệ quả người khai cần biết trước khi bấm. Không bao
 * giờ mã hoá chỉ bằng màu: luôn viền trái đặc + câu chữ nói rõ chuyện gì.
 */
export function KhoiCham({ tua, children }: { tua?: string; children: React.ReactNode }) {
  return (
    <div
      className="border-l-4 px-4 py-3.5"
      style={{
        backgroundColor: 'var(--color-canh-bao-nen)',
        borderColor: 'var(--destructive)',
      }}
    >
      {tua && <p className="text-[17px] font-semibold">{tua}</p>}
      <div className={`text-[17px] ${tua ? 'mt-1' : ''}`}>{children}</div>
    </div>
  );
}

/**
 * Thẻ một người — dạng gọn của node người (DESIGN.md § Components): tên serif, nhãn phụ,
 * dòng ghi công son. Tồn nghi = nét đứt + vân chéo, chữ ĐẬM NGANG node thường — không opacity.
 */
export function TheNguoi({
  ten,
  meta,
  tonNghi = false,
  ghiCong,
  nhanMinh = false,
}: {
  ten: string;
  meta?: string;
  tonNghi?: boolean;
  ghiCong?: string;
  nhanMinh?: boolean;
}) {
  return (
    <div
      className={`rounded-md border px-4 py-3 ${
        tonNghi ? 'van-ton-nghi border-dashed' : 'border-border bg-card'
      }`}
      style={tonNghi ? { borderColor: 'var(--color-tin-ton-nghi)' } : undefined}
    >
      <p className="font-[family-name:var(--font-pha)] text-[19px] font-semibold leading-snug">
        {ten}
        {/* "mình" bằng son — cùng cách đánh dấu với trang chủ, một người không phải lúc là
            son lúc là chữ đậm. */}
        {nhanMinh && <span className="ml-2.5 text-[17px] font-semibold text-primary">mình</span>}
      </p>
      {meta && <p className="mt-0.5 text-[15px] text-muted-foreground">{meta}</p>}
      {ghiCong && <p className="mt-1.5 text-[15px] italic text-primary">{ghiCong}</p>}
    </div>
  );
}

/** Nhãn phụ của một PersonCard thật: đời + chi (AD-5, tính lúc đọc) · năm · tồn nghi. */
export function metaThe(card: {
  generation: number | null;
  branchCode: string | null;
  lifespan: string;
  confidence: string;
}): string {
  return [
    card.generation !== null ? `đời ${card.generation}` : null,
    card.branchCode ? `chi ${card.branchCode}` : null,
    card.lifespan || null,
    card.confidence === 'ton-nghi' ? 'tồn nghi' : null,
  ]
    .filter(Boolean)
    .join(' · ');
}
