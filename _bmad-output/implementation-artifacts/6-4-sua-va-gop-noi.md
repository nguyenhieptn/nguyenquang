---
baseline_commit: c438c9c
---

# Story 6.4: Sửa và gộp nơi

Status: done

## Story

Là **người trong ban tu phả**,
tôi muốn **sửa được tên và đơn vị cha của một nơi đã ghi, gộp hai nơi trùng thành một, và tách lại khi
gộp nhầm**,
để **danh mục nơi chốn không tự sinh sôi từ lỗi gõ của người nhập — và không có hàng nào ở lại vĩnh
viễn chỉ vì không ai gỡ được**.

## Bối cảnh — cái lỗ 5-7 để lại có chủ ý

FR-65 đòi nơi là thực thể (*"hai lần gõ cùng một cái tên thành hai nơi khác nhau"* là điều nó sinh ra
để chặn) và nói thẳng *"Trùng thì gộp được, gộp nhầm thì tách được."* Story 5-7 dựng xong đường
TẠO, dựng sẵn cột `place.merged_into` để đón, và `giaiNoi()` đã đọc được chuỗi gộp — rồi ghi vào
`deferred-work.md`: *"gộp đúng cách là cả một module… nhét vào 5-7 là làm hỏng cả hai."*

Hệ quả đo được trên chính mã: `addPlaceOps` phải siết quyền tạo về `gateApprover` với lý do *"nó
KHÔNG GỠ ĐƯỢC — một hàng tạo nhầm ở lại vĩnh viễn"*, và màn `/admin/noi-chon` chỉ liệt kê, không
làm được gì với một hàng sai. Đợt 3 cắt theo động từ SỬA; nơi là thực thể thứ tư trong năm thực thể
mà retro Epic 5 chỉ ra là *"ghi được mà không sửa được"*.

## Quyết định thiết kế — chốt 29/08/2026

1. **Gộp nơi KHÔNG repoint khẳng định.** Khác `core/merge` cho người (repoint mọi cạnh, ghi trọn
   danh sách để tách lại — AD-3), nơi đã có sẵn cơ chế đọc-giải: `giaiNoi()` lần theo `merged_into`
   tới nơi thắng ở MỌI đường đọc (`read-ops.ts:264`), và `addAssertionOp` từ chối ghi mới vào nơi
   đã gộp. Nên gộp = đặt `merged_into`; tách = xoá `merged_into`. Không có gì để repoint, và không
   có gì để mất — đó là lý do 5-7 dựng cột ấy từ đầu. Tách lại vì thế **luôn đúng nguyên trạng**,
   không cần danh sách mối nối.
2. **Không có bước "đề xuất".** `core/merge` tách đề xuất (ai gắn node cũng làm được) khỏi gộp
   (quyền duyệt) vì gộp NGƯỜI là thao tác đắt nhất sản phẩm. Gộp NƠI thì rẻ và đảo được nguyên
   trạng; và danh mục nơi vốn đã chỉ người có quyền duyệt mới ghi được (5-7, siết 25/08). Ba lối —
   sửa · gộp · tách — đều gác `gateApprover`, không thêm bảng.
3. **Nhật ký đủ để tách:** `revision` entity `place`, action `update` (before/after tên + đơn vị
   cha), `merge` (entityId = bên thua, after = `{ winnerId }`), `unmerge`. Mọi mutation cùng
   transaction (AD-10).
4. **Sửa tên đụng nơi đã có ⇒ `conflict` kèm id**, và câu gợi ý *gộp* — cùng hình với `addPlaceOps`.
   Luật "trống đơn vị cha khi đã có nơi trùng tên" giữ nguyên khi sửa.
5. **Màn `/admin/noi-chon` thành màn LÀM VIỆC**, không chỉ danh mục: mỗi hàng sửa được tại chỗ và
   gộp được vào một nơi khác; khu *Đã gộp* liệt kê bia mộ kèm nơi thắng và nút *Tách lại*. Máy gợi
   ý **trùng tên** (cùng `nameFolded`, khác đơn vị cha) — *bot gợi ý, không tự gộp* (FR-48), và
   cùng tên khác đơn vị cha có thể là hai nơi thật (FR-65), nên gợi ý chỉ là một dấu, không phải
   một nút được tích sẵn.
6. **Chu kỳ gộp bị chặn:** bên thắng không được là bia mộ, và không được giải về chính bên thua.

## Acceptance Criteria

### Core — `core/place`
1. `updatePlace(placeId, { name, parentUnit })`: quyền duyệt; tên không rỗng; nơi đã gộp ⇒
   `conflict`; đụng nơi khác trùng khít ⇒ `conflict` kèm `{ placeId, nhan }` của nơi ấy; trống đơn vị
   cha khi có nơi trùng tên ⇒ `invalid`; không đổi gì ⇒ `ok` không ghi nhật ký; đổi ⇒ cập nhật cả
   cột gấp dấu, nhật ký `update` có before/after.
