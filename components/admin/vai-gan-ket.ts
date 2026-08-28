/**
 * VAI CỦA MỘT GẮN KẾT — từ vựng và luật quyết, module THUẦN (story 6-2).
 *
 * AD-8: vai sống ở **gắn kết**, không ở tài khoản. Quyền ghi và bán kính riêng tư tính theo
 * NODE, và gắn kết là chỗ nối hai lớp — nên mọi chữ ở đây nói về *người này trong dòng họ*, không
 * nói về *chủ tài khoản này*.
 *
 * `docs/build-contract.md § Phân tầng`: bề mặt `@/core/<module>` được phép, và `import type` bị
 * xoá lúc biên dịch nên không kéo `pg` vào bó trình duyệt. (Bài học story 6-3: bản chép tay chỉ
 * chặn trôi được một chiều.)
 */
import type { AttachmentRole } from '@/core/identity';

/**
 * Vai nói bằng lời NGƯỜI, và nói ra **làm được gì** — không chỉ tên gọi.
 *
 * Người trao vai phải biết mình đang trao cái gì. Một danh sách `admin / branch-head / member`
 * trần là tên mã; nó không cho ai quyết định được.
 */
export const NHAN_VAI: Record<AttachmentRole, { ten: string; lamDuocGi: string }> = {
  admin: {
    ten: 'Quản trị',
    lamDuocGi: 'duyệt được khẳng định của cả dòng họ, và trao được vai cho người khác',
  },
  'branch-head': {
    /**
     * SỬA 27/08 sau code review: bản đầu ghi *"duyệt được khẳng định"* trơn, cạnh dòng admin ghi
     * *"của cả dòng họ"* — đọc cạnh nhau là hiểu đầu mối chi duyệt hẹp hơn. `gateApprover`
     * (`core/assertion/ops.ts`) cho HAI VAI quyền duyệt Y HỆT NHAU, không có mảnh phạm vi chi
     * nào. Khai sai về quyền, trên đúng cái màn dùng để trao quyền, là thứ không được phép.
     */
    ten: 'Đầu mối chi',
    lamDuocGi:
      'duyệt được khẳng định của cả dòng họ (y như quản trị), nhận được người vào phả — nhưng KHÔNG trao được vai và KHÔNG gỡ được gắn kết',
  },
  member: {
    ten: 'Thành viên',
    lamDuocGi: 'ghi thêm được khẳng định, nhưng phải chờ người khác duyệt',
  },
};

export const MOI_VAI: readonly AttachmentRole[] = ['member', 'branch-head', 'admin'];

type LoaiVai = AttachmentRole;
type LoaiTrangThai = 'pending' | 'active' | 'rejected' | 'detached';

/**
 * Vai nào người đang đăng nhập được phép TRAO ở lượt duyệt.
 *
 * Chép đúng luật đã có ở `approveAttachmentOp`: *"any role above 'member' requires admin"*. Đây
 * là bản dịch cho MẮT, không phải một hàng rào thứ hai — core vẫn gác, kể cả khi POST thẳng
 * không qua giao diện. Bày một lựa chọn mà core sẽ từ chối là dựng một đường cụt.
 */
export function vaiTraoDuoc(vaiCuaMinh: AttachmentRole | 'guest'): readonly AttachmentRole[] {
  if (vaiCuaMinh === 'admin') return MOI_VAI;
  if (vaiCuaMinh === 'branch-head') return ['member'];
  return [];
}

export type LyDoKhoa =
  /** Không phải quản trị. */
  | 'khong-phai-quan-tri'
  /** Gắn kết không ở trạng thái đổi được. */
  | 'khong-hoat-dong'
  /** Chính mình — một cú bấm nhầm không được lấy mất quyền của người đang bấm. */
  | 'chinh-minh'
  /** Quản trị cuối cùng — hạ vai người này là khoá cả dòng họ ra khỏi bàn quản trị. */
  | 'admin-cuoi-cung';

