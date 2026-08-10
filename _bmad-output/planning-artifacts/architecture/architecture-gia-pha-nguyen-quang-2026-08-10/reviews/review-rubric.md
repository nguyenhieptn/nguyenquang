# Architecture Spine Quality Review — Gia phả dòng họ Nguyễn Quang, Đợt 1

*Chấm `ARCHITECTURE-SPINE.md` theo danh sách kiểm "một spine tốt", bảy chiều. Bối cảnh đã tính vào khi chấm: một người tự code, dưới 300 người, web-only, VPS Ubuntu + Docker, spine là đầu vào cho tầng epics/stories và cho `bmad-ux`. Đối chiếu: `prd.md`, `addendum.md`, `.memlog.md`, `.ui-workshop-kit/frontend-stack.template.md`. Phiên bản công nghệ được xác minh lại độc lập trên web ngày 10/08/2026.*

---

## Overall verdict

Đây là một spine **đúng thể loại**: nó không phải bản mô tả hệ thống, nó là một danh sách những chỗ hệ thống có thể gãy làm đôi nếu không ai chốt. Mười bốn AD hầu hết trỏ vào **những ngã ba thật** — số đời dẫn xuất, khóa chính vô nghĩa, tài khoản ≠ node, một đường ghi duy nhất, media không nằm trong DB — và mỗi cái đều có câu "Prevents" nêu đúng cái hỏng cụ thể chứ không phải một nguyên tắc đẹp. Việc bỏ Apache AGE / ParadeDB, gỡ luôn 20–40h rủi ro ảnh Docker ở tuần 0, là quyết định có giá trị nhất trong toàn bộ tài liệu. Bảng Deferred có cột "vì sao chờ được" chứ không phải một danh sách rác. Vocabulary trong Consistency Conventions (ngày âm lịch tách trường, ngày có "precision marker") cho thấy người viết đã nghĩ tới tầng domain thật.

Nhưng spine này **chưa dùng để xây được**, vì ba lý do thuộc ba hạng khác nhau:

1. **AD canh cái hỏng nặng nhất lại là AD có rule yếu nhất.** AD-7 tuyên bố "phân vùng dòng họ do database ép, không do truy vấn". Nhưng rule của nó thiếu đúng bốn chi tiết khiến RLS trong PostgreSQL hoạt động hay không hoạt động — và ở cấu hình mặc định của Docker Compose + Drizzle migrate, RLS **im lặng không chạy**. AD tuyên bố ngăn rò dữ liệu giữa hai dòng họ, mà rule của nó không ngăn được.

2. **Structural Seed thiếu quan hệ hôn nhân.** ERD chỉ có `PARENT_CHILD`. PRD §11 đòi vợ/chồng, dâu/rể đánh dấu họ khác, con nuôi có trường quan hệ; FR-11 bước 4 là "thêm mình **và gia đình**". Nặng hơn: AD-13 tính riêng tư bằng "khoảng cách quan hệ", mà tập cạnh duy nhất spine định nghĩa là cạnh huyết thống — nên con dâu ở khoảng cách vô hạn với chính chồng mình. Đây không phải chi tiết tầng dưới; đây là ngã ba kinh điển nhất của mọi hệ gia phả và spine đứng im ngay tại đó.

3. **Chiều vận hành gần như bị bỏ trống, và đúng cái NFR số một của PRD không có AC nào.** "Không được mất dữ liệu — sao lưu hằng ngày, giữ ≥ 90 ngày, ≥ 2 nơi, diễn tập khôi phục 1 lần/năm" là NFR đứng đầu PRD, về đúng loại dữ liệu PRD gọi là *không tái tạo được*. Trong spine nó không có AD, chỉ có một mũi tên đứt nét trong sơ đồ và một dòng Deferred "backup destinations settled at deploy time" — mâu thuẫn thẳng với câu văn ngay phía trên nó ("The second location is not optional"). Cùng với đó: môi trường (dev/staging/prod), cơ chế chạy migration, khả năng quan sát lỗi ứng dụng, và kênh email đi ra đều **im lặng hoàn toàn** — không quyết, không hoãn, không ghi là câu hỏi mở.

Chiều mạnh nhất là **chọn đúng ngã ba ở tầng dữ liệu**. Chiều yếu nhất là **chiều vận hành / môi trường** — và đó là chiều mà một người tự vận hành nhiều năm sẽ trả giá lâu nhất.

---

## 1. Nó có cố định đúng những điểm phân kỳ thật không, và bỏ sót gì — **khá, thủng bốn chỗ**

Phần được: AD-2 (person là hàng thật, assertion là bằng chứng bên cạnh) chốt đúng câu hỏi mà `.memlog.md` xác định là khó nhất — "một người là gì trong lưu trữ". AD-5 + AD-6 tách bạch **định danh trong máy** khỏi **mã hiển thị**, đúng ba hệ quả bắt buộc PRD §3 liệt kê. AD-8 tách tài khoản khỏi node đúng chữ FR-64. AD-9 ("một đường ghi, mọi thứ vào tồn nghi trước") diệt đúng cái phân kỳ nguy hiểm: hai đường ghi có validate khác nhau. AD-11 tách media khỏi DB. AD-1 là lựa chọn paradigm và nó được nêu như một lựa chọn, có lý do, có sơ đồ mũi tên "forbidden". Đây là công việc tốt.

Phần thiếu, xếp theo độ nặng:

