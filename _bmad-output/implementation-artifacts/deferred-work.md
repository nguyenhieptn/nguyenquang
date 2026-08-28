# Deferred work

Việc thật, đã xác nhận, nhưng không thuộc phạm vi lần thay đổi sinh ra nó. Mỗi mục ghi rõ nguồn
gốc để lần sau không phải điều tra lại.

## Deferred from: code review of 5-1-vo-admin (2026-08-24)

- ✅ **ĐÃ LÀM — story 6-3, 26/08/2026.** `previewSeedOp` nhận `decisions`, và cả nó lẫn
  `commitSeedOp` nay dùng CHUNG một phép giải tên (`dungPhepGiaiTen`) nên không lệch nhau được
  nữa. Cả hai chiều sai dưới đây đã có test chốt, và đã đo lại bằng trình duyệt thật.

  **Cảnh báo xem trước của bộ nạp khung tính mù quyết định.** `previewSeedOp` đếm `inFile` trên
  MỌI dòng (`core/seed/ops.ts:128-131`), còn `resolveByName` khi commit chỉ đếm trên `activeByFolded`
  dựng từ những dòng chưa bị `skip` (`:187`, `:216`). `previewSeedOp` không nhận tham số `decisions`
  nên cảnh báo không bao giờ tính lại được. Hai chiều sai: (a) người vận hành bỏ một trong hai dòng
  trùng tên → màn nói "gốc tạm của một mảnh" nhưng commit lại NỐI được vào người còn lại; (b) dòng
  duy nhất mang tên cha bị bỏ → xem trước không cảnh báo gì, commit rơi xuống tìm trong phả rồi im
  lặng bỏ cha. Sửa đúng cần quyết định kiến trúc: truyền `decisions` vào preview, hay tính lại cảnh
  báo phía client. *Lý do hoãn: thuộc bộ nạp khung, không phải vỏ admin — story 5-1 chỉ dựng vỏ.*

- ✅ **ĐÃ LÀM — story 6-3, 26/08/2026.** Thêm `spouse-not-found` và `spouse-ambiguous`;
  `loadClanCandidates` của preview nay nạp cả tên vợ chồng; màn Nạp khung có khối cảnh báo riêng
  cho cả hai, và `scripts/seed-from-sheet.ts` in ra mọi cảnh báo trước khi ghi.

  **Union vợ chồng bị bỏ im lặng khi tên mơ hồ.** Guard `fileMatches.length > 1 → null` mới thêm
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

## Deferred from: 6-1-noi-nguoi-da-co (2026-08-25)

- **`place` và `note` ghi được mà không gỡ được.** Nút *"Loại"* ở `components/admin/cot-khang-dinh.tsx`
  chỉ mọc trên chồng **mâu thuẫn**. Bốn loại có `DON_TRI = false` (`core/person/chong.ts:39-47`)
  là chồng **nối tiếp** nên không bao giờ mâu thuẫn: `parent-child`, `union-partner`, `place`,
  `note`. Story 6-1 mở nút cho hai loại QUAN HỆ (`loaiDuocDuNoiTiep`) vì nó vừa dựng đường ghi
  chúng — mở luôn cho `place`/`note` là đổi hành vi của hai loại story ấy không đụng tới.

  Nhưng lỗ thì vẫn nguyên: ghi nhầm một quê quán hay một ghi chú thì không có đường gỡ nào từ
  panel. *Lý do hoãn: cùng một câu hỏi thiết kế cho cả bốn loại — "mọi khẳng định có nên gỡ được
  không, kể cả khi không mâu thuẫn?" — đáng một quyết định có chủ ý, không phải một prop nới
  thêm.* Đường sửa rẻ: bỏ hẳn `loaiDuocDuNoiTiep` và cho `loaiDuoc` luôn đúng.

- **`relation: 'heir'` và `'adopted'` vẽ y hệt `'blood'` trên canvas.** Story 6-1 mở đường ghi ba
  loại quan hệ máu (phả cổ chép cả ba, `AssertionSpec.relation` đã đón sẵn từ Đợt 1), và panel nói
  đúng chữ — *"là con thừa tự của X"*. Nhưng cạnh trên cây thì không phân biệt.
  `EXPERIENCE.md` chưa nói gì về hình của cạnh, nên đây là một quyết định UX chưa có, không phải
  một chỗ quên nối dây. *Lý do hoãn: cần Sally chốt hình trước; và `DESIGN.md § Colors` không cho
  phân biệt chỉ bằng màu, nên lối ra nhiều khả năng là nét cạnh cộng một nhãn.*

## Deferred from: code review of story 6-1-noi-nguoi-da-co (2026-08-26)

