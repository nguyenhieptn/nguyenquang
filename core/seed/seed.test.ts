/**
 * Story 1-8 — core/seed tests: template ↔ parser round-trip, per-row parse errors, preview
 * classification (khớp / mới / nghi trùng), father-not-found (FR-63), topological commit,
 * link-not-duplicate, union dedupe, permission gates. Real DB (pattern from
 * core/gates/rls.gate.test.ts): data prefixed S18, fresh clan id per run, cleanup via
 * ownerPool with SET LOCAL.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { and, eq, inArray } from 'drizzle-orm';
import { withClanContext, ownerPool } from '@/db';
import { assertion, clan, person, source } from '@/db/schema';
import type { GuestContext, SessionContext } from '@/core/identity/session';
import { createPersonOp } from '@/core/person/ops';
import { getTemplate, parseSeedCsv } from './csv';
import { commitSeedOp, previewSeedOp } from './ops';

const owner = ownerPool();
const clanId = uuidv7();

const admin: SessionContext = { accountId: 's18-seed-admin', clanId, personId: uuidv7(), role: 'admin' };
const member: SessionContext = { accountId: 's18-seed-member', clanId, personId: uuidv7(), role: 'member' };
const guest: GuestContext = { accountId: null, clanId, personId: null, role: 'guest' };

const HEADER = 'ho_ten,gioi_tinh,nam_sinh,nam_mat,ten_cha,ten_vo_chong,chi,ghi_chu';
const csvOf = (...lines: string[]) => [HEADER, ...lines].join('\n');

/** Existing clan people the preview must match against. */
let giapId: string; // unique name, birth 1900
const atIds: string[] = []; // duplicated name in the clan → nghi-trung
let maoId: string; // unique name, birth 1950 — the CSV will claim 1800

beforeAll(async () => {
  await withClanContext(clanId, async (tx) => {
    await tx.insert(clan).values({ id: clanId, name: 'S18 Seed Test Clan' });
  });
  const fixture = async (
    fullName: string,
    birthYear: number | null,
    deathYear: number | null,
  ): Promise<string> =>
    withClanContext(clanId, async (tx) => {
      const res = await createPersonOp(tx, admin, {
        fullName,
        birth: birthYear !== null ? { date: `${birthYear}-01-01`, precision: 'year' } : undefined,
        death: deathYear !== null ? { date: `${deathYear}-01-01`, precision: 'year' } : undefined,
        source: { kind: 'document', description: 'S18 fixture' },
      });
      if (!res.ok) throw new Error(res.error.message);
      return res.value.personId;
    });

  giapId = await fixture('S18 Nguyễn Văn Giáp', 1900, 1960);
  atIds.push(await fixture('S18 Nguyễn Văn Ất', 1910, null));
  atIds.push(await fixture('S18 Nguyễn Văn Ất', 1912, null));
  maoId = await fixture('S18 Nguyễn Văn Mão', 1950, null);
});

afterAll(async () => {
  await owner.query('BEGIN');
  await owner.query(`SET LOCAL app.clan_id = '${clanId}'`);
  for (const tbl of ['notification', 'assertion', 'revision', 'source', 'union', 'person']) {
    await owner.query(`DELETE FROM "${tbl}" WHERE clan_id = $1`, [clanId]);
  }
  await owner.query('DELETE FROM clan WHERE id = $1', [clanId]);
  await owner.query('COMMIT');
  await owner.end();
});

describe('template + parser', () => {
  it('the template parses through its own parser', () => {
    const parsed = parseSeedCsv(getTemplate());
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value).toHaveLength(2);
    const [first, second] = parsed.value;
    expect(first!.hoTen).toBe('Nguyễn Văn An');
    expect(first!.gioiTinh).toBe('nam');
    expect(first!.namSinh).toBe(1900);
    expect(first!.namMat).toBe(1972);
    expect(first!.tenCha).toBeNull(); // fragment-root candidate
    expect(first!.tenVoChong).toBe('Trần Thị Bốn');
    expect(second!.tenCha).toBe(first!.hoTen); // father-by-name within the file
    expect(second!.line).toBe(3);
  });

  it('collects EVERY row problem with its line number', () => {
    const parsed = parseSeedCsv(
      csvOf('S18 Ai Đó,nam,năm-nào-đó,,,,,', ' ,nu,1900,,,,,', 'S18 Người Ngược,nu,1980,1930,,,,'),
    );
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error.code).toBe('invalid');
    expect(parsed.error.message).toMatch(/line 2.*nam_sinh/);
    expect(parsed.error.message).toMatch(/line 3.*ho_ten/);
    expect(parsed.error.message).toMatch(/line 4.*nam_mat 1930 is before nam_sinh 1980/);
  });

  it('rejects a header that is not exactly the contract columns', () => {
    const parsed = parseSeedCsv('ho_ten,gioi_tinh\nS18 Ai Đó,nam');
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error.message).toMatch(/missing column/);
  });
});

