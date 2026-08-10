---
title: 'Phản biện đối kháng — ARCHITECTURE-SPINE (Gia phả Nguyễn Quang, Đợt 1)'
type: adversarial-review
target: '../ARCHITECTURE-SPINE.md'
reference: '../../../prds/prd-gia-pha-nguyen-quang-2026-08-10/prd.md'
method: 'Dựng hai đơn vị tầng dưới cùng tuân thủ từng chữ mọi AD, rồi chỉ ra chúng không ghép được'
created: '2026-08-10'
status: draft
---

# Phản biện đối kháng — Architecture Spine

## Phán quyết

Spine giữ được **ranh giới** (AD-1, AD-7, AD-11) nhưng không giữ được **hình dạng dữ liệu**: nó tuyên bố `person` giữ giá trị được chấp nhận và `assertion` giữ mọi khẳng định, rồi không bao giờ nói ai ghi vào `person`, khẳng định có hình gì, và quan hệ cha–con có phải là khẳng định không — nên hai đội cùng tuân thủ tuyệt đối vẫn xây ra hai hệ thống không nói chuyện được với nhau. Có **4 lỗ hổng mức Chặn** phải bịt trước khi viết dòng code đầu tiên.

## Cách đọc

| Mức | Nghĩa |
|---|---|
| **Chặn** | Hai đơn vị hợp lệ sinh ra dữ liệu không hòa giải được, hoặc thủng một NFR không sửa được bằng bản vá. Phải bịt trước khi code. |
| **Nặng** | Sinh ra bất nhất quan sát được hoặc mất dữ liệu, sửa được nhưng tốn migration. |
| **Vừa** | Hai đội chọn khác nhau, chi phí thống nhất còn thấp. |

## Bảng lỗ hổng

| # | Lỗ hổng | AD liên quan | Mức |
|---|---|---|---|
| G-01 | Cạnh cha–con nằm ngoài hệ khẳng định | AD-2, Structural Seed, AD-9 | **Chặn** |
| G-02 | `person` không có chủ ghi — bảng chiếu vô chủ | AD-2, AD-9, AD-10 | **Chặn** |
| G-03 | RLS không áp cho chủ sở hữu bảng; không có đường bắt buộc đặt biến phiên ngoài request | AD-7, AD-1 | **Chặn** |
| G-04 | AD-13 chỉ nói về `person` — `assertion`/`revision`/`recording` là cửa hậu đọc dữ liệu người sống | AD-13, AD-10, AD-12 | **Chặn** |
| G-05 | Gộp người không có tầng, không có vai — AD-3 lách qua AD-9 | AD-3, AD-9 | Nặng |
| G-06 | Hai giá trị "chính thức" cùng lúc trên một trường | AD-9, AD-4, AD-2 | Nặng |
| G-07 | Khẳng định không có hình dạng quy định | AD-2, FR-47, FR-1 | Nặng |
| G-08 | Trạng thái mồ côi quanh bia mộ | AD-3, AD-2, AD-8, AD-13 | Nặng |
| G-09 | Ba đường mutation — mấy giao dịch, thứ tự nào | AD-3, AD-4, AD-10, Quy ước giao dịch | Nặng |
| G-10 | AD-5 tính trên "tập cạnh" nào, và ai tính lại sau khi gộp | AD-5, AD-3 | Nặng |
| G-11 | Vòng đời object storage: không ai xóa, không ai quét rác | AD-11, AD-12, AD-4, FR-49 | Nặng |
| G-12 | Auth.js chạm DB ngoài `core/` | AD-1, AD-7, AD-10, AD-8 | Vừa |
| G-13 | "Đang sống" không được định nghĩa | AD-13 | Vừa |
| G-14 | "Bán kính tính chứ không cấu hình" đụng "không hard-code gì" | AD-13, AD-14 | Vừa |
| G-15 | Un-merge hết hiệu lực lúc nào — không AD nào nói | AD-3, AD-4 | Vừa |

---

## G-01 — Cạnh cha–con nằm ngoài hệ khẳng định `[Chặn]`

**Hai đơn vị.**

- **Đơn vị A — `core/person.addRelative()`** (dựng cho FR-11 tự khai 4 bước). Người dùng khai "tôi là con ông Nguyễn Quang Đ.". A tạo hàng `person` cho người khai và **chèn thẳng một hàng `PARENT_CHILD`**, rồi ghi một hàng `revision`.
- **Đơn vị B — `core/assertion.recordClaim()`** (dựng cho FR-1). Nhận cùng sự việc đó từ một lời kể và tạo `assertion{ subject: A, predicate: 'child_of', object: B, source: recording#7, tier: 'tồn nghi', status: 'tentative' }`.

**Mỗi bên tuân thủ ra sao.** A đọc AD-2 đúng từng chữ: `person` giữ danh tính, `assertion` giữ *khẳng định về một người* — một **cạnh** không phải khẳng định về một người, nó là quan hệ giữa hai người, và Structural Seed vẽ `PERSON ||--o{ PARENT_CHILD` như một thực thể **riêng**, không phải `ASSERTION`. AD-5 củng cố cho A: "tính từ **tập cạnh cha–con**" — vậy tập cạnh là thứ có thật, độc lập. AD-9 nói "khẳng định mới hạ cánh ở tầng tồn nghi" — cạnh không phải khẳng định nên A không phải gắn tầng cho nó. B đọc AD-2 cũng đúng từng chữ: "`assertion` giữ **mọi** khẳng định về một người, kèm nguồn, mức tin cậy, trạng thái" — *"A là con của B"* là ví dụ **duy nhất** PRD §4 đưa ra cho từ "Khẳng định". Không AD nào cấm B.

**Chỗ lệch.** Cùng một sự thật phả hệ tồn tại ở hai nơi có ngữ nghĩa khác nhau và không ai đồng bộ. Cụ thể:

