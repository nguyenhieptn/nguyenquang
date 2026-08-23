/**
 * core/merge — internal ops (story 1-7). FR-48; AD-3, AD-6, AD-10, AD-16, AD-22.
 *
 * Layering (build-contract): these functions take (tx, ctx, args) and are core-internal only.
 * Adapters go through ./index.ts, which resolves identity itself (AD-24). Tests fabricate a ctx
 * and call these directly, inside withClanContext.
 *
 * Revision convention (documented choice — the merge lifecycle logs under entity 'merge'):
 *  - proposeMerge  → entity 'merge', action 'create',  entityId = proposal id, note = reason
 *  - rejectProposal→ entity 'merge', action 'update',  entityId = proposal id
 *  - executeMerge  → entity 'merge', action 'merge',   entityId = proposal id,
 *                    after = { winnerId, loserId, repointed: RepointEntry[] } — the COMPLETE
 *                    repoint list (AD-3: a merge that does not record its repointings is not
 *                    permitted, because un-merge is then impossible)
 *  - unmerge       → entity 'merge', action 'unmerge', entityId = proposal id
 */
import { and, desc, eq, inArray, ne, or, sql } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '@/db';
import {
  assertion,
  attachment,
  mergeProposal,
  notification,
  person,
  recording,
  recordingSubject,
  revision,
  source,
} from '@/db/schema';
import { writeRevision } from '@/core/revision';
import { chuanHoa } from '@/core/so-khop';
import { err, ok, type Result } from '@/core/types';
import type { SessionContext, ViewerContext } from '@/core/identity/session';
import { lookupAccountNames } from '@/core/assertion/ops';

/** Trigram floor for duplicate candidates (AD-16: folded comparison, never bare ILIKE). */
export const SIMILARITY_THRESHOLD = 0.5;
/** Birth years further apart than this (when both known) disqualify a candidate pair. */
export const BIRTH_YEAR_WINDOW = 2;
const MAX_CANDIDATES = 50;

// ── shared types ─────────────────────────────────────────────────────────────

export type DuplicateEvidence = {
  /** 1 for identical folded names, else pg_trgm similarity of the folded names (0..1). */
  nameSimilarity: number;
  /** |yearA - yearB| when both birth years are known, else null. */
  birthYearDelta: number | null;
  /** Count of common parent/child/partner person ids between the two. */
  sharedRelatives: number;
};

export type DuplicatePerson = { personId: string; fullName: string; birthYear: number | null };

export type DuplicateCandidate = {
  a: DuplicatePerson;
  b: DuplicatePerson;
  evidence: DuplicateEvidence;
};

/**
 * One recorded repointing (AD-3). `column` is the DB column name — the unmerge path replays
 * these against the database generically, guarded by the REPOINTABLE whitelist below.
 */
export type RepointEntry = {
  table:
    | 'assertion'
    | 'source'
    | 'recording'
    | 'recording_subject'
    | 'notification'
    | 'attachment'
    | 'merge_proposal'
    | 'person';
  rowId: string;
  column: string;
  from: unknown;
  to: unknown;
  /**
   * 'repoint' (default)     — a person-reference column moved loser → winner
   * 'dropped-duplicate'     — recording_subject row deleted because the winner already was a
   *                           subject of the same recording; `row` keeps the full row for restore
   * 'closed-proposal'       — another open proposal referencing the loser, closed as rejected
   * 'projection'            — a projected value slot on the winner filled from the loser
   */
  kind?: 'repoint' | 'dropped-duplicate' | 'closed-proposal' | 'projection';
  row?: Record<string, unknown>;
};

export type ExecuteMergeOutcome = {
  winnerId: string;
  loserId: string;
  repointedCount: number;
};

// ── permission guards (AD-22) ────────────────────────────────────────────────

function requireAttached(ctx: ViewerContext): Result<SessionContext> {
  if (ctx.accountId === null || ctx.role === 'guest') {
    return err('unauthenticated', 'sign-in required');
  }
  if (ctx.personId === null) return err('unattached', 'account has no clan node attachment');
  return ok(ctx);
}

function requireApprover(ctx: ViewerContext): Result<SessionContext> {
  if (ctx.accountId === null || ctx.role === 'guest') {
    return err('unauthenticated', 'sign-in required');
  }
  if (ctx.role !== 'admin' && ctx.role !== 'branch-head') {
    return err('forbidden', 'requires the approval right (admin or branch-head)');
  }
  return ok(ctx);
}

// ── evidence helpers ─────────────────────────────────────────────────────────

/**
 * Relative sets (parent + child + partner person ids) for the given persons, from LIVE
 * assertions (AD-18: relationships are assertions; hidden ones do not count as evidence).
 */
