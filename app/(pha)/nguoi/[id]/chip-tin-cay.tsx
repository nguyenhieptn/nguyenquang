'use client';

/**
 * CHIP MỨC TIN CẬY + PANEL GIẢI NGHĨA — FR-1 lộ ra ở đây và CHỈ ở đây.
 *
 * EXPERIENCE.md § Component Patterns: "Chạm → panel giải nghĩa: mức này là gì, ai khai, dựa vào
 * đâu. Panel này là chỗ DUY NHẤT FR-1 lộ ra với người thường; không nhét nguồn vào node."
 *
 * Chấm màu + CHỮ, không bao giờ chỉ màu (§ Accessibility Floor — phải đọc được khi in đen trắng
 * và với người mù màu). Gạch chấm dưới chữ báo "chạm được" — cũng không mã hoá bằng màu.
 *
 * ⚠️ TODO(core): FR-1 đòi đủ ba câu "mức này là gì · ai khai · dựa vào đâu". Core hiện chưa có
 * API đọc danh sách khẳng định (kèm source) của một người — assertion/index.ts chỉ có đường ghi
 * và listPendingAssertions (bề mặt B). Câu "dựa vào đâu" vì thế chưa trả được; panel mới trả
 * được "mức này là gì" + "ai khai" (từ dòng ghi công). Khi core có listAssertionsFor(personId),
 * thêm dòng nguồn vào đây.
 */
import { useId, useState } from 'react';

/** Trùng khít với `Confidence` của core — ba mức, không có mức thứ tư. */
export type MucTinCay = 'chac-chan' | 'theo-loi-ke' | 'ton-nghi';

const NHAN: Record<MucTinCay, string> = {
  'chac-chan': 'chắc chắn',
  'theo-loi-ke': 'theo lời kể',
  'ton-nghi': 'tồn nghi',
};

/** Câu giải nghĩa từng mức — chú giải tại chỗ, đúng chữ DESIGN.md § Do's. */
const NGHIA: Record<MucTinCay, string> = {
  'chac-chan': 'đã đối chiếu được với giấy tờ, bia mộ hoặc ảnh chụp',
  'theo-loi-ke': 'có người trong họ kể lại, chưa đối chiếu được giấy tờ',
  'ton-nghi': 'dòng họ ghi lại để không quên, còn chỗ để chắc chắn thêm',
};

const MAU: Record<MucTinCay, string> = {
  'chac-chan': 'var(--color-tin-chac-chan)',
  'theo-loi-ke': 'var(--color-tin-loi-ke)',
  'ton-nghi': 'var(--color-tin-ton-nghi)',
};

export function ChipGiaiNghia({
  muc,
  /** Tầng của khẳng định — 'official' được nói ra bằng son, vì son = "đã chốt". */
  tang,
  /** Dòng ghi công: ai khai. `null` khi không còn dấu — panel bỏ dòng, không bịa. */
  nguoiKhai,
  /** Khi nào — đã định dạng sẵn ở server ("hôm nay", "12/8/2026"). */
  luc,
}: {
  muc: MucTinCay;
  tang: 'official' | 'tentative';
  nguoiKhai?: string | null;
  luc?: string | null;
}) {
  const [mo, setMo] = useState(false);
  const id = useId();

  return (
    <div>
      {/* Vùng chạm ≥44px (min-h-11) — chip nhỏ nhưng ngón tay thì không. */}
      <button
        type="button"
        aria-expanded={mo}
        aria-controls={id}
        onClick={() => setMo((v) => !v)}
        className="-mx-2 inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-[15px] text-muted-foreground underline decoration-dotted underline-offset-4 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: MAU[muc] }}
          aria-hidden
        />
        {NHAN[muc]}
      </button>

      {mo && (
        <div id={id} className="mt-1.5 rounded-md border border-border bg-card px-4 py-3.5">
          <p className="text-[17px]">
            <span className="font-semibold">{NHAN[muc]}</span> — {NGHIA[muc]}.
          </p>
          {nguoiKhai && (
            <p className="mt-1.5 text-[15px] italic text-primary">
              {nguoiKhai} ghi{luc ? ` · ${luc}` : ''}
            </p>
          )}
          {tang === 'official' ? (
            // Son CHỈ cho "đã chốt" — đây đúng là chỗ ấy.
            <p className="mt-1.5 text-[15px] font-semibold text-primary">
              Đã ở Tầng chính thức — ban tu phả đã duyệt.
            </p>
          ) : (
            <p className="mt-1.5 text-[15px] text-muted-foreground">
              Đang ở Tầng tồn nghi — ai trong họ biết thêm thì ghi thêm được.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
