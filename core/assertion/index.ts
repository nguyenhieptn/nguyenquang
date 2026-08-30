/**
 * core/assertion — the write path (story 1-2 implements; signatures are CONTRACT, other
 * modules and adapters compile against them — change them only with a reason written down).
 *
 * AD-9: one write path; everything enters tentative. AD-19: this module is the sole writer of
 * projected values on `person`. AD-24: no identity parameters — session is resolved inside.
 * Internal ops (ops.ts) take (tx, ctx, args) and are for core-internal use + tests only.
 */
import { err, ok, type Result } from '@/core/types';
import type { Confidence, DatePrecision } from '@/db/schema';
import { resolveViewer } from '@/core/identity/session';
import { withClanContext } from '@/db';
import {
  addAssertionOp,
  hideAssertionOp,
  listHiddenAssertionsOp,
  listPendingAssertionsOp,
  lookupAccountNames,
  promoteAssertionOp,
  rejectAssertionOp,
  restoreAssertionOp,
} from './ops';
import { createPersonOp } from '@/core/person/ops';

export type GenealogicalDate = { date?: string; precision: DatePrecision };

export type SourceSpec =
  | { kind: 'self' } // tự khai về mình
  | { kind: 'told-by'; toldByPersonId?: string; description: string }
  | { kind: 'document'; description: string }
  | { kind: 'recording'; recordingId: string }
  | { kind: 'seed-import'; description: string };

export type NewPersonInput = {
  fullName: string;
  gender?: 'male' | 'female' | 'other';
  birth?: GenealogicalDate;
  death?: GenealogicalDate; // presence ⇒ isLiving=false
  /** parent-child assertion: new person is the CHILD of this parent. */
  parentId?: string;
  /** ...or the PARENT of this child (thêm bố cho người đã có — Luồng 1 bước 5). */
  childId?: string;
  /** union-partner with an existing person (creates the union). */
  partnerId?: string;
  note?: string;
  source: SourceSpec;
  confidence?: Confidence; // default 'ton-nghi'
};

export type AssertionSpec =
  | { kind: 'name'; fullName: string }
  | { kind: 'gender'; gender: 'male' | 'female' | 'other' }
  | { kind: 'birth'; value: GenealogicalDate }
  | { kind: 'death'; value: GenealogicalDate }
  | { kind: 'parent-child'; parentId: string; relation?: 'blood' | 'adopted' | 'heir' }
  | { kind: 'union-partner'; partnerId: string; unionId?: string }
  | { kind: 'note'; text: string }
  /**
   * FR-65 (story 5-7) — nơi chốn. Ba vai của PRD §5b. `placeId` phải là một nơi đã có trong danh
   * mục; tạo nơi mới là `core/place.addPlace`, một việc riêng và có nhật ký riêng.
   */
  | { kind: 'place'; placeId: string; role: 'que-quan' | 'tru-quan' | 'an-tang' }
  /** FR-41 (story 7-5) — ngày giỗ âm lịch, chép lấy ngày nhà đang cúng. `nhuan` = tháng nhuận. */
  | { kind: 'gio'; thang: number; ngay: number; nhuan?: boolean };

export type AddedPerson = { personId: string; assertionIds: string[] };

/** AD-24: every surface below resolves identity itself; a null viewer means no clan exists yet. */
async function requireViewer() {
  const viewer = await resolveViewer();
  return viewer ?? null;
}

/** Create a person + initial claims, all tentative, revisions + FR-55/AD-15 notification included. */
export async function addPerson(input: NewPersonInput): Promise<Result<AddedPerson>> {
  const viewer = await requireViewer();
  if (!viewer) return err('unauthenticated', 'no session and no clan to view');
  return withClanContext(viewer.clanId, (tx) => createPersonOp(tx, viewer, input));
}

/** Add one claim about an existing person. */
export async function addAssertion(
  personId: string,
  spec: AssertionSpec,
  source: SourceSpec,
  confidence?: Confidence,
): Promise<Result<{ assertionId: string; alreadyLinked?: boolean }>> {
  const viewer = await requireViewer();
  if (!viewer) return err('unauthenticated', 'no session and no clan to view');
  return withClanContext(viewer.clanId, async (tx) => {
    const result = await addAssertionOp(tx, viewer, { personId, spec, source, confidence });
    if (!result.ok) return result;
    // `alreadyLinked` đi ra tới adapter: "cặp này đã là vợ chồng trong phả" không phải một lỗi,
    // và cũng không phải "vừa ghi xong" — nó là câu thứ ba, và màn phải nói được câu ấy.
    return ok({
      assertionId: result.value.assertionId,
      ...(result.value.alreadyLinked ? { alreadyLinked: true as const } : {}),
    });
  });
}

