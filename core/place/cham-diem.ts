/**
 * Chấm điểm ứng viên NƠI — story 5-7, FR-65. Module THUẦN: không DB, không React.
 *
 * ── Vì sao KHÔNG dùng lại `soKhopMoc` ─────────────────────────────────────────────────────
 * PRD viết *"dùng lại đúng bộ máy so khớp của FR-48"*. Hiểu đúng là dùng lại **phép gấp dấu
 * AD-16** (`chuanHoa`), thứ FR-48 cũng dùng — chứ không phải `soKhopMoc` nguyên khối: hàm ấy nhận
 * một `MocKhai`, tức một mốc khai về QUAN HỆ người, có năm sinh, có hệ thống đồng tộc, có luật
 * cứng loại theo vai. Nơi không có thứ nào trong đó. Nhét nơi vào khuôn ấy là bẻ cả hai.
 *
 * Nơi chỉ có hai tín hiệu, và tín hiệu thứ hai mới là lý do FR-65 tồn tại:
 *   1. tên đã gấp dấu
 *   2. **đơn vị hành chính cha** đã gấp dấu — thứ DUY NHẤT phân biệt Quang Trung/Định Hoá với
 *      Quang Trung/Vũng Tàu
 *
 * ── Luật một dòng ────────────────────────────────────────────────────────────────────────
 * Tên khác nhau thì loại. Tên giống nhau thì **đơn vị cha quyết**. Và khác đơn vị cha là **hạ
 * điểm mạnh, KHÔNG loại** — hai "Quang Trung" phải cùng hiện ra để người nhập thấy mà chọn đúng;
 * loại đi một cái là quay lại đúng chỗ hỏng mà FR-65 sinh ra để chặn.
 */
import { chuanHoa } from '@/core/so-khop';

export type NoiTho = {
  id: string;
  nameFolded: string;
  parentUnitFolded: string;
};

export type MucChacChanNoi = 'cao' | 'vua' | 'thap';

export type UngVienNoi = {
  id: string;
  diem: number;
  muc: MucChacChanNoi;
  /** Vì sao được điểm ấy — người nhập phải soát được, không chỉ thấy một con số. */
  vi: string[];
};

const DIEM_TEN_KHIT = 100;
const DIEM_TEN_CHUA = 55;
const DIEM_CHA_KHIT = 60;
const DIEM_CHA_CHUA = 25;
/** Hạ mạnh, nhưng KHÔNG loại. Xem đầu file. */
const PHAT_CHA_KHAC = -45;

function chua(a: string, b: string): boolean {
  return a !== '' && b !== '' && (a.includes(b) || b.includes(a));
}

export function chamDiemNoi(
  ten: string,
  donViCha: string,
  ungVien: NoiTho[],
  toiDa = 5,
): UngVienNoi[] {
  const t = chuanHoa(ten);
  if (t === '') return [];
  const c = chuanHoa(donViCha);

  const ra: UngVienNoi[] = [];
  for (const u of ungVien) {
    const vi: string[] = [];
    let diem = 0;

    if (u.nameFolded === t) {
      diem += DIEM_TEN_KHIT;
      vi.push('tên trùng khít');
    } else if (chua(u.nameFolded, t)) {
      diem += DIEM_TEN_CHUA;
      vi.push('tên chứa nhau');
    } else {
      continue; // tên không dính dáng gì — không phải ứng viên
    }

    if (c !== '') {
      if (u.parentUnitFolded === c) {
        diem += DIEM_CHA_KHIT;
        vi.push('cùng đơn vị cha');
      } else if (chua(u.parentUnitFolded, c)) {
        diem += DIEM_CHA_CHUA;
        vi.push('đơn vị cha chứa nhau');
      } else if (u.parentUnitFolded === '') {
        // Nơi cũ chưa ghi đơn vị cha: KHÔNG thưởng, cũng không phạt. Chưa biết khác với biết là khác.
        vi.push('nơi này chưa ghi đơn vị cha');
      } else {
        diem += PHAT_CHA_KHAC;
        vi.push('KHÁC đơn vị cha');
      }
    }

    ra.push({ id: u.id, diem, muc: mucCua(diem), vi });
  }

  return ra.sort((a, b) => (b.diem !== a.diem ? b.diem - a.diem : a.id < b.id ? -1 : 1)).slice(0, toiDa);
}

function mucCua(diem: number): MucChacChanNoi {
  if (diem >= DIEM_TEN_KHIT + DIEM_CHA_KHIT) return 'cao';
  if (diem >= DIEM_TEN_KHIT) return 'vua';
  return 'thap';
}

/** Hai nơi TRÙNG KHÍT — cùng tên, cùng đơn vị cha. Không cho tạo bản thứ hai. */
export function trungKhit(a: NoiTho, ten: string, donViCha: string): boolean {
  return a.nameFolded === chuanHoa(ten) && a.parentUnitFolded === chuanHoa(donViCha);
}

/** Có nơi nào ĐÃ MANG tên này chưa, bất kể đơn vị cha. */
export function trungTen(a: NoiTho, ten: string): boolean {
  return a.nameFolded === chuanHoa(ten);
}
