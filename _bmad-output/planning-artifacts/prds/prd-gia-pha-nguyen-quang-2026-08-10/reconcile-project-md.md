---
title: "Đối chiếu nguồn — docs/project.md ↔ prd.md + addendum.md"
source: "C:/Users/nguye/dev/nguyenquang/docs/project.md"
targets:
  - "prd.md"
  - "addendum.md"
date: 2026-08-10
---

# Đối chiếu nguồn: `docs/project.md` → `prd.md` + `addendum.md`

**Nguồn:** `docs/project.md` — "DỰ ÁN GIA PHẢ DÒNG HỌ NGUYỄN QUANG", bản chốt phạm vi 08/2026, 225 dòng, 6 mục.

**Ký hiệu trạng thái**

| Ký hiệu | Nghĩa |
|---|---|
| ✅ | Đã hạ cánh đầy đủ |
| ◐ | Hạ cánh một phần — mất sắc thái, chi tiết, hoặc lập luận đi kèm |
| ⚠️ | Đã biến đổi có chủ ý (quyết định bị đảo/thay) — cần xác nhận |
| ❌ | Rơi hoàn toàn |

**Phân loại mức rơi:** (a) rơi có chủ ý và hợp lý · (b) rơi đáng ngờ — nên đưa vào · (c) rơi nghiêm trọng — mất thông tin quyết định.

---

## 0. Tóm tắt số liệu

| Nhóm | Đầy đủ | Một phần | Biến đổi | Rơi |
|---|---|---|---|---|
| §1 Định vị & nguyên tắc | 4 | 1 | 1 | 1 |
| §2.1–2.2 Tính năng đã chốt | 7 | 4 | 1 | 1 |
| §2.3 Backlog WOW (7 mục) | 0 | 7 | 0 | 1 (quyết định con) |
| §2.4 Đã loại | 6 | 0 | 0 | 0 |
| §3 Kiến trúc | 18 | 5 | 2 | 3 |
| §4 Benchmark | 8 | 1 | 0 | 0 |
| §5 Triển khai & rủi ro | 12 | 4 | 0 | 2 |
| §6 Việc tiếp theo | 3 | 1 | 0 | 1 |

**Nhận định chung:** tỷ lệ bảo toàn cao — `addendum.md` làm rất tốt việc hứng đúng loại nội dung mà cấu trúc FR thường làm rơi (benchmark, kế hoạch triển khai, chiến thuật $0, phương án đã loại). Cái rơi tập trung vào ba chỗ: **tên riêng và quyết định nhỏ nằm lẫn trong văn xuôi** (chữ đệm "Quang", tên miền, tên "Quang Gia Tộc Sử"), **lập luận kinh tế/tâm lý đi kèm tính năng backlog**, và **một mâu thuẫn thứ tự ưu tiên giữa PRD §8 với addendum §C**.

---

## 1. Đối chiếu chi tiết theo mục nguồn

### §0 — Đầu tài liệu

| Nội dung nguồn | Trạng thái | Hạ cánh ở | Ghi chú |
|---|---|---|---|
| Slogan 「光前裕後」— Quang Tiền Dụ Hậu | ◐ | `prd.md` dòng 10 | Chỉ giữ Hán tự + phiên âm |
| Diễn nghĩa slogan: *"Rạng danh tổ tiên, mở đường hậu thế"* | ❌ | — | **(b)** Đây là câu diễn giải duy nhất của biểu tượng trung tâm dự án. PRD §1 tự viết lại tầm nhìn bằng câu "Để con tôi biết nó là ai và không thấy cô độc" — hay hơn, nhưng hai câu này **không thay thế nhau**: một câu nhìn về trước (tổ tiên), một câu nhìn về sau (con cháu). Slogan chính là cầu nối hai vế. Nên khôi phục diễn nghĩa vào `prd.md` §1. |
| Chủ trì: Nguyễn Hiệp | ✅ | `prd.md` §2.1, §10, NFR-3 | |
| "Nền tảng web quản lý & khai thác **tri thức** dòng họ bằng AI/LLM" | ◐ | `prd.md` §1 | Định vị chuyển từ "khai thác tri thức bằng AI" sang "công cụ để dòng họ tự viết ra chính mình". Xem mục ⚠️ ở §1 dưới. |

### §1 — Định vị & nguyên tắc

| Nội dung nguồn | Trạng thái | Hạ cánh ở | Ghi chú |
|---|---|---|---|
| Web-only, không app mobile, responsive tốt trên điện thoại | ✅ | `prd.md` §7; `addendum.md` §F; NFR-5 | Còn được bổ sung rủi ro + đối sách (UJ-1) |
| Mô hình tông tộc Á Đông: cùng vận hành một cuốn phả chung; trưởng họ/trưởng chi duyệt, con cháu đề xuất | ⚠️ | `prd.md` §1, FR-3, FR-4 | FR-4 "đồng thuận nhẹ 3 người/2 chi" **đi chệch** mô hình nguồn: khẳng định có thể lên Chính phả **không cần trưởng họ**. PRD đã tự gắn `[ASSUMPTION]` và Q2 — xử lý đúng. Ghi nhận là biến đổi có ý thức, không phải rơi. |
| Khác mô hình cá nhân tra cứu kiểu phương Tây | ✅ | `prd.md` §1; `addendum.md` §D dòng cuối | |
| **Khác biệt cốt lõi: "LLM hội thoại trên knowledge graph dòng họ — khoảng trống các nền tảng TQ chưa làm trọn"** | ⚠️❌ | — | **(b) đáng ngờ.** PRD §1 thay khác biệt cốt lõi bằng mệnh đề khác: "dữ liệu của chung + trải nghiệm lấy từng người làm tâm". Đây là **thay một tuyên bố định vị bằng một tuyên bố định vị khác**, không phải tinh chỉnh. Tuyên bố cũ biến mất khỏi cả hai file (addendum §D chỉ ghi khoảng trống MỚI). Cần một dòng ghi nhận: "khác biệt cốt lõi đã được định nghĩa lại ngày 10/08" — nếu không, sáu tháng nữa không ai biết vế "LLM trên KG" đã bị hạ cấp có chủ ý hay bị quên. |
| Đặc thù Việt — xưng hô tiếng Việt | ✅ | FR-19, FR-20, FR-21, NFR-9 | Còn được mở rộng (FR-21 xưng hô văn bản trang trọng) |
| Đặc thù Việt — âm lịch giỗ chạp | ✅ | FR-41; `addendum.md` §A.4 (`amlich.js`) | |
| Đặc thù Việt — văn khấn | ✅ | FR-41 | |
| Đặc thù Việt — tư liệu Hán-Nôm (sắc phong, văn bia) | ◐ | FR-9, NFR-9, `addendum.md` §A.5, §E | Hán-Nôm ✅; "văn bia" ✅ (pg_search); "**sắc phong**" chỉ còn xuất hiện trong backlog "Bảo tàng hiện vật họ". Trường JSONB dành cho thuộc tính linh hoạt kiểu sắc phong bị rơi khỏi §A.1 — xem §3 dưới. |
| **Tên miền (chưa chốt): `nguyenquangtoc.vn` / `quangtocduong.vn` ("Quang Tộc Đường", trang trọng) / `nguyenquang.family`** | ❌ | — | **(c) rơi nghiêm trọng.** Ba tên riêng cụ thể + lý do chọn từng cái, cộng với trạng thái "chưa chốt". Không tồn tại ở bất kỳ đâu trong `prd.md` hay `addendum.md`, và **không có trong §12 Câu hỏi mở**. Đây là một quyết định đang treo, có ứng viên đã sàng lọc, bị xóa sạch khỏi chuỗi tài liệu. Chi phí khôi phục: phải nghĩ lại từ đầu. Đề nghị: thêm Q11 vào `prd.md` §12 hoặc một mục §G "Quyết định đang treo" trong addendum. |

