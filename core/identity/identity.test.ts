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
  detachAccountOp,
  detachSelfOp,
  getMyNotificationsOp,
  listAttachmentsOp,
  listPendingAttachmentsOp,
  rejectAttachmentOp,
  markNotificationSeenOp,
  requestAttachmentOp,
  setAttachmentRoleOp,
  updateSelfVisibilityOp,
} from './ops';

const owner = ownerPool();
const run = uuidv7().slice(0, 8);
const PW = 'S14!matkhau-thu';

const adminEmail = `s14-admin-${run}@test.local`;
const member1Email = `s14-member-${run}@test.local`;

let clanId: string;
/** Dòng họ tạm dựng thêm trong từng bài — dọn cùng lúc với `clanId` ở `afterAll`. */
const clanPhu: string[] = [];
const emailPhu: string[] = [];
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

  for (const cid of [clanId, ...clanPhu].filter(Boolean)) {
    await owner.query('BEGIN');
    await owner.query(`SET LOCAL app.clan_id = '${cid}'`);
    for (const tbl of ['notification', 'attachment', 'assertion', 'source', 'revision', 'person']) {
      await owner.query(`DELETE FROM "${tbl}" WHERE clan_id = $1`, [cid]);
    }
    await owner.query('DELETE FROM clan WHERE id = $1', [cid]);
    await owner.query('COMMIT');
  }
  // Identity rows (no RLS) — session/account cascade from user.
  await dbGlobal
    .delete(authUser)
    .where(inArray(authUser.email, [adminEmail, member1Email, ...emailPhu]));
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

  /**
   * Story 6-1 / việc A5 của retro Epic 5 — `--nam-sinh` của `scripts/create-admin.ts`.
   *
   * Không khai năm sinh thì node bootstrap chỉ có tên, và bộ nạp khung xếp dòng bảng tính của
   * chính người ấy là `nghi-trung` (`core/seed/ops.ts:110` — `yearsNear(1986, null)` là `false`),
   * rồi bỏ dòng, rồi `ten_cha` trên dòng ấy không bao giờ được đọc. Cây tách làm hai mảnh rời.
   * Đo được trên phả thật 25/08/2026 — đây là bài test giữ cho nó không quay lại.
   */
  it('khai năm sinh ⇒ có khẳng định birth và cột chiếu `person.birthDate` — thứ bộ nạp khung so', async () => {
    const clanRieng = uuidv7();
    await withClanContext(clanRieng, async (tx) => {
      await tx.insert(clan).values({ id: clanRieng, name: 'S14 Clan Nam Sinh' });
    });
    clanPhu.push(clanRieng);
    const emailRieng = `s14-nam-sinh-${run}@test.local`;
    emailPhu.push(emailRieng);

    const ad = await createAdmin({
      clanId: clanRieng,
      email: emailRieng,
      password: PW,
      name: 'S14 Người Có Năm Sinh',
      birthYear: 1986,
    });

    await withClanContext(clanRieng, async (tx) => {
      const claims = await tx.select().from(assertion).where(eq(assertion.subjectPersonId, ad.personId));
      // Hai khẳng định, cùng MỘT nguồn: năm sinh đi cùng đường với tên, không có lối tắt.
      expect(claims).toHaveLength(2);
      expect(new Set(claims.map((c) => c.kind))).toEqual(new Set(['name', 'birth']));
      expect(new Set(claims.map((c) => c.sourceId)).size).toBe(1);
      // AD-9: tồn nghi, kể cả người quản trị đầu tiên.
      expect(claims.every((c) => c.tier === 'tentative')).toBe(true);

      const [p] = await tx.select().from(person).where(eq(person.id, ad.personId));
      // Đây là cột `previewSeedOp` đọc để so năm sinh. Không có nó thì cây gãy đôi.
      expect(p.birthDate).toBe('1986-01-01');
      expect(p.birthTier).toBe('tentative');
    });
  });

  /**
   * Hồi quy cho code review 6-1 — cờ `--nam-sinh` phải chữa được ĐÚNG CA nó sinh ra để chữa.
   *
   * Bản trước `createAdmin` trả sớm khi tài khoản đã có attachment `active`, trước mọi dòng đụng
   * `birthYear`. Nghĩa là: quản trị đã tồn tại, cây đã gãy đôi vì node ấy thiếu năm sinh, người
   * vận hành chạy lại script kèm cờ — và nhận exit 0 cùng một câu bình thản, không một khẳng
   * định `birth` nào được ghi.
   */
  it('chạy lại với --nam-sinh trên tài khoản ĐÃ CÓ ⇒ ghi bổ sung năm sinh, không bỏ lặng lẽ', async () => {
    const clanRieng = uuidv7();
    await withClanContext(clanRieng, async (tx) => {
      await tx.insert(clan).values({ id: clanRieng, name: 'S14 Clan Chay Lai' });
    });
    clanPhu.push(clanRieng);
    const emailRieng = `s14-chay-lai-${run}@test.local`;
    emailPhu.push(emailRieng);

    // Lượt đầu KHÔNG khai năm sinh — đúng cách phả thật đã được dựng.
    const lan1 = await createAdmin({
      clanId: clanRieng,
      email: emailRieng,
      password: PW,
      name: 'S14 Người Chạy Lại',
    });
    await withClanContext(clanRieng, async (tx) => {
      const [p] = await tx.select().from(person).where(eq(person.id, lan1.personId));
      expect(p.birthDate).toBeNull();
    });

    const lan2 = await createAdmin({
      clanId: clanRieng,
      email: emailRieng,
      password: PW,
      name: 'S14 Người Chạy Lại',
      birthYear: 1986,
    });
    expect(lan2.created).toBe(false);
    expect(lan2.personId).toBe(lan1.personId); // vẫn đúng người ấy, không đẻ bản trùng
    expect(lan2.birthYearApplied).toBe(true);

    await withClanContext(clanRieng, async (tx) => {
      const [p] = await tx.select().from(person).where(eq(person.id, lan1.personId));
      expect(p.birthDate).toBe('1986-01-01');
    });

    // Lượt ba: đã có năm sinh rồi thì KHÔNG ghi đè — hai giá trị đơn trị là việc của người duyệt
    // ở bàn làm việc (AD-9), không phải của một script vận hành.
    const lan3 = await createAdmin({
      clanId: clanRieng,
      email: emailRieng,
      password: PW,
      name: 'S14 Người Chạy Lại',
      birthYear: 1990,
    });
    expect(lan3.birthYearApplied).toBe(false);
    await withClanContext(clanRieng, async (tx) => {
      const [p] = await tx.select().from(person).where(eq(person.id, lan1.personId));
      expect(p.birthDate).toBe('1986-01-01');
    });
  });

  it('không khai năm sinh ⇒ vẫn đúng một khẳng định tên, không tự bịa năm nào', async () => {
    await withClanContext(clanId, async (tx) => {
      const [p] = await tx.select().from(person).where(eq(person.id, adminPersonId));
      expect(p.birthDate).toBeNull();
    });
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

/**
 * Story 6-2 — trao/hạ vai và gỡ gắn. Hai hàng rào ở đây là AN TOÀN, không phải tiện nghi: hạ vai
 * quản trị cuối cùng là khoá cả dòng họ ra khỏi bàn quản trị, và không đường nào trong sản phẩm
 * mở lại được.
 */
describe('vai và gỡ gắn (story 6-2)', () => {
  /** Dựng một gắn kết `active` mới cho một người mới, trả về id gắn kết. */
  const dungGanKet = async (
    ten: string,
    accountId: string,
    vai: 'admin' | 'branch-head' | 'member' = 'member',
  ): Promise<{ attachmentId: string; personId: string }> =>
    withClanContext(clanId, async (tx) => {
      const personId = uuidv7();
      await tx.insert(person).values({ id: personId, clanId, fullName: ten, nameFolded: ten.toLowerCase() });
      const attachmentId = uuidv7();
      await tx.insert(attachment).values({
        id: attachmentId,
        clanId,
        accountId,
        personId,
        role: vai,
        status: 'active',
      });
      return { attachmentId, personId };
    });

  it('chỉ quản trị đổi được vai; đầu mối chi và thành viên bị chặn', async () => {
    const { attachmentId } = await dungGanKet('S62 Bị Đổi Vai', `s62-a-${run}`);
    for (const vai of ['branch-head', 'member'] as const) {
      const r = await withClanContext(clanId, (tx) =>
        setAttachmentRoleOp(tx, ctx(`s62-ke-${run}`, vai), { attachmentId, role: 'admin' }),
      );
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('forbidden');
    }
  });

  it('đổi vai KHÔNG đụng vouchedBy, personId hay status; và ghi một revision', async () => {
    const { attachmentId, personId } = await dungGanKet('S62 Lên Đầu Mối', `s62-b-${run}`);
    await withClanContext(clanId, (tx) =>
      tx.update(attachment).set({ vouchedByAttachmentId: attachmentId }).where(eq(attachment.id, attachmentId)),
    );
    const r = await withClanContext(clanId, (tx) =>
      setAttachmentRoleOp(tx, ctx(adminAccountId, 'admin', adminPersonId), {
        attachmentId,
        role: 'branch-head',
      }),
    );
    expect(r.ok).toBe(true);
    await withClanContext(clanId, async (tx) => {
      const [sau] = await tx.select().from(attachment).where(eq(attachment.id, attachmentId));
      expect(sau!.role).toBe('branch-head');
      expect(sau!.status).toBe('active');
      expect(sau!.personId).toBe(personId);
      expect(sau!.vouchedByAttachmentId).toBe(attachmentId); // dấu vết bảo lãnh còn nguyên
      const nk = await tx.select().from(revision).where(eq(revision.entityId, attachmentId));
      expect(nk.some((x) => x.note === 'đổi vai')).toBe(true);
    });
  });

  it('KHÔNG tự hạ vai của chính mình, kể cả khi còn quản trị khác', async () => {
    const accountId = `s62-c-${run}`;
    const { attachmentId } = await dungGanKet('S62 Tự Hạ Mình', accountId, 'admin');
    const r = await withClanContext(clanId, (tx) =>
      setAttachmentRoleOp(tx, ctx(accountId, 'admin'), { attachmentId, role: 'member' }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('conflict');
  });

  /**
   * HỒI QUY 27/08 — bài này TRƯỚC ĐÂY dựng một ctx `role: 'admin'` KHÔNG có gắn kết nào, tức một
   * trạng thái **sản phẩm không tạo ra được**: `resolveSessionImpl` lấy `role` chỉ từ một gắn kết
   * `active`. Bài xanh và chứng minh không gì cả.
   *
   * Sự thật code review chỉ ra: trong `setAttachmentRoleOp` và `detachAccountOp`, hàng rào ấy
   * KHÔNG BAO GIỜ chạy được — người bấm luôn được đếm, và phép kiểm "chính mình" đứng trước nên
   * target luôn là một admin khác ⇒ đếm luôn ≥ 2. Giữ chúng làm lớp phòng thủ thứ hai; còn bài
   * test thì phải chạy trên cửa THẬT: `detachSelfOp`.
   */
  it('quản trị DUY NHẤT không tự gỡ được — cửa thật tới 0 quản trị', async () => {
    const clanRieng = uuidv7();
    clanPhu.push(clanRieng);
    const accountId = `s62-mot-minh-${run}`;
    const personId = uuidv7();
    await withClanContext(clanRieng, async (tx) => {
      await tx.insert(clan).values({ id: clanRieng, name: 'S62 Một Quản Trị' });
      await tx.insert(person).values({
        id: personId,
        clanId: clanRieng,
        fullName: 'S62 Duy Nhất',
        nameFolded: 's62 duy nhat',
      });
      await tx.insert(attachment).values({
        id: uuidv7(),
        clanId: clanRieng,
        accountId,
        personId,
        role: 'admin',
        status: 'active',
      });
    });
    // Phiên thật của một gắn kết đang hoạt động mang đúng `personId` của gắn kết ấy (story 7-1).
    const minh: SessionContext = { accountId, clanId: clanRieng, personId, role: 'admin' };

    const tuGo = await withClanContext(clanRieng, (tx) => detachSelfOp(tx, minh));
    expect(tuGo.ok).toBe(false);
    if (!tuGo.ok) expect(tuGo.error.message).toMatch(/quản trị duy nhất/);

    // Và hàng vẫn còn — không bị xoá nửa chừng.
    await withClanContext(clanRieng, async (tx) => {
      const con = await tx.select().from(attachment).where(eq(attachment.accountId, accountId));
      expect(con).toHaveLength(1);
      expect(con[0]!.status).toBe('active');
    });

    // Có quản trị thứ hai thì tự gỡ được.
    await withClanContext(clanRieng, async (tx) => {
      const p2 = uuidv7();
      await tx.insert(person).values({ id: p2, clanId: clanRieng, fullName: 'S62 Thứ Hai', nameFolded: 's62 thu hai' });
      await tx.insert(attachment).values({
        id: uuidv7(),
        clanId: clanRieng,
        accountId: `s62-thu-hai-${run}`,
        personId: p2,
        role: 'admin',
        status: 'active',
      });
    });
    const lai = await withClanContext(clanRieng, (tx) => detachSelfOp(tx, minh));
    expect(lai.ok).toBe(true);
  });

  it('không đổi được vai của gắn kết chưa hoạt động', async () => {
    const { attachmentId } = await dungGanKet('S62 Còn Chờ', `s62-d-${run}`);
    await withClanContext(clanId, (tx) =>
      tx.update(attachment).set({ status: 'pending' }).where(eq(attachment.id, attachmentId)),
    );
    const r = await withClanContext(clanId, (tx) =>
      setAttachmentRoleOp(tx, ctx(adminAccountId, 'admin', adminPersonId), { attachmentId, role: 'admin' }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('conflict');
  });

  /** AD-4: hàng ở lại, `status` đổi, lý do vào nhật ký — khác `detachSelfOp` vốn xoá hàng. */
  it('gỡ gắn GIỮ hàng, đổi status, ghi lý do; và người bị gỡ xin lại được', async () => {
    const accountId = `s62-e-${run}`;
    const { attachmentId, personId } = await dungGanKet('S62 Bị Gỡ', accountId);
    const r = await withClanContext(clanId, (tx) =>
      detachAccountOp(tx, ctx(adminAccountId, 'admin', adminPersonId), {
        attachmentId,
        note: 'nhận nhầm node',
      }),
    );
    expect(r.ok).toBe(true);
    await withClanContext(clanId, async (tx) => {
      const [sau] = await tx.select().from(attachment).where(eq(attachment.id, attachmentId));
      expect(sau).toBeTruthy(); // KHÔNG xoá
      expect(sau!.status).toBe('detached');
      const nk = await tx.select().from(revision).where(eq(revision.entityId, attachmentId));
      expect(nk.some((x) => (x.note ?? '').includes('nhận nhầm node'))).toBe(true);
    });

    // Xin lại: `requestAttachmentOp` dùng lại chính hàng ấy vì nó không `active`.
    const xin = await withClanContext(clanId, (tx) =>
      requestAttachmentOp(tx, ctx(accountId, 'member'), { personId }),
    );
    expect(xin.ok).toBe(true);
    if (xin.ok) expect(xin.value.attachmentId).toBe(attachmentId);
  });

  it('gỡ gắn đòi một dòng lý do, và không tự gỡ chính mình', async () => {
    const accountId = `s62-f-${run}`;
    const { attachmentId } = await dungGanKet('S62 Lý Do Rỗng', accountId);
    const rong = await withClanContext(clanId, (tx) =>
      detachAccountOp(tx, ctx(adminAccountId, 'admin', adminPersonId), { attachmentId, note: '   ' }),
    );
    expect(rong.ok).toBe(false);
    if (!rong.ok) expect(rong.error.code).toBe('invalid');

    const tuGo = await withClanContext(clanId, (tx) =>
      detachAccountOp(tx, ctx(accountId, 'admin'), { attachmentId, note: 'tự gỡ' }),
    );
    expect(tuGo.ok).toBe(false);
    if (!tuGo.ok) expect(tuGo.error.code).toBe('conflict');
  });

  it('danh sách gắn kết: cùng cổng quyền với hàng chờ, và bày CẢ hàng không active', async () => {
    const khach = await withClanContext(clanId, (tx) => listAttachmentsOp(tx, ctx(`s62-g-${run}`, 'member')));
    expect(khach.ok).toBe(false);
    if (!khach.ok) expect(khach.error.code).toBe('forbidden');

    // Hàng gỡ RIÊNG cho bài này: hàng của bài trên đã quay về `pending` vì chính bài ấy cho
    // người bị gỡ xin lại — đúng hành vi, nhưng không dùng làm mẫu ở đây được.
    const { attachmentId } = await dungGanKet('S62 Gỡ Rồi Để Yên', `s62-h-${run}`);
    await withClanContext(clanId, (tx) =>
      detachAccountOp(tx, ctx(adminAccountId, 'admin', adminPersonId), {
        attachmentId,
        note: 'để yên cho bài danh sách',
      }),
    );

    const ds = await withClanContext(clanId, (tx) =>
      listAttachmentsOp(tx, ctx(adminAccountId, 'admin', adminPersonId)),
    );
    expect(ds.ok).toBe(true);
    if (!ds.ok) return;
    // Hàng đã gỡ phải CÒN trong danh sách — đó là điểm khác với danh sách hàng chờ.
    expect(ds.value.find((r) => r.attachmentId === attachmentId)?.status).toBe('detached');
    expect(ds.value.every((r) => r.personName.length > 0)).toBe(true);
  });

  it('cổng quyền của detachAccountOp: branch-head, member, guest đều bị chặn', async () => {
    const { attachmentId } = await dungGanKet('S62 Cổng Gỡ', `s62-i-${run}`);
    for (const vai of ['branch-head', 'member'] as const) {
      const r = await withClanContext(clanId, (tx) =>
        detachAccountOp(tx, ctx(`s62-ke2-${run}`, vai), { attachmentId, note: 'thử' }),
      );
      expect(r.ok, `vai ${vai} phải bị chặn`).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('forbidden');
    }
    const khach = await withClanContext(clanId, (tx) =>
      detachAccountOp(tx, ctx(`s62-khach-${run}`, 'guest'), { attachmentId, note: 'thử' }),
    );
    expect(khach.ok).toBe(false);

    // Cùng ca ấy cho hai phép còn lại — `guest` trước đây không xuất hiện ở bài nào.
    const doi = await withClanContext(clanId, (tx) =>
      setAttachmentRoleOp(tx, ctx(`s62-khach-${run}`, 'guest'), { attachmentId, role: 'admin' }),
    );
    expect(doi.ok).toBe(false);
    const ds = await withClanContext(clanId, (tx) =>
      listAttachmentsOp(tx, ctx(`s62-khach-${run}`, 'guest')),
    );
    expect(ds.ok).toBe(false);
  });

  it('gắn kết `rejected` hay `detached` thì không đổi vai và không gỡ được', async () => {
    for (const tt of ['rejected', 'detached'] as const) {
      const { attachmentId } = await dungGanKet(`S62 Trạng Thái ${tt}`, `s62-${tt}-${run}`);
      await withClanContext(clanId, (tx) =>
        tx.update(attachment).set({ status: tt }).where(eq(attachment.id, attachmentId)),
      );
      const doi = await withClanContext(clanId, (tx) =>
        setAttachmentRoleOp(tx, ctx(adminAccountId, 'admin', adminPersonId), { attachmentId, role: 'admin' }),
      );
      expect(doi.ok, `đổi vai hàng ${tt}`).toBe(false);
      const go = await withClanContext(clanId, (tx) =>
        detachAccountOp(tx, ctx(adminAccountId, 'admin', adminPersonId), { attachmentId, note: 'thử' }),
      );
      expect(go.ok, `gỡ hàng ${tt}`).toBe(false);
    }
  });

  /**
   * `detached` là trạng thái thứ tư, và hai op cũ liệt kê tường minh ba trạng thái cũ — nên nó
   * suýt rơi thẳng qua. Một đầu mối chi phục hồi được gắn kết mà quản trị vừa gỡ.
   */
  it('hàng đã GỠ không duyệt lại và không từ chối được — kể cả bởi đầu mối chi', async () => {
    const { attachmentId } = await dungGanKet('S62 Gỡ Rồi Duyệt Lại', `s62-j-${run}`);
    await withClanContext(clanId, (tx) =>
      detachAccountOp(tx, ctx(adminAccountId, 'admin', adminPersonId), {
        attachmentId,
        note: 'gỡ để thử',
      }),
    );
    const duyet = await withClanContext(clanId, (tx) =>
      approveAttachmentOp(tx, ctx(`s62-dauMoi-${run}`, 'branch-head'), { attachmentId }),
    );
    expect(duyet.ok).toBe(false);
    if (!duyet.ok) expect(duyet.error.code).toBe('conflict');

    const tuChoi = await withClanContext(clanId, (tx) =>
      rejectAttachmentOp(tx, ctx(`s62-dauMoi-${run}`, 'branch-head'), { attachmentId, note: 'x' }),
    );
    expect(tuChoi.ok).toBe(false);
  });

  it('gỡ gắn HẠ vai về member — hàng đã gỡ không được mang lời khai `admin`', async () => {
    const { attachmentId } = await dungGanKet('S62 Admin Bị Gỡ', `s62-k-${run}`, 'admin');
    const r = await withClanContext(clanId, (tx) =>
      detachAccountOp(tx, ctx(adminAccountId, 'admin', adminPersonId), {
        attachmentId,
        note: 'thôi làm quản trị',
      }),
    );
    expect(r.ok).toBe(true);
    await withClanContext(clanId, async (tx) => {
      const [sau] = await tx.select().from(attachment).where(eq(attachment.id, attachmentId));
      expect(sau!.role).toBe('member');
      // Vai cũ không mất — nó nằm trong `before` của revision.
      const nk = await tx.select().from(revision).where(eq(revision.entityId, attachmentId));
      expect(JSON.stringify(nk.map((x) => x.before))).toMatch(/admin/);
    });
  });
});
