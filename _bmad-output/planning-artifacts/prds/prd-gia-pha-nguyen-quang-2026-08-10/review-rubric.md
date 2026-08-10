# PRD Quality Review — Nền tảng Gia phả dòng họ Nguyễn Quang

*Chấm theo `prd-validation-checklist.md`, bảy chiều. Bối cảnh đã tính vào khi chấm: dự án dòng họ, một người tự code, chưa có dữ liệu nào, không deadline cứng, web-only, PRD là đầu chuỗi (feed `bmad-architecture` và `bmad-ux`).*

---

## Overall verdict

Đây là một tài liệu tư duy tốt hơn hẳn mặt bằng: nó có một luận đề thật (§3 — khởi động nguội là bài toán số một), dám viết ra cái chưa biết thay vì làm mượt nó, NFR có ngưỡng số thay vì tính từ, và có bộ **chỉ số ngược** (§9.2) sắc đến mức hiếm thấy — C1 và C4 được thiết kế để bắt chính giả thuyết của PRD nói dối.

Nhưng nó **chưa sẵn sàng để bắt tay xây**. Phần MVP tự mâu thuẫn với chính luận đề của mình: §3 nói nguồn dữ liệu đang chết dần nên phải chảy vào càng sớm càng tốt, còn §8.1 lại xếp một MVP hình dạng *nền tảng* (mô hình xuất xứ + phân quyền + engine riêng tư theo bậc quan hệ) đứng chắn trước bản ghi đầu tiên. Cộng thêm: 8 trong 46 FR không nằm trong bất kỳ rổ phạm vi nào, một FR trong MVP bị chính §12 tuyên bố là đang bị chặn, hai FR trong MVP mâu thuẫn nhau về xác thực, và toàn bộ §9 không đo được bằng thứ gì PRD này scope. Chiều mạnh nhất là **trung thực về phạm vi**; chiều yếu nhất là **độ rõ của "xong"**.

---

## 1. Decision-readiness — **thin**

Về mặt *thái độ*, PRD này quyết đoán. §7 không né: app mobile bị loại và ghi rõ đã tái xác nhận ngày 10/08 *sau khi đã nêu rủi ro với nhóm cao niên* — đó là cách viết trade-off đúng chuẩn, nêu cả cái đánh đổi đi chứ không chỉ cái chọn lấy. Addendum §F còn liệt kê 7 phương án bị loại kèm lý do. Bảng Q1–Q10 có cột **"Chặn ai"** — tức là câu hỏi mở được gắn với hệ quả, không phải câu hỏi tu từ. Q7 bị gạch với ngày trả lời. Đây là dấu hiệu của người thật sự dùng tài liệu chứ không trưng bày nó.

Vấn đề nằm ở chỗ khác: **những quyết định bị hoãn lại chính là những quyết định gác cửa v1.** Q1 (quy mô dòng họ) chặn cả NFR-8 lẫn mẫu số của M1. Q8 (gia phong đứng trước hay sau dữ liệu phả hệ) có thể đảo ngược §8.3 — nghĩa là nội dung MVP chưa chốt. Q10 (phàm lệ) chặn FR-7, mà FR-7 lại đang nằm trong §8.1. PRD tự nói điều này ở cuối §12 — *"Hai việc còn lại không chặn viết code, nhưng chặn FR-7"* — rồi vẫn để FR-7 trong bảng MVP. Người đọc không thể vừa tin bảng §8.1 vừa tin đoạn §12.

Ngoài ra, PRD không hề mang tín hiệu về **công sức**. Với đội một người, thứ tự trong MVP quan trọng hơn nhiều so với đội có nhiều người, nhưng §8.1 là một bảng phẳng: 15 FR + 5 NFR, không có gợi ý cái nào làm trước, cái nào là 2 ngày và cái nào là 3 tuần. FR-37 (riêng tư tự tính theo bậc quan hệ) và FR-1/FR-3 (mô hình khẳng định-có-nguồn hai tầng) là hai hạng mục nặng nhất cả tài liệu, đứng ngang hàng trong bảng với FR-16.

### Findings

