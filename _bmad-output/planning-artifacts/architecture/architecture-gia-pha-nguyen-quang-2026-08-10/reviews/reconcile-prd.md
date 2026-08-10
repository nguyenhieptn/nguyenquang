---
title: "Đối chiếu PRD ↔ ARCHITECTURE-SPINE — Gia phả Nguyễn Quang, Đợt 1"
status: draft
created: 2026-08-10
---

# Đối chiếu PRD ↔ Architecture Spine

Nguồn:
- `prds/prd-gia-pha-nguyen-quang-2026-08-10/prd.md`
- `prds/prd-gia-pha-nguyen-quang-2026-08-10/addendum.md`

Đích: `architecture/architecture-gia-pha-nguyen-quang-2026-08-10/ARCHITECTURE-SPINE.md`

Phân loại mỗi khoảng trống: **(a)** rơi hợp lý (ngoài Đợt 1) · **(b)** rơi đáng ngờ (nên có mặt) · **(c)** rơi nghiêm trọng (sẽ dẫn xây sai).

---

## 1. Đối chiếu 15 FR của Đợt 1

Cả 15 FR đều xuất hiện trong `binds` (frontmatter) và trong bảng **Capability → Architecture Map**. Không FR nào bị bỏ tên hoàn toàn. Nhưng "có mặt trong bảng" không đồng nghĩa "được AD thật sự chi phối" — bốn trường hợp sau có tên trong bảng nhưng phần chi phối không phủ hết nội dung của FR:

| FR | Có trong map | Phần được AD phủ | Phần KHÔNG được AD nào phủ |
|---|---|---|---|
| **FR-11** — Tự khai 4 bước | AD-1, AD-8, AD-9 | Ghi cần xác thực (AD-8), ghi vào tầng tồn nghi (AD-9) | Bước 2 của chính luồng — "**tìm người thân đã có**" — không có AD nào nói tìm kiếm tên tiếng Việt hoạt động thế nào (xem mục 2.7 dưới) |
| **FR-49** — Đồng thuận lời kể | AD-12, AD-10 | Enforce mức tiếp cận lúc đọc (AD-12), ghi log (AD-10) | **"Đường ẩn khẩn"** cho khẳng định bị báo cáo xúc phạm — không có cơ chế report/flag nào trong core. **"Quyền rút lại còn hiệu lực sau khi mất"** — không có khái niệm ai đại diện thực thi quyền đó sau khi người kể qua đời |
| **FR-55** — Quyền người sống | AD-13, AD-4, AD-10 | Ẩn không xóa (AD-4), bán kính riêng tư (AD-13), log (AD-10) | **"Được biết"** — không có AD, module, hay khái niệm event/notification nào trong `core/` để báo cho người bị thêm/sửa biết |
| **FR-51** — Nạp khung dòng họ | AD-2, AD-7, AD-9 | Vào tầng tồn nghi (AD-9), phân vùng dòng họ (AD-7) | Khung này giả định có **vợ/chồng** ("người đứng đầu mỗi chi" kéo theo gia đình) — không có thực thể quan hệ vợ chồng nào trong Structural Seed (xem mục 4) |

Còn lại — FR-63, FR-13, FR-15, FR-47, FR-1, FR-2, FR-3, FR-64, FR-48, FR-37, FR-39 — được AD chi phối tương đối đầy đủ và nhất quán với nội dung PRD.

---

## 2. Bảy ràng buộc phi chức năng ở §6 PRD

| NFR | Xử lý trong spine | Đánh giá |
|---|---|---|
| **Không được mất dữ liệu** | AD-11 (media không bao giờ chỉ ở VPS) + sơ đồ backup off-host + Deferred "Deployment specifics… phải thỏa AD-11 và durability NFR" | Phủ đúng tinh thần. Chi tiết định lượng (giữ ≥ 90 ngày, diễn tập khôi phục ≥ 1 lần/năm) bị đẩy sang "settled at deploy time" — **(a)** hợp lý, nhưng đáng lẽ nên neo con số ≥90 ngày / diễn tập hằng năm như một invariant tối thiểu thay vì để trống hoàn toàn, vì đây là thứ dễ bị quên khi không viết ra |
| **Một người vận hành được** | Toàn bộ Consistency Conventions (migrations forward-only, config qua env, không cần extension nào cho Đợt 1) + Deferred "Full role-management UI" | Phủ tốt — quyết định bỏ AGE chính là để phục vụ NFR này |
| **Đơn giản là ràng buộc** (≤4 màn hình, ≤3 phút, điện thoại tầm trung, 4G ở quê) | Không có AD nào | **(a/b)** phần luồng màn hình là UX, hợp lý để ngoài spine. Nhưng **4G ở quê** liên quan trực tiếp AD-11/FR-47 (ghi âm tải lên từ mạng yếu) — spine không nói gì về resilience khi tải file ghi âm bị rớt mạng giữa chừng. Đáng ngờ nhẹ — **(b)** |
| **AI không được bịa** | Không có AD nào; không FR nào trong 15 FR của Đợt 1 dùng AI | **(a)** hợp lý — đúng là không FR nào của Đợt 1 sinh văn bản AI. Nhưng addendum A.5 nói rõ đây "là ràng buộc kiến trúc, không phải lời nhắc trong prompt" — spine nên có tối thiểu một dòng ở Deferred ghi lại rằng khi AI-FR nào được mở, trích dẫn nguồn ở tầng dữ liệu là điều kiện bắt buộc, để không ai phải phát hiện lại. Hiện spine im lặng hoàn toàn về điểm này |
| **Đa dòng họ: thiết kế sẵn, chưa mở** | AD-7, AD-14, Deferred "Multi-clan onboarding" | Phủ tốt nhất trong bảy NFR — đúng là trọng tâm mà addendum cảnh báo (mất RLS khi dùng AGE) đã được giải quyết bằng cách bỏ AGE và dùng RLS gốc của Postgres |
| **Web đủ năng lực** | Không có AD riêng, nhưng AD-11/AD-12 (ghi âm, ảnh qua browser) gián tiếp xác nhận | **(a)** hợp lý — đây là một tuyên bố phủ định (không viện cớ), không cần invariant riêng |
| **Tiếng Việt là mặc định** (tìm không dấu, sắp xếp alphabet tiếng Việt, Hán-Nôm kèm phiên âm) | **Không xuất hiện ở đâu cả** — không AD, không convention, không dòng nào trong Deferred | **(c)** — xem phân tích riêng ở mục 2.7 |