**Hôn nhân và quan hệ phi huyết thống.** Không có `UNION`/`FAMILY`/`MARRIAGE` trong ERD, không có AD nào nói quan hệ vợ chồng được mô hình bằng gì. Hai người xây sẽ rẽ ba hướng khác nhau: bảng `union` kiểu GEDCOM/Gramps (`addendum` §B chỉ đích danh Gramps Web *"Person–Family–Event–Place–Source–Citation"* là mô hình đáng học), hay cột `spouse_id` trên `person`, hay một hàng `relationship` tổng quát. Ba hướng đó cho ba schema không tương thích, ba cách render FR-15 khác nhau, và ba định nghĩa khác nhau cho "khoảng cách quan hệ" của AD-13. Chưa kể `addendum` §A.6 chốt GEDCOM 7 là định dạng xuất — GEDCOM 7 **buộc** phải có khái niệm FAM.

**Danh tính người gọi đi qua biên core.** AD-1 cấm `app/` import DB client. Nhưng nó không cấm `app/` **truyền vào** `clanId`, `viewerNodeId`, hay `role` cho một hàm core. Nếu chữ ký core là `getPerson(personId, viewerNodeId)`, thì lint rule của AD-1 vẫn xanh trong khi AD-7 và AD-13 bị vượt mặt hoàn toàn — adapter chỉ cần truyền một node khác. Đây là lỗ hổng đúng loại mà AD-1 tồn tại để bịt, và nó không được bịt. Cần một AD riêng: **core tự phân giải danh tính người gọi từ session; không thao tác nào của core nhận danh tính, dòng họ, hay vai trò làm tham số.**

**Tìm kiếm tên tiếng Việt không dấu.** FR-11 bước 2 là "tìm người thân đã có" — tức là Đợt 1 cần tìm theo tên. NFR đòi "tìm không dấu, sắp xếp theo alphabet tiếng Việt". Spine tuyên bố "No PostgreSQL extension is required for Đợt 1" và dừng ở đó. Xác minh lại: PostgreSQL 18 **làm được không cần extension**, bằng ICU nondeterministic collation (`provider = icu, locale = 'und-u-ks-level1-kc-true', deterministic = false`) — nên tuyên bố không-extension vẫn đứng vững. Nhưng lựa chọn giữa (a) collation nondeterministic, (b) `unaccent` + `pg_trgm`, (c) cột chuẩn hóa sinh sẵn là một **quyết định schema có hệ quả index thật** (B-tree trên collation nondeterministic không dùng được deduplication) và nó không được quyết, không được hoãn, không được ghi là câu hỏi mở.

**Đường ghi media.** AD-12 chỉ nói đường **đọc** ("core issues time-limited access... refuses when the caller's node fails the tier"). Đường **ghi** không có ai chốt: trình duyệt PUT thẳng lên R2 bằng presigned URL do core cấp, hay upload qua Next.js rồi server đẩy lên? Hai đường khác nhau về băng thông VPS, về giới hạn body size, và về việc AD-1 có bị vi phạm hay không. FR-47 là FR Đợt 1 và đây là quyết định đầu tiên phải làm khi code nó.

**Hai chỗ nhỏ hơn nhưng cũng thật:** (i) *"người còn sống"* được xác định thế nào — AD-13 treo toàn bộ trên khái niệm này, mà dữ liệu gia phả đầy người không rõ năm mất; `addendum` §B chỉ đích danh webtrees vì *"mô hình riêng tư per-person (living/dead) trưởng thành nhất"*, nhưng spine không mượn gì từ đó. (ii) `.memlog.md` chốt "trùng lặp **không** chặn ở thời điểm ghi, detector quét sau" — một quyết định thật, và spine đánh rơi nó; người xây sau hoàn toàn có thể thêm unique constraint trên (tên, năm sinh) và làm hỏng luồng FR-11.

### Findings

- **critical** Structural Seed không có quan hệ hôn nhân / gia đình, khiến AD-13 không tính được và FR-11/§11 không xây được — ERD chỉ có `PARENT_CHILD`; AD-13 nói riêng tư *"derived from relationship distance between viewer node and subject node"* nhưng không định nghĩa tập cạnh dùng để đo. Với tập cạnh huyết thống, con dâu — nhóm PRD §2 gọi là "dâu rể mới", một trong bốn nhóm người dùng — có khoảng cách vô hạn tới cả họ và sẽ bị chính engine riêng tư đẩy ra ngoài. *Fix:* thêm một AD chốt mô hình hôn nhân (khuyến nghị: bảng `union` với `union_member` mang `role` và cờ "thuộc họ khác", đúng hình GEDCOM 7/Gramps để không phải migrate khi làm FR-40), và thêm một AD định nghĩa **tập cạnh đo khoảng cách của AD-13** gồm cả cạnh hôn nhân, kèm quy tắc đếm bậc cho quan hệ dâu/rể.
- **high** Không AD nào cấm adapter truyền danh tính vào core, nên lint rule của AD-1 xanh mà AD-7/AD-13 vẫn bị vượt — *Fix:* thêm AD: "core tự đọc session để suy ra account → node → clan → role; chữ ký công khai của core không nhận `clanId`, `viewerNodeId`, `role` làm tham số. Vi phạm bắt được bằng test biên hoặc bằng quy ước kiểu (một `RequestContext` chỉ core dựng được)."
- **high** Chiến lược tìm kiếm tên tiếng Việt không dấu không được quyết ở tầng spine dù FR-11 cần nó ở Đợt 1 — *Fix:* chốt một trong ba (ICU nondeterministic collation / `unaccent` + `pg_trgm` / cột chuẩn hóa `name_normalized` sinh sẵn) thành một dòng trong Consistency Conventions, và sửa câu "No PostgreSQL extension is required" thành phát biểu có điều kiện.
- **medium** Đường ghi media không được chốt trong khi FR-47 là Đợt 1 — *Fix:* mở rộng AD-12 thành cả hai chiều: core cấp presigned URL có thời hạn cho cả PUT lẫn GET, `app/` không bao giờ giữ credential storage; nêu giới hạn kích thước và định dạng chấp nhận.
- **medium** Định nghĩa "người còn sống" và chính sách không-chặn-trùng-lúc-ghi bị bỏ rơi khỏi spine dù `.memlog.md` đã chốt cái thứ hai — *Fix:* một dòng trong Conventions cho mỗi cái; cái thứ hai nên nói rõ "không có unique constraint nào trên thuộc tính người".