async function relativeSets(tx: Tx, ids: string[]): Promise<Map<string, Set<string>>> {
  const sets = new Map<string, Set<string>>();
  for (const id of ids) sets.set(id, new Set());
  if (ids.length === 0) return sets;

  const parentChild = await tx
    .select({ subjectPersonId: assertion.subjectPersonId, objectPersonId: assertion.objectPersonId })
    .from(assertion)
    .where(
      and(
        eq(assertion.kind, 'parent-child'),
        eq(assertion.status, 'live'),
        or(inArray(assertion.subjectPersonId, ids), inArray(assertion.objectPersonId, ids)),
      ),
    );
  for (const row of parentChild) {
    if (!row.objectPersonId) continue;
    sets.get(row.subjectPersonId)?.add(row.objectPersonId);
    sets.get(row.objectPersonId)?.add(row.subjectPersonId);
  }

  const unionPartners = await tx
    .select({ subjectPersonId: assertion.subjectPersonId, unionId: assertion.unionId })
    .from(assertion)
    .where(and(eq(assertion.kind, 'union-partner'), eq(assertion.status, 'live')));
  const byUnion = new Map<string, string[]>();
  for (const row of unionPartners) {
    if (!row.unionId) continue;
    const members = byUnion.get(row.unionId) ?? [];
    members.push(row.subjectPersonId);
    byUnion.set(row.unionId, members);
  }
  for (const members of byUnion.values()) {
    for (const m of members) {
      const set = sets.get(m);
      if (!set) continue;
      for (const other of members) if (other !== m) set.add(other);
    }
  }
  return sets;
}

function sharedCount(a: Set<string> | undefined, b: Set<string> | undefined): number {
  if (!a || !b) return 0;
  let n = 0;
  for (const x of a) if (b.has(x)) n += 1;
  return n;
}

async function pairEvidence(tx: Tx, aId: string, bId: string): Promise<DuplicateEvidence> {
  const res = await tx.execute(sql`
    SELECT (CASE WHEN a.name_folded = b.name_folded AND a.name_folded <> '' THEN 1.0
                 ELSE similarity(a.name_folded, b.name_folded) END)::float8 AS sim,
           EXTRACT(YEAR FROM a.birth_date)::int AS a_year,
           EXTRACT(YEAR FROM b.birth_date)::int AS b_year
    FROM person a, person b
    WHERE a.id = ${aId} AND b.id = ${bId}
  `);
  const row = (res.rows as Array<{ sim: number | null; a_year: number | null; b_year: number | null }>)[0];
  const relatives = await relativeSets(tx, [aId, bId]);
  return {
    nameSimilarity: row ? Number(row.sim ?? 0) : 0,
    birthYearDelta:
      row && row.a_year != null && row.b_year != null ? Math.abs(row.a_year - row.b_year) : null,
    sharedRelatives: sharedCount(relatives.get(aId), relatives.get(bId)),
  };
}

// ── suggestDuplicates ────────────────────────────────────────────────────────

/**
 * Candidate duplicate pairs in the clan: same folded name OR trigram similarity above the
 * threshold, birth years within BIRTH_YEAR_WINDOW when both known. Tombstones and pairs with
 * an already-open proposal are excluded.
 *
 * Restricted to admin | branch-head — this powers the bàn duyệt surface, and those roles see
 * full detail under AD-13 (visibilityFor returns 'full'), so no per-person privacy filtering
 * is needed on the output.
 */
export async function suggestDuplicatesOp(
  tx: Tx,
  ctx: ViewerContext,
): Promise<Result<DuplicateCandidate[]>> {
  const approver = requireApprover(ctx);
  if (!approver.ok) return approver;

  const res = await tx.execute(sql`
    SELECT a.id AS a_id, a.full_name AS a_name, EXTRACT(YEAR FROM a.birth_date)::int AS a_year,
           b.id AS b_id, b.full_name AS b_name, EXTRACT(YEAR FROM b.birth_date)::int AS b_year,
           (CASE WHEN a.name_folded = b.name_folded THEN 1.0
                 ELSE similarity(a.name_folded, b.name_folded) END)::float8 AS sim
    FROM person a
    JOIN person b ON b.clan_id = a.clan_id AND a.id < b.id
    WHERE a.merged_into IS NULL AND b.merged_into IS NULL
      AND a.name_folded <> '' AND b.name_folded <> ''
      AND (a.name_folded = b.name_folded
           OR similarity(a.name_folded, b.name_folded) > ${SIMILARITY_THRESHOLD})
      AND (a.birth_date IS NULL OR b.birth_date IS NULL
           OR abs(EXTRACT(YEAR FROM a.birth_date) - EXTRACT(YEAR FROM b.birth_date)) <= ${BIRTH_YEAR_WINDOW})
      AND NOT EXISTS (
        SELECT 1 FROM merge_proposal mp
        WHERE mp.status = 'open'
          AND ((mp.winner_person_id = a.id AND mp.loser_person_id = b.id)
            OR (mp.winner_person_id = b.id AND mp.loser_person_id = a.id))
      )
    ORDER BY sim DESC, a.id, b.id
    LIMIT ${MAX_CANDIDATES}
  `);
  const rows = res.rows as Array<{
    a_id: string;
    a_name: string;
    a_year: number | null;
    b_id: string;
    b_name: string;
    b_year: number | null;
    sim: number;
  }>;

  const ids = [...new Set(rows.flatMap((r) => [r.a_id, r.b_id]))];
  const relatives = await relativeSets(tx, ids);

  return ok(
    rows.map((r) => ({
      a: { personId: r.a_id, fullName: r.a_name, birthYear: r.a_year },
      b: { personId: r.b_id, fullName: r.b_name, birthYear: r.b_year },
      evidence: {
        nameSimilarity: Number(r.sim),
        birthYearDelta: r.a_year != null && r.b_year != null ? Math.abs(r.a_year - r.b_year) : null,
        sharedRelatives: sharedCount(relatives.get(r.a_id), relatives.get(r.b_id)),
      },
    })),
  );
}

