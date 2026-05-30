/* ===== CYBERNET PRO - FRONTEND APP (localStorage sim for demo) ===== */

// ============ DATA STORE (Simulates MySQL via localStorage) ============
const DB = {
  get(table) { return JSON.parse(localStorage.getItem('cn_' + table) || '[]'); },
  set(table, data) { localStorage.setItem('cn_' + table, JSON.stringify(data)); },
  nextId(table) {
    const d = this.get(table);
    return d.length > 0 ? Math.max(...d.map(r => r.id)) + 1 : 1;
  },
  insert(table, row) {
    const d = this.get(table);
    row.id = this.nextId(table);
    row.created_at = row.created_at || new Date().toISOString();
    d.push(row);
    this.set(table, d);
    return row;
  },
  update(table, id, changes) {
    const d = this.get(table).map(r => r.id === id ? {...r, ...changes, updated_at: new Date().toISOString()} : r);
    this.set(table, d);
  },
  delete(table, id) { this.set(table, this.get(table).filter(r => r.id !== id)); },
  find(table, fn) { return this.get(table).find(fn) || null; },
  where(table, fn) { return this.get(table).filter(fn); },
};

// ============ SEED DEFAULT DATA ============
function seedData() {
  if (DB.get('users').length > 0) return;
  // Admin
  DB.insert('users', { username: 'admin', password: 'admin123', name: 'Admin Hệ Thống', role: 'admin', email: 'admin@cybernet.vn', phone: '0900000000', balance: 0, status: 'active' });
  DB.insert('users', { username: 'quanly', password: '123456', name: 'Nguyễn Quản Lý', role: 'manager', email: 'manager@cybernet.vn', phone: '0911111111', balance: 0, status: 'active' });
  DB.insert('users', { username: 'nhanvien', password: '123456', name: 'Trần Nhân Viên', role: 'staff', email: 'staff@cybernet.vn', phone: '0922222222', balance: 0, status: 'active' });
  DB.insert('users', { username: 'khach1', password: '123456', name: 'Lê Văn Khách', role: 'customer', email: 'khach@gmail.com', phone: '0933333333', balance: 50000, status: 'active' });
  // Computers
  for (let i = 1; i <= 20; i++) {
    DB.insert('computers', { name: 'PC-' + String(i).padStart(2,'0'), status: i <= 3 ? 'in-use' : (i === 15 ? 'maintenance' : 'available'), specs: 'Intel i5, 16GB RAM, GTX 1660', price_per_hour: 5000, zone: i <= 10 ? 'Khu A' : 'Khu B' });
  }
  // Sessions
  DB.insert('sessions', { user_id: 4, computer_id: 1, start_time: new Date(Date.now() - 3600000).toISOString(), end_time: null, status: 'active', cost: 0 });
  DB.insert('sessions', { user_id: 4, computer_id: 2, start_time: new Date(Date.now() - 7200000).toISOString(), end_time: new Date(Date.now() - 3600000).toISOString(), status: 'completed', cost: 5000 });
  // Transactions
  DB.insert('transactions', { user_id: 4, type: 'deposit', amount: 100000, note: 'Nạp tiền lần đầu', created_by: 2 });
  DB.insert('transactions', { user_id: 4, type: 'payment', amount: 5000, note: 'Thanh toán phiên PC-02', created_by: 1 });
  DB.insert('transactions', { user_id: 4, type: 'deposit', amount: 50000, note: 'Nạp thêm tiền', created_by: 3 });
}

// ============ AUTH ============
let currentUser = null;

function doLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const role = document.getElementById('loginRole').value;
  const alertEl = document.getElementById('loginAlert');

  if (!username || !password) { showAlert(alertEl, 'error', 'Vui lòng nhập đầy đủ thông tin!'); return; }

  const user = DB.find('users', u => u.username === username && u.password === password);
  if (!user) { showAlert(alertEl, 'error', 'Tên đăng nhập hoặc mật khẩu không đúng!'); return; }
  if (user.role !== role) { showAlert(alertEl, 'error', `Tài khoản này không có vai trò "${getRoleName(role)}"!`); return; }
  if (user.status === 'locked') { showAlert(alertEl, 'error', 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên!'); return; }

  currentUser = user;
  localStorage.setItem('cn_session', JSON.stringify(user));
  showDashboard();
}

function doLogout() {
  currentUser = null;
  localStorage.removeItem('cn_session');
  document.getElementById('dashboard').classList.add('hidden');
  document.querySelector('.login-page') && document.body.classList.add('login-page');
  location.reload();
}

function showRegister() { document.getElementById('registerModal').classList.remove('hidden'); }
function hideRegister() { document.getElementById('registerModal').classList.add('hidden'); }

function doRegister() {
  const name = document.getElementById('regName').value.trim();
  const username = document.getElementById('regUser').value.trim();
  const password = document.getElementById('regPass').value;
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const alertEl = document.getElementById('regAlert');
  if (!name || !username || !password) { showAlert(alertEl, 'error', 'Vui lòng điền đầy đủ thông tin!'); return; }
  if (DB.find('users', u => u.username === username)) { showAlert(alertEl, 'error', 'Tên đăng nhập đã tồn tại!'); return; }
  DB.insert('users', { username, password, name, role: 'customer', email, phone, balance: 0, status: 'active' });
  showAlert(alertEl, 'success', 'Đăng ký thành công! Bạn có thể đăng nhập ngay.');
  setTimeout(hideRegister, 1500);
}

// ============ DASHBOARD ============
function showDashboard() {
  document.querySelector('.login-container').classList.add('hidden');
  document.getElementById('registerModal').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  document.body.classList.remove('login-page');

  // Set user info
  document.getElementById('sidebarName').textContent = currentUser.name;
  document.getElementById('sidebarRole').textContent = getRoleName(currentUser.role);
  document.getElementById('sidebarAvatar').textContent = currentUser.name.split(' ').map(w=>w[0]).slice(-2).join('').toUpperCase();

  buildNav();
  startClock();

  // Default page
  const firstNav = getNavItems()[0];
  if (firstNav) navigateTo(firstNav.page, firstNav.title);
}

function getRoleName(role) {
  return { admin: 'Quản Trị Viên', manager: 'Quản Lý Quán', staff: 'Nhân Viên', customer: 'Khách Hàng' }[role] || role;
}

function getNavItems() {
  const all = {
    admin: [
      { icon: '📊', title: 'Tổng Quan', page: 'dashboard' },
      { icon: '👥', title: 'Quản Lý Người Dùng', page: 'users' },
      { icon: '🖥️', title: 'Quản Lý Máy Tính', page: 'computers' },
      { icon: '📋', title: 'Lịch Sử Hoạt Động', page: 'activity' },
      { icon: '💰', title: 'Thống Kê Doanh Thu', page: 'revenue' },
      { icon: '🔒', title: 'Phân Quyền & Bảo Mật', page: 'security' },
    ],
    manager: [
      { icon: '📊', title: 'Tổng Quan', page: 'dashboard' },
      { icon: '🖥️', title: 'Quản Lý Máy Tính', page: 'computers' },
      { icon: '👥', title: 'Quản Lý Khách Hàng', page: 'customers' },
      { icon: '👔', title: 'Quản Lý Nhân Viên', page: 'staff' },
      { icon: '💰', title: 'Thống Kê Doanh Thu', page: 'revenue' },
      { icon: '📋', title: 'Lịch Sử Hoạt Động', page: 'activity' },
    ],
    staff: [
      { icon: '🖥️', title: 'Quản Lý Máy', page: 'computers' },
      { icon: '▶️', title: 'Mở Máy Khách', page: 'open_session' },
      { icon: '⏹️', title: 'Kết Thúc Phiên', page: 'close_session' },
      { icon: '💳', title: 'Nạp Tiền Khách', page: 'deposit' },
      { icon: '📋', title: 'Lịch Sử Phiên', page: 'sessions' },
    ],
    customer: [
      { icon: '🖥️', title: 'Danh Sách Máy', page: 'pclist' },
      { icon: '⏱️', title: 'Phiên Hiện Tại', page: 'my_session' },
      { icon: '💳', title: 'Tài Khoản & Số Dư', page: 'my_account' },
      { icon: '📋', title: 'Lịch Sử Sử Dụng', page: 'my_history' },
    ],
  };
  return all[currentUser.role] || [];
}

function buildNav() {
  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = getNavItems().map(item =>
    `<div class="nav-item" data-page="${item.page}" onclick="navigateTo('${item.page}','${item.title}')">
      <span class="nav-icon">${item.icon}</span><span>${item.title}</span>
    </div>`
  ).join('');
}

function navigateTo(page, title) {
  document.getElementById('pageTitle').textContent = title || page;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  const area = document.getElementById('contentArea');
  area.innerHTML = '<div class="fade-in">' + renderPage(page) + '</div>';
  afterRender(page);
}

// ============ PAGE RENDERERS ============
function renderPage(page) {
  switch(page) {
    case 'dashboard': return renderDashboard();
    case 'computers': return renderComputers();
    case 'users': return renderUsers();
    case 'customers': return renderCustomers();
    case 'staff': return renderStaff();
    case 'revenue': return renderRevenue();
    case 'activity': return renderActivity();
    case 'security': return renderSecurity();
    case 'open_session': return renderOpenSession();
    case 'close_session': return renderCloseSession();
    case 'deposit': return renderDeposit();
    case 'sessions': return renderSessions();
    case 'pclist': return renderPcList();
    case 'my_session': return renderMySession();
    case 'my_account': return renderMyAccount();
    case 'my_history': return renderMyHistory();
    default: return '<div class="empty-state"><div class="empty-icon">🚧</div><p>Trang đang phát triển</p></div>';
  }
}

// ---- DASHBOARD ----
function renderDashboard() {
  const computers = DB.get('computers');
  const sessions = DB.get('sessions');
  const users = DB.get('users');
  const transactions = DB.get('transactions');
  const activeSessions = sessions.filter(s => s.status === 'active');
  const todayRevenue = transactions.filter(t => {
    return t.type === 'payment' && new Date(t.created_at).toDateString() === new Date().toDateString();
  }).reduce((sum, t) => sum + t.amount, 0);

  return `
  <div class="stats-grid">
    <div class="stat-card" style="--card-color: var(--green)">
      <div class="stat-icon">🖥️</div>
      <div class="stat-value">${computers.filter(c=>c.status==='in-use').length}/${computers.length}</div>
      <div class="stat-label">MÁY ĐANG SỬ DỤNG</div>
    </div>
    <div class="stat-card" style="--card-color: var(--accent)">
      <div class="stat-icon">👤</div>
      <div class="stat-value">${activeSessions.length}</div>
      <div class="stat-label">KHÁCH ĐANG ONLINE</div>
    </div>
    <div class="stat-card" style="--card-color: var(--yellow)">
      <div class="stat-icon">💰</div>
      <div class="stat-value">${formatMoney(todayRevenue)}</div>
      <div class="stat-label">DOANH THU HÔM NAY</div>
    </div>
    <div class="stat-card" style="--card-color: var(--accent2)">
      <div class="stat-icon">👥</div>
      <div class="stat-value">${users.filter(u=>u.role==='customer').length}</div>
      <div class="stat-label">TỔNG KHÁCH HÀNG</div>
    </div>
  </div>
  <div class="two-col">
    <div class="panel">
      <div class="panel-header"><span class="panel-title">🖥️ TRẠNG THÁI MÁY</span></div>
      <div class="panel-body">
        ${['available','in-use','maintenance'].map(s => {
          const count = computers.filter(c=>c.status===s).length;
          const labels = {available:'Trống',  'in-use':'Đang dùng', maintenance:'Bảo trì'};
          const pct = Math.round(count/computers.length*100);
          return `<div class="chart-bar-row">
            <div class="chart-bar-label">${labels[s]}</div>
            <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${pct}%">${count}</div></div>
            <div class="chart-bar-val">${pct}%</div>
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="panel">
      <div class="panel-header"><span class="panel-title">⚡ PHIÊN GẦN ĐÂY</span></div>
      <div class="panel-body">
        <table>
          <thead><tr><th>KHÁCH</th><th>MÁY</th><th>TRẠNG THÁI</th></tr></thead>
          <tbody>
          ${sessions.slice(-5).reverse().map(s => {
            const u = DB.find('users', u => u.id === s.user_id);
            const c = DB.find('computers', c => c.id === s.computer_id);
            return `<tr>
              <td>${u ? u.name : 'N/A'}</td>
              <td>${c ? c.name : 'N/A'}</td>
              <td><span class="badge ${s.status==='active'?'badge-green':'badge-blue'}">${s.status==='active'?'ĐANG DÙNG':'XONG'}</span></td>
            </tr>`;
          }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

// ---- COMPUTERS ----
function renderComputers() {
  const computers = DB.get('computers');
  const canEdit = ['admin','manager','staff'].includes(currentUser.role);
  return `
  <div class="panel" style="margin-bottom:20px">
    <div class="panel-header">
      <span class="panel-title">🖥️ DANH SÁCH MÁY TÍNH</span>
      ${canEdit ? `<div class="panel-actions">
        <button class="btn btn-accent" onclick="showAddPcModal()">+ Thêm Máy</button>
      </div>` : ''}
    </div>
    <div class="panel-body">
      <div style="margin-bottom:12px;display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-sm btn-accent" onclick="filterPC('all')">Tất cả (${computers.length})</button>
        <button class="btn btn-sm btn-success" onclick="filterPC('available')">Trống (${computers.filter(c=>c.status==='available').length})</button>
        <button class="btn btn-sm btn-accent" onclick="filterPC('in-use')">Đang dùng (${computers.filter(c=>c.status==='in-use').length})</button>
        <button class="btn btn-sm btn-warning" onclick="filterPC('maintenance')">Bảo trì (${computers.filter(c=>c.status==='maintenance').length})</button>
      </div>
      <div class="pc-grid" id="pcGrid">
        ${computers.map(c => renderPcCard(c, canEdit)).join('')}
      </div>
    </div>
  </div>
  ${canEdit ? renderAddPcModalHTML() : ''}`;
}

function renderPcCard(c, canEdit) {
  const icons = { available: '🟢', 'in-use': '🔵', maintenance: '🟡' };
  const labels = { available: 'Sẵn sàng', 'in-use': 'Đang dùng', maintenance: 'Bảo trì' };
  const badgeClass = { available: 'badge-green', 'in-use': 'badge-blue', maintenance: 'badge-yellow' };

  const activeSession = DB.find('sessions', s => s.computer_id === c.id && s.status === 'active');
  let timeInfo = '';
  if (activeSession) {
    const mins = Math.floor((Date.now() - new Date(activeSession.start_time)) / 60000);
    timeInfo = `<div class="pc-time">${Math.floor(mins/60)}h ${mins%60}m</div>`;
  }

  return `<div class="pc-card ${c.status}" id="pccard-${c.id}">
    <div class="pc-icon">${icons[c.status] || '⚪'}</div>
    <div class="pc-name">${c.name}</div>
    <div style="margin-top:4px"><span class="badge ${badgeClass[c.status]}">${labels[c.status]}</span></div>
    <div class="pc-status-text" style="color:var(--text-dim);margin-top:4px">${c.zone}</div>
    ${timeInfo}
    ${canEdit ? `<div style="margin-top:10px;display:flex;gap:4px;justify-content:center">
      <button class="btn btn-sm btn-warning" onclick="editPc(${c.id})">✏️</button>
      <button class="btn btn-sm btn-danger" onclick="deletePc(${c.id})">🗑️</button>
    </div>` : ''}
  </div>`;
}

function renderAddPcModalHTML() {
  return `<div id="addPcModal" class="modal hidden">
    <div class="modal-box">
      <div class="card-header">
        <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
        <span class="card-title" id="pcModalTitle">THÊM MÁY TÍNH</span>
        <button class="close-btn" onclick="closeModal('addPcModal')">✕</button>
      </div>
      <div id="pcAlert" class="alert hidden" style="margin:0 28px 16px"></div>
      <div class="form-group"><label>TÊN MÁY</label><input type="text" id="pcName" placeholder="PC-01"/></div>
      <div class="form-group"><label>KHU VỰC</label><select id="pcZone"><option>Khu A</option><option>Khu B</option><option>VIP</option></select></div>
      <div class="form-group"><label>CẤU HÌNH</label><input type="text" id="pcSpecs" placeholder="Intel i5, 16GB RAM, GTX 1660"/></div>
      <div class="form-group"><label>GIÁ/GIỜ (VNĐ)</label><input type="number" id="pcPrice" value="5000"/></div>
      <div class="form-group"><label>TRẠNG THÁI</label>
        <select id="pcStatus"><option value="available">Sẵn sàng</option><option value="maintenance">Bảo trì</option></select>
      </div>
      <input type="hidden" id="pcEditId" value=""/>
      <button class="btn-primary" onclick="savePc()">LƯU MÁY TÍNH</button>
    </div>
  </div>`;
}

function showAddPcModal() {
  document.getElementById('pcEditId').value = '';
  document.getElementById('pcModalTitle').textContent = 'THÊM MÁY TÍNH';
  document.getElementById('pcName').value = '';
  document.getElementById('pcSpecs').value = '';
  document.getElementById('pcPrice').value = '5000';
  document.getElementById('addPcModal').classList.remove('hidden');
}

function editPc(id) {
  const c = DB.find('computers', c => c.id === id);
  if (!c) return;
  document.getElementById('pcEditId').value = id;
  document.getElementById('pcModalTitle').textContent = 'SỬA MÁY TÍNH';
  document.getElementById('pcName').value = c.name;
  document.getElementById('pcZone').value = c.zone;
  document.getElementById('pcSpecs').value = c.specs;
  document.getElementById('pcPrice').value = c.price_per_hour;
  document.getElementById('pcStatus').value = c.status === 'in-use' ? 'available' : c.status;
  document.getElementById('addPcModal').classList.remove('hidden');
}

function deletePc(id) {
  if (!confirm('Bạn có chắc muốn xóa máy này?')) return;
  const activeSession = DB.find('sessions', s => s.computer_id === id && s.status === 'active');
  if (activeSession) { alert('Không thể xóa máy đang có khách sử dụng!'); return; }
  DB.delete('computers', id);
  navigateTo('computers', 'Quản Lý Máy Tính');
}

function savePc() {
  const name = document.getElementById('pcName').value.trim();
  const zone = document.getElementById('pcZone').value;
  const specs = document.getElementById('pcSpecs').value.trim();
  const price = parseInt(document.getElementById('pcPrice').value) || 5000;
  const status = document.getElementById('pcStatus').value;
  const editId = document.getElementById('pcEditId').value;
  const alertEl = document.getElementById('pcAlert');
  if (!name) { showAlert(alertEl, 'error', 'Vui lòng nhập tên máy!'); return; }
  if (editId) {
    DB.update('computers', parseInt(editId), { name, zone, specs, price_per_hour: price, status });
  } else {
    if (DB.find('computers', c => c.name === name)) { showAlert(alertEl, 'error', 'Tên máy đã tồn tại!'); return; }
    DB.insert('computers', { name, zone, specs, price_per_hour: price, status: 'available' });
  }
  closeModal('addPcModal');
  navigateTo('computers', 'Quản Lý Máy Tính');
}

function filterPC(status) {
  const computers = status === 'all' ? DB.get('computers') : DB.where('computers', c => c.status === status);
  const canEdit = ['admin','manager','staff'].includes(currentUser.role);
  document.getElementById('pcGrid').innerHTML = computers.map(c => renderPcCard(c, canEdit)).join('');
}

// ---- USERS / CUSTOMERS / STAFF ----
function renderUsers() {
  return renderUserTable(DB.get('users'), 'QUẢN LÝ NGƯỜI DÙNG', true);
}
function renderCustomers() {
  return renderUserTable(DB.where('users', u => u.role === 'customer'), 'QUẢN LÝ KHÁCH HÀNG', false);
}
function renderStaff() {
  return renderUserTable(DB.where('users', u => ['staff','manager'].includes(u.role)), 'QUẢN LÝ NHÂN VIÊN', false);
}

function renderUserTable(users, title, showRole) {
  return `
  <div class="panel">
    <div class="panel-header">
      <span class="panel-title">👥 ${title}</span>
      <div class="panel-actions">
        <input type="text" placeholder="Tìm kiếm..." style="background:var(--bg-input);border:1px solid var(--border);border-radius:6px;padding:6px 12px;color:var(--text);font-size:0.85rem;width:180px" oninput="filterUsers(this.value)"/>
        <button class="btn btn-accent" onclick="showAddUserModal()">+ Thêm</button>
      </div>
    </div>
    <div class="panel-body" style="overflow-x:auto">
      <table id="userTable">
        <thead><tr>
          <th>ID</th><th>HỌ TÊN</th><th>TÀI KHOẢN</th>
          ${showRole ? '<th>VAI TRÒ</th>' : ''}
          <th>SỐ DƯ</th><th>TRẠNG THÁI</th><th>HÀNH ĐỘNG</th>
        </tr></thead>
        <tbody>${users.map(u => renderUserRow(u, showRole)).join('')}</tbody>
      </table>
    </div>
  </div>
  ${renderUserModalHTML()}`;
}

function renderUserRow(u, showRole) {
  const roleBadge = { admin:'badge-red', manager:'badge-purple', staff:'badge-blue', customer:'badge-green' };
  return `<tr>
    <td>#${u.id}</td>
    <td><strong>${u.name}</strong><br><small style="color:var(--text-dim)">${u.email||''}</small></td>
    <td><code style="color:var(--accent)">${u.username}</code></td>
    ${showRole ? `<td><span class="badge ${roleBadge[u.role]}">${getRoleName(u.role)}</span></td>` : ''}
    <td style="color:var(--green)">${formatMoney(u.balance||0)}</td>
    <td><span class="badge ${u.status==='active'?'badge-green':'badge-red'}">${u.status==='active'?'ACTIVE':'KHÓA'}</span></td>
    <td>
      <div style="display:flex;gap:6px">
        <button class="btn btn-sm btn-accent" onclick="editUser(${u.id})">✏️</button>
        <button class="btn btn-sm ${u.status==='active'?'btn-warning':'btn-success'}" onclick="toggleUserStatus(${u.id})">${u.status==='active'?'🔒':'🔓'}</button>
        ${currentUser.role==='admin' ? `<button class="btn btn-sm btn-danger" onclick="deleteUser(${u.id})">🗑️</button>` : ''}
      </div>
    </td>
  </tr>`;
}

function renderUserModalHTML() {
  return `<div id="userModal" class="modal hidden">
    <div class="modal-box">
      <div class="card-header">
        <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
        <span class="card-title" id="userModalTitle">THÊM NGƯỜI DÙNG</span>
        <button class="close-btn" onclick="closeModal('userModal')">✕</button>
      </div>
      <div id="userAlert" class="alert hidden" style="margin:0 28px 16px"></div>
      <div class="form-group"><label>HỌ TÊN</label><input type="text" id="uName" placeholder="Nguyễn Văn A"/></div>
      <div class="form-group"><label>TÊN ĐĂNG NHẬP</label><input type="text" id="uUser" placeholder="username"/></div>
      <div class="form-group"><label>MẬT KHẨU</label><input type="password" id="uPass" placeholder="Để trống = giữ nguyên"/></div>
      <div class="form-group"><label>EMAIL</label><input type="email" id="uEmail" placeholder="email@example.com"/></div>
      <div class="form-group"><label>SỐ ĐIỆN THOẠI</label><input type="text" id="uPhone" placeholder="0901234567"/></div>
      <div class="form-group"><label>VAI TRÒ</label>
        <select id="uRole"><option value="customer">Khách hàng</option><option value="staff">Nhân viên</option><option value="manager">Quản lý</option><option value="admin">Admin</option></select>
      </div>
      <input type="hidden" id="uEditId" value=""/>
      <button class="btn-primary" onclick="saveUser()">LƯU</button>
    </div>
  </div>`;
}

function showAddUserModal() {
  document.getElementById('uEditId').value = '';
  document.getElementById('userModalTitle').textContent = 'THÊM NGƯỜI DÙNG';
  ['uName','uUser','uPass','uEmail','uPhone'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('userModal').classList.remove('hidden');
}

function editUser(id) {
  const u = DB.find('users', u => u.id === id);
  if (!u) return;
  document.getElementById('uEditId').value = id;
  document.getElementById('userModalTitle').textContent = 'SỬA NGƯỜI DÙNG';
  document.getElementById('uName').value = u.name;
  document.getElementById('uUser').value = u.username;
  document.getElementById('uPass').value = '';
  document.getElementById('uEmail').value = u.email || '';
  document.getElementById('uPhone').value = u.phone || '';
  document.getElementById('uRole').value = u.role;
  document.getElementById('userModal').classList.remove('hidden');
}

function saveUser() {
  const name = document.getElementById('uName').value.trim();
  const username = document.getElementById('uUser').value.trim();
  const password = document.getElementById('uPass').value;
  const email = document.getElementById('uEmail').value.trim();
  const phone = document.getElementById('uPhone').value.trim();
  const role = document.getElementById('uRole').value;
  const editId = document.getElementById('uEditId').value;
  const alertEl = document.getElementById('userAlert');
  if (!name || !username) { showAlert(alertEl, 'error', 'Vui lòng điền đủ thông tin!'); return; }
  if (editId) {
    const changes = { name, username, email, phone, role };
    if (password) changes.password = password;
    DB.update('users', parseInt(editId), changes);
  } else {
    if (!password) { showAlert(alertEl, 'error', 'Vui lòng nhập mật khẩu!'); return; }
    if (DB.find('users', u => u.username === username)) { showAlert(alertEl, 'error', 'Tên đăng nhập đã tồn tại!'); return; }
    DB.insert('users', { name, username, password, email, phone, role, balance: 0, status: 'active' });
  }
  closeModal('userModal');
  navigateTo(currentUser.role === 'admin' ? 'users' : 'customers', '');
}

function toggleUserStatus(id) {
  const u = DB.find('users', u => u.id === id);
  if (!u) return;
  DB.update('users', id, { status: u.status === 'active' ? 'locked' : 'active' });
  navigateTo(currentUser.role === 'admin' ? 'users' : 'customers', '');
}

function deleteUser(id) {
  if (id === currentUser.id) { alert('Không thể xóa tài khoản đang đăng nhập!'); return; }
  if (!confirm('Xóa người dùng này?')) return;
  DB.delete('users', id);
  navigateTo('users', 'Quản Lý Người Dùng');
}

function filterUsers(q) {
  const rows = document.querySelectorAll('#userTable tbody tr');
  rows.forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
  });
}

// ---- REVENUE ----
function renderRevenue() {
  const transactions = DB.get('transactions');
  const payments = transactions.filter(t => t.type === 'payment');
  const today = new Date();
  const days = ['CN','Th2','Th3','Th4','Th5','Th6','Th7'];
  const weekData = Array(7).fill(0).map((_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (6 - i));
    return {
      label: days[d.getDay()],
      amount: payments.filter(t => new Date(t.created_at).toDateString() === d.toDateString()).reduce((s,t)=>s+t.amount,0)
    };
  });
  const totalRevenue = payments.reduce((s,t)=>s+t.amount,0);
  const maxWeek = Math.max(...weekData.map(d=>d.amount), 1);

  return `
  <div class="stats-grid">
    <div class="stat-card" style="--card-color:var(--green)"><div class="stat-icon">💰</div>
      <div class="stat-value">${formatMoney(payments.filter(t=>new Date(t.created_at).toDateString()===today.toDateString()).reduce((s,t)=>s+t.amount,0))}</div>
      <div class="stat-label">DOANH THU HÔM NAY</div></div>
    <div class="stat-card" style="--card-color:var(--accent)"><div class="stat-icon">📅</div>
      <div class="stat-value">${formatMoney(weekData.reduce((s,d)=>s+d.amount,0))}</div>
      <div class="stat-label">DOANH THU TUẦN NÀY</div></div>
    <div class="stat-card" style="--card-color:var(--yellow)"><div class="stat-icon">📊</div>
      <div class="stat-value">${formatMoney(totalRevenue)}</div>
      <div class="stat-label">TỔNG DOANH THU</div></div>
    <div class="stat-card" style="--card-color:var(--accent2)"><div class="stat-icon">🧾</div>
      <div class="stat-value">${payments.length}</div>
      <div class="stat-label">TỔNG GIAO DỊCH</div></div>
  </div>
  <div class="panel">
    <div class="panel-header"><span class="panel-title">📈 DOANH THU 7 NGÀY GẦN ĐÂY</span></div>
    <div class="panel-body">
      ${weekData.map(d => `
        <div class="chart-bar-row">
          <div class="chart-bar-label">${d.label}</div>
          <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${Math.round(d.amount/maxWeek*100)}%">${d.amount>0?formatMoney(d.amount):''}</div></div>
          <div class="chart-bar-val">${formatMoney(d.amount)}</div>
        </div>`).join('')}
    </div>
  </div>
  <div class="panel">
    <div class="panel-header"><span class="panel-title">🧾 LỊCH SỬ GIAO DỊCH</span></div>
    <div class="panel-body" style="overflow-x:auto">
      <table>
        <thead><tr><th>THỜI GIAN</th><th>LOẠI</th><th>SỐ TIỀN</th><th>GHI CHÚ</th></tr></thead>
        <tbody>${transactions.slice().reverse().slice(0,20).map(t => `<tr>
          <td>${formatDate(t.created_at)}</td>
          <td><span class="badge ${t.type==='payment'?'badge-green':'badge-blue'}">${t.type==='payment'?'THANH TOÁN':'NẠP TIỀN'}</span></td>
          <td style="color:var(--green);font-family:var(--font-display)">${formatMoney(t.amount)}</td>
          <td style="color:var(--text-dim)">${t.note||''}</td>
        </tr>`).join('')}</tbody>
      </table>
    </div>
  </div>`;
}

// ---- ACTIVITY ----
function renderActivity() {
  const sessions = DB.get('sessions');
  return `<div class="panel">
    <div class="panel-header"><span class="panel-title">📋 LỊCH SỬ HOẠT ĐỘNG</span></div>
    <div class="panel-body" style="overflow-x:auto">
      <table>
        <thead><tr><th>ID</th><th>KHÁCH HÀNG</th><th>MÁY</th><th>BẮT ĐẦU</th><th>KẾT THÚC</th><th>THỜI GIAN</th><th>CHI PHÍ</th><th>TRẠNG THÁI</th></tr></thead>
        <tbody>${sessions.slice().reverse().map(s => {
          const u = DB.find('users', u => u.id === s.user_id);
          const c = DB.find('computers', c => c.id === s.computer_id);
          const duration = s.end_time ? Math.floor((new Date(s.end_time)-new Date(s.start_time))/60000) : Math.floor((Date.now()-new Date(s.start_time))/60000);
          return `<tr>
            <td>#${s.id}</td>
            <td>${u?u.name:'N/A'}</td>
            <td>${c?c.name:'N/A'}</td>
            <td>${formatDate(s.start_time)}</td>
            <td>${s.end_time?formatDate(s.end_time):'<span style="color:var(--green)">Đang dùng</span>'}</td>
            <td>${Math.floor(duration/60)}h ${duration%60}m</td>
            <td style="color:var(--green)">${formatMoney(s.cost||0)}</td>
            <td><span class="badge ${s.status==='active'?'badge-green':'badge-blue'}">${s.status==='active'?'ĐANG DÙNG':'HOÀN THÀNH'}</span></td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>
  </div>`;
}

// ---- SECURITY ----
function renderSecurity() {
  return `<div class="two-col">
    <div class="panel">
      <div class="panel-header"><span class="panel-title">🔒 PHÂN QUYỀN HỆ THỐNG</span></div>
      <div class="panel-body">
        <table>
          <thead><tr><th>VAI TRÒ</th><th>QUYỀN HẠN</th></tr></thead>
          <tbody>
            <tr><td><span class="badge badge-red">Admin</span></td><td>Toàn quyền hệ thống</td></tr>
            <tr><td><span class="badge badge-purple">Quản Lý</span></td><td>Quản lý máy, nhân viên, khách, thống kê</td></tr>
            <tr><td><span class="badge badge-blue">Nhân Viên</span></td><td>Mở/đóng máy, nạp tiền khách</td></tr>
            <tr><td><span class="badge badge-green">Khách Hàng</span></td><td>Xem máy, phiên, số dư, lịch sử</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="panel">
      <div class="panel-header"><span class="panel-title">🛡️ BẢO MẬT & SAO LƯU</span></div>
      <div class="panel-body">
        <div class="form-group"><label>SAO LƯU DỮ LIỆU</label>
          <button class="btn btn-accent" onclick="exportData()" style="width:100%">📥 Xuất File Backup</button>
        </div>
        <div class="form-group"><label>KHÔI PHỤC DỮ LIỆU</label>
          <input type="file" id="restoreFile" accept=".json" onchange="importData(event)" style="background:var(--bg-input);border:1px solid var(--border);border-radius:8px;padding:10px;width:100%;color:var(--text)"/>
        </div>
        <div class="form-group"><label>RESET DỮ LIỆU</label>
          <button class="btn btn-danger" onclick="resetData()" style="width:100%">⚠️ Reset Toàn Bộ (Nguy Hiểm)</button>
        </div>
      </div>
    </div>
  </div>`;
}

// ---- OPEN SESSION (STAFF) ----
function renderOpenSession() {
  const availablePCs = DB.where('computers', c => c.status === 'available');
  const customers = DB.where('users', u => u.role === 'customer' && u.status === 'active');
  return `<div class="panel">
    <div class="panel-header"><span class="panel-title">▶️ MỞ MÁY CHO KHÁCH</span></div>
    <div class="panel-body">
      <div id="openAlert" class="alert hidden"></div>
      <div class="form-row">
        <div class="form-group"><label>CHỌN KHÁCH HÀNG</label>
          <select id="sessionUser">
            <option value="">-- Chọn khách --</option>
            ${customers.map(u => `<option value="${u.id}">${u.name} (${u.username}) - Số dư: ${formatMoney(u.balance)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>CHỌN MÁY (${availablePCs.length} trống)</label>
          <select id="sessionPC">
            <option value="">-- Chọn máy --</option>
            ${availablePCs.map(c => `<option value="${c.id}">${c.name} - ${c.zone} (${formatMoney(c.price_per_hour)}/giờ)</option>`).join('')}
          </select>
        </div>
      </div>
      <button class="btn btn-success" style="padding:12px 28px;font-size:1rem" onclick="openSession()">▶ MỞ MÁY</button>
    </div>
  </div>
  <div class="panel">
    <div class="panel-header"><span class="panel-title">🔵 PHIÊN ĐANG HOẠT ĐỘNG</span></div>
    <div class="panel-body" style="overflow-x:auto">
      <table><thead><tr><th>KHÁCH</th><th>MÁY</th><th>BẮT ĐẦU</th><th>THỜI GIAN</th><th>TẠM TÍNH</th></tr></thead>
        <tbody>${DB.where('sessions', s=>s.status==='active').map(s => {
          const u = DB.find('users', u=>u.id===s.user_id);
          const c = DB.find('computers', c=>c.id===s.computer_id);
          const mins = Math.floor((Date.now()-new Date(s.start_time))/60000);
          const cost = Math.floor(mins/60 * (c ? c.price_per_hour : 5000));
          return `<tr>
            <td>${u?u.name:'N/A'}</td><td>${c?c.name:'N/A'}</td>
            <td>${formatDate(s.start_time)}</td>
            <td>${Math.floor(mins/60)}h ${mins%60}m</td>
            <td style="color:var(--green)">${formatMoney(cost)}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>
  </div>`;
}

function openSession() {
  const userId = parseInt(document.getElementById('sessionUser').value);
  const pcId = parseInt(document.getElementById('sessionPC').value);
  const alertEl = document.getElementById('openAlert');
  if (!userId || !pcId) { showAlert(alertEl, 'error', 'Vui lòng chọn khách hàng và máy!'); return; }
  const user = DB.find('users', u => u.id === userId);
  if (user.balance < 5000) { showAlert(alertEl, 'error', 'Số dư tài khoản khách không đủ (tối thiểu 5,000đ)!'); return; }
  DB.insert('sessions', { user_id: userId, computer_id: pcId, start_time: new Date().toISOString(), end_time: null, status: 'active', cost: 0 });
  DB.update('computers', pcId, { status: 'in-use' });
  showAlert(alertEl, 'success', 'Đã mở máy thành công!');
  setTimeout(() => navigateTo('open_session', 'Mở Máy Khách'), 1000);
}

// ---- CLOSE SESSION (STAFF) ----
function renderCloseSession() {
  const activeSessions = DB.where('sessions', s => s.status === 'active');
  return `<div class="panel">
    <div class="panel-header"><span class="panel-title">⏹️ KẾT THÚC PHIÊN SỬ DỤNG</span></div>
    <div class="panel-body" style="overflow-x:auto">
      ${activeSessions.length === 0 ? '<div class="empty-state"><div class="empty-icon">✅</div><p>Không có phiên nào đang hoạt động</p></div>' :
      `<table><thead><tr><th>KHÁCH HÀNG</th><th>MÁY</th><th>THỜI GIAN SD</th><th>SỐ DƯ</th><th>CHI PHÍ TẠM TÍNH</th><th>HÀNH ĐỘNG</th></tr></thead>
        <tbody>${activeSessions.map(s => {
          const u = DB.find('users', u=>u.id===s.user_id);
          const c = DB.find('computers', c=>c.id===s.computer_id);
          const mins = Math.floor((Date.now()-new Date(s.start_time))/60000);
          const cost = Math.ceil(mins/60 * (c ? c.price_per_hour : 5000));
          return `<tr>
            <td><strong>${u?u.name:'N/A'}</strong></td>
            <td>${c?c.name:'N/A'}</td>
            <td>${Math.floor(mins/60)}h ${mins%60}m</td>
            <td style="color:${(u&&u.balance>=cost)?'var(--green)':'var(--red)'}">${formatMoney(u?u.balance:0)}</td>
            <td style="color:var(--yellow);font-family:var(--font-display);font-size:1.1rem">${formatMoney(cost)}</td>
            <td><button class="btn btn-danger" onclick="closeSession(${s.id})">⏹ Kết Thúc</button></td>
          </tr>`;
        }).join('')}</tbody>
      </table>`}
    </div>
  </div>`;
}

function closeSession(sessionId) {
  const s = DB.find('sessions', s => s.id === sessionId);
  if (!s) return;
  const c = DB.find('computers', c => c.id === s.computer_id);
  const mins = Math.floor((Date.now()-new Date(s.start_time))/60000);
  const cost = Math.ceil(mins/60 * (c ? c.price_per_hour : 5000));
  const user = DB.find('users', u => u.id === s.user_id);
  if (!user || user.balance < cost) {
    if (!confirm(`Số dư không đủ! Chi phí: ${formatMoney(cost)}, Số dư: ${formatMoney(user?user.balance:0)}. Tiếp tục kết thúc phiên?`)) return;
  }
  DB.update('sessions', sessionId, { end_time: new Date().toISOString(), status: 'completed', cost });
  DB.update('computers', s.computer_id, { status: 'available' });
  if (user) DB.update('users', user.id, { balance: Math.max(0, user.balance - cost) });
  DB.insert('transactions', { user_id: s.user_id, type: 'payment', amount: cost, note: `Thanh toán phiên ${c?c.name:''}`, created_by: currentUser.id });
  alert(`✅ Kết thúc thành công!\nThời gian: ${Math.floor(mins/60)}h ${mins%60}m\nChi phí: ${formatMoney(cost)}`);
  navigateTo('close_session', 'Kết Thúc Phiên');
}

// ---- DEPOSIT (STAFF) ----
function renderDeposit() {
  const customers = DB.where('users', u => u.role === 'customer');
  return `<div class="two-col">
    <div class="panel">
      <div class="panel-header"><span class="panel-title">💳 NẠP TIỀN TÀI KHOẢN</span></div>
      <div class="panel-body">
        <div id="depositAlert" class="alert hidden"></div>
        <div class="form-group"><label>CHỌN KHÁCH HÀNG</label>
          <select id="depositUser" onchange="showUserBalance()">
            <option value="">-- Chọn khách --</option>
            ${customers.map(u => `<option value="${u.id}">${u.name} (${u.username})</option>`).join('')}
          </select>
        </div>
        <div id="currentBalance" style="margin-bottom:16px;padding:12px;background:var(--bg-input);border-radius:8px;display:none">
          <div class="balance-label">SỐ DƯ HIỆN TẠI</div>
          <div class="balance-big" id="balanceAmt">0đ</div>
        </div>
        <div class="form-group"><label>SỐ TIỀN NẠP (VNĐ)</label>
          <input type="number" id="depositAmount" placeholder="50000" min="10000" step="10000"/>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
          ${[20000,50000,100000,200000,500000].map(v=>`<button class="btn btn-sm btn-accent" onclick="document.getElementById('depositAmount').value=${v}">${formatMoney(v)}</button>`).join('')}
        </div>
        <div class="form-group"><label>GHI CHÚ</label><input type="text" id="depositNote" placeholder="Nạp tiền mặt"/></div>
        <button class="btn-primary" onclick="doDeposit()">💳 NẠP TIỀN</button>
      </div>
    </div>
    <div class="panel">
      <div class="panel-header"><span class="panel-title">📋 LỊCH SỬ NẠP TIỀN GẦN ĐÂY</span></div>
      <div class="panel-body" style="overflow-x:auto">
        <table><thead><tr><th>THỜI GIAN</th><th>KHÁCH</th><th>SỐ TIỀN</th></tr></thead>
          <tbody>${DB.where('transactions', t=>t.type==='deposit').slice().reverse().slice(0,10).map(t => {
            const u = DB.find('users', u=>u.id===t.user_id);
            return `<tr><td>${formatDate(t.created_at)}</td><td>${u?u.name:'N/A'}</td><td style="color:var(--green)">${formatMoney(t.amount)}</td></tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    </div>
  </div>`;
}

function showUserBalance() {
  const uid = parseInt(document.getElementById('depositUser').value);
  const el = document.getElementById('currentBalance');
  if (!uid) { el.style.display = 'none'; return; }
  const u = DB.find('users', u => u.id === uid);
  if (u) { document.getElementById('balanceAmt').textContent = formatMoney(u.balance); el.style.display = 'block'; }
}

function doDeposit() {
  const userId = parseInt(document.getElementById('depositUser').value);
  const amount = parseInt(document.getElementById('depositAmount').value);
  const note = document.getElementById('depositNote').value || 'Nạp tiền mặt';
  const alertEl = document.getElementById('depositAlert');
  if (!userId) { showAlert(alertEl, 'error', 'Vui lòng chọn khách hàng!'); return; }
  if (!amount || amount < 10000) { showAlert(alertEl, 'error', 'Số tiền tối thiểu là 10,000đ!'); return; }
  const user = DB.find('users', u => u.id === userId);
  DB.update('users', userId, { balance: user.balance + amount });
  DB.insert('transactions', { user_id: userId, type: 'deposit', amount, note, created_by: currentUser.id });
  showAlert(alertEl, 'success', `Đã nạp ${formatMoney(amount)} vào tài khoản ${user.name}!`);
  showUserBalance();
}

// ---- SESSIONS (STAFF) ----
function renderSessions() {
  return renderActivity();
}

// ---- PC LIST (CUSTOMER) ----
function renderPcList() {
  const computers = DB.get('computers');
  return `<div class="panel">
    <div class="panel-header"><span class="panel-title">🖥️ DANH SÁCH MÁY TÍNH</span></div>
    <div class="panel-body">
      <div class="pc-grid">${computers.map(c => renderPcCard(c, false)).join('')}</div>
    </div>
  </div>`;
}

// ---- MY SESSION (CUSTOMER) ----
function renderMySession() {
  const session = DB.find('sessions', s => s.user_id === currentUser.id && s.status === 'active');
  if (!session) return `<div class="empty-state"><div class="empty-icon">💤</div><p>Bạn không có phiên sử dụng nào đang hoạt động</p><p style="margin-top:8px;font-size:0.85rem">Vui lòng liên hệ nhân viên để mở máy</p></div>`;
  const c = DB.find('computers', c => c.id === session.computer_id);
  const mins = Math.floor((Date.now()-new Date(session.start_time))/60000);
  const cost = Math.ceil(mins/60 * (c ? c.price_per_hour : 5000));
  return `
  <div class="session-panel">
    <div style="color:var(--text-dim);font-size:0.8rem;letter-spacing:2px;margin-bottom:8px">THỜI GIAN SỬ DỤNG</div>
    <div class="session-timer" id="liveTimer">${Math.floor(mins/60).toString().padStart(2,'0')}:${(mins%60).toString().padStart(2,'0')}:00</div>
    <div class="session-info">
      <div class="session-info-item"><div class="session-info-label">MÁY ĐANG DÙNG</div><div class="session-info-value" style="color:var(--accent)">${c?c.name:'N/A'}</div></div>
      <div class="session-info-item"><div class="session-info-label">CHI PHÍ TẠM TÍNH</div><div class="session-info-value" style="color:var(--yellow)">${formatMoney(cost)}</div></div>
      <div class="session-info-item"><div class="session-info-label">SỐ DƯ CÒN LẠI</div><div class="session-info-value" style="color:${currentUser.balance>=cost?'var(--green)':'var(--red)'}">${formatMoney(currentUser.balance-cost)}</div></div>
    </div>
  </div>
  <div class="panel">
    <div class="panel-header"><span class="panel-title">ℹ️ THÔNG TIN PHIÊN</span></div>
    <div class="panel-body">
      <table>
        <tr><td style="color:var(--text-dim)">Bắt đầu</td><td>${formatDate(session.start_time)}</td></tr>
        <tr><td style="color:var(--text-dim)">Giá/giờ</td><td style="color:var(--accent)">${formatMoney(c?c.price_per_hour:5000)}</td></tr>
        <tr><td style="color:var(--text-dim)">Khu vực</td><td>${c?c.zone:'N/A'}</td></tr>
        <tr><td style="color:var(--text-dim)">Cấu hình</td><td style="color:var(--text-dim)">${c?c.specs:'N/A'}</td></tr>
      </table>
    </div>
  </div>`;
}

// ---- MY ACCOUNT (CUSTOMER) ----
function renderMyAccount() {
  const u = DB.find('users', u => u.id === currentUser.id);
  const transactions = DB.where('transactions', t => t.user_id === currentUser.id);
  return `
  <div class="two-col">
    <div class="panel">
      <div class="panel-header"><span class="panel-title">👤 THÔNG TIN TÀI KHOẢN</span></div>
      <div class="panel-body">
        <div style="text-align:center;padding:20px 0">
          <div style="width:70px;height:70px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:1.5rem;font-weight:700;color:#000;margin:0 auto 16px">${u.name.split(' ').map(w=>w[0]).slice(-2).join('').toUpperCase()}</div>
          <div style="font-size:1.3rem;font-weight:600">${u.name}</div>
          <div style="color:var(--text-dim);margin-top:4px">@${u.username}</div>
        </div>
        <div style="padding:16px;background:var(--bg-input);border-radius:10px;text-align:center;margin-bottom:16px">
          <div class="balance-label">SỐ DƯ TÀI KHOẢN</div>
          <div class="balance-big">${formatMoney(u.balance)}</div>
        </div>
        <table>
          <tr><td style="color:var(--text-dim)">Email</td><td>${u.email||'Chưa cập nhật'}</td></tr>
          <tr><td style="color:var(--text-dim)">Điện thoại</td><td>${u.phone||'Chưa cập nhật'}</td></tr>
          <tr><td style="color:var(--text-dim)">Trạng thái</td><td><span class="badge badge-green">ACTIVE</span></td></tr>
        </table>
      </div>
    </div>
    <div class="panel">
      <div class="panel-header"><span class="panel-title">💰 LỊCH SỬ GIAO DỊCH</span></div>
      <div class="panel-body">
        ${transactions.length === 0 ? '<div class="empty-state"><div class="empty-icon">📭</div><p>Chưa có giao dịch nào</p></div>' :
        `<table><thead><tr><th>THỜI GIAN</th><th>LOẠI</th><th>SỐ TIỀN</th></tr></thead>
          <tbody>${transactions.slice().reverse().map(t=>`<tr>
            <td style="font-size:0.8rem">${formatDate(t.created_at)}</td>
            <td><span class="badge ${t.type==='deposit'?'badge-blue':'badge-green'}">${t.type==='deposit'?'NẠP':'THANH TOÁN'}</span></td>
            <td style="color:${t.type==='deposit'?'var(--green)':'var(--yellow)'};font-family:var(--font-display)">${t.type==='deposit'?'+':'-'}${formatMoney(t.amount)}</td>
          </tr>`).join('')}</tbody>
        </table>`}
      </div>
    </div>
  </div>`;
}

// ---- MY HISTORY (CUSTOMER) ----
function renderMyHistory() {
  const sessions = DB.where('sessions', s => s.user_id === currentUser.id);
  return `<div class="panel">
    <div class="panel-header"><span class="panel-title">📋 LỊCH SỬ SỬ DỤNG MÁY</span></div>
    <div class="panel-body" style="overflow-x:auto">
      ${sessions.length === 0 ? '<div class="empty-state"><div class="empty-icon">📭</div><p>Chưa có lịch sử sử dụng</p></div>' :
      `<table><thead><tr><th>MÁY</th><th>BẮT ĐẦU</th><th>KẾT THÚC</th><th>THỜI GIAN</th><th>CHI PHÍ</th><th>TRẠNG THÁI</th></tr></thead>
        <tbody>${sessions.slice().reverse().map(s => {
          const c = DB.find('computers', c=>c.id===s.computer_id);
          const mins = s.end_time ? Math.floor((new Date(s.end_time)-new Date(s.start_time))/60000) : Math.floor((Date.now()-new Date(s.start_time))/60000);
          return `<tr>
            <td>${c?c.name:'N/A'}</td>
            <td>${formatDate(s.start_time)}</td>
            <td>${s.end_time?formatDate(s.end_time):'<span style="color:var(--green)">Đang dùng</span>'}</td>
            <td>${Math.floor(mins/60)}h ${mins%60}m</td>
            <td style="color:var(--yellow)">${formatMoney(s.cost||0)}</td>
            <td><span class="badge ${s.status==='active'?'badge-green':'badge-blue'}">${s.status==='active'?'ĐANG DÙNG':'XONG'}</span></td>
          </tr>`;
        }).join('')}</tbody>
      </table>`}
    </div>
  </div>`;
}

// ============ UTILITIES ============
function showAlert(el, type, msg) {
  el.className = `alert ${type}`;
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function formatMoney(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function startClock() {
  const days = ['Chủ nhật','Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy'];
  function tick() {
    const now = new Date();
    const clockEl = document.getElementById('clockDisplay');
    const dateEl = document.getElementById('dateDisplay');
    if (clockEl) clockEl.textContent = now.toLocaleTimeString('vi-VN');
    if (dateEl) dateEl.textContent = `${days[now.getDay()]}, ${now.toLocaleDateString('vi-VN')}`;
  }
  tick();
  setInterval(tick, 1000);
}

function afterRender(page) {
  if (page === 'my_session') {
    const session = DB.find('sessions', s => s.user_id === currentUser.id && s.status === 'active');
    if (session) {
      const timerEl = document.getElementById('liveTimer');
      if (timerEl) {
        setInterval(() => {
          const secs = Math.floor((Date.now()-new Date(session.start_time))/1000);
          const h = Math.floor(secs/3600), m = Math.floor((secs%3600)/60), s = secs%60;
          timerEl.textContent = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        }, 1000);
      }
    }
  }
}

function exportData() {
  const data = {};
  ['users','computers','sessions','transactions'].forEach(t => { data[t] = DB.get(t); });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `cybernet_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
}

function importData(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      ['users','computers','sessions','transactions'].forEach(t => { if (data[t]) DB.set(t, data[t]); });
      alert('Khôi phục dữ liệu thành công!'); location.reload();
    } catch { alert('File backup không hợp lệ!'); }
  };
  reader.readAsText(file);
}

function resetData() {
  if (!confirm('⚠️ CẢNH BÁO: Thao tác này sẽ xóa TOÀN BỘ dữ liệu! Bạn có chắc chắn?')) return;
  if (!confirm('Lần cuối xác nhận: Xóa tất cả dữ liệu?')) return;
  ['users','computers','sessions','transactions'].forEach(t => localStorage.removeItem('cn_' + t));
  location.reload();
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
  seedData();
  const saved = localStorage.getItem('cn_session');
  if (saved) {
    try {
      const u = JSON.parse(saved);
      const fresh = DB.find('users', usr => usr.id === u.id);
      if (fresh && fresh.status === 'active') {
        currentUser = fresh;
        showDashboard();
        return;
      }
    } catch {}
  }
  // Login enter key
  document.getElementById('loginPassword').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
});
