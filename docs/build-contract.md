# Build contract — Đợt 1 (22/08/2026)

Bản đồ thi công cho mọi story. **Đọc trước khi viết dòng code nào**, cùng với:

| Việc của bạn đụng | Bắt buộc đọc |
|---|---|
| Mọi story | `ARCHITECTURE-SPINE.md` (planning-artifacts/architecture/…), file này |
| Code trong `app/` | `docs/next16-delta.md` (Next 16 khác 14/15 — params async, `proxy.ts`, `retry`…) |
| Màn hình / component | `EXPERIENCE.md`, `DESIGN.md` (ux-designs/…), `specs/frontend-stack.md` |
| Core module | Các `index.ts` contract stub trong `core/*/` |

## Đã dựng sẵn (đừng dựng lại)

- **Postgres 18** container `giapha-db`, cổng `127.0.0.1:5438` — `docker compose up -d`.
- **Drizzle schema** `db/schema/domain.ts` (11 bảng clan) + `db/schema/auth.ts` (Better Auth 1.7.1
  + username plugin, đã khớp `getAuthTables` từng field). Migration 0000 + 0001 (RLS) đã áp.
- **RLS**: enabled + forced + policy trên mọi bảng clan; app role `giapha_app` không sở hữu bảng,
  không BYPASSRLS; context `app.clan_id` fail-closed. Gates: `core/gates/rls.gate.test.ts` (6 pass).
- **`db/index.ts`**: `withClanContext(clanId, fn)` — đường duy nhất chạm dữ liệu clan;
  `dbGlobal` — chỉ cho bảng identity; `ownerPool()` — chỉ scripts/tests.
- **`core/types.ts`** `Result<T>` / `ok` / `err` — core KHÔNG throw cho kết quả dự kiến được.
- **`core/revision.ts`** `writeRevision(tx, …)` — AD-10, gọi trong CÙNG transaction với mutation.
- **`core/identity/session.ts`** — `resolveSession()` / `resolveViewer()` (AD-24). Story 1-4 sẽ
  cấp `core/identity/auth.ts` với `resolveSessionImpl(headers)` + `guestContextImpl()`.
- **ESLint AD-1 + AD-24**: `app/`, `components/`, `lib/` bị CẤM import `@/db`, `drizzle-orm`, `pg`,
  **và** cả dạng tương đối (`../../db`) lẫn ruột core (`@/core/*/ops`) — chỉ gọi `@/core/<module>`.
- **Test**: vitest (`npm test`), chạy tuần tự, `.env` tự nạp. UUIDv7 qua `uuid` (`v7 as uuidv7`).
- **Cổng thứ năm — bộ đo giao diện** (`npm run soi`, story 6-6): mở trình duyệt thật, đi hết 27 màn
  trong `scripts/soi/dang-ky.ts` và đo sàn chữ 15/17px · sàn chạm 44px · tràn ngang · tương phản ·
  đệm đáy · đè lên tên. Luật là hàm THUẦN ở `scripts/soi/luat.ts` và có test; trình duyệt chỉ thu số.
  **KHÔNG chạy trong `npm run build`** — nó cần server sống + database + mật khẩu. Chạy tay trước khi
  phát hành; cách chạy ở `docs/van-hanh.md § Bộ đo giao diện`. Thêm `page.tsx` mà quên khai vào bản
  đăng ký thì `npm test` đỏ.
- Sinh migration mới: `npm run db:generate -- --name <tên>` rồi `npm run db:migrate`
  (cần `set -a; . ./.env; set +a` hoặc dotenv đã lo trong script).

## Phân tầng trong core (AD-24 mà vẫn test/ghép song song được)

```
core/<module>/index.ts   ← BỀ MẶT cho adapter: KHÔNG tham số danh tính.
                            Tự resolveViewer()/resolveSession() → withClanContext → gọi ops.
core/<module>/ops.ts     ← nội bộ core: (tx, ctx: ViewerContext|SessionContext, args).
                            Module khác trong core ĐƯỢC gọi ops của nhau trong cùng tx.
                            Test dựng ctx giả gọi thẳng ops.
```

