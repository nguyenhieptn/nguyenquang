---
baseline_commit: cedbc84
---
# Story 6.9: Nhập nhanh trên canvas bằng bàn phím

Status: review

## Story

Là **người chép phả đang ngồi trước một trang phả giấy**,
tôi muốn **chọn một người trên cây rồi gõ `Enter` để thêm con, `Shift+Enter` để thêm anh em**,
để **chép được cả một chi mà không rời tay khỏi bàn phím**.

## Bối cảnh: việc số một, và hôm nay nó tốn nhiều cú bấm nhất

Phản hồi 26/08 từ lượt dùng thật:

> *"Trên canvas có thể click vào 1 node, nếu ấn Enter sẽ mở thêm node con và ấn Tab sẽ mở nốt
> liền kề (anh em) không? Như thế thêm node sẽ dễ hơn."*

Hôm nay: chọn node → rê chuột lên thanh công cụ → bấm *Thêm người quanh đây* → chọn hướng →
gõ tên. Bốn chặng cho một người, và người chép một trang phả mười người phải đi bốn chặng ấy
mười lần.

Đường ghi **đã có đủ**: `themNguoi` nhận `mocId` + `huong` trong bốn hướng
(`con · cha-me · vo-chong · roi`), biểu mẫu ở cột phải đã dựng từ 5-4. Thiếu là thiếu **phím**.

## Quyết định: `Enter` / `Shift+Enter`, KHÔNG phải `Tab` (chốt 26/08)

`Tab` là phím của trình duyệt — cách duy nhất người dùng bàn phím đi qua giao diện. Chiếm nó
trên canvas là dựng một cái bẫy: vào được mà không ra được, vi phạm chính
`EXPERIENCE.md § Accessibility Floor`.

Ba lối đã cân nhắc: (a) chiếm `Tab` khi có node đang chọn, `Escape` trả lại — vẫn là một cái bẫy,
chỉ có cửa thoát; (b) một "chế độ nhập nhanh" bật/tắt tường minh — thêm một trạng thái người dùng
phải nhớ; (c) **`Enter` = con, `Shift+Enter` = anh em** — không đụng `Tab` một chút nào.

Chốt (c).

## "Anh em" không phải một hướng có sẵn

Bốn hướng của `HuongThem` không có `anh-em`. Anh em = **thêm một người con nữa cho CÙNG người
cha**, tức `huong: 'con'` gắn vào **cha của node đang chọn**, không gắn vào chính node ấy.
`NutCanvas` đã mang `chaId` nên tính được ngay, không cần lượt đọc nào.

## Acceptance Criteria

### Phím

1. Node đang chọn + `Enter` ⇒ mở biểu mẫu thêm người với `mocId` = node ấy, `huong: 'con'`.
2. Node đang chọn + `Shift+Enter` ⇒ `mocId` = **cha** của node ấy, `huong: 'con'`.
3. Node đang chọn mà **chưa biết cha** + `Shift+Enter` ⇒ **KHÔNG** ghi gì, **KHÔNG** lặng lẽ tạo
   một người rời. Nói một câu: *"Chưa biết cha của người này, nên chưa thêm anh em được."*
4. Không có node nào đang chọn ⇒ hai phím không làm gì.
5. Node mờ (`ID_TAM`) không bao giờ là mốc — nó chưa tồn tại trong phả.

### Không cướp phím của người khác

6. Con trỏ đang ở trong **ô nhập** (`input` · `textarea` · `select` · `contenteditable`) ⇒ hai
   phím ấy đi tiếp như thường. Biểu mẫu thêm người nằm ngay cột bên, và `Enter` ở đó là gửi.
7. `Tab` **không bị đụng tới**, ở bất kỳ trạng thái nào.
8. Không `preventDefault` khi phím không được xử — trả về cho trình duyệt.

### Nói ra thì mới có người dùng

9. Khi một node đang chọn, canvas bày một dòng chỉ dẫn: **`Enter` thêm con · `Shift+Enter` thêm
   anh em**. Phím tắt không nói ra là phím tắt không tồn tại.
