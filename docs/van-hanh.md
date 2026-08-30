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
| Tạo tài khoản quản trị (dòng họ tự dựng nếu chưa có) | `npx tsx scripts/create-admin.ts <email> '<mật khẩu>' '<Họ tên>'` |
| Xem các tài khoản trong dòng họ (vai, tên đăng nhập) | `npx tsx scripts/reset-admin-password.ts --list` |
| **Đặt lại mật khẩu** (quên mật khẩu quản trị) | `npx tsx scripts/reset-admin-password.ts <email hoặc tên đăng nhập>` |
| **Bộ đo giao diện** (cổng thứ năm — xem § dưới) | `npm run soi` |
| **Dòng họ thử** — dựng để mở trình duyệt xem như thành viên, bấm thử nút ghi (xem § dưới) | `npm run dong-ho-thu` · dọn: `npm run dong-ho-thu -- --go` |

Log web: `var/log/giapha.log`. PID: `var/run/giapha.pid`.

## Bộ đo giao diện — cổng thứ năm

Bốn cổng `npm run lint` · `npx tsc --noEmit` · `npm test` · `npm run build` chạy trên **mã nguồn**.
Cổng thứ năm chạy trên một **hệ đang sống**: nó mở trình duyệt thật, đi hết mọi màn trong bản đăng ký và đo
các sàn đã cam kết ở `EXPERIENCE.md § Accessibility Floor`.

Nó tồn tại vì bốn cổng kia xanh với gần như mọi lỗi giao diện. Hai lỗi nặng nhất của Đợt 2 — nhãn
sơn đè lên họ tên, và mọi màn dài mất trắng 34px đệm đáy — chỉ bị bắt khi có người dựng trình duyệt
lên và ĐO.

### Chạy

```bash
# 1. Dựng một bản RIÊNG để đo, trên chính máy này, ở CỔNG KHÁC bản dòng họ đang dùng.
#    Bind vào IP Tailscale, KHÔNG phải 127.0.0.1 — xem § Vì sao không dùng 127.0.0.1.
npm run build
npx next start -H "$(tailscale ip -4)" -p 3100

# 2. Đo, ở một cửa sổ khác
SOI_GOC="http://$(tailscale ip -4):3100" SOI_TEN=<tên đăng nhập> SOI_MK='<mật khẩu>' npm run soi
```

> ### Vì sao không dùng `127.0.0.1`
>
> Server bind vào loopback thì **chỉ máy chạy lệnh mới vào được**. Ai làm việc từ máy khác qua
> Tailscale sẽ không mở được địa chỉ ấy — không xem được ảnh chụp, không bấm thử lại được thứ bộ
> đo vừa báo. Dự án đã có sẵn `npm run dev:vpn` và `npm run start:vpn` làm đúng việc này.
>
> **Cổng phải khác 3000.** Bản dòng họ đang dùng chạy ở `3000` trên chính IP ấy
> (`scripts/deploy.sh`). Dựng bản đo ở `3100` để không đè lên nó.
>
> **Và cổng khác thì phải khai origin.** Thêm địa chỉ bản đo vào `BETTER_AUTH_TRUSTED_ORIGINS`
> trong `.env`, nếu không sẽ nhận `403 INVALID_ORIGIN` khi đăng nhập:
>
> ```
> BETTER_AUTH_TRUSTED_ORIGINS=http://100.94.148.68:3100
> ```
>
> Lỗi này trông như ngẫu nhiên, nên đáng biết vì sao: Better Auth **chỉ kiểm origin khi request có
> cookie**. Tab ẩn danh hay máy chưa từng vào phả thì đăng nhập được; trình duyệt đã từng vào
> `:3000` thì **403** — vì cookie không phân biệt cổng, nên nó gửi cookie của `:3000` sang `:3100`
> và bật phép kiểm lên. Nghĩa là bản đo "chạy tốt" với một người và hỏng với người khác, trên cùng
> một địa chỉ.

| Việc | Lệnh |
|---|---|
| Cả bản đăng ký | `npm run soi` |
| Một màn | `npm run soi -- hang-cho` |
| Chỉ bề mặt điện thoại (390px) | `npm run soi -- --be-mat A` |
| Chỉ bàn làm việc (1280px — bề mặt B là desktop-only, `EXPERIENCE.md:498`) | `npm run soi -- --be-mat B` |
| Xem danh sách khoá màn | `npm run soi -- khoa-khong-co-that` |

### Biến môi trường

| Biến | Bắt buộc | Nghĩa |
|---|---|---|
| `SOI_GOC` | có | Địa chỉ gốc, ví dụ `http://127.0.0.1:3100` |
| `SOI_TEN` | có | Tên đăng nhập của một tài khoản **quản trị** |
| `SOI_MK` | có | Mật khẩu. Không bao giờ đặt vào mã hay vào `.env` được commit |
| `SOI_CHO_PHEP_XA` | không | `=1` để bỏ hàng rào chặn đo máy xa. Đọc § An toàn trước |