// ── proposeMerge (AD-22: proposing is open to any attached member) ───────────

export async function proposeMergeOp(
  tx: Tx,
  ctx: ViewerContext,
  args: { winnerId: string; loserId: string; reason: string },
): Promise<Result<{ proposalId: string; evidence: DuplicateEvidence }>> {
  const attached = requireAttached(ctx);
  if (!attached.ok) return attached;
  const sctx = attached.value;

  if (args.winnerId === args.loserId) {
    return err('invalid', 'winner and loser must be different persons');
  }

  const persons = await tx
    .select({ id: person.id, mergedInto: person.mergedInto })
    .from(person)
    .where(inArray(person.id, [args.winnerId, args.loserId]));
  const winner = persons.find((p) => p.id === args.winnerId);
  const loser = persons.find((p) => p.id === args.loserId);
  if (!winner || !loser) return err('not-found', 'winner or loser not found in this clan');
  if (winner.mergedInto || loser.mergedInto) {
    return err('conflict', 'one of the persons is already merged (tombstone)');
  }

  const [open] = await tx
    .select({ id: mergeProposal.id })
    .from(mergeProposal)
    .where(
      and(
        eq(mergeProposal.status, 'open'),
        or(
          and(
            eq(mergeProposal.winnerPersonId, args.winnerId),
            eq(mergeProposal.loserPersonId, args.loserId),
          ),
          and(
            eq(mergeProposal.winnerPersonId, args.loserId),
            eq(mergeProposal.loserPersonId, args.winnerId),
          ),
        ),
      ),
    )
    .limit(1);
  if (open) return err('conflict', 'an open proposal for this pair already exists');

  const evidence = await pairEvidence(tx, args.winnerId, args.loserId);
  const proposalId = uuidv7();
  await tx.insert(mergeProposal).values({
    id: proposalId,
    clanId: sctx.clanId,
    winnerPersonId: args.winnerId,
    loserPersonId: args.loserId,
    reason: args.reason,
    evidence,
    status: 'open',
    proposedByAccountId: sctx.accountId,
  });

  await writeRevision(tx, {
    clanId: sctx.clanId,
    accountId: sctx.accountId,
    entity: 'merge',
    entityId: proposalId,
    action: 'create',
    note: args.reason,
    after: { winnerId: args.winnerId, loserId: args.loserId, evidence },
  });

  return ok({ proposalId, evidence });
}

// ── rejectProposal ───────────────────────────────────────────────────────────

export async function rejectProposalOp(
  tx: Tx,
  ctx: ViewerContext,
  args: { proposalId: string; note: string },
): Promise<Result<void>> {
  const approver = requireApprover(ctx);
  if (!approver.ok) return approver;
  const sctx = approver.value;

  const [proposal] = await tx
    .select()
    .from(mergeProposal)
    .where(eq(mergeProposal.id, args.proposalId))
    .limit(1);
  if (!proposal) return err('not-found', 'merge proposal not found');
  if (proposal.status !== 'open') {
    return err('conflict', `proposal is already ${proposal.status}`);
  }

  await tx
    .update(mergeProposal)
    .set({ status: 'rejected', decidedByAccountId: sctx.accountId, decidedAt: new Date() })
    .where(eq(mergeProposal.id, args.proposalId));

  await writeRevision(tx, {
    clanId: sctx.clanId,
    accountId: sctx.accountId,
    entity: 'merge',
    entityId: args.proposalId,
    action: 'update',
    note: args.note,
    before: { status: 'open' },
    after: { status: 'rejected' },
  });

  return ok(undefined);
}

// ── executeMerge (AD-3: one transaction, every repointing recorded) ──────────

/** Person columns whose values may appear in projection repoint entries. */
type PersonPatch = Partial<{
  fullName: string;
  nameFolded: string;
  nameTier: 'tentative' | 'official' | null;
  nameConfidence: 'chac-chan' | 'theo-loi-ke' | 'ton-nghi' | null;
  gender: 'male' | 'female' | 'other' | null;
  genderTier: 'tentative' | 'official' | null;
  birthDate: string | null;
  birthPrecision: 'exact' | 'year' | 'approximate' | 'unknown' | null;
  birthTier: 'tentative' | 'official' | null;
  deathDate: string | null;
  deathPrecision: 'exact' | 'year' | 'approximate' | 'unknown' | null;
  deathTier: 'tentative' | 'official' | null;
  isLiving: boolean;
}>;

