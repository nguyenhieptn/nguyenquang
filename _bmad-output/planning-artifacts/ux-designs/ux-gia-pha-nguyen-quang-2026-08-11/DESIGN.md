---
name: Gia phả dòng họ Nguyễn Quang
description: >
  Bản sắc thị giác "Giấy dó & son". Delta trên nền shadcn/ui (base radix, preset nova)
  + Tailwind v4 CSS-first. Token nào không liệt kê ở đây thì thừa kế shadcn.
status: draft
updated: 2026-08-11
sources:
  - ../../prds/prd-gia-pha-nguyen-quang-2026-08-10/prd.md
  - ../../architecture/architecture-gia-pha-nguyen-quang-2026-08-10/ARCHITECTURE-SPINE.md
  - ../../../../specs/frontend-stack.md
colors:
  # Ghi đè brand trên nền shadcn. Chuỗi nguồn sự thật một chiều:
  # DESIGN.md ──(chép tay)──▶ app/globals.css @theme ──▶ class Tailwind
  background: '#F4ECD8'        # giấy dó
  foreground: '#3A2F24'        # mực nâu
  card: '#FBF6E9'              # ô nổi trên nền giấy
  card-foreground: '#3A2F24'
  border: '#DDD0B2'
  muted-foreground: '#6F5F47'  # nhãn phụ, siêu dữ liệu — 29/08/2026 (story 7-2): giấy dó 5.38 · ô nổi ≥5.9 · nền bàn B 5.14 (sàn 4.5)
  primary: '#A8322A'           # SON — khan hiếm, xem § Do's and Don'ts
  primary-foreground: '#F8F2E2'
  ring: '#A8322A'
  # Ba mức tin cậy (FR-2). Màu CHỈ là lớp phụ trợ — mã hoá chính là chất liệu.
  tin-chac-chan: '#3A2F24'
  tin-loi-ke: '#7D6C55'
  tin-ton-nghi: '#B09A72'
  # Cảnh báo/lỗi KHÔNG dùng son — son đã mang nghĩa "đã chốt".
  # CHỐT 11/08/2026: chàm mực, thay hổ phách #8A5A1E đã tạm đặt. Xem § Colors › Cảnh báo.
  destructive: '#2E4B6B'       # chàm mực
  destructive-foreground: '#F2F5F9'
  canh-bao-nen: '#E8EDF3'      # nền khối cảnh báo — chàm pha loãng trên nền trần
  # Bề mặt B (bàn duyệt) — khung TRẦN. Xem § Colors › Bề mặt B.
  ban-nen: '#EDEAE4'           # nền bàn làm việc, xám ngà trung tính
  ban-o: '#FFFFFF'             # ô bảng
  ban-vien: '#D6D2CA'
typography:
  # Thân, nhãn, phụ chú thừa kế shadcn về cấu trúc; ghi đè họ chữ và SÀN CỠ.
  body:
    fontSize: 17px             # SÀN. Xem § Do's and Don'ts.
    lineHeight: '1.6'
  caption:
    fontSize: 15px             # tối thiểu tuyệt đối — không có gì nhỏ hơn
    lineHeight: '1.5'
  ten-nguoi:
    fontFamily: 'serif-phả'    # xem § Typography
    fontSize: 17px
    fontWeight: '600'
  display:
    fontFamily: 'serif-phả'
    fontSize: 23px
    fontWeight: '400'
  han-nom:
    fontFamily: 'han-nom'
    fontSize: 23px
    # LUÔN đi kèm phiên âm Hán-Việt ở cỡ caption — NFR-9.
rounded:
  sm: 6px
  md: 9px
  lg: 14px
spacing:
  # Thừa kế Tailwind. Không ghi đè.
components:
  node-chinh-thuc:
    background: '{colors.card}'
    border: '1px solid {colors.border}'
    radius: '{rounded.md}'
  node-ton-nghi:
    background: 'vân chéo 135° trên {colors.card}'
    border: '1px dashed #B09A72'
    radius: '{rounded.md}'
    # Độ tương phản chữ BẰNG node-chinh-thuc. Không opacity.
  nut-chinh:
    background: '{colors.primary}'
    foreground: '{colors.primary-foreground}'
    radius: '{rounded.md}'
  nut-phu:
    background: 'transparent'
    border: '1px solid #C6B48F'
    foreground: '#6B5A44'
    radius: '{rounded.md}'
