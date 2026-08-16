/**
 * CHUẨN HOÁ VÀ SO SÁNH TÊN VIỆT
 *
 * `AD-16` bắt mọi lần tra tên và mọi lần so ứng viên trùng phải đi qua bỏ dấu + gấp hoa thường,
 * và gọi `LIKE`/`ILIKE` trần là **lỗi**. File này là chỗ thực thi luật ấy — nếu có đường tra tên
 * thứ hai không đi qua đây thì đó là chỗ AD-16 rò.
 *
 * Tên Việt có cấu trúc, không phải một chuỗi phẳng: `họ + (đệm) + tên`. So sánh theo cấu trúc
 * cho tín hiệu sạch hơn hẳn khoảng cách chuỗi — “Nguyễn Quang Đệ” và “Nguyễn Quang Đề” chỉ khác
 * một dấu ở **tên chính**, mà đó lại đúng là chỗ khác một dấu là khác người.
 */

/** Bỏ dấu thanh và dấu mũ, và hạ `đ` → `d` (chữ `đ` không tách được bằng NFD). */
export function boDau(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/** Dạng chuẩn để so sánh: bỏ dấu, thường hoá, gộp khoảng trắng. Tên lưu vẫn giữ nguyên dấu. */
export function chuanHoa(s: string): string {
  return boDau(s).toLowerCase().trim().replace(/\s+/g, ' ');
}

export type TenTach = {
  /** Họ — âm tiết đầu. */
  ho: string;
  /** Đệm — các âm tiết giữa. Rỗng khi tên chỉ có hai âm tiết. */
  dem: string[];
  /** Tên chính — âm tiết cuối. Đây là phần mang danh tính. */
  ten: string;
};

/** Tách một tên đầy đủ thành họ / đệm / tên chính. Đã chuẩn hoá. */
export function tachTen(hoTen: string): TenTach {
  const am = chuanHoa(hoTen).split(' ').filter(Boolean);
  if (am.length === 0) return { ho: '', dem: [], ten: '' };
  if (am.length === 1) return { ho: '', dem: [], ten: am[0] };
  return { ho: am[0], dem: am.slice(1, -1), ten: am[am.length - 1] };
}

export type KetQuaSoTen = {
  /** 0..1. Không phải xác suất — là mức khớp để xếp hạng ứng viên với nhau. */
  diem: number;
  /** Vì sao giống. Câu người đọc được, để bày lên màn. */
  giong: string[];
  /** Vì sao khác. **Bắt buộc bày** — bảng chỉ có cột “giống” là bảng dụ người bấm gộp. */
  khac: string[];
};

/**
 * So một tên người khai đưa với một tên trong phả, kèm các tên khác của cùng người đó.
 *
 * `tenKhac` là tên huý và tên hèm: cụ trong phả thường được chép bằng tên huý, còn con cháu chỉ
 * biết tên gọi. Bỏ qua chúng là bỏ lỡ đúng nhóm người mà việc so khớp có giá trị nhất.
 */
export function soTen(khai: string, trongPha: string, tenKhac: string[] = []): KetQuaSoTen {
  const ungVien = [trongPha, ...tenKhac].filter(Boolean);
  let tot: KetQuaSoTen = { diem: 0, giong: [], khac: [] };

  for (const [i, ten] of ungVien.entries()) {
    const kq = soMotTen(khai, ten, i === 0 ? null : 'tên huý/hèm');
    if (kq.diem > tot.diem) tot = kq;
  }
  return tot;
}

function soMotTen(khai: string, doiChieu: string, nhan: string | null): KetQuaSoTen {
  const a = tachTen(khai);
  const b = tachTen(doiChieu);
  const giong: string[] = [];
  const khac: string[] = [];
  const qua = nhan ? ` (khớp qua ${nhan})` : '';

  if (chuanHoa(khai) === chuanHoa(doiChieu)) {
    return { diem: 1, giong: [`Trùng khít cả tên: ${doiChieu}${qua}`], khac: [] };
  }

  let diem = 0;

  // Tên chính mang danh tính — nó là phần nặng nhất, và cũng là phần khác một dấu là khác người.
  if (a.ten && a.ten === b.ten) {
    diem += 0.6;
    giong.push(`Cùng tên chính “${a.ten}”${qua}`);
  } else if (a.ten && b.ten) {
    khac.push(`Tên chính khác: “${a.ten}” và “${b.ten}”`);
  }

  if (a.ho && a.ho === b.ho) {
    // Cùng họ trong một cuốn phả họ là mặc định, không phải bằng chứng — điểm thấp là cố ý.
    diem += 0.1;
    giong.push(`Cùng họ “${a.ho}”`);
  } else if (a.ho && b.ho) {
    diem -= 0.2;
    khac.push(`Khác họ: “${a.ho}” và “${b.ho}”`);
  }

  const demChung = a.dem.filter((d) => b.dem.includes(d));
  if (demChung.length > 0) {
    diem += 0.3;
    giong.push(`Cùng tên đệm “${demChung.join(' ')}”`);
  } else if (a.dem.length > 0 && b.dem.length > 0) {
    khac.push(`Tên đệm khác: “${a.dem.join(' ')}” và “${b.dem.join(' ')}”`);
  } else if (a.dem.length !== b.dem.length) {
    khac.push('Một bên có tên đệm, một bên không');
  }

  return { diem: Math.max(0, Math.min(1, diem)), giong, khac };
}

/**
 * Tên này có theo nếp đặt tên của dòng họ không (FR-53).
 *
 * Nếp tên là **tín hiệu yếu và phải giữ cho yếu**: dâu rể không mang nếp, người được nhận nuôi
 * không mang nếp, và nhiều chi bỏ nếp từ đời nào không ai nhớ. Dùng nó để phân định thì loại
 * nhầm đúng những người dễ bị bỏ sót nhất.
 */
export function theoNepTen(hoTen: string, nep: string[]): boolean {
  if (nep.length === 0) return true;
  const am = chuanHoa(hoTen).split(' ');
  return nep.every((n, i) => am[i] === chuanHoa(n));
}
