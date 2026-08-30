/**
 * Luật lint "cổng chỉ có hai tên" (story 7-1) — đọc CẤU HÌNH THẬT (`eslint.config.mjs`) qua ESLint
 * API, cùng nếp `app/admin/chrome.test.ts`: một luật chỉ tồn tại trong tài liệu thì không phải luật.
 */
import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';

const eslint = new ESLint({ cwd: process.cwd() });
const soi = async (code: string, filePath: string) =>
  (await eslint.lintText(code, { filePath })).flatMap((r) => r.messages).filter((m) => m.ruleId === 'no-restricted-syntax');

describe('cổng chỉ có hai tên — eslint.config.mjs', () => {
  it('ops.ts so `role === \'guest\'` hay tự sinh unattached/unauthenticated ⇒ ĐỎ, đúng ba lỗi', async () => {
    const code = `
      import { err, ok } from '@/core/types';
      export function thu(ctx: { role: string; personId: string | null }) {
        if (ctx.role === 'guest') return err('unauthenticated', 'x');
        if (ctx.personId === null) return err('unattached', 'y');
        return ok(1);
      }
    `;
    const loi = await soi(code, 'core/thu/ops.ts');
    expect(loi).toHaveLength(3);
    expect(loi.map((m) => m.message).join(' ')).toContain('gateWriter');
  });

  it('read-ops.ts cũng bị gác; index.ts (surface) và gates.ts thì không', async () => {
    const chep = `export function thu(ctx: { role: string }) { return ctx.role === 'guest'; }`;
    expect(await soi(chep, 'core/thu/read-ops.ts')).toHaveLength(1);
    expect(await soi(chep, 'core/identity/gates.ts')).toHaveLength(0);
    const surface = `import { err } from '@/core/types'; export function thu(s: unknown) { if (!s) return err('unauthenticated', 'no session'); }`;
    expect(await soi(surface, 'core/thu/index.ts')).toHaveLength(0);
  });

  it('ops.ts đi qua cổng ⇒ xanh', async () => {
    const code = `
      import { gateWriter } from '@/core/identity/gates';
      export function thu(ctx: Parameters<typeof gateWriter>[0]) { const g = gateWriter(ctx); if (!g.ok) return g; return g; }
    `;
    expect(await soi(code, 'core/thu/ops.ts')).toHaveLength(0);
  });
});
