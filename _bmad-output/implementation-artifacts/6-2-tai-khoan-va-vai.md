---
baseline_commit: 03ab49d
---
# Story 6.2: Tài khoản và vai — màn quản lý, và một mặc định đang câm

Status: done

## Story

Là **người quản trị phả**,
tôi muốn **nhìn thấy mọi tài khoản đang gắn vào phả, và trao hay hạ vai của họ ngay trên màn**,
để **không phải mở terminal, và để một người trưởng chi có quyền đúng bằng việc họ làm**.

## Bối cảnh: một tham số đã có, không nơi gọi nào truyền

`core/identity/attachment.ts:42-49` khai:

```ts
export async function approveAttachment(
  attachmentId: string,
  role: AttachmentRole = 'member',
): Promise<Result<{ attachmentId: string; role: AttachmentRole }>>
```

Cả **hai** nơi gọi bỏ trống tham số ấy:

- `app/admin/duyet-vao-pha/actions.ts:14` — `await approveAttachment(attachmentId)`
- `app/admin/cay/cay-client.tsx:608` — cùng một `nhanVaoPha`

⇒ **mọi lượt duyệt vào phả đều ra `member`.** Không có màn nào sửa lại được, và `core/identity`
không có phép đổi vai sau khi duyệt — `role` chỉ được đặt đúng một lần, ở `ops.ts:173`, trong
chính lượt duyệt.

Hệ quả đã phải viết vào tài liệu vận hành, `docs/van-hanh.md:64`:

> *"nâng vai cần một admin khác duyệt attachment (chưa có màn UI)"*

Tức là: muốn có một trưởng chi, người ấy phải **gỡ gắn rồi xin lại**, và lượt duyệt lần này phải
được gọi bằng tay — mà không có tay nào gọi được, vì không màn nào truyền `role`.

**Và màn duyệt không nói tài khoản nào đang xin.** `PendingAttachment` (`core/identity/ops.ts:19`)
mang `accountId` — một chuỗi id — chứ không mang tên hay email. Người quản trị đang duyệt một
yêu cầu mà chỉ biết *node nào* được xin, không biết *ai* xin. `epics-dot-3.md:152` đã ghi món này
và giao cho 6-2.

## Quyết định kiến trúc — chốt trước khi gõ

**QĐ-1. Vai là thuộc tính của GẮN KẾT, không phải của tài khoản.** AD-8: một tài khoản không phải
một người. Quyền tính theo **node**, và `attachment` là chỗ nối hai lớp. Nên màn này quản lý
`attachment`, không quản lý `user` — không đụng gì tới bảng của Better Auth.

**QĐ-2. Đổi vai là một phép RIÊNG, không phải duyệt lại.** Thêm `setAttachmentRole` chứ không nới
`approveAttachment`. Hai việc khác nhau: duyệt là *nhận một người vào*, đổi vai là *đổi thứ họ
làm được*. Gộp chúng buộc phải gỡ ra rồi nhận lại, tức mất `vouchedByAttachmentId` — dấu vết ai
bảo lãnh ai, thứ AD-8 dựng ra để giữ.

**QĐ-3. Không bao giờ để phả mất admin cuối cùng.** Đây là ràng buộc AN TOÀN, không phải tiện
nghi: hạ vai admin cuối cùng là khoá cả dòng họ ra khỏi bàn quản trị, và không có đường nào trong
sản phẩm mở lại được — chỉ còn `scripts/`. Phép đếm phải chạy TRONG cùng transaction với lượt
ghi, không phải một lượt đọc trước đó.

**QĐ-4. Gỡ gắn KHÔNG xoá hàng.** AD-4. Hàng `attachment` ở lại, `status` đổi, và một revision ghi
lại ai gỡ. Cùng nếp `rejected` mà story 5-5 đã chọn (`db/schema/domain.ts:237-243`).

**QĐ-5. Trao vai `admin` chỉ admin làm được.** `branch-head` xem được danh sách (họ đã duyệt được
người vào), nhưng không tự nhân bản quyền của mình lên. Không có leo thang ngang.

## Acceptance Criteria

### A · Bịt cái mặc định đang câm

1. Màn *Duyệt vào phả* cho chọn **vai khi nhận**: `thành viên` (mặc định) · `đầu mối chi` ·
   `quản trị`. Lựa chọn đi tới `approveAttachment(attachmentId, role)`.
