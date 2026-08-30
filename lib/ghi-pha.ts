/**
 * ĐƯỜNG ĐỌC HỒ SƠ VÀ ĐƯỜNG GHI VÀO PHẢ — dùng chung cho HAI bề mặt (story 6-10).
 *
 * ── Vì sao tách ra khỏi `app/admin/cay/actions.ts` ──────────────────────────────────────────
 * Story 6-10 dựng view "Phả quanh mình" cho người trong họ: cùng canvas, cùng phiếu, cùng ba
 * biểu mẫu ghi — chỉ khác quyền duyệt và chỗ làm mới. Chép 400 dòng kiểm đầu vào sang một file
 * `'use server'` thứ hai là hai bản dạy hai luật, và lệch nhau ở lượt sửa đầu tiên. Nên phần
 * KIỂM + GỌI CORE nằm đây, còn hai file `actions.ts` chỉ là vỏ `'use server'` mỏng: gọi vào đây
 * rồi `revalidatePath` đúng đường của bề mặt mình.
 *
 * ── Đây là mã CHỈ CHẠY Ở SERVER ─────────────────────────────────────────────────────────────
 * Nó gọi bề mặt `@/core/*`, tức kéo `pg` theo. Import từ một client component thì `next build`
 * gãy với *"Can't resolve 'dns'"* — cùng hàng rào với `lib/vai-quan-tri.ts`. Lint không bắt
 * (luật chỉ chặn ruột core và `@/db`), nên chỗ chặn duy nhất là lượt build.
 *
 * Lint AD-1/AD-24 áp cho `lib/**`: chỉ bề mặt `@/core/<module>`, không `@/db`, không `ops`.
 *
 * Mọi hàm trả `Result` NGUYÊN VẸN từ core (không dịch, không throw). Quyền do core tự gác
 * (`gateWriter` / `gateApprover` trong từng op) — POST thẳng không qua UI thì core vẫn chặn.
 */
import { addAssertion, addPerson, hideAssertion } from '@/core/assertion';
import type { AssertionSpec, NewPersonInput } from '@/core/assertion';
import { LOAI_GHI_THEM, type LoaiGhiThem } from '@/components/admin/loai-ghi-them';
import type { HuongThem } from '@/components/admin/dat-nut-tam';
import type { KetQuaTim } from '@/components/admin/man-admin';
import {
  dungLoiGoiQuanHe,
  HUONG_QUAN_HE,
  QUAN_HE_MAU,
  type HuongQuanHe,
  type LoaiQuanHe,
  type QuanHeMau,
} from '@/components/admin/quan-he-ghi-them';
import { getPerson, type AssertionStack, type PersonProfile } from '@/core/person';
import { addPlace, searchPlaces, type UngVienNoiChon } from '@/core/place';
import { getAncestryPath, searchPersons } from '@/core/tree';
import { err, type Result } from '@/core/types';

// ── Hồ sơ một người (story 5-3 · 6-7) ───────────────────────────────────────────────────────

/** Một người trong nhóm quan hệ — đủ để bày chip và chọn họ. */
export type ChipQuanHe = { personId: string; hoTen: string };

export type HoSoNguoi = {
  personId: string;
  hoTen: string;
  /**
   * Story 6-7 — tiểu sử cơ bản, rút từ `PersonCard`. `getPerson` đã tính trọn `card` từ Đợt 1;
   * bản trước `xemHoSo` giữ đúng bốn trường và vứt nó. Không phải một lượt đọc thêm, chỉ là thôi vứt.
   */
  tieuSu: { doi: number | null; chi: string | null };
  /** Ba nhóm quan hệ; mỗi thẻ đã lọc RIÊNG theo bán kính, và không đi cùng `chong`. */
  quanHe: { chaMe: ChipQuanHe[]; banDoi: ChipQuanHe[]; con: ChipQuanHe[] };
  /** Vắng khi người xem không có tầm nhìn đầy đủ với người này (AD-13/AD-21) — KHÔNG phải lỗi. */
  chong?: AssertionStack[];
  visibility: PersonProfile['visibility'];
};

