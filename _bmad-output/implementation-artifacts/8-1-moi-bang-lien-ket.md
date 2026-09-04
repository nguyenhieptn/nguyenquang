---
baseline_commit: 3cec482
---

# Story 8.1: Mời bằng liên kết và mã QR — bảo lãnh trước, đăng nhập là có chỗ

Status: ready-for-dev

## Story

Là **người trong họ đã có chỗ trong phả**,
tôi muốn **tạo một liên kết hoặc mã QR cho một người thân đã có trên cây, gửi riêng cho họ, và họ chỉ
cần đăng nhập (Google hoặc tài khoản riêng) rồi xác nhận một câu "Mình là …?" là tài khoản của họ
gắn thẳng vào chỗ ấy**,
để **cây lớn bằng người thật mà không ai phải tự tìm tên mình, xin chỗ, rồi chờ duyệt — và không ai
tự dựng một cây khác vì không biết mình đã có chỗ**.

## Bối cảnh

Sau 7-6 cửa đã mở, nhưng đường vào là ba bước: tìm tên ở `/gan-node`, xin chỗ (`requestAttachment`,
nằm `pending`), chờ quản trị hoặc đầu mối chi duyệt (`approveAttachment`). Đúng với người lạ; thừa
với con cháu trong nhà, khi người đang cầm điện thoại biết chính xác ai là ai.

Đã có sẵn để nối vào: **(a)** AD-8 định nghĩa gắn tài khoản là *hành động được bảo lãnh* và
`attachment.vouchedByAttachmentId` ghi ai bảo lãnh — vé mời chỉ là bảo lãnh làm **trước**; **(b)**
`?tiep=` đưa người về chỗ đang dở sau đăng nhập, cả biểu mẫu lẫn Google (`/sau-dang-nhap?tiep=`,
review 7-6 #4); **(c)** thông báo `added-to-tree` đã nằm chờ ở node (AD-15) — kích hoạt xong là đọc
được ở `/toi`; **(d)** `detachAccount` cho quản trị gỡ nếu sai người; **(e)** `requestAttachmentOp`
đã có nhánh *dùng lại hàng cũ không `active`* cho cùng tài khoản.

Chưa có: cái **vé** (bảng, hạn, một lần, thu hồi); ràng buộc **một node một tài khoản đang hoạt động**
(`attachment` chỉ duy nhất theo tài khoản, không theo node — hai tài khoản gắn `active` vào cùng
một người là chuyện schema hôm nay cho phép); màn xác nhận; thư viện QR; Google thật (mã sẵn, còn nợ
tên miền + TLS — vé vẫn dùng được với tài khoản riêng).

Chủ dự án chốt cùng ngày: đa dòng họ và khớp/gộp **gác**; story này nằm trong **một dòng họ**.

## Quyết định thiết kế — chốt 04/09/2026

1. **Vé là một bảng phân vùng `invitation`**: `id` (UUIDv7) · `clanId` · `personId` ·
   `tokenHash` (SHA-256 của 32 byte ngẫu nhiên, mã chỉ hiện **một lần** lúc tạo, DB không giữ mã) ·
   `createdByAttachmentId` · `expiresAt` (tạo + 7 ngày) · `redeemedByAccountId` · `redeemedAt` ·
   `revokedAt` · `createdAt`. RLS y hệt `0003_noi_chon.sql`; vào `PARTITIONED_TABLES` và
   `BANG_PHAN_VUNG` của `dong-ho-thu.ts` (xoá **trước** `attachment` và `person`). `revision.entity`
   thêm `'invitation'` ở **cả hai** chỗ (`db/schema/domain.ts` + `core/revision.ts`, build-contract
   § ngoại lệ AD-10). Trạng thái dẫn xuất, không cột: *mở* / *đã dùng* / *thu hồi* / *hết hạn*.
2. **Mời = bảo lãnh trước.** Đổi vé ⇒ `attachment` `active`, vai `member`, `vouchedByAttachmentId`
   = gắn kết của người tạo vé. Không qua hàng chờ. Vai cao hơn vẫn trao ở màn Tài khoản (6-2).
3. **Ai mời được ai — một luật, tính bằng tầm nhìn, không so vai.** Người mời qua `gateWriter`
   (đã gắn). Người được mời phải **còn sống**, **chưa có gắn kết `active`**, không `mergedInto`,
   và người mời thấy họ ở mức `'full'` (`visibilityFor`): thành viên ⇒ trong 3 bậc của mình;
   quản trị và đầu mối chi ⇒ bất kỳ ai (đã `'full'` qua `coQuyenDuyet`). Người đã khuất, người
   ẩn danh với người mời ⇒ `invalid`/`forbidden`. Không thêm cổng thứ ba (lint 7-1).
4. **Một node một tài khoản đang hoạt động**: chỉ mục duy nhất một phần trên `attachment`
   `(clan_id, person_id) WHERE status = 'active'`. Kiểm trước khi áp: phả thật có đúng một gắn kết.
   `approveAttachmentOp` và đổi vé đều dựa vào nó (`conflict` khi đụng), không chỉ đọc-rồi-ghi.
5. **Đổi vé** (`redeemInvitationOp(tx, session, { token })`): băm mã, tìm hàng; từ chối rõ lý do
   khi hết hạn / đã dùng / thu hồi (`conflict`, câu khác nhau); node phải còn đủ điều kiện ở (3)
   **tại lúc đổi**, không phải lúc tạo; tài khoản đã `active` trong dòng họ ⇒ `conflict`; hàng cũ
   không `active` của tài khoản ⇒ dùng lại (cùng nhánh `requestAttachmentOp`). Ghi: `attachment`
   (create/update) + `invitation` (update `redeemedBy`, `redeemedAt`) + hai `revision`, một tx.
   Không tạo thông báo mới — `added-to-tree` đã ở node.
6. **Màn `/moi/[ma]`** (bề mặt A, khung DOC): chưa đăng nhập ⇒ `/dang-nhap?tiep=/moi/<ma>`
   (Google về `/sau-dang-nhap?tiep=` đã có). Đã đăng nhập ⇒ **một câu**: *"Mình là <tên>, <con
   của …|vợ/chồng của …>?"* + son *Đúng, đây là mình* + *Không phải mình* (về trang chủ, vé còn
   nguyên). Vé hỏng ⇒ câu nói đúng lý do + đường sang `/gan-node`. Đổi xong ⇒ `/toi`.
   **Ngoại lệ tầm nhìn có chủ ý:** màn này bày tên + một quan hệ của **đúng node trên vé** cho người
   cầm vé dù người ấy còn là khách — vé được tạo bởi người thấy node ấy trọn, và người nhận được
   cho là chính chủ. `peekInvitationOp` chỉ trả đúng hai trường ấy, không gì khác.
