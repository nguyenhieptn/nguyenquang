/**
 * MÀN MỘT CHI — TẦNG 2 của ba tầng zoom (Tộc → Chi → Người). Server component dùng chung.
 *
 * Spine chi phối:
 *   · EXPERIENCE.md § Information Architecture — Cây ba tầng
 *   · EXPERIENCE.md § Responsive & Platform — hai bộ mặt của cùng một màn
 *   · DESIGN.md § Do's and Don'ts (cấm làm mờ tồn nghi)
 *
 * FR: FR-15 ("collapse theo ĐỜI") · FR-2 · FR-3 · FR-13 (đường về cụ tô sáng) · FR-63
 *
 * Vì sao là component chứ không phải page: `/gia-pha` (điểm vào — chi CỦA MÌNH) và
 * `/gia-pha/chi/[id]` (chi bất kỳ) là CÙNG MỘT MÀN với dữ liệu khác. Hai bản copy thì lệch nhau
 * lúc nào không biết.
 *
 * ── HAI BỘ MẶT ──────────────────────────────────────────────────────────────────────────────
 * ĐIỆN THOẠI — đời là hàng GẬP được. Màn hẹp buộc phải giấu bớt, nên gập là cách trung thực nhất:
 *   đời của mình và đời ngay trên bung sẵn, còn lại gập. Đây đúng chữ FR-15 "collapse theo đời".
 *
 * MÁY — CÂY THẬT, vẽ từ TRÊN XUỐNG: cụ ở trên, con cháu bên dưới, nhánh rủ xuống, vợ/chồng đứng
 *   chung một thẻ. Người xem thấy TRỌN chi trong một cái nhìn thay vì bung từng đời.
 *
 *   SỬA 11/08/2026 — bản trước xếp đời thành CỘT trái sang phải. Sai: đó là hướng đọc của một
 *   BẢNG, không phải của một cuốn phả. Trên phả, xuống là đi về phía sau, và chính hướng đọc ấy
 *   mang nghĩa. Người duyệt gạch đi, đúng.
 */
import Link from 'next/link';
import { ChamTinCay } from '@/components/pha/tin-cay';
import { KHUNG, RONG } from '@/components/pha/khung';
import { ThanhDieuHuong } from '@/components/pha/thanh-dieu-huong';
// Tải ĐỘNG theo bề rộng màn: điện thoại không tải một byte React Flow nào.
// Xem đầu file cay-tai-dong.tsx — `hidden md:block` một mình KHÔNG đủ.
import { CayGiaPhaTaiDong } from '@/components/pha/cay-tai-dong';
import type { BranchView, CoupleNode, PersonCard } from '@/core/tree';
import { capsTuChi, demNguoiTrongChi, nhanNgay, tenChi } from './chuyen-doi';

function DongPhu({ n }: { n: PersonCard }) {
  // Chuỗi rỗng thì không vẽ: ngoài bán kính riêng tư, năm tháng vắng mặt như không tồn tại.
  if (!n.lifespan) return null;
  return <p className="mt-0.5 text-[15px] text-muted-foreground">{n.lifespan}</p>;
}

/** Một dòng = một CẶP, y như một node trên cây bản máy: người mang huyết thống, vợ/chồng nằm
 *  trong cùng dòng. Không tách thành hai dòng rời, nếu không cùng một người lúc thì là một ô
 *  trên cây, lúc lại là hai dòng trong danh sách. Chạm → mở trang một người. */
function DongCap({ cap, minhId }: { cap: CoupleNode; minhId?: string | null }) {
  const n = cap.person;
  const tonNghi = n.tier === 'tentative';
  return (
    <li
      className={[
        '-mx-4 border-b border-border last:border-b-0',
        tonNghi ? 'van-ton-nghi' : '',
      ].join(' ')}
    >
      <Link href={`/nguoi/${n.personId}`} className="block px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
              {n.fullName}
              {n.personId === minhId && (
                <span className="ml-2 text-[15px] font-semibold text-primary">mình</span>
              )}
            </p>
            <DongPhu n={n} />
            {cap.partners.map((b) => (
              <div key={b.personId} className="mt-2 border-t border-border pt-2">
                <p className="text-[15px] text-muted-foreground">vợ/chồng</p>
                <p className="font-[family-name:var(--font-pha)] text-[17px]">{b.fullName}</p>
                <DongPhu n={b} />
              </div>
            ))}
            {n.attribution && (
              <p className="mt-1 text-[15px] italic text-primary">
                {n.attribution.byName} ghi · {nhanNgay(n.attribution.at)}
              </p>
            )}
          </div>
          <span className="shrink-0 whitespace-nowrap">
            <ChamTinCay muc={n.confidence} />
          </span>
        </div>
      </Link>
    </li>
  );
}

