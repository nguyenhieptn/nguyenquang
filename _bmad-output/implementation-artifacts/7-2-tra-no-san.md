---
baseline_commit: 57b7ce8
---

# Story 7.2: Trả nợ sàn — một token, hai dòng class, một `nowrap`

Status: review

## Story

Là **người vận hành bàn làm việc (tay run, mắt kém — `DESIGN.md:224`)**,
tôi muốn **mọi chữ nhãn phụ đạt sàn 4.5:1, mọi liên kết tên người chạm được 44px, và không bảng nào
phải cuộn ngang để đọc một câu**,
để **bộ đo thôi "ghi nợ" bốn thứ mà nó đã đo được từ 6-6, và bảng nợ đứng yên suốt phần còn lại của
Đợt 4**.

## Bối cảnh — 92% vi phạm là một token, và "việc của người đặt ra bảng màu"

Lượt đo đầu của 6-6 ra 426 vi phạm; 396 khai vào nền đã biết, trong đó **185 là một token**:
`--muted-foreground #796952` trên nền bàn `#edeae4` = 4.42:1 (sàn 4.5). Trên ô trắng cùng token đạt
5.31:1, trên giấy dó 4.63:1 — chỉ nền bàn hụt. `da-biet.ts` ghi *"đổi một token màu là quyết định
THIẾT KẾ … việc của người đặt ra bảng màu"*. Đợt 4 là đợt ấy. Ba mục còn lại (hop-nhat 23px, hang-cho
tràn 1517px khi mở "Trả lại", `TableCell nowrap`) đều ghi *"trông như một dòng class"*.

## Quyết định thiết kế — chốt 29/08/2026

1. **Một token, mọi bề mặt**: `--muted-foreground` `#796952` → **`#6f5f47`** (cùng sắc nâu đất, tối
   hơn ~4%). Số học: bàn `#edeae4` **5.14:1** · ô trắng **6.17:1** · giấy dó `#f4ecd8` **5.38:1** —
   qua sàn ở cả ba, không cần scope riêng cho bề mặt B (một token hai giá trị là hai màu để nhớ).
   `DESIGN.md` chép ngược (`#7D6C55` → `#6F5F47`) — `specs/frontend-stack.md § 7`.
2. **`TableCell` bỏ `whitespace-nowrap`**, `TableHead` giữ (nhãn cột ngắn, xuống dòng là xấu). Ô bảng
   chứa văn xuôi do người gõ; nowrap mặc định là lý do 6-3 và 6-8 mỗi story vá một lần.
3. **Liên kết tên người ở hop-nhat**: `inline-flex min-h-11 items-center` — đúng dòng class debt ghi.
4. **Bảng nợ `da-biet.ts` XOÁ ba mục đã trả** (token · hang-cho · hop-nhat), giữ ba mục React Flow
   (quyết định giấy phép, không phải mã của dự án). Test soi đổi ca "đã biết" sang mục React Flow.

## Acceptance Criteria
1. `--muted-foreground` = `#6f5f47` ở `app/globals.css`; `DESIGN.md` bảng màu + YAML + §Hán-Nôm
   chép cùng giá trị, kèm ba con số tương phản.
2. `components/ui/table.tsx § TableCell` không còn `whitespace-nowrap`; `TableHead` giữ.
3. `app/admin/hop-nhat/page.tsx` liên kết tên người cao ≥ 44px (đo bằng `soi hop-nhat`).
4. `npm run soi` trọn bộ: **0 vi phạm mới**, nợ chỉ còn ba mục React Flow (3/3 mỗi mục).
5. `da-biet.ts` không còn mục token / hang-cho / hop-nhat; `da-biet.test.ts`, `ban-ke.test.ts` xanh.
6. `deferred-work.md` đánh dấu bốn mục đã trả (token 4.42 · hang-cho tràn · hop-nhat 23px ·
   `TableCell nowrap` của 6-3).
7. Năm cổng xanh. Không nút ghi mới ⇒ không thêm kịch bản `bam-thu`.

## Phạm vi — KHÔNG thuộc story này
- Ba mục React Flow (nhãn ghi công) — quyết định giấy phép, để nguyên.
- Không đổi màu nào khác; không chạm `--color-tin-loi-ke` dù DESIGN.md ghi cùng hex `#7D6C55` (nó là
  viền chip, không phải chữ; sàn 3:1 cho đồ hoạ — đạt).

## Tasks / Subtasks
- [x] **T1** Token + DESIGN.md (AC 1)
- [x] **T2** `TableCell` · hop-nhat link (AC 2, 3)
- [x] **T3** `da-biet.ts` + hai test soi (AC 5)
- [x] **T4** Build · restart dòng họ thử · `npm run soi` trọn bộ (AC 4) · deferred-work (AC 6) · cổng (AC 7)

## Dev Notes
- Đổi token ⇒ đổi `.next` ⇒ phải build và khởi động lại server đo trước khi soi.
- `tachDaBiet` khớp bằng `moTa.includes(khop)`; test hiện dùng `'4.42:1'` làm ca "đã biết" — đổi sang
  `'React Flow'` (mục còn lại), và `/2 \/ 185/` thành `/2 \/ 3/`.

### References
- [`deferred-work.md § 6-6` bốn mục · `§ 6-3` TableCell] · [`DESIGN.md § Colors`, `§ Accessibility Floor`]
- [`scripts/soi/da-biet.ts`, `scripts/soi/luat.ts § luatTuongPhan`]

## Dev Agent Record

### Agent Model Used
Claude Fable 5 · 29/08/2026.

### Ghi chép lượt dựng
- `npm run soi` trọn bộ sau build + khởi động lại dòng họ thử: **30 lượt · 0 vi phạm mới**; nợ chỉ còn
  ba mục React Flow (3/3 mỗi mục); revision 150 → 150. Bốn món nợ 6-6/6-3 biến mất khỏi bản kê —
  không phải vì nền nuốt (nền đã xoá ba mục), mà vì màn không còn vi phạm.
- Test `ban-ke.test.ts § nợ theo màn không nuốt…` bỏ: nó dựng trên một mục nợ THẬT của bảng, nay đã
  trả; luật ấy kiểm ở `da-biet.test.ts` bằng một nền tiêm vào (`tachDaBiet(ds, khoa, nen)`).
- Không nút ghi mới ⇒ không thêm kịch bản `bam-thu`.

### File List
- `app/globals.css` (token) · `_bmad-output/planning-artifacts/ux-designs/…/DESIGN.md` (ba chỗ)
- `components/ui/table.tsx` · `app/admin/hop-nhat/page.tsx`
- `scripts/soi/da-biet.ts` (xoá ba mục, `tachDaBiet` nhận nền) · `scripts/soi/da-biet.test.ts` · `scripts/soi/ban-ke.test.ts`
- `_bmad-output/implementation-artifacts/deferred-work.md` (bốn mục ✅)
