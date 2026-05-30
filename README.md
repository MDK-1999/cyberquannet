# ⚡ CYBERNET PRO — Hệ Thống Quản Lý Quán Internet

Hệ thống quản lý quán net đầy đủ gồm **Frontend HTML/CSS/JS** + **Backend Node.js + Express** + **Database MySQL**.

---

## 📁 CẤU TRÚC THƯ MỤC

```
cyberquannet/
├── index.html          ← Giao diện chính (chạy trực tiếp trên trình duyệt)
├── css/
│   └── style.css       ← Toàn bộ CSS (dark cyber theme)
├── js/
│   └── app.js          ← Logic frontend (localStorage cho demo)
├── api/
│   ├── server.js       ← Backend API (Node.js + Express + MySQL)
│   └── seed.js         ← Script tạo dữ liệu mẫu
├── database.sql        ← Schema MySQL đầy đủ
├── package.json        ← Dependencies Node.js
├── .env.example        ← Mẫu cấu hình môi trường
└── README.md
```

---

## 🚀 CÁCH CHẠY

### CÁCH 1: Demo nhanh (không cần cài gì)
Chỉ cần mở file `index.html` bằng trình duyệt — dữ liệu lưu tự động vào **localStorage**.

```
Mở file: index.html → Chạy ngay trên Chrome/Firefox/Edge
```

**Tài khoản demo:**
| Tài khoản | Mật khẩu | Vai trò |
|-----------|----------|---------|
| admin | admin123 | Quản Trị Viên |
| quanly | 123456 | Quản Lý Quán |
| nhanvien | 123456 | Nhân Viên |
| khach1 | 123456 | Khách Hàng |

---

### CÁCH 2: Chạy với Backend thật (Node.js + MySQL)

#### Bước 1: Cài Node.js và MySQL
- Tải Node.js: https://nodejs.org (v18+)
- Tải MySQL: https://dev.mysql.com/downloads/

#### Bước 2: Tạo database
```sql
mysql -u root -p
source database.sql
```

#### Bước 3: Cấu hình môi trường
```bash
cp .env.example .env
# Mở .env và điền thông tin MySQL của bạn
```

#### Bước 4: Cài đặt dependencies
```bash
npm install
```

#### Bước 5: Tạo dữ liệu mẫu
```bash
npm run seed
```

#### Bước 6: Khởi động server
```bash
npm start
# Hoặc chạy development mode (tự restart khi đổi code):
npm run dev
```

#### Bước 7: Mở trình duyệt
```
http://localhost:3000
```

---

## 👥 PHÂN QUYỀN HỆ THỐNG

| Vai trò | Chức năng |
|---------|-----------|
| **Admin** | Toàn quyền: quản lý user, phân quyền, backup/restore, xem tất cả |
| **Quản Lý** | Quản lý máy, khách hàng, nhân viên, xem thống kê doanh thu |
| **Nhân Viên** | Mở/đóng máy, nạp tiền khách, xem lịch sử phiên |
| **Khách Hàng** | Xem danh sách máy, phiên hiện tại, số dư, lịch sử |

---

## 🔧 CHỨC NĂNG CHÍNH

### Khách Hàng
- ✅ Đăng ký / Đăng nhập
- ✅ Xem danh sách máy và trạng thái
- ✅ Xem phiên sử dụng đang hoạt động (đếm giờ real-time)
- ✅ Xem số dư tài khoản và lịch sử giao dịch
- ✅ Xem lịch sử sử dụng máy

### Nhân Viên
- ✅ Mở máy cho khách (chọn khách + chọn máy trống)
- ✅ Kết thúc phiên và tính tiền tự động
- ✅ Nạp tiền vào tài khoản khách hàng
- ✅ Xem phiên đang hoạt động

### Quản Lý Quán
- ✅ Quản lý máy tính (thêm/sửa/xóa, cập nhật trạng thái)
- ✅ Quản lý khách hàng và nhân viên
- ✅ Thống kê doanh thu theo ngày/tuần/tháng
- ✅ Xem lịch sử toàn bộ hoạt động

### Quản Trị Viên
- ✅ Tất cả quyền quản lý
- ✅ Phân quyền hệ thống
- ✅ Khóa/mở khóa tài khoản
- ✅ Backup và restore dữ liệu

---

## 🗄️ API ENDPOINTS (Backend)

### Auth
- `POST /api/auth/register` — Đăng ký tài khoản
- `POST /api/auth/login` — Đăng nhập

### Users
- `GET /api/users` — Danh sách người dùng (admin/manager)
- `GET /api/users/:id` — Chi tiết người dùng
- `PUT /api/users/:id` — Cập nhật thông tin
- `DELETE /api/users/:id` — Xóa (admin)
- `PATCH /api/users/:id/toggle-status` — Khóa/mở tài khoản

### Computers
- `GET /api/computers` — Danh sách máy tính
- `POST /api/computers` — Thêm máy
- `PUT /api/computers/:id` — Sửa máy
- `DELETE /api/computers/:id` — Xóa máy

### Sessions
- `GET /api/sessions` — Lịch sử phiên
- `POST /api/sessions/open` — Mở máy
- `POST /api/sessions/:id/close` — Đóng máy + tính tiền

### Transactions
- `GET /api/transactions` — Lịch sử giao dịch
- `POST /api/transactions/deposit` — Nạp tiền

### Statistics
- `GET /api/stats/dashboard` — Tổng quan
- `GET /api/stats/revenue?period=day|week|month` — Doanh thu

---

## 💡 LƯU Ý KỸ THUẬT

- **Frontend demo**: Dùng `localStorage` để lưu dữ liệu ngay trên trình duyệt — không cần cài gì.
- **Backend thật**: Dùng MySQL với transaction đảm bảo tính nhất quán dữ liệu (không bị trừ tiền 2 lần, không mở 2 phiên cùng lúc...).
- **Bảo mật**: Mật khẩu được hash bằng `bcrypt`, JWT token cho authentication.
- **Giá tiền**: Tính theo giờ, làm tròn lên (`Math.ceil`). VD: dùng 1h15m = tính 2h.

---

## 📞 HỖ TRỢ

Nếu gặp lỗi kết nối MySQL, kiểm tra:
1. MySQL đang chạy chưa (`mysql.server start` / `net start mysql`)
2. Thông tin trong file `.env` có đúng không
3. Database `cybernet` đã được tạo chưa (`source database.sql`)