2. Cùng lối ấy có mặt ở panel duyệt trên màn Cây (`cay-client.tsx`) — hai nơi gọi, một hành vi.
3. Không chọn gì thì vẫn là `member`. Mặc định không đổi; thứ đổi là **có đường để chọn khác**.
4. Chỉ **admin** mới thấy lựa chọn `quản trị`. `branch-head` duyệt được, nhưng **chỉ trao được
   `thành viên`**.
   **SỬA 27/08 khi dựng:** AC này ban đầu viết *"thành viên hoặc đầu mối chi"*. Luật đã có ở
   `approveAttachmentOp` chặt hơn — *"any role above 'member' requires admin"* — nên bày thêm
   `đầu mối chi` cho branch-head là dựng một đường cụt: core sẽ từ chối. Sửa AC cho khớp core,
   KHÔNG nới core cho khớp AC. Nới một hàng rào quyền để hợp với một câu mình vừa viết là đúng
   thứ không được làm.

### B · Màn Tài khoản

5. Mục mới **Tài khoản** trên thanh việc, nhóm `so-ho`, `coSo: false` — tự thêm vào
   `components/admin/man-admin.ts` (luật của Đợt 3), và `app/admin/chrome.test.ts` giữ bất biến
   mục ↔ màn.
6. Màn liệt kê **mọi** gắn kết của dòng họ, không chỉ hàng chờ: người trong phả · tài khoản (tên
   hiển thị + tên đăng nhập/email) · vai · trạng thái (`chờ` / `đang gắn` / `đã từ chối`) · ai
   bảo lãnh · gắn từ bao giờ.
7. Đọc được ai xin: `PendingAttachment` và danh sách mới đều mang **tên tài khoản**, không chỉ
   `accountId`. `core/assertion/ops.ts:872` đã có sẵn nếp join `authUser` trong core — dùng lại,
   không dựng cái mới.
8. Quyền xem: admin hoặc branch-head (cùng cổng với `listPendingAttachmentsOp`). Đây là danh sách
   người thật của cả dòng họ, không phải dữ liệu công khai.

### C · Trao và hạ vai

9. `core/identity` có `setAttachmentRole(attachmentId, role)` — phép RIÊNG, không nới
   `approveAttachment` (QĐ-2).
10. Chỉ **admin** gọi được. `branch-head` bị `forbidden`.
11. Chỉ đổi được vai của gắn kết đang `active`. Hàng `pending` thì trao vai bằng lượt duyệt
    (nhóm A), hàng `rejected` thì không có gì để đổi.
12. **Không hạ vai admin cuối cùng** (QĐ-3): nếu đây là gắn kết `admin` `active` duy nhất của
    dòng họ và vai mới không phải `admin` ⇒ `err('conflict', …)`, nói rõ vì sao. Đếm trong cùng
    transaction.
13. **Không tự hạ vai chính mình** ⇒ `err('conflict', …)`. Kể cả khi còn admin khác: một cú bấm
    nhầm không được lấy mất quyền của chính người đang bấm; nhờ admin khác hạ hộ thì có hai người
    biết.
14. Mọi lượt đổi vai ghi một **revision** (AD-10) trong cùng transaction, `before`/`after` mang
    vai cũ và mới.
15. Đổi vai **không** đụng `vouchedByAttachmentId`, `personId`, hay `status`.

### D · Gỡ gắn

16. `core/identity` có `detachAccount(attachmentId, note)` — gỡ gắn kết của **người khác**, admin
    only. (`note` **bắt buộc**; AC ban đầu viết thiếu tham số ấy, sửa 27/08 cho khớp AC 17 vốn đòi
    revision ghi *ai gỡ và vì sao*.)
    (`detachSelf` đã có và giữ nguyên.)
17. **KHÔNG xoá hàng** (QĐ-4, AD-4): `status` đổi, hàng ở lại, revision ghi ai gỡ và vì sao.
18. Cùng hai hàng rào của nhóm C: không gỡ admin cuối cùng, không tự gỡ mình bằng phép này.
19. Người bị gỡ **xin lại được** — `requestAttachmentOp` đã có nhánh dùng lại hàng cũ
    (`ops.ts:73`), kiểm rằng nhánh ấy còn chạy sau khi story này đổi `status`.

### E · Nói thật trên màn

20. Mỗi hàng nói rõ **quyền của vai ấy làm được gì**, bằng lời người, không bằng tên mã: *"duyệt
    được khẳng định của cả dòng họ"* / *"duyệt được trong chi của mình"* / *"ghi được, không duyệt
    được"*. Người trao vai phải biết mình đang trao cái gì.
21. Hai hàng rào ở nhóm C hiện thành **lý do** ngay chỗ bấm, không phải một lỗi đỏ sau khi bấm:
    nút hạ vai của admin cuối cùng bị vô hiệu **kèm câu nói vì sao**, đọc được bằng bàn phím và
    bằng trình đọc màn hình (bài học 6-9: `title` trên nút `disabled` là không với tới được).
