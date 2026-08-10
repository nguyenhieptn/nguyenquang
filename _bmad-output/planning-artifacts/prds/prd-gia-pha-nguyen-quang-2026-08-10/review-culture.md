---
title: "Phản biện tính đúng đắn văn hóa — PRD Gia phả Nguyễn Quang"
status: review
created: 2026-08-10
reviewer: "Người phản biện văn hóa / phả học"
targets:
  - prd.md
  - addendum.md
---

# Phản biện tính đúng đắn văn hóa

## 0. Phán quyết

Tài liệu có nền đạo lý tốt hơn phần lớn sản phẩm cùng loại — hệ tồn nghi, cấm giả giọng, cấm AI bịa, giữ băng gốc đều là những lựa chọn đúng và hiếm. **Nhưng phần phả học thì mỏng**: §4 định nghĩa sai chỗ nhạy cảm nhất (con dâu bị đẩy ra ngoại phả), mô hình dữ liệu thiếu năm trường mà bất kỳ cuốn phả Việt nào cũng có (ngày kỵ, nơi táng, thứ tự anh em, bậc chính/kế/thứ của vợ, quê quán), mô hình phân quyền gắn vào đúng cái vai trò đang tranh chấp, và có ít nhất hai đường dẫn thẳng tới việc làm tổn thương người thật (phiếu in FR-28/29 và toggle "phả cổ" FR-18).

**Chưa nên trình bản này cho Ban tu phả và các cụ.** Không phải vì ý tưởng sai, mà vì có vài câu chữ trong đó, nếu một cụ đọc phải, sẽ mất thiện cảm ngay ở trang đầu (xem §8 — Vấn đề ngữ khí).

Quy ước mức độ dùng trong tài liệu này:

| Mức | Nghĩa |
|---|---|
| **[NGHIÊM TRỌNG]** | Sai về phả học hoặc lễ nghi, hoặc có đường dẫn tới tổn thương người thật. Phải sửa trước khi tài liệu ra khỏi vòng nội bộ. |
| **[NẶNG]** | Thiếu sót đủ lớn để phải làm lại thiết kế nếu phát hiện muộn. |
| **[CẦN SỬA]** | Sai sắc thái, sai chữ, hoặc thiếu tinh tế. Sửa được bằng câu chữ. |
| **[TỐT]** | Chỗ làm đúng và tinh, ghi nhận để không bị cắt nhầm ở vòng sau. |

Một lưu ý về thẩm quyền của chính bản phản biện này: tập tục phả Việt **khác nhau theo vùng, theo họ, theo cả từng chi**. Ở những chỗ tập tục thực sự phân kỳ, tôi ghi rõ là "phải chốt trong phàm lệ", không kết luận PRD sai. Ở những chỗ tôi nói "sai", đó là những chỗ gần như không có họ nào làm ngược lại.

---

## 1. Thuật ngữ (§4)

### 1.1 [NGHIÊM TRỌNG] "Ngoại phả" xếp con dâu ra ngoài chính phả

PRD §4:

> **Ngoại phả** — Người liên quan nhưng không đủ điều kiện vào chính phả: **dâu rể ngoại tộc**, ân nhân, thầy dạy.

Đây là lỗi nặng nhất của cả tài liệu.

**Thực tế phả Việt:** con dâu **nằm trong chính phả**, chép ngay dưới tên chồng, theo thể thức "phối bà họ ..., hiệu ..., con gái cụ ... người xã ..., sinh hạ mấy trai mấy gái". Bà là người sinh ra nam đinh của họ, là người thờ cúng tổ tiên nhà chồng, là người có ngày kỵ được họ cúng. Không có cuốn phả nào của một dòng họ nghiêm túc lại đẩy con dâu xuống mục phụ lục.

Người thực sự nằm ngoài là **con rể** (thuộc họ khác, có phả của họ đó) và **con gái đã xuất giá tính từ đời con của bà trở đi** (con bà vào phả nhà chồng). Ngay cả thế, con gái vẫn được chép trong chính phả với tên và nơi gả.

Gộp "dâu rể" thành một cụm bằng nhau là gộp hai địa vị hoàn toàn khác nhau — và là gộp theo hướng hạ thấp người phụ nữ đang sống trong họ. Nếu một bà đã làm dâu 40 năm mở trang phàm lệ ra và thấy mình được xếp cùng hàng với "ân nhân, thầy dạy", đó là một vết thương thật, không phải một lỗi tài liệu.

Thêm nữa, "ngoại phả" trong phả học không có nghĩa "người không đủ tư cách". Chữ 外 là **bên ngoài dòng chính / bên ngoại**. Ngoại phả trong các cuốn phả cũ thường là phần chép: dòng dõi bên ngoại, các chi thất lạc, mộ chí, văn tế, ruộng hương hỏa, sự tích người có công. Nó là **phần phụ lục của cuốn sách**, không phải hạng người thứ hai.

**Sửa:**

| Từ | Định nghĩa đề nghị |
|---|---|
| **Chính phả** | Phần chép thế thứ dòng nội tộc: nam đinh, con gái, và phối ngẫu của họ. |
| **Ngoại phả** | Phần phụ chép các nội dung ngoài thế thứ dòng chính: dòng bên ngoại, chi thất lạc, mộ chí, văn tế, hương hỏa, người có công với họ (ân nhân, thầy dạy), con rể. |
| **Phối ngẫu** | *(xem 1.3)* — **thuộc chính phả**, chép kèm người phối. |

### 1.2 [NGHIÊM TRỌNG] §4 dùng chữ "chính phả" theo hai nghĩa khác nhau, mâu thuẫn trong cùng một bảng

Cùng bảng §4:

- **Chính phả** = "Phần dữ liệu **đã được duyệt**, coi là chính thức." (nghĩa: trạng thái quy trình)
- **Ngoại phả** = "Người ... không đủ điều kiện vào **chính phả**" (nghĩa: phần chính của cuốn sách, đối lập với phụ lục)

Hai nghĩa này va nhau trực tiếp. Một con dâu đã được duyệt thì theo dòng 1 là "trong chính phả", theo dòng 2 là "ngoại phả, không được vào chính phả". Ban tu phả sẽ đọc theo nghĩa truyền thống (nghĩa 2) vì đó là nghĩa họ biết, còn hệ thống lại vận hành theo nghĩa 1. Mọi tranh luận về "ai được vào chính phả" sau này sẽ nói chuyện lệch nhau mà không ai biết.

**Sửa:** giữ "chính phả / ngoại phả" đúng nghĩa phả học (bộ phận của cuốn sách), và đổi tên hai tầng dữ liệu thành cặp khác — đề nghị **"đã khảo" / "đang khảo"**, hoặc **"phả chính bản" / "kho tồn nghi"**. Chữ "đang khảo" còn nhẹ hơn "tồn nghi" khi hiện lên trước mặt con cháu của người bị đánh dấu.

### 1.3 [NẶNG] "Phối ngẫu" bị làm phẳng — mất chính thất / kế thất / thứ thất

PRD: *"Phối ngẫu — Vợ/chồng của một người trong phả."*

Phả Việt phân biệt rất rõ, và **sự phân biệt này quyết định thứ bậc đích/thứ của con**:

| Bậc | Nghĩa | Hệ quả |
|---|---|---|
| **Chính thất** (vợ cả) | Vợ chính thức đầu tiên | Con là **con đích**; con trai trưởng của bà là **trưởng nam** |
| **Kế thất** | Cưới **sau khi** chính thất mất | Con thường được coi ngang con đích trong nhiều họ |
| **Thứ thất / trắc thất** (vợ lẽ) | Cưới khi chính thất **còn sống** | Con là **con thứ**, không kế thừa dòng trưởng |

Nhầm **kế thất** thành **thứ thất** là một trong những cách xúc phạm nặng nhất khi nói về mẹ hoặc bà của người khác — nó biến một người vợ chính đáng thành vợ lẽ. Và đây không phải chuyện lý thuyết: nó chính là nguyên liệu của loại tranh chấp mà **FR-6** dự trù ("ai là trưởng chi").

Một trường `phối ngẫu` phẳng **không biểu diễn được** khác biệt này, nghĩa là hệ thống hoặc bỏ mất thông tin, hoặc buộc người nhập tự bịa thứ tự. Cả hai đều dẫn thẳng tới tranh chấp.

**Sửa:** phối ngẫu phải mang: **bậc** (chính/kế/thứ), **thứ tự** (bà thứ mấy), **trạng thái** (còn/mất/ly hôn/tái giá), và chính bậc đó phải là một khẳng định có nguồn và có độ tin cậy như mọi khẳng định khác (FR-1/FR-2), vì nó **là** thứ hay bị tranh chấp.

Chú thêm: chữ "phối ngẫu" tự nó hơi hành chính. Phả Việt viết **"phối"**, **"chính thất"**, **"kế thất"**, **"tiếp phối"**. Trên giao diện cho các cụ, dùng chữ của phả sẽ được lòng hơn nhiều.

### 1.4 [NẶNG] "Húy" định nghĩa lệch, và thiếu **tên hèm / tên cúng cơm** — trường mà FR-41 bắt buộc phải có

PRD: *"Húy — Tên thật của người đã khuất; kiêng gọi thẳng."*

Hai điểm lệch:

1. **Húy không chỉ của người đã khuất.** Tên húy là tên thật đặt lúc sinh; kiêng gọi thẳng áp dụng cho cả bậc trên **đang sống**. Định nghĩa hiện tại khiến hệ thống có thể vô tư hiển thị tên húy của một cụ còn sống.
2. **"Kiêng gọi thẳng" đúng trong sinh hoạt, sai trong tế lễ.** Khi khấn thì **bắt buộc phải xưng đúng tên húy** ("... hiển khảo ... phủ quân, húy ..."). Đây không phải chi tiết vụn: nó là lý do hệ thống phải lưu tên húy chính xác, và phải biết khi nào được đọc ra.

Thiếu nghiêm trọng hơn là **bộ tên chưa đủ**. FR-12 liệt kê: *húy, tự, hiệu, tên ở nhà, tên trên giấy tờ, bí danh*. Thiếu hai cái quan trọng nhất cho lễ nghi:

- **Tên thụy (thụy hiệu)** — tên đặt sau khi mất, dùng trong phả và trong khấn cho các cụ có vị thế.
- **Tên hèm / tên cúng cơm** — tên chỉ dùng khi cúng giỗ, nhiều nhà giữ riêng, con cháu không gọi ngày thường.

**Hệ quả trực tiếp:** FR-41 sinh "văn khấn gợi ý". Nếu văn khấn lấy tên trên giấy tờ (hoặc tên thường gọi) thay vì tên hèm/tên húy/thụy hiệu, thì đó là **đọc sai tên cụ trong lúc khấn**. Đây đúng là loại lỗi mà đề bài gọi là "một chỗ sai về lễ nghi là mất uy tín cả dự án", và nó đang nằm sẵn trong tài liệu vì FR-12 và FR-41 không nối với nhau.

### 1.5 [CẦN SỬA] "Phạm húy" định nghĩa quá hẹp

PRD: *"Đặt tên trùng tên các cụ bề trên — điều cần tránh."*

Đúng phần lõi, thiếu ba sắc thái làm cho một trình kiểm tra phạm húy thật sự chạy được:

- **Không chỉ trùng hoàn toàn.** Phạm húy tính cả **trùng âm** (Phúc/Phước), **trùng chữ Hán** dù đọc khác, và trong nhiều họ tính cả **tên đệm**.
- **Phạm vi kiêng phải do phàm lệ chốt**: kiêng đến mấy đời trực hệ? Có kiêng tên các cụ bên ngoại gần không? Có kiêng tên chi khác cùng họ không? Các họ trả lời khác nhau. Hệ thống không được tự đặt luật.
- **Quốc húy** (tên vua) là lý do nhiều tên trong tư liệu cũ bị viết chệch hoặc **cố ý thiếu nét (kính khuyết)**. Việc này ảnh hưởng thẳng tới FR-9: một ký tự Hán-Nôm OCR ra "sai nét" có thể là **cố ý**, không phải lỗi quét.

Kèm theo: hệ thống phải cân nhắc chuyện **hiển thị tên húy to giữa màn hình** có bị coi là thất kính không. Đề nghị: mặc định hiện tên thường dùng, tên húy đặt ở dòng trang trọng theo thể thức phả ("húy ...", "tự ...", "hiệu ..."), không dùng làm nhãn node trên cây.

### 1.6 [NẶNG] "Chi / nhánh" bị gộp làm một, và thiếu tầng "phái"

PRD gộp: *"Chi / nhánh — Nhánh con cháu tách ra từ một cụ; mã dạng `1.3.2`."*

Nhiều dòng họ Việt có **nhiều tầng phân nhánh có tên riêng**, và các tầng đó **không hoán đổi cho nhau**:

```
Họ (tộc)
 └─ Phái / đại chi
     └─ Chi
         └─ Nhánh
             └─ Gia đình
```

Gọi "chi" và "nhánh" là đồng nghĩa sẽ khiến người của một họ có tầng phái đọc thấy sai ngay lập tức, và khiến FR-36 ("quyền gắn theo chi") không biết gắn vào tầng nào.

Thêm: **chi thường có tên, không có số.** Các họ đặt tên chi theo thiên can (chi Giáp, chi Ất, chi Bính), theo thứ (chi Nhất, chi Nhì), hoặc theo tên cụ tổ chi. Mã `1.3.2` là mã máy — dùng nội bộ thì được, nhưng đưa lên giao diện cho các cụ thì lạnh và khó nhớ. Hệ thống phải cho **đặt tên hiển thị cho từng chi** và dùng tên đó ở mọi nơi con người đọc.

**[NẶNG] — hệ quả nặng hơn ở FR-13:** "mã gia phả cá nhân `1.3.2.7`". Đây là gán cho mỗi người một chuỗi số. Ngoài chuyện lạnh lùng, nó **không ổn định** — xem 1.7.

### 1.7 [NẶNG] "Đời" đánh số từ Thủy tổ — nhưng Thủy tổ là thứ hay thay đổi nhất

PRD: *"Đời — Thế hệ tính từ cụ Thủy tổ (đời 1)."* và *"Thủy tổ — Cụ tổ đầu tiên **được ghi nhận**."*

Hai định nghĩa này, đặt cạnh nhau, tạo ra một quả bom hẹn giờ:

Trong tu phả, **việc tìm ra thêm một đời phía trên là chuyện thường xuyên** — một cuốn phả chi khác xuất hiện, một tấm bia, một cụ nhớ ra tên cha của Thủy tổ. Khi đó số đời của **toàn bộ dòng họ dịch đi một bậc**, và mọi mã cá nhân `1.3.2.7` của FR-13 đổi hết. Mà FR-13 lại cố tình biến mã đó thành **phần thưởng cá nhân người ta chụp màn hình gửi cho nhau** (UJ-2), và FR-33 in nó vào sách.

