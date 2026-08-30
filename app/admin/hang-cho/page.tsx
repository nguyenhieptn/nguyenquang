/**
 * HÀNG CHỜ DUYỆT LÊN TẦNG CHÍNH THỨC — bề mặt B (story 3-3, FR-3 · FR-1 · FR-2 · FR-64).
 *
 * Promote từ prototype `8fd4af1^:app/uiworkshop/hang-cho-duyet/page.tsx` — mock thay bằng
 * core/assertion.listPendingAssertions. Khác prototype một điểm cấu trúc: API thật trả TỪNG
 * KHẲNG ĐỊNH (đúng đơn vị của promoteAssertion/rejectAssertion), không gom theo người —
 * nên một dòng = một khẳng định, và hành động đứng trên từng dòng.
 *
 * Spine chi phối màn này:
 *   · EXPERIENCE.md § Information Architecture › Bề mặt B — "Hàng chờ duyệt lên Tầng chính thức"
 *   · EXPERIENCE.md § Bề mặt B — sàn chữ 17px vẫn áp nguyên; bảng chật thì BỚT CỘT, không thu chữ
 *   · DESIGN.md § Colors › Bề mặt B (khung trần, dữ liệu phả giữ chất liệu)
 *
 * ── HIỂU NHẦM PHẢI CHẶN NGAY Ở ĐẦU MÀN ──────────────────────────────────────────────────────
 * "Hàng chờ" trong hầu hết phần mềm nghĩa là: nằm đây thì chưa ai thấy. Ở đây thì **ngược lại**
 * — FR-3 chốt mọi khẳng định vào thẳng Tầng tồn nghi và hiện ngay, không chờ duyệt. Những điều
 * trong bảng này ĐÃ ở trên cây, con cháu đã nhìn thấy.
 *
 * Duyệt ở đây không phải "cho phép xuất hiện" mà là NÂNG MỨC: từ điều dòng họ ghi lại thành
 * điều dòng họ đã đối chiếu. Hiểu nhầm chiều này thì người vận hành duyệt vội để "mở khoá" —
 * và Tầng chính thức mất nghĩa ngay tuần đầu.
 *
 * Prototype lập luận không có nút từ chối vì "từ chối một NGƯỜI đã đứng trên cây là xoá họ".
 * Với đơn vị là KHẲNG ĐỊNH thì khác: trả lại một khẳng định không xoá ai — nó gỡ đúng một câu
 * khỏi dữ liệu đang bày, toàn văn nằm nguyên trong nhật ký (AD-4). Nên màn này có "Trả lại",
 * bắt buộc kèm ghi chú lý do.
 *
 * ── HÀNH TRÌNH CỦA MÀN NÀY (nợ tài liệu của 3-3, trả 27/08/2026 — story 6-8) ────────────────
 * Từ 3-3 tới 6-8, đầu file này mang một dòng nợ: *"hành trình gốc của việc duyệt (UJ-3) đã mất;
 * màn dựng từ § IA, không từ một hành trình có thật."* Hành trình nay CÓ, từ lượt bấm thật đầu
 * tiên trên phả sạch (26/08/2026):
 *
 *   > "Cách duyệt thông tin vào cây đang khá phức tạp — nên hiện all của một người rồi duyệt
 *   > một thể, duyệt từng nội dung thông tin rất nhiều mục."
 *
 * Đơn vị **chú ý** của người vận hành là CON NGƯỜI: họ đọc xong một người thì quyết xong một
 * người. Đơn vị **hành động** của hệ vẫn là KHẲNG ĐỊNH (AD-9) — `promoteAssertion` nâng đúng một
 * câu. Màn này là chỗ hai đơn vị ấy gặp nhau, và `components/admin/gom-hang-cho.ts` là phép nối.
 *
 * Chỗ khó nằm ở đó chứ không ở việc gom: hai khẳng định cùng một loại ĐƠN TRỊ về cùng một người
 * không thể cùng lên Tầng chính thức, nên gộp chúng vào một lượt là để MÁY chọn hộ bằng thứ tự
 * lặp. Cụm ấy vì thế đứng ngoài lượt duyệt cả nhóm, và `duyetHangLoat` (`actions.ts`) gác lại
 * một lần nữa ở ranh giới của lượt — vì màn có ba lối tới đó, không phải một.
 */
import type { Metadata } from 'next';
import { tieuDeThe } from '@/components/admin/man-admin';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  listHiddenAssertions,
  listPendingAssertions,
  type HiddenAssertion,
  type PendingAssertion,
} from '@/core/assertion';
import { DON_TRI, HANG, NHAN } from '@/core/person';
import { gomTheoNguoi } from '@/components/admin/gom-hang-cho';
import { Button } from '@/components/ui/button';
import { BangChoDuyet, type DongChoDuyet } from './bang-cho-duyet';
import { khoiPhucKhangDinh } from './actions';

