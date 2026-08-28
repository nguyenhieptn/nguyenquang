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
import { NHAN_VAI, vaiTraoDuoc } from '@/components/admin/vai-gan-ket';
import type { AttachmentRole } from '@/core/identity';

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
  /**
   * Vai của CHÍNH người đang duyệt — quyết định họ trao được vai nào (story 6-2).
   *
   * Chép luật đã có ở `approveAttachmentOp` (*"any role above 'member' requires admin"*) sang cho
   * MẮT; core vẫn gác thật, kể cả khi POST thẳng không qua giao diện. Bày một lựa chọn mà core
   * sẽ từ chối là dựng một đường cụt.
   */
  vaiCuaMinh: AttachmentRole | 'guest';
  onNhan: (vai: AttachmentRole) => Promise<string | null>;
  onTuChoi: (lyDo: string) => Promise<string | null>;
};

export function ThaoTacXinVaoPha({ khoa, ...rest }: Props) {
  // `khoa` đi XUỐNG, không chỉ làm `key` — nhóm radio phải theo YÊU CẦU. Xem chú thích ở `name`.
  return <Than key={khoa} khoa={khoa} {...rest} />;
}

function Than({ khoa, vaiCuaMinh, onNhan, onTuChoi }: Props) {
  const [moTuChoi, setMoTuChoi] = useState(false);
  const [lyDo, setLyDo] = useState('');
  /**
   * Vai sẽ trao khi nhận. Mặc định `member` — KHÔNG đổi mặc định cũ; thứ story 6-2 thêm là có
   * một đường để chọn khác. Trước đó `approveAttachment` nhận `role` mà không nơi gọi nào truyền,
   * nên mọi lượt duyệt của cả sản phẩm đều ra `member` và không màn nào sửa lại được.
   */
  const [vai, setVai] = useState<AttachmentRole>('member');
  const traoDuoc = vaiTraoDuoc(vaiCuaMinh);
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
      {/* `role="alert"` — câu lỗi phải tới được trình đọc màn hình, không chỉ tới mắt. */}
      <div role="alert" aria-live="assertive">
        {loi ? (
          <p className="mb-2 border-l-4 border-destructive bg-canh-bao-nen px-2.5 py-1.5 text-[15px]">
            {loi}
          </p>
        ) : null}
      </div>

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
        <div>
          {/* Chọn vai TRƯỚC nút nhận: vai là thứ lượt nhận ghi vào, nên nó là câu hỏi đứng trước
              hành động, không phải một tuỳ chọn nhét sau. Chỉ bày khi có hơn một lựa chọn —
              đầu mối chi chỉ trao được `member`, và một bộ radio một lựa chọn là nhiễu. */}
          {traoDuoc.length > 1 ? (
            <fieldset className="mb-2">
              <legend className="text-[15px] font-semibold text-muted-foreground">
                Nhận vào với vai
              </legend>
              <div className="mt-0.5 flex flex-col">
                {traoDuoc.map((v) => (
                  <label key={v} className="flex min-h-11 cursor-pointer items-start gap-2.5 py-1">
                    <input
                      type="radio"
                      /**
                       * Nhóm radio theo YÊU CẦU, không theo vai người xem (sửa 27/08 sau code
                       * review). Bản đầu dùng `vai-${vaiCuaMinh}` — giống nhau ở mọi hàng, và
                       * không hàng nào nằm trong `<form>` ⇒ theo đặc tả HTML cả trang là MỘT
                       * nhóm radio. Với ≥2 yêu cầu: mũi tên nhảy sang hàng khác và đổi vai của
                       * hàng đó, còn hàng đang nhìn bày một bộ radio trống trong khi state của
                       * nó vẫn giữ vai cũ. Bấm *Nhận vào phả* lúc ấy trao một vai mà màn đang
                       * bày là chưa chọn gì.
                       */
                      name={`vai-${khoa}`}
                      checked={vai === v}
                      onChange={() => setVai(v)}
                      className="mt-1 size-5 shrink-0 accent-foreground"
                    />
                    <span className="text-[17px]">
                      {NHAN_VAI[v].ten}
                      <span className="block text-[15px] text-muted-foreground">
                        {NHAN_VAI[v].lamDuocGi}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={dangChay}
            onClick={() => chay(() => onNhan(vai))}
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
        </div>
      )}
    </div>
  );
}
