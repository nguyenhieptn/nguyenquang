/**
 * TIỂU SỬ CƠ BẢN của một người, dựng cho khối tóm tắt ở đỉnh cột phải — story 6-7. Module THUẦN.
 *
 * ── Mọi thứ ở đây là DẪN XUẤT ────────────────────────────────────────────────────────────
 * Không lượt đọc nào thêm: `getPerson` đã trả trọn `card`, và `xemHoSo` chỉ thôi vứt nó đi. Module
 * này chỉ chọn cái gì bày, theo thứ tự nào, và cái gì bấm được.
 *
 * ── Mục rỗng thì BỎ HẲN, không in "chưa rõ" ─────────────────────────────────────────────
 * Một dòng toàn "chưa rõ · chưa rõ · chưa rõ" là một dòng không ai đọc, và nó chiếm đúng chỗ mà
 * chồng khẳng định cần trong một cột 382.5px. Vắng một thứ thì im lặng về thứ ấy — chồng bên dưới
 * đã nói đủ rằng phả chưa biết.
 */

export type TheTieuSu = {
  card: {
    /** LUÔN lấy nguyên từ core: "1941–2019", "sinh 1985", hoặc "". Xem § Đừng dựng lại. */
    lifespan: string;
    doi: number | null;
    chi: string | null;
  };
};

export type MucTieuSu = {
  /** Chuỗi bày ra. */
  chu: string;
  /**
   * Chồng khẳng định tương ứng, khi có — bấm vào mục là mở thẳng biểu mẫu ghi thêm của chồng ấy.
   *
   * `null` cho ĐỜI và CHI: chúng tính lúc đọc (AD-5), không có hàng nào để sửa. Bày chúng như
   * bấm được là hứa một thứ không tồn tại.
   */
  khoaChong: 'name' | 'birth' | 'death' | null;
};

/**
 * Dòng tóm tắt: **năm sinh–năm mất · đời · chi**.
 *
 * `lifespan` nối vào chồng `birth`: đó là chồng người vận hành muốn mở khi thấy năm sinh sai.
 * (Năm mất nằm chung một chuỗi nên không tách được thành hai mục bấm riêng — mở `birth` rồi
 * người vận hành thấy cả hai chồng cạnh nhau, đúng chỗ cần tới.)
 */
export function dongTieuSu(t: TheTieuSu): MucTieuSu[] {
  const ra: MucTieuSu[] = [];
  if (t.card.lifespan) ra.push({ chu: t.card.lifespan, khoaChong: 'birth' });
  if (t.card.doi !== null) ra.push({ chu: `đời ${t.card.doi}`, khoaChong: null });
  if (t.card.chi) ra.push({ chu: `chi ${t.card.chi}`, khoaChong: null });
  return ra;
}

/**
 * Bỏ phần ĐẦU của chuỗi giá trị khi nó nói lại đúng cái nhãn đứng bên trái.
 *
 * `core/person/read-ops.ts` dựng chuỗi cho một màn KHÔNG có cột nhãn — *"tên Nguyễn Quang Hải"*,
 * *"giới tính nam"*, *"năm sinh 1989"* đọc trọn nghĩa khi đứng một mình. Cột phải nay xếp thành
 * hai cột (nhãn · giá trị), nên phần đầu ấy thành ra đọc hai lần:
 *
 *     Tên        tên Nguyễn Quang Hải
 *     Giới tính  giới tính nam
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