// AD-23: hàng chờ phụ thuộc người xem (vai duyệt) và đổi theo từng mutation — không cache.
export const dynamic = 'force-dynamic';


export const metadata: Metadata = { title: tieuDeThe('hang-cho') };
// ── Câu tiếng Việt đọc được cho từng loại khẳng định ─────────────────────────────────────────
// Người vận hành quyết trên một CÂU, không phải trên một cặp (kind, value) thô.

type GiaTriNgay = { date?: string; precision?: 'exact' | 'year' | 'approximate' | 'unknown' };

function cauNgay(v: GiaTriNgay, viec: 'sinh' | 'mất'): string {
  if (!v.date || v.precision === 'unknown') return viec === 'sinh' ? 'năm sinh chưa rõ' : 'năm mất chưa rõ';
  const [nam, thang, ngay] = v.date.split('-');
  if (v.precision === 'exact' && thang && ngay) return `${viec} ngày ${ngay}/${thang}/${nam}`;
  if (v.precision === 'approximate') return `${viec} khoảng năm ${nam}`;
  return `năm ${viec} ${nam}`;
}

/** Ba vai của FR-65 §5b — màn này chỉ nói được VAI, vì PendingAssertion không mang nơi. */
const VAI_NOI: Record<string, string> = {
  'que-quan': 'quê quán',
  'tru-quan': 'trú quán',
  'an-tang': 'nơi an táng',
};

function cauKhangDinh(kind: string, value: unknown): string {
  const v = (value ?? {}) as Record<string, unknown>;
  switch (kind) {
    case 'name':
      return `tên là ${String(v.fullName ?? '')}`;
    case 'gender':
      return `giới tính: ${v.gender === 'male' ? 'nam' : v.gender === 'female' ? 'nữ' : 'khác'}`;
    case 'birth':
      return cauNgay(v as GiaTriNgay, 'sinh');
    case 'death':
      return cauNgay(v as GiaTriNgay, 'mất');
    case 'parent-child': {
      const nhan =
        v.relation === 'adopted' ? 'con nuôi' : v.relation === 'heir' ? 'con thừa tự' : 'con ruột';
      // TODO(core): listPendingAssertions chưa bày objectPersonId/tên cha mẹ, nên chưa viết
      // được "là con của Nguyễn Văn A". Tạm trỏ sang trang người để đối chiếu.
      return `là ${nhan} của một người đã ghi trong phả`;
    }
    case 'union-partner':
      return 'có vợ/chồng đã ghi trong phả';
    case 'note':
      return `ghi chú: “${String(v.text ?? '')}”`;
    case 'place': {
      // KHÔNG có tên nơi ở đây: `PendingAssertion` không mang `placeId`. Nói đúng những gì biết,
      // và mời mở màn cây để xem — thà thiếu còn hơn bịa ra một cái tên.
      const vai = VAI_NOI[String(v.role ?? '')] ?? 'nơi';
      return `${vai} (mở màn cây để xem nơi cụ thể)`;
    }
    default:
      return `khẳng định loại ${kind}`;
  }
}

function luc(iso: string): string {
  const d = new Date(iso);
  const ngay = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
  const gio = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(d);
  return `${gio} · ${ngay}`;
}

function raDong(m: PendingAssertion): DongChoDuyet {
  return {
    assertionId: m.assertionId,
    personId: m.personId,
    personName: m.personName,
    kind: m.kind,
    cau: cauKhangDinh(m.kind, m.value),
    tinCay: m.confidence,
    nguon: m.sourceDescription.trim() || 'không ghi rõ nguồn',
    nguoiKhai: m.createdByName,
    luc: luc(m.createdAt),
    // Mốc THÔ để xếp — `luc()` ở trên đã định dạng cho mắt và không so sánh được.
    lucISO: m.createdAt,
  };
}

