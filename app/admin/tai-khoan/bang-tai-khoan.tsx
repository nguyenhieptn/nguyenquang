'use client';

/**
 * Bảng tài khoản — story 6-2.
 *
 * ── Vì sao lý do khoá là CHỮ, không phải `title` ─────────────────────────────────────────
 * Một nút `disabled` mang lý do trong `title` là lý do mà bàn phím không với tới (nút ra khỏi
 * thứ tự `Tab`) và cảm ứng không mở được. Bài học lượt code review 6-9. Ở đây lý do luôn hiện
 * thành chữ bên cạnh, và phép quyết nó nằm ở module thuần `vai-gan-ket.ts` (có test).
 */
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  CAU_KHOA,
  MOI_VAI,
  lyDoKhoaDoiVai,
  nhanTrangThaiAnToan,
  nhanVaiAnToan,
} from '@/components/admin/vai-gan-ket';
import type { AttachmentRole } from '@/core/identity';
import { doiVai, goGanKet } from './actions';

export type MucTaiKhoan = {
  attachmentId: string;
  taiKhoan: string;
  personId: string;
  personName: string;
  role: AttachmentRole;
  status: 'pending' | 'active' | 'rejected' | 'detached';
  laChinhMinh: boolean;
  /** Ai đã bảo lãnh gắn kết này — `null` khi không có (bootstrap) hoặc không tra ngược được. */
  nguoiBaoLanh: string | null;
  luc: string;
};

export function BangTaiKhoan({
  muc,
  vaiCuaMinh,
  soAdminDangHoatDong,
}: {
  muc: MucTaiKhoan[];
  vaiCuaMinh: AttachmentRole | 'guest';
  soAdminDangHoatDong: number;
}) {
  return (
    <ul className="mt-6 flex flex-col gap-4">
      {muc.map((m) => (
        <Hang
          key={m.attachmentId}
          m={m}
          vaiCuaMinh={vaiCuaMinh}
          soAdminDangHoatDong={soAdminDangHoatDong}
        />
      ))}
    </ul>
  );
}

