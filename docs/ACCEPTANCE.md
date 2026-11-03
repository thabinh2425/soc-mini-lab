# Nghiệm thu và bàn giao SOC Mini Lab

Phạm vi: ứng dụng huấn luyện cục bộ một người dùng trên Windows, sáu phân hệ, ba tình huống tổng hợp. Không triển khai lên Internet.

## Kiểm tra tự động

- Giao diện: lọc, cập nhật cảnh báo, phát hiện → bằng chứng, bản nháp → tiếp tục → chấm điểm → lịch sử, lỗi lưu, menu bàn phím, xuất báo cáo.
- Máy chủ: kiểm tra dữ liệu đầu vào, chuyển đổi cơ sở dữ liệu giữ dữ liệu cũ, nạp dữ liệu mẫu không trùng, xử lý đồng thời, phát hiện, thang điểm, bản chụp khi nộp và xuất JSON/CSV.
- HTTP thật: bản dựng phát hành và tài nguyên tĩnh do FastAPI phục vụ, chuyển tiếp Vite, nhật ký bình thường/tấn công, bằng chứng, lưu/chấm bài, xuất báo cáo, khởi động lại tiến trình vẫn giữ dữ liệu.
- Chạy bằng `scripts\check.cmd`. Cơ sở dữ liệu kiểm thử và kiểm tra nhanh luồng tích hợp nằm trong thư mục tạm, không dùng cơ sở dữ liệu thực hành.

## Kiểm tra thủ công

1. Khởi động bằng `scripts\start.cmd`, mở URL in trên cửa sổ dòng lệnh.
2. Mở cả sáu phân hệ trên máy tính và cửa sổ hẹp.
3. Dùng Tab, Shift+Tab, Enter và Escape để mở/đóng menu màn hình hẹp; tiêu điểm bàn phím phải quay về nút mở menu.
4. Trong Alert Center lọc về không có kết quả: không được hiện chi tiết của cảnh báo ngoài bộ lọc.
5. Nạp nhật ký bình thường rồi chạy phát hiện trên cơ sở dữ liệu mới: 0 cảnh báo mới. Nạp nhật ký tấn công: 3 cảnh báo mới. Chạy lại: 0 cảnh báo mới.
6. Lưu ghi chú và dòng thời gian, lưu bài làm dở, tải lại và tiếp tục.
7. Nộp bài, kiểm tra phản hồi và hồ sơ điều tra trong lịch sử.
8. Tải JSON/CSV. JSON có trạng thái hiện tại và lịch sử; CSV có ba dòng tình huống và tiếng Việt đúng.
9. Tắt máy chủ rồi tải/lưu/xuất: hiển thị lỗi có thể xử lý được, không báo lưu thành công giả.
10. Dừng và chạy lại máy chủ: dữ liệu đã lưu vẫn còn.
11. Kiểm tra các nút, hộp xác nhận, lỗi, phản hồi chấm điểm và lịch sử đều dùng tiếng Anh. Ghi chú hoặc kết luận do người dùng nhập vẫn giữ ngôn ngữ ban đầu.

## Giới hạn bàn giao

- Không có tài khoản, phân quyền hay phân tích nhật ký thật liên tục; chỉ lắng nghe tại localhost.
- Bản nháp lưu khi bấm nút, không tự động lưu.
- Bộ phát hiện xử lý theo lô, nhật ký đến muộn làm đổi đầu chuỗi sự kiện có thể sinh ID mới.
- Thang điểm bằng chứng dùng bộ nhật ký mẫu cố định; điểm hồ sơ kiểm tra mức độ hoàn thành, không đánh giá ngữ nghĩa.
- JSON chứa nội dung ghi chú/bài làm đã lưu; CSV chỉ là tổng hợp theo tình huống. Báo cáo không phải bản sao lưu/khôi phục cơ sở dữ liệu.
- Khi muốn sao lưu thủ công, dừng máy chủ rồi sao chép `backend/soc_lab.db` sang nơi riêng. Không xóa cơ sở dữ liệu để nâng cấp.
- Kiểm tra trong thư mục cài mới trên cùng máy không thay thế xác nhận trên một máy Windows sạch độc lập.
