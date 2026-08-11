import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Đọc SỐNG cây epic → story + trạng thái từ mỏ neo trạng thái của dự án
 * (docs/bmad/implementation-artifacts/sprint-status.yaml).
 *
 * KHÔNG chép tay cấu trúc: sidebar UI Workshop luôn khớp sprint-status vì đọc thẳng từ đó.
 * Chỉ tiêu đề đẹp + link view là overlay (outline.ts). Nhóm story theo epic dựa vào THỨ TỰ
 * trong file — đúng cách chính file tự tổ chức (header epic rồi tới story của nó).
 *
 * Server-only (dùng fs). Chỉ import từ layout.tsx (server component), đừng import ở client.
 */

export type StoryNode = { slug: string; id: string; name: string; status: string };
export type EpicNode = { key: string; status: string; stories: StoryNode[] };

// "2a-1-poi-management" -> { id: "2a.1", name: "poi management" }
function splitStory(slug: string): { id: string; name: string } {
  const m = /^(\d+[a-z]?)-(\d+)-(.+)$/.exec(slug);
  if (!m) return { id: '', name: slug.replace(/-/g, ' ') };
  return { id: `${m[1] ?? ''}.${m[2] ?? ''}`, name: (m[3] ?? '').replace(/-/g, ' ') };
}

export async function readSprintTree(): Promise<EpicNode[]> {
  // ⚙️ ĐIỂM CẤU HÌNH DUY NHẤT khi cắm kit vào project mới: đường dẫn sprint-status.yaml của BMAD.
  // Định dạng epic→story mặc định của BMAD giữ nguyên nên hàm parse bên dưới không cần đổi.
  const file = path.join(process.cwd(), '_bmad-output/implementation-artifacts/sprint-status.yaml');
  let text: string;
  try {
    text = await readFile(file, 'utf8');
  } catch {
    return []; // xưởng vẫn chạy nếu thiếu file — chỉ mất phần cây động
  }

  const epics: EpicNode[] = [];
  let current: EpicNode | null = null;

  for (const line of text.split('\n')) {
    // Chỉ khớp con trực tiếp của development_status: đúng 2 dấu cách + key:value.
    const m = /^ {2}([\w-]+):\s*([\w-]+)/.exec(line);
    const key = m?.[1];
    const status = m?.[2];
    if (!key || !status) continue;
    if (key.endsWith('-retrospective')) continue; // meta, không phải view
    if (key.startsWith('epic-')) {
      current = { key, status, stories: [] };
      epics.push(current);
    } else if (current) {
      current.stories.push({ slug: key, ...splitStory(key), status });
    }
  }
  return epics;
}

export type StoryMeta = { id: string; status: string };

/**
 * Chỉ mục story theo slug → { id ngắn, trạng thái SỐNG }. Sidebar (client) tra map này để vẽ
 * chip trạng thái dưới mỗi view mà không cần fs. Nguồn: cùng sprint-status.yaml.
 */
export async function readStoryIndex(): Promise<Record<string, StoryMeta>> {
  const epics = await readSprintTree();
  const index: Record<string, StoryMeta> = {};
  for (const epic of epics) {
    for (const s of epic.stories) index[s.slug] = { id: s.id, status: s.status };
  }
  return index;
}
