'use server';

/**
 * Server actions của cột phải — chồng khẳng định (story 5-3).
 *
 * ── Vì sao NGƯỜI ĐANG CHỌN đi qua action, không qua URL ────────────────────────────────────
 * Neo thì nằm ở URL (`?neo=`) vì dời tâm là một chỗ đứng mới, đáng có mục trong lịch sử. Người
 * đang chọn thì KHÔNG: đưa nó vào URL là mỗi cú bấm một lượt điều hướng, `loading.tsx` thay cả
 * trang, và canvas chớp tắt theo — trong khi luật của 5-2 là *chọn người thì canvas đứng yên*.
 * Một lượt gọi action giữ canvas nguyên vẹn và chỉ cột phải đổi.
 *
 * Cả ba action trả `Result` NGUYÊN VẸN từ core (không dịch, không throw). Quyền do core tự gác
 * (`gateApprover` trong từng op) — kể cả khi bị POST thẳng không qua UI thì core vẫn chặn (AD-24).
 */
import { revalidatePath } from 'next/cache';
import { addAssertion, addPerson, promoteAssertion, rejectAssertion } from '@/core/assertion';
import type { AssertionSpec, NewPersonInput } from '@/core/assertion';
import { LOAI_GHI_THEM, type LoaiGhiThem } from '@/components/admin/loai-ghi-them';
import type { HuongThem } from '@/components/admin/dat-nut-tam';
import { getPerson, type AssertionStack, type PersonProfile } from '@/core/person';
import { addPlace, searchPlaces, type UngVienNoiChon } from '@/core/place';
import { err, type Result } from '@/core/types';

export type HoSoNguoi = {
  personId: string;
  hoTen: string;
  /** Vắng khi người xem không có tầm nhìn đầy đủ với người này (AD-13/AD-21) — KHÔNG phải lỗi. */
  chong?: AssertionStack[];
  visibility: PersonProfile['visibility'];
};

export async function xemHoSo(personId: string): Promise<Result<HoSoNguoi>> {
  const res = await getPerson(personId);
  if (!res.ok) return res;
  const v = res.value;
  return {
    ok: true,
    value: {
      personId: v.card.personId,
      hoTen: v.card.fullName,
      ...(v.stacks !== undefined ? { chong: v.stacks } : {}),
      visibility: v.visibility,
    },
  };
}

/**
 * AD-19: nâng tầng và chiếu giá trị lên `person` là MỘT thao tác trong một transaction, do
 * `core/assertion` làm. Ở đây chỉ gọi và làm mới số.
 */
export async function nangTang(assertionId: string): Promise<Result<void>> {
  const res = await promoteAssertion(assertionId);
  if (res.ok) lamMoiSo();
  return res;
}

/**
 * AD-4: giá trị thua rời DỮ LIỆU SỐNG nhưng ở lại NHẬT KÝ. Đây không phải xoá, và giao diện
 * không được gọi nó là xoá — `rejectAssertionOp` ghi nguyên hàng vào revision trước khi gỡ.
 */
export async function loaiKhangDinh(assertionId: string, ghiChu: string): Promise<Result<void>> {
  const res = await rejectAssertion(assertionId, ghiChu);
  if (res.ok) lamMoiSo();
  return res;
}

/**
 * `'layout'` chứ không phải mặc định `'page'`: nâng tầng làm đổi số trên "Hàng chờ khẳng định",
 * mà con số ấy do `app/admin/layout.tsx` dựng, không phải trang này. Bài học đã trả giá một lần ở
 * `ghiVaoPha` (code review 5-1).
 */
function lamMoiSo(): void {
  revalidatePath('/admin', 'layout');
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
export async function themNguoi(moi: NguoiMoi): Promise<Result<{ personId: string }>> {
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

  // Người mới vào tồn nghi ⇒ số trên "Hàng chờ khẳng định" vừa tăng, mà số ấy do layout dựng.
  lamMoiSo();
  return { ok: true, value: { personId: res.value.personId } };
}


// ── Ghi thêm khẳng định cho người ĐÃ CÓ (story 5-6) ────────────────────────────────────────

/**
 * `addAssertion` là **mã chết toàn app** từ Đợt 1 cho tới lúc này: không màn nào gọi, nên người đã
 * có trong phả thì đóng băng ở đúng những gì tệp CSV đầu tiên mang vào. Đây là đường gọi ấy.
 *
 * Giá trị mới KHÔNG thay giá trị cũ — nó vào Tầng tồn nghi và đứng CẠNH giá trị cũ trong chồng
 * khẳng định (AD-9). Nếu hai thứ không thể cùng đúng thì chồng ấy vừa hoá thành chồng mâu thuẫn,
 * và người duyệt chọn một ở đó (5-3).
 */
export async function ghiThemKhangDinh(
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

  // `place` KHÔNG đi đường này: giá trị của nó là một `placeId` đã có trong danh mục, cộng một
  // vai — hai thứ, không phải một chuỗi. Nó có lối riêng là `ghiThemNoi`.
  if (loai === 'place') {
    return err('invalid', 'Nơi chốn ghi bằng lối riêng, không qua đường này.');
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

  // Khẳng định mới vào Tầng tồn nghi ⇒ số trên "Hàng chờ khẳng định" của thanh việc vừa tăng.
  // Con số ấy do `app/admin/layout.tsx` dựng, nên phải `'layout'`, không phải mặc định `'page'`.
  const res = await addAssertion(personId, spec, { kind: 'told-by', description: nguon });
  if (res.ok) lamMoiSo();
  return res;
}


// ── Nơi chốn (story 5-7, FR-65) ────────────────────────────────────────────────────────────

export type VaiNoi = 'que-quan' | 'tru-quan' | 'an-tang';

/**
 * Gõ tự do → ứng viên. FR-65: *"Nhập không được chặn luồng"* — không có bước "tạo danh mục nơi
 * trước rồi mới nhập người". Rỗng là kết quả HỢP LỆ, nghĩa là mời tạo mới.
 */
export async function timNoi(ten: string, donViCha: string): Promise<Result<UngVienNoiChon[]>> {
  /**
   * Sàn HAI ký tự, ngang ô tìm người (`khung-admin.tsx`).
   *
   * `chamDiemNoi` khớp bằng `includes` hai chiều, nên một ký tự trần khớp gần như mọi hàng và trả
   * về tên + đơn vị hành chính đầy đủ. Vài chục lượt gõ một chữ cái là đi bộ hết danh mục — mà
   * danh mục nơi chứa cả địa chỉ tự do của người đang sống (FR-37).
   */
  if (ten.trim().length < 2) return { ok: true, value: [] };
  return searchPlaces(ten, donViCha);
}

/** Tạo một nơi mới. Trùng khít (cùng tên, cùng đơn vị cha) ⇒ `conflict` kèm nơi đã có. */
export async function taoNoi(
  ten: string,
  donViCha: string,
): Promise<Result<{ placeId: string; nhan: string }>> {
  return addPlace({ name: ten, parentUnit: donViCha });
}

/** Gắn một nơi vào người, bằng khẳng định như mọi dữ liệu khác (FR-1/FR-2/FR-3). */
export async function ghiThemNoi(
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
  const res = await addAssertion(
    personId,
    { kind: 'place', placeId, role: vai },
    { kind: 'told-by', description: nguon },
  );
  if (res.ok) lamMoiSo(); // xem `ghiThemKhangDinh` — cùng lý do
  return res;
}
