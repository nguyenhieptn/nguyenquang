# Phiếu khai gia phả — hướng dẫn phát và nạp

> Dùng cho FR-51 (nạp khung). Tệp điền xong nạp ở `/admin/nap-khung`; khung rỗng tải ở
> `/admin/nap-khung/mau`. Hợp đồng cột nằm ở `core/seed/csv.ts` — **file này phải khớp với nó**,
> sửa một bên thì sửa cả hai.

## 1. Tám cột, không hơn không kém

Dòng đầu của bảng phải đúng như sau, đúng thứ tự nào cũng được nhưng **không thừa không thiếu**:

```
ho_ten,gioi_tinh,nam_sinh,nam_mat,ten_cha,ten_vo_chong,chi,ghi_chu
```

| Cột | Điền gì | Bắt buộc |
|---|---|---|
| `ho_ten` | Tên đầy đủ, **giữ nguyên dấu**: `Nguyễn Quang Hoạch` | ✅ |
| `gioi_tinh` | `nam` · `nu` · `khac` — hoặc để trống | |
| `nam_sinh` | **Đúng bốn chữ số**: `1926` | |
| `nam_mat` | Đúng bốn chữ số. Người còn sống thì **để trống** | |
| `ten_cha` | Tên đầy đủ của cha, **chép y hệt** cột `ho_ten` của cha | |
| `ten_vo_chong` | Tên đầy đủ vợ hoặc chồng | |
| `chi` | Nhãn chi nhà mình vẫn gọi: `Chi Nhất`, `Chi Hai`… **Chỉ là ghi chú** — xem §3b | |
| `ghi_chu` | Chữ tự do. **Chỗ duy nhất giữ được "ai kể"** — xem §4 | |

## 2. Bốn luật cứng — sai một ô là cả tệp không vào

Bộ đọc là **ăn cả hoặc ngã về không**: một ô hỏng thì **không dòng nào** được nạp, và màn nạp
khung trả về một danh sách dài số dòng cần sửa.

1. **Năm là bốn chữ số trần.** `khoảng 1926`, `1926?`, `Bính Dần`, `19/3/1926` — hỏng cả tệp.
   Không chắc năm thì **để trống**; ghi phỏng đoán vào `ghi_chu` (`"nghe nói tuổi Dần"`).
2. **Đừng để bảng tính tự định dạng cột năm thành Ngày tháng.** Google Sheets rất hay làm việc
   này. Bôi đen bốn cột năm → Định dạng → Số → **Văn bản thuần**, làm ngay khi vừa tạo bảng.
3. **`nam_mat` không được nhỏ hơn `nam_sinh`.**
4. **Không thêm cột, không đổi tên cột, không xoá cột.** Thêm một cột `dien_thoai` là cả tệp
   bị từ chối. Cần ghi gì thêm thì viết vào `ghi_chu`.

## 3. Tên là khoá nối — chỗ nguy hiểm nhất

Hệ nối cha–con **bằng chuỗi tên**, không bằng mã. `ten_cha` phải chép **y hệt** cột `ho_ten` của
người cha (dấu có thể khác, hệ tự bỏ dấu để so; nhưng chữ phải đúng).

Hệ quả phải biết trước khi phát phiếu:

- **Tên viết lệch một chữ → mất mối nối.** `Nguyễn Quang Hoạch` ≠ `Nguyễn Q. Hoạch`. Người con
  vẫn vào phả, nhưng đứng rời thành một mảnh. Sửa được sau ở `/admin/hop-nhat`, chỉ mất công.
- **Hai người TRÙNG TÊN — máy KHÔNG đoán.** Nếu tên cha ứng với hơn một người (hai dòng trong
  tệp, hoặc hai người đã có trong phả), bộ nạp **từ chối nối**: người con vẫn vào phả nhưng đứng
  thành gốc một mảnh, và màn xem trước dựng cảnh báo **"Có hai người cùng tên cha"** ngay dưới
  dòng ấy. Nối tay ở màn **Mảnh chưa nối** — ở đó nhìn được cả hai người rồi mới chọn.

  Nối nhầm cha làm hỏng phả của cả một chi; thiếu một mối nối thì nối lại được.

  > **Sửa 24/08/2026.** Trước đó mã lấy **dòng trùng tên đầu tiên** mà không kiểm có dòng thứ
  > hai không. Tái hiện trên DB thật: `Hùng-1943 (Chi Nhất)` · `Hùng-1961 (Chi Ba)` · `Minh-1990`
  > khai cha là *Nguyễn Quang Hùng* → Minh nối vào **cụ 1943**, sai cha, sai chi, dòng Minh
  > không có cảnh báo nào, **nạp báo thành công**. Nay có hai test hồi quy trong
  > `core/seed/seed.test.ts`.

  **Vẫn nên né từ đầu:** cắt phiếu theo chi (§5) và soát cột `ho_ten` bằng *Định dạng có điều
  kiện → giá trị trùng lặp* trước khi nạp. Máy giờ không nối sai nữa, nhưng nối tay vẫn tốn công.

