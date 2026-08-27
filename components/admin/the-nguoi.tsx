'use client';

/**
 * THẺ NGƯỜI trên canvas của bàn làm việc — story 5-2.
 *
 * ── Ba luật giữ cho chữ không bao giờ tràn ─────────────────────────────────────────────────
 * `overflow-hidden` ở KHỐI NỘI DUNG (không phải ở vỏ — nhãn ngồi ngoài vỏ, xem chú thích tại
 * chỗ) · `min-w-0` + `truncate` ở mọi ô chữ co giãn · `shrink-0` ở mọi thứ KHÔNG được co (chấm
 * tin cậy, chip đời, icon). Thiếu một trong ba là chữ chạy ra ngoài viền, và trên canvas thì
 * không có thanh cuộn nào cứu.
 *
 * ── Vì sao dùng CHIP thay chữ ─────────────────────────────────────────────────────────────
 * Diện tích trên canvas là thứ đắt nhất. Số đời là một ô vuông nhỏ; "gốc của tộc" là một vương
 * miện chứ không phải mười một ký tự. Chữ đầy đủ nằm ở cột phải (5-3), nơi có chỗ.
 *
 * Nhưng ba mức tin cậy **KHÔNG được mã hoá chỉ bằng màu** (`DESIGN.md § Colors`) — nên chấm mang
 * HÌNH khác nhau (đặc · nửa · rỗng), kèm `title` và chữ cho trình đọc màn hình.
 *
 * ── Không import `@/core/*` ───────────────────────────────────────────────────────────────
 * `docs/build-contract.md § Phân tầng`: `components/` không biết gì về core. Nên thẻ nhận đúng
 * hình dạng dưới đây, do trang dịch từ `NeighborhoodNode` sang — cùng nếp `KetQuaTim` của ô tìm.
 */
import { Crown, Users } from 'lucide-react';
import { NHAN_TIN_CAY } from './phieu-ly-lich';
import { Handle, Position, type NodeProps, type NodeTypes } from '@xyflow/react';
import { dongBanDoi, type BanDoiThe } from './ban-doi-the';

export type { BanDoiThe, DongBanDoi } from './ban-doi-the';

export type MucTinCay = 'chac-chan' | 'theo-loi-ke' | 'ton-nghi';

export type DuLieuTheNguoi = {
  hoTen: string;
  /**
   * Bạn đời hiện CHUNG THẺ — vợ chồng là một chỗ trong phả, không phải hai node cạnh nhau.
   *
   * DANH SÁCH, không phải một người. Nhiều đời vợ/chồng là chuyện phả cổ chép thật
   * (`core/person/chong.ts`), và trước bản vá 25/08 thẻ chỉ lấy `partners[0]`: người thứ hai
   * biến mất khỏi canvas hoàn toàn — không node riêng, không dòng trên thẻ, không một dấu nào
   * nói rằng có người bị bỏ. Người vận hành không thể sửa thứ họ không nhìn thấy.
   */
  banDoi: BanDoiThe[];
  /** `null` = chưa biết đời (mảnh chưa nối tới gốc). KHÔNG hiện thành `0`. */
  doi: number | null;
  /** Mã chi, `null` với người kết hôn vào họ và với gốc mảnh. */
  chi: string | null;
  laGocManh: boolean;
  tinCay: MucTinCay;
  tonNghi: boolean;
  laNeo: boolean;
  /** Node MỜ của người sắp thêm (story 5-4) — chưa ghi gì, chưa chọn được. */
  sapThem?: boolean;
  /**
   * Có một TÀI KHOẢN đang xin nhận chính chỗ này (story 5-5, FR-64).
   *
   * KHÔNG sinh node mới cho người xin: `requestAttachment` là *nhận một node đã có*, không phải
   * thêm người. Vẽ ra một node mờ hình người bên cạnh là bày rằng sắp có thêm một người trong
   * phả — sai, và sai đúng vào chỗ AD-8 dựng ra để giữ: **một tài khoản không phải một người**.
   */
  coNguoiXin?: boolean;
  cao: number;
  rong: number;
};

const HINH_TIN_CAY: Record<MucTinCay, string> = {
  'chac-chan': '●',
  'theo-loi-ke': '◐',
  'ton-nghi': '○',
};
const MAU_TIN_CAY: Record<MucTinCay, string> = {
  'chac-chan': 'var(--color-tin-chac-chan)',
  'theo-loi-ke': 'var(--color-tin-loi-ke)',
  'ton-nghi': 'var(--color-tin-ton-nghi)',
};

