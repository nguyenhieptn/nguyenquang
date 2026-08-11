/**
 * THANH BÀN DUYỆT — chrome của bề mặt B (quản trị, desktop).
 *
 * Spine chi phối: EXPERIENCE.md § Component Patterns (Thanh bàn duyệt),
 *                 § Information Architecture › Bề mặt B › Chrome của bề mặt B
 *                 DESIGN.md § Colors › Bề mặt B (khung trần)
 *
 * Vì sao ĐỈNH và không dính đáy: bề mặt B chạy trên máy, nơi không có "vùng ngón cái" — lý do duy
 * nhất khiến thanh của bề mặt A dính đáy không tồn tại ở đây.
 *
 * Vì sao KHÔNG dùng son cho mục đang mở: son mang đúng một nghĩa — *đã chốt* (DESIGN.md § Colors).
 * Điều hướng không chốt gì cả. Mục đang mở phân biệt bằng chữ đậm + gạch chân đặc + aria-current.
 *
 * Đây là KHUNG, nên nó trần: nền xám ngà, chữ không chân, không đề từ, không nền giấy. Mọi thứ là
 * DỮ LIỆU PHẢ bên trong màn thì vẫn theo luật bề mặt A.
 */

export type MucBanDuyet = 'nap-khung' | 'xem-truoc' | 'hang-cho' | 'manh-chua-noi';

type Muc = {
  key: MucBanDuyet;
  label: string;
  /** Màn đã dựng trong xưởng; `null` = chưa dựng, mục thành nút trơ. */
  href: string | null;
};

/**
 * Bốn mục — bốn việc của người vận hành ở Đợt 1, không mục nào trang trí:
 *   Nạp khung (FR-51) · Xem trước (FR-51, FR-48) · Hàng chờ duyệt (FR-3) · Mảnh chưa nối (FR-48)
 *
 * "Bảng cảnh báo" KHÔNG có mặt ở đây: nó là một bộ lọc của màn Xem trước, không phải một màn.
 * Xem EXPERIENCE.md § Bề mặt B — "Cảnh báo không có màn riêng".
 */
const MUC: Muc[] = [
  { key: 'nap-khung', label: 'Nạp khung', href: '/uiworkshop/nap-khung' },
  { key: 'xem-truoc', label: 'Xem trước', href: '/uiworkshop/xem-truoc-so-khop' },
  { key: 'hang-cho', label: 'Hàng chờ duyệt', href: null },
  { key: 'manh-chua-noi', label: 'Mảnh chưa nối', href: null },
];

export function ThanhBanDuyet({ hienTai }: { hienTai: MucBanDuyet }) {
  return (
    <header className="border-b border-ban-vien bg-ban-o">
      <div className="mx-auto flex max-w-[1280px] items-center gap-8 px-6">
        <span className="py-4 text-[17px] font-semibold">Bàn duyệt</span>

        <nav aria-label="Điều hướng bàn duyệt">
          <ul className="flex">
            {MUC.map(({ key, label, href }) => {
              const dangMo = key === hienTai;
              // Vùng chạm 44px giữ nguyên cả trên máy — Accessibility Floor không có bản rút gọn
              // cho bề mặt quản trị.
              const lop = [
                'flex min-h-11 items-center px-3 text-[17px]',
                'border-b-2 -mb-px',
                dangMo
                  ? 'border-foreground font-semibold'
                  : 'border-transparent text-muted-foreground',
              ].join(' ');

              return (
                <li key={key}>
                  {href ? (
                    <a href={href} className={lop} aria-current={dangMo ? 'page' : undefined}>
                      {label}
                    </a>
                  ) : (
                    <button
                      type="button"
                      className={lop}
                      aria-current={dangMo ? 'page' : undefined}
                    >
                      {label}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Người vận hành hiện tên — FR-39 ghi công theo người, nên bàn duyệt phải nói rõ
            việc sắp ghi sẽ mang tên ai. */}
        <span className="ml-auto text-[15px] text-muted-foreground">
          Nguyễn Quang Hiệp · quản trị
        </span>
      </div>
    </header>
  );
}
