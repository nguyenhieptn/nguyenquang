/**
 * Trục thứ HAI của xưởng: **LUỒNG** (journey), song song với trục "bề mặt → FR → view".
 *
 * Vì sao cần: outline là **phân loại** — nó trả lời "màn này thuộc yêu cầu nào", KHÔNG trả lời
 * "sau màn này là màn nào". Trong BMAD, hành trình sống ở `EXPERIENCE.md § Key Flows` dưới dạng
 * **văn xuôi**: không bấm được, không kiểm được, và trôi khỏi mã nguồn mà không ai biết.
 *
 * File này là **bản dịch máy đọc được** của các luồng đó: mỗi luồng = chuỗi bước, mỗi bước = một
 * view đã dựng + **trigger** (hành vi đưa TỚI bước ấy). `slug: null` = bước chưa có màn nào phủ →
 * bản đồ hiện ô trống có tên, lỗ hổng tự lộ ra thay vì im lặng.
 *
 * NGUỒN SỰ THẬT vẫn là `EXPERIENCE.md § Key Flows` — trường `source` trỏ về đúng luồng ở đó. Sửa
 * hành trình thì sửa EXPERIENCE.md trước, file này theo sau. Luồng nào `source: null` = **chưa
 * distill vào spine**, coi như nợ tài liệu.
 *
 * Thuần dữ liệu + tính toạ độ (không fs, không React) → an toàn import từ client.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 * KIT: `FLOWS` để RỖNG là hợp lệ — sidebar tự ẩn mục "Luồng" khi chưa có luồng nào. Khi bmad-ux
 * đã có Key Flows, chép từng luồng vào đây theo mẫu ở cuối file. Giữ nguyên phần bố cục bản đồ.
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 */
import { defaultViewport, type ViewportMode } from './outline';

export type FlowStep = {
  /** View đã dựng trong xưởng; `null` = bước chưa có màn (hiện thành ô trống trên bản đồ). */
  slug: string | null;
  /** Nhãn node — nói bước này LÀ GÌ trong hành trình, không phải tên kỹ thuật của màn. */
  label: string;
  /** Hành vi đưa TỚI bước này. Bước đầu tiên: cú mồi (quét QR, mở /admin, nhận email…). */
  trigger: string;
  /**
   * Query dán vào URL màn khi nhúng trên bản đồ (vd `v=goi-doanh-nghiep`). Cần vì **một view phục
   * vụ nhiều luồng với dữ liệu khác nhau** — cùng bốn màn dùng lại cho nhiều nhánh, chỉ khác `?v=`.
   * Thiếu nó thì bản đồ của nhánh này vẽ nội dung của nhánh kia, tức **bản đồ nói dối** — đúng thứ
   * trục LUỒNG dựng ra để chống.
   */
  query?: string;
  /** Nhịp cao trào của luồng (EXPERIENCE.md đánh dấu "← cao trào"). */
  climax?: boolean;
  /**
   * Màn ĐÃ dựng nhưng **mới có bản tiếng Việt** (hoặc: mới có ngôn ngữ gốc). Khác `slug: null`
   * (chưa có màn) — trong luồng của người dùng nói ngôn ngữ khác, đây là đứt gãy thật, chỉ khác là
   * đứt ở tầng nội dung chứ không phải tầng bề mặt. Không đánh dấu thì bản đồ NÓI DỐI: ô ngôn ngữ
   * trang trí trên prototype khiến nhìn qua tưởng đã đa ngữ.
   */
  viOnly?: boolean;
  /**
   * Ép khung xem cho RIÊNG bước này, đè `defaultViewport(slug)`.
   *
   * Cần vì một view responsive có **hai bộ mặt thật khác nhau** (điện thoại xếp chồng, máy xếp
   * ngang), mà `defaultViewport` chỉ trả về một giá trị cho mỗi slug. Không có trường này thì
   * cùng một luồng không thể vẽ được cả hai — và người duyệt phải tự tưởng tượng nửa còn lại.
   *
   * Bỏ trống = giữ nguyên hành vi cũ (lấy theo bề mặt của view).
   */
  viewport?: ViewportMode;
  /** Ghi chú neo quyết định hoặc story. */
  note?: string;
};

export type Flow = {
  id: string;
  title: string;
  /** Nhân vật có tên — luật của bmad-ux: không bao giờ "người dùng". */
  persona: string;
  /** Trỏ về nguồn trong EXPERIENCE.md; `null` = luồng CHƯA được distill vào spine. */
  source: string | null;
  steps: FlowStep[];
};

/**
 * Bước của luồng "Xem cả tộc" — dựng một lần, chạy hai khung.
 *
 * Ba màn cây đều RESPONSIVE THẬT: trên điện thoại các chi xếp chồng, trên máy chúng đứng hàng
 * ngang thành hình cây. Đó là hai bộ mặt khác nhau của cùng một màn, nên bản đồ phải vẽ được cả
 * hai — người duyệt không phải tự tưởng tượng nửa còn lại. `viewport` ép khung cho từng bước.
 */
