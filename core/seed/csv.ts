/**
 * core/seed/csv — the FR-51 CSV template and its parser. Pure: no database, no identity.
 *
 * The skeleton file is filled OUTSIDE the system (docs: Hiệp types it up from the paper
 * genealogy), so the format is deliberately the dumbest thing that survives Excel: UTF-8
 * with BOM, comma-separated, one header line, years as plain 4-digit numbers. Every parse
 * problem is collected per row with its line number — the operator fixes the file, not
 * a stack trace.
 *
 * Column contract (exact set, order-independent):
 *   ho_ten        required — full name, diacritics kept
 *   gioi_tinh     nam | nu | khac | empty (folded before checking, so "Nam"/"nữ" pass)
 *   nam_sinh      4-digit year or empty
 *   nam_mat       4-digit year or empty
 *   ten_cha       father's full name; empty ⇒ fragment-root candidate (FR-63)
 *   ten_vo_chong  spouse's full name, optional
 *   chi           branch label — carried as DATA only, never a stored branch code (AD-5)
 *   ghi_chu       free note
 */
import { parse } from 'csv-parse/sync';
import { chuanHoa } from '@/core/so-khop';
import { err, ok, type Result } from '@/core/types';

export const SEED_COLUMNS = [
  'ho_ten',
  'gioi_tinh',
  'nam_sinh',
  'nam_mat',
  'ten_cha',
  'ten_vo_chong',
  'chi',
  'ghi_chu',
] as const;
export type SeedColumn = (typeof SEED_COLUMNS)[number];

export type SeedGender = 'nam' | 'nu' | 'khac';

export type SeedRow = {
  /** 0-based position in the parsed row list — the key `SeedDecisions` uses. */
  index: number;
  /** 1-based line number in the file (header is line 1) — for operator-facing messages. */
  line: number;
  hoTen: string;
  gioiTinh: SeedGender | null;
  namSinh: number | null;
  namMat: number | null;
  tenCha: string | null;
  tenVoChong: string | null;
  chi: string | null;
  ghiChu: string | null;
};

/**
 * The empty skeleton the operator downloads. Names are GENERIC examples — nothing about the
 * real clan is hard-coded anywhere in core (AD-14), templates included.
 */
export function getTemplate(): string {
  const lines = [
    SEED_COLUMNS.join(','),
    'Nguyễn Văn An,nam,1900,1972,,Trần Thị Bốn,Chi Nhất,Cụ cao nhất trong tệp — để trống ten_cha',
    'Nguyễn Văn Bình,nam,1926,,Nguyễn Văn An,,Chi Nhất,Con trai cụ An',
  ];
  // BOM so Excel opens the diacritics correctly; the parser strips it back out.
  return '\uFEFF' + lines.join('\n') + '\n';
}

type ParsedRecord = { info: { lines: number }; record: string[] };

/**
 * Parses and validates the filled skeleton. Structural failure (broken quoting, wrong header)
 * and per-row failures both come back as `err('invalid')` whose message lists every problem
 * with its line number — never just the first one.
 */
export function parseSeedCsv(text: string): Result<SeedRow[]> {
  let records: ParsedRecord[];
  try {
    records = parse(text, {
      bom: true,
      trim: true,
      skip_empty_lines: true,
      relax_column_count: true, // row-length problems are reported per row below, not thrown
      info: true,
    }) as unknown as ParsedRecord[];
  } catch (e) {
    return err('invalid', `CSV parse error: ${e instanceof Error ? e.message : String(e)}`);
  }

  if (records.length === 0) return err('invalid', 'the file is empty — expected a header line and data rows');

  const header = records[0]!.record.map((h) => h.trim().toLowerCase());
  const expected = SEED_COLUMNS as readonly string[];
  const missing = expected.filter((c) => !header.includes(c));
  const unknown = header.filter((c) => !expected.includes(c));
  const duplicated = header.filter((c, i) => header.indexOf(c) !== i);
  if (missing.length > 0 || unknown.length > 0 || duplicated.length > 0) {
    const parts: string[] = [];
    if (missing.length > 0) parts.push(`missing column(s): ${missing.join(', ')}`);
    if (unknown.length > 0) parts.push(`unknown column(s): ${unknown.join(', ')}`);
    if (duplicated.length > 0) parts.push(`duplicated column(s): ${duplicated.join(', ')}`);
    return err('invalid', `header must contain exactly: ${expected.join(', ')} — ${parts.join('; ')}`);
  }
  const at = new Map(expected.map((c) => [c, header.indexOf(c)]));

  const dataRecords = records.slice(1);
  if (dataRecords.length === 0) return err('invalid', 'the file has no data rows — only a header');

  const rows: SeedRow[] = [];
  const problems: string[] = [];

  dataRecords.forEach((rec, index) => {
    const line = rec.info.lines;
    if (rec.record.length !== header.length) {
      problems.push(`line ${line}: expected ${header.length} columns, got ${rec.record.length}`);
      return;
    }
    const cell = (c: SeedColumn) => (rec.record[at.get(c)!] ?? '').trim();

    const hoTen = cell('ho_ten');
    if (!hoTen) problems.push(`line ${line}: ho_ten is required`);

    let gioiTinh: SeedGender | null = null;
    const rawGender = cell('gioi_tinh');
    if (rawGender) {
      const folded = chuanHoa(rawGender);
      if (folded === 'nam' || folded === 'nu' || folded === 'khac') gioiTinh = folded;
      else problems.push(`line ${line}: gioi_tinh '${rawGender}' must be nam, nu, khac, or empty`);
    }

    const year = (c: SeedColumn): number | null => {
      const raw = cell(c);
      if (!raw) return null;
      if (!/^\d{4}$/.test(raw)) {
        problems.push(`line ${line}: ${c} '${raw}' is not a 4-digit year`);
        return null;
      }
      return Number(raw);
    };
    const namSinh = year('nam_sinh');
    const namMat = year('nam_mat');
    if (namSinh !== null && namMat !== null && namMat < namSinh)
      problems.push(`line ${line}: nam_mat ${namMat} is before nam_sinh ${namSinh}`);

    rows.push({
      index,
      line,
      hoTen,
      gioiTinh,
      namSinh,
      namMat,
      tenCha: cell('ten_cha') || null,
      tenVoChong: cell('ten_vo_chong') || null,
      chi: cell('chi') || null,
      ghiChu: cell('ghi_chu') || null,
    });
  });

  if (problems.length > 0)
    return err('invalid', `${problems.length} row problem(s): ${problems.join('; ')}`);

  return ok(rows);
}