---

## 2. Rule của mỗi AD có thực thi được không — **thin**

Chia 14 AD làm ba nhóm:

**Ép được bằng máy, và spine nói ra cách ép:** chỉ AD-1 (*"Enforced by lint rule, not convention"*). Đúng một cái.

**Ép được bằng máy nhưng spine không nói:** AD-5 nửa đầu (không cột generation/branch — kiểm được bằng một test đọc `information_schema`), AD-6 (UUIDv7 làm PK — PostgreSQL 18 có `uuidv7()` **built-in**, xác minh xong, nên `DEFAULT uuidv7()` là ép được thật), AD-9 (`DEFAULT 'tentative'` + CHECK trên chuyển trạng thái), AD-11 (không cột `bytea`/large object trong `db/`), AD-14 (grep chuỗi "Nguyễn Quang" trong `core/` và `db/`).

**Chỉ là lời khuyên, dù được viết bằng giọng mệnh lệnh:** AD-3, AD-4, AD-10, AD-12, AD-13, và nửa sau AD-5. Câu *"A write path that can succeed without producing a revision record is a defect"* (AD-10) mô tả một khuyết tật; nó không tạo ra bất kỳ lực nào ngăn khuyết tật đó xảy ra. Với AD-10 điều này đặc biệt đắt, vì nó áp cho **mọi** thao tác ghi sẽ viết trong nhiều năm tới, do một người, không có reviewer thứ hai. Dạng ép được của nó tồn tại và rẻ: **trigger `AFTER INSERT/UPDATE/DELETE` trên mọi bảng miền, ghi revision, và raise nếu thiếu biến session `app.actor`** — lúc đó quên là không thể, chứ không phải là "defect".

AD-7 là trường hợp riêng và nặng nhất, tách ra dưới đây.

Ngoài ra, **nửa sau AD-5 vừa không ép được vừa đá vào AD-2**: *"Caches, materialized paths, and denormalized copies are forbidden"*. Nhưng chính AD-2 dựng `person` để giữ "currently accepted values" — `.memlog.md` gọi thẳng nó là *"a projection"*, tức đúng nghĩa một bản sao phi chuẩn hóa của assertion đang thắng. Đọc chữ, hai AD chửi nhau. Đọc ý, AD-5 chỉ định cấm **giá trị dẫn xuất từ hình dạng cây** — và nó nên viết đúng như thế. Ở dạng hiện tại nó cũng cấm luôn memoize trong một request và cấm cache HTTP, hai thứ FR-15 ("chạy mượt trên điện thoại", 4G ở quê) rất có thể cần.

### Findings

- **critical** AD-7 tuyên bố ép ở tầng database nhưng rule của nó thiếu đúng những chi tiết quyết định RLS có chạy hay không — PostgreSQL: (i) **chủ sở hữu bảng bỏ qua RLS** trừ khi có `ALTER TABLE ... FORCE ROW LEVEL SECURITY`; (ii) vai có `BYPASSRLS` (mặc định `postgres` là superuser) bỏ qua luôn; (iii) `ENABLE ROW LEVEL SECURITY` mà không có policy nghĩa là **deny-all**, còn quên `ENABLE` nghĩa là **allow-all** — im lặng, không lỗi; (iv) `current_setting('app.clan_id')` khi chưa `SET LOCAL` sẽ **ném lỗi**, còn `current_setting('app.clan_id', true)` trả `NULL` khiến policy `clan_id = ...` âm thầm thành `false` (hoặc thành `true` nếu viết nhầm dạng `IS NOT DISTINCT FROM`). Ở cấu hình mặc định của một Docker Compose đơn giản, Drizzle migrate và runtime dùng **cùng một vai chủ sở hữu** — nghĩa là toàn bộ RLS không chạy và không có gì báo. Spine không nhắc chữ nào tới bốn điểm đó. *Fix:* viết lại rule của AD-7 thành bốn ràng buộc kiểm được: (a) migration chạy bằng vai `owner`, runtime chạy bằng vai `app` riêng, không superuser, không `BYPASSRLS`; (b) mọi bảng miền `ENABLE` **và** `FORCE ROW LEVEL SECURITY`; (c) mỗi request mở transaction và `SET LOCAL app.clan_id` trước truy vấn đầu tiên, policy dùng `current_setting('app.clan_id')` **không** cờ `missing_ok` để thiếu biến là lỗi ầm ĩ chứ không im lặng; (d) một test CI liệt kê mọi bảng trong `db/` và fail nếu bảng nào thiếu policy — đây mới là thứ khiến "bảng thứ 40 viết vào tháng thứ 18" không lọt lưới.
- **high** AD-10 là AD dễ mục nhất và đang ở dạng lời khuyên — *Fix:* chuyển sang trigger cấp database ghi revision, cộng `SET LOCAL app.actor` bắt buộc; câu rule đổi từ "là một defect" sang "là không thể".
- **high** AD-3 không đòi hỏi bất cứ thứ gì chứng minh un-merge chạy được — rule nói merge phải ghi lại mọi tham chiếu đã trỏ lại, nhưng không có ràng buộc nào nói **thao tác nghịch phải tồn tại và phải được kiểm**. FR-48 hứa với người dùng "gộp nhầm thì tách lại được"; đó là lời hứa duy nhất trong PRD mà nếu sai thì mất dữ liệu vĩnh viễn. *Fix:* thêm vào rule: "merge phát sinh một payload nghịch đủ để dựng lại trạng thái trước; CI chứa một test merge → un-merge → snapshot bằng đúng snapshot ban đầu. Không có test đó thì AD-3 chưa thành lập."
- **medium** AD-4 (`DELETE` bị cấm) ở dạng lời khuyên trong khi dạng ép được rất rẻ — *Fix:* `REVOKE DELETE ON assertion, person FROM app_role` cộng trigger chặn; nêu thẳng trong rule.
- **medium** Nửa sau AD-5 vừa quá rộng vừa đá vào AD-2 — *Fix:* thu hẹp thành "không lưu giá trị nào dẫn xuất từ hình dạng cây (số đời, mã chi, ancestry path, độ sâu)"; nói rõ `person` giữ giá trị được chấp nhận là **cố ý** và không thuộc phạm vi cấm; cho phép memoize trong phạm vi một request.

