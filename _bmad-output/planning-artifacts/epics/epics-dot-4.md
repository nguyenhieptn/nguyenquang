# Epics & Stories — Gia phả Nguyễn Quang, Đợt 4

> Sinh 29/08/2026 từ retrospective Epic 6
> (`_bmad-output/implementation-artifacts/epic-6-retro-2026-08-29.md`), chủ dự án chốt hướng cùng
> ngày: *"chạy sprint-planning viết epics-dot-4, chủ động triển khai toàn bộ công việc đợt"*.
> Trạng thái SỐNG nằm ở `implementation-artifacts/sprint-status.yaml` — file này là cấu trúc.
> Đợt 1 (Epic 1–4) — `epics.md`. Đợt 2 (Epic 5) — `epics-dot-2.md`. Đợt 3 (Epic 6) — `epics-dot-3.md`.

## Nguyên tắc cắt epic của đợt này

Đợt 2 cắt theo **một bề mặt** (GHI). Đợt 3 cắt theo **một động từ** (SỬA). Đợt 4 cắt theo động từ
thứ ba: **DÙNG** — dùng thật, bởi người thật, trên phả thật.

Lý do nằm ở hai dòng của retro Epic 6:

> *Bề mặt thành viên chưa có một người thật nào đăng nhập.*
> *Hai story hay nhất của Đợt 3 (6-9, 6-10) đều sinh ra từ một lượt dùng thật của chủ dự án, không
> từ bảng nợ.*

Sau ba đợt, hệ ghi được, sửa được, đo được, và có ≈150 patch review đứng sau. Thứ nó chưa có là
**người**: cánh cửa cho thành viên vào, lời hứa *"giá trị bị loại vẫn nằm trong nhật ký"* mà ba màn
đang nói nhưng không ai đọc được, cái nút ẩn mà AD-17 cho phép từ Đợt 1, và **ngày giỗ** — thứ dòng
họ mở phả ra xem nhiều nhất, SHOULD từ Đợt 2, hoãn hai lần *chỉ vì* rủi ro thư viện đổi lịch.

Đợt này cũng là đợt đầu tiên **mở bằng hàng rào**: hai lỗi lọt năm cổng xanh ở cuối Đợt 3 (cổng bị
chép lại, chú thích nói "chặn" mà không chặn) có bài học rõ — *bằng chứng phải sinh từ cùng nguồn
với sản phẩm* — và bài học ấy thành mã ở story đầu tiên, để phủ năm story còn lại.

Việc chủ dự án chưa làm (B1 — bấm thử trên phả thật) **không** thành story: nó là việc của người,
và đợt này dựng cả kịch bản ghi có mắt để lần bấm ấy có gì để so.

---

## Epic 7 — Dùng thật

| Story | Tên | FR | AD chính |
|---|---|---|---|
| 7-1 | `7-1-hang-rao-tu-retro` — **hàng rào thành mã**: lint cấm chép cổng trong `core/**` (chỉ `gateWriter`/`gateApprover`); **kịch bản GHI có mắt** trên dòng họ thử (Playwright bấm nút ghi thật, đọc lại câu xác nhận, so revision) — lớp mà `soi` (chỉ đọc) và test adapter (không có màn) đều không phủ; script tự từ chối chạy trên phả thật | NFR-5 | AD-4, AD-20, AD-24 |
| 7-2 | `7-2-tra-no-san` — trả nợ SÀN nhìn thấy, đo được: `--muted-foreground` trên nền bàn 4.42:1 (185 chỗ, **một token**, kèm sửa `DESIGN.md`), 8 liên kết 23px ở `/admin/hop-nhat`, bảng tràn 1517px ở `/admin/hang-cho` khi mở "Trả lại", `TableCell` mang `whitespace-nowrap`. Bảng nợ `da-biet.ts` thu lại, không xoá | Accessibility Floor | AD-20 |
| 7-3 | `7-3-an-theo-bao-cao` — nút **Ẩn theo báo cáo** ở phiếu (AD-17: một lượt báo cáo ẩn ngay, không cần duyệt; `hideAssertion` có từ Đợt 1, chưa nút nào gọi) ở CẢ HAI bề mặt; và **Loại** cho `place`/`note` ở bề mặt B (nợ 6-1: ghi nhầm một quê quán thì không gỡ được) | FR-49, FR-55, FR-3 | AD-17, AD-4 |
| 7-4 | `7-4-so-nhat-ky` — **Sổ nhật ký** ở bàn làm việc: mọi `revision` của dòng họ, theo thời gian, lọc theo người / loại thực thể / hành động; giá trị bị loại, bị ẩn **đọc lại được** — ba màn đang hứa câu ấy mà `core/audit` chưa màn nào gọi; đọc cả `entity='place'` (nợ 6-4) | **FR-39** | AD-4, AD-10, AD-13 |
| 7-5 | `7-5-ngay-gio-am-lich` — **ngày giỗ**: khẳng định `gio` (tháng/ngày âm, nhuận) chép lấy ngày nhà đã dùng; **gợi ý** từ ngày mất dương khi đủ chính xác, luôn hiện cả hai kèm nguồn, không bao giờ "sửa" ngày nhà; **lịch giỗ** sắp tới trên trang chủ (7 ngày) và một trang lịch cả năm; phép đổi lịch là hàm THUẦN có test đối chiếu | **FR-41** | AD-9, AD-19, AD-13 |
| 7-6 | `7-6-mo-cua` — **mở cửa cho người trong họ**: màn duyệt nói rõ *tài khoản nào* đang xin (nợ 5-5); thành viên **không ghi lên người mình không thấy tên** (nợ 6-10, quyết định: ẩn danh thì không có nút ghi); `loading.tsx` của `/gia-pha` theo hình mới; tài liệu bật Google login (code sẵn, cần `GOOGLE_CLIENT_ID/SECRET` — việc của chủ dự án) | FR-64, FR-55 | AD-8, AD-13, AD-21 |

