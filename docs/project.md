# DỰ ÁN GIA PHẢ DÒNG HỌ NGUYỄN QUANG
**Nền tảng web quản lý & khai thác tri thức dòng họ bằng AI/LLM**

> Slogan: **「光前裕後」— Quang Tiền Dụ Hậu** — *Rạng danh tổ tiên, mở đường hậu thế*

- Chủ trì: Nguyễn Hiệp
- Cập nhật: 08/2026 — bản chốt phạm vi sau vòng brainstorm & benchmark

---

## 1. Định vị & nguyên tắc

| Quyết định | Nội dung |
|---|---|
| Nền tảng | **Web-only** — không phát triển app mobile. Responsive tốt trên điện thoại. |
| Mô hình vận hành | Tông tộc cùng vận hành một cuốn phả chung (mô hình Á Đông): trưởng họ/trưởng chi duyệt, con cháu đề xuất — khác mô hình cá nhân tra cứu kiểu phương Tây. |
| Khác biệt cốt lõi | **LLM hội thoại trên knowledge graph dòng họ** — khoảng trống mà các nền tảng Trung Quốc (Zupu, Quán Thư Đường, TV Thượng Hải...) chưa làm trọn. |
| Đặc thù Việt | Xưng hô tiếng Việt, âm lịch giỗ chạp, văn khấn, tư liệu Hán-Nôm (sắc phong, văn bia). |

### Tên miền (chưa chốt)
- `nguyenquangtoc.vn` — trực diện, dễ nhớ
- `quangtocduong.vn` — "Quang Tộc Đường", trang trọng
- `nguyenquang.family` — hiện đại

---

## 2. Danh mục tính năng ĐÃ CHỐT

### 2.1. Lõi dữ liệu & AI

**🕸️ Cây gia tộc (visualization)**
Cây phả hệ tương tác: zoom theo chi, collapse theo đời; mỗi thành viên thấy "đường về Tổ" — đường nối từ mình lên cụ Thủy tổ được tô sáng. Công nghệ: D3.js / family-chart / Cytoscape.js.

**🧭 Xưng hô LLM (thay thế chatbot hội thoại)**
Hành vi: người dùng **gõ một câu mô tả quan hệ** — ví dụ: *"anh ấy là con của chú Ba, chú Ba là em của bố tôi"* — LLM phân tích câu → tự động xác định node tương ứng trên graph → trả về:
1. Node được nhận diện (tên, đời, chi) để người dùng xác nhận
2. Xưng hô tiếng Việt chuẩn hai chiều (mình gọi họ là gì, họ gọi mình là gì)
3. Sơ đồ đường quan hệ tô sáng trên cây

Pipeline: câu tự nhiên → LLM trích xuất chuỗi quan hệ → sinh truy vấn Cypher → tìm node/đường đi trên Neo4j → LLM dịch đường quan hệ ra xưng hô Việt.

**🔍 Thám tử phả hệ** *(ưu tiên cao — "rất cần")*
AI quét graph định kỳ, phát hiện:
- Mâu thuẫn logic: năm sinh con ≤ năm sinh cha + 15, ngày mất trước ngày sinh, vòng lặp quan hệ...
- Lỗ hổng dữ liệu: chi thiếu thông tin nhiều đời, node mồ côi, thiếu phối ngẫu
- Sinh "nhiệm vụ xác minh" giao cho trưởng chi → dữ liệu tự làm sạch qua crowdsourcing có kiểm soát

**📖 Quang Gia Tộc Sử**
LLM tổng hợp toàn bộ graph + kho tư liệu → tự động biên soạn cuốn "Quang Gia Tộc Sử" dạng tự sự chương hồi; mỗi năm cập nhật bản mới; xuất PDF/bản in tặng ngày giỗ Tổ.

### 2.2. Cộng đồng & vận hành

**👋 Node mới — Welcome**
Thêm thành viên mới (sinh con, dâu/rể nhập tộc) → tạo node → thông báo chào mừng toàn họ, nhánh mới sáng lên trên cây realtime. Biến nhập liệu thành sự kiện vui.

