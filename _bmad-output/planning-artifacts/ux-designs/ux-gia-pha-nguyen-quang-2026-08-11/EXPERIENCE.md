---
name: Gia phả dòng họ Nguyễn Quang
description: >
  IA, hành vi, trạng thái, tương tác và hành trình. Phạm vi: 15 FR Đợt 1.
  Bản sắc thị giác nằm ở DESIGN.md — file này trỏ token bằng {đường.dẫn.token}.
status: draft
updated: 2026-08-11
scope: 'Đợt 1 — FR-51, FR-63, FR-11, FR-13, FR-15, FR-47, FR-49, FR-1, FR-2, FR-3, FR-64, FR-48, FR-37, FR-55, FR-39'
sources:
  - ../../prds/prd-gia-pha-nguyen-quang-2026-08-10/prd.md
  - ../../architecture/architecture-gia-pha-nguyen-quang-2026-08-10/ARCHITECTURE-SPINE.md
  - ../../../../specs/frontend-stack.md
---

# Gia phả dòng họ Nguyễn Quang — Trải nghiệm

> Spine này thắng mọi mock khi xung đột. Bản đồ luồng máy đọc được ở
> `app/uiworkshop/_registry/flows.ts` là **bản sao** của § Key Flows — sửa ở đây trước.

## Foundation

**Web, không app.** Trình duyệt di động làm được mọi thứ sản phẩm này cần (NFR-11).

**Hệ UI: shadcn/ui** (base `radix`, preset `nova`) trên Next.js App Router + Tailwind v4.
Cả hai spine thừa kế từ đó; DESIGN.md chỉ ghi phần lệch, file này chỉ ghi phần lệch về **hành vi**.

### Hai bề mặt

| | Bề mặt | Khung mặc định | Ai dùng |
|---|---|---|---|
| **A** | Người trong họ | mobile | Khánh, bà bác ở quê, người đi họp họ về |
| **B** | Quản trị / Ban tu phả | desktop | Hiệp; sau này là đầu mối từng chi |

Tách vì **chuẩn khác nhau**, không vì kích thước màn: bề mặt A cấm thuật ngữ công nghệ và chịu
sàn chữ 17px như một hàng rào; bề mặt B được dùng bảng dày, thao tác hàng loạt, và từ kỹ thuật.

`[ASSUMPTION]` Người xem chưa đăng nhập (FR-11: *"xem cây không cần đăng ký"*) tạm coi là **trạng
thái** của bề mặt A, chưa tách bề mặt thứ ba. Cần xác nhận: chuẩn riêng tư FR-37 áp cho khách
khác hẳn áp cho người đã gắn node.

## Information Architecture

### Bề mặt A — người trong họ (mobile)

| Màn | FR | Ghi chú |
|---|---|---|
| **Dòng họ đang sống** (màn chủ) | FR-13, FR-39 | Xem § Màn chủ |
| Tự khai — 4 bước | FR-11 | Một câu hỏi một màn |
| Tìm người thân | FR-11, FR-48 | |
| **Không tìm thấy** | FR-48 | Màn riêng, không phải trạng thái rỗng. Xem § State Patterns |
| Thêm người thân | FR-3, FR-55 | Ghi thẳng vào Tầng tồn nghi |
| Cây gia tộc | FR-15, FR-63 | Mở lên thấy chính mình trước |
| Trang một người | FR-1, FR-2, FR-37, FR-39 | |
| Thu lời kể | FR-47, FR-49 | Đồng thuận nằm **trong** luồng thu, không phải màn riêng |
| Đăng nhập / gắn node | FR-64 | Hai lớp tách rời — xem dưới |

### Cây gia phả — ba tầng zoom

FR-15 tự viết ra cơ chế: *"Zoom theo **chi**, collapse theo **đời**."* Đơn vị phóng to là **chi**,
đơn vị gập là **đời** — không phải người.

| Tầng | Vẽ gì | Màn |
|---|---|---|
| 1 · Cả tộc | Gốc tạm + **khối chi**, không vẽ người | `ca-toc` |
| 2 · Một chi | Người, **gập theo đời** | `mot-chi` ← điểm vào |
| 3 · Đường của tôi | Đường huyết thống ngược lên gốc | `cay-gia-toc` |

**Điểm vào của mục "Gia phả" là tầng 2, không phải tầng 1.** FR-15 đòi *"mở lên thấy chính mình
trước, rồi đi ngược lên"* — nên mở ra là chi của mình, đời của mình đã bung sẵn. Mở thẳng vào
tầng 1 là bắt người dùng tự mò xuống tìm mình, đúng cái PRD gạch đi.

#### Vì sao tầng 1 không vẽ người

Không phải khẩu vị — là số học. Q1 chốt dưới 300 người, 5–7 đời → đời rộng nhất khoảng **120
người**. Sàn chữ 17px buộc một ô tên rộng ~140px, tức **~16.800px bề ngang** trên màn 390px.

Vẽ hết người trong một màn thì chữ phải xuống dưới sàn 15px — vi phạm chính § Accessibility
Floor. **Cây toàn tộc trọn vẹn là hiện vật của bản in (FR-33), không phải của điện thoại.**
5–7 khối chi thì luôn vừa màn, và chữ luôn đủ lớn.

#### Khối chi mang đúng hai con số

**Số người đã ghi** và **số người còn ở tồn nghi**. Con số thứ hai lộ ra chi nào đang cần người
đi xác minh — thứ mà "số người" một mình không nói được.