- Cây (AD-5, FR-15, FR-13) vẽ từ `PARENT_CHILD` → **không thấy** quan hệ do B ghi. Duyệt một khẳng định huyết thống lên chính thức xong, cây vẫn không đổi. FR-3 vô nghĩa cho loại dữ liệu quan trọng nhất.
- Màu tin cậy (FR-2) đọc từ `assertion` → cạnh do A tạo **không có màu**, không có nguồn, không có tầng. FR-1 nói "**mọi** khẳng định mang theo nguồn"; cạnh cha–con — mệnh đề trung tâm của cả sản phẩm — là thứ duy nhất không mang nguồn.
- Không có đường rút lại một quan hệ sai: cạnh của A không có `status` nên không "hạ tầng" được; xóa nó là `DELETE` trên một giá trị từng được chấp nhận → đụng AD-4.

**Hậu quả quan sát được.** Hiệp duyệt "cụ X là con cụ Y" trong màn hình duyệt; cây vẫn hiển thị hai mảnh rời. Ngược lại, một thành viên tự khai sai cha mình; cạnh đó là màu "chắc chắn" theo mặc định (vì không có tầng) và không ai gỡ được nếu không xóa cứng.

**Bịt bằng — AD-15 (mới).**

> **AD-15 — Quan hệ phả hệ là một khẳng định, không phải một cạnh trần.**
> Mọi cạnh cha–con tồn tại **duy nhất** dưới dạng `assertion` với vị từ quan hệ, mang nguồn, tầng tin cậy và trạng thái như mọi khẳng định khác (AD-2, AD-9, AD-10, AD-4 áp dụng nguyên vẹn). Bảng `parent_child` — nếu tồn tại — là **bảng chiếu chỉ-đọc** sinh ra từ tập khẳng định quan hệ đang ở trạng thái hiển thị, do `core/assertion` ghi trong cùng giao dịch (xem AD-16). Không module nào được `INSERT`/`UPDATE`/`DELETE` trực tiếp lên nó. Một quan hệ không có nguồn là một defect, không phải một mặc định.

Kèm sửa Structural Seed: đổi `PERSON ||--o{ PARENT_CHILD` thành `ASSERTION` mang vị từ quan hệ, và ghi rõ `parent_child` là projection.

---

## G-02 — `person` không có chủ ghi: bảng chiếu vô chủ `[Chặn]`

**Hai đơn vị.**

- **Đơn vị A — `core/assertion.promoteAssertion(id)`**. Theo AD-9 đúng từng chữ: "thăng hạng là **một chuyển trạng thái trên chính hàng đó**". A `UPDATE assertion SET status='official'`, ghi `revision` (AD-10), commit. A **không đụng vào `person`** — không AD nào bảo A phải đụng.
- **Đơn vị B — `core/person.readPerson(id)`**. Theo AD-2 đúng từng chữ: "Đọc thì lấy giá trị được chấp nhận **từ `person`**". B `SELECT birth_year, given_name FROM person`.

**Mỗi bên tuân thủ ra sao.** Cả hai trích dẫn được AD của mình nguyên văn. AD-2 nói `person` **giữ** giá trị được chấp nhận — thể bị động, không có chủ ngữ. AD-9 nói thăng hạng là chuyển trạng thái **trên assertion** — cũng không nói gì về `person`.

**Chỗ lệch.** Không ai ghi `person`. Hiệp duyệt "cụ sinh 1923"; assertion thành `official`; `person.birth_year` vẫn `NULL`. Cây hiện "không rõ năm sinh" ngay sau khi vừa duyệt xong.

**Biến thể còn tệ hơn — hai chủ ghi.** Đội A' đọc `person` là bảng chiếu và ghi nó bên trong `promoteAssertion`. Đội B' dựng FR-55 ("người bị khai **được sửa** thông tin về chính mình") thành `core/person.updateSelf()` ghi thẳng vào `person`. Cả hai hợp lệ: AD-2 không nói `person` là dẫn xuất, AD-9 chỉ ràng buộc *khẳng định* chứ không ràng buộc *mọi ghi lên person*. Kết quả:

- Người tự sửa tên mình → giá trị mới không có `assertion`, không có nguồn (thủng FR-1), không có tầng (thủng FR-2).
- Lần chiếu tiếp theo của A' **ghi đè** giá trị người đó vừa tự sửa, không cảnh báo. Người sống thấy tên mình bị đổi lại — đúng loại tổn thương PRD §11 dựng ra để tránh.
- Nhật ký sửa (FR-39) có hai loại hàng khác cấu trúc cho cùng một sự kiện; dựng lại cây tại một thời điểm cho ra hai kết quả tùy chọn nguồn nào.

**Bịt bằng — AD-16 (mới) + siết AD-2.**

> **AD-16 — `person` là bảng chiếu; `core/assertion` là chủ ghi duy nhất.**
> Các cột giá trị của `person` được sinh ra hoàn toàn từ tập khẳng định đang ở trạng thái được chấp nhận, bằng một hàm chiếu duy nhất `projectAcceptedValues(personId)` chạy **trong cùng giao dịch** với mọi thay đổi trạng thái/nội dung khẳng định của người đó. Không module nào ngoài `core/assertion` được `UPDATE` cột giá trị của `person`; điều này được cưỡng chế ở tầng CSDL (thu hồi quyền `UPDATE` trên các cột đó với vai ứng dụng, hoặc trigger chặn), không phải bằng quy ước. Mọi sửa đổi do người dùng khởi xướng — kể cả FR-55 tự sửa — **tạo một khẳng định mới** và đi qua đúng con đường đó. Một đường ghi giá trị người không sinh ra khẳng định là defect.

Siết AD-2, đổi câu "`person` holds the currently accepted values" thành: "`person` **chiếu** giá trị được chấp nhận, do `core/assertion` ghi (AD-16); `person` sở hữu **duy nhất** khóa định danh bền và cờ vòng đời (bia mộ)."

---

## G-03 — RLS không áp cho chủ sở hữu bảng; không có đường bắt buộc đặt biến phiên ngoài request `[Chặn]`

**Hai đơn vị.**

- **Đơn vị A — `db/policies.sql`** do người dựng schema viết. Tạo `ALTER TABLE person ENABLE ROW LEVEL SECURITY; CREATE POLICY clan_isolation ON person USING (clan_id = current_setting('app.clan_id', true)::uuid);`. Đúng AD-7 từng chữ.
- **Đơn vị B — `core/db/withClanTx()`** do người dựng lõi viết. Mở giao dịch, `SET LOCAL app.clan_id = ...`, chạy công việc. Vì AD-7 nói lọc ở tầng ứng dụng "là phòng thủ chiều sâu, **không bao giờ là cơ chế chính**", B **bỏ mọi `WHERE clan_id = ?`** khỏi truy vấn cho gọn.

