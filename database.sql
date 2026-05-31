USE railway;

SET FOREIGN_KEY_CHECKS = 0;

-- XÓA BẢNG CŨ
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS computers;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS system_logs;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================
-- USERS
-- =========================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,

  role ENUM(
    'admin',
    'manager',
    'staff',
    'customer'
  ) NOT NULL DEFAULT 'customer',

  email VARCHAR(100),
  phone VARCHAR(20),

  balance DECIMAL(12,0) NOT NULL DEFAULT 0,

  status ENUM(
    'active',
    'locked'
  ) NOT NULL DEFAULT 'active',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- PERMISSIONS
-- =========================
CREATE TABLE permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- ROLE PERMISSIONS
-- =========================
CREATE TABLE role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,

  role ENUM(
    'admin',
    'manager',
    'staff',
    'customer'
  ) NOT NULL,

  permission_id INT NOT NULL,

  FOREIGN KEY (permission_id)
    REFERENCES permissions(id)
    ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- COMPUTERS
-- =========================
CREATE TABLE computers (
  id INT AUTO_INCREMENT PRIMARY KEY,

  name VARCHAR(20) UNIQUE NOT NULL,

  zone VARCHAR(50) DEFAULT 'Khu A',

  specs TEXT,

  price_per_hour DECIMAL(10,0)
    NOT NULL DEFAULT 5000,

  status ENUM(
    'available',
    'in-use',
    'maintenance'
  ) NOT NULL DEFAULT 'available',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- SESSIONS
-- =========================
CREATE TABLE sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,

  user_id INT NOT NULL,
  computer_id INT NOT NULL,

  -- nhân viên mở máy
  staff_id INT NULL,

  start_time DATETIME NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  end_time DATETIME NULL,

  status ENUM(
    'active',
    'completed',
    'force_ended'
  ) NOT NULL DEFAULT 'active',

  cost DECIMAL(12,0)
    NOT NULL DEFAULT 0,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)
    REFERENCES users(id),

  FOREIGN KEY (computer_id)
    REFERENCES computers(id),

  FOREIGN KEY (staff_id)
    REFERENCES users(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- TRANSACTIONS
-- =========================
CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,

  user_id INT NOT NULL,

  type ENUM(
    'deposit',
    'payment',
    'refund',
    'adjustment'
  ) NOT NULL,

  amount DECIMAL(12,0) NOT NULL,

  balance_before DECIMAL(12,0)
    NOT NULL DEFAULT 0,

  balance_after DECIMAL(12,0)
    NOT NULL DEFAULT 0,

  note TEXT,

  session_id INT NULL,

  created_by INT NOT NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)
    REFERENCES users(id),

  FOREIGN KEY (created_by)
    REFERENCES users(id),

  FOREIGN KEY (session_id)
    REFERENCES sessions(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- SYSTEM LOGS
-- =========================
CREATE TABLE system_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,

  user_id INT NULL,

  action VARCHAR(255) NOT NULL,

  details TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE SET NULL

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- PERMISSIONS DATA
-- =========================
INSERT INTO permissions (code, name) VALUES
('OPEN_MACHINE', 'Mở máy khách'),
('END_SESSION', 'Kết thúc phiên'),
('TOPUP_CUSTOMER', 'Nạp tiền khách'),
('VIEW_HISTORY', 'Xem lịch sử'),
('MANAGE_COMPUTERS', 'Quản lý máy'),
('MANAGE_USERS', 'Quản lý người dùng'),
('VIEW_REPORTS', 'Xem báo cáo'),
('SYSTEM_SETTINGS', 'Cấu hình hệ thống');

-- =========================
-- ROLE PERMISSIONS
-- =========================

-- ADMIN = FULL
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions;

-- MANAGER
INSERT INTO role_permissions (role, permission_id)
SELECT 'manager', id
FROM permissions
WHERE code IN (
  'OPEN_MACHINE',
  'END_SESSION',
  'TOPUP_CUSTOMER',
  'VIEW_HISTORY',
  'MANAGE_COMPUTERS',
  'VIEW_REPORTS'
);

-- STAFF
INSERT INTO role_permissions (role, permission_id)
SELECT 'staff', id
FROM permissions
WHERE code IN (
  'OPEN_MACHINE',
  'END_SESSION',
  'TOPUP_CUSTOMER',
  'VIEW_HISTORY'
);

-- =========================
-- USERS
-- password: 123456
-- =========================
INSERT INTO users (
  username,
  password,
  name,
  role,
  email,
  phone,
  balance
) VALUES

(
  'admin',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Admin Hệ Thống',
  'admin',
  'admin@cybernet.vn',
  '0900000000',
  0
),

(
  'quanly',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Nguyễn Quản Lý',
  'manager',
  'manager@cybernet.vn',
  '0911111111',
  0
),

(
  'nhanvien',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Trần Nhân Viên',
  'staff',
  'staff@cybernet.vn',
  '0922222222',
  0
),

(
  'khach1',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Lê Văn Khách',
  'customer',
  'khach@gmail.com',
  '0933333333',
  50000
);

-- =========================
-- COMPUTERS
-- =========================
INSERT INTO computers (
  name,
  zone,
  specs,
  price_per_hour,
  status
) VALUES

('PC-01','Khu A','Intel i5-12400F, 16GB DDR4, GTX 1660 Super, SSD 512GB',5000,'available'),
('PC-02','Khu A','Intel i5-12400F, 16GB DDR4, GTX 1660 Super, SSD 512GB',5000,'available'),
('PC-03','Khu A','Intel i5-12400F, 16GB DDR4, GTX 1660 Super, SSD 512GB',5000,'available'),
('PC-04','Khu A','Intel i5-12400F, 16GB DDR4, GTX 1660 Super, SSD 512GB',5000,'available'),
('PC-05','Khu A','Intel i5-12400F, 16GB DDR4, GTX 1660 Super, SSD 512GB',5000,'available'),

('PC-06','Khu A','Intel i5-12400F, 16GB DDR4, GTX 1660 Super, SSD 512GB',5000,'available'),
('PC-07','Khu A','Intel i5-12400F, 16GB DDR4, GTX 1660 Super, SSD 512GB',5000,'available'),
('PC-08','Khu A','Intel i5-12400F, 16GB DDR4, GTX 1660 Super, SSD 512GB',5000,'available'),
('PC-09','Khu A','Intel i5-12400F, 16GB DDR4, GTX 1660 Super, SSD 512GB',5000,'available'),
('PC-10','Khu A','Intel i5-12400F, 16GB DDR4, GTX 1660 Super, SSD 512GB',5000,'available'),

('PC-11','Khu B','Intel i7-12700F, 32GB DDR4, RTX 3070, SSD 1TB',6000,'available'),
('PC-12','Khu B','Intel i7-12700F, 32GB DDR4, RTX 3070, SSD 1TB',6000,'available'),
('PC-13','Khu B','Intel i7-12700F, 32GB DDR4, RTX 3070, SSD 1TB',6000,'available'),
('PC-14','Khu B','Intel i7-12700F, 32GB DDR4, RTX 3070, SSD 1TB',6000,'available'),
('PC-15','Khu B','Intel i7-12700F, 32GB DDR4, RTX 3070, SSD 1TB',6000,'maintenance'),

('PC-16','Khu B','Intel i7-12700F, 32GB DDR4, RTX 3070, SSD 1TB',6000,'available'),

('PC-17','VIP','Intel i9-13900K, 64GB DDR5, RTX 4090, NVMe 2TB',10000,'available'),
('PC-18','VIP','Intel i9-13900K, 64GB DDR5, RTX 4090, NVMe 2TB',10000,'available'),
('PC-19','VIP','Intel i9-13900K, 64GB DDR5, RTX 4090, NVMe 2TB',10000,'available'),
('PC-20','VIP','Intel i9-13900K, 64GB DDR5, RTX 4090, NVMe 2TB',10000,'available');