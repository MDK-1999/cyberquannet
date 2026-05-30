-- ============================================
-- CYBERNET PRO - DATABASE SCHEMA (MySQL)
-- ============================================

CREATE DATABASE IF NOT EXISTS cybernet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cybernet;

-- =====================
-- BẢNG NGƯỜI DÙNG
-- =====================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL COMMENT 'bcrypt hash',
  name VARCHAR(100) NOT NULL,
  role ENUM('admin','manager','staff','customer') NOT NULL DEFAULT 'customer',
  email VARCHAR(100),
  phone VARCHAR(20),
  balance DECIMAL(12,0) NOT NULL DEFAULT 0 COMMENT 'Số dư tài khoản (VNĐ)',
  status ENUM('active','locked') NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- =====================
-- BẢNG MÁY TÍNH
-- =====================
CREATE TABLE computers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(20) UNIQUE NOT NULL COMMENT 'Ví dụ: PC-01',
  zone VARCHAR(50) DEFAULT 'Khu A' COMMENT 'Khu vực: Khu A, Khu B, VIP...',
  specs TEXT COMMENT 'Cấu hình máy',
  price_per_hour DECIMAL(10,0) NOT NULL DEFAULT 5000 COMMENT 'Giá mỗi giờ (VNĐ)',
  status ENUM('available','in-use','maintenance') NOT NULL DEFAULT 'available',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- =====================
-- BẢNG PHIÊN SỬ DỤNG
-- =====================
CREATE TABLE sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  computer_id INT NOT NULL,
  start_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_time DATETIME NULL COMMENT 'NULL = đang dùng',
  status ENUM('active','completed','force_ended') NOT NULL DEFAULT 'active',
  cost DECIMAL(12,0) NOT NULL DEFAULT 0 COMMENT 'Chi phí thực tế',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (computer_id) REFERENCES computers(id) ON DELETE RESTRICT,
  INDEX idx_status (status),
  INDEX idx_user (user_id),
  INDEX idx_computer (computer_id),
  INDEX idx_start (start_time)
) ENGINE=InnoDB;

-- =====================
-- BẢNG GIAO DỊCH
-- =====================
CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('deposit','payment','refund','adjustment') NOT NULL,
  amount DECIMAL(12,0) NOT NULL COMMENT 'Số tiền (dương = cộng, âm = trừ)',
  balance_before DECIMAL(12,0) NOT NULL DEFAULT 0,
  balance_after DECIMAL(12,0) NOT NULL DEFAULT 0,
  note TEXT,
  session_id INT NULL COMMENT 'Liên kết phiên nếu có',
  created_by INT NOT NULL COMMENT 'ID nhân viên/admin thực hiện',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_user (user_id),
  INDEX idx_type (type),
  INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- =====================
-- BẢNG NHẬT KÝ HỆ THỐNG
-- =====================
CREATE TABLE system_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(100) NOT NULL,
  detail TEXT,
  ip_address VARCHAR(45),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_action (action),
  INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ============================================
-- DỮ LIỆU MẪU (SEED DATA)
-- ============================================

-- Tài khoản mẫu (mật khẩu: 123456 -> hash bcrypt)
INSERT INTO users (username, password, name, role, email, phone, balance) VALUES
('admin',    '$2b$10$placeholder_admin_hash',    'Admin Hệ Thống',    'admin',    'admin@cybernet.vn',   '0900000000', 0),
('quanly',   '$2b$10$placeholder_manager_hash',  'Nguyễn Quản Lý',    'manager',  'manager@cybernet.vn', '0911111111', 0),
('nhanvien', '$2b$10$placeholder_staff_hash',    'Trần Nhân Viên',    'staff',    'staff@cybernet.vn',   '0922222222', 0),
('khach1',   '$2b$10$placeholder_customer_hash', 'Lê Văn Khách',      'customer', 'khach@gmail.com',     '0933333333', 50000);