**Sửa:** lưu **quan hệ**, tính **số đời** như một giá trị dẫn xuất tại thời điểm hiển thị, có mốc gốc đổi được. Mã cá nhân bền vững phải là một định danh vô nghĩa (không mang thông tin đời/chi); mã `1.3.2.7` chỉ là **cách hiển thị**. Nếu không, ngày họ tìm ra cụ tổ cao hơn — ngày đáng mừng nhất của cả dự án — sẽ là ngày phần mềm phải migrate và mọi bản in thành sai.

Thêm một phân biệt phả học đang thiếu: nhiều họ tách **Thủy tổ** (cụ tổ xa nhất, có khi ở tỉnh khác, có khi chỉ là truyền ngôn) với **tổ khai cơ / tổ khai canh** (cụ đầu tiên về lập nghiệp tại làng hiện tại, có mộ, có bằng chứng). Hai cụ này thường không phải một, và độ tin cậy rất khác nhau. Đúng ra đây là chỗ **FR-2 tỏa sáng nhất** — nhưng §4 lại định nghĩa Thủy tổ như một sự thật đơn nhất.

### 1.8 [TỐT] "Tồn nghi" và "Phàm lệ"

Hai mục này đúng và tinh.

- **Tồn nghi** — *"ghi lại chứ không bỏ, không nhận là chắc"* — đúng nguyên tắc của phả học nghiêm túc, và hiếm khi thấy trong phần mềm gia phả phương Tây. Giữ nguyên.
- **Phàm lệ** — định nghĩa đúng (凡例 là chương quy ước biên soạn đứng đầu cuốn phả), và việc **FR-7 đưa nó lên thành trang công khai để mọi tranh chấp trỏ về** là quyết định sắc sảo nhất của cả PRD. Đây chính là cách các cuốn phả cũ tự bảo vệ mình.

### 1.9 [NẶNG] Những từ đang được dùng mà không được định nghĩa, hoặc thiếu hẳn

Các từ **đã dùng trong PRD** nhưng không có trong §4:

| Từ | Dùng ở | Vì sao phải định nghĩa |
|---|---|---|
| **Nam đinh** | FR-18 | Là tiêu chí lọc của cả một chế độ xem |
| **Trưởng họ / trưởng chi** | FR-36, FR-6, FR-4 | Là nền của toàn bộ phân quyền — xem §3 |
| **Ban tu phả** | §10, Q9, Addendum C | Là cơ quan có thẩm quyền, nhưng không có trong FR-36 |
| **Hội đồng gia tộc** | FR-24, FR-43 | Cơ quan thứ ba, quan hệ với hai cơ quan trên không rõ |
| **Tộc Sử** | F7 | Không phải từ phả học chuẩn — xem §6.4 |

Các từ **thiếu hẳn** mà một nền tảng phả Việt không thể không có:

- **Thế thứ** — thứ tự đời, khái niệm trục của cả cuốn phả.
- **Đích / thứ** — con dòng chính / dòng thứ. Là thứ quyết định ai kế tự.
- **Trưởng nam, đích tôn, đích tôn thừa trọng** — cháu đích tôn gánh vai chủ tang khi cha mất trước ông. Quyết định ai đứng chủ tế.
- **Thừa tự / kế tự** — con nuôi để nối dõi và giữ hương hỏa, **khác** con nuôi thường (xem §4).
- **Hương hỏa** — phần lo việc thờ cúng; gắn với trưởng và với ruộng tự điền.
- **Kỵ / húy nhật** — ngày mất, ngày làm giỗ. **Chưa xuất hiện ở đâu trong mô hình dữ liệu.**
- **Tự (字) / hiệu (號) / thụy (謚)** — có trong FR-12 nhưng không được định nghĩa; thụy thiếu hẳn.
- **Phả ký, phả đồ, hành trạng** — các bộ phận của một cuốn phả; FR-33 hứa "thể thức phả Việt" mà không nêu được nó gồm gì.
- **Chữ đệm theo đời / tự bối** — xem §1.10.

### 1.10 [CẦN SỬA] Chính chữ "Quang" trong tên họ là một khái niệm dữ liệu, và PRD không thấy

"Nguyễn **Quang**" — chữ đệm dùng chung là dấu hiệu nhận dạng dòng ở rất nhiều họ Việt. Một số họ đi xa hơn: có **bài thơ đặt tên**, mỗi đời lấy một chữ theo thứ tự (tự bối / hàng chữ). Nếu họ Nguyễn Quang có lệ này — cần hỏi Ban tu phả — thì **chữ đệm theo đời** là một trường dữ liệu bậc nhất, ảnh hưởng tới: nhận diện thành viên, kiểm phạm húy, gợi ý đặt tên, và cả việc phát hiện người thất lạc.

Hiện "Tự bối" chỉ nằm trong backlog Addendum §E. Ít nhất phải hỏi thành một câu hỏi mở, vì câu trả lời có thể đổi mô hình tên.

Ghi nhận **[TỐT]**: đề từ 「光前裕後」 — *Quang tiền dụ hậu*, "làm rạng đời trước, để phúc đời sau" — chơi đúng chữ Quang của họ, chọn rất khéo. Đây là loại chi tiết khiến các cụ tin rằng người làm có để tâm.

---

## 2. Xưng hô (FR-19 / FR-20 / FR-21)

Ba FR này chiếm 4 dòng trong PRD và 1 dòng trong Addendum §A.5. Đó là toàn bộ những gì tài liệu nói về vấn đề mà chính tài liệu gọi là *"vấn đề đặc thù tiếng Việt, không có tương đương phương Tây"* (§4), và là **màn demo chính tại giỗ Tổ** (Addendum §C, Giai đoạn 2).

Độ phức tạp thật vượt xa những gì PRD nhìn thấy. Dưới đây là những ca hệ thống **chắc chắn trả lời sai** nếu xây theo đúng mô tả hiện tại.

### 2.1 [NGHIÊM TRỌNG] Không có quy tắc từ chối khi đường quan hệ đi qua khẳng định "tồn nghi"

Đây là lỗ hổng nặng nhất trong nhóm xưng hô, và nó là **lỗ hổng kiến trúc, không phải lỗ hổng tính năng**.

PRD xây cả một hệ ba mức tin cậy (FR-2) và hai tầng chính phả/kho tồn nghi (FR-3). Rồi FR-19 tính đường quan hệ giữa hai người và **tuyên bố kết quả** mà không nói gì về việc đường đó đi qua cạnh nào.

Ca sai:

> Cụ A được ai đó khai là con cụ B — mức *tồn nghi*, chưa duyệt, đang chờ.
> Ở giỗ Tổ, hai con cháu quét QR chung. Máy tính đường qua cạnh tồn nghi đó và tuyên bố, trước mặt cả họ: *"Anh gọi em là cháu; em gọi anh là chú họ."*

Hệ thống vừa **biến một khẳng định huyết thống đang tranh cãi thành phán quyết công khai về vai vế**, đúng nơi và đúng lúc mà nó gây thiệt hại lớn nhất. Không ai đọc màn hình đó như "một gợi ý dựa trên dữ liệu chưa duyệt". Họ đọc nó như "phả nói thế".

Và có một sự bất đối xứng khó biện minh trong chính tài liệu: **NFR-6 cấm AI khẳng định điều không có nguồn**, nhưng cỗ máy xưng hô — thứ được đưa lên sân khấu ở giỗ Tổ — lại không chịu ràng buộc tương đương.

**Sửa — đề nghị nâng thành NFR mới:**

> **NFR-11 — Xưng hô không được vượt quá độ tin cậy của đường quan hệ.**
> Độ tin cậy của một kết quả xưng hô bằng **mức thấp nhất** của mọi khẳng định trên đường quan hệ. Nếu đường đi qua bất kỳ khẳng định nào chưa ở mức `chắc chắn`, hệ thống **không tuyên bố** — nó trình bày: đường quan hệ, mắt xích đang tồn nghi, và câu "chỗ này họ chưa khảo xong". Nếu có nhiều đường, trình bày tất cả. Thà không trả lời còn hơn trả lời sai vai.

### 2.2 [NGHIÊM TRỌNG] Không có khái niệm vùng miền — trong khi PRD tự đặt người dùng ở Bình Dương

UJ-2 dựng chị Thu **ở Bình Dương**. FR-19 hứa trả lời xưng hô dứt khoát. Hai điều này không đi cùng nhau được.

Cùng một quan hệ máu mủ, khác chữ theo miền:

| Quan hệ | Bắc | Trung (Huế) | Nam |
|---|---|---|---|
| Chị của bố | cô | **o** | cô |
| Chồng của chị/em gái bố | **chú** | dượng | **dượng** |
| Chồng của chị/em gái mẹ | dượng | dượng | dượng |
| Vợ của em trai bố | thím | thím | thím |
| Vợ của anh trai bố | bác (gái) | bác / mụ | bác |
| Vợ của anh/em trai mẹ | mợ | mợ | mợ |
| Con trai đầu | anh **Cả** | anh Cả | anh **Hai** |
| Bà | bà | **mệ** | bà / nội / ngoại |

Riêng cặp **"chồng của cô"**: Bắc gọi **chú**, Nam gọi **dượng**. Máy trả lời "chú" cho một gia đình miền Nam là sai; trả lời "dượng" cho một gia đình Bắc là sai. Không có phương án trung lập.

Và **thứ tự đánh số**: một họ gốc Bắc di cư vào Nam sẽ có chi trong Nam đếm từ "anh Hai" còn chi ngoài Bắc đếm từ "anh Cả". Nếu FR-33 in ra "con thứ nhất" hay giao diện hiện "anh Cả", một nửa dòng họ đọc thấy sai.

**Sửa:** mỗi người có thuộc tính **vùng xưng hô** (mặc định theo nơi ở, cho sửa tay); kết quả xưng hô hiển thị theo vùng của **người hỏi**, kèm biến thể vùng kia khi khác nhau. Đây không phải tính năng phụ — không có nó thì FR-19 không đúng cho quá nửa người dùng.

### 2.3 [NGHIÊM TRỌNG] Không có luật "dâu theo chồng, rể theo vợ"

Đây là ca **được hỏi nhiều nhất trong đời thực** và PRD không có gì cho nó.

Người thật sự bối rối ở đám cưới, đám giỗ, đám tang không phải là con cháu trong họ — họ đã quen từ bé. Là **con dâu mới** và **con rể mới**. §2.1 của chính PRD ghi nhóm "Người tra cứu" gồm *"dâu rể mới"* với nỗi sợ *"Cảm thấy mình là người ngoài"*. Rồi không FR nào phục vụ họ.

Luật thật:

> Con dâu **gọi theo chồng nhưng xưng thấp hơn một bậc lịch sự**: chồng gọi ông kia là "chú" thì vợ cũng gọi "chú", nhưng chồng xưng "cháu/em" thì vợ xưng "cháu/em" — bà không tự tính vai của mình, bà **mượn vai của chồng**. Con rể tương tự, theo vợ.

Với mô hình dữ liệu hiện tại, con dâu là node **không có đường huyết thống nào** tới người kia. Thuật toán tính đường quan hệ sẽ trả về "không tìm thấy quan hệ" — tức là hệ thống nói với con dâu mới đúng cái điều bà sợ nhất: *bạn là người ngoài*.

**Sửa:** với node phối ngẫu, đường quan hệ phải **đi vòng qua người phối** rồi dịch xưng hô sang giọng của dâu/rể. Đây là quy tắc rõ ràng, dễ cài, và là thứ biến FR-19 từ trò vui thành công cụ thật sự hữu ích cho đúng nhóm người cần nó nhất.

### 2.4 [NẶNG] Vai vế theo phả và tuổi tác thật xung đột — PRD chọn một bên mà không biết mình đang chọn

UJ-4 in ra: *"Anh gọi em là cháu; em gọi anh là chú họ"*. Đây là kết quả tính **thuần theo vai vế**, đúng nguyên tắc tông tộc ("bé bằng củ khoai, cứ vai mà gọi"). Về phả học, chọn thế là đúng.

Nhưng cách **trình bày** thì hỏng. Trong một dòng họ có nhiều đời, chuyện một người 60 tuổi phải gọi một thanh niên 25 tuổi bằng "chú" là bình thường — nhưng trong đời thực nó luôn đi kèm một lớp giảm xóc xã hội: *"chú ít tuổi"*, *"ông trẻ"*, cười một cái, rồi ai xưng thế nào cũng được. Một màn hình phán một câu cụt lủn trước mặt người khác thì bỏ mất toàn bộ lớp giảm xóc đó, và biến một chuyện vui thành một chuyện ngượng.

Thêm một ca xung đột thật, thường gây cãi nhau ở đời sống: **con chú con bác cùng đời**. Theo lệ, ai là con của người anh thì làm anh, **bất kể tuổi**. Nhưng ở nhiều gia đình miền Nam và ở lớp trẻ, **tuổi thắng**. Hai lệ này mâu thuẫn trực tiếp, và đây là chuyện **phàm lệ phải chốt**, không phải chuyện lập trình viên tự quyết.

**Sửa:**
- Ghi vào phàm lệ (FR-7): họ theo lệ vai vế hay lệ tuổi cho anh em cùng đời. Hệ thống đọc từ đó, không hard-code.
- Kết quả xưng hô luôn kèm **lý do ngắn** ("vì cụ ... là anh của cụ ...") và **ghi chú tuổi** khi lệch nhiều ("chú ít tuổi hơn cháu 30 tuổi — trong nhà thường gọi vui là *ông trẻ*").
- Không bao giờ dùng giọng ra lệnh ("Anh **phải** gọi..."). Dùng "theo phả thì...".

### 2.5 [NẶNG] Nhiều đường quan hệ cùng lúc

Ở làng Việt, hai người trong họ rất hay có **hơn một đường quan hệ**: vừa là anh em họ xa, vừa là anh em cọc chèo; hai chi cùng họ lấy nhau qua nhiều đời. PRD giả định mỗi cặp có một đường và một câu trả lời.

Thực tế người ta xử lý bằng lệ: **trọng đường nội tộc, trọng đường gần nhất**, và người ta biết cả hai đường, chọn cái nào tùy hoàn cảnh. Hệ thống chọn giùm một đường rồi giấu đường kia là làm thay việc mà nó không có thẩm quyền làm.

**Sửa:** trả **mọi đường**, sắp theo lệ (nội trước ngoại, gần trước xa), đánh dấu đường mà lệ họ ưu tiên, để người dùng thấy cả bức tranh.

### 2.6 [NẶNG] Bên ngoại nằm ngoài dữ liệu — nhưng người dùng sẽ hỏi

Phần lớn câu hỏi xưng hô thật là về **bên ngoại** và về **họ nhà thông gia** (đám cưới, đám tang bên vợ). Phả chỉ chứa nội tộc + phối ngẫu. Nghĩa là với một tỷ lệ lớn câu hỏi, hệ thống **không có dữ liệu** — nhưng FR-20 nhận câu tự nhiên tùy ý và không có quy tắc từ chối.

