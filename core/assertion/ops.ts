/**
 * core/assertion/ops — the internal single write path (story 1-2).
 *
 * AD-9: everything enters tentative. AD-10: every mutation writes a revision in the SAME tx.
 * AD-17: one report hides, restore needs the approval right. AD-19: `projectPerson` here is
 * the ONLY code that writes projected values onto `person`.
 *
 * Every function takes (tx, ctx, args) — internal to core. Other core modules may call these
 * inside one shared transaction (seed-import batches many persons this way); tests fabricate
 * a ctx and call them directly. Adapters go through index.ts (AD-24) and never see this file.
 *
 * Expected failures return Result err; a failure AFTER writes have started throws so the
 * enclosing transaction rolls back (a Result cannot roll a tx back).
 */
import { and, desc, eq, inArray } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '@/db';
import { dbGlobal } from '@/db';
import {
  assertion,
  authUser,
  notification,
  person,
  revision,
  source,
  union,
  CONFIDENCES,
  DATE_PRECISIONS,
  type AssertionKind,
  type Confidence,
} from '@/db/schema';
import { chuanHoa } from '@/core/so-khop';
import { writeRevision } from '@/core/revision';
import { err, isUuid, ok, type Result } from '@/core/types';
import type { ViewerContext } from '@/core/identity/session';
import type { AssertionSpec, GenealogicalDate, SourceSpec } from './index';

// ── Context gates ────────────────────────────────────────────────────────────

/** A viewer allowed to write: authenticated AND attached to a node (AD-8). */
export type AttachedContext = {
  accountId: string;
  clanId: string;
  personId: string;
  role: 'admin' | 'branch-head' | 'member';
};

/** Guests and unattached accounts get err on every write. */
export function gateWriter(ctx: ViewerContext): Result<AttachedContext> {
  if (ctx.accountId === null || ctx.role === 'guest')
    return err('unauthenticated', 'writing requires a signed-in account');
  if (ctx.personId === null)
    return err('unattached', 'writing requires an account attached to a clan node');
  return ok(ctx as AttachedContext);
}

/** Promotion / restore / reject / pending queue need the approval right (FR-3). */
export function gateApprover(ctx: ViewerContext): Result<AttachedContext> {
  const writer = gateWriter(ctx);
  if (!writer.ok) return writer;
  if (writer.value.role !== 'admin' && writer.value.role !== 'branch-head')
    return err('forbidden', 'requires the approval right (admin or branch-head)');
  return writer;
}

// ── Validation helpers ───────────────────────────────────────────────────────

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Returns a human-readable problem, or null when the genealogical date is well-formed. */
export function invalidGenealogicalDate(d: GenealogicalDate): string | null {
  if (!DATE_PRECISIONS.includes(d.precision)) return `unknown precision '${d.precision}'`;
  if (d.date !== undefined && !DATE_RE.test(d.date)) return 'date must be YYYY-MM-DD';
  if (d.precision === 'exact' && !d.date) return "precision 'exact' requires a date";
  return null;
}

/**
 * Both loaders guard the id first: these columns are Postgres `uuid`, so a malformed literal
 * (a hand-typed route param, a stale link) makes the driver THROW 22P02 rather than return an
 * empty set. Guarding here covers every caller — promote / hide / restore / reject and the
 * person refs of addAssertionOp — with one check: unparseable id ⇒ null ⇒ err('not-found').
 */
export async function loadPerson(tx: Tx, personId: string) {
  if (!isUuid(personId)) return null;
  const rows = await tx.select().from(person).where(eq(person.id, personId)).limit(1);
  return rows[0] ?? null;
}

async function loadAssertion(tx: Tx, assertionId: string) {
  if (!isUuid(assertionId)) return null;
  const rows = await tx.select().from(assertion).where(eq(assertion.id, assertionId)).limit(1);
  return rows[0] ?? null;
}

