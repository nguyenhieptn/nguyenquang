/**
 * DÒNG HỌ THỬ — một dòng họ dựng rồi bỏ, để đường GHI đi qua được mà không chạm phả thật.
 *
 * ── Vì sao nó phải tồn tại ──────────────────────────────────────────────────────────────────
 * Story 6-1 để trống bảy ô test cho `ghiThemQuanHe` vì server action `'use server'` đòi một
 * phiên thật, và repo chưa có tầng test nào cho adapter. Story 6-6 chốt bộ đo CHỈ ĐỌC, và kết
 * toán thẳng: *"6-1 vẫn không đóng được nhờ story này. Cần một dòng họ THỬ, và cần một quyết
 * định riêng."* Đây là quyết định ấy (29/08/2026): dựng dòng họ thử ở tầng `core/gates/` — nơi
 * `identity.test.ts` đã dựng một cái cho riêng nó từ 1-4, chỉ chưa ai gói lại để dùng chung.
 *
 * ── Vì sao ở `core/gates/` chứ không ở `app/` ────────────────────────────────────────────────
 * Lint AD-1 cấm `app/**` — kể cả `*.test.ts` — chạm `@/db`, `drizzle-orm` và `@/core/*\/ops`.
 * Đúng, và không có ngoại lệ cho test: một bài test được chạm db là một bài test dạy người sau
 * rằng adapter chạm db được. Nên phần dựng dữ liệu sống ở đây, và bài test ở `app/` chỉ nhận về
 * id với cookie — đúng thứ một adapter thật cũng chỉ có.
 *
 * ── Phiên là THẬT ─────────────────────────────────────────────────────────────────────────
 * Không giả `resolveSession`. Tài khoản tạo qua Better Auth, đăng nhập lấy cookie, và bài test
 * đưa cookie ấy vào `next/headers` (mock ở tầng test). Mọi thứ từ đó xuống — `resolveSessionImpl`,
 * `soleClanId`, RLS — chạy y như trong một request. Giả phiên là bỏ qua đúng tầng mà AD-24 dựng
 * ra để gác.
 *
 * ── Hai người dùng ────────────────────────────────────────────────────────────────────────
 * Cùng một hàm cho bài test (`vitest`, dựng rồi dọn) và cho script `scripts/dong-ho-thu.ts`
 * (dựng để mở trình duyệt xem, giữ lại tới khi gọi `--go`). Hai nơi, một hình dữ liệu, để thứ
 * bài test thấy cũng là thứ mắt người thấy.
 */
import { inArray } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { dbGlobal, ownerPool, withClanContext } from '@/db';
import { authUser, clan } from '@/db/schema';
import { auth } from '@/core/identity/ba';
import { createAdmin } from '@/core/identity/bootstrap';
import { approveAttachmentOp, requestAttachmentOp } from '@/core/identity/ops';
import type { SessionContext } from '@/core/identity/session';
import { createPersonOp } from '@/core/person/ops';
import { addPlaceOps, listPlacesOps } from '@/core/place/ops';
import { addAssertionOp } from '@/core/assertion/ops';

/** Thứ tự xoá theo khoá ngoại — bảng con trước. Cùng danh sách `rls.gate.test.ts § PARTITIONED_TABLES`. */
const BANG_PHAN_VUNG = [
  'notification',
  'merge_proposal',
  'recording_subject',
  'recording',
  'attachment',
  'assertion',
  'union',
  'source',
  'revision',
  'place',
  'person',
] as const;

export type TaiKhoanThu = {
  email: string;
  matKhau: string;
  /** Tên đăng nhập — `createAdmin` suy từ họ tên; tài khoản thành viên đặt thẳng. */
  tenDangNhap: string;
  accountId: string;
  /** Cookie phiên đã đăng nhập — đưa vào header `cookie` là thành một request thật. */
  cookie: string;
  personId: string | null;
};

