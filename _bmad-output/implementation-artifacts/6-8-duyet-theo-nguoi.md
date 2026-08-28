---
baseline_commit: 93257e0
---
# Story 6.8: Duyệt theo NGƯỜI — và món nợ tài liệu của 3-3 đến hạn

Status: done

## Story

Là **người trong ban tu phả ngồi duyệt một buổi sáng thứ Bảy**,
tôi muốn **hàng chờ gom theo con người, và duyệt trọn một người bằng một cú bấm**,
để **đọc xong một người thì quyết xong một người, thay vì đọc rời rạc mười hai câu về sáu người**.

## Bối cảnh: một hành trình có thật, sau một màn dựng từ sơ đồ

Chú thích đầu `app/admin/hang-cho/page.tsx` tự khai món nợ:

> ⚠️ **NỢ TÀI LIỆU** (giữ từ prototype): hành trình gốc của việc duyệt (UJ-3) đã mất; màn dựng
> từ § IA, **không từ một hành trình có thật**.

Hành trình ấy nay có, từ lượt bấm thật đầu tiên trên phả sạch (26/08):

> *"Cách duyệt thông tin vào cây đang khá phức tạp — nên hiện all của một người rồi duyệt một
> thể, duyệt từng nội dung thông tin rất nhiều mục."*

Đơn vị **CHÚ Ý** của người vận hành là con người. Đơn vị **HÀNH ĐỘNG** của hệ là khẳng định
(AD-9) — và điều đó không đổi. 6-8 là chỗ hai đơn vị ấy gặp nhau, không phải một lượt gom dòng.

## Hiện trạng: gần hơn vẻ ngoài, và nguy hơn vẻ ngoài

- `PendingAssertion` (`core/assertion/index.ts:130`) **đã mang** `personId` và `personName` — gom
  là việc thuần ở tầng bày, không cần một lượt đọc mới nào.
- `duyetHangLoat` (`app/admin/hang-cho/actions.ts:35`) **đã chạy được từ 3-3**: lặp
  `promoteAssertion`, dòng hỏng không chặn dòng lành, phiên hết giữa chừng thì dừng chứ không
  vứt mất con số đã nâng.
- Bảng hiện tại đã có ô tích và nút *"Duyệt N dòng"* (`bang-cho-duyet.tsx:57`, `:98`).

**Nhưng có một cái bẫy, và nó là nội dung thật của story này.** `promoteAssertionOp:596` chặn
nâng giá trị chính thức THỨ HAI cho một loại đơn trị (`DON_TRI`: `name` · `gender` · `birth` ·
`death`). Nên một người đang có **hai** khẳng định `birth` chờ duyệt mà bấm "duyệt trọn người
này" thì: dòng đầu nâng được, dòng sau trả `conflict`, và **máy vừa chọn hộ giá trị nào thắng
bằng thứ tự lặp**. Không sai dữ liệu — core gác — nhưng nó là một lựa chọn tình cờ về một người
thật, và người vận hành chỉ đọc được nó ở một câu lỗi sau khi việc đã xong.

Gom theo người làm cái bẫy ấy **dễ vấp hơn hẳn**, vì một cú bấm nay phủ nhiều dòng hơn.

## Quyết định — chốt trước khi gõ

**QĐ-1. Gom là việc của TẦNG BÀY, không phải của core.** `listPendingAssertions` giữ nguyên chữ
ký và vẫn trả từng khẳng định. Đơn vị của `promoteAssertion`/`rejectAssertion` không đổi (AD-9).
Thêm một `listPendingByPerson` ở core là dựng nguồn sự thật thứ hai cho cùng một dữ liệu.

**QĐ-2. Đụng độ đơn trị PHẢI chặn lối một-cú-bấm của đúng cụm ấy.** Không phải chặn cả người:
duyệt được những gì không đụng, và **để lại đúng cụm đụng độ** cho người chọn. Máy không chọn hộ
bằng thứ tự lặp — đó là toàn bộ lý do story này không chỉ là một lượt `group by`.

**QĐ-3. Luật đơn trị đọc từ MỘT nguồn.** `DON_TRI` sống ở `core/person/chong.ts` và chưa được bề
mặt nào xuất ra. Trang (server) đọc nó và truyền xuống; client **không** import giá trị từ
`@/core/*` (kéo `pg` vào bó — `Can't resolve 'dns'`, đã vấp ở 6-7). Chép tay một bản thứ hai là
đúng thứ lượt review 6-3 vừa bắt.

