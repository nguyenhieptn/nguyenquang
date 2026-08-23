/**
 * TOÁN BỐ CỤC CÂY — module THUẦN, không React, không React Flow.
 *
 * Tách khỏi `khung-cay.tsx` ngày 23/08/2026 vì đúng một lý do: đây là chỗ lỗi "thẻ đè lên nhau"
 * đã sinh ra, và một phép toán thì kiểm được bằng test chứ không phải bằng mắt. File cũ kéo theo
 * `@xyflow/react` và stylesheet của nó nên không chạy được trong test node.
 */

export type ViTri = { x: number; y: number };

// ── Bố cục: cha đứng GIỮA bề rộng của cả nhánh con ──────────────────────────────────────────
// Không phải giữa hai con đầu–cuối: với nhánh lệch (một con có 5 cháu, con kia không có ai) thì
// hai cách cho ra hai kết quả khác nhau, và cách "giữa đầu–cuối" vẽ ra cái cây nghiêng.

export type NutCay = { id: string; chaId: string | null };

export function xepCay<T extends NutCay>(
  nut: T[],
  {
    rong,
    hoNgang,
    hoDoc,
    cao,
  }: {
    rong: number;
    hoNgang: number;
    /** Khoảng hở GIỮA hai hàng — phần nhánh nối chạy qua. */
    hoDoc: number;
    /** Chiều cao thật của một thẻ. Chưa đo được thì trả ước lượng. */
    cao: (id: string) => number;
  },
): Map<string, ViTri> {
  const con = new Map<string | null, T[]>();
  for (const n of nut) con.set(n.chaId, [...(con.get(n.chaId) ?? []), n]);

  // ── TRỤC DỌC: đỉnh mỗi hàng cộng dồn theo THẺ CAO NHẤT của hàng trên ────────────────────
  // Đây là chỗ lỗi đè nhau được sửa. Một hằng số `caoHang` chung chỉ đúng khi mọi thẻ cao bằng
  // nhau — mà thẻ có vợ/chồng và dòng ghi công thì không.
  const sau = new Map<string, number>();
  const datSau = (n: T, d: number) => {
    sau.set(n.id, d);
    for (const c of con.get(n.id) ?? []) datSau(c, d + 1);
  };
  for (const g of con.get(null) ?? []) datSau(g, 0);

  const caoNhatHang: number[] = [];
  for (const n of nut) {
    const d = sau.get(n.id) ?? 0;
    caoNhatHang[d] = Math.max(caoNhatHang[d] ?? 0, cao(n.id));
  }
  const dinhHang: number[] = [];
  let y = 0;
  for (let d = 0; d < caoNhatHang.length; d += 1) {
    dinhHang[d] = y;
    y += (caoNhatHang[d] ?? 0) + hoDoc;
  }

  // ── TRỤC NGANG: cha đứng giữa bề rộng của cả nhánh con (giữ nguyên) ─────────────────────
  const beRong = new Map<string, number>();
  const doRong = (id: string): number => {
    if (beRong.has(id)) return beRong.get(id)!;
    const cs = con.get(id) ?? [];
    const w = cs.length ? cs.reduce((s, c) => s + doRong(c.id), 0) : rong + hoNgang;
    beRong.set(id, w);
    return w;
  };

  const viTri = new Map<string, ViTri>();
  const dat = (n: T, trai: number) => {
    let x = trai;
    for (const c of con.get(n.id) ?? []) {
      dat(c, x);
      x += doRong(c.id);
    }
    viTri.set(n.id, {
      x: trai + doRong(n.id) / 2 - rong / 2,
      y: dinhHang[sau.get(n.id) ?? 0] ?? 0,
    });
  };

  let x = 0;
  for (const goc of con.get(null) ?? []) {
    dat(goc, x);
    x += doRong(goc.id);
  }
  return viTri;
}

