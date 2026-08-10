---
title: "Đối chiếu nguồn — Brainstorm 103 ý ↔ PRD + Addendum"
status: review
created: 2026-08-10
source: "_bmad-output/brainstorming/brainstorm-tinh-nang-wow-gia-pha-2026-08-09/brainstorm.html"
targets: ["prd.md", "addendum.md"]
---

# Đối chiếu nguồn: brainstorm 103 ý ↔ PRD

**Nguồn:** `brainstorm.html` — phiên 09/08/2026, 13 kỹ thuật (đánh số 01–15, thiếu số nên thực tế 15 khối), 103 ý tưởng, 7 mối nối, 3 ý giáp ranh cần quyết.
**Đích:** `prd.md` (46 FR + 10 NFR) và `addendum.md` (§A–§F).

**Kết luận tổng:** PRD tiếp thu nguồn ở mức **cao và trung thực** — 5/7 mối nối vào đúng tinh thần kèm lập luận, 3/3 ý giáp ranh xử lý minh bạch. Hai chỗ hụt thật sự: **mối nối #2 (kênh thoại)** bị hạ cấp từ "chỗ thủng" xuống "rủi ro trung bình" mà không nêu lý do loại từng tính năng, và **mối nối #7 (nhịp tim)** mất đúng 2/5 cơ chế. Ngoài ra một lớp nội dung định tính — **nguyên lý "thiết kế như nghi lễ"** và mấy lập luận tâm lý sâu nhất — bay hơi trong quá trình chuyển thể.

---

## 1. Bảy mối nối — kiểm từng cái

### MN-1 · "Ba ý là một ý đội ba mũ — quyết định schema, không phải tính năng"

**Trạng thái: TIẾP THU ĐẦY ĐỦ, ĐÚNG TINH THẦN.** Mối nối được tiếp thu tốt nhất về mặt cấu trúc.

| Thành phần nguồn | Nơi trong PRD |
|---|---|
| Hệ độ tin cậy 3 mức | FR-2 |
| Hai tầng Chính phả / Kho tồn nghi | FR-3 |
| Phả nháp công khai | *(chỉ được nhắc trong khối trích dẫn §5.1, không có FR)* |
| "Cùng một hạ tầng: nguồn + độ tin cậy + trạng thái" | FR-1, trích nguyên văn ở đầu §5.1 |
| "Thêm sau = đập bảng làm lại" | §5.1 lời dẫn; củng cố bằng NFR-7 và addendum §A.3 ("quyết định schema quan trọng nhất của dự án") |
| Vị trí ưu tiên ("phải chốt trước mục 6.2") | Đặt đầu PRD + đưa FR-1/2/3/5 vào MVP §8.1 |

**Hai chỗ hụt:**

1. Nguồn nói mối nối này giải **ba** thứ cùng lúc: nghẽn duyệt (✔ FR-3/FR-4), tranh chấp thứ bậc (✔ FR-6 + §10), và **"nỗi sợ sửa phả là báng bổ"** — vế thứ ba **không xuất hiện ở đâu trong PRD**. Đây là lập luận tâm lý dòng họ, không phải yêu cầu kỹ thuật, nên dễ rơi nhất — nhưng chính nó là lý do người trong họ dám ghi vào Kho tồn nghi. Đề nghị đưa một câu vào lời dẫn §5.1.
2. **"Phả nháp công khai"** — nguồn định nghĩa là *ai cũng thấy phiên bản đang tranh cãi chạy song song bản chính*. PRD gộp nó vào FR-3 (Kho tồn nghi hiện mờ) + FR-6 (hồ sơ tranh chấp). Gộp được, nhưng mất tính **công khai song song** — thứ chính là cơ chế xả áp cho tranh luận. Nên nói rõ trong FR-3 rằng Kho tồn nghi *hiển thị cho mọi người*, không chỉ cho người duyệt.

---

### MN-2 · "Web-only đang loại đúng nhóm giữ dữ liệu quý nhất" → kênh thoại

