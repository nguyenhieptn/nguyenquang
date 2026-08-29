/**
 * BỘ ĐO — cổng thứ năm. Mở trình duyệt thật, đi hết bản đăng ký màn, và ĐO.
 *
 *   npm run soi                # cả hai mươi bảy màn
 *   npm run soi -- hang-cho    # một màn
 *   npm run soi -- --be-mat A  # chỉ bề mặt điện thoại
 *
 * Cần `SOI_GOC` · `SOI_TEN` · `SOI_MK` trong môi trường — không có mặc định nào. Xem
 * `docs/van-hanh.md § Bộ đo`.
 *
 * ── Vì sao nó KHÔNG nằm trong `npm run build` ───────────────────────────────────────────────
 * Nó cần một server đang chạy, một database có dữ liệu, và một mật khẩu. Bốn cổng kia chạy trên
 * mã nguồn; cổng này chạy trên một hệ đang sống. Gắn nó vào `build` là làm `build` hỏng trên mọi
 * máy chưa dựng đủ — và một cổng hay đỏ vì lý do ngoài mã là một cổng sắp bị người ta bỏ qua.
 *
 * ── Nó chỉ ĐỌC ─────────────────────────────────────────────────────────────────────────────
 * Không lượt nào bấm một điều khiển ghi. Hai hàng rào: `scripts/soi/cam-bam.test.ts` đọc mã
 * nguồn, và số hàng `revision` đếm trước/sau mỗi lượt chạy.
 */
import { DANG_KY, type Man } from './soi/dang-ky';
import { demRevision } from './soi/dem-revision';
import {
  type BanKe,
  type KetQuaMan,
  type KetQuaPhepDo,
  demDo,
  luatPhaKhongDoi,
  veMan,
  veTongKet,
} from './soi/ban-ke';
import {
  luatLoiConsole,
  luatNhanDeTen,
  luatSanCham,
  luatSanChu,
  luatSoiRong,
  luatTranNgang,
  luatTuongPhan,
  luatDemDay,
  luatCotPhai,
} from './soi/luat';
import { docHoacDung } from './soi/moi-truong';
import { bikChanQuyen, chup, dangNhap, moMan, moTrinhDuyet } from './soi/trinh-duyet';
import * as thu from './soi/thu-so';
import { moBangXemTruoc } from './soi/xem-truoc';

function docThamSo(argv: string[]): { loc: string[]; beMat: 'A' | 'B' | null } {
  const loc: string[] = [];
  let beMat: 'A' | 'B' | null = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--be-mat') {
      const v = argv[++i];
      beMat = v === 'A' || v === 'B' ? v : null;
    } else if (!argv[i].startsWith('--')) {
      loc.push(argv[i]);
    }
  }
  return { loc, beMat };
}

/** Bước riêng của từng màn mà bản đăng ký không tự mang được (tải tệp lên chẳng hạn). */
const BUOC_RIENG: Record<string, (p: import('playwright').Page) => Promise<void>> = {
  'nap-khung': moBangXemTruoc,
};

async function doMotMan(
  p: import('playwright').Page,
  goc: string,
  m: Man,
  rong: number,
  loiConsole: string[],
): Promise<KetQuaMan> {
  const kq: KetQuaMan = { khoa: m.khoa, duong: m.duong, rong, phepDo: [] };
  const truocLoi = loiConsole.length;

  let duong = m.duong;
  if (m.giaiDuong) {
    const giai = await m.giaiDuong(p, goc);
    if (!giai) {
      kq.boQua = 'không giải được đoạn động — phả chưa có dữ liệu để mở màn này';
      return kq;
    }
    duong = giai;
    kq.duong = duong;
  }

  await moMan(p, goc, duong);

  if (m.quyen === 'quan-tri' && (await bikChanQuyen(p))) {
    kq.boQua = 'màn "Khu vực Ban tu phả" — tài khoản đang dùng không đủ quyền';
    kq.boQuaNang = true;
    return kq;
  }

  const rieng = BUOC_RIENG[m.khoa];
  if (rieng) await rieng(p);
  if (m.buoc) await m.buoc(p);

  if (m.toiThieu) {
    const n = await p.evaluate(thu.dem, m.toiThieu.chon);
    kq.phepDo.push({ phep: 'có mặt', soPhanTu: n, viPham: luatSoiRong(m.toiThieu.ten, n) });
  }

  for (const phep of m.pheDo) {
    let r: KetQuaPhepDo;
    if (phep === 'chu') {
      const so = await p.evaluate(thu.thuChu, m.pham);
      r = { phep: 'chữ', soPhanTu: so.length, viPham: luatSanChu(so) };
    } else if (phep === 'cham') {
      const so = await p.evaluate(thu.thuCham, m.pham);
      r = { phep: 'chạm', soPhanTu: so.length, viPham: luatSanCham(so) };
    } else if (phep === 'tran') {
      const so = await p.evaluate(thu.thuTran, m.pham);
      r = { phep: 'tràn', soPhanTu: 1 + so.boCuon.length, viPham: luatTranNgang(so) };
    } else if (phep === 'tuong-phan') {
      const so = await p.evaluate(thu.thuTuongPhan, m.pham);
      r = { phep: 'tương phản', soPhanTu: so.length, viPham: luatTuongPhan(so) };
    } else if (phep === 'dem-day') {
      const so = m.chonKhoiDem ? await p.evaluate(thu.thuDemDay, m.chonKhoiDem) : null;
      r = so
        ? { phep: 'đệm đáy', soPhanTu: 1, viPham: luatDemDay(so) }
        : {
            phep: 'đệm đáy',
            soPhanTu: 0,
            viPham: [
              {
                loai: 'khong-tim-thay-khoi-dem',
                moTa: `không tìm thấy khối \`${m.chonKhoiDem ?? '(chưa khai)'}\` — phép đo này đang không gác gì`,
              },
            ],
          };
    } else if (phep === 'cot-phai') {
      const so = await p.evaluate(thu.thuCotPhai, m.chonChong ?? 'aside section[aria-label]');
      r = { phep: 'cột phải', soPhanTu: so.gayDong.length + (so.chongTren === null ? 0 : 1), viPham: luatCotPhai(so) };
    } else {
      const so = m.chonNhanDeTen ? await p.evaluate(thu.thuNhanDeTen, m.chonNhanDeTen) : [];
      r = { phep: 'đè lên tên', soPhanTu: so.length, viPham: luatNhanDeTen(so) };
    }
    kq.phepDo.push(r);
  }

  const moi = loiConsole.slice(truocLoi);
  kq.phepDo.push({ phep: 'console', soPhanTu: moi.length, viPham: luatLoiConsole(moi) });

  kq.anh = await chup(p, `${m.khoa}-${rong}`);
  return kq;
}

