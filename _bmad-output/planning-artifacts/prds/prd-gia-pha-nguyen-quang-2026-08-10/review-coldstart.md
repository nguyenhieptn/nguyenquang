---
title: "Phản biện đối kháng — Giả định nền của PRD Gia phả Nguyễn Quang"
status: review
created: 2026-08-10
target: prd.md, addendum.md
angle: khởi động nguội / zero-data
---

# Phản biện: tấn công vào giả định nền

> Tài liệu này không cân bằng. Nhiệm vụ của nó là tìm chỗ vỡ. Những chỗ vững được ghi
> nhận trong một mục ngắn ở cuối, không nhắc lại nữa.

---

## PHÁN QUYẾT

**PRD này viết rất tốt về việc *quản trị* dữ liệu và gần như không viết gì về việc *tạo ra*
dữ liệu.** Nó tự nhận khởi động nguội là rủi ro số một ở §3, rồi ở §8.1 cắt MVP thành một
cơ sở dữ liệu được quản trị xuất sắc nhưng rỗng — cả ba đối sách chống khởi động nguội
đều nằm ngoài MVP hoặc vô hiệu về mặt logic khi cây trống. Nếu xây đúng như §8.1, sản
phẩm sẽ chạy hoàn hảo và không có gì trong đó.

---

## 1. Ba đối sách §3: hai cái không được đóng gói, một cái tự mâu thuẫn

PRD tuyên bố ba đối sách. Đối chiếu thẳng với §8.1:

| Đối sách §3 | FR gắn kèm | Có trong MVP §8.1? |
|---|---|---|
| Nhặt dữ liệu nơi nó đang nằm | FR-9, FR-10 | ❌ Không |
| Cho người ta kể chuyện | FR-8 | ❌ Không |
| Trả công tức thì | FR-13, FR-14 | ✅ Có — nhưng xem §2 dưới đây |

**Hai trong ba đối sách chống rủi ro số một không có phương tiện giao hàng ở bản ra mắt.**
Cái thứ ba có mặt nhưng trả về rỗng. Đây không phải chuyện xếp thứ tự backlog — đây là
việc PRD nhận diện đúng bệnh rồi để thuốc ngoài phòng bệnh.

### 1.1 "Đi nhặt nơi nó đang nằm" — nhầm nút thắt

FR-9 giải bài toán *trích xuất* từ sổ tang, bia mộ, giấy tờ cũ. Nút thắt thật không nằm ở
trích xuất. Nút thắt là: **cuốn sổ tang đang nằm trong tủ nhà một bà bác ở quê, và chưa ai
mở tủ đó.** Viết OCR không làm tủ mở ra. Chi phí thật của đối sách này là một chuyến về
quê, một buổi ngồi uống nước, và một người đủ vai vế để hỏi xin. Không dòng code nào
thay được việc đó, và PRD không có FR nào, không có metric nào, không có ai chịu trách
nhiệm cho việc đó.

Hệ quả: FR-9 là một cái phễu không có nguồn rót. Xây xong nó vẫn rỗng.

### 1.2 "Cho người ta kể chuyện" — PRD gộp *thu* và *bóc*, rồi hoãn cả hai

FR-8 gộp ba việc khác nhau về độ khó vào một FR: (a) ghi âm và lưu trữ, (b) bóc tách bằng
LLM thành khẳng định ứng viên, (c) neo từng khẳng định về đúng đoạn băng.

(b) và (c) khó. (a) **là một nút ghi âm và một cái bucket** — chưa tới một tuần làm.

Chính addendum §C tự viết: *"Đi ghi âm các cụ ngay từ bây giờ, bằng điện thoại, không chờ
FR-8 chạy."* Nếu điều đó đúng — và nó đúng — thì phải có chỗ để cái băng đó đi vào, có
metadata, có sao lưu theo NFR-1, ngay từ MVP. Hoãn (a) cùng với (b)(c) là **hoãn cái không
lấy lại được cùng với cái lúc nào làm cũng được.**

Cùng lỗi này lặp lại ở FR-46 (cửa sổ 49 ngày). PRD tự viết ở §8.2 rằng đây là *"cơ hội
không lặp lại"* rồi vẫn đặt nó ngoài MVP. Phiên bản tối thiểu của FR-46 là **một trang có
ô nhập text và nút tải ảnh** — vài ngày làm. Nếu trong họ có tang sự ở tháng thứ hai, mất
hẳn một chương, đổi lấy việc tiết kiệm vài ngày cho một dự án *không có deadline*. Đây là
một quyết định đánh đổi tồi rõ ràng và PRD tự đưa ra đủ dữ kiện để thấy điều đó.

> **Nguyên tắc bị bỏ sót:** tách *thu nhận* khỏi *xử lý*. Thu nhận phải có mặt ngày đầu và
> phải xấu xí cũng được. Xử lý hoãn được vô thời hạn vì dữ liệu thô không hỏng.

### 1.3 "Trả công tức thì" — phần thưởng đặt ngược đường cong

