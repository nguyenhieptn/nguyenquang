/**
 * Single-clan era clan registry (story 1-4).
 *
 * RLS on `clan` fails closed (AD-20): without a clan context nothing can even LIST clans, so
 * "which clan is this deployment serving?" cannot be answered from the database by the app
 * role. The answer is configuration-as-data (AD-14): the active clan id lives in the
 * environment — `GIAPHA_CLAN_ID`, written into `.env` by `scripts/bootstrap-clan.ts` after
 * seeding. Nothing Nguyễn-Quang-specific is in code; a second deployment is a different env.
 *
 * Read LAZILY per call, never at module load — tests set `process.env.GIAPHA_CLAN_ID`
 * in-process, and the bootstrap script sets it after creating the clan.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The sole clan this deployment serves, or null when not yet bootstrapped. */
export function soleClanId(): string | null {
  const id = process.env.GIAPHA_CLAN_ID;
  return id && UUID_RE.test(id) ? id : null;
}