/**
 * Cây thử — nhỏ, nhưng có đủ ca mà đường SỬA cần: ba đời, một cặp vợ chồng, hai anh em, một
 * người chú không con, một mảnh rời không nối, và một người CHƯA có cha để nối thử.
 *
 *   Tổ (1920–1990)
 *   ├─ Cha (1950–) ⚭ Mẹ (1952–)
 *   │    ├─ Mình (1980–)   ← thành viên gắn vào đây
 *   │    └─ Em (1984–)
 *   └─ Chú (1955–)
 *   Rời:  Xa (1930–2000)   ← mảnh chưa nối
 *   Chưa cha: Mồ Côi (1990–) ← để test "nối vào người đã có"
 */
export type NguoiThu = {
  to: string;
  cha: string;
  me: string;
  minh: string;
  em: string;
  chu: string;
  xa: string;
  moCoi: string;
};

export type DongHoThu = {
  clanId: string;
  /** Tiền tố in lên mọi tên, để dữ liệu thử nhận ra được bằng mắt và dọn được bằng máy. */
  tienTo: string;
  quanTri: TaiKhoanThu;
  thanhVien: TaiKhoanThu;
  /** Tài khoản có thật nhưng CHƯA gắn chỗ — trạng thái thường trực của FR-64. */
  chuaGan: TaiKhoanThu;
  nguoi: NguoiThu;
  /** Biến môi trường trước khi ghim, để trả lại đúng nguyên trạng. */
  ghimTruoc: string | undefined;
};

async function dangNhap(email: string, matKhau: string): Promise<string> {
  const res = await auth.api.signInEmail({ body: { email, password: matKhau }, returnHeaders: true });
  const cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');
  if (!cookie.includes('session_token')) throw new Error(`dong-ho-thu: đăng nhập ${email} không ra cookie phiên`);
  return cookie;
}

/**
 * Dựng. `ghim` = đặt `GIAPHA_CLAN_ID` trỏ vào dòng họ thử — bài test cần (cùng DB với phả thật),
 * script mở trình duyệt thì tự đặt biến ấy cho tiến trình `next start` của nó.
 */
