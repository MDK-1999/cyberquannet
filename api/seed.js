// ============================================
// CYBERNET PRO - Seed Script (tạo dữ liệu mẫu với mật khẩu đã hash)
// Chạy: node api/seed.js
// ============================================
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'cybernet',
    multipleStatements: true,
  });

  console.log('🔗 Đã kết nối MySQL...');

  // Hash passwords
  const [adminHash, managerHash, staffHash, customerHash] = await Promise.all([
    bcrypt.hash('admin123', 10),
    bcrypt.hash('123456', 10),
    bcrypt.hash('123456', 10),
    bcrypt.hash('123456', 10),
  ]);

  // Clear existing data
  await conn.execute('SET FOREIGN_KEY_CHECKS = 0');
  await conn.execute('TRUNCATE TABLE system_logs');
  await conn.execute('TRUNCATE TABLE transactions');
  await conn.execute('TRUNCATE TABLE sessions');
  await conn.execute('TRUNCATE TABLE computers');
  await conn.execute('TRUNCATE TABLE users');
  await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
  console.log('🗑️  Đã xóa dữ liệu cũ...');

  // Users
  await conn.execute(`
    INSERT INTO users (username, password, name, role, email, phone, balance, status) VALUES
    ('admin',    ?, 'Admin Hệ Thống',    'admin',    'admin@cybernet.vn',   '0900000000', 0,      'active'),
    ('quanly',   ?, 'Nguyễn Quản Lý',    'manager',  'manager@cybernet.vn', '0911111111', 0,      'active'),
    ('nhanvien', ?, 'Trần Nhân Viên',    'staff',    'staff@cybernet.vn',   '0922222222', 0,      'active'),
    ('khach1',   ?, 'Lê Văn Khách',      'customer', 'khach@gmail.com',     '0933333333', 150000, 'active'),
    ('khach2',   ?, 'Phạm Thị Lan',      'customer', 'lan@gmail.com',       '0944444444', 80000,  'active'),
    ('khach3',   ?, 'Nguyễn Minh Tuấn',  'customer', 'tuan@gmail.com',      '0955555555', 200000, 'active')
  `, [adminHash, managerHash, staffHash, customerHash, customerHash, customerHash]);
  console.log('👥 Đã tạo 6 người dùng...');

  // Computers - 20 máy
  const computers = [];
  for (let i = 1; i <= 10; i++) {
    computers.push([
      `PC-${String(i).padStart(2,'0')}`,
      'Khu A',
      'Intel i5-12400F, 16GB DDR4, GTX 1660 Super, SSD 512GB, 24" FHD 144Hz',
      5000,
      i <= 3 ? 'in-use' : 'available'
    ]);
  }
  for (let i = 11; i <= 16; i++) {
    computers.push([
      `PC-${i}`,
      'Khu B',
      'Intel i7-12700F, 32GB DDR4, RTX 3070, NVMe 1TB, 27" QHD 165Hz',
      7000,
      i === 15 ? 'maintenance' : 'available'
    ]);
  }
  for (let i = 17; i <= 20; i++) {
    computers.push([
      `PC-${i}`,
      'VIP',
      'Intel i9-13900K, 64GB DDR5, RTX 4090, NVMe 2TB, 32" 4K 240Hz',
      12000,
      'available'
    ]);
  }
  for (const c of computers) {
    await conn.execute(
      'INSERT INTO computers (name, zone, specs, price_per_hour, status) VALUES (?,?,?,?,?)', c
    );
  }
  console.log('🖥️  Đã tạo 20 máy tính...');

  // Sessions - một số phiên đã hoàn thành và 3 đang active
  const now = new Date();
  const sessions = [
    // Active
    [4, 1, new Date(now - 2*3600000).toISOString().slice(0,19).replace('T',' '), null, 'active', 0],
    [5, 2, new Date(now - 1.5*3600000).toISOString().slice(0,19).replace('T',' '), null, 'active', 0],
    [6, 3, new Date(now - 0.5*3600000).toISOString().slice(0,19).replace('T',' '), null, 'active', 0],
    // Completed
    [4, 4, new Date(now - 48*3600000).toISOString().slice(0,19).replace('T',' '), new Date(now - 45*3600000).toISOString().slice(0,19).replace('T',' '), 'completed', 15000],
    [5, 5, new Date(now - 24*3600000).toISOString().slice(0,19).replace('T',' '), new Date(now - 21*3600000).toISOString().slice(0,19).replace('T',' '), 'completed', 21000],
    [6, 6, new Date(now - 12*3600000).toISOString().slice(0,19).replace('T',' '), new Date(now - 10*3600000).toISOString().slice(0,19).replace('T',' '), 'completed', 10000],
    [4, 11, new Date(now - 5*3600000).toISOString().slice(0,19).replace('T',' '), new Date(now - 3*3600000).toISOString().slice(0,19).replace('T',' '), 'completed', 14000],
  ];
  for (const s of sessions) {
    await conn.execute(
      'INSERT INTO sessions (user_id, computer_id, start_time, end_time, status, cost) VALUES (?,?,?,?,?,?)', s
    );
  }
  console.log('⏱️  Đã tạo phiên sử dụng...');

  // Transactions
  const txs = [
    [4, 'deposit',  200000, 0,      200000, 'Nạp tiền lần đầu',         null, 2, new Date(now - 50*3600000)],
    [5, 'deposit',  100000, 0,      100000, 'Nạp tiền lần đầu',         null, 2, new Date(now - 30*3600000)],
    [6, 'deposit',  300000, 0,      300000, 'Nạp tiền lần đầu',         null, 3, new Date(now - 20*3600000)],
    [4, 'payment',   15000, 200000, 185000, 'Thanh toán phiên #4',       4, 3, new Date(now - 45*3600000)],
    [5, 'payment',   21000, 100000, 79000,  'Thanh toán phiên #5',       5, 3, new Date(now - 21*3600000)],
    [6, 'payment',   10000, 300000, 290000, 'Thanh toán phiên #6',       6, 2, new Date(now - 10*3600000)],
    [4, 'deposit',   50000, 185000, 235000, 'Nạp thêm tiền',            null, 3, new Date(now - 8*3600000)],
    [4, 'payment',   14000, 235000, 221000, 'Thanh toán phiên #7',       7, 2, new Date(now - 3*3600000)],
    [6, 'deposit',   50000, 290000, 340000, 'Nạp tiền mặt tại quầy',   null, 3, new Date(now - 2*3600000)],
  ];
  for (const t of txs) {
    await conn.execute(
      'INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, note, session_id, created_by, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
      [...t.slice(0,8), t[8].toISOString().slice(0,19).replace('T',' ')]
    );
  }
  console.log('💰 Đã tạo giao dịch mẫu...');

  await conn.end();
  console.log('');
  console.log('✅ SEED HOÀN TẤT!');
  console.log('');
  console.log('📋 TÀI KHOẢN MẪU:');
  console.log('  admin    / admin123  → Quản trị viên');
  console.log('  quanly   / 123456    → Quản lý quán');
  console.log('  nhanvien / 123456    → Nhân viên');
  console.log('  khach1   / 123456    → Khách hàng (150,000đ)');
  console.log('  khach2   / 123456    → Khách hàng (80,000đ)');
  console.log('  khach3   / 123456    → Khách hàng (200,000đ)');
}

seed().catch(err => { console.error('❌ Lỗi seed:', err.message); process.exit(1); });
