# Epics & Stories — Gia phả Nguyễn Quang, Đợt 3

> Sinh 25/08/2026 từ retrospective Epic 5
> (`_bmad-output/implementation-artifacts/epic-5-retro-2026-08-25.md`).
> Trạng thái SỐNG nằm ở `implementation-artifacts/sprint-status.yaml` — file này là cấu trúc.
> Đợt 1 (Epic 1–4) chốt 23/08 — `epics.md`. Đợt 2 (Epic 5) chốt 25/08 — `epics-dot-2.md`.

## Nguyên tắc cắt epic của đợt này

Đợt 2 cắt theo **một bề mặt** (cả epic là một trang). Đợt 3 cắt theo **một động từ**: **SỬA**.

Lý do nằm ở phát hiện nặng nhất của retro. Epic 5 dựng xong đường **GHI** cho năm thực thể —
người, quan hệ, nơi, tài khoản, sổ dòng họ — và dựng đường **SỬA** cho đúng một: sổ dòng họ.
Bốn cái còn lại ghi được mà không sửa được.

Và nó không phải chuyện lý thuyết. Tối 25/08, lần đầu mở bản Epic 5 trên phả thật:

> Cây gia phả gãy làm hai mảnh vì thiếu **một cạnh cha-con**, và **không có một đường nào trong
> toàn bộ bàn làm việc để nối lại**. `LOAI_GHI_THEM` có sáu loại, không có `parent-child`;
> `themNguoi` chỉ tạo người MỚI; `/admin/hop-nhat` là gộp bản trùng, không phải nối. Cạnh ấy
> chỉ bộ nạp khung ghi được — tức phải sửa **bảng tính** rồi gieo lại, để sửa một thứ trong phả.

Với một hệ mà triết lý là *"không bao giờ đè, chỉ ghi thêm"* (AD-9/AD-10), đường sửa lại **càng
phải có** — vì sửa ở đây nghĩa là *ghi thêm một khẳng định rồi để chồng bày cả hai*, và chồng ấy
5-3 đã dựng sẵn. Thiếu đúng một **bộ chọn người**. `5-6-ghi-them-thong-tin.md` đã khai ra chỗ
này rồi để trống chủ; Đợt 3 nhận.

---

## Epic 6 — Đường sửa

| Story | Tên | FR | AD chính |
|---|---|---|---|
| 6-1 | `6-1-noi-nguoi-da-co` — **bộ chọn người** (dùng lại `searchPersons` của ô tìm), rồi ghi `parent-child` / `union-partner` **giữa hai người ĐÃ CÓ**; cạnh sai gỡ bằng *loại* chứ không xoá. Nghiệm thu: nối `Nguyễn Quang Hiệp` → `Nguyễn Quang Vinh`, hai mảnh thành một | FR-63, FR-48, FR-1 | AD-9, AD-10, AD-17 |
| 6-2 | `6-2-tai-khoan-va-vai` — màn **Tài khoản**: liệt kê, trao/hạ vai, gắn & gỡ node. `approveAttachmentOp` **đã nhận `role`** mà `duyet-vao-pha/actions.ts` không truyền ⇒ mọi lượt duyệt ra `member`. `docs/van-hanh.md` đang phải ghi *"nâng vai chưa có màn UI"* | FR-64 | AD-8, AD-22, AD-24 |
| 6-3 | `6-3-nap-khung-noi-that` — ba lỗ im lặng của bộ nạp khung: thêm cảnh báo **`spouse-not-found`** (0 union vì tên vợ không giải được, không ai được báo); script CLI **in `row.warnings`**; `previewSeedOp` **nhận `decisions`** để cảnh báo thôi tính mù | FR-51, FR-48 | AD-16 |
| 6-4 | `6-4-sua-va-gop-noi` — sửa tên & đơn vị cha của một nơi; **gộp** hai nơi trùng; **tách** lại khi gộp nhầm. Cột `place.merged_into` đã dựng sẵn để đón, `giaiNoi()` đã đọc được chuỗi ấy | **FR-65** | AD-3, AD-22 |
| 6-5 | `6-5-man-mau-thuan` — mục *Mâu thuẫn* trên thanh việc (5-3 AC 23 hoãn có lý do: cần phép đọc quét cả dòng họ). Kèm hai lớp mâu thuẫn phép xếp chồng hiện **không thấy**: hai khẳng định `parent-child` cùng giới + cùng `relation`, và hai khẳng định cùng vai `que-quan` khác nơi | FR-1, FR-2, FR-3 | AD-4, AD-18 |
| 6-6 | `6-6-do-that-tren-trinh-duyet` — kịch bản đo bằng trình duyệt thật: sàn chạm 44px, sàn chữ 17px, nhãn không đè tên, đệm đáy, ngân sách bề ngang 1280px. Repo **không có e2e** (`vitest.config.ts` chạy `environment: 'node'`) | NFR-5, Accessibility Floor | AD-20 |

