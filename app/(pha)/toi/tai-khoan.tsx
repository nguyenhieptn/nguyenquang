'use client';

/**
 * Ô TÀI KHOẢN — lớp "tài khoản" tách khỏi lớp "người trong phả" (FR-64, EXPERIENCE.md § Tài
 * khoản ≠ người trong phả). Client vì đăng xuất là việc của trình duyệt (authClient) và tên
 * tài khoản đọc từ session phía client.
 */
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

export function TaiKhoan() {
  const router = useRouter();
  const { data } = authClient.useSession();
  const ten = data?.user?.name || data?.user?.email || null;

  return (
    <div>
      {ten && <p className="text-[17px]">{ten}</p>}
      <Button
        type="button"
        variant="outline"
        className="mt-3 h-12 w-full text-[17px]"
        onClick={async () => {
          await authClient.signOut();
          router.push('/');
          router.refresh();
        }}
      >
        Đăng xuất
      </Button>
    </div>
  );
}