**Chỗ lệch #1 — kỹ thuật, im lặng và toàn phần.** PostgreSQL **không áp RLS cho chủ sở hữu bảng** trừ khi bật `FORCE ROW LEVEL SECURITY`. Với Docker Compose mặc định, migration của Drizzle chạy bằng vai `postgres` và ứng dụng **cũng kết nối bằng chính vai đó** — chủ sở hữu. Chính sách của A tồn tại, hiển thị trong `\d+`, và **hoàn toàn trơ**. Truy vấn của B đã bỏ `WHERE`. Không test nào bắt được vì Đợt 1 chỉ có một dòng họ: rò rỉ chỉ xuất hiện vào ngày có dòng họ thứ hai — đúng ngày mà PRD §6 gọi là "loại lỗi không bản vá nào chữa được lòng tin đã mất".

**Chỗ lệch #2 — đường hợp lệ mà biến phiên không được đặt.** AD-1 nói mọi truy cập dữ liệu qua lõi, AD-7 nói biến phiên do lõi đặt "khi mở giao dịch của **request**". Nhưng có ít nhất bốn đường chạy **ngoài request**, mỗi đường một đội khác nhau dựng, không đường nào bị AD nào phủ:

| Đường | Ai dựng | Biến phiên đặt bởi ai |
|---|---|---|
| Migration khi deploy (Quy ước Migrations) | người dựng `db/` | không ai — và chạy bằng owner nên RLS trơ |
| Nạp khung FR-51 (script một lần) | người dựng seeding | không ai; hoặc đặt bừa một clan mặc định = hard-code, thủng AD-14 |
| `pg_dump` hằng ngày (NFR độ bền) | người vận hành | không ai; bản dump chứa mọi dòng họ |
| Tác vụ nền tương lai (quét rác media G-11, tính lại sau gộp G-10) | bất kỳ ai | không ai |

Với chính sách viết dạng `current_setting('app.clan_id', **true**)` (không lỗi khi thiếu), giá trị thiếu cho ra `NULL` → `clan_id = NULL` là `NULL` → **không hàng nào** trả về. Nghe có vẻ fail-closed, nhưng tác vụ nền chạy im lặng không làm gì, không báo lỗi, và không ai biết quét rác đã ngừng chạy sáu tháng. Nếu đội khác viết `current_setting('app.clan_id')` (không cờ) thì lỗi runtime — hành vi khác hẳn cho cùng một AD.

**Bịt bằng — AD-17 (mới) + siết AD-7.**

> **AD-17 — Vai CSDL của ứng dụng không sở hữu bảng nào, và không có phiên nào chạy không có bối cảnh dòng họ.**
> Migration chạy bằng vai chủ sở hữu; ứng dụng và mọi tác vụ nền chạy bằng một vai **không sở hữu** riêng. Mọi bảng bật `FORCE ROW LEVEL SECURITY`. Chính sách viết ở dạng **fail-loud**: thiếu biến phiên thì truy vấn báo lỗi, không phải trả về rỗng. Tác vụ chạy ngoài request (nạp khung, quét rác, tính lại, xuất dữ liệu) mở phiên qua **cùng một** `withClanTx(clanId)` và lặp tường minh trên danh sách dòng họ; không có chế độ "chạy toàn cục". Một đường ghi/đọc dữ liệu không đi qua hàm đó là defect. Bản `pg_dump` là dữ liệu đa dòng họ và chịu cùng quy tắc lưu trữ như media nhạy cảm.

Siết AD-7: bỏ chữ "của request", thay bằng "khi mở **bất kỳ** giao dịch nào, kể cả ngoài request"; và thêm câu "RLS không được coi là đang hoạt động cho tới khi có test khẳng định một truy vấn của vai ứng dụng **không** thấy hàng của dòng họ khác — test đó chạy trong CI với hai dòng họ giả".

---

## G-04 — AD-13 chỉ nói về `person`; `assertion`, `revision`, `recording` là cửa hậu `[Chặn]`

**Hai đơn vị.**

- **Đơn vị A — `core/person.readPerson()`**. Áp AD-13 nghiêm: người sống ngoài bán kính 3 bậc chỉ trả tên + vị trí, ẩn ngày sinh đầy đủ, ẩn địa chỉ và điện thoại.
- **Đơn vị B — `core/assertion.listAssertionsFor(personId)`**, dựng cho FR-1/FR-2 (màn hình "thông tin này từ đâu ra"). Trả về mọi khẳng định kèm nguồn, giá trị, tầng. Đúng AD-2: "provenance đến từ `assertion`".
- **Đơn vị B' — `core/audit.reconstructAt(date)`**, dựng cho FR-39 ("xem lại cây tại một thời điểm bất kỳ"). Phát lại `revision.old_value`/`new_value`.

**Mỗi bên tuân thủ ra sao.** AD-13 nói nguyên văn: "**visibility of a living person's detail**" được suy ra từ khoảng cách quan hệ. Câu đó nằm trong ngữ cảnh `person`, và AD-2 phân công rõ: đọc giá trị thì từ `person`, đọc provenance thì từ `assertion`. B và B' không đọc `person`, nên B và B' không tự coi mình bị AD-13 ràng buộc. Không AD nào nói `assertion` hay `revision` chịu bán kính riêng tư. Bảng Capability→Architecture còn xác nhận: FR-37 "Lives in `core/identity`" — không nhắc `core/assertion` hay `core/audit`.

**Chỗ lệch.** Số điện thoại của một người sống bị A ẩn, nhưng:

- B trả nó ra trong danh sách khẳng định (`assertion{predicate:'phone', value:'09...', source:'tự khai'}`).
- B' trả nó ra trong bản dựng lại lịch sử — và tệ hơn: AD-4 **bắt buộc** giá trị thua phải nằm trong nhật ký, nên nhật ký là kho lưu vĩnh viễn mọi thứ từng bị ẩn. Một người dùng FR-55 để "được ẩn" khỏi phần công khai vẫn còn nguyên trong `revision` — và đường đọc đó không kiểm tra gì.
- Cùng logic áp cho `recording`: AD-12 kiểm tra tầng tiếp cận **của bản ghi**, nhưng metadata FR-47 ("ai kể, nói về ai, ngày nào") và các khẳng định sinh ra từ một bản ghi **niêm phong** không được AD nào che. Một bản ghi niêm phong tới 2040 nhưng khẳng định "X là con ngoài giá thú của Y" sinh từ nó thì hiện ngay — nội dung nhạy cảm rò qua đường dẫn xuất trong khi cửa chính vẫn khóa.

**Bịt bằng — AD-18 (mới) + siết AD-13.**

> **AD-18 — Bán kính riêng tư là bộ lọc của lõi trên **mọi** đường đọc, không phải thuộc tính của một bảng.**
> Mọi kết quả đọc chứa chi tiết về một người — `person`, `assertion`, `revision`, `recording`, metadata media, kết quả tìm kiếm, dữ liệu xuất, bản in — đi qua cùng một hàm che `redactFor(viewerNode, payload)`. Đường đọc trả dữ liệu người mà không gọi hàm đó là defect. Bản dựng lại lịch sử (FR-39) áp bán kính **của thời điểm xem**, không phải của thời điểm ghi: nhật ký ghi đầy đủ (AD-4, AD-10) nhưng đọc thì bị che. Khẳng định sinh ra từ một bản ghi kế thừa tầng tiếp cận **nghiêm ngặt hơn** giữa tầng của chính nó và tầng của bản ghi nguồn.

Siết AD-13: đổi "visibility of a living person's detail" → "visibility of a living person's detail **on every read path in the system (AD-18)**", và thêm AD-13/AD-18 vào hàng FR-1, FR-2, FR-39, FR-47, FR-49 trong bảng Capability→Architecture.

---

## G-05 — Gộp người không có tầng, không có vai `[Nặng]`

**Hai đơn vị.**

- **Đơn vị A — `app/(tree)/merge-suggestion` (adapter)**. FR-48 nói "gợi ý chứ không tự gộp" — nghĩa là có một con người bấm xác nhận. PRD không nói **con người nào**. A cho mọi thành viên đã xác thực bấm, vì FR-3 nói người đã xác thực ghi được ngay không chờ duyệt.
- **Đơn vị B — `core/person.mergePersons(winner, loser)`**. Theo AD-3 đúng từng chữ: repoint mọi tham chiếu, dựng bia mộ, ghi lại toàn bộ repointing, một giao dịch. B **không kiểm tra vai** vì không AD nào bảo B kiểm.

**Chỗ lệch.** AD-9 dựng nguyên tắc "mọi thứ vào ở mức tồn nghi, thăng hạng cần vai có quyền duyệt" — nhưng nó chỉ nói về **khẳng định**. Gộp người **không phải** một khẳng định, nó là một mutation cấu trúc, và AD-3 tự nhận là **destructive**. Vậy hệ thống có đúng một thao tác phá hủy dữ liệu, và nó là thao tác **duy nhất** không có tầng, không có duyệt. Một thành viên mới đăng ký, đọc gợi ý sai, gộp nhầm hai cụ khác nhau trùng tên — hợp lệ theo mọi AD.

Ngược lại nếu đội B tự thêm kiểm tra vai còn đội A dựng UI cho mọi thành viên: UI hiện nút, bấm vào báo lỗi 403 — hai đội vẫn lệch, chỉ đổi từ mất dữ liệu sang UI hỏng.

**Bịt bằng — AD-19 (mới).**

> **AD-19 — Mutation cấu trúc chịu cùng hai tầng như khẳng định.**
> Gộp, tách lại, và mọi thao tác dựng/gỡ bia mộ là **thao tác cần quyền duyệt** — cùng vai với thăng hạng khẳng định (AD-9). Người không có quyền đó tạo được một **đề xuất gộp** ở tầng tồn nghi; đề xuất không thay đổi hình cây và có thể bị bác bỏ mà không để lại bia mộ. Lõi trả kết quả có kiểu "từ chối vì thiếu quyền" (Quy ước Errors) chứ không ném lỗi; adapter chỉ hiện nút khi lõi báo là được phép, qua cùng một hàm kiểm quyền — không có bản sao quy tắc trong `app/`.

---

## G-06 — Hai giá trị "chính thức" cùng lúc trên một trường `[Nặng]`

**Hai đơn vị.**

- **Đơn vị A — `app/(review)/queue`**: liệt kê khẳng định tồn nghi theo thứ tự thời gian, mỗi cái một nút "Duyệt". Hiệp duyệt "cụ sinh 1923" hôm thứ Ba.
- **Đơn vị B — cùng hàng đợi, một tuần sau**: một khẳng định khác, nguồn khác, "cụ sinh 1925". Hiệp duyệt nốt.

**Mỗi bên tuân thủ ra sao.** AD-9: thăng hạng là chuyển trạng thái trên hàng đó, do vai có quyền, có ghi log. Cả hai lần đều đúng. AD-4 chỉ áp **khi một người duyệt chọn giữa các giá trị xung đột** — ở đây người duyệt **không hề thấy xung đột**, anh ta duyệt hai mục ở hai thời điểm. AD-4 không bị kích hoạt.

**Chỗ lệch.** `person` (theo AD-16 ở G-02) giờ có hai khẳng định `official` cho cùng một trường và hàm chiếu không có quy tắc phân xử. Hai đội chọn hai cách: "lấy cái mới nhất" và "lấy cái tầng cao nhất, hòa thì lấy cái cũ nhất (ổn định)". Cây và bản in cho ra hai năm sinh khác nhau.

Ngoài ra, spine **chưa bao giờ nói khẳng định gắn vào một trường**. Không có "trường" thì không định nghĩa được thế nào là xung đột — xem G-07.

**Bịt bằng — AD-20 (mới).**