### §2.1 — Lõi dữ liệu & AI

| Nội dung nguồn | Trạng thái | Hạ cánh ở | Ghi chú |
|---|---|---|---|
| Cây phả hệ tương tác: zoom theo chi, collapse theo đời | ✅ | FR-15 | |
| "Đường về Tổ" tô sáng cho mỗi thành viên | ✅ | FR-13, FR-16 | Được nâng cấp thành điều hướng mặc định — tốt hơn nguồn |
| Công nghệ: D3.js / family-chart / Cytoscape.js | ◐ | `addendum.md` §A.4 | `Cytoscape.js` rơi — **(a)** hợp lý, `family-chart` đã chốt |
| Xưng hô LLM: gõ câu mô tả quan hệ → nhận diện node → xưng hô hai chiều → sơ đồ tô sáng | ✅ | FR-20 | Bị hạ xuống "đường phụ" nhường FR-19 (QR chung) — có ghi lý do rõ ở `prd.md` UJ-4 và `addendum.md` §C. Xử lý tốt. |
| Pipeline: câu → LLM trích quan hệ → Cypher → Neo4j → dịch xưng hô | ⚠️ | `addendum.md` §A.2, §A.5, §F | Neo4j → Apache AGE; Text2Cypher bị loại có ghi lý do. ✅ |
| **Thám tử phả hệ — nhãn "*(ưu tiên cao — rất cần)*"** | ⚠️ | FR-26…29; `prd.md` §8.3 | **(b) đáng ngờ.** Nguồn đánh dấu đây là tính năng ưu tiên cao nhất trong §2.1, bằng chữ của Lead ("rất cần"). PRD đẩy toàn bộ F6 **ra ngoài MVP** mà không ở đâu ghi nhận rằng mình đang hạ một ưu tiên đã được Lead nêu rõ. Lập luận hạ cấp (chưa có dữ liệu thì chưa có mâu thuẫn để rà) là đúng — nhưng cần nói ra, giống cách §8.3 đã tử tế ghi `[ASSUMPTION]` cho F5 Gia phong. |
| Rule cụ thể: năm sinh con ≤ năm sinh cha + 15 | ✅ | FR-26 | Giữ nguyên con số 15 |
| Rule: ngày mất trước ngày sinh, vòng lặp quan hệ | ✅ | FR-26 | |
| Lỗ hổng: chi thiếu nhiều đời, node mồ côi, thiếu phối ngẫu | ✅ | FR-27 | |
| "Dữ liệu tự làm sạch qua **crowdsourcing có kiểm soát**" | ◐ | FR-3, FR-28 | Cơ chế ✅; cụm từ định hướng "crowdsourcing có kiểm soát" (vốn là lời tóm tắt triết lý vận hành) không còn — **(a)**, FR-3 diễn đạt cùng ý mạnh hơn |
| **Tên riêng "Quang Gia Tộc Sử"** | ❌ | — | **(c) rơi nghiêm trọng — mất tài sản biểu tượng.** Cả PRD lẫn addendum chỉ gọi "Tộc Sử". Chữ **Quang** trong tên sách chính là chữ Quang trong 光前裕後 và trong "Nguyễn Quang" — tên sách là nơi slogan hạ cánh thành sản phẩm sờ được. Mất tên = mất mối nối đó. Cả `addendum.md` §C ("bản in thử đặt lên bàn thờ") cũng đã lược tên. Đề nghị khôi phục ở FR-30 và §C Giai đoạn 2. |
| Tộc Sử: tự sự chương hồi, cập nhật hằng năm, xuất PDF/bản in tặng ngày giỗ Tổ | ✅ | FR-30, FR-33; `addendum.md` §C GĐ3 | |

### §2.2 — Cộng đồng & vận hành

