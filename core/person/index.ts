/**
 * core/person — adapter surface (AD-24: no identity parameters anywhere below).
 *
 * Writes go through core/assertion (addPerson wraps createPersonOp — AD-9/AD-19); THIS
 * surface is the read side: one person's profile for trang một người (story 2-7) and the
 * surfaces around it (2-2/2-8/2-9). Everything is radius-filtered through
 * core/identity/privacy BEFORE it leaves the core (AD-13/AD-21); what is outside the
 * radius is absent from the payload, not flagged hidden.
 */
import { err, ok, type Result } from '@/core/types';
import type { AssertionKind, Confidence, Tier } from '@/db/schema';
import type { PersonCard } from '@/core/tree';
import type { Visibility } from '@/core/identity/privacy';
import { resolveViewer } from '@/core/identity/session';
import { withClanContext } from '@/db';
import { lookupAccountNames } from '@/core/assertion/ops';
import { getPersonOps, type RawPersonAssertion } from './read-ops';
import type { RawPersonCard } from '@/core/tree/ops';

export type SourceKind = 'self' | 'told-by' | 'document' | 'recording' | 'seed-import';

/** One LIVE claim about the person, phrased for surface A (FR-1/FR-2 panel). */
export type PersonAssertion = {
  assertionId: string;
  kind: AssertionKind;
  /** Human Vietnamese: 'năm sinh 1941 (ước chừng)', 'là con ruột của <tên cha>'… */
  valueText: string;
  confidence: Confidence;
  tier: Tier;
  status: 'live' | 'hidden';
  sourceKind: SourceKind;
  sourceDescription: string;
  /** kind 'told-by' sources: who told it (radius-filtered name). */
  toldByName?: string;
  createdByName: string;
  createdAt: string; // ISO
};

export type PersonRelations = {
  parents: PersonCard[];
  children: PersonCard[];
  partners: PersonCard[];
};

export type PersonProfile = {
  /** Same field semantics as every tree card — already radius-filtered. */
  card: PersonCard;
  /** From live parent-child + union-partner assertions; each card filtered independently. */
  relations: PersonRelations;
  /** The viewer's level for THIS subject. */
  visibility: Visibility;
  /** ONLY when visibility === 'full': every live assertion about the person. */
  assertions?: PersonAssertion[];
  /** Set when the requested id was a merged tombstone — the winner is returned (AD-3). */
  redirectedFrom?: string;
};

/** Trang một người (2-7): profile + relations + (at full visibility) the claim panel. */
export async function getPerson(personId: string): Promise<Result<PersonProfile>> {
  const viewer = await resolveViewer();
  if (!viewer) return err('unauthenticated', 'no session and no clan to view');
  const raw = await withClanContext(viewer.clanId, (tx) => getPersonOps(tx, viewer, personId));
  if (!raw.ok) return raw;

  // Account display names live outside the clan partition (AD-8) — dbGlobal after the tx.
  const cards = [
    raw.value.card,
    ...raw.value.relations.parents,
    ...raw.value.relations.children,
    ...raw.value.relations.partners,
  ];
  const names = await lookupAccountNames([
    ...cards.flatMap((c) => (c.attribution ? [c.attribution.byAccountId] : [])),
    ...(raw.value.assertions ?? []).map((a) => a.createdByAccountId),
  ]);

  return ok({
    card: finishCard(raw.value.card, names),
    relations: {
      parents: raw.value.relations.parents.map((c) => finishCard(c, names)),
      children: raw.value.relations.children.map((c) => finishCard(c, names)),
      partners: raw.value.relations.partners.map((c) => finishCard(c, names)),
    },
    visibility: raw.value.visibility,
    ...(raw.value.assertions !== undefined
      ? { assertions: raw.value.assertions.map((a) => finishAssertion(a, names)) }
      : {}),
    ...(raw.value.redirectedFrom !== undefined
      ? { redirectedFrom: raw.value.redirectedFrom }
      : {}),
  });
}

function finishCard(raw: RawPersonCard, names: Map<string, string>): PersonCard {
  const { attribution, ...rest } = raw;
  const byName = attribution ? names.get(attribution.byAccountId) : undefined;
  return { ...rest, attribution: attribution && byName ? { byName, at: attribution.at } : null };
}

function finishAssertion(raw: RawPersonAssertion, names: Map<string, string>): PersonAssertion {
  const { createdByAccountId, ...rest } = raw;
  return { ...rest, createdByName: names.get(createdByAccountId) ?? createdByAccountId };
}
