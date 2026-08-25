# Story 5.3: Chồng khẳng định — cột phải của bàn làm việc

Status: review

## Story

Là **người trong Ban tu phả**,
tôi muốn **cột phải bày mọi khẳng định về người đang chọn dưới dạng CHỒNG — mỗi dòng một giá trị, kèm tầng, xuất xứ và thời điểm**,
để **tôi thấy được hệ này biết gì về người ấy, biết từ đâu, và chỗ nào đang mâu thuẫn — rồi quyết ngay tại dòng**.

## Bối cảnh: hai kiểu chồng, và vì sao phải phân biệt NGAY TỪ ĐẦU

Hệ này **không bao giờ đè lên một sự thật cũ** (AD-9/AD-10). Sửa = ghi thêm một khẳng định. Hệ quả
là mỗi người mang nhiều khẳng định cùng loại — và **có hai lý do rất khác nhau** để điều đó xảy ra:

| Kiểu chồng | Nghĩa | Việc của người duyệt |
|---|---|---|
| **Mâu thuẫn** ⚠ | Hai giá trị **không thể cùng đúng**. Một người có đúng một năm sinh. | **Chọn một** — bên thua rời khỏi dữ liệu sống nhưng ở lại nhật ký (AD-4) |
| **Nối tiếp** ▸ | Nhiều giá trị **cùng đúng**, xếp theo thời gian | **Không phải chọn** — đọc theo trình tự |

Epic đã ghi rõ vì sao phân biệt này không hoãn được:

> **An táng hợp mô hình khẳng định một cách hiếm có:** nguyên/cải/di táng là ba khẳng định **cùng
> chính thức và cùng đúng**, xếp theo thời gian — không phải mâu thuẫn. Đây là lý do 5-3 phải
> phân biệt hai kiểu chồng ngay từ đầu, dù an táng đến Đợt 3 mới làm.

Dựng panel chỉ biết một kiểu chồng thì tới Đợt 3 phải dỡ ra làm lại — và dỡ một màn đã có người
dùng thì đắt hơn nhiều so với làm đúng ngay bây giờ.

**"Chỉnh sửa" cố ý KHÔNG có mục riêng trên thanh việc.** Sửa xảy ra ở ĐÂY, cột phải, bất cứ chỗ
nào một người đang hiện (`components/admin/man-admin.ts` đã ghi chủ ý ấy).

## Acceptance Criteria

### Bề mặt core — chồng khẳng định là DẪN XUẤT

1. `PersonProfile` (`core/person/index.ts`) thêm **`stacks?: AssertionStack[]`**, dẫn xuất từ chính
   `assertions` đã có. **Không thêm truy vấn mới** — cùng một lượt đọc, không phải hai.
2. Chỉ có mặt khi `assertions` có mặt, tức `visibility === 'full'` (AD-13/AD-21, FR-37). Ngoài bán
   kính riêng tư thì cột phải **vắng chồng**, và đó là trạng thái hợp lệ, không phải lỗi.
3. Hình dạng:
   ```ts
   export type StackKind = 'mau-thuan' | 'noi-tiep' | 'don';
   export type AssertionStack = {
     kind: AssertionKind;
     /** Nhãn tiếng Việt: 'Tên', 'Năm sinh', 'Cha mẹ', 'Ghi chú'… */
     nhan: string;
     stackKind: StackKind;
     rows: PersonAssertion[];
   };
   ```
4. **Phân loại theo `kind`** (`db/schema/domain.ts § ASSERTION_KINDS`, bảy loại):
   - **Đơn trị** — `name`, `gender`, `birth`, `death`. Nhiều hơn một dòng sống ⇒ `mau-thuan`.
   - **Đa trị** — `parent-child`, `union-partner`, `note`. Nhiều dòng là BÌNH THƯỜNG ⇒ `noi-tiep`.
     (Cha và mẹ là hai khẳng định cha-con; nhiều đời vợ là nhiều union.)
   - Đúng một dòng ⇒ `don`, dù thuộc loại nào.