---

## 3. Có mục Deferred nào để đó mà hai đơn vị bên dưới vẫn xây lệch nhau — **thin**

Hoãn đúng chỗ, không có gì phải bàn: **Apache AGE** (lý do có số liệu, có ngưỡng revisit), **pgvector / pg_search / ParadeDB** (chỉ phục vụ F7 ngoài Đợt 1, thêm sau là cài extension chứ không phải migrate — đúng), **speech-to-text** (FR-8 ngoài Đợt 1, và câu "provider choice carries a privacy decision" là lý do hoãn đúng đắn nhất trong bảng), **multi-clan onboarding**, **full role-management UI** (PRD đã xếp FR-36 về sau).

Hoãn sai chỗ:

**"Deployment specifics — Host, domain, TLS, CI, and backup destinations are settled at deploy time."** Dòng này gộp năm thứ có độ nặng rất khác nhau và hoãn cả năm bằng một câu. Trong đó:

- **backup destinations** không hoãn được, vì NFR số một của PRD nói *"bản sao ở ≥ 2 nơi"* và *"diễn tập khôi phục thật ít nhất 1 lần/năm — backup chưa từng restore là backup không tồn tại"*. Đây không phải chi tiết triển khai, đây là một invariant có ngưỡng số, về đúng loại dữ liệu mà PRD gọi là **không tái tạo được**. Và nó tự mâu thuẫn: ngay trên bảng Deferred, spine viết *"The second location is not optional — it is what makes the durability NFR true rather than aspirational."* Một dòng văn xuôi không phải một AD; và cái đang là AD thì lại nói ngược.
- **CI** không hoãn được, vì CI là **cơ chế thi hành duy nhất mà spine tự nêu tên**. AD-1 nói "Enforced by lint rule, not convention"; lint rule không tự chạy. Hoãn CI là hoãn cái làm cho AD-1 khác một lời khuyên. Đây là mâu thuẫn vòng: AD mạnh nhất về thi hành phụ thuộc vào thứ đang nằm trong Deferred.
- Host / domain / TLS: hoãn được thật, không phản đối.

**"Metrics collection — Measured by hand at this scale."** Lý do đúng cho **chỉ số sản phẩm** (M1–M6 của PRD §9 đúng là đếm tay được). Nhưng dòng này chiếm mất chỗ của một chiều khác và làm người đọc tưởng chiều đó đã được xử lý: **khả năng quan sát vận hành** — log ứng dụng, theo dõi lỗi, biết được site đang chết. Với NFR "một người vận hành được" trong nhiều năm, "biết khi nó hỏng" là một quyết định thật; chọn "không có gì, tôi biết khi có người trong họ gọi điện" cũng là một quyết định hợp lệ ở quy mô này — nhưng phải **viết ra**.

Thiếu hẳn khỏi bảng Deferred (xem thêm §6): kênh email đi ra, GEDCOM 7, thư viện vẽ cây cho FR-15.

### Findings

- **critical** Sao lưu / khôi phục — NFR đứng đầu PRD — bị hoãn trong Deferred và không có AD nào, đồng thời mâu thuẫn với chính văn xuôi của spine — *Fix:* gỡ "backup destinations" khỏi Deferred và nâng thành một AD với ngưỡng số copy thẳng từ PRD: pg_dump hằng ngày, giữ ≥ 90 ngày, ≥ 2 nơi độc lập nhà cung cấp, phục hồi được cả DB lẫn object storage, và **một lần diễn tập khôi phục mỗi năm có ghi ngày**. Rule ép được: script restore nằm trong repo và chạy được bằng một lệnh trên máy trắng (điều này cũng chính là NFR "tiếp quản trong 1 ngày").
- **high** Sơ đồ ghi nhãn `R2 -.->|"provider redundancy"| B` như thể đó là bản sao thứ hai — dự phòng nội bộ của nhà cung cấp không bảo vệ trước xóa nhầm, ghi đè, hay mất khóa tài khoản; nó không phải backup và không thỏa "≥ 2 nơi". *Fix:* bật object versioning + một bản sao định kỳ sang nhà cung cấp/khu vực khác; sửa nhãn sơ đồ cho khỏi tạo cảm giác an toàn giả.
- **high** CI nằm trong Deferred trong khi AD-1 dựa vào nó để không phải là quy ước — *Fix:* tách CI ra khỏi "deployment specifics" và đưa vào phần bắt buộc của Đợt 1, tối thiểu: lint (biên `app/` ↔ `core/`), typecheck, test RLS-policy-coverage, test merge/un-merge.
- **medium** Dòng "Metrics collection" hoãn chỉ số sản phẩm nhưng bị đọc thành đã xử lý cả quan sát vận hành — *Fix:* tách thành hai dòng, và dòng thứ hai phải mang một quyết định (dù là quyết định "không làm gì, chấp nhận biết muộn").

