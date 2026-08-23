# Epics & Stories — Gia phả Nguyễn Quang, Đợt 1

> Sinh 22/08/2026 từ `prd.md` §5 (15 FR) + `ARCHITECTURE-SPINE.md` + `EXPERIENCE.md`.
> Trạng thái SỐNG nằm ở `_bmad-output/implementation-artifacts/sprint-status.yaml` — file này
> là cấu trúc, không phải trạng thái.

## Nguyên tắc cắt epic

Cắt theo **tầng kiến trúc rồi theo bề mặt**, đúng thứ tự phụ thuộc của spine:
nền dữ liệu (core + db là thứ mọi màn gọi vào) → bề mặt A (người trong họ) →
bề mặt B (bàn duyệt) → vận hành. Mỗi story là một lát dọc giao được, có bài kiểm chứng.

---

## Epic 1 — Nền móng dữ liệu & lõi miền

Toàn bộ `db/` + `core/` — thứ AD-1 buộc mọi adapter đi qua. Không có UI trong epic này.

| Story | Tên | FR | AD chính |
|---|---|---|---|
| 1-1 | `1-1-ha-tang-db-rls` — Docker Postgres 18, Drizzle, schema, RLS ép buộc + 2 cổng phát hành | nền | AD-6, AD-7, AD-14, AD-20 |
| 1-2 | `1-2-khang-dinh-va-nguoi` — person + assertion: nguồn, 3 mức tin cậy, 2 tầng, chiếu giá trị | FR-1, FR-2, FR-3 | AD-2, AD-4, AD-9, AD-10, AD-17, AD-18, AD-19 |
| 1-3 | `1-3-cay-dan-xuat` — mảnh, gốc tạm, số đời + mã chi tính lúc đọc, đường lên cụ xa nhất | FR-63, FR-13, FR-15 | AD-5, AD-6, AD-18 |
| 1-4 | `1-4-danh-tinh-va-quyen` — Better Auth (mật khẩu; Google/FB để sau theo PRD §10), gắn node, vai, bán kính riêng tư | FR-64, FR-37, FR-55 | AD-8, AD-13, AD-15, AD-21, AD-24 |
| 1-5 | `1-5-loi-ke-va-media` — thu/lưu lời kể, mức tiếp cận, cổng lưu trữ (local adapter, S3-ready) | FR-47, FR-49 | AD-11, AD-12 |
| 1-6 | `1-6-nhat-ky-va-tai-hien` — nhật ký sửa, xem cây tại thời điểm quá khứ | FR-39 | AD-10, AD-4, AD-21 |
| 1-7 | `1-7-hop-nhat-manh` — đề xuất/thi hành/tách lại, tombstone, cần quyền duyệt | FR-48 | AD-3, AD-22, AD-16 |
| 1-8 | `1-8-nap-khung-csv` — parse CSV mẫu, so khớp (tái dùng `core/so-khop`), preview, ghi hàng loạt vào tồn nghi | FR-51 | AD-9, AD-16 |

## Epic 2 — Bề mặt A: người trong họ (mobile-first)

Mỗi màn theo `EXPERIENCE.md § IA bề mặt A`. Nhiều màn đã có bản dựng trong git history
(`8fd4af1^`) — phục sinh rồi promote, thay mock bằng lời gọi `core/`.

