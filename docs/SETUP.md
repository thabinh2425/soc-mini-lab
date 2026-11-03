# Cài đặt và xử lý lỗi

[← Tổng quan dự án](../README.md) · [Cài đặt](SETUP.md) · [Thực hành](USER_GUIDE.md) · [Phát triển](DEVELOPMENT.md)

Ứng dụng chạy cục bộ trên Windows. Các địa chỉ `127.0.0.1` trong tài liệu chỉ truy cập máy đang chạy ứng dụng; đây không phải bản demo trực tuyến.

Giao diện, thông báo hệ thống và phản hồi chấm điểm dùng tiếng Anh. Tài liệu hướng dẫn dùng tiếng Việt; tên nút, phân hệ, lệnh và đường dẫn giữ nguyên để đối chiếu với ứng dụng.

## Yêu cầu môi trường

- Windows 10/11, Node.js 20.11+ (nhánh 20), 22.x hoặc 24 trở lên và npm.
- Python 3.12; lệnh `python` phải trỏ đúng phiên bản này vì tập lệnh cài đặt kiểm tra phiên bản.
- PowerShell để chạy tập lệnh; VS Code và hai cửa sổ dòng lệnh chỉ cần khi phát triển giao diện và máy chủ riêng.

Kiểm tra trong PowerShell trước khi cài:

```powershell
node --version
npm.cmd --version
python --version
```

## Lấy mã nguồn

Trên GitHub, chọn **Code → Download ZIP** rồi giải nén, hoặc dùng Git:

```powershell
git clone https://github.com/thabinh2425/soc-mini-lab.git
Set-Location .\soc-mini-lab
```

Nếu tải ZIP, mở thư mục đã giải nén bằng VS Code và chọn **Terminal → New Terminal**. Thư mục hiện tại phải chứa `package.json`, `backend` và `scripts`. Các lệnh dưới đây chạy tại thư mục gốc đó, trừ khi có ghi khác.

## Cài đặt và khởi động

Tại thư mục gốc dự án:

```powershell
.\scripts\setup.cmd
.\scripts\start.cmd
```