> **AD-20 — Trên mỗi (người, vị từ) có nhiều nhất một khẳng định ở trạng thái được chấp nhận.**
> Cưỡng chế bằng chỉ mục duy nhất từng phần ở tầng CSDL, không bằng quy ước. Thăng hạng một khẳng định **hạ bệ khẳng định đương nhiệm trong cùng giao dịch**, và việc hạ bệ đó là một sự kiện AD-4 đầy đủ: giá trị thua rời tập sống, vào nhật ký kèm nguồn và lý do `superseded`. Giao diện duyệt phải hiện khẳng định đương nhiệm cạnh cái đang xét; duyệt mà không nhìn thấy cái mình đang thay là đường dẫn tới bất nhất, không phải tiện lợi.

---

## G-07 — Khẳng định không có hình dạng quy định `[Nặng]`

**Hai đơn vị.**

- **Đơn vị A — `core/assertion` cho FR-11/FR-1**: `assertion { person_id, predicate: 'birth_date', value_json, precision, source_id, tier, status }` — vị từ có khóa, giá trị có kiểu.
- **Đơn vị B — `core/media` → assertion cho FR-47**. Structural Seed vẽ `RECORDING ||--o{ ASSERTION : "gave rise to"`. Cụ bà kể 6 phút lan man. Cháu "xác nhận vài cái nó chắc". B lưu `assertion { person_id, text: "Ông cố đi lính năm Mậu Thân, có hai bà, bà cả người làng Đông", source: recording#7, tier: 'theo lời kể', status: 'tentative' }` — **văn bản tự do**.

**Mỗi bên tuân thủ ra sao.** AD-2 nói `assertion` giữ "**mọi** khẳng định về một người kèm nguồn, tầng tin cậy và trạng thái". Cả hai hàng đều là khẳng định, đều có nguồn, tầng, trạng thái. Không AD nào nói khẳng định có vị từ, có kiểu giá trị, hay tương ứng một trường trên `person`.

**Chỗ lệch.** Hàm chiếu của AD-16 **không chiếu được** hàng của B — không biết đổ vào cột nào. Quy tắc duy nhất của AD-20 không áp được — không có `predicate` để làm khóa. AD-4 không áp được — không xác định được cái gì xung đột với cái gì. Màu tin cậy FR-2 trên cây không gắn được vào trường nào. Đội A và đội B đều tin mình đúng và cả hai cùng ghi vào một bảng.

**Bịt bằng — AD-21 (mới).**

> **AD-21 — Một khẳng định là một mệnh đề có vị từ; văn bản chưa bóc tách là một thực thể khác.**
> Mọi hàng `assertion` mang một `predicate` lấy từ một từ vựng **là dữ liệu, không phải hằng số trong mã** (AD-14), và một giá trị đúng kiểu của vị từ đó, kèm dấu độ chính xác cho giá trị ngày (Quy ước Uncertain dates). Lời kể chưa bóc tách **không phải** khẳng định: nó là `recording` cộng ghi chú, và trở thành khẳng định chỉ khi một con người chọn ra một mệnh đề có vị từ. FR-8 (bóc tách) sau này sinh ra khẳng định qua đúng cửa đó, ở tầng tồn nghi như mọi thứ khác (AD-9). Một hàng `assertion` không có vị từ trong từ vựng là defect.

---

## G-08 — Trạng thái mồ côi quanh bia mộ `[Nặng]`

**Hai đơn vị.**

- **Đơn vị A — `core/person.mergePersons`**: "repoint **mọi tham chiếu** tới người thắng". A repoint những gì A biết: `parent_child`, `assertion`, `recording`.
- **Đơn vị B — `core/identity.resolveViewerNode(accountId)`**: đọc `account_attachment` để biết người xem là node nào, rồi tính bán kính (AD-13). B **không biết** về bia mộ — AD-8 không nhắc, AD-13 không nhắc.

**Chỗ lệch.** Ba tình huống, không AD nào nói:

1. **Tài khoản gắn vào người thua.** Nếu A có repoint `account_attachment` thì B ổn; nếu A quên (AD-3 nói "mọi tham chiếu" nhưng không liệt kê bảng nào) thì B giải ra một node là bia mộ. Bia mộ không có cạnh (đã repoint hết) → khoảng cách quan hệ tới mọi người là vô cực → **AD-13 mặc định nhánh hạn chế nhất** → người dùng đang là thành viên bỗng chỉ còn thấy dữ liệu công khai, không thông báo, không lý do. Hoặc B tự ý đi theo redirect và người dùng **kế thừa bán kính của người thắng** — có thể rộng hơn quyền anh ta đáng có.
2. **Hai tài khoản gắn vào hai người bị gộp.** Sau gộp: hai tài khoản cùng gắn một node. AD-8 nói "gắn vào node là hành vi riêng, có bảo lãnh" — không cấm hai tài khoản một node. FR-55 "được sửa thông tin **về chính mình**" giờ có hai chủ thể. Không AD nào phân xử.
3. **Bia mộ và AD-5.** Bia mộ vẫn là hàng `person`. Đội dựng cây duyệt tập cạnh; nếu một cạnh sót lại trỏ vào bia mộ thì cây có node ma. AD-5 không nói tập cạnh loại bia mộ.
4. **Bia mộ và AD-7.** Bia mộ mang `clan_id` nào sau khi gộp hai người khác dòng họ (kịch bản đa dòng họ tương lai)? Không nói.

**Bịt bằng — AD-22 (mới).**

> **AD-22 — Bia mộ là chuyển hướng ở tầng lõi, không phải một node.**
> `core/person` phơi ra một hàm giải chuyển hướng duy nhất `resolveIdentity(personId)`; **mọi** đọc/ghi trong `core/` đi qua nó, nên không đơn vị nào nhìn thấy một bia mộ như một người. Bia mộ không xuất hiện trong tập cạnh của AD-5, không được gắn tài khoản, không nhận khẳng định mới. Danh sách bảng phải repoint khi gộp là **do CSDL sinh ra** (duyệt khóa ngoại trỏ tới `person`), không phải danh sách viết tay trong `mergePersons` — một bảng mới thêm sau này mà quên repoint là lỗi lặng. Gộp hai người mà mỗi người có một tài khoản gắn vào là **xung đột phải giải bởi người duyệt**, không phải hợp nhất im lặng; lõi từ chối cho tới khi được giải.

---

## G-09 — Ba đường mutation: mấy giao dịch, thứ tự nào `[Nặng]`

**Hai đơn vị.**

