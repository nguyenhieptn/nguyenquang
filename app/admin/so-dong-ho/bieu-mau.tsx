'use client';

/**
 * Biểu mẫu Sổ dòng họ — story 5-8.
 *
 * Mỗi ô nói rõ **nó hiện ở đâu**. Người sửa không đoán được điều đó, và bốn khoá này là thứ hiện
 * trên trang chủ công khai — sửa mù rồi mới thấy hậu quả trên màn của cả dòng họ là quá muộn.
 */
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ghiSoDongHo } from './actions';

export type SoDongHo = {
  name: string;
  surname: string;
  middleName: string;
  motto: string;
  mottoPhonetic: string;
};

const KHOA_SETTINGS = ['surname', 'middleName', 'motto', 'mottoPhonetic'] as const;

export function BieuMauSoDongHo({ banDau, suaDuoc }: { banDau: SoDongHo; suaDuoc: boolean }) {
  const [d, setD] = useState(banDau);
  /**
   * Ảnh chụp lúc mở màn — thứ dùng để biết người này ĐÃ SỬA những ô nào.
   *
   * Là state chứ không đọc thẳng `banDau`: ghi xong thì đây là mốc mới, nếu không thì bấm ghi
   * lần thứ hai lại gửi lại y nguyên bốn khoá cũ và bài toán quay về đúng chỗ cũ.
   */
  const [goc, setGoc] = useState(banDau);
  const [loi, setLoi] = useState<string | null>(null);
  const [xong, setXong] = useState(false);
  const [dangGui, setDangGui] = useState(false);
  const id = useId();

  const dat = <K extends keyof SoDongHo>(k: K, v: string) => {
    setD((cu) => ({ ...cu, [k]: v }));
    setXong(false);
  };

  /**
   * ── Chỉ gửi những ô người này THẬT SỰ sửa ────────────────────────────────────────────────
   * Biểu mẫu này mở ra là chụp một ảnh, rồi có thể nằm đó nửa buổi. Gửi cả năm khoá từ ảnh ấy thì
   * người quản trị thứ hai xoá mất đề từ mà người thứ nhất vừa đặt — và màn còn nói "Đã ghi".
   *
   * `updateClanInfoOp` phân biệt `undefined` (không gửi) với chuỗi rỗng (lệnh xoá), nên chỉ cần
   * BỎ HẲN khoá không đổi là đủ. So theo bản đã cắt khoảng trắng, vì core cũng cắt — thêm một dấu
   * cách rồi xoá đi không phải một lần sửa.
   */
  const doiKhac = (): { name?: string; settings: Partial<Record<(typeof KHOA_SETTINGS)[number], string>> } => {
    const settings: Partial<Record<(typeof KHOA_SETTINGS)[number], string>> = {};
    for (const k of KHOA_SETTINGS) {
      if (d[k].trim() !== goc[k].trim()) settings[k] = d[k];
    }
    return d.name.trim() !== goc.name.trim() ? { name: d.name, settings } : { settings };
  };

  const thay = doiKhac();
  const coDoi = thay.name !== undefined || Object.keys(thay.settings).length > 0;

  async function gui() {
    setLoi(null);
    setXong(false);
    setDangGui(true);
    try {
      const res = await ghiSoDongHo(thay);
      if (!res.ok) setLoi(res.error.message);
      else {
        // Mốc mới là thứ vừa ghi được, không phải thứ máy chủ trả về: bốn khoá kia có thể đã
        // đổi bởi người khác, và ta không đụng tới chúng nên cũng không đòi biết chúng.
        setGoc(d);
        setXong(true);
      }
    } catch {
      setLoi('Không gửi được lên máy chủ. Kiểm tra mạng rồi thử lại.');
    } finally {
      setDangGui(false);
    }
  }

  return (
    <div className="mt-6 flex max-w-[52ch] flex-col gap-4">
      <O
        id={`${id}-ten`}
        nhan="Tên dòng họ"
        moTa="Hiện làm tiêu đề trang chủ. Không được để trống."
        giaTri={d.name}
        doi={(v) => dat('name', v)}
        khoa={!suaDuoc}
      />
      <O
        id={`${id}-ho`}
        nhan="Tên họ"
        moTa="Dùng cho gợi ý tên và so khớp khi nạp khung. Ví dụ: Nguyễn."
        giaTri={d.surname}
        doi={(v) => dat('surname', v)}
        khoa={!suaDuoc}
        pha
      />
      <O
        id={`${id}-dem`}
        nhan="Chữ đệm"
        moTa="Chữ đệm chung của cả họ. Ví dụ: Quang."
        giaTri={d.middleName}
        doi={(v) => dat('middleName', v)}
        khoa={!suaDuoc}
        pha
      />
      <O
        id={`${id}-de-tu`}
        nhan="Đề từ"
        moTa="Bốn chữ Hán-Nôm hiện trên trang chủ. Ví dụ: 光前裕後."
        giaTri={d.motto}
        doi={(v) => dat('motto', v)}
        khoa={!suaDuoc}
        hanNom
      />
      <O
        id={`${id}-phien-am`}
        nhan="Phiên âm đề từ"
        moTa="Đọc thế nào. Ví dụ: Quang tiền dụ hậu."
        giaTri={d.mottoPhonetic}
        doi={(v) => dat('mottoPhonetic', v)}
        khoa={!suaDuoc}
      />

      <p className="text-[15px] text-muted-foreground">
        Bỏ trống một ô là xoá giá trị ấy — trừ tên dòng họ. Dòng họ chưa có đề từ là chuyện bình
        thường.
      </p>

      {loi ? (
        <p className="border-l-4 border-destructive bg-canh-bao-nen px-2.5 py-1.5 text-[17px]">
          {loi}
        </p>
      ) : null}
      {xong ? (
        <p role="status" className="text-[17px] text-muted-foreground">
          Đã ghi. Trang chủ và mọi màn khác đọc giá trị mới từ lần tải sau.
        </p>
      ) : null}
      {suaDuoc && !coDoi && !xong ? (
        <p className="text-[15px] text-muted-foreground">Chưa sửa ô nào nên chưa có gì để ghi.</p>
      ) : null}

      {suaDuoc ? (
        <div>
          <Button
            type="button"
            disabled={dangGui || !coDoi || d.name.trim() === ''}
            onClick={() => void gui()}
            className="h-11 text-[17px]"
          >
            {dangGui ? 'Đang ghi…' : 'Ghi vào sổ dòng họ'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function O({
  id,
  nhan,
  moTa,
  giaTri,
  doi,
  khoa,
  pha,
  hanNom,
}: {
  id: string;
  nhan: string;
  moTa: string;
  giaTri: string;
  doi: (v: string) => void;
  khoa: boolean;
  pha?: boolean;
  hanNom?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[17px] font-semibold">
        {nhan}
      </label>
      {/* Nói rõ ô này hiện Ở ĐÂU. Bốn khoá này ra tận trang chủ công khai; sửa mù rồi mới thấy
          hậu quả trên màn của cả dòng họ là quá muộn. */}
      <p className="text-[15px] text-muted-foreground">{moTa}</p>
      <input
        id={id}
        value={giaTri}
        disabled={khoa}
        onChange={(e) => doi(e.target.value)}
        className={`mt-1 min-h-11 w-full rounded-md border border-ban-vien bg-ban-o px-3 text-[17px] disabled:text-muted-foreground ${
          hanNom ? 'font-[family-name:var(--font-han-nom)] text-[23px]' : pha ? 'font-pha' : ''
        }`}
      />
    </div>
  );
}
