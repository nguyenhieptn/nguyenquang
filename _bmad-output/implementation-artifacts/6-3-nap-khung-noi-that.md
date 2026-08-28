---
baseline_commit: 6fe5104
---
# Story 6.3: Nội thất bộ nạp khung — ba lỗ im lặng

Status: done

## Story

Là **người vận hành đang nạp cả một bảng tính vào phả**,
tôi muốn **bộ nạp khung nói ra mọi mối nối nó KHÔNG ghi được, và nói theo đúng những quyết
định tôi vừa chọn**,
để **không ai phải phát hiện một người vợ mất tích bằng cách nhìn cây gia phả ba ngày sau**.

## Bối cảnh: ba lỗ này đã bật trên phả thật

Retro Epic 5 (25/08) chạy trên phả thật, và bắt được ba thứ không bài test nào thấy:

1. **Ba người vợ trong bảng tính không vào phả, không một cảnh báo.** `core/seed/ops.ts:345`
   chỉ nối union *"where BOTH sides resolved"*; `SeedRowWarning` không có loại nào cho vợ chồng;
   `loadClanCandidates` khi xem trước còn không nạp tên vợ chồng nên preview **không thể** cảnh
   báo dù có muốn. Commit vẫn báo thành công.
2. **`father-not-found` tính đúng rồi biến mất khỏi màn hình.** `previewSeedOp` trả `warnings`
   cho từng dòng; `scripts/seed-from-sheet.ts` in đúng một danh sách — danh sách dòng bị *bỏ qua*.
   Cảnh báo của một cụ tổ mất cha đi thẳng vào `/dev/null`.
3. **Cảnh báo xem trước tính mù quyết định.** `previewSeedOp` đếm trên MỌI dòng (`:128`), còn
   `resolveByName` khi commit chỉ đếm trên `activeByFolded` dựng từ những dòng **chưa bị `skip`**
   (`:187`, `:214`). Hai chiều sai, cả hai đã ghi ở `deferred-work.md` từ 24/08:
   - **(a) cảnh báo thừa** — bỏ một trong hai dòng trùng tên ⇒ màn nói *"gốc tạm của một mảnh"*
     nhưng commit lại nối được vào dòng còn lại;
   - **(b) cảnh báo thiếu** — dòng duy nhất mang tên cha bị bỏ ⇒ xem trước im, commit rơi xuống
     tìm trong phả rồi lặng lẽ bỏ cha.

   Vế (b) **đã xảy ra đúng như mô tả**: dòng của quản trị bị `skip` vì `nghi-trung`, `ten_cha`
   của chính người ấy không được đọc, và cây gia phả gãy làm hai mảnh.

Dòng họ sắp nhập dữ liệu thật hàng loạt. Một bộ nạp khung im lặng khi bỏ người là thứ tệ nhất
để mang vào lượt ấy.

## Chẩn đoán: một bệnh, không phải ba

Ba lỗ trên là ba triệu chứng của **một** nguyên nhân: *xem trước* và *ghi* mỗi bên tự giải tên
theo cách riêng của mình.

| | Xem trước (`previewSeedOp`) | Ghi (`commitSeedOp`) |
|---|---|---|
| tập dòng để tra | **mọi** dòng | chỉ dòng `active` (chưa bị `skip`) |
| tra tên vợ chồng | **không** | có |
| kết quả khi mơ hồ | cảnh báo `father-ambiguous` | trả `null`, bỏ cạnh |
| kết quả khi vắng | cảnh báo `father-not-found` | trả `null`, bỏ cạnh |

Hai cột ấy **phải** là một. Vá từng ô một sẽ để lại đúng cái khe đã sinh ra ba lỗ này.

**Vì thế việc chính của story không phải "thêm cảnh báo" mà là: rút phép giải tên ra MỘT hàm
thuần, cho cả hai bên gọi.** Ba cảnh báo là hệ quả rơi ra, không phải ba lần vá.

## Quyết định kiến trúc — chốt trước khi gõ

**QĐ-1. Một phép giải tên, hai chỗ gọi.** `giaiTen(folded, selfIndex)` trả về
`{ ok: true, ref }` hoặc `{ ok: false, ly: 'khong-thay' | 'mo-ho' }`. `previewSeedOp` dịch `ly`
thành cảnh báo; `commitSeedOp` dịch `ok:false` thành "không ghi cạnh". Không bên nào còn tự đếm.

**QĐ-2. `decisions` đổi CẢNH BÁO, KHÔNG đổi PHÂN LOẠI.** Đây là ranh giới quan trọng nhất của
story, và nó chống một vòng lặp có thật: `macDinhCua` (màn Nạp khung) suy **quyết định** ra từ
**phân loại**. Nếu quyết định lại quay ngược vào phân loại thì mỗi lần bấm một nút radio, phân
loại đổi → mặc định đổi → quyết định đổi → phân loại đổi. Phân loại tả **tệp so với phả**; nó
không được biết gì về quyết định.

Hệ quả: `duplicate-in-file` cũng **giữ nguyên cách tính trên mọi dòng** — nó tả cái TỆP, và nó
là thứ lái phân loại. Ba loại còn lại thì tính trên tập `active`.

**QĐ-3. Cảnh báo mới chỉ để BÀY, không lái mặc định.** Ở màn Nạp khung, `macDinhCua` tiếp tục
đọc cảnh báo **mù** của lượt xem trước đầu tiên. Đó không phải thoả hiệp: `macDinhCua` là *"bot
gợi ý gì khi mới nhìn tệp"*, không phải một luật sống. Giữ vậy thì vòng lặp ở QĐ-2 không có
đường nào mọc lại.

**QĐ-4. `skip-drops-edges` — loại cảnh báo chỉ tồn tại được khi có `decisions`.** Bỏ một dòng
không chỉ bỏ một người: nó bỏ luôn `ten_cha` và `ten_vo_chong` mà dòng ấy khai. Người vận hành
hiểu *"để lại dòng này"* là *"người này đã có trong phả rồi, đừng tạo bản trùng"* — chứ không
phải *"vứt các mối quan hệ dòng này khai"*. Đúng cái hiểu nhầm đã làm gãy cây. Đây là món
`decisions` trả về cho việc truyền nó vào, nên nó thuộc story này.

