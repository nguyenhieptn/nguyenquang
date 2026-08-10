# UI Workshop Kit — cắm vào project BMAD khác

Gói tái dùng của **xưởng dựng thử giao diện** + **wiring quy trình bmad-ux → workshop → dev**.
Ý tưởng: UX render prototype React **vào xưởng**, dev **tham chiếu rồi promote** ra route thật.

**Xưởng có hai trục** (đọc `app-uiworkshop/README.md` để hiểu vì sao):

| Trục | Trả lời | Nguồn dữ liệu |
|---|---|---|
| **Nhóm màn → FR → view** | “Màn này thuộc yêu cầu nào?” | `_registry/outline.ts` (bạn viết, từ PRD) |
| **Luồng** (bản đồ hành trình) | “**Sau màn này là màn nào?**” | `_registry/flows.ts` (bạn viết, từ `EXPERIENCE.md § Key Flows`) |

Kèm: khung xem **Mobile/Web** nhúng qua iframe (breakpoint tính theo viewport thật, nhớ lựa chọn
theo từng view) và **cổng chặn ship** (404 ở production).

---

## 0. Cắm bằng 3 lệnh

Đứng ở **gốc repo đích**, trỏ tới thư mục kit:

```bash
KIT=<đường-dẫn>/ui-workshop-kit

node "$KIT/kit.mjs" doctor     # kiểm điều kiện tiền đề, KHÔNG ghi gì
node "$KIT/kit.mjs" install    # cắm (tự dừng nếu doctor còn lỗi cứng)
npm run dev                    # mở /uiworkshop
```

`install --sprint <path>` vá luôn đường dẫn `sprint-status.yaml` — bớt một trong hai điểm cấu hình.

`doctor` **kiểm** đúng những gì plumbing cần thay vì bắt bạn tự đối chiếu văn xuôi: `app/` ở gốc
repo · alias `@/*` · `card` của shadcn có đủ `Card`/`CardBody`/`CardTitle` · file **CSS gốc** (nơi
`@import 'tailwindcss'`) · `_bmad/` · `sprint-status.yaml`. Thiếu gì nó gọi tên thứ đó (kèm câu
lệnh sửa). Hai cái cuối chỉ là **cảnh báo**: xưởng vẫn chạy, chỉ mất phần cây story động.

**Token thì bạn không phải chuẩn bị gì.** Vỏ xưởng chỉ gọi token trung tính `ws-*`, và kit tự mang
bảng mặc định trong `app/uiworkshop/tokens.css` (`install` chép vào + tự thêm dòng `@import` vào CSS
gốc). Cắm xong là coi được ngay; muốn xưởng mang màu brand thì sửa **vế phải của 16 dòng** trong
file đó:

```css
--color-ws-accent: var(--color-brand-600); /* thay cho hex mặc định */
```

Không phải đi dò 9 file plumbing — và `upgrade` sau này vẫn kéo plumbing mới về mà không đụng brand.

> Namespace Tailwind v4 dễ sai: thời lượng là `--transition-duration-*` (**không** phải
> `--duration-*` — tên sai thì `duration-…` im lặng không sinh class nào), nhịp là `--ease-*`.

## 1. Ba lớp, ba luật

Ranh giới nằm ở `workshop.manifest.json`, không nằm trong trí nhớ ai:

| Lớp | Gồm | Luật |
|---|---|---|
| **plumbing** | vỏ xưởng, trình xem, bản đồ luồng (9 file) | generic, có `sha256`, **`upgrade` cập nhật được** |
| **skeleton** | `tokens.css` · `_registry/*` · `_mock/seed.ts` · `design-system` · `README` · `_bmad/custom/*.toml` · `specs/frontend-stack.md` | chép **một lần**, sau đó **project sở hữu** — `upgrade` không bao giờ đè (nhưng có tạo file khung MỚI ở upstream) |
| *(không mang)* | màn mock, danh sách FR, luồng, DESIGN.md/EXPERIENCE.md | nội dung riêng từng project |

Luật giữ plumbing generic được **máy ép**: `pack` fail nếu plumbing lọt tên riêng của project, dùng
token của project thay vì `ws-*`, hoặc import ra ngoài allowlist (`react` · `next/*` ·
`@/components/ui/*` · đường dẫn tương đối). Mọi nhãn của project phải đọc từ `_registry/*`, mọi màu
phải đi qua `tokens.css`.

