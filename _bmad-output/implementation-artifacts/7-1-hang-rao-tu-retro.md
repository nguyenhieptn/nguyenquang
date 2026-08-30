---
baseline_commit: e3874b6
---

# Story 7.1: Hàng rào từ retro — cổng chỉ có hai tên, và kịch bản ghi có mắt

Status: done

## Story

Là **người dựng và người review của các story sau**,
tôi muốn **hai bài học nặng nhất của retro Epic 6 thành thứ máy đọc được — một luật lint cấm chép
lại cổng trong `core/`, và một lớp kiểm bấm nút ghi THẬT trên dòng họ thử rồi đọc lại màn**,
để **lỗi "chép cổng sai thứ tự" và "chú thích nói chặn mà không chặn" không lọt được năm cổng xanh
lần nữa**.

## Bối cảnh — hai lỗi lọt năm cổng, cùng một ngày

29/08: `gateWriter` được sửa thứ tự `unauthenticated`/`unattached` buổi sáng; buổi chiều
`listConflictsOps` **tự viết ba dòng kiểm** và lặp đúng lỗi ấy — bài test xanh vì dựng ngữ cảnh
`{…admin, personId: null}` mà phiên thật không sinh ra được. Cùng ngày, `mergePlaceOps` mang chú
thích *"đây là hàng rào chống chuỗi A→B→C"* trong khi chỉ chặn một chiều. `tsc` · `eslint` · 549
test · `build` · `soi` đều xanh với cả hai. Retro kết: **bằng chứng phải sinh từ cùng nguồn với sản
phẩm** (`epic-6-retro-2026-08-29.md § Nếp rút ra`, B2 và B4).

Rà lại `core/` cho thấy lỗi thứ nhất không phải một lần: `core/merge/ops.ts:100-116` có
`requireAttached`/`requireApprover` **chép nguyên cổng**, với đúng thứ tự sai (`role === 'guest'`
trước `personId === null`); `core/audit/ops.ts:350` gác `getTreeAt` bằng so `role` tay;
`core/place/index.ts` gác `unattached` ở tầng surface. Ba chỗ, ba cách viết một cổng.

## Quyết định thiết kế — chốt 29/08/2026

1. **Cổng có đúng hai tên.** `gateWriter` / `gateApprover` (`core/assertion/ops.ts`) là nơi DUY NHẤT
   được so `'guest'` và sinh `err('unattached' | 'unauthenticated')` bên trong `core/**/ops.ts`,
   `read-ops.ts`. Luật lint `no-restricted-syntax` gác cả hai dấu hiệu; `core/identity/{session,auth,
   privacy}.ts` và chính `core/assertion/ops.ts` được miễn (chúng ĐỊNH NGHĨA vai và cổng). Surface
   (`index.ts`) vẫn được trả `unauthenticated` khi không có phiên — đó không phải cổng, là "không có
   ai để hỏi".
2. **Lens ≠ gate.** `privileged = role === 'admin' || 'branch-head'` ở audit/media/merge/privacy là
   phép NHÌN (ai thấy gì), không phải phép CHẶN. Gom về một tên `coQuyenDuyet(ctx)` ở
   `core/identity/session.ts` — không vì lint, mà vì ba chỗ chép cùng một dòng là ba chỗ lệch nhau ở
   lượt đổi vai sau này.
3. **Kịch bản ghi có mắt** — `npm run bam-thu`: Playwright đăng nhập, bấm nút ghi THẬT, đọc lại màn,
   đếm `revision` trước/sau trong đúng clan. Ba hàng rào để nó không bao giờ chạy trên phả thật:
   (a) bắt buộc `GIAPHA_CLAN_ID` và tên clan ấy trong DB phải bắt đầu bằng `Dòng họ thử`;
   (b) `SOI_TEN` phải là tài khoản thử (`thu.quan.tri.*` / `thu.thanh.vien.*`);
   (c) sau đăng nhập, thanh trên phải mang họ thử (`Nguyễn Thử`). Hụt một rào là dừng, không chạy.
   `cam-bam.test.ts` KHÔNG áp cho script này — nó là script duy nhất được bấm nút ghi, và tên file
   nói rõ điều đó.
4. **Ba kịch bản**, mỗi kịch bản là một đường ghi có màn xác nhận mà `soi` không phủ và adapter test
   không thấy: K1 ghi thêm năm sinh từ phiếu (bề mặt B) → chồng hoá mâu thuẫn hiện đúng câu; K2 gộp
   rồi tách nơi → câu xác nhận lên BẢNG (đúng lỗi review 6-4 vá); K3 thành viên thêm người quanh
   mình (bề mặt A) → thẻ mới hiện trên canvas. Mỗi kịch bản khai `revisionMongDoi` và so bằng.
