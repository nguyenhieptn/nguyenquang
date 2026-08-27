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

/** Id của node mờ — chép từ `dat-nut-tam.ts § ID_TAM` để module này không phụ thuộc gì. */
const ID_TAM = '__sap-them__';

export type HanhDongPhim =
  /** Mở biểu mẫu thêm CON cho node đang chọn. */
  | { loai: 'them-con'; mocId: string }
  /** Mở biểu mẫu thêm CON cho CHA của node đang chọn — tức một người anh em. */
  | { loai: 'them-anh-em'; mocId: string }
  /** Node đang chọn chưa biết cha: KHÔNG ghi gì, và nói ra vì sao. */
  | { loai: 'thieu-cha' }
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
  /** Phần tử đang giữ con trỏ. `null` khi không xác định được. */
  o: ODangGo | null;
  /** Node đang chọn trên canvas. `null` = chưa chọn ai. */
  chonId: string | null;
  /** Cha của node đang chọn, do canvas tra từ bố cục. `null` = chưa biết cha. */
  chaCuaChon: string | null;
}): HanhDongPhim {
  if (a.phim !== 'Enter') return { loai: 'bo-qua' };
  if (dangGoTrongO(a.o)) return { loai: 'bo-qua' };
  // Chưa chọn ai thì không có mốc để gắn vào. Node mờ chưa tồn tại trong phả nên cũng không phải mốc.
  if (a.chonId === null || a.chonId === ID_TAM) return { loai: 'bo-qua' };

  if (!a.shift) return { loai: 'them-con', mocId: a.chonId };
  // Anh em: gắn vào CHA. Không có cha thì nói ra — lặng lẽ tạo một người rời là đẻ thêm một mảnh
  // chưa nối, mà đó đúng là con số bàn làm việc đang cố làm giảm.
  return a.chaCuaChon === null
    ? { loai: 'thieu-cha' }
    : { loai: 'them-anh-em', mocId: a.chaCuaChon };
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
  /** Biểu mẫu thêm người có đang mở không. */
  dangMo: boolean;
  /** Đã gõ gì chưa — hôm nay suy từ họ tên, trường duy nhất chảy ngược lên nơi gọi. */
  daGo: boolean;
  /** Đã hỏi rồi và đang chờ `Esc` lần hai. */
  dangHoi: boolean;
}): HanhDongEsc {
  if (a.phim !== 'Escape') return { loai: 'bo-qua' };
  if (!a.dangMo) return { loai: 'bo-qua' };
  // Lần hai: người dùng đã đọc câu hỏi và vẫn bấm Esc. Bỏ.
  if (a.dangHoi) return { loai: 'dong' };
  return a.daGo ? { loai: 'hoi' } : { loai: 'dong' };
}
