/**
 * core/seed/ops — FR-51 preview and batch commit, internal to core (story 1-8).
 *
 * Both operations take (tx, ctx, args) and run inside ONE withClanContext transaction opened
 * by index.ts (AD-24). Both are gated on the approval right: the preview shows names and birth
 * years of possibly-living people across the whole clan, which only admin / branch-head may
 * see in bulk (AD-13/AD-21), and FR-51 is their workflow to begin with.
 *
 * previewSeedOp NEVER writes. commitSeedOp writes exclusively through core/person and
 * core/assertion ops, so projection (AD-19), revisions (AD-10), the tentative tier (AD-9),
 * and AD-15 notifications cannot be skipped. Every expected failure is detected BEFORE the
 * first write; a Result err after writes have begun is a bug and throws, rolling the whole
 * import back — a half-imported skeleton is worse than none.
 */
import { and, eq, inArray, isNull } from 'drizzle-orm';
import type { Tx } from '@/db';
import { assertion, person } from '@/db/schema';
import { chuanHoa } from '@/core/so-khop';
import { err, ok, type Result } from '@/core/types';
import type { ViewerContext } from '@/core/identity/session';
import type { NewPersonInput, SourceSpec } from '@/core/assertion';
import { addAssertionOp, createSourceOp, gateApprover, loadPerson } from '@/core/assertion/ops';
import { createPersonOp } from '@/core/person/ops';
import type { SeedGender, SeedRow } from './csv';
import type {
  SeedCandidate,
  SeedCommitResult,
  SeedDecision,
  SeedDecisions,
  SeedPreview,
  SeedPreviewRow,
  SeedRowClassification,
  SeedRowWarning,
} from './index';

/**
 * Birth years within this window still count as the same person — old genealogies routinely
 * drift a few years (same tolerance core/so-khop's soft scoring uses).
 */
const YEAR_NEAR = 3;

type ClanCandidate = { personId: string; name: string; birthYear: number | null };

/** One nameFolded lookup for every name the file mentions — never a bare ILIKE (AD-16). */
async function loadClanCandidates(tx: Tx, foldedNames: string[]): Promise<Map<string, ClanCandidate[]>> {
  const byName = new Map<string, ClanCandidate[]>();
  const names = [...new Set(foldedNames.filter((n) => n.length > 0))];
  if (names.length === 0) return byName;
  const rows = await tx
    .select({
      id: person.id,
      fullName: person.fullName,
      nameFolded: person.nameFolded,
      birthDate: person.birthDate,
    })
    .from(person)
    .where(and(inArray(person.nameFolded, names), isNull(person.mergedInto)));
  for (const row of rows) {
    const candidate: ClanCandidate = {
      personId: row.id,
      name: row.fullName,
      birthYear: row.birthDate ? Number(row.birthDate.slice(0, 4)) : null,
    };
    const list = byName.get(row.nameFolded) ?? [];
    list.push(candidate);
    byName.set(row.nameFolded, list);
  }
  return byName;
}

function yearsNear(a: number | null, b: number | null): boolean {
  return a !== null && b !== null && Math.abs(a - b) <= YEAR_NEAR;
}

// ── Giải một cái tên ra một người — MỘT phép, HAI chỗ gọi ────────────────────

type ResolvedRef = { kind: 'row'; index: number } | { kind: 'person'; personId: string };

/** Vì sao một cái tên không giải ra ai. Preview dịch thành cảnh báo; commit dịch thành bỏ cạnh. */
type LyDoKhongGiai = 'khong-thay' | 'mo-ho';

type KetQuaGiaiTen = { ok: true; ref: ResolvedRef } | { ok: false; ly: LyDoKhongGiai };

