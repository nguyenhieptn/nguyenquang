/**
 * Gieo dữ liệu vào phả TỪ BẢNG TÍNH, qua đúng đường FR-51 (parse → preview → commit).
 *
 *   npx tsx scripts/seed-from-sheet.ts          # gieo (idempotent-ish: chạy lần 2 sẽ ra nghi trùng,
 *                                         #  script tự chuyển các dòng trùng thành 'skip')
 *
 * Đổi tên 25/08/2026 từ `demo-seed.ts`: tên cũ nói dối về việc nó làm. Nó không còn gieo dữ liệu
 * demo — nó gieo phả thật của dòng họ, từ bảng tính.
 *
 * ── NGUỒN DỮ LIỆU: BẢNG TÍNH, KHÔNG PHẢI MÃ ────────────────────────────────────────────────
 * Trước 25/08/2026 file này mang sẵn một chuỗi CSV mười hai nhân vật hư cấu. Nay nguồn là bảng
 * tính Google khai ở `GIAPHA_SEED_SHEET_URL` (.env) — dữ liệu phả là việc của dòng họ, không
 * phải hằng số trong mã, cùng lẽ với AD-14. Sửa phả thì sửa bảng tính rồi chạy lại, không phải
 * mở repo.
 *
 * KHÔNG CÓ ĐƯỜNG LÙI VỀ DỮ LIỆU CỨNG. Thiếu biến môi trường hay tải hỏng thì script dừng và nói
 * rõ. Lùi im lặng về một bộ nhân vật hư cấu là cách tệ nhất để hỏng: người chạy tưởng đã gieo phả
 * thật, mà trong DB là mười hai người không có thật.
 *
 * Xoá sạch để nhập lại: hạ container + volume rồi bootstrap lại (xem docs/van-hanh.md), hoặc để
 * Ban tu phả gỡ dần qua bàn làm việc.
 *
 * Script chạy ngoài request nên không có session — nó gọi thẳng ops với ctx quản trị thật đọc từ
 * DB (đúng lệ tests). Đây là script vận hành, không phải adapter; AD-24 áp cho adapter.
 */
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { withClanContext } from '@/db';
import { attachment } from '@/db/schema';
import type { SessionContext } from '@/core/identity/session';
import { soleClanId } from '@/core/identity';
import { parse } from 'csv-parse/sync';
import { previewSeedOp, commitSeedOp } from '@/core/seed/ops';
import { parseSeedCsv, SEED_COLUMNS, type SeedColumn, type SeedDecisions } from '@/core/seed';

