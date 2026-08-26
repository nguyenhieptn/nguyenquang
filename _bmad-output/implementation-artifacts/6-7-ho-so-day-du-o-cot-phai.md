---
baseline_commit: ff8ea7e
---
# Story 6.7: Hồ sơ đầy đủ ở cột phải

Status: review

## Story

Là **người trong ban tu phả**,
tôi muốn **nhìn một người trên cây là thấy ngay tiểu sử cơ bản và quan hệ của họ, sửa được tại chỗ**,
để **không phải ghép lại chân dung một con người từ một danh sách khẳng định rời rạc**.

## Bối cảnh: dữ liệu đã tính xong rồi bị vứt ở đúng một dòng

Phản hồi từ lượt bấm thật đầu tiên trên phả sạch (26/08/2026):

> *"Sidebar hiện thông tin của một người chưa đầy đủ. Cần hiện basic biography và các nội dung có
> thể xem, chỉnh sửa được luôn."*

`getPerson` trả về sáu trường. `xemHoSo` (`app/admin/cay/actions.ts:32`) giữ bốn, **vứt hai**:

| Trường bị vứt | Mang gì |
|---|---|
| `card: PersonCard` | `lifespan` ("1941–2019" / "sinh 1985") · `generation` · `branchCode` · `tier` · `confidence` · `isLiving` · `attribution` (ai ghi, lúc nào) |
| `relations: PersonRelations` | `parents` · `children` · `partners` — mỗi thẻ **đã lọc riêng theo bán kính** |

Không phải thiếu một lượt đọc. Là thôi vứt.

## Quyết định hình thức: khối tóm tắt ở ĐỈNH cột (chốt 26/08, lối 1/3)

Cột phải đang là **chồng khẳng định** — mỗi giá trị kèm tầng, xuất xứ, thời điểm. Tiểu sử là
**một dòng tóm tắt**. Hai thứ nói về cùng dữ liệu ở hai mức chi tiết.

Chốt: tóm tắt ở đỉnh, chồng khẳng định nằm dưới **không đổi gì**. Đọc lướt thấy ngay người này là
ai; muốn biết *vì sao ghi thế* thì cuộn xuống. Hai lối bị loại: **hai tab** (giấu mất một nửa, và
bắt người vận hành nhớ mình đang ở đâu) và **gộp hẳn** (mất cái nhìn một-lượt về con người).

## Acceptance Criteria

### Bề mặt adapter — thôi vứt

1. `HoSoNguoi` mang thêm `tieuSu` (rút từ `card`) và `quanHe` (rút từ `relations`).
2. Dịch sang hình của tầng component **ở adapter**, một lần, tường minh — `components/` không
   import `@/core/*` (`docs/build-contract.md § Phân tầng`).
3. Vắng `stacks` (ngoài bán kính) thì `quanHe` **vẫn có thể có** — `relations` lọc từng thẻ riêng
   và không đi cùng `stacks`. Đừng buộc hai thứ vào nhau.

### Khối tóm tắt

4. Ngay dưới `<h2>` tên: một dòng gồm **năm sinh–năm mất · đời · chi**, ngăn bằng `·`. Thiếu phần
   nào thì **bỏ hẳn phần ấy**, không in "chưa rõ" cho mỗi ô trống — một dòng toàn "chưa rõ" là một
   dòng không ai đọc.
5. Người **còn sống** không bày năm mất, và `lifespan` của core đã lo đúng chuyện ấy (FR-37: người
   sống chỉ hiện NĂM). Không tự dựng lại chuỗi ấy ở tầng trên.
6. ~~Một dòng thứ hai: ai ghi và ghi lúc nào~~ — **ĐẢO 26/08 sau phản hồi.** Khối tóm tắt KHÔNG
   mang xuất xứ. Xem § Lượt hai.
7. ~~Mức tin cậy và tầng của giá trị tên~~ — **ĐẢO 26/08 cùng lý do.**
8. Tất cả đều là **dẫn xuất** — không lượt đọc nào thêm, không trạng thái client nào mới.

### Quan hệ — chip bấm được

9. Ba nhóm **Cha mẹ · Vợ chồng · Con**, mỗi người một chip mang họ tên.
10. Bấm một chip ⇒ **dời tâm canvas** sang người ấy (`onDoiNeo`), tức mở luôn hồ sơ của họ ở cột
    phải. Đây là đường điều hướng nhanh nhất trong cả bàn làm việc và hiện chưa có.