Một LLM parse câu *"anh ấy là con của cậu tôi"* sẽ vui vẻ trả lời, kể cả khi ông cậu đó không có trong phả. Kết quả có thể đúng theo lý thuyết xưng hô, nhưng nó **không phải phán quyết của phả** — mà người dùng không phân biệt được hai thứ đó.

**Sửa:** tách bạch rõ trên giao diện hai chế độ — *"tra theo phả họ ta"* (có node, có căn cứ) và *"giải thích xưng hô chung"* (kiến thức phổ thông, không phải phả). Hai khung khác nhau, hai giọng khác nhau. Không bao giờ trộn.

### 2.7 [CẦN SỬA] FR-21 (xưng hô trong văn bản) là ý hay nhưng nguy hiểm nhất trong ba FR

*"Viết thiệp mời cưới cho ông này thì đề gì?"* — nhu cầu có thật, rất đúng.

Nhưng xưng hô văn bản trang trọng là địa hạt dễ sai và sai thì để lại vết in: thiệp cưới, cáo phó, điếu văn, thiếp mừng thọ đều có công thức riêng, và **cáo phó là thứ sai một chữ thì cả làng biết**. Addendum §E còn để sẵn "Sinh cáo phó & điếu văn đúng vai vế" trong backlog.

**Sửa:** FR-21 giới hạn ở **mẫu do người soạn, máy điền** — không để LLM sinh tự do. Và mọi văn bản thuộc tang lễ (cáo phó, điếu văn, văn tế) tách khỏi FR-21, xếp vào nhóm văn bản lễ nghi có luật riêng (xem §6.5).

### 2.8 [TỐT] Thiết kế kỹ thuật của Addendum §A.5

*"LLM chỉ parse câu tự nhiên thành chuỗi quan hệ có cấu trúc; việc resolve node và tính đường quan hệ do truy vấn graph lo. Không để LLM sinh Cypher."*

Đây là quyết định đúng và nên giữ nguyên qua mọi vòng sửa. Nó có nghĩa: **ngữ pháp do máy học lo, phả học do dữ liệu lo.** Mọi phát hiện ở §2 này đều là bổ sung luật vào tầng graph, không phải bổ sung prompt.

Ghi nhận thêm **[TỐT]**: chọn demo bằng **QR chung, mỗi người chọn tên mình** (FR-19) thay vì gõ câu mô tả — đúng như PRD nhận xét, cụ 75 tuổi cũng làm được. Đây là một chi tiết UX hiểu người dùng thật.

---

## 3. Thứ bậc, phân quyền, tranh chấp (FR-36, FR-6, FR-4, FR-7)

### 3.1 [NGHIÊM TRỌNG] Phân quyền gắn vào đúng cái vai trò mà chính PRD thừa nhận là đang tranh chấp

Đặt ba câu của PRD cạnh nhau:

- **FR-36**: *"Vai trò. Trưởng họ → Trưởng chi → Thành viên → Khách. Quyền gắn theo chi."*
- **FR-6**: *"Bất đồng chưa giải quyết (**ai là trưởng chi**, mộ ai ở đâu) có nơi ghi nhận..."*
- **FR-4**: *"Trưởng họ giữ quyền phủ quyết sau."*

Hệ thống **cấp quyền dựa trên một dữ kiện mà nó đồng thời thừa nhận có thể đang tranh chấp**. Vòng lặp này không có lối ra trong tài liệu:

> Chi 3 tranh chấp ai là trưởng chi. Người đang giữ vai trưởng chi trong hệ thống là bên A. Bên B mở hồ sơ tranh chấp (FR-6). Trong lúc tranh chấp mở, **bên A vẫn là người có quyền duyệt mọi khẳng định của chi 3** — kể cả các khẳng định làm bằng chứng cho phía B, kể cả khẳng định về thứ bậc anh/em của các cụ đời trên, tức là **chính vật chứng của vụ tranh chấp**.

Phần mềm vừa vô tình đứng về một phía. Và cái nguy hiểm là nó làm việc đó **im lặng**, qua cấu hình phân quyền, chứ không qua một quyết định ai đó ký tên.

**Sửa — bắt buộc:**
1. Khi có hồ sơ tranh chấp mở về **vai trò** hoặc về **thứ bậc đích/thứ, ai là anh ai là em, ai kế tự**, thì mọi khẳng định thuộc phạm vi tranh chấp bị **đóng băng**: không ai duyệt được, kể cả trưởng chi đương nhiệm, kể cả cơ chế đồng thuận FR-4. Chỉ Ban tu phả gỡ băng.
2. Vai trò trong hệ thống phải ghi rõ là **vai trò vận hành do Ban tu phả bổ nhiệm**, không phải phần mềm công nhận ai là trưởng theo lệ. Ghi câu này ngay trên trang phàm lệ. Nếu không, việc "được cấp quyền trưởng chi trong phần mềm" sẽ bị đem ra làm bằng chứng trong tranh chấp ngoài đời — và nó sẽ bị đem ra thật.

### 3.2 [NGHIÊM TRỌNG] Mô hình 4 vai không khớp cách dòng họ Việt thực sự vận hành — thiếu tách quyền lễ nghi khỏi quyền biên tập

FR-36 gộp mọi thẩm quyền vào một trục dọc duy nhất. Thực tế một dòng họ Việt vận hành trên **hai trục song song**, và người ta rất ý thức về sự khác nhau:

| Trục | Ai | Do đâu mà có | Quyền gì |
|---|---|---|---|
| **Lễ nghi / tông pháp** | Tộc trưởng (trưởng họ) | **Kế thừa** — đích trưởng, con trưởng dòng trưởng | Chủ tế, giữ nhà thờ, giữ phả gốc, đứng tên trước tổ tiên |
| **Biên tập / khảo cứu** | Ban tu phả, chủ biên, các cụ am hiểu | **Được cử** — theo năng lực và hiểu biết | Khảo, chép, quyết nội dung phả |

Đây không phải chi tiết học thuật. Nó có ba hệ quả thẳng vào thiết kế:

**(a) Người giữ vai lễ nghi rất thường không phải người biên tập.** Tộc trưởng có thể đã cao tuổi, có thể ở xa, có thể không rành chữ nghĩa phả — điều đó hoàn toàn bình thường và không hề làm giảm uy quyền của cụ. Việc PRD trao cho "trưởng họ" một **nút phủ quyết trong phần mềm** (FR-4) là đặt lên vai cụ một việc thuộc trục kia. Nếu cụ không dùng web — khả năng cao — thì cái nút đó hoặc nằm im (quyền phủ quyết thành hư văn), hoặc bị người khác dùng hộ (tệ hơn nhiều: ai đó thao tác nhân danh trưởng họ, và nhật ký FR-39 sẽ ghi tên cụ).

**(b) Ban tu phả và Hội đồng gia tộc không có trong FR-36.** Tài liệu nhắc **ba cơ quan** — Ban tu phả (§10, Q9), Hội đồng gia tộc (FR-24, FR-43), và "cụ cố vấn nội dung — người quý nhất dự án" (Addendum §C) — mà mô hình vai trò chỉ có bốn hạng và không hạng nào là một trong ba. Người quý nhất dự án hiện **không có tài khoản gì cả**.

**(c) Thân cây không thuộc chi nào.** *"Quyền gắn theo chi, không phải toàn cục"* nghe gọn, nhưng các đời từ Thủy tổ xuống đến chỗ tách chi **không thuộc chi nào** — mà đó lại chính là phần dữ liệu quan trọng nhất và tranh chấp nhiều nhất của cả cuốn phả. Ai duyệt? Tài liệu không nói. Tương tự: một cuộc hôn nhân nối chi 1 với chi 3 thuộc quyền ai, và một người con nuôi từ chi khác về thì chi nào duyệt.

**Sửa — đề nghị mô hình vai trò thay thế:**

| Vai | Quyền |
|---|---|
| **Trưởng họ (tộc trưởng)** | Vai danh vị và lễ nghi. Đứng tên lời tựa mỗi ấn bản. **Không thao tác duyệt.** Có quyền yêu cầu Ban tu phả xét lại bất cứ điều gì (quyền nêu, không phải quyền bấm). |
| **Ban tu phả (chủ biên + các cụ cố vấn)** | Thẩm quyền nội dung cao nhất. Quyết mọi việc thuộc "hạng trọng" (xem 3.3), gỡ băng tranh chấp, sửa phàm lệ. Quyết theo tập thể, ghi biên bản. |
| **Đầu mối chi** | Duyệt hạng thường trong chi mình. Không duyệt hạng trọng. Không duyệt phần thân cây. |
| **Thành viên** | Ghi vào kho tồn nghi, xác nhận, góp tư liệu. |
| **Khách** | Xem theo bán kính. |

Nếu họ Nguyễn Quang thực tế vận hành khác — ví dụ trưởng họ đích thân làm chủ biên — thì đó là câu trả lời cho **Q9**, và mô hình vai trò phải chờ câu trả lời đó rồi mới chốt. Hiện PRD chốt trước, hỏi sau.

### 3.3 [NGHIÊM TRỌNG] FR-4 "đồng thuận nhẹ" — đúng cho việc thường, sai hẳn cho việc trọng

Trả lời thẳng câu hỏi đặt ra: **có, FR-4 va chạm với quyền uy của trưởng họ**, nhưng chỗ va chạm không nằm ở nơi người ta tưởng.

**Va chạm thứ nhất, và là cái nặng hơn: FR-4 biến một quyết định kín và nhẹ thành một cuộc đối đầu công khai và nặng.**

Theo lối truyền thống, khi trưởng họ hoặc các cụ không đồng ý một điều ai đó khai, chuyện diễn ra êm: điều đó **đơn giản là không được chép vào phả**. Không có tuyên bố, không ai mất mặt, người khai thường còn không biết. Đó là một cơ chế giữ hòa khí rất hiệu quả.

FR-4 đảo ngược hoàn toàn: khẳng định **tự động lên chính phả**, rồi trưởng họ phải **phủ quyết sau**. Nghĩa là cụ phải công khai lật lại điều mà ba người trong họ đã cùng xác nhận, sau khi nó đã hiện lên cây và có thể đã có người chụp màn hình. Trong quan hệ họ hàng Việt, chi phí xã hội của "phủ quyết công khai" lớn hơn chi phí của "lặng lẽ chưa duyệt" rất nhiều lần.

Kết quả dự đoán được: cụ sẽ **không dùng quyền phủ quyết**, để giữ hòa khí. Rồi cụ sẽ mất lòng tin vào cả hệ thống, và nói với con cháu rằng "cái phả trên mạng ấy không chuẩn". Đó là kịch bản thất bại thật của dự án, và nó bắt đầu từ đúng dòng FR-4 này.

**Va chạm thứ hai: ba người ngoài chi có thể quyết chuyện thứ bậc của chi khác.**

FR-4 chỉ đòi *"3 người thuộc ít nhất 2 chi khác nhau"*. Không có điều kiện nào buộc một trong ba người phải **thuộc chi có liên quan**. Nghĩa là ba người của chi 1 và chi 2 có thể cùng nhau đưa lên chính phả một khẳng định về việc **cụ tổ chi 3 là em chứ không phải anh**. Đó chính xác là loại dữ kiện làm nên tranh chấp trưởng thứ, và nó vừa được quyết bởi những người không có tư cách nói về nó.

**Va chạm thứ ba, kỹ thuật hơn nhưng dễ xảy ra:** ba người có thể là **ba anh em ruột** hoặc ba người cùng một nhà, chỉ cần trên giấy tờ họ thuộc hai chi (ví dụ một người là con nuôi/ở rể bên chi khác). "2 chi" không đảm bảo tính độc lập của nhân chứng.

**Sửa — đề nghị cụ thể:**

1. **Chia hạng khẳng định.** Đây là thay đổi quan trọng nhất tôi đề xuất cho cả PRD.

   | Hạng | Gồm | Cơ chế duyệt |
   |---|---|---|
   | **Hạng thường** | Sinh con, cưới, ảnh, nghề nghiệp, nơi ở, số điện thoại, chính tả tên | **FR-4 đồng thuận nhẹ — giữ nguyên, rất tốt** |
   | **Hạng trọng** | Thứ bậc anh/em các cụ; ai là trưởng, đích/thứ; bậc chính thất/kế thất/thứ thất; con nuôi và thừa tự; ngày kỵ; nơi táng; Thủy tổ và các đời thân cây; nhận thêm một chi vào họ | **Chỉ Ban tu phả.** Không bao giờ tự lên chính phả. Không đếm phiếu. |

2. Với hạng thường, thêm hai điều kiện vào ngưỡng: **ít nhất một người thuộc chi có liên quan**, và **người khai không được tính là một trong ba**.

3. Đổi "phủ quyết sau" thành **"giữ lại trước"** cho hạng trọng: chưa duyệt thì nằm ở kho tồn nghi, hiện mờ, ai cũng thấy là đang khảo. Không ai mất mặt vì không có gì bị lật.

4. Giữ nguyên **[ASSUMPTION]** hiện có (ngưỡng phải cấu hình được, không hard-code) — điều này PRD đã làm đúng. Nhưng bổ sung: **danh mục hạng trọng cũng phải cấu hình được**, vì mỗi họ coi trọng những thứ khác nhau.

### 3.4 [NẶNG] FR-6 "hồ sơ tranh chấp" — nguyên tắc đúng, nhưng thiếu đường ra và thiếu quyền im lặng

*"Quản trị bất đồng, không giấu nó. Kỹ thuật không phân xử — hệ thống chỉ trình bày."* Nguyên tắc này **[TỐT]** và nên giữ.

Ba thiếu sót:

**(a) Không có cơ chế đóng.** Chỉ số ngược C3 theo dõi *"số tranh chấp mở chưa đóng"* và cảnh báo khi nó tăng đều — nhưng không FR nào mô tả **đóng bằng cách nào**. Trong đời thật, tranh chấp phả đóng bằng một cuộc họp họ có biên bản, hoặc bằng việc các cụ phán một câu, hoặc bằng việc hai bên đồng ý ghi cả hai thuyết. Hệ thống cần ánh xạ được cả ba, đặc biệt là **thuyết thứ ba: ghi song song hai thuyết cùng căn cứ**, vốn là cách các cuốn phả cũ hay dùng nhất và là cách ít gây đổ vỡ nhất.

**(b) Không có quyền im lặng.** Không phải bất đồng nào cũng nên phơi ra. Một tranh chấp về "cụ này có phải con nuôi không" phơi công khai có thể làm tổn thương một nhánh người đang sống. Cần mức hiển thị cho hồ sơ tranh chấp: **công khai / chỉ Ban tu phả / chỉ hai bên liên quan**, mặc định là mức kín nhất cho những tranh chấp chạm tới người còn sống.

**(c) Cần chặn tranh chấp thành nơi cãi nhau.** *"Lịch sử lập luận"* mở tự do sẽ thành diễn đàn. Đề nghị: mỗi bên nộp **một bản lập luận có căn cứ**, sửa được nhưng không phải chuỗi bình luận; Ban tu phả là người duy nhất viết kết luận.

