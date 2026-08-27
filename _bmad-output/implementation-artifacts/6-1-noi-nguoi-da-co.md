---
baseline_commit: 607f9a27ffa8f983d628f53fada3657bf54c7e6a
---
# Story 6.1: Nối hai người đã có trong phả

Status: in-progress

## Story

Là **người trong ban tu phả**,
tôi muốn **nói được "người này là con của người kia" cho hai người ĐÃ CÓ trong phả**,
để **hai mảnh rời tìm lại được nhau ngay tại bàn làm việc, không phải sửa bảng tính rồi gieo lại**.

## Bối cảnh: con bug này không phải giả định, nó đang nằm trong phả

Tối 25/08/2026, lần đầu mở bản Epic 5 trên dữ liệu thật, cây gia phả **gãy làm hai mảnh**:

```
Nguyễn Quang Trung → Nguyễn Quang Vinh ⚭ Mai Thị Tý → Nguyễn Quang Hải ⚭ Quản Thị Huyền → Nguyễn Gia Linh
Nguyễn Quang Hiệp ⚭ Kiều Thị Thanh Nga → Nguyễn Kiều Anh · Nguyễn Quang Anh          ← rời hẳn
```

Thiếu đúng **một cạnh**: Hiệp → Vinh. Và **không có một đường nào trong toàn bộ bàn làm việc để
ghi nó**:

- `LOAI_GHI_THEM` (`components/admin/loai-ghi-them.ts:13`) có sáu loại, **không có** `parent-child`
  lẫn `union-partner`.
- `themNguoi` (5-4) chỉ tạo **người MỚI** theo một hướng — không trỏ được vào người đã có.
- `/admin/hop-nhat` (3-4) là **gộp hai bản ghi trùng của cùng một người**, không phải nối hai
  người khác nhau.

Đường duy nhất còn mở là sửa **bảng tính** rồi chạy lại `seed-from-sheet.ts` — tức phải đi ra
ngoài sản phẩm để sửa một thứ bên trong sản phẩm.

Chú thích đầu `loai-ghi-them.ts` đã khai ra chỗ này từ story 5-6 rồi để trống chủ:

> *"`parent-child` và `union-partner` cần chọn một NGƯỜI KHÁC làm đối tượng — đó là một bộ chọn
> người, không phải một ô nhập, và nó thuộc về 5-4 hoặc màn Mảnh chưa nối."*

Story này nhận.

## Tiền đề đã có sẵn — đọc trước khi định dựng lại

**Core đã đủ. Story này KHÔNG cần một hàm core mới.**

- `addAssertionOp` (`core/assertion/ops.ts:314`) đã nhận cả hai loại, đã kiểm đầy đủ:
  `parent-child` chặn tự làm cha mình + `requireLivePersonRow(parentId)` (`:360-365`);
  `union-partner` chặn tự kết hôn với mình, nhận `partnerId` **hoặc** `unionId` có sẵn (`:366-378`).
- `AssertionSpec` (`core/assertion/index.ts:55-56`) — `parent-child` còn mang sẵn
  `relation?: 'blood' | 'adopted' | 'heir'`.
- **Bề mặt ĐỌC đã xong.** `core/person/chong.ts` đã khai `parent-child` = *"Cha mẹ"* hạng 4 và
  `union-partner` = *"Vợ chồng"* hạng 5 (`:65-66`, `:83-84`), cả hai `DON_TRI = false` ⇒ chồng
  **nối tiếp**. `core/person/read-ops.ts:306-313` đã dựng câu người đọc được: *"là con của X"*.
  Chồng ấy hiện ra ngay khi có dữ liệu — **thiếu đúng đường ghi**.
- `searchPersons` (`core/tree/index.ts:184`) tự giải người xem và lọc theo bán kính riêng tư
  (AD-13/AD-21). Ô tìm trên thanh trên đã dùng nó.
- `loaiKhangDinh(assertionId, ghiChu)` (`app/admin/cay/actions.ts:61`) đã loại được **mọi** loại
  khẳng định — kể cả quan hệ. Đường gỡ cạnh sai đã có, chỉ cần chồng hiện ra để bấm.

## Acceptance Criteria

### Bộ chọn người — dựng theo đúng nếp `ChonNoi`

1. Component mới `components/admin/chon-nguoi.tsx`, **module client thuần**, KHÔNG import
   `@/core/*` (`docs/build-contract.md § Phân tầng`).
2. Gõ tự do → gọi `onTim(tu khoá)` → bày ứng viên. Không ứng viên nào **được chọn sẵn** — bot gợi
   ý, không bao giờ tự quyết (`EXPERIENCE.md § Component Patterns`).
3. Mỗi dòng ứng viên bày **họ tên + đời + chi**, không bao giờ chỉ tên. Cùng lý do FR-65 bắt nơi
   phải kèm đơn vị cha: hai người trùng tên trong một dòng họ là chuyện thường.
4. Giữ **từ khoá cạnh kết quả** (`{ khoa, ds }`) rồi suy ra trạng thái *"đang tìm"* — không
   `setState` trong thân effect. Đây là cái bẫy `set-state-in-effect` repo đã vấp **ba lần**
   (5-1 → 5-3 → 5-7); nếp đã chốt, đừng vấp lần thứ tư.
5. Hai lượt tìm về **sai thứ tự** không được ghi đè nhau: lượt chậm về sau bị bỏ. Repo đã giải bài
   này ở `khung-admin.tsx` và `chon-noi.tsx` — dùng lại, đừng nghĩ cách thứ ba.
6. Đọc hỏng ≠ không có ai: `searchPersons` trả `err` thì nói *"chưa đọc được"*, KHÔNG nói *"không
   tìm thấy ai"*. (Lỗi #25 của lượt review Epic 5, đã vá một lần ở ô tìm.)
7. Escape đóng danh sách; đi được bằng phím mũi tên; có `role="listbox"`/`aria-activedescendant`
   và một vùng `aria-live` báo số kết quả. Nợ combobox của 5-1 trả ở đây.

### Hai loại mới trong biểu mẫu ghi thêm

8. `LOAI_GHI_THEM` thêm `'parent-child'` và `'union-partner'`. `NHAN_LOAI`: **"Cha mẹ"** và
   **"Vợ chồng"** — đúng nhãn `chong.ts` đã dùng, không đặt nhãn thứ hai cho cùng một thứ.
9. `KIEU_O` của cả hai là `'nguoi'` — bộ chọn, không phải ô nhập. Đúng cách `place` đã làm.
10. Xoá đoạn chú thích *"Vì sao chỉ SÁU trong tám"* ở đầu `loai-ghi-them.ts` và thay bằng ghi chú
    mới. Để lại một câu nói dối về chính file ấy là đúng cái tội AC 19 của 5-1 sinh ra để chặn.
11. `kiemGiaTri` không đi qua hai loại này (giống `place`): giá trị là một `personId` đã chọn.

### Hai nơi gọi — và cái bẫy đã có tiền lệ

