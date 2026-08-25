/**
 * Story 1-4 — core/identity: Better Auth + attachment + roles (FR-64, FR-37, FR-55).
 * Real-DB tests (pattern: core/gates/rls.gate.test.ts): fresh uuidv7 clan per run, every
 * datum prefixed s14/S14, cleanup via ownerPool with SET LOCAL per clan. Ops are exercised
 * directly with fabricated contexts (build contract § layering); the session path goes
 * through Better Auth itself with real cookies.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { eq, inArray } from 'drizzle-orm';
import { dbGlobal, ownerPool, withClanContext } from '@/db';
import {
  assertion,
  attachment,
  authUser,
  clan,
  notification,
  person,
  revision,
  source,
} from '@/db/schema';
import { getClanInfoOp, updateClanInfoOp } from './info';
import { auth } from './ba';
import { resolveSessionImpl, guestContextImpl } from './auth';
import { createAdmin } from './bootstrap';
import type { SessionContext } from './session';
import {
  approveAttachmentOp,
  detachSelfOp,
  getMyNotificationsOp,
  listPendingAttachmentsOp,
  rejectAttachmentOp,
  markNotificationSeenOp,
  requestAttachmentOp,
  updateSelfVisibilityOp,
} from './ops';

const owner = ownerPool();
const run = uuidv7().slice(0, 8);
const PW = 'S14!matkhau-thu';

const adminEmail = `s14-admin-${run}@test.local`;
const member1Email = `s14-member-${run}@test.local`;

let clanId: string;
let adminAccountId: string;
let adminPersonId: string;
let member1AccountId: string;
let member1Cookie: string;
let envBefore: string | undefined;

const ctx = (accountId: string, role: SessionContext['role'], personId: string | null = null): SessionContext => ({
  accountId,
  clanId,
  personId,
  role,
});

async function insertPerson(fullName: string): Promise<string> {
  const id = uuidv7();
  await withClanContext(clanId, (tx) =>
    tx.insert(person).values({ id, clanId, fullName, nameFolded: fullName.toLowerCase() }),
  );
  return id;
}

beforeAll(async () => {
  envBefore = process.env.GIAPHA_CLAN_ID;

  /**
   * Dựng THẲNG dòng họ tạm, không mượn `ensureClan`. Từ 25/08/2026 `ensureClan` là hàm bootstrap
   * thật: nó dùng lại dòng họ đã có trong database thay vì tạo mới, nên ở một DB đã bootstrap thì
   * `created` sẽ là `false` và test sẽ chạy nhờ vào dòng họ thật — đúng thứ bộ test này phải
   * tránh. Cùng nếp với `core/gates/rls.gate.test.ts`.
   */
  clanId = uuidv7();
  await withClanContext(clanId, (tx) =>
    tx.insert(clan).values({ id: clanId, name: `S14 Clan ${run}`, settings: { surname: 'Thử' } }),
  );

  // Ghim: DB lúc này có cả dòng họ thật lẫn dòng họ tạm này, nên `soleClanId()` phải được bảo
  // đang hỏi về cái nào. Đây là lý do DUY NHẤT biến môi trường ấy còn tồn tại.
  process.env.GIAPHA_CLAN_ID = clanId;

  const admin = await createAdmin({
    clanId,
    email: adminEmail,
    password: PW,
    name: 'S14 Nguyễn Thử Quản Trị',
  });
  adminAccountId = admin.accountId;
  adminPersonId = admin.personId;

  // Member account with a REAL session — the resolveSession test needs cookies.
  const signedUp = await auth.api.signUpEmail({
    body: { email: member1Email, password: PW, name: 'S14 Nguyễn Thử Thành Viên' },
    returnHeaders: true,
  });
  member1AccountId = signedUp.response.user.id;
  member1Cookie = signedUp.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');
  expect(member1Cookie).toContain('session_token');
});

