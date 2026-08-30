---
baseline_commit: a9a990d
---

# Story 7.3: Ẩn theo báo cáo — cái nút mà AD-17 cho phép từ Đợt 1

Status: review

## Story

Là **người trong họ nhìn thấy một khẳng định sai hoặc gây tổn thương về người thân mình**,
tôi muốn **ẩn nó NGAY tại chỗ đang nhìn, nói lý do, không phải chờ ai duyệt — và ban tu phả gỡ được
một quê quán hay ghi chú ghi nhầm mà không phải để nó nằm mãi**,
để **một lời khai làm đau người sống không hiện ra lâu hơn thời gian một cú bấm (AD-17), và không
loại khẳng định nào chỉ có đường vào**.

## Bối cảnh

AD-17: *"một lượt báo cáo đưa khẳng định vào trạng thái ẩn, không cần duyệt; khôi phục cần quyền
duyệt."* `hideAssertionOp` (gateWriter) và `restoreAssertionOp` có từ Đợt 1; hàng chờ có khu *"đã ẩn
theo báo cáo"* với nút khôi phục (3-3/6-8). Thiếu đúng **cái nút ẩn** — `deferred-work § 5-3` ghi
SHOULD từ 25/08. Cùng lúc `deferred-work § 6-1`: nút *Loại* chỉ mọc trên chồng mâu thuẫn và hai
loại quan hệ; `place`/`note` là chồng nối tiếp nên ghi nhầm là vĩnh viễn.

## Quyết định thiết kế — chốt 29/08/2026

1. **Nút "Ẩn theo báo cáo…" trên MỌI dòng, CẢ HAI bề mặt.** Bấm mở một ô lý do (bắt buộc) + *Ẩn
   ngay* / *Thôi* ngay dưới dòng — không hộp thoại, không rời phiếu. Lý do đi vào `revision.note`
   (AD-4: giá trị ở lại nhật ký). Sau khi ẩn, dòng rời phiếu (chồng dựng lại), thẻ chiếu lại.
2. **Loại cho `place`/`note` ở bề mặt B**: `loaiDuocDuNoiTiep` mở thêm hai loại; nhãn nút nói đúng
   thứ nó loại (*Loại nơi này* · *Loại ghi chú này*); ghi chú nhật ký *"Gỡ một nơi chốn / một ghi
   chú ghi nhầm ở bàn làm việc"*.
3. **Không nút khôi phục ở phiếu** — nó là việc duyệt, đã có ở hàng chờ (AD-17).
4. Đường ghi qua `lib/ghi-pha.ts § anKhangDinh` — một ruột, hai vỏ `'use server'`.

## Acceptance Criteria
1. Phiếu (B và A): mỗi dòng khẳng định sống có nút *Ẩn theo báo cáo…*; mở ô lý do; *Ẩn ngay* vô
   hiệu khi lý do trống; sau khi ẩn, dòng biến mất khỏi phiếu và có mặt ở `/admin/hang-cho` khu
   "đã ẩn theo báo cáo" với đúng lý do.
2. Thành viên thường ẩn được (gateWriter); khách ⇒ `unauthenticated`; khôi phục vẫn chỉ quyền duyệt
   (không đổi). Test adapter với phiên thật (`app/admin/cay/actions.test.ts` hoặc gia-pha).
3. Bề mặt B: dòng `place`/`note` có nút *Loại nơi này* / *Loại ghi chú này*; bề mặt A không có.
4. `cam-bam.ts` biết ba nhãn mới (*Ẩn theo báo cáo*, *Ẩn ngay*, *Loại nơi này*, *Loại ghi chú này*);
   `soi cay gia-pha` 0 vi phạm mới (nút mới đủ 44px, chữ 17px).
5. `bam-thu` thêm K4: thành viên ẩn năm sinh của chính mình ⇒ phiếu không còn năm ấy; revision +1.
6. `deferred-work` ✅ hai mục (5-3 hideAssertion · 6-1 place/note). Năm cổng + bam-thu xanh.

## Phạm vi — KHÔNG thuộc story này
- Thông báo cho người bị ẩn / người ghi (FR-55 "được biết") — sau.
- Khôi phục từ phiếu — không; đó là việc duyệt.

## Tasks / Subtasks
- [x] **T1** `anKhangDinh` ở `lib/ghi-pha.ts` + hai action (AC 2)
- [x] **T2** Panel: nút ẩn + ô lý do, `onAn` bắt buộc qua ba lớp; Loại cho place/note (AC 1, 3)
- [x] **T3** Hai client truyền `onAn`; `cam-bam.ts`; K4 `bam-thu` (AC 4, 5)
- [x] **T4** Test adapter; deferred-work; cổng + soi + bam-thu (AC 2, 6)

## Dev Notes
- `hideAssertion(assertionId, reason)` ở `@/core/assertion` — gateWriter, `invalid` khi lý do trống.
- `MotDong` hiện chỉ dựng hàng nút khi `nangHienDuoc || loaiDuoc` — nay luôn dựng (nút ẩn luôn có).
- `sauKhiGhi` ở hai client đã nạp lại hồ sơ sau mỗi lượt ghi — dùng lại cho ẩn.

### References
- [ARCHITECTURE-SPINE § AD-17] · [`core/assertion/ops.ts § hideAssertionOp`] · [`app/admin/hang-cho/page.tsx:181`]
- [`deferred-work.md § 5-3`, `§ 6-1`] · [`components/admin/quan-he-ghi-them.ts § loaiDuocDuNoiTiep`]

## Dev Agent Record

### Agent Model Used
Claude Fable 5 · 29/08/2026.

### Ghi chép lượt dựng
- Test adapter dạy một điều: ẩn năm MẤT của Xa ⇒ cột chiếu `deathDate` về null ⇒ Xa "còn sống" với
  bán kính ⇒ thành viên cách bốn bậc không còn thấy chồng nào. Đúng AD-13/AD-19 — ẩn có chiếu lại.
- `bam-thu` K4 lượt đầu ẨN NHẦM DÒNG TÊN của "Mình": `aside section` lồng nhau, `.filter({has: h3})
  .first()` chọn khối NGOÀI. Neo lại từ chính `<h3>` lên cha. Dòng họ thử K73 bị hỏng (tên ẩn) —
  xoay sang K74, chạy lại: **K1–K4 4/4 ✓, revision 73 → 82**.
- Lượt đăng nhập của K4 hụt một lần dù K3 vừa vào bằng cùng tài khoản — thêm một lần thử lại.
- `soi cay gia-pha` (3 lượt) 0 vi phạm mới sau khi thêm nút.

### File List
- `lib/ghi-pha.ts` (`anKhangDinh`) · `app/admin/cay/actions.ts` · `app/(pha)/gia-pha/actions.ts`
- `components/admin/cot-khang-dinh.tsx` (nút ẩn + ô lý do; `onAn` qua ba lớp; nhãn Loại theo loại) · `components/admin/quan-he-ghi-them.ts`
- `app/admin/cay/cay-client.tsx` · `app/(pha)/gia-pha/_quanh-minh/quanh-minh-client.tsx`
- `scripts/soi/cam-bam.ts` · `scripts/bam-thu/kich-ban.ts` (K4) · `scripts/bam-thu.ts` (thử lại đăng nhập)
- `app/admin/cay/actions.test.ts` (+2) · `deferred-work.md` (✅ 5-3, 6-1)
