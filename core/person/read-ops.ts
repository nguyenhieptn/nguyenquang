/**
 * core/person/read-ops — person read surface (gaps flagged by UI stories 2-2/2-7/2-8/2-9).
 *
 * Takes (tx, ctx, args) — never resolves identity itself; that is index.ts's job (AD-24).
 * Reads only: NO mutations, so no revisions originate here (AD-10 n/a).
 *
 * The viewer-distance approach mirrors core/tree/ops (the documented pattern to copy):
 * load the whole clan graph once per call (< 300 people — build contract scale note),
 * BFS the viewer's radius, and pass every card through visibilityFor BEFORE it leaves
 * the core (AD-13/AD-21). Tree ops helpers are imported READ-ONLY.
 */
import { and, asc, eq, inArray } from 'drizzle-orm';
import type { Tx } from '@/db';
import { assertion, revision, source } from '@/db/schema';
import { giaiNoi } from '@/core/place/ops';
import { cauGio, duongSangAm, gioKeTiep, homNayVN } from '@/core/lich/am-lich';
import { gateApprover } from '@/core/assertion/ops';
import type { AssertionKind, Confidence, Tier } from '@/db/schema';
import {
  ANONYMOUS_LABEL,
  PRIVACY_RADIUS,
  visibilityFor,
  type Visibility,
} from '@/core/identity/privacy';
import type { ViewerContext } from '@/core/identity/session';
import { err, ok, type Result } from '@/core/types';
import {
  bfsDistances,
  computeStructure,
  loadTreeData,
  type RawAttribution,
  type RawPersonCard,
  type Structure,
  type TreeData,
} from '@/core/tree/ops';
import type { PersonAssertion, SourceKind } from './index';
import { xepChong } from './chong';

// ── Raw shapes: attribution / authorship carry account ids; index.ts swaps in names ──
// (the "user" table is identity data outside the clan partition — read AFTER the clan tx).

export type RawPersonAssertion = Omit<PersonAssertion, 'createdByName'> & {
  createdByAccountId: string;
};

export type RawPersonProfile = {
  card: RawPersonCard;
  relations: { parents: RawPersonCard[]; children: RawPersonCard[]; partners: RawPersonCard[] };
  visibility: Visibility;
  /** Present ONLY when visibility === 'full' (AD-21 — assertions never leave otherwise). */
  assertions?: RawPersonAssertion[];
  /** Set when the requested id was a tombstone and the winner is returned instead (AD-3). */
  redirectedFrom?: string;
  /**
   * FR-41 (story 7-5) — GỢI Ý ngày giỗ từ ngày mất, chỉ khi: ngày mất chính xác tới ngày, chưa có
   * khẳng định giỗ sống, và người xem thấy trọn. Là gợi ý để BÀY, không phải một khẳng định: nhà
   * dùng ngày khác thì gõ ngày khác, hệ không cãi (`review-culture.md:677`).
   */
  goiYGio?: GoiYGio;
};

export type GoiYGio = { ngay: number; thang: number; nhuan: boolean; tuNgayMat: string; chuoi: string };

// ── Viewer lens + card building (same semantics as core/tree/ops — kept in lockstep) ──

type PersonRow = TreeData['persons'] extends Map<string, infer R> ? R : never;

type ViewerLens = {
  role: ViewerContext['role'];
  personId: string | null;
  dist: Map<string, number>;
};

function viewerLens(data: TreeData, ctx: ViewerContext): ViewerLens {
  const pid = ctx.personId ? data.redirect(ctx.personId) : null;
  return {
    role: ctx.role,
    personId: pid,
    dist: pid ? bfsDistances(data, pid, PRIVACY_RADIUS) : new Map(),
  };
}

function visibilityOf(lens: ViewerLens, row: PersonRow, today: Date): Visibility {
  const distance = lens.personId ? (lens.dist.get(row.id) ?? null) : null;
  return visibilityFor(
    { role: lens.role, personId: lens.personId },
    {
      personId: row.id,
      isLiving: row.isLiving,
      birthDate: row.birthDate,
      hiddenFromPublic: row.hiddenFromPublic,
    },
    distance,
    today,
  );
}

/** Card lifespan. Living people show a YEAR at most, at every visibility level (FR-37). */
function lifespanOf(row: PersonRow, vis: Visibility): string {
  if (vis === 'anonymous') return '';
  const by = row.birthDate ? row.birthDate.slice(0, 4) : null;
  const dy = row.deathDate ? row.deathDate.slice(0, 4) : null;
  if (row.isLiving) return by ? `sinh ${by}` : '';
  if (!by && !dy) return '';
  return `${by ?? '?'}–${dy ?? '?'}`;
}

