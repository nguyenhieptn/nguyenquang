'use client';

/**
 * CỘT PHẢI của bàn làm việc — chồng khẳng định (story 5-3).
 *
 * ── Vì sao "chỉnh sửa" không có màn riêng ─────────────────────────────────────────────────
 * AD-9/AD-10: hệ này không bao giờ đè lên một sự thật cũ. Sửa = ghi thêm một khẳng định, rồi để
 * chồng bày cả hai. Nên sửa không phải một màn — nó xảy ra Ở ĐÂY, bất cứ chỗ nào một người đang
 * hiện. Đó là lý do cột này luôn có mặt cạnh canvas.
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
import { ghiThemDuoc, type LoaiGhiThem } from './loai-ghi-them';

export type KieuChong = 'mau-thuan' | 'noi-tiep' | 'don';

export type DongKhangDinh = {
  id: string;
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
};

export type HoSoPanel = {
  personId: string;
  hoTen: string;
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

const NHAN_TIN_CAY: Record<MucTinCay, string> = {
  'chac-chan': 'chắc chắn',
  'theo-loi-ke': 'theo lời kể',
  'ton-nghi': 'tồn nghi',
};

type Props = {
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
  hoSo,
  dangTai,
  onNangTang,
  onLoai,
  onGhiThem,
  onGhiNoi,
  onTimNoi,
  onGhiQuanHe,
  onTimNguoi,
  onTaoNoi,
}: Props) {
  /**
   * Biểu mẫu nào đang mở: `undefined` = không có; `null` = mở ở cuối panel (cho chọn loại);
   * một loại = mở dưới đúng chồng ấy, loại đã biết.
   */
  const [moGhi, setMoGhi] = useState<LoaiGhiThem | null | undefined>(undefined);
  /**
   * KHÔNG tự dựng vỏ cột. Từ story 5-5, panel duyệt vào phả đứng TRÊN chồng khẳng định trong cùng
   * một cột — nên vỏ (`<aside>`, bề rộng, viền, vùng cuộn) thuộc về người GỌI. Component tự bọc
   * vỏ thì lồng hai lớp là hai viền và hai vùng cuộn.
   */
  return (
    <section className="px-0" aria-label="Khẳng định về người đang chọn">
      {!hoSo ? (
        <p className="px-5 py-6 text-[17px] text-muted-foreground">
          {dangTai ? 'Đang mở hồ sơ…' : 'Chọn một người trên cây để xem hệ này biết gì về họ.'}
        </p>
      ) : (
        <div className="px-5 py-5">
          <h2 className="font-pha text-[19px] font-semibold">{hoSo.hoTen}</h2>
          {dangTai ? (
            <p className="mt-1 text-[15px] text-muted-foreground">đang cập nhật…</p>
          ) : null}

          {hoSo.loiDoc ? (
            <p className="mt-4 max-w-[46ch] border-l-4 border-destructive bg-canh-bao-nen px-2.5 py-1.5 text-[17px]">
              Chưa mở được hồ sơ người này. Chọn lại họ trên cây để thử lần nữa — đừng ghi thêm
              khi chưa đọc được những gì đã có.
            </p>
          ) : hoSo.chong === null ? (
            /* Ngoài bán kính riêng tư. Nói thẳng là KHÔNG XEM ĐƯỢC, không giả vờ là chưa có gì —
               hai chuyện ấy khác nhau, và người vận hành cần phân biệt được. */
            <p className="mt-4 max-w-[46ch] text-[17px] text-muted-foreground">
              Người này nằm ngoài phần phả xem được, nên không mở chồng khẳng định ra ở đây.
            </p>
          ) : hoSo.chong.length === 0 ? (
            <p className="mt-4 max-w-[46ch] text-[17px] text-muted-foreground">
              Chưa có khẳng định nào sống về người này.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-6">
              {hoSo.chong.map((c) => (
                <MotChong
                  key={c.khoa}
                  chong={c}
                  onNangTang={onNangTang}
                  onLoai={onLoai}
                  moGhi={moGhi === c.khoa ? (c.khoa as LoaiGhiThem) : undefined}
                  onMoGhi={() => setMoGhi(c.khoa as LoaiGhiThem)}
                  onDongGhi={() => setMoGhi(undefined)}
                  onGhiThem={onGhiThem}
                  onGhiNoi={onGhiNoi}
                  onTimNoi={onTimNoi}
                  onGhiQuanHe={onGhiQuanHe}
                  onTimNguoi={onTimNguoi}
                  nguoiNayId={hoSo.personId}
                  tenNguoiNay={hoSo.hoTen}
                  onTaoNoi={onTaoNoi}
                />
              ))}
            </div>
          )}

          {hoSo.chong !== null ? (
            <div className="mt-6 border-t border-ban-vien pt-4">
              {moGhi === null ? (
                <BieuMauGhiThem
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
                /* Lối thứ hai: cho những loại người này CHƯA có khẳng định nào, nên chưa có chồng
                   để bấm vào. Không có nó thì một người chỉ có tên sẽ mãi chỉ có tên. */
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

function MotChong({
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
  onTaoNoi,
}: {
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
  onTaoNoi: (ten: string, donViCha: string) => Promise<{ placeId: string; nhan: string } | string>;
}) {
  const mauThuan = chong.kieu === 'mau-thuan';
  /**
   * `promoteAssertion` KHÔNG hạ dòng chính thức đang có (`core/assertion/ops.ts:509`), và trong
   * hệ này không có phép hạ tầng. Nên nâng dòng thua của một chồng mâu thuẫn sinh ra HAI giá trị
   * cùng chính thức về cùng một chuyện, không gì gỡ được. Nút ấy phải biến mất, không phải báo lỗi.
   */
  const coChinhThuc = chong.dong.some((d) => d.chinhThuc);
  return (
    <section>
      <div className="flex items-center gap-1.5">
        {mauThuan ? (
          <TriangleAlert className="size-4 shrink-0 text-destructive" aria-hidden />
        ) : chong.kieu === 'noi-tiep' ? (
          <span className="shrink-0 text-[15px] text-muted-foreground" aria-hidden>
            ▸
          </span>
        ) : null}
        <h3
          className={`text-[17px] font-semibold ${mauThuan ? 'text-destructive' : 'text-foreground'}`}
        >
          {chong.nhan}
        </h3>
      </div>

      {/* Nói rõ VIỆC PHẢI LÀM, không chỉ nói tên trạng thái. Chồng nối tiếp dễ bị tưởng là lỗi
          nếu không nói thẳng ra rằng cả hai đều đúng. */}
      {mauThuan ? (
        <p className="mt-1 max-w-[42ch] text-[15px] text-destructive">
          Hai giá trị không thể cùng đúng — chọn một. Giá trị bị loại rời khỏi phả nhưng vẫn nằm
          trong nhật ký.
        </p>
      ) : chong.kieu === 'noi-tiep' ? (
        <p className="mt-1 max-w-[42ch] text-[15px] text-muted-foreground">
          Nhiều giá trị cùng đúng, xếp theo thời gian — không phải chọn.
        </p>
      ) : null}

      <ul className="mt-2 flex flex-col gap-2">
        {chong.dong.map((d) => (
          <MotDong
            key={d.id}
            dong={d}
            mauThuan={mauThuan}
            onLoaiDong={(id: string) =>
              onLoai(
                id,
                mauThuan
                  ? 'Loại khi giải mâu thuẫn ở bàn làm việc'
                  : `Gỡ ${NHAN_LOAI_CHONG(chong.khoa)} ghi nhầm ở bàn làm việc`,
              )
            }
            dangGiu={mauThuan && d.chinhThuc}
            nangDuoc={!mauThuan || !coChinhThuc}
            loaiDuoc={mauThuan || loaiDuocDuNoiTiep(chong.khoa)}
            onNangTang={onNangTang}
          />
        ))}
      </ul>

      {/* Khi chồng mâu thuẫn ĐÃ có một dòng chính thức, đổi ý là việc hai bước — nói ra, vì
          không nói thì người vận hành đứng nhìn một dòng không có nút nào và tưởng màn hỏng. */}
      {mauThuan && coChinhThuc ? (
        <p className="mt-2 max-w-[42ch] text-[15px] text-muted-foreground">
          Muốn đổi sang giá trị khác: <strong>loại giá trị đang giữ</strong> trước, rồi nâng giá
          trị kia lên. Giá trị bị loại vẫn nằm trong nhật ký.
        </p>
      ) : null}

      {/* Lối thường dùng: đang nhìn một năm sinh sai thì ghi năm sinh đúng, ngay tại đó. */}
      {ghiThemDuoc(chong.khoa) ? (
        moGhi ? (
          <BieuMauGhiThem
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
        ) : (
          <button
            type="button"
            onClick={onMoGhi}
            className="mt-2 inline-flex min-h-11 items-center text-[17px] underline underline-offset-4"
          >
            Ghi thêm
          </button>
        )
      ) : null}
    </section>
  );
}

function MotDong({
  dong,
  mauThuan,
  dangGiu,
  nangDuoc,
  loaiDuoc,
  onNangTang,
  onLoaiDong,
}: {
  dong: DongKhangDinh;
  mauThuan: boolean;
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

  return (
    <li
      className={`rounded-md border px-3 py-2.5 ${
        dong.chinhThuc ? 'border-ban-vien bg-ban-nen' : 'border-dashed van-ton-nghi'
      }`}
    >
      <p className="text-[17px]">{dong.giaTri}</p>

      <p className="mt-1 text-[15px] text-muted-foreground">
        {dangGiu ? 'chính thức · ĐANG GIỮ' : dong.chinhThuc ? 'chính thức' : 'tồn nghi'} ·{' '}
        {NHAN_TIN_CAY[dong.tinCay]} · {dong.xuatXu}
      </p>
      <p className="text-[15px] text-muted-foreground">
        {dong.nguoiGhi} ghi · {dong.luc}
      </p>

      {loi ? (
        /* Lỗi nằm NGAY TẠI DÒNG, không phải một băng-rôn ở đầu panel — chồng dài thì băng-rôn ở
           trên không nói được là dòng nào hỏng. */
        <p className="mt-1.5 border-l-4 border-destructive bg-canh-bao-nen px-2.5 py-1.5 text-[15px]">
          {loi}
        </p>
      ) : null}

      {(!dong.chinhThuc && nangDuoc) || loaiDuoc ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {!dong.chinhThuc && nangDuoc ? (
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
