/**
 * BẢN ĐĂNG KÝ MÀN — mỗi route sản phẩm một dòng.
 *
 * Đây là danh sách mà cổng đi theo, và là danh sách mà `dang-ky.test.ts` đối chiếu với mã nguồn:
 * thêm một `page.tsx` mà quên thêm dòng ở đây thì bài test ĐỎ. Lối ấy mượn thẳng từ
 * `app/admin/chrome.test.ts` — *"test render một màn thì bắt đúng cái màn nó render, không bắt
 * được cái màn người sau quên"*.
 *
 * Bốn script cũ đo bốn màn. Bản đăng ký này có hai mươi bảy.
 */
import type { Page } from 'playwright';

/** Khung nhìn. `EXPERIENCE.md:75,430-438,445`. */
export const KHUNG = {
  /** Điện thoại tầm trung — người dùng đích của NFR-5. */
  dienThoai: 390,
  /**
   * Breakpoint `md`. Chỉ dùng cho bề mặt A — bề mặt B là desktop-only (`EXPERIENCE.md:498`).
   * Giữ lại vì màn nào của A muốn đo thêm ở md thì khai được ngay.
   */
  may768: 768,
  /** Máy để bàn — khung của bàn làm việc. */
  may: 1280,
} as const;

export type PhepDo =
  | 'chu'
  | 'cham'
  | 'tran'
  | 'tuong-phan'
  | 'dem-day'
  | 'nhan-de-ten'
  | 'cot-phai';

export type Quyen = 'khach' | 'dang-nhap' | 'quan-tri';

export type Man = {
  /** Khoá lọc trên dòng lệnh: `npm run soi hang-cho`. */
  khoa: string;
  /** Đường như trong URL. Đoạn động để nguyên `[id]` và phải có `giaiDuong`. */
  duong: string;
  beMat: 'A' | 'B';
  quyen: Quyen;
  /** Khung nhìn phải đo. Bề mặt A đo ở điện thoại — lần đầu tiên. */
  rong: readonly number[];
  /** Phạm vi đo. Mặc định `main`; màn không có `<main>` thì khai chỗ khác. */
  pham: string;
  pheDo: readonly PhepDo[];
  /** Một câu: màn này bày gì. */
  bay: string;
  /** Đoạn động: trả về đường thật, hoặc `null` khi phả chưa có dữ liệu để mở. */
  giaiDuong?: (p: Page, goc: string) => Promise<string | null>;
  /** Đưa màn về trạng thái CÓ DỮ LIỆU. Không được bấm bất cứ điều khiển GHI nào. */
  buoc?: (p: Page) => Promise<void>;
  /** Luật "soi 0 phần tử là cổng đang tắt": chọn tử phải khớp ít nhất một phần tử. */
  toiThieu?: { chon: string; ten: string };
  /** Trạng thái RỖNG có phải đo riêng không, và vì sao. */
  ghiChu?: string;
  /** Mục nợ "CHƯA kiểm được" của story nào rơi vào màn này. */
  no?: string[];
  /** Chọn tử cho phép đo `nhan-de-ten`: thẻ, và phần tử mang họ tên trong thẻ. */
  chonNhanDeTen?: { the: string; ten: string };
  /** Khối mang đệm đáy, cho phép đo `dem-day`. */
  chonKhoiDem?: string;
  /** Chồng khẳng định ở cột phải, cho phép đo `cot-phai` (6-7 AC 18). */
  chonChong?: string;
};

const KHACH_A = { beMat: 'A', quyen: 'khach', rong: [KHUNG.dienThoai], pham: 'main' } as const;
const NGUOI_A = { beMat: 'A', quyen: 'dang-nhap', rong: [KHUNG.dienThoai], pham: 'main' } as const;
/**
 * Bề mặt B đo ở **1280px, và CHỈ 1280px**.
 *
 * Bản đầu đo thêm 768px, và lượt chạy thật trả về bốn ca tràn ngang ở đúng khung ấy (bảng 1199px
 * trong cột 460px). Không ca nào là lỗi: `EXPERIENCE.md:498` nói thẳng *"Bề mặt B chỉ cần chạy
 * tốt trên desktop. Không tối ưu cho tablet — và vì nó desktop-only…"*.
 *
 * Đo một bề mặt theo một lời hứa KHÔNG AI HỨA thì sinh nhiễu chứ không sinh tín hiệu, và nhiễu
 * trong một cổng là thứ dạy người ta bỏ qua nó. Sàn phải neo vào cam kết có thật.
 */
