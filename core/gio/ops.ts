/**
 * LỊCH GIỖ (FR-41, story 7-5) — đọc mọi khẳng định `gio` SỐNG của người ĐÃ KHUẤT, quy ra ngày dương
 * kế tiếp. Người đã khuất là `'full'` với mọi người xem (AD-13: bán kính chỉ gác người sống), nên
 * lịch giỗ là dữ liệu công khai — khách vãng lai xem được, như trang một người của các cụ.
 *
 * Người CÒN SỐNG mà có khẳng định giỗ (ghi nhầm, hay ẩn năm mất — AD-19) thì KHÔNG vào lịch: bày
 * giỗ cho người sống là điều không được xảy ra, kể cả khi dữ liệu nói thế.
 */
import { and, eq, isNull } from 'drizzle-orm';
import type { Tx } from '@/db';
import { assertion, person } from '@/db/schema';
import { ok, type Result } from '@/core/types';
import type { ViewerContext } from '@/core/identity/session';
import { cauGio, chuoiAm, chuoiDuong, gioKeTiep, homNayVN, soNgayGiua, type NgayDuong } from '@/core/lich/am-lich';

export type GioSapToi = {
  personId: string;
  fullName: string;
  /** Ngày giỗ âm lịch như nhà ghi. */
  ngay: number;
  thang: number;
  nhuan: boolean;
  chuoiAm: string;
  /** Lần giỗ kế tiếp, lịch dương (YYYY-MM-DD) và chuỗi dd/mm/yyyy. */
  duong: string;
  chuoiDuong: string;
  /** Số ngày nữa tới giỗ (0 = hôm nay). */
  conNgay: number;
  tier: 'tentative' | 'official';
  /** Câu đầy đủ, nói cả khi năm nay phải lệch (không tháng nhuận · tháng thiếu). */
  cau: string;
  /** Người này có HAI ngày giỗ khai khác nhau đang sống — chồng mâu thuẫn chờ ban tu phả (7-5 review). */
  mauThuan: boolean;
};

export async function listGioSapToiOps(
  tx: Tx,
  _ctx: ViewerContext,
  args: { soNgay: number; homNay?: NgayDuong },
): Promise<Result<GioSapToi[]>> {
  const homNay = args.homNay ?? homNayVN();
  const rows = await tx
    .select({
      personId: assertion.subjectPersonId,
      value: assertion.value,
      tier: assertion.tier,
      fullName: person.fullName,
      isLiving: person.isLiving,
    })
    .from(assertion)
    .innerJoin(person, eq(assertion.subjectPersonId, person.id))
    .where(and(eq(assertion.kind, 'gio'), eq(assertion.status, 'live'), eq(person.isLiving, false), isNull(person.mergedInto)));

  // Người có >1 giỗ sống = chồng mâu thuẫn (DON_TRI.gio): mỗi ngày vẫn vào lịch — không tự chọn hộ —
  // nhưng mang cờ để màn nói "hai ngày khai khác nhau".
  const soGio = new Map<string, number>();
  for (const r of rows) soGio.set(r.personId, (soGio.get(r.personId) ?? 0) + 1);

  const ra: GioSapToi[] = [];
  for (const r of rows) {
    const v = (r.value ?? {}) as Record<string, unknown>;
    const g = { ngay: Number(v.ngay), thang: Number(v.thang), nhuan: v.nhuan === true };
    if (!(g.ngay >= 1 && g.ngay <= 30 && g.thang >= 1 && g.thang <= 12)) continue;
    const ke = gioKeTiep(g, homNay);
    const conNgay = soNgayGiua(homNay, ke.duong);
    if (conNgay > args.soNgay) continue;
    ra.push({
      personId: r.personId,
      fullName: r.fullName.trim() || 'Chưa rõ tên',
      ngay: g.ngay,
      thang: g.thang,
      nhuan: g.nhuan,
      chuoiAm: chuoiAm(g),
      duong: `${ke.duong.nam}-${String(ke.duong.thang).padStart(2, '0')}-${String(ke.duong.ngay).padStart(2, '0')}`,
      chuoiDuong: chuoiDuong(ke.duong),
      conNgay,
      tier: r.tier,
      cau: cauGio(g, ke),
      mauThuan: (soGio.get(r.personId) ?? 0) > 1,
    });
  }
  // Gần nhất trước; cùng ngày thì theo tên.
  ra.sort((a, b) => a.conNgay - b.conNgay || a.fullName.localeCompare(b.fullName, 'vi'));
  return ok(ra);
}