| 6-7 | `6-7-ho-so-day-du-o-cot-phai` — cột phải bày **tiểu sử cơ bản** (năm sinh–mất · đời · chi · tầng · ai ghi) và **quan hệ** (cha mẹ · con · vợ chồng), mỗi mục sửa được tại chỗ. `getPerson` đã trả `card` và `relations`; `xemHoSo` đang vứt cả hai | FR-1, FR-2, FR-37 | AD-13, AD-21 |
| 6-8 | `6-8-duyet-theo-nguoi` — hàng chờ gom theo **NGƯỜI**, duyệt trọn một người bằng một cú bấm. `duyetHangLoat` đã có; thiếu phép gom và một lối chọn cả nhóm. Đơn vị HÀNH ĐỘNG vẫn là khẳng định (AD-9), đơn vị CHÚ Ý là con người | FR-3, FR-1 | AD-9, AD-22 |

**Thứ tự phụ thuộc:** 6-1 trước (nó dựng bộ chọn người mà 6-5 dùng lại). 6-2 · 6-3 · 6-4 chạy
song song từ đầu — không cái nào phụ thuộc cái nào. 6-5 sau 6-1. 6-6 sau khi có màn để đo. **6-7 và 6-8 chen lên trước 6-4/6-5** — xem ghi chú dưới.

> ### Phản hồi từ lượt bấm thật đầu tiên — 26/08/2026
>
> Hiệp mở bàn làm việc trên phả thật và nói hai câu:
>
> > *"Cách duyệt thông tin vào cây đang khá phức tạp — nên hiện all của một người rồi duyệt một
> > thể, duyệt từng nội dung thông tin rất nhiều mục."*
> >
> > *"Sidebar hiện thông tin của một người chưa đầy đủ. Cần hiện basic biography và các nội dung
> > có thể xem, chỉnh sửa được luôn."*
>
> **Cả hai đều rẻ hơn vẻ ngoài, vì `core/` đã tính sẵn thứ đang thiếu.** `xemHoSo`
> (`app/admin/cay/actions.ts`) nhận trọn `PersonProfile` rồi giữ đúng bốn trường, vứt `card`
> (năm sinh–mất · đời · chi · tầng · xuất xứ) và `relations` (cha mẹ · con · vợ chồng). Còn
> `duyetHangLoat` thì đã chạy được từ story 3-3 — hàng chờ chỉ thiếu phép gom.
>
> **Và đây là món nợ tài liệu của 3-3 đến hạn.** Chú thích đầu `app/admin/hang-cho/page.tsx` tự
> khai: *"hành trình gốc của việc duyệt (UJ-3) đã mất; màn dựng từ § IA, không từ một hành trình
> có thật."* Màn ấy dựng từ sơ đồ thông tin, và lượt bấm đầu tiên của một người thật cho thấy sơ
> đồ không thay được hành trình. 6-8 là chỗ trả món nợ ấy, không chỉ là một lượt gom dòng.