/**
 * Dựng phép giải tên cho MỘT lượt nạp — dùng chung cho `previewSeedOp` và `commitSeedOp`.
 *
 * ── Vì sao phải dùng chung (story 6-3, 26/08/2026) ──────────────────────────────────────
 * Trước đây mỗi bên tự đếm lấy: preview đếm `inFile`/`inClan` trên MỌI dòng, commit đếm trên
 * tập dòng chưa bị `skip`, và preview còn không tra tên vợ chồng bao giờ. Ba lỗ im lặng của bộ
 * nạp khung đều là triệu chứng của đúng cái khe ấy — không phải ba lỗi rời nhau:
 *   · ba người vợ trong bảng tính vào phả thành 0 union, không một cảnh báo;
 *   · bỏ một trong hai dòng trùng tên cha ⇒ màn vẫn báo "mất cha" trong khi commit nối được
 *     (cảnh báo THỪA);
 *   · bỏ dòng duy nhất mang tên cha ⇒ màn im, commit lặng lẽ bỏ cha (cảnh báo THIẾU) — đây là
 *     lần cây gia phả gãy làm hai mảnh trên phả thật.
 * Vá từng ô một sẽ để nguyên cái khe đã sinh ra cả ba. Nên phép đếm chỉ còn ĐÚNG MỘT bản.
 *
 * Luật (chốt 24/08/2026, giữ nguyên): **tệp thắng phả** — một dòng khác cùng tên là câu trả lời,
 * kể cả khi trong phả có nhiều người trùng tên. **HAI** dòng cùng tên thì từ chối đoán: nối nhầm
 * cha là hỏng phả của cả một chi, còn thiếu một mối nối thì nối lại được.
 */
function dungPhepGiaiTen(conLai: SeedRow[], clanMatches: Map<string, ClanCandidate[]>) {
  const theoTen = new Map<string, SeedRow[]>();
  for (const row of conLai) {
    const folded = chuanHoa(row.hoTen);
    const list = theoTen.get(folded) ?? [];
    list.push(row);
    theoTen.set(folded, list);
  }
  return (folded: string, selfIndex: number): KetQuaGiaiTen => {
    const trongTep = (theoTen.get(folded) ?? []).filter((r) => r.index !== selfIndex);
    if (trongTep.length > 1) return { ok: false, ly: 'mo-ho' };
    if (trongTep.length === 1) return { ok: true, ref: { kind: 'row', index: trongTep[0]!.index } };
    const trongPha = clanMatches.get(folded) ?? [];
    if (trongPha.length === 1) return { ok: true, ref: { kind: 'person', personId: trongPha[0]!.personId } };
    return { ok: false, ly: trongPha.length === 0 ? 'khong-thay' : 'mo-ho' };
  };
}

/** Quyết định của một dòng; vắng mặt nghĩa là `create` — cùng luật ở cả preview lẫn commit. */
function quyetDinhCua(decisions: SeedDecisions, index: number): SeedDecision {
  return decisions[index] ?? { action: 'create' };
}

/** Dòng nào THẬT SỰ được ghi trong lượt này. `skip` đứng ngoài mọi phép giải tên. */
function dongConLai(rows: SeedRow[], decisions: SeedDecisions): SeedRow[] {
  return rows.filter((r) => quyetDinhCua(decisions, r.index).action !== 'skip');
}

// ── Preview (no writes) ──────────────────────────────────────────────────────

/**
 * ── `decisions` đổi CẢNH BÁO, KHÔNG đổi PHÂN LOẠI (chốt story 6-3) ─────────────────────────
 * Ranh giới này chống một vòng lặp có thật. Màn Nạp khung suy **quyết định** ra từ **phân loại**
 * (`macDinhCua` trong `nap-khung-client.tsx`). Nếu quyết định lại quay ngược vào phân loại thì
 * mỗi lần bấm một nút radio: phân loại đổi → mặc định đổi → quyết định đổi → phân loại đổi.
 *
 * Nên phân loại (và `duplicate-in-file`, thứ lái phân loại) vẫn tả **tệp so với phả** và tính
 * trên MỌI dòng. Chỉ bốn cảnh báo về mối nối — cha, vợ chồng — mới tính trên tập dòng còn lại,
 * vì chúng tả **lượt ghi sắp tới**, và lượt ghi ấy chỉ đọc những dòng không bị bỏ.
 *
 * Vắng `decisions` ⇒ mọi dòng đều còn lại, tức đúng hành vi trước 26/08/2026.
 */
