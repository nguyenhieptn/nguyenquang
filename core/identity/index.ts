/**
 * core/identity — adapter surface (AD-24: no identity parameters anywhere below).
 *
 * Account layer = Better Auth (`auth`, mounted at app/api/auth/[...all]); clan membership,
 * role, and privacy radius come from the vouched attachment (AD-8). Adapters import from
 * HERE — never from ./ops.
 */
export { resolveSession, resolveViewer } from './session';
export type { GuestContext, Role, SessionContext, ViewerContext } from './session';

/** Better Auth instance — for the app/api/auth/[...all] route handler. */
export { auth } from './ba';

export { soleClanId } from './clan-registry';

export {
  approveAttachment,
  detachAccount,
  detachSelf,
  listAttachments,
  listPendingAttachments,
  requestAttachment,
  rejectAttachment,
  setAttachmentRole,
} from './attachment';
export type { AttachmentRole, AttachmentRow, PendingAttachment } from './attachment';

export { getMyNotifications, markNotificationSeen, updateSelfVisibility } from './self';
export type { NotificationItem } from './self';

export {
  ANONYMOUS_LABEL,
  PRIVACY_RADIUS,
  fieldsFor,
  isMinor,
  visibilityFor,
} from './privacy';
export type { PrivacySubject, PrivacyViewer, Visibility } from './privacy';

export { getClanInfo, getMyAttachment, getMyPersonFlags, updateClanInfo } from './info';
export type { ClanInfo, ClanSettings, MyAttachment, MyPersonFlags } from './info';
/** Lens "ai NHÌN được trọn" (story 7-1) — cho `lib/vai-quan-tri.ts`, không cho adapter tự so vai. */
export { coQuyenDuyet } from './privacy';