## 2. Hai điểm cấu hình bắt buộc

1. **`_registry/sprint.ts`** — đường dẫn `sprint-status.yaml` (đánh dấu `⚙️ ĐIỂM CẤU HÌNH`), hoặc
   dùng `install --sprint`. Định dạng epic→story mặc định của BMAD giữ nguyên nên hàm parse không
   cần đổi.
2. **`_registry/outline.ts`** — `SectionKey` + `SECTIONS`: đặt tên các **nhóm màn** của product bạn
   (2–5 cái). Đây cũng là nơi quyết định **khung xem mặc định** mobile/web cho từng nhóm.

## 3. Checklist viết "ruột" theo project (thay nội dung, giữ khung)

0. **`tokens.css`** — trỏ 16 token `ws-*` về hệ màu của bạn (mặc định chạy được nên không gấp).
1. **`_registry/outline.ts`** — điền `REQ_GROUPS` theo **FR** trong PRD; FR chưa dựng để
   `PLANNED_REQS`; `FOUNDATION` giữ `design-system`. Mỗi `View` khai `storySlugs` khớp key story
   trong sprint-status.
2. **`_registry/flows.ts`** — để `FLOWS = []` cho tới khi bmad-ux có `EXPERIENCE.md § Key Flows`;
   rồi chép từng luồng theo mẫu ở cuối file. **Mục "Luồng" tự ẩn khi rỗng** nên không cần vội.
   Phần bố cục bản đồ (`layoutFlow`, `GAP`, `HEAD_H`) **giữ nguyên**.
3. **`_mock/seed.ts`** — thay entity mẫu bằng dữ liệu mock dùng chung của project.
4. **`design-system/page.tsx`** — bảng token + component thật của brand.
5. **`specs/frontend-stack.md`** — bảng stack (framework, thư viện component, nguồn token) + luồng
   prototype → production.
6. **Override `_bmad/custom/*.toml`** — thay `<PROJECT>` bằng tên project; sửa đường dẫn
   `<path-to>/DESIGN.md` và `EXPERIENCE.md`; giữ các `file:` còn trỏ đúng.
7. **`react-key-screens.md`** — thay `<PROJECT>`; ví dụ token đổi cho khớp brand.

> **Binding override:** BMAD chỉ nạp override ở **`_bmad/custom/<tên-skill>.toml` đặt ngay gốc**
> `custom/` (vd `_bmad/custom/bmad-ux.toml`) — `install` đặt sẵn đúng chỗ. File `*.user.toml` là cá
> nhân (gitignore). Bản kit nằm trong `_bmad/custom/ui-workshop-kit/` nên **không** tự kích hoạt.

## 4. Nghiệm thu sau khi cắm

```bash
npm run dev        # mở /uiworkshop
npx tsc --noEmit   # 0 lỗi
npx eslint app/uiworkshop
```

Bằng mắt, theo thứ tự:

1. Sidebar hiện **Tổng quan · (Luồng nếu có) · Nền tảng · từng nhóm màn · FR chưa dựng**; chấm
   trạng thái bên phải view khớp `sprint-status.yaml` (di chuột ra tooltip id + status).
2. Bấm một view → mở trong khu làm việc; switch **Mobile/Web** ở thanh trên đổi khung; chọn Web
   rồi quay lại view đó → **vẫn Web** (nhớ theo từng view, `localStorage`).
3. Nếu đã có luồng: bấm một luồng → bản đồ; bấm **chip trigger** → bay tới bước sau; nút
   **⤢ toàn màn** → toàn màn hình và bản đồ **tự canh lại**.
4. `NODE_ENV=production npm run build && npm start` → `/uiworkshop` phải **404**.

`install` tự thêm thư mục kit vào `exclude` của `tsconfig.json` nếu bạn để kit trong repo (kit là
template, không phải mã app). eslint/prettier thường đã ignore `_bmad/**`.

## 5. Nâng cấp về sau — `upgrade`

