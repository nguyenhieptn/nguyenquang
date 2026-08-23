'use client';

/**
 * THAO TÁC TRÊN MỘT ĐỀ XUẤT ĐANG MỞ — gộp · bác — và TÁCH LẠI trên một lần gộp đã chạy.
 *
 * Danh sách đề xuất giờ là danh sách THẬT (core/merge.listProposals — page.tsx đọc và bày);
 * hai component ở đây đứng DƯỚI TỪNG dòng, mã đề xuất đi theo props chứ không bắt ai chép tay.
 *
 * Luật màu giữ nguyên: GỘP là nút son duy nhất của màn — nó đúng nghĩa "đã chốt". Bác và
 * tách lại là nút phụ. Gộp còn bị chặn sau một ô "đã đọc kỹ": màn này cố tình KHÔNG có
 * đường nhanh (xem đầu file page.tsx).
 */
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { gopDeXuat, khongPhaiMotNguoi, tachLai } from './actions';
import { loiRaCau } from './loi';

type ThongBao = { loai: 'xong' | 'loi'; cau: string };

function DongThongBao({ thongBao }: { thongBao: ThongBao | null }) {
  if (!thongBao) return null;
  return (
    <div className="mt-4 max-w-[70ch]" aria-live="polite">
      {thongBao.loai === 'loi' ? (
        <p className="border-l-4 border-destructive bg-canh-bao-nen px-4 py-3 text-[17px]">
          {thongBao.cau}
        </p>
      ) : (
        <p className="text-[17px]">{thongBao.cau}</p>
      )}
    </div>
  );
}

/** Gộp / bác — dưới MỘT đề xuất đang mở. Trang revalidate sau khi xong nên dòng tự rời danh sách. */
export function ThaoTacDeXuat({ proposalId }: { proposalId: string }) {
  const [lyDo, setLyDo] = useState('');
  const [daDocKy, setDaDocKy] = useState(false);
  const [thongBao, setThongBao] = useState<ThongBao | null>(null);
  const [dangChay, batDau] = useTransition();

  const gop = () =>
    batDau(async () => {
      const ketQua = await gopDeXuat(proposalId);
      if (ketQua.ok) {
        setThongBao({
          loai: 'xong',
          cau: `Đã gộp: chuyển ${ketQua.value.repointedCount} mối nối về hồ sơ chính. Tách lại được ở mục "Lịch sử gộp gần đây".`,
        });
        setDaDocKy(false);
      } else {
        setThongBao({ loai: 'loi', cau: loiRaCau(ketQua.error) });
      }
    });

  const bac = () =>
    batDau(async () => {
      const ketQua = await khongPhaiMotNguoi(proposalId, lyDo);
      if (ketQua.ok) {
        setThongBao({
          loai: 'xong',
          cau: 'Đã ghi: không phải một người. Phán quyết nằm trong nhật ký.',
        });
        setLyDo('');
      } else {
        setThongBao({ loai: 'loi', cau: loiRaCau(ketQua.error) });
      }
    });

  return (
    <div>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* GỘP — hành động son duy nhất của màn, sau một hàng rào cố ý. */}
        <div className="grid gap-2">
          <p className="text-[17px] font-semibold">Gộp</p>
          <p className="text-[15px] text-muted-foreground">
            Gộp được thì tách lại được, nhưng đọc kỹ đã.
          </p>
          <label className="flex min-h-11 items-center gap-2 text-[17px]">
            <Checkbox
              checked={daDocKy}
              onCheckedChange={(v) => setDaDocKy(v === true)}
              aria-label="Đã đọc kỹ hai hồ sơ của đề xuất này"
            />
            Đã đọc kỹ hai hồ sơ
          </label>
          <Button
            type="button"
            onClick={gop}
            disabled={dangChay || !daDocKy}
            className="h-11 text-[17px]"
          >
            {dangChay ? 'Đang làm…' : 'Gộp — chuyển mọi mối nối về hồ sơ chính'}
          </Button>
        </div>

        {/* BÁC — trả lời "hai người khác nhau" là một phán quyết thật, ghi lại được. */}
        <div className="grid gap-2">
          <p className="text-[17px] font-semibold">Không phải một người</p>
          <label className="grid gap-1.5">
            <span className="text-[15px] text-muted-foreground">Vì sao là hai người khác nhau</span>
            <textarea
              value={lyDo}
              onChange={(e) => setLyDo(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-ban-vien px-3 py-2 text-[17px]"
            />
          </label>
          <Button
            type="button"
            variant="outline"
            onClick={bac}
            disabled={dangChay || !lyDo.trim()}
            className="h-11 text-[17px]"
          >
            Không phải một người
          </Button>
        </div>
      </div>

      <DongThongBao thongBao={thongBao} />
    </div>
  );
}

/** TÁCH LẠI — đảo một lần gộp đã chạy, từ danh sách mối nối ghi trong nhật ký (AD-3). */
export function TachLaiNut({ proposalId }: { proposalId: string }) {
  const [thongBao, setThongBao] = useState<ThongBao | null>(null);
  const [dangChay, batDau] = useTransition();

  const tach = () =>
    batDau(async () => {
      const ketQua = await tachLai(proposalId);
      if (ketQua.ok) {
        setThongBao({
          loai: 'xong',
          cau: `Đã tách lại: ${ketQua.value.reversed} mối nối trở về đúng như trước khi gộp.`,
        });
      } else {
        setThongBao({ loai: 'loi', cau: loiRaCau(ketQua.error) });
      }
    });

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        onClick={tach}
        disabled={dangChay}
        className="h-11 text-[17px]"
      >
        {dangChay ? 'Đang làm…' : 'Tách lại'}
      </Button>
      <DongThongBao thongBao={thongBao} />
    </div>
  );
}