- **critical** MVP mâu thuẫn với luận đề khẩn cấp của chính PRD (§3 ✕ §8.1) — §3 nói rõ ba ràng buộc, trong đó "nguồn dữ liệu đang chết dần… mỗi đám tang trôi qua là một chương mất vĩnh viễn", và nêu ba chiến lược đối phó *"đều đã lên FR"*. Nhưng trong §8.1 chỉ có chiến lược thứ ba (trả công tức thì, FR-13). Chiến lược 1 (nhặt dữ liệu nơi nó nằm — FR-9, FR-10) và chiến lược 2 (kể chuyện — FR-8) đều ngoài MVP. Trong khi đó MVP lại gánh FR-1/2/3/5 + FR-36→39 + FR-7 — tức là hạ tầng xuất xứ, hệ vai trò, engine riêng tư theo bậc quan hệ, và trang phàm lệ, trước khi có bản ghi thứ nhất. Addendum §C Giai đoạn 1 vô tình xác nhận vấn đề: *"Đi ghi âm các cụ cao niên ngay từ bây giờ, bằng điện thoại, không chờ FR-8 chạy."* Đó là PRD tự thừa nhận sản phẩm **không nằm trên đường găng của rủi ro số một của chính nó**. *Fix:* tách một v0 thật sự nhỏ — FR-11 + FR-13 + FR-15/16 trên schema tối thiểu có cột nguồn (chưa cần hai tầng, chưa cần FR-4, chưa cần FR-37 đầy đủ) — và kéo FR-9 vào v0 ở dạng thô nhất (upload ảnh + gõ tay, chưa cần trích xuất tự động). Đẩy FR-36→39 và FR-7 sang v1.
- **high** FR-7 nằm trong MVP nhưng bị Q10 chặn (§8.1 ✕ §12) — §8.1 dòng "Phàm lệ | FR-7"; §12 nói phàm lệ chưa được họ thông qua và điều đó *chặn FR-7* vì "không có phàm lệ thì trang đó không có nội dung". Một FR trong MVP mà đầu vào nội dung chưa tồn tại thì không phải phạm vi, mà là ý định. *Fix:* hoặc chuyển FR-7 sang v1 và ghi rõ điều kiện mở khoá là Q10, hoặc thu hẹp FR-7 trong MVP xuống "khung trang phàm lệ trống + cơ chế trỏ về", tách phần tự kiểm tuân thủ ra sau.
- **high** FR-3 và FR-11/UJ-2 mâu thuẫn về xác thực, cả hai đều trong MVP (§5.1, §5.2, §2.3) — FR-3: *"Bất kỳ ai **đã xác thực** đều ghi được vào Kho tồn nghi ngay"*. FR-11: *"không đăng nhập phức tạp ở bước đầu"*. UJ-2 dứt khoát hơn: *"Mở link, **không phải đăng ký gì**"*. Đây không phải khác biệt sắc thái — nó quyết định toàn bộ mô hình danh tính, mà mô hình danh tính lại là đầu vào của FR-36 (vai trò), FR-37 (bán kính), FR-39 (nhật ký "ai sửa"). Downstream không thể tự đoán. *Fix:* chốt trong PRD: định danh nhẹ (magic link Zalo/số điện thoại) đủ để ghi danh tác giả nhưng không phải "đăng ký", hoặc chấp nhận ghi ẩn danh vào Kho tồn nghi và nêu rõ hệ quả với FR-39.
- **medium** Không có tín hiệu công sức / trình tự trong MVP (§8.1) — với đội một người và không deadline, thứ tự làm là quyết định sản phẩm quan trọng nhất còn lại, và PRD không đưa ra. *Fix:* thêm cột "thứ tự" hoặc chia §8.1 thành 2–3 lát cắt có thể ship độc lập, mỗi lát có tiêu chí riêng.
- **medium** Bảng câu hỏi mở không phân loại theo mức chặn (§12) — Q1/Q8/Q10 quyết định nội dung MVP; Q4/Q5/Q6 thì không. Trộn chung khiến người đọc không biết cái nào phải giải trước khi gõ dòng code đầu tiên. *Fix:* tách thành "Chặn v0", "Chặn v1", "Bàn sau".

---

## 2. Substance over theater — **strong**

Đây là chiều tốt nhất về mặt viết. Không có persona thừa: đúng bốn nhóm (§2.1), và mỗi nhóm **thật sự đẻ ra quyết định** — "Người giữ ký ức" đẻ ra UJ-1 và FR-8, "Người vận hành" đẻ ra FR-3/FR-4 (gỡ nút thắt cổ chai), "Người đóng góp thường" đẻ ra NFR-5 và FR-11, "Người tra cứu" đẻ ra FR-19. Cột "Cái họ sợ" không phải trang trí: nỗi sợ "công lao bị lấy mất" trực tiếp thành yêu cầu ghi tên người kể trong UJ-1 và FR-45.

Tầm nhìn (§1) không thể tráo sang PRD khác — nó gắn với một sự thật riêng của dòng họ này (*"Không phải mất — là chưa từng có ở dạng dùng được"*) và một câu duy nhất được đào tới đáy. Đặc biệt, §1 dám nói ra điều bất tiện: gia phong **cũng chưa thành văn**, sẽ được xây cùng lúc với phần mềm. Rất nhiều PRD sẽ giả vờ rằng thứ đó đã tồn tại và chỉ cần số hoá.

NFR phần lớn có ngưỡng, không phải tính từ: NFR-1 (≥90 ngày lịch sử, ≥2 vị trí địa lý, diễn tập khôi phục ≥1 lần/năm — kèm câu *"backup chưa từng restore là backup không tồn tại"*), NFR-5 (≤4 màn hình, ≤3 phút, điện thoại tầm trung, 4G ở quê), NFR-8 (5.000 node, <1 giây), NFR-3 ("một người khác tiếp quản trong 1 ngày"). Đây là NFR thật, không phải "hệ thống phải bảo mật và mở rộng được".

Vài chỗ vẫn là đồ gỗ, dù đóng đẹp.

### Findings

