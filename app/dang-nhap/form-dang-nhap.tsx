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
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
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
  USERNAME_TOO_SHORT: 'Tên đăng nhập cần ít nhất 3 ký tự.',
  USERNAME_TOO_LONG: 'Tên đăng nhập dài quá — rút ngắn lại.',
  INVALID_USERNAME: 'Tên đăng nhập chỉ gồm chữ không dấu, số, dấu chấm hoặc gạch dưới.',
  PASSWORD_TOO_SHORT: 'Mật khẩu cần ít nhất 8 ký tự.',
  PASSWORD_TOO_LONG: 'Mật khẩu dài quá — rút ngắn lại.',
  INVALID_EMAIL: 'Email chưa đúng dạng — xem lại một lượt.',
};
const LOI_CHUNG = 'Chưa vào được — thử lại, hoặc quay lại sau ít phút.';

/** Ô nhập của prototype, nay là input thật: nhãn 15px trên, chữ gõ 17px dưới, cùng một viền. */
function ONhap({
  id,
  nhan,
  ...propsInput
}: { id: string; nhan: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label
      htmlFor={id}
      className="block rounded-md border border-input bg-card px-4 py-3 focus-within:border-ring"
    >
      <span className="block text-[15px] text-muted-foreground">{nhan}</span>
      <input
        id={id}
        className="mt-0.5 block w-full bg-transparent text-[17px] text-foreground outline-none placeholder:text-muted-foreground"
        {...propsInput}
      />
    </label>
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

  async function guiForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (dangGui) return;
    setLoi(null);
    setDangGui(true);
    try {
      const duLieu = new FormData(e.currentTarget);
      const tenDangNhap = String(duLieu.get('tenDangNhap') ?? '').trim();
      const matKhau = String(duLieu.get('matKhau') ?? '');

      const ketQua =
        cheDo === 'dang-nhap'
          ? await authClient.signIn.username({ username: tenDangNhap, password: matKhau })
          : await authClient.signUp.email({
              email: String(duLieu.get('email') ?? '').trim(),
              password: matKhau,
              name: String(duLieu.get('hoTen') ?? '').trim(),
              username: tenDangNhap,
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
            nhan="Tên đăng nhập"
            placeholder="chữ không dấu, không cách"
            autoComplete="username"
            minLength={3}
            required
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

      {/* Đăng nhập Google: server chỉ bật provider khi GOOGLE_CLIENT_ID/SECRET có trong môi
          trường (core/identity/ba.ts) — client không đọc được biến server, và chưa có cờ
          NEXT_PUBLIC_* nào khai báo trạng thái ấy. Nên KHÔNG render nút Google: một nút chết
          tệ hơn không có nút. Khi hạ tầng thêm cờ (vd NEXT_PUBLIC_GOOGLE_SIGNIN=1), dựng nút
          ở đây bằng authClient.signIn.social({ provider: 'google' }). */}
    </div>
  );
}