- **`timNguoi` cắt còn 8 kết quả mà không nói.** `app/admin/actions.ts:32` `.slice(0, 8)` trong
  khi `searchPersonsOps` trả tới 30. Dòng họ có 12 người trùng tên thì người thứ 9 không bao giờ
  hiện, và `aria-live` đọc "8 người trùng tên" như thể đã hết. Bộ chọn của 6-1 không có lối lọc
  nào khác (không theo đời, không theo chi) nên không có đường vòng. *Lý do hoãn: có từ 5-1, và
  sửa đúng cần một lối lọc chứ không chỉ nâng con số.*

- **Nợ combobox ghi cho ô tìm thanh trên vẫn nguyên.** `chon-nguoi.tsx` chú thích *"Trả ở đây, và
  trả đủ"*, nhưng thứ được trả là bộ chọn MỚI; `components/admin/khung-admin.tsx:170-200` không
  nằm trong changeset và mục nợ ở trên vẫn trỏ đúng vào nó. *Lý do hoãn: hai control khác nhau;
  gộp chúng lại là việc riêng — xem mục dưới.*

- **Hai cài đặt song song của cùng một control "chọn một người".**
  `app/(pha)/loi-ke/thu/chon-nguoi.tsx` (Đợt 1) và `components/admin/chon-nguoi.tsx` (6-1) đều
  gọi `timNguoi`, mỗi cái một bộ trạng thái và một mức ngữ nghĩa a11y khác nhau. *Lý do hoãn:
  gộp chúng cần chốt bề mặt A và bề mặt B dùng chung được tới đâu — bề mặt A có NFR-5 bó vào một
  câu hỏi một màn.*

## Deferred from: code review of story 6-7-ho-so-day-du-o-cot-phai (2026-08-26)

- **Chip người ẩn danh: N nút giống hệt nhau, mỗi nút mang UUID thật vào URL.**
  `read-ops.ts:106` trả `fullName: ANONYMOUS_LABEL` nhưng GIỮ NGUYÊN `personId`, và `xemHoSo` bê
  thẳng cả cặp sang `ChipQuanHe`. Ba con vị thành niên ⇒ ba nút `Một người trong họ` không phân
  biệt được, bấm cái nào cũng đẩy định danh của một đứa trẻ vào thanh địa chỉ và log máy chủ.
  *Lý do hoãn: KHÔNG tới được trên bề mặt B — `visibilityFor:75` trả `'full'` cho admin và
  branch-head với mọi người. Nhưng phiếu này là thứ đáng tái dùng ở bề mặt A, và ngày ấy nó cắn.*

- **`đời 0` / `đời -1` in thẳng ra dưới tên.** `computeStructure` đặt gốc `generation = 1` rồi BFS
  đi lên trừ 1, nên một người kết hôn vào họ ở đời 1 mà CÓ cha được chép thì người cha nhận
  `generation = 0`. *Lý do hoãn: theo nếp cả repo (`app/(pha)/nguoi/[id]/page.tsx:61` cùng phép);
  sửa đúng là sửa `computeStructure`, không phải sửa chỗ bày.*

- **Hàng Con phình theo số con.** Đo được 109px với hai đứa; cột giá trị còn ~202px nên chip xếp
  dọc. Năm con ⇒ ~250px cho một hàng. *Lý do hoãn: cần một quyết định về hình (cuộn ngang? gập
  sau N? đổi sang danh sách chữ?) chứ không phải một lượt vá.*

- **`chipKhongChong` gần như là nhánh chết.** Khi `chong !== null` nó không bao giờ khác rỗng —
  cạnh và chồng lọc chung `status = 'live'`. Chỉ sống ở ca `chong === null`, mà ở đó mảng chồng
  rỗng nên chỗ nối không quan trọng. *Lý do hoãn: nếu một ngày hai luật lọc tách nhau,
  `chenHangCon` sẽ đẩy Cha mẹ/Vợ chồng xuống sau Ghi chú — ghi ra để lần ấy không phải điều tra lại.*

## Deferred from: nghiệm thu AC 28 story 6-1 (2026-08-26)

