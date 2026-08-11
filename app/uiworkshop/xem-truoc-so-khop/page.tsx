/**
 * XEM TRƯỚC SO KHỚP — màn quyết định của bề mặt B.
 *
 * Spine chi phối:
 *   · EXPERIENCE.md § Component Patterns › Bảng xem trước so khớp (ba trạng thái, cảnh báo
 *     chèn trong dòng, không cái nào chọn sẵn, bộ lọc)
 *   · EXPERIENCE.md § Information Architecture › Bề mặt B ("Cảnh báo không có màn riêng")
 *   · EXPERIENCE.md § Key Flows — Luồng 2, bước 5–7
 *   · DESIGN.md § Colors › Cảnh báo là chàm mực, § Colors › Bề mặt B
 *
 * FR: FR-51 (nạp khung) · FR-48 (gợi ý chứ không tự gộp) · FR-63 (gốc tạm) · FR-39 (ghi công)
 *
 * ĐÂY LÀ CHỖ DUY NHẤT CHẶN ĐƯỢC BẢN TRÙNG RẺ TIỀN. Sau khi ghi, gỡ hai cụ đã gộp nhầm ra khỏi
 * nhau là việc của FR-48 và tốn gấp nhiều lần. Nên màn này thà bắt dừng lại còn hơn cho trôi.
 *
 * VÌ SAO CẢNH BÁO NẰM DƯỚI DÒNG chứ không thành màn riêng: người vận hành quyết định về MỘT DÒNG
 * cụ thể, và mọi thứ cần để quyết — dòng trong file, ứng viên trùng, đời + chi của ứng viên —
 * phải nằm trong cùng một tầm mắt. Xem EXPERIENCE.md § Bề mặt B, sửa 11/08/2026.
 *
 * Ba section: (1) ngày 0 — trạng thái chuẩn; (2) đợt nạp sau, khi đã có người để khớp;
 * (3) cùng bảng ngày 0 nhưng lọc "Cần xem lại" — thứ thay cho màn bảng cảnh báo.
 */
import { Fragment } from 'react';
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
import { ThanhBanDuyet } from '@/components/pha/thanh-ban-duyet';
import {
  DONG_KHUNG,
  DONG_KHUNG_DOT_SAU,
  TEN_FILE_KHUNG,
  TEN_FILE_DOT_SAU,
  NGUOI,
  MANH,
  demTrangThai,
  demCanXemLai,
  doiCua,
  maChiCua,
  type DongKhung,
} from '../_mock/seed';

type Loc = 'tat-ca' | 'nguoi-moi' | 'khop' | 'can-xem-lai';

function nam(d: DongKhung): string {
  if (d.namSinh && d.namMat) return `${d.namSinh}–${d.namMat}`;
  if (d.namMat) return `mất ${d.namMat}`;
  if (d.namSinh) return `sinh ${d.namSinh}`;
  return 'chưa biết năm';
}

/** Người đã có trong phả, vẽ theo luật BỀ MẶT A — đây là khẳng định về người thật. */
function TheNguoiTrongPha({ id }: { id: string }) {
  const n = NGUOI.find((x) => x.id === id);
  if (!n) return null;
  const tonNghi = n.tang === 'ton-nghi';
  return (
    <div
      className={[
        'rounded-md border px-3.5 py-2.5',
        // Tồn nghi khác CHẤT LIỆU, không khác độ đậm: nét đứt + vân chéo, chữ vẫn đủ tương phản.
        tonNghi ? 'van-ton-nghi border-dashed border-tin-ton-nghi' : 'border-border bg-card',
      ].join(' ')}
    >
      <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">{n.hoTen}</p>
      {/* Đời + chi là BẮT BUỘC, y như màn "không tìm thấy" của bề mặt A và vì cùng một lý do:
          trùng tên là chuyện thường trong một dòng họ, và gộp nhầm hai cụ làm hỏng phả cả chi. */}
      <p className="mt-0.5 text-[15px] text-muted-foreground">
        đời {doiCua(n.id)} · chi {maChiCua(n.id)}
        {n.namMat ? ` · mất ${n.namMat}` : ''}
      </p>
      <p className="mt-0.5 text-[15px] text-muted-foreground">
        {MANH.find((m) => m.id === n.manhId)?.nhan}
      </p>
    </div>
  );
}

