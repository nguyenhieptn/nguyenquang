/**
 * LỜI MỜI GẮN VÀO PHẢ — trạng thái "có tài khoản, chưa gắn node" (AD-8).
 *
 * EXPERIENCE.md § State Patterns — Chưa gắn node: "mọi hành động ghi dẫn về luồng gắn node,
 * không phải về màn lỗi." Đây là một trạng thái thường trực của sản phẩm, nên màn này là một
 * lời mời ấm, không phải một tấm biển cấm. Không dùng son cho khung (son = đã chốt); nút dẫn
 * đi gắn là hành động chính duy nhất của màn nên nút ấy được mang son.
 */
import Link from 'next/link';

export function MoiGanVaoPha({ viecMuonLam }: { viecMuonLam: string }) {
  return (
    <section>
      <h1 className="font-[family-name:var(--font-pha)] text-[23px]">Trước hết, cho phả biết mình là ai</h1>
      <p className="mt-3 text-[17px] leading-relaxed">
        {viecMuonLam} là việc của người trong họ. Tài khoản đã có rồi — còn một bước nữa: nối
        tài khoản vào đúng người của mình trên phả, có người trong họ xác nhận giúp.
      </p>
      <p className="mt-3 text-[17px] leading-relaxed text-muted-foreground">
        Xong bước ấy, quay lại đây là thu được ngay. Bước nối chỉ làm một lần.
      </p>
      <Link
        href="/gan-node"
        className="mt-7 flex min-h-14 w-full items-center justify-center rounded-md bg-primary px-6 text-[17px] font-semibold text-primary-foreground"
      >
        Gắn mình vào phả
      </Link>
    </section>
  );
}
