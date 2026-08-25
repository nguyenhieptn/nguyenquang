/**
 * Tạo tài khoản quản trị. Đây là cách người đầu tiên bước vào hệ thống.
 *
 *   npx tsx scripts/create-admin.ts <email> '<mật khẩu>' '<Họ và tên>'
 *   npx tsx scripts/create-admin.ts <email> '<mật khẩu>' '<Họ và tên>' --clan 'Dòng họ X'
 *
 * ── Vì sao script này phải tồn tại ─────────────────────────────────────────────────────────
 * `approveAttachmentOp` (`core/identity/ops.ts`) đòi người duyệt đã là `admin`/`branch-head` VÀ
 * đã tự gắn vào một node. Nghĩa là mọi lối trở thành quản trị đều cần một quản trị có sẵn — hệ
 * thống không tự sinh ra người đầu tiên được. Một hành động từ NGOÀI phải mồi lấy một lần.
 *
 * Đó là toàn bộ lý do. Không phải "khởi tạo dòng họ" — dòng họ chỉ là thứ script tiện tay dựng
 * nếu chưa có.
 *
 * ── Đổi tên 25/08/2026, từ `bootstrap-clan.ts` ─────────────────────────────────────────────
 * Tên cũ đặt trọng tâm sai chỗ. Việc tạo dòng họ chỉ là một `INSERT` vào bảng `clan` — vô hình,
 * không ai cần biết tên nó. Việc KHÔNG bỏ được là tạo quản trị đầu tiên, nên tên phải nói điều
 * ấy. Cùng lượt: bỏ cờ `--admin` (nay là ba tham số bắt buộc — chạy script này mà không tạo
 * quản trị thì chẳng để làm gì), bỏ `--env-path`, và thôi ghi `GIAPHA_CLAN_ID` vào `.env`.
 *
 * Idempotent: dùng lại dòng họ đã có, và để yên tài khoản nào đã giữ một attachment hoạt động.
 * Quên mật khẩu thì dùng `scripts/reset-admin-password.ts`, chạy lại script này KHÔNG đặt lại.
 *
 * ── Đợt 3 ──────────────────────────────────────────────────────────────────────────────────
 * Khi có admin hệ thống (quản nhiều dòng họ, đặt quản trị cho từng dòng họ), script này thành
 * "tạo admin hệ thống đầu tiên" — cùng một chỗ, chỉ đổi thứ nó tạo ra. Bài toán con-gà-quả-trứng
 * không mất đi, nó chỉ lùi lên một tầng.
 *
 * Mặc định của họ Nguyễn Quang bên dưới là CẤU HÌNH do script mang, không phải mã core — AD-14
 * giữ `core/` và `db/` không biết gì về một dòng họ cụ thể.
 */
import 'dotenv/config';
import { createAdmin, ensureClan } from '../core/identity/bootstrap';

const DEFAULT_CLAN_NAME = 'Dòng họ Nguyễn Quang';
const DEFAULT_SETTINGS = {
  surname: 'Nguyễn',
  middleName: 'Quang',
  motto: '光前裕後',
  mottoPhonetic: 'Quang tiền dụ hậu',
};

const CACH_DUNG =
  "Cách dùng: npx tsx scripts/create-admin.ts <email> '<mật khẩu>' '<Họ và tên>' [--clan '<Tên dòng họ>']";

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  let clanName = DEFAULT_CLAN_NAME;
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--clan') {
      const v = argv[i + 1];
      if (!v) {
        console.error("--clan cần một tên. " + CACH_DUNG);
        process.exit(1);
      }
      clanName = v;
      i += 1;
    } else {
      positional.push(argv[i]!);
    }
  }

  const [email, password, name] = positional;
  if (!email || !password || !name) {
    console.error('Thiếu tham số. ' + CACH_DUNG);
    process.exit(1);
  }

  // Dòng họ dựng lặng lẽ nếu chưa có — người chạy script này quan tâm tới tài khoản, không tới
  // cái `INSERT` ấy. Đã có rồi thì dùng lại, không hỏi.
  const { clanId, created } = await ensureClan({ name: clanName, settings: DEFAULT_SETTINGS });
  if (created) console.log(`Chưa có dòng họ nào — đã dựng "${clanName}" (${clanId}).`);

  const admin = await createAdmin({ clanId, email, password, name });
  console.log(
    admin.created
      ? `Đã tạo quản trị ${email} — person=${admin.personId} attachment=${admin.attachmentId}`
      : `Tài khoản ${email} đã là quản trị sẵn — person=${admin.personId}. ` +
          'Đổi mật khẩu bằng scripts/reset-admin-password.ts.',
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('TẠO QUẢN TRỊ THẤT BẠI:', e);
    process.exit(1);
  });