FR-13 thưởng cho người đóng góp *biên*, không thưởng cho người *tiên phong*. Giá trị của
"đường về Tổ" tỷ lệ với độ dày của cây. Nghĩa là: **người thứ 300 được trải nghiệm tốt
nhất; 30 người đầu — đúng những người khó thuyết phục nhất và quyết định sống chết — được
trải nghiệm tệ nhất.** Động lực được phân phối ngược hoàn toàn so với nhu cầu.

PRD không có bất kỳ cơ chế nào bù cho 30 người đầu.

---

## 2. Bốn vòng tròn logic

Câu hỏi về FR-13 trong đề bài đúng, nhưng nó không phải một lỗi đơn lẻ. Có **bốn** vòng
tròn cùng dạng, và chúng cùng một gốc.

### C1 — FR-13: phần thưởng cần tổ tiên, tổ tiên cần người đóng góp

Người thứ nhất tự khai xong. Hệ thống hiển thị:
- **Đường về Tổ:** một node. Chính họ. Không có đường.
- **Mã gia phả `1.3.2.7`:** không tính được. Mã chi đòi hỏi biết mình thuộc chi nào, mà
  cấu trúc chi chưa tồn tại. Số thứ tự đời đòi hỏi biết đời 1 là ai.
- **Vị trí trên cây:** một chấm giữa nền trắng.

Nặng hơn: **họ Nguyễn Quang chưa biết cụ Thủy tổ là ai.** §4 định nghĩa Thủy tổ là "cụ tổ
đầu tiên *được ghi nhận*" — nhưng chưa có gì được ghi nhận cả. Toàn bộ hệ ký hiệu của sản
phẩm (đời, mã chi `1.3.2`, FR-16 "từ tôi ngược về Tổ", FR-34 Tộc Sử cá nhân hóa) neo vào
một node gốc **chưa tồn tại và có thể không bao giờ xác định được**. PRD chưa hề đặt câu
hỏi "nếu không ai biết đời 1 là ai thì đánh số kiểu gì".

### C2 — Tiêu chí ra mắt §8.1 tự chặn chính nó

> *"Cây đủ dày để bất kỳ ai trong họ mở lên cũng tìm thấy chính mình."*

Đó là **mục tiêu cuối cùng của dự án đang được dùng làm điều kiện vào cửa**. Muốn ai mở
lên cũng thấy mình thì phải nhập gần hết dòng họ; muốn nhập gần hết dòng họ thì phải có
người đóng góp; muốn có người đóng góp thì phải ra mắt. Điều kiện ra mắt không thể đạt
được trước khi ra mắt. Nếu đạt được rồi thì không còn bài toán khởi động nguội để giải.

M1 (≥80% tìm thấy chính mình) là cùng một chỉ tiêu, cùng một vòng tròn.

### C3 — M1 cần mẫu số không tồn tại

"80% người trong họ" cần biết **số người trong họ là bao nhiêu**. Danh sách đó chính là
sản phẩm. Chỉ số chính của dự án không đo được cho tới khi dự án đã thành công. M2
("≥3 chi") mắc đúng lỗi này: chưa có phàm lệ, chưa có cấu trúc chi, chưa đếm được chi.

### C4 — Xác thực thành viên cần chính cái phả

FR-3 nói *"bất kỳ ai **đã xác thực**"*; FR-36 chia vai theo chi; FR-37 tính riêng tư theo
bậc quan hệ. Ba thứ này đều cần biết người đang đăng nhập là ai trong họ. Cách kiểm chứng
tự nhiên là tra phả. Phả rỗng. Đồng thời FR-11 lại yêu cầu *"không đăng nhập phức tạp ở
bước đầu"*. PRD chưa quyết ai là người gác cửa ở giai đoạn không có cửa.

### Gốc chung và lối thoát

Cả bốn vòng tròn tan biến nếu tồn tại **một danh sách người trong họ, dựng ngoài phần
mềm, trước phần mềm**: mỗi chi một tờ danh sách tên + năm sinh + con của ai, thu ở giỗ họ,
gõ vào một bảng tính. Vài trăm dòng. Không cần code.

**Vật phẩm đầu tiên của dự án này không phải là code — là cái bảng tính đó.** Và việc đầu
tiên của phần mềm là làm một cái bảng tính tốt hơn. PRD hiện coi đây là "gieo mồi" phụ trợ
trong addendum §C; thực chất nó là **điều kiện tồn tại của toàn bộ §8.1**.

---

## 3. Lỗ hổng schema: cây có gốc vs. rừng rời rạc *(đắt nhất nếu phát hiện muộn)*

Đây là phát hiện nghiêm trọng nhất về mặt kỹ thuật và PRD hoàn toàn không nhìn thấy.

§5.1 tự lập luận đúng rằng nền dữ liệu phải đúng ngay từ đầu vì "thêm sau = đập bảng làm
lại". Nhưng nó bỏ sót một tính chất nền:

**Thu thập từ trên xuống (số hóa một cuốn phả có sẵn) sinh ra một cây liên thông có gốc.
Thu thập từ dưới lên (mỗi người tự khai từ trí nhớ) sinh ra một RỪNG — nhiều mảnh rời
nhau, không mảnh nào chạm gốc.**

