/**
 * Đặt lại mật khẩu của một tài khoản — đường thoát khi người quản trị mất mật khẩu.
 *
 * Vì sao cần script này: `create-admin.ts` IDEMPOTENT theo email (createAdmin gặp tài khoản
 * đã có attachment active thì trả về nguyên trạng, KHÔNG đụng mật khẩu), và triển khai này
 * chưa có bộ gửi mail nên luồng "quên mật khẩu" của Better Auth không bật được. Không có
 * script này thì mất mật khẩu quản trị = mất bàn duyệt.
 *
 *   npx tsx scripts/reset-admin-password.ts --list
 *   npx tsx scripts/reset-admin-password.ts <email hoặc tên đăng nhập>
 *   npx tsx scripts/reset-admin-password.ts <email> --password '<mật khẩu mới>'
 *
 * Không truyền --password thì script HỎI, gõ không hiện — mật khẩu không rơi vào lịch sử shell.
 * Chỉ dùng --password khi chạy tự động, và biết là nó nằm lại trong `~/.bash_history`.
 *
 * Tầng tài khoản, không phải tầng phả (AD-8): script chỉ đổi `account.password` của Better
 * Auth. Vai, attachment, bán kính riêng tư không đổi — chúng sống ở `attachment`.
 * Mọi phiên đang mở của tài khoản bị xoá: đặt lại mật khẩu mà phiên cũ vẫn chạy thì
 * việc đặt lại không có nghĩa.
 */
import 'dotenv/config';
import readline from 'node:readline';
import { eq, inArray } from 'drizzle-orm';
import { dbGlobal, withClanContext } from '../db';
import { attachment, authAccount, authSession, authUser } from '../db/schema';
import { auth } from '../core/identity/ba';
import { soleClanId } from '../core/identity';

type HoSo = {
  accountId: string;
  email: string;
  username: string | null;
  name: string;
  role: string;
  status: string;
  coMatKhau: boolean;
};

/** Mọi tài khoản có attachment trong clan của triển khai này, kèm vai và tình trạng. */
async function danhSach(): Promise<HoSo[]> {
  const clanId = await soleClanId();
  if (!clanId) throw new Error('Chưa có dòng họ nào trong database — chạy create-admin.ts trước.');

  const atts = await withClanContext(clanId, (tx) => tx.select().from(attachment));
  const ids = [...new Set(atts.map((a) => a.accountId))];
  if (ids.length === 0) return [];

  const users = await dbGlobal.select().from(authUser).where(inArray(authUser.id, ids));
  const accs = await dbGlobal.select().from(authAccount).where(inArray(authAccount.userId, ids));

  return atts.map((a) => {
    const u = users.find((x) => x.id === a.accountId);
    return {
      accountId: a.accountId,
      email: u?.email ?? '(không tìm thấy user)',
      username: u?.username ?? null,
      name: u?.name ?? '?',
      role: a.role,
      status: a.status,
      coMatKhau: accs.some(
        (x) => x.userId === a.accountId && x.providerId === 'credential' && x.password,
      ),
    };
  });
}

/** Hỏi mật khẩu, gõ không hiện. */
function hoiKin(cauHoi: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const iface = rl as unknown as { _writeToOutput: (s: string) => void };
    let batDau = false;
    iface._writeToOutput = (s: string) => {
      if (!batDau) {
        process.stdout.write(s);
        batDau = true;
      }
      // sau khi in câu hỏi: nuốt mọi ký tự vọng lại
    };
    rl.question(cauHoi, (tra) => {
      process.stdout.write('\n');
      rl.close();
      resolve(tra);
    });
  });
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const iPw = argv.indexOf('--password');
  const matKhauCLI = iPw >= 0 ? (argv[iPw + 1] ?? null) : null;
  // indexOf trả -1 khi vắng cờ; iPw+1 khi ấy là 0 và sẽ nuốt mất tham số đầu tiên —
  // đúng chỗ email hay đứng. Chỉ bỏ qua vị trí ấy KHI cờ có thật.
  const viTriMatKhau = iPw >= 0 ? iPw + 1 : -1;
  const dinhDanh = argv.find((a, i) => !a.startsWith('--') && i !== viTriMatKhau) ?? null;

  const ho = await danhSach();

  if (argv.includes('--list') || !dinhDanh) {
    if (ho.length === 0) {
      console.log('Chưa có tài khoản nào gắn vào dòng họ này.');
      return;
    }
    console.log(`\nTài khoản trong dòng họ (${ho.length}):\n`);
    for (const h of ho) {
      console.log(
        `  ${h.role.padEnd(12)} ${h.status.padEnd(8)} ${h.email.padEnd(34)}` +
          ` tên đăng nhập: ${(h.username ?? '(chưa có)').padEnd(22)}` +
          ` mật khẩu: ${h.coMatKhau ? 'có' : 'KHÔNG'}`,
      );
    }
    if (!dinhDanh) {
      console.log('\nĐặt lại: npx tsx scripts/reset-admin-password.ts <email hoặc tên đăng nhập>');
    }
    return;
  }

  const khoa = dinhDanh.toLowerCase();
  const dich = ho.find(
    (h) => h.email.toLowerCase() === khoa || (h.username ?? '').toLowerCase() === khoa,
  );
  if (!dich) {
    console.error(`Không tìm thấy tài khoản "${dinhDanh}" trong dòng họ này.`);
    console.error('Chạy --list để xem danh sách.');
    process.exit(1);
  }

  console.log(`\nĐặt lại mật khẩu cho:`);
  console.log(`  Họ tên       : ${dich.name}`);
  console.log(`  Email        : ${dich.email}`);
  console.log(`  Tên đăng nhập: ${dich.username ?? '(chưa có)'}`);
  console.log(`  Vai          : ${dich.role} (${dich.status})\n`);

  let matKhau = matKhauCLI;
  if (!matKhau) {
    matKhau = await hoiKin('Mật khẩu mới: ');
    const lai = await hoiKin('Gõ lại       : ');
    if (matKhau !== lai) {
      console.error('Hai lần gõ không khớp — không đổi gì.');
      process.exit(1);
    }
  }
  if (!matKhau || matKhau.length < 8) {
    console.error('Mật khẩu phải từ 8 ký tự (mức tối thiểu của Better Auth) — không đổi gì.');
    process.exit(1);
  }

  const ctx = await auth.$context;
  const bam = await ctx.password.hash(matKhau);

  const cred = await ctx.internalAdapter.findCredentialAccount(dich.accountId);
  if (!cred) {
    console.error(
      `Tài khoản này chưa từng có mật khẩu (chỉ đăng nhập bằng nhà cung cấp ngoài).\n` +
        `Đặt mật khẩu cho nó cần thêm một dòng account 'credential' — chưa nằm trong phạm vi script.`,
    );
    process.exit(1);
  }
  await ctx.internalAdapter.updatePassword(dich.accountId, bam);

  const phienCu = await dbGlobal
    .delete(authSession)
    .where(eq(authSession.userId, dich.accountId))
    .returning({ id: authSession.id });

  console.log(`✓ Đã đổi mật khẩu cho ${dich.email}`);
  console.log(`✓ Đã xoá ${phienCu.length} phiên đang mở — mọi thiết bị phải đăng nhập lại.`);
  console.log(`\nĐăng nhập lại tại ${process.env.BETTER_AUTH_URL ?? 'http://<ip>:3000'}/dang-nhap`);
  console.log(`bằng email HOẶC tên đăng nhập ${dich.username ? `(${dich.username})` : ''}.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('ĐẶT LẠI MẬT KHẨU THẤT BẠI:', e);
    process.exit(1);
  });