afterAll(async () => {
  if (envBefore === undefined) delete process.env.GIAPHA_CLAN_ID;
  else process.env.GIAPHA_CLAN_ID = envBefore;

  if (clanId) {
    await owner.query('BEGIN');
    await owner.query(`SET LOCAL app.clan_id = '${clanId}'`);
    for (const tbl of ['notification', 'attachment', 'assertion', 'source', 'revision', 'person']) {
      await owner.query(`DELETE FROM "${tbl}" WHERE clan_id = $1`, [clanId]);
    }
    await owner.query('DELETE FROM clan WHERE id = $1', [clanId]);
    await owner.query('COMMIT');
  }
  // Identity rows (no RLS) — session/account cascade from user.
  await dbGlobal.delete(authUser).where(inArray(authUser.email, [adminEmail, member1Email]));
  await owner.end();
});

describe('bootstrap (core/identity/bootstrap)', () => {
  it('creates clan + admin honestly (person, self source, name assertion, active attachment, revisions, notification) and is idempotent', async () => {
    await withClanContext(clanId, async (tx) => {
      const [p] = await tx.select().from(person).where(eq(person.id, adminPersonId));
      expect(p.fullName).toBe('S14 Nguyễn Thử Quản Trị');
      expect(p.nameFolded).toBe('s14 nguyen thu quan tri'); // chuanHoa: bỏ dấu + thường hoá
      expect(p.nameTier).toBe('tentative'); // AD-9 — the first admin is not an exception

      const claims = await tx.select().from(assertion).where(eq(assertion.subjectPersonId, adminPersonId));
      expect(claims).toHaveLength(1);
      expect(claims[0].kind).toBe('name');
      const [src] = await tx.select().from(source).where(eq(source.id, claims[0].sourceId));
      expect(src.kind).toBe('self');

      const [att] = await tx.select().from(attachment).where(eq(attachment.accountId, adminAccountId));
      expect(att.status).toBe('active');
      expect(att.role).toBe('admin');
      expect(att.personId).toBe(adminPersonId);

      // AD-10: one revision per insert (person, source, assertion, attachment).
      const revs = await tx.select().from(revision);
      expect(revs.filter((r) => r.entityId === adminPersonId && r.entity === 'person')).toHaveLength(1);
      expect(revs.filter((r) => r.entity === 'attachment' && r.entityId === att.id)).toHaveLength(1);

      // AD-15: the living person added gets their added-to-tree event.
      const notes = await tx.select().from(notification).where(eq(notification.personId, adminPersonId));
      expect(notes.some((n) => n.kind === 'added-to-tree')).toBe(true);
    });

    // Idempotent re-run: same account, same person, nothing re-created.
    const again = await createAdmin({ clanId, email: adminEmail, password: PW, name: 'S14 Nguyễn Thử Quản Trị' });
    expect(again.created).toBe(false);
    expect(again.accountId).toBe(adminAccountId);
    expect(again.personId).toBe(adminPersonId);
  });
});