PRD giả định mô hình thứ nhất trong khi bối cảnh bắt buộc mô hình thứ hai. Hệ quả dây
chuyền, tất cả đều nằm trong hoặc sát MVP:

| Tính năng | Vỡ thế nào khi đồ thị rời rạc |
|---|---|
| Mã chi `1.3.2`, số đời | Không tính được cho mảnh chưa nối về gốc. Không có nhãn nào để hiển thị |
| FR-16 "từ tôi ngược về Tổ" | Không có đường. Điều hướng mặc định của sản phẩm không chạy |
| FR-13 trả công | Rỗng (C1) |
| FR-19 xưng hô qua QR | **Không có đường quan hệ ⇒ không trả lời được.** Đây là màn demo ra mắt tại giỗ Tổ (addendum §C giai đoạn 2). Hai người bất kỳ ở hai mảnh khác nhau ⇒ demo im lặng trước mặt cả họ |
| FR-37 riêng tư theo bán kính | Người mới, chưa nối ⇒ bán kính = vô cực với mọi người ⇒ **họ không thấy gì cả.** Mô hình riêng tư chủ động chống lại khởi động nguội |
| FR-42 Đèn Chi, FR-44 nợ theo chi | Không gán được người vào chi ⇒ không đèn, không bảng |

Và thứ thiếu hẳn, không có FR nào:

**FR còn thiếu — Hợp nhất trùng lặp (entity resolution / merge).** Khi chi 2 và chi 5 cùng
khai một cụ với hai cách viết tên, hai năm sinh lệch nhau, đó là **cách duy nhất hai mảnh
rừng nối được với nhau**. Merge là thao tác quyết định sống chết của mô hình dưới-lên, và
nó là thao tác *khó nhất* trong hệ có nguồn gốc: phải viết lại khẳng định, giữ cả hai chuỗi
nguồn, hòa hai lịch sử tu chỉnh, xử lý quyền của hai chi, và **phải tách lại được** khi
merge sai. Thêm nó sau đúng nghĩa "đập bảng làm lại" — chính là điều §5.1 cảnh báo, cho
một tính năng §5.1 quên mất.

Đi kèm là *tách* (split) khi phát hiện hai người bị nhập làm một, và *nối mảnh* (graft) khi
tìm ra khớp nối giữa hai nhánh rời.

Kiến nghị tối thiểu:
- Schema phải có khái niệm **thành phần liên thông** và chấp nhận node không có gốc.
- Đời và mã chi là **thuộc tính suy ra, có thể chưa xác định**, không phải khóa định danh.
- Mọi tính năng cần đường đi phải có hành vi được định nghĩa cho trường hợp "không có
  đường" — hiện chưa cái nào có.
- Merge/split vào §5.1, không vào backlog.

---

## 4. Người thứ nhất, thứ hai, thứ ba — vòng lặp không khép

### Người thứ nhất: Hiệp. Không phải người dùng — là tác giả.

Việc Hiệp tự nhập 2–3 đời (§10, addendum §C) không chứng minh gì về sản phẩm. Tệ hơn: nó
tạo một tác dụng phụ chưa ai nhắc tới.

**Mồi do một người nhập là mồi của một nhánh.** Sau bước gieo mồi, cây chứa: gia đình
Hiệp, tổ tiên trực hệ của Hiệp, họ hàng gần của Hiệp. Người chi khác mở lên, quét mắt một
lượt, không thấy ai quen — và kết luận đúng theo trực giác: *"đây là web nhà thằng Hiệp."*
Đó chính xác là nhận thức mà addendum §C giai đoạn 0 tồn tại để ngăn chặn. **Chiến lược
gieo mồi đang phá hoại chiến lược danh chính ngôn thuận, và PRD không thấy xung đột này.**

Sửa: mồi phải **rộng và nông** (mỗi chi vài chục cái tên), không **hẹp và sâu** (một nhánh
đủ 3 đời). Mồi rộng cần nhiều người đi thu — tức lại quay về việc offline ở §2.

### Người thứ hai: người chi khác. Rơi ngay ở màn hình 2.

UJ-2 viết: *"Gõ tên bố. Hệ thống tìm ra ông, hỏi 'Đúng bố chị không?'. Đúng."*

**UJ-2 chỉ mô tả trường hợp tìm thấy.** Với dòng họ chưa có dữ liệu, trường hợp mặc định ở
giai đoạn đầu là *không tìm thấy*. PRD không thiết kế nhánh đó ở bất kỳ đâu. Người thứ hai
nhận được:

- Không tìm thấy bố → không có gì để bám vào.
- Nếu cho tạo node trôi nổi → FR-13 không có gì để trả (C1).
- FR-14 "cả họ nhận tin, nhánh mới sáng lên" → *cả họ* là ai? Danh sách nhận tin rỗng, và
  không có kênh gửi (xem §6). Node sáng lên trước không ai.
- FR-37 → chưa nối vào ai ⇒ nhìn đâu cũng bị che.

Tổng kết trải nghiệm người thứ hai: **điền một cái form, không nhận lại gì, không ai biết
mình đã điền.** Đó là định nghĩa của một vòng lặp âm.