---

## 4. Công nghệ được nêu có được xác minh là hiện hành không — **mixed**

`.memlog.md` cho thấy đã có một agent đi kiểm phiên bản trên web ngày 10/08 — quy trình đúng, và kết quả phần lớn **đúng**. Tôi kiểm lại độc lập cùng ngày:

| Nêu trong spine | Kiểm lại 10/08/2026 | Kết luận |
|---|---|---|
| PostgreSQL 18.4 | 18.4, phát hành 14/05/2026 | ✅ hiện hành |
| Next.js 16.3.0 | 16.3.0, ~03/08/2026 | ✅ hiện hành |
| React 19.2.8 | 19.2.8, 21/07/2026 | ✅ hiện hành |
| Tailwind CSS 4.3.3 | 4.3.3, 16/07/2026 | ✅ hiện hành |
| Drizzle ORM 0.45.2 | 0.45.2 là dist-tag `latest`; 1.0 đã lên **RC** (rc.3/rc.4), không còn beta | ✅ bản chốt đúng; lý do trong memlog ("1.0.0-beta.22 in flight") đã cũ |
| TypeScript **5.x** | Bản ổn định hiện tại là **7.0.2**, 05/08/2026 (compiler Go-native); 6.0 ra 23/03/2026 | ❌ **trễ hai major** |
| Auth.js "current stable" | **Không tồn tại bản stable cho thứ dự án cần**: Auth.js v5 vẫn là `5.0.0-beta.32` (20/07/2026); `next-auth` stable là **4.24.15**, vốn không hợp App Router/Next 16. Thêm: v5 chưa liệt Next 16 trong peer range, cài phải `--legacy-peer-deps` | ❌ **ô này không xác minh được vì nó không nêu phiên bản nào** |
| Node.js | **vắng mặt hoàn toàn** — Next.js 16 yêu cầu ≥ 20.9; Active LTS hiện là Node 24 | ❌ thiếu |
| Docker Compose / Ubuntu | không có phiên bản | ⚠️ |

Hai điểm phái sinh đáng ghi nhận là **đúng**: PostgreSQL 18 có `uuidv7()` **built-in** (nên AD-6 + Conventions không cần extension — nhất quán), và tìm kiếm không dấu **làm được không cần extension** bằng ICU nondeterministic collation (nên câu "No PostgreSQL extension is required for Đợt 1" không sai — nó chỉ chưa nói ai sẽ gánh việc đó).

Vấn đề nặng nhất trong bảng này là **Auth.js**. FR-64 là FR Đợt 1, đòi ba đường vào (Google, Facebook, tài khoản riêng) **cộng** hệ quản lý người dùng riêng — tức là Credentials provider + session lưu DB, đúng vùng ma sát nhất của Auth.js v5 beta. Một ô ghi "current stable" trong một bảng mà mục đích duy nhất là ghim phiên bản, cho một thư viện mà bản stable duy nhất (v4) không dùng được với kiến trúc đã chọn, là ô rỗng đội lốt ô đã điền.

### Findings

- **high** Ô "Auth.js — current stable" không ghim gì và bản stable thật (next-auth 4.24.15) không hợp Next 16 App Router; bản dùng được (5.0.0-beta.32) là beta có xung đột peer-dep với Next 16 — trong khi FR-64 đứng trong Đợt 1 — *Fix:* ghim một dòng cụ thể và ghi nhận rủi ro: hoặc `next-auth@5.0.0-beta.32` (chấp nhận beta, ghi rõ `--legacy-peer-deps`), hoặc cân nhắc Better Auth (bảo trì Auth.js hiện hướng dự án mới sang đó, và Credentials + quản lý user riêng là điểm mạnh của nó — hợp FR-64 hơn). Đây là quyết định nên có một dòng lý do như AGE đã có.
- **medium** TypeScript ghi "5.x" trong khi bản ổn định là 7.0.2 — *Fix:* hoặc ghim `5.9.x` **và nói rõ đây là lựa chọn thủ cựu có chủ đích** (TS 7 là compiler viết lại bằng Go, mới một tuần tuổi — bám 5.x là hợp lý cho dự án một người, nhưng phải là quyết định chứ không phải sơ suất), hoặc cập nhật.
- **medium** Node.js không có trong bảng Stack — *Fix:* ghim Node 24 LTS (Next 16 tối thiểu 20.9); ghi cả tag image PostgreSQL và phiên bản Ubuntu của VPS, vì "khởi động lại bằng một lệnh" của NFR phụ thuộc vào chúng.

---

## 5. Có phủ hết 15 FR của Đợt 1 không — **mixed**

Bảng Capability → Architecture Map có **đủ 15 hàng**, không FR nào rơi khỏi bảng, và cột "Governed by" trỏ về AD thật chứ không phải trang trí. Bề mặt: đạt. Chiều sâu thì thủng ở bốn chỗ, và ba trong bốn nằm ở nhóm "Không làm hại ai" — nhóm rủi ro nhất của sản phẩm này.

**FR-49 chỉ được phủ một phần ba.** PRD đòi ba thứ: (a) mức tiếp cận do người kể chọn, (b) **quyền rút lại còn hiệu lực sau khi họ mất**, (c) **đường ẩn khẩn cho khẳng định bị báo cáo là xúc phạm**. AD-12 chỉ làm (a). (b) là một cơ chế có ràng buộc thời gian và ràng buộc người thừa kế quyền — ai được thực thi quyền rút lại của một người đã mất? (c) là một **đường ghi ưu tiên cao** phải làm nội dung biến mất khỏi mắt công chúng ngay, và nó va thẳng vào AD-4 (cấm xóa) và AD-10 (mọi thay đổi ghi log): "ẩn khẩn" phải là chuyển trạng thái hiển thị, không phải xóa — nhưng không AD nào nói thế, nên người xây có thể cài nó bằng `DELETE`.

