---
baseline_commit: ff8ea7e
---
# Story 6.7: Hồ sơ đầy đủ ở cột phải

Status: in-progress

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

4. ~~Ngay dưới `<h2>` tên: một dòng gồm **năm sinh–năm mất · đời · chi**~~ — **ĐẢO 26/08 sau
   code review.** Dòng dẫn xuất chỉ còn **đời · chi**: chồng *Sinh* ngay dưới nói đúng chuyện
   năm sinh, nên bày cả hai là in một thứ hai lần. Lượt sửa đầu ghi đè `lifespan: ''` tại nơi
   gọi mà KHÔNG gỡ đường ống — cả chuỗi sáu tầng vẫn còn và bốn bài test chỉ soi mã chết. Nay gỡ
   hẳn. Còn nguyên văn AC cũ:, ngăn bằng `·`. Thiếu phần
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

13. ~~Mỗi mục tóm tắt có khẳng định tương ứng thì bấm được để mở biểu mẫu của chồng ấy~~ —
    **ĐẢO 26/08 cùng lý do với AC 4.** Sau khi `lifespan` rời dòng dẫn xuất, dòng ấy chỉ còn đời
    và chi — hai thứ **không có chồng nào** (AD-5), nên không còn gì để bấm. Trường `khoaChong`
    (được tính, có test riêng, không nơi nào đọc) đã gỡ cùng lượt. Nguyên văn AC cũ: — không bắt người vận hành tự tìm chồng dưới.
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

### Review Findings

Code review 26/08/2026 — ba tầng đối kháng độc lập, **cả ba đều có trình duyệt** (`scripts/soi-man.mjs`),
lượt review đầu tiên của dự án làm được điều đó. Mức nghiêm trọng do người điều phối tự chấm sau
khi mở mã và tự đo lại.

**Bốn cổng xanh với TOÀN BỘ danh sách dưới đây.**

