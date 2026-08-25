# Story 5.7: Nơi chốn là dữ liệu, không phải chữ

Status: review

## Story

Là **người trong Ban tu phả**,
tôi muốn **ghi quê quán, trú quán và nơi an táng như một THỰC THỂ có đơn vị hành chính cha, gõ tự do rồi chọn từ ứng viên hoặc tạo mới ngay tại chỗ**,
để **hai cái "Quang Trung" ở hai tỉnh không lẫn vào nhau, và phả tra được theo nơi chứ không chỉ đọc được**.

## Bối cảnh: FR-65 chưa có một bảng nào

Bản dựng thử ghi thẳng: `NOI` / `NOI_CUA_NGUOI` — **CHƯA CÓ GÌ**, 5-7 phải dựng.

PRD §5b nói vì sao nơi không thể là chữ tự do:

> Có nhánh ở **Quang Trung, Định Hoá (Thái Nguyên)**, có nhánh ở **Quang Trung, Vũng Tàu** — hai
> tên giống hệt nhau, hai nơi khác hẳn nhau. […] để dưới dạng chữ tự do là **không dùng được**:
> không tra được, không gom nhóm được, không điều hướng theo được, và hai lần gõ cùng một cái tên
> thành hai nơi khác nhau.

Đây cũng là nền cho ba thứ đã nằm trong backlog: **FR-62 bản đồ di cư**, trang **"Đất tổ"**, và
**QR mộ phần & bản đồ tảo mộ**. Không có FR-65 thì không cái nào viết được.

## Bốn ràng buộc FR-65 treo lên story này

1. **Nhập không được chặn luồng.** Không có bước "tạo danh mục nơi trước rồi mới nhập người". Gõ
   tự do → hệ so khớp → chọn một hoặc tạo mới **ngay tại chỗ**.
2. **Nơi đi qua bán kính riêng tư.** Nơi ở của người **còn sống** là địa chỉ (FR-37). Nơi không
   được là cửa hậu làm rò thứ FR-37 đang giữ.
3. **Trống là hợp lệ.** Phần lớn các cụ không còn ai nhớ chính xác quê quán. Bỏ trống là một trạng
   thái đúng, không phải một lỗi cần nhắc.
4. **Gộp và tách được** như FR-48 với người — *xem § Phạm vi*.

## Nói rõ một chỗ về "dùng lại bộ máy so khớp"

PRD viết *"Dùng lại đúng bộ máy so khớp của FR-48 — không dựng cái mới."* Hiểu đúng phải là: dùng
lại **phép gấp dấu AD-16** (`chuanHoa` / `boDau`), thứ FR-48 cũng dùng.

`soKhopMoc` thì **không** dùng lại nguyên khối được: nó nhận `MocKhai` — một mốc khai về QUAN HỆ
người, có năm sinh, có hệ thống đồng tộc, có luật cứng loại theo vai. Nơi không có thứ nào trong
đó. Nhét nơi vào khuôn ấy là bẻ cả hai. Tín hiệu của nơi chỉ có hai: **tên đã gấp dấu**, và **đơn
vị cha đã gấp dấu** — mà đơn vị cha chính là thứ PRD dựng ra để phân biệt hai "Quang Trung".

## Acceptance Criteria

### Nền dữ liệu

1. Migration `0003_noi_chon.sql`: bảng **`place`** — `id` · `clan_id` · `name` · `name_folded` ·
   `parent_unit` · `parent_unit_folded` · `merged_into` (AD-3, để dành cho việc gộp) · `created_at`.
   **Không** có toạ độ ở đợt này (PRD: toạ độ là tuỳ chọn; ngoài phạm vi FR-65 là bản đồ).
2. Cột **`assertion.place_id`** (uuid, references `place.id`) — cùng lối `object_person_id` và
   `union_id` đã có. `place_id` chỉ có nghĩa với `kind = 'place'`.
