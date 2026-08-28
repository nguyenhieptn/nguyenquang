/**
 * Domain schema — Gia phả Nguyễn Quang, Đợt 1.
 *
 * Bound by ARCHITECTURE-SPINE.md. The load-bearing decisions, so nobody re-derives them:
 *
 * - AD-6  every PK is UUIDv7 — opaque, no positional meaning. Generated in code (uuid v7),
 *         not by the database, so inserts inside app transactions stay one round-trip.
 * - AD-5  NO generation column, NO branch-code column, NO materialized path — anywhere.
 * - AD-7  every clan-partitioned table carries `clanId` + RLS policy (db/migrations/0001_rls.sql).
 * - AD-2/AD-18  `person` holds projected display values; `assertion` holds the live claims,
 *         including parent-child ("A is child of B") — there is NO plain parent_child table.
 * - AD-14 nothing Nguyễn-Quang-specific here; clan particulars live in `clan.settings` (data).
 *
 * Projected values on person: the PRD makes tentative data visible immediately (FR-3), so the
 * tree must render people whose every claim is still tentative. Each projected value therefore
 * carries its tier ('official' | 'tentative' — FR-2's three confidence levels live on the
 * assertion; the projection keeps only the two-tier read shortcut plus the leading assertion id).
 * Sole writer of these columns is core/assertion (AD-19).
 */
import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/** Genealogical date = value + precision (Consistency Conventions). Never a bare guess. */
export const DATE_PRECISIONS = ['exact', 'year', 'approximate', 'unknown'] as const;
export type DatePrecision = (typeof DATE_PRECISIONS)[number];

/** FR-2 three confidence levels, carried by assertions. */
export const CONFIDENCES = ['chac-chan', 'theo-loi-ke', 'ton-nghi'] as const;
export type Confidence = (typeof CONFIDENCES)[number];

/** FR-3 two tiers. Everything enters tentative (AD-9); promotion is a status change. */
export const TIERS = ['tentative', 'official'] as const;
export type Tier = (typeof TIERS)[number];

export const ASSERTION_KINDS = [
  'name', // value: { fullName, otherNames?, hanNom?, phonetic? }
  'gender', // value: { gender: 'male'|'female'|'other' }
  'birth', // value: { date?: 'YYYY-MM-DD', precision: DatePrecision }
  'death', // value: { date?, precision, isLiving?: false } — absence of death ≠ living claim
  'parent-child', // subject = CHILD, objectPersonId = PARENT. value: { relation: 'blood'|'adopted'|'heir' }
  'union-partner', // subject = person, unionId set. value: { role?: 'chinh-pha'|'ngoai-pha' }
  'note', // value: { text }
  // FR-65 (story 5-7): placeId trỏ vào `place`. value: { role: 'que-quan'|'tru-quan'|'an-tang' }
  'place',
] as const;
export type AssertionKind = (typeof ASSERTION_KINDS)[number];

export const ASSERTION_STATUSES = ['live', 'hidden'] as const; // AD-17: hidden-first on report

