# Story 5.5: Duyệt người xin vào phả

Status: review

## Story

Là **người trong Ban tu phả**,
tôi muốn **thấy ngay trên cây rằng có người đang xin nhận một chỗ, và nhận hay từ chối ngay tại đó**,
để **người trong họ xin vào phả không phải chờ vô hạn vì tôi không biết là họ đã xin**.

## Bối cảnh: luồng này ĐANG ĐỨT trên production

Epic ghi đây là một trong ba phát hiện buộc Epic 5 phải có mặt:

> `listPendingAttachments` / `approveAttachment` **có trong `core/`, không màn nào gọi** → Luồng vào
> phả (FR-64) **đứt trên production** — người xin nhận chỗ nằm `pending` vĩnh viễn.

Hàm đã có từ Đợt 1. Không ai gọi. Người trong họ bấm "đây là tôi" rồi ngồi đợi mãi mãi.

## Lệch khỏi câu chữ của epic, có lý do kiến trúc

Epic viết: *"người xin vào phả hiện thành **node mờ** cạnh chỗ họ nhận"*. **Không làm thế.**

`requestAttachment(personId)` là *"claim a node in the tree"* — một **tài khoản** nhận một **node
đã có sẵn**. Không có người mới nào được thêm. Vẽ ra một node mờ hình người bên cạnh là bày rằng
sắp có thêm một người trong phả — sai, và sai đúng vào chỗ **AD-8** dựng ra để giữ:

> **AD-8 — An account is not a person.** Prevents: permissions keyed to login identity […] The
> account layer proves control of an email. Attachment to a clan node is a **separate, vouched act**.

Nên: **dấu trên chính node được nhận**, cộng một panel ở cột phải nói ai đang nhận và từ bao giờ.
Bản dựng thử vẽ node con là một phác thảo, không phải một quyết định.

## Tiền đề: core THIẾU hàm từ chối

`core/identity` có `requestAttachment` · `listPendingAttachments` · `approveAttachment` ·
`detachSelf`. **Không có đường từ chối.** Bản dựng thử đã ghi cảnh báo này ở đầu file, và story
này phải dựng nó **trong core** (kèm revision, AD-10) — không được vá ở tầng app.

**Cách biểu diễn — thêm `'rejected'` vào `attachment.status`:**

- Cột là `text('status').$type<'pending' | 'active'>()`. `$type` của Drizzle **chỉ là TypeScript**,
  không có ràng buộc dưới database — nên thêm một giá trị **không cần migration**.
- Giữ hàng lại, không xoá: cùng tinh thần AD-4 — thứ từng được ghi thì không rời khỏi sổ.
- **Xin lại vẫn được, tự nhiên.** `requestAttachmentOp` đã có nhánh *"existing && status !== active
  → dùng lại hàng, đặt về pending"*. Hàng bị từ chối rơi đúng vào nhánh ấy, nên
  `attachment_account_clan_uq` (unique trên `clanId, accountId`) không khoá đường quay lại. Kiểm
  lại nhánh này bằng test — nó là chỗ dễ vỡ nhất khi thêm một trạng thái.

## Acceptance Criteria

### Core — đường từ chối

1. `attachment.status` nhận thêm `'rejected'` (`db/schema/domain.ts`). Không migration.
2. `rejectAttachmentOp(tx, ctx, { attachmentId, note })` trong `core/identity/ops.ts`:
   - Quyền y hệt `approveAttachmentOp`: `admin` hoặc `branch-head`, và người duyệt phải tự có một
     attachment đang hoạt động.
   - Chỉ từ chối được hàng đang `pending`; `active` ⇒ `err('conflict')`.
   - `writeRevision` cùng transaction (AD-10), `action: 'update'`, mang cả `before` lẫn lý do.
3. `rejectAttachment(attachmentId, note)` trên bề mặt `core/identity/attachment.ts`, xuất qua
   `core/identity/index.ts`.
4. `listPendingAttachmentsOp` lọc `status = 'pending'` nên hàng bị từ chối tự biến khỏi hàng chờ —
   **không sửa gì ở đó**, chỉ kiểm bằng test.
5. Test: từ chối rồi thì vắng khỏi hàng chờ · **xin lại được và quay về `pending`** · người không
   đủ quyền ⇒ `forbidden` · hàng `active` ⇒ `conflict` · revision được ghi.

### Trên cây

6. Node bị người khác xin nhận mang **dấu riêng**: viền `destructive` nét đứt + nhãn *"có người
   xin nhận"*. **Không** sinh node mới.
7. Dấu chỉ hiện cho người có quyền duyệt. `listPendingAttachments` đã trả `forbidden` cho vai
   khác — đọc hỏng thì cây vẫn vẽ, chỉ vắng dấu (không hỏng cả màn).
8. Chọn node ấy ⇒ cột phải bày panel **"Có người xin nhận chỗ này"** ĐỨNG TRÊN chồng khẳng định,
   không thay thế nó: người duyệt cần đọc chính các khẳng định về người ấy để quyết.

### Panel duyệt

