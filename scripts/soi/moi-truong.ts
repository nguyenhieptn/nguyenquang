/**
 * MÔI TRƯỜNG của bộ đo — đọc một chỗ, kiểm một chỗ.
 *
 * Bốn script cũ đọc biến theo bốn kiểu: hai script nhúng sẵn `http://100.94.148.68:3000` và
 * `nguyen.quang.hiep` làm mặc định, hai script bắt khai. Mặc định trỏ vào bản đang chạy thật là
 * thứ nguy hiểm nhất trong cả bộ: gõ nhầm một lệnh là mở trình duyệt vào phả của dòng họ.
 *
 * Nay: KHÔNG mặc định nào cả. Thiếu biến thì dừng, và nói rõ thiếu biến nào.
 */
import 'dotenv/config';
import { networkInterfaces } from 'node:os';
import { canHangRaoXa } from './luat';

/**
 * Mọi địa chỉ đang gắn trên máy này — loopback, LAN, **và Tailscale**.
 *
 * Dự án chạy server trên IP Tailscale (`npm run dev:vpn`) vì chủ dự án vào từ máy khác. Không kể
 * địa chỉ ấy vào "máy này" thì hàng rào từ chối chính cái server mình vừa dựng.
 */
export function diaChiCuaMay(): string[] {
  return Object.values(networkInterfaces())
    .flatMap((ds) => ds ?? [])
    .map((d) => d.address)
    .filter(Boolean);
}

export type MoiTruong = {
  goc: string;
  /** `null` khi lượt chạy chỉ đụng màn công khai — lúc ấy không cần tài khoản nào. */
  danhTinh: { ten: string; mk: string } | null;
};

/**
 * Đọc và kiểm. Trả lỗi thành chuỗi thay vì `process.exit` — để test được, và để nơi gọi quyết
 * định in ra sao.
 */
export type BienMoiTruong = Record<string, string | undefined>;

export function docMoiTruong(
  env: BienMoiTruong,
  /**
   * Lượt chạy này có đụng màn cần đăng nhập không.
   *
   * `false` thì `SOI_TEN`/`SOI_MK` KHÔNG bắt buộc: bốn màn công khai (`/` · `/tim` · `/dang-nhap`
   * · `/nguoi/[id]`) đo được mà không cần tài khoản nào, và bắt khai mật khẩu để đo trang chủ là
   * một rào cản không có lý do — rào cản không có lý do thì người ta lách bằng cách thôi chạy cổng.
   */
  canDangNhap = true,
): { ok: true; gt: MoiTruong } | { ok: false; loi: string } {
  const thieu: string[] = [];
  if (!env.SOI_GOC) thieu.push('SOI_GOC=<địa chỉ, ví dụ http://127.0.0.1:3000>');
  if (canDangNhap && !env.SOI_TEN) thieu.push('SOI_TEN=<tên đăng nhập>');
  if (canDangNhap && !env.SOI_MK) thieu.push('SOI_MK=<mật khẩu>');
  if (thieu.length > 0) {
    return {
      ok: false,
      loi: 'Thiếu biến môi trường:\n  ' + thieu.join('\n  ') + '\nKhông có mặc định nào — xem docs/van-hanh.md § Bộ đo.',
    };
  }

  const goc = env.SOI_GOC as string;
  const rao = canHangRaoXa(goc, env.SOI_CHO_PHEP_XA, diaChiCuaMay());
  if (rao) return { ok: false, loi: rao.moTa };

  const danhTinh = env.SOI_TEN && env.SOI_MK ? { ten: env.SOI_TEN, mk: env.SOI_MK } : null;
  return { ok: true, gt: { goc: goc.replace(/\/+$/, ''), danhTinh } };
}

/** Đọc, hoặc dừng hẳn với thông báo. Dùng ở đầu runner. */
export function docHoacDung(env: BienMoiTruong, canDangNhap = true): MoiTruong {
  const kq = docMoiTruong(env, canDangNhap);
  if (!kq.ok) {
    console.error(kq.loi);
    process.exit(1);
  }
  return kq.gt;
}
