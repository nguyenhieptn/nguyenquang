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
import { xepChong, type AssertionStack } from './chong';

export type { AssertionStack, StackKind } from './chong';
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
  /**
   * Người ở ĐẦU KIA của một khẳng định quan hệ — cha/mẹ với `parent-child`, bạn đời với
   * `union-partner`. Vắng với mọi loại khác.
   *
   * Có mặt từ 26/08/2026 sau code review story 6-7: cột phải bày quan hệ thành chip bấm được,
   * mà chip dựng từ `relations` thì KHÔNG biết mình thuộc khẳng định nào — nên nó không mang
   * được tầng, không mang được nguồn, và hai lời khai về cùng một cặp thu lại thành một chip.
   * Dòng phải tự nói ra nó nói về ai.
   */
  doiTuongId?: string;
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
  /**
   * Story 5-3 — chính `assertions` ở trên, đã xếp thành CHỒNG và phân loại mâu thuẫn / nối tiếp.
   * Dẫn xuất, không phải một lượt đọc thứ hai. Vắng cùng lúc với `assertions`, tức khi người xem
   * không có tầm nhìn đầy đủ với người này (AD-13/AD-21).
   */
  stacks?: AssertionStack[];
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
      ? (() => {
          const assertions = raw.value.assertions!.map((a) => finishAssertion(a, names));
          return { assertions, stacks: xepChong(assertions) };
        })()
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
