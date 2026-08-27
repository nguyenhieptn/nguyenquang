/**
 * PHÍM TẮT trên canvas — story 6-9. Module THUẦN.
 *
 * `Enter` thêm con · `Shift+Enter` thêm anh em. Người chép một trang phả mười người không phải
 * rời tay khỏi bàn phím mười lần.
 *
 * ── Vì sao KHÔNG dùng `Tab` ─────────────────────────────────────────────────────────────
 * `Tab` là phím của TRÌNH DUYỆT — cách duy nhất người dùng bàn phím đi qua giao diện. Chiếm nó
 * trên canvas là dựng một cái bẫy: vào được mà không ra được, vi phạm chính
 * `EXPERIENCE.md § Accessibility Floor`. `Shift+Enter` không đụng tới nó một chút nào.
 *
 * ── "Anh em" không phải một hướng có sẵn ───────────────────────────────────────────────
 * `HuongThem` (`dat-nut-tam.ts:18`) có bốn hướng và không có `anh-em`. Anh em = thêm một người
 * con nữa cho CÙNG người cha, tức `huong: 'con'` gắn vào **cha của node đang chọn**. `NutCanvas`
 * đã mang `chaId` nên tính được ngay, không cần lượt đọc nào.
 */

/**
 * Id của node mờ. IMPORT chứ không chép (sửa 26/08/2026 sau code review).
 *
 * Bản đầu chép tay chuỗi `'__sap-them__'` với lý do *"để module này không phụ thuộc gì"* —
 * nhưng `dat-nut-tam.ts` là module THUẦN cùng thư mục, nhập nó không tốn gì. Cái giá của bản
 * chép tay đo được: đổi hằng ở nguồn thì AC 5 hỏng IM LẶNG (node mờ thành mốc hợp lệ) mà cả
 * 329 bài test vẫn xanh, vì bài test cũng chép tay đúng chuỗi ấy.
 */
import { ID_TAM } from './dat-nut-tam';

export type HanhDongPhim =
  /** Mở biểu mẫu thêm CON cho node đang chọn. */
  | { loai: 'them-con'; mocId: string }
  /** Mở biểu mẫu thêm CON cho CHA của node đang chọn — tức một người anh em. */
  | { loai: 'them-anh-em'; mocId: string }
  /** Node đang chọn là gốc mảnh THẬT — chưa ai truy ra đời trên. KHÔNG ghi gì, nói ra vì sao. */
  | { loai: 'thieu-cha' }
  /**
   * Cha CÓ trong phả nhưng không nằm trong bán kính đang xem, nên bố cục không mang `chaId`.
   *
   * Tách khỏi `thieu-cha` là bắt buộc (sửa 26/08/2026 sau code review). `core/tree/ops.ts` cảnh
   * báo đúng cái bẫy này: *"Người này có thật sự là cụ xa nhất hiện biết của mảnh, hay chỉ tình
   * cờ đứng ở rìa bán kính? Hai chuyện khác hẳn nhau, mà `parentNodeId === null` thì không phân
   * biệt được"* — và đẻ ra `isFragmentRoot` để phân biệt. Gộp hai ca lại thì ở bán kính mặc
   * định, MỌI node ở rìa vùng đều bị báo "chưa biết cha": một câu SAI về cuốn phả, trong một sản
   * phẩm mà cả kiến trúc dựng lên để không nói sai về cuốn phả.
   */
  | { loai: 'cha-ngoai-vung' }
  /**
   * Biểu mẫu đang mở CÓ CHỮ chưa ghi, và phím này sẽ thay nó bằng một mốc khác. Hỏi một lần.
   *
   * Bản đầu để `Enter` thay biểu mẫu vô điều kiện: `BieuMauThemNguoi` khoá theo mốc
   * (`key={khoa}`) nên đổi mốc là dựng lại, mất trắng cả tên lẫn xuất xứ, KHÔNG một câu hỏi —
   * trong khi `Esc` ngay cạnh thì lịch sự hỏi. Cửa `Esc` được bịt, cửa `Enter` để mở toang, mà
   * `Enter` mới là phím trung tâm của story.
   */
  | { loai: 'hoi-thay' }
  /** Không phải việc của canvas — trả phím về cho trình duyệt, KHÔNG `preventDefault`. */
  | { loai: 'bo-qua' };

