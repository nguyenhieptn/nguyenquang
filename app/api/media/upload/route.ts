/**
 * POST /api/media/upload — nhận tệp lời kể đã thu xong từ trình duyệt (FR-47).
 *
 * Adapter only (AD-1): đọc multipart, gọi core/media.saveRecording — danh tính do core tự
 * lấy từ session (AD-24), route không nói mình là ai. Trả nguyên Result JSON cho UI.
 *
 * Trần kích thước soát HAI lần, cố ý: Content-Length ở đây (từ chối trước khi nuốt cả trăm
 * megabyte vào bộ nhớ, và trả lời bằng JSON đọc được thay vì để một lớp nào đó cắt ngang bằng
 * HTML), rồi MAX_RECORDING_BYTES trong core — core mới là nơi quyết định, header thì nói dối
 * được. Header thiếu hoặc sai chỉ làm mất cái lọc rẻ; nó không mở được cửa nào.
 */
import type { NextRequest } from 'next/server';
import { MAX_RECORDING_BYTES, saveRecording, type AccessTier } from '@/core/media';
import type { CoreErrorCode } from '@/core/types';

/** Phong bì multipart (biên, tên trường, mấy dòng chữ đi kèm) — rộng tay, core chốt phần bytes. */
const PHONG_BI_BYTE = 64 * 1024;

const STATUS: Record<CoreErrorCode, number> = {
  'not-found': 404,
  forbidden: 403,
  unauthenticated: 401,
  unattached: 403,
  invalid: 400,
  conflict: 409,
};

export async function POST(req: NextRequest): Promise<Response> {
  const khaiBao = Number(req.headers.get('content-length'));
  if (Number.isFinite(khaiBao) && khaiBao > MAX_RECORDING_BYTES + PHONG_BI_BYTE) {
    return Response.json(
      { ok: false, error: { code: 'invalid', message: 'Tệp ghi âm vượt quá 100MB.' } },
      { status: 413, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  const form = await req.formData();

  const file = form.get('file');
  if (!(file instanceof File)) {
    return Response.json(
      { ok: false, error: { code: 'invalid', message: 'Thiếu tệp ghi âm.' } },
      { status: 400 },
    );
  }

  const text = (name: string): string | undefined => {
    const v = form.get(name);
    return typeof v === 'string' && v !== '' ? v : undefined;
  };
  const subjectPersonIds = form
    .getAll('subjectPersonIds')
    .filter((v): v is string => typeof v === 'string' && v !== '');
  const durationRaw = text('durationSeconds');

  const result = await saveRecording({
    bytes: Buffer.from(await file.arrayBuffer()),
    // mime từ field riêng nếu client gửi, không thì lấy type của tệp; core kiểm danh sách nhận.
    mime: text('mime') ?? file.type,
    title: text('title') ?? '',
    toldByPersonId: text('toldByPersonId'),
    subjectPersonIds,
    recordedOn: text('recordedOn') ?? '',
    durationSeconds: durationRaw !== undefined ? Number(durationRaw) : undefined,
    accessTier: (text('accessTier') ?? '') as AccessTier,
    sealedUntil: text('sealedUntil'),
  });

  return Response.json(result, {
    status: result.ok ? 201 : STATUS[result.error.code] ?? 400,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