3. **RLS cho `place`**: `ENABLE` + `FORCE`, policy `clan_id = current_clan_id()` fail-closed —
   y hệt mười bảng kia. Thêm `'place'` vào **`PARTITIONED_TABLES`**; gate schema sẽ tự canh.
4. `ASSERTION_KINDS` thêm **`'place'`**, value `{ role: 'que-quan' | 'tru-quan' | 'an-tang' }`.
   Ba vai đúng như PRD §5b. Ba lần táng (nguyên/cải/di) **chưa phân loại** ở đợt này.
5. Gate `core/gates/rls.gate.test.ts` phải xanh **không sửa gì** — nếu phải sửa thì đó là dấu
   hiệu bảng mới không theo luật chung.

### `core/place`

6. `core/place/index.ts` — bề mặt adapter (AD-24, không tham số danh tính):
   - `searchPlaces(query)` → ứng viên đã chấm điểm, xếp giảm dần.
   - `addPlace({ name, parentUnit })` → tạo nơi mới, revision cùng tx (AD-10).
   - `listPlaces()` → toàn bộ nơi của dòng họ, cho màn *Nơi chốn*.
7. Chấm điểm ở `core/place/cham-diem.ts` — **hàm thuần**, test được trong node:
   - Tên trùng khít sau khi gấp dấu ⇒ điểm cao nhất.
   - Tên trùng **và** đơn vị cha trùng ⇒ cao hơn nữa. **Tên trùng mà đơn vị cha KHÁC ⇒ hạ mạnh**,
     không loại — hai "Quang Trung" khác tỉnh phải cùng hiện ra để người nhập thấy mà chọn đúng.
   - Chứa nhau (một bên là con của bên kia) ⇒ điểm vừa.
8. **Trùng tên + trùng đơn vị cha thì KHÔNG tạo mới** — `addPlace` trả `conflict` kèm id nơi đã có.
   Đó là cách duy nhất giữ cho danh mục không tự sinh sôi từ chính lỗi gõ.
9. `place_id` trỏ vào nơi đã `merged_into` ⇒ đọc ra nơi thắng (AD-3), như `person.redirect`.

### Ghi nơi

10. `addAssertion(personId, { kind: 'place', placeId, role }, source)` — mở rộng `AssertionSpec`.
11. `valueText` cho `kind: 'place'`: *"quê quán: Quang Trung, Định Hoá"* — **luôn kèm đơn vị cha**,
    vì thiếu nó thì dòng ấy vô nghĩa đúng theo lý do FR-65 tồn tại.
12. Biểu mẫu ghi thêm (5-6) nhận thêm loại **Nơi**: chọn vai (quê quán · trú quán · an táng), gõ
    tên tự do, thấy ứng viên kèm mức chắc chắn, chọn một **hoặc tạo mới ngay tại chỗ** cùng ô đơn
    vị cha.
13. Ứng viên bày **tên + đơn vị cha**, không bao giờ chỉ tên. Hai "Quang Trung" nằm cạnh nhau mà
    trông giống hệt là đúng cái hỏng FR-65 sinh ra để chặn.
14. Không có ứng viên nào là **trạng thái bình thường** — mời tạo mới, không bày lỗi.

### Riêng tư

15. Khẳng định nơi đi qua đúng cổng như mọi khẳng định khác: `PersonProfile.assertions` chỉ có mặt
    khi `visibility === 'full'`. **Không** mở một đường đọc nơi nào đi vòng qua cổng ấy.
16. Màn *Nơi chốn* bày **danh mục nơi**, không bày ai ở đâu. Danh mục là dữ liệu về ĐỊA DANH, không
    về người — cùng lẽ với danh bạ dòng họ ở migration 0002.

### Thanh việc

17. Mục **"Nơi chốn"** vào `man-admin.ts` — nhóm `so-ho`, **không** có số, icon `MapPin`. Kèm màn
    thật `app/admin/noi-chon/page.tsx` cùng một lượt (`chrome.test.ts` bắt hai chiều).