### 3.5 [TỐT] Nguyên tắc "hệ thống trình bày, không phân xử"

Đây là ranh giới đúng và nên viết to hơn nữa. Mọi phần mềm gia phả châu Á đều bị cám dỗ trở thành trọng tài — và mọi lần đều hỏng. PRD nhìn ra điều đó ở FR-6 và §10 ("mọi quyết định thuộc Ban tu phả"). Đề nghị nâng thành một **nguyên tắc đứng đầu tài liệu**, không chỉ là một dòng trong bảng rủi ro, vì nó phải chi phối cả FR-4, FR-26, FR-27 và FR-30.

### 3.6 [CẦN SỬA] FR-7 trang phàm lệ — đúng hướng, nhưng danh mục nội dung quá mỏng

FR-7 liệt kê ba việc phàm lệ phải chốt: *ai được vào phả, dâu/rể/con nuôi xử lý ra sao, thông tin người sống hiển thị tới đâu*. Thiếu nhiều thứ mà tranh chấp thực tế trỏ về, và mỗi thứ thiếu ở đây là một chỗ lập trình viên sẽ phải tự quyết:

- Đời 1 tính từ ai; xử lý thế nào khi tìm ra đời cao hơn (1.7)
- Tầng phân nhánh của họ: có "phái" không, chi đặt tên thế nào (1.6)
- Con gái và con của con gái chép đến đâu
- Con nuôi, con thừa tự, con riêng của vợ/chồng, **con ngoài giá thú** — chép hay không, chép thế nào (§4)
- Dâu góa, dâu tái giá, người ly hôn — còn trong phả không (§4)
- Người xin rút khỏi phả — có quyền đó không (§5)
- Anh em cùng đời: theo vai vế hay theo tuổi (2.4)
- Phạm vi kiêng húy (1.5)
- Danh mục **hạng trọng** (3.3)
- Ngày kỵ: theo âm hay theo dương; xử lý tháng nhuận và ngày 30 thiếu (§6.2)
- Ai được nghe băng ghi âm gốc (§5.4)

Đề nghị PRD kèm luôn một **mẫu phàm lệ** để Ban tu phả điền vào, thay vì chỉ hứa một trang trống. Mẫu đó là sản phẩm bàn giao đáng giá nhất mà dự án có thể đưa cho dòng họ ở Giai đoạn 0 — và nó **không cần một dòng code nào**, đúng tinh thần "Chiến thuật $0" của Addendum §C.

---

## 4. Dâu, rể, con nuôi, con ngoài giá thú, người rời họ

Đây là mục có nguy cơ gây tổn thương người thật cao nhất trong toàn tài liệu. Tất cả những người nói ở đây **đang sống, đang trong họ, và sẽ mở web ra xem**.

### 4.1 [NGHIÊM TRỌNG] FR-18 — nút "phả cổ / phả mới" làm phụ nữ biến mất bằng một cú bấm

> **FR-18: Chế độ xem theo phàm lệ.** Một nút chuyển giữa **phả cổ** (chỉ nam đinh) và **phả mới** (đủ nam nữ, dâu rể, con nuôi). Hai cách đọc trên cùng một dữ liệu — không bắt bên nào nhượng bộ.

Ý định là hòa giải, và ý định đó đáng trọng. Nhưng thực thi có hai lỗi, một lỗi kiến thức và một lỗi hậu quả.

**Lỗi kiến thức: "phả cổ = chỉ nam đinh" là sai.**

Phả cổ Việt **có chép phụ nữ**. Cụ thể:
- **Vợ luôn được chép**, ngay dưới tên chồng, có họ, có tên hiệu, có quê, có ngày kỵ, có tên cha bà.
- **Con gái được chép** trong danh sách con, thường kèm nơi gả ("gả cho ông ... người xã ...").
- Cái phả cổ **không** làm là cho phụ nữ một **dòng kế tiếp**: thế thứ đi tiếp theo nam đinh, con của con gái vào phả nhà chồng.

Nghĩa là phân biệt thật không phải "có / không có mặt", mà là **"có dòng nối tiếp / không có dòng nối tiếp"**. Một chế độ xem cắt sạch phụ nữ khỏi màn hình không tái hiện phả cổ — nó tạo ra một thứ khắc nghiệt hơn phả cổ, rồi dán nhãn "truyền thống" lên đó. Các cụ am hiểu phả sẽ nhận ra ngay, và đó là mất uy tín ở đúng nhóm người mà dự án cần nhất.

**Lỗi hậu quả: một cú bấm làm người đang sống biến mất.**

Ở giỗ Tổ, cây phả chiếu lên màn hình lớn (Addendum §C, Giai đoạn 2). Ai đó bấm "phả cổ". Tên của các bà, các cô, các chị đang ngồi dưới **biến mất khỏi màn hình trước mặt họ**. Cả các bà đã làm dâu 40 năm.

Không có ý đồ xấu nào cần thiết để chuyện này xảy ra — chỉ cần một người tò mò bấm thử. Và tính năng này được thiết kế để bấm thử.

**Sửa:**
1. Bỏ nhãn "phả cổ / phả mới". Đổi thành thứ mô tả đúng việc nó làm: **"xem theo dòng nối tiếp (thế thứ nam đinh)"** và **"xem đầy đủ"**.
2. Kể cả ở chế độ thế thứ, **phối ngẫu và con gái vẫn hiện** — chỉ khác ở chỗ dòng kế tiếp không đi qua họ. Đây vừa đúng phả cổ hơn, vừa không xóa ai.
3. Chế độ thế thứ **không dùng cho màn hình chung ở nhà thờ họ**; mặc định trình chiếu luôn là xem đầy đủ.
4. Việc này thuộc phàm lệ, không thuộc sở thích cá nhân — nếu họ chốt khác, làm theo họ, nhưng phải là họ chốt.

### 4.2 [NGHIÊM TRỌNG] FR-27 + FR-28 + FR-29 — dây chuyền in giấy đi chất vấn chuyện riêng của người thật

Đây là phát hiện tôi lo nhất, vì nó không nằm ở một FR nào mà nằm ở **chỗ ba FR nối vào nhau**, nên đọc từng cái thì không thấy.

Ghép lại:

- **FR-27** phát hiện "lỗ hổng": *node mồ côi*, ***thiếu phối ngẫu***, *người không rõ ngày mất*.
- **FR-28** biến mỗi phát hiện thành **nhiệm vụ giao cho trưởng chi**, ***in ra giấy được***, mang mã. *"Giấy là kênh phân phối thật ở giỗ họ."*
- **FR-29** sinh **bộ câu hỏi riêng cho từng cụ**, ***in khổ A4 chữ to*** để con cháu cầm về hỏi ông bà.

Kịch bản thật:

> Trong họ có một cháu bé, mẹ là người trong họ, cha không được ghi nhận. Hệ thống thấy một node **thiếu cha, thiếu phối ngẫu** — đúng định nghĩa "lỗ hổng" của FR-27.
> Nó sinh nhiệm vụ. Trưởng chi **in ra giấy**. Tờ giấy được **phát ở giỗ họ**, mang mã, có tên người, có câu hỏi.
> Ngồi trong sân giỗ họ hôm đó có người mẹ ấy.

Và một biến thể khác: FR-29 in phiếu **chữ to** để trẻ con cầm về hỏi ông bà, với câu hỏi máy tự sinh về "cụ có mấy bà", "bà hai tên gì", "cụ mất ngày nào".

Ba vấn đề chồng lên nhau:

**(a) Giấy đi vòng qua toàn bộ mô hình riêng tư.** FR-37/38 kiểm soát **hiển thị trên màn hình**. Tờ giấy không có phân quyền, không có bán kính, không có nhật ký. Một khi in ra, nó đi khắp sân giỗ họ và không thu hồi được. Mô hình riêng tư của PRD hiện **kết thúc ở mép màn hình**, trong khi PRD lại cố ý chọn giấy làm kênh phân phối chính cho nhóm cao niên.

**(b) Chữ "lỗ hổng" và "nợ" biến hoàn cảnh sống thành lỗi cần sửa.** Một người không lấy vợ không phải "thiếu phối ngẫu". Một đứa trẻ không có tên cha trong phả không phải "dữ liệu khuyết". Ngôn ngữ của FR-27 và FR-44 ("bảng nợ dữ liệu") coi mọi khoảng trống là sai sót phải lấp — mà một phần đáng kể các khoảng trống trong phả là **cố ý** hoặc là **chuyện đau của một nhà**.

**(c) Máy đặt câu hỏi thì không biết ngượng.** Người trong họ biết chuyện nào hỏi được, chuyện nào không, hỏi ai thì được, hỏi trước mặt ai thì không. Đó là tri thức xã hội tinh vi nhất trong một dòng họ, và FR-29 giao việc đó cho một bộ sinh câu hỏi tự động.

**Sửa — bắt buộc trước khi F6 được xây:**

1. **Không hệ thống nào tự sinh nhiệm vụ hay câu hỏi chạm tới người còn sống mà chưa qua người duyệt.** Mọi phiếu FR-28/FR-29 phải được **một người của Ban tu phả đọc và duyệt từng tờ** trước khi in. Đây là bước bắt buộc, không phải tùy chọn.
2. **Danh mục chủ đề cấm sinh tự động**: quan hệ cha con của người còn sống chưa được ghi nhận; hôn nhân đã tan; con ngoài giá thú; con nuôi chưa công khai; vợ lẽ của người còn sống hoặc mới mất; lý do một người rời họ.
3. **Đổi ngôn ngữ**: "lỗ hổng" → **"chỗ chưa khảo"**; "nợ dữ liệu" → **"phần chưa chép"**. Máy đang thiếu thông tin, không phải người đang thiếu bổn phận.
4. **Bản in mang dấu**: mọi tờ in ra có dòng chân trang ghi rõ phạm vi lưu hành và ngày, và **không chứa trường nhạy cảm của người còn sống** (ngày sinh đủ, địa chỉ, điện thoại) — tức là **NFR mới: bản in phải chịu cùng luật riêng tư như màn hình**.

### 4.3 [NGHIÊM TRỌNG] Con ngoài giá thú: PRD không có một chữ nào

Tìm khắp hai tài liệu: **không có**. FR-18 nhắc "con nuôi", §4 nhắc "dâu rể ngoại tộc", Q10 hỏi "dâu/rể/con nuôi vào phả thế nào". Con ngoài giá thú không xuất hiện.

Đây là khoảng trống nguy hiểm vì nó **không trung lập**: khi phàm lệ không nói gì, mặc định rơi về lệ cũ, mà lệ cũ ở đa số họ là không chép, hoặc chép mà không cho vào thế thứ. Phần mềm sẽ âm thầm thi hành lệ cũ mà không ai từng quyết định như vậy.

Cần nêu thành câu hỏi thẳng cho Ban tu phả, kèm các phương án thật mà các họ đang dùng:
- Chép đầy đủ như con trong giá thú (nhiều họ hiện nay chọn hướng này).
- Chép, có ghi chú theo thể thức phả cũ.
- Chép trong ngoại phả.
- Không chép, nhưng ghi nhận ở kho tồn nghi kín để đời sau xét.

Và một nguyên tắc kỹ thuật đi kèm: **trạng thái này phải là một trường riêng có mức riêng tư riêng**, không suy ra từ việc "thiếu cha" — vì suy ra chính là cách FR-27 tạo ra sự cố ở 4.2.

### 4.4 [NẶNG] Con nuôi bị gộp làm một — thiếu **thừa tự**, thiếu con riêng

PRD chỉ có "con nuôi". Phả Việt phân biệt ít nhất ba, và ba cái này **có địa vị khác hẳn nhau trong phả**:

| Loại | Nghĩa | Địa vị trong phả |
|---|---|---|
| **Con thừa tự / kế tự** | Nhận về **để nối dõi và giữ hương hỏa**, thường là cháu ruột trong tộc | **Vào thế thứ đầy đủ**, kế tự, có quyền và bổn phận của con trưởng nếu được chỉ định |
| **Con nuôi** | Nuôi dưỡng, không nhằm nối dõi | Tùy phàm lệ; thường chép có ghi chú |
| **Con riêng của vợ/chồng** | Mang huyết thống họ khác, sống trong nhà | Tùy phàm lệ; hay bị bỏ sót nhất |

Gộp cả ba vào một nhãn "con nuôi" gây hai hại: **hạ thấp** người con thừa tự (vốn là người gánh việc thờ cúng, địa vị cao), và **đẩy** người con riêng vào một nhãn có thể họ không muốn.

Ghi nhận **[TỐT]**: Addendum §B đã liệt kê `dtree` để *"vẽ cây đa-cha-mẹ (con nuôi/thừa tự)"* — phần phụ lục kỹ thuật ở đây tinh tế hơn thân PRD. Cần kéo nhận thức đó lên thân tài liệu và vào mô hình dữ liệu, vì **đa cha mẹ là một yêu cầu mô hình, không phải một lựa chọn thư viện vẽ**.

Chú thêm cho FR-26: mọi luật rà mâu thuẫn dựa trên sinh học (khoảng cách tuổi cha con, khoảng cách hai lần sinh) **phải tự tắt** trên cạnh nhận nuôi/thừa tự. Nếu không, mỗi người con thừa tự sẽ vĩnh viễn hiện lên như một lỗi dữ liệu cần sửa.

### 4.5 [NẶNG] Dâu góa, dâu tái giá, người ly hôn: phần mềm sẽ thi hành lệ cũ vì không ai nói khác

Lệ cũ ở nhiều họ: con dâu ở vậy thờ chồng được trọng vọng và chép trang trọng; con dâu tái giá đi nơi khác thì bị **xóa khỏi phả**. Ly hôn thì thường coi như chưa từng có.

Nếu phần mềm không có trạng thái cho những trường hợp này, người nhập liệu sẽ tự xử lý bằng cách **xóa** — và FR-39 (nhật ký truy vết) sẽ ghi lại rành mạch "ngày ... ông ... xóa bà ... khỏi phả". Đó là một dòng nhật ký không ai muốn tồn tại.

**Sửa:** phối ngẫu phải có **trạng thái quan hệ** (đang, đã mất, ly hôn, tái giá) thay vì bị xóa; mức hiển thị của trạng thái đó do phàm lệ quyết; và với người còn sống, **người trong cuộc có tiếng nói** về việc hiển thị. Nguyên tắc kỹ thuật: **không bao giờ xóa cứng một con người** — chỉ đổi trạng thái và mức hiển thị. Điều này cũng bảo vệ chính dữ liệu của họ.

Ngoài ra: con của một cuộc hôn nhân đã tan **vẫn là con cháu trong họ**, và đường quan hệ của cháu không được đứt theo. Nếu xóa mẹ thì cháu thành node mồ côi — rồi FR-27 lại phát hiện "lỗ hổng" và sinh nhiệm vụ đi hỏi. Vòng lặp gây tổn thương lần thứ hai.