/** Referenced person must exist (RLS already scoped us to the clan) and not be a tombstone. */
async function requireLivePersonRow(
  tx: Tx,
  personId: string,
  label: string,
): Promise<Result<NonNullable<Awaited<ReturnType<typeof loadPerson>>>>> {
  const row = await loadPerson(tx, personId);
  if (!row) return err('not-found', `${label} not found in this clan`);
  if (row.mergedInto) return err('conflict', `${label} was merged into another person`);
  return ok(row);
}

// ── Source ───────────────────────────────────────────────────────────────────

/** One addPerson call shares ONE source row across its assertions — pass { kind: 'existing' }. */
export type SourceRef = SourceSpec | { kind: 'existing'; sourceId: string };

/** Creates the source row + its revision. Throws only for bugs (inputs are type-shaped). */
export async function createSourceOp(tx: Tx, ctx: AttachedContext, spec: SourceSpec): Promise<string> {
  const id = uuidv7();
  const row = {
    id,
    clanId: ctx.clanId,
    kind: spec.kind,
    description: 'description' in spec ? spec.description : '',
    toldByPersonId: spec.kind === 'told-by' ? (spec.toldByPersonId ?? null) : null,
    recordingId: spec.kind === 'recording' ? spec.recordingId : null,
    createdByAccountId: ctx.accountId,
  };
  await tx.insert(source).values(row);
  await writeRevision(tx, {
    clanId: ctx.clanId,
    accountId: ctx.accountId,
    entity: 'source',
    entityId: id,
    action: 'create',
    after: row,
  });
  return id;
}

// ── Projection (AD-19) ───────────────────────────────────────────────────────

const PROJECTED_KINDS = ['name', 'gender', 'birth', 'death'] as const satisfies readonly AssertionKind[];
type ProjectedKind = (typeof PROJECTED_KINDS)[number];

function isProjectedKind(kind: AssertionKind): kind is ProjectedKind {
  return (PROJECTED_KINDS as readonly string[]).includes(kind);
}

/** The value part of the projection — what AD-15 compares to detect an accepted-value change. */
export type ProjectedSnapshot = {
  fullName: string;
  gender: 'male' | 'female' | 'other' | null;
  birthDate: string | null;
  birthPrecision: string | null;
  deathDate: string | null;
  deathPrecision: string | null;
  isLiving: boolean;
};

export function snapshotOfPersonRow(row: {
  fullName: string;
  gender: 'male' | 'female' | 'other' | null;
  birthDate: string | null;
  birthPrecision: string | null;
  deathDate: string | null;
  deathPrecision: string | null;
  isLiving: boolean;
}): ProjectedSnapshot {
  const { fullName, gender, birthDate, birthPrecision, deathDate, deathPrecision, isLiving } = row;
  return { fullName, gender, birthDate, birthPrecision, deathDate, deathPrecision, isLiving };
}

type AssertionRow = NonNullable<Awaited<ReturnType<typeof loadAssertion>>>;

/** Official beats tentative; then newest promotedAt/createdAt; then id (uuidv7 ≈ creation order). */
function leads(a: AssertionRow, b: AssertionRow): boolean {
  if (a.tier !== b.tier) return a.tier === 'official';
  const ta = (a.promotedAt ?? a.createdAt).getTime();
  const tb = (b.promotedAt ?? b.createdAt).getTime();
  if (ta !== tb) return ta > tb;
  return a.id > b.id;
}

/**
 * Recomputes ALL projected columns on `person` from the live assertion set. The single writer
 * of these columns (AD-19). Hidden assertions never project (AD-17). isLiving is false iff a
 * live death assertion exists. Call after every mutation touching a projecting kind.
 */
