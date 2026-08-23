/**
 * GET /api/media/stream/[token] — phát lời kể bằng vé 10 phút (AD-12).
 *
 * Vé do core/media.requestPlayback cấp SAU khi đã soát mức chia sẻ; route này chỉ xác minh
 * vé rồi trả bytes. Không có URL nào khác dẫn tới tệp, và không cache ở đâu hết (AD-23):
 * 'private, no-store' cả khi trúng lẫn khi trượt. Trả nguyên tệp một lần — Accept-Ranges: none.
 */
import { openPlaybackStream } from '@/core/media';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await ctx.params;
  const result = await openPlaybackStream(token);

  if (!result.ok) {
    return Response.json(result, {
      status: result.error.code === 'not-found' ? 404 : 403,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }

  const { data, mime } = result.value;
  return new Response(new Uint8Array(data), {
    status: 200,
    headers: {
      'Content-Type': mime,
      'Content-Length': String(data.byteLength),
      'Cache-Control': 'private, no-store',
      'Accept-Ranges': 'none',
    },
  });
}