### Người thứ ba trở đi: giống người thứ hai, cộng thêm một node lạ.

### Vòng lặp có tự khép không? Không, và lý do là toán học.

Giá trị nhận được tăng theo **mật độ** của cây (siêu tuyến tính: một người có ý nghĩa khi
xung quanh họ có người khác). Chi phí đóng góp là **hằng số** (vẫn là 3 phút, vẫn là ngần
ấy câu hỏi). Dưới một ngưỡng mật độ tới hạn, giá trị < chi phí, vòng lặp âm và tự tắt.
PRD không hề ước lượng ngưỡng đó, không đo nó, và MVP không có cơ chế nào đưa hệ vượt qua
nó — vì cơ chế duy nhất trong MVP là chính cái vòng lặp âm đó.

**Vòng lặp thật sự khép được trong bối cảnh này là vòng lặp offline:** một người có vai vế
đứng ở giỗ họ, chỉ vào tấm bạt in cây phả, và mọi người xúm vào điền tên bằng bút dạ. Cơ
chế đó nằm trong addendum §C "Chiến thuật $0" — **ngoài PRD, không có FR, không có ai chịu
trách nhiệm, không có thước đo, và bị gọi là 'chiến thuật', tức phụ trợ.**

Nghịch lý trung tâm của tài liệu này: **thứ có xác suất làm dữ liệu chảy cao nhất là thứ
PRD không sở hữu.** Nếu tấm bạt và tờ A5 mới là động cơ, thì phần mềm ở giai đoạn 1 nên
được đặc tả như *thiết bị ngoại vi của tấm bạt* — in ra được, nhập lại từ ảnh chụp được,
theo dõi được tờ nào đã thu về. Đó là một MVP khác hẳn §8.1.

---

## 5. MVP §8.1 vẫn quá to, và to sai chỗ

Đếm: 15 FR + 5 NFR. Với một người code. Trong đó có những thứ đắt bị đánh giá thấp:

- **FR-5 "xem cây như tại thời điểm X"** — truy vấn theo thời gian trên đồ thị có phiên
  bản. Đây là một trong những thứ khó nhất trong danh sách, và ở tháng đầu nó cho phép
  xem lại một quá khứ dài hai tuần.
- **FR-37 riêng tư theo bán kính họ hàng** — tính bậc quan hệ giữa người xem và từng node,
  cho mọi lần render cây. Vừa tốn kém, vừa cần đồ thị liên thông (§3), vừa cần phàm lệ
  chưa chốt (Q10).
- **FR-3 hai tầng + FR-2 ba mức + FR-39 nhật ký + FR-36 vai theo chi** — bốn hệ thống
  quyền/trạng thái đan nhau.

Nhưng khuyết điểm lớn hơn độ to là **thành phần**: rà lại danh sách §8.1, **không FR nào
tạo ra dữ liệu ngoài form tự khai.** FR-1,2,3,5 quản trị dữ liệu. FR-7 quy định dữ liệu.
FR-36–39 giấu dữ liệu. FR-15,16 hiển thị dữ liệu. FR-12,13,14 phụ thuộc dữ liệu đã có.
Toàn bộ MVP là hạ tầng chất lượng cho một cái kho rỗng.

### Đề nghị cắt lại

**Đưa vào (rẻ, chống mất mát vĩnh viễn, tạo dữ liệu):**
- **Thu nhận thô**: tải lên file ghi âm và ảnh, gắn nhãn tự do, gắn với người nếu có,
  không cần bóc tách gì. Đây là FR-8(a) và FR-9(a) tách ra. ~1 tuần.
- **Trang tưởng niệm tối giản** (FR-46 rút gọn: ô text + ảnh). ~3 ngày. Cơ hội không lặp.
- **Nhập hàng loạt từ bảng tính / danh sách gõ nhanh** cho người vận hành — vì §2 đã chỉ
  ra dữ liệu đầu tiên đến từ giấy, không đến từ form tự khai.
- **In ra được**: xuất một tờ A5/A3 danh sách hoặc cây theo chi để mang đi giỗ họ, và
  đường nhập ngược lại. Nối phần mềm vào vòng lặp offline vốn là vòng lặp thật.

**Đẩy ra:**
- FR-5 (giữ append-only event log ở tầng dữ liệu, bỏ giao diện xem-lại-quá-khứ).
- FR-37/38 → thay tạm bằng quy tắc thô: thành viên đã xác thực thấy tên + đời + quan hệ
  của người sống; số điện thoại, địa chỉ, ngày sinh đầy đủ ẩn với tất cả trừ chính chủ và
  người vận hành. Không tính bán kính. Chờ Q10.
- FR-12 (đa danh xưng) — chỉ có giá trị khi cây đủ lớn để tìm kiếm là vấn đề.
- FR-14 (thông báo) — chưa có kênh gửi (xem §6), giữ lại cũng không chạy.

**Giữ nguyên, không tranh cãi:** FR-1, FR-2, FR-3, NFR-1, NFR-3, NFR-5, NFR-7, NFR-9.
Lập luận §5.1 về việc không thể lắp nguồn-gốc vào sau là đúng.

