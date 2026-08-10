# React Key Screens Renderer (<PROJECT> override)

Prompt cho subagent. Thay renderer HTML mặc định (`assets/key-screens.md`) khi làm UX cho
<PROJECT>. Bắn ở Finalize (hoặc cuối Discovery khi layout đã chắc). Sinh **page React 1:1 trong
chính stack của dự án**, để dev tái dùng thẳng — mock chính là mã khởi điểm, không phải hình
minh hoạ. Spine (`EXPERIENCE.md`/`DESIGN.md`) vẫn là hợp đồng; prototype chỉ hiện thực nó.

> Đọc `specs/frontend-stack.md` trước khi render — nó là hợp đồng viết giao diện của dự án.

## Inputs

`.memlog.md`, bản nháp `DESIGN.md` + `EXPERIENCE.md`, `.working/` (theme màu + direction đã
chọn), PRD nguồn, và **`{project-root}/specs/frontend-stack.md`**. Người dùng nêu bề mặt cần
render — thường 2–4: trang vào chính, hero của luồng phức tạp nhất, overlay/modal chịu tải, và
(nếu có) trang danh sách/dashboard.

## Render cái gì

Một page React cho mỗi bề mặt, tại **`app/uiworkshop/<slug>/page.tsx`** trong repo thật, và
**đăng ký vào outline theo REQUIREMENT** ở `app/uiworkshop/_registry/outline.ts` (KHÔNG còn mảng
`SCREENS`; xưởng đã đổi sang trục FR — xem `app/uiworkshop/README.md`):

- Thêm một `View` `{ slug, label, storySlugs: [...] }` vào `views` của **đúng nhóm `ReqGroup`**
  (khoá theo FR mà bề mặt hiện thực). `storySlugs` là các story sprint-status mà bề mặt phục vụ —
  hiện thành chip trạng thái sống dưới view.
- FR đó **chưa có nhóm** (đang nằm trong `PLANNED_REQS`) → gỡ khỏi `PLANNED_REQS`, tạo một
  `ReqGroup` mới `{ fr, title, epics, views }`. FR mới hoàn toàn → thêm `ReqGroup` mới.
- Bề mặt không thuộc FR nào (từ điển thị giác) → `FOUNDATION`.
- Bề mặt có khung xem khác mặc định của bề mặt cha → khai `viewport: 'web' | 'mobile'` trên `View`.
- Bề mặt là **một bước trong `EXPERIENCE.md § Key Flows`** → thêm/sửa bước tương ứng ở
  `app/uiworkshop/_registry/flows.ts` (`{ slug, label, trigger }`); bước chưa có màn để `slug: null`.
  Bản đồ luồng ở `/uiworkshop/flow/<id>` là chỗ duy nhất KIỂM được hành trình bằng mắt.

- **Dùng primitive có sẵn** từ `@/components/ui/*` (button, card, chip, badge, checkbox, field,
  section, select, table, content-image, empty-state) và component app (`@/components/…`). Cần
  biến thể chưa có → thêm vào `variants` của primitive đó, hoặc ghi vào spine + hỏi, **không**
  tự dựng thẻ mới ngoài khuôn.
- **Tĩnh, mock-only, không phụ thuộc hạ tầng:** server component (mặc định), KHÔNG import
  `@/core/*`, `@/lib/operator-auth`, `@/generated/*`, prisma/service/server-action hay
  `next/navigation` (notFound/redirect). Form là hình ảnh (không `action`, nút `type="button"`).
  Có vậy màn mới mở được trong khu làm việc mà không cần DB seed / đăng nhập.
- **Token có tên**, không hardcode hex: gọi token brand/neutral/semantic của project (vd
  `bg-brand`, `text-body-ink`, `border-n-20`, `rounded`, `min-h-12`). Nguồn token là `@theme` trong
  `app/globals.css` (bắt nguồn từ DESIGN.md).
- **Nội dung thật** từ hội thoại (không lorem); mọi chuỗi đã soi qua Voice/Tone trong `.memlog.md`.
- **Dữ liệu mock dùng chung**: lấy từ `app/uiworkshop/_mock/seed.ts` (thêm field nếu thiếu, giữ
  cả xưởng nhất quán) — đừng bịa dữ liệu rời cho từng màn. Dev thay bằng data thật khi promote.
  Prototype là server component tĩnh; chỉ thêm `'use client'` khi bề mặt đòi tương tác thật.
- **Một state chuẩn** mỗi màn; state phụ chịu tải (focus, error, rỗng) → render thành section
  thứ hai trong cùng file.
- Đầu file: comment ghi **spine section nào chi phối màn này** (Component Patterns / State
  Patterns / Flow) để người đọc sau biết đối chiếu ở đâu.

## Cổng chặn ship (bắt buộc)

`app/uiworkshop/layout.tsx` đã có sẵn cổng chặn (`notFound()` khi production) — tái dùng, đừng
tạo lại. Nếu vì lý do gì nó thiếu, khôi phục theo `app/uiworkshop/README.md`.

Prototype xem tại `http://localhost:3000/uiworkshop/<slug>` (và thư viện ở `/uiworkshop`) khi
chạy `npm run dev`.

## Trả về cái gì

Tóm tắt gọn cho parent:
- đường dẫn file mỗi màn (`app/uiworkshop/<slug>/page.tsx`)
- FR + `ReqGroup` đã đăng ký vào, và `storySlugs` đã gắn
- một dòng caption mỗi màn
- spine section mỗi màn minh hoạ (để parent chèn link vào đúng mục spine ở Finalize)
- primitive/biến thể mới cần thêm (nếu có) — để log, không tự quyết

> **Bàn giao cho dev:** màn ở đây là **mã khởi điểm**, không phải hình vứt đi. Khi dev vào story
> tương ứng, họ **promote** (di chuyển ra route thật, thay `_mock/seed` bằng Prisma, giữ nguyên
> JSX/layout/class, xoá bản xưởng + entry trong `outline.ts`) — xem `specs/frontend-stack.md` §5.

## Anti-pattern

- Không bịa layout — mọi quyết định bố cục phải truy được về `.working/` hoặc xác nhận trong
  `.memlog.md`. Layout còn mở thì render là non.
- Không render mọi màn của mọi luồng — 2–4 bề mặt chịu tải.
- Không viết cứng hex, không HTML tĩnh, không CSS inline. Sai stack = mất mục tiêu tái dùng.
- Không đổ prototype vào route thật (`app/poi`, `app/(cms)`…). Chỉ `app/uiworkshop/`. Dev sẽ di
  chuyển ra khi promote (xem `specs/frontend-stack.md` §5).
- Không thêm pattern chưa có trong Component Patterns của spine. Cần thì log + hỏi trước.