> ### Vì sao 6-3 xếp cao dù nghe như việc vặt
>
> Ba lỗ ấy **đã bật** trên phả thật, không phải giả định:
> - `father-not-found` của một cụ tổ tính đúng ở `previewSeedOp`, rồi **biến mất khỏi màn hình**
>   vì script chỉ in danh sách dòng bị bỏ.
> - Ba người vợ trong bảng tính **không vào phả, không một cảnh báo**: `core/seed/ops.ts:342` chỉ
>   nối union *"where BOTH sides resolved"*, và `SeedRowWarning` không có loại nào cho vợ chồng.
> - Dòng của quản trị bị bỏ vì `nghi-trung`, kéo theo `ten_cha` không được đọc — **vế (b) của mục
>   đầu tiên trong `deferred-work.md`**, xảy ra đúng như đã mô tả.
>
> Dòng họ sắp nhập dữ liệu thật hàng loạt. Một bộ nạp khung im lặng khi bỏ người là thứ tệ nhất
> để mang vào lượt ấy.

---

## Lằn ranh bảng tính ⇄ phả — CHỐT 26/08/2026

Câu hỏi treo từ lượt dựng lại database: bảng tính Google là chủ tới đâu? Nó không phải chuyện
vận hành — nó quyết định **Epic 6 có đáng làm hay không**, vì cả Epic 5 lẫn 6-1 lẫn 6-7 đều dựng
đường GHI vào phả, mà lượt gieo là một lần **nhập**, không phải một lần **đồng bộ**.

**Chốt (Hiệp, 26/08):**

> *"Sheet chỉ để seed. Sau khi seed xong, toàn bộ quy trình sẽ làm trên `/admin`."*

Nghĩa là hai giai đoạn, và lằn ranh nằm ở lượt gieo cuối cùng:

| | Nguồn sự thật | Xoá-gieo-lại |
|---|---|---|
| **Trước lằn ranh** | bảng tính | được — phả dựng lại từ sheet, không mất gì |
| **Sau lằn ranh** | **phả** | **KHÔNG** — mọi thứ ghi qua `/admin` chỉ sống trong database |

**Ba hệ quả phải nhớ:**

1. **Lượt gieo cuối cùng là một cột mốc, không phải một lệnh.** Qua nó rồi thì `seed-from-sheet.ts`
   thành một công cụ nguy hiểm: chạy lại trên phả đã có người ghi tay là trộn hai nguồn sự thật.
   Đáng một hàng rào — hỏi lại, hoặc từ chối khi phả đã có khẳng định không mang nguồn `seed-import`.
2. **Sao lưu đổi vai.** Trước lằn ranh, bản sao lưu chỉ là tiện nghi — sheet dựng lại được tất.
   Sau lằn ranh, nó là **thứ duy nhất** đứng giữa dòng họ và một lần mất phả. `docs/van-hanh.md`
   đã ghi nợ: sao lưu và media vẫn nằm CÙNG MÁY với production, vi phạm AD-25. Nợ ấy đến hạn ở
   đúng lằn ranh này.
3. **Epic 6 đáng làm, và đáng làm trước khi vượt lằn ranh.** Đường SỬA là thứ giữ cho phả không
   cần xoá đi làm lại — mà xoá đi làm lại chính là thứ sắp không còn dùng được nữa.

**Đổi tên 26/08:** *"Bàn làm việc"* trên giao diện đổi thành **"Admin"**. Chữ cũ mô tả một cái bàn;
tên mới nói đúng thứ nó là — nơi quản trị phả. (Đợt 2 từng đổi *"Bàn duyệt"* → *"Bàn làm việc"*
vì bàn ấy thôi chỉ để duyệt; nay nó thôi chỉ là một cái bàn.)

## Ràng buộc mang theo từ spine (mọi story phải giữ)

