'use client';

/**
 * HAI QUYỀN CỦA NGƯỜI SỐNG (FR-55) — ẩn khỏi phần công khai · từ chối bản in.
 *
 * EXPERIENCE.md § State Patterns: ba đường (sửa · ẩn · từ chối in) bày NGANG NHAU — "quyền từ
 * chối mà khó tìm hơn quyền sửa thì không còn là quyền". Nút "Sửa" là Link do trang server
 * render; hai nút này cần useActionState nên tách ra client.
 *
 * Trạng thái ban đầu của hai cờ đọc thật từ core (getMyPersonFlags) — trang server truyền vào
 * `batBanDau`; sau mỗi lần ghi thành công thì bám theo kết quả thật từ server action.
 */
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import type { KetQuaQuyen } from './actions';

export function NutQuyen({
  hanhDong,
  /** Nhãn khi quyền đang TẮT — bấm để bật ("Ẩn khỏi phần cả họ xem được"). */
  nhanBat,
  /** Nhãn khi quyền đang BẬT — bấm để hoàn tác ("Hiện lại với cả họ"). */
  nhanTat,
  /** Trạng thái thật lúc mở trang — từ getMyPersonFlags của core, server truyền xuống. */
  batBanDau = false,
}: {
  hanhDong: (truoc: KetQuaQuyen, formData: FormData) => Promise<KetQuaQuyen>;
  nhanBat: string;
  nhanTat: string;
  batBanDau?: boolean;
}) {
  const [ketQua, gui, dangGui] = useActionState(hanhDong, null);
  const dangBat = ketQua?.ok === true ? ketQua.dangBat : batBanDau;

  return (
    <form action={gui}>
      <input type="hidden" name="bat" value={dangBat ? '0' : '1'} />
      <Button
        type="submit"
        variant="outline"
        disabled={dangGui}
        className="h-12 w-full text-[17px]"
      >
        {dangGui ? 'Đang ghi…' : dangBat ? nhanTat : nhanBat}
      </Button>
      {/* Kết quả nói bằng CHỮ, không chỉ bằng màu — § Accessibility Floor. Lỗi tô chàm
          (destructive), không bao giờ son: son là "đã chốt", không phải "hỏng". */}
      {ketQua && (
        <p
          aria-live="polite"
          className={`mt-1.5 text-[15px] ${
            ketQua.ok ? 'text-muted-foreground' : 'font-semibold text-destructive'
          }`}
        >
          {ketQua.thongBao}
        </p>
      )}
    </form>
  );
}