Đây là chỗ mô hình copy-in thường chết: nửa năm sau upstream sửa plumbing mà project đã cắm không
có đường nhận. Lúc `install`, kit ghi **baseline sha** vào `app/uiworkshop/.workshop-kit.json`
(commit file này), nên `upgrade` phân biệt được ba trường hợp:

```bash
node "$KIT/kit.mjs" upgrade --dry   # xem trước, không ghi
node "$KIT/kit.mjs" upgrade
```

- `=` giống hệt → bỏ qua.
- `↑` bạn **chưa** động vào file → cập nhật thẳng.
- `!` bạn **đã sửa** → **không đè**, in sẵn lệnh `git diff --no-index` để tự trộn (`--theirs` để đè).

Riêng **skeleton** thì không đè bao giờ; thay vào đó mỗi lần khung đổi (thêm field vào
`View`/`FlowStep`, đổi parser `sprint`), `pack` tăng **`shapeRev`** và `upgrade` báo *"khung đổi,
soát tay"*. Chính lỗ hổng này đã cắn một lần: plumbing thêm `step.query` mà template `flows.ts`
không có field đó — kit vẫn xanh, project cắm mới thì gãy.

## 6. Bẫy đã trả giá thật (đọc trước khi sửa plumbing)

Bốn thứ này đã tốn thời gian gỡ ở repo nguồn — đừng gỡ lại từ đầu:

- **`main` thiếu `min-w-0` / grid thiếu `grid-cols-1`.** Canvas bản đồ luồng rộng ~6000px sẽ **kéo
  giãn cả khu làm việc** thay vì bị cắt trong khung cuộn của nó (flex item mặc định
  `min-width:auto`; grid không khai cột thì cột ngầm là `max-content`).
- **`setPointerCapture` để kéo bản đồ giết click.** Bắt con trỏ về khung khiến `pointerdown` và
  `pointerup` cùng bắn vào khung nên `click` dispatch lên khung, **không** lên nút — chip trigger
  im lặng. Dùng listener tạm trên `window`.
- **Đọc `localStorage` bằng `useEffect` + `setState`** vi phạm `react-hooks/set-state-in-effect` và
  nháy khung sai lúc hydrate → dùng `useSyncExternalStore` (đã làm sẵn trong `viewport.tsx`).
- **Canh khung chỉ một lần lúc mount** → vào toàn màn hình xong bản đồ vẫn ở tỉ lệ khung cũ.
  `flow-map.tsx` nhớ **ý định cuối** (vừa khung / đang ở node nào) và canh lại mỗi lần đổi cỡ.

## 7. Cái gì KHÔNG mang / tự sinh lại

- `.claude/skills/bmad-*` — cài lại bằng BMAD; override ở `_bmad/custom/` tự áp lại.
- Màn mock, seed, danh sách FR, luồng, DESIGN.md/EXPERIENCE.md — nội dung riêng từng project.

## 8. Giữ kit đồng bộ với sản phẩm (ở repo NGUỒN)

Kit là **snapshot tách biệt** — sửa `app/uiworkshop/` KHÔNG tự cập nhật kit.

```bash
npm run workshop:pack     # đồng bộ plumbing sống → kit, cập nhật lock, guard, kiểm kiểu
npm run workshop:check    # chỉ báo lệch (đã nằm trong `npm run verify`)
```

`pack` làm bốn việc: copy plumbing sống → kit · **guard** (plumbing còn generic không) · cập nhật
`workshop.lock.json` (sha plumbing + `shapeRev` skeleton) · `tsc -p tsconfig.kit.json`. Bước cuối
quan trọng vì kit bị `exclude` khỏi tsconfig của app nên **`npx tsc --noEmit` bình thường không hề
đụng tới nó** — không có gác này thì kit mục ruỗng mà build vẫn xanh.

Thêm file vào kit hay đổi lớp của một file → sửa `workshop.manifest.json`, đừng sửa
`workshop.lock.json` (sinh tự động). Phát hành bản mới thì bump `version` trong manifest.

## 9. Lưu ý phiên bản

Override bám vào surface mà `customize.toml` của từng skill khai báo (`persistent_facts`,
`creative_tools`, `on_complete`). Sau khi cài BMAD ở project mới, mở
`.claude/skills/<skill>/customize.toml` xác nhận các key này còn tồn tại (cùng dòng BMAD v6).
