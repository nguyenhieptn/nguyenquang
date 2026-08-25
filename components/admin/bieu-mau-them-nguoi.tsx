'use client';

/**
 * BIỂU MẪU THÊM NGƯỜI — story 5-4, sống ở CỘT PHẢI.
 *
 * ── Vì sao không phải hộp thoại ──────────────────────────────────────────────────────────
 * Epic đòi *"thấy vị trí TRƯỚC khi ghi"*. Hộp thoại phủ lên canvas thì che mất đúng cái cần
 * nhìn. Ở cột phải, người vận hành chọn hướng quan hệ và thấy ngay node mờ nhảy tới chỗ nó sẽ
 * rơi vào — rồi mới quyết có ghi hay không.
 *
 * ── Vì sao không dùng lại luồng `/them` của bề mặt A ─────────────────────────────────────
 * NFR-5 bó luồng ấy vào *một câu hỏi một màn* — bốn màn, năm loại quan hệ. Đúng cho người cháu
 * cầm điện thoại lần đầu vào phả; sai cho người chép một trang phả giấy mười người một lượt.
 * Không phải nó hỏng; nó là dụng cụ của bàn khác.
 *
 * `docs/build-contract.md § Phân tầng`: file này KHÔNG import `@/core/*`.
 */
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { HuongThem } from './dat-nut-tam';

export type DuLieuThemNguoi = {
  hoTen: string;
  gioiTinh: '' | 'male' | 'female' | 'other';
  namSinh: string;
  namMat: string;
  ghiChu: string;
  xuatXu: string;
};

const RONG = {
  hoTen: '',
  gioiTinh: '' as const,
  namSinh: '',
  namMat: '',
  ghiChu: '',
  xuatXu: '',
};

const HUONG: { ma: HuongThem; nhan: (moc: string) => string }[] = [
  { ma: 'con', nhan: (m) => `là con của ${m}` },
  { ma: 'cha-me', nhan: (m) => `là cha/mẹ của ${m}` },
  { ma: 'vo-chong', nhan: (m) => `là vợ/chồng của ${m}` },
  { ma: 'roi', nhan: () => 'chưa biết nối vào ai' },
];

type Props = {
  /**
   * Danh tính của MỐC — người mới sẽ nối vào ai. Bắt buộc, và chính nó là `key`.
   *
   * Cùng lớp lỗi với C1/C2, và là chỗ thứ ba của nó — lượt vá 25/08 đặt khoá cho hai component
   * kia mà bỏ sót đúng cái này. Gõ tên và xuất xứ ("cụ Bảng kể qua điện thoại") cho mốc A, bấm
   * sang B rồi bấm "Thêm người quanh đây" lần nữa: `setThem` đổi mốc nhưng biểu mẫu KHÔNG dựng
   * lại, nên cả họ tên lẫn xuất xứ của A đi thẳng vào hồ sơ người mới của B. Trong một hệ không
   * có nút xoá (AD-4), một lời khai gán nhầm nguồn là vĩnh viễn.
   *
   * `huong` cố ý KHÔNG nằm trong khoá: đổi hướng là đổi ý về chỗ đứng, không phải đổi người —
   * chữ đã gõ phải ở lại.
   */
  khoa: string;
  /** `null` = vào bằng nút ở thanh việc, chưa có mốc nào. */
  tenMoc: string | null;
  huong: HuongThem;
  onDoiHuong: (h: HuongThem) => void;
  /**
   * Tên đang gõ, báo lên NGAY từng phím — node mờ trên canvas mang chính cái tên ấy.
   *
   * Không có nó thì node mờ đọc "người sắp thêm" suốt, và AC 9 của story ("thấy tên mình đang
   * gõ rơi vào đúng chỗ") không chạy. Chỉ báo TÊN, không báo cả biểu mẫu: canvas chỉ cần tên,
   * và mỗi phím gõ vào ô năm mất mà cũng dựng lại bố cục thì phí.
   */
  onDoiTen: (ten: string) => void;
  daThayCanhCu: boolean;
  onGui: (d: DuLieuThemNguoi) => Promise<string | null>;
  onDong: () => void;
};

export function BieuMauThemNguoi({ khoa, ...rest }: Props) {
  return <Than key={khoa} {...rest} />;
}

