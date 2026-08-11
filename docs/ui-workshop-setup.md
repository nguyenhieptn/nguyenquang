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

## Còn phải làm — nội dung, không phải hạ tầng

| File | Trạng thái |
|---|---|
| `app/uiworkshop/_registry/outline.ts` | ✔ **đã điền** — 2 bề mặt (Người trong họ · Bàn duyệt), 15 FR Đợt 1 trong `PLANNED_REQS` |
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
