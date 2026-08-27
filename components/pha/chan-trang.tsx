/**
 * CHÂN TRANG — bài bạt của cuốn phả.
 *
 * Spine chi phối: DESIGN.md § Brand & Style (đọc ra "cuốn phả", không phải "trang web")
 *                 · § Colors (son khan hiếm) · § Elevation (không đổ bóng) · § Typography
 *                 EXPERIENCE.md § Voice and Tone (không xưng hô) · § Accessibility Floor
 *
 * FR: FR-55 (quyền của người sống) · FR-1 (mọi khẳng định mang nguồn) · FR-48 (mảnh chưa nối)
 *
 * ── Vì sao chân trang này KHÔNG phải một dải link ─────────────────────────
 *
 * Sách in kết bằng **bài bạt**: nói cuốn sách này là gì, do đâu mà có, và ai chịu trách nhiệm.
 * Một dải link xếp bốn cột là ngôn ngữ của trang doanh nghiệp, và nó đọc ra đúng cái mà DESIGN.md
 * § Brand & Style bảo phải tránh.
 *
 * Ba khối, mỗi khối gánh một việc thật — không khối nào để lấp chỗ:
 *
 *   1. **Phả này là gì** — một câu nói thẳng rằng bản ghi còn dở và ai trong họ cũng sửa được.
 *      Đây là chỗ duy nhất trên sản phẩm nói ra điều đó, mà nó lại là điều kiện để người ta chịu
 *      đóng góp: không ai sửa một cuốn sách đã đóng bìa.
 *   2. **Đi tiếp** — các đường KHÔNG có chỗ trên thanh năm mục. Thanh chính chốt ở năm mục (trần
 *      của tầm với ngón cái); những đường còn lại phải có một chỗ, và chỗ ấy là đây.
 *   3. **Quyền của người trong phả (FR-55)** — sửa, ẩn, từ chối in. `EXPERIENCE.md` chốt ba đường
 *      này *"bày NGANG NHAU"* vì *"quyền từ chối mà khó tìm hơn quyền sửa thì không còn là
 *      quyền"*. Chân trang là chỗ duy nhất chúng có mặt trên MỌI màn — đặt chúng sâu trong trang
 *      "Tôi" là đặt sau một lần chạm mà người cần nhất lại ít khi đi tới.
 */
import Link from 'next/link';
import { resolveSession } from '@/core/identity';
import { KHUNG } from './khung';
import { VachDoi } from './vach';

type Duong = { nhan: string; href: string | null };

/**
 * Đường KHÔNG có chỗ trên thanh năm mục — thanh chính đã chốt trần ở năm.
 *
 * Bốn màn đích đã dựng (promote Đợt 1), nên bốn mục là ĐƯỜNG THẬT. Cơ chế `href: null` (mục
 * thành chữ trơ) giữ nguyên trong `Duong` cho lần thu phạm vi sau, nếu có.
 */
const DI_TIEP: Duong[] = [
  { nhan: 'Cả tộc', href: '/gia-pha/ca-toc' },
  { nhan: 'Cây gia tộc', href: '/gia-pha/duong-cua-toi' },
];

/**
 * Hai lối dưới đây nằm sau cổng quyền của `app/admin/layout.tsx` (chỉ `admin` và `branch-head`).
 *
 * Bản trước bày chúng cho MỌI người: khách bấm vào thì rơi vào màn "Khu vực Ban tu phả" — một
 * cánh cửa khoá, và không ai giải thích vì sao mình bị chặn. Nợ ấy ghi trong `deferred-work.md`
 * từ lượt review 5-1; trả ở đây cùng lượt thêm lối vào bàn làm việc trên thanh điều hướng.
 */
const DI_TIEP_QUAN_TRI: Duong[] = [
  // "Mảnh chưa nối" (FR-48) sống trên màn hợp nhất của ban duyệt — đó là chỗ duy nhất nối được.
  { nhan: 'Mảnh chưa nối', href: '/admin/hop-nhat' },
  { nhan: 'Admin', href: '/admin' },
];

