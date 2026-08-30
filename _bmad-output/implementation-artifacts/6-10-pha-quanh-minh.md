---
baseline_commit: 34915ca
---

# Story 6.10: Phả quanh mình — cây và phiếu cho người trong họ

Status: review

## Story

Là **người trong họ đã nhận chỗ trong phả** (thành viên thường, không có quyền duyệt),
tôi muốn **mở Gia phả là thấy cây quanh mình — mình ở giữa, cha mẹ trên, vợ chồng chung thẻ, con
dưới — và chạm một người là phiếu của họ mở ngay bên cạnh, ghi thêm được tại chỗ**,
để **sửa được cuốn phả từ chính chỗ mình đứng, không phải đi vòng qua bàn của ban tu phả; còn
duyệt thì vẫn là việc của ban tu phả**.

## Bối cảnh — yêu cầu chủ dự án 29/08/2026, và cái lỗ nó chỉ ra

> *"với user login — frontend view cây gia phả cũng sẽ cần cấu trúc như cây gia phả + sidebar như
> trong bàn làm việc, khác là thành viên login này chỉ nhìn được gia phả các node liên quan tới
> họ. họ cũng có thể thêm node, sửa thông tin, tuy nhiên không duyệt được. quản lý của gia phả mới
> có thể duyệt."*

Đợt 3 cắt theo động từ **SỬA**, và tới 6-9 đường sửa chỉ có ở `/admin`. Người trong họ có đúng
hai lối ghi: luồng tự khai bốn bước (`/them`, thêm người MỚI) và nút *"Sửa thông tin về mình"* ở
trang Tôi — nút ấy dẫn về `/nguoi/[id]`, nơi **không có ô nào để sửa**. Tức là cả Đợt 3 dựng
đường sửa cho một người dùng (Hiệp), trong khi triết lý sản phẩm là *"con cháu đề xuất, trưởng
họ duyệt"* (`docs/project.md § Định vị`): con cháu chưa có chỗ nào để đề xuất một lời sửa.

Cái đã có sẵn, không phải dựng lại: canvas vùng lân cận (5-2) · phiếu lý lịch (5-3 · 6-7) · ba
biểu mẫu ghi (5-4 · 5-6 · 5-7 · 6-1) · bộ chọn người (6-1) · `getNeighborhood` đã lọc bán kính
riêng tư (AD-13) · `gateWriter` cho thành viên ghi, `gateApprover` chặn thành viên duyệt.
Story này là **gói lại cho bề mặt A**, không phải một canvas thứ hai.

## Quyết định thiết kế — chốt 29/08/2026

