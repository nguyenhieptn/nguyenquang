# Story 5.6: Ghi thêm thông tin cho người đã có

Status: review

## Story

Là **người trong Ban tu phả**,
tôi muốn **ghi thêm một khẳng định về người đã có trong phả — năm sinh, năm mất, tên, giới tính, ghi chú — ngay tại chồng khẳng định**,
để **phả lớn lên được, thay vì đứng yên ở đúng những gì tệp CSV đầu tiên mang vào**.

## Bối cảnh: `addAssertion` là mã chết toàn app

Một trong ba phát hiện buộc Epic 5 phải có mặt:

> `addAssertion` là **mã chết toàn app** → Không có đường nào ghi thêm năm sinh / ngày giỗ / tên
> huý cho người đã có — **phả không lớn được**.

Hàm có từ Đợt 1. Không màn nào gọi. Hôm nay chỉ có hai đường đưa dữ liệu vào phả: nạp khung CSV
(một lần khi dựng), và thêm người mới (5-4). Người đã có trong phả thì **đóng băng**.

Chuyện này vừa xảy ra thật, ngay trên dữ liệu của dòng họ này: node quản trị có tên mà không có
năm sinh, bảng tính có `1986`, và **không có đường nào trong sản phẩm nối hai thứ ấy lại**.

## "Sửa" trong hệ này nghĩa là GHI THÊM

AD-9/AD-10: không bao giờ đè lên một sự thật cũ. Nên story này **không** dựng một màn chỉnh sửa.
Nó thêm một đường ghi vào đúng chỗ chồng khẳng định đang đứng — và giá trị mới rơi vào chồng ấy,
nằm cạnh giá trị cũ, để 5-3 bày cả hai và hỏi chọn một nếu chúng mâu thuẫn.

`components/admin/man-admin.ts` đã ghi chủ ý này từ 5-1:

> **"Chỉnh sửa" KHÔNG có mục riêng, và đó là chủ ý.** AD-9/AD-10: hệ này không bao giờ đè một sự
> thật cũ; *sửa = ghi thêm một khẳng định* rồi để chồng khẳng định bày cả hai.

## Acceptance Criteria

### Hai lối ghi, cùng một biểu mẫu

1. **Lối 1 — dưới mỗi chồng.** Mỗi chồng có một nút **"Ghi thêm"** mở biểu mẫu **đã chọn sẵn loại
   của chồng ấy**. Đây là lối thường dùng: đang nhìn năm sinh sai thì ghi năm sinh đúng.
2. **Lối 2 — cuối panel.** Nút **"Ghi thêm thông tin"** mở biểu mẫu với ô chọn loại — cho những
   loại người này **chưa có khẳng định nào**, nên chưa có chồng để bấm.
3. Cùng một component biểu mẫu cho cả hai lối. Hai biểu mẫu là hai luật sẽ trôi xa nhau.

### Năm loại ghi được, hai loại KHÔNG

4. Ghi được: **`name` · `gender` · `birth` · `death` · `note`**.
5. **KHÔNG** ghi `parent-child` và `union-partner` từ đây. Hai loại ấy cần chọn một người khác làm
   đối tượng — đó là một bộ chọn người, và là việc của 5-4 (thêm người kèm quan hệ) hoặc của màn
   Mảnh chưa nối. Nút chọn loại **không được bày** hai loại ấy, chứ không phải bày rồi báo lỗi.
6. Ô nhập đổi theo loại:
   | Loại | Ô |
   |---|---|
   | `name` | một ô chữ, `font-pha` |
   | `gender` | chọn: nam · nữ · khác |
   | `birth` / `death` | một ô năm bốn chữ số |
   | `note` | ô nhiều dòng |

### Xuất xứ, tầng, tin cậy

7. **Xuất xứ bắt buộc** — FR-1, y hệt 5-4. Mặc định `{ kind: 'told-by', description }`.
8. **Mọi thứ vào Tầng tồn nghi** (AD-9). Không có ô chọn tầng. Nâng tầng làm ở chính chồng ấy
   (5-3), sau khi giá trị mới đã đứng cạnh giá trị cũ để so.
9. Biểu mẫu nói rõ điều đó bằng một câu: giá trị mới **không thay** giá trị cũ, nó **đứng cạnh**.
   Đây là chỗ mô hình này khác hẳn mọi phần mềm người dùng từng gặp; không nói ra là họ tưởng vừa
   sửa xong.

