# Dựng xưởng UI — trình tự thi hành

Mục tiêu: `/uiworkshop` mở được, để làm UI/UX trước khi viết tính năng.

Kit đã tải sẵn ở `.ui-workshop-kit/`. Trình tự dưới đây theo đúng thứ tự — mỗi bước phụ thuộc bước trước.

---

## Bước 0 — Node.js (đang chặn)

Máy chưa có Node. `kit.mjs` là script Node nên không có runtime thì `doctor` và `install` đều không chạy.

```
winget install OpenJS.NodeJS.LTS
```

Mở lại terminal cho PATH nhận, rồi kiểm:

```
node --version
npm --version
```

---

## Bước 1 — Tạo app Next.js

Chạy **ở thư mục cha**, rồi gộp vào repo — hoặc chạy thẳng trong repo với `.` làm tên.

```
npx create-next-app@latest . --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```

**Ba lựa chọn không được đổi**, vì `doctor` kiểm đúng chúng:

| | | Vì sao |
|---|---|---|
| `--app` | App Router | Xưởng là route App Router |
| `--no-src-dir` | `app/` ở **gốc repo** | Doctor **bác thẳng** `src/app` với thông báo lỗi riêng |
| `--import-alias "@/*"` | alias trỏ về gốc | Plumbing import `@/components/ui/card` |

Repo đã có `README.md`, `docs/`, `_bmad/`, `_bmad-output/` — `create-next-app` sẽ hỏi khi thư mục không rỗng. Trả lời giữ nguyên các file sẵn có.

Sau bước này, kiểm `tsconfig.json` có:

```json
"paths": { "@/*": ["./*"] }
```

---

## Bước 2 — Tailwind v4, CSS gốc

`create-next-app --tailwind` sinh sẵn `app/globals.css`. Xác nhận nó chứa:

```css
@import 'tailwindcss';
```

Doctor tìm **file CSS nào có dòng này** để nạp cầu nối token `ws-*`. Không có dòng đó thì mọi class `bg-ws-*` **im lặng không tồn tại** — xưởng ra một đống hộp không màu mà không báo lỗi gì.

---

## Bước 3 — shadcn/ui + Card

```
npx shadcn@latest init
npx shadcn@latest add card
```

### ⚠️ Bước này chưa đủ — phải vá `CardBody`

Doctor đòi `card.tsx` export **ba** thứ: `Card`, `CardTitle`, **`CardBody`**.

shadcn bản gốc export `CardContent`, **không có `CardBody`**. Chạy xong lệnh trên, doctor vẫn **fail** ở đúng dòng này.

Mở `components/ui/card.tsx`, thêm vào cuối:

```ts
// UI Workshop Kit đòi tên `CardBody`; shadcn đặt tên `CardContent`.
export { CardContent as CardBody }
```

Nếu file dùng một câu `export { ... }` gom cuối, thêm `CardContent as CardBody` vào trong đó.

---

## Bước 4 — Chạy doctor

```
node .ui-workshop-kit/kit.mjs doctor
```

Doctor **không ghi gì**, chỉ kiểm. Nó dừng ngay ở `package.json` nếu chạy sai thư mục.

Đọc kết quả theo hai loại:

- `✗` — **fail**, cắm vào sẽ không chạy. Phải sửa.
- `!` — **warn**, xưởng vẫn chạy, chỉ mất một phần.

Hai warn dự kiến, cả hai đều chấp nhận được lúc này:

| Warn | Trạng thái |
|---|---|
| chưa cài BMAD | **Sẽ không xuất hiện** — repo đã có `_bmad/_config/manifest.yaml` |
| không thấy `sprint-status.yaml` | Xuất hiện. Chip trạng thái story sẽ rỗng — chưa chạy sprint planning |

---

## Bước 5 — Cắm kit

```
node .ui-workshop-kit/kit.mjs install --sprint _bmad-output/implementation-artifacts/sprint-status.yaml
```

**Cờ `--sprint` là bắt buộc trong repo này.** Đường dẫn mặc định của kit là `docs/bmad/implementation-artifacts/sprint-status.yaml`, **không khớp** cấu hình BMAD ở đây (`_bmad-output/implementation-artifacts`). Thiếu cờ này thì sửa tay ở `app/uiworkshop/_registry/sprint.ts`.

`install` tự dừng nếu doctor còn fail. Nó sẽ:

- chép plumbing vào `app/uiworkshop/`
- thêm `@import 'app/uiworkshop/tokens.css'` vào CSS gốc
- sinh khung rỗng project sở hữu vĩnh viễn: `tokens.css`, `_registry/*`, `_mock/seed.ts`
- cắm override BMAD vào `_bmad/custom/`
- chép `specs/frontend-stack.md` từ template

`upgrade` về sau **không bao giờ đè** lên khung rỗng.

---

## Bước 6 — Chạy

```
npm run dev
```

Mở `/uiworkshop`.

Kiểm thêm:

```
npx tsc --noEmit
npx eslint app/uiworkshop
```

Và xác nhận cổng chặn ship hoạt động — `/uiworkshop` **phải trả 404** ở production:

```
NODE_ENV=production npm run build
npm start
```

---

## Sau khi cắm — ba file phải điền

Kit sinh khung rỗng; nội dung là của dự án này.

| File | Điền gì |
|---|---|
| `app/uiworkshop/tokens.css` | 16 token `ws-*` → màu thương hiệu. Cầu nối giữa vỏ xưởng và bản sắc |
| `app/uiworkshop/_registry/outline.ts` | `SECTIONS` + `REQ_GROUPS` theo **15 FR của Đợt 1** — trục "màn này thuộc yêu cầu nào" |
| `app/uiworkshop/_registry/flows.ts` | Các luồng — chép từ **UJ-1…UJ-4** trong `prd.md` §2.3 |

`specs/frontend-stack.md` cũng cần viết lại theo ngăn xếp thật: Next.js 16.3 · React 19.2 · Tailwind 4.3 · TypeScript 7.0.2 · Drizzle 0.45.2 · Better Auth 1.6.26.

---

## Ràng buộc kiến trúc còn hiệu lực trong xưởng

Xưởng là nơi dựng giao diện, không phải nơi lách kiến trúc. Hai bất biến vẫn áp:

- **AD-1** — `app/` không được import database client, ORM, hay storage SDK. Trong xưởng, dữ liệu đến từ `_mock/seed.ts`, không phải từ `db/`.
- **AD-23** — không cache thứ phụ thuộc người xem. Xưởng chạy động, không sao.

Cây thư mục sau khi xong khớp với `ARCHITECTURE-SPINE.md` § Structural Seed:

```
app/
  uiworkshop/     # nguyên mẫu, notFound() ở production
components/ui/    # shadcn
core/             # nghiệp vụ — chưa dựng, thuộc giai đoạn dev
db/               # schema — chưa dựng
specs/
```
