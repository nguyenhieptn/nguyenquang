---
baseline_commit: b3c242d
# Ghim lại 28/08 sau khi 6-8 được commit. Mốc cũ (93257e0) là commit TRƯỚC 6-8, mà changeset 6-8
# vẫn nằm trong cây khi 6-6 bắt đầu — để nguyên thì lượt review 6-6 diff nhầm cả 12 tệp của 6-8
# thành công của 6-6.
---

# Story 6.6: Đo thật trên trình duyệt

Status: review

<!-- Tài liệu dự án viết bằng tiếng Việt (mọi story 5-x, 6-x đều vậy). `document_output_language:
English` trong _bmad/bmm/config.yaml là giá trị cài đặt mặc định chưa ai sửa — mã và bình luận
theo quy ước tiếng Anh cho định danh (build-contract § Consistency Conventions), văn xuôi tiếng Việt. -->

## Story

Là **Ban tu phả**,
tôi muốn **một bộ kịch bản mở trình duyệt thật, đi hết mọi màn của sản phẩm và ĐO các sàn đã cam kết**,
để **lớp lỗi mà bốn cổng `tsc` · `eslint` · `vitest` · `build` không bao giờ thấy bị chặn trước khi dòng họ nhìn thấy nó**.

---

## Bối cảnh — vì sao story này tồn tại

Ba sự kiện, không phải giả định:

1. **Lượt review Epic 5 thứ hai bắt được hai lỗi nặng nhất của cả đợt CHỈ VÌ nó dựng trình duyệt
   lên và đo** — nhãn sơn đè lên họ tên trên thẻ người, và mọi màn dài mất trắng 34px đệm đáy.
   Lượt một đã "vá xong" và bốn cổng xanh với cả hai.
   [Source: `_bmad-output/implementation-artifacts/review-epic-5-2026-08-25.md:256-260`]

2. **Bốn story gần nhất mỗi story đẻ ra một script `soi-*.mjs` riêng.** Chúng làm cùng bốn việc
   (mở trình duyệt · đăng nhập · bắt lỗi console · chụp ảnh) bằng bốn đoạn mã chép tay, và cùng
   một phép đo cho ra bốn kết quả khác nhau vì bốn cài đặt khác nhau. Story này gom lại.

3. **Sàn được viết cho ĐIỆN THOẠI, và điện thoại chưa từng được đo.** `NFR-5` đặt người dùng đích
   trên "điện thoại tầm trung, 4G ở quê"; `Accessibility Floor` sinh ra từ đó. Cả bốn script hiện
   có chỉ đo bề mặt B ở 1280px. Mười sáu màn của bề mặt A — trang chủ, tự khai bốn bước, cây ba
   tầng, trang một người, thu lời kể — **chưa có một phép đo nào**.
   [Source: `prd.md:215-216`, `EXPERIENCE.md:387-397`, `EXPERIENCE.md:45-55`]

Và một cái giá đã trả rồi: **một lượt bấm thử của agent đã vô tình nâng tầng 40 khẳng định trên
phả thật**, trên một kho không có phép xoá (AD-4). Bộ đo này chạy trên phả thật. Bất biến "không
bấm nút ghi" vì thế là hàng rào có răng, không phải lời dặn.
[Source: `6-9-nhap-nhanh-tren-canvas.md:467-470`]

---

## Phạm vi

### Trong phạm vi

- Hạ tầng đo dùng chung + gom bốn script hiện có vào đó.
- Sáu phép đo, mỗi phép **một** cài đặt: sàn chữ · sàn chạm · tràn ngang · nhãn đè tên · đệm đáy · tương phản.
- Bản đăng ký màn phủ **mọi route sản phẩm**, cộng một bài test đọc mã nguồn bắt màn thiếu đăng ký.
- Đo bề mặt A ở **390px** (lần đầu) và bề mặt B ở **1280px** + **768px**.
- Trả nợ 14 mục "CHƯA kiểm được" đã tích từ 6-1 · 6-2 · 6-7 · 6-8 · 6-9.
- Hai phép đo hồi quy dựng lại đúng hai lỗi Epic 5.
- Tài liệu vận hành.

### NGOÀI phạm vi — và ai gánh

| Không làm | Vì sao | Ai gánh |
|---|---|---|
| **Đường GHI qua trình duyệt** (bấm nút ghi, duyệt, gỡ) | Cần một dòng họ THỬ dùng một lần rồi bỏ. Dựng nó là hạ tầng dữ liệu riêng, không phải phép đo. Ghi vào phả thật thì vi phạm AD-4 và lặp lại đúng sự cố 40 khẳng định. | Story mới — xem § Câu hỏi cuối story |
| **Năm ô test còn trống của 6-1** đòi ca `invalid` / `forbidden` / *"loại một khẳng định ⇒ cạnh biến khỏi cây"* | Cả năm đều là đường ghi. | như trên |
| Trình đọc màn hình (NVDA/JAWS/VoiceOver) | Playwright không thay được trình đọc thật. Đo được `role`/`aria-*` có mặt, không đo được nó **nghe ra sao**. | vẫn cần mắt (và tai) người |
| `/uiworkshop/*` | `notFound()` khi `NODE_ENV === 'production'` — không phải bề mặt sản phẩm. 51 chỗ chữ nhỏ trong đó là **cố ý** và nằm ngoài sàn. | không ai |
| Sửa các vi phạm sàn mà bộ đo tìm ra | Story này dựng CÁI CÂN. Cân xong mới biết phải sửa gì. | vá trong story này nếu rẻ, còn lại vào `deferred-work.md` |

---

## Acceptance Criteria

### A · Hạ tầng đo dùng chung

1. Có `scripts/soi/` giữ phần dùng chung: mở trình duyệt · đăng nhập · bắt lỗi console + `pageerror` ·
   tạo `var/soi/` · chụp ảnh. **Không script nào còn tự dựng lại bốn việc ấy.**
2. Không script nào còn **mặc định** trỏ vào một địa chỉ máy hay một tên đăng nhập cụ thể. Thiếu
   `SOI_GOC` / `SOI_TEN` / `SOI_MK` ⇒ dừng, và thông báo nói rõ **thiếu biến nào**.
   *(Hôm nay `soi-man.mjs` và `soi-nap-khung.mjs` nhúng sẵn `http://100.94.148.68:3000` và `nguyen.quang.hiep`.)*
