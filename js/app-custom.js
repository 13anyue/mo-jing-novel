/**
 * =========================================================
 * AppCustom vv7 自定义App
 * 模块名：AppCustom
 * 功能：用户创建自己的虚拟App（名称、图标、颜色、功能模块）
 * =========================================================
 */
const AppCustom = {
    // 初始化模块入口
  init() {
    // v7: 外部模块依赖检查
    if (typeof Storage === 'undefined') { console.warn('[v7] Storage模块未加载'); return; }
    this.renderPage(); },
    // 页面进入时调用
  onEnter() {
    this.renderCustomInterface(); },

    // 渲染页面主结构
  renderPage() {
    const page = document.getElementById('page-custom');
    if (!page) return;
    page.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
      <div id="customAppInterface" style="padding:var(--space-lg);"></div>`;
    this.renderCustomInterface();
  },

  renderCustomInterface() {
    const c = document.getElementById('customAppInterface');
    if (!c) return;
    const apps = Storage.get('customApps_v6', []);
    c.innerHTML = `
      <div style="max-width:900px;margin:0 auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);">
          <h3 style="font-size:20px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg> 我的应用</h3>
          <button class="btn btn-primary" onclick="AppCustom.createApp()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 创建新App</button>
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
          <div class="empty-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg></div>
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
          <button class="btn btn-sm btn-secondary" onclick="AppCustom.editApp('${app.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> 编辑</button>
          <button class="btn btn-sm btn-danger" onclick="AppCustom.deleteApp('${app.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg> 删除</button>
        </div>
      </div>
    `).join('');
  },

  createApp() {
    const name = prompt('App名称：'); if (!name) return;
    const desc = prompt('描述：', '');
    const color = prompt('主题色（如 #607D8B）：', '#607D8B');
    const icon = prompt('图标（emoji）：', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>');
    const apps = Storage.get('customApps_v6', []);
    apps.push({ id: 'app_' + Date.now(), name, desc, color, icon, createdAt: Date.now(), modules: [] });
    try { Storage.set('customApps_v6', apps); } catch(e) { console.warn('[v7] Storage.set失败:', e); }
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
    app.icon = prompt('图标：', app.icon || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>') || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>';
    try { Storage.set('customApps_v6', apps); } catch(e) { console.warn('[v7] Storage.set失败:', e); }
    this.renderList();
    App.toast('已更新', 'success');
  },

  deleteApp(id) {
    if (!confirm('删除此App？')) return;
    try { Storage.set('customApps_v6', Storage.get('customApps_v6', []).filter(a => a.id !== id)); } catch(e) { console.warn('[v7] Storage.set失败:', e); }
    this.renderList();
  }
};
