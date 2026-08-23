'use client';

/**
 * FORM ĐỀ XUẤT GỘP — đứng dưới mỗi cặp "máy thấy giống nhau".
 *
 * Luật giữ từ prototype: KHÔNG cái nào được chọn sẵn — chọn hồ sơ chính là một quyết định,
 * máy chọn sẵn là máy đã quyết hộ. Nút là nút PHỤ, không son: đề xuất chưa chốt gì cả —
 * gộp thật (executeMerge) mới là "đã chốt".
 */
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { deXuatGop } from './actions';
import { loiRaCau } from './loi';

type Ben = { personId: string; ten: string };

export function DeXuatGop({ a, b }: { a: Ben; b: Ben }) {
  const [ketQua, guiAction, dangGui] = useActionState(deXuatGop, null);

  return (
    <form action={guiAction} className="mt-4 grid gap-3">
      <input type="hidden" name="aId" value={a.personId} />
      <input type="hidden" name="bId" value={b.personId} />

      <fieldset>
        <legend className="text-[15px] font-semibold text-muted-foreground">
          Nếu là cùng một người — giữ hồ sơ nào làm chính?
        </legend>
        <div className="mt-1 flex flex-wrap gap-x-6">
          {[a, b].map((ben) => (
            <label key={ben.personId} className="flex min-h-11 items-center gap-2 text-[17px]">
              <input
                type="radio"
                name="winnerId"
                value={ben.personId}
                required
                className="size-4 accent-foreground"
              />
              <span className="font-[family-name:var(--font-pha)] font-semibold">{ben.ten}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="grid gap-1.5">
        <span className="text-[15px] font-semibold text-muted-foreground">Lý do đề xuất</span>
        <textarea
          name="reason"
          required
          rows={2}
          placeholder="Vì sao tin rằng đây là một người — nguồn nào, ai kể…"
          className="w-full max-w-[70ch] rounded-md border border-ban-vien bg-ban-o px-3 py-2 text-[17px]"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="outline" disabled={dangGui} className="h-11 text-[17px]">
          {dangGui ? 'Đang mở đề xuất…' : 'Đề xuất gộp'}
        </Button>
        <span className="max-w-[52ch] text-[15px] text-muted-foreground">
          Đề xuất chưa gộp gì — gộp là bước sau, ở khu “Đề xuất đang mở”, và cần quyền duyệt.
        </span>
      </div>

      {ketQua && !ketQua.ok && (
        <p className="max-w-[70ch] border-l-4 border-destructive bg-canh-bao-nen px-3 py-2 text-[15px]">
          {loiRaCau(ketQua.error)}
        </p>
      )}
      {ketQua?.ok && (
        <p className="max-w-[70ch] text-[17px]" aria-live="polite">
          Đã mở đề xuất — nằm ở khu “Đề xuất đang mở” phía dưới, gộp hoặc bác ở đó.
        </p>
      )}
    </form>
  );
}
