import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // ── AD-1: mọi truy cập dữ liệu đi qua core/ ────────────────────────────────────────────────
  // app/ và components/ KHÔNG được import db client, ORM, hay storage — kể cả gián tiếp qua
  // "@/db". Đây là luật spine bắt buộc thi hành bằng lint, không phải quy ước.
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/db", "@/db/*"], message: "AD-1: app/ không được chạm db/ — gọi qua core/." },
            { group: ["drizzle-orm", "drizzle-orm/*"], message: "AD-1: ORM chỉ được dùng trong core/ và db/." },
            { group: ["pg", "pg/*"], message: "AD-1: database client chỉ được dùng trong db/." },
          ],
        },
      ],
    },
  },
  // core/ không được import ngược lên adapter.
  {
    files: ["core/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/app/*"], message: "core/ không import adapter — chiều phụ thuộc là app → core." },
            { group: ["@/components/*"], message: "core/ không import UI." },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
