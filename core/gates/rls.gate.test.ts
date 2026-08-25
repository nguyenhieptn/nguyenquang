/**
 * AD-20 release gates. Two checks the spine names explicitly, because each of the four RLS
 * details (ENABLE, FORCE, non-owner role, fail-closed context) fails SILENTLY on its own:
 *
 *  Gate 1 — schema: every table in PARTITIONED_TABLES has RLS enabled, forced, and ≥1 policy.
 *  Gate 2 — behaviour: two clans are seeded; neither can read the other's PEOPLE; no context
 *           reads no people; writing into the wrong clan under a context is rejected.
 *
 * ── Đổi 25/08/2026 (migration 0002_clan_directory) ────────────────────────────────────────
 * Bảng `clan` nay ĐỌC ĐƯỢC không cần context — nó là danh bạ dòng họ (tên · họ · chữ đệm · đề
 * từ), không chứa dữ liệu về người, và `soleClanId()` đọc từ đó thay cho biến môi trường
 * `GIAPHA_CLAN_ID` đã bỏ. Hai câu khẳng định cũ ("context A chỉ thấy clan A", "không context thì
 * bảng clan rỗng") vì thế được sửa CÓ CHỦ Ý, và thay bằng câu mạnh hơn: đọc thì mở, GHI thì vẫn
 * bị chặn đúng như cũ.
 *
 * ── Sửa 25/08 sau code review: chú thích cũ ở đây NÓI SAI ─────────────────────────────────
 * Nó khẳng định "nếu ai đó vô tình nới `SELECT` cho một bảng phân vùng, gate vẫn gãy". Không
 * đúng: Gate 1 chỉ đếm `policies >= 1`, mà một policy `USING (true)` cũng thoả; còn Gate 2 hồi ấy
 * chỉ thử cách ly trên `person`. Bảng `place` thêm cùng ngày vì thế ra đời **không có một bằng
 * chứng hành vi nào** rằng dòng họ A không đọc được nơi của dòng họ B.
 *
 * Nay Gate 2 duyệt MỌI bảng trong `PARTITIONED_TABLES`, và có thêm một bài đọc thẳng biểu thức
 * policy để bắt `USING (true)`. Đó mới là điều chú thích cũ hứa.
 *
 * These run against the real database (vitest, sequential). If they fail the build must not ship.
 */
import { describe, it, expect, afterAll } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { sql } from 'drizzle-orm';
import { dbGlobal, withClanContext, ownerPool } from '@/db';
import { clan, person, PARTITIONED_TABLES } from '@/db/schema';

const owner = ownerPool();

const clanA = uuidv7();
const clanB = uuidv7();

async function seedClan(id: string, name: string) {
  // clan rows are themselves RLS-guarded (visible only as current context), so creation happens
  // under the clan's own context — the same way core/clan bootstrap does it.
  await withClanContext(id, async (tx) => {
    await tx.insert(clan).values({ id, name });
  });
}

afterAll(async () => {
  // Owner is also under FORCE RLS — clean up with explicit context per clan.
  for (const id of [clanA, clanB]) {
    await owner.query(`BEGIN`);
    await owner.query(`SET LOCAL app.clan_id = '${id}'`);
    await owner.query(`DELETE FROM person WHERE clan_id = $1`, [id]);
    await owner.query(`DELETE FROM clan WHERE id = $1`, [id]);
    await owner.query(`COMMIT`);
  }
  await owner.end();
});

