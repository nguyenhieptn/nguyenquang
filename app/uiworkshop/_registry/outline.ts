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
    // Tìm và không-tìm-thấy đứng cùng một nhóm vì chúng là MỘT việc: chặn bản trùng tại nguồn.
    // Người dùng nghĩ mình đang tra cứu; hệ thống đang chặn. Tách ra hai nhóm thì cái thứ hai đọc
    // ra như một màn lỗi, mà nó là màn quan trọng nhất của Đợt 1.
    views: [
      { slug: 'tim-nguoi-than', label: 'Tìm người thân' },
      { slug: 'khong-tim-thay', label: 'Không tìm thấy' },
    ],
  },
  {
    section: 'app',
    fr: 'FR-11·FR-3',
    title: 'Tự khai — bốn câu, ghi ngay',
    epics: ['Đợt 1'],
    views: [{ slug: 'them-nguoi-than', label: 'Thêm người thân' }],
  },
  {
    section: 'app',
    fr: 'FR-1·FR-2·FR-37',
    title: 'Trang một người — khẳng định mang nguồn',
    epics: ['Đợt 1'],
    // FR-39 cũng đổ vào màn này (nhật ký sửa đọc thành "ai đã ghi gì"), nhưng nhãn FR giữ ba mã:
    // FR-39 đã đứng tên ở nhóm "Trả công tức thì", và lặp mã ở hai chỗ khiến sidebar đọc ra như
    // có hai yêu cầu khác nhau trùng số.
    views: [{ slug: 'trang-nguoi', label: 'Trang một người' }],
  },
  {
    section: 'app',
    fr: 'FR-47·FR-49',
    title: 'Thu lời kể & đồng thuận',
    epics: ['Đợt 1'],
    // ⚠️ Màn dựng từ § IA và § Interaction Primitives, KHÔNG từ một hành trình có thật — hành
    // trình gốc UJ-1 đã mất. Đúng luật, chưa chắc đúng nhịp. Xem EXPERIENCE.md § Luồng chưa distill.
    views: [{ slug: 'thu-loi-ke', label: 'Thu lời kể' }],
  },
  {
    section: 'app',
    fr: 'FR-64·FR-55',
    title: 'Tài khoản, chỗ của mình, quyền của người sống',
    epics: ['Đợt 1'],
    // Hai FR nằm chung một nhóm vì chúng là hai nửa của cùng một câu hỏi — "phả biết mình là ai".
    // FR-64 trả lời phần chứng minh; FR-55 trả lời phần hệ quả: đã biết mình là ai thì phần về
    // mình do mình quyết.
    views: [
      { slug: 'dang-nhap', label: 'Đăng nhập & nhận chỗ' },
      { slug: 'toi', label: 'Tôi' },
    ],
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
  {
    section: 'admin',
    fr: 'FR-3',
    title: 'Duyệt lên Tầng chính thức',
    epics: ['Đợt 1'],
    // ⚠️ Cùng nợ tài liệu với "Thu lời kể": hành trình gốc UJ-3 đã mất, và phần còn lại phụ thuộc
    // FR-4 vốn ngoài Đợt 1. Màn dựng từ § IA, nhịp chưa được kiểm bằng một lần duyệt thật.
    views: [{ slug: 'hang-cho-duyet', label: 'Hàng chờ duyệt' }],
  },
  {
    section: 'admin',
    fr: 'FR-48',
    title: 'Nối mảnh rời',
    epics: ['Đợt 1'],
    // FR-48 giờ đứng ở CẢ BA chỗ, và đó là đúng: chặn lúc một người tự khai (bề mặt A), chặn lúc
    // nạp cả một file (xem trước), và gỡ cái đã lọt (đây). Cùng một yêu cầu, ba khoảnh khắc khác
    // nhau của cùng một dữ liệu.
    views: [{ slug: 'hop-nhat-manh', label: 'Mảnh chưa nối' }],
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
  // RỖNG kể từ 12/08/2026 — cả mười lăm FR của Đợt 1 đều đã có ít nhất một màn dựng thử, nên
  // sidebar tự ẩn mục này.
  //
  // ⚠️ ĐỌC ĐÚNG CON SỐ RỖNG NÀY. Nó nói: mọi yêu cầu Đợt 1 đã có một HÌNH DẠNG để nhìn và để cãi.
  // Nó KHÔNG nói:
  //   · rằng chúng đã dev — xưởng chạy trên mock, chưa màn nào chạm vào dữ liệu thật;
  //   · rằng chúng đã đúng — ba màn (thu lời kể, hàng chờ duyệt, và nửa sau của tự khai) dựng từ
  //     § IA chứ không từ một hành trình có thật, vì UJ-1 và UJ-3 đã mất khi PRD được viết lại;
  //   · rằng FR-55 đã xong — cơ chế của nó là KÉO, người không mở web thì không bao giờ biết mình
  //     đã bị đưa vào phả, mà đó đúng là nhóm FR-55 sinh ra để bảo vệ (PRD §12 đã tự thú).
  //
  // FR của "Sau này" (prd.md §7) vẫn KHÔNG liệt kê ở đây — kể cả hai ô còn thiếu của màn chủ
  // (FR-22 lời giáo huấn, FR-41 sự kiện sắp tới). Đợt 1 cố ý dựng hai trong bốn ô.
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
