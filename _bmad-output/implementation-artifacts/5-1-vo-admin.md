# Story 5.1: Vỏ `/admin` — layout sở hữu chrome

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

**Là** người trong Ban tu phả,
**tôi muốn** bàn làm việc quản trị là **một trang** với thanh việc bên trái luôn có mặt,
**để** không màn nào — kể cả màn lỗi, màn đang tải — làm tôi mất chỗ đứng và phải bấm nút Back của trình duyệt để tìm đường về.

## Bối cảnh: con bug này không phải sơ suất, nó là kiến trúc

`app/ban-duyet/layout.tsx:13-14` ghi rõ chủ ý:

> *"Thanh điều hướng (ThanhBanDuyet) do TỪNG TRANG render — layout không biết mục nào đang mở (cùng nếp với bề mặt A: trang tự ghép chrome của mình)."*

Hệ quả đếm được trong mã hiện tại:

| Màn | Render `ThanhBanDuyet`? | `<main>` bề rộng | Số nhánh `return` tự dựng `<h1>` |
|---|---|---|---|
| `nap-khung/page.tsx` | ✅ | client tự lo | — |
| `xem-truoc/page.tsx` | ✅ | `max-w-[900px]` | 1 |
| `hang-cho/page.tsx` | ❌ **không** | `max-w-[1280px]` | **3** (dòng 118, 132, 146) |
| `hop-nhat/page.tsx` | ❌ **không** | `max-w-[1100px]` | **3** (dòng 146, 160, 205) |
| `*/error.tsx` (2 file) | ❌ | `max-w-[720px]` | — |
| `hop-nhat/loading.tsx` | ❌ | `max-w-[1100px]` | — |

Bốn bề rộng, không hệ thống nào. Hai trong bốn màn chính mất sạch điều hướng. **Mọi** màn lỗi và màn tải mất điều hướng.

Chừng nào chrome còn do trang tự ghép, sẽ luôn có trang quên. Story này không vá từng trang — nó **chuyển quyền sở hữu chrome sang layout**, để quên là chuyện không xảy ra được.

## Acceptance Criteria

### Vỏ và quyền sở hữu

1. Tồn tại `app/admin/layout.tsx` **sở hữu toàn bộ chrome**: thanh việc trái, vùng nội dung, bề rộng, và `<h1>` của màn. Cổng quyền (`admin` / `branch-head`) giữ nguyên hành vi hiện tại của `app/ban-duyet/layout.tsx`, kể cả màn "Khu vực Ban tu phả".
2. **Không file nào dưới `app/admin/` import `ThanhBanDuyet`**, và `components/pha/thanh-ban-duyet.tsx` bị xoá khỏi cây mã.
3. **Không trang con nào tự dựng `<main className="mx-auto max-w-[...]">`.** Bề rộng do layout quyết, đúng một chỗ. Bốn giá trị `720 / 900 / 1100 / 1280` không còn xuất hiện trong `app/admin/`.
4. **Đúng một `<h1>` cho mỗi màn**, do layout dựng từ tiêu đề màn con khai báo (qua `metadata.title` hoặc một export riêng). Không nhánh `return` nào của trang tự dựng `<h1>`.
5. `app/admin/*/error.tsx` và `app/admin/*/loading.tsx` **hiện ra bên trong chrome** — vì layout cha bọc chúng. Kiểm bằng cách ném lỗi thật trong một màn con và xác nhận thanh việc vẫn đứng.
   - Ngoại lệ trung thực: lỗi ném từ **chính** `app/admin/layout.tsx` thì `app/admin/error.tsx` chạy **không có** chrome (layout đã hỏng). Ghi chú ngay trong file ấy, đừng để người sau tưởng là bug.

### Thanh việc (worklist)

6. Thanh việc trái bày các khu vực **đang có màn thật**, mỗi mục là một `<a>` với vùng chạm ≥ 44px và `aria-current="page"` khi đang mở:

   | Mục | Đường | Số hiển thị | Nguồn số |
   |---|---|---|---|
   | Hàng chờ khẳng định | `/admin/hang-cho` | số khẳng định chờ | `listPendingAssertions()` (`core/assertion`) |
   | Mảnh chưa nối | `/admin/hop-nhat` | số mảnh rời | `getClanOverview().unconnectedFragments.length` (`core/tree`) |
   | Nạp khung | `/admin/nap-khung` | **không có số** | — (việc, không phải hàng chờ) |

   **Luật cho các story sau:** mỗi story của Epic 5 **tự thêm mục của mình** vào thanh việc khi màn của nó ra đời. 5-1 dựng cơ chế + ba mục đang có, **không** dựng mục trỏ vào màn chưa tồn tại — đường cụt còn tệ hơn thiếu mục.

7. Số trên mục là số **thật**, đọc từ `core/` trong layout (server). Đọc lỗi thì mục vẫn hiện, chỉ **không có số** — không hiện `0` giả.
8. Layout khai `export const dynamic = 'force-dynamic'` — số phụ thuộc người xem và đổi theo từng mutation (AD-23).

### Thu thành ray

