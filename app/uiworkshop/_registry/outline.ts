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

/**
 * Bề mặt = tầng gom nhóm FR. Mỗi bề mặt một chuẩn chrome riêng.
 *
 * Sản phẩm là **web-only** (PRD §8: không làm app mobile), nhưng bề mặt chính vẫn là **trình duyệt
 * trên điện thoại** — NFR §6 chốt "≤ 4 màn hình, ≤ 3 phút, điện thoại tầm trung, 4G ở quê". Nên
 * mặc định của bề mặt người trong họ là `mobile`, không phải `web`.
 *
 * Bàn làm việc tách riêng vì chrome khác hẳn: Hiệp duyệt hàng loạt, so sánh hai mảnh cạnh nhau, đọc
 * nhật ký sửa — những việc cần bề ngang, làm trên máy.
 */
export type SectionKey = 'app' | 'admin';

export const SECTIONS: {
  key: SectionKey;
  label: string;
  /** Ghi chú chuẩn chrome — hiện mờ cạnh đầu mục. */
  note: string;
  /** Khung xem mặc định của mọi view thuộc bề mặt này. */
  viewport: ViewportMode;
}[] = [
  { key: 'app', label: 'Người trong họ', note: 'web trên điện thoại', viewport: 'mobile' },
  { key: 'admin', label: 'Bàn làm việc', note: 'màn rộng, một trang ba cột', viewport: 'web' },
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
 *
 * Khi bmad-ux render màn đầu tiên cho một FR: gỡ FR đó khỏi `PLANNED_REQS`, tạo một `ReqGroup` ở
 * đây (xem `_bmad/custom/ux-assets/react-key-screens.md`). Bề mặt nào chưa có nhóm nào thì sidebar
 * tự ẩn — không có đầu mục rỗng.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 * LỊCH SỬ: 16/08/2026 thu phạm vi xuống một màn (`trang-chu`); 22/08/2026 Đợt 1 dev xong,
 * mọi màn promote ra route thật và rời xưởng. Muốn xem bản dựng thử cũ: lịch sử git
 * (`git log --diff-filter=D --name-only -- app/uiworkshop`).
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 */
export const REQ_GROUPS: ReqGroup[] = [
  // 22/08/2026 — Đợt 1 ĐÃ PROMOTE TOÀN BỘ ra route thật (app/(pha), app/admin, app/dang-nhap,
  // app/gan-node). Theo đúng luồng promote của specs/frontend-stack.md §5, bản dựng thử rời xưởng
  // khi thành màn thật: `trang-chu` (màn cuối còn lại) đã xoá, entry gỡ khỏi đây.
  // 24/08/2026 — ĐỢT SAU bắt đầu: bàn làm việc `/admin` (Epic 5) vào xưởng để duyệt bố cục
  // trước khi dev.
  //
  // Cùng ngày, sau khi bố cục được chốt: bản chú giải tĩnh `admin-ban-lam-viec` đã XOÁ — nó là
  // bản vẽ để bàn, và bàn xong thì bản vẽ hết việc; giữ hai bản dựng thử của cùng một màn chỉ
  // sinh ra câu hỏi "bản nào đúng". Đọc lại nó ở lịch sử git nếu cần
  // (`git log --diff-filter=D --name-only -- app/uiworkshop`).
  //
  // Vỏ của màn này (thanh trên · thanh việc · một hệ bề rộng) ĐÃ PROMOTE ra `app/admin` ngày
  // 24/08 theo story 5-1.
  //
  // 25/08/2026 — CẢ EPIC 5 đã promote ra màn thật: canvas (5-2), chồng khẳng định (5-3), thêm
  // người (5-4), duyệt vào phả (5-5), ghi thêm (5-6), nơi chốn (5-7). Bản dựng thử ở lại xưởng
  // vì đúng MỘT lý do còn giá trị: nó xem được KHÔNG CẦN ĐĂNG NHẬP, mà mọi màn `/admin` thì đứng
  // sau cổng quyền. Đó là chỗ duy nhất bàn bố cục được với người ngoài Ban tu phả.
  //
  // Khác biết trước khi đối chiếu hai bên: bản dựng thử KHÔNG lọc bán kính riêng tư và chỉ đi
  // cạnh cha-con, còn màn thật lọc riêng tư (AD-13/AD-21) và đi cả cạnh vợ-chồng. Số người trên
  // hai màn vì thế không khớp nhau, và đó không phải lỗi của bên nào.
  {
    section: 'admin',
    fr: 'FR-3 · FR-64 · FR-65',
    title: 'Bàn làm việc quản trị — một trang ba cột',
    epics: ['E5'],
    views: [
      {
        // Màn THẬT 1:1, chạy được: @xyflow/react + xepCay() thật, mock data, full width.
        slug: 'admin-canvas-graph',
        label: 'Bàn làm việc (chạy được)',
        storySlugs: [],
      },
    ],
  },
];

/**
 * FR chưa dev — bản thân FR là mục đích; prototype sẽ đổ view vào sau.
 *
 * Nguồn: `prd.md` §5 — **mười lăm yêu cầu của Đợt 1**, giữ nguyên thứ tự của PRD (Gieo mồi → Vòng
 * lặp người dùng → Thu lời kể → Nền dữ liệu → Không làm hại ai) vì thứ tự đó chính là thứ tự khiến
 * dữ liệu bắt đầu chảy vào. FR của "Sau này" (§7) KHÔNG liệt kê ở đây.
 *
 * `epic` còn là "Đợt 1" cho tới khi chạy sprint planning — lúc đó thay bằng mã epic thật (E1, E2…)
 * và gắn `storySlugs` cho từng view.
 */
export const PLANNED_REQS: { fr: string; title: string; epic: string }[] = [
  // RỖNG từ 22/08/2026 — mười lăm FR Đợt 1 đều đã có màn THẬT ngoài production.
  // FR "Sau này" (prd.md §7) sẽ đổ vào đây khi tới lượt (FR-22 lời giáo huấn, FR-41 lịch giỗ…).
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