export async function dungDongHoThu(o: { tienTo?: string; ghim?: boolean } = {}): Promise<DongHoThu> {
  const run = uuidv7().slice(-6);
  const tienTo = o.tienTo ?? `T${run}`;
  const ghimTruoc = process.env.GIAPHA_CLAN_ID;

  const clanId = uuidv7();
  await withClanContext(clanId, (tx) =>
    tx.insert(clan).values({
      id: clanId,
      name: `Dòng họ thử ${tienTo}`,
      settings: { surname: 'Thử', middleName: tienTo, motto: '試', mottoPhonetic: 'Thí' },
    }),
  );
  if (o.ghim !== false) process.env.GIAPHA_CLAN_ID = clanId;

  const matKhau = `Thu-${run}!mat-khau`;
  const quanTriEmail = `thu-quan-tri-${run}@test.local`;
  const admin = await createAdmin({
    clanId,
    email: quanTriEmail,
    password: matKhau,
    name: `${tienTo} Nguyễn Thử Quản Trị`,
    username: `thu.quan.tri.${run}`,
    birthYear: 1975,
  });
  const adminCtx: SessionContext = { accountId: admin.accountId, clanId, personId: admin.personId, role: 'admin' };

  // Cây thử — ghi qua ĐÚNG đường ghi (AD-9): mọi thứ vào tầng tồn nghi, có nguồn, có nhật ký.
  const nguon = { kind: 'told-by' as const, description: `${tienTo} — dữ liệu thử` };
  const ten = (t: string) => `${tienTo} ${t}`;
  const nam = (y: number) => ({ date: `${y}-01-01`, precision: 'year' as const });
  const nguoi = await withClanContext(clanId, async (tx) => {
    const tao = async (input: Parameters<typeof createPersonOp>[2]) => {
      const r = await createPersonOp(tx, adminCtx, input);
      if (!r.ok) throw new Error(`dong-ho-thu: ${r.error.code} — ${r.error.message}`);
      return r.value.personId;
    };
    const to = await tao({ fullName: ten('Nguyễn Thử Tổ'), gender: 'male', birth: nam(1920), death: nam(1990), source: nguon });
    const cha = await tao({ fullName: ten('Nguyễn Thử Cha'), gender: 'male', birth: nam(1950), parentId: to, source: nguon });
    const me = await tao({ fullName: ten('Trần Thị Mẹ'), gender: 'female', birth: nam(1952), partnerId: cha, source: nguon });
    const minh = await tao({ fullName: ten('Nguyễn Thử Mình'), gender: 'male', birth: nam(1980), parentId: cha, source: nguon });
    const em = await tao({ fullName: ten('Nguyễn Thử Em'), gender: 'female', birth: nam(1984), parentId: cha, source: nguon });
    const chu = await tao({ fullName: ten('Nguyễn Thử Chú'), gender: 'male', birth: nam(1955), parentId: to, source: nguon });
    const xa = await tao({ fullName: ten('Lê Văn Xa'), gender: 'male', birth: nam(1930), death: nam(2000), source: nguon });
    const moCoi = await tao({ fullName: ten('Nguyễn Thử Mồ Côi'), gender: 'male', birth: nam(1990), source: nguon });
    return { to, cha, me, minh, em, chu, xa, moCoi } satisfies NguoiThu;
  });

  // Hai nơi cùng tên khác đơn vị cha — để màn Nơi chốn (6-4) có gì để sửa, gộp, và một nhóm
  // "trùng tên" để bày. Cùng tên khác đơn vị cha là hai nơi THẬT (FR-65), gộp hay không là việc
  // của người nhìn.
  await withClanContext(clanId, async (tx) => {
    for (const [name, parentUnit] of [
      [ten('Quang Trung'), 'Định Hoá, Thái Nguyên'],
      [ten('Quang Trung'), 'Vũng Tàu'],
      [ten('Làng Giữa'), ''],
    ] as const) {
      const r = await addPlaceOps(tx, adminCtx, { name, parentUnit });
      if (!r.ok) throw new Error(`dong-ho-thu: nơi — ${r.error.message}`);
    }
  });

  // Ba mâu thuẫn, mỗi lớp một (story 6-5): Chú có hai năm sinh; một người con có HAI cha ruột
  // (Cha và Chú, cùng giới); Em có hai quê quán khác nơi. Không đụng vào Mình / Mồ Côi — bài test
  // adapter của 6-1 dựng ca của nó trên hai người ấy.
  await withClanContext(clanId, async (tx) => {
    const ghi = async (personId: string, spec: Parameters<typeof addAssertionOp>[2]['spec']) => {
      const r = await addAssertionOp(tx, adminCtx, { personId, spec, source: nguon });
      if (!r.ok) throw new Error(`dong-ho-thu: mâu thuẫn — ${r.error.message}`);
    };
    await ghi(nguoi.chu, { kind: 'birth', value: { date: '1956-01-01', precision: 'year' } });
    // Story 7-5: Tổ có ngày giỗ 15/8 (lịch giỗ có gì để bày); Xa mất ngày chính xác ⇒ phiếu có gợi ý.
    await ghi(nguoi.to, { kind: 'gio', thang: 8, ngay: 15 });
    await ghi(nguoi.xa, { kind: 'death', value: { date: '2000-10-06', precision: 'exact' } });
    const haiCha = await createPersonOp(tx, adminCtx, { fullName: ten('Nguyễn Thử Hai Cha'), gender: 'male', birth: nam(1985), parentId: nguoi.cha, source: nguon });
    if (!haiCha.ok) throw new Error(haiCha.error.message);
    await ghi(haiCha.value.personId, { kind: 'parent-child', parentId: nguoi.chu });
    // Hỏng thì NÉM như hai mâu thuẫn kia — bộ đo hứa ba mâu thuẫn, im lặng là hứa suông.
    const noi = await listPlacesOps(tx);
    if (!noi.ok) throw new Error(`dong-ho-thu: nơi — ${noi.error.message}`);
    const que = noi.value.filter((n) => n.name === ten('Quang Trung'));
    if (que.length !== 2) throw new Error(`dong-ho-thu: cần đúng hai "Quang Trung", thấy ${que.length}`);
    for (const q of que) await ghi(nguoi.em, { kind: 'place', placeId: q.placeId, role: 'que-quan' });
  });

  // Thành viên: tài khoản thật, xin nhận chỗ "Mình", quản trị duyệt — đúng đường FR-64/AD-8.
  const thanhVienEmail = `thu-thanh-vien-${run}@test.local`;
  const tvUser = await auth.api.signUpEmail({
    body: { email: thanhVienEmail, password: matKhau, name: `${tienTo} Nguyễn Thử Mình`, username: `thu.thanh.vien.${run}` },
  });
  await withClanContext(clanId, async (tx) => {
    const tvCtx: SessionContext = { accountId: tvUser.user.id, clanId, personId: null, role: 'guest' };
    const xin = await requestAttachmentOp(tx, tvCtx, { personId: nguoi.minh });
    if (!xin.ok) throw new Error(`dong-ho-thu: xin gắn — ${xin.error.message}`);
    const duyet = await approveAttachmentOp(tx, adminCtx, { attachmentId: xin.value.attachmentId, role: 'member' });
    if (!duyet.ok) throw new Error(`dong-ho-thu: duyệt gắn — ${duyet.error.message}`);
  });

  // Tài khoản chưa gắn chỗ — để test ca `unattached`.
  const chuaGanEmail = `thu-chua-gan-${run}@test.local`;
  const cgUser = await auth.api.signUpEmail({
    body: { email: chuaGanEmail, password: matKhau, name: `${tienTo} Người Chưa Gắn`, username: `thu.chua.gan.${run}` },
  });

  return {
    clanId,
    tienTo,
    ghimTruoc,
    nguoi,
    quanTri: {
      email: quanTriEmail,
      matKhau,
      tenDangNhap: `thu.quan.tri.${run}`,
      accountId: admin.accountId,
      cookie: await dangNhap(quanTriEmail, matKhau),
      personId: admin.personId,
    },
    thanhVien: {
      email: thanhVienEmail,
      matKhau,
      tenDangNhap: `thu.thanh.vien.${run}`,
      accountId: tvUser.user.id,
      cookie: await dangNhap(thanhVienEmail, matKhau),
      personId: nguoi.minh,
    },
    chuaGan: {
      email: chuaGanEmail,
      matKhau,
      tenDangNhap: `thu.chua.gan.${run}`,
      accountId: cgUser.user.id,
      cookie: await dangNhap(chuaGanEmail, matKhau),
      personId: null,
    },
  };
}