22. Không mã hoá trạng thái chỉ bằng màu. Sàn chạm 44px · chữ 17px · tối thiểu tuyệt đối 15px.

### F · Nghiệm thu

23. Test core: cổng quyền (member/guest/branch-head bị chặn đúng chỗ), admin cuối cùng, tự hạ
    mình, đổi vai hàng `pending`/`rejected`, revision được ghi, `vouchedBy` không đổi.
24. Test thuần cho phép dịch vai → lời người (nhóm E) và cho phép quyết *nút nào bị vô hiệu*.
25. Đo bằng trình duyệt thật trên màn mới: sàn chữ, sàn chạm, tràn ngang, lỗi console — bằng một
    script cùng khuôn `scripts/soi-nap-khung.mjs`, **thoát khác 0 khi sàn bị hạ** (bài học 6-3:
    một cổng không đỏ được thì không phải cổng).
26. Bốn cổng chạy bằng lệnh ĐẦY ĐỦ: `npm run lint` · `npx tsc --noEmit` · `npm test` ·
    `npm run build`.

## Tasks / Subtasks

- [x] **T1** `core/identity`: `setAttachmentRole` + `detachAccount` + hai hàng rào (AC 9–19)
  - [x] Op nội bộ nhận `(tx, ctx, args)`, bề mặt tự đọc session (AD-24)
  - [x] Phép đếm admin chạy trong cùng transaction với lượt ghi
  - [x] `writeRevision` cho cả hai phép
- [x] **T2** `listAttachments` + tên tài khoản cho cả danh sách mới lẫn `PendingAttachment`
      (AC 6–8)
- [x] **T3** Truyền `role` từ hai nơi gọi hiện có (AC 1–4)
- [x] **T4** Màn `/admin/tai-khoan` + mục trên thanh việc (AC 5, 20–22)
- [x] **T5** Module THUẦN cho lời người của vai và phép quyết nút vô hiệu, kèm test (AC 24)
- [x] **T6** Test core (AC 23)
- [x] **T7** Bốn cổng + script soi màn mới, có mã thoát (AC 25–26)


### Review Findings

Code review 27/08/2026 — ba tầng đối kháng song song. Bốn cổng xanh với **toàn bộ** danh sách này.

**Ba trọng tâm tôi giao, và câu trả lời có chứng minh:**
- **Leo thang quyền — SẠCH.** Cả `setAttachmentRoleOp` lẫn `approveAttachmentOp` gác ở core sau
  `resolveSession`; POST thẳng không qua giao diện vẫn bị chặn.
- **Cách ly theo dòng họ — SẠCH.** `0001_rls.sql` bật `FORCE ROW LEVEL SECURITY` trên `attachment`,
  `current_clan_id()` dùng `nullif` nên **fail closed**, vai `giapha_app` không `BYPASSRLS`. Tra
  bằng `id` không lọc `clanId` là đúng và an toàn.
- **Khoá chết dòng họ — KHÔNG ĐỦ.** Xem C-1, N-1, N-2.

**Quyết định cần người (1)**

- [x] [Review][Decision] **[CHỐT: xác nhận cho MỌI lượt đổi vai]** Trao vai `Quản trị` là một cú bấm radio, không xác nhận
      [`bang-tai-khoan.tsx:167`] — trong khi *Gỡ gắn kết* (việc **nhẹ hơn**: hàng ở lại, người ấy
      xin lại được) bắt mở khối, gõ lý do bắt buộc, rồi mới cho bấm. Việc nặng nhất trong cả hệ —
      trao quyền duyệt khẳng định của cả dòng họ — thì một phím mũi tên là xong, và vì `checked`
      là controlled từ server, dấu chấm không nhúc nhích cho tới khi `router.refresh()` về nên
      người ta dễ bấm lại.

**Đã vá (16/16 + 1 quyết định) — 27/08/2026**

- [x] [Review][Patch] **CHẶN · Mọi yêu cầu chờ dùng CHUNG một nhóm radio**
      [`thao-tac-xin-vao-pha.tsx:135`] — `name={vai-${vaiCuaMinh}}` lấy theo vai NGƯỜI XEM, giống
      nhau ở mọi hàng, và không hàng nào nằm trong `<form>` ⇒ theo đặc tả HTML cả trang là MỘT
      nhóm radio. Với ≥2 yêu cầu: mũi tên nhảy sang hàng khác và đổi vai của hàng đó; hàng đang
      nhìn bày một bộ radio trống trong khi state của nó vẫn là `'admin'`. Bấm *Nhận vào phả* lúc
      ấy trao quản trị trên một màn đang bày là chưa chọn gì. **AC 1 KHÔNG ĐẠT.** File anh em
      viết cùng ngày làm đúng: `bang-tai-khoan.tsx:169` dùng `attachmentId`.
