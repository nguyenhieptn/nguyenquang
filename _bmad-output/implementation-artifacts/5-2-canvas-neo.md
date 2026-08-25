# Story 5.2: Canvas có neo — lân cận quanh một người

Status: review

## Story

Là **người trong Ban tu phả**,
tôi muốn **một canvas gia phả ở giữa bàn làm việc, bày vùng lân cận quanh một người tôi chọn làm tâm**,
để **tôi có chỗ ĐỨNG khi làm việc — thấy một người trong quan hệ của họ, chứ không phải một dòng trong bảng**.

## Bối cảnh: vì sao là "lân cận quanh một neo", không phải "cả cây"

Cây cả họ vẽ ra thì không đọc được và không thao tác được. Bàn tu phả không làm việc với cả họ một
lúc — họ làm việc với **một người và những người quanh người ấy**: có ai gọi báo một cụ vừa mất, mở
ra chỗ cụ ấy đứng, nhìn cha con vợ chồng quanh đó, rồi ghi.

Nên đơn vị của canvas này là **vùng lân cận quanh một NEO**, và neo dời được. Đó cũng là lý do
story sau (5-3) mới là chồng khẳng định: canvas cho chỗ đứng, panel cho công cụ.

**Quy tắc dễ làm sai nhất, và epic đã ghi hẳn ra:** *chọn một node **KHÔNG** dời neo.* Bấm vào một
người là để XEM họ. Nếu mỗi cú bấm lại dời tâm và vẽ lại cả vùng thì canvas nhảy liên tục và không
ai giữ được chỗ đứng — đúng thứ story này sinh ra để cho. Dời neo là hành động **riêng**: nút "Đặt
làm tâm", hoặc ô tìm trên thanh trên.

## Acceptance Criteria

### Bề mặt core — vùng lân cận là DẪN XUẤT, tính lúc đọc

1. `core/tree/index.ts` có thêm **`getNeighborhood(anchorPersonId, radius)`** trả
   `Result<Neighborhood>`. Đây là AC nặng nhất của story và nó **không có trong dòng mô tả của
   epic**: `bfsDistances` nằm ở `core/tree/ops.ts`, mà `docs/build-contract.md:41` cấm adapter
   import `core/*/ops`. Không có entry point này thì `app/` không có đường nào lấy vùng lân cận.
2. `getNeighborhoodOps(tx, ctx, anchorPersonId, radius)` trong `core/tree/ops.ts`, dựng trên
   `loadTreeData` + `computeStructure` + `bfsDistances(data, anchorId, radius)` đã có
   (`ops.ts:396`). **Không viết BFS mới.**
3. Hình dạng trả về:
   ```ts
   export type NeighborhoodNode = CoupleNode & {
     /** Cha của node này, CHỈ khi cha cũng nằm trong vùng. Ngoài vùng ⇒ null ⇒ gốc của bố cục. */
     parentNodeId: string | null;
     /** Khoảng cách BFS tới neo — 0 là chính neo. */
     distance: number;
   };
   export type Neighborhood = {
     anchorPersonId: string;
     radius: number;
     nodes: NeighborhoodNode[];
     /** true khi bán kính đã trùm hết mảnh — nới thêm KHÔNG ra thêm ai. */
     exhausted: boolean;
   };
   ```
4. **`parentNodeId` do CORE tính, không để client suy.** Đây là cấu trúc dẫn xuất nên nó là việc
   của core (AD-5). Người có cha nằm ngoài vùng nhận `null` — và đó chính là mẹo làm `xepCay()`
   chạy được cho một vùng cắt rời mà **không phải sửa một dòng nào**: hàm ấy vốn đã lặp qua nhiều
   gốc (`con.get(null)`), xem `components/pha/xep-cay.ts:82`.