| Story | Tên | FR |
|---|---|---|
| 2-1 | `2-1-trang-chu` — màn chủ "dòng họ đang sống": 2 ô (đường lên cụ + vừa vào phả) | FR-13, FR-39 |
| 2-2 | `2-2-dang-nhap-gan-node` — đăng nhập/tạo tài khoản, gắn vào node có bảo lãnh | FR-64 |
| 2-3 | `2-3-tu-khai-bon-buoc` — một câu hỏi một màn, ≤ 4 màn ≤ 3 phút | FR-11 |
| 2-4 | `2-4-tim-va-khong-tim-thay` — tìm không dấu, màn "không tìm thấy" bày người gần giống | FR-11, FR-48 |
| 2-5 | `2-5-them-nguoi-than` — ghi thẳng vào tồn nghi, ghi công người thêm | FR-3, FR-55 |
| 2-6 | `2-6-cay-ba-tang` — cả tộc (khối chi) / một chi (gập theo đời) / đường của tôi | FR-15, FR-63 |
| 2-7 | `2-7-trang-nguoi` — trang một người: khẳng định + nguồn + chip tin cậy + lịch sử | FR-1, FR-2, FR-37, FR-39 |
| 2-8 | `2-8-thu-loi-ke` — ghi âm trên web, đồng thuận trong luồng thu | FR-47, FR-49 |
| 2-9 | `2-9-toi-va-quyen` — trang "Tôi": sửa về mình, ẩn khỏi công khai, từ chối bản in | FR-55, FR-64 |

## Epic 3 — Bề mặt B: bàn duyệt (desktop)

| Story | Tên | FR |
|---|---|---|
| 3-1 | `3-1-nap-khung` — tải mẫu CSV + tải file lên | FR-51 |
| 3-2 | `3-2-xem-truoc-so-khop` — bảng xem trước, cảnh báo chèn trong dòng, bộ lọc "Cần xem lại" | FR-51, FR-48 |
| 3-3 | `3-3-hang-cho-duyet` — duyệt lên Tầng chính thức | FR-3 |
| 3-4 | `3-4-hop-nhat-manh` — gợi ý trùng, gộp có quyền, tách lại được | FR-48 |

## Epic 4 — Vận hành & phát hành

| Story | Tên | Gắn với |
|---|---|---|
| 4-1 | `4-1-trien-khai-vpn` — build production, chạy trên IP Tailscale, script một lệnh | NFR-3 |
| 4-2 | `4-2-sao-luu` — pg_dump + media hằng ngày, giữ 90 ngày, doc khôi phục | NFR-1, AD-25 |
| 4-3 | `4-3-ra-soat-chat-luong` — review đối kháng: RLS gate, AD-1, sàn chữ 17px, code review | AD-20 |
| 4-4 | `4-4-tai-lieu-van-hanh` — tài liệu tiếp quản 1 ngày | NFR-3, NFR-4 |

---

## Ràng buộc mang theo từ spine (mọi story phải giữ)

- `app/` không import db client/ORM/storage SDK — chỉ `core/` (AD-1).
- Core đọc danh tính từ session, không nhận clan/viewer/vai làm tham số (AD-24).
- Số đời, mã chi không bao giờ lưu — tính lúc đọc (AD-5).
- Mọi mutation ghi revision trong cùng transaction (AD-10).
- Cái ngoài bán kính riêng tư **không gửi tới client** (AD-13/21), không cache thứ phụ thuộc người xem (AD-23).
- Không hard-code gì riêng của họ Nguyễn Quang trong `core/`/`db/` (AD-14).
- Sàn chữ 17px / tối thiểu 15px / vùng chạm 44px / không xưng hô kể cả "bạn" (EXPERIENCE.md).
- Son `#A8322A` chỉ cho "đã chốt"; cảnh báo dùng chàm `#2E4B6B` (DESIGN.md).

## Hoãn có chủ đích (ghi để không ai tưởng là quên)

- Google/Facebook OAuth: cấu trúc sẵn trong Better Auth, bật khi có credentials (PRD §10 cho phép).
- Object storage off-host (R2): cổng lưu trữ trừu tượng hoá sẵn, adapter local cho tới khi có credentials — **chưa đạt AD-11 đầy đủ**, ghi ở story 4-2.
- Huy hiệu React Flow: giữ (không mua Pro).
- TypeScript giữ 5.9 (spine pin 7.0.2 — lệch ghi nhận tại `specs/frontend-stack.md` §6, chốt 5.9 cho Đợt 1).
