---
baseline_commit: 9789fd1
---

# Story 7.4: Sổ nhật ký — lời hứa "vẫn nằm trong nhật ký" có mặt tiền

Status: done

## Story

Là **người trong ban tu phả**,
tôi muốn **một sổ nhật ký của cả dòng họ: ai đã làm gì, lúc nào, với giá trị nào — kể cả những giá
trị đã bị loại, bị ẩn, tên nơi đã đổi — lọc được theo người, theo loại việc, theo hành động**,
để **câu "giá trị bị loại rời khỏi phả nhưng vẫn nằm trong nhật ký" mà ba màn đang nói có một chỗ
để mở ra đọc (FR-39: *ai sửa, khi nào, từ giá trị nào sang giá trị nào*)**.

## Bối cảnh

`revision` ghi mọi mutation cùng transaction (AD-10) từ Đợt 1; `core/audit` có `getPersonHistory`
(một người, trang `/nguoi/[id]` bày "Ai đã ghi gì"), `getTreeAt` (chưa màn), `getRecentAdditions`
(trang chủ). Không có sổ CHUNG; `entity='place'` chưa ai đọc (nợ 6-4); ba màn (phiếu, Mâu thuẫn,
Nơi chốn) hứa "vẫn nằm trong nhật ký" mà không trỏ đi đâu.

## Quyết định thiết kế — chốt 29/08/2026

1. **`listJournal` ở `core/audit`** — quyền duyệt (`gateApprover`); mới nhất trước; con trỏ
   `(createdAt, id)`; lọc `loai` (entity) · `hanh` (action) · `nguoi` (personId — dùng CHUNG phép
   gom hàng của `getPersonHistory`, không viết phép thứ hai). Mỗi hàng: lúc · ai · loại · câu tóm
   tắt (`summarize`, mở rộng cho `place`/`clan`/`attachment`/`source`/`union`/`recording`) · ghi
   chú (lý do loại/ẩn/từ chối) · người liên quan (tên + link mở trên cây).
2. **Màn `/admin/nhat-ky`** — nhóm *Sổ dòng họ*, không số. Bộ lọc là biểu mẫu GET (không ghi).
   Mỗi hàng một dòng, chữ 17px, ghi chú in nguyên văn. "Xem thêm" bằng con trỏ. Rỗng có câu.
3. **Ba màn đang hứa trỏ vào sổ**: phiếu (câu cảnh báo mâu thuẫn) không đổi chữ, màn Nơi chốn và
   Mâu thuẫn thêm liên kết "xem trong sổ nhật ký" đúng bộ lọc.
4. Không dựng "xem cây tại thời điểm" (nửa sau FR-39) — ghi ở `epics-dot-4 § Sau epic này`.

## Acceptance Criteria
1. `listJournal({ loai?, hanh?, nguoi?, truoc? })` — quyền duyệt; thành viên ⇒ `forbidden`; chưa gắn ⇒
   `unattached`. Trả tối đa 100 hàng + con trỏ trang sau. Test thật ở `core/audit/audit.test.ts`.
2. Hàng `place`: "thêm nơi …", "sửa nơi … → …", "gộp nơi … vào …", "tách lại nơi …" — đọc được tên
   trước/sau từ ảnh. Hàng `assertion` bị loại/ẩn có giá trị đọc lại được và ghi chú lý do.
3. Lọc `nguoi=<id>` trả ĐÚNG tập hàng của `getPersonHistory(id)` (cùng phép gom).
4. `/admin/nhat-ky`: mục trên thanh việc (nhóm Sổ dòng họ, icon `History`), bộ lọc GET, danh sách,
   "Xem thêm", câu rỗng; `soi nhat-ky` 0 vi phạm mới; `chrome.test` + `dang-ky.test` xanh.
5. Màn Nơi chốn: câu "Tên cũ nằm trong nhật ký" thành liên kết `/admin/nhat-ky?loai=place`; màn Mâu
   thuẫn: câu "vẫn nằm trong nhật ký" thành liên kết `/admin/nhat-ky?loai=assertion&hanh=remove`.
6. `deferred-work` ✅ nợ 6-4 (nhật ký nơi chốn). Năm cổng. Không nút ghi mới ⇒ không kịch bản.

## Phạm vi — KHÔNG thuộc story này
- Xem cây tại một thời điểm (`getTreeAt` có ops, chưa màn).
- Sổ nhật ký cho thành viên thường (AD-21: nhật ký giữ cả giá trị đã rút — chỉ người thấy trọn).

## Tasks / Subtasks
- [x] **T1** `core/audit`: `summarize` mở rộng · `revisionsVePerson` dùng chung · `listJournalOps` · surface (AC 1–3)
- [x] **T2** Test thật (AC 1–3)
- [x] **T3** Màn + mục thanh việc + icon + `dang-ky.ts` (AC 4)
- [x] **T4** Hai liên kết (AC 5) · deferred-work · cổng + soi (AC 6)