`CotKhangDinh` dựng `<BieuMauGhiThem>` ở **hai chỗ**: nút *"Ghi thêm thông tin"* cấp cột
(`:172-180`, cho người chưa có khẳng định nào) và nút *"Ghi thêm"* trong từng chồng (`:287-295`).

11b. Props mới (`onGuiQuanHe`, `onTimNguoi`) phải **BẮT BUỘC**, không `?:`. Quên truyền ở một
    trong hai nơi gọi thì phải là lỗi `tsc`, không phải một nút im lặng không làm gì. Đây đúng
    cách C2 của Epic 5 được vá: *"`ThaoTacXinVaoPha` nhận prop `khoa` bắt buộc… `tsc` bắt ngay nơi
    gọi thứ hai đúng như thiết kế."*
11c. Thêm hai loại vào `LOAI_GHI_THEM` làm `ghiThemDuoc('parent-child')` thành `true` ⇒ nút
    *"Ghi thêm"* **tự mọc** trên chồng *Cha mẹ* với `loaiCoDinh = 'parent-child'`. Biểu mẫu ở chế
    độ `loaiCoDinh` **vẫn phải hỏi hướng** — người bấm từ chồng *Cha mẹ* của P có thể đang muốn
    thêm mẹ cho P, mà cũng có thể đang muốn thêm con. Không đoán.

### Hướng quan hệ — chỗ dễ sai nhất của story

12. `parent-child` **có hướng**: khẳng định mang `subject = con`, `object = cha/mẹ`. Nên khi đang
    mở hồ sơ người **P** và chọn loại *Cha mẹ*, biểu mẫu phải hỏi rõ **hai hướng**:
    - *"Người vừa chọn là **cha/mẹ** của P"* ⇒ `addAssertion(P, { parentId: đãChọn })`
    - *"Người vừa chọn là **con** của P"* ⇒ `addAssertion(đãChọn, { parentId: P })`
13. Hướng phải đọc ra nghĩa **thành câu**, không phải hai nút *"lên"/"xuống"*. Bày thẳng câu sẽ
    được ghi: *"Nguyễn Quang Vinh là cha của Nguyễn Quang Hiệp"* — người vận hành đọc câu ấy rồi
    mới bấm.
14. `union-partner` **không có hướng** (đối xứng) ⇒ không hỏi.
15. `relation` của `parent-child` chọn được: **ruột · nuôi · thừa tự** (`'blood'|'adopted'|'heir'`),
    mặc định **ruột**. Phả cổ có chép cả ba; schema đã đón sẵn; không bày ra thì nó là mã chết.

### Ghi

16. Server action mới trong `app/admin/cay/actions.ts` — theo đúng hình của `ghiThemNoi`
    (`:241`): nhận `personId`, `nguoiKiaId`, hướng, `relation`, `xuatXu`; gọi `addAssertion`;
    `xuatXu` rỗng ⇒ `invalid` *"Chưa ghi nghe được điều này từ đâu."*
17. Action **KHÔNG tự gác quyền** — `addAssertionOp` đã có `gateWriter`. AD-24: core đọc danh tính
    từ session, adapter không truyền vai vào.