### Thứ tự và lý do

**7-1 trước mọi thứ** — hai hàng rào phủ năm story sau. **7-2 kế** — rẻ, đổi một token, và làm sớm
để bảng nợ `da-biet.ts` đứng yên suốt phần còn lại của đợt. **7-3 → 7-4** — ẩn và loại sinh ra dòng
nhật ký, sổ nhật ký đọc chúng; đúng thứ tự thì 7-4 có dữ liệu thật để bày. **7-5** là story lớn
nhất, đi sau khi hàng rào và sổ đã có. **7-6 cuối** — nó cần một quyết định của chủ dự án (Google
OAuth) mà phần mã không phụ thuộc.

### Vì sao mỗi story tồn tại — một đoạn, không hơn

**7-1.** `listConflictsOps` chép lại ba dòng cổng và lặp đúng lỗi `gateWriter` được sửa cùng ngày;
`mergePlaceOps` viết *"đây là hàng rào chống chuỗi"* mà chỉ chặn một chiều. Cả hai đi qua `tsc` ·
`eslint` · 549 test · `build` · `soi`. Hàng rào phải là thứ **máy đọc**: một luật lint (cổng chỉ có
hai tên) và một lớp kiểm mà hai lớp hiện có không chạm — bấm nút ghi thật rồi đọc lại màn.

**7-2.** 92% vi phạm của lượt đo đầu là MỘT token. Bảng nợ ghi *"việc của người đặt ra bảng màu"* —
đợt này là người ấy: đổi token cho bề mặt B, sửa `DESIGN.md`, kiểm số học (≥ 4.5:1 trên `#edeae4`
và trên ô trắng), rồi hạ `toiDa` về 0. Ba mục còn lại đều "trông như một dòng class".

**7-3.** AD-17 tồn tại từ Đợt 1: *"một lượt báo cáo ẩn ngay, không cần duyệt; khôi phục cần quyền
duyệt"*. Hàm có, hàng chờ đã có khu *"đã ẩn theo báo cáo"* — chỉ thiếu **cái nút**. Thành viên vào
thật sẽ ghi nhầm, và sẽ thấy thứ làm họ đau; cả hai cần cùng một nút.

**7-4.** Ba màn (phiếu, màn Mâu thuẫn, màn Nơi chốn) nói *"vẫn nằm trong nhật ký"*. Nhật ký có thật
(`revision`, AD-10 cùng transaction), `core/audit` có `getPersonHistory` cho một người — nhưng
không có sổ chung, không đọc `place`, và giá trị bị loại chỉ hiện dưới dạng một câu tóm tắt. FR-39
đòi *"từ giá trị nào sang giá trị nào"*.

**7-5.** `review-culture.md:677`: *"Nếu trong nhà đã có ngày giỗ dùng bao đời nay, hệ thống chép
lấy ngày đó, không tính lại và tuyệt đối không 'sửa' nó. Quy đổi chỉ dùng để gợi ý khi chưa có
ngày, và luôn hiện cả hai (âm và dương) kèm nguồn."* Ngày giỗ là một **khẳng định** như mọi khẳng
định (AD-9): tồn nghi trước, có nguồn, chồng được. Phép đổi lịch (thuật toán Hồ Ngọc Đức, đã
công bố) viết thành hàm thuần trong `core/lich`, không kéo thư viện; test đối chiếu với bảng ngày
đã biết. Không có kênh đẩy (addendum 10/08: bỏ Zalo) — lịch hiện trên web, người thật nhắc nhau.

