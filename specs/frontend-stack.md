# Chuẩn stack frontend — Gia phả dòng họ Nguyễn Quang

> Tầng: **spec (HOW)**. Đây là *hợp đồng viết giao diện* — cách dựng component/page/prototype sao
> cho **dùng lại được**. Không lặp lại quyết định kiến trúc (đó là `ARCHITECTURE-SPINE.md`) hay
> bản sắc thị giác (đó là `DESIGN.md`, bmad-ux sẽ viết).

## 1. Stack chuẩn (nguồn: `package.json`, đối chiếu `ARCHITECTURE-SPINE.md § Stack`)

| Lớp | Công nghệ | Bản đang cài |
|---|---|---|
| Framework | **Next.js App Router** — `app/` ở **gốc repo**, không dưới `src/` | 16.3.0 |
| Runtime UI | React (server component là mặc định) | 19.2.8 |
| Ngôn ngữ | TypeScript `strict` | **5.9.3** — spine pin 7.0.2, xem §6 |
| Style | **Tailwind v4** CSS-first bằng `@theme` trong `app/globals.css` | 4.3.3 |
| Component | **shadcn/ui** (base `radix`, preset `nova`) copy vào `components/ui/` — repo sở hữu mã | radix-ui 1.6.7 |
| Icon | `lucide-react` | 1.31.0 |
| Khung nhìn cây | **`@xyflow/react`** (React Flow) — CHỈ lo zoom/pan/nhánh nối; thẻ người vẫn là React + token của mình | 12.11.2 |
| Ghép class | `cva` (biến thể) + `cn()` ở `lib/utils.ts` (clsx + tailwind-merge) | 0.7.1 / 3.6.0 |
| Alias | `@/*` → **gốc repo**. Nên `@/core`, `@/db`, `@/components/ui` là đường dẫn AD-1 soi | `tsconfig.json` |

`app/` nằm ở gốc vì hai lý do độc lập cùng chỉ một hướng: xưởng UI **bác thẳng** `src/app`, và
spine (§ Structural Seed) đã chốt alias `@/*` trỏ về gốc để lint rule của AD-1 có đường soi.

## 2. Chuỗi nguồn sự thật của token — một chiều

```
DESIGN.md ──(chép tay)──▶ app/globals.css @theme ──▶ class Tailwind
(bản sắc)                  (--color-brand: …)        (bg-brand)

app/uiworkshop/tokens.css ──▶ class ws-*  (CHỈ vỏ xưởng dùng, không phải brand)
```

Hai bảng token, đừng trộn:

- **`ws-*`** (`app/uiworkshop/tokens.css`) là màu của **cái vỏ xưởng** — sidebar, thanh trên, bản
  đồ luồng. Prototype **không** gọi `ws-*`.
- **Token brand** (`app/globals.css @theme`) là màu của **sản phẩm**. Prototype chỉ gọi bảng này.

> Chưa có `DESIGN.md` nên bảng brand hiện mới là mặc định của shadcn. Prototype đầu tiên phải
> chờ bmad-ux chốt bản sắc, hoặc chấp nhận sửa màu lại sau.

Namespace Tailwind v4 dễ sai: thời lượng là `--transition-duration-*` (**không** phải
`--duration-*` — tên sai thì `duration-…` im lặng không sinh class nào), nhịp là `--ease-*`.

## 3. Hợp đồng viết component

- **Tái dùng primitive `components/ui/*` trước** khi tự viết; cần biến thể mới → thêm vào
  `variants` của chính primitive đó, đừng dựng thẻ mới lệch khuôn.
- `asChild` + `Slot` khi cần đổi thẻ gốc. Component cần state/hook → `'use client'`.
- **Token có tên, không hardcode hex.**
- `components/ui/card.tsx` có thêm một alias export `CardBody` (= `CardContent`) vì plumbing xưởng
  gọi tên đó. `npx shadcn@latest add card` sẽ ghi đè file này — thêm lại alias sau mỗi lần chạy.

## 4. Ràng buộc kiến trúc còn hiệu lực trong giao diện

Xưởng là nơi dựng giao diện, không phải nơi lách kiến trúc.