| Nội dung nguồn | Trạng thái | Hạ cánh ở | Ghi chú |
|---|---|---|---|
| Node mới — Welcome: tạo node → thông báo toàn họ → nhánh mới sáng lên realtime | ✅ | FR-14; `addendum.md` §C GĐ3 | |
| "Biến nhập liệu thành sự kiện vui" | ✅ | FR-14 (nguyên văn) | Giọng điệu được giữ — tốt |
| Trường hợp "dâu/rể nhập tộc" là nguồn node mới | ◐ | FR-14 (nói chung), FR-7, FR-18 | Không mất, nhưng FR-14 không còn nêu dâu/rể như trường hợp điển hình |
| **Bản đồ di cư**: timeline đời 1 → nay; chấm sáng lan từ quê Tổ ra các tỉnh, ra nước ngoài; kể chuyện *"họ ta đã đi xa đến đâu"* | ◐❌ | `prd.md` §8.3 (một chữ trong danh sách); `addendum.md` §E (một chữ trong danh sách) | **(b) đáng ngờ, sát ngưỡng (c).** Đây là tính năng thuộc danh mục **"ĐÃ CHỐT"** §2.2 — cùng hạng với Node mới, Điểm công đức, Lịch giỗ. Ba tính năng kia đều có FR (FR-14, FR-45, FR-41); **bản đồ di cư là tính năng "đã chốt" duy nhất không có FR nào**, bị tụt thẳng xuống backlog cùng hạng với các ý brainstorm chưa thẩm định. Toàn bộ mô tả hành vi (timeline kéo, chấm sáng lan) và câu định vị cảm xúc *"họ ta đã đi xa đến đâu"* biến mất. Nghịch lý: `addendum.md` §A.4 vẫn giữ MapLibre GL + deck.gl trong ngăn xếp — tức là stack cho một tính năng không còn tồn tại trong phạm vi. Đề nghị: hoặc viết FR-47 (ngoài MVP), hoặc bỏ MapLibre khỏi §A.4 cho nhất quán. |
| Điểm công đức: đóng góp ảnh, tư liệu, xác minh, hoàn thành nhiệm vụ Thám tử | ✅ | FR-45 | Còn được thêm: tên in chân trang Tộc Sử |
| **"Bảng vàng theo chi" + lập luận "tâm lý thi đua giữa các chi"** | ⚠️◐ | FR-44 + `[ASSUMPTION]` | **(b) đáng ngờ.** PRD **đảo ngược** cơ chế: bảng vàng (khen) → bảng nợ dữ liệu (xấu hổ), dựa trên lập luận brainstorm "xấu hổ mạnh hơn khen thưởng". PRD trung thực gắn `[ASSUMPTION]` + Q6 + đề nghị A/B trên hai chi — xử lý rất tốt. **Nhưng** lập luận văn hóa gốc của `project.md` ("khai thác **máu thi đua giữa các chi**", `addendum.md` §C GĐ3 cũng lược mất cụm này) không được ghi lại làm phương án đối chứng. Khi chạy A/B ở Q6, phương án B chính là bảng vàng theo chi — cần có mô tả của nó ở đâu đó. |
| Lịch giỗ thông minh: tự tính âm lịch, nhắc trước 1 tuần | ✅ | FR-41 | Con số "1 tuần" được giữ |
| Kênh nhắc: **email / Zalo OA** | ◐ | `addendum.md` §C GĐ3 (Zalo OA) | FR-41 không nêu kênh; email biến mất hẳn. **(a)** chấp nhận được — kênh là việc của kiến trúc/UX — nhưng Zalo OA là quyết định phân phối quan trọng, đang chỉ nằm ở addendum. |
| Kèm tiểu sử cụ + văn khấn gợi ý | ✅ | FR-41 | |

### §2.3 — Backlog WOW vòng 2 (7 mục, xếp hạng 1→7 của Lead)

| Nội dung nguồn | Trạng thái | Hạ cánh ở | Ghi chú |
|---|---|---|---|
| Trạng thái "toàn bộ vào backlog, chọn ở sprint planning sau" | ✅ | `addendum.md` §E mở đầu | |
| **Thứ tự ưu tiên sơ bộ 1→7 của Lead** | ✅ | `addendum.md` §E, dòng "xếp hạng sơ bộ của Lead" | Thứ tự liệt kê trùng khớp 1→7. Bảo toàn tốt, nhưng **ngầm** — thứ tự chỉ đúng nếu không ai sắp xếp lại danh sách. Đề nghị đánh số 1.–7. tường minh. |
| 1. QR mộ phần & bản đồ tảo mộ — QR tại bia mộ, pin GPS MapLibre, thứ tự thắp hương Thanh minh | ◐ | `addendum.md` §E (tên gọi); §E nhóm nghi lễ ("Thứ tự thắp hương chiêu mục") | Mô tả hành vi rơi hết |
| **Lập luận: "Giải nỗi đau chỉ 1-2 cụ già còn nhớ vị trí mộ"** | ❌ | — | **(b) đáng ngờ.** Đây là **lý do tồn tại** của tính năng #1, và nó cùng họ với lập luận trung tâm của PRD ("nguồn dữ liệu đang chết dần" §3.2, FR-46 cửa sổ 49 ngày). Một câu, mất một mối nối rất mạnh giữa backlog và luận điểm cấp bách của PRD. |
| 2. Nhà in phả tự động — thể thức phả Việt, phả đồ/phả ký, tự đánh số đời, mục lục theo chi | ✅ | FR-33 | Bảo toàn tốt |
| **Con số: tái bản phả giấy chi phí ~0 thay vì "mỗi lần tu phả tốn vài chục triệu"** | ❌ | — | **(b) đáng ngờ.** Con số tiền duy nhất trong toàn bộ `project.md`. Đây là lập luận ROI để thuyết phục Hội đồng gia tộc chi tiền quỹ họ (liên quan trực tiếp đối sách "chi phí hạ tầng lấy từ quỹ họ" ở §5 → `prd.md` §10). Mất con số = mất đòn bẩy thuyết phục. |
| **"Với các cụ, đây là sản phẩm chính"** | ◐ | `addendum.md` §C GĐ2 ("với các cụ, cuốn sách là bằng chứng dự án nghiêm túc"); `project.md` §3.4 cũng có câu tương đương | Ý được giữ ở dạng khác — **(a)** chấp nhận |
| 3. Nhận họ — form (tên ông/cụ, quê gốc, năm ước chừng) → fuzzy-match → "đề xuất nhận họ" cho Ban tu phả thẩm định | ◐ | `addendum.md` §E (tên gọi); §E nhóm mở rộng (ADN cho Việt kiều) | Cơ chế và luồng thẩm định rơi |
| **"Mỗi lần nhận họ thành công = sự kiện lan truyền mạnh nhất"** | ❌ | — | **(b) đáng ngờ.** PRD rất coi trọng cơ chế lan truyền (UJ-2: "đó là cơ chế lan truyền, không phải tính năng chia sẻ"). Đây là mệnh đề nói rằng có một cơ chế lan truyền **mạnh hơn** cái PRD đang dựa vào. Đáng nằm trong §E kèm một dòng. |
| **4. Tự bối — ĐÃ CHỐT: dòng họ lấy "Nguyễn Quang" làm gốc, chữ đệm "Quang" CỐ ĐỊNH mọi đời (không dùng chữ bối đổi theo đời)** | ❌ | — | **(c) RƠI NGHIÊM TRỌNG — mất một quyết định đã chốt.** Xem phân tích riêng ở §2 dưới. |
| 4b. Kiểm nếp "Nguyễn Quang + tên" khi thêm node; LLM gợi ý tên hợp; **tra trùng tên các cụ để tránh phạm húy** | ◐ | `addendum.md` §E ("Tự bối (trợ lý đặt tên, kiểm phạm húy)"); `prd.md` §4 định nghĩa "húy", "phạm húy" | Chức năng kiểm phạm húy ✅ ghi nhận; **quy tắc validate "Nguyễn Quang + tên" ở bước thêm node** rơi hẳn — mà đây là ràng buộc nhập liệu, thuộc FR-11/FR-12, không thuộc backlog |
| 5. Dòng họ qua những con số — dân số theo đời, tuổi thọ TB từng thời kỳ, tháp tuổi, phân bố nghề/học vị, tỷ lệ xa quê | ◐ | `addendum.md` §E ("Dòng họ qua những con số") | Danh sách chỉ số cụ thể rơi — **(a)** chấp nhận với backlog |
| **"Thành báo cáo thường niên mở màn họp họ"** | ❌ | — | **(a/b) ranh giới.** Là một mối nối giữa tính năng và nghi thức họp họ — cùng loại với "mỗi giỗ Tổ công bố ấn bản Tộc Sử mới" (đã giữ). Rẻ để giữ, một mệnh đề. |
| 6. Trang vàng gia tộc — gắn thẻ cụ có thành tựu (khoa bảng, liệt sĩ, nghệ nhân) | ◐ | `addendum.md` §E | |
| 6b. **LLM đối chiếu timeline mỗi cụ với sự kiện lịch sử VN**; "làm sau khi dữ liệu dày" | ❌ | — | **(b) đáng ngờ.** "Đối chiếu timeline với sử VN" là một tính năng AI riêng biệt (khác với gắn thẻ danh nhân), và nó giáp ranh trực tiếp với hai ý đang chờ phán quyết ở `prd.md` §7 ("Một ngày trong đời cụ" — dựng lại bối cảnh từ sử liệu). Khi Hiệp trả lời Q4, đây là dữ kiện liên quan. Điều kiện "làm sau khi dữ liệu dày" là một ràng buộc thứ tự, cũng mất. |
| 7. Đố vui gia tộc — quiz LLM tự sinh từ graph, ví dụ *"Cụ Thủy tổ húy là gì?"*; chơi tại giỗ họ qua QR; bảng điểm chiếu màn hình; điểm cộng vào hệ công đức; chi phí xây ~0 | ◐ | `addendum.md` §E ("Đố vui gia tộc") | Toàn bộ cơ chế (QR tại giỗ, chiếu màn hình, nối vào công đức, chi phí ~0) rơi — **(b)** nhẹ: cơ chế "chơi tại giỗ họ qua QR + chiếu màn hình" là một mẫu hình phân phối tái dùng được (giống FR-19, FR-28 in giấy), đáng giữ một dòng |
| Số liệu 12%→45% người dùng trẻ | ✅ | `addendum.md` §D | Bảo toàn |

