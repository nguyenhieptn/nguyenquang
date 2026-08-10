#!/usr/bin/env node
/**
 * UI Workshop Kit — CLI một file, không phụ thuộc gói ngoài (Node >= 20).
 *
 *   Ở repo NGUỒN (nơi có xưởng sống app/uiworkshop/):
 *     node <kit>/kit.mjs pack [--check]     đóng gói: đồng bộ plumbing sống → kit, cập nhật lock
 *     node <kit>/kit.mjs publish [--check]  phát hành: đẩy kit lên repo GitHub dùng chung
 *
 *   Ở project ĐÍCH (chạy từ gốc repo đích):
 *     node <kit>/kit.mjs doctor             kiểm điều kiện tiền đề, KHÔNG ghi gì
 *     node <kit>/kit.mjs install [--force] [--sprint <path>]
 *     node <kit>/kit.mjs upgrade [--dry] [--theirs]
 *
 * Ba lớp và luật của chúng: xem `workshop.manifest.json`.
 *
 * Vì sao có `upgrade`: mô hình copy-in luôn chết ở chỗ này — sáu tháng sau plumbing sửa ở upstream
 * mà project đã cắm không có đường nhận. Baseline sha ghi lúc cắm (`.workshop-kit.json`) cho phép
 * phân biệt "file người dùng CHƯA động" (cập nhật thẳng) với "đã sửa" (báo, để họ tự trộn).
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT_DIR = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = path.join(KIT_DIR, 'workshop.manifest.json');
const LOCK_PATH = path.join(KIT_DIR, 'workshop.lock.json');
/** Dấu vết ở project đích: kit version + sha từng file lúc cắm (baseline cho `upgrade`). */
const STAMP_REL = 'app/uiworkshop/.workshop-kit.json';

// ── tiện ích ────────────────────────────────────────────────────────────────

const say = (s = '') => process.stdout.write(`${s}\n`);
const sha = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 16);

/** JSON có chú thích (tsconfig.json) + dấu phẩy thừa. Đủ dùng, không cần gói ngoài. */
function readJsonLoose(file) {
  const raw = readFileSync(file, 'utf8');
  let out = '';
  let inStr = false;
  let quote = '';
  let inLine = false;
  let inBlock = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    const n = raw[i + 1];
    if (inLine) {
      if (c === '\n') { inLine = false; out += c; }
      continue;
    }
    if (inBlock) {
      if (c === '*' && n === '/') { inBlock = false; i++; }
      continue;
    }
    if (inStr) {
      out += c;
      if (c === '\\') { out += n ?? ''; i++; continue; }
      if (c === quote) inStr = false;
      continue;
    }
    if (c === '"' || c === "'") { inStr = true; quote = c; out += c; continue; }
    if (c === '/' && n === '/') { inLine = true; i++; continue; }
    if (c === '/' && n === '*') { inBlock = true; i++; continue; }
    out += c;
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, '$1'));
}

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const writeJson = (file, data) => writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);

function copyInto(from, to) {
  mkdirSync(path.dirname(to), { recursive: true });
  copyFileSync(from, to);
}