11. Nhóm rỗng thì **vắng hẳn nhóm ấy**, không in "Chưa có con".
12. Chip là `<button>`, sàn chạm 44px, **không** phải thẻ `<a>` — dời tâm không đổi URL theo cách
    một liên kết hứa hẹn.

### Sửa tại chỗ

13. Mỗi mục tóm tắt có khẳng định tương ứng (`name` · `birth` · `death`) thì **bấm được để mở
    thẳng biểu mẫu ghi thêm của đúng chồng ấy** — không bắt người vận hành tự tìm chồng dưới.
14. Mục không có chồng tương ứng (đời, chi — chúng là **dẫn xuất**, AD-5) thì **không bấm được**,
    và không giả vờ bấm được. Đời và chi tính lúc đọc; không có gì để sửa.

### Sàn không được hạ

15. Sàn chạm **44px**; chữ thân **17px**, nhãn phụ tối thiểu **15px** (`EXPERIENCE.md §
    Accessibility Floor` — sàn tuyệt đối là 15px, xem § Lệch của story 6-1).
16. Không phân biệt chỉ bằng màu. Không đổ bóng.
17. Không xưng hô ngôi hai, kể cả chữ "bạn".
18. Cột 382.5px (gốc `17px`, `w-90` = 382.5px): khối tóm tắt **không được đẩy chồng khẳng định
    khỏi tầm nhìn**. Chật thì bớt mục, không thu chữ.

## Phạm vi — KHÔNG thuộc story này

- **Duyệt gom theo người** — story 6-8, phản hồi cùng lượt nhưng là màn khác.
- **Sửa đời/chi** — chúng là dẫn xuất (AD-5), không có gì để sửa.
- **Trang người của bề mặt A** (`/nguoi/[id]`) — màn khác, luật khác (NFR-5).
- **Ảnh, lời kể, nhật ký** — `core/media` và `core/audit` chưa có màn nào ở bàn làm việc.

## Tasks / Subtasks

- [x] **T0** `AGENTS.md`: đọc `node_modules/next/dist/docs/` cho phần sắp viết, trước khi viết
- [x] **T1** `xemHoSo` thôi vứt `card` và `relations`; dịch sang hình component (AC 1–3)
- [x] **T2** Module THUẦN `tieu-su.ts`: dựng các mục tóm tắt từ `card`, bỏ mục rỗng (AC 4–8)
- [x] **T3** Khối tóm tắt + chip quan hệ trong `cot-khang-dinh.tsx` (AC 4–12)
- [x] **T4** Nối chip vào `onDoiNeo` qua `cay-client.tsx` (AC 10)
- [x] **T5** Bấm mục tóm tắt ⇒ mở biểu mẫu của đúng chồng (AC 13–14)
- [x] **T6** Test thuần cho `tieu-su.ts` (xem § Testing)
- [x] **T7** `npm run lint` (lệnh ĐẦY ĐỦ) · `npx tsc --noEmit` · `npx vitest run` · `npm run build`
- [ ] **T8** Mở màn thật và nhìn — cột 382.5px, và ghi kết quả vào § Completion Notes

## Dev Notes

### Hiện trạng file sẽ sửa

| File | Hiện là gì | Đổi gì |
|---|---|---|
| `app/admin/cay/actions.ts` | `xemHoSo` giữ 4/6 trường của `PersonProfile` | thêm `tieuSu` + `quanHe` |
| `components/admin/cot-khang-dinh.tsx` | `<h2>` tên rồi thẳng xuống chồng | chèn khối tóm tắt + chip giữa hai thứ ấy |
| `app/admin/cay/cay-client.tsx` | đã có `doiNeo` cho ô tìm và nút "Đặt làm tâm" | truyền xuống panel |

### Chỗ dễ sai nhất: đừng dựng lại chuỗi `lifespan`

`PersonCard.lifespan` đã là chuỗi dựng sẵn — `"1941–2019"`, `"sinh 1985"`, hoặc `""`. Nó mang
luật FR-37 (người còn sống chỉ hiện NĂM, không hiện ngày) và luật ẩn của bán kính riêng tư. Ghép
lại từ `birthDate`/`deathDate` ở tầng trên là dựng lại một luật đã có, và dựng sai ở đúng chỗ
nhạy cảm nhất.

### Học từ 6-1 mang sang

1. **`set-state-in-effect` đã vấp BỐN lần.** Story này không cần state mới nào — nếu thấy mình
   thêm một `useState`, dừng lại hỏi vì sao.
