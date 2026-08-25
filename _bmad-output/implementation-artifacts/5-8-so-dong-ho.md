# Story 5.8: Sổ dòng họ — tên họ, chữ đệm, đề từ

Status: review

## Story

Là **quản trị của dòng họ**,
tôi muốn **sửa được tên dòng họ, tên họ, chữ đệm và đề từ ngay trong sản phẩm**,
để **những thứ AD-14 gọi là DỮ LIỆU thật sự sửa được như dữ liệu, chứ không phải mở repo ra sửa mã**.

## Bối cảnh: bảng epic ghi 5-8 là "độc lập" — không đúng

Epic xếp 5-8 độc lập với 5-2…5-7. Đúng về mặt phụ thuộc giao diện, nhưng nó **có một tiền đề chưa
ai làm**, và chính epic đã ghi ra:

> **Cần dựng hàm ghi trong `core/identity` trước** — hiện chỉ có `getClanInfo`, không có đường ghi
> nào.

Soi lại `core/identity/info.ts` xác nhận: `getClanInfoOp` đọc `clan.settings`, dựng `ClanSettings`
từ bốn khoá — và hết. Không có `updateClanInfoOp`, không có bề mặt ghi.

`scripts/create-admin.ts` mang bốn giá trị mặc định của họ Nguyễn Quang và ghi chúng **một lần**
lúc dựng dòng họ. Sau đó đóng băng. Đổi đề từ nghĩa là sửa `.ts` rồi dựng lại — đúng thứ AD-14 nói
là defect:

> **AD-14 — Nothing about this particular clan is hard-coded.** Rule: surname, the fixed middle
> name, branch count, root ancestor, and clan-specific rules are **data**.

Dữ liệu mà chỉ ghi được bằng cách sửa mã thì nó chưa thật sự là dữ liệu.

## Acceptance Criteria

### Core — đường ghi

1. `updateClanInfoOp(tx, ctx, { name?, settings })` trong `core/identity/info.ts` — cùng file với
   `getClanInfoOp`, để cặp đọc-ghi nằm cạnh nhau.
2. **Chỉ `admin`.** Không phải `branch-head`: đổi tên dòng họ và đề từ là đổi thứ hiện trên **mọi
   màn của cả hai bề mặt**, kể cả trang chủ công cộng. Trưởng một chi không quyết chuyện của cả họ.
   Vai khác ⇒ `forbidden`.
3. **Ghi từng phần** (`Partial`): gửi một khoá thì chỉ khoá ấy đổi, các khoá khác giữ nguyên. Ghi
   đè cả cụm là cách nhanh nhất xoá mất đề từ khi ai đó chỉ định sửa chữ đệm.
4. Chuỗi rỗng ⇒ **xoá khoá ấy** khỏi `settings`, không lưu `''`. `getClanInfoOp` vốn đã coi `''`
   như vắng; lưu `''` là để lại một giá trị mà chính hàm đọc không thừa nhận.
5. `writeRevision` cùng transaction (AD-10), mang cả `before` lẫn `after`. Cần thêm `'clan'` vào
   tập `entity` của revision (TS-only, không migration — cùng lối `'place'` ở 5-7).
6. `updateClanInfo(...)` trên bề mặt `core/identity`, xuất qua `index.ts`. AD-24: tự giải phiên.
7. Test: admin sửa được từng phần · `branch-head` và `member` ⇒ `forbidden` · rỗng thì xoá khoá ·
   revision được ghi · `getClanInfo` đọc lại đúng thứ vừa ghi.

### Màn

8. `app/admin/so-dong-ho/page.tsx` — năm ô: **tên dòng họ** · tên họ · chữ đệm · **đề từ** ·
   phiên âm đề từ.
9. Mục **"Tên họ & đề từ"** vào `man-admin.ts` — nhóm `so-ho`, **không** có số, icon `ScrollText`.
   Đúng như `man-admin.ts` đã hẹn từ 5-1. Kèm màn thật cùng một lượt.
