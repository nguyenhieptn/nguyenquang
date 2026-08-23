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
  detachSelf,
  listPendingAttachments,
  requestAttachment,
} from './attachment';
export type { AttachmentRole, PendingAttachment } from './attachment';

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

export { getClanInfo, getMyAttachment, getMyPersonFlags } from './info';
export type { ClanInfo, ClanSettings, MyAttachment, MyPersonFlags } from './info';
