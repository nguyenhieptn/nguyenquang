/**
 * `core/place` — tầng ops, chạy trên database thật (nếp: `core/gates/rls.gate.test.ts`).
 *
 * ── Vì sao file này ra đời muộn ───────────────────────────────────────────────────────────
 * Story 5-7 TÍCH Ô T6 nói đã test `addPlace` trùng khít. Không có. Mười bài của 5-7 đều là chấm
 * điểm thuần (`cham-diem.test.ts`), nên tầng ops — nơi có cuộc đua đọc-rồi-ghi, nơi gác quyền,
 * nơi ghi nhật ký — ra đời với đúng một bảo đảm: schema gate đếm được ≥1 policy.
 *
 * Code review 25/08 bắt được, và đây là phần trả nợ.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { ownerPool, withClanContext, type Tx } from '@/db';
import type { SessionContext } from '@/core/identity/session';
import { addPlaceOps, listPlacesOps, searchPlacesOps, giaiNoi } from './ops';

const owner = ownerPool();
const run = <T>(fn: (tx: Tx) => Promise<T>) => withClanContext(clanId, fn);

const clanId = uuidv7();
const clanKhac = uuidv7();
const acc = 's17-acc';
const nodeId = uuidv7();

const ctx: SessionContext = { accountId: acc, clanId, personId: nodeId, role: 'admin' };
/** Tài khoản CHƯA gắn node — mọi lối ghi phải từ chối (AD-8). */
const ctxRoi: SessionContext = { accountId: acc, clanId, personId: null, role: 'admin' };
/** Thành viên thường: ĐÃ gắn node, nhưng không có quyền duyệt. */
const ctxThuong: SessionContext = { accountId: acc, clanId, personId: nodeId, role: 'member' };

beforeAll(async () => {
  await owner.query(`BEGIN`);
  await owner.query(`SET LOCAL app.clan_id = '${clanId}'`);
  await owner.query(`INSERT INTO clan (id, name) VALUES ($1, $2)`, [clanId, 'S17 Clan']);
  await owner.query(`COMMIT`);
  await owner.query(`BEGIN`);
  await owner.query(`SET LOCAL app.clan_id = '${clanKhac}'`);
  await owner.query(`INSERT INTO clan (id, name) VALUES ($1, $2)`, [clanKhac, 'S17 Clan Khác']);
  await owner.query(`COMMIT`);
});

afterAll(async () => {
  for (const id of [clanId, clanKhac]) {
    await owner.query(`BEGIN`);
    await owner.query(`SET LOCAL app.clan_id = '${id}'`);
    await owner.query(`DELETE FROM place WHERE clan_id = $1`, [id]);
    await owner.query(`DELETE FROM revision WHERE clan_id = $1`, [id]);
    await owner.query(`DELETE FROM clan WHERE id = $1`, [id]);
    await owner.query(`COMMIT`);
  }
  await owner.end();
});