**Trạng thái: TIẾP THU MỘT PHẦN (1/3), LẬP LUẬN BỊ HẠ CẤP.** Đây là khoảng trống nghiêm trọng nhất của lần chuyển thể này.

| Ba ý gộp thành kênh thoại | PRD |
|---|---|
| Nhập liệu bằng kể chuyện | ✔ FR-8 + UJ-1 (làm rất tốt, có băng gốc, có truy vết đoạn băng) |
| **Phả nghe được (TTS tiếng Việt giọng địa phương)** | ✖ **biến mất hoàn toàn** — không FR, không backlog §E, không mục loại §7 |
| **Số điện thoại hỏi phả (gọi vào, máy trả lời bằng giọng nói)** | ✖ **biến mất hoàn toàn** — như trên |

Nguồn viết dứt khoát: *"Đây không phải tính năng WOW — đây là chỗ thủng."* PRD chuyển nó thành một dòng trong bảng rủi ro §10: *"Web-only loại nhóm cao niên — Trung bình — nhận rủi ro có ý thức; bù bằng UJ-1 và FR-29"*.

**Đánh giá:** hạ từ "chỗ thủng" xuống "trung bình" là một **quyết định**, không phải sơ suất — và PRD có quyền quyết. Nhưng ba vấn đề:

- **Hotline điện thoại** thật sự nằm ngoài ràng buộc web-only → loại là hợp lý, nhưng phải ghi vào §7 "Ngoài phạm vi" kèm lý do, chứ không được im lặng.
- **"Phả nghe được" (TTS) hoàn toàn nằm trong web-only.** Nó không vi phạm ràng buộc nào, không đắt, và §7 đã cho phép giọng thật/loại giọng giả — TTS đọc Tộc Sử không đụng lằn ranh đó. Việc nó biến mất **không có lý do nào được nêu**. Đây là mất mát thật sự.
- Đối chứng nội bộ: PRD §2.1 tự nhận nhóm cao niên là *"nguồn dữ liệu duy nhất không sao chép được"*, và M3 đo *"số giờ ghi âm lời kể"*. Nhưng toàn bộ đường **đi ra** cho nhóm đó (nghe lại phả) bị cắt — dữ liệu chỉ đi vào, không đi ra, đúng cái mà kỹ thuật 10 "Alien Anthropologist" đã chỉ ra là kỳ quặc.

**Đề nghị:** thêm FR "Bản đọc Tộc Sử/tiểu sử (TTS tiếng Việt)" vào F7 hoặc ít nhất vào backlog §E; ghi hotline vào §7 kèm lý do "vi phạm ràng buộc web-only".

---

### MN-3 · "Đừng xin dữ liệu — đi nhặt nơi nó đang nằm"

**Trạng thái: TIẾP THU XUẤT SẮC.** Không mất gì.

Được nâng thành một mục PRD riêng (**§3 Bài toán khởi động nguội**) — đúng trọng lượng nguồn gán cho nó. Đủ 5 ý: sổ tang/sổ mừng + bia mộ + ảnh tập thể (FR-9, FR-10); bạt có ô bút dạ + "hỏi ông bà 3 câu" đổi lì xì (addendum §C "Chiến thuật $0", giữ đủ 5/5 ý của kỹ thuật 08). Câu chốt của nguồn — *"cộng lại chúng có thể vượt mọi form nhập liệu anh xây"* — được giữ gần nguyên văn ở addendum §C. Bổ sung tốt: PRD ràng buộc kết quả bóc tách *"luôn vào Kho tồn nghi, không bao giờ tự vào Chính phả"* (addendum §A.5) — đây là chỗ PRD **giỏi hơn** nguồn.

---

### MN-4 · "Trục cá nhân hóa là chỗ ăn được cả hai mô hình"

**Trạng thái: TIẾP THU ĐÚNG TINH THẦN Ở TẦM NHÌN, NHƯNG RỖNG Ở MVP.**