### §2.4 — Đã loại khỏi phạm vi

| Nội dung nguồn | Trạng thái | Hạ cánh ở |
|---|---|---|
| ❌ App mobile | ✅ | `prd.md` §7; `addendum.md` §F (kèm lý do "chi phí gấp đôi, đội một người") |
| ❌ Chatbot hội thoại tự do ("Tộc phả AI") | ✅ | `prd.md` §7 |
| ❌ "Trò chuyện với Tổ tiên" (persona AI người đã khuất) | ✅ | `prd.md` §7; còn được dùng làm chuẩn xét cho ý "Cụ tổ hỏi thăm" |
| ❌ Phục chế ảnh gia tiên bằng AI | ✅ | `prd.md` §7 |
| ❌ Chân dung đời nối đời (morph khuôn mặt) | ✅ | `prd.md` §7 |
| ❌ Hộp thời gian | ✅ | `prd.md` §7 + FR-25 + Q3 (phân biệt rõ "khóa kín" vs "công bố ngay") |

Mục này bảo toàn **100%** và còn được mở rộng đúng tinh thần (thêm nhận diện khuôn mặt tự động, giả giọng người đã khuất). Không có gì để nêu.

### §3 — Kiến trúc kỹ thuật

| Nội dung nguồn | Trạng thái | Hạ cánh ở | Ghi chú |
|---|---|---|---|
| §3.0 Full TypeScript, một codebase, shared types DB→API→UI | ✅ | `addendum.md` §A.1 | |
| §3.0 AI gọi qua API, không chạy model local → không cần backend Python | ✅ | `addendum.md` §A.1, §A.5, §F | |
| §3.0 Postgres-only, bỏ Neo4j — "graph chỉ vài nghìn node, recursive CTE đủ nhanh" | ⚠️ | `addendum.md` §A.2, §F | Đổi sang Apache AGE, có ghi lại lý do và ghi rõ lập luận "bớt một DB" vẫn được giữ. Xử lý mẫu mực. |
| §3.0 **"VPS chạy đúng 2 container — Next.js + ParadeDB"** | ◐ | `addendum.md` §A.3 ("hoặc chấp nhận hai container"), §A.6 (Docker Compose 1 VPS) | **(a/b).** Ràng buộc gốc là **đúng 2 container** như một mục tiêu tối giản vận hành; addendum lại coi "hai container" là **phương án dự phòng xấu** nếu AGE + ParadeDB không gộp được. Ngữ nghĩa bị lật ngược. Không nguy hiểm, nhưng khi `bmad-architecture` đọc §A.3 sẽ không biết rằng 2 container vốn là mức trần đã được chấp nhận từ đầu. |
| §3.1 Next.js 15 full-stack | ⚠️ | `addendum.md` §A.2 | Ghi rõ "chưa chốt tách hay gộp" ✅ |
| §3.1 React + **TailwindCSS** | ◐ | `addendum.md` §A.1 (React) | TailwindCSS rơi — **(a)** hợp lý, để `bmad-ux`/architecture quyết |
| §3.1 family-chart, topola, MapLibre+deck.gl, Drizzle, Anthropic TS SDK + Zod, amlich.js, read-gedcom/gedcom7, NextAuth | ✅ | `addendum.md` §A.4 (đủ 8 dòng) | Bảo toàn nguyên vẹn, kể cả tên tác giả (donatso, PeWu, Hồ Ngọc Đức) và giấy phép MIT |
| §3.1 graphology (tính đường quan hệ, quét mâu thuẫn) | ⚠️ | `addendum.md` §A.3 ("có thể bỏ hẳn") | Có ghi lại câu hỏi mở ✅ |
| §3.1 **PostgreSQL 17** | ❌ | — | **(a).** Phiên bản cụ thể rơi. Nhẹ, nhưng §A.3 lại nêu đúng rủi ro "phải kiểm tra tương thích phiên bản PostgreSQL của cả hai" — có con số gốc thì kiểm tra dễ hơn. Nên thêm lại một chữ. |
| §3.1 pgvector (RAG Tộc Sử), pg_search BM25 + ICU tokenizer + unaccent | ✅ | `addendum.md` §A.1 | Nguyên văn |
| §3.1 **JSONB → thuộc tính linh hoạt (sắc phong…)** | ❌ | — | **(b) đáng ngờ.** Đây là quyết định schema cho tư liệu Hán-Nôm phi cấu trúc — thuộc đúng loại nội dung `addendum.md` §A.3 gọi là "quyết định schema quan trọng nhất của dự án". Không xuất hiện trong §A.1 lẫn §A.3. |
| §3.1 **ltree → mã chi "1.3.2" filter nhanh** | ✅ | `addendum.md` §A.3 (câu hỏi "AGE vs ltree") ; `prd.md` §4, FR-13 | Mã chi `1.3.2` giữ nguyên làm ví dụ ✅ |
| §3.1 MinIO/S3 hoặc object storage của VPS provider | ✅ | `addendum.md` §A.6 | |
| §3.1 Docker Compose, 1 VPS, backup = pg_dump | ✅ | `addendum.md` §A.6; NFR-1, NFR-3 | |
| §3.2 Xưng hô LLM: chỉ parse ra Zod schema, không Text2Cypher, chống prompt injection | ✅ | `addendum.md` §A.5, §F | Nguyên vẹn cả ba lý do (an toàn, rẻ, chống injection) |
| §3.2 Thám tử: rule engine trước, "chính xác 100%, miễn phí", LLM chỉ viết lời giải thích | ✅ | FR-26, `addendum.md` §A.5 | |
| §3.2 Tộc Sử: RAG hybrid pgvector + pg_search | ✅ | `addendum.md` §A.5 | Còn được nâng thành ràng buộc kiến trúc (NFR-6) — mạnh hơn nguồn |
| §3.2 Python chỉ xuất hiện nếu cần model local (OCR Hán-Nôm), tách worker riêng | ✅ | `addendum.md` §A.5 (gần nguyên văn) | |
| §3.3 Sáu repo tham chiếu ("học, không fork") | ✅ | `addendum.md` §B (đủ 6) | Còn được ánh xạ sang FR tương ứng — tốt hơn nguồn |
| §3.4 GEDCOM 7 import/export | ✅ | `addendum.md` §A.6; FR-40; NFR-2 | Được tái sử dụng làm định dạng sao lưu phân tán — thông minh |
| §3.4 Xuất sách giấy đúng thể thức phả truyền thống; **"với thế hệ lớn tuổi, cuốn phả in mới là 'thật'"** | ✅ | FR-33; `addendum.md` §C GĐ2 | Giọng điệu được giữ |
| §3.5 Số hóa: scan phả giấy/Hán-Nôm → LLM vision OCR → trích thực thể (tên, năm sinh-mất, đời, chi, phối ngẫu) → người duyệt chỉ xác nhận | ✅ | FR-9; `addendum.md` §A.5 | ⚠️ Bối cảnh đổi: PRD §0 tuyên bố **không có phả gốc để scan**. FR-9 chuyển đối tượng sang sổ tang/bia mộ/giấy tờ — đúng và có ghi lý do. |
| §3.5 Ký ức sống: ghi âm cao niên → transcribe → LLM tóm tắt, gắn thẻ → **kho ký ức tìm kiếm được** | ◐ | FR-8, UJ-1, M3 | Được nâng thành hành trình quan trọng nhất ✅. Nhưng **"kho ký ức tìm kiếm được"** như một sản phẩm đầu ra riêng (khác với "khẳng định phả hệ được bóc tách") không có FR: FR-8 chỉ nói bóc thành khẳng định + giữ băng gốc. Phần "tóm tắt, gắn thẻ nhân vật/sự kiện, tìm kiếm được" — **(b)** nên là một FR riêng hoặc một câu bổ sung ở FR-8. |
| §3.6 Phân quyền theo vai: Trưởng họ → Trưởng chi → Thành viên → Khách | ✅ | FR-36 (nguyên văn chuỗi vai) | |
| §3.6 Người còn sống: **ẩn năm sinh/thông tin nhạy cảm với người ngoài chi** | ⚠️ | FR-37, FR-38 | Cơ sở quy tắc đổi từ **"ngoài chi"** sang **"bán kính họ hàng 3 đời"**. Là cải tiến (không cần setting), nhưng là thay đổi ngữ nghĩa phân quyền chưa được ghi nhận ở đâu. Liên quan Q10 (phàm lệ quy định "người sống hiển thị đến đâu"). Nên ghi một dòng. |
| §3.6 Audit log mọi lần sửa phả | ✅ | FR-39, FR-5 | |
| §3.6 "có thể cân nhắc blockchain ở giai đoạn sau" | ✅ | `addendum.md` §F + NFR-10 (mã băm thay blockchain) | Xử lý xuất sắc: loại có lý do và có phương án thay tương đương |

