/* ===== CYBERNET PRO - FRONTEND APP (API Mode) ===== */

const API = 'https://cyberquannet-production.up.railway.app/api';
let currentUser = null;
let authToken = null;

// ============ API HELPER ============
async function apiCall(method, endpoint, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (authToken) opts.headers['Authorization'] = 'Bearer ' + authToken;
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(API + endpoint, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi server');
    return data;
  } catch (err) {
    throw err;
  }
}

// ============ AUTH ============
async function doLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const role = document.getElementById('loginRole').value;
  const alertEl = document.getElementById('loginAlert');
  if (!username || !password) { showAlert(alertEl, 'error', 'Vui lòng nhập đầy đủ!'); return; }
  try {
    const data = await apiCall('POST', '/auth/login', { username, password, role });
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('cn_token', authToken);
    localStorage.setItem('cn_user', JSON.stringify(currentUser));
    showDashboard();
  } catch (err) {
    showAlert(alertEl, 'error', err.message);
  }
}

async function doRegister() {
  const name = document.getElementById('regName').value.trim();
  const username = document.getElementById('regUser').value.trim();
  const password = document.getElementById('regPass').value;
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const alertEl = document.getElementById('regAlert');
  if (!name || !username || !password) { showAlert(alertEl, 'error', 'Vui lòng điền đầy đủ!'); return; }
  try {
    await apiCall('POST', '/auth/register', { name, username, password, email, phone });
    showAlert(alertEl, 'success', 'Đăng ký thành công! Bạn có thể đăng nhập ngay.');
    setTimeout(hideRegister, 1500);
  } catch (err) {
    showAlert(alertEl, 'error', err.message);
  }
}

function doLogout() {
  currentUser = null; authToken = null;
  localStorage.removeItem('cn_token');
  localStorage.removeItem('cn_user');
  location.reload();
}

function showRegister() { document.getElementById('registerModal').classList.remove('hidden'); }
function hideRegister() { document.getElementById('registerModal').classList.add('hidden'); }

// ============ DASHBOARD ============
function showDashboard() {
  document.querySelector('.login-container').classList.add('hidden');
  document.getElementById('registerModal').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  document.body.classList.remove('login-page');
  document.getElementById('sidebarName').textContent = currentUser.name;
  document.getElementById('sidebarRole').textContent = getRoleName(currentUser.role);
  document.getElementById('sidebarAvatar').textContent = currentUser.name.split(' ').map(w=>w[0]).slice(-2).join('').toUpperCase();
  buildNav();
  startClock();
  const firstNav = getNavItems()[0];
  if (firstNav) navigateTo(firstNav.page, firstNav.title);
}

function getRoleName(role) {
  return { admin:'Quản Trị Viên', manager:'Quản Lý Quán', staff:'Nhân Viên', customer:'Khách Hàng' }[role] || role;
}