**Không biến nào có mặc định.** Hai script đời trước nhúng sẵn địa chỉ VPN và tên đăng nhập, nên gõ
nhầm một lệnh là mở trình duyệt vào phả thật của dòng họ. Nay thiếu biến thì dừng và nói rõ thiếu cái gì.

### Đọc bản kê

```
── /admin/hang-cho @1280px ───────────────
  có mặt          3 phần tử · ✓
  chữ            84 phần tử · ✗ 2 vi phạm
      ✗ 14.88px < 15px tuyệt đối — span · "xin từ 12/08"
  chạm           19 phần tử · ✓
  ...
✗ 2 vi phạm làm ĐỎ cổng
👁 4 mục cần mắt người — KHÔNG hạ cổng, nhưng cũng không được quên
✓ revision 412 → 412 — phả không đổi
```

- `✗` hạ cổng. Lệnh thoát khác 0.
- `👁` **không** hạ cổng: bộ đo thấy một thứ đáng ngờ mà chỉ người mới quyết được (một nhãn xuống
  dòng có thể đúng nếu tên chi dài). Đọc hết chúng — chúng là chỗ lỗi nấp.
- `⊘ bỏ qua` nghĩa là màn không mở được (chưa có dữ liệu, hoặc tài khoản không đủ quyền). Một màn
  bỏ qua là một màn **không được gác** — đừng đọc nó thành xanh.
- `n phần tử` là số phần tử đã soi. **Soi 0 phần tử là ĐỎ**, không phải xanh: cổng nào không tìm
  thấy gì thì nó đang gác không khí.

### An toàn — vì sao có hàng rào chặn đo máy xa

Bộ đo mở những màn có nút **ghi vĩnh viễn** vào một kho không có phép xoá (AD-4). Chuyện xấu nhất đã
xảy ra một lần rồi: một lượt bấm thử nâng tầng **40 khẳng định**, không gỡ lại được.

Ba hàng rào:

1. **Chặn máy XA.** `SOI_GOC` phải trỏ vào một địa chỉ đang gắn trên chính máy chạy lệnh —
   loopback, LAN, hoặc Tailscale đều được; một máy khác thì lệnh từ chối. Ý định là *"đừng lái một
   máy khác"*, không phải *"chỉ loopback"*: bản đầu chỉ nhận loopback và vì thế từ chối luôn IP
   Tailscale của chính máy đang chạy bộ đo.
2. **Cấm bấm.** `scripts/soi/cam-bam.test.ts` đọc mã nguồn của cả bộ đo và ĐỎ nếu có chỗ nào nhắm
   vào một điều khiển ghi (*Duyệt*, *Trả lại*, *Ghi … vào phả*, *Loại quan hệ này*, …).
3. **Đếm `revision`.** Mỗi lượt chạy đếm số hàng `revision` trước và sau. Hai số khác nhau nghĩa là
   lượt ĐO đã GHI — lỗi nặng nhất bộ đo có thể mắc, và cổng đỏ vì nó.

### Dòng họ thử — chỗ duy nhất bấm được nút ghi

Phả thật có đúng một gắn kết (quản trị), và mọi nút ghi trên nó là vĩnh viễn (AD-4). Nên muốn
**xem bề mặt của một thành viên thường** (`/gia-pha` — "Phả quanh mình", story 6-10) hay **bấm
thử một nút ghi**, dựng một dòng họ thử:

```bash
npm run dong-ho-thu            # in ba tài khoản (quản trị · thành viên · chưa gắn) + lệnh chạy
GIAPHA_CLAN_ID=<id in ra> BETTER_AUTH_URL=http://$(tailscale ip -4):3200 \
  npx next start -H "$(tailscale ip -4)" -p 3200
npm run dong-ho-thu -- --go    # dọn sạch khi xong
```

Tắt bản `:3200` **theo cổng, không theo pid** — pid của `nohup npx next start` là tiến trình
`npm`, không phải `next-server`; kill nó thì server cũ vẫn giữ cổng, chạy `.next` CŨ sau lượt
build mới và ghim dòng họ thử ĐÃ DỌN (29/08: `ChunkLoadError` hàng loạt trong lượt soi vì đúng
chuyện này). Script gọi không cờ là DỰNG THÊM một dòng họ thử — không có cờ liệt kê.

```bash
kill "$(ss -ltnp | grep ':3200 ' | sed -n 's/.*pid=\([0-9]*\).*/\1/p' | head -1)"
```