- **Ô tìm người khớp gấp dấu, nên "Quản" lôi ra cả họ Nguyễn Quang.**
  `chuanHoa` gấp dấu theo AD-16: `Quản → quan`, mà `Quang → quang` **chứa** `quan`. Gõ "Quản"
  trong phả hiện tại trả về SÁU người — `Nguyễn Quang Anh · Hải · Hiệp · Trung · Vinh` rồi mới
  tới `Quản Thị Huyền`, đứng **cuối**.

  Trong một dòng họ mà chữ đệm là **Quang**, mọi từ khoá bắt đầu bằng "Qu" đều lôi ra gần như cả
  họ, và người cần tìm bị đẩy xuống đáy. Đây là bề mặt mà một cú bấm nhầm ghi một lời khai sai
  vào một cuốn sổ không có nút xoá — và nó đã xảy ra thật trong lượt nghiệm thu AC 28 ngày
  26/08: kịch bản bấm ứng viên đầu tiên và ghi *"Nguyễn Gia Linh là con ruột của Nguyễn Quang
  Anh"*, một lời khai sai. Đã gỡ bằng `Loại quan hệ này`; `create` + `remove` nằm trong nhật ký.

  Ba tầng code review đọc mã không thấy. `soi-man.mjs` không thấy. Chỉ bấm thật mới thấy.

  *Lối chữa:* khớp ĐÚNG DẤU xếp trên khớp gấp dấu — "Quản Thị Huyền" đứng đầu khi gõ "Quản".
  `core/so-khop` đã có bộ chấm điểm cho NƠI (`chamDiemNoi`); người thì đang dùng khớp chuỗi con
  trần. *Lý do hoãn: chủ dự án chốt chưa cần (26/08).*

## Deferred from: 6-3-nap-khung-noi-that (2026-08-26)

- **`TableCell` mang `whitespace-nowrap`, nên MỌI văn xuôi đặt trong ô bảng không xuống dòng.**
  `components/ui/table.tsx:86`. Story 6-3 đã vá tại chỗ cho khối cảnh báo của màn Nạp khung
  (`whitespace-normal` trên khối), sau khi đo trình duyệt thấy câu *"Nối vào đúng người cha ở màn
  **Mảnh chưa nối**"* chạy quá mép hộp 56px — `max-w-[70ch]` viết từ story 3-2 chưa từng có hiệu
  lực, và bốn cổng xanh suốt từ đó.

  **Chỗ CÒN LẠI chưa vá:** `app/admin/hang-cho/bang-cho-duyet.tsx:225` và `:231` đặt `{d.cau}`
  (câu của một khẳng định) và `{d.nguon}` (xuất xứ do người gõ tay, dài tuỳ ý) trong `TableCell`
  với `max-w-[42ch]` / `max-w-[32ch]` — cùng lớp lỗi, chỉ chưa gặp dữ liệu đủ dài để lộ.
  *Lý do hoãn: đó là màn của 6-8, story sắp dựng lại chính hàng chờ ấy — vá bây giờ sẽ bị viết đè.*

## Deferred from: code review of story 6-9 (2026-08-26)

- **`daThayCanhCu` và canvas đọc HAI tập node khác nhau.** `app/admin/cay/cay-client.tsx:399-405`
  gọi `camNutTam` trên `nut` thô; `components/admin/khung-cay-admin.tsx:144` gọi cùng phép ấy
  trên `nut` đã lọc `chaId` theo vùng. Chú thích ở `cay-client` khai *"một nguồn sự thật, hai chỗ
  đọc"* — thực tế là hai nguồn. Hậu quả: câu cảnh báo *"mốc đã có cha"* có thể lệch với hình node
  mờ mà canvas vẽ. *Lý do hoãn: có sẵn trước story 6-9, không do lượt thay đổi này sinh ra.*

- **`Backspace` trên node đang focus vẫn là `deleteKeyCode` mặc định của React Flow.** `doiNode`
  (`khung-cay-admin.tsx:291-298`) bỏ qua `type:'remove'` nên không có gì bị xoá thật, nhưng phím
  vẫn bị React Flow nuốt trên một bề mặt mà AD-4 nói *không có xoá*. *Lý do hoãn: có sẵn trước
  story 6-9; đúng chỗ chữa là một lượt rà cấu hình React Flow, không phải story phím tắt.*

## Deferred from: code review of story 6-3 (2026-08-27)

Chín mục, đều có sẵn trước story 6-3 — bộ nạp khung là đường ghi HÀNG LOẠT nên mỗi mục ở đây
nhân lên theo số dòng của tệp.

- **Gieo lại dựng lại chính những cạnh Ban tu phả vừa loại bỏ.** `wireParentEdge`
  (`core/seed/ops.ts:371`) và phép `alreadyJoined` của vòng union (`:449`) đều lọc
  `eq(assertion.status, 'live')`, trong khi `reject`/`hide` đặt `status: 'hidden'`
  (`core/assertion/ops.ts`). Nếp vận hành đã ghi ở đầu `seed-from-sheet.ts` là *"sửa bảng tính
  rồi chạy lại"* — nên lượt chạy lại lật ngược một phán quyết của con người, không cảnh báo,
  không con số nào tố giác (`SeedCommitResult` không đếm cạnh). **Nặng nhất trong nhóm này.**
  *Lý do hoãn: sửa đúng đòi quyết định về nghĩa của `hidden` với bộ nạp — một cuộc bàn, không
  phải một vé.*

