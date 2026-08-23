/**
 * LUỒNG THÊM — trạng thái đi giữa các bước và phép NỐI vào phả.
 *
 * Trạng thái nằm trong URL searchParams (serializable, nút lui của trình duyệt đúng nghĩa
 * — mỗi bước một địa chỉ, lui là về đúng màn trước với đúng dữ liệu đã khai). Không context,
 * không store: một luồng bốn màn không cần bộ nhớ nào ngoài địa chỉ trang.
 *
 * File này THUẦN — không import core index (core gọi ở page/action), để phép nối kiểm được
 * bằng mắt và bằng test mà không cần session.
 */
import type { NewPersonInput, SourceSpec } from '@/core/assertion';

/** Bước 1 chọn gì — người muốn thêm là ai. `minh` = nhánh tự khai (FR-11). */
export const QUAN_HE = ['minh', 'bo', 'me', 'vo-chong', 'con', 'anh-chi-em'] as const;
export type QuanHe = (typeof QUAN_HE)[number];

/** Nhánh tự khai, bước 3: NGƯỜI THÂN GẦN NHẤT (mốc) là gì CỦA MÌNH. */
export const CACH_NOI = ['bo-me', 'con', 'vo-chong'] as const;
export type CachNoi = (typeof CACH_NOI)[number];

export const GIOI_TINH = ['nam', 'nu', 'khac'] as const;
export type GioiTinh = (typeof GIOI_TINH)[number];

export type TrangThai = {
  qh: QuanHe;
  /** Tên đầy đủ (bước 2). */
  ten?: string;
  /** Năm sinh — CHỈ năm, không ngày tháng (mặc định riêng tư với người còn sống, FR-37). */
  ns?: string;
  gt?: GioiTinh;
  /** Người có sẵn trên phả mà người mới nối vào (bước 3). Với anh/chị/em: đây là BỐ/MẸ chung. */
  moc?: string;
  /** Tên của mốc — chỉ để hiển thị câu tóm tắt; phép ghi dùng id, core tự kiểm. */
  tenMoc?: string;
  /** Chỉ nhánh tự khai. */
  ct?: CachNoi;
};

type ThamSo = Record<string, string | string[] | undefined>;

const mot = (v: string | string[] | undefined): string | undefined => {
  const s = Array.isArray(v) ? v[0] : v;
  return s ? s : undefined;
};

const trong = <T extends string>(bang: readonly T[], v: string | undefined): T | undefined =>
  bang.includes(v as T) ? (v as T) : undefined;

/** Đọc trạng thái từ searchParams. Thiếu/quan hệ lạ → null, màn gọi tự đưa về /them. */
export function docTrangThai(sp: ThamSo): TrangThai | null {
  const qh = trong(QUAN_HE, mot(sp.qh));
  if (!qh) return null;
  const ns = mot(sp.ns);
  return {
    qh,
    ten: mot(sp.ten)?.trim() || undefined,
    ns: ns && /^\d{4}$/.test(ns) ? ns : undefined,
    gt: trong(GIOI_TINH, mot(sp.gt)),
    moc: mot(sp.moc),
    tenMoc: mot(sp.tenMoc),
    ct: trong(CACH_NOI, mot(sp.ct)),
  };
}

/** Cùng phép đọc, từ FormData của màn xác nhận. */
export function trangThaiTuForm(fd: FormData): TrangThai | null {
  const doc = (k: string) => {
    const v = fd.get(k);
    return typeof v === 'string' && v ? v : undefined;
  };
  return docTrangThai({
    qh: doc('qh'),
    ten: doc('ten'),
    ns: doc('ns'),
    gt: doc('gt'),
    moc: doc('moc'),
    tenMoc: doc('tenMoc'),
    ct: doc('ct'),
  });
}

export type BuocDuong = '/them' | '/them/ten' | '/them/noi' | '/them/xac-nhan';

/** Địa chỉ một bước mang theo trạng thái. `them` chèn thêm khoá phụ (q, loi…). */
export function duongBuoc(
  buoc: BuocDuong,
  t: Partial<TrangThai>,
  them?: Record<string, string | undefined>,
): string {
  const p = new URLSearchParams();
  const nguon: Record<string, string | undefined> = {
    qh: t.qh,
    ten: t.ten,
    ns: t.ns,
    gt: t.gt,
    moc: t.moc,
    tenMoc: t.tenMoc,
    ct: t.ct,
    ...them,
  };
  for (const [k, v] of Object.entries(nguon)) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `${buoc}?${s}` : buoc;
}