describe('previewSeed — no writes, nothing preselected', () => {
  it('classifies match / new / suspect against the seeded clan', async () => {
    const parsed = parseSeedCsv(
      csvOf(
        'S18 Nguyễn Văn Giáp,nam,1901,1960,,,,', // 1 candidate, year within tolerance → khớp
        'S18 Người Hoàn Toàn Mới,,,,,,,', // no candidate → mới
        'S18 Nguyễn Văn Ất,nam,1910,,,,,', // 2 candidates → nghi trùng
        'S18 Nguyễn Văn Mão,,1800,,,,,', // 1 candidate but years conflict → nghi trùng
      ),
    );
    if (!parsed.ok) throw new Error(parsed.error.message);
    const preview = await withClanContext(clanId, (tx) => previewSeedOp(tx, admin, parsed.value));
    expect(preview.ok).toBe(true);
    if (!preview.ok) return;
    const [khop, moi, trungTen, lechNam] = preview.value.rows;

    expect(khop!.classification).toBe('khop-nguoi-co-san');
    expect(khop!.candidates).toHaveLength(1);
    expect(khop!.candidates[0]).toEqual({ personId: giapId, name: 'S18 Nguyễn Văn Giáp', birthYear: 1900 });

    expect(moi!.classification).toBe('nguoi-moi');
    expect(moi!.candidates).toHaveLength(0);

    expect(trungTen!.classification).toBe('nghi-trung');
    expect(trungTen!.candidates.map((c) => c.personId).sort()).toEqual([...atIds].sort());

    expect(lechNam!.classification).toBe('nghi-trung');
    expect(lechNam!.candidates.map((c) => c.personId)).toEqual([maoId]);
  });

  it('duplicate names INSIDE the file ⇒ nghi-trung on both rows', async () => {
    const parsed = parseSeedCsv(
      csvOf('S18 Trùng Trong Tệp,nam,1920,,,,,', 'S18 Trùng Trong Tệp,nam,1955,,,,,'),
    );
    if (!parsed.ok) throw new Error(parsed.error.message);
    const preview = await withClanContext(clanId, (tx) => previewSeedOp(tx, admin, parsed.value));
    expect(preview.ok).toBe(true);
    if (!preview.ok) return;
    for (const row of preview.value.rows) {
      expect(row.classification).toBe('nghi-trung');
      expect(row.warnings).toContain('duplicate-in-file');
    }
  });

  /**
   * HỒI QUY 24/08/2026 — trước bản sửa, `resolveByName` lấy dòng trùng tên ĐẦU TIÊN trong tệp
   * mà không kiểm có dòng thứ hai không, nên người con nối âm thầm vào nhầm cha (sai cả chi) và
   * lệnh nạp vẫn báo thành công. Đây là ca chắc chắn gặp khi cả họ chung chữ đệm.
   */
  it('hai dòng TRÙNG TÊN cha ⇒ KHÔNG đoán: con vào phả mà không có mối cha–con', async () => {
    const parsed = parseSeedCsv(
      csvOf(
        'S18 Hùng Trùng Tên,nam,1943,,,,Chi Nhất,bác cả',
        'S18 Hùng Trùng Tên,nam,1961,,,,Chi Ba,chú út — trùng tên với dòng trên',
        'S18 Con Của Chú Út,nam,1990,,S18 Hùng Trùng Tên,,Chi Ba,cha là người sinh 1961',
      ),
    );
    if (!parsed.ok) throw new Error(parsed.error.message);
    const committed = await withClanContext(clanId, (tx) =>
      commitSeedOp(tx, admin, { rows: parsed.value, decisions: {} }),
    );
    expect(committed.ok).toBe(true);
    if (!committed.ok) return;
    expect(committed.value.created).toBe(3);

    await withClanContext(clanId, async (tx) => {
      const [con] = await tx
        .select()
        .from(person)
        .where(eq(person.nameFolded, 's18 con cua chu ut'));
      const edges = await tx
        .select()
        .from(assertion)
        .where(and(eq(assertion.subjectPersonId, con!.id), eq(assertion.kind, 'parent-child')));
      // KHÔNG mối nào — thà thiếu còn hơn nối nhầm. Nối tay ở màn Mảnh chưa nối.
      expect(edges).toHaveLength(0);
    });
  });

  it('xem trước cảnh báo father-ambiguous, và KHÔNG nhầm nó với father-not-found', async () => {
    const parsed = parseSeedCsv(
      csvOf(
        'S18 Xem Trước Trùng,nam,1940,,,,,',
        'S18 Xem Trước Trùng,nam,1958,,,,,',
        'S18 Con Mơ Hồ,nam,1988,,S18 Xem Trước Trùng,,,', // hai dòng cùng tên ⇒ mơ hồ
        'S18 Con Mất Cha,nam,1988,,S18 Không Ai Tên Thế,,,', // không ai ⇒ không tìm thấy
        'S18 Con Của Ất,nam,1945,,S18 Nguyễn Văn Ất,,,', // HAI người trong PHẢ trùng tên ⇒ mơ hồ
      ),
    );
    if (!parsed.ok) throw new Error(parsed.error.message);
    const preview = await withClanContext(clanId, (tx) => previewSeedOp(tx, admin, parsed.value));
    expect(preview.ok).toBe(true);
    if (!preview.ok) return;
    const canhBaoCua = (ten: string) =>
      preview.value.rows.find((r) => r.hoTen === ten)!.warnings;

    expect(canhBaoCua('S18 Con Mơ Hồ')).toContain('father-ambiguous');
    expect(canhBaoCua('S18 Con Mơ Hồ')).not.toContain('father-not-found');

    expect(canhBaoCua('S18 Con Mất Cha')).toContain('father-not-found');
    expect(canhBaoCua('S18 Con Mất Cha')).not.toContain('father-ambiguous');

    // Mơ hồ vì trong PHẢ có hai người trùng tên, không phải vì trong tệp.
    expect(canhBaoCua('S18 Con Của Ất')).toContain('father-ambiguous');
  });

  it('a father named but found NOWHERE gets the father-not-found warning; one found in the file does not', async () => {
    const parsed = parseSeedCsv(
      csvOf(
        'S18 Mồ Côi Trong Phả,nam,1930,,S18 Cha Không Ai Biết,,,', // father nowhere → warning
        'S18 Cha Trong Tệp,nam,1900,1970,,,,',
        'S18 Con Trong Tệp,nam,1931,,S18 Cha Trong Tệp,,,', // father on another row → fine
        'S18 Con Của Giáp,nu,1935,,S18 Nguyễn Văn Giáp,,,', // father in the clan → fine
      ),
    );
    if (!parsed.ok) throw new Error(parsed.error.message);
    const preview = await withClanContext(clanId, (tx) => previewSeedOp(tx, admin, parsed.value));
    expect(preview.ok).toBe(true);
    if (!preview.ok) return;
    const [orphan, , conTrongTep, conCuaGiap] = preview.value.rows;
    expect(orphan!.warnings).toContain('father-not-found');
    expect(conTrongTep!.warnings).not.toContain('father-not-found');
    expect(conCuaGiap!.warnings).not.toContain('father-not-found');
  });

  it('preview requires the approval right', async () => {
    const parsed = parseSeedCsv(csvOf('S18 Ai Đó,nam,1900,,,,,'));
    if (!parsed.ok) throw new Error(parsed.error.message);
    const asMember = await withClanContext(clanId, (tx) => previewSeedOp(tx, member, parsed.value));
    expect(asMember.ok).toBe(false);
    if (!asMember.ok) expect(asMember.error.code).toBe('forbidden');
  });
});

