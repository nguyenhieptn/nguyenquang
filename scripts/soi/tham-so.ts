/**
 * Đọc tham số. Tham số SAI thì NÉM, không lặng lẽ bỏ qua: bản đầu đổi `--be-mat C` thành `null`
 * và đo trọn bộ, tức một lệnh gõ nhầm chạy lâu gấp ba và in ra một bản kê không phải thứ người
 * ta hỏi (code review 6-6). Cờ lạ cũng vậy — `--be-mat-a` mà im lặng là im lặng đúng lúc cần nói.
 */
export function docThamSo(argv: string[]): { loc: string[]; beMat: 'A' | 'B' | null } {
  const loc: string[] = [];
  let beMat: 'A' | 'B' | null = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--be-mat') {
      const v = argv[++i];
      if (v !== 'A' && v !== 'B') throw new Error(`--be-mat nhận A hoặc B, không nhận "${v ?? ''}".`);
      beMat = v;
    } else if (argv[i].startsWith('--')) {
      throw new Error(`Cờ không biết: ${argv[i]}. Chỉ có --be-mat A|B, còn lại là khoá màn.`);
    } else {
      loc.push(argv[i]);
    }
  }
  return { loc, beMat };
}