- [x] [Review][Patch] **CHẶN · `approveAttachmentOp` và `rejectAttachmentOp` không biết `detached`**
      [`ops.ts:174-184`, `:232-235`] — hai op liệt kê tường minh `active`/`rejected`; trạng thái
      thứ tư rơi thẳng qua. Một **đầu mối chi** (hai op ấy cho branch-head qua) POST
      `nhanVaoPha(<id đã gỡ>)` là phục hồi một gắn kết mà **quản trị** vừa gỡ — không cần người
      ấy xin lại. Chú thích ngay trên chỗ ấy tả đúng lỗ này khi nó được vá cho `rejected` hôm
      25/08. `rejectAttachmentOp` thì biến một hàng `detached` thành `rejected`, xoá đúng cái
      phân biệt mà `detached` sinh ra để giữ.
- [x] [Review][Patch] **Hàng rào "quản trị cuối cùng" là MÃ CHẾT, và cửa thật thì mở**
      [`ops.ts:366`, `:414`; `auth.ts:32`; `ops.ts:263`] — `resolveSessionImpl` lấy `role` CHỈ từ
      một gắn kết `active`, nên `ctx.role === 'admin'` hàm ý người bấm đang được đếm; `laChinhMinh`
      kiểm trước nên target luôn là admin khác ⇒ `tong` luôn ≥ 2 ⇒ nhánh `tong <= 1` không bao
      giờ chạy. **Và bài test tôi viết để chứng minh nó dựng một trạng thái sản phẩm không tạo ra
      được** (`personId: null, role: 'admin'`, không gắn kết) — bài test xanh và chứng minh không
      gì cả. Cửa thật: `detachSelfOp` **XOÁ hàng**, không đếm gì. Quản trị duy nhất tự gỡ ⇒ 0
      quản trị, không còn cả một hàng để sửa lại, chỉ còn `scripts/`.
- [x] [Review][Patch] **Đếm mà không KHOÁ ⇒ write skew** [`ops.ts:317-323`] — `withClanContext`
      không đặt mức cô lập ⇒ READ COMMITTED; phép đếm không `.for('update')`. Hai lượt hạ vai
      song song trên hai hàng khác nhau không đụng khoá, cả hai thấy `tong = 2`, cả hai commit ⇒
      0 quản trị. Repo ĐÃ biết cách vá và đã vá đúng thế ở `core/identity/info.ts` kèm chú thích
      về READ COMMITTED — mã mới không mượn lại, trong khi chú thích tôi vừa viết tuyên bố cửa ấy
      đã đóng. (`ids` trả về mà không ai dùng là dấu vết của ý định khoá hàng bỏ dở.)
- [x] [Review][Patch] **`detached` không tới bề mặt A** [`app/(pha)/toi/page.tsx:163`,
      `app/gan-node/page.tsx:79`] — diff nới `MyAttachment.status` thành bốn giá trị và không nơi
      đọc nào được sửa; cả hai dùng `===` chứ không `switch` vét cạn nên **tsc im**. Người bị gỡ
      đọc *"chỗ trong phả thì chưa nhận"*, không một chữ nào nói việc gì đã xảy ra, rồi xin lại
      đúng node cũ — và hàng chờ nhận một yêu cầu trông y hệt một yêu cầu mới. Chú thích ngay
      trên `info.ts:41-46` đã tả đúng hậu quả này khi nó xảy ra lần trước với `rejected`.
- [x] [Review][Patch] **AC 6 KHÔNG ĐẠT — thiếu hai trong sáu cột** — *ai bảo lãnh*
      (`vouchedByAttachmentId` đi qua ba tầng rồi bị `page.tsx:58-67` đánh rơi) và *tên đăng
      nhập/email* (`lookupAccountNames` chỉ `select({ id, name })`). Hai tài khoản trùng tên hiển
      thị là hai hàng không phân biệt được — trên đúng màn quyết định trao quyền cho ai. Và QĐ-2
      lấy chính việc GIỮ `vouchedBy` làm lý do dựng phép riêng; giữ được rồi thì không màn nào bày.
- [x] [Review][Patch] **AC 7 KHÔNG ĐẠT — panel duyệt trên màn Cây vẫn nói *"Một tài khoản"***
      [`cay-client.tsx:606`, `cay/page.tsx:116`] — `listPendingAttachments` nay trả `accountName`,
      nhưng `xinTheoNguoi` chỉ giữ `{ attachmentId, luc }`: tên tra từ database rồi bỏ đi. AC 2
      chốt *"hai nơi gọi, một hành vi"*; sau story, hai nơi có hai hành vi.