3. Mọi script có hàng rào chặn chạy vào máy xa, mở bằng `SOI_CHO_PHEP_XA=1`.
   *(Hôm nay chỉ `soi-tai-khoan` và `soi-hang-cho` có.)*
4. **Mọi** script thoát khác 0 khi bất kỳ sàn nào bị hạ. *(Hôm nay `soi-man.mjs` luôn thoát 0 — nó
   in số đo rồi báo thành công dù đo ra gì. Nó không phải cổng, chỉ trông giống cổng.)*
5. `npm run soi` chạy trọn bộ; mỗi màn vẫn chạy riêng được. **Mọi** script khai trong
   `package.json`. *(Hôm nay `soi-man.mjs` không có mục nào — chạy được chỉ khi ai đó nhớ đường dẫn.)*
6. Lượt chạy trọn bộ kết thúc bằng một **bản kê**: từng màn, từng phép đo, XANH/ĐỎ, và tổng số ĐỎ.

### B · Sáu phép đo — mỗi phép một cài đặt

7. **Sàn chữ.** Đo mọi phần tử có chữ **trực tiếp** (không bỏ qua phần tử có con — bản của
   `soi-hang-cho.mjs:85-94` là bản đúng, ba bản kia bỏ sót). ĐỎ khi `< 15px`. Báo kèm chọn tử,
   cỡ đo được, và chữ đang hiện.
8. **Sàn chạm.** Tính cả `::after` nới vùng chạm và nhãn đi kèm; đo **cả chiều cao lẫn bề ngang**;
   ngưỡng `44×44px`. *(Ba trong bốn script hiện chỉ đo chiều cao.)*
9. **Tràn ngang.** Kiểm `documentElement` **và** mọi bộ cuộn con (`overflow-x` khác `visible`).
   *(Bốn script đang làm bốn kiểu; hai kiểu bỏ sót bộ cuộn con — đúng chỗ lỗi 1239/972 của 6-8 nấp.)*
10. **Nhãn đè tên.** Hai hình chữ nhật giao nhau trên thẻ người ⇒ ĐỎ. Dựng lại được lỗi Epic 5.
11. **Đệm đáy.** Trên màn dài hơn khung nhìn, khoảng cách từ đáy nội dung tới đáy khối cuộn
    `≥` đệm khai báo. **0px là ĐỎ** — đó chính là con số đo được hôm lỗi bật.
12. **Tương phản** `≥ 4.5:1`, **kể cả node tồn nghi** (chỗ này dễ sai nhất: tầng tồn nghi khác
    CHẤT LIỆU chứ không được nhạt đi — `app/globals.css:191-195`).
13. Luật của cả sáu phép nằm trong **một module THUẦN có test**, không nằm trong `page.evaluate`.
    Trình duyệt chỉ **thu số**; quyết XANH/ĐỎ là hàm thuần.

### C · Phủ hết màn

14. Có **bản đăng ký màn**: mỗi route sản phẩm một dòng — đường · khung nhìn phải đo · quyền cần ·
    cách đưa màn về trạng thái CÓ DỮ LIỆU · phép đo nào áp · trạng thái RỖNG có phải đo riêng không.
15. Một bài test **đọc mã nguồn**: mọi `page.tsx` dưới `app/` (trừ `uiworkshop/`) đều có một dòng
    trong bản đăng ký; thiếu ⇒ ĐỎ. Theo đúng lối `app/admin/chrome.test.ts` — *"test đọc mã nguồn
    thì bắt được cả những màn chưa ai viết"*.
16. **Bề mặt A đo ở 390px.** Mười bảy màn: `/` · `/tim` · `/dang-nhap` · `/gan-node` · `/gia-pha` ·
    `/gia-pha/ca-toc` · `/gia-pha/chi/[id]` · `/gia-pha/duong-cua-toi` · `/loi-ke` · `/loi-ke/thu` ·
    `/nguoi/[id]` · `/them` · `/them/noi` · `/them/ten` · `/them/xac-nhan` · `/them/xong` · `/toi`.
    ⚠ `/them` là **trang chỉ mục** của luồng bốn bước và dễ bị bỏ sót khi liệt kê bằng mắt — đúng
    lý do AC 15 phải là test đọc mã nguồn chứ không phải một danh sách chép tay.
17. **Bề mặt B đo ở 1280px**, và ở **768px** cho màn nào tài liệu khai là chạy được trên `md`.
    Chín màn + đường 404 `/admin/<gõ-nhầm>`.
18. Màn có hai bộ mặt (RỖNG vs CÓ DỮ LIỆU) đo **cả hai**, hoặc bản đăng ký ghi rõ vì sao chỉ đo một.

### D · Bất biến an toàn — bộ đo không được đổi phả

19. **Không lượt đo nào bấm một điều khiển GHI.** Có danh sách chọn tử cấm bấm, và một bài test
    khẳng định không script nào gọi `.click()` lên chúng.
20. Lượt chạy trọn bộ in số hàng `revision` **trước và sau**; hai số phải bằng nhau, khác nhau ⇒ ĐỎ.
21. Bộ đo không bao giờ ghi mật khẩu ra stdout, ra ảnh chụp, hay vào `var/soi/`.

### E · Trả nợ đã tích

22. Mười bốn mục "CHƯA kiểm được" của 6-1 · 6-2 · 6-7 · 6-8 · 6-9 vào bản đăng ký; mỗi mục **hoặc**
    có phép đo, **hoặc** ghi rõ vì sao vẫn cần mắt người. Không mục nào biến mất không dấu vết.
23. **Câu xem trước** của bộ chọn quan hệ (6-1) được đo: mỗi hướng (*"là con của"* / *"là cha của"*)
    và mỗi `relation` (`blood` / `adopted` / `heir`) cho ra **đúng câu**, **không bấm ghi**. Story
    ghi rõ việc này đóng ô nào trong bảy ô còn trống của 6-1, và ô nào **không** đóng.
24. Hai phép đo hồi quy Epic 5 (nhãn đè tên · đệm đáy) chạy và **ĐANG XANH**.

### F · Tài liệu

