'use client';

/**
 * BỘ CHỌN NƠI — story 5-7, FR-65.
 *
 * ── Luật một dòng ────────────────────────────────────────────────────────────────────────
 * Ứng viên **không bao giờ bày chỉ tên**. Hai "Quang Trung" nằm cạnh nhau mà trông giống hệt là
 * đúng cái hỏng FR-65 sinh ra để chặn — đơn vị hành chính cha là thứ duy nhất phân biệt chúng, nên
 * nó phải nằm ngay trên dòng, không giấu trong tooltip.
 *
 * ── Không có bước "tạo danh mục trước" ───────────────────────────────────────────────────
 * FR-65: *"Nhập không được chặn luồng"*. Gõ tự do → thấy ứng viên → chọn một **hoặc tạo mới ngay
 * tại chỗ**. Không có ứng viên nào là trạng thái BÌNH THƯỜNG, không phải lỗi: nó chỉ có nghĩa là
 * nơi này chưa ai ghi bao giờ.
 *
 * `docs/build-contract.md § Phân tầng`: file này KHÔNG import `@/core/*`.
 */
import { useEffect, useId, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type UngVienNoi = {
  placeId: string;
  /** LUÔN là "Tên, đơn vị cha" — tầng trên dựng sẵn, component không tự ghép. */
  nhan: string;
  muc: 'cao' | 'vua' | 'thap';
  vi: string[];
};

const NHAN_MUC: Record<UngVienNoi['muc'], string> = {
  cao: 'gần chắc là nơi này',
  vua: 'có thể là nơi này',
  thap: 'chỉ hơi giống',
};

export function ChonNoi({
  daChon,
  onChon,
  onTim,
  onTao,
}: {
  daChon: { placeId: string; nhan: string } | null;
  onChon: (noi: { placeId: string; nhan: string } | null) => void;
  onTim: (ten: string, donViCha: string) => Promise<UngVienNoi[]>;
  onTao: (ten: string, donViCha: string) => Promise<{ placeId: string; nhan: string } | string>;
}) {
  const [ten, setTen] = useState('');
  const [cha, setCha] = useState('');
  /**
   * Kết quả mang theo TỪ KHOÁ đã sinh ra nó — cùng nếp ô tìm người của 5-1, và vì hai lý do:
   *
   *   1. Kết quả của từ khoá cũ không được nằm trên màn trong lúc gõ từ khoá mới; người nhập bấm
   *      nhầm sang một nơi khác mà không thấy gì sai.
   *   2. "Đang tìm" SUY RA được từ đây (`khoa !== ketQua.khoa`), nên không cần một `setState` trong
   *      thân effect — thứ ESLint `react-hooks/set-state-in-effect` cấm, và cấm có lý.
   */
  const [ketQua, setKetQua] = useState<{ khoa: string; ds: UngVienNoi[]; loi?: boolean }>({ khoa: '', ds: [] });
  const [loi, setLoi] = useState<string | null>(null);
  const [dangTao, setDangTao] = useState(false);
  const id = useId();

  const khoa = `${ten.trim()}|${cha.trim()}`;
  const ungVien = ketQua.khoa === khoa ? ketQua.ds : [];
  const dangTim = ten.trim() !== '' && ketQua.khoa !== khoa;
  const loiTim = ketQua.khoa === khoa && ketQua.loi === true;

  // Gõ tới đâu tìm tới đó, chờ 300ms cho tay dừng. Chốt hiệu lực theo lượt để kết quả về sai thứ
  // tự không ghi đè kết quả mới — cùng cái bẫy đã sửa ở ô tìm của 5-2.
  useEffect(() => {
    if (ten.trim() === '') return;
    let conHieuLuc = true;
    const k = `${ten.trim()}|${cha.trim()}`;
    const t = setTimeout(() => {
      onTim(ten, cha)
        .then((ds) => {
          if (conHieuLuc) setKetQua({ khoa: k, ds });
        })
        .catch(() => {
          /**
           * Đọc hỏng vẫn phải thoát khỏi "đang tìm", kẻo bộ chọn treo vĩnh viễn (bài học từ ô tìm
           * của 5-1) — nhưng KHÔNG được đọc thành "chưa có nơi nào giống".
           *
           * Ở ô tìm người, lời nói dối ấy chỉ tốn một lượt gõ lại. Ở đây nó kết thúc bằng một
           * lượt GHI: màn mời tạo nơi mới, người nhập tạo, và danh mục có thêm một bản trùng —
           * mà `core/place` chưa có đường gộp hay đường xoá. Cùng luật `null` ≠ `0` đã sửa cho
           * `timNguoi` hôm nay, và ở đây hậu quả nặng hơn.
           */
          if (conHieuLuc) setKetQua({ khoa: k, ds: [], loi: true });
        });
    }, 300);
    return () => {
      conHieuLuc = false;
      clearTimeout(t);
    };
  }, [ten, cha, onTim]);

  if (daChon) {
    return (
      <div className="flex min-h-11 items-center gap-2 rounded-md border border-ban-vien bg-ban-o px-3">
        <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-[17px]">{daChon.nhan}</span>
        {/* `min-h-11` + `px-2`: đây là lối DUY NHẤT gỡ một nơi chọn nhầm, mà bản trước nó là một
            vùng chạm ~30×19px — dưới sàn 44×44 của `EXPERIENCE.md § Accessibility Floor`, và là
            control duy nhất trong cả cột không mang `min-h-11`. */}
        <button
          type="button"
          onClick={() => onChon(null)}
          className="-mr-2 inline-flex min-h-11 shrink-0 items-center px-2 text-[15px] underline underline-offset-4"
        >
          đổi
        </button>
      </div>
    );
  }

  async function tao() {
    if (dangTao) return; // bấm đúp là hai lượt tạo, và nơi thì không gỡ được
    setLoi(null);
    setDangTao(true);
    let ra: Awaited<ReturnType<typeof onTao>>;
    try {
      ra = await onTao(ten, cha);
    } catch {
      setLoi('Không gửi được lên máy chủ. Kiểm tra mạng rồi thử lại.');
      return;
    } finally {
      setDangTao(false);
    }
    if (typeof ra === 'string') {
      setLoi(ra);
      return;
    }
    /**
     * Nhãn lấy từ CORE, không dựng lại từ chữ vừa gõ.
     *
     * Gõ "quang trung, dinh hoa" — lối không dấu mà AD-16 sinh ra để đỡ — rồi trúng một nơi đã
     * có tên "Quang Trung, Định Hoá, Thái Nguyên": dựng nhãn từ chữ gõ thì chip hiện lại đúng
     * chuỗi không dấu ấy, trên chính màn có nhiệm vụ nói RÕ đã gắn vào nơi nào trong hai nơi
     * trùng tên. Nhãn phải là của hàng thật.
     */
    onChon({ placeId: ra.placeId, nhan: ra.nhan });
  }

  const taoDuoc = ten.trim() !== '' && !dangTao;

  return (
    <div>
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={`${id}-ten`} className="block text-[15px] text-muted-foreground">
            Tên nơi
          </label>
          <input
            id={`${id}-ten`}
            value={ten}
            onChange={(e) => setTen(e.target.value)}
            className="mt-0.5 min-h-11 w-full rounded-md border border-ban-vien bg-ban-o px-3 text-[17px]"
          />
        </div>
        <div className="min-w-0 flex-1">
          {/* KHÔNG phải ô phụ. Đây là thứ duy nhất phân biệt hai "Quang Trung", nên nó đứng ngang
              hàng với tên chứ không nằm dưới một nút "thêm chi tiết". */}
          <label htmlFor={`${id}-cha`} className="block text-[15px] text-muted-foreground">
            Thuộc đơn vị nào
          </label>
          <input
            id={`${id}-cha`}
            value={cha}
            onChange={(e) => setCha(e.target.value)}
            className="mt-0.5 min-h-11 w-full rounded-md border border-ban-vien bg-ban-o px-3 text-[17px]"
          />
        </div>
      </div>

      {ten.trim() === '' ? null : dangTim ? (
        <p role="status" className="mt-2 text-[15px] text-muted-foreground">
          Đang tìm…
        </p>
      ) : (
        <div className="mt-2">
          {ungVien.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {ungVien.map((u) => (
                <li key={u.placeId}>
                  <button
                    type="button"
                    onClick={() => onChon({ placeId: u.placeId, nhan: u.nhan })}
                    className="flex min-h-11 w-full flex-col justify-center rounded-md border border-ban-vien bg-ban-o px-3 py-1.5 text-left hover:bg-ban-nen"
                  >
                    <span className="text-[17px]">{u.nhan}</span>
                    <span className="text-[15px] text-muted-foreground">
                      {NHAN_MUC[u.muc]}
                      {u.vi.includes('KHÁC đơn vị cha') ? ' · khác đơn vị cha' : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : loiTim ? (
            <p
              role="status"
              className="border-l-4 border-destructive bg-canh-bao-nen px-2.5 py-1.5 text-[15px]"
            >
              Chưa đọc được danh mục nơi — <strong>không phải là chưa có nơi nào giống</strong>.
              Sửa từ khoá để thử lại trước khi tạo mới, kẻo tạo trùng một nơi đã có.
            </p>
          ) : (
            /* Không có ứng viên là chuyện BÌNH THƯỜNG — nơi này chưa ai ghi bao giờ. Bày lỗi ở đây
               là dạy người nhập rằng họ vừa làm sai một việc hoàn toàn đúng. */
            <p className="text-[15px] text-muted-foreground">
              Chưa có nơi nào giống trong danh mục.
            </p>
          )}

          <Button
            type="button"
            variant="outline"
            disabled={!taoDuoc}
            onClick={() => void tao()}
            className="mt-2 h-11 text-[17px]"
          >
            Thêm nơi mới: {ten.trim() || '…'}
            {cha.trim() ? `, ${cha.trim()}` : ''}
          </Button>

          {loi ? (
            <p className="mt-2 border-l-4 border-destructive bg-canh-bao-nen px-2.5 py-1.5 text-[15px]">
              {loi}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