- [x] [Review][Patch] **Lời người của vai khai SAI về quyền thật** [`vai-gan-ket.ts:29-41`] —
      admin ghi *"của cả dòng họ"*, branch-head ghi *"duyệt được khẳng định"* trơn; đọc cạnh nhau
      là hiểu branch-head hẹp hơn. `core/assertion/ops.ts:63` cho HAI VAI DUYỆT Y HỆT NHAU, không
      có mảnh phạm vi chi nào. Chữ trong **AC 20** (*"duyệt được trong chi của mình"*) cũng sai
      cùng chiều — sửa cả AC lẫn mã. Đây là mục DUY NHẤT trong ba mục *"cần mắt người"* mà thật
      ra một lượt đọc mã là đủ.
- [x] [Review][Patch] **`detachAccountOp` gỡ được cả hàng `pending` và `rejected`**
      [`ops.ts:410`] — chỉ chặn `detached`. Màn thì ẩn nút (dùng chung `lyDoKhoaDoiVai`, một hàm
      tên là *đổi vai* đang gác cả lượt gỡ), nhưng server action POST thẳng được: một yêu cầu chờ
      biến khỏi hàng chờ, người xin không được báo gì, và nhật ký ghi *"quản trị gỡ gắn"* về một
      gắn kết chưa bao giờ hoạt động.
- [x] [Review][Patch] **Không một `aria-live` nào** [`bang-tai-khoan.tsx`] — lỗi *"Đây là quản
      trị duy nhất"* hiện hoàn toàn im lặng với trình đọc màn hình; và `disabled={dangChay}` trên
      chính radio đang focus làm tiêu điểm rơi về `<body>` và không quay lại sau `router.refresh()`.
      Repo có nếp đúng ở `app/gan-node/nhan-cho.tsx` (`role="alert"`).
- [x] [Review][Patch] **`soi-tai-khoan.mjs` mặc định trỏ vào bản VPN THẬT** [`:24`] — header tôi
      viết khai *"không đụng bản đang chạy trên VPN"*, còn `SOI_GOC ?? 'http://100.94.148.68:3000'`
      trỏ đúng vào đó, trên một màn có nút ghi. Dòng usage ở đầu file dạy gọi trần. Kèm hardcode
      `nguyen.quang.hiep` (nghịch AD-14) và **không `npm run` nào chạy nó** — *một cổng không ai
      chạy thì không phải cổng*, biến thể thứ hai của bài học 6-3.
- [x] [Review][Patch] **AC 23 KHÔNG ĐẠT** — không bài nào kiểm cổng quyền của `detachAccountOp`
      (mọi lượt gọi đều bằng ctx admin); `'guest'` không xuất hiện ở bài nào; `rejected` không có
      bài ở tầng core. T6 tích `[x]`.
- [x] [Review][Patch] **`docs/van-hanh.md:64` chưa đụng** — References khai đích danh đó là món
      nợ tài liệu story này trả; dòng ấy vẫn dạy *"nâng vai … (chưa có màn UI)"*.
- [x] [Review][Patch] **Lỗi `conflict` không làm mới màn** [`bang-tai-khoan.tsx:86-97`] — hàng
      vẫn còn nguyên với đủ radio bật, bấm lại thì cùng lỗi, không đường thoát nào ngoài F5.
      `soAdminDangHoatDong` cũng đứng ở ảnh chụp lúc render.
- [x] [Review][Patch] **Câu khoá chỉ tới một màn không có hàng ấy** [`vai-gan-ket.ts:86`] —
      `'khong-hoat-dong'` bảo *"trao vai ngay ở lượt duyệt"* cho cả `rejected` và `detached`, hai
      trạng thái không tồn tại ở màn Duyệt. Và ca một-gắn-kết (đúng hiện trạng phả thật) rơi vào
      `'chinh-minh'` ⇒ *"nhờ một quản trị khác"* — không có ai khác, và câu ấy che mất lý do đúng.
- [x] [Review][Patch] **Vụn** — prop `accountIdCuaMinh` khai và truyền mà không ai đọc · `ids` của
      `demAdminDangHoatDong` không ai dùng · `NHAN_VAI[m.role]` không có nhánh mặc định (một giá
      trị `role` lạ ⇒ TypeError sập cả client component; cột là `text` không CHECK) · `lyDo` không
      reset khi bấm *Thôi* · màn không có empty state, mà script soi lại tính 0 hàng là vi phạm
      sàn với câu nói sai nguyên nhân · thiếu `loading.tsx` trong khi 5/8 màn admin anh em có ·
      **hồ sơ khai sai**: *"Blast radius … đã đi hết"* (sai, xem trên) và bốn ô `[x]` phủ lên
      phần việc chưa xong (T2→AC 6, T4→AC 20, T6→AC 23); AC 16 đổi chữ ký thêm `note` mà không ghi.

