---
baseline_commit: 8f263f8
---

# Story 7.5: Ngày giỗ âm lịch — chép lấy ngày nhà đã dùng, chỉ gợi ý khi chưa có

Status: review

## Story

Là **người trong họ**,
tôi muốn **ghi ngày giỗ (âm lịch) của người đã khuất như nhà vẫn cúng, thấy ngày giỗ ấy rơi vào ngày
dương nào năm nay, và mở một lịch giỗ của cả họ — sắp tới trong bảy ngày ở trang chủ, cả năm ở một
trang riêng**,
để **thứ dòng họ mở phả ra xem nhiều nhất (FR-41, SHOULD từ Đợt 2, hoãn hai lần) có mặt — mà hệ
không bao giờ đi nói với các cụ rằng ngày giỗ nhà mình lâu nay là sai**.

## Bối cảnh

`review-culture.md:677`: *"Nếu trong nhà đã có ngày giỗ dùng bao đời nay, hệ thống chép lấy ngày đó,
không tính lại và tuyệt đối không 'sửa' nó. Quy đổi chỉ dùng để gợi ý khi chưa có ngày, và luôn hiện
cả hai (âm và dương) kèm nguồn."* Addendum 10/08: không còn kênh đẩy (bỏ Zalo) — lịch hiện trên web.
`addendum § A.4` dự kiến `amlich.js` (Hồ Ngọc Đức); Đợt 2 và 3 hoãn *chỉ vì* rủi ro thư viện đổi lịch.

## Quyết định thiết kế — chốt 29/08/2026

1. **Ngày giỗ là một KHẲNG ĐỊNH** (`kind: 'gio'`, value `{ thang, ngay, nhuan }` âm lịch) như mọi
   khẳng định: tồn nghi trước (AD-9), có nguồn, chồng được, ẩn/loại được, mâu thuẫn khi hai ngày
   khác nhau (đơn trị). Không phải cột chiếu: người ta không lọc cây theo giỗ.
2. **Phép đổi lịch là hàm THUẦN** trong `core/lich/am-lich.ts` (thuật toán Hồ Ngọc Đức 2004, múi +7),
   không kéo thư viện; test đối chiếu với các mốc đã biết (Tết 2024/2025/2026, Giỗ Tổ 10/3, Trung thu
   15/8, tháng nhuận 2025). Sai một mốc là đỏ.
3. **Gợi ý, không tự ghi**: người có ngày mất CHÍNH XÁC tới ngày (`precision: 'exact'`) và chưa có
   giỗ ⇒ phiếu bày hàng *Giỗ* với câu *"chưa ghi — theo ngày mất dd/mm/yyyy thì là ngày N tháng M âm
   lịch"* và nút *Ghi ngày giỗ này* (mở biểu mẫu đã điền sẵn, vẫn phải chọn nguồn và bấm ghi). Nhà
   dùng ngày khác thì gõ ngày khác — hệ không cãi.
4. **Lịch giỗ** ở `core/gio`: mọi giỗ sống của người đã khuất, quy ra ngày dương KẾ TIẾP kể từ hôm
   nay (năm âm này hoặc năm sau; tháng nhuận không có năm ấy thì lấy tháng thường; ngày 30 của
   tháng thiếu thì lùi về 29). Người đã khuất là `'full'` với mọi người xem (AD-13) — lịch công khai.
   Trang `/gio` (bề mặt A, khách xem được) bày cả năm theo tháng âm; trang chủ có ô *Giỗ sắp tới*
   (7 ngày, tối đa 5 dòng).
5. Biểu mẫu ghi thêm nhận chuỗi `ngày/tháng` (`15/8`, `15/8 nhuận`) — một ô, gõ như người ta nói.

## Acceptance Criteria
1. `core/lich/am-lich.ts`: `duongSangAm`, `amSangDuong`, `gioKeTiep` — test thuần đối chiếu ≥ 8 mốc.
2. `kind: 'gio'` đi qua mọi bảng đủ (`DON_TRI`/`HANG`/`NHAN`, `valueText`, `describeAssertionValue`,
   `describeAssertion` audit, `LOAI_GHI_THEM`) — `tsc` gác; ghi qua `addAssertion` với kiểm
   `1 ≤ thang ≤ 12`, `1 ≤ ngay ≤ 30`.
3. Phiếu (cả hai bề mặt): chồng *Giỗ* bày "ngày N tháng M (nhuận) âm lịch — năm nay: dd/mm/yyyy";
   hàng gợi ý khi đủ điều kiện (3); ghi từ biểu mẫu với chuỗi `ngày/tháng`.
