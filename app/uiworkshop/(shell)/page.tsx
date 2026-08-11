import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { FLOWS, gapCount } from "../_registry/flows";
import {
  FOUNDATION,
  PLANNED_REQS,
  REQ_GROUPS,
  SECTIONS,
} from "../_registry/outline";
import { readStoryIndex } from "../_registry/sprint";

/**
 * Tổng quan xưởng — điều hướng nằm ở sidebar (outline theo REQUIREMENT). Trang này chỉ tóm tắt
 * sống: bao nhiêu FR đã có màn, bao nhiêu màn đã dựng, story truy vết đã done bao nhiêu.
 */
export default async function UiWorkshopHome() {
  const stories = await readStoryIndex();
  const builtViews =
    FOUNDATION.length + REQ_GROUPS.reduce((n, g) => n + g.views.length, 0);

  // Story done trong tổng số story được một view nào đó truy vết (mẫu số có nghĩa: story "có mặt").
  const tracedSlugs = new Set(
    [...FOUNDATION, ...REQ_GROUPS.flatMap((g) => g.views)].flatMap(
      (v) => v.storySlugs ?? [],
    ),
  );
  const traced = [...tracedSlugs].map((s) => stories[s]).filter(Boolean);
  const done = traced.filter((m) => m?.status === "done").length;

  const flowGaps = FLOWS.reduce((n, f) => n + gapCount(f), 0);

  const stats: { n: string; label: string }[] = [
    { n: String(REQ_GROUPS.length), label: "nhóm yêu cầu" },
    { n: String(builtViews), label: "màn dựng thử" },
    { n: String(PLANNED_REQS.length), label: "FR chưa dựng" },
    { n: `${FLOWS.length}`, label: `luồng · ${flowGaps} bước hụt` },
    { n: `${done}/${traced.length}`, label: "story truy vết done" },
  ];

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <div className="grid gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-ws-ink">
          Xưởng giao diện
        </h1>
        <p className="max-w-2xl text-ws-body">
          Sidebar bên trái là <strong>outline của sản phẩm</strong>, ba tầng{" "}
          <strong>bề mặt → FR → view</strong>: Nền tảng ·{" "}
          {SECTIONS.map((s) => s.label).join(" · ")}. Mỗi màn dựng bằng chính
          stack thật (mock data); chọn một mục để xem ngay trong khu làm việc ở
          khung <strong>Mobile</strong> hoặc <strong>Web</strong> (switch ở
          thanh trên — xưởng <strong>nhớ lựa chọn theo từng màn</strong>).{" "}
          <strong>Chấm bên phải</strong> mỗi view là trạng thái các{" "}
          <strong>story truy vết</strong>, đọc sống từ{" "}
          <code className="font-mono text-sm">sprint-status.yaml</code> — di
          chuột để xem chi tiết.
        </p>
        <p className="max-w-2xl text-ws-body">
          Trên cùng sidebar là trục thứ hai: <strong>Luồng</strong>. Outline trả
          lời “màn này thuộc yêu cầu nào”; luồng trả lời “
          <strong>sau màn này là màn nào</strong>” — mỗi luồng mở ra một{" "}
          <strong>bản đồ zoom được</strong>, node là màn thật, cạnh mang{" "}
          <strong>chip trigger</strong>; bấm chip là bản đồ bay tới bước kế
          tiếp. Bước nào chưa có màn thì hiện ô trống — lỗ hổng tự lộ ra thay vì
          im lặng.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardBody>
              <div className="font-mono text-2xl font-bold tabular-nums text-ws-ink-strong">
                {s.n}
              </div>
              <div className="text-sm text-ws-n-60">{s.label}</div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardBody>
          <CardTitle>Vì sao tổ chức theo yêu cầu, không theo story</CardTitle>
          <ul className="grid gap-1.5 text-sm text-ws-body">
            <li>
              <strong>User story quá nhỏ để là một view</strong> — nhiều story
              cùng thao tác trên một màn. Nên trục chính là{" "}
              <strong>requirement (FR)</strong>: mỗi FR là một feature có một
              hay nhiều view.
            </li>
            <li>
              <strong>Story tụt xuống thành nhãn truy vết</strong> dưới view
              (chip id + trạng thái sống). Không còn “dòng story trống” — story
              hạ tầng/quy trình (scaffold, field-test, spike) không đẻ ra một
              dòng điều hướng.
            </li>
            <li>
              <strong>Gom theo BỀ MẶT trước, FR sau</strong> — khách (app-shell
              mobile) và CMS (dashboard-shell) là hai chuẩn chrome khác nhau, để
              chung một danh sách phẳng thì không quét được. FR nào chưa có màn
              thì nằm ở mục <strong>FR chưa dựng</strong> cuối sidebar.
            </li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