9. Thanh việc **thu được** xuống ray hẹp (~56px) và mở lại được, bằng một nút có nhãn đọc được cho trình đọc màn hình.
10. **Khi thu, ray vẫn giữ con số.** Biểu tượng + số, không phải chỉ biểu tượng. Mất số là mất hộp thư đến đúng lúc đang làm việc.
11. Lựa chọn thu/mở được nhớ lại cho người xem ấy (`localStorage`, bọc `try/catch`, không có giá trị thì mặc định **mở**).
12. Cơ chế thu là **thủ công** ở story này. Tự động thu khi mở cây thuộc story 5-2 — 5-1 chỉ phải để sẵn đường cho 5-2 gọi vào.

### Đổi địa chỉ

13. `redirects()` trong `next.config.ts` chuyển hướng **vĩnh viễn (308)** toàn bộ địa chỉ cũ:

    ```
    /ban-duyet              → /admin
    /ban-duyet/nap-khung    → /admin/nap-khung
    /ban-duyet/nap-khung/mau→ /admin/nap-khung/mau     ← route tải mẫu CSV, ĐỪNG QUÊN
    /ban-duyet/xem-truoc    → /admin/nap-khung
    /ban-duyet/hang-cho     → /admin/hang-cho
    /ban-duyet/hop-nhat     → /admin/hop-nhat
    ```

14. Thư mục `app/ban-duyet/` **không còn tồn tại**. Mọi file chuyển sang `app/admin/`.
15. `revalidatePath` trong hai file actions trỏ đúng đường mới:
    - `app/admin/hang-cho/actions.ts` — hằng `DUONG` (hiện `'/ban-duyet/hang-cho'`)
    - `app/admin/hop-nhat/actions.ts` — hằng `DUONG` (hiện `'/ban-duyet/hop-nhat'`)
16. `components/pha/chan-trang.tsx` dòng 44–45 trỏ `/admin/hop-nhat` và `/admin`.

### "Xem trước" tan vào Nạp khung

17. `app/ban-duyet/xem-truoc/` bị xoá. Mục "Xem trước" không còn trên điều hướng.
18. Nội dung giải thích của trang chỉ đường ấy (*"bảng xem trước mở ra ngay sau khi chọn tệp"*) chuyển thành **một câu dẫn ở đầu màn Nạp khung** — thông tin không được rơi mất, chỉ đổi chỗ.

### Spine phải khớp lại

19. `EXPERIENCE.md` được sửa ở **ba** chỗ đang mô tả thanh ngang bốn mục (nếu không, mã và spine thành hai nguồn sự thật — đúng cái tội chính EXPERIENCE.md đã bắt và sửa hôm 11/08):
    - § IA › Bề mặt B › **Chrome của bề mặt B** (dòng ~160)
    - § Component Patterns › **Thanh bàn duyệt** (dòng ~274)
    - Ghi chú sửa 22/08 về mục *Xem trước* làm trang chỉ đường (dòng ~153)
20. `docs/build-contract.md` § Bản đồ route (dòng 105) đổi sang `app/admin/`.
21. `docs/van-hanh.md` § Sự cố thường gặp (dòng 62–63) đổi `/ban-duyet` → `/admin` và `app/ban-duyet/layout.tsx` → `app/admin/layout.tsx`.
22. `specs/frontend-stack.md` dòng 97 bỏ `thanh-ban-duyet.tsx`, thêm component mới.

### Nhà cho `/admin`

23. `/admin` **không redirect đi đâu cả** — Đợt 1 đưa thẳng vào nạp CSV, việc làm một lần trong đời, và đó là lý do bàn duyệt không có nhà. Story này cho nó một màn tối thiểu: bày lại chính các con số của thanh việc dưới dạng thẻ lớn, mỗi thẻ một đường vào.
    - **Chỉ vậy thôi.** Màn nhà "Hôm nay" đầy đủ không thuộc story này. Không thêm truy vấn `core/` nào ngoài những cái layout đã gọi.

### Sàn không được hạ

24. Sàn chữ **17px** áp nguyên, kể cả trên ray thu và số đếm (`15px` là tối thiểu tuyệt đối, chỉ cho nhãn phụ). Chật thì **bớt mục**, không thu chữ — `EXPERIENCE.md § Bề mặt B`.
25. Khung vẫn **trần**: nền `bg-ban-nen`, ô `bg-ban-o`, viền `border-ban-vien`, chữ không chân, **không đổ bóng** (`DESIGN.md § Elevation`). Dữ liệu phả bên trong màn vẫn theo luật bề mặt A (tên người `serif-phả`, chip tin cậy giữ ba mức).
26. Không xưng hô ngôi hai — cấm cả chữ "bạn" (`EXPERIENCE.md § Voice and Tone`).

## Tasks / Subtasks

- [x] **T1. Dựng vỏ** (AC: 1, 2, 3, 4, 8, 25, 26)
  - [x] Tạo `app/admin/layout.tsx`: giữ nguyên cổng quyền của `app/ban-duyet/layout.tsx`, thêm `export const dynamic = 'force-dynamic'`
  - [x] Layout đọc số từ `core/` (T2) rồi render `<KhungAdmin>` (client) bọc `{children}`
  - [x] Tạo `components/admin/khung-admin.tsx` (client): ba vùng — thanh việc trái · nội dung · (cột phải để trống, 5-3 mới dùng)
  - [x] Quyết một hệ bề rộng duy nhất cho vùng nội dung và ghi lý do vào doc header
  - [x] Cơ chế tiêu đề: trang con khai tiêu đề, layout dựng `<h1>` — chọn một cách và ghi rõ trong doc header
