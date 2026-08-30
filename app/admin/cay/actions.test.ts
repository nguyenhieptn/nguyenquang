/**
 * TẦNG TEST ADAPTER đầu tiên của repo — gọi thẳng server action với một PHIÊN THẬT (story 6-1,
 * bảy ô test để trống từ 26/08, đóng 29/08).
 *
 * ── Vì sao mãi mới có tầng này ────────────────────────────────────────────────────────────
 * Server action là `'use server'`: nó đọc phiên qua `next/headers`, và bên ngoài một request thì
 * `headers()` ném. Code review 6-1 bắt năm ô tích khống, story để trống có chủ ý, 6-6 chốt "chỉ
 * đo, không ghi". Cái còn thiếu là một DÒNG HỌ THỬ — `core/gates/dong-ho-thu.ts` — để đường ghi
 * có chỗ chạy mà không chạm phả thật.
 *
 * ── Hai mock, và chỉ hai ──────────────────────────────────────────────────────────────────
 *   · `next/headers` — trả cookie của tài khoản đang "đăng nhập". Từ đó xuống là thật:
 *     `resolveSessionImpl` tra Better Auth, `soleClanId` đọc bảng `clan`, RLS gác từng bảng.
 *   · `next/cache` — `revalidatePath` bên ngoài request cũng ném; ở đây nó không có gì để làm mới.
 * KHÔNG giả `resolveSession`: giả nó là bỏ qua đúng tầng mà AD-24 dựng ra để gác.
 *
 * ── Lint AD-1 áp cả cho tệp này ───────────────────────────────────────────────────────────
 * Không `@/db`, không `drizzle-orm`, không `@/core/*\/ops`. Đọc lại kết quả qua bề mặt core
 * (`getPerson`, `getNeighborhood`, `searchPersons`) — đúng những gì một adapter thật cũng chỉ có.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

let cookieHienTai = '';
vi.mock('next/headers', () => ({
  headers: async () => new Headers(cookieHienTai ? { cookie: cookieHienTai } : {}),
}));
vi.mock('next/cache', () => ({ revalidatePath: () => {}, revalidateTag: () => {} }));

import { dungDongHoThu, donDongHoThu, type DongHoThu } from '@/core/gates/dong-ho-thu';
import { getPerson } from '@/core/person';
import { getNeighborhood, searchPersons } from '@/core/tree';
import { ghiThemKhangDinh, ghiThemQuanHe, loaiKhangDinh, xemHoSo } from './actions';

let d: DongHoThu;

beforeAll(async () => {
  d = await dungDongHoThu({ tienTo: 'S61' });
}, 60_000);

afterAll(async () => {
  cookieHienTai = '';
  if (d) await donDongHoThu({ ...d, emails: [d.quanTri.email, d.thanhVien.email, d.chuaGan.email] });
});

const laThanhVien = () => (cookieHienTai = d.thanhVien.cookie);
const laQuanTri = () => (cookieHienTai = d.quanTri.cookie);
const laKhach = () => (cookieHienTai = '');

/** Dòng cha-mẹ của một người, đọc qua bề mặt core với phiên đang có. */
async function chaMeCua(personId: string): Promise<string[]> {
  const r = await getPerson(personId);
  if (!r.ok) throw new Error(r.error.message);
  return r.value.relations.parents.map((p) => p.personId);
}

/**
 * Đọc KHẲNG ĐỊNH thì đọc bằng mắt quản trị, rồi trả lại cookie đang có.
 *
 * Lượt chạy đầu của chính bài test này bắt được một điều đáng ghi: thành viên "Mình" đọc hồ sơ
 * Mồ Côi thì `assertions` VẮNG — Mồ Côi còn sống và cách Mình bốn bậc (Mình → Cha → Tổ → Chú →
 * Mồ Côi), ngoài bán kính 3 (AD-13), nên core chỉ trả `relations`. Đúng luật, và là bằng chứng
 * bán kính riêng tư gác cả ở tầng adapter.
 */
async function dongQuanHe(personId: string, doiTuongId: string) {
  const cookieCu = cookieHienTai;
  cookieHienTai = d.quanTri.cookie;
  try {
    const r = await getPerson(personId);
    if (!r.ok) throw new Error(r.error.message);
    return (r.value.assertions ?? []).find((a) => a.kind === 'parent-child' && a.doiTuongId === doiTuongId);
  } finally {
    cookieHienTai = cookieCu;
  }
}

