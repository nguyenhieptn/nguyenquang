# Deferred work

Việc thật, đã xác nhận, nhưng không thuộc phạm vi lần thay đổi sinh ra nó. Mỗi mục ghi rõ nguồn
gốc để lần sau không phải điều tra lại.

## Deferred from: code review of 5-1-vo-admin (2026-08-24)

- **Cảnh báo xem trước của bộ nạp khung tính mù quyết định.** `previewSeedOp` đếm `inFile` trên
  MỌI dòng (`core/seed/ops.ts:128-131`), còn `resolveByName` khi commit chỉ đếm trên `activeByFolded`
  dựng từ những dòng chưa bị `skip` (`:187`, `:216`). `previewSeedOp` không nhận tham số `decisions`
  nên cảnh báo không bao giờ tính lại được. Hai chiều sai: (a) người vận hành bỏ một trong hai dòng
  trùng tên → màn nói "gốc tạm của một mảnh" nhưng commit lại NỐI được vào người còn lại; (b) dòng
  duy nhất mang tên cha bị bỏ → xem trước không cảnh báo gì, commit rơi xuống tìm trong phả rồi im
  lặng bỏ cha. Sửa đúng cần quyết định kiến trúc: truyền `decisions` vào preview, hay tính lại cảnh
  báo phía client. *Lý do hoãn: thuộc bộ nạp khung, không phải vỏ admin — story 5-1 chỉ dựng vỏ.*

- **Union vợ chồng bị bỏ im lặng khi tên mơ hồ.** Guard `fileMatches.length > 1 → null` mới thêm
  cũng áp cho `resolveByName` ở nhánh vợ/chồng (`core/seed/ops.ts:347`, `:350`), nên một
  `ten_vo_chong` mơ hồ cho `spouseId === undefined` → `continue` → không ghi union, không cảnh báo
  ở bất kỳ bề mặt nào, commit vẫn báo thành công. `SeedRowWarning` (`core/seed/index.ts:38-46`) chỉ
  có ba loại `father-not-found` / `father-ambiguous` / `duplicate-in-file`, và `loadClanCandidates`
  (`ops.ts:89-92`) còn không nạp tên vợ chồng nên preview không thể cảnh báo.
  *Lý do hoãn: cần thêm một loại cảnh báo mới và mở rộng preview — việc riêng, không phải vá.*

- **Ô tìm trên thanh trên đẩy người dùng sang `/nguoi/[id]`, bung khỏi bàn làm việc.**
  `components/admin/khung-admin.tsx:191` gọi `router.push('/nguoi/…')` — route thuộc nhóm
  `app/(pha)/`, tức bề mặt A công cộng. Cả layout `/admin` unmount: thanh việc, các con số, thanh
  trên, ô tìm mất sạch; chỉ nút Back đưa về.
  *Lý do hoãn: `epics-dot-2.md:65-66` đã giao đúng việc này cho 5-2 — đích đúng là "dời tâm canvas
  + mở cột phải", mà cột phải là 5-3. Vá bây giờ sẽ bị viết đè.*

- **`/admin` tính lại toàn bộ cấu trúc cây lần thứ hai trong cùng một request.**
  `app/admin/page.tsx:60` chạy lại `listPendingAssertions()` + `getClanOverview()` mà
  `app/admin/layout.tsx:56` vừa chạy; `getClanOverview` là một lượt `loadTreeData` + `computeStructure`
  trên cả dòng họ. `resolveSession` đã được bọc `cache()` sẵn (`core/identity/session.ts:44`) nên
  một tầng `cache()` theo request là có sẵn và không phạm AD-23.
  *Lý do hoãn: AC 23 đã định giá và chấp nhận đánh đổi này; đảo lại là đảo một quyết định đã chốt.*

- **`components/pha/chan-trang.tsx:44-45` dẫn khách công khai tới đích có cổng.** Có từ trước
  (trước đây trỏ `/ban-duyet`), nhưng đổi nhãn "Bàn duyệt" → "Bàn làm việc" làm một đích bị gác
  đọc lên giống nơi ai cũng vào được.
  *Lý do hoãn: AC 16 chỉ cho phép đổi đường, không cho đổi cách gác.*

- **Combobox của ô tìm thiếu ngữ nghĩa đầy đủ.** Không `role="combobox"`/`aria-expanded`/
  `aria-controls`/`aria-activedescendant`, không đi được bằng phím mũi tên, không vùng `aria-live`
  báo "Đang tìm…" hay số kết quả (`components/admin/khung-admin.tsx:170-200`).
  *Lý do hoãn: đi cùng lúc 5-2 dựng lại ô tìm; phần rẻ và độc lập (Escape để đóng) đã tách ra thành
  một mục patch của lần review này.*

## Deferred from: 5-3-panel-khang-dinh (2026-08-25)

- **Phát hiện "hai người cùng khai là cha".** Phép xếp chồng hiện phân loại theo `kind`, nên
  `parent-child` luôn là chồng NỐI TIẾP — đúng cho ca thường gặp (cha và mẹ là hai khẳng định), sai
  cho ca đáng lo: hai khẳng định cùng trỏ vào hai người **cùng giới**, cùng `relation: 'blood'`.
  Đó là mâu thuẫn thật, và là đúng lớp lỗi mà bộ nạp khung sinh ra nhiều nhất.

  Không làm ở 5-3 vì `PersonAssertion` không mang giới của người cha lẫn `relation` — phải tính ở
  `core/person/read-ops.ts` nơi còn cả hàng thô. Việc riêng, nhỏ, và nên làm trước khi dòng họ
  nhập dữ liệu thật hàng loạt.

