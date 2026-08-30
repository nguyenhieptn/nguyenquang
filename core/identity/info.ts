/**
 * Identity conveniences (gaps flagged by UI stories 2-2/2-9):
 *
 * - getClanInfo    — the site's public identity (clan name + settings). ANY viewer,
 *                    guests included (FR-11: xem không cần đăng ký). AD-14: nothing
 *                    Nguyễn-Quang-specific in code — it all comes from `clan.settings`.
 * - getMyAttachment — the OWN account's attachment in any status (pending banner on 2-2,
 *                    "đang chờ duyệt" state). Authenticated only.
 * - getMyPersonFlags — the FR-55 visibility flags on the OWN node (trang Tôi, 2-9).
 *
 * Ops take (tx, ctx) per the layering rule (build contract) and live here — NOT in ops.ts —
 * so this file stays a self-contained additive unit; the adapter surfaces below resolve the
 * session themselves (AD-24) and are re-exported by index.ts.
 */
import { eq } from 'drizzle-orm';
import { withClanContext, type Tx } from '@/db';
import { attachment, clan, person } from '@/db/schema';
import { err, ok, type Result } from '@/core/types';
import { writeRevision } from '@/core/revision';
import { resolveSession, resolveViewer } from './session';
import type { SessionContext, ViewerContext } from './session';
import type { AttachmentRole } from './ops';
import { gateWriter } from './gates';

export type ClanSettings = {
  surname?: string;
  middleName?: string;
  motto?: string;
  mottoPhonetic?: string;
};

export type ClanInfo = { name: string; settings: ClanSettings };

/** Đúng bốn khoá `getClanInfoOp` đọc. Thêm khoá thứ năm là sửa CẢ HAI chỗ — `tsc` gác hộ. */
const KHOA_SETTINGS: (keyof ClanSettings)[] = ['surname', 'middleName', 'motto', 'mottoPhonetic'];
/** Không cột nào giới hạn, mà mọi giá trị ở đây đều hiện trên trang chủ công khai. */
const DAI_TOI_DA = 200;

export type MyAttachment = {
  attachmentId: string;
  personId: string;
  personName: string;
  /**
   * `rejected` thêm 25/08/2026 (story 5-5). Bề mặt A PHẢI biết trạng thái này: nếu không, người
   * bị từ chối rơi lại vào luồng nhận chỗ như chưa từng xin, và luồng FR-64 vẫn đứt — chỉ đứt
   * theo một kiểu khác, im lặng hơn.
   */
  status: 'pending' | 'active' | 'rejected' | 'detached';
  role: AttachmentRole;
};

export type MyPersonFlags = { hiddenFromPublic: boolean; refusePrint: boolean };

// ── Ops (core-internal + tests) ──

export async function getClanInfoOp(tx: Tx, ctx: ViewerContext): Promise<Result<ClanInfo>> {
  const [row] = await tx.select().from(clan).where(eq(clan.id, ctx.clanId));
  if (!row) return err('not-found', 'Chưa dựng dữ liệu dòng họ.');
  const raw = (row.settings ?? {}) as Record<string, unknown>;
  const pick = (key: string): string | undefined =>
    typeof raw[key] === 'string' && raw[key] !== '' ? (raw[key] as string) : undefined;
  const settings: ClanSettings = {};
  const surname = pick('surname');
  const middleName = pick('middleName');
  const motto = pick('motto');
  const mottoPhonetic = pick('mottoPhonetic');
  if (surname !== undefined) settings.surname = surname;
  if (middleName !== undefined) settings.middleName = middleName;
  if (motto !== undefined) settings.motto = motto;
  if (mottoPhonetic !== undefined) settings.mottoPhonetic = mottoPhonetic;
  return ok({ name: row.name, settings });
}