- [x] [Review][Patch] **Chip quan hệ xoá sạch dấu TỒN NGHI — cùng một khẳng định vẽ hai kiểu trong cùng một cột** — `CHIP` là `border` nét liền; chỗ DUY NHẤT vẽ `border-dashed van-ton-nghi` là `GiaTri`, mà hàng có chip thì không đi qua đó. Đo được: chip `Nguyễn Quang Vinh` → `solid`/`none`; cùng khẳng định ấy trong `<details>` → `dashed`/`repeating-linear-gradient(135deg)`. Phả hiện có 40/40 khẳng định tồn nghi: `Tên` và `Sinh` mang đúng dấu, ba hàng quan hệ thì không. Một lời khai chưa ai đối chiếu nói bằng giọng của sự thật đã chốt. [components/admin/cot-khang-dinh.tsx:138,400,608]
- [x] [Review][Patch] **Hàng Con: không tầng, không nguồn, và không có lối nào tới nguồn** — `HangChip` cố ý không có `<details>`, nên từ phiếu người cha không có bất kỳ đường nào xem ai khai, khai từ đâu, tầng nào. Muốn kiểm phải dời tâm sang đứa con và mất chỗ đang đứng. [components/admin/cot-khang-dinh.tsx:387-415]
- [x] [Review][Patch] **Bấm chip dời tâm rồi bỏ người vận hành vào cột TRỐNG** — đo trên trình duyệt: URL đổi sang `?neo=…`, cột phải hiện *"Chọn một người trên cây…"*. `page.tsx` gắn `key={anchorPersonId}` ⇒ `chonId` về `null`. AC 10 gọi đây là "đường điều hướng nhanh nhất trong cả bàn làm việc". [app/admin/cay/cay-client.tsx:190-191,261]
- [x] [Review][Patch] **AC 13 KHÔNG đạt, T5 tích khống, `khoaChong` là mã chết CÓ TEST** — `DongDanXuat` là một `<p>` chữ chết: không `<button>`, không `onClick`, không đọc `m.khoaChong`. Trường ấy được tính và có bài test riêng chốt `['birth', null, null]`, không nơi nào trong sản phẩm gọi. Đúng lớp lỗi `laLoaiChon` mà chính § Completion Notes của story này viện dẫn làm bài học đã học. [components/admin/cot-khang-dinh.tsx:368-375; components/admin/tieu-su.ts:32]
- [x] [Review][Patch] **Đường ống `lifespan` chết trọn vẹn, và AC 4 bị đảo trong IM LẶNG** — `cot-khang-dinh.tsx:370` ghi `{...hoSo.tieuSu, lifespan: ''}` ngay tại nơi gọi DUY NHẤT, xoá trắng đúng trường mà sáu tầng plumbing được dựng để mang. Kéo theo: nhánh `lifespan` của `dongTieuSu` không bao giờ chạy, và **bốn trên sáu bài test của nó chỉ soi mã chết** — kể cả bài mang tên *"người còn sống: lấy NGUYÊN chuỗi của core"* (FR-37). AC 6 và AC 7 được đảo đúng cách (gạch + ghi ngày); AC 4 thì không. [components/admin/cot-khang-dinh.tsx:370]
- [x] [Review][Patch] **Chip là TẤT-CẢ-HOẶC-KHÔNG ⇒ hàng bày THIẾU người** — chú thích hứa *"vắng chip không được biến thành vắng thông tin"*, nhưng lối thoát chỉ mở khi `chip.length === 0`. Có MỘT phần thì `coChip` bật và cả `chong.dong` bị vứt khỏi hàng. Hai ca thật: `relations` và `stacks` lọc theo hai luật khác nhau (mẹ ngoài bán kính ⇒ hàng bày một cha mẹ, im lặng); và `bestEdge` dedupe theo `childId|parentId` nên *"con ruột"* + *"con nuôi"* cùng một cặp gộp thành MỘT chip trong khi `xepChong` giữ cả hai. [components/admin/cot-khang-dinh.tsx:495]
- [x] [Review][Patch] **Nét đứt gán NHẦM TRỤC** — `DESIGN.md:171-174` gán nét đứt + vân chéo cho **MỨC TIN CẬY** (bảng ba hàng `chắc chắn` · `theo lời kể` · `tồn nghi`); mã nhánh theo `dong.chinhThuc`, tức **TẦNG**. Hệ quả: `Tầng chính thức` + `tinCay: 'ton-nghi'` vẽ nét liền dù spec đòi nét đứt, và hai mức `chắc chắn` / `theo lời kể` không phân biệt được ở bất kỳ đâu trên mặt phiếu — trong khi `EXPERIENCE.md:397` nói sàn ấy tồn tại để phủ FR-2. *Có từ story 5-3, nhưng 6-7 viết lại đúng đoạn này.* [components/admin/cot-khang-dinh.tsx:426]
- [x] [Review][Patch] **Nhãn hàng MÂU THUẪN gãy làm hai dòng, và cổng tự dựng mù với nó** — nhánh mâu thuẫn nhét `<TriangleAlert>` + `gap-1` vào CHÍNH hộp `w-[72px]` đã đo cho nhãn dài nhất: còn `72 − 17 − 4.25 = 50.75px`, mà *"Giới tính"* @15px semibold = 63px. `gender` là `DON_TRI: true` nên ca này tới được bằng đúng một lượt ghi lại giới tính. `soi-man.mjs:144` chỉ báo khi cao > 50px, mà `min-h-11` = 46.75px ⇒ cổng in `gãy dòng: không có ✓` trong khi nhãn đã gãy. [components/admin/cot-khang-dinh.tsx:128,571]
- [x] [Review][Patch] **`<details>` gập lại nuốt biểu mẫu đang gõ dở, rồi nút cuối phiếu xoá không hỏi** — `moGhi` là state React, đóng/mở `<details>` là state của trình duyệt; hai thứ không biết nhau. Mở tam giác → *Ghi thêm năm sinh* → gõ dở → gập tam giác → biểu mẫu biến khỏi màn nhưng `moGhi` vẫn `'birth'` → cuối phiếu vẫn là nút, bấm vào ⇒ unmount, mất sạch chữ đã gõ. [components/admin/cot-khang-dinh.tsx:198,346,644]
- [x] [Review][Patch] **Neo hàng Con trượt xuống đáy đúng ở THUỶ TỔ** — người không có cha mẹ được chép thì `chong` không có `parent-child` (AD-18: khẳng định thuộc về NGƯỜI CON); vợ chưa được chép tên thì cũng không có `union-partner`. Khi ấy `neo === -1` và `neoPhu === -1` ⇒ Con xuống sau cả `place` và `note` — đúng cái hỏng module tự khai là sinh ra để sửa, và nó rơi vào người mà danh sách con gần như là toàn bộ hồ sơ. Test đang chốt hành vi này như thể đúng. [components/admin/phieu-ly-lich.ts:40-42]
- [x] [Review][Patch] **`cay-client.tsx:135` nhánh `catch` thiếu `loiDoc: true`** — mạng đứt ⇒ cột in *"Chưa có khẳng định nào sống về người này"* kèm nút Ghi thêm, cho một hồ sơ CHƯA đọc được: đường thẳng tới một khẳng định trùng. Nhánh `!res.ok` ngay dưới đặt đúng, kèm 8 dòng chú thích giải thích vì sao. Có từ `607f9a2`, nhưng story này là story dựng lại ba trạng thái ấy. [app/admin/cay/cay-client.tsx:135]
- [x] [Review][Patch] **`core/seed/ops.ts` lấn phạm vi, làm lệch một tài liệu, và xoá mất phép phân biệt hai lượt nạp** — hunk sửa xuất xứ lượt nạp CSV không có trong § Phạm vi, § Tasks, § Dev Notes, § File List hay § Completion Notes (chỉ commit message khai). `docs/phieu-khai-gia-pha.md:143` nay nói sai. Và `luc` chỉ có NGÀY, nên hai lượt nạp cùng ngày cho ra câu nguồn giống hệt nhau từng chữ — số dòng từng là mục duy nhất tách được hai lượt, mà gỡ một lượt nạp sai là đi loại từng khẳng định ở đúng cột này. [core/seed/ops.ts:261]
- [x] [Review][Patch] **Hồ sơ story khai sai LẦN THỨ HAI, cùng lớp lỗi lượt 6-1 vừa bắt** — § Debug Log ghi *"260/260, +6 THUẦN"*, chạy thật **285/285, +31** (commit message ghi đúng, story thì không). § File List thiếu **ba** file: `phieu-ly-lich.ts` · `phieu-ly-lich.test.ts` · `core/seed/ops.ts`. *"`tieu-su.test.ts` — 8 bài"* thật ra **10**. § Testing không có một dòng nào cho 21 bài của `phieu-ly-lich`. § Quyết định hình thức chốt *"chồng khẳng định nằm dưới KHÔNG ĐỔI GÌ"* trong khi file ấy đổi 594 dòng.
- [x] [Review][Patch] **Bốn chỗ chú thích và số đo nói về một bản đã bị thay** — khối chú thích mồ côi ở `phieu-ly-lich.ts:65-79` mở bằng *"MỘT dòng nguồn"* và có mục *"vì sao gộp hai dòng thành một"*, ngay trên khối thật nói *"tách làm HAI hàng"* · `:93` bảo *"phép bỏ trùng thôi cần tới"* trong khi `:100` vẫn chạy và test vẫn chốt nó · `cot-khang-dinh.tsx:734` trỏ `§ dongNguon` (hàm tên `hangNguon`) và nói *"MỘT dòng nguồn, không ba"* khi nó trả hai · `tieu-su.ts:11` ghi cột **382.5px**, đo thật **360px**, và AC 18 cũng ghi 382.5px.
- [x] [Review][Patch] **Ba chỗ nhân bản mà chính repo có chú thích cấm** — `NHAN_TIN_CAY` chép lần thứ hai trong cùng thư mục (`phieu-ly-lich.ts:50` vs `the-nguoi.tsx:69`) · nhãn `'Cha mẹ'`/`'Vợ chồng'` viết cứng lần thứ **ba** (`cot-khang-dinh.tsx:290`, sau `core/person/chong.ts:64` và `loai-ghi-them.ts:34`) — mà `loai-ghi-them.ts:32` cảnh báo đúng chuyện này · `gonGiaTri` sống trong `tieu-su.ts` dù không dính gì tới tiểu sử, buộc `cot-khang-dinh.tsx:679` phải chỉ đường sang một module chẳng liên quan.

