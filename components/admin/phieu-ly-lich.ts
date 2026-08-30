/**
 * PHIẾU LÝ LỊCH — hai phép thuần của cột phải sau lượt thu gọn 26/08/2026. Module THUẦN.
 *
 * ── Vì sao hai phép này tách ra khỏi `cot-khang-dinh.tsx` ─────────────────────────────────
 * Cả hai đều là LUẬT, không phải hình vẽ: hàng Con đứng ở đâu trong phiếu, và một câu nguồn nói
 * những gì. Luật thì kiểm được bằng test; hình vẽ thì phải mở trình duyệt ra nhìn. Trộn hai thứ
 * vào một file `.tsx` là biến luật thành thứ chỉ kiểm được bằng mắt.
 *
 * `docs/build-contract.md § Phân tầng`: file này KHÔNG import `@/core/*`.
 */
import type { MucTinCay } from './the-nguoi';

/**
 * Khoá giả của hàng CON. Không phải một `AssertionKind`: một khẳng định cha-con mang
 * `subject = CON` nên nó nằm trong hồ sơ của đứa con (AD-18). Ở phiếu này Con là DẪN XUẤT đọc từ
 * `relations` — bày được, bấm được, không sửa được từ đây.
 *
 * Hai gạch dưới hai đầu để không bao giờ đụng một `kind` thật (cột `kind` là `text`, `$type` chỉ
 * là TypeScript — một giá trị lạ vẫn tới được đây).
 */
export const KHOA_CON = '__con__';

/**
 * Chèn hàng CON vào đúng chỗ của một phiếu lý lịch.
 *
 * `core/person/chong.ts § HANG` xếp chồng theo thứ tự của DỮ LIỆU — tên, giới tính, sinh, mất,
 * cha mẹ, vợ chồng, nơi chốn, ghi chú. Phiếu lý lịch thì đọc theo NGƯỜI: phần lý lịch riêng
 * trước, rồi cả hộ gia đình liền một khối (cha mẹ · vợ chồng · con), rồi mới tới nơi chốn và ghi
 * chú. Con nối sau Vợ chồng vì đó là chỗ mắt tìm nó.
 *
 * Bản trước treo Con ở CUỐI panel, sau cả ghi chú — nên trên một người có ghi chú dài, hàng quan
 * trọng thứ hai của phiếu rơi xuống dưới đáy màn.
 *
 * Không có Vợ chồng thì bám Cha mẹ (người chưa lập gia đình mà đã có con trong phả cổ là chuyện
 * chép thật). Không có cả hai thì xuống cuối — KHÔNG lên đầu, kẻo Con đứng trên cả Tên.
 */
export function chenHangCon(khoaChong: readonly string[], coCon: boolean): string[] {
  const ra = [...khoaChong];
  if (!coCon) return ra;
  const neo = ra.lastIndexOf('union-partner');
  const neoPhu = neo === -1 ? ra.lastIndexOf('parent-child') : neo;
  if (neoPhu !== -1) {
    ra.splice(neoPhu + 1, 0, KHOA_CON);
    return ra;
  }
  /**
   * ── Không có neo nào: đừng thả xuống đáy (sửa 26/08 sau code review) ────────────────────
   *
   * Một người KHÔNG có cha mẹ được chép thì `chong` không hề có `parent-child` — khẳng định ấy
   * mang `subject = CON` nên nó nằm ở hồ sơ đứa con (AD-18). Vợ chưa được chép tên thì cũng
   * không có `union-partner`. Cả hai điều ấy đúng với **thuỷ tổ**, người mà danh sách con gần
   * như là toàn bộ hồ sơ.
   *
   * Bản trước rơi về `ra.length` ⇒ Con xuống sau cả `place` và `note`, đúng cái hỏng module này
   * tự khai là sinh ra để sửa. Nay chèn TRƯỚC hai loại đuôi ấy.
   */
  const duoi = ra.findIndex((k) => k === 'place' || k === 'note');
  ra.splice(duoi === -1 ? ra.length : duoi, 0, KHOA_CON);
  return ra;
}

/**
 * Nhãn tiếng Việt của ba mức tin cậy (FR-2). Giữ nguyên từ phả học —
 * `EXPERIENCE.md § Voice and Tone`.
 */
/**
 * Vỏ theo MỨC TIN CẬY — `DESIGN.md § Confidence`, ba hàng, cột đầu là **Mức**. MỘT bảng cho phiếu
 * (`cot-khang-dinh.tsx`) và màn Mâu thuẫn (`app/admin/mau-thuan`): chép sang màn là mất phép gác
 * của `tsc` khi thêm một mức, và là hai vỏ lệch nhau ở lượt sửa đầu (code review 6-5, 29/08).
 */
