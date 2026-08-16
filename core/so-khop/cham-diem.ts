/**
 * CHẤM ĐIỂM ỨNG VIÊN — TẤT ĐỊNH
 *
 * Cùng đầu vào ra cùng đầu ra, mọi lần. Đó là lý do tầng này không dùng mô hình: đổi một luật thì
 * chạy lại được toàn bộ ca kiểm và thấy ngay cái gì lệch, còn `SOURCE` của khẳng định sinh ra từ
 * đây trỏ về **một luật đọc được**, không phải về "mô hình cho rằng vậy" (NFR-6).
 *
 * Hai loại tín hiệu, không được trộn:
 *   · **Luật cứng** loại thẳng ứng viên. Sai giới tính so với từ xưng hô là không phải người ấy,
 *     không phải "kém giống".
 *   · **Tín hiệu mềm** cộng điểm để xếp hạng. Không cái nào tự nó đủ để kết luận.
 *
 * Đầu ra luôn mang **cả hai cột** giống và khác. Bảng chỉ có cột giống là bảng dụ người bấm gộp —
 * ràng buộc này đã áp cho màn hợp nhất mảnh (FR-48), và nó áp y hệt ở đây.
 */

import { soTen } from './chuan-hoa';
import { bienNamSinh, tra, type QuanHe } from './xung-ho';

/**
 * Ứng viên ở dạng bộ so khớp cần — **không phải** bản ghi đầy đủ.
 *
 * Bộ so khớp không tự đọc dữ liệu; nó chấm cái được đưa vào. Nhờ thế bộ lọc bán kính riêng tư
 * (`AD-21`) nằm ở phía người gọi, và ràng buộc "chỉ so khớp người đã mất" trở thành ràng buộc
 * **cấu trúc**: không đưa người sống vào thì bộ so khớp không có cách nào nhìn thấy họ.
 */
export type UngVienTho = {
  id: string;
  hoTen: string;
  /** Tên huý — cụ trong phả thường được chép bằng tên này. */
  huy?: string;
  /** Tên hèm / tên cúng cơm. */
  tenHem?: string;
  gioiTinh: 'nam' | 'nu';
  namSinh?: number;
  namMat?: number;
  conSong: boolean;
  /** Số đời, tính sẵn phía trên theo `AD-5` (đời là dẫn xuất, không lưu). */
  doi: number;
  ketHonVaoHo?: boolean;
};

/** Một mốc người khai đưa ra: "ông nội tôi là Nguyễn Quang Thuyết, mất 1954". */
export type MocKhai = {
  quanHe: QuanHe;
  hoTen?: string;
  namSinh?: number;
  namMat?: number;
  /** Năm sinh của chính người khai — mốc để kiểm biên năm. Thiếu thì bỏ qua luật năm. */
  namSinhNguoiKhai?: number;
};

export type MucChacChan = 'cao' | 'vua' | 'thap';

export type UngVienChamDiem = {
  nguoiId: string;
  /** 0..100. Số để **xếp hạng**, không phải để tự quyết. */
  diem: number;
  chacChan: MucChacChan;
  giongNhau: string[];
  khacNhau: string[];
};

export type BiLoai = {
  nguoiId: string;
  /** Luật cứng nào loại người này. Bày ra được — người duyệt cần soát được cả cái đã bị loại. */
  lyDo: string;
};

/**
 * Luật cứng. Trả về lý do loại, hoặc `null` nếu ứng viên đi tiếp.
 *
 * Thứ tự có chủ ý: kiểm cái rẻ và chắc chắn nhất trước.
 */