/**
 * CHIỀU CỦA LIÊN KẾT — chỗ dễ sai nhất của cả luồng, nên chỉ quyết ở ĐÚNG MỘT hàm này.
 *
 * Hợp đồng `core/assertion` NewPersonInput (đọc nguyên văn từ index.ts):
 *   · `parentId` — "parent-child assertion: NEW PERSON is the CHILD of this parent"
 *                  → người MỚI là CON của parentId.
 *   · `childId`  — "…or the PARENT of this child" → người MỚI là CHA/MẸ của childId
 *                  (cạnh treo trên người con, subject = con — AD-18).
 *   · `partnerId` — vợ/chồng với người có sẵn.
 *
 * `moc` là ai tuỳ nhánh (bước 3 đã giải xong trước khi tới đây):
 *   · qh=bo|me      → moc = MÌNH      → người mới là bố/mẹ của mình  → childId  = moc
 *   · qh=con        → moc = MÌNH      → người mới là con của mình    → parentId = moc
 *   · qh=vo-chong   → moc = MÌNH                                     → partnerId = moc
 *   · qh=anh-chi-em → moc = BỐ/MẸ CHUNG (bước 3 đã tra từ đường huyết thống)
 *                     → anh chị em = con của cùng cha mẹ              → parentId = moc
 *   · qh=minh       → theo ct — mốc là gì CỦA MÌNH:
 *       ct=bo-me    → mốc là bố/mẹ của mình → mình là CON của mốc    → parentId = moc
 *       ct=con      → mốc là con của mình   → mình là CHA/MẸ của mốc → childId  = moc
 *       ct=vo-chong →                                                 → partnerId = moc
 */
export function lapLienKet(
  t: TrangThai,
): Pick<NewPersonInput, 'parentId' | 'childId' | 'partnerId'> | null {
  if (!t.moc) return null;
  switch (t.qh) {
    case 'bo':
    case 'me':
      return { childId: t.moc };
    case 'con':
      return { parentId: t.moc };
    case 'vo-chong':
      return { partnerId: t.moc };
    case 'anh-chi-em':
      return { parentId: t.moc };
    case 'minh':
      switch (t.ct) {
        case 'bo-me':
          return { parentId: t.moc };
        case 'con':
          return { childId: t.moc };
        case 'vo-chong':
          return { partnerId: t.moc };
        default:
          return null;
      }
  }
}

/** Giới tính cho core. Bố/Mẹ suy thẳng từ quan hệ — không bắt khai lại điều đã nói. */
export function gioiTinhCore(t: TrangThai): NewPersonInput['gender'] {
  if (t.qh === 'bo') return 'male';
  if (t.qh === 'me') return 'female';
  if (t.gt === 'nam') return 'male';
  if (t.gt === 'nu') return 'female';
  if (t.gt === 'khac') return 'other';
  return undefined;
}

/**
 * NGUỒN (FR-1) — câu hỏi thứ tư của prototype, nay đứng trên màn xác nhận (vẫn hỏi, không
 * thêm màn: NFR-5 chốt trần 4 màn). Lựa chọn xếp theo mức tin cậy giảm dần và NÓI RA mức ấy
 * — người khai cần thấy câu trả lời của mình quyết định người này hiện ra với chất liệu nào.
 */
export const NGUON_CHON = [
  { ma: 'giay-to', nhan: 'Có giấy tờ, bia mộ hoặc ảnh chụp', phu: 'lên mức chắc chắn' },
  { ma: 'nghe-ke', nhan: 'Nghe người trong họ kể', phu: 'lên mức theo lời kể' },
  { ma: 'biet-ro', nhan: 'Người trong nhà, mình biết rõ', phu: 'ở mức tồn nghi' },
  { ma: 'mang-mang', nhan: 'Nhớ mang máng, chưa chắc', phu: 'ở mức tồn nghi' },
] as const;
export type MaNguon = (typeof NGUON_CHON)[number]['ma'];

