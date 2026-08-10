---
title: "Addendum — PRD Gia phả Nguyễn Quang"
status: final
created: 2026-08-10
updated: 2026-08-10
---

# Addendum

Nội dung có giá trị nhưng không thuộc phần thân của PRD: lựa chọn kỹ thuật, phương án đã loại, kế hoạch triển khai tới dòng họ, và tham chiếu benchmark. Người đọc chính là bước tiếp theo — `bmad-architecture` và `bmad-ux`.

> **Khi hai tài liệu lệch nhau, `prd.md` là bản chốt.**

---

## A. Ngăn xếp kỹ thuật

### A.1 Chốt ngày 10/08/2026

```
Ứng dụng
├─ Backend: TypeScript
├─ Frontend: React
└─ Một codebase, kiểu dữ liệu dùng chung từ DB → API → UI

Dữ liệu: PostgreSQL
├─ ParadeDB      → bản phân phối Postgres đóng gói sẵn
│   └─ pg_search → full-text BM25 (hồi ký, văn bia)
│                  ICU tokenizer + unaccent cho tiếng Việt
├─ Apache AGE    → truy vấn graph (openCypher)
└─ pgvector      → embedding tư liệu, RAG cho Quang Gia Tộc Sử
```

Nguyên tắc giữ nguyên từ `docs/project.md` §3.0: **một ngôn ngữ end-to-end**, AI gọi qua API (không chạy model local) nên không cần backend Python; **tối giản vận hành** vì chỉ một người vận hành (NFR-3).

### A.2 Thay đổi so với `docs/project.md`

| Điểm | `project.md` (08/2026) | Chốt 10/08/2026 |
|---|---|---|
| Graph | **Bỏ Neo4j.** Recursive CTE + `graphology` in-memory | **Apache AGE** trong Postgres |
| Full-stack | Next.js 15 (API Routes / Server Actions) | Backend TypeScript + frontend React — có thể vẫn là Next.js, chưa chốt tách hay gộp |

**Lý do ghi lại:** `project.md` §3.0 lập luận "graph dòng họ chỉ vài nghìn node, recursive CTE đủ nhanh, bớt một database phải vận hành". AGE không thêm database — nó là extension trong chính Postgres — nên lập luận "bớt một DB" vẫn được giữ. Bù lại, các truy vấn đường quan hệ — vốn viết bằng recursive CTE rất cồng kềnh — nay dùng được cú pháp openCypher.

### A.3 Việc kỹ thuật cần xác minh trước khi chốt kiến trúc

> ⚠️ **Ảnh Docker ParadeDB chính thức chưa có bằng chứng là kèm sẵn Apache AGE.** ParadeDB đóng gói `pg_search` và `pg_analytics`. Chạy đồng thời AGE + ParadeDB nhiều khả năng cần **ảnh Docker tự dựng**, và phải kiểm tra tương thích phiên bản PostgreSQL của cả hai.
>
> **Việc này đứng ở tuần 0, trước mọi thứ khác** — ước 20–40h, xác suất ~30% vẫn phải chọn lại giữa AGE và ParadeDB (hoặc chấp nhận hai container). Giao cho `bmad-architecture`.

#### Phản biện đã được cân nhắc và bác bỏ (10/08/2026)

Cổng phản biện đề nghị **bỏ cả bốn extension** cho MVP và dùng `postgres:17` + `unaccent` + `pg_trgm`, với đồ thị duyệt BFS in-memory. Hiệp quyết **giữ nguyên ngăn xếp**. Lập luận phản biện lưu lại đây để sau này không ai phải phát hiện lại — và để `bmad-architecture` biết mình đang gánh gì:

| Điểm | Lập luận phản biện |
|---|---|
| **ParadeDB** | Tồn tại trong ngăn xếp chỉ để mang `pg_search` |
| **pg_search** | Chỉ có giá trị với văn bản dài của F7 (Quang Gia Tộc Sử) — ngoài MVP |
| **pgvector** | Chỉ phục vụ FR-30/31 — ngoài MVP |
| **AGE** | Bị đánh giá là **lỗ ròng** ở quy mô ~5.000 node: (a) xung khắc với FR-1, buộc dual-write SQL↔graph; (b) **mất row-level security**, khiến NFR-7 đa dòng họ vừa đắt vừa có rủi ro rò dữ liệu giữa các họ; (c) `project.md` §3.0 đã kết luận "recursive CTE đủ nhanh" rồi bị đảo ngược chỉ vì tiện cú pháp Cypher |
| **Chi phí định kỳ** | Ảnh tự biên dịch phải dựng lại mỗi bản vá PG/ParadeDB/AGE ≈ **5–10h mỗi quý, vĩnh viễn** (60–120h qua 3 năm) |
| **Va chạm NFR-3** | Một ảnh Postgres tự dựng với 2 extension biên dịch từ nguồn thì **không ai "tiếp quản trong 1 ngày"** như NFR-3 yêu cầu |

