/**
 * `/admin/duyet-vao-pha` — người xin nhận một chỗ trong phả (FR-64, story 5-5).
 *
 * ── Vì sao màn này phải tồn tại ──────────────────────────────────────────────────────────
 * `listPendingAttachments` và `approveAttachment` có trong `core/` từ Đợt 1 và **không màn nào
 * gọi**. Người trong họ bấm "đây là tôi" rồi nằm `pending` vĩnh viễn. Luồng FR-64 đứt trên
 * production, không phải vì thiếu logic mà vì thiếu một cái màn.
 *
 * ── Màn này và cây bày CÙNG một việc theo hai lối ────────────────────────────────────────
 * Cây bày **chỗ** — người ấy đang nhận node nào, đứng ở đâu trong họ. Màn này bày **danh sách** —
 * cho người muốn xử một lượt năm yêu cầu vào sáng thứ Bảy. Hai lối cho hai nhịp làm việc; cùng
 * gọi một core, cùng dùng chung `ThaoTacXinVaoPha` nên không trôi thành hai luật.
 *
 * `<h1>` do layout dựng.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { tieuDeThe } from '@/components/admin/man-admin';
import { listPendingAttachments } from '@/core/identity';
import { DanhSachXin } from './danh-sach-xin';

export const metadata: Metadata = { title: tieuDeThe('duyet-vao-pha') };
export const dynamic = 'force-dynamic';

export default async function DuyetVaoPhaPage() {
  const ds = await listPendingAttachments();

  if (!ds.ok) {
    // `forbidden` ở đây là trạng thái thật, không phải trục trặc: vai khác vẫn vào được đường dẫn.
    return (
      <p className="max-w-[70ch] text-[17px] text-muted-foreground">
        {ds.error.code === 'forbidden'
          ? 'Chỉ quản trị và đầu mối chi mới duyệt được người vào phả.'
          : ds.error.message}
      </p>
    );
  }

  if (ds.value.length === 0) {
    return (
      <>
        <p className="max-w-[70ch] text-[17px] text-muted-foreground">
          Chưa ai đang xin nhận chỗ trong phả. Khi có người bấm <em>đây là tôi</em> ở trang nhận
          node, yêu cầu của họ hiện ở đây và trên cây.
        </p>
        <Link
          href="/admin/cay"
          className="mt-5 inline-flex min-h-11 items-center text-[17px] underline underline-offset-4"
        >
          Về cây gia phả
        </Link>
      </>
    );
  }

  return (
    <>
      <p className="max-w-[70ch] text-[17px] text-muted-foreground">
        Mỗi dòng là một tài khoản đang nhận một chỗ có sẵn trong phả — không phải một người mới.
        Nhận là trao quyền ghi và mở bán kính riêng tư quanh chỗ ấy.
      </p>
      <DanhSachXin
        muc={ds.value.map((r) => ({
          attachmentId: r.attachmentId,
          personId: r.personId,
          personName: r.personName,
          luc: new Date(r.requestedAt).toLocaleDateString('vi-VN'),
        }))}
      />
    </>
  );
}