const xemCaToc = (viewport: ViewportMode): FlowStep[] => [
  {
    slug: 'mot-chi',
    label: 'Chi của mình',
    trigger: 'Chạm “Gia phả” trên thanh điều hướng',
    viewport,
    note: 'FR-15: mở lên thấy CHÍNH MÌNH trước — điểm vào là tầng 2, không phải tầng 1',
  },
  {
    slug: 'ca-toc',
    label: 'Cả tộc',
    trigger: 'Bấm “← Xem cả tộc”',
    viewport,
    climax: true,
    note: 'Cao trào: thấy chi của mình được tô son GIỮA các chi khác, và thấy mảnh chưa nối đứng tách hẳn ra',
  },
  {
    slug: 'mot-chi',
    label: 'Một chi khác',
    trigger: 'Chạm khối “Chi Hai”',
    viewport,
    note: 'CHƯA THẬT: ba khối chi hiện trỏ về cùng một trang. Cần route [chiId] khi promote.',
  },
  {
    slug: 'cay-gia-toc',
    label: 'Cây gia tộc',
    trigger: 'Bấm “Xem cây gia tộc”',
    viewport,
  },
];

export const FLOWS: Flow[] = [
  {
    id: 'khanh-tu-khai',
    title: 'Khánh tìm bố, không thấy, và vẫn ở lại',
    persona: 'Nguyễn Quang Khánh, sinh 2004, sinh viên — nghe về web tại buổi họp họ',
    source: 'EXPERIENCE.md § Key Flows — Luồng 1',
    steps: [
      {
        slug: 'dong-ho-dang-song',
        label: 'Dòng họ đang sống',
        trigger: 'Mở đường dẫn nghe được ở buổi họp họ',
        note: 'Chưa đăng nhập vẫn xem được cây (FR-11). Đợt 1 chỉ dựng 2/4 ô.',
      },
      { slug: null, label: 'Tìm người thân', trigger: 'Gõ tên bố: Nguyễn Quang Hùng' },
      {
        slug: 'khong-tim-thay',
        label: 'Không tìm thấy',
        trigger: 'Không có kết quả khớp',
        note: 'MÀN QUAN TRỌNG NHẤT ĐỢT 1 — trạng thái mặc định nhiều tháng đầu, không phải lỗi',
      },
      {
        slug: null,
        label: 'Đăng nhập / gắn node',
        trigger: 'Bấm “Không ai cả — thêm bố vào phả”',
        note: 'FR-64: tới đây mới cần xác thực',
      },
      { slug: null, label: 'Thêm người thân', trigger: 'Xác thực xong', note: 'Vào thẳng Tầng tồn nghi, không chờ duyệt (FR-3)' },
      { slug: null, label: 'Tìm người thân', trigger: 'Gõ tên anh trai — thấy đúng 1 người' },
      {
        slug: 'cay-gia-toc',
        label: 'Cây gia tộc',
        trigger: 'Xác nhận liên kết anh em',
        climax: true,
        note: 'FR-13 + FR-63 + FR-39: đường ngược lên cụ tô sáng, node bố mang dòng “cháu Khánh ghi · hôm nay”',
      },
    ],
  },
  {
    id: 'ngay-0-gieo-moi',
    title: 'Ngày 0 — gieo mồi vào hệ thống trống',
    persona: 'Nguyễn Hiệp, người dựng và vận hành, làm trên desktop với một file CSV điền tay',
    source: 'EXPERIENCE.md § Key Flows — Luồng 2',
    steps: [
      { slug: 'nap-khung', label: 'Nạp khung — tải mẫu', trigger: 'Mở khu quản trị' },
      {
        slug: 'nap-khung',
        label: 'Tải file lên',
        trigger: 'Điền CSV xong ngoài hệ thống',
        note: 'CÙNG một màn với bước trước, ở trạng thái “đã chọn file” — hai bước vì việc thật xảy ra NGOÀI hệ thống giữa chúng',
      },
      {
        slug: 'xem-truoc-so-khop',
        label: 'Xem trước so khớp',
        trigger: 'Hệ thống tự so khớp với dữ liệu đã có',
        note: 'Ba trạng thái mỗi dòng: khớp người có sẵn / người mới / nghi trùng',
      },
      {
        slug: 'xem-truoc-so-khop',
        label: 'Cảnh báo của bot',
        trigger: 'Bot phát hiện lỗi so khớp hoặc ứng viên trùng',
        note: 'FR-48: gợi ý, KHÔNG tự gộp. KHÔNG phải màn riêng — cùng bảng, lọc “Cần xem lại” (sửa spine 11/08/2026)',
      },
      {
        slug: 'ca-toc',
        label: 'Cây lần đầu có hình',
        trigger: 'Submit từng người hoặc submit hàng loạt',
        climax: true,
        // Cao trào MƯỢN màn của bề mặt A, ở khung máy. Phần thưởng của việc gieo mồi không phải
        // một bảng báo "đã ghi 8 người" mà là thứ dòng họ sắp nhìn thấy.
        viewport: 'web',
        note: 'FR-51 + FR-63: toàn bộ vào mức tồn nghi; gốc tạm ghi rõ “cụ xa nhất hiện biết”; số mảnh chưa nối hiện trung thực',
      },
    ],
  },
  ...['mobile', 'web'].map((khung) => ({
    id: khung === 'mobile' ? 'xem-ca-toc-dien-thoai' : 'xem-ca-toc-may',
    title: khung === 'mobile' ? 'Xem cả tộc — trên điện thoại' : 'Xem cả tộc — trên máy',
    // Người duyệt trả lời 11/08/2026: "ai cũng xem được". Đây KHÔNG phải một hành trình có nhân
    // vật theo nghĩa của bmad-ux, mà là một NĂNG LỰC MỞ CHO MỌI NGƯỜI — và đó chính là FR-11
    // ("xem cây không cần đăng ký"). Ghi đúng như vậy thay vì bịa ra một cái tên.
    persona: 'Bất kỳ ai mở đường dẫn — không cần tài khoản (FR-11)',
    source: 'EXPERIENCE.md § Key Flows — Luồng 3',
    steps: xemCaToc(khung as ViewportMode),
  })),
  // NỢ TÀI LIỆU — hai luồng chưa distill được vào spine, xem EXPERIENCE.md § Luồng chưa distill:
  //  · Thu lời kể (FR-47 + FR-49) — hành trình gốc UJ-1 (bà Nhàn 84 tuổi, cháu Quân) đã mất khi
  //    PRD được viết lại; PRD không nằm trong git nên không khôi phục được. PRD từng gắn nhãn đây
  //    là "hành trình quan trọng nhất của sản phẩm". Cần người duyệt kể lại.
  //  · Duyệt lên Tầng chính thức (FR-3) — hành trình gốc UJ-3 cũng mất; phần còn lại phụ thuộc
  //    FR-4, vốn ngoài Đợt 1.
];

