/**
 * Bootstrap — how a deployment gets its clan and its first admin (story 1-4).
 * `scripts/create-admin.ts` is a thin wrapper over these two functions; tests call them
 * directly. Nothing clan-specific is hard-coded here (AD-14) — name and settings arrive as
 * arguments; the script carries the Nguyễn Quang defaults as configuration.
 *
 * The first admin is a chicken-and-egg exception, taken deliberately:
 *  - person + name/source/assertion rows are inserted directly instead of through
 *    core/assertion's write path (createPersonOp needs an attached writer, which is exactly
 *    what does not exist yet) — but they are written HONESTLY, in the same shapes that path
 *    produces: a BARE person row, source kind 'self', assertion kind 'name', tier 'tentative'
 *    (AD-9), and full-row revision images the point-in-time replay can read (core/audit);
 *  - the attachment is born 'active' with role 'admin' and no voucher — someone has to be
 *    first; every later attachment goes through requestAttachment → approveAttachment.
 *
 * AD-19 is NOT excepted: the projected columns on `person` (fullName, nameFolded, nameTier…)
 * are never hand-filled here — `projectPerson` from core/assertion recomputes them from the
 * name assertion, keeping core/assertion the single writer of those columns.
 *
 * Every insert still writes its revision in the same transaction (AD-10), and the new living
 * person gets their 'added-to-tree' notification (AD-15).
 */
import { eq } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { dbGlobal, withClanContext } from '@/db';
import { assertion, attachment, authUser, clan, notification, person, source } from '@/db/schema';
import { writeRevision } from '@/core/revision';
import { projectPerson } from '@/core/assertion/ops';
import { auth } from './ba';
import { soleClanId } from './clan-registry';
import { boDau } from '@/core/so-khop';

export type EnsureClanArgs = {
  name: string;
  /** AD-14: surname, middle name, motto… — data, not code. */
  settings?: Record<string, unknown>;
};

/**
 * Idempotent: dùng lại dòng họ đã có trong database, chưa có thì tạo.
 *
 * Trước 25/08/2026 hàm này nhận `existingClanId` do người gọi đọc từ `GIAPHA_CLAN_ID`. Nay id
 * là sự thật nằm trong DB và `soleClanId()` đọc thẳng ra — người gọi không phải mang theo nữa,
 * và không còn đường cho env lệch khỏi dữ liệu.
 */
export async function ensureClan(args: EnsureClanArgs): Promise<{ clanId: string; created: boolean }> {
  /**
   * Kiểm hàng CÓ THẬT trước khi dùng lại (khôi phục 25/08 sau code review).
   *
   * `soleClanId()` trả `GIAPHA_CLAN_ID` chỉ sau một phép khớp regex — nó không tra database. Mọi
   * bản triển khai đang chạy vẫn còn biến ấy trong `.env` (script thôi GHI nó, nhưng không xoá
   * được cái đã có), nên trỏ vào một database đã dựng lại là `ensureClan` báo "dùng lại" cho một
   * dòng họ không tồn tại, rồi `createAdmin` chết vì khoá ngoại — từ chính cái script sinh ra để
   * bootstrap được ở mọi trạng thái.
   */
  const daCo = await soleClanId();
  if (daCo) {
    const rows = await withClanContext(daCo, (tx) =>
      tx.select({ id: clan.id }).from(clan).where(eq(clan.id, daCo)),
    );
    if (rows.length > 0) return { clanId: daCo, created: false };
  }

  const id = uuidv7();
  // Ghi vào `clan` vẫn bị RLS gác (`WITH CHECK id = current_clan_id()`) — đọc thì mở từ
  // migration 0002, ghi thì không. Nên vẫn phải tạo dưới context của chính dòng họ mới.
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
  /** Bỏ trống thì suy từ `name` (bỏ dấu, thường hoá, cách → chấm). */
  username?: string;
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
    // TÊN ĐĂNG NHẬP LÀ BẮT BUỘC, không phải tuỳ chọn: form đăng nhập nhận cả email lẫn tên đăng
    // nhập, nhưng một tài khoản quản trị KHÔNG có tên đăng nhập là một tài khoản chỉ vào được
    // bằng đúng một đường — và người dựng hệ thống là người ít có cơ hội thử nhất trước khi
    // dòng họ vào. Suy từ họ tên qua chính hàm bỏ dấu của AD-16.
    const tenDangNhap =
      args.username?.trim() ||
      boDau(args.name)
        .toLowerCase()
        .replace(/\s+/g, '.')
        .replace(/[^a-z0-9._-]/g, '')
        .slice(0, 32);
    const res = await auth.api.signUpEmail({
      body: {
        email: args.email,
        password: args.password,
        name: args.name,
        username: tenDangNhap,
      },
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

    // Bare identity row — projected columns stay at their defaults until projectPerson fills
    // them from the name assertion below (AD-19). Same shape core/person/ops writes, so the
    // revision image core/audit replays is the documented one: { id, clanId }, no name.
    await tx.insert(person).values({ id: personId, clanId: args.clanId });
    await writeRevision(tx, {
      clanId: args.clanId,
      accountId,
      entity: 'person',
      entityId: personId,
      action: 'create',
      after: { id: personId, clanId: args.clanId },
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

    const nameAssertion = {
      id: assertionId,
      clanId: args.clanId,
      subjectPersonId: personId,
      kind: 'name' as const,
      value: { fullName: args.name },
      sourceId,
      confidence: 'chac-chan' as const,
      tier: 'tentative' as const, // AD-9: everything enters tentative, the first admin included.
      status: 'live' as const,
      createdByAccountId: accountId,
    };
    await tx.insert(assertion).values(nameAssertion);
    await writeRevision(tx, {
      clanId: args.clanId,
      accountId,
      entity: 'assertion',
      entityId: assertionId,
      action: 'create',
      after: nameAssertion, // FULL row — core/audit's replay reads the image, not the table.
    });

    // AD-19: core/assertion owns every projected column on `person`. Bootstrap only supplies
    // the claim; the projection derives fullName / nameFolded / nameTier / isLiving from it.
    await projectPerson(tx, personId);

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