Lập luận về **phạm vi và nguồn lực** (so sánh chi phí ngăn xếp này với lớp vỏ mobile đã bị loại) nằm ở `review-feasibility.md`.

**Việc bắt buộc phát sinh từ quyết định giữ nguyên:** giải bài toán **cô lập đa dòng họ khi không có RLS** (NFR-7). Đây là điểm cần theo dõi sát nhất trong toàn bộ kiến trúc — rò dữ liệu giữa hai dòng họ là loại lỗi mà không bản vá nào chữa được lòng tin đã mất.

Các điểm cần làm rõ tiếp:

- **AGE vs `ltree`.** `project.md` dự định dùng `ltree` cho mã chi `1.3.2`. Với AGE, phần lớn truy vấn cây chuyển sang Cypher — `ltree` còn cần cho lọc theo chi hay không?
- **AGE vs `graphology`.** Nếu AGE lo phần graph trong DB thì `graphology` in-memory còn vai trò gì? Có thể bỏ hẳn.
- **Mô hình FR-1 trong AGE.** Khẳng định-có-nguồn không ánh xạ trực tiếp sang node/edge thường: mỗi cạnh quan hệ phải mang được nguồn + độ tin cậy + trạng thái. Cần thiết kế riêng — đây là quyết định schema quan trọng nhất của dự án.
- **NFR-7 đa dòng họ trong AGE.** AGE dùng khái niệm *graph* riêng biệt — mỗi dòng họ một graph, hay một graph chung có thuộc tính phân vùng? Ảnh hưởng trực tiếp tới cô lập dữ liệu.

### A.4 Thư viện dự kiến (từ `project.md` §3.1, chưa rà lại sau 10/08)

| Việc | Thư viện |
|---|---|
| Cây gia tộc | `family-chart` (donatso, D3, MIT) |
| Fan chart / in ấn | `topola` (PeWu) |
| Bản đồ | MapLibre GL + deck.gl |
| ORM | Drizzle |
| LLM | Anthropic TypeScript SDK + Zod structured output |
| Âm lịch | `amlich.js` (Hồ Ngọc Đức) |
| GEDCOM 7 | `read-gedcom` / `gedcom7` |
| Auth | **chưa chốt — chặn bởi PRD Q13** (magic link qua email / OTP SMS). NextAuth là ứng viên nếu giữ Next.js |
| Đọc thành tiếng (FR-61) | chưa chọn — cần giọng tiếng Việt tự nhiên, chạy được từ web |

### A.5 Thiết kế AI

- **Xưng hô (FR-19/20/21):** LLM chỉ parse câu tự nhiên thành chuỗi quan hệ có cấu trúc (Zod schema). Việc resolve node và tính đường quan hệ do truy vấn graph lo. **Không để LLM sinh Cypher** — an toàn, rẻ, chống prompt injection.
- **Thám tử phả hệ (FR-26/27):** rule engine chạy trong SQL/graph — chính xác 100%, miễn phí. LLM chỉ viết lời giải thích và sinh nhiệm vụ xác minh.
- **Quang Gia Tộc Sử (FR-30/31):** RAG hybrid trên pgvector + pg_search. NFR-6 (AI không được bịa) là ràng buộc kiến trúc, không phải lời nhắc trong prompt — mọi câu sinh ra phải mang trích dẫn ở tầng dữ liệu.
- **Bóc tách lời kể (FR-8) và ảnh tư liệu (FR-9):** LLM vision + structured output; kết quả luôn vào **Tầng tồn nghi**, không bao giờ tự lên **Tầng chính thức**.
- Python chỉ xuất hiện nếu sau này cần model local (OCR Hán-Nôm chuyên dụng) — tách worker riêng, không đụng backend chính.

### A.6 Chuẩn & lưu trữ