- **medium** NFR-10 (chứng thư băm mỗi ấn bản) giải một vấn đề chưa được chứng minh là có thật (§6) — lập luận là "đủ để chống nghi ngờ *phả bị sửa*, nhẹ hơn blockchain nhiều". Nhưng §10 không hề liệt kê rủi ro "bị nghi sửa phả", và FR-5 + FR-39 đã cho dấu vết tu chỉnh nội bộ. Ai trong dòng họ sẽ đi so mã băm? Đây là dấu vết còn lại của việc *đã loại blockchain* (addendum §F) chứ không phải một nhu cầu được nêu ra. *Fix:* hoặc thêm dòng rủi ro tương ứng vào §10 để NFR-10 có chỗ bám, hoặc hạ NFR-10 xuống backlog.
- **medium** NFR-2 (sao lưu phân tán tới 5 người ở 5 nơi) là quy trình xã hội đội lốt NFR (§6) — nó cần 5 người trong họ chịu nhận và giữ gói GEDCOM hằng quý, trong một dòng họ hiện có **0 người đóng góp** và **chưa có Ban tu phả** (Q9). Không nêu ai sở hữu, không nêu cách xác minh gói còn đọc được. Bài học "phả cháy trong chiến tranh" là đúng, nhưng nó không biến câu này thành yêu cầu kiểm chứng được. *Fix:* giữ tinh thần, viết lại thành FR có chủ thể ("hệ thống sinh gói và ghi nhận người giữ") + tách phần vận hành xã hội sang addendum §C.
- **low** Tuyên bố khoảng trống thị trường ở §1 làm ít việc hơn vẻ ngoài của nó — *"Zupu làm vế đầu; MyHeritage làm vế sau; chưa ai đứng vào giữa"* là câu định vị cho một sản phẩm có thị trường. Ở đây chỉ có một dòng họ và không có ý định thương mại trong phạm vi hiện tại (§11 mở sau). Nó có kéo được FR-16 ra (lấy từng người làm tâm trên dữ liệu của chung), nên không hoàn toàn rỗng — nhưng nó được viết to hơn công việc nó làm. *Fix:* rút gọn thành một câu về nguyên tắc thiết kế ("dữ liệu của chung, trải nghiệm lấy người dùng làm tâm"), chuyển phần so sánh nền tảng về addendum §D.

---

## 3. Strategic coherence — **thin**

PRD có luận đề, và luận đề đó tốt: **bài toán không phải số hoá một cuốn phả, mà là làm cho dữ liệu bắt đầu tồn tại.** §0 nói thẳng thay đổi lớn so với `project.md`, §3 dựng nó thành một mục riêng và giải thích tại sao mục đó không chuẩn PRD mà vẫn phải có. Thước đo cũng bám luận đề chứ không đo hoạt động bề mặt: M3 đo **giờ ghi âm** (tài nguyên đang mất dần), M4 đo **tỷ lệ khẳng định có nguồn** (chất lượng nền), M5 đo **phân bố theo chi** thay vì tổng lượt truy cập. Có chỉ số ngược, và chúng được thiết kế để bắt giả thuyết nói dối: C1 bắt FR-4, C4 bắt NFR-5, C2 bắt FR-3. Đây là phần đáng khen nhất của tài liệu.

Mạch đứt ở ba chỗ. **Thứ nhất**, hình dạng MVP không khớp loại phạm vi mà §8 tự tuyên bố. §8 viết nguyên tắc cắt là "thứ nhỏ nhất khiến dữ liệu bắt đầu chảy vào — không phải thứ ấn tượng nhất", tức là MVP kiểu *giải-bài-toán*. Nhưng thành phần thực tế lại là MVP kiểu *nền tảng*: mô hình xuất xứ hai tầng, hệ vai trò 4 cấp, riêng tư theo bán kính, phân vùng đa dòng họ. Nguyên tắc và bảng không cùng nói một thứ.

**Thứ hai**, lý do dự án tồn tại bị đẩy ra sau cùng mà không được phán quyết. §1 và §5.5 đều nói gia phong là cái làm nên khác biệt; §8.3 đẩy toàn bộ F5 ra ngoài MVP; §13 và Q8 để ngỏ có đảo hay không. Lập luận biện hộ trong §8.3 hợp lý (cần có người tham gia mới thu được gia phong), nhưng để nó ở dạng câu hỏi mở nghĩa là **PRD không chốt được cái nó đang cược vào**.

**Thứ ba**, hành trình được chính PRD gắn nhãn *"quan trọng nhất của sản phẩm"* — UJ-1 — phụ thuộc FR-8, ngoài MVP. Đối chiếu cả bốn: UJ-1 → FR-8 (§8.2), UJ-2 → FR-11/13 (MVP ✓), UJ-3 → FR-3 + FR-4 (FR-4 **không thuộc rổ nào**), UJ-4 → FR-19 (§8.2). Ba trên bốn hành trình không chạy được ở v1, và PRD không nói ra điều đó ở bất kỳ đâu.

### Findings

