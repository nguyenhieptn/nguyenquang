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
import { resolveSession, resolveViewer } from './session';
import type { SessionContext, ViewerContext } from './session';
import type { AttachmentRole } from './ops';

export type ClanSettings = {
  surname?: string;
  middleName?: string;
  motto?: string;
  mottoPhonetic?: string;
};

export type ClanInfo = { name: string; settings: ClanSettings };

export type MyAttachment = {
  attachmentId: string;
  personId: string;
  personName: string;
  status: 'pending' | 'active';
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
  if (!ctx.personId) return err('unattached', 'Chưa gắn với ai trong phả.');
  const [row] = await tx
    .select({ hiddenFromPublic: person.hiddenFromPublic, refusePrint: person.refusePrint })
    .from(person)
    .where(eq(person.id, ctx.personId));
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
  if (!session.personId)
    return err('unattached', 'Chưa gắn với ai trong phả nên chưa có gì để xem.');
  return withClanContext(session.clanId, (tx) => getMyPersonFlagsOp(tx, session));
}
