# UI Workshop — xưởng dựng thử giao diện

> Đọc kèm `specs/frontend-stack.md` (hợp đồng viết giao diện) và `SETUP.md` của kit.

Xưởng dựng thử các màn giao diện bằng **chính stack thật** (Next App Router + shadcn/ui + token qua
`@theme`), chỉ khác là dùng **mock data**. Mục đích: nhìn trực quan để hiểu hệ thống, cho người
duyệt sửa tay trước khi dev hiện thực. Đây là **mã khởi điểm** cho dev (promote ra route thật),
không phải hình minh hoạ vứt đi.

## Xem

```bash
npm run dev
# mở http://localhost:3000/uiworkshop
```

Sửa bất kỳ file nào dưới `app/uiworkshop/` → trình duyệt tự nạp lại ngay.

## Hai trục

| Trục | Trả lời câu hỏi | Ở đâu |
|---|---|---|
| **Bề mặt → FR → view** | “Màn này thuộc yêu cầu nào?” | `_registry/outline.ts` |
| **Luồng** (hành trình) | “**Sau màn này là màn nào?**” | `_registry/flows.ts` |

### Trục 1 — outline theo YÊU CẦU (FR), không theo story

Vì sao không theo story: một user story là **lát cắt thực hiện**, thường quá nhỏ để là một view, và
nhiều story cùng đổ vào một màn. Nên trục chính là **FR** (mỗi FR là một feature có ≥1 view), còn
**story tụt xuống thành nhãn truy vết** dưới view — mang trạng thái **sống** đọc từ sprint-status
của BMAD. Trên FR còn một tầng **bề mặt** (app mobile / dashboard desktop / màn công cộng…): chuẩn
chrome khác nhau thì không nên trộn chung một danh sách phẳng, và bề mặt cũng quyết định **khung
xem mặc định** của view thuộc nó.

### Trục 2 — LUỒNG (bản đồ hành trình)

Outline không trả lời được “sau màn này là màn nào”. Trong BMAD, hành trình sống ở
`EXPERIENCE.md § Key Flows` dưới dạng **văn xuôi** — không bấm được, không kiểm được, và trôi khỏi
mã nguồn mà không ai biết. Mục **Luồng** ở đầu sidebar mở ra một **bản đồ zoom/pan**: node là màn
thật (iframe của chính prototype), cạnh mang **chip trigger** (hành vi đưa tới bước sau); bấm chip
→ bản đồ bay tới và canh giữa bước kế tiếp. Bước nào chưa có màn thì hiện **ô trống có tên** — lỗ
hổng tự lộ ra thay vì im lặng.

Điều khiển: kéo để di chuyển · cuộn để zoom · `←`/`→` đổi bước · `0` vừa khung · `F` (hoặc nút
**⤢ toàn màn**) bật toàn màn hình, `Esc` để thoát.

`FLOWS` rỗng là hợp lệ — mục Luồng tự ẩn cho tới khi bmad-ux có Key Flows để chép vào.

## Khung xem Mobile / Web

Switch ở thanh trên. Màn được nhúng qua **iframe** ở đúng bề rộng nên breakpoint responsive tính
theo viewport iframe (mobile THẬT, không phải khung thu nhỏ). Xưởng **nhớ lựa chọn theo từng view**
(`localStorage`); chưa chọn bao giờ thì lấy mặc định của **bề mặt**.

```
app/uiworkshop/
  layout.tsx              # CỔNG CHẶN SHIP (404 ở production) + nền; màn TRẦN render ở đây
  (shell)/                # vỏ xưởng — chỉ bọc tổng quan/trình xem, KHÔNG bọc màn trần
    layout.tsx            #   sidebar + thanh trên + ViewportProvider
    page.tsx              #   Tổng quan (thống kê sống)
    view/[slug]/page.tsx  #   trình xem một màn (nhúng iframe qua DeviceFrame)
    flow/[id]/page.tsx    #   một luồng = một bản đồ hành trình
  _registry/
    sprint.ts             # đọc trạng thái story từ sprint-status.yaml (server): readStoryIndex()
    outline.ts            # ⚙️ bề mặt → FR → view, ánh xạ story, FR chưa dựng, khung xem mặc định
    flows.ts              # ⚙️ luồng: bước + trigger (+ bố cục bản đồ, giữ nguyên)
  _components/
    sidebar.tsx           # outline + trục luồng (client)
    viewport.tsx          # khung Mobile/Web, nhớ theo từng view
    device-frame.tsx      # nhúng màn trần qua iframe
    flow-map.tsx          # bản đồ luồng: zoom/pan, chip trigger, toàn màn hình
  _mock/seed.ts           # ⚙️ dữ liệu mock DÙNG CHUNG (thư mục _ không thành route)
  design-system/          # ⚙️ từ điển thị giác: token + component thật
  <slug>/page.tsx         # mỗi màn một thư mục
```

`⚙️` = nội dung của project, bạn viết. Còn lại là plumbing, đồng bộ từ kit.

## Thêm màn mới

Tạo `app/uiworkshop/<slug>/page.tsx`, rồi thêm một `View` vào đúng nhóm trong `REQ_GROUPS`
(`_registry/outline.ts`), khai báo `storySlugs` là các story sprint-status đã nhào nặn màn đó (để
hiện chấm trạng thái). Ví dụ:
`{ slug: 'detail', label: 'Trang chi tiết', storySlugs: ['1-2-detail-page'] }`.

- FR đã có nhóm → thêm vào `views`. FR mới → thêm một `ReqGroup` (section, fr, title, epics, views).
- FR chưa có màn nào → để trong `PLANNED_REQS`; khi dựng màn đầu thì chuyển sang `REQ_GROUPS`.
- Bề mặt không thuộc FR nào (từ điển thị giác) → `FOUNDATION`.
- Màn có khung xem khác mặc định của bề mặt → khai `viewport: 'web' | 'mobile'` ngay trên `View`.

Story hạ tầng/quy trình/spike (không có gì để nhìn) **không cần** một màn — chúng chỉ xuất hiện làm
chấm dưới màn mà chúng có đóng góp, hoặc không xuất hiện.

## Thêm một luồng

Sửa `EXPERIENCE.md § Key Flows` **trước** (nhân vật có tên + nhịp cao trào — việc của bmad-ux), rồi
chép sang `_registry/flows.ts`: mỗi bước là `{ slug, label, trigger }`, `slug: null` cho bước chưa
có màn, `source` trỏ về đúng luồng trong spine. Luồng nào `source: null` = chưa distill vào spine,
coi như **nợ tài liệu** — ghi vào sổ nợ của project.

## Ranh giới (giữ "như thật")

- ⛔ **Không bao giờ lên production** — `layout.tsx` trả 404 khi build prod.
- **Tĩnh, mock-only:** server component; KHÔNG import tầng dữ liệu/auth thật (service, ORM, auth,
  server action, `notFound/redirect`). Form là hình ảnh (không `action`, nút `type="button"`). Có
  vậy màn mới mở được trong khu làm việc mà không cần DB seed / đăng nhập — và nhúng được vào bản
  đồ luồng.
- Component chỉ lấy từ `@/components/ui/*` — cần biến thể mới thì thêm vào chính primitive đó,
  đừng dựng thẻ mới lệch khuôn.
- **Token có tên, không hardcode hex.**
- Khi một màn chốt, **dev PROMOTE**: di chuyển file ra route thật + thay `_mock/seed` bằng dữ liệu
  thật (giữ nguyên JSX/layout/class), rồi xoá bản trong xưởng + entry `outline.ts` (và bước tương
  ứng trong `flows.ts` nếu có).