Lần đầu cần Internet để tải thư viện phụ thuộc. Tập lệnh cài đặt dùng `npm ci` và khóa thư viện phụ thuộc Python trong `backend/requirements.lock.txt`, sau đó dựng bản phát hành giao diện. Tập lệnh khởi động chạy **một máy chủ** tại [http://127.0.0.1:8000](http://127.0.0.1:8000), phục vụ cả giao diện lẫn API. Nhấn Ctrl+C để dừng. Đổi cổng bằng `.\scripts\start.cmd -Port 8010`.

Các tập lệnh bao CMD chạy tập lệnh PowerShell với chính sách thực thi Bypass chỉ trong tiến trình đó, không đổi chính sách thực thi của máy. Không cần kích hoạt môi trường Python ảo.

Sau lần cài đầu, chỉ cần chạy `./scripts/start.cmd` để mở lại ứng dụng. Nếu sửa giao diện, chạy `npm.cmd run build` trước khi khởi động lại.

## Chạy chế độ phát triển

Chế độ này dùng hai cửa sổ PowerShell riêng: một chạy FastAPI và một chạy Vite để xem thay đổi giao diện khi sửa mã nguồn.

### Chuẩn bị thư viện

Chạy tại thư mục dự án:

```powershell
npm.cmd ci
python -m venv backend/.venv
.\backend\.venv\Scripts\python.exe -m pip install -r backend/requirements.lock.txt
```

Không cần kích hoạt môi trường Python ảo hay thay đổi chính sách thực thi: dùng `npm.cmd` và đường dẫn trực tiếp tới Python.

### Cửa sổ 1: máy chủ

Bắt đầu tại thư mục gốc dự án, rồi chuyển vào `backend`:

```powershell
Set-Location .\backend
.\.venv\Scripts\python.exe -m app.database
.\.venv\Scripts\python.exe -m app.seed
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Quá trình chuyển đổi cơ sở dữ liệu và nạp dữ liệu mẫu cũng chạy khi API khởi động, nên lần sau chỉ cần lệnh uvicorn. Quá trình nạp dữ liệu mẫu chỉ thêm bản ghi còn thiếu, không ghi đè tiến trình đã lưu.

Tài liệu API tương tác: [Swagger UI](http://127.0.0.1:8000/docs).
Kiểm tra kết nối: [Trạng thái API](http://127.0.0.1:8000/api/health).

### Cửa sổ 2: giao diện

Mở một cửa sổ PowerShell mới tại thư mục gốc dự án:

```powershell
npm.cmd run dev
```

Mở URL Vite in ra, thường là [http://127.0.0.1:5173](http://127.0.0.1:5173). Vite chuyển tiếp các yêu cầu `/api` sang máy chủ cổng 8000. Giữ cả hai cửa sổ dòng lệnh chạy; nhấn `Ctrl+C` ở từng cửa sổ dòng lệnh để dừng.

## Dữ liệu và sao lưu

SQLite mặc định nằm tại `backend/soc_lab.db`, được tạo khi máy chủ khởi động. Tiến trình đã lưu còn sau khi tắt máy chủ. Để sao lưu thủ công, dừng máy chủ bằng Ctrl+C rồi sao chép file này sang nơi riêng. Báo cáo JSON/CSV không thay thế bản sao lưu database.

## Xử lý lỗi

- **PowerShell chặn npm.ps1:** dùng `npm.cmd run dev`.
- **Không kết nối được máy chủ:** kiểm tra cửa sổ đang chạy máy chủ và cổng 8000; sau đó bấm **Retry** (thử lại) hoặc tải lại trang.
- **Cổng giao diện bận:** dùng `npm.cmd run dev -- --port 5174`.
- **Không tìm thấy app khi chạy Python:** chuyển vào thư mục `backend` trước khi chạy các lệnh mô-đun.
- **Cổng máy chủ bận:** dừng phiên cũ hoặc dùng `./scripts/start.cmd -Port 8010`, rồi truy cập `http://127.0.0.1:8010`.
- **Sai phiên bản Python:** kiểm tra `python --version`; tập lệnh `setup.cmd` yêu cầu Python 3.12.

## Nâng cấp từ các giai đoạn cũ

Phần này dành cho người đã chạy phiên bản trước. Cài mới chỉ cần làm theo các bước cài đặt ở trên. Không xóa database để nâng cấp; nên sao lưu trước khi cập nhật.

### Giai đoạn 3: bộ phát hiện

Khởi động lại máy chủ bằng lệnh ở trên để tự áp dụng chuyển đổi cơ sở dữ liệu 002. Quá trình chuyển đổi cơ sở dữ liệu giữ nguyên tiến trình giai đoạn 2. Không cần cài thêm thư viện phụ thuộc.

### Giai đoạn 4: phiên huấn luyện

Khởi động lại máy chủ để áp dụng chuyển đổi cơ sở dữ liệu 003, giữ nguyên dữ liệu giai đoạn 1–3. Không cần cài thư viện phụ thuộc mới. Giao diện vẫn chạy bằng `npm.cmd run dev`.

### Bản thống nhất ngôn ngữ

Dừng máy chủ đang chạy bằng Ctrl+C, sau đó chạy các lệnh dưới đây tại thư mục dự án. Bản cập nhật không cần cài thêm thư viện:

```powershell
npm.cmd run build
.\scripts\start.cmd
```

Tải lại trang bằng Ctrl+F5. Máy chủ tự áp dụng bước chuyển đổi cơ sở dữ liệu 004 khi khởi động: chỉ dịch tiêu đề và phản hồi chấm điểm do hệ thống tạo trong lịch sử cũ, giữ nguyên điểm số, bài làm, ghi chú và kết luận của người dùng. Không cần đặt lại tiến trình hoặc xóa cơ sở dữ liệu. Nếu dùng chế độ phát triển, khởi động lại FastAPI và giữ Vite chạy theo phần Chạy chế độ phát triển ở trên.