Câu định vị được đưa lên **§1 Tầm nhìn** ("Khác biệt cốt lõi") và nhắc lại ở addendum §D ("khoảng trống chưa ai đứng vào"). Bốn ý cấu thành:

| Ý | PRD | MVP? |
|---|---|---|
| Tộc Sử cá nhân hóa | FR-34 | ✖ ngoài MVP (§8.3) |
| Từ tôi ngược về Tổ | FR-16 | ✔ trong MVP |
| Mã gia phả riêng | FR-13 | ✔ trong MVP |
| Hồi cụ bằng tuổi cháu | ✖ đẩy xuống backlog §E | ✖ |

**Rủi ro cần nêu:** PRD tuyên bố đây là **khác biệt cốt lõi** so với Zupu và MyHeritage, nhưng trong MVP chỉ còn hai mẩu (điều hướng + mã cá nhân). Bản ra mắt đầu tiên sẽ **không thể hiện được điểm khác biệt mà PRD tự đặt làm lý do tồn tại**. Hoặc kéo một ý nữa vào MVP, hoặc hạ giọng ở §1.

---

### MN-5 · "Cửa sổ 49 ngày là thứ duy nhất không lấy lại được"

**Trạng thái: TIẾP THU XUẤT SẮC — mối nối được bảo toàn tốt nhất.**

FR-46 giữ nguyên cơ chế; **lập luận được chép lại gần nguyên văn** ngay dưới FR ("ký ức dồi dào nhất đúng lúc vừa mất, và đó cũng là lúc tuyệt đối không ai nghĩ đến nhập liệu"); §8.2 thêm ghi chú riêng *"nằm sát MVP dù không thuộc MVP — cơ hội không lặp lại"*; §10 có rủi ro "cụ mất trước khi kịp thu lời kể" với đối sách "ghi âm bằng điện thoại từ hôm nay". Đây là mẫu mực cho cách một mối nối nên được chuyển thể.

---

### MN-6 · "Bản demo giỗ Tổ đang yếu hơn nó có thể"

**Trạng thái: TIẾP THU ĐẦY ĐỦ, ĐÚNG TINH THẦN.**

FR-19 (QR chung) + UJ-4 (dựng thành hành trình) + addendum §C Giai đoạn 2 (đưa vào kịch bản ra mắt). Câu so sánh của nguồn — *"cùng công nghệ, khác một trời về sức lan / bà cụ 75 tuổi cũng làm được"* — được lặp ở **cả ba nơi**. FR-20 (gõ câu mô tả, tức phương án cũ của `project.md`) bị hạ xuống *"là đường phụ, không phải đường chính"* — đúng ý nguồn.

---

### MN-7 · "Nhịp tim chống chết-sau-3-tháng giờ có 5 cơ chế thay vì 1"

**Trạng thái: TIẾP THU 3/5, CÓ LỖI BIÊN TẬP.**

| 5 cơ chế nguồn | PRD |
|---|---|
| Đèn Chi | ✔ FR-42 |
| Cảnh báo chi nguội | ✔ FR-43 |
| Bảng nợ dữ liệu | ✔ FR-44 (kèm [ASSUMPTION] phản biện — tốt) |
| **Mỗi ngày một mẩu chuyện họ (Zalo OA)** | ✖ biến mất, kể cả backlog |
| **Widget một dòng nhúng Zalo/site khác** | ✖ biến mất, kể cả backlog |

Lập luận cốt lõi *"một nhịp tim là một điểm chết đơn"* được giữ nguyên ở lời dẫn §5.9 — tốt. Nhưng:

