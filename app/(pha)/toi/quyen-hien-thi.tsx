'use client';

/**
 * HAI QUYỀN CỦA NGƯỜI SỐNG (FR-55) — ẩn khỏi phần công khai · từ chối bản in.
 *
 * EXPERIENCE.md § State Patterns: ba đường (sửa · ẩn · từ chối in) bày NGANG NHAU — "quyền từ
 * chối mà khó tìm hơn quyền sửa thì không còn là quyền". Nút "Sửa" là Link do trang server
 * render; hai nút này cần useActionState nên tách ra client.
 *
 * ⚠️ TODO(core): core chưa có API đọc trạng thái hiện tại của hai cờ (chỉ có đường ghi
 * updateSelfVisibility). Trước lần bấm đầu tiên, nút coi trạng thái là MẶC ĐỊNH của phả
 * (chưa ẩn, có in — đúng default của dữ liệu); sau mỗi lần ghi thành công thì bám theo kết
 * quả thật từ server. Khi core có API đọc, truyền trạng thái ban đầu vào đây thay cho mặc định.
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
}: {
  hanhDong: (truoc: KetQuaQuyen, formData: FormData) => Promise<KetQuaQuyen>;
  nhanBat: string;
  nhanTat: string;
}) {
  const [ketQua, gui, dangGui] = useActionState(hanhDong, null);
  const dangBat = ketQua?.ok === true ? ketQua.dangBat : false;

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
