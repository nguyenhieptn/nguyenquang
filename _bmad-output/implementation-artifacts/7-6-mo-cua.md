---
baseline_commit: 355d882
---

# Story 7.6: Mở cửa cho người trong họ — ba việc nhỏ trước khi người thật bước vào

Status: done

## Story

Là **người trong ban tu phả sắp mời người thật vào phả**,
tôi muốn **màn duyệt nói rõ tài khoản nào đang xin (kiểm lại và ghi nhận), thành viên không ghi lên
được người mình không thấy tên, khung chờ của "Phả quanh mình" khớp với màn thật, và một trang hướng
dẫn bật đăng nhập Google khi tôi có mã**,
để **cánh cửa mở ra không có góc nào cắt tay: không ai ghi nhầm vào một người được giữ kín, không
ai duyệt một tài khoản mà không biết là ai**.

## Bối cảnh

Phả thật có đúng một tài khoản gắn kết (chủ dự án). Ba mục nợ đứng đúng ở cửa: `§ 5-5` *màn duyệt
chưa nói tài khoản nào* (6-2 đã bày tên + tên đăng nhập — cần kiểm lại và đóng); `§ 6-10` *người ẩn
danh trên bề mặt thành viên vẫn ghi lên được* (thẻ "Một người trong họ" có nút *Thêm người quanh
đây*); `§ 6-10` *`loading.tsx` của `/gia-pha` nhịp theo hình cũ*. Google login: `core/identity/ba.ts`
bật provider khi có `GOOGLE_CLIENT_ID/SECRET`, biểu mẫu chưa có nút vì client không biết trạng thái.

## Quyết định thiết kế — chốt 29/08/2026

1. **Không thấy tên thì không ghi lên.** Thẻ ẩn danh (FR-55, ngoài bán kính) KHÔNG có *Thêm người
   quanh đây*, không có biểu mẫu ghi thêm — phiếu nói *"Người này được giữ kín với người xem; phả
   không ghi thêm lên một người mình không thấy tên."* Core vẫn giữ nguyên (nó đã gác bằng bán kính
   khi đọc); đây là mô hình: ghi là hành vi có địa chỉ.
2. **Màn duyệt**: giữ tên + tên đăng nhập (6-2 đã làm), thêm dòng *"tài khoản tạo lúc …"* nếu có —
   không; chỉ kiểm và đóng nợ 5-5 với bằng chứng (test adapter đọc `accountName`).
3. **`loading.tsx` `/gia-pha`**: máy = canvas + cột phải 360px; điện thoại = ba hàng đời + thanh
   dưới — nhịp theo hình 6-10.
4. **Google**: cờ `NEXT_PUBLIC_GOOGLE_SIGNIN=1` (client đọc được) ⇒ nút *Vào bằng Google* gọi
   `authClient.signIn.social({ provider: 'google' })`; server vẫn chỉ bật khi có mã. `.env.example` +
   `docs/van-hanh.md` ghi ba bước tạo OAuth app. **Việc điền mã là của chủ dự án** — story này chỉ
   dựng cửa và viết hướng dẫn.

## Acceptance Criteria
1. Bề mặt A: chọn thẻ ẩn danh ⇒ không nút *Thêm người quanh đây*, không *Ghi thêm thông tin*, phiếu
   nói câu giữ kín. Test adapter: `xemHoSo` người ẩn danh trả `visibility: 'anonymous'` (đã có).
2. `/admin/duyet-vao-pha` bày tên tài khoản + tên đăng nhập của người xin — test adapter đọc
   `listPendingAttachments().accountName` khác `null` cho tài khoản thử chưa gắn sau khi xin.
3. `loading.tsx` `/gia-pha` khớp hình 6-10; `soi gia-pha` không đổi (khung chờ không đo được — ghi rõ).
4. `NEXT_PUBLIC_GOOGLE_SIGNIN=1` ⇒ nút Google trên `/dang-nhap`; không cờ ⇒ không nút; `.env.example`
   và `docs/van-hanh.md` có hướng dẫn; bảng "Việc còn nợ" cập nhật.
5. `deferred-work` ✅ ba mục (5-5 · 6-10 ẩn danh · 6-10 loading). Năm cổng; `bam-thu` K1–K5 vẫn xanh.

## Phạm vi — KHÔNG thuộc story này
- Thông báo "được biết khi mình được thêm vào" (FR-55) — `epics-dot-4 § Sau epic này`.
- Tạo OAuth app — việc của chủ dự án với tài khoản Google của dòng họ.

## Tasks / Subtasks
- [x] **T1** Ẩn danh không có nút ghi (AC 1)
- [x] **T2** Kiểm màn duyệt + test (AC 2)
- [x] **T3** `loading.tsx` (AC 3)
- [x] **T4** Cờ Google + nút + tài liệu (AC 4)
- [x] **T5** deferred-work · cổng (AC 5)

## Dev Notes
- `HoSoNguoi.visibility` đã có; `HoSoPanel` chưa mang — thêm `anDanh?: boolean`.
- Dòng họ thử: `chuaGan` xin gắn vào Mồ Côi rồi `listPendingAttachments` (quản trị) đọc `accountName`.

### References
- [`deferred-work.md § 5-5`, `§ 6-10`] · [`core/identity/ba.ts` socialProviders] · [`app/dang-nhap/form-dang-nhap.tsx:297`]

## Dev Agent Record

### Agent Model Used
Claude Fable 5 · 29/08/2026.