export async function projectPerson(tx: Tx, personId: string): Promise<ProjectedSnapshot> {
  const rows = await tx
    .select()
    .from(assertion)
    .where(
      and(
        eq(assertion.subjectPersonId, personId),
        eq(assertion.status, 'live'),
        inArray(assertion.kind, [...PROJECTED_KINDS]),
      ),
    );

  const lead: Partial<Record<ProjectedKind, AssertionRow>> = {};
  for (const row of rows) {
    const kind = row.kind as ProjectedKind;
    const current = lead[kind];
    if (!current || leads(row, current)) lead[kind] = row;
  }

  const name = lead.name;
  const gender = lead.gender;
  const birth = lead.birth;
  const death = lead.death;

  const fullName = name ? ((name.value as { fullName?: string }).fullName ?? '') : '';
  const birthValue = (birth?.value ?? null) as GenealogicalDate | null;
  const deathValue = (death?.value ?? null) as GenealogicalDate | null;

  const snapshot: ProjectedSnapshot = {
    fullName,
    gender: gender ? ((gender.value as { gender?: 'male' | 'female' | 'other' }).gender ?? null) : null,
    birthDate: birthValue?.date ?? null,
    birthPrecision: birthValue?.precision ?? null,
    deathDate: deathValue?.date ?? null,
    deathPrecision: deathValue?.precision ?? null,
    isLiving: !death,
  };

  await tx
    .update(person)
    .set({
      fullName: snapshot.fullName,
      nameFolded: chuanHoa(snapshot.fullName),
      nameTier: name?.tier ?? null,
      nameConfidence: name?.confidence ?? null,
      gender: snapshot.gender,
      genderTier: gender?.tier ?? null,
      birthDate: snapshot.birthDate,
      birthPrecision: (snapshot.birthPrecision as GenealogicalDate['precision'] | null) ?? null,
      birthTier: birth?.tier ?? null,
      deathDate: snapshot.deathDate,
      deathPrecision: (snapshot.deathPrecision as GenealogicalDate['precision'] | null) ?? null,
      deathTier: death?.tier ?? null,
      isLiving: snapshot.isLiving,
      updatedAt: new Date(),
    })
    .where(eq(person.id, personId));

  return snapshot;
}

// ── Assertions — create ──────────────────────────────────────────────────────

export type AddAssertionArgs = {
  personId: string;
  spec: AssertionSpec;
  source: SourceRef;
  confidence?: Confidence;
};

export type AddedAssertions = {
  /** The subject's own assertion — what the index contract returns. */
  assertionId: string;
  /** All assertions this call created (union-partner creates two). */
  assertionIds: string[];
  /** Set when a union row was involved. */
  unionId?: string;
};

async function insertAssertionRow(
  tx: Tx,
  ctx: AttachedContext,
  row: {
    subjectPersonId: string;
    kind: AssertionKind;
    objectPersonId?: string;
    unionId?: string;
    value: unknown;
    sourceId: string;
    confidence: Confidence;
  },
): Promise<string> {
  const id = uuidv7();
  const full = {
    id,
    clanId: ctx.clanId,
    subjectPersonId: row.subjectPersonId,
    kind: row.kind,
    objectPersonId: row.objectPersonId ?? null,
    unionId: row.unionId ?? null,
    value: row.value,
    sourceId: row.sourceId,
    confidence: row.confidence,
    tier: 'tentative' as const, // AD-9 — no path enters official
    status: 'live' as const,
    createdByAccountId: ctx.accountId,
  };
  await tx.insert(assertion).values(full);
  await writeRevision(tx, {
    clanId: ctx.clanId,
    accountId: ctx.accountId,
    entity: 'assertion',
    entityId: id,
    action: 'create',
    after: full,
  });
  return id;
}

/**
 * Adds one claim about an existing person — the single entry point for every assertion kind,
 * including parent-child (AD-18) and union membership. Tentative always (AD-9).
 */