function cardOf(
  lens: ViewerLens,
  s: Structure,
  row: PersonRow,
  attribution: Map<string, RawAttribution>,
  today: Date,
): RawPersonCard {
  const vis = visibilityOf(lens, row, today);
  return {
    personId: row.id,
    fullName: vis === 'anonymous' ? ANONYMOUS_LABEL : row.fullName,
    tier: row.nameTier ?? 'tentative',
    confidence: row.nameConfidence ?? 'ton-nghi',
    isLiving: row.isLiving,
    lifespan: lifespanOf(row, vis),
    generation: s.generation.get(row.id) ?? null,
    branchCode: s.branchCode.get(row.id) ?? null,
    attribution: vis === 'anonymous' ? null : (attribution.get(row.id) ?? null),
  };
}

/** FR-39 attribution: earliest 'person'/'create' revision per person (same as tree ops). */
async function fetchAttribution(tx: Tx, ids: string[]): Promise<Map<string, RawAttribution>> {
  const map = new Map<string, RawAttribution>();
  if (ids.length === 0) return map;
  const rows = await tx
    .select({
      entityId: revision.entityId,
      accountId: revision.accountId,
      createdAt: revision.createdAt,
    })
    .from(revision)
    .where(
      and(
        eq(revision.entity, 'person'),
        eq(revision.action, 'create'),
        inArray(revision.entityId, ids),
      ),
    )
    .orderBy(asc(revision.createdAt), asc(revision.id));
  for (const r of rows)
    if (!map.has(r.entityId))
      map.set(r.entityId, { byAccountId: r.accountId, at: r.createdAt.toISOString() });
  return map;
}

// ── Human Vietnamese value text (surface A: no tech words, no pronouns) ──