10. Bày rõ **mỗi ô ấy hiện ở đâu**, vì người sửa không đoán được: tên dòng họ lên tiêu đề trang
    chủ; tên họ + chữ đệm dùng cho gợi ý và so khớp tên; đề từ hiện trên trang chủ.
11. **Đề từ là Hán-Nôm** (光前裕後) và có ô phiên âm riêng (*Quang tiền dụ hậu*). Ô đề từ dùng
    `font-han-nom`; ô phiên âm dùng chữ thường. Không gộp hai thứ vào một ô.
12. Trống là hợp lệ ở cả bốn khoá `settings` — dòng họ chưa có đề từ là chuyện bình thường.
13. Vai không đủ quyền vào màn ⇒ nói thẳng là chỉ quản trị sửa được, **vẫn bày giá trị hiện tại**
    (chúng vốn công khai trên trang chủ, giấu đi chẳng giữ được gì).
14. Ghi xong: `revalidatePath('/', 'layout')` — tên và đề từ hiện trên **bề mặt A**, không chỉ trong
    `/admin`. Đây là màn duy nhất của Epic 5 mà thay đổi tràn ra ngoài bàn làm việc.

### Sàn không được hạ

15. Sàn chữ 17px; nhãn 15px; ô nhập 44px; `<label>` thật nối `htmlFor`. Không đổ bóng, không ngôi
    hai. Nút gửi mang son (nó ghi thật).

## Phạm vi — KHÔNG thuộc story này

- **Bảng tự bối (chữ đệm theo đời).** Epic xếp SHOULD và ghi rõ họ Nguyễn Quang **không có** bảng
  ấy — "Quang" là đệm của cả họ. Dựng một ô cho thứ dòng họ này không dùng là mời hiểu nhầm.
- **Người dùng & vai** — `docs/van-hanh.md` đang ghi nợ "nâng vai chưa có màn UI". Việc riêng.
- **Đổi tên dòng họ có ảnh hưởng gì tới `create-admin.ts`** — script vẫn mang mặc định cho lần dựng
  ĐẦU TIÊN; nó không đọc ngược lại từ DB, và không cần.

## Tasks / Subtasks

- [x] **T1. Đường ghi trong core** (AC: 1–7)
  - [x] `'clan'` vào tập `entity` của revision (TS-only)
  - [x] `updateClanInfoOp` + `updateClanInfo` + xuất qua index
  - [x] Test: quyền · ghi từng phần · rỗng thì xoá khoá · revision
- [x] **T2. Màn + mục thanh việc** (AC: 8–14)
  - [x] Mục `so-dong-ho` vào `MAN` + icon `ScrollText`
  - [x] `app/admin/so-dong-ho/` — page · loading · error · actions · form
- [x] **T3. Test**
  - [x] `chrome.test.ts` xanh (mục ↔ màn hai chiều)

## Dev Notes

### Cặp đọc-ghi nằm cạnh nhau

`getClanInfoOp` nằm ở `core/identity/info.ts`, không phải `ops.ts` — và đầu file nói rõ vì sao:
*"so this file stays a self-contained additive unit"*. Hàm ghi đi cùng chỗ ấy, không tách ra.

### `settings` là `jsonb`, nên ghi từng phần phải tự làm

Không có cột riêng cho từng khoá. Đọc `settings` hiện tại, trộn phần được gửi, ghi lại cả cụm —
nhưng **trộn ở tầng ops**, đừng để màn gửi lên cả cụm rồi ghi đè: màn nào quên một khoá là khoá ấy
biến mất.

### Đây là màn duy nhất của Epic 5 tràn ra bề mặt A

Sáu story kia chỉ đổi thứ nằm sau cổng `/admin`. Story này đổi tiêu đề trang chủ và đề từ mà cả
dòng họ nhìn thấy. Nên `revalidatePath` phải là `'/'` với `'layout'`, không phải `/admin`.

### Học từ 5-5 và 5-7