**🗺️ Bản đồ di cư**
Timeline kéo từ đời 1 → nay; chấm sáng lan từ quê Tổ ra các tỉnh, ra nước ngoài. Kể chuyện "họ ta đã đi xa đến đâu".

**🏆 Điểm công đức đóng góp dữ liệu**
Điểm "công đức số" khi đóng góp ảnh, tư liệu, xác minh thông tin, hoàn thành nhiệm vụ của Thám tử phả hệ → bảng vàng theo chi (tâm lý thi đua giữa các chi).

**📅 Lịch giỗ thông minh**
Tự tính ngày giỗ âm lịch hàng năm; nhắc trước 1 tuần (email/Zalo OA) kèm tiểu sử cụ và văn khấn gợi ý.

### 2.3. Backlog — Điểm WOW vòng 2 (từ bài học Trung Quốc, chưa xếp sprint)

> Trạng thái: đưa toàn bộ vào backlog; lựa chọn ở sprint planning sau. Xếp hạng ưu tiên sơ bộ của Lead: 1→7.

**1. 🪦 QR mộ phần & bản đồ tảo mộ** *(nguồn: chiến lược QR của Bách Gia Hữu Phả)*
QR gắn tại bia mộ mỗi cụ → trang tiểu sử, đời/chi, con cháu. Bản đồ mộ phần toàn dòng họ (pin GPS trên MapLibre — tái dùng stack bản đồ di cư): Thanh minh con cháu tự tìm được mộ tổ, biết thứ tự thắp hương. Giải nỗi đau chỉ 1-2 cụ già còn nhớ vị trí mộ.

**2. 📜 Nhà in phả tự động — thức phả Việt** *(nguồn: Vân Mã Tông Phả — dàn trang thức Tô/thức Âu một chạm)*
Nút "Xuất phả in": chọn thể thức (phả đồ dạng cây / phả ký từng người theo đời, theo lối phả Việt) → PDF chuẩn in, tự đánh số đời, mục lục theo chi. Tái bản phả giấy hàng năm chi phí ~0 thay vì mỗi lần tu phả tốn vài chục triệu. Với các cụ, đây là "sản phẩm chính".

**3. 🧬 Nhận họ — matching người thất lạc** *(nguồn: "nhập tên tìm tổ" Quán Thư Đường + nhận họ xuyên đại dương của dự án Dương gia tướng)*
Form cho người nghi cùng họ (chi thất lạc, Việt kiều): tên ông/cụ, quê gốc, năm ước chừng → fuzzy-match trên graph → sinh "đề xuất nhận họ" cho Ban tu phả thẩm định. Mỗi lần nhận họ thành công = sự kiện lan truyền mạnh nhất.

**4. 📛 Tự bối — trợ lý đặt tên theo đời** *(nguồn: văn hóa 字辈 chữ lót theo đời của TQ)*
ĐÃ CHỐT: dòng họ lấy "Nguyễn Quang" làm gốc — chữ đệm "Quang" cố định mọi đời. Tính năng chuyển thành: kiểm tra đúng nếp "Nguyễn Quang + tên" khi thêm node mới + LLM gợi ý tên hợp, tra trùng tên các cụ để tránh phạm húy.

**5. 📊 Dòng họ qua những con số** *(nguồn: Quán Thư Đường — trực quan hóa nhân vật hàng loạt)*
Dashboard tự sinh: dân số theo đời, tuổi thọ trung bình từng thời kỳ, tháp tuổi, phân bố nghề/học vị, tỷ lệ xa quê. Thành "báo cáo thường niên" mở màn họp họ.

**6. 🏛️ Trang vàng gia tộc — tri thức liên kết** *(nguồn: TV Thượng Hải — linked data nối phả với danh nhân, địa danh)*
Gắn thẻ cụ có thành tựu (khoa bảng, liệt sĩ, nghệ nhân...) → tự tập hợp "Trang vàng"; LLM đối chiếu timeline mỗi cụ với sự kiện lịch sử VN. Làm sau khi dữ liệu dày.