function gitRoot(from) {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: from, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

/** Gốc repo đang thao tác. Ưu tiên git; không có git thì lấy cwd (miễn có package.json). */
function resolveRoot() {
  const root = gitRoot(process.cwd()) ?? process.cwd();
  return root;
}

const manifest = readJson(MANIFEST_PATH);
const lock = existsSync(LOCK_PATH) ? readJson(LOCK_PATH) : { version: null, plumbing: {}, skeleton: {} };

/** `app-uiworkshop/x` → `app/uiworkshop/x`; entry ngoài xưởng phải khai `target` tường minh. */
function targetOf(entry) {
  if (entry.target) return entry.target;
  const m = /^app-uiworkshop\/(.*)$/.exec(entry.kit);
  if (!m) throw new Error(`Manifest: entry "${entry.kit}" thiếu "target"`);
  return `app/uiworkshop/${m[1]}`;
}
/** Bản SỐNG trong repo nguồn (chỉ có với file dưới xưởng). */
const liveOf = (entry) => (entry.kit.startsWith('app-uiworkshop/') ? targetOf(entry) : null);

const PLUMBING = manifest.layers.plumbing;
const SKELETON = manifest.layers.skeleton;

// ── guard: plumbing phải THẬT SỰ generic ────────────────────────────────────

/**
 * Một cái tên riêng lọt vào plumbing sẽ theo `upgrade` đi khắp mọi project đã cắm — nên đây là
 * lỗi cứng, không phải cảnh báo. Mọi nhãn của project phải đọc từ `_registry/*`.
 */
function guardPlumbing() {
  const { forbiddenLiterals = [], forbiddenPatterns = [], importAllowlist = [] } = manifest.guard ?? {};
  const problems = [];
  for (const entry of PLUMBING) {
    const file = path.join(KIT_DIR, entry.kit);
    if (!existsSync(file)) continue;
    const text = readFileSync(file, 'utf8');
    for (const bad of forbiddenLiterals) {
      if (text.includes(bad)) problems.push(`${entry.kit}: chứa tên riêng "${bad}"`);
    }
    // Token của project lọt vào plumbing — plumbing CHỈ được dùng ws-* (xem tokens.css).
    for (const src of forbiddenPatterns) {
      const hit = new RegExp(src).exec(text);
      if (hit) problems.push(`${entry.kit}: dùng token của project — "${hit[0]}" (chỉ được dùng ws-*)`);
    }
    for (const m of text.matchAll(/from\s+'([^']+)'/g)) {
      const spec = m[1];
      if (!importAllowlist.some((p) => spec === p.replace(/\/$/, '') || spec.startsWith(p))) {
        problems.push(`${entry.kit}: import ngoài allowlist — '${spec}'`);
      }
    }
  }
  return problems;
}

// ── pack (chạy ở repo NGUỒN) ────────────────────────────────────────────────

function cmdPack(args) {
  const check = args.includes('--check');
  const root = resolveRoot();
  let drift = false;

  say('── Plumbing (sống → kit) ──');
  for (const entry of PLUMBING) {
    const live = path.join(root, liveOf(entry));
    const kit = path.join(KIT_DIR, entry.kit);
    const rel = entry.kit.replace(/^app-uiworkshop\//, '');
    if (!existsSync(live)) {
      say(`  ! ${rel} — KHÔNG có ở xưởng sống (đổi tên? cập nhật manifest)`);
      drift = true;
      continue;
    }
    if (existsSync(kit) && sha(live) === sha(kit)) {
      say(`  = ${rel}`);
    } else if (check) {
      say(`  ≠ ${rel} (kit đã lệch)`);
      drift = true;
    } else {
      copyInto(live, kit);
      say(`  ↑ ${rel} (đã cập nhật)`);
    }
  }

  say('── Guard: plumbing có còn generic không ──');
  const problems = guardPlumbing();
  if (problems.length === 0) {
    say('  ✓ không có tên riêng / import lạ');
  } else {
    for (const p of problems) say(`  ✗ ${p}`);
    drift = true;
  }

  // Skeleton: KHÔNG đồng bộ nội dung. Nhưng file khung bị sửa tay = ĐỔI KHUNG, và đó là thứ duy
  // nhất báo được cho project đã cắm rằng phải soát tay → tăng shapeRev.
  say('── Skeleton (khung; đổi = tăng shapeRev để project đã cắm biết mà soát) ──');
  const nextSkeleton = {};
  for (const entry of SKELETON) {
    const kit = path.join(KIT_DIR, entry.kit);
    if (!existsSync(kit)) {
      say(`  ! ${entry.kit} — thiếu trong kit`);
      drift = true;
      continue;
    }
    const cur = sha(kit);
    const prev = lock.skeleton?.[entry.kit];
    if (!prev) {
      nextSkeleton[entry.kit] = { sha: cur, shapeRev: 1 };
      say(`  + ${entry.kit} (shapeRev 1)`);
      if (check) drift = true;
    } else if (prev.sha === cur) {
      nextSkeleton[entry.kit] = prev;
      say(`  = ${entry.kit} (shapeRev ${prev.shapeRev})`);
    } else if (check) {
      nextSkeleton[entry.kit] = prev;
      say(`  ≠ ${entry.kit} — khung đã đổi, lock chưa ghi`);
      drift = true;
    } else {
      nextSkeleton[entry.kit] = { sha: cur, shapeRev: prev.shapeRev + 1 };
      say(`  ↑ ${entry.kit} (shapeRev ${prev.shapeRev} → ${prev.shapeRev + 1})`);
    }
  }

  const nextPlumbing = {};
  for (const entry of PLUMBING) {
    const kit = path.join(KIT_DIR, entry.kit);
    if (existsSync(kit)) nextPlumbing[entry.kit] = sha(kit);
  }

  if (!check) {
    writeJson(LOCK_PATH, {
      $comment: 'SINH TỰ ĐỘNG bởi `kit.mjs pack` — đừng sửa tay. sha = 16 ký tự đầu của sha256.',
      version: manifest.version,
      plumbing: nextPlumbing,
      skeleton: nextSkeleton,
    });
  } else if (JSON.stringify(lock.plumbing ?? {}) !== JSON.stringify(nextPlumbing)) {
    say('  ≠ lock plumbing lệch');
    drift = true;
  }

  say('── Kiểm kiểu kit (tsconfig.kit.json) ──');
  try {
    execFileSync('npx', ['--no-install', 'tsc', '--noEmit', '-p', path.join(KIT_DIR, 'tsconfig.kit.json')], {
      cwd: root,
      stdio: 'inherit',
    });
    say('  ✓ kit tự biên dịch sạch');
  } catch {
    say('  ✗ kit KHÔNG biên dịch được — template lệch khỏi plumbing vừa copy.');
    drift = true;
  }

  if (drift) {
    say(check ? '\nLỆCH — chạy `node kit.mjs pack` để đồng bộ.' : '\nCòn vấn đề ở trên.');
    process.exit(1);
  }
  say(check ? '\nKit khớp xưởng sống.' : `\nXong. Kit v${manifest.version} đã đóng.`);
}

// ── doctor (chạy ở project ĐÍCH) ────────────────────────────────────────────

function collectCss(dir, out = [], depth = 0) {
  if (depth > 4 || !existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = path.join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) collectCss(p, out, depth + 1);
    else if (name.endsWith('.css')) out.push(p);
  }
  return out;
}

