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
| Trang xem trước so khớp | FR-51, FR-48 |
| Bảng cảnh báo (nghi trùng, lỗi so khớp) | FR-48 |
| Hàng chờ duyệt lên Tầng chính thức | FR-3 |
| Hợp nhất mảnh | FR-48 |

### Màn chủ — "dòng họ đang sống"

Bốn ô. **Đợt 1 chỉ dựng hai ô đầu**; hai ô sau đã tả ở đây để spine không bị cắt cụt theo phạm vi
thực thi, và nằm trong `PLANNED_REQS` của xưởng.

| Ô | FR | Đợt 1 |
|---|---|---|
| Đường về cụ xa nhất hiện biết | FR-13 | ✅ dựng |
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
| Cả tộc (tầng 1) | khối chi xếp chồng | **hàng ngang + nhánh nối thật** |
| Một chi (tầng 2) | đời là **hàng gập được** | đời là **cột**, trái sang phải, không gập |
| Không tìm thấy | một cột | **vẫn một cột hẹp** |
| Đường về cụ (tầng 3) | một cột | **vẫn một cột hẹp** |

**Thanh đổi chỗ** vì trên máy không có "vùng ngón cái" — đáy màn là chỗ xa mắt nhất, và một thanh
kéo ngang 1280px đọc ra như thanh trạng thái.

**Tầng 1 xếp ngang và có nhánh nối** vì chỉ khi đứng cạnh nhau, có nhánh vẽ xuống từ gốc tạm,
chúng mới đọc ra **hình cây**; xếp chồng thì là danh sách. Đầu mút thanh ngang dừng đúng **tâm
khối đầu và khối cuối** — nhánh cụt thò ra hai bên đọc như lỗi vẽ.

**Tầng 2 đổi hẳn cấu trúc**, không chỉ đổi bề rộng: đời thành **cột trái sang phải**, đúng cách
**phả in** đọc. Người xem thấy trọn một chi trong một cái nhìn thay vì bung từng đời. Đây là thứ
duy nhất màn rộng mua được mà màn hẹp không có cách nào có.

**Hai màn cố tình KHÔNG nới rộng.** Danh sách kết quả tìm kiếm kéo ngang 1280px là khó đọc chứ
không phải sang, và một đường huyết thống dọc không cần bề ngang. Dòng chữ quá dài vi phạm tinh
thần của § Accessibility Floor dù không vi phạm con số nào.

Bề mặt B chỉ cần chạy tốt trên desktop. Không tối ưu cho tablet.

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
6. Bot báo lỗi so khớp và ứng viên trùng. **Gợi ý, không tự gộp** (FR-48).
7. Submit từng người, hoặc submit hàng loạt.
8. **← cao trào.** Cây lần đầu có hình. Toàn bộ vào mức **tồn nghi**, sửa được về sau (FR-51).
   Hệ thống tự suy ra gốc tạm cho mỗi mảnh và **nói rõ đó là "cụ xa nhất hiện biết"**, không phải
   khẳng định đã là Thuỷ tổ (FR-63). Số mảnh chưa nối hiện trung thực.

**Câu chưa trả lời:** Hiệp chưa nói lúc nào thì thấy *"được rồi, mở cho họ vào"*. PRD §9 đặt điều
kiện ra mắt là *mỗi chi có ít nhất một người đã tự khai và nối được vào khung, số mảnh chưa nối
bằng 0* — nhưng đó là điều kiện **sau** khi mở. Điều kiện để **bắt đầu** mở còn trống.

### Luồng 3 — Đi xem cả tộc `[CHƯA CÓ NHÂN VẬT]`

**Nhân vật: chưa có.** Luồng đã dựng trong xưởng (`xem-ca-toc-dien-thoai`, `xem-ca-toc-may`) và
bốn bước đều có màn thật, nhưng **chưa ai kể nó xảy ra với ai**. Luật của dự án cấm bịa nhân
vật, nên chỗ này để trống cho tới khi người duyệt kể — `source: null` trong `flows.ts`.

1. Chạm **Gia phả** → mở vào **chi của mình**, đời của mình bung sẵn.
2. Bấm **← Xem cả tộc** → **← cao trào.** Thấy chi của mình được tô son **giữa các chi khác**,
   và thấy **mảnh chưa nối đứng tách hẳn ra** — lần đầu dòng họ hiện ra như một tổng thể, kèm
   phần chưa nối được.
3. Chạm một khối chi khác → xem chi đó.
4. Bấm **Xem đường từ bạn ngược lên cụ** → tầng 3.

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
