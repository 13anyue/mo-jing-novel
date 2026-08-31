/**
 * =========================================================
 * Virtual App Platform v6 — 虚拟App系统
 * 聊天(微信样式)、论坛、邮箱、设置、美化、自定义App
 * 每个App都是独立的"软件"，可在虚拟桌面上打开
 * =========================================================
 */
const VirtualAppPlatform = {
  // Built-in apps
  BUILT_IN_APPS: [
    { id: 'chat', name: '消息', icon: 'icon-chat', desc: '与NPC聊天', color: '#07C160' },
    { id: 'forum', name: '论坛', icon: 'icon-forum', desc: '世界讨论区', color: '#4A90C2' },
    { id: 'mail', name: '邮箱', icon: 'icon-mail', desc: '收发邮件', color: '#FF6B35' },
    { id: 'settings', name: '设置', icon: 'icon-settings', desc: '系统设置', color: '#666' },
    { id: 'beautify', name: '美化', icon: 'icon-paint', desc: '主题美化', color: '#E91E63' },
    { id: 'custom', name: '我的App', icon: 'icon-apps', desc: '自定义应用', color: '#9C27B0' }
  ],

  _currentApp: null,
  _apps: [],

  init() { this.loadApps(); this.renderPage(); },
  onEnter() { this.renderDesktop(); },

  loadApps() {
    const saved = Storage.get('virtualApps_v6', []);
    this._apps = [...this.BUILT_IN_APPS, ...saved];
  },
  saveApps() {
    const custom = this._apps.filter(a => !this.BUILT_IN_APPS.find(b => b.id === a.id));
    Storage.set('virtualApps_v6', custom);
  },

  renderPage() {
    const page = document.getElementById('page-virtual-apps');
    if (!page) return;
    page.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:8px;">
        <h2 class="section-title">📱 虚拟应用平台</h2>
        <button class="btn btn-primary" onclick="VirtualAppPlatform.createCustomApp()">➕ 新建App</button>
      </div>
      <div id="appDesktop" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(100px, 1fr));gap:24px;padding:var(--space-md);"></div>
      <div id="appWindow" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;z-index:1000;background:var(--bg-body);">
        <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--bg-sidebar);border-bottom:1px solid var(--border-color);">
          <button class="btn-icon" onclick="VirtualAppPlatform.closeApp()" style="width:32px;height:32px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          </button>
          <span id="appWindowTitle" style="font-weight:700;font-size:16px;">App</span>
        </div>
        <div id="appWindowContent" style="height:calc(100% - 57px);overflow-y:auto;"></div>
      </div>
    `;
    this.renderDesktop();
  },

  renderDesktop() {
    const desktop = document.getElementById('appDesktop');
    if (!desktop) return;
    desktop.innerHTML = this._apps.map(app => `
      <div style="text-align:center;cursor:pointer;padding:16px 8px;border-radius:var(--border-radius);transition:transform 0.2s;" 
           onmouseenter="this.style.transform='scale(1.05)'" onmouseleave="this.style.transform=''"
           onclick="VirtualAppPlatform.openApp('${app.id}')">
        <div style="width:60px;height:60px;margin:0 auto 8px;border-radius:16px;background:${app.color};display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;box-shadow:0 4px 12px ${app.color}40;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><use href="#${app.icon}"/></svg>
        </div>
        <div style="font-size:13px;color:var(--text-primary);font-weight:500;">${app.name}</div>
      </div>
    `).join('');
  },

  openApp(appId) {
    const app = this._apps.find(a => a.id === appId);
    if (!app) return;
    this._currentApp = appId;
    document.getElementById('appWindowTitle').textContent = app.name;
    document.getElementById('appWindow').style.display = 'block';

    const content = document.getElementById('appWindowContent');
    switch (appId) {
      case 'chat': AppChat?.renderChatInterface(content); break;
      case 'forum': AppForum?.renderForumInterface(content); break;
      case 'mail': AppMail?.renderMailInterface(content); break;
      case 'settings': AppSettings?.renderSettingsInterface(content); break;
      case 'beautify': AppBeautify?.renderBeautifyInterface(content); break;
      case 'custom': AppCustom?.renderCustomInterface(content); break;
      default:
        // Custom app
        const custom = Storage.get('customApp_' + appId, null);
        if (custom?.html) content.innerHTML = custom.html;
        else content.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted);">自定义App内容</div>';
    }
  },

  closeApp() {
    document.getElementById('appWindow').style.display = 'none';
    this._currentApp = null;
  },

  createCustomApp() {
    const name = prompt('App名称：'); if (!name) return;
    const id = 'custom_app_' + Date.now();
    this._apps.push({ id, name, icon: 'icon-apps', desc: '自定义App', color: '#607D8B' });
    this.saveApps();
    this.renderDesktop();
    App.toast(`App「${name}」已创建`, 'success');
  }
};
