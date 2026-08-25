/** Dịch mã lỗi của core ra câu cho người vận hành — dùng chung cho các đảo client của màn. */
export function loiRaCau(loi: { code: string; message: string }): string {
  switch (loi.code) {
    case 'forbidden':
      return 'Chỉ quản trị và đầu mối chi làm được thao tác này.';
    case 'not-found':
      return 'Không tìm thấy đề xuất với mã này — soát lại mã.';
    case 'conflict':
      return `Trạng thái đề xuất đã đổi: ${loi.message}`;
    case 'unattached':
      return 'Tài khoản chưa gắn vào người nào trong phả — gắn xong mới thao tác được.';
    default:
      return loi.message;
  }
}