export function nguonCore(
  t: TrangThai,
  ma: string | undefined,
): { source: SourceSpec; confidence: NewPersonInput['confidence'] } {
  // Tự khai về mình: nguồn là chính mình. Mức tin cậy để mặc định (tồn nghi) — mọi thứ vào
  // Tầng tồn nghi trước (FR-3/AD-9); đối chiếu giấy tờ nâng mức về sau.
  if (t.qh === 'minh') return { source: { kind: 'self' }, confidence: undefined };
  const chon = NGUON_CHON.find((n) => n.ma === ma) ?? NGUON_CHON[2];
  if (chon.ma === 'giay-to')
    return { source: { kind: 'document', description: chon.nhan }, confidence: 'chac-chan' };
  if (chon.ma === 'nghe-ke')
    return { source: { kind: 'told-by', description: chon.nhan }, confidence: 'theo-loi-ke' };
  return { source: { kind: 'told-by', description: chon.nhan }, confidence: 'ton-nghi' };
}

/**
 * Trạng thái → NewPersonInput. KHÔNG hỏi sống/mất trong luồng này nên không bao giờ gửi
 * `death` — core ghi isLiving=true và tự chèn thông báo cho người được thêm (AD-15/FR-55).
 */
export function lapDauVao(t: TrangThai, maNguon: string | undefined): NewPersonInput | null {
  const lienKet = lapLienKet(t);
  if (!lienKet || !t.ten) return null;
  const { source, confidence } = nguonCore(t, maNguon);
  return {
    fullName: t.ten,
    gender: gioiTinhCore(t),
    // Chỉ năm → precision 'year'; ngày 01-01 chỉ là chỗ đựng năm, precision nói sự thật.
    birth: t.ns ? { date: `${t.ns}-01-01`, precision: 'year' } : undefined,
    ...lienKet,
    source,
    confidence,
  };
}

/** Chữ gọi quan hệ trong câu tóm tắt — theo lời nói trong nhà, không theo tên trường dữ liệu. */
export function nhanQuanHe(t: TrangThai): string {
  switch (t.qh) {
    case 'bo':
      return 'bố của mình';
    case 'me':
      return 'mẹ của mình';
    case 'con':
      return t.gt === 'nam' ? 'con trai của mình' : t.gt === 'nu' ? 'con gái của mình' : 'con của mình';
    case 'vo-chong':
      return t.gt === 'nam' ? 'chồng của mình' : t.gt === 'nu' ? 'vợ của mình' : 'vợ hoặc chồng của mình';
    case 'anh-chi-em':
      return 'anh, chị hoặc em của mình';
    case 'minh':
      return 'chính mình';
  }
}

/** Câu tóm tắt tiếng Việt tự nhiên cho màn xác nhận — một câu đọc to lên được. */
export function cauTomTat(t: TrangThai): string {
  const sinh = t.ns ? `, sinh khoảng ${t.ns}` : '';
  const moc = t.tenMoc ?? 'người đã chọn';
  if (t.qh === 'minh') {
    const noi =
      t.ct === 'con'
        ? `${moc} là con của mình`
        : t.ct === 'vo-chong'
          ? `vợ hoặc chồng của ${moc}`
          : `con của ${moc}`;
    return `Ghi mình vào phả: ${t.ten}${sinh} — ${noi}.`;
  }
  const xung = t.qh === 'bo' ? 'ông ' : t.qh === 'me' ? 'bà ' : '';
  const quaCha = t.qh === 'anh-chi-em' ? ` — con của ${moc}` : '';
  return `Thêm ${xung}${t.ten} là ${nhanQuanHe(t)}${quaCha}${sinh}.`;
}

/** Lỗi ghi → câu trên màn xác nhận. `chua-gan` KHÔNG nằm đây — nó là lời mời, không phải lỗi. */
export const LOI_GHI: Record<string, string> = {
  'khong-hop-le': 'Có chỗ chưa hợp lệ trong phần vừa khai — xem lại tên và năm sinh rồi ghi lại.',
  'khong-thay':
    'Không còn thấy người được nối vào trên phả — có thể vừa được gộp lại. Lui về bước trước để chọn lại.',
  'chua-ghi-duoc': 'Chưa ghi được vào phả. Thử lại một lần nữa.',
};

/** "hôm nay" hoặc ngày tháng — cho dòng ghi công (FR-39). */
export function dinhDangLuc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const nay = new Date();
  const cungNgay =
    d.getFullYear() === nay.getFullYear() &&
    d.getMonth() === nay.getMonth() &&
    d.getDate() === nay.getDate();
  return cungNgay ? 'hôm nay' : d.toLocaleDateString('vi-VN');
}