**7-6.** Phả thật có đúng một tài khoản gắn kết. Khi người thứ hai xin vào, người duyệt phải biết
*ai* đang xin — `PendingAttachment.accountName` đã có chỗ mà màn chưa bày đủ. Và trên bề mặt thành
viên, thẻ *"Một người trong họ"* (ngoài bán kính) đang có nút *Thêm người quanh đây*: quyết định
của đợt này là **không thấy tên thì không ghi lên** — ghi là một hành vi có địa chỉ, và địa chỉ
ấy đang được giữ kín vì một lý do (FR-55).

---

## Ràng buộc mang theo từ spine (mọi story phải giữ)

- **AD-1** — `app/` chỉ import `@/core/<module>`; lint cấm `@/db`, drizzle, `*/ops` ngoài core.
- **AD-4 / AD-10** — không xoá; mọi mutation ghi `revision` cùng transaction. Ẩn (7-3) và loại là
  đổi `status`, không phải xoá hàng.
- **AD-9 / AD-19** — ngày giỗ (7-5) là khẳng định, tồn nghi trước; cột chiếu (nếu có) tính từ
  khẳng định, không ghi thẳng.
- **AD-13 / AD-21** — sổ nhật ký (7-4) và lịch giỗ (7-5) đi qua bán kính riêng tư TRƯỚC khi rời
  core; người ngoài bán kính vắng mặt, không "bị che".
- **AD-17** — ẩn không cần quyền duyệt; khôi phục cần.
- **AD-24** — core tự đọc phiên; adapter không truyền danh tính.
- **Năm cổng** trước "done": `npm run lint` (đầy đủ) · `tsc` · `vitest` · `build` · `npm run soi`
  trên dòng họ thử — và từ 7-1, kịch bản ghi có mắt cho story nào có nút ghi mới.
- **Ba lớp review** cho mọi story (Blind Hunter · Edge Case · Acceptance Auditor); patch qua lại
  năm cổng; defer vào `deferred-work.md` có tên story.
- **Bằng chứng cùng nguồn**: test ngữ cảnh phiên dựng từ `dungDongHoThu()`, không gõ tay
  `SessionContext`; chú thích "chặn / gác / không bao giờ" phải chỉ tới một test cùng tên.

## Lằn ranh giữ nguyên từ Đợt 3

- Bảng tính ⇄ phả: `/admin` là nguồn sự thật sau 26/08; không gieo lại (xem `epics-dot-3.md`).
- Bộ đo (`soi`) **chỉ đọc**; kịch bản ghi (7-1) chỉ chạy khi clan ghim là dòng họ thử — script tự
  từ chối nếu tên clan không bắt đầu bằng "Dòng họ thử".

## Nợ Đợt 3 mang sang — và story nào gánh

| Nợ (deferred-work.md) | Gánh |
|---|---|
| `hideAssertion` trong panel (5-3) | 7-3 |
| `place`/`note` ghi được mà không gỡ được (6-1) | 7-3 |
| Nhật ký nơi chốn chưa có người đọc (6-4) | 7-4 |
| Màn duyệt chưa nói tài khoản nào đang xin (5-5) | 7-6 |
| Người ẩn danh trên bề mặt thành viên vẫn ghi lên được (6-10) | 7-6 |
| `loading.tsx` của `/gia-pha` nhịp theo hình cũ (6-10) | 7-6 |
| `--muted-foreground` 4.42:1 · hop-nhat 23px · hang-cho tràn · `TableCell nowrap` (6-6, 6-3) | 7-2 |
| Lint cấm chép cổng · kịch bản ghi có mắt (retro 6, B2/B4) | 7-1 |

Các mục nợ còn lại (~40, phần lớn nhỏ) **kéo vào theo story nào chạm tới**, không gom thành story
dọn nợ.

## Sau epic này (ghi để không ai tưởng là quên)

**SHOULD** — xem lại cây tại một thời điểm (`getTreeAt` có ops, chưa màn; nửa sau của FR-39) ·
tên phân loại huý/tự/hiệu/thụy · an táng ba loại · số trên thanh việc đếm theo `revision` khi phả
lớn (đo trước) · người ẩn danh: quyền "được biết khi mình được thêm vào" (FR-55) — cần thông báo.

**COULD** — hàng thứ · học vị–chức tước–nghề · suy đời + soát ngược · quản lý lời kể
(`updateRecordingAccess`, `withdrawRecording`) · điều hướng canvas theo nơi · tên miền + TLS (PRD Q6,
chỉ khi có người ngoài VPN).

## Vẫn hoãn có chủ đích

Vai vợ chính/kế/thứ · giờ sinh · hướng táng — vẫn là một cuộc bàn, không phải vé. Kênh đẩy ngoài
web (FR-60) — bỏ từ 10/08. Sao lưu off-host — chốt bỏ 26/08.
