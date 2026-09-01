/**
 * =========================================================
 * App Router v8 — 核心路由与页面管理
 * 修复：initModules, navigate, handleRoute, renderSidebar等
 * 所有功能页面统一古风操作面板风格
 * =========================================================
 */
(function() {
  // 在App对象已存在的情况下，补充缺失的方法
  if (typeof window.App === 'undefined') return;

  /* ===== 1. 页面模块注册表 ===== */
  const PAGE_REGISTRY = {
    'home':        { mod: 'HomePage',      method: 'renderPage' },
    'runtime':     { mod: 'NovelRuntime',  method: 'renderPage' },
    'api':         { mod: 'APISettings',   method: 'renderPage' },
    'npc':         { mod: 'NPCManager',    method: 'renderPage' },
    'background':  { mod: 'BackgroundLibrary', method: 'renderPage' },
    'music':       { mod: 'MusicManager',  method: 'renderPage' },
    'map':         { mod: 'MapManager',    method: 'renderPage' },
    'status':      { mod: 'StatusBar',     method: 'renderPage' },
    'prompts':     { mod: 'PromptManager', method: 'renderPage' },
    'memory':      { mod: 'MemorySystem',  method: 'renderPage' },
    'presets':     { mod: 'PresetManager', method: 'renderPage' },
    'regex':       { mod: 'RegexEngine',   method: 'renderPage' },
    'worldbook':   { mod: 'WorldbookManager', method: 'renderPage' },
    'cg-gallery':  { mod: 'CGGallery',     method: 'renderPage' },
    'storytree':   { mod: 'StoryTreeEditor', method: 'renderPage' },
    'settings-hub':{ mod: 'SettingsHub',   method: 'renderPage' },
    'inventory':   { mod: 'Inventory',     method: 'renderPage' },
    'quest':       { mod: 'QuestSystem',   method: 'renderPage' },
    'weather':     { mod: 'WeatherSystem', method: 'renderPage' },
    'letter':      { mod: 'LetterSystem',  method: 'renderPage' },
    'notes':       { mod: 'Notes',         method: 'renderPage' },
    'relations':   { mod: 'Relations',     method: 'renderPage' },
    'achievement': { mod: 'AchievementSystem', method: 'renderPage' },
    'timeline':    { mod: 'Timeline',      method: 'renderPage' },
    'events':      { mod: 'Events',        method: 'renderPage' },
    'save-manager':{ mod: 'SaveManager',   method: 'renderPage' },
    'chapter-editor':{ mod:'ChapterEditor',method: 'renderPage' },
    'text-novel':  { mod: 'TextNovel',     method: 'renderPage' },
    'world-notes': { mod: 'WorldNotes',    method: 'renderPage' },
    'scene':       { mod: 'SceneSystem',   method: 'renderPage' },
    'npc-behavior':{ mod: 'NPCBehavior',   method: 'renderPage' },
    'code-patcher':{ mod: 'CodePatcher',   method: 'renderPage' },
    'worldview':   { mod: 'WorldviewEngine',method: 'renderPage' },
    'family':      { mod: 'FamilySystem',  method: 'renderPage' },
    'political':   { mod: 'PoliticalSystem',method: 'renderPage' },
    'conspiracy':  { mod: 'ConspiracySystem',method: 'renderPage' },
    'button-customizer':{ mod:'ButtonCustomizer',method:'renderPage' },
    'alliance':    { mod: 'AllianceSystem',method: 'renderPage' },
    'fun':         { mod: 'FunFeatures',   method: 'renderPage' },
    'juncheng':    { mod: 'Juncheng',      method: 'renderPage' },
    'storyline':   { mod: 'Storyline',     method: 'renderPage' },
    'storyline-manager':{ mod:'StorylineManager',method:'renderPage' },
    'forum':       { mod: 'Forum',         method: 'renderPage' },
    'mail':        { mod: 'Mail',          method: 'renderPage' },
    'chat':        { mod: 'Chat',          method: 'renderPage' },
    'chat-group':  { mod: 'GroupChat',     method: 'renderPage' },
    'assistant':   { mod: 'Assistant',     method: 'renderPage' },
    'plugins':     { mod: 'Plugins',         method: 'renderPage' },
    'import':      { mod: 'ImportManager', method: 'renderPage' },
    'backup':      { mod: 'BackupManager', method: 'renderPage' },
    'ui-diy':      { mod: 'UIDIY',         method: 'renderPage' },
    'baike':       { mod: 'BaikeIntegration',method:'renderPage' },
    'design-suite':{ mod: 'DesignSuiteIntegration',method:'renderPage' },
    'skill-discovery':{ mod:'SkillDiscovery',method:'renderPage' },
    'custom-creator':{ mod:'CustomCreator', method:'renderPage' },
    'mobile-preview':{ mod:'MobilePreview', method:'renderPage' },
    'pwa':         { mod: 'PWA',           method: 'renderPage' },
    'random-events':{ mod: 'RandomEvents', method: 'renderPage' },
    'badge-wall':  { mod: 'BadgeWall',     method: 'renderPage' },
    'system-builder':{ mod:'SystemBuilder', method: 'renderPage' },
    'portal':      { mod: 'Portal',        method: 'renderPage' },
    'app-beautify':{ mod: 'AppBeautify',   method: 'renderPage' },
    'app-custom':  { mod: 'AppCustom',     method: 'renderPage' },
    'app-settings':{ mod: 'AppSettings',   method: 'renderPage' },
    'app-chat':    { mod: 'AppChat',       method: 'renderPage' },
    'app-forum':   { mod: 'AppForum',      method: 'renderPage' },
    'app-mail':    { mod: 'AppMail',       method: 'renderPage' },
    'hero-system': { mod: 'HeroSystem',    method: 'renderPage' },
    'world-selector':{ mod:'WorldSelector', method: 'renderPage' },
    'world-detail':{ mod: 'WorldDetail',   method: 'renderPage' },
    'ranking-system':{ mod:'RankingSystem', method: 'renderPage' },
    'virtual-app-platform':{ mod:'VirtualAppPlatform',method:'renderPage' },
    'settings':    { mod: 'AppSettings',   method: 'renderPage' },
    'custom':      { mod: 'AppCustom',     method: 'renderPage' },
    'beautify':    { mod: 'AppBeautify',   method: 'renderPage' }
  };

  /* ===== 2. 补充缺失的核心方法 ===== */

  /** 初始化所有已加载的模块 */
  App.initModules = function() {
    console.log('[AppRouter] 初始化模块...');
    // 尝试初始化每个已存在的模块
    Object.keys(PAGE_REGISTRY).forEach(pageId => {
      const reg = PAGE_REGISTRY[pageId];
      const mod = window[reg.mod];
      if (mod && typeof mod.init === 'function') {
        try { mod.init(); } catch(e) { console.warn('[AppRouter]', reg.mod, 'init失败:', e.message); }
      }
    });
    // 注册回调
    Object.keys(PAGE_REGISTRY).forEach(pageId => {
      const reg = PAGE_REGISTRY[pageId];
      const mod = window[reg.mod];
      if (mod && typeof mod[reg.method] === 'function') {
        const navItem = this.NAV_ITEMS.find(n => n.page === pageId);
        const title = navItem ? navItem.label : pageId;
        this.callbacks[pageId] = { 
          onEnter: () => {
            mod[reg.method]();
            if (window.PageFrame && typeof PageFrame.wrap === 'function') {
              setTimeout(() => PageFrame.wrap('page-' + pageId, title), 0);
            }
          }
        };
      }
    });
    console.log('[AppRouter] 已注册', Object.keys(this.callbacks).length, '个页面回调');
  };

  /** 页面导航 */
  App.navigate = function(pageId) {
    location.hash = pageId;
    this.handleRoute();
  };

  /** 处理路由变化 */
  App.handleRoute = function() {
    const pageId = location.hash.replace('#', '') || 'home';
    console.log('[AppRouter] 路由到:', pageId);

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
      console.warn('[AppRouter] 页面容器不存在:', 'page-' + pageId);
      // 尝试回退到home
      const homePage = document.getElementById('page-home');
      if (homePage) { homePage.style.display = 'block'; homePage.classList.add('active'); }
    }

    // 触发页面回调
    const cb = this.callbacks[pageId];
    if (cb && typeof cb.onEnter === 'function') {
      try { cb.onEnter(); } catch(e) { console.warn('[AppRouter] 页面 onEnter 出错:', pageId, e); }
    } else {
      // 如果没有回调但有模块，直接调用renderPage
      const reg = PAGE_REGISTRY[pageId];
      if (reg) {
        const mod = window[reg.mod];
        if (mod && typeof mod[reg.method] === 'function') {
          try { mod[reg.method](); } catch(e) { console.warn('[AppRouter] 直接renderPage出错:', pageId, e); }
        }
      }
    }

    // 移动端关闭侧边栏
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (backdrop) backdrop.classList.remove('show');

    // 更新标题
    const navItem = this.NAV_ITEMS.find(n => n.page === pageId);
    if (navItem) {
      const titleEl = document.getElementById('pageTitle');
      if (titleEl) titleEl.textContent = navItem.label;
    }

    // 滚动到顶部
    const contentArea = document.getElementById('contentArea');
    if (contentArea) contentArea.scrollTop = 0;
  };

  /** 注册页面回调 */
  App.registerPageCallback = function(pageId, onEnterFn) {
    this.callbacks[pageId] = { onEnter: onEnterFn };
  };

  /** 渲染顶部栏 */
  App.renderTopBar = function() {
    const bar = document.getElementById('topBar');
    if (!bar) return;
    bar.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;">
        <button class="btn-icon" id="sidebarToggle" style="display:none;" onclick="document.getElementById('sidebar').classList.toggle('open');document.getElementById('sidebarBackdrop').classList.toggle('show');">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <span id="pageTitle" style="font-family:var(--font-display);font-size:18px;color:var(--color-primary-dark);">墨境</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <button class="btn-icon" id="themeToggle" onclick="App.toggleTheme()" title="切换主题">
          <svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="#C9A227" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="#C9A227"/></svg>
        </button>
      </div>
    `;
    if (window.innerWidth < 768) {
      const toggle = document.getElementById('sidebarToggle');
      if (toggle) toggle.style.display = 'block';
    }
  };

  /** 渲染底部导航 */
  App.renderBottomNav = function() {};

  /** 渲染侧边栏 */
  App.renderSidebar = function() {
    const nav = document.getElementById('sidebarNav');
    if (!nav) return;
    nav.innerHTML = this.NAV_ITEMS.map(item => `
      <a href="#${item.page}" class="nav-item" data-page="${item.page}" onclick="App.navigate('${item.page}');return false;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <use href="#${item.iconSvg}"/>
        </svg>
        <span>${item.label}</span>
      </a>
    `).join('');
  };

  /** 绑定全局事件 */
  App.bindEvents = function() {
    const backdrop = document.getElementById('sidebarBackdrop');
    if (backdrop) {
      backdrop.addEventListener('click', () => {
        const sb = document.getElementById('sidebar');
        if (sb) sb.classList.remove('open');
        backdrop.classList.remove('show');
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });
  };

  /** 加载用户自定义导航项 */
  App.loadCustomNavItems = function() {
    try {
      const custom = Storage.get('customNavItems', []);
      if (Array.isArray(custom) && custom.length > 0) {
        this.NAV_ITEMS = [...this.NAV_ITEMS, ...custom];
      }
    } catch(e) { console.warn('[AppRouter] load custom nav failed:', e); }
  };

  // 立即重新初始化路由（如果App已初始化过）
  if (App.callbacks && Object.keys(App.callbacks).length === 0) {
    App.initModules();
  }

  console.log('[AppRouter] v8 路由系统已加载');
})();
