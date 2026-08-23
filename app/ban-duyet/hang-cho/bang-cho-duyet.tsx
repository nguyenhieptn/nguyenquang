'use client';

/**
 * BẢNG HÀNG CHỜ — phần tương tác của màn (chọn nhiều dòng, duyệt, trả lại).
 *
 * 'use client' là ngoại lệ có lý do: chọn hàng loạt là tương tác thật (EXPERIENCE.md
 * § Interaction Primitives — bề mặt B được dùng chọn hàng loạt). Dữ liệu tới đây đã là
 * chuỗi hiển thị dựng sẵn ở server — component này không biết gì về core.
 *
 * Luật giữ nguyên từ prototype:
 *   · Không dòng nào được tích sẵn — người vận hành tự chọn. Tích sẵn là đã quyết hộ.
 *   · Dữ liệu phả giữ chất liệu bề mặt A giữa khung trần: serif-phả, nét đứt + vân tồn nghi.
 *   · Duyệt = nút SON — đây đúng nghĩa "đã chốt". Trả lại = nút phụ, bắt buộc ghi chú lý do.
 */
import { useActionState, useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChamTinCay, type MucTinCay } from '@/components/pha/tin-cay';
import { duyetHangLoat, duyetKhangDinh, traLaiKhangDinh } from './actions';

/** Một dòng = MỘT khẳng định (API thật trả từng khẳng định, không gom theo người như mock). */
export type DongChoDuyet = {
  assertionId: string;
  personId: string;
  personName: string;
  /** Câu tiếng Việt đọc được: "năm sinh 1941", "là con ruột của…" — dựng sẵn ở server. */
  cau: string;
  tinCay: MucTinCay;
  nguon: string;
  nguoiKhai: string;
  luc: string;
};

function loiRaCau(loi: { code: string; message: string }): string {
  switch (loi.code) {
    case 'forbidden':
      return 'Chỉ quản trị và đầu mối chi duyệt được.';
    case 'not-found':
      return 'Không còn thấy khẳng định này — có thể đã được xử lý ở nơi khác.';
    case 'conflict':
      return `Trạng thái đã đổi, tải lại trang để xem bản mới (${loi.message}).`;
    default:
      return loi.message;
  }
}