export function ManChi({
  chi,
  minhId,
  duongVeGoc = [],
  moiTimCho = false,
}: {
  chi: BranchView;
  minhId?: string | null;
  /** Id trên đường huyết thống của người xem — nhánh son FR-13 trên cây bản máy. */
  duongVeGoc?: string[];
  /** Khách / chưa gắn chỗ: mời tìm chỗ của mình (EXPERIENCE § Chưa gắn node — KHÔNG là màn lỗi). */
  moiTimCho?: boolean;
}) {
  const dungDau = chi.generations
    .flatMap((g) => g.couples)
    .find((c) => c.person.personId === chi.headPersonId)?.person;
  // Mã chi rỗng = đầu chi chính là gốc tạm của mảnh: cả mảnh hiện ra như một "chi".
  const tieuDe = chi.branchCode
    ? tenChi(chi.branchCode).replace(/^chi/, 'Chi')
    : `Nhánh cụ ${dungDau?.fullName ?? 'xa nhất hiện biết'}`;
  const tongNguoi = demNguoiTrongChi(chi);
  const doiBungSan = new Set(
    chi.viewerGeneration != null
      ? [chi.viewerGeneration, chi.viewerGeneration - 1]
      : [chi.generations[0]?.generation],
  );

  return (
    <>
      <main className="flex-1 pb-28 pt-7 md:pb-16 md:pt-28">
        <div className={KHUNG}>
          {/* Đầu trang. Trên máy: một dải rộng, tên chi lớn hẳn, hành động nằm bên phải. */}
          <div className="md:flex md:items-end md:justify-between md:border-b md:border-border md:pb-6">
            <div>
              <Link
                href="/gia-pha/ca-toc"
                className="inline-block py-1.5 text-[15px] text-muted-foreground underline underline-offset-4"
              >
                ← Xem cả tộc
              </Link>
              <h1 className="mt-3 font-[family-name:var(--font-pha)] text-[23px] md:text-[34px]">
                {tieuDe}
              </h1>
              <p className="mt-1 text-[15px] text-muted-foreground">
                {dungDau ? `${dungDau.fullName} · ` : ''}
                {tongNguoi} người · {chi.generations.length} đời
              </p>
            </div>
            <Link
              href="/gia-pha/duong-cua-toi"
              className="hidden rounded-md border border-input px-5 py-3 text-[17px] md:block"
            >
              Xem cây gia tộc
            </Link>
          </div>

          {/* Chưa có chỗ trong cây (khách, hoặc tài khoản chưa gắn): mọi hành động ghi dẫn về
              luồng nhận chỗ — KHÔNG BAO GIỜ là một màn lỗi (EXPERIENCE § Chưa gắn node). */}
          {moiTimCho && (
            <aside className="mt-6 rounded-md border border-border bg-card px-4 py-4 md:flex md:items-center md:justify-between md:gap-6">
              <p className="text-[17px] leading-relaxed">
                Đây là chi đầu của dòng họ. Tìm tên của mình trong phả để mở đúng chi nhà mình —
                chưa thấy tên thì thêm vào, ai trong họ cũng thêm được.
              </p>
              <Link
                href="/tim"
                className="mt-3 inline-block shrink-0 rounded-md border border-input px-5 py-3 text-[17px] md:mt-0"
              >
                Tìm chỗ của mình
              </Link>
            </aside>
          )}

          {/* ══ BẢN ĐIỆN THOẠI — đời là hàng gập được ══════════════════════════ */}
          <ul className="mt-6 space-y-3 md:hidden">
            {chi.generations.map((g) => (
              <li key={g.generation}>
                <details
                  open={doiBungSan.has(g.generation)}
                  className="rounded-md border border-border bg-card"
                >
                  <summary className="flex cursor-pointer items-center justify-between px-4 py-3.5">
                    <span className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                      Đời {g.generation}
                    </span>
                    <span className="text-[15px] text-muted-foreground">
                      {g.couples.reduce((s, c) => s + 1 + c.partners.length, 0)} người
                    </span>
                  </summary>
                  <ul className="border-t border-border px-4 py-1">
                    {g.couples.map((cap) => (
                      <DongCap key={cap.person.personId} cap={cap} minhId={minhId} />
                    ))}
                  </ul>
                </details>
              </li>
            ))}
          </ul>

          <Link
            href="/gia-pha/duong-cua-toi"
            className="mt-6 block rounded-md border border-input px-4 py-3.5 text-center text-[17px] md:hidden"
          >
            Xem cây gia tộc
          </Link>
        </div>

        {/* ══ BẢN MÁY — CÂY THẬT, vẽ từ trên xuống ═══════════════════════════ */}
        <div className={`${RONG} mt-8 hidden md:block`}>
          <CayGiaPhaTaiDong
            caps={capsTuChi(chi)}
            minhId={minhId ?? undefined}
            duongVeGoc={duongVeGoc}
          />
          <p className="mt-2 text-[15px] text-muted-foreground">
            Kéo để di chuyển · chụm hoặc dùng nút + − để phóng to. Vòng son là đường huyết thống
            ngược lên cụ xa nhất hiện biết.
          </p>
        </div>
      </main>
      <ThanhDieuHuong hienTai="gia-pha" tenPha="Nguyễn Quang" />
    </>
  );
}