**7. 🎯 Đố vui gia tộc** *(nguồn: game chữ lót/gia quy giúp nền tảng TQ tăng người dùng trẻ 12%→45%)*
Quiz LLM tự sinh từ graph ("Cụ Thủy tổ húy là gì?"...), chơi tại giỗ họ qua QR, bảng điểm chiếu màn hình, điểm cộng vào hệ công đức. Chi phí xây ~0.

### 2.4. Đã LOẠI khỏi phạm vi
- ❌ App mobile (chỉ web)
- ❌ Chatbot hội thoại tự do ("Tộc phả AI") — thay bằng Xưng hô LLM có phạm vi hẹp
- ❌ "Trò chuyện với Tổ tiên" (persona AI người đã khuất)
- ❌ Phục chế ảnh gia tiên bằng AI
- ❌ Chân dung đời nối đời (morph khuôn mặt)
- ❌ Hộp thời gian

---

## 3. Kiến trúc kỹ thuật (CHỐT 08/2026)

### 3.0. Nguyên tắc kiến trúc đã chốt
- **Full TypeScript, một codebase** — AI gọi qua Claude API (không chạy model local) nên không cần backend Python. Một ngôn ngữ end-to-end, shared types từ DB → API → UI, một lệnh deploy.
- **Postgres-only, bỏ Neo4j** — graph dòng họ chỉ vài nghìn node; recursive CTE + graph in-memory đủ nhanh, bớt một database phải vận hành/backup, có transaction chung.
- **Tối giản vận hành: VPS chạy đúng 2 container** — Next.js + ParadeDB.

### 3.1. Stack tổng thể

```
┌─ Ứng dụng (1 codebase) ────────────────────────────┐
│ Next.js 15 (full-stack) + TypeScript               │
│ ├─ UI: React + TailwindCSS                         │
│ ├─ Cây gia tộc: family-chart (donatso, D3, MIT)    │
│ ├─ Fan chart / in ấn: topola (PeWu)                │
│ ├─ Bản đồ di cư: MapLibre GL + deck.gl             │
│ ├─ Backend: API Routes / Server Actions            │
│ ├─ ORM: Drizzle                                    │
│ ├─ Graph in-memory: graphology                     │
│ │   → tính đường quan hệ, bậc họ hàng (Xưng hô LLM)│
│ │   → quét mâu thuẫn (Thám tử phả hệ)              │
│ ├─ LLM: Anthropic TS SDK + Zod structured output   │
│ ├─ Âm lịch: amlich.js (Hồ Ngọc Đức, bản gốc JS)    │
│ ├─ GEDCOM 7: read-gedcom / gedcom7                 │
│ └─ Auth: NextAuth (phân quyền theo chi/vai)        │
├─ Database (1 container: paradedb/paradedb) ────────┤
│ PostgreSQL 17                                      │
│ ├─ Bảng quan hệ + Recursive CTE → graph phả hệ     │
│ ├─ pgvector    → embedding tư liệu (RAG Tộc Sử)    │
│ ├─ pg_search   → full-text BM25 (hồi ký, văn bia)  │
│ │   + ICU tokenizer & unaccent cho tiếng Việt      │
│ ├─ JSONB       → thuộc tính linh hoạt (sắc phong…) │
│ └─ ltree       → mã chi/nhánh "1.3.2" filter nhanh │
├─ Lưu trữ media ────────────────────────────────────┤
│ MinIO/S3 hoặc object storage của VPS provider      │
└─ Hạ tầng: Docker Compose, 1 VPS; backup = pg_dump ─┘
```

### 3.2. Thiết kế AI trên stack này
- **Xưng hô LLM**: LLM chỉ parse câu tự nhiên → chuỗi quan hệ có cấu trúc (Zod schema); việc resolve node và tính đường quan hệ do `graphology` chạy trong app — không Text2Cypher, không cho LLM sinh query → an toàn, rẻ, chống prompt injection.
- **Thám tử phả hệ**: rule engine trước (SQL/graph check định kỳ: tuổi cha-con, ngày mất < ngày sinh, vòng lặp, node mồ côi) — chính xác 100%, miễn phí; LLM chỉ viết lời giải thích và sinh nhiệm vụ xác minh.
- **Quang Gia Tộc Sử**: RAG trên pgvector + pg_search (hybrid retrieval) → Claude tổng hợp thành chương hồi.
- Python chỉ xuất hiện nếu sau này cần model local (OCR Hán-Nôm chuyên dụng) — tách worker riêng, không đụng backend chính.