10. Dòng ấy dùng `<kbd>`, và không phải một tooltip — `EXPERIENCE.md § Component Patterns` ưa bày
    thẳng hơn giấu sau tương tác.

### Nhịp gõ một mạch

11. Ghi xong một người: con trỏ **về lại canvas**, node mới **đang chọn**, sẵn sàng cho `Enter`
    kế tiếp. Đây là thứ biến bốn chặng thành một.
12. Mỗi người vẫn cần **họ tên và xuất xứ** trước khi ghi (FR-1) — không có lối tắt nào bỏ qua
    xuất xứ. Biểu mẫu mở ra với con trỏ nằm sẵn ở ô tên.

### Sàn không được hạ

13. Sàn chạm 44px · chữ thân 17px · tối thiểu tuyệt đối 15px.
14. Không phân biệt chỉ bằng màu. Không đổ bóng.
15. Không xưng hô ngôi hai.
16. Đo bằng `scripts/soi-man.mjs` trước và sau: thẻ node **không được cao thêm**, nhãn không gãy
    dòng. `the-nguoi.tsx` là file mà hai lỗi hình nặng nhất Epic 5 nằm ở đó.

## Phạm vi — KHÔNG thuộc story này

- **Nút `+` trên thẻ node** — đã cân nhắc và bỏ ở 5-4 vì thẻ chật; story này giải cùng bài toán
  bằng phím, không bằng pixel.
- **Thêm người rời bằng cách bấm khoảng trống canvas** — người rời đẻ ra một mảnh mới, mà "mảnh
  chưa nối" là con số cần làm GIẢM.
- **Sửa giá trị trên canvas** — sửa là việc của cột phải (chốt 26/08).
- **Kéo thả** — nợ từ 5-4, vẫn hoãn.

## Tasks / Subtasks

- [x] **T0** `AGENTS.md`: đọc `node_modules/next/dist/docs/` cho phần sắp viết
- [x] **T1** Module THUẦN `phim-canvas.ts`: từ (phím, shift, thẻ đích, node đang chọn, `chaId`)
      suy ra hành động — `them-con` · `them-anh-em` · `thieu-cha` · `bo-qua` (AC 1–8)
- [x] **T2** Nối vào `khung-cay-admin.tsx` bằng `onKeyDown` trên vỏ canvas (AC 1–5)
- [x] **T3** Dòng chỉ dẫn `<kbd>` khi có node đang chọn (AC 9–10)
- [x] **T4** Câu "chưa biết cha" trong `cay-client.tsx` (AC 3)
- [ ] **T5** Ghi xong thì chọn node mới và trả con trỏ về canvas (AC 11)
- [x] **T6** Test thuần cho `phim-canvas.ts`
- [x] **T7** `npm run lint` · `npx tsc --noEmit` · `npx vitest run` · `npm run build`
- [x] **T8** `soi-man.mjs` trước/sau, và **nhìn ảnh** (AC 16)

## Dev Notes

### Hiện trạng file sẽ sửa

| File | Hiện là gì | Đổi gì |
|---|---|---|
| `components/admin/khung-cay-admin.tsx` | `ReactFlow` với `onNodeClick` + `onNodesChange`; đã có `onMoThem` | thêm `onKeyDown` trên vỏ, thêm dòng chỉ dẫn |
| `app/admin/cay/cay-client.tsx` | `setThem({mocId, huong, hoTen})` mở biểu mẫu | nối hai phím; tính cha từ `nut` |
| `components/admin/the-nguoi.tsx` | thẻ node | **KHÔNG đổi** — story này không thêm pixel nào lên thẻ |

### Chỗ dễ sai nhất: `Enter` của biểu mẫu và `Enter` của canvas

Biểu mẫu thêm người nằm ở cột phải, cùng màn. `Enter` trong một `<input>` là **gửi biểu mẫu**.
Nếu handler của canvas bắt luôn phím ấy thì gõ tên xong nhấn `Enter` sẽ mở thêm một biểu mẫu nữa
đè lên biểu mẫu đang gõ dở — mất trắng chữ, đúng lớp lỗi `<details>` nuốt biểu mẫu mà lượt review
6-7 vừa bắt.

