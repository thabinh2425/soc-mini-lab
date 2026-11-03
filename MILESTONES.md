# SOC Mini Lab — kế hoạch năm giai đoạn

## Giai đoạn 1 — Mô phỏng giao diện (đã hoàn thành)

- React, TypeScript, Vite, Tailwind CSS, Recharts và Lucide.
- Giao diện SOC tối, thích ứng với kích thước màn hình với Dashboard (tổng quan), Alert Center (cảnh báo), Log Explorer (tra cứu nhật ký), Incident Investigation (điều tra), Training Missions (huấn luyện) và Report Center (báo cáo).
- Ba tình huống dữ liệu tổng hợp được gắn nhãn rõ ràng: SSH Brute Force, Suspicious PowerShell và Port Scan.
- Tìm kiếm, lọc, đổi trạng thái cảnh báo, ghi chú, dòng thời gian, chấm điểm và báo cáo.
- Logic nghiệp vụ tách khỏi thành phần giao diện; kiểm thử đơn vị và tương tác.

Tiêu chí nghiệm thu: kiểm thử và dựng bản phát hành thành công; sáu phân hệ hoạt động và tiến trình được lưu.

## Giai đoạn 2 — API và lưu trữ (đã triển khai)

- Máy chủ Python FastAPI, SQLite và SQLAlchemy trong thư mục `backend/`.
- API đọc cảnh báo, nhật ký, các tình huống; cập nhật trạng thái, ghi chú, dòng thời gian, lượt làm nhiệm vụ và báo cáo.
- Giao diện tải dữ liệu qua API, lưu thay đổi vào cơ sở dữ liệu; có trạng thái tải, lỗi, thử lại và xác nhận lưu.
- Chuyển đổi cơ sở dữ liệu Alembic phiên bản 001; nạp dữ liệu mẫu ba tình huống tổng hợp có thể chạy nhiều lần mà không ghi đè tiến trình.
- Kiểm tra dữ liệu đầu vào, lỗi 404/422 và kiểm thử API.
- Chấm điểm cơ bản được chuyển lên máy chủ trong giai đoạn này để điểm lưu vào cơ sở dữ liệu do máy chủ tính.

Tiêu chí nghiệm thu: giao diện đọc/ghi qua FastAPI; tiến trình còn nguyên sau khi khởi động lại; nạp dữ liệu mẫu không nhân bản dữ liệu; kiểm thử máy chủ, giao diện và dựng bản phát hành đều thành công.

Lưu ý: đây là môi trường thực hành cục bộ một người dùng. Tiến trình localStorage của giai đoạn 1 không tự nhập vào cơ sở dữ liệu và không bị xóa. Cơ sở dữ liệu mới bắt đầu từ bộ mô phỏng.

## Giai đoạn 3 — Bộ phát hiện (đã triển khai)

- Viết bộ phát hiện theo quy tắc cho dò mật khẩu SSH, PowerShell đáng ngờ và quét cổng ngang.
- Tách thông tin mô tả quy tắc, ngưỡng, liên kết bằng chứng và cảnh báo khỏi giao diện.
- Nạp nhật ký và chạy phát hiện lặp lại được trên dữ liệu tổng hợp.
- Chuẩn hóa nhật ký, kiểm tra cấu trúc dữ liệu và chống xung đột ID khi nạp.
- Ba quy tắc có phiên bản trong `backend/app/rules.json`; cửa sổ trượt tính theo thời gian sự kiện.
- Chuyển đổi cơ sở dữ liệu 002 thêm bảng liên kết bằng chứng và lịch sử chạy.
- Alert Center có nút nạp nhật ký, chạy phát hiện và xem bằng chứng; Investigation hiển thị cảnh báo và dòng thời gian tự sinh.
- Chạy lại không nhân bản cùng phát hiện; giữ trạng thái người phân tích đã cập nhật.

Tiêu chí nghiệm thu: mỗi bộ dữ liệu tạo đúng cảnh báo và chuỗi bằng chứng; dữ liệu đối chứng không tạo cảnh báo sai.

