-- FR-65 — Nơi chốn là dữ liệu, không phải chữ (story 5-7, 25/08/2026).
--
-- Dòng họ không ở một chỗ: có nhánh ở Quang Trung / Định Hoá (Thái Nguyên), có nhánh ở
-- Quang Trung / Vũng Tàu. Hai tên giống hệt nhau, hai nơi khác hẳn nhau. Tên xã phường ở Việt Nam
-- trùng nhau hàng loạt, nên nơi để dưới dạng chữ tự do là không tra được, không gom nhóm được, và
-- hai lần gõ cùng một cái tên thành hai nơi khác nhau.
--
-- `parent_unit` KHÔNG phải trang trí — nó là thứ DUY NHẤT phân biệt hai "Quang Trung", nên nó nằm
-- ngay trên bảng chứ không nhét vào một cột ghi chú.
--
-- Cột đã gấp dấu (`*_folded`) là AD-16: mọi so khớp tên đi qua `unaccent` + hạ chữ hoa, còn tên
-- gốc thì giữ nguyên dấu. Một `LIKE` trần trên cột có dấu là một defect.
--
-- `merged_into` để dành cho việc GỘP (FR-65 đòi, story 5-7 chưa làm — xem deferred-work.md). Dựng
-- sẵn cột vì thêm cột vào một bảng đã có dữ liệu đắt hơn nhiều so với để nó trống từ đầu.
CREATE TABLE "place" (
  "id" uuid PRIMARY KEY NOT NULL,
  "clan_id" uuid NOT NULL REFERENCES "clan"("id"),
  "name" text NOT NULL,
  "name_folded" text NOT NULL,
  "parent_unit" text NOT NULL DEFAULT '',
  "parent_unit_folded" text NOT NULL DEFAULT '',
  "merged_into" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE INDEX "place_folded_idx" ON "place" ("clan_id", "name_folded");
--> statement-breakpoint

-- Khẳng định loại `place` trỏ vào một nơi — cùng lối `object_person_id` (cha-con) và `union_id`
-- (vợ chồng) đã có. Nơi vào phả bằng khẳng định như mọi dữ liệu khác: có nguồn (FR-1), có mức tin
-- cậy (FR-2), vào Tầng tồn nghi trước (FR-3), ghi nhật ký (AD-10). Không có ngoại lệ nào cho nơi.
ALTER TABLE "assertion" ADD COLUMN "place_id" uuid REFERENCES "place"("id");
--> statement-breakpoint

-- ── RLS: y hệt mười bảng phân vùng kia, không có ngoại lệ ──────────────────────────────────
-- AD-20: cả BỐN chi tiết (ENABLE, FORCE, vai không sở hữu bảng, policy fail-closed) đều hỏng IM
-- LẶNG một mình. `place` cũng đã được khai trong PARTITIONED_TABLES nên gate schema tự canh.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "place" TO giapha_app;
--> statement-breakpoint
ALTER TABLE "place" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "place" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY place_isolation ON "place"
  USING (clan_id = current_clan_id())
  WITH CHECK (clan_id = current_clan_id());
