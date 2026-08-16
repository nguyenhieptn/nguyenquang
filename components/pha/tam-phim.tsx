/**
 * TẤM PHIM — khung đặt video trên trang, dựng theo lối **tranh chèn** của sách in.
 *
 * Spine chi phối: DESIGN.md § Brand & Style (đọc ra "cuốn phả") · § Elevation (không đổ bóng)
 *                 · § Shapes (bo vừa) · § Typography (sàn 15px)
 *                 EXPERIENCE.md § Responsive (NFR-5: điện thoại tầm trung, 4G ở quê)
 *                 · § Voice and Tone (không xưng hô) · § Accessibility Floor
 *
 * ── Ba quyết định, mỗi cái có lý do cứng ──────────────────────────────────
 *
 * **1. KHÔNG tự chạy, và KHÔNG tải trước.** `preload="none"` + poster tĩnh. NFR-5 chốt người dùng
 * đích ở **mạng 4G quê** và ngân sách là *≤ 4 màn, ≤ 3 phút* để thêm một người. Một video tự tải
 * trên trang chủ ăn hết ngân sách ấy trước khi ai kịp làm gì. Video chỉ tải khi có người bấm xem
 * — đó là quyết định về chi phí dữ liệu của người khác, không phải về sở thích.
 *
 * **2. Là TRANH CHÈN, không phải ảnh bìa tràn viền.** Sách in chèn tranh trong khối chữ, có viền
 * và có chú thích. Ảnh bìa tràn viền chạy tự động là ngôn ngữ của trang tiếp thị — thứ mà
 * § Brand & Style bảo phải tránh. Nên: viền giấy, bo vừa, **không đổ bóng**, và luôn có chú thích.
 *
 * **3. Tôn trọng `prefers-reduced-motion`.** Poster đứng yên là mặc định sẵn rồi; điều còn lại là
 * không được có hiệu ứng nào tự nhấp nháy quanh khung.
 */

export function TamPhim({
  /** Đường dẫn video. Chưa có thì khung hiện dạng chỗ-dành-sẵn, không vỡ bố cục. */
  src,
  /** Ảnh đại diện. BẮT BUỘC khi có `src` — không có poster thì khung đen, và khung đen thì lạc hệ. */
  poster,
  /** Chú thích dưới tranh. Câu không chủ ngữ (EXPERIENCE.md § Voice and Tone). */
  chuThich,
  /** Thời lượng, dạng người đọc được: "1 phút 20". Cho người biết mình sắp bỏ ra bao nhiêu. */
  thoiLuong,
  className = '',
}: {
  src?: string;
  poster?: string;
  chuThich: string;
  thoiLuong?: string;
  className?: string;
}) {
  return (
    <figure className={className}>
      <div className="overflow-hidden rounded-md border border-border bg-card">
        {src ? (
          <video
            className="aspect-video w-full"
            src={src}
            poster={poster}
            // Không autoplay, không loop, không muted-autoplay. Xem § 1 ở đầu file.
            preload="none"
            controls
            playsInline
          />
        ) : (
          /* CHỖ DÀNH SẴN — ô kẻ chéo, đúng quy ước dàn trang của bản in để đánh dấu vị trí một
             tranh chưa có.

             Ba lý do chọn hình này thay vì một hộp rỗng có nút ▷:
               · Nút ▷ **mời bấm mà không có gì để bấm** — hứa suông ngay trên giao diện.
               · Hộp rỗng đọc nhầm thành **video hỏng**; ô kẻ chéo thì không ai nhầm được.
               · Nó dựng bằng đúng hai nét viền giấy — không thêm màu, không thêm chất liệu.

             CỐ Ý KHÔNG dùng vân `van-ton-nghi`: vân ấy đã mang nghĩa **"tồn nghi"** cho dữ liệu
             phả. Mượn nó để nói "chưa có video" là làm nhoè một mã hiệu đang gánh việc thật.

             Giữ nguyên `aspect-video` để lúc gắn video thật không phải xô lại bố cục. */
          <svg
            aria-hidden
            viewBox="0 0 16 9"
            preserveAspectRatio="none"
            className="aspect-video w-full text-border"
          >
            {/* `vector-effect="non-scaling-stroke"` giữ nét đúng 1px dù khung co giãn — không có
                nó thì `preserveAspectRatio="none"` kéo nét dày mỏng khác nhau theo hai trục. */}
            <line x1="0" y1="0" x2="16" y2="9" stroke="currentColor" strokeWidth="1"
              vectorEffect="non-scaling-stroke" />
            <line x1="16" y1="0" x2="0" y2="9" stroke="currentColor" strokeWidth="1"
              vectorEffect="non-scaling-stroke" />
          </svg>
        )}
      </div>

      {/* Chú thích nằm DƯỚI tranh, đúng lối sách in — và nó là chỗ nói thời lượng, thứ quyết định
          người ta có bấm hay không. */}
      <figcaption className="mt-2.5 text-[15px] text-muted-foreground">
        {chuThich}
        {thoiLuong && <span> · {thoiLuong}</span>}
      </figcaption>
    </figure>
  );
}
