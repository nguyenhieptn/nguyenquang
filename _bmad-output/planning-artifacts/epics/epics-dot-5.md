# Epics & Stories — Gia phả Nguyễn Quang, Đợt 5

> Sinh 04/09/2026 từ một câu hỏi của chủ dự án sau review kiến trúc cùng ngày
> (`planning-artifacts/architecture/…/reviews/review-da-dong-ho-ca-nhan-2026-09-04.md`):
> *"có thể gửi link hay QR, người kia chỉ đăng nhập Google là kích hoạt được node đó không?"*
> Trạng thái SỐNG nằm ở `implementation-artifacts/sprint-status.yaml` — file này là cấu trúc.
> Đợt 1 (Epic 1–4) — `epics.md`. Đợt 2 (Epic 5) — `epics-dot-2.md`. Đợt 3 (Epic 6) — `epics-dot-3.md`.
> Đợt 4 (Epic 7) — `epics-dot-4.md`.

## Nguyên tắc cắt epic của đợt này

Đợt 2 cắt theo bề mặt (GHI), Đợt 3 theo động từ (SỬA), Đợt 4 theo động từ thứ ba (DÙNG). Đợt 5 cắt
theo động từ thứ tư: **MỜI** — cây lớn bằng người thật, do người trong họ đưa tay kéo vào.

Sau Đợt 4 cửa đã mở (7-6), nhưng bước vào vẫn là: tự tìm tên mình, xin chỗ, chờ một người có quyền
duyệt. Ba bước ấy đúng với người lạ. Với con cháu trong nhà, người đang cầm điện thoại đã biết
chính xác ai là ai — bảo lãnh (AD-8) có thể làm **trước**, và cái vé ấy chính là đường ngắn nhất
để cây có người thật.

Cùng ngày, chủ dự án chốt hai điều để đợt này không lệch: **(1)** hướng dài hạn là *mỗi người dùng
tự tạo cây nhà mình*, nhiều dòng họ trên một hệ thống, nhưng **chưa triển khai** — chỉ dựng sẵn nền
(review § 5); **(2)** mọi bàn luận về khớp và gộp giữa các dòng họ **gác lại** tới khi có dữ liệu.
Đợt này vì thế nằm gọn trong **một dòng họ**, và mời bằng liên kết cũng là cách người mới nhập vào
cây đã có thay vì tự dựng một cây trùng — không cần bộ khớp nào.

---

## Epic 8 — Mời

| Story | Tên | FR | AD chính |
|---|---|---|---|
| 8-1 | `8-1-moi-bang-lien-ket` — **vé mời**: người trong họ đã có chỗ tạo một liên kết + mã QR cho một người thân **còn sống, đã có trên cây, chưa có tài khoản**; người ấy đăng nhập (Google hoặc tài khoản riêng), xác nhận **một câu** *"Mình là …?"*, và tài khoản gắn thẳng vào chỗ ấy với người bảo lãnh là người gửi vé — không qua hàng chờ. Vé băm khi lưu, hạn 7 ngày, dùng một lần, thu hồi được; một node chỉ một tài khoản đang hoạt động | FR-64, FR-55, FR-11 | AD-8, AD-10, AD-13, AD-24 |

### Ứng viên chưa chốt (ghi để không ai tưởng là quên)

- **8-2** *thêm-và-mời một bước*: sau "Thêm người thân" có ngay nút gửi vé cho người vừa thêm.
  Nhỏ, đi sau 8-1 khi vé đã có hình.
- **Xem cây tại một thời điểm** (nửa sau FR-39, `getTreeAt` có ops, chưa màn) — SHOULD từ Đợt 4.
- **Tên miền + TLS** — không phải story, việc của chủ dự án (action item Đợt 4); Google chỉ nhận
  redirect `https://`. 8-1 không phụ thuộc: vé dùng được với tài khoản riêng ngay hôm nay.

---

## Ràng buộc mang theo từ spine (mọi story phải giữ)

- **AD-1 / AD-24** — `app/` chỉ import `@/core/<module>`; core tự đọc phiên.
- **AD-4 / AD-10** — không xoá; mọi mutation ghi `revision` cùng transaction. Vé thu hồi hay đã
  dùng là đổi trạng thái, không phải xoá hàng.
- **AD-8** — vé mời là **bảo lãnh trước**: `vouchedByAttachmentId` = gắn kết của người tạo vé.
- **AD-13 / AD-21** — ai được mời ai tính bằng tầm nhìn: người mời phải thấy người ấy **trọn**.
- **AD-20** — bảng mới có RLS ép + policy fail-closed, vào `PARTITIONED_TABLES`; gate tự canh.
- **Cổng chỉ có hai tên** (7-1) — không so `role` trong core ngoài `gates.ts`; lens là
  `coQuyenDuyet`, tầm nhìn là `visibilityFor`.
- **Sáu cổng** trước "done": `npm run lint` · `tsc` · `vitest` · `build` · `npm run soi` ·
  `npm run bam-thu` trên dòng họ thử; kịch bản mới **chạy hai lần liên tiếp** (action item retro 7).
- **Ba lớp review**; defer vào `deferred-work.md` có tên story.

## Nền dựng sẵn cho hướng dài hạn (review 04/09 § 5) — áp cho story này

- Bảng `invitation` mang `clan_id`, UUIDv7, không khoá ngoại xuyên dòng họ.
- Không thêm người đọc `soleClanId`; route `/moi/[ma]` lấy dòng họ từ phiên/khách như mọi route.
- Link dựng ở một chỗ (`duongMoi(ma)`), để chèn slug sau này là sửa một chỗ.

## Vẫn hoãn có chủ đích

Đa dòng họ, khớp node xuyên dòng họ, gộp mảnh, thực thể cá nhân — gác (review 04/09 § 6). Kênh đẩy
ngoài web (FR-60) — bỏ từ 10/08. Sao lưu off-host — chốt bỏ 26/08.