export async function docHoSo(personId: string): Promise<Result<HoSoNguoi>> {
  const res = await getPerson(personId);
  if (!res.ok) return res;
  const v = res.value;
  return {
    ok: true,
    value: {
      personId: v.card.personId,
      hoTen: v.card.fullName,
      tieuSu: { doi: v.card.generation, chi: v.card.branchCode },
      /**
       * `relations` lọc TỪNG thẻ riêng theo bán kính và KHÔNG đi cùng `stacks`: một người ngoài
       * tầm nhìn đầy đủ vẫn có thể có quan hệ xem được. Buộc hai thứ vào nhau là giấu mất một
       * nửa mà không có lý do nào.
       */
      quanHe: {
        chaMe: v.relations.parents.map((c) => ({ personId: c.personId, hoTen: c.fullName })),
        banDoi: v.relations.partners.map((c) => ({ personId: c.personId, hoTen: c.fullName })),
        con: v.relations.children.map((c) => ({ personId: c.personId, hoTen: c.fullName })),
      },
      ...(v.stacks !== undefined ? { chong: v.stacks } : {}),
      visibility: v.visibility,
    },
  };
}

// ── Tìm người (ô tìm · bộ chọn người) ──────────────────────────────────────────────────────

/**
 * Trả MẢNG chứ không trả `Result`, và NÉM khi đọc hỏng — không quy về rỗng.
 *
 * Rỗng ở ô tìm có nghĩa xác định: *"đã tìm, phần phả xem được không có ai tên ấy"*. Một lượt đọc
 * HỎNG không biết điều đó. Quy nó về rỗng là dạy người dùng một câu sai — và đúng là câu họ sẽ tin:
 * họ đi tạo người mới cho một người đã có trong phả. Ném ra thì `.catch` ở ô tìm nói đúng câu
 * thứ hai ("chưa đọc được").
 */
export async function timNguoiTrongPha(tuKhoa: string): Promise<KetQuaTim[]> {
  const ketQua = await searchPersons(tuKhoa);
  if (!ketQua.ok) throw new Error(ketQua.error.message);
  return ketQua.value.slice(0, 8).map((h) => ({
    personId: h.personId,
    hoTen: h.fullName,
    // Cái phân biệt hai người trùng tên — trong một dòng họ, trùng tên là chuyện thường.
    nguCanh: [
      h.generation != null ? `đời ${h.generation}` : null,
      h.branchCode ? `chi ${h.branchCode}` : null,
      h.lifespan || null,
    ]
      .filter(Boolean)
      .join(' · '),
  }));
}

// ── Thêm người vào phả (story 5-4) ─────────────────────────────────────────────────────────

export type NguoiMoi = {
  hoTen: string;
  gioiTinh?: 'male' | 'female' | 'other';
  namSinh?: string;
  namMat?: string;
  ghiChu?: string;
  /** FR-1: đơn vị dữ liệu là KHẲNG ĐỊNH về người — ai khai, dựa vào đâu. Bắt buộc. */
  xuatXu: string;
  mocId?: string;
  huong: HuongThem;
};

function nam(raw: string | undefined): number | null {
  if (!raw) return null;
  return /^\d{4}$/.test(raw) ? Number(raw) : NaN;
}

/**
 * Ghi một người mới.
 *
 * Kiểm lại đầu vào Ở ĐÂY dù biểu mẫu đã kiểm: server action là một điểm cuối HTTP thật, POST
 * thẳng vào được mà không qua UI (AD-24 nói core vẫn gác quyền, nhưng hình dạng dữ liệu thì
 * không ai gác hộ).
 *
 * Mọi thứ vào Tầng tồn nghi — `createPersonOp` lo assertion (AD-9), revision cùng transaction
 * (AD-10), thông báo cho người sống được thêm (AD-15), và chiếu giá trị lên `person` (AD-19).
 */