7. **Nút trên phiếu, cả hai bề mặt** (`HoSoPanel` ở `cot-khang-dinh.tsx`; bề mặt A qua
   `quanh-minh-client.tsx`): *Mời người này vào phả* chỉ mọc khi người ấy thoả (3) với người xem.
   Bấm ⇒ hộp: liên kết đầy đủ, mã QR (SVG), nút *Chép liên kết*, ngày hết hạn, *Thu hồi*. Phiếu bày
   vé đang mở của người ấy (một dòng: *"đã mời ngày …, hết hạn …"*) — tạo vé thứ hai khi đang có vé
   mở ⇒ thu hồi vé cũ trước, nói rõ.
8. **QR sinh ở server** bằng thư viện `qrcode` (MIT) ra SVG, nhúng thẳng — không ảnh ngoài, không
   CDN. Liên kết dựng ở **một** hàm `duongMoi(ma)` (nền cho slug sau này, review 04/09 § 5.3).
9. **Màn Tài khoản** (`/admin/tai-khoan`): khu *Vé mời đang mở* — người được mời, người tạo, hết
   hạn, *Thu hồi*; và vé đã dùng gần đây (ai đổi, lúc nào). Quản trị thấy được ai cầm vé của ai.
10. **Không kênh gửi.** Người ta chép link, gửi Zalo/tin nhắn, hoặc đưa QR tận tay, in lên thiệp
    mời giỗ. Tài liệu nói thẳng: *không đăng link lên nhóm chung* — ai cầm link là thành người ấy.

## Acceptance Criteria
1. Schema + migration: `invitation` sinh bằng `npm run db:generate -- --name moi-bang-lien-ket`
   rồi **nối tay** GRANT / ENABLE / FORCE / POLICY theo mẫu `0003`; chỉ mục một phần ở (4).
   `rls.gate.test.ts` xanh với bảng thứ 12 (cả bốn bài: schema, cách ly, fail-closed, policy lọc
   theo clan); `dong-ho-thu` dựng và dọn sạch.