Không thêm con số thứ ba. Bảng chỉ số càng dài thì càng không ai đọc.

#### Đời nào bung sẵn ở tầng 2

Đời của chính mình và đời ngay trên. Còn lại gập. Một chi 5–7 đời mà bung hết thì lại thành danh
sách dài — mất luôn tác dụng của việc gập.

#### Mảnh chưa nối vẽ tách hẳn

Ở tầng 1, mảnh rời (FR-48) **không nối vào gốc tạm bằng bất kỳ nét nào**, và mang chất liệu tồn
nghi. Vẽ liền một khối là nói dối về thứ dòng họ chưa biết.

Kèm một câu nói rõ mảnh rời **không phải lỗi**: đó là phần dòng họ còn nhớ nhưng chưa nối lại
được — và nối được một mảnh là việc quý nhất ai cũng làm được.

### Điều hướng gốc — thanh dính đáy (chỉ bề mặt A)

**Năm mục, không hơn.** Ở đáy màn, luôn hiện, không bao giờ cuộn mất.

| Mục | FR gánh | Đợt 1 |
|---|---|---|
| Trang chủ | FR-13, FR-39 | ✅ |
| Gia phả | FR-15 | ✅ |
| **Thêm** | FR-11 | ❌ chưa dựng |
| Lời kể | FR-47 | ❌ chưa dựng |
| Tôi | FR-64, FR-55 | ❌ chưa dựng |

**Đáy chứ không phải đỉnh** vì người dùng đích cầm điện thoại một tay và có tay run — đáy màn là
vùng ngón cái với tới được. Đây là quyết định về tầm với, không phải về thẩm mỹ.

**Năm là trần cứng.** Trên màn 390px, mỗi mục còn 78px — vừa đủ cho nhãn 15px mà không cắt chữ.
Mục thứ sáu là bắt đầu nói dối về tầm với.

**Nhãn chữ luôn hiện dưới biểu tượng.** Biểu tượng một mình là câu đố với người ít dùng máy, và
*"thông tin công nghệ khó hiểu"* là điều người duyệt gạch đi đầu tiên.

**"Thêm" nằm giữa và nổi hẳn** — nó là vòng lặp cốt lõi. NFR-5 chỉ cho phép 4 màn / 3 phút để
thêm một người, nên đường vào việc đó không được nằm sau một lần chạm nào khác.

> ⚠️ **Căng thẳng đã biết.** Thanh dính đáy là ngôn ngữ của **app**, trong khi `DESIGN.md § Brand
> & Style` muốn sản phẩm đọc ra *"cuốn phả"* chứ không phải *"phần mềm"*. Dung hoà: nền giấy,
> viền trên mảnh, **không đổ bóng**, son chỉ điểm vào mục đang mở. Nếu sau này thấy nó vẫn kéo
> sản phẩm về phía app quá mạnh, đây là chỗ đầu tiên nên xét lại.

Bề mặt B **không có** thanh này — bàn duyệt dùng chrome desktop riêng.

### Bề mặt B — quản trị (desktop)

| Màn | FR |
|---|---|
| Nạp khung: tải mẫu + tải file lên | FR-51 |
| Trang xem trước so khớp — **kèm bộ lọc "Cần xem lại"** | FR-51, FR-48 |
| Hàng chờ duyệt lên Tầng chính thức | FR-3 |
| Hợp nhất mảnh | FR-48 |

**Cảnh báo không có màn riêng — sửa 11/08/2026.** Bảng IA trước đây liệt kê *"Bảng cảnh báo"* là
một màn thứ ba, trong khi § Key Flows — Luồng 2 bước 6 lại tả bot báo ngay trong dòng chảy xem
trước. Hai chỗ nói khác nhau về cùng một tập cảnh báo, tức **hai nguồn sự thật**.

Chốt: cảnh báo **nằm ngay dưới dòng nó thuộc về**, và *"Bảng cảnh báo"* trở thành **một bộ lọc**
của chính bảng xem trước (`?loc=can-xem-lai`), không phải một màn có dữ liệu riêng. Lý do: người
vận hành quyết định về **một dòng cụ thể**, và mọi thứ cần để quyết — dòng trong file, ứng viên
trùng, đời + chi của ứng viên — phải nằm trong cùng một tầm mắt. Tách ra màn khác là bắt nhảy
qua lại và ghép lại trong đầu.

