/**
 * Bootstrap — how a deployment gets its clan and its first admin (story 1-4).
 * `scripts/bootstrap-clan.ts` is a thin wrapper over these two functions; tests call them
 * directly. Nothing clan-specific is hard-coded here (AD-14) — name and settings arrive as
 * arguments; the script carries the Nguyễn Quang defaults as configuration.
 *
 * The first admin is a chicken-and-egg exception, taken deliberately:
 *  - person + name/source/assertion rows are inserted directly instead of via core/assertion
 *    (story 1-2), because bootstrap must not depend on a later story — but they are written
 *    HONESTLY: source kind 'self', assertion kind 'name', tier 'tentative' (AD-9);
 *  - the attachment is born 'active' with role 'admin' and no voucher — someone has to be
 *    first; every later attachment goes through requestAttachment → approveAttachment.
 * Every insert still writes its revision in the same transaction (AD-10), and the new living
 * person gets their 'added-to-tree' notification (AD-15).
 */
import { eq } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { dbGlobal, withClanContext } from '@/db';
import { assertion, attachment, authUser, clan, notification, person, source } from '@/db/schema';
import { writeRevision } from '@/core/revision';
import { chuanHoa } from '@/core/so-khop';
import { auth } from './ba';

export type EnsureClanArgs = {
  name: string;
  /** AD-14: surname, middle name, motto… — data, not code. */
  settings?: Record<string, unknown>;
  /** Existing deployment clan id (GIAPHA_CLAN_ID) — reused when its row exists. */
  existingClanId?: string | null;
};

/** Idempotent: reuses `existingClanId` when that clan row exists, otherwise creates one. */
export async function ensureClan(args: EnsureClanArgs): Promise<{ clanId: string; created: boolean }> {
  if (args.existingClanId) {
    const rows = await withClanContext(args.existingClanId, (tx) =>
      tx.select({ id: clan.id }).from(clan).where(eq(clan.id, args.existingClanId!)),
    );
    if (rows.length > 0) return { clanId: args.existingClanId, created: false };
  }

  const id = uuidv7();
  // clan rows are themselves RLS-guarded (visible only as current context, WITH CHECK id =
  // context) — creation therefore happens under the new clan's own context.
  await withClanContext(id, async (tx) => {
    await tx.insert(clan).values({ id, name: args.name, settings: args.settings ?? {} });
  });
  return { clanId: id, created: true };
}

export type CreateAdminArgs = {
  clanId: string;
  email: string;
  password: string;
  name: string;
};

export type CreatedAdmin = {
  accountId: string;
  personId: string;
  attachmentId: string;
  /** false ⇒ the account already had an active attachment; nothing was re-created. */
  created: boolean;
};

/**
 * Create the Better Auth user (server call), an honest person record (name assertion with
 * source kind 'self'), and an 'active' admin attachment. Idempotent per email: an existing
 * account with an active attachment is returned untouched.
 */
export async function createAdmin(args: CreateAdminArgs): Promise<CreatedAdmin> {
  // Account layer (identity tables — dbGlobal, no clan context, AD-8).
  const [existingUser] = await dbGlobal
    .select({ id: authUser.id })
    .from(authUser)
    .where(eq(authUser.email, args.email));
  let accountId: string;
  if (existingUser) {
    accountId = existingUser.id;
  } else {
    const res = await auth.api.signUpEmail({
      body: { email: args.email, password: args.password, name: args.name },
    });
    accountId = res.user.id;
  }

  return withClanContext(args.clanId, async (tx) => {
    const [existing] = await tx
      .select()
      .from(attachment)
      .where(eq(attachment.accountId, accountId));
    if (existing && existing.status === 'active') {
      return { accountId, personId: existing.personId, attachmentId: existing.id, created: false };
    }

    const personId = uuidv7();
    const sourceId = uuidv7();
    const assertionId = uuidv7();
    const attachmentId = uuidv7();

    await tx.insert(person).values({
      id: personId,
      clanId: args.clanId,
      fullName: args.name,
      nameFolded: chuanHoa(args.name),
      nameTier: 'tentative',
      nameConfidence: 'chac-chan',
    });
    await writeRevision(tx, {
      clanId: args.clanId,
      accountId,
      entity: 'person',
      entityId: personId,
      action: 'create',
      after: { fullName: args.name },
      note: 'bootstrap: người quản trị đầu tiên',
    });

    await tx.insert(source).values({
      id: sourceId,
      clanId: args.clanId,
      kind: 'self',
      description: 'Tự khai khi khởi tạo hệ thống',
      createdByAccountId: accountId,
    });
    await writeRevision(tx, {
      clanId: args.clanId,
      accountId,
      entity: 'source',
      entityId: sourceId,
      action: 'create',
      after: { kind: 'self' },
    });

    await tx.insert(assertion).values({
      id: assertionId,
      clanId: args.clanId,
      subjectPersonId: personId,
      kind: 'name',
      value: { fullName: args.name },
      sourceId,
      confidence: 'chac-chan',
      tier: 'tentative', // AD-9: everything enters tentative, the first admin included.
      createdByAccountId: accountId,
    });
    await writeRevision(tx, {
      clanId: args.clanId,
      accountId,
      entity: 'assertion',
      entityId: assertionId,
      action: 'create',
      after: { kind: 'name', value: { fullName: args.name }, tier: 'tentative' },
    });

    if (existing) {
      // A pending request from this account exists — promote it onto the fresh person row.
      await tx
        .update(attachment)
        .set({ personId, role: 'admin', status: 'active' })
        .where(eq(attachment.id, existing.id));
      await writeRevision(tx, {
        clanId: args.clanId,
        accountId,
        entity: 'attachment',
        entityId: existing.id,
        action: 'update',
        before: { personId: existing.personId, role: existing.role, status: existing.status },
        after: { personId, role: 'admin', status: 'active' },
        note: 'bootstrap: nâng yêu cầu chờ thành quản trị',
      });
    } else {
      await tx.insert(attachment).values({
        id: attachmentId,
        clanId: args.clanId,
        accountId,
        personId,
        role: 'admin',
        status: 'active',
      });
      await writeRevision(tx, {
        clanId: args.clanId,
        accountId,
        entity: 'attachment',
        entityId: attachmentId,
        action: 'create',
        after: { accountId, personId, role: 'admin', status: 'active' },
        note: 'bootstrap: gắn quản trị đầu tiên, không cần người bảo lãnh',
      });
    }

    // AD-15: a living person was added — the event is owed to the node, even the admin's own.
    await tx.insert(notification).values({
      id: uuidv7(),
      clanId: args.clanId,
      personId,
      kind: 'added-to-tree',
      payload: { personId, fullName: args.name, byAccountId: accountId },
    });

    return {
      accountId,
      personId,
      attachmentId: existing ? existing.id : attachmentId,
      created: true,
    };
  });
}