export function flowById(id: string): Flow | undefined {
  return FLOWS.find((f) => f.id === id);
}

/** Số bước chưa có màn — hiện ngay ở sidebar để lỗ hổng không im lặng. */
export function gapCount(flow: Flow): number {
  return flow.steps.filter((s) => s.slug === null).length;
}

/** Số bước có màn nhưng mới có bản tiếng Việt — với luồng đa ngữ, đây là việc phải làm. */
export function viOnlyCount(flow: Flow): number {
  return flow.steps.filter((s) => s.viOnly).length;
}

// ── Bố cục bản đồ (GIỮ NGUYÊN khi cắm kit) ───────────────────────────────────
// Chuỗi ngang, các node căn giữa theo MỘT trục ngang → cạnh nối là đường thẳng, chip trigger nằm
// đúng giữa cạnh. Kích thước node lấy theo BỀ MẶT của view (mobile 390 native; web 1280 thu 0.5)
// nên bản đồ giữ đúng tỉ lệ thật của từng màn thay vì bóp tất cả về một khung.

const PAD_X = 80;
const PAD_Y = 56;
/** Khoảng hở giữa hai node — đủ chỗ cho chip trigger. */
export const GAP = 300;
/** Chiều cao thanh tiêu đề của node. */
export const HEAD_H = 32;

export type FlowNode = {
  i: number;
  step: FlowStep;
  x: number;
  y: number;
  /** Kích thước cả thẻ (đã gồm thanh tiêu đề). */
  w: number;
  h: number;
  /** Khung nhúng: kích thước THẬT của iframe + hệ số thu nhỏ. */
  nativeW: number;
  nativeH: number;
  scale: number;
};

function frameOf(step: FlowStep): { nativeW: number; nativeH: number; scale: number } {
  if (!step.slug) return { nativeW: 360, nativeH: 320, scale: 1 }; // ô trống "chưa dựng"
  // `step.viewport` thắng: cùng một view responsive có thể xuất hiện ở hai luồng, mỗi luồng một khung.
  return (step.viewport ?? defaultViewport(step.slug)) === 'web'
    ? { nativeW: 1280, nativeH: 820, scale: 0.5 }
    : { nativeW: 390, nativeH: 760, scale: 1 };
}

export function layoutFlow(flow: Flow): { nodes: FlowNode[]; width: number; height: number } {
  const sized = flow.steps.map((step) => {
    const f = frameOf(step);
    return { step, ...f, w: f.nativeW * f.scale, h: f.nativeH * f.scale + HEAD_H };
  });
  const maxH = Math.max(...sized.map((s) => s.h));

  let x = PAD_X;
  const nodes: FlowNode[] = sized.map((s, i) => {
    const node: FlowNode = {
      i,
      step: s.step,
      x,
      y: PAD_Y + (maxH - s.h) / 2, // căn giữa theo trục ngang chung
      w: s.w,
      h: s.h,
      nativeW: s.nativeW,
      nativeH: s.nativeH,
      scale: s.scale,
    };
    x += s.w + GAP;
    return node;
  });

  return { nodes, width: x - GAP + PAD_X, height: maxH + PAD_Y * 2 };
}