/**
 * Ghi lại thông tin dòng họ — story 5-8, tiền đề mà bảng epic bỏ sót.
 *
 * ── Vì sao chỉ `admin` ───────────────────────────────────────────────────────────────────
 * Tên dòng họ và đề từ hiện trên **mọi màn của cả hai bề mặt**, kể cả trang chủ công khai. Trưởng
 * một chi không quyết chuyện của cả họ.
 *
 * ── Vì sao trộn Ở ĐÂY, không để màn gửi cả cụm ───────────────────────────────────────────
 * `settings` là một cột `jsonb`, không có cột riêng cho từng khoá. Nếu màn gửi lên cả cụm rồi ta
 * ghi đè, thì màn nào quên một khoá là khoá ấy biến mất — và "quên một khoá" là chuyện sẽ xảy ra
 * đúng lúc có người thêm khoá thứ năm. Trộn ở tầng ops thì mọi màn đều an toàn.
 *
 * Chuỗi rỗng ⇒ **XOÁ khoá**, không lưu `''`: `getClanInfoOp` ngay trên đây vốn đã coi `''` như
 * vắng, nên lưu `''` là để lại một giá trị mà chính hàm đọc không thừa nhận.
 */
export async function updateClanInfoOp(
  tx: Tx,
  ctx: SessionContext,
  args: { name?: string; settings?: Partial<ClanSettings> },
): Promise<Result<ClanInfo>> {
  if (ctx.role !== 'admin') {
    return err('forbidden', 'Chỉ quản trị mới sửa được thông tin dòng họ.');
  }

  /**
   * `FOR UPDATE` — khoá hàng cho tới hết transaction.
   *
   * Phép gộp dưới đây là ĐỌC-RỒI-GHI trên một blob JSON: đọc `settings`, trộn khoá mới vào, ghi
   * lại cả blob. Dưới READ COMMITTED, hai quản trị sửa hai khoá KHÁC nhau cùng lúc vẫn đọc cùng
   * một `truoc`, rồi người ghi sau đè mất khoá của người ghi trước — đúng cái mất mát mà phép gộp
   * này sinh ra để chặn, chỉ ở một tầng thấp hơn. Biểu mẫu chỉ gửi khoá đã sửa nên đã hẹp bớt
   * cửa, nhưng hẹp không phải là đóng.
   */
  const [row] = await tx.select().from(clan).where(eq(clan.id, ctx.clanId)).for('update');
  if (!row) return err('not-found', 'Chưa dựng dữ liệu dòng họ.');

  const ten = args.name?.trim();
  if (ten !== undefined && ten.length > DAI_TOI_DA) {
    return err('invalid', `Tên dòng họ dài quá ${DAI_TOI_DA} ký tự.`);
  }
  if (ten !== undefined && ten === '') {
    // Tên dòng họ KHÁC bốn khoá kia: nó không được trống, vì nó là tiêu đề của cả sản phẩm.
    return err('invalid', 'Dòng họ phải có tên.');
  }

  const truoc = (row.settings ?? {}) as Record<string, unknown>;
  const sau: Record<string, unknown> = { ...truoc };
  for (const [k, v] of Object.entries(args.settings ?? {})) {
    /**
     * Chỉ bốn khoá `getClanInfoOp` thật sự đọc (thêm 25/08 sau code review). Không whitelist thì
     * `settings` là một cái túi mở trên một hàng mà mọi trang đều đọc, và người gọi ghi được khoá
     * tuỳ ý vào đó mà không màn nào thấy.
     */
    if (!KHOA_SETTINGS.includes(k as keyof ClanSettings)) {
      return err('invalid', `Khoá "${k}" không thuộc sổ dòng họ.`);
    }
    /**
     * `undefined` nghĩa là KHÔNG GỬI, không phải "xoá" — và trước bản vá này hai thứ ấy lẫn nhau,
     * nên `{ motto: form.get('motto') ?? undefined }` xoá mất đề từ. Chỉ chuỗi RỖNG mới là lệnh
     * xoá; kiểu sai thì từ chối, chứ không lặng lẽ diễn thành xoá.
     */
    if (v === undefined) continue;
    if (typeof v !== 'string') return err('invalid', `Giá trị của "${k}" phải là chữ.`);
    const gonGang = v.trim();
    if (gonGang.length > DAI_TOI_DA) {
      return err('invalid', `Giá trị của "${k}" dài quá ${DAI_TOI_DA} ký tự.`);
    }
    if (gonGang === '') delete sau[k];
    else sau[k] = gonGang;
  }

  const tenMoi = ten ?? row.name;
  await tx.update(clan).set({ name: tenMoi, settings: sau }).where(eq(clan.id, ctx.clanId));
  await writeRevision(tx, {
    clanId: ctx.clanId,
    accountId: ctx.accountId,
    entity: 'clan',
    entityId: ctx.clanId,
    action: 'update',
    before: { name: row.name, settings: truoc },
    after: { name: tenMoi, settings: sau },
  });

  return getClanInfoOp(tx, ctx);
}

