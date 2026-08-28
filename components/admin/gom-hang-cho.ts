/**
 * GOM HÀNG CHỜ THEO NGƯỜI — story 6-8. Module THUẦN.
 *
 * ── Hai đơn vị, và chỗ chúng gặp nhau ───────────────────────────────────────────────────────
 * Đơn vị **hành động** của hệ là KHẲNG ĐỊNH (AD-9): `promoteAssertion` nâng đúng một câu, và
 * story này không đổi điều đó. Đơn vị **chú ý** của người vận hành là CON NGƯỜI — lời của chủ dự
 * án sau lượt bấm thật đầu tiên: *"nên hiện all của một người rồi duyệt một thể, duyệt từng nội
 * dung thông tin rất nhiều mục."* File này là chỗ hai đơn vị ấy gặp nhau.
 *
 * ── Vì sao nó chỉ `import type` từ `@/core/*` ───────────────────────────────────────────────
 * Luật đơn trị (`DON_TRI`), thứ tự loại (`HANG`) và nhãn (`NHAN`) sống ở `core/person/chong.ts`.
 * Chép tay chúng sang đây là đúng lỗi mà lượt code review 6-3 bắt ở `SeedRowWarning` — và lượt
 * review 6-8 bắt lại một lần nữa ở bảng nhãn `NHAN_LOAI`. Nên phép gom NHẬN chúng làm tham số,
 * và trang (server) đọc từ core rồi truyền vào.
 *
 * `import type { AssertionKind }` thì bị xoá lúc biên dịch, không kéo `pg` vào bó trình duyệt —
 * và nó là thứ giữ cho `LuatGom` vẫn được `tsc` kiểm ĐẦY ĐỦ. Bản đầu nới thành
 * `Record<string, …>` và mất đúng bảo đảm ấy: một loại đơn trị chưa khai sẽ `undefined` ⇒ falsy
 * ⇒ **không phải đụng độ** ⇒ gộp thẳng vào lượt duyệt hàng loạt. Trên một kho không xoá được,
 * mặc định phải là ĐÓNG.
 */
import type { AssertionKind } from '@/core/person';

export type DongCho = {
  assertionId: string;
  personId: string;
  personName: string;
  /** `AssertionKind` của khẳng định — thứ quyết định đụng độ đơn trị và thứ tự trong nhóm. */
  kind: string;
  /**
   * Mốc thời gian **ISO** — trục xếp "cũ nhất trước".
   *
   * Tên trường là `lucISO`, không phải `luc`, và đó là chủ ý (sửa 27/08 sau code review). Bản
   * đầu gọi nó là `luc`, và `DongChoDuyet` của màn cũng có một trường tên `luc` — nhưng trường
   * ấy mang chuỗi ĐÃ ĐỊNH DẠNG cho mắt (`"23:50 · 02/08/2026"`). Cả hai là `string` nên
   * `T extends DongCho` khớp, `tsc` im, và phép gom xếp theo *giờ → phút → ngày → tháng → năm*
   * suốt từ lúc dựng. Đo được: `"23:50 · 02/08/2026".localeCompare("01:10 · 26/08/2026") = 1`,
   * tức cũ xếp sau mới. Tên khác nhau là hàng rào rẻ nhất chống đúng lớp nhầm ấy.
   */
  lucISO: string;
};

/** Hai hay nhiều khẳng định cùng một loại ĐƠN TRỊ về cùng một người. */
export type CumDungDo = { kind: string; assertionIds: string[] };

export type NhomNguoi<T extends DongCho> = {
  personId: string;
  personName: string;
  /** Mọi dòng của người này, đã xếp theo thứ tự của phiếu lý lịch. */
  dong: T[];
  /** Khẳng định SỚM NHẤT trong nhóm (ISO) — trục xếp nhóm với nhau. */
  somNhat: string;
  cumDungDo: CumDungDo[];
  /**
   * Id an toàn cho MỘT lượt duyệt cả nhóm — đã loại mọi dòng nằm trong cụm đụng độ.
   *
   * Đây là chỗ story này thật sự làm việc. `promoteAssertionOp` chặn nâng giá trị chính thức thứ
   * hai cho một loại đơn trị, nên bấm "duyệt trọn người này" trên một người có hai khẳng định
   * `birth` chờ duyệt sẽ: nâng được cái đầu, trả `conflict` cho cái sau — tức **máy vừa chọn hộ
   * giá trị nào thắng bằng thứ tự lặp**. Không sai dữ liệu, nhưng là một lựa chọn tình cờ về một
   * người thật, và người vận hành chỉ đọc được nó ở một câu lỗi sau khi việc đã xong.
   */
  duyetDuoc: string[];
};