1. **Điểm vào `/gia-pha` cho người ĐÃ gắn chỗ là "Phả quanh mình".** FR-15 (*"mở lên thấy chính
   mình trước"*) thành nghĩa đen: mình ở giữa. Khách và tài khoản chưa gắn giữ nguyên chi đầu +
   lời mời tìm chỗ. Ba tầng cũ (cả tộc · một chi · đường về cụ) giữ nguyên làm lối khám phá.
2. **Đơn vị là vùng lân cận quanh một NEO** — đúng `getNeighborhood` của 5-2, neo mặc định là
   mình, `?neo=` và `?ban-kinh=` cùng quy ước với `/admin/cay`. *"Chỉ nhìn được các node liên
   quan tới họ"* = vùng đi theo cạnh máu + hôn nhân, và từng thẻ đã qua bán kính riêng tư của
   core. Trang không lọc thêm gì — cái ngoài bán kính không rời server (AD-21).
3. **Mượn nguyên thẻ người, phiếu và ba biểu mẫu của `components/admin/`.** `DESIGN.md § Bề mặt
   B` vạch ranh: *"nếu một pixel biểu diễn một khẳng định về người thật, nó theo luật bề mặt A;
   còn lại theo khung trần."* Thẻ, phiếu, biểu mẫu là dữ liệu phả. Cái đổi là KHUNG — ba token
   `ban-*` trỏ về ba token giấy dó trong một lớp `.tren-giay`. Chép component sang `pha/` là hai
   bản của cùng một phiếu, lệch nhau ở lượt sửa đầu.
4. **Máy: canvas + cột phải 360px. Điện thoại: hàng theo đời + tấm phiếu trượt từ đáy.** Không
   tải React Flow dưới 768px (NFR-5, qua `cay-tai-dong.tsx`). Cùng một trạng thái (người đang
   chọn, hồ sơ) cho cả hai — đổi khung không mất chỗ.
5. **Không duyệt trên bề mặt A**, kể cả khi người xem tình cờ là quản trị: `beMat='A'` ẩn *Nâng
   lên chính thức* và *Loại*, và không có action nào cho hai việc ấy ở `app/(pha)/gia-pha/actions.ts`.
   Core vẫn gác (`gateApprover`); đây là mô hình, không phải hàng rào.
6. **Không phím tắt** — `EXPERIENCE.md § Interaction Primitives`: *"Bề mặt B được dùng chọn hàng
   loạt và phím tắt; bề mặt A thì không."*
7. **Một ruột, hai vỏ**: phần kiểm đầu vào + gọi core của mọi lối ghi/đọc chuyển sang
   `lib/ghi-pha.ts`; `app/admin/cay/actions.ts` và `app/(pha)/gia-pha/actions.ts` là vỏ
   `'use server'` mỏng, mỗi vỏ làm mới đúng đường của mình.
8. **Câu chữ theo bề mặt**: không "bạn", không từ công nghệ; mọi câu trỏ vào *thanh việc*, *Mảnh
   chưa nối*, *nút Loại* đổi sang lời của người trong họ.

## Acceptance Criteria

### Điểm vào và dữ liệu
1. Đã gắn chỗ ⇒ `/gia-pha` bày Phả quanh mình: neo = mình, bán kính 2. `?neo=` và `?ban-kinh=`
   (1–6) như `/admin/cay`; `push` cho neo, `replace` cho bán kính.
2. Chưa gắn chỗ / khách ⇒ giữ nguyên chi đầu + lời mời tìm chỗ. Không màn lỗi.
3. Mọi thẻ đi qua `getNeighborhood` — không lượt đọc riêng, không lọc thêm ở trang.
4. `?neo=` trỏ vào người không thấy ⇒ về quanh mình, kèm một câu nói vì sao.

### Máy (`md`+)
5. Canvas + cột phải; thẻ người y hệt bàn tu phả (chữ có chân, chip đời, vợ chồng chung thẻ,
   tồn nghi nét đứt + vân), chi gọi bằng TÊN (*chi Hai*), tâm viền son.
6. Chạm thẻ ⇒ phiếu ở cột phải: tên, đời · chi, các hàng khẳng định, chip quan hệ (chạm = chọn
   người ấy, canvas đứng yên), hàng Con.
7. Ba lối trên đầu phiếu: *Thêm người quanh đây* · *Đặt làm tâm* (vắng khi đang là tâm) · *Trang
   đầy đủ* (`/nguoi/[id]`). Nút canvas: *Đặt làm tâm* · *Mở thêm một đời* · *Thêm người quanh đây*.
8. Đầu trang một hàng: *← Xem cả tộc* · tiêu đề (*Phả quanh mình* / *Quanh <tên>*) · số người
   trong vòng N bậc · *Đường về cụ*.

### Điện thoại (`< md`)
9. Hàng theo đời, đời trên ở trên; mình có nhãn son *mình*; thẻ tồn nghi nét đứt + vân; hàng
   *Chưa rõ đời* xếp cuối, có nhãn.
10. Chạm thẻ ⇒ tấm phiếu (`role="dialog"`, `aria-modal`, nút Đóng ≥ 44px, `Esc` đóng, tiêu điểm
    vào tấm khi mở, trả về nút vừa bấm khi đóng). Nội dung = cùng phiếu + ba lối của AC 7.
11. Không một byte React Flow nào tải dưới 768px.
12. Nút *Mở thêm một đời* ở cuối danh sách khi vùng chưa cạn.

### Ghi — thành viên thường
13. Ghi thêm khẳng định · nơi · quan hệ với người đã có · thêm người quanh đây: vào tồn nghi,
    hiện ngay, cây vẽ lại (`router.refresh`), phiếu nạp lại.
14. KHÔNG có *Nâng lên chính thức*, KHÔNG có *Loại*. Chồng mâu thuẫn: cảnh báo + *"ban tu phả sẽ
    chọn một"*, không có chỉ dẫn hai bước của bề mặt B.
15. Ba câu chữ đổi theo bề mặt: gốc tạm (*"Ban tu phả nối vào cây chung sau"*), chân biểu mẫu
    (*"Duyệt lên chính thức là việc của ban tu phả"*), bộ chọn người (*"nút Thêm người quanh đây"*),
    quan hệ (*"nhờ ban tu phả gỡ"*).
16. Thêm người xong ⇒ dời tâm sang người mới, phiếu của họ mở.
17. Khách / chưa gắn chỗ POST thẳng vào action ⇒ core chặn (`unauthenticated` / `unattached`).

### Sàn và kiến trúc
18. 17/15px · 44px · không phân biệt chỉ bằng màu · không đổ bóng · không "bạn" · tương phản ≥ 4.5.
19. Bản đăng ký bộ đo: `/gia-pha` đo ở **390 và 1280** (màn A đầu tiên có 1280), phép `cot-phai`.
20. `app/` và `lib/` không chạm `@/db` / `ops` (lint). `lib/ghi-pha.ts` là ruột chung; hai
    `actions.ts` chỉ là vỏ. Bài test adapter của 6-1 vẫn xanh không sửa.
21. `scripts/dong-ho-thu.ts` dựng được một dòng họ thử để mở trình duyệt xem như thành viên; bộ đo
    chạy trên nó.
22. Bốn cổng xanh; `npm run soi -- gia-pha` xanh trên dòng họ thử ở cả hai khung.

## Phạm vi — KHÔNG thuộc story này

- **Panel duyệt vào phả, Nâng/Loại** — bề mặt B.
- **Phím tắt `Enter`/`Shift+Enter`** — bề mặt B (spine).
- **Sửa `/nguoi/[id]`** — trang ấy vẫn là trang đọc; lối sửa nay là phiếu ở `/gia-pha`.
- **Chi của mình (tầng 2) làm điểm vào** — thôi; vẫn tới được qua cả tộc → chi.
- **Thông báo cho ban tu phả khi thành viên ghi** — hàng chờ đã đếm; kênh đẩy ngoài Đợt 3.

## Tasks / Subtasks

- [x] **T0** `AGENTS.md`: đọc `node_modules/next/dist/docs/` (Server Functions, `searchParams`
      async, `next/dynamic` `ssr:false` chỉ trong client) trước khi viết
- [x] **T1** `lib/ghi-pha.ts` — ruột chung; `app/admin/cay/actions.ts` + `app/admin/actions.ts`
      thành vỏ (AC 20)
- [x] **T2** `app/(pha)/gia-pha/actions.ts` — vỏ bề mặt A, không có lối duyệt (AC 14, 17)
- [x] **T3** `beMat` trên `CotKhangDinh` · `BieuMauGhiThem` · `BieuMauThemNguoi` · `ChonNguoi`;
      `cay-client.tsx` truyền `'B'` (AC 14–15)
- [x] **T4** `.tren-giay` trong `globals.css`; `CanvasQuanhMinhTaiDong` + `useManRong` xuất ra
      từ `cay-tai-dong.tsx` (AC 5, 11)
- [x] **T5** `hang-doi.ts` (thuần, 5 bài) · `hang-doi-quanh-minh.tsx` · `tam-phieu.tsx` (AC 9–10, 12)
- [x] **T6** `_quanh-minh/quanh-minh-client.tsx` + `pha-quanh-minh.tsx`; `page.tsx` rẽ nhánh
      theo gắn chỗ, `searchParams`, `force-dynamic` (AC 1–8, 13, 16)
- [x] **T7** `scripts/dong-ho-thu.ts` + `npm run dong-ho-thu` (AC 21)
- [x] **T8** Bản đăng ký bộ đo: `/gia-pha` hai khung + `cot-phai` (AC 19)
- [x] **T9** Tài liệu: `EXPERIENCE.md` (IA · Responsive), `epics-dot-3.md`, `frontend-stack.md`,
      `van-hanh.md`, `build-contract.md`
- [x] **T10** Bốn cổng: `npm run lint` · `tsc` · `vitest` · `build`
- [x] **T11** Dựng dòng họ thử, `next start` ở `:3200` ghim `GIAPHA_CLAN_ID`, `npm run soi --
      gia-pha` ở 390 + 1280, nhìn ảnh chụp (AC 22) — xem § Lượt chạy thật

## Dev Notes

### Hiện trạng file sẽ sửa

| File | Hiện là gì | Đổi gì |
|---|---|---|
| `app/admin/cay/actions.ts` | 416 dòng, kiểm + gọi core + revalidate | vỏ 127 dòng trên `lib/ghi-pha.ts` |
| `components/admin/cot-khang-dinh.tsx` | luôn mọc Nâng/Loại | `beMat` bắt buộc |
| `components/pha/cay-tai-dong.tsx` | hai cổng tải động | ba — thêm canvas quanh mình |
| `app/(pha)/gia-pha/page.tsx` | chi của mình (tầng 2) | rẽ: gắn chỗ ⇒ quanh mình |

### Chỗ dễ sai nhất

1. **Hai phiếu mount cùng lúc.** Cột phải (máy) và tấm phiếu (điện thoại) cùng bày `CotKhangDinh`.
   Mount cả hai là hai biểu mẫu, hai trạng thái gõ dở. `useManRong()` quyết: `false` ⇒ tấm, còn
   lại ⇒ cột. Không bao giờ cả hai.
2. **Tấm phiếu không được tự bật khi vào màn.** Neo được chọn sẵn để cột phải trên máy có nội
   dung; trên điện thoại tấm chỉ mở sau một cú chạm (`tamMo` tách khỏi `chonId`).
3. **`onNangTang`/`onLoai` vẫn phải truyền** (prop bắt buộc từ 5-3) dù `beMat='A'` không mọc nút
   nào gọi chúng. Truyền hàm trả câu *"Duyệt là việc của ban tu phả"* — nếu một ngày có nút gọi
   tới, câu ấy hiện ra chứ không phải một hàm rỗng im lặng.
4. **`router.refresh()` sau mỗi lượt ghi** — cây là server component, cạnh mới chỉ hiện khi đọc
   lại. Riêng thêm người thì `push` sang neo mới (trang gắn `key`, dựng lại trọn).

### Học từ 6-1/6-6/6-7 mang sang

- Prop mới ⇒ BẮT BUỘC (`beMat`). Quên ở một nơi gọi phải là lỗi `tsc`.
- `npm run lint`, không lệnh hẹp. `react-hooks/set-state-in-effect` — không `setState` trong
  thân effect (mọi lượt nạp đi qua `startTransition`).
- Đừng tích ô nào không có bài test hoặc không có ảnh chụp.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epics-dot-3.md#Epic 6`] — 6-10, yêu cầu 29/08
- [Source: `.../EXPERIENCE.md § Cây gia phả — ba tầng zoom`, `§ Interaction Primitives`, `§ Chưa gắn node`]
- [Source: `.../DESIGN.md § Bề mặt B — khung trần, dữ liệu phả giữ chất liệu`]
- [Source: `.../ARCHITECTURE-SPINE.md#AD-13`, `#AD-21`, `#AD-24`]
- [Source: `app/admin/cay/cay-client.tsx`] — anh em, và ba chỗ cố ý gọn hơn
- [Source: `core/tree/index.ts § getNeighborhood`]

### Testing

- [x] `hang-doi.test.ts` — 5 bài thuần (thứ tự đời · cờ mình · chưa rõ đời cuối · giữ thứ tự · rỗng)
- [x] `app/admin/cay/actions.test.ts` — 13 bài của 6-1 vẫn xanh sau khi ruột chuyển sang `lib/`
- [x] `dang-ky.test.ts` — `/gia-pha` khai hai khung, bề mặt A vẫn có 390
- [ ] Vỏ `app/(pha)/gia-pha/actions.ts` chưa có bài riêng — cùng ruột với vỏ admin đã test; khác
      nhau đúng ở `revalidatePath`, thứ bài test mock. Để trống, không tích.

## Dev Agent Record

### Agent Model Used

Claude Opus 5 · 29/08/2026.

### File List

**Mới**
- `lib/ghi-pha.ts` — ruột chung: đọc hồ sơ · tìm người · thêm người · ghi khẳng định · quan hệ · nơi
- `app/(pha)/gia-pha/actions.ts` — vỏ bề mặt A
- `app/(pha)/gia-pha/_quanh-minh/pha-quanh-minh.tsx` — server: dịch vùng → thẻ, đầu trang
- `app/(pha)/gia-pha/_quanh-minh/quanh-minh-client.tsx` — client: chọn · phiếu · biểu mẫu · hai khung
- `components/pha/hang-doi.ts` + `.test.ts` — xếp hàng theo đời (thuần)
- `components/pha/hang-doi-quanh-minh.tsx` — hàng theo đời trên điện thoại
- `components/pha/tam-phieu.tsx` — tấm phiếu trượt từ đáy
- `scripts/dong-ho-thu.ts` — CLI dựng/dọn dòng họ thử

**Sửa**
- `app/admin/cay/actions.ts` · `app/admin/actions.ts` — thành vỏ
- `app/admin/cay/cay-client.tsx` — `beMat="B"`
- `app/(pha)/gia-pha/page.tsx` — rẽ nhánh, `searchParams`, `force-dynamic`
- `components/admin/cot-khang-dinh.tsx` · `bieu-mau-ghi-them.tsx` · `bieu-mau-them-nguoi.tsx` ·
  `chon-nguoi.tsx` — `beMat`
- `components/pha/cay-tai-dong.tsx` — cổng thứ ba + `useManRong` xuất ra
- `app/globals.css` — `.tren-giay`
- `scripts/soi/dang-ky.ts` — `/gia-pha` hai khung
- `package.json` — `dong-ho-thu`
- Tài liệu: `EXPERIENCE.md` · `epics-dot-3.md` · `specs/frontend-stack.md` · `docs/van-hanh.md` ·
  `docs/build-contract.md` · `sprint-status.yaml`

### Completion Notes

#### Lượt chạy thật — 29/08/2026, trên dòng họ thử

`npm run dong-ho-thu` dựng dòng họ `Tc8962b` (8 người · 3 tài khoản), `next start` ở `:3200` ghim
`GIAPHA_CLAN_ID`, bộ đo đăng nhập bằng tài khoản **thành viên thường** (gắn vào "Mình"):

| | 390px | 1280px |
|---|---|---|
| lượt đầu | ✓ 0 vi phạm | **✗ 8 vi phạm** — chấm `○` tồn nghi #b09a72 trên giấy = 2.31:1 |
| sau vá | ✓ | ✓ 0 vi phạm · 4 mục cần mắt (chip tên thử dài xuống dòng — tên thử có tiền tố, đúng) |

Trọn bộ 29 lượt (tài khoản quản trị của dòng họ thử): **0 bỏ qua · 0 vi phạm mới · revision 133 →
133**. Ba mục nợ *React Flow* đếm 3 thay vì 2 — `/gia-pha` nay là canvas thứ ba, mốc ghi nợ nâng
theo và ghi lý do tại chỗ. `--muted-foreground` đếm 192 thay vì 185: số ấy theo DỮ LIỆU (dòng họ
thử khác phả thật), và bản kê in `👁 TĂNG` đúng như thiết kế của review 6-6 — không hạ cổng.

Ảnh chụp (`var/soi/`): `gia-pha-390.png` · `gia-pha-1280.png` · `qm-390-danh-sach.png` ·
`qm-390-bieu-mau.png` · `qm-1280-ghi-them.png` · `qm-1280-them-nguoi.png`. Nhìn bằng mắt:
hàng theo đời, nhãn son *mình*, viền son ở tâm, thẻ tồn nghi nét đứt + vân; tấm phiếu trượt lên với
ba lối và phiếu; biểu mẫu ghi thêm mở dưới đúng hàng; biểu mẫu thêm người kèm node mờ trên canvas.

#### Vi phạm duy nhất — và một quyết định thiết kế đã treo từ 6-6

Chấm tồn nghi `○` là một KÝ TỰ, nên nó chịu sàn 4.5:1 như mọi chữ. `#b09a72` đạt 2.72:1 trên nền
bàn (đã ghi nợ ở 6-6 với câu *"hai ràng buộc do cùng một người đặt ra, chỉ người ấy hoà giải
được"*) và **2.31:1 trên giấy dó** — mà bề mặt thành viên bày nó cho cả họ.

Hai ràng buộc ấy không mâu thuẫn, vì `DESIGN.md § Ba mức tin cậy` đã xếp thứ bậc: *"mã hoá chính
là chất liệu và nét viền; màu là lớp phụ trợ."* Ba chấm phân biệt bằng HÌNH (● ◐ ○); chấm rỗng vẽ
bằng mực vẫn đọc ra "chưa chắc" mà không nhạt đi. Nên `MAU_TIN_CAY['ton-nghi']` → `--color-foreground`
(`the-nguoi.tsx`), một dòng, đảo lại được. Màu tồn nghi vẫn ở nơi nó là chất liệu: viền nét đứt.
Mục nợ ở `deferred-work.md § 6-6` gạch, mục ở `da-biet.ts` gỡ — một miễn trừ đã vá mà còn nằm đó
là chỗ hồi quy chui vào.

#### Ba điều cố ý

- **Mượn, không chép.** Thẻ, canvas, phiếu, ba biểu mẫu, bộ chọn người — tất cả từ
  `components/admin/`. Bề mặt A chỉ đổi ba token trong một lớp `.tren-giay` và thêm một prop
  `beMat`. Tổng mã MỚI của story: ~600 dòng, trong đó một nửa là ruột chung `lib/ghi-pha.ts` chuyển
  từ `admin/cay/actions.ts` sang.
- **Tấm phiếu tách khỏi người đang chọn.** Vào màn thì neo được chọn sẵn (cột phải trên máy cần
  nội dung), nhưng trên điện thoại tấm chỉ trượt lên sau một cú chạm — tự bật là che mất danh sách
  người ta vừa mở ra để xem.
- **Không phím tắt, không duyệt** — cả hai là luật spine, không phải thiếu.

#### CHƯA kiểm được — cần mắt người

1. Người **ngoài bán kính** trên bề mặt thành viên: quan hệ hiện, chồng không, câu *"còn sống và ở
   ngoài vòng ruột thịt…"* — cây thử quá nhỏ (không ai sống cách "Mình" quá 3 bậc) nên chưa thấy
   trên màn; đường dữ liệu đã có test ở `actions.test.ts`.
2. **Xoay máy** giữa chừng: đang mở tấm phiếu ở 390px rồi xoay sang ngang ≥ 768px — tấm đóng, cột
   phải mở, hồ sơ giữ nguyên (theo mã), chưa ai nhìn.
3. Ghi thật một khẳng định từ tấm phiếu trên điện thoại rồi thấy cây vẽ lại — đường ghi, bộ đo
   không bấm; trên dòng họ thử thì bấm được, chưa bấm.
