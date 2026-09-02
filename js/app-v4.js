/**
 * =========================================================
 * Main App Controller v16
 * SVG icons + 64 pages + CG Gallery + PWA + Mobile + EventBridge
 * + Storyline + VirtualApp + Alliance + Inventory + Achievement + Fun
 * + Text Novel + World Notes + Mood Chart + Story Tree
 * + Free Exploration Map + Quest + Weather + Letter + Random Events + Badge Wall
 * + Scene System + NPC Behavior + Group Chat
 * + CodePatcher + SettingsHub + Assistant v3 + UI DIY v2 + SystemBuilder
 * + WorldviewEngine + FamilySystem + PoliticalSystem + ConspiracySystem + ButtonCustomizer
 * 2026-09-01 升级：
 * - callbacks 注册表补全所有模块
 * - navigate 加强 .page-view 切换逻辑
 * - 全局 Storage 操作加 try-catch
 * - 全局 DOM 操作加空值检查
 * - Emoji 替换为 SVG
 * =========================================================
 */

// 全局错误捕获，防止任何JS错误阻塞整个系统
window.addEventListener('error', function(e) {
  console.error('[全局错误]', e.message, 'at', e.filename, ':', e.lineno);
  if (window.App && App.toast) {
    App.toast('系统遇到小问题，但不影响其他功能', 'error', 3000);
  }
});
window.addEventListener('unhandledrejection', function(e) {
  console.error('[未处理Promise]', e.reason);
  if (window.App && App.toast) {
    App.toast('后台任务出错，已自动恢复', 'error', 3000);
  }
  e.preventDefault();
});

/** 5套内置主题定义 */
const BUILT_IN_THEMES = {
  ancient: {
    name: '古风墨境',
    colors: { bgBody: '#F5E6D3', bgCard: '#FFF8F0', textPrimary: '#2C1810', textSecondary: '#5C4033', primary: '#8B4513', primaryDark: '#5D3A1A', gold: '#C9A227', borderColor: '#D4C4A8', borderGold: '#C9A227' },
    fonts: { main: "'Noto Serif SC', serif", display: "'Noto Serif SC', serif" },
    radius: { sm: 8, md: 16, lg: 24 },
    shadows: { sm: '0 2px 8px rgba(44,24,16,0.08)', md: '0 4px 16px rgba(44,24,16,0.12)', lg: '0 8px 32px rgba(44,24,16,0.16)' }
  },
  modern: {
    name: '现代简约',
    colors: { bgBody: '#F7F8FA', bgCard: '#FFFFFF', textPrimary: '#1A1A2E', textSecondary: '#4A4A6A', primary: '#4A90E2', primaryDark: '#357ABD', gold: '#E8913A', borderColor: '#E8E8EC', borderGold: '#E8913A' },
    fonts: { main: "'Inter', 'PingFang SC', sans-serif", display: "'Inter', sans-serif" },
    radius: { sm: 6, md: 12, lg: 20 },
    shadows: { sm: '0 1px 4px rgba(0,0,0,0.06)', md: '0 2px 12px rgba(0,0,0,0.08)', lg: '0 4px 24px rgba(0,0,0,0.12)' }
  },
  scifi: {
    name: '科幻未来',
    colors: { bgBody: '#0A0E1A', bgCard: '#121830', textPrimary: '#E0E6F0', textSecondary: '#8A94A8', primary: '#00D4FF', primaryDark: '#00A8CC', gold: '#FFD700', borderColor: '#1E2A4A', borderGold: '#FFD700' },
    fonts: { main: "'Orbitron', 'Noto Sans SC', sans-serif", display: "'Orbitron', sans-serif" },
    radius: { sm: 4, md: 8, lg: 16 },
    shadows: { sm: '0 0 8px rgba(0,212,255,0.2)', md: '0 0 16px rgba(0,212,255,0.3)', lg: '0 0 32px rgba(0,212,255,0.4)' }
  },
  campus: {
    name: '校园清新',
    colors: { bgBody: '#F0F7F4', bgCard: '#FFFFFF', textPrimary: '#2D4A3E', textSecondary: '#5A7D6E', primary: '#5CB85C', primaryDark: '#449D44', gold: '#F0AD4E', borderColor: '#D0E4D8', borderGold: '#F0AD4E' },
    fonts: { main: "'Nunito', 'Noto Sans SC', sans-serif", display: "'Nunito', sans-serif" },
    radius: { sm: 12, md: 20, lg: 32 },
    shadows: { sm: '0 2px 8px rgba(92,184,92,0.1)', md: '0 4px 16px rgba(92,184,92,0.15)', lg: '0 8px 32px rgba(92,184,92,0.2)' }
  },
  dark: {
    name: '暗黑深邃',
    colors: { bgBody: '#0D0D0D', bgCard: '#1A1A1A', textPrimary: '#E8E8E8', textSecondary: '#8C8C8C', primary: '#BB86FC', primaryDark: '#9B5CDB', gold: '#03DAC6', borderColor: '#2A2A2A', borderGold: '#03DAC6' },
    fonts: { main: "'Noto Sans SC', sans-serif", display: "'Noto Sans SC', sans-serif" },
    radius: { sm: 8, md: 16, lg: 24 },
    shadows: { sm: '0 2px 8px rgba(0,0,0,0.3)', md: '0 4px 16px rgba(0,0,0,0.4)', lg: '0 8px 32px rgba(0,0,0,0.5)' }
  }
};