### 2.7 — Vì sao "Tiếng Việt là mặc định" là khoảng trống nghiêm trọng

FR-11 bước 2 là **"tìm người thân đã có"** — tìm kiếm theo tên trong một dòng họ dưới 300 người. NFR §6 yêu cầu tìm kiếm này phải **không dấu**. Đây không phải nhu cầu của tính năng "sau này" — nó nằm ngay giữa luồng lõi của Đợt 1.

Spine hiện quyết định "No PostgreSQL extension is required for Đợt 1" và đẩy `pg_search`/ParadeDB vào Deferred với lý do "chỉ phục vụ F7 (Quang Gia Tộc Sử), ngoài Đợt 1" — điều này đúng cho tìm kiếm toàn văn dài (hồi ký, văn bia), nhưng **bỏ sót** rằng tìm-tên-không-dấu là nhu cầu khác, nhẹ hơn nhiều (extension `unaccent` chuẩn của Postgres, không cần ParadeDB), và nó cần **ngay trong Đợt 1**. Vì không AD hay convention nào nhắc tới, rủi ro thật là: người triển khai viết `WHERE name = $1` hoặc `ILIKE` thường, và tìm kiếm gõ không dấu (thói quen phổ biến trên điện thoại) sẽ không ra kết quả — làm hỏng đúng bước quan trọng nhất của FR-11.

---

## 3. §11 Mặc định của PRD

| Mặc định | Có mặt trong spine? |
|---|---|
| Con gái lấy chồng vẫn trong chính phả đầy đủ, đánh dấu thuộc họ khác | **Không** — xem mục 4, không có khái niệm chính phả/ngoại phả hay "thuộc họ khác" trong Structural Seed |
| Con dâu, con rể ghi tên thật đầy đủ | Gián tiếp — AD-2 nói person giữ "giá trị hiện được chấp nhận", không cấm ghi tên thật, nhưng không có gì *bảo đảm* việc này khác quy tắc ẩn danh nào đó có thể bị áp nhầm. Trung tính, không mâu thuẫn nhưng cũng không được neo lại |
| Con nuôi/thừa tự: ghi như con, có trường quan hệ, không dấu phân biệt trên cây | **(a)** hợp lý để lại cho schema — spine nói rõ "Attributes that are themselves invariants are ADs, not diagram nodes", nên trường `quan_hệ` trên cạnh cha-mẹ-con là chi tiết thiết kế schema, không bắt buộc phải lên spine |
| Con ngoài giá thú: ghi như trên, được bảo vệ bởi FR-49 (niêm phong) | Một nửa được phủ — FR-49 có AD-12 (mức tiếp cận), nhưng phần "đường ẩn khẩn" bị thiếu (đã nêu ở mục 1) |
| Người sống hiển thị tới đâu: chỉ năm sinh, ẩn liên hệ, vị thành niên ẩn chặt hơn | **Được phủ tốt** — AD-13 nói rõ "Minors are restricted further. Default is the restrictive branch." |
| Được ẩn, không được xóa | **Được phủ nhưng có mâu thuẫn nội bộ** — xem mục 5 |

---

## 4. Khoảng trống nghiêm trọng nhất: không có thực thể vợ/chồng trong Structural Seed

ERD trong spine:

```
CLAN ||--o{ PERSON
PERSON ||--o{ ASSERTION
PERSON ||--o{ PARENT_CHILD (parent)
PERSON ||--o{ PARENT_CHILD (child)
PERSON ||--o| PERSON (tombstone redirect)
PERSON ||--o{ ACCOUNT_ATTACHMENT
ACCOUNT ||--o{ ACCOUNT_ATTACHMENT
ASSERTION }o--|| SOURCE
RECORDING ||--o{ ASSERTION
RECORDING }o--|| PERSON
REVISION }o--|| ACCOUNT
```

