/**
 * Ô TÌM — một khuôn duy nhất cho mọi chỗ có tìm kiếm.
 *
 * Spine chi phối: EXPERIENCE.md § Key Flows (Luồng 1, bước 2) · § Voice and Tone (không xưng hô)
 *                 · § Accessibility Floor (vùng chạm 44px, sàn chữ 15/17px)
 *                 DESIGN.md § Elevation (không đổ bóng) · § Shapes (bo vừa)
 *
 * FR: **FR-48** (chặn bản trùng tại nguồn) · FR-11 (tự khai)
 *
 * ── Tìm KHÔNG phải tra cứu ────────────────────────────────────────────────
 *
 * `EXPERIENCE.md` gọi đúng tên việc này: *"Tìm là thao tác **chặn trùng** (FR-48), không phải tra
 * cứu — mọi đường vào việc thêm đều qua đây. Người dùng nghĩ mình đang tìm; hệ thống đang chặn."*
 *
 * Hệ quả cho thiết kế: nhãn phải nói bằng lời của **người dùng** (*"Tìm người thân"*), còn phần
 * gợi ý mới nói việc thật của hệ thống (*"xem đã có trong phả chưa"*). Đảo lại — dán nhãn "kiểm
 * tra trùng" — là bắt người dùng học mô hình dữ liệu trước khi được làm việc của họ.
 *
 * ── Vì sao là component chứ không chép ba lần ─────────────────────────────
 *
 * Trước file này, `tim-nguoi-than` và `khong-tim-thay` mỗi màn giữ một bản sao của cùng khối
 * markup. Bản thứ ba trên trang chủ sẽ là lần lệch thứ ba — và ô tìm là thứ người dùng gặp ở cả
 * ba màn liên tiếp trong Luồng 1, nên lệch ở đây là lệch ở chỗ dễ thấy nhất.
 *
 * ⚠️ Xưởng là tĩnh: đây là **hình ảnh của một ô tìm**, không phải form thật. Lúc promote, thay
 * phần trong bằng `<input>` thật và giữ nguyên vỏ.
 */
import Link from 'next/link';

export function OTim({
  /** Từ khoá đang có. Bỏ trống thì hiện chữ mời gõ. */
  tuKhoa,
  /** Nhãn trên ô. Nói bằng lời người dùng, không phải lời hệ thống. */
  nhan = 'Tìm người thân',
  /** Một dòng dưới ô nói việc thật của nó. Chỉ dùng ở nơi người ta chưa biết ô này để làm gì. */
  goiY,
  /** Có đường dẫn thì cả ô thành một liên kết — dùng khi ô đứng ngoài màn tìm. */
  href,
  className = '',
}: {
  tuKhoa?: string;
  nhan?: string;
  goiY?: string;
  href?: string;
  className?: string;
}) {
  const than = (
    <>
      <p className="text-[15px] text-muted-foreground">{nhan}</p>
      <p className="mt-0.5 font-[family-name:var(--font-pha)] text-[17px]">
        {tuKhoa ?? <span className="text-muted-foreground">Gõ tên người cần tìm</span>}
      </p>
    </>
  );

  // Vùng chạm: py-3 + hai dòng chữ ≈ 64px, vượt sàn 44px của § Accessibility Floor.
  const vo = 'rounded-md border border-input bg-card px-4 py-3 md:px-5 md:py-4';

  return (
    <div className={className}>
      {href ? (
        <Link
          href={href}
          // Cùng luật rê chuột với thanh điều hướng: đổi màu viền, không đổi nền — nền đổi thì ô
          // nhấp nháy như nút, mà đây là một ô để gõ.
          className={`${vo} block transition-colors duration-150 ease-out hover:border-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
        >
          {than}
        </Link>
      ) : (
        <div className={vo}>{than}</div>
      )}
      {goiY && <p className="mt-2 text-[15px] text-muted-foreground">{goiY}</p>}
    </div>
  );
}
