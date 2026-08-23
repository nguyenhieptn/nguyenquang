/**
 * Gieo dữ liệu MẪU qua đúng đường FR-51 (parse → preview → commit) — dogfood core/seed.
 *
 *   npx tsx scripts/demo-seed.ts          # gieo (idempotent-ish: chạy lần 2 sẽ ra nghi trùng,
 *                                         #  script tự chuyển các dòng trùng thành 'skip')
 *
 * Dữ liệu lấy từ bộ mock của xưởng UI (app/uiworkshop/_mock/seed.ts) — nhân vật HƯ CẤU dùng cho
 * demo. Khi dòng họ nhập dữ liệu THẬT: xoá sạch bằng cách hạ container + volume rồi bootstrap lại
 * (xem docs/van-hanh.md), hoặc để Ban tu phả gỡ dần qua bàn duyệt.
 *
 * Script chạy ngoài request nên không có session — nó gọi thẳng ops với ctx quản trị thật đọc từ
 * DB (đúng lệ tests). Đây là script vận hành, không phải adapter; AD-24 áp cho adapter.
 */
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { withClanContext, dbGlobal } from '@/db';
import { attachment } from '@/db/schema';
import type { SessionContext } from '@/core/identity/session';
import { previewSeedOp, commitSeedOp } from '@/core/seed/ops';
import { parseSeedCsv, type SeedDecisions } from '@/core/seed';

const CSV = `ho_ten,gioi_tinh,nam_sinh,nam_mat,ten_cha,ten_vo_chong,chi,ghi_chu
Nguyễn Quang Thản,nam,,1901,,,,"Cụ xa nhất hiện biết (demo)"
Nguyễn Quang Đệ,nam,1888,1954,Nguyễn Quang Thản,Trần Thị Vẽ,,
Trần Thị Vẽ,nu,,1961,,Nguyễn Quang Đệ,,
Nguyễn Quang Bảng,nam,1921,1998,Nguyễn Quang Đệ,,,
Nguyễn Quang Hoạch,nam,1949,,Nguyễn Quang Bảng,,Chi Hai,
Nguyễn Thị Lành,nu,1952,,Nguyễn Quang Bảng,,Chi Hai,
Nguyễn Quang Hùng,nam,1975,,Nguyễn Quang Hoạch,,Chi Hai,
Nguyễn Quang Khoa,nam,2001,,Nguyễn Quang Hùng,,Chi Hai,
Nguyễn Quang Đoài,nam,1924,,Nguyễn Quang Đệ,,Chi Ba,"Mảnh ước đoán — cần xác minh"
Nguyễn Quang Tuyên,nam,1958,,Nguyễn Quang Đoài,,Chi Ba,
Nguyễn Quang Thuyết,nam,1931,,,,,"Chưa rõ nối vào đâu — gốc tạm của mảnh rời"
Nguyễn Quang Trọng,nam,1963,,Nguyễn Quang Thuyết,,,
`;

async function main() {
  const clanId = process.env.GIAPHA_CLAN_ID;
  if (!clanId) throw new Error('GIAPHA_CLAN_ID chưa có — chạy bootstrap-clan.ts trước');

  // ctx quản trị thật: attachment role admin đầu tiên trong clan.
  const admin = await withClanContext(clanId, (tx) =>
    tx.select().from(attachment).where(eq(attachment.role, 'admin')).limit(1),
  );
  if (!admin[0]) throw new Error('Chưa có quản trị — chạy bootstrap-clan.ts --admin trước');
  const ctx: SessionContext = {
    accountId: admin[0].accountId,
    clanId,
    personId: admin[0].personId,
    role: 'admin',
  };

  const rows = parseSeedCsv(CSV);
  if (!rows.ok) throw new Error('CSV mẫu hỏng: ' + rows.error.message);

  const result = await withClanContext(clanId, async (tx) => {
    const preview = await previewSeedOp(tx, ctx, rows.value);
    if (!preview.ok) throw new Error(preview.error.message);
    const decisions: SeedDecisions = {};
    preview.value.rows.forEach((row, i) => {
      // Chạy lại lần 2: dòng đã khớp người có sẵn thì bỏ qua, không tạo bản trùng.
      if (row.classification !== 'nguoi-moi') decisions[i] = { action: 'skip' };
    });
    return commitSeedOp(tx, ctx, { rows: rows.value, decisions });
  });
  if (!result.ok) throw new Error(result.error.message);
  console.log(
    `Đã gieo dữ liệu mẫu: tạo ${result.value.created}, bỏ qua ${result.value.skipped}.`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
