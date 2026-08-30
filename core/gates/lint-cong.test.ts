/**
 * Luật lint "cổng chỉ có hai tên" (story 7-1) — đọc CẤU HÌNH THẬT (`eslint.config.mjs`) qua ESLint
 * API, cùng nếp `app/admin/chrome.test.ts`: một luật chỉ tồn tại trong tài liệu thì không phải luật.
 * Mỗi khẳng định dưới đây đã được kiểm là ĐỎ ĐƯỢC (đổi đường dẫn sang tệp miễn trừ thì 0 lỗi).
 */
import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';

const eslint = new ESLint({ cwd: process.cwd() });
const soi = async (code: string, filePath: string) =>
  (await eslint.lintText(code, { filePath })).flatMap((r) => r.messages).filter((m) => m.ruleId === 'no-restricted-syntax');

const CHEP_CONG = `
  import { err, ok } from '@/core/types';
  export function thu(ctx: { role: string; personId: string | null }) {
    if (ctx.role === 'guest') return err('unauthenticated', 'x');
    if (ctx.personId === null) return err('unattached', 'y');
    return ok(1);
  }
`;

describe('cổng chỉ có hai tên — eslint.config.mjs', () => {
  it('ops.ts chép cổng ⇒ ĐỎ đúng ba lỗi, thông báo nêu tên hai cổng', async () => {
    const loi = await soi(CHEP_CONG, 'core/thu/ops.ts');
    expect(loi).toHaveLength(3);
    expect(loi.map((m) => m.message).join(' ')).toContain('gateWriter');
  });

  it('phủ CẢ core: read-ops.ts · info.ts · self.ts · index.ts đều bị gác `guest` và `unattached`', async () => {
    for (const f of ['core/thu/read-ops.ts', 'core/identity/info.ts', 'core/identity/self.ts', 'core/thu/index.ts']) {
      const ma = (await soi(CHEP_CONG, f)).map((m) => m.message);
      expect(ma.some((x) => x.includes('gateWriter')), f).toBe(true);
      expect(ma.some((x) => x.includes("'unattached'")), f).toBe(true);
    }
  });

  it("surface index.ts ĐƯỢC nói 'unauthenticated' khi không có phiên; ops thì không", async () => {
    const surface = `import { err } from '@/core/types'; export function thu(s: unknown) { if (!s) return err('unauthenticated', 'no session'); }`;
    expect(await soi(surface, 'core/thu/index.ts')).toHaveLength(0);
    expect(await soi(surface, 'core/thu/ops.ts')).toHaveLength(1);
  });

  it("bốn hình của một phép so 'guest' đều bị bắt: ===, !==, case, includes", async () => {
    const hinh = [
      `export const a = (r: string) => r === 'guest';`,
      `export const a = (r: string) => r !== 'guest';`,
      `export const a = (r: string) => { switch (r) { case 'guest': return 1; default: return 0; } };`,
      `export const a = (r: string) => ['guest'].includes(r);`,
    ];
    for (const h of hinh) expect(await soi(h, 'core/thu/ops.ts'), h).toHaveLength(1);
  });

  it('tệp ĐỊNH NGHĨA vai/cổng được miễn; ops đi qua cổng ⇒ xanh', async () => {
    const chep = `export function thu(ctx: { role: string }) { return ctx.role === 'guest'; }`;
    for (const f of ['core/identity/gates.ts', 'core/identity/session.ts', 'core/identity/auth.ts', 'core/identity/privacy.ts']) {
      expect(await soi(chep, f), f).toHaveLength(0);
    }
    const quaCong = `
      import { gateWriter } from '@/core/identity/gates';
      export function thu(ctx: Parameters<typeof gateWriter>[0]) { const g = gateWriter(ctx); if (!g.ok) return g; return g; }
    `;
    expect(await soi(quaCong, 'core/thu/ops.ts')).toHaveLength(0);
  });
});