export default async function Page() {
  const [ketQua, daAnKq] = await Promise.all([listPendingAssertions(), listHiddenAssertions()]);

  if (!ketQua.ok) {
    if (ketQua.error.code === 'unauthenticated') redirect('/dang-nhap');
    if (ketQua.error.code === 'unattached') {
      // EXPERIENCE.md § State Patterns: hành động ghi dẫn về luồng gắn node, KHÔNG phải màn lỗi.
      return (
        <>
          <p className="max-w-[70ch] text-[17px]">
            Tài khoản chưa gắn vào một người trong phả. Gắn xong — và có vai quản trị hoặc đầu
            mối chi — thì bàn làm việc mở ra ở đây.
          </p>
          <Button asChild variant="outline" className="mt-5 h-11 text-[17px]">
            <Link href="/gan-node">Gắn vào người của mình trong phả</Link>
          </Button>
        </>
      );
    }
    // forbidden (và các mã còn lại): vắng lặng lẽ, không băng-rôn lỗi.
    return (
      <p className="max-w-[70ch] text-[17px] text-muted-foreground">
        Admin chỉ mở cho quản trị và đầu mối chi.
      </p>
    );
  }

  const dong = ketQua.value.map(raDong);
  /**
   * Gom ở SERVER, không ở client (story 6-8): luật `DON_TRI`/`HANG` sống trong core, và một
   * client component không được import giá trị từ `@/core/*` — chuỗi phụ thuộc kéo `pg` vào bó
   * trình duyệt (`Can't resolve 'dns'`, đã vấp ở 6-7). Phép gom là thuần nên chạy ở đâu cũng
   * được; chạy ở đây thì luật chỉ có một bản.
   */
  const nhom = gomTheoNguoi(dong, { donTri: DON_TRI, thuTuLoai: HANG });
  // Khu "đã ẩn theo báo cáo" (AD-17) — đọc hỏng thì khu vắng lặng, không hỏng cả màn.
  const daAn: HiddenAssertion[] = daAnKq.ok ? daAnKq.value : [];

  return (
    <>
      {/* Câu chặn hiểu nhầm — đứng ngay dưới tiêu đề, trước cả con số. Xem đầu file. */}
      <p className="max-w-[70ch] text-[17px]">
        {dong.length} khẳng định đang ở <strong>Tầng tồn nghi</strong>. Tất cả{' '}
        <strong>đã hiện trên cây</strong> — duyệt không phải để cho chúng xuất hiện.
      </p>
      <p className="mt-1.5 max-w-[70ch] text-[17px] text-muted-foreground">
        Duyệt là <strong>nâng mức</strong>: từ điều dòng họ ghi lại thành điều dòng họ đã đối
        chiếu được. Chưa đối chiếu thì để nguyên — để nguyên không làm ai mất gì.
      </p>

      {dong.length === 0 ? (
        <p className="mt-8 max-w-[70ch] text-[17px] text-muted-foreground">
          Không còn khẳng định nào chờ duyệt. Khi có người khai thêm, dòng mới hiện ra ở đây.
        </p>
      ) : (
        <BangChoDuyet dong={dong} nhom={nhom} nhanLoai={NHAN} />
      )}

      {/* ── ĐÃ ẨN THEO BÁO CÁO (AD-17) — khu RIÊNG, dưới hàng chờ ─────────────────────────
          Một báo cáo là ẩn ngay, không cần duyệt; khôi phục mới cần quyền. Khu này tách hẳn
          khỏi bảng chờ: ẩn không phải một trạng thái chờ duyệt — nó là một phán quyết tạm
          của cộng đồng đang đợi người có quyền soát lại. */}
      {daAn.length > 0 && (
        <section className="mt-12 border-t border-ban-vien pt-8">
          <h2 className="text-[19px] font-semibold">Đã ẩn theo báo cáo</h2>
          <p className="mt-1.5 max-w-[70ch] text-[17px] text-muted-foreground">
            {daAn.length} khẳng định đang ẩn khỏi cây vì có người trong họ báo. Toàn văn vẫn
            trong nhật ký. Khôi phục là đưa trở lại cây, ở đúng tầng cũ.
          </p>
          <ul className="mt-5 grid gap-3">
            {daAn.map((a) => (
              <li key={a.assertionId} className="rounded-md border border-ban-vien bg-ban-o px-5 py-4">
                <p className="text-[17px]">
                  <Link
                    href={`/nguoi/${a.personId}`}
                    className="font-[family-name:var(--font-pha)] font-semibold underline-offset-4 hover:underline"
                  >
                    {a.personName}
                  </Link>{' '}
                  — {a.valueText}
                </p>
                <p className="mt-1 text-[15px] text-muted-foreground">
                  {a.createdByName} khai · {luc(a.createdAt)}
                  {a.hiddenByName ? <>{' · '}{a.hiddenByName} báo</> : null}
                  {a.hiddenReason && (
                    <>
                      {' · '}lý do: <em className="break-words">{a.hiddenReason}</em>
                    </>
                  )}
                </p>
                <form action={khoiPhucKhangDinh.bind(null, a.assertionId)} className="mt-3">
                  <Button type="submit" variant="outline" className="h-11 text-[17px]">
                    Khôi phục
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Ai được duyệt — FR-64. Không phải chú thích: một bảng duyệt không nói rõ vai thì
          người mở nó ra không biết mình có quyền hay không, và bấm thử. */}
      <p className="mt-10 max-w-[70ch] text-[17px] text-muted-foreground">
        Chỉ quản trị và đầu mối chi nâng được mức. Mọi lần nâng, mọi lần trả lại đều vào nhật
        ký sửa, mang tên người quyết.
      </p>
    </>
  );
}