---

## 6. Thiếu tầng truyền tải — FR-14 không giao được

Addendum §C giai đoạn 3 viết: *"Lịch giỗ qua **Zalo OA của dòng họ** — kênh phân phối
chính, thay app."* Nếu câu đó đúng thì:

- Zalo là **động mạch** của sản phẩm này. Web chỉ là nơi người ta ghé qua một lần.
- **Không có FR nào sở hữu Zalo.** Không có FR nào sở hữu bất kỳ kênh đi-ra nào.
- FR-14 ("người mới vào phả → cả họ nhận tin") **không thực thi được như đã đặc tả**. Web
  push không hoạt động với nhóm 60+; email không tồn tại trong tệp người dùng này; SMS
  tốn tiền và cần danh bạ — mà danh bạ chưa có (C3).
- FR-28/FR-29 (nhiệm vụ in giấy) cũng là một kênh phân phối vật lý không có FR quản lý
  vòng đời "đã in → đã phát cho ai → đã thu về chưa".

Một sản phẩm mà mọi kênh tiếp cận người dùng đều nằm ngoài đặc tả thì mọi cơ chế kéo
người quay lại (F9 nhịp sống) đều là giả định trên giấy. **Đề nghị: một FR "Kênh ra" —
định nghĩa danh bạ liên lạc, kênh ưu tiên theo người, và hàng đợi gửi. Vào MVP hoặc ngay
sau.**

---

## 7. Đồng thuận và cấm vận cho băng ghi âm — lỗ hổng chưa ai nhìn thấy

Đây là kịch bản thất bại PRD hoàn toàn không thấy, và nó có thể giết dự án trong một buổi
chiều.

Dữ liệu quý nhất trong trí nhớ các cụ **chính là dữ liệu nhạy cảm nhất**: vợ lẽ, con ngoài
giá thú, con nuôi không được thừa nhận, người bị khai trừ khỏi họ, ai chiếm đất hương hỏa,
ai không về chịu tang, hai chi từ mặt nhau vì chuyện gì. Đó không phải nhiễu — đó là phần
lịch sử dòng họ duy nhất chỉ các cụ biết, và là phần các cụ sẽ kể ra khi máy đang chạy vì
đang kể chuyện chứ không đang điền form.

PRD nói (FR-8, NFR-1): **băng gốc luôn được giữ, không xóa.** Không có một dòng nào về:

- **Đồng thuận ghi âm.** Cụ có biết cuộn băng này sẽ được lưu vĩnh viễn và nghe lại được
  không? Cụ đồng ý với ai nghe?
- **Ai được nghe băng gốc.** FR-37 phủ riêng tư lên *node người sống*, không phủ lên
  *media*. Một cuộn băng 6 phút có thể chứa thông tin về mười người sống.
- **Cấm vận có thời hạn** (niêm phong tới khi người liên quan mất, hoặc N năm).
- **Quyền rút lại** của người kể hoặc gia đình họ.
- **Đường gỡ khẩn cấp**: FR-3 cho phép *bất kỳ ai đã xác thực ghi vào Kho tồn nghi ngay,
  không chờ duyệt, hiện mờ trên cây*. Nghĩa là một người có thể công bố một khẳng định
  xúc phạm về một người đã khuất có tên có tuổi, và nó **hiện ra ngay**. Kho tồn nghi là
  một kênh xuất bản không kiểm duyệt bên trong một dòng họ. Không có nút gỡ, không có
  quy trình khiếu nại, không có thời hạn phản hồi.

Một sự cố loại này — một cụ nghe con cháu đọc lại lời mình trên web, hoặc một gia đình
thấy điều xấu về bố mình hiển thị mờ trên cây — không gây bug. Nó gây **rút lui tập thể
của cả một chi**, và không có bản vá nào cứu được.

Đề nghị bổ sung, mức FR, trước khi bật FR-8 và trước khi mở FR-3 cho công chúng nội tộc:
- Trạng thái media: `công khai trong họ` / `hạn chế người vận hành` / `niêm phong tới ngày X`.
- Đồng thuận ghi âm ghi nhận được (ai đồng ý, ai chứng kiến, phạm vi).
- Quy trình gỡ trong 24h theo yêu cầu của thân nhân trực hệ, có ghi vết.

Đối chiếu thêm: xuất bản ngày sinh đầy đủ, địa chỉ, thông tin trẻ vị thành niên của người
sống — NĐ 13/2023 về bảo vệ dữ liệu cá nhân. PRD xử lý việc này như một giá trị mặc định
UX (FR-38), không như một nghĩa vụ đồng thuận. Mức trung bình, nhưng nên ghi nhận.

---

## 8. Các tính năng phụ thuộc mật độ đều đảo dấu ở t=0

Một nhóm cơ chế được thiết kế cho trạng thái đầy, và ở trạng thái rỗng chúng không chỉ vô
dụng — chúng **phát tín hiệu ngược lại điều mong muốn**:

| FR | Ở trạng thái đầy | Ở ngày ra mắt |
|---|---|---|
| FR-17 cây bằng khuôn mặt, ai chưa có ảnh hiện bóng xám ("áp lực xã hội") | Vài bóng xám lạc lõng → có người đi tìm ảnh | **100% bóng xám.** Cây trông như một nghĩa trang người vô danh. Không còn là áp lực, chỉ còn là sự trống rỗng |
| FR-42 Đèn Chi | Vài đèn mờ → chi đó bị nhắc | **Toàn bộ đèn tắt.** Trang chủ tuyên bố dòng họ đã chết |
| FR-44 Bảng nợ dữ liệu theo chi | Chỉ ra chi tụt hậu | **Mọi chi nợ 100%.** Cơ chế xấu hổ bắn vào tất cả cùng lúc ⇒ mất hết ý nghĩa phân biệt, chỉ còn cảm giác vô vọng |
| FR-43 cảnh báo chi nguội 6 tháng | Tín hiệu thật | Bắn đồng loạt vào tháng thứ 6 cho mọi chi |

PRD không có **thiết kế trạng thái rỗng** ở bất kỳ đâu. Với một sản phẩm mà tiền đề là
"ngày ra mắt cây trống rỗng", đó là một thiếu sót thẳng vào trọng tâm. Mỗi màn hình cần
đặc tả nó nói gì khi chưa có gì — và câu trả lời tốt hầu như luôn là *biến chỗ trống thành
lời mời cụ thể cho đúng người đang đứng đó*, không phải hiển thị một chỉ số bằng không.

---

## 9. Thước đo §9 không đo thứ quyết định sống chết

### 9.1 Cái đang đo

- **M1, M2, M4, M5 đều là chỉ số trễ**, mốc 12 tháng / 90 ngày. Khởi động nguội được quyết
  định trong **tuần 1 đến tuần 6**. Không có chỉ số nào đọc được ở ngày thứ 30.
- **M1 và M2 không đo được** vì thiếu mẫu số (C3).
- **Không có tiêu chí dừng.** Dự án không deadline, không kill criterion ⇒ không có trạng
  thái nào là thất bại ⇒ nó không thể học được điều gì. Đây là công thức của một dự án cá
  nhân chết ở mức 70% sau hai năm.
- **M3 (20 giờ ghi âm) là chỉ số duy nhất tốt trong bảng**: đo đúng tài nguyên đang mất
  đi, đo được từ ngày đầu, và **không cần một dòng code nào**. Chính vì thế nó phải là M1,
  và phải có mốc theo tháng, không theo năm.

### 9.2 Cái không đo mà phải đo

| Chỉ số đề nghị | Vì sao |
|---|---|
| **Hệ số vòng lặp**: một người mới đăng ký kéo theo trung bình bao nhiêu người mới trong 14 ngày | Đây là **con số duy nhất trả lời câu "vòng lặp có tự khép không"**. < 1 kéo dài ⇒ sản phẩm không tự chạy, mọi tăng trưởng là do Hiệp đẩy. PRD không có gì tương đương |
| **Tỷ lệ node do Hiệp tạo** | > 70% sau 6 tháng ⇒ đây là web cá nhân, không phải nền tảng dòng họ. Đây nên là **tiêu chí dừng**, không phải chỉ số theo dõi |
| **Tỷ lệ node nằm ngoài thành phần liên thông lớn nhất** | Đo trực tiếp bệnh ở §3. Cao ⇒ đang tích lũy các mảnh rời không bao giờ nối được |
| **Tỷ lệ người đóng góp quay lại lần thứ hai** | Đóng góp một lần rồi biến mất = không có sản phẩm, chỉ có một chiến dịch |
| **Đồng hồ đếm ngược**: số cụ trên 80 tuổi còn sống **chưa được ghi âm** | Đây là ràng buộc §3.2 chuyển thành số. Nó nên nằm trên trang chủ của dự án, không nằm trong bảng phụ lục. Nó cũng là thứ duy nhất tạo áp lực thời gian cho một dự án không deadline |
| **Số cuốn sổ / tấm ảnh cũ đã chụp lại**, đếm bằng tay | Đo đối sách 1 của §3, hiện không đo gì |

### 9.3 Chỉ số ngược

C1–C5 đúng nhưng đều là chỉ số của **giai đoạn có dữ liệu**. C4 (>50% bỏ giữa chừng) ở
tháng đầu có mẫu số 6 người — vô nghĩa thống kê. Thiếu hẳn chỉ số ngược của giai đoạn
rỗng: *bao nhiêu người mở web rồi rời đi mà không tạo được gì vì không tìm thấy ai để bám
vào* — đó mới là chế độ hỏng chủ đạo của 6 tháng đầu.

---

## 10. Kịch bản thất bại PRD chưa nhìn thấy

Ngoài các mục trên, sáu kịch bản không có mặt trong §10:

**T1 — Trùng lặp không hợp nhất được.** Sau một chiến dịch giỗ họ, cây có ba "cụ Nguyễn
Quang Đạo" là cùng một người. Không có công cụ merge (§3). Người vận hành phải sửa tay,
nản, dừng. Cây mất tin cậy vĩnh viễn vì không ai biết bản nào là bản thật. **Mức: cao.**