5. **Vợ chồng gộp một node**, đúng như `getBranchViewOps` đã làm (`ops.ts:623-633`): một thành viên
   đã hiện với tư cách bạn đời của node trước thì không sinh node riêng. Dùng lại `partnersOf`,
   `cardOf`, `fetchAttribution`, `viewerLens` — **không dựng lối riêng**.
6. **`exhausted`** = `true` khi tập node ở bán kính `radius` bằng tập ở `radius + 1`. Nút "Mở thêm
   một đời" phải tắt được, nếu không người vận hành bấm mãi mà màn không đổi.
7. Bán kính kẹp trong `[1, 6]`. Ngoài khoảng ⇒ `err('invalid', …)`.
8. `anchorPersonId` không có trong phả (hoặc ngoài bán kính riêng tư của người xem) ⇒
   `err('not-found', …)`. **Không** trả vùng rỗng — vắng và không-có là hai chuyện khác nhau.

### Riêng tư — không có ngoại lệ cho bàn quản trị

9. Mọi thẻ đi qua `viewerLens` + `cardOf` như các hàm đọc khác của `core/tree` (AD-13/AD-21).
   Bản dựng thử **không** lọc riêng tư, nên canvas thật sẽ bày **ÍT người hơn** bản dựng thử —
   ghi ra đây để không ai tưởng là bug (xem § Dev Notes › Bốn cái bẫy, mục 3).