function Hang({
  m,
  vaiCuaMinh,
  soAdminDangHoatDong,
}: {
  m: MucTaiKhoan;
  vaiCuaMinh: AttachmentRole | 'guest';
  soAdminDangHoatDong: number;
}) {
  const router = useRouter();
  const [loi, setLoi] = useState<string | null>(null);
  const [moGo, setMoGo] = useState(false);
  const [lyDo, setLyDo] = useState('');
  /**
   * Vai đang chờ XÁC NHẬN — chốt của chủ dự án 27/08 sau code review.
   *
   * Bản đầu để `onChange` của một radio ghi thẳng: trao quyền duyệt khẳng định của cả dòng họ
   * bằng một cú bấm, trong khi *gỡ gắn kết* — việc NHẸ HƠN, sửa lại được — thì bắt gõ lý do rồi
   * mới cho bấm. Tệ hơn, phím mũi tên trong một nhóm radio BẮT BUỘC đổi lựa chọn khi di chuyển,
   * nên Tab vào rồi bấm ↓ để xem có gì là đã trao xong vai.
   *
   * Nay là NÚT + một bước xác nhận, cho mọi lượt đổi vai — kể cả hạ vai: mỗi lượt là một lượt
   * ghi vĩnh viễn vào nhật ký.
   */
  const [vaiChoXacNhan, setVaiChoXacNhan] = useState<AttachmentRole | null>(null);
  const [dangChay, batDau] = useTransition();

  const khoa = lyDoKhoaDoiVai({
    vaiCuaMinh,
    laChinhMinh: m.laChinhMinh,
    trangThai: m.status,
    vaiHangNay: m.role,
    soAdminDangHoatDong,
  });

  const chay = (fn: () => Promise<{ ok: boolean; error?: { message: string } }>) => {
    setLoi(null);
    batDau(async () => {
      try {
        const res = await fn();
        if (!res.ok) {
          setLoi(res.error?.message ?? 'Không ghi được.');
          // Làm mới CẢ KHI hỏng: `conflict` thường nghĩa là ai đó vừa đổi thứ này ở tab khác, và
          // để nguyên màn cũ là mời người ta bấm lại đúng cái vừa hỏng, vô hạn.
          router.refresh();
        } else {
          setMoGo(false);
          setLyDo('');
          setVaiChoXacNhan(null);
          router.refresh();
        }
      } catch {
        // Reject trong transition đi ra `reportGlobalError`, không tới `error.tsx`.
        setLoi('Không gửi được lên máy chủ. Kiểm tra mạng rồi thử lại.');
      }
    });
  };

  return (
    <li className="rounded-md border border-ban-vien bg-ban-o px-5 py-4">
      <p className="text-[17px]">
        <strong>{m.taiKhoan}</strong> đứng tên cho{' '}
        {/* `min-h-11` — sàn chạm 44px. Một link nằm GIỮA câu vẫn là một đích chạm; bản đầu để nó
            cao 26px và `scripts/soi-tai-khoan.mjs` bắt được ngay lượt chạy đầu tiên. */}
        <Link
          href={`/admin/cay?neo=${encodeURIComponent(m.personId)}`}
          className="font-pha inline-flex min-h-11 items-center text-[19px] font-semibold underline underline-offset-4"
        >
          {m.personName}
        </Link>
      </p>
      {/* Trạng thái và vai nói bằng CHỮ, không bằng màu — `EXPERIENCE.md § Accessibility Floor`. */}
      <p className="mt-1 text-[17px]">
        {nhanVaiAnToan(m.role).ten} · {nhanTrangThaiAnToan(m.status)}
        {m.laChinhMinh ? ' · chính mình' : ''}
      </p>
      <p className="mt-0.5 max-w-[70ch] text-[15px] text-muted-foreground">
        {nhanVaiAnToan(m.role).lamDuocGi} · gắn từ {m.luc}
        {m.nguoiBaoLanh ? ` · ${m.nguoiBaoLanh} bảo lãnh` : ''}
      </p>

      {/* `role="alert"` — bản đầu là một `<p>` trần, nên câu *"Đây là quản trị duy nhất"* hiện
          ra hoàn toàn im lặng với trình đọc màn hình. Nếp đúng đã có ở `app/gan-node/nhan-cho.tsx`. */}
      <div role="alert" aria-live="assertive">
        {loi ? (
          <p className="mt-2 border-l-4 border-destructive bg-canh-bao-nen px-2.5 py-1.5 text-[15px]">
            {loi}
          </p>
        ) : null}
      </div>

      {khoa ? (
        // Lý do LUÔN HIỆN, không nấp trong `title` của một nút đã vô hiệu.
        <p className="mt-2 max-w-[70ch] text-[15px] text-muted-foreground">{CAU_KHOA[khoa]}</p>
      ) : vaiChoXacNhan ? (
        <div className="mt-3 border-l-4 border-destructive bg-canh-bao-nen px-3 py-2">
          <p className="max-w-[70ch] text-[17px]">
            Trao vai <strong>{nhanVaiAnToan(vaiChoXacNhan).ten}</strong> cho {m.taiKhoan}? Người ấy
            sẽ {nhanVaiAnToan(vaiChoXacNhan).lamDuocGi}.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={dangChay}
              onClick={() => chay(() => doiVai(m.attachmentId, vaiChoXacNhan))}
              className="h-11 text-[17px]"
            >
              {dangChay ? 'Đang ghi…' : 'Xác nhận'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={dangChay}
              onClick={() => setVaiChoXacNhan(null)}
              className="h-11 text-[17px]"
            >
              Thôi
            </Button>
          </div>
        </div>
      ) : moGo ? (
        <div className="mt-3">
          <label
            className="block text-[15px] font-semibold text-muted-foreground"
            htmlFor={`ly-do-${m.attachmentId}`}
          >
            Vì sao gỡ<span className="text-destructive"> ·</span>
          </label>
          <input
            id={`ly-do-${m.attachmentId}`}
            value={lyDo}
            onChange={(e) => setLyDo(e.target.value)}
            className="mt-0.5 min-h-11 w-full rounded-md border border-ban-vien bg-ban-nen px-3 text-[17px]"
          />
          <p className="mt-1 max-w-[46ch] text-[15px] text-muted-foreground">
            Lý do vào nhật ký của ban tu phả. Hàng không bị xoá, và người ấy xin lại được.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={dangChay || lyDo.trim() === ''}
              onClick={() => chay(() => goGanKet(m.attachmentId, lyDo))}
              className="h-11 text-[17px] text-destructive"
            >
              {dangChay ? 'Đang ghi…' : 'Xác nhận gỡ'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={dangChay}
              onClick={() => {
                setMoGo(false);
                // Dọn chữ cũ — mở lại thấy lý do của lượt trước là mời gửi nhầm.
                setLyDo('');
              }}
              className="h-11 text-[17px]"
            >
              Thôi
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {MOI_VAI.filter((v) => v !== m.role).map((v) => (
            <Button
              key={v}
              type="button"
              variant="ghost"
              disabled={dangChay}
              onClick={() => setVaiChoXacNhan(v)}
              className="h-11 text-[17px]"
            >
              Trao {nhanVaiAnToan(v).ten}
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            disabled={dangChay}
            onClick={() => setMoGo(true)}
            className="h-11 text-[17px] text-destructive"
          >
            Gỡ gắn kết
          </Button>
        </div>
      )}
    </li>
  );
}