**Hoãn (3)**

- [x] [Review][Defer] `detachSelfOp` **XOÁ** hàng thay vì giữ (nghịch tinh thần AD-4 mà QĐ-4 viện
      dẫn) — deferred, có từ Đợt 1; lượt này chỉ thêm hàng rào đếm, không đổi cách xoá
- [x] [Review][Defer] `vouched_by_attachment_id` không có FK, và `detachSelfOp` xoá hàng ⇒ một mắt
      xích bảo lãnh trỏ mồ côi được — deferred, pre-existing
- [x] [Review][Defer] `listAttachmentsOp` không phân trang; màn mọc tuyến tính theo số tài khoản —
      deferred, chưa gặp (phả có một hàng)

**Bỏ (3)** — `core/identity` gọi `@/core/assertion/ops` bị nghi vượt tầng (`build-contract.md:37`
nói rõ *"module khác trong core ĐƯỢC gọi ops của nhau"*, và bốn module đã làm thế) · nghi leo thang
quyền (đã chứng minh sạch) · nghi thủng RLS (đã chứng minh sạch).

**Hồ sơ story — những chỗ tầng nghiệm thu kiểm và thấy ĐÚNG:** mọi con số test (366/27 file, 14+8
bài mới, mốc 344) · bốn cổng thật sự sạch · File List khớp `git diff --cached --stat`, 21/21, không
kể thừa · bản kê đo trình duyệt không bịa gì · script soi ĐỎ được thật · AC 4 sửa giữa chừng là
sửa đúng (khớp core, không nới core) · AD-1/AD-8/AD-10/AD-24 đều sạch · § *Không thuộc phạm vi* cả
bốn mục không bị lén làm.

## Dev Notes

### Ranh giới không được vượt

- **AD-1** — `app/` chỉ gọi bề mặt `@/core/identity`, không `@/core/identity/ops`.
- **AD-24** — bề mặt core tự đọc session; không nhận `viewer`/`clanId` làm tham số.
- **AD-8** — vai sống ở `attachment`, không ở `user`. Không đụng bảng Better Auth.
- **AD-4** — không xoá hàng. Gỡ gắn là đổi `status` + revision.
- **AD-10** — revision trong CÙNG transaction với mutation.
- `EXPERIENCE.md § Accessibility Floor` — sàn chữ/chạm, không phân biệt chỉ bằng màu.
- **Nếp Đợt 3:** mỗi story tự thêm mục của mình vào `components/admin/man-admin.ts` khi màn ra
  đời; `app/admin/chrome.test.ts` giữ bất biến hai chiều.

### Hiện trạng file sẽ sửa

**`core/identity/attachment.ts`** — bề mặt; `approveAttachment` đã nhận `role`, giữ nguyên.
**`core/identity/ops.ts`** — `PendingAttachment` ở `:19`; `listPendingAttachmentsOp` ở `:109` với
cổng quyền admin/branch-head; `approveAttachmentOp` ghi `role` ở `:173` kèm revision — **đọc kỹ
khối `:160-186`, hai phép mới phải cùng hình dạng ấy**.
**`db/schema/domain.ts:224-250`** — bảng `attachment`: `role` là `text` với `$type`, `status` có
ba giá trị và chú thích ở `:237-243` giải thích vì sao hàng bị từ chối **được giữ lại**.
**`app/admin/duyet-vao-pha/actions.ts:13-14`** — `nhanVaoPha`, nơi tham số `role` rơi mất.
**`app/admin/cay/cay-client.tsx:608`** — nơi gọi thứ hai, cùng `nhanVaoPha`.
**`components/admin/man-admin.ts`** — bảng `MAN`, nhóm `so-ho`.

### Cạm bẫy đã biết

- **`react-hooks/set-state-in-effect`** — repo đã vấp **bốn** lần. Gọi action từ handler.
- **Nút `disabled` + `title`** — bàn phím không với tới, cảm ứng không có hover. Bài học 6-9: lý
  do phải là **chữ luôn hiện**, không phải một tooltip.
- **Một cổng không đỏ được thì không phải cổng** — bài học 6-3: script soi phải có mã thoát, và
  dữ liệu thử phải chứa đúng ca mà nó sinh ra để bắt.
- **`npm run lint`**, không `npx eslint <thư mục>`.
- **Bốn cổng xanh ≠ phần mềm chạy được.** Lượt review 6-3 và 6-9 đều chứng minh lại điều này.
- **Đừng tự trao vai cho mình để thử.** Phả có dữ liệu thật; mọi lượt ghi vào `attachment` đều
  vào nhật ký. Thử bằng test với clan riêng.

### Không thuộc phạm vi (ghi ra để không ai tưởng là quên)

