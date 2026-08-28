/**
 * Gieo dữ liệu vào phả TỪ BẢNG TÍNH, qua đúng đường FR-51 (parse → preview → commit).
 *
 *   npx tsx scripts/seed-from-sheet.ts --xem-truoc        # chạy KHÔ: chỉ in cảnh báo, không ghi
 *   npx tsx scripts/seed-from-sheet.ts                   # gieo; DỪNG nếu có cảnh báo nào
 *   npx tsx scripts/seed-from-sheet.ts --du-biet-canh-bao # gieo bất kể cảnh báo
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
import {
  parseSeedCsv,
  SEED_COLUMNS,
  type SeedColumn,
  type SeedDecisions,
  type SeedPreviewRow,
} from '@/core/seed';
// Từ vựng cảnh báo dùng chung với màn /admin/nap-khung — xem chú thích đầu module ấy để biết
// vì sao nó nằm ở components/ mà script vẫn import về, thay vì dựng bảng nhãn thứ hai.
import { cauCanhBao } from '@/components/admin/canh-bao-nap-khung';

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
function locCotDaBiet(text: string): { csv: string; boQua: string[]; hangThat: number[] } {
  const banGhi = parse(text, {
    bom: true,
    trim: true,
    skip_empty_lines: true,
    relax_column_count: true,
    info: true,
  }) as unknown as { info: { lines: number }; record: string[] }[];
  if (banGhi.length === 0) throw new Error('Bảng tính rỗng — không có cả dòng tiêu đề.');

  const tieuDe = (banGhi[0]?.record ?? []).map((h) => h.trim().toLowerCase());
  const viTri = SEED_COLUMNS.map((c) => tieuDe.indexOf(c));
  const thieu = SEED_COLUMNS.filter((_, i) => viTri[i] === -1);
  if (thieu.length > 0) {
    throw new Error(`Bảng tính thiếu cột bắt buộc: ${thieu.join(', ')}`);
  }
  const boQua = tieuDe.filter((h) => h !== '' && !SEED_COLUMNS.includes(h as SeedColumn));

  const o = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const csv = [
    SEED_COLUMNS.join(','),
    ...banGhi.slice(1).map((h) => viTri.map((i) => o((h.record[i] ?? '').trim())).join(',')),
  ].join('\n');

  /**
   * Số hàng THẬT trong bảng tính, theo thứ tự dòng của CSV dựng lại (sửa 27/08 sau code review).
   *
   * `SeedRow.line` được `parseSeedCsv` tính trên chuỗi ĐÃ DỰNG LẠI ở đây, mà lượt parse trên
   * bật `skip_empty_lines` — nên một hàng trống ngăn hai chi làm mọi dòng sau lệch một. Người
   * vận hành đọc cảnh báo *"dòng 87"*, mở Google Sheets tới hàng 87, và sửa NHẦM NGƯỜI. Trên
   * một kho không có phép xoá thì đó là một khẳng định sai nữa.
   */
  const hangThat = banGhi.slice(1).map((h) => h.info.lines);

  return { csv, boQua, hangThat };
}

/**
 * In MỌI cảnh báo của lượt nạp — thứ script này đã im lặng nuốt cho tới 26/08/2026.
 *
 * `previewSeedOp` vẫn luôn tính `warnings` cho từng dòng; script chỉ in danh sách dòng bị *bỏ
 * qua*, nên một cụ tổ mất cha được tính đúng rồi đi thẳng vào hư không. Retro Epic 5 bắt được
 * điều ấy bằng cách nhìn cây gia phả, không bằng cách nhìn màn hình.
 *
 * In TRƯỚC khi commit chạy: phả không có phép xoá (AD-4), nên một cảnh báo đọc được sau lượt ghi
 * là một cảnh báo đã muộn.
 *
 * Không có cảnh báo nào thì KHÔNG in gì. Một dòng "0 cảnh báo" mỗi lượt chạy là cách nhanh nhất
 * để người ta thôi đọc phần này.
 */