export async function executeMergeOp(
  tx: Tx,
  ctx: ViewerContext,
  args: { proposalId: string },
): Promise<Result<ExecuteMergeOutcome>> {
  const approver = requireApprover(ctx);
  if (!approver.ok) return approver;
  const sctx = approver.value;

  const [proposal] = await tx
    .select()
    .from(mergeProposal)
    .where(eq(mergeProposal.id, args.proposalId))
    .limit(1);
  if (!proposal) return err('not-found', 'merge proposal not found');
  if (proposal.status !== 'open') {
    return err('conflict', `proposal is ${proposal.status}, not open`);
  }

  const winnerId = proposal.winnerPersonId;
  const loserId = proposal.loserPersonId;
  const [winner] = await tx.select().from(person).where(eq(person.id, winnerId)).limit(1);
  const [loser] = await tx.select().from(person).where(eq(person.id, loserId)).limit(1);
  if (!winner || !loser) return err('not-found', 'winner or loser no longer exists');
  if (winner.mergedInto) return err('conflict', 'winner is already a tombstone');
  if (loser.mergedInto) return err('conflict', 'loser is already merged');

  // Preconditions FIRST — an err return must leave no writes behind it.
  const loserAttachments = await tx
    .select()
    .from(attachment)
    .where(eq(attachment.personId, loserId));
  if (loserAttachments.length > 0) {
    const winnerAttachments = await tx
      .select({ id: attachment.id })
      .from(attachment)
      .where(eq(attachment.personId, winnerId));
    if (winnerAttachments.length > 0) {
      return err('conflict', 'both persons have account attachments — a human must detach one first');
    }
  }

  const now = new Date();
  const repointed: RepointEntry[] = [];

  // assertion.subject_person_id: loser → winner
  const subjectRows = await tx
    .select({ id: assertion.id })
    .from(assertion)
    .where(eq(assertion.subjectPersonId, loserId));
  if (subjectRows.length > 0) {
    await tx
      .update(assertion)
      .set({ subjectPersonId: winnerId })
      .where(eq(assertion.subjectPersonId, loserId));
    for (const r of subjectRows) {
      repointed.push({ table: 'assertion', rowId: r.id, column: 'subject_person_id', from: loserId, to: winnerId });
    }
  }

  // assertion.object_person_id: loser → winner
  const objectRows = await tx
    .select({ id: assertion.id })
    .from(assertion)
    .where(eq(assertion.objectPersonId, loserId));
  if (objectRows.length > 0) {
    await tx
      .update(assertion)
      .set({ objectPersonId: winnerId })
      .where(eq(assertion.objectPersonId, loserId));
    for (const r of objectRows) {
      repointed.push({ table: 'assertion', rowId: r.id, column: 'object_person_id', from: loserId, to: winnerId });
    }
  }

  // source.told_by_person_id
  const sourceRows = await tx
    .select({ id: source.id })
    .from(source)
    .where(eq(source.toldByPersonId, loserId));
  if (sourceRows.length > 0) {
    await tx.update(source).set({ toldByPersonId: winnerId }).where(eq(source.toldByPersonId, loserId));
    for (const r of sourceRows) {
      repointed.push({ table: 'source', rowId: r.id, column: 'told_by_person_id', from: loserId, to: winnerId });
    }
  }

  // recording.told_by_person_id
  const recordingRows = await tx
    .select({ id: recording.id })
    .from(recording)
    .where(eq(recording.toldByPersonId, loserId));
  if (recordingRows.length > 0) {
    await tx
      .update(recording)
      .set({ toldByPersonId: winnerId })
      .where(eq(recording.toldByPersonId, loserId));
    for (const r of recordingRows) {
      repointed.push({ table: 'recording', rowId: r.id, column: 'told_by_person_id', from: loserId, to: winnerId });
    }
  }

  // recording_subject.person_id — dedupe on the (recording_id, person_id) unique index:
  // when the winner already is a subject of the same recording, DELETE the loser row and
  // record it as 'dropped-duplicate' with the full row so unmerge can re-insert it.
  const loserSubjectLinks = await tx
    .select()
    .from(recordingSubject)
    .where(eq(recordingSubject.personId, loserId));
  for (const row of loserSubjectLinks) {
    const [dupe] = await tx
      .select({ id: recordingSubject.id })
      .from(recordingSubject)
      .where(
        and(eq(recordingSubject.recordingId, row.recordingId), eq(recordingSubject.personId, winnerId)),
      )
      .limit(1);
    if (dupe) {
      await tx.delete(recordingSubject).where(eq(recordingSubject.id, row.id));
      repointed.push({
        table: 'recording_subject',
        rowId: row.id,
        column: 'person_id',
        from: loserId,
        to: winnerId,
        kind: 'dropped-duplicate',
        row: { id: row.id, clanId: row.clanId, recordingId: row.recordingId, personId: row.personId },
      });
    } else {
      await tx
        .update(recordingSubject)
        .set({ personId: winnerId })
        .where(eq(recordingSubject.id, row.id));
      repointed.push({ table: 'recording_subject', rowId: row.id, column: 'person_id', from: loserId, to: winnerId });
    }
  }

  // notification.person_id
  const notificationRows = await tx
    .select({ id: notification.id })
    .from(notification)
    .where(eq(notification.personId, loserId));
  if (notificationRows.length > 0) {
    await tx
      .update(notification)
      .set({ personId: winnerId })
      .where(eq(notification.personId, loserId));
    for (const r of notificationRows) {
      repointed.push({ table: 'notification', rowId: r.id, column: 'person_id', from: loserId, to: winnerId });
    }
  }

  // attachment.person_id — only reachable when the winner has none (conflict check above).
  if (loserAttachments.length > 0) {
    await tx.update(attachment).set({ personId: winnerId }).where(eq(attachment.personId, loserId));
    for (const r of loserAttachments) {
      repointed.push({ table: 'attachment', rowId: r.id, column: 'person_id', from: loserId, to: winnerId });
    }
  }

  // OTHER open proposals referencing the loser: close as rejected ('superseded by merge').
  const otherProposals = await tx
    .select({ id: mergeProposal.id })
    .from(mergeProposal)
    .where(
      and(
        eq(mergeProposal.status, 'open'),
        ne(mergeProposal.id, proposal.id),
        or(eq(mergeProposal.winnerPersonId, loserId), eq(mergeProposal.loserPersonId, loserId)),
      ),
    );
  for (const other of otherProposals) {
    await tx
      .update(mergeProposal)
      .set({ status: 'rejected', decidedByAccountId: sctx.accountId, decidedAt: now })
      .where(eq(mergeProposal.id, other.id));
    repointed.push({ table: 'merge_proposal', rowId: other.id, column: 'status', from: 'open', to: 'rejected', kind: 'closed-proposal' });
    repointed.push({ table: 'merge_proposal', rowId: other.id, column: 'decided_by_account_id', from: null, to: sctx.accountId, kind: 'closed-proposal' });
    repointed.push({ table: 'merge_proposal', rowId: other.id, column: 'decided_at', from: null, to: now.toISOString(), kind: 'closed-proposal' });
    await writeRevision(tx, {
      clanId: sctx.clanId,
      accountId: sctx.accountId,
      entity: 'merge',
      entityId: other.id,
      action: 'update',
      note: 'superseded by merge',
      before: { status: 'open' },
      after: { status: 'rejected' },
    });
  }

  // Minimal winner re-projection: fill EMPTY projected slots on the winner from the loser's
  // last projected values. (Workaround, noted in the story report: AD-19 gives core/assertion
  // the projection write; its ops do not exist yet — story 1-2. Every column written here is
  // recorded as a 'projection' repoint entry, so unmerge restores it exactly.)
  const patch: PersonPatch = {};
  const pushProjection = (column: string, from: unknown, to: unknown) => {
    repointed.push({ table: 'person', rowId: winnerId, column, from, to, kind: 'projection' });
  };
  if (winner.fullName === '' && loser.fullName !== '') {
    const folded = chuanHoa(loser.fullName);
    patch.fullName = loser.fullName;
    pushProjection('full_name', winner.fullName, loser.fullName);
    patch.nameFolded = folded;
    pushProjection('name_folded', winner.nameFolded, folded);
    patch.nameTier = loser.nameTier;
    pushProjection('name_tier', winner.nameTier, loser.nameTier);
    patch.nameConfidence = loser.nameConfidence;
    pushProjection('name_confidence', winner.nameConfidence, loser.nameConfidence);
  }
  if (winner.gender == null && loser.gender != null) {
    patch.gender = loser.gender;
    pushProjection('gender', winner.gender, loser.gender);
    patch.genderTier = loser.genderTier;
    pushProjection('gender_tier', winner.genderTier, loser.genderTier);
  }
  if (
    winner.birthDate == null &&
    winner.birthPrecision == null &&
    (loser.birthDate != null || loser.birthPrecision != null)
  ) {
    patch.birthDate = loser.birthDate;
    pushProjection('birth_date', winner.birthDate, loser.birthDate);
    patch.birthPrecision = loser.birthPrecision;
    pushProjection('birth_precision', winner.birthPrecision, loser.birthPrecision);
    patch.birthTier = loser.birthTier;
    pushProjection('birth_tier', winner.birthTier, loser.birthTier);
  }
  if (
    winner.deathDate == null &&
    winner.deathPrecision == null &&
    (loser.deathDate != null || loser.deathPrecision != null)
  ) {
    patch.deathDate = loser.deathDate;
    pushProjection('death_date', winner.deathDate, loser.deathDate);
    patch.deathPrecision = loser.deathPrecision;
    pushProjection('death_precision', winner.deathPrecision, loser.deathPrecision);
    patch.deathTier = loser.deathTier;
    pushProjection('death_tier', winner.deathTier, loser.deathTier);
    if (loser.isLiving === false && winner.isLiving) {
      patch.isLiving = false;
      pushProjection('is_living', true, false);
    }
  }
  if (Object.keys(patch).length > 0) {
    await tx.update(person).set({ ...patch, updatedAt: now }).where(eq(person.id, winnerId));
  }

  // Tombstone: loser redirects to winner; its projected values are KEPT for the record.
  await tx
    .update(person)
    .set({ mergedInto: winnerId, updatedAt: now })
    .where(eq(person.id, loserId));

  await tx
    .update(mergeProposal)
    .set({ status: 'accepted', decidedByAccountId: sctx.accountId, decidedAt: now })
    .where(eq(mergeProposal.id, proposal.id));

  // AD-15: projected values about a living person changed → notification in the SAME tx.
  const projectionChanged = repointed.some((e) => e.kind === 'projection');
  const stillLiving = patch.isLiving === undefined ? winner.isLiving : patch.isLiving;
  if (projectionChanged && stillLiving) {
    await tx.insert(notification).values({
      id: uuidv7(),
      clanId: sctx.clanId,
      personId: winnerId,
      kind: 'record-changed',
      payload: { mergeProposalId: proposal.id, changed: repointed.filter((e) => e.kind === 'projection').map((e) => e.column) },
    });
  }

  await writeRevision(tx, {
    clanId: sctx.clanId,
    accountId: sctx.accountId,
    entity: 'merge',
    entityId: proposal.id,
    action: 'merge',
    note: proposal.reason,
    before: { winner, loser },
    after: { winnerId, loserId, repointed },
  });

  return ok({ winnerId, loserId, repointedCount: repointed.length });
}