> **Sửa 22/08/2026 — `?loc=can-xem-lai` nằm trên CHÍNH route nạp khung.** Bộ lọc giữ nguyên địa
> chỉ đã chốt, nhưng địa chỉ ấy không phải một URL thứ hai: **nạp khung — xem trước — ghi là một
> trang ba pha** (`/ban-duyet/nap-khung`). Lý do là ràng buộc thật, không phải tiện tay — văn bản
> CSV sống trong state trình duyệt, `core/seed` không có chỗ gửi tệp tạm ở server, nên không URL
> nào khác đọc lại được bảng đang mở. Chip *Cần xem lại* vì thế soi vào URL bằng
> `history.replaceState` trên đúng route ấy: chỉ trỏ được, F5 giữ được chỗ đang đứng, mà không
> điều hướng thật — điều hướng thật sẽ ném mất chính bảng vừa lọc.
>
> **Sửa 24/08/2026 — mục *Xem trước* đã BỎ HẲN.** Nó từng còn trên thanh chrome làm trang chỉ
> đường sang bước Nạp khung. Một mục điều hướng mà đích đến là "hãy sang mục khác" thì không phải
> điều hướng, nó là một lời xin lỗi có URL. Câu giải thích của nó (*"bảng xem trước mở ra ngay
> sau khi chọn tệp"*) chuyển thành một câu dẫn ở đầu màn Nạp khung — thông tin không rơi mất,
> chỉ đổi chỗ về đúng nơi việc ấy xảy ra. Địa chỉ cũ `/ban-duyet/xem-truoc` chuyển hướng 308 về
> `/admin/nap-khung`.

#### Chrome của bề mặt B

> **Sửa 24/08/2026 (story 5-1) — thanh ngang bốn mục đã thay bằng MỘT TRANG có thanh việc trái.**
> Bản cũ để *từng trang tự ghép chrome*. Đếm được trước khi xoá: hai trong bốn màn chính quên hẳn
> điều hướng, mọi màn lỗi và màn tải cũng quên, và bốn bề rộng khác nhau (720 / 900 / 1100 / 1280)
> không theo hệ nào. Chừng nào chrome còn do trang tự ghép thì sẽ luôn có trang quên — nên quyền
> sở hữu chuyển hẳn về `app/admin/layout.tsx`.

Bàn làm việc `/admin` là **một trang**, ăn hết khung nhìn:

- **Thanh trên** không dính đáy: **Bàn làm việc** · ô tìm người · nhãn *ai đang vận hành* (FR-39).
  Ô tìm **dời tâm canvas**: chọn một người là sang màn Cây gia phả với người ấy làm tâm. Neo đi
  qua đường dẫn (`?neo=`), nên ô này dùng được từ mọi màn của bàn — và nút Back thành "về tâm
  trước" mà không phải dựng lịch sử riêng.
- **Thanh việc trái** luôn có mặt, và nó có **hai phần**, không phải một:
  - **Thanh ghi hành động** trên cùng, ngăn bằng một gạch: *Thêm người vào phả*. Nó đứng NGOÀI
    bản đồ màn vì nó trả lời câu khác — ba nhóm dưới nói *"cái gì đang đợi tôi"*, nút này nói
    *"tôi muốn làm gì"*. Không mang son: nó chỉ MỞ biểu mẫu, chưa ghi gì.
  - **Ba nhóm điều hướng** — *Bàn làm việc · Đối chiếu · Sổ dòng họ*, tám mục.
- Mỗi mục là biểu tượng + nhãn. **Số đang chờ chỉ có ở mục có hàng chờ thật** — hết Đợt 2 là ba
  mục: *Hàng chờ khẳng định · Duyệt vào phả · Mảnh chưa nối*. Năm mục còn lại KHÔNG có số, và cố
  ý: *Nạp khung* là một VIỆC chứ không phải hàng chờ, *Trang nhà* và *Cây gia phả* là chỗ đứng,
  *Nơi chốn* và *Tên họ & đề từ* là sổ tra. Một số 0 trên chúng không mang nghĩa gì, mà một con
  số vô nghĩa cạnh ba con số có nghĩa thì làm hỏng cả ba.
- **Thu được** xuống ray hẹp; **thu rồi ray vẫn giữ số**, vì mất số là mất hộp thư đến đúng lúc
  đang làm việc. Lựa chọn thu/mở nhớ theo người xem. Màn Cây **xin** thu lúc mở (canvas cần bề
  ngang nhất), nhưng đó là lời xin của một màn: nó không ghi đè lựa chọn đã lưu, và người vận
  hành mở lại thì bàn thôi hỏi câu ấy trong cả phiên.

> **Sửa 25/08/2026 (code review Epic 5) — ba dòng trên đã trôi khỏi mã.** Bản cũ đếm *ba nhóm*
> (thiếu hẳn thanh ghi hành động, thứ story 5-4 thêm vào) và nói *"mỗi mục là biểu tượng + nhãn +
> số đang chờ"* — sai với **5 trong 8** mục. Đúng cái tội mà AC 19 của story 5-1 dựng ra để chặn:
> tài liệu trải nghiệm nói một đằng, thanh việc làm một nẻo, và người đọc tài liệu tin tài liệu.
- Số `null` (đọc hỏng) **không bao giờ** hiện thành `0`: một số 0 giả làm người vận hành tin là
  đã sạch việc rồi bỏ đi.
- **Một hệ bề rộng**: vùng nội dung lấy trọn bề ngang còn lại; chữ tự giới hạn bằng **độ dài
  dòng** (`max-w-[70ch]`), không bằng một khung hẹp — nên bảng và canvas vẫn dùng hết màn hình.
- **Đúng một `<h1>`** mỗi màn, do layout dựng. Các bước bên trong một màn là `<h2>`.
- Mục đang mở: đậm + gạch trái đặc + `aria-current="page"`. **Không dùng son** — son mang đúng
  một nghĩa *đã chốt*, mà điều hướng thì không chốt gì cả.
- **Không mục nào trỏ vào màn chưa tồn tại.** Mỗi story của Epic 5 tự thêm mục của mình khi màn
  của nó ra đời; đường cụt còn tệ hơn thiếu mục.

Đây là chrome **trần** (xem `DESIGN.md § Colors › Bề mặt B`) — nền xám ngà, chữ không chân,
không đề từ Hán-Nôm, không nền giấy, không đổ bóng.

**Sàn chữ 17px vẫn áp nguyên cho bề mặt B.** Bảng chật thì **bớt cột**, không thu chữ. Cột nào
không giúp ra quyết định thì bỏ khỏi bảng — chi tiết còn lại nằm trong khối cảnh báo của đúng
dòng cần nó. Một hàng rào có ngoại lệ "chỗ này chỉ là bảng quản trị" là một hàng rào đã đổ.

### Màn chủ — "dòng họ đang sống"

Bốn ô. **Đợt 1 chỉ dựng hai ô đầu**; hai ô sau đã tả ở đây để spine không bị cắt cụt theo phạm vi
thực thi, và nằm trong `PLANNED_REQS` của xưởng.

| Ô | FR | Đợt 1 |
|---|---|---|
| Cây gia tộc — đường lên cụ xa nhất hiện biết | FR-13 | ✅ dựng |
| Vừa vào phả | FR-39 | ✅ dựng |
| Lời giáo huấn dòng họ | FR-22 | ❌ chưa |
| Sự kiện sắp tới | FR-41 | ❌ chưa |

Ô **"Vừa vào phả"** không cần FR-14: FR-39 đã ghi ai được thêm lúc nào. Cái FR-14 bổ sung là
*nghi thức chào mừng*, không phải dữ liệu.

### Tài khoản ≠ người trong phả

FR-64 tách hai lớp, và IA phải phản ánh:

- **Tài khoản** — chứng minh sở hữu email/số. Ai cũng tạo được.
- **Gắn vào node** — chứng minh *là người này trong dòng họ*. Do người trong họ bảo lãnh hoặc
  quản trị xác nhận.

Người có tài khoản nhưng **chưa gắn node** chỉ xem được phần công khai. Đây là một trạng thái
thường trực, không phải bước chuyển tiếp — mọi màn phải xử được nó.

## Voice and Tone

**Không xưng hô.** Câu không chủ ngữ: *"Thêm người thân"*, *"Đã lưu vào phả"*,
*"Chưa tìm thấy tên này"*.

Lý do: sản phẩm phục vụ từ sinh viên 20 tuổi tới cụ 84. Mọi đại từ cố định đều sai với một nửa
số người dùng, và gọi cụ 84 tuổi là "anh" thì hỏng — mà cụ 84 tuổi chính là người chỉ số M6 đang
đếm.

Cái giá đã biết và đã chấp nhận: **giọng lạnh, và màn chủ không có lời chào.** Hơi ấm do
`DESIGN.md` gánh.

**Từ phả học giữ nguyên**, kèm chú giải tại chỗ lần đầu xuất hiện: *tồn nghi*, *theo lời kể*,
*chắc chắn*, *Tầng chính thức*.

**Cấm trên bề mặt A:** sync · upload · validate · merge · node · ID. Bề mặt B thì được.

### "bạn" cũng là xưng hô — cấm luôn

**Bổ sung 11/08/2026,** sau một lượt soi lại toàn bộ chữ trên màn. Ba màn đầu đã lọt *"chi của
bạn"*, *"Xem đường từ bạn ngược lên cụ"*, và một nhãn *"bạn"* gắn thẳng lên node. Luật không xưng
hô bị hiểu hẹp thành "đừng dùng anh/chị", trong khi *bạn* sai đúng theo cùng một cách: gọi cụ 84
tuổi là "bạn" thì hỏng y như gọi bằng "anh".

Cách nói thay thế, theo thứ tự ưu tiên:

1. **Bỏ hẳn chủ ngữ** — *"Vòng son là đường huyết thống ngược lên cụ xa nhất hiện biết."*
2. **Dùng `mình`** khi bắt buộc phải trỏ về chính người xem — *"chi của mình"*, nhãn *"mình"* trên
   node của chính họ. `mình` không mang tuổi tác và không mang vai vế, nên không sai với ai.

Không bao giờ: *bạn · anh · chị · quý vị · các bạn*.

## Component Patterns

*(Đặc tả thị giác ở `DESIGN.md § Components`; đây là hành vi.)*

### Node người

Chạm → mở trang một người. Không có menu ngữ cảnh, không nhấn-giữ — cử chỉ ẩn là thứ đầu tiên
mất với người ít dùng máy.

Node ở Tầng tồn nghi hành xử **giống hệt** node chính thức: mở được, sửa được, chia sẻ được.
Khác biệt duy nhất là chất liệu `{components.node-ton-nghi}` và một chú giải giải thích.

### Chip mức tin cậy

Chạm → panel giải nghĩa: mức này là gì, ai khai, dựa vào đâu (FR-1). Panel này là chỗ **duy nhất**
FR-1 lộ ra với người thường; không nhét nguồn vào node.

### Thanh điều hướng gốc

Mục đang mở: chữ đậm + son + `aria-current="page"`. Mục khác: `{colors.muted-foreground}`.

Không có huy hiệu số đếm, không chấm đỏ thông báo. Sản phẩm này không có kênh đẩy (PRD §12) nên
một chấm đỏ chỉ là lời hứa suông.

### Bảng xem trước so khớp (bề mặt B)

Mỗi dòng có ba trạng thái: *khớp người có sẵn* · *người mới* · *nghi trùng*. Chọn từng dòng hoặc
chọn tất. **Bot gợi ý, không tự gộp** (FR-48) — không có đường nào để hệ thống tự quyết.

**Cảnh báo chèn trong dòng.** Bot có hai loại ghi chú, cả hai hiện thành một khối chàm ngay
**dưới** dòng nó nói về, không phải một cột và không phải một màn khác:

| Loại | Bot thấy gì | Người vận hành phải làm gì |
|---|---|---|
| **Nghi trùng** | Dòng này có thể là một người đã có trong phả, hoặc trùng một dòng khác trong chính file | Chọn *là cùng một người* (kèm tên ứng viên) hoặc *là hai người khác nhau* |
| **Lỗi so khớp** | Tên cha ghi trong dòng không tìm thấy ở đâu — cả trong file lẫn trong phả | Ghi vẫn được; người này thành **gốc tạm của một mảnh mới** (FR-63) |

Một dòng *người mới* vẫn có thể mang cảnh báo lỗi so khớp — hai thứ độc lập.

**Không cái nào được chọn sẵn.** Ứng viên trùng bày ra kèm **đời + chi**, y như màn *không tìm
thấy* của bề mặt A và vì đúng một lý do: trong một dòng họ, trùng tên là chuyện thường, và một
liên kết cha–con sai làm hỏng phả của cả một chi. Bot chọn sẵn là bot đã quyết hộ.

**Bộ lọc** trên đầu bảng: *Tất cả · Người mới · Khớp người có sẵn · Cần xem lại*. Mục cuối là thứ
thay cho "màn bảng cảnh báo" — cùng một bảng, cùng một dữ liệu, lọc lại.

### Thanh việc (bề mặt B)

> **Sửa 24/08/2026 (story 5-1).** Trước đây mục này tên *Thanh bàn duyệt* và tả một thanh ngang
> bốn mục do từng trang tự render. Component ấy (`components/pha/thanh-ban-duyet.tsx`) đã xoá.

Thanh việc dọc bên trái, do **layout** dựng nên không màn nào quên được — kể cả màn lỗi và màn
đang tải. Mục = biểu tượng + nhãn; **số đang chờ chỉ có ở mục có hàng chờ thật** (ba trong tám —
xem § IA ở trên). Thu xuống ray hẹp thì **giữ nguyên số**. Mục
đang mở đậm + gạch trái đặc + `aria-current="page"`. Không dùng son: son mang nghĩa *đã chốt*,
còn điều hướng thì không chốt gì cả. Chrome trần — xem `DESIGN.md § Colors › Bề mặt B`.

Đầy đủ ở § IA › Bề mặt B › *Chrome của bề mặt B*.

## State Patterns

### Không tìm thấy — màn quan trọng nhất của Đợt 1

Ngày ra mắt, **phần lớn** người gõ tên bố sẽ không thấy gì. Đây là trạng thái **mặc định** trong
nhiều tháng đầu, không phải trạng thái lỗi. Nó quyết định người ta ở lại hay đóng máy.

Luật: **luôn bày người gần giống trước, rồi mới cho tạo.**

```
Chưa tìm thấy "Nguyễn Quang Hùng"

Có phải một trong những người này?
  Nguyễn Quang Hùng · đời 6 · chi Hai
  Nguyễn Quang Hưng · đời 6 · chi Ba

[ Không ai cả — thêm bố vào phả ]
```

So khớp không dấu, đồng âm và cận âm (NFR-9). Kèm **đời + chi** để phân biệt hai người trùng tên
— trong một dòng họ, trùng tên là chuyện thường.

Nút tạo là hành động **phụ**, đặt dưới. Chặn bản trùng tại nguồn rẻ hơn nhiều so với gỡ sau bằng
FR-48.

### Cây rỗng / mảnh rời

Hiện **trung thực số mảnh chưa nối** (FR-48). Không bao giờ vẽ các mảnh rời như một cây liền.

### Chưa gắn node

Xem được phần công khai; mọi hành động ghi dẫn về luồng gắn node, không phải về màn lỗi.

### Vừa được thêm bởi người khác (FR-55)

Thông báo **lưu sẵn trên node**, hiện ra lần đầu người đó đăng nhập và gắn được vào node của
mình. Kèm ba đường: **sửa** thông tin về mình · **ẩn** khỏi phần công khai (vẫn giữ liên kết phả
hệ) · **từ chối** xuất hiện trong bản in.

> ⚠️ **Giới hạn đã chấp nhận, phải mang theo xuống epic.** Cơ chế này là *kéo*. Người không bao
> giờ mở web thì **không bao giờ biết** mình đã bị đưa vào phả — mà đó chính là nhóm cao niên
> FR-55 sinh ra để bảo vệ. PRD §12 đã tự thú điều này ở tầng sản phẩm. Đừng để story ngầm hiểu
> rằng FR-55 đã xong.

## Interaction Primitives

- **Một câu hỏi một màn** trong luồng tự khai (FR-11). Ràng buộc cứng.
- **Không cử chỉ ẩn.** Mọi hành động có nút thấy được.
- Cây: kéo để di chuyển, chụm để phóng, **và** có nút phóng/thu — chụm hai ngón không phải ai
  cũng làm được.
- Ghi âm (FR-47): một nút to, một trạng thái đang ghi, một nút dừng. Không dạng sóng, không cắt
  ghép — thu là việc bây giờ, bóc tách là việc sau.
- Bề mặt B được dùng chọn hàng loạt và phím tắt; bề mặt A thì không.

## Accessibility Floor

| | Ngưỡng |
|---|---|
| Cỡ chữ thân | **17px** |
| Cỡ chữ tối thiểu tuyệt đối | **15px** — mọi chữ, không ngoại lệ |
| Vùng chạm | **44×44px** |
| Tương phản chữ | ≥ 4.5:1, **kể cả node tồn nghi** |
| Mã hoá trạng thái | **không bao giờ chỉ bằng màu** — luôn kèm chất liệu/viền/chữ |

Ngưỡng cuối phủ FR-2: ba mức tin cậy phân biệt được khi in đen trắng và với người mù màu.

**Bán kính riêng tư là chuyện dữ liệu, không phải chuyện CSS.** AD-13/FR-37: cái ngoài bán kính
**không được gửi tới client**. Màn nào vẽ "phần bị ẩn" phải vẽ nó như **không tồn tại**, không
phải như ô bị che.

## Responsive & Platform

Bề mặt A thiết kế cho điện thoại tầm trung, mạng 4G ở quê (NFR-5). Ngân sách: thêm một người vào
phả **≤ 4 màn hình, ≤ 3 phút**. Tính năng nào làm luồng này dài thêm phải nhường đường.

Nhưng **điện thoại-trước không có nghĩa là chỉ-điện-thoại.** NFR-11 nói web phải đủ năng lực, và
người trong họ có mở trên máy — nhất là khi ngồi xem cả tộc. Bề mặt A vì thế **responsive thật**,
không phải mobile bị kéo giãn:

#### Nguyên tắc: màn rộng không phải để phóng to

Chữ trên máy **vẫn 17px** như trên điện thoại. Cái đổi là **lượng thông tin hiện cùng lúc** và
**hình dạng** của nó.

Mọi lựa chọn responsive phải trả lời được một câu: *màn hẹp buộc phải giấu gì, và màn rộng bày
lại thế nào?* Không trả lời được thì đừng đổi — nới rộng mà không thêm gì chỉ tạo ra dòng chữ dài
hơn mức đọc thoải mái.

| Màn | Điện thoại | Máy (`md`+) |
|---|---|---|
| Điều hướng gốc | dính **đáy** | chuyển lên **đỉnh** |
| Màn chủ | hai ô xếp chồng | hai ô **cạnh nhau** |
| Cả tộc (tầng 1) | khối chi xếp chồng | **khung nhìn cây**, zoom/pan được |
| Một chi (tầng 2) | đời là **hàng gập được** | **khung nhìn cây**, zoom/pan được |
| Không tìm thấy | một cột | **vẫn một cột hẹp** |
| Cây gia tộc (tầng 3) | một cột | **khung nhìn cây**, zoom/pan được |

> **Sửa 22/08/2026 — hàng "Màn chủ": hai ô cạnh nhau từ `lg`, không phải `md`.** Cột `md`+ của
> bảng trên nói chung cho cả bề mặt A; riêng màn chủ thì con số không cho phép. Ở `md` khung rộng
> 768px: trừ 64px lề, 288px cột phải và 48px khe, cột chữ còn **368px** — thấp hơn tầm đọc
> 510–640px của `components/pha/khung.ts` gần một phần ba. Nên dải 768–1023px giữ **xếp chồng**
> (một cột 704px, đọc tốt), và lưới hai cột bật từ `lg` (1024px), cột chữ 624px. Đây chính là
> nguyên tắc ngay dưới bảng đọc ngược lại: nới rộng mà không thêm gì thì thường ra dòng chữ quá
> dài, còn ở 768px thì nới rộng ra dòng chữ quá **ngắn** — hai lỗi khác nhau của cùng một sai lầm
> là đổi bố cục theo mốc breakpoint chứ không theo bề rộng còn lại cho chữ. Xem
> `app/(pha)/page.tsx`.

**Cả ba tầng dùng CHUNG một khung nhìn** (`components/pha/khung-cay.tsx`). Ba tầng khác nhau ở
**node**, không ở vỏ: tầng 1 node là *khối chi*, tầng 2 và 3 node là *một cặp vợ chồng*. Dựng ba
vỏ riêng thì lần sau đổi một luật của vỏ phải sửa ba chỗ, và kiểu gì cũng sót một.

**Thanh đổi chỗ** vì trên máy không có "vùng ngón cái" — đáy màn là chỗ xa mắt nhất, và một thanh
kéo ngang 1280px đọc ra như thanh trạng thái.

**Tầng 1 xếp ngang và có nhánh nối** vì chỉ khi đứng cạnh nhau, có nhánh vẽ xuống từ gốc tạm,
chúng mới đọc ra **hình cây**; xếp chồng thì là danh sách.

**Mảnh chưa nối không có nhánh nào** (FR-48) — vì chưa ai tìm ra chỗ nối, và vẽ một nét mờ nối
tạm là nói dối đúng cái điều FR-48 sinh ra để chống. Trên khung nhìn kéo được, mảnh rời còn nằm
**tách hẳn sang một bên**, phải kéo tới mới thấy: khoảng trắng ấy nói rõ hơn mọi câu chú thích.

**Tầng 2 đổi hẳn cấu trúc**, không chỉ đổi bề rộng: màn rộng vẽ **cây thật, từ trên xuống** — cụ
ở trên, con cháu bên dưới, nhánh rủ xuống, vợ/chồng đứng chung một thẻ. Người xem thấy trọn một
chi trong một cái nhìn thay vì bung từng đời.

> **Sửa 11/08/2026 — hướng đọc.** Bản trước xếp đời thành **cột trái sang phải** và biện minh
> rằng đó là cách phả in đọc. Sai: trái-sang-phải là hướng đọc của một **bảng**. Trên phả, **xuống
> là đi về phía sau** — hướng đọc tự nó mang nghĩa, và đánh mất nghĩa ấy thì cái vẽ ra không còn
> là cây nữa. Người duyệt gạch đi, đúng.

**Vợ/chồng nằm trong cùng một thẻ với người mang huyết thống**, không phải node riêng. Trong phả,
hai người đứng chung một ô và con cái treo dưới cả hai; tách ra thì con nối vào mỗi người cha và
người bạn đời biến mất khỏi nhánh. Danh sách gập trên điện thoại cũng gộp theo cặp, để cùng một
người không phải lúc là một ô trên cây, lúc lại là hai dòng trong danh sách.

**Hai màn cố tình KHÔNG nới rộng.** Danh sách kết quả tìm kiếm kéo ngang 1280px là khó đọc chứ
không phải sang, và một đường huyết thống dọc không cần bề ngang. Dòng chữ quá dài vi phạm tinh
thần của § Accessibility Floor dù không vi phạm con số nào.

#### Phần giấu phải giấu THẬT — kể cả JavaScript

**Chốt 11/08/2026, sau khi đo trên bản production.**

`hidden md:block` là **CSS**, không phải điều kiện dựng. Bọc cây bằng nó thì trên điện thoại thư
viện vẽ cây **vẫn tải về, vẫn render ở server, vẫn hydrate** — cho một cái cây không ai nhìn thấy.

| Màn | JS tải về | |
|---|---|---|
| Màn không có cây | 552 KB | mốc |
| Một chi — trước khi sửa | 725 KB | **+177 KB thô · ~57 KB nén** |
| Một chi — sau khi sửa | 557 KB | **+5 KB** |

Trên 4G ở quê, 57 KB nén cộng công hydrate là 1–2 giây trả cho hư không — đúng thứ NFR-5 dựng ra
để chặn.

**Luật:** thành phần nào chỉ xuất hiện ở một khung xem thì **tải theo khung xem ấy**, không chỉ
ẩn bằng CSS. Ngưỡng tải phải **trùng đúng breakpoint** dùng để ẩn/hiện, nếu không sẽ có một dải
bề rộng mà khối hiện ra nhưng nội dung không bao giờ tới.

**Đã cân nhắc và BÁC: tách hẳn hai giao diện mobile / web.** Bệnh không phải *"một codebase phục
vụ hai thiết bị"* mà là *"đang gửi đi một component không dùng tới"* — và cái sau chữa được mà
không phải trả cái giá của cái trước: hai nguồn sự thật cho cùng một spine, vỡ đường dẫn chia sẻ
(FR-11 — người ta tới bằng link nghe được ở buổi họp họ, link ấy phải mở được ở mọi máy), người
thu nhỏ cửa sổ trên máy nhận nhầm bản, và mỗi màn phải dựng rồi promote hai lần.

Bề mặt B chỉ cần chạy tốt trên desktop. Không tối ưu cho tablet — và vì nó desktop-only, JS của
nó không bao giờ đè lên điện thoại của người trong họ.

## Key Flows

### Luồng 1 — Khánh tìm bố, không thấy, và vẫn ở lại

**Nhân vật:** Nguyễn Quang Khánh, sinh 2004, sinh viên. Nghe về web tại **buổi họp họ** — kênh
lan truyền là sự kiện ngoài đời, không phải link chia sẻ.

1. Mở web từ đường dẫn nghe được ở buổi họp. **Chưa đăng nhập, vẫn xem được cây.**
2. Gõ tên bố: *Nguyễn Quang Hùng*.
3. **Không tìm thấy.** Màn bày hai người gần giống — không ai đúng.
4. Bấm *"Không ai cả — thêm bố vào phả"*. Tới đây mới cần xác thực (FR-64): tạo tài khoản, rồi
   khai mình là ai trong họ.
5. Thêm node bố. Vào thẳng **Tầng tồn nghi**, hiện ngay, không chờ duyệt (FR-3).
6. Gõ tên anh trai. **Thấy đúng một người.** Xác nhận liên kết.
7. **← cao trào.** Cây bật ra **đường ngược lên cụ xa nhất hiện biết** của riêng Khánh, tô sáng,
   kèm số đời và mã chi tính tại chỗ (FR-13, FR-63). Node bố mang dòng *"cháu Khánh ghi · hôm
   nay"* (FR-39) — tên Khánh đã ở trên phả.

**Chỗ dễ hỏng:** bước 3. Nếu màn không-tìm-thấy là một ô rỗng thay vì một cửa tạo, Khánh đóng
máy ở đây và không bao giờ tới bước 7.

`[NOTE FOR UX]` Bước 5–6 để lộ một câu hỏi dữ liệu chưa ai trả lời: **anh trai Khánh có trên cây
mà bố thì không.** Nghĩa là khung CSV nạp anh trai vào như node rời, chưa có cha. Cần xác nhận
với kiến trúc — nó quyết định việc thêm node bố có tự động nối vào anh trai hay không.

### Luồng 2 — Ngày 0, Hiệp gieo mồi vào hệ thống trống

**Nhân vật:** Nguyễn Hiệp, người dựng và vận hành, làm trên desktop. Trong tay: một file CSV
theo mẫu, điền tay ngoài hệ thống.

1. Mở khu quản trị. **Tải file mẫu.**
2. Điền ngoài hệ thống — các chi hiện có, người đứng đầu mỗi chi, những cụ đã biết tên.
3. **Tải file lên.**
4. Hệ thống **tự so khớp** với dữ liệu đã có.
5. **Trang xem trước** bày toàn bộ: dòng nào khớp người có sẵn, dòng nào là người mới, dòng nào
   nghi trùng.
6. Bot báo lỗi so khớp và ứng viên trùng, **ngay dưới dòng nó nói về**. Bộ lọc *Cần xem lại* gom
   đúng những dòng ấy lại. **Gợi ý, không tự gộp** (FR-48).
7. Submit từng người, hoặc submit hàng loạt.
8. **← cao trào.** Cây lần đầu có hình. Toàn bộ vào mức **tồn nghi**, sửa được về sau (FR-51).
   Hệ thống tự suy ra gốc tạm cho mỗi mảnh và **nói rõ đó là "cụ xa nhất hiện biết"**, không phải
   khẳng định đã là Thuỷ tổ (FR-63). Số mảnh chưa nối hiện trung thực.

**Cao trào mượn màn của bề mặt A.** Bước 8 không dựng màn riêng cho bàn duyệt: nó mở thẳng
*cả tộc* (`ca-toc`) ở khung máy. Đây là chủ ý — phần thưởng của việc gieo mồi không phải một
bảng báo "đã ghi 8 người", mà là **thứ dòng họ sắp nhìn thấy**. Người vận hành nên gặp đúng cái
màn ấy, ở đúng hình dạng ấy.

**Câu chưa trả lời:** Hiệp chưa nói lúc nào thì thấy *"được rồi, mở cho họ vào"*. PRD §9 đặt điều
kiện ra mắt là *mỗi chi có ít nhất một người đã tự khai và nối được vào khung, số mảnh chưa nối
bằng 0* — nhưng đó là điều kiện **sau** khi mở. Điều kiện để **bắt đầu** mở còn trống.

### Luồng 3 — Đi xem cả tộc

**Nhân vật: bất kỳ ai mở đường dẫn — không cần tài khoản.**

Người duyệt trả lời 11/08/2026, gọn một câu: *"ai cũng xem được."* Đó là câu trả lời thật, không
phải né câu hỏi — và nó nói rằng đây **không phải một hành trình có nhân vật** theo nghĩa của các
luồng khác, mà là một **năng lực mở cho mọi người**. Chính là FR-11: *xem cây không cần đăng ký*.

Ghi đúng như vậy thay vì bịa ra một cái tên. Cái giá phải biết: luồng này **không có nhịp cảm
xúc** — không ai kể *tại sao* họ mở nó vào đúng lúc ấy. Nhịp cao trào ở bước 2 vì thế là suy ra
từ thiết kế, không phải chép lại từ một câu chuyện có thật. Nếu về sau có người kể một lần mở
thật, distill vào đây và luồng sẽ mạnh hơn.

> Liên quan tới `[ASSUMPTION]` ở § Foundation về bề mặt công cộng: câu trả lời này chốt rằng
> **xem** là mở cho tất cả, nhưng **chưa** chốt bán kính riêng tư FR-37 áp cho khách khác gì so
> với người đã gắn node. Đó vẫn là câu hỏi để mở.

1. Chạm **Gia phả** → mở vào **chi của mình**, đời của mình bung sẵn.
2. Bấm **← Xem cả tộc** → **← cao trào.** Thấy chi của mình được tô son **giữa các chi khác**,
   và thấy **mảnh chưa nối đứng tách hẳn ra** — lần đầu dòng họ hiện ra như một tổng thể, kèm
   phần chưa nối được.
3. Chạm một khối chi khác → xem chi đó.
4. Bấm **Xem cây gia tộc** → tầng 3.

**Chạy ở cả hai khung.** Đây là luồng duy nhất được dựng hai lần — một bản điện thoại, một bản
máy — vì ba màn cây có hai bộ mặt khác nhau (xếp chồng / hàng ngang), và bản đồ phải vẽ được cả
hai thay vì bắt người duyệt tự tưởng tượng nửa còn lại.

> ⚠️ **Bước 3 chưa thật.** Ba khối chi hiện trỏ về cùng một trang; cần route `[chiId]` khi
> promote. Đã ghi thẳng vào `note` của bước.

### Luồng chưa distill

- **Thu lời kể (FR-47 + FR-49).** Chưa có nhân vật. Hành trình gốc UJ-1 (bà Nhàn 84 tuổi, cháu
  Quân, *"hồi đói Ất Dậu"*) đã mất khi PRD được viết lại và không khôi phục được — PRD không nằm
  trong git. Cần người duyệt kể lại. **Đây là hành trình PRD từng gắn nhãn "quan trọng nhất của
  sản phẩm".**
- **Duyệt lên Tầng chính thức (FR-3).** Hành trình gốc UJ-3 cũng mất; phần còn lại phụ thuộc FR-4
  vốn ngoài Đợt 1.
- **Ngồi vào bàn làm việc `/admin` (Đợt 2, Epic 5).** Bố cục đã chốt qua brainstorming
  23–24/08/2026 và có bản dựng thử ở `/uiworkshop/admin-canvas-graph`, nhưng **chưa có nhân vật
  có tên và chưa có nhịp cao trào**. Ba việc hằng ngày người duyệt tự nêu — thêm từng người ·
  duyệt người vào phả · ghi thêm thông tin — mới là *danh sách việc*, không phải *một phiên làm
  việc thật*. Cần người duyệt kể lại một buổi có thật rồi distill; **đừng bịa nhân vật.**
  `FLOWS` trong `app/uiworkshop/_registry/flows.ts` vì thế vẫn rỗng cho bề mặt này.
