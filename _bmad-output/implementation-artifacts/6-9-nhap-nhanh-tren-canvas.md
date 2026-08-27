---
baseline_commit: cedbc84
---
# Story 6.9: Nhập nhanh trên canvas bằng bàn phím

Status: done

## Story

Là **người chép phả đang ngồi trước một trang phả giấy**,
tôi muốn **chọn một người trên cây rồi gõ `Enter` để thêm con, `Shift+Enter` để thêm anh em**,
để **chép được cả một chi mà không rời tay khỏi bàn phím**.

## Bối cảnh: việc số một, và hôm nay nó tốn nhiều cú bấm nhất

Phản hồi 26/08 từ lượt dùng thật:

> *"Trên canvas có thể click vào 1 node, nếu ấn Enter sẽ mở thêm node con và ấn Tab sẽ mở nốt
> liền kề (anh em) không? Như thế thêm node sẽ dễ hơn."*

Hôm nay: chọn node → rê chuột lên thanh công cụ → bấm *Thêm người quanh đây* → chọn hướng →
gõ tên. Bốn chặng cho một người, và người chép một trang phả mười người phải đi bốn chặng ấy
mười lần.

Đường ghi **đã có đủ**: `themNguoi` nhận `mocId` + `huong` trong bốn hướng
(`con · cha-me · vo-chong · roi`), biểu mẫu ở cột phải đã dựng từ 5-4. Thiếu là thiếu **phím**.

## Quyết định: `Enter` / `Shift+Enter`, KHÔNG phải `Tab` (chốt 26/08)

`Tab` là phím của trình duyệt — cách duy nhất người dùng bàn phím đi qua giao diện. Chiếm nó
trên canvas là dựng một cái bẫy: vào được mà không ra được, vi phạm chính
`EXPERIENCE.md § Accessibility Floor`.

Ba lối đã cân nhắc: (a) chiếm `Tab` khi có node đang chọn, `Escape` trả lại — vẫn là một cái bẫy,
chỉ có cửa thoát; (b) một "chế độ nhập nhanh" bật/tắt tường minh — thêm một trạng thái người dùng
phải nhớ; (c) **`Enter` = con, `Shift+Enter` = anh em** — không đụng `Tab` một chút nào.

Chốt (c).

## "Anh em" không phải một hướng có sẵn

Bốn hướng của `HuongThem` không có `anh-em`. Anh em = **thêm một người con nữa cho CÙNG người
cha**, tức `huong: 'con'` gắn vào **cha của node đang chọn**, không gắn vào chính node ấy.
`NutCanvas` đã mang `chaId` nên tính được ngay, không cần lượt đọc nào.

## Acceptance Criteria

### Phím

1. Node đang chọn + `Enter` ⇒ mở biểu mẫu thêm người với `mocId` = node ấy, `huong: 'con'`.
2. Node đang chọn + `Shift+Enter` ⇒ `mocId` = **cha** của node ấy, `huong: 'con'`.
3. Node đang chọn mà **chưa biết cha** + `Shift+Enter` ⇒ **KHÔNG** ghi gì, **KHÔNG** lặng lẽ tạo
   một người rời. Nói một câu: *"Chưa biết cha của người này, nên chưa thêm anh em được."*
4. Không có node nào đang chọn ⇒ hai phím không làm gì.
5. Node mờ (`ID_TAM`) không bao giờ là mốc — nó chưa tồn tại trong phả.

### Không cướp phím của người khác

6. Con trỏ đang ở trong **ô nhập** (`input` · `textarea` · `select` · `contenteditable`) ⇒ hai
   phím ấy đi tiếp như thường. Biểu mẫu thêm người nằm ngay cột bên, và `Enter` ở đó là gửi.
7. `Tab` **không bị đụng tới**, ở bất kỳ trạng thái nào.
8. Không `preventDefault` khi phím không được xử — trả về cho trình duyệt.

### Nói ra thì mới có người dùng

9. Khi một node đang chọn, canvas bày một dòng chỉ dẫn: **`Enter` thêm con · `Shift+Enter` thêm
   anh em**. Phím tắt không nói ra là phím tắt không tồn tại.
10. Dòng ấy dùng `<kbd>`, và không phải một tooltip — `EXPERIENCE.md § Component Patterns` ưa bày
    thẳng hơn giấu sau tương tác.

### Nhịp gõ một mạch

11. Ghi xong một người: con trỏ **về lại canvas**, node mới **đang chọn**, sẵn sàng cho `Enter`
    kế tiếp. Đây là thứ biến bốn chặng thành một.
12. Mỗi người vẫn cần **họ tên và xuất xứ** trước khi ghi (FR-1) — không có lối tắt nào bỏ qua
    xuất xứ. Biểu mẫu mở ra với con trỏ nằm sẵn ở ô tên.

### Sàn không được hạ