### 4.6 [NẶNG] Người rời họ, và quyền của người sống không muốn có tên

PRD không có gì cho ba trường hợp này:

**(a) Người xin rút khỏi phả.** Một thành viên còn sống nói: tôi không muốn tên tôi, ảnh tôi, con tôi trên đó. Hiện tài liệu không có đường nào cho yêu cầu này. FR-40 cho **tải về** dữ liệu của mình, không cho **rút** nó. Và §1 của PRD nói thẳng *"dữ liệu là của chung theo mô hình tông tộc"* — một lập trường có cơ sở văn hóa, nhưng va thẳng vào mong muốn chính đáng của cá nhân, và ở đây văn hóa không đứng một mình: có người rời họ vì bạo lực gia đình, vì tranh chấp, vì lý do an toàn.

Đề nghị một nguyên tắc phân đôi, đủ rõ để ghi vào phàm lệ:

> **Người đã khuất thuộc về dòng họ. Người đang sống giữ quyền về mình.**
> Người còn sống, đã thành niên, có quyền yêu cầu **ẩn** hồ sơ của mình khỏi mọi chế độ xem trừ Ban tu phả, và ẩn thông tin liên lạc vô điều kiện. Quan hệ huyết thống thì giữ (để cây không đứt), nhưng hiện dưới dạng khuyết danh. Không ai phải giải thích lý do.

**(b) Người theo họ mẹ, người đổi họ.** Ngày càng nhiều. Không có trường nào.

**(c) Người từng bị họ khai trừ.** Lịch sử phả Việt có chuyện xóa tên khỏi phả như một hình phạt. Nếu tư liệu cũ có dấu vết này, hệ thống chép lại thế nào? Đề nghị: chép **sự việc** như một khẳng định lịch sử có nguồn (họ đã quyết như vậy năm nào), chứ không **thi hành** nó (không xóa người khỏi cây). Đây là chỗ phân biệt giữa ghi lại lịch sử và tiếp tục lịch sử.

### 4.7 [NẶNG] Bán kính họ hàng khóa chặt nhất đúng người đóng góp nhiều nhất — con dâu

Đặt ở đây thay vì §5 vì đây là hệ quả của việc mô hình dữ liệu coi dâu rể là người ngoài.

FR-37: *"Mức hiển thị ... tự tính theo bậc quan hệ — trong 3 đời thấy đủ, ngoài ra thấy ít."*

Con dâu **không có bậc quan hệ huyết thống nào** với nhà chồng. Khoảng cách của bà, theo bất kỳ thuật toán đường đi nào chỉ chạy trên cạnh huyết thống, là **vô hạn**. Nghĩa là:

> Bà làm dâu 40 năm, thuộc lòng ngày giỗ từng cụ, là người thật sự sắp cỗ và thắp hương — và là người mà hệ thống hạn chế nhiều nhất, vì bà "ở ngoài bán kính".

Trong khi một người cháu trong họ chưa từng về quê lần nào thì thấy đủ.

Đây không chỉ là bất công về mặt cảm xúc; nó là **sai về mặt sản phẩm**: trong hầu hết các dòng họ Việt, người phụ nữ trong nhà chính là người nhớ ngày giỗ, nhớ họ hàng, nhớ ai là con ai. Đây là nhóm đóng góp dữ liệu tốt nhất mà PRD đang vô tình khóa cửa.

**Sửa:** phối ngẫu **thừa hưởng bán kính của người phối**. Một dòng luật, sửa được cả vấn đề văn hóa lẫn vấn đề tăng trưởng dữ liệu.

---

## 5. Riêng tư người sống (FR-37, FR-38)

### 5.1 [TỐT] Ý tưởng nền là đúng, và đúng hơn cả mô hình phương Tây

*"Người dùng không phải chỉnh setting nào"* — quyết định đúng cho nhóm người dùng thật. Bắt một cụ 80 tuổi hoặc một chị 41 tuổi trên xe buýt tự cấu hình quyền riêng tư là bảo đảm chắc chắn quyền riêng tư sẽ không được cấu hình. Mặc định thông minh là hướng đúng.

Và Addendum §B chọn học **webtrees** cho mô hình riêng tư per-person là lựa chọn tham chiếu chính xác — đó thật sự là mô hình living/dead trưởng thành nhất trong mã nguồn mở.

### 5.2 [NẶNG] "Bán kính 3 đời" là đơn vị tự chế, trong khi tiếng Việt đã có sẵn đơn vị chuẩn

"Trong 3 đời" nghe hợp lý nhưng mơ hồ: 3 đời tính lên, tính xuống, hay tính qua tổ chung? Ba đời từ tôi lên là cụ; ba đời qua tổ chung là anh em con chú con bác. Khác nhau rất xa.

Văn hóa Việt đã có sẵn **hai thang đo kinh điển**, và dùng chúng vừa chính xác hơn vừa được các cụ công nhận ngay:

| Thang | Nghĩa | Dùng làm gì |
|---|---|---|
| **Ngũ phục** (trảm thôi, tư thôi, đại công, tiểu công, ti ma) | Năm bậc tang phục — thang đo mức thân sơ chính thức của họ hàng, từng có hiệu lực trong luật Lê và luật Nguyễn | Thang đo bán kính chuẩn xác nhất |
| **"Trong năm đời"** (ngũ đại) | Lệ *ngũ đại mai thần chủ*: quá năm đời thì thần chủ chôn đi, thờ chung ở nhà thờ họ | Ranh giới tự nhiên giữa "họ gần" và "họ chung" |

Dùng **"trong năm đời"** thay cho "3 đời" tự chế có ba cái lợi: đúng lệ, giải thích được cho các cụ trong một câu, và trùng với đúng ranh giới mà người trong họ vẫn cảm nhận.

### 5.3 [NẶNG] Bán kính thuần phả không khớp với sự thân sơ thật

Ba ca sai, cả ba đều thường gặp:

**(a) Người cùng làng, xa phả.** Một người họ hàng đời thứ sáu nhưng ở cạnh nhà, gặp nhau hằng ngày, cùng lo việc họ — hệ thống xếp ra ngoài. Một người đời thứ ba nhưng cả họ chưa gặp bao giờ — hệ thống mở hết.

**(b) Con dâu.** Đã nói ở 4.7.

**(c) Bán kính phụ thuộc vào cây đúng.** Nếu cạnh cha-con của A còn ở mức tồn nghi thì bán kính của A tính sai — có thể **lộ dữ liệu** (nếu hệ thống lạc quan) hoặc **chặn oan** (nếu bi quan). Cùng một lỗi kiến trúc với 2.1.

**Sửa:**
- Bán kính = **giá trị lớn nhất** của: khoảng cách phả, **cùng chi**, **cùng địa phương**, và **thừa hưởng qua phối ngẫu**. Cùng chi nên mở gần như đầy đủ — chi là đơn vị sinh hoạt thật.
- Khi đường quan hệ đi qua khẳng định chưa `chắc chắn`, **luôn chọn diễn giải hạn chế hơn**. Riêng tư thì bi quan; xưng hô thì im lặng.

### 5.4 [NGHIÊM TRỌNG] Băng ghi âm gốc: giữ vĩnh viễn, không ai nói ai được nghe

FR-8: *"**Băng gốc luôn được giữ**"*. NFR-1 xếp băng vào loại **không được mất**. Đúng cả hai. Nhưng không dòng nào trong hai tài liệu nói **ai được nghe lại**.

Một cụ 84 tuổi ngồi kể 6 phút (UJ-1) sẽ không nói như đọc hồ sơ. Cụ sẽ nhắc chuyện hai nhà giận nhau năm nào, chuyện ai là con ai mà cả họ tránh nói, chuyện bà hai của cụ nào đó, chuyện một người cháu hư. Cụ nói với **đứa cháu ruột đang ngồi cạnh**, trong bối cảnh ấy.

Rồi băng đó được lưu vĩnh viễn, sao lưu ra **5 người ở 5 nơi khác nhau** (NFR-2), và không có quy định truy cập.

Đây là rủi ro nặng nhất về riêng tư trong cả dự án, và nó nằm ở đúng tính năng mà dự án tự hào nhất.

**Sửa — bắt buộc trước khi FR-8 chạy:**
1. **Xin phép trước khi ghi**, bằng lời, ghi vào đầu băng: ghi để làm gì, ai được nghe, cụ có quyền yêu cầu bỏ đoạn nào.
2. **Băng gốc mặc định ở mức kín nhất**: chỉ người ghi, người kể, và Ban tu phả. Không nằm trong gói sao lưu phân tán NFR-2 gửi 5 người, hoặc nếu có thì phải **mã hóa riêng**.
3. **Quyền niêm phong một đoạn**: người kể (hoặc con cháu trực hệ sau khi cụ mất) yêu cầu niêm phong một khoảng thời gian trong băng. Niêm phong chứ không xóa — đúng tinh thần "không mất dữ liệu", nhưng có khóa.
4. Khẳng định trích từ băng vẫn trỏ về đoạn băng (đúng như FR-8 thiết kế, rất tốt) — nhưng **quyền nghe đoạn đó tuân theo mức của băng**, không tuân theo mức của khẳng định.

### 5.5 [NẶNG] FR-17 "cây bằng khuôn mặt" — ba vấn đề chồng nhau

> *"Node là ảnh chân dung... Ai chưa có ảnh hiện bóng xám — **tạo áp lực xã hội** đi tìm ảnh, chi phí bằng không."*

**(a) Áp lực xã hội để đăng ảnh người sống mâu thuẫn với FR-37/38.** Cả một cơ chế được thiết kế để ép người ta đăng ảnh — trong đó có ảnh **phụ nữ** và ảnh **trẻ em** (FR-38 nói trẻ vị thành niên "ẩn chặt hơn", nhưng FR-17 lại đẩy theo hướng ngược). Hai FR này kéo hai chiều mà tài liệu không nhận ra.

**(b) Ảnh người đã khuất là ảnh thờ, có lệ riêng.** Ảnh dùng thờ phải là chân dung nghiêm trang; không dùng ảnh cưới, ảnh vui, ảnh chụp chung cắt ra. Nhiều nhà kiêng để ảnh người sống và người đã khuất chung một khung. Một lưới ảnh trộn lẫn người sống và người đã khuất, không phân biệt, sẽ đọc như một bức tường ảnh thờ đặt sai chỗ.

**(c) "Bóng xám" cho các cụ đời xa là bất khả và bất kính.** Từ đời 1 đến đời 8, 9 sẽ **không bao giờ có ảnh** — nhiếp ảnh chưa tới Việt Nam. Nghĩa là toàn bộ phần gốc của cây, gồm cả cụ Thủy tổ, sẽ hiện lên như một hàng bóng xám khuyết thiếu. Cụ Thủy tổ của dòng họ hiện lên như một cái bóng xám, ngay giữa nhà thờ họ.

**Sửa:**
1. Người không thể có ảnh (mất trước khoảng 1930, hoặc do họ chốt) → không dùng bóng xám mà dùng **thẻ tên theo thể thức phả**: chữ Hán tên húy nếu có, viền trang trọng, ngày kỵ. Trang nghiêm, không khuyết thiếu. Đây cũng là thứ đẹp hơn hẳn về mặt thiết kế.
2. **Phân biệt thị giác người đã khuất và người đang sống** theo lệ phả (phả cũ luôn đánh dấu ngày mất). Không trộn.
3. Áp lực xã hội chỉ áp cho **người đã khuất trong thời kỳ có ảnh**. Với người đang sống, ảnh là **tự nguyện**, không có ô trống nào ngụ ý thiếu sót.

### 5.6 [CẦN SỬA] Thiếu vài trường nhạy cảm đặc thù Việt

FR-38 nêu: ngày sinh đầy đủ, địa chỉ, số điện thoại. Thiếu:

- **Giờ sinh (giờ can chi)** — phả cũ chép giờ sinh, và giờ sinh của **người đang sống** là dữ liệu xem tử vi, xem tuổi, kén dâu kén rể. Nhiều người rất ngại lộ. Phải ẩn mặc định như ngày sinh.
- **Nơi táng của người mới mất** — nhạy cảm trong thời gian chưa cải táng.
- **Tình trạng hôn nhân, số lần kết hôn** của người đang sống.
- **Tình trạng sức khỏe / nguyên nhân mất** nếu người nhập có ghi.

Và một quyền cần có dù FR-37 chủ trương "không phải chỉnh setting": **một nút duy nhất, đơn giản, để một người nói "đừng hiện cái này của tôi"**. Không phải bảng cấu hình — một nút, trên chính hồ sơ của mình. Mặc định thông minh cho 95% người; nút thoát cho 5% có lý do riêng, mà lý do đó thường là lý do nghiêm trọng.

---

## 6. Lễ nghi: giỗ, chạp, tảo mộ, văn khấn, ngày âm

### 6.1 [NGHIÊM TRỌNG] "Văn khấn gợi ý" (FR-41) — câu nguy hiểm nhất trong cả PRD

Cả tính năng nằm gọn trong nửa dòng: *"nhắc trước 1 tuần kèm tiểu sử cụ và **văn khấn gợi ý**"*. Không có FR riêng, không có ràng buộc, không nằm dưới NFR-6.

Vì sao đây là chỗ nguy hiểm nhất:

**(a) NFR-6 không phủ được văn khấn.** NFR-6 cấm AI *"trình bày như sự thật phả hệ"* điều không có nguồn. Văn khấn **không phải mệnh đề sự thật** — nó là **lời nói trong nghi lễ**. Nó lọt qua kẽ NFR-6 hoàn toàn, trong khi hậu quả của việc sai lại nặng hơn một dòng dữ liệu sai.

**(b) Văn khấn thay đổi theo người khấn, không theo người được khấn.** Cùng một cụ, người khấn khác nhau thì xưng hô khác nhau: con thì "hiển khảo / hiển tỷ"; cháu thì "hiển tổ khảo / hiển tổ tỷ"; chắt thì "hiển tằng tổ khảo"; chút thì "hiển cao tổ khảo". Một bản văn khấn gửi đại trà qua thông báo cho cả họ sẽ **sai vai với gần như tất cả người nhận**, trừ đúng một lớp.

**(c) Cần đúng tên, mà tên thì §1.4 đã chỉ ra là đang thiếu.** Văn khấn cần **tên húy / tên thụy / tên hèm** — không phải tên trên giấy tờ. FR-12 không có hai trong ba tên đó.

**(d) Còn cần: ngày tháng năm âm lịch đúng, địa chỉ tín chủ, và tên người chủ tế.** Chủ tế là ai lại phụ thuộc vào chuyện trưởng thứ, tức là vào đúng thứ có thể đang tranh chấp (§3.1).

**(e) Không phải chi nào cũng khấn.** Xem 6.6.

**Sửa — đề nghị nâng thành ràng buộc ngang hàng NFR-6:**