describe('commitSeed — one transaction, parents before children, everything tentative', () => {
  it('creates the father listed BELOW his child first, and wires the parent-child edge', async () => {
    const parsed = parseSeedCsv(
      csvOf(
        'S18 Con Trai Cả,nam,1930,,S18 Cha Dòng Dưới,,Chi Hai,ghi chú của con',
        'S18 Cha Dòng Dưới,nam,1905,1980,,,Chi Hai,',
      ),
    );
    if (!parsed.ok) throw new Error(parsed.error.message);
    const committed = await withClanContext(clanId, (tx) =>
      commitSeedOp(tx, admin, { rows: parsed.value, decisions: {} }),
    );
    expect(committed.ok).toBe(true);
    if (!committed.ok) return;
    expect(committed.value).toMatchObject({ created: 2, linked: 0, skipped: 0 });
    expect(committed.value.createdPersonIds).toHaveLength(2);

    await withClanContext(clanId, async (tx) => {
      const [con] = await tx.select().from(person).where(eq(person.nameFolded, 's18 con trai ca'));
      const [cha] = await tx.select().from(person).where(eq(person.nameFolded, 's18 cha dong duoi'));
      expect(con).toBeTruthy();
      expect(cha).toBeTruthy();
      expect(cha!.isLiving).toBe(false); // nam_mat 1980 became a death assertion

      // The edge: subject = CON, object = CHA (AD-18), tentative (AD-9), sourced 'seed-import'.
      const edges = await tx
        .select()
        .from(assertion)
        .where(and(eq(assertion.subjectPersonId, con!.id), eq(assertion.kind, 'parent-child')));
      expect(edges).toHaveLength(1);
      expect(edges[0]!.objectPersonId).toBe(cha!.id);
      expect(edges[0]!.tier).toBe('tentative');
      const [src] = await tx.select().from(source).where(eq(source.id, edges[0]!.sourceId));
      expect(src!.kind).toBe('seed-import');
      expect(src!.description).toMatch(/CSV/);

      // The father has no parent edge — he is a fragment root (FR-63).
      const chaEdges = await tx
        .select()
        .from(assertion)
        .where(and(eq(assertion.subjectPersonId, cha!.id), eq(assertion.kind, 'parent-child')));
      expect(chaEdges).toHaveLength(0);
    });
  });

  it('a linked row creates NO duplicate person and still receives its father edge', async () => {
    const parsed = parseSeedCsv(
      csvOf(
        'S18 Cha Của Giáp,nam,1870,1940,,,,',
        'S18 Nguyễn Văn Giáp,nam,1900,1960,S18 Cha Của Giáp,,,', // = existing giapId
      ),
    );
    if (!parsed.ok) throw new Error(parsed.error.message);
    const committed = await withClanContext(clanId, (tx) =>
      commitSeedOp(tx, admin, { rows: parsed.value, decisions: { 1: { action: 'link', personId: giapId } } }),
    );
    expect(committed.ok).toBe(true);
    if (!committed.ok) return;
    expect(committed.value).toMatchObject({ created: 1, linked: 1, skipped: 0 });
    expect(committed.value.createdPersonIds).toHaveLength(1);

    await withClanContext(clanId, async (tx) => {
      const sameName = await tx.select().from(person).where(eq(person.nameFolded, 's18 nguyen van giap'));
      expect(sameName).toHaveLength(1); // no duplicate — the existing person was reused
      const edges = await tx
        .select()
        .from(assertion)
        .where(and(eq(assertion.subjectPersonId, giapId), eq(assertion.kind, 'parent-child')));
      expect(edges).toHaveLength(1);
      expect(edges[0]!.objectPersonId).toBe(committed.value.createdPersonIds[0]);
    });
  });

  it('a spouse pair naming each other becomes ONE union with two memberships', async () => {
    const parsed = parseSeedCsv(
      csvOf(
        'S18 Chồng Mới,nam,1940,,,S18 Vợ Mới,,',
        'S18 Vợ Mới,nu,1945,,,S18 Chồng Mới,,',
      ),
    );
    if (!parsed.ok) throw new Error(parsed.error.message);
    const committed = await withClanContext(clanId, (tx) =>
      commitSeedOp(tx, admin, { rows: parsed.value, decisions: {} }),
    );
    expect(committed.ok).toBe(true);
    if (!committed.ok) return;

    await withClanContext(clanId, async (tx) => {
      const memberships = await tx
        .select()
        .from(assertion)
        .where(
          and(
            eq(assertion.kind, 'union-partner'),
            inArray(assertion.subjectPersonId, committed.value.createdPersonIds),
          ),
        );
      expect(memberships).toHaveLength(2); // dedupe: the mirrored row did not create a second union
      expect(new Set(memberships.map((m) => m.unionId)).size).toBe(1);
    });
  });

  it('skip skips, and a skipped father leaves the child a fragment root', async () => {
    const parsed = parseSeedCsv(
      csvOf('S18 Cha Bị Bỏ,nam,1890,1950,,,,', 'S18 Con Của Cha Bị Bỏ,nam,1925,,S18 Cha Bị Bỏ,,,'),
    );
    if (!parsed.ok) throw new Error(parsed.error.message);
    const committed = await withClanContext(clanId, (tx) =>
      commitSeedOp(tx, admin, { rows: parsed.value, decisions: { 0: { action: 'skip' } } }),
    );
    expect(committed.ok).toBe(true);
    if (!committed.ok) return;
    expect(committed.value).toMatchObject({ created: 1, linked: 0, skipped: 1 });

    await withClanContext(clanId, async (tx) => {
      const skippedRows = await tx.select().from(person).where(eq(person.nameFolded, 's18 cha bi bo'));
      expect(skippedRows).toHaveLength(0);
      const [child] = await tx.select().from(person).where(eq(person.nameFolded, 's18 con cua cha bi bo'));
      const edges = await tx
        .select()
        .from(assertion)
        .where(and(eq(assertion.subjectPersonId, child!.id), eq(assertion.kind, 'parent-child')));
      expect(edges).toHaveLength(0); // fragment root (FR-63)
    });
  });

  it('a ten_cha cycle inside the file is rejected before any write', async () => {
    const parsed = parseSeedCsv(
      csvOf('S18 Vòng Một,nam,1900,,S18 Vòng Hai,,,', 'S18 Vòng Hai,nam,1900,,S18 Vòng Một,,,'),
    );
    if (!parsed.ok) throw new Error(parsed.error.message);
    const committed = await withClanContext(clanId, (tx) =>
      commitSeedOp(tx, admin, { rows: parsed.value, decisions: {} }),
    );
    expect(committed.ok).toBe(false);
    if (committed.ok) return;
    expect(committed.error.code).toBe('invalid');
    expect(committed.error.message).toMatch(/cycle/);
    await withClanContext(clanId, async (tx) => {
      const rows = await tx.select().from(person).where(eq(person.nameFolded, 's18 vong mot'));
      expect(rows).toHaveLength(0);
    });
  });

  it('commit without the approval right → forbidden (member) / unauthenticated (guest)', async () => {
    const parsed = parseSeedCsv(csvOf('S18 Không Được Ghi,nam,1900,,,,,'));
    if (!parsed.ok) throw new Error(parsed.error.message);
    const asMember = await withClanContext(clanId, (tx) =>
      commitSeedOp(tx, member, { rows: parsed.value, decisions: {} }),
    );
    expect(asMember.ok).toBe(false);
    if (!asMember.ok) expect(asMember.error.code).toBe('forbidden');
    const asGuest = await withClanContext(clanId, (tx) =>
      commitSeedOp(tx, guest, { rows: parsed.value, decisions: {} }),
    );
    expect(asGuest.ok).toBe(false);
    if (!asGuest.ok) expect(asGuest.error.code).toBe('unauthenticated');
    await withClanContext(clanId, async (tx) => {
      const rows = await tx.select().from(person).where(eq(person.nameFolded, 's18 khong duoc ghi'));
      expect(rows).toHaveLength(0);
    });
  });
});

