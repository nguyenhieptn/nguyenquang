import { describe, expect, it } from 'vitest';
import { docThamSo } from './tham-so';

describe('tham số dòng lệnh của bộ đo', () => {
  it('khoá màn trần thì lọc', () => {
    expect(docThamSo(['hang-cho', 'cay'])).toEqual({ loc: ['hang-cho', 'cay'], beMat: null });
  });

  it('--be-mat A|B thì nhận', () => {
    expect(docThamSo(['--be-mat', 'B']).beMat).toBe('B');
  });

  it('--be-mat với giá trị lạ thì NÉM — bản đầu đổi thành null và đo trọn bộ trong im lặng', () => {
    expect(() => docThamSo(['--be-mat', 'C'])).toThrow(/A hoặc B/);
    expect(() => docThamSo(['--be-mat'])).toThrow(/A hoặc B/);
  });

  it('cờ không biết thì NÉM, không lặng lẽ bỏ qua', () => {
    expect(() => docThamSo(['--be-mat-a'])).toThrow(/Cờ không biết/);
  });
});
