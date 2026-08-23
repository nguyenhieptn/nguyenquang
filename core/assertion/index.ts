/**
 * core/assertion — the write path (story 1-2 implements; signatures are CONTRACT, other
 * modules and adapters compile against them — change them only with a reason written down).
 *
 * AD-9: one write path; everything enters tentative. AD-19: this module is the sole writer of
 * projected values on `person`. AD-24: no identity parameters — session is resolved inside.
 * Internal ops (ops.ts) take (tx, ctx, args) and are for core-internal use + tests only.
 */
import type { Result } from '@/core/types';
import type { Confidence, DatePrecision } from '@/db/schema';

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
  | { kind: 'note'; text: string };

export type AddedPerson = { personId: string; assertionIds: string[] };

/** Create a person + initial claims, all tentative, revisions + FR-55/AD-15 notification included. */
export async function addPerson(_input: NewPersonInput): Promise<Result<AddedPerson>> {
  throw new Error('NOT_IMPLEMENTED — story 1-2');
}

/** Add one claim about an existing person. */
export async function addAssertion(
  _personId: string,
  _spec: AssertionSpec,
  _source: SourceSpec,
  _confidence?: Confidence,
): Promise<Result<{ assertionId: string }>> {
  throw new Error('NOT_IMPLEMENTED — story 1-2');
}

/** Promotion = status change on the same row + projection onto person, one transaction (AD-19). */
export async function promoteAssertion(_assertionId: string): Promise<Result<void>> {
  throw new Error('NOT_IMPLEMENTED — story 1-2');
}

/** AD-17: one report hides, no approval needed. Restoring needs the approval right. */
export async function hideAssertion(_assertionId: string, _reason: string): Promise<Result<void>> {
  throw new Error('NOT_IMPLEMENTED — story 1-2');
}
export async function restoreAssertion(_assertionId: string): Promise<Result<void>> {
  throw new Error('NOT_IMPLEMENTED — story 1-2');
}

/** AD-4: losing value leaves live data, stays in the revision log. Needs approval right. */
export async function rejectAssertion(_assertionId: string, _note: string): Promise<Result<void>> {
  throw new Error('NOT_IMPLEMENTED — story 1-2');
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
  throw new Error('NOT_IMPLEMENTED — story 1-2');
}