/**
 * Nút đổi vai / gỡ gắn của hàng này có bị khoá không, và VÌ SAO.
 *
 * Trả lý do chứ không trả `boolean`: bài học story 6-9 — một nút `disabled` mang lý do trong
 * `title` là lý do mà bàn phím không với tới và cảm ứng không mở được. Lý do phải thành CHỮ
 * luôn hiện bên cạnh nút, nên nơi gọi cần nó ở dạng đọc được.
 *
 * Đây là bản dịch cho mắt; `setAttachmentRoleOp` và `detachAccountOp` vẫn gác thật ở core.
 */
export function lyDoKhoaDoiVai(a: {
  vaiCuaMinh: AttachmentRole | 'guest';
  laChinhMinh: boolean;
  trangThai: 'pending' | 'active' | 'rejected' | 'detached';
  vaiHangNay: AttachmentRole;
  /** Số gắn kết `admin` đang hoạt động của cả dòng họ. */
  soAdminDangHoatDong: number;
}): LyDoKhoa | null {
  if (a.vaiCuaMinh !== 'admin') return 'khong-phai-quan-tri';
  if (a.trangThai !== 'active') return 'khong-hoat-dong';
  /**
   * `admin-cuoi-cung` xét TRƯỚC `chinh-minh` (đổi 27/08 sau code review).
   *
   * Ca một-gắn-kết là ca thật của phả hôm nay: hàng duy nhất vừa là chính mình vừa là quản trị
   * cuối cùng. Trả `chinh-minh` thì màn khuyên *"nhờ một quản trị khác đổi hộ"* — không có ai
   * khác, và lời khuyên ấy che mất lý do đúng.
   */
  if (a.vaiHangNay === 'admin' && a.soAdminDangHoatDong <= 1) return 'admin-cuoi-cung';
  if (a.laChinhMinh) return 'chinh-minh';
  return null;
}

/** Câu nói ra lý do — luôn hiện thành chữ, không nấp trong `title`. */
export const CAU_KHOA: Record<LyDoKhoa, string> = {
  'khong-phai-quan-tri': 'Chỉ quản trị mới đổi được vai.',
  // KHÔNG chỉ sang màn Duyệt: `rejected` và `detached` không có mặt ở màn ấy, nên câu cũ là một
  // đường cụt cho hai trong ba trạng thái nó phủ.
  'khong-hoat-dong':
    'Chỉ đổi vai được cho gắn kết đang hoạt động. Yêu cầu còn chờ thì trao vai ngay ở lượt duyệt.',
  'chinh-minh': 'Đây là gắn kết của chính mình — nhờ một quản trị khác đổi hộ.',
  'admin-cuoi-cung':
    'Đây là quản trị duy nhất của dòng họ — trao vai quản trị cho một người nữa trước đã, kẻo không ai vào được bàn quản trị.',
};

/**
 * Tra nhãn AN TOÀN — cột `role`/`status` là `text` không có CHECK, nên một giá trị ngoài union
 * tới được (một lượt sửa SQL vận hành, một script, một giá trị tương lai). `NHAN_VAI[x].ten` trên
 * một khoá lạ là `undefined.ten` ⇒ TypeError ⇒ **sập cả client component**, không phải suy giảm
 * mềm. Bày chính chuỗi lạ ra thì người vận hành còn thấy có gì đó không ổn.
 */
export function nhanVaiAnToan(vai: string): { ten: string; lamDuocGi: string } {
  return NHAN_VAI[vai as LoaiVai] ?? { ten: vai, lamDuocGi: 'vai không nhận ra — cần xem lại dữ liệu' };
}

export function nhanTrangThaiAnToan(tt: string): string {
  return NHAN_TRANG_THAI[tt as LoaiTrangThai] ?? tt;
}

/** Trạng thái gắn kết nói bằng lời người. */
export const NHAN_TRANG_THAI: Record<'pending' | 'active' | 'rejected' | 'detached', string> = {
  pending: 'đang chờ duyệt',
  active: 'đang gắn',
  rejected: 'đã từ chối',
  detached: 'đã gỡ',
};