**T2 — Phả trở thành vũ khí trong tranh chấp thật.** Thứ bậc trưởng nam, quyền cúng giỗ,
đất hương hỏa — trong nhiều dòng họ Việt đây là tranh chấp có tiền và có kiện tụng. Cuốn
phả là chứng cứ. Khi phả lên web và ai cũng ghi được, **hệ thống trở thành sân tranh
chấp**, và người vận hành trở thành bên bị lôi vào. FR-6 xử lý bất đồng như một sự kiện
chất lượng dữ liệu ("hệ thống trình bày, không phân xử") — điều đó đúng về nguyên tắc và
vô dụng khi hai chi thật sự cạch mặt nhau. PRD **không có mô hình người dùng đối kháng**:
người cố tình khai sai để củng cố một yêu sách. **Mức: cao. Xác suất trong dòng họ đông
đảo: không thấp.**

**T3 — Đóng băng sớm.** Addendum §C giai đoạn 2 đề xuất đặt bản in thử lên bàn thờ. Với
các cụ, giấy in là thẩm quyền. Một bản in ra đời từ dữ liệu thu vội, thiếu và sai, đặt
trên bàn thờ, sẽ **trở thành bản chuẩn** mà mọi bản sửa sau đều phải chống lại. PRD coi
in ấn là phần thưởng; nó cũng là cơ chế đóng băng lỗi. Cần nhãn "bản thảo" cực rõ và FR-35
(QR phiên bản) phải có mặt **trước** bản in đầu tiên, không phải sau.

**T4 — Thành công giết người vận hành.** Sau giỗ Tổ, 400 người vào trong hai tuần. FR-4
(đồng thuận 3-người/2-chi) không cứu được vì ở giai đoạn đó chưa đủ người ở đủ chi để
tạo đồng thuận; mọi thứ dồn về Hiệp. C1 phát hiện được nhưng PRD không có phương án dự
phòng. **Mức: trung bình-cao.**

**T5 — Hiệp cạn động lực.** §10 coi Hiệp là điểm chết đơn về *vận hành*, không về *động
lực*. Không deadline + một người + phạm vi rộng + không ai chờ = mô hình chuẩn của dự án
chết trước khi ra mắt. Ràng buộc thời gian duy nhất có thật (các cụ đang mất dần) là ràng
buộc *ngoại sinh*, không tạo áp lực lên lịch code. Mâu thuẫn trực tiếp: **§8 nói "không
deadline cứng", addendum §C nói ra mắt tại giỗ Tổ.** Giỗ Tổ là deadline duy nhất trong dự
án này mà cả dòng họ đều tuân theo. Vứt nó đi là vứt đi thứ đắt nhất. **Đề nghị: chốt giỗ
Tổ gần nhất làm mốc cứng, cắt phạm vi cho vừa mốc đó, không cắt mốc cho vừa phạm vi.**

**T6 — Q10 chặn MVP, PRD nói là không chặn.** §12 khẳng định *"hai việc còn lại không chặn
viết code"*. Nhưng §8.1 đưa **FR-7 (trang phàm lệ), FR-37, FR-38 vào MVP** — cả ba là hàm
số trực tiếp của phàm lệ (ai vào phả, người sống hiển thị tới đâu). Không chốt Q10 thì
FR-7 rỗng nội dung và FR-37/38 không có quy tắc để cài. **PRD tự mâu thuẫn giữa §8.1 và
§12.** Hoặc bỏ ba FR đó khỏi MVP, hoặc thừa nhận Q10 là chặn.

---

## 11. Đề xuất thay thế: thử nghiệm không cần code, có tiêu chí dừng

Giả định nền của toàn bộ PRD là: *dữ liệu sẽ xuất hiện do người trong họ tự nhập và các cụ
kể lại.* Giả định đó **chưa từng được kiểm chứng**, và toàn bộ §8.1 là một khoản đầu tư
nhiều tháng đặt cược vào nó.

Có cách kiểm chứng nó trong **một buổi chiều, chi phí gần bằng không**:

1. Một kỳ giỗ họ (hoặc một buổi tụ họp bất kỳ). Mang theo: một tấm bạt in cây phả khung
   trống, bút dạ, một cái điện thoại.
2. Xin danh sách tên từng chi lên bạt.
3. Ghi âm hai cụ, mỗi cụ 20 phút.
4. Mượn về chụp lại bất kỳ sổ tang / gia phả viết tay / ảnh cũ nào có.

**Tiêu chí đọc kết quả:**
- Thu được ≥ 150 cái tên có quan hệ rõ, ≥ 2 giờ băng, ≥ 1 nguồn giấy → giả định nền đúng,
  và **bạn vừa có luôn dữ liệu mồi rộng giải quyết C1–C4**. Xây tiếp, MVP theo §5.
- Thu được vài chục tên, không ai muốn kể, không ai đưa giấy tờ → **không phần mềm nào cứu
  được điều này.** Vấn đề là xã hội, không phải công cụ. Phải giải quyết ở Ban tu phả và
  ở vai vế người đi hỏi trước, và mọi tháng code trước khi giải xong là tháng lãng phí.