describe('attachment flow (FR-64, AD-8)', () => {
  it('requestAttachment → approve → resolveSession returns the vouched role and node', async () => {
    const nodeId = await insertPerson(`S14 Node Một ${run}`);

    // Before attachment: a real session resolves to guest with no node.
    const before = await resolveSessionImpl(new Headers({ cookie: member1Cookie }));
    expect(before).toMatchObject({ accountId: member1AccountId, clanId, personId: null, role: 'guest' });

    const requested = await withClanContext(clanId, (tx) =>
      requestAttachmentOp(tx, ctx(member1AccountId, 'guest'), { personId: nodeId }),
    );
    expect(requested.ok).toBe(true);
    const attachmentId = requested.ok ? requested.value.attachmentId : '';

    // Pending list is readable by the approver, and carries the person's name.
    const pending = await withClanContext(clanId, (tx) =>
      listPendingAttachmentsOp(tx, ctx(adminAccountId, 'admin', adminPersonId)),
    );
    expect(pending.ok && pending.value.some((p) => p.attachmentId === attachmentId)).toBe(true);

    const approved = await withClanContext(clanId, (tx) =>
      approveAttachmentOp(tx, ctx(adminAccountId, 'admin', adminPersonId), { attachmentId }),
    );
    expect(approved.ok).toBe(true);

    // vouchedBy = the approver's own attachment (the vouch chain stays in the clan graph).
    await withClanContext(clanId, async (tx) => {
      const [att] = await tx.select().from(attachment).where(eq(attachment.id, attachmentId));
      expect(att.status).toBe('active');
      const [voucher] = await tx.select().from(attachment).where(eq(attachment.id, att.vouchedByAttachmentId!));
      expect(voucher.accountId).toBe(adminAccountId);
    });

    const session = await resolveSessionImpl(new Headers({ cookie: member1Cookie }));
    expect(session).toMatchObject({ accountId: member1AccountId, clanId, personId: nodeId, role: 'member' });
  });

  it('a second request while pending REPLACES the first (one attachment per account per clan)', async () => {
    const acc = `s14-acc-replace-${run}`;
    const nodeA = await insertPerson(`S14 Node A ${run}`);
    const nodeB = await insertPerson(`S14 Node B ${run}`);

    const first = await withClanContext(clanId, (tx) => requestAttachmentOp(tx, ctx(acc, 'guest'), { personId: nodeA }));
    const second = await withClanContext(clanId, (tx) => requestAttachmentOp(tx, ctx(acc, 'guest'), { personId: nodeB }));
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.value.attachmentId).toBe(first.value.attachmentId);

    await withClanContext(clanId, async (tx) => {
      const rows = await tx.select().from(attachment).where(eq(attachment.accountId, acc));
      expect(rows).toHaveLength(1);
      expect(rows[0].personId).toBe(nodeB);
      expect(rows[0].status).toBe('pending');
    });

    // Unknown node → not-found; nothing written.
    const missing = await withClanContext(clanId, (tx) =>
      requestAttachmentOp(tx, ctx(`s14-acc-miss-${run}`, 'guest'), { personId: uuidv7() }),
    );
    expect(!missing.ok && missing.error.code === 'not-found').toBe(true);
  });

  it('approval rights: branch-head approves members only; guests approve nothing', async () => {
    // A real branch-head with an ACTIVE attachment (the voucher lookup needs the row).
    const bhAcc = `s14-acc-bh-${run}`;
    const bhPerson = await insertPerson(`S14 Trưởng Chi ${run}`);
    const bhAttachmentId = uuidv7();
    await withClanContext(clanId, (tx) =>
      tx.insert(attachment).values({
        id: bhAttachmentId,
        clanId,
        accountId: bhAcc,
        personId: bhPerson,
        role: 'branch-head',
        status: 'active',
      }),
    );

    const m2Acc = `s14-acc-m2-${run}`;
    const m2Node = await insertPerson(`S14 Node Hai ${run}`);
    const m2Req = await withClanContext(clanId, (tx) => requestAttachmentOp(tx, ctx(m2Acc, 'guest'), { personId: m2Node }));
    expect(m2Req.ok).toBe(true);
    const m2AttachmentId = m2Req.ok ? m2Req.value.attachmentId : '';

    // Guest cannot approve, cannot list.
    const guestList = await withClanContext(clanId, (tx) => listPendingAttachmentsOp(tx, ctx(m2Acc, 'guest')));
    expect(!guestList.ok && guestList.error.code === 'forbidden').toBe(true);
    const guestApprove = await withClanContext(clanId, (tx) =>
      approveAttachmentOp(tx, ctx(m2Acc, 'guest'), { attachmentId: m2AttachmentId }),
    );
    expect(!guestApprove.ok && guestApprove.error.code === 'forbidden').toBe(true);

    // Branch-head cannot grant a role above member…
    const bhCtx = ctx(bhAcc, 'branch-head', bhPerson);
    const grantAdmin = await withClanContext(clanId, (tx) =>
      approveAttachmentOp(tx, bhCtx, { attachmentId: m2AttachmentId, role: 'admin' }),
    );
    expect(!grantAdmin.ok && grantAdmin.error.code === 'forbidden').toBe(true);

    // …but approves a plain member.
    const approve = await withClanContext(clanId, (tx) => approveAttachmentOp(tx, bhCtx, { attachmentId: m2AttachmentId }));
    expect(approve.ok && approve.value.role === 'member').toBe(true);

    // Already active → conflict; unknown id → not-found.
    const rerun = await withClanContext(clanId, (tx) => approveAttachmentOp(tx, bhCtx, { attachmentId: m2AttachmentId }));
    expect(!rerun.ok && rerun.error.code === 'conflict').toBe(true);
    const nowhere = await withClanContext(clanId, (tx) => approveAttachmentOp(tx, bhCtx, { attachmentId: uuidv7() }));
    expect(!nowhere.ok && nowhere.error.code === 'not-found').toBe(true);
  });
});