9. Panel nói: tài khoản nào đang nhận, xin từ bao giờ, và nhận chỗ của ai.
10. Hai nút: **"Nhận vào phả"** (mang son — nó chốt một việc) và **"Từ chối"** (`destructive`,
    dạng ghost).
11. Từ chối hỏi một dòng lý do trước khi gửi. Lý do vào revision, không vào chỗ nào người xin đọc
    được — đây là sổ của ban tu phả, không phải một lời nhắn.
12. Nhận xong: dấu biến mất, panel đóng, số trên *Duyệt vào phả* ở thanh việc giảm.
13. Hỏng thì bày lỗi trong panel, giữ nguyên trạng thái. `forbidden` phải đọc ra được là "không đủ
    quyền", không phải một câu chung chung.

### Thanh việc

14. Thêm mục **"Duyệt vào phả"** vào `man-admin.ts` — nhóm `doi-chieu`, **có số**, icon
    `UserRoundCheck`. Đúng như `man-admin.ts` đã hẹn từ 5-1.
15. Số lấy từ `listPendingAttachments().length`, đọc ở `app/admin/layout.tsx` cùng hai số kia.
    Đọc hỏng ⇒ **vắng số**, không phải `0` — luật đã dựng ở 5-1.
16. Mục phải có màn thật đứng sau: `app/admin/duyet-vao-pha/page.tsx` — danh sách mọi yêu cầu đang
    chờ, cùng hai nút ấy. Cây bày *chỗ*; màn này bày *danh sách*, cho người muốn xử một lượt.
    `chrome.test.ts` bắt lỗi cả hai chiều nên hai thứ phải cùng một lượt.

### Sàn không được hạ

17. Sàn chữ 17px; `15px` cho nhãn phụ. Không đổ bóng. Không xưng hô ngôi hai.
18. Dùng `destructive` cho việc từ chối, **không dùng son** — son mang đúng một nghĩa, *đã chốt*.

## Tasks / Subtasks

- [x] **T1. Đường từ chối trong core** (AC: 1–5)
  - [x] `'rejected'` vào type của `attachment.status`
  - [x] `rejectAttachmentOp` + `rejectAttachment` + xuất qua index
  - [x] Test: hàng chờ · xin lại · quyền · `conflict` · revision
- [x] **T2. Thanh việc + màn danh sách** (AC: 14–16)
  - [x] Mục `duyet-vao-pha` vào `MAN` + icon
  - [x] Số thứ ba ở `layout.tsx`
  - [x] `app/admin/duyet-vao-pha/` — page · loading · error · actions
- [x] **T3. Dấu trên cây** (AC: 6–7)
  - [x] `NutCanvas.the` thêm cờ `coNguoiXin`
  - [x] Trang đọc `listPendingAttachments`, đối chiếu với node trong vùng
- [x] **T4. Panel duyệt ở cột phải** (AC: 8–13)
  - [x] `components/admin/panel-xin-vao-pha.tsx`
  - [x] Đứng TRÊN chồng khẳng định, không thay thế
- [x] **T5. Test + ghi nhận**
  - [x] `chrome.test.ts` xanh
  - [x] `outline.ts` ghi nhận 5-5 đã promote

## Dev Notes

### Ba chỗ dễ sai

1. **Đừng sinh node mới.** Xem § Lệch khỏi câu chữ của epic. Đây là quyết định kiến trúc, không
   phải sở thích.
2. **`requestAttachmentOp` nhánh "dùng lại hàng".** Thêm `'rejected'` là đổi tập giá trị mà nhánh
   ấy đang xử. Nó *đang* làm đúng (`existing && status !== 'active'`), nhưng chú thích nói "Pending
   request → replace it" — sửa chú thích, và **test** đường xin lại.
3. **Số vắng ≠ số 0.** `layout.tsx` đã có luật: `null` là "không đếm được", không bao giờ hoá `0`.

### Hiện trạng file sẽ sửa

| File | Đổi gì |
|---|---|
| `db/schema/domain.ts` | `attachment.status` thêm `'rejected'` (TS-only) |
| `core/identity/ops.ts` | **THÊM** `rejectAttachmentOp`; sửa chú thích `requestAttachmentOp` |
| `core/identity/attachment.ts` | **THÊM** `rejectAttachment` |
| `core/identity/index.ts` | xuất thêm |
| `components/admin/man-admin.ts` | mục thứ 6 |
| `components/admin/khung-admin.tsx` | icon `UserRoundCheck` |
| `app/admin/layout.tsx` | số thứ ba |
| `app/admin/cay/*` | dấu trên cây + panel |

### Testing

**Kiểm được:** toàn bộ T1 — test DB thật theo nếp `core/identity/identity.test.ts`. Đây lại là
phần đáng test nhất, đúng như hai story trước.

**Cần mắt người:** dấu trên node có đọc ra nghĩa "có người xin nhận" không (dễ nhầm với tồn nghi,
vì cả hai đều nét đứt) · panel đứng trên chồng khẳng định có bị đẩy khỏi tầm nhìn không.

### References