- [x] [Review][Defer] Chip cho người ẩn danh: N nút giống hệt nhau + UUID thật vào URL [components/admin/cot-khang-dinh.tsx:400] — deferred, KHÔNG tới được trên bề mặt B (`visibilityFor:75` trả `'full'` cho admin/branch-head với mọi người); sẽ cắn nếu phiếu được tái dùng ở bề mặt A
- [x] [Review][Defer] `đời 0` / `đời -1` in thẳng dưới tên khi có người kết hôn vào họ mà cha được chép [components/admin/tieu-su.ts:45] — deferred, theo nếp cả repo (`app/(pha)/nguoi/[id]/page.tsx:61` cùng phép), không phải lỗi story này sinh ra
- [x] [Review][Defer] `chipKhongChong` là nhánh gần như chết, và nếu sống thì `chenHangCon` đẩy Cha mẹ/Vợ chồng xuống sau Ghi chú [components/admin/cot-khang-dinh.tsx:227] — deferred, chỉ tới được khi hai luật lọc tách nhau
- [x] [Review][Defer] Hàng Con phình theo số con (109px với hai đứa, ~250px với năm) [components/admin/cot-khang-dinh.tsx:387] — deferred, cần một quyết định hình (cuộn ngang? gập sau N?) chứ không phải một lượt vá


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

