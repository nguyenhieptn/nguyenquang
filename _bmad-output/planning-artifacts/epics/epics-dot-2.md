# Epics & Stories — Gia phả Nguyễn Quang, Đợt 2

> Sinh 24/08/2026 từ buổi brainstorming `_bmad-output/brainstorming/brainstorm-thiet-ke-lai-admin-2026-08-23/.memlog.md`.
> Trạng thái SỐNG nằm ở `_bmad-output/implementation-artifacts/sprint-status.yaml` — file này
> là cấu trúc, không phải trạng thái.
> Đợt 1 (Epic 1–4) chốt 23/08/2026 — xem `epics.md`.

## Nguyên tắc cắt epic của đợt này

Đợt 1 cắt theo tầng rồi theo bề mặt. Đợt 2 **cắt theo một bề mặt duy nhất**: cả epic là
**một trang**. Lý do nằm ở chính con bug mở màn — `app/ban-duyet/layout.tsx` cố ý không giữ
chrome, mỗi trang tự ghép, nên 2/4 màn quên mất thanh điều hướng và mọi màn error/loading
cũng mất. Một trang thì không thể mất menu.

Story vẫn là lát dọc giao được, nhưng chúng chồng lên nhau trong cùng một khung: 5-1 dựng vỏ,
5-2 dựng chỗ đứng, 5-3 dựng công cụ, 5-4…5-7 là ba việc hằng ngày cắm vào công cụ ấy.
**Không cắt đôi "vỏ trước, canvas sau"** — tách ra thì canvas phải làm lại từ đầu (chốt 24/08).

---

## Epic 5 — Bàn làm việc `/admin`

Thay `/ban-duyet` (4 tab ngang, 4 bề rộng, `<h1>` lặp 3 lần mỗi trang) bằng **một trang ba cột**:
worklist trái · canvas gia phả giữa · chồng khẳng định phải.

| Story | Tên | FR | AD chính |
|---|---|---|---|
| 5-1 ✅ | `5-1-vo-admin` — layout SỞ HỮU chrome; sidebar-worklist có số; tự thu thành ray khi vào canvas; `/ban-duyet/*` chuyển hướng sang `/admin`; tab "Xem trước" tan vào Nạp khung; một hệ bề rộng, một `<h1>` | nợ Đợt 1 | AD-1 |
| 5-2 | `5-2-canvas-neo` — lân cận quanh một NEO qua `bfsDistances`, nới ±1 đời; **chọn node KHÔNG dời neo**; ô keyword dời neo qua `searchPersons` | FR-11, FR-15 | AD-5, AD-13, AD-21 |
| 5-3 | `5-3-panel-khang-dinh` — panel phải là CHỒNG KHẲNG ĐỊNH, mỗi dòng: giá trị · tầng · xuất xứ · thời điểm; phân biệt chồng **mâu thuẫn** (⚠ chọn một) với chồng **nối tiếp** (▸ theo thời gian); nâng tầng ngay tại dòng | FR-1, FR-2, FR-3, FR-37 | AD-4, AD-9, AD-10, AD-17, AD-18, AD-19 |
| 5-4 | `5-4-them-nguoi` — **hai lối vào**: kéo từ cạnh một node (thấy vị trí TRƯỚC khi ghi), và **nút "Thêm người vào phả" ở đỉnh thanh việc** (chưa biết nối vào ai thì để rời, thành một mảnh — FR-48/FR-63); vào tồn nghi; ghi công người thêm | FR-3, FR-11, FR-48 | AD-9, AD-10 |
| 5-5 | `5-5-duyet-vao-pha` — người xin vào phả hiện thành **node mờ** cạnh chỗ họ nhận, [nhận]/[từ chối]; nối `listPendingAttachments`/`approveAttachment` | FR-64 | AD-8, AD-22 |
| 5-6 | `5-6-ghi-them-thong-tin` — nối `addAssertion` vào panel: ghi năm sinh/mất/ghi chú cho người ĐÃ CÓ | FR-1, FR-3 | AD-9, AD-10 |
| 5-7 | `5-7-noi-chon` — loại khẳng định `nơi`: gõ tự do → chấm điểm bằng `core/so-khop` → chọn nơi đã có hoặc tạo mới; phân biệt bằng đơn vị cha (Quang Trung/Định Hoá ≠ Quang Trung/Vũng Tàu) | **FR-65** | AD-14, AD-16 |
| 5-8 ⭑ | `5-8-so-dong-ho` — sửa được **tên họ · chữ đệm · đề từ** (`ClanSettings`). **Cần dựng hàm ghi trong `core/identity` trước** — hiện chỉ có `getClanInfo`, không có đường ghi nào | FR-? *(hố PRD)* | AD-10, AD-14 |

