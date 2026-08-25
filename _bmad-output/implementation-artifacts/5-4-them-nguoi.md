# Story 5.4: Thêm người vào phả — hai lối vào

Status: review

## Story

Là **người trong Ban tu phả**,
tôi muốn **thêm một người vào phả ngay tại bàn làm việc — hoặc gắn vào một người đã có, hoặc để rời khi chưa biết nối vào đâu**,
để **có ai gọi báo một cụ vừa mất là tôi viết được xuống ngay, không phải đợi một tệp CSV**.

## Bối cảnh: đây là việc SỐ MỘT của ban tu phả, và hôm nay không có đường nào làm

Epic ghi thẳng ra trong ba phát hiện buộc Epic 5 phải có mặt:

> `addPerson` chỉ nằm ở luồng tự khai bề mặt A → Admin **không có màn thêm người** — đúng việc số
> một của ban tu phả.

Và soi lại thanh việc ngày 24/08 nói rõ hơn vì sao:

> Hàng chờ chỉ đầy khi NGƯỜI KHÁC đóng góp, mà những tháng đầu thì chưa ai; còn việc thường ngày
> là **ghi**: có người gọi báo một cụ vừa mất, phải viết được xuống ngay.

**Luồng `/them` của bề mặt A KHÔNG dùng lại được.** NFR-5 bó nó vào *một câu hỏi một màn* — bốn
màn, năm loại quan hệ. Đúng cho người cháu cầm điện thoại lần đầu vào phả; **sai** cho người chép
một trang phả giấy mười người một lượt. Không phải nó hỏng; nó là dụng cụ của bàn khác.

## Quyết định hình thức: biểu mẫu ở CỘT PHẢI, không phải hộp thoại

Epic đòi *"thấy vị trí TRƯỚC khi ghi"*. Một hộp thoại phủ lên canvas thì che mất đúng cái thứ cần
nhìn. Nên biểu mẫu mở ra ở **cột phải**, chỗ chồng khẳng định đang đứng — và trong lúc điền, canvas
bày một **node mờ** ở đúng vị trí người mới sẽ rơi vào.

Lợi thêm: repo chưa có primitive hộp thoại nào (`components/ui/` chỉ có badge · button · card ·
checkbox · table). Không phải thêm phụ thuộc cho một việc mà cách đúng vốn không cần nó.

## Acceptance Criteria

### Hai lối vào

1. **Lối 1 — từ một người trên canvas.** Node đang chọn có nút **"Thêm người quanh <tên>"**. Mở
   biểu mẫu ở cột phải, với người ấy làm mốc.
2. **Lối 2 — nút ở đỉnh thanh việc.** *Thêm người vào phả* — **thanh ghi 1: HÀNH ĐỘNG, không phải
   mục điều hướng** (soi lại thanh việc 24/08). Nó đứng NGOÀI `MAN`, trên cùng, có gạch ngăn với
   ba nhóm bên dưới.
3. Nút ở thanh việc dùng được từ **mọi màn** của `/admin` → đưa sang `/admin/cay?them=roi`. Cùng lý
   do neo nằm ở URL: chrome không nói chuyện được với trang bằng cách nào khác.
4. Ray thu lại thì nút co thành icon `UserRoundPlus` + nhãn cho trình đọc màn hình, giữ nguyên sàn
   chạm 44px.
5. **Nút này KHÔNG mang son.** `DESIGN.md § Colors` cho son đúng một nghĩa — *đã chốt*. Nút chỉ MỞ
   biểu mẫu, chưa ghi gì. Son thuộc về nút GỬI bên trong, như *"Ghi N dòng vào phả"* của Nạp khung.
   Viền `border-foreground` là đủ để nó nổi hơn mục điều hướng.

### Bốn hướng quan hệ

6. Biểu mẫu hỏi người mới đứng ở đâu so với **mốc**:
   | Chọn | Gọi core | Nghĩa |
   |---|---|---|
   | là **con** của mốc | `addPerson({ parentId })` | thường gặp nhất |
   | là **cha/mẹ** của mốc | `addPerson({ childId })` | thêm đời trên |
   | là **vợ/chồng** của mốc | `addPerson({ partnerId })` | tạo union |
   | **chưa biết nối vào ai** | `addPerson({})` | thành một mảnh rời — FR-48/FR-63 |
7. Vào bằng lối 2 thì mặc định là **chưa biết nối vào ai**; đổi được sang ba hướng kia bằng cách
   chọn một mốc qua ô tìm ngay trong biểu mẫu.