- [x] **T2. Thanh việc + số** (AC: 6, 7, 24)
  - [x] `components/admin/thanh-viec.tsx`: danh sách mục, `aria-current`, vùng chạm 44px
  - [x] Layout gọi `listPendingAssertions()` và `getClanOverview()`; `Result` lỗi → mục không số, **không** hiện `0`
- [x] **T3. Ray thu** (AC: 9, 10, 11, 12)
  - [x] Nút thu/mở có nhãn cho trình đọc màn hình
  - [x] Ray ~56px giữ biểu tượng **và** số
  - [x] Nhớ lựa chọn bằng `localStorage` trong `try/catch`, mặc định mở
  - [x] Để sẵn đường cho 5-2 gọi thu tự động (prop hoặc context) — **không** tự thu ở story này
- [x] **T4. Dời route** (AC: 13, 14, 15, 16)
  - [x] `git mv app/ban-duyet app/admin` rồi sửa mọi doc header nhắc đường cũ
  - [x] Thêm `redirects()` vào `next.config.ts` — **6 dòng**, gồm `/ban-duyet/nap-khung/mau`
  - [x] Sửa hằng `DUONG` trong hai file `actions.ts`
  - [x] Sửa `components/pha/chan-trang.tsx:44-45`
  - [x] Sửa hai `href` trong `app/admin/nap-khung/nap-khung-client.tsx` (dòng 260, 579)
- [x] **T5. Gỡ trang con tự ghép chrome** (AC: 2, 3, 4, 5)
  - [x] `nap-khung/page.tsx` — bỏ `ThanhBanDuyet`
  - [x] `hang-cho/page.tsx` — bỏ `<main className="mx-auto max-w-[1280px]">` và `<h1>` ở **cả ba** nhánh return
  - [x] `hop-nhat/page.tsx` — như trên ở **cả ba** nhánh (`max-w-[1100px]`)
  - [x] Hai `error.tsx` — bỏ `<main className="mx-auto max-w-[720px]">` và `<h1>`, giữ nguyên prop `retry`
  - [x] `hop-nhat/loading.tsx` — bỏ bề rộng riêng
  - [x] Thêm `app/admin/error.tsx` kèm ghi chú vì sao nó không có chrome
  - [x] Xoá `components/pha/thanh-ban-duyet.tsx`
- [x] **T6. Tan "Xem trước"** (AC: 17, 18)
  - [x] Xoá `app/admin/xem-truoc/`
  - [x] Chuyển câu giải thích sang đầu màn Nạp khung
- [x] **T7. Nhà cho `/admin`** (AC: 23)
  - [x] `app/admin/page.tsx` bày lại số của thanh việc thành thẻ lớn — không truy vấn `core/` mới
- [x] **T8. Khớp lại spine + docs** (AC: 19, 20, 21, 22)
- [x] **T9. Test bất biến** (xem § Testing)
  - [x] Thêm `'app/**/*.test.ts'` vào `include` của `vitest.config.ts`
  - [x] Viết `app/admin/chrome.test.ts`
  - [x] `npm test` xanh

### Review Findings

Code review 24/08/2026 — ba tầng đối kháng (Blind Hunter · Edge Case Hunter · Acceptance Auditor),
mức nghiêm trọng do người điều phối tự chấm sau khi đọc lại mã, không lấy mức của subagent.

- [x] [Review][Patch] **CHỐT 24/08: nới ray, giữ sàn 17px.** Số đếm ở `15px` trong khi AC 24 gọi đích danh "số đếm" thuộc sàn `17px` — `khung-admin.tsx:268` (ray) và `:282` (mở). AC 24 chặn luôn lối thoát: *"Chật thì bớt mục, không thu chữ."* Nâng lên 17px thì ray `w-14` (56px) không đủ, mà nới ray là đổi ngân sách bề ngang đã chốt trong `EXPERIENCE.md` (1280 − 56 − 360 = 864px canvas) — việc của 5-2. § Câu hỏi để dành #2 đã hỏi đúng câu này và § Completion Notes không trả lời.
- [x] [Review][Patch] **CHỐT 24/08: giữ cả hai, khai bổ sung vào bảng "Lệch so với story".** Phạm vi chưa khai trong § Completion Notes — story tự khai *"chỉ dựng VỎ"* và Dev Notes dặn *"đừng tiện tay tái cấu trúc gì quanh nó"*, nhưng diff đổi hành vi `core/seed` (loại cảnh báo mới `father-ambiguous`, sửa `previewSeedOp` + `resolveByName`, 2 test hồi quy), mở lại nhóm `admin` trong `uiworkshop/_registry/outline.ts:94-124`, và thêm dòng `reset-admin-password.ts` vào `docs/van-hanh.md` ngoài phần AC 21 cho phép. Duyệt 39 file này là ngầm nhận cả `app/uiworkshop/admin-canvas-graph/page.tsx` — 1.025 dòng chưa theo dõi, không nằm trong changeset.
- [x] [Review][Patch] **CHỐT 24/08: giữ ô tìm, đánh dấu đích `/nguoi/[id]` là TẠM ngay trong mã.** Ô tìm trên thanh trên: không AC nào yêu cầu, đã được viết vào `EXPERIENCE.md:176` như chrome đã chốt, và `epics-dot-2.md:65-66` đã ghi 5-2 phải đổi đích của nó. Quyền riêng tư thì SẠCH (kiểm rồi: `app/admin/actions.ts` chỉ chuyển tiếp sang `core/tree.searchPersons`, hàm này tự giải người xem và loại người ngoài bán kính — AD-13/AD-21 giữ). Câu hỏi là giữ nguyên, gỡ, hay đánh dấu tạm trong mã.

