'use client';

/**
 * GHI THÊM một khẳng định về người đã có — story 5-6.
 *
 * ── Chỗ dễ hiểu nhầm nhất của cả sản phẩm ────────────────────────────────────────────────
 * Ghi "năm sinh 1986" xong mà thấy CẢ 1986 lẫn giá trị cũ thì phản xạ đầu tiên của bất cứ ai là
 * *"hỏng rồi"* — vì mọi phần mềm họ từng dùng đều ĐÈ lên giá trị cũ. Hệ này thì không (AD-9/AD-10):
 * sửa là ghi thêm, rồi để chồng khẳng định bày cả hai và hỏi chọn một.
 *
 * Câu giải thích dưới đây vì thế không phải trang trí. Nó là thứ giữ cho người vận hành không đi
 * tìm nút xoá — một nút cố ý không tồn tại.
 *
 * `docs/build-contract.md § Phân tầng`: file này KHÔNG import `@/core/*`.
 */
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  KIEU_O,
  LOAI_GHI_THEM,
  NHAN_LOAI,
  kiemGiaTri,
  laLoaiChon,
  laQuanHe,
  type LoaiGhiThem,
} from './loai-ghi-them';
import { ChonNoi, type UngVienNoi } from './chon-noi';
import { ChonNguoi } from './chon-nguoi';
import type { UngVienNguoi } from './tim-nguoi';
import {
  cauSeGhi,
  HUONG_QUAN_HE,
  NHAN_HUONG,
  NHAN_QUAN_HE,
  QUAN_HE_MAU,
  type HuongQuanHe,
  type LoaiQuanHe,
  type QuanHeMau,
} from './quan-he-ghi-them';

export type VaiNoi = 'que-quan' | 'tru-quan' | 'an-tang';

/** Ba vai của FR-65 §5b. Ba lần táng (nguyên/cải/di) chưa phân loại ở Đợt 2. */
const VAI: { ma: VaiNoi; nhan: string }[] = [
  { ma: 'que-quan', nhan: 'quê quán' },
  { ma: 'tru-quan', nhan: 'trú quán' },
  { ma: 'an-tang', nhan: 'nơi an táng' },
];