export type ODangGo = {
  /** `tagName` của phần tử đang giữ con trỏ, đã viết hoa như DOM trả về. */
  the: string;
  contentEditable: boolean;
};

/**
 * Con trỏ có đang ở chỗ mà `Enter` ĐÃ CÓ NGHĨA RIÊNG không.
 *
 * Đây là HÀNG RÀO CHÍNH của story, và nó rộng hơn "ô nhập" vì phím được nghe ở cấp CỬA SỔ:
 *
 *   · `INPUT` · `TEXTAREA` · `SELECT` · `contenteditable` — biểu mẫu thêm người nằm ngay cột
 *     bên, cùng màn, và `Enter` ở đó là **gửi**. Bắt luôn phím ấy thì gõ tên xong nhấn `Enter`
 *     sẽ mở thêm một biểu mẫu nữa đè lên biểu mẫu đang gõ dở — mất trắng chữ, đúng lớp lỗi
 *     `<details>` nuốt biểu mẫu mà lượt review 6-7 vừa bắt.
 *   · `BUTTON` · `A` · `SUMMARY` — `Enter` ở đó là **bấm**. Cướp nó thì một cú Enter vừa bấm nút
 *     vừa mở biểu mẫu, hai việc cho một phím.
 *
 * Vì sao nghe ở cửa sổ chứ không ở vỏ canvas: ghi xong một người thì trang dời tâm sang người
 * mới và dựng lại, focus rơi về `body` — `Enter` kế tiếp sẽ không tới vỏ nữa, và "gõ một mạch"
 * đứt ngay ở người thứ hai.
 */
const THE_CO_NGHIA_RIENG = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A', 'SUMMARY'];

export function dangGoTrongO(o: ODangGo | null): boolean {
  if (!o) return false;
  if (o.contentEditable) return true;
  return THE_CO_NGHIA_RIENG.includes(o.the);
}

export function hanhDongPhim(a: {
  phim: string;
  shift: boolean;
  /**
   * `ctrl` · `meta` · `alt` — bất kỳ cái nào bật thì tổ hợp thuộc về người khác.
   * `Ctrl+Enter` / `Cmd+Enter` là thành ngữ *gửi* phổ biến nhất trên web; nuốt nó là mở một
   * biểu mẫu ghi mà người vận hành không hề định mở.
   */
  boTro: boolean;
  /** `KeyboardEvent.repeat` — phím đang tự lặp vì bị giữ. */
  lap: boolean;
  /** Phần tử đang giữ con trỏ. `null` khi không xác định được. */
  o: ODangGo | null;
  /** Node đang chọn trên canvas. `null` = chưa chọn ai. */
  chonId: string | null;
  /** Cha của node đang chọn, do canvas tra từ bố cục. `null` = không có trong bố cục. */
  chaCuaChon: string | null;
  /** Node đang chọn có phải gốc mảnh THẬT không (`isFragmentRoot` của core). */
  laGocManh: boolean;
  /** Biểu mẫu thêm người đang mở cho mốc nào. `null` = không mở. */
  mocDangMo: string | null;
  /** Biểu mẫu đang mở đã có chữ chưa. */
  daGo: boolean;
  /** Đã hỏi "thay biểu mẫu?" rồi và đang chờ phím lần hai. */
  dangHoi: boolean;
}): HanhDongPhim {
  if (a.phim !== 'Enter') return { loai: 'bo-qua' };
  if (a.boTro) return { loai: 'bo-qua' };
  // Giữ phím không được vượt qua một câu hỏi: `keydown` tự lặp ~30 lần/giây, nên nhịp lặp ngay
  // sau nhịp đầu sẽ trả lời hộ người dùng trong 33 mili-giây.
  if (a.lap) return { loai: 'bo-qua' };
  if (dangGoTrongO(a.o)) return { loai: 'bo-qua' };
  // Chưa chọn ai thì không có mốc để gắn vào. Node mờ chưa tồn tại trong phả nên cũng không phải mốc.
  if (a.chonId === null || a.chonId === ID_TAM) return { loai: 'bo-qua' };

  let mocMoi: string;
  if (!a.shift) {
    mocMoi = a.chonId;
  } else if (a.chaCuaChon !== null) {
    // Anh em: gắn vào CHA — thêm một người con nữa cho cùng người ấy.
    mocMoi = a.chaCuaChon;
  } else {
    // Không có `chaId` trong bố cục. HAI ca khác hẳn nhau, và gộp chúng là nói sai về phả.
    return a.laGocManh ? { loai: 'thieu-cha' } : { loai: 'cha-ngoai-vung' };
  }

  // Biểu mẫu đã mở sẵn cho đúng mốc ấy ⇒ không đụng vào. Mở lại là đặt `hoTen` về rỗng, tức
  // nhãn node mờ trên canvas quay về "người sắp thêm" trong khi ô tên vẫn đầy chữ.
  if (a.mocDangMo === mocMoi) return { loai: 'bo-qua' };
  // Thay một biểu mẫu đang có chữ ⇒ hỏi một lần, cùng nhịp hai bước với `Esc`.
  if (a.mocDangMo !== null && a.daGo && !a.dangHoi) return { loai: 'hoi-thay' };

  return a.shift ? { loai: 'them-anh-em', mocId: mocMoi } : { loai: 'them-con', mocId: mocMoi };
}