5. **Thứ tự trong chồng:**
   - `mau-thuan`: **chính thức trước**, rồi tồn nghi, trong mỗi nhóm mới nhất trước. Người duyệt
     cần thấy ngay "cái gì đang là sự thật sống" trước khi so với cái đang đòi thay nó.
   - `noi-tiep`: **theo thời gian**, cũ nhất trước — nó là một dòng chảy, không phải một cuộc thi.
6. Thứ tự các chồng trên panel cố định, không theo thứ tự dữ liệu trả về:
   `name → gender → birth → death → parent-child → union-partner → note`.

### Cột phải

7. Cột phải rộng **360px**, `shrink-0`, viền trái `border-ban-vien`, nền `ban-o`, cuộn riêng.
   Ngân sách bề ngang chốt ở `epics-dot-2.md`: thu ray thì canvas còn **856px**.
8. Panel bày người **đang CHỌN trên canvas**, không phải người đang làm neo. Chọn ≠ dời tâm
   (luật của 5-2) — nên cột phải đổi theo cú bấm còn canvas thì đứng yên.
9. Chưa chọn ai ⇒ cột phải bày lời mời ngắn, không bày khoảng trắng câm.
10. Mỗi dòng khẳng định mang **bốn** thứ: **giá trị · tầng · xuất xứ · thời điểm**.
    `PersonAssertion` đã có đủ: `valueText`, `tier`, `sourceKind` + `sourceDescription` (+
    `toldByName`), `createdByName` + `createdAt`.
11. **Ba mức tin cậy không mã hoá chỉ bằng màu** (`DESIGN.md § Colors`) — như thẻ trên canvas.
12. **Mâu thuẫn dùng `destructive`, KHÔNG dùng son.** `DESIGN.md § Cảnh báo là chàm mực`: son mang
    đúng một nghĩa — *đã chốt*.
13. Chồng `mau-thuan` mang dấu ⚠ và một câu nói rõ việc phải làm: **chọn một**. Chồng `noi-tiep`
    mang dấu ▸ và nói rõ **không phải chọn** — cả hai đều đúng, xếp theo thời gian.

### Quyết ngay tại dòng

14. Dòng ở tầng tồn nghi có nút **"Nâng lên chính thức"** → `promoteAssertion(assertionId)`.
15. Trong chồng `mau-thuan`, mỗi dòng KHÔNG được chọn có nút **"Loại"** → `rejectAssertion(id, note)`.
    AD-4: giá trị thua rời dữ liệu sống nhưng **ở lại nhật ký** — nút phải nói đúng điều đó, không
    được dùng chữ "xoá".
16. Mọi thao tác đi qua **server action** ở `app/admin/cay/actions.ts` (`'use server'`), gọi core,
    trả `Result` nguyên vẹn cho UI (`docs/build-contract.md`).
17. Sau mỗi thao tác thành công: `revalidatePath('/admin', 'layout')`. Nâng tầng làm đổi số trên
    "Hàng chờ khẳng định" ở thanh việc — mà thanh việc do **layout** dựng.
18. Thao tác hỏng thì bày lỗi **ngay tại dòng ấy**, không phải một băng-rôn ở đầu panel. Core trả
    `forbidden` khi người dùng không có quyền duyệt — câu chữ phải nói được điều đó.
19. **Không có nút "sửa" và không có nút "xoá".** Sửa = ghi thêm một khẳng định (5-6); xoá không
    tồn tại trong hệ này (AD-4). Đặt hai nút ấy vào đây là dạy sai mô hình cho người dùng.

### Nối vào canvas 5-2

20. Trạng thái `chonId` hiện nằm trong `KhungCayAdmin`. Nâng lên trang, hoặc bày qua context —
    5-2 đã ghi nợ này ở § Nợ để lại cho 5-3.
21. Chọn một node ⇒ cột phải nạp hồ sơ người ấy. **Canvas KHÔNG ôm lại khung nhìn** — bất biến của
    5-2, và nó dễ vỡ nhất đúng lúc nối hai màn với nhau.