const App = {
  /** 页面导航回调注册表 { pageId: { onEnter: fn } } */
  callbacks: {},
  /** 主题注册表 { themeId: themeObject } */
  themes: {},
  /** 自定义主题存储键 */
  CUSTOM_THEMES_KEY: 'app_custom_themes_v1',
  NAV_ITEMS: [
    { iconSvg: 'icon-home', label: '首页', page: 'home' },
    { iconSvg: 'icon-game', label: '开始游戏', page: 'runtime' },
    { iconSvg: 'icon-api', label: 'API设置', page: 'api' },
    { iconSvg: 'icon-npc', label: '人物志', page: 'npc' },
    { iconSvg: 'icon-bg', label: '背景库', page: 'background' },
    { iconSvg: 'icon-music', label: '音乐', page: 'music' },
    { iconSvg: 'icon-map', label: '天下图', page: 'map' },
    { iconSvg: 'icon-status', label: '状态栏', page: 'status' },
    { iconSvg: 'icon-prompts', label: '提示词', page: 'prompts' },
    { iconSvg: 'icon-memory', label: '仿向量记忆', page: 'memory' },
    { iconSvg: 'icon-presets', label: '预设管理', page: 'presets' },
    { iconSvg: 'icon-regex', label: '正则引擎', page: 'regex' },
    { iconSvg: 'icon-worldbook', label: '世界书', page: 'worldbook' },
    { iconSvg: 'icon-worldbook', label: '世界选择', page: 'world-selector' },
    { iconSvg: 'icon-npc', label: '我的角色', page: 'hero' },
    { iconSvg: 'icon-import', label: '万能导入', page: 'import' },
    { iconSvg: 'icon-backup', label: '备份管理', page: 'backup' },
    { iconSvg: 'icon-ui', label: 'UI DIY', page: 'ui-diy' },
    { iconSvg: 'icon-baike', label: '百科助手', page: 'baike' },
    { iconSvg: 'icon-design', label: '设计套件', page: 'design-suite' },
    { iconSvg: 'icon-skills', label: '技能发现', page: 'skill-discovery' },
    { iconSvg: 'icon-creator', label: '功能创建', page: 'custom-creator' },
    { iconSvg: 'icon-mobile', label: '小手机', page: 'mobile-preview' },
    { iconSvg: 'icon-pwa', label: 'PWA应用', page: 'pwa' },
    { iconSvg: 'icon-cg', label: 'CG画廊', page: 'cg-gallery' },
    { iconSvg: 'icon-assistant', label: '墨境助手', page: 'assistant' },
    { iconSvg: 'icon-plugins', label: '插件', page: 'plugins' },
    { iconSvg: 'icon-notes', label: '记事册', page: 'notes' },
    { iconSvg: 'icon-relations', label: '关系网', page: 'relations' },
    { iconSvg: 'icon-game', label: '故事线', page: 'storyline' },
    { iconSvg: 'icon-home', label: '多线存档', page: 'storyline-manager' },
    { iconSvg: 'icon-memory', label: '聊天', page: 'chat' },
    { iconSvg: 'icon-worldbook', label: '论坛', page: 'forum' },
    { iconSvg: 'icon-prompts', label: '邮箱', page: 'mail' },
    { iconSvg: 'icon-skills', label: '设置', page: 'settings' },
    { iconSvg: 'icon-ui', label: '美化', page: 'beautify' },
    { iconSvg: 'icon-creator', label: '自定义App', page: 'custom' },
    { iconSvg: 'icon-cg', label: '成就', page: 'achievement' },
    { iconSvg: 'icon-bg', label: '背包', page: 'inventory' },
    { iconSvg: 'icon-map', label: '联盟', page: 'alliance' },
    { iconSvg: 'icon-baike', label: '趣味', page: 'fun' },
    { iconSvg: 'icon-game', label: '探索', page: 'juncheng' },
    { iconSvg: 'icon-worldbook', label: '时间线', page: 'timeline' },
    { iconSvg: 'icon-status', label: '事件', page: 'events' },
    { iconSvg: 'icon-backup', label: '存档管理', page: 'save-manager' },
    { iconSvg: 'icon-prompts', label: '章节编辑', page: 'chapter-editor' },
    { iconSvg: 'icon-memory', label: '世界记事', page: 'world-notes' },
    { iconSvg: 'icon-skills', label: '文本小说', page: 'text-novel' },
    { iconSvg: 'icon-api', label: '任务委托', page: 'quest' },
    { iconSvg: 'icon-bg', label: '天气时辰', page: 'weather' },
    { iconSvg: 'icon-npc', label: '飞鸽传书', page: 'letter' },
    { iconSvg: 'icon-relations', label: '随机事件', page: 'random-events' },
    { iconSvg: 'icon-cg', label: '徽章墙', page: 'badge-wall' },
    { iconSvg: 'icon-ui', label: '设置总控', page: 'settings-hub' },
    { iconSvg: 'icon-design', label: '自编程', page: 'code-patcher' },
    { iconSvg: 'icon-creator', label: '系统生成器', page: 'system-builder' },
    { iconSvg: 'icon-worldbook', label: '世界观', page: 'worldview' },
    { iconSvg: 'icon-npc', label: '家族', page: 'family' },
    { iconSvg: 'icon-map', label: '政治', page: 'political' },
    { iconSvg: 'icon-relations', label: '密谋', page: 'conspiracy' },
    { iconSvg: 'icon-ui', label: '按钮自定义', page: 'button-customizer' },
    { iconSvg: 'icon-map', label: '剧情分支树', page: 'storytree' }
  ],

  _modalStack: [],

  async init() {
    try { await Storage.initDB(); } catch(e) { console.warn('[App] Storage.initDB 失败:', e); }
    // Initialize event bridge for cross-module linkage
    if (window.EventBridge && typeof EventBridge.init === 'function') {
      try { EventBridge.init(); } catch(e) { console.warn(e); }
    }
    // Load user custom nav items
    this.loadCustomNavItems();
    this.renderSidebar();
    this.renderTopBar();
    this.renderBottomNav();
    this.bindEvents();
    this.initThemes();
    this.initModules();
    this.handleRoute();
    window.addEventListener('hashchange', () => this.handleRoute());
    if (window.DesignSuiteIntegration && DesignSuiteIntegration.restoreCustomCSS) {
      try { DesignSuiteIntegration.restoreCustomCSS(); } catch(e) { console.warn(e); }
    }
  },

  // ===== Theme System =====
  /** 初始化主题系统：注册内置主题 + 加载自定义主题 */
  initThemes() {
    // 注册5套内置主题
    Object.keys(BUILT_IN_THEMES).forEach(id => this.registerTheme(id, BUILT_IN_THEMES[id]));
    // 加载用户自定义主题
    let customs = {};
    try { customs = Storage.get(this.CUSTOM_THEMES_KEY, {}); } catch(e) { console.warn(e); }
    Object.keys(customs).forEach(id => { this.themes[id] = customs[id]; });
    // 应用保存的主题，默认古风墨境
    let saved = 'ancient';
    try { saved = Storage.get('currentThemeId', 'ancient'); } catch(e) { console.warn(e); }
    this.applyTheme(saved, true);
  },

  /** 注册单个主题 */
  registerTheme(id, theme) {
    this.themes[id] = theme;
  },

  /** 获取当前主题ID */
  getCurrentThemeId() {
    return this._currentThemeId || 'ancient';
  },

  /** 应用指定主题（静默模式用于初始化） */
  applyTheme(themeId, silent = false) {
    const theme = this.themes[themeId];
    if (!theme) { if (!silent) this.toast('主题不存在', 'error'); return; }
    this._currentThemeId = themeId;
    const body = document.body;
    if (!body) return;
    // 移除旧主题class
    body.classList.remove('theme-ancient', 'theme-modern', 'theme-scifi', 'theme-campus', 'theme-dark');
    // 添加新主题class
    body.classList.add('theme-' + themeId);
    // 更新CSS变量
    const root = document.documentElement;
    if (theme.colors) {
      root.style.setProperty('--bg-body', theme.colors.bgBody || '');
      root.style.setProperty('--bg-card', theme.colors.bgCard || '');
      root.style.setProperty('--text-primary', theme.colors.textPrimary || '');
      root.style.setProperty('--text-secondary', theme.colors.textSecondary || '');
      root.style.setProperty('--color-primary', theme.colors.primary || '');
      root.style.setProperty('--color-primary-dark', theme.colors.primaryDark || '');
      root.style.setProperty('--color-gold', theme.colors.gold || '');
      root.style.setProperty('--border-color', theme.colors.borderColor || '');
      root.style.setProperty('--border-gold', theme.colors.borderGold || '');
    }
    if (theme.fonts) {
      root.style.setProperty('--font-main', theme.fonts.main || '');
      root.style.setProperty('--font-display', theme.fonts.display || '');
    }
    if (theme.radius) {
      root.style.setProperty('--border-radius-sm', (theme.radius.sm || 8) + 'px');
      root.style.setProperty('--border-radius', (theme.radius.md || 12) + 'px');
      root.style.setProperty('--border-radius-lg', (theme.radius.lg || 16) + 'px');
    }
    if (theme.shadows) {
      root.style.setProperty('--shadow-sm', theme.shadows.sm || '');
      root.style.setProperty('--shadow-md', theme.shadows.md || '');
      root.style.setProperty('--shadow-lg', theme.shadows.lg || '');
    }
    // 存储当前主题
    try { Storage.set('currentThemeId', themeId); } catch(e) { console.warn(e); }
    this.updateThemeIcon(themeId);
    if (!silent) this.toast(`已切换至「${theme.name}」`, 'success');
    // 触发主题切换事件，供其他模块响应
    if (window.EventBridge && EventBridge.emit) {
      try { EventBridge.emit('theme-changed', { themeId, theme }); } catch(e) { console.warn(e); }
    }
  },

  /** 循环切换主题 */
  toggleTheme() {
    const ids = Object.keys(this.themes);
    if (!ids.length) return;
    const current = this.getCurrentThemeId();
    const idx = ids.indexOf(current);
    const nextId = ids[(idx + 1) % ids.length];
    this.applyTheme(nextId);
  },

  /** 更新主题切换按钮图标 */
  updateThemeIcon(themeId) {
    const el = document.getElementById('themeToggle');
    if (!el) return;
    const theme = this.themes[themeId];
    const name = theme ? theme.name : themeId;
    // 生成主题色标识圆圈SVG
    const colors = {
      ancient: '#C9A227', modern: '#4A90E2', scifi: '#00D4FF',
      campus: '#5CB85C', dark: '#BB86FC'
    };
    const color = colors[themeId] || '#888';
    el.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="${color}" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="${color}"/></svg>`;
    el.title = `当前主题：${name}（点击切换）`;
  },

  toast(msg, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    // Toast 通知全部使用 SVG 图标
    const svgs = {
      success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
      error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    toast.innerHTML = `<span style="display:flex;align-items:center;margin-right:6px;">${svgs[type] || ''}</span><span>${msg}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => { if(toast.parentNode) toast.parentNode.removeChild(toast); }, 300); }, duration);
  },

  openModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.add('show'); this._modalStack.push(id); }
  },

  closeModal(id) {
    if (id) {
      const m = document.getElementById(id);
      if (m) m.classList.remove('show');
    } else {
      const last = this._modalStack.pop();
      if (last) {
        const m = document.getElementById(last);
        if (m) m.classList.remove('show');
      }
    }
  },

  showModal(title, content, large = false) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay show';
    overlay.id = 'dynamicModal_' + Date.now();
    // 关闭按钮从 emoji 改为 SVG
    overlay.innerHTML = `
      <div class="modal ${large ? 'xl' : ''}" style="animation:slideUp 0.3s ease;">
        <div class="modal-header"><h3>${title}</h3><button class="btn-icon" onclick="App.closeModal('${overlay.id}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button></div>
        <div class="modal-body">${content}</div>
      </div>
    `;
    document.body.appendChild(overlay);
    this._modalStack.push(overlay.id);
    return overlay.id;
  },

  async exportData() {
    try {
      let json = '{"version":"4.0","exportedAt":"' + new Date().toISOString() + '","localStorage":{}}';
      if (window.BackupManager && BackupManager.exportAll) {
        try { json = await BackupManager.exportAll(); } catch(e) { console.warn(e); }
      }
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `墨境备份_${new Date().toISOString().slice(0,10)}.json`; a.click();
      URL.revokeObjectURL(url);
      this.toast('数据已导出', 'success');
    } catch (e) { this.toast('导出失败: ' + e.message, 'error'); }
  },

  async importData() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.localStorage) {
          for (const [k, v] of Object.entries(data.localStorage)) {
            try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch(e) { console.warn(e); }
          }
        }
        if (data.indexedDB) {
          if (data.indexedDB.images) for (const i of data.indexedDB.images) { try { await Storage.dbPut('images', i); } catch(e) { console.warn(e); } }
          if (data.indexedDB.audio) for (const a of data.indexedDB.audio) { try { await Storage.dbPut('audio', a); } catch(e) { console.warn(e); } }
          if (data.indexedDB.memories) for (const m of data.indexedDB.memories) { try { await Storage.dbPut('memories', m); } catch(e) { console.warn(e); } }
          if (data.indexedDB.plugins) for (const p of data.indexedDB.plugins) { try { await Storage.dbPut('plugins', p); } catch(e) { console.warn(e); } }
        }
        this.toast('数据已导入，刷新生效', 'success');
        setTimeout(() => location.reload(), 1500);
      } catch (e) { this.toast('导入失败: ' + e.message, 'error'); }
    };
    input.click();
  }
};