describe('guest context (FR-11 public view)', () => {
  /**
   * Tiểu mục "bỏ biến môi trường ⇒ null" đã gỡ 25/08/2026: nguồn của clan id nay là bảng `clan`
   * trong database, nên gỡ chốt ghim KHÔNG cho `null` — nó cho dòng họ đầu tiên của triển khai.
   * Trường hợp "chưa bootstrap ⇒ null" vẫn còn nguyên trong `soleClanId()`, chỉ là dựng lại nó ở
   * đây phải xoá sạch dòng họ của cả máy, cái giá quá đắt cho một nhánh hai dòng.
   */
  it('no cookie ⇒ no session; guest context carries the pinned clan', async () => {
    expect(await resolveSessionImpl(new Headers())).toBeNull();

    const guest = await guestContextImpl();
    expect(guest).toEqual({ accountId: null, clanId, personId: null, role: 'guest' });
  });
});

describe('sổ dòng họ — đường ghi ClanSettings (story 5-8)', () => {
  const adminCtx = () => ctx(adminAccountId, 'admin', adminPersonId);

  it('quản trị sửa được, và sửa TỪNG PHẦN — khoá không gửi thì giữ nguyên', async () => {
    await withClanContext(clanId, (tx) =>
      updateClanInfoOp(tx, adminCtx(), {
        settings: { surname: 'Nguyễn', middleName: 'Quang', motto: '光前裕後' },
      }),
    );

    // Chỉ gửi `middleName`. Ba khoá kia PHẢI còn nguyên — `settings` là một cột jsonb, nên ghi đè
    // cả cụm là cách nhanh nhất xoá mất đề từ khi ai đó chỉ định sửa chữ đệm.
    const ra = await withClanContext(clanId, (tx) =>
      updateClanInfoOp(tx, adminCtx(), { settings: { middleName: 'Văn' } }),
    );
    expect(ra.ok).toBe(true);
    if (!ra.ok) return;
    expect(ra.value.settings.middleName).toBe('Văn');
    expect(ra.value.settings.surname).toBe('Nguyễn');
    expect(ra.value.settings.motto).toBe('光前裕後');
  });

  it('chuỗi rỗng XOÁ khoá, không lưu chuỗi rỗng', async () => {
    await withClanContext(clanId, (tx) =>
      updateClanInfoOp(tx, adminCtx(), { settings: { mottoPhonetic: 'Quang tiền dụ hậu' } }),
    );
    const ra = await withClanContext(clanId, (tx) =>
      updateClanInfoOp(tx, adminCtx(), { settings: { mottoPhonetic: '   ' } }),
    );
    expect(ra.ok).toBe(true);
    if (!ra.ok) return;
    // `getClanInfoOp` vốn coi `''` như vắng, nên lưu `''` là để lại một giá trị mà chính hàm đọc
    // không thừa nhận.
    expect(ra.value.settings.mottoPhonetic).toBeUndefined();
  });

  it('tên dòng họ KHÔNG được để trống — nó là tiêu đề của cả sản phẩm', async () => {
    const ra = await withClanContext(clanId, (tx) =>
      updateClanInfoOp(tx, adminCtx(), { name: '  ' }),
    );
    expect(!ra.ok && ra.error.code === 'invalid').toBe(true);
  });

  it('trưởng chi và thành viên KHÔNG sửa được', async () => {
    for (const vai of ['branch-head', 'member', 'guest'] as const) {
      const ra = await withClanContext(clanId, (tx) =>
        updateClanInfoOp(tx, ctx(adminAccountId, vai, adminPersonId), {
          settings: { surname: 'Trần' },
        }),
      );
      expect(!ra.ok && ra.error.code === 'forbidden', vai).toBe(true);
    }
  });

  it('getClanInfo đọc lại đúng thứ vừa ghi', async () => {
    await withClanContext(clanId, (tx) =>
      updateClanInfoOp(tx, adminCtx(), { name: 'Dòng họ Thử', settings: { surname: 'Thử' } }),
    );
    const doc = await withClanContext(clanId, (tx) => getClanInfoOp(tx, adminCtx()));
    expect(doc.ok).toBe(true);
    if (!doc.ok) return;
    expect(doc.value.name).toBe('Dòng họ Thử');
    expect(doc.value.settings.surname).toBe('Thử');
  });
});

