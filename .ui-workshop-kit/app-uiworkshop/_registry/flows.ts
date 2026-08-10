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
import { defaultViewport } from './outline';

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

export const FLOWS: Flow[] = [
  // Ví dụ — xoá và thay bằng Key Flows của project:
  //
  // {
  //   id: 'dang-ky-lan-dau',
  //   title: 'Đăng ký lần đầu',
  //   persona: 'Mai, chủ quán nhỏ, làm trên điện thoại lúc 22h',
  //   source: 'EXPERIENCE.md § Key Flows — Luồng 1',
  //   steps: [
  //     { slug: 'home', label: 'Trang chủ', trigger: 'Bấm link bạn bè gửi qua Zalo' },
  //     { slug: null,   label: 'Form đăng ký', trigger: 'Bấm “Bắt đầu”', note: 'CHƯA DỰNG' },
  //     { slug: 'admin-dashboard', label: 'Tổng quan', trigger: 'Xác thực xong', climax: true },
  //   ],
  // },
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
  return defaultViewport(step.slug) === 'web'
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
