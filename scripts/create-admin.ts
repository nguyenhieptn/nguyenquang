/**
 * Tạo tài khoản quản trị. Đây là cách người đầu tiên bước vào hệ thống.
 *
 *   npx tsx scripts/create-admin.ts <email> '<mật khẩu>' '<Họ và tên>'
 *   npx tsx scripts/create-admin.ts <email> '<mật khẩu>' '<Họ và tên>' --nam-sinh 1986
 *   npx tsx scripts/create-admin.ts <email> '<mật khẩu>' '<Họ và tên>' --clan 'Dòng họ X'
 *
 * ── `--nam-sinh`: nhỏ, nhưng bỏ nó là cây gãy đôi ──────────────────────────────────────────
 * Nếu người quản trị cũng có một dòng trong bảng tính gieo (`seed-from-sheet.ts`), hãy khai năm
 * sinh ở đây. Bộ nạp khung chỉ tự nối một dòng vào người có sẵn khi **năm sinh cũng khớp**; node
 * bootstrap không có năm sinh thì dòng ấy xếp `nghi-trung`, bị bỏ, và `ten_cha` trên nó không bao
 * giờ được đọc — cây tách làm hai mảnh rời. Đo được trên phả thật 25/08/2026.
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
  "Cách dùng: npx tsx scripts/create-admin.ts <email> '<mật khẩu>' '<Họ và tên>' " +
  "[--nam-sinh <YYYY>] [--clan '<Tên dòng họ>']";

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  let clanName = DEFAULT_CLAN_NAME;
  let birthYear: number | undefined;
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--clan') {
      const v = argv[i + 1];
      if (!v) {
        console.error('--clan cần một tên. ' + CACH_DUNG);
        process.exit(1);
      }
      clanName = v;
      i += 1;
    } else if (argv[i] === '--nam-sinh') {
      const v = argv[i + 1];
      /**
       * Bốn chữ số, và NẰM TRONG KHOẢNG CÓ NGHĨA.
       *
       * Bản trước chỉ kiểm `/^\d{4}$/`. `0000` qua được, thành `'0000-01-01'`, và Postgres không
       * có năm 0 — cột `date` ném 22008 giữa transaction, trong khi tài khoản auth đã được tạo
       * TRƯỚC đó ở một lượt ghi khác: hỏng nửa chừng, để lại một tài khoản không có person lẫn
       * attachment. `9999` thì không ném, nó chỉ lặng lẽ vào phả và đổi thứ tự anh em.
       *
       * Trần là năm nay: một người sinh năm sau thì chưa sinh. Sàn 1000 là chỗ phả Việt Nam
       * không đi quá — và một con số sai kiểu gõ nhầm (`19866` đã bị chặn, `1086` thì không) vẫn
       * lọt, nên đây là hàng rào chống tai nạn, không phải phép kiểm sử liệu.
       */
      const namNay = new Date().getFullYear();
      if (!v || !/^\d{4}$/.test(v) || Number(v) < 1000 || Number(v) > namNay) {
        console.error(`--nam-sinh cần bốn chữ số trong khoảng 1000–${namNay}. ` + CACH_DUNG);
        process.exit(1);
      }
      birthYear = Number(v);
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

  const admin = await createAdmin({
    clanId,
    email,
    password,
    name,
    ...(birthYear !== undefined ? { birthYear } : {}),
  });
  console.log(
    admin.created
      ? `Đã tạo quản trị ${email} — person=${admin.personId} attachment=${admin.attachmentId}` +
          (birthYear === undefined
            ? '\n  ⚠ Không khai --nam-sinh. Nếu người này CÓ trong bảng tính gieo, dòng của họ sẽ ' +
              'xếp "nghi trùng" và bị bỏ — cây sẽ tách làm hai mảnh.'
            : ` sinh=${birthYear}`)
      : `Tài khoản ${email} đã là quản trị sẵn — person=${admin.personId}. ` +
          (birthYear === undefined
            ? ''
            : admin.birthYearApplied
              ? `\n  Đã ghi thêm năm sinh ${birthYear} cho node ấy (trước đó chưa có).`
              : `\n  Năm sinh KHÔNG ghi: node ấy đã có năm sinh rồi. Sửa ở bàn làm việc, ` +
                'không sửa bằng script — AD-9 để người duyệt quyết chuyện hai giá trị.') +
          '\n  Đổi mật khẩu bằng scripts/reset-admin-password.ts.',
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('TẠO QUẢN TRỊ THẤT BẠI:', e);
    process.exit(1);
  });
