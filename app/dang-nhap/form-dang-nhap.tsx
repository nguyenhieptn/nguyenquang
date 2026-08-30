'use client';

/**
 * FORM ĐĂNG NHẬP / TẠO TÀI KHOẢN — client component vì xác thực Better Auth chạy từ trình
 * duyệt (cookie phiên do app/api/auth/[...all] đặt).
 *
 * Hai chế độ trên MỘT khuôn, không phải hai trang: người ở đây vừa bị một hành động ghi dẫn
 * tới, mỗi lần chuyển trang là một dịp bỏ dở. Chế độ đổi bằng hai nút đầu form — active mang
 * gạch chân son + chữ đậm, cùng ngôn ngữ trạng thái với thanh điều hướng (không chỉ đổi màu).
 *
 * API đã đối chiếu types trong node_modules/better-auth (plugin username):
 *   · đăng nhập:      authClient.signIn.username({ username, password })
 *   · tạo tài khoản:  authClient.signUp.email({ email, password, name, username })
 *     (`username` là trường bổ sung do usernameClient() suy ra; đăng ký xong tự có phiên)
 *
 * Lỗi hiện bằng khối CHÀM (destructive/canh-bao-nen) viền trái đặc — son để dành cho "đã
 * chốt", lỗi mà cũng đỏ thì đỏ mất nghĩa (DESIGN.md § Colors › Cảnh báo).
 */
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { boDau } from '@/core/so-khop';
import { dichSauDangNhap } from './actions';

type CheDo = 'dang-nhap' | 'tao-tai-khoan';

/**
 * Mã lỗi Better Auth → lời bề mặt A. KHÔNG hiện message gốc (tiếng Anh, giọng kỹ thuật);
 * lời ở đây không xưng hô và không từ công nghệ (EXPERIENCE.md § Voice and Tone).
 */
const LOI: Record<string, string> = {
  INVALID_USERNAME_OR_PASSWORD: 'Tên đăng nhập hoặc mật khẩu chưa đúng.',
  INVALID_EMAIL_OR_PASSWORD: 'Tên đăng nhập hoặc mật khẩu chưa đúng.',
  USERNAME_IS_ALREADY_TAKEN: 'Tên đăng nhập này đã có người dùng — chọn một tên khác.',
  USER_ALREADY_EXISTS: 'Email này đã có tài khoản — chuyển sang đăng nhập.',
  // Mã thật Better Auth trả về khi email trùng (kiểm 23/08/2026, HTTP 422). Thiếu dòng này thì
  // người gõ lại email cũ chỉ nhận được câu chung chung và không biết đường nào mà lần.
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'Email này đã có tài khoản — chuyển sang đăng nhập.',
  USERNAME_TOO_SHORT: 'Tên đăng nhập cần ít nhất 3 ký tự.',
  USERNAME_TOO_LONG: 'Tên đăng nhập dài quá — rút ngắn lại.',
  INVALID_USERNAME: 'Tên đăng nhập chỉ gồm chữ không dấu, số, dấu chấm hoặc gạch dưới.',
  PASSWORD_TOO_SHORT: 'Mật khẩu cần ít nhất 8 ký tự.',
  PASSWORD_TOO_LONG: 'Mật khẩu dài quá — rút ngắn lại.',
  INVALID_EMAIL: 'Email chưa đúng dạng — xem lại một lượt.',
};
const LOI_CHUNG = 'Chưa vào được — thử lại, hoặc quay lại sau ít phút.';

/**
 * TÊN ĐĂNG NHẬP PHẢI LÀ ASCII — và người dùng KHÔNG phải là người phát hiện ra điều đó.
 *
 * Better Auth từ chối dấu tiếng Việt và dấu cách bằng `INVALID_USERNAME` (HTTP 400). Với sản
 * phẩm mà người đo chuẩn là bà bác ~70 tuổi ở quê, để họ gõ tên mình rồi bị máy gạt là hỏng —
 * và câu báo lỗi dù có dịch sang tiếng Việt vẫn tới SAU khi đã hỏng.
 *
 * Nên chặn ở hai lớp, không lớp nào bắt người dùng học luật trước:
 *   1. Gõ tới đâu gấp tới đó — bỏ dấu bằng `boDau` (chính hàm AD-16 dùng để so tên), hạ thường,
 *      dấu cách thành chấm, ký tự lạ rơi ra. Gõ "Nguyễn Hiệp" thì ô hiện "nguyen.hiep".
 *   2. Gợi ý sẵn từ Họ tên đã gõ, chừng nào chưa ai sửa tay ô này.
 * Kết quả: một tên đăng nhập sai không gửi đi được, nên `INVALID_USERNAME` không còn đường xảy ra.
 */
function gapTenDangNhap(s: string): string {
  return boDau(s)
    .toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/\.{2,}/g, '.')
    .slice(0, 32);
}

