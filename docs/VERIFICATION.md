# Xác minh bản bàn giao

Ngày kiểm tra: 01/11/2026 (Asia/Saigon). Môi trường: Windows, Node.js 26.13.0, Python 3.12.2.

## Bản cập nhật ngôn ngữ

- Giao diện, nhãn trợ năng, thông báo xác nhận/lỗi, phản hồi chấm điểm và cách định dạng ngày giờ được thống nhất bằng tiếng Anh.
- Nội dung hướng dẫn trong `README.md`, `MILESTONES.md`, `docs/ACCEPTANCE.md` và tài liệu này dùng tiếng Việt. Giữ nguyên tên phân hệ, nút, công nghệ, lệnh và đường dẫn để đối chiếu chính xác.
- Bước chuyển đổi cơ sở dữ liệu 004 chỉ dịch tiêu đề và phản hồi do hệ thống tạo trong kết quả cũ; không tính lại điểm và không dịch nội dung người dùng nhập.
- Kiểm thử giao diện: 12 kiểm thử đạt, gồm tìm kiếm/lọc, phát hiện, lưu bài, lịch sử, lỗi, bàn phím và xuất báo cáo.
- Bản dựng phát hành: đạt; tách phần biểu đồ thành tệp riêng, không có cảnh báo tệp lớn hơn 500 kB.
- Kiểm thử máy chủ: 16 kiểm thử đạt, gồm nâng cấp từ phiên bản cơ sở dữ liệu 003 lên 004, dịch phản hồi cũ và giữ nguyên điểm số, bản nháp, ghi chú, kết luận sau hai lần khởi động.
- Luồng HTTP sau cập nhật: đạt; kiểm tra phục vụ bản phát hành, chuyển tiếp API, phát hiện, huấn luyện, xuất báo cáo và giữ dữ liệu khi khởi động lại. Lệnh `scripts\check.cmd` kết thúc với mã 0.

## Kết quả giai đoạn 5 trước cập nhật ngôn ngữ

- Giao diện: 12 kiểm thử đạt. Máy chủ: 15 kiểm thử đạt.
- Luồng HTTP tích hợp đạt: FastAPI phục vụ trang và tài nguyên tĩnh, Vite chuyển tiếp API, chạy phát hiện, huấn luyện, xuất báo cáo và khởi động lại vẫn giữ dữ liệu.
- Cài đặt từ ZIP vào thư mục mới trên cùng máy: `scripts\setup.cmd` và `scripts\check.cmd` đều kết thúc với mã 0. Tạo môi trường Python ảo mới, kiểm tra thư viện Python, cài bằng `npm ci`, kiểm thử và dựng bản phát hành đều thành công. Không dùng lại thư viện đã cài hoặc cơ sở dữ liệu của dự án gốc.
- Danh sách tệp ZIP không chứa cơ sở dữ liệu, thư mục thư viện, môi trường Python ảo, Git hoặc tệp `.env` riêng.

## Phần chưa xác nhận

- Chưa kiểm tra trực quan bản mới trong trình duyệt. Ở lần kiểm tra giai đoạn 5, cả công cụ trình duyệt tích hợp và công cụ điều khiển Windows đều lỗi khởi tạo trước khi mở trang: `failed to write kernel assets: The system cannot find the path specified. (os error 3)`. Kiểm thử jsdom xác nhận tương tác, không xác nhận bố cục hoặc hình ảnh trên máy tính và màn hình hẹp.
- Chưa thử trên máy Windows sạch độc lập. Lần cài vào thư mục mới vẫn sử dụng Node/Python và bộ nhớ đệm thư viện của máy hiện tại.
- Bản cập nhật ngôn ngữ không cài lại thư viện hoặc lặp lại kiểm tra trên máy sạch; sử dụng bộ phiên bản đã xác minh ở giai đoạn 5.

## Thư viện phụ thuộc

Lần cài thử giai đoạn 5 phát hiện 7 mục cảnh báo trong `npm audit` ở bộ thư viện cũ. Sau khi cập nhật Vite 6.4.5, Vitest 4.1.12 và PostCSS 8.5.32, cả lần cài cập nhật và lần cài lại bằng `npm ci` đều báo **0 lỗ hổng** vào ngày kiểm tra. Đây là kết quả kiểm tra thư viện npm tại thời điểm chạy, không phải kiểm toán bảo mật toàn bộ ứng dụng.

Vitest 4 hỗ trợ Vite 6 và Node 20 theo [hướng dẫn nâng cấp chính thức](https://v4.vitest.dev/guide/migration.html). Các tệp khóa phiên bản giúp tái lập môi trường cài đặt.

Jsdom không có bố cục thật nên không dùng để xác nhận kích thước biểu đồ. Máy chủ có cảnh báo về thành phần sắp ngừng hỗ trợ từ Starlette/AnyIO. Khi cài npm có cảnh báo ngừng khuyến nghị sử dụng Recharts 2/whatwg-encoding và thông tin về tập lệnh cài đặt esbuild; kiểm thử và dựng bản phát hành vẫn thành công.

Xem [danh sách nghiệm thu](./ACCEPTANCE.md) để kiểm tra lại các thao tác và giới hạn sản phẩm.