25. `docs/van-hanh.md` có mục: cách chạy · biến môi trường · cách đọc bản kê · phải làm gì khi ĐỎ.
    *(Hôm nay file này không nhắc một chữ nào về bốn script soi đã tồn tại.)*
26. `docs/build-contract.md` ghi bộ đo là **cổng thứ năm**, kèm câu nói rõ nó **không** chạy trong
    `npm run build` vì cần một server sống + database + mật khẩu.

### G · Nghiệm thu

27. Chạy trọn bộ trên phả thật, in bản kê đầy đủ. Mọi ĐỎ **hoặc** đã vá trong story này, **hoặc**
    vào `deferred-work.md` kèm lý do. Không ĐỎ nào bị bỏ im.
28. Bốn cổng cũ vẫn xanh: `npm run lint` · `tsc` · `npm test` · `npm run build`.

---

## Tasks / Subtasks

- [x] **T1** Dựng `scripts/soi/` — phần dùng chung (AC 1, 2, 3, 21)
  - [x] `trinh-duyet.ts`: mở · đăng nhập · bắt lỗi console + `pageerror` · chụp
  - [x] `moi-truong.ts`: đọc biến một chỗ, thiếu biến nói rõ thiếu cái gì, KHÔNG mặc định nào
  - [x] Hàng rào máy xa neo vào `hostname` (không phải `startsWith`), mở bằng `SOI_CHO_PHEP_XA=1`
- [x] **T2** Module THUẦN cho luật + test (AC 7–13)
  - [x] `luat.ts` — bảy luật, mọi ngưỡng khai đúng một lần
  - [x] 43 bài test, gồm ca biên: đúng 15px · đúng 44px · chạm mép không phải giao · đệm đúng bằng khai báo · soi 0 phần tử
  - [x] `vitest.config.ts` mở `include` cho `scripts/**/*.test.ts`
- [x] **T3** Bản đăng ký màn + test đọc mã nguồn (AC 14, 15, 18)
  - [x] `dang-ky.ts` — 27 màn, khớp đúng 27 `page.tsx` trong `app/`
  - [x] `dang-ky.test.ts` — hai chiều: màn thiếu khai ⇒ ĐỎ, dòng khai thừa ⇒ ĐỎ
  - [x] Thử phá cổng cả hai chiều, cả hai đều bắt (xem § Nghiệm thu cổng)
- [x] **T4** Gom bốn script cũ vào runner (AC 1, 4, 5)
  - [x] Bốn `.mjs` gỡ bỏ; phần biết-đường-vào từng màn chuyển vào bản đăng ký + `xem-truoc.ts`
  - [x] `package.json`: `soi` · `soi:cay` · `soi:tai-khoan` · `soi:nap-khung` · `soi:hang-cho`
- [x] **T5** Runner + bản kê + đếm `revision` trước/sau (AC 5, 6, 20)
- [x] **T6** Đo bề mặt A ở 390px — mười bảy màn (AC 16)
  - [x] Runner tách đăng nhập khỏi mở trình duyệt; màn công khai đo trước, khi chưa có phiên nào
  - [x] Cả 17 màn đo thật, 0 màn bỏ qua
- [x] **T7** Đo bề mặt B ở 1280px (AC 17)
  - [x] Mười màn kể cả 404, đo thật
  - [x] **Bỏ 768px khỏi bề mặt B** — `EXPERIENCE.md:498` nói nó desktop-only; xem § Lượt chạy trọn bộ
- [x] **T8** Hai phép đo hồi quy Epic 5 (AC 10, 11, 24) — chạy thật, cả hai XANH
- [x] **T9** Danh sách cấm bấm + test khẳng định (AC 19)
- [x] **T10** Đưa các mục "CHƯA kiểm được" vào bản đăng ký (AC 22)
- [x] **T11** ~~Phép đo câu xem trước của bộ chọn quan hệ~~ — **CHỦ DỰ ÁN CHỐT BỎ 28/08.**
      Mốc bám `data-cau-se-ghi` đã đặt cho story sau; bước lái biểu mẫu không viết. Cái giá ghi ở
      § AC 23 — kết toán trung thực.
- [x] **T12** `docs/van-hanh.md` + `docs/build-contract.md` (AC 25, 26)
- [x] **T13** Nghiệm thu trên phả thật (AC 27, 28)
  - [x] 27 màn, 0 bỏ qua, `npm run soi` exit 0, `revision 77 → 77`
  - [x] Bốn cổng cũ xanh: lint · tsc · 488/488 test · build
  - [x] Bảy khiếm khuyết vào `deferred-work.md § 6-6`, khai trong `da-biet.ts`, đếm riêng từng mục

---

## Dev Notes

### Sàn — con số và nguồn

| Sàn | Con số | Nguồn |
|---|---|---|
| Cỡ chữ thân | **17px** | `DESIGN.md:40`, `EXPERIENCE.md:391` |
| Cỡ chữ **tối thiểu tuyệt đối** | **15px** — mọi chữ, không ngoại lệ | `DESIGN.md:43`, `EXPERIENCE.md:392` |
| Vùng chạm | **44×44px** | `DESIGN.md:224`, `EXPERIENCE.md:393` |
| Tương phản chữ | **≥ 4.5:1**, kể cả node tồn nghi | `EXPERIENCE.md:394` |
| Mã hoá trạng thái | **không bao giờ chỉ bằng màu** | `EXPERIENCE.md:395` |
| Chiều cao dòng | 1.6 (thân) · 1.5 (chú) | `DESIGN.md:41,44` |
| Khung nhìn | 390 (điện thoại) · 768 (`md`) · 1024 (`lg`) · 1280 (máy) | `EXPERIENCE.md:75,430-438,445` |

> **17px và 15px KHÔNG mâu thuẫn nhau.** Lượt code review 6-1 từng ghi đây là một chỗ lệch
> (`6-1-noi-nguoi-da-co.md:215`, mục 6). Đọc lại nguồn thì là **hai tầng của cùng một thang**:
> 17px là sàn của **chữ thân**, 15px là **tối thiểu tuyệt đối** cho mọi chữ kể cả chú thích. Bộ đo
> vì thế cài **hai ngưỡng**, không phải một: `< 15px` ⇒ ĐỎ luôn; `< 17px` trên chữ thân ⇒ ĐỎ.