// ===== 页面导航与路由系统 =====
App.navigate = function(pageId) {
  location.hash = pageId;
  // hashchange 事件会自动触发 handleRoute，无需重复调用
};

App.handleRoute = function() {
  const pageId = location.hash.replace('#', '') || 'home';
  console.log('[App] 路由到:', pageId);
  // 隐藏所有页面
  document.querySelectorAll('.page-view').forEach(p => {
    p.classList.remove('active');
    p.style.display = 'none';
  });
  // 显示目标页面
  const target = document.getElementById('page-' + pageId);
  if (target) {
    target.style.display = 'block';
    target.classList.add('active');
  } else {
    console.warn('[App] 页面容器不存在:', 'page-' + pageId);
    const homePage = document.getElementById('page-home');
    if (homePage) { homePage.style.display = 'block'; homePage.classList.add('active'); }
  }
  // 触发页面回调
  const cb = this.callbacks[pageId];
  if (cb && typeof cb.onEnter === 'function') {
    try { cb.onEnter(); } catch(e) { console.warn('[App] 页面回调失败:', pageId, e); }
  }
  this.currentPage = pageId;
};

App.initModules = function() {
  const modules = [
    'HomePage','NovelRuntime','APISettings','NPCManager','BackgroundLibrary',
    'MusicManager','MapSystem','StatusBar','PromptSystem','MemorySystem',
    'PresetManager','RegexEngine','WorldBook','CGGallery','StoryTreeEditor',
    'SettingsHub','InventorySystem','QuestSystem','WeatherSystem','LetterSystem',
    'Notes','Relations','AchievementSystem','Timeline','Events','SaveManager',
    'ChapterEditor','TextNovel','WorldNotes','SceneSystem','NPCBehavior',
    'CodePatcher'
  ];
  modules.forEach(modName => {
    const mod = window[modName] || window[modName.replace(/System$/, '')];
    if (mod && typeof mod.init === 'function') {
      try { mod.init(); } catch(e) { console.warn('[App]', modName, 'init失败:', e.message); }
    }
  });
  // 注册回调 — 覆盖所有 NAV_ITEMS 中定义的页面
  const pageMap = {
    'home': 'HomePage', 'runtime': 'NovelRuntime', 'api': 'APISettings',
    'npc': 'NPCManager', 'background': 'BackgroundLibrary', 'music': 'MusicManager',
    'map': 'MapSystem', 'status': 'StatusBar', 'prompts': 'PromptSystem',
    'memory': 'MemorySystem', 'presets': 'PresetManager', 'regex': 'RegexEngine',
    'worldbook': 'WorldBook', 'cg-gallery': 'CGGallery', 'storytree': 'StoryTreeEditor',
    'settings-hub': 'SettingsHub', 'inventory': 'InventorySystem',
    'quest': 'QuestSystem', 'weather': 'WeatherSystem', 'letter': 'LetterSystem',
    'notes': 'Notes', 'relations': 'Relations', 'achievement': 'AchievementSystem',
    'timeline': 'Timeline', 'events': 'Events', 'save-manager': 'SaveManager',
    'chapter-editor': 'ChapterEditor', 'text-novel': 'TextNovel',
    'world-notes': 'WorldNotes', 'scene': 'SceneSystem', 'npc-behavior': 'NPCBehavior',
    'code-patcher': 'CodePatcher',
    // 补充缺失的页面映射
    'world-selector': 'WorldSelector', 'hero': 'HeroSystem',
    'import': 'ImportManager', 'backup': 'BackupManager',
    'ui-diy': 'UIDIY', 'baike': 'BaikeIntegration',
    'design-suite': 'DesignSuite', 'skill-discovery': 'SkillDiscovery',
    'custom-creator': 'CustomCreator', 'mobile-preview': 'MobilePreview',
    'pwa': 'PWASystem', 'assistant': 'Assistant',
    'plugins': 'PluginManager', 'chat': 'AppChat',
    'forum': 'AppForum', 'mail': 'AppMail',
    'settings': 'AppSettings', 'beautify': 'AppBeautify',
    'custom': 'AppCustom', 'alliance': 'AllianceSystem',
    'fun': 'FunFeatures', 'juncheng': 'Portal',
    'storyline': 'Storyline', 'storyline-manager': 'StorylineManager',
    'random-events': 'RandomEvents', 'badge-wall': 'BadgeWall',
    'system-builder': 'SystemBuilder', 'worldview': 'WorldviewEngine',
    'family': 'FamilySystem', 'political': 'PoliticalSystem',
    'conspiracy': 'ConspiracySystem', 'button-customizer': 'ButtonCustomizer'
  };
  Object.keys(pageMap).forEach(pageId => {
    const modName = pageMap[pageId];
    const mod = window[modName];
    if (mod && typeof mod.renderPage === 'function') {
      this.callbacks[pageId] = { onEnter: () => mod.renderPage() };
    }
  });
  console.log('[App] 已注册', Object.keys(this.callbacks).length, '个页面回调');
};

