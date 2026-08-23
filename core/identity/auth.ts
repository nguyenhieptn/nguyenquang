/**
 * Better Auth wiring + session→context resolution — story 1-4 REPLACES the two stub bodies
 * below with the real implementation (Better Auth instance, attachment lookup, role).
 * The exported names and shapes are contract — session.ts dynamic-imports them.
 */
import type { GuestContext, SessionContext } from './session';

export async function resolveSessionImpl(_headers: Headers): Promise<SessionContext | null> {
  throw new Error('NOT_IMPLEMENTED — story 1-4');
}

/** Guest scoped to the sole existing clan (null when no clan seeded yet). */
export async function guestContextImpl(): Promise<GuestContext | null> {
  throw new Error('NOT_IMPLEMENTED — story 1-4');
}