describe('Gate 1 — schema: RLS enabled + forced + policy on every partitioned table', () => {
  it('covers clan and every table in PARTITIONED_TABLES', async () => {
    const res = await owner.query(
      `SELECT c.relname AS tbl, c.relrowsecurity AS rls, c.relforcerowsecurity AS forced,
              (SELECT count(*)::int FROM pg_policy p WHERE p.polrelid = c.oid) AS policies
       FROM pg_class c
       WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'r'`,
    );
    type RlsRow = { tbl: string; rls: boolean; forced: boolean; policies: number };
    const byName = new Map((res.rows as RlsRow[]).map((r) => [r.tbl, r]));
    for (const tbl of ['clan', ...PARTITIONED_TABLES]) {
      const row = byName.get(tbl);
      expect(row, `table ${tbl} missing`).toBeTruthy();
      if (!row) continue;
      expect(row.rls, `${tbl}: RLS not enabled`).toBe(true);
      expect(row.forced, `${tbl}: RLS not FORCED`).toBe(true);
      expect(row.policies, `${tbl}: no policy`).toBeGreaterThanOrEqual(1);
    }
  });

  it('app role holds no BYPASSRLS and owns nothing', async () => {
    const role = await owner.query(`SELECT rolbypassrls FROM pg_roles WHERE rolname = 'giapha_app'`);
    expect(role.rows[0]?.rolbypassrls).toBe(false);
    const owned = await owner.query(
      `SELECT count(*)::int AS n FROM pg_tables WHERE schemaname = 'public' AND tableowner = 'giapha_app'`,
    );
    expect(owned.rows[0].n).toBe(0);
  });
});