Đây là thứ nên nằm ở đầu §8, trước bảng MVP. Một PRD nhận diện đúng rằng rủi ro số một là
"dữ liệu có xuất hiện không" mà không có thí nghiệm nào kiểm chứng điều đó là một PRD đang
đi thẳng vào canh bạc lớn nhất mà không đặt cược thử.

---

## 12. Những chỗ vững — ghi nhận, không bàn thêm

- **§5.1 (FR-1/2/3): đúng, và đúng ở chỗ khó.** Lập luận "khẳng định-có-nguồn không lắp
  được vào sau" là chính xác. Giữ nguyên trong MVP.
- **NFR-1 và NFR-2.** Yêu cầu diễn tập khôi phục và sao lưu phân tán về 5 người ở 5 nơi là
  bản năng đúng cho loại dữ liệu này.
- **NFR-6 như ràng buộc kiến trúc, không phải lời nhắc trong prompt** (addendum §A.5). Đúng.
- **Loại nhận diện khuôn mặt, giả giọng, persona tổ tiên.** Đúng cả về đạo lý lẫn về việc
  bảo vệ uy tín trước các cụ.
- **Nhận ra một nhịp tim là một điểm chết đơn** và tách F9 thành bốn cơ chế. Đúng — dù cả
  bốn đều phụ thuộc mật độ (§8).
- **Chẩn đoán FR-46 là cơ hội không lặp lại.** Chẩn đoán đúng; kết luận phạm vi sai.
- **NFR-7 (phân vùng đa dòng họ từ schema).** Rẻ bây giờ, đắt sau. Đúng.

---

## 13. Bảng phát hiện

| # | Phát hiện | Mức | Vị trí |
|---|---|---|---|
| P1 | MVP không chứa cơ chế thu dữ liệu nào; 2/3 đối sách §3 nằm ngoài MVP, cái còn lại vô hiệu khi cây rỗng | **Nghiêm trọng** | §8.1 vs §3 |
| P2 | Bốn vòng tròn logic: FR-13, tiêu chí ra mắt, M1, xác thực thành viên | **Nghiêm trọng** | FR-13, §8.1, §9, FR-3/36 |
| P3 | Schema giả định cây có gốc; thu từ dưới lên sinh rừng rời rạc. Thiếu hẳn merge/split/graft | **Nghiêm trọng** | §5.1, FR-16/19/37 |
| P4 | Không có mô hình đồng thuận, cấm vận, và gỡ bỏ cho băng ghi âm & Kho tồn nghi mở | **Cao** | FR-8, FR-3, NFR-1 |
| P5 | Không có tầng truyền tải; FR-14 và toàn bộ F9 không giao được | **Cao** | FR-14, addendum §C |
| P6 | Thước đo không đo hệ số vòng lặp, không có tiêu chí dừng, M1/M2 không đo được | **Cao** | §9 |
| P7 | Các tính năng phụ thuộc mật độ đảo dấu ở t=0; không có thiết kế trạng thái rỗng | **Cao** | FR-17, FR-42, FR-43, FR-44 |
| P8 | Mồi do một người nhập tạo thiên lệch một nhánh, củng cố nhận thức "web cá nhân" | **Trung bình-cao** | §10, addendum §C |
| P9 | Mâu thuẫn nội bộ: §12 nói Q10 không chặn code, §8.1 lại đưa FR-7/37/38 vào MVP | **Trung bình** | §8.1 vs §12 |
| P10 | Mâu thuẫn nội bộ: §8 "không deadline cứng" vs addendum §C "ra mắt tại giỗ Tổ" | **Trung bình** | §8 vs addendum §C |
| P11 | Bản in sớm đóng băng dữ liệu sai thành bản chuẩn; FR-35 phải có trước bản in đầu | **Trung bình** | addendum §C giai đoạn 2 |
| P12 | Không có mô hình người dùng đối kháng (khai sai để củng cố yêu sách thừa kế/thứ bậc) | **Trung bình-cao** | FR-6, §10 |
| P13 | Chưa có thí nghiệm không-code nào kiểm chứng giả định nền, dù đó là canh bạc lớn nhất | **Cao** | §8, §10 |

---

## 14. Ba việc đề nghị làm trước khi viết dòng code đầu tiên

1. **Chạy thí nghiệm §11 ở kỳ tụ họp gần nhất.** Nó vừa kiểm chứng giả định nền vừa sản
   xuất ra dữ liệu mồi rộng — thứ giải tan cả bốn vòng tròn ở §2.
2. **Chốt giỗ Tổ gần nhất làm mốc cứng**, rồi cắt §8.1 cho vừa mốc đó theo hướng ở §5:
   bỏ FR-5, hạ FR-37/38 xuống quy tắc thô, thêm thu-nhận-thô + trang tưởng niệm + in/nhập
   giấy.
3. **Bổ sung vào §5.1 trước khi thiết kế schema:** thành phần liên thông rời rạc, đời/mã
   chi là thuộc tính suy ra có thể chưa xác định, và merge/split có thể hoàn tác. Đây là
   thứ duy nhất trong tài liệu này mà phát hiện muộn đồng nghĩa viết lại từ đầu.