async function chay(): Promise<number> {
  const { loc, beMat } = docThamSo(process.argv.slice(2));

  let man = DANG_KY;
  if (loc.length) man = man.filter((m) => loc.includes(m.khoa));
  if (beMat) man = man.filter((m) => m.beMat === beMat);
  if (man.length === 0) {
    console.error(`Không màn nào khớp. Khoá có thật: ${DANG_KY.map((m) => m.khoa).join(' · ')}`);
    return 1;
  }

  // Chỉ đòi tài khoản khi lượt chạy này thật sự đụng một màn cần đăng nhập.
  const canDangNhap = man.some((m) => m.quyen !== 'khach');
  const mt = docHoacDung(process.env, canDangNhap);

  const revisionTruoc = await demRevision();
  const bk: BanKe = { man: [], revisionTruoc };

  const khungNhin = [...new Set(man.flatMap((m) => m.rong))].sort((a, b) => a - b);
  for (const rong of khungNhin) {
    const cua = man.filter((m) => m.rong.includes(rong));
    if (cua.length === 0) continue;
    const khach = cua.filter((m) => m.quyen === 'khach');
    const canPhien = cua.filter((m) => m.quyen !== 'khach');
    console.log(`\n█ khung nhìn ${rong}px — ${cua.length} màn (${khach.length} công khai)`);

    const phien = await moTrinhDuyet(mt.goc, rong);
    try {
      // Màn công khai đo TRƯỚC, khi trình duyệt còn chưa có phiên nào — đúng thứ khách thật thấy.
      for (const m of khach) {
        const kq = await doMotMan(phien.p, mt.goc, m, rong, phien.loi);
        bk.man.push(kq);
        console.log(veMan(kq));
      }

      if (canPhien.length > 0) {
        const loiDangNhap = mt.danhTinh
          ? await dangNhap(phien, mt.goc, mt.danhTinh.ten, mt.danhTinh.mk)
          : 'không có SOI_TEN/SOI_MK trong môi trường';
        if (loiDangNhap) {
          for (const m of canPhien) {
            const kq = { khoa: m.khoa, duong: m.duong, rong, boQua: loiDangNhap, boQuaNang: true, phepDo: [] };
            bk.man.push(kq);
            console.log(veMan(kq));
          }
        } else {
          for (const m of canPhien) {
            const kq = await doMotMan(phien.p, mt.goc, m, rong, phien.loi);
            bk.man.push(kq);
            console.log(veMan(kq));
          }
        }
      }
    } finally {
      await phien.dongLai();
    }
  }

  bk.revisionSau = await demRevision();
  const phaDoi = luatPhaKhongDoi(bk);
  console.log(veTongKet(bk));
  for (const v of phaDoi) console.log(`  ${v.canMatNguoi ? '👁' : '✗'} ${v.moTa}`);

  const soDo = demDo(bk) + phaDoi.filter((v) => !v.canMatNguoi).length;
  if (soDo > 0) {
    console.error(`\n✗ SÀN BỊ HẠ — ${soDo} vi phạm.`);
    return 1;
  }
  console.log('\n✓ sàn giữ nguyên trên mọi màn đã đo.');
  return 0;
}

chay().then(
  (ma) => process.exit(ma),
  (e) => {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  },
);