function getNavItems() {
  const all = {
    admin: [
      { icon:'📊', title:'Tổng Quan', page:'dashboard' },
      { icon:'👥', title:'Quản Lý Người Dùng', page:'users' },
      { icon:'🖥️', title:'Quản Lý Máy Tính', page:'computers' },
      { icon:'📋', title:'Lịch Sử Hoạt Động', page:'activity' },
      { icon:'💰', title:'Thống Kê Doanh Thu', page:'revenue' },
    ],
    manager: [
      { icon:'📊', title:'Tổng Quan', page:'dashboard' },
      { icon:'🖥️', title:'Quản Lý Máy Tính', page:'computers' },
      { icon:'👥', title:'Quản Lý Khách Hàng', page:'customers' },
      { icon:'👔', title:'Quản Lý Nhân Viên', page:'staff' },
      { icon:'💰', title:'Thống Kê Doanh Thu', page:'revenue' },
      { icon:'📋', title:'Lịch Sử Hoạt Động', page:'activity' },
    ],
    staff: [
      { icon:'🖥️', title:'Quản Lý Máy', page:'computers' },
      { icon:'▶️', title:'Mở Máy Khách', page:'open_session' },
      { icon:'⏹️', title:'Kết Thúc Phiên', page:'close_session' },
      { icon:'💳', title:'Nạp Tiền Khách', page:'deposit' },
      { icon:'📋', title:'Lịch Sử Phiên', page:'sessions' },
    ],
    customer: [
      { icon:'🖥️', title:'Danh Sách Máy', page:'pclist' },
      { icon:'⏱️', title:'Phiên Hiện Tại', page:'my_session' },
      { icon:'💳', title:'Tài Khoản & Số Dư', page:'my_account' },
      { icon:'📋', title:'Lịch Sử Sử Dụng', page:'my_history' },
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
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  const area = document.getElementById('contentArea');
  area.innerHTML = '<div class="fade-in" id="pageContent"><div class="empty-state"><div class="empty-icon">⏳</div><p>Đang tải...</p></div></div>';
  loadPage(page);
}

async function loadPage(page) {
  let html = '';
  switch(page) {
    case 'dashboard': html = await renderDashboard(); break;
    case 'computers': html = await renderComputers(); break;
    case 'users': html = await renderUsers(); break;
    case 'customers': html = await renderCustomers(); break;
    case 'staff': html = await renderStaff(); break;
    case 'revenue': html = await renderRevenue(); break;
    case 'activity': html = await renderActivity(); break;
    case 'open_session': html = await renderOpenSession(); break;
    case 'close_session': html = await renderCloseSession(); break;
    case 'deposit': html = await renderDeposit(); break;
    case 'sessions': html = await renderActivity(); break;
    case 'pclist': html = await renderPcList(); break;
    case 'my_session': html = await renderMySession(); break;
    case 'my_account': html = await renderMyAccount(); break;
    case 'my_history': html = await renderMyHistory(); break;
    default: html = '<div class="empty-state"><div class="empty-icon">🚧</div><p>Trang đang phát triển</p></div>';
  }
  const el = document.getElementById('pageContent');
  if (el) el.innerHTML = html;
  afterRender(page);
}

// ============ PAGE RENDERERS ============
async function renderDashboard() {
  try {
    const stats = await apiCall('GET', '/stats/dashboard');
    const sessions = await apiCall('GET', '/sessions?status=active');
    return `
    <div class="stats-grid">
      <div class="stat-card" style="--card-color:var(--green)"><div class="stat-icon">🖥️</div>
        <div class="stat-value">${stats.computers.in_use}/${stats.computers.total}</div>
        <div class="stat-label">MÁY ĐANG SỬ DỤNG</div></div>
      <div class="stat-card" style="--card-color:var(--accent)"><div class="stat-icon">👤</div>
        <div class="stat-value">${stats.active_sessions}</div>
        <div class="stat-label">KHÁCH ĐANG ONLINE</div></div>
      <div class="stat-card" style="--card-color:var(--yellow)"><div class="stat-icon">💰</div>
        <div class="stat-value">${formatMoney(stats.today_revenue)}</div>
        <div class="stat-label">DOANH THU HÔM NAY</div></div>
      <div class="stat-card" style="--card-color:var(--accent2)"><div class="stat-icon">👥</div>
        <div class="stat-value">${stats.total_customers}</div>
        <div class="stat-label">TỔNG KHÁCH HÀNG</div></div>
    </div>
    <div class="panel">
      <div class="panel-header"><span class="panel-title">🔵 PHIÊN ĐANG HOẠT ĐỘNG</span></div>
      <div class="panel-body" style="overflow-x:auto">
        <table><thead><tr><th>KHÁCH</th><th>MÁY</th><th>BẮT ĐẦU</th><th>THỜI GIAN</th></tr></thead>
          <tbody>${sessions.map(s => {
            const mins = Math.floor((Date.now()-new Date(s.start_time))/60000);
            return `<tr>
              <td>${s.customer_name}</td><td>${s.computer_name}</td>
              <td>${formatDate(s.start_time)}</td>
              <td>${Math.floor(mins/60)}h ${mins%60}m</td>
            </tr>`;
          }).join('') || '<tr><td colspan="4" style="text-align:center;color:var(--text-dim)">Không có phiên nào</td></tr>'}</tbody>
        </table>
      </div>
    </div>`;
  } catch(e) { return `<div class="empty-state"><div class="empty-icon">❌</div><p>${e.message}</p></div>`; }
}

async function renderComputers() {
  try {
    const computers = await apiCall('GET', '/computers');
    const canEdit = ['admin','manager','staff'].includes(currentUser.role);
    return `
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">🖥️ DANH SÁCH MÁY TÍNH</span>
        ${canEdit ? `<button class="btn btn-accent" onclick="showAddPcModal()">+ Thêm Máy</button>` : ''}
      </div>
      <div class="panel-body">
        <div class="pc-grid">${computers.map(c => renderPcCard(c, canEdit)).join('')}</div>
      </div>
    </div>
    ${canEdit ? renderAddPcModalHTML() : ''}`;
  } catch(e) { return `<div class="empty-state"><div class="empty-icon">❌</div><p>${e.message}</p></div>`; }
}

function renderPcCard(c, canEdit) {
  const icons = { available:'🟢', 'in-use':'🔵', maintenance:'🟡' };
  const labels = { available:'Sẵn sàng', 'in-use':'Đang dùng', maintenance:'Bảo trì' };
  const badgeClass = { available:'badge-green', 'in-use':'badge-blue', maintenance:'badge-yellow' };
  return `<div class="pc-card ${c.status}">
    <div class="pc-icon">${icons[c.status]||'⚪'}</div>
    <div class="pc-name">${c.name}</div>
    <div style="margin-top:4px"><span class="badge ${badgeClass[c.status]}">${labels[c.status]}</span></div>
    <div class="pc-status-text" style="color:var(--text-dim);margin-top:4px">${c.zone}</div>
    <div style="font-size:0.75rem;color:var(--accent);margin-top:4px">${formatMoney(c.price_per_hour)}/giờ</div>
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
      <div class="form-group"><label>CẤU HÌNH</label><input type="text" id="pcSpecs" placeholder="Intel i5, 16GB RAM"/></div>
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
  ['pcName','pcSpecs'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('pcPrice').value = '5000';
  document.getElementById('addPcModal').classList.remove('hidden');
}

async function editPc(id) {
  try {
    const computers = await apiCall('GET', '/computers');
    const c = computers.find(c => c.id === id);
    if (!c) return;
    document.getElementById('pcEditId').value = id;
    document.getElementById('pcModalTitle').textContent = 'SỬA MÁY TÍNH';
    document.getElementById('pcName').value = c.name;
    document.getElementById('pcZone').value = c.zone;
    document.getElementById('pcSpecs').value = c.specs;
    document.getElementById('pcPrice').value = c.price_per_hour;
    document.getElementById('pcStatus').value = c.status === 'in-use' ? 'available' : c.status;
    document.getElementById('addPcModal').classList.remove('hidden');
  } catch(e) { alert(e.message); }
}

async function deletePc(id) {
  if (!confirm('Xóa máy này?')) return;
  try {
    await apiCall('DELETE', '/computers/' + id);
    navigateTo('computers', 'Quản Lý Máy Tính');
  } catch(e) { alert(e.message); }
}

async function savePc() {
  const name = document.getElementById('pcName').value.trim();
  const zone = document.getElementById('pcZone').value;
  const specs = document.getElementById('pcSpecs').value.trim();
  const price_per_hour = parseInt(document.getElementById('pcPrice').value) || 5000;
  const status = document.getElementById('pcStatus').value;
  const editId = document.getElementById('pcEditId').value;
  const alertEl = document.getElementById('pcAlert');
  if (!name) { showAlert(alertEl, 'error', 'Vui lòng nhập tên máy!'); return; }
  try {
    if (editId) await apiCall('PUT', '/computers/' + editId, { name, zone, specs, price_per_hour, status });
    else await apiCall('POST', '/computers', { name, zone, specs, price_per_hour });
    closeModal('addPcModal');
    navigateTo('computers', 'Quản Lý Máy Tính');
  } catch(e) { showAlert(alertEl, 'error', e.message); }
}

async function renderUsers() { return renderUserTable('/users', 'QUẢN LÝ NGƯỜI DÙNG', true); }
async function renderCustomers() { return renderUserTable('/users?role=customer', 'QUẢN LÝ KHÁCH HÀNG', false); }
async function renderStaff() { return renderUserTable('/users?role=staff', 'QUẢN LÝ NHÂN VIÊN', false); }

async function renderUserTable(endpoint, title, showRole) {
  try {
    const users = await apiCall('GET', endpoint);
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
          <thead><tr><th>ID</th><th>HỌ TÊN</th><th>TÀI KHOẢN</th>${showRole?'<th>VAI TRÒ</th>':''}<th>SỐ DƯ</th><th>TRẠNG THÁI</th><th>HÀNH ĐỘNG</th></tr></thead>
          <tbody>${users.map(u => {
            const roleBadge = { admin:'badge-red', manager:'badge-purple', staff:'badge-blue', customer:'badge-green' };
            return `<tr>
              <td>#${u.id}</td>
              <td><strong>${u.name}</strong><br><small style="color:var(--text-dim)">${u.email||''}</small></td>
              <td><code style="color:var(--accent)">${u.username}</code></td>
              ${showRole?`<td><span class="badge ${roleBadge[u.role]}">${getRoleName(u.role)}</span></td>`:''}
              <td style="color:var(--green)">${formatMoney(u.balance||0)}</td>
              <td><span class="badge ${u.status==='active'?'badge-green':'badge-red'}">${u.status==='active'?'ACTIVE':'KHÓA'}</span></td>
              <td><div style="display:flex;gap:6px">
                <button class="btn btn-sm btn-accent" onclick="editUser(${u.id})">✏️</button>
                <button class="btn btn-sm ${u.status==='active'?'btn-warning':'btn-success'}" onclick="toggleUserStatus(${u.id})">${u.status==='active'?'🔒':'🔓'}</button>
              </div></td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    </div>
    ${renderUserModalHTML()}`;
  } catch(e) { return `<div class="empty-state"><div class="empty-icon">❌</div><p>${e.message}</p></div>`; }
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
      <div class="form-group"><label>HỌ TÊN</label><input type="text" id="uName"/></div>
      <div class="form-group"><label>TÊN ĐĂNG NHẬP</label><input type="text" id="uUser"/></div>
      <div class="form-group"><label>MẬT KHẨU</label><input type="password" id="uPass" placeholder="Để trống = giữ nguyên"/></div>
      <div class="form-group"><label>EMAIL</label><input type="email" id="uEmail"/></div>
      <div class="form-group"><label>SỐ ĐIỆN THOẠI</label><input type="text" id="uPhone"/></div>
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

async function editUser(id) {
  try {
    const u = await apiCall('GET', '/users/' + id);
    document.getElementById('uEditId').value = id;
    document.getElementById('userModalTitle').textContent = 'SỬA NGƯỜI DÙNG';
    document.getElementById('uName').value = u.name;
    document.getElementById('uUser').value = u.username;
    document.getElementById('uPass').value = '';
    document.getElementById('uEmail').value = u.email||'';
    document.getElementById('uPhone').value = u.phone||'';
    document.getElementById('uRole').value = u.role;
    document.getElementById('userModal').classList.remove('hidden');
  } catch(e) { alert(e.message); }
}

async function saveUser() {
  const name = document.getElementById('uName').value.trim();
  const username = document.getElementById('uUser').value.trim();
  const password = document.getElementById('uPass').value;
  const email = document.getElementById('uEmail').value.trim();
  const phone = document.getElementById('uPhone').value.trim();
  const role = document.getElementById('uRole').value;
  const editId = document.getElementById('uEditId').value;
  const alertEl = document.getElementById('userAlert');
  if (!name || !username) { showAlert(alertEl, 'error', 'Vui lòng điền đủ thông tin!'); return; }
  try {
    if (editId) await apiCall('PUT', '/users/' + editId, { name, username, password, email, phone, role });
    else await apiCall('POST', '/auth/register', { name, username, password, email, phone, role });
    closeModal('userModal');
    navigateTo(currentUser.role === 'admin' ? 'users' : 'customers', '');
  } catch(e) { showAlert(alertEl, 'error', e.message); }
}

async function toggleUserStatus(id) {
  try {
    await apiCall('PATCH', '/users/' + id + '/toggle-status');
    navigateTo(currentUser.role === 'admin' ? 'users' : 'customers', '');
  } catch(e) { alert(e.message); }
}

function filterUsers(q) {
  document.querySelectorAll('#userTable tbody tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
  });
}

async function renderRevenue() {
  try {
    const data = await apiCall('GET', '/stats/revenue?period=week');
    const txs = await apiCall('GET', '/transactions');
    const max = Math.max(...data.revenue.map(d=>d.total), 1);
    return `
    <div class="stats-grid">
      <div class="stat-card" style="--card-color:var(--green)"><div class="stat-icon">💰</div>
        <div class="stat-value">${formatMoney(data.summary?.total_revenue||0)}</div>
        <div class="stat-label">TỔNG DOANH THU</div></div>
      <div class="stat-card" style="--card-color:var(--accent)"><div class="stat-icon">🧾</div>
        <div class="stat-value">${data.summary?.total_sessions||0}</div>
        <div class="stat-label">TỔNG GIAO DỊCH</div></div>
    </div>
    <div class="panel">
      <div class="panel-header"><span class="panel-title">📈 DOANH THU 7 NGÀY</span></div>
      <div class="panel-body">
        ${data.revenue.map(d => `
          <div class="chart-bar-row">
           <div class="chart-bar-label">${String(d.period).substring(5,10)}</div>
            <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${Math.round(d.total/max*100)}%">${formatMoney(d.total)}</div></div>
            <div class="chart-bar-val">${formatMoney(d.total)}</div>
          </div>`).join('') || '<p style="color:var(--text-dim)">Chưa có dữ liệu</p>'}
      </div>
    </div>
    <div class="panel">
      <div class="panel-header"><span class="panel-title">🧾 LỊCH SỬ GIAO DỊCH</span></div>
      <div class="panel-body" style="overflow-x:auto">
        <table><thead><tr><th>THỜI GIAN</th><th>KHÁCH</th><th>LOẠI</th><th>SỐ TIỀN</th></tr></thead>
          <tbody>${txs.slice(0,20).map(t=>`<tr>
            <td>${formatDate(t.created_at)}</td>
            <td>${t.customer_name||''}</td>
            <td><span class="badge ${t.type==='payment'?'badge-green':'badge-blue'}">${t.type==='payment'?'THANH TOÁN':'NẠP TIỀN'}</span></td>
            <td style="color:var(--green)">${formatMoney(t.amount)}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>`;
  } catch(e) { return `<div class="empty-state"><div class="empty-icon">❌</div><p>${e.message}</p></div>`; }
}

async function renderActivity() {
  try {
    const sessions = await apiCall('GET', '/sessions');
    return `<div class="panel">
      <div class="panel-header"><span class="panel-title">📋 LỊCH SỬ HOẠT ĐỘNG</span></div>
      <div class="panel-body" style="overflow-x:auto">
        <table><thead><tr><th>KHÁCH</th><th>MÁY</th><th>BẮT ĐẦU</th><th>KẾT THÚC</th><th>CHI PHÍ</th><th>TRẠNG THÁI</th></tr></thead>
          <tbody>${sessions.map(s => {
            return `<tr>
              <td>${s.customer_name}</td><td>${s.computer_name}</td>
              <td>${formatDate(s.start_time)}</td>
              <td>${s.end_time?formatDate(s.end_time):'<span style="color:var(--green)">Đang dùng</span>'}</td>
              <td style="color:var(--green)">${formatMoney(s.cost||0)}</td>
              <td><span class="badge ${s.status==='active'?'badge-green':'badge-blue'}">${s.status==='active'?'ĐANG DÙNG':'XONG'}</span></td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    </div>`;
  } catch(e) { return `<div class="empty-state"><div class="empty-icon">❌</div><p>${e.message}</p></div>`; }
}

async function renderOpenSession() {
  try {
    const [computers, users] = await Promise.all([
      apiCall('GET', '/computers?status=available'),
      apiCall('GET', '/users?role=customer')
    ]);
    const activeSessions = await apiCall('GET', '/sessions?status=active');
    return `
    <div class="panel">
      <div class="panel-header"><span class="panel-title">▶️ MỞ MÁY CHO KHÁCH</span></div>
      <div class="panel-body">
        <div id="openAlert" class="alert hidden"></div>
        <div class="form-row">
          <div class="form-group"><label>CHỌN KHÁCH HÀNG</label>
            <select id="sessionUser">
              <option value="">-- Chọn khách --</option>
              ${users.map(u=>`<option value="${u.id}">${u.name} (${u.username}) - ${formatMoney(u.balance)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>CHỌN MÁY (${computers.length} trống)</label>
            <select id="sessionPC">
              <option value="">-- Chọn máy --</option>
              ${computers.map(c=>`<option value="${c.id}">${c.name} - ${c.zone} (${formatMoney(c.price_per_hour)}/giờ)</option>`).join('')}
            </select>
          </div>
        </div>
        <button class="btn btn-success" style="padding:12px 28px" onclick="openSession()">▶ MỞ MÁY</button>
      </div>
    </div>
    <div class="panel">
      <div class="panel-header"><span class="panel-title">🔵 PHIÊN ĐANG HOẠT ĐỘNG</span></div>
      <div class="panel-body" style="overflow-x:auto">
        <table><thead><tr><th>KHÁCH</th><th>MÁY</th><th>BẮT ĐẦU</th><th>THỜI GIAN</th></tr></thead>
          <tbody>${activeSessions.map(s=>{
            const mins=Math.floor((Date.now()-new Date(s.start_time))/60000);
            return `<tr><td>${s.customer_name}</td><td>${s.computer_name}</td><td>${formatDate(s.start_time)}</td><td>${Math.floor(mins/60)}h ${mins%60}m</td></tr>`;
          }).join('')||'<tr><td colspan="4" style="text-align:center;color:var(--text-dim)">Không có phiên nào</td></tr>'}</tbody>
        </table>
      </div>
    </div>`;
  } catch(e) { return `<div class="empty-state"><div class="empty-icon">❌</div><p>${e.message}</p></div>`; }
}

async function openSession() {
  const userId = parseInt(document.getElementById('sessionUser').value);
  const pcId = parseInt(document.getElementById('sessionPC').value);
  const alertEl = document.getElementById('openAlert');
  if (!userId || !pcId) { showAlert(alertEl, 'error', 'Vui lòng chọn khách và máy!'); return; }
  try {
    await apiCall('POST', '/sessions/open', { user_id: userId, computer_id: pcId });
    showAlert(alertEl, 'success', 'Đã mở máy thành công!');
    setTimeout(() => navigateTo('open_session', 'Mở Máy Khách'), 1000);
  } catch(e) { showAlert(alertEl, 'error', e.message); }
}

async function renderCloseSession() {
  try {
    const sessions = await apiCall('GET', '/sessions?status=active');
    return `<div class="panel">
      <div class="panel-header"><span class="panel-title">⏹️ KẾT THÚC PHIÊN</span></div>
      <div class="panel-body" style="overflow-x:auto">
        ${sessions.length===0?'<div class="empty-state"><div class="empty-icon">✅</div><p>Không có phiên nào đang hoạt động</p></div>':
        `<table><thead><tr><th>KHÁCH</th><th>MÁY</th><th>THỜI GIAN</th><th>TẠM TÍNH</th><th>HÀNH ĐỘNG</th></tr></thead>
          <tbody>${sessions.map(s=>{
            const mins=Math.floor((Date.now()-new Date(s.start_time))/60000);
            const cost=Math.ceil(mins/60*(s.price_per_hour||5000));
            return `<tr>
              <td>${s.customer_name}</td><td>${s.computer_name}</td>
              <td>${Math.floor(mins/60)}h ${mins%60}m</td>
              <td style="color:var(--yellow)">${formatMoney(cost)}</td>
              <td><button class="btn btn-danger" onclick="closeSession(${s.id})">⏹ Kết Thúc</button></td>
            </tr>`;
          }).join('')}</tbody>
        </table>`}
      </div>
    </div>`;
  } catch(e) { return `<div class="empty-state"><div class="empty-icon">❌</div><p>${e.message}</p></div>`; }
}

async function closeSession(id) {
  if (!confirm('Kết thúc phiên này?')) return;
  try {
    const result = await apiCall('POST', '/sessions/'+id+'/close');
    alert(`✅ Kết thúc!\nChi phí: ${formatMoney(result.cost)}\nSố dư mới: ${formatMoney(result.new_balance)}`);
    navigateTo('close_session', 'Kết Thúc Phiên');
  } catch(e) { alert(e.message); }
}

async function renderDeposit() {
  try {
    const customers = await apiCall('GET', '/users?role=customer');
    const txs = await apiCall('GET', '/transactions?type=deposit');
    return `<div class="two-col">
      <div class="panel">
        <div class="panel-header"><span class="panel-title">💳 NẠP TIỀN</span></div>
        <div class="panel-body">
          <div id="depositAlert" class="alert hidden"></div>
          <div class="form-group"><label>KHÁCH HÀNG</label>
            <select id="depositUser" onchange="showUserBalance()">
              <option value="">-- Chọn khách --</option>
              ${customers.map(u=>`<option value="${u.id}" data-balance="${u.balance}">${u.name} (${u.username})</option>`).join('')}
            </select>
          </div>
          <div id="currentBalance" style="margin-bottom:16px;padding:12px;background:var(--bg-input);border-radius:8px;display:none">
            <div class="balance-label">SỐ DƯ HIỆN TẠI</div>
            <div class="balance-big" id="balanceAmt">0đ</div>
          </div>
          <div class="form-group"><label>SỐ TIỀN (VNĐ)</label><input type="number" id="depositAmount" placeholder="50000" min="10000" step="10000"/></div>
          <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
            ${[20000,50000,100000,200000,500000].map(v=>`<button class="btn btn-sm btn-accent" onclick="document.getElementById('depositAmount').value=${v}">${formatMoney(v)}</button>`).join('')}
          </div>
          <div class="form-group"><label>GHI CHÚ</label><input type="text" id="depositNote" placeholder="Nạp tiền mặt"/></div>
          <button class="btn-primary" onclick="doDeposit()">💳 NẠP TIỀN</button>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header"><span class="panel-title">📋 LỊCH SỬ NẠP GẦN ĐÂY</span></div>
        <div class="panel-body" style="overflow-x:auto">
          <table><thead><tr><th>THỜI GIAN</th><th>KHÁCH</th><th>SỐ TIỀN</th></tr></thead>
            <tbody>${txs.slice(0,10).map(t=>`<tr>
              <td>${formatDate(t.created_at)}</td>
              <td>${t.customer_name}</td>
              <td style="color:var(--green)">${formatMoney(t.amount)}</td>
            </tr>`).join('')}</tbody>
          </table>
        </div>
      </div>
    </div>`;
  } catch(e) { return `<div class="empty-state"><div class="empty-icon">❌</div><p>${e.message}</p></div>`; }
}

function showUserBalance() {
  const sel = document.getElementById('depositUser');
  const opt = sel.options[sel.selectedIndex];
  const el = document.getElementById('currentBalance');
  if (!sel.value) { el.style.display='none'; return; }
  document.getElementById('balanceAmt').textContent = formatMoney(opt.dataset.balance||0);
  el.style.display = 'block';
}

async function doDeposit() {
  const userId = parseInt(document.getElementById('depositUser').value);
  const amount = parseInt(document.getElementById('depositAmount').value);
  const note = document.getElementById('depositNote').value || 'Nạp tiền mặt';
  const alertEl = document.getElementById('depositAlert');
  if (!userId) { showAlert(alertEl, 'error', 'Chọn khách hàng!'); return; }
  if (!amount||amount<10000) { showAlert(alertEl, 'error', 'Số tiền tối thiểu 10,000đ!'); return; }
  try {
    await apiCall('POST', '/transactions/deposit', { user_id: userId, amount, note });
    showAlert(alertEl, 'success', `Đã nạp ${formatMoney(amount)} thành công!`);
    setTimeout(() => navigateTo('deposit', 'Nạp Tiền Khách'), 1500);
  } catch(e) { showAlert(alertEl, 'error', e.message); }
}

async function renderPcList() {
  try {
    const computers = await apiCall('GET', '/computers');
    return `<div class="panel">
      <div class="panel-header"><span class="panel-title">🖥️ DANH SÁCH MÁY TÍNH</span></div>
      <div class="panel-body"><div class="pc-grid">${computers.map(c=>renderPcCard(c,false)).join('')}</div></div>
    </div>`;
  } catch(e) { return `<div class="empty-state"><div class="empty-icon">❌</div><p>${e.message}</p></div>`; }
}

async function renderMySession() {
  try {
    const sessions = await apiCall('GET', '/sessions?status=active');
    const mySession = sessions.find(s => s.user_id === currentUser.id);
    if (!mySession) return `<div class="empty-state"><div class="empty-icon">💤</div><p>Bạn không có phiên nào đang hoạt động</p><p style="margin-top:8px;font-size:0.85rem">Vui lòng liên hệ nhân viên để mở máy</p></div>`;
    const mins = Math.floor((Date.now()-new Date(mySession.start_time))/60000);
    const cost = Math.ceil(mins/60*(mySession.price_per_hour||5000));
    return `
    <div class="session-panel">
      <div style="color:var(--text-dim);font-size:0.8rem;letter-spacing:2px;margin-bottom:8px">THỜI GIAN SỬ DỤNG</div>
      <div class="session-timer" id="liveTimer">${Math.floor(mins/60).toString().padStart(2,'0')}:${(mins%60).toString().padStart(2,'0')}:00</div>
      <div class="session-info">
        <div class="session-info-item"><div class="session-info-label">MÁY ĐANG DÙNG</div><div class="session-info-value" style="color:var(--accent)">${mySession.computer_name}</div></div>
        <div class="session-info-item"><div class="session-info-label">CHI PHÍ TẠM TÍNH</div><div class="session-info-value" style="color:var(--yellow)">${formatMoney(cost)}</div></div>
        <div class="session-info-item"><div class="session-info-label">KHU VỰC</div><div class="session-info-value">${mySession.zone||'N/A'}</div></div>
      </div>
    </div>`;
  } catch(e) { return `<div class="empty-state"><div class="empty-icon">❌</div><p>${e.message}</p></div>`; }
}

async function renderMyAccount() {
  try {
    const u = await apiCall('GET', '/users/' + currentUser.id);
    const txs = await apiCall('GET', '/transactions');
    return `<div class="two-col">
      <div class="panel">
        <div class="panel-header"><span class="panel-title">👤 TÀI KHOẢN</span></div>
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
          </table>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header"><span class="panel-title">💰 LỊCH SỬ GIAO DỊCH</span></div>
        <div class="panel-body" style="overflow-x:auto">
          <table><thead><tr><th>THỜI GIAN</th><th>LOẠI</th><th>SỐ TIỀN</th></tr></thead>
            <tbody>${txs.map(t=>`<tr>
              <td style="font-size:0.8rem">${formatDate(t.created_at)}</td>
              <td><span class="badge ${t.type==='deposit'?'badge-blue':'badge-green'}">${t.type==='deposit'?'NẠP':'THANH TOÁN'}</span></td>
              <td style="color:${t.type==='deposit'?'var(--green)':'var(--yellow)'}">${t.type==='deposit'?'+':'-'}${formatMoney(t.amount)}</td>
            </tr>`).join('')}</tbody>
          </table>
        </div>
      </div>
    </div>`;
  } catch(e) { return `<div class="empty-state"><div class="empty-icon">❌</div><p>${e.message}</p></div>`; }
}

async function renderMyHistory() {
  try {
    const sessions = await apiCall('GET', '/sessions');
    return `<div class="panel">
      <div class="panel-header"><span class="panel-title">📋 LỊCH SỬ SỬ DỤNG</span></div>
      <div class="panel-body" style="overflow-x:auto">
        <table><thead><tr><th>MÁY</th><th>BẮT ĐẦU</th><th>KẾT THÚC</th><th>CHI PHÍ</th><th>TRẠNG THÁI</th></tr></thead>
          <tbody>${sessions.map(s=>`<tr>
            <td>${s.computer_name}</td>
            <td>${formatDate(s.start_time)}</td>
            <td>${s.end_time?formatDate(s.end_time):'<span style="color:var(--green)">Đang dùng</span>'}</td>
            <td style="color:var(--yellow)">${formatMoney(s.cost||0)}</td>
            <td><span class="badge ${s.status==='active'?'badge-green':'badge-blue'}">${s.status==='active'?'ĐANG DÙNG':'XONG'}</span></td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>`;
  } catch(e) { return `<div class="empty-state"><div class="empty-icon">❌</div><p>${e.message}</p></div>`; }
}

// ============ UTILITIES ============
function showAlert(el, type, msg) {
  el.className = `alert ${type}`; el.textContent = msg; el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function formatMoney(n) { return new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(n||0); }
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
}
function startClock() {
  const days = ['CN','Th2','Th3','Th4','Th5','Th6','Th7'];
  function tick() {
    const now = new Date();
    const c = document.getElementById('clockDisplay');
    const d = document.getElementById('dateDisplay');
    if (c) c.textContent = now.toLocaleTimeString('vi-VN');
    if (d) d.textContent = `${days[now.getDay()]}, ${now.toLocaleDateString('vi-VN')}`;
  }
  tick(); setInterval(tick, 1000);
}
function afterRender(page) {
  if (page === 'my_session') {
    const timerEl = document.getElementById('liveTimer');
    if (timerEl) {
      const startTime = Date.now();
      setInterval(() => {
        const secs = Math.floor((Date.now()-startTime)/1000);
        const h=Math.floor(secs/3600), m=Math.floor((secs%3600)/60), s=secs%60;
        timerEl.textContent = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
      }, 1000);
    }
  }
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
  const savedToken = localStorage.getItem('cn_token');
  const savedUser = localStorage.getItem('cn_user');
  if (savedToken && savedUser) {
    try {
      authToken = savedToken;
      currentUser = JSON.parse(savedUser);
      showDashboard();
      return;
    } catch {}
  }
  document.getElementById('loginPassword').addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });
});