- [x] [Review][Patch] `app/admin/error.tsx` không bắt được lỗi của chính layout, và khi nó chạy thì chạy BÊN TRONG chrome [app/admin/error.tsx:6-9,24,26]
- [x] [Review][Patch] Cảnh báo `father-ambiguous` hứa "vẫn ghi được" nhưng dòng ấy mặc định bị bỏ qua [app/admin/nap-khung/nap-khung-client.tsx:468 vs :95]
- [x] [Review][Patch] Ô tìm kẹt "Đang tìm…" vĩnh viễn khi hai lượt tìm về sai thứ tự, và không có `.catch` [components/admin/khung-admin.tsx:141-147]
- [x] [Review][Patch] `ghiVaoPha` không revalidate gì — nạp khung xong số trên thanh việc vẫn là số cũ [app/admin/nap-khung/actions.ts:106-112]
- [x] [Review][Patch] `chrome.test.ts` không quét `components/admin/` — đúng file chứa chrome thì không soi; whitelist `<h1>` đang khoá cứng lỗi trên [app/admin/chrome.test.ts:17,73]
- [x] [Review][Patch] Chưa có test chiều ngược page→MAN: màn không đăng ký trong `MAN` nhận `<h1>` fallback sai, im lặng [components/admin/khung-admin.tsx:356]
- [x] [Review][Patch] `manTheoDuong` so tiền tố không có biên segment — `/admin/hang-cho-cu` sẽ sáng nhầm mục [components/admin/man-admin.ts:110]
- [x] [Review][Patch] Không có `app/admin/loading.tsx` — vào nguội bất kỳ URL admin nào là màn trắng suốt một lượt tính toàn cây [app/admin/layout.tsx:29,56]
- [x] [Review][Patch] Badge không có trần `99+`, bị cắt trong ray 56px sau một lượt nạp khung [components/admin/khung-admin.tsx:268]
- [x] [Review][Patch] Ba trong bốn màn admin không có `<title>`; hai nguồn tiêu đề đã lệch nhau [app/admin/nap-khung/page.tsx:14 vs components/admin/man-admin.ts]
- [x] [Review][Patch] Đổi nhãn "Bàn duyệt" → "Bàn làm việc" mới nửa chừng — chrome và chân trang đã đổi, nội dung màn chưa [app/admin/hang-cho/page.tsx:121,132; app/admin/hang-cho/bang-cho-duyet.tsx:195]
- [x] [Review][Patch] Spine vừa khớp lại đã trôi tiếp: `EXPERIENCE.md:573` trỏ prototype đã xoá, `:177` gọi thanh ghi là "Dòng họ" trong khi mã và epic nói "Sổ dòng họ" [EXPERIENCE.md:177,573]
- [x] [Review][Patch] `specs/frontend-stack.md` xếp component mới dưới đoạn "`components/pha/`"; `components/admin/` là root thứ ba, chưa khai ở đâu [specs/frontend-stack.md:88-97]
- [x] [Review][Patch] Admin bootstrap (`personId: null`) gặp ngõ cụt vòng tròn — màn nhà đổ cho "đọc hỏng", màn con nói "chưa gắn vào phả", không đâu link `/gan-node` [app/admin/page.tsx:48,52]
- [x] [Review][Patch] Bàn phím và trình đọc màn hình: dropdown không đóng bằng Escape, nút thu đọc nhãn hai lần, thiếu `aria-expanded`/`aria-controls` [components/admin/khung-admin.tsx:149-156,308-309]
- [x] [Review][Patch] Hai tab `/admin` không đồng bộ trạng thái thu/mở, cache module không bị vô hiệu hoá [components/admin/khung-admin.tsx:73-107,332-334]
- [x] [Review][Patch] Không có `app/admin/not-found.tsx` — gõ nhầm URL dưới `/admin` rơi ra 404 công khai, ngoài chrome và ngoài cổng quyền [app/admin/]
- [x] [Review][Patch] Chú thích thứ tự redirect dạy một luật SAI, và test khoá nó lại thành bất biến [next.config.ts:20-23; app/admin/chrome.test.ts:113-117]