- **Hai dòng cùng `link` vào MỘT người ⇒ người ấy có hai cha.** Vòng kiểm `link`
  (`ops.ts:284-290`) soi từng dòng, không soi trùng đích. Ca tới được qua đúng màn: hai dòng
  trùng tên bày cùng một nút *"Là cùng cụ này"*, người vận hành tích cả hai. `DON_TRI` cho
  `parent-child` là `false` nên `addAssertionOp` cũng không chặn.

- **Dòng `link` vào người đã có cha trong phả được gắn thêm cha thứ hai.** `wireParentEdge` chỉ
  hỏi *"đã có cạnh (con, cha ẤY) chưa"*, không hỏi *"đứa con này đã có cha nào chưa"*.

- **Vòng `ten_cha` trong tệp: xem trước im hoàn toàn, commit đổ cả đợt.** Phép bắt vòng nằm ở
  `commitSeedOp` (`ops.ts:334`), không có loại cảnh báo nào cho nó, nên bảng xem trước xanh và
  nút đọc *"Ghi 2 dòng vào phả"*. Trái với chính luật ở đầu `ops.ts:11-13`.

- **A khai B là cha, B khai A là vợ/chồng ⇒ ghi cả hai cạnh, không cảnh báo.** Vòng topo không
  thấy gì lạ (union không nằm trong đồ thị), `addAssertionOp` chỉ chặn `partnerId === personId`.
  Cây bày một người vừa là con vừa là vợ/chồng của cùng một người.

- **`spouseId === selfId` bỏ union không một tiếng** (`ops.ts:437`), và **dòng `link` mà
  `ten_cha` giải ra chính người được link** bị `wireParentEdge` bỏ cạnh tự trỏ (`:362`). Cả hai
  là chiều ngược của AC 4: không cảnh báo mà cũng không cạnh. Story 6-3 đã khai ca thứ hai là
  ngoài phạm vi nhưng quên ghi vào sổ này.

- **`nam_sinh = 0000` ném SAU khi lượt ghi đã bắt đầu.** `csv.ts:132` nhận mọi `\d{4}`;
  `invalidGenealogicalDate` chỉ soi hình dạng `YYYY-MM-DD`; Postgres `date` không có năm 0. Kết
  quả là 500 thay vì một `Result` err — đúng thứ chú thích đầu `ops.ts` gọi là *"a bug"*. Cùng
  họ với lỗi `create-admin.ts` đã vá 26/08.

- **`locCotDaBiet` im lặng nuốt cột trùng tên và cột không tên** (`seed-from-sheet.ts:90-96`).
  `parseSeedCsv` vốn từ chối cột trùng, nhưng CSV đã được dựng lại nên không bao giờ tới nó.

- **Dòng `link` mà `ten_cha` giải ra chính người được link** — `wireParentEdge` bỏ cạnh tự trỏ
  (`core/seed/ops.ts:362`), im lặng. Nghĩa thật của ca này: người vận hành đã link NHẦM dòng.
  Story 6-3 khai nó ngoài phạm vi và hứa ghi vào sổ này; nay ghi. *Lý do hoãn: hiếm, và chữa
  đúng đòi một loại cảnh báo nữa cho một ca mà `SeedCommitResult` chưa đếm được.*

- **`nonce: Date.now()` làm khoá remount** (`actions.ts:159` + client `:1081`). Hai lượt nạp
  trùng mili-giây ⇒ `daChon`, `canhBaoMoi`, `luotSoi` của tệp trước sống tiếp sang tệp sau.
  Story 6-3 vừa treo thêm ba mảnh state vào đúng chỗ ấy nên giá của nó vừa tăng.

## Chốt BỎ — 26/08/2026

Ba việc được nêu và chủ dự án chốt **không làm**. Ghi ra để lần sau không ai đề xuất lại như thể
chưa ai nghĩ tới.

- **Hàng rào cho `seed-from-sheet.ts`.** Sau lằn ranh (xem `epics-dot-3.md § Lằn ranh bảng tính ⇄
  phả`), `/admin` là nguồn sự thật, nên chạy lại script là trộn hai nguồn. Đề xuất: hỏi lại, hoặc
  từ chối khi phả đã có khẳng định không mang nguồn `seed-import`. **Chốt bỏ.** Rủi ro còn nguyên
  và nó đã có thật: cạnh `Gia Linh → Quản Thị Huyền` ghi 26/08 qua `/admin` **không có trong bảng
  tính**, nên một lượt xoá-gieo-lại sẽ mất nó.

- **Off-host cho sao lưu (AD-25).** Chốt bỏ — miễn trừ đã ghi vào chính AD-25 và `docs/van-hanh.md`.

- **Đổi mật khẩu quản trị tạm.** Chốt không đổi.