- **Lỗi số học:** §5.9 viết *"Đây là 4 cơ chế song song"* trong khi liệt kê 6 FR (FR-41…FR-46) và nguồn nói 5. Cần sửa con số.
- **Hai cơ chế mất là hai cơ chế đẩy (push) duy nhất.** Bốn cơ chế còn lại đều là *pull* — người dùng phải mở web mới thấy đèn chi hay bảng nợ. Nguồn cố ý trộn push và pull. Sau khi cắt, "nhịp tim" chỉ đập cho người đã vào web — tức là mất tác dụng với đúng nhóm đang nguội. Đây cũng là chỗ nối lại với MN-2: kênh Zalo là kênh duy nhất chạm được người không mở web, mà addendum §C lại xác định *"Zalo OA là kênh phân phối chính, thay app"*. PRD **mâu thuẫn nội bộ**: coi Zalo là kênh chính nhưng không có FR nào đẩy nội dung qua Zalo ngoài FR-41.
- §8.3 đẩy *"toàn bộ nhóm nhịp sống trừ FR-41"* ra ngoài MVP, trong khi nguồn coi đây là cơ chế chống chết của dự án. Hợp lý về thứ tự, nhưng nên ghi nhận đánh đổi.

---

## 2. Số phận 103 ý tưởng

**Thống kê:** ~46 ý thành FR/NFR · ~40 ý vào backlog addendum §E hoặc §C · **~17 ý biến mất hoàn toàn** (không FR, không backlog, không mục loại).

**Kỹ thuật được tiếp thu trọn vẹn:** 12 (Failure Analysis) — 5/5 ý thành NFR-2, NFR-4, NFR-10, FR-43, FR-6. 11 (TRIZ) — 6/6. 08 ($0 Mandate) — 5/5 vào addendum §C. 10 (Alien Anthropologist) — 6/6.

**Kỹ thuật hao hụt nặng nhất:** 09 (Morphological, 3/5 mất) · 02 (Ancestor Council, 2/8 mất nhưng là hai ý mang tải trọng) · 14 (Values Archaeology, 2/4 mất — và đây là kỹ thuật đào tới giá trị đáy).

### 2.1 Những ý biến mất đáng tiếc nhất

Xếp theo mức đáng tiếc, chỉ liệt kê thứ đáng bàn:

**① Mục "Chuyện thật" — ghi cả nghịch cảnh** *(kỹ thuật 06)*
Ghi ai sa ngã, ai bỏ làng, chi nào từng bị xóa tên; có kiểm duyệt hội đồng nhưng không né. Lập luận nguồn: *"thứ khiến người trẻ tin cuốn phả không phải tuyên truyền."* Không FR, không backlog, không mục loại — mất sạch. Đáng tiếc vì PRD §2.1 xác định nhóm "người tra cứu trẻ" sợ *"cảm thấy mình là người ngoài"*, và §1 lấy đáy giá trị là *"để con tôi biết nó là ai"*. Một cuốn phả chỉ có chuyện đẹp không trả lời được câu đó. Nếu loại vì lý do chính trị dòng họ thì phải ghi vào §7 — đây đúng loại quyết định cần Hiệp biết mình đang quyết.

**② Nghi thức nhận lại tên** *(kỹ thuật 14 — Values Archaeology)*
Người từng bỏ họ/đổi họ — con nuôi, thất lạc, con ngoài giá thú — có đường quay về được ghi nhận đàng hoàng, có quy trình và văn bản. Mất hoàn toàn. Đáng tiếc nhất về mặt **lập luận**: nó sinh ra trực tiếp từ đáy giá trị *"không thấy cô độc"* mà PRD dùng làm câu tuyên ngôn §1. PRD giữ cái đáy nhưng bỏ đúng cái ý duy nhất phục vụ người **đang** cô độc. FR-18 (phả cổ/phả mới) và §4 (Ngoại phả) chạm rìa nhưng không thay được — chúng là quy tắc hiển thị, không phải một con đường quay về.

**③ "Phả nghe được" (TTS)** *(kỹ thuật 02)* — xem MN-2. Mất mát có hệ quả rộng nhất, và không có lý do nào được nêu.

**④ "Ai đang nhớ đến cụ"** *(kỹ thuật 14)*
Mỗi trang cụ hiện số con cháu đã ghé thăm/thắp hương số trong năm. Lập luận: *"Không bị quên là nỗi sợ sâu nhất."* Rẻ, thuần web, tạo vòng phản hồi cho cả người sống lẫn người đã khuất — và là cơ chế duy nhất trong toàn bộ 103 ý biến trang cá nhân của một cụ thành thứ **có nhịp**. Đáng đưa vào F9 hoặc chí ít backlog §E.