2. `mergePlaces(loserId, winnerId)`: quyền duyệt; hai nơi khác nhau, cả hai còn sống; ⇒ bên thua
   mang `merged_into`, nhật ký `merge`; trả số khẳng định `place` đang trỏ vào bên thua (để màn nói
   *"N khẳng định nay đọc ra <nơi thắng>"*).
3. `unmergePlace(placeId)`: quyền duyệt; nơi đang là bia mộ ⇒ xoá `merged_into`, nhật ký `unmerge`;
   nơi còn sống ⇒ `conflict`.
4. `listMergedPlaces()`: bia mộ kèm nhãn nơi thắng (đã giải chuỗi) — cho khu *Đã gộp*.
5. Sau gộp: `giaiNoi` đọc bên thua ra bên thắng; `addAssertion` với `placeId` bên thua ⇒ `conflict`;
   `listPlaces` không còn bên thua. Sau tách: ngược lại y nguyên.
6. Thành viên thường ⇒ `forbidden` ở cả ba; tài khoản chưa gắn ⇒ `unattached`.
7. Chu kỳ: gộp A→B rồi B→A ⇒ `conflict` (bên thắng đang là bia mộ). Gộp vào chính mình ⇒ `invalid`.
8. `rls.gate.test.ts` xanh không sửa.

### Màn `/admin/noi-chon`
9. Mỗi hàng: tên · đơn vị cha · nút **Sửa** mở biểu mẫu tại chỗ (hai ô + *Ghi lại* + *Thôi*); ghi
   xong hàng cập nhật, danh sách vẫn xếp theo tên.
10. Mỗi hàng: **Gộp vào…** mở một bộ chọn nơi khác (tên + đơn vị cha, không bao giờ chỉ tên) + ô
    *đã đọc kỹ* + nút son *Gộp*; xong ⇒ hàng rời danh sách sống, câu xác nhận nói số khẳng định đọc
    ra nơi thắng, và hàng hiện ở khu *Đã gộp*.
11. Khu **Trùng tên**: nhóm các nơi cùng `nameFolded` (≥ 2) kèm chú *"có thể là hai nơi thật"* —
    không tích sẵn gì.
12. Khu **Đã gộp**: bia mộ → nơi thắng, nút *Tách lại*.
13. Lỗi nằm ngay dưới hàng (chàm mực), không băng-rôn đầu trang; `conflict` khi sửa trùng khít nói
    tên nơi đã có và chỉ sang nút Gộp.
14. Sàn: 17/15px · 44px · không màu-đơn · không đổ bóng. Bảng chật thì bớt cột.
15. Bản đăng ký bộ đo: `noi-chon` mở một biểu mẫu sửa (không bấm ghi); `cam-bam.ts` thêm nhãn
    *Ghi lại* · *Gộp* (đã có `Gộp hai người` — thêm dạng *Gộp vào*).

### Cổng
16. Bốn cổng xanh; `npm run soi -- noi-chon` xanh trên dòng họ thử (có ≥ 2 nơi).

## Phạm vi — KHÔNG thuộc story này
- Toạ độ, bản đồ, chuẩn hoá theo danh mục hành chính nhà nước (PRD xếp ngoài).
- Hai khẳng định cùng vai `que-quan` khác nơi là mâu thuẫn — **6-5**.
- Gộp nơi từ bề mặt A — danh mục là của ban tu phả.

## Tasks / Subtasks

- [x] **T1** `core/place/ops.ts`: `updatePlaceOps` · `mergePlaceOps` · `unmergePlaceOps` ·
      `listMergedPlacesOps` (AC 1–7)
- [x] **T2** `core/place/index.ts`: bốn bề mặt (AD-24)
- [x] **T3** `core/place/place.test.ts`: ca của AC 1–7 (thật, database)
- [x] **T4** `app/admin/noi-chon/actions.ts` + `bang-noi.tsx` (client) + `page.tsx` (AC 9–14)
- [x] **T5** Bộ đo: `cam-bam.ts` nhãn mới, `dang-ky.ts` bước mở biểu mẫu (AC 15)
- [x] **T6** Bốn cổng · soi trên dòng họ thử (AC 16)
- [x] **T7** Gỡ mục nợ ở `deferred-work.md § 5-7`, cập nhật chú thích `addPlaceOps` (*"KHÔNG GỠ ĐƯỢC"*
      nay sai), `sprint-status.yaml`

## Dev Notes

