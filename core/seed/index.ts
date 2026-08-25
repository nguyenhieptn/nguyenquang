/**
 * core/seed — FR-51: nạp khung gia phả từ tệp CSV (story 1-8).
 *
 * Surface for adapters (AD-24: no identity parameters — session is resolved inside, then
 * everything runs under withClanContext for the viewer's own clan):
 *
 *   getTemplate()               the skeleton CSV the operator downloads and fills outside
 *   parseSeedCsv(text)          pure validation — per-row errors with line numbers
 *   previewSeed(text)           classifies every row (khớp / mới / nghi trùng) — NO writes
 *   commitSeed(text, decisions) batch import in ONE transaction, admin/branch-head only
 *
 * Commit writes exclusively through core/person + core/assertion ops, so every person and
 * edge enters tentative (AD-9) with a 'seed-import' source, projection stays with
 * core/assertion (AD-19), and every mutation carries its revision (AD-10). Internal ops
 * (ops.ts) take (tx, ctx, args) — core-internal + tests only, never adapters.
 */
import { err, type Result } from '@/core/types';
import { resolveViewer } from '@/core/identity/session';
import { withClanContext } from '@/db';
import { parseSeedCsv } from './csv';
import { commitSeedOp, previewSeedOp } from './ops';

export { getTemplate, parseSeedCsv, SEED_COLUMNS } from './csv';
export type { SeedColumn, SeedGender, SeedRow } from './csv';

// ── Preview (EXPERIENCE.md § Bảng xem trước so khớp) ─────────────────────────

export type SeedCandidate = {
  personId: string;
  name: string;
  /** Year only — generation is derived (AD-5) and deliberately absent: preview stays cheap. */
  birthYear: number | null;
};

export type SeedRowClassification = 'khop-nguoi-co-san' | 'nguoi-moi' | 'nghi-trung';

export type SeedRowWarning =
  /** ten_cha named but found nowhere — row still importable, becomes a fragment root (FR-63). */
  | 'father-not-found'
  /**
   * ten_cha names someone who exists MORE THAN ONCE — two file rows, or two clan people.
   * The import refuses to guess, so this row also arrives without its father. Attaching by
   * hand afterwards is the only honest resolution: only a human knows which one is meant.
   */
  | 'father-ambiguous'
  /** another row in the same file carries this name — review before committing */
  | 'duplicate-in-file';

export type SeedPreviewRow = {
  /** 0-based row position — the key commitSeed's decisions map uses. */
  index: number;
  /** 1-based line in the file (header is line 1). */
  line: number;
  hoTen: string;
  namSinh: number | null;
  classification: SeedRowClassification;
  /** Duplicate candidates in the clan. NOTHING is preselected — the bot suggests, never decides. */
  candidates: SeedCandidate[];
  warnings: SeedRowWarning[];
};

export type SeedPreview = { rows: SeedPreviewRow[] };

// ── Commit ───────────────────────────────────────────────────────────────────

export type SeedDecision =
  | { action: 'create' }
  | { action: 'link'; personId: string }
  | { action: 'skip' };

/** Keyed by row index (SeedRow.index / SeedPreviewRow.index). A row without an entry is created. */
export type SeedDecisions = Record<number, SeedDecision>;

export type SeedCommitResult = {
  created: number;
  linked: number;
  skipped: number;
  createdPersonIds: string[];
};

/** AD-24: every surface below resolves identity itself; a null viewer means no clan exists yet. */
async function requireViewer() {
  const viewer = await resolveViewer();
  return viewer ?? null;
}

/**
 * Classify every row against the clan without writing anything: matches by folded name
 * (AD-16) + birth-year proximity, duplicates inside the file, fathers found nowhere (FR-63).
 * Approval right required — the preview lists people across the whole clan.
 */
export async function previewSeed(text: string): Promise<Result<SeedPreview>> {
  const viewer = await requireViewer();
  if (!viewer) return err('unauthenticated', 'no session and no clan to view');
  const parsed = parseSeedCsv(text);
  if (!parsed.ok) return parsed;
  return withClanContext(viewer.clanId, (tx) => previewSeedOp(tx, viewer, parsed.value));
}

/**
 * Import the file in ONE transaction: parents created before children, parent-child and
 * union edges wired where both sides resolve, everything tentative with a 'seed-import'
 * source. Admin / branch-head only.
 */
export async function commitSeed(text: string, decisions: SeedDecisions): Promise<Result<SeedCommitResult>> {
  const viewer = await requireViewer();
  if (!viewer) return err('unauthenticated', 'no session and no clan to view');
  const parsed = parseSeedCsv(text);
  if (!parsed.ok) return parsed;
  return withClanContext(viewer.clanId, (tx) => commitSeedOp(tx, viewer, { rows: parsed.value, decisions }));
}