### Sàn không được hạ

18. Sàn chữ 17px; nhãn 15px; ô nhập 44px; `<label>` thật. Không đổ bóng, không ngôi hai.

## Phạm vi — KHÔNG thuộc story này

- **Gộp / tách nơi.** FR-65 đòi, và cột `merged_into` đã dựng sẵn để đón — nhưng gộp đúng cách là
  cả một module (`core/merge` cho người dài hơn 400 dòng: đề xuất, quyền AD-22, repoint, bia mộ,
  tách lại). Nhét vào đây là làm hỏng cả hai. Ghi vào `deferred-work.md`.
- **Toạ độ, bản đồ, tích hợp dịch vụ ngoài** — PRD xếp ngoài FR-65.
- **Phân loại nguyên táng / cải táng / di táng** — PRD: *"Đợt 2 chỉ cần chứa được một"*.
- **Chuẩn hoá theo danh mục hành chính nhà nước** — PRD xếp ngoài.

## Tasks / Subtasks

- [x] **T1. Nền dữ liệu** (AC: 1–5)
  - [x] Migration `0003_noi_chon.sql` + journal
  - [x] `db/schema/domain.ts`: bảng `place`, cột `assertion.place_id`, `'place'` vào
        `ASSERTION_KINDS` và `PARTITIONED_TABLES`
- [x] **T2. `core/place`** (AC: 6–9)
  - [x] `cham-diem.ts` thuần + test
  - [x] `ops.ts` + `index.ts`
- [x] **T3. Ghi nơi** (AC: 10–11)
  - [x] `AssertionSpec` nhánh `place`; `addAssertionOp` nhận `placeId`
  - [x] `valueText` kèm đơn vị cha
- [x] **T4. Bộ chọn nơi** (AC: 12–14)
  - [x] `components/admin/chon-noi.tsx`
  - [x] Nối vào biểu mẫu ghi thêm của 5-6
- [x] **T5. Màn Nơi chốn** (AC: 16–17)
- [x] **T6. Test**
  - [x] Chấm điểm: trùng tên khác đơn vị cha KHÔNG được gộp điểm
  - [x] `addPlace` trùng khít ⇒ `conflict`
  - [x] Gate RLS xanh không sửa

## Dev Notes

### Chỗ dễ sai nhất: hai "Quang Trung"

Đây là lý do duy nhất FR-65 tồn tại. Mọi quyết định trong story phải soi lại vào nó:

- Chấm điểm **không được** để tên trùng lấn át đơn vị cha khác nhau.
- Ứng viên **không được** bày chỉ tên.
- `addPlace` **không được** cho tạo trùng khít, nhưng **phải** cho tạo cùng tên khác đơn vị cha.

### Migration: theo đúng nếp 0001

`0001_rls.sql` sinh policy cho từng bảng trong một vòng `DO $$`. Bảng mới phải có **cả bốn** chi
tiết: `ENABLE`, `FORCE`, vai ứng dụng không sở hữu bảng, và policy fail-closed. AD-20 nói rõ mỗi
chi tiết **hỏng im lặng một mình**. Gate schema đọc `PARTITIONED_TABLES`, nên quên khai ở đó là
gate xanh giả.

Nhớ `GRANT` cho `giapha_app` — bảng mới không tự có quyền.

### Học từ 0002

Migration 0002 (danh bạ dòng họ) sửa hai câu khẳng định của gate **có chủ ý** và ghi lý do vào cả
migration lẫn gate lẫn spine. Story này thì ngược lại: gate phải xanh **không sửa gì**. Phải sửa
gate là dấu hiệu bảng mới không theo luật chung.

### Testing

**Kiểm được:** chấm điểm (thuần) · `addPlace` conflict · RLS cho `place` qua gate · `valueText`.

**Cần mắt người:** bộ chọn nơi trong cột 360px · hai ứng viên cùng tên khác tỉnh có phân biệt được
bằng mắt không.

