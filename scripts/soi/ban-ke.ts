/**
 * BẢN KÊ — biến kết quả đo thành chữ người đọc được, và thành một con số quyết cổng.
 *
 * Tách khỏi runner để test được: bốn script cũ trộn phép in vào phép đo, nên không cách nào
 * khẳng định "cổng đỏ đúng lúc" mà không dựng cả một trình duyệt lên.
 */
import { DA_BIET, tachDaBiet } from './da-biet';
import type { ViPham } from './luat';
import { chiCaiLamDo } from './luat';

export type KetQuaPhepDo = {
  phep: string;
  /** Số phần tử đã soi. 0 là một tín hiệu, không phải một sự im lặng. */
  soPhanTu: number;
  viPham: ViPham[];
};

export type KetQuaMan = {
  khoa: string;
  duong: string;
  rong: number;
  /** Lý do màn này bị bỏ qua, nếu có (chưa có dữ liệu, chặn quyền…). */
  boQua?: string;
  /**
   * Bỏ qua vì HẠ TẦNG hỏng (đăng nhập không qua, quyền bị chặn) — khác hẳn bỏ qua vì phả chưa có
   * dữ liệu để mở màn. Cái sau là thông tin; cái này là cổng đang không đo gì mà vẫn xanh.
   */
  boQuaNang?: boolean;
  phepDo: KetQuaPhepDo[];
  anh?: string;
};

export type BanKe = {
  man: KetQuaMan[];
  revisionTruoc?: number | null;
  revisionSau?: number | null;
};

const DAU = { do: '✗', xanh: '✓', mat: '👁', no: '≡' };

/** Mọi vi phạm làm đỏ cổng, trước khi trừ nền đã biết. */
function moiViPhamDo(bk: BanKe): ViPham[] {
  return bk.man.flatMap((m) => m.phepDo.flatMap((p) => chiCaiLamDo(p.viPham)));
}

/**
 * Màn bị bỏ qua vì hạ tầng hỏng. Mỗi màn như thế là một khoảng cổng KHÔNG gác gì.
 *
 * Đo được 28/08: chạy vào một origin chưa khai tin, cả mười màn quản trị rơi vào nhánh "không qua
 * được màn đăng nhập" — và bản kê vẫn in `✓ sàn giữ nguyên`. Một cổng xanh vì nó không nhìn thấy
 * gì thì tệ hơn một cổng đỏ.
 */
export function demBoQuaNang(bk: BanKe): number {
  return bk.man.filter((m) => m.boQuaNang).length;
}

/** Vi phạm MỚI — cái thật sự hạ cổng. Màn bỏ qua vì hạ tầng cũng tính. */
export function demDo(bk: BanKe): number {
  return tachDaBiet(moiViPhamDo(bk)).moi.length + demBoQuaNang(bk);
}

/** Vi phạm đã ghi nợ, đếm theo từng mục của nền. */
export function demDaBiet(bk: BanKe): { muc: (typeof DA_BIET)[number]; so: number }[] {
  const { daBiet } = tachDaBiet(moiViPhamDo(bk));
  return DA_BIET.map((muc) => ({ muc, so: daBiet.filter((d) => d.muc === muc).length }));
}

export function demCanMat(bk: BanKe): number {
  return bk.man.reduce(
    (t, m) => t + m.phepDo.reduce((s, p) => s + p.viPham.filter((v) => v.canMatNguoi).length, 0),
    0,
  );
}

export function demManBoQua(bk: BanKe): number {
  return bk.man.filter((m) => m.boQua).length;
}

/**
 * Phả không được đổi vì một lượt đo. Đây là hàng rào cuối, bắt được cả cú bấm không ai lường —
 * kể cả cú bấm mà `cam-bam.test.ts` không thấy vì nó nấp sau một chọn tử động.
 */
