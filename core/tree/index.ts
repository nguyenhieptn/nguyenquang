/**
 * core/tree — derived structure (story 1-3 implements; signatures are CONTRACT).
 *
 * AD-5: generation numbers, branch codes, fragments, roots — ALL computed at request time from
 * accepted parent-child assertions (+ tentative ones marked as such). Nothing here is stored.
 * AD-13/AD-21: every read filters through the viewer's privacy radius BEFORE returning —
 * what is outside the radius is absent from the payload, not flagged hidden.
 * AD-24: no identity parameters — the viewer is resolved from the session here, then the work
 * runs inside withClanContext. Internal computation lives in ops.ts (takes (tx, ctx, args)).
 */
import type { Result } from '@/core/types';
import type { Confidence, Tier } from '@/db/schema';
import { err, ok } from '@/core/types';
import { resolveViewer } from '@/core/identity/session';
import { withClanContext } from '@/db';
import {
  accountNames,
  getAncestryPathOps,
  getBranchViewOps,
  getClanOverviewOps,
  relationshipDistanceOps,
  searchPersonsOps,
  type RawPersonCard,
} from './ops';

/** What any tree/list surface knows about one person — already radius-filtered. */
export type PersonCard = {
  personId: string;
  fullName: string;
  tier: Tier;
  confidence: Confidence;
  isLiving: boolean;
  /** Year only for the living (FR-37 default); full display string for the dead. */
  lifespan: string; // "1941–2019", "sinh 1985", ""
  /** Derived at request time (AD-5). null when the viewer's fragment doesn't reach a root. */
  generation: number | null;
  branchCode: string | null; // "1.3.2"
  /** FR-39 attribution for the node card: "cháu Khánh ghi · hôm nay". */
  attribution: { byName: string; at: string } | null;
};

export type CoupleNode = {
  person: PersonCard;
  /** Spouse(s) share the card (EXPERIENCE.md § Responsive — vợ/chồng chung một thẻ). */
  partners: PersonCard[];
  childrenIds: string[];
};

export type Fragment = {
  /** Provisional root — "cụ xa nhất hiện biết", NOT a Thủy tổ claim (FR-63). */
  rootPersonId: string;
  rootName: string;
  personCount: number;
  tentativeCount: number;
};

/** Tầng 1 — khối chi + mảnh chưa nối, vẽ tách hẳn (FR-48). */
export type ClanOverview = {
  mainFragment: Fragment | null;
  /** Branches under the main root: one block per child-line of the provisional root. */
  branches: {
    branchCode: string;
    headName: string;
    personCount: number;
    tentativeCount: number;
    headPersonId: string;
  }[];
  /** Unconnected fragments — never drawn joined (FR-48). */
  unconnectedFragments: Fragment[];
};
export async function getClanOverview(): Promise<Result<ClanOverview>> {
  const viewer = await resolveViewer();
  if (!viewer) return err('unauthenticated', 'no session and no clan to view');
  return withClanContext(viewer.clanId, (tx) => getClanOverviewOps(tx, viewer));
}

/** Tầng 2 — một chi: generations of couple-nodes, viewer's generation expanded by default. */
export type BranchView = {
  branchCode: string;
  headPersonId: string;
  generations: { generation: number; couples: CoupleNode[] }[];
  viewerGeneration: number | null;
};
export async function getBranchView(headPersonId: string): Promise<Result<BranchView>> {
  const viewer = await resolveViewer();
  if (!viewer) return err('unauthenticated', 'no session and no clan to view');
  const raw = await withClanContext(viewer.clanId, (tx) =>
    getBranchViewOps(tx, viewer, headPersonId),
  );
  if (!raw.ok) return raw;
  const cards = raw.value.generations.flatMap((g) =>
    g.couples.flatMap((c) => [c.person, ...c.partners]),
  );
  const names = await accountNames(accountIdsOf(cards));
  return ok({
    ...raw.value,
    generations: raw.value.generations.map((g) => ({
      generation: g.generation,
      couples: g.couples.map((c) => ({
        person: finishCard(c.person, names),
        partners: c.partners.map((p) => finishCard(p, names)),
        childrenIds: c.childrenIds,
      })),
    })),
  });
}

/** Tầng 3 / FR-13 — the viewer's (or any person's) bloodline up to the provisional root. */
export type AncestryPath = {
  /** From the person upward; last element is the provisional root. */
  steps: PersonCard[];
  fragmentRootName: string;
  /** True when this path's fragment is the main one; false inside an unconnected fragment. */
  reachesMainRoot: boolean;
};
export async function getAncestryPath(personId: string): Promise<Result<AncestryPath>> {
  const viewer = await resolveViewer();
  if (!viewer) return err('unauthenticated', 'no session and no clan to view');
  const raw = await withClanContext(viewer.clanId, (tx) =>
    getAncestryPathOps(tx, viewer, personId),
  );
  if (!raw.ok) return raw;
  const names = await accountNames(accountIdsOf(raw.value.steps));
  return ok({ ...raw.value, steps: raw.value.steps.map((s) => finishCard(s, names)) });
}

/** FR-11/FR-48 — folded-name search with đời + chi context, radius-filtered (AD-16). */
export type SearchHit = PersonCard & { similar: boolean };
export async function searchPersons(query: string): Promise<Result<SearchHit[]>> {
  const viewer = await resolveViewer();
  if (!viewer) return err('unauthenticated', 'no session and no clan to view');
  const raw = await withClanContext(viewer.clanId, (tx) => searchPersonsOps(tx, viewer, query));
  if (!raw.ok) return raw;
  const names = await accountNames(accountIdsOf(raw.value));
  return ok(raw.value.map((h) => ({ ...finishCard(h, names), similar: h.similar })));
}

/** Relationship distance over blood + union edges — the privacy radius input (AD-13). */
export async function relationshipDistance(
  fromPersonId: string,
  toPersonId: string,
): Promise<Result<number | null>> {
  const viewer = await resolveViewer();
  if (!viewer) return err('unauthenticated', 'no session and no clan to view');
  return withClanContext(viewer.clanId, (tx) =>
    relationshipDistanceOps(tx, viewer, fromPersonId, toPersonId),
  );
}

// ── Attribution finishing: account ids → display names (identity data, read via dbGlobal
// AFTER the clan transaction — see ops.accountNames). An unresolvable account yields null. ──

function accountIdsOf(cards: RawPersonCard[]): string[] {
  return cards.flatMap((c) => (c.attribution ? [c.attribution.byAccountId] : []));
}

function finishCard(raw: RawPersonCard, names: Map<string, string>): PersonCard {
  const { attribution, ...rest } = raw;
  const byName = attribution ? names.get(attribution.byAccountId) : undefined;
  return { ...rest, attribution: attribution && byName ? { byName, at: attribution.at } : null };
}