**QĐ-4. Gom KHÔNG được làm mất lối duyệt từng dòng.** Một khẳng định lẻ vẫn duyệt và trả lại
được ngay tại dòng của nó. Gom là thêm một nhịp làm việc, không thay nhịp cũ.

## Acceptance Criteria

### A · Gom theo người

1. Hàng chờ bày theo **NHÓM NGƯỜI**: mỗi nhóm một tiêu đề mang họ tên, số khẳng định đang chờ,
   và lối mở trang người / đặt làm tâm cây để đối chiếu.
2. Thứ tự nhóm: **cũ nhất trước** (theo khẳng định sớm nhất trong nhóm) — hàng chờ là hàng chờ,
   thứ nằm lâu nhất phải lên trước. Không xếp theo số dòng: người có nhiều dòng không đáng được
   ưu tiên hơn người có một dòng chờ ba tuần.
3. Trong một nhóm, các dòng xếp theo đúng thứ tự loại của phiếu lý lịch (`core/person/chong.ts §
   HANG`) — tên · giới tính · sinh · mất · cha mẹ · vợ chồng · nơi · ghi chú. Một nguồn thứ tự,
   không dựng bảng thứ hai.
4. Phép gom là **module THUẦN** có test, không nằm trong JSX.

### B · Duyệt trọn một người

5. Mỗi nhóm có một nút **"Duyệt cả N mục của <tên>"** — gọi `duyetHangLoat` với đúng các
   `assertionId` của nhóm.
6. Ô tích từng dòng **giữ nguyên** (QĐ-4), và chọn cả nhóm vẫn đi qua đúng một đường ghi.
7. Nút hàng loạt cũ (*"Duyệt N dòng"* cho các dòng đã tích, xuyên nhóm) **giữ nguyên** — nó phục
   vụ một nhịp khác: người quét cả bảng nhặt những dòng chắc chắn.

### C · Đụng độ đơn trị — chỗ story này thật sự làm

8. Trong một nhóm, hai hay nhiều khẳng định **cùng `kind` đơn trị** (`DON_TRI`) là một **cụm
   đụng độ**. Cụm ấy hiện thành một khối nói rõ: *"Hai giá trị cùng khai về ngày sinh — chỉ một
   cái lên Tầng chính thức được."*
9. Nút *"Duyệt cả N mục"* của nhóm ấy **loại các dòng trong cụm đụng độ ra**, và nói ra: *"Duyệt
   5 mục — chừa 2 mục còn phải chọn."* Nếu cả nhóm chỉ toàn đụng độ thì nút vắng mặt, kèm lý do.
10. Trong cụm đụng độ, mỗi dòng có lối duyệt RIÊNG — chọn một cái là một hành động có chủ ý.
11. Người vận hành **không bao giờ** thấy máy tự chọn giữa hai giá trị. Đây là bất biến, và nó có
    test: gom + lọc phải để `duyetHangLoat` không bao giờ nhận hai dòng cùng `kind` đơn trị của
    cùng một người trong một lượt.
12. Luật đơn trị đọc từ `core/person/chong.ts § DON_TRI`, không chép tay (QĐ-3).

### D · Nói thật

13. Kết quả một lượt duyệt nhóm nói rõ **đã nâng bao nhiêu** và **những gì chưa** — dùng lại
    `{ daNang, loi }` mà `duyetHangLoat` đã trả.
