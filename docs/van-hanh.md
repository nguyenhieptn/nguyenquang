# Vận hành — Gia phả Nguyễn Quang

> NFR-3: tài liệu này phải đủ để một người khác tiếp quản trong **1 ngày**.
> Không có bước thủ công nào chỉ một người biết — nếu phát hiện thiếu, đó là bug của tài liệu.

## Bức tranh 5 phút

- **Ứng dụng**: Next.js 16 (thư mục này), chạy production bằng `next start` trên IP Tailscale.
- **Database**: PostgreSQL 18 trong Docker (`giapha-db`, cổng `127.0.0.1:5438` — không bao giờ lộ ra ngoài máy).
- **Media** (băng ghi âm lời kể): file trên đĩa tại `var/media/` (tạm — xem § Việc còn nợ).
- **Bí mật**: tất cả trong `.env` (không commit). Mẫu: `.env.example`.
- **Kiến trúc**: đọc `_bmad-output/planning-artifacts/architecture/.../ARCHITECTURE-SPINE.md`.
  Luật quan trọng nhất: mọi truy cập dữ liệu đi qua `core/`; RLS bắt buộc ở tầng database.

## Các lệnh

| Việc | Lệnh |
|---|---|
| Dựng / khởi động lại database | `docker compose up -d` |
| Triển khai (build + chạy trên VPN) | `./scripts/deploy.sh` |
| Restart nhanh không build | `./scripts/deploy.sh --no-build` |
| Dừng web | `./scripts/deploy.sh --stop` |
| Sao lưu (db + media) | `./scripts/backup.sh` |
| **Diễn tập khôi phục** (≥1 lần/năm — NFR-1) | `./scripts/backup.sh --restore var/backups/db-<...>.dump` |
| Chạy toàn bộ test + cổng RLS | `npm test` |
| Migration schema | `npm run db:generate -- --name <tên>` rồi `npm run db:migrate` |
| Khởi tạo dòng họ + tài khoản quản trị đầu tiên | `npx tsx scripts/bootstrap-clan.ts --admin <email> <mật khẩu> "<Họ tên>"` |

Log web: `var/log/giapha.log`. PID: `var/run/giapha.pid`.

## Ngày đầu tiếp quản — checklist

1. Được thêm vào máy chủ (SSH) và vào tailnet Tailscale của dòng họ.
2. Đọc file này + `docs/build-contract.md` (30 phút).
3. Chạy `npm test` — tất cả phải xanh, đặc biệt `core/gates/` (cô lập dữ liệu).
4. Chạy `./scripts/backup.sh` rồi `--restore` bản vừa tạo — tự tay xác nhận khôi phục được.
5. Nhận quyền: tài khoản của bạn cần attachment vai `admin` (người quản trị cũ gán, hoặc chạy
   lại bootstrap script với cờ `--admin`).

## Việc còn nợ (trung thực — đừng để người sau tự phát hiện)

| Nợ | Hệ quả | Lối ra |
|---|---|---|
| Bản sao lưu nằm **cùng máy** với production | Cháy máy = mất cả hai (vi phạm AD-25) | Mở bucket R2/B2 bằng quỹ họ, thêm `rclone copy` vào cuối `backup.sh` |
| Media trên đĩa local, chưa off-host | Như trên, với dữ liệu KHÔNG tái tạo được | Cùng bucket trên; `core/media/storage.ts` đã chừa sẵn cổng S3 |
| Google/Facebook login chưa bật | Chỉ đăng nhập bằng tài khoản riêng | Tạo OAuth app, điền `GOOGLE_CLIENT_ID/SECRET` vào `.env` — code đã sẵn |
| Chưa có TLS / tên miền | Chỉ truy cập qua VPN Tailscale (mã hoá sẵn trong tailnet) | Khi chốt tên miền (PRD Q6): Caddy/Cloudflare Tunnel trước app |
| Huy hiệu React Flow trên màn cây | Thẩm mỹ | Mua React Flow Pro nếu muốn gỡ |

## Sự cố thường gặp

- **Web không lên sau deploy** → `tail -50 var/log/giapha.log`. Hay gặp: `.env` thiếu biến
  (so với `.env.example`), database chưa healthy (`docker compose ps`).
- **Đăng nhập lỗi** → kiểm `BETTER_AUTH_URL` trong `.env` phải đúng `http://<tailscale-ip>:3000`.
- **Trang trắng / lỗi quyền** → kiểm `GIAPHA_CLAN_ID` trong `.env` (sinh bởi bootstrap script).
- **Cổng 3000 bị chiếm** → `./scripts/deploy.sh` tự dọn; nếu vẫn kẹt: `ss -tlnp | grep 3000`.

---

## Nhật ký triển khai lần đầu — 22–23/08/2026

| Việc | Kết quả |
|---|---|
| Dòng họ khởi tạo | `Dòng họ Nguyễn Quang`, id nằm ở `GIAPHA_CLAN_ID` trong `.env` |
| Tài khoản quản trị đầu | `nguyenquanghiep@gmail.com` (vai `admin`, đã gắn node) — mật khẩu do người tạo giữ, **không nằm trong repo** |
| Dữ liệu mẫu | 12 người gieo qua đúng luồng FR-51 (`npx tsx scripts/demo-seed.ts`) — nhân vật demo, xoá được |
| Diễn tập khôi phục | ✅ đã chạy `./scripts/backup.sh --restore` — khôi phục 13 dòng `person` |
| Web | `http://100.94.148.68:3000` (IP Tailscale), `/uiworkshop` trả 404 đúng chuẩn production |

**Node của quản trị đang là một mảnh chưa nối.** Bootstrap tạo node cho Hiệp mà chưa gắn vào cây
nào — đúng trạng thái trung thực của FR-48. Cách nối: đăng nhập → **Thêm** → tự khai người thân
gần nhất, hoặc nạp khung có tên mình. Đây chính là vòng lặp sản phẩm sinh ra để phục vụ.

**Xoá sạch dữ liệu demo trước khi mở cho dòng họ:**
```bash
./scripts/deploy.sh --stop
docker compose down -v          # xoá volume ⇒ mất TOÀN BỘ dữ liệu
docker compose up -d && npm run db:migrate
npx tsx scripts/bootstrap-clan.ts --admin <email> '<mật khẩu>' '<Họ tên>'
./scripts/deploy.sh
```