export const VO_TIN_CAY: Record<MucTinCay, string> = {
  'chac-chan': 'rounded-sm border border-tin-chac-chan px-1.5',
  'theo-loi-ke': 'rounded-sm border border-tin-loi-ke px-1.5',
  'ton-nghi': 'van-ton-nghi rounded-sm border border-dashed border-tin-ton-nghi px-1.5',
};

/**
 * Câu cảnh báo của một chồng mâu thuẫn — đúng LOẠI và đúng SỐ (story 6-5, sửa sau code review).
 *
 * "Hai lời khai cùng chỉ một người cha" đọc ngược nghĩa (nghe như hai lời khai ĐỒNG Ý về một
 * người); mâu thuẫn là hai NGƯỜI KHÁC NHAU cùng được khai vào một chỗ. Không nói "ruột": cụm có
 * thể là hai cha nuôi. Ba dòng trở lên thì không được nói "hai".
 */
export function cauMauThuan(khoaChong: string, soDong: number): string {
  const so = soDong > 2 ? `${soDong} lời khai` : 'Hai lời khai';
  if (khoaChong === 'parent-child') {
    return `${so} về những người cha (hay mẹ) khác nhau ở cùng một chỗ — không thể cùng đúng.`;
  }
  if (khoaChong === 'place') {
    return soDong > 2
      ? `${so} về quê quán, không cùng một nơi — một người có một quê.`
      : 'Hai quê quán khác nhau — một người có một quê.';
  }
  return soDong > 2 ? `${so}, không thể cùng đúng.` : 'Hai giá trị không thể cùng đúng.';
}

export const NHAN_TIN_CAY: Record<MucTinCay, string> = {
  'chac-chan': 'chắc chắn',
  'theo-loi-ke': 'theo lời kể',
  'ton-nghi': 'tồn nghi',
};

export type NguonDong = {
  chinhThuc: boolean;
  tinCay: MucTinCay;
  /** "theo lời kể của cụ Bảng", "giấy khai sinh"… — đã dựng thành câu ở tầng trên. */
  xuatXu: string;
  nguoiGhi: string;
  luc: string;
};

/**
 * NGUỒN của một khẳng định, tách làm HAI hàng: *cái này chắc tới đâu* và *nghe từ đâu, ai ghi*.
 *
 * ── Vì sao nguồn lùi vào "chi tiết" ─────────────────────────────────────────────────────
 * FR-1/FR-2 buộc mọi khẳng định MANG nguồn; chúng không buộc màn phải BÀY nguồn mọi lúc. Bản
 * trước in thẳng ba dòng chữ dưới mỗi giá trị — sáu chồng một người thành hai mươi dòng để nói
 * năm điều, và người vận hành phải lội qua xuất xứ mới đọc được thứ mình cần.
 *
 * ── Vì sao HAI hàng, không một ──────────────────────────────────────────────────────────
 * Nối làm một thì trong cột 360px nó quấn ba dòng, và người đọc phải tự tách hai ý bằng mắt.
 * Hai hàng ngắn đọc nhanh hơn ba hàng quấn — cùng số chữ, khác cách xếp.
 *
 * ── "Tầng …" chứ không "…" trần ─────────────────────────────────────────────────────────
 * Bỏ chữ "Tầng" thì một khẳng định ở Tầng chính thức khai với mức tin cậy `ton-nghi` in ra
 * *"chính thức · tồn nghi"* — đọc lên là tự mâu thuẫn, dù cả hai đều đúng và nói về hai TRỤC
 * khác nhau. `DESIGN.md § Vocabulary` vốn dùng "Tầng chính thức" làm tên gọi chuẩn.
 *
 * Phép bỏ trùng bên dưới VẪN cần: nó so với từ TRẦN của tầng, nên `Tầng tồn nghi · tồn nghi`
 * cũng không lọt. (Bản trước chú thích bảo phép ấy "thôi cần tới" — sai, và test vẫn chốt nó.)
 *
 * Mục rỗng thì BỎ HẲN (cùng luật với `tieu-su.ts`): một câu nguồn kết thúc bằng " · · " nói rằng
 * hệ này biết một thứ mà không chịu in ra.
 */