### Dùng lại, đừng dựng lại
- `trungKhit` / `trungTen` (`cham-diem.ts`) cho phép so khi sửa — cùng luật với tạo.
- `maTrungKhoa` + savepoint trong `addPlaceOps`: sửa tên cũng đọc-rồi-ghi trên `place_folded_uq`
  (chỉ mục phủ CẢ bia mộ), nên bọc `update` bằng `tx.transaction` y hệt.
- `giaiNoi` cho nhãn nơi thắng ở `listMergedPlacesOps`.
- Hình màn: `app/admin/hop-nhat/thao-tac-de-xuat.tsx` (ô *đã đọc kỹ* + nút son Gộp + Tách lại) và
  `app/admin/so-dong-ho/bieu-mau.tsx` (biểu mẫu sửa tại chỗ, `useActionState`).
- `loiRaCau` của hop-nhat — chép hình, đổi câu cho nơi.

### Chỗ dễ sai
1. **`taiNoi()` lọc bia mộ** — `updatePlaceOps` phải đọc hàng THÔ (`select ... where id`) rồi mới
   kiểm `mergedInto`, kẻo nơi đã gộp trả `not-found` thay vì `conflict`.
2. **Sửa tên trùng với một BIA MỘ**: pre-check chỉ soi hàng sống; chỉ mục sẽ ném 23505 — bắt như
   `addPlaceOps` và trả `conflict` kèm id bia mộ (giải ra nơi thắng để nói cho đúng).
3. **Số khẳng định đọc ra nơi thắng**: đếm `assertion.placeId = loserId AND status = 'live'` — cột
   `place_id` có thật trên `assertion` (`db/schema/domain.ts`), không phải trong `value`.
4. `revalidatePath('/admin/noi-chon')` sau mutation; màn `force-dynamic` (AD-23).

### Testing
- `place.test.ts` đã có nếp: clan tạm, `ctx`/`ctxThuong`/`ctxRoi`. Thêm một `describe` cho ba lối
  mới; kiểm nhật ký bằng `withClanContext` (RLS).
- Không test render; `chrome.test.ts` giữ bất biến (màn không mới nên `MAN` không đổi).

### References
- [Source: `_bmad-output/planning-artifacts/epics/epics-dot-3.md#Epic 6`] — dòng 6-4
- [Source: `prd.md § FR-65`] — *"Trùng thì gộp được, gộp nhầm thì tách được"*
- [Source: `_bmad-output/implementation-artifacts/deferred-work.md § 5-7`] — vì sao 5-7 để lại
- [Source: `core/place/ops.ts § addPlaceOps`, `§ giaiNoi`] · [`core/merge/ops.ts § unmergeOp`] — nếp
- [Source: `.../ARCHITECTURE-SPINE.md#AD-3`, `#AD-10`, `#AD-22`]

## Dev Agent Record

### Agent Model Used

Claude Opus 5 · 29/08/2026.

### Debug Log References

`npx tsc --noEmit` sạch · `npm run lint` sạch · `vitest` 531/531 (7 bài mới ở `place.test.ts`) ·
`npm run build` xanh. Bộ đo: `npm run soi -- noi-chon` trên dòng họ thử (ba nơi dựng sẵn) — xem
§ Completion Notes.

### Completion Notes List

- **Gộp nơi không repoint** — quyết định 1 của story, và nó làm cả module gọn còn ba ops + một
  phép liệt kê. Cái giá: một nơi chỉ gộp được vào nơi CÒN SỐNG (không chuỗi hai bước), và đó
  cũng là hàng rào chống vòng — một luật gánh hai việc.
- **Sửa là lối vào thứ hai của cùng một danh mục**, nên nó mang y hai luật của tạo (trùng khít ⇒
  `conflict` kèm id; trống đơn vị cha khi trùng tên ⇒ `invalid`) và cùng savepoint cho cuộc đua
  trên `place_folded_uq` — chỉ mục ấy phủ cả bia mộ, pre-check thì không.
- **Không đổi gì thì không ghi nhật ký** — một dòng `update` rỗng là nhiễu cho người tách lại sau.
- Dòng họ thử dựng sẵn ba nơi (hai cùng tên) để màn có gì đo và có một nhóm "trùng tên" để bày.
- Chú thích *"KHÔNG GỠ ĐƯỢC"* ở `addPlaceOps` nay sai một nửa — sửa thành *"không XOÁ được"*,
  giữ lý do siết quyền (danh mục là của cả họ; gộp không làm hàng biến mất — AD-4).

### File List