Adapter (`app/`) **chỉ** import từ `core/<module>` (index). Không import `core/*/ops`.
Server Action đặt tại `app/**/actions.ts` (`'use server'`), gọi core, trả `Result` cho UI.

## Quy ước không thương lượng

- **Số đời / mã chi**: KHÔNG BAO GIỜ lưu — tính lúc đọc (AD-5). Không cache, không cột.
- **Quan hệ cha–con** là assertion `parent-child` (subject = CON, objectPersonId = CHA). Không có
  bảng cạnh nào khác (AD-18).
- **Giá trị chiếu trên `person`** (fullName, nameTier, birth…, isLiving) do DUY NHẤT
  `core/assertion` ghi (AD-19). Module khác đọc, không ghi.
  Hợp nhất cũng theo lối đó: repoint xong thì gọi `projectPerson(winner)`, rồi ghi chênh lệch
  từng cột thành mục `projection` trong revision để tách lại khôi phục đúng nguyên trạng (AD-3).
- **Mọi mutation** → `writeRevision` cùng tx (AD-10). Thêm người sống / đổi giá trị đã duyệt về
  người sống → chèn `notification` cùng tx (AD-15).
  - **Ngoại lệ AD-10 đã chốt — đúng hai chỗ, đừng thêm chỗ thứ ba:**
    1. `ensureClan` (`core/identity/bootstrap.ts`) chèn hàng `clan`. `revision.clanId` tham chiếu
       chính hàng vừa tạo, và `revision.accountId` là NOT NULL mà lúc ấy chưa có tài khoản nào —
       sự kiện khai sinh dòng họ nằm ngoài nhật ký của dòng họ đó, vì lúc ấy chưa có ai để ghi
       công.
       Ngoại lệ là ĐÚNG LỐI GHI ẤY, không phải cả thực thể `clan`: từ story 5-8 `revision.entity`
       CÓ thành viên `'clan'`, và `updateClanInfoOp` ghi nhật ký như mọi mutation khác (AD-14 —
       tên họ, chữ đệm, đề từ đều là dữ liệu của dòng họ, sửa được và phải truy được). Bản trước
       25/08 của dòng này nói `entity` "cố ý không có `'clan'`" — đúng lúc viết, sai từ 5-8.
    2. `markNotificationSeen` (`core/identity/ops.ts`) đặt `seenAt`. Đây là sổ giao nhận, không
       phải sự kiện phả hệ: `revision.entity` cũng không có `'notification'`, và AD-15 giữ bản
       thân sự kiện bất biến — chỉ dấu "đã đọc" đổi.
  - Thêm ngoại lệ mới ⇒ sửa `revision.entity` ở **cả hai** nơi khai nó — `db/schema/domain.ts`
    và `core/revision.ts` — cộng mục này, kèm lý do. Hai chỗ vì tầng schema và tầng ghi khai
    riêng; sửa một chỗ thì `tsc` bắt, nhưng chỉ ở nơi gọi, không ở đây.
- **Bán kính riêng tư** (AD-13/21): mặc định — trong 3 bậc (đường máu + hôn nhân) thấy đủ; ngoài:
  người sống chỉ tên + vị trí + NĂM sinh (không ngày/tháng), ẩn liên hệ; vị thành niên chặt hơn;
  `hiddenFromPublic` ⇒ với khách/ngoài bán kính, ẩn cả tên (giữ chỗ "một người con") — vẫn giữ
  liên kết phả hệ. Người đã khuất: đầy đủ với mọi người xem. Cái ngoài bán kính KHÔNG rời server.
- **Tên so khớp**: qua `chuanHoa`/`boDau` của `core/so-khop` + cột `person.nameFolded`.
  Không `ILIKE` trần trên cột tên (AD-16).
- **Không cache thứ phụ thuộc người xem** (AD-23): route đọc dữ liệu phả = dynamic. KHÔNG dùng
  `'use cache'` (project chưa bật cacheComponents — xem next16-delta.md).