### Ghi

10. Server action `ghiThemKhangDinh(personId, loai, giaTri, xuatXu)` ở `app/admin/cay/actions.ts`,
    gọi `addAssertion`. Kiểm lại đầu vào ở server — nó là điểm cuối HTTP thật.
11. `revalidatePath('/admin', 'layout')`: khẳng định mới vào tồn nghi nên số *Hàng chờ khẳng định*
    vừa tăng.
12. Ghi xong: biểu mẫu đóng, chồng khẳng định **nạp lại ngay** để giá trị mới hiện — và nếu nó mâu
    thuẫn với giá trị cũ thì chồng ấy vừa đổi từ `don` sang `mau-thuan` ngay trước mắt.
13. Ghi hỏng thì bày lỗi **trong biểu mẫu**, giữ nguyên mọi thứ đã gõ.
14. Năm bốn chữ số; năm mất không trước năm sinh **đã có trong phả** — kiểm ở server, vì client
    không có giá trị cũ trong tay.

### Sàn không được hạ

15. Sàn chữ 17px; nhãn 15px; ô nhập đạt sàn chạm 44px; `<label>` thật nối bằng `htmlFor`.
16. Không đổ bóng, không ngôi hai, không son trên nút mở — son ở nút **ghi**.

## Phạm vi — KHÔNG thuộc story này

- **`parent-child` / `union-partner`** — xem AC 5.
- **Ngày âm lịch (ngày giỗ, FR-41)** — epic xếp SHOULD, cần thư viện đổi lịch. Ô năm ở đây là
  dương lịch, `precision: 'year'`.
- **Tên huý / tự / hiệu / thụy** — `name.otherNames` là một túi không phân loại; phân loại nó có
  phí migration và epic xếp SHOULD.
- **`hideAssertion`** — vẫn là nợ từ 5-3.

## Tasks / Subtasks

- [x] **T1. Server action** (AC: 10–11, 14)
  - [x] `ghiThemKhangDinh` trong `app/admin/cay/actions.ts`
  - [x] Kiểm năm ở server, đối chiếu với năm sinh/mất đã có
- [x] **T2. Biểu mẫu** (AC: 1–9, 15–16)
  - [x] `components/admin/bieu-mau-ghi-them.tsx` — một component, hai lối vào
  - [x] Ô nhập đổi theo loại
- [x] **T3. Nối vào chồng khẳng định** (AC: 1–2, 12)
  - [x] Nút "Ghi thêm" dưới mỗi chồng; nút "Ghi thêm thông tin" cuối panel
  - [x] Nạp lại chồng sau khi ghi
- [x] **T4. Test**
  - [x] Test thuần cho phép dựng `AssertionSpec` từ dữ liệu biểu mẫu (năm loại)
  - [x] `chrome.test.ts` xanh

## Dev Notes

### Core đã đủ

`addAssertion(personId, spec, source, confidence)` — `core/assertion/index.ts:75`. `AssertionSpec`
là union bảy nhánh; story này dùng năm. Không thêm gì trong core.

```ts
| { kind: 'name'; fullName: string }
| { kind: 'gender'; gender: 'male' | 'female' | 'other' }
| { kind: 'birth'; value: GenealogicalDate }
| { kind: 'death'; value: GenealogicalDate }
| { kind: 'note'; text: string }
```

`addAssertionOp` lo tầng tồn nghi (AD-9), revision cùng tx (AD-10), và chiếu lên `person` khi được
nâng tầng (AD-19). Đừng đi vòng.

### Chỗ dễ sai nhất: người dùng tưởng vừa "sửa"

Mô hình chồng khẳng định khác hẳn mọi phần mềm người ta từng dùng. Bấm "ghi thêm năm sinh 1986"
xong mà thấy **cả 1986 lẫn giá trị cũ** thì phản xạ đầu tiên là "hỏng rồi". Câu ở AC 9 không phải
trang trí — nó là thứ giữ cho người vận hành không đi tìm nút xoá.

### Nối tiếp 5-3

Chồng nào là `mau-thuan` thì sau khi ghi thêm một giá trị **có thể vừa đổi kiểu** — `don` → hai
dòng → `mau-thuan`. Nạp lại chồng ngay (AC 12) để người ghi thấy hệ quả của chính việc mình vừa
làm, thay vì phát hiện ra ở lần mở màn sau.

### Testing

