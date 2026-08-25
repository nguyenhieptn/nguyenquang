# Dựng xưởng UI — nhật ký thi hành

Mục tiêu: `/uiworkshop` mở được, để làm UI/UX trước khi viết tính năng.

**Trạng thái: xong (11/08/2026).** Sáu bước dưới đây đã chạy hết trên máy macOS. Giữ lại làm nhật
ký — cần dựng lại từ đầu ở máy khác thì làm đúng trình tự này.

---

## Bước 0 — Node.js ✔

Đã có sẵn: `node v25.2.1` · `npm 11.6.2`. (Ghi chú cũ dùng `winget` là lệnh Windows — trên macOS
dùng `brew install node` hoặc bản cài từ nodejs.org.)

---

## Bước 1 — Tạo app Next.js ✔

Repo đã có `README.md`, `docs/`, `_bmad/`, `_bmad-output/` nên `create-next-app` **từ chối chạy
thẳng với `.`** (nó chỉ bỏ qua một danh sách file quen như `.git`, `README.md`, `LICENSE`; `docs/`
và `_bmad/` không nằm trong đó). Cách đã dùng: dựng ở thư mục tạm rồi chuyển vào repo.

```
npx create-next-app@latest nextapp --ts --tailwind --eslint --app --no-src-dir \
    --import-alias "@/*" --use-npm --turbopack --yes
```

**Ba lựa chọn không được đổi**, vì `doctor` kiểm đúng chúng:

| | | Vì sao |
|---|---|---|
| `--app` | App Router | Xưởng là route App Router |
| `--no-src-dir` | `app/` ở **gốc repo** | Doctor **bác thẳng** `src/app` với thông báo lỗi riêng |
| `--import-alias "@/*"` | alias trỏ về gốc | Plumbing import `@/components/ui/card` |

Kết quả: Next.js **16.3.0** · React **19.2.8** · `tsconfig.json` có `"paths": { "@/*": ["./*"] }`.

`create-next-app` cũng đẻ `AGENTS.md` + `CLAUDE.md` — giữ lại, `next dev` tự ghi lại chúng mỗi lần
chạy nên xoá cũng vô ích.

---

## Bước 2 — Tailwind v4, CSS gốc ✔

`app/globals.css` có sẵn `@import "tailwindcss";`. Doctor tìm **file CSS nào có dòng này** để nạp
cầu nối token `ws-*`. Không có dòng đó thì mọi class `bg-ws-*` **im lặng không tồn tại** — xưởng ra
một đống hộp không màu mà không báo lỗi gì.

Tailwind cài về bản **4.3.3**.

---

## Bước 3 — shadcn/ui + Card ✔

CLI shadcn đã đổi cờ so với ghi chú cũ: `-b` bây giờ là **base primitive** (`radix|base|aria`),
không phải base color, và nó **bắt buộc chọn preset**.

```
npx shadcn@latest init -y -b radix -p nova
npx shadcn@latest add card -y -o
```

### ⚠️ Bước này chưa đủ — phải vá `CardBody`

Doctor đòi `card.tsx` export **ba** thứ: `Card`, `CardTitle`, **`CardBody`**. shadcn export
`CardContent`, **không có `CardBody`**.

Đã thêm vào cuối câu `export { … }` của `components/ui/card.tsx`:

```ts
// UI Workshop Kit đòi tên `CardBody`; shadcn đặt tên `CardContent`.
CardContent as CardBody,
```

> Chạy lại `shadcn add card` sẽ **ghi đè file và mất dòng này**. Thêm lại sau mỗi lần chạy.

---

## Bước 4 — Chạy doctor ✔

```
node .ui-workshop-kit/kit.mjs doctor
```

### Đã phải sửa một lỗi trong kit

Doctor **fail** ở `thiếu */components/ui/card.tsx` dù file có thật. Nguyên nhân nằm trong
`kit.mjs`: nó cắt đuôi alias bằng `replace(/\/\*$/, '')`, hợp với `"./src/*"` → `src`, nhưng với
alias trỏ thẳng về **gốc repo** (`"./*"`) thì chuỗi còn lại là `*` và nó đi tìm
`<root>/*/components/ui/card.tsx`.