const BAN_B = {
  beMat: 'B',
  quyen: 'quan-tri',
  rong: [KHUNG.may],
  pham: 'main',
  chonKhoiDem: 'main > div',
} as const;

const DO_CHUNG: PhepDo[] = ['chu', 'cham', 'tran', 'tuong-phan'];

/**
 * Bề mặt B thêm `dem-day`.
 *
 * Không phải vì màn B dài hơn, mà vì lỗi đệm đáy nằm ở ĐÚNG MỘT chỗ: khối `min-h-full shrink-0
 * px-6 py-8` trong `components/admin/khung-admin.tsx:562`. Bề mặt A không có khối đệm dùng chung
 * — mỗi màn tự dựng — nên không có chỗ nào để đo cùng một phép. Đo bừa ở đó chỉ sinh ra một cột
 * "không tìm thấy khối" dài mười bảy dòng, và một cổng ồn là một cổng sắp bị tắt.
 */
const DO_B: PhepDo[] = [...DO_CHUNG, 'dem-day'];

/** Lấy `href` đầu tiên khớp một mẫu — dùng giải các đoạn `[id]`. */
async function lienKetDau(p: Page, goc: string, duongDs: string, mau: RegExp): Promise<string | null> {
  await p.goto(`${goc}${duongDs}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(700);
  return p.evaluate((m) => {
    const re = new RegExp(m);
    for (const a of document.querySelectorAll('a[href]')) {
      const h = a.getAttribute('href') ?? '';
      if (re.test(h)) return h;
    }
    return null;
  }, mau.source);
}

/**
 * Giải `/nguoi/[id]` cho một lượt đo KHÔNG đăng nhập.
 *
 * Trang chủ không bày liên kết `/nguoi/…` nào cho khách (đo được: `curl /` ra 0 liên kết) — bán
 * kính riêng tư quyết định dữ liệu nào tới được client, không phải CSS (AD-13/FR-37). Đường duy
 * nhất còn lại cho khách là ô tìm.
 *
 * Truy vấn là một NGUYÊN ÂM ĐƠN, thử lần lượt, chứ không phải tên họ của dòng họ này: AD-14 nói
 * không hard-code thứ gì thuộc về một dòng họ cụ thể, và một bộ đo chỉ chạy được trên họ Nguyễn
 * là một bộ đo sẽ hỏng ở dòng họ thứ hai. Tên tiếng Việt nào cũng chứa ít nhất một trong số này.
 */
async function giaiMotNguoi(p: Page, goc: string): Promise<string | null> {
  for (const q of ['a', 'n', 'i', 'e', 'o', 'u']) {
    const h = await lienKetDau(p, goc, `/tim?q=${q}`, /^\/nguoi\//);
    if (h) return h;
  }
  return null;
}

export const DANG_KY: Man[] = [
  // ── Bề mặt A — điện thoại. CHƯA TỪNG được đo trước story 6-6. ────────────────────────────
  {
    ...KHACH_A,
    khoa: 'trang-chu',
    duong: '/',
    pheDo: DO_CHUNG,
    bay: 'Cột đời · vừa vào phả · thống kê dòng họ',
    ghiChu: 'Phả rỗng thì cột đời thành lời mời "Tìm chỗ của mình" — là màn khác, không phải trạng thái rỗng.',
  },
  {
    ...KHACH_A,
    khoa: 'tim',
    duong: '/tim',
    pheDo: DO_CHUNG,
    bay: 'Ô tìm người; ba trạng thái: chưa gõ · có kết quả · không thấy',
    no: ['deferred: `chuanHoa` gấp dấu nên gõ "Quản" lôi ra sáu người họ Quang trước'],
  },
  {
    ...KHACH_A,
    khoa: 'dang-nhap',
    duong: '/dang-nhap',
    pham: 'body',
    pheDo: DO_CHUNG,
    bay: 'Đăng nhập / Tạo tài khoản — hai TAB đổi chế độ, nút gửi là "Vào phả"',
    ghiChu: 'Đo TRƯỚC khi đăng nhập, nên phạm vi là `body` (màn này không có `<main>` của khung chung).',
  },
  {
    ...NGUOI_A,
    khoa: 'gan-node',
    duong: '/gan-node',
    pheDo: DO_CHUNG,
    bay: 'Nhận chỗ của mình trong phả',
  },
  {
    ...NGUOI_A,
    khoa: 'gia-pha',
    duong: '/gia-pha',
    pheDo: DO_CHUNG,
    bay: 'Tầng 2 — chi của mình',
  },
  {
    ...NGUOI_A,
    khoa: 'ca-toc',
    duong: '/gia-pha/ca-toc',
    pheDo: DO_CHUNG,
    bay: 'Tầng 1 — khối chi, không vẽ người',
    toiThieu: { chon: 'main a', ten: 'khối chi' },
  },
  {
    ...NGUOI_A,
    khoa: 'chi',
    duong: '/gia-pha/chi/[id]',
    pheDo: DO_CHUNG,
    bay: 'Tầng 2 — một chi, người gập theo đời',
    giaiDuong: (p, goc) => lienKetDau(p, goc, '/gia-pha/ca-toc', /^\/gia-pha\/chi\//),
  },
  {
    ...NGUOI_A,
    khoa: 'duong-cua-toi',
    duong: '/gia-pha/duong-cua-toi',
    pheDo: DO_CHUNG,
    bay: 'Tầng 3 — đường huyết thống ngược lên gốc',
  },
  {
    ...NGUOI_A,
    khoa: 'loi-ke',
    duong: '/loi-ke',
    pheDo: DO_CHUNG,
    bay: 'Sổ lời kể — danh sách bản thu',
    ghiChu: 'Rỗng: "Chưa có bản nào trong sổ". Phả thật hiện chưa có bản thu nào ⇒ chỉ đo được trạng thái rỗng.',
  },
  {
    ...NGUOI_A,
    khoa: 'thu-loi-ke',
    duong: '/loi-ke/thu',
    pheDo: DO_CHUNG,
    bay: 'Thu lời kể — ghi âm, đồng thuận nằm trong luồng',
  },
  {
    ...KHACH_A,
    khoa: 'nguoi',
    duong: '/nguoi/[id]',
    pheDo: DO_CHUNG,
    bay: 'Trang một người — khẳng định và liên kết, lọc theo bán kính riêng tư',
    giaiDuong: giaiMotNguoi,
  },
  { ...NGUOI_A, khoa: 'them', duong: '/them', pheDo: DO_CHUNG, bay: 'Tạo người — chỉ mục luồng bốn bước' },
  { ...NGUOI_A, khoa: 'them-noi', duong: '/them/noi', pheDo: DO_CHUNG, bay: 'Tạo người — bước nơi quê' },
  { ...NGUOI_A, khoa: 'them-ten', duong: '/them/ten', pheDo: DO_CHUNG, bay: 'Tạo người — bước tên' },
  { ...NGUOI_A, khoa: 'them-xac-nhan', duong: '/them/xac-nhan', pheDo: DO_CHUNG, bay: 'Tạo người — bước xác nhận' },
  { ...NGUOI_A, khoa: 'them-xong', duong: '/them/xong', pheDo: DO_CHUNG, bay: 'Tạo người — bước hoàn thành' },
  {
    ...NGUOI_A,
    khoa: 'toi',
    duong: '/toi',
    pheDo: DO_CHUNG,
    bay: 'Tài khoản của tôi + thông báo',
  },

  // ── Bề mặt B — bàn làm việc. Bốn màn đầu là bốn script cũ, gom vào đây. ───────────────────
  {
    ...BAN_B,
    khoa: 'admin',
    duong: '/admin',
    pheDo: DO_B,
    bay: 'Nhà bàn làm việc — thanh việc và các con số',
    toiThieu: { chon: 'nav a', ten: 'mục thanh việc' },
  },
  {
    ...BAN_B,
    khoa: 'hang-cho',
    duong: '/admin/hang-cho',
    pheDo: DO_B,
    bay: 'Hàng chờ duyệt, gom theo NGƯỜI (story 6-8)',
    toiThieu: { chon: 'main [data-nhom]', ten: 'nhóm người' },
    buoc: async (p) => {
      // Mở hết `<details>`: ô lý do trả lại và nút của nó nằm sau một cú bấm.
      await p.evaluate(() => {
        for (const d of document.querySelectorAll('main details')) (d as HTMLDetailsElement).open = true;
      });
      await p.waitForTimeout(300);
    },
    no: ['6-8: chưa ai bấm "Duyệt cả nhóm" — đường ghi, ngoài phạm vi 6-6', '6-8: `role="status"` chưa ai nghe bằng trình đọc'],
  },
  {
    ...BAN_B,
    khoa: 'duyet-vao-pha',
    duong: '/admin/duyet-vao-pha',
    pheDo: DO_B,
    bay: 'Người xin nhận chỗ trong phả',
    ghiChu: 'Phả thật hiện không có yêu cầu nào chờ ⇒ chỉ đo được trạng thái rỗng. Đúng lý do mục 2 của 6-2 vẫn treo.',
  },
  {
    ...BAN_B,
    khoa: 'cay',
    duong: '/admin/cay',
    pheDo: [...DO_B, 'nhan-de-ten', 'cot-phai'],
    bay: 'Canvas gia phả + cột phải hồ sơ người',
    chonNhanDeTen: { the: '.react-flow__node', ten: 'p.font-pha' },
    chonChong: 'aside section[aria-label]',
    toiThieu: { chon: '.react-flow__node', ten: 'thẻ người trên canvas' },
    buoc: async (p) => {
      // Chọn người đầu tiên để cột phải có nội dung. Bấm vào THẺ là điều hướng, không phải ghi.
      const the = p.locator('.react-flow__node').first();
      if (await the.count()) {
        await the.click();
        await p.waitForTimeout(1500);
      }
      await p.evaluate(() => {
        for (const d of document.querySelectorAll('aside details')) (d as HTMLDetailsElement).open = true;
      });
      await p.waitForTimeout(400);
    },
    no: [
      '6-7 AC 18: khối tóm tắt có đẩy chồng khẳng định khỏi tầm nhìn không',
      '6-7: dòng tóm tắt xuống dòng xấu khi tên chi dài',
      '6-7: chip quan hệ bấm vào dời tâm mượt hay chớp — cần mắt',
      '6-9: câu "Chưa biết cha…" nổi đè lên canvas',
      'Epic 5: nhãn sơn đè lên họ tên trên thẻ người',
    ],
  },
  {
    ...BAN_B,
    khoa: 'nap-khung',
    duong: '/admin/nap-khung',
    pheDo: DO_B,
    bay: 'Nạp CSV → xem trước so khớp → ghi',
    ghiChu: 'Bước tải tệp mẫu ở `xem-truoc.ts` — KHÔNG bấm "Ghi N dòng vào phả".',
  },
  {
    ...BAN_B,
    khoa: 'hop-nhat',
    duong: '/admin/hop-nhat',
    pheDo: DO_B,
    bay: 'Mảnh chưa nối — gộp mảnh, gỡ bản trùng',
  },
  {
    ...BAN_B,
    khoa: 'tai-khoan',
    duong: '/admin/tai-khoan',
    pheDo: DO_B,
    bay: 'Gắn kết · vai · bảo lãnh',
    toiThieu: { chon: 'main li', ten: 'gắn kết' },
    no: [
      '6-2: phả thật có ĐÚNG MỘT gắn kết nên đường trao vai không mở ra được — cần tài khoản thứ hai',
      '6-2: bước xác nhận khi đổi vai chưa ai bấm — đường ghi, ngoài phạm vi 6-6',
    ],
  },
  { ...BAN_B, khoa: 'so-dong-ho', duong: '/admin/so-dong-ho', pheDo: DO_B, bay: 'Sổ dòng họ — tên họ, chữ đệm, đề từ' },
  { ...BAN_B, khoa: 'noi-chon', duong: '/admin/noi-chon', pheDo: DO_B, bay: 'Danh mục nơi chốn' },
  {
    ...BAN_B,
    khoa: 'admin-404',
    duong: '/admin/[...khong-co-man]',
    pheDo: DO_CHUNG,
    bay: '404 của bàn làm việc — đường không khớp màn nào',
    giaiDuong: async () => '/admin/duong-khong-ton-tai-cho-bo-do',
    ghiChu: 'Có mặt ở đây vì `metadata.title` mốc lùi của layout chỉ dùng cho đúng màn này.',
  },
];

/**
 * Quy `app/**\/page.tsx` về đường URL.
 *
 * Bỏ nhóm route `(pha)` — chúng không xuất hiện trong URL, và đó chính là chỗ dễ đếm sót khi
 * liệt kê bằng mắt (`/them` bị bỏ quên trong lượt liệt kê đầu của story này).
 */
export function duongTuTep(duongTep: string): string {
  const sach = duongTep
    .replace(/\\/g, '/')
    .replace(/^.*?\bapp\//, '/')
    .replace(/\/page\.tsx$/, '');
  const doan = sach.split('/').filter((d) => d !== '' && !/^\(.*\)$/.test(d));
  return '/' + doan.join('/');
}

export function timMan(duong: string): Man | undefined {
  return DANG_KY.find((m) => m.duong === duong);
}
