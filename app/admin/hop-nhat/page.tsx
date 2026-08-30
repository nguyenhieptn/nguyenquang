/**
 * MẢNH CHƯA NỐI — bàn hợp nhất mảnh và gỡ bản trùng (bề mặt B; story 3-4, FR-48 · FR-63 · FR-1).
 *
 * Promote từ prototype `8fd4af1^:app/uiworkshop/hop-nhat-manh/page.tsx` — mock thay bằng
 * core/merge (suggestDuplicates · proposeMerge · executeMerge · rejectProposal · unmerge ·
 * listProposals · listMergeHistory) và core/tree (getClanOverview cho mảnh, getAncestryPath
 * cho đời + chi của từng ứng viên và từng bên của đề xuất).
 *
 * Spine chi phối màn này:
 *   · EXPERIENCE.md § IA › Bề mặt B — "Hợp nhất mảnh | FR-48"
 *   · EXPERIENCE.md § State Patterns › Cây rỗng / mảnh rời — hiện TRUNG THỰC số mảnh chưa nối
 *   · EXPERIENCE.md § Component Patterns — "Bot gợi ý, KHÔNG tự gộp"; không cái nào chọn sẵn;
 *     ứng viên luôn bày kèm đời + chi
 *   · DESIGN.md § Cảnh báo là chàm mực (ghi chú của máy, không phải báo hỏng)
 *
 * ── MÀN NÀY TỐN KÉM, VÀ ĐÓ LÀ CHỦ Ý ─────────────────────────────────────────────────────────
 * Gộp hai người là thao tác đắt nhất trong cả sản phẩm: gộp đúng thì hai nhánh dòng họ tìm lại
 * được nhau; gộp sai thì hai cụ khác nhau bị nhập làm một và mọi đời tính từ đó trở xuống lệch.
 * Nên màn cố tình KHÔNG có đường nhanh: không gộp hàng loạt, không gợi ý nào được tích sẵn,
 * và gộp thật đứng sau hai bước (đề xuất → gộp) với hai vai khác nhau (AD-22).
 *
 * ── PHẢI BÀY CẢ CHỖ KHÁC NHAU ───────────────────────────────────────────────────────────────
 * Một màn chỉ liệt kê điểm giống là một màn dụ người bấm gộp. Chỗ khác nhau mới ngăn được lần
 * gộp sai, nên nó đứng NGANG HÀNG với chỗ giống nhau, cùng cỡ chữ, cùng vị trí.
 */
import type { Metadata } from 'next';
import { tieuDeThe } from '@/components/admin/man-admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  listMergeHistory,
  listProposals,
  suggestDuplicates,
  type DuplicateEvidence,
  type DuplicatePerson,
  type ProposalPersonView,
} from '@/core/merge';
import { getAncestryPath, getClanOverview, type PersonCard } from '@/core/tree';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { ChamTinCay } from '@/components/pha/tin-cay';
import { DeXuatGop } from './de-xuat-gop';
import { TachLaiNut, ThaoTacDeXuat } from './thao-tac-de-xuat';


export const metadata: Metadata = { title: tieuDeThe('hop-nhat') };
// AD-23: gợi ý trùng và mảnh đổi theo từng mutation, lọc theo vai người xem — không cache.
export const dynamic = 'force-dynamic';

/** Mỗi cặp tốn thêm hai lần đọc đường-về-gốc để có đời + chi — chặn trên cho màn khỏi phình. */
const SO_CAP_TOI_DA = 20;