/** Thư mục mà alias `@/*` trỏ tới (thường `src/`). null nếu tsconfig không khai. */
function aliasDirOf(root) {
  const tsconfigPath = path.join(root, 'tsconfig.json');
  if (!existsSync(tsconfigPath)) return null;
  const target = readJsonLoose(tsconfigPath).compilerOptions?.paths?.[manifest.requires.alias]?.[0];
  return target ? path.join(root, target.replace(/^\.\//, '').replace(/\/\*$/, '')) : null;
}

/** File CSS gốc của Tailwind v4 — nơi phải nạp cầu nối token. */
function cssEntry(root, appDir, aliasDir) {
  const files = [...collectCss(appDir), ...(aliasDir ? collectCss(aliasDir) : []), ...collectCss(path.join(root, 'styles'))];
  return files.find((f) => /@import\s+['"]tailwindcss['"]/.test(readFileSync(f, 'utf8'))) ?? null;
}

/** Specifier tương đối từ file CSS gốc tới `tokens.css`. */
function importSpec(root, entry) {
  const rel = path.relative(path.dirname(entry), path.join(root, manifest.requires.tokenBridge));
  const posix = rel.split(path.sep).join('/');
  return posix.startsWith('.') ? posix : `./${posix}`;
}

/** Trả về { fails, warns } — fail = cắm vào sẽ KHÔNG chạy; warn = chạy nhưng thiếu một phần. */
function doctor(root, { quiet = false } = {}) {
  const fails = [];
  const warns = [];
  const ok = (s) => !quiet && say(`  ✓ ${s}`);
  const bad = (s) => { fails.push(s); if (!quiet) say(`  ✗ ${s}`); };
  const warn = (s) => { warns.push(s); if (!quiet) say(`  ! ${s}`); };

  if (!quiet) say('── Điều kiện tiền đề ──');

  // 1. Next.js App Router với `app/` ở GỐC repo (không phải src/app).
  const pkgPath = path.join(root, 'package.json');
  if (!existsSync(pkgPath)) {
    bad('không thấy package.json — đang đứng ở gốc repo đích chứ?');
    return { fails, warns };
  }
  const pkg = readJson(pkgPath);
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  if (deps.next) ok(`next ${deps.next}`);
  else bad('thiếu dependency `next` — kit là route Next App Router');

  const appDir = path.join(root, manifest.requires.appRouterRoot);
  if (existsSync(appDir)) ok(`${manifest.requires.appRouterRoot}/ ở gốc repo`);
  else if (existsSync(path.join(root, 'src/app')))
    bad('App Router đang ở src/app — kit cần `app/` ở GỐC (xem specs/frontend-stack.md §1)');
  else bad(`không thấy ${manifest.requires.appRouterRoot}/`);

  // 2. Alias @/* — plumbing import `@/components/ui/card`.
  const tsconfigPath = path.join(root, 'tsconfig.json');
  let aliasDir = null;
  if (!existsSync(tsconfigPath)) {
    bad('không thấy tsconfig.json');
  } else {
    const paths = readJsonLoose(tsconfigPath).compilerOptions?.paths ?? {};
    const target = paths[manifest.requires.alias]?.[0];
    if (!target) bad(`tsconfig thiếu paths "${manifest.requires.alias}"`);
    else {
      aliasDir = path.join(root, target.replace(/^\.\//, '').replace(/\/\*$/, ''));
      ok(`alias ${manifest.requires.alias} → ${path.relative(root, aliasDir)}/`);
    }
  }

  // 3. Primitive shadcn/ui mà plumbing dùng. Thiếu export nào thì nói tên export ấy.
  if (aliasDir) {
    for (const prim of manifest.requires.uiPrimitives) {
      const file = path.join(aliasDir, 'components/ui', `${prim}.tsx`);
      if (!existsSync(file)) {
        bad(`thiếu ${path.relative(root, file)} — chạy: npx shadcn@latest add ${prim}`);
        continue;
      }
      const text = readFileSync(file, 'utf8');
      const need = prim === 'card' ? ['Card', 'CardBody', 'CardTitle'] : [];
      const missing = need.filter((n) => !new RegExp(`\\b${n}\\b`).test(text));
      if (missing.length) bad(`${prim}.tsx thiếu export: ${missing.join(', ')}`);
      else ok(`@/components/ui/${prim}`);
    }
  }

  // 4. Cầu nối token. Kit TỰ MANG bảng `ws-*` (tokens.css) nên project đích không cần có sẵn token
  //    nào — thứ duy nhất nó phải có là **file CSS gốc** (nơi `@import 'tailwindcss'`) để nạp cầu
  //    nối vào: Tailwind v4 chỉ sinh utility cho token nằm cùng một luồng biên dịch.
  const entry = cssEntry(root, appDir, aliasDir);
  if (!entry) bad("không thấy file CSS nào có @import 'tailwindcss' (Tailwind v4 CSS-first)");
  else ok(`CSS gốc: ${path.relative(root, entry)}`);

  const bridge = path.join(root, manifest.requires.tokenBridge);
  if (!existsSync(bridge)) {
    if (!quiet) say(`  · cầu nối token chưa cắm — \`install\` sẽ tạo ${manifest.requires.tokenBridge} + nạp vào CSS gốc`);
  } else {
    const text = readFileSync(bridge, 'utf8');
    const missing = manifest.requires.tokens.filter(
      (t) => !new RegExp(`${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`).test(text),
    );
    if (missing.length) bad(`${manifest.requires.tokenBridge} thiếu: ${missing.join(' ')}`);
    else ok(`${manifest.requires.tokens.length} token ws-* trong cầu nối`);
    if (entry && !readFileSync(entry, 'utf8').includes(importSpec(root, entry))) {
      bad(`${path.relative(root, entry)} chưa nạp cầu nối — thêm: @import '${importSpec(root, entry)}';`);
    }
  }

  // 5. BMAD + mỏ neo trạng thái. Cả hai chỉ là WARN: xưởng vẫn chạy, chỉ mất phần cây động.
  // Soi manifest cài đặt chứ KHÔNG soi thư mục `_bmad/`: chính `install` đẻ ra `_bmad/custom/*.toml`
  // nên sau khi cắm thì thư mục luôn tồn tại — kiểm kiểu đó sẽ báo "đã cài" cả khi chưa cài BMAD.
  const bmadManifest = path.join(root, '_bmad/_config/manifest.yaml');
  if (existsSync(bmadManifest)) {
    const v = /version:\s*([\d.]+)/.exec(readFileSync(bmadManifest, 'utf8'))?.[1];
    ok(`BMAD đã cài${v ? ` (v${v})` : ''}`);
  } else {
    warn('chưa cài BMAD (không thấy _bmad/_config/manifest.yaml) — override bmad-ux chưa có tác dụng');
  }

  const sprintRel = manifest.requires.sprintStatus;
  if (existsSync(path.join(root, sprintRel))) ok(sprintRel);
  else warn(`không thấy ${sprintRel} — chip trạng thái story sẽ rỗng; sửa đường dẫn ở _registry/sprint.ts (hoặc cắm bằng --sprint <path>)`);

  return { fails, warns };
}

function cmdDoctor() {
  const root = resolveRoot();
  say(`Project đích: ${root}`);
  const { fails, warns } = doctor(root);
  say('');
  if (fails.length) {
    say(`✗ ${fails.length} thứ phải sửa trước khi cắm (warn: ${warns.length}).`);
    process.exit(1);
  }
  say(`✓ Cắm được. ${warns.length} cảnh báo.`);
}

// ── install / upgrade (chạy ở project ĐÍCH) ─────────────────────────────────

function stampPath(root) {
  return path.join(root, STAMP_REL);
}

/** Đường dẫn để in ra cho người dùng copy — tương đối nếu gần, tuyệt đối nếu phải leo ra ngoài repo. */
function showPath(root, abs) {
  const rel = path.relative(root, abs);
  return rel.startsWith('..') ? abs : rel;
}

/**
 * Nạp cầu nối token từ chính file CSS gốc. Import từ `layout.tsx` KHÔNG dùng được: Tailwind v4 chỉ
 * sinh utility cho token nằm cùng luồng biên dịch với `@import 'tailwindcss'` — sai chỗ thì mọi
 * class `bg-ws-*` im lặng không tồn tại, xưởng ra một đống hộp không màu mà không báo lỗi gì.
 */
function ensureTokenImport(root) {
  const entry = cssEntry(root, path.join(root, manifest.requires.appRouterRoot), aliasDirOf(root));
  if (!entry) {
    say(`  ! không thấy CSS gốc — tự thêm @import '${manifest.requires.tokenBridge}' vào file có @import 'tailwindcss'`);
    return;
  }
  const spec = importSpec(root, entry);
  const raw = readFileSync(entry, 'utf8');
  const relEntry = path.relative(root, entry);
  if (raw.includes(spec)) {
    say(`  · ${relEntry} đã nạp cầu nối token`);
    return;
  }
  const patched = raw.replace(
    /(@import\s+['"]tailwindcss['"][^;]*;\n)/,
    `$1/* Cầu nối token cho vỏ UI Workshop — xem ${manifest.requires.tokenBridge}. */\n@import '${spec}';\n`,
  );
  if (patched === raw) say(`  ! thêm tay vào ${relEntry}: @import '${spec}';`);
  else {
    writeFileSync(entry, patched);
    say(`  ⚙ ${relEntry} += @import '${spec}'`);
  }
}

function cmdInstall(args) {
  const force = args.includes('--force');
  const sprintArg = args[args.indexOf('--sprint') + 1];
  const sprint = args.includes('--sprint') && sprintArg && !sprintArg.startsWith('--') ? sprintArg : null;
  const root = resolveRoot();

  // Chặn tự bắn vào chân: cắm ngược vào chính repo nguồn sẽ ĐÈ xưởng sống bằng khung rỗng.
  const kitInside = KIT_DIR.startsWith(root + path.sep);
  if (kitInside && existsSync(path.join(root, 'app/uiworkshop/_registry/outline.ts')) && !force) {
    say('✗ Đây là repo NGUỒN (đã có xưởng sống ở app/uiworkshop/). `install` sẽ đè khung rỗng lên nó.');
    say('  Muốn đóng gói thì dùng `pack`. Thật sự muốn cắm lại thì thêm --force.');
    process.exit(1);
  }

  say(`Project đích: ${root}`);
  const { fails } = doctor(root);
  if (fails.length && !force) {
    say(`\n✗ Dừng: ${fails.length} điều kiện tiền đề chưa đạt. Sửa rồi chạy lại, hoặc --force để cắm bừa.`);
    process.exit(1);
  }

  say('\n── Plumbing (kit → project) ──');
  const installed = {};
  for (const entry of PLUMBING) {
    const from = path.join(KIT_DIR, entry.kit);
    const rel = targetOf(entry);
    const to = path.join(root, rel);
    if (existsSync(to) && sha(to) !== sha(from) && !force) {
      say(`  ! ${rel} — đã tồn tại và KHÁC kit, bỏ qua (dùng \`upgrade\`, hoặc --force để đè)`);
      continue;
    }
    copyInto(from, to);
    installed[rel] = sha(from);
    say(`  + ${rel}`);
  }

  say('── Skeleton (chép MỘT LẦN — có rồi thì giữ nguyên của bạn) ──');
  const shapeRevs = {};
  for (const entry of SKELETON) {
    const from = path.join(KIT_DIR, entry.kit);
    const rel = targetOf(entry);
    const to = path.join(root, rel);
    shapeRevs[rel] = lock.skeleton?.[entry.kit]?.shapeRev ?? 1;
    if (existsSync(to)) {
      say(`  · ${rel} — đã có, giữ nguyên`);
      continue;
    }
    copyInto(from, to);
    say(`  + ${rel}${entry.note ? `  (${entry.note})` : ''}`);
  }

  // Điểm cấu hình #1 của SETUP: đường dẫn sprint-status.yaml, vá thẳng vào bản đã cắm.
  if (sprint) {
    const file = path.join(root, 'app/uiworkshop/_registry/sprint.ts');
    const text = readFileSync(file, 'utf8');
    const patched = text.replace(/process\.cwd\(\),\s*'[^']*sprint-status\.yaml'/, `process.cwd(), '${sprint}'`);
    if (patched === text) say(`  ! không vá được đường dẫn sprint — sửa tay ở _registry/sprint.ts`);
    else {
      writeFileSync(file, patched);
      say(`  ⚙ sprint-status.yaml → ${sprint}`);
    }
  }

  ensureTokenImport(root);

  // Kit nằm trong repo đích thì nó là TEMPLATE, không phải mã app — đừng để tsc/next nuốt.
  if (kitInside) {
    const rel = path.relative(root, KIT_DIR).split(path.sep).join('/');
    const tsconfigPath = path.join(root, 'tsconfig.json');
    if (existsSync(tsconfigPath)) {
      const raw = readFileSync(tsconfigPath, 'utf8');
      if (!raw.includes(rel)) {
        const patched = raw.replace(/"exclude"\s*:\s*\[/, `"exclude": ["${rel}", `);
        if (patched !== raw) {
          writeFileSync(tsconfigPath, patched);
          say(`  ⚙ tsconfig.json exclude += "${rel}"`);
        } else {
          say(`  ! thêm "${rel}" vào "exclude" của tsconfig.json bằng tay`);
        }
      }
    }
  }

  writeJson(stampPath(root), {
    $comment: 'Dấu vết UI Workshop Kit — baseline cho `kit.mjs upgrade`. Đừng sửa tay.',
    kit: manifest.name,
    version: manifest.version,
    plumbing: installed,
    shapeRevs,
  });

  say(`\n✓ Đã cắm kit v${manifest.version}. Việc tiếp theo (SETUP.md §2–3):`);
  say('  1. _registry/outline.ts — đặt SECTIONS + REQ_GROUPS theo FR trong PRD của bạn');
  say('  2. _registry/sprint.ts  — trỏ đúng sprint-status.yaml (nếu chưa dùng --sprint)');
  say('  3. _mock/seed.ts, design-system/page.tsx — thay bằng dữ liệu/brand của bạn');
  say('  4. _bmad/custom/*.toml + ux-assets/react-key-screens.md — thay <PROJECT> và <path-to>');
  say('  5. specs/frontend-stack.md — viết lại theo stack thật');
  say('\n  Nghiệm thu: npm run dev → /uiworkshop · npx tsc --noEmit · build production phải 404.');
}

function cmdUpgrade(args) {
  const dry = args.includes('--dry');
  const theirs = args.includes('--theirs');
  const root = resolveRoot();
  const stamp = stampPath(root);
  if (!existsSync(stamp)) {
    say('✗ Không thấy dấu vết kit ở project này (app/uiworkshop/.workshop-kit.json).');
    say('  Xưởng cắm tay trước khi có kit CLI? Chạy `install --force` một lần để lập baseline,');
    say('  hoặc chép tay rồi tạo dấu vết. Không có baseline thì không phân biệt được "bạn đã sửa".');
    process.exit(1);
  }
  const base = readJson(stamp);
  say(`Đang có: kit v${base.version} → kit v${manifest.version}${dry ? '  (thử, không ghi)' : ''}`);

  say('\n── Plumbing ──');
  const nextInstalled = { ...base.plumbing };
  let touched = 0;
  let conflicts = 0;
  for (const entry of PLUMBING) {
    const rel = targetOf(entry);
    const from = path.join(KIT_DIR, entry.kit);
    const to = path.join(root, rel);
    const kitSha = sha(from);
    if (!existsSync(to)) {
      if (!dry) { copyInto(from, to); nextInstalled[rel] = kitSha; }
      say(`  + ${rel} (thiếu, cắm mới)`);
      touched++;
      continue;
    }
    const curSha = sha(to);
    if (curSha === kitSha) { say(`  = ${rel}`); nextInstalled[rel] = kitSha; continue; }
    const baseSha = base.plumbing?.[rel];
    if (curSha === baseSha || theirs) {
      if (!dry) { copyInto(from, to); nextInstalled[rel] = kitSha; }
      say(`  ↑ ${rel}${theirs && curSha !== baseSha ? ' (ĐÈ bản bạn sửa, --theirs)' : ''}`);
      touched++;
    } else {
      say(`  ! ${rel} — BẠN ĐÃ SỬA, không đè. Xem khác biệt:`);
      say(`      git diff --no-index ${rel} ${showPath(root, from)}`);
      conflicts++;
    }
  }

  // shapeRev: tín hiệu duy nhất báo "KHUNG đổi" — nội dung skeleton là của project nên không đè,
  // nhưng im lặng thì project sẽ chạy plumbing mới trên khung cũ (đúng cách `step.query` từng vỡ).
  say('── Khung (skeleton) — không đè, chỉ báo ──');
  const nextRevs = { ...(base.shapeRevs ?? {}) };
  let shapeWarn = 0;
  let created = 0;
  for (const entry of SKELETON) {
    const rel = targetOf(entry);
    const now = lock.skeleton?.[entry.kit]?.shapeRev ?? 1;
    const had = base.shapeRevs?.[rel] ?? 1;
    // "Không bao giờ đè" ≠ "không bao giờ tạo": file khung MỚI ở upstream (vd tokens.css) phải
    // được cắm, nếu không plumphing mới sẽ chạy thiếu nền.
    if (!existsSync(path.join(root, rel))) {
      if (!dry) copyInto(path.join(KIT_DIR, entry.kit), path.join(root, rel));
      say(`  + ${rel} (khung mới ở upstream)${entry.note ? `  (${entry.note})` : ''}`);
      created++;
      nextRevs[rel] = now;
      continue;
    }
    if (now > had) {
      say(`  ! ${rel} — khung đổi (rev ${had} → ${now}), soát tay:`);
      say(`      git diff --no-index ${rel} ${showPath(root, path.join(KIT_DIR, entry.kit))}`);
      shapeWarn++;
    }
    nextRevs[rel] = now;
  }
  if (shapeWarn === 0 && created === 0) say('  ✓ khung không đổi');
  if (created && !dry) ensureTokenImport(root);

  if (!dry) {
    writeJson(stamp, { ...base, version: manifest.version, plumbing: nextInstalled, shapeRevs: nextRevs });
  }
  say(`\n${dry ? 'Thử xong' : 'Xong'}: ${touched} file cập nhật · ${conflicts} xung đột · ${shapeWarn} khung cần soát.`);
  if (conflicts && !dry) say('Sau khi trộn tay xong, chạy lại `upgrade` để ghi baseline mới.');
}

// ── publish (chạy ở repo NGUỒN) ─────────────────────────────────────────────

const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8' });

/** Kit chưa `pack` mà đem phát hành = đẩy bản lệch cho mọi project đi sau. Chặn ngay. */
function assertPacked() {
  if (lock.version !== manifest.version) {
    say(`✗ lock ghi v${lock.version} còn manifest v${manifest.version} — chạy \`pack\` trước.`);
    process.exit(1);
  }
  for (const entry of PLUMBING) {
    const file = path.join(KIT_DIR, entry.kit);
    if (!existsSync(file) || lock.plumbing?.[entry.kit] !== sha(file)) {
      say(`✗ ${entry.kit} lệch khỏi lock — chạy \`pack\` trước.`);
      process.exit(1);
    }
  }
}

function cmdPublish(args) {
  const check = args.includes('--check');
  const { remote, branch = 'main', exclude = [] } = manifest.publish ?? {};
  if (!remote) {
    say('✗ manifest thiếu publish.remote');
    process.exit(1);
  }
  assertPacked();

  const work = path.join(KIT_DIR, '.publish');
  say(`── Repo phát hành: ${remote} (${branch}) ──`);
  if (!existsSync(path.join(work, '.git'))) {
    mkdirSync(work, { recursive: true });
    git(KIT_DIR, 'clone', remote, work);
    say('  ↓ clone');
  } else {
    git(work, 'fetch', 'origin');
    say('  ↓ fetch');
  }
  try {
    git(work, 'checkout', '-B', branch, `origin/${branch}`);
  } catch {
    git(work, 'checkout', '-B', branch); // repo còn rỗng, chưa có commit nào
  }

  // Đồng bộ CẢ CÂY: xoá sạch rồi chép lại, để file bị gỡ ở nguồn cũng biến mất ở bản phát hành.
  for (const name of readdirSync(work)) {
    if (name === '.git') continue;
    rmSync(path.join(work, name), { recursive: true, force: true });
  }
  for (const name of readdirSync(KIT_DIR)) {
    if (exclude.includes(name)) continue;
    cpSync(path.join(KIT_DIR, name), path.join(work, name), { recursive: true });
  }

  git(work, 'add', '-A');
  const dirty = git(work, 'status', '--porcelain').trim();
  if (!dirty) {
    say(`  = repo phát hành đã khớp kit v${manifest.version}`);
    return;
  }
  say('── Thay đổi ──');
  for (const line of dirty.split('\n').slice(0, 40)) say(`  ${line}`);
  if (check) {
    say(`\nLỆCH — chạy \`node kit.mjs publish\` để đẩy v${manifest.version}.`);
    process.exit(1);
  }

  git(work, 'commit', '-m', `release: ui-workshop-kit v${manifest.version}`);
  // Tag PHẢI có chú thích: `push --follow-tags` chỉ đẩy annotated tag, tag nhẹ ở lại máy im lặng.
  const tag = `v${manifest.version}`;
  if (!git(work, 'tag', '-l', tag).trim()) git(work, 'tag', '-a', tag, '-m', `ui-workshop-kit ${tag}`);
  git(work, 'push', '-u', 'origin', branch, '--follow-tags');
  say(`\n✓ Đã phát hành ${tag} → ${remote}`);
}

// ── dispatch ────────────────────────────────────────────────────────────────

const [cmd, ...args] = process.argv.slice(2);
switch (cmd) {
  case 'pack': cmdPack(args); break;
  case 'doctor': cmdDoctor(); break;
  case 'install': cmdInstall(args); break;
  case 'upgrade': cmdUpgrade(args); break;
  case 'publish': cmdPublish(args); break;
  case 'version': say(`${manifest.name} v${manifest.version}`); break;
  default:
    say('UI Workshop Kit');
    say('  pack [--check]                   (repo NGUỒN) đóng gói: plumbing sống → kit + lock');
    say('  doctor                           (project ĐÍCH) kiểm tiền đề, không ghi gì');
    say('  install [--force] [--sprint <p>] (project ĐÍCH) cắm kit');
    say('  upgrade [--dry] [--theirs]       (project ĐÍCH) nâng plumbing, giữ file bạn đã sửa');
    say('  publish [--check]                (repo NGUỒN) đẩy kit lên repo phát hành + tag version');
    process.exit(cmd ? 1 : 0);
}
