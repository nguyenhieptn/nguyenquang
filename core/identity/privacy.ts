import type { Role } from './session';

/**
 * AD-13 — privacy radius as a PURE function. No configuration surface, no widening.
 *
 * Every read path maps (viewer, subject, relationship distance) → Visibility BEFORE data
 * leaves the core (AD-21). Distance is measured over accepted parent-child + union edges
 * (core/tree.relationshipDistance); null = no known path.
 *
 * The defaults are the PRD §11 table, verbatim:
 *  - the dead: fully visible to everyone (a genealogy is the record of the dead);
 *  - the living, within 3 bậc (or self): full detail;
 *  - the living, outside the radius or for guests: name + tree position + birth YEAR only;
 *  - hiddenFromPublic (FR-55 "được ẩn"): outside the radius the person becomes anonymous —
 *    a placeholder that keeps the genealogical link ("được ẩn, không được xóa");
 *  - minors: treated as hidden outside the radius, always — no opt-out (a living person with NO
 *    birth date is NOT a minor: the decision, and its cost on capture flows, is argued at
 *    `isMinor` below);
 *  - admin / branch-head hold the approval right (FR-3) and therefore see full detail —
 *    one cannot approve what one cannot read.
 */

export const PRIVACY_RADIUS = 3;
export const ADULT_AGE = 18;

export type Visibility = 'full' | 'limited' | 'anonymous';

export type PrivacySubject = {
  isLiving: boolean;
  birthDate: string | null; // ISO date if known
  hiddenFromPublic: boolean;
};

export type PrivacyViewer = {
  role: 'admin' | 'branch-head' | 'member' | 'guest';
  personId: string | null;
};

/**
 * Minority is decided from the birth date alone. The interesting case is the one the data
 * usually has: a LIVING person with NO birth date — and the answer is deliberately `false`.
 *
 * AD-13 says the default is the restrictive branch, so the choice is argued, not assumed:
 *  - a genealogy is overwhelmingly adults, and a missing birth year is the NORMAL state of an
 *    old record ("cụ sinh năm nào không ai nhớ"), not a signal of youth. Treating unknown as
 *    minor would turn most of the living tree anonymous for everyone outside 3 bậc — the
 *    placeholder "Một người trong họ" would become the tree, and the phả would stop being a
 *    phả for exactly the people it is written for;
 *  - the restrictive default is not lost, only carried by the other branch: an unknown-birth
 *    living person outside the radius is already 'limited' — name + tree position + birth YEAR
 *    (which is null here anyway), no contact, no notes, no assertion history. What minority
 *    would add is anonymity of the NAME, and a name inside the clan tree is the one thing FR-55
 *    hands to the subject themself via `hiddenFromPublic`, which IS honoured with no age test;
 *  - the restrictive branch stays automatic wherever the fact is actually known: a birth date
 *    under 18 years old is anonymous outside the radius, always, with no opt-out.
 *
 * The cost of the decision lands on capture, not on reading: every flow that adds a CHILD must
 * ask for a birth year (2-3/2-5 tự khai + thêm người thân), because that year is what arms this
 * protection. A child entered with no year is protected only by `hiddenFromPublic`.
 *
 * A death date makes the question moot — the dead are 'full' to everyone before this is called.
 */
export function isMinor(subject: PrivacySubject, today = new Date()): boolean {
  if (!subject.isLiving || !subject.birthDate) return false;
  const birth = new Date(subject.birthDate);
  const age = (today.getTime() - birth.getTime()) / (365.25 * 24 * 3600 * 1000);
  return age < ADULT_AGE;
}

export function visibilityFor(
  viewer: PrivacyViewer,
  subject: PrivacySubject & { personId?: string },
  distance: number | null,
  today = new Date(),
): Visibility {
  if (!subject.isLiving) return 'full';
  if (coQuyenDuyet(viewer)) return 'full';
  if (viewer.personId && subject.personId && viewer.personId === subject.personId) return 'full';

  const inRadius = viewer.personId !== null && distance !== null && distance <= PRIVACY_RADIUS;
  if (inRadius) return 'full';

  // Outside the radius (including every guest):
  if (subject.hiddenFromPublic || isMinor(subject, today)) return 'anonymous';
  return 'limited';
}

/** Field policy per level — reads derive their payload from THIS, never ad hoc. */
export function fieldsFor(level: Visibility): {
  showName: boolean;
  showBirth: 'full' | 'year' | 'none';
  showDeath: 'full' | 'none'; // living people have no death; the dead are always 'full'
  showNotes: boolean;
  showAssertions: boolean; // FR-1 panel + history (AD-21 covers revisions too)
} {
  switch (level) {
    case 'full':
      return { showName: true, showBirth: 'full', showDeath: 'full', showNotes: true, showAssertions: true };
    case 'limited':
      return { showName: true, showBirth: 'year', showDeath: 'full', showNotes: false, showAssertions: false };
    case 'anonymous':
      return { showName: false, showBirth: 'none', showDeath: 'none', showNotes: false, showAssertions: false };
  }
}

/** Placeholder identity for 'anonymous' — keeps the genealogical link, hides the person. */
export const ANONYMOUS_LABEL = 'Một người trong họ';

/**
 * LENS, không phải GATE (story 7-1): "người này NHÌN được gì" — quản trị và đầu mối chi thấy trọn
 * (AD-21). Bốn chỗ trong core (privacy · audit · media · merge) và `lib/vai-quan-tri.ts` từng chép
 * `role === 'admin' || 'branch-head'`; một tên cho một câu hỏi, để lượt thêm vai sửa một chỗ.
 * Kiểu là `Role`, không phải `string` — một vai gõ sai phải là lỗi biên dịch. Chặn GHI thì dùng
 * `gateApprover`.
 */
export function coQuyenDuyet(viewer: { role: Role }): boolean {
  return viewer.role === 'admin' || viewer.role === 'branch-head';
}
