/**
 * SO KHỚP VỊ TRÍ — cửa vào công khai của tầng tất định.
 *
 * Người vừa đăng ký khai vài mốc ("bố tôi là…", "ông nội mất năm…"), bộ này tìm những ai trong
 * phả có thể là các mốc ấy, kèm bằng chứng hai chiều. Nó **không ghi gì** và **không quyết gì**:
 * đầu ra là một danh sách để người xác nhận, đúng khuôn `UngVienNoi` mà màn hợp nhất mảnh đã dùng.
 *
 * Ba việc bộ này cố ý KHÔNG làm:
 *   1. Không đọc dữ liệu — ứng viên do người gọi đưa vào, nên bộ lọc bán kính riêng tư (AD-21)
 *      và luật "chỉ người đã mất" nằm ở phía trên và không lách được từ đây.
 *   2. Không chọn sẵn — kể cả khi chỉ có đúng một ứng viên điểm cao (FR-48).
 *   3. Không suy ra cạnh cha–con — nó đề xuất *người*, việc nối là một khẳng định riêng có nguồn
 *      và có người chịu trách nhiệm (AD-18).
 */

import {
  luatCung,
  tinHieuMem,
  type BiLoai,
  type MocKhai,
  type UngVienChamDiem,
  type UngVienTho,
} from './cham-diem';
import { nhan, nhanDien, tra, viTriTrongPha, type HeThongDongToc, type QuanHe } from './xung-ho';

export { boDau, chuanHoa, soTen, tachTen, theoNepTen } from './chuan-hoa';
export { bienNamSinh, nhan, nhanDien, tra, viTriTrongPha } from './xung-ho';
export type { HeThongDongToc, QuanHe, ThongTinXungHo, ViTriTrongPha } from './xung-ho';
export type { BiLoai, MocKhai, MucChacChan, UngVienChamDiem, UngVienTho } from './cham-diem';

export type KetQuaMoc = {
  moc: MocKhai;
  /** Xếp hạng giảm dần theo điểm. Rỗng là kết quả hợp lệ, không phải lỗi. */
  ungVien: UngVienChamDiem[];
  /** Ai bị luật cứng loại và vì sao — người duyệt phải soát được cả phần bị loại. */
  biLoai: BiLoai[];
  /**
   * Vì sao mốc này không so khớp được **về nguyên tắc** (khác với "so rồi không thấy ai").
   * Có giá trị thì `ungVien` luôn rỗng, và giao diện phải nói lý do chứ không bày danh sách rỗng.
   */
  khongApDung?: string;
};

export type TuyChon = {
  heThong?: HeThongDongToc;
  /** Số ứng viên trả về mỗi mốc. Mặc định 5 — đủ để người chọn, ít đến mức người còn đọc hết. */
  toiDa?: number;
};

/**
 * So khớp một mốc khai với danh sách ứng viên đã lọc sẵn.
 */
export function soKhopMoc(
  moc: MocKhai,
  ungVien: UngVienTho[],
  tuyChon: TuyChon = {},
): KetQuaMoc {
  const { heThong = 'phu-he', toiDa = 5 } = tuyChon;

  // Cửa chặn rẻ nhất: người ngoài họ thì mọi ứng viên tìm được đều là trùng tên ngẫu nhiên.
  const viTri = viTriTrongPha(moc.quanHe, heThong);
  if (viTri === 'ngoai-ho') {
    const xh = tra(moc.quanHe);
    return {
      moc,
      ungVien: [],
      biLoai: [],
      // `nhan()` chứ không phải `moc.quanHe`: khoá là mã máy, nhét thẳng vào câu tiếng Việt thì
      // ra “cau là người bên ngoại”.
      khongApDung:
        `“${nhan(moc.quanHe)}” là người bên ${xh.ben === 'ngoai' ? 'ngoại' : 'nội'} — thuộc họ ` +
        `khác, không có trong cuốn phả này. Người trùng tên tìm được ở đây sẽ là người khác.`,
    };
  }

  const biLoai: BiLoai[] = [];
  const dat: UngVienChamDiem[] = [];

  for (const uv of ungVien) {
    const lyDo = luatCung(moc, uv);
    if (lyDo) {
      biLoai.push({ nguoiId: uv.id, lyDo });
      continue;
    }
    const cham = tinHieuMem(moc, uv);
    if (cham.diem > 0) dat.push(cham);
  }

  dat.sort((a, b) => b.diem - a.diem || a.nguoiId.localeCompare(b.nguoiId));

  return { moc, ungVien: dat.slice(0, toiDa), biLoai };
}

/**
 * So khớp nhiều mốc cùng lúc — luồng thật của màn đăng ký.
 *
 * Nhiều mốc mạnh hơn hẳn một mốc, và không phải vì cộng điểm: chúng **kiểm chéo** nhau. Nếu người
 * khai nói bố là X và ông nội là Y, thì cặp (X, Y) nào có Y đúng là cha của X sẽ nổi lên, còn cặp
 * trùng tên ngẫu nhiên thì không. Vòng kiểm chéo ấy là bước tiếp theo của tầng này — hiện chưa
 * dựng, và chỗ này ghi rõ để không ai tưởng đã có.
 */
export function soKhopNhieuMoc(
  moc: MocKhai[],
  ungVien: UngVienTho[],
  tuyChon: TuyChon = {},
): KetQuaMoc[] {
  return moc.map((m) => soKhopMoc(m, ungVien, tuyChon));
}

/**
 * Đọc một mốc từ chữ người khai gõ. Trả `null` khi không nhận ra từ xưng hô — người gọi bày danh
 * sách cho người khai chọn thay vì đoán.
 */
export function docMoc(chuQuanHe: string, phanConLai: Omit<MocKhai, 'quanHe'>): MocKhai | null {
  const q: QuanHe | null = nhanDien(chuQuanHe);
  return q ? { quanHe: q, ...phanConLai } : null;
}