10. `bfsDistances` đi **cả cạnh vợ-chồng lẫn cạnh huyết thống** (`ops.ts:396` — *"BFS over blood +
    union edges"*). Vùng thật vì thế **RỘNG HƠN** bản dựng thử, thứ chỉ đi cạnh cha-con. Đừng
    canh số lượng node theo bản dựng thử.

### Màn `/admin/cay`

11. Route mới `app/admin/cay/page.tsx`, nhãn thanh việc **"Cây gia phả"**, nhóm `ban`, icon
    `Network` — đúng như `components/admin/man-admin.ts:29-36` đã hẹn.
12. Thêm `'cay'` vào `KhoaMan` và một mục vào `MAN`; thêm `cay: Network` vào `ICON` của
    `khung-admin.tsx`. **Cả hai phải cùng một lượt với page.tsx**: `app/admin/chrome.test.ts` bắt
    lỗi cả hai chiều — mục không có màn thì gãy, màn không đăng ký cũng gãy.
    *Một phần đã có trình biên dịch gác hộ:* `ICON` khai là `Record<KhoaMan, LucideIcon>`, nên thêm
    `'cay'` vào `KhoaMan` mà quên icon là lỗi `tsc`, không phải lỗi lúc chạy.
13. `<h1>` do layout dựng. Trang **KHÔNG** tự dựng `<h1>`, **KHÔNG** tự đặt `max-w` (AC 3/4 của
    5-1, và bài test bất biến vẫn đang canh).
14. Neo đọc từ **query param** `?neo=<personId>`. Không có tham số ⇒ neo mặc định là **node của
    chính người đang đăng nhập**; người ấy chưa gắn node ⇒ gốc của mảnh chính
    (`getClanOverview().mainFragment`); không có cả cái đó ⇒ màn rỗng có lời, không phải lỗi.
15. Bán kính cũng ở URL: `?ban-kinh=<n>`, mặc định `2`. Đổi bán kính là `router.replace`, không
    `push` — nới rồi thu không nên đẻ ra năm mục trong lịch sử trình duyệt.

### Thao tác trên canvas

16. **Chọn một node KHÔNG dời neo.** Node đang chọn đổi viền; neo giữ nguyên chỗ, khung nhìn
    KHÔNG ôm lại. Đây là AC dễ vi phạm nhất khi vội.
17. Nút **"Đặt làm tâm"** dời neo sang node đang chọn — `router.push` để nút Back quay lại được
    tâm cũ. Tắt khi chưa chọn ai, hoặc node đang chọn đã là neo.
18. Nút **"Mở thêm một đời"** tăng bán kính một nấc; tắt khi `exhausted` hoặc đã tới 6.
19. **Khung nhìn ôm lại (`fitView`) CHỈ khi neo hoặc bán kính đổi**, không khi chọn node. Bản dựng
    thử làm đúng bằng một khoá `` `${neoId}|${banKinh}` `` (`admin-canvas-graph/page.tsx:496-510`) —
    lấy nguyên cách ấy.
20. Có nút phóng/thu (`<Controls>` của React Flow) — `EXPERIENCE.md § Interaction Primitives` bắt
    buộc, và nút phải đạt sàn chạm 44px.
21. Vào màn cây thì thanh việc **tự thu thành ray**: gọi `datThu(true)` từ `useThanhViec()` lúc
    mount. Context ấy 5-1 đã dựng sẵn đúng cho việc này (`khung-admin.tsx` § "Đường cho story
    5-2") — **không dựng lại khung**.

### Ô tìm — trả nợ 5-1

22. Ô tìm trên thanh trên **thôi đẩy sang `/nguoi/[id]`**. Chọn một người ⇒
    `router.push('/admin/cay?neo=<id>')`. Xoá luôn khối chú thích "ĐÍCH TẠM" ở
    `khung-admin.tsx` — nợ đã trả thì gỡ biển báo.
23. Ô tìm phải dời neo **từ bất kỳ màn nào của `/admin`**, không chỉ từ màn cây. Đó chính là lý do
    neo nằm ở URL chứ không nằm trong context: đang ở Nạp khung mà tìm một người thì phải sang
    được màn cây với người ấy làm tâm.
24. Gỡ ghi chú "đích tạm" tương ứng ở `EXPERIENCE.md` (5-1 đã cắm vào § IA › Bề mặt B).

### Thẻ người trên canvas

25. Thẻ **không bao giờ tràn chữ**: `overflow-hidden` ở vỏ, `min-w-0` + `truncate` ở mọi ô chữ co
    giãn, `shrink-0` ở mọi thứ không được co. Bản dựng thử đã giải đúng
    (`admin-canvas-graph/page.tsx:424-490`) — lấy nguyên.
26. Tên người dùng `font-pha`; tồn nghi vẽ nét đứt + `van-ton-nghi`; ba mức tin cậy **không mã hoá
    chỉ bằng màu** — chấm mang HÌNH khác nhau (đặc/nửa/rỗng) kèm `title` và chữ cho trình đọc màn
    hình (`DESIGN.md § Colors`).
27. **`cao` truyền vào `xepCay` phải là HÀM.** Thẻ có vợ cao hơn thẻ không. Truyền một hằng số —
    kể cả dạng `() => 120` — chính là cách lỗi "thẻ đè lên nhau" (sửa 23/08) quay lại.
28. Vợ/chồng **gộp chung một thẻ**, không tách hai node cạnh nhau. Hai node rời đọc thành hai
    người; vợ chồng là MỘT chỗ trong phả (`EXPERIENCE.md § Responsive`).
28b. **`generation` và `branchCode` CÓ THỂ là `null`** — `core/tree/index.ts:36` nói rõ: *"null when
    the viewer's fragment doesn't reach a root"*. Bản dựng thử luôn có cả hai nên không lộ ca này.
    Thẻ phải bày được người **chưa biết đời** mà không hiện `null`, không hiện `0`, và không vỡ bố
    cục. Người trong một mảnh chưa nối rơi đúng vào đây — mà mảnh chưa nối chính là thứ bàn tu phả
    hay mở ra nhất.

### Vỏ canvas — riêng, không dùng lại của bề mặt A

29. Dựng vỏ React Flow **riêng** cho bàn làm việc, **không** dùng lại
    `components/pha/khung-cay.tsx`. Khung ấy sinh cho bề mặt A: `elementsSelectable={false}`,
    không `Controls`, không chọn node — mà bàn làm việc cần ngược lại gần hết. Nhét cả hai vào một
    component là đẻ ra một chuỗi cờ bật/tắt về sau không ai dám sửa. **Chốt 24/08, đừng mở lại.**
30. **Không lưới chấm nền.** `DESIGN.md § Elevation`: khung trần, phân tầng bằng viền. Nền phẳng
    `ban-nen`, cùng tông với bốn màn còn lại.
31. **Giữ nhãn ghi công của React Flow.** Ẩn được (`proOptions.hideAttribution`) và không vi phạm
    giấy phép MIT — nhưng giữ. Chốt 24/08.
32. Không đổ bóng ở bất cứ đâu (`DESIGN.md § Elevation`).

### Sàn không được hạ

33. Sàn chữ **17px** áp nguyên, kể cả trên thẻ. `15px` chỉ cho nhãn phụ. Bài test
    `chrome.test.ts` đang canh mốc tuyệt đối: không `text-[13px]` hay nhỏ hơn ở `app/admin/` và
    `components/admin/`.
34. Ngân sách bề ngang, sàn chữ 17px (`epics-dot-2.md § Ngân sách bề ngang`, đã sửa 24/08):
    ```
    mở thanh việc: 1280 − 240 − 360 = 680px canvas
    thu thành ray: 1280 −  64 − 360 = 856px canvas
    ```
    Cột phải 360px là chỗ 5-3 sẽ cắm vào — story này **chưa dựng cột phải**, nhưng bố cục phải
    chừa đúng chỗ ấy và không được giả định canvas rộng hơn 856px.
35. Không xưng hô ngôi hai, cấm cả chữ "bạn" (`EXPERIENCE.md § Voice and Tone`).

## Tasks / Subtasks

- [x] **T1. Bề mặt lân cận trong core** (AC: 1–10)
  - [x] `getNeighborhoodOps` trong `core/tree/ops.ts` — dùng lại `loadTreeData`, `computeStructure`,
        `bfsDistances`, `viewerLens`, `cardOf`, `fetchAttribution`, `partnersOf`
  - [x] Gộp vợ chồng theo đúng lối của `getBranchViewOps:623-633`
  - [x] Tính `parentNodeId` (null khi cha ngoài vùng) và `distance`
  - [x] Tính `exhausted` bằng cách so tập ở `radius` với `radius + 1`
  - [x] `getNeighborhood` trong `core/tree/index.ts` — `resolveViewer` → `withClanContext` →
        ops → `accountNames` + `finishCard` (đúng nếp `getBranchView:84-106`)
  - [x] Test: neo giữa vùng · neo ở rìa mảnh · cha ngoài vùng ⇒ `parentNodeId === null` ·
        `exhausted` đúng · bán kính ngoài `[1,6]` ⇒ `invalid` · người không tồn tại ⇒ `not-found` ·
        hai dòng họ không thấy nhau
- [x] **T2. Đăng ký màn** (AC: 11–13)
  - [x] `KhoaMan` thêm `'cay'`; `MAN` thêm mục *Cây gia phả* (nhóm `ban`, `coSo: false`)
  - [x] `ICON` trong `khung-admin.tsx` thêm `cay: Network`
  - [x] `app/admin/cay/page.tsx` + `loading.tsx` + `error.tsx`
- [x] **T3. Vỏ canvas riêng** (AC: 29–32)
  - [x] `components/admin/khung-cay-admin.tsx` — `'use client'`, React Flow, `<Controls>`,
        `elementsSelectable`, `nodesDraggable={false}`, nền trong suốt
  - [x] `fitView` chỉ chạy khi khoá `neo|bán kính` đổi
- [x] **T4. Thẻ người** (AC: 25–28)
  - [x] `components/admin/the-nguoi.tsx` — lấy từ bản dựng thử, đổi sang `CoupleNode` thật
  - [x] Chiều cao là hàm; thẻ có bạn đời cao hơn
- [x] **T5. Thao tác** (AC: 14–21)
  - [x] Neo + bán kính đọc/ghi qua URL; `push` cho neo, `replace` cho bán kính
  - [x] "Đặt làm tâm" · "Mở thêm một đời" (tắt khi `exhausted`)
  - [x] `datThu(true)` lúc mount
- [x] **T6. Trả nợ ô tìm** (AC: 22–24)
  - [x] `khung-admin.tsx` đổi đích, gỡ khối chú thích "ĐÍCH TẠM"
  - [x] Gỡ ghi chú tương ứng trong `EXPERIENCE.md`
- [x] **T7. Test bất biến + bản dựng thử** (xem § Testing)
  - [x] Mở rộng `chrome.test.ts` nếu cần cho màn mới
  - [x] Cập nhật `app/uiworkshop/_registry/outline.ts` — đánh dấu phần đã promote

## Dev Notes

### Thư viện — dùng đúng cái đã có

`@xyflow/react` **^12.11.2**, đã nằm trong `package.json`, đã dùng ở `components/pha/khung-cay.tsx`.
**Không thêm dagre, elk, d3-hierarchy hay bất cứ thư viện bố cục nào** — bố cục là `xepCay()` tự
viết, đã có test, và bản dựng thử đã chứng minh nó chạy được cho vùng lân cận không phải sửa gì.
Nhớ `import '@xyflow/react/dist/style.css'`.

### Bản dựng thử LÀ mã khởi điểm, không phải hình minh hoạ

`app/uiworkshop/admin-canvas-graph/page.tsx` (1.025 dòng) đã giải xong phần lớn bài toán hình học
và có sẵn **bản đồ promote** ngay ở đầu file. Đọc nó TRƯỚC KHI gõ dòng nào.

| Ở bản dựng thử | Bản thật gọi |
|---|---|
| `xepCay()` | **GIỮ NGUYÊN** — đã là hàm thật, đã có test |
| `lanCan()` BFS tại chỗ | `getNeighborhood()` mới (T1) |
| `voCua()` qua `voChongId` | `CoupleNode.partners` |
| `doiCua()` / `nhanChi()` | `PersonCard.generation` / `.branchCode` |
| `boDau()` tại chỗ | đã có trong `core/so-khop` |

### Bốn cái bẫy đã biết (chép từ đầu bản dựng thử — đừng vấp lại)

1. **`cao` phải là HÀM.** Xem AC 27.
2. **Người kết hôn vào họ có `chaId: null`** — BFS cha-con không bao giờ chạm tới họ. `bfsDistances`
   thật đi cả cạnh vợ-chồng nên chuyện này tự giải, nhưng đừng giả định ngược lại.
3. **Bản dựng thử không lọc riêng tư.** Canvas thật bày ít người hơn. Không phải bug.
4. **Vùng lân cận có thể cắt ngang một cặp vợ chồng.** Bán kính chạm tới chồng mà không chạm tới
   vợ. Quyết định: **thẻ vẫn hiện cả hai** — vợ chồng là một chỗ, và `partnersOf` không phụ thuộc
   bán kính. Nhưng đó là quyết định phải VIẾT RA, vì nó khiến số node không khớp với số phần tử
   `bfsDistances` trả về.

### Chi phí đọc — đã có nợ, đừng cộng thêm

`loadTreeData` + `computeStructure` chạy trên **cả dòng họ** mỗi lượt. `app/admin/layout.tsx` đã
trả giá ấy một lần cho mỗi request (`getClanOverview`), và code review 5-1 đã ghi nợ chuyện màn nhà
tính lại lần hai (§ Review Findings, giỏ *để sau*).

Màn cây **cộng thêm một lượt nữa**. Với dòng họ vài trăm người thì chấp nhận được, và AD-23 cấm
cache thứ phụ thuộc người xem ngoài core — nhưng `resolveSession` đã bọc `cache()` sẵn
(`core/identity/session.ts:44`), nên một tầng `cache()` theo request là hợp lệ và có sẵn đường.
**Đừng dựng cache trong story này** (ngoài phạm vi), nhưng cũng **đừng gọi `getNeighborhood` hai
lần** trong cùng một render.

### Hiện trạng các file sẽ SỬA (đọc trước khi động vào)

| File | Hiện là gì | Story này đổi gì |
|---|---|---|
| `core/tree/ops.ts` | 5 hàm ops, `bfsDistances` ở :396 | **THÊM** `getNeighborhoodOps`; không sửa hàm cũ |
| `core/tree/index.ts` | 5 bề mặt | **THÊM** `getNeighborhood` + 2 type |
| `components/admin/man-admin.ts` | 4 màn | **THÊM** mục thứ 5 |
| `components/admin/khung-admin.tsx` | vỏ + ô tìm | thêm icon; **đổi đích ô tìm**, gỡ chú thích tạm |
| `components/pha/xep-cay.ts` | bố cục thuần | **KHÔNG SỬA** — nhận `chaId: null` là đủ |
| `components/pha/khung-cay.tsx` | vỏ bề mặt A | **KHÔNG ĐỤNG** (AC 29) |

### Next.js 16 — chỗ dễ viết theo thói quen cũ

Đọc `node_modules/next/dist/docs/` trước khi khẳng định về API. Hai chỗ story này chắc chắn chạm:

- **`searchParams` là Promise** trong App Router hiện tại — `page.tsx` phải `await` nó. Viết theo
  trí nhớ Next 14 sẽ hỏng.
- **`error.tsx` dùng prop `retry`**, không phải `reset` (`docs/next16-delta.md §8`). Và nó **không**
  bọc `layout.js` cùng segment — bài học vừa trả giá ở code review 5-1, xem `app/error.tsx`.

### Học từ 5-1 mang sang

- **Bản đồ màn tập trung.** Thêm màn là sửa ĐÚNG một chỗ (`man-admin.ts`). Đừng để trang tự khai
  tiêu đề.
- **`useSyncExternalStore` cho trạng thái ngoài React.** ESLint `react-hooks/set-state-in-effect`
  chặn `setState` trong thân effect.
- **Số `null` không bao giờ thành `0`.** Màn cây `coSo: false` nên không có số — nhưng nếu sau này
  có, luật ấy vẫn áp.
- **Code review 5-1 để lại một luật:** mỗi story tự thêm mục của mình vào `man-admin.ts` khi màn
  của nó ra đời, không thêm trước.

### Testing

Repo chạy `vitest` với `environment: 'node'` — **không jsdom, không testing-library, không e2e**.
Nên chia đôi:

**Kiểm được bằng máy (BẮT BUỘC):**
- `getNeighborhoodOps` — test DB thật, theo nếp `core/tree/tree.test.ts` và
  `core/gates/rls.gate.test.ts`. Đây là phần logic nặng nhất của story và nó **kiểm được hết**.
- `xepCay` với `chaId: null` nhiều gốc — test thuần, đã có sẵn file test.
- Bất biến mã nguồn: `chrome.test.ts` (một `<h1>`, không `max-w` tự đặt, không dưới sàn 15px,
  mục ↔ màn hai chiều).

**KHÔNG kiểm được ở máy này — cần mắt người, ghi rõ ra khi giao:**
- Thẻ có đè nhau không, ở vùng lệch nhánh
- `fitView` có ôm đúng lúc không (đổi neo: có; chọn node: không)
- Ray tự thu khi vào màn
- Bề ngang 1280px với cột phải 360px chưa tồn tại
- Đường bàn phím trên canvas

Máy này **không có trình duyệt headless** và mọi màn `/admin` đứng sau đăng nhập. Đẩy tối đa sang
bản dựng thử `/uiworkshop` để người xem được mà không phải đăng nhập.

### Project Structure Notes

```
app/admin/cay/
  page.tsx            ← server, đọc searchParams, gọi getNeighborhood
  loading.tsx
  error.tsx
components/admin/
  khung-cay-admin.tsx ← client, vỏ React Flow riêng của bàn làm việc
  the-nguoi.tsx       ← client, thẻ người trên canvas
  man-admin.ts        ← THÊM mục 'cay'
  khung-admin.tsx     ← thêm icon; đổi đích ô tìm
core/tree/
  index.ts            ← THÊM getNeighborhood + Neighborhood + NeighborhoodNode
  ops.ts              ← THÊM getNeighborhoodOps
```

`components/admin/` là root thứ ba, đã khai ở `specs/frontend-stack.md` (code review 5-1).

### References

- `_bmad-output/planning-artifacts/epics/epics-dot-2.md` — hàng 5-2; § Vốn sẵn có; § Ngân sách bề
  ngang; § Soi lại thanh việc (24/08); § Hạ mức rủi ro (24/08)
- `app/uiworkshop/admin-canvas-graph/page.tsx` — bản đồ promote + bốn cái bẫy, ngay ở đầu file
- `components/pha/xep-cay.ts` — `cao` là hàm, nhiều gốc qua `con.get(null)`
- `core/tree/ops.ts:396` `bfsDistances` · `:579` `getBranchViewOps` (mẫu để chép lối gộp vợ chồng)
- `core/tree/index.ts:84` `getBranchView` (mẫu cho tầng index)
- `docs/build-contract.md:41` — adapter chỉ import `core/<module>` index
- `_bmad-output/implementation-artifacts/5-1-vo-admin.md` — § Review Findings, § Completion Notes
- `EXPERIENCE.md § IA › Bề mặt B`, `§ Interaction Primitives`, `§ Voice and Tone`
- `DESIGN.md § Colors › Bề mặt B`, `§ Elevation`

### Câu hỏi để dành cho sau khi viết xong

1. Bán kính mặc định `2` có đủ dùng không, hay ban tu phả sẽ luôn phải bấm "mở thêm" ngay?
2. Khi vùng lân cận cắt ngang một cặp vợ chồng, thẻ hiện cả hai — có làm người xem tưởng người vợ
   ấy cũng nằm trong bán kính không? Cần dấu hiệu gì không?
3. Neo mặc định là node của chính người đăng nhập — với admin bootstrap chưa gắn node thì rơi về
   gốc mảnh chính. Có nên mời họ gắn node ngay tại đó không (như màn nhà đã làm sau code review)?

## Dev Agent Record

### Agent Model Used

_(điền khi implement)_

### Debug Log References

### Completion Notes List

### File List

## Completion Notes

Dev: Claude Opus 5 · 25/08/2026.

### Lệch so với story, và vì sao

| Story ghi | Đã làm | Vì sao |
|---|---|---|
| AC 8: neo ngoài bán kính riêng tư ⇒ `not-found` | **Không** lọc theo tầm nhìn; `cardOf` ẩn danh như mọi lối đọc khác | `getBranchViewOps` không lọc kiểu ấy — nó để `cardOf` ẩn danh và cây vẫn đủ chỗ. Lọc ở đây là làm THỦNG cây: một người bị bỏ hẳn thì con cháu họ mất đường lên gốc. Vế còn lại của AC 8 (người không tồn tại ⇒ `not-found`) giữ nguyên. |
| — | **Thêm `isFragmentRoot`** vào `NeighborhoodNode` | `parentNodeId === null` không phân biệt được "cụ xa nhất hiện biết" với "tình cờ đứng ở rìa bán kính". Thẻ đội vương miện cho người thứ hai là nói dối trên chính cái phả. Không có trường này thì thẻ không thể vẽ đúng. |
| — | **Chọn node chính tường minh**, không dựa vào thứ tự duyệt | Xem § Cái bẫy dưới đây. Đây là sửa một lỗi thật, do bài test bắt được. |

### Cái bẫy đã suýt lọt: mất cạnh nối lên cụ tổ, im lặng

`getBranchViewOps` duyệt trong phạm vi MỘT CHI nên người đầu tiên gặp luôn nằm trên đường máu.
Vùng lân cận đi **theo cạnh** nên nó chạm cả họ nhà vợ, và người kết hôn vào họ có thể đứng trước
trong thứ tự duyệt. Khi ấy họ được chọn làm node chính — mà `codeParent` chỉ có cho người trên
đường máu, nên **cạnh nối lên cha biến mất**: nhánh bị cắt lìa khỏi gốc, không lỗi, không cảnh
báo, và cây vẽ ra vẫn "đẹp".

Nay việc chọn là tường minh (*người mang mã chi làm chính*), và bài test khẳng định thẳng cạnh
`B1 → A` chứ không chỉ khẳng định "có một node".

### Đã kiểm được

- `npx tsc --noEmit` sạch · `npx eslint app components core` sạch · `npx vitest run` **142/142**
  (135 cũ + 7 bài mới cho vùng lân cận).
- `npm run build` xanh; `/admin/cay` có trong danh sách route, dạng động.
- **Chạy trên dữ liệu thật**: vùng quanh node quản trị trả 3 người, `exhausted=true` ở bán kính 1
  — đúng với trạng thái phả hiện tại (cạnh Hiệp→Vinh chưa được ghi, mảnh đứt làm đôi).
- Bảy bài test phủ: cha ngoài vùng ⇒ `parentNodeId` null · bạn đời ngoài bán kính vẫn chung thẻ ·
  gộp cặp GIỮ cạnh máu · mảnh một người cạn ngay · bia mộ chuyển hướng sang người thắng · bán
  kính ngoài `[1,6]` ⇒ `invalid` · bán kính riêng tư (khách thấy CHỖ của trẻ vị thành niên nhưng
  không thấy TÊN — cây không được thủng).
- `chrome.test.ts` giữ bất biến hai chiều: mục ↔ màn.

### CHƯA kiểm được — cần mắt người

Máy không có trình duyệt headless, và `/admin/*` đứng sau đăng nhập. Sáu thứ chỉ mở màn thật mới
biết:

1. **Thẻ có đè nhau không** ở vùng lệch nhánh (một người năm con, người kia không con).
2. **`fitView` đúng lúc**: đổi neo hoặc bán kính thì ôm lại; **chọn người thì KHÔNG**.
3. **Ray tự thu** khi vào màn, và mở lại được.
4. **1280px** với cột phải 360px chưa tồn tại — canvas hiện đang ăn hết chỗ ấy.
5. **Đường bàn phím** trên canvas.
6. Nút phóng/thu của React Flow có thật sự đạt 44px sau khi ghi đè lớp không.

Bốn ô Testing của 5-1 vẫn còn nợ, nay cộng thêm sáu ô này.

### Nợ để lại cho 5-3

- **Cột phải chưa có.** Canvas đang chiếm trọn bề ngang còn lại. 5-3 dựng cột 360px thì canvas
  co lại còn 856px như ngân sách đã chốt.
- **Chọn một node hiện chỉ đổi viền.** Đúng phạm vi 5-2, nhưng nó là nửa câu: nửa còn lại là cột
  phải mở ra chồng khẳng định của người ấy. Trạng thái `chonId` đã nằm sẵn trong `KhungCayAdmin`,
  5-3 nâng lên hoặc bày qua context.
- **Chỉ bày bạn đời ĐẦU TIÊN** (`partners[0]`) trên thẻ. Nhiều vợ là chuyện phả cổ có thật, và
  epic đã hoãn có chủ đích vai chính thất/kế thất. Khi mở lại, thẻ phải sửa theo.
