/**
 * Dữ liệu mock dùng chung cho các màn UI Workshop — gia phả dòng họ Nguyễn Quang.
 *
 * Thư mục `_mock` có tiền tố `_` nên Next KHÔNG coi là route (private folder). Mọi màn dựng thử
 * import từ đây để cả xưởng đọc như MỘT hệ thống nhất quán — cùng một thực thể, thay vì mỗi màn
 * bịa dữ liệu riêng. Khi dev promote một màn ra route thật, đây chính là chỗ bị thay bằng truy
 * vấn dữ liệu thật (Drizzle/API).
 *
 * ⚠️ **Đây là dữ liệu BỊA để dựng giao diện, không phải phả thật.** Tên người dưới đây không phải
 * người thật trong họ. Không ai được chép số liệu từ file này sang tài liệu dòng họ.
 *
 * Hình dạng bám PRD §4 (Thuật ngữ) + §5, cố ý mang sẵn ba ràng buộc khó nhất để màn nào cũng phải
 * đối diện chúng thay vì né:
 *   1. **Đời và mã chi là DẪN XUẤT** (PRD §3, FR-63) — seed KHÔNG lưu `doi`/`maChi` trên người;
 *      màn nào cần thì gọi `doiCua()` / `maChiCua()`.
 *   2. **Dữ liệu là nhiều MẢNH rời**, chưa phải một cây (FR-48) — seed có hai mảnh chưa nối.
 *   3. **Mỗi khẳng định mang nguồn và độ tin cậy** (FR-1, FR-2) — không có sự thật trần trụi.
 */

/** Ba mức tin cậy hiện trên cây bằng màu (FR-2). */
export type MucTinCay = 'chac-chan' | 'theo-loi-ke' | 'ton-nghi';

/** Hai tầng dữ liệu (FR-3): ghi vào tồn nghi ngay, người có vai nâng lên chính phả. */
export type Tang = 'chinh-pha' | 'ton-nghi';

/** Vai trò tối thiểu để FR-3 có nghĩa (FR-64). */
export type Vai = 'quan-tri' | 'dau-moi-chi' | 'thanh-vien' | 'khach';

/**
 * Một người trong phả. `id` là định danh KHÔNG BAO GIỜ ĐỔI khi gốc dịch (PRD §3 hệ quả 2) —
 * đừng dùng mã chi làm khoá.
 */
export type Nguoi = {
  id: string;
  hoTen: string;
  /** Tên thật của người đã khuất, kiêng gọi thẳng (PRD §4). */
  huy?: string;
  /** Tên dùng khi khấn — đọc sai là lỗi nặng, nên màn nào hiện tên này phải hiện rõ nhãn. */
  tenHem?: string;
  gioiTinh: 'nam' | 'nu';
  /** Người còn sống: CHỈ năm sinh, không ngày tháng (FR-37 mặc định §11). */
  namSinh?: number;
  namMat?: number;
  conSong: boolean;
  /** `null` = chưa truy được đời trên → ứng viên làm gốc tạm của mảnh. */
  chaId: string | null;
  meId: string | null;
  /** Vợ/chồng — chính phả chép người mang huyết thống *và vợ của họ* (PRD §4). */
  voChongId?: string;
  /** Con dâu/rể ghi tên thật đầy đủ (§11), đánh dấu để màn biết vẽ khác. */
  ketHonVaoHo?: boolean;
  tang: Tang;
  tinCay: MucTinCay;
  /** Mảnh chứa người này — chưa nối thì mỗi mảnh có gốc tạm riêng (PRD §3 hệ quả 3). */
  manhId: string;
  /**
   * Ai đưa người này vào phả, và khi nào — dẫn xuất từ nhật ký sửa (FR-39).
   *
   * Không phải trang trí: đây là cơ chế tạo TỰ HÀO chính ở tầng dữ liệu — tên người đóng góp nằm
   * TRÊN PHẢ, không chỉ trong nhật ký. `DESIGN.md § Components` bắt buộc mọi node vừa được thêm
   * phải mang dòng này.
   */
  nguoiThem?: string;
  ngayThem?: string;
};

/** Đơn vị dữ liệu nhỏ nhất: KHẲNG ĐỊNH về người, luôn mang nguồn (FR-1). */
export type KhangDinh = {
  id: string;
  veNguoiId: string;
  menhDe: string;
  nguon: string;
  nguoiKhai: string;
  ngayKhai: string;
  tinCay: MucTinCay;
  tang: Tang;
};

/** Bản thu lời kể (FR-47) + mức tiếp cận do chính người kể chọn (FR-49). */
export type LoiKe = {
  id: string;
  nguoiKeId: string;
  nguoiThu: string;
  ngayThu: string;
  /** Giây — màn nào hiện tổng giờ ghi âm (M3) cộng từ đây. */
  thoiLuong: number;
  noiVe: string[];
  tiepCan: 'cong-khai' | 'chi-quan-tri' | 'niem-phong';
  /** Chỉ có nghĩa khi `tiepCan === 'niem-phong'`. */
  moNiemPhongNam?: number;
  daBocTach: boolean;
};

/** Một mảnh rời chưa nối vào cây chung (FR-48). */
export type Manh = {
  id: string;
  nhan: string;
  /** Gốc TẠM — "cụ xa nhất hiện biết", không phải khẳng định đã là Thủy tổ (FR-63). */
  gocTamId: string;
  soNguoi: number;
};

// ── Người ───────────────────────────────────────────────────────────────────