## Dev Notes
- `revision.createdAt` có index `(clan_id, created_at)`; con trỏ `createdAt < at OR (= at AND id < id)`.
- Tên người liên quan: gom id (assertion `subjectPersonId` trong ảnh · person `entityId` · merge
  `winnerId`) → một `inArray` trên `person` (RLS đã gác clan). Người đã gộp: tên vẫn đọc được (hàng
  person còn), link mở trên cây sẽ redirect (AD-3).

### References
- [`core/audit/ops.ts § summarize`, `§ getPersonHistory`] · [`app/admin/hang-cho/page.tsx` nếp danh sách]
- [`deferred-work.md § 6-4` nhật ký nơi chốn] · [PRD FR-39]

## Dev Agent Record

### Agent Model Used
Claude Fable 5 · 29/08/2026.

### Ghi chép lượt dựng
- `getPersonHistory` tách phép gom hàng thành `revisionsVePerson` + `anhDayDuTheoKhangDinh`; sổ chung
  lọc theo người gọi đúng hai hàm ấy — test so sánh hai danh sách tóm tắt bằng nhau.
- `summarize` thêm câu cho `place` (thêm/sửa/gộp/tách), `clan`, `attachment` (nói bằng ghi chú của
  chính nó), `source`, `union`, `recording`. Trước 7-4 các thực thể ấy rơi vào `"${action} ${entity}"`.
- Con trỏ `(createdAt, id)` đi xuống SQL khi không lọc theo người; lọc theo người thì cắt trong bộ
  nhớ (tập nhỏ). Test hai trang không chồng, không sót.
- Màn: biểu mẫu GET, không nút ghi; `cam-bam` không cần thêm nhãn. Lint bắt `<a href>` nội bộ ở
  `bang-noi.tsx` → `Link`.
- soi lượt đầu: **49 vi phạm mới** — mọi liên kết tên người trong câu cao 23px (và hai liên kết
  "sổ nhật ký" ở Nơi chốn / Mâu thuẫn). `inline-flex min-h-11 items-center`, đo lại: 3 màn, 0 vi phạm
  mới. Cổng thứ năm bắt đúng thứ bốn cổng kia không thấy — lần thứ ba trong Đợt 4.

### File List
- `core/audit/ops.ts` (`summarize` mở rộng · `revisionsVePerson` · `anhDayDuTheoKhangDinh` · `listJournalOps` · kiểu) · `core/audit/index.ts` (`listJournal`)
- `core/audit/audit.test.ts` (+4, seed hai hàng nơi chốn)
- `app/admin/nhat-ky/page.tsx` (mới) · `components/admin/man-admin.ts` · `components/admin/khung-admin.tsx` (icon `History`)
- `scripts/soi/dang-ky.ts` · `app/admin/noi-chon/bang-noi.tsx` · `app/admin/mau-thuan/page.tsx` (hai liên kết vào sổ)
- `deferred-work.md` (✅ 6-4 nhật ký nơi chốn)

## Code review — 29/08/2026 (ba lớp, `bmad-code-review`)

Blind Hunter 15 · Edge Case 8 · Acceptance Auditor 7 → 16 sau gộp trùng → **13 patch · 1 defer · 2 dismiss**.

Patch:
1. **Con trỏ mất micro-giây** — `toISOString()` cắt còn ms trong khi `created_at` có µs và `now()`
   ổn định trong transaction: người + nguồn + khẳng định ghi một lượt chung MỘT mốc, con trỏ ms đứng
   trước hàng nó đặt tên, cả nhóm rơi khỏi trang sau. Nay con trỏ là `created_at::text` của Postgres
   và so `(created_at, id) < (…::timestamptz, …::uuid)`. Test thật: ba hàng cùng transaction, trang 2
   dòng, không mất hàng.
2. **Ảnh đầy đủ theo TRANG** — hàng `promote`/`hide`/`restore` không mang kind, hàng `create` của nó
   ở trang khác ⇒ "duyệt … — thông tin", mất người. Nay tra bảng `assertion` rồi ảnh `create`/`remove`.
3. Con trỏ hỏng (id không uuid, mốc không đọc được) ⇒ `invalid`, cả hai đường; id về chữ thường.
4. Giờ Hà Nội (`Intl` + `Asia/Ho_Chi_Minh`) — máy đang chạy UTC−7, "khi nào" của FR-39 lệch ngày.
5. `merge`/`update` (từ chối đề xuất) không còn đọc thành "hợp nhất bản ghi trùng"; `create` là "đề
   xuất"; lượt gộp thật nói "hợp nhất X vào Y"; "tách lại nơi …" có tên nơi.
6. Cửa vào bộ lọc theo người: "chỉ người này" cạnh mỗi tên; `dangLoc` tính cả con trỏ; banner đúng
   người; `<form key>` để select dựng lại sau "Bỏ lọc".
7. Test: chưa gắn ⇒ `unattached`; lọc `hide` vẫn ra kind + người.

Defer: "xem cây tại thời điểm" (đã ở § Sau epic này). Dismiss: `LOAI[e.entity] ?? e.entity` (record
đã đủ); ảnh `place` trong test viết tay (cùng hình với `core/place/ops.ts`, đã đối chiếu).