// ── unmerge ──────────────────────────────────────────────────────────────────

/** Whitelist of (table, column) pairs the generic reversal may touch. Anything else is a bug. */
const REPOINTABLE: Record<RepointEntry['table'], Set<string>> = {
  assertion: new Set(['subject_person_id', 'object_person_id']),
  source: new Set(['told_by_person_id']),
  recording: new Set(['told_by_person_id']),
  recording_subject: new Set(['person_id']),
  notification: new Set(['person_id']),
  attachment: new Set(['person_id']),
  merge_proposal: new Set(['status', 'decided_by_account_id', 'decided_at']),
  person: new Set([
    'full_name',
    'name_folded',
    'name_tier',
    'name_confidence',
    'gender',
    'gender_tier',
    'birth_date',
    'birth_precision',
    'birth_tier',
    'death_date',
    'death_precision',
    'death_tier',
    'is_living',
  ]),
};

/**
 * Reads the merge revision's repoint list and reverses every entry (in reverse order), then
 * clears the tombstone and reopens the proposal. Restores EXACTLY the prior state of every
 * repointed column.
 */
export async function unmergeOp(
  tx: Tx,
  ctx: ViewerContext,
  args: { proposalId: string },
): Promise<Result<{ winnerId: string; loserId: string; reversed: number }>> {
  const approver = requireApprover(ctx);
  if (!approver.ok) return approver;
  const sctx = approver.value;

  const [proposal] = await tx
    .select()
    .from(mergeProposal)
    .where(eq(mergeProposal.id, args.proposalId))
    .limit(1);
  if (!proposal) return err('not-found', 'merge proposal not found');
  if (proposal.status !== 'accepted') {
    return err('conflict', `proposal is ${proposal.status} — only an executed merge can be unmerged`);
  }

  const [mergeRevision] = await tx
    .select()
    .from(revision)
    .where(
      and(eq(revision.entity, 'merge'), eq(revision.entityId, args.proposalId), eq(revision.action, 'merge')),
    )
    .orderBy(desc(revision.createdAt), desc(revision.id))
    .limit(1);
  if (!mergeRevision) {
    // AD-10 makes this impossible on any healthy path — treat as unrecoverable state, not a bug throw.
    return err('conflict', 'no merge revision recorded for this proposal — cannot unmerge');
  }
  const recorded = mergeRevision.after as {
    winnerId: string;
    loserId: string;
    repointed: RepointEntry[];
  };

  const [loser] = await tx.select().from(person).where(eq(person.id, recorded.loserId)).limit(1);
  if (!loser || loser.mergedInto !== recorded.winnerId) {
    return err('conflict', 'loser is no longer the tombstone of this merge');
  }

  for (const entry of [...recorded.repointed].reverse()) {
    if (entry.kind === 'dropped-duplicate') {
      const row = entry.row as { id: string; clanId: string; recordingId: string; personId: string };
      await tx.insert(recordingSubject).values(row);
      continue;
    }
    const allowed = REPOINTABLE[entry.table];
    if (!allowed || !allowed.has(entry.column)) {
      throw new Error(`unmerge: repoint entry not reversible: ${entry.table}.${entry.column}`);
    }
    await tx.execute(
      sql`UPDATE ${sql.identifier(entry.table)} SET ${sql.identifier(entry.column)} = ${entry.from} WHERE id = ${entry.rowId}`,
    );
  }

  const now = new Date();
  await tx
    .update(person)
    .set({ mergedInto: null, updatedAt: now })
    .where(eq(person.id, recorded.loserId));
  await tx
    .update(mergeProposal)
    .set({ status: 'open', decidedByAccountId: null, decidedAt: null })
    .where(eq(mergeProposal.id, args.proposalId));

  // AD-15 symmetry: if the reversal changed projected values on a living winner, notify.
  const projectionReversed = recorded.repointed.some((e) => e.kind === 'projection');
  if (projectionReversed) {
    const [winner] = await tx
      .select({ isLiving: person.isLiving })
      .from(person)
      .where(eq(person.id, recorded.winnerId))
      .limit(1);
    if (winner?.isLiving) {
      await tx.insert(notification).values({
        id: uuidv7(),
        clanId: sctx.clanId,
        personId: recorded.winnerId,
        kind: 'record-changed',
        payload: { mergeProposalId: args.proposalId, unmerge: true },
      });
    }
  }

  await writeRevision(tx, {
    clanId: sctx.clanId,
    accountId: sctx.accountId,
    entity: 'merge',
    entityId: args.proposalId,
    action: 'unmerge',
    after: { winnerId: recorded.winnerId, loserId: recorded.loserId, reversed: recorded.repointed.length },
  });

  return ok({ winnerId: recorded.winnerId, loserId: recorded.loserId, reversed: recorded.repointed.length });
}

