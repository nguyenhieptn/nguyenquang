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
import { getPersonOps, listConflictsOps, type GoiYGio, type RawPersonAssertion } from './read-ops';
export type { GoiYGio } from './read-ops';
import { xepChong, type AssertionStack } from './chong';

export type { AssertionStack, StackKind } from './chong';
/**
 * Luật xếp chồng, xuất ra cho tầng bày (story 6-8).
 *
 * `DON_TRI` — loại nào chỉ được có MỘT giá trị chính thức; `HANG` — thứ tự loại trên phiếu lý
 * lịch. Hàng chờ gom theo người cần cả hai, và chép tay chúng sang `components/` là đúng lỗi mà
 * lượt code review 6-3 vừa bắt ở `SeedRowWarning`. Đây là bề mặt, nên `app/` gọi được (AD-1).
 */
export { DON_TRI, HANG, NHAN } from './chong';
/**
 * Kiểu của khoá ba bảng trên. Xuất lại từ `@/db/schema` vì `app/` và `components/` bị eslint cấm
 * import `@/db` (AD-1) — mà không có kiểu này thì nơi gọi phải tra bằng `string` và mất đúng
 * phép kiểm `tsc` mà ba bảng ấy dựng ra. `export type` bị xoá lúc biên dịch: không kéo gì vào bó.
 */
export type { AssertionKind } from '@/db/schema';
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
  /**
   * KHOÁ PHỤ cho phép xếp chồng (story 6-5) — rút từ `value` ở `read-ops`, vì `xepChong` thuần và
   * chỉ thấy `kind`:
   *   · `place`        → vai: `que-quan` · `tru-quan` · `an-tang`
   *   · `parent-child` → `${giới của cha/mẹ}|${relation}`, giới `?` khi chưa rõ
   * Hai `que-quan` khác nơi, hay hai cha cùng giới cùng `relation`, là MÂU THUẪN mà 5-3 để lọt.
   */
  nhomPhu?: string;
  /** `place`: id nơi ĐÃ GIẢI chuỗi gộp (AD-3) — hai lời khai về cùng một nơi không phải mâu thuẫn. */
  noiId?: string;
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
  /** FR-41 (7-5) — gợi ý ngày giỗ từ ngày mất chính xác, khi chưa có giỗ. Xem `read-ops § GoiYGio`. */
  goiYGio?: GoiYGio;
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
    ...(raw.value.goiYGio !== undefined ? { goiYGio: raw.value.goiYGio } : {}),
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

// ── Mâu thuẫn trên cả dòng họ (story 6-5) ──────────────────────────────────────────────────

export type NguoiCoMauThuan = {
  personId: string;
  personName: string;
  /** CHỈ các chồng `mau-thuan` của người ấy — cùng phép `xepChong` với phiếu ở cột phải. */
  chong: AssertionStack[];
};

/**
 * Chỉ ĐẾM số người có mâu thuẫn — cho số trên thanh việc (sửa 29/08 sau code review 6-5).
 *
 * Thanh việc dựng ở mọi request `/admin/*`, và bản đầu gọi `listConflicts()` rồi `.length`: tra
 * tên tài khoản cho mọi dòng của mọi người rồi vứt đi, xếp chồng hai lượt, mang cả dòng ra khỏi
 * core để đếm. Phép quét là cái giá thật của một con số sống (hàng chờ cũng quét); phần thừa
 * quanh nó thì không.
 */
export async function demMauThuan(): Promise<Result<number>> {
  const viewer = await resolveViewer();
  if (!viewer) return err('unauthenticated', 'no session and no clan to view');
  const raw = await withClanContext(viewer.clanId, (tx) => listConflictsOps(tx, viewer));
  return raw.ok ? ok(raw.value.length) : raw;
}

/**
 * Mọi người trong phả đang có ít nhất một chồng mâu thuẫn. Quyền duyệt (như hàng chờ) — một
 * mâu thuẫn là hai lời khai chưa được đối chiếu, tức thông tin của bàn tu phả.
 */
export async function listConflicts(): Promise<Result<NguoiCoMauThuan[]>> {
  const viewer = await resolveViewer();
  if (!viewer) return err('unauthenticated', 'no session and no clan to view');
  const raw = await withClanContext(viewer.clanId, (tx) => listConflictsOps(tx, viewer));
  if (!raw.ok) return raw;
  const names = await lookupAccountNames(
    raw.value.flatMap((n) => n.assertions.map((a) => a.createdByAccountId)),
  );
  return ok(
    raw.value.map((n) => ({
      personId: n.personId,
      personName: n.personName,
      chong: xepChong(n.assertions.map((a) => finishAssertion(a, names))).filter(
        (c) => c.stackKind === 'mau-thuan',
      ),
    })),
  );
}