## Acceptance Criteria

### A · Phép giải tên dùng chung (nguyên nhân gốc)

1. `core/seed/ops.ts` có **một** phép giải tên thuần, và **cả** `previewSeedOp` lẫn
   `commitSeedOp` gọi nó. Không còn chỗ nào tự đếm `inFile` / `inClan` lần thứ hai.
2. Phép ấy giữ nguyên luật đã chốt 24/08: tệp thắng phả; **hai** dòng cùng tên ⇒ từ chối đoán;
   **một** dòng cùng tên ⇒ nối vào dòng; không có dòng nào ⇒ tra phả, đúng **một** người thì nối.
3. Tập dòng để tra là tập `active` (quyết định ≠ `skip`) — **cùng một tập** ở cả hai bên.
4. Có test chốt rằng hai bên không lệch nhau: cùng một tệp + cùng một bộ quyết định, mọi cạnh
   `commitSeedOp` ghi được đều **không** mang cảnh báo tương ứng, và mọi cảnh báo `khong-thay` /
   `mo-ho` đều tương ứng một cạnh **không** được ghi.

### B · Lỗ 1 — vợ chồng biến mất không cảnh báo

5. `SeedRowWarning` thêm **`spouse-not-found`**: `ten_vo_chong` có khai, nhưng không giải được
   ra ai — cả trong tệp lẫn trong phả.
6. `SeedRowWarning` thêm **`spouse-ambiguous`**: có **hơn một** người mang đúng tên ấy, nên bộ
   nạp từ chối đoán. Hai loại tách riêng vì hai câu người vận hành phải làm khác hẳn nhau: một
   bên là *"tên này chưa có ai"*, bên kia là *"tên này có hai người, chọn hộ"*.
7. `loadClanCandidates` của `previewSeedOp` nạp **cả tên vợ chồng** — hôm nay nó chỉ nạp tên
   dòng + tên cha, nên preview mù về vợ chồng ngay từ tầng dữ liệu.
8. Màn `/admin/nap-khung` bày hai loại ấy thành **khối cảnh báo riêng ngay dưới dòng**, cùng
   khuôn với hai khối cha đã có (`EXPERIENCE.md § Bảng xem trước so khớp` — cảnh báo nằm ngay
   dưới dòng nó nói về, không phải một cột, không phải một màn).
9. Chip **Cần xem lại** đếm cả hai loại mới (`canXemLai` đã đọc `canhBao.length`, phải giữ đúng).
10. Câu chữ phải nói ra **hậu quả**, không chỉ hiện tượng: *"union không được ghi"* / *"hai
    người này sẽ không thành vợ chồng trong phả"*. Người vận hành cần biết cái gì mất, không
    cần biết hàm nào trả `null`.

### C · Lỗ 2 — CLI không in `row.warnings`

11. `scripts/seed-from-sheet.ts` in **mọi** cảnh báo của mọi dòng, kèm số dòng và họ tên.
12. Bản in nói rõ **hậu quả** cho từng loại (mất cha / mất union / bị bỏ qua kéo theo gì).
13. In **trước** khi `commitSeedOp` chạy — cảnh báo đọc sau khi đã ghi vào một kho không có
    phép xoá (AD-4) thì đã muộn.
14. Không có cảnh báo nào ⇒ **không in gì cả**. Một dòng *"0 cảnh báo"* mỗi lượt chạy là cách
    nhanh nhất để người ta thôi đọc phần này.
15. Bản in cuối vẫn giữ nguyên ba con số cũ (tạo / nối / bỏ qua) — không đổi hợp đồng đầu ra.

### D · Lỗ 3 — cảnh báo tính mù quyết định

16. `previewSeedOp(tx, viewer, rows, decisions?)` nhận quyết định; vắng tham số ⇒ **mọi dòng
    active**, tức đúng hành vi hôm nay (không ai gọi bị vỡ).
17. `previewSeed(text, decisions?)` — bề mặt công khai của core — cũng nhận.
18. Vế **(a)** tắt được: hai dòng trùng tên cha, bỏ một ⇒ dòng con **hết** `father-ambiguous`,
    vì commit lúc này nối được thật.
19. Vế **(b)** bật được: dòng duy nhất mang tên cha bị bỏ ⇒ dòng con **được** cảnh báo
    `father-not-found`. Đây là ca đã làm gãy cây.
20. `SeedRowWarning` thêm **`skip-drops-edges`**: dòng đang bị `skip` mà có khai `ten_cha` hoặc
    `ten_vo_chong`. Chỉ bật cho `skip` — dòng `link` vẫn được nối cạnh đầy đủ
    (`wireParentEdge` + vòng union đều chạy trên dòng `link`).
21. Phân loại (`khop-nguoi-co-san` / `nguoi-moi` / `nghi-trung`) **không đổi** theo `decisions`,
    và `duplicate-in-file` vẫn tính trên mọi dòng — QĐ-2. Có test chốt bất biến này.
22. `scripts/seed-from-sheet.ts` chạy **hai lượt xem trước**: lượt một (mù) để suy quyết định,
    lượt hai (mang quyết định) để lấy cảnh báo trung thực đem in. Cả hai đều không ghi gì và nằm
    trong cùng một transaction.
    **Sửa 27/08:** AC này từng viết *"theo đúng nếp `macDinhCua`"* — sai, và chú thích trong
    script cũng khai như vậy. Script cố ý dùng luật KHÁC màn: ở đây không có ai để tích ô, nên
    *"để lại mọi dòng có cảnh báo"* sẽ lặng lẽ bỏ rơi người. Lý lẽ ghi ở `canh-bao-nap-khung.ts`.
23. Màn `/admin/nap-khung` cập nhật cảnh báo khi người vận hành đổi quyết định — một server
    action mới nhận `(vanBan, quyetDinh)` và trả cảnh báo theo dòng.
24. Lượt cập nhật ấy gọi từ **event handler** của nút radio, **KHÔNG** từ `useEffect`. Repo này
    đã vấp `react-hooks/set-state-in-effect` **bốn** lần (5-1 → 5-3 → 5-7 → 6-1). Lần thứ năm
    thì không còn là tai nạn.