**⑤ Lớp phủ đường mẫu hệ** *(kỹ thuật 06)*
Tô riêng mẹ, bà ngoại, ngoại tổ. Lập luận: *"nửa số người trong họ tự nhiên thấy mình có chỗ."* PRD có FR-18 (phả mới đủ nam nữ) và §E có trang "Về nhà chồng/nhà vợ", nhưng **cho phép có mặt ≠ vẽ được đường đi**. Đây là ý duy nhất biến phụ nữ trong phả từ *node* thành *đường huyết thống có thể lần theo*. Lập luận tâm lý mất theo.

**⑥ Tự sinh Tựa & Bạt cho mỗi ấn bản Tộc Sử** *(kỹ thuật 02)*
*"Cuốn phả tự kể lịch sử của chính nó"* — nêu ai đã đóng góp, đổi gì so với bản trước. Mất hoàn toàn. Đáng tiếc vì nó gần như miễn phí khi đã có FR-5 (dấu vết tu chỉnh) + FR-45 (điểm công đức) + NFR-10 (hash mỗi ấn bản) — chỉ là một view khác của dữ liệu đã có. Và nó xuất phát từ phán quyết của **Cụ Thủy tổ** trong hội đồng tiền nhân: *"phả nào cũng phải có tựa và bạt"* — một trong ba phán quyết của kỹ thuật 02, và là phán quyết duy nhất bị bỏ qua hoàn toàn.

**⑦ Thanh trượt 500 năm kèm mốc sử Việt** *(kỹ thuật 07)*
Lê–Trịnh, Tây Sơn, Pháp thuộc, 1945, 1954, 1975, Đổi Mới — *"thấy tổ tiên sống qua cái gì."* FR-5 có "xem lại cây như tại thời điểm X" nhưng đó là lịch sử **chỉnh sửa**, không phải lịch sử **dân tộc** — hai thứ khác hẳn về giá trị cảm xúc. Không vào §E. Đây là một trong vài ý WOW thuần túy của cả phiên (đúng nhiệm vụ được giao: "sinh tính năng WOW") mà lại rơi.

**⑧ Nhắc sinh nhật & ngày cưới kèm gợi ý xưng hô đúng khi nhắn chúc** *(kỹ thuật 09)*
Mất hoàn toàn. Đáng tiếc kép: (a) là cơ chế nhịp tim thứ 6 và là cái duy nhất chạm **người sống**; (b) là ứng dụng thực dụng nhất của F4 Xưng hô — biến một tính năng biểu diễn ở giỗ Tổ thành thứ dùng hằng tuần. Chi phí gần bằng 0 khi đã có FR-19/21.

**⑨ Poster tự sinh khổ A0** *(kỹ thuật 05)*
Một trang in toàn bộ cây, đủ đẹp để treo nhà thờ họ, tự cập nhật mỗi năm. FR-33 chỉ nói PDF chuẩn in theo thể thức phả. Addendum §C Giai đoạn 2 lại dựa vào vật in tại nhà thờ họ, và §C Chiến thuật $0 dùng "bạt treo giỗ họ" — poster A0 chính là bản có-code của đúng chiến thuật đó. Rơi giữa hai mục.

**⑩ Tộc Sử ba bản cùng nội dung** *(kỹ thuật 15)* — bản trang trọng cho các cụ / bản kể chuyện cho trẻ em / bản audio. Mất cả ba lớp. F7 chỉ có một giọng. Liên quan MN-2 và nhóm người dùng "người tra cứu" (trẻ con) trong §2.1.