## 3b. Cột `chi` KHÔNG tạo ra chi — và cái gì tạo ra chi

Điều anh chị điền vào cột `chi` **không xếp ai vào chi nào**. Nó được giữ nguyên văn thành một
dòng ghi chú trên hồ sơ người ấy:

```
Chi (theo tệp nạp khung): Chi Nhất
```

Chi thật được **tính lúc đọc** từ chuỗi `ten_cha` (AD-5): ai truy lên tới người con thứ nhất của
cụ gốc thì thuộc chi 1, con thứ hai thì chi 2… Nghĩa là **`ten_cha` mới là thứ dựng ra chi**, còn
`chi` chỉ là lời của gia đình.

### Vậy điền `chi` để làm gì

Để **đối chiếu**. Nạp xong, chỗ nào chi máy tính ra khác chi gia đình ghi, chỗ ấy gần như chắc
chắn có một mắt `ten_cha` sai. Đó là cái lưới bắt lỗi rẻ nhất trong cả tệp — nên điền, và điền
**thống nhất một cách viết** ở mọi dòng (`Chi Nhất` xuyên suốt, đừng lúc `Chi 1` lúc `chi nhất`).

Dòng họ không có tên chi thì **để trống**, hệ vẫn tự chia chi được.

### ⚠️ Thứ THẬT SỰ quyết số hiệu chi: năm sinh của các con cụ gốc

Các con của một người được xếp **theo năm sinh**. Ai **không có năm sinh thì bị xếp xuống cuối**.

Đã chạy thử trên DB thật — cụ Tổ có ba con trai, chỉ **bỏ trống năm sinh của con cả**:

```
TMP Ông Cả,nam,,,TMP Cụ Tổ,,Chi Nhất,   ← con cả, bỏ trống nam_sinh
TMP Ông Hai,nam,1905,,TMP Cụ Tổ,,Chi Hai,
TMP Ông Ba,nam,1910,,TMP Cụ Tổ,,Chi Ba,
```

Kết quả:

```
chi 1  →  TMP Ông Hai
chi 2  →  TMP Ông Ba
chi 3  →  TMP Ông Cả     ← Chi Nhất hoá thành chi 3
```

Nên: **năm sinh quyết định thứ tự anh em ở MỌI tầng**, không riêng tầng trên cùng. Không tra ra
năm chính xác thì điền năm ước rồi ghi rõ *"năm ước"* vào `ghi_chu` — **thứ tự đúng đáng giá hơn
một năm chính xác**, vì thứ tự là thứ đi vào mã chi còn con số thì không.

### 3c. Mã chi sẽ ĐỔI khi cây mở ngược lên trên — và đó là đúng

Gia phả mở ra liên tục. Người trên cùng hôm nay chỉ là **cụ xa nhất hiện biết** (FR-63), không
phải Thuỷ tổ. Ngày nào tìm ra thêm một đời bên trên, **cả họ được đánh số lại**.

Đã chạy thử hai đợt nạp trên DB thật:

```
ĐỢT 1 — mới biết tới cụ Tổ            ĐỢT 2 — tìm ra cha của cụ Tổ, và cụ Tổ có anh cả
  gốc tạm: Cụ Tổ                        gốc tạm: Cụ Cao
  Ông Cả   → đời 2 · mã "1"             Ông Cả   → đời 3 · mã "2.1"
  Ông Hai  → đời 2 · mã "2"             Ông Hai  → đời 3 · mã "2.2"
  Cháu A   → đời 3 · mã "1.1"           Cháu A   → đời 4 · mã "2.1.1"
```

Màn hình gọi tên chi theo **khúc đầu** của mã, nên **"chi Nhất" hoá thành "chi Hai"** cho cả
nhánh, và ai cũng lùi xuống một đời.

Đây **không phải lỗi**: AD-5 cố ý không lưu đời và mã chi ở đâu cả, tính lại mỗi lần đọc, nên
không có con số cũ nào nằm lại thành sai. `core/tree/tree.test.ts` có hẳn một test canh việc ấy
(*"a parent above the old root shifts everything on the next read"*).

Ba điều rút ra cho người điền phiếu:

1. **Đừng đi tìm cụ tổ trước khi điền.** Điền tới đâu biết tới đó, bỏ trống `ten_cha` ở người
   trên cùng mình biết. Mảnh rời là trạng thái bình thường, nối lại sau.
2. **Thứ tự anh em thì bền, số hiệu chi thì không.** Ông Cả vẫn là *"…1"* ở cả hai đợt vì vẫn là
   con cả của cụ Tổ; cái đổi là **độ sâu**, không phải thứ tự. Nên công sức nên đổ vào `ten_cha`
   và năm sinh, đừng đổ vào việc chi này phải mang số mấy.