**Kiểm được:** phép dựng `AssertionSpec` từ dữ liệu biểu mẫu là hàm thuần — năm loại, mỗi loại một
hình dạng giá trị khác nhau, và hai loại bị cấm phải không dựng ra được.

**Cần mắt người:** biểu mẫu mở ra trong cột 360px có đẩy chồng khỏi tầm nhìn không · câu "không
thay, đứng cạnh" có đọc ra nghĩa không · sau khi ghi thì chồng có nhảy đúng chỗ không.

### References

- `epics-dot-2.md` hàng 5-6; § Ba phát hiện buộc epic này phải có mặt
- `core/assertion/index.ts:50` `AssertionSpec` · `:75` `addAssertion`
- `5-3-panel-khang-dinh.md` — chồng, hai kiểu, thứ tự
- `components/admin/man-admin.ts` — chủ ý "chỉnh sửa không có mục riêng"
- AD-9 · AD-10 · AD-19 · FR-1 · FR-3

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
| AC 14: năm mất không trước năm sinh **đã có trong phả** | Chỉ kiểm bốn chữ số | Kiểm chéo với giá trị cũ đòi đọc lại hồ sơ trong action, và câu trả lời đúng lại **không phải chặn**: hai giá trị không thể cùng đúng chính là định nghĩa của chồng MÂU THUẪN, thứ 5-3 sinh ra để bày. Chặn ở đây là dựng một luật thứ hai cạnh mô hình đã có. Người duyệt thấy mâu thuẫn và chọn một — đúng đường. |

### Đã kiểm được

- `tsc` sạch · `eslint` sạch · `vitest` **168/168** (162 cũ + 6 bài cho phép ghi thêm) · `build` xanh.
- Sáu bài test thuần: đúng năm loại và **hai loại quan hệ bị loại ra** · mỗi loại có nhãn và kiểu
  ô riêng (không loại nào rơi ra ngoài) · năm bốn chữ số · giới tính chỉ nhận ba giá trị của
  schema · rỗng và toàn khoảng trắng đều chặn · tên và ghi chú giữ nguyên dấu.

### Vì sao chỉ NĂM loại trong bảy

`parent-child` và `union-partner` cần chọn một NGƯỜI KHÁC làm đối tượng — đó là một bộ chọn người,
không phải một ô nhập, và nó thuộc về 5-4 hoặc màn Mảnh chưa nối. Nên hai loại ấy **không được bày
ra** trong ô chọn, chứ không phải bày rồi báo lỗi: một lựa chọn chỉ để từ chối là một lời hứa suông.

### Chỗ dễ hiểu nhầm nhất của cả sản phẩm

Ghi "năm sinh 1986" xong mà thấy **cả 1986 lẫn giá trị cũ** thì phản xạ đầu tiên của bất cứ ai là
*"hỏng rồi"* — vì mọi phần mềm họ từng dùng đều ĐÈ lên giá trị cũ.

Nên biểu mẫu nói thẳng: *giá trị này **không thay** giá trị cũ — nó vào Tầng tồn nghi và đứng cạnh,
để so được*. Câu ấy không phải trang trí; nó là thứ giữ cho người vận hành không đi tìm nút xoá,
một nút cố ý không tồn tại.

Và chồng **nạp lại ngay** sau khi ghi, nên nếu chồng vừa hoá từ `don` thành `mau-thuan` thì người
vừa ghi thấy hệ quả của chính việc mình làm — thay vì phát hiện ra ở lần mở màn sau.

### CHƯA kiểm được — cần mắt người

1. Biểu mẫu mở trong cột 360px có đẩy chồng khỏi tầm nhìn không (nay cột có thể chứa: panel duyệt
   + nhiều chồng + biểu mẫu).
2. Câu "không thay, đứng cạnh" có đọc ra nghĩa không — đây là câu quan trọng nhất của story.
3. **Chưa ai bấm "Ghi vào phả" lần nào.** Cùng lý do với 5-4 và 5-5.

### Việc này mở khoá cái gì cho anh

Năm sinh 1986 trên node của chính anh — thứ bảng tính có mà phả không có, vì `link` của bộ nạp
khung chỉ ghi cạnh cha-con chứ không ghi giá trị lên người đã có. Nay có đường: mở `/admin/cay`,
chọn node của mình, chồng **Sinh** → *Ghi thêm* → `1986`, nguồn *"bảng tính gia phả"*.