**Hai sàn KHÔNG có trong bất kỳ tài liệu nào: `nhãn đè tên` và `đệm đáy`.** Cả hai sinh ra từ phép
đo Epic 5, không từ một dòng spec. Đừng đi tìm con số trong `EXPERIENCE.md` — không có. Nguồn duy
nhất là `review-epic-5-2026-08-25.md:256-260`, và story này là chỗ chúng thành luật.

### ☠ Cái bẫy: gốc `rem` là 17px, không phải 16px

`app/globals.css:183-187` đặt `html { font-size: 17px }`. **Mọi lớp Tailwind tính bằng `rem` vì
thế lệch khỏi bảng mặc định:**

| Lớp | `rem` | Ra px thật | Với sàn 15px |
|---|---|---|---|
| `text-xs` | 0.75 | **12.75px** | ĐỎ |
| `text-sm` | 0.875 | **14.875px** | **ĐỎ — hụt đúng 0.125px** |
| `text-base` | 1 | 17px | đạt |
| `h-11` | 2.75 | **46.75px** | đạt 44px |

Đây là lý do mã dùng `text-[17px]` / `text-[15px]` viết thẳng chứ không dùng `text-base` /
`text-sm`, và là lý do `soi-man.mjs:151` có ngưỡng "46.75px" trông như số lẻ vô cớ — nó là `h-11`.

**Mã sản phẩm hôm nay đã sạch**: `text-sm` và `text-xs` đã bị loại khỏi `app/` và `components/` từ
23/08 — hai chỗ còn lại là **bình luận** ghi lý do loại (`components/ui/badge.tsx:2`,
`components/ui/button.tsx:2`); năm chỗ còn dùng đều nằm trong `uiworkshop/`, ngoài phạm vi. Nên
siết nghiêm `< 15px` ⇒ ĐỎ **không nhuộm đỏ dòng nào hôm nay** — nó chặn việc tái phát.

Và phép đo phải so **số đo thật từ `getComputedStyle`**, không so tên lớp: `text-sm` trông đúng
chuẩn mà ra 14.875px, còn một lớp tuỳ biến hụt sàn thì không tên nào nhận ra được.

### Bốn script đang có — trùng gì, lệch gì

Trùng (chép tay bốn lần): khởi tạo Playwright · `p.on('console')` + `p.on('pageerror')` ·
đăng nhập (`goto` → `fill` → bấm **"Vào phả"** → `waitForURL`) · `mkdirSync('var/soi')` · đóng trình duyệt.

Lệch — **mỗi dòng dưới đây là một con bug đang ngủ**:

| Việc | Chỗ lệch |
|---|---|
| Thoát khi ĐỎ | `soi-man` **luôn thoát 0**; ba script kia thoát 1 |
| Sàn chữ | ba script bỏ qua phần tử **có con**; `soi-hang-cho` kiểm "có chữ trực tiếp" — bản đúng |
| Sàn chạm | chỉ `soi-hang-cho` đo **bề ngang**; ba script kia chỉ đo chiều cao |
| Tràn ngang | `soi-man` **không đo**; `soi-tai-khoan` chỉ đo `documentElement`; hai script kia đo cả bộ cuộn con |
| Mặc định môi trường | `soi-man` + `soi-nap-khung` nhúng sẵn IP và tên đăng nhập |
| Hàng rào máy xa | chỉ `soi-tai-khoan` + `soi-hang-cho` có |
| Khung nhìn | chỉ `soi-man` nhận `--rong`; ba script kia cứng 1280 |
| `fullPage` khi chụp | `soi-man` không; hai chỗ trong `soi-nap-khung` cũng không |

Bốn script hôm nay đo **bốn** trong **hai mươi bảy** `page.tsx` (17 bề mặt A · 9 bề mặt B · 1
catch-all 404): `/admin/cay` · `/admin/tai-khoan` · `/admin/nap-khung` · `/admin/hang-cho`.

### Bất biến an toàn — bộ đo chạy trên phả THẬT

Kho không có phép xoá (AD-4); nâng tầng là **vĩnh viễn**. Một agent đã nâng nhầm 40 khẳng định.
Vì thế:

- **Không bấm bất kỳ điều khiển nào ghi vào phả**: Duyệt · Duyệt cả nhóm · Ghi vào phả · Trả lại ·
  Loại quan hệ này · Gộp · Tách · Trao vai · Gỡ gắn kết · Ghi (bộ nạp khung).
- Điền biểu mẫu và **đọc câu xem trước** thì được — đó chính là cách 6-1 nghiệm thu AC 28
  (`6-1-noi-nguoi-da-co.md:501-533`): lọc theo **đúng tên**, rồi dừng lại kiểm câu xem trước khớp
  nguyên văn **trước** khi cho phép bấm ghi.
- AC 20 (đếm `revision` trước/sau) là hàng rào cuối, bắt được cả cú bấm không ai lường.

### Lối vào từng màn

- Đăng nhập: `/dang-nhap`, điền `#ten-dang-nhap` + `#mat-khau`, bấm nút **"Vào phả"**.
  ⚠ *"Đăng nhập"* và *"Tạo tài khoản"* là hai **TAB đổi chế độ**, không phải nút gửi
  (`app/dang-nhap/form-dang-nhap.tsx:180-191,286`). Bấm nhầm thì màn đứng yên, không lỗi, không
  lượt gọi `/api/auth` nào — đúng thứ chỉ mở trình duyệt mới thấy.
- `/admin/*` đòi `role` là `admin` hoặc `branch-head`; không đủ quyền thì ra màn "Khu vực Ban tu
  phả" **đứng ngoài khung** (`app/admin/layout.tsx:44-60`) — bộ đo phải phân biệt màn ấy với màn
  thật, nếu không nó sẽ báo XANH cho một màn chưa bao giờ mở được.
- `/admin/cay` nhận `?neo=<id>` để mở thẳng một người — dùng cái này thay cho bấm mò trên canvas.
- Không có `middleware.ts`. Quyền gác ở `layout.tsx`.
- Theo hồ sơ 6-8 (27/08), phả thật có **34 khẳng định chờ** ở `/admin/hang-cho` — đủ để thấy nhóm
  thật. Con số này đổi theo mỗi lượt duyệt: **đọc lại lúc chạy**, đừng ghim vào mã. Nhưng
  `/admin/tai-khoan` có **đúng một gắn kết**, nên đường trao vai **không mở ra được** — đó là lý do
  ba mục của 6-2 vẫn cần mắt người, không phải vì bộ đo yếu.