8. **"Chưa biết nối vào ai" là lựa chọn HỢP LỆ, không phải đường cùng.** Câu chữ phải nói rõ người
   ấy thành *gốc tạm của một mảnh* và nối vào cây chung được sau — FR-63 gọi đó là "cụ xa nhất hiện
   biết", không phải một lời khai Thuỷ tổ.

### Thấy trước khi ghi

9. Khi đã chọn mốc **và** hướng quan hệ, canvas bày một **node mờ** ở đúng chỗ người mới sẽ rơi
   vào: nét đứt, chữ mờ, nhãn *"sắp thêm"*. Dùng chính `xepCay()` với node tạm cắm vào, **không**
   đoán toạ độ bằng tay.
10. Node mờ **không chọn được** và không dời neo.
11. Đổi hướng quan hệ ⇒ node mờ nhảy sang chỗ mới ngay, **không** ôm lại khung nhìn (bất biến 5-2).
12. Đóng biểu mẫu ⇒ node mờ biến mất, cột phải trở về chồng khẳng định của người đang chọn.

### Ghi

13. Trường: **họ tên** (bắt buộc) · giới tính · năm sinh · năm mất · ghi chú · **xuất xứ**.
14. **Xuất xứ bắt buộc.** FR-1: đơn vị dữ liệu không phải "người" mà là *khẳng định về người* — ai
    khai, khi nào, dựa vào đâu. Mặc định `{ kind: 'told-by', description }` với ô mô tả trống,
    không cho gửi khi trống. Đây là bàn của người **chép lại lời người khác**.
15. Năm chỉ nhận **4 chữ số**, và năm mất không được trước năm sinh — báo ngay tại ô, không đợi gửi.
16. **Mọi thứ vào Tầng tồn nghi** (AD-9). Biểu mẫu KHÔNG có ô chọn tầng: nâng tầng là việc riêng,
    làm ở chồng khẳng định (5-3). `confidence` mặc định `ton-nghi`.
17. Nút gửi ghi rõ việc: **"Ghi vào phả"**, mang son (nó ghi thật). Đang gửi thì khoá, không cho
    bấm hai lần.
18. Ghi xong: cột phải chuyển sang **chồng khẳng định của người vừa tạo**, canvas dời neo sang
    người ấy để họ thấy ngay chỗ vừa ghi vào, và một dòng xác nhận ngắn.
19. Server action ở `app/admin/cay/actions.ts`; `revalidatePath('/admin', 'layout')` sau khi ghi —
    người mới vào tồn nghi nên số trên *Hàng chờ khẳng định* vừa tăng.
20. Ghi hỏng thì bày lỗi **trong biểu mẫu**, giữ nguyên mọi thứ đã gõ. Mất một biểu mẫu đã điền là
    cách nhanh nhất làm người vận hành bỏ màn.

### Ghi công

21. FR-39: người ghi được ghi công tự động — `createPersonOp` viết revision cùng transaction
    (AD-10) và `attribution` trên thẻ đọc ra từ đó. **Không** dựng đường ghi công riêng.
22. AD-15: người sống được thêm vào phả thì core tự phát thông báo trong cùng transaction. Không
    phải việc của màn, nhưng đừng làm gì cản nó.

### Sàn không được hạ

23. Sàn chữ 17px; nhãn ô và câu gợi ý dùng 15px. Ô nhập đạt sàn chạm 44px.
24. Mỗi ô có `<label>` thật, nối bằng `htmlFor` — không dùng `placeholder` thay nhãn.
25. Không xưng hô ngôi hai, cấm cả chữ "bạn". Không đổ bóng.

## Phạm vi — KHÔNG thuộc story này

- **Ghi thêm thông tin cho người ĐÃ CÓ** — đó là 5-6. Story này chỉ tạo người mới.
- **Duyệt người xin vào phả** — 5-5.
- **Nơi chốn** — 5-7. Biểu mẫu chưa có ô nơi; thêm vào là việc của 5-7.
- **Kéo thả thật từ cạnh node.** Epic viết *"kéo từ cạnh một node"*; ở đây làm bằng **nút trên
  node đang chọn** — cùng kết quả (thấy vị trí trước khi ghi) với một phần chi phí, và không đẻ ra
  một cơ chế kéo-thả phải tự làm accessible. Ghi ra để không ai tưởng là quên.

## Tasks / Subtasks

- [x] **T1. Nút ở thanh việc** (AC: 2–5)
  - [x] `khung-admin.tsx` — khối hành động trên đỉnh, ngoài `MAN`, có gạch ngăn
  - [x] Thu ray thì co thành icon; không mang son