describe('từ chối yêu cầu vào phả (story 5-5)', () => {
  it('từ chối rồi thì vắng khỏi hàng chờ, và người ấy XIN LẠI được', async () => {
    const acc = `s14-acc-tu-choi-${run}`;
    const nodeA = await insertPerson(`S14 Bị từ chối A ${run}`);
    const nodeB = await insertPerson(`S14 Bị từ chối B ${run}`);
    const adminCtx = ctx(adminAccountId, 'admin', adminPersonId);

    const xin = await withClanContext(clanId, (tx) =>
      requestAttachmentOp(tx, ctx(acc, 'guest'), { personId: nodeA }),
    );
    expect(xin.ok).toBe(true);
    const attId = xin.ok ? xin.value.attachmentId : '';

    const truoc = await withClanContext(clanId, (tx) => listPendingAttachmentsOp(tx, adminCtx));
    expect(truoc.ok && truoc.value.some((r) => r.attachmentId === attId)).toBe(true);

    const tuChoi = await withClanContext(clanId, (tx) =>
      rejectAttachmentOp(tx, adminCtx, { attachmentId: attId, note: 'nhận nhầm người' }),
    );
    expect(tuChoi.ok).toBe(true);

    const sau = await withClanContext(clanId, (tx) => listPendingAttachmentsOp(tx, adminCtx));
    expect(sau.ok && sau.value.some((r) => r.attachmentId === attId)).toBe(false);

    /**
     * ĐÂY là chỗ dễ vỡ nhất khi thêm một trạng thái: `attachment_account_clan_uq` là unique trên
     * (clanId, accountId), nên nếu hàng bị từ chối không được dùng lại thì người ấy bị khoá vĩnh
     * viễn khỏi phả — một lần từ chối hoá thành một lệnh cấm.
     */
    const xinLai = await withClanContext(clanId, (tx) =>
      requestAttachmentOp(tx, ctx(acc, 'guest'), { personId: nodeB }),
    );
    expect(xinLai.ok).toBe(true);
    expect(xinLai.ok && xinLai.value.attachmentId).toBe(attId); // đúng hàng cũ, không sinh hàng mới

    const lai = await withClanContext(clanId, (tx) => listPendingAttachmentsOp(tx, adminCtx));
    expect(lai.ok && lai.value.some((r) => r.attachmentId === attId)).toBe(true);
  });

  it('vai không đủ quyền thì không từ chối được', async () => {
    const acc = `s14-acc-tc2-${run}`;
    const node = await insertPerson(`S14 Bị từ chối C ${run}`);
    const xin = await withClanContext(clanId, (tx) =>
      requestAttachmentOp(tx, ctx(acc, 'guest'), { personId: node }),
    );
    const attId = xin.ok ? xin.value.attachmentId : '';

    const khach = await withClanContext(clanId, (tx) =>
      rejectAttachmentOp(tx, ctx(acc, 'guest'), { attachmentId: attId, note: 'thử' }),
    );
    expect(!khach.ok && khach.error.code === 'forbidden').toBe(true);
  });

  it('yêu cầu ĐÃ DUYỆT thì không từ chối được — gỡ gắn là việc khác', async () => {
    const acc = `s14-acc-tc3-${run}`;
    const node = await insertPerson(`S14 Đã duyệt ${run}`);
    const adminCtx = ctx(adminAccountId, 'admin', adminPersonId);
    const xin = await withClanContext(clanId, (tx) =>
      requestAttachmentOp(tx, ctx(acc, 'guest'), { personId: node }),
    );
    const attId = xin.ok ? xin.value.attachmentId : '';
    await withClanContext(clanId, (tx) => approveAttachmentOp(tx, adminCtx, { attachmentId: attId }));

    const tuChoi = await withClanContext(clanId, (tx) =>
      rejectAttachmentOp(tx, adminCtx, { attachmentId: attId, note: 'muộn rồi' }),
    );
    expect(!tuChoi.ok && tuChoi.error.code === 'conflict').toBe(true);
  });

  it('từ chối hai lần thì lần sau là conflict', async () => {
    const acc = `s14-acc-tc4-${run}`;
    const node = await insertPerson(`S14 Từ chối đúp ${run}`);
    const adminCtx = ctx(adminAccountId, 'admin', adminPersonId);
    const xin = await withClanContext(clanId, (tx) =>
      requestAttachmentOp(tx, ctx(acc, 'guest'), { personId: node }),
    );
    const attId = xin.ok ? xin.value.attachmentId : '';
    await withClanContext(clanId, (tx) =>
      rejectAttachmentOp(tx, adminCtx, { attachmentId: attId, note: 'lần một' }),
    );
    const lanHai = await withClanContext(clanId, (tx) =>
      rejectAttachmentOp(tx, adminCtx, { attachmentId: attId, note: 'lần hai' }),
    );
    expect(!lanHai.ok && lanHai.error.code === 'conflict').toBe(true);
  });
});