- **high** §10 có ba rủi ro mà đối sách nằm ngoài MVP (§10 ✕ §8) — "Không thu được dữ liệu ban đầu" (mức **Cao nhất**) trỏ về §3 tức FR-9/FR-10 (ngoài MVP) + FR-13 (trong MVP) + "Hiệp tự nhập 2–3 đời làm mồi" — tức đối sách thực tế ở ngày ra mắt là **lao động thủ công của một người**, và việc đó không xuất hiện như một hạng mục công việc ở đâu cả. "Web-only loại nhóm cao niên" trỏ về UJ-1 (cần FR-8, ngoài MVP) và FR-29 (ngoài MVP) — **cả hai đối sách đều không có mặt lúc ra mắt**. "Tranh chấp thứ bậc" trỏ về FR-6 (không thuộc rổ nào) + FR-7 (bị Q10 chặn). Một bảng rủi ro mà đối sách chưa tồn tại ở thời điểm rủi ro xảy ra sẽ tạo cảm giác an toàn giả. *Fix:* thêm cột "đối sách có hiệu lực từ phiên bản nào" vào §10; với rủi ro Cao nhất, ghi rõ đối sách ở v0 là gì (ví dụ: chỉ tiêu số bản ghi mồi Hiệp phải tự nhập trước khi mở).
- **high** Nguyên tắc cắt MVP và thành phần MVP không cùng loại (§8) — nguyên tắc là "làm dữ liệu chảy", thành phần là hạ tầng nền tảng. Cụ thể FR-36→39 (4 FR phân quyền, trong đó FR-37 là bài toán tính bậc quan hệ trên graph) không suy ra được từ tiêu chí ra mắt "ai mở lên cũng tìm thấy chính mình". *Fix:* trong v0, thay FR-36→39 bằng một quy tắc duy nhất, cứng và đơn giản (ví dụ: người sống chỉ hiện tên + đời + chi; mọi trường khác ẩn với tất cả), rồi mở dần khi có phàm lệ.
- **medium** Ba trên bốn UJ không chạy được ở MVP, trong đó có UJ được gắn nhãn quan trọng nhất (§2.3 ✕ §8) — PRD không nêu điều này. Nếu đó là lựa chọn có ý thức thì phải viết ra; nếu không thì phải sửa phạm vi. *Fix:* thêm cột phiên bản vào phần UJ, hoặc một câu trong §8 nói rõ UJ nào sống ở v1.
- **medium** Lý do dự án tồn tại (gia phong) bị hoãn bằng một câu hỏi mở thay vì một quyết định (§1 ✕ §8.3 ✕ Q8) — với PRD chỉ có một người vừa quyết vừa xây, để mở câu hỏi này không tiết kiệm được gì, chỉ trì hoãn. *Fix:* chốt Q8 ngay trong PRD, kèm một hành động rẻ giữ được tinh thần F5 ở v0 (ví dụ: mỗi lần ghi âm đều lưu thô, chưa cần FR-22→24).

---

## 4. Done-ness clarity — **thin**

Đây là chiều PRD yếu nhất, và cũng là chiều downstream tựa vào nặng nhất. Không có mục Acceptance ở bất kỳ đâu; phần lớn trong 46 FR là một đến ba câu mô tả **ý định**, không phải hệ quả kiểm chứng được.

Có những FR làm đúng: FR-4 (*"3 người thuộc ít nhất 2 chi khác nhau"*) là một điều kiện chạy được thẳng thành test. FR-26 cho luôn quy tắc số (*"năm sinh con ≤ năm sinh cha + 15"*) và chốt luôn cơ chế (rule engine, không LLM). FR-13 liệt kê đúng ba thứ phải hiện ra. NFR-5 và NFR-1 có ngưỡng đo được. Những FR này chứng minh tác giả *biết* viết ra "xong là như thế nào" — nên phần còn lại không phải do không biết, mà do chưa làm.

Phần còn lại thì hỏng theo đúng những cách rubric bảo phải bắt. Nguy hiểm nhất là hai FR riêng tư trong MVP: FR-37 nói *"trong 3 đời thấy đủ, ngoài ra **thấy ít**"* — "thấy ít" là bao nhiêu? FR-38 liệt kê ba trường bị ẩn (ngày sinh đầy đủ, địa chỉ, điện thoại) nhưng không nói đó có phải toàn bộ định nghĩa của "thấy ít" hay không, và *"Trẻ vị thành niên ẩn chặt hơn"* thì hoàn toàn không có nội dung. Đây là quy tắc về **người còn sống**, trong một sản phẩm mà cả dòng họ sẽ mở ra xem — mơ hồ ở đây không phải nợ kỹ thuật mà là nguy cơ thật.

### Findings

