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

const App = {
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
    { iconSvg: 'icon-game', label: '君成录', page: 'juncheng' },
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
    { iconSvg: 'icon-ui', label: '按钮自定义', page: 'button-customizer' }
  ],

  _modalStack: [],

  async init() {
    await Storage.initDB();
    // Initialize event bridge for cross-module linkage
    if (window.EventBridge) EventBridge.init();
    // Load user custom nav items
    this.loadCustomNavItems();
    this.renderSidebar();
    this.renderTopBar();
    this.bindEvents();
    this.initModules();
    this.handleRoute();
    window.addEventListener('hashchange', () => this.handleRoute());
    if (DesignSuiteIntegration?.restoreCustomCSS) DesignSuiteIntegration.restoreCustomCSS();
  },

  // ===== Dynamic Navigation =====
  loadCustomNavItems() {
    const custom = Storage.get('appCustomNavItems', []);
    for (const item of custom) {
      if (!this.NAV_ITEMS.find(n => n.page === item.page)) {
        this.NAV_ITEMS.push(item);
      }
    }
  },

  addNavItem(item) {
    if (!this.NAV_ITEMS.find(n => n.page === item.page)) {
      this.NAV_ITEMS.push(item);
      const custom = Storage.get('appCustomNavItems', []);
      custom.push(item);
      Storage.set('appCustomNavItems', custom);
      this.renderSidebar();
    }
  },

    removeNavItem(pageId) {
      const idx = this.NAV_ITEMS.findIndex(n => n.page === pageId);
      if (idx !== -1 && idx >= 39) { // Protect built-in items (v6 has 39 items)
      this.NAV_ITEMS.splice(idx, 1);
      const custom = Storage.get('appCustomNavItems', []);
      Storage.set('appCustomNavItems', custom.filter(c => c.page !== pageId));
      this.renderSidebar();
    }
  },

  renderSidebar() {
    const nav = document.getElementById('sidebarNav');
    if (!nav) return;
    nav.innerHTML = this.NAV_ITEMS.map(item => `
      <div class="nav-item" data-page="${item.page}" onclick="App.navigate('${item.page}')">
        <span class="nav-icon">
          <svg width="18" height="18"><use href="#${item.iconSvg}"/></svg>
        </span>
        <span>${item.label}</span>
      </div>
    `).join('');
  },

  renderTopBar() {
    const bar = document.getElementById('topBar');
    if (!bar) return;
    const currentPage = this.NAV_ITEMS.find(n => n.page === this._currentPage);
    const showBack = this._currentPage && this._currentPage !== 'home';
    bar.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;">
        ${showBack ? `<button class="btn-icon mobile-back-btn" onclick="App.navigate('home')">←</button>` : ''}
        <button class="menu-toggle" onclick="App.toggleSidebar()">☰</button>
        <span class="page-title" id="pageTitle">${currentPage?.label || '墨境'}</span>
      </div>
      <div class="top-actions">
        <button class="btn-icon" onclick="BackupManager.createBackup()" title="备份">💾</button>
        <button class="btn-icon" onclick="App.exportData()" title="导出">📥</button>
        <button class="btn-icon" onclick="App.importData()" title="导入">📤</button>
        <button class="btn-icon" onclick="App.toggleTheme()" title="切换主题" id="themeToggle">🌙</button>
        <button class="btn-icon" onclick="Launcher.enterMainApp();location.reload()" title="重启">↺</button>
      </div>
    `;
  },

  bindEvents() {
    document.getElementById('sidebarBackdrop')?.addEventListener('click', () => this.toggleSidebar(false));
    const savedTheme = Storage.get('theme', 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcon(savedTheme);
    // Listen for custom module registration via EventBridge
    if (window.EventBridge) {
      EventBridge.on('app', (e) => {
        if (e.type === 'nav_refresh') {
          this.loadCustomNavItems();
          this.renderSidebar();
        }
      }, 'App');
    }
  },

  initModules() {
    const mods = [
      APISettings, NPCManager, BackgroundLibrary, MusicManager,
      MapSystem, StatusBar, PromptSystem, MemorySystem,
      PresetManager, RegexEngine, NovelRuntime, WorldBook,
      ImportManager, BackupManager, UIDIY, BaikeIntegration,
      DesignSuiteIntegration, SkillDiscovery, CustomCreator,
      MobilePreview, PWASystem, CGGallery,
      Assistant, Plugins, Notes, Relations, HomePage,
      StorylineSystem, StorylineManager, AppChat, AppForum, AppMail,
      AppSettings, AppBeautify, AppCustom,
      AchievementSystem, InventorySystem, AllianceSystem,
      FunFeatures, JunChengStyle,
      TimelineSystem, EventSystem, SaveManager, ChapterEditor, WorldNotes,
      TextNovel,
      QuestSystem, WeatherSystem, LetterSystem, RandomEvents, BadgeWall,
      SceneSystem, NPCBehavior, GroupChat,
      SettingsHub, CodePatcher, SystemBuilder,
      WorldviewEngine, FamilySystem, PoliticalSystem, ConspiracySystem, ButtonCustomizer
    ];
    mods.forEach(mod => {
      try { if (mod && typeof mod.init === 'function') mod.init(); }
      catch (e) { console.error('Init error:', mod?.constructor?.name, e); }
    });
  },

  handleRoute() {
    const hash = window.location.hash.slice(1) || 'home';
    // 场景路由特殊处理：#scene-location-xxx 不走普通 navigate
    if (hash.startsWith('scene-location-')) {
      if (window.SceneSystem && typeof SceneSystem.onEnter === 'function') {
        SceneSystem.onEnter();
      }
      return;
    }
    this.navigate(hash);
  },

  navigate(pageId) {
    try {
      // 若正在场景内，先清理场景覆盖层
      if (window.SceneSystem && typeof SceneSystem.cleanup === 'function' && !pageId.startsWith('scene-')) {
        SceneSystem.cleanup();
      }
      this._currentPage = pageId;
      document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
      const target = document.getElementById('page-' + pageId);
      if (target) { target.classList.add('active'); }
      else { document.getElementById('page-home')?.classList.add('active'); pageId = 'home'; }
      document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.page === pageId));
      const navItem = this.NAV_ITEMS.find(i => i.page === pageId);
      const titleEl = document.getElementById('pageTitle');
      if (titleEl && navItem) titleEl.textContent = navItem.label;
      this.renderTopBar();
      this.toggleSidebar(false);
      this.onPageEnter(pageId);
    } catch(e) {
      console.error('[导航错误]', e);
      App.toast('页面加载失败，请重试', 'error');
    }
  },

  onPageEnter(pageId) {
    const callbacks = {
      home: HomePage, api: APISettings, npc: NPCManager,
      background: BackgroundLibrary, music: MusicManager,
      map: MapSystem, status: StatusBar, prompts: PromptSystem,
      memory: MemorySystem, presets: PresetManager,
      regex: RegexEngine, runtime: NovelRuntime,
      worldbook: WorldBook, assistant: Assistant,
      plugins: Plugins, notes: Notes, relations: Relations,
      'import': ImportManager, backup: BackupManager,
      'ui-diy': UIDIY, baike: BaikeIntegration,
      'design-suite': DesignSuiteIntegration,
      'skill-discovery': SkillDiscovery,
      'custom-creator': CustomCreator,
      'mobile-preview': MobilePreview,
      'pwa': PWASystem,
      'cg-gallery': CGGallery,
      storyline: StorylineSystem, chat: AppChat, forum: AppForum,
      mail: AppMail, settings: AppSettings, beautify: AppBeautify,
      custom: AppCustom, achievement: AchievementSystem,
      inventory: InventorySystem, alliance: AllianceSystem,
      fun: FunFeatures, juncheng: JunChengStyle,
      timeline: TimelineSystem, events: EventSystem,
      'save-manager': SaveManager, 'chapter-editor': ChapterEditor,
      'storyline-manager': StorylineManager,
      'world-notes': WorldNotes,
      'text-novel': TextNovel,
      'quest': QuestSystem, 'weather': WeatherSystem, 'letter': LetterSystem,
      'random-events': RandomEvents, 'badge-wall': BadgeWall,
      'scene': SceneSystem, 'npc-behavior': NPCBehavior,
      'settings-hub': SettingsHub, 'code-patcher': CodePatcher,
      'system-builder': SystemBuilder,
      'worldview': WorldviewEngine, 'family': FamilySystem,
      'political': PoliticalSystem, 'conspiracy': ConspiracySystem,
      'button-customizer': ButtonCustomizer
    };
    const cb = callbacks[pageId];
    if (!cb) { App.toast('该功能模块暂未就绪', 'info'); return; }
    if (cb && cb.onEnter) { try { cb.onEnter(); } catch (e) { console.warn('onEnter error:', e); } }
  },

  toggleSidebar(force) {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (!sidebar) return;
    const open = force !== undefined ? force : !sidebar.classList.contains('open');
    sidebar.classList.toggle('open', open);
    if (backdrop) backdrop.classList.toggle('show', open);
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    Storage.set('theme', next);
    this.updateThemeIcon(next);
  },

  updateThemeIcon(t) { const el = document.getElementById('themeToggle'); if (el) el.textContent = t === 'dark' ? '☀️' : '🌙'; },

  toast(msg, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✓', error: '✗', info: 'ℹ' };
    toast.innerHTML = `<span>${icons[type] || ''}</span><span>${msg}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, duration);
  },

  openModal(id) { const m = document.getElementById(id); if (m) { m.classList.add('show'); this._modalStack.push(id); } },
  closeModal(id) {
    if (id) { const m = document.getElementById(id); if (m) m.classList.remove('show'); }
    else { const last = this._modalStack.pop(); if (last) { const m = document.getElementById(last); if (m) m.classList.remove('show'); } }
  },

  showModal(title, content, large = false) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay show';
    overlay.id = 'dynamicModal_' + Date.now();
    overlay.innerHTML = `
      <div class="modal ${large ? 'xl' : ''}" style="animation:slideUp 0.3s ease;">
        <div class="modal-header"><h3>${title}</h3><button class="btn-icon" onclick="App.closeModal('${overlay.id}')">✕</button></div>
        <div class="modal-body">${content}</div>
      </div>
    `;
    document.body.appendChild(overlay);
    this._modalStack.push(overlay.id);
    return overlay.id;
  },

  async exportData() {
    try {
      const json = await BackupManager.exportAll?.() || JSON.stringify({ version: '4.0', exportedAt: new Date().toISOString(), localStorage: {} });
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
            localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
          }
        }
        if (data.indexedDB) {
          if (data.indexedDB.images) for (const i of data.indexedDB.images) await Storage.dbPut('images', i);
          if (data.indexedDB.audio) for (const a of data.indexedDB.audio) await Storage.dbPut('audio', a);
          if (data.indexedDB.memories) for (const m of data.indexedDB.memories) await Storage.dbPut('memories', m);
          if (data.indexedDB.plugins) for (const p of data.indexedDB.plugins) await Storage.dbPut('plugins', p);
        }
        this.toast('数据已导入，刷新生效', 'success');
        setTimeout(() => location.reload(), 1500);
      } catch (e) { this.toast('导入失败: ' + e.message, 'error'); }
    };
    input.click();
  }
};

// DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const savedMask = Storage.get('userMask', null);
  if (savedMask && Storage.get('gameLaunched', false)) {
    document.getElementById('gameLauncher')?.classList.add('hidden');
    document.getElementById('mainApp').style.display = 'flex';
    App.init();
  } else {
    if (window.Launcher) Launcher.init();
  }
});
