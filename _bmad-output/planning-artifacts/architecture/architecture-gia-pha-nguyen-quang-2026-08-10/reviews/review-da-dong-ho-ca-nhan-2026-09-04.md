# Review kiến trúc: nhiều dòng họ cùng dùng, mỗi người dùng tự tạo cây gia phả nhà mình

Ngày: 04/09/2026, ba lượt trong một buổi. Lượt một đọc mã và tài liệu tới commit `3cec482`,
không chạy test hay build. Lượt hai bàn mô hình mọc từ dưới lên kèm khớp và gộp mảnh. Lượt ba chủ
dự án **gác lại toàn bộ bàn luận về gộp và khớp**: cần dữ liệu thật trước rồi mới quyết được, và
các vấn đề dữ liệu ấy sau này xử lý sau, có thể bằng AI. Bản này là bản sau lượt ba.

> **HƯỚNG ĐANG GIỮ, duy nhất:** một người dùng vào hệ thống thì tạo được cây gia phả nhà mình.
> Nhiều dòng họ sống trên cùng một hệ thống, mỗi dòng họ là của người tạo ra nó.
>
> **TRẠNG THÁI: CHƯA TRIỂN KHAI.** Không story nào sinh ra từ bản này. Nó tồn tại để mọi story
> tới đây **dựng sẵn nền dữ liệu** (§ 5) và **thu đúng dữ liệu** (§ 4.3), để khi có dữ liệu thật
> thì quyết được mà không phải dỡ thứ đã xây.
>
> **Triển khai đầu tiên:** một dòng họ, dòng họ Nguyễn Quang, tài khoản quản trị
> `nguyenquanghiep@gmail.com`. Chủ dự án xây cho họ mình trước.
>
> **Đã gác, không phải quyết định:** khớp node xuyên dòng họ, nối cá nhân, gộp mảnh, riêng tư
> người sống khi hệ thống mở. Ghi chú còn giữ ở § 6 để khỏi nghĩ lại từ đầu, không ai làm theo.

---

## 0. Kết luận

| Hướng | Hôm nay | Khoảng cách | Việc gốc |
|---|---|---|---|
| Nhiều dòng họ cùng dùng, mỗi người tự tạo cây nhà mình | Tầng dữ liệu đã sẵn: RLS ép, không hard-code, gate hai dòng họ, một tài khoản gắn được ở nhiều dòng họ ngay trong schema. Tầng phiên và route là **một dòng họ**: `soleClanId()` chọn dòng họ đầu tiên theo `created_at`, không route nào mang dòng họ. Tạo dòng họ chỉ có bằng script. | **Vừa.** Gọn nhờ AD-24: 62 chỗ mở `withClanContext` trong 17 file core đều lấy `clanId` từ phiên. Ruột tạo dòng họ đã có trong `bootstrap.ts`. | Dòng họ hiện tại trong phiên; slug trong đường dẫn; một bề mặt tạo dòng họ gọi từ phiên. |
| Mọi thứ xuyên dòng họ | Không có gì, và RLS cố ý không cho. | Gác. | Có dữ liệu rồi quyết. |

---

## 1. Hướng đang giữ: mỗi người dùng tạo cây nhà mình

- **Đăng ký là có dòng họ.** Một tài khoản mới sinh một dòng họ, một node tự khai, một đường
  ngắn. Người tạo là quản trị. Không cần ai cấp, không cần admin hệ thống.
- **Cây lớn dần** bằng đúng luồng tự khai bốn bước của FR-11 và đường ghi hôm nay: cha mẹ, ông
  bà, anh em, vợ chồng, con.
- **Dòng họ là của họ.** Đường ngắn là của họ, quản trị là họ, dữ liệu nằm trong phân vùng của
  họ. Không ai bị nhập vào đâu.
- **Chuyện giữa các dòng họ để sau.** Có vài trăm cây thật rồi mới biết chúng trùng nhau kiểu gì,
  người ta muốn gì, và lúc ấy công cụ xử lý dữ liệu đã khác hôm nay.

Điều mô hình này tháo được ngay: khởi động lạnh của PRD §3 tự giải, ai vào cũng thấy tên mình vì
họ bắt đầu từ mình; bài toán con-gà-quả-trứng ở tầng dòng họ biến mất; ghi chú Đợt 3 của spine
về admin hệ thống thôi là cửa vào.