/** Thẻ người — dữ liệu phả giữ nguyên luật bề mặt A giữa khung trần của bàn làm việc. */
function TheNguoi({ nguoi, the }: { nguoi: DuplicatePerson; the: PersonCard | undefined }) {
  const tonNghi = the?.tier === 'tentative';
  const dongViTri = the
    ? [
        the.generation != null ? `đời ${the.generation}` : 'chưa nối được về gốc',
        the.branchCode ? `chi ${the.branchCode}` : null,
        the.lifespan || null,
      ]
        .filter(Boolean)
        .join(' · ')
    : nguoi.birthYear
      ? `sinh ${nguoi.birthYear}`
      : 'chưa ghi năm sinh';

  return (
    <div
      className={[
        'rounded-md border px-3.5 py-3',
        tonNghi ? 'van-ton-nghi border-dashed border-tin-ton-nghi' : 'border-border bg-card',
      ].join(' ')}
    >
      <Link
        href={`/nguoi/${nguoi.personId}`}
        // Sàn chạm 44px (story 7-2): liên kết chữ trần cao 23px là món nợ 6-6 đo được ở đúng màn này.
        className="inline-flex min-h-11 items-center font-[family-name:var(--font-pha)] text-[17px] font-semibold underline-offset-4 hover:underline"
      >
        {the?.fullName ?? nguoi.fullName}
      </Link>
      <p className="mt-0.5 text-[15px] text-muted-foreground">{dongViTri}</p>
      {the && (
        <div className="mt-1">
          <ChamTinCay muc={the.confidence} />
        </div>
      )}
    </div>
  );
}

/**
 * Bằng chứng máy → hai cột NGANG HÀNG. Máy chỉ thấy tên gần nhau + năm sinh + người thân
 * chung (core/merge.DuplicateEvidence); đời + chi đọc thêm từ cây để người vận hành khỏi
 * tự tra.
 */
function soSanh(e: DuplicateEvidence, theA: PersonCard | undefined, theB: PersonCard | undefined) {
  const giong: string[] = [];
  const khac: string[] = [];

  if (e.nameSimilarity >= 1) giong.push('tên trùng hệt sau khi bỏ dấu');
  else {
    giong.push(`tên giống ${Math.round(e.nameSimilarity * 100)}% (so trên tên bỏ dấu)`);
    khac.push('tên viết không trùng hệt');
  }

  if (e.birthYearDelta === 0) giong.push('cùng năm sinh');
  else if (e.birthYearDelta != null) khac.push(`năm sinh lệch ${e.birthYearDelta} năm`);
  else khac.push('một trong hai chưa ghi năm sinh — chưa đối chiếu được');

  if (e.sharedRelatives > 0)
    giong.push(`chung ${e.sharedRelatives} người thân đã ghi (cha mẹ, con, hoặc vợ chồng)`);
  else khac.push('không chung người thân nào đã ghi');

  if (theA?.generation != null && theB?.generation != null) {
    if (theA.generation === theB.generation) giong.push(`cùng đời ${theA.generation}`);
    else khac.push(`một người đời ${theA.generation}, một người đời ${theB.generation}`);
  }
  if (theA?.branchCode && theB?.branchCode) {
    if (theA.branchCode === theB.branchCode) giong.push(`cùng chi ${theA.branchCode}`);
    else khac.push(`một người chi ${theA.branchCode}, một người chi ${theB.branchCode}`);
  }

  return { giong, khac };
}

/** Bên của một đề xuất → khuôn thẻ người dùng chung với khu gợi ý. */
function raBen(b: ProposalPersonView): DuplicatePerson {
  return { personId: b.personId, fullName: b.fullName, birthYear: b.birthYear ?? null };
}