### 3.3. Repo tham chiếu (học, không fork)
| Repo | Học gì |
|---|---|
| webtrees (PHP) | Mô hình riêng tư per-person (living/dead, vai trò) trưởng thành nhất OSS |
| Gramps Web (Python+React) | Data model Person–Family–Event–Place–Source–Citation |
| GeneWeb (OCaml) | Thuật toán tính bậc quan hệ / consanguinity |
| donatso/family-chart | Dùng trực tiếp cho cây gia tộc |
| PeWu/topola | Fan chart, render GEDCOM, xuất in |
| dtree | Vẽ cây đa-cha-mẹ (con nuôi/thừa tự) |

### 3.4. Chuẩn & xuất bản
- Import/export **GEDCOM 7** — tương thích hệ sinh thái gia phả quốc tế.
- Xuất ngược ra **sách giấy đúng thể thức phả truyền thống** (học Vân Mã Tông Phả, TQ) — với thế hệ lớn tuổi, cuốn phả in mới là "thật".

### 3.5. Pipeline tri thức (số hóa)
- **Số hóa**: scan phả giấy/Hán-Nôm → LLM vision OCR → trích xuất thực thể (tên, năm sinh-mất, đời, chi, phối ngẫu) → đổ vào graph → người duyệt chỉ xác nhận.
- **Ký ức sống**: ghi âm phỏng vấn cao niên → transcribe → LLM tóm tắt, gắn thẻ nhân vật/sự kiện → kho ký ức tìm kiếm được.

### 3.6. Phân quyền & riêng tư (bài học từ TQ — làm ngay từ đầu)
- Phân quyền theo vai: Trưởng họ → Trưởng chi → Thành viên → Khách.
- Người còn sống: ẩn năm sinh/thông tin nhạy cảm với người ngoài chi.
- Audit log mọi lần sửa phả (có thể cân nhắc blockchain ở giai đoạn sau).

---

## 4. Benchmark tham chiếu (ưu tiên châu Á)

| Hệ thống | Bài học rút ra |
|---|---|
| TV Thượng Hải — 家谱知识服务平台 | Knowledge graph + linked data trên 54.000 bộ phả; nền tảng mở, crowdsourcing, tự phát hiện xung đột dữ liệu |
| Quán Thư Đường (guanshutang.com) | AI số hóa quy mô lớn (14 triệu trang), phân tích + trực quan hóa nhân vật, tu phả online |
| Zupu.cn / 族谱APP | "Gia phả là lõi, đời sống dòng họ là lớp giữ chân" (tế Tổ online, mạng xã hội tông thân, lịch) |
| Bách Gia Hữu Phả | QR mỗi cuốn phả làm cửa vào → Việt hóa: **QR dán nhà thờ họ mở thẳng web** |
| Vân Mã Tông Phả | Dàn trang tự động các thể thức phả cổ (thức Tô, thức Âu), kiểm lỗi thông minh |
| Dự án Dương gia tướng (2025) | AI xử lý 20 quyển cổ phả/3 tháng; blockchain lưu vết sửa phả; phân cấp riêng tư |
| MyHeritage / FamilySearch | Hint matching AI; mô hình phương Tây là cá nhân — ta theo mô hình tông tộc chung |

**Số liệu đáng nhớ**: gamification hóa tri thức dòng họ (game xếp chữ lót theo đời, hỏi đáp gia quy) từng giúp một nền tảng TQ tăng tỷ lệ người dùng trẻ từ 12% lên 45%.

---

## 5. Kế hoạch triển khai tới dòng họ

> Nguyên tắc: dự án tộc phả thất bại hiếm khi vì kỹ thuật, mà vì thiếu người chống lưng trong họ và dữ liệu nguội dần sau 3 tháng.