5. **Không chạy trong `build`** — cùng lý do `soi` (cần server + DB + mật khẩu). Là cổng thứ sáu, chạy
   ở story nào có nút ghi mới, ghi kết quả vào story.

## Acceptance Criteria

### Lint
1. `npm run lint` ĐỎ khi một file `core/**/ops.ts` hoặc `read-ops.ts` (trừ `core/assertion/ops.ts`)
   so `.role` với `'guest'` hoặc gọi `err('unattached' | 'unauthenticated', …)`. Thông báo lỗi nêu
   tên hai cổng và lý do (vụ 29/08).
2. Toàn bộ `core/` xanh sau khi: `core/merge/ops.ts` dùng `gateWriter`/`gateApprover`;
   `core/audit/ops.ts § getTreeAt` dùng `gateApprover`; `core/place/index.ts` không tự gác
   `unattached` (đưa xuống ops qua cổng, hoặc bỏ gác nếu đọc danh mục không cần gắn — quyết: dùng
   `gateWriter` trong ops vì danh mục là dữ liệu trong họ, không công khai — FR-65).
3. `coQuyenDuyet(ctx)` ở `core/identity/privacy.ts` (cạnh `visibilityFor` — nó là lens); bốn chỗ
   `privileged` trong core và `lib/vai-quan-tri.ts § coBanLamViec` dùng nó; kiểm bằng `privacy.test`
   hiện có (mọi ca `admin`/`branch-head` ⇒ 'full' đi qua nó) — sửa sau code review.
4. Test cho luật lint: một file mẫu vi phạm (trong `var/` hoặc chuỗi) chạy qua ESLint API ⇒ đúng hai
   lỗi; file dùng cổng ⇒ 0 lỗi (`eslint.config.test.ts`, nếp `chrome.test.ts` đọc cấu hình thật).

### Kịch bản ghi
5. `npm run bam-thu` từ chối chạy (exit ≠ 0, nói rõ rào nào) khi thiếu `GIAPHA_CLAN_ID`, khi clan ấy
   không phải dòng họ thử, khi `SOI_TEN` không phải tài khoản thử, hoặc khi thanh trên không mang
   họ thử. Ba rào có test thuần (hàm `kiemRao`).
6. K1: đăng nhập quản trị, mở `/admin/cay`, chọn thẻ đầu, bấm giá trị *Sinh*, ghi năm mới ⇒ cột phải
   hiện năm ấy VÀ câu mâu thuẫn; `revision` tăng đúng **2** (đo 29/08: một khẳng định + một nguồn —
   AD-10, nguồn là thực thể có dấu vết; spec ban đầu đoán 1).
7. K2: `/admin/noi-chon`, gộp "Quang Trung, Vũng Tàu" vào "Quang Trung, Định Hoá…" ⇒ câu *"Đã gộp …
   1 khẳng định"* hiện ở BẢNG (không trong hàng); tách lại ⇒ *"Đã tách lại"*; `revision` +2.
8. K3: đăng nhập thành viên, `/gia-pha`, chọn thẻ đầu, *Thêm người quanh đây*, ghi một người ⇒ thẻ
   mang tên ấy xuất hiện trên canvas; `revision` **+4** (đo 29/08: người + nguồn + tên + cha-con;
   spec ban đầu đoán 1).
9. Bản kê cuối: mỗi kịch bản một dòng ✓/✗ với câu màn đã nói, tổng revision trước → sau, exit 1 nếu
   có ✗. Ảnh chụp mỗi kịch bản vào `var/bam-thu/`.
10. `docs/van-hanh.md § Bộ đo` thêm mục *Kịch bản ghi* (khi nào chạy, ba rào, cách đọc bản kê).

### Cổng
11. Năm cổng xanh; `npm run bam-thu` xanh trên dòng họ thử (kết quả chép vào story); `deferred-work`
    không có mục mới từ story này ngoài những gì review sinh ra.

## Phạm vi — KHÔNG thuộc story này
- Không đổi hành vi cổng (thứ tự, mã lỗi) — chỉ gom về một chỗ.
- Không viết kịch bản cho mọi nút ghi; ba kịch bản là ba LỚP (phiếu B · bảng nơi · bề mặt A). Story
  sau có nút ghi mới thì thêm kịch bản của nó.
- `core/identity/ops.ts` so `role` cho việc QUẢN LÝ vai (trao/hạ: *ai được trao vai gì*) — là nghiệp
  vụ, giữ nguyên. Riêng bốn cổng DUYỆT chép tay trong tệp ấy (xem danh sách chờ, duyệt, từ chối,
  xem tài khoản) thì code review bắt và nay qua `gateApprover` (giữ câu tiếng Việt ở `forbidden`).