---

## 2. Những gì đã đúng hướng, giữ nguyên

- **RLS ép, fail-closed trên 11 bảng**, vai ứng dụng không sở hữu bảng, không BYPASSRLS. Gate
  `core/gates/rls.gate.test.ts` chứng minh cách ly trên mọi bảng phân vùng và bắt policy
  `USING (true)`. Phần khó nhất của đa dòng họ đã xong đúng cách.
- **Tài khoản không phải người** (AD-8); bảng `user`/`session`/`account` ngoài phân vùng.
- **`attachment_account_clan_uq` là (clan_id, account_id)**: schema đã cho một tài khoản gắn ở
  nhiều dòng họ. Chỉ `resolveSessionImpl` chưa đọc quá một.
- **Dòng họ là dữ liệu** (AD-14); danh bạ `clan` đọc mở từ migration 0002.
- **UUIDv7 cho mọi khoá** (AD-6): id không đụng nhau giữa các dòng họ.
- **Ảnh revision đầy đủ** (AD-4/AD-10), **nguồn trên mọi khẳng định** (FR-1): đây là thứ giúp
  "có dữ liệu rồi quyết" có nghĩa. Không ai quyết được trên dữ liệu không có nguồn và không có
  lịch sử.
- **Vé nghe media mang `clanId`** và từ chối vé của dòng họ khác.
- **Quyền của người sống có nền thật**: ẩn và từ chối in chỉ chủ thể ghi, chỉ thu hẹp; thông báo
  nợ node; rút lời kể vĩnh viễn.
- **Ba bộ khớp trong một dòng họ đã có, đều tất định, đều chỉ gợi ý**: `core/so-khop/cham-diem.ts`,
  `suggestDuplicatesOp` trong `core/merge`, `core/seed`. Không đụng tới.
- **Dòng họ thử** đã chứng minh hai dòng họ sống chung một database và một tiến trình.
- **AD-23 cấm cache theo người xem**: đúng cho đa người thuê.

---

## 3. Chỗ còn giả định "một dòng họ"

| Thành phần | Hôm nay | Cần gì | Độ nặng |
|---|---|---|---|
| **Chọn dòng họ cho phiên** (`clan-registry.ts`, `auth.ts`) | `soleClanId()` trả dòng họ đầu tiên theo `created_at`; nhiều hơn một thì chỉ `console.warn`. | Phiên có dòng họ hiện tại: tài khoản từ tập attachment `active`, khách từ đường dẫn. `soleClanId` rút về script và test. | Vừa, gọn trong `core/identity`. |
| **Route không mang dòng họ** (31 `page.tsx`) | `/nguoi/[id]` chỉ có id. RLS fail-closed nên id không tự nói nó thuộc dòng họ nào. | Đoạn đường dẫn `/<slug>/…`. | Vừa: mọi `href`, `revalidatePath`, bản đăng ký bộ đo. |
| **`clan` chưa có `slug`, quê gốc** | `id`, `name`, `settings` (họ, chữ đệm, đề từ), `created_at`. | Hai thứ ấy. Xem § 5.2. | Nhỏ. |
| **Tạo dòng họ** (`ensureClan`) | Chỉ có qua script; idempotent theo "đã có **bất kỳ** dòng họ nào", nên cờ `--clan` của `create-admin.ts` là mã chết khi database có một dòng họ. | Một bề mặt core gọi từ phiên, tạo theo slug. Ruột `createAdmin` dùng lại được gần nguyên. | Nhỏ, nhưng là chỗ hỏng đầu tiên khi có dòng họ thứ hai. |
| **Better Auth** | Một `baseURL`, cookie theo host. | Chọn đường dẫn thì không đổi gì. Subdomain thì cookie, origin, callback Google đều theo. | Nhỏ nếu đường dẫn. |
| **Media** (`storage.ts`) | Khoá phẳng, sidecar chỉ có `mime`. | Xuất hay xoá media của một dòng họ cần biết dòng họ. Ghi `clanId` vào sidecar. | Nhỏ. |
| **Sao lưu** (`backup.sh`) | `pg_dump` cả database. | Xuất và khôi phục theo dòng họ: `SET LOCAL app.clan_id` rồi `COPY` từng bảng phân vùng. | Vừa, vận hành. |
| **Bộ đo và kịch bản ghi** | Rào theo `GIAPHA_CLAN_ID`. | Rào theo slug. | Nhỏ. |
| **Tải** (`getClanOverview`, pool 10) | Nạp cả cây mỗi request. | Nhiều dòng họ nhỏ thì pool là giới hạn gặp trước, không phải cây. | Theo dõi. |
| **Test** | Ghim env chọn dòng họ tạm. | Ghim theo slug. | Nhỏ. |