export const NGUOI: Nguoi[] = [
  // Mảnh A — mảnh lớn, dựng từ khung nhập tay (FR-51) rồi loang ra bằng tự khai.
  {
    id: 'n-001',
    hoTen: 'Nguyễn Quang Thản',
    huy: 'Thản',
    tenHem: 'Phúc Chính',
    gioiTinh: 'nam',
    namMat: 1901,
    conSong: false,
    chaId: null,
    meId: null,
    tang: 'ton-nghi',
    tinCay: 'ton-nghi',
    manhId: 'm-a',
  },
  {
    id: 'n-002',
    hoTen: 'Nguyễn Quang Đệ',
    huy: 'Đệ',
    gioiTinh: 'nam',
    namSinh: 1888,
    namMat: 1954,
    conSong: false,
    chaId: 'n-001',
    meId: null,
    tang: 'ton-nghi',
    tinCay: 'theo-loi-ke',
    manhId: 'm-a',
  },
  {
    id: 'n-003',
    hoTen: 'Trần Thị Vẽ',
    gioiTinh: 'nu',
    namMat: 1961,
    conSong: false,
    chaId: null,
    meId: null,
    voChongId: 'n-002',
    ketHonVaoHo: true,
    tang: 'ton-nghi',
    tinCay: 'theo-loi-ke',
    manhId: 'm-a',
  },
  {
    id: 'n-004',
    hoTen: 'Nguyễn Quang Bảng',
    gioiTinh: 'nam',
    namSinh: 1921,
    namMat: 1998,
    conSong: false,
    chaId: 'n-002',
    meId: 'n-003',
    tang: 'chinh-pha',
    tinCay: 'chac-chan',
    manhId: 'm-a',
  },
  {
    id: 'n-005',
    hoTen: 'Nguyễn Quang Hoạch',
    gioiTinh: 'nam',
    namSinh: 1949,
    conSong: true,
    chaId: 'n-004',
    meId: null,
    tang: 'chinh-pha',
    tinCay: 'chac-chan',
    manhId: 'm-a',
  },
  {
    id: 'n-006',
    hoTen: 'Nguyễn Thị Lành',
    gioiTinh: 'nu',
    namSinh: 1952,
    conSong: true,
    chaId: 'n-004',
    meId: null,
    tang: 'chinh-pha',
    tinCay: 'chac-chan',
    manhId: 'm-a',
  },
  {
    id: 'n-007',
    hoTen: 'Nguyễn Quang Hiệp',
    gioiTinh: 'nam',
    namSinh: 1978,
    conSong: true,
    chaId: 'n-005',
    meId: null,
    tang: 'chinh-pha',
    tinCay: 'chac-chan',
    manhId: 'm-a',
  },
  {
    id: 'n-008',
    hoTen: 'Nguyễn Quang An',
    gioiTinh: 'nam',
    namSinh: 2012,
    conSong: true,
    chaId: 'n-007',
    meId: null,
    tang: 'ton-nghi',
    tinCay: 'chac-chan',
    manhId: 'm-a',
  },

  // ── Hành trình 1 (EXPERIENCE.md § Key Flows — Khánh) ──────────────────────
  // Trạng thái SAU nhịp cao trào: Khánh đã khai bố và xác nhận liên kết anh em.
  // Cả ba vào thẳng Tầng tồn nghi, hiện ngay, không chờ duyệt (FR-3).
  {
    id: 'n-009',
    hoTen: 'Nguyễn Quang Hùng',
    gioiTinh: 'nam',
    namSinh: 1975,
    conSong: true,
    chaId: 'n-005',
    meId: null,
    tang: 'ton-nghi',
    tinCay: 'ton-nghi',
    manhId: 'm-a',
    nguoiThem: 'cháu Khánh',
    ngayThem: 'hôm nay',
  },
  {
    // Anh trai Khánh. Nạp từ khung CSV (FR-51) như NODE RỜI — biết tên, chưa biết cha; đó là lý
    // do Khánh tìm anh thì thấy mà tìm bố thì không. `chaId` chỉ có giá trị SAU khi Khánh khai
    // bố và xác nhận liên kết. Xem [NOTE FOR UX] ở EXPERIENCE.md § Key Flows — Luồng 1.
    id: 'n-011',
    hoTen: 'Nguyễn Quang Khoa',
    gioiTinh: 'nam',
    namSinh: 2001,
    conSong: true,
    chaId: 'n-009',
    meId: null,
    tang: 'ton-nghi',
    tinCay: 'theo-loi-ke',
    manhId: 'm-a',
    nguoiThem: 'khung nhập tay',
    ngayThem: '02/2026',
  },
  {
    id: 'n-010',
    hoTen: 'Nguyễn Quang Khánh',
    gioiTinh: 'nam',
    namSinh: 2004,
    conSong: true,
    chaId: 'n-009',
    meId: null,
    tang: 'ton-nghi',
    tinCay: 'chac-chan',
    manhId: 'm-a',
    nguoiThem: 'tự khai',
    ngayThem: 'hôm nay',
  },

  // ── Chi Hai và Chi Ba ─────────────────────────────────────────────────────
  // Hai người con nữa của cụ Thản, để tầng "cả tộc" có nhiều hơn một khối chi. Không có mấy chi
  // thì màn cả tộc không nói lên điều gì — và ba chi có độ dày rất khác nhau mới lộ ra đúng thứ
  // khối chi sinh ra để cho thấy: chi nào đã ghi được nhiều, chi nào còn kẹt ở tồn nghi.
  {
    id: 'n-020',
    hoTen: 'Nguyễn Quang Đoài',
    gioiTinh: 'nam',
    namMat: 1949,
    conSong: false,
    chaId: 'n-001',
    meId: null,
    tang: 'ton-nghi',
    tinCay: 'ton-nghi',
    manhId: 'm-a',
  },
  {
    id: 'n-021',
    hoTen: 'Nguyễn Quang Cẩn',
    gioiTinh: 'nam',
    namSinh: 1925,
    namMat: 2001,
    conSong: false,
    chaId: 'n-020',
    meId: null,
    tang: 'ton-nghi',
    tinCay: 'theo-loi-ke',
    manhId: 'm-a',
  },
  {
    id: 'n-022',
    hoTen: 'Nguyễn Quang Tuyên',
    gioiTinh: 'nam',
    namSinh: 1955,
    conSong: true,
    chaId: 'n-021',
    meId: null,
    tang: 'chinh-pha',
    tinCay: 'chac-chan',
    manhId: 'm-a',
  },
  {
    id: 'n-023',
    hoTen: 'Nguyễn Quang Vinh',
    gioiTinh: 'nam',
    namSinh: 1982,
    conSong: true,
    chaId: 'n-022',
    meId: null,
    tang: 'ton-nghi',
    tinCay: 'ton-nghi',
    manhId: 'm-a',
  },
  {
    id: 'n-024',
    hoTen: 'Nguyễn Thị Hoà',
    gioiTinh: 'nu',
    namSinh: 1985,
    conSong: true,
    chaId: 'n-022',
    meId: null,
    tang: 'ton-nghi',
    tinCay: 'ton-nghi',
    manhId: 'm-a',
  },
  {
    id: 'n-030',
    hoTen: 'Nguyễn Quang Đường',
    gioiTinh: 'nam',
    namMat: 1943,
    conSong: false,
    chaId: 'n-001',
    meId: null,
    tang: 'ton-nghi',
    tinCay: 'ton-nghi',
    manhId: 'm-a',
  },
  {
    id: 'n-031',
    hoTen: 'Nguyễn Quang Lộc',
    gioiTinh: 'nam',
    namSinh: 1930,
    namMat: 1988,
    conSong: false,
    chaId: 'n-030',
    meId: null,
    tang: 'ton-nghi',
    tinCay: 'ton-nghi',
    manhId: 'm-a',
  },
  {
    id: 'n-032',
    hoTen: 'Nguyễn Quang Sơn',
    gioiTinh: 'nam',
    namSinh: 1961,
    conSong: true,
    chaId: 'n-031',
    meId: null,
    tang: 'ton-nghi',
    tinCay: 'theo-loi-ke',
    manhId: 'm-a',
  },

  // Hai ứng viên gần giống cho màn KHÔNG TÌM THẤY — xem UNG_VIEN_GAN_GIONG.
  // Cả hai đều không phải bố Khánh; đó mới là ca cần vẽ.
  {
    id: 'n-012',
    hoTen: 'Nguyễn Quang Hưng', // khác đúng một dấu
    gioiTinh: 'nam',
    namSinh: 1971,
    conSong: true,
    chaId: 'n-004',
    meId: null,
    tang: 'chinh-pha',
    tinCay: 'chac-chan',
    manhId: 'm-a',
  },

  // Mảnh B — một người ở xa tự khai từ dưới lên, chưa ai nối được vào mảnh A.
  // Đây chính là ca FR-48 phải giải: `n-101` có thể LÀ `n-002`, chưa ai chắc.
  {
    id: 'n-101',
    hoTen: 'Nguyễn Quang Đệ',
    gioiTinh: 'nam',
    namMat: 1954,
    conSong: false,
    chaId: null,
    meId: null,
    tang: 'ton-nghi',
    tinCay: 'ton-nghi',
    manhId: 'm-b',
  },
  {
    id: 'n-102',
    hoTen: 'Nguyễn Quang Thuyết',
    gioiTinh: 'nam',
    namSinh: 1930,
    namMat: 2009,
    conSong: false,
    chaId: 'n-101',
    meId: null,
    tang: 'ton-nghi',
    tinCay: 'theo-loi-ke',
    manhId: 'm-b',
  },
  {
    id: 'n-103',
    hoTen: 'Nguyễn Quang Trọng',
    gioiTinh: 'nam',
    namSinh: 1966,
    conSong: true,
    chaId: 'n-102',
    meId: null,
    tang: 'ton-nghi',
    tinCay: 'theo-loi-ke',
    manhId: 'm-b',
  },
  {
    // TRÙNG KHÍT tên bố Khánh, nhưng ở mảnh khác — người thật, không phải bố Khánh.
    id: 'n-013',
    hoTen: 'Nguyễn Quang Hùng',
    gioiTinh: 'nam',
    namSinh: 1958,
    conSong: true,
    chaId: 'n-102',
    meId: null,
    tang: 'ton-nghi',
    tinCay: 'theo-loi-ke',
    manhId: 'm-b',
  },

  // ── Vợ (PRD §11: con dâu GHI TÊN THẬT ĐẦY ĐỦ) ─────────────────────────────
  //
  // Thêm 24/08/2026 để bàn làm việc có ca thật mà vẽ: một node trên canvas phải gộp cả người
  // bạn đời vào CÙNG MỘT THẺ, không tách thành hai node — hai node cạnh nhau đọc thành hai
  // người rời, mà vợ chồng là một chỗ trong phả.
  //
  // Người kết hôn vào họ có `chaId: null` nên KHÔNG bao giờ là con của ai — BFS cha-con không
  // chạm tới họ, và đó là lý do canvas phải đi tìm họ qua `voChongId` chứ không qua cạnh.
  {
    id: 'n-041',
    hoTen: 'Phạm Thị Nhàn',
    gioiTinh: 'nu',
    namSinh: 1925,
    namMat: 2003,
    conSong: false,
    chaId: null,
    meId: null,
    voChongId: 'n-004',
    ketHonVaoHo: true,
    tang: 'chinh-pha',
    tinCay: 'chac-chan',
    manhId: 'm-a',
  },
  {
    id: 'n-042',
    hoTen: 'Đỗ Thị Vân',
    gioiTinh: 'nu',
    namSinh: 1953,
    conSong: true,
    chaId: null,
    meId: null,
    voChongId: 'n-005',
    ketHonVaoHo: true,
    tang: 'chinh-pha',
    tinCay: 'chac-chan',
    manhId: 'm-a',
  },
  {
    id: 'n-043',
    hoTen: 'Lê Thị Thu Hà',
    gioiTinh: 'nu',
    namSinh: 1981,
    conSong: true,
    chaId: null,
    meId: null,
    voChongId: 'n-007',
    ketHonVaoHo: true,
    tang: 'chinh-pha',
    tinCay: 'chac-chan',
    manhId: 'm-a',
  },
  {
    // Vừa được khai, chưa đối chiếu — thẻ của ông Hùng vì thế mang chất liệu tồn nghi ở dòng vợ.
    id: 'n-044',
    hoTen: 'Bùi Thị Mến',
    gioiTinh: 'nu',
    conSong: true,
    chaId: null,
    meId: null,
    voChongId: 'n-009',
    ketHonVaoHo: true,
    tang: 'ton-nghi',
    tinCay: 'theo-loi-ke',
    manhId: 'm-a',
  },
];

