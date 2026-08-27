/**
 * DÒNG DẪN XUẤT dưới tên — story 6-7. Module THUẦN.
 *
 * ── Chỉ còn ĐỜI và CHI, và đó là kết luận của ba lượt phản hồi ───────────────────────────
 * Bản đầu bày cả `lifespan` (năm sinh–năm mất). Nhưng chồng *Sinh* ngay bên dưới nói đúng chuyện
 * ấy, nên phiếu in một thứ hai lần trong hai kiểu chữ — *"các thông tin này đều đã có ở trên"*.
 *
 * Lượt sửa khi đó ghi đè `lifespan: ''` ngay tại nơi gọi mà KHÔNG gỡ đường ống, nên cả chuỗi sáu
 * tầng vẫn còn và bốn bài test chỉ soi mã chết — code review 26/08 bắt được. Nay gỡ hẳn: đời và
 * chi tính lúc đọc (AD-5), **không chồng nào nói hộ**, và đó chính là lý do chúng đáng một dòng
 * riêng. Mọi thứ khác đã có hàng của nó trong phiếu.
 *
 * Không mục nào ở đây bấm được: không có hàng nào để sửa. Trường `khoaChong` của bản trước —
 * được tính, có test riêng, không nơi nào đọc — đã gỡ cùng lượt này.
 */

export type TheTieuSu = {
  card: {
    doi: number | null;
    chi: string | null;
  };
};

/**
 * Dòng dẫn xuất: **đời · chi**. Mục rỗng thì BỎ HẲN, không in "chưa rõ" — một dòng toàn "chưa rõ"
 * là một dòng không ai đọc, và nó chiếm đúng chỗ chồng khẳng định cần trong một cột 360px.
 */
export function dongTieuSu(t: TheTieuSu): string[] {
  const ra: string[] = [];
  if (t.card.doi !== null) ra.push(`đời ${t.card.doi}`);
  if (t.card.chi) ra.push(`chi ${t.card.chi}`);
  return ra;
}
