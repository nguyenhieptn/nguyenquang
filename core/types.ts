/**
 * Shared core conventions (Consistency Conventions, ARCHITECTURE-SPINE.md):
 * the core returns typed results — it does not throw for expected outcomes.
 * Adapters translate these to HTTP / UI states.
 */

export type CoreErrorCode =
  | 'not-found'
  | 'forbidden' // viewer lacks the right (approval, radius, tier)
  | 'unauthenticated' // no session at all
  | 'unattached' // has account, no clan node (a PERMANENT state — adapters route to gắn node)
  | 'invalid' // input failed validation
  | 'conflict'; // state no longer allows the operation (e.g. already merged)

export type CoreError = {
  code: CoreErrorCode;
  message: string;
  /**
   * Dữ liệu kèm theo lỗi, để màn NỐI TIẾP được thay vì chỉ bày một câu (thêm 25/08/2026).
   *
   * Ca sinh ra nó: `addPlace` gặp một nơi trùng khít thì phải trả về id của nơi đã có "để màn nối
   * thẳng vào đó" — nhưng `CoreError` chỉ có `message`, nên id bị nhét vào giữa một câu tiếng
   * Việt và người dùng nhận được một UUID trần trong hộp đỏ, không có đường đi tiếp.
   *
   * Giữ TUỲ CHỌN và hẹp: đây không phải chỗ nhét dữ liệu chung. Chỉ dùng khi màn có một hành
   * động cụ thể để làm với nó.
   */
  detail?: Record<string, unknown>;
};

export type Result<T> = { ok: true; value: T } | { ok: false; error: CoreError };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const err = <T = never>(
  code: CoreErrorCode,
  message: string,
  detail?: Record<string, unknown>,
): Result<T> => ({
  ok: false,
  error: detail === undefined ? { code, message } : { code, message, detail },
});

/**
 * Every clan id column is Postgres `uuid`: a malformed literal makes the driver THROW 22P02
 * (invalid_text_representation) instead of returning an empty set — a thrown error where the
 * core owes a `Result`, and a 500 where the adapter owes a "không thấy" page. Ids reach the
 * core straight from route params, so every id-taking op guards with this BEFORE the query
 * and treats a non-uuid the same as an id nobody holds: `err('not-found', …)`.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_RE.test(value);
