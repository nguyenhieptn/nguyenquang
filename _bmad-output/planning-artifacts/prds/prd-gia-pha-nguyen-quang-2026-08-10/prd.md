---
title: "PRD — Gia phả dòng họ Nguyễn Quang"
status: final
created: 2026-08-10
updated: 2026-08-10
---

# Gia phả dòng họ Nguyễn Quang

> 「光前裕後」— Quang Tiền Dụ Hậu

Chi tiết kỹ thuật, kế hoạch triển khai, backlog, và lập luận đã cân nhắc: xem `addendum.md`.

---

## 1. Vì sao làm

Dòng họ chưa có gia phả. Không phải mất — là **chưa từng có ở dạng dùng được**. Những gì còn biết đang nằm trong trí nhớ của những người sẽ không còn ở đây mãi.

> **"Để con tôi biết nó là ai và không thấy cô độc."**

Gia phả ghi *ai là con ai*. Nhưng thứ làm nên câu trên là **gia phong** — nếp nhà, lời răn, cách dòng họ này sống. Gia phong họ Nguyễn Quang cũng chưa thành văn: nó sẽ được viết ra trong quá trình làm sản phẩm, không phải nhập vào sản phẩm.

Nên đây là **công cụ để một dòng họ tự viết ra chính mình** — không phải kho chứa một cuốn phả đã có.

---

## 2. Ai dùng

| Nhóm | Cần gì | Sợ gì |
|---|---|---|
| **Cụ cao niên** — nguồn dữ liệu duy nhất không sao chép được | Kể lại trước khi quên, và được ghi nhận là người đã kể | Nói xong không ai ghi |
| **Hiệp** — hiện là người duy nhất duyệt | Xác nhận thông tin đúng mà không phải gõ lại | Ôm hết việc; bị đổ lỗi khi phả sai |
| **Con cháu 25–55, ở xa** — đông nhất | Thêm vợ con mình vào phả trong 3 phút, trên điện thoại | Form dài; sợ điền sai làm hỏng phả |
| **Người trẻ, dâu rể mới** | Biết phải gọi người này là gì, và mình là ai trong họ này | Cảm thấy mình là người ngoài |

**Hành trình quan trọng nhất:** bà cụ 84 tuổi ngồi hiên nhà, đứa cháu 28 tuổi mở điện thoại, **bấm ghi âm** và hỏi *"Bà kể cháu nghe về ông cố đi"*. Bà nói 6 phút, lan man. Cháu bấm dừng, xác nhận vài cái nó chắc, để nguyên cái nó không biết. Bà được ghi tên là người kể.

*Cụ không chạm vào máy — cháu là giao diện.*

---

## 3. Vấn đề lớn nhất: chưa có gì cả

Ngày ra mắt, cây gia phả **trống rỗng**. Không ai đóng góp vào một trang trắng. Và chưa ai biết chắc **cụ Thủy tổ là ai**.

**Cách giải: không khai báo gốc — để hệ thống tự suy ra.**

Không ai phải tuyên bố "đây là cụ Thủy tổ" trước khi bắt đầu. Người dùng cứ nhập những gì mình biết, từ đời mình đi ngược lên. Hệ thống lấy **người xa nhất còn truy được** làm gốc tạm, rồi loang ra theo dữ liệu mới. Ai đó nhập thêm một đời phía trên, gốc tự dịch lên.

Ba hệ quả bắt buộc, đây là ràng buộc thiết kế chứ không phải tùy chọn:

1. **Số đời là dẫn xuất, không lưu cứng.** Tìm được thêm một cụ phía trên thì cả cây lùi một đời. Nếu lưu "đời 5" vào bản ghi, hôm sau con số đó sai toàn bộ.
2. **Mã chi cũng vậy.** `1.3.2` không được là chuỗi lưu sẵn, vì nó đổi khi gốc dịch. Mã hiển thị cho người xem thì tính ra lúc hiển thị; định danh trong máy phải là thứ **không bao giờ đổi**.
3. **Mỗi mảnh rời có gốc tạm riêng.** Khi mỗi người tự khai từ dưới lên, kết quả là **nhiều mảnh**, không phải một cây. Hai người có thể nhập cùng một cụ mà không ai biết. Mỗi mảnh có "cụ xa nhất" của riêng nó cho tới khi được nối.

