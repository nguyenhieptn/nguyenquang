/**
 * Better Auth wiring + session→context resolution — story 1-4 implementation of the two
 * contract stubs. The exported names and shapes are contract — session.ts dynamic-imports them.
 *
 * AD-8: the Better Auth session proves control of an email; everything that matters — clan,
 * node, role — comes from the vouched `attachment` row, read here under the clan context.
 * An authenticated account with NO active attachment is a 'guest' with personId null: a
 * PERMANENT possible state (core/types 'unattached'), not a transition.
 */
import { and, eq } from 'drizzle-orm';
import { withClanContext } from '@/db';
import { attachment } from '@/db/schema';
import type { GuestContext, SessionContext } from './session';
import { auth } from './ba';
import { soleClanId } from './clan-registry';

export async function resolveSessionImpl(headers: Headers): Promise<SessionContext | null> {
  const session = await auth.api.getSession({ headers });
  if (!session) return null;

  // Single-clan era: the deployment's clan comes from configuration (clan-registry, AD-14).
  // Before bootstrap there is no clan — an authenticated account still has no context.
  const clanId = soleClanId();
  if (!clanId) return null;

  const accountId = session.user.id;
  const [active] = await withClanContext(clanId, (tx) =>
    tx
      .select()
      .from(attachment)
      .where(and(eq(attachment.accountId, accountId), eq(attachment.status, 'active'))),
  );

  if (!active) return { accountId, clanId, personId: null, role: 'guest' };
  return { accountId, clanId, personId: active.personId, role: active.role };
}

/** Guest scoped to the sole existing clan (null when no clan seeded yet). */
export async function guestContextImpl(): Promise<GuestContext | null> {
  const clanId = soleClanId();
  if (!clanId) return null;
  return { accountId: null, clanId, personId: null, role: 'guest' };
}
