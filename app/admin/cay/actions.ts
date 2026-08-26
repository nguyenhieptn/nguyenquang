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
import {
  dungLoiGoiQuanHe,
  HUONG_QUAN_HE,
  QUAN_HE_MAU,
  type HuongQuanHe,
  type LoaiQuanHe,
  type QuanHeMau,
} from '@/components/admin/quan-he-ghi-them';
import { getPerson, type AssertionStack, type PersonProfile } from '@/core/person';
import { getAncestryPath } from '@/core/tree';
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
export async function loaiKhangDinh(
  assertionId: string,
  ghiChu: string,
): Promise<Result<{ doiTuongId?: string }>> {
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

  // `place` và hai loại QUAN HỆ không đi đường này: giá trị của chúng là một id đã có, cộng một
  // vai (nơi) hoặc một CHIỀU (cha-con) — hai thứ, không phải một chuỗi. Mỗi loại có lối riêng:
  // `ghiThemNoi` và `ghiThemQuanHe`.
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

  // Khẳng định mới vào Tầng tồn nghi ⇒ số trên "Hàng chờ khẳng định" của thanh việc vừa tăng.
  // Con số ấy do `app/admin/layout.tsx` dựng, nên phải `'layout'`, không phải mặc định `'page'`.
  const res = await addAssertion(personId, spec, { kind: 'told-by', description: nguon });
  if (res.ok) lamMoiSo();
  return res;
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
 * ── Vì sao đây là một lối riêng, không phải một nhánh của `ghiThemKhangDinh` ──────────────
 * Giá trị của nó là một `personId` cộng một CHIỀU, không phải một chuỗi. Nhồi vào lối cũ thì
 * chữ ký hàm phải mang thêm hai tham số chỉ hai loại dùng tới — đúng cái đã khiến `place` được
 * tách ra ở 5-7.
 *
 * ── Chiều tính Ở ĐÂY, không nhận từ client ────────────────────────────────────────────────
 * `chieuChaCon` là module thuần, dùng chung với biểu mẫu, nên câu người vận hành đọc trên màn và
 * hàng ghi xuống database sinh ra từ CÙNG một phép tính. Nhưng phép tính chạy lại ở server: đây
 * là một điểm cuối HTTP thật, POST thẳng vào được (AD-24 nói core vẫn gác QUYỀN, không ai gác hộ
 * hình dạng dữ liệu).
 */
export async function ghiThemQuanHe(
  a: QuanHeMoi,
): Promise<Result<{ assertionId: string; alreadyLinked?: boolean }>> {
  if (a.loai !== 'parent-child' && a.loai !== 'union-partner') {
    return err('invalid', 'Loại quan hệ này không ghi được từ đây.');
  }
  // `huong` và `quanHe` CHỈ có nghĩa với cha-con. Bản trước kiểm cả hai trước khi rẽ loại, nên
  // một lượt POST `union-partner` thiếu `huong` nhận về "Chưa rõ ai là cha, ai là con." — một câu
  // nói về thứ loại ấy không có.
  if (a.loai === 'parent-child') {
    if (!(HUONG_QUAN_HE as readonly string[]).includes(a.huong)) {
      return err('invalid', 'Chưa rõ ai là cha, ai là con.');
    }
    if (!(QUAN_HE_MAU as readonly string[]).includes(a.quanHe)) {
      return err('invalid', 'Quan hệ này chưa hợp lệ.');
    }
  }
  if (!a.personId || !a.nguoiKiaId) return err('invalid', 'Chưa chọn đủ hai người.');
  // Core cũng chặn (`addAssertionOp:361`, `:373`), nhưng chặn ở đây thì lời nhắn nói đúng việc
  // người vận hành vừa làm, thay vì một câu tiếng Anh của tầng dưới.
  if (a.personId === a.nguoiKiaId) {
    return err('invalid', 'Một người không thể là cha mẹ hay vợ chồng của chính mình.');
  }

  const nguon = a.xuatXu.trim();
  if (!nguon) return err('invalid', 'Chưa ghi nghe được điều này từ đâu.');

  // Phép ánh xạ (kể cả CHIỀU) nằm trọn ở module thuần, và chạy lại Ở ĐÂY chứ không nhận từ
  // client: đây là một điểm cuối HTTP thật, POST thẳng vào được.
  const { personId, spec } = dungLoiGoiQuanHe({
    loai: a.loai,
    nguoiNayId: a.personId,
    nguoiKiaId: a.nguoiKiaId,
    huong: a.huong,
    quanHe: a.quanHe,
  });

  /**
   * ── Vòng huyết thống: chặn TRƯỚC khi ghi (chốt 26/08/2026, code review 6-1) ───────────────
   *
   * Story này là đường ĐẦU TIÊN trong giao diện nối được hai người đã có, nên nó cũng là đường
   * đầu tiên tạo được vòng: ghi "A là con của B" rồi "B là con của A" đều qua `addAssertionOp`
   * (nó chỉ chặn tự-làm-cha-mình), và câu xem trước đọc trôi chảy cả hai lượt.
   *
   * `computeStructure` không treo — nó có `inStack`/`visited` — nhưng số đời và mã chi tính theo
   * nhánh BFS nào tới trước, tức lệch IM LẶNG cho cả mảnh. Trong một hệ không có nút xoá, một
   * vòng ghi vào là một vòng phải đi loại từng cạnh mới gỡ.
   *
   * Kiểm qua bề mặt công khai của `core/tree` (AD-1: adapter không tự đọc DB). `getAncestryPath`
   * đi ngược lên từ người sắp làm CHA; nếu người sắp làm CON đã nằm trên đường ấy thì cạnh mới
   * khép vòng. Đọc hỏng thì KHÔNG cho ghi: ở đây "chưa biết" phải xử như "có thể sai".
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
  /**
   * Người kia bị GỘP giữa lúc biểu mẫu đang mở: core trả câu tiếng Anh của tầng dưới
   * (*"parent was merged into another person"*). Câu ấy đúng nhưng không nói phải làm gì, và nó
   * rơi vào một màn tiếng Việt.
   */
  if (!res.ok && /merged into/.test(res.error.message)) {
    return err(
      'conflict',
      'Người vừa chọn đã được gộp vào một người khác trong lúc biểu mẫu đang mở. Chọn lại người còn giữ hồ sơ.',
    );
  }

  // Cạnh mới đổi HÌNH của cây, không chỉ đổi một ô chữ: số "Mảnh chưa nối" trên thanh việc do
  // `app/admin/layout.tsx` dựng, và chính nó là con số story này sinh ra để làm giảm.
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
