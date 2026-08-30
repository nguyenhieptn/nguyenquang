/**
 * BA RÀO của kịch bản ghi (story 7-1) — mỗi rào là một hàm THUẦN, có test, và hụt một rào là dừng.
 *
 * Kịch bản này là script DUY NHẤT trong repo được bấm nút ghi. Bộ đo (`soi`) không bao giờ bấm —
 * sự cố 28/08 (40 khẳng định thử trên phả thật) là lý do. Nên trước khi bấm gì, ba câu hỏi độc lập
 * phải cùng trả lời "đây là dòng họ thử": tên clan trong DB · tên tài khoản · thanh trên sau khi
 * đăng nhập. Ba rào vì ba nguồn khác nhau: một cái sai (ghim nhầm cổng, gõ nhầm tên) thì hai cái
 * kia còn đứng.
 */
export type KetQuaRao = { ok: true } | { ok: false; rao: 'clan' | 'tai-khoan' | 'thanh-tren'; ly: string };

/** Tên dòng họ thử do `core/gates/dong-ho-thu.ts` đặt: luôn bắt đầu bằng "Dòng họ thử". */
export const TIEN_TO_CLAN_THU = 'Dòng họ thử';
/**
 * `SOI_TEN` phải là tài khoản QUẢN TRỊ thử `thu.quan.tri.<mã>`: kịch bản bề mặt B cần nó, và tên
 * thành viên SUY từ nó (`tenThanhVienTu`). Đưa tên thành viên vào thì K1/K2 đứng trước cửa khoá
 * với một lỗi timeout khó hiểu (code review 7-1).
 */
const TEN_TAI_KHOAN_THU = /^thu\.quan\.tri\.[0-9a-f]+$/;
/** Họ của mọi người trong dòng họ thử. */
export const HO_THU = 'Nguyễn Thử';

export function raoClan(tenClan: string | null | undefined): KetQuaRao {
  if (!tenClan) return { ok: false, rao: 'clan', ly: 'không đọc được tên clan của GIAPHA_CLAN_ID — không có clan ấy, hoặc không nối được DB' };
  if (!tenClan.startsWith(TIEN_TO_CLAN_THU)) {
    return { ok: false, rao: 'clan', ly: `clan "${tenClan}" KHÔNG phải dòng họ thử — kịch bản ghi không bao giờ chạy trên phả thật` };
  }
  return { ok: true };
}

export function raoTaiKhoan(ten: string | undefined): KetQuaRao {
  if (!ten || !TEN_TAI_KHOAN_THU.test(ten)) {
    return { ok: false, rao: 'tai-khoan', ly: `SOI_TEN="${ten ?? ''}" không phải tài khoản quản trị thử (thu.quan.tri.<mã>; tên thành viên suy từ nó)` };
  }
  return { ok: true };
}

/**
 * Sau đăng nhập, màn bày tên người vận hành (bề mặt B: thanh trên; bề mặt A: người ở tâm) — phải
 * mang họ thử VÀ mã của clan mà `GIAPHA_CLAN_ID` trỏ (`"<mã> Nguyễn Thử"`): hai dòng họ thử sống
 * cùng lúc thì server ghim clan A mà đếm revision ở clan B là mọi kịch bản ✗ giả (code review 7-1).
 */
export function raoThanhTren(chuMan: string, maClan: string): KetQuaRao {
  if (!chuMan.includes(HO_THU)) {
    return { ok: false, rao: 'thanh-tren', ly: `màn không mang họ thử "${HO_THU}" — server này đang phục vụ một dòng họ khác` };
  }
  if (maClan && !chuMan.includes(`${maClan} ${HO_THU}`)) {
    return { ok: false, rao: 'thanh-tren', ly: `màn mang họ thử nhưng không phải mã "${maClan}" của GIAPHA_CLAN_ID — server ghim một dòng họ thử KHÁC` };
  }
  return { ok: true };
}

/** Tên tài khoản thành viên của cùng dòng họ thử, suy từ tên quản trị. */
export function tenThanhVienTu(tenQuanTri: string): string {
  return tenQuanTri.replace('thu.quan.tri.', 'thu.thanh.vien.');
}