### Mười bốn mục nợ, gom theo màn

| # | Màn | Mục | Đo được? |
|---|---|---|---|
| 1 | thẻ người (canvas) | nhãn đè họ tên — hồi quy Epic 5 | ✅ AC 10 |
| 2 | mọi màn dài | đệm đáy 34px → 0px — hồi quy Epic 5 | ✅ AC 11 |
| 3 | `/admin/cay` cột phải | AC 18 của 6-7: khối tóm tắt + ba hàng chip đẩy chồng khẳng định khỏi tầm nhìn | ✅ đo chiều cao khối + phần còn nhìn thấy |
| 4 | `/admin/cay` cột phải | dòng tóm tắt xuống dòng xấu khi tên chi dài | ✅ đo `flex-wrap` bằng số hàng thật |
| 5 | `/admin/cay` cột phải | người ngoài bán kính riêng tư: `quanHe` hiện mà `chong` không | ⚠ đo được **có/không**, không đo được *"có đọc ra nghĩa không"* |
| 6 | `/admin/cay` canvas | chip quan hệ bấm vào dời tâm mượt hay chớp | ⚠ cần mắt |
| 7 | `/admin/cay` canvas | câu *"Chưa biết cha…"* không tự biến mất — có che thứ đáng nhìn không | ✅ đo giao nhau với vùng nội dung |
| 8 | `/admin/cay` biểu mẫu | 6-9: `Enter` / `Shift+Enter` — mở được, điền được, **dừng trước nút ghi** | ✅ tới trước nút ghi |
| 9 | `/admin/cay` biểu mẫu | 6-9 AC 9/10 đã chốt BỎ dòng chỉ dẫn `<kbd>` ⇒ phím tắt không nơi nào nói ra | ⚠ cần mắt |
| 10 | `/admin/hang-cho` | chạy lại `soi-hang-cho` phải XANH (lượt đầu 27/08 ĐỎ: 10 đích chạm < 44px, tràn 1239/972) | ✅ |
| 11 | `/admin/hang-cho` | chưa ai bấm **Duyệt cả nhóm** | ❌ đường ghi — ngoài phạm vi |
| 12 | `/admin/tai-khoan` | đường trao vai chưa ai đi (chỉ một gắn kết) | ❌ cần tài khoản thứ hai |
| 13 | `/admin/tai-khoan` | bước **xác nhận** khi đổi vai chưa ai bấm | ❌ đường ghi |
| 14 | `/admin/hang-cho` | `role="status"` của câu cảnh báo đụng độ — trình đọc nghe được không | ⚠ đo được thuộc tính, không đo được tiếng |

Bốn nhóm vá hình ảnh của retro Epic 5 (hàng nhãn trên thẻ · chiều cao thẻ theo số bạn đời · cột co
giãn của `<main>` · CSS nút phóng/thu) đã vá 25/08 nhưng **chưa ai nhìn bằng mắt** — chúng rơi vào
AC 10, 11 và ảnh chụp của T7.

### Precedent trong repo — dùng lại, đừng dựng lại

- **`core/gates/rls.gate.test.ts`** — lối đặt tên `*.gate.test.ts` cho cổng phát hành, và một bài
  học đắt ghi ngay trong file: chú thích cũ khẳng định gate bắt được một chuyện mà **nó không bắt
  được** (đếm `policies >= 1` trong khi `USING (true)` cũng thoả). Bộ đo này dễ mắc đúng lỗi ấy:
  một phép đo chạy XANH vì nó **không tìm đúng phần tử**, chứ không vì màn đúng. Mỗi phép đo phải
  in **số phần tử đã soi**; soi 0 phần tử là ĐỎ, không phải XANH.
- **`app/admin/chrome.test.ts`** — test đọc mã nguồn, không render. Ghi thẳng lý do: *"test render
  một màn thì bắt đúng cái màn nó render, không bắt được cái màn người sau quên"*. AC 15 là đúng
  hình ấy, và cả lối **hai gốc quét** của nó (bản đầu chỉ quét `app/admin/` và bỏ sót đúng file
  quan trọng nhất).
- **`components/admin/<ten>.ts` + `<ten>.test.ts`** — bốn story gần nhất đều tách phần THUẦN ra
  test không cần DOM (`gom-hang-cho` · `phim-canvas` · `canh-bao-nap-khung` · `vai-gan-ket`). AC 13
  theo đúng nếp này.

### Project Structure Notes

- `vitest.config.ts` `include` hiện là `core/**` · `db/**` · `components/**` · `app/**`.
  Module luật ở `scripts/soi/` **sẽ không được chạy** nếu không thêm `scripts/**/*.test.ts`.
  Thêm vào `include` — đừng nhét luật đo vào `components/` cho vừa cấu hình; nó không phải UI.
- ESLint flat config **không đọc `.gitignore`** (`eslint.config.mjs:11-19` ghi rõ bài học ấy).
  Thư mục mới dưới `scripts/` sẽ bị `npm run lint` soi — chạy **`npm run lint`**, không phải
  `npx eslint app components`; lệnh hẹp từng xanh trong khi lệnh đầy đủ đỏ 13 lỗi.
- `var/` đã trong `.gitignore:45` — ảnh chụp không vào git. Bản kê thì in ra stdout.
- Playwright `1.62.1` ở **`devDependencies`**; Chromium đã tải sẵn trong `~/.cache/ms-playwright`.
  Không thêm phụ thuộc mới.