13. Sàn chạm 44px · chữ thân 17px · tối thiểu tuyệt đối 15px.
14. Không phân biệt chỉ bằng màu. Không đổ bóng.
15. Không xưng hô ngôi hai.
16. Đo bằng `scripts/soi-man.mjs` trước và sau: thẻ node **không được cao thêm**, nhãn không gãy
    dòng. `the-nguoi.tsx` là file mà hai lỗi hình nặng nhất Epic 5 nằm ở đó.

## Phạm vi — KHÔNG thuộc story này

- **Nút `+` trên thẻ node** — đã cân nhắc và bỏ ở 5-4 vì thẻ chật; story này giải cùng bài toán
  bằng phím, không bằng pixel.
- **Thêm người rời bằng cách bấm khoảng trống canvas** — người rời đẻ ra một mảnh mới, mà "mảnh
  chưa nối" là con số cần làm GIẢM.
- **Sửa giá trị trên canvas** — sửa là việc của cột phải (chốt 26/08).
- **Kéo thả** — nợ từ 5-4, vẫn hoãn.

## Tasks / Subtasks

- [x] **T0** `AGENTS.md`: đọc `node_modules/next/dist/docs/` cho phần sắp viết
- [x] **T1** Module THUẦN `phim-canvas.ts`: từ (phím, shift, thẻ đích, node đang chọn, `chaId`)
      suy ra hành động — `them-con` · `them-anh-em` · `thieu-cha` · `bo-qua` (AC 1–8)
- [~] **T2** ~~Nối vào `khung-cay-admin.tsx` bằng `onKeyDown` trên vỏ canvas~~ → nghe ở **cấp
      cửa sổ** trong `cay-client.tsx` (AC 1–5). Lý do ở § *Lệch so với story*; ghi lại ở đây để ô
      tích thôi nói rằng đã làm đúng câu đã ghi.
- [~] **T3** Dòng chỉ dẫn `<kbd>` khi có node đang chọn (AC 9–10) — **DỰNG RỒI GỠ.** Chủ dự án
      chốt 26/08: *"không cần hiện text Enter thêm con · Shift+Enter thêm anh em, giữ view gọn."*
      AC 9 và AC 10 vì thế **KHÔNG ĐẠT theo chữ**, và đó là một quyết định, không phải một chỗ
      sót. Cái giá còn nguyên và phải nói ra: phím tắt nay không có chỗ nào trên màn nói ra nó —
      đúng câu chính story viết, *"phím tắt không nói ra là phím tắt không tồn tại."*
- [x] **T4** Câu "chưa biết cha" trong `cay-client.tsx` (AC 3)
- [ ] **T5** Ghi xong thì chọn node mới và trả con trỏ về canvas (AC 11)
- [x] **T6** Test thuần cho `phim-canvas.ts`
- [x] **T7** `npm run lint` · `npx tsc --noEmit` · `npx vitest run` · `npm run build`
- [x] **T8** `soi-man.mjs` trước/sau, và **nhìn ảnh** (AC 16)

### Review Findings

Code review 26/08/2026 — ba tầng đối kháng chạy song song (Blind Hunter · Edge Case Hunter ·
Acceptance Auditor), mỗi tầng một phiên riêng, không tầng nào biết ý đồ tác giả. Bốn cổng của
repo xanh với **toàn bộ** danh sách dưới đây.

**Quyết định cần người (2) — CHỦ DỰ ÁN ĐÃ CHỐT 26/08/2026**

> **1. Quầng sáng → `outline`, giữ y nguyên hình.** `outline` + `outline-offset` cho đúng cái
> quầng đã đặt hàng mà không phải `box-shadow`, nên AC 14 · `build-contract.md:86` ·
> `DESIGN.md § Elevation` đứng nguyên, không tài liệu nào phải sửa. Cả hai chỗ `ring-*` đổi.
>
> **2. Trạng thái thẻ node CỘNG DỒN, không loại trừ.** Viền màu nói VIỆC (đỏ = có người xin
> nhận · xanh = tâm), quầng nói ĐANG CHỌN. Chọn một node có yêu cầu thì thấy cả hai cùng lúc.
> Không thêm chữ nào lên thẻ — hàng nhãn đã gỡ thì vẫn gỡ.

Cả hai nay là việc vá, nằm trong danh sách dưới.

- [x] [Review][Patch] **Quầng `ring-*` → `outline`** [`the-nguoi.tsx:132,134`] — `ring-4
      ring-foreground/25` và `ring-2 ring-destructive/40` là hai chỗ đổ bóng DUY NHẤT trong
      `components/admin/` + `app/admin/`, xung đột AC 14 · `build-contract.md:86` ·
      `DESIGN.md § Elevation`. Chốt: đổi sang `outline`, hình giữ nguyên, luật giữ nguyên.
