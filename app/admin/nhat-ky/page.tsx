/**
 * `/admin/nhat-ky` — SỔ NHẬT KÝ của cả dòng họ (story 7-4, FR-39: *ai sửa, khi nào, từ giá trị nào
 * sang giá trị nào*).
 *
 * Ba màn (phiếu, Mâu thuẫn, Nơi chốn) đang nói *"vẫn nằm trong nhật ký"*. Đây là chỗ câu ấy trỏ tới.
 * Chỉ ĐỌC: không nút ghi nào trên màn — bộ lọc là biểu mẫu GET. Quyền duyệt (AD-21): sổ giữ cả giá
 * trị đã rút, đã ẩn, nên chỉ người thấy trọn mới đọc.
 *
 * `<h1>` do layout dựng. Không số trên thanh việc — sổ không phải hàng chờ.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { tieuDeThe } from '@/components/admin/man-admin';
import { Button } from '@/components/ui/button';
import { listJournal, type JournalEntity, type RevisionAction } from '@/core/audit';

export const metadata: Metadata = { title: tieuDeThe('nhat-ky') };
export const dynamic = 'force-dynamic';

const LOAI: Record<JournalEntity, string> = {
  person: 'người',
  assertion: 'khẳng định',
  source: 'nguồn',
  union: 'vợ chồng',
  recording: 'lời kể',
  attachment: 'gắn kết tài khoản',
  merge: 'hợp nhất người',
  place: 'nơi chốn',
  clan: 'sổ dòng họ',
};
const HANH: Record<RevisionAction, string> = {
  create: 'thêm',
  update: 'sửa',
  promote: 'duyệt',
  hide: 'ẩn theo báo cáo',
  restore: 'khôi phục',
  remove: 'loại / gỡ',
  withdraw: 'rút lại',
  merge: 'gộp',
  unmerge: 'tách',
};
const laLoai = (v: unknown): v is JournalEntity => typeof v === 'string' && v in LOAI;
const laHanh = (v: unknown): v is RevisionAction => typeof v === 'string' && v in HANH;

/** Giờ Việt Nam, không phụ thuộc múi giờ của máy chủ (code review 7-4: máy đang chạy UTC−7). */
const DINH_DANG_LUC = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
function luc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return DINH_DANG_LUC.format(d);
}

