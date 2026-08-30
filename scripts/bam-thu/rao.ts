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
/** Tài khoản thử: `thu.quan.tri.<mã>` · `thu.thanh.vien.<mã>` (chưa gắn thì không có gì để ghi). */
const TEN_TAI_KHOAN_THU = /^thu\.(quan\.tri|thanh\.vien)\.[0-9a-f]+$/;
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
    return { ok: false, rao: 'tai-khoan', ly: `SOI_TEN="${ten ?? ''}" không phải tài khoản thử (thu.quan.tri.<mã> / thu.thanh.vien.<mã>)` };
  }
  return { ok: true };
}

/** Sau đăng nhập, thanh trên bày tên người vận hành — phải mang họ thử. */
export function raoThanhTren(chuThanhTren: string): KetQuaRao {
  if (!chuThanhTren.includes(HO_THU)) {
    return { ok: false, rao: 'thanh-tren', ly: `thanh trên không mang họ thử "${HO_THU}" — server này đang phục vụ một dòng họ khác` };
  }
  return { ok: true };
}

/** Tên tài khoản thành viên của cùng dòng họ thử, suy từ tên quản trị. */
export function tenThanhVienTu(tenQuanTri: string): string {
  return tenQuanTri.replace('thu.quan.tri.', 'thu.thanh.vien.');
}