/** The own account's attachment row in ANY status; null when none was ever requested. */
export async function getMyAttachmentOp(
  tx: Tx,
  ctx: SessionContext,
): Promise<Result<MyAttachment | null>> {
  const [row] = await tx
    .select({
      attachmentId: attachment.id,
      personId: attachment.personId,
      personName: person.fullName,
      status: attachment.status,
      role: attachment.role,
    })
    .from(attachment)
    .innerJoin(person, eq(person.id, attachment.personId))
    .where(eq(attachment.accountId, ctx.accountId));
  return ok(row ?? null);
}

/** FR-55 flags — structurally own-node-only: the id comes from the session, never an argument. */
export async function getMyPersonFlagsOp(
  tx: Tx,
  ctx: SessionContext,
): Promise<Result<MyPersonFlags>> {
  const gate = gateWriter(ctx);
  if (!gate.ok) return gate;
  const [row] = await tx
    .select({ hiddenFromPublic: person.hiddenFromPublic, refusePrint: person.refusePrint })
    .from(person)
    .where(eq(person.id, gate.value.personId));
  if (!row) return err('not-found', 'Không thấy node của mình.');
  return ok(row);
}

// ── Adapter surfaces (AD-24: no identity parameters) ──

/** Clan name + settings — the site's public identity. Works for every viewer, guest included. */
export async function getClanInfo(): Promise<Result<ClanInfo>> {
  const viewer = await resolveViewer();
  if (!viewer) return err('unauthenticated', 'no session and no clan to view');
  return withClanContext(viewer.clanId, (tx) => getClanInfoOp(tx, viewer));
}

/**
 * Sửa thông tin dòng họ — AD-14: tên họ, chữ đệm, đề từ là DỮ LIỆU, nên phải sửa được như dữ liệu.
 *
 * Trước 25/08/2026 bốn giá trị này chỉ ghi được một lần, bởi `scripts/create-admin.ts`, lúc dựng
 * dòng họ. Sau đó đóng băng — đổi đề từ nghĩa là sửa `.ts` rồi dựng lại. Dữ liệu mà chỉ ghi được
 * bằng cách sửa mã thì nó chưa thật sự là dữ liệu.
 */
export async function updateClanInfo(args: {
  name?: string;
  settings?: Partial<ClanSettings>;
}): Promise<Result<ClanInfo>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'Cần đăng nhập.');
  return withClanContext(session.clanId, (tx) => updateClanInfoOp(tx, session, args));
}

/** The own account's attachment (pending or active), or null. Authenticated only. */
export async function getMyAttachment(): Promise<Result<MyAttachment | null>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'Cần đăng nhập.');
  return withClanContext(session.clanId, (tx) => getMyAttachmentOp(tx, session));
}

/** FR-55 visibility flags on the own node. Attached only. */
export async function getMyPersonFlags(): Promise<Result<MyPersonFlags>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'Cần đăng nhập.');
  // Cổng nằm trong ops (`gateWriter`) — surface không chép lại (story 7-1).
  return withClanContext(session.clanId, (tx) => getMyPersonFlagsOp(tx, session));
}
