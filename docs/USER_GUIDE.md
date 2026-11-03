# Hướng dẫn thực hành SOC Mini Lab

[← Tổng quan dự án](../README.md) · [Cài đặt](SETUP.md) · [Thực hành](USER_GUIDE.md) · [Phát triển](DEVELOPMENT.md)

SOC Mini Lab dành cho người mới học phân tích an ninh mạng và quy trình xử lý sự cố. Bạn đọc dữ liệu mô phỏng, tìm bằng chứng, ghi lại nhận định rồi nộp bài để nhận phản hồi. Toàn bộ nhật ký là **SYNTHETIC DEMO DATA**.

## Bắt đầu với một tình huống

1. Khởi động theo [hướng dẫn cài đặt](SETUP.md), mở `http://127.0.0.1:8000`.
2. Xem **Dashboard** để nắm số cảnh báo và tiến trình.
3. Vào **Training Missions**, chọn **SSH Brute Force** cho lượt thực hành đầu tiên. Hai tình huống còn lại là **Suspicious PowerShell** và **Port Scan**.
4. Đọc yêu cầu, mở **Alert Center** và **Log Explorer** để đối chiếu cảnh báo với nhật ký. Dùng tìm kiếm và bộ lọc để thu hẹp dữ liệu.
5. Trong **Incident Investigation**, lưu ghi chú và các mốc trên dòng thời gian. Quay lại nhiệm vụ để chọn bằng chứng, ghi kết luận và nộp bài.
6. Đọc phản hồi rồi xem lịch sử trong **Report Center**. Bạn có thể làm lại để cải thiện điểm.

Không cần thực hiện tấn công thật hoặc quét mạng để hoàn thành bài tập.

## Huấn luyện và tiếp tục bài làm

1. Vào **Training Missions**, chọn một trong ba tình huống rồi bấm **Start mission**.
2. Trả lời một vài câu, chọn nhật ký bằng chứng và ghi kết luận. Bấm **Save draft**, chờ thông báo thành công.
3. Tải lại trang hoặc khởi động lại máy chủ và giao diện. Mở lại tình huống: đáp án, bằng chứng và kết luận đã lưu được khôi phục.
4. Bấm **Open investigation to add notes and timeline events**. Lưu ghi chú và ít nhất một sự kiện trên dòng thời gian do người phân tích tạo cho tình huống, sau đó quay lại Training Missions.
5. Trả lời đủ câu hỏi rồi bấm **Submit and grade**. Thao tác này lưu bản nháp trước, sau đó máy chủ tính điểm.
6. Xem điểm và phản hồi từng mục tiêu. Bài đã nộp chỉ đọc; bấm **Start new attempt** để bắt đầu lại.
7. Vào **Report Center → Training session history**, mở kết quả để xem bằng chứng, kết luận, ghi chú, dòng thời gian và trạng thái cảnh báo tại thời điểm nộp.

Bài chưa bấm lưu không tự lưu. Ứng dụng cảnh báo khi chuyển tình huống, chuyển phân hệ hoặc đóng/tải lại trang có thay đổi chưa lưu. Khi lỗi mạng, nội dung đang nhập được giữ trên trang để thử lại. Nếu nhận lỗi 409 do thẻ trình duyệt khác đã sửa bài, dùng **Reload session** để lấy bản mới; thao tác này sẽ bỏ thay đổi chưa lưu sau khi xác nhận.

### Thang điểm phiên bản 1

| Mục tiêu | Điểm |
| --- | --- |
| Ba câu hỏi phân tích | 20 mỗi câu, tổng 60 |
| Bằng chứng cốt lõi | Tối đa 25 |
| Ghi chú điều tra đã lưu, không trống | 5 |
| Ít nhất một sự kiện trên dòng thời gian do người phân tích tạo và lưu | 5 |
| Kết luận có ít nhất 20 ký tự sau khi bỏ khoảng trắng đầu/cuối | 5 |

Điểm bằng chứng là kết quả làm tròn của `25 × số nhật ký đúng đã chọn / số nhật ký trong hợp của tập chọn và tập tham chiếu`. Chọn thiếu hoặc thêm nhật ký ngoài tập tham chiếu làm giảm điểm. Bộ tham chiếu cố định dựa trên nhật ký mẫu ban đầu của từng tình huống; nhật ký được nạp thêm cho bộ phát hiện không tự động trở thành đáp án huấn luyện. Phản hồi sau khi nộp giải thích bộ bằng chứng cần thiết.

Điểm ghi chú, dòng thời gian và kết luận chỉ đánh giá việc hoàn thành hồ sơ, không dùng AI để đánh giá ngữ nghĩa. Trạng thái cảnh báo được chụp vào báo cáo nhưng không tính điểm. Các nội dung điều tra cập nhật sau khi nộp không thay đổi báo cáo lịch sử.

Mỗi tình huống có tối đa một phiên đang làm. Bắt đầu lại khi đang có phiên sẽ tiếp tục phiên đó. Bản nháp có số phiên bản để tránh ghi đè; nộp lại một phiên hoàn tất trả về cùng kết quả, không tạo lượt làm mới.