export async function addAssertionOp(
  tx: Tx,
  viewer: ViewerContext,
  args: AddAssertionArgs,
): Promise<Result<AddedAssertions>> {
  const gate = gateWriter(viewer);
  if (!gate.ok) return gate;
  const ctx = gate.value;

  const confidence = args.confidence ?? 'ton-nghi';
  if (!CONFIDENCES.includes(confidence)) return err('invalid', `unknown confidence '${confidence}'`);

  const subject = await requireLivePersonRow(tx, args.personId, 'person');
  if (!subject.ok) return subject;

  const spec = args.spec;

  // Validate BEFORE any write, so an err never leaves half a mutation behind.
  switch (spec.kind) {
    case 'name':
      if (!spec.fullName.trim()) return err('invalid', 'name assertion requires a non-empty fullName');
      break;
    case 'gender':
      if (!['male', 'female', 'other'].includes(spec.gender))
        return err('invalid', `unknown gender '${spec.gender}'`);
      break;
    case 'birth':
    case 'death': {
      const problem = invalidGenealogicalDate(spec.value);
      if (problem) return err('invalid', `${spec.kind}: ${problem}`);
      break;
    }
    case 'parent-child': {
      if (spec.parentId === args.personId) return err('invalid', 'a person cannot be their own parent');
      const parent = await requireLivePersonRow(tx, spec.parentId, 'parent');
      if (!parent.ok) return parent;
      break;
    }
    case 'union-partner': {
      if (spec.unionId) {
        if (!isUuid(spec.unionId)) return err('not-found', 'union not found in this clan');
        const rows = await tx.select().from(union).where(eq(union.id, spec.unionId)).limit(1);
        if (!rows[0]) return err('not-found', 'union not found in this clan');
      } else {
        if (spec.partnerId === args.personId) return err('invalid', 'a person cannot partner themselves');
        const partner = await requireLivePersonRow(tx, spec.partnerId, 'partner');
        if (!partner.ok) return partner;
      }
      break;
    }
    case 'note':
      if (!spec.text.trim()) return err('invalid', 'note assertion requires text');
      break;
  }

  const sourceId =
    args.source.kind === 'existing' ? args.source.sourceId : await createSourceOp(tx, ctx, args.source);

  const created: string[] = [];
  let unionId: string | undefined;

  switch (spec.kind) {
    case 'name':
      created.push(
        await insertAssertionRow(tx, ctx, {
          subjectPersonId: args.personId,
          kind: 'name',
          value: { fullName: spec.fullName.trim() },
          sourceId,
          confidence,
        }),
      );
      break;
    case 'gender':
      created.push(
        await insertAssertionRow(tx, ctx, {
          subjectPersonId: args.personId,
          kind: 'gender',
          value: { gender: spec.gender },
          sourceId,
          confidence,
        }),
      );
      break;
    case 'birth':
    case 'death':
      created.push(
        await insertAssertionRow(tx, ctx, {
          subjectPersonId: args.personId,
          kind: spec.kind,
          value: spec.value,
          sourceId,
          confidence,
        }),
      );
      break;
    case 'parent-child':
      // Subject = CHILD, objectPersonId = PARENT (schema contract; AD-18).
      created.push(
        await insertAssertionRow(tx, ctx, {
          subjectPersonId: args.personId,
          kind: 'parent-child',
          objectPersonId: spec.parentId,
          value: { relation: spec.relation ?? 'blood' },
          sourceId,
          confidence,
        }),
      );
      break;
    case 'union-partner': {
      if (spec.unionId) {
        unionId = spec.unionId;
      } else {
        unionId = uuidv7();
        const unionRow = { id: unionId, clanId: ctx.clanId, kind: 'marriage' as const, note: '' };
        await tx.insert(union).values(unionRow);
        await writeRevision(tx, {
          clanId: ctx.clanId,
          accountId: ctx.accountId,
          entity: 'union',
          entityId: unionId,
          action: 'create',
          after: unionRow,
        });
      }
      created.push(
        await insertAssertionRow(tx, ctx, {
          subjectPersonId: args.personId,
          kind: 'union-partner',
          unionId,
          value: {},
          sourceId,
          confidence,
        }),
      );
      if (!spec.unionId) {
        // New union ⇒ TWO membership assertions, one per partner.
        created.push(
          await insertAssertionRow(tx, ctx, {
            subjectPersonId: spec.partnerId,
            kind: 'union-partner',
            unionId,
            value: {},
            sourceId,
            confidence,
          }),
        );
      }
      break;
    }
    case 'note':
      created.push(
        await insertAssertionRow(tx, ctx, {
          subjectPersonId: args.personId,
          kind: 'note',
          value: { text: spec.text.trim() },
          sourceId,
          confidence,
        }),
      );
      break;
  }

  if (isProjectedKind(spec.kind)) await projectPerson(tx, args.personId);

  return ok({ assertionId: created[0]!, assertionIds: created, unionId });
}

