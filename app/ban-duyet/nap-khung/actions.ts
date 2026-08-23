'use server';

/**
 * Server actions của màn Nạp khung (FR-51, FR-48, FR-63).
 *
 * LỰA CHỌN MỘT-TRANG: core/seed không có API lưu tệp tạm server-side, còn CSV thì quá to
 * cho cookie/searchParams. Nên nạp + xem trước + ghi diễn ra trên CÙNG /ban-duyet/nap-khung:
 * văn bản CSV đi từ client lên `xemTruoc`, quay về client trong kết quả, rồi đi lên lại
 * trong `ghiVaoPha` — tệp vốn của client, để client giữ là trung thực nhất.
 *
 * Cả hai action trả Result NGUYÊN VẸN từ core (không dịch, không throw). Quyền được core
 * tự gác (gateApprover trong previewSeed/commitSeed) — action gọi thẳng, kể cả khi bị POST
 * trực tiếp không qua UI thì core vẫn chặn.
 */
import { chuanHoa } from '@/core/so-khop';
import { commitSeed, parseSeedCsv, previewSeed } from '@/core/seed';
import type {
  SeedCandidate,
  SeedCommitResult,
  SeedDecisions,
  SeedGender,
  SeedRowClassification,
  SeedRowWarning,
} from '@/core/seed';
import { err, ok, type Result } from '@/core/types';

/** Một dòng đã ghép: dữ liệu thô của tệp (SeedRow) + kết quả so khớp (SeedPreviewRow). */
export type DongXemTruoc = {
  index: number;
  line: number;
  hoTen: string;
  gioiTinh: SeedGender | null;
  namSinh: number | null;
  namMat: number | null;
  tenCha: string | null;
  tenVoChong: string | null;
  chi: string | null;
  ghiChu: string | null;
  phanLoai: SeedRowClassification;
  ungVien: SeedCandidate[];
  canhBao: SeedRowWarning[];
  /** index các dòng KHÁC trong cùng tệp mang cùng tên (đã bỏ dấu) — cho cảnh báo trùng-trong-tệp. */
  trungTrongTep: number[];
};

export type KetQuaXemTruoc = {
  tenTep: string;
  /** Văn bản CSV — client giữ nguyên và gửi lại khi ghi (xem ghi chú đầu file). */
  vanBan: string;
  /** Đổi theo từng lần nạp — client dùng làm key để reset trạng thái quyết định. */
  nonce: number;
  dong: DongXemTruoc[];
};

export async function xemTruoc(
  _truoc: Result<KetQuaXemTruoc> | null,
  formData: FormData,
): Promise<Result<KetQuaXemTruoc>> {
  const tep = formData.get('tep');
  if (!(tep instanceof File) || tep.size === 0) {
    return err('invalid', 'chưa chọn tệp CSV nào');
  }

  const vanBan = await tep.text();

  // parse trước để có dữ liệu thô từng dòng (ten_cha, chi, ghi_chu…) cho bảng;
  // previewSeed sẽ parse lại bên trong — parse là thuần và rẻ, đổi lấy API core nguyên vẹn.
  const parsed = parseSeedCsv(vanBan);
  if (!parsed.ok) return parsed;

  const preview = await previewSeed(vanBan);
  if (!preview.ok) return preview;

  const nhomTen = new Map<string, number[]>();
  for (const dong of parsed.value) {
    const goc = chuanHoa(dong.hoTen);
    const danhSach = nhomTen.get(goc) ?? [];
    danhSach.push(dong.index);
    nhomTen.set(goc, danhSach);
  }

  const theoIndex = new Map(preview.value.rows.map((r) => [r.index, r]));
  const dong: DongXemTruoc[] = parsed.value.map((r) => {
    const kq = theoIndex.get(r.index);
    return {
      index: r.index,
      line: r.line,
      hoTen: r.hoTen,
      gioiTinh: r.gioiTinh,
      namSinh: r.namSinh,
      namMat: r.namMat,
      tenCha: r.tenCha,
      tenVoChong: r.tenVoChong,
      chi: r.chi,
      ghiChu: r.ghiChu,
      phanLoai: kq?.classification ?? 'nguoi-moi',
      ungVien: kq?.candidates ?? [],
      canhBao: kq?.warnings ?? [],
      trungTrongTep: (nhomTen.get(chuanHoa(r.hoTen)) ?? []).filter((i) => i !== r.index),
    };
  });

  return ok({ tenTep: tep.name, vanBan, nonce: Date.now(), dong });
}

export async function ghiVaoPha(
  vanBan: string,
  quyetDinh: SeedDecisions,
): Promise<Result<SeedCommitResult>> {
  // Một transaction duy nhất trong core — lỗi ở đâu thì hoàn lại toàn bộ, không có nửa khung.
  return commitSeed(vanBan, quyetDinh);
}