export function luatPhaKhongDoi(bk: BanKe): ViPham[] {
  const { revisionTruoc: t, revisionSau: s } = bk;
  if (t === undefined || s === undefined || t === null || s === null) {
    return [
      {
        loai: 'khong-dem-duoc-revision',
        moTa: 'Không đếm được số hàng `revision` trước/sau — hàng rào cuối của AD-4 đang TẮT.',
        canMatNguoi: true,
      },
    ];
  }
  if (t !== s) {
    return [{ loai: 'pha-bi-doi', moTa: `revision ${t} → ${s}: lượt ĐO đã GHI vào phả. Đây là lỗi nặng nhất bộ đo có thể mắc.` }];
  }
  return [];
}

export function veMan(m: KetQuaMan): string {
  const dong: string[] = [];
  const dau = `── ${m.duong} @${m.rong}px ${'─'.repeat(Math.max(2, 52 - m.duong.length - String(m.rong).length))}`;
  dong.push(dau);
  if (m.boQua) {
    dong.push(`  ${m.boQuaNang ? DAU.do + ' BỎ QUA (hạ tầng)' : '⊘ bỏ qua'} — ${m.boQua}`);
    return dong.join('\n');
  }
  for (const p of m.phepDo) {
    const { moi, daBiet } = tachDaBiet(chiCaiLamDo(p.viPham));
    const mat = p.viPham.filter((v) => v.canMatNguoi);
    const phan = [
      moi.length ? `${DAU.do} ${moi.length} MỚI` : null,
      daBiet.length ? `${DAU.no} ${daBiet.length} đã ghi nợ` : null,
    ].filter(Boolean);
    const trangThai = phan.length ? phan.join(' · ') : `${DAU.xanh}`;
    dong.push(`  ${p.phep.padEnd(12)} ${String(p.soPhanTu).padStart(4)} phần tử · ${trangThai}`);
    for (const v of moi) dong.push(`      ${DAU.do} ${v.moTa}`);
    for (const v of mat) dong.push(`      ${DAU.mat} ${v.moTa}`);
  }
  if (m.anh) dong.push(`  ảnh: ${m.anh}`);
  return dong.join('\n');
}

export function veTongKet(bk: BanKe): string {
  const do_ = demDo(bk);
  const mat = demCanMat(bk);
  const boQua = demManBoQua(bk);
  const dong = [
    '',
    '═'.repeat(60),
    `Đo ${bk.man.length} lượt (màn × khung nhìn) · bỏ qua ${boQua}`,
    `${do_ === 0 ? DAU.xanh : DAU.do} ${do_} vi phạm MỚI — cái hạ cổng`,
    ...(demBoQuaNang(bk) > 0
      ? [`${DAU.do} ${demBoQuaNang(bk)} màn KHÔNG đo được vì hạ tầng — cổng không gác gì ở đó`]
      : []),
    `${DAU.mat} ${mat} mục cần mắt người — KHÔNG hạ cổng, nhưng cũng không được quên`,
  ];
  /**
   * In số đếm TỪNG mục của nền, không in một tổng.
   *
   * Một tổng thì che được chuyện quan trọng nhất: một mục đã biết mà đếm TĂNG lên là một hồi quy
   * mới đang nấp sau một miễn trừ cũ. Đếm riêng thì nó nhìn thấy được.
   */
  const no = demDaBiet(bk).filter((d) => d.so > 0);
  if (no.length) {
    dong.push(`${DAU.no} nợ đã ghi — KHÔNG hạ cổng, nhưng đếm phải đứng yên:`);
    for (const d of no) dong.push(`    ${String(d.so).padStart(4)} × ${d.muc.moTa}  → ${d.muc.theoDoi}`);
  }
  if (bk.revisionTruoc != null && bk.revisionSau != null) {
    const doi = bk.revisionTruoc !== bk.revisionSau;
    dong.push(`${doi ? DAU.do : DAU.xanh} revision ${bk.revisionTruoc} → ${bk.revisionSau}${doi ? ' — PHẢ BỊ ĐỔI' : ' — phả không đổi'}`);
  }
  return dong.join('\n');
}
