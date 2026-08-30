---
baseline_commit: c438c9c
---

# Story 6.5: Màn Mâu thuẫn

Status: review

## Story

Là **người trong ban tu phả**,
tôi muốn **một mục "Mâu thuẫn" trên thanh việc, mang số, liệt kê mọi chỗ trong phả đang có hai điều
không thể cùng đúng — và mở thẳng được người ấy trên cây để chọn**,
để **mâu thuẫn không nằm im trong phả cho tới lúc tình cờ có người mở đúng hồ sơ ấy**.

## Bối cảnh — 5-3 dựng phép phân loại, và cố ý KHÔNG dựng màn

Story 5-3 (AC 23) cân nhắc mục *Mâu thuẫn* rồi **không thêm**, với lý do đúng: *"Nó cần một phép đọc
quét cả dòng họ, không phải một panel. Story này dựng phép phân loại — thứ màn ấy sẽ dùng lại."*
Phép ấy là `xepChong` (`core/person/chong.ts`), và nó có một giới hạn tự khai: phân loại theo
`kind`, nên hai lớp mâu thuẫn THẬT lọt lưới —

1. hai khẳng định `parent-child` mà hai người cha cùng GIỚI và cùng `relation` (hai cha ruột);
2. hai khẳng định `place` cùng vai `que-quan` mà khác nơi.

Cả hai đều ghi ở `deferred-work.md` với câu *"sửa được bằng cách cho `xepChong` nhìn thêm một khoá
phụ rút từ `value` — đổi hình của phép dẫn xuất, đáng làm có chủ ý."* Đây là lượt làm có chủ ý ấy.

## Quyết định thiết kế — chốt 29/08/2026

1. **Một phép, hai chỗ dùng.** `xepChong` nhận thêm một KHOÁ PHỤ trên từng dòng (`nhomPhu`), do
   `read-ops` rút từ `value`: `place` → vai (`que-quan` · `tru-quan` · `an-tang`); `parent-child` →
   `giới của cha/mẹ | relation`. Chồng `place` với ≥ 2 dòng cùng khoá phụ `que-quan` (khác nơi) là
   mâu thuẫn; `parent-child` với ≥ 2 dòng cùng `male|blood` là mâu thuẫn. Panel cột phải (5-3) và
   màn Mâu thuẫn dùng CÙNG `xepChong` — *"hai nơi suy hai kiểu là hỏng"* (5-3).
2. **Chồng hỗn hợp tách làm hai:** `parent-child` của một người có thể vừa là cha + mẹ (nối tiếp)
   vừa là hai cha (mâu thuẫn). Kết quả: một chồng `parent-child` với `stackKind: 'mau-thuan'` và
   `dongMauThuan` nêu rõ những dòng đụng nhau; các dòng khác vẫn bày, không mất. Panel bày cảnh
   báo đúng vào cụm ấy.
3. **Phép quét cả dòng họ** ở `core/person`: `listConflicts()` — quyền duyệt (`gateApprover`, như
   hàng chờ); đọc MỌI khẳng định sống của dòng họ theo người, chạy `xepChong` từng người, giữ
   chồng mâu thuẫn. Người đã gộp (bia mộ) bỏ qua. Trả `{ personId, personName, chong: AssertionStack[] }[]`,
   xếp theo tên. Không cache (AD-23).
4. **Màn `/admin/mau-thuan`**: mỗi người một khối — tên (link mở `/admin/cay?neo=`), từng chồng
   mâu thuẫn với các dòng (giá trị · tầng · nguồn · ai ghi · lúc), câu *"chọn ở màn cây"*. Không nút
   duyệt/loại tại đây: chọn là việc trên phiếu (5-3) nơi đủ ngữ cảnh — màn này là HỘP THƯ, không
   phải bàn. Mục thanh việc: nhóm `doi-chieu`, **có số**, icon `TriangleAlert` — đúng như 5-3 hẹn.
5. **Số trên thanh việc** = số NGƯỜI có mâu thuẫn (đơn vị chú ý là người — 6-8), không phải số dòng.

## Acceptance Criteria