- **high** FR-37/FR-38 không có ma trận hiển thị, dù nằm trong MVP và điều chỉnh dữ liệu người sống (§5.8) — cần một bảng: trường dữ liệu ✕ bậc quan hệ ✕ vai trò → hiện/ẩn/mờ, cộng quy tắc riêng cho vị thành niên và cho người đã mất. Thiếu bảng này thì `bmad-architecture` phải tự bịa chính sách riêng tư. *Fix:* thêm bảng ma trận vào §5.8, kể cả bản thô; đây cũng là đầu ra tự nhiên của Q10 (phàm lệ).
- **high** FR-8 và FR-9 không có bất kỳ ngưỡng chất lượng nào (§5.2) — "bóc tách thành các khẳng định ứng viên" xong là xong ở mức nào? Không có tỷ lệ đúng tối thiểu, không có định nghĩa hành vi khi bóc sai, không có bound cho *"Hán-Nôm ở mức trợ giúp có kiểm chứng"*. Với tính năng LLM thì đây chính là toàn bộ rủi ro. *Fix:* nêu điều kiện chấp nhận theo hướng an toàn thay vì theo độ chính xác: mọi kết quả bóc tách bắt buộc vào Kho tồn nghi (addendum §A.5 đã nói, cần kéo vào FR), mỗi khẳng định phải trỏ về đúng timestamp/vùng ảnh, và người dùng phải bác bỏ được từng cái mà không mất phần còn lại.
- **medium** FR-12 *"Tìm kiếm phải hiểu tất cả"* không kiểm chứng được (§5.2) — "tất cả" gồm cả tên viết sai chính tả trên giấy tờ, tức là bài toán fuzzy match có ngưỡng. *Fix:* viết lại thành: tìm bằng bất kỳ danh xưng nào đã lưu đều trả ra đúng người; tìm không dấu tương đương có dấu; sai 1 ký tự vẫn ra trong 5 kết quả đầu.
- **medium** FR-14 nằm trong MVP nhưng không có kênh gửi (§5.2, §8.1) — *"cả họ nhận tin"*: qua đâu? Sản phẩm là web-only, FR-11 cố tình không thu thập đăng ký, và addendum §C mới nói Zalo OA là "kênh phân phối chính" ở Giai đoạn 3. Không có FR nào cho Zalo. *Fix:* hoặc hạ FR-14 ở v0 xuống "nhánh mới sáng lên trên cây khi mở web" (không cần push), hoặc bổ sung một FR cho kênh Zalo và chấp nhận nó là phụ thuộc của FR-14.
- **medium** FR-15 *"chạy mượt trên điện thoại"* (§5.3) — NFR-8 đỡ được một phần nhưng chỉ nói 5.000 node và <1 giây cho truy vấn đường quan hệ, không nói ngân sách tương tác (fps khi pan/zoom, thời gian first render, hành vi khi mạng 4G chập chờn ở quê — vốn đã được nêu trong NFR-5). *Fix:* thêm ngưỡng render lần đầu và ngưỡng phản hồi thao tác zoom.
- **medium** Tiêu chí ra mắt không tự kiểm chứng được (§8.1) — *"cây đủ dày để bất kỳ ai trong họ mở lên cũng tìm thấy chính mình"* cần biết danh sách "ai trong họ", tức là cần chính dữ liệu đang đi thu thập, và cần Q1 (quy mô) chưa trả lời. Vòng tròn. *Fix:* đổi sang tiêu chí đo được bằng thứ đang có: ví dụ "mỗi chi có ít nhất N đời gần nhất, và mỗi trưởng chi xác nhận không thiếu ai trong 2 đời của chi mình".
- **medium** Cả nhóm F5 không có định nghĩa xong (§5.5) — FR-23 *"tách riêng những câu mang tính răn dạy, giá trị, nếp nhà"* theo tiêu chí nào? FR-24 "hội đồng bỏ phiếu" nhưng không nêu ngưỡng thông qua (trong khi FR-4 thì có). *Fix:* nếu F5 vẫn ngoài MVP thì chấp nhận được, nhưng phải đánh dấu §5.5 là *phác thảo, chưa đủ để làm story*.
- **low** FR-2 và FR-3 chồng lấn về mã hoá thị giác (§5.1) — FR-2 dùng **màu** cho ba mức tin cậy, FR-3 dùng **mờ** cho tầng Kho tồn nghi. Hai trục độc lập cùng vẽ lên một node; PRD không nói chúng kết hợp ra sao. *Fix:* nêu rõ đây là hai trục, và giao cho `bmad-ux` một ràng buộc: cả hai phải đọc được đồng thời.

---

## 5. Scope honesty — **adequate**

Bộ máy trung thực ở đây gần như đầy đủ và được dùng thật, không phải trang trí. §7 có 8 mục loại thẳng, mỗi mục kèm lý do, và hai mục mới (nhận diện khuôn mặt tự động, tổng hợp giả giọng) được đánh dấu *(mới)* để người đọc `project.md` cũ biết cái gì đã đổi. Hai ý **chưa phán quyết** được đưa vào bảng riêng kèm cột "Vướng" thay vì bị âm thầm bỏ. 8 tag `[ASSUMPTION]` nằm đúng chỗ căng — không có cái nào đặt ở checkpoint an toàn: FR-4 (ngưỡng đồng thuận chưa ai duyệt), FR-44 (giả định văn hoá "xấu hổ mạnh hơn khen thưởng", kèm cả đề nghị thử A/B trên hai chi), §9 (thừa nhận toàn bộ thước đo là do tác giả tự đề xuất), §8.3 (thừa nhận đã đẩy lùi chính lý do khởi động dự án và nói thẳng *"đây là chỗ cần đảo"*). §13 lập chỉ mục đủ 8 giả định, roundtrip khớp hoàn toàn. Addendum §E giữ lại toàn bộ ý bị gạt ra thay vì vứt đi.