**Thứ tự phụ thuộc:** 5-1 → 5-2 → 5-3 → { 5-4, 5-5, 5-6 }. 5-7 chạy song song từ sau 5-3. 5-8 độc lập.

> ### Soi lại thanh việc — 24/08/2026
>
> **Chẩn đoán:** bản đầu gom mục theo chủ đề, và hoá ra **toàn hộp thư đến**. Mọi mục trả lời
> *"cái gì đang đợi tôi"*; không mục nào trả lời *"tôi muốn làm gì"*. Với bàn tu phả thì đó là
> ngược đầu — hàng chờ chỉ đầy khi NGƯỜI KHÁC đóng góp, mà những tháng đầu thì chưa ai; còn việc
> thường ngày là **ghi**: có người gọi báo một cụ vừa mất, phải viết được xuống ngay. Từ `/admin`
> hôm nay **không có đường nào** để làm việc ấy.
>
> Luồng `/them` của bề mặt A **không dùng lại được**: NFR-5 bó nó vào *một câu hỏi một màn*, bốn
> màn, năm loại quan hệ — đúng cho người cháu cầm điện thoại, sai cho người chép một trang phả
> giấy mười người một lượt. Không phải nó hỏng; nó là dụng cụ của bàn khác.
>
> **Chốt: thanh việc chia theo BỐN THANH GHI, không theo chủ đề.**
>
> | Thanh ghi | Là gì | Có số? | Mục |
> |---|---|---|---|
> | 1 · Hành động | một **nút**, không phải mục điều hướng | — | *Thêm người vào phả* |
> | 2 · Bàn làm việc | nơi đứng làm | không | Cây gia phả · Trang nhà |
> | 3 · Đối chiếu | hộp thư đến | **có** | Hàng chờ khẳng định · Duyệt vào phả · Mâu thuẫn · Mảnh chưa nối |
> | 4 · Sổ dòng họ | dữ liệu nền, sửa thưa nhưng phải sửa được | không | Nơi chốn · Tên họ & đề từ · Nạp khung |
>
> **Có số hay không** chính là thứ phân biệt thanh ghi 3 với 2 và 4 — không cần thêm hoa văn nào.
>
> **"Chỉnh sửa" KHÔNG có mục riêng, và đó là chủ ý.** AD-9/AD-10: hệ này không bao giờ đè một sự
> thật cũ; *sửa = ghi thêm một khẳng định* rồi để chồng khẳng định bày cả hai. Nên sửa không phải
> một màn — nó xảy ra ở **cột phải**, bất cứ chỗ nào một người đang hiện. Đường ngắn nhất tới đó
> là **ô tìm trên thanh trên**, và vì thế 5-2 phải đổi đích của ô tìm: hiện nó nhảy sang
> `/nguoi/[id]` (trang công cộng, bề mặt A) — đúng phải là **dời tâm canvas + mở cột phải**.
>
> **Nút "Thêm người" không mang son.** `DESIGN.md § Colors` cho son đúng một nghĩa — *đã chốt*.
> Nút này chỉ MỞ biểu mẫu, chưa ghi gì; son thuộc về nút gửi bên trong, như nút *"Ghi N dòng vào
> phả"* của màn Nạp khung.

> **24/08/2026 — 5-1 xong (`review`).** Vỏ đứng ở `app/admin/`, `/ban-duyet/*` chuyển hướng 308.
> **Luật cho mọi story sau:** thanh việc hiện chỉ có bốn mục có màn thật (Trang nhà · Hàng chờ
> khẳng định · Mảnh chưa nối · Nạp khung). Mỗi story **tự thêm mục của mình** vào
> `components/admin/man-admin.ts` khi màn của nó ra đời — 5-2 thêm *Cây gia phả*, 5-5 thêm
> *Duyệt vào phả*, 5-3 thêm *Mâu thuẫn*. Không thêm trước: `app/admin/chrome.test.ts` bắt lỗi
> nếu một mục trỏ vào màn chưa tồn tại.

### Ba phát hiện buộc epic này phải có mặt

