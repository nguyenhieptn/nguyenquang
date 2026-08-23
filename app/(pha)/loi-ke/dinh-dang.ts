/**
 * Định dạng thời lượng và ngày cho màn lời kể — bề mặt A nói bằng chữ,
 * không bằng ký hiệu kỹ thuật. Hàm thuần, dùng được cả server lẫn client.
 */

/** "6 phút 12 giây" — chữ đầy đủ cho danh sách và câu tóm tắt. */
export function doDai(giay: number): string {
  const phut = Math.floor(giay / 60);
  const du = giay % 60;
  if (phut === 0) return `${du} giây`;
  return du ? `${phut} phút ${du} giây` : `${phut} phút`;
}

/** "6:12" — đồng hồ đang chạy trên màn thu. */
export function mmss(giay: number): string {
  const phut = Math.floor(giay / 60);
  const du = giay % 60;
  return `${phut}:${String(du).padStart(2, '0')}`;
}

/** "2026-08-12" → "12/08/2026". Ngày không đọc được thì trả nguyên văn. */
export function ngayVN(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/** Hôm nay theo giờ máy người thu, dạng ISO YYYY-MM-DD — mặc định của ô "thu ngày". */
export function homNayISO(): string {
  const d = new Date();
  const thang = String(d.getMonth() + 1).padStart(2, '0');
  const ngay = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${thang}-${ngay}`;
}