/** Người đang đăng nhập ở màn BÀN LÀM VIỆC — bán kính riêng tư (FR-37) tính từ đây. */
export const TOI_ID = 'n-007';

/**
 * Người đang đăng nhập ở bề mặt NGƯỜI TRONG HỌ.
 *
 * Tách khỏi `TOI_ID` vì hai bề mặt có hai nhân vật khác nhau (EXPERIENCE.md § Foundation): bàn
 * duyệt là Hiệp, còn màn của người trong họ kể hành trình của Khánh. Cùng một `TOI_ID` cho cả hai
 * thì bán kính riêng tư vẽ sai người.
 */
/**
 * Tên dòng họ — NGUỒN DUY NHẤT cho mọi màn của bề mặt "Người trong họ".
 *
 * Nằm ở mock chứ không nằm trong `components/pha/*`: `AD-14` bắt không hardcode gì của một dòng
 * họ cụ thể vào mã sản phẩm. Component nhận qua prop; bản thật lấy từ cấu hình dòng họ, xưởng lấy
 * từ đây. Để mỗi màn tự dùng mặc định của component là cách chắc chắn để chúng hiện tên khác nhau
 * — và đó đúng là chuyện đã xảy ra: 12 màn hiện "Tộc phả", riêng trang chủ hiện "Nguyễn Quang".
 */
export const TEN_PHA = 'Nguyễn Quang';

export const KHANH_ID = 'n-010';

/**
 * Ứng viên gần giống khi Khánh tìm "Nguyễn Quang Hùng" (EXPERIENCE.md § State Patterns).
 *
 * Ca khó cố ý: `n-013` tên **trùng khít**, `n-012` chỉ khác dấu. Cả hai đều KHÔNG phải bố Khánh.
 * Đây là lý do màn không-tìm-thấy bắt buộc hiện **đời + chi** — chỉ hiện tên thì người dùng chọn
 * nhầm, và một liên kết cha-con sai làm hỏng phả của cả một chi.
 */
export const UNG_VIEN_GAN_GIONG = ['n-013', 'n-012'];

// ── Mảnh ────────────────────────────────────────────────────────────────────

// `soNguoi` là DẪN XUẤT — đếm tại chỗ thay vì chép tay. Con số chép tay lệch ngay lần đầu có ai
// thêm người, và một bảng "mảnh chưa nối" nói sai số là đúng thứ FR-48 sinh ra để chống.
export const MANH: Manh[] = [
  { id: 'm-a', nhan: 'Mảnh chính (từ khung nhập tay)', gocTamId: 'n-001', soNguoi: 0 },
  { id: 'm-b', nhan: 'Mảnh chi trong Nam', gocTamId: 'n-101', soNguoi: 0 },
].map((m) => ({ ...m, soNguoi: NGUOI.filter((n) => n.manhId === m.id).length }));

// ── Khẳng định ──────────────────────────────────────────────────────────────