- `epics-dot-2.md` hàng 5-5; § Ba phát hiện buộc epic này phải có mặt
- `ARCHITECTURE-SPINE.md` AD-8 · AD-10 · AD-22
- `core/identity/ops.ts:40` `requestAttachmentOp` · `:102` `listPendingAttachmentsOp` · `:129`
  `approveAttachmentOp`
- `core/identity/attachment.ts` — bề mặt hiện có
- `app/uiworkshop/admin-canvas-graph/page.tsx` — cảnh báo #4 ở đầu file (thiếu hàm từ chối)
- FR-64 · `db/schema/domain.ts:186` `attachment`

## Dev Agent Record

### Agent Model Used

_(điền khi implement)_

### Debug Log References

### Completion Notes List

### File List

## Completion Notes

Dev: Claude Opus 5 · 25/08/2026.

### Lệch so với story, và vì sao

| Story ghi | Đã làm | Vì sao |
|---|---|---|
| Node mờ cạnh chỗ họ nhận (câu chữ epic) | **Dấu trên chính node được nhận** | Đã bàn ở § Lệch khỏi câu chữ của epic — AD-8: một tài khoản không phải một người. Quyết định kiến trúc, không phải sở thích. |
| — | **Nói ra ở bề mặt A khi bị từ chối** | Xem dưới. Không có phần này thì luồng FR-64 vẫn đứt. |
| — | **Gỡ vỏ `<aside>` khỏi `CotKhangDinh`** | Panel duyệt đứng TRÊN chồng khẳng định trong cùng một cột; component tự bọc vỏ thì lồng hai lớp là hai viền và hai vùng cuộn. |

### Phần mở rộng phạm vi có chủ ý: người bị từ chối phải BIẾT

Story chỉ nói về phía ban tu phả. Nhưng thêm một trạng thái `rejected` mà người xin không cảm nhận
được thì luồng FR-64 **vẫn đứt** — chỉ đứt im lặng hơn: họ rơi lại vào luồng nhận chỗ như chưa
từng xin, rồi xin lại đúng người cũ, mãi mãi.

Nên `MyAttachment.status` mở rộng theo, và `/gan-node` nói một câu: *lời nhận chỗ lần trước chưa
được nhận, chọn lại người hoặc hỏi ban tu phả*. **Lý do thì không bày** — nó nằm trong sổ của ban
tu phả, không phải một lời nhắn gửi tới người xin.

Trình biên dịch là thứ tìm ra chỗ này: mở rộng type ở `db/schema` làm `core/identity/info.ts` gãy
ngay, và lần theo nó ra tới `/gan-node`.

### Cách biểu diễn: `'rejected'`, không xoá hàng

- `text('status').$type<…>()` — `$type` của Drizzle chỉ là TypeScript, không có ràng buộc dưới
  database, nên **không cần migration**.
- Hàng ở lại (tinh thần AD-4), revision mang lý do (AD-10).
- **Xin lại vẫn được**, vì `requestAttachmentOp` đã có nhánh *"hàng cũ không `active` thì dùng lại,
  đặt về `pending`"*. Đây là chỗ dễ vỡ nhất và có bài test riêng: `attachment_account_clan_uq` là
  unique trên (clanId, accountId), nên nếu hàng bị từ chối không được dùng lại thì **một lần từ
  chối hoá thành một lệnh cấm vĩnh viễn**.

### Đã kiểm được

- `tsc` sạch · `eslint` sạch · `vitest` **162/162** (158 cũ + 4 bài cho đường từ chối) · `build` xanh.
- Bốn bài test: từ chối rồi vắng khỏi hàng chờ **và xin lại được đúng hàng cũ** · vai không đủ
  quyền ⇒ `forbidden` · hàng `active` ⇒ `conflict` · từ chối hai lần ⇒ `conflict`.
- `chrome.test.ts` 17/17 — mục *Duyệt vào phả* có màn thật đứng sau, và ngược lại.

### CHƯA kiểm được — cần mắt người

1. Dấu *"có người xin nhận"* trên node có đọc ra nghĩa không. Cố ý dùng viền **liền** màu
   `destructive` chứ không nét đứt — nét đứt trên bàn này đã mang nghĩa *tồn nghi*, mà một yêu cầu
   vào phả thì không tồn nghi chút nào.
2. Panel duyệt đứng trên chồng khẳng định có đẩy chồng khỏi tầm nhìn không, trên cột 360px.
3. **Chưa ai bấm "Nhận vào phả" lần nào** — nó trao quyền ghi cho một tài khoản thật. Cùng lý do
   với 5-4: tôi không tự ghi vào phả của anh.
4. Câu ở `/gan-node` có đọc ra nghĩa "thử lại được" chứ không phải "bị cấm" không.

### Nợ để lại

Màn danh sách chưa nói **tài khoản nào** đang xin (email/tên đăng nhập) — `PendingAttachment` mang
`accountId` nhưng không mang tên hiển thị, và `lookupAccountNames` nằm ở `core/assertion/ops`. Một
lượt nối nhỏ, nhưng nó là dữ liệu danh tính đi qua ranh giới AD-8 nên đáng làm riêng.