Vì vậy **hợp nhất mảnh (FR-48) là trái tim của hệ thống**, không phải việc dọn dẹp: nó chính là cơ chế biến nhiều mảnh rời thành một dòng họ, và mỗi lần hợp nhất thành công là một lần gốc chung lùi sâu thêm về quá khứ.

**Ba việc làm được ngay, không cần một dòng code:**
1. Dựng danh sách khung dòng họ.
2. **Đi ghi âm các cụ bằng điện thoại** — băng ghi âm không hỏng theo thời gian; các cụ thì có.
3. Hỏi các cụ những gì còn nhớ về đời trên — càng xa càng tốt.

---

## 4. Thuật ngữ

| Từ | Nghĩa |
|---|---|
| **Đời** | Thế hệ tính từ gốc hiện biết. **Tính lúc hiển thị, không lưu cứng** — tìm thêm một cụ phía trên là cả cây lùi một đời |
| **Chi** | Nhánh con cháu tách ra từ một cụ; mã hiển thị dạng `1.3.2`, cũng là dẫn xuất |
| **Gốc tạm** | Người xa nhất còn truy được trong một mảnh. Hệ thống tự xác định, dịch dần lên khi có dữ liệu mới. Chưa chắc là Thủy tổ |
| **Húy** | Tên thật của người đã khuất, kiêng gọi thẳng |
| **Tên hèm / tên thụy** | Tên dùng khi cúng giỗ và khấn. Khác húy — **đọc sai tên này khi khấn là lỗi nặng** |
| **Phạm húy** | Đặt tên trùng tên các cụ bề trên |
| **Phàm lệ** | Quy ước biên soạn phả: ai được vào phả, ghi những gì. Mặc định ở §11 |
| **Tồn nghi** | Thông tin còn ngờ — ghi lại chứ không bỏ, không nhận là chắc |
| **Chính phả** | Phần chép dòng chính: người mang huyết thống **và vợ của họ** |
| **Ngoại phả** | Con rể và hậu duệ mang họ khác, ân nhân, thầy dạy. **Không phải chỗ của con dâu** |
| **Tầng chính thức / Tầng tồn nghi** | Hai tầng dữ liệu: đã duyệt và chưa duyệt |
| **Khẳng định** | Một mệnh đề đơn, ví dụ *"A là con của B"*. Đơn vị nhỏ nhất mang nguồn và độ tin cậy |
| **Tang chế** | Thời kỳ để tang — hệ thống phải im phần vui |

**Vai trò:** Quản trị (hiện là Hiệp) → Đầu mối chi → Thành viên → Khách. Viết theo **vai**, không theo người — sau này dòng họ lập Ban tu phả thì gán vai, không sửa gì.

---

## 5. Xây gì — Đợt 1

**Mười lăm yêu cầu.** Đây là thứ nhỏ nhất khiến **dữ liệu bắt đầu chảy vào**.

> FR-51 · FR-63 · FR-11 · FR-13 · FR-15 · FR-47 · FR-49 · FR-1 · FR-2 · FR-3 · FR-64 · FR-48 · FR-37 · FR-55 · FR-39

### Gieo mồi

**FR-51 — Nhập khung dòng họ.** Nạp bộ khung dựng ngoài hệ thống: các chi hiện có, người đứng đầu mỗi chi, những cụ đã biết tên. Vào thẳng mức *tồn nghi*, sửa được toàn bộ về sau.

Không cần chỉ định ai là Thủy tổ — cứ nạp các node rời, hệ thống tự suy ra gốc và loang ra. Khung này chỉ để cây không trống trong ngày đầu.

**FR-63 — Gốc cây là dẫn xuất.**
Hệ thống tự xác định người xa nhất truy được trong mỗi mảnh làm gốc tạm, và tính lại khi có dữ liệu mới. Kéo theo:
- **Số đời và mã chi tính lúc hiển thị**, không lưu cứng — chèn thêm một đời phía trên không được làm sai mọi bản ghi bên dưới.
- Định danh trong máy phải **không đổi khi gốc dịch**.
- Giao diện nói rõ đây là **gốc tạm** *("cụ xa nhất hiện biết")*, không phải khẳng định đã là Thủy tổ.

### Vòng lặp người dùng