**Rủi ro đáng nói thẳng:** `soleClanId()` khi thấy nhiều hơn một dòng họ thì phục vụ dòng họ
đầu tiên và chỉ cảnh báo. Đúng cho hôm nay. Khi mở đa dòng họ, hàm này phải biến mất, không được
nới. Nhiều dòng họ mà không có slug trong đường dẫn thì 404.

---

## 4. Hình dáng đích cho hướng đang giữ

### 4.1 Dòng họ tự tạo

- **Ruột đã có** trong `core/identity/bootstrap.ts`: node tự khai, nguồn `self`, gắn kết active
  vai admin không cần bảo lãnh. Thiếu một bề mặt core gọi từ phiên thay vì từ script.
- **Đường ngắn:** `clan.slug` duy nhất, sinh từ tên người tạo cộng hậu tố, sửa được ở sổ dòng
  họ. `nguyen-quang` là tên của hàng trăm họ, nên slug không đặt theo họ.
- **Danh bạ để tìm trước khi tạo:** rẻ vì `clan` đã đọc mở; màn tạo bày các dòng họ cùng họ và
  quê gốc, thấy thì mời xin gắn. Không ép, không tự quyết. Đây là tìm kiếm, không phải khớp.
- **Chống rác:** email đã xác minh (Better Auth có cờ, dự án chưa bắt); trần số dòng họ một tài
  khoản tạo. Mức cụ thể chốt khi mở.

### 4.2 Phiên và route

- `resolveSessionImpl` đọc **mọi** attachment `active` của tài khoản, chọn theo slug trong đường
  dẫn. Khách chọn theo slug. AD-24 giữ nguyên: core vẫn tự đọc, adapter không truyền.
- Route `/<slug>/…` cho cả bề mặt A và B. Đường `/` thành trang tìm, chọn và tạo dòng họ.
- **Triển khai đầu tiên không đổi gì cho người dùng:** khi database chỉ có một dòng họ, `/`
  chuyển hướng về `/<slug>` của nó.
- Chọn đường dẫn, không subdomain: không chạm Better Auth, không cần tên miền hay TLS trước.

### 4.3 Dữ liệu phải thu để sau này quyết được

"Có dữ liệu rồi quyết" chỉ đúng nếu dữ liệu ấy được thu. Xử lý sau, bằng luật hay bằng AI, đều
không bù được thứ chưa từng hỏi. Bốn trường quyết định mọi phép so sau này, và cây thật đã từng
gãy đôi vì thiếu một trong số đó:

- **Năm sinh**, kể cả ước chừng với `precision: 'approximate'`. Luồng thêm con và tự khai phải
  hỏi; node quản trị thiếu năm sinh là bài học 25/08.
- **Tên cha** qua cạnh cha con, không phải chữ tự do. Đường ghi hôm nay đã ép.
- **Quê quán** qua `place`, không phải ghi chú.
- **Năm mất** với người đã khuất; `cham-diem.ts` đang coi đây là mốc chắc nhất.

Cộng hai thứ đã có và phải giữ: **nguồn** trên mọi khẳng định, **ảnh đầy đủ** trong revision.

---

## 5. Nền dữ liệu cần dựng sẵn

Phần duy nhất có hiệu lực ngay. Không mở tính năng nào; chỉ giữ cho mọi story tới đây không xây
thứ phải dỡ.

### 5.1 Giữ, và gate đang ép

- Mọi bảng mới mang `clan_id` và khai vào `PARTITIONED_TABLES`. Bảng cố ý ngoài phân vùng phải
  có bài gate riêng nói rõ nó lộ gì.