Không có cạnh vợ-chồng/hôn phối nào. Nhưng toàn bộ khái niệm **chính phả** ở §4 PRD được định nghĩa là *"người mang huyết thống **và vợ của họ**"*, và §11 dành hẳn hai dòng mặc định cho con dâu/con rể và con gái lấy chồng — tất cả xoay quanh quan hệ hôn phối. FR-11 ("thêm mình và gia đình") và FR-51 (nạp khung, "người đứng đầu mỗi chi") đều ngầm định có vợ/chồng đi kèm.

Đây không phải chi tiết thuộc tính có thể để schema tự quyết (như trường "quan hệ" trên con nuôi) — đây là **một loại quan hệ hoàn toàn thiếu trong sơ đồ cấu trúc**, ngang hàng với PARENT_CHILD. Thiếu nó, không rõ:
- Vợ chồng lưu ở đâu (một bảng riêng, hay overload PARENT_CHILD?)
- Chính phả/Ngoại phả — khái niệm trung tâm của §4 — ánh xạ vào đâu trong dữ liệu
- "Đánh dấu thuộc họ khác" cho con gái đi lấy chồng gắn vào thực thể nào

**Phân loại: (c) — nghiêm trọng.** Đây là chỗ có khả năng cao nhất khiến người triển khai xây nhầm mô hình dữ liệu, vì FR-51 (một trong ba việc gieo mồi đầu tiên) sẽ chạm ngay vấn đề này.

---

## 5. Mâu thuẫn: AD-13 "không có toggle" vs FR-55 "được ẩn"

AD-13 viết: *"visibility of a living person's detail is derived from relationship distance... **No user-facing toggle governs it**."*

FR-55 (§5 PRD) đòi hỏi người bị khai phải **"được ẩn khỏi phần công khai mà vẫn giữ liên kết phả hệ"** — nghĩa là chính người đó có quyền tự chọn ẩn, không phụ thuộc bán kính họ hàng của người xem. Đây đúng là một toggle do người dùng kiểm soát, và FR-55 lại được liệt kê là do AD-13 chi phối trong bảng Capability Map.

Nói cách khác: quy tắc kiến trúc (AD-13) cấm chính xác thứ mà yêu cầu chức năng (FR-55) đòi phải có. Nếu người triển khai đọc AD-13 theo đúng nghĩa đen ("no toggle"), quyền "được ẩn" của FR-55 sẽ không có chỗ để cài vào.

**Phân loại: (c) — nghiêm trọng.** Cần một AD tách biệt: bán kính riêng tư là **mặc định tính toán** (đúng tinh thần AD-13), nhưng người dùng có quyền **ghi đè bằng một cờ ẩn công khai** riêng của chính họ — hai cơ chế khác nhau, hiện bị gộp làm một trong văn bản AD-13.

---

## 6. Điều kiện ra mắt §9

*"mỗi chi có ít nhất một người đã tự khai và nối được vào khung, số mảnh chưa nối bằng 0"* — đo được, vì `core/tree` module liệt kê rõ **"fragments"** là một khái niệm domain, và Deferred table xác nhận đo bằng SQL tay ở quy mô này là đủ. Điều kiện ra mắt được đảm bảo đo được — **không có khoảng trống ở đây**.

---

## 7. Nội dung định tính dễ rơi

Tang chế (FR-59), tên hèm/thụy, quy tắc từ chối xưng hô (FR-52), phạm húy (FR-53) — tất cả **đúng như PRD §7 đã tự xếp vào "Sau này"**, không thuộc Đợt 1. Spine không nhắc tới bất kỳ cái nào, và đó là đúng — **(a) rơi hợp lý**, nhất quán với chính PRD.

---

## Tổng kết xếp loại

| # | Khoảng trống | Loại |
|---|---|---|
| 1 | Không có thực thể vợ/chồng trong Structural Seed — phá vỡ khái niệm chính phả/ngoại phả (§4, §11), ảnh hưởng trực tiếp FR-51, FR-11 | **(c)** |
| 2 | AD-13 ("no user-facing toggle") mâu thuẫn với quyền "được ẩn" của FR-55 | **(c)** |
| 3 | "Tiếng Việt là mặc định" (tìm không dấu) vắng mặt hoàn toàn, trong khi FR-11 bước 2 cần nó ngay trong Đợt 1 | **(c)** |
| 4 | FR-49: không có cơ chế "đường ẩn khẩn" cho khẳng định bị báo cáo xúc phạm, và không rõ ai thực thi "quyền rút lại" sau khi người kể mất | **(b)** |
| 5 | FR-55: quyền "được biết" (thông báo khi bị thêm/sửa) không có AD, module, hay khái niệm event nào tương ứng | **(b)** |

File đầy đủ: `C:\Users\nguye\dev\nguyenquang\_bmad-output\planning-artifacts\architecture\architecture-gia-pha-nguyen-quang-2026-08-10\reviews\reconcile-prd.md`