// ── resolveAlias ─────────────────────────────────────────────────────────────

/**
 * Follow the mergedInto chain to the canonical person id. Loop-safe: a cycle (which no healthy
 * write path can produce) terminates at the first repeated id instead of hanging.
 * Exported for other core modules to call inside their own transaction.
 */
export async function resolveAliasOp(tx: Tx, personId: string): Promise<Result<string>> {
  const seen = new Set<string>();
  let current = personId;
  for (;;) {
    if (seen.has(current)) return ok(current);
    seen.add(current);
    const [row] = await tx
      .select({ id: person.id, mergedInto: person.mergedInto })
      .from(person)
      .where(eq(person.id, current))
      .limit(1);
    if (!row) {
      return seen.size === 1
        ? err('not-found', 'person not found in this clan')
        : ok(current); // dangling pointer: last existing id already followed to
    }
    if (!row.mergedInto) return ok(current);
    current = row.mergedInto;
  }
}

// ── listings for the bàn duyệt surface (stories 3-3/3-4) ─────────────────────

/** Display fallback when an account id no longer resolves to an auth user (audit convention). */
const UNKNOWN_NAME = 'không rõ';

const asRecord = (v: unknown): Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

export type ProposalStatus = 'open' | 'accepted' | 'rejected';

export type ProposalPersonView = {
  personId: string;
  fullName: string;
  /** Year only — the bàn duyệt card never needs more, and year is the AD-13-safe grain. */
  birthYear?: number;
  /** Same rule as core/tree: no OFFICIAL name projection yet ⇒ tentative styling. */
  tentative: boolean;
};

