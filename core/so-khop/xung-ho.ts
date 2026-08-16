/**
 * XƯNG HÔ VIỆT → VỊ TRÍ CẤU TRÚC
 *
 * Từ xưng hô tiếng Việt mã hoá sẵn ba thứ mà tên gọi không mang: **đời**, **bên nội hay ngoại**,
 * và **thứ bậc sinh** so với bố mẹ. Đó là tín hiệu định vị mạnh nhất người khai đưa ra mà không
 * cần biết mình đang đưa — họ chỉ nói "chú tôi", nhưng câu ấy đã nói rằng người kia là em trai
 * của bố, cùng đời với bố, sinh sau bố, và mang huyết thống họ này.
 *
 * Bảng này là **hằng số ngôn ngữ**, không phải dữ liệu của một dòng họ cụ thể (AD-14). Thứ thuộc
 * về dòng họ là *hệ thống dòng tộc* — phụ hệ hay mẫu hệ — nên nó là tham số, không phải hằng số.
 *
 * Nguồn của phần "ai được chép vào phả": PRD §4 — chính phả chép người mang huyết thống **và vợ
 * của họ**; con cháu của rể thuộc họ khác (ARCHITECTURE-SPINE § UNION).
 */

import { chuanHoa } from './chuan-hoa';

/** Hệ thống dòng tộc. Quyết định bên nào là bên "trong họ". */
export type HeThongDongToc = 'phu-he' | 'mau-he';

/**
 * Vị trí của một người so với cuốn phả đang xét.
 *
 * Phân biệt `ngoai-ho` với `ngoai-pha` là phân biệt load-bearing: `ngoai-pha` (rể) vẫn có mặt
 * trong phả, chỉ là con cháu mang họ khác; `ngoai-ho` thì **không có mặt** — so khớp một người
 * `ngoai-ho` vào cây là sai từ gốc, không phải khớp kém.
 */
export type ViTriTrongPha = 'chinh-pha' | 'ngoai-pha' | 'ngoai-ho';

/** Từ xưng hô người khai dùng. Chỉ những từ định vị được — "bạn", "hàng xóm" không nằm đây. */
export type QuanHe =
  | 'bo' | 'me'
  | 'ong-noi' | 'ba-noi' | 'ong-ngoai' | 'ba-ngoai'
  | 'cu-ong' | 'cu-ba'
  | 'bac' | 'chu' | 'co' | 'cau' | 'di'
  | 'thim' | 'mo' | 'duong'
  | 'anh' | 'chi' | 'em'
  | 'con' | 'chau' | 'chat';

export type ThongTinXungHo = {
  /** Đời lệch so với người khai. Âm là bề trên: bố = -1, ông = -2, cụ = -3. */
  doiLech: number;
  /** Bên nội (họ cha) hay bên ngoại (họ mẹ). `khong-ro` = từ này mơ hồ theo vùng miền. */
  ben: 'noi' | 'ngoai' | 'khong-ro';
  /** Giới tính từ xưng hô ép ra. Thiếu = từ này không ép giới tính. */
  gioiTinh?: 'nam' | 'nu';
  /** Mang huyết thống dòng họ, hay kết hôn vào. */
  huyetThong: boolean;
  /** Thứ bậc sinh so với bố/mẹ người khai — chỉ có với anh chị em của bố mẹ. */
  thuBac?: 'tren' | 'duoi';
  /**
   * Từ này mơ hồ ở chỗ nào. **Có giá trị thì phải bày ra cho người khai**, không được tự chọn một
   * nghĩa: đoán sai một từ xưng hô là đặt người ta nhầm cả một nhánh.
   */
  mapHo?: string;
};

/**
 * Bảng xưng hô. Nghĩa lấy theo lối Bắc Bộ — nơi `bác` là anh/chị của bố mẹ và `chú`/`cô`/`dì` là
 * em. Lối Nam Bộ dùng `bác`/`chú` hẹp hơn; chỗ nào lệch thì `mapHo` nói ra thay vì im lặng chọn.
 */
