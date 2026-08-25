'use client';

/**
 * Hai nút của một yêu cầu vào phả — story 5-5. Dùng chung cho màn danh sách và cho cột phải của
 * màn cây, để hai chỗ không trôi thành hai luật khác nhau.
 *
 * ── Vì sao TỪ CHỐI phải hỏi lý do ────────────────────────────────────────────────────────
 * AD-10 buộc mọi mutation ghi revision; lý do là thứ làm bản ghi ấy đọc được sau vài năm. Nhưng
 * lý do đi vào SỔ, không đi tới người xin — bề mặt A chỉ nói "chưa được nhận, chọn lại người".
 * Sổ của ban tu phả không phải một hộp thư.
 *
 * ── Vì sao "Nhận" mang son mà "Từ chối" thì không ────────────────────────────────────────
 * `DESIGN.md § Colors`: son mang đúng một nghĩa — *đã chốt*. Nhận là chốt. Từ chối cũng là một
 * phán quyết, nhưng nó thuộc nhóm cảnh báo nên dùng `destructive` (`§ Cảnh báo là chàm mực`).
 */
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  /**
   * Danh tính của YÊU CẦU này — `attachmentId`. Bắt buộc, và chính nó là `key`.
   *
   * Lý do từ chối là chữ người vận hành gõ về một yêu cầu cụ thể, và nó đi thẳng vào nhật ký để
   * "đọc được sau vài năm" (xem đầu file). Nếu component không dựng lại khi yêu cầu đổi, thì gõ
   * lý do cho yêu cầu của A rồi bấm sang B là ghi lý do về A vào sổ của B — một câu sai vĩnh viễn
   * trong đúng chỗ sinh ra để tin được.
   *
   * Prop này bắt buộc để nơi gọi KHÔNG THỂ quên, và `key` áp ở ngay dưới để nơi gọi không cần nhớ.
   */
  khoa: string;
  onNhan: () => Promise<string | null>;
  onTuChoi: (lyDo: string) => Promise<string | null>;
};

export function ThaoTacXinVaoPha({ khoa, ...rest }: Props) {
  return <Than key={khoa} {...rest} />;
}

function Than({ onNhan, onTuChoi }: Omit<Props, 'khoa'>) {
  const [moTuChoi, setMoTuChoi] = useState(false);
  const [lyDo, setLyDo] = useState('');
  const [loi, setLoi] = useState<string | null>(null);
  const [dangChay, batDau] = useTransition();

  const chay = (fn: () => Promise<string | null>) => {
    setLoi(null);
    batDau(async () => {
      try {
        const e = await fn();
        if (e) setLoi(e);
        else setMoTuChoi(false);
      } catch {
        // Reject trong transition đi ra `reportGlobalError`, không tới `error.tsx`. Xem chú
        // thích cùng nội dung ở `cot-khang-dinh.tsx`.
        setLoi('Không gửi được lên máy chủ. Kiểm tra mạng rồi thử lại.');
      }
    });
  };

  return (
    <div className="mt-3">
      {loi ? (
        <p className="mb-2 border-l-4 border-destructive bg-canh-bao-nen px-2.5 py-1.5 text-[15px]">
          {loi}
        </p>
      ) : null}

      {moTuChoi ? (
        <div>
          <label className="block text-[15px] font-semibold text-muted-foreground">
            Vì sao chưa nhận
            <span className="text-destructive"> ·</span>
          </label>
          <input
            value={lyDo}
            onChange={(e) => setLyDo(e.target.value)}
            className="mt-0.5 min-h-11 w-full rounded-md border border-ban-vien bg-ban-nen px-3 text-[17px]"
          />
          <p className="mt-1 max-w-[46ch] text-[15px] text-muted-foreground">
            Lý do vào nhật ký của ban tu phả. Người xin chỉ thấy rằng lời nhận chỗ chưa được nhận.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={dangChay || lyDo.trim() === ''}
              onClick={() => chay(() => onTuChoi(lyDo))}
              className="h-11 text-[17px] text-destructive"
            >
              {dangChay ? 'Đang ghi…' : 'Xác nhận từ chối'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={dangChay}
              onClick={() => setMoTuChoi(false)}
              className="h-11 text-[17px]"
            >
              Thôi
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={dangChay}
            onClick={() => chay(onNhan)}
            className="h-11 text-[17px]"
          >
            {dangChay ? 'Đang ghi…' : 'Nhận vào phả'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={dangChay}
            onClick={() => setMoTuChoi(true)}
            className="h-11 text-[17px] text-destructive"
          >
            Từ chối
          </Button>
        </div>
      )}
    </div>
  );
}
