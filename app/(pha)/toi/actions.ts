'use server';

/**
 * Server actions của trang Tôi (story 2-9 — FR-55, FR-64).
 *
 * Gọi core/identity (index — AD-24: core tự resolve session, node CỦA MÌNH lấy từ session chứ
 * không bao giờ từ tham số, nên "chỉ chỉnh được về mình" là cấu trúc, không phải một cái check).
 * AD-23: trang phụ thuộc người xem → revalidatePath sau mutation, không cache gì.
 *
 * Chữ trả về là chữ BỀ MẶT A: không xưng hô, không từ công nghệ — message thô của core không
 * được rơi thẳng ra màn.
 *
 * Trạng thái ban đầu của hai quyền giờ đọc thật qua getMyPersonFlags (page.tsx truyền vào
 * quyen-hien-thi.tsx) — action này chỉ còn lo đường ghi.
 */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { markNotificationSeen, updateSelfVisibility } from '@/core/identity';

export type KetQuaQuyen =
  | { ok: true; dangBat: boolean; thongBao: string }
  | { ok: false; thongBao: string }
  | null;

function loiNhe(code: string): string {
  if (code === 'unattached') return 'Chưa nhận chỗ của mình trong phả — nhận chỗ trước đã.';
  return 'Chưa ghi được. Thử lại sau.';
}

/** FR-55 — ẩn khỏi phần cả họ xem được. Liên kết phả hệ GIỮ NGUYÊN (được ẩn, không được xóa). */
export async function anKhoiCongKhai(
  _truoc: KetQuaQuyen,
  formData: FormData,
): Promise<KetQuaQuyen> {
  const bat = formData.get('bat') === '1';
  const ketQua = await updateSelfVisibility({ hiddenFromPublic: bat });
  if (!ketQua.ok) {
    if (ketQua.error.code === 'unauthenticated') redirect('/dang-nhap');
    return { ok: false, thongBao: loiNhe(ketQua.error.code) };
  }
  revalidatePath('/toi');
  return {
    ok: true,
    dangBat: bat,
    thongBao: bat
      ? 'Đã ẩn khỏi phần cả họ xem được — nhánh trên dưới vẫn liền.'
      : 'Tên đã hiện lại với cả họ.',
  };
}

/** FR-55 — từ chối xuất hiện trong bản in. */
export async function tuChoiBanIn(
  _truoc: KetQuaQuyen,
  formData: FormData,
): Promise<KetQuaQuyen> {
  const bat = formData.get('bat') === '1';
  const ketQua = await updateSelfVisibility({ refusePrint: bat });
  if (!ketQua.ok) {
    if (ketQua.error.code === 'unauthenticated') redirect('/dang-nhap');
    return { ok: false, thongBao: loiNhe(ketQua.error.code) };
  }
  revalidatePath('/toi');
  return {
    ok: true,
    dangBat: bat,
    thongBao: bat
      ? 'Đã ghi lại: bản in sẽ không in tên mình.'
      : 'Đã ghi lại: bản in được in tên mình.',
  };
}

/**
 * Đánh dấu các thông báo FR-55 đã xem ("Để nguyên như đang ghi"). Idempotent phía core;
 * dòng hỏng không chặn dòng lành — thông báo là chuyện đưa tin, không phải chuyện phả.
 */
export async function daXemThongBao(formData: FormData): Promise<void> {
  const ids = formData
    .getAll('id')
    .filter((x): x is string => typeof x === 'string' && x.length > 0);
  for (const id of ids) {
    const ketQua = await markNotificationSeen(id);
    if (!ketQua.ok && ketQua.error.code === 'unauthenticated') redirect('/dang-nhap');
  }
  revalidatePath('/toi');
}
