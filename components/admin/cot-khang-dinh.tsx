'use client';

/**
 * CỘT PHẢI của bàn làm việc — chồng khẳng định (story 5-3), thu thành PHIẾU LÝ LỊCH (26/08/2026).
 *
 * ── Vì sao "chỉnh sửa" không có màn riêng ─────────────────────────────────────────────────
 * AD-9/AD-10: hệ này không bao giờ đè lên một sự thật cũ. Sửa = ghi thêm một khẳng định, rồi để
 * chồng bày cả hai. Nên sửa không phải một màn — nó xảy ra Ở ĐÂY, bất cứ chỗ nào một người đang
 * hiện. Đó là lý do cột này luôn có mặt cạnh canvas.
 *
 * ── Hình của cột: một PHIẾU, không phải một dòng thời gian ────────────────────────────────
 * Chốt 26/08/2026, sau lượt đo bằng trình duyệt. Bản trước cho mỗi chồng một khối riêng đủ bộ:
 * giá trị trong hộp viền có nền, một dòng "▸ chi tiết", một nút "Ghi thêm". Năm trường thì năm
 * lần lặp đúng bộ ấy — đo được: **146px một trường, 1017px cả cột, tràn khỏi màn 900px**, sáu
 * "chi tiết" và bốn "Ghi thêm" cùng lúc trên màn.
 *
 * Nay mỗi trường là MỘT HÀNG: nhãn trái · giá trị phải · một tam giác 44×44 ở lề phải mở nguồn
 * và thao tác. Đúng hình một phiếu lý lịch, đúng thứ chủ dự án xin: *"sắp xếp các thông tin gọn
 * gàng, ngăn nắp"*, *"không cần quá nhiều thông tin nguồn gốc từ đâu, chỉ cần hiện nó là được"*.
 *
 * Cái gì KHÔNG được lùi vào sau tam giác ấy:
 *   · chồng MÂU THUẪN — nó đòi một quyết định, nên cảnh báo và hai nút bày thẳng ra;
 *   · chip quan hệ — đường điều hướng nhanh nhất của bàn làm việc, bấm là dời tâm canvas;
 *   · hàng Con — dẫn xuất, bày và bấm được, không sửa được từ đây (AD-18).
 *
 * ── Hai kiểu chồng, hai việc khác nhau ────────────────────────────────────────────────────
 *   ⚠ MÂU THUẪN — hai giá trị không thể cùng đúng ⇒ CHỌN MỘT, bên thua rời dữ liệu sống nhưng
 *     ở lại nhật ký (AD-4). Dùng `destructive`, KHÔNG dùng son: `DESIGN.md § Cảnh báo là chàm
 *     mực` cho son đúng một nghĩa — *đã chốt*.
 *   ▸ NỐI TIẾP — nhiều giá trị cùng đúng, xếp theo thời gian ⇒ KHÔNG phải chọn gì.
 *
 * ── Không có nút "sửa", không có nút "xoá" ────────────────────────────────────────────────
 * Cố ý. Sửa là ghi thêm (story 5-6); xoá không tồn tại trong hệ này (AD-4). Đặt hai nút ấy vào
 * đây là dạy sai mô hình cho chính người sẽ dùng nó hằng ngày.
 *
 * `docs/build-contract.md § Phân tầng`: file này KHÔNG import `@/core/*`.
 */
import { useState, useTransition } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MucTinCay } from './the-nguoi';
import type { UngVienNguoi } from './tim-nguoi';
import { loaiDuocDuNoiTiep, type HuongQuanHe, type LoaiQuanHe, type QuanHeMau } from './quan-he-ghi-them';

/** Nhãn dùng trong ghi chú nhật ký — nói đúng thứ vừa bị gỡ, vì câu ấy ở lại vĩnh viễn (AD-4). */
const NHAN_LOAI_CHONG = (khoa: string): string =>
  khoa === 'parent-child'
    ? 'quan hệ cha con'
    : khoa === 'union-partner'
      ? 'quan hệ vợ chồng'
      : 'một khẳng định';
import { BieuMauGhiThem, type VaiNoi } from './bieu-mau-ghi-them';
import type { UngVienNoi } from './chon-noi';
import { ghiThemDuoc, NHAN_LOAI, type LoaiGhiThem } from './loai-ghi-them';
import { cauMauThuan, chenHangCon, gonGiaTri, hangNguon, hienGiaTriTrongChiTiet, KHOA_CON, VO_TIN_CAY } from './phieu-ly-lich';
import { dongTieuSu, type TheTieuSu } from './tieu-su';

export type KieuChong = 'mau-thuan' | 'noi-tiep' | 'don';

export type DongKhangDinh = {
  id: string;
  /**
   * Người ở đầu kia, với hai loại quan hệ. Đây là thứ cho phép CHIP mang theo tầng và nguồn của
   * chính khẳng định sinh ra nó — bản trước dựng chip từ `relations` nên chip không biết mình
   * thuộc dòng nào, và tầng biến mất khỏi mặt phiếu.
   */
  doiTuongId?: string;
  giaTri: string;
  chinhThuc: boolean;
  tinCay: MucTinCay;
  /** "theo lời kể của cụ Bảng", "tự khai", "giấy khai sinh"… — đã dựng thành câu ở tầng trên. */
  xuatXu: string;
  nguoiGhi: string;
  luc: string;
};

export type ChongKhangDinh = {
  khoa: string;
  nhan: string;
  kieu: KieuChong;
  dong: DongKhangDinh[];
  /**
   * Story 6-5 — các CỤM dòng đụng nhau khi một chồng đa trị hoá mâu thuẫn (hai cha cùng giới là
   * một cụm, hai mẹ là cụm khác; hai quê quán khác nơi). Vắng ⇒ chồng đơn trị: một cụm, mọi dòng.
   */
  cumMauThuan?: string[][];
};

export type ChipQuanHe = { personId: string; hoTen: string };

export type HoSoPanel = {
  personId: string;
  hoTen: string;
  /**
   * Story 6-7 — tiểu sử cơ bản.
   *
   * OPTIONAL vì trạng thái `loiDoc` không có gì để mang (`cay-client.tsx:149` dựng một hồ sơ chỉ
   * gồm tên giả và cờ lỗi). Đổi lại: `tsc` KHÔNG bắt được nếu một nơi gọi sau này quên truyền —
   * và bản đầu của chính story này đã quên, khối tóm tắt lặng lẽ không bao giờ hiện. Thêm nơi
   * gọi thứ hai thì kiểm bằng mắt, đừng trông vào trình biên dịch.
   */
  tieuSu?: TheTieuSu['card'];
  /** Story 6-7 — ba nhóm quan hệ; lọc riêng theo bán kính, KHÔNG đi cùng `chong`. */
  quanHe?: { chaMe: ChipQuanHe[]; banDoi: ChipQuanHe[]; con: ChipQuanHe[] };
  /** `null` = ngoài bán kính riêng tư của người xem (AD-13/AD-21). KHÔNG phải lỗi. */
  chong: ChongKhangDinh[] | null;
  /**
   * Lượt đọc HỎNG — khác cả hai nghĩa trên.
   *
   * Ba trạng thái, ba câu khác nhau, và lẫn chúng là nói dối:
   *   `chong: []`      — đã đọc được, người này chưa có khẳng định nào sống
   *   `chong: null`    — ngoài bán kính riêng tư, không được xem
   *   `loiDoc: true`   — chưa đọc được gì cả, không biết họ có gì
   *
   * Trạng thái thứ ba KHÔNG được mời ghi thêm: ghi vào một hồ sơ mình chưa đọc được là cách
   * chắc chắn nhất để đẻ ra một khẳng định trùng, mà trong hệ này trùng thì chỉ loại được.
   */
  loiDoc?: boolean;
};