**FR-55 thiếu kênh, và va vào AD-13.** "Được biết khi mình được thêm vào" đòi một kênh ra ngoài web. PRD §12 đã thừa nhận không có kênh đẩy (FR-60 hoãn) — nhưng **email giao dịch** thì vẫn cần, và không chỉ cho FR-55: FR-64 có "tài khoản riêng (tên đăng nhập + mật khẩu)", tức là phải có xác minh email và đặt lại mật khẩu. Spine không có một chữ nào về email đi ra: không nhà cung cấp, không AD, không dòng Deferred, không câu hỏi mở. Còn "được ẩn khỏi phần công khai mà vẫn giữ liên kết phả hệ" là một **công tắc do người dùng bật** — mà AD-13 tuyên bố *"No user-facing toggle governs it"*. Xem §7.

**FR-2 và FR-3 dùng chung một từ cho hai trục khác nhau.** FR-2 là **ba mức tin cậy** (`chắc chắn` / `theo lời kể` / `tồn nghi`) — thuộc tính của bằng chứng, hiện lên cây bằng màu. FR-3 là **hai tầng duyệt** (tồn nghi / chính thức) — thuộc tính của quy trình. Spine gọi cả hai là *"tier"*: AD-2 nói assertion mang *"confidence tier and status"*, còn AD-9 nói *"New assertions land at the tentative tier"*. Vì tiếng Việt của FR-2 mức thấp nhất **cũng tên là "tồn nghi"**, hai trục này gần như chắc chắn sẽ bị nhập làm một cột bởi người xây. Đó là một lỗi mô hình không sửa lại được rẻ về sau: một khẳng định "chắc chắn" nhưng **chưa duyệt** là trạng thái hoàn toàn hợp lệ và sẽ không biểu diễn được.

**FR-51 và tác nhân hệ thống.** ERD ghi `REVISION }o--|| ACCOUNT` — quan hệ bắt buộc. Nhưng FR-51 nạp khung dòng họ bằng import hàng loạt, và detector trùng lặp của FR-48 cũng ghi dữ liệu. Ai là `ACCOUNT` của những mutation đó? Không có khái niệm tác nhân hệ thống. Nhỏ, nhưng nó sẽ chặn ngay ở story đầu tiên.

Phủ tốt, không phải sửa: FR-63, FR-13, FR-1, FR-3 (phần cơ chế), FR-48 (phần merge), FR-39, FR-64 (phần tách tầng), FR-37 (phần nguyên tắc).

### Findings

- **high** FR-49 chỉ được AD-12 phủ mức tiếp cận; quyền rút lại sau khi mất và đường ẩn khẩn không có AD, và đường ẩn khẩn va vào AD-4/AD-10 — *Fix:* mở rộng AD-12 hoặc thêm AD: "trạng thái hiển thị của recording và của assertion là một trường trạng thái có thể chuyển tức thì; không đường nào ẩn nội dung bằng cách xóa; quyền rút lại gắn với người kể và với người thừa kế được chỉ định, không hết hiệu lực khi người kể mất."
- **high** FR-2 (ba mức tin cậy) và FR-3 (hai tầng duyệt) dùng chung từ "tier" và sẽ bị nhập thành một cột — *Fix:* đặt tên khác nhau ngay trong Conventions: `confidence` ∈ {certain, reported, doubtful} và `review_status` ∈ {tentative, official}; sửa câu chữ AD-2/AD-9 cho khớp, và nói rõ hai trục độc lập.
- **high** Không có quyết định nào về email giao dịch, trong khi FR-55 ("được biết") và FR-64 (tài khoản mật khẩu) đều cần — *Fix:* một dòng Stack + một dòng Deferred: chọn nhà cung cấp gửi email (hoặc chốt "chỉ thông báo trong ứng dụng ở Đợt 1, không email" — cũng là câu trả lời hợp lệ, miễn là viết ra và FR-64 phải chấp nhận hệ quả không có đặt lại mật khẩu qua email).
- **medium** Không có tác nhân hệ thống cho revision của FR-51/FR-48 dù ERD bắt buộc `ACCOUNT` — *Fix:* cho phép revision mang tác nhân dạng `system:seed` / `system:detector`, hoặc tạo account hệ thống; nêu trong Conventions.
- **low** Spine không nhắc GEDCOM 7 dù `addendum` §A.6 chốt nó là định dạng cho sao lưu phân tán (mục "trước ngày ra mắt") và FR-40 — im lặng ở đây là chấp nhận được về phạm vi, nhưng nó **định hình mô hình person/family** nên phải nằm trong Deferred có lý do, không phải vắng mặt. *Fix:* một dòng Deferred: "GEDCOM 7 export — ngoài Đợt 1; ràng buộc nó đặt lên spine là mô hình hôn nhân phải ánh xạ được sang FAM."

---

## 6. Mọi chiều tầng này sở hữu đã được quyết / hoãn / ghi là câu hỏi mở chưa — **weak**

Đây là chiều yếu nhất và là lý do chính spine chưa dùng để xây được. Chiếu vào đúng danh mục vận hành:

| Chiều | Trạng thái trong spine |
|---|---|
| Triển khai (host, cách deploy) | Hoãn, chấp nhận được |
| **Các môi trường (dev / staging / prod)** | **Im lặng** |
| Hạ tầng & nhà cung cấp | Quyết: VPS Ubuntu + Docker Compose, Cloudflare edge, R2 làm seed. Đủ |
| Vận hành (khởi động lại, cấu hình) | Một phần: Conventions có "env vars, no secret in repo", "no manual schema changes on the server". Không có "một lệnh khởi động lại" dù NFR đòi |
| **Sao lưu** | Hoãn sai chỗ + mâu thuẫn nội tại (xem §3) |
| **Khôi phục & diễn tập** | **Im lặng** — PRD đòi diễn tập ≥ 1 lần/năm, spine không có chữ nào |
| **Di trú schema** | Nửa quyết: "forward-only, checked into the repo, applied on deploy". Không nói **bằng công cụ nào** (`drizzle-kit generate` + `migrate` hay `drizzle-kit push` — hai thế giới khác nhau), không nói chuyện gì xảy ra khi một migration chết giữa chừng trên prod, không có đường lùi |
| **Quan sát hệ thống** | **Im lặng** (dòng Deferred chỉ nói chỉ số sản phẩm) |
| Bí mật / cấu hình | Quyết: env var, file ví dụ commit |

Bốn ô "im lặng" là bốn lỗi theo đúng định nghĩa của tiêu chí này. Ba trong bốn có hệ quả cụ thể:

- **Không có môi trường** nghĩa là không có nơi thử migration. Cộng với "forward-only" và "no manual schema changes on the server", một migration hỏng trên prod của một hệ chỉ có một prod là tình huống không có lối ra được viết ra trước.
- **Không chốt cơ chế migration** là một điểm phân kỳ thật ngay cả với một người: `drizzle-kit push` (đồng bộ schema, không lưu vết) và `generate` + `migrate` (file SQL có phiên bản, commit vào repo) mâu thuẫn trực tiếp với chính dòng Conventions "checked into the repo" — nhưng dòng đó không đủ rõ để loại `push`.
- **Không có quan sát** nghĩa là AD-10, AD-12, AD-7 có thể đang hỏng trong im lặng mà không ai biết — đúng loại hỏng mà RLS-không-chạy tạo ra.

Một điểm không thuộc chiều vận hành nhưng cũng là im lặng đáng ghi: **cấu trúc thư mục trong spine không khớp hợp đồng của UI Workshop Kit** đang có sẵn trong repo. `frontend-stack.template.md` quy định alias `@/*` → `src/*` và `shadcn/ui` copy vào `src/components/ui/`. Cây thư mục của spine chỉ có `app/ core/ db/ specs/ _bmad-output/` — không có `src/`, và cũng không nói `core/` được import bằng đường nào. Spine đúng ở chỗ `app/` phải ở gốc, nhưng dừng lại nửa chừng.

### Findings

- **high** Môi trường, cơ chế chạy migration, và đường xử lý migration hỏng đều im lặng, trong khi Conventions lại cấm sửa schema thủ công trên server — *Fix:* chốt `drizzle-kit generate` + `migrate` với file SQL commit vào repo (loại `push`), chốt có một môi trường dev dựng bằng cùng `docker compose` và một lệnh nạp dữ liệu ẩn danh hóa, và viết một câu về cái phải làm khi migration chết: "restore từ bản dump trước migration" — điều này lại đòi AD sao lưu ở §3.
- **high** Quan sát hệ thống hoàn toàn im lặng — *Fix:* quyết dù là mức tối thiểu và viết ra: log ứng dụng có cấu trúc ra stdout + `docker compose logs` giữ N ngày, một dịch vụ uptime check miễn phí gọi một endpoint `/healthz` do core trả lời (kiểm cả DB), và một quy tắc "mọi thao tác core từ chối vì quyền đều ghi log ở mức warn" — chính là cách duy nhất phát hiện AD-7/AD-13 hỏng.
- **medium** NFR "khởi động lại bằng một lệnh" và "người khác tiếp quản trong 1 ngày" không có AD nào chống lưng — *Fix:* một AD hoặc một dòng Conventions: "toàn bộ hệ thống dựng lại được từ repo + một file env + các bản sao lưu, bằng một lệnh; bất kỳ bước thủ công nào chỉ Hiệp biết là một defect."
- **medium** Cấu trúc thư mục không khớp hợp đồng UI Workshop Kit đã có trong repo — *Fix:* bổ sung `src/` (components, lib) vào cây, ghi alias `@/*` → `src/*`, và nói rõ `core/` và `db/` được import bằng đường nào từ `app/` (khuyến nghị alias riêng như `@core/*`, vì như thế lint rule của AD-1 viết được bằng một dòng `no-restricted-imports`).

---

## 7. Mâu thuẫn nội tại giữa các AD — **thin**

Bốn mâu thuẫn thật, không phải khác biệt sắc thái:

**AD-2 ✕ AD-4 — giá trị thua có sống trong `assertion` hay không.** AD-2: *"`assertion` holds **every** claim about a person with its source, confidence tier, and status."* AD-4: *"the losing value is **removed from the live assertion set** and written to the revision log."* Không thể vừa giữ mọi khẳng định vừa gỡ khẳng định thua ra. Nặng hơn: `.memlog.md` chứa **cả hai** quyết định, ở hai thời điểm — dòng "losing value is discarded" trước, và về sau dòng *"losing values are kept, not discarded: the person row carries the accepted value, the assertion table keeps every competing claim with its source and confidence tier. Discarding the loser would hollow out FR-2's three-tier confidence system."* Memlog là append-only, nên bản sau đè bản trước — và spine đang mã hóa **bản đã bị đảo**. Hệ quả không nhỏ: FR-2 hiện ba mức tin cậy trên cây; nếu khẳng định thua bị gỡ khỏi `assertion` và chỉ còn trong revision log, thì "tồn nghi" mất phần lớn nội dung, và FR-6 (hồ sơ tranh chấp, đợt sau) sẽ phải đào lại từ log.