- **AD-1** — `app/` **không được** import database client, ORM, hay storage SDK. Chỉ `core/` được.
  Trong xưởng, dữ liệu đến từ `app/uiworkshop/_mock/seed.ts`.
- **AD-24** — không thao tác nào của core nhận clan / node người xem / vai làm tham số; adapter
  xin việc chứ không tự khai mình là ai. Nghĩa là giao diện **không** truyền `viewerId` xuống.
- **AD-13 / FR-37** — bán kính riêng tư quyết định **dữ liệu nào tới được client**, không phải
  dữ liệu nào bị `hidden` bằng CSS. Prototype nào vẽ "phần bị ẩn" phải vẽ nó như **không có**.
- **AD-23** — không cache thứ phụ thuộc người xem.

## 5. Luồng prototype → production (UI Workshop)

1. **bmad-ux render** → `app/uiworkshop/<slug>/page.tsx` + đăng ký `View` vào `REQ_GROUPS`
   (`app/uiworkshop/_registry/outline.ts`) theo đúng **FR**. Mock từ `_mock/seed.ts`, token có tên.
   Xưởng xem thử tại `/uiworkshop/<slug>`, có cổng `notFound()` ở production.
   Màn thuộc một hành trình trong `EXPERIENCE.md § Key Flows` → thêm/sửa bước tương ứng ở
   `_registry/flows.ts` (trục **Luồng**).
2. **Duyệt & sửa tay** bản xem thử thật.
3. **Dev promote**: **di chuyển** file ra route thật, thay `_mock/seed` bằng lời gọi `core/` (không
   bao giờ gọi thẳng `db/`), giữ nguyên JSX/layout/class; xoá bản trong `uiworkshop` + entry
   `outline.ts` (+ bước ở `flows.ts`).

> `/uiworkshop` có **hai trục**: **outline** (bề mặt → FR → view) trả lời *"màn này thuộc yêu cầu
> nào"*; **Luồng** — bản đồ hành trình zoom được, node là màn thật, cạnh mang chip trigger — trả
> lời *"sau màn này là màn nào"*.

## 6. Lệch đã biết so với spine

| | Spine chốt | Thực tế | Việc phải làm |
|---|---|---|---|
| TypeScript | 7.0.2 | 5.9.3 (`create-next-app` mang về) | Quyết trước story đầu tiên: nâng lên 7 rồi chạy lại `tsc --noEmit`, hoặc sửa spine xuống 5.9. Đừng để lệch âm thầm |

`core/` và `db/` **chưa dựng** — thuộc giai đoạn dev. Cây hiện có: `app/`, `components/ui/`,
`components/pha/`, `lib/`, `specs/`.

**`components/pha/` — component SẢN PHẨM, thêm 11/08/2026.** Khác `components/ui/` (primitive
shadcn, repo sở hữu mã nhưng khuôn là của shadcn): đây là component mang ngữ nghĩa phả họ, dùng
lại trên nhiều màn, và **đi theo màn khi dev promote**. Đặt trong `app/uiworkshop/` thì promote
xong là mất; đặt trong `components/ui/` thì lẫn với primitive.

Ràng buộc giữ nguyên: không import tầng dữ liệu (AD-1), token có tên, không hardcode hex.
Hiện có: `thanh-dieu-huong.tsx` (điều hướng gốc bề mặt A) · và bốn file của cây, `'use client'`
cả bốn:

**`components/admin/` — root THỨ BA, thêm 24/08/2026 (story 5-1).** Ngang hàng với
`components/pha/` và `components/ui/`, KHÔNG nằm dưới `components/pha/` — đó là hai bề mặt khác
nhau: `pha/` mặc giấy dó cho người trong họ, `admin/` là khung trần của bàn tu phả
(`DESIGN.md § Colors › Bề mặt B`). Trộn vào một chỗ là mời người sau dùng nhầm tông.

| File | Việc |
|---|---|
| `khung-admin.tsx` | `'use client'` — vỏ `/admin`: thanh trên, thanh việc, `<h1>` của màn, trạng thái thu/mở |
| `man-admin.ts` | **Dữ liệu thuần, không phải component.** Bản đồ màn: nhãn thanh việc · `<h1>` · tiêu đề thẻ · mục nào đang mở |