/** Dọn sạch — mọi hàng phân vùng của dòng họ thử, rồi chính dòng họ, rồi ba tài khoản. */
export async function donDongHoThu(d: Pick<DongHoThu, 'clanId' | 'ghimTruoc'> & { emails: string[] }): Promise<void> {
  const owner = ownerPool();
  try {
    await owner.query('BEGIN');
    await owner.query(`SET LOCAL app.clan_id = '${d.clanId}'`);
    for (const tbl of BANG_PHAN_VUNG) await owner.query(`DELETE FROM "${tbl}" WHERE clan_id = $1`, [d.clanId]);
    await owner.query('DELETE FROM clan WHERE id = $1', [d.clanId]);
    await owner.query('COMMIT');
  } finally {
    await owner.end();
  }
  // Bảng danh tính không có RLS — phiên và account cascade theo user.
  if (d.emails.length) await dbGlobal.delete(authUser).where(inArray(authUser.email, d.emails));
  if (d.ghimTruoc === undefined) delete process.env.GIAPHA_CLAN_ID;
  else process.env.GIAPHA_CLAN_ID = d.ghimTruoc;
}

/** Liệt kê mọi dòng họ thử còn trong database — script `--go` dùng để dọn cái đã quên. */
export async function lietKeDongHoThu(): Promise<{ id: string; name: string }[]> {
  const owner = ownerPool();
  try {
    const r = await owner.query<{ id: string; name: string }>(
      `select id, name from clan where name like 'Dòng họ thử %' order by created_at`,
    );
    return r.rows;
  } finally {
    await owner.end();
  }
}