### §4 — Benchmark

| Nội dung nguồn | Trạng thái | Ghi chú |
|---|---|---|
| TV Thượng Hải — KG + linked data trên **54.000 bộ phả**, crowdsourcing, tự phát hiện xung đột | ◐ | `addendum.md` §D — giữ đủ, **rơi cụm "nền tảng mở"**. (a) |
| Quán Thư Đường — **14 triệu trang**, trực quan hóa nhân vật, tu phả online | ✅ | Con số giữ nguyên |
| Zupu.cn — "Gia phả là lõi, đời sống dòng họ là lớp giữ chân" | ◐ | Câu trích ✅; ba ví dụ trong ngoặc (tế Tổ online, mạng xã hội tông thân, lịch) rơi — (a), phần "lớp giữ chân" đã được addendum §E gắn nhãn cho nhóm đời sống dòng họ |
| Bách Gia Hữu Phả — QR mỗi cuốn phả → Việt hóa: QR dán nhà thờ họ | ✅ | Kể cả bước Việt hóa |
| Vân Mã Tông Phả — dàn trang thức Tô/thức Âu, kiểm lỗi thông minh | ✅ | Tên thể thức giữ nguyên |
| Dương gia tướng (2025) — **20 quyển/3 tháng**, blockchain, phân cấp riêng tư | ✅ | |
| MyHeritage/FamilySearch — hint matching AI, mô hình phương Tây cá nhân | ✅ | |
| Số liệu **12% → 45%** người dùng trẻ | ✅ | Giữ ở cả `addendum.md` §D |

Mục benchmark bảo toàn gần như tuyệt đối, kể cả toàn bộ con số. Không có khoảng trống đáng kể.

### §5 — Kế hoạch triển khai