/**
 * FR-55 — ba quyền BÀY NGANG NHAU. Thứ tự không hàm ý cái nào chính.
 *
 * Cả ba dẫn về trang Tôi: đó là màn thực thi quyền của người trong phả (FR-55). Vẫn bày thành
 * BA dòng chứ không gộp một, vì "quyền từ chối mà khó tìm hơn quyền sửa thì không còn là quyền"
 * — mỗi quyền phải đọc được thành lời ngay ở đây, trước khi mở màn.
 */
const QUYEN: Duong[] = [
  { nhan: 'Sửa thông tin về mình', href: '/toi' },
  { nhan: 'Ẩn khỏi phần công khai', href: '/toi' },
  { nhan: 'Từ chối xuất hiện trong bản in', href: '/toi' },
];

function Cot({ tua, duong }: { tua: string; duong: Duong[] }) {
  return (
    <div>
      {/* Sàn chữ tuyệt đối 15px (DESIGN.md § Typography). Giãn chữ rút 0.18em → 0.1em: ở 15px
          thì 0.18em kéo tựa cột rời ra thành từng chữ cái. */}
      <h2 className="text-[15px] font-bold uppercase leading-tight tracking-[0.1em] text-muted-foreground">
        {tua}
      </h2>
      <ul className="mt-3 space-y-1">
        {duong.map((d) => (
          <li key={d.nhan}>
            {d.href ? (
              <Link
                href={d.href}
                // Gạch chân mảnh, đậm lên khi rê: đường dẫn trong một cuốn sách là chú dẫn, không
                // phải nút. Vùng chạm 44px lo bằng `min-h-11` (không bằng nền màu) — `py` một
                // mình không bảo đảm được sàn ấy khi nhãn xuống một dòng.
                className="inline-flex min-h-11 items-center text-[17px] underline decoration-border underline-offset-4 outline-none hover:decoration-foreground focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring"
              >
                {d.nhan}
              </Link>
            ) : (
              <span className="inline-flex min-h-11 items-center text-[17px] text-muted-foreground">
                {d.nhan}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function ChanTrang({ tenPha = 'Tộc phả' }: { tenPha?: string }) {
  const phien = await resolveSession();
  const quanTri = phien?.role === 'admin' || phien?.role === 'branch-head';
  return (
    // `mt-auto` để chân trang tụt xuống đáy khi trang ngắn; `pb-28` chừa chỗ cho thanh dính đáy
    // của bản điện thoại, nếu không nó che mất hàng cuối.
    <footer className="mt-auto pb-28 pt-14 md:pb-0">
      <div className={KHUNG}>
        <VachDoi />

        <div className="pt-8 md:grid md:grid-cols-[minmax(0,1fr)_auto_auto] md:gap-12 lg:gap-16">
          {/* ── Phả này là gì ─────────────────────────────────────────── */}
          <div className="max-w-sm">
            {/* Sàn 15px: hàng chữ nhỏ giãn rộng của măng-sét cũng không được xuống dưới sàn.
                Giãn chữ 0.22em → 0.12em cho hai chữ vẫn tách ra mà không rã. */}
            <p className="text-[15px] uppercase leading-tight tracking-[0.12em] text-muted-foreground">
              Gia phả họ
            </p>
            <p className="mt-1 font-[family-name:var(--font-pha)] text-[22px] font-semibold leading-none">
              {tenPha}
            </p>
            {/* Không xưng hô, câu không chủ ngữ — EXPERIENCE.md § Voice and Tone. */}
            <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground">
              Bản phả này còn dở, và cố ý để dở. Ai trong họ cũng ghi thêm được; mỗi điều ghi vào
              đều mang theo tên người ghi và chỗ dựa của nó.
            </p>
          </div>

          <Cot tua="Đi tiếp" duong={quanTri ? [...DI_TIEP, ...DI_TIEP_QUAN_TRI] : DI_TIEP} />
          <Cot tua="Quyền của người trong phả" duong={QUYEN} />
        </div>

        {/* ── Dòng cuối ───────────────────────────────────────────────
            Vạch mảnh, KHÔNG phải vạch đôi: vạch đôi để dành cho ranh giới lớn. */}
        <div aria-hidden className="mt-10 h-px bg-border" />
        <p className="py-6 text-[15px] text-muted-foreground">
          Mỗi khẳng định trong phả đều ghi rõ ai khai, khi nào, dựa vào đâu — chạm vào một mức tin
          cậy để xem.
        </p>
      </div>
    </footer>
  );
}