describe('Gate 2 — behaviour: two clans, neither reads the other', () => {
  it('seeds two clans and isolates them completely', async () => {
    await seedClan(clanA, 'Gate Clan A');
    await seedClan(clanB, 'Gate Clan B');

    const pA = uuidv7();
    const pB = uuidv7();
    await withClanContext(clanA, async (tx) => {
      await tx.insert(person).values({ id: pA, clanId: clanA, fullName: 'Người Clan A', nameFolded: 'nguoi clan a' });
    });
    await withClanContext(clanB, async (tx) => {
      await tx.insert(person).values({ id: pB, clanId: clanB, fullName: 'Người Clan B', nameFolded: 'nguoi clan b' });
    });

    // Context A sees only A's PEOPLE. Danh bạ dòng họ thì mở cho cả hai — đó là chỗ đã đổi.
    await withClanContext(clanA, async (tx) => {
      const people = await tx.select().from(person);
      expect(people.map((p) => p.id)).toEqual([pA]);

      const ids = (await tx.select().from(clan)).map((c) => c.id);
      expect(ids, 'danh bạ phải thấy cả hai dòng họ').toEqual(expect.arrayContaining([clanA, clanB]));
    });

    // Context B sees only B.
    await withClanContext(clanB, async (tx) => {
      const people = await tx.select().from(person);
      expect(people.map((p) => p.id)).toEqual([pB]);
    });
  });

  it('fails closed: no context ⇒ zero PEOPLE, not all people', async () => {
    const people = await dbGlobal.select().from(person);
    expect(people).toEqual([]);
  });

  /**
   * MỌI bảng phân vùng, không chỉ `person`. Một bài kiểm chỉ soi một bảng thì nó kiểm bảng ấy,
   * không kiểm cái luật — và bảng thứ mười một ra đời không có bằng chứng nào.
   */
  it('mọi bảng phân vùng đều fail-closed khi không có clan context', async () => {
    const hong: string[] = [];
    for (const tbl of PARTITIONED_TABLES) {
      const r = await owner.query(`SELECT count(*)::int AS n FROM "${tbl}"`).catch(() => null);
      const n = r ? ((r.rows[0] as { n: number }).n ?? 0) : -1;
      if (n !== 0) hong.push(`${tbl}=${n}`);
    }
    expect(hong, 'bảng đọc ra dữ liệu khi KHÔNG có clan context').toEqual([]);
  });

  it('policy của bảng phân vùng phải LỌC THEO clan, không được là USING (true)', async () => {
    /**
     * HAI vế, không phải một — sửa 25/08 sau code review lượt hai.
     *
     * Bản đầu chỉ đọc `polqual` (vế `USING`, tức vế ĐỌC) rồi ép nó phải chứa `current_clan_id()`.
     * Nhưng policy `FOR INSERT` **không có** vế ấy: Postgres để `polqual` NULL và chỉ có
     * `polwithcheck`. Bản đầu quy NULL về chuỗi rỗng rồi báo đỏ với nhãn "policy đọc mở toang" —
     * về một policy không có vế đọc nào.
     *
     * Không phải chuyện giả định: `db/migrations/0002_clan_directory.sql` đã tạo đúng hình dạng
     * ấy (`clan_insert`). Nó sống sót chỉ vì `clan` không nằm trong `PARTITIONED_TABLES`. Người
     * tiếp theo tách `person_isolation` thành cặp SELECT/INSERT — đúng hình mà 0002 làm mẫu — sẽ
     * ăn một gate đỏ vô nghĩa và mất buổi sáng đi tìm.
     *
     * Luật đúng: policy phải lọc theo clan trên VẾ MÀ NÓ CÓ, và phải có ít nhất một vế.
     */
    const res = await owner.query(
      `SELECT c.relname AS tbl,
              p.polname AS ten,
              pg_get_expr(p.polqual, p.polrelid) AS doc,
              pg_get_expr(p.polwithcheck, p.polrelid) AS ghi
       FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid
       WHERE c.relnamespace = 'public'::regnamespace`,
    );
    type Hang = { tbl: string; ten: string; doc: string | null; ghi: string | null };
    const theoBang = new Map<string, Hang[]>();
    for (const r of res.rows as Hang[]) {
      theoBang.set(r.tbl, [...(theoBang.get(r.tbl) ?? []), r]);
    }
    for (const tbl of PARTITIONED_TABLES) {
      const ps = theoBang.get(tbl) ?? [];
      expect(ps.length, `${tbl}: không có policy nào`).toBeGreaterThanOrEqual(1);
      for (const p of ps) {
        const ve = [p.doc, p.ghi].filter((v): v is string => v !== null);
        expect(ve.length, `${tbl}.${p.ten}: policy không có vế nào — không gác gì cả`)
          .toBeGreaterThanOrEqual(1);
        for (const v of ve) {
          expect(v, `${tbl}.${p.ten}: có vế không lọc theo clan`).toContain('current_clan_id()');
        }
      }
    }
  });

  /**
   * Đây là điều `soleClanId()` dựa vào: không có context vẫn đọc được danh bạ. Nếu ai đó khôi
   * phục `clan_isolation` thì bài này gãy, và gãy kèm lý do — chứ không phải cả ứng dụng lặng lẽ
   * mất phiên đăng nhập vì `soleClanId()` trả `null`.
   */
  it('danh bạ dòng họ đọc được KHÔNG cần context — nền của soleClanId()', async () => {
    const ids = (await dbGlobal.select().from(clan)).map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining([clanA, clanB]));
  });

  /** Đọc mở KHÔNG kéo theo ghi mở: `WITH CHECK id = current_clan_id()` vẫn gác mọi lối ghi. */
  it('vẫn chặn tạo một dòng họ khác dưới context đang có', async () => {
    let thrown: unknown;
    try {
      await withClanContext(clanA, async (tx) => {
        await tx.insert(clan).values({ id: uuidv7(), name: 'Dòng họ lậu' });
      });
    } catch (e) {
      thrown = e;
    }
    expect(thrown, 'ghi clan ngoài context lẽ ra phải bị RLS chặn').toBeTruthy();
  });

  it('rejects writing a row whose clan_id differs from the context', async () => {
    // Drizzle wraps the pg error — walk the cause chain for the RLS violation.
    let thrown: unknown;
    try {
      await withClanContext(clanA, async (tx) => {
        await tx.insert(person).values({
          id: uuidv7(),
          clanId: clanB, // lied about the partition
          fullName: 'Kẻ vượt rào',
          nameFolded: 'ke vuot rao',
        });
      });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeTruthy();
    const messages: string[] = [];
    for (let e = thrown as { message?: string; cause?: unknown } | undefined; e; e = e.cause as never) {
      if (e.message) messages.push(e.message);
    }
    expect(messages.join(' | ')).toMatch(/row-level security/i);
  });

  it('empty-string context also fails closed (nullif guard)', async () => {
    const rows = await dbGlobal.transaction(async (tx) => {
      await tx.execute(sql.raw(`SET LOCAL app.clan_id = ''`));
      return tx.select().from(person);
    });
    expect(rows).toEqual([]);
  });
});
