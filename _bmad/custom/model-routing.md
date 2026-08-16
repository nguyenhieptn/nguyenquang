# Định tuyến model cho subagent — Gia phả Nguyễn Quang

Nạp làm `persistent_facts` cho mọi skill BMAD có dispatch subagent. Mục tiêu: **giữ Opus ở chỗ
cần suy luận, hạ model ở chỗ chỉ cần đọc và làm theo** — cắt chi phí mà không cắt năng lực phán đoán.

## Luật

Khi dispatch một subagent, **luôn khai `subagent_type`** theo bảng dưới thay vì để mặc định.
Không khai `subagent_type` nghĩa là subagent chạy bằng model của session (Opus) — đúng cho việc
cần suy luận, lãng phí cho việc cơ học.

| `subagent_type` | Model | Dùng cho |
|---|---|---|
| `bmad-reviewer` | **opus** | Lens của Reviewer Gate, review đối kháng, tầng code review, săn edge case, rubric, feasibility |
| `bmad-distiller` | **opus** | Distill memlog/transcript dài thành spine · PRD · spec kernel · synthesis |
| `bmad-reconciler` | sonnet | Đối chiếu input với output, báo cái gì không lọt sang (reconcile) |
| `bmad-researcher` | sonnet | Nghiên cứu thị trường · lĩnh vực · đối thủ · kỹ thuật; kiểm phiên bản thư viện; quét tài liệu dự án |
| `bmad-drafter` | sonnet | Viết mục/prototype/test từ spec ĐÃ chốt (quyết định đã xong, chỉ còn thi hành) |
| `bmad-scanner` | haiku | Quét cơ học: liệt kê file, grep diện rộng, trích dòng khớp. Chỉ đọc. |

## Ba điều dễ sai

**1. Không chắc thì dùng Opus.** Bảng này tiết kiệm bằng cách hạ model ở việc *đã biết chắc là cơ học*.
Một việc mơ hồ hạ nhầm xuống Sonnet thì phần tiết kiệm không bù nổi một lần phán đoán sai — nhất là
ở Reviewer Gate, nơi giá trị duy nhất của subagent là nó nghĩ độc lập và bắt được cái tác giả nói trượt.

**2. Không bao giờ hạ model của lớp phản biện.** `bmad-reviewer` và `bmad-distiller` ở Opus là
chủ ý, không phải mặc định chưa chỉnh. Hạ chúng xuống là bỏ đúng thứ chúng sinh ra để làm.

**3. Muốn rẻ hơn nữa thì hạ `effort`, đừng hạ model.** Với stage cơ học, `effort: low` cắt token
mà không đổi năng lực suy luận. Hạ model là nước đi sau cùng, không phải nước đầu.

## Ngoài phạm vi

Persona BMAD (Mary · Winston · Amelia · John · Sally · Paige · Tú Lâm) là **skill chạy inline
trong session này**, không phải subagent — không có lần gọi model riêng nào để định tuyến. Chúng
luôn chạy bằng model của session. Bảng trên chỉ áp cho subagent thật sự được dispatch.