function Than({
  tenMoc,
  huong,
  onDoiHuong,
  onDoiTen,
  daThayCanhCu,
  onGui,
  onDong,
}: Omit<Props, 'khoa'>) {
  const [d, setD] = useState<DuLieuThemNguoi>(RONG);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangGui, setDangGui] = useState(false);
  const id = useId();

  const dat = <K extends keyof DuLieuThemNguoi>(k: K, v: DuLieuThemNguoi[K]) =>
    setD((cu) => ({ ...cu, [k]: v }));

  const namHong = (v: string) => v !== '' && !/^\d{4}$/.test(v);
  const thuTuHong =
    /^\d{4}$/.test(d.namSinh) && /^\d{4}$/.test(d.namMat) && Number(d.namMat) < Number(d.namSinh);

  const guiDuoc =
    d.hoTen.trim() !== '' &&
    d.xuatXu.trim() !== '' &&
    !namHong(d.namSinh) &&
    !namHong(d.namMat) &&
    !thuTuHong &&
    !dangGui;

  async function gui() {
    setLoi(null);
    setDangGui(true);
    try {
      const e = await onGui(d);
      // Ghi hỏng thì GIỮ NGUYÊN mọi thứ đã gõ — mất một biểu mẫu đã điền là cách nhanh nhất làm
      // người vận hành bỏ màn.
      if (e) setLoi(e);
    } catch {
      // Chính lời hứa ở trên: một server action bị từ chối cũng KHÔNG được cướp biểu mẫu. Không
      // `catch` thì `setDangGui(false)` không chạy, nút kẹt ở "Đang ghi…", và tải lại trang là
      // lối duy nhất — tức là mất trắng đúng thứ dòng chú thích kia thề sẽ giữ.
      setLoi('Không gửi được lên máy chủ. Kiểm tra mạng rồi thử lại.');
    } finally {
      setDangGui(false);
    }
  }

  return (
    <div className="px-5 py-5">
      <h2 className="text-[19px] font-semibold">Thêm người vào phả</h2>

      {/* Hướng quan hệ đứng TRÊN CÙNG: nó quyết định node mờ rơi vào đâu, nên nó là câu hỏi đầu
          tiên chứ không phải một ô nhét cuối biểu mẫu. */}
      <fieldset className="mt-4">
        <legend className="text-[15px] font-semibold text-muted-foreground">
          Người này đứng ở đâu
        </legend>
        <div className="mt-1.5 flex flex-col gap-1">
          {HUONG.filter((h) => tenMoc !== null || h.ma === 'roi').map((h) => (
            <label
              key={h.ma}
              className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[17px]"
            >
              <input
                type="radio"
                name={`${id}-huong`}
                checked={huong === h.ma}
                onChange={() => onDoiHuong(h.ma)}
                className="size-4 shrink-0"
              />
              <span>{h.nhan(tenMoc ?? '')}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {huong === 'roi' ? (
        /* "Chưa biết" là lựa chọn HỢP LỆ, không phải đường cùng — FR-63 gọi người ấy là "cụ xa
           nhất hiện biết" của mảnh, không phải một lời khai Thuỷ tổ. */
        <p className="mt-2 max-w-[42ch] text-[15px] text-muted-foreground">
          Người này sẽ đứng thành gốc tạm của một mảnh riêng. Nối vào cây chung được sau, ở màn
          Mảnh chưa nối.
        </p>
      ) : null}

      {daThayCanhCu ? (
        <p className="mt-2 max-w-[42ch] border-l-4 border-destructive bg-canh-bao-nen px-2.5 py-1.5 text-[15px]">
          {tenMoc} đã có cha trong phả. Hình xem trước đang treo lại theo người sắp thêm; ghi xong
          thì hai lời khai cùng tồn tại, và chồng khẳng định sẽ hỏi chọn một.
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-3">
        <O nhan="Họ và tên" id={`${id}-ten`} batBuoc>
          <input
            id={`${id}-ten`}
            value={d.hoTen}
            onChange={(e) => {
              dat('hoTen', e.target.value);
              onDoiTen(e.target.value);
            }}
            className="font-pha min-h-11 w-full rounded-md border border-ban-vien bg-ban-nen px-3 text-[17px]"
          />
        </O>

        <O nhan="Giới tính" id={`${id}-gioi`}>
          <select
            id={`${id}-gioi`}
            value={d.gioiTinh}
            onChange={(e) => dat('gioiTinh', e.target.value as DuLieuThemNguoi['gioiTinh'])}
            className="min-h-11 w-full rounded-md border border-ban-vien bg-ban-nen px-3 text-[17px]"
          >
            <option value="">chưa rõ</option>
            <option value="male">nam</option>
            <option value="female">nữ</option>
            <option value="other">khác</option>
          </select>
        </O>

        <div className="flex gap-3">
          <O nhan="Năm sinh" id={`${id}-sinh`} loi={namHong(d.namSinh) ? 'bốn chữ số' : null}>
            <input
              id={`${id}-sinh`}
              inputMode="numeric"
              value={d.namSinh}
              onChange={(e) => dat('namSinh', e.target.value)}
              className="min-h-11 w-full rounded-md border border-ban-vien bg-ban-nen px-3 text-[17px] tabular-nums"
            />
          </O>
          <O
            nhan="Năm mất"
            id={`${id}-mat`}
            loi={namHong(d.namMat) ? 'bốn chữ số' : thuTuHong ? 'trước năm sinh' : null}
          >
            <input
              id={`${id}-mat`}
              inputMode="numeric"
              value={d.namMat}
              onChange={(e) => dat('namMat', e.target.value)}
              className="min-h-11 w-full rounded-md border border-ban-vien bg-ban-nen px-3 text-[17px] tabular-nums"
            />
          </O>
        </div>

        {/* FR-1: đơn vị dữ liệu không phải "người" mà là KHẲNG ĐỊNH về người — ai khai, dựa vào
            đâu. Đây là bàn của người chép lại lời người khác, nên ô này bắt buộc. */}
        <O nhan="Nghe được từ đâu" id={`${id}-nguon`} batBuoc>
          <input
            id={`${id}-nguon`}
            value={d.xuatXu}
            onChange={(e) => dat('xuatXu', e.target.value)}
            className="min-h-11 w-full rounded-md border border-ban-vien bg-ban-nen px-3 text-[17px]"
          />
          <span className="mt-0.5 block text-[15px] text-muted-foreground">
            ví dụ: cụ Bảng kể qua điện thoại · gia phả giấy chi Hai, trang 12
          </span>
        </O>

        <O nhan="Ghi chú" id={`${id}-ghi-chu`}>
          <textarea
            id={`${id}-ghi-chu`}
            rows={2}
            value={d.ghiChu}
            onChange={(e) => dat('ghiChu', e.target.value)}
            className="w-full rounded-md border border-ban-vien bg-ban-nen px-3 py-2 text-[17px]"
          />
        </O>
      </div>

      <p className="mt-3 max-w-[42ch] text-[15px] text-muted-foreground">
        Mọi thứ ghi ở đây vào Tầng tồn nghi và hiện ngay trên cây. Nâng lên chính thức là việc
        riêng, làm ở chồng khẳng định.
      </p>

      {loi ? (
        <p className="mt-3 border-l-4 border-destructive bg-canh-bao-nen px-2.5 py-1.5 text-[15px]">
          {loi}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {/* Son nằm ở đây — nút GỬI, thứ thật sự ghi. Nút mở biểu mẫu trên thanh việc thì không. */}
        <Button
          type="button"
          disabled={!guiDuoc}
          onClick={() => void gui()}
          className="h-11 text-[17px]"
        >
          {dangGui ? 'Đang ghi…' : 'Ghi vào phả'}
        </Button>
        {/* Luôn mở — xem chú thích cùng nội dung ở `bieu-mau-ghi-them.tsx`. */}
        <Button type="button" variant="ghost" onClick={onDong} className="h-11 text-[17px]">
          Thôi
        </Button>
      </div>
    </div>
  );
}

/** Nhãn THẬT nối bằng `htmlFor` — `placeholder` không thay được nhãn cho trình đọc màn hình. */
function O({
  nhan,
  id,
  batBuoc,
  loi,
  children,
}: {
  nhan: string;
  id: string;
  batBuoc?: boolean;
  loi?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[15px] font-semibold text-muted-foreground">
        {nhan}
        {batBuoc ? <span className="text-destructive"> ·</span> : null}
        {loi ? <span className="ml-1.5 font-normal text-destructive">{loi}</span> : null}
      </label>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