export const KHANG_DINH: KhangDinh[] = [
  {
    id: 'k-001',
    veNguoiId: 'n-002',
    menhDe: 'Nguyễn Quang Đệ là con của Nguyễn Quang Thản',
    nguon: 'Lời kể — bà Nguyễn Thị Lành, 04/2026',
    nguoiKhai: 'Nguyễn Quang Hiệp',
    ngayKhai: '2026-04-18',
    tinCay: 'theo-loi-ke',
    tang: 'ton-nghi',
  },
  {
    id: 'k-002',
    veNguoiId: 'n-004',
    menhDe: 'Nguyễn Quang Bảng mất năm 1998',
    nguon: 'Bia mộ — ảnh chụp 03/2026',
    nguoiKhai: 'Nguyễn Quang Hiệp',
    ngayKhai: '2026-03-02',
    tinCay: 'chac-chan',
    tang: 'chinh-pha',
  },
  {
    id: 'k-003',
    veNguoiId: 'n-001',
    menhDe: 'Tên hèm của cụ Thản là Phúc Chính',
    nguon: 'Lời kể — cụ Nguyễn Quang Hoạch, 05/2026',
    nguoiKhai: 'Nguyễn Quang Hiệp',
    ngayKhai: '2026-05-11',
    tinCay: 'ton-nghi',
    tang: 'ton-nghi',
  },
  {
    id: 'k-004',
    veNguoiId: 'n-101',
    menhDe: 'Cụ tổ của chi trong Nam tên Đệ, mất khoảng 1954',
    nguon: 'Tự khai — Nguyễn Quang Trọng',
    nguoiKhai: 'Nguyễn Quang Trọng',
    ngayKhai: '2026-06-30',
    tinCay: 'ton-nghi',
    tang: 'ton-nghi',
  },
  // Khẳng định về BỐ KHÁNH — node vừa sinh ra ở cao trào Luồng 1. Trang một người vẽ từ đây, và
  // đây là chỗ DUY NHẤT FR-1 lộ ra với người thường (EXPERIENCE.md § Chip mức tin cậy): một người
  // không đọc "bản ghi", họ đọc "ai nói điều này, dựa vào đâu".
  {
    id: 'k-005',
    veNguoiId: 'n-009',
    menhDe: 'Nguyễn Quang Hùng là con của Nguyễn Quang Hoạch',
    nguon: 'Tự khai — con trai, cháu Khánh',
    nguoiKhai: 'Nguyễn Quang Khánh',
    ngayKhai: '2026-08-12',
    tinCay: 'ton-nghi',
    tang: 'ton-nghi',
  },
  {
    id: 'k-006',
    veNguoiId: 'n-009',
    menhDe: 'Nguyễn Quang Hùng sinh năm 1975',
    nguon: 'Tự khai — con trai, cháu Khánh',
    nguoiKhai: 'Nguyễn Quang Khánh',
    ngayKhai: '2026-08-12',
    tinCay: 'ton-nghi',
    tang: 'ton-nghi',
  },
  {
    // MÂU THUẪN cố ý: cùng một người, HAI năm sinh khác nhau, từ hai nguồn khác nhau, ở hai
    // TẦNG khác nhau. Đây là ca mà panel chồng khẳng định phải xử được — và là lý do panel
    // không thể là một cái form có ô "năm sinh".
    id: 'k-008',
    veNguoiId: 'n-009',
    menhDe: 'Nguyễn Quang Hùng sinh năm 1973',
    nguon: 'Sổ hộ khẩu cũ — ảnh chụp 07/2026',
    nguoiKhai: 'Nguyễn Quang Hiệp',
    ngayKhai: '2026-07-04',
    tinCay: 'chac-chan',
    tang: 'chinh-pha',
  },
  {
    // Cùng một người, hai khẳng định KHÁC MỨC TIN CẬY. Cố ý: mức tin cậy gắn vào KHẲNG ĐỊNH chứ
    // không gắn vào người (FR-1 + FR-2). Một trang người vẽ đúng phải cho thấy điều đó, nếu không
    // "tồn nghi" bị đọc thành một nhãn dán lên con người — sai, và xúc phạm.
    id: 'k-007',
    veNguoiId: 'n-009',
    menhDe: 'Nguyễn Quang Hùng là anh ruột của Nguyễn Quang Khoa',
    nguon: 'Xác nhận liên kết — cháu Khánh, đối chiếu khung nhập tay 02/2026',
    nguoiKhai: 'Nguyễn Quang Khánh',
    ngayKhai: '2026-08-12',
    tinCay: 'theo-loi-ke',
    tang: 'ton-nghi',
  },
];

/** Khẳng định về một người, mới nhất trước. Trang một người và panel giải nghĩa đọc từ đây. */
export function khangDinhVe(nguoiId: string): KhangDinh[] {
  return KHANG_DINH.filter((k) => k.veNguoiId === nguoiId).sort((a, b) =>
    b.ngayKhai.localeCompare(a.ngayKhai),
  );
}

// ── Lời kể ──────────────────────────────────────────────────────────────────

export const LOI_KE: LoiKe[] = [
  {
    id: 'lk-001',
    nguoiKeId: 'n-006',
    nguoiThu: 'Nguyễn Quang Hiệp',
    ngayThu: '2026-04-18',
    thoiLuong: 372,
    noiVe: ['n-001', 'n-002'],
    tiepCan: 'cong-khai',
    daBocTach: false,
  },
  {
    id: 'lk-002',
    nguoiKeId: 'n-005',
    nguoiThu: 'Nguyễn Quang Hiệp',
    ngayThu: '2026-05-11',
    thoiLuong: 1544,
    noiVe: ['n-001', 'n-004'],
    tiepCan: 'chi-quan-tri',
    daBocTach: false,
  },
  {
    id: 'lk-003',
    nguoiKeId: 'n-006',
    nguoiThu: 'Nguyễn Quang Hiệp',
    ngayThu: '2026-05-11',
    thoiLuong: 806,
    noiVe: ['n-004'],
    tiepCan: 'niem-phong',
    moNiemPhongNam: 2046,
    daBocTach: false,
  },
];

// ── Dẫn xuất — KHÔNG lưu cứng (FR-63) ───────────────────────────────────────

/** Đường ngược lên gốc tạm của mảnh chứa người này. Phần thưởng của FR-13 vẽ từ hàm này. */
export function duongVeGoc(id: string): Nguoi[] {
  const duong: Nguoi[] = [];
  let cur = NGUOI.find((n) => n.id === id);
  while (cur) {
    duong.push(cur);
    cur = cur.chaId ? NGUOI.find((n) => n.id === cur!.chaId) : undefined;
  }
  return duong;
}

/** Đời tính TỪ GỐC TẠM của mảnh, đếm lúc hiển thị. Gốc tạm là đời 1. */
export function doiCua(id: string): number {
  return duongVeGoc(id).length;
}

/**
 * Mã chi hiển thị (`1.3.2`) — cũng là dẫn xuất, tính từ thứ tự con trong mỗi đời. Đổi khi gốc
 * dịch, nên KHÔNG được lưu và KHÔNG được dùng làm khoá.
 */
export function maChiCua(id: string): string {
  const duong = duongVeGoc(id).reverse();
  return duong
    .map((n, i) => {
      if (i === 0) return '1';
      const anhChiEm = NGUOI.filter((x) => x.chaId === duong[i - 1].id);
      return String(anhChiEm.findIndex((x) => x.id === n.id) + 1);
    })
    .join('.');
}

/**
 * CHI = nhánh xuất phát từ một người con của gốc tạm (đời 2).
 *
 * Cũng là DẪN XUẤT, không lưu (FR-63) — gốc dịch một đời thì cái đang là "chi" thành "cả tộc",
 * và cái đang là "cả tộc" thành một chi con. Lưu cứng là hỏng toàn bộ khi tìm thêm được một đời.
 *
 * Trả `null` cho chính gốc tạm: cụ tổ không thuộc chi nào, cụ LÀ điểm chia chi.
 */
export function chiCua(id: string): Nguoi | null {
  const nguoi = NGUOI.find((n) => n.id === id);
  // Người kết hôn vào họ không có đường huyết thống lên gốc, nhưng THUỘC chi của chồng/vợ —
  // PRD §4: chính phả chép người mang huyết thống *và vợ của họ*. Bỏ sót họ thì tổng các chi
  // không bằng tổng dòng họ, và con dâu biến mất khỏi chính cái phả có tên mình.
  if (nguoi && !nguoi.chaId && nguoi.voChongId) return chiCua(nguoi.voChongId);
  const duong = [...duongVeGoc(id)].reverse(); // [gốc tạm, …, chính mình]
  return duong.length >= 2 ? duong[1] : null;
}