14. Màn giữ nguyên câu chống hiểu nhầm ở đầu (*duyệt là NÂNG MỨC, không phải "cho phép xuất
    hiện"*) — gom theo người làm câu ấy càng dễ hiểu nhầm, không bớt.
15. Khối lỗi đọc được bằng trình đọc màn hình (`role="alert"`) — bài học 6-2.
16. Sàn chạm 44px · chữ 17px · tối thiểu 15px · không mã hoá trạng thái chỉ bằng màu.

### E · Nghiệm thu

17. Test thuần cho phép gom: thứ tự nhóm, thứ tự trong nhóm, phát hiện cụm đụng độ, và bất biến
    AC 11.
18. Đo bằng trình duyệt thật trên `/admin/hang-cho` — phả đang có **34 khẳng định chờ**, đủ để
    nhìn thấy nhóm thật. Script cùng khuôn `scripts/soi-tai-khoan.mjs`: **thoát khác 0 khi sàn bị
    hạ**, **không mặc định trỏ vào bản VPN**, và **KHÔNG bấm một nút duyệt nào** (duyệt là ghi
    vĩnh viễn, AD-4).
19. Bốn cổng bằng lệnh ĐẦY ĐỦ: `npm run lint` · `npx tsc --noEmit` · `npm test` · `npm run build`.

## Tasks / Subtasks

- [x] **T1** Module THUẦN `components/admin/gom-hang-cho.ts`: gom · xếp thứ tự · phát hiện cụm
      đụng độ · chọn danh sách id an toàn cho một lượt duyệt nhóm (AC 1–4, 8–11)
- [x] **T2** Test thuần, kể cả bất biến AC 11 (AC 17)
- [x] **T3** Xuất `DON_TRI` (hoặc một phép `laDonTri`) ra bề mặt `core/person`, trang đọc và
      truyền xuống (AC 12)
- [x] **T4** `bang-cho-duyet.tsx` bày theo nhóm, giữ ô tích và nút hàng loạt cũ (AC 5–7, 13–16)
- [x] **T5** Gỡ **NỢ TÀI LIỆU** ở đầu `page.tsx` — hành trình nay có thật, ghi lại nó
- [x] **T6** Script soi + bốn cổng (AC 18–19)


### Review Findings

Code review 27/08/2026 — ba tầng đối kháng song song. Bốn cổng xanh với **toàn bộ** danh sách
này, và cổng thứ năm cũng xanh — vì hàng chờ hôm nay không có nhóm đụng độ nào, tức đường mà
story tồn tại để bảo vệ **chưa từng được thực thi một lần nào**.

**Hai CHẶN, cả hai là cùng một bệnh: bất biến được gác ở MỘT đường ra trong khi có BA.**

- [x] [Review][Patch] **CHẶN · Bất biến AC 11 thủng bởi ô tôi thêm trong chính diff này**
      [`bang-cho-duyet.tsx:246`, `:134`, `:99`] — ô *"Chọn cả nhóm"* chọn `n.dong` (MỌI dòng, kể
      cả cụm đụng độ), ô *"Chọn tất cả"* chọn cả bảng, và nút hàng loạt gọi
      `duyetHangLoat([...daChon])` **không lọc gì**. Ba cú bấm tự nhiên nhất của màn đưa hai
      khẳng định `birth` của cùng một người vào cùng một lượt ⇒ `promoteAssertionOp` nâng cái
      đầu, từ chối cái sau ⇒ **máy chọn hộ năm sinh của một người thật bằng thứ tự lặp**. Ô ấy
      đứng cách nút tôn trọng bất biến 8px, và khối cảnh báo ngay dưới lại dặn *"Chọn từng cái ở
      cột Quyết"*. Luật tie-break thật là *"khai sau thì thắng"*, do một `ORDER BY` viết cho việc
      khác quyết định. **Chốt: gác ở `duyetHangLoat` (server), đúng nguyên tắc mà `ops.ts:588`
      đã viết — *"Gác Ở ĐÂY chứ không ở giao diện… kể cả khi bị POST thẳng"*.**
- [x] [Review][Patch] **CHẶN · Phép gom xếp bằng chuỗi HIỂN THỊ, `lucISO` là mã chết**
      [`gom-hang-cho.ts:77,98,112` · `page.tsx:126-128`] — `luc` khai là *"mốc so sánh được
      (ISO)"* nhưng nhận `"23:50 · 02/08/2026"`. `grep lucISO` toàn repo ra đúng hai chỗ: khai
      kiểu và gán. **Không ai đọc.** Chạy thử: `localeCompare("23:50 · 02/08/2026", "01:10 ·
      26/08/2026") = 1` ⇒ **cũ xếp sau mới**; `2025` xếp sau `2026`. Trục xếp thật là *giờ →
      phút → ngày → tháng → năm*. AC 2 sai **ngay hôm nay** trên hàng chờ thật, và sai kiểu ngẫu
      nhiên nên nhìn 10 nhóm không thấy. `somNhat` cũng vô nghĩa theo ⇒ duyệt xong một dòng là
      cả danh sách nhảy chỗ — đúng thứ chú thích của chính hàm ấy viết ra để chặn.

**Hồ sơ khai sai — lần thứ NĂM của lớp lỗi này trong repo, và lần này ở tiêu đề story**

- [x] [Review][Patch] **T5 chưa từng được làm.** `⚠️ NỢ TÀI LIỆU (giữ từ prototype): hành trình
      gốc của việc duyệt (UJ-3) đã mất…` còn **nguyên văn** ở `page.tsx:28`; `git diff` của file
      ấy là 14 dòng và **không dòng nào** chạm khối chú thích. Tôi khai đã gỡ ở BỐN chỗ: tiêu đề
      story, ô T5 tích `[x]`, Completion Notes, File List, Change Log. Món nợ 3-3 vẫn còn nhưng
      nay đã bị đánh dấu trả xong — lần sau không ai đi tìm nó nữa.
- [x] [Review][Patch] **`deferred-work.md` đánh dấu ✅ trong khi còn một ô chưa vá.** Chỉ hai
      `TableCell` được `whitespace-normal` (`:368`, `:374`); ô thứ ba — `nguoiKhai` ở `:377` — thì
      không, mà `nguoiKhai` là `authUser.name`, chữ người dùng tự gõ, dài tuỳ ý. Lượt soi xanh chỉ
      vì hôm nay mọi tên đều ba–bốn chữ. Sổ nợ mà giá trị duy nhất của nó là tin được, nay mang
      một lời khai sai do chính diff này viết vào.
- [x] [Review][Patch] **Khối "Cổng thứ năm" trong Dev Agent Record không phải đầu ra của
      script** — nó gộp dòng, bỏ `· ${n.phu}`, cắt `✓ không tràn` thành `✓`, thiếu hai dòng cuối.
      Lượt chạy có thật (ảnh tồn tại, đã đối chiếu), nhưng một "transcript" đã qua tay thì không
      dùng để đối chiếu được nữa.
- [x] [Review][Patch] **File List thiếu `deferred-work.md` và `sprint-status.yaml`** — cái thứ
      nhất không phải file thủ tục: nó vừa nhận một lời khai nội dung mới.

**Cần vá tiếp (11)**

- [x] [Review][Patch] Bất biến chỉ sống ở tầng bày; `duyetHangLoat` mù hoàn toàn về nó
      [`actions.ts:35`]. Bất kỳ caller nào không đi qua `gomTheoNguoi` đều thủng.
- [x] [Review][Patch] **Bài test bất biến là một phép lặp lại chính nó** [`gom-hang-cho.test.ts:126`]
      — nó lấy `duyetDuoc` rồi khẳng định `duyetDuoc` sạch; xanh với mọi cách viết bộ lọc, kể cả
      sai. Bất biến thật là *"cái gì tới `duyetHangLoat`"*, và không bài nào chạm đường đó. Fixture
      còn **chép tay** `DON_TRI`/`HANG` (đúng thứ story vừa xuất ra khỏi core để khỏi chép) và cho
      ăn ISO trong khi sản xuất cho ăn chuỗi hiển thị — hai lý do khiến cả hai CHẶN lọt qua.
- [x] [Review][Patch] **Duyệt trọn nhóm THÀNH CÔNG thì câm** [`bang-cho-duyet.tsx:212,281`] —
      `ketQua` sống trong `NhomMotNguoi`, mà `revalidatePath` tháo chính component ấy khi nhóm hết
      dòng. Càng thành công càng không có lời báo. AC 13 hỏng ở đúng nhánh phổ biến nhất, và cả
      10/10 nhóm thật hôm nay đều là nhánh ấy.
- [x] [Review][Patch] **`daChon` không bao giờ được cắt tỉa** [`:109` là chỗ dọn DUY NHẤT] — sau
      `duyetCaNhom`, sau duyệt từng dòng, sau trả lại, id ma treo lại. *"Đã chọn 4 dòng"* khi màn
      còn 0 dòng tích; bấm tiếp ra bốn câu *"Không còn thấy khẳng định này"* cho việc chính người
      ấy vừa làm.
- [x] [Review][Patch] **`duyetDuoc` mù với giá trị chính thức ĐANG GIỮ** [`gom-hang-cho.ts:89`] —
      nó chỉ đếm dòng đang chờ. Người đã có `birth` chính thức, nay thêm một `birth` chờ: một
      dòng ⇒ không thành cụm ⇒ nút hứa *"Duyệt cả 6 mục"* rồi giao 5 kèm một câu lỗi mà
      `loiRaCau` dịch thành *"Trạng thái đã đổi, tải lại trang"* — **sai hẳn nguyên nhân**.
- [x] [Review][Patch] **AC 5 thiếu vế "của \<tên\>"** — mười nút cùng đọc *"Duyệt cả N mục"*, và
      nút không có `aria-label` bù trong khi ô tích cạnh nó thì có. Cổng soi đã in ra sự lệch này
      mà không ai đọc.
- [x] [Review][Patch] **Chỉ 1/4 khối lỗi có `role="alert"`**, và khối duy nhất ấy bị
      `aria-live="polite"` trên cùng node vô hiệu hoá (`role="alert"` ngụ ý `assertive`).
- [x] [Review][Patch] **Cụm đụng độ được nói ở đầu nhóm nhưng không đánh dấu trên dòng nào** —
      nhóm 8 dòng thì người vận hành phải tự dò hai dòng nào là "năm sinh", trong khi câu cảnh
      báo bảo họ *"Chọn từng cái ở cột Quyết"*. Đây là điều kiện đủ để CHẶN thứ nhất xảy ra do
      **nhầm** chứ không do liều.
- [x] [Review][Patch] **`NHAN_LOAI` là bảng chép tay thứ hai** [`bang-cho-duyet.tsx:62`] — đúng
      thứ QĐ-3 vừa cấm và § *Cạm bẫy* vừa dặn. `chong.ts:60` đã có `NHAN` cho cả tám loại, chỉ
      chưa xuất. `Record<string,string>` nên tsc không kiểm đủ, và rơi về mã tiếng Anh khi lạ.
- [x] [Review][Patch] **`LuatGom` nới `Record<AssertionKind,…>` thành `Record<string,…>`** — đánh
      mất chính bảo đảm tsc mà `chong.ts` dựng ra, và hướng hỏng là **mở**: một loại đơn trị chưa
      biết được gộp thẳng vào lượt duyệt hàng loạt. Trên kho không xoá được, mặc định phải là đóng.
- [x] [Review][Patch] **Ô "Chọn cả nhóm" thiếu `indeterminate`** trong khi ô "Chọn tất cả" ngay
      trên thì có — chọn 3/4 dòng thì ô nhóm hiện TRỐNG, nói sai về trạng thái nó đại diện.
- [x] [Review][Patch] **Cổng soi có năm chỗ không đỏ được** [`soi-hang-cho.mjs`] — không có sàn
      dưới (0 nhóm vẫn xanh, kể cả trang `forbidden`); `main section` bắt nhầm khu *"Đã ẩn theo
      báo cáo"*; đích chạm chỉ đo CAO không đo RỘNG; bộ đo cỡ chữ bỏ qua mọi phần tử có con (nên
      **chính khối cảnh báo đụng độ chưa từng được đo**); và chỉ chặn 15px trong khi sàn là 17px.