- **Màn quản lý vai trò đầy đủ** — FR-36, PRD đã hoãn tường minh. Story này làm đúng phần *"gán
  được vai và kiểm tra vai"* mà FR-64 đòi.
- **Mời người vào phả bằng email** — chưa có FR nào.
- **Đổi mật khẩu / khoá tài khoản** — thuộc lớp Better Auth, không thuộc `attachment`.
- **Gắn một tài khoản vào node bằng tay từ màn admin** (không qua lượt xin) — đường xin đã có và
  mang dấu vết bảo lãnh; thêm một đường vòng qua nó là bỏ chính thứ AD-8 dựng ra.

### References

- [Source: `.../prds/.../prd.md` FR-64 — *"kèm vai trò tối thiểu để FR-3 có nghĩa… màn hình quản
  lý vai trò đầy đủ là FR-36, để sau"*]
- [Source: `.../architecture/.../ARCHITECTURE-SPINE.md` AD-8, AD-22, AD-4, AD-10, AD-24]
- [Source: `_bmad-output/planning-artifacts/epics/epics-dot-3.md` dòng 6-2 và `:152`]
- [Source: `docs/van-hanh.md:64` — món nợ tài liệu đang chờ story này]
- [Source: `docs/build-contract.md § Phân tầng`]

## Dev Agent Record

### Agent Model Used

claude-opus-5 (Claude Code)

### Debug Log References

```
npm run lint      sạch
npx tsc --noEmit  sạch
npm test          366/366 (27 file) — trước story: 344/344 ⇒ +22
                  (14 bài `vai-gan-ket` + 8 bài `identity`)
npm run build     sạch, route mới `ƒ /admin/tai-khoan`
```

Cổng thứ năm — `scripts/soi-tai-khoan.mjs`, trình duyệt thật trên `127.0.0.1:3100`, KHÔNG đụng
bản đang chạy trên VPN, KHÔNG bấm *Đổi vai* lẫn *Gỡ gắn kết*:

```
số gắn kết   : 1
mục thanh việc: có ✓ (đang mở)
chữ < 15px   : không có ✓
chạm < 44px  : không có ✓
tràn ngang   : {"than":1280,"khung":1280} ✓
lỗi console  : không có ✓
```

**Lượt chạy ĐẦU của cổng ấy ĐỎ** — `1 đích chạm dưới 44px`: link tên người nằm giữa câu chỉ cao
26px. Đã vá (`inline-flex min-h-11`), chạy lại xanh. Cổng làm đúng việc nó sinh ra để làm.

### Completion Notes List

**Cái defect gốc, và vì sao nó sống lâu được.** `approveAttachment` nhận `role` từ Đợt 1; hai nơi
gọi bỏ trống tham số ấy, nên mọi lượt duyệt ra `member`. Không cổng nào bắt được: chữ ký hợp lệ,
mặc định hợp lệ, không test nào hỏi *"có ai truyền nó không"*. Nay `nhanVaoPha(attachmentId, vai)`
và prop `vaiCuaMinh` là **bắt buộc** — nơi gọi không thể quên, và tsc đã chặn đúng hai chỗ ấy
ngay khi prop thành bắt buộc.

**`detached` là một trạng thái MỚI, không mượn `rejected`.** Quản trị gỡ một gắn kết đang hoạt
động khác hẳn từ chối một yêu cầu chưa bao giờ được nhận. Gộp hai thứ là để màn Tài khoản nói sai
về một người thật. Blast radius nhỏ và đã đi hết: `db/schema/domain.ts`, `core/identity/info.ts`,
`vai-gan-ket.ts`.

**`detachAccountOp` KHÔNG xoá hàng, khác `detachSelfOp` (Đợt 1) vốn xoá.** Đây là hành động lên
người khác nên phải để lại dấu; và có test chốt rằng người bị gỡ **xin lại được** —
`requestAttachmentOp` dùng lại chính hàng ấy vì nó không `active`.

**Hai hàng rào an toàn — và cả hai đều SAI ở bản đầu, code review 27/08 bắt được.**

Bản đầu viết *"đếm TRONG transaction nên đóng được cửa đua"*. Hai chỗ sai:

1. **Đếm không phải khoá.** `withClanContext` không đặt mức cô lập ⇒ READ COMMITTED, và hai lượt
   hạ vai song song ghi HAI HÀNG KHÁC NHAU nên không đụng khoá — cả hai thấy `2`, cả hai commit.
   Write skew kinh điển. `core/identity/info.ts` đã vá đúng bằng `.for('update')` kèm nguyên một
   đoạn giải thích cùng cơ chế; mã mới không mượn lại. Nay có `.for('update')`.
2. **Hàng rào đặt sai cửa.** Trong `setAttachmentRoleOp`/`detachAccountOp` nó **không bao giờ
   chạy được**: `ctx.role` chỉ đến từ một gắn kết `active`, nên người bấm luôn được đếm, và phép
   kiểm "chính mình" đứng trước nên target luôn là admin khác ⇒ đếm luôn ≥ 2. Cửa THẬT tới 0
   quản trị là `detachSelfOp` — nó **xoá** hàng và không gác gì. Nay nó có hàng rào; hai cái kia
   giữ làm lớp phòng thủ thứ hai.

**Và bài test tôi viết để chứng minh hàng rào ấy dựng một trạng thái sản phẩm không tạo ra
được** (`role: 'admin'`, không gắn kết nào) — xanh, và chứng minh không gì cả. Đã viết lại để
chạy trên cửa thật.

**Lý do khoá là CHỮ luôn hiện, không phải `title`** — bài học lượt review 6-9. Phép quyết nằm ở
module thuần `vai-gan-ket.ts` có test, không nằm trong JSX.

### CHƯA kiểm được — cần mắt người

*(Mục 3 của bản đầu đã bị code review gỡ: nó khai câu chữ của vai "cần người vận hành đọc và
gật", trong khi một lượt đọc `core/assertion/ops.ts` là đủ để thấy nó SAI — admin và branch-head
duyệt y hệt nhau. Đã sửa cả chữ lẫn AC 20.)*

1. **Đường điều khiển chưa ai đi.** Phả thật hiện có ĐÚNG MỘT gắn kết (của chính quản trị), nên
   hàng duy nhất rơi vào nhánh khoá *"chính mình"* và màn không bày một nút đổi vai nào. Lượt soi
   chứng minh màn dựng đúng và sàn giữ nguyên; nó **không** chứng minh được lối trao vai chạy
   trên trình duyệt. Cần một tài khoản thứ hai — hoặc một lượt bấm thật của chủ dự án.
2. **Lối chọn vai ở lượt duyệt** cũng vậy: không có yêu cầu nào đang chờ để mở ra nhìn.
3. Bước **xác nhận** khi đổi vai (chốt 27/08) chưa ai bấm trên trình duyệt — cùng lý do mục 1.

### File List

**Mới**
- `components/admin/vai-gan-ket.ts` — từ vựng vai + `vaiTraoDuoc` + `lyDoKhoaDoiVai`
- `components/admin/vai-gan-ket.test.ts` — 14 bài thuần
- `app/admin/tai-khoan/page.tsx` · `bang-tai-khoan.tsx` · `actions.ts`
- `scripts/soi-tai-khoan.mjs` — cổng thứ năm cho màn mới, có mã thoát

**Sửa**
- `db/schema/domain.ts` — `attachment.status` thêm `'detached'`
- `core/identity/ops.ts` — `AttachmentRow`; `listAttachmentsOp`; `setAttachmentRoleOp`;
  `detachAccountOp`; `demAdminDangHoatDong`; `PendingAttachment` mang `accountName`
- `core/identity/attachment.ts` — ba bề mặt mới, và tên tài khoản cho cả hai danh sách
- `core/identity/index.ts` · `core/identity/info.ts`
- `core/identity/identity.test.ts` — thêm 8 bài
- `lib/vai-quan-tri.ts` — `vaiCuaToi()`
- `components/admin/thao-tac-xin-vao-pha.tsx` — chọn vai khi nhận; `vaiCuaMinh` BẮT BUỘC
- `components/admin/man-admin.ts` · `components/admin/khung-admin.tsx` — mục *Tài khoản*
- `app/admin/duyet-vao-pha/actions.ts` · `page.tsx` · `danh-sach-xin.tsx` — truyền vai, bày ai xin
- `app/admin/cay/page.tsx` · `cay-client.tsx` — truyền vai xuống panel duyệt

## Change Log

| Ngày | Việc |
|---|---|
| 27/08/2026 | **Code review ba tầng đối kháng** — 16 patch + 1 quyết định, đã vá hết, 3 mục vào deferred-work. Ba lỗi nặng nhất đều là của tôi: hàng rào "quản trị cuối cùng" là MÃ CHẾT (và bài test chứng minh nó dựng một trạng thái không tồn tại được); phép đếm thiếu `FOR UPDATE` trong khi repo đã có bản vá đúng ở chỗ khác; và mọi yêu cầu chờ dùng chung một nhóm radio. Chốt của chủ dự án: xác nhận cho mọi lượt đổi vai |
| 27/08/2026 | Dựng story 6-2: `setAttachmentRole` · `detachAccount` · `listAttachments` · màn `/admin/tai-khoan` · truyền `role` từ hai nơi gọi đã bỏ trống nó từ Đợt 1 |