describe('tạo nơi (FR-65)', () => {
  it('tạo được, và ghi nhật ký cùng transaction (AD-10)', async () => {
    const res = await run((tx) => addPlaceOps(tx, ctx, { name: 'Quang Trung', parentUnit: 'Định Hoá, Thái Nguyên' }));
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // `revision` là bảng phân vùng: đọc KHÔNG có clan context thì trả rỗng, kể cả với vai owner
    // (FORCE RLS — AD-20). Chính bài gate vừa siết hôm nay khẳng định điều đó.
    await owner.query(`BEGIN`);
    await owner.query(`SET LOCAL app.clan_id = '${clanId}'`);
    const rev = await owner.query(`SELECT entity, action FROM revision WHERE entity_id = $1`, [
      res.value.placeId,
    ]);
    await owner.query(`COMMIT`);
    expect(rev.rows).toHaveLength(1);
    expect((rev.rows[0] as { entity: string; action: string }).entity).toBe('place');
  });

  it('CÙNG TÊN, KHÁC đơn vị cha thì tạo được — nếu không thì nhánh Vũng Tàu không ghi được quê', async () => {
    const res = await run((tx) => addPlaceOps(tx, ctx, { name: 'Quang Trung', parentUnit: 'Vũng Tàu' }));
    expect(res.ok).toBe(true);
  });

  it('TRÙNG KHÍT thì từ chối, và trả kèm id nơi đã có để màn nối thẳng vào', async () => {
    const res = await run((tx) => addPlaceOps(tx, ctx, { name: 'quang trung', parentUnit: 'dinh hoa, thai nguyen' }));
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe('conflict');
    // Trước 25/08 id bị nhét vào giữa một câu tiếng Việt, nên màn không lấy ra được và người dùng
    // nhận một UUID trần trong hộp đỏ. Nay nó là dữ liệu.
    expect(typeof res.error.detail?.placeId).toBe('string');
  });

  it('BỎ TRỐNG đơn vị cha khi đã có nơi trùng tên ⇒ invalid', async () => {
    // "Trống là hợp lệ" (FR-65) — nhưng chỉ khi tên ấy chưa ai ghi. Một hàng trống đứng cạnh
    // "Quang Trung, Định Hoá" là đúng cái mơ hồ FR-65 sinh ra để xoá, và chưa có đường gộp để gỡ.
    const res = await run((tx) => addPlaceOps(tx, ctx, { name: 'Quang Trung', parentUnit: '' }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('invalid');
  });

  it('tên MỚI thì bỏ trống đơn vị cha vẫn hợp lệ', async () => {
    const res = await run((tx) => addPlaceOps(tx, ctx, { name: 'Làng Chũ', parentUnit: '' }));
    expect(res.ok).toBe(true);
  });

  it('tài khoản chưa gắn node thì không ghi được (AD-8)', async () => {
    const res = await run((tx) => addPlaceOps(tx, ctxRoi, { name: 'Nơi Lậu', parentUnit: 'X' }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('unattached');
  });

  it('THÀNH VIÊN THƯỜNG không tạo được nơi — danh mục là của cả dòng họ', async () => {
    /**
     * Danh mục nơi khác một khẳng định: nó thuộc về cả dòng họ, mọi màn nhập đều đọc nó, và
     * `core/place` CHƯA có đường sửa / xoá / gộp — một hàng tạo nhầm ở lại vĩnh viễn. Nên đây là
     * quyền DUYỆT, không phải quyền ghi.
     *
     * Bài này gác chính câu mà `app/admin/cay/actions.ts` khẳng định ở đầu file: core chặn kể cả
     * khi bị POST thẳng không qua UI (AD-24). Trước 25/08 câu ấy sai.
     */
    const res = await run((tx) => addPlaceOps(tx, ctxThuong, { name: 'Nơi Lén', parentUnit: 'X' }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('forbidden');
  });

  it('tên rỗng thì từ chối', async () => {
    const res = await run((tx) => addPlaceOps(tx, ctx, { name: '   ', parentUnit: 'X' }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('invalid');
  });
});

describe('tìm và liệt kê', () => {
  it('hai "Quang Trung" cùng hiện, đúng cái xếp trên', async () => {
    const res = await run((tx) =>
      searchPlacesOps(tx, ctx, { ten: 'Quang Trung', donViCha: 'Vũng Tàu' }),
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.length).toBeGreaterThanOrEqual(2);
    expect(res.value[0].parentUnit).toBe('Vũng Tàu');
    // Nhãn LUÔN kèm đơn vị cha — thiếu nó thì dòng ấy vô nghĩa đúng theo lý do FR-65 tồn tại.
    expect(res.value[0].nhan).toBe('Quang Trung, Vũng Tàu');
  });

  it('danh mục xếp theo tên và chỉ có nơi của dòng họ này', async () => {
    const res = await run((tx) => listPlacesOps(tx));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.every((n) => n.nhan.length > 0)).toBe(true);
  });

  it('CÁCH LY: dòng họ khác không thấy nơi của dòng họ này', async () => {
    const khac = await withClanContext(clanKhac, (tx) => listPlacesOps(tx));
    expect(khac.ok).toBe(true);
    if (!khac.ok) return;
    expect(khac.value).toEqual([]);
  });
});

describe('AD-3 — nơi đã gộp đọc ra nơi thắng', () => {
  it('giaiNoi lần theo `merged_into` tới bên thắng', async () => {
    const thang = await run((tx) => addPlaceOps(tx, ctx, { name: 'Đông Anh', parentUnit: 'Hà Nội' }));
    const thua = await run((tx) => addPlaceOps(tx, ctx, { name: 'Đông Anh', parentUnit: 'HN' }));
    expect(thang.ok && thua.ok).toBe(true);
    if (!thang.ok || !thua.ok) return;

    await owner.query(`BEGIN`);
    await owner.query(`SET LOCAL app.clan_id = '${clanId}'`);
    await owner.query(`UPDATE place SET merged_into = $1 WHERE id = $2`, [
      thang.value.placeId,
      thua.value.placeId,
    ]);
    await owner.query(`COMMIT`);

    const ra = await run((tx) => giaiNoi(tx, [thua.value.placeId]));
    // Khẳng định trỏ vào bên THUA phải đọc ra tên bên THẮNG, y như `person.redirect`.
    expect(ra.get(thua.value.placeId)?.placeId).toBe(thang.value.placeId);
    expect(ra.get(thua.value.placeId)?.nhan).toBe('Đông Anh, Hà Nội');
  });

  it('nơi đã gộp biến khỏi danh mục', async () => {
    const res = await run((tx) => listPlacesOps(tx));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.filter((n) => n.nhan === 'Đông Anh, HN')).toEqual([]);
  });
});

describe('chỉ mục duy nhất là hàng rào THẬT', () => {
  it('database từ chối hai hàng trùng khít, kể cả khi phép so trong bộ nhớ bị vượt qua', async () => {
    // Phép so của `addPlaceOps` là đọc-rồi-ghi: dưới READ COMMITTED hai người tạo cùng lúc đều
    // lọt. Chỉ mục `place_folded_uq` (migration 0004) mới là thứ chặn được.
    const dung = await run((tx) => addPlaceOps(tx, ctx, { name: 'Yên Thế', parentUnit: 'Bắc Giang' }));
    expect(dung.ok).toBe(true);

    let ma = '';
    try {
      await owner.query(`BEGIN`);
      await owner.query(`SET LOCAL app.clan_id = '${clanId}'`);
      await owner.query(
        `INSERT INTO place (id, clan_id, name, name_folded, parent_unit, parent_unit_folded)
         VALUES ($1, $2, 'Yên Thế', 'yen the', 'Bắc Giang', 'bac giang')`,
        [uuidv7(), clanId],
      );
      await owner.query(`COMMIT`);
    } catch (e) {
      ma = (e as { code?: string }).code ?? '';
      await owner.query(`ROLLBACK`);
    }
    expect(ma).toBe('23505');
  });

  it('THUA cuộc đua vẫn nhận được id nơi thắng — không phải một ngõ cụt', async () => {
    /**
     * Ép nhánh `23505` một cách TẤT ĐỊNH, không nhờ may rủi lịch trình.
     *
     * Không mô phỏng được bằng cách chèn sẵn một hàng trùng rồi commit: phép tiền kiểm và chỉ mục
     * so cùng một thứ (giá trị đã gấp dấu), nên hàng nào trượt chỉ mục cũng trượt tiền kiểm — đi
     * nhánh tiền kiểm, không chạm nhánh đua. Hai lượt `Promise.all` cũng không chắc: lượt sau có
     * thể đọc thấy hàng lượt trước đã commit. Cả hai cách đều xanh mà không kiểm đúng thứ mình
     * khẳng định — chính cái tội bản đầu của bài này mắc phải.
     *
     * Cách đúng: giữ hàng thắng ở trạng thái CHƯA COMMIT.
     *   1. tx1 chèn "Kim Bảng, Hà Nam", không commit ⇒ tiền kiểm của tx2 KHÔNG thấy nó.
     *   2. tx2 chạy `addPlaceOps`; `insert` của nó chặn ở chỉ mục, đợi tx1.
     *   3. tx1 commit ⇒ tx2 nhận đúng `23505`.
     *
     * Cái đang kiểm: SAU `23505`, op vẫn tra được id nơi thắng. Chỉ đúng nhờ `insert` chạy trong
     * SAVEPOINT — không có nó thì transaction của tx2 đã hỏng và phép tra sau đó ném.
     */
    const idThang = uuidv7();
    const tx1 = await owner.connect();
    let ketQua: Awaited<ReturnType<typeof addPlaceOps>>;
    try {
      await tx1.query(`BEGIN`);
      await tx1.query(`SET LOCAL app.clan_id = '${clanId}'`);
      await tx1.query(
        `INSERT INTO place (id, clan_id, name, name_folded, parent_unit, parent_unit_folded)
         VALUES ($1, $2, 'Kim Bảng', 'kim bang', 'Hà Nam', 'ha nam')`,
        [idThang, clanId],
      );

      const dangChay = run((tx) =>
        addPlaceOps(tx, ctx, { name: 'Kim Bảng', parentUnit: 'Hà Nam' }),
      );
      // Cho tx2 kịp qua tiền kiểm và chặn ở chỉ mục trước khi nhả tx1 ra.
      await new Promise((r) => setTimeout(r, 150));
      await tx1.query(`COMMIT`);
      ketQua = await dangChay;
    } finally {
      tx1.release();
    }

    expect(ketQua.ok).toBe(false);
    if (ketQua.ok) return;
    expect(ketQua.error.code).toBe('conflict');
    // Câu này CHỈ nhánh đua nói — nhánh tiền kiểm nói "đã có trong danh mục".
    expect(ketQua.error.message).toContain('vừa được người khác thêm');
    expect(ketQua.error.detail?.placeId).toBe(idThang);
  });
});