18. `revalidatePath` như `ghiThemKhangDinh` (`lamMoiSo()`): số trên thanh việc và cây phải đổi
    theo. Ba lối ghi của Epic 5 từng quên đúng chỗ này (#33 của lượt review).
19. Lối gửi bọc `try/catch/finally`, và nút **"Thôi" KHÔNG `disabled`** khi đang gửi. Đây là bài
    học C6 + lượt review thứ hai: `finally` không cứu được một lượt gửi treo, "Thôi" thì cứu được.
20. Ghi xong: biểu mẫu **đóng**, chồng **nạp lại ngay** (`napHoSo`), và **canvas vẽ lại** để người vừa ghi thấy hệ quả — và cạnh mới hiện trên hình. Không dựng dòng chữ *"đã ghi xong"* (nếp 5-4/5-6: xác nhận bằng hệ quả).
21. Ghi hai lần cùng một cặp ⇒ hai khẳng định, và chồng **nối tiếp** bày cả hai. Đó là đúng mô
    hình (AD-9/AD-18), không phải lỗi — **không** dựng luật chặn trùng ở tầng này.

### Gỡ cạnh sai

22. Chồng *Cha mẹ* / *Vợ chồng* trong cột phải có nút **"Loại giá trị này"** như mọi chồng khác,
    nối vào `loaiKhangDinh` đã có. Không có nút xoá — AD-4: hàng ở lại nhật ký.
23. Loại xong, canvas vẽ lại **không còn cạnh ấy**, và người bị tách ra không được biến mất khỏi
    danh sách node (bài học AC 8 của 5-2: lọc người ra khỏi cây là làm THỦNG cây).

### Riêng tư và sàn không được hạ

24. Bộ chọn KHÔNG được bày người ngoài bán kính riêng tư — `searchPersons` đã lọc, **đừng thêm một
    đường đọc thứ hai** đi vòng qua nó (AD-13, AD-21).
25. Sàn chạm **44px**, sàn chữ **17px** trên mọi thành phần mới. Chật thì bớt mục, **không thu
    chữ**. Cột phải khai `w-[360px]` tường minh nên nó đúng 360px; lưu ý chung vẫn đúng cho mọi
    lớp Tailwind theo `rem` — gốc `html { font-size: 17px }` (`globals.css:187`) nên `w-90` là
    **382.5px**, không phải 360px.
26. Không phân biệt chỉ bằng màu. Không đổ bóng (`DESIGN.md § Elevation & Depth`).
27. Không xưng hô ngôi hai, kể cả chữ *"bạn"* (`EXPERIENCE.md § Voice and Tone`).

### Nghiệm thu trên phả thật

28. Mở `/admin/cay`, chọn `Nguyễn Quang Hiệp`, chọn *Cha mẹ* → tìm `Vinh` → chọn
    `Nguyễn Quang Vinh` → hướng *"là cha của"* → xuất xứ *"bảng tính gia phả"* → ghi.
    **Hai mảnh phải thành một**, và `getNeighborhood` quanh Hiệp ở bán kính 2 phải chạm tới Trung.

## Phạm vi — KHÔNG thuộc story này

- **Màn Mâu thuẫn** và phép phát hiện *"hai người cùng khai là cha"* — story 6-5. Ở đây
  `parent-child` vẫn là chồng **nối tiếp** như `chong.ts` đang xếp.
- **Trao vai cho tài khoản** — story 6-2.
- **Gộp/tách nơi** — story 6-4.
- **Kéo thả thật từ cạnh node** — nợ từ 5-4, vẫn hoãn; nút vẫn cho cùng kết quả với một phần chi phí.
- **Sửa `create-admin.ts` để nhận năm sinh** — việc riêng, đã ghi trong `sprint-status.yaml`.

## Tasks / Subtasks

- [x] **T1** Dựng `components/admin/chon-nguoi.tsx` theo hình `chon-noi.tsx` (AC 1–7)
  - [x] Props: `daChon`, `onChon`, `onTim` — không import `@/core/*`
  - [x] Giữ `{ khoa, ds }`; bỏ lượt về sai thứ tự; phân biệt "đọc hỏng" với "không có ai"
  - [x] Ngữ nghĩa combobox đầy đủ + Escape + `aria-live`
- [x] **T2** Mở `LOAI_GHI_THEM` cho hai loại quan hệ (AC 8–11)
  - [x] Thay chú thích "Vì sao chỉ SÁU trong tám" bằng ghi chú đúng hiện trạng
- [x] **T3** Hướng quan hệ trong `bieu-mau-ghi-them.tsx` (AC 12–15)
  - [x] Bày câu sẽ được ghi, không bày hai nút lên/xuống
  - [x] Bộ chọn `relation`: ruột · nuôi · thừa tự
- [x] **T4** Server action `ghiThemQuanHe` trong `app/admin/cay/actions.ts` (AC 16–21)
  - [x] `try/catch/finally` ở lối gửi; nút "Thôi" không `disabled`
  - [x] `lamMoiSo()` sau khi ghi
- [x] **T5** Nối chồng *Cha mẹ* / *Vợ chồng* vào nút "Loại giá trị này" (AC 22–23)
- [x] **T6** Thêm mục vào `components/admin/man-admin.ts` nếu story sinh màn mới — **story này
      KHÔNG sinh màn mới**, nên `chrome.test.ts` phải xanh không cần sửa. Xác nhận điều đó.
- [x] **T7** Test (xem § Testing)
- [x] **T0** `AGENTS.md`: đọc `node_modules/next/dist/docs/` cho phần mình sắp viết **trước khi
      viết** — story này chạm server action + `revalidatePath`. Đây là bản Next đã có breaking
      changes so với thói quen cũ (`docs/next16-delta.md`).
- [x] **T8** Chạy `npm run lint` (KHÔNG phải `npx eslint app components`) · `npx tsc --noEmit` ·
      `npx vitest run` · `npm run build`
- [x] **T9** Nghiệm thu trên phả thật (AC 28) — xong 26/08, xem § Nghiệm thu AC 28

### Review Findings

Code review 26/08/2026 — ba tầng đối kháng độc lập (Blind Hunter · Edge Case Hunter · Acceptance
Auditor), mỗi tầng một ngữ cảnh riêng. **Mức nghiêm trọng do người điều phối tự chấm sau khi mở
mã tại từng chỗ**, không lấy mức của subagent.

Bảy phát hiện nặng nhất được **hai hoặc ba tầng** tìm ra bằng những đường khác nhau.

- [x] [Review][Patch] **AC 23 nửa sau: người vừa bị tách phải ở lại canvas thêm một lượt, dưới dạng gốc mảnh** — *(chốt 26/08: lối (a))*. Node canvas dựng từ `getNeighborhood(neo, bánKính)`, BFS trên `adjacency` nối từ `parentsOf`/`childrenOf`/`partnersOf` (`core/tree/ops.ts:201-218`), nên gỡ đúng cạnh duy nhất buộc một người vào neo ⇒ họ rơi khỏi bán kính và biến mất ngay trước mắt người vừa gỡ. Bán kính tính đúng — cái sai là để người vận hành mất dấu thứ họ vừa động vào, trong một hệ không có nút hoàn tác. Giữ họ hiện thêm một lượt, đội dấu gốc mảnh, để còn nối lại được nếu gỡ nhầm. [core/tree/ops.ts:201; app/admin/cay/cay-client.tsx]
- [x] [Review][Patch] **Chặn vòng huyết thống ngay trong `ghiThemQuanHe`** — *(chốt 26/08: lối (1), không đợi 6-5)*. `addAssertionOp:361` chỉ chặn tự-làm-cha-mình. Ghi "A là con của B" rồi "B là con của A" đều qua, câu xem trước đọc trôi chảy cả hai lượt; `computeStructure` không treo (`core/tree/ops.ts:284,296`) nhưng `generation` và `branchCode` tính theo nhánh BFS tới trước ⇒ lệch im lặng cho cả mảnh. Trước story này vòng là chuyện không biểu diễn được — nên nó là nợ do chính story này sinh ra, không phải nợ có sẵn. Kiểm bằng bề mặt công khai của `core/tree` (`getAncestryPath`), KHÔNG tự đọc DB từ adapter (AD-1). [app/admin/cay/actions.ts:252]
- [x] [Review][Patch] **Loại một quan hệ vợ chồng chỉ gỡ MỘT NỬA** — union mới sinh HAI khẳng định thành viên (`core/assertion/ops.ts:472-486`, chú thích tại chỗ: *"New union ⇒ TWO membership assertions"*), `rejectAssertionOp:687` xoá đúng một hàng. Hàng của người kia sống tiếp và `read-ops.ts:317-319` in cho họ **"vợ/chồng (chưa rõ với ai)"** vĩnh viễn, cộng một hàng `union` mồ côi. Nhãn nút hứa gỡ QUAN HỆ. [components/admin/cot-khang-dinh.tsx:432]
- [x] [Review][Patch] **Mỗi lượt gỡ quan hệ ghi vĩnh viễn một lý do SAI vào nhật ký** — `'Loại khi giải mâu thuẫn ở bàn làm việc'` gắn cứng, viết khi nút "Loại" chỉ mọc trên chồng mâu thuẫn. Story vừa cho nó mọc trên chồng **nối tiếp** — thứ theo định nghĩa `loaiDuocDuNoiTiep` không bao giờ mâu thuẫn. `rejectAssertionOp` XOÁ CỨNG hàng, nên `note` là lời giải thích DUY NHẤT sống sót (AD-4). [app/admin/cay/cay-client.tsx:383]
- [x] [Review][Patch] **Bộ chọn nói "Chưa có ai tên ấy trong phả" khi ứng viên duy nhất là chính người đang mở hồ sơ** — `trangThaiTim` suy trạng thái TRƯỚC khi `boNguoiNay` lọc, nên `'co'` + `ungVien` rỗng ⇒ rơi vào nhánh "chưa có ai", còn `aria-live` cùng lúc đọc "0 người trùng tên". Đúng lời nói dối mà `tim-nguoi.ts:26-29` viết ba đoạn chú thích để chống, và nó dẫn thẳng tới một bản trùng — thứ chỉ gộp mới gỡ được. [components/admin/chon-nguoi.tsx:56,201]
- [x] [Review][Patch] **`--nam-sinh` bị bỏ lặng lẽ đúng ở ca nó sinh ra để chữa** — `createAdmin` trả sớm ở `:147` khi tài khoản đã có attachment `active`, trước khối `birthYear` ở `:212`. Ca chép trong chính doc-comment mới của script (phả thật 25/08, quản trị ĐÃ tồn tại, cây ĐÃ gãy đôi) chạy lại kèm cờ ⇒ exit 0, một câu bình thản, không khẳng định `birth` nào được ghi. [core/identity/bootstrap.ts:147; scripts/create-admin.ts:109]
- [x] [Review][Patch] **Escape đóng danh sách rồi để lại "Đang tìm…" vĩnh viễn** — xoá `ketQua` mà giữ `tuKhoa` ⇒ `trangThaiTim` trả `'dang-tim'`, effect có deps `[tuKhoa, onTim]` không đổi nên không lượt tìm nào được phát lại. `aria-live` đọc "Đang tìm" cho tới khi gõ thêm ký tự. [components/admin/chon-nguoi.tsx:117]
- [x] [Review][Patch] **Đoạn chữ hứa "chồng khẳng định sẽ hỏi chọn một" hiện cả dưới hai chồng KHÔNG BAO GIỜ hỏi** — `DON_TRI` của cả hai loại quan hệ là `false` (`core/person/chong.ts:45,47`) nên chúng không bao giờ vào trạng thái `mau-thuan`. Ghi nhầm chiều rồi tin lời hứa mà ghi lại cho đúng ⇒ hai cạnh cùng sống, cha con đảo ngược đứng cạnh nhau. [components/admin/bieu-mau-ghi-them.tsx:332]
- [x] [Review][Patch] **Ghi vợ chồng trùng đẻ ra HAI cuộc hôn nhân giữa cùng hai người** — `dungLoiGoiQuanHe` không bao giờ truyền `unionId` dù `AssertionSpec` có sẵn trường ấy, và không tầng nào so xem cặp này đã có union chưa. [components/admin/quan-he-ghi-them.ts:88]
- [x] [Review][Patch] **`onTim` là mũi tên dựng lại mỗi lượt vẽ ⇒ tìm lại theo mỗi lượt vẽ của `CayClient`, và hoàn tác cả lượt Escape** [app/admin/cay/cay-client.tsx:403]
- [x] [Review][Patch] **Hướng "là con của" ghi ra một khẳng định KHÔNG hiện trên panel đang mở** — `subject` là người vừa chọn, mà `getPersonOps:247` chỉ đọc hàng của chính `pid`. Chồng của người đang mở không có dòng nào mới; và lối gỡ mà chính story dựng ra chỉ tồn tại trên panel người kia, không gì chỉ đường tới đó. [app/admin/cay/actions.ts:274]
- [x] [Review][Patch] **`--nam-sinh 0000` sập giữa chừng và để lại một tài khoản auth mồ côi** — chỉ kiểm `/^\d{4}$/`; Postgres không có năm 0 ⇒ ném 22008, tx cuộn lại, nhưng `signUpEmail` đã chạy trước `withClanContext`. Cùng chỗ: `9999` và năm tương lai không tầng nào chặn. [scripts/create-admin.ts:64]
- [x] [Review][Patch] **Người kia bị gộp giữa lúc biểu mẫu đang mở ⇒ câu tiếng Anh của tầng dưới lọt thẳng ra màn tiếng Việt** — *"parent was merged into another person"*, không nói phải làm gì. [app/admin/cay/actions.ts:281]
- [x] [Review][Patch] **Ngữ nghĩa combobox chưa khép kín** — `aria-expanded` là `false` trong khi listbox đang hiện; `<li>` báo "chưa có ai" nằm trong `role="listbox"` mà không mang `role="option"`; `aria-controls` trỏ vào id không tồn tại ở ba trạng thái; `hopRef` khai và gắn nhưng không đọc ở đâu — không có lối đóng bằng bấm ra ngoài. [components/admin/chon-nguoi.tsx:53,147,175,201]
- [x] [Review][Patch] **Con trỏ bàn phím phân biệt CHỈ bằng màu** — `border-foreground bg-ban-nen` vs `border-ban-vien bg-ban-o`, không dấu, không đậm, không đổi độ dày viền. `EXPERIENCE.md § Accessibility Floor` cấm mã hoá trạng thái chỉ bằng màu. [components/admin/chon-nguoi.tsx:184]
- [x] [Review][Patch] **`laLoaiChon` là mã chết có bài test** — không nơi gọi nào ngoài chính test của nó; biểu mẫu rẽ nhánh bằng `KIEU_O` và `laQuanHe`. Bài test ấy xanh cả khi biểu mẫu rẽ sai. [components/admin/loai-ghi-them.ts:62]
- [x] [Review][Patch] **Câu "sẽ được ghi" của vợ chồng không phải hình panel hiện lại** — biểu mẫu hứa *"B và A là vợ chồng."*, panel in *"vợ/chồng với B"*; chú thích ngay trên hàm khẳng định là *"dựng đúng hình mà panel sẽ hiện lại"*. [components/admin/quan-he-ghi-them.ts:99]
- [x] [Review][Patch] **POST `union-partner` thiếu `huong` bị từ chối bằng một câu nói về cha con** — *"Chưa rõ ai là cha, ai là con."*, trong khi `QuanHeMoi.huong` tự chú thích là *"`union-partner` đối xứng nên bỏ qua"*. [app/admin/cay/actions.ts:256]
- [x] [Review][Patch] **Hồ sơ story khai sai changeset ở sáu chỗ, và mọi chỗ đều lệch về cùng một phía** — (1) tiêu đề *"### Core KHÔNG đổi một dòng nào"* trong khi `core/identity/bootstrap.ts` đổi 34 dòng; (2) § File List thiếu đúng ba file `bootstrap.ts` · `identity.test.ts` · `create-admin.ts` — đúng ba file thuộc phần § Phạm vi tuyên bố là ngoài phạm vi; (3) năm ô `[x]` trong § Testing không có bài test nào tương ứng ở bất kỳ đâu (`ghiThemQuanHe` không có một bài nào); (4) T9 tích `[x]` trong khi § CHƯA kiểm được nói *"chưa ai bấm"*; (5) *"quan-he-ghi-them.test.ts — 18 bài"* đo được **16**, và *"26 bài, tất cả THUẦN"* bỏ qua hai bài chạm database ở `identity.test.ts`; (6) AC 25 đòi sàn 17px trong khi `EXPERIENCE.md` chốt sàn tuyệt đối 15px và mã theo nếp 15px — một lệch so với story chưa khai trong bảng *"Lệch so với story"*.

- [x] [Review][Defer] `timNguoi` cắt còn 8 kết quả im lặng, `searchPersonsOps` trả tới 30 [app/admin/actions.ts:32] — deferred, có từ 5-1
- [x] [Review][Defer] Nợ combobox ghi cho `khung-admin.tsx` vẫn nguyên trong `deferred-work.md` [components/admin/khung-admin.tsx:170-200] — deferred, bộ chọn MỚI có ngữ nghĩa, ô tìm cũ thì chưa
- [x] [Review][Defer] Bộ chọn người thứ hai cũng gọi `timNguoi` — hai cài đặt song song của cùng một control [app/(pha)/loi-ke/thu/chon-nguoi.tsx] — deferred, có từ Đợt 1


## Dev Notes

### Hiện trạng các file sẽ SỬA (đọc trước khi động vào)

| File | Hiện là gì | Story này đổi gì |
|---|---|---|
| `components/admin/loai-ghi-them.ts` | 6 loại, `KIEU_O` 5 hình dạng, chú thích giải thích vì sao thiếu 2 | thêm 2 loại + hình `'nguoi'`; **viết lại chú thích** |
| `components/admin/bieu-mau-ghi-them.tsx` | dispatch theo `KIEU_O` (`:98`), đã có nhánh `'noi'` dùng `<ChonNoi>` (`:139`, `:158`) | thêm nhánh `'nguoi'` + khối hướng quan hệ |
| `app/admin/cay/actions.ts` | `ghiThemKhangDinh` dựng `spec` theo loại (`:182-206`), `ghiThemNoi` (`:241`) | thêm `ghiThemQuanHe` — **không** nhồi vào `ghiThemKhangDinh`: hai loại này có tham số riêng (hướng, relation) |
| `components/admin/cot-khang-dinh.tsx` | `<BieuMauGhiThem>` ở **hai** nơi gọi: cấp cột (`:172-180`) + từng chồng (`:287-295`) | truyền lối ghi mới xuống; chồng quan hệ dùng lại nút "Loại" đã có |

**KHÔNG sửa `core/`.** Nếu thấy mình đang mở `core/assertion/ops.ts` thì dừng lại đọc lại § Tiền
đề — nhiều khả năng đang dựng lại thứ đã có.

### Bộ chọn NGƯỜI khác bộ chọn NƠI ở đúng một chỗ

`ChonNoi` có lối **tạo mới ngay tại chỗ** vì FR-65 cấm chặn luồng nhập. `ChonNguoi` **không có**:
tạo người mới đã là việc của `themNguoi` (5-4), và một biểu mẫu hai công dụng là biểu mẫu dễ bấm
nhầm. Không tìm thấy ai là trạng thái bình thường — câu đúng là *"chưa có ai tên ấy trong phả —
thêm người mới ở nút Thêm người vào phả"*, kèm đường dẫn tới đó.

### Chỗ dễ sai nhất: chiều của khẳng định

`parent-child` có `subject = con`, `object = cha/mẹ` (`core/person/read-ops.ts:306-311` dựng câu
*"là {rel} của {parent}"* từ chính chiều ấy). Ghi ngược chiều **không** sinh lỗi nào — `tsc` xanh,
test xanh, và cây vẽ ra vẫn đẹp, chỉ là cha con đảo nhau. Đây đúng lớp lỗi mà C4 của lượt review
Epic 5 thuộc về: sai âm thầm ở tầng dựng cây.

Nên bài test đầu tiên phải khẳng định **chiều**, không chỉ khẳng định "có một cạnh".

### Học từ Epic 5 mang sang

1. **Bốn cổng xanh không phải xanh với người.** 88 phát hiện của hai lượt review đều đi qua
   `tsc`/`eslint`/`vitest`/`build`. Story này có phần hình ảnh (bộ chọn trong cột 360px) —
   ghi thẳng vào § CHƯA kiểm được thứ mình không nhìn được, đừng tích ô.
2. **`npm run lint`, không phải lệnh hẹp.** `npx eslint app components` từng xanh trong khi lệnh
   đầy đủ đỏ 13 lỗi.
3. **Sửa xong hỏi "còn cửa nào nữa không".** C3 của Epic 5 có **ba** cửa; hai lượt review mới đóng
   hết. Lối ghi quan hệ mới cũng phải hỏi: còn nơi nào ghi được cạnh mà không qua đường này không?
4. **Cảnh báo tính đúng mà không in ra thì bằng không.** Ba chỗ trong bộ nạp khung mắc đúng lỗi ấy.

### Testing

`vitest` chạy `environment: 'node'`, có database thật cho `core/`. Không có e2e (story 6-6 lo).

- [x] `chon-nguoi` — tách phần THUẦN (lọc, xếp, suy trạng thái từ `{khoa, ds}`) ra file riêng để
      test được không cần DOM, đúng cách `ban-doi-the.ts` và `dat-nut-tam.ts` đã làm ở Epic 5
- [x] lượt tìm về sai thứ tự ⇒ lượt chậm bị bỏ
- [x] `searchPersons` trả `err` ⇒ trạng thái "chưa đọc được", KHÔNG phải "không có ai"
- [x] **chiều** `parent-child`: `dungLoiGoiQuanHe` trả đúng `{ personId: con, spec.parentId: cha }`
      (bài thuần; nửa còn lại — hình ấy rơi vào DB đúng chỗ — do `assertion.test.ts` ghim từ 1-2)
- [ ] ~~năm ô dưới đây đòi test cho `ghiThemQuanHe`~~ — **`ghiThemQuanHe` KHÔNG có bài test nào.**
      Bản đầu tích cả năm ô; lượt code review 26/08 bắt được. Server action là `'use server'`, cần
      một phiên thật, và repo chưa có tầng test nào cho adapter (`chrome.test.ts` chỉ quét mã
      nguồn). Để TRỐNG chứ không tích — story 6-6 (`do-that-tren-trinh-duyet`) là chỗ đúng của nó.
- [ ] hướng *"là con của"* ⇒ đảo lại đúng
- [ ] `relation` mặc định `'blood'`; chọn `'adopted'` ⇒ ghi đúng
- [ ] tự làm cha mình ⇒ `invalid` (core đã chặn — test khẳng định adapter không nuốt lỗi)
- [ ] `union-partner` với chính mình ⇒ `invalid`
- [ ] `xuatXu` rỗng / toàn khoảng trắng ⇒ `invalid`
- [ ] vai không đủ quyền ⇒ `forbidden` (`gateWriter`)
- [ ] loại một khẳng định quan hệ ⇒ cạnh biến khỏi cây, **người vẫn còn** trong danh sách node
- [x] `chrome.test.ts` vẫn xanh không phải sửa (story không sinh màn mới)

### Project Structure Notes

- `components/admin/` là root component thứ ba, cạnh `components/pha/` và `components/ui/`
  (`specs/frontend-stack.md` đã sửa ở lượt review 5-1).
- Phần thuần tách khỏi component: `chon-nguoi.ts` (thuần) + `chon-nguoi.tsx` (client) — nếp
  `ban-doi-the` / `dat-nut-tam` / `loai-ghi-them`.
- `app/` không import db client/ORM/storage SDK — chỉ `core/` (AD-1).

### References

- [Source: `_bmad-output/planning-artifacts/epics/epics-dot-3.md#Epic 6`] — cắt epic theo động từ SỬA, thứ tự phụ thuộc
- [Source: `_bmad-output/implementation-artifacts/epic-5-retro-2026-08-25.md#Lỗ hổng cấu trúc phát hiện tối nay`] — nguồn của story này
- [Source: `.../ARCHITECTURE-SPINE.md#AD-18`] — quan hệ là khẳng định, không phải cạnh trần; **không module nào được chèn thẳng một hàng quan hệ**
- [Source: `.../ARCHITECTURE-SPINE.md#AD-9`], [`#AD-10`], [`#AD-4`], [`#AD-24`]
- [Source: `.../ARCHITECTURE-SPINE.md#AD-13`], [`#AD-21`] — bán kính riêng tư buộc mọi đường đọc
- [Source: `.../EXPERIENCE.md#Component Patterns`] — "Bot gợi ý, KHÔNG tự quyết"; không cái nào chọn sẵn
- [Source: `.../EXPERIENCE.md#Accessibility Floor`] — 44px, 17px, không phân biệt chỉ bằng màu
- [Source: `.../EXPERIENCE.md#Voice and Tone`] — cấm ngôi hai
- [Source: `components/admin/loai-ghi-them.ts`] — chú thích khai đúng chỗ trống story này lấp
- [Source: `core/assertion/index.ts:50-62`] — `AssertionSpec`, kể cả `relation`
- [Source: `core/assertion/ops.ts:314-380`] — cổng, phép kiểm, chiều
- [Source: `core/person/chong.ts:60-90`] — nhãn và hạng của hai chồng quan hệ (đã có)
- [Source: `components/admin/chon-noi.tsx`] — hình mẫu của bộ chọn
- [Source: `docs/build-contract.md#Phân tầng`] — component client không import `@/core/*`

### Câu hỏi để dành cho sau khi viết xong

1. Chồng *Cha mẹ* đang là **nối tiếp** (cha + mẹ = hai khẳng định cùng đúng). Sau story này người
   vận hành ghi được cạnh sai rồi loại — nhưng trong lúc chưa loại, cây vẽ **cả hai**. Có cần một
   dấu trên canvas nói "người này đang có hai cha" không, hay để 6-5 lo trọn?
2. `relation: 'heir'` (thừa tự) có nên vẽ khác `'blood'` trên cạnh không? Phả cổ phân biệt rõ, mà
   `EXPERIENCE.md` chưa nói gì về hình của cạnh.

## Dev Agent Record

### Agent Model Used

Claude Opus 5 · 25/08/2026.

### Debug Log References

- `npm run lint` — sạch (lệnh ĐẦY ĐỦ, không phải `npx eslint app components`)
- `npx tsc --noEmit` — sạch
- `npx vitest run` — **254/254** (219 trước story ⇒ story thêm **35 bài**)
  - 30 bài THUẦN: `quan-he-ghi-them` 16 · `tim-nguoi` 12 · `loai-ghi-them` +2 ròng
  - 5 bài chạm DATABASE: `assertion.test.ts` 2 (hồi quy code review) · `identity.test.ts` 3
- `npm run build` — xanh, không thêm route nào

### Completion Notes List

Xem § Completion Notes bên dưới.

### File List

**Mới**
- `components/admin/tim-nguoi.ts` — phần thuần: trạng thái lượt tìm, loại người đang mở hồ sơ
- `components/admin/tim-nguoi.test.ts` — 12 bài
- `components/admin/chon-nguoi.tsx` — bộ chọn người (combobox đầy đủ)
- `components/admin/quan-he-ghi-them.ts` — CHIỀU, trọn phép ánh xạ sang `addAssertion`, nhãn,
  câu sẽ ghi, luật nút "Loại"
- `components/admin/quan-he-ghi-them.test.ts` — 16 bài

**Sửa — `core/`**
- `core/assertion/ops.ts` — `rejectAssertionOp` giải tán trọn union + trả `doiTuongId`;
  `addAssertionOp` dùng lại union đã có (`alreadyLinked`)
- `core/assertion/index.ts` — `alreadyLinked` và `doiTuongId` đi ra tới adapter
- `core/identity/bootstrap.ts` — `birthYear`, và áp được cả trên đường idempotent
- `core/assertion/assertion.test.ts` — 2 bài hồi quy (giải tán union · cặp trùng)
- `core/identity/identity.test.ts` — 3 bài (khai năm sinh · không khai · chạy lại với cờ)

**Sửa — `app/` và `scripts/`**
- `scripts/create-admin.ts` — cờ `--nam-sinh`, khoảng năm hợp lệ, câu báo cho đường idempotent
- `app/admin/cay/page.tsx` — `?giu=` giữ người vừa bị tách trên canvas (AC 23)
- `app/admin/hang-cho/actions.ts` — theo kiểu trả mới của `rejectAssertion`
- `components/admin/loai-ghi-them.ts` — sáu loại → tám; `KIEU_O` thêm `'nguoi'`; `laLoaiChon`, `laQuanHe`
- `components/admin/loai-ghi-them.test.ts` — cập nhật theo tám loại
- `components/admin/bieu-mau-ghi-them.tsx` — nhánh `'nguoi'`, hướng, `relation`, câu xem trước
- `components/admin/cot-khang-dinh.tsx` — luồng prop mới qua HAI nơi gọi; `loaiDuoc` cho `MotDong`
- `app/admin/cay/actions.ts` — `ghiThemQuanHe`; `ghiThemKhangDinh` từ chối hai loại quan hệ
- `app/admin/cay/cay-client.tsx` — nối `ghiThemQuanHe` + dùng lại `timNguoi` của thanh trên

## Completion Notes

Dev: Claude Opus 5 · 25/08/2026. Vá lượt code review: 26/08/2026.

> **Vì sao story quay về `in-progress` chứ không thành `done` sau lượt vá.**
> 19/19 phát hiện `patch` đã vá, 2 mục `decision` đã chốt và thi hành, 3 mục vào `deferred-work.md`.
> Nhưng **AC 28 vẫn chưa đạt** — chưa ai bấm nút ấy lần nào — và T9 vẫn để trống. Chốt `done` với
> một AC chưa đạt là đúng lớp lỗi mà chính lượt review này vừa bắt (năm ô Testing tích khống, T9
> tích khống). Story ở `in-progress` cho tới khi có người mở màn thật.

### Core: đường ghi quan hệ không cần gì mới — nhưng `core/` VẪN đổi, ở ba chỗ khác

Đúng như § Tiền đề dự đoán cho phần quan hệ: `addAssertionOp` đã nhận cả hai loại với phép kiểm
đầy đủ, và `chong.ts` + `read-ops.ts` đã dựng sẵn bề mặt đọc từ Epic 5.

**Nhưng nói "core không đổi một dòng nào" là sai**, và bản đầu của mục này nói đúng câu ấy —
lượt code review 26/08 bắt được. `core/` đổi ở ba chỗ, hai trong số đó do chính lượt review sinh ra:

| Chỗ | Vì sao |
|---|---|
| `core/identity/bootstrap.ts` | cờ `--nam-sinh` (việc A5 của retro Epic 5, làm sớm vì nó chặn lượt dựng lại database 26/08) |
| `core/assertion/ops.ts` — `rejectAssertionOp` | loại một thành viên union nay giải tán CẢ union; trả thêm `doiTuongId` |
| `core/assertion/ops.ts` — `addAssertionOp` | cùng một cặp thì dùng lại union đã có, không đúc union mới |

### Lệch so với story, và vì sao

| Story ghi | Đã làm | Vì sao |
|---|---|---|
| module thuần tên `chon-nguoi.ts`, component `chon-nguoi.tsx` | module thuần đổi tên thành **`tim-nguoi.ts`** | Hai file cùng tên khác đuôi thì `import './chon-nguoi'` phân giải vào `.ts` trước — component không import được. Đặt tên theo thứ nó tính (`ban-doi-the`, `dat-nut-tam` cũng thế): `tim-nguoi` là trạng thái lượt tìm, `chon-nguoi` là bộ chọn. |
| AC 25: *"sàn chữ 17px trên mọi thành phần mới"* | Nhãn phụ và dòng **đời · chi** dùng `text-[15px]` | AC viết chặt hơn spec. `EXPERIENCE.md § Accessibility Floor` chốt *thân 17px · tối thiểu tuyệt đối 15px*, và cả repo dùng 15px cho nhãn phụ (`chon-noi.tsx`, `cot-khang-dinh.tsx`). Theo nếp repo, không theo câu chữ AC. Lượt review 26/08 bắt chỗ này chưa khai. |
| AC 22: chồng quan hệ *"có nút Loại như mọi chồng khác"* | **Sửa luật mọc nút** ở `MotDong`, thêm `loaiDuoc` | Xem dưới — câu chữ AC nói *"như mọi chồng khác"*, mà "mọi chồng khác" hoá ra cũng không có nút ấy. |
| — | `ghiThemKhangDinh` thêm nhánh **từ chối** hai loại quan hệ | Mở `LOAI_GHI_THEM` làm `switch` trong đó không còn phủ hết loại ⇒ `tsc` gãy ngay. Đúng thứ hàng rào `Record<AssertionKind,…>` của 5-3 dựng ra để làm. |

### AC 22 hoá ra chạm vào một lỗ rộng hơn story

Nút **"Loại"** chỉ mọc khi `mauThuan`. Nhưng `parent-child` và `union-partner` có
`DON_TRI = false` ⇒ luôn là chồng **NỐI TIẾP** (cha và mẹ là hai khẳng định cùng đúng) ⇒ **không
bao giờ mâu thuẫn** ⇒ không bao giờ có nút ấy.

Tức là: story mở đường ghi một cạnh, mà cạnh ghi nhầm thì không gỡ được — nửa sản phẩm, đúng cái
bệnh Epic 6 sinh ra để chữa. Nên `MotDong` nhận thêm `loaiDuoc`, và luật nằm ở một hàm thuần có
test (`loaiDuocDuNoiTiep`).

**Gác hẹp có chủ ý: CHỈ hai loại quan hệ.** `place` và `note` cũng nối tiếp và cũng chưa có đường
gỡ — cùng một lỗ, rộng hơn phạm vi story. Nới cả hai ở đây là đổi hành vi của hai loại story này
không đụng tới. Đã ghi vào `deferred-work.md`.

### Bài test chạm database KHÔNG CÓ CHỖ NÀO ĐỂ SỐNG — và ranh giới tầng đúng

Bản đầu tôi viết `app/admin/cay/quan-he.test.ts`: dựng người thật trong một clan tạm, chạy
`chieuChaCon` rồi `addAssertionOp`, đọc lại hàng và khẳng định `subject`/`object`. Sáu bài, xanh
hết. `npm run lint` chặn năm lỗi:

> AD-1: `app/` không được chạm ORM và `db/` · AD-24: adapter chỉ import bề mặt `core/<module>`

Chuyển sang `core/assertion/` thì đổi lỗi, không hết lỗi:

> `core/` không import UI

Chặn cả hai chiều, và **chặn đúng cả hai lần**. Một bài test bắc cầu qua ranh giới tầng thì không
có tầng nào chứa được nó — đó không phải chỗ hở của cấu hình, đó là cấu hình đang nói rằng phép
ánh xạ đặt sai chỗ.

Lối ra là đừng bắc cầu. `dungLoiGoiQuanHe` nay mang **trọn** phép ánh xạ từ ý người vận hành sang
`{ personId, spec }` — thuần, không React, không `@/core/*` — và server action chỉ gọi nó. Bài
test thuần ghim `{ personId, spec }`; `core/assertion/assertion.test.ts` đã ghim từ story 1-2
rằng đúng hình ấy rơi vào database đúng chỗ (*"subject = child, object = parent"*). Hai bài nối
đầu vào nhau, phủ trọn đường đi, không bài nào phá tầng.

Đổi lại: mất sáu bài chạy trên database thật, còn 26 bài thuần. Tôi cho là đổi có lời — bài thuần
chạy mili-giây và không cần gieo dữ liệu, mà thứ chúng ghim thì y hệt.

### Cái bẫy `set-state-in-effect` — lần thứ TƯ, và lần này là tôi

Story cảnh báo ở AC 4 (*"5-1 → 5-3 → 5-7; nếp đã chốt, đừng vấp lần thứ tư"*). Tôi vẫn viết một
`useEffect` đặt lại con trỏ bàn phím mỗi khi kết quả đổi, và `npm run lint` chặn.

Đáng ghi lại vì nó nói một điều: **cảnh báo trong story không đủ**. Thứ chặn được là cái lint
rule. Vá theo đúng nếp cũ — con trỏ mang theo từ khoá nó thuộc về (`{ khoa, i }`), rồi suy ra
chỉ số lúc vẽ. Không effect nào cả.

### Vì sao chọn "câu sẽ được ghi" thay vì hai nút lên/xuống

Chiều của khẳng định là thứ người vận hành **không có nghĩa vụ phải hiểu**. Biểu mẫu hỏi *"người
vừa chọn là cha/mẹ hay là con"*, rồi in ra đúng câu mà panel sẽ hiện lại sau đó — dựng bằng chính
`RELATION_VN` của core:

> Nguyễn Quang Hiệp là con ruột của Nguyễn Quang Vinh.

Đọc câu ấy rồi mới bấm. Đó là hàng rào duy nhất chống ghi ngược chiều mà không đòi ai học kiến
trúc, và nó không tốn một lượt gọi máy chủ nào.

### Đã kiểm được

- `npm run lint` sạch (lệnh ĐẦY ĐỦ) · `tsc` sạch · **254/254** (thêm 35 bài) · `npm run build`
  xanh, **36 route**, không thêm route nào.
- **30 bài thuần**: chiều cả hai hướng và chúng đảo nhau · trọn `{ personId, spec }` cho ca thật
  Hiệp/Vinh · hướng ngược đảo CẢ HAI trường, không đảo mỗi một · `relation` không rơi rụng · vợ
  chồng không mang chiều dù truyền hướng nào · ba `relation` nói đúng chữ của phả ·
  `NHAN_QUAN_HE` khớp từng chữ với `RELATION_VN` của core · lượt tìm về sai thứ tự ⇒ vẫn "đang
  tìm" · đọc hỏng ≠ không có ai · người đang mở hồ sơ bị loại khỏi danh sách · tám loại ghi thêm ·
  luật nút "Loại".
- Nửa còn lại của đường đi (`{ personId, spec }` → hàng trong database) do
  `core/assertion/assertion.test.ts` ghim sẵn từ story 1-2, không phải viết lại.
- `chrome.test.ts` xanh **không phải sửa** — story không sinh màn mới, đúng như T6 dự đoán.
- `tsc` bắt đúng **cả hai** nơi gọi `<BieuMauGhiThem>` khi thêm prop bắt buộc (AC 11b). Thiết kế
  ấy chạy thật, không phải một lời hứa trong chú thích.

### CHƯA kiểm được — cần mắt người

~~Máy không có trình duyệt headless~~ — câu ấy hết đúng từ 26/08 (`scripts/soi-man.mjs`,
Playwright). Ba mục dưới đây đã đo được và gạch; phần còn lại là thứ đo không trả lời hộ được.

1. ~~AC 28 — nghiệm thu trên phả thật~~ — **ĐẠT 26/08.** Xem § Nghiệm thu AC 28 bên dưới.
2. ~~Bộ chọn trong cột 382.5px~~ — **ĐO ĐƯỢC 26/08**: cột là **360px**, và bộ chọn cộng hai
   fieldset radio không tràn ngang (`soi-man.mjs`: `tràn ngang: không có ✓`). Con số 382.5px
   trong bản đầu là suy từ `w-90`, mà cột khai `w-[360px]` tường minh — sai từ lúc viết.
3. ~~Câu xem trước có đọc ra nghĩa không~~ — **ĐO ĐƯỢC 26/08**, và nó đảo đúng theo hướng:
   `là cha/mẹ của người này` ⇒ *"Nguyễn Quang Hiệp là con ruột của Nguyễn Quang Hải."*;
   đổi sang `là con của người này` ⇒ *"Nguyễn Quang Hải là con ruột của Nguyễn Quang Hiệp."*
   Ứng viên bày kèm **đời · chi · năm sinh** (AC 3). Còn lại chỉ là câu hỏi *người dùng có ĐỌC nó
   trước khi bấm không* — thứ chỉ người dùng thật trả lời được.
4. ~~Đường bàn phím qua combobox~~ — **ĐO ĐƯỢC 26/08**, chạy đủ:
   ```
   gõ "Nguyễn"      aria-expanded=true · 6 ứng viên (7 người Nguyễn trừ chính mình ✓)
   ArrowDown        aria-activedescendant → o-0 ; lần 2 → o-1 ; ArrowUp → o-0
   Enter            chọn được
   Escape           aria-expanded=false · chữ CÒN NGUYÊN · biểu mẫu vẫn mở
   ```
   Escape đóng danh sách mà không đóng luôn biểu mẫu — đúng luật đóng-từ-trong-ra-ngoài
   (`chon-nguoi.tsx` chặn nổi bọt, thêm ở story 6-9).
5. Nút **"Loại quan hệ này"** có làm người vận hành tưởng là xoá không (AD-4 nói nó ở lại nhật ký).
6. Biểu mẫu quan hệ mở trong cột nay có thể chứa: panel duyệt + nhiều chồng + biểu mẫu này.

### Nghiệm thu AC 28 — 26/08/2026, và một lời khai sai tôi tự gây ra

Ca gốc (*"nối Hiệp → Vinh"*) đã mất: cạnh ấy do bộ nạp khung ghi sau lượt xoá-gieo-lại. Ca thay
thế do chủ dự án xác nhận: **bảng tính chỉ có cột `ten_cha`, nên không đứa con nào trong phả có
mẹ.** Cạnh `Nguyễn Gia Linh → Quản Thị Huyền` là một sự thật đang thiếu, đúng loại việc tính
năng này sinh ra để làm.

**Lượt đầu ghi SAI, và phải chép lại ở đây vì nhật ký giữ nó vĩnh viễn (AD-4).** Kịch bản đo bấm
ứng viên ĐẦU TIÊN mà không kiểm tên, và ghi *"Nguyễn Gia Linh là con ruột của Nguyễn Quang Anh"*
lúc 20:37:48. Gỡ lúc 20:38:42 bằng chính `Loại quan hệ này`, ghi chú *"Gỡ quan hệ cha con ghi
nhầm ở bàn làm việc"*.

Lỗi của kịch bản, nhưng nó phơi ra một lỗi thật của tính năng: **ô tìm khớp gấp dấu**, nên `Quản`
→ `quan` khớp cả `Quang` → sáu ứng viên cho một từ khoá bốn chữ, và người cần tìm đứng **cuối**.
Trong một dòng họ mà chữ đệm là *Quang*, đó là một cái bẫy có thật. Ba tầng code review đọc mã
không thấy; `soi-man.mjs` không thấy; chỉ bấm thật mới thấy. Vào `deferred-work.md`; chủ dự án
chốt chưa cần sửa.

**Lượt hai đạt**, sau khi đổi cách chọn: lọc theo ĐÚNG TÊN thay vì bấm ứng viên đầu, và dừng lại
kiểm câu xem trước phải khớp nguyên văn trước khi cho phép bấm ghi.

```
hồ sơ            Nguyễn Gia Linh
câu xem trước    "Nguyễn Gia Linh là con ruột của Quản Thị Huyền."
ghi vào phả      tier=tentative (AD-9)
xuất xứ          "Hiệp xác nhận 26/08/2026 — vợ của cha; bảng tính chỉ chép cột cha"
kết quả          7 cạnh cha-con · Gia Linh là người ĐẦU TIÊN có cả cha lẫn mẹ
chồng "Cha mẹ"   hai dòng, kiểu NỐI TIẾP — cha và mẹ cùng đúng, không phải mâu thuẫn
```

Tiện thể chứng minh luôn **AC 22** (`Loại quan hệ này` gỡ đúng dòng được trỏ tới, không gỡ nhầm
dòng bên cạnh) và **AC 23** (canvas vẽ lại, người bị tách **không** biến mất khỏi danh sách node)
— cả hai bằng dữ liệu thật, không phải bằng lập luận.

### Nợ để lại

- **`place` và `note` vẫn không gỡ được** — cùng lỗ với AC 22, gác hẹp có chủ ý. Vào
  `deferred-work.md`.
- Chồng *Cha mẹ* vẫn là **nối tiếp**, nên hai cạnh cha cùng giới không bị gọi là mâu thuẫn —
  story 6-5, đã ghi trong § Phạm vi.
- `relation: 'heir'` ghi được nhưng **cạnh trên canvas vẽ y hệt `blood`**. Phả cổ phân biệt rõ;
  `EXPERIENCE.md` chưa nói gì về hình của cạnh. Câu hỏi #2 cuối story vẫn mở.