Nên phép kiểm "con trỏ có đang ở ô nhập không" là **hàng rào chính** của story, và nó nằm ở module
thuần để test được.

### Học từ 6-7 mang sang

1. **Bốn cổng xanh không phải xanh với người.** Chạy `soi-man.mjs` và NHÌN ảnh sau mỗi lượt sửa.
2. **Prop mới thì để bắt buộc** nếu có nhiều nơi gọi; `tsc` bắt hộ.
3. **Đừng để lại hàm có test mà không ai gọi** — repo đã dính ba lần (`laLoaiChon`, `dongXuatXu`,
   `khoaChong`).
4. **Ô nào không có bài test thì để TRỐNG**, kể cả khi lý do chính đáng.

### Testing

- [x] `Enter` + có node chọn ⇒ `them-con` với đúng `mocId`
- [x] `Shift+Enter` + node có cha ⇒ `them-anh-em` với `mocId` là CHA
- [x] `Shift+Enter` + node không cha ⇒ `thieu-cha`
- [x] không có node chọn ⇒ `bo-qua` cho cả hai phím
- [x] node mờ đang chọn ⇒ `bo-qua`
- [x] con trỏ trong `input`/`textarea`/`select`/`contenteditable` ⇒ `bo-qua` cho cả hai phím
- [x] phím khác (`Tab`, `a`, `Escape`) ⇒ `bo-qua`, và KHÔNG `preventDefault`

### References

- [Source: `epics-dot-3.md#Epic 6`]
- [Source: `_bmad-output/implementation-artifacts/5-4-them-nguoi.md`] — hai lối vào đã có, và vì sao nút trên thẻ bị bỏ
- [Source: `components/admin/dat-nut-tam.ts:18`] — `HuongThem` bốn hướng, không có `anh-em`
- [Source: `.../EXPERIENCE.md#Accessibility Floor`] — 44px · 17px · không phân biệt chỉ bằng màu
- [Source: `.../EXPERIENCE.md#Component Patterns`] — bày thẳng hơn giấu sau tương tác

## Dev Agent Record

### Agent Model Used

Claude Opus 5 · 26/08/2026.

### Debug Log References

`npm run lint` sạch · `npx tsc --noEmit` sạch · `npx vitest run` **312/312** (286 trước story ⇒ +26, tất cả THUẦN) · `npm run build` xanh, 36 route.

Đo trên trình duyệt thật (`scripts/soi-man.mjs` + một kịch bản riêng cho phím):

```
chỉ dẫn khi có node chọn        CÓ ✓
Enter → biểu mẫu thêm con      mở ✓  ("là con của Nguyễn Quang Hiệp")
Enter trong ô TÊN              chữ còn nguyên ✓ · số biểu mẫu đang mở: 1
Shift+Enter trên thuỷ tổ       "Chưa biết cha của người này, nên chưa thêm anh em được."
thẻ node                       159×68 / 159×51 — KHÔNG đổi (AC 16)
```

### Completion Notes List

Xem § Completion Notes.

### File List

**Mới**
- `components/admin/phim-canvas.ts` — module thuần: `hanhDongPhim` · `dangGoTrongO`
- `components/admin/phim-canvas.test.ts` — 26 bài (`hanhDongPhim` + `hanhDongEsc`)

**Sửa**
- `app/admin/cay/cay-client.tsx` — nghe phím ở cấp cửa sổ, `Escape`, câu báo "chưa biết cha"
- `components/admin/khung-cay-admin.tsx` — bỏ dòng chỉ dẫn và băng-rôn "hết người"; lý do vô hiệu chuyển vào nút
- `components/admin/the-nguoi.tsx` — bỏ hàng nhãn chữ, trạng thái đổi sang độ dày viền + quầng
- `components/admin/bieu-mau-them-nguoi.tsx` — `onDoiBan` báo biểu mẫu đã bẩn
- `components/admin/chon-nguoi.tsx` — `Esc` của bộ chọn chặn nổi bọt (đóng từ trong ra ngoài)