**FR-11 — Tự khai 4 bước.** *"Bạn là ai trong họ?"* → tìm người thân đã có → xác nhận → thêm mình và gia đình. Mỗi màn hình **một câu hỏi**. Xem cây không cần đăng ký; ghi thì cần xác thực.

**FR-13 — Trả công tức thì.** Vừa thêm mình xong là thấy ngay **đường ngược lên cụ xa nhất hiện biết** của riêng mình, tô sáng — kèm số đời và mã chi tính tại chỗ. Đường này dài ra mỗi khi dòng họ tìm thêm được một đời, và đó là phần thưởng lặp lại chứ không phải phần thưởng một lần.

**FR-15 — Cây gia tộc.** *(gộp FR-16 cũ)*
Zoom theo chi, collapse theo đời, chạy mượt trên điện thoại. **Mở lên thấy chính mình trước**, rồi đi ngược lên — không phải mở ra thấy gốc rồi tự mò xuống.

### Thu lời kể

**FR-47 — Thu và lưu lời kể.** Ghi âm thẳng trên web (trình duyệt di động làm được), hoặc tải lên file thu sẵn. Kèm: **ai kể, ai thu, ngày nào, nói về ai**. Chưa cần bóc tách gì — bóc tách là việc sau, thu là việc bây giờ.

**FR-49 — Đồng thuận cho lời kể.** Dữ liệu quý nhất cũng là dữ liệu dễ nổ nhất: vợ lẽ, con ngoài giá thú, tranh chấp hương hỏa. Mỗi bản ghi phải có **mức tiếp cận do người kể chọn** (công khai / chỉ người quản trị / niêm phong tới một mốc), **quyền rút lại** còn hiệu lực sau khi họ mất, và **đường ẩn khẩn** cho khẳng định bị báo cáo là xúc phạm.

### Nền dữ liệu

**FR-1 — Mọi khẳng định mang theo nguồn.** Đơn vị dữ liệu không phải "người" mà là **khẳng định về người**: ai khai, khi nào, dựa vào đâu.

**FR-2 — Ba mức tin cậy, hiện trên cây bằng màu:** `chắc chắn` / `theo lời kể` / `tồn nghi`. Người xem luôn biết mình đang nhìn cái gì.

**FR-3 — Hai tầng.** Người đã xác thực ghi được vào Tầng tồn nghi **ngay, không chờ duyệt** (hiện mờ). Người có vai duyệt nâng lên Tầng chính thức — hiện là Hiệp, sau này là đầu mối từng chi.

**FR-64 — Đăng nhập và quản lý người dùng.**
Ba đường vào: **Google**, **Facebook**, và **tài khoản riêng** (tên đăng nhập + mật khẩu). Hệ thống có phần quản lý người dùng riêng, không phụ thuộc hoàn toàn vào nhà cung cấp bên ngoài.

Một tài khoản **chưa phải** là một người trong phả. Hai lớp tách rời:
- **Tài khoản** — chứng minh anh là chủ email/số này. Ai cũng tạo được.
- **Gắn vào node** — chứng minh anh là *người này trong dòng họ*. Do **một người trong họ bảo lãnh**, hoặc người quản trị xác nhận.

Quyền ghi và bán kính riêng tư (FR-37) tính theo **node**, không theo tài khoản. Người có tài khoản nhưng chưa gắn node chỉ xem được phần công khai.

Kèm **vai trò tối thiểu** để FR-3 có nghĩa: `quản trị` / `đầu mối chi` / `thành viên` / `khách`. Chỉ cần gán được vai và kiểm tra vai — màn hình quản lý vai trò đầy đủ là FR-36, để sau.

**FR-48 — Hợp nhất mảnh.** Phát hiện ứng viên trùng, **gợi ý chứ không tự gộp**, gộp nhầm thì tách lại được, và hiển thị trung thực số **mảnh chưa nối** thay vì vẽ như một cây liền.

### Không làm hại ai

**FR-37 — Riêng tư theo bán kính họ hàng.** *(gộp FR-38 cũ)*
Trong 3 bậc thấy đầy đủ; ngoài bán kính chỉ thấy tên và vị trí trên cây. Người dùng không phải chỉnh cấu hình nào.