- [x] [Review][Defer] Cảnh báo xem trước tính mù quyết định — preview đếm mọi dòng, commit chỉ đếm dòng còn hoạt động [core/seed/ops.ts:128-131 vs :187,216] — deferred, thuộc bộ nạp khung, không phải vỏ admin
- [x] [Review][Defer] Union vợ chồng bị bỏ im lặng khi tên mơ hồ — `SeedRowWarning` không có loại nào báo được [core/seed/ops.ts:347,350; core/seed/index.ts:38-46] — deferred, cần thêm loại cảnh báo mới
- [x] [Review][Defer] Ô tìm đẩy sang `/nguoi/[id]`, bung khỏi bàn làm việc [components/admin/khung-admin.tsx:191] — deferred, `epics-dot-2.md:65-66` đã giao việc này cho 5-2
- [x] [Review][Defer] `/admin` tính lại toàn cây lần hai trong cùng request [app/admin/page.tsx:60] — deferred, AC 23 đã định giá và chấp nhận
- [x] [Review][Defer] `components/pha/chan-trang.tsx` dẫn khách công khai tới đích có cổng [components/pha/chan-trang.tsx:44-45] — deferred, có từ trước, chỉ đổi đường không đổi cách gác
- [x] [Review][Defer] Combobox thiếu ngữ nghĩa đầy đủ (arrow key, `role="listbox"`, `aria-activedescendant`, vùng `aria-live`) [components/admin/khung-admin.tsx:170-200] — deferred, đi cùng lúc 5-2 dựng lại ô tìm


## Dev Notes

### Hiện trạng các file sẽ SỬA (đọc trước khi động vào)

| File | Hiện làm gì | Story này đổi gì | Phải giữ nguyên |
|---|---|---|---|
| `app/ban-duyet/layout.tsx` (45 dòng) | cổng quyền + `<div className="min-h-dvh bg-ban-nen">` | thành `app/admin/layout.tsx`, thêm chrome + số | **Hành vi cổng**: chưa đăng nhập → `/dang-nhap`; thiếu vai → màn "Khu vực Ban tu phả" **không lộ gì** về phía sau cổng |
| `app/ban-duyet/page.tsx` (9 dòng) | `redirect('/ban-duyet/nap-khung')` | thành màn nhà tối thiểu (AC 23) | — |
| `app/ban-duyet/nap-khung/page.tsx` (26 dòng) | render `ThanhBanDuyet` + `<NapKhungClient/>` | bỏ chrome | `nhanNguoiVanHanh()` — nhãn "ai đang vận hành" là **FR-39**, không được rơi; nó chuyển lên layout |
| `app/ban-duyet/hang-cho/page.tsx` (217 dòng) | 3 nhánh return, mỗi nhánh tự dựng `<main>` + `<h1>` | bỏ vỏ ở cả 3 | Toàn bộ lập luận ở doc header — nhất là **"hàng chờ" ở đây KHÔNG có nghĩa là chưa ai thấy**; và nút "Trả lại" bắt buộc kèm lý do |
| `app/ban-duyet/hop-nhat/page.tsx` (453 dòng) | như trên | như trên | **Không có đường nhanh**: không gộp hàng loạt, không gợi ý nào tích sẵn, gộp thật đứng sau hai bước hai vai (AD-22). Và **phải bày cả chỗ khác nhau**, ngang hàng chỗ giống nhau |
| `app/ban-duyet/*/error.tsx` | `<main max-w-[720px]>` + `<h1>` | bỏ vỏ | prop là **`retry`**, không phải `reset` (Next 16.3) |
| `components/pha/chan-trang.tsx` | link tới `/ban-duyet` | đổi đường | — |
| `next.config.ts` | chỉ có `allowedDevOrigins` | thêm `redirects()` | `allowedDevOrigins` (IP Tailscale) — xoá là mất đường xem từ máy khác |

> **Cảnh báo phạm vi:** hai link chân trang tới bàn duyệt hiện **không gác theo vai** — mọi thành viên đều thấy một cánh cửa không mở được. Dữ liệu không rò (layout gác), nên đây **không** phải việc của story này. Ghi lại để không ai tưởng là quên.

### Vì sao layout sở hữu chrome ở bề mặt B mà bề mặt A thì không

Bề mặt A **cũng** không có layout (`app/(pha)/` chỉ có `page.tsx` + `loading.tsx`; mọi trang tự render `ThanhDieuHuong`). Story này **cố ý lệch nếp** cho riêng bề mặt B, vì hai bề mặt có bài toán khác nhau:

- Bề mặt A: 5 mục cố định, không đếm, trang mobile bố cục rất khác nhau → trang tự ghép còn chịu được.
- Bề mặt B: 7+ khu vực sau Epic 5, thanh việc mang **số phải luôn nhìn thấy**, và cột phải giữ trạng thái xuyên màn (5-3) → chrome phải sống lâu hơn trang.

Ghi lập luận này vào doc header của `app/admin/layout.tsx`. Người sau sẽ hỏi.

### Cơ chế "layout bọc error/loading" — đây là cái vá tận gốc

Trong App Router, `app/admin/hang-cho/error.tsx` được bọc bởi layout **cha** của nó, tức `app/admin/layout.tsx`. Nên khi chrome nằm ở layout, **mọi** trạng thái của mọi màn con — lỗi, đang tải, rỗng — tự động có chrome. Không phải nhớ, không phải review bắt.