| Nội dung nguồn | Trạng thái | Hạ cánh ở | Ghi chú |
|---|---|---|---|
| Nguyên tắc: "dự án tộc phả thất bại hiếm khi vì kỹ thuật, mà vì thiếu người chống lưng và dữ liệu nguội sau 3 tháng" | ✅ | `addendum.md` §C (nguyên văn); `prd.md` §5.9 | |
| GĐ0: dự án phải là **của Hội đồng gia tộc**, không phải "web cá nhân" | ✅ | `addendum.md` §C GĐ0 | |
| GĐ0: trình bày với trưởng họ + trưởng chi (họp họ / bên lề giỗ Tổ), **xin chủ trương**, giao phụ trách kỹ thuật | ◐ | `prd.md` §12 ("đã biết, chưa hẳn đã có chủ trương") | Ý cốt lõi ✅ và còn được phân tích sắc hơn. Chi tiết dịp/kênh trình bày (họp họ hoặc bên lề giỗ Tổ) rơi — (a); `addendum.md` §C có bù bằng "đáng làm song song ở kỳ giỗ họ gần nhất" |
| GĐ0: Ban tu phả số **3–5 người**, gồm phụ trách kỹ thuật + **1 cụ am hiểu phả cũ nhất ("người quý nhất dự án")** + mỗi chi 1 đầu mối trẻ | ✅ | `addendum.md` §C GĐ0; `prd.md` Q9 | Cả con số lẫn cụm "người quý nhất dự án" đều giữ |
| GĐ0: chốt quy ước nhập phả = spec cho hệ phân quyền | ✅ | `addendum.md` §C GĐ0; FR-7, Q10 | Được nâng thành thuật ngữ "Phàm lệ" + FR riêng — tốt hơn nguồn |
| **GĐ1: "làm kín, 1–3 tháng" — "không mở nhập liệu đại trà từ đầu"** | ❌ | — | **(b) đáng ngờ, có nguy cơ mâu thuẫn.** `addendum.md` §C GĐ1 viết lại hoàn toàn (đúng, vì không có phả gốc) nhưng đánh rơi **ràng buộc vận hành**: giai đoạn đầu làm kín, không mở đại trà, khung thời gian 1–3 tháng. Ràng buộc này **va chạm trực tiếp với FR-3** ("bất kỳ ai đã xác thực đều ghi được vào Kho tồn nghi ngay, không chờ duyệt"). `prd.md` §10 có nhắc "chốt phàm lệ trước khi mở nhập liệu đại trà" — tức là ý vẫn sống, nhưng nằm trong ô đối sách rủi ro chứ không phải trong kế hoạch triển khai, và không ai nói FR-3 bật lúc nào. Cần một câu ở §C GĐ1: "Kho tồn nghi mở cho toàn họ **sau khi** chốt phàm lệ + có mồi dữ liệu". |
| GĐ1: mỗi trưởng chi bổ sung 2–3 đời gần nhất của chi mình | ✅ | `addendum.md` §C GĐ1 (nguyên văn) | |
| GĐ1: điều kiện ra mắt — "ai mở lên cũng tìm thấy chính mình"; "người ta chỉ quan tâm gia phả khi thấy tên mình trong đó" | ✅ | `addendum.md` §C GĐ1; `prd.md` §8.1; M1 (≥80%) | Được chuyển thành chỉ số đo được — tốt hơn nguồn |
| GĐ2: máy chiếu/TV tại nhà thờ họ, mở cây từ Thủy tổ zoom xuống **những đứa trẻ đang ngồi dưới sân** | ✅ | `addendum.md` §C GĐ2 | Hình ảnh cụ thể được giữ nguyên |
| GĐ2: demo Xưng hô — "mời hai người trẻ không biết gọi nhau là gì, máy trả lời trước cả họ" | ✅ | `addendum.md` §C GĐ2; `prd.md` UJ-4 | Nâng cấp từ gõ câu → quét QR chung, có ghi lý do |
| GĐ2: QR dán tại nhà thờ họ + in lên thiệp mời giỗ — "quét là vào web, không cài gì" | ✅ | `addendum.md` §C GĐ2 | Cụm "không cài gì" rơi (a) — nhưng nó chính là lý lẽ bênh vực quyết định web-only, đáng giữ |
| GĐ2: **bản in thử Quang Gia Tộc Sử đặt lên bàn thờ — "với các cụ, cuốn sách là bằng chứng dự án nghiêm túc"** | ✅ | `addendum.md` §C GĐ2 | Câu biểu tượng được giữ **nguyên văn** ✅. Chỉ mất tên riêng "Quang Gia Tộc Sử" (xem §2.1). |
| GĐ3: "Lịch giỗ thông minh = **nhịp tim**" | ✅ | `prd.md` §5.9 (được phản biện: "một nhịp tim là một điểm chết đơn" → 4 cơ chế) | Xử lý xuất sắc |
| GĐ3: Zalo OA của dòng họ = **kênh phân phối chính, thay app** | ✅ | `addendum.md` §C GĐ3 | |
| GĐ3: "các bà/các cô báo tin sinh nở, đầu mối chi xác nhận" | ✅ | `addendum.md` §C GĐ3 | |
| GĐ3: Thám tử + công đức chạy theo **chiến dịch quý** | ✅ | `addendum.md` §C GĐ3 | |
| GĐ3: **"công bố bảng vàng công đức theo chi trên nhóm Zalo — khai thác máu thi đua giữa các chi"** | ❌ | — | **(b)** — xem mục Điểm công đức §2.2 ở trên. Lập luận tâm lý dòng họ duy nhất trong §5 bị rơi. |
| GĐ3: mỗi giỗ Tổ công bố ấn bản Tộc Sử mới — "biến cập nhật dữ liệu thành truyền thống thường niên" | ✅ | `addendum.md` §C GĐ3; FR-30 | |
| Rủi ro 1: người giữ phả gốc ngại giao (sợ mất vai trò) → **Chủ biên danh dự, tên in trang đầu Tộc Sử** | ✅ | `prd.md` §10 (hạ mức xuống "Thấp hiện tại" vì chưa có phả gốc — hợp lý) | Đối sách giữ nguyên văn |
| Rủi ro 2: tranh cãi thứ bậc → hiển thị theo phả gốc + quyết định Ban tu phả; **"kỹ thuật không phân xử"** | ✅ | `prd.md` §10, FR-6, FR-7 | Cụm "kỹ thuật không phân xử" giữ nguyên văn ở FR-6 ✅ |
| Rủi ro 3: phụ trách kỹ thuật là single point of failure → đào tạo 1–2 người trẻ; Docker + pg_dump đẩy cloud; **chi phí hạ tầng lấy từ quỹ họ để củng cố tính "của chung"** | ✅ | `prd.md` §10, NFR-3, NFR-4 | Lập luận "quỹ họ = của chung" được giữ — đây là lập luận văn hóa quan trọng, tốt |

### §6 — Việc tiếp theo

