/**
 * DÒNG HỌ THỬ — dựng một dòng họ tạm để MỞ TRÌNH DUYỆT xem và bấm thử đường ghi, không chạm
 * phả thật (story 6-10; quyết định treo từ 6-6 § AC 23).
 *
 *   npx tsx scripts/dong-ho-thu.ts            # dựng, in tài khoản + lệnh chạy server
 *   npx tsx scripts/dong-ho-thu.ts --go       # dọn MỌI dòng họ thử còn trong database
 *
 * ── Vì sao phải có nó ───────────────────────────────────────────────────────────────────────
 * Phả thật có ĐÚNG MỘT gắn kết (của quản trị) — không có tài khoản thành viên nào để mở bề mặt
 * "Phả quanh mình" mà xem. Tạo một tài khoản thành viên trên phả thật là gắn một người giả vào một
 * người thật; bấm thử một nút ghi trên phả thật là vĩnh viễn (AD-4, sự cố 40 khẳng định). Dòng
 * họ thử là chỗ duy nhất hai việc ấy làm được mà không trả giá.
 *
 * ── Cách mở ────────────────────────────────────────────────────────────────────────────────
 * Database có nhiều hơn một dòng họ thì `soleClanId()` phục vụ dòng họ ĐẦU TIÊN (phả thật) và
 * cảnh báo ra log. Bản `next start` cho dòng họ thử vì thế phải GHIM bằng `GIAPHA_CLAN_ID`, ở
 * một cổng khác — script in sẵn lệnh. Bản thật ở `:3000` không đổi gì.
 *
 * Cùng bộ dựng với `app/admin/cay/actions.test.ts` (`core/gates/dong-ho-thu.ts`): thứ bài test
 * thấy cũng là thứ mắt người thấy.
 */
import 'dotenv/config';
import { networkInterfaces } from 'node:os';
import { dbGlobal } from '../db';
import { authUser } from '../db/schema';
import { like } from 'drizzle-orm';
import { dungDongHoThu, donDongHoThu, lietKeDongHoThu } from '../core/gates/dong-ho-thu';

function ipTailscale(): string {
  for (const ds of Object.values(networkInterfaces())) {
    for (const d of ds ?? []) if (d.family === 'IPv4' && d.address.startsWith('100.')) return d.address;
  }
  return '127.0.0.1';
}

async function go(): Promise<void> {
  const ds = await lietKeDongHoThu();
  if (ds.length === 0) {
    console.log('Không có dòng họ thử nào trong database.');
    return;
  }
  for (const c of ds) {
    // Tài khoản của dòng họ thử mang email `thu-*@test.local` — dọn theo mẫu ấy.
    const users = await dbGlobal.select({ email: authUser.email }).from(authUser).where(like(authUser.email, 'thu-%@test.local'));
    await donDongHoThu({ clanId: c.id, ghimTruoc: undefined, emails: users.map((u) => u.email) });
    console.log(`Đã dọn ${c.name} (${c.id}).`);
  }
}

async function dung(): Promise<void> {
  const d = await dungDongHoThu({ ghim: false });
  const ip = ipTailscale();
  console.log(`
Đã dựng "Dòng họ thử ${d.tienTo}" — ${d.clanId}

  quản trị    ${d.quanTri.tenDangNhap}    mật khẩu: ${d.quanTri.matKhau}
  thành viên  ${d.thanhVien.tenDangNhap}  (gắn vào "${d.tienTo} Nguyễn Thử Mình")
  chưa gắn    ${d.chuaGan.tenDangNhap}

Mở một bản riêng cho dòng họ này, ở CỔNG KHÁC bản thật, ghim bằng GIAPHA_CLAN_ID:

  GIAPHA_CLAN_ID=${d.clanId} BETTER_AUTH_URL=http://${ip}:3200 \\
    npx next start -H ${ip} -p 3200

  rồi mở http://${ip}:3200/dang-nhap — hoặc đo bằng bộ đo:

  SOI_GOC=http://${ip}:3200 SOI_TEN=${d.thanhVien.tenDangNhap} SOI_MK='${d.thanhVien.matKhau}' npm run soi -- gia-pha

Xong việc thì dọn:  npx tsx scripts/dong-ho-thu.ts --go
(Mật khẩu in ra đây vì đây là dữ liệu thử, dùng một lần rồi bỏ — không phải mật khẩu của ai.)
`);
}

const argv = process.argv.slice(2);
(argv.includes('--go') ? go() : dung()).then(
  () => process.exit(0),
  (e) => {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  },
);