## Tasks / Subtasks
- [x] **T1** Luật lint + test cấu hình (AC 1, 4)
- [x] **T2** `coQuyenDuyet` + gom cổng ở merge/audit/place (AC 2, 3) — vitest core xanh
- [x] **T3** `scripts/bam-thu.ts` + `scripts/bam-thu/{rao,kich-ban}.ts` + test rào (AC 5, 9)
- [x] **T4** Ba kịch bản K1–K3 chạy thật trên dòng họ thử, chép kết quả (AC 6–8)
- [x] **T5** `docs/van-hanh.md`, `package.json` script, story File List; năm cổng (AC 10, 11)

## Dev Notes
- Selector Playwright dùng lại của `dang-ky.ts`: thẻ `.react-flow__node`, cột phải `aside`, nút giá
  trị *Sinh* là `aside button[aria-label^="Ghi thêm năm sinh"]` (chup.mjs 29/08 đã dùng), nút gửi
  biểu mẫu *"Ghi vào phả"*, nút gộp `/^Gộp — /`, *"Tách lại"*.
- Đếm revision: `scripts/soi/dem-revision.ts` đếm CẢ các clan; kịch bản ghi cần đếm MỘT clan
  (`GIAPHA_CLAN_ID`) — tách `demRevisionCua(clanId)` và cho `demRevision` gọi lại.
- ESLint flat config: `no-restricted-syntax` với selector
  `BinaryExpression > Literal[value='guest']` và
  `CallExpression[callee.name='err'] > Literal:first-child[value=/^(unattached|unauthenticated)$/]`.
  Test qua `new ESLint({ overrideConfigFile: 'eslint.config.mjs' }).lintText(code, { filePath })`.

### References
- [`epic-6-retro-2026-08-29.md § Ba lần "cửa khác"`, `§ Việc chốt B2/B4`]
- [`core/assertion/ops.ts:51-78` gateWriter/gateApprover · `core/merge/ops.ts:100-116` ·
  `core/audit/ops.ts:349-352` · `core/place/index.ts:46-50,107-111`]
- [`scripts/soi.ts`, `scripts/soi/{trinh-duyet,moi-truong,dem-revision}.ts`, `scripts/soi/cam-bam.test.ts`]

## Dev Agent Record

### Agent Model Used
Claude Fable 5 · 29/08/2026.

### Ghi chép lượt dựng
- Cổng chuyển sang `core/identity/gates.ts`; `core/assertion/ops.ts` re-export. Luật lint bắt ngay
  **bốn** chỗ chép cổng mà story chưa biết: `core/identity/ops.ts` ×3 (`if (!ctx.personId) return
  err('unattached'…)`) và `core/media/ops.ts § validateSaveInput` — cộng hai chỗ đã biết (merge, audit)
  và surface `core/place/index.ts`. Đúng lớp lỗi retro mô tả, nhiều hơn retro đếm.
- Sáu ngữ cảnh test "gõ tay" là trạng thái phiên thật không sinh ra (`role: 'admin'` + `personId:
  null`, hay `role: 'member'` chưa gắn): sửa về hình thật (`guest` khi chưa gắn; quản trị luôn có
  chỗ). `getTreeAt` với khách nay trả `unauthenticated` (qua `gateApprover`) thay vì `forbidden` —
  đúng hơn cho adapter (dẫn về cửa đăng nhập).
- `bam-thu` lượt chạy đầu (dòng họ thử K71 trên :3300, không đụng :3200 chủ dự án đang dùng):
  K1 hỏng vì biểu mẫu ghi thêm không phải `<form>` (neo lại vào ô giá trị); K2 hỏng vì hàng
  "Định Hoá" cũng mang chữ "Vũng Tàu" (dấu trùng tên) — neo vào đơn vị cha của chính hàng; K3 đo
  ra +4 (người + nguồn + tên + cha-con), không +3 như đoán. Lượt hai: **3/3 ✓, revision 77 → 85**.
- Hai kiểm âm: `GIAPHA_CLAN_ID` = phả thật ⇒ *"✗ rào clan: clan "Dòng họ Nguyễn Quang" KHÔNG phải
  dòng họ thử"*; trỏ vào `:3000` với clan thử ⇒ *"✗ rào thanh-tren"*. Cả hai dừng trước cú bấm đầu.
- `soi` không chạy ở story này: không màn nào đổi (cổng thứ năm gác MÀN; story này không có màn).
- Kết quả bốn cổng còn lại lúc đóng: `lint` ✓ · `tsc` ✓ · `vitest` 556/556 ✓ · `build` ✓.

