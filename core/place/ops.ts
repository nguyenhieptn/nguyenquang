/**
 * core/place/ops.ts — tầng trong của FR-65 (story 5-7).
 *
 * Nhận `(tx, ctx, args)` theo luật phân tầng; `index.ts` là chỗ tự giải danh tính (AD-24).
 *
 * Quy mô: một dòng họ có vài chục tới vài trăm nơi. Đọc hết rồi chấm điểm trong bộ nhớ là đủ, và
 * rẻ hơn nhiều so với dựng chỉ mục trigram cho một bảng cỡ ấy. Nếu một ngày nó lớn lên thì chỗ
 * sửa nằm gọn trong file này.
 */
import { and, count, eq, inArray } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '@/db';
import { assertion, place } from '@/db/schema';
import { chuanHoa } from '@/core/so-khop';
import { writeRevision } from '@/core/revision';
import { gateApprover } from '@/core/assertion/ops';
import type { SessionContext, ViewerContext } from '@/core/identity/session';
import { err, isUuid, ok, type Result } from '@/core/types';
import { chamDiemNoi, trungKhit, trungTen, type NoiTho } from './cham-diem';

export type NoiChon = {
  placeId: string;
  name: string;
  parentUnit: string;
  /** "Quang Trung, Định Hoá" — dạng LUÔN kèm đơn vị cha; đây là dạng mọi màn phải bày. */
  nhan: string;
};

export type UngVienNoiChon = NoiChon & {
  diem: number;
  muc: 'cao' | 'vua' | 'thap';
  vi: string[];
};

/** Postgres 23505 = unique_violation. Drizzle bọc lỗi, nên phải lần theo chuỗi `cause`. */
function maTrungKhoa(e: unknown): boolean {
  for (let cur: unknown = e, hop = 0; cur && hop < 5; hop += 1) {
    if (typeof cur === 'object' && (cur as { code?: string }).code === '23505') return true;
    cur = (cur as { cause?: unknown }).cause;
  }
  return false;
}

function nhanCua(r: { name: string; parentUnit: string }): string {
  return r.parentUnit ? `${r.name}, ${r.parentUnit}` : r.name;
}

/** Mọi nơi còn sống của dòng họ (bia mộ AD-3 bị loại). */
async function taiNoi(tx: Tx) {
  const rows = await tx.select().from(place);
  return rows.filter((r) => r.mergedInto === null);
}

/**
 * Danh mục nơi — KHÔNG nhận `ctx`, và đó là chủ ý chứ không phải quên.
 *
 * Luật phân tầng cho ops hình dạng `(tx, ctx, args)` vì hầu hết chúng lọc theo người xem. Hàm này
 * thì không có gì để lọc: nó trả danh mục ĐỊA DANH, không trả dữ liệu về người. Phạm vi dòng họ đã
 * do `withClanContext` gác. Mang thêm một tham số chỉ để đúng hình là mời người sau tưởng ở đây có
 * một phép lọc riêng tư nào đó.
 */
export async function listPlacesOps(tx: Tx): Promise<Result<NoiChon[]>> {
  const rows = await taiNoi(tx);
  return ok(
    rows
      .map((r) => ({
        placeId: r.id,
        name: r.name,
        parentUnit: r.parentUnit,
        nhan: nhanCua(r),
      }))
      .sort((a, b) => a.nhan.localeCompare(b.nhan, 'vi')),
  );
}

export async function searchPlacesOps(
  tx: Tx,
  _ctx: ViewerContext,
  args: { ten: string; donViCha?: string; toiDa?: number },
): Promise<Result<UngVienNoiChon[]>> {
  const rows = await taiNoi(tx);
  const tho: NoiTho[] = rows.map((r) => ({
    id: r.id,
    nameFolded: r.nameFolded,
    parentUnitFolded: r.parentUnitFolded,
  }));
  const theoId = new Map(rows.map((r) => [r.id, r]));

  const cham = chamDiemNoi(args.ten, args.donViCha ?? '', tho, args.toiDa ?? 5);
  return ok(
    cham.map((u) => {
      const r = theoId.get(u.id)!;
      return {
        placeId: r.id,
        name: r.name,
        parentUnit: r.parentUnit,
        nhan: nhanCua(r),
        diem: u.diem,
        muc: u.muc,
        vi: u.vi,
      };
    }),
  );
}

