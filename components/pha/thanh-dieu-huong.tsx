/**
 * THANH ĐIỀU HƯỚNG GỐC — bề mặt "Người trong họ".
 *
 * Spine chi phối: EXPERIENCE.md § Information Architecture (Điều hướng gốc),
 *                 § Component Patterns · § Accessibility Floor · § Responsive
 *                 DESIGN.md § Brand & Style · § Colors (son khan hiếm) · § Nút
 *                 · § Elevation & Depth (không đổ bóng) · § Typography (sàn 17/15px)
 *
 * Hai hình dạng, một danh sách mục:
 *   · **Điện thoại** — dính ĐÁY. Người dùng đích cầm máy một tay và có tay run; đáy là vùng ngón
 *     cái với tới được, đỉnh thì không. Quyết định về tầm với, không phải thẩm mỹ.
 *   · **Máy** — thành ĐẦU TRANG có tên phả bên trái. Trên máy không có vùng ngón cái, nên lý do
 *     neo đáy biến mất; và EXPERIENCE.md § Responsive đã cảnh báo sẵn cái bẫy: *một thanh kéo
 *     ngang 1280px đọc ra như thanh trạng thái*. Cái chữa nó là một **mỏ neo bên trái** — đầu
 *     trang có tên thì đọc ra "bìa sách", thanh năm nút trôi giữa màn thì đọc ra "chrome".
 *
 * Ba thứ cố ý KHÁC nhau giữa hai hình dạng, và vì sao:
 *   1. **Máy bỏ biểu tượng.** Biểu tượng là ngôn ngữ của thanh ngón cái — nó thay chữ khi chỗ hẹp.
 *      Trên máy chỗ không hẹp, nên biểu tượng chỉ còn là nhiễu. Nhãn chữ thì LUÔN có ở cả hai.
 *   2. **Máy không đánh dấu riêng cho "Thêm"** — năm mục giống hệt nhau. Đã thử hai lần và cả hai
 *      lần đều đọc ra "lạc loài": khối nền son (khác HÌNH), rồi chữ son kèm dấu cộng (khác MÀU và
 *      KÝ HIỆU). Trong một hàng năm mục cùng cỡ, bất cứ mục nào mang thêm một thuộc tính đều nhảy
 *      ra khỏi hàng. Sự nổi bật FR-11 đòi chuyển sang **nút chính của thân trang**. Bản điện thoại
 *      thì GIỮ ô son nổi — ở đó lý do là tầm với của ngón cái, không phải thẩm mỹ.
 *   3. **Thứ tự năm mục giữ nguyên** ở cả hai. Đổi chỗ neo thì được, đổi thứ tự thì người dùng
 *      phải học lại sản phẩm khi xoay máy.
 *
 * ⚠️ Căng thẳng đã biết: thanh dính đáy là ngôn ngữ của APP, mà DESIGN.md muốn sản phẩm đọc ra
 * "cuốn phả". Cách dung hoà: nền giấy, viền mảnh, KHÔNG đổ bóng, son chỉ điểm vào mục đang mở.
 */
import Link from 'next/link';
import { House, Mic, Network, Plus, User } from 'lucide-react';
import { KHUNG } from './khung';
import { VachDoi } from './vach';

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
 *
 * 22/08/2026 — NĂM HREF TRỎ ROUTE THẬT (promote Đợt 1). Cơ chế `href: null` (nút trơ) giữ
 * nguyên cho lần thu phạm vi sau, nếu có.
 */
const MUC: Muc[] = [
  { key: 'trang-chu', label: 'Trang chủ', Icon: House, href: '/' },
  // Vào thẳng TẦNG 2 (chi của mình), không phải tầng 1. FR-15: "mở lên thấy chính mình trước".
  { key: 'gia-pha', label: 'Gia phả', Icon: Network, href: '/gia-pha' },
  // "Thêm" mở vào màn TÌM, không mở thẳng vào màn khai. Không phải một lần chạm thừa: tìm là
  // thao tác chặn trùng (FR-48), và chặn một lần gõ rẻ hơn nhiều so với gỡ hai bản trùng ra khỏi
  // nhau về sau. Người dùng nghĩ mình đang tìm; hệ thống đang chặn.
  { key: 'them', label: 'Thêm', Icon: Plus, href: '/tim', noiBat: true },
  { key: 'loi-ke', label: 'Lời kể', Icon: Mic, href: '/loi-ke' },
  { key: 'toi', label: 'Tôi', Icon: User, href: '/toi' },
];