/**
 * NHÃN CHI để hiển thị cạnh số đời — "chi Hai", không phải mã chi "1.1.1.1.2".
 *
 * Hai thứ khác nhau, và trước 12/08/2026 mọi màn đang in nhầm thứ hai vào chỗ của thứ nhất:
 *   · `maChiCua` là **mã đường đi** (`1.3.2`) — công cụ của người tu phả, dùng để tra và đối
 *     chiếu. Nó dài ra theo từng đời, nên tới đời 6 đã là `1.1.1.1.2.1`: không đọc được, không
 *     nhớ được, và không phải cách người trong họ gọi nhau.
 *   · Nhãn chi là **cách dòng họ tự gọi mình**: chi Nhất, chi Hai, chi Ba. Đây là thứ EXPERIENCE.md
 *     § State Patterns viết ra trong ví dụ chuẩn ("đời 6 · chi Hai"), và là thứ duy nhất giúp phân
 *     biệt hai người trùng tên mà không bắt ai đọc một dãy số.
 *
 * Gốc tạm không thuộc chi nào — cụ LÀ điểm chia chi, nên trả về nhãn riêng thay vì bịa ra "chi 1".
 */
export function nhanChi(id: string): string {
  const goc = chiCua(id);
  if (!goc) return 'gốc của tộc';
  return tenChi(goc.id).replace(/^Chi /, 'chi ');
}

/** Tên chi theo thứ tự sinh: Chi Nhất, Chi Hai, Chi Ba… Dẫn xuất từ thứ tự con của gốc tạm. */
export function tenChi(gocChiId: string): string {
  const goc = NGUOI.find((n) => n.id === gocChiId);
  if (!goc?.chaId) return 'Chi';
  const anhChiEm = NGUOI.filter((x) => x.chaId === goc.chaId);
  const thu = anhChiEm.findIndex((x) => x.id === gocChiId);
  return ['Chi Nhất', 'Chi Hai', 'Chi Ba', 'Chi Tư', 'Chi Năm', 'Chi Sáu', 'Chi Bảy'][thu] ?? 'Chi';
}

/**
 * Đời để HIỂN THỊ. Khác `doiCua` — cái đó đếm theo huyết thống.
 *
 * Người kết hôn vào họ không có đường huyết thống lên gốc, nên `doiCua` trả về 1 và cụ bà đứng
 * nhầm chỗ ngang cụ tổ. Trong phả, đời của con dâu/con rể là **đời của chồng/vợ**.
 */
export function doiHienThi(id: string): number {
  const nguoi = NGUOI.find((n) => n.id === id);
  if (nguoi && !nguoi.chaId && nguoi.voChongId) return doiHienThi(nguoi.voChongId);
  return doiCua(id);
}

export type KhoiChi = {
  gocId: string;
  ten: string;
  /** Người đứng đầu chi — hiện dưới tên chi để người trong họ nhận ra chi của mình. */
  nguoiDungDau: string;
  soNguoi: number;
  /** Còn bao nhiêu người chưa được duyệt lên Tầng chính thức — lộ ra chi nào cần người xác minh. */
  soTonNghi: number;
  soDoi: number;
};

/**
 * Các khối chi của một mảnh — dữ liệu cho TẦNG 1 của cây (cả tộc).
 *
 * Tầng 1 vẽ CHI chứ không vẽ người: ở quy mô PRD chốt (dưới 300 người, 5–7 đời), đời rộng nhất
 * khoảng 120 người; với sàn chữ 17px thì một ô tên cần ~140px, tức ~16.800px bề ngang trên màn
 * 390px. Vẽ hết người trong một màn buộc chữ xuống dưới sàn 15px — vi phạm chính hàng rào cứng
 * của Accessibility Floor. Nên tầng 1 vẽ 5–7 khối chi, luôn vừa màn, chữ luôn đủ lớn.
 */
export function khoiChiCua(manhId: string): KhoiChi[] {
  const manh = MANH.find((m) => m.id === manhId);
  if (!manh) return [];
  const nguoiTrongManh = NGUOI.filter((n) => n.manhId === manhId);
  return NGUOI.filter((n) => n.chaId === manh.gocTamId).map((gocChi) => {
    const thanhVien = nguoiTrongManh.filter((n) => chiCua(n.id)?.id === gocChi.id);
    return {
      gocId: gocChi.id,
      ten: tenChi(gocChi.id),
      nguoiDungDau: gocChi.hoTen,
      soNguoi: thanhVien.length,
      soTonNghi: thanhVien.filter((n) => n.tang === 'ton-nghi').length,
      soDoi: Math.max(...thanhVien.map((n) => doiHienThi(n.id))) - 1,
    };
  });
}

/**
 * Một NODE trên cây = một CẶP, không phải một người.
 *
 * Vì sao gộp vợ/chồng vào cùng một node: trong phả, vợ chồng đứng chung một ô và con cái treo
 * dưới cả hai. Tách thành hai node thì hoặc con nối vào mỗi người cha (mất người mẹ khỏi cây),
 * hoặc phải vẽ nhánh đôi — cả hai đều xa cách đọc của phả in.
 */
export type CapTrenCay = {
  /** Người mang huyết thống — cũng là id của node. */
  nguoi: Nguoi;
  /** Vợ/chồng, hiện TRONG cùng một thẻ. */
  banDoi?: Nguoi;
  /** Node cha; `null` = gốc của cây đang vẽ. */
  chaId: string | null;
};

/**
 * Các cặp của một chi, đã sẵn sàng để xếp thành cây — dữ liệu cho TẦNG 2 bản máy.
 *
 * `chaId` chỉ giữ khi người cha CÓ MẶT trong chính chi đang vẽ; cha nằm ngoài (gốc tạm của cả
 * tộc) thì trả `null`, nếu không cây sẽ đi tìm một node không tồn tại và nhánh treo lơ lửng.
 */
export function capTheoChi(gocChiId: string): CapTrenCay[] {
  const thanhVien = NGUOI.filter((n) => chiCua(n.id)?.id === gocChiId);
  const huyetThong = thanhVien.filter((n) => !n.ketHonVaoHo);
  return huyetThong.map((n) => ({
    nguoi: n,
    banDoi: thanhVien.find((x) => x.voChongId === n.id),
    chaId: huyetThong.some((x) => x.id === n.chaId) ? n.chaId : null,
  }));
}

/** Người trong một chi, gom theo đời — dữ liệu cho TẦNG 2 (gập theo đời, đúng chữ FR-15). */
export function nguoiTheoDoi(gocChiId: string): { doi: number; nguoi: Nguoi[] }[] {
  const thanhVien = NGUOI.filter((n) => chiCua(n.id)?.id === gocChiId);
  const nhom = new Map<number, Nguoi[]>();
  for (const n of thanhVien) {
    const d = doiHienThi(n.id);
    nhom.set(d, [...(nhom.get(d) ?? []), n]);
  }
  return [...nhom.entries()].sort((a, b) => a[0] - b[0]).map(([doi, nguoi]) => ({ doi, nguoi }));
}

/** Số mảnh chưa nối — hiển thị trung thực thay vì vẽ như một cây liền (FR-48). */
export const SO_MANH_CHUA_NOI = MANH.length;

/** Tổng giờ ghi âm đã thu — chỉ số M3 của PRD §9. */
export const GIO_GHI_AM = LOI_KE.reduce((s, l) => s + l.thoiLuong, 0) / 3600;