export type LuatGom = {
  /** `DON_TRI` của core — loại nào chỉ được có MỘT giá trị chính thức. */
  donTri: Readonly<Record<AssertionKind, boolean>>;
  /** `HANG` của core — thứ tự loại trên phiếu lý lịch. */
  thuTuLoai: Readonly<Record<AssertionKind, number>>;
};

/**
 * Loại này có phải ĐƠN TRỊ không — fail **CLOSED** với một `kind` lạ.
 *
 * Cột `kind` là `text`; `$type` chỉ là TypeScript, nên một giá trị ngoài enum tới được (chính
 * `chong.ts` cảnh báo điều đó). Tra thẳng `donTri[kind]` cho `undefined` ⇒ falsy ⇒ *không phải
 * đụng độ* ⇒ gộp vào lượt duyệt hàng loạt. Không biết thì coi như ĐƠN TRỊ: thà bắt người vận
 * hành chọn tay một lần còn hơn để máy nâng hai giá trị chính thức của một loại chưa ai khai.
 */
function laDonTri(donTri: LuatGom['donTri'], kind: string): boolean {
  return donTri[kind as AssertionKind] ?? true;
}

/** Loại lạ xếp xuống cuối chứ không lên đầu — thà đứng sau còn hơn chen lên trước Tên. */
const CUOI_BANG = 999;

export function gomTheoNguoi<T extends DongCho>(
  dong: readonly T[],
  luat: LuatGom,
): NhomNguoi<T>[] {
  const theoNguoi = new Map<string, T[]>();
  for (const d of dong) {
    const ds = theoNguoi.get(d.personId) ?? [];
    ds.push(d);
    theoNguoi.set(d.personId, ds);
  }

  const nhom: NhomNguoi<T>[] = [];
  for (const [personId, ds] of theoNguoi) {
    // Thứ tự TRONG nhóm: theo phiếu lý lịch, rồi cũ trước — một nguồn thứ tự, không bảng thứ hai.
    const daXep = [...ds].sort(
      (a, b) =>
        (luat.thuTuLoai[a.kind as AssertionKind] ?? CUOI_BANG) -
          (luat.thuTuLoai[b.kind as AssertionKind] ?? CUOI_BANG) ||
        a.lucISO.localeCompare(b.lucISO) ||
        a.assertionId.localeCompare(b.assertionId),
    );

    const theoLoai = new Map<string, T[]>();
    for (const d of daXep) {
      const ds2 = theoLoai.get(d.kind) ?? [];
      ds2.push(d);
      theoLoai.set(d.kind, ds2);
    }
    const cumDungDo: CumDungDo[] = [];
    for (const [kind, ds2] of theoLoai) {
      if (laDonTri(luat.donTri, kind) && ds2.length >= 2)
        cumDungDo.push({ kind, assertionIds: ds2.map((d) => d.assertionId) });
    }
    const trongCum = new Set(cumDungDo.flatMap((c) => c.assertionIds));

    nhom.push({
      personId,
      personName: daXep[0]!.personName,
      dong: daXep,
      // Cùng một phép so với thứ tự nhóm bên dưới — bản đầu dùng `<` ở đây và `localeCompare` ở
      // kia, hai comparator cho cùng một trường.
      somNhat: daXep.reduce((m, d) => (d.lucISO.localeCompare(m) < 0 ? d.lucISO : m), daXep[0]!.lucISO),
      cumDungDo,
      duyetDuoc: daXep.filter((d) => !trongCum.has(d.assertionId)).map((d) => d.assertionId),
    });
  }

  /**
   * Nhóm nào CŨ NHẤT lên trước — hàng chờ là hàng chờ.
   *
   * KHÔNG xếp theo số dòng: người có nhiều khẳng định chờ không đáng được xử trước một người có
   * đúng một dòng đã nằm đây ba tuần. Xếp theo số dòng cũng làm thứ tự nhảy mỗi lần duyệt xong
   * một mục, tức danh sách tự xáo dưới tay người đang đọc.
   */
  return nhom.sort(
    (a, b) => a.somNhat.localeCompare(b.somNhat) || a.personId.localeCompare(b.personId),
  );
}

/** Có mục nào duyệt trọn gói được không — nút của nhóm vắng mặt khi câu trả lời là không. */
export function coTheDuyetCaNhom(n: NhomNguoi<DongCho>): boolean {
  return n.duyetDuoc.length > 0;
}
