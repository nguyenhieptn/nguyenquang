/**
 * "THẤY VỊ TRÍ TRƯỚC KHI GHI" — phép dựng đầu vào bố cục cho node mờ (story 5-4).
 *
 * Module THUẦN: không React, không React Flow. Tách ra vì vị trí người sắp thêm **phải** tính
 * bằng chính `xepCay()`, không phải bằng "cha ở đâu thì đặt xuống dưới 90px" — đoán toạ độ bằng
 * tay là cách lỗi "thẻ đè lên nhau" quay lại dưới một cái tên khác.
 *
 * Bốn hướng cho bốn hình dạng đầu vào KHÁC nhau, và hai trong bốn không hiển nhiên:
 *
 *   · con của M      → node tạm treo dưới M
 *   · cha/mẹ của M   → node tạm thành gốc, và **M đổi cha thành node tạm**. Đây là hướng duy nhất
 *                      SỬA một node đã có, nên cũng là ca dễ sai nhất.
 *   · vợ/chồng của M → **KHÔNG sinh node nào**. Vợ chồng chung một thẻ (luật 5-2); thêm một node
 *                      cạnh M là vẽ ra hai người rời, đúng thứ 5-2 dựng ra để tránh.
 *   · chưa biết      → node tạm thành một gốc thứ hai, đứng riêng — FR-63.
 */

export type HuongThem = 'con' | 'cha-me' | 'vo-chong' | 'roi';

export type NutBoCuc = { id: string; chaId: string | null };

/** Id của node mờ. Không thể trùng uuid thật. */
export const ID_TAM = '__sap-them__';

export type KetQuaCam = {
  boCuc: NutBoCuc[];
  /** `false` với hướng vợ/chồng — người mới hiện trên THẺ của mốc, không thành node riêng. */
  coNodeTam: boolean;
  /**
   * Mốc có sẵn cha trong vùng và hướng là "cha/mẹ" ⇒ bản xem trước phải TREO LẠI mốc vào node
   * mờ, nên cạnh cũ tạm biến mất khỏi hình. Cờ này để màn nói ra điều đó, chứ không để người
   * vận hành tự đoán vì sao cây vừa đổi hình.
   */
  daThayCanhCu: boolean;
};

export function camNutTam(
  nut: NutBoCuc[],
  mocId: string | null,
  huong: HuongThem,
): KetQuaCam {
  const co = new Set(nut.map((n) => n.id));
  const mocHopLe = mocId !== null && co.has(mocId);

  // Vợ/chồng: không đụng gì tới bố cục.
  if (huong === 'vo-chong' && mocHopLe) {
    return { boCuc: nut, coNodeTam: false, daThayCanhCu: false };
  }

  // Không có mốc hợp lệ thì mọi hướng đều rơi về "rời" — không bịa ra một cạnh không có thật.
  if (!mocHopLe || huong === 'roi') {
    return {
      boCuc: [...nut, { id: ID_TAM, chaId: null }],
      coNodeTam: true,
      daThayCanhCu: false,
    };
  }

  if (huong === 'con') {
    return {
      boCuc: [...nut, { id: ID_TAM, chaId: mocId }],
      coNodeTam: true,
      daThayCanhCu: false,
    };
  }

  // huong === 'cha-me'
  const chaCu = nut.find((n) => n.id === mocId)?.chaId ?? null;
  return {
    boCuc: [
      ...nut.map((n) => (n.id === mocId ? { ...n, chaId: ID_TAM } : n)),
      { id: ID_TAM, chaId: null },
    ],
    coNodeTam: true,
    daThayCanhCu: chaCu !== null && co.has(chaCu),
  };
}
