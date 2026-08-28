/**
 * `/admin/tai-khoan` — tài khoản và vai (FR-64, story 6-2).
 *
 * ── Vì sao màn này phải tồn tại ──────────────────────────────────────────────────────────
 * `approveAttachment` nhận `role` từ Đợt 1 và KHÔNG nơi gọi nào truyền, nên mọi lượt duyệt vào
 * phả đều ra `member`. `core/identity` lại đặt `role` đúng một lần — trong chính lượt duyệt —
 * nên không có đường nào sửa lại. `docs/van-hanh.md` đã phải ghi *"nâng vai chưa có màn UI"*, và
 * cách duy nhất để có một trưởng chi là gỡ gắn rồi xin lại, với một lượt duyệt không ai gọi được.
 *
 * ── Màn này quản lý GẮN KẾT, không quản lý tài khoản (AD-8) ──────────────────────────────
 * Một tài khoản không phải một người. Quyền ghi và bán kính riêng tư tính theo NODE, và
 * `attachment` là chỗ nối hai lớp. Không một dòng nào của Better Auth bị đụng tới ở đây.
 *
 * `<h1>` do layout dựng.
 */
import type { Metadata } from 'next';
import { tieuDeThe } from '@/components/admin/man-admin';
import { listAttachments, resolveSession } from '@/core/identity';
import { vaiCuaToi } from '@/lib/vai-quan-tri';
import { BangTaiKhoan } from './bang-tai-khoan';

export const metadata: Metadata = { title: tieuDeThe('tai-khoan') };
export const dynamic = 'force-dynamic';

export default async function TaiKhoanPage() {
  const [ds, vaiCuaMinh, phien] = await Promise.all([
    listAttachments(),
    vaiCuaToi(),
    resolveSession(),
  ]);

  if (!ds.ok) {
    // `forbidden` ở đây là trạng thái thật, không phải trục trặc: vai khác vẫn vào được đường dẫn.
    return (
      <p className="max-w-[70ch] text-[17px] text-muted-foreground">
        {ds.error.code === 'forbidden'
          ? 'Chỉ quản trị và đầu mối chi mới xem được danh sách tài khoản.'
          : ds.error.message}
      </p>
    );
  }

  /**
   * Đếm quản trị đang hoạt động — để màn nói TRƯỚC vì sao một nút bị khoá, thay vì để người ta
   * bấm rồi nhận một câu lỗi. Con số này chỉ để BÀY; hàng rào thật nằm ở `setAttachmentRoleOp`,
   * và nó đếm lại trong cùng transaction với lượt ghi.
   */
  const soAdmin = ds.value.filter((r) => r.role === 'admin' && r.status === 'active').length;
  /** Tra ngược gắn kết bảo lãnh — `vouchedByAttachmentId` trỏ vào một hàng trong chính danh sách. */
  const theoId = new Map(ds.value.map((r) => [r.attachmentId, r]));

  if (ds.value.length === 0) {
    // Danh sách rỗng là một trạng thái THẬT (chưa ai gắn), không phải trục trặc — nói ra, đừng
    // để một `<ul>` trắng.
    return (
      <p className="max-w-[70ch] text-[17px] text-muted-foreground">
        Chưa có tài khoản nào gắn vào phả. Khi có người nhận chỗ của mình, yêu cầu hiện ở màn{' '}
        <strong>Duyệt vào phả</strong>, và nhận xong thì họ có mặt ở đây.
      </p>
    );
  }

  return (
    <>
      <p className="max-w-[70ch] text-[17px] text-muted-foreground">
        Mỗi dòng là một <strong>gắn kết</strong> — một tài khoản đứng tên cho một người trong phả.
        Vai đi theo gắn kết, không theo tài khoản: quyền ghi và bán kính riêng tư tính từ chỗ
        người ấy đứng trong họ.
      </p>

      <BangTaiKhoan
        vaiCuaMinh={vaiCuaMinh}
        soAdminDangHoatDong={soAdmin}
        muc={ds.value.map((r) => ({
          attachmentId: r.attachmentId,
          taiKhoan: r.accountName ?? r.accountId,
          personId: r.personId,
          personName: r.personName,
          role: r.role,
          status: r.status,
          laChinhMinh: phien?.accountId === r.accountId,
          /**
           * AI BẢO LÃNH — AC 6, và là chính thứ QĐ-2 lấy làm lý do dựng `setAttachmentRole` thành
           * phép riêng ("giữ `vouchedByAttachmentId`"). Bản đầu giữ được rồi không bày ra: trường
           * đi qua ba tầng rồi bị `map` này đánh rơi.
           */
          nguoiBaoLanh:
            (r.vouchedByAttachmentId &&
              (theoId.get(r.vouchedByAttachmentId)?.accountName ??
                theoId.get(r.vouchedByAttachmentId)?.personName)) ||
            null,
          luc: new Date(r.createdAt).toLocaleDateString('vi-VN'),
        }))}
      />
    </>
  );
}