### Ghi chép lượt dựng
- Nợ 5-5 hoá ra đã được 6-2 trả (tên + tên đăng nhập qua `docNhanTaiKhoan`) mà sổ nợ chưa đóng —
  7-6 đóng bằng một test adapter (tài khoản chưa gắn xin chỗ ⇒ quản trị đọc được tên).
- Thẻ ẩn danh không dựng được trên dòng họ thử (Mồ Côi là mảnh rời, không lên canvas của Mình) —
  luật gác ở `hoSo.anDanh` từ `visibility === 'anonymous'` (đã có test ở 6-1 cho giá trị này).
- Nút Google chỉ mọc khi `NEXT_PUBLIC_GOOGLE_SIGNIN=1` — biến `NEXT_PUBLIC_*` nướng lúc build, nên tài
  liệu nói rõ phải `deploy.sh` (build), restart không đủ.
- `soi gia-pha dang-nhap duyet-vao-pha` 0 vi phạm mới. `bam-thu` lượt chạy lại trên CÙNG dòng họ thử
  (K77, đã qua một lượt) lộ hai chỗ K1 không tự đủ: `.first()` trôi sang thẻ K3 vừa thêm (không năm
  sinh) và chồng Sinh hoá mâu thuẫn thì không còn nút giá trị để mở "Ghi thêm năm sinh" — nửa đúng
  của review 7-3 #9. Vá: K1 neo thẻ quản trị + năm mang dấu lượt; chồng mâu thuẫn có nút *Ghi thêm
  một lời khai khác*. Chạy lại: **K1–K5 5/5 trên clan đã dùng**.

### File List
- `components/admin/cot-khang-dinh.tsx` (`anDanh`, câu giữ kín) · `app/(pha)/gia-pha/_quanh-minh/quanh-minh-client.tsx`
- `app/(pha)/gia-pha/loading.tsx` · `app/dang-nhap/form-dang-nhap.tsx` (nút Google theo cờ)
- `.env.example` · `docs/van-hanh.md § Đăng nhập Google` + bảng nợ
- `app/admin/cay/actions.test.ts` (+1) · `deferred-work.md` (✅ 5-5 · 6-10 ×2)
- `scripts/bam-thu/kich-ban.ts` (K1 neo thẻ quản trị, năm mang dấu lượt) · `components/admin/cot-khang-dinh.tsx` (nút ghi thêm trên chồng mâu thuẫn)

## Code review — 29/08/2026 (ba lớp, `bmad-code-review`)

Blind Hunter 17 · Edge Case 14 · Acceptance Auditor 16 → 24 sau gộp trùng → **18 patch · 2 defer · 4 dismiss**.
Cả ba lớp cùng bắt một điều: rào "không thấy tên thì không ghi lên" bản đầu chỉ ở MỘT nút của phiếu.

Patch:
1. **Rào ở CORE**: `thayDuocNguoi(tx, ctx, personId)` — `addAssertionOp` và ba mốc của
   `createPersonOp` từ chối (`forbidden`) khi người ghi (không quyền duyệt) thấy người ấy là
   `'anonymous'`. Lý do không chỉ là mô hình: một khẳng định `death` tồn nghi là đủ để cột chiếu lật
   người giữ kín thành "đã khuất" ⇒ `'full'` với cả họ. Test: người giữ kín (FR-55) ⇒ thành viên
   forbidden, quản trị được, người đã khuất ai cũng ghi được.
2. **Cửa thứ hai** (thanh công cụ canvas, `onMoThem`) cùng rào; nút phiếu chỉ mọc khi hồ sơ ĐÃ về
   (lúc tải `hoSoHienHanh` là null, rào mở toang); biểu mẫu đang mở tự đóng khi người hoá ẩn danh.
3. **Khung chờ**: phục vụ BỐN màn `/gia-pha/**` — hàng đầu trang trong `KHUNG`, cây trong `RONG`
   (skeleton hẹp `max-w-5xl` còn canvas thật tràn), điện thoại thẻ xếp DỌC trọn bề ngang (bản đầu
   vẽ dải ngang — ngược hình thật), clamp đúng 520/−13rem, `aria-label` chung "Đang mở cây".
4. **Google về `/sau-dang-nhap`** (server gọi `dichSauDangNhap`, `?tiep=` đi theo) thay `'/'` — chưa
   gắn thì tới `/gan-node` như lời hứa dưới nút; lỗi `signIn.social` nói ra; khoá nút khi đang chuyển.
5. **Tài liệu nói thật**: Google chỉ nhận redirect `https://` (trừ localhost) ⇒ việc này ĐỨNG SAU nợ
   tên miền + TLS; bảng nợ hết mâu thuẫn "restart" ⇄ "build". Action item cho chủ dự án ghi ở
   `sprint-status`.
6. Nút trên chồng mâu thuẫn: chữ thấy = tên đọc ("Ghi thêm năm sinh khác"); K1 neo theo tên đọc,
   kiểm năm trùng, đọc riêng khối Sinh; test màn duyệt kiểm cả tên đăng nhập; đoạn ẩn danh không
   lặp với đoạn "ngoài bán kính"; voice sửa ("mình"/"người xem" → "vòng ruột thịt").

Defer (→ `deferred-work.md § 7-6`): tài khoản tạo bằng Google gõ vào ô mật khẩu (không có mật khẩu)
nhận câu "sai mật khẩu" — cần một nhánh lỗi riêng khi có Google thật; `/sau-dang-nhap` đăng ký với
`soi` như một điểm chuyển hướng. Dismiss: "hai đoạn cho ẩn danh" (đã gộp); "`!hoSo.anDanh` thừa"
(giữ cho rõ ý); Facebook (không có trong PRD).
