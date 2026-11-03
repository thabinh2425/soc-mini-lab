# Tài liệu phát triển SOC Mini Lab

[← Tổng quan dự án](../README.md) · [Cài đặt](SETUP.md) · [Thực hành](USER_GUIDE.md) · [Phát triển](DEVELOPMENT.md)

Tài liệu dành cho người muốn đọc mã nguồn, sửa ứng dụng hoặc kiểm tra bản bàn giao. Xem [cài đặt](SETUP.md) để chạy FastAPI và Vite trong hai cửa sổ riêng.

## Lưu trữ và kiến trúc

```text
backend/
├── app/             # FastAPI, mô hình SQLAlchemy, dữ liệu mẫu, kiểm tra API
├── migrations/      # Các bước chuyển đổi cơ sở dữ liệu có phiên bản
├── tests/           # API, dữ liệu sai, khởi động lại và đặt lại
└── soc_lab.db       # SQLite được tạo khi chạy, không đưa vào Git
src/
├── components/      # giao diện dùng chung
├── pages/           # sáu phân hệ
├── services/        # Gọi HTTP và các hàm lọc/tính chỉ số
├── state/           # tải dữ liệu và xử lý lưu qua API
├── data/            # Dữ liệu mẫu giai đoạn 1 phục vụ kiểm thử
└── types/           # hợp đồng TypeScript
```

Máy chủ lưu các tình huống, cảnh báo, nhật ký, ghi chú, dòng thời gian, các lượt làm và dữ liệu biểu đồ trong các bảng SQLAlchemy. Dữ liệu JSON giữ nội dung dữ liệu mô phỏng có cấu trúc, các ID và quan hệ tình huống dùng khóa chính/khóa ngoại. Alembic quản lý phiên bản cấu trúc dữ liệu. Bộ nạp dữ liệu mẫu nằm tại `backend/app/fixtures.json`.

API chính: GET `/api/bootstrap`, `/api/alerts`, `/api/logs`, `/api/cases`, `/api/progress`, `/api/reports`; PATCH `/api/alerts/{id}`; PUT `/api/cases/{id}/notes`; GET/POST dòng thời gian và các lượt làm theo tình huống; DELETE `/api/progress`.

Tìm kiếm và lọc tập dữ liệu đã tải vẫn thực hiện ở giao diện. Điểm nhiệm vụ do máy chủ tính, mỗi lần nộp được lưu thành một lượt làm; báo cáo dùng kết quả gần nhất của từng tình huống.

Tiến trình giai đoạn 1 trong localStorage không tự nhập và không bị xóa. Giai đoạn 2 dùng cơ sở dữ liệu mới. Nút **Reset saved progress** xóa ghi chú, dòng thời gian do người phân tích tạo, lượt làm và đưa trạng thái cảnh báo về ban đầu trong cơ sở dữ liệu; chỉ bấm khi muốn làm lại bài thực hành.

Có thể đặt biến môi trường `SOC_DATABASE_URL` thành URL SQLite khác trước khi chạy máy chủ. Mặc định đường dẫn cơ sở dữ liệu cố định tại `backend/soc_lab.db`, không phụ thuộc thư mục cửa sổ dòng lệnh.

Môi trường thực hành dành cho một người dùng trên máy cá nhân, chưa có đăng nhập hay phân quyền. Bộ phát hiện và phiên huấn luyện lưu trên máy chủ đã có ở giai đoạn 3–4.

## API phiên huấn luyện

- POST `/api/training/cases/{case_id}/sessions`: bắt đầu hoặc tiếp tục.
- GET `/api/training/sessions` và GET `/api/training/sessions/{id}`: lịch sử và chi tiết.
- PUT `/api/training/sessions/{id}`: lưu `revision, answers, evidenceIds, conclusion`.
- POST `/api/training/sessions/{id}/submit`: nộp với `revision`.

API danh sách tình huống không trả đáp án hoặc giải thích đáp án trước khi nộp; phản hồi nằm trong kết quả máy chủ. Điểm cuối dành cho lượt làm cũ vẫn được giữ tương thích cho chấm câu hỏi giai đoạn 2, nhưng giao diện giai đoạn 4 sử dụng API phiên huấn luyện.