export async function ghiNguoiMoi(moi: NguoiMoi): Promise<Result<{ personId: string }>> {
  const hoTen = moi.hoTen.trim();
  if (!hoTen) return err('invalid', 'Chưa có họ tên.');

  const xuatXu = moi.xuatXu.trim();
  if (!xuatXu) return err('invalid', 'Chưa ghi nghe được điều này từ đâu.');

  const sinh = nam(moi.namSinh);
  const mat = nam(moi.namMat);
  if (Number.isNaN(sinh)) return err('invalid', 'Năm sinh phải là bốn chữ số.');
  if (Number.isNaN(mat)) return err('invalid', 'Năm mất phải là bốn chữ số.');
  if (sinh !== null && mat !== null && mat < sinh) {
    return err('invalid', `Năm mất ${mat} đứng trước năm sinh ${sinh}.`);
  }

  // Hướng quan hệ chỉ có nghĩa khi có mốc. Không có mốc thì người mới đứng rời, thành gốc tạm của
  // một mảnh — FR-63, và đó là một lựa chọn hợp lệ chứ không phải đường cùng.
  const moc = moi.mocId;
  const quanHe: Pick<NewPersonInput, 'parentId' | 'childId' | 'partnerId'> =
    !moc || moi.huong === 'roi'
      ? {}
      : moi.huong === 'con'
        ? { parentId: moc }
        : moi.huong === 'cha-me'
          ? { childId: moc }
          : { partnerId: moc };

  const res = await addPerson({
    fullName: hoTen,
    ...(moi.gioiTinh ? { gender: moi.gioiTinh } : {}),
    ...(sinh !== null ? { birth: { date: `${sinh}-01-01`, precision: 'year' as const } } : {}),
    ...(mat !== null ? { death: { date: `${mat}-01-01`, precision: 'year' as const } } : {}),
    ...(moi.ghiChu?.trim() ? { note: moi.ghiChu.trim() } : {}),
    ...quanHe,
    source: { kind: 'told-by', description: xuatXu },
  });
  if (!res.ok) return res;
  return { ok: true, value: { personId: res.value.personId } };
}

// ── Ghi thêm khẳng định cho người ĐÃ CÓ (story 5-6) ────────────────────────────────────────

/**
 * Giá trị mới KHÔNG thay giá trị cũ — nó vào Tầng tồn nghi và đứng CẠNH giá trị cũ trong chồng
 * khẳng định (AD-9). Nếu hai thứ không thể cùng đúng thì chồng ấy vừa hoá thành chồng mâu thuẫn,
 * và người duyệt chọn một ở đó (5-3).
 */
export async function ghiKhangDinh(
  personId: string,
  loai: LoaiGhiThem,
  giaTri: string,
  xuatXu: string,
): Promise<Result<{ assertionId: string }>> {
  if (!(LOAI_GHI_THEM as readonly string[]).includes(loai)) {
    return err('invalid', 'Loại khẳng định này không ghi được từ đây.');
  }

  const v = giaTri.trim();
  if (!v) return err('invalid', 'Chưa có giá trị nào để ghi.');

  const nguon = xuatXu.trim();
  if (!nguon) return err('invalid', 'Chưa ghi nghe được điều này từ đâu.');

  // `place` và hai loại QUAN HỆ không đi đường này: giá trị của chúng là một id đã có, cộng một
  // vai (nơi) hoặc một CHIỀU (cha-con) — hai thứ, không phải một chuỗi. Mỗi loại có lối riêng.
  if (loai === 'place') {
    return err('invalid', 'Nơi chốn ghi bằng lối riêng, không qua đường này.');
  }
  if (loai === 'parent-child' || loai === 'union-partner') {
    return err('invalid', 'Quan hệ ghi bằng lối riêng, không qua đường này.');
  }

  let spec: AssertionSpec;
  switch (loai) {
    case 'name':
      spec = { kind: 'name', fullName: v };
      break;
    case 'gender':
      if (v !== 'male' && v !== 'female' && v !== 'other') {
        return err('invalid', 'Giới tính chưa hợp lệ.');
      }
      spec = { kind: 'gender', gender: v };
      break;
    case 'birth':
    case 'death': {
      if (!/^\d{4}$/.test(v)) return err('invalid', 'Năm phải là bốn chữ số.');
      spec = { kind: loai, value: { date: `${v}-01-01`, precision: 'year' } };
      break;
    }
    case 'note':
      spec = { kind: 'note', text: v };
      break;
  }

  return addAssertion(personId, spec, { kind: 'told-by', description: nguon });
}