// ── Promotion (AD-9, AD-19, AD-15) ───────────────────────────────────────────

export async function promoteAssertionOp(
  tx: Tx,
  viewer: ViewerContext,
  args: { assertionId: string },
): Promise<Result<void>> {
  const gate = gateApprover(viewer);
  if (!gate.ok) return gate;
  const ctx = gate.value;

  const row = await loadAssertion(tx, args.assertionId);
  if (!row) return err('not-found', 'assertion not found in this clan');
  if (row.status !== 'live') return err('conflict', 'a hidden assertion cannot be promoted');
  if (row.tier === 'official') return err('conflict', 'assertion is already official');

  const personBefore = await loadPerson(tx, row.subjectPersonId);
  if (!personBefore) return err('not-found', 'subject person not found'); // FK makes this a bug guard

  const promotedAt = new Date();
  await tx
    .update(assertion)
    .set({ tier: 'official', promotedAt, promotedByAccountId: ctx.accountId })
    .where(eq(assertion.id, row.id));
  await writeRevision(tx, {
    clanId: ctx.clanId,
    accountId: ctx.accountId,
    entity: 'assertion',
    entityId: row.id,
    action: 'promote',
    before: { tier: row.tier, promotedAt: row.promotedAt, promotedByAccountId: row.promotedByAccountId },
    after: { tier: 'official', promotedAt, promotedByAccountId: ctx.accountId },
  });

  if (isProjectedKind(row.kind)) {
    const before = snapshotOfPersonRow(personBefore);
    const after = await projectPerson(tx, row.subjectPersonId);
    const changed = JSON.stringify(before) !== JSON.stringify(after);
    // AD-15: an accepted value about a LIVING person changed ⇒ they are told, same tx.
    if (changed && after.isLiving) {
      await tx.insert(notification).values({
        id: uuidv7(),
        clanId: ctx.clanId,
        personId: row.subjectPersonId,
        kind: 'record-changed',
        payload: { assertionId: row.id, kind: row.kind, before, after },
      });
    }
  }

  return ok(undefined);
}

// ── Hide / restore (AD-17) ───────────────────────────────────────────────────

/** ANY attached member may hide, with a reason — one report hides, judgement comes after. */
export async function hideAssertionOp(
  tx: Tx,
  viewer: ViewerContext,
  args: { assertionId: string; reason: string },
): Promise<Result<void>> {
  const gate = gateWriter(viewer);
  if (!gate.ok) return gate;
  const ctx = gate.value;

  if (!args.reason.trim()) return err('invalid', 'hiding requires a reason');

  const row = await loadAssertion(tx, args.assertionId);
  if (!row) return err('not-found', 'assertion not found in this clan');
  if (row.status === 'hidden') return err('conflict', 'assertion is already hidden');

  await tx.update(assertion).set({ status: 'hidden' }).where(eq(assertion.id, row.id));
  await writeRevision(tx, {
    clanId: ctx.clanId,
    accountId: ctx.accountId,
    entity: 'assertion',
    entityId: row.id,
    action: 'hide',
    before: { status: 'live' },
    after: { status: 'hidden' },
    note: args.reason.trim(),
  });

  if (isProjectedKind(row.kind)) await projectPerson(tx, row.subjectPersonId); // hidden never projects

  return ok(undefined);
}

/** Restoring needs the approval right (AD-17). */
export async function restoreAssertionOp(
  tx: Tx,
  viewer: ViewerContext,
  args: { assertionId: string },
): Promise<Result<void>> {
  const gate = gateApprover(viewer);
  if (!gate.ok) return gate;
  const ctx = gate.value;

  const row = await loadAssertion(tx, args.assertionId);
  if (!row) return err('not-found', 'assertion not found in this clan');
  if (row.status === 'live') return err('conflict', 'assertion is not hidden');

  await tx.update(assertion).set({ status: 'live' }).where(eq(assertion.id, row.id));
  await writeRevision(tx, {
    clanId: ctx.clanId,
    accountId: ctx.accountId,
    entity: 'assertion',
    entityId: row.id,
    action: 'restore',
    before: { status: 'hidden' },
    after: { status: 'live' },
  });

  if (isProjectedKind(row.kind)) await projectPerson(tx, row.subjectPersonId);

  return ok(undefined);
}