Cái làm chiều này tụt xuống *adequate* là **một khoảng trống lớn không được nói ra**.

### Findings

- **high** Không có chính sách cho người sống **không muốn** có mặt trong phả (§5.8, §7) — trong mô hình dữ liệu của chung (§1: "dữ liệu là của chung theo mô hình tông tộc"), người thứ ba khai thông tin về một người sống là hành vi mặc định của sản phẩm (FR-11: "thêm mình, chồng, hai đứa con"). PRD nói rất kỹ về *hiển thị tới đâu* (FR-37/38) nhưng không nói một chữ nào về: người sống có quyền từ chối vào phả không, có quyền yêu cầu xoá không, dâu/rể ly hôn xử lý ra sao, ai xử lý khiếu nại. Đây cũng là loại xung đột dễ xảy ra nhất trong đời thật, và PRD không hề nêu nó ở §10. Ngoài ra không có một dòng nào về cơ sở pháp lý (Nghị định 13/2023 về bảo vệ dữ liệu cá nhân), dù chỉ để tuyên bố là ngoài phạm vi. *Fix:* thêm một FR về quyền của người được ghi (từ chối / yêu cầu ẩn / yêu cầu xoá và hệ quả với dấu vết FR-39), thêm một dòng rủi ro vào §10, và nếu quyết định không xử lý pháp lý ở v1 thì viết nó thành một mục `[NON-GOAL]` rõ ràng.
- **medium** Không có ràng buộc chi phí ở bất kỳ đâu (§6, §10) — §10 nói "chi phí hạ tầng lấy từ quỹ họ để dự án là 'của chung'" nhưng không có con số. Trong khi đó NFR-1 đòi bản sao ở ≥2 vị trí địa lý, sản phẩm lưu **băng ghi âm và ảnh gốc** (media nặng, không xoá được theo NFR-1), và FR-8/FR-9/FR-30 đều gọi LLM API. Với một người tự trả tiền, trần chi phí hằng tháng là một ràng buộc thiết kế thật, ngang NFR-5. *Fix:* thêm NFR về trần chi phí vận hành/tháng và hệ quả (ví dụ: giới hạn tổng dung lượng media ở v0, hoặc quota phút ghi âm).
- **low** Không có `[NOTE FOR PM]` nào trong tài liệu — bảng Q1–Q10 cộng các `[ASSUMPTION]` đã làm gần hết việc đó nên không phải lỗ hổng thật, nhưng những chỗ căng *không phải giả định cũng không phải câu hỏi* (ví dụ mâu thuẫn FR-3 ✕ FR-11) hiện không có ký hiệu nào để bắt mắt người đọc. *Fix:* đánh dấu các mâu thuẫn nội bộ bằng một ký hiệu thống nhất.

---

## 6. Downstream usability — **thin**

Chiều này có trọng số cao ở đây vì addendum tự khai người đọc chính là `bmad-architecture` và `bmad-ux`, và §5 rõ ràng được viết để sinh story.

Phần vệ sinh cơ bản thì tốt. Thuật ngữ (§4) có 14 mục, phủ đúng những danh từ chuyên ngành mà người ngoài dòng họ không đoán được (phàm lệ, tồn nghi, húy, ngoại phả) và định nghĩa *"Khẳng định (assertion)"* như đơn vị dữ liệu nhỏ nhất — đúng thứ FR-1 cần. ID liên tục và không trùng: FR-1→46, NFR-1→10, UJ-1→4, M1→5, C1→5, Q1→10. Chỉ mục giả định roundtrip sạch. Addendum §A.3 còn liệt kê sẵn bốn câu hỏi schema cụ thể cho architect, trong đó câu về "mô hình FR-1 trong AGE" được gọi đúng tên là *"quyết định schema quan trọng nhất của dự án"*.

Cái làm chiều này gãy là **bản đồ phạm vi không phủ hết FR**, và §8.3 không dùng được làm ranh giới.

### Findings