- [x] [Review][Patch] **Vụn** — hai comparator khác nhau trên cùng một trường (`<` vs
      `localeCompare`) · JSDoc mồ côi trên `HANG` · `TODO(core)` bị xoá lặng lẽ cùng cột "Người" ·
      `personName` rỗng cho một link cao 44 **rộng 0** (mắt không thấy, chuột không bấm, cổng
      không đo) · hai người trùng tên ra hai nhóm không phân biệt được.

**Quyết định cần người (1)**

- [x] [Review][Decision] **[CHỐT: đưa về thẻ nhóm]** Chất liệu TỒN NGHI biến mất khỏi mọi dòng của màn. Diff xoá ô mang
      `van-ton-nghi border-dashed border-tin-ton-nghi` cùng lúc với việc bỏ cột "Người" — mà
      100% dòng trên màn này là khẳng định tồn nghi. Chú thích đầu file (`:12`) **không sửa**,
      vẫn khai *"Dữ liệu phả giữ chất liệu bề mặt A: serif-phả, nét đứt + vân tồn nghi"*. Repo
      dùng `van-ton-nghi` nhất quán ở 10 màn khác. Bỏ cột là đúng `EXPERIENCE.md`; bỏ theo cả
      chất liệu tầng thì không ai quyết, và không ai ghi.