// ── BÀN LÀM VIỆC — nạp khung dòng họ (FR-51 + FR-48) ───────────────────────────
//
// Đây là dữ liệu của bề mặt B: các DÒNG trong file CSV Hiệp điền tay ngoài hệ thống, ở khoảnh
// khắc TRƯỚC khi được ghi vào phả. Chúng chưa phải `Nguoi` — một dòng CSV chỉ trở thành người
// khi có người bấm ghi. Trộn hai thứ vào một kiểu là mất đúng ranh giới mà cả màn xem trước
// sinh ra để giữ.

/** Trạng thái so khớp của một dòng — ba trạng thái, đúng EXPERIENCE.md § Component Patterns. */
export type TrangThaiDong = 'nguoi-moi' | 'khop' | 'nghi-trung';

/**
 * Ghi chú của bot về một dòng. **Gợi ý, không tự gộp** (FR-48) — nên đây là dữ liệu để BÀY RA,
 * không phải quyết định đã lấy. Không trường nào nói "đã chọn".
 */
export type CanhBao =
  | {
      loai: 'nghi-trung';
      /** Ứng viên đã CÓ TRONG PHẢ. */
      ungVienIds: string[];
      /** Ứng viên là DÒNG KHÁC trong chính file này (theo `stt`) — ca của file điền tay. */
      ungVienDong: number[];
    }
  | {
      loai: 'loi-so-khop';
      /** Tên cha ghi trong dòng nhưng không tìm thấy ở đâu — cả trong file lẫn trong phả. */
      tenChaKhongThay: string;
    };

/** Một dòng trong file khung. Cột nào chưa biết thì để trống — gieo mồi luôn thiếu. */
export type DongKhung = {
  stt: number;
  hoTen: string;
  gioiTinh: 'nam' | 'nu';
  namSinh?: number;
  namMat?: number;
  tenCha?: string;
  /** Người kết hôn vào họ không có cha trong phả; cột này mới là cột nối họ vào cây. */
  voChongCua?: string;
  nguon: string;
  trangThai: TrangThaiDong;
  /** Người đã có trong phả mà dòng này khớp — chỉ có nghĩa khi `trangThai === 'khop'`. */
  khopVoiId?: string;
  /** Độc lập với `trangThai`: một dòng *người mới* vẫn có thể mang lỗi so khớp. */
  canhBao?: CanhBao;
};

export const TEN_FILE_KHUNG = 'khung-ho-nguyen-quang.csv';

/**
 * NGÀY 0 — file khung đầu tiên, hệ thống còn trống.
 *
 * Vì trống nên **không dòng nào khớp người có sẵn** — đó là sự thật của ngày 0, không phải thiếu
 * sót của mock. Nhưng hai loại cảnh báo thì có ngay từ ngày đầu:
 *   · dòng 2 và 3 nghi là cùng một cụ, do hai người kể khác nhau ghi vào cùng một file;
 *   · dòng 8 khai cha là cụ Đường, mà cả file lẫn phả đều không có ai tên Đường — cụ bị quên.
 * Đây chính là lý do FR-48 tồn tại, và cả hai ca đều lộ ra TRƯỚC khi ghi vào phả.
 */
export const DONG_KHUNG: DongKhung[] = [
  {
    stt: 1,
    hoTen: 'Nguyễn Quang Thản',
    gioiTinh: 'nam',
    namMat: 1901,
    nguon: 'Bia nhà thờ họ — ảnh chụp 03/2026',
    trangThai: 'nguoi-moi',
  },
  {
    stt: 2,
    hoTen: 'Nguyễn Quang Đệ',
    gioiTinh: 'nam',
    namSinh: 1888,
    namMat: 1954,
    tenCha: 'Nguyễn Quang Thản',
    nguon: 'Bia nhà thờ họ — ảnh chụp 03/2026',
    trangThai: 'nghi-trung',
    canhBao: { loai: 'nghi-trung', ungVienIds: [], ungVienDong: [3] },
  },
  {
    stt: 3,
    hoTen: 'Nguyễn Quang Đệ',
    gioiTinh: 'nam',
    namMat: 1954,
    nguon: 'Lời kể — bà Nguyễn Thị Lành, 04/2026',
    trangThai: 'nghi-trung',
    canhBao: { loai: 'nghi-trung', ungVienIds: [], ungVienDong: [2] },
  },
  {
    stt: 4,
    hoTen: 'Trần Thị Vẽ',
    gioiTinh: 'nu',
    namMat: 1961,
    voChongCua: 'Nguyễn Quang Đệ',
    nguon: 'Lời kể — bà Nguyễn Thị Lành, 04/2026',
    trangThai: 'nguoi-moi',
  },
  {
    stt: 5,
    hoTen: 'Nguyễn Quang Bảng',
    gioiTinh: 'nam',
    namSinh: 1921,
    namMat: 1998,
    tenCha: 'Nguyễn Quang Đệ',
    nguon: 'Bia mộ — ảnh chụp 03/2026',
    trangThai: 'nguoi-moi',
  },
  {
    stt: 6,
    hoTen: 'Nguyễn Quang Đoài',
    gioiTinh: 'nam',
    namMat: 1949,
    tenCha: 'Nguyễn Quang Thản',
    nguon: 'Bia nhà thờ họ — ảnh chụp 03/2026',
    trangThai: 'nguoi-moi',
  },
  {
    stt: 7,
    hoTen: 'Nguyễn Quang Cẩn',
    gioiTinh: 'nam',
    namSinh: 1925,
    namMat: 2001,
    tenCha: 'Nguyễn Quang Đoài',
    nguon: 'Lời kể — cụ Nguyễn Quang Hoạch, 05/2026',
    trangThai: 'nguoi-moi',
  },
  {
    stt: 8,
    hoTen: 'Nguyễn Quang Lộc',
    gioiTinh: 'nam',
    namSinh: 1930,
    namMat: 1988,
    tenCha: 'Nguyễn Quang Đường',
    nguon: 'Lời kể — cụ Nguyễn Quang Hoạch, 05/2026',
    trangThai: 'nguoi-moi',
    canhBao: { loai: 'loi-so-khop', tenChaKhongThay: 'Nguyễn Quang Đường' },
  },
];

export const TEN_FILE_DOT_SAU = 'khung-chi-trong-nam.csv';

/**
 * ĐỢT NẠP SAU — khi trong phả đã có người, trạng thái *khớp người có sẵn* mới xuất hiện.
 *
 * Dòng 2 là ca FR-48 khó nhất mà seed đã dựng sẵn từ đầu: một cụ tên Đệ, mất 1954, đang có
 * **hai** bản trong phả — `n-002` ở mảnh chính và `n-101` ở mảnh chi trong Nam. Bot bày cả hai
 * ứng viên ra; không ứng viên nào được chọn sẵn, vì gộp nhầm hai cụ là hỏng phả của cả một chi.
 */
