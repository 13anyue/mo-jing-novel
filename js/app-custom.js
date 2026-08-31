/**
 * =========================================================
 * AppCustom v6 — 自定义App
 * 模块名：AppCustom
 * 功能：用户创建自己的虚拟App（名称、图标、颜色、功能模块）
 * =========================================================
 */
const AppCustom = {
  init() { this.renderPage(); },
  onEnter() { this.renderCustomInterface(); },

  renderPage() {
    const page = document.getElementById('page-custom');
    if (!page) return;
    page.innerHTML = `<div id="customAppInterface" style="padding:var(--space-lg);"></div>`;
    this.renderCustomInterface();
  },

  renderCustomInterface() {
    const c = document.getElementById('customAppInterface');
    if (!c) return;
    const apps = Storage.get('customApps_v6', []);
    c.innerHTML = `
      <div style="max-width:900px;margin:0 auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);">
          <h3 style="font-size:20px;">🛠️ 我的应用</h3>
          <button class="btn btn-primary" onclick="AppCustom.createApp()">➕ 创建新App</button>
        </div>
        <div id="customAppList" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;"></div>
      </div>
    `;
    this.renderList();
  },

  renderList() {
    const c = document.getElementById('customAppList');
    if (!c) return;
    const apps = Storage.get('customApps_v6', []);
    if (apps.length === 0) {
      c.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-icon">🛠️</div>
          <p>还没有自定义App</p>
          <p style="font-size:12px;color:var(--text-muted);">点击上方按钮创建一个吧！</p>
        </div>
      `;
      return;
    }
    c.innerHTML = apps.map(app => `
      <div class="card" style="padding:var(--space-md);">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <div style="width:56px;height:56px;border-radius:16px;background:${app.color};display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;text-shadow:0 1px 2px rgba(0,0,0,0.3);">
            ${app.icon || app.name[0]}
          </div>
          <div style="flex:1;min-width:0;">
            <h4 style="font-size:16px;margin-bottom:2px;">${app.name}</h4>
            <p style="font-size:12px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${app.desc || '暂无描述'}</p>
          </div>
        </div>
        <div style="display:flex;gap:6px;justify-content:flex-end;">
          <button class="btn btn-sm btn-secondary" onclick="AppCustom.editApp('${app.id}')">✏️ 编辑</button>
          <button class="btn btn-sm btn-danger" onclick="AppCustom.deleteApp('${app.id}')">🗑️ 删除</button>
        </div>
      </div>
    `).join('');
  },

  createApp() {
    const name = prompt('App名称：'); if (!name) return;
    const desc = prompt('描述：', '');
    const color = prompt('主题色（如 #607D8B）：', '#607D8B');
    const icon = prompt('图标（emoji）：', '🔧');
    const apps = Storage.get('customApps_v6', []);
    apps.push({ id: 'app_' + Date.now(), name, desc, color, icon, createdAt: Date.now(), modules: [] });
    Storage.set('customApps_v6', apps);
    this.renderList();
    App.toast(`App「${name}」已创建`, 'success');
  },

  editApp(id) {
    const apps = Storage.get('customApps_v6', []);
    const app = apps.find(a => a.id === id); if (!app) return;
    const name = prompt('名称：', app.name); if (!name) return;
    app.name = name;
    app.desc = prompt('描述：', app.desc || '') || '';
    app.color = prompt('主题色：', app.color || '#607D8B') || '#607D8B';
    app.icon = prompt('图标：', app.icon || '🔧') || '🔧';
    Storage.set('customApps_v6', apps);
    this.renderList();
    App.toast('已更新', 'success');
  },

  deleteApp(id) {
    if (!confirm('删除此App？')) return;
    Storage.set('customApps_v6', Storage.get('customApps_v6', []).filter(a => a.id !== id));
    this.renderList();
  }
};