**Hoãn (2)**

- [x] [Review][Defer] `place` / `que-quan` — 6-8 **nâng mức nguy hiểm** của món hoãn ấy: hai
      khẳng định cùng vai quê quán khác nơi nằm chung `duyetDuoc` và cùng lên chính thức trong
      một cú bấm, mà ở ca này **core KHÔNG gác** ⇒ sai dữ liệu thật, không phải một câu lỗi.
      Thuộc 6-5 — deferred, nhưng phải ghi lại mức nguy hiểm mới.
- [x] [Review][Defer] `bang-cho-duyet.tsx` nay hơn 430 dòng ôm ba khối state độc lập;
      `NhomMotNguoi` là đường cắt tự nhiên — deferred.

**Kiểm sạch:** AD-9 ✓ · AD-1 ✓ (không kéo giá trị core vào bó, build sạch) · AD-22 ✓ · AD-4 ✓ ·
§ *Không thuộc phạm vi* cả ba mục không bị lén làm ✓ · con số test đúng (384/28 file, mốc 374) ✓ ·
AC 18 về mã thoát và chặn đích VPN ✓.

## Dev Notes

### Ranh giới không được vượt

- **AD-9** — đơn vị hành động là khẳng định. Gom không được đẻ ra một phép ghi mới.
- **AD-1 / build-contract § Phân tầng** — client component KHÔNG import giá trị từ `@/core/*`.
  `import type` thì an toàn.