- `scripts/` đang có cả `.mjs` (chạy bằng `node`) lẫn `.ts` (chạy bằng `tsx`). AC 20 cần đọc
  database ⇒ phần đếm `revision` đi đường `.ts` + `tsx`, như `db-migrate.ts` và `seed-from-sheet.ts`.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epics-dot-3.md:43` — dòng story 6-6]
- [Source: `_bmad-output/planning-artifacts/prds/prd-gia-pha-nguyen-quang-2026-08-10/prd.md:215-216` — NFR-5]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-gia-pha-nguyen-quang-2026-08-11/EXPERIENCE.md:387-397` — Accessibility Floor]
- [Source: `.../EXPERIENCE.md:45-55,62-66,134-140` — bản đồ màn bề mặt A, ba tầng cây, bề mặt B]
- [Source: `.../DESIGN.md:40-44,188-193,224` — thang chữ, sàn chạm]
- [Source: `_bmad-output/implementation-artifacts/review-epic-5-2026-08-25.md:256-260` — hai lỗi chỉ trình duyệt bắt được]
- [Source: `_bmad-output/implementation-artifacts/6-1-noi-nguoi-da-co.md:273-283,501-533` — bảy ô test còn trống, và § Nghiệm thu AC 28]
- [Source: `_bmad-output/implementation-artifacts/6-2-tai-khoan-va-vai.md:411-422` — ba mục cần mắt người]
- [Source: `_bmad-output/implementation-artifacts/6-7-ho-so-day-du-o-cot-phai.md:293-298` — bốn mục cần mắt người]
- [Source: `_bmad-output/implementation-artifacts/6-9-nhap-nhanh-tren-canvas.md:467-474` — sự cố 40 khẳng định]
- [Source: `docs/build-contract.md` — bốn cổng hiện có, phân tầng core]
- [Source: `app/globals.css:183-187` — `html { font-size: 17px }`]
- [Source: `app/admin/chrome.test.ts` — lối test đọc mã nguồn]
- [Source: `core/gates/rls.gate.test.ts` — lối `*.gate.test.ts`]

### Testing

`vitest` chạy `environment: 'node'`, `fileParallelism: false`, có database thật cho `core/`.
**Không có jsdom, không `@testing-library`.** Đó là lý do story này tồn tại: phần duy nhất render
thật là trình duyệt Playwright.

Ba tầng, đừng trộn:

1. **Thuần** (`vitest`, mili-giây) — luật sáu phép đo. Ca biên: đúng 15px · đúng 44px · giao nhau
   0px · đệm đáy đúng bằng khai báo · soi được 0 phần tử.
2. **Đọc mã nguồn** (`vitest`) — AC 15 (màn thiếu đăng ký) và AC 19 (không script nào bấm nút ghi).
3. **Trình duyệt thật** (`npm run soi`) — không chạy trong `npm test`; cần server sống + database +
   `SOI_MK`. Đây là cổng thứ năm, chạy tay trước khi phát hành.

**Đừng tích ô nào mà không có bài test tương ứng.** Lượt code review 6-1 bắt được năm ô `[x]` không
có một bài test nào ở bất kỳ đâu, và T9 tích `[x]` trong khi § CHƯA kiểm được nói *"chưa ai bấm"*.
Cái không nhìn được thì ghi thẳng vào § CHƯA kiểm được.

---

## Lượt chạy thật đầu tiên — 28/08/2026

Bốn màn công khai của bề mặt A, `next start` trên `127.0.0.1:3100`, khung nhìn 390px. Đây là lần
đầu bề mặt điện thoại được đo. Kết quả cuối: **0 vi phạm · 0 mục cần mắt · revision 77 → 77**.

Nhưng lượt chạy ĐẦU tiên ra `✗ SÀN BỊ HẠ — 11 vi phạm`, và cả ba thứ nó phơi ra đều là lỗi của
chính bộ đo, không phải của sản phẩm.

### 1 · `__name is not defined` — mọi phép thu số chết ở màn đầu tiên

Bộ đo chạy bằng `tsx`, tức esbuild, và esbuild bật `keepNames`: mọi hàm có tên bị bọc thành
`__name(fn, "fn")`. Playwright tuần tự hoá hàm bằng `fn.toString()` rồi `eval` trong TRANG, nơi
`__name` không tồn tại.

`tsc` xanh · `eslint` xanh · 93 bài test xanh — vì không cổng nào trong ba cổng ấy chạy một hàm
bên trong một trình duyệt. Vá bằng một shim `addInitScript`, truyền dưới dạng CHUỖI (truyền dưới
dạng hàm thì chính nó cũng cần cái shim nó đang định cài).

### 2 · Mười một vi phạm, cả mười một đều GIẢ

Luật sàn chữ bản đầu đoán "chữ thân" theo THẺ: mọi `<p>`/`<li>`/`<td>` phải ≥ 17px. Lượt chạy thật
trả về `<p>` *"Nguyễn Quang Hiệp ghi · 2 ngày trước"* ×8 và `<p>` *"Gõ tên để xem người ấy đã có
trong phả chưa"* — caption và chú thích, **15px đúng theo thiết kế**, nằm trong `<p>` như mọi
caption vẫn nằm.

Một cổng đỏ oan mười một lần ở màn ĐẦU TIÊN thì không ai chạy nó lần thứ hai. Nay luật neo vào
**thang cỡ chữ đã chốt** — `DESIGN.md § typography` có đúng ba nấc 15 · 17 · 23px:

- `< 15px` ⇒ **ĐỎ**, không ngoại lệ (`DESIGN.md:190-192` nói thẳng "áp cho mọi chữ")
- `≥ 15px` mà không phải một nấc của thang ⇒ **nêu ra**, không hạ cổng
- đúng nấc ⇒ im lặng

Cái bẫy `text-sm` = 14.875px vẫn rơi vào nhánh ĐỎ, và rơi vì SỐ ĐO chứ không vì tên lớp.

### 3 · Hàng rào cuối của AD-4 đang gác không khí — nặng nhất

Bản kê in `✓ revision 0 → 0 — phả không đổi`. Không lỗi, không cảnh báo, một con số trông hoàn
toàn bình thường. Nó sai.

`revision` là bảng phân vùng có RLS **ép buộc** (AD-20), nên `select count(*)` không đặt
`app.clan_id` thì bị lọc sạch. Đo được:

```
không context : 0 hàng revision
có context    : 77 hàng revision
```

Nghĩa là một lượt đo có ghi bậy vào phả vẫn ra `0 → 0` và vẫn xanh. Đây đúng bài học đã viết sẵn
ở `core/gates/rls.gate.test.ts`: **một cổng ĐỎ được thì mới là cổng**; cổng luôn xanh vì không
thấy gì thì chỉ trông giống cổng. Nay đếm theo từng dòng họ, có đặt context, và không đọc được
thì trả `null` để bản kê nói ra rằng hàng rào đang tắt.