export const DONG_KHUNG_DOT_SAU: DongKhung[] = [
  {
    stt: 1,
    hoTen: 'Nguyễn Quang Hoạch',
    gioiTinh: 'nam',
    namSinh: 1949,
    tenCha: 'Nguyễn Quang Bảng',
    nguon: 'Tự khai — Nguyễn Quang Trọng, 06/2026',
    trangThai: 'khop',
    khopVoiId: 'n-005',
  },
  {
    stt: 2,
    hoTen: 'Nguyễn Quang Đệ',
    gioiTinh: 'nam',
    namMat: 1954,
    nguon: 'Tự khai — Nguyễn Quang Trọng, 06/2026',
    trangThai: 'nghi-trung',
    canhBao: { loai: 'nghi-trung', ungVienIds: ['n-002', 'n-101'], ungVienDong: [] },
  },
  {
    stt: 3,
    hoTen: 'Nguyễn Quang Thuyết',
    gioiTinh: 'nam',
    namSinh: 1930,
    namMat: 2009,
    tenCha: 'Nguyễn Quang Đệ',
    nguon: 'Tự khai — Nguyễn Quang Trọng, 06/2026',
    trangThai: 'khop',
    khopVoiId: 'n-102',
  },
  {
    stt: 4,
    hoTen: 'Nguyễn Quang Trọng',
    gioiTinh: 'nam',
    namSinh: 1966,
    tenCha: 'Nguyễn Quang Thuyết',
    nguon: 'Tự khai — Nguyễn Quang Trọng, 06/2026',
    trangThai: 'khop',
    khopVoiId: 'n-103',
  },
];

/** Đếm theo trạng thái — số trên chip bộ lọc. Đếm tại chỗ, không chép tay. */
export function demTrangThai(dong: DongKhung[], tt: TrangThaiDong): number {
  return dong.filter((d) => d.trangThai === tt).length;
}

/**
 * Số dòng CẦN XEM LẠI — thứ chip bộ lọc cuối đếm, và là thứ thay cho "màn bảng cảnh báo".
 *
 * Đếm theo `canhBao` chứ không theo `trangThai`: một dòng *người mới* mang lỗi so khớp vẫn phải
 * được người vận hành nhìn tới. Đếm theo trạng thái sẽ bỏ sót đúng dòng 8.
 */
export function demCanXemLai(dong: DongKhung[]): number {
  return dong.filter((d) => d.canhBao).length;
}

// ── Nhật ký sửa (FR-39) ─────────────────────────────────────────────────────
//
// FR-39 là mỏ neo của HAI thứ tưởng rời nhau: ô "Vừa vào phả" ở màn chủ, và dòng ghi công dưới
// mỗi node. Cả hai đều là LÁT CẮT của cùng một nhật ký — nên nhật ký phải có thật ở seed, không
// thì hai màn kia đang vẽ một thứ không tồn tại ở tầng dữ liệu.

export type MucNhatKy = {
  id: string;
  veNguoiId: string;
  /** Câu kể việc đã xảy ra, không phải tên thao tác. Bề mặt A cấm từ kỹ thuật. */
  viec: string;
  nguoiLam: string;
  khi: string;
};

export const NHAT_KY: MucNhatKy[] = [
  { id: 'nk-001', veNguoiId: 'n-009', viec: 'Thêm vào phả', nguoiLam: 'cháu Khánh', khi: 'hôm nay' },
  {
    id: 'nk-002',
    veNguoiId: 'n-009',
    viec: 'Ghi năm sinh 1975',
    nguoiLam: 'cháu Khánh',
    khi: 'hôm nay',
  },
  {
    id: 'nk-003',
    veNguoiId: 'n-009',
    viec: 'Nối vào cụ Hoạch làm con',
    nguoiLam: 'cháu Khánh',
    khi: 'hôm nay',
  },
  {
    id: 'nk-004',
    veNguoiId: 'n-011',
    viec: 'Nạp từ khung nhập tay',
    nguoiLam: 'Nguyễn Quang Hiệp',
    khi: '02/2026',
  },
  {
    id: 'nk-005',
    veNguoiId: 'n-011',
    viec: 'Nối vào cụ Hùng làm con',
    nguoiLam: 'cháu Khánh',
    khi: 'hôm nay',
  },
];

/** Nhật ký của một người, mới nhất trước. */
export function nhatKyVe(nguoiId: string): MucNhatKy[] {
  return NHAT_KY.filter((m) => m.veNguoiId === nguoiId);
}

// ── Lời kể (FR-47 + FR-49) ──────────────────────────────────────────────────

/** Bản thu có nhắc tới người này — trang một người bày ra để lời kể không nằm chết một chỗ. */
export function loiKeVe(nguoiId: string): LoiKe[] {
  return LOI_KE.filter((l) => l.noiVe.includes(nguoiId) || l.nguoiKeId === nguoiId);
}

/** Giây → "6 phút 12 giây". Không dùng dạng `06:12` — dấu hai chấm là ngôn ngữ của máy. */
export function doDai(giay: number): string {
  const phut = Math.floor(giay / 60);
  const du = giay % 60;
  return du ? `${phut} phút ${du} giây` : `${phut} phút`;
}

/** Nhãn ba mức đồng thuận (FR-49) — chính người kể chọn, không ai chọn hộ. */
export const NHAN_TIEP_CAN: Record<LoiKe['tiepCan'], string> = {
  'cong-khai': 'Cả họ nghe được',
  'chi-quan-tri': 'Chỉ ban tu phả nghe',
  'niem-phong': 'Niêm phong',
};

// ── Hàng chờ duyệt lên Tầng chính thức (FR-3) ───────────────────────────────
//
// DẪN XUẤT, không phải một bảng riêng: hàng chờ CHÍNH LÀ Tầng tồn nghi, nhìn từ phía người có vai
// duyệt. Lưu thành danh sách riêng là mở đường cho hai con số lệch nhau — bảng nói 9, cây nói 11.

export type MucHangCho = {
  nguoi: Nguoi;
  /** Khẳng định làm chỗ dựa để duyệt — người duyệt cần thấy NGUỒN, không chỉ thấy tên. */
  khangDinh: KhangDinh[];
  /** Có bản thu nào nhắc tới người này không — chứng cứ mạnh hơn một dòng tự khai. */
  soLoiKe: number;
};

export function hangChoDuyet(): MucHangCho[] {
  return NGUOI.filter((n) => n.tang === 'ton-nghi').map((nguoi) => ({
    nguoi,
    khangDinh: khangDinhVe(nguoi.id),
    soLoiKe: loiKeVe(nguoi.id).length,
  }));
}

// ── Hợp nhất mảnh (FR-48) ───────────────────────────────────────────────────
//
// Ca thật của seed: cụ Đệ đang có HAI bản — `n-002` ở mảnh chính, `n-101` ở mảnh chi trong Nam.
// Nối đúng thì hai mảnh thành một cây; nối sai thì hỏng phả của cả một chi. Đây là lý do màn hợp
// nhất tồn tại, và là lý do KHÔNG cái nào được chọn sẵn.

export type UngVienNoi = {
  id: string;
  /** Hai người nghi là một. Thứ tự không mang nghĩa — không bên nào là "bản đúng". */
  aId: string;
  bId: string;
  /** Điều bot thấy giống nhau. Bày ra để người quyết, không phải để máy quyết. */
  giongNhau: string[];
  /** Điều bot thấy KHÁC nhau — bắt buộc phải bày, nếu không đây là màn dụ người bấm gộp. */
  khacNhau: string[];
  /** Nối hai mảnh này lại thì bao nhiêu người về cùng một cây. */
  soNguoiAnhHuong: number;
};