/**
 * Tạo một nơi mới.
 *
 * **Trùng khít thì KHÔNG tạo** — cùng tên, cùng đơn vị cha sau khi gấp dấu ⇒ `conflict` kèm id nơi
 * đã có, để màn nối thẳng vào đó. Đây là thứ duy nhất giữ cho danh mục không tự sinh sôi từ chính
 * lỗi gõ của người nhập.
 *
 * Nhưng **cùng tên KHÁC đơn vị cha thì phải tạo được** — nếu không thì nhánh ở Vũng Tàu không bao
 * giờ ghi được quê mình. Hai mặt của cùng một luật.
 */
export async function addPlaceOps(
  tx: Tx,
  ctx: SessionContext,
  args: { name: string; parentUnit?: string },
): Promise<Result<{ placeId: string; nhan: string }>> {
  /**
   * ── Quyền DUYỆT, không phải quyền ghi (siết 25/08 sau code review lượt hai) ──────────────
   * Bản trước chỉ kiểm `ctx.personId`, tức là ngang `gateWriter`: MỌI thành viên đã gắn node đều
   * ghi được vào danh mục nơi. Mà danh mục nơi không giống một khẳng định:
   *
   *   · Nó THUỘC VỀ CẢ DÒNG HỌ, không thuộc về một người — mọi màn nhập đều đọc nó.
   *   · Nó KHÔNG XOÁ ĐƯỢC. Từ story 6-4 (29/08) có đường sửa, gộp và tách lại — nhưng một hàng
   *     tạo nhầm vẫn chỉ gộp được vào hàng khác, không biến mất (AD-4 áp cho cả danh mục).
   *   · Mỗi phím gõ trong bộ chọn nơi quét TOÀN BẢNG (`taiNoi`).
   *
   * Ba điều ấy cộng lại thì một bề mặt ghi không giới hạn cho vai `member` là chuyện phải chặn ở
   * CORE, không phải chặn bằng chỗ đặt route — chú thích đầu `app/admin/cay/actions.ts` vốn đã
   * khẳng định "core tự gác kể cả khi bị POST thẳng" (AD-24), và trước bản vá này câu ấy sai.
   *
   * FR-65 *"nhập không được chặn luồng"* không mâu thuẫn: nó cấm bắt dựng danh mục TRƯỚC khi
   * nhập, không nói ai được dựng. Bàn tu phả vẫn tạo nơi ngay giữa dòng nhập như cũ.
   */
  const gate = gateApprover(ctx);
  if (!gate.ok) return gate;

  const name = args.name.trim();
  if (!name) return err('invalid', 'Nơi phải có tên.');
  const parentUnit = (args.parentUnit ?? '').trim();

  const rows = await taiNoi(tx);
  const tho = (r: (typeof rows)[number]): NoiTho => ({
    id: r.id,
    nameFolded: r.nameFolded,
    parentUnitFolded: r.parentUnitFolded,
  });

  const daCo = rows.find((r) => trungKhit(tho(r), name, parentUnit));
  if (daCo) {
    return err('conflict', `Nơi này đã có trong danh mục: ${nhanCua(daCo)}`, {
      placeId: daCo.id,
      // Nhãn của HÀNG THẬT, không phải chữ người ta vừa gõ. Gõ "quang trung, dinh hoa" (lối
      // không dấu mà AD-16 sinh ra để đỡ) mà chip hiện lại đúng chuỗi ấy thì trên chính màn có
      // nhiệm vụ nói RÕ đã chọn nơi nào trong hai nơi trùng tên, nó nói một chuỗi không phân
      // biệt được nơi nào.
      nhan: nhanCua(daCo),
    });
  }

  /**
   * ĐƠN VỊ CHA thành bắt buộc khi đã có nơi TRÙNG TÊN (thêm 25/08 sau code review).
   *
   * FR-65 nói *"trống là hợp lệ"*, và đúng — khi tên ấy chưa ai ghi. Nhưng một hàng TRỐNG đơn vị
   * cha đứng cạnh một "Quang Trung, Định Hoá" là đúng cái mơ hồ mà FR-65 sinh ra để xoá, và tệ
   * hơn: chưa có đường sửa nơi lẫn đường gộp, nên một khi đã tạo thì không gỡ được.
   *
   * Chiều ngược lại vẫn mở: tạo "Quang Trung, Vũng Tàu" khi đã có "Quang Trung, Định Hoá" là
   * chuyện bình thường, và tạo bản CỤ THỂ HƠN cạnh một bản trống cũng vậy — đó là làm rõ, không
   * phải nhân bản.
   */
  if (parentUnit === '' && rows.some((r) => trungTen(tho(r), name))) {
    return err(
      'invalid',
      `Đã có nơi tên "${name}" trong danh mục. Ghi thêm đơn vị hành chính cha để phân biệt.`,
    );
  }

  const id = uuidv7();
  /**
   * Chỉ mục `place_folded_uq` (migration 0004) là hàng rào THẬT — phép so ở trên là đọc-rồi-ghi,
   * nên dưới READ COMMITTED hai người tạo cùng lúc đều lọt qua nó. Chỉ mục ném `23505`, và đó là
   * một `conflict` chứ không phải một sự cố: dịch lại cho đúng hợp đồng Result.
   */
  try {
    /**
     * SAVEPOINT, không phải `insert` trần.
     *
     * Một câu lệnh hỏng làm HỎNG CẢ TRANSACTION trong Postgres: sau `23505` thì mọi truy vấn tiếp
     * theo trả "current transaction is aborted". Nên nhánh `catch` bản trước không thể đi tra id
     * của nơi đã thắng, và trả về một `conflict` TRỐNG — màn nhận được một câu đỏ không nối vào
     * đâu được, đúng ngõ cụt mà `error.detail` sinh ra để xoá.
     *
     * `tx.transaction()` lồng trong drizzle phát `savepoint` / `rollback to savepoint`
     * (`node_modules/drizzle-orm/node-postgres/session.js:206-219`), nên chỉ câu `insert` bị cuộn
     * lại, transaction ngoài còn sống và tra được.
     */
    await tx.transaction(async (sp) => {
      await sp.insert(place).values({
        id,
        clanId: ctx.clanId,
        name,
        nameFolded: chuanHoa(name),
        parentUnit,
        parentUnitFolded: chuanHoa(parentUnit),
      });
    });
  } catch (e) {
    if (maTrungKhoa(e)) {
      /**
       * Hai lý do cho 23505, và chúng cần hai câu (sửa 29/08 sau code review 6-4):
       *   · Người kia vừa thắng cuộc đua — hàng SỐNG. Trả id của họ để màn nối thẳng vào.
       *   · Tên trùng với một BIA MỘ — chỉ mục phủ cả bia mộ, còn tiền kiểm chỉ soi hàng sống.
       *     6-4 là story đầu tiên sinh ra bia mộ, và bản trước trả `placeId` của chính bia mộ:
       *     `addAssertionOp` từ chối ghi vào đó, nên người ghi đứng trước một chip không dùng
       *     được. Nay giải chuỗi (AD-3) và trả NƠI THẮNG.
       */
      const [thang] = await tx
        .select()
        .from(place)
        .where(
          and(
            eq(place.clanId, ctx.clanId),
            eq(place.nameFolded, chuanHoa(name)),
            eq(place.parentUnitFolded, chuanHoa(parentUnit)),
          ),
        );
      if (thang?.mergedInto) {
        const giai = (await giaiNoi(tx, [thang.id])).get(thang.id);
        return err(
          'conflict',
          `Tên này là tên cũ của một nơi đã gộp${giai ? ` — nay đọc ra ${giai.nhan}` : ''}. Dùng nơi ấy, hoặc tách lại ở danh mục nơi chốn.`,
          giai ? { placeId: giai.placeId, nhan: giai.nhan } : undefined,
        );
      }
      return err(
        'conflict',
        `Nơi này vừa được người khác thêm: ${nhanCua({ name, parentUnit })}`,
        thang ? { placeId: thang.id, nhan: nhanCua(thang) } : undefined,
      );
    }
    throw e;
  }
  await writeRevision(tx, {
    clanId: ctx.clanId,
    accountId: ctx.accountId,
    entity: 'place',
    entityId: id,
    action: 'create',
    after: { name, parentUnit },
  });
  return ok({ placeId: id, nhan: nhanCua({ name, parentUnit }) });
}

