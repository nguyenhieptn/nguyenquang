/**
 * Phép dựng đầu vào bố cục cho node mờ (story 5-4) — test THUẦN, không React, chạy mili-giây.
 *
 * Viết TRƯỚC khi dựng UI: cả 5-2 lẫn 5-3 đều có một lỗi thật bị test bắt được, và cả hai lỗi ấy
 * đều nằm ở phép dẫn xuất chứ không ở giao diện.
 */
import { describe, it, expect } from 'vitest';
import { camNutTam, ID_TAM, type NutBoCuc } from './dat-nut-tam';

/**  A → B → C, và D đứng rời. */
const CAY: NutBoCuc[] = [
  { id: 'A', chaId: null },
  { id: 'B', chaId: 'A' },
  { id: 'C', chaId: 'B' },
  { id: 'D', chaId: null },
];

describe('cắm node mờ vào bố cục — bốn hướng', () => {
  it('CON của mốc: node tạm treo dưới mốc', () => {
    const r = camNutTam(CAY, 'B', 'con');
    expect(r.coNodeTam).toBe(true);
    expect(r.boCuc.find((n) => n.id === ID_TAM)?.chaId).toBe('B');
    // Không đụng vào node nào đã có.
    expect(r.boCuc.filter((n) => n.id !== ID_TAM)).toEqual(CAY);
  });

  it('CHA/MẸ của mốc: node tạm thành gốc, và MỐC treo lại vào nó', () => {
    const r = camNutTam(CAY, 'B', 'cha-me');
    expect(r.boCuc.find((n) => n.id === ID_TAM)?.chaId).toBeNull();
    // Đây là hướng DUY NHẤT sửa một node đã có — và vì thế là ca dễ sai nhất.
    expect(r.boCuc.find((n) => n.id === 'B')?.chaId).toBe(ID_TAM);
    // Mốc vốn có cha A trong vùng, nên cạnh A→B tạm biến khỏi hình xem trước.
    expect(r.daThayCanhCu).toBe(true);
  });

  it('CHA/MẸ của một gốc: không có cạnh cũ nào bị thay', () => {
    const r = camNutTam(CAY, 'D', 'cha-me');
    expect(r.boCuc.find((n) => n.id === 'D')?.chaId).toBe(ID_TAM);
    expect(r.daThayCanhCu).toBe(false);
  });

  it('VỢ/CHỒNG: KHÔNG sinh node nào — vợ chồng chung một thẻ', () => {
    const r = camNutTam(CAY, 'B', 'vo-chong');
    expect(r.coNodeTam).toBe(false);
    // Thêm một node cạnh mốc là vẽ ra hai người rời — đúng thứ luật gộp cặp của 5-2 dựng ra để
    // tránh, và bày sai ngay ở bản xem trước thì người vận hành ghi xong mới biết mình hiểu nhầm.
    expect(r.boCuc).toEqual(CAY);
  });

  it('CHƯA BIẾT NỐI VÀO AI: node tạm thành gốc thứ hai, đứng riêng (FR-63)', () => {
    const r = camNutTam(CAY, null, 'roi');
    expect(r.coNodeTam).toBe(true);
    expect(r.boCuc.find((n) => n.id === ID_TAM)?.chaId).toBeNull();
    expect(r.boCuc.filter((n) => n.id !== ID_TAM)).toEqual(CAY);
  });

  it('mốc không nằm trong vùng đang bày ⇒ mọi hướng rơi về "rời"', () => {
    // Không bịa ra một cạnh tới một node không có trên hình: `xepCay` sẽ coi `chaId` lạ là gốc,
    // và người vận hành thấy một node mờ trôi lơ lửng mà không hiểu vì sao.
    for (const huong of ['con', 'cha-me', 'vo-chong'] as const) {
      const r = camNutTam(CAY, 'KHONG-CO', huong);
      expect(r.coNodeTam, huong).toBe(true);
      expect(r.boCuc.find((n) => n.id === ID_TAM)?.chaId, huong).toBeNull();
    }
  });

  it('vùng rỗng: node mờ vẫn dựng được, thành gốc duy nhất', () => {
    const r = camNutTam([], null, 'roi');
    expect(r.boCuc).toEqual([{ id: ID_TAM, chaId: null }]);
  });
});