Database khi ấy có HAI dòng họ. Bản thật ở `:3000` không ghim gì nên vẫn phục vụ dòng họ đầu
tiên (phả thật) — và ghi một dòng cảnh báo vào log ở mỗi request, cho tới khi dọn. Đừng để dòng
họ thử sống qua đêm.

Cùng bộ dựng với bài test adapter (`core/gates/dong-ho-thu.ts`), nên cây thử có đủ ca: ba đời,
một cặp vợ chồng, hai anh em, một mảnh rời, một người chưa có cha.

### Kịch bản ghi — cổng thứ sáu, script duy nhất được bấm nút ghi

Bộ đo chỉ ĐỌC. Test adapter gọi server action mà không có màn. Ở giữa là một lớp lỗi hai thứ ấy
đều không thấy: nút ghi có chạy, nhưng màn nói sai hoặc không nói gì (câu xác nhận nằm trong hàng
vừa bị gỡ — code review 6-4). `npm run bam-thu` (story 7-1) bấm nút ghi THẬT trên dòng họ thử rồi
đọc lại màn và đếm `revision` của đúng clan ấy:

```bash
GIAPHA_CLAN_ID=<id dòng họ thử> SOI_GOC=http://$(tailscale ip -4):3200 \
  SOI_TEN=thu.quan.tri.<mã> SOI_MK='<mật khẩu in ra>' npm run bam-thu        # cả ba kịch bản
npm run bam-thu -- k2                                                        # một kịch bản
```

Ba rào đứng trước mọi cú bấm, hụt một rào là dừng, không chạm gì: tên clan của `GIAPHA_CLAN_ID`
trong DB phải bắt đầu bằng *"Dòng họ thử"* · `SOI_TEN` phải là `thu.quan.tri.*` · sau đăng nhập
thanh trên phải mang họ *"Nguyễn Thử"*. Tài khoản thành viên suy từ tên quản trị (cùng mã). Ba
kịch bản là ba LỚP (phiếu bề mặt B · bảng nơi chốn · bề mặt A của thành viên); story nào có nút
ghi mới thì thêm kịch bản vào `scripts/bam-thu/kich-ban.ts` với `revisionMongDoi` đo được. Ảnh ở
`var/bam-thu/`. Chạy ở mỗi story có nút ghi, và trước mỗi lần phát hành cùng `npm run soi`.

Đọc bản kê: mỗi kịch bản một dòng ✓/✗, dưới nó là **câu màn đã nói** và `revision +N` (số hàng nhật
ký kịch bản ấy sinh ra, so với `revisionMongDoi` đã đo). ✗ có ba dạng: màn không nói điều mong đợi
(kèm 240 ký tự màn đang nói), revision lệch (đường ghi đã đổi hình — phải có người nhìn), hoặc
*không đếm được revision* (DB / `DATABASE_URL_OWNER`, kết quả không kết luận được). Exit 1 khi có ✗.

### Khi thêm một màn mới

Thêm một dòng vào `scripts/soi/dang-ky.ts`. Quên thì `npm test` ĐỎ — `dang-ky.test.ts` đối chiếu bản
đăng ký với mọi `page.tsx` trong `app/`, cả hai chiều.

### Vì sao nó KHÔNG chạy trong `npm run build`

Nó cần một server đang chạy, một database có dữ liệu, và một mật khẩu. Gắn vào `build` là làm `build`
hỏng trên mọi máy chưa dựng đủ — và một cổng hay đỏ vì lý do ngoài mã là một cổng sắp bị bỏ qua.
Chạy tay trước mỗi lần phát hành.

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
| ~~Bản sao lưu nằm cùng máy với production~~ | **CHỐT BỎ 26/08/2026** — miễn trừ phần off-host của AD-25, xem ARCHITECTURE-SPINE § AD-25. Sao lưu vẫn chạy hằng ngày, vẫn 90 ngày, `--restore` vẫn bắt buộc. Cái mất: không đỡ được **mất máy**, mà phả nay đã có dữ liệu chỉ tồn tại trong database | — |
| ~~Media trên đĩa local, chưa off-host~~ | Cùng miễn trừ trên | — |
| Google/Facebook login chưa bật | Chỉ đăng nhập bằng tài khoản riêng | Tạo OAuth app, điền `GOOGLE_CLIENT_ID/SECRET` vào `.env` — code đã sẵn |
| Chưa có TLS / tên miền | Chỉ truy cập qua VPN Tailscale (mã hoá sẵn trong tailnet) | Khi chốt tên miền (PRD Q6): Caddy/Cloudflare Tunnel trước app |
| Huy hiệu React Flow trên màn cây | Thẩm mỹ | Mua React Flow Pro nếu muốn gỡ |

## Sự cố thường gặp