3. **Phép đối chiếu ở §3b chỉ đúng TRONG MỘT ĐỢT**, trước khi gốc dịch. Sau khi cây mở lên trên,
   chi máy tính ra khác chi gia đình ghi là **chuyện đương nhiên**, không còn là dấu hiệu sai.

## 4. Ghi công sẽ mất, và đây là chỗ vá tạm

Mọi dòng nạp vào phả đều mang đúng một nguồn: `Nạp khung từ tệp CSV`. FR-39 ghi công
theo **người**, nhưng một tệp điền chung xoá sạch ai kể điều gì.

Chưa có đường nào giữ lại việc ấy ngoài `ghi_chu`. Nên dặn người điền:

> Dòng nào nghe được từ người khác thì viết vào `ghi_chu`: **"chú Bình kể, 8/2026"**.

## 5. Cho người phát phiếu

### Cắt phiếu theo CHI, đừng làm một bảng cho cả họ

Ba cái lợi, không phải để gọn mắt:

1. Tệp nhỏ đủ để **soát trùng tên bằng mắt** — mà trùng tên là ca hỏng nặng nhất (§3).
2. Người điền là người **biết chi ấy**, nên `ghi_chu` mới có nội dung thật.
3. Một ô sai chỉ chặn một chi, không chặn cả họ (§2 — ăn cả hoặc ngã về không).

Nạp từng tệp một, xem trước rồi ghi, xong tệp này mới sang tệp sau.

### Ba thứ KHÔNG phải lo — đừng bắt người trong họ mất công

- **Thứ tự dòng không quan trọng.** Bộ nạp sắp xếp topo trước khi ghi; con đứng trên cha vẫn nối
  đúng.
- **Bỏ trống `ten_cha` là hợp lệ và đúng.** Người ấy thành **cụ xa nhất hiện biết** của một mảnh
  (FR-63) — không phải khẳng định đã là Thuỷ tổ.
- **Ô trống khắp nơi là hợp lệ.** Khung là thứ chưa đầy đủ theo định nghĩa. Một ô trống nói đúng
  sự thật; một con số điền tạm thì về sau không ai biết là đoán.

### Riêng tư — quyết trước khi bấm Chia sẻ

Bảng này chứa **tên, năm sinh, vợ chồng của người còn sống** — đúng loại dữ liệu mà FR-37 và
PRD §11 mặc định để riêng. Hệ thống bảo vệ được nó **sau khi** nạp; một bảng Google chia sẻ
*"ai có link"* thì mất bảo vệ **trước khi** hệ thống kịp thấy.

Chia sẻ theo **địa chỉ email từng người**, quyền *người chỉnh sửa*, tắt *ai có link*. Nạp xong
thì hạ tệp xuống chỉ-xem.

### Xuất từ Google Sheets

`Tệp → Tải xuống → Giá trị được phân tách bằng dấu phẩy (.csv)`. Bộ đọc nhận UTF-8 có BOM hay
không đều được, dấu tiếng Việt giữ nguyên, dấu phẩy trong `ghi_chu` được bảng tính tự đóng ngoặc
kép nên không sao.

## 6. Lời nhắn gửi người trong họ (chép thẳng đi được)

> Nhà mình đang dựng lại gia phả. Bảng đính kèm là phần **chi …**, mỗi người một dòng.
>
> - Chỉ điền những gì **chắc chắn**. Không nhớ thì **để trống** — để trống không sai, điền đại
>   mới sai, và về sau không ai biết đâu là đoán.
> - Năm sinh, năm mất viết **bốn chữ số**: `1926`. Không chắc thì bỏ trống, ghi phỏng đoán vào
>   cột *ghi_chu*.
> - Cột **ten_cha** chép **y hệt** tên cha ở cột *ho_ten* — hệ nối cha con bằng đúng chuỗi tên ấy.
> - **Đừng thêm hay đổi tên cột.**
> - Điều gì nghe được từ người khác thì ghi vào *ghi_chu*: *"chú Bình kể, 8/2026"*.
>
> Mọi điều điền vào đều **sửa được về sau** — không có gì khoá lại.

---

## Nợ đã biết của khuôn phiếu này

Ghi ra để người sau không tưởng là quên:

| Thiếu gì | Vì sao chưa có |
|---|---|
| Mã dòng (`ma` / `ma_cha`) để nối cha con **không bằng tên** | Đã cân nhắc và **cố ý không làm** (24/08/2026): tám cột giữ nguyên cho người điền đỡ ngại. Giá phải trả: ca trùng tên phải nối tay ở màn Mảnh chưa nối (§3). Mở lại nếu số mảnh rời sau vài đợt nạp lên quá sức nối tay |
| Cột nguồn theo từng dòng | §4 — FR-1 đòi mỗi khẳng định có nguồn; nạp khung đang cho cả tệp chung một nguồn |
| Ngày giỗ âm lịch | FR-41, chưa dựng |
| Nơi chốn (quê quán, nơi an táng) | FR-65, story 5-7 |
| Tên huý / tự / hiệu / thụy | chưa có FR |