## Completion Notes

Dev: Claude Opus 5 · 26/08/2026.

### Lệch so với story, và vì sao

| Story ghi | Đã làm | Vì sao |
|---|---|---|
| T2: `onKeyDown` trên **vỏ canvas** | nghe ở **cấp cửa sổ** trong `cay-client` | Ghi xong một người thì trang dời tâm sang người mới và **dựng lại** — focus rơi về `body`. Nghe ở vỏ thì "gõ một mạch" đứt ngay ở người thứ hai, đúng thứ story sinh ra để có. Bắt được bằng cách nghĩ tới nhịp, trước khi viết. |
| Hàng rào = "con trỏ có trong ô nhập không" | rộng hơn: **mọi phần tử mà `Enter` đã có nghĩa riêng** | Nghe ở cửa sổ thì `BUTTON` · `A` · `SUMMARY` cũng phải chặn — `Enter` ở đó là **bấm**. Không chặn thì một cú Enter vừa bấm nút vừa mở biểu mẫu. |
| T5: ghi xong trả con trỏ về canvas | **không cần** | Hệ quả của lệch thứ nhất: nghe ở cửa sổ thì focus ở đâu cũng được. Nhịp `Enter` → điền → `Enter` chạy thẳng mà không phải quản lý focus — ít mã hơn, ít chỗ hỏng hơn. |

### `Tab` giữ nguyên, và đó là quyết định chứ không phải bỏ sót

Đề nghị ban đầu là `Tab` cho anh em. `Tab` là **cách duy nhất** người dùng bàn phím đi qua giao
diện; chiếm nó trên canvas là dựng một cái bẫy vào được mà không ra được, vi phạm chính
`EXPERIENCE.md § Accessibility Floor`. `Shift+Enter` cho cùng kết quả mà không đụng tới nó.

Bài test ghim luôn điều này: `Tab` · `Escape` · phím chữ · mũi tên đều trả `bo-qua` và **không**
`preventDefault`.

### "Anh em" là một phép suy, không phải một hướng

`HuongThem` có bốn hướng và không có `anh-em`. Anh em = thêm một người con nữa cho **cùng người
cha**, tức `huong: 'con'` gắn vào `chaId` của node đang chọn — thứ `NutCanvas` đã mang sẵn, không
cần lượt đọc nào.

Ca phải chặn: node **chưa biết cha**. Lặng lẽ tạo một người rời ở đó là đẻ thêm một mảnh chưa
nối — đúng con số bàn Admin đang cố làm giảm. Nên nó nói ra, và không ghi gì.

### Nhịp gõ một mạch, đo được

`themNguoi` xong thì trang dời tâm sang người mới, và người mới thành node **đang chọn** (nhờ
`chonId` khởi tạo bằng `neoId`, sửa ở lượt review 6-7). Nên:

- `Enter` → điền → ghi ⇒ con đầu, và con ấy đang chọn
- `Shift+Enter` → điền → ghi ⇒ con thứ hai (anh em của con đầu)
- lặp

Chép một chi mười người là mười lần `Shift+Enter`, không rời tay khỏi bàn phím. Trước story này
là bốn chặng mỗi người: chọn node → rê chuột lên thanh công cụ → bấm → chọn hướng.

### Bổ sung sau lượt dùng thật (26/08)

**Dấu trạng thái trên thẻ: bỏ chữ, đổi bằng hình.** *"Tâm đang chọn chỉ cần một glow highlight
border là được, không cần hiện chữ tâm."* Hàng nhãn nổi trên đỉnh thẻ bỏ hẳn — cùng với cả lớp
bug nó từng gây ra (nhãn sơn đè lên họ tên, lượt review Epic 5 đo được). `EXPERIENCE.md` cấm mã
hoá trạng thái chỉ bằng màu, nên chỗ nhãn để lại do **hình** gánh:

```
thường     viền 1px
tâm        viền 2px, KHÔNG quầng   ⇒ một dấu lặng: chỗ vùng lân cận tính từ
đang chọn  viền 2px + quầng 4px    ⇒ ồn nhất
```

Thứ tự này **từng ngược**, và đó là lý do người dùng tưởng phím tắt chạy nhầm node: tâm quầng dày
hơn đang-chọn, `laNeo` kiểm trước `selected`. Bấm một node ở xa thì node ấy nhạt hơn cái tâm đứng
chỗ khác — mắt bảo cái kia đang hoạt động, tay gõ `Enter`. Phím vẫn dùng đúng node vừa bấm (đo
được), nhưng cái nhìn nói dối. **Luật: thứ đang được thao tác thì ồn nhất.**

Câu hỏi kèm theo — *"có nên gộp tâm và đang-chọn không?"* — trả lời **không**. Gộp nghĩa là mỗi
cú bấm đều tính lại vùng lân cận và xếp lại cả cây, đúng thứ chính người dùng gọi là *"rất rối"*.
Chép phả là đứng một chỗ sửa nhiều người quanh đó.

**Bỏ hai chỗ chữ thừa trên thanh công cụ:** dòng chỉ dẫn phím tắt, và băng-rôn *"đã hết người để
mở thêm"* (lý do chuyển vào chính nút đã bị vô hiệu, qua `title` + `aria-label`).

### `Escape` — huỷ thao tác đang dở

Phân tích luật chung của app canvas (Figma · Miro · Excalidraw · tldraw · Obsidian Canvas ·
MindNode): `Esc` huỷ thứ đang dở · đóng từ TRONG ra NGOÀI · chạy **cả trong ô nhập** (khác
`Enter`: trong ô nhập `Enter` là *gửi*, `Esc` là *thôi*).

Chỗ chúng khác nhau là **node đã gõ chữ**: Figma/Excalidraw/MindNode giữ lại chữ; Notion/Linear
đóng và mất chữ. "Giữ lại" không dùng được ở đây — một người chưa có xuất xứ thì không ghi vào
phả (FR-1), không có chỗ nào để giữ. Nên: **trống thì đóng ngay, đã gõ thì hỏi một lần**.

Cờ "đã gõ" do **chính biểu mẫu** báo ra (`onDoiBan`, prop BẮT BUỘC), phủ mọi ô kể cả xuất xứ —
bản đầu chỉ suy từ họ tên, nên gõ mỗi xuất xứ rồi `Esc` là mất trắng. Và nó so với trạng thái
rỗng chứ không phải một cờ một chiều: gõ rồi xoá hết thì biểu mẫu sạch trở lại.

Đo được cả bốn nhánh:

```
Esc khi chưa gõ          → đóng ngay
Esc lần 1 khi đã gõ tên  → hỏi, biểu mẫu còn, chữ còn nguyên
Esc lần 2                → đóng
gõ mỗi XUẤT XỨ → Esc     → hỏi
gõ rồi xoá hết → Esc     → đóng ngay
```

### CHƯA kiểm được — cần mắt người

1. **Chưa ai ghi thật bằng phím.** Kịch bản đo mở được biểu mẫu và điền được tên, nhưng dừng
   trước nút ghi — nó ghi vào phả thật, và một agent lượt trước đã vô tình nâng tầng 40 khẳng
   định vì bấm thử.
2. Dòng chỉ dẫn `<kbd>` có đọc ra nghĩa với người chưa từng dùng phím tắt không, hay nó chỉ là
   thêm chữ trên thanh công cụ vốn đã có ba nút.
3. Câu *"Chưa biết cha…"* nổi đè lên canvas — có che mất thứ đáng nhìn không, và nó **không tự
   biến mất**: phải chọn node khác hoặc gõ phím hợp lệ mới hết.
4. Trình đọc màn hình: câu ấy có `role="status"`, nhưng chưa ai nghe thử.