**AD-13 ✕ FR-55 ✕ AD-12 — "không có công tắc người dùng".** AD-13: *"No user-facing toggle governs it."* Nhưng FR-55 cho người sống quyền **được ẩn khỏi phần công khai**, và PRD §11 chốt mặc định "được ẩn, không được xóa"; đó đúng nghĩa là một công tắc do chủ thể bật. Và AD-12 ngay bên trên **cho phép** một công tắc người dùng khác: mức tiếp cận do người kể chọn. Câu tuyệt đối của AD-13 vừa sai với PRD vừa lệch với AD-12. Cái AD-13 thật sự muốn nói — và nói được — là: *bán kính quan hệ không cấu hình được; nó là sàn. Quyền ẩn của FR-55 chỉ **siết thêm**, không bao giờ nới ra.* Viết như thế thì AD mạnh hơn chứ không yếu đi.

**AD-1 ✕ Deferred "CI".** Cơ chế thi hành duy nhất spine tự nêu tên nằm trong danh sách hoãn. Đã nêu ở §3.

**Văn xuôi sơ đồ ✕ Deferred.** *"The second location is not optional"* ✕ *"backup destinations are settled at deploy time"*. Đã nêu ở §3.

Thêm hai chỗ chưa tới mức mâu thuẫn nhưng cần khép miệng: (i) AD-9 nói *"there is one write path"* và *"new assertions land at the tentative tier regardless of who wrote them"* — nhưng merge (AD-3), tombstone, gắn account vào node, và gán vai đều là ghi mà **không** đi qua tầng tồn nghi; AD-9 nên nói rõ nó chỉ chi phối assertion. (ii) AD-1 cấm `app/` import storage SDK, nhưng chưa có đường ghi media nào được vẽ ra (§1).

### Findings

- **high** AD-2 và AD-4 mâu thuẫn về việc giá trị thua có ở lại `assertion` không, và spine đang mã hóa quyết định đã bị chính memlog đảo lại về sau — *Fix:* chọn bản sau (giữ khẳng định thua trong `assertion` với `status = superseded`), sửa AD-4 thành "giá trị thua chuyển trạng thái, không rời bảng; `DELETE` bị cấm", và giữ nguyên yêu cầu ghi revision. Nếu Hiệp thật sự muốn bản trước thì phải sửa AD-2 bỏ chữ "every" và ghi nhận FR-2/FR-6 mất gì.
- **high** AD-13 tuyên bố không có công tắc người dùng, mâu thuẫn với FR-55 và với AD-12 — *Fix:* viết lại thành quan hệ sàn/trần: "bán kính quan hệ là mức hiển thị tối đa và không cấu hình được; các quyền của FR-55 và mức tiếp cận của FR-49 chỉ siết thêm. Không cơ chế nào nới rộng quá bán kính."
- **medium** AD-9 nói "một đường ghi" nhưng thực tế chỉ chi phối assertion — *Fix:* giới hạn phạm vi câu chữ, và liệt kê các mutation không thuộc mô hình tồn nghi (merge, tombstone, attachment, gán vai) để không ai đi tìm "tầng duyệt" cho chúng.

---

## Tổng hợp mức độ

| Mức | Số | Nội dung |
|---|---|---|
| **critical** | 3 | Rule của AD-7 không thực sự bật RLS · thiếu quan hệ hôn nhân trong Structural Seed (kéo theo AD-13 không tính được) · sao lưu/khôi phục không có AD và bị hoãn sai chỗ |
| **high** | 11 | Adapter truyền được danh tính vào core · tìm kiếm không dấu chưa quyết · AD-10 và AD-3 ở dạng lời khuyên · "provider redundancy" không phải bản sao thứ hai · CI bị hoãn nhưng AD-1 dựa vào nó · Auth.js không ghim và không có bản stable dùng được · FR-49 phủ một phần ba · "tier" của FR-2 và FR-3 trùng tên · thiếu quyết định email · môi trường + cơ chế migration im lặng · quan sát hệ thống im lặng · AD-2 ✕ AD-4 · AD-13 ✕ FR-55 |
| **medium** | 9 | Đường ghi media · "người còn sống" và chính sách trùng lặp · AD-4 chưa ép được · nửa sau AD-5 quá rộng và đá AD-2 · Deferred trộn chỉ số sản phẩm với quan sát vận hành · TypeScript 5.x · Node.js vắng mặt · tác nhân hệ thống cho revision · NFR "một lệnh" không có AD · cây thư mục lệch UI Workshop Kit · phạm vi AD-9 |
| **low** | 1 | GEDCOM 7 vắng khỏi Deferred |

## Ba việc nên làm trước khi spine này được dùng để sinh epics

1. **Sửa AD-7 thành bốn ràng buộc kiểm được và thêm test coverage policy vào CI.** Đây là việc rẻ nhất trong ba việc và ngăn cái hỏng đắt nhất.
2. **Thêm AD hôn nhân + AD định nghĩa tập cạnh của bán kính riêng tư.** Không có nó, FR-11, FR-15, FR-37 đều không có schema để bám.
3. **Nâng sao lưu/khôi phục thành AD có ngưỡng số, và kéo CI ra khỏi Deferred.** Hai thứ này biến những AD còn lại từ ý định thành ràng buộc.

Ngoài ba việc đó, phần lớn các finding còn lại là **sửa câu chữ**, không phải sửa kiến trúc — điều này nói lên rằng bộ xương bên dưới là đúng. Spine này gần hơn với "cần siết" so với "cần làm lại".
