/**
 * CHỒNG KHẲNG ĐỊNH — phép dẫn xuất của story 5-3. Module THUẦN: không DB, không React.
 *
 * ── Vì sao phải phân biệt hai kiểu chồng ───────────────────────────────────────────────────
 * Hệ này không bao giờ đè lên một sự thật cũ (AD-9/AD-10): sửa = ghi thêm một khẳng định. Nên
 * mỗi người mang nhiều khẳng định cùng loại — và có HAI lý do rất khác nhau để điều đó xảy ra:
 *
 *   · MÂU THUẪN — hai giá trị không thể cùng đúng. Một người có đúng một năm sinh. Người duyệt
 *     phải CHỌN MỘT, và bên thua rời dữ liệu sống nhưng ở lại nhật ký (AD-4).
 *   · NỐI TIẾP — nhiều giá trị cùng đúng, xếp theo thời gian. Không phải chọn gì cả.
 *
 * Ví dụ rõ nhất của kiểu thứ hai chưa tới lượt làm: nguyên táng / cải táng / di táng là ba
 * khẳng định **cùng chính thức và cùng đúng**. Panel chỉ biết một kiểu chồng thì tới lúc ấy phải
 * dỡ ra làm lại — mà dỡ một màn đã có người dùng thì đắt hơn nhiều so với làm đúng ngay bây giờ.
 *
 * ── Vì sao ở CORE chứ không ở panel ───────────────────────────────────────────────────────
 * "Hai khẳng định này mâu thuẫn" là một sự thật về phả, không phải một lựa chọn trình bày (AD-5).
 * Màn "Mâu thuẫn" trên thanh việc sau này phải dùng ĐÚNG phép này; hai nơi suy hai kiểu là hỏng.
 */
import type { AssertionKind } from '@/db/schema';
import type { PersonAssertion } from './index';

export type StackKind = 'mau-thuan' | 'noi-tiep' | 'don';

export type AssertionStack = {
  kind: AssertionKind;
  /** Nhãn tiếng Việt của loại — panel không tự dịch, kẻo hai màn gọi khác tên. */
  nhan: string;
  stackKind: StackKind;
  rows: PersonAssertion[];
};

/**
 * Loại nào chỉ được có MỘT giá trị sống.
 *
 * `Record<AssertionKind, …>` chứ không phải một mảng: thêm một loại khẳng định vào
 * `db/schema/domain.ts` mà quên khai ở đây là lỗi `tsc`, không phải một chồng bị xếp nhầm im lặng.
 */
export const DON_TRI: Record<AssertionKind, boolean> = {
  name: true,
  gender: true,
  birth: true,
  death: true,
  // Cha và mẹ là HAI khẳng định cha-con — nhiều dòng ở đây là bình thường, không phải mâu thuẫn.
  'parent-child': false,
  // Nhiều đời vợ/chồng là chuyện phả cổ chép thật.
  'union-partner': false,
  note: false,
  /**
   * FR-65: quê quán · trú quán · nơi an táng là BA VAI khác nhau, cùng đúng một lúc. Và riêng
   * trú quán thì một người ở nhiều nơi qua đời cũng là chuyện thường.
   *
   * Giới hạn đã biết, giống hệt `parent-child`: hai khẳng định cùng vai `que-quan` mà khác nơi
   * thì ĐÚNG là mâu thuẫn — nhưng `vai` nằm trong `value`, mà phép xếp chồng chỉ thấy `kind`.
   * Ghi ở `deferred-work.md`.
   */
  place: false,
};

export const NHAN: Record<AssertionKind, string> = {
  name: 'Tên',
  gender: 'Giới tính',
  birth: 'Sinh',
  death: 'Mất',
  'parent-child': 'Cha mẹ',
  'union-partner': 'Vợ chồng',
  note: 'Ghi chú',
  place: 'Nơi chốn',
};

/**
 * Thứ tự bày cố định — không theo thứ tự dữ liệu trả về, kẻo panel nhảy giữa hai lần đọc.
 *
 * `Record<AssertionKind, number>` chứ không phải mảng (sửa 25/08 sau code review): một mảng KHÔNG
 * được `tsc` kiểm đầy đủ, nên thêm loại thứ chín mà quên nó thì khẳng định ấy lặng lẽ biến mất
 * khỏi panel — đúng lớp lỗi mà `DON_TRI` và `NHAN` dựng ra để chặn.
 */
/**
 * Thứ tự loại trên phiếu lý lịch. Xuất ra từ 27/08 (story 6-8): hàng chờ gom theo người cần
 * đúng thứ tự này, và một bảng thứ hai là một nguồn sự thật thứ hai.
 */
export const HANG: Record<AssertionKind, number> = {
  name: 0,
  gender: 1,
  birth: 2,
  death: 3,
  'parent-child': 4,
  'union-partner': 5,
  place: 6,
  note: 7,
};


function moiNhatTruoc(a: PersonAssertion, b: PersonAssertion): number {
  return b.createdAt.localeCompare(a.createdAt);
}

export function xepChong(assertions: PersonAssertion[]): AssertionStack[] {
  const theoLoai = new Map<AssertionKind, PersonAssertion[]>();
  for (const a of assertions) {
    /**
     * Khẳng định ĐÃ ẨN không vào chồng. AD-17: một lượt báo cáo là ẩn ngay, chưa cần duyệt — nên
     * nó đang chờ phân xử, không phải đang là một ứng viên cho sự thật. Chỗ của nó là khu "đã ẩn
     * theo báo cáo" ở màn Hàng chờ (`listHiddenAssertions`), nơi có cả lý do báo cáo.
     */
    if (a.status !== 'live') continue;
    const arr = theoLoai.get(a.kind);
    if (arr) arr.push(a);
    else theoLoai.set(a.kind, [a]);
  }

  /**
   * Duyệt theo LOẠI CÓ THẬT trong dữ liệu rồi mới sắp theo `HANG`. Duyệt theo một danh sách cứng
   * thì một `kind` nằm ngoài enum (cột `kind` là `text`, `$type` chỉ là TypeScript) sẽ không bao
   * giờ được phát — nó có trong `assertions` mà vắng trong `stacks`, im lặng.
   */
  const ra: AssertionStack[] = [];
  const coThat = [...theoLoai.keys()].sort(
    (a, b) => (HANG[a] ?? Number.MAX_SAFE_INTEGER) - (HANG[b] ?? Number.MAX_SAFE_INTEGER),
  );
  for (const kind of coThat) {
    const rows = theoLoai.get(kind);
    if (!rows || rows.length === 0) continue;

    const stackKind: StackKind =
      rows.length === 1 ? 'don' : DON_TRI[kind] ? 'mau-thuan' : 'noi-tiep';

    const xep = [...rows];
    if (stackKind === 'noi-tiep') {
      // Một dòng chảy, không phải một cuộc thi: cũ nhất trước.
      xep.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    } else {
      /**
       * Chính thức trước, rồi tồn nghi; trong mỗi nhóm mới nhất trước.
       *
       * Người duyệt cần thấy NGAY "cái gì đang là sự thật sống" trước khi so với cái đang đòi
       * thay nó. Xếp theo thời gian ở đây là bắt họ tự đi tìm dòng chính thức giữa một chồng.
       */
      xep.sort((a, b) => {
        const ta = a.tier === 'official' ? 0 : 1;
        const tb = b.tier === 'official' ? 0 : 1;
        return ta !== tb ? ta - tb : moiNhatTruoc(a, b);
      });
    }

    ra.push({ kind, nhan: NHAN[kind] ?? kind, stackKind, rows: xep });
  }
  return ra;
}
