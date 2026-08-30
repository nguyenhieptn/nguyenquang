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
import { coTheDuyetCaNhom, type NhomNguoi } from '@/components/admin/gom-hang-cho';
import { duyetHangLoat, duyetKhangDinh, traLaiKhangDinh } from './actions';

/** Một dòng = MỘT khẳng định (API thật trả từng khẳng định, không gom theo người như mock). */
export type DongChoDuyet = {
  assertionId: string;
  personId: string;
  personName: string;
  /** `AssertionKind` — thứ quyết định đụng độ đơn trị và thứ tự trong nhóm (story 6-8). */
  kind: string;
  /** Câu tiếng Việt đọc được: "năm sinh 1941", "là con ruột của…" — dựng sẵn ở server. */
  cau: string;
  tinCay: MucTinCay;
  nguon: string;
  nguoiKhai: string;
  luc: string;
  /** Mốc THÔ để xếp; `luc` đã định dạng cho mắt. */
  lucISO: string;
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

export function BangChoDuyet({
  dong,
  nhom,
  nhanLoai,
}: {
  dong: DongChoDuyet[];
  /**
   * `NHAN` của `core/person/chong.ts`, do trang (server) truyền xuống.
   *
   * Bản đầu chép tay bốn nhãn vào file này — đúng thứ QĐ-3 vừa cấm và § *Cạm bẫy* vừa dặn, và
   * lượt code review bắt lại lần thứ hai trong cùng một sprint. `Record<string,string>` còn làm
   * tsc thôi kiểm đủ, và rơi về mã tiếng Anh thô giữa màn tiếng Việt khi gặp loại chưa khai.
   */
  nhanLoai: Readonly<Record<string, string>>;
  /**
   * Cùng dữ liệu, gom theo NGƯỜI — gom ở server vì luật `DON_TRI`/`HANG` sống trong core.
   * `dong` vẫn còn để nút hàng loạt XUYÊN NHÓM và ô "chọn tất cả" giữ nguyên nghĩa (AC 7).
   */
  nhom: NhomNguoi<DongChoDuyet>[];
}) {
  const [daChon, setDaChon] = useState<ReadonlySet<string>>(new Set());
  const [dangNangLoat, batDauNangLoat] = useTransition();
  /**
   * Kết quả của MỌI lượt duyệt hàng loạt — cả nút xuyên nhóm lẫn nút của từng nhóm — sống ở ĐÂY.
   *
   * Bản đầu để kết quả của nhóm trong chính `NhomMotNguoi`, mà `revalidatePath` tháo component ấy
   * đúng khi nhóm hết dòng. Càng thành công càng câm: nhóm 4 dòng duyệt hết thì biến mất, không
   * một câu nào nói đã nâng 4. Và cả 10/10 nhóm thật hôm nay đều là ca ấy.
   */
  const [ketQuaLoat, setKetQuaLoat] = useState<{ ten: string | null; daNang: number; loi: string[] } | null>(
    null,
  );

  const chonMot = (id: string, chon: boolean) =>
    setDaChon((truoc) => {
      const sau = new Set(truoc);
      if (chon) sau.add(id);
      else sau.delete(id);
      return sau;
    });

  /**
   * Chọn HIỆN HÀNH — cắt tỉa theo `dong` mà server vừa gửi (sửa 27/08 sau code review).
   *
   * `daChon` chỉ được dọn ở đúng một chỗ (sau lượt xuyên nhóm). Sau khi duyệt một dòng lẻ, duyệt
   * cả nhóm, hay trả lại, `revalidatePath` gỡ dòng khỏi bảng nhưng id vẫn nằm trong `daChon`:
   * bộ đếm nói *"Đã chọn 4 dòng"* trên một màn còn 0 dòng tích, và bấm tiếp gửi id ma ⇒ bốn câu
   * *"Không còn thấy khẳng định này"* cho việc chính người ấy vừa làm.
   *
   * DẪN XUẤT chứ không `useEffect`: repo đã vấp `set-state-in-effect` bốn lần, và ở đây không
   * cần đồng bộ gì — chỉ cần đọc đúng.
   */
  const idHienCo = new Set(dong.map((d) => d.assertionId));
  const chonHienHanh = [...daChon].filter((id) => idHienCo.has(id));
  const tatCa = dong.length > 0 && chonHienHanh.length === dong.length;
  const motPhan = !tatCa && chonHienHanh.length > 0;

  const nangLoat = () =>
    batDauNangLoat(async () => {
      let ketQua: Awaited<ReturnType<typeof duyetHangLoat>>;
      try {
        ketQua = await duyetHangLoat(chonHienHanh);
      } catch {
        // Reject trong transition đi ra `reportGlobalError`, không tới `error.tsx`. Đây là lối
        // duyệt HÀNG LOẠT: im lặng ở đây nghĩa là người vận hành không biết mình vừa duyệt được
        // bao nhiêu dòng, hay không dòng nào.
        setKetQuaLoat({ ten: null, daNang: 0, loi: ['Không gửi được lên máy chủ. Kiểm tra mạng rồi thử lại.'] });
        return;
      }
      if (ketQua.ok) {
        setKetQuaLoat({ ten: null, ...ketQua.value });
        setDaChon(new Set());
      } else {
        setKetQuaLoat({ ten: null, daNang: 0, loi: [loiRaCau(ketQua.error)] });
      }
    });

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={nangLoat}
          disabled={chonHienHanh.length === 0 || dangNangLoat}
          className="h-11 text-[17px]"
        >
          {dangNangLoat ? 'Đang nâng…' : 'Nâng các dòng đã chọn lên Tầng chính thức'}
        </Button>
        {/* "Chọn tất cả" XUYÊN NHÓM — nó đi cùng nút hàng loạt ngay bên, và phục vụ nhịp khác
            với nút của từng nhóm: người quét cả bảng nhặt những dòng chắc chắn (AC 7). Trước
            story 6-8 nó nằm ở ô đầu tiên của bảng phẳng; bảng nay chia thành nhiều nhóm nên
            không còn một đầu bảng nào để nó đứng. */}
        <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[17px]">
          <Checkbox
            checked={tatCa ? true : motPhan ? 'indeterminate' : false}
            onCheckedChange={(chon) =>
              setDaChon(chon === true ? new Set(dong.map((d) => d.assertionId)) : new Set())
            }
            aria-label="Chọn tất cả các dòng"
          />
          <span>Chọn tất cả</span>
        </label>
        <span className="text-[17px] text-muted-foreground" aria-live="polite">
          {chonHienHanh.length === 0 ? 'Chưa chọn dòng nào' : `Đã chọn ${chonHienHanh.length} dòng`}
        </span>
      </div>

      {/* `role="alert"` — bài học 6-2. Bản đầu chỉ có `aria-live="polite"` ở khối này. */}
      {ketQuaLoat && (
        <div className="mt-3 max-w-[70ch]" role="alert">
          {ketQuaLoat.daNang > 0 && (
            <p className="text-[17px]">
              Đã nâng {ketQuaLoat.daNang} khẳng định
              {ketQuaLoat.ten ? ` của ${ketQuaLoat.ten}` : ''} lên Tầng chính thức.
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

      <div className="mt-5 grid gap-5">
        {nhom.map((n) => (
          <NhomMotNguoi
            key={n.personId}
            n={n}
            nhanLoai={nhanLoai}
            daChon={daChon}
            onKetQua={(kq) => setKetQuaLoat(kq)}
            onChonMot={chonMot}
            onChonNhom={(ids, chon) =>
              setDaChon((truoc) => {
                const sau = new Set(truoc);
                for (const id of ids) {
                  if (chon) sau.add(id);
                  else sau.delete(id);
                }
                return sau;
              })
            }
          />
        ))}
      </div>
    </>
  );
}

/**
 * MỘT NGƯỜI — cả cụm khẳng định đang chờ về họ, và một lối duyệt trọn cụm.
 *
 * Đơn vị hành động vẫn là khẳng định (AD-9): nút của nhóm gọi đúng `duyetHangLoat` với các
 * `assertionId` của nhóm. Thứ story 6-8 thêm là ĐƠN VỊ CHÚ Ý — người vận hành đọc xong một người
 * thì quyết xong một người.
 */
function NhomMotNguoi({
  n,
  nhanLoai,
  daChon,
  onKetQua,
  onChonMot,
  onChonNhom,
}: {
  n: NhomNguoi<DongChoDuyet>;
  nhanLoai: Readonly<Record<string, string>>;
  daChon: ReadonlySet<string>;
  /** Kết quả báo LÊN CHA — nhóm này biến mất khi duyệt hết, xem chú thích ở `ketQuaLoat`. */
  onKetQua: (kq: { ten: string | null; daNang: number; loi: string[] }) => void;
  onChonMot: (id: string, chon: boolean) => void;
  onChonNhom: (ids: string[], chon: boolean) => void;
}) {
  const [dangDuyet, batDau] = useTransition();
  /** Id nằm trong một cụm đụng độ — để đánh dấu ĐÚNG DÒNG, không chỉ nói ở đầu nhóm. */
  const trongCum = new Set(n.cumDungDo.flatMap((c) => c.assertionIds));
  const soChon = n.dong.filter((d) => daChon.has(d.assertionId)).length;
  const chonHet = soChon === n.dong.length;

  const duyetCaNhom = () =>
    batDau(async () => {
      try {
        const r = await duyetHangLoat(n.duyetDuoc);
        onKetQua(
          r.ok
            ? { ten: n.personName, ...r.value }
            : { ten: n.personName, daNang: 0, loi: [loiRaCau(r.error)] },
        );
      } catch {
        onKetQua({
          ten: n.personName,
          daNang: 0,
          loi: ['Không gửi được lên máy chủ. Kiểm tra mạng rồi thử lại.'],
        });
      }
    });

  return (
    /**
      Chất liệu TỒN NGHI ở thẻ NHÓM — chốt của chủ dự án 27/08 sau code review.

      Lượt dựng bỏ cột "Người" (đúng `EXPERIENCE.md`: bảng chật thì bớt cột) và bỏ theo cả nét đứt
      + vân giấy nháp vốn nằm trong ô ấy, trong khi 100% dòng của màn này là khẳng định tồn nghi
      và chú thích đầu file vẫn khai là còn giữ. Nay nói một lần cho cả cụm thay vì lặp N lần:
      cùng chất liệu, đúng chỗ, không dựng lại cột vừa bỏ.
    */
    <section
      aria-label={`Khẳng định đang chờ về ${n.personName || 'người chưa có tên'}`}
      data-nhom
      className="van-ton-nghi overflow-hidden rounded-md border border-dashed border-tin-ton-nghi"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-dashed border-tin-ton-nghi px-5 py-4">
        <div>
          {/* `min-h-11` — sàn chạm 44px. Cùng lỗi đã vá ở màn Tài khoản (6-2): một link nằm
              trong câu vẫn là một đích chạm. `scripts/soi-hang-cho.mjs` bắt được ở lượt đầu. */}
          <Link
            href={`/nguoi/${n.personId}`}
            className="font-[family-name:var(--font-pha)] inline-flex min-h-11 items-center text-[19px] font-semibold underline-offset-4 hover:underline"
          >
            {/* Tên rỗng vẫn tới được (`full_name` mặc định `''`): một link cao 44 rộng 0 thì mắt
                không thấy, chuột không bấm, và cổng chỉ đo chiều cao nên cũng không thấy. */}
            {n.personName || '(chưa có tên)'}
          </Link>
          <p className="mt-0.5 text-[15px] text-muted-foreground">
            {n.dong.length} khẳng định đang chờ ở <strong>Tầng tồn nghi</strong> · mở trang người
            để đối chiếu
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[17px]">
            {/*
              Chọn `duyetDuoc`, KHÔNG phải `n.dong` (sửa 27/08 sau code review — CHẶN).
              Bản đầu tích cả cụm đụng độ, rồi nút hàng loạt gửi thẳng không lọc: ba cú bấm tự
              nhiên nhất của màn đưa hai giá trị chọi nhau vào một lượt, và máy chọn hộ bằng thứ
              tự lặp. Hàng rào thật nay ở `duyetHangLoat` (server); đây chỉ là để ô tích thôi
              mời người ta đi vào cái cửa ấy.
            */}
            <Checkbox
              checked={chonHet ? true : soChon > 0 ? 'indeterminate' : false}
              onCheckedChange={(v) => onChonNhom(n.duyetDuoc, v === true)}
              aria-label={`Chọn ${n.duyetDuoc.length} khẳng định duyệt được của ${n.personName}`}
            />
            <span>Chọn cả nhóm</span>
          </label>
          {coTheDuyetCaNhom(n) ? (
            <Button type="button" onClick={duyetCaNhom} disabled={dangDuyet} className="h-11 text-[17px]">
              {dangDuyet
                ? 'Đang nâng…'
                : n.duyetDuoc.length === n.dong.length
                  ? n.duyetDuoc.length === 1
                    ? `Duyệt mục này của ${n.personName}`
                    : `Duyệt cả ${n.duyetDuoc.length} mục của ${n.personName}`
                  : `Duyệt ${n.duyetDuoc.length} mục của ${n.personName} — chừa ${n.dong.length - n.duyetDuoc.length} mục còn phải chọn`}
            </Button>
          ) : null}
        </div>
      </div>

      {/* CỤM ĐỤNG ĐỘ — chỗ story này thật sự làm việc.
          `promoteAssertionOp` chặn nâng giá trị chính thức thứ hai cho một loại đơn trị, nên gộp
          cả cụm vào một lượt duyệt là để MÁY chọn hộ bằng thứ tự lặp. Nói ra, và để người chọn. */}
      {n.cumDungDo.map((c) => (
        <p
          key={c.kind}
          className="border-b border-ban-vien bg-canh-bao-nen px-5 py-3 text-[17px]"
        >
          <strong>
            {c.assertionIds.length} giá trị cùng khai về{' '}
            {(nhanLoai[c.kind] ?? c.kind).toLowerCase()}
          </strong>{' '}
          — chỉ một cái lên Tầng chính thức được, nên chúng đứng ngoài lượt duyệt cả nhóm. Chọn
          từng cái ở cột <em>Quyết</em>.
        </p>
      ))}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14"><span className="sr-only">Chọn</span></TableHead>
            <TableHead className="text-[17px]">Phả ghi gì</TableHead>
            <TableHead className="text-[17px]">Dựa vào đâu</TableHead>
            <TableHead className="text-[17px]">Ai khai, lúc nào</TableHead>
            <TableHead className="w-56 text-[17px]">Quyết</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {n.dong.map((d) => (
            <HangKhangDinh
              key={d.assertionId}
              dong={d}
              chon={daChon.has(d.assertionId)}
              // Đánh dấu ĐÚNG DÒNG: nói cụm ở đầu nhóm rồi để tám dòng y hệt nhau bên dưới là
              // bắt người vận hành tự dò — và đó là điều kiện đủ để bấm nhầm.
              dungDo={trongCum.has(d.assertionId)}
              onChon={(chon) => onChonMot(d.assertionId, chon)}
            />
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

function HangKhangDinh({
  dong: d,
  chon,
  dungDo = false,
  onChon,
}: {
  dong: DongChoDuyet;
  chon: boolean;
  /** Dòng này nằm trong một cụm đụng độ đơn trị — chỉ một trong cụm lên chính thức được. */
  dungDo?: boolean;
  onChon: (chon: boolean) => void;
}) {
  const [dangDuyet, batDauDuyet] = useTransition();
  const [loiDuyet, setLoiDuyet] = useState<string | null>(null);
  const [ketQuaTraLai, traLaiAction, dangTraLai] = useActionState(traLaiKhangDinh, null);

  const duyet = () =>
    batDauDuyet(async () => {
      setLoiDuyet(null);
      try {
        const ketQua = await duyetKhangDinh(d.assertionId);
        if (!ketQua.ok) setLoiDuyet(loiRaCau(ketQua.error));
        // Thành công thì revalidatePath đã chạy — dòng tự rời bảng, không cần báo gì thêm.
      } catch {
        setLoiDuyet('Không gửi được lên máy chủ. Kiểm tra mạng rồi thử lại.');
      }
    });

  return (
    <TableRow>
      <TableCell className="align-top">
        <label className="flex min-h-11 min-w-11 items-center justify-center">
          <Checkbox
            checked={chon}
            onCheckedChange={(v) => onChon(v === true)}
            // Nhãn theo NỘI DUNG, không theo tên người: trong một nhóm mọi dòng cùng một người,
            // nên nhãn cũ đọc lên giống hệt nhau bốn lần.
            aria-label={`Chọn: ${d.cau}`}
          />
        </label>
      </TableCell>
      {/*
        `whitespace-normal` — MÓN HOÃN của code review 6-3, nay đến hạn (`deferred-work.md`:
        *"đó là màn của 6-8, story sắp dựng lại chính hàng chờ ấy"*).

        `TableCell` TỪNG mang `whitespace-nowrap` (tới story 7-2, 29/08/2026), nên `max-w-[42ch]`
        và `max-w-[32ch]` viết ra ở story 3-3 CHƯA TỪNG có hiệu lực: câu của một khẳng định và
        xuất xứ do người gõ tay là văn xuôi dài tuỳ ý. Đo được ngay lượt soi đầu của 6-8: bảng
        rộng 1239 trong hộp 972, phải cuộn ngang mới đọc hết. Nay `TableCell` không còn nowrap;
        `whitespace-normal` giữ lại như một lời khai rõ ý, và `break-words` cho một URL/email
        dán vào không đẩy bảng ra ngoài hộp.
      */}
      <TableCell className="align-top whitespace-normal">
        <p className="max-w-[42ch] break-words text-[17px]">{d.cau}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <ChamTinCay muc={d.tinCay} />
          {/* Dấu của dòng đụng độ — CHỮ, không chỉ màu (`EXPERIENCE.md § Accessibility Floor`). */}
          {dungDo ? (
            <span className="rounded-sm border border-destructive px-1.5 text-[15px] text-destructive">
              chọi với một giá trị khác
            </span>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="align-top whitespace-normal">
        <p className="max-w-[32ch] break-words text-[17px]">{d.nguon}</p>
      </TableCell>
      {/* Ô THỨ BA của món hoãn 6-3 — bản vá đầu sót nó, và `deferred-work.md` đã kịp đánh dấu ✅.
          `nguoiKhai` là `authUser.name`: chữ người dùng tự gõ, dài tuỳ ý. */}
      <TableCell className="max-w-[24ch] break-words align-top text-[17px] whitespace-normal">
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