### 4 · `/nguoi/[id]` không mở được cho khách

Trang chủ không bày một liên kết `/nguoi/…` nào cho người chưa đăng nhập — bán kính riêng tư
quyết định dữ liệu nào **tới được client**, không phải dữ liệu nào bị ẩn bằng CSS (AD-13/FR-37).
Phép giải nay đi qua ô tìm, và truy vấn là một **nguyên âm đơn** thử lần lượt chứ không phải tên
họ: AD-14 cấm hard-code thứ thuộc về một dòng họ cụ thể, và một bộ đo chỉ chạy được trên họ Nguyễn
là một bộ đo sẽ hỏng ở dòng họ thứ hai.

### Còn lại

Mười ba màn bề mặt A và toàn bộ bề mặt B cần một lượt đăng nhập. Bộ đo nay **không đòi**
`SOI_TEN`/`SOI_MK` khi lượt chạy chỉ đụng màn công khai, và khi đăng nhập hỏng thì nó ghi lý do
vào từng màn bị bỏ thay vì ném lỗi — bốn màn công khai vẫn đo xong.

## Lượt chạy TRỌN BỘ — 28/08/2026

Tài khoản: đặt lại mật khẩu của quản trị sẵn có bằng `reset-admin-password.ts` (tầng tài khoản,
AD-8) thay vì tạo admin thứ hai — `create-admin.ts` ghi một `person` + một khẳng định `name` vào
phả thật, và một người không có thật trên cây của một dòng họ thật là cái giá không đáng trả cho
một lượt đo. Chốt với chủ dự án 28/08.

**Kết quả cuối: 27 màn · 0 bỏ qua · 0 vi phạm MỚI · `revision 77 → 77` · exit 0.**

Nhưng lượt đầu ra **426 vi phạm**, và đường đi từ 426 xuống 0 mới là nội dung thật của story:

| | |
|---|---|
| 426 | lượt chạy đầu |
| −396 | khai vào nền đã biết: 5 mục, mỗi mục có lý do và chỗ ghi nợ |
| −4 | **giả định của chính bộ đo**: đo bề mặt B ở 768px, mà `EXPERIENCE.md:498` nói nó desktop-only |
| −18 | hai khiếm khuyết THẬT, vào `deferred-work.md § 6-6` |
| **0** | vi phạm mới |

### Cái đắt nhất: 92% vi phạm là MỘT token

370 trong 426 là `--muted-foreground` #796952 trên nền bàn #edeae4 = **4.42:1**, sàn 4.5. Một token,
mọi màn quản trị. Kiểm lại số học độc lập chứ không tin phép đo của chính mình: trên ô bảng trắng
#ffffff cùng token ấy đạt **5.31:1** — chỉ nền bàn mới hụt, và đó là lý do bề mặt A sạch.

### Cái đáng quyết sớm nhất: chấm "tồn nghi" 2.72:1

`EXPERIENCE.md:394` gọi đích danh ca này (*"≥ 4.5:1, kể cả node tồn nghi"*), còn
`app/globals.css:191-195` cấm làm mờ tầng tồn nghi. Hai ràng buộc do cùng một người đặt ra, và chỉ
người ấy hoà giải được.

### Nền đã biết — và vì sao nó nguy hiểm

Để nguyên 426 thì `npm run soi` đỏ vĩnh viễn, mà cổng lúc nào cũng đỏ thì vô dụng ngang cổng lúc
nào cũng xanh. Nhưng một danh sách miễn trừ là chỗ dễ giấu lỗi nhất trong cả bộ đo, nên
`da-biet.ts` có ba ràng buộc, và `da-biet.test.ts` thi hành chúng:

1. mỗi mục phải nói **vì sao chưa vá** và **ghi nợ ở đâu** — bài test bắt đúng chỗ tôi viết tắt
   *"như trên"* ở hai mục React Flow;
2. bản kê in **số đếm từng mục**, không in một tổng — một mục đã biết mà đếm TĂNG là một hồi quy
   mới đang nấp sau một miễn trừ cũ;
3. khớp theo `loai` **và** một chuỗi trong mô tả — miễn trừ cả một `loai` là tắt luôn phép đo.

## AC 23 — kết toán trung thực về bảy ô của story 6-1

AC 23 đòi story này ghi rõ nó đóng ô nào trong bảy ô test còn trống của 6-1. Câu trả lời:
**không ô nào.**

- Phần *dựng câu* đã có `components/admin/quan-he-ghi-them.test.ts` phủ — 16 bài THUẦN trên
  `cauSeGhi`, từng hướng và từng `relation`. Một phép đo trình duyệt lặp lại việc ấy không thêm gì.
- Cả bảy ô còn trống đều nằm trên `ghiThemQuanHe` — một server action `'use server'`, tức **đường
  GHI**, mà 6-6 cố ý không chạm (chốt 27/08).

Nên mốc bám `data-cau-se-ghi` đã đặt vào `bieu-mau-ghi-them.tsx` để story sau dùng, còn bước lái
biểu mẫu thì không viết: viết nó ra chỉ để tích một ô mà không đóng được ô nào là đúng lớp "tích
khống" mà code review 6-1 đã bắt một lần.

**6-1 vẫn không đóng được nhờ story này.** Cần một dòng họ THỬ, và cần một quyết định riêng.

### Chốt BỎ T11 — 28/08/2026, và cái giá của nó

Chủ dự án chốt bỏ, cùng lối đã chốt bỏ AC 9/10 của story 6-9. Ghi cái giá ra để không ai tưởng
đây là chỗ quên:

- **AC 23 chỉ đạt NỬA.** Vế "ghi rõ đóng ô nào" đã làm; vế "câu xem trước được đo trên trình
  duyệt" thì không. Story vẫn chốt với một AC đạt một nửa — khác với 6-1, chỗ ấy được chốt vì
  vế còn lại **không đóng được ô nào**, chứ không phải vì nó khó.