/**
 * AD-3: `place_id` trỏ vào một nơi đã gộp thì đọc ra nơi thắng.
 *
 * Giải theo BẬC, không theo từng nơi (sửa 29/08 sau code review 6-5): story 6-5 đưa hàm này từ
 * "vài nơi của một người" lên "mọi nơi của cả họ", và bản trước là một truy vấn cho MỖI nơi đã
 * gộp — N+1 trên đúng đường chạy ở mọi request `/admin/*`. Nay mỗi bậc của chuỗi là MỘT truy vấn;
 * mà 6-4 gác chuỗi ở tối đa một bậc (không gộp vào bia mộ, không gộp đi một nơi đang thắng), nên
 * thường là hai truy vấn cho cả họ. Trần 20 bậc chỉ còn là dây an toàn cho dữ liệu hỏng.
 */
export async function giaiNoi(tx: Tx, ids: string[]): Promise<Map<string, NoiChon>> {
  const ra = new Map<string, NoiChon>();
  if (ids.length === 0) return ra;
  type HangNoi = typeof place.$inferSelect;
  const daTai = new Map<string, HangNoi>();
  let can = [...new Set(ids)];
  for (let hop = 0; can.length > 0 && hop <= 20; hop++) {
    const rows = await tx.select().from(place).where(inArray(place.id, can));
    for (const r of rows) daTai.set(r.id, r);
    can = [...new Set(rows.flatMap((r) => (r.mergedInto && !daTai.has(r.mergedInto) ? [r.mergedInto] : [])))];
  }
  for (const id of new Set(ids)) {
    const goc = daTai.get(id);
    if (!goc) continue;
    let cur = goc;
    for (let hop = 0; cur.mergedInto && hop < 20; hop++) {
      const next = daTai.get(cur.mergedInto);
      if (!next) break;
      cur = next;
    }
    ra.set(id, { placeId: cur.id, name: cur.name, parentUnit: cur.parentUnit, nhan: nhanCua(cur) });
  }
  return ra;
}

