'use client';

/**
 * Ô CHỌN NGƯỜI TRONG PHẢ — cho "ai kể" (chọn một) và "nói về những ai" (chọn nhiều).
 *
 * Tìm qua server action timNguoi → core/tree.searchPersons: so khớp không dấu (AD-16), kết quả
 * đã lọc bán kính riêng tư trước khi rời server. Mỗi kết quả kèm ĐỜI + CHI — trong một dòng họ,
 * trùng tên là chuyện thường (EXPERIENCE.md § State Patterns), tên trần không đủ để chọn đúng.
 *
 * Không dropdown ẩn hiện theo hover: kết quả là những NÚT thấy được, bấm là chọn — "không cử
 * chỉ ẩn" (EXPERIENCE.md § Interaction Primitives). Vùng chạm ≥44px.
 */
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { SearchHit } from '@/core/tree';
import { timNguoi } from '../actions';

export type NguoiDaChon = { personId: string; fullName: string; moTa: string };

/** "đời 6 · chi 1.2" — ngữ cảnh phân biệt hai người trùng tên. */
function moTaNguoi(h: SearchHit): string {
  const phan = [
    h.generation !== null ? `đời ${h.generation}` : null,
    h.branchCode ? `chi ${h.branchCode}` : null,
    h.generation === null && !h.branchCode && h.lifespan ? h.lifespan : null,
  ].filter(Boolean);
  return phan.join(' · ');
}

export function ChonNguoi({
  nhan,
  goiY,
  chonMot = false,
  daChon,
  onDoi,
}: {
  nhan: string;
  goiY: string;
  /** true = chọn đúng một người (ai kể); false = chọn nhiều (nói về những ai). */
  chonMot?: boolean;
  daChon: NguoiDaChon[];
  onDoi: (moi: NguoiDaChon[]) => void;
}) {
  const [tuKhoa, setTuKhoa] = useState('');
  const [ketQua, setKetQua] = useState<SearchHit[]>([]);
  const [dangTim, setDangTim] = useState(false);
  const [loiTim, setLoiTim] = useState<string | null>(null);
  const lanTim = useRef(0);

  // Đổi từ khoá xử lý ngay trong handler (xoá kết quả cũ, huỷ lượt tìm đang chờ);
  // effect chỉ còn việc hẹn giờ gọi server — setState nằm trong callback, không đồng bộ.
  const doiTuKhoa = (v: string) => {
    setTuKhoa(v);
    lanTim.current += 1; // lượt tìm đang chờ (nếu có) thành lỗi thời
    if (v.trim().length < 2) {
      setKetQua([]);
      setDangTim(false);
      setLoiTim(null);
    } else {
      setDangTim(true);
    }
  };

  useEffect(() => {
    const q = tuKhoa.trim();
    if (q.length < 2) return;
    const lan = lanTim.current;
    const hen = setTimeout(async () => {
      const kq = await timNguoi(q);
      if (lan !== lanTim.current) return; // đã gõ tiếp — bỏ kết quả cũ
      setDangTim(false);
      if (!kq.ok) {
        setKetQua([]);
        setLoiTim('Chưa tìm được trong phả lúc này.');
        return;
      }
      setLoiTim(null);
      setKetQua(kq.value);
    }, 300);
    return () => clearTimeout(hen);
  }, [tuKhoa]);

  const chon = (h: SearchHit) => {
    const nguoi: NguoiDaChon = { personId: h.personId, fullName: h.fullName, moTa: moTaNguoi(h) };
    onDoi(chonMot ? [nguoi] : [...daChon, nguoi]);
    doiTuKhoa('');
  };

  const bo = (personId: string) => onDoi(daChon.filter((n) => n.personId !== personId));

  const conChoTim = !chonMot || daChon.length === 0;
  const idNhan = `chon-nguoi-${nhan.replace(/\s+/g, '-')}`;

  return (
    <div>
      <label htmlFor={idNhan} className="block text-[17px] font-semibold">
        {nhan}
      </label>
      <p className="mt-0.5 text-[15px] text-muted-foreground">{goiY}</p>

      {daChon.length > 0 && (
        <ul className="mt-2.5 flex flex-wrap gap-2">
          {daChon.map((n) => (
            <li key={n.personId}>
              <span className="inline-flex min-h-11 items-center gap-1 rounded-md border border-border bg-card py-1 pl-3.5 pr-1">
                <span>
                  <span className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                    {n.fullName}
                  </span>
                  {n.moTa && <span className="ml-1.5 text-[15px] text-muted-foreground">{n.moTa}</span>}
                </span>
                <button
                  type="button"
                  onClick={() => bo(n.personId)}
                  aria-label={`Bỏ ${n.fullName}`}
                  className="flex size-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                >
                  <X size={18} strokeWidth={2} aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {conChoTim && (
        <>
          <input
            id={idNhan}
            type="search"
            value={tuKhoa}
            onChange={(e) => doiTuKhoa(e.target.value)}
            placeholder="Gõ tên để tìm trong phả"
            autoComplete="off"
            className="mt-2.5 h-12 w-full rounded-md border border-input bg-card px-3.5 text-[17px]"
          />
          {dangTim && <p className="mt-2 text-[15px] text-muted-foreground">Đang tìm…</p>}
          {loiTim && !dangTim && <p className="mt-2 text-[15px] text-muted-foreground">{loiTim}</p>}
          {!dangTim && tuKhoa.trim().length >= 2 && ketQua.length === 0 && !loiTim && (
            <p className="mt-2 text-[15px] text-muted-foreground">
              Chưa thấy tên này trong phả — có thể chưa ai ghi người ấy vào.
            </p>
          )}
          {ketQua.length > 0 && (
            <ul className="mt-2 grid gap-1.5">
              {ketQua
                .filter((h) => !daChon.some((n) => n.personId === h.personId))
                .map((h) => (
                  <li key={h.personId}>
                    <button
                      type="button"
                      onClick={() => chon(h)}
                      className="flex min-h-11 w-full flex-col items-start justify-center rounded-md border border-border bg-card px-3.5 py-2 text-left"
                    >
                      <span className="font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                        {h.fullName}
                      </span>
                      <span className="text-[15px] text-muted-foreground">
                        {[moTaNguoi(h) || null, h.similar ? 'tên gần giống' : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