function ngayVn(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

function eventText(kind: 'birth' | 'death', v: { date?: string; precision?: string }): string {
  const verb = kind === 'birth' ? 'sinh' : 'mất';
  const yearWord = kind === 'birth' ? 'năm sinh' : 'năm mất';
  const year = v.date ? v.date.slice(0, 4) : null;
  switch (v.precision) {
    case 'exact':
      return v.date ? `${verb} ngày ${ngayVn(v.date)}` : `${yearWord} chưa rõ`;
    case 'year':
      return year ? `${yearWord} ${year}` : `${yearWord} chưa rõ`;
    case 'approximate':
      return year ? `${yearWord} ${year} (ước chừng)` : `${yearWord} chưa rõ (ước chừng)`;
    default:
      return `${yearWord} chưa rõ`;
  }
}

const GENDER_VN = { male: 'nam', female: 'nữ', other: 'khác' } as const;
const RELATION_VN = { blood: 'con ruột', adopted: 'con nuôi', heir: 'con thừa tự' } as const;
/** Ba vai của FR-65 §5b. Ba lần táng (nguyên/cải/di) chưa phân loại ở Đợt 2. */
const VAI_NOI = { 'que-quan': 'quê quán', 'tru-quan': 'trú quán', 'an-tang': 'nơi an táng' } as const;


// ── Dựng dòng khẳng định — dùng chung cho hồ sơ một người và phép quét cả họ (story 6-5) ────

type DongKhangDinhTho = {
  assertionId: string;
  subjectPersonId: string;
  kind: AssertionKind;
  value: unknown;
  objectPersonId: string | null;
  unionId: string | null;
  placeId: string | null;
  confidence: string;
  tier: string;
  status: string;
  sourceKind: string;
  sourceDescription: string;
  toldByPersonId: string | null;
  createdByAccountId: string;
  createdAt: Date;
};

/**
 * Mọi khẳng định SỐNG của một tập người, kèm nguồn.
 *
 * Quét cả họ phải NÓI RA (`'ca-ho'`), không phải "mảng rỗng nghĩa là tất cả" (sửa 29/08 sau code
 * review 6-5): một nơi gọi tương lai dẫn ra danh sách id mà ra rỗng thì phải nhận RỖNG, không
 * phải mọi khẳng định trong họ ở tầm nhìn đầy đủ — đúng thứ AD-21 gác.
 */
async function docKhangDinhSong(tx: Tx, pids: string[] | 'ca-ho'): Promise<DongKhangDinhTho[]> {
  if (pids !== 'ca-ho' && pids.length === 0) return [];
  const dieuKien = [eq(assertion.status, 'live')];
  if (pids !== 'ca-ho') dieuKien.push(inArray(assertion.subjectPersonId, pids));
  return tx
    .select({
      assertionId: assertion.id,
      subjectPersonId: assertion.subjectPersonId,
      kind: assertion.kind,
      value: assertion.value,
      objectPersonId: assertion.objectPersonId,
      unionId: assertion.unionId,
      placeId: assertion.placeId,
      confidence: assertion.confidence,
      tier: assertion.tier,
      status: assertion.status,
      sourceKind: source.kind,
      sourceDescription: source.description,
      toldByPersonId: source.toldByPersonId,
      createdByAccountId: assertion.createdByAccountId,
      createdAt: assertion.createdAt,
    })
    .from(assertion)
    .innerJoin(source, eq(assertion.sourceId, source.id))
    .where(and(...dieuKien))
    .orderBy(asc(assertion.createdAt), asc(assertion.id));
}

type NguCanhDong = {
  displayName: (id: string | null | undefined) => string | undefined;
  /** placeId → nhãn nơi (ĐÃ giải chuỗi gộp, AD-3). */
  tenNoi: Map<string, string>;
  /** placeId → id nơi thắng — khoá để hai lời khai về cùng một nơi không thành mâu thuẫn. */
  noiThang: Map<string, string>;
  /** unionId → thành viên (đã redirect), trừ chính chủ khi dựng câu. */
  unionMembers: Map<string, string[]>;
  /** Giới ĐÃ CHIẾU của một người (AD-19) — cho khoá phụ của `parent-child`. */
  gioiCua: (id: string | null) => 'male' | 'female' | 'other' | null;
};

/** Tra một lượt mọi thứ mà `dungDongKhangDinh` cần: tên nơi, thành viên union, giới của cha mẹ. */
async function nguCanhDungDong(
  tx: Tx,
  data: TreeData,
  rows: DongKhangDinhTho[],
  displayName: NguCanhDong['displayName'],
): Promise<NguCanhDong> {
  /**
   * Tên nơi cho `kind: 'place'` — một truy vấn cho mọi nơi được nhắc tới, LUÔN kèm đơn vị cha:
   * "Quang Trung" một mình không nói được là Định Hoá hay Vũng Tàu, đúng cái hỏng FR-65 chặn.
   * Qua `giaiNoi` chứ không đọc thẳng (sửa 25/08 sau code review): AD-3 nói một nơi đã gộp phải
   * đọc ra NƠI THẮNG, y như `person.redirect`.
   */
  const placeIds = [...new Set(rows.flatMap((r) => (r.placeId ? [r.placeId] : [])))];
  const tenNoi = new Map<string, string>();
  const noiThang = new Map<string, string>();
  if (placeIds.length > 0) {
    const daGiai = await giaiNoi(tx, placeIds);
    for (const [id, n] of daGiai) {
      tenNoi.set(id, n.nhan);
      noiThang.set(id, n.placeId);
    }
  }

  // Union memberships for 'vợ/chồng với <tên>' — one query for every union referenced.
  const unionIds = [...new Set(rows.flatMap((r) => (r.unionId ? [r.unionId] : [])))];
  const unionMembers = new Map<string, string[]>();
  if (unionIds.length > 0) {
    const members = await tx
      .select({ unionId: assertion.unionId, subjectPersonId: assertion.subjectPersonId })
      .from(assertion)
      .where(
        and(
          eq(assertion.kind, 'union-partner'),
          eq(assertion.status, 'live'),
          inArray(assertion.unionId, unionIds),
        ),
      );
    for (const m of members) {
      if (!m.unionId) continue;
      const rid = data.redirect(m.subjectPersonId);
      if (!rid) continue;
      const arr = unionMembers.get(m.unionId);
      if (arr) {
        if (!arr.includes(rid)) arr.push(rid);
      } else unionMembers.set(m.unionId, [rid]);
    }
  }

  const gioiCua = (id: string | null) => {
    const rid = id ? data.redirect(id) : null;
    return rid ? (data.persons.get(rid)?.gender ?? null) : null;
  };
  return { displayName, tenNoi, noiThang, unionMembers, gioiCua };
}

/**
 * Dòng khẳng định như bề mặt A đọc — câu tiếng Việt, người ở đầu kia, và KHOÁ PHỤ cho phép xếp
 * chồng (story 6-5). MỘT hàm cho cả hồ sơ một người lẫn phép quét cả họ: hai bản dựng câu là hai
 * câu lệch nhau ở lượt sửa đầu.
 */
function dungDongKhangDinh(
  rows: DongKhangDinhTho[],
  pid: string,
  tenChinhChu: string,
  ngu: NguCanhDong,
): RawPersonAssertion[] {
  const { displayName, tenNoi, noiThang, unionMembers, gioiCua } = ngu;
  const valueText = (r: DongKhangDinhTho): string => {
    const v = (r.value ?? {}) as Record<string, unknown>;
    switch (r.kind) {
      case 'name':
        return `tên ${typeof v.fullName === 'string' ? v.fullName : tenChinhChu}`;
      case 'gender': {
        const g = typeof v.gender === 'string' ? v.gender : '';
        return `giới tính ${GENDER_VN[g as keyof typeof GENDER_VN] ?? 'chưa rõ'}`;
      }
      case 'birth':
        return eventText('birth', v as { date?: string; precision?: string });
      case 'death':
        return eventText('death', v as { date?: string; precision?: string });
      case 'parent-child': {
        const rel =
          RELATION_VN[(typeof v.relation === 'string' ? v.relation : '') as keyof typeof RELATION_VN] ??
          'con';
        const parent = displayName(r.objectPersonId) ?? 'một người trong họ';
        return `là ${rel} của ${parent}`;
      }
      case 'union-partner': {
        const names = (r.unionId ? (unionMembers.get(r.unionId) ?? []) : [])
          .filter((id) => id !== pid)
          .map((id) => displayName(id))
          .filter((n): n is string => n !== undefined);
        return names.length > 0 ? `vợ/chồng với ${names.join(', ')}` : 'vợ/chồng (chưa rõ với ai)';
      }
      case 'note':
        return `ghi chú: ${typeof v.text === 'string' ? v.text : ''}`;
      case 'gio': {
        // Luôn hiện CẢ HAI lịch (review-culture:677): ngày âm nhà ghi, và ngày dương kế tiếp.
        const g = { ngay: Number(v.ngay), thang: Number(v.thang), nhuan: v.nhuan === true };
        if (!(g.ngay >= 1 && g.ngay <= 30 && g.thang >= 1 && g.thang <= 12)) return 'giỗ (ngày chưa rõ)';
        return cauGio(g, gioKeTiep(g, homNayVN()));
      }
      case 'place': {
        const vai = VAI_NOI[(typeof v.role === 'string' ? v.role : '') as keyof typeof VAI_NOI] ?? 'nơi';
        const noi = r.placeId ? (tenNoi.get(r.placeId) ?? 'một nơi chưa rõ') : 'một nơi chưa rõ';
        return `${vai}: ${noi}`;
      }
      default: {
        // Đủ loại: thêm một `AssertionKind` mà quên câu ở đây là lỗi biên dịch, không phải một
        // chữ "thông tin" im lặng. Nhánh vẫn có mặt vì cột `kind` là `text` — `$type` chỉ là TS.
        const _du: never = r.kind;
        return `thông tin (${String(_du)})`;
      }
    }
  };

  /** Khoá phụ (story 6-5) — xem `PersonAssertion.nhomPhu`. */
  const nhomPhu = (r: DongKhangDinhTho): string | undefined => {
    const v = (r.value ?? {}) as Record<string, unknown>;
    if (r.kind === 'place') return typeof v.role === 'string' ? v.role : undefined;
    if (r.kind === 'parent-child') {
      // 'other' nói ít như chưa rõ: hai cha mẹ cùng khai "khác" không phải hai người cha.
      const g = gioiCua(r.objectPersonId);
      const gioi = g === null || g === 'other' ? '?' : g;
      const rel = typeof v.relation === 'string' ? v.relation : 'blood';
      return `${gioi}|${rel}`;
    }
    return undefined;
  };

  return rows.map((r) => {
    const nhom = nhomPhu(r);
    const noiId = r.kind === 'place' && r.placeId ? noiThang.get(r.placeId) : undefined;
    return {
      assertionId: r.assertionId,
      kind: r.kind as AssertionKind,
      valueText: valueText(r),
      confidence: r.confidence as Confidence,
      tier: r.tier as Tier,
      status: r.status as 'live' | 'hidden',
      sourceKind: r.sourceKind as SourceKind,
      sourceDescription: r.sourceDescription,
      ...(r.toldByPersonId ? { toldByName: displayName(r.toldByPersonId) } : {}),
      /**
       * `parent-child` trỏ thẳng bằng `objectPersonId`. `union-partner` thì không — thành viên
       * của một union nối nhau qua `unionId`, nên người ở đầu kia là thành viên CÒN LẠI.
       */
      ...(r.kind === 'parent-child' && r.objectPersonId
        ? { doiTuongId: r.objectPersonId }
        : r.kind === 'union-partner' && r.unionId
          ? (() => {
              const kia = (unionMembers.get(r.unionId) ?? []).find((id) => id !== pid);
              return kia ? { doiTuongId: kia } : {};
            })()
          : {}),
      ...(nhom !== undefined ? { nhomPhu: nhom } : {}),
      ...(noiId !== undefined ? { noiId } : {}),
      createdByAccountId: r.createdByAccountId,
      createdAt: r.createdAt.toISOString(),
    };
  });
}

// ── The op ──

export async function getPersonOps(
  tx: Tx,
  ctx: ViewerContext,
  personId: string,
): Promise<Result<RawPersonProfile>> {
  const data = await loadTreeData(tx);
  const pid = data.redirect(personId);
  if (!pid || !data.persons.has(pid)) return err('not-found', 'person not found');

  const s = computeStructure(data);
  const today = new Date();
  const lens = viewerLens(data, ctx);
  const row = data.persons.get(pid)!;
  const visibility = visibilityOf(lens, row, today);

  /** Name as the viewer may see it — anonymity applied (AD-13). undefined = no such person. */
  const displayName = (id: string | null | undefined): string | undefined => {
    if (!id) return undefined;
    const rid = data.redirect(id);
    const r = rid ? data.persons.get(rid) : undefined;
    if (!r) return undefined;
    return visibilityOf(lens, r, today) === 'anonymous' ? ANONYMOUS_LABEL : r.fullName;
  };

  // ── Relations from live parent-child + union-partner edges; tombstones already redirected
  //    by loadTreeData. Anonymous subject ⇒ EMPTY (the page keeps only the placeholder). ──
  const byBirthThenName = (a: string, b: string): number => {
    const ra = data.persons.get(a)!;
    const rb = data.persons.get(b)!;
    const ya = ra.birthDate ? Number(ra.birthDate.slice(0, 4)) : Number.POSITIVE_INFINITY;
    const yb = rb.birthDate ? Number(rb.birthDate.slice(0, 4)) : Number.POSITIVE_INFINITY;
    if (ya !== yb) return ya - yb;
    if (ra.nameFolded !== rb.nameFolded) return ra.nameFolded < rb.nameFolded ? -1 : 1;
    return a < b ? -1 : 1;
  };
  const parentIds =
    visibility === 'anonymous'
      ? []
      : [...new Set((data.parentsOf.get(pid) ?? []).map((e) => e.parentId))].sort(byBirthThenName);
  const childIds =
    visibility === 'anonymous'
      ? []
      : [...new Set((data.childrenOf.get(pid) ?? []).map((e) => e.childId))].sort(byBirthThenName);
  const partnerIds =
    visibility === 'anonymous'
      ? []
      : (data.partnersOf.get(pid) ?? []).filter((p) => data.persons.has(p));

  const cardIds = [...new Set([pid, ...parentIds, ...childIds, ...partnerIds])];
  const attribution = await fetchAttribution(tx, cardIds);
  const card = (id: string) => cardOf(lens, s, data.persons.get(id)!, attribution, today);

  // ── Assertions: ONLY at full visibility, only LIVE rows about the subject (FR-1/FR-2) ──
  let assertions: RawPersonAssertion[] | undefined;
  let goiYGio: GoiYGio | undefined;
  if (visibility === 'full') {
    const rows = await docKhangDinhSong(tx, [pid]);
    const ngu = await nguCanhDungDong(tx, data, rows, displayName);
    assertions = dungDongKhangDinh(rows, pid, row.fullName, ngu);
    if (row.deathDate && row.deathPrecision === 'exact' && !rows.some((r) => r.kind === 'gio')) {
      const [y, m, d] = row.deathDate.split('-').map(Number);
      // Dải thuật toán 1900–2199 (Hồ Ngọc Đức); ngoài dải — cụ tổ đời xa — không gợi ý còn hơn gợi sai.
      if (y && m && d && y >= 1900 && y <= 2199) {
        const am = duongSangAm({ ngay: d, thang: m, nam: y });
        goiYGio = {
          ngay: am.ngay,
          thang: am.thang,
          nhuan: am.nhuan,
          tuNgayMat: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`,
          chuoi: `${am.ngay}/${am.thang}${am.nhuan ? ' nhuận' : ''}`,
        };
      }
    }
  }

  return ok({
    card: card(pid),
    relations: {
      parents: parentIds.map(card),
      children: childIds.map(card),
      partners: partnerIds.map(card),
    },
    visibility,
    ...(assertions !== undefined ? { assertions } : {}),
    ...(goiYGio !== undefined ? { goiYGio } : {}),
    ...(pid !== personId ? { redirectedFrom: personId } : {}),
  });
}

// ── Mâu thuẫn trên cả dòng họ (story 6-5) ──────────────────────────────────────────────────

export type RawNguoiCoMauThuan = {
  personId: string;
  personName: string;
  /** MỌI khẳng định sống của người ấy — `index.ts` xếp chồng rồi giữ chồng mâu thuẫn. */
  assertions: RawPersonAssertion[];
};

/**
 * Quét cả dòng họ, trả những người có ít nhất một chồng mâu thuẫn — CÙNG phép `xepChong` với phiếu.
 *
 * Quyền duyệt, như hàng chờ: một mâu thuẫn là hai lời khai chưa được đối chiếu. Người đã gộp (bia
 * mộ) không có trong `data.persons` nên tự rơi. Ở đây chỉ dựng dòng; xếp chồng và lọc nằm ở
 * `index.ts` sau khi tra tên tài khoản — cùng thứ tự với `getPerson`.
 */
export async function listConflictsOps(tx: Tx, ctx: ViewerContext): Promise<Result<RawNguoiCoMauThuan[]>> {
  /**
   * `gateApprover`, KHÔNG chép lại cổng (sửa 29/08 sau code review 6-5). Bản đầu tự viết ba dòng
   * kiểm và lặp đúng lỗi thứ tự mà `gateWriter` vừa được sửa cùng ngày: tài khoản đã đăng nhập
   * nhưng chưa gắn mang `role: 'guest'` (`core/identity/auth.ts`), nên "chưa gắn" bị đọc thành
   * "chưa đăng nhập" và màn đẩy một người đang đăng nhập về `/dang-nhap`. Một cổng, một chỗ.
   */
  const gate = gateApprover(ctx);
  if (!gate.ok) return gate;

  const data = await loadTreeData(tx);
  const today = new Date();
  const lens = viewerLens(data, ctx);
  const displayName = (id: string | null | undefined): string | undefined => {
    if (!id) return undefined;
    const rid = data.redirect(id);
    const r = rid ? data.persons.get(rid) : undefined;
    if (!r) return undefined;
    return visibilityOf(lens, r, today) === 'anonymous' ? ANONYMOUS_LABEL : r.fullName;
  };

  const rows = await docKhangDinhSong(tx, 'ca-ho');
  const ngu = await nguCanhDungDong(tx, data, rows, displayName);
  const theoNguoi = new Map<string, DongKhangDinhTho[]>();
  for (const r of rows) {
    const pid = data.redirect(r.subjectPersonId);
    if (!pid) continue;
    const ds = theoNguoi.get(pid);
    if (ds) ds.push(r);
    else theoNguoi.set(pid, [r]);
  }

  const ra: RawNguoiCoMauThuan[] = [];
  for (const [pid, ds] of theoNguoi) {
    const nguoi = data.persons.get(pid);
    if (!nguoi) continue;
    const dong = dungDongKhangDinh(ds, pid, nguoi.fullName, ngu);
    /**
     * Sàng SƠ ở đây bằng chính `xepChong` để không mang cả họ ra khỏi core: chỉ người có ít nhất
     * một chồng mâu thuẫn mới đi tiếp. `index.ts` xếp lại sau khi tra tên — hai lượt xếp cùng một
     * hàm, cùng dữ liệu, cùng kết quả.
     */
    const coMauThuan = xepChong(dong.map((a) => ({ ...a, createdByName: '' }))).some(
      (c) => c.stackKind === 'mau-thuan',
    );
    // Tên chiếu có thể RỖNG khi khẳng định tên duy nhất bị ẩn theo báo cáo — một khối không tên
    // không bấm được, không đọc được; nói ra là chưa rõ.
    if (coMauThuan) ra.push({ personId: pid, personName: nguoi.fullName.trim() || 'Chưa rõ tên', assertions: dong });
  }
  ra.sort((a, b) => a.personName.localeCompare(b.personName, 'vi'));
  return ok(ra);
}