/** Ô nhập của prototype, nay là input thật: nhãn 15px trên, chữ gõ 17px dưới, cùng một viền. */
function ONhap({
  id,
  nhan,
  goiY,
  ...propsInput
}: { id: string; nhan: string; goiY?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block rounded-md border border-input bg-card px-4 py-3 focus-within:border-ring"
      >
        <span className="block text-[15px] text-muted-foreground">{nhan}</span>
        <input
          id={id}
          aria-describedby={goiY ? `${id}-goi-y` : undefined}
          className="mt-0.5 block w-full bg-transparent text-[17px] text-foreground outline-none placeholder:text-muted-foreground"
          {...propsInput}
        />
      </label>
      {/* Luật của ô nằm DƯỚI ô và ở lại đó — placeholder biến mất ngay khi gõ chữ đầu, tức là
          biến mất đúng lúc người ta cần nó nhất. */}
      {goiY && (
        <p id={`${id}-goi-y`} className="mt-1.5 px-1 text-[15px] text-muted-foreground">
          {goiY}
        </p>
      )}
    </div>
  );
}

export function FormDangNhap({
  /**
   * Chỗ đang dở mà luồng thêm gửi kèm qua `?tiep=` — trang server đã lọc chỉ còn đường nội bộ
   * (xem page.tsx § duongTiep). Có thì vào xong đi thẳng về đấy, phần vừa khai còn nguyên.
   */
  tiep,
}: {
  tiep?: string;
}) {
  const router = useRouter();
  const [cheDo, setCheDo] = useState<CheDo>('dang-nhap');
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  // Hai ô liên động: Họ tên gợi ý Tên đăng nhập, cho tới khi có người sửa tay ô sau.
  const [hoTen, setHoTen] = useState('');
  const [tenDangNhap, setTenDangNhap] = useState('');
  const daSuaTay = useRef(false);

  async function guiForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (dangGui) return;
    setLoi(null);
    setDangGui(true);
    try {
      const duLieu = new FormData(e.currentTarget);
      const matKhau = String(duLieu.get('matKhau') ?? '');
      const nhanDang = tenDangNhap.trim();

      // ĐĂNG NHẬP NHẬN CẢ HAI: email hay tên đăng nhập, tuỳ người nhớ cái nào. Không phải chiều
      // chuộng — là sửa một đường cụt: tài khoản tạo bằng Google (sau này) hoặc bằng script
      // bootstrap KHÔNG có tên đăng nhập, nên một form chỉ nhận tên đăng nhập là khoá cửa chính
      // chủ ngoài nhà. Có '@' thì đi đường email.
      const ketQua =
        cheDo === 'dang-nhap'
          ? nhanDang.includes('@')
            ? await authClient.signIn.email({ email: nhanDang, password: matKhau })
            : await authClient.signIn.username({ username: nhanDang, password: matKhau })
          : await authClient.signUp.email({
              email: String(duLieu.get('email') ?? '').trim(),
              password: matKhau,
              name: hoTen.trim(),
              username: gapTenDangNhap(nhanDang),
            });

      if (ketQua.error) {
        setLoi(LOI[ketQua.error.code ?? ''] ?? LOI_CHUNG);
        return;
      }

      // Phiên đã có. Có chỗ đang dở thì về thẳng đấy — kể cả khi tài khoản chưa gắn vào phả:
      // màn đang dở tự bày lời mời nhận chỗ, và bày ngay tại chỗ người ta đang đứng. Không có
      // thì hỏi server tài khoản này đã có chỗ trong phả chưa, rồi đi tiếp.
      // Lọc lại một lượt ở đây (chỉ đường nội bộ) — đây là chỗ duy nhất gọi router.push.
      const dich =
        tiep && tiep.startsWith('/') && !tiep.startsWith('//') ? tiep : await dichSauDangNhap();
      router.push(dich);
      router.refresh();
    } catch {
      setLoi(LOI_CHUNG);
    } finally {
      setDangGui(false);
    }
  }

  function doiCheDo(moi: CheDo) {
    setCheDo(moi);
    setLoi(null);
    // Luật của ô đổi theo chế độ (đăng nhập nhận email, tạo tài khoản thì không) — giữ lại chữ
    // gõ dở là bày ra một giá trị vừa hợp lệ ở chế độ cũ vừa sai ở chế độ mới.
    setTenDangNhap('');
    daSuaTay.current = false;
  }

  return (
    <div className="mt-6">
      {/* Hai chế độ — cùng ngôn ngữ "mục đang mở" với thanh điều hướng: gạch chân son + đậm,
          không mã hoá chỉ bằng màu. Vùng chạm: h-11 (44px). */}
      <div role="group" aria-label="Đăng nhập hoặc tạo tài khoản" className="flex border-b border-border">
        {(
          [
            ['dang-nhap', 'Đăng nhập'],
            ['tao-tai-khoan', 'Tạo tài khoản'],
          ] as const
        ).map(([khoa, nhan]) => {
          const dangMo = cheDo === khoa;
          return (
            <button
              key={khoa}
              type="button"
              aria-pressed={dangMo}
              onClick={() => doiCheDo(khoa)}
              className={[
                '-mb-px inline-flex h-11 items-center border-b-2 px-4 text-[17px]',
                'outline-none transition-colors duration-150 ease-out',
                'focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring',
                dangMo
                  ? 'border-primary font-semibold text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
              ].join(' ')}
            >
              {nhan}
            </button>
          );
        })}
      </div>

      <form onSubmit={guiForm} className="mt-5">
        <div className="grid gap-3">
          {cheDo === 'tao-tai-khoan' && (
            <>
              {/* Họ tên đứng ĐẦU vì nó là lý do của cả màn: tên này sẽ nằm trên phả, cạnh người
                  được ghi (FR-39). Email chỉ để giữ tài khoản. */}
              <ONhap
                id="ho-ten"
                name="hoTen"
                nhan="Họ tên"
                placeholder="Nguyễn Quang Khánh"
                autoComplete="name"
                required
                value={hoTen}
                onChange={(e) => {
                  setHoTen(e.target.value);
                  if (!daSuaTay.current) setTenDangNhap(gapTenDangNhap(e.target.value));
                }}
                goiY="Tên này sẽ nằm trên phả, cạnh người được ghi."
              />
              <ONhap
                id="email"
                name="email"
                nhan="Email"
                type="email"
                placeholder="ten@thudien.vn"
                autoComplete="email"
                required
              />
            </>
          )}
          <ONhap
            id="ten-dang-nhap"
            name="tenDangNhap"
            nhan={cheDo === 'dang-nhap' ? 'Tên đăng nhập hoặc email' : 'Tên đăng nhập'}
            placeholder="nguyenquangkhanh"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            minLength={3}
            required
            value={tenDangNhap}
            onChange={(e) => {
              daSuaTay.current = true;
              // Gấp dấu CHỈ khi đang tạo tài khoản: ở chế độ đăng nhập ô này còn nhận email,
              // mà gấp thì '@' rơi mất.
              setTenDangNhap(
                cheDo === 'tao-tai-khoan' ? gapTenDangNhap(e.target.value) : e.target.value,
              );
            }}
            goiY={
              cheDo === 'tao-tai-khoan'
                ? 'Chữ không dấu, số, dấu chấm — dấu tự bỏ khi gõ.'
                : undefined
            }
          />
          <ONhap
            id="mat-khau"
            name="matKhau"
            nhan="Mật khẩu"
            type="password"
            autoComplete={cheDo === 'dang-nhap' ? 'current-password' : 'new-password'}
            minLength={cheDo === 'tao-tai-khoan' ? 8 : undefined}
            required
          />
        </div>

        {loi && (
          <div
            role="alert"
            className="mt-4 rounded-md border-l-4 border-destructive bg-canh-bao-nen px-4 py-3"
          >
            <p className="text-[15px] text-foreground">{loi}</p>
          </div>
        )}

        {/* Nút son: hành động chính duy nhất của màn (DESIGN.md § Nút). */}
        <Button type="submit" disabled={dangGui} className="mt-5 h-12 w-full text-[17px]">
          {dangGui ? 'Đang vào…' : cheDo === 'dang-nhap' ? 'Vào phả' : 'Tạo tài khoản'}
        </Button>

        {cheDo === 'tao-tai-khoan' && (
          <p className="mt-3 text-[15px] text-muted-foreground">
            Tạo xong sẽ tới bước nhận chỗ của mình trong phả — nhận xong mới ghi thêm người được.
          </p>
        )}
      </form>

      {/* Đăng nhập Google (story 7-6): server chỉ bật provider khi GOOGLE_CLIENT_ID/SECRET có
          trong môi trường (core/identity/ba.ts); client không đọc được biến server nên đi qua cờ
          NEXT_PUBLIC_GOOGLE_SIGNIN=1 — đặt cùng lúc với hai mã kia (docs/van-hanh.md § Đăng nhập
          Google). Không cờ ⇒ không nút: một nút chết tệ hơn không có nút. */}
      {process.env.NEXT_PUBLIC_GOOGLE_SIGNIN === '1' ? (
        <div className="mt-6 border-t border-border pt-5">
          <Button
            type="button"
            variant="outline"
            disabled={dangGui}
            onClick={() => {
              void authClient.signIn.social({ provider: 'google', callbackURL: '/' });
            }}
            className="h-12 w-full text-[17px]"
          >
            Vào bằng tài khoản Google
          </Button>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Lần đầu vào bằng Google thì cũng tới bước nhận chỗ của mình trong phả như tạo tài khoản.
          </p>
        </div>
      ) : null}
    </div>
  );
}
