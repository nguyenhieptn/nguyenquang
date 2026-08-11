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
 * Bàn duyệt tách riêng vì chrome khác hẳn: Hiệp duyệt hàng loạt, so sánh hai mảnh cạnh nhau, đọc
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
  { key: 'admin', label: 'Bàn duyệt', note: 'màn rộng, duyệt & đối chiếu', viewport: 'web' },
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
 */
export const REQ_GROUPS: ReqGroup[] = [
  {
    section: 'app',
    fr: 'FR-13·FR-39·FR-63',
    title: 'Trả công tức thì',
    epics: ['Đợt 1'],
    views: [{ slug: 'dong-ho-dang-song', label: 'Dòng họ đang sống' }],
  },
  {
    section: 'app',
    fr: 'FR-48·FR-11',
    title: 'Hợp nhất mảnh — chặn trùng tại nguồn',
    epics: ['Đợt 1'],
    views: [{ slug: 'khong-tim-thay', label: 'Không tìm thấy' }],
  },
  {
    section: 'app',
    fr: 'FR-15·FR-2·FR-3',
    title: 'Cây gia tộc & ba mức tin cậy',
    epics: ['Đợt 1'],
    // Ba tầng zoom, đúng chữ FR-15 "zoom theo chi, collapse theo đời".
    // Điểm vào của mục "Gia phả" là TẦNG 2 — FR-15 đòi thấy chính mình trước.
    views: [
      { slug: 'mot-chi', label: 'Một chi — tầng 2' },
      { slug: 'ca-toc', label: 'Cả tộc — tầng 1' },
      { slug: 'cay-gia-toc', label: 'Cây gia tộc' },
    ],
  },
  {
    section: 'admin',
    fr: 'FR-51·FR-48',
    title: 'Gieo mồi — nạp khung dòng họ',
    epics: ['Đợt 1'],
    // FR-48 xuất hiện ở CẢ HAI bề mặt và đó là đúng: chặn bản trùng ở bề mặt A là chặn lúc một
    // người tự khai; ở đây là chặn lúc nạp cả một file. Cùng một yêu cầu, hai chỗ nó phải đứng.
    //
    // "Bảng cảnh báo" KHÔNG có mặt ở đây vì nó không phải một view: nó là bộ lọc "Cần xem lại"
    // của chính màn xem trước (EXPERIENCE.md § Bề mặt B, sửa 11/08/2026).
    views: [
      { slug: 'nap-khung', label: 'Nạp khung' },
      { slug: 'xem-truoc-so-khop', label: 'Xem trước so khớp' },
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
  // Gieo mồi — FR-51 đã có màn (bề mặt "Bàn duyệt"), xem REQ_GROUPS.
  // Vòng lặp người dùng — thêm mình vào phả rồi thấy ngay mình là ai.
  { fr: 'FR-11', title: 'Tự khai 4 bước', epic: 'Đợt 1' },
  // Thu lời kể — việc duy nhất có hạn dùng, các cụ không đợi.
  // ⚠️ Hai FR dưới đây nằm trong phạm vi Đợt 1 nhưng CHƯA CÓ HÀNH TRÌNH nào dẫn tới chúng:
  //    hành trình gốc UJ-1 (bà Nhàn 84 tuổi, cháu Quân) đã mất khi PRD được viết lại và không
  //    khôi phục được. Xem EXPERIENCE.md § Luồng chưa distill.
  { fr: 'FR-47', title: 'Thu và lưu lời kể', epic: 'Đợt 1' },
  { fr: 'FR-49', title: 'Đồng thuận cho lời kể', epic: 'Đợt 1' },
  // Nền dữ liệu.
  { fr: 'FR-1', title: 'Khẳng định mang nguồn', epic: 'Đợt 1' },
  { fr: 'FR-64', title: 'Đăng nhập & quản lý người dùng', epic: 'Đợt 1' },
  // Không làm hại ai.
  { fr: 'FR-37', title: 'Riêng tư theo bán kính họ hàng', epic: 'Đợt 1' },
  { fr: 'FR-55', title: 'Quyền của người sống', epic: 'Đợt 1' },
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