// ── Sửa · gộp · tách (story 6-4, FR-65 "trùng thì gộp được, gộp nhầm thì tách được") ────────

/**
 * Sửa tên và đơn vị cha của một nơi.
 *
 * Cùng hai luật với `addPlaceOps`, vì sửa là một lối vào thứ hai của cùng một danh mục: trùng khít
 * với nơi khác ⇒ `conflict` kèm id nơi ấy (màn chỉ sang nút Gộp); trống đơn vị cha khi có nơi
 * trùng tên ⇒ `invalid`. Nơi ĐÃ GỘP thì không sửa — nó là bia mộ, mọi đường đọc đã trỏ sang nơi
 * thắng, sửa nó là sửa một cái tên không ai còn thấy.
 */
export async function updatePlaceOps(
  tx: Tx,
  ctx: SessionContext,
  args: { placeId: string; name: string; parentUnit?: string },
): Promise<Result<NoiChon>> {
  const gate = gateApprover(ctx);
  if (!gate.ok) return gate;
  if (!isUuid(args.placeId)) return err('not-found', 'Không thấy nơi này trong danh mục.');

  /**
   * Đọc hàng THÔ, không qua `taiNoi()` — hàm ấy lọc bia mộ, nên một nơi đã gộp sẽ thành
   * `not-found` thay vì `conflict`, và người vận hành không biết vì sao nó "biến mất".
   */
  // `FOR UPDATE`: một lượt gộp chen vào giữa đọc và ghi thì phải CHỜ, kẻo ta đổi tên một bia mộ.
  const [row] = await tx.select().from(place).where(eq(place.id, args.placeId)).for('update');
  if (!row) return err('not-found', 'Không thấy nơi này trong danh mục.');
  if (row.mergedInto) {
    return err('conflict', 'Nơi này đã gộp vào một nơi khác — tách lại trước nếu muốn sửa.');
  }

  const name = args.name.trim();
  if (!name) return err('invalid', 'Nơi phải có tên.');
  const parentUnit = (args.parentUnit ?? '').trim();
  if (name === row.name && parentUnit === row.parentUnit) {
    // Không đổi gì thì không ghi gì — một dòng nhật ký "update" rỗng là nhiễu cho lượt tách sau.
    return ok({ placeId: row.id, name: row.name, parentUnit: row.parentUnit, nhan: nhanCua(row) });
  }

  const khac = (await taiNoi(tx)).filter((r) => r.id !== row.id);
  const tho = (r: (typeof khac)[number]): NoiTho => ({
    id: r.id,
    nameFolded: r.nameFolded,
    parentUnitFolded: r.parentUnitFolded,
  });
  const daCo = khac.find((r) => trungKhit(tho(r), name, parentUnit));
  if (daCo) {
    return err('conflict', `Đã có nơi ${nhanCua(daCo)} trong danh mục — gộp hai nơi thay vì sửa trùng.`, {
      placeId: daCo.id,
      nhan: nhanCua(daCo),
    });
  }
  if (parentUnit === '' && khac.some((r) => trungTen(tho(r), name))) {
    return err(
      'invalid',
      `Đã có nơi tên "${name}" trong danh mục. Ghi thêm đơn vị hành chính cha để phân biệt.`,
    );
  }

  const truoc = { name: row.name, parentUnit: row.parentUnit };
  const sau = { name, parentUnit };
  try {
    // Savepoint, cùng lý do `addPlaceOps`: chỉ mục `place_folded_uq` phủ CẢ bia mộ, mà pre-check
    // ở trên chỉ soi hàng sống. Đụng một bia mộ thì 23505 — và transaction ngoài phải còn sống để
    // tra xem bia mộ ấy trỏ về đâu.
    await tx.transaction(async (sp) => {
      await sp
        .update(place)
        .set({ name, nameFolded: chuanHoa(name), parentUnit, parentUnitFolded: chuanHoa(parentUnit) })
        .where(eq(place.id, row.id));
    });
  } catch (e) {
    if (maTrungKhoa(e)) {
      const [thang] = await tx
        .select()
        .from(place)
        .where(
          and(
            eq(place.clanId, ctx.clanId),
            eq(place.nameFolded, chuanHoa(name)),
            eq(place.parentUnitFolded, chuanHoa(parentUnit)),
          ),
        );
      // Hàng SỐNG vừa được người khác thêm thì không phải "tách lại" gì cả — là hai hàng cho một
      // nơi, tức việc của nút Gộp (sửa 29/08 sau code review 6-4).
      if (thang && !thang.mergedInto) {
        return err('conflict', `Đã có nơi ${nhanCua(thang)} trong danh mục — gộp hai nơi thay vì sửa trùng.`, {
          placeId: thang.id,
          nhan: nhanCua(thang),
        });
      }
      const giai = thang ? (await giaiNoi(tx, [thang.id])).get(thang.id) : undefined;
      return err(
        'conflict',
        `Tên này trùng với một nơi đã gộp${giai ? ` (nay đọc ra ${giai.nhan})` : ''} — tách lại nơi ấy, hoặc gộp.`,
        giai ? { placeId: giai.placeId, nhan: giai.nhan } : undefined,
      );
    }
    throw e;
  }
  await writeRevision(tx, {
    clanId: ctx.clanId,
    accountId: ctx.accountId,
    entity: 'place',
    entityId: row.id,
    action: 'update',
    before: truoc,
    after: sau,
  });
  return ok({ placeId: row.id, name, parentUnit, nhan: nhanCua(sau) });
}

