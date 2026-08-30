/**
 * core/place — FR-65: nơi chốn là dữ liệu, không phải chữ (story 5-7).
 *
 * Bề mặt adapter (AD-24): không tham số danh tính. Mỗi lối vào tự giải phiên, mở clan context, rồi
 * gọi ops.
 *
 * ── Riêng tư ─────────────────────────────────────────────────────────────────────────────
 * Bảng này là **danh mục ĐỊA DANH**, không phải dữ liệu về người: nó nói "Quang Trung, Định Hoá là
 * một nơi", không nói ai ở đó. Ai ở đâu là một KHẲNG ĐỊNH gắn vào người, và nó đi qua đúng cổng
 * riêng tư như mọi khẳng định khác (`PersonProfile.assertions` chỉ có mặt khi tầm nhìn đầy đủ —
 * AD-13/AD-21, FR-37).
 *
 * Không mở bất kỳ đường nào đọc "những ai ở nơi này" từ đây: đó đúng là cửa hậu mà FR-65 tự dặn
 * phải chặn — *"Nơi không được là cửa hậu làm rò thứ FR-37 đang giữ."*
 */
import { withClanContext } from '@/db';
import { err, type Result } from '@/core/types';
import { resolveSession } from '@/core/identity/session';
import { gateWriter } from '@/core/identity/gates';
import {
  addPlaceOps,
  listMergedPlacesOps,
  listPlacesOps,
  mergePlaceOps,
  searchPlacesOps,
  unmergePlaceOps,
  updatePlaceOps,
  type KetQuaGopNoi,
  type NoiChon,
  type NoiDaGop,
  type UngVienNoiChon,
} from './ops';

export type { KetQuaGopNoi, NoiChon, NoiDaGop, UngVienNoiChon } from './ops';
export type { MucChacChanNoi } from './cham-diem';

/**
 * Danh mục nơi của dòng họ, xếp theo tên. **Cần một tài khoản đã gắn node.**
 *
 * Sửa 25/08 sau code review: bản đầu gác bằng `resolveViewer()`, mà hàm ấy trả một `guest` cho
 * bất kỳ khách vãng lai nào. Cộng với phép khớp chuỗi con không có độ dài tối thiểu, một người
 * không đăng nhập gõ `a`, `b`, `c`… là liệt kê được cả danh mục.
 *
 * `place.name` là chữ tự do — người vận hành đầu tiên ghi trú quán bằng một địa chỉ nhà là đã
 * công bố nó. FR-65 tự dặn: *"Nơi không được là cửa hậu làm rò thứ FR-37 đang giữ."*
 */
export async function listPlaces(): Promise<Result<NoiChon[]>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'Cần đăng nhập.');
  // Danh mục là dữ liệu TRONG HỌ (FR-65), nên cổng là `gateWriter` — không chép lại (story 7-1).
  const gate = gateWriter(session);
  if (!gate.ok) return gate;
  return withClanContext(session.clanId, (tx) => listPlacesOps(tx));
}

/**
 * Gõ tự do → ứng viên đã chấm điểm.
 *
 * FR-65: *"Nhập không được chặn luồng"* — không có bước "tạo danh mục nơi trước rồi mới nhập
 * người". Rỗng là kết quả HỢP LỆ, không phải lỗi: nghĩa là mời tạo mới.
 */
export async function searchPlaces(
  ten: string,
  donViCha?: string,
): Promise<Result<UngVienNoiChon[]>> {
  // Cùng cổng với `listPlaces`: tìm là một cách liệt kê chậm hơn, không phải một quyền khác.
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'Cần đăng nhập.');
  if (!session.personId) return err('unattached', 'Chưa gắn vào một người trong phả.');
  return withClanContext(session.clanId, (tx) =>
    searchPlacesOps(tx, session, { ten, ...(donViCha !== undefined ? { donViCha } : {}) }),
  );
}

/** Tạo một nơi mới. Trùng khít ⇒ `conflict` kèm id nơi đã có. */
export async function addPlace(args: {
  name: string;
  parentUnit?: string;
}): Promise<Result<{ placeId: string; nhan: string }>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'Cần đăng nhập trước khi ghi.');
  return withClanContext(session.clanId, (tx) => addPlaceOps(tx, session, args));
}

// ── Sửa · gộp · tách (story 6-4) — cả ba gác quyền duyệt trong ops ─────────────────────────

export async function updatePlace(args: {
  placeId: string;
  name: string;
  parentUnit?: string;
}): Promise<Result<NoiChon>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'Cần đăng nhập trước khi ghi.');
  return withClanContext(session.clanId, (tx) => updatePlaceOps(tx, session, args));
}

export async function mergePlaces(loserId: string, winnerId: string): Promise<Result<KetQuaGopNoi>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'Cần đăng nhập trước khi ghi.');
  return withClanContext(session.clanId, (tx) => mergePlaceOps(tx, session, { loserId, winnerId }));
}

export async function unmergePlace(placeId: string): Promise<Result<NoiChon>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'Cần đăng nhập trước khi ghi.');
  return withClanContext(session.clanId, (tx) => unmergePlaceOps(tx, session, { placeId }));
}

/** Bia mộ kèm nơi thắng. Cùng cổng với `listPlaces`. */
export async function listMergedPlaces(): Promise<Result<NoiDaGop[]>> {
  const session = await resolveSession();
  if (!session) return err('unauthenticated', 'Cần đăng nhập.');
  const gate = gateWriter(session);
  if (!gate.ok) return gate;
  return withClanContext(session.clanId, (tx) => listMergedPlacesOps(tx));
}
