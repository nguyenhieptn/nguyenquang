/**
 * KỊCH BẢN GHI CÓ MẮT — cổng thứ sáu (story 7-1). Script DUY NHẤT trong repo được bấm nút ghi.
 *
 *   GIAPHA_CLAN_ID=<id dòng họ thử> SOI_GOC=http://<ip>:3200 SOI_TEN=thu.quan.tri.<mã> SOI_MK=… \
 *     npm run bam-thu            # cả bốn kịch bản
 *     npm run bam-thu -- k2      # một kịch bản (khoá không khớp gì ⇒ dừng, không "xanh rỗng")
 *
 * Ba rào (`scripts/bam-thu/rao.ts`) đứng trước mọi cú bấm; hụt một rào là exit 1 và không chạm gì.
 * Rào thứ ba cần ĐĂNG NHẬP mới đọc được (trang công khai không bày tên dòng họ) — đăng nhập ghi một
 * hàng `session` toàn cục, không chạm bảng nào của phả; `revision` của clan trước/sau chứng điều đó.
 * Mỗi kịch bản đo `revision` của đúng clan thử trước/sau và so với `revisionMongDoi`.
 *
 * Không nằm trong `build`, cùng lý do `soi`: cần server + DB + mật khẩu + một dòng họ thử.
 */
import { mkdirSync } from 'node:fs';
import { KICH_BAN } from './bam-thu/kich-ban';
import { raoClan, raoTaiKhoan, raoThanhTren, tenThanhVienTu, TIEN_TO_CLAN_THU } from './bam-thu/rao';
import { demRevisionCua, tenClan } from './soi/dem-revision';
import { docHoacDung } from './soi/moi-truong';
import { dangNhap, moTrinhDuyet, type Phien } from './soi/trinh-duyet';

const THU_MUC_ANH = 'var/bam-thu';

async function main(): Promise<number> {
  const gt = docHoacDung(process.env, true);
  const clanId = process.env.GIAPHA_CLAN_ID;
  if (!clanId) {
    console.error('Thiếu GIAPHA_CLAN_ID — kịch bản ghi chỉ chạy khi biết mình đang ghi vào dòng họ thử nào.');
    return 1;
  }
  const tenClanThu = await tenClan(clanId);
  const r1 = raoClan(tenClanThu);
  if (!r1.ok) { console.error(`✗ rào ${r1.rao}: ${r1.ly}`); return 1; }
  const r2 = raoTaiKhoan(gt.danhTinh?.ten);
  if (!r2.ok) { console.error(`✗ rào ${r2.rao}: ${r2.ly}`); return 1; }
  const tenQT = gt.danhTinh!.ten;
  const mk = gt.danhTinh!.mk;
  /** Mã của dòng họ thử (phần sau "Dòng họ thử ") — rào 3 buộc màn mang đúng mã ấy. */
  const maClan = (tenClanThu ?? '').slice(TIEN_TO_CLAN_THU.length).trim();
  const chon = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  const ds = KICH_BAN.filter((k) => chon.length === 0 || chon.some((c) => k.khoa.startsWith(c)));
  if (ds.length === 0) {
    console.error(`Không kịch bản nào khớp "${chon.join(' ')}" — có: ${KICH_BAN.map((k) => k.khoa).join(' · ')}`);
    return 1;
  }
  mkdirSync(THU_MUC_ANH, { recursive: true });
  /** Dấu riêng của lượt chạy — tên người mới mang dấu này, để thẻ cũ của lượt trước không làm ✓ giả. */
  const dauLuot = new Date().toISOString().slice(11, 19).replace(/:/g, '');

  const dong: string[] = [];
  let hong = 0;
  const truocTatCa = await demRevisionCua(clanId);
  for (const k of ds) {
    const ten = k.vai === 'quan-tri' ? tenQT : tenThanhVienTu(tenQT);
    let phien: Phien;
    try {
      phien = await moTrinhDuyet(gt.goc, 1280);
    } catch (e) {
      hong += 1;
      dong.push(`✗ ${k.ten}\n      không mở được trình duyệt: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }
    let dungHan = false;
    try {
      // Một lượt đăng nhập lỡ (lượt chạy đầu 29/08: K4 hụt ở cửa dù K3 vừa vào bằng đúng tài khoản
      // ấy) thì thử lại đúng MỘT lần — hai lần hụt mới là chuyện của máy chủ.
      let loi = await dangNhap(phien, gt.goc, ten, mk);
      if (loi) {
        await phien.p.waitForTimeout(1500);
        loi = await dangNhap(phien, gt.goc, ten, mk);
      }
      if (loi) throw new Error(loi);
      // Rào 3 — đọc màn SAU đăng nhập: bề mặt B bày "<tên> · <vai>" ở thanh trên; bề mặt A bày tên
      // người đang đứng ở tâm. Cả hai phải mang họ thử VÀ đúng mã của clan mà GIAPHA_CLAN_ID trỏ —
      // hai dòng họ thử cùng lúc (3200 · 3300) thì mã là thứ duy nhất phân biệt.
      await phien.p.goto(`${gt.goc}${k.vai === 'quan-tri' ? '/admin' : '/gia-pha'}`, { waitUntil: 'networkidle' });
      await phien.p.waitForTimeout(800);
      const r3 = raoThanhTren((await phien.p.locator('body').innerText()).replace(/\s+/g, ' '), maClan);
      if (!r3.ok) {
        hong += 1;
        dong.push(`✗ ${k.ten}\n      rào ${r3.rao}: ${r3.ly} — DỪNG, các kịch bản sau không chạy`);
        dungHan = true;
      } else {
        const truoc = await demRevisionCua(clanId);
        const cau = await k.chay(phien.p, gt.goc, dauLuot);
        const sau = await demRevisionCua(clanId);
        await phien.p.screenshot({ path: `${THU_MUC_ANH}/${k.khoa}.png`, fullPage: false });
        if (truoc === null || sau === null) {
          hong += 1;
          dong.push(`✗ ${k.ten}\n      màn: ${cau}\n      KHÔNG đếm được revision (DB / DATABASE_URL_OWNER) — kết quả không kết luận được`);
        } else if (sau - truoc !== k.revisionMongDoi) {
          hong += 1;
          dong.push(`✗ ${k.ten}\n      màn: ${cau}\n      revision +${sau - truoc} — mong đợi +${k.revisionMongDoi}`);
        } else {
          dong.push(`✓ ${k.ten}\n      màn: ${cau} · revision +${sau - truoc}`);
        }
      }
    } catch (e) {
      hong += 1;
      await phien.p.screenshot({ path: `${THU_MUC_ANH}/${k.khoa}-loi.png`, fullPage: true }).catch(() => {});
      dong.push(`✗ ${k.ten}\n      ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      await phien.dongLai();
    }
    if (dungHan) break;
  }
  const sauTatCa = await demRevisionCua(clanId);
  console.log(`\n█ kịch bản ghi — ${ds.length} kịch bản trên dòng họ thử "${tenClanThu}"\n`);
  for (const d of dong) console.log(`  ${d}`);
  console.log(`\n  revision ${truocTatCa ?? '?'} → ${sauTatCa ?? '?'} · ảnh: ${THU_MUC_ANH}/`);
  console.log(hong === 0 ? '\n✓ mọi nút ghi nói đúng điều nó làm.' : `\n✗ ${hong} kịch bản hỏng.`);
  return hong === 0 ? 0 : 1;
}

main().then(
  (ma) => process.exit(ma),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