export function BangChoDuyet({ dong }: { dong: DongChoDuyet[] }) {
  const [daChon, setDaChon] = useState<ReadonlySet<string>>(new Set());
  const [dangNangLoat, batDauNangLoat] = useTransition();
  const [ketQuaLoat, setKetQuaLoat] = useState<{ daNang: number; loi: string[] } | null>(null);

  const chonMot = (id: string, chon: boolean) =>
    setDaChon((truoc) => {
      const sau = new Set(truoc);
      if (chon) sau.add(id);
      else sau.delete(id);
      return sau;
    });

  const tatCa = dong.length > 0 && dong.every((d) => daChon.has(d.assertionId));
  const motPhan = !tatCa && dong.some((d) => daChon.has(d.assertionId));

  const nangLoat = () =>
    batDauNangLoat(async () => {
      const ketQua = await duyetHangLoat([...daChon]);
      if (ketQua.ok) {
        setKetQuaLoat(ketQua.value);
        setDaChon(new Set());
      } else {
        setKetQuaLoat({ daNang: 0, loi: [loiRaCau(ketQua.error)] });
      }
    });

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={nangLoat}
          disabled={daChon.size === 0 || dangNangLoat}
          className="h-11 text-[17px]"
        >
          {dangNangLoat ? 'Đang nâng…' : 'Nâng các dòng đã chọn lên Tầng chính thức'}
        </Button>
        <span className="text-[17px] text-muted-foreground" aria-live="polite">
          {daChon.size === 0 ? 'Chưa chọn dòng nào' : `Đã chọn ${daChon.size} dòng`}
        </span>
      </div>

      {ketQuaLoat && (
        <div className="mt-3 max-w-[70ch]" aria-live="polite">
          {ketQuaLoat.daNang > 0 && (
            <p className="text-[17px]">
              Đã nâng {ketQuaLoat.daNang} khẳng định lên Tầng chính thức.
            </p>
          )}
          {ketQuaLoat.loi.length > 0 && (
            <div className="mt-2 border-l-4 border-destructive bg-canh-bao-nen px-4 py-3">
              <p className="text-[17px] font-semibold">
                {ketQuaLoat.loi.length} dòng không nâng được
              </p>
              <ul className="mt-1 grid gap-1">
                {ketQuaLoat.loi.map((cau, i) => (
                  <li key={i} className="text-[15px]">
                    {cau}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-md border border-ban-vien bg-ban-o">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">
                <label className="flex min-h-11 min-w-11 items-center justify-center">
                  <Checkbox
                    checked={tatCa ? true : motPhan ? 'indeterminate' : false}
                    onCheckedChange={(chon) =>
                      setDaChon(chon === true ? new Set(dong.map((d) => d.assertionId)) : new Set())
                    }
                    aria-label="Chọn tất cả các dòng"
                  />
                </label>
              </TableHead>
              <TableHead className="text-[17px]">Người</TableHead>
              <TableHead className="text-[17px]">Phả ghi gì</TableHead>
              <TableHead className="text-[17px]">Dựa vào đâu</TableHead>
              <TableHead className="text-[17px]">Ai khai, lúc nào</TableHead>
              <TableHead className="w-56 text-[17px]">Quyết</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dong.map((d) => (
              <HangKhangDinh
                key={d.assertionId}
                dong={d}
                chon={daChon.has(d.assertionId)}
                onChon={(chon) => chonMot(d.assertionId, chon)}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function HangKhangDinh({
  dong: d,
  chon,
  onChon,
}: {
  dong: DongChoDuyet;
  chon: boolean;
  onChon: (chon: boolean) => void;
}) {
  const [dangDuyet, batDauDuyet] = useTransition();
  const [loiDuyet, setLoiDuyet] = useState<string | null>(null);
  const [ketQuaTraLai, traLaiAction, dangTraLai] = useActionState(traLaiKhangDinh, null);

  const duyet = () =>
    batDauDuyet(async () => {
      setLoiDuyet(null);
      const ketQua = await duyetKhangDinh(d.assertionId);
      if (!ketQua.ok) setLoiDuyet(loiRaCau(ketQua.error));
      // Thành công thì revalidatePath đã chạy — dòng tự rời bảng, không cần báo gì thêm.
    });

  return (
    <TableRow>
      <TableCell className="align-top">
        <label className="flex min-h-11 min-w-11 items-center justify-center">
          <Checkbox
            checked={chon}
            onCheckedChange={(v) => onChon(v === true)}
            aria-label={`Chọn khẳng định về ${d.personName}`}
          />
        </label>
      </TableCell>
      <TableCell className="align-top">
        {/* Dữ liệu phả giữ nguyên luật bề mặt A ngay giữa khung trần: serif-phả, nét đứt +
            vân tồn nghi. Bàn duyệt vẽ khác thì người vận hành duyệt một thứ và người trong
            họ thấy một thứ khác.
            TODO(core): PendingAssertion chưa mang đời + chi — bổ sung vào listPendingAssertions
            thì bày thêm ở đây (đừng gọi cây từng người cho một bảng không chặn số dòng). */}
        <div className="van-ton-nghi min-w-48 rounded-md border border-dashed border-tin-ton-nghi px-3.5 py-2.5">
          <Link
            href={`/nguoi/${d.personId}`}
            className="font-[family-name:var(--font-pha)] text-[17px] font-semibold underline-offset-4 hover:underline"
          >
            {d.personName}
          </Link>
          <span className="mt-0.5 block text-[15px] text-muted-foreground">
            mở trang người để đối chiếu
          </span>
        </div>
      </TableCell>
      <TableCell className="align-top">
        <p className="max-w-[42ch] text-[17px]">{d.cau}</p>
        <div className="mt-1">
          <ChamTinCay muc={d.tinCay} />
        </div>
      </TableCell>
      <TableCell className="align-top">
        <p className="max-w-[32ch] text-[17px]">{d.nguon}</p>
      </TableCell>
      <TableCell className="align-top text-[17px]">
        {d.nguoiKhai}
        <span className="block text-[15px] text-muted-foreground">{d.luc}</span>
      </TableCell>
      <TableCell className="align-top">
        <div className="grid w-52 gap-2">
          <Button
            type="button"
            onClick={duyet}
            disabled={dangDuyet || dangTraLai}
            className="h-11 w-full text-[17px]"
          >
            {dangDuyet ? 'Đang nâng…' : 'Duyệt'}
          </Button>
          <details>
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center rounded-md border border-border px-2.5 text-[17px] hover:bg-muted">
              Trả lại…
            </summary>
            <form action={traLaiAction} className="mt-2 grid gap-2">
              <input type="hidden" name="assertionId" value={d.assertionId} />
              <label className="grid gap-1.5">
                <span className="text-[15px] font-semibold text-muted-foreground">
                  Lý do trả lại
                </span>
                <textarea
                  name="ghiChu"
                  required
                  rows={2}
                  className="w-full rounded-md border border-ban-vien bg-ban-o px-3 py-2 text-[17px]"
                />
              </label>
              <Button
                type="submit"
                variant="outline"
                disabled={dangTraLai}
                className="h-11 w-full text-[17px]"
              >
                {dangTraLai ? 'Đang trả lại…' : 'Trả lại kèm ghi chú'}
              </Button>
              <p className="text-[15px] text-muted-foreground">
                Trả lại là gỡ khẳng định này khỏi dữ liệu đang bày — toàn văn còn nguyên trong
                nhật ký, kèm chính ghi chú này.
              </p>
            </form>
          </details>
          {loiDuyet && (
            <p className="border-l-4 border-destructive bg-canh-bao-nen px-3 py-2 text-[15px]">
              {loiDuyet}
            </p>
          )}
          {ketQuaTraLai && !ketQuaTraLai.ok && (
            <p className="border-l-4 border-destructive bg-canh-bao-nen px-3 py-2 text-[15px]">
              {loiRaCau(ketQuaTraLai.error)}
            </p>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
