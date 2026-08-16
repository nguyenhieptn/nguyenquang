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
import { REQ_GROUPS, defaultViewport, type ViewportMode } from './outline';

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
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 * RỖNG từ 16/08/2026 — thu phạm vi xưởng còn MỘT màn.
 *
 * File này từng giữ năm hành trình có tên, dựng trên 16 màn. Mười sáu màn ấy đã bị xoá, nên mọi
 * `slug` trong đó thành con trỏ treo: bản đồ sẽ vẽ ra một chuỗi ô trống và `gapCount` sẽ báo
 * "chưa dựng" cho những màn thật ra đã từng dựng xong. Sai kiểu đó tệ hơn là không có bản đồ.
 *
 * Nên: **rỗng, có chủ ý.** Sidebar tự ẩn mục "Luồng" khi `FLOWS` rỗng — không có đầu mục cụt.
 *
 * ⚠️ MỘT MÀN THÌ CHƯA CÓ LUỒNG, VÀ ĐÓ LÀ SỰ THẬT CẦN NHÌN THẤY. Một hành trình cần ít nhất hai
 * bước; xưởng đang có một. Luồng quay lại khi có màn thứ hai — và lúc đó nó tả một đường đi CÓ
 * THẬT giữa hai màn thật, thay vì một chuỗi ý định.
 *
 * Bản cũ nằm trong lịch sử git: `git log -p -- app/uiworkshop/_registry/flows.ts`.
 *
 * Toàn bộ máy móc phía dưới (`flowById`, `gapCount`, `viewChuaCoLuong`, `layoutFlow`…) GIỮ NGUYÊN
 * và chạy đúng trên mảng rỗng — chúng là plumbing của kit, không phải dữ liệu của dự án.
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 */
export const FLOWS: Flow[] = [];

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

/**
 * ĐẾM NGƯỢC — màn nào KHÔNG luồng nào dẫn tới.
 *
 * Thêm 12/08/2026. `gapCount` đếm **bước thiếu màn**; hàm này đếm **màn thiếu bước**, và không có
 * nó thì xưởng nói dối theo đúng cái kiểu nó sinh ra để chống: trang tổng quan ghi "0 bước hụt"
 * nghe như đã phủ hết, trong khi bốn màn đứng ngoài mọi hành trình — tức là bốn màn không ai kiểm
 * được, vì không có đường nào dẫn người duyệt đi qua chúng.
 *
 * Một màn ngoài mọi luồng KHÔNG hẳn là lỗi. Nó là một trong hai điều, và cả hai đều đáng biết:
 * hoặc hành trình dẫn tới nó chưa được distill (nợ tài liệu), hoặc bản thân màn ấy thừa.
 *
 * `FOUNDATION` không tính: từ điển thị giác là đồ nghề của người dựng, không phải nơi ai đi qua.
 */
export function viewChuaCoLuong(): { slug: string; label: string; fr: string }[] {
  const coLuong = new Set(FLOWS.flatMap((f) => f.steps.map((s) => s.slug)).filter(Boolean));
  return REQ_GROUPS.flatMap((g) =>
    g.views.filter((v) => !coLuong.has(v.slug)).map((v) => ({ ...v, fr: g.fr })),
  );
}

/**
 * Luồng CHƯA distill vào spine (`source: null`) — nợ tài liệu, không phải luồng hạng hai.
 *
 * Phải đếm được, nếu không một luồng tôi suy ra từ § State Patterns trông y hệt một luồng người
 * duyệt đã kể — và cái thứ hai mới là thứ đáng tin.
 */
export function luongChuaDistill(): Flow[] {
  return FLOWS.filter((f) => f.source === null);
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
