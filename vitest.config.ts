import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['core/**/*.test.ts', 'db/**/*.test.ts', 'components/**/*.test.ts', 'app/**/*.test.ts'],
    // so-khop dùng node:test với runner riêng (npm run test:so-khop) — không phải file vitest.
    exclude: ['core/so-khop/**'],
    setupFiles: ['./vitest.setup.ts'],
    // DB tests share one database — chạy tuần tự cho khỏi giẫm chân nhau.
    fileParallelism: false,
    testTimeout: 20000,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname) },
  },
});