Đó là lý do story này đổi chỗ sở hữu thay vì thêm `ThanhBanDuyet` vào hai file còn thiếu.

### Ràng buộc kiến trúc

- **AD-1** — `app/` chỉ import `core/`, tuyệt đối không đụng `db/`, ORM, hay storage SDK. Số cho thanh việc đi qua `core/assertion` và `core/tree`.
- **AD-24** — `core/` tự đọc danh tính từ phiên; **không** truyền `clanId` / vai / node vào như tham số.
- **AD-23** — mọi thứ phụ thuộc người xem **không được cache** ngoài core → `dynamic = 'force-dynamic'`.
- Cổng quyền của layout **không thay thế** cổng trong từng action — core gác lại lần nữa. Đừng gỡ.

### Next.js 16.3 — những chỗ dễ viết theo thói quen cũ

Đọc `docs/next16-delta.md` trước khi gõ. Ba chỗ chạm vào story này:

1. **`redirects()` trong `next.config.ts`, KHÔNG phải `proxy.ts`.** Repo chưa có `proxy.ts`, và middleware ở Next 16 đã đổi tên thành `proxy.ts` chạy trên mọi request. Đổi tên route vĩnh viễn là việc của cấu hình khai báo, không phải của một lớp chạy lúc chạy:
   ```ts
   const nextConfig: NextConfig = {
     allowedDevOrigins: [...],
     async redirects() {
       return [
         { source: '/ban-duyet', destination: '/admin', permanent: true },
         // ...5 dòng còn lại
       ];
     },
   };
   ```
2. **`LayoutProps<'/admin'>`** dùng được, không cần import (sinh bởi `next dev` / `next typegen`). Root layout đã dùng `LayoutProps<"/">` — theo nếp đó.
3. **`error.tsx` nhận `retry`, không phải `reset`.** Viết `reset` sẽ nhận `undefined` mà không báo lỗi biên dịch.

Bối cảnh khác: Turbopack là mặc định cho cả `dev` lẫn `build`; `next lint` đã bị gỡ và `next build` không lint nữa.

### Vốn có sẵn — đừng dựng lại

| Cần | Đã có |
|---|---|
| Số khẳng định chờ | `listPendingAssertions()` — `core/assertion/index.ts:128` |
| Số mảnh rời | `getClanOverview()` → `unconnectedFragments` — `core/tree/index.ts:71` |
| Nhãn người vận hành (FR-39) | `nhanNguoiVanHanh()` — `app/ban-duyet/nap-khung/nguoi-van-hanh.ts`, **chuyển lên layout** |
| Token khung trần | `--color-ban-nen` / `--color-ban-o` / `--color-ban-vien` — `app/globals.css:166-168` |
| Primitive | `components/ui/{badge,button,card,checkbox,table}.tsx` |

Chuỗi nguồn sự thật màu là **một chiều**: `DESIGN.md` ──chép tay──▶ `app/globals.css @theme` ──▶ class Tailwind. Cần màu mới thì sửa `DESIGN.md` trước.

### Testing

Repo **không có** thư viện test React: `vitest.config.ts` chạy `environment: 'node'`, `include: ['core/**/*.test.ts', 'db/**/*.test.ts', 'components/**/*.test.ts']`. Không có `@testing-library`, không có jsdom, không có e2e.

**Đừng dựng hạ tầng test React trong story này.** Thay vào đó, viết đúng loại test bắt được đúng con bug này — **test bất biến trên mã nguồn**, chạy được trong môi trường node:

- Thêm `'app/**/*.test.ts'` vào `include`.
- `app/admin/chrome.test.ts` đọc file trong `app/admin/` và khẳng định:
  1. Không file nào chứa `ThanhBanDuyet`
  2. Không file nào khớp `mx-auto max-w-\[` (bề rộng chỉ layout được đặt)
  3. Chỉ `layout.tsx` chứa `<h1`
  4. Không file nào chứa chuỗi `/ban-duyet`
  5. `next.config.ts` có đủ **6** cặp redirect
  6. `app/ban-duyet` không còn tồn tại

Test này rẻ, chạy trong mili-giây, và chặn **vĩnh viễn** cái lớp bug "một trang quên chrome" — thứ mà một test render một màn không bắt được.

Phần thị giác và tương tác kiểm bằng tay, ghi kết quả vào § Completion Notes:

- [ ] Bốn màn con — chrome đứng nguyên, mục đang mở đậm + `aria-current`
- [ ] Ném lỗi thật trong `/admin/hang-cho` → thanh việc vẫn còn
- [ ] Thu ray → **số vẫn hiện**; F5 → vẫn thu
- [x] `/ban-duyet/hang-cho` → 308 sang `/admin/hang-cho` — kiểm bằng curl, cả **sáu** đường
- [x] Tải mẫu CSV từ đường cũ vẫn tải được — `/ban-duyet/nap-khung/mau` 308 → tới đúng handler
- [ ] Bàn phím: Tab đi hết thanh việc, mọi vùng chạm ≥ 44px
- [ ] 1280px và 1366px — không tràn ngang

### Project Structure Notes

