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
  type LoaiGhiThem,
} from './loai-ghi-them';
import { ChonNoi, type UngVienNoi } from './chon-noi';

export type VaiNoi = 'que-quan' | 'tru-quan' | 'an-tang';

/** Ba vai của FR-65 §5b. Ba lần táng (nguyên/cải/di) chưa phân loại ở Đợt 2. */
const VAI: { ma: VaiNoi; nhan: string }[] = [
  { ma: 'que-quan', nhan: 'quê quán' },
  { ma: 'tru-quan', nhan: 'trú quán' },
  { ma: 'an-tang', nhan: 'nơi an táng' },
];

export function BieuMauGhiThem({
  loaiCoDinh,
  onGui,
  onGuiNoi,
  onTimNoi,
  onTaoNoi,
  onDong,
}: {
  /** Mở từ dưới một chồng ⇒ loại đã biết, không cho đổi. `null` ⇒ cho chọn (lối cuối panel). */
  loaiCoDinh: LoaiGhiThem | null;
  onGui: (loai: LoaiGhiThem, giaTri: string, xuatXu: string) => Promise<string | null>;
  /** Nơi đi lối riêng: giá trị của nó là một `placeId` cộng một vai, không phải một chuỗi. */
  onGuiNoi: (placeId: string, vai: VaiNoi, xuatXu: string) => Promise<string | null>;
  onTimNoi: (ten: string, donViCha: string) => Promise<UngVienNoi[]>;
  onTaoNoi: (ten: string, donViCha: string) => Promise<{ placeId: string; nhan: string } | string>;
  onDong: () => void;
}) {
  const [loai, setLoai] = useState<LoaiGhiThem>(loaiCoDinh ?? 'birth');
  const [giaTri, setGiaTri] = useState('');
  const [xuatXu, setXuatXu] = useState('');
  const [loi, setLoi] = useState<string | null>(null);
  const [dangGui, setDangGui] = useState(false);
  const [noi, setNoi] = useState<{ placeId: string; nhan: string } | null>(null);
  const [vai, setVai] = useState<VaiNoi>('que-quan');
  const id = useId();

  const laNoi = loai === 'place';
  const kiem = kiemGiaTri(loai, giaTri);
  const loiO = !laNoi && 'loi' in kiem && giaTri.trim() !== '' ? kiem.loi : null;
  const guiDuoc =
    (laNoi ? noi !== null : 'giaTri' in kiem) && xuatXu.trim() !== '' && !dangGui;

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
        <label
          htmlFor={`${id}-gia-tri`}
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
        Giá trị này <strong>không thay</strong> giá trị cũ — nó vào Tầng tồn nghi và đứng cạnh, để
        so được. Nếu hai thứ không thể cùng đúng, chồng khẳng định sẽ hỏi chọn một.
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
