/**
 * core/media/storage — the object-storage PORT (AD-11).
 *
 * Recording bytes never live in the database and never only on the VPS. This port is the one
 * seam where bytes enter/leave; PostgreSQL keeps only the handle (`recording.storageKey`).
 *
 * Đợt 1 ships the local-disk adapter (bytes under MEDIA_DIR, backed up off-host per AD-25).
 * Story 4-2 adds the S3-compatible adapter (Cloudflare R2) behind the SAME interface — see the
 * commented stub in getStorage(). Nothing outside this file may know which adapter is live.
 *
 * Keys are uuid-based and validated hard: a key that is not a bare UUID is a caller bug
 * (throw, not Result — no user input ever becomes a key), and the resolved path is re-checked
 * to sit under the root so no future key format can traverse out.
 */
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface MediaStorage {
  put(key: string, data: Buffer | Uint8Array, mime: string): Promise<void>;
  get(key: string): Promise<{ data: Buffer; mime: string } | null>;
  delete(key: string): Promise<void>;
}

const KEY_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertValidKey(key: string): void {
  if (!KEY_RE.test(key)) {
    throw new Error(`MediaStorage: invalid key (must be a bare UUID): ${JSON.stringify(key)}`);
  }
}

/** Bytes as `<root>/<key>`, mime in a sidecar `<root>/<key>.json` — restore needs no DB. */
export class LocalMediaStorage implements MediaStorage {
  private readonly root: string;

  constructor(rootDir: string) {
    this.root = path.resolve(rootDir);
  }

  private pathFor(key: string): string {
    assertValidKey(key);
    const p = path.resolve(this.root, key);
    // Defence in depth: even a valid-looking key must resolve inside the root.
    if (!p.startsWith(this.root + path.sep)) {
      throw new Error('MediaStorage: key escapes the storage root');
    }
    return p;
  }

  async put(key: string, data: Buffer | Uint8Array, mime: string): Promise<void> {
    const p = this.pathFor(key);
    await mkdir(this.root, { recursive: true });
    await writeFile(p, data);
    await writeFile(`${p}.json`, JSON.stringify({ mime }));
  }

  async get(key: string): Promise<{ data: Buffer; mime: string } | null> {
    const p = this.pathFor(key);
    try {
      const [data, meta] = await Promise.all([readFile(p), readFile(`${p}.json`, 'utf8')]);
      const { mime } = JSON.parse(meta) as { mime: string };
      return { data, mime };
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw e;
    }
  }

  async delete(key: string): Promise<void> {
    const p = this.pathFor(key);
    for (const f of [p, `${p}.json`]) {
      try {
        await unlink(f);
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
      }
    }
  }
}

let cached: MediaStorage | null = null;

/** The live adapter. Local disk for Đợt 1; story 4-2 swaps in R2 behind the same port. */
export function getStorage(): MediaStorage {
  // Story 4-2 (S3-compatible / Cloudflare R2):
  // if (process.env.MEDIA_S3_BUCKET) {
  //   cached ??= new S3MediaStorage({
  //     bucket: process.env.MEDIA_S3_BUCKET,
  //     endpoint: process.env.MEDIA_S3_ENDPOINT,   // R2 endpoint
  //     accessKeyId: process.env.MEDIA_S3_ACCESS_KEY_ID,
  //     secretAccessKey: process.env.MEDIA_S3_SECRET_ACCESS_KEY,
  //   });
  //   return cached;
  // }
  cached ??= new LocalMediaStorage(process.env.MEDIA_DIR ?? 'var/media');
  return cached;
}