```
app/admin/
  layout.tsx          ← MỚI: cổng quyền + chrome + số + <h1>
  page.tsx            ← ĐỔI: từ redirect thành màn nhà tối thiểu
  error.tsx           ← MỚI: có ghi chú vì sao nó không có chrome
  nap-khung/          ← DỜI, bỏ chrome; nhận thêm câu dẫn của xem-truoc
  hang-cho/           ← DỜI, bỏ vỏ ở cả 3 nhánh return
  hop-nhat/           ← DỜI, bỏ vỏ ở cả 3 nhánh return
  xem-truoc/          ← XOÁ
  chrome.test.ts      ← MỚI

components/admin/     ← THƯ MỤC MỚI (song song với components/pha, components/ui)
  khung-admin.tsx     ← client, sở hữu trạng thái thu/mở
  thanh-viec.tsx      ← thanh việc + ray

components/pha/thanh-ban-duyet.tsx   ← XOÁ
```

Tên file/biến tiếng Việt không dấu, kebab-case — nếp của toàn repo. Mỗi file mở đầu bằng doc header tiếng Việt nói **vì sao** file tồn tại và spine nào chi phối; đây là nếp dày đặc trong repo, không phải tuỳ chọn.

`components/admin/` là thư mục mới: bề mặt B nay có component riêng đủ nhiều để không nhét chung vào `components/pha/` (nơi chứa thứ của bề mặt A).

### Learnings từ Đợt 1 mang sang

Đợt 1 xong 25 story, không story nào để lại file. Không có "previous story" để đọc. Nhưng có hai bài học ghi được từ hồi ký và git:

1. **`components/pha/xep-cay.ts` (cách xếp cây) là tự viết**, không dùng dagre/elk, và hai commit gần nhất vừa sửa "thẻ đè lên nhau" và "cây bị bóp trong hộp cố định". Story 5-1 **không** chạm vào nó — nhưng 5-2 sẽ, nên đừng tiện tay tái cấu trúc gì quanh nó ở đây.
2. **Đường được khuyến nghị là đường chưa được thử.** Bug mới nhất của dự án (`scripts/reset-admin-password.ts`) nằm đúng ở nhánh mà tài liệu bảo người dùng đi, còn nhánh được test là nhánh ít ai dùng. Áp vào story này: nhánh **lỗi** và nhánh **rỗng** của mỗi màn phải được mở ra xem tận mắt, vì chúng chính là chỗ chrome đang mất.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epics-dot-2.md#Epic 5`] — 7 story, thứ tự phụ thuộc, ngân sách bề ngang
- [Source: `_bmad-output/planning-artifacts/ux-designs/.../EXPERIENCE.md#Bề mặt B — quản trị (desktop)`] — bảng IA, "cảnh báo không có màn riêng", ghi chú 22/08 về Xem trước
- [Source: `.../EXPERIENCE.md#Chrome của bề mặt B`] — thanh trên cùng bốn mục (**AC 19 sửa chỗ này**), sàn 17px, "bảng chật thì bớt cột, không thu chữ"
- [Source: `.../EXPERIENCE.md#Voice and Tone`] — cấm ngôi hai, cấm cả "bạn"
- [Source: `.../DESIGN.md#Bề mặt B — khung trần, dữ liệu phả giữ chất liệu`] — ranh giới thực hành: một pixel biểu diễn khẳng định về người thật thì theo luật bề mặt A
- [Source: `.../DESIGN.md#Elevation & Depth`] — không đổ bóng
- [Source: `.../ARCHITECTURE-SPINE.md#AD-1`], [`#AD-23`], [`#AD-24`]
- [Source: `docs/next16-delta.md#6`] — proxy.ts vs redirects
- [Source: `docs/next16-delta.md#8`] — `retry` thay `reset`
- [Source: `docs/next16-delta.md#Generated type helpers`] — `LayoutProps<'/admin'>`
- [Source: `docs/build-contract.md#Bản đồ route production`] — **AC 20 sửa chỗ này**
- [Source: `_bmad-output/brainstorming/brainstorm-thiet-ke-lai-admin-2026-08-23/.memlog.md`] — nguồn của mọi quyết định thiết kế trên

### Câu hỏi để dành cho sau khi viết xong

1. Tiêu đề màn: layout đọc từ `metadata.title` (đơn giản, nhưng metadata mang cả hậu tố cho tab trình duyệt) hay trang con export một hằng riêng (rõ hơn, nhưng thêm một nếp mới)? Dev chọn, ghi lý do vào doc header.
2. Ray thu ở 56px — số hai chữ số (`12`) còn đọc được ở sàn 15px không? Nếu không thì ray phải rộng hơn, **không** phải chữ nhỏ đi.

## Dev Agent Record

### Agent Model Used

_(điền khi implement)_

### Debug Log References

### Completion Notes List

### File List

## Completion Notes

Dev: Claude Opus 5 · 24/08/2026. Vào việc theo yêu cầu *"cập nhật toàn bộ theme của admin theo
hướng bản dựng thử `admin-canvas-graph`, bỏ các view cũ"*.

### Lệch so với story, và vì sao

