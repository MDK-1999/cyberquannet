 // ============================================
// CYBERNET PRO - BACKEND API (Node.js + Express + MySQL)
// ============================================
// Cài đặt: npm install express mysql2 bcryptjs jsonwebtoken cors dotenv
// Chạy:    node api/server.js
// ============================================

const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
const path = require('path');
app.use(express.static(path.join(__dirname, '..')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'home.html'));
});
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});
// ---- DB Connection Pool ----
const pool = mysql.createPool({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    user:     process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    charset:  'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    ssl: { rejectUnauthorized: false }
});
const JWT_SECRET = process.env.JWT_SECRET || 'cybernet_secret_2024';

// ============ MIDDLEWARE ============
function auth(roles = []) {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Chưa đăng nhập' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (roles.length && !roles.includes(decoded.role))
        return res.status(403).json({ error: 'Không có quyền truy cập' });
      req.user = decoded;
      next();
    } catch {
      res.status(401).json({ error: 'Token không hợp lệ' });
    }
  };
}

// ============ AUTH ROUTES ============

// POST /api/auth/register - Đăng ký
app.post('/api/auth/register', async (req, res) => {
  const { username, password, name, email, phone } = req.body;
  if (!username || !password || !name)
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, name, email, phone, role) VALUES (?,?,?,?,?,?)',
      [username, hash, name, email || null, phone || null, 'customer']
    );
    res.json({ message: 'Đăng ký thành công', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login - Đăng nhập
app.post('/api/auth/login', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Tài khoản không tồn tại' });
    if (user.status === 'locked') return res.status(401).json({ error: 'Tài khoản đã bị khóa' });
    if (!(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Mật khẩu không đúng' });
    if (role && user.role !== role)
      return res.status(401).json({ error: 'Vai trò không khớp' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '12h' });
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ USER ROUTES ============

// GET /api/users - Lấy danh sách người dùng
app.get('/api/users', auth(['admin', 'manager', 'staff']), async (req, res) => {
  const { role } = req.query;
  let sql = 'SELECT id,username,name,role,email,phone,balance,status,created_at FROM users';
  const params = [];
  if (role) { sql += ' WHERE role = ?'; params.push(role); }
  sql += ' ORDER BY created_at DESC';
  const [rows] = await pool.execute(sql, params);
  res.json(rows);
});

// GET /api/users/:id - Chi tiết người dùng
app.get('/api/users/:id', auth(), async (req, res) => {
  const id = parseInt(req.params.id);
  if (req.user.role === 'customer' && req.user.id !== id)
    return res.status(403).json({ error: 'Không có quyền' });
  const [rows] = await pool.execute('SELECT id,username,name,role,email,phone,balance,status FROM users WHERE id=?', [id]);
  if (!rows[0]) return res.status(404).json({ error: 'Không tìm thấy' });
  res.json(rows[0]);
});

// PUT /api/users/:id - Cập nhật người dùng
app.put('/api/users/:id', auth(['admin','manager']), async (req, res) => {
  const { name, email, phone, role, status, password } = req.body;
  const id = parseInt(req.params.id);
  let sql = 'UPDATE users SET name=?, email=?, phone=?, role=?, status=?';
  const params = [name, email, phone, role, status];
  if (password) { sql += ', password=?'; params.push(await bcrypt.hash(password, 10)); }
  sql += ' WHERE id=?'; params.push(id);
  await pool.execute(sql, params);
  res.json({ message: 'Cập nhật thành công' });
});

// DELETE /api/users/:id
app.delete('/api/users/:id', auth(['admin']), async (req, res) => {
  await pool.execute('DELETE FROM users WHERE id=?', [req.params.id]);
  res.json({ message: 'Đã xóa' });
});

// PATCH /api/users/:id/toggle-status
app.patch('/api/users/:id/toggle-status', auth(['admin','manager']), async (req, res) => {
  const [rows] = await pool.execute('SELECT status FROM users WHERE id=?', [req.params.id]);
  const newStatus = rows[0]?.status === 'active' ? 'locked' : 'active';
  await pool.execute('UPDATE users SET status=? WHERE id=?', [newStatus, req.params.id]);
  res.json({ status: newStatus });
});

// ============ COMPUTER ROUTES ============

// GET /api/computers
app.get('/api/computers', auth(), async (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT * FROM computers';
  const params = [];
  if (status) { sql += ' WHERE status=?'; params.push(status); }
  sql += ' ORDER BY name';
  const [rows] = await pool.execute(sql, params);
  res.json(rows);
});

// POST /api/computers
app.post('/api/computers', auth(['admin','manager']), async (req, res) => {
  const { name, zone, specs, price_per_hour } = req.body;
  try {
    const [r] = await pool.execute(
      'INSERT INTO computers (name, zone, specs, price_per_hour) VALUES (?,?,?,?)',
      [name, zone, specs, price_per_hour || 5000]
    );
    res.json({ id: r.insertId, message: 'Thêm máy thành công' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Tên máy đã tồn tại' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/computers/:id
app.put('/api/computers/:id', auth(['admin','manager','staff']), async (req, res) => {
  const { name, zone, specs, price_per_hour, status } = req.body;
  await pool.execute(
    'UPDATE computers SET name=?, zone=?, specs=?, price_per_hour=?, status=? WHERE id=?',
    [name, zone, specs, price_per_hour, status, req.params.id]
  );
  res.json({ message: 'Cập nhật thành công' });
});

// DELETE /api/computers/:id
app.delete('/api/computers/:id', auth(['admin','manager']), async (req, res) => {
  const [active] = await pool.execute('SELECT id FROM sessions WHERE computer_id=? AND status="active"', [req.params.id]);
  if (active.length) return res.status(400).json({ error: 'Không thể xóa máy đang có khách sử dụng' });
  await pool.execute('DELETE FROM computers WHERE id=?', [req.params.id]);
  res.json({ message: 'Đã xóa máy' });
});

// ============ SESSION ROUTES ============

// GET /api/sessions
app.get('/api/sessions', auth(), async (req, res) => {
  let sql = `SELECT s.*, u.name as customer_name, c.name as computer_name, c.zone
             FROM sessions s
             JOIN users u ON s.user_id = u.id
             JOIN computers c ON s.computer_id = c.id`;
  const params = [];
  if (req.user.role === 'customer') {
    sql += ' WHERE s.user_id=?'; params.push(req.user.id);
  }
  const { status } = req.query;
  if (status) {
    sql += (params.length ? ' AND' : ' WHERE') + ' s.status=?';
    params.push(status);
  }
  sql += ' ORDER BY s.start_time DESC LIMIT 100';
  const [rows] = await pool.execute(sql, params);
  res.json(rows);
});

// POST /api/sessions/open - Mở máy
app.post('/api/sessions/open', auth(['admin','manager','staff']), async (req, res) => {
  const { user_id, computer_id } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[user]] = await conn.execute('SELECT balance FROM users WHERE id=? FOR UPDATE', [user_id]);
    const [[computer]] = await conn.execute('SELECT status FROM computers WHERE id=? FOR UPDATE', [computer_id]);
    if (!user) throw new Error('Không tìm thấy khách hàng');
    if (user.balance < 5000) throw new Error('Số dư tài khoản không đủ (tối thiểu 5,000đ)');
    if (computer.status !== 'available') throw new Error('Máy không ở trạng thái sẵn sàng');
    const [[existing]] = await conn.execute('SELECT id FROM sessions WHERE user_id=? AND status="active"', [user_id]);
    if (existing) throw new Error('Khách hàng đang có phiên sử dụng khác');
    const [result] = await conn.execute(
      'INSERT INTO sessions (user_id, computer_id, start_time, status) VALUES (?,?,NOW(),"active")',
      [user_id, computer_id]
    );
    await conn.execute('UPDATE computers SET status="in-use" WHERE id=?', [computer_id]);
    await conn.execute('INSERT INTO system_logs (user_id, action, detail) VALUES (?,?,?)',
      [req.user.id, 'OPEN_SESSION', `Session #${result.insertId} opened for user #${user_id} on computer #${computer_id}`]);
    await conn.commit();
    res.json({ session_id: result.insertId, message: 'Đã mở máy thành công' });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// POST /api/sessions/:id/close - Đóng máy và tính tiền
app.post('/api/sessions/:id/close', auth(['admin','manager','staff']), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[session]] = await conn.execute(
      'SELECT s.*, c.price_per_hour FROM sessions s JOIN computers c ON s.computer_id = c.id WHERE s.id=? AND s.status="active" FOR UPDATE',
      [req.params.id]
    );
    if (!session) throw new Error('Phiên không tồn tại hoặc đã kết thúc');
    const minutes = Math.max(1, Math.floor((Date.now() - new Date(session.start_time)) / 60000));
    const cost = Math.ceil(minutes / 60) * session.price_per_hour;
    const [[user]] = await conn.execute('SELECT balance FROM users WHERE id=? FOR UPDATE', [session.user_id]);
    const newBalance = Math.max(0, user.balance - cost);
    await conn.execute('UPDATE sessions SET end_time=NOW(), status="completed", cost=? WHERE id=?', [cost, session.id]);
    await conn.execute('UPDATE computers SET status="available" WHERE id=?', [session.computer_id]);
    await conn.execute('UPDATE users SET balance=? WHERE id=?', [newBalance, session.user_id]);
    await conn.execute(
      'INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, note, session_id, created_by) VALUES (?,?,?,?,?,?,?,?)',
      [session.user_id, 'payment', cost, user.balance, newBalance, `Thanh toán phiên #${session.id}`, session.id, req.user.id]
    );
    await conn.commit();
    res.json({ cost, minutes, new_balance: newBalance, message: 'Kết thúc phiên thành công' });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// ============ TRANSACTION ROUTES ============

// GET /api/transactions
app.get('/api/transactions', auth(), async (req, res) => {
  let sql = `SELECT t.*, u.name as customer_name, s.name as staff_name
             FROM transactions t
             JOIN users u ON t.user_id = u.id
             LEFT JOIN users s ON t.created_by = s.id`;
  const params = [];
  if (req.user.role === 'customer') {
    sql += ' WHERE t.user_id=?'; params.push(req.user.id);
  }
  const { type, from, to } = req.query;
  if (type) { sql += (params.length ? ' AND' : ' WHERE') + ' t.type=?'; params.push(type); }
  if (from) { sql += (params.length ? ' AND' : ' WHERE') + ' DATE(t.created_at)>=?'; params.push(from); }
  if (to) { sql += (params.length ? ' AND' : ' WHERE') + ' DATE(t.created_at)<=?'; params.push(to); }
  sql += ' ORDER BY t.created_at DESC LIMIT 200';
  const [rows] = await pool.execute(sql, params);
  res.json(rows);
});

// POST /api/transactions/deposit - Nạp tiền
app.post('/api/transactions/deposit', auth(['admin','manager','staff']), async (req, res) => {
  const { user_id, amount, note } = req.body;
  if (!amount || amount < 10000) return res.status(400).json({ error: 'Số tiền tối thiểu 10,000đ' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[user]] = await conn.execute('SELECT balance FROM users WHERE id=? FOR UPDATE', [user_id]);
    if (!user) throw new Error('Không tìm thấy khách hàng');
    const newBalance = user.balance + amount;
    await conn.execute('UPDATE users SET balance=? WHERE id=?', [newBalance, user_id]);
    await conn.execute(
      'INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, note, created_by) VALUES (?,?,?,?,?,?,?)',
      [user_id, 'deposit', amount, user.balance, newBalance, note || 'Nạp tiền mặt', req.user.id]
    );
    await conn.commit();
    res.json({ new_balance: newBalance, message: `Đã nạp ${amount.toLocaleString()}đ thành công` });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// ============ STATISTICS ROUTES ============

// GET /api/stats/revenue?period=day|week|month
app.get('/api/stats/revenue', auth(['admin','manager']), async (req, res) => {
  const { period = 'week' } = req.query;
  let groupBy, dateRange;
  if (period === 'day') { groupBy = 'HOUR(created_at)'; dateRange = 'DATE(created_at) = CURDATE()'; }
  else if (period === 'month') { groupBy = 'DATE(created_at)'; dateRange = 'YEAR(created_at)=YEAR(NOW()) AND MONTH(created_at)=MONTH(NOW())'; }
  else { groupBy = 'DATE(created_at)'; dateRange = 'created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'; }

  const [revenue] = await pool.execute(
    `SELECT ${groupBy} as period, COUNT(*) as count, SUM(amount) as total
     FROM transactions WHERE type='payment' AND ${dateRange} GROUP BY ${groupBy} ORDER BY period`
  );
  const [[summary]] = await pool.execute(
    `SELECT COUNT(*) as total_sessions, SUM(amount) as total_revenue,
            AVG(amount) as avg_revenue, MAX(amount) as max_session
     FROM transactions WHERE type='payment' AND ${dateRange}`
  );
  res.json({ revenue, summary });
});

// GET /api/stats/dashboard
app.get('/api/stats/dashboard', auth(['admin','manager','staff']), async (req, res) => {
  const [[computers]] = await pool.execute(
    `SELECT SUM(status='available') as available, SUM(status='in-use') as in_use, SUM(status='maintenance') as maintenance, COUNT(*) as total FROM computers`
  );
  const [[active_sessions]] = await pool.execute('SELECT COUNT(*) as count FROM sessions WHERE status="active"');
  const [[today_revenue]] = await pool.execute(
    `SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='payment' AND DATE(created_at)=CURDATE()`
  );
  const [[total_customers]] = await pool.execute(`SELECT COUNT(*) as count FROM users WHERE role='customer'`);
  res.json({ computers, active_sessions: active_sessions.count, today_revenue: today_revenue.total, total_customers: total_customers.count });
});

app.get('/api/setup-passwords', async (req, res) => {
    const passwords = {
        admin:    'admin123',
        quanly:   '123456',
        nhanvien: '123456',
        khach1:   '123456'
    };
    for (const [username, pwd] of Object.entries(passwords)) {
        const hash = await bcrypt.hash(pwd, 10);
        await pool.execute('UPDATE users SET password=? WHERE username=?', [hash, username]);
    }
    res.json({ success: true, message: 'Done!' });
});






// ============ START SERVER ============
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 CyberNET Pro API running on http://localhost:${PORT}`));

module.exports = app; 