export async function previewSeedOp(
  tx: Tx,
  viewer: ViewerContext,
  rows: SeedRow[],
  decisions: SeedDecisions = {},
): Promise<Result<SeedPreview>> {
  const gate = gateApprover(viewer);
  if (!gate.ok) return gate;

  const foldedOf = (row: SeedRow) => chuanHoa(row.hoTen);
  const nameCounts = new Map<string, number>();
  for (const row of rows) nameCounts.set(foldedOf(row), (nameCounts.get(foldedOf(row)) ?? 0) + 1);

  // Nạp tên của MỌI dòng, kể cả dòng bị bỏ: bản đồ này còn dựng `candidates`, mà ứng viên của
  // một dòng không được đổi theo quyết định. Tên vợ chồng nay cũng nạp — thiếu nó thì preview
  // mù về vợ chồng ngay từ tầng dữ liệu, và đó là lý do ba người vợ đi vào phả không một tiếng.
  const clanMatches = await loadClanCandidates(tx, [
    ...rows.map(foldedOf),
    ...rows.filter((r) => r.tenCha).map((r) => chuanHoa(r.tenCha!)),
    ...rows.filter((r) => r.tenVoChong).map((r) => chuanHoa(r.tenVoChong!)),
  ]);

  const giaiTen = dungPhepGiaiTen(dongConLai(rows, decisions), clanMatches);

  const previewRows: SeedPreviewRow[] = rows.map((row) => {
    const folded = foldedOf(row);
    const candidates: SeedCandidate[] = [...(clanMatches.get(folded) ?? [])].sort((a, b) => {
      const da = yearsNear(row.namSinh, a.birthYear) ? Math.abs(row.namSinh! - a.birthYear!) : 99;
      const db = yearsNear(row.namSinh, b.birthYear) ? Math.abs(row.namSinh! - b.birthYear!) : 99;
      return da - db || a.personId.localeCompare(b.personId);
    });

    const warnings: SeedRowWarning[] = [];

    // Classification — EXPERIENCE.md § Bảng xem trước: khớp / mới / nghi trùng. A single
    // candidate is a confident match only when the birth years agree; a name-only or
    // year-conflicting match, two candidates, or a duplicate inside the file all land on
    // 'nghi-trung' — the bot suggests, it never decides (nothing is preselected).
    let classification: SeedRowClassification;
    if (candidates.length === 0) classification = 'nguoi-moi';
    else if (candidates.length === 1 && yearsNear(row.namSinh, candidates[0]!.birthYear))
      classification = 'khop-nguoi-co-san';
    else classification = 'nghi-trung';

    if ((nameCounts.get(folded) ?? 0) >= 2) {
      classification = 'nghi-trung';
      warnings.push('duplicate-in-file');
    }

    /**
     * Bốn cảnh báo về MỐI NỐI, tính bằng đúng phép giải tên mà `commitSeedOp` sắp dùng — nên
     * chúng không thể lệch với lượt ghi nữa (story 6-3).
     *
     * FR-63: một người cha có khai mà không tìm thấy ở đâu là **cảnh báo**, không phải lỗi —
     * dòng vẫn nạp được và thành gốc tạm của một mảnh. Tìm thấy HAI người cùng tên cũng phải
     * nói to y như vậy: bộ nạp từ chối đoán, nên dòng ấy cũng vào phả mà không có cha.
     *
     * Vợ chồng cũng đúng hai ca ấy, và trước 26/08/2026 KHÔNG ca nào được nói ra: vòng union
     * chỉ nối khi cả hai vế giải được, còn giải không được thì `continue` — commit vẫn báo
     * thành công. Ba người vợ thật đã đi qua đúng cái `continue` ấy.
     */
    /**
     * Bỏ một dòng không chỉ bỏ một người: nó bỏ luôn `ten_cha` và `ten_vo_chong` mà dòng ấy khai.
     * Người vận hành hiểu *"để lại dòng này"* là *"người này đã có trong phả rồi, đừng tạo bản
     * trùng"* — không phải *"vứt các mối quan hệ dòng này khai"*. Đúng cái hiểu nhầm đã làm cây
     * gia phả gãy làm hai mảnh: dòng của quản trị bị bỏ vì nghi trùng, nên `ten_cha` của chính
     * người ấy không bao giờ được đọc.
     *
     * Chỉ bật cho `skip`. Dòng `link` vẫn được nối đủ cạnh — `wireParentEdge` và vòng union đều
     * chạy trên dòng `link`.
     */
    if (quyetDinhCua(decisions, row.index).action === 'skip' && (row.tenCha || row.tenVoChong))
      warnings.push('skip-drops-edges');

    /**
     * Cảnh báo mối nối tính cho MỌI dòng — kể cả dòng đang bị bỏ.
     *
     * SỬA 26/08/2026 sau khi soi bằng trình duyệt. Bản đầu im hẳn cảnh báo mối nối trên dòng bị
     * bỏ, lý lẽ là *"có nạp đâu mà mất"*. Đo trên màn thật thấy ngay hậu quả: màn Nạp khung để
     * lại sẵn mọi dòng mang cảnh báo, nên một dòng bị để lại VÌ *"không tìm thấy người vợ/chồng"*
     * hiện ra chỉ còn *"để lại dòng này là bỏ luôn quan hệ"* — tức **lý do biến mất khỏi màn
     * đúng lúc người vận hành cần đọc nó** để quyết có tích lại hay không.
     *
     * Với dòng bị bỏ, đây là câu trả lời cho *"nếu tôi tích lại thì sao"*. Phép giải tên vốn đã
     * loại chính dòng đang hỏi ra khỏi tập tra (`selfIndex`), nên câu trả lời cho một dòng bị bỏ
     * y hệt như khi nó còn nằm trong tập — không cần dựng thêm tập thứ hai.
     */
    if (row.tenCha) {
      const cha = giaiTen(chuanHoa(row.tenCha), row.index);
      if (!cha.ok) warnings.push(cha.ly === 'khong-thay' ? 'father-not-found' : 'father-ambiguous');
    }
    if (row.tenVoChong) {
      const voChong = giaiTen(chuanHoa(row.tenVoChong), row.index);
      if (!voChong.ok)
        warnings.push(voChong.ly === 'khong-thay' ? 'spouse-not-found' : 'spouse-ambiguous');
    }

    return {
      index: row.index,
      line: row.line,
      hoTen: row.hoTen,
      namSinh: row.namSinh,
      classification,
      candidates,
      warnings,
    };
  });

  return ok({ rows: previewRows });
}

