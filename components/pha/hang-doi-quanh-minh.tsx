'use client';

/**
 * VÙNG LÂN CẬN TRÊN ĐIỆN THOẠI — hàng theo đời, chạm một người là chọn (story 6-10).
 *
 * Cùng dữ liệu với canvas máy tính (`NutCanvas`), khác hình. Thẻ ở đây là thẻ người của bề mặt
 * A: tên chữ có chân, vợ/chồng chung thẻ, tồn nghi = nét đứt + vân chéo (KHÔNG opacity —
 * `DESIGN.md § Do's and Don'ts`), "mình" bằng son như mọi màn khác.
 *
 * Chạm là `<button>` chứ không phải `<a>`: chọn một người mở TẤM PHIẾU tại chỗ, không rời trang
 * — trang đầy đủ (`/nguoi/[id]`) vẫn có đường riêng trong phiếu. Cùng luật với chip quan hệ
 * của 6-7 (AC 12).
 *
 * `docs/build-contract.md § Phân tầng`: file này KHÔNG import `@/core/*`.
 */
import { Crown, Users } from 'lucide-react';
import type { NutCanvas } from '@/components/admin/khung-cay-admin';
import { dongBanDoi } from '@/components/admin/ban-doi-the';
import { ChamTinCay } from './tin-cay';
import { xepHangDoi } from './hang-doi';

export function HangDoiQuanhMinh({
  nut,
  minhId,
  neoId,
  chonId,
  onChon,
}: {
  nut: NutCanvas[];
  /** Người đang xem — có thể vắng trên hình nếu vùng đang neo vào người khác, xa hơn bán kính. */
  minhId: string | null;
  neoId: string;
  chonId: string | null;
  onChon: (id: string) => void;
}) {
  const hang = xepHangDoi(
    nut.map((n) => ({ id: n.id, doi: n.the.doi, nut: n })),
    minhId,
  );
  return (
    <ol className="mt-5 space-y-4" aria-label="Người quanh đây, theo đời">
      {hang.map((h) => (
        <li key={h.nhan}>
          <p className="mb-1.5 text-[15px] font-bold uppercase tracking-wider text-muted-foreground">
            {h.nhan}
          </p>
          <ul className="space-y-2">
            {h.nut.map(({ nut: n }) => {
              const laMinh = n.id === minhId;
              const laNeo = n.id === neoId;
              const dangChon = n.id === chonId;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => onChon(n.id)}
                    aria-pressed={dangChon}
                    className={[
                      'block w-full rounded-md border px-4 py-3 text-left',
                      n.the.tonNghi ? 'van-ton-nghi border-dashed' : 'bg-card',
                      // Trạng thái bằng ĐỘ DÀY viền + chữ, không chỉ bằng màu (Accessibility Floor).
                      dangChon ? 'border-2 border-foreground' : laNeo ? 'border-2 border-primary' : 'border-border',
                    ].join(' ')}
                    style={n.the.tonNghi && !dangChon && !laNeo ? { borderColor: 'var(--color-tin-ton-nghi)' } : undefined}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                          {n.the.hoTen}
                          {laMinh ? (
                            <span className="ml-2 text-[15px] font-semibold text-primary">mình</span>
                          ) : null}
                        </span>
                        {dongBanDoi(n.the.banDoi).map((b, i) => (
                          <span
                            key={i}
                            className="mt-1 flex items-center gap-1.5 text-[15px] text-muted-foreground"
                          >
                            <Users className="size-3.5 shrink-0" aria-hidden />
                            {b.dem ? `và ${b.dem} người nữa` : b.ten}
                          </span>
                        ))}
                        {n.the.laGocManh ? (
                          <span className="mt-1 flex items-center gap-1.5 text-[15px] text-muted-foreground">
                            <Crown className="size-3.5 shrink-0" aria-hidden />
                            cụ xa nhất hiện biết
                          </span>
                        ) : n.the.chi ? (
                          <span className="mt-1 block text-[15px] text-muted-foreground">chi {n.the.chi}</span>
                        ) : null}
                      </span>
                      <span className="shrink-0 pt-0.5">
                        <ChamTinCay muc={n.the.tinCay} />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ol>
  );
}