| Phát hiện | Hệ quả |
|---|---|
| `listPendingAttachments` / `approveAttachment` **có trong `core/`, không màn nào gọi** | Luồng vào phả (FR-64) **đứt trên production** — người xin nhận chỗ nằm `pending` vĩnh viễn |
| `addAssertion` là **mã chết toàn app** | Không có đường nào ghi thêm năm sinh / ngày giỗ / tên huý cho người đã có — phả không lớn được |
| `addPerson` chỉ nằm ở luồng tự khai bề mặt A | Admin **không có màn thêm người** — đúng việc số một của ban tu phả |

### Vốn sẵn có (không phải dựng từ số không)

- `@xyflow/react ^12.11.2` đã trong `package.json`
- `bfsDistances(data, fromId, cap)` — `core/tree/ops.ts:396`, 5 module đang dùng
- `searchPersons()` → `SearchHit = PersonCard & { similar }`
- `core/so-khop` — `soKhopMoc`, `luatCung`, `tinHieuMem`, `boDau`, ba mức `cao/vừa/thấp`

**Rủi ro đã biết:** cách xếp cây là **tự viết** (`components/pha/xep-cay.ts`), không dùng
dagre/elk; hai commit gần nhất vừa sửa "thẻ đè lên nhau" và "cây bị bóp trong hộp cố định".
Tái dùng là thừa hưởng cả công lẫn tật — 5-2 phải tính giờ cho việc này.

> **Hạ mức rủi ro 24/08/2026 — bản dựng thử đã trả lời.** `xepCay()` chạy được cho bố cục quanh
> một neo **không phải sửa một dòng nào**: đặt `chaId: null` cho những người có cha nằm ngoài
> vùng lân cận là đủ, vì hàm đã vốn lặp qua nhiều gốc (`con.get(null)`). Cái 5-2 **thật sự** phải
> cẩn thận là chiều cao thẻ: truyền một **hằng số** vào `cao` chính là cách lỗi "thẻ đè lên nhau"
> ra đời — thẻ có vợ cao hơn thẻ không, nên `cao` phải là **hàm**. Xem
> `app/uiworkshop/admin-canvas-graph/page.tsx`.

### Ngân sách bề ngang (EXPERIENCE.md, sàn chữ 17px)

```
mở sidebar:  1280 − 240 − 360 =  680px canvas
thu thành ray: 1280 −  64 − 360 =  856px canvas
```

> **Sửa 24/08/2026 sau code review 5-1: ray là 64px, không phải 56px.** Bản đầu dựng ray `w-14`
> (56px) và hạ số đếm xuống 15px cho vừa. Nhưng AC 24 gọi đích danh *số đếm* thuộc sàn 17px và
> chặn luôn lối thoát — *"Chật thì bớt mục, không thu chữ."* Nới ray là cách duy nhất còn lại:
> ba chữ số ở 17px trong ray 56px thì tràn viền và bị vùng cuộn cắt cụt. Canvas mất 8px.
Ray **phải giữ lại con số** — nếu không, hộp thư đến biến mất đúng lúc đang làm việc.

---

## Thẻ thông tin — dựa vào phả Việt và phả Tàu

Đối chiếu 7 loại khẳng định hiện có với những gì phả cổ vốn chép, giữ được khoảng **một phần ba**.

| Phả cổ ghi | Nay chứa ở | Đợt |
|---|---|---|
| tên huý / tự / hiệu / thụy / tục danh | `name.otherNames` — túi không phân loại | Đợt 2 SHOULD |
| ngày sinh, ngày mất | ✅ `birth` / `death` | có rồi |
| **ngày giỗ (âm lịch)** | ❌ chỉ có `YYYY-MM-DD` dương | Đợt 2 SHOULD — FR-41 |
| **quê quán / trú quán** | ❌ | **Đợt 2 MUST — FR-65, story 5-7** |
| nguyên táng / cải táng / di táng | ❌ | Đợt 3 — trên nền FR-65 |
| hàng thứ (行第) — con thứ mấy | ❌ | Đợt 3 |
| học vị · chức tước · nghề | ❌ (đang nhét vào `note`) | Đợt 3 |
| tự bối (字輩) | ❌ | Đợt 3 |
| đức hạnh, sự tích | ✅ `note` | có rồi |

**An táng hợp mô hình khẳng định một cách hiếm có:** nguyên/cải/di táng là ba khẳng định
**cùng chính thức và cùng đúng**, xếp theo thời gian — không phải mâu thuẫn. Đây là lý do
5-3 phải phân biệt hai kiểu chồng ngay từ đầu, dù an táng đến Đợt 3 mới làm.

