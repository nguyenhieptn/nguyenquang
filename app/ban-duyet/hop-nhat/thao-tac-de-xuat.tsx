'use client';

/**
 * THAO TÁC THEO MÃ ĐỀ XUẤT — gộp · bác · tách lại.
 *
 * ⚠️ TODO(core): đây là đường TẠM. core/merge chưa có API liệt kê đề xuất đang mở lẫn lịch
 * sử gộp gần đây (cần listProposals()/listMergeHistory()) — nên chưa bày được danh sách để
 * bấm thẳng vào từng đề xuất. Trong lúc chờ, thao tác nhận MÃ đề xuất (hiện ra ngay khi mở
 * đề xuất ở khu trên). Có API liệt kê thì thay khối này bằng danh sách thật.
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

export function ThaoTacDeXuat() {
  const [ma, setMa] = useState('');
  const [lyDo, setLyDo] = useState('');
  const [daDocKy, setDaDocKy] = useState(false);
  const [thongBao, setThongBao] = useState<ThongBao | null>(null);
  const [dangChay, batDau] = useTransition();

  const gop = () =>
    batDau(async () => {
      const ketQua = await gopDeXuat(ma);
      if (ketQua.ok) {
        setThongBao({
          loai: 'xong',
          cau: `Đã gộp: chuyển ${ketQua.value.repointedCount} mối nối về hồ sơ chính. Tách lại được bằng đúng mã này.`,
        });
        setDaDocKy(false);
      } else {
        setThongBao({ loai: 'loi', cau: loiRaCau(ketQua.error) });
      }
    });

  const bac = () =>
    batDau(async () => {
      const ketQua = await khongPhaiMotNguoi(ma, lyDo);
      if (ketQua.ok) {
        setThongBao({ loai: 'xong', cau: 'Đã ghi: không phải một người. Phán quyết nằm trong nhật ký.' });
        setLyDo('');
      } else {
        setThongBao({ loai: 'loi', cau: loiRaCau(ketQua.error) });
      }
    });

  const tach = () =>
    batDau(async () => {
      const ketQua = await tachLai(ma);
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
    <div className="rounded-md border border-ban-vien bg-ban-o px-5 py-5">
      <label className="grid max-w-xl gap-1.5">
        <span className="text-[15px] font-semibold text-muted-foreground">
          Mã đề xuất (proposal ID)
        </span>
        <input
          value={ma}
          onChange={(e) => setMa(e.target.value)}
          placeholder="hiện ra ngay khi mở đề xuất ở khu trên"
          className="h-11 rounded-md border border-ban-vien px-3 font-mono text-[15px]"
        />
      </label>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
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
            disabled={dangChay || !ma.trim() || !daDocKy}
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
            disabled={dangChay || !ma.trim() || !lyDo.trim()}
            className="h-11 text-[17px]"
          >
            Không phải một người
          </Button>
        </div>

        {/* TÁCH LẠI — đảo một lần gộp đã chạy, từ danh sách mối nối ghi trong nhật ký (AD-3). */}
        <div className="grid gap-2">
          <p className="text-[17px] font-semibold">Tách lại</p>
          <p className="text-[15px] text-muted-foreground">
            Trả một lần gộp về đúng như trước, theo danh sách mối nối đã ghi lúc gộp.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={tach}
            disabled={dangChay || !ma.trim()}
            className="h-11 text-[17px]"
          >
            Tách lại
          </Button>
        </div>
      </div>

      {thongBao && (
        <div className="mt-5 max-w-[70ch]" aria-live="polite">
          {thongBao.loai === 'loi' ? (
            <p className="border-l-4 border-destructive bg-canh-bao-nen px-4 py-3 text-[17px]">
              {thongBao.cau}
            </p>
          ) : (
            <p className="text-[17px]">{thongBao.cau}</p>
          )}
        </div>
      )}
    </div>
  );
}
