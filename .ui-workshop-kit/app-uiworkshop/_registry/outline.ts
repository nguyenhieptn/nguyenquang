/**
 * Overlay cho sidebar UI Workshop — outline của SẢN PHẨM, ba tầng: **BỀ MẶT → FR → view**.
 *
 * Vì sao theo FR chứ không theo story: một user story là **lát cắt thực hiện**, thường quá nhỏ
 * để là một view, và nhiều story cùng đổ vào một màn. Nên trục chính là **requirement (FR)** —
 * mỗi FR là một feature có một hay nhiều view; **story tụt xuống thành nhãn truy vết** dưới view
 * (mang trạng thái SỐNG đọc từ sprint-status qua sprint.ts). FR chưa dev thì bản thân FR là mục
 * đích rõ ràng — không có "dòng story trống".
 *
 * Vì sao có tầng BỀ MẶT: khi vượt ~20 view, một danh sách FR phẳng hết quét được, và các bề mặt
 * có **chuẩn chrome khác nhau** (app mobile vs dashboard desktop) bị trộn lẫn. Bề mặt cũng quyết
 * định **khung xem mặc định** (mobile/web) của mọi view thuộc nó.
 *
 * File này thuần dữ liệu (không fs) → an toàn import từ client (sidebar).
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 * KIT: đây là bản KHUNG. Việc của bạn:
 *   1. Đặt lại `SectionKey` + `SECTIONS` theo các BỀ MẶT của product (2–5 cái là vừa).
 *   2. Điền `REQ_GROUPS` theo FR trong PRD; FR chưa dựng để `PLANNED_REQS`.
 *   3. `storySlugs` khớp key story trong sprint-status.yaml của BMAD.
 * Giữ nguyên `defaultViewport` và `statusChip` — plumbing (sidebar, viewport, flow-map) gọi vào.
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 */

/** Khung xem của xưởng. Chỉ hai — mỗi màn có MỘT bề mặt đúng của nó. */
export type ViewportMode = 'mobile' | 'web';

/** Một màn dựng thử trong xưởng (`/uiworkshop/<slug>`, mock data). */
export type View = {
  slug: string;
  label: string;
  /** Story (slug sprint-status) đã nhào nặn view này — hiện thành chấm trạng thái. */
  storySlugs?: string[];
  /** Khung xem mặc định của RIÊNG view này — đè mặc định của bề mặt (xem `defaultViewport`). */
  viewport?: ViewportMode;
};

/** Bề mặt = tầng gom nhóm FR. Mỗi bề mặt một chuẩn chrome riêng. ĐỔI THEO PROJECT. */
export type SectionKey = 'app' | 'admin';

export const SECTIONS: {
  key: SectionKey;
  label: string;
  /** Ghi chú chuẩn chrome — hiện mờ cạnh đầu mục. */
  note: string;
  /** Khung xem mặc định của mọi view thuộc bề mặt này. */
  viewport: ViewportMode;
}[] = [
  { key: 'app', label: 'Người dùng cuối', note: 'app-shell mobile', viewport: 'mobile' },
  { key: 'admin', label: 'Quản trị', note: 'dashboard-shell', viewport: 'web' },
];

/** Một nhóm yêu cầu = đơn vị điều hướng chính. */
export type ReqGroup = {
  section: SectionKey;
  fr: string; // "FR1·FR2"
  title: string; // "Trang chính cho người dùng"
  epics: string[]; // nhãn phụ: ["E1","E2"]
  views: View[];
};

/** Bề mặt nền tảng — không thuộc FR nào (từ điển thị giác). Giữ ít nhất design-system. */
export const FOUNDATION: View[] = [
  {
    slug: 'design-system',
    label: 'Bộ nhận diện & component',
    viewport: 'web', // bảng token/component cần bề ngang
  },
];

/**
 * Trục chính: bề mặt → FR → view. Nhãn view giữ NGẮN (một dòng, không cắt cụt trong sidebar).
 * VÍ DỤ — thay bằng FR thật của project.
 */
export const REQ_GROUPS: ReqGroup[] = [
  {
    section: 'app',
    fr: 'FR1',
    title: 'Màn chính người dùng',
    epics: ['E1'],
    views: [
      { slug: 'home', label: 'Trang chủ', storySlugs: ['1-1-scaffold'] },
      // { slug: 'detail', label: 'Chi tiết', storySlugs: ['1-2-detail'] },
    ],
  },
  {
    section: 'admin',
    fr: 'FR2',
    title: 'Bảng điều khiển',
    epics: ['E2'],
    views: [
      // { slug: 'admin-dashboard', label: 'Tổng quan', storySlugs: ['2-1-dashboard'] },
    ],
  },
];

/** FR chưa dev — bản thân FR là mục đích; prototype sẽ đổ view vào sau. Nguồn: PRD §yêu cầu. */
export const PLANNED_REQS: { fr: string; title: string; epic: string }[] = [
  // { fr: 'FR3', title: 'Tìm kiếm', epic: 'E3' },
];

/**
 * Khung xem mặc định của một view: ưu tiên khai báo riêng ở `View.viewport`, không có thì lấy theo
 * BỀ MẶT. Đây chỉ là mặc định lần đầu — lựa chọn của người dùng cho từng view được nhớ lại
 * (xem `_components/viewport.tsx`).
 */
export function defaultViewport(slug: string): ViewportMode {
  const own = FOUNDATION.find((v) => v.slug === slug);
  if (own) return own.viewport ?? 'web';
  for (const g of REQ_GROUPS) {
    const v = g.views.find((x) => x.slug === slug);
    if (v) return v.viewport ?? SECTIONS.find((s) => s.key === g.section)?.viewport ?? 'mobile';
  }
  return 'mobile';
}

/** Trạng thái sprint → tông chấm + nhãn NGẮN. Thêm case nếu project dùng trạng thái riêng. */
export function statusChip(status: string): {
  tone: 'neutral' | 'success' | 'caution';
  label: string;
} {
  switch (status) {
    case 'done':
      return { tone: 'success', label: 'done' };
    case 'in-progress':
      return { tone: 'caution', label: 'wip' };
    case 'review':
      return { tone: 'caution', label: 'review' };
    case 'ready-for-dev':
      return { tone: 'neutral', label: 'ready' };
    case 'backlog':
      return { tone: 'neutral', label: 'todo' };
    default:
      return { tone: 'neutral', label: status };
  }
}