- **high** 8 trong 46 FR không nằm trong bất kỳ rổ phạm vi nào (§8.1/8.2/8.3) — đối chiếu đầy đủ, những FR sau không xuất hiện ở cả ba mục: **FR-4** (đồng thuận nhẹ), **FR-6** (hồ sơ tranh chấp), **FR-10** (gắn tên trên ảnh tập thể), **FR-17** (cây bằng khuôn mặt), **FR-18** (chế độ xem theo phàm lệ), **FR-20**, **FR-21** (hai đường xưng hô còn lại), **FR-40** (tự xuất dữ liệu cá nhân). Hai cái đầu đặc biệt nghiêm trọng: FR-4 là cơ chế gỡ nút thắt cổ chai mà C1 được dựng riêng để giám sát, còn FR-6 là đối sách cho một rủi ro trong §10 — cả hai đều không có nhà. FR-40 thì là tiền đề của NFR-2. Sprint planning sẽ hoặc bỏ sót chúng, hoặc tự quyết thay. *Fix:* rà lại §8 sao cho hợp của ba rổ = đúng FR-1→46, không thừa không thiếu; đơn giản nhất là thêm một bảng đối chiếu FR → phiên bản.
- **medium** §8.3 trộn FR có mã với tên ý tưởng ở backlog (§8.3) — dòng này liệt kê "Tộc Sử (F7), thám tử phả hệ (F6), gia phong (F5), toàn bộ nhóm nhịp sống trừ FR-41, xuất bản in, **bản đồ di cư, QR mộ phần, nhận họ, đố vui, dashboard thống kê**". Năm mục cuối không phải FR — chúng là mục backlog ở addendum §E. Một danh sách loại trừ trộn hai loại đối tượng thì không dùng được làm ranh giới phạm vi. Ngoài ra "toàn bộ nhóm nhịp sống trừ FR-41" mâu thuẫn nhẹ với §8.2 vừa nâng FR-46 lên "ngay sau MVP". *Fix:* §8.3 chỉ liệt kê mã FR; nhắc backlog bằng một câu trỏ về addendum §E.
- **medium** Từ "tồn nghi" mang hai nghĩa và bị dùng lẫn (§4, FR-2, FR-3, C2) — §4 định nghĩa **Tồn nghi** là *trạng thái thông tin* và **Kho tồn nghi** là *tầng dữ liệu*; FR-2 dùng `tồn nghi` làm một trong ba mức tin cậy; FR-3 dùng Kho tồn nghi làm tầng chờ duyệt. Một khẳng định có thể ở mức `chắc chắn` nhưng vẫn nằm trong Kho tồn nghi vì chưa ai duyệt — hai trục hoàn toàn độc lập. C2 (*"bản ghi mắc kẹt ở 'tồn nghi' quá 6 tháng"*) không nói đang đo trục nào. *Fix:* đổi tên một trong hai (ví dụ tầng gọi là "Kho chờ duyệt"), và nêu rõ trong §4 rằng độ tin cậy và trạng thái duyệt là hai trục vuông góc.
- **low** UJ-4 không có nhân vật được đặt tên (§2.3) — ba UJ kia có Bà Nhàn/Quân, chị Thu, ông Bình mang theo bối cảnh; UJ-4 chỉ có "hai đứa cháu". *Fix:* đặt tên và tuổi, như ba UJ còn lại.
- **low** Addendum §A.2 và §A.4 lệch nhau về framework — §A.2 nói "có thể vẫn là Next.js, **chưa chốt** tách hay gộp", §A.4 lại liệt kê **NextAuth** trong bảng thư viện dự kiến. NextAuth ràng buộc lựa chọn ở §A.2. *Fix:* đánh dấu dòng Auth là "phụ thuộc quyết định ở §A.2".
- **low** "Ngoại phả" và "Phạm húy" có trong thuật ngữ nhưng không FR nào dùng (§4) — chỉ xuất hiện lại ở addendum §E (mục Ngoại phả, Tự bối) tức backlog. Thuật ngữ không có nơi tiêu thụ. *Fix:* giữ lại nếu định nghĩa hữu ích cho người đọc ngoài, nhưng ghi chú "(backlog)".

---

## 7. Shape fit — **adequate**

Hình dạng về cơ bản đúng. Đây không phải công cụ nội bộ một vai trò, mà là sản phẩm nhiều bên với vai trò xung khắc thật (người kể / người duyệt / người khai / người tra cứu), nên **UJ là bộ phận chịu lực chứ không phải thủ tục** — và bốn UJ trong §2.3 đúng là chịu lực: UJ-1 một mình biện minh cho cả FR-8 lẫn quyết định web-only, UJ-4 trực tiếp lật quyết định thiết kế của `project.md` (*"mạnh hơn hẳn cách gõ câu mô tả quan hệ"*). Ràng buộc web-only ✕ người dùng cao niên được xử lý trung thực chứ không giấu: nêu rủi ro, nêu bù, nêu cả việc đã tái xác nhận sau khi nghe rủi ro.

Chỗ lệch hình là **PRD được đóng ở kích cỡ của một đội có ngân sách, còn dự án thì có một người và không có dữ liệu**. Cụ thể nhất là §9: bộ M1–M5 và C1–C5 có ngưỡng số đẹp, nhưng **không FR hay NFR nào nói hệ thống đo những thứ đó**, và §8.3 lại đẩy "dashboard thống kê" ra ngoài MVP. Nghĩa là tại v1, không chỉ số nào trong §9 đọc được. Với chiều "chỉ số ngược" — vốn là phần xuất sắc của tài liệu — điều này đặc biệt phí: C4 (tỷ lệ bỏ giữa chừng luồng tự khai) là thứ duy nhất cho biết NFR-5 có đúng không, và nó cần đo từ ngày đầu.

### Findings