const BANG: Record<QuanHe, ThongTinXungHo> = {
  bo: { doiLech: -1, ben: 'noi', gioiTinh: 'nam', huyetThong: true },
  me: { doiLech: -1, ben: 'noi', gioiTinh: 'nu', huyetThong: false },

  'ong-noi': { doiLech: -2, ben: 'noi', gioiTinh: 'nam', huyetThong: true },
  'ba-noi': { doiLech: -2, ben: 'noi', gioiTinh: 'nu', huyetThong: false },
  'ong-ngoai': { doiLech: -2, ben: 'ngoai', gioiTinh: 'nam', huyetThong: true },
  'ba-ngoai': { doiLech: -2, ben: 'ngoai', gioiTinh: 'nu', huyetThong: false },

  'cu-ong': { doiLech: -3, ben: 'khong-ro', gioiTinh: 'nam', huyetThong: true,
    mapHo: '“Cụ” không nói rõ bên nội hay bên ngoại — hỏi thêm hoặc so khớp cả hai bên.' },
  'cu-ba': { doiLech: -3, ben: 'khong-ro', gioiTinh: 'nu', huyetThong: false,
    mapHo: '“Cụ” không nói rõ bên nội hay bên ngoại — hỏi thêm hoặc so khớp cả hai bên.' },

  bac: { doiLech: -1, ben: 'khong-ro', huyetThong: true, thuBac: 'tren',
    mapHo: '“Bác” là anh/chị của bố HOẶC của mẹ — bên nội thì trong họ, bên ngoại thì không. Phải hỏi.' },
  chu: { doiLech: -1, ben: 'noi', gioiTinh: 'nam', huyetThong: true, thuBac: 'duoi' },
  co: { doiLech: -1, ben: 'noi', gioiTinh: 'nu', huyetThong: true, thuBac: 'duoi',
    mapHo: 'Lối Bắc “cô” là em gái bố; vài vùng gọi cả chị gái bố là cô — thứ bậc sinh có thể ngược.' },
  cau: { doiLech: -1, ben: 'ngoai', gioiTinh: 'nam', huyetThong: true },
  di: { doiLech: -1, ben: 'ngoai', gioiTinh: 'nu', huyetThong: true },

  thim: { doiLech: -1, ben: 'noi', gioiTinh: 'nu', huyetThong: false, thuBac: 'duoi' },
  mo: { doiLech: -1, ben: 'ngoai', gioiTinh: 'nu', huyetThong: false },
  duong: { doiLech: -1, ben: 'khong-ro', gioiTinh: 'nam', huyetThong: false,
    mapHo: '“Dượng” là chồng của cô (bên nội) hoặc của dì (bên ngoại) — hai vị trí khác hẳn nhau.' },

  anh: { doiLech: 0, ben: 'noi', gioiTinh: 'nam', huyetThong: true, thuBac: 'tren' },
  chi: { doiLech: 0, ben: 'noi', gioiTinh: 'nu', huyetThong: true, thuBac: 'tren' },
  em: { doiLech: 0, ben: 'noi', huyetThong: true, thuBac: 'duoi' },

  con: { doiLech: 1, ben: 'noi', huyetThong: true },
  chau: { doiLech: 2, ben: 'noi', huyetThong: true,
    mapHo: '“Cháu” vừa là con của con (đời +2), vừa là con của anh chị em (đời +1) — hai đời khác nhau.' },
  chat: { doiLech: 3, ben: 'noi', huyetThong: true },
};

/**
 * Nhãn tiếng Việt của từng quan hệ — dạng để **hiện lên màn**.
 *
 * Khoá của `QuanHe` là mã máy (`'cu-ong'`, `'ong-noi'`): không dấu, gạch nối, để an toàn khi đi
 * qua URL và JSON. Nhét thẳng mã ấy vào một câu tiếng Việt thì ra *“cu-ong là người bên nội”* —
 * nên mọi chỗ sinh câu cho người đọc phải đi qua bảng này.
 */
const NHAN: Record<QuanHe, string> = {
  bo: 'bố', me: 'mẹ',
  'ong-noi': 'ông nội', 'ba-noi': 'bà nội',
  'ong-ngoai': 'ông ngoại', 'ba-ngoai': 'bà ngoại',
  'cu-ong': 'cụ ông', 'cu-ba': 'cụ bà',
  bac: 'bác', chu: 'chú', co: 'cô', cau: 'cậu', di: 'dì',
  thim: 'thím', mo: 'mợ', duong: 'dượng',
  anh: 'anh', chi: 'chị', em: 'em',
  con: 'con', chau: 'cháu', chat: 'chắt',
};

/** Nhãn tiếng Việt để hiện lên màn. Dùng cái này, đừng dùng khoá `QuanHe`. */
export function nhan(quanHe: QuanHe): string {
  return NHAN[quanHe];
}

/**
 * Bảng tra từ chữ người khai gõ về `QuanHe` — **CÒN NGUYÊN DẤU**.
 *
 * `AD-16` bắt bỏ dấu khi so **tên người**, và luật ấy đúng cho tên. Nhưng với **từ xưng hô** thì
 * bỏ dấu là phá: dấu chính là chỗ mang nghĩa.
 *
 *   · `cô` (em gái bố, đời −1) và `cố` (cụ, đời −3) — bỏ dấu đều thành `co`, lệch nhau **hai đời**
 *   · `bà` và `ba` (tiếng Nam gọi bố) — bỏ dấu đều thành `ba`, một bên là bà, một bên là bố
 *
 * Nên: khớp có dấu trước. Chỉ khi chữ gõ vào không có dấu mới thử khớp bỏ dấu, và **chỉ chấp
 * nhận khi dạng bỏ dấu ấy trỏ về đúng một nghĩa** (xem `KHONG_DAU` bên dưới). Còn lại trả `null`
 * để người gọi hỏi lại — đoán một từ xưng hô sai là đặt người ta nhầm hẳn một nhánh.
 */
