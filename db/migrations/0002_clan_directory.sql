-- Danh bạ dòng họ đọc được KHÔNG cần clan context — bỏ GIAPHA_CLAN_ID (25/08/2026).
--
-- ── Vì sao đổi ─────────────────────────────────────────────────────────────────────────────
-- Policy cũ `clan_isolation` cho vai ứng dụng thấy đúng dòng họ ĐANG là context. Hệ quả là câu
-- "triển khai này phục vụ dòng họ nào?" không trả lời được từ database — muốn đọc bảng `clan`
-- thì đã phải biết id rồi. Lời giải cũ là cấu hình-như-dữ-liệu: `GIAPHA_CLAN_ID` trong `.env`.
--
-- Cái giá của lời giải ấy là một sự thật bị chép ra hai nơi: id nằm trong DB, và một bản sao
-- nằm trong `.env` phải tự tay giữ cho khớp. Mỗi lần dựng lại là một lần lệch; và một truy vấn
-- quên context thì đọc ra 0 dòng, trông y hệt "database rỗng".
--
-- ── Đổi cái gì, và KHÔNG đổi cái gì ─────────────────────────────────────────────────────────
-- ĐỔI: `SELECT` trên `clan` mở. Bảng này chứa `id`, `name`, `settings` (họ · chữ đệm · đề từ),
--      `created_at` — dữ liệu về DÒNG HỌ, không phải về NGƯỜI. Nó là danh bạ người thuê, thứ mà
--      bất cứ màn chọn dòng họ nào rồi cũng cần đọc.
-- KHÔNG ĐỔI: mọi lối GHI vẫn buộc `id = current_clan_id()`, và toàn bộ mười bảng phân vùng
--      (`person`, `assertion`, `attachment`, …) giữ nguyên `USING (clan_id = current_clan_id())`
--      fail-closed. Cách ly dữ liệu gia phả — phần AD-7 thật sự bảo vệ — không suy suyển.
--
-- CẢNH BÁO: đây là sửa CÓ CHỦ Ý hai câu khẳng định của release gate
--    (`core/gates/rls.gate.test.ts`), những câu AD-20 dựng lên để chặn "policy có mà không làm
--    gì". Gate đã cập nhật cùng lượt này và nay khẳng định điều mạnh hơn: danh bạ đọc được,
--    nhưng ghi vẫn bị chặn đúng như cũ.
DROP POLICY IF EXISTS clan_isolation ON "clan";
--> statement-breakpoint

CREATE POLICY clan_directory ON "clan" FOR SELECT USING (true);
--> statement-breakpoint
CREATE POLICY clan_insert ON "clan" FOR INSERT WITH CHECK (id = current_clan_id());
--> statement-breakpoint
CREATE POLICY clan_update ON "clan" FOR UPDATE USING (id = current_clan_id()) WITH CHECK (id = current_clan_id());
--> statement-breakpoint
CREATE POLICY clan_delete ON "clan" FOR DELETE USING (id = current_clan_id());