-- 20 Máy tính mẫu
INSERT INTO computers (name, zone, specs, price_per_hour, status) VALUES
('PC-01', 'Khu A', 'Intel i5-12400F, 16GB DDR4, GTX 1660 Super, SSD 512GB', 5000, 'in-use'),
('PC-02', 'Khu A', 'Intel i5-12400F, 16GB DDR4, GTX 1660 Super, SSD 512GB', 5000, 'in-use'),
('PC-03', 'Khu A', 'Intel i5-12400F, 16GB DDR4, GTX 1660 Super, SSD 512GB', 5000, 'in-use'),
('PC-04', 'Khu A', 'Intel i5-12400F, 16GB DDR4, GTX 1660 Super, SSD 512GB', 5000, 'available'),
('PC-05', 'Khu A', 'Intel i5-12400F, 16GB DDR4, GTX 1660 Super, SSD 512GB', 5000, 'available'),
('PC-06', 'Khu A', 'Intel i5-12400F, 16GB DDR4, GTX 1660 Super, SSD 512GB', 5000, 'available'),
('PC-07', 'Khu A', 'Intel i5-12400F, 16GB DDR4, GTX 1660 Super, SSD 512GB', 5000, 'available'),
('PC-08', 'Khu A', 'Intel i5-12400F, 16GB DDR4, GTX 1660 Super, SSD 512GB', 5000, 'available'),
('PC-09', 'Khu A', 'Intel i5-12400F, 16GB DDR4, GTX 1660 Super, SSD 512GB', 5000, 'available'),
('PC-10', 'Khu A', 'Intel i5-12400F, 16GB DDR4, GTX 1660 Super, SSD 512GB', 5000, 'available'),
('PC-11', 'Khu B', 'Intel i7-12700F, 32GB DDR4, RTX 3070, SSD 1TB',         6000, 'available'),
('PC-12', 'Khu B', 'Intel i7-12700F, 32GB DDR4, RTX 3070, SSD 1TB',         6000, 'available'),
('PC-13', 'Khu B', 'Intel i7-12700F, 32GB DDR4, RTX 3070, SSD 1TB',         6000, 'available'),
('PC-14', 'Khu B', 'Intel i7-12700F, 32GB DDR4, RTX 3070, SSD 1TB',         6000, 'available'),
('PC-15', 'Khu B', 'Intel i7-12700F, 32GB DDR4, RTX 3070, SSD 1TB',         6000, 'maintenance'),
('PC-16', 'Khu B', 'Intel i7-12700F, 32GB DDR4, RTX 3070, SSD 1TB',         6000, 'available'),
('PC-17', 'VIP',   'Intel i9-13900K, 64GB DDR5, RTX 4090, NVMe 2TB',        10000, 'available'),
('PC-18', 'VIP',   'Intel i9-13900K, 64GB DDR5, RTX 4090, NVMe 2TB',        10000, 'available'),
('PC-19', 'VIP',   'Intel i9-13900K, 64GB DDR5, RTX 4090, NVMe 2TB',        10000, 'available'),
('PC-20', 'VIP',   'Intel i9-13900K, 64GB DDR5, RTX 4090, NVMe 2TB',        10000, 'available');

-- ============================================
-- CÁC STORED PROCEDURES HỮU ÍCH
-- ============================================

DELIMITER //

-- Mở phiên sử dụng máy
CREATE PROCEDURE OpenSession(IN p_user_id INT, IN p_computer_id INT, OUT p_session_id INT)
BEGIN
  DECLARE v_balance DECIMAL(12,0);
  DECLARE v_status VARCHAR(20);

  SELECT balance INTO v_balance FROM users WHERE id = p_user_id;
  SELECT status INTO v_status FROM computers WHERE id = p_computer_id;

  IF v_balance < 5000 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Số dư không đủ (tối thiểu 5,000đ)';
  END IF;

  IF v_status != 'available' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Máy không sẵn sàng';
  END IF;

  INSERT INTO sessions (user_id, computer_id, start_time, status, cost)
  VALUES (p_user_id, p_computer_id, NOW(), 'active', 0);

  SET p_session_id = LAST_INSERT_ID();
  UPDATE computers SET status = 'in-use' WHERE id = p_computer_id;