Đã vá tại `.ui-workshop-kit/kit.mjs` — tách ra hàm `aliasTargetDir()` cắt `*` rồi mới cắt `/`, dùng
chung cho cả `doctor` và `install`. **Vá này nằm trong bản kit vendored ở repo**, nên `upgrade` kéo
kit mới về sẽ mất — nếu doctor lại fail đúng dòng đó thì vá lại y hệt.

Kết quả cuối: **✓ Cắm được. 1 cảnh báo** — cảnh báo là không thấy `sprint-status.yaml` (chưa chạy
sprint planning; chip trạng thái story sẽ rỗng cho tới lúc đó).

---

## Bước 5 — Cắm kit ✔

```
node .ui-workshop-kit/kit.mjs install --sprint _bmad-output/implementation-artifacts/sprint-status.yaml
```

**Cờ `--sprint` là bắt buộc trong repo này**: mặc định của kit là
`docs/bmad/implementation-artifacts/`, không khớp cấu hình BMAD ở đây.

Đã cắm 9 file plumbing + 13 file khung, và tự sửa ba chỗ: đường dẫn sprint trong
`_registry/sprint.ts`, `@import './uiworkshop/tokens.css'` vào `app/globals.css`, và
`.ui-workshop-kit` vào `exclude` của `tsconfig.json`.

---

## Bước 6 — Nghiệm thu ✔

| Kiểm | Kết quả |
|---|---|
| `npm run dev` → `/uiworkshop` | 200, sidebar dựng đúng |
| class `ws-*` có sinh CSS thật không | có — `.bg-ws-accent`, `.bg-ws-n-05`… đều có trong bundle |
| `npx tsc --noEmit` | 0 lỗi¹ |
| `npx eslint app components lib` | 0 lỗi |
| `npm run build` | xanh |
| `/uiworkshop` ở production | **404** ✔ (`/` vẫn 200) |

¹ Lần chạy đầu báo `Cannot find name 'LayoutProps'` — đó là type Next 16 sinh ra trong `.next/`,
mà `.next/` không được chuyển từ thư mục tạm sang. `npx next typegen` là hết.

---

## Chạy qua VPN (Tailscale)

Xưởng cần xem được từ máy khác — điện thoại, máy của người trong họ — nhưng **không** phơi ra wifi
quán cà phê. Tailnet giải đúng việc đó: chỉ thiết bị đã đăng nhập cùng tailnet mới tới được.

```
npm run dev:vpn        # xưởng UI, qua VPN
npm run start:vpn      # bản production, qua VPN (cần `npm run build` trước)
```

Hai script bind thẳng vào IP Tailscale — `next dev -H "$(tailscale ip -4)"`. Lấy IP **động** chứ
không viết cứng, vì IP tailnet có thể đổi khi rời/nhập lại mạng.

Máy này: `edgexpert-cd08` → `100.94.148.68` → `http://edgexpert-cd08.tail5d6a1b.ts.net:3000`.

### Ba điều phải biết trước khi dùng

**1. `dev:vpn` bind riêng IP VPN ⇒ `localhost:3000` không còn mở được.** Đó là chủ ý — bind riêng
mới là thứ chặn LAN. Ngồi làm ngay tại máy này thì dùng `npm run dev` như cũ (Next mặc định bind
`0.0.0.0`, cả localhost lẫn Tailscale lẫn wifi đều tới được).

**2. Origin mới phải khai trong `allowedDevOrigins`.** Next chặn cross-origin tới asset dev nếu
origin không phải hostname khởi tạo server. `next.config.ts` đang liệt kê IP Tailscale, tên
MagicDNS, và IP LAN. Thêm thiết bị/tên mới thì thêm vào đây, không thì trang mở ra nhưng CSS/JS
im lặng không nạp.