export const UNG_VIEN_NOI: UngVienNoi[] = [
  {
    id: 'un-001',
    aId: 'n-002',
    bId: 'n-101',
    giongNhau: ['Cùng tên: Nguyễn Quang Đệ', 'Cùng năm mất: 1954', 'Đều là gốc tạm một mảnh'],
    khacNhau: [
      'Mảnh chính ghi sinh 1888; chi trong Nam không ghi năm sinh',
      'Mảnh chính ghi có vợ là Trần Thị Vẽ; chi trong Nam không nhắc',
      'Con ghi khác nhau: một bên là cụ Bảng, một bên là cụ Thuyết',
    ],
    soNguoiAnhHuong: 4,
  },
  {
    // Ca thứ hai cố ý KHÔNG phải một người — để màn phải bày được cả câu trả lời "hai người khác
    // nhau", chứ không chỉ bày đường gộp. Trùng tên trong một dòng họ là chuyện thường.
    id: 'un-002',
    aId: 'n-009',
    bId: 'n-013',
    giongNhau: ['Cùng tên: Nguyễn Quang Hùng'],
    khacNhau: [
      'Sinh 1975 và sinh 1958 — cách nhau 17 năm',
      'Cha khác nhau: cụ Hoạch và cụ Thuyết',
      'Ở hai mảnh khác nhau',
    ],
    soNguoiAnhHuong: 0,
  },
];

// ── Quyền của người sống (FR-55) ────────────────────────────────────────────

/**
 * Thông báo LƯU SẴN TRÊN NODE, chỉ hiện ra lần đầu người đó gắn được vào chỗ của mình
 * (EXPERIENCE.md § Vừa được thêm bởi người khác).
 *
 * ⚠️ Giới hạn đã chấp nhận, phải mang theo: cơ chế này là **kéo**. Người không bao giờ mở web thì
 * không bao giờ biết mình đã bị đưa vào phả — mà đó chính là nhóm cao niên FR-55 sinh ra để bảo
 * vệ. Đừng để màn nào ngầm nói rằng FR-55 đã xong.
 */
export type ThongBaoNode = {
  veNguoiId: string;
  nguoiThem: string;
  khi: string;
  /**
   * Những gì người khác đã ghi về mình — kể ra HẾT, kèm ai ghi. Tóm tắt là giấu bớt, mà đây đúng
   * là màn không được phép giấu: người sống chỉ quyết được về thứ họ nhìn thấy.
   */
  daGhi: { menhDe: string; boi: string; khi: string }[];
};

export const THONG_BAO_NODE: ThongBaoNode[] = [
  {
    veNguoiId: 'n-011',
    nguoiThem: 'Ban tu phả',
    khi: '02/2026',
    daGhi: [
      { menhDe: 'Tên: Nguyễn Quang Khoa', boi: 'Ban tu phả', khi: '02/2026' },
      { menhDe: 'Sinh 2001', boi: 'Ban tu phả', khi: '02/2026' },
      { menhDe: 'Là con của Nguyễn Quang Hùng', boi: 'em trai Khánh', khi: 'hôm nay' },
    ],
  },
];

// ── Xin vào phả (FR-64) ─────────────────────────────────────────────────────
//
// Người đã có TÀI KHOẢN nhưng chưa GẮN NODE. Hai lớp tách rời (PRD §5, FR-64): tài khoản chứng
// minh sở hữu email; gắn node chứng minh *là người này trong dòng họ*, và việc ấy cần người
// trong họ bảo lãnh hoặc quản trị xác nhận.
//
// ⚠️ Trên production luồng này ĐANG ĐỨT: `listPendingAttachments`/`approveAttachment` có trong
// core nhưng không màn nào gọi, nên người xin nằm `pending` vĩnh viễn. Đây là lý do story 5-5
// tồn tại — và lý do mock này có mặt trong xưởng trước khi có màn thật.

export type XinVaoPha = {
  id: string;
  hoTen: string;
  taiKhoan: string;
  /** Người này nhận mình là ai TRONG PHẢ — câu tự khai, chưa phải sự thật. */
  nhanLaGi: string;
  /** Node họ nhận là chỗ của mình — canvas vẽ node MỜ cạnh đúng chỗ này. */
  canhNguoiId: string;
  xinNgay: string;
  /** Ai trong họ bảo lãnh; `null` = chưa ai, quản trị phải tự đối chiếu. */
  baoLanh: string | null;
};

export const XIN_VAO_PHA: XinVaoPha[] = [
  {
    id: 'x-001',
    hoTen: 'Nguyễn Thị Bích',
    taiKhoan: 'bich.nt',
    nhanLaGi: 'con gái cụ Nguyễn Quang Hoạch',
    canhNguoiId: 'n-005',
    xinNgay: '21/08/2026',
    baoLanh: 'Nguyễn Quang Hiệp',
  },
  {
    // Không ai bảo lãnh — ca khó, và là ca phải bày được. Duyệt vội ở đây là gắn người lạ vào phả.
    id: 'x-002',
    hoTen: 'Nguyễn Quang Tân',
    taiKhoan: 'tan.nq',
    nhanLaGi: 'cháu nội cụ Nguyễn Quang Đường',
    canhNguoiId: 'n-031',
    xinNgay: '23/08/2026',
    baoLanh: null,
  },
];

// ── Nơi chốn (FR-65) ────────────────────────────────────────────────────────
//
// Tên xã phường ở Việt Nam TRÙNG NHAU hàng loạt, nên nơi không thể là chữ tự do: phải là thực
// thể mang tên + ĐƠN VỊ CHA. Dòng họ này ở nhiều nơi — Quang Trung (Định Hoá) và Quang Trung
// (Vũng Tàu) là hai chỗ khác hẳn, cùng một cái tên.

export type Noi = {
  id: string;
  ten: string;
  /** Đơn vị hành chính cha — thứ DUY NHẤT phân biệt được hai cái "Quang Trung". */
  thuoc: string;
  /** Bao nhiêu người trong phả gắn với nơi này — tín hiệu để chấm điểm khi gõ tự do. */
  soNguoi: number;
};

export const NOI: Noi[] = [
  { id: 'noi-qt-dh', ten: 'Quang Trung', thuoc: 'Định Hoá, Thái Nguyên', soNguoi: 37 },
  { id: 'noi-qt-vt', ten: 'Quang Trung', thuoc: 'Vũng Tàu', soNguoi: 5 },
  { id: 'noi-qt-hd', ten: 'Quang Trung', thuoc: 'Hà Đông, Hà Nội', soNguoi: 0 },
  { id: 'noi-phu-dinh', ten: 'Phú Đình', thuoc: 'Định Hoá, Thái Nguyên', soNguoi: 12 },
];

/** Nơi gắn với một người, xếp theo thời gian — chồng NỐI TIẾP, không phải chồng mâu thuẫn. */
export type NoiCuaNguoi = {
  noiId: string;
  vai: 'que-quan' | 'tru-quan';
  /** Câu mô tả mốc thời gian; để trống khi phả không chép mốc nào. */
  moc?: string;
};

export const NOI_CUA_NGUOI: Record<string, NoiCuaNguoi[]> = {
  'n-009': [
    { noiId: 'noi-qt-dh', vai: 'que-quan' },
    { noiId: 'noi-qt-dh', vai: 'tru-quan', moc: 'đến 1994' },
    { noiId: 'noi-qt-vt', vai: 'tru-quan', moc: 'từ 1994' },
  ],
};

export const NHAN_VAI_NOI: Record<NoiCuaNguoi['vai'], string> = {
  'que-quan': 'Quê quán',
  'tru-quan': 'Trú quán',
};

export function noiTheoId(id: string): Noi | undefined {
  return NOI.find((n) => n.id === id);
}