/**
 * Story 6-3 — ba lỗ im lặng của bộ nạp khung, và cái khe chung đã sinh ra cả ba: xem trước và
 * lượt ghi mỗi bên tự giải tên theo cách riêng. Cả ba ca dưới đây đều đã bật trên phả THẬT.
 */
describe('ba lỗ im lặng (story 6-3)', () => {
  it('vợ chồng không giải được ⇒ spouse-not-found; trùng tên ⇒ spouse-ambiguous', async () => {
    const parsed = parseSeedCsv(
      csvOf(
        'S18 Vợ Mơ Hồ,nu,1940,,,,,',
        'S18 Vợ Mơ Hồ,nu,1958,,,,,', // hai dòng cùng tên ⇒ bộ nạp từ chối đoán
        'S18 Chồng Của Vợ Mơ Hồ,nam,1938,,,S18 Vợ Mơ Hồ,,',
        'S18 Chồng Có Vợ Vắng,nam,1930,,,S18 Vợ Không Ai Biết,,',
        'S18 Chồng Của Ất,nu,1911,,,S18 Nguyễn Văn Ất,,', // HAI người trong PHẢ trùng tên
      ),
    );
    if (!parsed.ok) throw new Error(parsed.error.message);
    const preview = await withClanContext(clanId, (tx) => previewSeedOp(tx, admin, parsed.value));
    expect(preview.ok).toBe(true);
    if (!preview.ok) return;
    const canhBaoCua = (ten: string) => preview.value.rows.find((r) => r.hoTen === ten)!.warnings;

    expect(canhBaoCua('S18 Chồng Của Vợ Mơ Hồ')).toContain('spouse-ambiguous');
    expect(canhBaoCua('S18 Chồng Của Vợ Mơ Hồ')).not.toContain('spouse-not-found');

    expect(canhBaoCua('S18 Chồng Có Vợ Vắng')).toContain('spouse-not-found');
    expect(canhBaoCua('S18 Chồng Có Vợ Vắng')).not.toContain('spouse-ambiguous');

    // Mơ hồ vì trong PHẢ có hai người trùng tên, không phải vì trong tệp.
    expect(canhBaoCua('S18 Chồng Của Ất')).toContain('spouse-ambiguous');
  });

  it('vợ chồng giải được — trong tệp hoặc trong phả ⇒ KHÔNG cảnh báo', async () => {
    const parsed = parseSeedCsv(
      csvOf(
        'S18 Vợ Trong Tệp,nu,1932,,,,,',
        'S18 Chồng Trong Tệp,nam,1930,,,S18 Vợ Trong Tệp,,',
        'S18 Vợ Của Giáp,nu,1905,,,S18 Nguyễn Văn Giáp,,', // đúng MỘT người trong phả
      ),
    );
    if (!parsed.ok) throw new Error(parsed.error.message);
    const preview = await withClanContext(clanId, (tx) => previewSeedOp(tx, admin, parsed.value));
    expect(preview.ok).toBe(true);
    if (!preview.ok) return;
    for (const row of preview.value.rows) {
      expect(row.warnings).not.toContain('spouse-not-found');
      expect(row.warnings).not.toContain('spouse-ambiguous');
    }
  });

  /**
   * Vế (a) của `deferred-work.md`: cảnh báo THỪA. Bỏ một trong hai dòng trùng tên cha thì commit
   * nối được vào dòng còn lại — nhưng màn vẫn báo "gốc tạm của một mảnh".
   */
  it('vế (a): bỏ một trong hai dòng trùng tên cha ⇒ dòng con HẾT father-ambiguous', async () => {
    const parsed = parseSeedCsv(
      csvOf(
        'S18 Cha Hai Bản,nam,1940,,,,,',
        'S18 Cha Hai Bản,nam,1958,,,,,',
        'S18 Con Của Hai Bản,nam,1980,,S18 Cha Hai Bản,,,',
      ),
    );
    if (!parsed.ok) throw new Error(parsed.error.message);
    const mu = await withClanContext(clanId, (tx) => previewSeedOp(tx, admin, parsed.value));
    if (!mu.ok) throw new Error(mu.error.message);
    expect(mu.value.rows[2]!.warnings).toContain('father-ambiguous');

    const sang = await withClanContext(clanId, (tx) =>
      previewSeedOp(tx, admin, parsed.value, { 1: { action: 'skip' } }),
    );
    if (!sang.ok) throw new Error(sang.error.message);
    expect(sang.value.rows[2]!.warnings).not.toContain('father-ambiguous');
    expect(sang.value.rows[2]!.warnings).not.toContain('father-not-found');
  });

  /**
   * Vế (b): cảnh báo THIẾU — và đây là ca đã làm cây gia phả gãy làm hai mảnh trên phả thật.
   */
  it('vế (b): bỏ dòng duy nhất mang tên cha ⇒ dòng con ĐƯỢC cảnh báo mất cha', async () => {
    const parsed = parseSeedCsv(
      csvOf(
        'S18 Cha Duy Nhất Trong Tệp,nam,1900,,,,,',
        'S18 Con Của Cha Duy Nhất,nam,1935,,S18 Cha Duy Nhất Trong Tệp,,,',
      ),
    );
    if (!parsed.ok) throw new Error(parsed.error.message);
    const mu = await withClanContext(clanId, (tx) => previewSeedOp(tx, admin, parsed.value));
    if (!mu.ok) throw new Error(mu.error.message);
    expect(mu.value.rows[1]!.warnings).not.toContain('father-not-found');

    const sang = await withClanContext(clanId, (tx) =>
      previewSeedOp(tx, admin, parsed.value, { 0: { action: 'skip' } }),
    );
    if (!sang.ok) throw new Error(sang.error.message);
    /**
     * `father-skipped`, không phải `father-not-found` (sửa 27/08 sau code review): cha CÓ trong
     * tệp, chỉ là dòng ấy đang bị bỏ. Câu *"không có ai tên ấy — cả trong tệp lẫn trong phả"* ở
     * ca này là một khẳng định SAI, đặt ngay dưới một dòng mang đúng cái tên ấy.
     */
    expect(sang.value.rows[1]!.warnings).toContain('father-skipped');
    expect(sang.value.rows[1]!.warnings).not.toContain('father-not-found');
  });

  it('dòng bị BỎ mà có khai quan hệ ⇒ skip-drops-edges; dòng LINK thì không', async () => {
    const parsed = parseSeedCsv(
      csvOf(
        'S18 Bỏ Mà Có Cha,nam,1930,,S18 Ai Đó Làm Cha,,,',
        'S18 Bỏ Mà Chẳng Khai Gì,nam,1931,,,,,',
        'S18 Nguyễn Văn Giáp,nam,1900,1960,S18 Ai Đó Làm Cha,,,', // sẽ LINK vào giapId
      ),
    );
    if (!parsed.ok) throw new Error(parsed.error.message);
    const preview = await withClanContext(clanId, (tx) =>
      previewSeedOp(tx, admin, parsed.value, {
        0: { action: 'skip' },
        1: { action: 'skip' },
        2: { action: 'link', personId: giapId },
      }),
    );
    if (!preview.ok) throw new Error(preview.error.message);
    expect(preview.value.rows[0]!.warnings).toContain('skip-drops-edges');
    /**
     * Dòng bị bỏ VẪN mang cảnh báo mối nối — nó là câu trả lời cho *"nếu tôi tích lại thì sao"*,
     * và trên màn Nạp khung nó chính là LÝ DO dòng ấy bị để lại sẵn. Bản đầu 26/08 im nó đi, và
     * lượt soi bằng trình duyệt bắt được ngay: lý do biến mất đúng lúc cần đọc.
     */
    expect(preview.value.rows[0]!.warnings).toContain('father-not-found');
    expect(preview.value.rows[1]!.warnings).not.toContain('skip-drops-edges');
    // Dòng `link` vẫn được nối đủ cạnh, nên không mất gì — nhưng cha thì vẫn không tìm thấy.
    expect(preview.value.rows[2]!.warnings).not.toContain('skip-drops-edges');
    expect(preview.value.rows[2]!.warnings).toContain('father-not-found');
  });

  /**
   * BẤT BIẾN chống vòng lặp (QĐ-2 của story): màn Nạp khung suy quyết định ra từ phân loại, nên
   * phân loại không được suy ngược lại từ quyết định. `duplicate-in-file` cũng vậy — nó tả TỆP.
   */
  it('decisions KHÔNG đổi phân loại và KHÔNG đổi duplicate-in-file', async () => {
    const parsed = parseSeedCsv(
      csvOf(
        'S18 Song Sinh Tên,nam,1920,,,,,',
        'S18 Song Sinh Tên,nam,1955,,,,,',
        'S18 Nguyễn Văn Giáp,nam,1901,1960,,,,', // khớp người có sẵn
        'S18 Chẳng Ai Trùng Cả,nam,1990,,,,,', // người mới
      ),
    );
    if (!parsed.ok) throw new Error(parsed.error.message);
    const doc = async (decisions: Parameters<typeof previewSeedOp>[3]) => {
      const p = await withClanContext(clanId, (tx) => previewSeedOp(tx, admin, parsed.value, decisions));
      if (!p.ok) throw new Error(p.error.message);
      return p.value.rows;
    };
    const mu = await doc(undefined);
    const sang = await doc({ 0: { action: 'skip' }, 1: { action: 'create' } });

    expect(sang.map((r) => r.classification)).toEqual(mu.map((r) => r.classification));
    expect(sang[1]!.warnings).toContain('duplicate-in-file');
    expect(sang.map((r) => r.candidates.map((c) => c.personId))).toEqual(
      mu.map((r) => r.candidates.map((c) => c.personId)),
    );
  });


  /**
   * HỒI QUY 27/08 — bỏ tích một dòng mà DÒNG KHÁC khai nó làm cha thì chính dòng bị bỏ phải nói
   * ra. Bản đầu chỉ đếm cạnh dòng ấy KHAI, nên bỏ một cụ tổ (không khai gì) cho `warnings` rỗng:
   * dòng vừa bấm là dòng duy nhất im lặng, và nó rơi khỏi cả bộ lọc *Cần xem lại*.
   */
  it('bỏ một dòng mà dòng khác khai nó làm cha ⇒ CHÍNH dòng ấy mang skip-drops-edges', async () => {
    const parsed = parseSeedCsv(
      csvOf('S63 Cụ Tổ Không Khai Gì,nam,1890,,,,,', 'S63 Con Của Cụ Tổ,nam,1920,,S63 Cụ Tổ Không Khai Gì,,,'),
    );
    if (!parsed.ok) throw new Error(parsed.error.message);
    const p = await withClanContext(clanId, (tx) =>
      previewSeedOp(tx, admin, parsed.value, { 0: { action: 'skip' } }),
    );
    if (!p.ok) throw new Error(p.error.message);
    expect(p.value.rows[0]!.warnings).toContain('skip-drops-edges');
    // Và dòng con nói ĐÚNG lý do: cha có trong tệp, chỉ là đang bị bỏ.
    expect(p.value.rows[1]!.warnings).toContain('father-skipped');
    expect(p.value.rows[1]!.warnings).not.toContain('father-not-found');
  });

  /**
   * *"Không có ai tên ấy — cả trong tệp lẫn trong phả"* phải chỉ nói khi ĐÚNG là không có ai.
   * Từ khi xem trước biết `decisions`, "trong tệp" hết nghĩa là trong tệp, nên hai ca phải tách.
   */
  it('cha/vợ chồng KHÔNG có ở đâu ⇒ *-not-found; CÓ trong tệp mà bị bỏ ⇒ *-skipped', async () => {
    const parsed = parseSeedCsv(
      csvOf(
        'S63 Vợ Có Dòng,nu,1930,,,,,',
        'S63 Chồng Của Vợ Có Dòng,nam,1928,,,S63 Vợ Có Dòng,,',
        'S63 Chồng Vợ Không Ai Biết,nam,1930,,,S63 Chẳng Ai Tên Thế,,',
      ),
    );
    if (!parsed.ok) throw new Error(parsed.error.message);
    const p = await withClanContext(clanId, (tx) =>
      previewSeedOp(tx, admin, parsed.value, { 0: { action: 'skip' } }),
    );
    if (!p.ok) throw new Error(p.error.message);
    expect(p.value.rows[1]!.warnings).toContain('spouse-skipped');
    expect(p.value.rows[1]!.warnings).not.toContain('spouse-not-found');
    expect(p.value.rows[2]!.warnings).toContain('spouse-not-found');
    expect(p.value.rows[2]!.warnings).not.toContain('spouse-skipped');
  });

  /** Khoá `decisions` phải là chỉ số THẬT ở CẢ HAI cổng — hai cổng nói khác nhau là một lỗ. */
  it('khoá decisions lạ ⇒ cả xem trước lẫn lượt ghi cùng từ chối', async () => {
    const parsed = parseSeedCsv(csvOf('S63 Khoá Lạ,nam,1900,,,,,'));
    if (!parsed.ok) throw new Error(parsed.error.message);
    for (const khoa of [' 0', '1.0', '-1', '9', 'x']) {
      const d = { [khoa]: { action: 'skip' as const } } as unknown as Parameters<
        typeof previewSeedOp
      >[3];
      const xem = await withClanContext(clanId, (tx) => previewSeedOp(tx, admin, parsed.value, d));
      expect(xem.ok, `xem trước phải từ chối khoá '${khoa}'`).toBe(false);
      const ghi = await withClanContext(clanId, (tx) =>
        commitSeedOp(tx, admin, { rows: parsed.value, decisions: d! }),
      );
      expect(ghi.ok, `lượt ghi phải từ chối khoá '${khoa}'`).toBe(false);
    }
  });

  /**
   * AC 4, nửa `mo-ho` — nửa mà bài chốt đầu tiên bỏ trống (bắt 27/08 ở code review). Cảnh báo
   * mơ hồ cũng phải tương ứng một cạnh KHÔNG được ghi, y như cảnh báo vắng.
   */
  it('nửa mơ hồ của AC 4: có *-ambiguous ⇔ không cạnh nào được ghi', async () => {
    const parsed = parseSeedCsv(
      csvOf(
        'S63 Mơ Hồ Cha,nam,1900,,,,,',
        'S63 Mơ Hồ Cha,nam,1915,,,,,',
        'S63 Con Cha Mơ Hồ,nam,1940,,S63 Mơ Hồ Cha,,,',
        'S63 Mơ Hồ Vợ,nu,1905,,,,,',
        'S63 Mơ Hồ Vợ,nu,1918,,,,,',
        'S63 Chồng Vợ Mơ Hồ,nam,1903,,,S63 Mơ Hồ Vợ,,',
      ),
    );
    if (!parsed.ok) throw new Error(parsed.error.message);
    const xem = await withClanContext(clanId, (tx) => previewSeedOp(tx, admin, parsed.value));
    if (!xem.ok) throw new Error(xem.error.message);
    const canhBao = (ten: string) => xem.value.rows.find((r) => r.hoTen === ten)!.warnings;
    expect(canhBao('S63 Con Cha Mơ Hồ')).toContain('father-ambiguous');
    expect(canhBao('S63 Chồng Vợ Mơ Hồ')).toContain('spouse-ambiguous');

    const ghi = await withClanContext(clanId, (tx) =>
      commitSeedOp(tx, admin, { rows: parsed.value, decisions: {} }),
    );
    if (!ghi.ok) throw new Error(ghi.error.message);
    await withClanContext(clanId, async (tx) => {
      const soCanh = async (folded: string, kind: 'parent-child' | 'union-partner') => {
        const [n] = await tx.select().from(person).where(eq(person.nameFolded, folded));
        expect(n, folded).toBeTruthy();
        const r = await tx
          .select()
          .from(assertion)
          .where(and(eq(assertion.subjectPersonId, n!.id), eq(assertion.kind, kind)));
        return r.length;
      };
      expect(await soCanh('s63 con cha mo ho', 'parent-child')).toBe(0);
      expect(await soCanh('s63 chong vo mo ho', 'union-partner')).toBe(0);
    });
  });

  /**
   * AC 4 — cảnh báo và lượt ghi phải nói CÙNG một điều. Sau khi hai bên dùng chung
   * `dungPhepGiaiTen` thì chúng không lệch được nữa; bài này là cái chốt giữ điều đó.
   */
  it('xem trước và lượt ghi không lệch nhau: có cảnh báo ⇔ không có cạnh', async () => {
    const parsed = parseSeedCsv(
      csvOf(
        'S18 K4 Cha Rõ,nam,1900,1970,,,,',
        'S18 K4 Con Có Cha,nam,1930,,S18 K4 Cha Rõ,,,',
        'S18 K4 Con Mất Cha,nam,1932,,S18 K4 Cha Chẳng Có,,,',
        'S18 K4 Vợ Rõ,nu,1935,,,,,',
        'S18 K4 Chồng Có Vợ,nam,1933,,,S18 K4 Vợ Rõ,,',
        'S18 K4 Chồng Mất Vợ,nam,1934,,,S18 K4 Vợ Chẳng Có,,',
        'S18 K4 Cha Bị Bỏ,nam,1895,,,,,',
        'S18 K4 Con Của Cha Bị Bỏ,nam,1925,,S18 K4 Cha Bị Bỏ,,,',
      ),
    );
    if (!parsed.ok) throw new Error(parsed.error.message);
    const decisions = { 6: { action: 'skip' as const } };

    const preview = await withClanContext(clanId, (tx) =>
      previewSeedOp(tx, admin, parsed.value, decisions),
    );
    if (!preview.ok) throw new Error(preview.error.message);
    const canhBao = (ten: string) => preview.value.rows.find((r) => r.hoTen === ten)!.warnings;
    expect(canhBao('S18 K4 Con Có Cha')).toEqual([]);
    expect(canhBao('S18 K4 Con Mất Cha')).toEqual(['father-not-found']);
    expect(canhBao('S18 K4 Chồng Có Vợ')).toEqual([]);
    expect(canhBao('S18 K4 Chồng Mất Vợ')).toEqual(['spouse-not-found']);
    expect(canhBao('S18 K4 Con Của Cha Bị Bỏ')).toEqual(['father-skipped']);

    const committed = await withClanContext(clanId, (tx) =>
      commitSeedOp(tx, admin, { rows: parsed.value, decisions }),
    );
    if (!committed.ok) throw new Error(committed.error.message);
    expect(committed.value).toMatchObject({ created: 7, linked: 0, skipped: 1 });

    await withClanContext(clanId, async (tx) => {
      const soCanh = async (folded: string, kind: 'parent-child' | 'union-partner') => {
        const [nguoi] = await tx.select().from(person).where(eq(person.nameFolded, folded));
        expect(nguoi, folded).toBeTruthy();
        const rows = await tx
          .select()
          .from(assertion)
          .where(and(eq(assertion.subjectPersonId, nguoi!.id), eq(assertion.kind, kind)));
        return rows.length;
      };
      // Không cảnh báo ⇒ CÓ cạnh.
      expect(await soCanh('s18 k4 con co cha', 'parent-child')).toBe(1);
      expect(await soCanh('s18 k4 chong co vo', 'union-partner')).toBe(1);
      // Có cảnh báo ⇒ KHÔNG cạnh nào.
      expect(await soCanh('s18 k4 con mat cha', 'parent-child')).toBe(0);
      expect(await soCanh('s18 k4 chong mat vo', 'union-partner')).toBe(0);
      expect(await soCanh('s18 k4 con cua cha bi bo', 'parent-child')).toBe(0);
    });
  });
});