- **Không ai từng thấy câu xem trước hiện ra trên màn.** `cauSeGhi` có 16 bài thuần chứng minh nó
  dựng đúng chuỗi, nhưng chuỗi ấy có thật sự đến được mắt người vận hành hay không thì vẫn chưa
  đo. Nếu `bieu-mau-ghi-them.tsx` một ngày nào đó thôi render khối ấy, không cổng nào đỏ.
- Đó là hàng rào **duy nhất** chống ghi ngược chiều cha-con (`bieu-mau-ghi-them.tsx:268-271`), nên
  chỗ nợ này đắt hơn vẻ ngoài. Vào `deferred-work.md § 6-6`.

## Câu hỏi cho chủ dự án

1. ~~**Đường GHI qua trình duyệt**~~ — **CHỐT 27/08: chỉ ĐO, không ghi.** Ghi vào phả thật là vi
   phạm AD-4 và lặp lại sự cố 40 khẳng định; dựng dòng họ thử là hạ tầng dữ liệu riêng, không phải
   phép đo. **Cái giá, nói thẳng: 6-1 vẫn không đóng được** — năm trong bảy ô test còn trống của
   nó là đường ghi, và story này không chạm tới. Ô nào 6-6 đóng được thì AC 23 nói rõ.
   Chủ dòng cho phần còn lại **vẫn để trống** — cần một quyết định riêng, không phải của story này.
2. **Cổng thứ năm chạy khi nào?** Nó cần server sống + mật khẩu nên không vào được `npm run build`.
   Chạy tay trước mỗi lần phát hành, hay gắn vào `scripts/deploy.sh`?
3. **Ba mục ở bảng nợ đánh dấu ⚠ "cần mắt"** (chip dời tâm mượt hay chớp · phím tắt không nơi nào
   nói ra · `role="status"` nghe được không) bộ đo không thay người được. Chúng ở lại § CHƯA kiểm
   được của story này, hay tách thành một việc vận hành có chủ riêng?

---

## Dev Agent Record

### Agent Model Used

claude-opus-5

### Completion Notes List

- **Bộ đo dựng xong và chạy thật**: 27 màn (17 bề mặt A ở 390px · 10 bề mặt B ở 1280px), 0 màn bỏ
  qua, 0 vi phạm mới, `revision 77 → 77`, `npm run soi` exit 0.
- **Bốn cổng cũ xanh**: `npm run lint` · `npx tsc --noEmit` · **492/492 test** · `npm run build`.
  Trong đó 106 bài mới dưới `scripts/soi/`.
- **Bốn script `soi-*.mjs` gỡ bỏ**, gom vào một runner theo bản đăng ký. Phần biết-đường-vào từng
  màn giữ nguyên (tệp CSV mẫu của 6-3 → `xem-truoc.ts`; mở `<details>` và chọn node → bản đăng ký;
  hai phép đo riêng của `soi-man.mjs` → phép `cot-phai`, trả đúng hai mục nợ của 6-7).
- **Ba lỗi của chính bộ đo, do lượt chạy thật bắt** — `__name` shim, luật sàn chữ đoán theo thẻ
  (11 vi phạm giả), và hàng rào `revision` đếm 0 vì RLS. Chi tiết ở § Lượt chạy thật đầu tiên.
- **Một giả định sai đã sửa chứ không hoãn**: đo bề mặt B ở 768px, trong khi `EXPERIENCE.md:498`
  nói nó desktop-only.
- **Hai hàng rào của bộ đo tự bắt được lỗi của tôi**: `cam-bam.test.ts` bắt tôi khai ba tệp chưa
  tồn tại rồi sau đó bắt tôi viết tắt *"như trên"*; `dang-ky.test.ts` bắt được cả hai chiều khi
  thử phá.
- **T11 chốt bỏ** theo quyết định chủ dự án 28/08; cái giá ghi ở § Chốt BỎ T11.

### File List

**Mới — bộ đo (2 406 dòng, 106 bài test)**

- `scripts/soi.ts` — runner
- `scripts/soi/luat.ts` · `luat.test.ts` — bảy luật THUẦN, mọi ngưỡng khai một lần
- `scripts/soi/dang-ky.ts` · `dang-ky.test.ts` — bản đăng ký 27 màn + test đọc mã nguồn
- `scripts/soi/thu-so.ts` — phép thu số chạy trong trình duyệt
- `scripts/soi/trinh-duyet.ts` — mở · đăng nhập · bắt lỗi console · chụp
- `scripts/soi/moi-truong.ts` · `moi-truong.test.ts` — biến môi trường + hàng rào máy xa
- `scripts/soi/ban-ke.ts` · `ban-ke.test.ts` — bản kê + tách nợ khỏi vi phạm mới
- `scripts/soi/cam-bam.ts` · `cam-bam.test.ts` — hàng rào AD-4 đọc mã nguồn
- `scripts/soi/da-biet.ts` · `da-biet.test.ts` — nền đã biết, đếm riêng từng mục
- `scripts/soi/dem-revision.ts` — hàng rào cuối AD-4, đếm có clan context
- `scripts/soi/xem-truoc.ts` — bước mở bảng xem trước của bộ nạp khung

**Sửa**

- `package.json` — `soi` · `soi:cay` · `soi:tai-khoan` · `soi:nap-khung` · `soi:hang-cho`
- `vitest.config.ts` — `include` nhận `scripts/**/*.test.ts`
- `components/admin/bieu-mau-ghi-them.tsx` — thêm mốc bám `data-cau-se-ghi`
- `docs/van-hanh.md` — § Bộ đo giao diện, kèm § Vì sao không dùng 127.0.0.1
- `docs/build-contract.md` — khai bộ đo là cổng thứ năm
- `_bmad-output/implementation-artifacts/deferred-work.md` — § 6-6, bảy mục
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

**Xoá** — `scripts/soi-man.mjs` · `soi-tai-khoan.mjs` · `soi-nap-khung.mjs` · `soi-hang-cho.mjs`

### Change Log

- 27/08 — dựng hạ tầng, luật thuần, bản đăng ký, hàng rào cấm bấm, tài liệu.
- 28/08 — lượt chạy thật: vá `__name`, luật sàn chữ, hàng rào `revision`, phép giải `/nguoi/[id]`;
  bỏ 768px khỏi bề mặt B; thêm nền đã biết; nới "máy này" ra mọi địa chỉ của máy (IP Tailscale);
  chốt bỏ T11.