> **NFR-12 — Văn bản lễ nghi không do máy sáng tác.**
> Văn khấn, văn tế, cáo phó, điếu văn, văn bia, hoành phi, câu đối chỉ được sinh ra bằng cách **điền dữ liệu đã xác minh vào mẫu do người của dòng họ soạn và duyệt**. Không có sinh tự do. Mọi mẫu phải được cụ cố vấn nội dung hoặc Ban tu phả duyệt và ký tên trước khi đưa vào hệ thống. Không mẫu nào tự động phát đi mà chưa có người duyệt.
> Bản văn khấn hiển thị phải **biết người đang xem là ai** và chọn đúng cách xưng của lớp người đó — hoặc, nếu không xác định được, hiện mẫu chung kèm hướng dẫn thay chữ, chứ không đoán.

Và một khuyến nghị về hình thức: **đừng gửi văn khấn trong thông báo đẩy**. Đặt nó ở một trang riêng, trình bày trang trọng, in được. Cách trình bày là một phần của sự tôn trọng.

### 6.2 [NẶNG] Lịch âm: bốn ca sai mà `amlich.js` không tự lo được

Chọn **`amlich.js` của Hồ Ngọc Đức** là lựa chọn đúng **[TỐT]** — đây là thư viện tính đúng lịch âm **Việt Nam** (múi giờ UTC+7), khác lịch Trung Quốc, và sự khác biệt đó thật sự làm lệch ngày ở một số năm.

Nhưng bốn ca sau là **luật của dòng họ**, không phải phép tính, và PRD không nhắc ca nào:

**(a) Ngày kỵ rơi vào ngày 30 của tháng thiếu.** Cụ mất ngày 30 tháng 7 âm. Có năm tháng 7 chỉ có 29 ngày. Làm giỗ ngày 29 hay mùng 1? Các họ chọn khác nhau. **Phải là tham số phàm lệ.**

**(b) Tháng nhuận.** Cụ mất trong tháng nhuận. Năm sau không có tháng nhuận đó. Giỗ vào tháng chính hay tháng nhuận gần nhất? Lại là lệ họ.

**(c) Giờ mất sau 23 giờ.** Theo can chi, giờ Tý bắt đầu từ 23 giờ và **thuộc về ngày hôm sau**. Một người mất lúc 23g30 ngày 10 dương có thể có ngày kỵ âm là ngày 11. Nếu hệ thống quy đổi theo ngày dương thuần túy thì sai một ngày — và làm giỗ sai ngày là lỗi rất nặng.

**(d) Cụ mất trước 1968, và giấy tờ ghi ngày âm.** Miền Bắc đổi múi giờ tính lịch cuối những năm 1960; có thời điểm hai miền tính lịch âm lệch nhau một ngày (rõ nhất ở Tết Mậu Thân). Nghĩa là với các cụ mất quanh giai đoạn đó, ngày âm ghi trong sổ nhà **không nhất thiết khớp** với ngày âm mà thư viện tính ra từ ngày dương.

**Nguyên tắc sửa, quan trọng hơn cả bốn ca:**

> **Ngày kỵ là một dữ kiện được dòng họ ghi nhận, không phải một giá trị máy tính ra.**
> Nếu trong nhà đã có ngày giỗ dùng bao đời nay, hệ thống **chép lấy ngày đó**, không tính lại và tuyệt đối không "sửa" nó. Quy đổi chỉ dùng để *gợi ý* khi chưa có ngày, và luôn hiện cả hai (âm và dương) kèm nguồn.

Nếu vi phạm nguyên tắc này, sản phẩm sẽ đi nói với các cụ rằng ngày giỗ nhà mình lâu nay là sai. Đó là kịch bản mất uy tín nhanh nhất có thể tưởng tượng.

### 6.3 [NẶNG] Mô hình dữ liệu không có ngày kỵ, cũng không có phần mộ

Rà FR-1: ví dụ về khẳng định là *"ngày sinh, quan hệ cha-con, tên húy"*. Rà cả MVP §8.1: không có gì về ngày mất hay mộ phần.

Nhưng **mọi cuốn phả Việt** đều chép, cho từng người, theo công thức gần như cố định:

> Ông húy ..., tự ..., hiệu ..., con thứ ... của cụ ...
> Sinh giờ ... ngày ... tháng ... năm ...
> **Tốt (mất) ngày ... tháng ... năm ...** — tức **ngày kỵ**
> **Mộ táng tại xứ ..., xã ...** — đã cải táng hay chưa
> Phối bà họ ..., hiệu ..., con gái cụ ... người xã ...
> Sinh hạ ... trai ... gái

Năm trường đang thiếu hoặc không được nêu trong mô hình dữ liệu, mà **cả năm đều là trường bậc nhất**:

| Trường | Vì sao thiết yếu |
|---|---|
| **Ngày kỵ (ngày mất âm)** | FR-41 không chạy được nếu không có nó. Đây là trường được dùng nhiều nhất trong đời sống thật của một cuốn phả. |
| **Nơi táng / phần mộ** | Trường được dùng nhiều thứ hai — **chạp họ và tảo mộ chạy bằng trường này**. Hiện chỉ nằm trong backlog dưới dạng "QR mộ phần". |
| **Thứ tự trong anh em (con thứ mấy)** | Quyết định xưng hô (§2.4) và quyết định trưởng/thứ (§3.3). |
| **Bậc của người phối (chính/kế/thứ)** | Xem 1.3. |
| **Quê quán / nơi sinh sống** | Nền của bán kính theo địa phương (5.3) và của mọi câu chuyện di cư. |

Đề nghị đưa **ngày kỵ** và **nơi táng** vào MVP §8.1. Chúng rẻ để làm bây giờ và đắt để thêm sau, và nếu Giai đoạn 1 đi thu thập dữ liệu mà không hỏi hai trường này thì sẽ phải đi hỏi lại — hỏi lại các cụ là thứ dự án không có nhiều cơ hội để làm.

### 6.4 [NẶNG] Chạp họ và tảo mộ bị bỏ quên — trong khi đó thường là dịp đông người nhất

Cả PRD tập trung vào **giỗ Tổ**: ra mắt ở giỗ Tổ (Addendum §C), công bố ấn bản mỗi giỗ Tổ, demo QR ở giỗ Tổ. Nhưng ở rất nhiều dòng họ miền Bắc, **chạp họ / chạp mả tháng Chạp** mới là dịp đông người nhất và là dịp con cháu đi xa về đủ nhất — vì nó ngay trước Tết.

Ba việc nên bổ sung:

- **Lịch việc họ, không chỉ lịch giỗ.** Giỗ Tổ, chạp họ, tảo mộ, thanh minh (nếu họ có lệ), khánh thọ các cụ. FR-41 hiện chỉ tính giỗ cá nhân.
- **Ngày giỗ Tổ và chạp họ do họ ấn định, không do máy tính.** Nhiều họ chọn một ngày cố định thuận cho con cháu, không nhất thiết trùng ngày kỵ của cụ. Hệ thống phải cho **đặt tay** và không được "sửa lỗi".
- **Chạp họ là dịp thu dữ liệu tốt nhất trong năm** — đông người, có mặt các cụ, đang ở ngay tại mộ. Nếu "Chiến thuật $0" của Addendum §C nhắm vào chạp họ thay vì chỉ giỗ Tổ, số liệu sẽ về nhanh hơn nhiều.

### 6.5 [NGHIÊM TRỌNG] FR-46 "Cửa sổ 49 ngày" — ý tưởng đúng, thực thi hớ ở ba chỗ

Trước hết ghi nhận: **[TỐT]** — nhận ra rằng ký ức về một người dồi dào nhất đúng lúc vừa mất, và đó cũng là lúc không ai nghĩ tới nhập liệu, là một quan sát sắc sảo và nhân văn. Đây xứng đáng là một tính năng.

Ba chỗ hớ:

**(a) Ngôn ngữ thương mại đặt lên tang lễ.** "Cửa sổ", "mở 49 ngày", "**hết hạn**". Ngày thứ 49 là **lễ chung thất** — một trong những mốc quan trọng nhất của tang chế, ngày gia đình làm lễ lớn. Một thông báo "đã hết hạn" rơi vào đúng ngày ấy là điều không thể để xảy ra.

**(b) 49 ngày không phải hết. Nó chỉ là mốc thứ ba.** Chuỗi thật dài hơn nhiều: **3 ngày (mở cửa mả) → 49 ngày (chung thất) → 100 ngày (tốt khốc) → giỗ đầu (tiểu tường) → giỗ hết (đại tường, hết tang) → cải táng**. Ký ức tiếp tục nổi lên ở từng mốc, đặc biệt ở giỗ đầu. Đóng cửa ở ngày 49 là cắt đúng lúc dòng chảy còn đang mạnh.

**(c) Tự động biên tiểu truyện và đưa vào Tộc Sử là vượt quyền.** *"hết hạn, hệ thống biên tiểu truyện đưa vào Tộc Sử"* — máy viết tiểu sử một người vừa mất, rồi tự đăng, không ai duyệt. Với gia đình người mất, đây là một văn bản có sức nặng ngang một bài điếu. Không thể để máy tự công bố.

**Sửa:**
1. Không dùng chữ "hết hạn". Không có thời điểm đóng — trang tưởng niệm **mở mãi**, chỉ **cường độ nhắc** giảm dần, và nhắc lại nhẹ ở **100 ngày** và **giỗ đầu**.
2. Nhịp nhắc bám mốc tang chế, và **im lặng đúng ngày lễ** (ngày 49, ngày 100, giỗ đầu) — hôm đó nhà đang làm lễ, không phải lúc nhận thông báo app.
3. Bản tiểu truyện là **bản thảo riêng tư gửi cho gia đình** (trưởng nam hoặc người chủ tang), có sửa và có duyệt. **Chỉ đăng khi gia đình đồng ý.**
4. Tính năng chỉ được kích hoạt khi **gia đình cho phép**, không phải khi hệ thống biết có người mất.

### 6.6 [NGHIÊM TRỌNG] Hệ thống có thể loan tin buồn trước khi gia đình phát tang

Không FR nào cấm điều này, và ít nhất hai FR đẩy tới nó: FR-14 (*"Người mới vào phả → cả họ nhận tin"*) thiết lập thói quen loan tin tự động; FR-46 giả định hệ thống biết ai vừa mất.

Trong tang lễ Việt, **thứ tự báo tin là việc nghiêm ngặt**: gia đình bàn, chọn giờ, cử người, ra **cáo phó** đúng thể thức, báo họ hàng theo thứ tự thân sơ. Một cái thông báo tự động của phần mềm chạy trước cáo phó là một sự xúc phạm rất cụ thể, và nó rơi vào đúng lúc gia đình dễ tổn thương nhất.

**Sửa — đề nghị thành ràng buộc cứng:**

> **Hệ thống không bao giờ tự loan tin một người qua đời.** Việc đánh dấu một người đã mất chỉ do người được gia đình ủy quyền thực hiện, và việc thông báo ra họ là **một hành động riêng, do người bấm**, sau khi gia đình đã phát tang. Trong thời gian giữa hai việc đó, dữ liệu chỉ Ban tu phả thấy.

**Và một yêu cầu đi kèm — chế độ tang chế.** Hiện có bốn cơ chế "nhịp sống" mang giọng vui: FR-14 (*"biến nhập liệu thành sự kiện vui"*, nhánh mới **sáng lên**), FR-42 (đèn chi), FR-44 (bảng nợ dữ liệu), FR-45 (điểm công đức). Khi một chi đang có tang, những thứ này phải **tắt cho chi đó**. Một cái thông báo mừng hoặc một bảng xếp hạng hiện lên trong nhà đang có tang là điều không ai trong họ tha thứ. Không có gì trong PRD nói tới điều này.

### 6.7 [NẶNG] "Đèn Chi" (FR-42) mượn đúng biểu tượng cấm kỵ nhất

> *"Mỗi chi một ngọn đèn trên trang chủ: sáng khi chi có cập nhật trong 90 ngày, **mờ dần khi im lặng**."*

Về mặt kỹ thuật đây là một chỉ số hoạt động. Về mặt biểu tượng trong văn hóa thờ cúng, đây là điều ngược lại của tất cả những gì người ta cố giữ:

- **Đèn trên bàn thờ không được để tắt** — đó là lệ, không phải thẩm mỹ. Đèn tắt, hương lạnh là hình ảnh của một dòng không còn ai thờ cúng.
- **"Tuyệt tự"**, **"hương tàn khói lạnh"** là những chữ nặng nhất có thể nói về một chi.

Đặt trên trang chủ một hàng đèn, trong đó **đèn của chi 3 đang tối dần**, hiển thị cho cả họ xem, là tuyên bố công khai rằng chi 3 đang lụi. Và nếu chi đó vắng chỉ vì con cháu ở xa hoặc không dùng web — đúng nhóm cao niên mà PRD đã nhận là bị web loại (§10) — thì hệ thống đang trừng phạt họ vì một điều họ không gây ra, bằng ẩn dụ đau nhất trong vốn từ của họ.

**Sửa:** giữ cơ chế, đổi ẩn dụ. Cái cần đo là *sức sống*, mà văn hóa Việt có sẵn ẩn dụ sức sống rất đẹp và **không có chiều âm**: cây, cành, lộc, mùa. Một chi lâu chưa cập nhật thì hiện *"chi ... lâu chưa có tin"* — và tốt hơn nữa là biến nó thành lời mời chứ không phải chẩn đoán. Và dù chọn ẩn dụ nào: **không bao giờ xếp cạnh nhau các chi để so sánh trên trang chủ.**

### 6.8 [NẶNG] FR-44 "bảng nợ dữ liệu" — chữ "nợ" quá nặng trong bối cảnh này

PRD đã tự đánh dấu **[ASSUMPTION]** cho giả thuyết *"xấu hổ mạnh hơn khen thưởng trong văn hóa họ"* và đề nghị thử nghiệm. Tôi đề nghị **nâng mức**: đây không chỉ là giả thuyết chưa kiểm chứng, nó là giả thuyết có **mặt trái không đối xứng** — nếu đúng thì được thêm ít dữ liệu; nếu sai thì hỏng quan hệ giữa hai chi, và quan hệ giữa hai chi trong một dòng họ thì không sửa được bằng bản cập nhật phần mềm.

Thêm nữa, chữ **"nợ"** trong ngữ cảnh dòng họ đọc thành **nợ với tổ tiên** — tức là một cáo buộc về đạo hiếu, không phải một chỉ số hoàn thành công việc.

**Sửa:** bảng "phần chưa chép" hiện **riêng cho từng chi, chỉ chi đó thấy**, kèm gợi ý việc cụ thể. Không có bảng so sánh chéo ở bất kỳ đâu công khai. Ban tu phả thấy toàn cảnh — đó là đủ.

### 6.9 [CẦN SỬA] "Điểm công đức" (FR-45) dùng nhầm một từ đã có nghĩa cố định