export function luatCung(moc: MocKhai, uv: UngVienTho): string | null {
  const xh = tra(moc.quanHe);

  // Người sống không bao giờ là ứng viên: FR-37 và AD-13 chưa tính được bán kính cho một người
  // vừa đăng ký (họ chưa có node), nên mặc định là nhánh chặt nhất.
  if (uv.conSong) return 'Người còn sống — không đưa vào so khớp tự động (FR-37, AD-13)';

  if (xh.gioiTinh && uv.gioiTinh !== xh.gioiTinh) {
    return `Từ xưng hô ép giới tính ${xh.gioiTinh === 'nam' ? 'nam' : 'nữ'}, ứng viên là ${uv.gioiTinh === 'nam' ? 'nam' : 'nữ'}`;
  }

  if (xh.huyetThong && uv.ketHonVaoHo) {
    return 'Từ xưng hô chỉ người mang huyết thống, ứng viên là người kết hôn vào họ';
  }
  if (!xh.huyetThong && xh.ben === 'noi' && !uv.ketHonVaoHo) {
    return 'Từ xưng hô chỉ người kết hôn vào họ, ứng viên mang huyết thống';
  }

  if (moc.namSinhNguoiKhai !== undefined && uv.namSinh !== undefined) {
    const bien = bienNamSinh(xh.doiLech);
    const lech = moc.namSinhNguoiKhai - uv.namSinh;
    if (lech < bien.toiThieu || lech > bien.toiDa) {
      return `Cách người khai ${lech} năm — ngoài biên hợp lý ${bien.toiThieu}–${bien.toiDa} năm cho quan hệ này`;
    }
  }

  if (moc.namMat !== undefined && uv.namMat !== undefined && moc.namMat !== uv.namMat) {
    // Năm mất là mốc người ta nhớ chắc (giỗ hằng năm). Lệch năm mất là tín hiệu loại, không phải
    // tín hiệu trừ điểm — trừ khi một bên bỏ trống.
    return `Năm mất khác nhau: người khai nói ${moc.namMat}, phả ghi ${uv.namMat}`;
  }

  return null;
}

/** Tín hiệu mềm. Chỉ chạy sau khi ứng viên đã qua luật cứng. */
export function tinHieuMem(moc: MocKhai, uv: UngVienTho): UngVienChamDiem {
  const giongNhau: string[] = [];
  const khacNhau: string[] = [];
  let diem = 0;

  if (moc.hoTen) {
    const t = soTen(moc.hoTen, uv.hoTen, [uv.huy, uv.tenHem].filter((x): x is string => !!x));
    diem += t.diem * 60;
    giongNhau.push(...t.giong);
    khacNhau.push(...t.khac);
  } else {
    khacNhau.push('Người khai không nhớ tên — chỉ định vị được bằng đời và năm');
  }

  if (moc.namMat !== undefined && uv.namMat !== undefined && moc.namMat === uv.namMat) {
    diem += 25;
    giongNhau.push(`Cùng năm mất ${uv.namMat}`);
  } else if (moc.namMat !== undefined && uv.namMat === undefined) {
    khacNhau.push(`Người khai nhớ năm mất ${moc.namMat}; phả không ghi`);
  } else if (moc.namMat === undefined && uv.namMat !== undefined) {
    khacNhau.push(`Phả ghi mất ${uv.namMat}; người khai không nhớ`);
  }

  if (moc.namSinh !== undefined && uv.namSinh !== undefined) {
    const lech = Math.abs(moc.namSinh - uv.namSinh);
    if (lech === 0) {
      diem += 15;
      giongNhau.push(`Cùng năm sinh ${uv.namSinh}`);
    } else if (lech <= 3) {
      diem += 6;
      giongNhau.push(`Năm sinh lệch ${lech} năm (${moc.namSinh} và ${uv.namSinh}) — phả cũ hay lệch vài năm`);
    } else {
      khacNhau.push(`Năm sinh lệch ${lech} năm: ${moc.namSinh} và ${uv.namSinh}`);
    }
  }

  const xh = tra(moc.quanHe);
  if (xh.mapHo) khacNhau.push(xh.mapHo);

  const lamTron = Math.max(0, Math.min(100, Math.round(diem)));
  return {
    nguoiId: uv.id,
    diem: lamTron,
    chacChan: mucChacChan(lamTron, khacNhau.length),
    giongNhau,
    khacNhau,
  };
}

/**
 * Quy điểm về ba mức.
 *
 * Ngưỡng cố ý đặt cao và **không có mức nào nghĩa là "khỏi cần hỏi"**. `cao` chỉ nghĩa là *xếp
 * đầu danh sách*, không phải *chọn sẵn* — FR-48 chốt bot gợi ý chứ không tự quyết, và một cái
 * chấm xanh đủ đậm cũng là một cách tự quyết.
 */
function mucChacChan(diem: number, soKhac: number): MucChacChan {
  if (diem >= 80 && soKhac === 0) return 'cao';
  if (diem >= 50) return 'vua';
  return 'thap';
}
