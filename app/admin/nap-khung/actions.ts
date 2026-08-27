'use server';

/**
 * Server actions của màn Nạp khung (FR-51, FR-48, FR-63).
 *
 * LỰA CHỌN MỘT-TRANG: core/seed không có API lưu tệp tạm server-side, còn CSV thì quá to
 * cho cookie/searchParams. Nên nạp + xem trước + ghi diễn ra trên CÙNG /admin/nap-khung:
 * văn bản CSV đi từ client lên `xemTruoc`, quay về client trong kết quả, rồi đi lên lại
 * trong `ghiVaoPha` — tệp vốn của client, để client giữ là trung thực nhất.
 *
 * Cả ba action trả Result NGUYÊN VẸN từ core (không dịch, không throw). Quyền được core
 * tự gác (gateApprover trong previewSeed/commitSeed) — action gọi thẳng, kể cả khi bị POST
 * trực tiếp không qua UI thì core vẫn chặn.
 */
import { revalidatePath } from 'next/cache';
import { huongMacDinh } from '@/components/admin/canh-bao-nap-khung';
import { chuanHoa } from '@/core/so-khop';
import { commitSeed, parseSeedCsv, previewSeed } from '@/core/seed';
import type {
  SeedCandidate,
  SeedCommitResult,
  SeedDecision,
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
  /**
   * Cảnh báo tính theo bộ quyết định MẶC ĐỊNH của màn — thứ màn bày ngay từ lượt nhìn đầu tiên.
   *
   * Tách khỏi `dong[].canhBao` (bản MÙ) chứ không đè lên: `macDinhCua` phía client suy mặc định
   * TỪ `dong[].canhBao`, nên trộn hai thứ vào nhau là dựng một vòng lặp — mặc định sinh ra cảnh
   * báo, cảnh báo sinh ra mặc định.
   */
  canhBaoBanDau: Record<number, SeedRowWarning[]>;
};

/**
 * Bộ quyết định màn sẽ khởi đầu, dịch từ `huongMacDinh` — cùng luật mà `macDinhCua` phía client
 * dịch cho ô tích, nên hai bên không thể nói khác nhau.
 *
 * Dòng `chua-quyet` KHÔNG có mặt trong bộ này: core coi vắng mặt là `create`, và đó đúng là giả
 * định phải dùng khi tính cảnh báo cho một dòng chưa ai quyết.
 */
function quyetDinhMacDinh(dong: DongXemTruoc[]): SeedDecisions {
  const ra: SeedDecisions = {};
  for (const d of dong) {
    const huong = huongMacDinh({
      nghiTrung: d.phanLoai === 'nghi-trung',
      khopNguoiCoSan: d.phanLoai === 'khop-nguoi-co-san',
      coUngVien: d.ungVien.length > 0,
      canhBao: d.canhBao,
    });
    const qd: SeedDecision | null =
      huong === 'chua-quyet'
        ? null
        : huong === 'de-lai'
          ? { action: 'skip' }
          : huong === 'noi-vao-ung-vien'
            ? { action: 'link', personId: d.ungVien[0]!.personId }
            : { action: 'create' };
    if (qd) ra[d.index] = qd;
  }
  return ra;
}

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

  /**
   * LƯỢT XEM TRƯỚC THỨ HAI — cùng hình dạng với `scripts/seed-from-sheet.ts` (story 6-3).
   *
   * Lượt đầu buộc phải mù, vì mặc định của màn được suy TỪ phân loại và cảnh báo của chính nó.
   * Nhưng bày cảnh báo mù ra thì màn đang nói về một lượt ghi *giả định* — lượt mà mọi dòng đều
   * được nạp — trong khi ngay từ giây đầu đã có những dòng mặc định bị để lại. Đo bằng trình
   * duyệt 26/08 thấy rõ: cảnh báo nhảy sau cú bấm ĐẦU TIÊN, và trông như cú bấm ấy gây ra.
   *
   * Xem trước không ghi gì, nên lượt thứ hai chỉ tốn một lượt đọc.
   */
  const theoMacDinh = await previewSeed(vanBan, quyetDinhMacDinh(dong));
  const canhBaoBanDau: Record<number, SeedRowWarning[]> = {};
  if (theoMacDinh.ok) {
    for (const r of theoMacDinh.value.rows) canhBaoBanDau[r.index] = r.warnings;
  }

  return ok({ tenTep: tep.name, vanBan, nonce: Date.now(), dong, canhBaoBanDau });
}

