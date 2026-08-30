'use client';

/**
 * PHẢ QUANH MÌNH — chốt nối phía client (story 6-10): người đang chọn · phiếu · biểu mẫu.
 *
 * Anh em với `app/admin/cay/cay-client.tsx`, và cố ý GỌN HƠN nó ở ba chỗ:
 *   · không phím tắt — `EXPERIENCE.md § Interaction Primitives`: *"Bề mặt B được dùng chọn hàng
 *     loạt và phím tắt; bề mặt A thì không"*;
 *   · không panel duyệt vào phả, không Nâng/Loại — duyệt là việc ở `/admin`;
 *   · hai hình cho hai khung: canvas + cột phải trên máy, hàng theo đời + tấm phiếu trên điện
 *     thoại. Cùng MỘT trạng thái (người đang chọn, hồ sơ) cho cả hai — đổi khung không mất chỗ.
 *
 * Luật giữ nguyên từ 5-2/5-3: neo ở URL, người đang chọn KHÔNG ở URL (mỗi cú bấm một lượt điều
 * hướng là canvas chớp tắt); `push` cho neo, `replace` cho bán kính.
 *
 * `components/` không biết `next/navigation` lẫn `@/core/*`; việc dịch và điều hướng nằm ở đây.
 */
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Crosshair, UserRoundPlus } from 'lucide-react';
import type { NutCanvas } from '@/components/admin/khung-cay-admin';
import { CotKhangDinh, type HoSoPanel } from '@/components/admin/cot-khang-dinh';
import { BieuMauThemNguoi } from '@/components/admin/bieu-mau-them-nguoi';
import { camNutTam, type HuongThem } from '@/components/admin/dat-nut-tam';
import { CanvasQuanhMinhTaiDong, useManRong } from '@/components/pha/cay-tai-dong';
import { HangDoiQuanhMinh } from '@/components/pha/hang-doi-quanh-minh';
import { TamPhieu } from '@/components/pha/tam-phieu';
import {
  ghiThemKhangDinh,
  ghiThemNoi,
  ghiThemQuanHe,
  taoNoi,
  themNguoi,
  timNguoi,
  timNoi,
  xemHoSo,
} from '../actions';

/** "18/03/2026" — ngày đủ dùng; giờ phút là nhiễu trên một cột 360px. */
function ngay(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('vi-VN');
}

const DUONG = '/gia-pha';