- Import/export **GEDCOM 7** — tương thích hệ sinh thái gia phả quốc tế, và là định dạng cho NFR-2 (sao lưu phân tán) + FR-40 (tự xuất dữ liệu cá nhân).
- Media: MinIO/S3 hoặc object storage của VPS provider.
- Hạ tầng: Docker Compose trên một VPS; backup `pg_dump`.

---

## B. Repo tham chiếu

Học, không fork:

| Repo | Học gì |
|---|---|
| webtrees (PHP) | Mô hình riêng tư per-person (living/dead, vai trò) trưởng thành nhất trong mã nguồn mở — trực tiếp liên quan FR-37/38 |
| Gramps Web (Python+React) | Data model Person–Family–Event–Place–Source–Citation — chú ý `Source`/`Citation`, đúng thứ FR-1 cần |
| GeneWeb (OCaml) | Thuật toán tính bậc quan hệ / consanguinity — liên quan FR-19/20 |
| donatso/family-chart | Dùng trực tiếp cho FR-15 |
| PeWu/topola | Fan chart, render GEDCOM, xuất in — FR-33 |
| dtree | Vẽ cây đa-cha-mẹ (con nuôi/thừa tự) |

---

## C. Kế hoạch triển khai tới dòng họ

> Giữ từ `docs/project.md` §5. Đây **không phải nội dung PRD** nhưng là phần sắc sảo nhất của tài liệu gốc, và **Q9/Q10 trong PRD §12** trỏ thẳng về đây.

**Nguyên tắc:** dự án tộc phả thất bại hiếm khi vì kỹ thuật, mà vì thiếu người chống lưng trong họ và dữ liệu nguội dần sau 3 tháng.

### Giai đoạn 0 — Danh chính ngôn thuận *(làm được 1/3)*

- ✅ **Dòng họ đã được thông báo** (10/08/2026) — độ phủ thực tế chưa xác nhận.
- ❓ Lập **Ban tu phả** 3–5 người: phụ trách kỹ thuật + một cụ am hiểu nhất về phả cũ (cố vấn nội dung — người quý nhất dự án) + mỗi chi một đầu mối trẻ. *(PRD Q9)*
- ❓ Chốt **phàm lệ** *(PRD Q10)* — chi tiết ở PRD §12.

### Giai đoạn 1 — Gieo mồi dữ liệu

> **Khác `project.md`:** tài liệu gốc viết "số hóa phả gốc trước". Không có phả gốc. Giai đoạn này giờ là **tạo ra dữ liệu chưa từng tồn tại**.

**Ba việc dưới đây không cần một dòng code nào, nên bắt đầu tuần 10–16/08/2026:**

1. **Dựng khung dòng họ ngoài hệ thống** — giấy hoặc Excel: các chi hiện có, người đứng đầu mỗi chi, ước lượng số hộ, giả thuyết ban đầu về cụ Thủy tổ. Đầu vào của FR-51; lý do ở PRD §3.1.
2. **Đi ghi âm các cụ cao niên bằng điện thoại** — không chờ FR-47, không chờ gì cả. Đây là chỉ số M3, chỉ số duy nhất trong PRD tiến triển được mà không cần phần mềm.
3. **Chốt phàm lệ** ở kỳ giỗ họ gần nhất *(Q10)* — nội dung FR-7 do dòng họ quyết, không do phần mềm quyết.

Sau đó, khi phần mềm đã chạy:

- Hiệp tự nhập 2–3 đời gần nhất từ trí nhớ gia đình mình — đủ để cây không trống.
- Mỗi trưởng chi bổ sung 2–3 đời gần nhất của chi mình.
- Điều kiện ra mắt: ai mở lên cũng tìm thấy chính mình.

> **Lưu ý mâu thuẫn đã gỡ:** `project.md` §5 GĐ1 đặt ràng buộc *"làm kín 1–3 tháng, không mở nhập liệu đại trà"*. Điều đó va chạm với FR-3 (ai đã xác thực đều ghi được ngay). Cách dung hòa: giai đoạn này **giới hạn tập người được xác thực** (Ban tu phả + trưởng chi), không tắt cơ chế FR-3.

### Giai đoạn 2 — Ra mắt tại giỗ Tổ