/** Vòng chỉ báo bàn phím. Bày ở một chỗ để năm mục không trôi lệch nhau. */
const VONG_TIEU_DIEM =
  'rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/** Bọc `Link` khi đã có màn, `button` trơ khi chưa — cùng một lớp, cùng một `aria-current`. */
function O({
  href,
  dangMo,
  className,
  children,
}: {
  href: string | null;
  dangMo: boolean;
  className: string;
  children: React.ReactNode;
}) {
  const chung = `${className} ${VONG_TIEU_DIEM}`;
  return href ? (
    <Link href={href} className={chung} aria-current={dangMo ? 'page' : undefined}>
      {children}
    </Link>
  ) : (
    // Màn chưa dựng → nút trơ. KHÔNG gắn nhãn "chưa dựng" lên giao diện sản phẩm: lỗ hổng được
    // theo dõi ở _registry/outline.ts và bản đồ luồng, không phải ở đây.
    <button type="button" className={chung} aria-current={dangMo ? 'page' : undefined}>
      {children}
    </button>
  );
}

/**
 * Ghép tên phả hiển thị từ `getClanInfo` của core/identity (AD-14: không hardcode tên một dòng
 * họ nào trong mã). Hàm THUẦN — component vẫn "câm": trang server gọi getClanInfo rồi đưa kết
 * quả qua đây, truyền chuỗi xuống. Ưu tiên settings.surname (+ middleName), rồi tên phả trong
 * `clan.name`; không có gì thì về mặc định trung tính.
 */
export function tenPhaTuThongTin(
  info?: { name: string; settings: { surname?: string; middleName?: string } } | null,
): string {
  if (!info) return 'Tộc phả';
  const ghep = [info.settings.surname, info.settings.middleName].filter(Boolean).join(' ');
  return ghep || info.name || 'Tộc phả';
}