Kiểm tra bằng `npm.cmd run test`, `npm.cmd run build`, `python -m pytest -q` trong môi trường Python ảo ở thư mục `backend`, và `node scripts/smoke.mjs`. Kiểm tra nhanh luồng tích hợp bao gồm lưu/đọc bản nháp, chấm điểm và cập nhật tiến trình báo cáo qua HTTP thật.

Hướng dẫn sử dụng và thang điểm nằm tại [hướng dẫn thực hành](USER_GUIDE.md#thang-điểm-phiên-bản-1).

## Bộ phát hiện và nạp nhật ký

| Quy tắc | Điều kiện |
| --- | --- |
| SSH-001 v1 | Ít nhất 5 lần SSH thất bại cùng IP nguồn và máy đích trong 300 giây |
| PS-001 v1 | Tiến trình PowerShell/pwsh có `-EncodedCommand`/`-enc`, `-WindowStyle Hidden`/`-W Hidden`, hoặc Set/Add-MpPreference với tham số loại trừ |
| SCAN-001 v1 | TCP SYN từ một IP tới ít nhất 5 IP đích, hoặc 5 cổng trên cùng một IP đích, trong 60 giây |

Biên thời gian được tính bao gồm cả thời điểm cuối. Các cửa sổ đủ điều kiện chồng lấn được gộp thành một chuỗi sự kiện. ID cảnh báo dựa trên quy tắc, phiên bản, nhóm nguồn/đích và nhật ký đầu chuỗi sự kiện; chạy lại cùng dữ liệu không tạo trùng, kể cả hai yêu cầu đồng thời. Nếu bổ sung nhật ký đến muộn làm thay đổi đầu hoặc hợp nhất chuỗi sự kiện, một ID mới có thể xuất hiện; đây là bộ xử lý theo lô của môi trường thực hành, chưa phải tương quan dữ liệu liên tục.

Quy tắc và ngưỡng nằm ở máy chủ, không viết cố định trong giao diện. Khi thay đổi ngữ nghĩa quy tắc, tăng phiên bản để phân biệt kết quả. Đây là các quy tắc nhận diện dựa trên kinh nghiệm dùng để huấn luyện: một lệnh PowerShell hợp lệ cũng có thể khớp, người phân tích cần xem bằng chứng.

### Nạp nhật ký JSON

Trong Alert Center, mở **Import JSON and view rules**, dán một mảng nhật ký. API tương ứng là POST `/api/logs/ingest` với nội dung yêu cầu `{"logs":[...]}`.

```json
[
  {
    "id": "CUSTOM-SSH-1",
    "timestamp": "2026-10-30T10:00:00+07:00",
    "source": "auth",
    "host": "web-prod-01",
    "ip": "203.0.113.50",
    "action": "failure",
    "username": "root",
    "message": "SYNTHETIC DEMO DATA: SSH authentication failure"
  }
]
```

Một nhật ký trên không đủ ngưỡng SSH. Mỗi nhật ký cần ID duy nhất, dấu thời gian kèm múi giờ, nguồn (`source`), máy (`host`), địa chỉ IP, hành động (`action`) và thông điệp (`message`). Máy chủ chuẩn hóa dấu thời gian về UTC.

- `auth` biểu diễn SSH: cần `username`, trường `action` nhận `failure` hoặc `success`.
- `windows`: cần `processName`, `commandLine`, trường `action` nhận `process` hoặc `configuration`.
- `firewall`: cần `destinationIp`, `destinationPort` (1–65535), `protocol` là TCP hoặc UDP, `action` là `blocked` hoặc `allowed`. Chỉ TCP với `tcpFlags` là SYN được quy tắc quét cổng xét.
- Tối đa 2.000 nhật ký mỗi yêu cầu. ID trùng cùng nội dung được bỏ qua; ID trùng khác nội dung trả 409 và hoàn tác toàn bộ lô dữ liệu. Dữ liệu sai trả 422.
- Nội dung `commandLine` chỉ được phân tích như chuỗi, không được thực thi.

API bổ sung: GET `/api/detection/rules`, GET `/api/detection/runs`, POST `/api/detection/run`, POST `/api/detection/demo/attack` hoặc `benign`, GET `/api/alerts/{id}/evidence`. Xem cấu trúc dữ liệu trực tiếp tại Swagger.

Kiểm thử bằng các lệnh trong phần Kiểm thử và dựng bản phát hành bên dưới và `node scripts/smoke.mjs`. Kiểm tra nhanh luồng tích hợp dùng cơ sở dữ liệu tạm, kiểm tra thêm nhật ký bình thường → nhật ký tấn công → chạy lại → bằng chứng qua HTTP thật.

## Kiểm thử và dựng bản phát hành

Các lệnh sau bắt đầu tại thư mục gốc dự án, trừ phần kiểm thử Python có chuyển vào `backend`.

Tại thư mục gốc:

```powershell
npm.cmd run test
npm.cmd run build
```

Kiểm thử máy chủ dùng cơ sở dữ liệu tạm riêng, không tác động dữ liệu thực hành:

```powershell
Push-Location .\backend
try {
    .\.venv\Scripts\python.exe -m pytest -q
} finally {
    Pop-Location
}
```

Để xem bản dựng phát hành, giữ máy chủ chạy và dùng `npm.cmd run preview` từ thư mục gốc. Mở URL Vite in ra, thường là cổng 4173.

Kiểm tra HTTP thật sau khi dựng bản phát hành, từ thư mục gốc:

```powershell
node scripts/smoke.mjs
```

Tập lệnh dùng cổng và cơ sở dữ liệu tạm riêng, kiểm tra trang từ bản phát hành, API chuyển tiếp và ghi/đọc ghi chú, rồi dừng các máy chủ thử nghiệm. Có thể đặt `SOC_API_TARGET` trước khi chạy Vite nếu máy chủ dùng địa chỉ khác cổng 8000.

## Kiểm tra toàn bộ và đóng gói

Chạy tại thư mục gốc dự án:

```powershell
.\scripts\check.cmd
.\scripts\package.cmd
```

Tập lệnh kiểm tra chạy kiểm thử giao diện và máy chủ, dựng bản phát hành và kiểm tra luồng HTTP có khởi động lại. Tập lệnh đóng gói tạo ZIP trong `release/`, gồm mã nguồn, bản dựng phát hành, tập lệnh, tài liệu và tệp khóa phiên bản thư viện; không chứa cơ sở dữ liệu, môi trường Python ảo, node_modules hay Git. Tại máy nhận, giải nén rồi làm theo [hướng dẫn cài đặt và khởi động](SETUP.md).

## Kiểm tra hồi quy luồng lưu dữ liệu giai đoạn 2

1. Tìm kiếm/lọc trong Alert Center và Log Explorer.
2. Đổi một cảnh báo sang Resolved; chờ thông báo lưu thành công.
3. Lưu ghi chú tiếng Việt, thêm sự kiện vào dòng thời gian trong Incident Investigation.
4. Làm và chấm điểm cả ba nhiệm vụ; kiểm tra Report Center.
5. Dừng cả hai tiến trình, chạy lại và tải lại trang: trạng thái, ghi chú, dòng thời gian, điểm số phải còn.
6. Trên database chỉ có dữ liệu mẫu ban đầu, chưa nạp nhật ký phát hiện hoặc dữ liệu tùy chỉnh, chạy lại nạp dữ liệu mẫu: số lượng vẫn là 5 cảnh báo, 8 nhật ký và 3 tình huống; tiến trình không mất.
7. Tắt máy chủ rồi thử lưu: ứng dụng phải báo lỗi, không hiện thông báo lưu thành công.
8. Kiểm tra cả máy tính và màn hình hẹp. Kiểm thử tự động không thay thế kiểm tra giao diện trong trình duyệt.

Xem thêm [nghiệm thu phiên bản hiện tại](ACCEPTANCE.md), [kết quả kiểm tra đã ghi nhận](VERIFICATION.md) và [kế hoạch năm giai đoạn](../MILESTONES.md). Kết quả trong tài liệu xác minh gắn với ngày kiểm tra ghi trong tài liệu đó.