App.renderSidebar = function() {
  // 移动端侧边栏不再渲染（由 page-frame 统一顶部条替代）
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.style.display = 'none';
};

App.renderTopBar = function() {
  // 由 page-frame.js 统一处理顶部条
};

App.renderBottomNav = function() {
  // 由 page-frame.js 统一处理底部导航
};

App.bindEvents = function() {
  // 核心事件已由 page-frame.js 处理
  // 键盘ESC关闭模态框
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { this.closeModal(); }
  });
};

App.loadCustomNavItems = function() {
  // 用户自定义导航（暂不使用侧边栏）
};

// ===== DOM Ready =====
document.addEventListener('DOMContentLoaded', () => {
  let savedMask = null;
  let gameLaunched = false;
  try { savedMask = Storage.get('userMask', null); } catch(e) { console.warn(e); }
  try { gameLaunched = Storage.get('gameLaunched', false); } catch(e) { console.warn(e); }
  if (savedMask && gameLaunched) {
    const launcher = document.getElementById('gameLauncher');
    if (launcher) launcher.classList.add('hidden');
    const mainApp = document.getElementById('mainApp');
    if (mainApp) mainApp.style.display = 'flex';
    App.init();
  } else {
    if (window.Launcher && typeof Launcher.init === 'function') {
      try { Launcher.init(); } catch(e) { console.warn(e); }
    }
  }
});