### File List
- `core/identity/gates.ts` (mới) · `core/identity/privacy.ts` (`coQuyenDuyet`) · `core/assertion/ops.ts` (re-export)
- `core/merge/ops.ts` · `core/audit/ops.ts` · `core/media/ops.ts` · `core/identity/ops.ts` · `core/place/index.ts` — qua cổng / lens
- `eslint.config.mjs` — luật "cổng chỉ có hai tên" · `core/gates/lint-cong.test.ts` (mới)
- `core/audit/audit.test.ts` · `core/merge/merge.test.ts` · `core/place/place.test.ts` · `core/person/person.test.ts` · `core/identity/identity.test.ts` · `core/tree/tree.test.ts` — ngữ cảnh thật
- `scripts/bam-thu.ts` · `scripts/bam-thu/{rao,rao.test,kich-ban}.ts` (mới) · `scripts/soi/dem-revision.ts` (`demRevisionCua`, `tenClan`) · `package.json` (`bam-thu`)
- `docs/van-hanh.md § Kịch bản ghi`

## Code review — 29/08/2026 (ba lớp, `bmad-code-review`)

Blind Hunter 5+ · Edge Case 17 · Acceptance Auditor 12 → 26 sau gộp trùng → **21 patch · 2 defer · 3 dismiss**.

Patch (đã áp, cổng xanh):
1. **Luật lint phủ CẢ `core/**`** (bản đầu chỉ `ops.ts`/`read-ops.ts`: 31/41 tệp ngoài phạm vi) —
   miễn đúng bốn tệp định nghĩa vai/cổng + `core/gates/**`; bắt thêm `case`/`.includes`; khối
   ops mang đủ ba selector (flat config không gộp mảng luật). Test luật viết lại: mỗi khẳng định
   đã kiểm là đỏ được.
2. Luật mới bắt **thêm bảy chỗ chép cổng**: `core/place/index.ts § searchPlaces`, `core/identity/
   info.ts`, `self.ts`, và bốn cổng duyệt chép tay trong `core/identity/ops.ts` (giữ câu tiếng
   Việt ở `forbidden`, còn `unattached`/`unauthenticated` ra từ cổng).
3. **Câu của cổng là tiếng Việt** — adapter có chỗ in thẳng `error.message` (`noi-chon/page.tsx`).
4. `coQuyenDuyet` nhận `Role`, đứng dưới docblock của `privacy.ts`, xuất qua `core/identity`;
   `lib/vai-quan-tri.ts § coBanLamViec` dùng nó — hết bản chép thứ bảy.
5. `bam-thu`: khoá không khớp ⇒ exit 1 (không "xanh rỗng"); `SOI_TEN` phải là quản trị; rào 3
   buộc màn mang **mã clan** của `GIAPHA_CLAN_ID` (hai dòng họ thử cùng lúc); revision không đếm được
   ⇒ "không kết luận được", không phải ✗ màn; `moTrinhDuyet` vào trong `try`; rào 3 hỏng ⇒ dừng và
   VẪN in bản kê.
6. Kịch bản: K1 tiền kiểm có năm sinh + neo đúng câu `cauMauThuan` (chú thích biểu mẫu cũng chứa
   "không thể cùng đúng"); K2 đếm chính xác `— (\d+) khẳng định` + `finally` tách lại; K3 tên mang
   dấu lượt.
7. Ngữ cảnh test còn sót (`media.test.ts`, bốn bài identity với `guest`/`member` không chỗ) sửa về
   hình thật; mã lỗi đổi theo cổng (`unattached` thay `forbidden` cho tài khoản chưa gắn) và test nói rõ.
8. `demRevision` dùng lại `demRevisionCua`; `docs/van-hanh.md` thêm "cách đọc bản kê"; story sửa
   AC 3 (chỗ của lens), AC 6/8 (con số đo), § Phạm vi.

Quyết định: rào 3 chạy SAU đăng nhập — trang công khai không bày tên dòng họ (đã thử `/` và
`/dang-nhap`), và đăng nhập chỉ ghi `session` toàn cục, không chạm phả (`revision` chứng). Ghi rõ ở
đầu `bam-thu.ts` và `docs/van-hanh.md`.

Defer: luật lint không thấy `const MA = 'unattached'` / `err(MA)` hay `{ code: 'unattached' }` — chấp
nhận: luật gác NẾP, review gác NGHĨA (retro 6, nếp 5). Dismiss: "K1 màn không nói câu mâu thuẫn khi
thẻ không có năm sinh" (đã tiền kiểm); "browser leak khi rào 3 hỏng" (đã trong `try/finally`).