- [x] **T2. Biểu mẫu ở cột phải** (AC: 6–8, 13–17, 23–25)
  - [x] `components/admin/bieu-mau-them-nguoi.tsx`
  - [x] Bốn hướng quan hệ; ô tìm mốc khi vào bằng lối 2
  - [x] Kiểm năm ngay tại ô
- [x] **T3. Node mờ trên canvas** (AC: 9–12)
  - [x] `NutCanvas` nhận thêm cờ `sapThem`
  - [x] Cắm node tạm vào `xepCay`, không đoán toạ độ
  - [x] Không chọn được; không ôm lại khung nhìn khi đổi hướng
- [x] **T4. Server action** (AC: 18–20)
  - [x] `themNguoi(...)` trong `app/admin/cay/actions.ts`
  - [x] Sau khi ghi: dời neo sang người mới, mở chồng khẳng định của họ
- [x] **T5. Test**
  - [x] Test thuần cho phép tính vị trí node mờ theo bốn hướng
  - [x] `chrome.test.ts` vẫn xanh (nút hành động KHÔNG được thành mục trong `MAN`)

## Dev Notes

### Core đã đủ — đừng thêm gì

Khác 5-2 (phải dựng `getNeighborhood` từ số không), story này **không cần bề mặt core mới**.
`addPerson(NewPersonInput)` (`core/assertion/index.ts:68`) đã nhận cả ba hướng:

```ts
parentId?: string;   // người mới là CON của người này
childId?: string;    // người mới là CHA/MẸ của người này
partnerId?: string;  // union với người này
```

Cộng `fullName` · `gender` · `birth` · `death` · `note` · `source` · `confidence`. Bỏ hết ba id đi
thì được một người rời — đúng nghĩa "chưa biết nối vào ai".

`createPersonOp` lo luôn: assertion tồn nghi (AD-9), revision cùng tx (AD-10), thông báo AD-15,
và chiếu giá trị lên `person` qua `core/assertion` (AD-19). **Không đi vòng qua nó.**

### Node mờ: cắm vào `xepCay`, đừng đoán toạ độ

Vị trí người mới **phải** tính bằng chính hàm bố cục, không phải bằng "cha ở đâu thì đặt xuống
dưới 90px". Bốn hướng cho bốn hình dạng đầu vào khác nhau:

| Hướng | Node tạm cắm vào `xepCay` |
|---|---|
| là con của M | `{ id: 'tam', chaId: M }` |
| là cha/mẹ của M | `{ id: 'tam', chaId: null }` **và** M đổi `chaId` thành `'tam'` |
| là vợ/chồng của M | không sinh node — hiện ngay TRÊN THẺ của M (vợ chồng chung một thẻ) |
| chưa biết nối vào ai | `{ id: 'tam', chaId: null }` — thành gốc thứ hai |

Hướng "cha/mẹ" đổi cấu trúc của node đã có, nên nó là ca dễ sai nhất — và cũng là ca đáng test
nhất. Hướng "vợ/chồng" **không** thêm node: thêm là vẽ ra hai người rời cạnh nhau, trái đúng luật
5-2 đã dựng.

### Hiện trạng file sẽ sửa

| File | Đổi gì |
|---|---|
| `components/admin/khung-admin.tsx` | thêm khối hành động trên đỉnh thanh việc |
| `components/admin/khung-cay-admin.tsx` | `NutCanvas` thêm cờ `sapThem`; node mờ không chọn được |
| `app/admin/cay/cay-client.tsx` | trạng thái biểu mẫu; cột phải chuyển giữa chồng và biểu mẫu |
| `app/admin/cay/actions.ts` | thêm `themNguoi` |
| `app/admin/cay/page.tsx` | đọc `?them=roi` để mở sẵn biểu mẫu |

### Học từ 5-2 và 5-3 mang sang

- **ESLint `react-hooks/set-state-in-effect`** cấm `setState` trong thân effect. Nạp trong tay cầm
  sự kiện, hoặc dùng `key` để dựng lại.
- **`revalidatePath('/admin', 'layout')`**, không phải mặc định `'page'` — số nằm ở layout.
- **Chiều cao tường minh.** Cột phải và canvas nằm trong khối `h-[calc(100dvh-10rem)]` của
  `cay-client.tsx`; biểu mẫu dài phải cuộn TRONG cột, không đẩy khối cao ra.