Mặc định với người còn sống: **chỉ năm sinh, không ngày tháng; ẩn địa chỉ và số điện thoại**. Trẻ vị thành niên ẩn chặt hơn.

**FR-55 — Quyền của người sống.** Dữ liệu là "của chung" và người khác khai hộ được, nên người bị khai phải: **được biết** khi mình được thêm vào, **được sửa** thông tin về chính mình, **được ẩn** khỏi phần công khai mà vẫn giữ liên kết phả hệ, **được từ chối** xuất hiện trong bản in.
> Ranh giới: được ẩn, **không được xóa** sự kiện phả hệ — xóa nó là làm hỏng phả của người khác. Xem §11.

**FR-39 — Nhật ký sửa.** *(gộp FR-5 cũ)*
Ai sửa, khi nào, từ giá trị nào sang giá trị nào. Xem lại được cây tại một thời điểm bất kỳ trong quá khứ.

---

## 6. Yêu cầu phi chức năng

**Mười một yêu cầu.**

> NFR-1 · NFR-2 · NFR-3 · NFR-4 · NFR-5 · NFR-6 · NFR-7 · NFR-8 · NFR-9 · NFR-10 · NFR-11

Số hiệu NFR-1→10 giữ nguyên từ bản trước để mọi trích dẫn ở `addendum.md` và các bản đối chiếu còn trỏ đúng. NFR-11 là mục mới. Số hiệu không tái sử dụng — cùng kỷ luật đang áp cho FR ở §7.

**NFR-1 — Không được mất dữ liệu.** Băng ghi âm cao niên và ảnh tư liệu là **không tái tạo được**. Sao lưu hằng ngày, giữ ≥ 90 ngày, bản sao ở ≥ 2 nơi, và **diễn tập khôi phục thật ít nhất 1 lần/năm** — backup chưa từng restore là backup không tồn tại.

**NFR-2 — Sao lưu phân tán trong họ.** *(Đợt 2 — xem §7 "Trước ngày ra mắt")*
Bản sao nằm ở **nhiều người, nhiều nơi**, không chỉ trên hạ tầng do một người quản. Định dạng là **GEDCOM 7** (addendum §A.6), nên FR-40 *(tự xuất dữ liệu cá nhân)* là tiền đề — cùng một đường xuất phục vụ cả hai.

> NFR-1 chống hỏng đĩa. NFR-2 chống việc dự án dừng: hạ tầng mất, người quản dừng, tài khoản hết hạn — phả vẫn còn trong tay dòng họ.

**NFR-3 — Một người vận hành được.** Khởi động lại bằng một lệnh, cấu hình nằm trong repo, không có bước thủ công nào chỉ Hiệp biết. Tài liệu đủ để người khác tiếp quản trong 1 ngày.

**NFR-4 — Dự án không chết theo người phụ trách.** Phụ trách kỹ thuật là điểm gãy đơn lẻ, và đối sách không nằm ở phần mềm:

- **Chi phí hạ tầng lấy từ quỹ họ**, không lấy từ túi một người — vừa để dự án là "của chung", vừa để nó không dừng khi một người dừng.
- **Đào tạo 1–2 người trẻ** trong họ đủ để tiếp quản, dựa trên tài liệu mà NFR-3 đòi.

**NFR-5 — Đơn giản là ràng buộc, không phải mong muốn.** Thêm một người vào phả: **≤ 4 màn hình, ≤ 3 phút**, điện thoại tầm trung, 4G ở quê. Tính năng nào làm luồng này dài thêm phải nhường đường.

**NFR-6 — AI không được bịa.** Không câu nào do AI sinh ra được trình bày như sự thật phả hệ nếu không trỏ về nguồn. Áp cho **mọi** thứ sinh văn bản, kể cả những cái không trông giống mệnh đề sự thật — văn khấn, tiểu truyện, lời dẫn. Sai một lần trước mặt các cụ là mất uy tín cả dự án.

**NFR-7 — Đa dòng họ: thiết kế sẵn, chưa mở.** *(chốt 10/08/2026)*
Chỉ họ Nguyễn Quang dùng. Không có đăng ký dòng họ mới, không có trang giới thiệu, không hỗ trợ ai khác. Nhưng **cấu trúc phải sẵn sàng**:

- Mọi bảng mang **khóa phân vùng theo dòng họ** ngay từ ngày đầu, kể cả khi chỉ có một giá trị. Tách sau đồng nghĩa migrate toàn bộ.
- Mọi truy vấn lọc theo khóa đó **ở tầng dữ liệu**, không phải ở tầng ứng dụng — để một chỗ quên lọc không làm rò dữ liệu.
- Không hard-code bất cứ thứ gì riêng của họ Nguyễn Quang: tên họ, chữ đệm, số chi, cụ gốc đều là **dữ liệu**, không phải hằng số trong mã.

> Đây là chỗ quyết định ngăn xếp chạm vào: Apache AGE không có row-level security, nên việc cô lập giữa các dòng họ phải tự làm ở tầng khác. Rò dữ liệu giữa hai dòng họ là loại lỗi không bản vá nào chữa được lòng tin đã mất.

**NFR-8 — Hiệu năng.** Ngưỡng thiết kế gốc: **5.000 node, mọi truy vấn đường quan hệ < 1 giây**.

> Q1 chốt 10/08/2026 hạ quy mô thật xuống **dưới 300 người, 5–7 đời** (§10). Ở mức đó ngưỡng này thừa xa — SQL thường chạy tức thì, không tối ưu nào cần thiết. Giữ 5.000 node làm **trần thiết kế** để không khoá đường lớn lên, nhưng **không được lấy nó làm cớ** chọn hạ tầng nặng: §10 đã ghi rõ đây là dữ kiện `bmad-architecture` phải biết trước khi bỏ công xác minh.

**NFR-9 — Tiếng Việt là mặc định.** Tìm kiếm không dấu, sắp xếp theo alphabet tiếng Việt, Hán-Nôm hiển thị kèm phiên âm.

**NFR-10 — Mỗi ấn bản có mã băm công bố.** Chống nghi ngờ *"phả bị sửa lén"* bằng một mã băm công bố cho mỗi ấn bản, đối chiếu được về sau. Đây là **phương án thay blockchain**, đạt cùng mục tiêu với chi phí gần bằng không (addendum §F). Dựa trên FR-39 *(nhật ký sửa)* — có nhật ký rồi thì băm chỉ là một bước nữa.

**NFR-11 — Web đủ năng lực.** Trình duyệt di động ghi âm, chụp ảnh, quét QR, tải tệp đều được. Không yêu cầu nào được viện lý do *"vì là web nên không làm được X"*. Giới hạn thật của web-only là **thói quen mở trình duyệt** và **thông báo đẩy**.

---

## 7. Sau này

Không thuộc Đợt 1. Số hiệu giữ nguyên để không đánh trùng.

| | |
|---|---|
| **Trước ngày ra mắt** | FR-19 xưng hô hai người quét chung một QR *(đây là màn demo ra mắt — chưa có nó thì chưa ra mắt)* · FR-52 quy tắc từ chối trả lời · FR-54 vùng miền, dâu theo chồng · FR-41 lịch giỗ âm lịch · FR-46 cửa sổ 49 ngày · FR-59 chế độ tang chế · FR-8 bóc tách lời kể · FR-9 nhập từ ảnh tư liệu · **NFR-2** sao lưu phân tán trong họ |
| **Gia phong** | FR-22 kho gia huấn sống · FR-23 tách lời răn khỏi lời kể · FR-24 hội đồng phê chuẩn hằng năm · FR-25 trang "tôi là ai" · FR-57 mục "Chuyện thật" · FR-58 nghi thức nhận lại tên |
| **Quang Gia Tộc Sử** | FR-30 biên soạn · FR-31 chỉ nói điều có nguồn · FR-32 tự chỉ chương thiếu · FR-33 xuất bản in · FR-34 bản cá nhân hóa · FR-35 QR phiên bản trên bản in · FR-61 phả nghe được |
| **Thám tử phả hệ** | FR-26 rà mâu thuẫn · FR-27 phát hiện lỗ hổng · FR-28 nhiệm vụ in giấy · FR-29 phiếu câu hỏi A4 · FR-50 giấy in tuân đúng luật riêng tư như màn hình |
| **Nhịp sống** | FR-14 chào người mới · FR-42 đèn chi · FR-43 cảnh báo chi nguội · FR-44 bảng nợ dữ liệu · FR-45 điểm công đức · FR-60 kênh đẩy ra ngoài web — **hoãn** |
| **Quản trị** | FR-4 duyệt bằng đồng thuận nhẹ · FR-6 hồ sơ tranh chấp · FR-7 trang phàm lệ · FR-36 phân vai · FR-40 tự xuất dữ liệu cá nhân |
| **Khác** | FR-10 gắn tên ảnh tập thể · FR-12 hồ sơ đa danh xưng · FR-17 cây bằng khuôn mặt · FR-18 xem theo phàm lệ cổ/mới · FR-20 FR-21 xưng hô từ câu mô tả · FR-53 kiểm nếp tên "Nguyễn Quang" · FR-56 thu số liệu tự động · FR-62 bản đồ di cư |