export type KetQuaGopNoi = {
  loserId: string;
  winnerId: string;
  /** Nhãn nơi thắng — để màn nói "N khẳng định nay đọc ra <nơi thắng>". */
  nhanThang: string;
  /** Số khẳng định `place` đang trỏ vào bên thua (kể cả đã ẩn) — từ nay chúng đọc ra bên thắng. */
  soKhangDinh: number;
};

/**
 * Gộp hai nơi trùng: bên thua thành BIA MỘ trỏ về bên thắng.
 *
 * ── Vì sao KHÔNG repoint khẳng định (khác `core/merge` cho người) ──────────────────────────
 * Với người, AD-3 đòi repoint mọi tham chiếu và ghi trọn danh sách — vì cây, bán kính riêng tư,
 * hàng chờ đều đọc `person.id` thẳng. Với nơi thì mọi đường đọc đã đi qua `giaiNoi()`
 * (`read-ops.ts`), và `addAssertionOp` từ chối ghi mới vào bia mộ. Cột `merged_into` chính là
 * cơ chế repoint-lúc-đọc mà 5-7 dựng sẵn — nên gộp là MỘT cột, tách là xoá cột ấy, và tách luôn
 * đúng nguyên trạng mà không cần danh sách mối nối nào.
 */
export async function mergePlaceOps(
  tx: Tx,
  ctx: SessionContext,
  args: { loserId: string; winnerId: string },
): Promise<Result<KetQuaGopNoi>> {
  const gate = gateApprover(ctx);
  if (!gate.ok) return gate;
  if (!isUuid(args.loserId) || !isUuid(args.winnerId)) {
    return err('not-found', 'Không thấy nơi này trong danh mục.');
  }
  if (args.loserId === args.winnerId) return err('invalid', 'Không gộp một nơi vào chính nó.');

  /**
   * `FOR UPDATE` trên CẢ HAI hàng (sửa 29/08 sau code review 6-4). Phép kiểm dưới đây là
   * đọc-rồi-ghi, và `db/migrations/0004_place_unique.sql` đã dạy: *phép so trong bộ nhớ KHÔNG
   * phải một ràng buộc*. Hai người gộp A→B và B→A cùng lúc dưới READ COMMITTED đều thấy bên kia
   * còn sống, mỗi người UPDATE một hàng khác nhau, và cả hai commit — một vòng A→B→A mà
   * `giaiNoi` không lần ra đâu. Khoá hàng thì lượt thứ hai chờ lượt thứ nhất commit, đọc lại
   * hàng mới, và thấy nơi thắng của mình đã là bia mộ.
   */
  const rows = await tx
    .select()
    .from(place)
    .where(inArray(place.id, [args.loserId, args.winnerId]))
    .for('update');
  const thua = rows.find((r) => r.id === args.loserId);
  const thang = rows.find((r) => r.id === args.winnerId);
  if (!thua || !thang) return err('not-found', 'Không thấy nơi này trong danh mục.');
  if (thua.mergedInto) return err('conflict', `${nhanCua(thua)} đã gộp rồi.`);
  /**
   * KHÔNG CHUỖI — gác cả hai chiều.
   *
   * Gộp vào một bia mộ là tạo chuỗi hai bước — `giaiNoi` vẫn lần được, nhưng "tách lại" bên nào
   * thì bên kia đứt: A→B→C, tách B khỏi C là A vẫn trỏ về B mà B đã sống lại — đúng, hay sai?
   * Không có câu trả lời đúng cho mọi ca, nên không cho đặt câu hỏi. Đây cũng là hàng rào chống
   * vòng: A→B rồi B→A bị chặn vì B đã là bia mộ.
   *
   * Chiều kia (thêm 29/08 sau code review 6-4): gộp ĐI một nơi đang là nơi thắng của bia mộ khác
   * cũng tạo đúng chuỗi ấy — A→B rồi B→C — và bản trước không chặn, dù chú thích nói là chặn.
   * Từ màn là hai cú bấm: sau lượt gộp đầu B vẫn sống, vẫn có nút "Gộp vào…". Chặn, và nói rõ
   * tách những nơi ấy trước — rồi gộp chúng thẳng vào C nếu muốn.
   */
  if (thang.mergedInto) {
    return err('conflict', `${nhanCua(thang)} đã gộp vào nơi khác — chọn nơi còn sống làm nơi thắng.`);
  }
  const [dangThang] = await tx.select({ n: count() }).from(place).where(eq(place.mergedInto, thua.id));
  if (Number(dangThang?.n ?? 0) > 0) {
    return err(
      'conflict',
      `${nhanCua(thua)} đang là nơi thắng của ${Number(dangThang!.n)} nơi đã gộp — tách những nơi ấy trước, rồi gộp thẳng vào nơi mới.`,
    );
  }

  // Đếm MỌI khẳng định trỏ vào bên thua, kể cả đã ẩn: dòng ẩn hiện lại thì cũng đọc ra nơi thắng.
  const [dem] = await tx.select({ n: count() }).from(assertion).where(eq(assertion.placeId, thua.id));

  await tx.update(place).set({ mergedInto: thang.id }).where(eq(place.id, thua.id));
  await writeRevision(tx, {
    clanId: ctx.clanId,
    accountId: ctx.accountId,
    entity: 'place',
    entityId: thua.id,
    action: 'merge',
    before: { mergedInto: null, nhan: nhanCua(thua) },
    after: { mergedInto: thang.id, winnerId: thang.id, nhanThang: nhanCua(thang) },
  });
  return ok({
    loserId: thua.id,
    winnerId: thang.id,
    nhanThang: nhanCua(thang),
    soKhangDinh: Number(dem?.n ?? 0),
  });
}