// ── Reject (AD-4) ────────────────────────────────────────────────────────────

/** The losing claim leaves the live set but never leaves the record: full row → revision, then DELETE. */
export async function rejectAssertionOp(
  tx: Tx,
  viewer: ViewerContext,
  args: { assertionId: string; note: string },
): Promise<Result<void>> {
  const gate = gateApprover(viewer);
  if (!gate.ok) return gate;
  const ctx = gate.value;

  const row = await loadAssertion(tx, args.assertionId);
  if (!row) return err('not-found', 'assertion not found in this clan');

  await writeRevision(tx, {
    clanId: ctx.clanId,
    accountId: ctx.accountId,
    entity: 'assertion',
    entityId: row.id,
    action: 'remove',
    before: row, // the FULL row — point-in-time reconstruction depends on it
    note: args.note,
  });
  await tx.delete(assertion).where(eq(assertion.id, row.id));

  if (isProjectedKind(row.kind)) await projectPerson(tx, row.subjectPersonId);

  return ok(undefined);
}

// ── Pending queue (FR-3, surface B) ─────────────────────────────────────────

export type PendingRow = {
  assertionId: string;
  personId: string;
  personName: string;
  kind: AssertionKind;
  value: unknown;
  confidence: Confidence;
  sourceDescription: string;
  createdByAccountId: string;
  createdAt: Date;
};

/** All live tentative assertions in the clan, newest first. Approval surface ⇒ approver-only. */
export async function listPendingAssertionsOp(tx: Tx, viewer: ViewerContext): Promise<Result<PendingRow[]>> {
  const gate = gateApprover(viewer);
  if (!gate.ok) return gate;

  const rows = await tx
    .select({
      assertionId: assertion.id,
      personId: assertion.subjectPersonId,
      personName: person.fullName,
      kind: assertion.kind,
      value: assertion.value,
      confidence: assertion.confidence,
      sourceDescription: source.description,
      createdByAccountId: assertion.createdByAccountId,
      createdAt: assertion.createdAt,
    })
    .from(assertion)
    .innerJoin(person, eq(assertion.subjectPersonId, person.id))
    .innerJoin(source, eq(assertion.sourceId, source.id))
    .where(and(eq(assertion.tier, 'tentative'), eq(assertion.status, 'live')))
    .orderBy(desc(assertion.createdAt), desc(assertion.id));

  return ok(rows);
}

/**
 * Auth user names live in identity tables (no clanId, no RLS — AD-8), so they cannot be joined
 * inside a clan transaction. Read them through dbGlobal AFTER the tx; missing ids fall back to
 * the raw account id at the call site.
 */
export async function lookupAccountNames(accountIds: string[]): Promise<Map<string, string>> {
  const ids = [...new Set(accountIds)].filter((id) => id.length > 0);
  if (ids.length === 0) return new Map();
  const rows = await dbGlobal
    .select({ id: authUser.id, name: authUser.name })
    .from(authUser)
    .where(inArray(authUser.id, ids));
  return new Map(rows.map((r) => [r.id, r.name]));
}

// ── Hidden listings (AD-17 restore surface, bàn duyệt 3-4) ───────────────────

const GENDER_VN: Record<string, string> = { male: 'nam', female: 'nữ', other: 'khác' };

function formatDateVN(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return d && m && y ? `${d}/${m}/${y}` : isoDate;
}

/** "năm sinh 1941" / "ngày mất 12/03/2001" / "năm sinh khoảng 1941" / "năm sinh chưa rõ". */
function describeDateVN(loai: 'sinh' | 'mất', v: Record<string, unknown>): string {
  const date = typeof v.date === 'string' ? v.date : null;
  const year = date ? date.slice(0, 4) : null;
  const precision = typeof v.precision === 'string' ? v.precision : null;
  if (precision === 'exact' && date) return `ngày ${loai} ${formatDateVN(date)}`;
  if (precision === 'approximate') return year ? `năm ${loai} khoảng ${year}` : `năm ${loai} ước chừng`;
  return year ? `năm ${loai} ${year}` : `năm ${loai} chưa rõ`;
}