export type ProposalView = {
  proposalId: string;
  status: ProposalStatus;
  reason: string;
  evidence: DuplicateEvidence;
  createdAt: string; // ISO
  decidedAt?: string; // ISO
  winner: ProposalPersonView;
  loser: ProposalPersonView;
  proposedByName: string;
  decidedByName?: string;
};

/** Stored evidence is jsonb — normalize defensively so an old/empty image still has the shape. */
function evidenceOf(v: unknown): DuplicateEvidence {
  const o = asRecord(v);
  return {
    nameSimilarity: typeof o.nameSimilarity === 'number' ? o.nameSimilarity : 0,
    birthYearDelta: typeof o.birthYearDelta === 'number' ? o.birthYearDelta : null,
    sharedRelatives: typeof o.sharedRelatives === 'number' ? o.sharedRelatives : 0,
  };
}

function personViewOf(
  personId: string,
  row: { fullName: string; birthDate: string | null; nameTier: 'tentative' | 'official' | null } | undefined,
): ProposalPersonView {
  const year = row?.birthDate ? Number(row.birthDate.slice(0, 4)) : NaN;
  return {
    personId,
    fullName: row?.fullName ?? '',
    ...(Number.isFinite(year) ? { birthYear: year } : {}),
    tentative: !row || row.nameTier !== 'official',
  };
}

/**
 * Every merge proposal (optionally filtered by status), newest first, ready for the bàn duyệt
 * listing. Approver-only (AD-22 surface), which is also why person names are read directly:
 * admin | branch-head see full detail under AD-13. Account display names live outside the
 * clan partition (AD-8) — resolved through dbGlobal via lookupAccountNames.
 */