2. `core/identity`: `mintInvitation` · `peekInvitation` · `redeemInvitation` · `revokeInvitation` ·
   `listInvitations` (surface + ops, AD-24). Test ở `identity.test.ts` trên dòng họ tạm: thành viên
   mời **Em** (sống, trong 3 bậc) ⇒ ok; mời **Tổ** (đã khuất) ⇒ `invalid`; mời **Xa** (mảnh rời,
   ngoài bán kính) ⇒ `forbidden`; quản trị mời Xa ⇒ ok; đổi vé bằng tài khoản `chuaGan` ⇒ gắn kết
   `active`, `vouchedBy` = người tạo, `resolveSession` trả `personId` của Em; đổi lần hai ⇒
   `conflict` "đã dùng"; vé hết hạn (chèn `expiresAt` quá khứ) ⇒ `conflict`; thu hồi rồi đổi ⇒
   `conflict`; node đã có gắn kết `active` ⇒ mint `conflict` **và** redeem `conflict`; tài khoản đã
   `active` trong dòng họ ⇒ `conflict`; mã sai định dạng ⇒ `not-found`, không ném.
3. `/moi/[ma]`: khách ⇒ chuyển hướng đăng nhập mang `tiep`; đã đăng nhập ⇒ câu xác nhận đúng tên +
   quan hệ; *Đúng* ⇒ `/toi` bày *"được thêm vào phả"* (thông báo cũ) và tên mình; vé hỏng ⇒ ba câu
   khác nhau cho ba lý do. Khai vào `scripts/soi/dang-ky.ts` với `giaiDuong` trả `/moi/khong-co-ve`
   (đo trạng thái vé hỏng — trạng thái xác nhận đo bằng K6); `dang-ky.test.ts` xanh.
4. Phiếu cả hai bề mặt: nút chỉ mọc đúng điều kiện (3); hộp có link + QR + chép + hết hạn + thu hồi;
   dòng vé đang mở. Test adapter (`app/admin/cay/actions.test.ts`): thành viên thấy nút cho Em,
   không cho Tổ, không cho Xa; quản trị thấy cho Xa. `soi cay gia-pha tai-khoan moi` 0 vi phạm mới.
5. `/admin/tai-khoan`: khu vé mời với thu hồi; thu hồi ghi `revision` kèm lý do (như gỡ gắn).
6. `bam-thu` **K6**: quản trị thêm một người sống mới mang dấu lượt (như K3) ⇒ mở phiếu ⇒ *Mời* ⇒
   đọc link từ hộp ⇒ ngữ cảnh trình duyệt **mới** (không cookie) ⇒ link ⇒ về đăng nhập ⇒ đăng nhập
   bằng tài khoản mới mang dấu lượt ⇒ câu *"Mình là Nguyễn Thử Mời <dấu>…?"* ⇒ *Đúng* ⇒ `/toi` nói
   tên ấy. Chạy **hai lần liên tiếp** trên cùng dòng họ thử, cả hai xanh. `revisionMongDoi` đo ở
   lượt đầu rồi ghi làm bất biến.
7. `docs/van-hanh.md § Mời bằng liên kết` (cách hoạt động, hạn 7 ngày, một lần, thu hồi, *không
   đăng nhóm chung*, Google đứng sau tên miền + TLS). Sáu cổng xanh; `deferred-work` chỉ phát sinh
   từ review.

## Phạm vi — KHÔNG thuộc story này
- Mời người **chưa có** trên cây (thêm-và-mời một bước) — ứng viên 8-2.
- Vé nhiều lần dùng, vé cho cả một chi, gửi qua kênh ngoài web (FR-60 bỏ từ 10/08).
- Trao vai qua vé (vai vẫn ở màn Tài khoản). Admin hệ thống, đa dòng họ, khớp/gộp — gác.
- Bật Google thật — việc của chủ dự án sau tên miền + TLS; story không chờ.

## Tasks / Subtasks
- [ ] **T1** Schema `invitation` + `PARTITIONED_TABLES` + `BANG_PHAN_VUNG` + entity revision; migration
      generate + RLS nối tay; chỉ mục một phần trên `attachment`; gate xanh (AC 1)