- Mở rộng một tập `$type` của Drizzle là **TS-only**, không cần migration (đã làm hai lần:
  `attachment.status` ở 5-5, `revision.entity` ở 5-7).
- Trình biên dịch sẽ tự chỉ ra mọi chỗ phải sửa theo. Ở 5-5 nó lần ra tận `/gan-node`.

### Testing

**Kiểm được:** toàn bộ T1 — quyền, ghi từng phần, rỗng-thì-xoá, revision. Test DB thật theo nếp
`core/identity/identity.test.ts`.

**Cần mắt người:** ô đề từ có hiện đúng font Hán-Nôm không (`globals.css` khai fallback CJK hệ
thống, chưa nạp font riêng) · năm ô có chật trong bề rộng nội dung không.

### References

- `epics-dot-2.md` hàng 5-8 (⭑) — *"Cần dựng hàm ghi trong `core/identity` trước"*
- `ARCHITECTURE-SPINE.md` AD-14 · AD-10 · AD-24
- `core/identity/info.ts` — `ClanSettings`, `getClanInfoOp`
- `scripts/create-admin.ts` — bốn mặc định của họ Nguyễn Quang
- `components/admin/man-admin.ts` — hẹn mục *Tên họ & đề từ*, icon `ScrollText`
- `app/globals.css` — fallback `han-nom`

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
| AC 4: chuỗi rỗng ⇒ xoá khoá | Áp cho **bốn khoá `settings`**, KHÔNG áp cho `name` | Tên dòng họ là tiêu đề của cả sản phẩm, hiện trên trang chủ công khai. Xoá nó không phải một trạng thái hợp lệ như "chưa có đề từ" — nên `name` rỗng trả `invalid`, và có bài test riêng. |

### Đã kiểm được

- `tsc` sạch · `eslint` sạch · `vitest` **183/183** (178 cũ + 5 bài cho đường ghi) · `build` xanh ·
  `/admin/so-dong-ho` trong route list · `chrome.test.ts` xanh (mục ↔ màn hai chiều).
- Năm bài test phủ đúng những chỗ dễ hỏng: **sửa từng phần** (gửi một khoá, ba khoá kia còn nguyên)
  · rỗng thì xoá khoá chứ không lưu `''` · tên dòng họ không được trống · `branch-head`/`member`/
  `guest` đều `forbidden` · đọc lại đúng thứ vừa ghi.

### Chỗ dễ hỏng nhất, và nó đã có test

`settings` là một cột `jsonb` — không có cột riêng cho từng khoá. Nếu để màn gửi lên cả cụm rồi ghi
đè, thì **màn nào quên một khoá là khoá ấy biến mất** — và "quên một khoá" là chuyện sẽ xảy ra đúng
lúc có người thêm khoá thứ năm. Nên việc trộn nằm ở tầng ops, và bài test đầu tiên khẳng định đúng
điều đó: gửi mỗi `middleName`, ba khoá kia phải còn nguyên.

### Đây là màn duy nhất của Epic 5 tràn ra bề mặt A

Sáu story kia chỉ đổi thứ nằm sau cổng `/admin`. Story này đổi tiêu đề trang chủ và đề từ mà cả
dòng họ nhìn thấy — nên `revalidatePath('/', 'layout')`, không phải `/admin`.

Cũng vì thế quyền là **`admin`, không phải `branch-head`**: trưởng một chi không quyết chuyện của
cả họ.

### CHƯA kiểm được — cần mắt người

1. **Ô đề từ có hiện đúng font Hán-Nôm không.** `globals.css:155` khai
   `'Noto Serif TC', 'Songti SC', 'SimSun', serif` — repo **chưa nạp font riêng**, nên bốn chữ
   光前裕後 rơi về stack CJK của hệ thống. Trên máy không có font CJK thì nó thành ô vuông.
2. Năm ô có chật trong bề rộng nội dung không.
3. **Chưa ai bấm "Ghi vào sổ dòng họ".** Nó đổi thứ hiện trên trang chủ công khai — cùng lý do với
   bốn story trước, tôi không tự ghi.