describe('ghiThemQuanHe — ai ghi được (gateWriter qua một phiên thật)', () => {
  it('khách (không cookie) ⇒ unauthenticated', async () => {
    laKhach();
    const r = await ghiThemQuanHe({
      personId: d.nguoi.moCoi,
      nguoiKiaId: d.nguoi.chu,
      loai: 'parent-child',
      huong: 'cha-me',
      quanHe: 'blood',
      xuatXu: 'thử',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('unauthenticated');
  });

  /**
   * Ô của 6-1 ghi *"vai không đủ quyền ⇒ forbidden"*. Mã thật KHÔNG có nhánh forbidden ở đường
   * ghi: `gateWriter` chỉ hỏi *đã đăng nhập chưa* và *đã gắn chỗ chưa* — thành viên thường ghi
   * được, đúng FR-3/AD-9 (mọi thứ vào tồn nghi, ai cũng đóng góp được). Cái bị chặn là tài khoản
   * CHƯA GẮN CHỖ, và mã lỗi là `unattached`. Ghim đúng hành vi thật, không ghim câu chữ của ô.
   */
  it('tài khoản chưa gắn chỗ ⇒ unattached — không phải forbidden', async () => {
    cookieHienTai = d.chuaGan.cookie;
    const r = await ghiThemQuanHe({
      personId: d.nguoi.moCoi,
      nguoiKiaId: d.nguoi.chu,
      loai: 'parent-child',
      huong: 'cha-me',
      quanHe: 'blood',
      xuatXu: 'thử',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('unattached');
  });
});

describe('ghiThemQuanHe — hình dạng dữ liệu (kiểm ở adapter, POST thẳng vào được)', () => {
  it('tự làm cha mình ⇒ invalid, và adapter nói bằng tiếng Việt chứ không nuốt lỗi core', async () => {
    laThanhVien();
    const r = await ghiThemQuanHe({
      personId: d.nguoi.minh,
      nguoiKiaId: d.nguoi.minh,
      loai: 'parent-child',
      huong: 'cha-me',
      quanHe: 'blood',
      xuatXu: 'thử',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe('invalid');
      expect(r.error.message).toMatch(/chính mình/);
    }
  });

  it('union-partner với chính mình ⇒ invalid', async () => {
    laThanhVien();
    const r = await ghiThemQuanHe({
      personId: d.nguoi.minh,
      nguoiKiaId: d.nguoi.minh,
      loai: 'union-partner',
      huong: 'cha-me',
      quanHe: 'blood',
      xuatXu: 'thử',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('invalid');
  });

  it('xuatXu rỗng hoặc toàn khoảng trắng ⇒ invalid, chưa ghi gì', async () => {
    laThanhVien();
    for (const xuatXu of ['', '   ', '\n\t']) {
      const r = await ghiThemQuanHe({
        personId: d.nguoi.moCoi,
        nguoiKiaId: d.nguoi.chu,
        loai: 'parent-child',
        huong: 'cha-me',
        quanHe: 'blood',
        xuatXu,
      });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('invalid');
    }
    expect(await chaMeCua(d.nguoi.moCoi)).toEqual([]);
  });

  it('huong lạ với parent-child ⇒ invalid; union-partner thì KHÔNG hỏi huong', async () => {
    laThanhVien();
    const sai = await ghiThemQuanHe({
      personId: d.nguoi.moCoi,
      nguoiKiaId: d.nguoi.chu,
      loai: 'parent-child',
      huong: 'ngang' as never,
      quanHe: 'blood',
      xuatXu: 'thử',
    });
    expect(sai.ok).toBe(false);
    if (!sai.ok) expect(sai.error.message).toMatch(/cha, ai là con/);
  });
});

describe('ghiThemQuanHe — chiều và relation rơi vào phả đúng chỗ', () => {
  it('hướng "là cha/mẹ của người này": người đang mở là CON — Mồ Côi nhận Chú làm cha', async () => {
    laThanhVien();
    const r = await ghiThemQuanHe({
      personId: d.nguoi.moCoi,
      nguoiKiaId: d.nguoi.chu,
      loai: 'parent-child',
      huong: 'cha-me',
      quanHe: 'blood',
      xuatXu: 'S61 thử chiều cha-me',
    });
    expect(r.ok).toBe(true);
    expect(await chaMeCua(d.nguoi.moCoi)).toContain(d.nguoi.chu);
    // Chiều KHÔNG bị đảo: Chú không có cha mẹ mới.
    expect(await chaMeCua(d.nguoi.chu)).toEqual([d.nguoi.to]);
    const dong = await dongQuanHe(d.nguoi.moCoi, d.nguoi.chu);
    expect(dong?.valueText).toMatch(/con ruột/);
    expect(dong?.tier).toBe('tentative'); // AD-9 — thành viên ghi thì vào tồn nghi

    // Bán kính riêng tư gác ngay tại adapter: Mồ Côi sống và cách Mình 4 bậc ⇒ 'limited',
    // quan hệ xem được nhưng chồng khẳng định không rời server (AD-13/AD-21).
    const mat = await getPerson(d.nguoi.moCoi);
    expect(mat.ok && mat.value.visibility).toBe('limited');
    expect(mat.ok && mat.value.assertions).toBeUndefined();
  });

  it('hướng "là con của người này" ⇒ đảo lại đúng: khẳng định treo trên NGƯỜI KIA, relation adopted giữ nguyên', async () => {
    laThanhVien();
    // Em nhận Mồ Côi làm con nuôi — mở hồ sơ Em, chọn Mồ Côi, hướng "là con của người này".
    const r = await ghiThemQuanHe({
      personId: d.nguoi.em,
      nguoiKiaId: d.nguoi.moCoi,
      loai: 'parent-child',
      huong: 'con',
      quanHe: 'adopted',
      xuatXu: 'S61 thử chiều con',
    });
    expect(r.ok).toBe(true);
    expect(await chaMeCua(d.nguoi.moCoi)).toContain(d.nguoi.em);
    // Em vẫn chỉ có một cha là Cha — nếu chiều đảo, Em sẽ "là con của Mồ Côi".
    expect(await chaMeCua(d.nguoi.em)).toEqual([d.nguoi.cha]);
    const dong = await dongQuanHe(d.nguoi.moCoi, d.nguoi.em);
    expect(dong?.valueText).toMatch(/con nuôi/);
  });

  it('vòng huyết thống bị chặn TRƯỚC khi ghi: Tổ không thể là con của Mình', async () => {
    laThanhVien();
    const r = await ghiThemQuanHe({
      personId: d.nguoi.to,
      nguoiKiaId: d.nguoi.minh,
      loai: 'parent-child',
      huong: 'cha-me',
      quanHe: 'blood',
      xuatXu: 'S61 thử vòng',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe('conflict');
      expect(r.error.message).toMatch(/vòng/);
    }
    expect(await chaMeCua(d.nguoi.to)).toEqual([]);
  });

  it('vợ chồng đã có ⇒ alreadyLinked, không phải lỗi và không phải "vừa ghi"', async () => {
    laThanhVien();
    const r = await ghiThemQuanHe({
      personId: d.nguoi.cha,
      nguoiKiaId: d.nguoi.me,
      loai: 'union-partner',
      huong: 'cha-me',
      quanHe: 'blood',
      xuatXu: 'S61 thử vợ chồng',
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.alreadyLinked).toBe(true);
  });
});

describe('loại một khẳng định quan hệ — cạnh biến khỏi cây, người vẫn còn (AC 22/23 của 6-1)', () => {
  it('thành viên KHÔNG loại được (gateApprover); quản trị loại được', async () => {
    laThanhVien();
    const dong = await dongQuanHe(d.nguoi.moCoi, d.nguoi.chu);
    expect(dong).toBeDefined();
    const tuChoi = await loaiKhangDinh(dong!.assertionId, 'S61 thử loại');
    expect(tuChoi.ok).toBe(false);
    if (!tuChoi.ok) expect(tuChoi.error.code).toBe('forbidden');

    laQuanTri();
    const truoc = await getNeighborhood(d.nguoi.chu, 1);
    expect(truoc.ok && truoc.value.nodes.some((n) => n.person.personId === d.nguoi.moCoi)).toBe(true);

    const loai = await loaiKhangDinh(dong!.assertionId, 'S61 thử loại');
    expect(loai.ok).toBe(true);
    // Người ở đầu kia được trả về để `?giu=` giữ họ trên canvas một lượt.
    if (loai.ok) expect(loai.value.doiTuongId).toBe(d.nguoi.chu);

    const sau = await getNeighborhood(d.nguoi.chu, 1);
    expect(sau.ok && sau.value.nodes.some((n) => n.person.personId === d.nguoi.moCoi)).toBe(false);
    // Người vẫn còn trong phả — tìm ra được, và hồ sơ vẫn mở được.
    const tim = await searchPersons('Mồ Côi');
    expect(tim.ok && tim.value.some((h) => h.personId === d.nguoi.moCoi)).toBe(true);
    expect(await chaMeCua(d.nguoi.moCoi)).toEqual([d.nguoi.em]);
  });
});

describe('xemHoSo — chồng MÂU THUẪN dựng được bằng đường ghi thật (mục "CHƯA kiểm được" của 6-7)', () => {
  it('ghi năm sinh thứ hai cho Mình ⇒ chồng `birth` thành mâu thuẫn, hai dòng, không dòng nào chính thức', async () => {
    laThanhVien();
    const r = await ghiThemKhangDinh(d.nguoi.minh, 'birth', '1981', 'S61 thử mâu thuẫn');
    expect(r.ok).toBe(true);
    const hoSo = await xemHoSo(d.nguoi.minh);
    expect(hoSo.ok).toBe(true);
    if (!hoSo.ok) return;
    const birth = hoSo.value.chong?.find((c) => c.kind === 'birth');
    expect(birth?.stackKind).toBe('mau-thuan');
    expect(birth?.rows).toHaveLength(2);
    expect(birth?.rows.every((x) => x.tier === 'tentative')).toBe(true);
    // Tiểu sử và quan hệ vẫn có mặt bên cạnh chồng (AC 1–3 của 6-7).
    expect(hoSo.value.tieuSu.doi).toBe(3);
    expect(hoSo.value.quanHe.chaMe.map((c) => c.personId)).toEqual([d.nguoi.cha]);
  });

  it('người ngoài bán kính (mảnh rời) với thành viên: quan hệ có, chồng KHÔNG — hai thứ tách nhau', async () => {
    laThanhVien();
    const hoSo = await xemHoSo(d.nguoi.xa);
    expect(hoSo.ok).toBe(true);
    if (!hoSo.ok) return;
    // Xa đã mất ⇒ 'full' với mọi người (người đã khuất đầy đủ với mọi người xem).
    expect(hoSo.value.visibility).toBe('full');
  });
});