**Công đức** trong sinh hoạt dòng họ và đình chùa là chuyện rất cụ thể: **sổ công đức** ghi tiền và hiện vật người ta dâng để tu sửa nhà thờ, làm mộ tổ, in phả; danh sách thường được đọc lên hoặc khắc bia. Nó có sổ thật, có thủ quỹ thật, và đôi khi có tranh cãi thật.

Dùng lại đúng chữ đó cho điểm thưởng khi tải ảnh lên gây hai vấn đề: **trùng với sổ công đức thật của họ** (người ta sẽ hỏi cái nào là cái nào), và **tầm thường hóa** một từ đang mang nghĩa nặng.

**Sửa:** dùng **"sổ ghi công"** hoặc **"ghi nhận đóng góp"**. Và không xếp hạng — ghi nhận theo việc, không theo bảng cao thấp.

Ghi nhận **[TỐT]** trong cùng FR: *"Tên người dâng tư liệu in vào chân trang Tộc Sử"* — đây đúng là lệ của phả và của bia, làm đúng chỗ, và có sức khích lệ thật hơn mọi điểm số.

### 6.10 [CẦN SỬA] QR ở nhà thờ họ và "bản in thử đặt lên bàn thờ"

Addendum §C, Giai đoạn 2 có hai chi tiết cần chỉnh:

**(a) *"QR dán tại nhà thờ họ"*** — dán được, nhưng phải xin phép trưởng họ, và **tuyệt đối không dán lên hương án, bàn thờ, hoành phi, câu đối, cột**. Chỗ đúng là bảng tin, cổng, sân, hoặc một tấm biển rời. Nên ghi rõ trong tài liệu, vì người đi dán sẽ là một bạn trẻ.

**(b) *"Bản in thử đặt lên bàn thờ"*** — ý tưởng đúng (với các cụ, cuốn sách là bằng chứng dự án nghiêm túc), nhưng **"bản in thử"** thì không đặt lên bàn thờ được. Đồ đặt lên bàn thờ phải là đồ hoàn chỉnh và trang trọng.

Cách làm đúng, và mạnh hơn nhiều: làm **một bản in trang trọng, đóng bìa**, rồi **trình lên tổ tiên bằng một lễ nhỏ** — có người khấn, có trưởng họ đứng. Đây là điều dòng họ tự làm được và tự thấy ý nghĩa; nó biến buổi ra mắt phần mềm thành một việc của họ, không phải một buổi giới thiệu sản phẩm.

**(c) UJ-4 *"cùng quét một mã QR trên bàn"*** — chữ "bàn" ở nhà thờ họ dễ đọc thành bàn thờ. Đổi thành "bàn tiếp khách" hoặc "biển ở sân".

### 6.11 [NẶNG] PRD giả định cả dòng họ theo cùng một lối thờ cúng

Không có một chữ nào về tôn giáo trong hai tài liệu. Nhưng nhiều dòng họ Việt — nhất là ở miền Bắc — có **chi theo Công giáo**, và với các chi đó, việc tưởng nhớ tổ tiên diễn ra theo cách khác: có lễ cầu hồn, có ngày giỗ nhưng không khấn vái theo lối ấy, không có bàn thờ gia tiên theo cùng thể thức. Cũng có gia đình theo đạo Phật thuần, có gia đình gần như không hành lễ.

Nếu hệ thống đẩy văn khấn và ngôn ngữ nghi lễ đồng loạt cho cả họ, các chi ấy sẽ thấy mình bị đặt ra ngoài — mà họ vẫn là con cháu trong họ.

**Sửa:** mỗi gia đình/chi chọn **lối tưởng niệm** (mặc định theo lệ chung của họ, sửa được). Lịch và nội dung nhắc thay đổi theo lựa chọn đó. Nội dung lễ nghi luôn là **gợi ý có thể tắt**, không bao giờ là mặc định bắt buộc.

---

## 7. Ranh giới đạo lý (§7)

### 7.1 [TỐT] Những gì đã loại thì loại đúng, và loại vì lý do đúng

Danh mục §7 hiếm gặp ở mức đáng khen: không giả giọng người đã khuất, không persona AI tổ tiên, không phục chế ảnh gia tiên bằng AI, không morph chân dung đời nối đời, không nhận diện khuôn mặt tự động, và NFR-6 cấm AI bịa.

Ba điểm đặc biệt đáng giữ:

- **Phân biệt "thu giọng thật thì được, tổng hợp thì không"** — đúng ranh giới, và đặt đúng chỗ.
- **FR-10 biến việc gắn tên thủ công thành lợi thế** chứ không phải sự đánh đổi: *"vừa bảo vệ riêng tư vừa biến việc gắn tên thành hoạt động tập thể"*. Đây là suy nghĩ đúng — công nghệ bị bỏ đi lại làm sản phẩm tốt lên, vì việc ngồi cùng nhau chỉ mặt trong ảnh cũ chính là việc dòng họ cần.
- **FR-31 in nghiêng và gắn nhãn cho câu suy đoán, hiện tỷ lệ có nguồn mỗi chương.** Đây là mức trung thực cao hơn nhiều sản phẩm thương mại, và nó nói đúng ngôn ngữ mà một cuốn phả nghiêm túc dùng.

Trục chung của danh mục này là **chống mạo danh** — không ai được nói thay người đã khuất. Trục đó đúng. Vấn đề là nó **chỉ có một trục**, trong khi còn ít nhất ba loại rủi ro khác đang lọt.

### 7.2 [NGHIÊM TRỌNG] Lọt: văn bản lễ nghi do AI sáng tác

Đã trình bày ở 6.1. Nhắc lại ở đây vì đây là **lỗ hổng lớn nhất của §7**: ranh giới hiện vạch quanh *"nói thay người đã khuất"*, mà rủi ro còn lại là *"soạn thay lời nghi lễ của người đang sống"*.

Trong Addendum §E đã nằm sẵn: *"Sinh cáo phó & điếu văn đúng vai vế"*, *"Sinh văn bia, hoành phi, câu đối"*. Cộng với "văn khấn gợi ý" đang nằm trong FR-41 — tức là **đã ở trong phạm vi, không phải backlog**.

Một câu đối sai luật bằng trắc, một vế đối chơi chữ vô ý phạm húy, một bài cáo phó xưng sai vai — những thứ này hoặc được **khắc lên gỗ và treo ở nhà thờ họ**, hoặc được **đọc trước quan khách**. Sai thì không sửa được và cả làng chứng kiến.

Đề nghị bổ sung vào §7 hai dòng:

- ❌ **AI sáng tác văn bản lễ nghi** (văn khấn, văn tế, cáo phó, điếu văn, văn bia, hoành phi, câu đối). Chỉ điền mẫu do người soạn, người duyệt — xem **NFR-12** đề xuất ở 6.1.

### 7.3 [NGHIÊM TRỌNG] Lọt: gợi ý quan hệ huyết thống, và đặc biệt là ADN

Addendum §E có: *"Nhận họ (matching người thất lạc)"* và *"**Khung nhập kết quả ADN cho Việt kiều nhận họ**"*. §D benchmark ca ngợi *"Hint matching AI"* của MyHeritage. §7 không nói gì.

Đây là loại rủi ro nặng nhất mà một nền tảng gia phả có thể gặp, và ngành gia phả thế giới đã học bằng bài học đắt:

**(a) ADN phát hiện những chuyện không ai đi tìm.** Xét nghiệm huyết thống thường xuyên phát lộ rằng cha trên giấy không phải cha sinh học. Trong một dòng họ, phát hiện đó không chỉ chạm một người — nó chạm cả một nhánh, chạm vị trí trưởng thứ, chạm quyền hương hỏa. Và nó không thể rút lại.

**(b) Gợi ý huyết thống bằng máy là lời buộc tội đội lốt tính năng.** Một dòng "có thể cụ X là con cụ Y" hiện lên là một khẳng định về thân thế, không phải một gợi ý tìm kiếm. Nếu nó lan ra trước khi có ai khảo, nó không thu lại được.

**(c) "Nhận họ" liên quan tới lợi ích thật** — hương hỏa, đất, quyền tham gia việc họ. Đây là việc **Ban tu phả và các cụ quyết theo lệ**, không phải việc thuật toán so khớp tên.

Đề nghị bổ sung vào §7:

- ❌ **Đối chiếu ADN, và mọi suy luận huyết thống từ dữ liệu di truyền.** Nếu sau này họ muốn làm, đó là một quyết định của Ban tu phả kèm quy trình riêng, có tư vấn, có đồng thuận của người liên quan — không phải một tính năng trong backlog.
- ❌ **Tự động gợi ý quan hệ cha–con hoặc "nhận họ" và thông báo rộng.** Nếu có gợi ý, nó chỉ vào **kho tồn nghi ở mức kín**, chỉ Ban tu phả thấy, không sinh thông báo, không hiện trên cây.

### 7.4 [NẶNG] Lọt: xếp hạng, chấm điểm, đố vui về người đã khuất

Addendum §E có: *"Bộ thẻ nhân vật kiểu **Top Trumps**"*, *"Đố vui gia tộc"*, *"Chỉ số dòng họ vui"*, *"Bình chọn **giống cụ nào**"*.

Top Trumps là trò **so chỉ số để xem quân bài nào thắng**. Áp lên các cụ trong họ, nó có nghĩa là gán điểm số cho tổ tiên rồi cho các cụ đấu với nhau. Ý định là làm trẻ con thấy vui — mục tiêu tốt — nhưng cơ chế thì sai hẳn với đối tượng.

*"Bình chọn giống cụ nào"* cũng đáng lưu ý: hoặc nó cần so khuôn mặt (đã bị loại ở §7), hoặc nó là bỏ phiếu — và bỏ phiếu về ngoại hình của một người đã khuất là chuyện dễ trượt.

Đề nghị: giữ hướng làm trẻ con thấy gần gũi (**[TỐT]**, rất đáng làm) nhưng đổi cơ chế — **kể chuyện, đố kiến thức, so mình với cụ hồi bằng tuổi** ("Hồi cụ bằng tuổi cháu" trong cùng danh sách là ý hay và an toàn). Nguyên tắc bổ sung cho §7: **không chấm điểm, không xếp hạng, không cho đấu với nhau bất kỳ người nào trong phả, sống hay đã khuất.**

### 7.5 [NẶNG] Lọt: sản phẩm tự nghĩ ra nghi lễ mới cho dòng họ

Addendum §E, nhóm nghi lễ: *"Lễ Nhập Phả số"*, *"Lễ Khai Phả đầu năm"*, *"**Lễ trao Đèn Chi**"*, *"Lễ Đặt Tên có chứng"*, *"Lễ Rước Phả về chi"*.

Một số trong đó có gốc thật (lễ khai phả, lễ rước phả là việc có thật ở nhiều họ). Nhưng "Lễ trao Đèn Chi" thì rõ ràng là nghi lễ do sản phẩm nghĩ ra cho một tính năng của sản phẩm.

**Nghi lễ của một dòng họ do dòng họ đặt ra, không do phần mềm đề xuất.** Một đội làm phần mềm đề nghị các cụ thêm một cái lễ mới vào lịch việc họ là vượt vai rất rõ, và đó là kiểu vượt vai mà các cụ nhận ra ngay.

Đề nghị nguyên tắc: **hệ thống hỗ trợ những lễ mà dòng họ đã có; nó không đề xuất lễ mới.** Nếu một lễ mới ra đời, nó phải bắt đầu từ một cuộc họp họ, và phần mềm chỉ ghi lại.

### 7.6 Phán quyết cho hai ý đang chờ ở §7

**"Cụ tổ hỏi thăm"** — *nhắc nhiệm vụ dạng "Cụ Thủy tổ chưa biết mặt cháu, hãy tải ảnh lên"*.

**Đề nghị: loại.** Đây chính là persona tổ tiên, chỉ ở liều nhỏ. Nó gán cho cụ Thủy tổ một mong muốn ("chưa biết mặt cháu") và một hành động (nhắc nhở), để phục vụ mục tiêu tăng tương tác. Việc dùng danh nghĩa tổ tiên làm đòn bẩy thúc người dùng là điều nên tránh dứt khoát, và nếu để lọt một liều nhỏ thì ranh giới sẽ trôi dần — đó chính là cách các ranh giới loại này bị xói.

Vẫn đạt được mục tiêu mà không cần mượn danh cụ: *"Cây chi ta còn 12 người chưa có ảnh"*, hoặc để **một người thật trong họ** đứng ra nhắc. Người thật nhắc thì mạnh hơn nhiều.

**"Một ngày trong đời cụ"** — *dựng lại bối cảnh một ngày từ sử liệu*.

**Đề nghị: nhận, nhưng đổi khung.** Không dựng "một ngày của cụ" — dựng **bối cảnh thời đại**: "Làng ... những năm 1920", "Nạn đói Ất Dậu ở vùng ...", với nguồn sử liệu rõ ràng, đặt cạnh hồ sơ của cụ như một trang bối cảnh liên kết, **không phải trang của cụ**. Ranh giới cần cứng: **không câu nào miêu tả cụ làm gì, nghĩ gì, nói gì** trừ khi có nguồn. Đúng như PRD đã tự đặt điều kiện — tôi chỉ đề nghị mạnh thêm: cụ **không được là nhân vật chính** của trang đó.

**FR-25 "Trang tôi là ai" (Q3)** — không thuộc §7 nhưng cùng loại phán quyết.

**Đề nghị: nhận, nhưng đổi tên và đổi thể.** Có tiền lệ vững trong phả học: **hành trạng** (tiểu sử) và **thư gửi con cháu / di huấn**. Nhưng hành trạng theo lệ do **người khác viết**, thường sau khi mất — tự viết tiểu sử mình rồi công bố trong phả dễ bị đọc thành tự đề cao, nhất là bởi thế hệ trên.

Thể an toàn và cảm động hơn: **"Lời gửi con cháu"** — một lá thư, không phải một hồ sơ. Thư thì viết ở ngôi thứ nhất, khiêm nhường, và nối thẳng vào F5 Gia phong: những lá thư này chính là **nguyên liệu sống của gia huấn chưa thành văn**. Đổi khung như vậy còn giải luôn cả vướng mắc "giáp ranh Hộp thời gian" mà PRD nêu.

---

## 8. Vấn đề ngữ khí — tài liệu này chưa đọc được trước các cụ

Đề bài nói rõ người đọc là Ban tu phả, trưởng họ, các cụ cao niên. Với người đọc đó, một số câu trong PRD sẽ gây phản cảm ngay trước khi họ kịp đánh giá nội dung.