// ── Quan hệ giữa hai người ĐÃ CÓ (story 6-1) ───────────────────────────────────────────────

export type QuanHeMoi = {
  /** Người đang mở hồ sơ ở cột phải. */
  personId: string;
  /** Người vừa chọn trong bộ chọn. */
  nguoiKiaId: string;
  loai: LoaiQuanHe;
  /** Chỉ có nghĩa với `parent-child`. `union-partner` đối xứng nên bỏ qua. */
  huong: HuongQuanHe;
  quanHe: QuanHeMau;
  xuatXu: string;
};

/**
 * Nối hai người ĐÃ CÓ trong phả.
 *
 * ── Chiều tính Ở ĐÂY, không nhận từ client ────────────────────────────────────────────────
 * `chieuChaCon` là module thuần, dùng chung với biểu mẫu, nên câu người dùng đọc trên màn và
 * hàng ghi xuống database sinh ra từ CÙNG một phép tính. Nhưng phép tính chạy lại ở server: đây
 * là một điểm cuối HTTP thật, POST thẳng vào được.
 */
export async function ghiQuanHe(
  a: QuanHeMoi,
): Promise<Result<{ assertionId: string; alreadyLinked?: boolean }>> {
  if (a.loai !== 'parent-child' && a.loai !== 'union-partner') {
    return err('invalid', 'Loại quan hệ này không ghi được từ đây.');
  }
  // `huong` và `quanHe` CHỈ có nghĩa với cha-con. Kiểm cả hai trước khi rẽ loại thì một lượt POST
  // `union-partner` thiếu `huong` nhận về "Chưa rõ ai là cha, ai là con." — một câu nói về thứ
  // loại ấy không có.
  if (a.loai === 'parent-child') {
    if (!(HUONG_QUAN_HE as readonly string[]).includes(a.huong)) {
      return err('invalid', 'Chưa rõ ai là cha, ai là con.');
    }
    if (!(QUAN_HE_MAU as readonly string[]).includes(a.quanHe)) {
      return err('invalid', 'Quan hệ này chưa hợp lệ.');
    }
  }
  if (!a.personId || !a.nguoiKiaId) return err('invalid', 'Chưa chọn đủ hai người.');
  // Core cũng chặn, nhưng chặn ở đây thì lời nhắn nói đúng việc người dùng vừa làm, thay vì một
  // câu tiếng Anh của tầng dưới.
  if (a.personId === a.nguoiKiaId) {
    return err('invalid', 'Một người không thể là cha mẹ hay vợ chồng của chính mình.');
  }

  const nguon = a.xuatXu.trim();
  if (!nguon) return err('invalid', 'Chưa ghi nghe được điều này từ đâu.');

  const { personId, spec } = dungLoiGoiQuanHe({
    loai: a.loai,
    nguoiNayId: a.personId,
    nguoiKiaId: a.nguoiKiaId,
    huong: a.huong,
    quanHe: a.quanHe,
  });

  /**
   * ── Vòng huyết thống: chặn TRƯỚC khi ghi (chốt 26/08/2026, code review 6-1) ───────────────
   * Ghi "A là con của B" rồi "B là con của A" đều qua `addAssertionOp` (nó chỉ chặn tự-làm-cha-
   * mình). `computeStructure` không treo nhưng số đời và mã chi lệch IM LẶNG cho cả mảnh, trong
   * một hệ không có nút xoá. Kiểm qua bề mặt công khai của `core/tree`: `getAncestryPath` đi
   * ngược lên từ người sắp làm CHA; nếu người sắp làm CON đã nằm trên đường ấy thì cạnh mới khép
   * vòng. Đọc hỏng thì KHÔNG cho ghi — "chưa biết" phải xử như "có thể sai".
   */
  if (spec.kind === 'parent-child') {
    const duong = await getAncestryPath(spec.parentId);
    if (!duong.ok) {
      return err('conflict', 'Chưa đọc được đường lên gốc để kiểm, nên chưa ghi. Thử lại.');
    }
    if (duong.value.steps.some((b) => b.personId === personId)) {
      return err(
        'conflict',
        'Không ghi được: người này đã là bậc trên của người kia trong phả, nối thêm sẽ thành vòng.',
      );
    }
  }

  const res = await addAssertion(personId, spec, { kind: 'told-by', description: nguon });
  // Người kia bị GỘP giữa lúc biểu mẫu đang mở: core trả câu tiếng Anh của tầng dưới. Câu ấy đúng
  // nhưng không nói phải làm gì, và nó rơi vào một màn tiếng Việt.
  if (!res.ok && /merged into/.test(res.error.message)) {
    return err(
      'conflict',
      'Người vừa chọn đã được gộp vào một người khác trong lúc biểu mẫu đang mở. Chọn lại người còn giữ hồ sơ.',
    );
  }
  return res;
}

