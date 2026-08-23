/**
 * Database access — importable from `core/` ONLY (AD-1; enforced by eslint no-restricted-imports).
 *
 * Two entry points, on purpose:
 *
 * - `withClanContext(clanId, fn)` — THE way to touch clan data. Opens a transaction, sets the
 *   RLS session variable `app.clan_id` with SET LOCAL, hands the transaction to `fn`. Every
 *   policy reads that variable and fails closed when unset (AD-7/AD-20) — so a query outside
 *   this wrapper sees zero rows, it does not leak.
 * - `dbGlobal` — the same app-role connection WITHOUT clan context, for the few tables that are
 *   not clan data (Better Auth identity tables — AD-8). Clan tables read through it return
 *   nothing, by design.
 *
 * The clanId argument comes from core/identity's session resolution (AD-24) — adapters never
 * hold a clanId to pass.
 */
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

const pool = new Pool({
  // eslint-disable-next-line no-restricted-syntax
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

export type Db = NodePgDatabase<typeof schema>;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

export const dbGlobal: Db = drizzle(pool, { schema });

/** UUID sanity — the value goes into SET LOCAL via string interpolation (SET cannot bind params). */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function withClanContext<T>(clanId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  if (!UUID_RE.test(clanId)) throw new Error(`withClanContext: invalid clan id`);
  return dbGlobal.transaction(async (tx) => {
    // SET LOCAL dies with the transaction — no leakage into the pooled connection.
    await tx.execute(sql.raw(`SET LOCAL app.clan_id = '${clanId}'`));
    return fn(tx);
  });
}

/** For scripts/tests that must act as owner (migrations, seeds, gates). Never in app code. */
export function ownerPool(): Pool {
  // eslint-disable-next-line no-restricted-syntax
  const url = process.env.DATABASE_URL_OWNER;
  if (!url) throw new Error('DATABASE_URL_OWNER not set');
  return new Pool({ connectionString: url, max: 3 });
}
