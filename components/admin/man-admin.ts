/**
 * BẢN ĐỒ MÀN CỦA `/admin` — một nguồn sự thật cho cả ba thứ từng trôi mỗi trang một kiểu:
 * nhãn trên thanh việc, tiêu đề `<h1>` của màn, và mục nào đang mở.
 *
 * Vì sao là DỮ LIỆU THUẦN chứ không phải JSX: layout (server) đọc số rồi truyền xuống khung
 * (client). Component icon không đi qua ranh giới ấy được, nên bảng này chỉ mang `khoa`, còn
 * `khung-admin.tsx` tra icon từ khoá. Đổi lại: thêm một màn là sửa ĐÚNG một chỗ.
 *
 * Spine: EXPERIENCE.md § IA › Bề mặt B — một trang, thanh việc luôn có mặt.
 *
 * ── BỐN THANH GHI, KHÔNG PHẢI BỐN CHỦ ĐỀ (soi lại 24/08/2026) ───────────────────────────────
 * Thanh việc chia theo VAI TRÒ của mục, không theo chủ đề:
 *   1. **Hành động** — một NÚT ở đỉnh (*Thêm người vào phả*), không phải mục điều hướng. Chưa
 *      dựng: story 5-4. Nút KHÔNG mang son — nó chỉ mở biểu mẫu, chưa ghi gì; son (`DESIGN.md
 *      § Colors`) mang đúng nghĩa *đã chốt* nên thuộc về nút gửi bên trong.
 *   2. **Bàn làm việc** — nơi đứng làm, KHÔNG có số.
 *   3. **Đối chiếu** — hộp thư đến, CÓ số. Có số hay không chính là thứ phân biệt thanh ghi này
 *      với hai thanh ghi kia; không cần thêm hoa văn nào.
 *   4. **Sổ dòng họ** — dữ liệu nền, sửa thưa nhưng phải sửa được, KHÔNG có số.
 *
 * "Chỉnh sửa" cố ý KHÔNG có mục riêng: AD-9/AD-10 không bao giờ đè sự thật cũ — sửa là *ghi thêm
 * một khẳng định*, và việc ấy xảy ra ở cột phải nơi một người đang hiện, không ở một màn riêng.
 *
 * ── LUẬT CHO CÁC STORY SAU CỦA EPIC 5 ───────────────────────────────────────────────────────
 * Mỗi story TỰ THÊM mục của mình vào đây khi màn của nó ra đời — không thêm trước. Một mục trỏ
 * vào màn chưa tồn tại là đường cụt, và đường cụt tệ hơn thiếu mục; `app/admin/chrome.test.ts`
 * bắt lỗi ấy.
 *   · 5-3 `Mâu thuẫn`       → nhóm 'doi-chieu' (icon TriangleAlert, có số)
 *   · 5-4 nút *Thêm người*  → thanh ghi 1, ĐỨNG NGOÀI `MAN` (nút, không phải mục)
 */

export type KhoaMan =
  | 'nha'
  | 'cay'
  | 'hang-cho'
  | 'duyet-vao-pha'
  | 'hop-nhat'
  | 'noi-chon'
  | 'so-dong-ho'
  | 'tai-khoan'
  | 'nap-khung';

/** Ba nhóm của thanh việc, theo thứ tự bày. Nhãn nhóm là NHÃN, không phải đường. */
export const NHOM = [
  { khoa: 'ban', ten: 'Admin' },
  { khoa: 'doi-chieu', ten: 'Đối chiếu' },
  { khoa: 'so-ho', ten: 'Sổ dòng họ' },
] as const;

export type KhoaNhom = (typeof NHOM)[number]['khoa'];

export type ManAdmin = {
  khoa: KhoaMan;
  duong: string;
  /** Nhãn trên thanh việc — ngắn, vì ray hẹp. */
  nhan: string;
  /** `<h1>` của màn — có thể dài hơn nhãn. Layout dựng, trang con KHÔNG tự dựng. */
  tieuDe: string;
  nhom: KhoaNhom;
  /**
   * Mục này có hàng chờ để đếm không. "Nạp khung" là VIỆC, không phải hàng chờ — số 0 trên nó
   * không mang nghĩa gì. Trang nhà cũng vậy.
   */
  coSo: boolean;
};

/**
 * Tiêu đề thẻ trình duyệt cho một màn. Thứ TƯ trôi mỗi trang một kiểu, cùng lớp với ba thứ
 * bảng này sinh ra để gom: trước đây chỉ `/admin/nap-khung` khai `metadata`, ba màn còn lại rơi
 * về `title` của root layout nên cả ba thẻ đều đọc "Tộc phả" — trên một bàn làm việc để mở ba
 * thẻ cùng lúc thì không phân biệt được thẻ nào là thẻ nào.
 *
 * Hậu tố "Admin" chứ không phải tên dòng họ: tên họ là DỮ LIỆU (AD-14), khung chỉ nói vai trò
 * sản phẩm — cùng lý do root layout đặt "Tộc phả".
 *
 * Trang nhà mang đúng tiêu đề "Admin", nên ghép máy móc ra **"Admin — Admin"**. Trùng thì nói
 * một lần: hậu tố tồn tại để phân biệt các thẻ với nhau, và nó không phân biệt được gì với
 * chính nó. (Bắt được bằng cách mở trình duyệt đọc `document.title`, không bằng cổng nào.)
 */