/** ISO → "12/08/2026" — ngày cho người vận hành, không phải timestamp. */
function ngayB(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export default async function Page() {
  const goiY = await suggestDuplicates();

  if (!goiY.ok) {
    if (goiY.error.code === 'unauthenticated') redirect('/dang-nhap');
    if (goiY.error.code === 'unattached') {
      // EXPERIENCE.md § State Patterns: hành động ghi dẫn về luồng gắn node, KHÔNG phải màn lỗi.
      return (
        <>
          <p className="max-w-[70ch] text-[17px]">
            Tài khoản chưa gắn vào một người trong phả. Gắn xong — và có vai quản trị hoặc đầu
            mối chi — thì bàn hợp nhất mở ra ở đây.
          </p>
          <Button asChild variant="outline" className="mt-5 h-11 text-[17px]">
            <Link href="/gan-node">Gắn vào người của mình trong phả</Link>
          </Button>
        </>
      );
    }
    // forbidden (và các mã còn lại): vắng lặng lẽ, không băng-rôn lỗi.
    return (
      <p className="max-w-[70ch] text-[17px] text-muted-foreground">
        Bàn hợp nhất chỉ mở cho quản trị và đầu mối chi.
      </p>
    );
  }

  // Mảnh — đọc thật từ cây (AD-5: tính lúc đọc). Hỏng thì bỏ khu này, không hỏng cả màn.
  // Đề xuất đang mở + lịch sử gộp (AD-21: cả hai chỉ mở cho người có quyền duyệt) đọc cùng lượt.
  const [tongQuan, deXuatKq, lichSuKq] = await Promise.all([
    getClanOverview(),
    listProposals('open'),
    listMergeHistory(),
  ]);
  const deXuatMo = deXuatKq.ok ? deXuatKq.value : [];
  const lichSuGop = lichSuKq.ok ? lichSuKq.value : [];
  const manh = tongQuan.ok
    ? [
        ...(tongQuan.value.mainFragment
          ? [{ ...tongQuan.value.mainFragment, nhan: 'Mảnh chính' }]
          : []),
        ...tongQuan.value.unconnectedFragments.map((m, i) => ({ ...m, nhan: `Mảnh rời ${i + 1}` })),
      ]
    : [];
  const soManhRoi = tongQuan.ok ? tongQuan.value.unconnectedFragments.length : null;

  // Đời + chi cho từng ứng viên — đọc qua đường-về-gốc của chính người đó (AD-5, tính tại
  // chỗ). Người đọc không ra (ngoài bán kính, mảnh cụt…) thì thẻ rơi về tên + năm sinh.
  const cap = goiY.value.slice(0, SO_CAP_TOI_DA);
  const ids = [
    ...new Set([
      ...cap.flatMap((c) => [c.a.personId, c.b.personId]),
      ...deXuatMo.flatMap((d) => [d.winner.personId, d.loser.personId]),
    ]),
  ];
  const duong = await Promise.all(ids.map((id) => getAncestryPath(id)));
  const the = new Map<string, PersonCard>();
  ids.forEach((id, i) => {
    const ketQua = duong[i];
    if (ketQua.ok && ketQua.value.steps.length > 0) the.set(id, ketQua.value.steps[0]);
  });

  return (
    <>
      {soManhRoi != null && (
        <p className="max-w-[70ch] text-[17px]">
          Phả đang có <strong>{soManhRoi} mảnh</strong> chưa nối được vào mảnh chính. Đây không
          phải lỗi: đó là phần dòng họ còn nhớ nhưng chưa tìm ra chỗ nối lại.
        </p>
      )}

      {/* Các mảnh bày cạnh nhau, KHÔNG có nét nào nối giữa chúng — vẽ một nét "nối tạm" là
          nói dối đúng cái điều FR-48 sinh ra để chống. */}
      {manh.length > 0 && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {manh.map((m) => (
            <Card key={m.rootPersonId} className="border-ban-vien bg-ban-o py-4">
              <CardBody className="px-5">
                <p className="text-[19px] font-semibold">{m.nhan}</p>
                <p className="mt-1 text-[17px] text-muted-foreground">
                  {m.personCount} người · {m.tentativeCount} tồn nghi
                </p>
                <p className="mt-3 text-[15px] font-bold tracking-wider text-muted-foreground uppercase">
                  Gốc tạm
                </p>
                <p className="mt-1 font-[family-name:var(--font-pha)] text-[17px] font-semibold">
                  {m.rootName}
                </p>
                {/* FR-63 nói thành lời ngay tại chỗ: gốc tạm là "cụ xa nhất hiện biết",
                    không phải khẳng định đã là Thuỷ tổ. */}
                <p className="mt-1 text-[15px] text-muted-foreground">
                  cụ xa nhất mảnh này hiện biết
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* ── Khu (a): máy thấy giống nhau ─────────────────────────────────────────────────── */}
      <h2 className="mt-10 text-[19px] font-semibold">
        Máy thấy {goiY.value.length} cặp có thể là cùng một người
        {goiY.value.length > SO_CAP_TOI_DA ? ` · bày ${SO_CAP_TOI_DA} cặp giống nhất trước` : ''}
      </h2>
      <p className="mt-1.5 max-w-[70ch] text-[17px] text-muted-foreground">
        Gợi ý, không tự gộp. Trong một dòng họ trùng tên là chuyện thường, nên phần lớn những
        cặp dưới đây sẽ là <em>hai người khác nhau</em> — và trả lời như vậy cũng là một quyết
        định, ghi lại được.
      </p>

      {cap.length === 0 ? (
        <p className="mt-5 max-w-[70ch] text-[17px] text-muted-foreground">
          Chưa thấy cặp nào giống nhau. Cặp đã có đề xuất đang mở cũng không bày lại ở đây.
        </p>
      ) : (
        <div className="mt-5 grid gap-5">
          {cap.map((c) => {
            const theA = the.get(c.a.personId);
            const theB = the.get(c.b.personId);
            const { giong, khac } = soSanh(c.evidence, theA, theB);
            return (
              <div
                key={`${c.a.personId}-${c.b.personId}`}
                className="rounded-md border border-ban-vien bg-ban-o"
              >
                <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
                  <TheNguoi nguoi={c.a} the={theA} />
                  <TheNguoi nguoi={c.b} the={theB} />
                </div>

                {/* Khối chàm — ghi chú của máy, không phải báo hỏng. Ở đây không có gì hỏng:
                    chỉ có một câu hỏi máy không tự trả lời được và đang chuyển cho người. */}
                <div className="border-l-4 border-destructive bg-canh-bao-nen px-5 py-4">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <p className="text-[17px] font-semibold">Giống nhau</p>
                      <ul className="mt-1.5 grid gap-1">
                        {giong.map((cau) => (
                          <li key={cau} className="text-[17px]">
                            {cau}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {/* NGANG HÀNG, không phải một dòng chú thích phía dưới. Xem đầu file. */}
                    <div>
                      <p className="text-[17px] font-semibold">Khác nhau</p>
                      <ul className="mt-1.5 grid gap-1">
                        {khac.length > 0 ? (
                          khac.map((cau) => (
                            <li key={cau} className="text-[17px]">
                              {cau}
                            </li>
                          ))
                        ) : (
                          <li className="text-[17px]">máy không thấy chỗ nào khác nhau — càng phải đọc kỹ</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <DeXuatGop
                    a={{ personId: c.a.personId, ten: theA?.fullName ?? c.a.fullName }}
                    b={{ personId: c.b.personId, ten: theB?.fullName ?? c.b.fullName }}
                  />
                  <p className="mt-2 max-w-[70ch] text-[15px] text-muted-foreground">
                    Chưa quyết được cũng là một câu trả lời đúng — để nguyên, máy sẽ bày lại khi
                    có thêm dữ liệu về một trong hai người.
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Khu (b): đề xuất đang mở — danh sách THẬT từ core/merge.listProposals ────────── */}
      <h2 className="mt-12 text-[19px] font-semibold">
        Đề xuất đang mở{deXuatMo.length > 0 ? ` · ${deXuatMo.length}` : ''}
      </h2>
      <p className="mt-1.5 max-w-[70ch] text-[17px] text-muted-foreground">
        Mỗi đề xuất bày đủ hai hồ sơ và bằng chứng máy thấy — quyết ngay tại dòng. Gộp chạy
        trong một lần ghi duy nhất và ghi trọn danh sách mối nối, nên tách lại là tách đúng.
      </p>

      {deXuatMo.length === 0 ? (
        <p className="mt-5 max-w-[70ch] text-[17px] text-muted-foreground">
          Không có đề xuất nào đang mở. Đề xuất mới mở từ khu gợi ý phía trên sẽ hiện ra ở đây.
        </p>
      ) : (
        <div className="mt-5 grid gap-5">
          {deXuatMo.map((d) => {
            const theThang = the.get(d.winner.personId);
            const theThua = the.get(d.loser.personId);
            const { giong, khac } = soSanh(d.evidence, theThang, theThua);
            return (
              <div key={d.proposalId} className="rounded-md border border-ban-vien bg-ban-o">
                {/* Hai hồ sơ cạnh nhau — hồ sơ GIỮ đứng trước, nói rõ vai từng bên. */}
                <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-[15px] font-semibold text-muted-foreground">
                      Giữ làm hồ sơ chính
                    </p>
                    <TheNguoi nguoi={raBen(d.winner)} the={theThang} />
                  </div>
                  <div>
                    <p className="mb-1.5 text-[15px] font-semibold text-muted-foreground">
                      Gộp vào hồ sơ chính
                    </p>
                    <TheNguoi nguoi={raBen(d.loser)} the={theThua} />
                  </div>
                </div>

                {/* Cùng khối chàm hai cột NGANG HÀNG như khu gợi ý — một ngôn ngữ, hai khu. */}
                <div className="border-l-4 border-destructive bg-canh-bao-nen px-5 py-4">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <p className="text-[17px] font-semibold">Giống nhau</p>
                      <ul className="mt-1.5 grid gap-1">
                        {giong.map((cau) => (
                          <li key={cau} className="text-[17px]">
                            {cau}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[17px] font-semibold">Khác nhau</p>
                      <ul className="mt-1.5 grid gap-1">
                        {khac.length > 0 ? (
                          khac.map((cau) => (
                            <li key={cau} className="text-[17px]">
                              {cau}
                            </li>
                          ))
                        ) : (
                          <li className="text-[17px]">
                            máy không thấy chỗ nào khác nhau — càng phải đọc kỹ
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Lý do của người đề xuất — phần bằng chứng NGƯỜI đưa, đứng cạnh phần máy. */}
                  <p className="mt-4 max-w-[70ch] text-[17px]">
                    <span className="font-semibold">Lý do đề xuất:</span> {d.reason}
                  </p>
                  <p className="mt-1 text-[15px] text-muted-foreground">
                    {d.proposedByName} đề xuất · {ngayB(d.createdAt)}
                  </p>

                  <div className="mt-5">
                    <ThaoTacDeXuat proposalId={d.proposalId} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Lịch sử gộp gần đây — từ nhật ký sửa (AD-10); Tách lại đứng ngay trên dòng gộp ── */}
      <h2 className="mt-12 text-[19px] font-semibold">Lịch sử gộp gần đây</h2>
      {lichSuGop.length === 0 ? (
        <p className="mt-1.5 max-w-[70ch] text-[17px] text-muted-foreground">
          Chưa có lần gộp nào. Khi có, từng lần nằm ở đây kèm đường tách lại.
        </p>
      ) : (
        <ul className="mt-5 grid gap-3">
          {lichSuGop.map((sk) => (
            <li
              key={`${sk.proposalId}-${sk.action}-${sk.at}`}
              className="rounded-md border border-ban-vien bg-ban-o px-5 py-4"
            >
              <p className="text-[17px]">
                {sk.action === 'merge' ? (
                  <>
                    Đã gộp <strong>{sk.loserName}</strong> vào <strong>{sk.winnerName}</strong> —
                    chuyển {sk.repointedCount} mối nối
                  </>
                ) : (
                  <>
                    Đã tách <strong>{sk.loserName}</strong> ra khỏi{' '}
                    <strong>{sk.winnerName}</strong> — trả {sk.repointedCount} mối nối về như
                    trước
                  </>
                )}
              </p>
              <p className="mt-1 text-[15px] text-muted-foreground">
                {sk.byName} · {ngayB(sk.at)}
              </p>
              {sk.action === 'merge' && (
                <div className="mt-3">
                  <TachLaiNut proposalId={sk.proposalId} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Ai được làm gì — AD-22/FR-64, nói rõ tại chỗ như màn hàng chờ. */}
      <p className="mt-10 max-w-[70ch] text-[17px] text-muted-foreground">
        Ai đã gắn vào phả đều đề xuất được. Gộp, bác, tách lại — chỉ quản trị và đầu mối chi.
        Mọi lần gộp đều vào nhật ký sửa, mang tên người gộp, kèm trọn danh sách mối nối đã
        chuyển.
      </p>
    </>
  );
}