---

# Gia phả dòng họ Nguyễn Quang — Bản sắc thị giác

> **Tầng: spine.** File này thắng mọi mock, wireframe và bản import khi xung đột — kể cả
> `.working/directions-3.html` vốn đã sinh ra nó.
> Cách viết giao diện (component, alias, luật promote) nằm ở `specs/frontend-stack.md`.
> Hành vi, IA, luồng nằm ở `EXPERIENCE.md`.

## Brand & Style

Sản phẩm phải tạo được **một cảm xúc duy nhất: tự hào khi ở trong dòng họ.**

Tự hào ở đây không đến từ sự hoành tráng mà từ **hơi ấm gia truyền** — cảm giác lật một cuốn
phả cũ trong nhà thờ họ, chứ không phải cảm giác mở một trang web. Đó là lý do nền là giấy, mực
là nâu, và dấu son đỏ chỉ điểm vào những chỗ đã chốt.

Hai lực kéo ngược nhau, phải biết trước để cân:

- **Giọng chữ thì lạnh.** Microcopy không xưng hô (xem `EXPERIENCE.md § Voice and Tone`) — không
  bao giờ sai vai, nhưng cũng không bao giờ ấm. **Toàn bộ hơi ấm do tầng thị giác gánh**, cộng với
  việc giữ nguyên từ phả học. Đừng chờ câu chữ làm hộ.
- **Người đo chuẩn là bà bác ~70 tuổi ở quê**, không phải người trẻ thạo máy. Mọi lựa chọn thị
  giác thua cuộc trước tiêu chí đọc được.

Không làm: hiệu ứng bóng đổ nhiều lớp, gradient, glassmorphism, ảnh nền chụp sẵn, icon tròn màu
mè. Mỗi thứ đó đều kéo sản phẩm về phía "phần mềm" và rời xa "cuốn phả".

## Colors

| Vai | Hex | Dùng ở đâu |
|---|---|---|
| Giấy dó | `#F4ECD8` | Nền toàn màn |
| Ô nổi | `#FBF6E9` | Thẻ người, ô nội dung |
| Mực nâu | `#3A2F24` | Mọi chữ thân và tên người |
| Nhãn phụ | `#6F5F47` | Đời, chi, ngày, siêu dữ liệu — đổi 29/08/2026 (7-2): `#7D6C55` hụt sàn trên giấy dó (4.30), `#796952` hụt trên nền bàn B (4.42); giá trị này qua sàn ở cả ba nền |
| Viền giấy | `#DDD0B2` | Đường phân, viền ô chính thức |
| **Son** | `#A8322A` | **Khan hiếm** — xem dưới |
| Chàm mực | `#2E4B6B` | Cảnh báo, ghi chú của bot — xem dưới |
| Nền bàn duyệt | `#EDEAE4` | Nền bề mặt B — xem dưới |

### Son là màu khan hiếm

`#A8322A` mang **một nghĩa duy nhất: đã chốt.** Tầng chính thức, hành động chính, đề từ dòng họ.

Đây là ràng buộc ngữ nghĩa, không phải sở thích. Con dấu son trên phả giấy có sức nặng vì nó
hiếm; rải son lên mọi nút bấm là làm mất chính thứ đang mượn.

Hệ quả trực tiếp: **cảnh báo và lỗi không được dùng son.** Nếu lỗi cũng đỏ thì "đỏ" mất nghĩa.

### Cảnh báo là chàm mực, không phải đỏ

**Chốt 11/08/2026** — `#2E4B6B`. Thay bản tạm `#8A5A1E` (hổ phách sẫm), nay bỏ.

Hai lý do, lý do thứ hai mới là lý do chính:

1. Chàm nằm **ngoài trục đỏ–nâu** của cả bảng màu, nên không bao giờ bị đọc nhầm là son nhạt.
   Hổ phách thì cùng họ với mực nâu `#3A2F24` — trong một bảng dày, nó chìm.
2. Chàm đọc ra **"máy ghi chú"**, không phải **"nguy hiểm"**. Đó đúng là điều FR-48 đòi: *bot gợi
   ý, không tự gộp.* Một cảnh báo màu đỏ nói với người vận hành rằng có gì đó **hỏng**; ở đây
   không có gì hỏng — chỉ có một câu hỏi máy không tự trả lời được và đang chuyển cho người.

Cảnh báo vẫn **không được mã hoá chỉ bằng màu**: luôn kèm chữ nói rõ bot thấy gì, và kèm khối
nền `#E8EDF3` có viền trái đặc.

### Bề mặt B — khung trần, dữ liệu phả giữ chất liệu

**Chốt 11/08/2026.** Bàn duyệt **không** mặc giấy dó. Nền là xám ngà trung tính `#EDEAE4`, ô bảng
trắng `#FFFFFF`, viền `#D6D2CA`, chữ vỏ giao diện là **chữ không chân**.

Nhưng **mọi thứ là dữ liệu phả thì vẽ y hệt bề mặt A**: tên người dùng `serif-phả`, node tồn nghi
vẫn nét đứt + vân chéo, chip mức tin cậy giữ nguyên ba mức.

Lý do không phải thẩm mỹ mà là **tính đúng đắn**: bàn duyệt là nơi quyết định thứ sẽ hiện trên
phả. Nếu nó vẽ dữ liệu khác đi, người vận hành duyệt một thứ và người trong họ thấy một thứ
khác. Cái được phép khác là **khung** — thanh, bảng, nút — vì khung là đồ nghề của người vận
hành, không phải nội dung của dòng họ.

Ranh giới thực hành: nếu một pixel biểu diễn **một khẳng định về người thật**, nó theo luật bề
mặt A. Còn lại theo khung trần.

### Ba mức tin cậy không được mã hoá chỉ bằng màu

FR-2 nói ba mức *"hiện trên cây bằng màu"*. Chỉ dùng màu là **không đạt** — vừa hỏng với người mù
màu, vừa hỏng khi in ra giấy (FR-50 sau này đòi bản in tuân đúng luật riêng tư như màn hình).

Mã hoá chính là **chất liệu và nét viền**; màu là lớp phụ trợ:

| Mức | Viền | Nền | Chữ |
|---|---|---|---|
| chắc chắn | nét liền `#DDD0B2` | đặc `#FBF6E9` | `#3A2F24` |
| theo lời kể | nét liền `#C6B48F` | đặc `#FBF6E9` | `#3A2F24` |
| tồn nghi | **nét đứt** `#B09A72` | **vân chéo 135°** | `#3A2F24` |

Cả ba **cùng độ tương phản chữ**. Xem § Do's and Don'ts.

### Chế độ tối

Chưa quyết. `[NOTE FOR UX]` — bản sắc dựng trên ẩn dụ giấy, mà giấy thì không có bản tối tự
nhiên. Hoãn tới khi có người thật yêu cầu.

## Typography

Chữ có chân cho **tên người và tiêu đề** — tên trên phả cần sức nặng. Chữ không chân cho nhãn
phụ, số liệu, và vỏ giao diện.

**Sàn cỡ chữ là hàng rào cứng, không phải khuyến nghị:**

- Thân: **17px** (trên mặc định web một nấc)
- Tối thiểu tuyệt đối: **15px** — áp cho *mọi* chữ, kể cả caption, nhãn phụ, chú thích ảnh,
  chữ trong chip, chữ trong tooltip

Sàn này sinh trực tiếp từ điều đầu tiên người duyệt gạch đi: *"chữ nhỏ"*.

### Chọn họ chữ — chưa xong

`[ASSUMPTION]` Token `serif-phả` và `han-nom` mới là **chỗ dành sẵn**, chưa chốt font thật. Hai
ràng buộc phải kiểm trước khi chốt, và không được kiểm bằng mắt:

