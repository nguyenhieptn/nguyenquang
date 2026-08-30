/**
 * ĐẾM `revision` — hàng rào cuối của AD-4.
 *
 * `cam-bam.test.ts` gác bằng cách đọc mã nguồn, nên nó chỉ thấy những chọn tử viết thẳng ra. Một
 * cú bấm nấp sau chọn tử động (`nth(1)`, `.first()`) thì nó không thấy. Con số này thì thấy: mọi
 * mutation ghi một hàng `revision` trong cùng transaction (AD-10), nên phả đổi mà bảng này không
 * đổi là chuyện không xảy ra được.
 *
 * ── Vì sao phải đặt clan context, và vì sao chuyện này suýt trôi qua ────────────────────────
 * Bản đầu chạy `select count(*) from revision` thẳng trên `ownerPool()`. Nó KHÔNG lỗi, không cảnh
 * báo, và trả về một con số trông hoàn toàn bình thường: **0**. Bản kê in `revision 0 → 0 — phả
 * không đổi ✓`, và hàng rào cuối của AD-4 coi như đang bật.
 *
 * Nó đang tắt. `revision` là bảng phân vùng có RLS **ép buộc** (AD-20: `FORCE ROW LEVEL SECURITY`,
 * app role không sở hữu bảng, context `app.clan_id` fail-closed), nên không đặt context thì mọi
 * hàng bị lọc sạch. Đo thật: **0 hàng không context · 77 hàng có context**. Một lượt đo có ghi
 * bậy vào phả vẫn ra `0 → 0`.
 *
 * Đây đúng là bài học đã viết sẵn ở `core/gates/rls.gate.test.ts`: một cổng ĐỎ được thì mới là
 * cổng; cổng luôn xanh vì không thấy gì thì chỉ trông giống cổng.
 */
import 'dotenv/config';
import { ownerPool } from '@/db';

export async function demRevision(): Promise<number | null> {
  let pool;
  try {
    pool = ownerPool();
    // `clan` đọc được không cần context — nó là danh bạ dòng họ, không chứa dữ liệu về người
    // (migration 0002_clan_directory; xem `core/gates/rls.gate.test.ts` đầu file).
    const ds = await pool.query<{ id: string }>('select id from clan');
    if (ds.rows.length === 0) return null;

    let tong = 0;
    for (const { id } of ds.rows) {
      const cl = await pool.connect();
      try {
        /**
         * `SET LOCAL` trong một transaction, đúng nếp `db/index.ts § withClanContext`. Bản đầu
         * dùng `set_config(…, false)` — phạm vi PHIÊN — trên một kết nối đi mượn từ pool, nên id
         * dòng họ ở lại trên kết nối ấy sau khi trả về, và lượt mượn sau đọc `revision` của dòng
         * họ trước nếu quên đặt lại. Hôm nay không ai quên, nhưng đó là thứ chỉ giữ được bằng
         * thói quen (code review 6-6).
         */
        await cl.query('BEGIN');
        await cl.query('select set_config($1, $2, true)', ['app.clan_id', id]);
        const kq = await cl.query<{ n: number }>('select count(*)::int as n from revision');
        await cl.query('COMMIT');
        const n = kq.rows[0]?.n;
        if (typeof n !== 'number') return null;
        tong += n;
      } finally {
        cl.release();
      }
    }
    return tong;
  } catch {
    return null;
  } finally {
    await pool?.end().catch(() => {});
  }
}