/**
 * ── Kích thước của một hàng phiếu, khai một chỗ ───────────────────────────────────────────
 * Ba hằng này phải khớp nhau, nếu không thì tam giác mở nguồn đè lên giá trị (đúng lớp lỗi
 * "nhãn sơn đè lên họ tên" mà lượt review Epic 5 bắt được bằng trình duyệt):
 *   · `NHAN` — bề rộng cột nhãn trái;
 *   · `LE_PHAI` — chỗ dành cho tam giác 44×44 ở lề phải của DÒNG GIÁ TRỊ (không phải của cả
 *     hàng: khối nguồn khi mở phải dùng trọn bề ngang, nó không có gì đứng cạnh);
 *   · `min-h-11` trên cả nhãn lẫn giá trị — vừa là sàn chạm 44px, vừa là thứ cho nhãn trái và
 *     giá trị phải NGANG NHAU theo chiều dọc. Bản trước dùng `pt-0.5` đoán chừng và lệch thật.
 */
const HANG = 'flex flex-wrap items-start gap-x-2 border-b border-ban-vien py-1';
/**
 * `72px`: đo bằng trình duyệt, không đoán — nhãn dài nhất `core/person/chong.ts § NHAN` sinh ra là
 * *"Vợ chồng"*, rộng **69px** ở 15px chữ không chân. `68px` (bản trước) hụt đúng một pixel và
 * nhãn ấy gãy làm hai dòng trên mọi người có vợ chồng; không có gì tràn, không có gì đè, nên bốn
 * cổng im. Mỗi pixel thêm ở đây là một pixel bớt của chip tên người bên phải, nên không nới rộng
 * hơn mức đủ.
 *
 * ── Nhánh MÂU THUẪN cần thêm chỗ, và bản trước quên (sửa 26/08 sau code review) ──────────
 * Nhánh ấy nhét thêm một `<TriangleAlert className="size-4">` cùng `gap-1` vào CHÍNH hộp 72px
 * này, nên chữ chỉ còn `72 − 17 − 4.25 = 50.75px` (gốc `html` là 17px, xem `globals.css:187`).
 * *"Giới tính"* ở 15px semibold rộng 63px ⇒ gãy làm hai dòng ngay cạnh dấu ⚠, và `gender` là
 * `DON_TRI: true` nên ca ấy tới được bằng đúng một lượt ghi lại giới tính.
 *
 * `soi-man.mjs` cũng mù với nó: cổng chỉ báo khi cao hơn 50px, mà `min-h-11` là 46.75px — hai
 * dòng chữ 15px vẫn lọt dưới sàn ấy. Đã nới cả hai: hộp cảnh báo rộng hơn, và cổng hạ ngưỡng.
 */
const NHAN = 'flex min-h-11 w-[72px] shrink-0 items-center gap-1 text-[15px]';
const LE_PHAI = 'pr-11';

/**
 * Chip một người: bấm là dời tâm canvas. Tên người dùng chữ có chân — `DESIGN.md § Typography`.
 *
 * `px-2` chứ không `px-2.5`: cột giá trị chỉ còn 202px sau khi trừ nhãn, khe và lề phải, mà
 * *"Kiều Thị Thanh Nga"* ở 17px chữ có chân đã ăn gần hết. Lượt đo trước để `w-[76px]`, `gap-x-3`
 * và `px-2.5` — mọi chip đều gãy làm hai dòng, và một hàng chip hai dòng cao 63px thay vì 52px.
 */
const CHIP =
  'inline-flex min-h-11 items-center rounded-md border border-ban-vien px-2 font-pha text-[17px] hover:bg-ban-nen';

/**
 * Bề mặt đang bày phiếu này — story 6-10.
 *
 * `'B'` là bàn tu phả: có Nâng lên chính thức, có Loại, câu chữ được dùng từ của người vận hành.
 * `'A'` là người trong họ: KHÔNG có hai nút duyệt (kể cả khi người xem tình cờ là quản trị —
 * duyệt là việc ở `/admin`, một bề mặt không bày thứ nó không cho làm thì không dạy sai mô hình),
 * và mọi câu trỏ vào "thanh việc", "Mảnh chưa nối", "nút Loại" đổi sang lời của bề mặt A.
 *
 * BẮT BUỘC, không `?:` — quên ở một nơi gọi là bày nút duyệt cho người không có quyền, và `tsc`
 * là chỗ duy nhất bắt được.
 */
export type BeMat = 'A' | 'B';

type Props = {
  beMat: BeMat;
  hoSo: HoSoPanel | null;
  dangTai: boolean;
  onNangTang: (assertionId: string) => Promise<string | null>;
  onLoai: (assertionId: string, ghiChu: string) => Promise<string | null>;
  /** Story 5-6 — ghi thêm một khẳng định cho chính người đang bày. */
  onGhiThem: (loai: LoaiGhiThem, giaTri: string, xuatXu: string) => Promise<string | null>;
  /** Story 5-7 — nơi đi lối riêng: `placeId` + vai, không phải một chuỗi. */
  onGhiNoi: (placeId: string, vai: VaiNoi, xuatXu: string) => Promise<string | null>;
  onTimNoi: (ten: string, donViCha: string) => Promise<UngVienNoi[]>;
  onTaoNoi: (ten: string, donViCha: string) => Promise<{ placeId: string; nhan: string } | string>;
  /** Story 6-1 — nối vào một người ĐÃ CÓ. Chiều nằm trong `huong`, xem `quan-he-ghi-them.ts`. */
  onGhiQuanHe: (a: {
    nguoiKiaId: string;
    loai: LoaiQuanHe;
    huong: HuongQuanHe;
    quanHe: QuanHeMau;
    xuatXu: string;
  }) => Promise<string | null>;
  onTimNguoi: (tuKhoa: string) => Promise<UngVienNguoi[]>;
  /**
   * Story 6-7 — bấm một chip quan hệ thì DỜI TÂM canvas sang người ấy.
   *
   * BẮT BUỘC, không `?:` — một chip bấm vào không làm gì là tệ hơn một chip không bấm được.
   */
  onMoNguoi: (personId: string) => void;
};

