# SOC Mini Lab

Ứng dụng mô phỏng Trung tâm Điều hành An ninh mạng chạy cục bộ trên Windows. Sáu phân hệ gồm Dashboard (tổng quan), Alert Center (cảnh báo), Log Explorer (tra cứu nhật ký), Incident Investigation (điều tra), Training Missions (huấn luyện) và Report Center (báo cáo). Ba tình huống huấn luyện: SSH Brute Force, Suspicious PowerShell và Port Scan.

Dữ liệu đều là **SYNTHETIC DEMO DATA**, không phải dữ liệu giám sát thật. Giai đoạn 1–5 đã được triển khai; xem [kế hoạch năm giai đoạn](./MILESTONES.md).

## Chạy bản bàn giao trên Windows

Giao diện, thông báo hệ thống và phản hồi chấm điểm dùng tiếng Anh. Tài liệu hướng dẫn dùng tiếng Việt; tên nút, phân hệ, lệnh và đường dẫn giữ nguyên để đối chiếu với ứng dụng.

### Áp dụng bản thống nhất ngôn ngữ

Dừng máy chủ đang chạy bằng Ctrl+C, sau đó chạy các lệnh dưới đây tại thư mục dự án. Bản cập nhật không cần cài thêm thư viện:

```powershell
npm.cmd run build
.\scripts\start.cmd
```

Tải lại trang bằng Ctrl+F5. Máy chủ tự áp dụng bước chuyển đổi cơ sở dữ liệu 004 khi khởi động: chỉ dịch tiêu đề và phản hồi chấm điểm do hệ thống tạo trong lịch sử cũ, giữ nguyên điểm số, bài làm, ghi chú và kết luận của người dùng. Không cần đặt lại tiến trình hoặc xóa cơ sở dữ liệu. Nếu dùng chế độ phát triển, khởi động lại FastAPI và giữ Vite chạy như hướng dẫn bên dưới.

### Cài đặt và khởi động

Tại thư mục đã giải nén dự án:

```powershell
.\scripts\setup.cmd
.\scripts\start.cmd
```