- **high** Toàn bộ §9 không đo được ở v1 (§9 ✕ §5 ✕ §8.3) — không có FR/NFR nào về đo lường, "dashboard thống kê" bị đẩy ra ngoài MVP, và M1 còn cần mẫu số là quy mô dòng họ (Q1, chưa trả lời). Một bộ thước đo không có cơ chế đọc thì là tuyên ngôn, không phải thước đo. *Fix:* thêm một NFR đo lường tối thiểu vào MVP (ghi sự kiện cho C4 và M2/M4 — không cần giao diện, một query cũng đủ), và định nghĩa mẫu số của M1 bằng thứ đếm được (danh sách do trưởng chi cung cấp).
- **medium** Rủi ro kỹ thuật nghiêm trọng nhất chỉ nằm ở addendum, không có trong §10 — addendum §A.3 cảnh báo ảnh ParadeDB không chắc có Apache AGE và gọi đây là việc phải làm *"trước khi viết dòng code đầu tiên"*. §10 không có dòng nào cho nó, dù §10 có chỗ cho những rủi ro nhẹ hơn nhiều ("người giữ phả gốc ngại giao — thấp hiện tại"). *Fix:* thêm dòng rủi ro "ngăn xếp dữ liệu không tương thích" vào §10 với đối sách là spike xác minh trước.
- **medium** C5 và NFR-6 giám sát một năng lực không có ở v1 (§9.2, §6) — C5 đo số lần AI bị bắt lỗi sai sự thật, NFR-6 ràng buộc FR-30/31 — cả hai FR đều ngoài MVP, và FR-8/FR-9 (hai nơi LLM thật sự chạm vào dữ liệu sớm nhất) cũng ngoài MVP. Không sai, nhưng làm §9 trông đầy hơn thực chất. *Fix:* đánh dấu chỉ số nào bắt đầu có hiệu lực từ phiên bản nào.
- **low** Mật độ hình thức cao so với hình dạng dự án — 46 FR + 10 NFR + 5 M + 5 C + 10 Q cho một người viết code không deadline. Không phải lỗi (rubric: hobby thì nhẹ về nghi thức, nhưng vẫn giữ chuẩn nội dung, và nội dung ở đây đạt), nhưng nó làm khó chính người dùng tài liệu: mọi thứ trông ngang trọng lượng nhau. *Fix:* thêm một trang đầu kiểu "5 thứ phải làm tiếp theo" — với PRD chỉ có một người đọc thật sự, đó là phần dùng nhiều nhất.

---

## Mechanical notes

- **Chỉ mục giả định roundtrip sạch.** 8 tag `[ASSUMPTION]` inline (§2.1, FR-4, FR-25, FR-44, NFR-8, §8.3, §9, §11) khớp đúng 8 dòng ở §13. Không thừa, không thiếu.
- **ID liên tục và duy nhất.** FR-1→46 không đứt quãng qua 9 nhóm F1–F9; NFR-1→10; UJ-1→4; M1→5; C1→5; Q1→10 (Q7 gạch có ghi ngày trả lời — cách xử lý đúng).
- **Bản đồ phạm vi không phủ hết ID.** Hợp của §8.1 + §8.2 + §8.3 thiếu FR-4, FR-6, FR-10, FR-17, FR-18, FR-20, FR-21, FR-40 (chi tiết ở chiều 6).
- **Nhãn hàng trong bảng §8.1 sai.** Dòng "Không mất dữ liệu | NFR-1, NFR-3, NFR-5, NFR-7, NFR-9" gộp cả NFR-5 (đơn giản) và NFR-9 (tiếng Việt) vốn không liên quan mất dữ liệu; NFR-7 (đa dòng họ) cũng vậy.
- **Trôi thuật ngữ:** "tồn nghi" (mức tin cậy) ✕ "Kho tồn nghi" (tầng dữ liệu) dùng lẫn ở FR-2/FR-3/C2. "Chi" và "nhánh" được định nghĩa chung một dòng nhưng chỉ "chi" được dùng thực tế — chấp nhận được.
- **Thuật ngữ không có nơi tiêu thụ:** "Ngoại phả", "Phạm húy" định nghĩa ở §4 nhưng không FR nào dùng.
- **Tham chiếu chéo phần lớn resolve được.** Kiểm ngẫu nhiên: §3 → FR-8/9/10/13/14 ✓, §7 → FR-10, FR-25 ✓, §10 → NFR-3/4, FR-6/7/13/29/31 ✓, §11 → NFR-7 ✓, addendum §A.5 → FR-8/9/19/20/21/26/27/30/31 ✓. Không tìm thấy tham chiếu tới ID không tồn tại.
- **UJ-4 thiếu nhân vật được đặt tên** (ba UJ còn lại đều có).
- **Addendum §A.2 ✕ §A.4:** chưa chốt Next.js nhưng đã liệt kê NextAuth.
- **`bmad-architecture` được giao việc rõ ràng** ở addendum §A.3 với bốn câu hỏi schema cụ thể — đây là cách bàn giao xuôi chuỗi tốt, đáng giữ.