**Đã gộp, không còn tồn tại riêng:** FR-5 → FR-39 · FR-16 → FR-15 · FR-38 → FR-37. Số hiệu giữ chỗ, không tái sử dụng.

Backlog rộng hơn (QR mộ phần, nhận họ, đố vui, trang vàng…): `addendum.md` §E.

---

## 8. Không làm

- ❌ **App mobile** — chỉ web. Web trên điện thoại làm được mọi thứ sản phẩm này cần.
- ❌ **Chatbot hội thoại tự do** — thay bằng xưng hô có phạm vi hẹp
- ❌ **"Trò chuyện với Tổ tiên"** — persona AI người đã khuất
- ❌ **Tổng hợp giả giọng người đã khuất** — thu giọng thật người còn sống thì được
- ❌ **Nhận diện khuôn mặt tự động** — gắn tên thủ công vừa an toàn hơn vừa là hoạt động tập thể
- ❌ **Phục chế ảnh gia tiên bằng AI**, **morph chân dung đời nối đời**, **hộp thời gian khóa kín**

---

## 9. Đúng thì trông thế nào

**Điều kiện ra mắt:** mỗi chi có ít nhất một người đã tự khai và nối được vào khung, số mảnh chưa nối bằng 0.

**Cách đo ở Đợt 1: đếm tay.** Dưới 300 người thì một truy vấn SQL chạy tay mỗi tháng là đủ — không cần dashboard, không cần FR-56. M3 (giờ ghi âm) thậm chí đo được từ hôm nay, trước khi có dòng code nào.

| | Đo gì | Ngưỡng |
|---|---|---|
| M1 | Tỷ lệ người trong họ tìm thấy chính mình trên cây | ≥ 80% sau 12 tháng |
| M2 | Người đóng góp khác nhau trong 90 ngày | ≥ 15 người, thuộc ≥ 3 chi |
| M3 | Giờ ghi âm lời kể cao niên | ≥ 20 giờ năm đầu — **đo được từ hôm nay, không cần code** |
| M4 | Khẳng định có nguồn **ngoài lời tự khai** | ≥ 50% |
| M5 | Một người mới kéo theo bao nhiêu người mới trong 30 ngày | ≥ 1,0 — dưới 1 nghĩa là dự án sống bằng sức đẩy của Hiệp và sẽ dừng khi Hiệp dừng |
| M6 | Cụ trên 80 tuổi chưa được ghi âm lần nào | Giảm đều về 0 — **chỉ số duy nhất xấu đi kể cả khi không ai làm gì sai** |

**Dấu hiệu hỏng:** thời gian duyệt mỗi tuần tăng theo lượng đóng góp · bản ghi mắc kẹt ở *tồn nghi* quá 6 tháng · quá nửa số người bỏ giữa chừng luồng tự khai · **AI bị bắt lỗi sai sự thật — mục tiêu tuyệt đối: 0 lần.**

---

## 10. Chưa biết

### Đã chốt 10/08/2026

| | | |
|---|---|---|
| **Q1** | Quy mô | **Dưới 300 người, 5–7 đời.** Nhỏ — xem ghi chú bên dưới |
| **Q2** | Xác thực | **Google + Facebook + tài khoản riêng**, có hệ thống quản lý người dùng riêng → FR-64 |
| **Q3** | Thủy tổ | **Không khai báo — hệ thống tự suy ra từ node có sẵn rồi loang ra** → FR-63, §3 |
| **Q6** | Tên miền | Để sau, không chặn gì |
| **Q7** | Dòng họ khác | **Chưa mở, nhưng thiết kế sẵn sàng** — xem NFR-7 ở §6 |

