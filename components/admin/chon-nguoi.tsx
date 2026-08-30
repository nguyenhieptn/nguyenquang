'use client';

/**
 * BỘ CHỌN NGƯỜI — story 6-1.
 *
 * ── Không có lối "tạo người mới ngay tại chỗ" ────────────────────────────────────────────
 * `ChonNoi` có, vì FR-65 cấm chặn luồng nhập nơi. Bộ chọn này KHÔNG: tạo người mới đã là việc của
 * `themNguoi` (5-4), và một biểu mẫu hai công dụng là một biểu mẫu dễ bấm nhầm — mà bấm nhầm ở
 * đây đẻ ra một bản trùng, thứ chỉ gộp mới gỡ được.
 *
 * ── Ngữ nghĩa combobox đầy đủ ────────────────────────────────────────────────────────────
 * Ô tìm của 5-1 nợ chỗ này (`deferred-work.md`): không `role`, không đi được bằng phím mũi tên,
 * không vùng `aria-live`. Trả ở đây, và trả đủ — `EXPERIENCE.md § Accessibility Floor` không cho
 * phân biệt chỉ bằng màu, thì cũng không cho một control chỉ dùng được bằng chuột.
 *
 * `docs/build-contract.md § Phân tầng`: file này KHÔNG import `@/core/*`.
 */
import { useEffect, useId, useState } from 'react';
import { Users } from 'lucide-react';
import { trangThaiTim, type KetQuaTimNguoi, type UngVienNguoi } from './tim-nguoi';

export type { UngVienNguoi };