// ── Nơi chốn (story 5-7, FR-65) ────────────────────────────────────────────────────────────

export type VaiNoi = 'que-quan' | 'tru-quan' | 'an-tang';

/**
 * Gõ tự do → ứng viên. FR-65: *"Nhập không được chặn luồng"* — không có bước "tạo danh mục nơi
 * trước rồi mới nhập người". Rỗng là kết quả HỢP LỆ, nghĩa là mời tạo mới.
 *
 * Sàn HAI ký tự, ngang ô tìm người: `chamDiemNoi` khớp bằng `includes` hai chiều, nên một ký tự
 * trần khớp gần như mọi hàng — mà danh mục nơi chứa cả địa chỉ tự do của người đang sống (FR-37).
 */
export async function timNoiChon(ten: string, donViCha: string): Promise<Result<UngVienNoiChon[]>> {
  if (ten.trim().length < 2) return { ok: true, value: [] };
  return searchPlaces(ten, donViCha);
}

/** Tạo một nơi mới. Trùng khít (cùng tên, cùng đơn vị cha) ⇒ `conflict` kèm nơi đã có. */
export async function taoNoiChon(
  ten: string,
  donViCha: string,
): Promise<Result<{ placeId: string; nhan: string }>> {
  return addPlace({ name: ten, parentUnit: donViCha });
}

/** Gắn một nơi vào người, bằng khẳng định như mọi dữ liệu khác (FR-1/FR-2/FR-3). */
export async function ghiNoi(
  personId: string,
  placeId: string,
  vai: VaiNoi,
  xuatXu: string,
): Promise<Result<{ assertionId: string }>> {
  if (!['que-quan', 'tru-quan', 'an-tang'].includes(vai)) {
    return err('invalid', 'Vai của nơi chưa hợp lệ.');
  }
  const nguon = xuatXu.trim();
  if (!nguon) return err('invalid', 'Chưa ghi nghe được điều này từ đâu.');
  return addAssertion(personId, { kind: 'place', placeId, role: vai }, { kind: 'told-by', description: nguon });
}

/**
 * Ẩn theo báo cáo (AD-17, story 7-3): một lượt báo cáo là ẩn NGAY, không cần duyệt — khôi phục mới
 * cần. Mọi thành viên đã gắn chỗ ẩn được (`gateWriter` trong core); lý do đi vào `revision.note` và
 * ở lại đó (AD-4). Một ruột cho cả hai bề mặt.
 */
export async function anKhangDinh(assertionId: string, lyDo: string): Promise<Result<void>> {
  if (typeof assertionId !== 'string' || typeof lyDo !== 'string') return err('invalid', 'Tham số không hợp lệ.');
  const ly = lyDo.trim();
  if (!ly) return err('invalid', 'Cần nói vì sao ẩn — lý do ở lại trong nhật ký.');
  if (ly.length > 500) return err('invalid', 'Lý do dài quá 500 chữ — nói gọn điều cần ẩn.');
  return hideAssertion(assertionId, ly);
}