export function ThanhDieuHuong({
  hienTai,
  /**
   * Tên hiện ở đầu trang bản máy. Là **tham số**, không phải hằng số: `AD-14` bắt không hardcode
   * gì của một dòng họ cụ thể vào mã sản phẩm. Mặc định trung tính để xưởng chạy được ngay.
   */
  tenPha = 'Tộc phả',
}: {
  hienTai: MucDieuHuong;
  tenPha?: string;
}) {
  return (
    <>
      {/* ══ ĐIỆN THOẠI — dính đáy, vùng ngón cái ═══════════════════════════ */}
      <nav
        aria-label="Điều hướng chính"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background md:hidden"
      >
        <ul className="mx-auto flex max-w-md">
          {MUC.map(({ key, label, Icon, href, noiBat }) => {
            const dangMo = key === hienTai;
            return (
              <li key={key} className="flex-1">
                {/* Vùng chạm 44×44 tối thiểu (Accessibility Floor): min-h-14 + flex-1. */}
                <O
                  href={href}
                  dangMo={dangMo}
                  className={`flex min-h-14 w-full flex-col items-center justify-center gap-0.5 py-2 ${
                    dangMo ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <span
                    className={
                      noiBat
                        ? // Bo VỪA, không bo tròn: DESIGN.md § Brand & Style liệt "icon tròn màu
                          // mè" vào danh sách không-làm. Ô son bo md giữ được sự nổi bật mà không
                          // mượn ngôn ngữ của app tiêu dùng.
                          'flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground'
                        : 'flex size-9 items-center justify-center'
                    }
                  >
                    <Icon size={noiBat ? 22 : 21} strokeWidth={dangMo ? 2.4 : 1.8} aria-hidden />
                  </span>
                  {/* Nhãn chữ LUÔN hiện — biểu tượng một mình là câu đố với người ít dùng máy. */}
                  <span className={`text-[15px] ${dangMo ? 'font-semibold' : ''}`}>{label}</span>
                </O>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ══ MÁY — MĂNG-SÉT (masthead), không phải dải nút ══════════════════
          Một hàng link trôi ngang là ngôn ngữ của web app. Măng-sét hai tầng — hàng chữ nhỏ giãn
          rộng đè lên tên đặt bằng chữ có chân — là ngôn ngữ của ấn phẩm, và nó cho đầu trang đủ
          sức nặng để không đọc ra chrome trình duyệt.

          Vạch đôi dày–mảnh đóng đáy măng-sét. Đây là **một mô-típ duy nhất dùng lại ở ba chỗ**:
          đáy măng-sét, mở chân trang, và các vạch chia mục trong thân trang. Trước đó mỗi chỗ một
          kiểu viền — đó chính là chỗ menu "chưa thuần nhất". */}
      <header className="fixed inset-x-0 top-0 z-10 hidden bg-background md:block">
        <div className={`${KHUNG} flex items-end justify-between gap-8 pb-3 pt-4`}>
          {/* 22/08/2026 — trỏ về route thật '/' (promote 2-1); trước đó còn trỏ bản xưởng. */}
          <Link
            href="/"
            className={`group block transition-colors duration-150 ease-out ${VONG_TIEU_DIEM}`}
          >
            {/* Sàn chữ tuyệt đối 15px (DESIGN.md § Typography) — hàng chữ nhỏ giãn rộng của
                măng-sét cũng không được xuống dưới sàn. Giãn chữ rút 0.22em → 0.12em: ở 15px thì
                0.22em đẩy hàng này rộng ngang cả tên phả bên dưới và giành mất sức nặng của tên. */}
            <span className="block text-[15px] uppercase leading-tight tracking-[0.12em] text-muted-foreground transition-colors duration-150 group-hover:text-foreground">
              Gia phả họ
            </span>
            {/* Chữ có chân vì đây là TÊN — DESIGN.md § Typography. Rê chuột chỉ đổi hàng chữ nhỏ
                bên trên, tên giữ nguyên: tên dòng họ không phải một cái nút để nhấp nháy. */}
            <span className="mt-0.5 block font-[family-name:var(--font-pha)] text-[22px] font-semibold leading-none">
              {tenPha}
            </span>
          </Link>

          {/* NĂM MỤC GIỐNG HỆT NHAU — không mục nào mang dấu hiệu riêng.
              Đã thử hai lần và cả hai lần đều đọc ra "lạc loài": khối nền son đặc (khác HÌNH), rồi
              chữ son kèm dấu cộng (khác MÀU và khác KÝ HIỆU). Trong một hàng năm mục cùng cỡ cùng
              khoảng cách, bất cứ mục nào mang thêm một thuộc tính đều nhảy ra khỏi hàng.

              Đánh đổi phải nói rõ: FR-11 đòi đường vào "Thêm" không nằm sau một lần chạm nào khác.
              Trên máy, sự nổi bật ấy chuyển sang **nút chính của thân trang** ("Thêm người thân",
              nền son theo DESIGN.md § Nút) — vẫn thấy ngay, vẫn một lần bấm, mà không phải trả
              giá bằng một thanh điều hướng lổn nhổn. Bản điện thoại giữ nguyên ô son nổi, vì ở đó
              lý do là TẦM VỚI của ngón cái chứ không phải thẩm mỹ. */}
          <nav aria-label="Điều hướng chính" className="pb-0.5">
            <ul className="flex items-center gap-0.5">
              {MUC.map(({ key, label, href }) => {
                const dangMo = key === hienTai;
                return (
                  <li key={key}>
                    <O
                      href={href}
                      dangMo={dangMo}
                      className={[
                        // Vùng chạm 44px KHÔNG có ngoại lệ cho bản máy (Accessibility Floor):
                        // min-h-11 thay cho h-9, `items-center` giữ nhãn nằm giữa như cũ.
                        'inline-flex min-h-11 items-center border-b-2 px-3 text-[17px]',
                        'transition-colors duration-150 ease-out',
                        // Mục đang mở gạch chân son — dấu của trang giấy, và đọc được cả khi in
                        // đen trắng, không như trạng thái chỉ-đổi-màu.
                        dangMo
                          ? 'border-primary font-semibold text-primary'
                          : // Rê chuột: chữ đậm màu lên VÀ gạch chân mờ hiện ra — nó là "bóng" của
                            // trạng thái đang mở, nên mắt học một luật thay vì hai. Bấm xuống lún
                            // 1px: phản hồi của con dấu ấn xuống giấy, không phải hiệu ứng nảy.
                            'border-transparent text-muted-foreground hover:border-border hover:text-foreground active:translate-y-px',
                      ].join(' ')}
                    >
                      {label}
                    </O>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
        <VachDoi />
      </header>
    </>
  );
}