export function ChonNguoi({
  beMat,
  daChon,
  nguoiNayId,
  onChon,
  onTim,
}: {
  /** Câu "chưa có ai tên ấy" chỉ đường tới nút thêm người — nút ấy ở hai chỗ khác nhau trên hai bề mặt. */
  beMat: 'A' | 'B';
  daChon: UngVienNguoi | null;
  /** Người đang mở hồ sơ — bị loại khỏi danh sách, vì không ai là cha của chính mình. */
  nguoiNayId: string | null;
  onChon: (nguoi: UngVienNguoi | null) => void;
  onTim: (tuKhoa: string) => Promise<UngVienNguoi[]>;
}) {
  const [tuKhoa, setTuKhoa] = useState('');
  /** Kết quả mang theo TỪ KHOÁ sinh ra nó — xem `chon-nguoi.ts § trangThaiTim`. */
  const [ketQua, setKetQua] = useState<KetQuaTimNguoi>({ khoa: '', ds: [] });
  /**
   * Con trỏ bàn phím mang theo TỪ KHOÁ nó thuộc về — cùng nếp `{ khoa, ds }` ngay trên.
   *
   * Bản đầu dùng một `useEffect` đặt lại con trỏ mỗi khi kết quả đổi, và `react-hooks/
   * set-state-in-effect` chặn ngay — lần thứ TƯ repo vấp đúng cái bẫy ấy (5-1 → 5-3 → 5-7 → đây).
   * Lối đúng vẫn là lối cũ: đừng đồng bộ hai trạng thái bằng effect, hãy suy một cái ra từ cái kia.
   */
  const [contro, setContro] = useState<{ khoa: string; i: number }>({ khoa: '', i: -1 });
  const id = useId();

  // Trạng thái và danh sách suy RA CÙNG MỘT LƯỢT — tách đôi thì chúng lệch nhau ở đúng ca tìm
  // chính mình (xem `tim-nguoi.ts § chi-minh`).
  const { trangThai, ungVien } = trangThaiTim(tuKhoa, ketQua, nguoiNayId);
  // Danh sách hiện trên màn ở bốn trạng thái, không chỉ khi có ứng viên — `aria-expanded` phải
  // nói đúng cái mắt thấy.
  const hienDanhSach = trangThai === 'co' || trangThai === 'khong-co' || trangThai === 'chi-minh';
  const moDanhSach = ungVien.length > 0;
  // Con trỏ của một danh sách CŨ không được trỏ vào danh sách mới: nó sẽ tô sáng nhầm người.
  const chiSo = contro.khoa === ketQua.khoa && contro.i < ungVien.length ? contro.i : -1;
  const dat = (i: number) => setContro({ khoa: ketQua.khoa, i });

  // Gõ tới đâu tìm tới đó, chờ 300ms cho tay dừng. `conHieuLuc` chốt hiệu lực theo lượt: lượt về
  // sau mà thuộc từ khoá cũ thì bị bỏ, không ghi đè kết quả mới (cùng bẫy đã sửa ở ô tìm 5-2).
  useEffect(() => {
    const k = tuKhoa.trim();
    if (k === '') return;
    let conHieuLuc = true;
    const t = setTimeout(() => {
      onTim(k)
        .then((ds) => {
          if (conHieuLuc) setKetQua({ khoa: k, ds });
        })
        .catch(() => {
          /**
           * Đọc hỏng phải thoát khỏi "đang tìm" — kẻo bộ chọn treo vĩnh viễn (bài học ô tìm 5-1) —
           * nhưng KHÔNG được đọc thành "không có ai tên ấy". Lời nói dối ấy kết thúc bằng việc
           * người vận hành đi tạo một người ĐÃ CÓ trong phả.
           */
          if (conHieuLuc) setKetQua({ khoa: k, ds: [], loi: true });
        });
    }, 300);
    return () => {
      conHieuLuc = false;
      clearTimeout(t);
    };
  }, [tuKhoa, onTim]);

  if (daChon) {
    return (
      <div className="flex min-h-11 items-center gap-2 rounded-md border border-ban-vien bg-ban-o px-3">
        <Users className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-[17px]">
          <span className="font-pha">{daChon.hoTen}</span>
          {daChon.nguCanh ? (
            <span className="text-[15px] text-muted-foreground"> · {daChon.nguCanh}</span>
          ) : null}
        </span>
        {/* Lối DUY NHẤT gỡ một người chọn nhầm, nên nó mang `min-h-11` như `ChonNoi` đã phải sửa. */}
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

  function chon(u: UngVienNguoi) {
    setTuKhoa('');
    setKetQua({ khoa: '', ds: [] });
    onChon(u);
  }

  function banPhim(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      /**
       * Đóng danh sách mà KHÔNG xoá từ khoá: người dùng bấm Escape để thấy lại màn, không phải
       * để mất chữ vừa gõ.
       *
       * Bản đầu đặt `{ khoa: '', ds: [] }` — khoá rỗng khác từ khoá đang gõ, nên `trangThaiTim`
       * suy ra `'dang-tim'` và ô kẹt ở "Đang tìm…" VĨNH VIỄN: effect chỉ chạy lại khi `tuKhoa`
       * đổi, mà Escape không đổi nó. Nay đánh dấu `dong` trên chính khoá ấy; gõ thêm một chữ là
       * khoá đổi và bộ chọn mở lại.
       */
      setKetQua((cu) => ({ ...cu, khoa: tuKhoa.trim(), dong: true }));
      /**
       * KHÔNG chặn nổi bọt ở đây (gỡ 26/08 sau code review story 6-9).
       *
       * Bản trước gọi `e.stopPropagation()` kèm chú thích *"danh sách gợi ý là lớp trong cùng
       * nên nó nuốt `Esc` này và KHÔNG để biểu mẫu đóng theo"* — mô tả một lớp lồng nhau **không
       * tồn tại được**: `ChonNguoi` chỉ sống trong `CotKhangDinh`, mà `cay-client.tsx` dựng
       * `CotKhangDinh` ở nhánh LOẠI TRỪ với biểu mẫu thêm người. Hai thứ không bao giờ cùng trên
       * màn, nên hàng rào ấy chưa từng chắn ai.
       *
       * `Esc` từ đây đi tiếp lên cửa sổ là vô hại: handler ở đó bỏ qua `Esc` khi không có biểu
       * mẫu thêm người nào mở. Một hàng rào không ai qua, kèm tài liệu nói ngược, đắt hơn là
       * không có — Dev Notes của chính story dặn đừng để lại thứ này.
       */
      return;
    }
    if (!moDanhSach) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      dat((chiSo + 1) % ungVien.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      dat(chiSo <= 0 ? ungVien.length - 1 : chiSo - 1);
    } else if (e.key === 'Enter' && chiSo >= 0) {
      e.preventDefault();
      chon(ungVien[chiSo]!);
    }
  }

  return (
    <div>
      <label htmlFor={`${id}-tim`} className="block text-[15px] text-muted-foreground">
        Tìm người đã có trong phả
      </label>
      <input
        id={`${id}-tim`}
        value={tuKhoa}
        onChange={(e) => setTuKhoa(e.target.value)}
        onKeyDown={banPhim}
        role="combobox"
        aria-expanded={hienDanhSach}
        // `aria-controls` LUÔN có: `role="combobox"` bắt buộc nó, và một thuộc tính trỏ vào hư
        // vô ở ba trạng thái là đúng thứ lượt review vừa bắt. Nên hộp danh sách luôn tồn tại,
        // chỉ rỗng khi không có gì để bày.
        aria-controls={`${id}-ds`}
        aria-autocomplete="list"
        {...(chiSo >= 0 && ungVien[chiSo] ? { 'aria-activedescendant': `${id}-o-${chiSo}` } : {})}
        className="mt-0.5 min-h-11 w-full rounded-md border border-ban-vien bg-ban-o px-3 font-pha text-[17px]"
      />

      {/* Trình đọc màn hình phải biết có bao nhiêu kết quả mà không cần đi hết danh sách. */}
      <p aria-live="polite" className="sr-only">
        {trangThai === 'dang-tim'
          ? 'Đang tìm'
          : trangThai === 'co'
            ? `${ungVien.length} người trùng tên`
            : trangThai === 'chi-minh'
              ? 'Chỉ tìm thấy chính người đang mở hồ sơ'
              : trangThai === 'khong-co'
                ? 'Không có ai tên ấy trong phả'
                : trangThai === 'loi'
                  ? 'Chưa đọc được danh sách người'
                  : ''}
      </p>

      {trangThai === 'dang-tim' ? (
        <p className="mt-2 text-[15px] text-muted-foreground">Đang tìm…</p>
      ) : trangThai === 'loi' ? (
        <p className="mt-2 border-l-4 border-destructive bg-canh-bao-nen px-2.5 py-1.5 text-[15px]">
          Chưa đọc được danh sách người — <strong>không phải là không có ai tên ấy</strong>. Thử
          lại trước khi kết luận người này chưa có trong phả.
        </p>
      ) : null}

      <ul
        id={`${id}-ds`}
        role="listbox"
        aria-label="Người trùng tên trong phả"
        className={hienDanhSach ? 'mt-2 flex flex-col gap-1' : 'hidden'}
      >
        {!hienDanhSach ? null : (
          <>
          {trangThai === 'co' ? (
            ungVien.map((u, i) => (
              <li key={u.personId} id={`${id}-o-${i}`} role="option" aria-selected={i === chiSo}>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => chon(u)}
                  /* Con trỏ bàn phím KHÔNG được phân biệt chỉ bằng màu (`EXPERIENCE.md
                     § Accessibility Floor`). Viền dày gấp đôi + một dấu ▸ đứng trước tên: hai
                     tín hiệu không phải màu, đọc được cả khi in đen trắng. */
                  className={`flex min-h-11 w-full flex-col justify-center rounded-md px-3 py-1.5 text-left ${
                    i === chiSo
                      ? 'border-2 border-foreground bg-ban-nen'
                      : 'border border-ban-vien bg-ban-o hover:bg-ban-nen'
                  }`}
                >
                  <span className="font-pha text-[17px]">
                    <span aria-hidden className={i === chiSo ? 'mr-1' : 'mr-1 opacity-0'}>
                      ▸
                    </span>
                    {u.hoTen}
                  </span>
                  {/* Cái phân biệt hai người trùng tên — trong một dòng họ, trùng tên là chuyện
                      thường. Cùng lý do FR-65 bắt nơi phải kèm đơn vị cha. */}
                  <span className="text-[15px] text-muted-foreground">
                    {u.nguCanh || 'chưa rõ đời và chi'}
                  </span>
                </button>
              </li>
            ))
          ) : trangThai === 'chi-minh' ? (
            /* Có người trùng tên — và đó là chính người đang mở hồ sơ. Nói "chưa có ai" ở đây là
               dạy người vận hành đi tạo một bản trùng của một người đang hiện tên trên đầu cột. */
            <li role="option" aria-disabled aria-selected={false} className="text-[15px] text-muted-foreground">
              Chỉ tìm thấy chính người đang mở hồ sơ — không ai là cha mẹ hay vợ chồng của chính
              mình. Gõ tên người khác.
            </li>
          ) : (
            /* Không tìm thấy ai là chuyện BÌNH THƯỜNG — người này chưa vào phả. Đường đúng là
               thêm người mới, và câu này chỉ đường tới đó thay vì bày một lỗi. */
            <li role="option" aria-disabled aria-selected={false} className="text-[15px] text-muted-foreground">
              {beMat === 'B' ? (
                <>
                  Chưa có ai tên ấy trong phả — thêm người mới ở nút <em>Thêm người vào phả</em> trên
                  thanh việc.
                </>
              ) : (
                <>
                  Chưa có ai tên ấy trong phả — thêm người mới bằng nút <em>Thêm người quanh đây</em>.
                </>
              )}
            </li>
          )}
          </>
        )}
      </ul>
    </div>
  );
}