export function hangNguon(d: NguonDong): string[] {
  /**
   * "Tầng …" chứ không phải "…" trần (sửa 26/08/2026 sau khi soi bằng trình duyệt).
   *
   * Bỏ chữ "Tầng" đi thì một khẳng định ở Tầng chính thức khai với mức tin cậy `ton-nghi` in ra
   * *"chính thức · tồn nghi"* — đọc lên là tự mâu thuẫn, dù cả hai đều đúng và nói về hai trục
   * khác nhau. `DESIGN.md § Vocabulary` vốn dùng **"Tầng chính thức"** làm tên gọi chuẩn; đây chỉ
   * là trả nó về đúng tên.
   */
  const tang = d.chinhThuc ? 'Tầng chính thức' : 'Tầng tồn nghi';
  const tinCay = NHAN_TIN_CAY[d.tinCay];
  const muc: string[] = [tang];
  // So với TỪ TRẦN của tầng, không với cả cụm: "Tầng tồn nghi · tồn nghi" tuy không còn tự mâu
  // thuẫn nhưng vẫn là một chữ nói hai lần.
  if (tinCay !== tang.replace('Tầng ', '')) muc.push(tinCay);

  const sau: string[] = [];
  const xuatXu = d.xuatXu.trim();
  if (xuatXu) sau.push(xuatXu);

  const nguoiGhi = d.nguoiGhi.trim();
  const luc = d.luc.trim();
  // Ghi công là BẮT BUỘC, không phải trang trí (`DESIGN.md § Node người trên cây`) — nhưng
  // "ghi" không có ai đứng trước thì là một câu cụt, nên vắng tên thì chỉ còn cái ngày.
  if (nguoiGhi) sau.push(luc ? `${nguoiGhi} ghi ${luc}` : `${nguoiGhi} ghi`);
  else if (luc) sau.push(luc);

  // Hàng trên: cái này chắc tới đâu. Hàng dưới: nghe từ đâu, ai ghi. Hàng nào rỗng thì vắng hẳn.
  return [muc.join(' · '), sau.join(' · ')].filter((h) => h !== '');
}

/**
 * Dòng trong khối "nguồn và thao tác" có ĐÁNG in lại giá trị không.
 *
 * Hàng phiếu đã bày giá trị ngay phía trên rồi. In lại nó cách đó 30px, trong một kiểu chữ khác,
 * là đúng lớp lỗi chủ dự án đã chỉ ra một lần — *"các thông tin này đều đã có ở trên"* — và là
 * thứ đã phải gỡ khỏi dòng dẫn xuất dưới tên (story 6-7).
 *
 * Bốn ca, theo thứ tự quyết:
 *   1. MÂU THUẪN — cả hai giá trị phải thấy được cùng lúc, đó là toàn bộ việc phải làm ở đây;
 *   2. chồng nhiều dòng — không in giá trị thì hai nút "Nâng lên chính thức" / "Loại …" treo
 *      lơ lửng, không nói được chúng thuộc về giá trị nào;
 *   3. hàng bày CHÍNH giá trị ấy (`chuTrenHang` rỗng) — im, nó vừa đứng ngay trên;
 *   4. hàng bày CHIP — in khi chuỗi nói thêm điều gì. *"là con ruột của Nguyễn Quang Vinh"* mang
 *      `rel` mà chip không mang, nên đáng in; *"Kiều Thị Thanh Nga"* thì đúng bằng chữ trên chip.
 */
export function hienGiaTriTrongChiTiet(a: {
  mauThuan: boolean;
  soDong: number;
  giaTriGon: string;
  /** Chữ hàng phiếu đã bày — tên trên các chip quan hệ. Rỗng nghĩa là hàng bày chính giá trị. */
  chuTrenHang: readonly string[];
}): boolean {
  if (a.mauThuan || a.soDong > 1) return true;
  if (a.chuTrenHang.length === 0) return false;
  return !a.chuTrenHang.includes(a.giaTriGon.trim());
}

/**
 * Bỏ phần ĐẦU của chuỗi giá trị khi nó nói lại đúng cái nhãn đứng bên trái.
 *
 * `core/person/read-ops.ts` dựng chuỗi cho một màn KHÔNG có cột nhãn — *"tên Nguyễn Quang Hải"*,
 * *"giới tính nam"*, *"năm sinh 1989"* đọc trọn nghĩa khi đứng một mình. Cột phải nay xếp thành
 * hai cột (nhãn · giá trị), nên phần đầu ấy thành ra đọc hai lần.
 *
 * Cắt ở TẦNG BÀY, không sửa core: chuỗi của core vẫn phải đọc trọn nghĩa cho trang người của bề
 * mặt A (2-7) và cho nhật ký. Không khớp tiền tố nào thì trả nguyên chuỗi — thà thừa một chữ còn
 * hơn cắt cụt một câu mình không hiểu.
 */
const TIEN_TO: Record<string, string[]> = {
  name: ['tên '],
  gender: ['giới tính '],
  birth: ['năm sinh '],
  death: ['năm mất '],
  'union-partner': ['vợ/chồng với '],
  note: ['ghi chú: '],
};

export function gonGiaTri(khoaChong: string, chu: string): string {
  for (const t of TIEN_TO[khoaChong] ?? []) {
    if (chu.startsWith(t)) return chu.slice(t.length);
  }
  return chu;
}