## Giai đoạn 4 — Quy trình huấn luyện (đã triển khai)

- Mở rộng chấm điểm cơ bản đã có ở giai đoạn 2.
- Thêm phiên huấn luyện, mục tiêu, lựa chọn bằng chứng, phản hồi và tiếp tục lượt làm dở.
- Liên kết kết quả điều tra với báo cáo nhiệm vụ trong phạm vi ba tình huống.
- Chuyển đổi cơ sở dữ liệu 003 thêm phiên huấn luyện; lưu bản nháp ở máy chủ và tiếp tục sau khi tải lại/khởi động lại.
- Chọn bằng chứng, ghi kết luận; chấm sáu mục tiêu trên tổng 100 điểm và hiển thị phản hồi.
- Kiểm tra số phiên bản chống ghi đè từ thẻ trình duyệt cũ; nộp lại cùng phiên không tạo lượt làm trùng.
- Khóa bài đã nộp, cho phép tạo lượt mới; giữ lịch sử và hồ sơ điều tra tại thời điểm nộp trong Report Center.
- Các lượt chấm điểm giai đoạn 2 được giữ nguyên; bản nháp mới chỉ lưu khi bấm **Save draft** (lưu bản nháp) hoặc **Submit and grade** (nộp và chấm điểm).

Tiêu chí nghiệm thu: người học có thể hoàn thành, tiếp tục và chấm điểm cả ba nhiệm vụ với tiến trình phía máy chủ.

## Giai đoạn 5 — Hoàn thiện và bàn giao (đã triển khai)

- Thống nhất giao diện và phản hồi hệ thống bằng tiếng Anh; tài liệu hướng dẫn bằng tiếng Việt. Bước chuyển đổi cơ sở dữ liệu 004 cập nhật phản hồi hệ thống trong lịch sử mà không đổi điểm số hoặc nội dung người dùng nhập.
- Cải thiện khả năng truy cập, trạng thái lỗi/tải, giao diện thích ứng với kích thước màn hình và xuất báo cáo.
- Bổ sung kiểm thử tích hợp, tập lệnh cài đặt Windows, ví dụ cấu hình và tài liệu cuối cùng.
- Kiểm tra cài đặt mới và toàn bộ luồng mô phỏng trên Windows PowerShell.
- Xuất JSON đầy đủ và CSV tổng hợp, bảo toàn tiếng Việt và vô hiệu hóa công thức trong ô văn bản.
- Tập lệnh cài đặt, khởi động, kiểm tra và đóng gói; FastAPI phục vụ cả bản dựng phát hành giao diện và API trên localhost.
- Tệp khóa phiên bản thư viện Python, tệp khóa phiên bản npm, cấu hình mẫu và gói ZIP không chứa dữ liệu người dùng.
- Menu màn hình hẹp truy cập bằng bàn phím, tiêu điểm bàn phím, giảm chuyển động, thử lại và thông báo lỗi mạng rõ ràng.
- Kiểm tra HTTP thật bao gồm khởi động lại tiến trình, xuất báo cáo và giữ dữ liệu. Xem `docs/ACCEPTANCE.md` và `docs/VERIFICATION.md` để biết phạm vi xác minh.
- Cập nhật thư viện phục vụ dựng bản phát hành và kiểm thử được `npm audit` báo lỗi; giữ tệp khóa phiên bản và chạy lại kiểm tra hồi quy.

Tiêu chí nghiệm thu: cài đặt trên máy sạch thành công; các bộ kiểm thử đạt; thực hiện lại được mô phỏng theo tài liệu.

Trạng thái xác minh: đã triển khai mã nguồn. Cài mới trong thư mục riêng trên máy hiện tại không thay thế kiểm tra máy sạch độc lập; nghiệm thu trực quan trên máy tính và màn hình hẹp còn cần xác nhận theo `docs/VERIFICATION.md`.