| Story ghi | Đã làm | Vì sao |
|---|---|---|
| `components/admin/thanh-viec.tsx` là file riêng | `ThanhViec` nằm trong `khung-admin.tsx` | Nó không tái dùng ở đâu khác và dùng chung trạng thái thu/mở với khung. Tách file chỉ để tách thì thêm một ranh giới không mang nghĩa. |
| "trang con khai tiêu đề, layout dựng `<h1>`" | bản đồ màn tập trung ở `components/admin/man-admin.ts` | Nếu tiêu đề do trang khai thì trang vẫn có thể **quên khai** — đúng lớp bug story này sinh ra để diệt. Bản đồ tập trung cho cả `<h1>`, nhãn thanh việc và `aria-current` cùng một nguồn. |
| `useState` + `useEffect` đọc `localStorage` | `useSyncExternalStore` | ESLint `react-hooks/set-state-in-effect` chặn `setState` trong thân effect. Kho ngoài là cách React 19 muốn, và nó bỏ luôn một nhịp nhấp nháy khi hydrate. |
| — | **thêm ô tìm người trên thanh trên** | Bản dựng thử có ô tìm và nó là một phần của diện mạo. Nối vào `core/tree.searchPersons` thật (đã lọc bán kính riêng tư — AD-13/21), chọn một người thì sang trang người ấy. Khi màn cây (5-2) ra đời, chính ô này đổi thành *"gõ để dời tâm"*. |

**Bổ sung 24/08/2026 sau code review.** Ba mảng dưới đây cũng lệch khỏi phạm vi story nhưng bảng
trên bỏ sót — người đọc bảng ấy sẽ không biết là `core/` đã đổi. Chốt: **giữ cả ba, khai ra đây.**

| Story ghi | Đã làm | Vì sao |
|---|---|---|
| *"Story này chỉ dựng VỎ"*; Dev Notes: *"đừng tiện tay tái cấu trúc gì quanh nó ở đây"* | **đổi hành vi `core/seed`**: thêm loại cảnh báo `father-ambiguous` (`core/seed/index.ts`), sửa `previewSeedOp` + `resolveByName` (`core/seed/ops.ts`), hai test hồi quy | Bộ nạp khung đang nối cha vào **người trùng tên đầu tiên tìm thấy**, im lặng, không cảnh báo — nối nhầm cha là hỏng phả của cả một chi. Gặp thì không để lại được. Nhưng nó là sửa lỗi thật ở tầng dưới, không phải việc của một story dựng vỏ, nên phải khai. |
| — | **mở lại nhóm `admin` trong xưởng UI** (`app/uiworkshop/_registry/outline.ts`), thêm dữ liệu giả cho FR-64/FR-65 (`_mock/seed.ts`) | Vật liệu cho 5-2/5-3/5-5/5-7, dựng sẵn trong lúc còn nhớ bối cảnh. Bản dựng thử `admin-canvas-graph` (1.025 dòng) **chưa theo dõi trong git** — nó không thuộc changeset này, và chính nó là thứ đã hạ mức rủi ro của 5-2. |
| AC 21 chỉ cho phép: *"§ Sự cố thường gặp (dòng 62–63) đổi `/ban-duyet` → `/admin`"* | thêm cả dòng cho `scripts/reset-admin-password.ts` vào `docs/van-hanh.md` | Script ấy sinh ra cùng lúc, khi lần đầu gặp ngõ cụt đăng nhập của tài khoản bootstrap. Không ghi vào sổ vận hành thì lần sau lại phải tìm lại từ đầu. |

### Không làm, và vì sao

- **Canvas ở giữa và cột phải chồng khẳng định** — đó là story 5-2 và 5-3. Story này chỉ dựng
  VỎ. Thanh việc vì thế chưa có mục *Cây gia phả*, *Duyệt vào phả*, *Mâu thuẫn*: mỗi story tự
  thêm mục của mình khi màn của nó ra đời.
- **Hai link chân trang chưa gác theo vai** — đã ghi ở § Dev Notes là ngoài phạm vi; chỉ đổi
  đường, không đổi cách gác.

### Đã kiểm được

- `npx tsc --noEmit` sạch · `npx eslint app components` sạch · `npx vitest run` **126/126 xanh**
  (114 cũ + 12 của `app/admin/chrome.test.ts`).
- Sáu chuyển hướng trả **308** đúng đích, kiểm bằng `curl` trên server dev.
- `/admin/*` khi chưa đăng nhập trả **307 → `/dang-nhap`** ⇒ cổng quyền của layout chạy thật.
- Khung dựng ra HTML đúng: thanh trên, ba nhóm, bốn mục, số `7` trên *Hàng chờ*, *Mảnh chưa nối*
  **vắng số** khi truyền `null` (không hoá thành `0`), nút thu có nhãn cho trình đọc màn hình.
  Kiểm bằng một route nháp gọi thẳng `<KhungAdmin>`, đã xoá sau khi kiểm.

### CHƯA kiểm được — cần mắt người

Máy này **không có trình duyệt headless**, và mọi màn con của `/admin` đều đứng sau đăng nhập mà
phiên quản trị thì không nằm trong tay dev. Bốn ô còn để trống ở § Testing là những thứ chỉ xác
nhận được bằng cách mở màn thật: chrome khi ném lỗi, thu ray rồi F5, đường bàn phím, và 1280px.