**Sửa — `core/`**
- `core/place/ops.ts` — `updatePlaceOps` · `mergePlaceOps` · `unmergePlaceOps` · `listMergedPlacesOps`
- `core/place/index.ts` — `updatePlace` · `mergePlaces` · `unmergePlace` · `listMergedPlaces`
- `core/place/place.test.ts` — 7 bài (sửa · không đổi · trùng khít · trống đơn vị cha · gộp/tách
  trọn vòng · vòng + bia mộ · quyền)
- `core/gates/dong-ho-thu.ts` — ba nơi thử

**Mới — `app/admin/noi-chon/`**
- `actions.ts` — `suaNoi` · `gopNoi` · `tachNoi`
- `bang-noi.tsx` — hàng sửa tại chỗ · bảng gộp vào · khu Đã gộp

**Sửa**
- `app/admin/noi-chon/page.tsx` — đọc thêm bia mộ, nhóm trùng tên bằng `chuanHoa`
- `scripts/soi/cam-bam.ts` (nhãn *Ghi lại*) · `scripts/soi/dang-ky.ts` (`noi-chon` mở hai bảng)
- `_bmad-output/implementation-artifacts/deferred-work.md` (§ 5-7 — gộp/tách đã làm) ·
  `sprint-status.yaml`

## Code review — 29/08/2026 (ba lớp, `bmad-code-review`)

Blind Hunter 10 · Edge Case 13 · Acceptance Auditor 8 → 17 sau gộp trùng → **13 patch · 2 defer · 2 dismiss**.

Patch (đã áp, cổng xanh, có test):
1. **Chuỗi A→B→C chiều thứ hai** — gộp đi một nơi đang là nơi thắng nay `conflict` ("tách những nơi
   ấy trước"); `place.test.ts` thêm ca ba nơi. Hệ quả: hai phát hiện "tách giữa chuỗi" và "đếm thiếu
   khẳng định trong chuỗi" không còn đường tới.
2. **`FOR UPDATE`** trên hai hàng khi gộp, trên hàng khi sửa — hai người gộp A→B và B→A cùng lúc
   không còn tạo vòng; sửa không còn đổi tên một bia mộ vừa sinh.
3. **`addPlaceOps` gặp 23505 vì tên trùng BIA MỘ** — trả nơi thắng (qua `giaiNoi`) thay vì id bia mộ
   mà `addAssertionOp` từ chối; câu nói đúng ("tên cũ của một nơi đã gộp"). Test mới.
4. **`updatePlaceOps` gặp 23505 vì hàng SỐNG vừa thêm** — câu "gộp hai nơi", không phải "tách lại".
5. **Câu xác nhận gộp/tách đi lên bảng** (`BangNoi.xong`), không nằm trong hàng bị gỡ ngay lúc ấy —
   con số khẳng định nay có người đọc.
6. **Thôi là thôi** — `dong()` trả `ten/cha/thangId` về giá trị gốc; `key` hàng mang cả nhãn để lượt
   đổi tên của người khác không bị ghi đè.
7. **Dấu trùng tên nói RÕ trùng với nơi nào** (`trungTenVoi`), thay cho một dấu câm — AC 11 được
   trả bằng dấu-kèm-tên tại hàng, không dựng khu riêng (xem quyết định dưới).
8. Ứng viên nơi thắng thiếu đơn vị cha bày kèm "— chưa ghi đơn vị cha".
9. Khu "Đã gộp" đọc hỏng thì nói, không im thành "chưa gộp gì".
10. Server action: kiểm `typeof` trước `.trim()`; hết phiên thì `redirect('/dang-nhap')` như hop-nhat.
11. Đếm `soKhangDinh` cả dòng đã ẩn (hiện lại thì cũng đọc ra nơi thắng).
12. **Tầng test adapter** `app/admin/noi-chon/actions.test.ts` (5 ca, phiên thật, dòng họ thử).
13. Chú thích ở `mergePlaceOps` viết lại cho đúng hàng rào thật.

Quyết định: **AC 11 "khu Trùng tên"** trả bằng dấu tại hàng có tên các nơi trùng — một khu riêng là
lặp lại bảng với ít thông tin hơn, và FR-65 nói trùng tên thường là hai nơi THẬT, không phải một hàng
chờ. **AC 15 "cấm `Gộp vào`"** là AC viết sai: `Gộp vào…` chỉ mở bảng, nút ghi thật là `Gộp — …` đã
nằm trong `cam-bam.ts` từ trước; `dang-ky.ts` cố ý bấm `Gộp vào…` để đo bảng mở.

Defer (→ `deferred-work.md § code review 6-4`): nhật ký nơi chốn chưa có người đọc; trang đọc hai danh
sách trong hai transaction. Dismiss: `giaiNoi` quá 20 bậc (chuỗi nay tối đa một bậc); fallback
`listMergedPlacesOps` không bao giờ chạy (cùng lý do).