| Chỗ | Câu | Vấn đề |
|---|---|---|
| §2.1 | Người cao niên là *"**nguồn dữ liệu duy nhất không sao chép được**"* | Gọi các cụ là nguồn dữ liệu |
| §3 | *"**Nguồn dữ liệu đang chết dần.**"* | Câu này không thể để một cụ đọc phải |
| §3, FR-46 | *"Mỗi đám tang trôi qua là một chương mất vĩnh viễn"* | Đúng về ý, lạnh về lời |
| §9, M3 | *"Số **giờ ghi âm lời kể cao niên** đã thu ≥ 20 giờ"* | Đặt lời kể của các cụ thành chỉ tiêu sản lượng |
| §9, M3 | *"Tài nguyên duy nhất đang mất dần theo thời gian"* | Các cụ là "tài nguyên" |
| FR-44 | *"Bảng **nợ** dữ liệu theo chi"* | Đọc thành nợ với tổ tiên |
| FR-27 | *"Phát hiện **lỗ hổng**"* | Hoàn cảnh sống bị gọi là lỗ hổng |
| §7 | Danh mục ❌ liệt kê "Trò chuyện với Tổ tiên", "giả giọng người đã khuất" | Ngay cả việc **nêu ra để loại** cũng cần lời lẽ cẩn trọng khi trình bày với các cụ |
| Toàn tài liệu | *node*, *edge*, *migrate*, *hard-code*, *schema* | Không đọc được với người ngoài nghề |

Không có gì sai về mặt tư duy — đây là ngôn ngữ nội bộ của một tài liệu kỹ thuật, và với tư cách tài liệu kỹ thuật thì nó tốt. Vấn đề là **tài liệu này không có bản thứ hai**.

**Đề nghị:** tách hai bản.

1. **PRD kỹ thuật** — giữ nguyên giọng hiện tại, người đọc là người xây. Chỉ sửa những chỗ ngữ khí có thể vô tình trôi vào giao diện (FR-27 "lỗ hổng", FR-44 "nợ" — vì đây là **chữ sẽ hiện lên màn hình**, không chỉ chữ trong tài liệu).
2. **Bản trình dòng họ** — 3–4 trang, tiếng Việt của phả: dự án là gì, ai làm, xin gì ở dòng họ, phàm lệ cần chốt những gì, và **cam kết đạo lý** (không giả giọng người đã khuất, không bịa, không tự ý công bố chuyện riêng, băng ghi âm của cụ do cụ quyết). Chính bản này mới là thứ đưa cho Ban tu phả ở Giai đoạn 0, và mục cam kết đạo lý sẽ là thứ giành được lòng tin nhanh nhất — vì nó cho thấy người làm đã nghĩ tới những chỗ các cụ lo mà chưa nói ra.

Ghi nhận **[TỐT]**: §1 của PRD (*"Để con tôi biết nó là ai và không thấy cô độc"*) và FR-46 (*ký ức dồi dào nhất đúng lúc vừa mất*) là hai đoạn viết bằng đúng giọng cần có. Chúng chứng minh tài liệu **làm được** giọng đó — chỉ là chưa làm nhất quán.

---

## 9. Tổng hợp

### 9.1 Bảng phát hiện theo mức độ

| # | Phát hiện | Mức | Vị trí |
|---|---|---|---|
| 1 | Con dâu bị xếp vào ngoại phả, "không đủ điều kiện vào chính phả" | NGHIÊM TRỌNG | §4 |
| 2 | "Chính phả" dùng hai nghĩa mâu thuẫn trong cùng một bảng | NGHIÊM TRỌNG | §4 |
| 3 | FR-18 "phả cổ = chỉ nam đinh": sai phả học + xóa phụ nữ bằng một cú bấm | NGHIÊM TRỌNG | FR-18 |
| 4 | FR-27+28+29: phiếu in tự sinh chất vấn chuyện riêng, vượt qua mọi mô hình riêng tư | NGHIÊM TRỌNG | FR-27/28/29 |
| 5 | Phân quyền gắn vào vai trò mà chính PRD nói là đang tranh chấp | NGHIÊM TRỌNG | FR-36 × FR-6 |
| 6 | FR-4 biến "lặng lẽ không duyệt" thành "phủ quyết công khai"; người ngoài chi quyết được thứ bậc chi khác | NGHIÊM TRỌNG | FR-4 |
| 7 | Xưng hô không có quy tắc từ chối khi đường quan hệ đi qua khẳng định tồn nghi | NGHIÊM TRỌNG | FR-19/20/21 |
| 8 | Xưng hô không có khái niệm vùng miền; không có luật dâu theo chồng, rể theo vợ | NGHIÊM TRỌNG | FR-19/20/21 |
| 9 | Văn khấn AI không nằm dưới NFR-6; thiếu tên hèm và tên thụy | NGHIÊM TRỌNG | FR-41 × FR-12 |
| 10 | FR-46: ngôn ngữ "hết hạn" rơi vào lễ chung thất; máy tự đăng tiểu truyện người vừa mất | NGHIÊM TRỌNG | FR-46 |
| 11 | Không có gì cấm hệ thống loan tin buồn trước cáo phó; không có chế độ tang chế | NGHIÊM TRỌNG | FR-14, FR-42/44/45 |
| 12 | Băng ghi âm gốc giữ vĩnh viễn, sao lưu ra 5 nơi, không có luật ai được nghe | NGHIÊM TRỌNG | FR-8 × NFR-2 |
| 13 | Con ngoài giá thú: không có một chữ nào trong cả hai tài liệu | NGHIÊM TRỌNG | thiếu |
| 14 | ADN và gợi ý huyết thống nằm trong backlog không rào đạo lý | NGHIÊM TRỌNG | §7, Addendum §E |
| 15 | Văn bản lễ nghi do AI sáng tác không bị §7 chặn | NGHIÊM TRỌNG | §7 |
| 16 | Phối ngẫu bị làm phẳng — mất chính thất/kế thất/thứ thất | NẶNG | §4 |
| 17 | Thiếu 5 trường phả căn bản: ngày kỵ, nơi táng, thứ tự anh em, bậc phối, quê quán | NẶNG | FR-1, §8.1 |
| 18 | Húy định nghĩa lệch; thiếu tên thụy và tên hèm | NẶNG | §4, FR-12 |
| 19 | Số đời neo vào Thủy tổ; tìm ra đời cao hơn thì đổi hết mã cá nhân đã in và đã chia sẻ | NẶNG | §4, FR-13, FR-33 |
| 20 | "Chi/nhánh" gộp làm một; thiếu tầng phái; mã số thay tên chi | NẶNG | §4, FR-36 |
| 21 | Con nuôi gộp làm một — thiếu thừa tự và con riêng; FR-26 sẽ báo lỗi vĩnh viễn trên cạnh nhận nuôi | NẶNG | FR-18, FR-26 |
| 22 | Dâu góa, dâu tái giá, ly hôn: không có trạng thái → người nhập sẽ xóa | NẶNG | thiếu |
| 23 | Không có quyền rút khỏi phả cho người đang sống | NẶNG | FR-40, §1 |
| 24 | Bán kính khóa chặt nhất đúng con dâu — nhóm đóng góp tốt nhất | NẶNG | FR-37 |
| 25 | "3 đời" là đơn vị tự chế; ngũ phục / ngũ đại là thang đo có sẵn và đúng hơn | NẶNG | FR-37 |
| 26 | Bán kính không tính cùng chi, cùng làng; sai khi cây còn tồn nghi | NẶNG | FR-37 |
| 27 | FR-17: ép đăng ảnh người sống; cụ Thủy tổ hiện thành bóng xám | NẶNG | FR-17 × FR-38 |
| 28 | Lịch âm: ngày 30 tháng thiếu, tháng nhuận, giờ Tý, lệch lịch trước 1968 | NẶNG | FR-41 |
| 29 | "Đèn Chi mờ dần" mượn đúng biểu tượng tuyệt tự, hương tàn | NẶNG | FR-42 |
| 30 | "Bảng nợ dữ liệu": rủi ro không đối xứng, chữ "nợ" đọc thành nợ với tổ tiên | NẶNG | FR-44 |
| 31 | Chạp họ và tảo mộ bị bỏ quên; giỗ Tổ và chạp họ do họ ấn định chứ không do máy tính | NẶNG | FR-41, Addendum §C |
| 32 | PRD giả định cả họ theo cùng một lối thờ cúng; không có chi Công giáo | NẶNG | FR-41 |
| 33 | Xếp hạng / cho các cụ đấu chỉ số (Top Trumps) | NẶNG | Addendum §E |
| 34 | Sản phẩm tự nghĩ ra nghi lễ mới cho dòng họ | NẶNG | Addendum §E |
| 35 | Ngữ khí: các cụ bị gọi là "nguồn dữ liệu đang chết dần", "tài nguyên" | NẶNG | §2.1, §3, §9 |
| 36 | Vai vế vs tuổi tác: PRD chọn một bên mà không biết mình đang chọn | NẶNG | UJ-4, FR-7 |
| 37 | Đa đường quan hệ; bên ngoại ngoài dữ liệu mà FR-20 vẫn trả lời | NẶNG | FR-19/20 |
| 38 | FR-6 không có cách đóng tranh chấp, không có quyền im lặng | NẶNG | FR-6 |
| 39 | Ban tu phả, Hội đồng gia tộc, cụ cố vấn không có trong mô hình vai trò | NẶNG | FR-36 |
| 40 | Phần thân cây (các đời trước khi tách chi) không thuộc quyền ai | NẶNG | FR-36 |
| 41 | Phạm húy định nghĩa quá hẹp; kính khuyết bút ảnh hưởng FR-9 | CẦN SỬA | §4, FR-9 |
| 42 | Chữ đệm theo đời / tự bối không được nhận là khái niệm dữ liệu | CẦN SỬA | §4 |
| 43 | FR-21 văn bản trang trọng: cần giới hạn ở mẫu, tách tang lễ ra | CẦN SỬA | FR-21 |
| 44 | Tộc Sử không yêu cầu chủ biên đứng tên và lời tựa của trưởng họ | CẦN SỬA | FR-30/31 |
| 45 | "Điểm công đức" trùng với sổ công đức thật của họ | CẦN SỬA | FR-45 |
| 46 | QR dán ở nhà thờ họ; "bản in thử đặt lên bàn thờ"; "QR trên bàn" ở UJ-4 | CẦN SỬA | Addendum §C, UJ-4 |
| 47 | Thiếu trường nhạy cảm: giờ sinh can chi, nơi táng người mới mất, số lần kết hôn | CẦN SỬA | FR-38 |
| 48 | FR-33 hứa "thể thức phả Việt" mà không định nghĩa; thức Tô/thức Âu là thể thức Trung Quốc | CẦN SỬA | FR-33, Addendum §D |
| 49 | FR-16 mở cây từ "tôi" — nên khác ở chế độ trình chiếu tại nhà thờ họ | CẦN SỬA | FR-16 |
| 50 | FR-2 nên dùng chữ "đang khảo" thay "tồn nghi/ngờ" khi hiện công khai trên cây | CẦN SỬA | FR-2 |

### 9.2 Bốn thay đổi nếu chỉ làm được bốn

1. **Sửa §4 và FR-18** — con dâu vào chính phả; bỏ nhãn "phả cổ = chỉ nam đinh"; tách nghĩa "chính phả". Rẻ nhất, và là chỗ mất uy tín nhanh nhất nếu để nguyên.
2. **Chia hạng thường / hạng trọng cho FR-4**, và đóng băng dữ liệu thuộc phạm vi tranh chấp. Giữ được cái hay của đồng thuận nhẹ mà không đụng vào quyền uy của các cụ.
3. **Bổ sung ngày kỵ và nơi táng vào MVP.** Hai trường được dùng nhiều nhất trong đời sống thật của một cuốn phả, và Giai đoạn 1 đang sắp đi thu thập dữ liệu mà không hỏi chúng.
4. **Ba ràng buộc lễ nghi mới** — NFR-12 (văn bản lễ nghi không do máy sáng tác), luật không tự loan tin buồn, và chế độ tang chế tắt mọi cơ chế vui. Đây là ba chỗ mà một lần sai là hỏng, đúng như NFR-6 đã nói về AI.

### 9.3 Bổ sung vào §12 Câu hỏi mở

| # | Câu hỏi | Chặn ai |
|---|---|---|
| Q11 | Họ có tầng **phái** trên chi không? Các chi tên là gì? | §4, FR-36 |
| Q12 | Họ có **bài thơ đặt tên / chữ đệm theo đời** không? | Mô hình tên, FR-12 |
| Q13 | Đời 1 tính từ ai — Thủy tổ hay tổ khai cơ? Hai cụ có phải một không? | §4, FR-13 |
| Q14 | Anh em cùng đời: xưng hô theo **vai vế** hay theo **tuổi**? | FR-19/20/21 |
| Q15 | **Con ngoài giá thú** chép thế nào? | FR-7, FR-18 |
| Q16 | Dâu góa, dâu tái giá, người ly hôn — còn trong phả không? | FR-7, FR-18 |
| Q17 | Người đang sống có quyền **xin rút** khỏi phả không? | FR-37/38/40 |
| Q18 | **Ai được nghe băng ghi âm gốc** của các cụ? | FR-8, NFR-2 |
| Q19 | Ngày kỵ rơi vào ngày 30 tháng thiếu / tháng nhuận thì làm giỗ ngày nào? | FR-41 |
| Q20 | Trong họ có **chi theo Công giáo** hoặc lối thờ cúng khác không? | FR-41 |
| Q21 | Ai đứng tên **chủ biên** mỗi ấn bản Tộc Sử, và ai viết lời tựa? | FR-30/31, NFR-10 |
| Q22 | Ngoài giỗ Tổ, họ có **chạp họ / tảo mộ** vào dịp nào? | FR-41, Addendum §C |

Mười hai câu này nên gộp vào **mẫu phàm lệ** đề nghị ở 3.6 và đưa cho Ban tu phả ở Giai đoạn 0. Trả lời được chúng trong một buổi họp họ có giá trị lớn hơn ba tháng viết code — và không câu nào cần chờ phần mềm chạy.

---

## 10. Ghi nhận chung

Không nên đọc bản phản biện này thành "PRD kém". Số lượng phát hiện nhiều là vì tài liệu **dám đi vào những chỗ mà phần mềm gia phả thường né**: tranh chấp thứ bậc, độ tin cậy của lời kể, tang lễ, quyền của người sống. Một tài liệu tránh những chỗ đó sẽ không có phát hiện nào ở đây — và sẽ hỏng lúc gặp dòng họ thật.

Ba điều tài liệu này làm đúng mà hiếm sản phẩm nào làm: **hệ tồn nghi thay vì ép mọi thứ thành sự thật**, **ranh giới đạo lý vạch trước khi có cám dỗ**, và **nhận rằng gia phong chưa thành văn nên phải cùng dòng họ viết ra chứ không phải nhập vào**. Ba điều đó là phần khó nhất và đã có sẵn.

Việc còn lại chủ yếu là **học tiếng của phả**: gọi đúng tên, chép đủ trường, và biết chỗ nào phần mềm phải im lặng nhường cho các cụ nói.

---

*Phản biện lập trên bản PRD và addendum ngày 10/08/2026. Những chỗ ghi "phải chốt trong phàm lệ" là những chỗ tập tục thật sự khác nhau giữa các dòng họ — ở đó bản phản biện này không có thẩm quyền, chỉ Ban tu phả họ Nguyễn Quang mới có.*
