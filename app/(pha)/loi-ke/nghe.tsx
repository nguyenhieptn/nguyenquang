'use client';

/**
 * NÚT NGHE MỘT LỜI KỂ — vé nghe xin đúng lúc bấm (AD-12).
 *
 * Không có URL cố định nào tới tệp âm thanh: bấm Nghe → server action xinVeNghe soát mức
 * chia sẻ rồi cấp vé 10 phút → <audio> trỏ vào /api/media/stream/<vé>. Vé hết hạn thì bấm
 * Nghe lần nữa là có vé mới — không tự làm mới ngầm, đúng tinh thần "không cử chỉ ẩn".
 */
import { useState, useTransition } from 'react';
import { Play } from 'lucide-react';
import { xinVeNghe } from './actions';

export function NgheLoiKe({ recordingId }: { recordingId: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangXin, batDauXin] = useTransition();

  const nghe = () => {
    setLoi(null);
    batDauXin(async () => {
      const kq = await xinVeNghe(recordingId);
      if (!kq.ok) {
        // 'forbidden' nói rõ vì sao bằng chữ của core (niêm phong, đã rút lại…) — bày nguyên câu,
        // không dựng banner lỗi: đây là một ranh giới của phả, không phải một sự cố.
        setLoi(kq.error.message);
        return;
      }
      setSrc(`/api/media/stream/${kq.value.token}`);
    });
  };

  if (src) {
    return (
      // controls của trình duyệt: nút phát/tạm dừng quen thuộc nhất với người ít dùng máy.
      <audio controls autoPlay src={src} className="mt-2.5 w-full" preload="auto" />
    );
  }

  return (
    <div className="mt-2.5">
      <button
        type="button"
        onClick={nghe}
        disabled={dangXin}
        className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-card px-5 text-[17px] disabled:opacity-50"
      >
        <Play size={18} strokeWidth={2} aria-hidden />
        {dangXin ? 'Đang mở…' : 'Nghe'}
      </button>
      {loi && <p className="mt-2 text-[15px] text-destructive">{loi}</p>}
    </div>
  );
}
