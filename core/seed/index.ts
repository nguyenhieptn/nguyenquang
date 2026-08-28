/**
 * core/seed — FR-51: nạp khung gia phả từ tệp CSV (story 1-8).
 *
 * Surface for adapters (AD-24: no identity parameters — session is resolved inside, then
 * everything runs under withClanContext for the viewer's own clan):
 *
 *   getTemplate()               the skeleton CSV the operator downloads and fills outside
 *   parseSeedCsv(text)          pure validation — per-row errors with line numbers
 *   previewSeed(text, dec?)     classifies every row (khớp / mới / nghi trùng) — NO writes.
 *                               `decisions` là tuỳ chọn và chỉ đổi CẢNH BÁO, không đổi phân
 *                               loại (story 6-3) — xem chú thích ở `previewSeedOp`.
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

/**
 * Mỗi loại cảnh báo phải nói được CÁI GÌ MẤT, không chỉ *bot thấy gì* — vì mất cái gì mới là
 * thứ người vận hành phải quyết. Ba loại cuối thêm 26/08/2026 (story 6-3) sau khi phả thật
 * nuốt ba người vợ và gãy làm hai mảnh mà không một cảnh báo nào bật lên.
 */
export type SeedRowWarning =
  /** ten_cha named but found nowhere — row still importable, becomes a fragment root (FR-63). */
  | 'father-not-found'
  /**
   * ten_cha names someone who exists MORE THAN ONCE — two file rows, or two clan people.
   * The import refuses to guess, so this row also arrives without its father. Attaching by
   * hand afterwards is the only honest resolution: only a human knows which one is meant.
   */
  | 'father-ambiguous'
  /**
   * ten_vo_chong named but found nowhere. MẤT: không union nào được ghi — hai người ấy sẽ
   * không thành vợ chồng trong phả, và lượt nạp vẫn báo thành công.
   */
  | 'spouse-not-found'
  /**
   * ten_vo_chong names someone who exists MORE THAN ONCE. Cùng luật với người cha: bộ nạp từ
   * chối đoán, nên MẤT đúng cái union ấy. Tách riêng khỏi `spouse-not-found` vì việc người vận
   * hành phải làm khác hẳn — một bên là *tên này chưa có ai*, bên kia là *tên này có hai người*.
   */
  | 'spouse-ambiguous'
  /**
   * Dòng này đang bị `skip` mà có khai `ten_cha`/`ten_vo_chong`, **hoặc** có dòng khác khai nó
   * làm cha/vợ chồng. MẤT: chính những mối nối ấy — bỏ một dòng là bỏ luôn các quan hệ nó khai
   * VÀ các quan hệ khai về nó, không chỉ bỏ một người.
   *
   * Sửa 27/08 sau code review: bản đầu chỉ đếm chiều thứ nhất, nên bỏ tích một cụ tổ (dòng
   * không khai gì) cho `warnings` RỖNG — dòng vừa bấm là dòng duy nhất im lặng, và nó rơi khỏi
   * cả bộ lọc *Cần xem lại*, trong khi hàng chục dòng con cháu lặng lẽ mất cha.
   *
   * Đây là loại cảnh báo không tính được nếu không truyền `decisions` vào `previewSeed`.
   */
  | 'skip-drops-edges'
  /**
   * `ten_cha` giải được trong TỆP, nhưng dòng ấy đang bị bỏ. MẤT: cạnh cha–con.
   *
   * Tách khỏi `father-not-found` là bắt buộc (sửa 27/08 sau code review). Từ khi `previewSeedOp`
   * nhận `decisions`, *"trong tệp"* không còn nghĩa là trong tệp — nó nghĩa là *trong những dòng
   * đang được ghi*. Gộp hai ca lại thì màn khẳng định *"không có ai tên ấy — cả trong tệp lẫn
   * trong phả"* ngay bên dưới một dòng mang đúng cái tên ấy, và lái người vận hành sang màn
   * *Mảnh chưa nối* để nối tay thay vì chỉ cần tích lại một ô.
   */
  | 'father-skipped'
  /** `ten_vo_chong` giải được trong TỆP, nhưng dòng ấy đang bị bỏ. MẤT: union. */
  | 'spouse-skipped'
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
export async function previewSeed(text: string, decisions: SeedDecisions = {}): Promise<Result<SeedPreview>> {
  const viewer = await requireViewer();
  if (!viewer) return err('unauthenticated', 'no session and no clan to view');
  const parsed = parseSeedCsv(text);
  if (!parsed.ok) return parsed;
  return withClanContext(viewer.clanId, (tx) => previewSeedOp(tx, viewer, parsed.value, decisions));
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
