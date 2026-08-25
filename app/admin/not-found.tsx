/**
 * 404 CỦA BÀN LÀM VIỆC.
 *
 * Không có file này thì `/admin/<gõ-nhầm>` rơi về `app/not-found.tsx` — 404 của bề mặt A, mặc
 * giấy dó, mời "Tìm một người trong phả". Người vận hành gõ nhầm một chữ bỗng bị đẩy ra ngoài
 * bàn, và bất biến "layout sở hữu chrome cho `/admin`" lặng lẽ không còn đúng ở đúng chỗ ấy.
 *
 * Đặt ở đây thì `app/admin/layout.tsx` bọc nó (`error.js`/`not-found.js` nằm dưới layout cùng
 * segment), nên màn này giữ nguyên chrome VÀ giữ nguyên cổng quyền — chưa đăng nhập vẫn bị đẩy
 * về `/dang-nhap` trước khi thấy 404, không lộ chuyện khu vực này tồn tại.
 */
import Link from 'next/link';

export default function NotFound() {
  return (
    <>
      <h2 className="text-[19px] font-semibold">Không có màn nào ở địa chỉ này</h2>
      <p className="mt-2 max-w-[70ch] text-[17px] text-muted-foreground">
        Đường dẫn có thể đã cũ, hoặc gõ nhầm một chữ. Thanh việc bên trái là danh sách đầy đủ
        những màn hiện có.
      </p>
      <Link
        href="/admin"
        className="mt-5 inline-flex min-h-11 items-center text-[17px] underline underline-offset-4"
      >
        Về màn nhà của bàn làm việc
      </Link>
    </>
  );
}