- **Đơn vị A** viết mỗi hàm lõi tự mở giao dịch, đúng Quy ước Transactions: "**Lõi mở giao dịch**, đặt biến phiên, làm mọi việc bên trong". `mergePersons` mở giao dịch, `promoteAssertion` mở giao dịch, `writeRevision` mở giao dịch.
- **Đơn vị B** dựng "duyệt một mảnh": gộp hai người **rồi** thăng hạng khẳng định của người thắng — gọi `mergePersons()` rồi `promoteAssertion()`.

**Chỗ lệch.** Quy ước nói lõi mở giao dịch, không nói **ai** trong lõi và **mấy lần**. B tạo ra hai giao dịch nối tiếp. `mergePersons` commit, `promoteAssertion` chết vì AD-20 → cây đã bị gộp, giá trị chưa được duyệt, và người dùng thấy một trạng thái không ai chủ đích tạo ra. Nếu A đổi sang "hàm trong nhận giao dịch có sẵn" thì mọi chữ ký hàm phải đổi — đó là quyết định kiến trúc, không phải chi tiết cài đặt, và spine phải chốt.

**Thứ tự cũng chưa chốt.** AD-3 (gộp), AD-4 (loại giá trị thua), AD-10 (ghi nhật ký) đều nói "trong cùng giao dịch" **của riêng mình**, không nói với nhau. Hai đội xếp hai thứ tự khác nhau và nhật ký ghi ra hai câu chuyện khác nhau cho cùng một sự việc: đội A ghi `revision(merge)` trước rồi `revision(supersede)`; đội B ngược lại. FR-39 dựng lại cây tại một thời điểm giữa hai bản ghi cho ra hai kết quả khác nhau — mà "giữa hai bản ghi" là có thật nếu hai hàng nhật ký mang hai `created_at` khác nhau.

**Bịt bằng — AD-23 (mới) + siết Quy ước Transactions.**

> **AD-23 — Một thao tác của người dùng là một giao dịch và một nhóm nhật ký.**
> Giao dịch mở **đúng một lần** tại biên lõi, bởi một hàm bao `withClanTx`, và được truyền xuống mọi hàm bên trong; hàm lõi nào cũng nhận handle giao dịch làm tham số và **không** tự mở. Mọi hàng nhật ký sinh ra trong một giao dịch mang cùng một `operation_id` và cùng một dấu thời gian giao dịch, để bản dựng lại tại một thời điểm không bao giờ rơi vào giữa một thao tác. Thứ tự bắt buộc trong một thao tác: (1) kiểm quyền, (2) đổi cấu trúc (AD-3/AD-19), (3) đổi trạng thái khẳng định + hạ bệ (AD-9/AD-20/AD-4), (4) chiếu lại `person` và `parent_child` (AD-16/AD-15), (5) ghi nhật ký (AD-10). Tác dụng phụ không quay lui được — ghi object storage, gửi thông báo — **nằm ngoài** giao dịch và đi qua AD-24.

---

## G-10 — AD-5 tính trên "tập cạnh" nào, và ai tính lại sau khi gộp `[Nặng]`

**Hai đơn vị.**

- **Đơn vị A — `core/tree.pathToRoot(personId)`** cho FR-13 ("vừa thêm mình xong là thấy ngay đường ngược lên cụ xa nhất"). Để phần thưởng xuất hiện **tức thì**, A phải tính trên **mọi** cạnh, kể cả cạnh vừa nhập ở tầng tồn nghi.
- **Đơn vị B — `core/tree.generationOf(personId)`** dùng trong bản in và trong dò trùng FR-48. B chỉ tính trên cạnh **chính thức**, vì in ra một số đời dựa trên tin đồn là đúng thứ PRD sợ.

**Mỗi bên tuân thủ ra sao.** AD-5 nói nguyên văn "tính từ **tập cạnh cha–con** tại thời điểm request". Nó không nói tập nào. Cả hai đúng.

**Chỗ lệch.** Cùng một cụ hiện "đời 5" ở màn hình cây và "đời 4" ở bản in, cùng lúc. Mã chi `1.3.2` và `1.3` cũng vậy. Với một sản phẩm mà số đời là **đơn vị ý nghĩa văn hóa**, hai con số cho một người là lỗi phá vỡ lòng tin, không phải lỗi hiển thị.

**Chỗ lệch thứ hai — ai giữ giá trị cũ sau khi gộp.** AD-5 cấm cache **ở tầng dữ liệu** ("caches, materialized paths, denormalized copies are forbidden"). Nó không nói gì về các lớp cache **không phải CSDL** mà stack này bật sẵn: Next.js Router Cache phía client, `fetch`/Data Cache, Full Route Cache, React `cache()` trong một request, và Cloudflare edge (có trong sơ đồ triển khai). Sau một lần gộp, mã chi của **hàng chục người** đổi cùng lúc. Không AD nào nói ai vô hiệu hóa cái gì. Đội A đặt route là dynamic; đội B bật ISR 60s cho trang cây vì "AD-5 chỉ cấm cache trong CSDL". Người dùng bấm gộp xong, cây vẫn hiện hình cũ trong một phút — và nếu edge cache dính thì lâu hơn. Tệ hơn: cache theo route **không phân biệt người xem**, trong khi AD-13 nói nội dung phụ thuộc node người xem → **cache một bản trả cho người xem khác** là rò dữ liệu người sống. Đây là G-04 xuất hiện lại dưới dạng hạ tầng.

**Bịt bằng — siết AD-5 + một câu trong Quy ước.**

> Siết AD-5, thêm: "Số đời và mã chi tính trên **tập cạnh đang hiển thị cho người xem đó** — nghĩa là cùng một tập mà cây đang vẽ. Bản in và màn hình dùng chung một hàm và cùng tham số tập cạnh; hai đường tính khác nhau cho cùng một người là defect. Lệnh cấm cache áp cho **mọi tầng**, kể cả cache route/edge/HTTP: mọi trang chứa dữ liệu phả hệ là dynamic, không cache dùng chung, vì nội dung phụ thuộc node người xem (AD-13/AD-18). Không có tính lại nền: giá trị dẫn xuất không tồn tại giữa hai request nên không có gì để tính lại — đó chính là lý do AD-5 tồn tại."