- UUIDv7 cho mọi khoá. Không sequence theo dòng họ, không khoá tổ hợp có `clan_id`.
- Không khoá ngoại xuyên dòng họ ở bảng phân vùng.
- Ảnh `before`/`after` đầy đủ trong `revision`. Nguồn trên mọi khẳng định.
- Tên đi qua `nameFolded` (AD-16).
- Không hằng nào của Nguyễn Quang trong `core/` và `db/` (AD-14). Mặc định ở `create-admin.ts`
  là cấu hình của triển khai đầu tiên.

### 5.2 Thêm sớm, rẻ, không đổi hành vi

Làm khi chạm tới bảng ấy lần tới, không cần story riêng:

- `clan.slug` (unique, có thể null tới khi mở) và khoá `origin` (quê gốc) trong `ClanSettings`
  cùng whitelist `KHOA_SETTINGS` của `info.ts`.
- Sidecar media ghi thêm `clanId`.
- `assertion` có chỉ mục `(clan_id, kind)`; đã nợ ở deferred-work từ 7-5.

### 5.3 Không làm thêm chỗ giả định một dòng họ

- Mọi chỗ cần `clanId` đi qua `resolveSession`/`resolveViewer`. Lint AD-24 đang gác; không thêm
  người đọc `soleClanId` thứ ba ngoài `auth.ts` và `bootstrap.ts`.
- Không cache ở tầng module theo dòng họ.
- Link nội bộ mới nên đi qua một chỗ dựng đường dẫn thay vì chuỗi `'/nguoi/…'` rải rác, để chèn
  slug sau này là sửa một chỗ. Chưa có helper ấy; story nào thêm nhiều link thì dựng.
- Không dùng `ownerPool()` trong app để đọc chéo, kể cả "tạm".

### 5.4 Chưa dựng, chờ có dữ liệu

Không dựng bất kỳ thứ gì ở § 6. Dựng sớm mà không dùng là nợ bảo trì không có người trả.

---

## 6. Đã gác: ghi chú của lượt hai, không phải quyết định

Giữ lại để khi có dữ liệu thì không phải nghĩ lại từ đầu. Không story, không schema, không AD nào
sinh ra từ mục này.

- **Khớp node xuyên dòng họ.** Vai ứng dụng không đọc được người của dòng họ khác, nên bộ khớp
  không chạy được trong `withClanContext`. Lối đã bàn: một bảng chỉ mục ngoài phân vùng, chỉ
  chứa những gì khách đã thấy được ở mức `limited`, core ghi cùng lúc chiếu cột, gate khẳng định
  mức lộ. Tín hiệu cần đủ ba: tên gấp dấu, năm sinh hoặc năm mất, một tín hiệu quan hệ. Chữ
  "Nguyễn Quang" tự nó khớp cả họ. Người sống thì gợi ý chỉ tới chính họ.
- **Nối cá nhân.** Thực thể `individual` ngoài phân vùng; gắn tài khoản hai bước; quyền FR-55
  áp xuống mọi node đã nối; bán kính riêng tư **không** xuyên dòng họ.
- **Gộp mảnh.** Hai dòng họ hoá ra cùng phụ hệ thì một cây chung chỉ có được bằng gộp thật
  `clan_id`, tức một hàm SECURITY DEFINER thuộc owner, chạy khi hai bên đồng ý, có thời gian
  chờ, đường cũ chuyển hướng qua `clan.merged_into`. Khớp qua hôn nhân thì chỉ nối, vì nhà vợ
  không phải dòng họ nhà chồng.
- **Riêng tư người sống khi hệ thống mở.** Mức `limited` cho khách hợp với một dòng họ vài trăm
  người; khi phần lớn dòng họ là gia đình vài người còn sống thì phải xem lại, tức chỉnh AD-13.
- **Câu hỏi treo lúc ấy:** ai làm chủ sau gộp; chỉ mục chứa ai; khách ở dòng họ khác thấy gì;
  admin hệ thống có cần không; chờ bao lâu trước khi gộp.

---

## 7. Chưa kiểm, và giả định

- Không chạy `npm test`, `npm run build`, hay bộ đo. Mọi nhận định từ đọc mã và tài liệu tới
  commit `3cec482`.
- Chưa đo tải với nhiều dòng họ; nhận xét về pool suy từ cấu hình.
