/**
 * Bootstrap the deployment's clan (+ optionally the first admin) — story 1-4.
 * This is how Hiệp first enters the system.
 *
 *   npx tsx scripts/bootstrap-clan.ts [tên dòng họ] [--admin <email> <password> <tên>]
 *                                     [--env-path <path>]
 *
 * Idempotent: reuses GIAPHA_CLAN_ID from the environment when that clan row exists, and an
 * admin email that already holds an active attachment is left untouched. After creating the
 * clan the script upserts GIAPHA_CLAN_ID=<id> into .env (or --env-path) — clan-registry.ts
 * reads it lazily per call, so the app picks it up on next start.
 *
 * The Nguyễn Quang defaults below are CONFIGURATION carried by this script (seed data), not
 * core code — AD-14 keeps core/ and db/ clan-agnostic.
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { createAdmin, ensureClan } from '../core/identity/bootstrap';

const DEFAULT_NAME = 'Dòng họ Nguyễn Quang';
const DEFAULT_SETTINGS = {
  surname: 'Nguyễn',
  middleName: 'Quang',
  motto: '光前裕後',
  mottoPhonetic: 'Quang tiền dụ hậu',
};

function upsertEnvClanId(envPath: string, clanId: string): void {
  const line = `GIAPHA_CLAN_ID=${clanId}`;
  let text = '';
  try {
    text = fs.readFileSync(envPath, 'utf8');
  } catch {
    // no file yet — create it below
  }
  if (/^GIAPHA_CLAN_ID=.*$/m.test(text)) {
    text = text.replace(/^GIAPHA_CLAN_ID=.*$/m, line);
  } else {
    const nl = text.length === 0 || text.endsWith('\n') ? '' : '\n';
    text += `${nl}\n# Clan của triển khai này (ghi bởi scripts/bootstrap-clan.ts — AD-14)\n${line}\n`;
  }
  fs.writeFileSync(envPath, text);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  let adminArgs: { email: string; password: string; name: string } | null = null;
  let envFile = path.resolve(process.cwd(), '.env');
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--admin') {
      const [email, password, name] = argv.slice(i + 1, i + 4);
      if (!email || !password || !name) {
        console.error('--admin cần đủ ba phần: <email> <password> <tên>');
        process.exit(1);
      }
      adminArgs = { email, password, name };
      i += 3;
    } else if (argv[i] === '--env-path') {
      const p = argv[i + 1];
      if (!p) {
        console.error('--env-path cần một đường dẫn');
        process.exit(1);
      }
      envFile = path.resolve(process.cwd(), p);
      i += 1;
    } else {
      positional.push(argv[i]);
    }
  }

  const name = positional[0] ?? DEFAULT_NAME;

  const { clanId, created } = await ensureClan({
    name,
    settings: DEFAULT_SETTINGS,
    existingClanId: process.env.GIAPHA_CLAN_ID ?? null,
  });
  console.log(`${created ? 'Đã tạo' : 'Dùng lại'} clan: ${clanId} (${name})`);

  upsertEnvClanId(envFile, clanId);
  process.env.GIAPHA_CLAN_ID = clanId; // for the rest of this run
  console.log(`Đã ghi GIAPHA_CLAN_ID vào ${envFile}`);

  if (adminArgs) {
    const admin = await createAdmin({ clanId, ...adminArgs });
    console.log(
      admin.created
        ? `Đã tạo quản trị: account=${admin.accountId} person=${admin.personId} attachment=${admin.attachmentId}`
        : `Quản trị đã có sẵn: account=${admin.accountId} person=${admin.personId}`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('BOOTSTRAP FAILED:', e);
    process.exit(1);
  });