export async function listProposalsOp(
  tx: Tx,
  ctx: ViewerContext,
  args: { status?: ProposalStatus } = {},
): Promise<Result<ProposalView[]>> {
  const approver = requireApprover(ctx);
  if (!approver.ok) return approver;

  const proposals = await tx
    .select()
    .from(mergeProposal)
    .where(args.status ? eq(mergeProposal.status, args.status) : undefined)
    .orderBy(desc(mergeProposal.createdAt), desc(mergeProposal.id));

  const personIds = [...new Set(proposals.flatMap((p) => [p.winnerPersonId, p.loserPersonId]))];
  const personRows =
    personIds.length > 0
      ? await tx
          .select({
            id: person.id,
            fullName: person.fullName,
            birthDate: person.birthDate,
            nameTier: person.nameTier,
          })
          .from(person)
          .where(inArray(person.id, personIds))
      : [];
  const personById = new Map(personRows.map((r) => [r.id, r]));

  const names = await lookupAccountNames(
    proposals.flatMap((p) => [
      p.proposedByAccountId,
      ...(p.decidedByAccountId ? [p.decidedByAccountId] : []),
    ]),
  );

  return ok(
    proposals.map((p) => ({
      proposalId: p.id,
      status: p.status,
      reason: p.reason,
      evidence: evidenceOf(p.evidence),
      createdAt: p.createdAt.toISOString(),
      ...(p.decidedAt ? { decidedAt: p.decidedAt.toISOString() } : {}),
      winner: personViewOf(p.winnerPersonId, personById.get(p.winnerPersonId)),
      loser: personViewOf(p.loserPersonId, personById.get(p.loserPersonId)),
      proposedByName: names.get(p.proposedByAccountId) ?? UNKNOWN_NAME,
      ...(p.decidedByAccountId
        ? { decidedByName: names.get(p.decidedByAccountId) ?? UNKNOWN_NAME }
        : {}),
    })),
  );
}

export type MergeEvent = {
  proposalId: string;
  action: 'merge' | 'unmerge';
  at: string; // ISO
  byName: string;
  winnerName: string;
  loserName: string;
  repointedCount: number;
};

/**
 * The executed merge/unmerge trail, straight from the AD-10 revision log (entity 'merge',
 * actions 'merge' | 'unmerge'), newest first. Names come from the person images the merge
 * revision recorded in `before` when present, else from the current person rows; a name that
 * is recoverable from neither degrades to '' rather than failing the listing. Approver-only —
 * history is a disclosure channel (AD-21), same stance as core/audit.
 */
export async function listMergeHistoryOp(
  tx: Tx,
  ctx: ViewerContext,
  args: { limit?: number } = {},
): Promise<Result<MergeEvent[]>> {
  const approver = requireApprover(ctx);
  if (!approver.ok) return approver;
  const limit = Math.min(Math.max(Math.trunc(args.limit ?? 20), 1), 100);

  const rows = await tx
    .select()
    .from(revision)
    .where(and(eq(revision.entity, 'merge'), inArray(revision.action, ['merge', 'unmerge'])))
    .orderBy(desc(revision.createdAt), desc(revision.id))
    .limit(limit);

  const drafts = rows.map((row) => {
    const after = asRecord(row.after);
    const before = asRecord(row.before);
    const beforeWinner = asRecord(before.winner);
    const beforeLoser = asRecord(before.loser);
    return {
      row,
      winnerId: typeof after.winnerId === 'string' ? after.winnerId : null,
      loserId: typeof after.loserId === 'string' ? after.loserId : null,
      winnerName: typeof beforeWinner.fullName === 'string' ? beforeWinner.fullName : null,
      loserName: typeof beforeLoser.fullName === 'string' ? beforeLoser.fullName : null,
      repointedCount:
        row.action === 'merge'
          ? Array.isArray(after.repointed)
            ? after.repointed.length
            : 0
          : typeof after.reversed === 'number'
            ? after.reversed
            : 0,
    };
  });

  // Names the revision images could not provide → current person rows (tombstones keep theirs).
  const missingIds = [
    ...new Set(
      drafts.flatMap((d) => [
        ...(d.winnerName === null && d.winnerId ? [d.winnerId] : []),
        ...(d.loserName === null && d.loserId ? [d.loserId] : []),
      ]),
    ),
  ];
  const currentRows =
    missingIds.length > 0
      ? await tx
          .select({ id: person.id, fullName: person.fullName })
          .from(person)
          .where(inArray(person.id, missingIds))
      : [];
  const currentName = new Map(currentRows.map((r) => [r.id, r.fullName]));

  const names = await lookupAccountNames(rows.map((r) => r.accountId));

  return ok(
    drafts.map((d) => ({
      proposalId: d.row.entityId,
      action: d.row.action as 'merge' | 'unmerge',
      at: d.row.createdAt.toISOString(),
      byName: names.get(d.row.accountId) ?? UNKNOWN_NAME,
      winnerName: d.winnerName ?? (d.winnerId ? (currentName.get(d.winnerId) ?? '') : ''),
      loserName: d.loserName ?? (d.loserId ? (currentName.get(d.loserId) ?? '') : ''),
      repointedCount: d.repointedCount,
    })),
  );
}