export function QuanhMinhClient({
  neoId,
  banKinh,
  canKiet,
  nut,
  minhId,
  moPhieuNgay,
}: {
  neoId: string;
  banKinh: number;
  canKiet: boolean;
  nut: NutCanvas[];
  /** Node của chính người xem — nhãn "mình". */
  minhId: string | null;
  /**
   * Mở sẵn tấm phiếu của neo (điện thoại) — `?phieu=mo`. Chỉ một ca dùng: vừa thêm một người
   * xong và dời tâm sang họ. Trên máy cột phải luôn mở nên không cần; trên điện thoại thì không
   * có nó là ghi xong thấy một danh sách lặng lẽ, không biết mình vừa ghi vào đâu (AC 16).
   */
  moPhieuNgay: boolean;
}) {
  const router = useRouter();
  const manRong = useManRong();

  /** Mở màn là mở HỒ SƠ CỦA NEO — cột phải không bao giờ trắng trên máy (bài học 6-7). */
  const [chonId, setChonId] = useState<string | null>(neoId);
  /**
   * Tấm phiếu trên điện thoại MỞ hay ĐÓNG — tách khỏi `chonId`. Vào màn thì neo đã được chọn
   * sẵn (để cột phải trên máy có nội dung), nhưng trên điện thoại không được tự bật tấm phiếu
   * lên che danh sách: tấm chỉ mở sau một cú chạm có chủ ý.
   */
  const [tamMo, setTamMo] = useState(moPhieuNgay);
  const [hoSo, setHoSo] = useState<HoSoPanel | null>(null);
  const [dangTai, batDauTai] = useTransition();
  /** `null` = biểu mẫu thêm người đóng. Mở thì phiếu nhường chỗ cho biểu mẫu. */
  const [them, setThem] = useState<{ mocId: string | null; huong: HuongThem; hoTen: string } | null>(null);
  /**
   * Biểu mẫu thêm người đã BẨN chưa — ref, không state: không lượt vẽ nào cần nó, chỉ `chon()`
   * đọc nó ngay lúc bấm để hỏi trước khi gỡ một biểu mẫu đang gõ dở (bề mặt A không có `Esc` hai
   * nhịp như bàn tu phả, nên câu hỏi nằm ở đúng cú bấm sẽ làm mất chữ).
   */
  const banThem = useRef(false);

  /** Người mà phiếu ĐANG MUỐN bày — chốt hiệu lực cho lượt nạp, xem `cay-client.tsx`. */
  const dangMuon = useRef<string | null>(null);

  const napHoSo = useCallback((personId: string, batBuoc = false) => {
    if (!batBuoc && dangMuon.current === personId) return;
    dangMuon.current = personId;
    batDauTai(async () => {
      let res: Awaited<ReturnType<typeof xemHoSo>>;
      try {
        res = await xemHoSo(personId);
      } catch {
        if (dangMuon.current === personId) {
          setHoSo({ personId, hoTen: 'Không mở được hồ sơ', chong: null, loiDoc: true });
        }
        return;
      }
      if (dangMuon.current !== personId) return;
      if (!res.ok) {
        setHoSo({ personId, hoTen: 'Không mở được hồ sơ', chong: null, loiDoc: true });
        return;
      }
      const v = res.value;
      setHoSo({
        personId: v.personId,
        hoTen: v.hoTen,
        tieuSu: v.tieuSu,
        quanHe: v.quanHe,
        // `chong` vắng = NGOÀI BÁN KÍNH RIÊNG TƯ, không phải "chưa có gì" — hai câu khác nhau.
        chong:
          v.chong === undefined
            ? null
            : v.chong.map((c) => ({
                khoa: c.kind,
                nhan: c.nhan,
                kieu: c.stackKind,
                dong: c.rows.map((r) => ({
                  id: r.assertionId,
                  ...(r.doiTuongId ? { doiTuongId: r.doiTuongId } : {}),
                  giaTri: r.valueText,
                  chinhThuc: r.tier === 'official',
                  tinCay: r.confidence,
                  xuatXu: r.toldByName ? `${r.sourceDescription} (${r.toldByName})` : r.sourceDescription,
                  nguoiGhi: r.createdByName,
                  luc: ngay(r.createdAt),
                })),
              })),
      });
    });
  }, []);

  useEffect(() => {
    napHoSo(neoId);
  }, [neoId, napHoSo]);

  const chon = useCallback(
    (id: string) => {
      // Đổi người là gỡ biểu mẫu thêm người của người cũ. Có chữ gõ dở thì hỏi — trong một hệ
      // không có nút xoá, một lời khai gõ dở mất đi im lặng là thứ người ta không tha thứ.
      if (banThem.current && !window.confirm('Bỏ những gì vừa gõ trong biểu mẫu thêm người?')) return;
      setChonId(id);
      setThem(null);
      banThem.current = false;
      setTamMo(true);
      // DỌN NGAY, không đợi lượt nạp về — phiếu không được in tên A cạnh biểu mẫu ghi cho B.
      setHoSo(null);
      napHoSo(id, true);
    },
    [napHoSo],
  );

  const doiNeo = useCallback(
    (id: string) => {
      router.push(`${DUONG}?neo=${encodeURIComponent(id)}`);
    },
    [router],
  );
  const doiBanKinh = useCallback(
    (n: number) => {
      router.replace(`${DUONG}?neo=${encodeURIComponent(neoId)}&ban-kinh=${n}`);
    },
    [router, neoId],
  );

  const timNguoiOnDinh = useCallback(async (tuKhoa: string) => timNguoi(tuKhoa), []);

  /** Sau một lượt ghi: nạp lại người ĐANG BÀY LÚC NÀY (không phải lúc bấm), rồi làm mới cây. */
  const sauKhiGhi = useCallback(
    async (res: { ok: true; value: unknown } | { ok: false; error: { message: string } }): Promise<string | null> => {
      if (!res.ok) return res.error.message;
      if (dangMuon.current) napHoSo(dangMuon.current, true);
      router.refresh();
      return null;
    },
    [napHoSo, router],
  );

  const dongThem = useCallback(() => {
    setThem(null);
    banThem.current = false;
  }, []);

  const hoSoHienHanh = hoSo && hoSo.personId === chonId ? hoSo : null;
  /**
   * Tên mốc: từ canvas, và nếu mốc KHÔNG có trên hình (chọn qua chip quan hệ một người ngoài bán
   * kính đang bày) thì từ chính hồ sơ đang mở. Bản đầu chỉ tra canvas, nên ca ấy `tenMoc` là
   * `null` và biểu mẫu chỉ còn lựa chọn *"chưa biết nối vào ai"* — trong khi `mocId` vẫn được
   * gửi đi và người mới thành CON của mốc. Câu trên màn và hàng ghi xuống nói hai chuyện khác nhau
   * (sửa 29/08 sau code review).
   */
  const tenTheoId = (id: string | null) =>
    id
      ? (nut.find((n) => n.id === id)?.the.hoTen ?? (hoSoHienHanh?.personId === id ? hoSoHienHanh.hoTen : null))
      : null;
  const daThayCanhCu = them
    ? camNutTam(nut.map((n) => ({ id: n.id, chaId: n.chaId })), them.mocId, them.huong).daThayCanhCu
    : false;

  const phieu = them ? (
    <BieuMauThemNguoi
      beMat="A"
      khoa={them.mocId ?? '__roi__'}
      tenMoc={tenTheoId(them.mocId)}
      huong={them.huong}
      onDoiHuong={(h) => setThem((cu) => (cu ? { ...cu, huong: h } : cu))}
      onDoiTen={(t) => setThem((cu) => (cu ? { ...cu, hoTen: t } : cu))}
      onDoiBan={(b) => {
        banThem.current = b;
      }}
      daThayCanhCu={daThayCanhCu}
      onDong={dongThem}
      onGui={async (d) => {
        const res = await themNguoi({
          hoTen: d.hoTen,
          ...(d.gioiTinh ? { gioiTinh: d.gioiTinh } : {}),
          namSinh: d.namSinh,
          namMat: d.namMat,
          ghiChu: d.ghiChu,
          xuatXu: d.xuatXu,
          ...(them.mocId ? { mocId: them.mocId } : {}),
          huong: them.huong,
        });
        if (!res.ok) return res.error.message;
        // Ghi xong thì DỜI TÂM sang người vừa tạo — thấy ngay chỗ mình vừa ghi vào. `phieu=mo`
        // để điện thoại mở luôn tấm phiếu của họ; máy thì cột phải tự mở.
        dongThem();
        router.push(`${DUONG}?neo=${encodeURIComponent(res.value.personId)}&phieu=mo`);
        return null;
      }}
    />
  ) : (
    <>
      {/* Ba lối của phiếu, đứng TRÊN nội dung: đặt làm tâm · thêm người quanh đây · trang đầy đủ. */}
      {chonId ? (
        <div className="flex flex-wrap gap-2 border-b border-border px-5 py-3">
          <button
            type="button"
            onClick={() => chonId && setThem({ mocId: chonId, huong: 'con', hoTen: '' })}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-input px-3 text-[17px]"
          >
            <UserRoundPlus className="size-4" aria-hidden />
            Thêm người quanh đây
          </button>
          {chonId !== neoId ? (
            <button
              type="button"
              onClick={() => doiNeo(chonId)}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-input px-3 text-[17px]"
            >
              <Crosshair className="size-4" aria-hidden />
              Đặt làm tâm
            </button>
          ) : null}
          <Link
            href={`/nguoi/${chonId}`}
            className="inline-flex min-h-11 items-center px-1 text-[17px] underline underline-offset-4"
          >
            Trang đầy đủ
          </Link>
        </div>
      ) : null}
      <CotKhangDinh
        beMat="A"
        hoSo={hoSoHienHanh}
        dangTai={dangTai}
        // Hai lối duyệt không có ở bề mặt A. Truyền hàm chết là một lời nói dối với `tsc`; ở đây
        // chúng KHÔNG BAO GIỜ được gọi vì `beMat="A"` không mọc nút nào gọi chúng.
        onNangTang={async () => 'Duyệt là việc của ban tu phả.'}
        onLoai={async () => 'Duyệt là việc của ban tu phả.'}
        onGhiThem={async (loai, giaTri, xuatXu) => {
          if (!chonId) return 'Chưa chọn ai trên cây.';
          return sauKhiGhi(await ghiThemKhangDinh(chonId, loai, giaTri, xuatXu));
        }}
        onGhiNoi={async (placeId, vai, xuatXu) => {
          if (!chonId) return 'Chưa chọn ai trên cây.';
          return sauKhiGhi(await ghiThemNoi(chonId, placeId, vai, xuatXu));
        }}
        onGhiQuanHe={async (a) => {
          if (!chonId) return 'Chưa chọn ai trên cây.';
          const res = await ghiThemQuanHe({ personId: chonId, ...a });
          if (res.ok && res.value.alreadyLinked) {
            return 'Hai người này đã là vợ chồng trong phả — không ghi thêm gì.';
          }
          // Hướng "là con của" ghi lên NGƯỜI KIA: mở phiếu của họ để thấy hệ quả và lối gỡ.
          if (res.ok && a.loai === 'parent-child' && a.huong === 'con') {
            chon(a.nguoiKiaId);
            router.refresh();
            return null;
          }
          return sauKhiGhi(res);
        }}
        onTimNguoi={timNguoiOnDinh}
        onMoNguoi={chon}
        onTimNoi={async (ten, donViCha) => {
          const res = await timNoi(ten, donViCha);
          if (!res.ok) throw new Error(res.error.message);
          return res.value.map((u) => ({ placeId: u.placeId, nhan: u.nhan, muc: u.muc, vi: u.vi }));
        }}
        onTaoNoi={async (ten, donViCha) => {
          const res = await taoNoi(ten, donViCha);
          if (res.ok) return { placeId: res.value.placeId, nhan: res.value.nhan };
          const daCo = res.error.detail?.placeId;
          const nhan = res.error.detail?.nhan;
          if (res.error.code === 'conflict' && typeof daCo === 'string' && typeof nhan === 'string') {
            return { placeId: daCo, nhan };
          }
          return res.error.message;
        }}
      />
    </>
  );

  return (
    <div className="tren-giay">
      {/* ══ MÁY — canvas + cột phải ═══════════════════════════════════════════════ */}
      <div className="hidden h-[clamp(520px,calc(100dvh-13rem),1000px)] gap-4 md:flex">
        <CanvasQuanhMinhTaiDong
          neoId={neoId}
          banKinh={banKinh}
          canKiet={canKiet}
          nut={nut}
          chonId={chonId}
          onChon={chon}
          onDoiNeo={doiNeo}
          onDoiBanKinh={doiBanKinh}
          themVao={them}
          onMoThem={() => chonId && setThem({ mocId: chonId, huong: 'con', hoTen: '' })}
        />
        {manRong !== false ? (
          <aside
            className="flex w-[360px] shrink-0 flex-col overflow-y-auto rounded-md border border-border bg-card"
            aria-label="Người đang chọn"
          >
            {phieu}
          </aside>
        ) : null}
      </div>

      {/* ══ ĐIỆN THOẠI — hàng theo đời + tấm phiếu ═══════════════════════════════ */}
      <div className="md:hidden">
        <HangDoiQuanhMinh nut={nut} minhId={minhId} neoId={neoId} chonId={chonId} onChon={chon} />
        {!canKiet && banKinh < 6 ? (
          <button
            type="button"
            onClick={() => doiBanKinh(banKinh + 1)}
            className="mt-4 block w-full rounded-md border border-input px-4 py-3 text-center text-[17px]"
          >
            Mở thêm một đời
          </button>
        ) : null}
        {manRong === false ? (
          <TamPhieu
            mo={tamMo && chonId !== null}
            // Nhãn nói đúng thứ đang bày: phiếu, hay biểu mẫu thêm người.
            nhan={them ? 'Thêm người vào phả' : 'Hồ sơ'}
            onDong={() => {
              // Đóng tấm KHÔNG gỡ gì: biểu mẫu đang gõ dở ở nguyên chỗ (`TamPhieu` giấu con, không
              // gỡ), mở lại vẫn còn. Chọn người khác mới là lúc biểu mẫu cũ rời đi (`chon`).
              setTamMo(false);
            }}
          >
            {phieu}
          </TamPhieu>
        ) : null}
      </div>
    </div>
  );
}