**3. `start:vpn` **không** phục vụ `/uiworkshop`.** `app/uiworkshop/layout.tsx` gọi `notFound()`
khi `NODE_ENV === 'production'` (xem Bước 6). Muốn khoe xưởng cho người khác thì phải là
`dev:vpn`; `start:vpn` chỉ để xem bản thật.

---

## Thu phạm vi — 16/08/2026

Xưởng đã có **18 màn** phủ kín 15 FR của Đợt 1. Đã **xoá 16**, còn đúng một: **`trang-chu`**.

Lý do không phải là chúng sai. Là vì mười tám màn dựng song song thì không màn nào được làm tới
nơi, và chi phí giữ chúng đồng bộ với nhau đã lớn hơn giá trị chúng trả về. Cách làm từ đây:
**một view một lúc, xong mới mở view sau** — và **dựng bề ngang (desktop) trước**.

### Còn lại

| | |
|---|---|
| View | `trang-chu` · `design-system` (bảng token, tầng FOUNDATION) |
| Plumbing giữ nguyên | `(shell)` · `_components` · `_mock` · `_registry` |
| `components/pha` | `chan-trang` · `khung` · `o-tim` · `tam-phim` · `thanh-dieu-huong` · `tin-cay` · `vach` |

Đã xoá khỏi `components/pha`: `cay-ca-toc`, `cay-gia-pha`, `cay-tai-dong`, `thanh-ban-duyet`,
`khung-cay` — hết người dùng sau khi các màn cây và bàn làm việc biến mất.

### Bốn chỗ phải vá theo, không chỗ nào là tuỳ chọn

**1. `ChamTinCay` tách khỏi `khung-cay.tsx` → `components/pha/tin-cay.tsx`.** `khung-cay` import
`@xyflow/react` **và stylesheet của nó**; `trang-chu` chỉ mượn ở đó đúng một cái chấm 10px. Để
nguyên là bắt màn duy nhất còn lại tải cả thư viện đồ thị. Mức tin cậy vốn là khái niệm của **dữ
liệu**, không phải của cây — sau khi cây mất, `tin-cay.tsx` mới là chỗ đúng của nó.

**2. `href` → `null`, không phải xoá mục.** `ThanhDieuHuong` (4/5 mục) và `ChanTrang` (7 đường)
trỏ vào màn đã xoá. Cả hai component **vốn đã nhận `href: string | null`** và render mục thành chữ
trơ — dùng đúng cơ chế có sẵn, không phải cách lách.

> Giữ **nguyên năm mục** thay vì cắt xuống một. Thanh điều hướng khai báo **hình dạng** của sản
> phẩm; cắt còn một mục thì `trang-chu` đọc ra như một trang lẻ, và mọi quyết định bố cục lấy trên
> nó — chiều cao thanh, khoảng chừa dưới, sức nặng của "Thêm" ở giữa — đều sai.

**3. `FLOWS = []`.** Năm hành trình cũ dựng trên 16 màn đã xoá; giữ lại thì bản đồ vẽ ra một chuỗi
ô trống và `gapCount` báo "chưa dựng" cho những màn thật ra đã dựng xong — sai kiểu đó tệ hơn
không có bản đồ. Sidebar tự ẩn mục "Luồng" khi rỗng. **Một màn thì chưa có luồng**: hành trình cần
ít nhất hai bước. Toàn bộ máy móc (`flowById`, `layoutFlow`, `viewChuaCoLuong`…) giữ nguyên và
chạy đúng trên mảng rỗng.

**4. `PLANNED_REQS` đầy lại — 12 FR.** Danh sách này từng rỗng vì mọi FR đã có màn. Giờ các FR
quay về đó. Đây là danh sách **chờ đến lượt**, không phải danh sách trắng: hầu hết đã từng có một
bản dựng, và bản đó nằm trong git.

### Desktop-first

