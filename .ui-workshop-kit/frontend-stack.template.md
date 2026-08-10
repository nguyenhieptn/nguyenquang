# Chuẩn stack frontend — <PROJECT>

> Tầng: **spec (HOW)**. Đây là *hợp đồng viết giao diện* — cách dựng component/page/prototype sao
> cho **dùng lại được**. Không lặp lại quyết định kiến trúc hay token (token ở DESIGN.md).
> Template của UI Workshop Kit — điền theo stack thật của project.

## 1. Stack chuẩn (nguồn: `package.json`)

| Lớp | Công nghệ | Ghi chú |
|---|---|---|
| Framework | **Next.js App Router** — `app/` ở gốc repo | — |
| Ngôn ngữ | **TypeScript** strict, React | — |
| Style | **Tailwind v4** CSS-first bằng `@theme` | token gọi theo tên |
| Component | **shadcn/ui** — copy vào `src/components/ui/`, đội tự sở hữu mã | — |
| Ghép class | `cva` (biến thể) + `cn()` (clsx + tailwind-merge) | — |
| Alias | `@/*` → `src/*`. **`app/` KHÔNG dưới `src/`** | `tsconfig.json` |

## 2. Chuỗi nguồn sự thật của token — một chiều

```
DESIGN.md ──(chép tay)──▶ app/globals.css @theme ──▶ class Tailwind
(bản sắc)                  (--color-brand: …)        (bg-brand)
```

- **DESIGN.md thắng** khi xung đột. Không hardcode hex khi đã có token.

## 3. Hợp đồng viết component

- **Tái dùng primitive `src/components/ui/*` trước** khi tự viết; cần biến thể mới → thêm vào
  `variants` của primitive đó, đừng dựng thẻ mới.
- `asChild` + `Slot` khi cần đổi thẻ gốc. Component cần state/hook → `'use client'`.

## 4. Luồng prototype → production (UI Workshop)

1. **bmad-ux render** → `app/uiworkshop/<slug>/page.tsx` + đăng ký `View` vào `REQ_GROUPS`
   (`_registry/outline.ts`) theo đúng **FR**. Mock từ `_mock/seed.ts`, token có tên. Xưởng là
   route xem thử được (`/uiworkshop/<slug>`) có cổng `notFound()` ở production.
   Màn thuộc một hành trình trong `EXPERIENCE.md § Key Flows` → thêm/sửa bước tương ứng ở
   `_registry/flows.ts` (trục **Luồng**).
2. **Duyệt & sửa tay** bản xem thử thật.
3. **Dev promote**: **di chuyển** file ra route thật, thay `_mock/seed` bằng dữ liệu thật, giữ
   nguyên JSX/layout/class; xoá bản trong `uiworkshop` + entry `outline.ts` (+ bước ở `flows.ts`).

> `/uiworkshop` có **hai trục**: **outline** (bề mặt → FR → view) trả lời *"màn này thuộc yêu cầu
> nào"*; **Luồng** — bản đồ hành trình zoom được, node là màn thật, cạnh mang chip trigger — trả
> lời *"sau màn này là màn nào"*.

## 5. Luật cứng

- `app/` ở gốc, import UI qua `@/components/...`. Token đổi ở `@theme` ⇒ đổi cả DESIGN.md.
- Prototype chỉ sống trong `app/uiworkshop/`, có cổng `notFound()` ở production.
- Trước commit: chạy format + lint + typecheck + test của project.