export function BieuMauGhiThem({
  loaiCoDinh,
  nguoiNayId,
  tenNguoiNay,
  onGui,
  onGuiNoi,
  onTimNoi,
  onTaoNoi,
  onGuiQuanHe,
  onTimNguoi,
  onDong,
}: {
  /** Mở từ dưới một chồng ⇒ loại đã biết, không cho đổi. `null` ⇒ cho chọn (lối cuối panel). */
  loaiCoDinh: LoaiGhiThem | null;
  /** Người đang mở hồ sơ — story 6-1 cần biết để loại khỏi bộ chọn và để dựng câu sẽ ghi. */
  nguoiNayId: string | null;
  tenNguoiNay: string;
  onGui: (loai: LoaiGhiThem, giaTri: string, xuatXu: string) => Promise<string | null>;
  /** Nơi đi lối riêng: giá trị của nó là một `placeId` cộng một vai, không phải một chuỗi. */
  onGuiNoi: (placeId: string, vai: VaiNoi, xuatXu: string) => Promise<string | null>;
  onTimNoi: (ten: string, donViCha: string) => Promise<UngVienNoi[]>;
  onTaoNoi: (ten: string, donViCha: string) => Promise<{ placeId: string; nhan: string } | string>;
  /**
   * Story 6-1 — quan hệ đi lối riêng: một `personId` cộng một CHIỀU.
   *
   * BẮT BUỘC, không `?:`. `CotKhangDinh` dựng biểu mẫu này ở HAI nơi gọi (nút cấp cột và nút
   * trong từng chồng); quên truyền ở một nơi phải là lỗi `tsc`, không phải một nút im lặng không
   * làm gì. Đúng cách C2 của lượt review Epic 5 được vá.
   */
  onGuiQuanHe: (a: {
    nguoiKiaId: string;
    loai: LoaiQuanHe;
    huong: HuongQuanHe;
    quanHe: QuanHeMau;
    xuatXu: string;
  }) => Promise<string | null>;
  onTimNguoi: (tuKhoa: string) => Promise<UngVienNguoi[]>;
  onDong: () => void;
}) {
  const [loai, setLoai] = useState<LoaiGhiThem>(loaiCoDinh ?? 'birth');
  const [giaTri, setGiaTri] = useState('');
  const [xuatXu, setXuatXu] = useState('');
  const [loi, setLoi] = useState<string | null>(null);
  const [dangGui, setDangGui] = useState(false);
  const [noi, setNoi] = useState<{ placeId: string; nhan: string } | null>(null);
  const [vai, setVai] = useState<VaiNoi>('que-quan');
  const [nguoiKia, setNguoiKia] = useState<UngVienNguoi | null>(null);
  const [huong, setHuong] = useState<HuongQuanHe>('cha-me');
  const [quanHe, setQuanHe] = useState<QuanHeMau>('blood');
  const id = useId();

  const laNoi = loai === 'place';
  const laQH = laQuanHe(loai);
  const kiem = kiemGiaTri(loai, giaTri);
  const loiO = !laNoi && !laQH && 'loi' in kiem && giaTri.trim() !== '' ? kiem.loi : null;
  const guiDuoc =
    (laNoi ? noi !== null : laQH ? nguoiKia !== null : 'giaTri' in kiem) &&
    xuatXu.trim() !== '' &&
    !dangGui;

  /**
   * ── `finally`, không phải một lệnh `setDangGui(false)` đặt sau lời gọi ───────────────────
   * Server action reject — mất mạng, lệch phiên bản triển khai, server 500 — thì dòng đặt sau
   * KHÔNG BAO GIỜ chạy. Nút gửi kẹt ở "Đang ghi…" vĩnh viễn, và lối ra duy nhất là tải lại trang,
   * tức là mất trắng biểu mẫu đã điền.
   *
   * ── Vì sao ĐÓNG sau khi ghi xong ────────────────────────────────────────────────────────
   * Biểu mẫu ở nguyên với chữ cũ trông y hệt "chưa ghi được". Bấm lần nữa là hai khẳng định
   * trùng — mà xoá thì không có (AD-4), nên cái thứ hai ở lại phả cho tới khi có người loại nó.
   */
  async function gui() {
    setLoi(null);
    setDangGui(true);
    try {
      const e = laNoi
        ? noi
          ? await onGuiNoi(noi.placeId, vai, xuatXu)
          : 'Chưa chọn nơi nào.'
        : laQH
          ? nguoiKia
            ? await onGuiQuanHe({
                nguoiKiaId: nguoiKia.personId,
                loai: loai as LoaiQuanHe,
                huong,
                quanHe,
                xuatXu,
              })
            : 'Chưa chọn người nào.'
          : 'giaTri' in kiem
            ? await onGui(loai, kiem.giaTri, xuatXu)
            : 'Chưa có giá trị nào để ghi.';
      if (e) setLoi(e);
      else onDong();
    } catch {
      setLoi('Không gửi được lên máy chủ. Kiểm tra mạng rồi thử lại.');
    } finally {
      setDangGui(false);
    }
  }

  const kieu = KIEU_O[loai];

  return (
    <div className="mt-2 rounded-md border border-ban-vien bg-ban-nen px-3 py-3">
      {loaiCoDinh === null ? (
        <div>
          <label
            htmlFor={`${id}-loai`}
            className="block text-[15px] font-semibold text-muted-foreground"
          >
            Ghi thêm gì
          </label>
          <select
            id={`${id}-loai`}
            value={loai}
            onChange={(e) => {
              setLoai(e.target.value as LoaiGhiThem);
              setGiaTri('');
              setNoi(null);
              setNguoiKia(null);
            }}
            className="mt-0.5 min-h-11 w-full rounded-md border border-ban-vien bg-ban-o px-3 text-[17px]"
          >
            {LOAI_GHI_THEM.map((l) => (
              <option key={l} value={l}>
                {NHAN_LOAI[l]}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className={loaiCoDinh === null ? 'mt-3' : ''}>
        {/* `noi` và `nguoi` không có ô `${id}-gia-tri` nào để trỏ tới — chúng là bộ chọn, và bộ
            chọn tự mang nhãn của nó. Một `<label htmlFor>` trỏ vào hư vô là một lời hứa hỏng với
            trình đọc màn hình. */}
        <label
          {...(laLoaiChon(loai) ? {} : { htmlFor: `${id}-gia-tri` })}
          className="block text-[15px] font-semibold text-muted-foreground"
        >
          {NHAN_LOAI[loai]}
          <span className="text-destructive"> ·</span>
          {loiO ? <span className="ml-1.5 font-normal text-destructive">{loiO}</span> : null}
        </label>

        {kieu === 'noi' ? (
          <div className="mt-0.5">
            <fieldset className="mb-2">
              <legend className="sr-only">Nơi này là gì với người ấy</legend>
              <div className="flex flex-wrap gap-3">
                {VAI.map((v) => (
                  <label key={v.ma} className="flex min-h-11 items-center gap-1.5 text-[17px]">
                    <input
                      type="radio"
                      name={`${id}-vai`}
                      checked={vai === v.ma}
                      onChange={() => setVai(v.ma)}
                      className="size-4 shrink-0"
                    />
                    <span>{v.nhan}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <ChonNoi daChon={noi} onChon={setNoi} onTim={onTimNoi} onTao={onTaoNoi} />
          </div>
        ) : kieu === 'nguoi' ? (
          <div className="mt-0.5">
            <ChonNguoi
              daChon={nguoiKia}
              nguoiNayId={nguoiNayId}
              onChon={setNguoiKia}
              onTim={onTimNguoi}
            />

            {loai === 'parent-child' ? (
              <>
                <fieldset className="mt-2">
                  {/* KHÔNG phải hai nút "lên"/"xuống". Chiều của khẳng định là thứ người vận hành
                      không có nghĩa vụ phải hiểu — họ chỉ cần nói được ai là ai. */}
                  <legend className="text-[15px] text-muted-foreground">Người vừa chọn</legend>
                  <div className="flex flex-wrap gap-3">
                    {HUONG_QUAN_HE.map((h) => (
                      <label key={h} className="flex min-h-11 items-center gap-1.5 text-[17px]">
                        <input
                          type="radio"
                          name={`${id}-huong`}
                          checked={huong === h}
                          onChange={() => setHuong(h)}
                          className="size-4 shrink-0"
                        />
                        <span>{NHAN_HUONG[h]}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="mt-2">
                  {/* Phả cổ chép cả ba, và `AssertionSpec.relation` đã đón sẵn từ Đợt 1. Không bày
                      ra thì nó là mã chết, và người chép phả mất một phân biệt họ vẫn dùng. */}
                  <legend className="text-[15px] text-muted-foreground">Quan hệ</legend>
                  <div className="flex flex-wrap gap-3">
                    {QUAN_HE_MAU.map((q) => (
                      <label key={q} className="flex min-h-11 items-center gap-1.5 text-[17px]">
                        <input
                          type="radio"
                          name={`${id}-quan-he`}
                          checked={quanHe === q}
                          onChange={() => setQuanHe(q)}
                          className="size-4 shrink-0"
                        />
                        <span>{NHAN_QUAN_HE[q]}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </>
            ) : null}

            {/* Câu SẼ ĐƯỢC GHI, dựng đúng hình panel sẽ hiện lại. Đây là hàng rào duy nhất chống
                ghi ngược chiều — và nó chỉ đòi người vận hành đọc một câu tiếng Việt. */}
            {nguoiKia ? (
              <p className="mt-2 border-l-4 border-ban-vien bg-ban-o px-2.5 py-1.5 text-[17px]">
                {cauSeGhi({
                  loai: loai as LoaiQuanHe,
                  huong,
                  quanHe,
                  tenNguoiNay,
                  tenNguoiKia: nguoiKia.hoTen,
                })}
              </p>
            ) : null}
          </div>
        ) : kieu === 'gioi' ? (
          <select
            id={`${id}-gia-tri`}
            value={giaTri}
            onChange={(e) => setGiaTri(e.target.value)}
            className="mt-0.5 min-h-11 w-full rounded-md border border-ban-vien bg-ban-o px-3 text-[17px]"
          >
            <option value="">chưa chọn</option>
            <option value="male">nam</option>
            <option value="female">nữ</option>
            <option value="other">khác</option>
          </select>
        ) : kieu === 'nhieu-dong' ? (
          <textarea
            id={`${id}-gia-tri`}
            rows={3}
            value={giaTri}
            onChange={(e) => setGiaTri(e.target.value)}
            className="mt-0.5 w-full rounded-md border border-ban-vien bg-ban-o px-3 py-2 text-[17px]"
          />
        ) : (
          <input
            id={`${id}-gia-tri`}
            value={giaTri}
            onChange={(e) => setGiaTri(e.target.value)}
            {...(kieu === 'nam' ? { inputMode: 'numeric' as const } : {})}
            className={`mt-0.5 min-h-11 w-full rounded-md border border-ban-vien bg-ban-o px-3 text-[17px] ${
              kieu === 'nam' ? 'tabular-nums' : 'font-pha'
            }`}
          />
        )}
      </div>

      <div className="mt-3">
        <label
          htmlFor={`${id}-nguon`}
          className="block text-[15px] font-semibold text-muted-foreground"
        >
          Nghe được từ đâu<span className="text-destructive"> ·</span>
        </label>
        <input
          id={`${id}-nguon`}
          value={xuatXu}
          onChange={(e) => setXuatXu(e.target.value)}
          className="mt-0.5 min-h-11 w-full rounded-md border border-ban-vien bg-ban-o px-3 text-[17px]"
        />
      </div>

      {/* KHÔNG phải trang trí — xem chú thích đầu file. */}
      <p className="mt-3 max-w-[42ch] text-[15px] text-muted-foreground">
        {laQH ? (
          /**
           * Hai chồng quan hệ có `DON_TRI = false` (`core/person/chong.ts`) nên chúng KHÔNG BAO
           * GIỜ vào trạng thái mâu thuẫn, tức không bao giờ "hỏi chọn một". Hứa điều ấy ở đây là
           * dạy người vận hành rằng ghi nhầm chiều thì cứ ghi lại cho đúng rồi chồng sẽ hỏi —
           * mà thật ra cả hai cạnh cùng sống, cha con đảo ngược đứng cạnh nhau.
           */
          <>
            Quan hệ này <strong>cộng thêm</strong>, không thay quan hệ nào đang có — cha và mẹ là
            hai khẳng định cùng đúng. Ghi nhầm thì gỡ bằng nút <em>Loại</em> ngay trên dòng ấy;
            chồng khẳng định sẽ <strong>không</strong> hỏi chọn một.
          </>
        ) : (
          <>
            Giá trị này <strong>không thay</strong> giá trị cũ — nó vào Tầng tồn nghi và đứng cạnh,
            để so được. Nếu hai thứ không thể cùng đúng, chồng khẳng định sẽ hỏi chọn một.
          </>
        )}
      </p>

      {loi ? (
        <p className="mt-2 border-l-4 border-destructive bg-canh-bao-nen px-2.5 py-1.5 text-[15px]">
          {loi}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={!guiDuoc}
          onClick={() => void gui()}
          className="h-11 text-[17px]"
        >
          {dangGui ? 'Đang ghi…' : 'Ghi vào phả'}
        </Button>
        {/* KHÔNG `disabled={dangGui}`. Một lượt gửi treo — server không trả lời bao giờ — thì
            `finally` cũng không cứu được; "Thôi" là lối ra cuối cùng và nó phải luôn mở. Đóng
            giữa chừng không huỷ được lượt ghi ở máy chủ, nhưng đó là chuyện `router.refresh()`
            của nơi gọi lo, không phải lý do khoá người dùng lại trong một biểu mẫu chết. */}
        <Button type="button" variant="ghost" onClick={onDong} className="h-11 text-[17px]">
          Thôi
        </Button>
      </div>
    </div>
  );
}