export default async function NhatKyPage({
  searchParams,
}: {
  searchParams: Promise<{ loai?: string | string[]; hanh?: string | string[]; nguoi?: string | string[]; truoc?: string | string[] }>;
}) {
  const sp = await searchParams;
  const mot = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
  const loai = laLoai(mot(sp.loai)) ? (mot(sp.loai) as JournalEntity) : undefined;
  const hanh = laHanh(mot(sp.hanh)) ? (mot(sp.hanh) as RevisionAction) : undefined;
  const nguoi = mot(sp.nguoi).trim() || undefined;
  const [at, id] = mot(sp.truoc).split('|');
  const truoc = at && id ? { at, id } : undefined;

  const so = await listJournal({ loai, hanh, nguoi, truoc });
  if (!so.ok) {
    if (so.error.code === 'unauthenticated') redirect('/dang-nhap');
    if (so.error.code === 'unattached') {
      return (
        <>
          <p className="max-w-[70ch] text-[17px]">
            Tài khoản chưa gắn vào một người trong phả. Gắn xong — và có vai quản trị hoặc đầu mối
            chi — thì sổ mở ra ở đây.
          </p>
          <Button asChild variant="outline" className="mt-5 h-11 text-[17px]">
            <Link href="/gan-node">Gắn vào người của mình trong phả</Link>
          </Button>
        </>
      );
    }
    return <p className="max-w-[70ch] text-[17px] text-muted-foreground">{so.error.message}</p>;
  }

  const dangLoc = loai !== undefined || hanh !== undefined || nguoi !== undefined || truoc !== undefined;
  const duongTiep = (t: { at: string; id: string }) => {
    const q = new URLSearchParams();
    if (loai) q.set('loai', loai);
    if (hanh) q.set('hanh', hanh);
    if (nguoi) q.set('nguoi', nguoi);
    q.set('truoc', `${t.at}|${t.id}`);
    return `/admin/nhat-ky?${q.toString()}`;
  };
  const O = 'min-h-11 rounded-md border border-ban-vien bg-ban-o px-3 text-[17px]';

  return (
    <>
      <p className="max-w-[70ch] text-[17px]">
        Mọi việc đã làm trên phả, mới nhất trước — kể cả giá trị đã bị loại, đã ẩn, tên nơi đã đổi.
        Không gì trong sổ này bị xoá.
      </p>

      {/* Bộ lọc là biểu mẫu GET: đổi địa chỉ, không ghi gì. */}
      {/* `key` theo bộ lọc: select không điều khiển phải dựng lại sau một lượt điều hướng bằng Link ("Bỏ lọc"). */}
      <form key={`${loai ?? ''}|${hanh ?? ''}|${nguoi ?? ''}`} method="get" className="mt-5 flex flex-wrap items-end gap-3">
        <label className="grid gap-1">
          <span className="text-[15px] font-semibold text-muted-foreground">Loại việc</span>
          <select name="loai" defaultValue={loai ?? ''} className={O}>
            <option value="">— mọi loại —</option>
            {(Object.keys(LOAI) as JournalEntity[]).map((k) => (
              <option key={k} value={k}>
                {LOAI[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-[15px] font-semibold text-muted-foreground">Hành động</span>
          <select name="hanh" defaultValue={hanh ?? ''} className={O}>
            <option value="">— mọi hành động —</option>
            {(Object.keys(HANH) as RevisionAction[]).map((k) => (
              <option key={k} value={k}>
                {HANH[k]}
              </option>
            ))}
          </select>
        </label>
        {nguoi ? <input type="hidden" name="nguoi" value={nguoi} /> : null}
        <Button type="submit" variant="outline" className="h-11 text-[17px]">
          Lọc
        </Button>
        {dangLoc ? (
          <Link href="/admin/nhat-ky" className="inline-flex min-h-11 items-center text-[17px] underline underline-offset-4">
            Bỏ lọc
          </Link>
        ) : null}
      </form>

      {nguoi ? (
        <p className="mt-3 max-w-[70ch] text-[17px]">
          Đang xem riêng{' '}
          <strong className="font-pha">
            {so.value.entries.find((e) => e.nguoi?.personId === nguoi)?.nguoi?.fullName ?? 'một người trong phả'}
          </strong>
          .
        </p>
      ) : null}

      {so.value.entries.length === 0 ? (
        <p className="mt-8 max-w-[70ch] text-[17px] text-muted-foreground">
          {dangLoc ? 'Không có việc nào khớp bộ lọc này.' : 'Sổ còn trống — chưa việc nào được ghi trên phả.'}
        </p>
      ) : (
        <ol className="mt-6 flex flex-col divide-y divide-ban-vien border-t border-ban-vien">
          {so.value.entries.map((e) => (
            <li key={e.id} className="grid gap-x-4 gap-y-1 py-3 md:grid-cols-[11rem_1fr]">
              <p className="text-[15px] text-muted-foreground tabular-nums">
                {luc(e.at)}
                <span className="block">{e.byName}</span>
              </p>
              <div className="min-w-0">
                <p className="text-[17px]">
                  <span className="mr-2 rounded-sm border border-ban-vien px-1.5 text-[15px] text-muted-foreground">
                    {LOAI[e.entity] ?? e.entity}
                  </span>
                  {e.summary}
                  {e.nguoi ? (
                    <>
                      {' '}
                      — về{' '}
                      {/* Sàn chạm 44px cả với liên kết nằm trong câu (soi bắt 49 chỗ ở lượt đo đầu). */}
                      <Link
                        href={`/admin/cay?neo=${encodeURIComponent(e.nguoi.personId)}`}
                        className="inline-flex min-h-11 items-center font-pha underline underline-offset-4"
                      >
                        {e.nguoi.fullName}
                      </Link>
                      {nguoi !== e.nguoi.personId ? (
                        /* Cửa vào bộ lọc theo người — không có cửa thì bộ lọc ấy là mã chết (review 7-4). */
                        <Link
                          href={`/admin/nhat-ky?nguoi=${encodeURIComponent(e.nguoi.personId)}`}
                          className="ml-2 inline-flex min-h-11 items-center text-[15px] text-muted-foreground underline underline-offset-4"
                        >
                          chỉ người này
                        </Link>
                      ) : null}
                    </>
                  ) : null}
                </p>
                {e.note ? (
                  <p className="mt-0.5 max-w-[70ch] break-words border-l-4 border-ban-vien pl-2.5 text-[17px] text-muted-foreground">
                    {e.note}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}

      {so.value.tiep ? (
        <Button asChild variant="outline" className="mt-6 h-11 text-[17px]">
          <Link href={duongTiep(so.value.tiep)}>Xem thêm — việc cũ hơn</Link>
        </Button>
      ) : null}
    </>
  );
}