export const clan = pgTable('clan', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  /** AD-14: surname, fixed middle name, motto, phàm lệ defaults — data, not code. */
  settings: jsonb('settings').notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * FR-65 — nơi chốn là một THỰC THỂ, không phải chữ tự do.
 *
 * `parentUnit` là thứ DUY NHẤT phân biệt hai "Quang Trung" (Định Hoá vs Vũng Tàu). Nó không phải
 * trang trí, nên nó nằm trên bảng chứ không nhét vào một cột ghi chú.
 *
 * `*Folded` là AD-16: mọi so khớp tên đi qua bản đã gấp dấu, tên gốc giữ nguyên dấu.
 * `mergedInto` là AD-3, dựng sẵn cho việc gộp (chưa làm ở 5-7 — xem deferred-work.md).
 */
export const place = pgTable(
  'place',
  {
    id: uuid('id').primaryKey(),
    clanId: uuid('clan_id')
      .notNull()
      .references(() => clan.id),
    name: text('name').notNull(),
    nameFolded: text('name_folded').notNull(),
    /** Đơn vị hành chính cha: "Định Hoá, Thái Nguyên". Trống là hợp lệ (FR-65). */
    parentUnit: text('parent_unit').notNull().default(''),
    parentUnitFolded: text('parent_unit_folded').notNull().default(''),
    mergedInto: uuid('merged_into'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('place_folded_idx').on(t.clanId, t.nameFolded),
    /**
     * Ràng buộc THẬT cho phép chống trùng của FR-65. Phép so trong `addPlaceOps` là đọc-rồi-ghi,
     * nên hai người tạo cùng lúc đều lọt qua nó; chỉ chỉ mục này mới chặn được (vá 25/08).
     */
    uniqueIndex('place_folded_uq').on(t.clanId, t.nameFolded, t.parentUnitFolded),
  ],
);

export const person = pgTable(
  'person',
  {
    id: uuid('id').primaryKey(),
    clanId: uuid('clan_id')
      .notNull()
      .references(() => clan.id),

    /** AD-3 tombstone: set → this row redirects to the merge winner. */
    mergedInto: uuid('merged_into'),

    // ── Projected display values (written ONLY by core/assertion — AD-19) ──
    fullName: text('full_name').notNull().default(''),
    /** Diacritic-folded, lowercased copy for AD-16 lookups. Maintained on write, not derived from tree. */
    nameFolded: text('name_folded').notNull().default(''),
    nameTier: text('name_tier').$type<Tier>(),
    nameConfidence: text('name_confidence').$type<Confidence>(),
    gender: text('gender').$type<'male' | 'female' | 'other'>(),
    genderTier: text('gender_tier').$type<Tier>(),
    birthDate: date('birth_date'),
    birthPrecision: text('birth_precision').$type<DatePrecision>(),
    birthTier: text('birth_tier').$type<Tier>(),
    deathDate: date('death_date'),
    deathPrecision: text('death_precision').$type<DatePrecision>(),
    deathTier: text('death_tier').$type<Tier>(),
    /** Living until a death claim lands (or an explicit living=false). Privacy defaults hang on this. */
    isLiving: boolean('is_living').notNull().default(true),

    // ── FR-55 rights of the living (subject's own choices; may only narrow — AD-13) ──
    hiddenFromPublic: boolean('hidden_from_public').notNull().default(false),
    refusePrint: boolean('refuse_print').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('person_clan_idx').on(t.clanId),
    index('person_name_folded_idx').on(t.clanId, t.nameFolded),
    index('person_merged_into_idx').on(t.mergedInto),
  ],
);

/** FR-1: the unit of data is a sourced claim about a person. */
export const source = pgTable(
  'source',
  {
    id: uuid('id').primaryKey(),
    clanId: uuid('clan_id')
      .notNull()
      .references(() => clan.id),
    kind: text('kind').$type<'self' | 'told-by' | 'document' | 'recording' | 'seed-import'>().notNull(),
    description: text('description').notNull().default(''),
    /** kind 'told-by': who told it. kind 'recording': which recording it came from. */
    toldByPersonId: uuid('told_by_person_id').references(() => person.id),
    recordingId: uuid('recording_id'),
    createdByAccountId: text('created_by_account_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('source_clan_idx').on(t.clanId)],
);

/** Marriage/partnership — separate entity (see spine § Structural Seed for the three reasons). */
export const union = pgTable(
  'union',
  {
    id: uuid('id').primaryKey(),
    clanId: uuid('clan_id')
      .notNull()
      .references(() => clan.id),
    kind: text('kind').$type<'marriage' | 'partnership'>().notNull().default('marriage'),
    note: text('note').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('union_clan_idx').on(t.clanId)],
);

/**
 * The live claim set (AD-2). A claim that loses leaves this table and lives on in `revision`
 * (AD-4). Parent-child and union membership are assertions like any other (AD-18).
 */
export const assertion = pgTable(
  'assertion',
  {
    id: uuid('id').primaryKey(),
    clanId: uuid('clan_id')
      .notNull()
      .references(() => clan.id),
    subjectPersonId: uuid('subject_person_id')
      .notNull()
      .references(() => person.id),
    kind: text('kind').$type<AssertionKind>().notNull(),
    /** parent-child: the PARENT. Distance walks (AD-13) read this. */
    objectPersonId: uuid('object_person_id').references(() => person.id),
    /** union-partner: the union joined. */
    unionId: uuid('union_id').references(() => union.id),
    /** kind 'place' (FR-65): which place. Meaningless for every other kind. */
    placeId: uuid('place_id').references(() => place.id),
    value: jsonb('value').notNull().default(sql`'{}'::jsonb`),
    sourceId: uuid('source_id')
      .notNull()
      .references(() => source.id),
    confidence: text('confidence').$type<Confidence>().notNull().default('ton-nghi'),
    tier: text('tier').$type<Tier>().notNull().default('tentative'),
    status: text('status').$type<'live' | 'hidden'>().notNull().default('live'),
    createdByAccountId: text('created_by_account_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    promotedAt: timestamp('promoted_at', { withTimezone: true }),
    promotedByAccountId: text('promoted_by_account_id'),
  },
  (t) => [
    index('assertion_clan_idx').on(t.clanId),
    index('assertion_subject_idx').on(t.subjectPersonId, t.kind),
    index('assertion_object_idx').on(t.objectPersonId),
    index('assertion_union_idx').on(t.unionId),
  ],
);

/**
 * AD-8: an account is not a person. This is the vouched act that binds one to a clan node.
 * Roles bind here (per node, per clan) — never to the account.
 */
export const attachment = pgTable(
  'attachment',
  {
    id: uuid('id').primaryKey(),
    clanId: uuid('clan_id')
      .notNull()
      .references(() => clan.id),
    accountId: text('account_id').notNull(),
    personId: uuid('person_id')
      .notNull()
      .references(() => person.id),
    role: text('role').$type<'admin' | 'branch-head' | 'member'>().notNull().default('member'),
    /**
     * `rejected` thêm 25/08/2026 (story 5-5). Hàng bị từ chối GIỮ LẠI, không xoá — cùng tinh
     * thần AD-4: thứ từng được ghi thì không rời khỏi sổ. Và vì `requestAttachmentOp` đã có
     * nhánh "hàng cũ không `active` thì dùng lại, đặt về `pending`", người bị từ chối vẫn xin
     * lại được mà không vướng `attachment_account_clan_uq`.
     */
    /**
     * `detached` thêm 27/08/2026 (story 6-2). Quản trị GỠ một gắn kết đang hoạt động là chuyện
     * khác hẳn TỪ CHỐI một yêu cầu chưa bao giờ được nhận — gộp hai thứ vào `rejected` là màn
     * Tài khoản nói sai về một người thật. Hàng vẫn ở lại (cùng lẽ với `rejected`), và
     * `requestAttachmentOp` vẫn cho người ấy xin lại vì nhánh dùng-lại chỉ hỏi "không phải
     * active".
     */
    status: text('status')
      .$type<'pending' | 'active' | 'rejected' | 'detached'>()
      .notNull()
      .default('pending'),
    vouchedByAttachmentId: uuid('vouched_by_attachment_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('attachment_account_clan_uq').on(t.clanId, t.accountId),
    index('attachment_person_idx').on(t.personId),
  ],
);

/** FR-47/FR-49. Bytes live in object storage (AD-11); this row is the handle + consent. */
export const recording = pgTable(
  'recording',
  {
    id: uuid('id').primaryKey(),
    clanId: uuid('clan_id')
      .notNull()
      .references(() => clan.id),
    toldByPersonId: uuid('told_by_person_id').references(() => person.id),
    recordedByAccountId: text('recorded_by_account_id').notNull(),
    recordedOn: date('recorded_on').notNull(),
    durationSeconds: integer('duration_seconds'),
    storageKey: text('storage_key').notNull(),
    mimeType: text('mime_type').notNull(),
    /** FR-49 teller-chosen access tier. AD-12: enforced in core at read time. */
    accessTier: text('access_tier').$type<'public' | 'admin' | 'sealed'>().notNull().default('admin'),
    sealedUntil: date('sealed_until'),
    /** FR-49 right of withdrawal — survives the teller's death. Withdrawn ⇒ no playback for anyone. */
    withdrawnAt: timestamp('withdrawn_at', { withTimezone: true }),
    title: text('title').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('recording_clan_idx').on(t.clanId)],
);

/** "nói về ai" — one row per person a recording speaks about. */
export const recordingSubject = pgTable(
  'recording_subject',
  {
    id: uuid('id').primaryKey(),
    clanId: uuid('clan_id')
      .notNull()
      .references(() => clan.id),
    recordingId: uuid('recording_id')
      .notNull()
      .references(() => recording.id),
    personId: uuid('person_id')
      .notNull()
      .references(() => person.id),
  },
  (t) => [
    uniqueIndex('recording_subject_uq').on(t.recordingId, t.personId),
    index('recording_subject_person_idx').on(t.personId),
  ],
);

/**
 * AD-10: written in the SAME transaction as every mutation, by the core. History with holes
 * makes point-in-time reconstruction lie and un-merge impossible — so a write path that can
 * succeed without a row here is a defect, not a style issue.
 */
export const revision = pgTable(
  'revision',
  {
    id: uuid('id').primaryKey(),
    clanId: uuid('clan_id')
      .notNull()
      .references(() => clan.id),
    accountId: text('account_id').notNull(),
    entity: text('entity')
      .$type<
        | 'person'
        | 'assertion'
        | 'source'
        | 'union'
        | 'recording'
        | 'attachment'
        | 'merge'
        /** FR-65, story 5-7. `$type` là TS-only nên thêm giá trị không cần migration. */
        | 'place'
        /** AD-14, story 5-8 — sửa tên họ / chữ đệm / đề từ. */
        | 'clan'
      >()
      .notNull(),
    entityId: uuid('entity_id').notNull(),
    action: text('action')
      .$type<
        | 'create'
        | 'update'
        | 'promote'
        | 'hide'
        | 'restore'
        | 'remove'
        | 'withdraw'
        | 'merge'
        | 'unmerge'
      >()
      .notNull(),
    /** Full before/after images. For merges: { winnerId, loserId, repointed: [...] } (AD-3). */
    before: jsonb('before'),
    after: jsonb('after'),
    note: text('note').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('revision_clan_time_idx').on(t.clanId, t.createdAt),
    index('revision_entity_idx').on(t.entity, t.entityId),
  ],
);

/**
 * AD-15: emitted in the same transaction as the revision; delivery is separate and may fail,
 * the event may not. Owed to a person (node), not an account — reaches whoever attaches later.
 */
export const notification = pgTable(
  'notification',
  {
    id: uuid('id').primaryKey(),
    clanId: uuid('clan_id')
      .notNull()
      .references(() => clan.id),
    personId: uuid('person_id')
      .notNull()
      .references(() => person.id),
    kind: text('kind').$type<'added-to-tree' | 'record-changed'>().notNull(),
    payload: jsonb('payload').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    seenAt: timestamp('seen_at', { withTimezone: true }),
  },
  (t) => [index('notification_person_idx').on(t.personId, t.seenAt)],
);

/** FR-48: a duplicate suggestion is a proposal, never an action (AD-22). */
export const mergeProposal = pgTable(
  'merge_proposal',
  {
    id: uuid('id').primaryKey(),
    clanId: uuid('clan_id')
      .notNull()
      .references(() => clan.id),
    winnerPersonId: uuid('winner_person_id')
      .notNull()
      .references(() => person.id),
    loserPersonId: uuid('loser_person_id')
      .notNull()
      .references(() => person.id),
    reason: text('reason').notNull().default(''),
    /** Similarity evidence from core/so-khop at proposal time. */
    evidence: jsonb('evidence').notNull().default(sql`'{}'::jsonb`),
    status: text('status').$type<'open' | 'accepted' | 'rejected'>().notNull().default('open'),
    proposedByAccountId: text('proposed_by_account_id').notNull(),
    decidedByAccountId: text('decided_by_account_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
  },
  (t) => [index('merge_proposal_clan_status_idx').on(t.clanId, t.status)],
);

/** Every clan-partitioned table — the RLS migration and the AD-20 schema gate iterate this list. */
export const PARTITIONED_TABLES = [
  'person',
  'place',
  'source',
  'union',
  'assertion',
  'attachment',
  'recording',
  'recording_subject',
  'revision',
  'notification',
  'merge_proposal',
] as const;