- [x] [Review][Patch] **Trạng thái thẻ node cộng dồn** [`the-nguoi.tsx:129-137`] — chuỗi `? :`
      loại trừ đặt `selected` TRÊN `coNguoiXin`, nên bấm vào node để duyệt là tắt mất dấu đỏ —
      đúng lối đi chính của story 5-5. Chốt: viền mang trạng thái việc, quầng mang đang-chọn,
      hai kênh cộng dồn. Phụ: `chonId` khởi tạo bằng `neoId` nên dấu "tâm" không bao giờ hiện
      lúc mở màn — cộng dồn xong thì hết.

**Đã gộp vào danh sách vá — nguyên văn hai mục quyết định:**

- [x] [Review][Decision] **`ring-*` là `box-shadow`, mà AC 14 cấm đổ bóng** — `ring-4
      ring-foreground/25` và `ring-2 ring-destructive/40` (`the-nguoi.tsx:132,134`) là hai chỗ
      đổ bóng DUY NHẤT trong toàn bộ `components/admin/` + `app/admin/`. Xung đột với AC 14
      (*"Không đổ bóng"*), `docs/build-contract.md:86` (*"không đổ bóng; không opacity"*) và
      `DESIGN.md § Elevation`. Nhưng quầng ấy là thứ chủ dự án đặt hàng đích danh (*"chỉ cần
      một glow highlight border là đc"*), nên đây là chỗ phải chọn, không phải chỗ sửa thẳng.
- [x] [Review][Decision] **"Có người xin nhận" biến mất đúng lúc được chọn**
      [`components/admin/the-nguoi.tsx:129-137`] — chuỗi `? :` loại trừ nhau và `selected` đứng
      TRÊN `coNguoiXin`, còn hàng nhãn chữ thì vừa bị gỡ. Muốn duyệt một yêu cầu thì phải chọn
      node — và đúng lúc chọn, dấu đỏ tắt. Đây là lối đi chính của story 5-5. Sửa được, nhưng
      kênh phân biệt mới không được là màu (AC 14) và không được là nét đứt (nét đứt đã thuộc
      về mức tin cậy *tồn nghi*, `DESIGN.md § Confidence`). Phụ: `chonId` khởi tạo bằng `neoId`
      nên dấu "tâm" không bao giờ hiện lúc mở màn.

**Đã vá (20/20) — 26/08/2026**

- [x] [Review][Patch] `Enter` đọc `chonId` CŨ khi vừa `Tab` sang node khác ⇒ ghi con vào nhầm
      cha [`app/admin/cay/cay-client.tsx:375-391`] — `@xyflow/system` khai
      `elementSelectionKeys = ['Enter',' ','Escape']` và xử `Enter` trên thẻ node (`tabIndex=0`)
      mà **không** chặn nổi bọt, nên handler cửa sổ chạy với closure của lượt vẽ trước. Thẻ B
      sáng, biểu mẫu ghi "con của A". AD-4 không cho xoá. Chốt: đọc node đích từ chính sự kiện
      (`dich.closest('.react-flow__node')?.dataset.id`) hoặc giữ `chonId` trong `useRef`.
- [x] [Review][Patch] `Enter` xoá trắng biểu mẫu đang gõ dở, không một câu hỏi
      [`cay-client.tsx:390`] — `hanhDongPhim` không có tham số `dangMo`/`daGo`; đổi `mocId` làm
      `<Than key={khoa}>` dựng lại. `Esc` thì hỏi, `Enter` thì bỏ luôn — mà `Enter` là phím
      trung tâm của story.
- [x] [Review][Patch] `dongThem` không dọn `hoiBo` và `loiPhim` [`cay-client.tsx:315-332`] —
      bấm nút *Thôi* sau khi `Esc` đã hỏi để lại cờ bẩn; lần `Esc` kế tiếp bỏ NGAY, mất chữ.
      Đúng tội mà `phim-canvas.ts:101` thề đã sửa.
- [x] [Review][Patch] `chaId === null` gộp "chưa biết cha" với "cha ngoài bán kính"
      [`cay-client.tsx:380`] — `core/tree/ops.ts:668-672` cảnh báo đúng cái bẫy này và đẻ ra
      `isFragmentRoot` để phân biệt; `page.tsx:155` đã map sẵn thành `the.laGocManh` mà handler
      không đọc. Hậu quả: `Shift+Enter` ở rìa vùng nói một câu SAI về phả, và chặn một thao tác
      hợp lệ. Đường thứ hai: `page.tsx:147` ép `chaId: null` cho node `?giu=`.
- [x] [Review][Patch] Không `autoFocus` ở ô tên, và biểu mẫu không phải `<form>`
      [`components/admin/bieu-mau-them-nguoi.tsx:151-299`] — AC 12 câu hai chưa làm. `Enter`
      trong ô tên KHÔNG gửi gì (nút là `type="button"`), nên tiền đề của AC 6 (*"Enter ở đó là
      gửi"*) sai với chính mã. Nhịp "gõ một mạch" đứt ở nhịp thứ hai của người đầu tiên.
- [x] [Review][Patch] `onDoiBan` gọi bên trong updater của `setD`
      [`bieu-mau-them-nguoi.tsx:114-119`] — updater của `useState` phải THUẦN; gọi `setBanThem`
      của `CayClient` ở đó là *"Cannot update a component while rendering a different
      component"*, và StrictMode nhân đôi. Cùng họ với `set-state-in-effect` mà repo đã vấp bốn
      lần, chỉ khác pha nên eslint không có rule bắt. Chốt: tính cờ NGOÀI updater.
- [x] [Review][Patch] Không kiểm `e.repeat` [`cay-client.tsx:344`] — GIỮ phím `Esc` một giây:
      nhịp một đặt câu hỏi, nhịp lặp ~33ms sau trả `dong`. Cửa sổ để người đọc được câu hỏi rộng
      đúng 33 mili-giây.
- [x] [Review][Patch] Băng `loiPhim` không tự tắt, không tắt khi chọn người khác, che thanh công
      cụ và nuốt cú bấm [`cay-client.tsx:422-429`] — `absolute inset-x-0 top-0 z-20` không
      `pointer-events-none`, chồng lên thanh công cụ (`top-3 z-10`, `min-h-11`). Lối tắt duy
      nhất là mở một biểu mẫu ghi rồi `Esc` nó. § *CHƯA kiểm được* mục 3 khai *"chọn node khác
      là hết"* — `chon()` không hề đụng `loiPhim`.
- [x] [Review][Patch] `role="status"` gắn CÙNG LÚC với nội dung [`cay-client.tsx:422-427`] —
      live region phải có mặt trong DOM TRƯỚC khi nội dung đổi; NVDA/JAWS/VoiceOver thường im.
      Và gõ `Shift+Enter` lần hai đặt lại ĐÚNG chuỗi cũ ⇒ React bail out ⇒ không đọc lại. AC 3
      hứa *"nói một câu"*; người dùng trình đọc màn hình không nghe gì.
- [x] [Review][Patch] `Escape` ở ô tìm thanh trên đóng luôn biểu mẫu thêm người
      [`components/admin/khung-admin.tsx:241-244`] — không `stopPropagation`, mà listener React
      uỷ nhiệm ở `document` chạy trước `window`. Đóng bảng gợi ý xong biểu mẫu đóng theo, hoặc
      tệ hơn: hiện câu hỏi "bỏ những gì vừa gõ" cho một thao tác chẳng liên quan.
- [x] [Review][Patch] `Escape` không kiểm `isComposing` / `keyCode 229`
      [`cay-client.tsx:344-373`] — repo không có một chốt IME nào. Gõ Telex `Nguyeen`, bấm `Esc`
      để huỷ chuỗi đang soạn ⇒ nuốt cả người đang nhập. Đây là bàn nhập liệu TIẾNG VIỆT; ca này
      là ca thường. (`Enter` an toàn nhờ `dangGoTrongO`; `Escape` cố ý đi vòng qua hàng rào ấy.)
- [x] [Review][Patch] `banThem` không được dọn khi `Enter` mở biểu mẫu khác
      [`cay-client.tsx:385-391`] — biểu mẫu mới dựng lại rỗng mà cờ bẩn vẫn `true` ⇒ `Esc` hỏi
      *"Bỏ những gì vừa gõ?"* về một biểu mẫu chưa ai đụng.
- [x] [Review][Patch] `hanhDongPhim` không xét `ctrl` / `meta` / `alt` [`phim-canvas.ts:71-82`]
      — `Ctrl+Enter` và `Cmd+Enter`, thành ngữ "gửi" phổ biến nhất trên web, mở biểu mẫu thêm
      con VÀ ăn một `preventDefault`. Bộ test không có ca nào cho ba phím bổ trợ.
- [x] [Review][Patch] `e.stopPropagation()` ở `chon-nguoi.tsx:128` là mã chết, kèm chú thích tả
      một cơ chế không xảy ra được — `ChonNguoi` chỉ sống trong `CotKhangDinh`, mà `cay-client`
      dựng `CotKhangDinh` ở nhánh **loại trừ** với biểu mẫu thêm người. Hai lớp không bao giờ
      cùng trên màn. Dev Notes mục 3 của chính story dặn đừng để lại thứ này.
- [x] [Review][Patch] `ID_TAM` chép tay thay vì import [`phim-canvas.ts:18`, `.test.ts:22`] —
      `dat-nut-tam.ts:23` đã export nó và `khung-cay-admin.tsx:40` đã import. Đổi hằng ở nguồn
      sẽ làm AC 5 hỏng IM LẶNG: node mờ thành mốc hợp lệ, mà cả 329 test vẫn xanh.
- [x] [Review][Patch] **Hồ sơ story khai sai ở năm chỗ** — (a) T3 tích `[x]` và Debug Log ghi
      *"chỉ dẫn khi có node chọn CÓ ✓"* cho một dòng `<kbd>` đã bị GỠ ở cùng commit theo yêu cầu
      của chủ dự án; không có `<kbd>` nào trong repo. (b) Dev Notes dòng 116 ghi `the-nguoi.tsx`
      **KHÔNG đổi** trong khi nó đổi 95 dòng. (c) T2 tích `[x]` cho `onKeyDown` trên vỏ canvas,
      thực tế nghe ở cấp cửa sổ (có giải trình ở Completion Notes, nhưng ô vẫn tích như thể làm
      đúng câu ghi). (d) Completion Notes khai bài test ghim `preventDefault`; **AC 8 không có
      bài test nào**. (e) JSDoc của `daGo` (`phim-canvas.ts:114`) tả bản TRƯỚC khi vá `onDoiBan`.
      Ghi chú: con số `312/312` là **ĐÚNG** — 329 hôm nay trừ 17 bài mà story 6-3 vừa thêm.
- [x] [Review][Patch] Khối JSDoc mồ côi [`components/admin/khung-cay-admin.tsx:85-90`] — tả prop
      `onPhim` của kiến trúc T2 đã bỏ, dán ngay trước `}) {`, không gắn với prop nào.
- [x] [Review][Patch] Chú thích chết [`components/admin/the-nguoi.tsx:142-149`] — vẫn lấy các
      nhãn *"tâm" / "sắp thêm" / "có người xin nhận"* làm lý do không đặt `overflow-hidden`. Các
      nhãn ấy đã bị xoá ở dòng 209 của cùng file.

**Hoãn (2) — có sẵn trước story này**

- [x] [Review][Defer] `daThayCanhCu` đọc `nut` THÔ còn canvas đọc `nut` đã lọc theo vùng
      [`cay-client.tsx:399-405` vs `khung-cay-admin.tsx:144`] — deferred, pre-existing
- [x] [Review][Defer] `Backspace` trên node đang focus vẫn là `deleteKeyCode` mặc định của React
      Flow [`khung-cay-admin.tsx`] — deferred, pre-existing

**Bỏ (3)** — `312/312` bị tố sai (đã kiểm, đúng) · `prettier --check` đỏ cả file không đụng
(nếp sẵn của repo) · AC 9/10 "không có mã" (chủ dự án chốt bỏ dòng chỉ dẫn; phần còn thật là hồ
sơ khai sai, đã gộp ở trên).

## Dev Notes

### Hiện trạng file sẽ sửa

| File | Hiện là gì | Đổi gì |
|---|---|---|
| `components/admin/khung-cay-admin.tsx` | `ReactFlow` với `onNodeClick` + `onNodesChange`; đã có `onMoThem` | thêm `onKeyDown` trên vỏ, thêm dòng chỉ dẫn |
| `app/admin/cay/cay-client.tsx` | `setThem({mocId, huong, hoTen})` mở biểu mẫu | nối hai phím; tính cha từ `nut` |
| `components/admin/the-nguoi.tsx` | thẻ node | ~~**KHÔNG đổi**~~ → **đổi 95 dòng.** Dự tính ban đầu sai: chủ dự án chốt bỏ hàng nhãn chữ và chuyển trạng thái sang viền + quầng, tức đúng file này. Lượt code review 26/08 bắt thêm hai lỗi ở đây (xem § Review Findings) |

### Chỗ dễ sai nhất: `Enter` của biểu mẫu và `Enter` của canvas

Biểu mẫu thêm người nằm ở cột phải, cùng màn. `Enter` trong một `<input>` là **gửi biểu mẫu**.
Nếu handler của canvas bắt luôn phím ấy thì gõ tên xong nhấn `Enter` sẽ mở thêm một biểu mẫu nữa
đè lên biểu mẫu đang gõ dở — mất trắng chữ, đúng lớp lỗi `<details>` nuốt biểu mẫu mà lượt review
6-7 vừa bắt.

Nên phép kiểm "con trỏ có đang ở ô nhập không" là **hàng rào chính** của story, và nó nằm ở module
thuần để test được.

### Học từ 6-7 mang sang

1. **Bốn cổng xanh không phải xanh với người.** Chạy `soi-man.mjs` và NHÌN ảnh sau mỗi lượt sửa.
2. **Prop mới thì để bắt buộc** nếu có nhiều nơi gọi; `tsc` bắt hộ.
3. **Đừng để lại hàm có test mà không ai gọi** — repo đã dính ba lần (`laLoaiChon`, `dongXuatXu`,
   `khoaChong`).
4. **Ô nào không có bài test thì để TRỐNG**, kể cả khi lý do chính đáng.

### Testing

- [x] `Enter` + có node chọn ⇒ `them-con` với đúng `mocId`
- [x] `Shift+Enter` + node có cha ⇒ `them-anh-em` với `mocId` là CHA
- [x] `Shift+Enter` + node không cha ⇒ `thieu-cha`
- [x] không có node chọn ⇒ `bo-qua` cho cả hai phím
- [x] node mờ đang chọn ⇒ `bo-qua`
- [x] con trỏ trong `input`/`textarea`/`select`/`contenteditable` ⇒ `bo-qua` cho cả hai phím
- [x] phím khác (`Tab`, `a`, `Escape`) ⇒ `bo-qua`, và KHÔNG `preventDefault`

### References

- [Source: `epics-dot-3.md#Epic 6`]
- [Source: `_bmad-output/implementation-artifacts/5-4-them-nguoi.md`] — hai lối vào đã có, và vì sao nút trên thẻ bị bỏ
- [Source: `components/admin/dat-nut-tam.ts:18`] — `HuongThem` bốn hướng, không có `anh-em`
- [Source: `.../EXPERIENCE.md#Accessibility Floor`] — 44px · 17px · không phân biệt chỉ bằng màu
- [Source: `.../EXPERIENCE.md#Component Patterns`] — bày thẳng hơn giấu sau tương tác

## Dev Agent Record

### Agent Model Used

Claude Opus 5 · 26/08/2026.

### Debug Log References

`npm run lint` sạch · `npx tsc --noEmit` sạch · `npx vitest run` **312/312** (286 trước story ⇒ +26, tất cả THUẦN) · `npm run build` xanh, 36 route.

Đo trên trình duyệt thật (`scripts/soi-man.mjs` + một kịch bản riêng cho phím):

```
Enter → biểu mẫu thêm con      mở ✓  ("là con của Nguyễn Quang Hiệp")
Enter trong ô TÊN              chữ còn nguyên ✓ · số biểu mẫu đang mở: 1
Shift+Enter trên thuỷ tổ       "Chưa biết cha của người này, nên chưa thêm anh em được."
thẻ node                       159×68 / 159×51 — KHÔNG đổi (AC 16)
```

> **Hai chỗ bản kê này từng nói quá — sửa 26/08 sau code review:**
> - Dòng *"chỉ dẫn khi có node chọn — CÓ ✓"* đã **bỏ**. Nó là số đo của bản TRƯỚC khi gỡ dòng
>   chỉ dẫn, để sót lại thành một lời khai đã-đo-trên-trình-duyệt về một thứ không còn trong mã.
> - *"thẻ node 159×68 — KHÔNG đổi"* thì đúng nhưng **rỗng**: chiều cao thẻ do `style={{ width,
>   height }}` ở `khung-cay-admin.tsx` đặt, nên nó không thể đổi vì sửa `the-nguoi.tsx`. Phép đo
>   ấy không nghiệm thu được cái AC 16 nhắm tới.
>
> **Đo lại sau lượt vá code review** (`next start` trên `127.0.0.1:3100`, KHÔNG đụng bản VPN):
>
> ```
> gõ nhanh 21 ký tự vào ô tên        vào đủ 21 ✓ (con trỏ tự nằm sẵn ở ô tên)
> Enter sang mốc khác khi đang gõ dở  HỎI trước ✓ · chữ còn nguyên ✓ · Enter lần hai mới thay ✓
> GIỮ Esc 1200ms (~30 nhịp lặp)      biểu mẫu VẪN MỞ ✓ — nhịp lặp không tự trả lời câu hỏi
> nhả rồi Esc lần hai                đóng ✓
> Shift+Enter ở rìa bán kính         "Cha của người này chưa hiện trên hình — nới bán kính…" ✓
> thanh công cụ dưới băng cảnh báo   vẫn bấm được ✓
> chọn node khác                     băng tắt ✓
> Ctrl+Enter                         không mở gì ✓
> lỗi console                        không có ✓
> ```

### Completion Notes List

Xem § Completion Notes.

### File List

**Mới**
- `components/admin/phim-canvas.ts` — module thuần: `hanhDongPhim` · `dangGoTrongO`
- `components/admin/phim-canvas.test.ts` — 26 bài (`hanhDongPhim` + `hanhDongEsc`)

**Sửa**
- `app/admin/cay/cay-client.tsx` — nghe phím ở cấp cửa sổ, `Escape`, câu báo "chưa biết cha"
- `components/admin/khung-cay-admin.tsx` — bỏ dòng chỉ dẫn và băng-rôn "hết người"; lý do vô hiệu chuyển vào nút
- `components/admin/the-nguoi.tsx` — bỏ hàng nhãn chữ, trạng thái đổi sang độ dày viền + quầng
- `components/admin/bieu-mau-them-nguoi.tsx` — `onDoiBan` báo biểu mẫu đã bẩn
- `components/admin/chon-nguoi.tsx` — `Esc` của bộ chọn chặn nổi bọt (đóng từ trong ra ngoài)

**Sửa thêm ở lượt vá code review 26/08** (20 patch — xem § Review Findings)
- `components/admin/phim-canvas.ts` — import `ID_TAM`; thêm `boTro` · `lap` · `laGocManh` ·
  `mocDangMo` · `daGo` · `dangHoi`; thêm `cha-ngoai-vung` và `hoi-thay`
- `components/admin/phim-canvas.test.ts` — 26 → 35 bài
- `app/admin/cay/cay-client.tsx` — mốc đọc từ chính sự kiện (`data-id`), chốt IME, `e.repeat`,
  `hoiBo` mang tên việc, `loiPhim` mang số lần, vùng `role="status"` luôn có mặt, dọn cờ ở
  `chon()` và `dongThem()`, băng cảnh báo `pointer-events-none` + `top-16`
- `components/admin/bieu-mau-them-nguoi.tsx` — `<form onSubmit>`, `autoFocus` ở ô tên,
  `onDoiBan` ra ngoài updater
- `components/admin/the-nguoi.tsx` — trạng thái CỘNG DỒN (viền = việc, quầng = đang chọn);
  `ring-*` → `outline`
- `components/admin/khung-admin.tsx` — `Esc` của ô tìm chặn nổi bọt
- `components/admin/khung-cay-admin.tsx` — gỡ khối JSDoc mồ côi
- `components/admin/chon-nguoi.tsx` — gỡ `stopPropagation` chết

## Change Log

| Ngày | Việc |
|---|---|
| 26/08/2026 | Dựng story: `Enter` thêm con · `Shift+Enter` thêm anh em · `Escape` huỷ; module thuần + 26 test |
| 26/08/2026 | **Code review ba tầng đối kháng** — 20 patch + 2 quyết định, đã vá hết. Nặng nhất: `Enter` sau `Tab` ghi con vào NHẦM CHA (`chonId` cũ trong closure); `Enter` nuốt biểu mẫu đang gõ dở; `chaId === null` gộp "chưa biết cha" với "cha ngoài bán kính"; không autofocus và biểu mẫu không phải `<form>`. Nghiệm thu lại bằng trình duyệt trên đúng các đường ấy |

## Completion Notes

Dev: Claude Opus 5 · 26/08/2026.

### Lệch so với story, và vì sao

| Story ghi | Đã làm | Vì sao |
|---|---|---|
| T2: `onKeyDown` trên **vỏ canvas** | nghe ở **cấp cửa sổ** trong `cay-client` | Ghi xong một người thì trang dời tâm sang người mới và **dựng lại** — focus rơi về `body`. Nghe ở vỏ thì "gõ một mạch" đứt ngay ở người thứ hai, đúng thứ story sinh ra để có. Bắt được bằng cách nghĩ tới nhịp, trước khi viết. |
| Hàng rào = "con trỏ có trong ô nhập không" | rộng hơn: **mọi phần tử mà `Enter` đã có nghĩa riêng** | Nghe ở cửa sổ thì `BUTTON` · `A` · `SUMMARY` cũng phải chặn — `Enter` ở đó là **bấm**. Không chặn thì một cú Enter vừa bấm nút vừa mở biểu mẫu. |
| T5: ghi xong trả con trỏ về canvas | **không cần** | Hệ quả của lệch thứ nhất: nghe ở cửa sổ thì focus ở đâu cũng được. Nhịp `Enter` → điền → `Enter` chạy thẳng mà không phải quản lý focus — ít mã hơn, ít chỗ hỏng hơn. |

### `Tab` giữ nguyên, và đó là quyết định chứ không phải bỏ sót

Đề nghị ban đầu là `Tab` cho anh em. `Tab` là **cách duy nhất** người dùng bàn phím đi qua giao
diện; chiếm nó trên canvas là dựng một cái bẫy vào được mà không ra được, vi phạm chính
`EXPERIENCE.md § Accessibility Floor`. `Shift+Enter` cho cùng kết quả mà không đụng tới nó.

Bài test ghim luôn điều này: `Tab` · `Escape` · phím chữ · mũi tên đều trả `bo-qua`.

> **Sửa 26/08 sau code review:** câu trên trước đây viết thêm *"và **không** `preventDefault`"*.
> Bài test THUẦN không chạm được tới `preventDefault` — nó sống ở `cay-client.tsx`. **AC 8 không
> có bài test nào**; mã thì đúng (`if (ra.loai === 'bo-qua') return;` đứng trước
> `e.preventDefault()`), nhưng lời khai thì đã nói quá.

### "Anh em" là một phép suy, không phải một hướng

`HuongThem` có bốn hướng và không có `anh-em`. Anh em = thêm một người con nữa cho **cùng người
cha**, tức `huong: 'con'` gắn vào `chaId` của node đang chọn — thứ `NutCanvas` đã mang sẵn, không
cần lượt đọc nào.

Ca phải chặn: node **chưa biết cha**. Lặng lẽ tạo một người rời ở đó là đẻ thêm một mảnh chưa
nối — đúng con số bàn Admin đang cố làm giảm. Nên nó nói ra, và không ghi gì.

### Nhịp gõ một mạch, đo được

`themNguoi` xong thì trang dời tâm sang người mới, và người mới thành node **đang chọn** (nhờ
`chonId` khởi tạo bằng `neoId`, sửa ở lượt review 6-7). Nên:

- `Enter` → điền → ghi ⇒ con đầu, và con ấy đang chọn
- `Shift+Enter` → điền → ghi ⇒ con thứ hai (anh em của con đầu)
- lặp

Chép một chi mười người là mười lần `Shift+Enter`, không rời tay khỏi bàn phím. Trước story này
là bốn chặng mỗi người: chọn node → rê chuột lên thanh công cụ → bấm → chọn hướng.

### Bổ sung sau lượt dùng thật (26/08)

**Dấu trạng thái trên thẻ: bỏ chữ, đổi bằng hình.** *"Tâm đang chọn chỉ cần một glow highlight
border là được, không cần hiện chữ tâm."* Hàng nhãn nổi trên đỉnh thẻ bỏ hẳn — cùng với cả lớp
bug nó từng gây ra (nhãn sơn đè lên họ tên, lượt review Epic 5 đo được). `EXPERIENCE.md` cấm mã
hoá trạng thái chỉ bằng màu, nên chỗ nhãn để lại do **hình** gánh:

```
thường     viền 1px
tâm        viền 2px, KHÔNG quầng   ⇒ một dấu lặng: chỗ vùng lân cận tính từ
đang chọn  viền 2px + quầng 4px    ⇒ ồn nhất
```

Thứ tự này **từng ngược**, và đó là lý do người dùng tưởng phím tắt chạy nhầm node: tâm quầng dày
hơn đang-chọn, `laNeo` kiểm trước `selected`. Bấm một node ở xa thì node ấy nhạt hơn cái tâm đứng
chỗ khác — mắt bảo cái kia đang hoạt động, tay gõ `Enter`. Phím vẫn dùng đúng node vừa bấm (đo
được), nhưng cái nhìn nói dối. **Luật: thứ đang được thao tác thì ồn nhất.**

Câu hỏi kèm theo — *"có nên gộp tâm và đang-chọn không?"* — trả lời **không**. Gộp nghĩa là mỗi
cú bấm đều tính lại vùng lân cận và xếp lại cả cây, đúng thứ chính người dùng gọi là *"rất rối"*.
Chép phả là đứng một chỗ sửa nhiều người quanh đó.

**Bỏ hai chỗ chữ thừa trên thanh công cụ:** dòng chỉ dẫn phím tắt, và băng-rôn *"đã hết người để
mở thêm"* (lý do chuyển vào chính nút đã bị vô hiệu, qua `title` + `aria-label`).

### `Escape` — huỷ thao tác đang dở

Phân tích luật chung của app canvas (Figma · Miro · Excalidraw · tldraw · Obsidian Canvas ·
MindNode): `Esc` huỷ thứ đang dở · đóng từ TRONG ra NGOÀI · chạy **cả trong ô nhập** (khác
`Enter`: trong ô nhập `Enter` là *gửi*, `Esc` là *thôi*).

Chỗ chúng khác nhau là **node đã gõ chữ**: Figma/Excalidraw/MindNode giữ lại chữ; Notion/Linear
đóng và mất chữ. "Giữ lại" không dùng được ở đây — một người chưa có xuất xứ thì không ghi vào
phả (FR-1), không có chỗ nào để giữ. Nên: **trống thì đóng ngay, đã gõ thì hỏi một lần**.

Cờ "đã gõ" do **chính biểu mẫu** báo ra (`onDoiBan`, prop BẮT BUỘC), phủ mọi ô kể cả xuất xứ —
bản đầu chỉ suy từ họ tên, nên gõ mỗi xuất xứ rồi `Esc` là mất trắng. Và nó so với trạng thái
rỗng chứ không phải một cờ một chiều: gõ rồi xoá hết thì biểu mẫu sạch trở lại.

Đo được cả bốn nhánh:

```
Esc khi chưa gõ          → đóng ngay
Esc lần 1 khi đã gõ tên  → hỏi, biểu mẫu còn, chữ còn nguyên
Esc lần 2                → đóng
gõ mỗi XUẤT XỨ → Esc     → hỏi
gõ rồi xoá hết → Esc     → đóng ngay
```

### CHƯA kiểm được — cần mắt người

1. **Chưa ai ghi thật bằng phím.** Kịch bản đo mở được biểu mẫu và điền được tên, nhưng dừng
   trước nút ghi — nó ghi vào phả thật, và một agent lượt trước đã vô tình nâng tầng 40 khẳng
   định vì bấm thử.
2. Dòng chỉ dẫn `<kbd>` có đọc ra nghĩa với người chưa từng dùng phím tắt không, hay nó chỉ là
   thêm chữ trên thanh công cụ vốn đã có ba nút.
3. Câu *"Chưa biết cha…"* nổi đè lên canvas — có che mất thứ đáng nhìn không, và nó **không tự
   biến mất**: phải chọn node khác hoặc gõ phím hợp lệ mới hết.
4. Trình đọc màn hình: câu ấy có `role="status"`, nhưng chưa ai nghe thử.