- **Không hard-code "Nguyễn Quang"** trong core/db — đọc từ `clan.settings` (AD-14).
- Core code + identifier tiếng Anh; UI component/file tiếng Việt (nếp có sẵn `components/pha/`).
- Date phả hệ = `{ date?, precision }`. Không đoán mò thành timestamp.

## UI — luật cứng (bề mặt A trừ khi ghi khác)

- Sàn chữ **17px**, tối thiểu tuyệt đối 15px, vùng chạm 44px, tương phản ≥ 4.5:1.
- **Không xưng hô, kể cả "bạn"** — bỏ chủ ngữ hoặc dùng "mình". Cấm từ công nghệ trên bề mặt A.
- Son `#A8322A` = "đã chốt" duy nhất; cảnh báo = chàm `#2E4B6B`; không đổ bóng; không opacity
  cho tồn nghi (nét đứt + vân chéo, chữ ĐẬM bằng node thường).
- Token qua class Tailwind từ `app/globals.css @theme` — không hex trần trong JSX.
- Khung bề ngang: dùng `DOC`/`KHUNG`/`RONG` từ `components/pha/khung.ts`.
- Cây: qua `components/pha/cay-tai-dong.tsx` (dynamic import theo breakpoint) — phục sinh từ
  git `8fd4af1^` nếu file chưa có. KHÔNG import thẳng thư viện cây vào page.
- Prototype cũ của 15 màn nằm ở commit `8fd4af1^` (`git show 8fd4af1^:app/uiworkshop/<slug>/page.tsx`)
  — phục sinh làm nền rồi promote ra route thật, thay mock bằng core.
- Mock seed cũ: `app/uiworkshop/_mock/seed.ts` — CHỈ còn dùng cho màn trong `/uiworkshop`.

## Bản đồ route production (Phase 2 dựng)

```
app/(pha)/…                 bề mặt A: ThanhDieuHuong đáy (mobile) / đỉnh (md+), nền giấy dó.
                            ⚠ CHƯA có layout.tsx — mỗi trang tự import ThanhDieuHuong, đúng
                            cái nếp mà story 5-1 đã dẹp ở bề mặt B. Nợ, không phải thiết kế.
app/(pha)/page.tsx          2-1 trang chủ  (promote từ uiworkshop/trang-chu)
app/(pha)/gia-pha/page.tsx  6-10 Phả quanh mình (đã gắn chỗ) · 2-6 chi đầu (guest / chưa gắn)
app/(pha)/gia-pha/ca-toc/page.tsx        2-6 tầng 1
app/(pha)/gia-pha/chi/[id]/page.tsx      2-6 tầng 2 theo chi
app/(pha)/gia-pha/duong-cua-toi/page.tsx 2-6 tầng 3
app/(pha)/nguoi/[id]/page.tsx            2-7 trang một người
app/(pha)/tim?q=                         2-4 tìm + không-tìm-thấy
app/(pha)/them/…                         2-3/2-5 tự khai 4 bước + thêm người thân
app/(pha)/loi-ke/…                       2-8 thu lời kể
app/(pha)/toi/page.tsx                   2-9 trang Tôi (FR-55)
app/dang-nhap/page.tsx  app/gan-node/…   2-2 (bề mặt A, khung DOC)
app/admin/layout.tsx + 8 màn            3-1…3-4, 5-1…5-8 (bề mặt B — khung trần, desktop)
lib/ghi-pha.ts                          ruột chung của mọi lối ghi/đọc hồ sơ — hai `actions.ts`
                                        (`admin/cay` · `(pha)/gia-pha`) chỉ là vỏ 'use server'
app/admin/[...khong-co-man]/             bẫy 404 để app/admin/not-found.tsx chạy được
app/api/auth/[...all]/route.ts           1-4 Better Auth handler
app/api/media/…                          1-5 upload + stream có token thời hạn
```

`app/uiworkshop` giữ nguyên làm xưởng (đã có cổng notFound production trong layout — kiểm lại).

## Trạng thái story

`_bmad-output/implementation-artifacts/sprint-status.yaml` — cập nhật khi story xong.
Story spec: `_bmad-output/planning-artifacts/epics/epics.md`.