22. Nạp hồ sơ **không được chặn canvas**: canvas đứng yên trong lúc cột phải đang tải.
23. Thêm mục **"Mâu thuẫn"** vào `man-admin.ts` (nhóm `doi-chieu`, **có số**, icon `TriangleAlert`)
    **chỉ khi** story này dựng luôn màn ấy. Nếu không dựng thì **KHÔNG thêm** — `chrome.test.ts`
    bắt lỗi mục trỏ vào màn chưa tồn tại. *(Quyết định: xem § Phạm vi.)*

### Sàn không được hạ

24. Sàn chữ **17px**; `15px` chỉ cho nhãn phụ. Cột 360px là chỗ chật nhất của cả bàn — chật thì
    **bớt chữ, không thu chữ**.
25. Không đổ bóng (`DESIGN.md § Elevation`). Khung trần: `ban-nen` / `ban-o` / `ban-vien`.
26. Không xưng hô ngôi hai, cấm cả chữ "bạn".
27. Tên người dùng `font-pha`; dữ liệu phả giữ luật bề mặt A ngay giữa khung trần của bàn.

## Phạm vi — cái gì KHÔNG thuộc story này

- **Màn "Mâu thuẫn" riêng trên thanh việc: KHÔNG dựng ở đây.** Nó cần một phép đọc mới (quét cả
  dòng họ tìm chồng mâu thuẫn) chứ không phải một panel. Story này dựng **phép phân loại**, thứ màn
  ấy sẽ dùng lại. Không thêm mục vào `man-admin.ts`.
- **`hideAssertion` trong panel** — epic xếp SHOULD (*"nhỏ, đã có sẵn chỗ"*). Để sau.
- **Ghi thêm khẳng định mới** — đó là 5-6.
- **Phát hiện "hai người cùng khai là cha".** ≥2 khẳng định cha-con cùng trỏ vào hai người cùng
  giới là mâu thuẫn thật, nhưng `PersonAssertion` không mang giới của người cha lẫn `relation`, nên
  phải tính ở `read-ops.ts`. Việc riêng, ghi vào `deferred-work.md`.

## Tasks / Subtasks

- [x] **T1. Dẫn xuất chồng trong core** (AC: 1–6)
  - [x] `AssertionStack` + `StackKind` trong `core/person/index.ts`
  - [x] Hàm thuần phân nhóm + phân loại + sắp thứ tự (tách riêng để test được trong node)
  - [x] Gắn vào `getPerson` — cùng lượt đọc, không truy vấn mới
  - [x] Test: bốn loại đơn trị chồng nhau ⇒ `mau-thuan` · `note`/`union-partner`/`parent-child`
        chồng nhau ⇒ `noi-tiep` · một dòng ⇒ `don` · thứ tự trong từng kiểu · vắng khi
        `visibility !== 'full'`
- [x] **T2. Server actions** (AC: 14–18)
  - [x] `app/admin/cay/actions.ts` — `nangTang`, `loaiKhangDinh`
  - [x] `revalidatePath('/admin', 'layout')` sau mỗi lượt thành công
- [x] **T3. Cột phải** (AC: 7–13, 24–27)
  - [x] `components/admin/cot-khang-dinh.tsx` — vỏ 360px, cuộn riêng
  - [x] `components/admin/chong-khang-dinh.tsx` — một chồng: đầu chồng ⚠/▸ + các dòng
  - [x] Trạng thái rỗng có lời
- [x] **T4. Nối vào canvas** (AC: 20–22)
  - [x] Nâng `chonId` lên trang `/admin/cay`
  - [x] Nạp hồ sơ người đang chọn mà không chặn canvas
  - [x] Kiểm lại: chọn node vẫn KHÔNG ôm lại khung nhìn
- [x] **T5. Test + bản dựng thử**
  - [x] Bài test thuần cho phép phân loại chồng
  - [x] `chrome.test.ts` vẫn xanh (một `<h1>`, sàn chữ, mục ↔ màn)
  - [x] `app/uiworkshop/_registry/outline.ts` — ghi nhận 5-3 đã promote

## Dev Notes

### Bề mặt đọc ĐÃ CÓ — đừng dựng lại

Khác 5-2 (phải dựng `getNeighborhood` từ số không), story này có sẵn gần hết:

| Cần | Đã có ở |
|---|---|
| Hồ sơ + mọi khẳng định sống | `core/person.getPerson()` → `PersonProfile.assertions` |
| Giá trị đã diễn thành tiếng Việt | `PersonAssertion.valueText` (`read-ops.ts:271`) |
| Nguồn, người ghi, thời điểm | `sourceKind` · `sourceDescription` · `toldByName` · `createdByName` · `createdAt` |
| Nâng tầng | `core/assertion.promoteAssertion(id)` |
| Loại bên thua | `core/assertion.rejectAssertion(id, note)` |
| Ẩn theo báo cáo (AD-17) | `core/assertion.hideAssertion(id, reason)` — để sau |

**Việc còn thiếu duy nhất là phép PHÂN LOẠI CHỒNG.** Nó là dẫn xuất, nên thuộc core (AD-5), không
để panel tự suy — màn "Mâu thuẫn" sau này phải dùng đúng phép ấy, hai nơi suy hai kiểu là hỏng.

### Đã có một màn bày khẳng định rồi — đọc trước

`app/(pha)/nguoi/[id]/page.tsx` (bề mặt A) đã bày từng dòng khẳng định kèm nguồn, và
`chip-tin-cay.tsx` đã giải nghĩa ba mức. **Đọc cả hai** trước khi dựng. Nhưng đừng dùng lại
component: bề mặt A mặc giấy dó cho người trong họ, bàn làm việc là khung trần — cùng lý do 5-2
không dùng lại `khung-cay.tsx` (chốt 24/08).

### Bản dựng thử

`app/uiworkshop/admin-canvas-graph/page.tsx` — `PanelNguoi` (dòng ~700), `Khoi` (~627), `Dong`
(~666), `GhiThem` (~654). Đó là hình đã chốt của cột phải. Dữ liệu ở đó là mock; thay bằng
`AssertionStack` thật.

### Học từ 5-2 mang sang

- **`getBranchViewOps` vs vùng lân cận** dạy một bài: một phép dẫn xuất viết cho phạm vi hẹp đem
  sang phạm vi rộng có thể sai **im lặng**. Ở đây tương đương: phép phân loại chồng phải đúng cho
  cả bảy loại khẳng định, không chỉ cho bốn loại panel hay gặp.
- **Test bắt được lỗi thật.** Bài test của 5-2 không pass ngay, và nó đúng. Viết test cho phép
  phân loại TRƯỚC khi dựng UI.
- Trình biên dịch gác hộ: `Record<AssertionKind, …>` bắt lỗi thiếu loại ngay ở `tsc`.

### Next.js 16

- `error.tsx` dùng `retry`, không phải `reset`; và nó **không** bọc `layout.js` cùng segment.
- Server action sau mutation cần `revalidatePath` tường minh — xem bài học `ghiVaoPha` ở code
  review 5-1 (`app/admin/nap-khung/actions.ts`).

### Testing

`vitest` chạy `environment: 'node'` — không jsdom, không e2e.

**Kiểm được bằng máy (BẮT BUỘC):** phép phân loại chồng là hàm THUẦN — tách khỏi `getPerson` thì
test được hết mọi tổ hợp bảy loại × số dòng × tầng, chạy mili-giây. Đây là phần đáng test nhất
của story.

**Cần mắt người:** cột 360px ở 1280px · chồng dài có cuộn đúng không · dấu ⚠/▸ có đọc ra nghĩa
không · nút "Loại" có làm người dùng tưởng là xoá không.

### References

- `epics-dot-2.md` hàng 5-3; § Thẻ thông tin (an táng là chồng nối tiếp); § Soi lại thanh việc
- `ARCHITECTURE-SPINE.md` AD-4 · AD-9 · AD-10 · AD-17 · AD-18 · AD-19
- `core/person/index.ts:22-56` `PersonAssertion` / `PersonProfile`
- `core/assertion/index.ts:91-113` promote · hide · restore · reject
- `db/schema/domain.ts § ASSERTION_KINDS` — bảy loại
- `_bmad-output/implementation-artifacts/5-2-canvas-neo.md` § Nợ để lại cho 5-3
- `DESIGN.md § Colors` · `§ Cảnh báo là chàm mực` · `§ Elevation`