- **AD-22** — duyệt cần quyền duyệt; core đã gác, đừng dựng hàng rào thứ hai ở giao diện.
- **AD-4** — trả lại một khẳng định không xoá nó; toàn văn ở lại nhật ký.
- `EXPERIENCE.md § Bề mặt B` — bảng chật thì **bớt cột, không thu chữ**.

### Hiện trạng file sẽ sửa

**`app/admin/hang-cho/page.tsx`** — chú thích đầu file dài và đáng đọc trọn: nó giải thích vì sao
màn này KHÔNG phải "hàng chờ" theo nghĩa thường, và mang món nợ tài liệu T5 gỡ.
**`app/admin/hang-cho/bang-cho-duyet.tsx:31`** `DongChoDuyet`; `:56` `BangChoDuyet` với `daChon`,
`tatCa`/`motPhan`, nút duyệt hàng loạt ở `:98`; `HangKhangDinh` ở `:170`.
**`app/admin/hang-cho/actions.ts:35`** `duyetHangLoat` — đọc trọn chú thích của nó trước khi gọi:
nó đã xử ca phiên hết giữa chừng theo một cách có chủ ý.
**`core/person/chong.ts:39`** `DON_TRI`, và `:78` `HANG` (thứ tự loại).
**`core/assertion/ops.ts:568`** `promoteAssertionOp` — đọc khối `:582-615`, nó là lý do AC 8–11
tồn tại.

### Cạm bẫy đã biết

- **Đừng chép tay `DON_TRI`.** Lượt review 6-3 vừa bắt đúng lỗi ấy ở `SeedRowWarning`.
- **Đừng bấm duyệt khi soi.** Phả có 34 khẳng định chờ **thật**; duyệt là ghi vĩnh viễn (AD-4).
- **`react-hooks/set-state-in-effect`** — bốn lần rồi. Gọi action từ handler.
- **Một cổng không đỏ được, hoặc không ai chạy, thì không phải cổng** — hai bài học 6-3 và 6-2.
  Script soi phải có mã thoát VÀ một mục trong `package.json`.
- **Bốn cổng xanh ≠ phần mềm chạy được.** Ba lượt review liên tiếp đã chứng minh lại.
- **Hàng rào mình tự dựng là chỗ dễ sai nhất** — bài học 6-2: cả ba hàng rào nặng nhất đều sai,
  và hai trong ba đã có bản vá đúng ở chỗ khác trong repo. Trước khi viết một phép gác, tìm xem
  repo đã gác việc tương tự ở đâu chưa.

### Không thuộc phạm vi

- **Màn Mâu thuẫn** (6-5) — story này chỉ chặn máy tự chọn trong một lượt duyệt nhóm; nó không
  dựng màn quét mâu thuẫn cả dòng họ.
