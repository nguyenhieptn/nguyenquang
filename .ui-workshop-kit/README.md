# UI Workshop Kit

Xưởng dựng thử giao diện cho project **Next.js + BMAD**: chỗ để UX render prototype **bằng chính
stack thật** (React + shadcn/ui + token của bạn, chỉ khác là mock data), và dev **tham chiếu rồi
promote** ra route thật — thay vì mock HTML tĩnh vứt đi.

Kèm sẵn wiring cho BMAD v6: override `bmad-ux` để prototype đổ thẳng vào xưởng, cây story đọc
**sống** từ `sprint-status.yaml`, và **cổng chặn ship** (route 404 ở production).

## Xưởng có hai trục

| Trục | Trả lời | Nguồn |
|---|---|---|
| **Nhóm màn → FR → view** | “Màn này thuộc yêu cầu nào?” | `_registry/outline.ts` (bạn viết, từ PRD) |
| **Luồng** — bản đồ hành trình zoom/pan | “**Sau màn này là màn nào?**” | `_registry/flows.ts` (từ `EXPERIENCE.md § Key Flows`) |

Trục thứ hai là thứ hiếm: mỗi node là **prototype thật nhúng qua iframe**, cạnh mang chip trigger
(hành vi đưa tới bước sau), bước chưa dựng hiện thành **ô trống có tên** — lỗ hổng tự lộ ra thay vì
im lặng nằm trong văn xuôi.

## Cắm vào project

```bash
npx degit nguyenhieptn/ui-workshop-kit .ui-workshop-kit

node .ui-workshop-kit/kit.mjs doctor     # kiểm tiền đề, không ghi gì
node .ui-workshop-kit/kit.mjs install    # cắm
npm run dev                              # mở /uiworkshop
```

Cần: **Next.js App Router** (`app/` ở gốc repo) · TypeScript · **Tailwind v4** (CSS-first) ·
**shadcn/ui** với alias `@/*` · BMAD v6 (tuỳ chọn — thiếu thì chỉ mất cây story động).

Token thì **không cần chuẩn bị gì**: vỏ xưởng chỉ gọi token trung tính `ws-*` và kit tự mang bảng
mặc định; muốn mang màu brand thì sửa vế phải của 16 dòng trong `app/uiworkshop/tokens.css`.

## Nâng cấp về sau

```bash
node .ui-workshop-kit/kit.mjs upgrade --dry
```

Kit ghi **baseline sha** lúc cắm, nên `upgrade` cập nhật thẳng những file bạn chưa động, và **không
đè** file bạn đã sửa (in sẵn lệnh `git diff` để tự trộn). File khung (`_registry/*`, `seed`,
`design-system`) không bao giờ bị đè; khi khung đổi ở upstream, kit tăng `shapeRev` và báo bạn soát.

---

**Hướng dẫn đầy đủ: [`SETUP.md`](SETUP.md)** — ba lớp và luật của chúng, hai điểm cấu hình bắt buộc,
checklist viết ruột theo project, và bốn cái bẫy đã trả giá thật (đọc trước khi sửa plumbing).

Kit sinh ra từ [iSMART](https://github.com/nguyenhieptn/ismart) (ICTU Smart Campus) và được đồng bộ
từ xưởng đang chạy ở đó — xem `SETUP.md §8`.