## Dev Agent Record

### Agent Model Used

_(điền khi implement)_

### Debug Log References

### Completion Notes List

### File List

## Completion Notes

Dev: Claude Opus 5 · 25/08/2026.

### Lệch so với story, và vì sao

| Story ghi | Đã làm | Vì sao |
|---|---|---|
| Phép phân loại đặt ở đâu không nói rõ | Module THUẦN riêng `core/person/chong.ts` | Tách khỏi `getPerson` thì test được hết mọi tổ hợp bảy loại × số dòng × tầng trong node, chạy mili-giây. Nếu để lẫn trong hàm đọc DB thì mỗi bài test là một lượt gieo dữ liệu. |
| AC 23: cân nhắc thêm mục "Mâu thuẫn" | **Không thêm** | Nó cần một phép đọc quét cả dòng họ, không phải một panel. Story này dựng phép phân loại — thứ màn ấy sẽ dùng lại. Thêm mục trỏ vào màn chưa có là `chrome.test.ts` gãy, đúng như bất biến đã dựng. |
| — | **Sửa một lỗi bố cục của 5-2** | Xem dưới. |

### Lỗi của 5-2 mà story này phải sửa

`KhungCayAdmin` dùng `h-full`, nhưng `app/admin/layout.tsx` bọc nội dung trong một khối `px-6 py-8`
cao **theo nội dung**. `h-full` trong một cha không có chiều cao xác định thì co về **0** — và
React Flow đòi một chiều cao có thật, nên canvas của 5-2 nhiều khả năng đang không hiện gì.

Không bắt được ở 5-2 vì `tsc`, `eslint`, `vitest` và `next build` đều xanh với một canvas cao 0px.
Đúng loại lỗi mà máy này không kiểm được (đã ghi ở § CHƯA kiểm được của 5-2, mục "1280px").

Nay chiều cao do TRANG quyết (`h-[calc(100dvh-10rem)] min-h-[420px]`), vì chỉ trang mới biết cột
phải chiếm bao nhiêu. Con số `10rem` là ước lượng của thanh trên + đệm dọc + `<h1>` — **cần mắt
người xác nhận**.

### Đã kiểm được

- `npx tsc --noEmit` sạch · `npx eslint app components core` sạch · `npx vitest run` **151/151**
  (142 cũ + 9 bài mới cho phép xếp chồng) · `npm run build` xanh.
- Chín bài test thuần phủ: bốn loại đơn trị chồng nhau ⇒ `mau-thuan` · ba loại đa trị ⇒ `noi-tiep`
  · một dòng ⇒ `don` cho cả bảy loại · thứ tự trong chồng mâu thuẫn (chính thức trước dù cũ nhất)
  · thứ tự trong chồng nối tiếp (cũ nhất trước) · khẳng định đã ẩn không vào chồng (AD-17) · ẩn
  hết thì không để lại chồng rỗng · thứ tự các chồng cố định · rỗng thì rỗng.
- `Record<AssertionKind, …>` trong `chong.ts`: thêm một loại khẳng định vào schema mà quên khai ở
  đây là lỗi `tsc`, không phải một chồng xếp nhầm im lặng.

### CHƯA kiểm được — cần mắt người

1. **Chiều cao `calc(100dvh-10rem)`** có khớp thật không (xem trên) — thứ đáng nhìn đầu tiên.
2. Cột 360px ở bề ngang 1280px, với ray đã thu.
3. Chồng dài có cuộn đúng trong cột không.
4. Dấu ⚠ / ▸ có đọc ra nghĩa mà không cần đọc câu giải thích không.
5. Nút **"Loại giá trị này"** có làm người vận hành tưởng là xoá không — AD-4 nói nó ở lại nhật ký,
   và câu chữ đã cố nói điều đó, nhưng chỉ người dùng thật mới trả lời được.
6. Chọn node vẫn KHÔNG ôm lại khung nhìn (bất biến của 5-2, dễ vỡ nhất đúng lúc nối hai màn).

### Nợ để lại

Hai mục đã ghi vào `deferred-work.md`: phát hiện "hai người cùng khai là cha", và `hideAssertion`
trong panel.