Nếu sau này hiệu năng bắt buộc phải cache, đó là một AD mới có tên, có khóa cache chứa node người xem và có đường vô hiệu hóa — không phải một quyết định của người viết route.

---

## G-11 — Vòng đời object storage: không ai xóa, không ai quét rác `[Nặng]`

**Hai đơn vị.**

- **Đơn vị A — `core/media.uploadRecording()`**: nhận file, `PUT` lên R2, rồi mở giao dịch ghi hàng `recording` với handle. Đúng AD-11.
- **Đơn vị B — `core/media.withdrawConsent(recordingId)`** cho FR-49 ("quyền rút lại **còn hiệu lực sau khi họ mất**"). B đọc AD-4 ("`DELETE` trên giá trị từng được chấp nhận là bị cấm") và AD-10, kết luận: đánh dấu hàng là `withdrawn`, **không xóa gì**, file vẫn nằm nguyên trên R2.

**Chỗ lệch.**

1. **Rác vĩnh viễn.** Nếu giao dịch của A rollback sau khi `PUT` thành công (mạng, xung đột AD-20, người dùng đóng tab), object nằm lại trên R2 mà **không hàng nào trỏ tới**. AD-11 nói CSDL chỉ giữ handle → object store **không có** danh mục độc lập về cái gì còn sống. Không AD nào giao cho ai việc đối chiếu. Rác tích lũy vĩnh viễn, và ở loại dữ liệu này rác không chỉ tốn tiền: nó là bản ghi giọng người sống không ai biết còn tồn tại.
2. **"Rút lại" không rút được gì.** Cụ bà bảo "đừng dùng đoạn tôi kể về bà hai nữa". B đánh dấu `withdrawn`. Bytes vẫn ở đó, URL ký vẫn phát được nếu một đường nào đó quên kiểm cờ, và bản `pg_dump` + bản sao R2 (NFR ≥ 2 nơi) nhân bản nó ra thêm. Lời hứa của FR-49 không được kiến trúc nào chống lưng.
3. **Hai đội đọc AD-4 ngược nhau.** Đội thứ ba đọc AD-4 là "chỉ áp cho **giá trị** khẳng định, không áp cho **file**", và xóa cứng object. Giờ nhật ký nói bản ghi từng tồn tại, handle trỏ vào hư không, và dựng lại lịch sử ném lỗi 404. Cả hai cách đọc đều hợp lệ với câu chữ hiện tại.

**Bịt bằng — AD-24 (mới).**

> **AD-24 — Object có vòng đời tường minh; CSDL là danh mục, và có một người quét rác.**
> Ghi object trước, ghi hàng sau, nhưng object mới ghi mang nhãn `pending` cho tới khi giao dịch commit; một tác vụ đối chiếu chạy định kỳ, liệt kê object không được hàng nào trỏ tới và quá một cửa sổ an toàn, rồi xóa — chạy qua `withClanTx` (AD-17). Xóa bản ghi khỏi CSDL **không bao giờ** là xóa cứng: hàng chuyển sang bia mộ giữ metadata và nhật ký (AD-4, AD-10), còn **bytes** đi vào hàng đợi hủy có thời hạn. Rút lại đồng thuận (FR-49) là **hủy bytes thật** — trên storage chính, trên bản sao, và có ghi nhận là đã hủy — trong khi metadata và dấu vết nhật ký ở lại để phả không thủng. AD-4 áp cho giá trị phả hệ, **không** áp cho nội dung media mà người kể đã rút lại; câu này viết ra để hai cách đọc không cùng tồn tại.

---

## G-12 — Auth.js chạm CSDL ngoài `core/` `[Vừa]`

**Hai đơn vị.** Đội A đặt adapter Auth.js trong `app/api/auth/[...]/route.ts` — cách chuẩn của thư viện — và **phải import db client ở đó**, vi phạm nguyên văn AD-1, nên A tắt lint cho đường dẫn đó. Đội B nhét toàn bộ cấu hình Auth.js vào `core/identity` để lint xanh.

Dù ai thắng, câu hỏi thật vẫn chưa ai trả lời: bảng `user`/`session`/`account` do Auth.js tự quản **có mang `clan_id` không** (AD-7 nói "**mọi** bảng mang khóa dòng họ"), có bật RLS không, và mỗi lần đăng nhập có sinh `revision` không (AD-10 nói "**mọi** mutation"). Auth.js ghi các bảng đó **không đi qua** `withClanTx`, nên với AD-17 thì mọi lần đăng nhập sẽ lỗi.

**Bịt bằng — siết AD-1 và AD-7.** Ghi rõ: tài khoản là dữ liệu **liên dòng họ** theo thiết kế (AD-8: một tài khoản có thể gắn vào node của nhiều dòng họ trong tương lai), nên bảng tài khoản/phiên **không** mang `clan_id` và **không** chịu RLS dòng họ; bảng `account_attachment` thì có. Việc Auth.js ghi bảng phiên không phải "mutation" theo nghĩa AD-10 — chỉ thao tác lên dữ liệu phả hệ mới sinh nhật ký. Và AD-1 nêu tên một ngoại lệ duy nhất, có phạm vi: `core/identity/auth-adapter` là chỗ duy nhất ngoài đường lõi thường được chạm client CSDL, và nó không đọc/ghi bảng phả hệ nào.

## G-13 — "Đang sống" không được định nghĩa `[Vừa]`

AD-13 áp cho "người **đang sống**". Đội A suy: không có ngày mất ⇒ đang sống (an toàn). Đội B suy: sinh trước 1930 mà không có ngày mất ⇒ đã khuất (thực dụng, vì phần lớn cụ trong khung FR-51 không có ngày mất). Kết quả: hoặc mọi cụ tổ bị che như người sống — làm hỏng chính sản phẩm — hoặc một người 92 tuổi còn sống bị lộ đầy đủ vì không ai nhập ngày mất. Thêm nữa, "vị thành niên bị ẩn chặt hơn" cần **ngày sinh**, mà AD-13 lại đang che ngày sinh: vòng lặp.

