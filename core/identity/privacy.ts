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
 *  - minors: treated as hidden outside the radius, always — no opt-out;
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
  if (viewer.role === 'admin' || viewer.role === 'branch-head') return 'full';
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