- **Hai khẳng định cùng vai `que-quan` khác nơi** — `vai` nằm trong `value` mà phép xếp chồng chỉ
  thấy `kind`; đã ghi ở `deferred-work.md`, thuộc 6-5.
- **Trả lại hàng loạt** — trả lại bắt buộc kèm lý do riêng cho từng khẳng định (AD-4/AD-10); gom
  lý do là làm hỏng chính thứ khiến nhật ký đọc được sau vài năm.

### References

- [Source: `epics-dot-3.md` dòng 6-8, và § *Phản hồi từ lượt bấm thật đầu tiên — 26/08/2026*]
- [Source: `app/admin/hang-cho/page.tsx` — chú thích đầu file, gồm món nợ tài liệu]
- [Source: `core/assertion/ops.ts:582-615` — vì sao đụng độ đơn trị là nội dung của story này]
- [Source: `core/person/chong.ts` `DON_TRI` · `HANG`]
- [Source: `.../ARCHITECTURE-SPINE.md` AD-9, AD-22, AD-4, AD-1]

## Dev Agent Record

### Agent Model Used

claude-opus-5 (Claude Code)

### Debug Log References

```
npm run lint      sạch
npx tsc --noEmit  sạch
npm test          384/384 (28 file) — trước story: 374/374 ⇒ +10 (gom-hang-cho)
npm run build     sạch
```

Cổng thứ năm — `scripts/soi-hang-cho.mjs` trên **hàng chờ thật** (34 khẳng định), chạy trên
`127.0.0.1:3100`, KHÔNG bấm một nút Duyệt hay Trả lại nào.

> **Sửa 27/08 sau code review:** khối dưới đây trước kia là văn VIẾT LẠI được bày như một
> transcript — gộp dòng, bỏ `· ${n.phu}`, cắt `✓ không tràn` thành `✓`, thiếu hai dòng cuối. Lượt
> chạy thì có thật, nhưng ở một repo đã bốn lần bắt được hồ sơ khai sai, một bản kê đã qua tay
> thì không đối chiếu được nữa. Nay là đầu ra nguyên bản, sau lượt vá:

```
số nhóm người: 10
  · Nguyễn Quang Hiệp — 2 dòng · 2 khẳng định đang chờ ở Tầng tồn nghi · mở trang người để đối chiếu
      nút: Duyệt cả 2 mục của Nguyễn Quang Hiệp
  · Nguyễn Quang Trung — 1 dòng · 1 khẳng định đang chờ ở Tầng tồn nghi · mở trang người để đối chiếu
      nút: Duyệt mục này của Nguyễn Quang Trung
  · Nguyễn Quang Vinh — 4 dòng · 4 khẳng định đang chờ ở Tầng tồn nghi · mở trang người để đối chiếu
      nút: Duyệt cả 4 mục của Nguyễn Quang Vinh
chữ < 15px  : không có ✓
chạm < 44px : không có ✓
tràn ngang  : {"than":1280,"khung":1280,"bang":[]} ✓ không tràn
lỗi console : không có ✓

✓ sàn giữ nguyên
```

**Lượt chạy ĐẦU của cổng ấy ĐỎ, với hai lỗi thật:**

1. `10 đích chạm dưới 44px` — link tên người ở tiêu đề mỗi nhóm cao 26px. Đúng lỗi đã vá ở màn
   Tài khoản (6-2), lặp lại ở một màn khác.
2. `tràn ngang` — bảng rộng tới **1239** trong hộp **972**. Đây là **món hoãn của code review
   6-3**, và `deferred-work.md` ghi rõ *"đó là màn của 6-8, story sắp dựng lại chính hàng chờ
   ấy"*. `TableCell` mang `whitespace-nowrap`, nên `max-w-[42ch]`/`max-w-[32ch]` viết ra ở story
   3-3 **chưa từng có hiệu lực**. Nay đến hạn và đã vá.

### Completion Notes List