25. Cảnh báo cập nhật về **chỉ để bày và để đếm chip**; `macDinhCua` vẫn đọc cảnh báo của lượt
    xem trước đầu tiên — QĐ-3.
26. Đáp về muộn không được đè đáp mới hơn: mỗi lượt gọi mang một số thứ tự, đáp cũ hơn số hiện
    hành thì bỏ.

### E · Sàn không được hạ

27. Sàn chạm 44px · chữ thân 17px · tối thiểu tuyệt đối 15px · không mã hoá trạng thái chỉ bằng
    màu (`EXPERIENCE.md § Accessibility Floor`).
28. Khối cảnh báo mới dùng đúng khuôn khối đã có (viền trái đặc + chữ nói rõ), không dựng khuôn
    thứ hai.

### F · Nghiệm thu trên phả thật

29. Dựng một tệp CSV có đủ năm ca (vợ vắng · vợ mơ hồ · cha vắng vì bị bỏ · cha hết mơ hồ vì bị
    bỏ · dòng skip có khai quan hệ), nạp qua `/admin/nap-khung`, **xem** bảng — và **không bấm
    Ghi**. Xem trước không ghi gì (`previewSeedOp` NEVER writes), nên ca này an toàn tuyệt đối
    trên phả thật.
30. Chụp lại màn và đo: không chữ nào < 15px, không đích chạm nào < 44px, không tràn ngang.
    (AC viết `scripts/soi-man.mjs`; thứ thật sự dùng là `scripts/soi-nap-khung.mjs` — script ấy
    đo `aside` của màn Cây, màn này không có `aside`.)

## Tasks / Subtasks

- [x] **T1 — Rút phép giải tên ra dùng chung** (AC 1–4)
  - [x] `core/seed/ops.ts`: dựng `giaiTen` từ `resolveByName`, trả `ly` khi không giải được
  - [x] `commitSeedOp` gọi `giaiTen` cho cả cha lẫn vợ chồng
  - [x] `previewSeedOp` gọi `giaiTen`, bỏ hẳn phép đếm `inFile` / `inClan` riêng
  - [x] Test: xem trước và ghi không lệch nhau trên cùng một tệp + quyết định
- [x] **T2 — Cảnh báo vợ chồng** (AC 5–7)
  - [x] `core/seed/index.ts`: thêm `spouse-not-found`, `spouse-ambiguous` vào `SeedRowWarning`
  - [x] `previewSeedOp`: nạp tên vợ chồng vào `loadClanCandidates`, sinh hai cảnh báo
  - [x] Test: ba người vợ của ca thật ⇒ ba cảnh báo, và ca mơ hồ không bị gọi nhầm thành vắng
- [x] **T3 — `previewSeedOp` nhận `decisions`** (AC 16–21)
  - [x] Thêm tham số tuỳ chọn ở `ops.ts` và ở bề mặt `index.ts`
  - [x] Thêm `skip-drops-edges`
  - [x] Test vế (a): bỏ một trong hai dòng trùng tên ⇒ hết `father-ambiguous`
  - [x] Test vế (b): bỏ dòng duy nhất mang tên cha ⇒ có `father-not-found`
  - [x] Test bất biến: `decisions` không đổi `classification`, không đổi `duplicate-in-file`
- [x] **T4 — CLI in cảnh báo** (AC 11–15, 22)
  - [x] `scripts/seed-from-sheet.ts`: hai lượt xem trước, in cảnh báo trước khi commit
  - [x] Nhãn tiếng Việt cho từng loại, nói ra hậu quả
- [x] **T5 — Màn Nạp khung** (AC 8–10, 23–26, 27–28)
  - [x] Module thuần `components/admin/canh-bao-nap-khung.ts`: nhãn + phép trộn cảnh báo
        (mù ⟶ theo quyết định) + test
  - [x] `app/admin/nap-khung/actions.ts`: action `xemLaiCanhBao(vanBan, quyetDinh)`
  - [x] `nap-khung-client.tsx`: gọi từ handler radio, số thứ tự chống đáp muộn, khối cảnh báo
        vợ chồng + khối `skip-drops-edges`
- [x] **T6 — Bốn cổng + một lượt soi** (AC 29–30)
  - [x] `npm run lint` · `npx tsc --noEmit` · `npm test` · `npm run build` (lệnh ĐẦY ĐỦ, không
        lệnh hẹp)
  - [x] `SOI_MK=… node scripts/soi-nap-khung.mjs` trên màn nạp khung với tệp năm ca —
        **không phải `soi-man.mjs`** như AC 30 ghi: script ấy đo cột phải (`aside`) của màn Cây,
        mà màn Nạp khung không có `aside`. Dựng script riêng, cùng luật đo, khác chỗ đo.


### Review Findings

Code review 27/08/2026 — ba tầng đối kháng chạy song song (Blind Hunter · Edge Case Hunter ·
Acceptance Auditor), mỗi tầng một phiên riêng. Bốn cổng xanh với **toàn bộ** danh sách dưới đây.

**Quyết định cần người (1)**

