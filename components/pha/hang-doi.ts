/**
 * HÀNG THEO ĐỜI — bố cục điện thoại của "Phả quanh mình" (story 6-10). Module THUẦN.
 *
 * Trên 390px không có canvas (NFR-5: React Flow không được tải), nên vùng lân cận quanh một
 * người bày thành HÀNG: mỗi đời một hàng, đời trên ở trên, đời dưới ở dưới — đúng hướng đọc của
 * phả (`EXPERIENCE.md § Responsive`: *"xuống là đi về phía sau"*). Đây là cùng một tập node mà
 * canvas vẽ, chỉ đổi hình; không phải một lượt đọc khác.
 *
 * Người CHƯA RÕ ĐỜI (mảnh chưa nối tới gốc, `generation === null`) xếp thành hàng cuối, có nhãn
 * nói thẳng — không nhét vào một đời đoán mò, và không giấu.
 */

export type NutTheoDoi = { id: string; doi: number | null };

export type HangDoi<T extends NutTheoDoi> = {
  doi: number | null;
  /** "Đời 3" · "Chưa rõ đời". */
  nhan: string;
  nut: T[];
  /** Hàng chứa chính người xem — bung sẵn, các hàng khác gập được. */
  coMinh: boolean;
};

export function xepHangDoi<T extends NutTheoDoi>(nut: readonly T[], minhId: string | null): HangDoi<T>[] {
  const theoDoi = new Map<number | null, T[]>();
  for (const n of nut) theoDoi.set(n.doi, [...(theoDoi.get(n.doi) ?? []), n]);
  const cacDoi = [...theoDoi.keys()].sort((a, b) => {
    if (a === null) return 1;
    if (b === null) return -1;
    return a - b;
  });
  return cacDoi.map((doi) => {
    const ds = theoDoi.get(doi)!;
    return {
      doi,
      nhan: doi === null ? 'Chưa rõ đời' : `Đời ${doi}`,
      nut: ds,
      coMinh: minhId !== null && ds.some((n) => n.id === minhId),
    };
  });
}