export function tieuDeThe(khoa: KhoaMan): string {
  const m = MAN.find((x) => x.khoa === khoa);
  if (!m) return 'Admin';
  return m.tieuDe === 'Admin' ? 'Admin' : `${m.tieuDe} — Admin`;
}

export const MAN: ManAdmin[] = [
  {
    khoa: 'nha',
    duong: '/admin',
    nhan: 'Trang nhà',
    tieuDe: 'Admin',
    nhom: 'ban',
    coSo: false,
  },
  {
    khoa: 'cay',
    duong: '/admin/cay',
    nhan: 'Cây gia phả',
    tieuDe: 'Cây gia phả',
    nhom: 'ban',
    coSo: false,
  },
  {
    khoa: 'hang-cho',
    duong: '/admin/hang-cho',
    nhan: 'Hàng chờ khẳng định',
    tieuDe: 'Hàng chờ duyệt',
    nhom: 'doi-chieu',
    coSo: true,
  },
  {
    khoa: 'duyet-vao-pha',
    duong: '/admin/duyet-vao-pha',
    nhan: 'Duyệt vào phả',
    tieuDe: 'Người xin vào phả',
    nhom: 'doi-chieu',
    coSo: true,
  },
  {
    khoa: 'hop-nhat',
    duong: '/admin/hop-nhat',
    nhan: 'Mảnh chưa nối',
    tieuDe: 'Mảnh chưa nối',
    nhom: 'doi-chieu',
    coSo: true,
  },
  {
    khoa: 'noi-chon',
    duong: '/admin/noi-chon',
    nhan: 'Nơi chốn',
    tieuDe: 'Danh mục nơi chốn',
    nhom: 'so-ho',
    coSo: false,
  },
  {
    khoa: 'so-dong-ho',
    duong: '/admin/so-dong-ho',
    nhan: 'Tên họ & đề từ',
    tieuDe: 'Sổ dòng họ',
    nhom: 'so-ho',
    coSo: false,
  },
  {
    khoa: 'tai-khoan',
    duong: '/admin/tai-khoan',
    nhan: 'Tài khoản',
    tieuDe: 'Tài khoản và vai',
    nhom: 'so-ho',
    // Không phải hàng chờ. Số 0 trên một danh sách người thì không mang nghĩa gì.
    coSo: false,
  },
  {
    khoa: 'nap-khung',
    duong: '/admin/nap-khung',
    nhan: 'Nạp khung',
    tieuDe: 'Nạp khung dòng họ',
    nhom: 'so-ho',
    coSo: false,
  },
];

/**
 * Số trên mục — `null` nghĩa là KHÔNG ĐẾM ĐƯỢC, không phải "không có gì".
 * Đọc hỏng thì mục vẫn hiện, chỉ vắng số; hiện `0` giả là nói dối về hàng chờ.
 */
export type SoViec = Partial<Record<KhoaMan, number | null>>;

/**
 * Màn nào đang mở, theo đường hiện tại. So khớp theo TIỀN TỐ dài nhất để màn con
 * (`/admin/nap-khung/...`) vẫn sáng đúng mục cha; `/admin` chỉ khớp khi bằng đúng.
 *
 * Tiền tố phải dừng ở BIÊN SEGMENT. `startsWith('/admin/hang-cho')` trơn cũng nuốt luôn
 * `/admin/hang-cho-cu`: mục sai sáng lên, `aria-current="page"` chỉ nhầm, và `<h1>` của màn
 * thành tiêu đề của màn khác. Hôm nay chưa có đường nào va vào — nhưng bảng ngay trên đây đã
 * hẹn sáu màn nữa mọc dưới đúng những tiền tố này (5-2 … 5-8).
 */
export function manTheoDuong(duong: string): ManAdmin | undefined {
  let trung: ManAdmin | undefined;
  for (const m of MAN) {
    const khop =
      m.duong === '/admin' ? duong === '/admin' : duong === m.duong || duong.startsWith(`${m.duong}/`);
    if (khop && (!trung || m.duong.length > trung.duong.length)) trung = m;
  }
  return trung;
}

/**
 * Một dòng kết quả tìm, đã dịch sang lời bề mặt — `components/` không import `@/core/*`
 * (build-contract § Phân tầng), nên khung nhận đúng hình dạng này chứ không nhận `SearchHit`.
 * `nguCanh` là thứ phân biệt hai người trùng tên: "đời 4 · chi 1.2 · 1941–2019".
 */
export type KetQuaTim = { personId: string; hoTen: string; nguCanh: string };

/** Hàm tìm do `app/admin/layout.tsx` truyền xuống (server action). Trả rỗng khi đọc hỏng. */
export type HamTim = (tuKhoa: string) => Promise<KetQuaTim[]>;