### Core
1. `PersonAssertion` mang `nhomPhu?: string`: `place` → `role`; `parent-child` → `${giới cha mẹ}|${relation}`
   (giới `?` khi chưa rõ). Loại khác vắng.
2. `xepChong`: `place` ≥ 2 dòng `que-quan` ⇒ chồng `mau-thuan`, `dongMauThuan = [id…]` là các dòng
   đụng nhau; `parent-child` ≥ 2 dòng cùng `nhomPhu` ⇒ tương tự. Hai `que-quan` cùng MỘT nơi (sau
   `giaiNoi`) KHÔNG phải mâu thuẫn — bỏ trùng theo `placeId` đã giải. Cha + mẹ ⇒ vẫn `noi-tiep`.
3. `AssertionStack.dongMauThuan?: string[]` — chỉ có khi chồng đa trị hoá mâu thuẫn; chồng đơn trị
   mâu thuẫn thì mọi dòng đụng nhau (vắng trường này, panel hiểu là "tất cả").
4. `listConflicts()` — `gateApprover`; quét cả dòng họ; bỏ bia mộ; mỗi mục có `personId`,
   `personName`, `chong` (chỉ chồng mâu thuẫn). Test thật: hai năm sinh · hai cha ruột · hai quê
   quán khác nơi ⇒ 3 người; cha + mẹ ⇒ không; hai `que-quan` cùng nơi ⇒ không; thành viên ⇒ `forbidden`.
5. `chong.test.ts` thêm ca cho hai lớp mới (thuần).

### Màn
6. `MAN` thêm `mau-thuan` (nhóm `doi-chieu`, `coSo: true`); layout đếm; `chrome.test.ts` xanh không sửa.
7. `/admin/mau-thuan`: mỗi người một khối, tên là link `/admin/cay?neo=<id>`; mỗi chồng: nhãn,
   cảnh báo chàm (không son), các dòng với giá trị (chip nét đứt/vân theo mức tin cậy), tầng, nguồn.
8. Rỗng: *"Không có mâu thuẫn nào — mọi chồng khẳng định đều nhất quán."*
9. Panel cột phải (`cot-khang-dinh.tsx`): chồng `parent-child`/`place` mâu thuẫn bày cảnh báo với
   câu đúng loại (*"hai người cha ruột"* / *"hai quê quán khác nhau"*), nút Loại mọc trên các dòng
   đụng nhau (bề mặt B).
10. Bản đăng ký bộ đo có `mau-thuan`; sàn giữ.

### Cổng
11. Bốn cổng; `npm run soi -- mau-thuan` trên dòng họ thử (dựng sẵn một mâu thuẫn mỗi lớp).

## Phạm vi — KHÔNG thuộc story này
- Thám tử phả hệ (năm sinh con ≤ cha + 15, mất trước sinh, vòng lặp) — FR khác, Đợt sau.
- Tự động chọn — bot gợi ý, không tự gộp.

## Tasks / Subtasks
- [x] **T1** `nhomPhu` ở `read-ops.ts` + kiểu `PersonAssertion` (AC 1)
- [x] **T2** `xepChong` khoá phụ + `dongMauThuan` + test thuần (AC 2, 3, 5)
- [x] **T3** `listConflicts` ops + surface + test thật (AC 4)
- [x] **T4** `man-admin.ts` · layout đếm · `/admin/mau-thuan/page.tsx` (AC 6–8)
- [x] **T5** Panel cột phải: cảnh báo đúng loại, Loại trên dòng đụng nhau (AC 9)
- [x] **T6** Bộ đo: `dang-ky.ts` + dòng họ thử dựng ba mâu thuẫn (AC 10–11)
- [x] **T7** Bốn cổng · soi · gỡ hai mục nợ ở `deferred-work.md`

## Dev Notes
- `xepChong` là THUẦN — giữ thuần: khoá phụ tính ở `read-ops` (có `value`, có `person.gender` của
  cha qua `data.persons`), không tra DB trong `chong.ts`.
- Giới của CHA/MẸ: `data.persons.get(objectPersonId).gender` (cột chiếu, AD-19) — `null` ⇒ `'?'`,
  và `'?'` KHÔNG đụng với `'?'`: hai cha chưa rõ giới có thể là cha + mẹ chưa khai giới. Mặc định
  nghiêng về KHÔNG báo nhầm mâu thuẫn.