Ràng buộc y hệt `components/pha/`: không import `@/core/*` (build-contract § Phân tầng), token có
tên, không hardcode hex.

> **Sửa 29/08/2026 (story 6-10) — bề mặt A MƯỢN được phần "dữ liệu phả" của `components/admin/`.**
> Thẻ người (`the-nguoi.tsx`), canvas (`khung-cay-admin.tsx`), phiếu (`cot-khang-dinh.tsx`), ba
> biểu mẫu ghi và bộ chọn người là **dữ liệu phả**, không phải khung — `DESIGN.md § Bề mặt B`
> nói chúng vẽ y hệt ở hai bề mặt. Cái khác là ba token `ban-*`; bề mặt A bọc chúng trong lớp
> `.tren-giay` (`app/globals.css`) trỏ ba token ấy về giấy dó. KHÔNG chép component sang `pha/`:
> hai bản của cùng một phiếu lệch nhau ở lượt sửa đầu. Component nào mọc nút duyệt hay câu chữ
> của bàn tu phả thì nhận `beMat: 'A' | 'B'` — prop BẮT BUỘC.

### Component của cây (`components/pha/`)

| File | Việc |
|---|---|
| `khung-cay.tsx` | **Vỏ dùng chung** cho cả ba tầng: React Flow, nút phóng/thu, `xepCay`, chip tin cậy |
| `cay-gia-pha.tsx` | Node = **một cặp** (người + vợ/chồng). Dùng cho tầng 2 **và** tầng 3 |
| `cay-ca-toc.tsx` | Node = **khối chi**. Tầng 1 |
| `cay-tai-dong.tsx` | **Cổng duy nhất** các màn được đi qua — xem luật tải động dưới đây |

Ba tầng khác nhau ở **node**, không ở vỏ. Dựng ba vỏ riêng thì đổi một luật của vỏ phải sửa ba
chỗ. Tầng 3 không có component riêng: một đường huyết thống chỉ là cây mà mỗi node có đúng một con.

### React Flow — ranh giới sử dụng

Thêm 11/08/2026 cho màn cây. **Chỉ dùng nó làm khung nhìn**: zoom, pan, nhánh nối, nút phóng/thu.

- **Thẻ người là component của mình** (`TheNguoi` trong `cay-gia-pha.tsx`) — token có tên,
  `serif-phả`, nét đứt + vân giấy cho tồn nghi. React Flow không đặt một pixel nào bên trong thẻ.
- **Bố cục tự tính** (`xepCay`), không thêm dagre/elkjs: cây phả là cây thật (mỗi node một cha)
  nên luật "cha đứng giữa bề rộng của các con" là đủ.
- **Không dùng `<Background/>`** chấm lưới — lưới chấm là ngôn ngữ của công cụ vẽ sơ đồ, kéo sản
  phẩm về phía "phần mềm" (DESIGN.md § Brand & Style).
- `'use client'` ở đây là **ngoại lệ có lý do**: zoom/pan là tương tác thật. Các màn khác giữ
  server component.
- **TẢI ĐỘNG, KHÔNG ẨN BẰNG CSS.** Màn không được `import` thẳng `cay-gia-pha.tsx` hay
  `cay-ca-toc.tsx`; phải qua `cay-tai-dong.tsx`
  (`next/dynamic` + `matchMedia('(min-width: 768px)')`, `ssr: false`).
  Đo trên production: bọc bằng `hidden md:block` thì điện thoại vẫn tải **+177 KB thô / ~57 KB
  nén** và vẫn hydrate; qua lớp tải động còn **+5 KB**. Ngưỡng 768px phải trùng breakpoint `md`
  mà màn dùng để ẩn/hiện khối cây.
- ⚠️ **Chưa giải quyết:** huy hiệu attribution của React Flow đang hiện. Gỡ nó cần bản Pro trả
  phí. Phải quyết trước khi lên production — giữ huy hiệu, hoặc mua giấy phép.

## 7. Luật cứng

- `app/` ở gốc, import UI qua `@/components/...`. Token đổi ở `@theme` ⇒ đổi cả `DESIGN.md`.
- Prototype chỉ sống trong `app/uiworkshop/`, có cổng `notFound()` ở production.
- Trước commit: `npx tsc --noEmit` · `npx eslint .` · `npm run build`.
