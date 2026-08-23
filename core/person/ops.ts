/**
 * core/person/ops — person substrate (story 1-2).
 *
 * `createPersonOp` is the single way a person enters the tree: one bare identity row (AD-2,
 * AD-6 — uuidv7, no positional meaning) plus assertions for everything claimed about them,
 * all tentative (AD-9), all through core/assertion's write path so projection (AD-19) and
 * revisions (AD-10) cannot be skipped. Callable by other core modules inside an existing tx —
 * seed-import batches many persons in ONE transaction this way.
 *
 * All inputs are validated BEFORE the first write; a sub-operation failing after writes have
 * begun is a bug and throws, so the enclosing transaction rolls back.
 */
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '@/db';
import { notification, person } from '@/db/schema';
import { writeRevision } from '@/core/revision';
import { err, ok, type Result } from '@/core/types';
import type { ViewerContext } from '@/core/identity/session';
import type { AddedPerson, NewPersonInput } from '@/core/assertion';
import {
  addAssertionOp,
  createSourceOp,
  gateWriter,
  invalidGenealogicalDate,
  loadPerson,
  type AddedAssertions,
} from '@/core/assertion/ops';

export async function createPersonOp(
  tx: Tx,
  viewer: ViewerContext,
  input: NewPersonInput,
): Promise<Result<AddedPerson>> {
  const gate = gateWriter(viewer);
  if (!gate.ok) return gate;
  const ctx = gate.value;

  // ── Validate everything up front — no writes yet ──
  const fullName = input.fullName.trim();
  if (!fullName) return err('invalid', 'fullName is required');
  if (input.gender && !['male', 'female', 'other'].includes(input.gender))
    return err('invalid', `unknown gender '${input.gender}'`);
  if (input.birth) {
    const problem = invalidGenealogicalDate(input.birth);
    if (problem) return err('invalid', `birth: ${problem}`);
  }
  if (input.death) {
    const problem = invalidGenealogicalDate(input.death);
    if (problem) return err('invalid', `death: ${problem}`);
  }
  const refs = [
    ['parentId', input.parentId],
    ['childId', input.childId],
    ['partnerId', input.partnerId],
  ] as const;
  for (const [label, id] of refs) {
    if (!id) continue;
    const row = await loadPerson(tx, id);
    if (!row) return err('not-found', `${label} not found in this clan`);
    if (row.mergedInto) return err('conflict', `${label} was merged into another person`);
  }

  // ── Person row (projected columns stay at their defaults until projection fills them) ──
  const personId = uuidv7();
  await tx.insert(person).values({ id: personId, clanId: ctx.clanId });
  await writeRevision(tx, {
    clanId: ctx.clanId,
    accountId: ctx.accountId,
    entity: 'person',
    entityId: personId,
    action: 'create',
    after: { id: personId, clanId: ctx.clanId },
  });

  // ── One shared source for every assertion of this call ──
  const sourceId = await createSourceOp(tx, ctx, input.source);
  const source = { kind: 'existing', sourceId } as const;
  const confidence = input.confidence ?? 'ton-nghi';

  const assertionIds: string[] = [];
  const must = async (result: Promise<Result<AddedAssertions>>) => {
    const r = await result;
    // Inputs were validated above — an err here means writes already happened on a bad state.
    if (!r.ok) throw new Error(`createPersonOp invariant broken: ${r.error.code} — ${r.error.message}`);
    assertionIds.push(...r.value.assertionIds);
  };

  await must(addAssertionOp(tx, ctx, { personId, spec: { kind: 'name', fullName }, source, confidence }));
  if (input.gender)
    await must(
      addAssertionOp(tx, ctx, { personId, spec: { kind: 'gender', gender: input.gender }, source, confidence }),
    );
  if (input.birth)
    await must(
      addAssertionOp(tx, ctx, { personId, spec: { kind: 'birth', value: input.birth }, source, confidence }),
    );
  if (input.death)
    await must(
      addAssertionOp(tx, ctx, { personId, spec: { kind: 'death', value: input.death }, source, confidence }),
    );
  if (input.parentId)
    // New person is the CHILD of parentId.
    await must(
      addAssertionOp(tx, ctx, {
        personId,
        spec: { kind: 'parent-child', parentId: input.parentId },
        source,
        confidence,
      }),
    );
  if (input.childId)
    // New person is the PARENT of childId — the edge hangs on the child (subject = child, AD-18).
    await must(
      addAssertionOp(tx, ctx, {
        personId: input.childId,
        spec: { kind: 'parent-child', parentId: personId },
        source,
        confidence,
      }),
    );
  if (input.partnerId)
    await must(
      addAssertionOp(tx, ctx, {
        personId,
        spec: { kind: 'union-partner', partnerId: input.partnerId },
        source,
        confidence,
      }),
    );
  if (input.note?.trim())
    await must(
      addAssertionOp(tx, ctx, { personId, spec: { kind: 'note', text: input.note.trim() }, source, confidence }),
    );

  // ── AD-15: a living person is told they were added, same tx ──
  if (!input.death) {
    await tx.insert(notification).values({
      id: uuidv7(),
      clanId: ctx.clanId,
      personId,
      kind: 'added-to-tree',
      payload: { fullName, byAccountId: ctx.accountId },
    });
  }

  return ok({ personId, assertionIds });
}