describe('FR-55 self-service', () => {
  it('updateSelfVisibility narrows the OWN node only — another node is forbidden and untouched', async () => {
    const adminCtx = ctx(adminAccountId, 'admin', adminPersonId);

    const done = await withClanContext(clanId, (tx) =>
      updateSelfVisibilityOp(tx, adminCtx, { personId: adminPersonId, hiddenFromPublic: true }),
    );
    expect(done.ok).toBe(true);
    await withClanContext(clanId, async (tx) => {
      const [p] = await tx.select().from(person).where(eq(person.id, adminPersonId));
      expect(p.hiddenFromPublic).toBe(true);
      expect(p.refusePrint).toBe(false); // untouched — patch is partial
      const revs = await tx
        .select()
        .from(revision)
        .where(eq(revision.entityId, adminPersonId));
      expect(revs.some((r) => r.action === 'update' && r.entity === 'person')).toBe(true); // AD-10
    });

    // Another living person's node: forbidden, and their columns stay put.
    const otherId = await insertPerson(`S14 Người Khác ${run}`);
    const denied = await withClanContext(clanId, (tx) =>
      updateSelfVisibilityOp(tx, adminCtx, { personId: otherId, hiddenFromPublic: true }),
    );
    expect(!denied.ok && denied.error.code === 'forbidden').toBe(true);
    await withClanContext(clanId, async (tx) => {
      const [p] = await tx.select().from(person).where(eq(person.id, otherId));
      expect(p.hiddenFromPublic).toBe(false);
    });

    // Unattached account: nothing to narrow.
    const unattached = await withClanContext(clanId, (tx) =>
      updateSelfVisibilityOp(tx, ctx(`s14-acc-loose-${run}`, 'guest'), { personId: adminPersonId, refusePrint: true }),
    );
    expect(!unattached.ok && unattached.error.code === 'unattached').toBe(true);
  });

  it('notifications: read own (bootstrap added-to-tree), mark seen idempotently, never someone else’s', async () => {
    const adminCtx = ctx(adminAccountId, 'admin', adminPersonId);

    const mine = await withClanContext(clanId, (tx) => getMyNotificationsOp(tx, adminCtx));
    expect(mine.ok).toBe(true);
    if (!mine.ok) return;
    const added = mine.value.find((n) => n.kind === 'added-to-tree');
    expect(added).toBeTruthy();
    expect(added!.seenAt).toBeNull();

    const seen = await withClanContext(clanId, (tx) =>
      markNotificationSeenOp(tx, adminCtx, { notificationId: added!.id }),
    );
    expect(seen.ok).toBe(true);
    const seenAgain = await withClanContext(clanId, (tx) =>
      markNotificationSeenOp(tx, adminCtx, { notificationId: added!.id }),
    );
    expect(seenAgain.ok).toBe(true); // idempotent
    if (seen.ok && seenAgain.ok) {
      expect(seenAgain.value.seenAt.getTime()).toBe(seen.value.seenAt.getTime());
    }

    // Someone else's notification reads as absent — not forbidden, ABSENT (no existence leak).
    const strangerCtx = ctx(member1AccountId, 'member', uuidv7());
    const notMine = await withClanContext(clanId, (tx) =>
      markNotificationSeenOp(tx, strangerCtx, { notificationId: added!.id }),
    );
    expect(!notMine.ok && notMine.error.code === 'not-found').toBe(true);
  });
});