### References

- `prd.md §5b FR-65` — bốn ràng buộc, ba vai, và cái nó mở khoá
- `epics-dot-2.md` hàng 5-7; § Hố PRD đã lấp 24/08
- `db/migrations/0001_rls.sql` · `0002_clan_directory.sql` — hai nếp migration
- `core/so-khop/index.ts:26` `chuanHoa`/`boDau` (AD-16)
- `db/schema/domain.ts` — `ASSERTION_KINDS` · `PARTITIONED_TABLES` · `assertion`
- AD-3 (bia mộ) · AD-10 · AD-16 · AD-20 · FR-37

## Dev Agent Record

### Agent Model Used

_(điền khi implement)_

### Debug Log References

### Completion Notes List

### File List

## Completion Notes

Dev: Claude Opus 5 · 25/08/2026.

### Đã kiểm được

- Migration `0003_noi_chon.sql` đã áp. `npx vitest run` **178/178** (168 cũ + 10 bài chấm điểm
  nơi) · `tsc` sạch · `eslint` sạch · `npm run build` xanh · `/admin/noi-chon` có trong route list.
- **Gate RLS xanh KHÔNG phải sửa một dòng nào.** Đây là điều đáng nói nhất về migration này:
  `0002` (danh bạ dòng họ) phải sửa hai câu khẳng định của gate có chủ ý; `0003` thì không, vì
  `place` theo đúng luật chung của mười bảng phân vùng. Phải sửa gate là dấu hiệu bảng mới đi
  chệch — ở đây không có dấu hiệu ấy.
- Mười bài test thuần cho phép chấm điểm, trong đó bài đầu tiên là **lý do cả FR-65 tồn tại**: hai
  "Quang Trung" khác tỉnh cùng hiện ra, đúng cái xếp trên, và cái sai NÓI RÕ vì sao nó thấp.

### Ba chỗ đáng ghi lại

**Hàng rào `Record<AssertionKind, …>` từ 5-3 trả công.** Thêm `'place'` vào schema làm `tsc` gãy
ngay ở `chong.ts`, bắt phải quyết định `place` thuộc kiểu chồng nào và đặt nhãn cho nó — thay vì để
nó lặng lẽ rơi ra ngoài panel. Đúng thứ cái `Record` ấy dựng ra để chặn.

**Cùng cái bẫy `set-state-in-effect` lần thứ ba** (5-1 → 5-3 → 5-7). Sửa theo đúng cách 5-1 đã
dùng: giữ TỪ KHOÁ cạnh kết quả rồi suy ra trạng thái "đang tìm". Ba lần liên tiếp thì đó là nếp
của repo, không phải một lần vấp — đáng ghi vào ghi chú của story sau.

**Không dùng lại `soKhopMoc`, và đó là đọc đúng PRD chứ không phải đi tắt.** PRD viết *"dùng lại
đúng bộ máy so khớp của FR-48"*; phần dùng lại được là **`chuanHoa`** (gấp dấu AD-16). `soKhopMoc`
nhận một `MocKhai` — mốc khai về QUAN HỆ NGƯỜI, có năm sinh, có hệ thống đồng tộc, có luật cứng
loại theo vai. Nơi không có thứ nào trong đó.

### CHƯA kiểm được — cần mắt người

1. Bộ chọn nơi trong cột 360px: hai ô (tên + đơn vị cha) đứng ngang hàng có chật không.
2. Hai ứng viên cùng tên khác tỉnh **có phân biệt được bằng mắt không** — đây là bài kiểm quan
   trọng nhất của cả story, và test không trả lời hộ được.
3. **Chưa ai tạo một nơi thật.** Cùng lý do với 5-4/5-5/5-6.

### Nợ để lại

Ba mục vào `deferred-work.md`: gộp/tách nơi · hai khẳng định cùng vai `que-quan` là mâu thuẫn ·
phân loại ba lần táng.