// ── Commit ───────────────────────────────────────────────────────────────────

function mapGender(g: SeedGender | null): NewPersonInput['gender'] {
  if (g === 'nam') return 'male';
  if (g === 'nu') return 'female';
  if (g === 'khac') return 'other';
  return undefined;
}

export async function commitSeedOp(
  tx: Tx,
  viewer: ViewerContext,
  args: { rows: SeedRow[]; decisions: SeedDecisions },
): Promise<Result<SeedCommitResult>> {
  const gate = gateApprover(viewer);
  if (!gate.ok) return gate;
  const ctx = gate.value;

  const { rows, decisions } = args;
  if (rows.length === 0) return err('invalid', 'no rows to import');

  // ── Validate everything BEFORE the first write ──
  for (const key of Object.keys(decisions)) {
    const index = Number(key);
    if (!Number.isInteger(index) || index < 0 || index >= rows.length)
      return err('invalid', `decision for unknown row index '${key}'`);
  }
  const decisionOf = (index: number): SeedDecision => quyetDinhCua(decisions, index);

  for (const row of rows) {
    const decision = decisionOf(row.index);
    if (decision.action !== 'link') continue;
    const target = await loadPerson(tx, decision.personId);
    if (!target) return err('not-found', `line ${row.line}: linked person not found in this clan`);
    if (target.mergedInto) return err('conflict', `line ${row.line}: linked person was merged into another person`);
  }

  const active = dongConLai(rows, decisions);

  const clanMatches = await loadClanCandidates(tx, [
    ...active.filter((r) => r.tenCha).map((r) => chuanHoa(r.tenCha!)),
    ...active.filter((r) => r.tenVoChong).map((r) => chuanHoa(r.tenVoChong!)),
  ]);

  /**
   * ĐÚNG phép giải tên mà `previewSeedOp` vừa dùng để dựng cảnh báo — xem `dungPhepGiaiTen`.
   * Giải không được thì dòng vẫn nạp, chỉ thiếu cạnh, và thành gốc tạm của một mảnh (FR-63):
   * một mối nối thiếu thì nối lại được, một mối nối sai thì hỏng cả một chi.
   */
  const giaiTen = dungPhepGiaiTen(active, clanMatches);

  const fatherOf = new Map<number, ResolvedRef>();
  for (const row of active) {
    if (!row.tenCha) continue;
    const cha = giaiTen(chuanHoa(row.tenCha), row.index);
    if (cha.ok) fatherOf.set(row.index, cha.ref);
  }

  // ── Topological order over in-file father edges: parents before children (Kahn) ──
  const indegree = new Map<number, number>(active.map((r) => [r.index, 0]));
  const childrenOf = new Map<number, number[]>();
  for (const [child, ref] of fatherOf) {
    if (ref.kind !== 'row') continue;
    indegree.set(child, (indegree.get(child) ?? 0) + 1);
    const list = childrenOf.get(ref.index) ?? [];
    list.push(child);
    childrenOf.set(ref.index, list);
  }
  const queue = active.filter((r) => indegree.get(r.index) === 0).map((r) => r.index);
  const order: number[] = [];
  while (queue.length > 0) {
    const index = queue.shift()!;
    order.push(index);
    for (const child of childrenOf.get(index) ?? []) {
      const left = indegree.get(child)! - 1;
      indegree.set(child, left);
      if (left === 0) queue.push(child);
    }
  }
  if (order.length !== active.length) {
    const stuck = active.filter((r) => !order.includes(r.index)).map((r) => `line ${r.line}`);
    return err('invalid', `ten_cha forms a cycle inside the file (${stuck.join(', ')})`);
  }

  // ── Writes — everything tentative (AD-9), everything sourced 'seed-import' ──
  const seedSource: SourceSpec = {
    kind: 'seed-import',
    // Số dòng của TỆP không nói gì về một người: nó tả lượt nhập, không tả sự thật đang đứng
    // trước mắt người đọc. Số ấy thuộc về báo cáo của lượt nạp (`commitSeedOp` trả `created`,
    // `linked`, `skipped`), không thuộc về xuất xứ của từng khẳng định.
    description: 'Nạp khung từ tệp CSV',
  };
  /** One shared source row for the edges and unions this import wires itself. */
  const sharedSourceId = await createSourceOp(tx, ctx, seedSource);

  /** An err from a sub-op after writes began means validation above missed a case — a bug. */
  const must = <T>(result: Result<T>, what: string): T => {
    if (!result.ok) throw new Error(`commitSeedOp invariant broken (${what}): ${result.error.code} — ${result.error.message}`);
    return result.value;
  };

  const personIdOfRow = new Map<number, string>();
  const createdPersonIds: string[] = [];
  let created = 0;
  let linked = 0;

  const wireParentEdge = async (childId: string, parentId: string, line: number) => {
    if (childId === parentId) return; // linked row resolved its own father-name to itself
    const existing = await tx
      .select({ id: assertion.id })
      .from(assertion)
      .where(
        and(
          eq(assertion.subjectPersonId, childId),
          eq(assertion.kind, 'parent-child'),
          eq(assertion.objectPersonId, parentId),
          eq(assertion.status, 'live'),
        ),
      )
      .limit(1);
    if (existing[0]) return; // the clan already knows this edge — do not duplicate it
    must(
      await addAssertionOp(tx, viewer, {
        personId: childId,
        spec: { kind: 'parent-child', parentId },
        source: { kind: 'existing', sourceId: sharedSourceId },
      }),
      `parent-child edge at line ${line}`,
    );
  };

  for (const index of order) {
    const row = rows[index]!;
    const decision = decisionOf(index);
    const fatherRef = fatherOf.get(index);
    const fatherId =
      fatherRef?.kind === 'row' ? personIdOfRow.get(fatherRef.index) : fatherRef?.personId;
    if (fatherRef?.kind === 'row' && !fatherId)
      throw new Error(`commitSeedOp invariant broken: father row ${fatherRef.index} not yet materialised`);

    if (decision.action === 'link') {
      personIdOfRow.set(index, decision.personId);
      linked += 1;
      if (fatherId) await wireParentEdge(decision.personId, fatherId, row.line);
      continue;
    }

    // 'create' — through createPersonOp so person row, name/gender/birth/death/parent-child
    // assertions, projection, revisions, and the AD-15 notification all happen in one path.
    const noteParts = [
      row.ghiChu,
      // AD-5: the branch label is preserved as plain text on the record, never as a code.
      row.chi ? `Chi (theo tệp nạp khung): ${row.chi}` : null,
    ].filter((p): p is string => !!p);
    const result = must(
      await createPersonOp(tx, viewer, {
        fullName: row.hoTen,
        gender: mapGender(row.gioiTinh),
        birth: row.namSinh !== null ? { date: `${row.namSinh}-01-01`, precision: 'year' } : undefined,
        death: row.namMat !== null ? { date: `${row.namMat}-01-01`, precision: 'year' } : undefined,
        parentId: fatherId,
        note: noteParts.length > 0 ? noteParts.join('\n') : undefined,
        source: seedSource,
      }),
      `create person at line ${row.line}`,
    );
    personIdOfRow.set(index, result.personId);
    createdPersonIds.push(result.personId);
    created += 1;
  }

  // ── Unions: ten_vo_chong pairs where BOTH sides resolved to a person ──
  const wiredPairs = new Set<string>();
  for (const row of active) {
    if (!row.tenVoChong) continue;
    const selfId = personIdOfRow.get(row.index)!;
    // Giải không được ⇒ không union. Trước 26/08/2026 chỗ này im lặng tuyệt đối; nay preview đã
    // cảnh báo `spouse-not-found` / `spouse-ambiguous` bằng chính phép giải tên này.
    const voChong = giaiTen(chuanHoa(row.tenVoChong), row.index);
    if (!voChong.ok) continue;
    const spouseId =
      voChong.ref.kind === 'row' ? personIdOfRow.get(voChong.ref.index) : voChong.ref.personId;
    if (!spouseId || spouseId === selfId) continue;

    const pairKey = [selfId, spouseId].sort().join('|');
    if (wiredPairs.has(pairKey)) continue; // both rows naming each other = ONE union
    wiredPairs.add(pairKey);

    const memberships = await tx
      .select({ unionId: assertion.unionId, subjectPersonId: assertion.subjectPersonId })
      .from(assertion)
      .where(
        and(
          eq(assertion.kind, 'union-partner'),
          eq(assertion.status, 'live'),
          inArray(assertion.subjectPersonId, [selfId, spouseId]),
        ),
      );
    const selfUnions = new Set(memberships.filter((m) => m.subjectPersonId === selfId).map((m) => m.unionId));
    const alreadyJoined = memberships.some(
      (m) => m.subjectPersonId === spouseId && m.unionId !== null && selfUnions.has(m.unionId),
    );
    if (alreadyJoined) continue;

    must(
      await addAssertionOp(tx, viewer, {
        personId: selfId,
        spec: { kind: 'union-partner', partnerId: spouseId },
        source: { kind: 'existing', sourceId: sharedSourceId },
      }),
      `union at line ${row.line}`,
    );
  }

  const skipped = rows.length - active.length;
  return ok({ created, linked, skipped, createdPersonIds });
}