- [x] [Review][Decision] **[CHỐT (b): chỉ `spouse-*` thôi bỏ tích]** Loại cảnh báo MỚI bắt tay với luật cũ "có cảnh báo thì bỏ tích", và
      mặc định nuốt mất một nửa tệp** [`components/admin/canh-bao-nap-khung.ts:122`] — HỒI QUY do
      chính story này gây ra, hai tầng độc lập cùng chỉ vào. Đo lại trên **tệp mẫu mà chính sản
      phẩm phát ra** (`getTemplate()`):

      cảnh báo MÙ            : [["spouse-not-found"], []]
      hướng mặc định         : ["de-lai", "tao-moi"]        ← dòng cụ An bị bỏ tích
      cảnh báo THEO MẶC ĐỊNH : [["skip-drops-edges","spouse-not-found"], ["father-not-found"]]
      → số dòng SẼ GHI       : 1 / 2

      Trước story, dòng cụ An **không có cảnh báo nào** ⇒ mặc định `tao-moi` ⇒ cả hai người vào
      phả và cạnh cha–con được nối. Nay `ten_vo_chong` trỏ tới người **không có dòng riêng** —
      hình dạng thường gặp nhất của bảng tính chép tay, và là hình dạng chính tệp mẫu dạy — sinh
      `spouse-not-found`, và luật `de-lai` bỏ tích dòng ấy. Trên tệp 200 dòng, gần như mọi dòng
      đàn ông sẽ về `skip`. Nút vẫn đọc *"Ghi 1 dòng vào phả"*, bật sẵn, không gì chặn.

      Ba lối, cần chủ dự án chọn:
      **(a)** cảnh báo về MỐI NỐI thôi bỏ tích — chỉ `nghi-trung` mới để trống quyết định. Khớp
      với đúng lời sản phẩm đang nói ở khối cảnh báo (*"Ghi vẫn được… Tích chọn ở đầu dòng để vẫn
      ghi"*), và bịt hồi quy trọn vẹn.
      **(b)** chỉ `spouse-*` thôi bỏ tích, giữ `father-*` như cũ.
      **(c)** giữ luật, chỉ sửa câu chữ cho trung thực và bày rõ cái mất.

**Đã vá (19/19) — 27/08/2026**

- [x] [Review][Patch] **Câu *"không có ai tên ấy — cả trong tệp lẫn trong phả"* nay SAI**
      [`app/admin/nap-khung/nap-khung-client.tsx:614`, và bản sinh đôi cho vợ chồng `:570`] — sau
      story 6-3, *"trong tệp"* không còn nghĩa là trong tệp; nó nghĩa là *trong những dòng đang
      được tích*. Cha nằm đúng một dòng bên trên, chỉ là đang bị bỏ tích, mà màn khẳng định không
      có ai tên ấy — trên chính màn ghi hàng loạt vào kho không có phép xoá. Nặng hơn: câu khuyên
      bên dưới lái người vận hành sang màn *Mảnh chưa nối* để nối tay, tức **ra khỏi** cách sửa
      một cú bấm (tích lại dòng cha). Cần một loại thứ ba (`father-skipped` / `spouse-skipped`)
      hoặc câu chữ phân biệt được hai ca — `previewSeedOp` đã có `rows` đầy đủ trong tay.
- [x] [Review][Patch] **`skip-drops-edges` chỉ đếm cạnh dòng ấy KHAI, không đếm cạnh khai VỀ nó**
      [`core/seed/ops.ts:215`] — bỏ tích cụ tổ chi Ba (không có `ten_cha`) thì dòng ấy `warnings`
      **rỗng** ⇒ `canXemLai` false ⇒ không khối cảnh báo, và **rơi khỏi bộ lọc Cần xem lại**. 34
      dòng con cháu lặng lẽ nhận `father-not-found`, chip nhảy từ 7 lên 41, mà dòng người ta vừa
      bấm và đang nhìn thì trắng trơn.
- [x] [Review][Patch] **Script CLI in cảnh báo rồi ghi ngay nhịp sau** [`scripts/seed-from-sheet.ts:206-208`]
      — AC 13 đạt theo chữ, hỏng theo việc: giữa lượt in và lượt ghi vĩnh viễn có vài mili-giây,
      không prompt, không `--xem-truoc`, không ngưỡng dừng. Người vận hành đọc cảnh báo **sau
      khi** transaction đã commit. Cần một lối chạy khô, hoặc dừng khi có cảnh báo trừ khi được
      bảo tiếp tục.
- [x] [Review][Patch] Lượt xem trước THỨ HAI hỏng thì lỗi bị nuốt im lặng
      [`app/admin/nap-khung/actions.ts:153-157`] — `if (theoMacDinh.ok)` không có nhánh `else`;
      `canhBaoBanDau` về `{}` ⇒ màn bày cảnh báo MÙ mà `soiHong` vẫn `false`. Đối xứng vỡ: lượt
      soi lại hỏng thì có hẳn khối chữ nói ra, lượt soi ĐẦU hỏng thì im.
- [x] [Review][Patch] Nút **Ghi** không khoá khi lượt soi đang bay, cũng không khi nó vừa hỏng
      [`nap-khung-client.tsx:895-901`] — bấm radio rồi bấm Ghi trong 400ms thì lượt ghi chạy
      trong khi bảng cảnh báo còn là của bộ quyết định trước. `soiHong` bật rồi thì đứng vĩnh
      viễn, không nút thử lại nào.
- [x] [Review][Patch] Câu báo `soiHong` mô tả sai thứ đang bày [`nap-khung-client.tsx:957-960`] —
      *"đang tính như thể mọi dòng đều được ghi"* là mô tả bản MÙ, thứ đang **không** được bày:
      khi soi lại hỏng, `canhBaoMoi` giữ nguyên ảnh chụp của bộ quyết định trước.
- [x] [Review][Patch] `xemLaiCanhBao` vứt mã lỗi [`nap-khung-client.tsx:826`] — phiên hết hạn ra
      cùng một câu *"Đổi một lựa chọn nữa để thử lại"*, lời khuyên sai: đổi bao nhiêu lần cũng
      hỏng. `unauthenticated` / `forbidden` phải nói khác trục trặc mạng.
- [x] [Review][Patch] **Hồ sơ khai sai số test nền**: *"trước story: 325/325"* — thực tế **312**.
      325 là con số đo được GIỮA story (sau khi đã thêm 13 bài), bị chép nhầm thành mốc nền. Con
      số nền sai làm hỏng đúng phép trừ mà lượt review sau phải làm — và nó **đã** làm hỏng một
      lần, ở lượt review 6-9.
- [x] [Review][Patch] **Bản kê đo trình duyệt gọi nhầm tên lượt đo** — mục *"lượt xem trước MÙ
      (chưa quyết gì)"* có `skip-drops-edges` ×3, mà loại ấy **không thể** tồn tại trong một lượt
      mù (`ops.ts:215` đòi `action === 'skip'`). Số đo là thật; nhãn thì sai — nó là lượt THỨ HAI,
      theo bộ mặc định. Sai ở cả hồ sơ lẫn `scripts/soi-nap-khung.mjs:101`.
- [x] [Review][Patch] **AC 4 chỉ chốt được một nửa** — bài *"xem trước và lượt ghi không lệch
      nhau"* chỉ dựng ca `khong-thay`; **không bài nào** đối chiếu `father-ambiguous` /
      `spouse-ambiguous` với một lượt `commitSeedOp` thật. Nửa `mo-ho` của bất biến bỏ trống.
- [x] [Review][Patch] **AC 22 và chú thích CLI nói ngược nhau** — AC 22 và
      `scripts/seed-from-sheet.ts:160` khai script suy quyết định *"theo ĐÚNG nếp `macDinhCua`"*;
      `components/admin/canh-bao-nap-khung.ts:109` (mới viết) khai nó **cố ý không** dùng luật ấy.
      Lý lẽ ở module mới đúng — CLI không có ai tích ô — nên sửa lời AC và chú thích cũ, giữ mã.
- [x] [Review][Patch] **Lời viện dẫn `build-contract` bị nói quá** [`canh-bao-nap-khung.ts:17`] —
      luật thật (`docs/build-contract.md:25-26`) cấm `@/db`, `drizzle-orm`, `pg`, `@/core/*/ops`;
      `@/core/<module>` thì **được phép**, và `nap-khung-client.tsx` đang `import type` từ
      `@/core/seed` ngay trong file ấy. Nên `LoaiCanhBao` chép tay không cần thiết: `import type
      { SeedRowWarning }` bị xoá lúc biên dịch, không kéo `pg` vào bó nào, và chặn trôi cả HAI
      chiều (bản chép tay chỉ chặn chiều thêm loại).
- [x] [Review][Patch] `ghi_chu` và `chi` vẫn nằm trong `TableCell` `whitespace-nowrap`
      [`nap-khung-client.tsx:1016-1022`] — story bắt đúng bệnh và vá **một** chỗ (khối cảnh báo);
      ô bên cạnh thì không. `ghi_chu` là văn xuôi tự do và chính `getTemplate()` dạy điền cả câu.
- [x] [Review][Patch] **Cổng thứ năm được viết sao cho không bao giờ thấy lỗi ấy**
      [`scripts/soi-nap-khung.mjs:42-51,147-151`] — tệp năm ca để trống `ghi_chu`/`chi` trên cả
      chín dòng, và phép đo tràn đọc `documentElement.scrollWidth` trong khi `Table` bọc bảng
      trong `overflow-x-auto` riêng, nên tràn nội bộ **không bao giờ** chạm tới. Chính phép đo đã
      tìm ra lỗi (`<table>.scrollWidth` 1886 trong hộp 972) không có mặt trong script được chốt.
- [x] [Review][Patch] `soi-nap-khung.mjs` luôn thoát 0 — nó là bản báo cáo, không phải cổng. Gọi
      nó là *"cổng thứ năm"* là một lời khai quá tay.
- [x] [Review][Patch] **Luật mặc định có BA bản dịch, không phải hai** [`nap-khung-client.tsx:993-1001`]
      — handler ô tích chép tay lại `huongMacDinh` bỏ hai dòng đầu, trong khi module mới tự khai
      *"một bản, hai nơi dịch"*. Luật đổi thì hai nơi theo, nơi thứ ba không, và tsc im.
- [x] [Review][Patch] `datQuyetDinh` bỏ updater hàm [`nap-khung-client.tsx:806-810`] — đúng cái
      updater mà lượt review 6-9 vừa chốt *"giữ vì nó ĐÚNG"* ở chỗ khác.
- [x] [Review][Patch] `previewSeedOp` không kiểm khoá `decisions` trong khi `commitSeedOp` có
      [`ops.ts:144` vs `:277-281`] — hai cổng nói khác nhau. Và khoá `" 1"` qua được vòng kiểm
      của commit (`Number(" 1") === 1`) rồi bị `decisions[1]` đọc hụt ⇒ dòng người gọi đánh dấu
      **bỏ** lại được **tạo**. Cùng lớp: `""`, `"1e0"`, `"1.0"`.
- [x] [Review][Patch] Số dòng CLI in ra có thể lệch số hàng bảng tính
      [`seed-from-sheet.ts:120-129` + `:81-105`] — `r.line` tính trên chuỗi CSV **dựng lại**, mà
      lượt parse đầu bật `skip_empty_lines`. Một hàng trống giữa bảng làm mọi dòng sau lệch một;
      người vận hành mở Sheets tới hàng 87 và sửa nhầm người.
- [x] [Review][Patch] `KhoiCanhBao` vẫn chép tay danh sách sáu loại ở early-return
      [`nap-khung-client.tsx:410-416`] — loại thứ bảy sẽ dựng một hàng viền trái **rỗng**. Chú
      thích ở `:1040` khai đã bỏ "danh sách chép tay ở hai chỗ"; nó chỉ chuyển vào trong.
- [x] [Review][Patch] Câu *"Tích chọn ở đầu dòng để vẫn ghi"* vẫn hiện khi dòng ĐÃ được tích
      [`:554`, `:576`, `:603`, `:620`] — điều kiện chỉ đọc `!nghiTrung`, không đọc `quyetDinh`,
      dù `KhoiCanhBao` đã có sẵn prop ấy.
- [x] [Review][Patch] Hai món hồ sơ nhỏ — T6 tích `[x]` cho `soi-man.mjs` (thứ đã chạy là
      `soi-nap-khung.mjs`, và AC 30 cũng gọi nhầm tên); § *Không thuộc phạm vi* hứa ghi mục "cạnh
      tự trỏ" vào `deferred-work.md` mà không ghi.

**Hoãn (9) — có sẵn trước story này, không do lượt thay đổi này sinh ra**

- [x] [Review][Defer] Gieo lại **dựng lại chính những cạnh Ban tu phả vừa loại bỏ** —
      `wireParentEdge` và `alreadyJoined` lọc `status='live'`, mà `reject`/`hide` đặt `'hidden'`
      [`ops.ts:371`, `:449`] — deferred, pre-existing. **Nặng nhất trong nhóm hoãn.**
- [x] [Review][Defer] Hai dòng cùng `link` vào MỘT người ⇒ người ấy có hai cha, không cổng nào
      chặn [`ops.ts:284-290`] — deferred, pre-existing
- [x] [Review][Defer] Dòng `link` vào người ĐÃ có cha trong phả được gắn thêm cha thứ hai
      [`ops.ts:361-375`] — deferred, pre-existing
- [x] [Review][Defer] Vòng `ten_cha` trong tệp: xem trước im, commit đổ cả đợt [`ops.ts:334`] —
      deferred, pre-existing
- [x] [Review][Defer] A khai B là cha, B khai A là vợ/chồng ⇒ ghi cả hai cạnh, không cảnh báo —
      deferred, pre-existing
- [x] [Review][Defer] `spouseId === selfId` bỏ union không một tiếng [`ops.ts:437`] — deferred,
      cùng họ với "cạnh tự trỏ" mà story đã khai ngoài phạm vi
- [x] [Review][Defer] `nam_sinh = 0000` ném SAU khi lượt ghi đã bắt đầu [`csv.ts:132`] —
      deferred, pre-existing
- [x] [Review][Defer] `locCotDaBiet` im lặng nuốt cột trùng tên và cột không tên
      [`seed-from-sheet.ts:90-96`] — deferred, pre-existing
- [x] [Review][Defer] `nonce: Date.now()` làm khoá remount; hai lượt nạp trùng mili-giây thì
      state của tệp trước bám sang tệp sau — deferred, pre-existing

**Bỏ (3)** — `whitespace-nowrap` bị tố ở dòng 85 (kiểm ra đúng là **86**, hồ sơ ghi đúng) ·
`xemTruoc` ba lượt parse hai transaction (thật, nhưng là giá đã biết của đường đọc, không phải
lỗi) · một mục trùng lặp giữa hai tầng.

## Dev Notes

### Ranh giới không được vượt

- **AD-1** — `app/` không import `@/db` hay `@/core/*/ops`. Action mới gọi `previewSeed` (bề mặt
  công khai của core), không gọi `previewSeedOp`.
- **AD-24** — core tự đọc danh tính; `previewSeed` giữ nguyên chữ ký *không* nhận viewer.
- **AD-9 / AD-10** — không đụng tới đường ghi: mọi thứ vẫn vào tồn nghi, vẫn mang revision.
- **AD-4** — không có xoá. Cảnh báo phải tới **trước** lượt ghi, vì sau lượt ghi thì không lùi
  được.
- **AD-16** — mọi lượt so tên đi qua `chuanHoa`, không bao giờ `ILIKE` trần.
- `components/` không import `@/core/*` (`docs/build-contract.md § Phân tầng`) — module thuần ở
  T5 nhận **kiểu chuỗi**, không import `SeedRowWarning` từ core.
  Kiểm lại: `app/admin/nap-khung/actions.ts` **được** import từ `@/core/seed` (nó là adapter,
  không phải `components/`), và nó đã import sẵn `SeedRowWarning` hôm nay.

### Hiện trạng từng file sẽ sửa

**`core/seed/ops.ts` (387 dòng)** — `previewSeedOp:77` và `commitSeedOp:159`. Chỗ phải chạm:
`:89` (`loadClanCandidates` của preview, thiếu tên vợ chồng), `:126-132` (phép đếm riêng của
preview), `:214-223` (`resolveByName` của commit), `:345-383` (vòng union). Giữ nguyên: thứ tự
tô-pô Kahn (`:232-256`), `wireParentEdge` (`:280`), `must()` (`:270`) và luật *"mọi lỗi lường
trước phải bắt TRƯỚC lượt ghi đầu tiên"*.

**`core/seed/index.ts` (111 dòng)** — `SeedRowWarning:36-47` là hợp đồng; mỗi loại mới phải có
một dòng chú thích nói **cái gì mất**, đúng nếp ba loại đang có.

**`scripts/seed-from-sheet.ts` (171 dòng)** — `main()` đã có sẵn khung: preview ở `:124`, suy
quyết định `:140-153`, in danh sách bỏ qua `:154-157`, commit `:158`. Lượt xem trước thứ hai
chèn giữa `:153` và `:158`. Chú thích `:126-139` giải thích vì sao `link` thắng `skip` — giữ
nguyên, nó là biên bản của lần cây gãy.

**`app/admin/nap-khung/actions.ts` (129 dòng)** — `xemTruoc` ghép `SeedRow` thô với
`SeedPreviewRow`; action mới chỉ cần phần `warnings`, không cần ghép lại cả bảng.

**`app/admin/nap-khung/nap-khung-client.tsx` (903 dòng)** — `macDinhCua:93`, `canXemLai:83`,
`KhoiCanhBao:373`, `datQuyetDinh` trong `PhaXemTruoc:~650`, điều kiện dựng khối `:844-847`.
Điều kiện ấy hôm nay liệt kê từng loại cảnh báo bằng tay — sẽ thành *"có cảnh báo nào không"*,
kẻo mỗi loại mới lại phải nhớ sửa hai chỗ.

### Cạm bẫy đã biết

- **Vòng lặp phản hồi** — QĐ-2/QĐ-3. Nếu thấy mình định cho cảnh báo mới chảy vào `macDinhCua`,
  dừng lại: đó chính là vòng lặp.
- **`react-hooks/set-state-in-effect`** — bốn lần rồi. Gọi action từ handler, không từ effect.
- **`npm run lint`**, không `npx eslint <thư mục>`. Lệnh hẹp đã cho ra "eslint sạch" sai một lần.
- **Bốn cổng xanh ≠ phần mềm chạy được.** Retro Epic 5 và hai lượt code review của Đợt 3 đều
  chốt lại điều này. Cổng thứ năm là `scripts/soi-man.mjs`.
- **Đừng chạy `seed-from-sheet.ts` để thử.** Nó GHI vào phả thật, và phả đã qua lằn ranh: từ
  26/08 có dữ liệu chỉ tồn tại trong database. Thử phần CLI bằng test và bằng đọc mã.

### Không thuộc phạm vi (ghi ra để không ai tưởng là quên)

- **`SeedCommitResult` không thêm số cạnh đã ghi.** Cám dỗ có thật, nhưng sau AC 1–4 thì cảnh
  báo và lượt ghi dùng chung một phép giải tên, nên một bản kê thứ hai chỉ là nguồn sự thật
  thứ hai. Nếu về sau vẫn muốn, đó là một vé riêng.
- **Dòng `link` mà `ten_cha` giải ra chính người được link** (`wireParentEdge` bỏ cạnh tự trỏ
  ở `:281`) — nghĩa là người vận hành đã link nhầm dòng. Hiếm; ghi vào `deferred-work.md` chứ
  không cảnh báo trong story này.
- **Hàng rào "phả đã qua lằn ranh"** cho `seed-from-sheet.ts` — chủ dự án đã **bỏ** 26/08.
- **`chuanHoa` gấp "Quản" thành "quan"** nên nó khớp mọi "Quang" — lỗi so tên của `core/so-khop`,
  không phải của bộ nạp khung.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epics-dot-3.md` § Epic 6 — Đường sửa, dòng 6-3
  và § *Vì sao 6-3 xếp cao dù nghe như việc vặt*]
- [Source: `_bmad-output/implementation-artifacts/epic-5-retro-2026-08-25.md`]
- [Source: `_bmad-output/implementation-artifacts/deferred-work.md` § Deferred from: code review
  of 5-1-vo-admin — hai mục đầu]
- [Source: `.../ux-designs/.../EXPERIENCE.md` § Bảng xem trước so khớp; § IA — *Cảnh báo không
  có màn riêng*; § Accessibility Floor]
- [Source: `.../prds/.../prd.md` FR-51 (nhập khung), FR-48 (bot gợi ý chứ không tự gộp),
  FR-63 (gốc cây là dẫn xuất)]
- [Source: `.../architecture/.../ARCHITECTURE-SPINE.md` AD-1, AD-4, AD-9, AD-10, AD-16, AD-24]
- [Source: `docs/build-contract.md` § Phân tầng]

## Dev Agent Record

### Agent Model Used

claude-opus-5 (Claude Code)

### Debug Log References

Bốn cổng, chạy bằng lệnh ĐẦY ĐỦ:

```
npm run lint      sạch
npx tsc --noEmit  sạch
npm test          329/329 (26 file) — trước story: 312/312
npm run build     23 trang tĩnh, biên dịch sạch
```

> **Sửa 27/08 sau code review:** con số nền từng ghi `325/325`. Sai — 325 là số đo GIỮA story
> (sau khi đã thêm 13 bài), bị chép nhầm thành mốc nền. Mốc thật là **312**: 329 trừ 17 bài
> story này thêm (10 `canh-bao-nap-khung` + 7 `seed`). Một con số nền sai làm hỏng đúng phép trừ
> mà lượt review sau phải làm, và nó **đã** làm hỏng một lần — ở lượt review 6-9.

Cổng thứ năm — trình duyệt thật, `next start` trên `127.0.0.1:3100` (KHÔNG đụng bản đang chạy
trên VPN), tệp năm ca, dừng ở bước xem trước, không bấm Ghi:

```
SOI_GOC=http://127.0.0.1:3100 SOI_MK=… node scripts/soi-nap-khung.mjs

── lượt đầu, theo bộ MẶC ĐỊNH của màn ────────────────────────────
cảnh báo  : … "Có hai người cùng tên cha" … "Có hơn một người cùng tên vợ/chồng" …
            "Không tìm thấy người vợ/chồng" … "Để lại dòng này là bỏ luôn quan hệ nó khai" ×3
chip      : Cần xem lại (7)
chữ < 15px: không có ✓
chạm < 44px: không có ✓
tràn ngang: {"than":1280,"khung":1280} ✓ không tràn

── sau khi ĐỂ LẠI hai dòng ───────────────────────────────────────
"Có hai người cùng tên cha"  → BIẾN MẤT   (vế a — commit nối được vào dòng còn lại)
"Không tìm thấy người cha"   → HIỆN RA    (vế b — dòng cha duy nhất bị bỏ)
chip      : Cần xem lại (8)
lỗi console: không có ✓
```

### Completion Notes List

**Việc chính không phải "thêm cảnh báo".** Ba lỗ là ba triệu chứng của một nguyên nhân: xem
trước và lượt ghi mỗi bên tự đếm lấy. `dungPhepGiaiTen` nay là bản duy nhất, và bài test *"xem
trước và lượt ghi không lệch nhau: có cảnh báo ⇔ không có cạnh"* là cái chốt giữ điều đó.

**Hai thứ chỉ lượt soi bằng trình duyệt mới thấy — cả hai đã sửa trong story:**

1. **Dòng bị để lại mất luôn LÝ DO nó bị để lại.** Bản đầu im hẳn cảnh báo mối nối trên dòng
   `skip` (lý lẽ: *"có nạp đâu mà mất"*). Nhưng màn Nạp khung để lại sẵn MỌI dòng mang cảnh báo,
   nên một dòng bị để lại vì *"không tìm thấy người vợ/chồng"* hiện ra chỉ còn *"để lại dòng này
   là bỏ luôn quan hệ"* — lý do biến mất đúng lúc người vận hành cần đọc nó để quyết có tích lại
   hay không. Nay cảnh báo mối nối tính cho MỌI dòng; với dòng bị bỏ nó là câu trả lời cho *"nếu
   tôi tích lại thì sao"*. Không tốn thêm gì: phép giải tên vốn đã loại chính dòng đang hỏi ra
   khỏi tập tra.
2. **`TableCell` mang `whitespace-nowrap`** (`components/ui/table.tsx:86`), nên mọi đoạn văn
   trong khối cảnh báo nằm trên MỘT dòng và `max-w-[70ch]` viết từ story 3-2 **chưa từng có hiệu
   lực**. Đo được: `<table>` có `scrollWidth` 1886 trong hộp 972, và câu *"Nối vào đúng người cha
   ở màn **Mảnh chưa nối**"* chạy quá mép 56px. Vá bằng `whitespace-normal` trên khối cảnh báo —
   sau đó `scrollWidth` = `clientWidth` = 972, không còn gì vượt mép. Chỗ CÒN LẠI cùng lớp lỗi ở
   `/admin/hang-cho` đã ghi vào `deferred-work.md` (thuộc màn của story 6-8).

**Một thứ nữa nảy ra từ lượt soi, đã sửa:** `xemTruoc` nay chạy **hai lượt xem trước** — lượt hai
theo đúng bộ mặc định của màn — nên cảnh báo nói thật ngay từ lượt nhìn đầu. Trước đó chúng nhảy
sau cú bấm ĐẦU TIÊN và trông như cú bấm ấy gây ra. Luật mặc định vì thế rút về một bản
(`huongMacDinh`), client và server cùng dịch.

**AC 24 giữ nguyên:** không một `useEffect` nào được thêm. Lượt soi lại gọi từ handler của nút
radio / ô tích; lượt đầu tới sẵn trong kết quả của `xemTruoc` nên `useState` nhận thẳng.

**Câu khuyên trong khối `skip-drops-edges` rẽ theo loại dòng** — chỉ dòng nghi trùng mới có nút
*Là cùng cụ này*; dòng thường chỉ có ô tích. Chỉ sai chỗ bấm là câu khuyên thành đường cụt (đúng
lớp lỗi đã vá một lần ở khối `chaMoHo`).

**KHÔNG chạy `seed-from-sheet.ts`.** Nó ghi vào phả thật, và phả đã qua lằn ranh. Phần CLI kiểm
bằng test của core + đọc mã; phần màn kiểm bằng trình duyệt ở bước xem trước, nơi `previewSeed`
không ghi một dòng nào.

**Còn nợ lại:** AC 29 nói *"dựng một tệp CSV có đủ năm ca"* — đã dựng, nằm ngay trong
`scripts/soi-nap-khung.mjs` chứ không thành một tệp `.csv` riêng, để tệp và kịch bản đo không
trôi khỏi nhau.

### File List

**Mới**
- `components/admin/canh-bao-nap-khung.ts` — từ vựng cảnh báo + `canhBaoHienHanh` + `huongMacDinh`
- `components/admin/canh-bao-nap-khung.test.ts` — 10 test thuần
- `scripts/soi-nap-khung.mjs` — cổng thứ năm cho màn Nạp khung
- `_bmad-output/implementation-artifacts/6-3-nap-khung-noi-that.md` — chính story này

**Sửa thêm ở lượt vá code review 27/08** (19 patch + 1 quyết định — xem § Review Findings)
- `core/seed/index.ts` — thêm `father-skipped` · `spouse-skipped`; `skip-drops-edges` hai chiều
- `core/seed/ops.ts` — `kiemKhoaQuyetDinh` dùng chung cho cả hai cổng (chặn cả khoá `' 1'`);
  `tenBiBo` + `duocKhaiToi`; hai loại cảnh báo mới
- `core/seed/seed.test.ts` — thêm 4 bài (kể cả nửa `mo-ho` mà AC 4 bỏ trống)
- `components/admin/canh-bao-nap-khung.ts` — `import type` thay bản chép tay; `BO_TICH` (chốt
  của chủ dự án: chỉ `father-*` mới bỏ tích); nhãn cho hai loại mới
- `components/admin/canh-bao-nap-khung.test.ts` — viết lại bài từng GHIM CHẶT hồi quy
- `app/admin/nap-khung/actions.ts` — `soiDuoc` báo lượt xem trước thứ hai có chạy được không
- `app/admin/nap-khung/nap-khung-client.tsx` — hai khối cảnh báo mới; nút Ghi đợi lượt soi và
  khoá khi soi hỏng; `soiHong` mang mã lỗi; `quyetDinhGhi` gỡ bản dịch luật thứ ba; ô dữ liệu
  `whitespace-normal`; câu khuyên "tích chọn" thôi hiện khi đã tích
- `scripts/seed-from-sheet.ts` — `--xem-truoc`, DỪNG khi có cảnh báo trừ khi `--du-biet-canh-bao`;
  in số HÀNG thật của bảng tính; bỏ chú thích nói dối về `macDinhCua`
- `scripts/soi-nap-khung.mjs` — thoát khác 0 khi sàn bị hạ (đã thử: tiêm chữ 12px ⇒ mã 1); đo
  tràn trên bộ cuộn của chính bảng; tệp mẫu có `ghi_chu` dài và `chi`

**Sửa**
- `core/seed/ops.ts` — `dungPhepGiaiTen` dùng chung; `previewSeedOp` nhận `decisions`, nạp tên vợ
  chồng, sinh bốn cảnh báo mối nối + `skip-drops-edges`; `commitSeedOp` bỏ `resolveByName` riêng
- `core/seed/index.ts` — `SeedRowWarning` thêm ba loại; `previewSeed(text, decisions?)`
- `core/seed/seed.test.ts` — thêm 7 test (describe *"ba lỗ im lặng (story 6-3)"*)
- `scripts/seed-from-sheet.ts` — `inCanhBao`, và lượt xem trước thứ hai mang `decisions`
- `app/admin/nap-khung/actions.ts` — `xemLaiCanhBao`, `quyetDinhMacDinh`, `canhBaoBanDau`
- `app/admin/nap-khung/nap-khung-client.tsx` — ba khối cảnh báo mới, soi lại theo quyết định,
  `whitespace-normal`, `macDinhCua` dịch từ `huongMacDinh`
- `_bmad-output/implementation-artifacts/deferred-work.md` — hai mục đóng, một mục mới
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — hai action item đóng, 6-3 → review

## Change Log

| Ngày | Việc |
|---|---|
| 26/08/2026 | Rút phép giải tên ra dùng chung; thêm `spouse-not-found` · `spouse-ambiguous` · `skip-drops-edges`; `previewSeedOp` nhận `decisions`; CLI in cảnh báo; màn Nạp khung soi lại theo quyết định |
| 26/08/2026 | Sau lượt soi bằng trình duyệt: giữ cảnh báo mối nối trên dòng bị bỏ (lý do phải còn trên màn); `xemTruoc` chạy lượt xem trước thứ hai; `whitespace-normal` cho khối cảnh báo |
| 27/08/2026 | **Code review ba tầng đối kháng** — 19 patch + 1 quyết định, đã vá hết, 9 mục vào deferred-work. Nặng nhất là một HỒI QUY do chính story gây ra: loại cảnh báo mới bắt tay với luật cũ *"có cảnh báo thì bỏ tích"*, làm tệp mẫu của chính sản phẩm nạp lại chỉ ghi 1/2 dòng và không cạnh nào. Kèm hai loại cảnh báo mới (`father-skipped` · `spouse-skipped`) để màn thôi nói *"không có ai tên ấy"* ngay dưới một dòng mang đúng tên ấy |
