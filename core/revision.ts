/**
 * AD-10 — every mutation writes a revision record in the SAME transaction.
 * One shared helper so no module invents its own shape. Call inside withClanContext.
 */
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '@/db';
import { revision } from '@/db/schema';

type RevisionInput = {
  clanId: string;
  accountId: string;
  entity:
    | 'person'
    | 'assertion'
    | 'source'
    | 'union'
    | 'recording'
    | 'attachment'
    | 'merge'
    /** FR-65, story 5-7 — nơi chốn là thực thể, nên mọi lần tạo/gộp nó cũng vào nhật ký (AD-10). */
    | 'place'
    /** AD-14, story 5-8 — tên họ · chữ đệm · đề từ là DỮ LIỆU, nên đổi chúng cũng vào nhật ký. */
    | 'clan';
  entityId: string;
  action:
    | 'create'
    | 'update'
    | 'promote'
    | 'hide'
    | 'restore'
    | 'remove'
    | 'withdraw'
    | 'merge'
    | 'unmerge';
  before?: unknown;
  after?: unknown;
  note?: string;
};

export async function writeRevision(tx: Tx, input: RevisionInput): Promise<string> {
  const id = uuidv7();
  await tx.insert(revision).values({
    id,
    clanId: input.clanId,
    accountId: input.accountId,
    entity: input.entity,
    entityId: input.entityId,
    action: input.action,
    before: input.before ?? null,
    after: input.after ?? null,
    note: input.note ?? '',
  });
  return id;
}