**Mất nhưng chấp nhận được (ghi để không ai tưởng là sót):** WebXR nhà thờ họ (dù nguồn nhấn *"web-only vẫn làm được"* — nên đưa §E) · Chế độ giỗ Tổ "trực chiến" (một phần nằm ở addendum §C Giai đoạn 2) · Lịch bloc dòng họ · Sổ tay tế lễ cho trưởng chi (FR-41 có "văn khấn gợi ý") · Bảng "vụ án đã phá" · Audio guide nhà thờ họ · Chế độ khách dâng tư liệu (§2.2 loại nhà nghiên cứu ngoài họ — **loại ngầm**, nên nói rõ) · Kho giọng nói tổ tiên như một **bộ sưu tập nghe được** (băng gốc có được giữ ở FR-8/NFR-1, nhưng không ai nghe lại được).

### 2.2 Chỗ tiếp thu tốt hơn cả nguồn

Ghi nhận để cân bằng: PRD **thêm giá trị** ở vài chỗ — [ASSUMPTION] phản biện FR-44 ("đề nghị thử cả hai cách trên hai chi khác nhau"), NFR-1 bổ sung *"backup chưa từng restore là backup không tồn tại"*, ràng buộc *"kết quả bóc tách luôn vào Kho tồn nghi"* (§A.5), bộ **chỉ số ngược C1–C5** (không có trong nguồn, đo đúng mặt trái của FR-4, FR-3, FR-6, NFR-5, NFR-6), và hai mục loại mới suy ra đúng từ guardrail của chính nguồn (nhận diện mặt tự động, giả giọng người khuất).

---

## 3. Ba ý giáp ranh danh sách đã loại

**Trạng thái: 3/3 XỬ LÝ MINH BẠCH.** Đây là phần PRD làm sạch sẽ nhất.

| Ý giáp ranh | Xử lý trong PRD | Đánh giá |
|---|---|---|
| Trang "tôi là ai" gửi đời sau | **Nhận** thành FR-25, kèm [ASSUMPTION] nêu rõ vướng "Hộp thời gian" §2.4 của `project.md`, kèm chỉ dẫn *"nếu loại, xóa FR-25"*; §7 ghi *"Hộp thời gian khóa kín (so sánh FR-25)"*; Q3; có trong §13 chỉ mục giả định | ✔ Minh bạch. Lý do phân biệt (**công bố ngay, không khóa kín**) được giữ nguyên từ nguồn |
| "Cụ tổ hỏi thăm" | **Treo** — §7 bảng "Hai ý chờ Hiệp phán quyết", cột "Vướng: giáp ranh persona tổ tiên đã loại"; Q4 | ✔ Minh bạch |
| "Một ngày trong đời cụ" | **Treo** — §7 cùng bảng, giữ nguyên điều kiện của nguồn: *"bắt buộc nhãn phục dựng bối cảnh và cấm bịa lời cụ"* | ✔ Minh bạch, giữ đủ guardrail |

**Hai lưu ý nhỏ:**
- Nguồn xếp cả **ba** vào cùng một nhóm "cần Hiệp quyết". PRD xử lý bất đối xứng: một ý thành FR, hai ý treo. Bất đối xứng này **có giải thích** (FR-25 khác Hộp thời gian ở chỗ không khóa kín) và có đường lùi rõ ràng, nên chấp nhận được — nhưng §7 nên nói thẳng là "ba ý giáp ranh từ brainstorm, xử lý khác nhau vì…" thay vì để tiêu đề "Hai ý chờ phán quyết" làm mất dấu ý thứ ba.
- Ràng buộc của "Cụ tổ hỏi thăm" trong nguồn — *"cố tình giữ ở mức một câu nhắc nhiệm vụ, không giả giọng người đã khuất"* — chỉ được tóm bằng "giáp ranh persona tổ tiên", **mất mất vế thiết kế**. Nếu Hiệp duyệt nhận, ràng buộc này phải quay lại, nếu không tính năng sẽ trôi thành persona thật.

---

## 4. Nội dung định tính — cái dễ mất nhất

### 4.1 Giọng văn: GIỮ ĐƯỢC PHẦN LỚN