- `app/` không import db client/ORM/storage SDK — chỉ `core/` (AD-1).
- Core đọc danh tính từ session, không nhận clan/viewer/vai làm tham số (AD-24).
- Không đè sự thật cũ: sửa = ghi thêm một khẳng định (AD-9, AD-10). Không có nút xoá (AD-4).
- Sàn chạm 44px · sàn chữ 17px · không phân biệt chỉ bằng màu (`EXPERIENCE.md § Accessibility Floor`).
- Mỗi story **tự thêm mục của mình** vào `components/admin/man-admin.ts` khi màn ra đời —
  `chrome.test.ts` giữ bất biến hai chiều mục ↔ màn.
- **Nếp mới từ retro:** chèn một lượt soi sau mỗi **2–3 story**, không dồn cả epic vào một phiên.

## Nợ Đợt 2 mang sang (không thuộc story nào)

- **Khoảng chờ `app/admin/layout.tsx` trống trơn** — hai lối chữa đã ghi ở `deferred-work.md`;
  lối nên đi là bọc lượt đọc trong `<Suspense>` ngay trong layout.
- **Thiếu snapshot Drizzle cho migration `0002`–`0004`** — sinh migration tiếp thì đúng, nhưng
  không dựng lại được ba bước giữa.
- **Font Hán-Nôm chưa nạp** — `--font-han-nom` trỏ stack CJK hệ thống; `app/layout.tsx` nạp
  Be Vietnam Pro + Noto Serif qua `next/font`, không có font CJK nào. Đề từ 光前裕後 rơi về ô vuông
  trên máy thiếu font.
- **`create-admin.ts` không nhận năm sinh** — node bootstrap chỉ có `{ fullName }`, và đó là
  nguyên nhân gốc của lần cây gãy đôi. Sửa nhỏ, chặn được cho mọi triển khai sau.
- Còn lại 14 mục trong `deferred-work.md`; A4/A5 ở trên là hai mục đã được Đợt 3 nhận.

## Nợ Đợt 1 vẫn còn (đầy đủ ở `docs/van-hanh.md § Việc còn nợ`)

Sao lưu + media **cùng máy** với production (vi phạm AD-25) · Google/FB login chưa bật · chưa có
TLS/tên miền · FR-55 còn pull-based.

---

## Sau epic này (SHOULD / COULD — ghi để không ai tưởng là quên)

**SHOULD, Đợt 3 nếu kịp**
- **Ngày giỗ (âm lịch) — FR-41.** Đã ở SHOULD của Đợt 2 và không kịp. Thứ dòng họ mở phả ra xem
  nhiều nhất; xếp sau **chỉ vì rủi ro kỹ thuật** (cần thư viện đổi lịch), không phải vì ít giá trị.
- `hideAssertion` trong panel — AD-17 cho phép một lượt báo cáo ẩn ngay; hàm core đã có, thiếu nút.
- **Nhật ký** — `core/audit` đã có, chưa màn nào gọi.
- Màn duyệt chưa nói **tài khoản nào** đang xin — đi cùng 6-2.
- Tên phân loại huý/tự/hiệu/thụy — đổi hình `name.otherNames`, có phí migration.

**COULD, Đợt 4**
An táng ba loại (nguyên/cải/di) · hàng thứ · học vị–chức tước–nghề · tự bối suy đời + soát ngược ·
quản lý lời kể (`updateRecordingAccess`, `withdrawRecording` — chưa màn nào gọi) · điều hướng
canvas theo NƠI.

## Vẫn hoãn có chủ đích

**Vai vợ — chính thất / kế thất / thứ thất.** Giữ nguyên lập luận của Đợt 2: cần một quyết định
tỉnh táo về chỗ **cấu trúc cây không được phụ thuộc vào nó**, và đó là một cuộc bàn, không phải
một vé. Cùng nhóm: táng hướng 山向, giờ sinh.