2. **Prop mới thì để BẮT BUỘC.** `CotKhangDinh` có hai nơi gọi `BieuMauGhiThem`; quên một nơi
   phải là lỗi `tsc` chứ không phải một nút im lặng.
3. **Chạy `npm run lint`, không phải `npx eslint app components`.**
4. **Đọc mã ở nơi gọi trước khi rating.** Lượt review 6-1 bắt được năm ô test tích khống — ô nào
   không có bài test thì để trống, kể cả khi lý do chính đáng.

### Testing

`vitest` chạy `environment: 'node'`, không DOM. Nên phần THUẦN phải tách ra được.

- [x] `tieu-su.ts`: có đủ ba mục ⇒ ba mục, đúng thứ tự
- [x] thiếu đời và chi ⇒ chỉ còn lifespan, KHÔNG in "chưa rõ"
- [x] `lifespan` rỗng ⇒ vắng mục ấy, không in dấu `·` thừa
- [x] tất cả rỗng ⇒ trả mảng rỗng, khối tóm tắt vắng hẳn
- [x] mục nào bấm được (`name`/`birth`/`death`), mục nào không (đời, chi — AD-5)
- [x] `chrome.test.ts` vẫn xanh không phải sửa (story không sinh màn mới)

### References

- [Source: `epics-dot-3.md#Epic 6`] — 6-7, và ghi chú *Phản hồi từ lượt bấm thật đầu tiên*
- [Source: `core/person/index.ts:26-65`] — `PersonCard`, `PersonRelations`, `PersonProfile`
- [Source: `app/admin/cay/actions.ts:32`] — `xemHoSo`, chỗ hai trường bị vứt
- [Source: `.../ARCHITECTURE-SPINE.md#AD-5`] — đời và chi là dẫn xuất, không lưu
- [Source: `.../ARCHITECTURE-SPINE.md#AD-13`], [`#AD-21`] — bán kính riêng tư buộc mọi đường đọc
- [Source: `.../EXPERIENCE.md#Accessibility Floor`] — 44px · 17px · tối thiểu tuyệt đối 15px
- [Source: `_bmad-output/implementation-artifacts/6-1-noi-nguoi-da-co.md#Lệch so với story`] — vì sao nhãn phụ dùng 15px

## Dev Agent Record

### Agent Model Used

Claude Opus 5 · 26/08/2026.

### Debug Log References

`npm run lint` sạch · `npx tsc --noEmit` sạch · `npx vitest run` **260/260** (254 trước story ⇒
+6 THUẦN; 8 bài lượt đầu, trừ 2 bài của `dongXuatXu` đã gỡ cùng hàm) · `npm run build` xanh,
36 route.

### Completion Notes List

Xem § Completion Notes.

### File List

**Mới**
- `components/admin/tieu-su.ts` — module thuần: dựng mục tóm tắt, quyết mục nào bấm được
- `components/admin/tieu-su.test.ts` — 8 bài

**Sửa**
- `app/admin/cay/actions.ts` — `xemHoSo` thôi vứt `card` và `relations`; `HoSoNguoi` mang `tieuSu` + `quanHe`
- `components/admin/cot-khang-dinh.tsx` — `TomTat` + `ChipQuanHeNhom`, prop `onMoNguoi` bắt buộc
- `app/admin/cay/cay-client.tsx` — truyền hai trường mới, nối chip vào `doiNeo`

## Completion Notes

Dev: Claude Opus 5 · 26/08/2026.

### Lượt hai sau phản hồi: BỎ BỚT, không thêm

> *"Sidebar vẫn chưa hợp lý, không cần quá nhiều thông tin nguồn gốc từ đâu. Chỉ cần hiện nó là
> được. Sắp xếp các thông tin gọn gàng, ngăn nắp."* — 26/08/2026

Đây là phản hồi về **story 5-3**, không phải về 6-7: chồng khẳng định bày trọn xuất xứ trên từng
dòng — ba dòng chữ cho mỗi giá trị, sáu chồng một người. FR-1/FR-2 buộc mọi khẳng định MANG nguồn;
chúng không buộc màn phải BÀY nguồn mọi lúc. Đổi hình bày, giữ nguyên dữ liệu:

| Trước | Sau |
|---|---|
| mỗi dòng: giá trị + `tầng · tin cậy · xuất xứ` + `người ghi · lúc` | mỗi dòng: **giá trị**, xuất xứ lùi vào sau một cú bấm (`<details>` của trình duyệt, không thêm `useState` nào) |
| chữ *"chính thức / tồn nghi"* trên mỗi dòng | bỏ — tầng đã mã hoá bằng **nét đứt + vân chéo** (`DESIGN.md:174`), mắt thấy rồi |
| *"Nhiều giá trị cùng đúng…"* in trên mọi chồng nối tiếp | chỉ in khi chồng THẬT SỰ có nhiều dòng |
| khối tóm tắt mang tầng, tin cậy, và dòng *"ai ghi · lúc nào"* | bỏ cả ba — xuất xứ ở dưới, cách một cú bấm |

**Dấu duy nhất còn lại trên dòng gọn là `ĐANG GIỮ`** — nó nói giá trị nào đang sống trong một chồng
mâu thuẫn, thứ nét đứt không nói được.

Kèm theo: `dongXuatXu` thành mã chết ngay khi khối tóm tắt thôi mang xuất xứ, nên **gỡ hẳn cùng
hai bài test của nó** — đúng phát hiện `laLoaiChon` của lượt review 6-1 (một hàm có test mà không
ai gọi thì bài test ấy xanh cả khi sản phẩm rẽ nhánh sai).

### Story này gần như không viết mã mới — nó thôi vứt mã cũ

`getPerson` đã tính trọn `card` và `relations` từ Đợt 1. `xemHoSo` giữ bốn trường và bỏ hai, ngay
trước khi tới panel. Phần lớn story là gỡ chỗ bỏ ấy và dịch sang hình của tầng component.

Không lượt đọc nào thêm, không truy vấn nào thêm, không trạng thái client nào mới.

### Cái bẫy đã sập, và `tsc` đứng nhìn

Bản đầu thêm `tieuSu`/`quanHe` vào `HoSoPanel` dưới dạng **optional** — vì trạng thái `loiDoc`
(`cay-client.tsx:149`) dựng một hồ sơ chỉ gồm tên giả và cờ lỗi, không có gì để mang. Rồi tôi
quên truyền chúng ở `setHoSo` của nhánh thành công.

`tsc` xanh. `eslint` xanh. 262 bài test xanh. `build` xanh. Và **khối tóm tắt không bao giờ
hiện** — story giao đúng một thứ: không có gì.

Bắt được bằng cách đọc lại chỗ gọi, không bằng cổng nào. Đúng bài học của lượt review 6-1 (*"prop
mới thì để BẮT BUỘC"*), chỉ khác là ở đây `loiDoc` làm cho "bắt buộc" không dùng được. Đã ghi
thẳng vào chú thích của trường ấy: thêm nơi gọi thứ hai thì kiểm bằng mắt, đừng trông vào trình
biên dịch.

### Ba chỗ cố ý KHÔNG làm

- **Không dựng lại chuỗi `lifespan`.** Nó là chuỗi core dựng sẵn và mang luật FR-37 (người còn
  sống chỉ hiện NĂM). Ghép lại từ `birthDate`/`deathDate` ở tầng trên là dựng lại một luật đã có,
  ở đúng chỗ nhạy cảm nhất.
- **Đời và chi không bấm được.** Chúng tính lúc đọc (AD-5), không có hàng nào để sửa. Bày chúng
  như bấm được là hứa một thứ không tồn tại — nên chúng không gạch chân và mang màu chữ phụ.
- **Nhóm quan hệ rỗng thì vắng hẳn.** "Chưa có con" là một câu về một người thật, và bàn tu phả
  không cần phần mềm nhắc chuyện ấy mỗi lần mở một hồ sơ.

### Chữ tin cậy lấy nguyên của `MotDong`

`chính thức` / `tồn nghi` + `NHAN_TIN_CAY` — đúng chuỗi từng dòng của chồng khẳng định đang dùng.
Đặt cách gọi thứ hai cho cùng một thứ là dạy người vận hành rằng đây là hai thứ khác nhau.

### CHƯA kiểm được — cần mắt người

1. **Cột 382.5px**: khối tóm tắt + ba hàng chip có đẩy chồng khẳng định khỏi tầm nhìn không (AC 18).
   Đây là thứ đáng nhìn đầu tiên.
2. Dòng tóm tắt có xuống dòng xấu khi tên chi dài không (`flex-wrap` đã đặt, chưa ai đo).
3. Chip quan hệ bấm vào có dời tâm mượt không, hay canvas chớp.
4. Người ngoài bán kính riêng tư: `quanHe` vẫn hiện mà `chong` thì không — có đọc ra nghĩa không,
   hay trông như màn hỏng nửa chừng.
