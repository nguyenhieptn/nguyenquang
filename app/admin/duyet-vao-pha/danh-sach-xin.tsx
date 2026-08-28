'use client';

/**
 * Danh sách yêu cầu vào phả — phần client của màn, chỉ để nối hai nút vào server action và làm
 * mới sau khi ghi.
 */
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ThaoTacXinVaoPha } from '@/components/admin/thao-tac-xin-vao-pha';
import type { AttachmentRole } from '@/core/identity';
import { nhanVaoPha, tuChoiVaoPha } from './actions';

export type MucXin = {
  attachmentId: string;
  personId: string;
  personName: string;
  /**
   * AI đang xin — tên tài khoản, rơi về `accountId` khi không tra được (story 6-2).
   *
   * Trước 27/08 màn này chỉ nói *node nào* được xin. Người quản trị duyệt một yêu cầu mà không
   * biết ai gửi nó — trong khi nhận là trao quyền ghi và mở bán kính riêng tư quanh chỗ ấy.
   */
  taiKhoan: string;
  luc: string;
};

export function DanhSachXin({
  muc,
  vaiCuaMinh,
}: {
  muc: MucXin[];
  /** Vai của người đang duyệt — quyết định họ trao được vai nào. Do trang (server) đọc. */
  vaiCuaMinh: AttachmentRole | 'guest';
}) {
  const router = useRouter();

  return (
    <ul className="mt-6 flex flex-col gap-4">
      {muc.map((m) => (
        <li key={m.attachmentId} className="rounded-md border border-ban-vien bg-ban-o px-5 py-4">
          <p className="text-[17px]">
            <strong>{m.taiKhoan}</strong> đang nhận là{' '}
            <span className="font-pha text-[19px] font-semibold">{m.personName}</span>
          </p>
          <p className="mt-1 text-[15px] text-muted-foreground">xin từ {m.luc}</p>

          {/* Đường sang cây: quyết định này cần nhìn người ấy đứng ở đâu trong họ, không chỉ nhìn
              một cái tên. Mở đúng chỗ, làm tâm luôn. */}
          <Link
            href={`/admin/cay?neo=${encodeURIComponent(m.personId)}`}
            className="mt-1.5 inline-flex min-h-11 items-center text-[17px] underline underline-offset-4"
          >
            Xem chỗ này trên cây
          </Link>

          <ThaoTacXinVaoPha
            khoa={m.attachmentId}
            vaiCuaMinh={vaiCuaMinh}
            onNhan={async (vai) => {
              const res = await nhanVaoPha(m.attachmentId, vai);
              if (!res.ok) return res.error.message;
              router.refresh();
              return null;
            }}
            onTuChoi={async (lyDo) => {
              const res = await tuChoiVaoPha(m.attachmentId, lyDo);
              if (!res.ok) return res.error.message;
              router.refresh();
              return null;
            }}
          />
        </li>
      ))}
    </ul>
  );
}
