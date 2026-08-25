-- FR-65: chặn danh mục nơi tự sinh sôi từ lỗi gõ (story 5-7, vá 25/08 sau code review).
--
-- `addPlaceOps` đọc cả bảng, so `trungKhit` trong bộ nhớ, rồi mới `INSERT`. Dưới READ COMMITTED,
-- hai người tạo cùng lúc thì không ai thấy hàng chưa commit của người kia — cả hai đều lọt, và
-- cả hai đều nhận `ok`. Phép so trong bộ nhớ KHÔNG phải một ràng buộc; đây mới là.
--
-- So sánh: `attachment_account_clan_uq` (0000_init) là một `uniqueIndex` thật. Bảng `place` ra
-- đời với một `CREATE INDEX` thường, và chú thích của `addPlaceOps` lại gọi phép so ấy là "thứ
-- duy nhất giữ cho danh mục không tự sinh sôi". Nay lời ấy mới đúng.
CREATE UNIQUE INDEX "place_folded_uq"
  ON "place" ("clan_id", "name_folded", "parent_unit_folded");