Lần đầu cần Internet để tải thư viện phụ thuộc. Tập lệnh cài đặt dùng `npm ci` và khóa thư viện phụ thuộc Python trong `backend/requirements.lock.txt`, sau đó dựng bản phát hành giao diện. Tập lệnh khởi động chạy **một máy chủ** tại [http://127.0.0.1:8000](http://127.0.0.1:8000), phục vụ cả giao diện lẫn API. Nhấn Ctrl+C để dừng. Đổi cổng bằng `.\scripts\start.cmd -Port 8010`.

Các tập lệnh bao CMD chạy tập lệnh PowerShell với chính sách thực thi Bypass chỉ trong tiến trình đó, không đổi chính sách thực thi của máy. Không cần kích hoạt môi trường Python ảo.

```powershell
.\scripts\check.cmd
.\scripts\package.cmd
```

Tập lệnh kiểm tra chạy kiểm thử giao diện và máy chủ, dựng bản phát hành và kiểm tra luồng HTTP có khởi động lại. Tập lệnh đóng gói tạo ZIP trong `release/`, gồm mã nguồn, bản dựng phát hành, tập lệnh, tài liệu và tệp khóa phiên bản thư viện; không chứa cơ sở dữ liệu, môi trường Python ảo, node_modules hay Git. Tại máy nhận, giải nén rồi chạy các lệnh cài đặt và khởi động như trên.

Hướng dẫn chạy hai cửa sổ dòng lệnh bên dưới vẫn dành cho phát triển. Nếu sửa giao diện, chạy lại tập lệnh kiểm tra để dựng bản phát hành mới trước khi khởi động.

## Xuất báo cáo và khả năng truy cập

Trong Report Center chọn **Download JSON report** hoặc **Download CSV summary**. Báo cáo được tạo từ dữ liệu đã lưu phía máy chủ:

- JSON có thời điểm xuất, nhãn tổng hợp, tổng quan, tình huống, cảnh báo, ghi chú, dòng thời gian, lịch sử bài làm, phiên huấn luyện và nhật ký bằng chứng.
- CSV có kết quả mới nhất mỗi tình huống; UTF-8 BOM hỗ trợ tiếng Việt trong Excel. Ô văn bản có tiền tố công thức được thêm dấu nháy đơn để không chạy như công thức.
- Xuất báo cáo không thay đổi dữ liệu. Khi máy chủ không hoạt động, giao diện báo lỗi và cho phép thử lại.

Menu màn hình hẹp hỗ trợ Escape, giữ tiêu điểm bàn phím trong menu, trả tiêu điểm bàn phím khi đóng và ẩn các mục đóng khỏi thứ tự Tab. Có liên kết bỏ qua menu, thông báo tải/lỗi, hỗ trợ giảm chuyển động và nhãn trạng thái không chỉ dựa vào màu.

Xem [danh sách kiểm tra nghiệm thu và giới hạn](./docs/ACCEPTANCE.md) và [kết quả xác minh bản bàn giao](./docs/VERIFICATION.md). Phiên bản này dành cho môi trường thực hành cục bộ, không phải hệ thống SOC vận hành thực tế nhiều người dùng.

## Yêu cầu

- Windows 10/11, Node.js 20.11+ (nhánh 20), 22.x hoặc 24 trở lên và npm; máy kiểm thử dùng Node 26.13.0.
- Python 3.12 (phiên bản đã kiểm thử).
- PowerShell để chạy tập lệnh; VS Code và hai cửa sổ dòng lệnh chỉ cần khi phát triển giao diện và máy chủ riêng.

## Cài đặt lần đầu

Chạy tại thư mục dự án:

```powershell
Set-Location "D:\Lộ trình Cyber Security\Project\SOC Mini Lab"
npm.cmd ci
python -m venv backend/.venv
.\backend\.venv\Scripts\python.exe -m pip install -r backend/requirements.lock.txt
```

Không cần kích hoạt môi trường Python ảo hay thay đổi chính sách thực thi: dùng `npm.cmd` và đường dẫn trực tiếp tới Python.

## Chạy máy chủ — cửa sổ dòng lệnh 1

```powershell
Set-Location "D:\Lộ trình Cyber Security\Project\SOC Mini Lab\backend"
.\.venv\Scripts\python.exe -m app.database
.\.venv\Scripts\python.exe -m app.seed
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Quá trình chuyển đổi cơ sở dữ liệu và nạp dữ liệu mẫu cũng chạy khi API khởi động, nên lần sau chỉ cần lệnh uvicorn. Quá trình nạp dữ liệu mẫu chỉ thêm bản ghi còn thiếu, không ghi đè tiến trình đã lưu.

Tài liệu API tương tác: [Swagger UI](http://127.0.0.1:8000/docs).
Kiểm tra kết nối: [Trạng thái API](http://127.0.0.1:8000/api/health).

## Chạy giao diện — cửa sổ dòng lệnh 2

```powershell
Set-Location "D:\Lộ trình Cyber Security\Project\SOC Mini Lab"
npm.cmd run dev
```

Mở URL Vite in ra, thường là [http://127.0.0.1:5173](http://127.0.0.1:5173). Vite chuyển tiếp các yêu cầu `/api` sang máy chủ cổng 8000. Giữ cả hai cửa sổ dòng lệnh chạy; nhấn `Ctrl+C` ở từng cửa sổ dòng lệnh để dừng.

## Kiểm thử và dựng bản phát hành

Tại thư mục gốc:

```powershell
npm.cmd run test
npm.cmd run build
```

Kiểm thử máy chủ dùng cơ sở dữ liệu tạm riêng, không tác động dữ liệu thực hành:

```powershell
Set-Location "D:\Lộ trình Cyber Security\Project\SOC Mini Lab\backend"
.\.venv\Scripts\python.exe -m pytest -q
```

Để xem bản dựng phát hành, giữ máy chủ chạy và dùng `npm.cmd run preview` từ thư mục gốc. Mở URL Vite in ra, thường là cổng 4173.

Kiểm tra HTTP thật sau khi dựng bản phát hành, từ thư mục gốc:

```powershell
node scripts/smoke.mjs
```

Tập lệnh dùng cổng và cơ sở dữ liệu tạm riêng, kiểm tra trang từ bản phát hành, API chuyển tiếp và ghi/đọc ghi chú, rồi dừng các máy chủ thử nghiệm. Có thể đặt `SOC_API_TARGET` trước khi chạy Vite nếu máy chủ dùng địa chỉ khác cổng 8000.

## Danh sách kiểm tra nghiệm thu giai đoạn 2

1. Tìm kiếm/lọc trong Alert Center và Log Explorer.
2. Đổi một cảnh báo sang Resolved; chờ thông báo lưu thành công.
3. Lưu ghi chú tiếng Việt, thêm sự kiện vào dòng thời gian trong Incident Investigation.
4. Làm và chấm điểm cả ba nhiệm vụ; kiểm tra Report Center.
5. Dừng cả hai tiến trình, chạy lại và tải lại trang: trạng thái, ghi chú, dòng thời gian, điểm số phải còn.
6. Chạy lại nạp dữ liệu mẫu: số lượng vẫn là 5 cảnh báo, 8 nhật ký và 3 tình huống; tiến trình không mất.
7. Tắt máy chủ rồi thử lưu: ứng dụng phải báo lỗi, không hiện thông báo lưu thành công.
8. Kiểm tra cả máy tính và màn hình hẹp. Kiểm thử tự động không thay thế kiểm tra giao diện trong trình duyệt.

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

## Giai đoạn 4 — huấn luyện và tiếp tục bài làm

Khởi động lại máy chủ để áp dụng chuyển đổi cơ sở dữ liệu 003, giữ nguyên dữ liệu giai đoạn 1–3. Không cần cài thư viện phụ thuộc mới. Giao diện vẫn chạy bằng `npm.cmd run dev`.

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

API mới:

- POST `/api/training/cases/{case_id}/sessions`: bắt đầu hoặc tiếp tục.
- GET `/api/training/sessions` và GET `/api/training/sessions/{id}`: lịch sử và chi tiết.
- PUT `/api/training/sessions/{id}`: lưu `revision, answers, evidenceIds, conclusion`.
- POST `/api/training/sessions/{id}/submit`: nộp với `revision`.

API danh sách tình huống không trả đáp án hoặc giải thích đáp án trước khi nộp; phản hồi nằm trong kết quả máy chủ. Điểm cuối dành cho lượt làm cũ vẫn được giữ tương thích cho chấm câu hỏi giai đoạn 2, nhưng giao diện giai đoạn 4 sử dụng API phiên huấn luyện.

Kiểm tra bằng `npm.cmd run test`, `npm.cmd run build`, `python -m pytest -q` trong môi trường Python ảo ở thư mục `backend`, và `node scripts/smoke.mjs`. Kiểm tra nhanh luồng tích hợp bao gồm lưu/đọc bản nháp, chấm điểm và cập nhật tiến trình báo cáo qua HTTP thật.

## Giai đoạn 3 — chạy phát hiện

Khởi động lại máy chủ bằng lệnh ở trên để tự áp dụng chuyển đổi cơ sở dữ liệu 002. Quá trình chuyển đổi cơ sở dữ liệu giữ nguyên tiến trình giai đoạn 2. Không cần cài thêm thư viện phụ thuộc.

1. Mở **Alert Center**, tại mục **Detection Engine** bấm **Import benign logs**.
2. Bấm **Run detection**: trên cơ sở dữ liệu chưa nạp nhật ký tấn công, có 9 nhật ký chuẩn hóa và 0 cảnh báo mới.
3. Bấm **Import synthetic attack logs**: nạp thêm 13 nhật ký (6 SSH, 1 PowerShell, 6 nhật ký tường lửa).
4. Bấm **Run detection**: tạo 3 cảnh báo có ID bắt đầu bằng `DET-`. Danh sách giữ cả 5 cảnh báo mẫu cũ, tổng cộng 8.
5. Chọn cảnh báo `DET-` để xem quy tắc, phiên bản, lý do và nhật ký bằng chứng. Bấm **Investigate this case** để mở Investigation.
6. Chuyển cảnh báo sang Resolved rồi chạy phát hiện lại: 0 cảnh báo mới, 3 phát hiện đã tồn tại, trạng thái vẫn Resolved.
7. Khởi động lại máy chủ: nhật ký, cảnh báo, bằng chứng và lịch sử chạy vẫn còn.

Bộ phát hiện phân tích **toàn bộ nhật ký chuẩn hóa đã lưu**, không chỉ bộ vừa nạp. Sau khi đã nạp nhật ký tấn công, nạp nhật ký bình thường không xóa nhật ký tấn công và không làm số phát hiện trở về 0. Tám nhật ký minh họa cũ được báo là bỏ qua; chúng không có cấu trúc dữ liệu chuẩn hóa. Nút Reset saved progress không xóa nhật ký, cảnh báo phát hiện hay lịch sử chạy.

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

Kiểm thử bằng các lệnh kiểm thử và dựng bản phát hành ở trên và `node scripts/smoke.mjs`. Kiểm tra nhanh luồng tích hợp dùng cơ sở dữ liệu tạm, kiểm tra thêm nhật ký bình thường → nhật ký tấn công → chạy lại → bằng chứng qua HTTP thật.

## Xử lý lỗi

- **PowerShell chặn npm.ps1:** dùng `npm.cmd run dev`.
- **Không kết nối được máy chủ:** kiểm tra cửa sổ dòng lệnh 1 và cổng 8000; sau đó bấm **Retry** (thử lại) hoặc tải lại trang.
- **Cổng giao diện bận:** dùng `npm.cmd run dev -- --port 5174`.
- **Không tìm thấy app khi chạy Python:** chuyển vào thư mục `backend` trước khi chạy các lệnh mô-đun.