/**
 * ── Vì sao `key` nằm Ở ĐÂY chứ không ở nơi gọi ────────────────────────────────────────────
 * Cột này giữ trạng thái đang gõ: biểu mẫu nào mở, giá trị nào trong ô, xuất xứ nào. Trạng thái
 * ấy thuộc về MỘT người. Bấm sang người khác mà React giữ nguyên component thì chữ gõ cho người
 * A còn nguyên trên màn, còn `onGhiThem` đã đóng gói id của B — lời khai về A rơi vào B.
 *
 * Trong một hệ KHÔNG CÓ NÚT XOÁ (AD-4) thì ghi nhầm là vĩnh viễn: chỉ "loại" được, và bản ghi ở
 * lại nhật ký mãi. Nên chỗ đặt `key` không thể là nơi gọi — nơi gọi có thể quên, và đã quên một
 * lần (`app/admin/cay/cay-client.tsx`, review 25/08). Đặt ở đây thì không ai quên được.
 */
export function CotKhangDinh(props: Props) {
  return <Than key={props.hoSo?.personId ?? '__chua-chon__'} {...props} />;
}

function Than({
  beMat,
  hoSo,
  dangTai,
  onNangTang,
  onLoai,
  onGhiThem,
  onGhiNoi,
  onTimNoi,
  onGhiQuanHe,
  onTimNguoi,
  onMoNguoi,
  onTaoNoi,
}: Props) {
  /**
   * Biểu mẫu nào đang mở: `undefined` = không có; `null` = mở ở cuối panel (cho chọn loại);
   * một loại = mở dưới đúng chồng ấy, loại đã biết.
   */
  const [moGhi, setMoGhi] = useState<LoaiGhiThem | null | undefined>(undefined);

  const chong = hoSo?.chong ?? null;
  const con = hoSo?.quanHe?.con ?? [];
  const chipQuanHe: Record<string, ChipQuanHe[]> = {
    'parent-child': hoSo?.quanHe?.chaMe ?? [],
    'union-partner': hoSo?.quanHe?.banDoi ?? [],
  };
  /**
   * Thứ tự hàng — luật ở `phieu-ly-lich.ts § chenHangCon`, có test. Tra chồng bằng `Map` chứ
   * không lồng hai vòng lặp: một người đủ tám loại thì vòng lồng chạy 64 lượt để dựng 8 hàng.
   */
  const theoKhoa = new Map((chong ?? []).map((c) => [c.khoa, c] as const));
  /**
   * Tên theo id, gom từ cả ba nhóm quan hệ. Dòng khẳng định mang `doiTuongId`; TÊN thì nằm ở
   * `relations`, đã lọc theo bán kính. Ghép hai thứ ấy ở đây, một lần.
   */
  const tenTheoId = new Map(
    [...chipQuanHe['parent-child']!, ...chipQuanHe['union-partner']!, ...con].map(
      (p) => [p.personId, p.hoTen] as const,
    ),
  );
  /**
   * ── Quan hệ xem được mà KHÔNG có chồng nào vẫn phải bày ──────────────────────────────────
   * `actions.ts § xemHoSo`: *"`relations` lọc TỪNG thẻ riêng theo bán kính và KHÔNG đi cùng
   * `stacks`: một người ngoài tầm nhìn đầy đủ vẫn có thể có quan hệ xem được. Buộc hai thứ vào
   * nhau là giấu mất một nửa mà không có lý do nào."*
   *
   * Ca thường gặp là `chong === null` — ngoài bán kính khẳng định, nhưng cha mẹ · vợ chồng · con
   * vẫn xem được và vẫn là đường điều hướng. Ba hàng ấy khi đó không có nguồn để mở và không có
   * gì sửa được, nên chúng bày như hàng Con: chip trần, không tam giác.
   *
   * Nối vào CUỐI chứ không chèn theo `HANG`: thứ tự ấy thuộc về `core/person/chong.ts` và chép
   * lại nó ở đây là hai nơi suy hai kiểu. Khi `chong` có mặt thì mảng này gần như luôn rỗng —
   * có chip tức là có chồng.
   */
  const chipKhongChong = (['parent-child', 'union-partner'] as const).filter(
    (k) => chipQuanHe[k]!.length > 0 && !theoKhoa.has(k),
  );
  const thuTu = chenHangCon(
    [...(chong ?? []).map((c) => c.khoa), ...chipKhongChong],
    con.length > 0,
  );
  /** Có gì để bày không — kể cả khi không đọc được một chồng nào. */
  const coHang = thuTu.length > 0;

  /**
   * KHÔNG tự dựng vỏ cột. Từ story 5-5, panel duyệt vào phả đứng TRÊN chồng khẳng định trong cùng
   * một cột — nên vỏ (`<aside>`, bề rộng, viền, vùng cuộn) thuộc về người GỌI. Component tự bọc
   * vỏ thì lồng hai lớp là hai viền và hai vùng cuộn.
   */
  return (
    <section className="px-0" aria-label="Khẳng định về người đang chọn">
      {!hoSo ? (
        <p className="px-5 py-6 text-[17px] text-muted-foreground">
          {dangTai
            ? 'Đang mở hồ sơ…'
            : beMat === 'B'
              ? 'Chọn một người trên cây để xem hệ này biết gì về họ.'
              : 'Chạm một người trên cây để xem phả ghi gì về họ.'}
        </p>
      ) : (
        <div className="px-5 py-5">
          <h2 className="font-pha text-[19px] font-semibold">{hoSo.hoTen}</h2>
          {dangTai ? (
            <p className="mt-0.5 text-[15px] text-muted-foreground">đang cập nhật…</p>
          ) : null}

          <DongDanXuat hoSo={hoSo} />

          {hoSo.loiDoc ? (
            <p className="mt-4 max-w-[46ch] border-l-4 border-destructive bg-canh-bao-nen px-2.5 py-1.5 text-[17px]">
              Chưa mở được hồ sơ người này. Chọn lại họ trên cây để thử lần nữa — đừng ghi thêm
              khi chưa đọc được những gì đã có.
            </p>
          ) : (
            <>
              {chong === null ? (
                /* Ngoài bán kính riêng tư. Nói thẳng là KHÔNG XEM ĐƯỢC, không giả vờ là chưa có
                   gì — hai chuyện ấy khác nhau, và người vận hành cần phân biệt được. Nói xong
                   thì VẪN bày những quan hệ xem được ở dưới. */
                <p className="mt-4 max-w-[46ch] text-[17px] text-muted-foreground">
                  {beMat === 'B'
                    ? 'Người này nằm ngoài phần phả xem được, nên không mở chồng khẳng định ra ở đây.'
                    : 'Người này còn sống và ở ngoài vòng ruột thịt, nên phần ghi chi tiết không hiện ở đây — chỉ người gần trong họ thấy.'}
                </p>
              ) : coHang ? null : (
                /* Rỗng THẬT: đọc được, mà không chồng nào và cũng không quan hệ nào. Chỉ
                   `chong.length === 0` là chưa đủ — một người có con trong phả vẫn có hàng Con để
                   bày, và in "chưa có khẳng định nào" ngay trên hàng ấy là tự cãi mình. */
                <p className="mt-4 max-w-[46ch] text-[17px] text-muted-foreground">
                  Chưa có khẳng định nào sống về người này.
                </p>
              )}

              {/* PHIẾU. Phân tầng bằng ĐƯỜNG KẺ, không bằng hộp và không bằng bóng —
                  `DESIGN.md § Elevation & Depth`. */}
              {coHang ? (
                /**
                 * `data-chong` là mốc bám cho bộ đo (code review 6-6). Phép `cot-phai` của
                 * `scripts/soi` hỏi *"chồng khẳng định có bị đẩy khỏi tầm nhìn không"* (6-7 AC 18)
                 * — và bản đầu neo vào `section[aria-label]`, tức mép trên của CẢ cột kể cả tên
                 * và dòng dẫn xuất, nên nó không bao giờ đo được cái nó hứa. Mốc phải là chính
                 * khối phiếu, và phải sống qua mọi lượt đổi class.
                 */
                <div data-chong className="mt-3 border-t border-ban-vien">
                  {thuTu.map((khoa) =>
                    khoa === KHOA_CON ? (
                      <HangChip
                        key={khoa}
                        nhan="Con"
                        chip={con}
                        onMoNguoi={onMoNguoi}
                        /**
                         * Hàng Con KHÔNG mang tầng và KHÔNG có "chi tiết" — và nói ra vì sao.
                         *
                         * Khẳng định cha-con mang `subject = CON` (AD-18), nên nó nằm trong hồ sơ
                         * của đứa con, không ở đây. Bản trước để chip trần y hệt chip Cha mẹ vốn
                         * CÓ tầng: một hình cho hai trạng thái nhận thức khác nhau, và không lối
                         * nào xem được ai khai. Nay chip vẫn bấm được — và bấm là mở đúng hồ sơ
                         * giữ lời khai ấy.
                         */
                        chuThich="khai trên hồ sơ của từng người con — bấm một tên để mở"
                      />
                    ) : !theoKhoa.has(khoa) ? (
                      <HangChip
                        key={khoa}
                        /* Nhãn lấy từ `NHAN_LOAI`, KHÔNG chép tay lần thứ ba. Hai chữ ấy đã có
                           ở `core/person/chong.ts § NHAN` và `loai-ghi-them.ts § NHAN_LOAI`, mà
                           chính `loai-ghi-them.ts:32` cảnh báo: "đặt nhãn thứ hai cho cùng một
                           thứ là dạy người vận hành rằng đây là hai thứ khác nhau." */
                        nhan={NHAN_LOAI[khoa as 'parent-child' | 'union-partner']}
                        chip={chipQuanHe[khoa] ?? []}
                        onMoNguoi={onMoNguoi}
                      />
                    ) : (
                      <MotChong
                        key={khoa}
                        beMat={beMat}
                        chong={theoKhoa.get(khoa)!}
                        onNangTang={onNangTang}
                        onLoai={onLoai}
                        moGhi={moGhi === khoa ? (khoa as LoaiGhiThem) : undefined}
                        onMoGhi={() => setMoGhi(khoa as LoaiGhiThem)}
                        onDongGhi={() => setMoGhi(undefined)}
                        tenTheoId={tenTheoId}
                        onGhiThem={onGhiThem}
                        onGhiNoi={onGhiNoi}
                        onTimNoi={onTimNoi}
                        onGhiQuanHe={onGhiQuanHe}
                        onTimNguoi={onTimNguoi}
                        nguoiNayId={hoSo.personId}
                        tenNguoiNay={hoSo.hoTen}
                        {...(khoa === 'parent-child' || khoa === 'union-partner'
                          ? // Chỉ hai loại QUAN HỆ mới bày thành chip; danh sách dựng từ chính
                            // `chong.dong`, không từ `relations` — xem `MotChong § tenTheoId`.
                            { onMoNguoi }
                          : {})}
                        onTaoNoi={onTaoNoi}
                      />
                    ),
                  )}
                </div>
              ) : null}
            </>
          )}

          {chong !== null ? (
            <div className="mt-4">
              {moGhi === null ? (
                <BieuMauGhiThem
                  beMat={beMat}
                  loaiCoDinh={null}
                  onGui={onGhiThem}
                  onGuiNoi={onGhiNoi}
                  onTimNoi={onTimNoi}
                  onGuiQuanHe={onGhiQuanHe}
                  onTimNguoi={onTimNguoi}
                  nguoiNayId={hoSo.personId}
                  tenNguoiNay={hoSo.hoTen}
                  onTaoNoi={onTaoNoi}
                  onDong={() => setMoGhi(undefined)}
                />
              ) : (
                /* Lối thứ hai, và là lối DUY NHẤT còn bày thẳng ra sau lượt thu gọn: cho những
                   loại người này CHƯA có khẳng định nào, nên chưa có hàng nào để mở. Không có nó
                   thì một người chỉ có tên sẽ mãi chỉ có tên. */
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMoGhi(null)}
                  className="h-11 text-[17px]"
                >
                  Ghi thêm thông tin
                </Button>
              )}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

/**
 * DÒNG DẪN XUẤT dưới tên — story 6-7, thu lại sau phản hồi 26/08.
 *
 * Bản đầu bày cả năm sinh–năm mất ở đây. Nhưng chồng "Sinh" ngay bên dưới nói đúng chuyện ấy, nên
 * cột phải in một thứ hai lần trong hai kiểu chữ khác nhau — *"các thông tin này đều đã có ở
 * trên"*. Nay chỉ còn ĐỜI và CHI: chúng tính lúc đọc (AD-5), **không có chồng nào** để nói hộ, và
 * đó chính là lý do chúng đáng một dòng riêng.
 */
function DongDanXuat({ hoSo }: { hoSo: HoSoPanel }) {
  if (!hoSo.tieuSu) return null;
  const muc = dongTieuSu({ card: hoSo.tieuSu });
  if (muc.length === 0) return null;
  return <p className="mt-0.5 text-[15px] text-muted-foreground">{muc.join(' · ')}</p>;
}

/**
 * Hàng chỉ có CHIP — không có chồng khẳng định nào đứng sau nó, nên không có nguồn để mở và
 * không có gì sửa được từ đây. Hàng này vì thế KHÔNG có tam giác, và phiếu không giả vờ ngược lại.
 *
 * Hai ca dùng tới:
 *   · CON — luôn luôn. Một khẳng định cha-con mang `subject = CON` nên nó nằm trong hồ sơ của
 *     đứa con (AD-18); ở đây Con là dẫn xuất đọc từ `relations`.
 *   · CHA MẸ / VỢ CHỒNG khi người này ngoài bán kính khẳng định (`chong === null`) mà quan hệ
 *     vẫn xem được — `actions.ts § xemHoSo` lọc hai thứ ấy RIÊNG.
 */
function HangChip({
  nhan,
  chip,
  onMoNguoi,
  chuThich,
}: {
  nhan: string;
  chip: ChipQuanHe[];
  onMoNguoi: (personId: string) => void;
  /** Một câu nói vì sao hàng này không có tầng và không có "chi tiết". */
  chuThich?: string;
}) {
  return (
    <section className={HANG}>
      <h3 className={`${NHAN} text-muted-foreground`}>{nhan}</h3>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <div className="flex min-h-11 flex-wrap items-center gap-1.5">
          {chip.map((p) => (
            <button
              key={p.personId}
              type="button"
              onClick={() => onMoNguoi(p.personId)}
              className={CHIP}
            >
              {p.hoTen}
            </button>
          ))}
        </div>
        {chuThich ? <p className="text-[15px] text-muted-foreground">{chuThich}</p> : null}
      </div>
    </section>
  );
}

/**
 * GIÁ TRỊ trần trên phiếu — không hộp, không nền, trừ khi nó TỒN NGHI.
 *
 * Tồn nghi mã hoá bằng **nét đứt + vân chéo** (`DESIGN.md:174`), không bao giờ bằng `opacity` hay
 * chữ xám nhạt: làm mờ đóng góp của người vừa khai là giết đúng cảm xúc sản phẩm tồn tại để tạo
 * ra, và nó hỏng với người mù màu lẫn khi in đen trắng. Độ tương phản chữ giữ nguyên ngang giá
 * trị chính thức.
 *
 * Bản trước bọc MỌI giá trị trong một hộp viền có nền — kể cả chính thức — nên phiếu đọc thành
 * thẻ chồng thẻ và không còn phân biệt được hai tầng bằng mắt. Nay chính thức nằm trần trên
 * giấy (nó LÀ bản ghi), tồn nghi nằm trên vân giấy nháp, bó sát chữ chứ không chiếm cả hàng.
 */
/**
 * Vỏ theo MỨC TIN CẬY — sửa 26/08/2026 sau code review.
 *
 * `DESIGN.md § Confidence` là một bảng ba hàng, và cột đầu tên là **Mức**: `chắc chắn` ·
 * `theo lời kể` · `tồn nghi` — đúng ba giá trị của `Confidence`, KHÔNG phải hai giá trị của
 * `Tier`. Bản trước nhánh theo `dong.chinhThuc` (tầng), nên hai trục bị hoán:
 *
 *   - `Tầng chính thức` + mức `tồn nghi` ⇒ vẽ nét liền, dù spec đòi nét đứt
 *   - `Tầng tồn nghi` + mức `chắc chắn` (giấy khai sinh vừa nhập) ⇒ vẽ nét đứt, dù spec đòi liền
 *   - `chắc chắn` và `theo lời kể` — hai hàng trên của bảng, hai màu viền khác nhau — không
 *     phân biệt được ở BẤT KỲ ĐÂU trên mặt phiếu
 *
 * Mà `EXPERIENCE.md § Accessibility Floor` nói thẳng sàn ấy tồn tại để phủ FR-2: *"ba mức tin cậy
 * phân biệt được khi in đen trắng và với người mù màu"*. Sau lượt thu gọn thì không.
 *
 * Tầng vẫn nói được — nó nằm ở hàng đầu của khối "chi tiết" (`hangNguon`), và ở nút
 * `Nâng lên chính thức` chỉ mọc trên dòng chưa chính thức.
 */
// `VO_TIN_CAY` sống ở `phieu-ly-lich.ts` — dùng chung với màn Mâu thuẫn.

function GiaTri({ khoa, dong }: { khoa: string; dong: DongKhangDinh }) {
  const chu = gonGiaTri(khoa, dong.giaTri);
  // Tên người là dữ liệu phả, không phải vỏ giao diện ⇒ chữ có chân, kể cả trên bề mặt B.
  const kieuChu = khoa === 'name' ? 'font-pha' : '';
  return <span className={`${VO_TIN_CAY[dong.tinCay]} ${kieuChu}`}>{chu}</span>;
}

function MotChong({
  beMat,
  chong,
  onNangTang,
  onLoai,
  moGhi,
  onMoGhi,
  onDongGhi,
  onGhiThem,
  onGhiNoi,
  onTimNoi,
  onGhiQuanHe,
  onTimNguoi,
  nguoiNayId,
  tenNguoiNay,
  tenTheoId,
  onMoNguoi,
  onTaoNoi,
}: {
  beMat: BeMat;
  chong: ChongKhangDinh;
  onNangTang: (assertionId: string) => Promise<string | null>;
  onLoai: (assertionId: string, ghiChu: string) => Promise<string | null>;
  moGhi: LoaiGhiThem | undefined;
  onMoGhi: () => void;
  onDongGhi: () => void;
  onGhiThem: (loai: LoaiGhiThem, giaTri: string, xuatXu: string) => Promise<string | null>;
  onGhiNoi: (placeId: string, vai: VaiNoi, xuatXu: string) => Promise<string | null>;
  onTimNoi: (ten: string, donViCha: string) => Promise<UngVienNoi[]>;
  onGhiQuanHe: (a: {
    nguoiKiaId: string;
    loai: LoaiQuanHe;
    huong: HuongQuanHe;
    quanHe: QuanHeMau;
    xuatXu: string;
  }) => Promise<string | null>;
  onTimNguoi: (tuKhoa: string) => Promise<UngVienNguoi[]>;
  nguoiNayId: string;
  tenNguoiNay: string;
  /**
   * Khi chồng này là QUAN HỆ và người ở đầu kia xem được: bày họ thành chip bấm được thay cho
   * chuỗi chữ.
   *
   * Chuỗi *"là con ruột của Nguyễn Quang Vinh"* đọc trọn nghĩa nhưng không bấm được, và nó nói
   * lại đúng cái nhãn "Cha mẹ" đứng bên trái. Chip vừa gọn hơn vừa là đường điều hướng.
   *
   * Rỗng (người kia ngoài bán kính riêng tư) ⇒ rơi về chuỗi chữ — vắng chip không được biến
   * thành vắng thông tin.
   */
  /**
   * Tra TÊN theo id, để dòng quan hệ bày được thành chip bấm được.
   *
   * Chip dựng từ CHÍNH `chong.dong` chứ không từ `relations` (sửa 26/08 sau code review). Bản
   * trước lấy danh sách từ `relations`, nên chip không biết mình thuộc dòng nào — mất tầng, mất
   * nguồn, và hai lời khai về cùng một cặp (`con ruột` + `con nuôi`) thu lại thành MỘT chip vì
   * `bestEdge` dedupe theo `childId|parentId`.
   */
  tenTheoId?: ReadonlyMap<string, string>;
  onMoNguoi?: (personId: string) => void;
  onTaoNoi: (ten: string, donViCha: string) => Promise<{ placeId: string; nhan: string } | string>;
}) {
  const mauThuan = chong.kieu === 'mau-thuan';
  /**
   * CỤM đụng nhau (story 6-5): chồng đơn trị là một cụm gồm tất cả; chồng đa trị hoá mâu thuẫn
   * mang các cụm của nó — mẹ đứng cạnh hai cha không thuộc cụm nào, không phải chọn gì, và không
   * được mọc nút Loại chỉ vì hai người cha kia đụng nhau. Hai cha là một cụm, hai mẹ là cụm khác
   * (sửa 29/08 sau code review): một cha chính thức KHÔNG khoá nút nâng của hai người mẹ.
   */
  const cum: string[][] = mauThuan ? (chong.cumMauThuan ?? [chong.dong.map((d) => d.id)]) : [];
  const cumCua = (id: string): string[] | undefined => cum.find((c) => c.includes(id));
  const dungNhau = new Set(cum.flat());
  /**
   * `promoteAssertion` KHÔNG hạ dòng chính thức đang có (`core/assertion/ops.ts:509`), và trong
   * hệ này không có phép hạ tầng. Nên nâng dòng thua của một chồng mâu thuẫn sinh ra HAI giá trị
   * cùng chính thức về cùng một chuyện, không gì gỡ được. Nút ấy phải biến mất, không phải báo lỗi.
   * Đếm TRONG CỤM của dòng ấy — không phải trong cả chồng.
   */
  const chinhThucTrongCum = (id: string): boolean =>
    (cumCua(id) ?? []).some((k) => chong.dong.find((d) => d.id === k)?.chinhThuc === true);
  const coChinhThuc = chong.dong.some((d) => d.chinhThuc && dungNhau.has(d.id));
  const soDongDung = dungNhau.size;
  /**
   * Chip chỉ thay chữ khi MỌI dòng đều giải được tên người ở đầu kia. Thiếu một dòng thì rơi về
   * chữ cho CẢ hàng — chú thích cũ hứa điều này nhưng chỉ thực hiện khi danh sách rỗng hoàn
   * toàn, nên một người có cha và mẹ mà mẹ ngoài bán kính thì hàng bày đúng một cha mẹ, im lặng.
   */
  const chipTuDong =
    tenTheoId && onMoNguoi
      ? chong.dong.map((d) => ({ dong: d, hoTen: d.doiTuongId ? tenTheoId.get(d.doiTuongId) : undefined }))
      : [];
  const coChip = chipTuDong.length > 0 && chipTuDong.every((c) => c.hoTen !== undefined);

  /** Chữ hàng phiếu ĐÃ bày — xem `phieu-ly-lich.ts § hienGiaTriTrongChiTiet`. */
  const chuTrenHang = coChip ? chipTuDong.map((c) => c.hoTen!) : [];

  const danhSachDong = chong.dong.map((d) => {
    // Dòng NGOÀI mọi cụm (mẹ cạnh hai cha) là dòng thường: chữ nút, ghi chú nhật ký, nút — theo
    // dòng, không theo chồng. Ghi vào nhật ký "loại khi giải mâu thuẫn" cho một người mẹ không dính
    // gì tới mâu thuẫn là một câu sai nằm lại vĩnh viễn (AD-4).
    const dinh = dungNhau.has(d.id);
    return (
      <MotDong
        key={d.id}
        dong={d}
        khoaChong={chong.khoa}
        mauThuan={dinh}
        hienGiaTri={hienGiaTriTrongChiTiet({
          mauThuan,
          soDong: chong.dong.length,
          giaTriGon: gonGiaTri(chong.khoa, d.giaTri),
          chuTrenHang,
        })}
        onLoaiDong={(id: string) =>
          onLoai(
            id,
            dinh ? 'Loại khi giải mâu thuẫn ở bàn làm việc' : `Gỡ ${NHAN_LOAI_CHONG(chong.khoa)} ghi nhầm ở bàn làm việc`,
          )
        }
        dangGiu={dinh && d.chinhThuc}
        /**
         * Hai nút DUYỆT chỉ mọc ở bề mặt B (story 6-10). Không phải hàng rào — core gác bằng
         * `gateApprover` — mà là mô hình: người trong họ ghi thêm, ban tu phả chọn.
         */
        nangDuoc={beMat === 'B' && (!dinh || !chinhThucTrongCum(d.id))}
        loaiDuoc={beMat === 'B' && (dinh || loaiDuocDuNoiTiep(chong.khoa))}
        onNangTang={onNangTang}
      />
    );
  });

  /**
   * Ghi thêm cho ĐÚNG loại này — `loaiCoDinh` khoá loại lại, không cho chọn nhầm.
   *
   * Rút ra một `const` thay vì gọi thẳng `ghiThemDuoc(chong.khoa)` trong JSX: `chong.khoa` là
   * `string`, và chỉ ở đây nó mới hẹp lại thành `LoaiGhiThem` — hẹp một lần rồi dùng, không
   * trông vào việc `tsc` có giữ được phép hẹp ấy qua hai lớp JSX hay không.
   */
  const loaiGhi = ghiThemDuoc(chong.khoa) ? chong.khoa : null;
  const khoiGhiThem = loaiGhi ? (
    moGhi ? (
      <BieuMauGhiThem
        beMat={beMat}
        loaiCoDinh={moGhi}
        onGui={onGhiThem}
        onGuiNoi={onGhiNoi}
        onTimNoi={onTimNoi}
        onGuiQuanHe={onGhiQuanHe}
        onTimNguoi={onTimNguoi}
        nguoiNayId={nguoiNayId}
        tenNguoiNay={tenNguoiNay}
        onTaoNoi={onTaoNoi}
        onDong={onDongGhi}
      />
    ) : /**
       * KHÔNG còn nút "Ghi thêm <loại>" riêng: chính GIÁ TRỊ đã là nút (xem trên). Một hàng có
       * hai lối vào cùng một biểu mẫu là một hàng dạy hai luật.
       *
       * Hàng quan hệ là ngoại lệ — ở đó giá trị là CHIP, và bấm chip nghĩa là *mở hồ sơ người
       * ấy*, không phải *sửa quan hệ*. Nên lối ghi thêm của hai loại ấy nằm trong "chi tiết".
       */
    coChip ? (
      <button
        type="button"
        onClick={onMoGhi}
        className="inline-flex min-h-11 items-center text-[17px] underline underline-offset-4"
      >
        Ghi thêm {NHAN_LOAI[loaiGhi].toLowerCase()}
      </button>
    ) : null
  ) : null;

  /**
   * ── CHỒNG MÂU THUẪN không lùi vào sau tam giác ────────────────────────────────────────
   * Nó đòi một QUYẾT ĐỊNH: cảnh báo, hai giá trị, và hai nút phải thấy ngay. Giấu chúng sau một
   * cú bấm là để một mâu thuẫn nằm im trong phả mà không ai biết.
   *
   * Cảnh báo mang khối nền chàm + viền trái đặc (`DESIGN.md § Cảnh báo là chàm mực`), cộng dấu ⚠
   * và nhãn đậm bên trái — cảnh báo KHÔNG được mã hoá chỉ bằng màu.
   */
  if (mauThuan) {
    return (
      <section className={HANG}>
        <h3 className={`${NHAN} font-semibold text-destructive`}>
          <TriangleAlert className="size-4 shrink-0" aria-hidden />
          {chong.nhan}
        </h3>
        <div className="min-w-0 flex-1 py-1">
          <p className="border-l-4 border-destructive bg-canh-bao-nen px-2.5 py-1.5 text-[15px]">
            {/* Câu nói đúng LOẠI và đúng SỐ (story 6-5) — `phieu-ly-lich.ts § cauMauThuan`, dùng chung
                với màn Mâu thuẫn. */}
            {cauMauThuan(chong.khoa, soDongDung)}{' '}
            {beMat === 'B'
              ? 'Chọn một; giá trị bị loại rời khỏi phả nhưng vẫn nằm trong nhật ký.'
              : 'Ban tu phả sẽ chọn một. Cả hai vẫn hiện ở đây cho tới lúc ấy.'}
          </p>
          {/* Chip quan hệ vẫn bấm được khi chồng cha-mẹ hoá mâu thuẫn (sửa 29/08 sau code review):
              đúng lúc cần đi xem từng người cha thì không được mất lối đi. */}
          {coChip ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {chipTuDong.map((c) => (
                <button
                  key={c.dong.id}
                  type="button"
                  onClick={() => onMoNguoi!(c.dong.doiTuongId!)}
                  className={`${CHIP} ${VO_TIN_CAY[c.dong.tinCay]}`}
                >
                  {c.hoTen}
                </button>
              ))}
            </div>
          ) : null}
          <ul className="mt-2 flex flex-col divide-y divide-ban-vien">{danhSachDong}</ul>
          {/* Khi chồng mâu thuẫn ĐÃ có một dòng chính thức, đổi ý là việc hai bước — nói ra, vì
              không nói thì người vận hành đứng nhìn một dòng không có nút nào và tưởng màn hỏng.
              Chỉ ở bề mặt B: bề mặt A không có bước nào trong hai bước ấy. */}
          {coChinhThuc && beMat === 'B' ? (
            <p className="mt-2 text-[15px] text-muted-foreground">
              Muốn đổi sang giá trị khác: <strong>loại giá trị đang giữ</strong> trước, rồi nâng
              giá trị kia lên. Giá trị bị loại vẫn nằm trong nhật ký.
            </p>
          ) : null}
          {khoiGhiThem ? <div className="mt-1">{khoiGhiThem}</div> : null}
        </div>
      </section>
    );
  }

  return (
    /**
     * HÀNG THƯỜNG: nhãn trái · giá trị phải · tam giác 44×44 ở lề phải.
     *
     * `LE_PHAI` đặt trên CỘT GIÁ TRỊ chứ không trên cả hàng, để khối nguồn khi mở dùng trọn bề
     * ngang phiếu — nó không có gì đứng cạnh, và một câu nguồn gói trong 188px thì xuống bốn dòng.
     */
    <section className={`relative ${HANG}`}>
      <h3 className={`${NHAN} text-muted-foreground`}>{chong.nhan}</h3>

      <div
        className={`flex min-h-11 min-w-0 flex-1 flex-col justify-center gap-1 text-[17px] ${LE_PHAI}`}
      >
        {coChip ? (
          <div className="flex flex-wrap gap-1.5">
            {chipTuDong.map((c) => (
              <button
                key={c.dong.id}
                type="button"
                onClick={() => onMoNguoi!(c.dong.doiTuongId!)}
                /* Vỏ theo MỨC TIN CẬY như mọi giá trị khác — chip không được là lối vòng quanh
                   `GiaTri`, chỗ DUY NHẤT biết vẽ nét đứt + vân chéo. */
                className={`${CHIP} ${VO_TIN_CAY[c.dong.tinCay]}`}
              >
                {c.hoTen}
              </button>
            ))}
          </div>
        ) : (
          chong.dong.map((d) => (
            <p key={d.id} className="leading-snug">
              {/**
               * ── Bấm THẲNG vào giá trị để sửa (26/08, phản hồi từ lượt dùng thật) ─────────
               * *"Việc ghi thêm thông tin ở sidebar không cần thêm hẳn một nút. Chỉ cần click
               * vào giá trị của profile luôn và edit tại đó sẽ hợp lý và tiện hơn."*
               *
               * Giá trị LÀ chỗ người vận hành đang nhìn khi họ nhận ra nó sai; bắt họ đi tìm một
               * nút khác là thêm một chặng cho một việc hằng ngày. Sửa ở đây vẫn là GHI THÊM
               * (AD-9) — biểu mẫu nói rõ điều đó, không có nút nào đè lên giá trị cũ.
               *
               * Loại không ghi thêm được thì giá trị vẫn là chữ trơ, không giả vờ bấm được.
               */}
              {loaiGhi ? (
                <button
                  type="button"
                  onClick={onMoGhi}
                  aria-label={`Ghi thêm ${NHAN_LOAI[loaiGhi].toLowerCase()}`}
                  className="inline-flex min-h-11 items-center text-left"
                >
                  <GiaTri khoa={chong.khoa} dong={d} />
                </button>
              ) : (
                <GiaTri khoa={chong.khoa} dong={d} />
              )}
            </p>
          ))
        )}
      </div>

      {/**
       * ── Nguồn và thao tác lùi vào, KHÔNG mất đi ──────────────────────────────────────────
       * FR-1/FR-2 buộc mọi khẳng định mang nguồn; chúng không buộc nguồn chiếm ba dòng trên mỗi
       * giá trị. Chủ dự án: *"không cần quá nhiều thông tin nguồn gốc từ đâu, chỉ cần hiện nó là
       * được"*. Nút "Nâng lên chính thức" và "Loại …" đi cùng nguồn vào đây — cách đúng một cú
       * bấm, và cú bấm ấy là một vùng chạm 44×44 có sẵn trên mọi hàng.
       *
       * `<details>` là của trình duyệt: đi được bằng bàn phím, và KHÔNG thêm một `useState` nào
       * (repo đã vấp `react-hooks/set-state-in-effect` bốn lần).
       *
       * `<details>` giữ `display:block` mặc định — đặt `flex`/`grid` lên chính nó thì Chrome nhả
       * phần thân ra ngay cả khi đóng. Bố cục hàng nằm ở `<section>` bên ngoài, `<summary>` chỉ
       * được kéo về lề phải bằng `absolute`.
       */}
      {/**
        * `open` bám theo `moGhi` — sửa 26/08 sau code review.
        *
        * `moGhi` là state React; đóng/mở `<details>` là state của TRÌNH DUYỆT. Hai thứ không biết
        * nhau, nên bản trước: mở tam giác → *Ghi thêm năm sinh* → gõ dở → gập tam giác lại ⇒
        * biểu mẫu biến khỏi màn nhưng `moGhi` vẫn là `'birth'` ⇒ cuối phiếu vẫn là nút, bấm vào
        * là unmount và mất sạch chữ đã gõ, không một câu hỏi.
        *
        * Nay biểu mẫu đang mở thì tam giác không gập được; và nếu có gập bằng đường nào khác thì
        * `onToggle` đóng luôn biểu mẫu, để hai state không lệch nhau lần nữa.
        */}
      <details
        className="group w-full"
        {...(moGhi !== undefined ? { open: true } : {})}
        onToggle={(e) => {
          if (!e.currentTarget.open && moGhi !== undefined) onDongGhi();
        }}
      >
        <summary className="absolute right-0 top-1 flex size-11 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-ban-nen marker:content-['']">
          <span aria-hidden className="inline-block transition-transform group-open:rotate-90">
            ▸
          </span>
          <span className="sr-only">Nguồn và thao tác — {chong.nhan}</span>
        </summary>
        <div className="pb-2">
          {/* Chỉ khi THẬT SỰ có nhiều dòng. Một chồng nối tiếp một dòng thì câu này giải thích
              một tình huống chưa xảy ra, và nó in ra trên mỗi chồng của mỗi người. */}
          {chong.kieu === 'noi-tiep' && chong.dong.length > 1 ? (
            <p className="mb-1 text-[15px] text-muted-foreground">
              Nhiều giá trị cùng đúng, xếp theo thời gian — không phải chọn.
            </p>
          ) : null}
          <ul className="flex flex-col divide-y divide-ban-vien">{danhSachDong}</ul>
          {khoiGhiThem ? <div className="mt-1">{khoiGhiThem}</div> : null}
        </div>
      </details>
    </section>
  );
}

function MotDong({
  dong,
  khoaChong,
  mauThuan,
  hienGiaTri,
  dangGiu,
  nangDuoc,
  loaiDuoc,
  onNangTang,
  onLoaiDong,
}: {
  dong: DongKhangDinh;
  /** Để bỏ phần đầu chuỗi khi nó nói lại đúng cái nhãn bên trái — xem `phieu-ly-lich.ts § gonGiaTri`. */
  khoaChong: string;
  mauThuan: boolean;
  /** Xem `MotChong` — hàng thường đã in giá trị ngay trên, in lại là in hai lần. */
  hienGiaTri: boolean;
  /**
   * Dòng ĐANG LÀ sự thật sống của một chồng mâu thuẫn — tức dòng chính thức, không phải dòng đầu
   * danh sách. Ca mặc định của hệ này (AD-9) là chồng TOÀN tồn nghi: ở đó chưa có sự thật sống
   * nào, nên không dòng nào được khoá, và mọi dòng đều loại được.
   */
  dangGiu: boolean;
  /** Xem `coChinhThuc` ở `MotChong`. */
  nangDuoc: boolean;
  /**
   * Dòng này gỡ được không. Chồng mâu thuẫn: luôn được (chọn một trong hai giá trị không thể cùng
   * đúng). Chồng NỐI TIẾP: chỉ hai loại quan hệ — xem `quan-he-ghi-them.ts § loaiDuocDuNoiTiep`.
   */
  loaiDuoc: boolean;
  onNangTang: (assertionId: string) => Promise<string | null>;
  /** Đã đóng gói sẵn ghi chú đúng với loại chồng — xem `NHAN_LOAI_CHONG` ở nơi gọi. */
  onLoaiDong: (assertionId: string) => Promise<string | null>;
}) {
  const [loi, setLoi] = useState<string | null>(null);
  const [dangChay, batDau] = useTransition();

  const chay = (fn: (id: string) => Promise<string | null>) => () => {
    setLoi(null);
    batDau(async () => {
      try {
        const e = await fn(dong.id);
        if (e) setLoi(e);
      } catch {
        // Promise reject BÊN TRONG một transition không tới `error.tsx`: React đẩy nó ra
        // `reportGlobalError`, tức là ra console và không đâu khác. Không bắt ở đây thì mất
        // mạng giữa chừng trông y hệt bấm-mà-không-có-gì-xảy-ra.
        setLoi('Không gửi được lên máy chủ. Kiểm tra mạng rồi thử lại.');
      }
    });
  };

  const nangHienDuoc = !dong.chinhThuc && nangDuoc;

  return (
    <li className="py-2 first:pt-0 last:pb-0">
      {hienGiaTri ? (
        <p className="text-[17px] leading-snug">
          <GiaTri khoa={khoaChong} dong={dong} />
          {/* Dấu DUY NHẤT nói đây là giá trị đang sống của một chồng mâu thuẫn. Tầng thì mắt đã
              thấy — nét đứt + vân chéo (`DESIGN.md:174`), không phải màu. */}
          {dangGiu ? (
            <span className="ml-2 text-[15px] font-semibold text-muted-foreground">ĐANG GIỮ</span>
          ) : null}
        </p>
      ) : null}

      {/* HAI hàng nguồn, không ba dòng chữ — luật ở `phieu-ly-lich.ts § hangNguon`, có test. */}
      {hangNguon(dong).map((h) => (
        <p key={h} className="text-[15px] leading-snug text-muted-foreground">
          {h}
        </p>
      ))}

      {loi ? (
        /* Lỗi nằm NGAY TẠI DÒNG, không phải một băng-rôn ở đầu panel — chồng dài thì băng-rôn ở
           trên không nói được là dòng nào hỏng. */
        <p className="mt-1.5 border-l-4 border-destructive bg-canh-bao-nen px-2.5 py-1.5 text-[15px]">
          {loi}
        </p>
      ) : null}

      {nangHienDuoc || loaiDuoc ? (
        <div className="mt-1 flex flex-wrap gap-2">
          {nangHienDuoc ? (
            <Button
              type="button"
              variant="outline"
              disabled={dangChay}
              onClick={chay(onNangTang)}
              className="h-11 text-[17px]"
            >
              Nâng lên chính thức
            </Button>
          ) : null}
          {loaiDuoc ? (
            /**
             * "Loại" chứ không phải "Xoá": AD-4 — giá trị này rời dữ liệu sống nhưng ở lại nhật
             * ký, và một ngày nào đó có thể được đọc lại. Gọi nó là xoá là nói dối.
             *
             * MỌI dòng của chồng mâu thuẫn đều loại được, KỂ CẢ dòng đang giữ. Bản trước gác
             * bằng `!dangGiu`, nên trên một chồng đã có giá trị chính thức thì dòng thua không có
             * nút nâng (đúng — nâng thêm là hai giá trị cùng chính thức) mà dòng đang giữ cũng
             * không có nút loại: màn in ra một chỉ dẫn hai bước mà bước một không bấm được, và
             * một giá trị đã chính thức thì không bao giờ đổi lại được từ màn cây nữa.
             */
            <Button
              type="button"
              variant="ghost"
              disabled={dangChay}
              onClick={chay(onLoaiDong)}
              className="h-11 text-[17px] text-destructive"
            >
              {dangGiu ? 'Loại giá trị đang giữ' : mauThuan ? 'Loại giá trị này' : 'Loại quan hệ này'}
            </Button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