1. **Phủ đủ tiếng Việt** — Latin Extended Additional, đủ cả `ễ ộ ự ằ ỹ`. Nhiều font serif đẹp
   rơi dấu ở đúng những chữ này.
2. **Phủ Hán-Nôm** cho `光前裕後` và tên huý chữ Hán. Gần như chắc chắn phải là **font thứ hai**
   nạp riêng, không phải cùng một họ.

Việc kiểm này thuộc story hạ tầng, không phải việc của mắt người duyệt.

### Hán-Nôm luôn đi kèm phiên âm

NFR-9. Không có ngoại lệ, kể cả đề từ:

```
光前裕後
Quang tiền dụ hậu
```

Phiên âm ở cỡ caption (15px), màu nhãn phụ `#6F5F47`, ngay dưới. Chữ Hán đứng trần là lỗi.

## Layout & Spacing

Thừa kế thang Tailwind. Hai luật riêng:

- **Một câu hỏi một màn** trong luồng tự khai (FR-11). Đây là ràng buộc bố cục, không phải gợi ý.
- Vùng chạm tối thiểu **44×44px**. Người dùng đích có tay run.

## Elevation & Depth

**Không có đổ bóng.** Giấy nằm trên bàn, không lơ lửng. Phân tầng bằng **viền** và **sắc độ nền**
(`#F4ECD8` nền, `#FBF6E9` ô nổi). Dùng bóng là lập tức đọc thành "web app".

## Shapes

Bo góc vừa (`sm 6px · md 9px · lg 14px`) — mềm hơn góc vuông của bia, cứng hơn bo tròn của app
tiêu dùng. Ảnh chân dung bo cùng `md`, **không bao giờ bo tròn**: chân dung tròn là ngôn ngữ của
mạng xã hội.

## Components

### Node người trên cây

Thành phần quan trọng nhất của sản phẩm. Ba thứ luôn có mặt:

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   ← nét đứt = tồn nghi
│ Nguyễn Quang Hùng     │   ← serif 17px, mực nâu
│ đời 6 · chi Hai       │   ← sans 15px, nhãn phụ
│ cháu Khánh ghi · hôm nay │ ← ghi công, son
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

**Dòng ghi công là bắt buộc, không phải trang trí.** Nó lấy từ FR-39 (nhật ký sửa) và là cơ chế
tạo tự hào chính ở tầng dữ liệu: tên người đóng góp nằm **trên phả**, không chỉ trong nhật ký.

### Nút

Chính = nền son, chữ giấy. Phụ = viền `#C6B48F`, nền trong suốt. Không có nút thứ ba.

## Do's and Don'ts

**Do**

- Giữ nguyên từ phả học: *tồn nghi*, *theo lời kể*, *chắc chắn*, *Tầng chính thức*. Đây là từ
  thật của phả họ — dùng chúng là tôn trọng truyền thống, và là một nguồn tự hào.
- Kèm chú giải tại chỗ (chạm/di chuột) cho mỗi từ phả học, ngay lần đầu nó xuất hiện trên màn.
- Để dòng ghi công người đóng góp trên mọi node vừa được thêm.

**Don't**

- ❌ **Không bao giờ làm mờ node tồn nghi.** Không `opacity`, không chữ xám nhạt. PRD viết
  *"hiện mờ"* — spine này **ghi đè** chủ ý: khác **chất liệu**, không khác **độ đậm**. Lý do:
  người vừa đóng góp phải thấy công của mình đứng ngang hàng, không phải hạng hai. Làm mờ là giết
  đúng cảm xúc mà sản phẩm tồn tại để tạo ra.
- ❌ Không dùng son cho lỗi, cảnh báo, hay nút phụ.
- ❌ Không có chữ nào dưới 15px. Không có ngoại lệ "chỗ này chỉ là chú thích".
- ❌ Không hiện Hán-Nôm mà thiếu phiên âm.
- ❌ Không dùng thuật ngữ công nghệ trên bề mặt người trong họ: *sync*, *upload*, *validate*,
  *merge*, *node*. Bề mặt quản trị thì được — đó là màn của người vận hành.