PRD không bị "PRD hóa" thành văn công nghiệp. Giữ được: đề từ 「光前裕後」; đăng ký ngôn ngữ phả học Việt (phàm lệ, tồn nghi, húy, phạm húy, ngoại phả, chiêu mục) được **chuẩn hóa hẳn thành §4 Thuật ngữ** — tốt hơn nguồn về mặt vận hành; và những câu sắc của nguồn được chép lại thay vì diễn giải nhạt ("không ai đóng góp vào một trang trắng", "một nhịp tim là một điểm chết đơn", "cuốn sách tự đi xin dữ liệu", "băng ghi âm không hỏng theo thời gian; các cụ thì có"). UJ-1 (bà Nhàn 84 tuổi, cháu Quân, "hồi đói Ất Dậu") là **sáng tác mới** đúng giọng nguồn — chuyển thể tốt, không phải sao chép.

### 4.2 Tính nghi lễ: MẤT NGUYÊN LÝ, GIỮ VÀI HIỆN VẬT

Đây là mất mát định tính lớn nhất.

Kỹ thuật 01 mở đầu bằng một **nguyên lý thiết kế**, không phải một danh sách: *"Thiết kế mỗi tính năng như một nghi lễ: có ngưỡng bước qua, có cử chỉ, có sự biến đổi mà người tham dự trải qua."* Nguyên lý này **không xuất hiện ở bất kỳ đâu trong PRD hay addendum**. Không có nguyên tắc UX nào nói tính năng phải có ngưỡng/cử chỉ/biến đổi.

Hệ quả cụ thể, đã thấy được:
- 11 ý nghi lễ → chỉ 3 thành FR (FR-46 cửa sổ 49 ngày, FR-42 đèn chi, FR-45 tạ ơn người dâng tư liệu). 8 ý còn lại vào §E dưới dạng **danh sách tên trần**, mất sạch phần mô tả cử chỉ — thứ vốn là toàn bộ nội dung của chúng. Ví dụ "Lễ Nhập Phả số" trong §E chỉ còn 4 chữ; phần *"bấm nút trước bàn thờ → chứng thư có ấn triện → in ra kẹp vào phả giấy"* — tức là cái nghi lễ — biến mất.
- "Lễ Khai Phả đầu năm" mất kèm phần **có giá trị kỹ thuật nhất** của nó: *"đóng sổ năm — snapshot bất biến của cây năm đó"*, vốn ăn khớp trực tiếp với FR-5 và NFR-10.
- FR-14 giữ được lõi "thông báo node mới" nhưng bỏ *"hiệu ứng lộc nảy kèm tiếng chuông nhỏ"* — chi tiết cảm giác đúng là thứ biến thông báo thành nghi thức.
- FR-13 "Trả công tức thì" là ý gần nhất với tinh thần nghi lễ (ngưỡng bước qua + biến đổi) nhưng PRD mô tả nó thuần công năng ("cơ chế giữ chân, không phải trang trí") — đúng nhưng lạnh.

**Đề nghị:** thêm một nguyên tắc thiết kế vào PRD (hoặc chuyển thẳng cho `bmad-ux`): *"Những khoảnh khắc chuyển trạng thái — vào phả lần đầu, một cụ mất, đóng sổ năm, một chi được xác nhận — phải có ngưỡng, cử chỉ và dấu vết, không được là một toast message."* Nếu không, nguyên lý này sẽ chết ở khâu UX chứ không phải ở khâu PRD.

### 4.3 Lập luận tâm lý dòng họ: KHOẢNG 60% ĐƯỢC GIỮ