> **Quy mô nhỏ có một hệ quả cần nói.** Dưới 300 người, cây gia phả nhỏ hơn nhiều so với mức mà bất kỳ tối ưu nào trở nên cần thiết — truy vấn đường quan hệ trên 300 node chạy tức thì bằng SQL thường. Lập luận của cổng phản biện về việc bỏ Apache AGE vì thế mạnh hơn hẳn so với lúc chưa biết con số. Quyết định giữ ngăn xếp là của anh và tôi không tự đổi; nhưng đây là dữ kiện mới, và `bmad-architecture` nên biết trước khi bỏ 20–40h xác minh tương thích ảnh Docker.
>
> **Facebook login cần app review** của Meta, khác Google (đăng ký là dùng được). Nếu muốn Đợt 1 gọn, làm Google + tài khoản riêng trước, thêm Facebook sau — không FR nào phụ thuộc vào việc có đủ ba đường ngay.

### Còn treo

**Không còn câu nào chặn.** Hai câu về phàm lệ và Ban tu phả đã được thay bằng mặc định ở §11 — không chờ dòng họ họp mới làm được.

---

## 11. Mặc định — quyết sẵn, đổi được sau

Không chờ dòng họ họp. Tôi chọn mặc định theo hướng **rộng rãi và ít gây tổn thương nhất**, ghi rõ ra đây để sau này ai muốn đổi thì biết mình đang đổi cái gì. Mỗi dòng là **cấu hình, không phải mã** — sửa được mà không phải đụng tới code.

| Câu | Mặc định | Vì sao chọn thế |
|---|---|---|
| Con gái đi lấy chồng | **Vẫn trong phả, đầy đủ như con trai.** Chồng và con của cô ấy ghi nhận có liên kết, đánh dấu thuộc họ khác | Bỏ đi là mất nửa dòng họ. Muốn xem theo lối phả cổ chỉ nam đinh thì bật chế độ xem, không phải xóa dữ liệu |
| Con dâu, con rể | **Ghi tên thật đầy đủ** | Người đang sống đọc thấy mình chỉ là "bà Nguyễn Thị…" là một vết thương không cần thiết |
| Con nuôi, con thừa tự | **Ghi như con**, có trường quan hệ nêu rõ, **không có dấu phân biệt trên cây** | Trung thực với phả hệ ở tầng dữ liệu, nhưng đứa trẻ đó lớn lên đọc phả sẽ không thấy mình bị đóng dấu |
| Con ngoài giá thú | **Ghi, cùng cách như trên** | Người tồn tại thì phả ghi. Đây cũng là chỗ FR-49 (niêm phong lời kể) tồn tại để bảo vệ |
| Người bỏ họ, đổi họ | **Có chỗ trong phả** | Tiền đề của FR-58 |
| Người sống hiển thị tới đâu | **Chỉ năm sinh, không ngày tháng. Ẩn liên hệ và địa chỉ** với người ngoài bán kính 3 bậc. Trẻ vị thành niên ẩn chặt hơn | Đủ để nhận ra nhau, không đủ để lạm dụng |
| Được ẩn / được xóa | **Được ẩn, không được xóa sự kiện phả hệ** | Xóa việc một người tồn tại là làm hỏng phả của người khác |

**Ai duyệt, khi chưa có Ban tu phả:** Hiệp duyệt tất cả. Ở quy mô dưới 300 người điều này hoàn toàn kham được. FR-3 và FR-64 viết theo **vai trò**, không theo người — nên khi nào có đầu mối các chi thì gán vai cho họ, không phải sửa gì.

---

## 12. Điều đã biết là còn thiếu

Không có kênh đẩy ra ngoài web (FR-60 hoãn), nên **mọi cơ chế giữ nhịp đều là *kéo*** — chỉ chạm được người đã mở web. Mà chi đang nguội, theo định nghĩa, là chi **không mở web**.

Đối sách duy nhất hiện có: hệ thống phát hiện chi nguội rồi **sinh nhiệm vụ đến thăm thật ngoài đời**. Tức việc đánh thức một chi là việc của người, không phải của phần mềm.

Đây là chỗ hụt PRD thừa nhận chưa có lời giải.
