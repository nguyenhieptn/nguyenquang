/**
 * ÁNH XẠ core/tree → thẻ hiển thị của cây (story 2-6).
 *
 * Vì sao tồn tại: các component cây là client thuần ('use client', qua cổng tải động) nên KHÔNG
 * được import core — core kéo theo next/headers và db. Trang server gọi core, rồi đi qua đây để
 * đổi PersonCard/BranchView thành đúng cái thẻ cần vẽ. Chỉ dùng `import type` từ core.
 */
import type { BranchView, CoupleNode, PersonCard } from '@/core/tree';
import type { CapCay, NguoiTrenCay } from '@/components/pha/cay-gia-pha';

/** "hôm nay" / "hôm qua" / "22/8/2026" — dòng ghi công FR-39 đọc như lời người, không như log. */
export function nhanNgay(iso: string): string {
  const luc = new Date(iso);
  if (Number.isNaN(luc.getTime())) return '';
  const dau = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const lech = Math.round((dau(new Date()) - dau(luc)) / 86_400_000);
  if (lech <= 0) return 'hôm nay';
  if (lech === 1) return 'hôm qua';
  return luc.toLocaleDateString('vi-VN');
}

/**
 * Tên chi từ mã chi dẫn xuất (AD-5): "1" → "chi Cả", "2" → "chi Hai"…
 * Cách gọi của phả nhà — con trưởng là chi Cả, không phải "chi 1".
 */
const TEN_THU: string[] = ['Cả', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười'];

export function tenChi(maChi: string): string {
  const dau = Number(maChi.split('.')[0]);
  if (!Number.isFinite(dau) || dau < 1) return 'chi';
  return `chi ${TEN_THU[dau - 1] ?? dau}`;
}

/** Dòng phụ "đời 6 · chi Hai" của một người — phần nào thiếu thì vắng, không đoán. */
export function dongViTri(card: PersonCard): string {
  const phan: string[] = [];
  if (card.generation != null) phan.push(`đời ${card.generation}`);
  if (card.branchCode) phan.push(tenChi(card.branchCode));
  return phan.join(' · ');
}

/** PersonCard (đã lọc bán kính riêng tư ở core — AD-13) → thẻ trên cây. */
export function theNguoi(card: PersonCard): NguoiTrenCay {
  return {
    id: card.personId,
    hoTen: card.fullName,
    doiSong: card.lifespan,
    tinCay: card.confidence,
    // Chất liệu tồn nghi theo TẦNG (FR-3), tách khỏi chip mức tin cậy (FR-2).
    tonNghi: card.tier === 'tentative',
    href: `/nguoi/${card.personId}`,
    nguoiThem: card.attribution?.byName,
    ngayThem: card.attribution ? nhanNgay(card.attribution.at) : undefined,
  };
}

/** BranchView → danh sách cặp cho cây bản máy. Cha–con nối theo `childrenIds` của core. */
export function capsTuChi(chi: BranchView): CapCay[] {
  const cacCap: CoupleNode[] = chi.generations.flatMap((g) => g.couples);
  const coMat = new Set(cacCap.map((c) => c.person.personId));
  const chaCua = new Map<string, string>();
  for (const cap of cacCap)
    for (const con of cap.childrenIds)
      if (!chaCua.has(con)) chaCua.set(con, cap.person.personId);

  return cacCap.map((cap) => {
    const cha = chaCua.get(cap.person.personId);
    return {
      nguoi: theNguoi(cap.person),
      banDoi: cap.partners.map(theNguoi),
      // Chỉ nối khi cha có node thật trên cây (cha có thể đã gộp vào thẻ vợ/chồng của người khác).
      chaId: cha && coMat.has(cha) ? cha : null,
      moTa: cap.person.generation != null ? `đời ${cap.person.generation}` : undefined,
    };
  });
}

/** Đếm người trong một chi — người mang huyết thống + người đứng chung thẻ. */
export function demNguoiTrongChi(chi: BranchView): number {
  return chi.generations.reduce(
    (s, g) => s + g.couples.reduce((t, c) => t + 1 + c.partners.length, 0),
    0,
  );
}