- **Web không lên sau deploy** → `tail -50 var/log/giapha.log`. Hay gặp: `.env` thiếu biến
  (so với `.env.example`), database chưa healthy (`docker compose ps`).
- **Đăng nhập lỗi** → kiểm `BETTER_AUTH_URL` trong `.env` phải đúng `http://<tailscale-ip>:3000`.
- **Quên mật khẩu quản trị** → `npx tsx scripts/reset-admin-password.ts <email>`, script hỏi mật
  khẩu mới (gõ không hiện) và xoá mọi phiên đang mở. Lưu ý: chạy lại `create-admin.ts` KHÔNG
  đặt lại được — `createAdmin` idempotent theo email, gặp tài khoản đã có thì trả về nguyên
  trạng. Triển khai này chưa có bộ gửi mail nên luồng "quên mật khẩu" của Better Auth cũng
  không dùng được; script này là đường thoát duy nhất.
- **Không vào được `/admin`** (hiện màn "Khu vực Ban tu phả") → tài khoản thiếu vai. Cổng ở
  `app/admin/layout.tsx` chỉ nhận `admin` và `branch-head`. Xem vai hiện tại bằng
  `reset-admin-password.ts --list`. **Nâng/hạ vai nay có màn UI** — `/admin/tai-khoan` (story
  6-2, 27/08/2026): liệt kê mọi gắn kết, trao và hạ vai, gỡ gắn kết. Hai việc màn ấy cố ý KHÔNG
  cho làm, và cả hai đều là hàng rào an toàn: không hạ vai **quản trị cuối cùng**, và không **tự**
  hạ vai mình (nhờ một quản trị khác — để hai người cùng biết). Cả hai gác ở `core/identity`, nên
  POST thẳng không qua giao diện cũng bị chặn. Nếu phả chỉ còn đúng một quản trị và người ấy mất
  quyền truy cập, đường duy nhất còn lại vẫn là `scripts/create-admin.ts`.
- **Trang trắng / lỗi quyền** → kiểm xem đã có dòng họ trong database chưa (`create-admin.ts`).
  Từ 25/08/2026 id dòng họ KHÔNG còn nằm trong `.env` — nó đọc thẳng từ bảng `clan`.
- **Cổng 3000 bị chiếm** → `./scripts/deploy.sh` tự dọn; nếu vẫn kẹt: `ss -tlnp | grep 3000`.

---

## Nhật ký triển khai lần đầu — 22–23/08/2026

| Việc | Kết quả |
|---|---|
| Dòng họ khởi tạo | `Dòng họ Nguyễn Quang`, id nằm trong bảng `clan` — **không** chép ra `.env` |
| Tài khoản quản trị đầu | `nguyenquanghiep@gmail.com` (vai `admin`, đã gắn node) — mật khẩu do người tạo giữ, **không nằm trong repo** |
| Dữ liệu phả | Gieo từ **bảng tính Google** qua đúng luồng FR-51 (`npx tsx scripts/seed-from-sheet.ts`). Nguồn khai ở `GIAPHA_SEED_SHEET_URL` trong `.env` — sửa phả là sửa bảng tính rồi chạy lại, không mở repo. Cột `core/seed` chưa biết (ví dụ `noi_o`, thuộc story 5-7) được tự bỏ qua và báo ra. |
| Diễn tập khôi phục | ✅ đã chạy `./scripts/backup.sh --restore` — khôi phục 13 dòng `person` |
| Web | `http://100.94.148.68:3000` (IP Tailscale), `/uiworkshop` trả 404 đúng chuẩn production |

**Node của quản trị đang là một mảnh chưa nối.** Bootstrap tạo node cho Hiệp mà chưa gắn vào cây
nào — đúng trạng thái trung thực của FR-48. Cách nối: đăng nhập → **Thêm** → tự khai người thân
gần nhất, hoặc nạp khung có tên mình. Đây chính là vòng lặp sản phẩm sinh ra để phục vụ.

**Dựng lại phả từ số không (xoá sạch rồi gieo lại từ bảng tính):**
```bash
./scripts/deploy.sh --stop
docker compose down -v          # xoá volume ⇒ mất TOÀN BỘ dữ liệu
docker compose up -d && npm run db:migrate
npx tsx scripts/create-admin.ts <email> '<mật khẩu>' '<Họ tên>'
npx tsx scripts/seed-from-sheet.ts
./scripts/deploy.sh
```

`create-admin.ts` **không** còn ghi gì vào `.env` — id dòng họ là sự thật nằm trong database,
`core/identity/clan-registry.soleClanId()` đọc thẳng từ đó (migration `0002_clan_directory`).
Volume `giapha-pgdata` chỉ chứa Postgres; `MEDIA_DIR` là đường trên máy nên ảnh và ghi âm
**không** mất theo `down -v`.
