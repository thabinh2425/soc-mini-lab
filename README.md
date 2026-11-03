# SOC Mini Lab

Ứng dụng mô phỏng Trung tâm Điều hành An ninh mạng (SOC), giúp người mới học Cybersecurity thực hành đọc nhật ký, phân tích cảnh báo, điều tra sự cố và lập báo cáo.

**Chạy local trên Windows · Dữ liệu synthetic · Một người dùng**

Mã nguồn được chia sẻ trên GitHub; ứng dụng chưa có bản demo trực tuyến. Toàn bộ dữ liệu thực hành được gắn nhãn **SYNTHETIC DEMO DATA**, không phải dữ liệu giám sát thật. Giao diện dùng tiếng Anh, tài liệu dùng tiếng Việt.

## Chức năng chính

| Phân hệ | Bạn có thể làm gì? |
| --- | --- |
| Dashboard | Xem tổng quan cảnh báo, biểu đồ và tiến trình huấn luyện |
| Alert Center | Tìm kiếm, lọc, đổi trạng thái cảnh báo và chạy bộ phát hiện |
| Log Explorer | Tra cứu nhật ký và tìm bằng chứng |
| Incident Investigation | Lưu ghi chú và tạo dòng thời gian điều tra |
| Training Missions | Lưu bài làm dở, nộp bài và nhận điểm cùng phản hồi |
| Report Center | Xem lịch sử kết quả và xuất báo cáo JSON/CSV |

Ba tình huống có sẵn: **SSH Brute Force**, **Suspicious PowerShell** và **Port Scan**. Tiến trình đã lưu được giữ trong SQLite khi khởi động lại ứng dụng.

## Công nghệ sử dụng

- **Giao diện:** React, TypeScript, Vite, Tailwind CSS, Recharts, Lucide.
- **Máy chủ:** Python, FastAPI, SQLAlchemy, Alembic.
- **Lưu trữ:** SQLite; database được tạo tại `backend/soc_lab.db` khi chạy, không đưa vào Git.

## Chạy trên máy cá nhân

Yêu cầu **Windows 10/11**, **Python 3.12**, **Node.js 20.11+ thuộc nhánh 20, 22.x hoặc 24 trở lên**, npm và PowerShell. Lệnh `python` phải trỏ tới Python 3.12. Lần cài đầu cần Internet để tải thư viện.

Tải mã nguồn bằng **Code → Download ZIP** trên GitHub rồi giải nén. Mở PowerShell tại thư mục chứa `package.json` và chạy:

```powershell
.\scripts\setup.cmd
.\scripts\start.cmd
```

Truy cập **[http://127.0.0.1:8000](http://127.0.0.1:8000)** trên chính máy đó. Một máy chủ phục vụ cả giao diện và API; nhấn **Ctrl+C** để dừng. Những lần sau chỉ cần chạy `start.cmd` trong thư mục `scripts` bằng lệnh trên.

Xem [hướng dẫn cài đặt và xử lý lỗi](docs/SETUP.md) nếu muốn dùng Git, chạy chế độ phát triển hoặc đổi cổng.

## Bài thực hành đầu tiên

1. Vào **Training Missions**, chọn **SSH Brute Force** và bấm **Start mission**.
2. Dùng **Alert Center** và **Log Explorer** để đọc cảnh báo, tìm nhật ký liên quan.
3. Lưu ghi chú và sự kiện trên dòng thời gian trong **Incident Investigation**.
4. Quay lại nhiệm vụ, trả lời câu hỏi, chọn bằng chứng và viết kết luận. Bấm **Save draft** nếu muốn làm tiếp sau.
5. Bấm **Submit and grade**, đọc phản hồi và xem kết quả trong **Report Center**.

Xem [hướng dẫn thực hành](docs/USER_GUIDE.md) để hiểu thang điểm, cách làm lại và thử bộ phát hiện.

## Tài liệu

- [Cài đặt, khởi động và xử lý lỗi](docs/SETUP.md)
- [Hướng dẫn thực hành cho người mới](docs/USER_GUIDE.md)
- [Kiến trúc, API, bộ phát hiện và kiểm thử](docs/DEVELOPMENT.md)
- [Kế hoạch và kết quả triển khai năm giai đoạn](MILESTONES.md)
- [Danh sách nghiệm thu và giới hạn](docs/ACCEPTANCE.md)
- [Kết quả xác minh bản bàn giao](docs/VERIFICATION.md)

## Giới hạn hiện tại

Đây là lab huấn luyện cho một người dùng trên máy cá nhân, chưa có đăng nhập, phân quyền hoặc tách dữ liệu giữa nhiều người. Bộ phát hiện xử lý nhật ký theo lô; ứng dụng không giám sát hệ thống thật liên tục. Điểm hồ sơ đánh giá mức độ hoàn thành, không dùng AI để đánh giá nội dung điều tra.

Năm giai đoạn trong kế hoạch hiện tại đã được triển khai. Triển khai công khai lên Internet và hỗ trợ nhiều người dùng nằm ngoài phạm vi phiên bản này.