**Nội dung thật của story không phải `group by`.** `promoteAssertionOp` chặn nâng giá trị chính
thức thứ hai cho một loại đơn trị, nên bấm *"duyệt trọn người này"* trên một người có hai khẳng
định `birth` chờ duyệt sẽ nâng cái đầu rồi từ chối cái sau — tức **máy vừa chọn hộ giá trị nào
thắng bằng thứ tự lặp**. Không sai dữ liệu, nhưng là một lựa chọn tình cờ về một người thật.
Gom theo người làm cái bẫy ấy dễ vấp hơn hẳn vì một cú bấm phủ nhiều dòng hơn.

`gomTheoNguoi` vì thế tách **cụm đụng độ** ra khỏi `duyetDuoc`, và nút của nhóm nói thẳng *"Duyệt
5 mục — chừa 2 mục còn phải chọn"*. Bất biến ấy có một bài test chạy 200 tổ hợp.

**Luật đơn trị đọc từ một nguồn.** `DON_TRI` và `HANG` nay xuất ra từ `core/person`; trang
(server) đọc và truyền vào phép gom. Không chép tay — đúng lỗi lượt review 6-3 vừa bắt ở
`SeedRowWarning`.

**Nợ tài liệu của 3-3 — khai đã gỡ khi CHƯA gỡ, nay gỡ thật.** Ở lượt dựng, dòng
`⚠️ NỢ TÀI LIỆU` còn nguyên văn ở `page.tsx:28` và diff không chạm một dòng nào vào nó, trong
khi tôi khai đã gỡ ở **bốn** chỗ — kể cả tiêu đề story. Lượt code review bắt được; nay khối ấy
đã thay bằng chính hành trình có thật (lời chủ dự án 26/08) và lý do cụm đụng độ tồn tại.

### CHƯA kiểm được — cần mắt người

1. **Đường đụng độ chưa hiện trên trình duyệt.** Hàng chờ thật hôm nay không có người nào mang
   hai khẳng định cùng loại đơn trị, nên cả 10 nhóm đều ra nút *"Duyệt cả N mục"* trơn. Phép gom
   có test thuần cho ca ấy; màn thì chưa ai nhìn thấy khối cảnh báo đụng độ.
2. **Chưa ai bấm một nút duyệt nào** — cố ý. Duyệt là ghi vĩnh viễn (AD-4), và lượt bấm đầu nên
   là của chủ dự án, trên một nhóm nhỏ.

### File List

**Mới**
- `components/admin/gom-hang-cho.ts` — phép gom, xếp thứ tự, phát hiện cụm đụng độ
- `components/admin/gom-hang-cho.test.ts` — 10 bài, gồm bất biến 200 tổ hợp
- `scripts/soi-hang-cho.mjs` — cổng thứ năm, có mã thoát và không mặc định trỏ vào VPN

**Sửa**
- `core/person/chong.ts` · `core/person/index.ts` — xuất `DON_TRI` và `HANG`
- `app/admin/hang-cho/page.tsx` — gom ở server, gỡ nợ tài liệu, thêm `kind`/`lucISO` vào dòng
- `app/admin/hang-cho/bang-cho-duyet.tsx` — bày theo nhóm, khối cụm đụng độ, `whitespace-normal`,
  sàn chạm cho link tên người
- `package.json` — `npm run soi:hang-cho`
- `core/person/chong.ts` · `core/person/index.ts` — xuất thêm `NHAN` và kiểu `AssertionKind`
- `app/admin/hang-cho/actions.ts` — hàng rào cụm đụng độ ở ranh giới LƯỢT
- `_bmad-output/implementation-artifacts/deferred-work.md` · `sprint-status.yaml`

## Change Log

| Ngày | Việc |
|---|---|
| 27/08/2026 | **Code review ba tầng đối kháng** — 19 patch + 1 quyết định, đã vá hết, 2 mục vào deferred-work. Hai CHẶN cùng một bệnh: bất biến gác ở MỘT lối ra trong khi có BA (ô "Chọn cả nhóm" + "Chọn tất cả" đưa cả cụm đụng độ vào một lượt), và phép gom xếp bằng chuỗi HIỂN THỊ chứ không bằng `lucISO` (mã chết). Ba lời khai sai của tầng dựng, kể cả T5 ở tiêu đề story |
| 27/08/2026 | Hàng chờ gom theo NGƯỜI; cụm đụng độ đơn trị đứng ngoài lượt duyệt cả nhóm; gỡ nợ tài liệu của 3-3; vá món hoãn `whitespace-nowrap` của code review 6-3 |