/**
 * Tính lại CẢNH BÁO theo bộ quyết định người vận hành đang chọn (story 6-3).
 *
 * ── Vì sao cần một lượt gọi riêng ──────────────────────────────────────────────────────────
 * `xemTruoc` chạy đúng một lần, lúc chưa ai quyết gì, nên cảnh báo của nó nói về một lượt ghi
 * *giả định*: mọi dòng đều được nạp. Lượt ghi thật thì bỏ những dòng bị `skip`, và phép giải tên
 * chỉ đọc các dòng còn lại. Hai chiều sai, cả hai đã xảy ra trên phả thật:
 *   · bỏ một trong hai dòng trùng tên cha ⇒ màn vẫn báo *"gốc tạm của một mảnh"*, trong khi
 *     commit nối được vào dòng còn lại (cảnh báo THỪA);
 *   · bỏ dòng duy nhất mang tên cha ⇒ màn im, commit lặng lẽ bỏ cha (cảnh báo THIẾU) — đây là
 *     lần cây gia phả gãy làm hai mảnh.
 *
 * KHÔNG ghi gì: `previewSeed` là đường đọc, và nó tự gác quyền y như `xemTruoc`.
 *
 * Trả về map theo `index` của dòng, không trả lại cả bảng: client đang giữ bảng rồi, và gửi lại
 * cả bảng là mời một nguồn sự thật thứ hai vào ở.
 */
export async function xemLaiCanhBao(
  vanBan: string,
  quyetDinh: SeedDecisions,
): Promise<Result<Record<number, SeedRowWarning[]>>> {
  const preview = await previewSeed(vanBan, quyetDinh);
  if (!preview.ok) return preview;
  const theoDong: Record<number, SeedRowWarning[]> = {};
  for (const r of preview.value.rows) theoDong[r.index] = r.warnings;
  return ok(theoDong);
}

export async function ghiVaoPha(
  vanBan: string,
  quyetDinh: SeedDecisions,
): Promise<Result<SeedCommitResult>> {
  // Một transaction duy nhất trong core — lỗi ở đâu thì hoàn lại toàn bộ, không có nửa khung.
  const ketQua = await commitSeed(vanBan, quyetDinh);

  /**
   * AD-23, cùng nếp với `hang-cho/actions.ts` và `hop-nhat/actions.ts` — nhưng ở đây từng SÓT.
   *
   * Ghi xong, màn Nạp khung dựng `CaoTrao` ngay tại chỗ, KHÔNG điều hướng đi đâu, nên không có
   * gì bắt layout chạy lại. Mọi khẳng định vừa nạp đều vào tồn nghi (`core/seed/ops.ts` đặt
   * `tentative`), tức con số trên "Hàng chờ khẳng định" vừa tăng đúng bằng lượng vừa ghi — mà
   * thanh việc vẫn bày số cũ cho tới khi có ai bấm F5. Sai số đúng bằng việc mình vừa làm, trên
   * chính cái màn tuyên bố "Con số là số đang chờ".
   *
   * `'layout'` chứ không phải mặc định `'page'`: số nằm ở `app/admin/layout.tsx`, không nằm ở
   * trang này, và lượt ghi này còn làm cũ luôn "Mảnh chưa nối" lẫn màn nhà.
   */
  if (ketQua.ok) revalidatePath('/admin', 'layout');

  return ketQua;
}