**Sau lượt vá code review 26/08:**

`npm run lint` sạch · `npx tsc --noEmit` sạch · `npx vitest run` **286/286** · `npm run build`
xanh, 36 route.

Bài test thuần của story: `tieu-su.test.ts` **5** · `phieu-ly-lich.test.ts` **27** — cộng các
bài sẵn có của `loai-ghi-them`/`quan-he-ghi-them`. (§ Debug Log bản trước ghi *"260/260, +6
THUẦN"*; con số ấy sai ngay lúc viết — chạy thật khi ấy là 285. Lượt review bắt được.)

### Completion Notes List

Xem § Completion Notes.

### File List

**Mới**
- `components/admin/tieu-su.ts` — module thuần: dựng mục tóm tắt, quyết mục nào bấm được
- `components/admin/tieu-su.test.ts` — 8 bài

**Mới (bổ sung sau review — bản trước thiếu ba file)**
- `components/admin/phieu-ly-lich.ts` + `.test.ts` — phần thuần của phiếu: `chenHangCon` ·
  `hangNguon` · `hienGiaTriTrongChiTiet` · `gonGiaTri` · `NHAN_TIN_CAY`

**Sửa**
- `app/admin/cay/actions.ts` — `xemHoSo` thôi vứt `card` và `relations`
- `components/admin/cot-khang-dinh.tsx` — dựng lại phần vẽ thành phiếu hai cột
- `app/admin/cay/cay-client.tsx` — truyền `doiTuongId`, mở hồ sơ của neo khi vào màn
- `components/admin/the-nguoi.tsx` — thôi giữ bản `NHAN_TIN_CAY` thứ hai
- `core/person/index.ts` + `read-ops.ts` — `PersonAssertion.doiTuongId` (vá review)
- `core/seed/ops.ts` + `docs/phieu-khai-gia-pha.md` — xuất xứ CSV thôi mang số dòng

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