`trang-chu` khai `viewport: 'web'`, **đè** mặc định `mobile` của bề mặt `app`. Bề mặt vẫn khai
đúng — sản phẩm thật sống trên trình duyệt điện thoại (NFR §6). Nhưng **thứ tự dựng** thì ngược:
bố cục hai cột (cột đời | ghi chú lề) là quyết định phải chốt trước, và nó chỉ tồn tại ở khung
rộng. Bản hẹp là bản xếp chồng của nó, không phải ngược lại.

### Lấy lại màn đã xoá

15/16 nằm trong git:

```
git log --diff-filter=D --name-only -- app/uiworkshop
git checkout <sha>^ -- app/uiworkshop/<slug>
```

**Một ngoại lệ: `tim-vi-tri` (Máy tìm vị trí hộ, 243 dòng) chưa từng được commit — mất hẳn.** Đây
là lựa chọn có ý thức, không phải tai nạn. Cần lại thì phải dựng lại từ đầu.

---

## Còn phải làm — nội dung, không phải hạ tầng

| File | Trạng thái |
|---|---|
| `app/uiworkshop/_registry/outline.ts` | ✔ **đã điền** — 2 bề mặt (Người trong họ · Bàn làm việc), 15 FR Đợt 1 trong `PLANNED_REQS` |
| `app/uiworkshop/_mock/seed.ts` | ✔ **đã điền** — người/khẳng định/lời kể/mảnh, đời và mã chi là hàm dẫn xuất |
| `specs/frontend-stack.md` | ✔ **đã viết lại** theo stack thật |
| `_bmad/custom/*.toml` + `ux-assets/react-key-screens.md` | ✔ đã thay `<PROJECT>` |
| `app/uiworkshop/_registry/flows.ts` | ⏳ để rỗng — chờ `EXPERIENCE.md § Key Flows` của bmad-ux. Mục "Luồng" tự ẩn khi rỗng |
| `app/uiworkshop/tokens.css` | ⏳ còn màu mặc định của kit — chờ bản sắc thị giác (`bmad-custom-visual-direction` / bmad-ux) |
| `app/uiworkshop/design-system/page.tsx` | ⏳ còn khung — điền cùng lúc với tokens |
| `_bmad/custom/bmad-ux.toml` hai dòng `DESIGN.md`/`EXPERIENCE.md` | ⏳ **đang comment** — mở lại sau lần chạy bmad-ux đầu tiên, điền đúng thư mục có ngày |

`REQ_GROUPS` rỗng là đúng lúc này: chưa màn nào được dựng. bmad-ux render màn đầu cho một FR thì
gỡ FR đó khỏi `PLANNED_REQS` và tạo `ReqGroup`.

### Một lệch đã biết

Spine pin **TypeScript 7.0.2**, `create-next-app` mang về **5.9.3**. Chưa động vào. Phải quyết
trước story đầu tiên — nâng lên 7 rồi chạy lại `tsc`, hoặc sửa spine xuống. Ghi ở
`specs/frontend-stack.md` §6.

---

## Ràng buộc kiến trúc còn hiệu lực trong xưởng

Xưởng là nơi dựng giao diện, không phải nơi lách kiến trúc:

- **AD-1** — `app/` không được import database client, ORM, hay storage SDK. Trong xưởng, dữ liệu
  đến từ `_mock/seed.ts`, không phải từ `db/`.
- **AD-24** — core đọc danh tính từ session, không nhận làm tham số ⇒ giao diện không truyền
  `viewerId` xuống.
- **AD-13 / FR-37** — bán kính riêng tư quyết định dữ liệu nào **tới được client**, không phải
  dữ liệu nào bị ẩn bằng CSS.
- **AD-23** — không cache thứ phụ thuộc người xem. Xưởng chạy động, không sao.

Cây thư mục hiện tại khớp `ARCHITECTURE-SPINE.md § Structural Seed`:

```
app/
  uiworkshop/     # nguyên mẫu, notFound() ở production
components/ui/    # shadcn (mới có card)
lib/              # cn()
core/             # nghiệp vụ — chưa dựng, thuộc giai đoạn dev
db/               # schema — chưa dựng
specs/
```
