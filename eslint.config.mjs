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
    // Sản phẩm biên dịch của `npm run test:so-khop`. Flat config KHÔNG đọc `.gitignore`, nên
    // không khai ở đây thì `npm run lint` đỏ 13 lỗi trên máy của bất cứ ai đã chạy bộ test ấy —
    // và xanh trên máy chưa chạy. Một hàng rào chỉ đúng tuỳ máy thì không phải hàng rào.
    ".test-out/**",
  ]),

  // ── AD-1: mọi truy cập dữ liệu đi qua core/ ────────────────────────────────────────────────
  // app/ và components/ KHÔNG được import db client, ORM, hay storage — kể cả gián tiếp qua
  // "@/db". Đây là luật spine bắt buộc thi hành bằng lint, không phải quy ước.
  // Alias "@/db" chỉ chặn được đường alias: "../../db" cũng là db, nên chặn cả dạng tương đối.
  // AD-24: adapter chỉ gọi bề mặt core/<module> (index) — "@/core/<module>/ops" là ruột core,
  // nhận (tx, ctx, args) và KHÔNG tự mở clan context, nên adapter gọi thẳng là thủng bán kính.
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/db", "@/db/*", "**/db", "**/db/*"],
              message: "AD-1: app/ không được chạm db/ — kể cả bằng đường dẫn tương đối. Gọi qua core/.",
            },
            {
              group: ["@/core/*/ops", "**/core/*/ops"],
              message:
                "AD-24: adapter chỉ import bề mặt core/<module> (index.ts), không import ops nội bộ.",
            },
            { group: ["drizzle-orm", "drizzle-orm/*"], message: "AD-1: ORM chỉ được dùng trong core/ và db/." },
            { group: ["pg", "pg/*"], message: "AD-1: database client chỉ được dùng trong db/." },
          ],
        },
      ],
    },
  },
  // ── Cổng chỉ có hai tên (story 7-1, retro Epic 6) ──────────────────────────────────────────
  // 29/08/2026: `gateWriter` được sửa thứ tự `unauthenticated`/`unattached` buổi sáng; buổi chiều
  // một ops mới tự viết ba dòng kiểm và lặp đúng lỗi ấy — tsc · eslint · 549 test · build · soi đều
  // xanh. Code review 7-1 đếm thêm: 31/41 tệp core nằm ngoài glob `ops.ts` đầu tiên, và trong đó còn
  // ba bản chép nữa (`info.ts`, `self.ts`, `place/index.ts`). Nên luật phủ CẢ `core/**`, chỉ miễn
  // đúng những tệp ĐỊNH NGHĨA vai và cổng. Lens "ai NHÌN được gì" là `coQuyenDuyet`, không phải cổng.
  //
  //   · không so `'guest'` (mọi hình: `===`, `!==`, `case`, `.includes`)
  //   · không tự sinh `err('unattached', …)` — kể cả ở surface `index.ts`: chưa gắn là việc của cổng
  //   · ops/read-ops không tự sinh `err('unauthenticated', …)`; surface được, vì "không có phiên" là
  //     điều chỉ surface biết (nó là nơi gọi `resolveSession`)
  {
    files: ["core/**/*.ts"],
    ignores: [
      "core/**/*.test.ts",
      "core/identity/gates.ts",
      "core/identity/session.ts",
      "core/identity/auth.ts",
      "core/identity/privacy.ts",
      "core/gates/**", // dòng họ thử dựng ngữ cảnh phiên THẬT của tài khoản chưa gắn (`role: 'guest'`)
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "BinaryExpression > Literal[value='guest'], SwitchCase > Literal[value='guest'], CallExpression[callee.property.name='includes'] Literal[value='guest']",
          message:
            "Cổng chỉ có hai tên: gateWriter / gateApprover (core/identity/gates.ts). Chép lại cổng là lặp lỗi 29/08 (story 7-1). Lens thì dùng coQuyenDuyet.",
        },
        {
          selector: "CallExpression[callee.name='err'] > Literal:first-child[value='unattached']",
          message: "Không tự sinh 'unattached' — mã ấy chỉ ra từ gateWriter / gateApprover (story 7-1).",
        },
      ],
    },
  },
  // Khối SAU thay thế cấu hình của cùng luật ở khối trước (flat config không gộp mảng), nên khối
  // ops/read-ops phải mang ĐỦ ba selector — không phải chỉ selector thứ ba.
  {
    files: ["core/**/ops.ts", "core/**/read-ops.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "BinaryExpression > Literal[value='guest'], SwitchCase > Literal[value='guest'], CallExpression[callee.property.name='includes'] Literal[value='guest']",
          message:
            "Cổng chỉ có hai tên: gateWriter / gateApprover (core/identity/gates.ts). Chép lại cổng là lặp lỗi 29/08 (story 7-1). Lens thì dùng coQuyenDuyet.",
        },
        {
          selector: "CallExpression[callee.name='err'] > Literal:first-child[value='unattached']",
          message: "Không tự sinh 'unattached' — mã ấy chỉ ra từ gateWriter / gateApprover (story 7-1).",
        },
        {
          selector: "CallExpression[callee.name='err'] > Literal:first-child[value='unauthenticated']",
          message:
            "Ops không tự sinh 'unauthenticated' — surface (index.ts) mới biết có phiên hay không; trong ops thì qua gateWriter / gateApprover (story 7-1).",
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