/**
 * `Escape` — huỷ thao tác đang dở.
 *
 * ── Luật chung của app canvas ───────────────────────────────────────────────────────────
 * Figma · Miro · Excalidraw · tldraw · Obsidian Canvas · MindNode đều thống nhất ba điều:
 * `Esc` huỷ thứ đang dở; đóng từ TRONG ra NGOÀI (danh sách gợi ý trước, biểu mẫu sau, bỏ chọn
 * sau nữa); và `Esc` chạy **cả khi con trỏ đang ở trong ô nhập** — khác `Enter`, vì trong ô nhập
 * `Enter` là *gửi* còn `Esc` là *thôi*.
 *
 * ── Chỗ chúng KHÔNG giống nhau, và là chỗ phải quyết ────────────────────────────────────
 * Node mới ĐÃ GÕ CHỮ thì sao? Figma/Excalidraw/MindNode giữ lại chữ (Esc chỉ thoát chế độ sửa);
 * Notion/Linear đóng và mất chữ.
 *
 * "Giữ lại" không dùng được ở đây: một người chưa có XUẤT XỨ thì không ghi vào phả được (FR-1),
 * nên không có chỗ nào để giữ. Và "mất trắng chữ, không một câu hỏi" đúng là tội mà lượt code
 * review 6-7 vừa bắt ở chỗ `<details>` nuốt biểu mẫu.
 *
 * Nên: **trống thì đóng ngay; đã gõ thì hỏi một lần.** Hai lần `Esc` mới bỏ.
 */
export type HanhDongEsc =
  /** Đóng biểu mẫu ngay — chưa gõ gì, không có gì để mất. */
  | { loai: 'dong' }
  /** Đã gõ: hỏi một câu, `Esc` lần nữa mới bỏ. */
  | { loai: 'hoi' }
  /** Không phải việc của canvas — trả phím về cho trình duyệt. */
  | { loai: 'bo-qua' };

export function hanhDongEsc(a: {
  phim: string;
  /** `KeyboardEvent.repeat` — giữ phím không được vượt qua câu hỏi. */
  lap: boolean;
  /** Biểu mẫu thêm người có đang mở không. */
  dangMo: boolean;
  /** Đã gõ gì chưa — do CHÍNH biểu mẫu báo ra (`onDoiBan`), nên phủ mọi ô kể cả xuất xứ. */
  daGo: boolean;
  /** Đã hỏi "bỏ chữ vừa gõ?" rồi và đang chờ `Esc` lần hai. */
  dangHoi: boolean;
}): HanhDongEsc {
  if (a.phim !== 'Escape') return { loai: 'bo-qua' };
  /**
   * Giữ `Esc` một giây thì `keydown` tự lặp ~30 lần/giây: nhịp một đặt câu hỏi, nhịp lặp ~33ms
   * sau trả `dong`. Cửa sổ để người đọc được câu hỏi rộng đúng 33 mili-giây — tức là không có.
   * Bắt được bằng cách nghĩ tới ngón tay, không bằng cổng nào.
   */
  if (a.lap) return { loai: 'bo-qua' };
  if (!a.dangMo) return { loai: 'bo-qua' };
  // Lần hai: người dùng đã đọc câu hỏi và vẫn bấm Esc. Bỏ.
  if (a.dangHoi) return { loai: 'dong' };
  return a.daGo ? { loai: 'hoi' } : { loai: 'dong' };
}