/** Khối cảnh báo — chàm mực, luôn kèm chữ nói rõ bot thấy gì (không mã hoá chỉ bằng màu). */
function KhoiCanhBao({ dong, tatCa }: { dong: DongKhung; tatCa: DongKhung[] }) {
  const cb = dong.canhBao;
  if (!cb) return null;

  return (
    <div className="border-l-4 border-destructive bg-canh-bao-nen px-5 py-4">
      {cb.loai === 'loi-so-khop' ? (
        <>
          <p className="text-[17px] font-semibold text-destructive">Không tìm thấy người cha</p>
          <p className="mt-1 max-w-[70ch] text-[17px]">
            Dòng này khai cha là{' '}
            <span className="font-[family-name:var(--font-pha)]">{cb.tenChaKhongThay}</span>, nhưng
            không có ai tên ấy — cả trong file lẫn trong phả.
          </p>
          <p className="mt-1 max-w-[70ch] text-[17px] text-muted-foreground">
            Ghi vẫn được:{' '}
            <span className="font-[family-name:var(--font-pha)]">{dong.hoTen}</span> sẽ thành gốc
            tạm của một mảnh mới, ghi rõ là <em>cụ xa nhất hiện biết</em> của mảnh ấy. Nối vào cây
            chung được, sau — khi có ai truy ra đời trên.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button type="button" variant="outline" className="h-11 text-[17px]">
              Vẫn ghi — thành mảnh mới
            </Button>
            <Button type="button" variant="ghost" className="h-11 text-[17px]">
              Để lại dòng này
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-[17px] font-semibold text-destructive">Có thể đã có trong phả</p>

          {/* Ứng viên là DÒNG KHÁC trong chính file — ca rất thường của file điền tay, khi hai
              người kể cùng nhắc tới một cụ. */}
          {cb.ungVienDong.map((stt) => {
            const khac = tatCa.find((d) => d.stt === stt);
            if (!khac) return null;
            return (
              <p key={stt} className="mt-1 max-w-[70ch] text-[17px]">
                Dòng {stt} trong chính file này cũng là{' '}
                <span className="font-[family-name:var(--font-pha)]">{khac.hoTen}</span>, {nam(khac)}
                . Nguồn khác nhau: <em>{dong.nguon}</em> và <em>{khac.nguon}</em>.
              </p>
            );
          })}

          {/* Ứng viên đã có trong phả — bày ra kèm đời + chi + mảnh. */}
          {cb.ungVienIds.length > 0 ? (
            <>
              <p className="mt-1 max-w-[70ch] text-[17px]">
                Trong phả đang có {cb.ungVienIds.length} người trùng tên và trùng năm mất:
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {cb.ungVienIds.map((id) => (
                  <div key={id} className="w-[300px]">
                    <TheNguoiTrongPha id={id} />
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2 h-11 w-full text-[17px]"
                    >
                      Là cùng cụ này
                    </Button>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {/* KHÔNG cái nào được chọn sẵn — bot chọn sẵn là bot đã quyết hộ (FR-48). */}
          <div className="mt-3 flex flex-wrap gap-3">
            {cb.ungVienDong.length > 0 ? (
              <Button type="button" variant="outline" className="h-11 text-[17px]">
                Là cùng một người — gộp hai dòng
              </Button>
            ) : null}
            <Button type="button" variant="ghost" className="h-11 text-[17px]">
              Là người khác — ghi thành người mới
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function OSoKhop({ dong }: { dong: DongKhung }) {
  if (dong.trangThai === 'khop' && dong.khopVoiId) {
    const n = NGUOI.find((x) => x.id === dong.khopVoiId);
    return (
      <>
        <p className="text-[17px]">Khớp người có sẵn</p>
        <p className="mt-0.5 text-[15px] text-muted-foreground">
          <span className="font-[family-name:var(--font-pha)]">{n?.hoTen}</span> · đời{' '}
          {doiCua(dong.khopVoiId)} · chi {maChiCua(dong.khopVoiId)}
        </p>
      </>
    );
  }
  if (dong.trangThai === 'nghi-trung') {
    return (
      <>
        <p className="text-[17px] font-semibold text-destructive">Nghi trùng</p>
        <p className="mt-0.5 text-[15px] text-muted-foreground">xem ngay dưới dòng</p>
      </>
    );
  }
  return (
    <>
      <p className="text-[17px]">Người mới</p>
      <p className="mt-0.5 text-[15px] text-muted-foreground">chưa có ai trùng</p>
    </>
  );
}

function ChipLoc({ dong, loc }: { dong: DongKhung[]; loc: Loc }) {
  const muc: { key: Loc; nhan: string; so: number }[] = [
    { key: 'tat-ca', nhan: 'Tất cả', so: dong.length },
    { key: 'nguoi-moi', nhan: 'Người mới', so: demTrangThai(dong, 'nguoi-moi') },
    { key: 'khop', nhan: 'Khớp người có sẵn', so: demTrangThai(dong, 'khop') },
    // Mục cuối thay cho "màn bảng cảnh báo": cùng một bảng, cùng dữ liệu, lọc lại.
    { key: 'can-xem-lai', nhan: 'Cần xem lại', so: demCanXemLai(dong) },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {muc.map((m) => {
        const dangMo = m.key === loc;
        const canhBao = m.key === 'can-xem-lai' && m.so > 0;
        return (
          <button
            key={m.key}
            type="button"
            aria-pressed={dangMo}
            className={[
              'min-h-11 rounded-md border px-3.5 text-[17px]',
              dangMo ? 'border-foreground bg-ban-o font-semibold' : 'border-ban-vien bg-ban-o',
              canhBao && !dangMo ? 'text-destructive' : '',
            ].join(' ')}
          >
            {m.nhan} <span className="text-muted-foreground">({m.so})</span>
          </button>
        );
      })}
    </div>
  );
}

function BangXemTruoc({
  dong,
  tatCa,
  loc,
}: {
  dong: DongKhung[];
  tatCa: DongKhung[];
  loc: Loc;
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-md border border-ban-vien bg-ban-o">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12" />
            <TableHead className="w-14 text-[15px]">Dòng</TableHead>
            <TableHead className="text-[15px]">Người</TableHead>
            <TableHead className="text-[15px]">Nối vào</TableHead>
            <TableHead className="text-[15px]">So khớp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dong.map((d) => (
            // Cảnh báo là một HÀNG RIÊNG ngay dưới, không phải một cột: nó cần cả bề ngang bảng
            // để bày ứng viên kèm đời + chi, và nó thuộc về đúng dòng ấy chứ không phải màn khác.
            <Fragment key={d.stt}>
              <TableRow className="align-top">
                <TableCell className="py-3">
                  {/* Dòng có cảnh báo KHÔNG được tích sẵn — không phải vì máy đã quyết thay, mà
                      vì ghi hàng loạt không được cuốn theo một dòng chưa ai nhìn tới. */}
                  <Checkbox defaultChecked={!d.canhBao} aria-label={`Chọn dòng ${d.stt}`} />
                </TableCell>
                <TableCell className="py-3 text-[17px] text-muted-foreground">{d.stt}</TableCell>
                <TableCell className="py-3">
                  {/* Tên người = khẳng định về người thật ⇒ luật bề mặt A: serif-phả. */}
                  <p className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                    {d.hoTen}
                  </p>
                  <p className="mt-0.5 text-[15px] text-muted-foreground">
                    {d.gioiTinh} · {nam(d)}
                  </p>
                  <p className="mt-0.5 text-[15px] text-muted-foreground">{d.nguon}</p>
                </TableCell>
                <TableCell className="py-3">
                  {d.tenCha ? (
                    <p className="text-[17px]">
                      <span className="text-muted-foreground">cha </span>
                      <span className="font-[family-name:var(--font-pha)]">{d.tenCha}</span>
                    </p>
                  ) : null}
                  {d.voChongCua ? (
                    <p className="text-[17px]">
                      <span className="text-muted-foreground">vợ/chồng của </span>
                      <span className="font-[family-name:var(--font-pha)]">{d.voChongCua}</span>
                    </p>
                  ) : null}
                  {!d.tenCha && !d.voChongCua ? (
                    <p className="text-[17px] text-muted-foreground">chưa truy được đời trên</p>
                  ) : null}
                </TableCell>
                <TableCell className="py-3">
                  <OSoKhop dong={d} />
                </TableCell>
              </TableRow>

              {d.canhBao ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="p-0">
                    <KhoiCanhBao dong={d} tatCa={tatCa} />
                  </TableCell>
                </TableRow>
              ) : null}
            </Fragment>
          ))}
        </TableBody>
      </Table>

      {loc === 'can-xem-lai' && dong.length === 0 ? (
        <p className="px-5 py-6 text-[17px] text-muted-foreground">
          Không dòng nào cần xem lại.
        </p>
      ) : null}
    </div>
  );
}

function DauTrang({
  tenFile,
  soDong,
  soGhi,
}: {
  tenFile: string;
  soDong: number;
  soGhi: number;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[23px] font-semibold">Xem trước so khớp</h1>
        <p className="mt-1 text-[17px] text-muted-foreground">
          {tenFile} · {soDong} dòng · mọi dòng ghi vào Tầng tồn nghi
        </p>
      </div>
      <div className="flex items-center gap-3">
        {/* Son = đã chốt. Ghi vào phả đúng là hành động chốt, nên đây là chỗ son thuộc về. */}
        <Button type="button" className="h-11 text-[17px]">
          Ghi {soGhi} dòng đã chọn vào phả
        </Button>
        <Button type="button" variant="ghost" className="h-11 text-[17px]">
          Bỏ file này
        </Button>
      </div>
    </div>
  );
}

const canXemLai = DONG_KHUNG.filter((d) => d.canhBao);

export default function Page() {
  return (
    <div className="min-h-screen bg-ban-nen">
      <ThanhBanDuyet hienTai="xem-truoc" />

      <main className="mx-auto max-w-[1280px] px-6 py-10">
        {/* ── Ngày 0 — trạng thái chuẩn ─────────────────────────────────────── */}
        <DauTrang
          tenFile={TEN_FILE_KHUNG}
          soDong={DONG_KHUNG.length}
          soGhi={DONG_KHUNG.length - canXemLai.length}
        />

        <div className="mt-6">
          <ChipLoc dong={DONG_KHUNG} loc="tat-ca" />
        </div>

        {/* Ngày 0 nên KHÔNG dòng nào khớp người có sẵn — con số 0 trên chip là sự thật của ngày
            đầu, không phải lỗi. Nói ra để người vận hành không đi tìm cái không có. */}
        <p className="mt-3 max-w-[70ch] text-[17px] text-muted-foreground">
          Phả còn trống nên chưa dòng nào khớp người có sẵn. Hai dòng cần xem lại đều lộ ra từ
          chính file: một cụ được hai người kể nhắc tới, và một người cha chưa ai chép vào.
        </p>

        <BangXemTruoc dong={DONG_KHUNG} tatCa={DONG_KHUNG} loc="tat-ca" />

        {/* ── Trạng thái phụ 1: đợt nạp sau, đã có người để khớp ────────────── */}
        <hr className="my-12 border-ban-vien" />
        <p className="mb-4 text-[15px] uppercase tracking-wider text-muted-foreground">
          Trạng thái phụ · đợt nạp sau, khi trong phả đã có người
        </p>
        <DauTrang
          tenFile={TEN_FILE_DOT_SAU}
          soDong={DONG_KHUNG_DOT_SAU.length}
          soGhi={DONG_KHUNG_DOT_SAU.length - DONG_KHUNG_DOT_SAU.filter((d) => d.canhBao).length}
        />
        <div className="mt-6">
          <ChipLoc dong={DONG_KHUNG_DOT_SAU} loc="tat-ca" />
        </div>
        <p className="mt-3 max-w-[70ch] text-[17px] text-muted-foreground">
          Dòng 2 là ca khó nhất: một cụ tên Đệ, mất 1954, đang có <strong>hai</strong> bản trong
          phả ở hai mảnh khác nhau. Bot bày cả hai ra và dừng lại ở đó.
        </p>
        <BangXemTruoc dong={DONG_KHUNG_DOT_SAU} tatCa={DONG_KHUNG_DOT_SAU} loc="tat-ca" />

        {/* ── Trạng thái phụ 2: bộ lọc "Cần xem lại" ────────────────────────── */}
        <hr className="my-12 border-ban-vien" />
        <p className="mb-4 text-[15px] uppercase tracking-wider text-muted-foreground">
          Trạng thái phụ · bộ lọc “Cần xem lại” — thứ thay cho màn bảng cảnh báo
        </p>
        <div className="mt-6">
          <ChipLoc dong={DONG_KHUNG} loc="can-xem-lai" />
        </div>
        <BangXemTruoc dong={canXemLai} tatCa={DONG_KHUNG} loc="can-xem-lai" />
      </main>
    </div>
  );
}
