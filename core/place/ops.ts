/**
 * core/place/ops.ts — tầng trong của FR-65 (story 5-7).
 *
 * Nhận `(tx, ctx, args)` theo luật phân tầng; `index.ts` là chỗ tự giải danh tính (AD-24).
 *
 * Quy mô: một dòng họ có vài chục tới vài trăm nơi. Đọc hết rồi chấm điểm trong bộ nhớ là đủ, và
 * rẻ hơn nhiều so với dựng chỉ mục trigram cho một bảng cỡ ấy. Nếu một ngày nó lớn lên thì chỗ
 * sửa nằm gọn trong file này.
 */
import { and, eq, inArray } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '@/db';
import { place } from '@/db/schema';
import { chuanHoa } from '@/core/so-khop';
import { writeRevision } from '@/core/revision';
import { gateApprover } from '@/core/assertion/ops';
import type { SessionContext, ViewerContext } from '@/core/identity/session';
import { err, ok, type Result } from '@/core/types';
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
   *   · Nó KHÔNG GỠ ĐƯỢC. `core/place` chưa có đường sửa, đường xoá, hay đường gộp
   *     (`deferred-work.md`), nên một hàng tạo nhầm ở lại vĩnh viễn.
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
      // Người kia vừa thắng cuộc đua. Tra id của họ để màn nối thẳng vào, y như nhánh tiền kiểm.
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

/** AD-3: `place_id` trỏ vào một nơi đã gộp thì đọc ra nơi thắng. */
export async function giaiNoi(tx: Tx, ids: string[]): Promise<Map<string, NoiChon>> {
  const ra = new Map<string, NoiChon>();
  if (ids.length === 0) return ra;
  const rows = await tx.select().from(place).where(inArray(place.id, ids));
  for (const r of rows) {
    let cur = r;
    for (let hop = 0; cur.mergedInto && hop < 20; hop++) {
      const [next] = await tx.select().from(place).where(eq(place.id, cur.mergedInto));
      if (!next) break;
      cur = next;
    }
    ra.set(r.id, {
      placeId: cur.id,
      name: cur.name,
      parentUnit: cur.parentUnit,
      nhan: nhanCua(cur),
    });
  }
  return ra;
}
