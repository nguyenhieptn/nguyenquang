# Kiểm chứng phiên bản — ARCHITECTURE-SPINE.md

**Đối tượng:** `architecture-gia-pha-nguyen-quang-2026-08-10/ARCHITECTURE-SPINE.md`, mục **Stack** (dòng 151-165) và mục **Deferred** (dòng 230-240).
**Ngày kiểm:** 2026-08-10, dựa trên tra cứu web (npm registry, GitHub, trang chính thức) — không dựa vào trí nhớ mô hình.

## Phán quyết một câu

Bảy trong chín dòng của Stack đúng với thực tế tại ngày 2026-08-10, nhưng dòng **TypeScript 5.x** đã lạc hậu hai thế hệ (thực tế: TypeScript 7.0 GA, native compiler) và dòng **Auth.js — current stable** che giấu một sự kiện quan trọng (dự án đã chuyển giao cho đội Better Auth và vào chế độ bảo trì, còn nhánh v5/Auth.js chính nó vẫn ở beta chưa từng ra bản ổn định) — cả hai cần sửa hoặc chú thích rõ trước khi dùng làm căn cứ xây dựng.

## Sai lệch tìm được

| # | Mục trong spine | Spine ghi | Thực tế xác minh (2026-08-10) | Nguồn |
| --- | --- | --- | --- | --- |
| 1 | TypeScript | `5.x` | **Sai / lạc hậu.** Bản ổn định mới nhất là **TypeScript 7.0.2** (GA ngày 08/07/2026), trình biên dịch được viết lại bằng Go ("Project Corsa"), nhanh hơn ~10 lần khi type-check. TypeScript 6.x chưa từng ra bản ổn định (`6.0.0-beta` là dist-tag `beta` hiện tại — dự án nhảy thẳng 5.x → 7.0 GA). Lưu ý: TS 7.0 **chưa có Programmatic API ổn định** (dự kiến ở 7.1, ~10/2026) — có thể ảnh hưởng tool nào trong stack dựa vào TS Compiler API (vd. một số plugin/kit). | npm registry dist-tags (`latest: 7.0.2`, `beta: 6.0.0-beta`, `rc: 7.0.1-rc`); [Announcing TypeScript 7.0 — Microsoft DevBlogs](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/); [TypeScript 7.0 Now Stable — TechTimes](https://www.techtimes.com/articles/320049/20260710/typescript-7-now-stable-10-faster-builds-not-vue-svelte-yet.htm); [InfoQ](https://www.infoq.com/news/2026/08/typescript-7-released/) |
| 2 | Auth.js | `current stable` | **Gây hiểu nhầm, cần chú thích.** (a) Trên npm, gói vẫn tên `next-auth`; dist-tag `latest` trỏ tới **4.24.15** (dòng v4, tên cũ NextAuth, coi là LTS). (b) Nhánh mang thương hiệu "Auth.js" (v5) **chưa bao giờ ra bản ổn định** — vẫn nằm ở dist-tag `beta` (**5.0.0-beta.32**), đã beta nhiều năm (có hẳn thảo luận GitHub "How many more years of beta releases for v5?"). Gói lõi framework-agnostic `@auth/core` cũng vẫn ở 0.x (**0.41.3**), chưa 1.0. (c) Quan trọng hơn: đội Auth.js đã **chuyển giao dự án cho đội Better Auth**, Auth.js hiện ở **chế độ bảo trì** (chỉ vá bảo mật/lỗi khẩn, không phát triển tính năng mới); Better Auth khuyến nghị dự án mới nên bắt đầu bằng Better Auth thay vì Auth.js. Vẫn được bảo trì (có bản vá bảo mật tháng 7/2026 cho cả v4 và v5-beta), nhưng "current stable" không mô tả đúng tình trạng — nên viết rõ là dùng v4 (LTS, bảo trì) hay v5-beta (bảo trì, chưa GA), và nên cân nhắc Better Auth như một lựa chọn. | npm dist-tags cho `next-auth` và `@auth/core`; [Auth.js is now part of Better Auth — Better Auth blog](https://better-auth.com/blog/authjs-joins-better-auth); [GitHub Discussion #13252](https://github.com/nextauthjs/next-auth/discussions/13252); [Auth.js security update: July 2026 — Better Auth blog](https://better-auth.com/blog/security-update-july-2026); [GitHub Discussion #13382 — "How many more years of beta releases for v5?"](https://github.com/nextauthjs/next-auth/discussions/13382) |

Không tìm thấy sai lệch phiên bản ở các dòng còn lại — xem bảng xác nhận bên dưới.

## Bảng xác nhận từng công nghệ

| Công nghệ | Spine ghi | Kết quả tra cứu | Trạng thái |
| --- | --- | --- | --- |
| PostgreSQL | 18.4 | **Đúng, là bản ổn định mới nhất của nhánh 18** (phát hành 14/05/2026, vá 11 lỗ hổng bảo mật + hơn 60 bug). PostgreSQL 19 mới chỉ ở **Beta 2** (16/07/2026), bản chính thức dự kiến khoảng 09-10/2026 — 18.4 vẫn là lựa chọn đúng cho production hiện tại. | Khớp thực tế |
| Next.js | 16.3.0 | Khớp chính xác dist-tag `latest` trên npm registry. | Khớp thực tế |
| React | 19.2.8 | Khớp chính xác dist-tag `latest` trên npm registry. | Khớp thực tế |
| Tailwind CSS | 4.3.3 | Khớp chính xác dist-tag `latest` trên npm registry. | Khớp thực tế |
| Drizzle ORM | 0.45.2 | Khớp chính xác dist-tag `latest` trên npm registry (dòng 0.x vẫn là bản ổn định dùng production). Nhánh **1.0 đã qua beta, hiện ở release-candidate (dist-tag `rc: 1.0.0-rc.4`)** — RC1 ra ngày 30/04/2026, có Effect v4 support và JIT row mappers; chưa có ngày GA công bố chính thức. Đáng theo dõi nhưng chưa cần chuyển. | Khớp thực tế; ghi chú thêm về RC |
| TypeScript | 5.x | Xem sai lệch #1 ở trên. | **Sai lệch** |
| Auth.js | current stable | Xem sai lệch #2 ở trên. | **Gây hiểu nhầm** |
| Cloudflare R2 | (dùng làm object storage seed) | **Còn tồn tại, tương thích S3** ("R2 exposes S3 compatible APIs"). Giá hiện hành: lưu trữ Standard $0.015/GB-tháng; Class A ops $4.50/triệu request; Class B ops $0.36/triệu request; **egress luôn miễn phí** (không tính phí băng thông ra ngoài, mọi tier). Free tier: 10 GB-tháng lưu trữ + 1 triệu Class A + 10 triệu Class B + toàn bộ egress miễn phí. | Khớp thực tế |

## Xác minh hai khẳng định trong mục Deferred

### 1. "Recursive CTE nhanh hơn Apache AGE cho duyệt cây" — có căn cứ

**Kết luận: có căn cứ, khẳng định trong spine là đúng hướng.** Nhiều benchmark độc lập cho thấy recursive CTE thuần luôn nhanh hơn Apache AGE ở mọi kích cỡ dữ liệu được thử — ví dụ một so sánh ghi nhận CTE đạt 59ms ở 32.766 node có thể tới được, trong khi truy vấn cạnh độ dài biến thiên (variable-length edge) của AGE mất 101ms cho cùng bài toán (chậm hơn ~1,5-2,5 lần). Lý do kỹ thuật: Apache AGE **không phải** một graph engine in-memory — nó lưu dữ liệu đồ thị trong các bảng heap PostgreSQL thông thường và tra cứu B-tree index theo từng bước nhảy (hop), chứ không có adjacency index-free thật sự, nên với các truy vấn nông (2-3 cấp, đúng như bài toán duyệt phả hệ của dự án này) AGE không có lợi thế cấu trúc so với CTE. Một số nguồn khác ghi nhận chênh lệch cực đoan hơn (tới 40 lần nghiêng về CTE) cho một use case cụ thể, và AGE chỉ thắng về mặt biểu đạt/dễ đọc cho truy vấn quan hệ phức tạp (upline/downline/team size), không thắng về tốc độ. → Lý lẽ "quy mô một dòng họ nhỏ hơn hai bậc độ lớn so với ngưỡng đáng dùng graph store" trong spine phù hợp với dữ liệu benchmark tìm được.

Nguồn: [PostgreSQL Showdown: Complex Joins vs. Native Graph Traversals with Apache AGE — Medium](https://medium.com/@sjksingh/postgresql-showdown-complex-joins-vs-native-graph-traversals-with-apache-age-78d65f2fbdaa); [Postgres as a Graph Database: Four Approaches Compared — Evokoa](https://evokoa.com/blog/postgres-as-a-graph-database/); [Curious Case of the Recursive CTE — Medium](https://medium.com/@krthiak/curious-case-of-the-recursive-cte-9908fccb2aad)

### 2. Apache AGE, pgvector, pg_search có thể cài thêm sau mà không cần migrate dữ liệu — đúng

**Kết luận: đúng**, với một điều kiện cần nêu rõ. Cả ba đều là **PostgreSQL extension** cài bằng `CREATE EXTENSION` vào một database đang chạy — không có bước "migrate dữ liệu" nào bắt buộc, vì chúng chỉ thêm kiểu dữ liệu/hàm/index mới bên cạnh schema hiện có (pgvector thêm kiểu `vector` và toán tử tương tự; Apache AGE thêm catalog đồ thị riêng dùng chung storage layer của Postgres qua bảng heap thông thường; pg_search/ParadeDB tương tự bằng BM25 index). Bảng existing không cần đổi cấu trúc để các extension này hoạt động — chỉ cần thêm cột/bảng mới nếu muốn dùng chúng.

Điều kiện cần nêu: (a) **cần quyền cài đặt package ở cấp OS/container** trước khi `CREATE EXTENSION` — pgvector thường có sẵn qua PGDG apt repo (`postgresql-18-pgvector`), còn Apache AGE thường phải **build từ source** (cần `build-essential`, `postgresql-server-dev-18`) vì ít khi có sẵn binary cho mọi phiên bản Postgres, nên "cài thêm sau" có chi phí vận hành khác nhau giữa hai extension — không nặng bằng migrate dữ liệu nhưng không hoàn toàn "chỉ một câu lệnh" như pgvector. (b) Yêu cầu quyền superuser hoặc `pg_read_server_files`-cấp để load extension trên self-hosted VPS (đúng bối cảnh dự án) — không phải vấn đề trên managed Postgres có allowlist. Với bối cảnh VPS tự quản của dự án này, cả hai đều khả thi mà không cần dump/restore hay đổi schema hiện có.

Nguồn: [pgvector GitHub](https://github.com/pgvector/pgvector); [Combining pgvector and Apache AGE — Microsoft Tech Community](https://techcommunity.microsoft.com/blog/adforpostgresql/combining-pgvector-and-apache-age---knowledge-graph--semantic-intelligence-in-a-/4508781); [GraphRAG in Postgres: Apache AGE + pgvector on Postgres 16 — Yonk Labs](https://yonk.dev/blog/graphrag-part2-postgres-age-pgvector/)

## Điều cần khẳng định lại theo trí nhớ (không tra cứu được / cần theo dõi thêm)

- Không tìm thấy nguồn xác nhận chính thức duy nhất cho ngày GA của Drizzle ORM 1.0 — chỉ xác nhận được nó đang ở RC (rc.4), chưa GA. Nếu spine cần con số "1.0 beta" cụ thể, thực tế hiện tại (2026-08-10) đã tiến xa hơn — đã là RC, không còn beta.
- TypeScript 7.0 GA rất mới (hai tháng trước ngày kiểm), hệ sinh thái công cụ xung quanh (ví dụ một số plugin ESLint/framework) được báo là **chưa tương thích đầy đủ** ("not for Vue or Svelte yet" theo một nguồn) — đáng kiểm tra riêng xem Next.js 16.3 / Drizzle Kit / stack cụ thể của dự án này đã tương thích TS 7 hay chưa trước khi quyết định nâng cấp từ 5.x.

## File đã ghi

`C:\Users\nguye\dev\nguyenquang\_bmad-output\planning-artifacts\architecture\architecture-gia-pha-nguyen-quang-2026-08-10\reviews\review-versions.md`