| Nội dung nguồn | Trạng thái | Hạ cánh ở | Ghi chú |
|---|---|---|---|
| 1. **Chốt tên miền** | ❌ | — | **(c)** — xem §1 và phân tích riêng §2 dưới |
| 2. Thiết kế schema Postgres chi tiết (person/relationship, ltree mã chi, JSONB) | ◐ | `addendum.md` §A.3 | Việc ✅ giao cho `bmad-architecture`; **JSONB** rơi khỏi danh sách |
| 3. Thiết kế mô hình phân quyền theo chi/đời | ✅ | FR-36…38; `addendum.md` §A.3 (NFR-7 trong AGE) | |
| 4. **Prototype: cây gia tộc + Xưng hô LLM (2 tính năng demo được ngay tại giỗ họ)** | ⚠️ | `prd.md` §8.1 (cây ✅) / §8.2 (FR-19 **ngoài** MVP) | **(c) — mâu thuẫn, xem §3 dưới** |
| 5. Roadmap MVP 3 giai đoạn | ✅ | `prd.md` §8; `addendum.md` §C | |

---

## 2. Ba khoảng trống nghiêm trọng — phân tích riêng

### (c-1) Quyết định "chữ đệm **Quang** cố định mọi đời" đã bị xóa khỏi chuỗi tài liệu

Nguyên văn `project.md` §2.3 mục 4:

> **ĐÃ CHỐT:** dòng họ lấy "Nguyễn Quang" làm gốc — chữ đệm "Quang" cố định mọi đời. Tính năng chuyển thành: kiểm tra đúng nếp "Nguyễn Quang + tên" khi thêm node mới…

Đây là **quyết định duy nhất trong `project.md` được viết hoa "ĐÃ CHỐT"**, và nó không phải quyết định về tính năng — nó là một **sự thật về dòng họ** (không dùng hệ chữ bối 字辈 đổi theo đời như Trung Quốc; chữ đệm bất biến).

Hệ quả kỹ thuật thật, ở ngay trong MVP:

- **FR-11 (luồng tự khai 4 bước)** và **FR-12 (hồ sơ đa danh xưng)**: có một quy tắc validate tên đã được chốt mà không FR nào biết.
- **FR-1/FR-2**: "đời" không suy được từ chữ đệm — khác giả định mặc định của bất kỳ ai từng đọc tài liệu phả Trung Quốc. Người thiết kế schema (`bmad-architecture`) rất dễ thiết kế trường `chữ bối theo đời` vì §E vẫn ghi "Tự bối" trong backlog **mà không ghi rằng tự bối đã bị vô hiệu hóa bởi quyết định này**.
- `addendum.md` §E ghi "**Tự bối** (trợ lý đặt tên, kiểm phạm húy)" — giữ đúng phần đã bị bãi bỏ (tự bối) và bỏ mất phần đã chốt (chữ đệm cố định + kiểm nếp đặt tên). Đảo ngược đúng chỗ cần giữ.

**Đề nghị:** đưa vào `prd.md` §4 Thuật ngữ (một dòng "Chữ đệm — họ Nguyễn Quang dùng 'Quang' cố định mọi đời, không dùng chữ bối đổi theo đời") **và** một câu trong FR-12. Sửa dòng backlog §E thành "Trợ lý đặt tên: kiểm nếp *Nguyễn Quang + tên*, tra trùng tên các cụ tránh phạm húy" — bỏ chữ "Tự bối".

### (c-2) Tên miền: ba ứng viên và một quyết định treo đã bốc hơi

`project.md` §1 liệt kê `nguyenquangtoc.vn` (trực diện, dễ nhớ), `quangtocduong.vn` ("Quang Tộc Đường", trang trọng), `nguyenquang.family` (hiện đại), và §6 xếp "chốt tên miền" là **việc số 1** trong danh sách việc tiếp theo.

Không có bất kỳ dấu vết nào ở `prd.md` (kể cả §12 Câu hỏi mở, §13 Chỉ mục giả định) hay `addendum.md`. Đây là loại rơi kinh điển của cấu trúc FR: tên miền không phải yêu cầu chức năng, không phải kiến trúc, không phải kế hoạch triển khai — nên không có ô nào để rơi vào.

Đáng chú ý: `quangtocduong.vn` = "Quang Tộc Đường" cùng họ ngữ nghĩa với slogan 光前裕後 và tên sách "Quang Gia Tộc Sử". Ba tài sản đặt tên này là **một hệ thống**, và cả ba đều đã bị bào mòn ở tài liệu đích (slogan mất diễn nghĩa, tên sách mất tên, tên miền mất sạch).

**Đề nghị:** thêm `Q11 — Chốt tên miền (3 ứng viên: …)` vào `prd.md` §12, hoặc mục "§G — Quyết định đang treo" trong `addendum.md`.

### (c-3) Mâu thuẫn thứ tự: FR-19 vừa là "demo ra mắt" vừa nằm ngoài MVP

Ba tài liệu nói ba điều không khớp nhau:

| Nơi | Nói gì |
|---|---|
| `project.md` §6.4 | Prototype = **cây gia tộc + Xưng hô LLM** — "2 tính năng demo được ngay tại giỗ họ" |
| `addendum.md` §C GĐ2 (Ra mắt tại giỗ Tổ) | Điểm nhấn ra mắt là **demo xưng hô hai người quét chung một QR (FR-19)** |
| `prd.md` §8.1 / §8.2 | MVP **không có** FR-19; FR-19 nằm ở "ngay sau MVP". Tiêu chí ra mắt MVP là "ai cũng tìm thấy chính mình". |

Nếu "ra mắt" trong `addendum.md` §C GĐ2 chính là mốc ra mắt MVP thì MVP đang thiếu tính năng demo chủ lực của chính buổi ra mắt đó. Nếu đó là mốc khác (sau MVP), thì `prd.md` §8 và `addendum.md` §C đang dùng hai trục thời gian khác nhau mà không nói ra.

Không phải nội dung bị rơi, mà là **mất tính nhất quán khi tách tài liệu** — nhưng hậu quả tương đương: người đọc tiếp theo (`bmad-architecture`, `bmad-ux`, sprint planning) sẽ suy ra sai.

**Đề nghị:** một câu ở `prd.md` §8.2 — "FR-19 phải xong **trước giỗ Tổ gần nhất** vì là tính năng demo ra mắt (addendum §C GĐ2), dù không thuộc MVP theo tiêu chí dữ liệu."

---

## 3. Danh sách gọn theo phân loại

### (c) Rơi nghiêm trọng — mất thông tin quyết định

