/**
 * THANG BỀ NGANG — ba bậc, không hơn.
 *
 * Trước khi có file này, 18 màn dùng **sáu** mốc khác nhau (`lg` `xl` `2xl` `3xl` `5xl` `6xl`).
 * Sáu mốc thì không mốc nào có lý do — chúng chỉ là chỗ từng người dựng màn dừng tay. Ba bậc thì
 * mỗi bậc nói thành lời được, và màn mới chỉ việc chọn một trong ba.
 *
 * Luật gọn một câu: **tràn viền cho thứ để QUÉT và để THAO TÁC; bó lại cho thứ để ĐỌC.**
 *
 * Số học đằng sau `DOC`: chữ thân 17px, tiếng Việt trung bình ~8,5px một ký tự, tầm đọc thoải mái
 * 60–75 ký tự một dòng → 510–640px. Ở 1024px một cột chữ là ~120 ký tự/dòng, gấp rưỡi ngưỡng
 * trên. `EXPERIENCE.md § Responsive` chốt cùng kết luận bằng lời:
 *
 *   > *Dòng chữ quá dài vi phạm tinh thần của § Accessibility Floor dù không vi phạm con số nào.*
 *
 * Và người đo chuẩn của `DESIGN.md` là bà bác ~70 tuổi ở quê — dòng dài hại đúng người ấy nhất.
 *
 * Vỏ trang (vạch măng-sét, vạch chân trang, nền) LUÔN tràn viền kể cả khi nội dung bó lại: nội
 * dung co, đường kẻ thì không. Đó là cái làm trang đọc ra *trang sách* thay vì *hộp nội dung*.
 */

/** Một cột chữ — 672px. Tự khai, tìm, trang người, đăng nhập, đường huyết thống dọc. */
export const DOC = 'mx-auto w-full max-w-2xl px-5 md:px-8';

/** Bố cục nhiều cột — 1024px. Trang chủ, màn chủ cũ. Đọc được ở mức này **nhờ có cột**. */
export const KHUNG = 'mx-auto w-full max-w-5xl px-5 md:px-8';

/** Tràn viền, chỉ chừa lề. Canvas cây, bảng bàn duyệt, bảng token. */
export const RONG = 'w-full px-5 md:px-8';