- `listConflictsOps` đọc giống `getPersonOps` nhưng cho cả họ: một `select` toàn bộ khẳng định
  sống + `loadTreeData` (đã có `persons`, `redirect`). Dựng `valueText` bằng chính hàm của
  `read-ops` — tách hàm dựng dòng ra để dùng chung, đừng chép.
- Màn: nếp `hang-cho/page.tsx` (khối theo người) + `cot-khang-dinh.tsx § MotChong` (cảnh báo chàm).
- `cam-bam.ts`: màn không có nút ghi.

### References
- [Source: `5-3-panel-khang-dinh.md` AC 23, § Phạm vi] · [`deferred-work.md § 5-7`, `§ 6-1 nợ`]
- [Source: `core/person/chong.ts`, `core/person/read-ops.ts`, `components/admin/man-admin.ts`]

## Dev Agent Record

### Agent Model Used
Claude Opus 5 · 29/08/2026.

### Ghi chép lượt dựng
- Khoá phụ tính ở `read-ops` (`dungDongKhangDinh`), `xepChong` vẫn thuần: `dongDungNhau` gom
  `parent-child` theo `nhomPhu` (bỏ `?|…`), gom `place` theo `que-quan` với >1 `noiId` khác nhau.
  Chồng đa trị hoá mâu thuẫn GIỮ thứ tự dòng chảy (cũ nhất trước) — nó vẫn là cha + mẹ + …
- `listConflictsOps` dùng CÙNG `dungDongKhangDinh` với phiếu (một chỗ suy, hai chỗ bày); lọc trước
  bằng `xepChong` ngay trong ops nên surface chỉ chạm tên người có mâu thuẫn.
- Panel: `dongMauThuan` khoanh cụm — Loại/Nâng/đang giữ chỉ trên dòng đụng nhau; mẹ đứng cạnh hai
  cha không mọc nút Loại. `coChinhThuc` đếm TRONG cụm.
- Trang `/admin/mau-thuan`: mức tin cậy nói bằng VỎ (không lặp chữ "tồn nghi · tồn nghi"), giá
  trị qua `gonGiaTri` như phiếu.
- Dòng họ thử dựng ba mâu thuẫn (Chú hai năm sinh · "Hai Cha" con của Cha và Chú · Em hai quê quán
  ở hai Quang Trung); không đụng Mình/Mồ Côi vì adapter test 6-1 dựng trên hai người ấy.
- Cổng: lint · tsc · vitest 540/540 · build ✓; `npm run soi -- mau-thuan cay` 0 vi phạm mới,
  revision đứng yên; chụp phiếu "Hai Cha" trên cây — cảnh báo đúng loại.

### File List
- `core/tree/ops.ts` — `PersonRow.gender`
- `core/person/index.ts` — `PersonAssertion.nhomPhu/noiId`, `NguoiCoMauThuan`, `listConflicts`
- `core/person/chong.ts` — `dongDungNhau`, `AssertionStack.dongMauThuan`
- `core/person/read-ops.ts` — `docKhangDinhSong`, `nguCanhDungDong`, `dungDongKhangDinh`, `listConflictsOps`
- `core/person/chong.test.ts` (+6) · `core/person/mau-thuan.test.ts` (mới, DB thật)
- `components/admin/man-admin.ts` · `components/admin/khung-admin.tsx` — mục `mau-thuan`
- `components/admin/cot-khang-dinh.tsx` — `dongMauThuan`, câu theo loại, nút theo cụm
- `app/admin/layout.tsx` — đếm số người · `app/admin/mau-thuan/page.tsx` (mới)
- `app/admin/cay/cay-client.tsx` · `app/(pha)/gia-pha/_quanh-minh/quanh-minh-client.tsx` — truyền `dongMauThuan`
- `scripts/soi/dang-ky.ts` — màn `mau-thuan` · `core/gates/dong-ho-thu.ts` — ba mâu thuẫn
- `_bmad-output/implementation-artifacts/deferred-work.md` — đóng § 5-3 (hai cha) và § 5-7 (quê quán)
