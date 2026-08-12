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
  {
    // NHỊP CUỐI của trục zoom: tộc → chi → đường của mình → MỘT NGƯỜI.
    //
    // Chưa nằm trong § Key Flows — Luồng 3 (đang dừng ở tầng 3), nhưng KHÔNG bịa: § Component
    // Patterns › Node người chốt "Chạm → mở trang một người. Không có menu ngữ cảnh, không nhấn-
    // giữ." Đây là thao tác thường gặp nhất của cả sản phẩm, mà trước 12/08/2026 không luồng nào
    // đi qua nó — nên trang người là màn duy nhất người duyệt không bao giờ gặp khi đi theo bản đồ.
    //
    // ⚠️ Việc phải làm: thêm nhịp này vào EXPERIENCE.md § Key Flows — Luồng 3.
    slug: 'trang-nguoi',
    label: 'Trang một người',
    trigger: 'Chạm vào một người trên cây',
    viewport,
    note: 'FR-1 lộ ra ở ĐÂY và chỉ ở đây: mức tin cậy gắn vào từng khẳng định, kèm ai khai và dựa vào đâu',
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
      {
        slug: 'tim-nguoi-than',
        label: 'Tìm người thân',
        trigger: 'Gõ tên bố: Nguyễn Quang Hùng',
        query: 'v=go-ten',
        note: 'Tìm là thao tác CHẶN TRÙNG (FR-48), không phải tra cứu — mọi đường vào việc thêm đều qua đây',
      },
      {
        slug: 'khong-tim-thay',
        label: 'Không tìm thấy',
        trigger: 'Không có kết quả khớp',
        note: 'MÀN QUAN TRỌNG NHẤT ĐỢT 1 — trạng thái mặc định nhiều tháng đầu, không phải lỗi',
      },
      {
        slug: 'dang-nhap',
        label: 'Đăng nhập / nhận chỗ của mình',
        trigger: 'Bấm “Không ai cả — thêm bố vào phả”',
        query: 'v=tai-khoan',
        // MỘT bước, đúng số bước của spine — dù màn có HAI lớp (tài khoản, rồi nhận chỗ). Tách
        // đôi trên bản đồ là sửa hành trình, mà hành trình sửa ở EXPERIENCE.md trước rồi file này
        // mới theo sau. Muốn xem cả hai lớp: mở /uiworkshop/view/dang-nhap, màn bày đủ ba trạng
        // thái xếp chồng.
        note: 'FR-64 tới đây mới cần: xem cây thì không cần gì cả (FR-11). Màn có HAI lớp — tài khoản, rồi nhận chỗ của mình.',
      },
      {
        slug: 'them-nguoi-than',
        label: 'Thêm người thân',
        trigger: 'Xác thực xong',
        query: 'v=b1',
        // Cũng MỘT bước: bốn câu hỏi + màn trả công là một nhịp của hành trình, không phải năm.
        note: 'FR-3: vào thẳng Tầng tồn nghi, hiện ngay, không chờ duyệt. NFR-5: bốn câu dùng hết ngân sách 4 màn.',
      },
      {
        slug: 'tim-nguoi-than',
        label: 'Tìm người thân',
        trigger: 'Gõ tên anh trai — thấy đúng 1 người',
        query: 'v=thay-mot-nguoi',
        note: 'Nhịp trả công cho bước khai vừa rồi: dòng họ nhận ra Khánh',
      },
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
  {
    id: 'khoa-nhan-cho',
    title: 'Khoa mở web và thấy tên mình đã ở đó',
    persona: 'Nguyễn Quang Khoa, sinh 2001, anh trai Khánh — chưa từng mở web, được em nhắn',
    // NỢ TÀI LIỆU. Luồng này CHƯA nằm trong § Key Flows, nên `source: null`.
    //
    // Nhưng nó KHÔNG bịa: § State Patterns › "Vừa được thêm bởi người khác (FR-55)" đã tả đúng
    // nhịp cuối — *thông báo lưu sẵn trên node, hiện ra lần đầu người đó đăng nhập và gắn được
    // vào node của mình, kèm ba đường: sửa · ẩn · từ chối in*. Hai nhịp đầu là hệ quả trực tiếp
    // của Luồng 1: Khánh vừa ghi về anh mình xong.
    //
    // Vì sao đáng dựng thành luồng thay vì để yên: FR-55 là yêu cầu DUY NHẤT của Đợt 1 mà người
    // hưởng lợi không phải người đang thao tác. Không có một hành trình đứng từ phía Khoa thì
    // không ai kiểm được rằng ba quyền kia có thật sự với tới được hay không — và bản đồ sẽ im
    // lặng đúng chỗ cần nói.
    //
    // ⚠️ Việc phải làm: distill vào EXPERIENCE.md § Key Flows rồi trỏ `source` về đó. Trước khi
    // distill, cần người duyệt xác nhận nhịp mở đầu — hiện đang giả định Khoa được em nhắn, mà
    // giả định ấy chưa ai kể.
    source: null,
    steps: [
      {
        slug: 'dong-ho-dang-song',
        label: 'Dòng họ đang sống',
        trigger: 'Em trai nhắn: “anh có tên trên phả rồi”',
        note: 'Chưa đăng nhập vẫn xem được (FR-11) — kể cả xem chính mình',
      },
      {
        slug: 'dang-nhap',
        label: 'Nhận chỗ của mình',
        trigger: 'Thấy tên mình trên cây, bấm vào',
        query: 'v=khai-minh-la-ai',
        note: 'Ca NGƯỢC với Khánh: tên đã nằm sẵn trên phả do người khác ghi, nên đây là NHẬN một chỗ có sẵn — cần bảo lãnh, không phải tự khai',
      },
      {
        slug: 'toi',
        label: 'Ai đã ghi gì về mình',
        trigger: 'Ban tu phả xác nhận',
        query: 'v=vua-gan',
        climax: true,
        note: 'FR-55: ba đường bày NGANG NHAU — sửa · ẩn khỏi phần công khai (nhánh vẫn liền) · từ chối in. Quyền từ chối mà khó tìm hơn quyền sửa thì không còn là quyền.',
      },
    ],
  },
  {
    id: 'thu-loi-ke-cua-ba',
    title: 'Bà kể, và lời kể có chỗ đứng trên phả',
    persona: 'Nguyễn Quang Hiệp ngồi thu · bà Nguyễn Thị Lành kể — hai người, một máy điện thoại',
    // ⚠️⚠️ NỢ NẶNG NHẤT CỦA CẢ SPINE, đọc kỹ trước khi tin luồng này.
    //
    // Hành trình gốc UJ-1 — bà Nhàn 84 tuổi, cháu Quân, "hồi đói Ất Dậu" — ĐÃ MẤT khi PRD được
    // viết lại, và PRD không nằm trong git nên không khôi phục được. PRD từng gắn nhãn đó là
    // "hành trình quan trọng nhất của sản phẩm".
    //
    // Luồng dưới đây KHÔNG phải bản khôi phục. Nó suy ra từ § Interaction Primitives (một nút to,
    // một trạng thái đang ghi, một nút dừng) + § IA (đồng thuận nằm TRONG luồng thu) + dữ liệu
    // seed. Nhân vật lấy từ chính seed, không bịa tên mới. Nó đúng LUẬT, và chưa chắc đúng NHỊP —
    // nhịp chỉ có được khi người duyệt kể lại một lần thu có thật.
    //
    // Vì sao vẫn dựng thay vì để trống: việc thu là việc DUY NHẤT của sản phẩm có hạn dùng — các
    // cụ không đợi. Một màn không có luồng nào dẫn tới là một màn không ai kiểm được, và đây là
    // màn ít được phép hỏng nhất.
    source: null,
    steps: [
      {
        slug: 'thu-loi-ke',
        label: 'Sẵn sàng thu',
        trigger: 'Ngồi xuống cạnh bà, mở web',
        query: 'v=san-sang',
        note: 'Một nút, và không có gì khác để bấm nhầm — mỗi nút thêm vào là một lần ngắt mạch câu chuyện',
      },
      {
        slug: 'thu-loi-ke',
        label: 'Đang thu',
        trigger: 'Bấm “Bắt đầu thu”, rồi đặt máy xuống bàn',
        query: 'v=dang-ghi',
        note: 'KHÔNG dạng sóng: nó kéo mắt người cầm máy xuống màn hình đúng lúc phải nhìn người đang kể',
      },
      {
        slug: 'thu-loi-ke',
        label: 'Ai được nghe bản này',
        trigger: 'Bà kể xong, bấm “Dừng và lưu”',
        query: 'v=dong-thuan',
        note: 'FR-49 chỉ có nghĩa khi bà CÒN NGỒI ĐÓ. Tách thành màn cài đặt là hỏi sau khi bà đã về — lúc ấy người trả lời là con cháu, không phải người có quyền trả lời.',
      },
      {
        slug: 'thu-loi-ke',
        label: 'Sổ bản đã thu',
        trigger: 'Bà chọn “Cả họ nghe được”',
        query: 'v=da-thu',
        note: 'Bóc tách là việc SAU — màn nói thẳng điều đó, im lặng khiến người đi thu tưởng mình còn phải làm gì nữa',
      },
      {
        slug: 'trang-nguoi',
        label: 'Lời kể đứng trên trang cụ',
        trigger: 'Mở trang cụ mà bà vừa kể về',
        query: 'v=cu-to',
        climax: true,
        // Cao trào MƯỢN màn của một FR khác, y như Luồng 2 mượn ca-toc. Phần thưởng của việc đi
        // thu không phải một dòng "đã lưu 6 phút 12 giây" — mà là lời bà nằm cạnh tên cụ, ở chỗ
        // con cháu sẽ mở ra đọc.
        note: 'FR-47 + FR-1: bản thu thành NGUỒN của khẳng định, không nằm chết trong một thư mục ghi âm',
      },
    ],
  },
  {
    id: 'hiep-don-pha',
    title: 'Đợt nạp thứ hai — hai mảnh tìm thấy nhau',
    persona: 'Nguyễn Quang Hiệp, vài tuần sau ngày 0, khi chi trong Nam gửi khung của họ',
    // NỢ TÀI LIỆU. § Key Flows chưa có luồng nào cho việc dọn phả, và hành trình gốc UJ-3 (duyệt
    // lên Tầng chính thức) cũng đã mất cùng UJ-1.
    //
    // Khác với luồng thu lời kể, luồng này có chỗ dựa chắc hơn: seed đã dựng sẵn ca khó nhất của
    // FR-48 từ đầu (cụ Đệ có hai bản — `n-002` ở mảnh chính, `n-101` ở chi trong Nam), và
    // DONG_KHUNG_DOT_SAU là đúng đợt nạp làm ca ấy lộ ra. Nhịp ở đây suy ra từ DỮ LIỆU, không từ
    // một câu chuyện tưởng tượng.
    source: null,
    steps: [
      {
        slug: 'xem-truoc-so-khop',
        label: 'Xem trước đợt hai',
        trigger: 'Chi trong Nam gửi khung của họ',
        note: 'Giờ mới có trạng thái “khớp người có sẵn” — ngày 0 hệ thống trống nên không dòng nào khớp được',
      },
      {
        slug: 'hop-nhat-manh',
        label: 'Hai mảnh, một cụ',
        trigger: 'Bot thấy cụ Đệ đang có hai bản',
        climax: true,
        note: 'Thao tác đắt nhất sản phẩm: nối đúng thì hai nhánh tìm lại nhau sau mấy chục năm, nối sai thì hỏng phả cả một chi. Không có đường nhanh, không cái nào chọn sẵn.',
      },
      {
        slug: 'hang-cho-duyet',
        label: 'Nâng những người đã đủ nguồn',
        trigger: 'Chọn “là cùng một người”, hai mảnh về một cây',
        note: 'Duyệt KHÔNG phải cho phép xuất hiện — những người này đã đứng trên cây từ lâu. Duyệt là nâng mức.',
      },
      {
        // CỐ Ý để trống. Mock của xưởng là MỘT trạng thái tĩnh — nó vẽ được phả TRƯỚC khi nối,
        // không vẽ được phả SAU khi nối. Nhúng `ca-toc` vào đây thì bản đồ hiện "2 mảnh chưa nối"
        // ngay dưới một bước tên là "đã nối xong": đúng thứ bản đồ luồng sinh ra để chống.
        //
        // Ô trống này là lỗ hổng THẬT và nên đếm vào "bước hụt": muốn vẽ được nhịp trả công của
        // cả luồng thì seed phải có trạng thái thứ hai (sau hợp nhất).
        slug: null,
        label: 'Cây liền lại — số mảnh về 0',
        trigger: 'Nâng xong',
        note: 'CHƯA DỰNG ĐƯỢC: mock chỉ có một trạng thái tĩnh (trước khi nối). Cần seed trạng thái sau hợp nhất, nếu không bản đồ sẽ nói dối.',
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