/**
 * Human-Vietnamese one-liner for an assertion's value — surface B listings show this instead
 * of raw JSON. Wording follows core/audit's history one-liners; kept here because this module
 * owns the value shapes (defensive against malformed jsonb: degrades, never throws).
 */
export function describeAssertionValue(kind: AssertionKind, value: unknown): string {
  const v =
    value !== null && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  switch (kind) {
    case 'name': {
      const n = typeof v.fullName === 'string' ? v.fullName : '';
      return n ? `tên "${n}"` : 'tên';
    }
    case 'gender': {
      const g = typeof v.gender === 'string' ? v.gender : '';
      return `giới tính ${GENDER_VN[g] ?? 'khác'}`;
    }
    case 'birth':
      return describeDateVN('sinh', v);
    case 'death':
      return describeDateVN('mất', v);
    case 'parent-child': {
      const rel = typeof v.relation === 'string' ? v.relation : '';
      const suffix = rel === 'adopted' ? ' (con nuôi)' : rel === 'heir' ? ' (thừa tự)' : '';
      return `quan hệ cha mẹ – con${suffix}`;
    }
    case 'union-partner':
      return 'quan hệ vợ chồng';
    case 'note': {
      const t = typeof v.text === 'string' ? v.text : '';
      return t ? `ghi chú "${t}"` : 'ghi chú';
    }
    default:
      return 'thông tin';
  }
}

export type HiddenRow = {
  assertionId: string;
  personId: string;
  personName: string;
  kind: AssertionKind;
  valueText: string;
  hiddenReason: string;
  createdByAccountId: string;
  createdAt: Date;
};

/**
 * Every live-table assertion with status='hidden' — what the bàn duyệt restores from (AD-17:
 * one report hides; only this surface brings a claim back). Approver-only, like the pending
 * queue. hiddenReason is the note of the LATEST 'hide' revision (AD-10 wrote one per hide);
 * an assertion hidden by a path that left no note degrades to ''.
 */
export async function listHiddenAssertionsOp(
  tx: Tx,
  viewer: ViewerContext,
): Promise<Result<HiddenRow[]>> {
  const gate = gateApprover(viewer);
  if (!gate.ok) return gate;

  const rows = await tx
    .select({
      assertionId: assertion.id,
      personId: assertion.subjectPersonId,
      personName: person.fullName,
      kind: assertion.kind,
      value: assertion.value,
      createdByAccountId: assertion.createdByAccountId,
      createdAt: assertion.createdAt,
    })
    .from(assertion)
    .innerJoin(person, eq(assertion.subjectPersonId, person.id))
    .where(eq(assertion.status, 'hidden'))
    .orderBy(desc(assertion.createdAt), desc(assertion.id));

  const latestHideNote = new Map<string, string>();
  if (rows.length > 0) {
    const hideRevs = await tx
      .select({ entityId: revision.entityId, note: revision.note })
      .from(revision)
      .where(
        and(
          eq(revision.entity, 'assertion'),
          eq(revision.action, 'hide'),
          inArray(
            revision.entityId,
            rows.map((r) => r.assertionId),
          ),
        ),
      )
      .orderBy(desc(revision.createdAt), desc(revision.id));
    for (const rev of hideRevs) {
      if (!latestHideNote.has(rev.entityId)) latestHideNote.set(rev.entityId, rev.note);
    }
  }

  return ok(
    rows.map((r) => ({
      assertionId: r.assertionId,
      personId: r.personId,
      personName: r.personName,
      kind: r.kind,
      valueText: describeAssertionValue(r.kind, r.value),
      hiddenReason: latestHideNote.get(r.assertionId) ?? '',
      createdByAccountId: r.createdByAccountId,
      createdAt: r.createdAt,
    })),
  );
}