- **`hideAssertion` trong panel.** Epic xếp SHOULD (*"nhỏ, đã có sẵn chỗ"*). AD-17 cho phép một
  lượt báo cáo ẩn ngay không cần duyệt; hàm core đã có, chỉ thiếu nút.

## Deferred from: 5-5-duyet-vao-pha (2026-08-25)

- **Màn duyệt chưa nói TÀI KHOẢN nào đang xin.** `PendingAttachment` mang `accountId` nhưng không
  mang tên hiển thị, nên màn chỉ nói được "một tài khoản đang nhận là <tên người trong phả>".
  Người duyệt cần biết ai đang xin để quyết. `lookupAccountNames` đã có ở `core/assertion/ops`,
  nhưng đây là dữ liệu danh tính đi qua ranh giới AD-8 (`user` nằm ngoài phân vùng clan) nên đáng
  làm thành một lượt nối riêng, có chủ ý.

## Deferred from: 5-7-noi-chon (2026-08-25)

- **Gộp / tách NƠI.** FR-65 đòi (*"Trùng thì gộp được, gộp nhầm thì tách được"*), và cột
  `place.merged_into` đã dựng sẵn để đón — nhưng gộp đúng cách là cả một module. `core/merge` cho
  NGƯỜI dài hơn 400 dòng: đề xuất, quyền AD-22, repoint mọi cạnh, bia mộ AD-3, và đường tách lại.
  Nhét vào 5-7 là làm hỏng cả hai. `giaiNoi()` trong `core/place/ops.ts` đã đọc được chuỗi
  `merged_into` nên phần ĐỌC không phải làm lại khi tới lượt.

- **Hai khẳng định cùng vai `que-quan` mà khác nơi là MÂU THUẪN.** Phép xếp chồng
  (`core/person/chong.ts`) phân loại theo `kind`, nên `place` luôn là chồng NỐI TIẾP — đúng cho ca
  thường gặp (quê quán + trú quán + an táng là ba vai cùng đúng), sai cho ca này. Giới hạn y hệt
  `parent-child`: `vai` nằm trong `value`, mà phép xếp chồng chỉ thấy `kind`. Sửa được bằng cách
  cho `xepChong` nhìn thêm một khoá phụ rút từ `value` — nhưng đó là đổi hình của phép dẫn xuất,
  đáng làm có chủ ý chứ không tiện tay.

- **Ba lần táng: nguyên táng · cải táng · di táng.** PRD nói rõ *"Đợt 2 chỉ cần chứa được một;
  phân loại ba là việc sau"*. Vai `an-tang` hiện là một. Khi phân loại ba, chúng là ba khẳng định
  **cùng chính thức và cùng đúng** xếp theo thời gian — và chồng NỐI TIẾP mà 5-3 dựng sẵn chính là
  chỗ chúng rơi vào, không phải dỡ ra làm lại.

## Deferred from: lượt vá code review Epic 5 (2026-08-25)

- **Khoảng chờ của `app/admin/layout.tsx` vẫn trống trơn.** Layout khai `force-dynamic` và chạy
  `getClanOverview()` — một lượt `loadTreeData` + `computeStructure` trên CẢ dòng họ — trước khi
  trả về gì. Vào nguội (mở dấu trang, F5, hoặc rơi vào từ một trong sáu chuyển hướng 308) thì
  khoảng ấy là màn trắng.

  `app/admin/loading.tsx` **không** che được nó, và nay đã thôi giả vờ là che:
  `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md` — *"It does
  **not** wrap the `layout.js` … in the same segment"*. Bản trước file ấy dựng cả một bộ chrome
  giả với đúng lời hứa ấy ở đầu file, nên hỏng hai lần: không che được, mà khi hiện thì lồng vào
  trong chrome thật.

  Chính đoạn "Good to know" ngay dưới câu trích nói cách chữa thật, và có hai:
    1. Dời `getClanOverview()` khỏi layout xuống từng `page.js` — nhưng số trên thanh việc là của
       CHROME, không của màn, nên đây là dỡ ra làm lại chỗ story 5-1 vừa gom về một mối.
    2. Bọc riêng lượt đọc ấy trong `<Suspense>` ngay trong layout, để vỏ tĩnh chảy ra trước và
       các con số điền vào sau. Rẻ hơn, giữ nguyên quyền sở hữu, và là lối nên đi.

  Chưa làm vì nó đổi hình dạng streaming của mọi màn `/admin` cùng lúc — đáng một lượt có chủ ý
  kèm một lần đo thật, không phải tiện tay trong một lượt vá.

- **Bốn nhóm vá hình ảnh chưa ai nhìn bằng mắt.** Hàng nhãn trên thẻ người, chiều cao thẻ theo số
  bạn đời, cột co giãn của `<main>`, và CSS nút phóng/thu. `tsc`/`eslint`/`build`/203 test đều
  xanh, nhưng repo không có e2e (`vitest.config.ts` chạy `environment: 'node'`) nên không có gì
  thay được một lượt mở trình duyệt.