describe('detachSelf', () => {
  it('removes the attachment, keeps the record in the revision log, and is not repeatable', async () => {
    const bhAcc = `s14-acc-bh-${run}`; // attached as branch-head in the approval test
    const detached = await withClanContext(clanId, (tx) => detachSelfOp(tx, ctx(bhAcc, 'branch-head')));
    expect(detached.ok).toBe(true);

    await withClanContext(clanId, async (tx) => {
      const rows = await tx.select().from(attachment).where(eq(attachment.accountId, bhAcc));
      expect(rows).toHaveLength(0);
      const revs = await tx.select().from(revision).where(eq(revision.accountId, bhAcc));
      expect(revs.some((r) => r.entity === 'attachment' && r.action === 'remove')).toBe(true); // AD-10/AD-4
    });

    const again = await withClanContext(clanId, (tx) => detachSelfOp(tx, ctx(bhAcc, 'guest')));
    expect(!again.ok && again.error.code === 'not-found').toBe(true);
  });
});

describe('malformed ids (Postgres 22P02)', () => {
  it('reads a non-uuid id as not-found rather than throwing a driver error', async () => {
    const bad = 'khong-phai-uuid';
    const someone = ctx(member1AccountId, 'member', adminPersonId);
    await withClanContext(clanId, async (tx) => {
      const requested = await requestAttachmentOp(tx, someone, { personId: bad });
      expect(!requested.ok && requested.error.code === 'not-found').toBe(true);

      const approved = await approveAttachmentOp(tx, ctx(adminAccountId, 'admin', adminPersonId), {
        attachmentId: bad,
      });
      expect(!approved.ok && approved.error.code === 'not-found').toBe(true);

      const seen = await markNotificationSeenOp(tx, someone, { notificationId: bad });
      expect(!seen.ok && seen.error.code === 'not-found').toBe(true);
    });
  });
});
