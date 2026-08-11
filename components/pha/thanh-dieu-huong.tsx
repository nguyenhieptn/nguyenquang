/**
 * THANH ĐIỀU HƯỚNG GỐC — dính đáy màn, bề mặt "Người trong họ".
 *
 * Spine chi phối: EXPERIENCE.md § Information Architecture (Điều hướng gốc),
 *                 § Component Patterns (thanh điều hướng), § Accessibility Floor
 *                 DESIGN.md § Colors (son là màu khan hiếm), § Elevation & Depth (không đổ bóng)
 *
 * Vì sao ĐÁY chứ không phải đỉnh: người dùng đích cầm điện thoại một tay và có tay run. Đáy màn
 * là vùng ngón cái với tới được; đỉnh màn thì không. Đây là quyết định về tầm với, không phải về
 * thẩm mỹ.
 *
 * Vì sao đây là component sản phẩm (`components/pha/`) chứ không nằm trong `app/uiworkshop/`:
 * mọi màn của bề mặt này đều đeo nó, và khi dev promote màn ra route thật thì thanh này đi theo
 * nguyên vẹn. Để trong xưởng thì promote xong là mất.
 *
 * ⚠️ Căng thẳng đã biết: thanh dính đáy là ngôn ngữ của APP, mà DESIGN.md § Brand & Style muốn
 * sản phẩm đọc ra "cuốn phả" chứ không phải "phần mềm". Cách dung hoà: nền giấy, viền trên mảnh,
 * KHÔNG đổ bóng, và son chỉ điểm vào mục đang mở. Xem § Do's and Don'ts.
 */
import { House, Network, Plus, Mic, User } from 'lucide-react';

export type MucDieuHuong = 'trang-chu' | 'gia-pha' | 'them' | 'loi-ke' | 'toi';

type Muc = {
  key: MucDieuHuong;
  label: string;
  Icon: typeof House;
  /** Màn đã dựng trong xưởng; `null` = chưa dựng, mục thành nút trơ.
   *  Dev đổi sang route thật lúc promote. */
  href: string | null;
  /** Hành động chính của vòng lặp — vẽ nổi hẳn lên. */
  noiBat?: boolean;
};

/**
 * Năm mục, không hơn. Năm là trần: trên màn 390px, mỗi mục còn 78px — vừa đủ cho nhãn 15px
 * (sàn chữ của DESIGN.md) mà không phải cắt chữ. Mục thứ sáu là bắt đầu nói dối về tầm với.
 *
 * Vì sao đúng năm mục này — mỗi mục gánh một FR của Đợt 1, không mục nào trang trí:
 *   Trang chủ (FR-13, FR-39) · Gia phả (FR-15) · Thêm (FR-11) · Lời kể (FR-47) · Tôi (FR-64, FR-55)
 *
 * "Thêm" nằm GIỮA và nổi hẳn vì nó là vòng lặp cốt lõi: NFR-5 cho phép tối đa 4 màn / 3 phút để
 * thêm một người, nên đường vào việc đó không được nằm sau một lần chạm nào khác.
 */
const MUC: Muc[] = [
  { key: 'trang-chu', label: 'Trang chủ', Icon: House, href: '/uiworkshop/dong-ho-dang-song' },
  // Vào thẳng TẦNG 2 (chi của mình), không phải tầng 1. FR-15: "mở lên thấy chính mình trước".
  { key: 'gia-pha', label: 'Gia phả', Icon: Network, href: '/uiworkshop/mot-chi' },
  { key: 'them', label: 'Thêm', Icon: Plus, href: null, noiBat: true },
  { key: 'loi-ke', label: 'Lời kể', Icon: Mic, href: null },
  { key: 'toi', label: 'Tôi', Icon: User, href: null },
];

export function ThanhDieuHuong({ hienTai }: { hienTai: MucDieuHuong }) {
  return (
    // Đáy trên điện thoại (vùng ngón cái), ĐỈNH trên màn rộng: trên máy tính không có "vùng ngón
    // cái", đáy màn là chỗ xa mắt nhất và thanh kéo ngang 1280px đọc ra như thanh trạng thái.
    // Cùng năm mục, cùng thứ tự — chỉ đổi chỗ neo.
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background md:bottom-auto md:top-0 md:border-t-0 md:border-b"
    >
      <ul className="mx-auto flex max-w-md md:max-w-4xl md:justify-start md:gap-2">
        {MUC.map(({ key, label, Icon, href, noiBat }) => {
          const dangMo = key === hienTai;
          const noiDung = (
            <>
              <span
                className={
                  noiBat
                    ? 'flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground'
                    : 'flex size-9 items-center justify-center'
                }
              >
                <Icon size={noiBat ? 22 : 21} strokeWidth={dangMo ? 2.4 : 1.8} aria-hidden />
              </span>
              {/* Nhãn chữ LUÔN hiện — biểu tượng một mình là câu đố với người ít dùng máy,
                  và "thông tin công nghệ khó hiểu" là điều người duyệt gạch đi đầu tiên. */}
              <span className={dangMo ? 'text-[15px] font-semibold' : 'text-[15px]'}>{label}</span>
            </>
          );

          // Vùng chạm 44×44 tối thiểu (Accessibility Floor) — min-h-14 + flex-1 đảm bảo cả hai chiều.
          // Trên màn rộng: xếp ngang (icon cạnh chữ) vì thanh đỉnh không cần cao.
          const lop = [
            'flex min-h-14 w-full flex-col items-center justify-center gap-0.5 py-2',
            'md:flex-row md:justify-start md:gap-2 md:px-3',
            dangMo ? 'text-primary' : 'text-muted-foreground',
          ].join(' ');

          return (
            <li key={key} className="flex-1 md:flex-none">
              {href ? (
                <a href={href} className={lop} aria-current={dangMo ? 'page' : undefined}>
                  {noiDung}
                </a>
              ) : (
                // Màn chưa dựng → nút trơ. KHÔNG gắn nhãn "chưa dựng" lên giao diện sản phẩm:
                // lỗ hổng được theo dõi ở _registry/outline.ts và bản đồ luồng, không phải ở đây.
                <button type="button" className={lop} aria-current={dangMo ? 'page' : undefined}>
                  {noiDung}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