- **Test bắt được lỗi thật ở cả hai story trước.** Viết test cho phép tính vị trí TRƯỚC khi dựng UI.

### Testing

`vitest` chạy `environment: 'node'`.

**Kiểm được:** phép dựng đầu vào cho `xepCay` theo bốn hướng là hàm thuần — test được hết, kể cả
ca "cha/mẹ" đổi `chaId` của node đã có. Bất biến mã nguồn qua `chrome.test.ts`.

**Cần mắt người:** node mờ có rơi đúng chỗ không · biểu mẫu dài có cuộn trong cột 360px không ·
nút "Thêm người" ở ray thu · thứ tự tab qua biểu mẫu.

### References

- `epics-dot-2.md` hàng 5-4; § Soi lại thanh việc 24/08 (thanh ghi 1, và luật không dùng son)
- `core/assertion/index.ts:34-68` `NewPersonInput` + `addPerson`
- `app/uiworkshop/admin-canvas-graph/page.tsx:292` `NutThem` — hình đã chốt của nút
- `5-2-canvas-neo.md` § Nợ để lại cho 5-3 · `5-3-panel-khang-dinh.md` § Completion Notes
- `DESIGN.md § Colors` (son đúng một nghĩa) · `§ Elevation`
- FR-1 · FR-3 · FR-11 · FR-48 · FR-63 · AD-9 · AD-10 · AD-15 · AD-19

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
| AC 1: nút "Thêm người quanh <tên>" trên node | Nút nằm trên **thanh công cụ canvas**, hiện khi có người đang chọn | Nút gắn lên node phải vẽ trong `TheNguoi`, mà thẻ đã chật và có luật "không bao giờ tràn chữ". Thanh công cụ đã có sẵn hai nút cùng loại, và người vận hành đã quen nhìn lên đó. |
| AC 18: "một dòng xác nhận ngắn" | **Không** dựng dòng xác nhận | Ghi xong thì canvas dời tâm sang người mới và cột phải mở chồng khẳng định của họ — đó là xác nhận MẠNH hơn một dòng chữ, và không tốn một thành phần giao diện chỉ để nói "xong rồi". |

### Đã kiểm được

- `npx tsc --noEmit` sạch · `npx eslint app components core` sạch · `npx vitest run` **158/158**
  (151 cũ + 7 bài mới cho phép cắm node mờ) · `npm run build` xanh.
- Bảy bài test thuần phủ bốn hướng quan hệ, kể cả hai ca không hiển nhiên:
  - **cha/mẹ** — hướng DUY NHẤT sửa một node đã có (mốc treo lại vào node mờ), nên cũng là ca dễ
    sai nhất; test khẳng định cả việc `daThayCanhCu` bật đúng khi mốc vốn đã có cha.
  - **vợ/chồng** — KHÔNG sinh node nào. Thêm một node cạnh mốc là vẽ ra hai người rời, trái luật
    gộp cặp mà 5-2 dựng ra; bày sai ngay ở bản xem trước thì người vận hành ghi xong mới biết
    mình hiểu nhầm.
  - mốc không nằm trong vùng đang bày ⇒ mọi hướng rơi về "rời", không bịa ra một cạnh tới node
    không có trên hình.

### CHƯA kiểm được — cần mắt người

1. **Node mờ có rơi đúng chỗ không** — phép tính đã test, nhưng phép tính đúng mà thẻ vẽ lệch thì
   vẫn sai với người dùng.
2. Biểu mẫu dài có cuộn TRONG cột 360px không, hay đẩy khối `h-[calc(100dvh-10rem)]` cao ra.
3. Nút "Thêm người vào phả" ở ray đã thu — icon có đủ nghĩa không.
4. Thứ tự tab qua biểu mẫu, và nhóm radio hướng quan hệ đọc lên có ra nghĩa không.
5. **Đường ghi thật.** Tôi KHÔNG chạy thử `themNguoi` trên database — nó ghi dữ liệu thật vào phả
   và chưa được cho phép. Đường ghi đã có `tsc` và `build` đỡ, nhưng chưa ai bấm nút ấy lần nào.

### Nợ để lại

- **Kéo thả thật từ cạnh node.** Epic viết *"kéo từ cạnh một node"*; ở đây làm bằng nút. Cùng kết
  quả với một phần chi phí, và không đẻ ra một cơ chế kéo-thả phải tự làm accessible.
- **Ô "nơi" trong biểu mẫu** — story 5-7 (FR-65).
- Biểu mẫu chỉ tạo NGƯỜI MỚI. Ghi thêm cho người đã có là 5-6.