/** Promotion = status change on the same row + projection onto person, one transaction (AD-19). */
export async function promoteAssertion(assertionId: string): Promise<Result<void>> {
  const viewer = await requireViewer();
  if (!viewer) return err('unauthenticated', 'no session and no clan to view');
  return withClanContext(viewer.clanId, (tx) => promoteAssertionOp(tx, viewer, { assertionId }));
}

/** AD-17: one report hides, no approval needed. Restoring needs the approval right. */
export async function hideAssertion(assertionId: string, reason: string): Promise<Result<void>> {
  const viewer = await requireViewer();
  if (!viewer) return err('unauthenticated', 'no session and no clan to view');
  return withClanContext(viewer.clanId, (tx) => hideAssertionOp(tx, viewer, { assertionId, reason }));
}
export async function restoreAssertion(assertionId: string): Promise<Result<void>> {
  const viewer = await requireViewer();
  if (!viewer) return err('unauthenticated', 'no session and no clan to view');
  return withClanContext(viewer.clanId, (tx) => restoreAssertionOp(tx, viewer, { assertionId }));
}

/** AD-4: losing value leaves live data, stays in the revision log. Needs approval right. */
export async function rejectAssertion(
  assertionId: string,
  note: string,
): Promise<Result<{ doiTuongId?: string }>> {
  const viewer = await requireViewer();
  if (!viewer) return err('unauthenticated', 'no session and no clan to view');
  return withClanContext(viewer.clanId, (tx) => rejectAssertionOp(tx, viewer, { assertionId, note }));
}

/** Hàng chờ duyệt (FR-3, bề mặt B). */
export type PendingAssertion = {
  assertionId: string;
  personId: string;
  personName: string;
  kind: string;
  value: unknown;
  confidence: Confidence;
  sourceDescription: string;
  createdByName: string;
  createdAt: string;
};
export async function listPendingAssertions(): Promise<Result<PendingAssertion[]>> {
  const viewer = await requireViewer();
  if (!viewer) return err('unauthenticated', 'no session and no clan to view');
  const rows = await withClanContext(viewer.clanId, (tx) => listPendingAssertionsOp(tx, viewer));
  if (!rows.ok) return rows;
  // Auth user names live outside the clan partition (AD-8) — second read through dbGlobal.
  const names = await lookupAccountNames(rows.value.map((r) => r.createdByAccountId));
  return ok(
    rows.value.map((r) => ({
      assertionId: r.assertionId,
      personId: r.personId,
      personName: r.personName,
      kind: r.kind,
      value: r.value,
      confidence: r.confidence,
      sourceDescription: r.sourceDescription,
      createdByName: names.get(r.createdByAccountId) ?? r.createdByAccountId,
      createdAt: r.createdAt.toISOString(),
    })),
  );
}

/** Kho khẳng định đang ẩn (AD-17) — bàn duyệt 3-4 khôi phục từ đây. */
export type HiddenAssertion = {
  assertionId: string;
  personId: string;
  personName: string;
  kind: string;
  /** Human-Vietnamese rendering of the hidden value (surface B shows this, not raw JSON). */
  valueText: string;
  /** Note of the latest 'hide' revision; '' when not recoverable. */
  hiddenReason: string;
  /** Tên người BÁO — hàng chờ nói ai báo, không chỉ ai khai (story 7-3). '' khi không truy được. */
  hiddenByName: string;
  createdByName: string;
  createdAt: string;
};
export async function listHiddenAssertions(): Promise<Result<HiddenAssertion[]>> {
  const viewer = await requireViewer();
  if (!viewer) return err('unauthenticated', 'no session and no clan to view');
  const rows = await withClanContext(viewer.clanId, (tx) => listHiddenAssertionsOp(tx, viewer));
  if (!rows.ok) return rows;
  // Auth user names live outside the clan partition (AD-8) — second read through dbGlobal.
  const names = await lookupAccountNames(rows.value.flatMap((r) => [r.createdByAccountId, r.hiddenByAccountId]));
  return ok(
    rows.value.map((r) => ({
      assertionId: r.assertionId,
      personId: r.personId,
      personName: r.personName,
      kind: r.kind,
      valueText: r.valueText,
      hiddenReason: r.hiddenReason,
      hiddenByName: r.hiddenByAccountId ? (names.get(r.hiddenByAccountId) ?? r.hiddenByAccountId) : '',
      createdByName: names.get(r.createdByAccountId) ?? r.createdByAccountId,
      createdAt: r.createdAt.toISOString(),
    })),
  );
}