**Giữ được (giữ cả lập luận, không chỉ tính năng):**
- "Xấu hổ mạnh hơn khen thưởng trong văn hóa họ" → FR-44, còn được **phản biện** thêm bằng [ASSUMPTION]. Đây là cách xử lý mẫu mực: giữ lập luận + đánh dấu nó chưa được kiểm chứng.
- "Áp lực xã hội đi tìm ảnh, miễn phí" → FR-17 giữ nguyên vế "chi phí bằng không".
- "Người ta thích kể hơn thích điền" → §3.
- "Chụp màn hình gửi nhóm chị em — đó là cơ chế lan truyền, không phải tính năng chia sẻ" → UJ-2, sáng tác mới đúng mạch.
- "Không ai đóng góp vào một trang trắng" → §3.
- "Với các cụ, cuốn sách là bằng chứng dự án nghiêm túc" → addendum §C.
- Nỗi sợ của bốn nhóm người dùng (§2.1 cột "Cái họ sợ") — **hoàn toàn mới**, không có trong nguồn, và đúng mạch tâm lý dòng họ.

**Mất:**
- *"Nỗi sợ sửa phả là báng bổ"* (MN-1) — mất, dù đó là một trong ba lý do tồn tại của FR-3.
- *"Không bị quên là nỗi sợ sâu nhất"* (ý ④) — mất cùng tính năng.
- *"Nửa số người trong họ tự nhiên thấy mình có chỗ"* (ý ⑤) — mất cùng tính năng.
- *"Thứ khiến người trẻ tin cuốn phả không phải tuyên truyền"* (ý ①) — mất cùng tính năng.
- *"Tao không đọc được chữ"* — phán quyết của **Bà cụ truyền miệng** trong hội đồng tiền nhân. Đây là một trong ba tiếng nói của kỹ thuật 02; nó sinh ra "phả nghe được". Cả tiếng nói lẫn tính năng đều mất. Trong ba phán quyết tiền nhân, chỉ **"chỗ chưa chắc thì ghi là khuyết nghi"** (nhà nho chép sử) sống sót — thành `tồn nghi`, xuyên suốt PRD.

### 4.4 Ràng buộc gốc

Nguồn tự ràng buộc: *"web-only, và tôn trọng danh sách đã loại."* PRD tôn trọng cả hai, và còn **mở rộng** danh sách loại đúng tinh thần (§7 thêm nhận diện mặt tự động, tổng hợp giả giọng — cả hai đều suy ra từ guardrail nội tại của chính các ý trong nguồn). Không phát hiện trường hợp nào PRD lén nhận một ý đã bị loại.

---

## 5. Việc đề nghị làm (xếp theo mức cấp thiết)

1. **Quyết dứt điểm kênh thoại (MN-2).** Hoặc thêm FR "bản đọc TTS Tộc Sử/tiểu sử", hoặc ghi vào §7 kèm lý do. Hiện trạng — biến mất không dấu vết — là dạng tệ nhất.
2. **Sửa "4 cơ chế" ở §5.9**, và quyết về 2 nhịp tim đẩy đã mất (mẩu chuyện hằng ngày, widget một dòng). Gắn với mâu thuẫn "Zalo là kênh phân phối chính nhưng không có FR nào đẩy qua Zalo".
3. **Xử lý minh bạch mục "Chuyện thật" và "Nghi thức nhận lại tên"** — nhận, backlog, hay loại có lý do. Đây là hai ý mang lập luận giá trị nặng nhất trong số đã mất.
4. **Bổ sung nguyên lý "thiết kế như nghi lễ"** vào PRD hoặc bàn giao rõ cho `bmad-ux`; kèm phục hồi "đóng sổ năm = snapshot bất biến" vào F1/F7.
5. **Bổ sung vào backlog §E** những ý rơi ngoài mọi danh sách: Ai đang nhớ đến cụ · lớp phủ mẫu hệ · Tựa & Bạt tự sinh · thanh trượt 500 năm · nhắc sinh nhật kèm xưng hô · poster A0 · Tộc Sử ba bản · WebXR nhà thờ họ.
6. **Bổ sung một câu vào §5.1** về "nỗi sợ sửa phả là báng bổ", và làm rõ Kho tồn nghi là **công khai** (phả nháp).
7. **Xem lại MN-4:** khác biệt cốt lõi được tuyên bố ở §1 nhưng gần như không hiện diện trong MVP.