Điểm giai đoạn 2 cũ vẫn hiển thị trong tổng quan và không tự quy đổi sang thang điểm mới. Báo cáo tổng quan lấy lần nộp gần nhất từng tình huống; tạo lượt mới chưa nộp không xóa điểm cũ. **Reset saved progress** xóa cả các phiên huấn luyện, bản nháp và lịch sử điểm, cùng ghi chú và sự kiện trên dòng thời gian của người phân tích như trước.

## Thử bộ phát hiện

Đây là luồng thực hành bổ sung với nhật ký mô phỏng, không phải điều kiện bắt buộc để bắt đầu ba nhiệm vụ có sẵn. Số lượng dưới đây áp dụng khi chưa nạp dữ liệu tùy chỉnh hoặc nhật ký tấn công.

1. Mở **Alert Center**, tại mục **Detection Engine** bấm **Import benign logs**.
2. Bấm **Run detection**: trên cơ sở dữ liệu chưa nạp nhật ký tấn công, có 9 nhật ký chuẩn hóa và 0 cảnh báo mới.
3. Bấm **Import synthetic attack logs**: nạp thêm 13 nhật ký (6 SSH, 1 PowerShell, 6 nhật ký tường lửa).
4. Bấm **Run detection**: tạo 3 cảnh báo có ID bắt đầu bằng `DET-`. Danh sách giữ cả 5 cảnh báo mẫu cũ, tổng cộng 8.
5. Chọn cảnh báo `DET-` để xem quy tắc, phiên bản, lý do và nhật ký bằng chứng. Bấm **Investigate this case** để mở Investigation.
6. Chuyển cảnh báo sang Resolved rồi chạy phát hiện lại: 0 cảnh báo mới, 3 phát hiện đã tồn tại, trạng thái vẫn Resolved.
7. Khởi động lại máy chủ: nhật ký, cảnh báo, bằng chứng và lịch sử chạy vẫn còn.

Bộ phát hiện phân tích **toàn bộ nhật ký chuẩn hóa đã lưu**, không chỉ bộ vừa nạp. Sau khi đã nạp nhật ký tấn công, nạp nhật ký bình thường không xóa nhật ký tấn công và không làm số phát hiện trở về 0. Tám nhật ký minh họa cũ được báo là bỏ qua; chúng không có cấu trúc dữ liệu chuẩn hóa. Nút Reset saved progress không xóa nhật ký, cảnh báo phát hiện hay lịch sử chạy.

Chi tiết quy tắc và định dạng nạp JSON nằm trong [tài liệu phát triển](DEVELOPMENT.md#bộ-phát-hiện-và-nạp-nhật-ký).

## Lưu tiến trình và làm lại

Máy chủ lưu tiến trình trong `backend/soc_lab.db`. Chờ thông báo lưu thành công trước khi đóng trang; bản nháp chỉ lưu khi bấm **Save draft** hoặc **Submit and grade**.

**Reset saved progress** xóa ghi chú, sự kiện trên dòng thời gian do người phân tích tạo, các lượt làm, phiên huấn luyện, bản nháp và lịch sử điểm; đồng thời đưa trạng thái cảnh báo về ban đầu. Thao tác này không xóa nhật ký, cảnh báo phát hiện hoặc lịch sử chạy bộ phát hiện. Chỉ dùng khi muốn làm lại; sao lưu database trước nếu cần giữ kết quả.

## Xuất báo cáo và khả năng truy cập

Trong Report Center chọn **Download JSON report** hoặc **Download CSV summary**. Báo cáo được tạo từ dữ liệu đã lưu phía máy chủ:

- JSON có thời điểm xuất, nhãn tổng hợp, tổng quan, tình huống, cảnh báo, ghi chú, dòng thời gian, lịch sử bài làm, phiên huấn luyện và nhật ký bằng chứng.
- CSV có kết quả mới nhất mỗi tình huống; UTF-8 BOM hỗ trợ tiếng Việt trong Excel. Ô văn bản có tiền tố công thức được thêm dấu nháy đơn để không chạy như công thức.
- Xuất báo cáo không thay đổi dữ liệu. Khi máy chủ không hoạt động, giao diện báo lỗi và cho phép thử lại.

Menu màn hình hẹp hỗ trợ Escape, giữ tiêu điểm bàn phím trong menu, trả tiêu điểm bàn phím khi đóng và ẩn các mục đóng khỏi thứ tự Tab. Có liên kết bỏ qua menu, thông báo tải/lỗi, hỗ trợ giảm chuyển động và nhãn trạng thái không chỉ dựa vào màu.

Xem [danh sách kiểm tra nghiệm thu và giới hạn](ACCEPTANCE.md) và [kết quả xác minh bản bàn giao](VERIFICATION.md). Phiên bản này dành cho môi trường thực hành cục bộ, không phải hệ thống SOC vận hành thực tế nhiều người dùng.
