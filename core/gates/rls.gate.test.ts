/**
 * AD-20 release gates. Two checks the spine names explicitly, because each of the four RLS
 * details (ENABLE, FORCE, non-owner role, fail-closed context) fails SILENTLY on its own:
 *
 *  Gate 1 — schema: every table in PARTITIONED_TABLES has RLS enabled, forced, and ≥1 policy.
 *  Gate 2 — behaviour: two clans are seeded; neither can read the other; no context reads nothing;
 *           writing into the wrong clan under a context is rejected.
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

    // Context A sees only A — including via the clan table itself.
    await withClanContext(clanA, async (tx) => {
      const people = await tx.select().from(person);
      expect(people.map((p) => p.id)).toEqual([pA]);
      const clans = await tx.select().from(clan);
      expect(clans.map((c) => c.id)).toEqual([clanA]);
    });

    // Context B sees only B.
    await withClanContext(clanB, async (tx) => {
      const people = await tx.select().from(person);
      expect(people.map((p) => p.id)).toEqual([pB]);
    });
  });

  it('fails closed: no context ⇒ zero rows, not all rows', async () => {
    const people = await dbGlobal.select().from(person);
    expect(people).toEqual([]);
    const clans = await dbGlobal.select().from(clan);
    expect(clans).toEqual([]);
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