function inCanhBao(rows: SeedPreviewRow[], hangThat: number[]): number {
  const co = rows.filter((r) => r.warnings.length > 0);
  if (co.length === 0) return 0;
  console.log(`Cảnh báo trên ${co.length} dòng — đọc TRƯỚC khi ghi, vì phả không có phép xoá:`);
  for (const r of co) {
    // Số HÀNG của bảng tính, không phải số dòng của chuỗi CSV dựng lại — xem `hangThat`.
    const hang = hangThat[r.index] ?? r.line;
    for (const loai of r.warnings) {
      console.log(`  hàng ${hang} (${r.hoTen}): ${cauCanhBao(loai)}`);
    }
  }
  return co.length;
}

async function main() {
  // Kiểm đầu vào TRƯỚC khi chạm DB: bảng tính hỏng thì dừng ở đây, không mở giao dịch nào.
  const { csv, boQua, hangThat } = locCotDaBiet(await taiBangTinh());
  /**
   * `--xem-truoc` — chạy KHÔ: parse, xem trước, in cảnh báo, rồi dừng. Không ghi một dòng nào.
   *
   * Thêm 27/08 sau code review. Bản trước in cảnh báo rồi gọi `commitSeedOp` ở ngay nhịp sau:
   * AC 13 đạt theo chữ (*"in trước lượt ghi"*) và hỏng theo việc — giữa hai việc ấy có vài
   * mili-giây, không prompt, không ngưỡng dừng, nên người vận hành đọc cảnh báo SAU khi
   * transaction đã commit vào một kho không có phép xoá (AD-4).
   *
   * `--du-biet-canh-bao` là lối đi tiếp khi đã đọc và vẫn muốn ghi.
   */
  const chiXemTruoc = process.argv.includes('--xem-truoc');
  const duBiet = process.argv.includes('--du-biet-canh-bao');
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
     * Quyết định mặc định của SCRIPT — cố ý KHÁC luật của màn Nạp khung.
     *
     * SỬA CHÚ THÍCH 27/08 sau code review: chỗ này từng khai *"theo ĐÚNG nếp của `macDinhCua`"*,
     * và đó là nói dối — hai luật khác nhau ở cả hai dòng đầu. Màn để trống quyết định cho dòng
     * nghi trùng (có người tích ô); script thì `skip` chúng. Màn bỏ tích dòng mang cảnh báo cha;
     * script thì `create` chúng — vì ở đây KHÔNG có ai để tích ô, nên "để lại mọi dòng có cảnh
     * báo" sẽ lặng lẽ bỏ rơi người. Lý lẽ ấy ghi ở `components/admin/canh-bao-nap-khung.ts`.
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

    /**
     * LƯỢT XEM TRƯỚC THỨ HAI — lần này mang theo `decisions` vừa suy ra (story 6-3).
     *
     * Lượt đầu buộc phải mù: quyết định được suy TỪ phân loại của chính nó. Nhưng cảnh báo của
     * lượt mù ấy nói về một lượt ghi khác với lượt sắp chạy — nó không biết dòng nào sẽ bị bỏ.
     * Hai chiều sai, cả hai đã xảy ra thật: cảnh báo thừa (bỏ một trong hai dòng trùng tên cha
     * thì commit nối được), và cảnh báo thiếu (bỏ dòng duy nhất mang tên cha thì commit lặng lẽ
     * bỏ cha — lần cây gãy làm hai mảnh).
     *
     * Xem trước KHÔNG ghi gì, nên chạy hai lượt chỉ tốn một lượt đọc, và cả hai nằm trong đúng
     * transaction sắp ghi.
     */
    const soiLai = await previewSeedOp(tx, ctx, rows.value, decisions);
    if (!soiLai.ok) throw new Error(soiLai.error.message);
    const soCanhBao = inCanhBao(soiLai.value.rows, hangThat);

    if (chiXemTruoc) {
      console.log('`--xem-truoc`: dừng ở đây, KHÔNG ghi gì.');
      return null;
    }
    if (soCanhBao > 0 && !duBiet) {
      console.log(
        `\nDỪNG: ${soCanhBao} dòng mang cảnh báo, và lượt ghi này KHÔNG lùi lại được (AD-4).\n` +
          'Sửa bảng tính rồi chạy lại, hoặc chạy lại với `--du-biet-canh-bao` để ghi bất kể.',
      );
      return null;
    }

    return commitSeedOp(tx, ctx, { rows: rows.value, decisions });
  });
  if (result === null) process.exit(1); // đã in lý do ở trên; không ghi gì
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