function ChamTinCay({ muc }: { muc: MucTinCay }) {
  return (
    <span
      className="shrink-0 text-[15px] leading-none"
      style={{ color: MAU_TIN_CAY[muc] }}
      title={NHAN_TIN_CAY[muc]}
    >
      <span aria-hidden>{HINH_TIN_CAY[muc]}</span>
      <span className="sr-only">{NHAN_TIN_CAY[muc]}</span>
    </span>
  );
}

export function TheNguoi({ data, selected }: NodeProps) {
  const d = data as unknown as DuLieuTheNguoi;

  /**
   * ── Ba trục ĐỘC LẬP, không phải một chuỗi loại trừ ──────────────────────────────────────
   * Trước bản vá 25/08 đây là một chuỗi `? :` duy nhất, nên tồn nghi là nhánh CUỐI: người tồn
   * nghi mà đang là tâm, hoặc đang được chọn, hoặc có người xin nhận, thì mất sạch nét đứt và
   * vân giấy nháp — trông y hệt một người đã chốt. Mà 5-4 dời tâm sang người vừa tạo, và người
   * vừa tạo LUÔN ở tầng tồn nghi (AD-9), nên ca ấy là ca thường gặp nhất, không phải ca hiếm.
   *
   * Ba câu hỏi khác nhau, trả lời riêng:
   *   MÀU + BỀ DÀY — trạng thái nào đang nói to nhất ở đây
   *   NÉT          — dữ liệu này đã chốt chưa (nét đứt = chưa)
   *   NỀN          — chất liệu: vân giấy nháp cho tồn nghi (`DESIGN.md`: khác CHẤT LIỆU, không
   *                  khác độ đậm — làm mờ người vừa khai là giết đúng cảm xúc sản phẩm này có)
   */
  /**
   * ── Trạng thái bằng ĐỘ DÀY viền và quầng, không bằng nhãn chữ (26/08) ──────────────────
   *
   * Chủ dự án: *"Tâm đang chọn chỉ cần một glow highlight border là được, không cần hiện chữ
   * tâm."* Hàng nhãn nổi trên đỉnh thẻ vì thế bỏ đi — cùng với cả lớp bug mà nó từng gây ra
   * (nhãn sơn đè lên họ tên, lượt review Epic 5 đo được).
   *
   * Nhưng `EXPERIENCE.md § Accessibility Floor` cấm mã hoá trạng thái **chỉ bằng màu**, nên chỗ
   * nhãn chữ để lại phải có thứ khác gánh — và nó là **hình**, không phải sắc độ:
   *
   *   thường     viền 1px
   *   tâm        viền 2px, KHÔNG quầng  ⇒ một dấu lặng: đây là chỗ vùng lân cận tính từ
   *   đang chọn  viền 2px + quầng 4px   ⇒ ồn nhất, vì đây là thứ mọi thao tác đang trỏ vào
   *
   * ── Thứ tự này từng ngược, và nó làm người dùng tưởng phím tắt chạy nhầm node (sửa 26/08) ──
   * Bản trước cho TÂM quầng dày hơn ĐANG CHỌN, và kiểm `laNeo` trước `selected`. Nên bấm vào một
   * node ở xa thì node ấy nhạt hơn cái tâm đứng chỗ khác: mắt bảo cái kia đang hoạt động, tay gõ
   * `Enter`, và kết quả trông như phím nhảy lung tung — dù nó vẫn dùng đúng node vừa bấm.
   *
   * Luật: **thứ đang được thao tác thì ồn nhất.** Tâm chỉ là chỗ đứng của khung nhìn.
   *
   * Và tên trạng thái vẫn còn nguyên cho trình đọc màn hình ở `sr-only` bên dưới — bỏ chữ khỏi
   * MẮT không phải là bỏ nó khỏi máy đọc.
   */
  const vien = d.sapThem
    ? 'border-2 border-muted-foreground'
    : selected
      ? 'border-2 border-foreground ring-4 ring-foreground/25'
      : d.coNguoiXin
        ? 'border-2 border-destructive ring-2 ring-destructive/40'
        : d.laNeo
          ? 'border-2 border-primary'
          : 'border border-ban-vien';
  const net = d.tonNghi || d.sapThem ? 'border-dashed' : '';
  const nen = d.sapThem ? 'bg-ban-nen opacity-70' : d.tonNghi ? 'van-ton-nghi' : 'bg-ban-o';

  return (
    /**
     * KHÔNG `overflow-hidden` ở vỏ. Nhãn "tâm" / "sắp thêm" / "có người xin nhận" ngồi ở
     * `-top-2.5`, tức là NGOÀI hộp — vỏ cắt thì chúng biến mất, và neo với đang-chọn chỉ còn
     * phân biệt bằng MÀU VIỀN, đúng thứ `EXPERIENCE.md § Accessibility Floor` cấm.
     *
     * Chữ vẫn không tràn được: `truncate` tự mang `overflow:hidden` của riêng nó, và khối nội
     * dung bên dưới còn một lớp cắt nữa.
     */
    <div
      className={`relative rounded-md ${vien} ${net} ${nen}`}
      style={{ width: d.rong, height: d.cao }}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />

      <div className="flex h-full flex-col justify-center gap-0.5 overflow-hidden rounded-md px-2.5 text-left">
        <div className="flex items-center gap-1.5">
          <p className="font-pha min-w-0 flex-1 truncate text-[17px] leading-tight font-semibold">
            {d.hoTen}
          </p>
          {d.sapThem ? null : <ChamTinCay muc={d.tinCay} />}
        </div>

        {/* `key` theo CHỈ SỐ, không theo tên. Hai người cùng tên là chuyện phả có thật, và bản
            xem trước còn mang đúng cái tên đang gõ — gõ trùng tên người vợ đã có là hai dòng
            cùng khoá, React bỏ một, thẻ chừa lại một khoảng trắng đúng chiều cao dòng ấy. */}
        {dongBanDoi(d.banDoi).map((b, i) => (
          <p
            key={i}
            className={`flex items-center gap-1 text-[15px] leading-tight text-muted-foreground ${
              b.sapThem ? 'italic' : ''
            }`}
          >
            <Users className="size-3.5 shrink-0" aria-hidden />
            {b.dem ? (
              <span className="min-w-0 truncate">và {b.dem} người nữa</span>
            ) : (
              <>
                <span className="sr-only">bạn đời: </span>
                <span className="min-w-0 truncate">{b.ten}</span>
                {b.sapThem ? <span className="shrink-0">· sắp thêm</span> : null}
              </>
            )}
          </p>
        ))}

        <div className="flex items-center gap-1.5 text-[15px] leading-tight text-muted-foreground">
          {/* Đời có thể CHƯA BIẾT — người trong một mảnh chưa nối tới gốc. Bày `–` chứ không bày
              `0`: số 0 là một khẳng định về đời, mà ở đây ta không có khẳng định nào. */}
          <span
            className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-sm border border-ban-vien px-1 tabular-nums"
            title={d.doi === null ? 'chưa biết đời' : `đời ${d.doi}`}
          >
            <span aria-hidden>{d.doi === null ? '–' : d.doi}</span>
            <span className="sr-only">{d.doi === null ? 'chưa biết đời' : `đời ${d.doi}`}</span>
          </span>

          {d.laGocManh ? (
            <>
              <Crown className="size-3.5 shrink-0" aria-hidden />
              <span className="sr-only">cụ xa nhất hiện biết của mảnh này</span>
            </>
          ) : d.chi ? (
            <span className="min-w-0 truncate">chi {d.chi}</span>
          ) : null}
        </div>
      </div>

      {/**
        * Hàng nhãn nổi ("tâm" · "đang chọn" · "có người xin nhận" · "sắp thêm") đã BỎ 26/08 theo
        * yêu cầu giữ view gọn — cùng với cả lớp bug nó từng gây ra (nhãn sơn đè lên họ tên, lượt
        * review Epic 5 đo được).
        *
        * Chữ vẫn còn, chỉ là còn cho MÁY ĐỌC: người dùng trình đọc màn hình không "thấy" quầng
        * dày mấy pixel, nên nếu chỗ này im thì họ mất trạng thái hoàn toàn.
        */}
      <span className="sr-only">
        {d.sapThem
          ? 'sắp thêm'
          : [
              d.coNguoiXin ? 'có người xin nhận' : null,
              d.laNeo ? 'tâm' : null,
              selected ? 'đang chọn' : null,
            ]
              .filter(Boolean)
              .join(', ')}
      </span>

      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </div>
  );
}

export const KIEU_NUT: NodeTypes = { nguoi: TheNguoi };