/** Đổi URL edit của Google Sheets thành đường xuất CSV, giữ nguyên `gid` của tab đang mở. */
function duongXuatCsv(url: string): string {
  const id = /\/spreadsheets\/d\/([A-Za-z0-9_-]+)/.exec(url)?.[1];
  if (!id) throw new Error(`GIAPHA_SEED_SHEET_URL không phải URL Google Sheets: ${url}`);
  const gid = /[#&?]gid=(\d+)/.exec(url)?.[1] ?? '0';
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

async function taiBangTinh(): Promise<string> {
  const url = process.env.GIAPHA_SEED_SHEET_URL;
  if (!url) throw new Error('GIAPHA_SEED_SHEET_URL chưa có trong .env — xem .env.example');

  const res = await fetch(duongXuatCsv(url), { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(
      `Không tải được bảng tính (HTTP ${res.status}). Sheet phải để chế độ ` +
        '"Ai có đường dẫn cũng xem được" — script không đăng nhập Google.',
    );
  }
  const text = await res.text();
  // Sheet riêng tư không trả 403; nó trả 200 kèm trang đăng nhập HTML. Bắt ở đây, kẻo lỗi hiện
  // ra dưới dạng "CSV hỏng" và người chạy đi sửa nhầm chỗ.
  if (text.trimStart().startsWith('<')) {
    throw new Error('Google trả HTML chứ không phải CSV — sheet đang riêng tư, hãy mở quyền xem.');
  }
  return text;
}

/**
 * Bỏ những cột `core/seed` CHƯA biết, giữ đúng tám cột nó khai.
 *
 * Bảng tính là của dòng họ nên nó ĐƯỢC PHÉP đi trước mã: hôm nay đã có `noi_o`, thứ thuộc story
 * 5-7 (FR-65, khẳng định loại `nơi`). `parseSeedCsv` từ chối mọi cột lạ — đúng, vì một cột gõ sai
 * tên mà lọt qua là dữ liệu vào nhầm chỗ. Nên chỗ nới là ở ĐÂY, trong script vận hành, chứ không
 * phải nới luật trong core.
 */
function locCotDaBiet(text: string): { csv: string; boQua: string[] } {
  const banGhi = parse(text, {
    bom: true,
    trim: true,
    skip_empty_lines: true,
    relax_column_count: true,
  }) as string[][];
  if (banGhi.length === 0) throw new Error('Bảng tính rỗng — không có cả dòng tiêu đề.');

  const tieuDe = (banGhi[0] ?? []).map((h) => h.trim().toLowerCase());
  const viTri = SEED_COLUMNS.map((c) => tieuDe.indexOf(c));
  const thieu = SEED_COLUMNS.filter((_, i) => viTri[i] === -1);
  if (thieu.length > 0) {
    throw new Error(`Bảng tính thiếu cột bắt buộc: ${thieu.join(', ')}`);
  }
  const boQua = tieuDe.filter((h) => h !== '' && !SEED_COLUMNS.includes(h as SeedColumn));

  const o = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const csv = [
    SEED_COLUMNS.join(','),
    ...banGhi.slice(1).map((hang) => viTri.map((i) => o((hang[i] ?? '').trim())).join(',')),
  ].join('\n');

  return { csv, boQua };
}

async function main() {
  // Kiểm đầu vào TRƯỚC khi chạm DB: bảng tính hỏng thì dừng ở đây, không mở giao dịch nào.
  const { csv, boQua } = locCotDaBiet(await taiBangTinh());
  if (boQua.length > 0) {
    console.log(`Bỏ qua cột core/seed chưa biết: ${boQua.join(', ')}`);
  }
  const rows = parseSeedCsv(csv);
  if (!rows.ok) throw new Error('Bảng tính hỏng: ' + rows.error.message);
  console.log(`Đọc được ${rows.value.length} dòng từ bảng tính.`);

  const clanId = await soleClanId();
  if (!clanId) throw new Error('Chưa có dòng họ nào trong database — chạy create-admin.ts trước');

  // ctx quản trị thật: attachment role admin đầu tiên trong clan.
  const admin = await withClanContext(clanId, (tx) =>
    tx.select().from(attachment).where(eq(attachment.role, 'admin')).limit(1),
  );
  if (!admin[0]) throw new Error('Chưa có quản trị — chạy create-admin.ts trước');
  const ctx: SessionContext = {
    accountId: admin[0].accountId,
    clanId,
    personId: admin[0].personId,
    role: 'admin',
  };

  const result = await withClanContext(clanId, async (tx) => {
    const preview = await previewSeedOp(tx, ctx, rows.value);
    if (!preview.ok) throw new Error(preview.error.message);
    /**
     * Quyết định mặc định — theo ĐÚNG nếp của màn Nạp khung (`macDinhCua` trong
     * `nap-khung-client.tsx`), không tự nghĩ ra luật riêng.
     *
     * SỬA 25/08/2026. Bản đầu bỏ qua MỌI dòng không phải `nguoi-moi`, với lý do "chạy lần hai
     * không tạo bản trùng". Nhưng nó bỏ qua luôn trường hợp thường gặp nhất ở lần chạy ĐẦU:
     * người trong bảng tính đã có sẵn trong phả vì `create-admin.ts` vừa dựng node cho quản trị.
     * Hậu quả đo được: dòng của quản trị bị bỏ, nên mối nối cha-con của chính người ấy không
     * được ghi, và cây tách làm hai mảnh rời — trong khi cả hai mảnh đều đúng ra là một.
     *
     * `link` mới là câu trả lời đúng: nó nói "dòng này CHÍNH LÀ người kia", rồi nối cạnh cha-con
     * còn thiếu. `wireParentEdge` (`core/seed/ops.ts:279`) tự kiểm trùng trước khi ghi, nên chạy
     * lại bao nhiêu lần cũng không sinh cạnh thừa — thứ mà bản `skip` cũ tưởng chỉ mình nó lo được.
     */
    const decisions: SeedDecisions = {};
    const boQua: string[] = [];
    for (const row of preview.value.rows) {
      if (row.classification === 'nghi-trung') {
        // Máy KHÔNG đoán khi nghi trùng (AD-16 / nếp của màn Nạp khung) — để người chọn.
        decisions[row.index] = { action: 'skip' };
        boQua.push(`dòng ${row.line} (${row.hoTen}): nghi trùng, cần người chọn`);
        continue;
      }
      if (row.classification === 'khop-nguoi-co-san' && row.candidates[0]) {
        decisions[row.index] = { action: 'link', personId: row.candidates[0].personId };
      }
      // `nguoi-moi` để mặc định 'create'.
    }
    if (boQua.length > 0) {
      // Bỏ qua mà không nói ra thì người chạy tưởng đã gieo đủ — đúng kiểu hỏng khó thấy nhất.
      console.log(`Bỏ qua ${boQua.length} dòng:\n  ${boQua.join('\n  ')}`);
    }
    return commitSeedOp(tx, ctx, { rows: rows.value, decisions });
  });
  if (!result.ok) throw new Error(result.error.message);
  console.log(
    `Đã gieo từ bảng tính: tạo ${result.value.created}, nối vào người có sẵn ` +
      `${result.value.linked}, bỏ qua ${result.value.skipped}.`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