/** Tách lại một nơi đã gộp — xoá `merged_into`, nguyên trạng trở về. */
export async function unmergePlaceOps(
  tx: Tx,
  ctx: SessionContext,
  args: { placeId: string },
): Promise<Result<NoiChon>> {
  const gate = gateApprover(ctx);
  if (!gate.ok) return gate;
  if (!isUuid(args.placeId)) return err('not-found', 'Không thấy nơi này trong danh mục.');
  const [row] = await tx.select().from(place).where(eq(place.id, args.placeId));
  if (!row) return err('not-found', 'Không thấy nơi này trong danh mục.');
  if (!row.mergedInto) return err('conflict', `${nhanCua(row)} chưa gộp vào đâu — không có gì để tách.`);

  await tx.update(place).set({ mergedInto: null }).where(eq(place.id, row.id));
  await writeRevision(tx, {
    clanId: ctx.clanId,
    accountId: ctx.accountId,
    entity: 'place',
    entityId: row.id,
    action: 'unmerge',
    before: { mergedInto: row.mergedInto },
    after: { mergedInto: null },
  });
  return ok({ placeId: row.id, name: row.name, parentUnit: row.parentUnit, nhan: nhanCua(row) });
}

export type NoiDaGop = NoiChon & { thang: NoiChon };

/** Bia mộ kèm nơi thắng (đã giải chuỗi) — khu "Đã gộp" của màn Nơi chốn. */
export async function listMergedPlacesOps(tx: Tx): Promise<Result<NoiDaGop[]>> {
  const rows = (await tx.select().from(place)).filter((r) => r.mergedInto !== null);
  const giai = await giaiNoi(tx, rows.map((r) => r.id));
  return ok(
    rows
      .map((r) => ({
        placeId: r.id,
        name: r.name,
        parentUnit: r.parentUnit,
        nhan: nhanCua(r),
        thang: giai.get(r.id) ?? { placeId: r.mergedInto!, name: '?', parentUnit: '', nhan: 'một nơi không còn' },
      }))
      .sort((a, b) => a.nhan.localeCompare(b.nhan, 'vi')),
  );
}