- [ ] **T2** Ops + surface ở `core/identity` (mint · peek · redeem · revoke · list); mã ngẫu nhiên +
      băm; luật tầm nhìn dùng `visibilityFor`; test `identity.test.ts` (AC 2)
- [ ] **T3** `app/moi/[ma]`: page + actions + màn xác nhận một câu + ba câu vé hỏng; `dang-ky.ts` (AC 3)
- [ ] **T4** Nút + hộp vé trên `HoSoPanel` (B) và `quanh-minh-client` (A); `duongMoi`; QR SVG qua
      `qrcode`; dòng vé đang mở; test adapter điều kiện nút (AC 4)
- [ ] **T5** Khu vé mời ở `/admin/tai-khoan` + thu hồi (AC 5)
- [ ] **T6** K6 hai lượt; đo `revisionMongDoi` (AC 6)
- [ ] **T7** `docs/van-hanh.md`; sáu cổng; review ba lớp (AC 7)

## Dev Notes
- **Băm và tra**: `crypto.randomBytes(32).toString('base64url')` ⇒ mã; `sha256` ⇒ `tokenHash`; tra
  bằng `WHERE token_hash = $1` dưới clan context của **phiên** (AD-24). Khách chưa đăng nhập không
  đổi được vé nên không có đường tra ngoài phiên; `peek` dùng `resolveViewer` (khách được).
- **Tầm nhìn khi mint**: dùng `relationshipDistance` + `visibilityFor` như `thayDuocNguoi` ở
  `core/person/ops.ts` — cân nhắc dời `thayDuocNguoi` sang `core/identity` để hai nơi dùng chung
  (module core gọi ops của nhau được, build-contract § phân tầng).
- **Chỉ mục một phần** trong Drizzle: `uniqueIndex('attachment_person_active_uq').on(t.clanId,
  t.personId).where(sql\`status = 'active'\`)`; kiểm `generate` sinh đúng `WHERE`.
- **`revision.action`** cho vé: tạo `create`, đổi `update` (before/after mang `redeemedBy`), thu hồi
  `withdraw` — không thêm giá trị mới.
- **`/moi` là route ngoài `(pha)`** (như `/gan-node`): tự import `ThanhDieuHuong`, khung `DOC`; không
  chữ "node"/"token" trên màn — gọi là *lời mời* / *mã mời*.
- **K6 và tài khoản mới**: runner `bam-thu` đang dùng tài khoản của `dungDongHoThu`; đổi vé cần tài
  khoản **chưa gắn** ở mỗi lượt ⇒ tạo qua `auth.api.signUpEmail` với email mang dấu lượt
  (`thu-moi-<dấu>@test.local`, dọn bằng mẫu `thu-%@test.local` đã có). Nếu runner không có quyền ấy,
  thêm một tài khoản `moi` vào `dungDongHoThu` và K6 gỡ gắn kết ở cuối lượt (`detachSelf`) — ghi rõ
  cách nào được chọn.
- **Người ẩn với công chúng** (`hiddenFromPublic`) vẫn mời được nếu người mời thấy trọn; màn vé bày
  tên theo ngoại lệ (6). Vị thành niên: mời được (tài khoản là của trẻ hay của cha mẹ — không phải
  việc của hệ), nhưng ghi ở tài liệu.
- **QR**: `qrcode.toString(url, { type: 'svg', margin: 1 })` trong server action; sàn kích thước
  bày ≥ 160px để quét từ màn khác; tương phản mực trên giấy dó đo bằng `soi`.

### References
- [PRD FR-64 · FR-55 · FR-11] · [spine AD-8, AD-10, AD-13, AD-20, AD-24] · [build-contract § ngoại lệ AD-10]
- [`core/identity/ops.ts § requestAttachmentOp`, `§ approveAttachmentOp`] · [`core/identity/privacy.ts § visibilityFor`]
- [`core/person/ops.ts § thayDuocNguoi`] · [`app/sau-dang-nhap/page.tsx`, `app/dang-nhap/form-dang-nhap.tsx:297-316`]
- [`db/migrations/0003_noi_chon.sql` (mẫu RLS nối tay)] · [`core/gates/dong-ho-thu.ts § BANG_PHAN_VUNG`]
- [`scripts/bam-thu/kich-ban.ts § K3`] · [`scripts/soi/dang-ky.ts`] · [review 04/09 § 5 (nền dựng sẵn)]

## Dev Agent Record

### Agent Model Used

### Ghi chép lượt dựng

### File List