const BI_DANH: Record<string, QuanHe> = {
  'bố': 'bo', 'ba': 'bo', 'cha': 'bo', 'thầy': 'bo', 'tía': 'bo',
  'mẹ': 'me', 'má': 'me', 'bu': 'me', 'u': 'me',
  'ông nội': 'ong-noi', 'bà nội': 'ba-noi',
  'ông ngoại': 'ong-ngoai', 'bà ngoại': 'ba-ngoai',
  'cụ': 'cu-ong', 'cụ ông': 'cu-ong', 'cụ bà': 'cu-ba', 'cố': 'cu-ong',
  'bác': 'bac', 'chú': 'chu', 'cô': 'co', 'cậu': 'cau', 'dì': 'di',
  'thím': 'thim', 'mợ': 'mo', 'dượng': 'duong',
  'anh': 'anh', 'chị': 'chi', 'em': 'em',
  'anh trai': 'anh', 'chị gái': 'chi', 'em trai': 'em', 'em gái': 'em',
  'con': 'con', 'cháu': 'chau', 'chắt': 'chat',
};

/**
 * Chỉ mục bỏ dấu, **đã loại mọi dạng đụng nhau**.
 *
 * Dựng tại lúc nạp mô-đun thay vì viết tay: viết tay thì thêm một bí danh mới là lặng lẽ mở lại
 * đúng cái bẫy `cô`/`cố`, mà không có gì báo.
 */
const KHONG_DAU: Record<string, QuanHe | null> = (() => {
  const idx: Record<string, QuanHe | null> = {};
  for (const [chu, q] of Object.entries(BI_DANH)) {
    const k = chuanHoa(chu);
    if (k in idx && idx[k] !== q) idx[k] = null; // đụng nghĩa → không nhận
    else if (!(k in idx)) idx[k] = q;
  }
  return idx;
})();

/** Tra thông tin cấu trúc của một từ xưng hô. */
export function tra(quanHe: QuanHe): ThongTinXungHo {
  return BANG[quanHe];
}

/**
 * Nhận diện từ xưng hô từ chữ người khai gõ. Trả `null` khi không nhận ra hoặc khi chữ không dấu
 * còn đụng nghĩa — **không đoán bừa**; người gọi bày lại danh sách cho người khai chọn.
 */
export function nhanDien(chu: string): QuanHe | null {
  const thuong = chu.toLowerCase().trim().replace(/\s+/g, ' ');
  if (thuong in BI_DANH) return BI_DANH[thuong];
  return KHONG_DAU[chuanHoa(thuong)] ?? null;
}

/**
 * Người mang từ xưng hô này có mặt trong phả không, và ở tư cách gì.
 *
 * Đây là **cửa chặn rẻ nhất của cả bộ so khớp**: `ngoai-ho` nghĩa là người ấy thuộc họ khác, nên
 * mọi ứng viên tìm được trong cây này đều là trùng tên ngẫu nhiên. Trả về sớm ở đây tiết kiệm cả
 * một vòng chấm điểm, và quan trọng hơn — nó chặn một câu trả lời sai trông như đúng.
 */
export function viTriTrongPha(quanHe: QuanHe, heThong: HeThongDongToc = 'phu-he'): ViTriTrongPha {
  const t = BANG[quanHe];
  const benNgoaiHo = heThong === 'phu-he' ? 'ngoai' : 'noi';

  if (t.ben === benNgoaiHo) return 'ngoai-ho';
  // Bên mơ hồ ("bác", "cụ", "dượng") có thể rơi vào một trong hai — không loại, để người xác nhận.
  if (t.ben === 'khong-ro') return t.huyetThong ? 'chinh-pha' : 'ngoai-pha';
  return t.huyetThong || quanHe === 'me' || quanHe === 'ba-noi' || quanHe === 'thim'
    ? 'chinh-pha'
    : 'ngoai-pha';
}

/**
 * Khoảng cách năm sinh hợp lý giữa người khai và người mang quan hệ này.
 *
 * Một đời ở Việt Nam thế kỷ 20 rơi vào khoảng 20–35 năm; biên nới rộng vì tảo hôn và sinh muộn
 * đều có thật. Dùng để **loại ứng viên bất khả**, không dùng để chấm điểm cao thấp — sinh cách
 * đúng 25 năm không làm ai đúng hơn ai.
 */
export function bienNamSinh(doiLech: number): { toiThieu: number; toiDa: number } {
  const moiDoi = { toiThieu: 15, toiDa: 45 };
  const n = Math.abs(doiLech);
  if (n === 0) return { toiThieu: -30, toiDa: 30 };
  const bien = { toiThieu: moiDoi.toiThieu * n, toiDa: moiDoi.toiDa * n };
  // doiLech âm = bề trên = sinh TRƯỚC người khai.
  return doiLech < 0
    ? { toiThieu: bien.toiThieu, toiDa: bien.toiDa }
    : { toiThieu: -bien.toiDa, toiDa: -bien.toiThieu };
}