- Máy chiếu/TV tại nhà thờ họ: mở cây từ cụ Thủy tổ, zoom xuống đến những đứa trẻ đang ngồi dưới sân.
- Demo **xưng hô hai người quét chung một QR** — FR-19, xem PRD UJ-4.
- **QR dán tại nhà thờ họ** + in lên thiệp mời giỗ.
- Bản in thử đặt lên bàn thờ — với các cụ, cuốn sách là bằng chứng dự án nghiêm túc.

### Giai đoạn 3 — Duy trì nhịp sống

- Lịch giỗ hiển thị trên web (FR-41) — **không còn kênh đẩy tự động** sau quyết định bỏ Zalo 10/08/2026. Việc nhắc nhau vẫn diễn ra trong các nhóm sẵn có của dòng họ, do người thật làm, không qua hệ thống.
- Nghi thức chào người mới vào phả (FR-14): các bà báo tin sinh nở, đầu mối chi xác nhận.
- Thám tử phả hệ + điểm công đức chạy theo chiến dịch quý.
- Mỗi giỗ Tổ công bố ấn bản **Quang Gia Tộc Sử** mới.

### Việc ngoài trục giai đoạn

**Tên miền — chưa chốt *(PRD Q11)*:** `nguyenquangtoc.vn` (trực diện, dễ nhớ) · `quangtocduong.vn` ("Quang Tộc Đường", trang trọng) · `nguyenquang.family` (hiện đại)

**Lập luận xin quỹ họ:** mỗi lần tu phả giấy theo lối cũ tốn **vài chục triệu đồng**; nền tảng này tái bản phả in hằng năm với chi phí gần như bằng không. Đây là con số đáng mang ra khi trình Hội đồng gia tộc xin quỹ cho VPS và tên miền. Việc lấy kinh phí từ quỹ họ, dù nhỏ, quan trọng về mặt biểu tượng: nó biến dự án thành *của chung*, đúng như Giai đoạn 0 yêu cầu.

**Chiến thuật $0 *(từ brainstorm, không cần code)*** — đáng làm song song với phần mềm, có thể thu được nhiều dữ liệu hơn mọi form nhập liệu:

- Cây phả in trên **bạt treo giỗ họ**, chừa ô trống bút dạ để mọi người tự điền người thiếu, rồi chụp lại nhập vào
- **Sticker dán ảnh**: phát ảnh cũ in sẵn, ai nhận ra ai thì dán tên
- Nhiệm vụ **"hỏi ông bà 3 câu"** phát cho trẻ con dịp Tết, đổi lì xì lấy dữ liệu
- Bản in phả **khổ A5** cho mỗi chi: người già cầm được, sửa bằng bút, trả lại để nhập
- **Một người trong họ nhận việc nhắc giỗ** trong nhóm chat sẵn có, lấy nội dung từ web — thay cho kênh đẩy tự động đã hoãn (FR-60), và không cần tích hợp gì

---

## D. Benchmark

| Hệ thống | Bài học |
|---|---|
| Thư viện Thượng Hải — 家谱知识服务平台 | Knowledge graph + linked data trên 54.000 bộ phả; crowdsourcing, tự phát hiện xung đột dữ liệu |
| Quán Thư Đường | AI số hóa quy mô lớn (14 triệu trang), trực quan hóa nhân vật, tu phả online |
| Zupu.cn / 族谱APP | "Gia phả là lõi, đời sống dòng họ là lớp giữ chân" |
| Bách Gia Hữu Phả | QR mỗi cuốn phả làm cửa vào → Việt hóa: QR dán nhà thờ họ |
| Vân Mã Tông Phả | Dàn trang tự động các thể thức phả cổ (thức Tô, thức Âu), kiểm lỗi thông minh |
| Dự án Dương gia tướng (2025) | AI xử lý 20 quyển cổ phả/3 tháng; blockchain lưu vết sửa phả; phân cấp riêng tư |
| MyHeritage / FamilySearch | Hint matching AI; mô hình phương Tây lấy cá nhân làm tâm |

**Số liệu đáng nhớ:** trò chơi hóa tri thức dòng họ từng giúp một nền tảng Trung Quốc tăng tỷ lệ người dùng trẻ từ 12% lên 45%. `[chưa kiểm chứng — số dẫn lại từ project.md §4]`

Khoảng trống mà bảng này để lộ ra đã thành "Khác biệt cốt lõi" ở PRD §1.

---

## E. Backlog — ý tưởng chưa xếp phạm vi

Từ `project.md` §2.3 và phiên brainstorm 103 ý. Không thuộc PRD hiện tại; giữ lại để sprint planning về sau bốc ra.

