'use client';

/**
 * CÂY — LỚP TẢI ĐỘNG. Cổng duy nhất mà các màn được phép đi qua để dùng cây.
 *
 * Spine chi phối: EXPERIENCE.md § Responsive & Platform — "phần giấu phải giấu THẬT, kể cả JS"
 *                 PRD NFR-5 (điện thoại tầm trung, 4G ở quê)
 *
 * ── VÌ SAO PHẢI CÓ FILE NÀY ─────────────────────────────────────────────────────────────────
 * `hidden md:block` là **CSS**, không phải điều kiện dựng. Bọc cây bằng nó thì trên điện thoại
 * React Flow VẪN tải về, VẪN render ở server, VẪN hydrate — cho một cái cây không ai nhìn thấy.
 * Đo trên bản production: một chi 725 KB so với 552 KB của màn không có cây (+177 KB thô, ~57 KB
 * nén). Qua lớp này còn 557 KB, tức +5 KB. Trên 4G ở quê, 57 KB cộng công hydrate là 1–2 giây
 * trả cho hư không — đúng thứ NFR-5 dựng ra để chặn.
 *
 * ── NGƯỠNG ──────────────────────────────────────────────────────────────────────────────────
 * 768px = `md` của Tailwind. PHẢI trùng breakpoint mà màn dùng để ẩn/hiện khối cây, nếu không sẽ
 * có một dải bề rộng mà khối hiện ra nhưng cây không bao giờ tới.
 *
 * Ba tầng đi qua CÙNG một cổng để luật chỉ nằm ở một chỗ. Thêm một tầng cây mới thì thêm một
 * `dynamic(...)` ở đây, đừng import thẳng component cây trong màn.
 */
import dynamic from 'next/dynamic';
import { CAO_KHUNG_NHIN } from './khung-cay';
import { useEffect, useState, type ComponentProps } from 'react';
import type { CapCay } from './cay-gia-pha';
import type { GocTamCay, KhoiChiCay, ManhRoiCay } from './cay-ca-toc';
import type { KhungCayAdmin as KhungCayAdminKieu } from '@/components/admin/khung-cay-admin';

/** `import type` bị xoá lúc biên dịch nên hai dòng trên KHÔNG kéo theo React Flow. */
const CayGiaPha = dynamic(() => import('./cay-gia-pha').then((m) => m.CayGiaPha), {
  ssr: false,
  loading: () => <KhungCho />,
});

const CayCaToc = dynamic(() => import('./cay-ca-toc').then((m) => m.CayCaToc), {
  ssr: false,
  loading: () => <KhungCho />,
});

/**
 * Canvas "Phả quanh mình" (story 6-10) — CHÍNH canvas của bàn tu phả, mượn nguyên.
 *
 * Nó nặng ngang hai cây kia (React Flow), và người trong họ mở `/gia-pha` bằng điện thoại là ca
 * thường — nên đi qua cùng cổng này, không import thẳng. Dưới 768px nó KHÔNG được tải: bề mặt
 * điện thoại bày vùng lân cận bằng hàng theo đời (`hang-doi-quanh-minh.tsx`), không có canvas.
 */
const KhungCayAdmin = dynamic(
  () => import('@/components/admin/khung-cay-admin').then((m) => m.KhungCayAdmin),
  { ssr: false, loading: () => <KhungCho chieuCao="h-full" /> },
);

const NGUONG_MAN_RONG = '(min-width: 768px)';

/** Giữ đúng chỗ của cây để đừng nhảy layout khi thư viện về. */
// Khung chờ phải cao BẰNG khung thật, nếu không trang nhảy một nhịp lúc cây vào chỗ.
function KhungCho({ chieuCao = CAO_KHUNG_NHIN }: { chieuCao?: string }) {
  return (
    <div
      className={`${chieuCao} flex w-full items-center justify-center rounded-md border border-border`}
    >
      <p className="text-[17px] text-muted-foreground">Đang mở cây…</p>
    </div>
  );
}

/**
 * `null` = chưa biết bề rộng (lần dựng đầu ở client). Ba trạng thái chứ không phải hai: đoán bừa
 * `false` thì máy rộng nháy một nhịp rỗng, đoán bừa `true` thì điện thoại tải mất rồi.
 */
export function useManRong(): boolean | null {
  const [manRong, setManRong] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(NGUONG_MAN_RONG);
    const doi = () => setManRong(mq.matches);
    doi();
    // Xoay máy hoặc kéo rộng cửa sổ thì cây tự tải — không bắt tải lại trang.
    mq.addEventListener('change', doi);
    return () => mq.removeEventListener('change', doi);
  }, []);
  return manRong;
}

export function CayGiaPhaTaiDong(props: {
  caps: CapCay[];
  minhId?: string;
  duongVeGoc?: string[];
  vongSonTrenDuong?: boolean;
  chieuCao?: string;
}) {
  const manRong = useManRong();
  // Điện thoại: không dựng, nên `dynamic` không bao giờ gọi tới mạng.
  if (manRong === false) return null;
  if (manRong === null) return <KhungCho chieuCao={props.chieuCao} />;
  return <CayGiaPha {...props} />;
}

export function CayCaTocTaiDong(props: {
  goc: GocTamCay;
  khoiChi: KhoiChiCay[];
  manhRoi: ManhRoiCay[];
  chiCuaMinhId?: string;
  chieuCao?: string;
}) {
  const manRong = useManRong();
  if (manRong === false) return null;
  if (manRong === null) return <KhungCho chieuCao={props.chieuCao} />;
  return <CayCaToc {...props} />;
}

export function CanvasQuanhMinhTaiDong(props: ComponentProps<typeof KhungCayAdminKieu>) {
  const manRong = useManRong();
  if (manRong === false) return null;
  if (manRong === null) return <KhungCho chieuCao="h-full" />;
  return <KhungCayAdmin {...props} />;
}