4. `core/gio.listGioSapToi({ soNgay })`: đúng ngày dương kế tiếp; người còn sống không vào lịch; test thật.
5. `/gio` (khách xem được) và ô *Giỗ sắp tới* ở trang chủ; `soi gio trang-chu` 0 vi phạm mới (390px).
6. `bam-thu` K5: thành viên ghi ngày giỗ cho Tổ từ phiếu ⇒ phiếu bày "giỗ ngày 15 tháng 8"; revision +2.
7. Năm cổng + bam-thu; `epics-dot-4`/PRD không cần sửa; `deferred-work` không phát sinh ngoài review.

## Phạm vi — KHÔNG thuộc story này
- Nhắc qua kênh ngoài web (bỏ từ 10/08). Văn khấn gợi ý. Giỗ theo dương lịch (Công giáo) — ghi ở
  `deferred-work` nếu review đòi.

## Tasks / Subtasks
- [x] **T1** `core/lich` + test (AC 1)
- [x] **T2** `kind: 'gio'` xuyên core: schema · spec · ops · chong · read-ops · audit (AC 2)
- [x] **T3** Gợi ý ở `getPersonOps` → `HoSoNguoi.goiYGio` → phiếu; biểu mẫu `ngày/tháng` (AC 3)
- [x] **T4** `core/gio` + test; `/gio`; ô trang chủ; `dang-ky.ts` (AC 4, 5)
- [x] **T5** K5; cổng; soi (AC 6, 7)

## Dev Notes
- `HANG` là số thứ tự: chèn `gio: 4` và dời bốn loại sau lên một.
- `PersonProfile` thêm `goiYGio?`; `docHoSo` chuyển tiếp; `HoSoPanel.goiYGio?`.
- Trang chủ `app/(pha)/page.tsx` rail phải: thêm ô trên "Vừa vào phả" — dùng `TuaMuc`.

### References
- [PRD FR-41 · `review-culture.md:677` · addendum § A.4] · [Hồ Ngọc Đức, *Âm lịch Việt Nam*, 2004]
- [`core/assertion/ops.ts § addAssertionOp`, `§ describeAssertionValue`] · [`core/person/chong.ts`]

## Dev Agent Record

### Agent Model Used
Claude Fable 5 · 29/08/2026.

### Ghi chép lượt dựng
- Thuật toán đổi lịch chép tay đúng ngay lượt đầu: 10/10 mốc lịch bloc qua (Tết ba năm, Giỗ Tổ hai
  năm, Trung thu hai năm, tháng 6 nhuận 2025, 30 Tết tháng thiếu). Mốc duy nhất đỏ là mốc TÔI đoán
  sai (tháng 8 Ất Tỵ có 29 ngày, không phải 30) — hàm đúng, người viết test sai; sửa mốc.
- `kind: 'gio'` đi qua sáu bảng đủ (`tsc` bắt từng chỗ, kể cả `LOAI_GHI_THEM.test` đếm "tám loại").
- K5 lượt đầu chọn Chú — cách Mình BA bậc, ngoài canvas mặc định của thành viên; đổi sang Tổ (hai
  bậc, đã khuất, đã có giỗ 15/8 ⇒ ghi 12/9 là chồng Giỗ hoá mâu thuẫn — đúng hình cần bày).
- Dòng họ thử thêm: Tổ giỗ 15/8; Xa mất chính xác 06/10/2000 (gợi ý 15/8 trên phiếu). Cả `:3200`
  và `:3300` xoay clan mới.
- `soi gio trang-chu gia-pha cay nguoi` 6 lượt 0 vi phạm mới; `bam-thu` K1–K5 5/5.

### File List
- `core/lich/{am-lich,am-lich.test,index}.ts` (mới) · `core/gio/{ops,index,gio.test}.ts` (mới)
- `db/schema/domain.ts` (`'gio'`) · `core/assertion/index.ts` (spec) · `core/assertion/ops.ts` (kiểm, ghi, câu)
- `core/person/chong.ts` (DON_TRI/HANG/NHAN) · `core/person/chong.test.ts` · `core/person/read-ops.ts` (câu hai lịch, `goiYGio`) · `core/person/index.ts` · `core/tree/ops.ts` (`deathPrecision`) · `core/audit/ops.ts`
- `components/admin/loai-ghi-them.ts` (+test) · `components/admin/bieu-mau-ghi-them.tsx` (`giaTriBanDau`, ô giỗ) · `components/admin/cot-khang-dinh.tsx` (hàng Giỗ gợi ý)
- `lib/ghi-pha.ts` · `app/admin/cay/cay-client.tsx` · `app/(pha)/gia-pha/_quanh-minh/quanh-minh-client.tsx`
- `app/(pha)/gio/page.tsx` (mới) · `app/(pha)/page.tsx` (ô Giỗ sắp tới) · `scripts/soi/dang-ky.ts` · `core/gates/dong-ho-thu.ts` · `scripts/bam-thu/kich-ban.ts` (K5)