**Từ `project.md` §2.3:** QR mộ phần & bản đồ tảo mộ · Trang vàng gia tộc · Đố vui gia tộc · Dòng họ qua những con số *(phần dữ liệu đã có ở FR-56; còn lại là lớp trình bày công khai)* · Nhận họ cho người **ngoài** dòng họ *(phần trong họ đã có ở FR-48 và FR-58)*.

> **Đã rút ba mục khỏi backlog này (10/08/2026):**
> - **"Tự bối"** (chữ lót đổi theo đời) — dòng họ **đã bãi bỏ**, chốt lấy "Nguyễn Quang" làm gốc với chữ đệm cố định mọi đời. Phần còn hiệu lực (kiểm nếp tên, tra phạm húy) đã thành **FR-53**. Bản addendum trước giữ lại đúng phần đã bị bãi bỏ.
> - **Bản đồ di cư** — là tính năng `ĐÃ CHỐT` ở `project.md` §2.2, không phải backlog; đã khôi phục thành **FR-62**.
> - **Nhà in phả tự động, thức phả Việt** — đã là **FR-33**.

**Từ brainstorm — nhóm nghi lễ:** Lễ Nhập Phả số · Sổ Chúc Văn tập thể · Thứ tự thắp hương chiêu mục · Lễ Khai Phả đầu năm · Lễ trao Đèn Chi · Lễ Đặt Tên có chứng · Chạp họ điểm danh QR · Lễ Rước Phả về chi · Lễ Khánh Thọ tự động.

**Từ brainstorm — nhóm đời sống dòng họ *(đáng chú ý: đây là lớp giữ chân người trẻ)*:** Trang "Họ ta hôm nay" · Danh bạ tông thân có phân quyền · **Chợ giúp nhau trong họ** (việc làm, chỗ trọ cho cháu đi học, bác sĩ trong họ) · Niên biểu đời người · Trang "Về nhà chồng/nhà vợ".

**Từ brainstorm — nhóm tư liệu & hiện vật:** Bảo tàng hiện vật họ (sắc phong, gia huấn, ấn triện, đồ thờ) · Trang "Đất tổ" cho từng địa danh · Dòng chảy hương hỏa · Scan 3D bia mộ · Phủ bản đồ Đông Dương lên bản đồ nay · Đối chiếu ba lịch (âm/dương/can chi + niên hiệu Lê–Nguyễn).

**Từ brainstorm — nhóm quản trị:** Biên bản họp họ tự động · Bỏ phiếu tông thân · Mục Ngoại phả · Thẻ tông thân · Sinh cáo phó & điếu văn đúng vai vế · Sinh văn bia, hoành phi, câu đối.

**Từ brainstorm — nhóm người trẻ & trẻ con:** Chế độ "phả 60 giây" (thẻ dọc dạng story) · Bộ thẻ nhân vật kiểu Top Trumps · "Hồi cụ bằng tuổi cháu" · Góc tranh cháu vẽ tổ tiên · Chỉ số dòng họ vui · Bình chọn "giống cụ nào".

**Từ brainstorm — nhóm mở rộng:** Liên phả thông gia · Phả đồ hai họ cho thiệp cưới · Khung nhập kết quả ADN cho Việt kiều nhận họ · Bản đồ con cháu toàn cầu · Ước tính hậu duệ tiềm năng.

---

## F. Phương án đã cân nhắc và loại

| Phương án | Lý do loại |
|---|---|
| **Neo4j** riêng | Thêm một database phải vận hành và backup, trong khi chỉ một người vận hành (NFR-3). Thay bằng AGE trong chính Postgres |
| **Backend Python** | AI gọi qua API, không chạy model local → không cần. Một ngôn ngữ end-to-end có giá trị lớn hơn với đội một người |
| **Text2Cypher** (LLM sinh truy vấn) | Rủi ro prompt injection và truy vấn sai; thay bằng LLM chỉ parse ra schema có cấu trúc |
| **Blockchain lưu vết sửa phả** | Quá nặng cho nhu cầu thật. Công bố mã băm mỗi ấn bản (NFR-10) đạt cùng mục tiêu chống nghi ngờ |

Các loại trừ ở **tầng sản phẩm** — app mobile, nhận diện khuôn mặt tự động, tổng hợp giả giọng người đã khuất, và những mục khác — xem PRD §7.