END//

-- Đóng phiên và tính tiền
CREATE PROCEDURE CloseSession(IN p_session_id INT, IN p_staff_id INT)
BEGIN
  DECLARE v_user_id INT;
  DECLARE v_computer_id INT;
  DECLARE v_start DATETIME;
  DECLARE v_price DECIMAL(10,0);
  DECLARE v_minutes INT;
  DECLARE v_cost DECIMAL(12,0);
  DECLARE v_balance DECIMAL(12,0);

  SELECT s.user_id, s.computer_id, s.start_time, c.price_per_hour
  INTO v_user_id, v_computer_id, v_start, v_price
  FROM sessions s JOIN computers c ON s.id = c.id
  WHERE s.id = p_session_id AND s.status = 'active';

  SET v_minutes = TIMESTAMPDIFF(MINUTE, v_start, NOW());
  SET v_cost = CEIL(v_minutes / 60.0) * v_price;
  SELECT balance INTO v_balance FROM users WHERE id = v_user_id;

  UPDATE sessions SET end_time = NOW(), status = 'completed', cost = v_cost WHERE id = p_session_id;
  UPDATE computers SET status = 'available' WHERE id = v_computer_id;
  UPDATE users SET balance = GREATEST(0, balance - v_cost) WHERE id = v_user_id;

  INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, note, session_id, created_by)
  VALUES (v_user_id, 'payment', v_cost, v_balance, GREATEST(0, v_balance - v_cost),
          CONCAT('Thanh toán phiên #', p_session_id), p_session_id, p_staff_id);
END//

-- Nạp tiền tài khoản
CREATE PROCEDURE Deposit(IN p_user_id INT, IN p_amount DECIMAL(12,0), IN p_note TEXT, IN p_staff_id INT)
BEGIN
  DECLARE v_balance DECIMAL(12,0);
  IF p_amount < 10000 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Số tiền tối thiểu là 10,000đ';
  END IF;
  SELECT balance INTO v_balance FROM users WHERE id = p_user_id;
  UPDATE users SET balance = balance + p_amount WHERE id = p_user_id;
  INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, note, created_by)
  VALUES (p_user_id, 'deposit', p_amount, v_balance, v_balance + p_amount, p_note, p_staff_id);
END//

-- Thống kê doanh thu theo ngày
CREATE PROCEDURE GetRevenueByDay(IN p_from DATE, IN p_to DATE)
BEGIN
  SELECT
    DATE(created_at) AS ngay,
    COUNT(*) AS so_giao_dich,
    SUM(amount) AS tong_tien
  FROM transactions
  WHERE type = 'payment'
    AND DATE(created_at) BETWEEN p_from AND p_to
  GROUP BY DATE(created_at)
  ORDER BY ngay;
END//

DELIMITER ;

-- ============================================
-- VIEWS HỮU ÍCH
-- ============================================

-- View phiên đang hoạt động
CREATE VIEW v_active_sessions AS
SELECT
  s.id,
  u.name AS customer_name,
  u.username,
  u.balance,
  c.name AS computer_name,
  c.zone,
  c.price_per_hour,
  s.start_time,
  TIMESTAMPDIFF(MINUTE, s.start_time, NOW()) AS minutes_used,
  CEIL(TIMESTAMPDIFF(MINUTE, s.start_time, NOW()) / 60.0) * c.price_per_hour AS estimated_cost
FROM sessions s
JOIN users u ON s.user_id = u.id
JOIN computers c ON s.computer_id = c.id
WHERE s.status = 'active';

-- View thống kê máy tính
CREATE VIEW v_computer_stats AS
SELECT
  c.id, c.name, c.zone, c.status, c.price_per_hour,
  COUNT(s.id) AS total_sessions,
  SUM(s.cost) AS total_revenue,
  MAX(s.start_time) AS last_used
FROM computers c
LEFT JOIN sessions s ON c.id = s.computer_id AND s.status = 'completed'
GROUP BY c.id;