### Giai đoạn 0 — Danh chính ngôn thuận
- Dự án phải là **dự án của Hội đồng gia tộc**, không phải "web cá nhân". Trình bày với trưởng họ + trưởng chi (họp họ hoặc bên lề giỗ Tổ), xin chủ trương số hóa gia phả, giao phụ trách kỹ thuật.
- Lập **Ban tu phả số** 3–5 người: phụ trách kỹ thuật + 1 cụ am hiểu phả cũ nhất (cố vấn nội dung — người quý nhất dự án) + mỗi chi 1 đầu mối trẻ.
- Chốt **quy ước nhập phả** ngay từ đầu: ai được vào phả (dâu/rể/con nuôi), thông tin người sống hiển thị đến đâu → chính là spec cho hệ phân quyền.

### Giai đoạn 1 — Nhập liệu lõi (làm kín, 1–3 tháng)
- Không mở nhập liệu đại trà từ đầu. Ban tu phả số hóa **phả gốc** trước (scan → LLM trích xuất → duyệt tay), dựng xương sống từ cụ Thủy tổ.
- Mỗi trưởng chi bổ sung 2–3 đời gần nhất của chi mình.
- Điều kiện ra mắt: cây đủ dày để **ai mở lên cũng tìm thấy chính mình** — người ta chỉ quan tâm gia phả khi thấy tên mình trong đó.

### Giai đoạn 2 — Ra mắt tại giỗ Tổ
- Máy chiếu/TV tại nhà thờ họ: mở cây từ cụ Thủy tổ, zoom dần xuống đến những đứa trẻ đang ngồi dưới sân.
- Demo trực tiếp **Xưng hô LLM**: mời hai người trẻ không biết gọi nhau là gì, gõ câu mô tả, máy trả lời trước cả họ.
- **QR dán tại nhà thờ họ** + in lên thiệp mời giỗ — quét là vào web, không cài gì.
- Kèm **bản in thử Quang Gia Tộc Sử** đặt lên bàn thờ — với các cụ, cuốn sách là bằng chứng dự án nghiêm túc.

### Giai đoạn 3 — Duy trì nhịp sống (chống "chết sau 3 tháng")
- **Lịch giỗ thông minh = nhịp tim**: thông báo giỗ hàng tháng qua **Zalo OA của dòng họ** (kênh phân phối chính, thay app) kèm tiểu sử cụ được giỗ.
- **Node mới – Welcome**: các bà/các cô báo tin sinh nở, đầu mối chi xác nhận → node lên cây, cả họ nhận tin vui.
- **Thám tử phả hệ + điểm công đức** chạy theo chiến dịch quý: công bố "bảng vàng công đức" theo chi trên nhóm Zalo — khai thác máu thi đua giữa các chi.
- Mỗi giỗ Tổ công bố **ấn bản Tộc Sử mới** — biến cập nhật dữ liệu thành truyền thống thường niên.

### Rủi ro & đối sách
| Rủi ro | Đối sách |
|---|---|
| Người giữ phả gốc ngại giao (sợ mất vai trò) | Mời làm **Chủ biên danh dự**, tên in trang đầu Tộc Sử — chuyển người gác cổng thành người bảo trợ |
| Tranh cãi thứ bậc, chi trưởng chi thứ | Web hiển thị theo phả gốc + quyết định Ban tu phả; mọi sửa đổi qua duyệt; kỹ thuật không phân xử |
| Phụ trách kỹ thuật là single point of failure | Đào tạo 1–2 người trẻ quản trị nội dung; Docker + pg_dump định kỳ đẩy cloud; chi phí hạ tầng lấy từ **quỹ họ** để bền vững và củng cố tính "của chung" |

---

## 6. Việc tiếp theo (đề xuất)
1. Chốt tên miền
2. Thiết kế schema Postgres chi tiết (bảng person/relationship, ltree mã chi, JSONB)
3. Thiết kế mô hình phân quyền theo chi/đời
4. Prototype: cây gia tộc + Xưng hô LLM (2 tính năng demo được ngay tại giỗ họ)
5. Roadmap MVP 3 giai đoạn