**Bịt bằng — siết AD-13:** trạng thái sống/mất là một **vị từ khẳng định tường minh** (`alive`, `deceased`, `unknown`) với `unknown` được xử như đang sống; suy đoán theo năm sinh chỉ được dùng để **gợi ý** cho người duyệt, không bao giờ để quyết định che. Việc tính tuổi cho quy tắc vị thành niên chạy **bên trong** lõi trên giá trị chưa che, chỉ kết quả đã che mới ra khỏi lõi.

## G-14 — "Tính chứ không cấu hình" đụng "không hard-code gì" `[Vừa]`

AD-13 nói bán kính riêng tư "được **tính**, không cấu hình"; AD-14 nói mọi thứ riêng của dòng họ là **dữ liệu**; PRD §11 nói mỗi dòng mặc định là "**cấu hình, không phải mã**". Con số **3 bậc** rơi vào khe giữa. Đội A hard-code `3` (đọc AD-13), đội B đặt nó vào bảng `clan_settings` (đọc AD-14/PRD §11). Nếu B thắng mà không có ràng buộc, một quản trị viên tương lai đặt bán kính = 99 và tắt toàn bộ bảo vệ người sống bằng một hàng CSDL.

**Bịt bằng — siết AD-13:** phân biệt hai thứ. **Cơ chế** là tính từ khoảng cách quan hệ, không có công tắc người dùng cuối, không đảo ngược được. **Tham số** (bán kính, ngưỡng tuổi vị thành niên) là cấu hình cấp dòng họ, có **cận trên cứng trong mã** và mọi thay đổi sinh một hàng nhật ký như mọi mutation.

## G-15 — Un-merge hết hiệu lực lúc nào `[Vừa]`

AD-3 nói gộp "reversible **by record**" — tách lại bằng cách phát ngược danh sách repointing. Không AD nào nói cái gì xảy ra khi **sau đó** có thao tác khác: người thắng được gộp tiếp lần hai; một khẳng định vốn của người thua đã được thăng hạng lên chính thức (AD-9) rồi hạ bệ khẳng định của người thắng (AD-20); một cạnh mới nối vào người thắng. Phát ngược danh sách cũ giờ tạo ra trạng thái chưa từng tồn tại: người thua sống lại mà giá trị chính thức của anh ta đang nằm trên người thắng.

**Bịt bằng — siết AD-3:** tách lại chỉ hợp lệ khi **chưa có thao tác nào chạm vào người thắng kể từ lần gộp** (kiểm bằng `operation_id` trong AD-23); ngoài cửa sổ đó, tách lại là một thao tác **dựng lại có duyệt** — tạo người mới, chuyển các khẳng định được chỉ định sang, ghi nhật ký như một thao tác riêng — chứ không phải phát ngược. Nói rõ điều này để không ai hứa với người dùng một nút "hoàn tác" mà kiến trúc không đỡ nổi.

---

## Tổng hợp — AD phải thêm hoặc siết

| AD | Nội dung | Bịt lỗ |
|---|---|---|
| **AD-15** (mới) | Quan hệ phả hệ là khẳng định; `parent_child` là bảng chiếu chỉ-đọc | G-01 |
| **AD-16** (mới) | `person` là bảng chiếu, `core/assertion` là chủ ghi duy nhất, cưỡng chế ở tầng CSDL | G-02 |
| **AD-17** (mới) | Vai ứng dụng không sở hữu bảng; `FORCE RLS`; không phiên nào chạy thiếu bối cảnh dòng họ; chính sách fail-loud | G-03 |
| **AD-18** (mới) | Bán kính riêng tư là bộ lọc trên **mọi** đường đọc, kể cả nhật ký và media | G-04 |
| **AD-19** (mới) | Mutation cấu trúc (gộp/tách) cần quyền duyệt như thăng hạng | G-05 |
| **AD-20** (mới) | Nhiều nhất một khẳng định được chấp nhận trên mỗi (người, vị từ); thăng hạng hạ bệ đương nhiệm | G-06 |
| **AD-21** (mới) | Khẳng định có vị từ và kiểu; lời kể chưa bóc tách không phải khẳng định | G-07 |
| **AD-22** (mới) | Bia mộ là chuyển hướng ở tầng lõi, không phải node; danh sách repoint do CSDL sinh | G-08 |
| **AD-23** (mới) | Một thao tác = một giao dịch + một `operation_id`; thứ tự bắt buộc; tác dụng phụ ngoài giao dịch | G-09 |
| **AD-24** (mới) | Vòng đời object: nhãn `pending`, quét rác đối chiếu, hủy bytes khi rút đồng thuận | G-11 |
| **AD-5** (siết) | Nêu rõ tập cạnh nào; cấm cache mở rộng sang route/edge/HTTP | G-10 |
| **AD-2** (siết) | `person` **chiếu** giá trị; chỉ sở hữu định danh và cờ vòng đời | G-02 |
| **AD-7** (siết) | Bỏ chữ "của request"; thêm test CI hai dòng họ làm điều kiện coi RLS là "đang hoạt động" | G-03 |
| **AD-13** (siết) | Áp cho mọi đường đọc; tách cơ chế khỏi tham số; định nghĩa "đang sống" | G-04, G-13, G-14 |
| **AD-1** (siết) | Nêu tên ngoại lệ duy nhất cho adapter xác thực, có phạm vi | G-12 |
| **AD-3** (siết) | Nêu cửa sổ hiệu lực của tách lại | G-15 |

## Ba câu hỏi spine phải trả lời trước khi code

1. **`person` là nguồn sự thật hay bảng chiếu?** Không thể để mở. Chọn "bảng chiếu" thì AD-16 là bắt buộc; chọn "nguồn sự thật" thì phải có AD nói ai ghi và khi nào, và FR-1 mất nghĩa cho các trường không đi qua khẳng định.
2. **Quan hệ cha–con là khẳng định hay là cạnh?** Trả lời khác nhau cho ra hai sản phẩm khác nhau. Đây là câu quan trọng nhất trong toàn bộ tài liệu vì FR-48 — "trái tim của hệ thống" theo PRD §3 — vận hành trên chính tập dữ liệu đó.
3. **RLS đã bao giờ được chứng minh là đang chạy chưa?** Một chính sách viết đúng trên một vai chủ sở hữu là một chính sách không tồn tại. Điều kiện chấp nhận của AD-7 phải là một test, không phải một câu văn.