1. **"Chữ đệm Quang cố định mọi đời" (ĐÃ CHỐT)** — `project.md` §2.3 mục 4. Ảnh hưởng FR-11, FR-12, schema, và làm sai lệch mục backlog "Tự bối".
2. **Tên miền — ba ứng viên + việc "chốt tên miền" (việc số 1 §6)** — không còn dấu vết, không nằm trong câu hỏi mở.
3. **Tên riêng "Quang Gia Tộc Sử"** — rút gọn thành "Tộc Sử" ở mọi nơi; đứt mối nối với slogan 光前裕後 và với chính tên dòng họ.
4. **Mâu thuẫn FR-19: demo ra mắt vs ngoài MVP** (không phải rơi, nhưng mất thông tin quyết định về thứ tự).

### (b) Rơi đáng ngờ — nên đưa vào

5. **Bản đồ di cư** — tính năng "ĐÃ CHỐT" §2.2 duy nhất không có FR; toàn bộ mô tả và câu "họ ta đã đi xa đến đâu" mất; nhưng MapLibre+deck.gl vẫn nằm trong ngăn xếp §A.4 (không nhất quán).
6. **Nhãn "Thám tử phả hệ — ưu tiên cao, rất cần"** — bị đẩy ra ngoài MVP mà không ghi nhận đang hạ một ưu tiên do Lead đặt.
7. **GĐ1 "làm kín, 1–3 tháng, không mở nhập liệu đại trà"** — ràng buộc vận hành mất; va chạm tiềm tàng với FR-3 (ai cũng ghi được ngay).
8. **"Mỗi lần tu phả tốn vài chục triệu"** — con số tiền duy nhất trong tài liệu; là lập luận ROI để xin quỹ họ.
9. **"Bảng vàng công đức theo chi — máu thi đua giữa các chi"** — lập luận tâm lý dòng họ bị thay bằng cơ chế xấu hổ (FR-44) mà không lưu phương án đối chứng cho A/B ở Q6.
10. **Khác biệt cốt lõi cũ: "LLM hội thoại trên KG dòng họ — khoảng trống TQ chưa làm trọn"** — bị thay bằng định vị mới, không ghi nhận việc thay.
11. **"Giải nỗi đau chỉ 1-2 cụ già còn nhớ vị trí mộ"** (QR mộ phần) — lý do tồn tại của backlog #1, cùng họ với luận điểm "nguồn dữ liệu đang chết dần".
12. **Diễn nghĩa slogan "Rạng danh tổ tiên, mở đường hậu thế"**.
13. **JSONB cho thuộc tính linh hoạt (sắc phong…)** — quyết định schema, không có ở §A.1 lẫn §A.3.
14. **"Kho ký ức tìm kiếm được"** (§3.5 Ký ức sống) — đầu ra riêng của luồng ghi âm, không có FR; FR-8 chỉ dừng ở bóc khẳng định.
15. **"Mỗi lần nhận họ thành công = sự kiện lan truyền mạnh nhất"** — mệnh đề về cơ chế lan truyền mạnh hơn cơ chế PRD đang dựa vào (UJ-2).
16. **LLM đối chiếu timeline mỗi cụ với sự kiện lịch sử VN** (Trang vàng) — liên quan trực tiếp Q4 ("Một ngày trong đời cụ").
17. **Cơ chế đố vui: chơi tại giỗ qua QR + bảng điểm chiếu màn hình + nối vào công đức** — mẫu hình phân phối tái dùng được.
18. **Đổi cơ sở quy tắc riêng tư từ "ngoài chi" sang "bán kính 3 đời"** (FR-37) — cải tiến hợp lý nhưng chưa ghi nhận là thay đổi; liên quan Q10.

### (a) Rơi có chủ ý và hợp lý — không cần hành động

- Cytoscape.js, TailwindCSS, PostgreSQL 17 (chi tiết công nghệ để `bmad-architecture` chốt lại; riêng bản PG 17 nên thêm một chữ vì §A.3 đang nói về tương thích phiên bản)
- Danh sách chỉ số của "Dòng họ qua những con số", cơ chế chi tiết của các mục backlog #1/#3/#5/#7 (đúng bản chất backlog)
- "Nền tảng mở" của TV Thượng Hải; ba ví dụ trong ngoặc của Zupu
- Kênh email trong lịch giỗ (Zalo OA đã được giữ làm kênh chính)
- Chi tiết dịp trình bày GĐ0 ("họp họ hoặc bên lề giỗ Tổ") — addendum §C đã bù
- "Crowdsourcing có kiểm soát" — FR-3 diễn đạt mạnh hơn
- Cụm "quét là vào web, không cài gì" — nhẹ, nhưng là lý lẽ bênh vực web-only

---

## 4. Ghi nhận: chỗ tài liệu đích **vượt** nguồn

Để cân bằng, những nội dung sau **không có** trong `project.md` mà tài liệu đích thêm vào, và đáng giữ:

- Toàn bộ §3 Bài toán khởi động nguội (`project.md` giả định đã có phả gốc — sai; PRD sửa và ghi rõ ở §0)
- F1 Mô hình dữ liệu có nguồn gốc (FR-1…FR-7) — nền móng mà nguồn hoàn toàn không có
- FR-46 Cửa sổ 49 ngày — "thứ duy nhất không lấy lại được"
- NFR-1, NFR-2 (sao lưu phân tán 5 người/5 nơi), NFR-10 (mã băm thay blockchain)
- Bốn cơ chế nhịp sống thay cho một "nhịp tim" duy nhất (FR-41…FR-45)
- §9 Thước đo + §9.2 chỉ số ngược
- `addendum.md` §C "Chiến thuật $0" — năm chiến thuật không cần code
- Ánh xạ repo tham chiếu → FR cụ thể (`addendum.md` §B)

---

## 5. Việc đề nghị làm tiếp (theo thứ tự)

1. Khôi phục **quyết định chữ đệm "Quang"** vào `prd.md` §4 + FR-12; sửa dòng "Tự bối" ở `addendum.md` §E.
2. Thêm **Q11 tên miền** (3 ứng viên) vào `prd.md` §12.
3. Khôi phục tên **"Quang Gia Tộc Sử"** ở FR-30 và `addendum.md` §C GĐ2; khôi phục diễn nghĩa slogan ở `prd.md` §1.
4. Xử lý **mâu thuẫn FR-19** giữa `prd.md` §8.2 và `addendum.md` §C GĐ2.
5. Quyết: **bản đồ di cư** — viết FR ngoài MVP, hay bỏ MapLibre khỏi `addendum.md` §A.4.
6. Thêm một câu ở `addendum.md` §C GĐ1 về **thời điểm mở Kho tồn nghi cho toàn họ** (giải mâu thuẫn với "làm kín, không mở đại trà").
7. Nhặt lại các con số/lập luận nhóm (b): vài chục triệu tu phả, bảng vàng theo chi, 1-2 cụ còn nhớ mộ, JSONB sắc phong, kho ký ức tìm kiếm được.