**Tự bối là đòn bẩy cho bài toán mảnh chưa nối:** chữ đệm theo đời là nhân chứng ĐỘC LẬP về
đời, nằm ngay trong tên — biết đời của một mảnh trôi mà không cần biết cha nó. Không phạm
AD-5 vì không lưu đời, chỉ lưu một sự thật về TÊN rồi suy ra. Dòng họ Nguyễn Quang **không có**
bảng tự bối theo đời; "Quang" là đệm của cả họ, tác dụng khác: cho ô keyword bỏ qua hai chữ
mang thông tin bằng không, và cho `tinHieuMem` một tín hiệu khi ghép mảnh.

---

## Hố PRD — đã lấp 24/08/2026

`nơi` từng không có FR nào đỡ. Nay là **FR-65 — Nơi chốn là dữ liệu, không phải chữ**,
viết ở `prds/prd-gia-pha-nguyen-quang-2026-08-10/prd.md` §5b. Story 5-7 hết chặn.

FR-65 buộc thêm ba điều mà 5-7 phải giữ: nơi **đi qua bán kính riêng tư** (nơi ở của người
còn sống là địa chỉ — FR-37 + §11); nơi **gộp và tách được** như FR-48 với người; và **trống
là trạng thái hợp lệ**, không phải lỗi cần nhắc.

FR-65 cũng là nền cho những thứ đã nằm sẵn trong backlog: FR-62 bản đồ di cư, trang "Đất tổ",
QR mộ phần & bản đồ tảo mộ.

---

## Sau epic này (SHOULD / COULD — ghi để không ai tưởng là quên)

**SHOULD, Đợt 2 nếu kịp**
- **Ngày giỗ (âm lịch)** — **FR-41 đã có sẵn trong PRD §7** ("lịch giỗ âm lịch", nhóm *Trước
  ngày ra mắt*), nên đây không phải hố PRD, chỉ là chưa tới lượt. Thứ dòng họ mở phả ra xem
  nhiều nhất; xếp sau **chỉ vì rủi ro kỹ thuật** (cần thư viện đổi lịch), không phải vì ít giá
  trị. **Chốt 24/08/2026: giữ ở SHOULD.**
- `hideAssertion` trong panel — nhỏ, đã có sẵn chỗ
- **Người dùng & vai** — `docs/van-hanh.md` đang phải ghi "nâng vai chưa có màn UI"
- **Thông tin dòng họ** — họ · đệm *Quang* · bảng tự bối (để trống thì không tốn gì)
- Tên phân loại huý/tự/hiệu/thụy — đổi hình `name.otherNames`, có phí migration
- Nhật ký (`core/audit` đã có, chưa có màn)

**COULD, Đợt 3**
An táng (nguyên/cải/di) · hàng thứ · học vị–chức tước–nghề · tự bối suy đời + soát ngược ·
quản lý lời kể (`updateRecordingAccess`, `withdrawRecording` — cũng đang không màn nào gọi) ·
điều hướng canvas theo NƠI.

---

## Hoãn có chủ đích

**Vai vợ — chính thất / kế thất / thứ thất (và 妾).** Không phải vì sai: phả cổ có chép thì
đó là sử liệu. Hoãn vì nó cần một quyết định tỉnh táo về chỗ **cấu trúc cây không được phụ
thuộc vào nó**, và đó là một cuộc bàn, không phải một vé.

Chép nguyên HÌNH của phả cổ là chép luôn LOẠI TRỪ của nó: con gái không vào phả, vợ chỉ ghi
"bà họ Trần" không tên, cháu ngoại tính là người ngoài — xỉ lục còn chép hẳn mục "có phú quý
ngoại tôn hay không". Ghi thứ bậc khi nguồn có nói thì được; để nó chui vào schema một cách
vô thức thì không.

Cùng nhóm: táng hướng 山向, giờ sinh (sinh tử tới giờ trong xỉ lục).

---

## Nợ Đợt 1 mang sang (đầy đủ ở `docs/van-hanh.md § Việc còn nợ`)

Sao lưu + media **cùng máy** với production (vi phạm AD-25) · Google/FB login chưa bật ·
chưa có TLS/tên miền · FR-55 còn pull-based. Không thuộc Epic 5 nhưng vẫn là nợ của đợt.
