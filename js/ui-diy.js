/**
 * =========================================================
 * UI DIY System vv3 全面可视化页面定制
 * 功能：页面列表、布局/配色/字体/组件定制、可视化拖拽、
 *       实时预览、方案管理、AI 小助手一键美化
 * 存储键：ui_diy_v14
 * =========================================================
 */
const UIDIY = {
  /* ==================== 常量与默认配置 ==================== */

  /** 存储键名 */
  STORAGE_KEY: 'ui_diy_v14',

  /** 默认按键映射（保留 v3 原有功能） */
  DEFAULT_KEYS: {
    'Enter': { action: 'send', label: '发送', desc: '发送当前输入' },
    'Escape': { action: 'skip', label: '跳过打字机', desc: '跳过打字机动画' },
    'Space': { action: 'auto', label: '自动播放', desc: '切换自动播放' },
    'ArrowUp': { action: 'history_up', label: '上一条', desc: '查看上一条历史' },
    'ArrowDown': { action: 'history_down', label: '下一条', desc: '查看下一条历史' },
    'KeyS': { action: 'save', label: '存档', desc: '快速存档', ctrl: true },
    'KeyL': { action: 'load', label: '读档', desc: '快速读档', ctrl: true },
    'KeyH': { action: 'history', label: '历史', desc: '查看对话历史' },
    'KeyC': { action: 'choices', label: '选项', desc: '生成选项' },
    'KeyM': { action: 'menu', label: '菜单', desc: '打开设置菜单' }
  },

  /** 默认按钮配置（保留 v3 原有功能） */
  DEFAULT_BUTTONS: [
    { id: 'btn_send', label: '发送', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>', position: 'bottom-right', style: 'primary', action: 'send', visible: true },
    { id: 'btn_choices', label: '选项', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>', position: 'bottom-right', style: 'secondary', action: 'choices', visible: true },
    { id: 'btn_auto', label: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>', position: 'bottom-left', style: 'icon', action: 'auto', visible: true },
    { id: 'btn_history', label: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>', position: 'bottom-left', style: 'icon', action: 'history', visible: true },
    { id: 'btn_save', label: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>', position: 'top-right', style: 'icon', action: 'save', visible: true },
    { id: 'btn_load', label: '读档', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>', position: 'top-right', style: 'icon', action: 'load', visible: true }
  ],

  /** 默认布局（保留 v3 原有功能） */
  DEFAULT_LAYOUT: {
    dialogPosition: 'bottom',
    statusBarPosition: 'top-left',
    portraitPosition: 'center-right'
  },

  /** 默认页面 UI 配置 */
  DEFAULT_PAGE_CONFIG: {
    layout: {
      direction: 'center',      // 布局方向：left / center / right / full
      arrangement: 'vertical', // 组件排列：horizontal / vertical / grid
      padding: 24,             // 页面内边距(px)
      gap: 16,                 // 组件间距(px)
      cardRadius: 8            // 卡片圆角(px)
    },
    colors: {
      primary: '#C9A227',      // 主色（金色系默认）
      background: '#F5E6D3',    // 背景色（羊皮纸默认）
      text: '#2C1810',         // 文字色（墨色默认）
      secondary: '#8B7355',    // 辅助色（次要文字）
      accent: '#D4AF37'        // 强调色（按钮/链接）
    },
    typography: {
      fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif',
      globalScale: 1.0,        // 全局缩放(0.8x-1.5x)
      titleSize: 24,           // 标题字号(px)
      bodySize: 16,            // 正文字号(px)
      smallSize: 12,           // 小字字号(px)
      lineHeight: 1.6,         // 行高(1.4-2.0)
      letterSpacing: 0         // 字间距(px)
    },
    components: {
      cardShadow: 2,           // 卡片阴影强度(0-4)
      cardBorder: 1,           // 卡片边框粗细(px)
      buttonRadius: 6,         // 按钮圆角(px)
      buttonPadding: 12,       // 按钮内边距(px)
      buttonHover: 10,         // 悬停效果强度(%)
      inputBorder: '#8B7355',  // 输入框边框颜色
      inputFocus: '#C9A227',   // 输入框焦点颜色
      navWidth: 260,           // 导航栏宽度(px)
      navAlpha: 95,            // 导航栏背景透明度(%)
      navIcon: 20              // 导航栏图标大小(px)
    },
    structure: {
      navBar: { visible: true, order: 1, width: '260px' },
      contentArea: { visible: true, order: 2, width: 'auto' },
      sideBar: { visible: false, order: 3, width: '200px' },
      bottomBar: { visible: true, order: 4, width: 'auto' }
    }
  },

  /** 5 个预设配色方案 */
  PRESETS: {
    '墨境古风': {
      colors: { primary: '#C9A227', background: '#F5E6D3', text: '#2C1810', secondary: '#8B7355', accent: '#D4AF37' },
      typography: { fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif', globalScale: 1, titleSize: 24, bodySize: 16, smallSize: 12, lineHeight: 1.6, letterSpacing: 0 },
      layout: { direction: 'center', arrangement: 'vertical', padding: 24, gap: 16, cardRadius: 8 }
    },
    '现代简约': {
      colors: { primary: '#333333', background: '#FFFFFF', text: '#1a1a1a', secondary: '#666666', accent: '#000000' },
      typography: { fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', globalScale: 1, titleSize: 22, bodySize: 15, smallSize: 12, lineHeight: 1.5, letterSpacing: 0.2 },
      layout: { direction: 'full', arrangement: 'vertical', padding: 32, gap: 20, cardRadius: 4 }
    },
    '深夜模式': {
      colors: { primary: '#4a9eff', background: '#1a1a2e', text: '#e0e0e0', secondary: '#888888', accent: '#6bb5ff' },
      typography: { fontFamily: '"Noto Sans SC", "PingFang SC", sans-serif', globalScale: 1, titleSize: 24, bodySize: 16, smallSize: 12, lineHeight: 1.6, letterSpacing: 0 },
      layout: { direction: 'center', arrangement: 'vertical', padding: 24, gap: 16, cardRadius: 12 }
    },
    '明亮清新': {
      colors: { primary: '#42b883', background: '#f8fafc', text: '#2c3e50', secondary: '#64748b', accent: '#33a06f' },
      typography: { fontFamily: '"Noto Sans SC", "PingFang SC", sans-serif', globalScale: 1, titleSize: 22, bodySize: 15, smallSize: 12, lineHeight: 1.6, letterSpacing: 0 },
      layout: { direction: 'center', arrangement: 'grid', padding: 28, gap: 20, cardRadius: 16 }
    },
    '用户自定义1': null // 占位，由用户保存后填充
  },

  /** 字体家族选项 */
  FONT_OPTIONS: [
    { value: '"Noto Serif SC", "Source Han Serif SC", serif', label: '思源宋体 (Noto Serif SC)' },
    { value: '"SimSun", "STSong", serif', label: '宋体 (SimSun)' },
    { value: '"KaiTi", "STKaiti", serif', label: '楷体 (KaiTi)' },
    { value: '"SimHei", "STHeiti", sans-serif', label: '黑体 (SimHei)' },
    { value: '"Ma Shan Zheng", "ZCOOL XiaoWei", cursive', label: '手写体 (Ma Shan Zheng)' }
  ],

  /* ==================== 拖拽状态 ==================== */
  _draggedIndex: null,
  _draggedItem: null,
  _currentPage: null,
  _currentConfig: null,
  _previewBlobUrl: null,

  /* ==================== 初始化入口 ==================== */

  /** 初始化 UI DIY 页面 */
    // 初始化模块入口
  init() {
    // v7: 外部模块依赖检查
    if (typeof Storage === 'undefined') { console.warn('[v7] Storage模块未加载'); return; }
    this.renderPage(); },

  /** 进入页面时的回调（保留 v3 兼容） */
    // 页面进入时调用
  onEnter() {
    this.renderPage(); },

  /* ==================== 数据存储（v2 统一接口） ==================== */

  /** 获取 v2 全部配置 */
  getV2Data() {
    return Storage.get(this.STORAGE_KEY, { schemes: {}, activeSchemeId: null, pageConfigs: {} });
  },

  /** 保存 v2 全部配置 */
  saveV2Data(data) {
    Storage.set(this.STORAGE_KEY, data);
  },

  /** 获取当前激活的方案 ID */
  getActiveSchemeId() {
    return this.getV2Data().activeSchemeId;
  },

  /** 获取指定页面的配置（合并默认 + 激活方案） */
  getPageConfig(pageId) {
    const data = this.getV2Data();
    const scheme = data.activeSchemeId && data.schemes[data.activeSchemeId]
      ? data.schemes[data.activeSchemeId]
      : {};
    const pageOverrides = data.pageConfigs && data.pageConfigs[pageId]
      ? data.pageConfigs[pageId]
      : {};
    return this._deepMerge({}, this.DEFAULT_PAGE_CONFIG, scheme, pageOverrides);
  },

  /** 保存指定页面的配置 */
  savePageConfig(pageId, config) {
    const data = this.getV2Data();
    if (!data.pageConfigs) data.pageConfigs = {};
    data.pageConfigs[pageId] = config;
    this.saveV2Data(data);
  },

  /** 深合并工具 */
  _deepMerge(target, ...sources) {
    for (const src of sources) {
      if (!src) continue;
      for (const key in src) {
        if (src[key] && typeof src[key] === 'object' && !Array.isArray(src[key])) {
          target[key] = target[key] && typeof target[key] === 'object' ? target[key] : {};
          this._deepMerge(target[key], src[key]);
        } else {
          target[key] = src[key];
        }
      }
    }
    return target;
  },

  /* ==================== 页面渲染 ==================== */

  /** 渲染 UI DIY 主页面 */
    // 渲染页面主结构
  renderPage() {
    const page = document.getElementById('page-ui-diy');
    if (!page) return;
    page.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:8px;">
        <h2 class="section-title"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:6px;"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg> UI DIY vv3 全面可视化页面定制</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-gold" onclick="UIDIY.openSchemeManager()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg> 方案管理</button>
          <button class="btn btn-secondary" onclick="UIDIY.openThemeEditor()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.62 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg> 主题编辑器</button>
          <button class="btn btn-primary" onclick="UIDIY.aiBeautify()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg> AI 一键美化</button>
        </div>
      </div>
      <div id="ui-diy-container" style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap;">
        <!-- 左侧：页面列表 + 定制面板 -->
        <div id="ui-diy-left" style="flex:1;min-width:340px;max-width:520px;">
          ${this._renderPageList()}
          <div id="ui-diy-editor" style="margin-top:16px;display:none;"></div>
        </div>
        <!-- 右侧：实时预览 -->
        <div id="ui-diy-right" style="flex:1.5;min-width:360px;max-width:640px;display:none;">
          <div class="card">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
              <h3><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> 实时预览</h3>
              <div style="display:flex;gap:6px;">
                <select id="previewPageSelect" onchange="UIDIY.switchPreviewPage(this.value)" style="width:auto;font-size:12px;">
                  <option value="">选择预览页面...</option>
                </select>
                <button class="btn btn-sm btn-secondary" onclick="UIDIY.resetCurrentPage()">↺ 重置</button>
              </div>
            </div>
            <div class="card-body" style="padding:8px;">
              <iframe id="ui-diy-preview" style="width:100%;height:480px;border:1px solid var(--border-color);border-radius:var(--border-radius-sm);background:#fff;"></iframe>
            </div>
          </div>
        </div>
      </div>
      <!-- 动态 CSS 注入点 -->
      <style id="ui-diy-dynamic"></style>
    `;
    this._refreshPageList();
    this._initPreviewPages();
  },

  /** 生成页面列表 HTML */
  _renderPageList() {
    return `
      <div class="card">
        <div class="card-header"><h3><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> 可定制页面</h3></div>
        <div class="card-body">
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:var(--space-md);">
            点击页面卡片进入该页面的独立定制界面。
          </p>
          <div id="pageListGrid" style="display:flex;flex-direction:column;gap:8px;"></div>
        </div>
      </div>
    `;
  },

  /** 刷新页面列表内容 */
  _refreshPageList() {
    const grid = document.getElementById('pageListGrid');
    if (!grid) return;
    const navItems = (typeof App !== 'undefined' && App.NAV_ITEMS) ? App.NAV_ITEMS : [];
    const data = this.getV2Data();
    const activeScheme = data.activeSchemeId || '墨境古风（默认）';
    if (!navItems.length) {
      grid.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">暂无页面数据（App.NAV_ITEMS 为空）</p>';
      return;
    }
    grid.innerHTML = navItems.map(item => {
      const pageId = item.page || item.id || item.label;
      const isActive = this._currentPage === pageId;
      return `
        <div onclick="UIDIY.selectPage('${pageId}')"
          style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--border-radius-sm);cursor:pointer;
                 background:${isActive ? 'var(--color-gold)' : 'var(--bg-sidebar)'};
                 color:${isActive ? '#fff' : 'var(--text)'};
                 border:1px solid ${isActive ? 'var(--color-gold)' : 'var(--border-color)'};
                 transition:all .2s;">
          <span style="font-size:20px;">${item.icon || '<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z\"/><polyline points=\"14 2 14 8 20 8\"/><line x1=\"16\" y1=\"13\" x2=\"8\" y2=\"13\"/><line x1=\"16\" y1=\"17\" x2=\"8\" y2=\"17\"/><polyline points=\"10 9 9 9 8 9\"/></svg>'}</span>
          <div style="flex:1;">
            <div style="font-weight:600;font-size:14px;">${item.label || pageId}</div>
            <div style="font-size:11px;opacity:0.8;">当前主题：${activeScheme}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      `;
    }).join('');
  },

  /** 初始化预览页面下拉框 */
  _initPreviewPages() {
    const sel = document.getElementById('previewPageSelect');
    if (!sel) return;
    const navItems = (typeof App !== 'undefined' && App.NAV_ITEMS) ? App.NAV_ITEMS : [];
    sel.innerHTML = '<option value="">选择预览页面...</option>' +
      navItems.map(item => `<option value="${item.page || item.id || item.label}">${item.label || item.page}</option>`).join('');
  },

  /* ==================== 页面选择与编辑器 ==================== */

  /** 选择并进入某页面的定制界面 */
  selectPage(pageId) {
    this._currentPage = pageId;
    this._currentConfig = this.getPageConfig(pageId);
    const editor = document.getElementById('ui-diy-editor');
    const right = document.getElementById('ui-diy-right');
    if (editor) editor.style.display = 'block';
    if (right) right.style.display = 'block';
    this._refreshPageList();
    this._renderEditor();
    this._updatePreview();
  },

  /** 渲染编辑面板 */
  _renderEditor() {
    const editor = document.getElementById('ui-diy-editor');
    if (!editor) return;
    const cfg = this._currentConfig || this.DEFAULT_PAGE_CONFIG;
    editor.innerHTML = `
      <div class="tabs" style="margin-bottom:var(--space-md);">
        <div class="tab active" onclick="UIDIY.switchEditorTab(event,'tab_layout')">布局</div>
        <div class="tab" onclick="UIDIY.switchEditorTab(event,'tab_colors')">配色</div>
        <div class="tab" onclick="UIDIY.switchEditorTab(event,'tab_typo')">字体</div>
        <div class="tab" onclick="UIDIY.switchEditorTab(event,'tab_components')">组件</div>
        <div class="tab" onclick="UIDIY.switchEditorTab(event,'tab_drag')">拖拽</div>
      </div>

      <!-- 布局定制 -->
      <div class="tab-content active" id="tab_layout">
        <div class="card" style="margin-bottom:var(--space-sm);">
          <div class="card-header"><h4>布局方向</h4></div>
          <div class="card-body" style="display:flex;gap:8px;flex-wrap:wrap;">
            ${['left','center','right','full'].map(v=>`
              <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:13px;padding:4px 8px;border-radius:4px;background:${cfg.layout.direction===v?'var(--color-gold)':'var(--bg-sidebar)'};color:${cfg.layout.direction===v?'#fff':'var(--text)'};">
                <input type="radio" name="layout_direction" value="${v}" ${cfg.layout.direction===v?'checked':''} onchange="UIDIY.updateLayout('direction',this.value)" style="width:auto;">
                ${v==='left'?'左对齐':v==='center'?'居中':v==='right'?'右对齐':'全宽'}
              </label>
            `).join('')}
          </div>
        </div>
        <div class="card" style="margin-bottom:var(--space-sm);">
          <div class="card-header"><h4>组件排列</h4></div>
          <div class="card-body" style="display:flex;gap:8px;flex-wrap:wrap;">
            ${['horizontal','vertical','grid'].map(v=>`
              <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:13px;padding:4px 8px;border-radius:4px;background:${cfg.layout.arrangement===v?'var(--color-gold)':'var(--bg-sidebar)'};color:${cfg.layout.arrangement===v?'#fff':'var(--text)'};">
                <input type="radio" name="layout_arrangement" value="${v}" ${cfg.layout.arrangement===v?'checked':''} onchange="UIDIY.updateLayout('arrangement',this.value)" style="width:auto;">
                ${v==='horizontal'?'横向':v==='vertical'?'纵向':'网格'}
              </label>
            `).join('')}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h4>间距微调</h4></div>
          <div class="card-body">
            ${this._renderSlider('页面内边距', cfg.layout.padding, 0, 64, 'px', 'layout.padding')}
            ${this._renderSlider('组件间距', cfg.layout.gap, 0, 48, 'px', 'layout.gap')}
            ${this._renderSlider('卡片圆角', cfg.layout.cardRadius, 0, 32, 'px', 'layout.cardRadius')}
          </div>
        </div>
      </div>

      <!-- 配色定制 -->
      <div class="tab-content" id="tab_colors">
        <div class="card" style="margin-bottom:var(--space-sm);">
          <div class="card-header" style="display:flex;justify-content:space-between;">
            <h4>预设方案</h4>
            <button class="btn btn-sm btn-secondary" onclick="UIDIY.applyPresetToPage()">应用预设</button>
          </div>
          <div class="card-body" style="display:flex;gap:8px;flex-wrap:wrap;">
            ${Object.keys(this.PRESETS).map(name => `
              <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:12px;padding:4px 10px;border-radius:4px;border:1px solid var(--border-color);">
                <input type="radio" name="color_preset" value="${name}" style="width:auto;" onchange="UIDIY.previewPreset('${name}')">
                ${name}
              </label>
            `).join('')}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h4>自定义颜色</h4></div>
          <div class="card-body">
            ${this._renderColorPicker('主色', cfg.colors.primary, 'colors.primary')}
            ${this._renderColorPicker('背景色', cfg.colors.background, 'colors.background')}
            ${this._renderColorPicker('文字色', cfg.colors.text, 'colors.text')}
            ${this._renderColorPicker('辅助色', cfg.colors.secondary, 'colors.secondary')}
            ${this._renderColorPicker('强调色', cfg.colors.accent, 'colors.accent')}
          </div>
        </div>
      </div>

      <!-- 字体定制 -->
      <div class="tab-content" id="tab_typo">
        <div class="card" style="margin-bottom:var(--space-sm);">
          <div class="card-header"><h4>字体家族</h4></div>
          <div class="card-body">
            <select onchange="UIDIY.updateConfig('typography.fontFamily',this.value)" style="width:100%;font-size:13px;">
              ${this.FONT_OPTIONS.map(f=>`<option value="${f.value}" ${cfg.typography.fontFamily===f.value?'selected':''}>${f.label}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h4>字号与间距</h4></div>
          <div class="card-body">
            ${this._renderSlider('全局缩放', cfg.typography.globalScale, 0.8, 1.5, 'x', 'typography.globalScale', 0.05)}
            ${this._renderSlider('标题字号', cfg.typography.titleSize, 14, 36, 'px', 'typography.titleSize')}
            ${this._renderSlider('正文字号', cfg.typography.bodySize, 12, 24, 'px', 'typography.bodySize')}
            ${this._renderSlider('小字字号', cfg.typography.smallSize, 10, 18, 'px', 'typography.smallSize')}
            ${this._renderSlider('行高', cfg.typography.lineHeight, 1.4, 2.0, '', 'typography.lineHeight', 0.1)}
            ${this._renderSlider('字间距', cfg.typography.letterSpacing, -2, 6, 'px', 'typography.letterSpacing')}
          </div>
        </div>
      </div>

      <!-- 组件定制 -->
      <div class="tab-content" id="tab_components">
        <div class="card" style="margin-bottom:var(--space-sm);">
          <div class="card-header"><h4>🃏 卡片样式</h4></div>
          <div class="card-body">
            ${this._renderSlider('阴影强度', cfg.components.cardShadow, 0, 4, '级', 'components.cardShadow')}
            ${this._renderSlider('边框粗细', cfg.components.cardBorder, 0, 4, 'px', 'components.cardBorder')}
          </div>
        </div>
        <div class="card" style="margin-bottom:var(--space-sm);">
          <div class="card-header"><h4>按钮样式</h4></div>
          <div class="card-body">
            ${this._renderSlider('圆角', cfg.components.buttonRadius, 0, 24, 'px', 'components.buttonRadius')}
            ${this._renderSlider('内边距', cfg.components.buttonPadding, 4, 24, 'px', 'components.buttonPadding')}
            ${this._renderSlider('悬停强度', cfg.components.buttonHover, 0, 30, '%', 'components.buttonHover')}
          </div>
        </div>
        <div class="card" style="margin-bottom:var(--space-sm);">
          <div class="card-header"><h4>输入框样式</h4></div>
          <div class="card-body">
            ${this._renderColorPicker('边框颜色', cfg.components.inputBorder, 'components.inputBorder')}
            ${this._renderColorPicker('焦点颜色', cfg.components.inputFocus, 'components.inputFocus')}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h4>导航栏样式</h4></div>
          <div class="card-body">
            ${this._renderSlider('宽度', cfg.components.navWidth, 180, 360, 'px', 'components.navWidth')}
            ${this._renderSlider('背景透明度', cfg.components.navAlpha, 50, 100, '%', 'components.navAlpha')}
            ${this._renderSlider('图标大小', cfg.components.navIcon, 14, 32, 'px', 'components.navIcon')}
          </div>
        </div>
      </div>

      <!-- 可视化拖拽 -->
      <div class="tab-content" id="tab_drag">
        <div class="card" style="margin-bottom:var(--space-sm);">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
            <h4>可视化拖拽布局</h4>
            <button class="btn btn-sm btn-secondary" onclick="UIDIY.resetStructure()">↺ 重置布局</button>
          </div>
          <div class="card-body">
            <p style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">
              拖拽下方区块调整顺序，点击眼睛图标可显示/隐藏。
            </p>
            <div id="dragLayoutArea" style="display:flex;flex-direction:column;gap:8px;min-height:120px;padding:8px;border:2px dashed var(--border-color);border-radius:var(--border-radius-sm);background:var(--bg-sidebar);">
              ${this._renderDragItems(cfg.structure)}
            </div>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:8px;margin-top:var(--space-md);">
        <button class="btn btn-primary" onclick="UIDIY.saveCurrentPageConfig()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> 保存当前页配置</button>
        <button class="btn btn-gold" onclick="UIDIY.saveAsScheme()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> 存为方案</button>
      </div>
    `;
  },

  /** 渲染滑动条控件 */
  _renderSlider(label, value, min, max, unit, path, step) {
    const s = step || (unit === 'px' || unit === '级' || unit === '%' ? 1 : 0.05);
    const id = 'slider_' + path.replace(/\./g, '_');
    return `
      <div style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:2px;">
          <span>${label}</span>
          <span id="${id}_val" style="color:var(--color-gold);font-weight:600;">${value}${unit}</span>
        </div>
        <input type="range" min="${min}" max="${max}" step="${s}" value="${value}"
          oninput="UIDIY.handleSlider('${path}',this.value,'${id}_val','${unit}')"
          style="width:100%;cursor:pointer;">
      </div>
    `;
  },

  /** 渲染颜色选择器 */
  _renderColorPicker(label, value, path) {
    const id = 'color_' + path.replace(/\./g, '_');
    return `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <input type="color" id="${id}" value="${value}"
          onchange="UIDIY.updateConfig('${path}',this.value)"
          style="width:36px;height:28px;padding:0;border:none;cursor:pointer;background:none;">
        <div style="flex:1;">
          <div style="font-size:13px;">${label}</div>
          <div id="${id}_hex" style="font-size:11px;color:var(--text-muted);font-family:monospace;">${value}</div>
        </div>
      </div>
    `;
  },

  /** 渲染可拖拽的骨架组件 */
  _renderDragItems(structure) {
    const items = Object.entries(structure || this.DEFAULT_PAGE_CONFIG.structure);
    // 按 order 排序
    items.sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
    return items.map(([key, item], index) => {
      const labels = { navBar: '导航栏', contentArea: '内容区', sideBar: '侧边栏', bottomBar: '底部栏' };
      return `
        <div draggable="true"
          ondragstart="UIDIY.dragStructStart(event,'${key}')"
          ondragover="UIDIY.dragStructOver(event)"
          ondrop="UIDIY.dragStructDrop(event,'${key}')"
          style="display:flex;align-items:center;gap:8px;padding:8px 10px;
                 background:${item.visible ? 'var(--bg-parchment)' : 'var(--bg-sidebar)'};
                 border:1px solid var(--border-color);border-radius:var(--border-radius-sm);
                 cursor:move;opacity:${item.visible ? 1 : 0.5};">
          <span style="color:var(--text-muted);font-size:14px;">⋮⋮</span>
          <span style="font-size:14px;font-weight:500;flex:1;">${labels[key] || key}</span>
          <button class="btn btn-sm btn-secondary" onclick="UIDIY.toggleStructVisible('${key}')" style="font-size:12px;padding:2px 6px;">
            ${item.visible ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'}
          </button>
        </div>
      `;
    }).join('');
  },

  /* ==================== 编辑器标签页切换 ==================== */

  /** 切换编辑面板标签页 */
  switchEditorTab(e, id) {
    const editor = document.getElementById('ui-diy-editor');
    if (!editor) return;
    editor.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    editor.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    e.target.classList.add('active');
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  },

  /* ==================== 配置实时更新 ==================== */

  /** 滑动条数值变化处理 */
  handleSlider(path, value, valId, unit) {
    const num = unit === 'x' || unit === '' ? parseFloat(value) : parseInt(value, 10);
    this.updateConfig(path, num);
    const el = document.getElementById(valId);
    if (el) el.textContent = num + unit;
  },

  /** 统一更新配置项 */
  updateConfig(path, value) {
    if (!this._currentConfig) return;
    const keys = path.split('.');
    let target = this._currentConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!target[keys[i]]) target[keys[i]] = {};
      target = target[keys[i]];
    }
    target[keys[keys.length - 1]] = value;
    // 同步更新 HEX 显示
    const hexId = 'color_' + path.replace(/\./g, '_') + '_hex';
    const hexEl = document.getElementById(hexId);
    if (hexEl) hexEl.textContent = value;
    this._updatePreview();
  },

  /** 更新布局单项 */
  updateLayout(key, value) {
    if (!this._currentConfig) return;
    if (!this._currentConfig.layout) this._currentConfig.layout = {};
    this._currentConfig.layout[key] = value;
    this._renderEditor();
    this._updatePreview();
  },

  /* ==================== 预设配色 ==================== */

  /** 预览预设配色（不立即保存） */
  previewPreset(name) {
    const preset = this.PRESETS[name];
    if (!preset || !this._currentConfig) return;
    if (preset.colors) this._currentConfig.colors = { ...preset.colors };
    if (preset.typography) this._currentConfig.typography = { ...this._currentConfig.typography, ...preset.typography };
    if (preset.layout) this._currentConfig.layout = { ...this._currentConfig.layout, ...preset.layout };
    this._renderEditor();
    this._updatePreview();
    App.toast(`已预览「${name}」配色方案`, 'info');
  },

  /** 将当前选中预设应用到当前页面 */
  applyPresetToPage() {
    const radios = document.querySelectorAll('input[name="color_preset"]:checked');
    if (!radios.length) { App.toast('请先选择一个预设方案', 'warning'); return; }
    const name = radios[0].value;
    this.previewPreset(name);
    this.saveCurrentPageConfig();
    App.toast(`「${name}」已应用到当前页面`, 'success');
  },

  /* ==================== 可视化拖拽 ==================== */

  /** 开始拖拽结构项 */
  dragStructStart(e, key) {
    e.dataTransfer.setData('text/plain', key);
    e.dataTransfer.effectAllowed = 'move';
    this._draggedItem = key;
  },

  /** 拖拽经过 */
  dragStructOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  },

  /** 放置结构项，交换 order */
  dragStructDrop(e, targetKey) {
    e.preventDefault();
    if (!this._draggedItem || this._draggedItem === targetKey) return;
    if (!this._currentConfig || !this._currentConfig.structure) return;
    const struct = this._currentConfig.structure;
    const fromOrder = struct[this._draggedItem]?.order ?? 1;
    const toOrder = struct[targetKey]?.order ?? 1;
    // 简单交换 order
    if (struct[this._draggedItem]) struct[this._draggedItem].order = toOrder;
    if (struct[targetKey]) struct[targetKey].order = fromOrder;
    this._renderEditor();
    this._updatePreview();
    this._draggedItem = null;
  },

  /** 切换结构项显示/隐藏 */
  toggleStructVisible(key) {
    if (!this._currentConfig || !this._currentConfig.structure) return;
    const item = this._currentConfig.structure[key];
    if (item) item.visible = !item.visible;
    this._renderEditor();
    this._updatePreview();
  },

  /** 重置页面结构布局 */
  resetStructure() {
    if (!this._currentConfig) return;
    this._currentConfig.structure = JSON.parse(JSON.stringify(this.DEFAULT_PAGE_CONFIG.structure));
    this._renderEditor();
    this._updatePreview();
    App.toast('布局已重置为默认', 'info');
  },

  /* ==================== 实时预览 ==================== */

  /** 切换预览页面 */
  switchPreviewPage(pageId) {
    if (!pageId) return;
    this._currentPage = pageId;
    this._currentConfig = this.getPageConfig(pageId);
    this._updatePreview();
  },

  /** 生成当前配置的 CSS 文本 */
  _generatePreviewCSS(cfg) {
    if (!cfg) cfg = this.DEFAULT_PAGE_CONFIG;
    const l = cfg.layout || {};
    const c = cfg.colors || {};
    const t = cfg.typography || {};
    const comp = cfg.components || {};
    const s = cfg.structure || {};
    return `
      :root {
        --diy-primary: ${c.primary || '#C9A227'};
        --diy-bg: ${c.background || '#F5E6D3'};
        --diy-text: ${c.text || '#2C1810'};
        --diy-secondary: ${c.secondary || '#8B7355'};
        --diy-accent: ${c.accent || '#D4AF37'};
        --diy-padding: ${l.padding || 24}px;
        --diy-gap: ${l.gap || 16}px;
        --diy-card-radius: ${l.cardRadius || 8}px;
        --diy-font: ${t.fontFamily || '"Noto Serif SC", serif'};
        --diy-title: ${Math.round((t.titleSize || 24) * (t.globalScale || 1))}px;
        --diy-body: ${Math.round((t.bodySize || 16) * (t.globalScale || 1))}px;
        --diy-small: ${Math.round((t.smallSize || 12) * (t.globalScale || 1))}px;
        --diy-line: ${t.lineHeight || 1.6};
        --diy-ls: ${t.letterSpacing || 0}px;
        --diy-card-shadow: ${comp.cardShadow || 2};
        --diy-card-border: ${comp.cardBorder || 1}px;
        --diy-btn-radius: ${comp.buttonRadius || 6}px;
        --diy-btn-pad: ${comp.buttonPadding || 12}px;
        --diy-input-border: ${comp.inputBorder || '#8B7355'};
        --diy-input-focus: ${comp.inputFocus || '#C9A227'};
        --diy-nav-w: ${comp.navWidth || 260}px;
        --diy-nav-alpha: ${(comp.navAlpha || 95) / 100};
        --diy-nav-icon: ${comp.navIcon || 20}px;
        --diy-dir: ${l.direction || 'center'};
        --diy-arr: ${l.arrangement || 'vertical'};
      }
      body {
        font-family: var(--diy-font);
        background: var(--diy-bg);
        color: var(--diy-text);
        padding: var(--diy-padding);
        line-height: var(--diy-line);
        letter-spacing: var(--diy-ls);
        display: flex;
        flex-direction: column;
        gap: var(--diy-gap);
        align-items: ${l.direction === 'left' ? 'flex-start' : l.direction === 'right' ? 'flex-end' : l.direction === 'full' ? 'stretch' : 'center'};
        min-height: 100vh;
        margin: 0;
        box-sizing: border-box;
      }
      .preview-nav { display: ${s.navBar?.visible ? 'flex' : 'none'}; order: ${s.navBar?.order || 1}; width: var(--diy-nav-w); background: rgba(44,24,16,var(--diy-nav-alpha)); padding: 12px; border-radius: var(--diy-card-radius); gap: 8px; align-items: center; }
      .preview-nav .icon { width: var(--diy-nav-icon); height: var(--diy-nav-icon); border-radius: 50%; background: var(--diy-primary); }
      .preview-main { display: ${s.contentArea?.visible ? 'flex' : 'none'}; order: ${s.contentArea?.order || 2}; flex: 1; width: 100%; flex-direction: column; gap: var(--diy-gap); }
      .preview-card { background: rgba(255,255,255,0.6); border: var(--diy-card-border) solid var(--diy-secondary); border-radius: var(--diy-card-radius); padding: 16px; box-shadow: 0 ${Math.min((comp.cardShadow||0),4)}px ${Math.min((comp.cardShadow||0)*2,8)}px rgba(0,0,0,0.1); }
      .preview-btn { background: var(--diy-primary); color: #fff; border: none; border-radius: var(--diy-btn-radius); padding: var(--diy-btn-pad); cursor: pointer; font-family: var(--diy-font); font-size: var(--diy-body); }
      .preview-btn:hover { filter: brightness(${100 + (comp.buttonHover || 10)}%); }
      .preview-input { border: 1px solid var(--diy-input-border); border-radius: var(--diy-btn-radius); padding: 8px; font-family: var(--diy-font); font-size: var(--diy-body); background: transparent; color: var(--diy-text); }
      .preview-input:focus { outline: 2px solid var(--diy-input-focus); }
      .preview-side { display: ${s.sideBar?.visible ? 'flex' : 'none'}; order: ${s.sideBar?.order || 3}; width: ${s.sideBar?.width || '200px'}; background: rgba(0,0,0,0.05); border-radius: var(--diy-card-radius); padding: 12px; }
      .preview-bottom { display: ${s.bottomBar?.visible ? 'flex' : 'none'}; order: ${s.bottomBar?.order || 4}; width: 100%; padding: 12px; background: rgba(44,24,16,0.05); border-radius: var(--diy-card-radius); justify-content: center; }
      h1 { font-size: var(--diy-title); color: var(--diy-primary); margin: 0 0 8px; }
      p { font-size: var(--diy-body); margin: 0 0 6px; color: var(--diy-text); }
      small { font-size: var(--diy-small); color: var(--diy-secondary); }
    `;
  },

  /** 生成预览 HTML */
  _generatePreviewHTML(cfg) {
    const css = this._generatePreviewCSS(cfg);
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UI DIY 预览</title>
  <style>${css}</style>
</head>
<body>
  <div class="preview-nav">
    <div class="icon"></div>
    <span style="color:#fff;font-size:14px;">导航栏</span>
  </div>
  <div class="preview-main">
    <div class="preview-card">
      <h1>标题预览</h1>
      <p>正文内容预览：这是一段示例文字，用于展示当前字体、颜色和间距的视觉效果。</p>
      <small>辅助文字 / 次要信息</small>
    </div>
    <div class="preview-card" style="display:flex;gap:8px;flex-wrap:wrap;">
      <button class="preview-btn">主按钮</button>
      <button class="preview-btn" style="background:var(--diy-secondary);">次按钮</button>
      <button class="preview-btn" style="background:var(--diy-accent);">强调按钮</button>
    </div>
    <div class="preview-card">
      <input type="text" class="preview-input" placeholder="输入框预览..." style="width:100%;">
    </div>
  </div>
  <div class="preview-side">
    <p style="font-size:12px;">侧边栏区域</p>
  </div>
  <div class="preview-bottom">
    <small>底部栏区域</small>
  </div>
</body>
</html>`;
  },

  /** 更新预览 iframe */
  _updatePreview() {
    const iframe = document.getElementById('ui-diy-preview');
    if (!iframe || !this._currentConfig) return;
    const html = this._generatePreviewHTML(this._currentConfig);
    const blob = new Blob([html], { type: 'text/html' });
    if (this._previewBlobUrl) URL.revokeObjectURL(this._previewBlobUrl);
    this._previewBlobUrl = URL.createObjectURL(blob);
    iframe.src = this._previewBlobUrl;
    // 同时注入到全局 style 标签供主应用使用
    this._injectDynamicCSS();
  },

  /** 将当前配置注入为全局 CSS 变量 */
  _injectDynamicCSS() {
    const style = document.getElementById('ui-diy-dynamic');
    if (!style || !this._currentConfig) return;
    style.textContent = this._generatePreviewCSS(this._currentConfig);
  },

  /* ==================== 保存与重置 ==================== */

  /** 保存当前页面配置 */
  saveCurrentPageConfig() {
    if (!this._currentPage || !this._currentConfig) {
      App.toast('请先选择一个页面', 'warning');
      return;
    }
    this.savePageConfig(this._currentPage, this._currentConfig);
    App.toast(`「${this._currentPage}」配置已保存`, 'success');
  },

  /** 重置当前页面到默认 */
  resetCurrentPage() {
    if (!this._currentPage) { App.toast('请先选择一个页面', 'warning'); return; }
    this._currentConfig = JSON.parse(JSON.stringify(this.DEFAULT_PAGE_CONFIG));
    this.savePageConfig(this._currentPage, this._currentConfig);
    this._renderEditor();
    this._updatePreview();
    App.toast('当前页面已重置为默认配置', 'info');
  },

  /* ==================== 方案管理 ==================== */

  /** 打开方案管理弹窗 */
  openSchemeManager() {
    const data = this.getV2Data();
    const schemes = data.schemes || {};
    const active = data.activeSchemeId;
    const content = `
      <div style="max-height:60vh;overflow-y:auto;">
        <div style="display:flex;gap:8px;margin-bottom:12px;">
          <button class="btn btn-primary" onclick="UIDIY.saveAsScheme()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 保存当前为方案</button>
          <button class="btn btn-secondary" onclick="UIDIY.importScheme()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> 导入 JSON</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${Object.entries(schemes).map(([id, scheme]) => `
            <div style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid var(--border-color);border-radius:var(--border-radius-sm);background:${active===id?'rgba(201,162,39,0.1)':'var(--bg-sidebar)'};">
              <div style="flex:1;">
                <div style="font-weight:600;font-size:14px;">${scheme.name || id}</div>
                <div style="font-size:11px;color:var(--text-muted);">${scheme.desc || '无描述'}</div>
              </div>
              <button class="btn btn-sm btn-primary" onclick="UIDIY.applyScheme('${id}')">应用</button>
              <button class="btn btn-sm btn-secondary" onclick="UIDIY.exportScheme('${id}')">导出</button>
              <button class="btn btn-sm btn-danger" onclick="UIDIY.deleteScheme('${id}')">删除</button>
            </div>
          `).join('')}
          ${!Object.keys(schemes).length ? '<p style="color:var(--text-muted);font-size:13px;text-align:center;">暂无保存的方案</p>' : ''}
        </div>
      </div>
    `;
    App.modal({ title: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg> 方案管理', content, width: 520 });
  },

  /** 将当前配置保存为一个新方案 */
  saveAsScheme() {
    const name = prompt('请输入方案名称：', '我的自定义方案');
    if (!name) return;
    const data = this.getV2Data();
    if (!data.schemes) data.schemes = {};
    const id = 'scheme_' + Date.now();
    data.schemes[id] = {
      name,
      desc: prompt('方案描述（可选）：', '') || '',
      createdAt: new Date().toISOString(),
      // 保存当前页面配置的合并快照
      colors: this._currentConfig?.colors,
      typography: this._currentConfig?.typography,
      layout: this._currentConfig?.layout,
      components: this._currentConfig?.components,
      structure: this._currentConfig?.structure
    };
    this.saveV2Data(data);
    App.toast(`方案「${name}」已保存`, 'success');
    this.openSchemeManager();
  },

  /** 应用指定方案到全局 */
  applyScheme(schemeId) {
    const data = this.getV2Data();
    const scheme = data.schemes?.[schemeId];
    if (!scheme) { App.toast('方案不存在', 'error'); return; }
    data.activeSchemeId = schemeId;
    this.saveV2Data(data);
    // 应用方案配色到当前页面配置
    if (this._currentConfig) {
      if (scheme.colors) this._currentConfig.colors = { ...scheme.colors };
      if (scheme.typography) this._currentConfig.typography = { ...this._currentConfig.typography, ...scheme.typography };
      if (scheme.layout) this._currentConfig.layout = { ...this._currentConfig.layout, ...scheme.layout };
      if (scheme.components) this._currentConfig.components = { ...this._currentConfig.components, ...scheme.components };
      if (scheme.structure) this._currentConfig.structure = { ...scheme.structure };
      this._renderEditor();
      this._updatePreview();
    }
    this._refreshPageList();
    App.toast(`方案「${scheme.name}」已应用`, 'success');
  },

  /** 删除方案 */
  deleteScheme(schemeId) {
    if (!confirm('确定删除该方案吗？')) return;
    const data = this.getV2Data();
    if (data.schemes) delete data.schemes[schemeId];
    if (data.activeSchemeId === schemeId) data.activeSchemeId = null;
    this.saveV2Data(data);
    App.toast('方案已删除', 'info');
    this.openSchemeManager();
  },

  /** 导出方案为 JSON 文件 */
  exportScheme(schemeId) {
    const data = this.getV2Data();
    const scheme = data.schemes?.[schemeId];
    if (!scheme) return;
    const blob = new Blob([JSON.stringify(scheme, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ui-scheme-${scheme.name || schemeId}.json`;
    a.click();
    App.toast('方案已导出', 'success');
  },

  /** 导入方案 */
  importScheme() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const scheme = JSON.parse(ev.target.result);
          if (!scheme.name) { App.toast('无效的方案文件', 'error'); return; }
          const data = this.getV2Data();
          if (!data.schemes) data.schemes = {};
          const id = 'scheme_import_' + Date.now();
          data.schemes[id] = scheme;
          this.saveV2Data(data);
          App.toast(`方案「${scheme.name}」已导入`, 'success');
          this.openSchemeManager();
        } catch (err) {
          App.toast('导入失败：' + err.message, 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },

  /* ==================== Theme Editor v3 ==================== */
  /** 打开可视化主题编辑器 */
  openThemeEditor() {
    const content = this._renderThemeEditor();
    App.modal({ title: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.62 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg> 可视化主题编辑器', content, width: 600 });
    this._initThemeEditor();
  },

  _initThemeEditor() {
    const el = document.getElementById('theme-editor-content');
    if (!el) return;
    this._themePreviewConfig = this._getDefaultThemeConfig();
    this._injectThemePreviewCSS();
  },

  _getDefaultThemeConfig() {
    const root = getComputedStyle(document.documentElement);
    return {
      colors: {
        bgBody: root.getPropertyValue('--bg-body').trim() || '#F5E6D3',
        bgCard: root.getPropertyValue('--bg-card').trim() || '#FFF8F0',
        textPrimary: root.getPropertyValue('--text-primary').trim() || '#2C1810',
        textSecondary: root.getPropertyValue('--text-secondary').trim() || '#5C4033',
        primary: root.getPropertyValue('--color-primary').trim() || '#8B4513',
        primaryDark: root.getPropertyValue('--color-primary-dark').trim() || '#5D3A1A',
        gold: root.getPropertyValue('--color-gold').trim() || '#C9A227',
        borderColor: root.getPropertyValue('--border-color').trim() || '#D4C4A8',
        borderGold: root.getPropertyValue('--border-gold').trim() || '#C9A227'
      },
      radius: {
        sm: parseInt(root.getPropertyValue('--border-radius-sm') || '8'),
        md: parseInt(root.getPropertyValue('--border-radius') || '12'),
        lg: parseInt(root.getPropertyValue('--border-radius-lg') || '24')
      },
      shadow: {
        sm: 1,
        md: 2,
        lg: 3
      }
    };
  },

  _renderThemeEditor() {
    const cfg = this._themePreviewConfig || this._getDefaultThemeConfig();
    return `
      <div id="theme-editor-content" style="display:flex;flex-direction:column;gap:16px;max-height:70vh;overflow-y:auto;">
        <!-- 预设主题快捷选择 -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${Object.entries(BUILT_IN_THEMES || {}).map(([id, t]) => `
            <button class="btn btn-sm btn-secondary" onclick="UIDIY.previewPresetTheme('${id}')" style="font-size:12px;">${t.name}</button>
          `).join('')}
        </div>

        <!-- 调色板 -->
        <div class="card">
          <div class="card-header"><h4>调色板</h4></div>
          <div class="card-body" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
            ${this._renderColorInput('页面背景', cfg.colors.bgBody, 'bgBody')}
            ${this._renderColorInput('卡片背景', cfg.colors.bgCard, 'bgCard')}
            ${this._renderColorInput('主文字', cfg.colors.textPrimary, 'textPrimary')}
            ${this._renderColorInput('次文字', cfg.colors.textSecondary, 'textSecondary')}
            ${this._renderColorInput('主色', cfg.colors.primary, 'primary')}
            ${this._renderColorInput('深色', cfg.colors.primaryDark, 'primaryDark')}
            ${this._renderColorInput('金色/强调', cfg.colors.gold, 'gold')}
            ${this._renderColorInput('边框', cfg.colors.borderColor, 'borderColor')}
            ${this._renderColorInput('金色边框', cfg.colors.borderGold, 'borderGold')}
          </div>
        </div>

        <!-- 滑块控制 -->
        <div class="card">
          <div class="card-header"><h4>形状与阴影</h4></div>
          <div class="card-body">
            ${this._renderThemeSlider('圆角大小', cfg.radius.sm, 0, 32, 'px', 'radius.sm')}
            ${this._renderThemeSlider('阴影强度', cfg.shadow.md, 0, 5, '级', 'shadow.md')}
          </div>
        </div>

        <!-- 实时预览区 -->
        <div class="card" id="theme-preview-card">
          <div class="card-header"><h4><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> 实时预览</h4></div>
          <div class="card-body" id="theme-live-preview">
            ${this._renderThemePreviewHTML()}
          </div>
        </div>

        <!-- 操作按钮 -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <input type="text" id="custom-theme-name" placeholder="输入主题名称..." style="flex:1;min-width:120px;font-size:13px;padding:6px 10px;border:1px solid var(--border-color);border-radius:var(--border-radius-sm);background:var(--bg-input);color:var(--text-primary);">
          <button class="btn btn-primary" onclick="UIDIY.saveCustomTheme()">保存主题</button>
          <button class="btn btn-gold" onclick="UIDIY.applyPreviewTheme()">应用预览</button>
          <button class="btn btn-secondary" onclick="UIDIY.exportCustomTheme()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>导出JSON</button>
          <button class="btn btn-secondary" onclick="UIDIY.importCustomTheme()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>导入</button>
        </div>

        <!-- 已保存主题列表 -->
        <div id="custom-theme-list" style="display:flex;flex-direction:column;gap:6px;">
          ${this._renderCustomThemeList()}
        </div>

        <!-- 隐藏的文件导入input -->
        <input type="file" id="theme-import-input" accept=".json" style="display:none;" onchange="UIDIY._handleThemeImport(this)">

        <!-- 动态预览style -->
        <style id="theme-preview-style"></style>
      </div>
    `;
  },

  _renderColorInput(label, value, key) {
    const id = 'theme_color_' + key;
    return `
      <div style="display:flex;align-items:center;gap:6px;">
        <input type="color" id="${id}" value="${value}"
          oninput="UIDIY.updateThemeColor('${key}', this.value)"
          style="width:32px;height:28px;padding:0;border:none;cursor:pointer;background:none;flex-shrink:0;">
        <div style="flex:1;min-width:0;">
          <div style="font-size:12px;font-weight:500;">${label}</div>
          <div style="font-size:10px;color:var(--text-muted);font-family:monospace;">${value}</div>
        </div>
      </div>
    `;
  },

  _renderThemeSlider(label, value, min, max, unit, path) {
    const id = 'theme_slider_' + path.replace(/\./g, '_');
    return `
      <div style="margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:2px;">
          <span>${label}</span>
          <span id="${id}_val" style="color:var(--color-gold);font-weight:600;">${value}${unit}</span>
        </div>
        <input type="range" min="${min}" max="${max}" value="${value}"
          oninput="UIDIY.handleThemeSlider('${path}', this.value, '${id}_val', '${unit}')"
          style="width:100%;cursor:pointer;">
      </div>
    `;
  },

  _renderThemePreviewHTML() {
    return `
      <div id="theme-preview-box" style="padding:12px;border-radius:var(--preview-radius,12px);border:1px solid var(--preview-border,#D4C4A8);background:var(--preview-bg,#FFF8F0);">
        <h5 style="margin:0 0 8px;color:var(--preview-primary,#2C1810);">标题预览</h5>
        <p style="margin:0 0 6px;color:var(--preview-text,#5C4033);font-size:14px;">正文内容预览文字</p>
        <div style="display:flex;gap:8px;margin-top:10px;">
          <button style="padding:6px 14px;border:none;border-radius:var(--preview-radius,6px);background:var(--preview-accent,#8B4513);color:#fff;font-size:13px;cursor:pointer;">主按钮</button>
          <button style="padding:6px 14px;border:none;border-radius:var(--preview-radius,6px);background:var(--preview-gold,#C9A227);color:#fff;font-size:13px;cursor:pointer;">金色按钮</button>
        </div>
      </div>
    `;
  },

  _renderCustomThemeList() {
    let customs = {};
    try { customs = Storage.get('app_custom_themes_v1', {}); } catch(e) {}
    const themes = { ...customs };
    if (!Object.keys(themes).length) {
      return '<p style="font-size:12px;color:var(--text-muted);text-align:center;">暂无自定义主题，请创建并保存</p>';
    }
    return Object.entries(themes).map(([id, t]) => `
      <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--border-color);border-radius:var(--border-radius-sm);background:var(--bg-sidebar);">
        <div style="width:16px;height:16px;border-radius:4px;background:${t.colors?.primary || '#888'};flex-shrink:0;"></div>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:600;">${t.name || id}</div>
          <div style="font-size:10px;color:var(--text-muted);">${new Date(t.createdAt || Date.now()).toLocaleDateString()}</div>
        </div>
        <button class="btn btn-sm btn-primary" onclick="UIDIY.applyCustomTheme('${id}')">应用</button>
        <button class="btn btn-sm btn-secondary" onclick="UIDIY.exportOneCustomTheme('${id}')">导出</button>
        <button class="btn btn-sm btn-danger" onclick="UIDIY.deleteCustomTheme('${id}')">删除</button>
      </div>
    `).join('');
  },

  /* --- 实时交互 --- */
  updateThemeColor(key, value) {
    if (!this._themePreviewConfig) this._themePreviewConfig = this._getDefaultThemeConfig();
    if (!this._themePreviewConfig.colors) this._themePreviewConfig.colors = {};
    this._themePreviewConfig.colors[key] = value;
    this._injectThemePreviewCSS();
  },

  handleThemeSlider(path, value, valId, unit) {
    if (!this._themePreviewConfig) this._themePreviewConfig = this._getDefaultThemeConfig();
    const num = unit === 'x' || unit === '' ? parseFloat(value) : parseInt(value, 10);
    const keys = path.split('.');
    let target = this._themePreviewConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!target[keys[i]]) target[keys[i]] = {};
      target = target[keys[i]];
    }
    target[keys[keys.length - 1]] = num;
    const el = document.getElementById(valId);
    if (el) el.textContent = num + unit;
    this._injectThemePreviewCSS();
  },

  _injectThemePreviewCSS() {
    const cfg = this._themePreviewConfig;
    if (!cfg) return;
    const c = cfg.colors || {};
    const r = cfg.radius || {};
    const s = cfg.shadow || {};
    // 计算阴影
    const shadowVal = (level) => {
      const l = parseInt(level || 1);
      if (l <= 0) return 'none';
      return `0 ${l * 2}px ${l * 4}px rgba(0,0,0,${0.05 + l * 0.03})`;
    };
    const style = document.getElementById('theme-preview-style');
    if (style) {
      style.textContent = `
        #theme-preview-box {
          --preview-bg: ${c.bgBody || '#FFF8F0'};
          --preview-card-bg: ${c.bgCard || '#FFF8F0'};
          --preview-primary: ${c.primary || '#2C1810'};
          --preview-text: ${c.textSecondary || '#5C4033'};
          --preview-accent: ${c.primary || '#8B4513'};
          --preview-gold: ${c.gold || '#C9A227'};
          --preview-border: ${c.borderColor || '#D4C4A8'};
          --preview-radius: ${r.sm || 8}px;
          background: ${c.bgBody || '#FFF8F0'};
          border-color: ${c.borderColor || '#D4C4A8'};
          border-radius: ${r.sm || 8}px;
          box-shadow: ${shadowVal(s.md)};
        }
        #theme-preview-box h5 { color: ${c.textPrimary || '#2C1810'}; }
        #theme-preview-box p { color: ${c.textSecondary || '#5C4033'}; }
        #theme-preview-box button:nth-child(1) { background: ${c.primary || '#8B4513'}; }
        #theme-preview-box button:nth-child(2) { background: ${c.gold || '#C9A227'}; }
      `;
    }
  },

  /* --- 预设主题预览 --- */
  previewPresetTheme(themeId) {
    const theme = (typeof BUILT_IN_THEMES !== 'undefined' && BUILT_IN_THEMES[themeId]) || {};
    if (!theme.colors) return;
    this._themePreviewConfig = {
      colors: { ...theme.colors },
      radius: { ...theme.radius },
      shadow: { sm: 1, md: 2, lg: 3 }
    };
    // 重新渲染编辑器内容
    const container = document.getElementById('theme-editor-content');
    if (container) {
      // 仅更新 preview 区域和 CSS
      const previewCard = document.getElementById('theme-live-preview');
      if (previewCard) previewCard.innerHTML = this._renderThemePreviewHTML();
      // 更新调色板显示值
      Object.entries(theme.colors || {}).forEach(([key, val]) => {
        const id = 'theme_color_' + key;
        const el = document.getElementById(id);
        if (el) el.value = val;
      });
      this._injectThemePreviewCSS();
    }
    App.toast(`已加载「${theme.name || themeId}」到预览`, 'info');
  },

  /* --- 保存自定义主题 --- */
  saveCustomTheme() {
    const nameInput = document.getElementById('custom-theme-name');
    const name = (nameInput?.value || '').trim();
    if (!name) { App.toast('请输入主题名称', 'error'); return; }
    if (!this._themePreviewConfig) { App.toast('请调整预览后保存', 'error'); return; }
    let customs = {};
    try { customs = Storage.get('app_custom_themes_v1', {}); } catch(e) {}
    const id = 'custom_' + Date.now();
    customs[id] = {
      name,
      colors: { ...this._themePreviewConfig.colors },
      radius: { ...this._themePreviewConfig.radius },
      shadows: {
        sm: `0 2px ${this._themePreviewConfig.radius.sm || 8}px rgba(0,0,0,0.08)`,
        md: `0 4px ${(this._themePreviewConfig.radius.sm || 8) * 2}px rgba(0,0,0,0.12)`,
        lg: `0 8px ${(this._themePreviewConfig.radius.sm || 8) * 4}px rgba(0,0,0,0.16)`
      },
      createdAt: new Date().toISOString()
    };
    try { Storage.set('app_custom_themes_v1', customs); } catch(e) {
      App.toast('保存失败: ' + e.message, 'error'); return;
    }
    // 注册到 App.themes
    if (typeof App !== 'undefined' && App.registerTheme) {
      App.registerTheme(id, customs[id]);
    }
    // 刷新列表
    const listEl = document.getElementById('custom-theme-list');
    if (listEl) listEl.innerHTML = this._renderCustomThemeList();
    if (nameInput) nameInput.value = '';
    App.toast(`主题「${name}」已保存`, 'success');
  },

  /* --- 删除自定义主题 --- */
  deleteCustomTheme(id) {
    if (!confirm('确定删除该自定义主题吗？')) return;
    let customs = {};
    try { customs = Storage.get('app_custom_themes_v1', {}); } catch(e) {}
    if (customs[id]) {
      delete customs[id];
      try { Storage.set('app_custom_themes_v1', customs); } catch(e) {}
    }
    // 从 App.themes 移除
    if (typeof App !== 'undefined' && App.themes && App.themes[id]) {
      delete App.themes[id];
    }
    const listEl = document.getElementById('custom-theme-list');
    if (listEl) listEl.innerHTML = this._renderCustomThemeList();
    App.toast('主题已删除', 'info');
  },

  /* --- 应用自定义主题 --- */
  applyCustomTheme(id) {
    let customs = {};
    try { customs = Storage.get('app_custom_themes_v1', {}); } catch(e) {}
    const theme = customs[id];
    if (!theme) { App.toast('主题不存在', 'error'); return; }
    if (typeof App !== 'undefined' && App.applyTheme) {
      App.applyTheme(id);
    } else {
      App.toast('主题系统未就绪', 'error');
    }
  },

  /* --- 应用预览主题（即时生效） --- */
  applyPreviewTheme() {
    if (!this._themePreviewConfig) { App.toast('请先调整预览', 'error'); return; }
    const cfg = this._themePreviewConfig;
    const root = document.documentElement;
    const c = cfg.colors || {};
    const r = cfg.radius || {};
    if (c.bgBody) root.style.setProperty('--bg-body', c.bgBody);
    if (c.bgCard) root.style.setProperty('--bg-card', c.bgCard);
    if (c.textPrimary) root.style.setProperty('--text-primary', c.textPrimary);
    if (c.textSecondary) root.style.setProperty('--text-secondary', c.textSecondary);
    if (c.primary) root.style.setProperty('--color-primary', c.primary);
    if (c.primaryDark) root.style.setProperty('--color-primary-dark', c.primaryDark);
    if (c.gold) root.style.setProperty('--color-gold', c.gold);
    if (c.borderColor) root.style.setProperty('--border-color', c.borderColor);
    if (c.borderGold) root.style.setProperty('--border-gold', c.borderGold);
    if (r.sm) {
      root.style.setProperty('--border-radius-sm', r.sm + 'px');
      root.style.setProperty('--border-radius', (r.sm + 4) + 'px');
      root.style.setProperty('--border-radius-lg', (r.sm * 3) + 'px');
    }
    App.toast('预览主题已临时应用（刷新后恢复）', 'success');
  },

  /* --- 导出自定义主题 --- */
  exportCustomTheme() {
    if (!this._themePreviewConfig) { App.toast('无可导出内容', 'error'); return; }
    const blob = new Blob([JSON.stringify(this._themePreviewConfig, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `theme-preview-${Date.now()}.json`;
    a.click();
    App.toast('主题已导出为JSON', 'success');
  },

  exportOneCustomTheme(id) {
    let customs = {};
    try { customs = Storage.get('app_custom_themes_v1', {}); } catch(e) {}
    const theme = customs[id];
    if (!theme) { App.toast('主题不存在', 'error'); return; }
    const blob = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `theme-${theme.name || id}.json`;
    a.click();
    App.toast('主题已导出', 'success');
  },

  /* --- 导入自定义主题 --- */
  importCustomTheme() {
    const input = document.getElementById('theme-import-input');
    if (input) input.click();
  },

  _handleThemeImport(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        // 校验格式
        if (!data.colors) { App.toast('无效的主题文件（缺少colors）', 'error'); return; }
        this._themePreviewConfig = {
          colors: data.colors || {},
          radius: data.radius || { sm: 8, md: 12, lg: 24 },
          shadow: data.shadow || { sm: 1, md: 2, lg: 3 }
        };
        // 如果文件包含name，询问是否直接保存
        const container = document.getElementById('theme-editor-content');
        if (container) {
          container.innerHTML = this._renderThemeEditor();
          this._injectThemePreviewCSS();
        }
        if (data.name && confirm(`主题「${data.name}」已导入，是否保存到列表？`)) {
          let customs = {};
          try { customs = Storage.get('app_custom_themes_v1', {}); } catch(e) {}
          const id = 'import_' + Date.now();
          customs[id] = { ...data, createdAt: new Date().toISOString() };
          try { Storage.set('app_custom_themes_v1', customs); } catch(e) {}
          if (typeof App !== 'undefined' && App.registerTheme) App.registerTheme(id, customs[id]);
          const listEl = document.getElementById('custom-theme-list');
          if (listEl) listEl.innerHTML = this._renderCustomThemeList();
          App.toast(`主题「${data.name}」已保存`, 'success');
        } else {
          App.toast('主题已加载到预览', 'info');
        }
      } catch (err) {
        App.toast('导入失败: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    input.value = '';
  },

  /* ==================== AI 小助手一键美化 ==================== */

  /** 打开 AI 一键美化对话框 */
  aiBeautify() {
    const desc = prompt('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg> 描述你想要的美化效果：', '更古风一些，加重金色元素，字体更优雅');
    if (!desc) return;
    App.toast('AI 正在分析并生成美化方案...', 'info');
    // 模拟 AI 分析（实际接入 AI 接口）
    setTimeout(() => {
      this._generateAIBeautify(desc);
    }, 800);
  },

  /** 根据用户描述生成 CSS 调整方案 */
  async _generateAIBeautify(desc) {
    try {
      // 构造 AI 提示词
      const prompt = `用户希望对视觉小说 UI 进行美化，描述如下："${desc}"
请根据描述生成一个 JSON 配置对象，包含以下字段（只返回 JSON，不要其他文字）：
{
  "colors": { "primary": "#hex", "background": "#hex", "text": "#hex", "secondary": "#hex", "accent": "#hex" },
  "typography": { "fontFamily": "字体", "titleSize": 数字, "bodySize": 数字, "lineHeight": 数字 },
  "layout": { "direction": "left/center/right/full", "arrangement": "horizontal/vertical/grid", "padding": 数字, "gap": 数字 }
}`;
      // 尝试调用 AI API（若可用）
      let config = null;
      if (typeof APISettings !== 'undefined' && APISettings.chat) {
        const result = await APISettings.chat(prompt, [], { useAux: true });
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        config = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      }
      // 若 AI 不可用，使用内置启发式规则生成
      if (!config) {
        config = this._heuristicBeautify(desc);
      }
      // 预览模式：应用但不保存
      if (config.colors && this._currentConfig) {
        this._currentConfig.colors = { ...this._currentConfig.colors, ...config.colors };
      }
      if (config.typography && this._currentConfig) {
        this._currentConfig.typography = { ...this._currentConfig.typography, ...config.typography };
      }
      if (config.layout && this._currentConfig) {
        this._currentConfig.layout = { ...this._currentConfig.layout, ...config.layout };
      }
      this._renderEditor();
      this._updatePreview();
      // 询问确认
      if (confirm('AI 已生成美化预览，是否应用并保存？')) {
        this.saveCurrentPageConfig();
        App.toast('AI 美化方案已应用', 'success');
      } else {
        App.toast('已取消，可继续调整或重置', 'info');
      }
    } catch (e) {
      App.toast('AI 美化失败: ' + e.message, 'error');
    }
  },

  /** 启发式美化规则（当 AI 不可用时降级使用） */
  _heuristicBeautify(desc) {
    const d = desc.toLowerCase();
    const config = {};
    if (d.includes('古风') || d.includes('传统') || d.includes('墨')) {
      config.colors = { primary: '#C9A227', background: '#F5E6D3', text: '#2C1810', secondary: '#8B7355', accent: '#D4AF37' };
      config.typography = { fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif', titleSize: 26, bodySize: 16, lineHeight: 1.7 };
    }
    if (d.includes('金色') || d.includes('金')) {
      config.colors = config.colors || {};
      config.colors.primary = '#D4AF37';
      config.colors.accent = '#FFD700';
    }
    if (d.includes('暗') || d.includes('夜') || d.includes('黑')) {
      config.colors = { primary: '#4a9eff', background: '#1a1a2e', text: '#e0e0e0', secondary: '#888888', accent: '#6bb5ff' };
    }
    if (d.includes('明亮') || d.includes('清新')) {
      config.colors = { primary: '#42b883', background: '#f8fafc', text: '#2c3e50', secondary: '#64748b', accent: '#33a06f' };
    }
    if (d.includes('简约') || d.includes('现代')) {
      config.colors = { primary: '#333333', background: '#FFFFFF', text: '#1a1a1a', secondary: '#666666', accent: '#000000' };
      config.typography = { fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', titleSize: 22, bodySize: 15, lineHeight: 1.5 };
      config.layout = { direction: 'full', arrangement: 'vertical', padding: 32, gap: 20 };
    }
    if (d.includes('优雅') || d.includes('优雅')) {
      config.typography = config.typography || {};
      config.typography.lineHeight = 1.8;
      config.typography.letterSpacing = 0.5;
    }
    return config;
  },

  /* ==================== 保留 v3 原有方法（兼容层） ==================== */

  /** 获取按键映射（兼容 v3） */
  getKeyMap() { return Storage.get('uiKeyMap', this.DEFAULT_KEYS); },

  /** 保存按键映射（兼容 v3） */
  saveKeyMap(m) { Storage.set('uiKeyMap', m); },

  /** 获取按钮配置（兼容 v3） */
  getButtons() { return Storage.get('uiButtons', this.DEFAULT_BUTTONS); },

  /** 保存按钮配置（兼容 v3） */
  saveButtons(b) { Storage.set('uiButtons', b); },

  /** 获取布局配置（兼容 v3） */
  getLayout() { return Storage.get('uiLayout', this.DEFAULT_LAYOUT); },

  /** 保存布局配置（兼容 v3） */
  saveLayout(l) { Storage.set('uiLayout', l); },

  /* ==================== 以下方法保留 v3 渲染逻辑 ==================== */

  /** 渲染按键映射列表（兼容 v3 标签页） */
  renderKeyMap() {
    const grid = document.getElementById('keyMapGrid');
    if (!grid) return;
    const map = this.getKeyMap();
    grid.innerHTML = Object.entries(map).map(([key, val]) => `
      <div style="display:flex;align-items:center;gap:12px;padding:8px;background:var(--bg-sidebar);border-radius:var(--border-radius-sm);">
        <div style="min-width:80px;text-align:center;">
          <span style="background:var(--bg-input);padding:4px 12px;border-radius:4px;font-family:monospace;font-size:13px;border:1px solid var(--border-color);">${val.ctrl ? 'Ctrl+' : ''}${key.replace('Key','').replace('Arrow','')}</span>
        </div>
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:500;">${val.label}</div>
          <div style="font-size:12px;color:var(--text-muted);">${val.desc}</div>
        </div>
        <select onchange="UIDIY.updateKeyAction('${key}',this.value)" style="width:auto;font-size:12px;">
          <option value="send" ${val.action==='send'?'selected':''}>发送</option>
          <option value="skip" ${val.action==='skip'?'selected':''}>跳过</option>
          <option value="auto" ${val.action==='auto'?'selected':''}>自动</option>
          <option value="save" ${val.action==='save'?'selected':''}>存档</option>
          <option value="load" ${val.action==='load'?'selected':''}>读档</option>
          <option value="history" ${val.action==='history'?'selected':''}>历史</option>
          <option value="choices" ${val.action==='choices'?'selected':''}>选项</option>
          <option value="menu" ${val.action==='menu'?'selected':''}>菜单</option>
        </select>
        <button class="btn btn-sm btn-danger" onclick="UIDIY.removeKey('${key}')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
    `).join('');
  },

  /** 更新按键动作（兼容 v3） */
  updateKeyAction(key, action) {
    const map = this.getKeyMap();
    if (map[key]) map[key].action = action;
    this.saveKeyMap(map);
  },

  /** 删除按键（兼容 v3） */
  removeKey(key) {
    const map = this.getKeyMap();
    delete map[key];
    this.saveKeyMap(map);
    this.renderKeyMap();
  },

  /** 添加按键映射（兼容 v3） */
  addKeyMap() {
    const key = document.getElementById('newKey')?.value?.trim();
    const action = document.getElementById('newKeyAction')?.value;
    const label = document.getElementById('newKeyLabel')?.value?.trim();
    const ctrl = document.getElementById('newKeyCtrl')?.checked;
    if (!key || !label) { App.toast('请填写完整信息', 'error'); return; }
    const map = this.getKeyMap();
    map[key] = { action, label, desc: '自定义', ctrl };
    this.saveKeyMap(map);
    document.getElementById('newKey').value = '';
    document.getElementById('newKeyLabel').value = '';
    this.renderKeyMap();
    App.toast('按键映射已添加', 'success');
  },

  /** 从表单保存按键映射（兼容 v3） */
  saveKeyMapFromForm() { App.toast('按键映射已保存', 'success'); },

  /** 重置按键（兼容 v3） */
  resetKeys() { this.saveKeyMap({ ...this.DEFAULT_KEYS }); this.renderKeyMap(); App.toast('已恢复默认', 'info'); },

  /** 渲染按钮列表（兼容 v3） */
  renderButtonList() {
    const c = document.getElementById('buttonList');
    if (!c) return;
    const buttons = this.getButtons();
    c.innerHTML = buttons.map((btn, i) => `
      <div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--bg-sidebar);border-radius:var(--border-radius-sm);cursor:move;" draggable="true" ondragstart="UIDIY.dragStart(event,${i})" ondragover="UIDIY.dragOver(event)" ondrop="UIDIY.drop(event,${i})">
        <span style="cursor:move;color:var(--text-muted);">⋮⋮</span>
        <span style="font-size:18px;">${btn.icon}</span>
        <div style="flex:1;">
          <input type="text" value="${btn.label}" onchange="UIDIY.updateButton(${i},'label',this.value)" style="font-size:13px;padding:2px 6px;width:100%;">
        </div>
        <select onchange="UIDIY.updateButton(${i},'style',this.value)" style="width:auto;font-size:12px;">
          <option value="primary" ${btn.style==='primary'?'selected':''}>主按钮</option>
          <option value="secondary" ${btn.style==='secondary'?'selected':''}>次按钮</option>
          <option value="icon" ${btn.style==='icon'?'selected':''}>图标</option>
          <option value="danger" ${btn.style==='danger'?'selected':''}>危险</option>
        </select>
        <select onchange="UIDIY.updateButton(${i},'position',this.value)" style="width:auto;font-size:12px;">
          <option value="bottom-right" ${btn.position==='bottom-right'?'selected':''}>右下</option>
          <option value="bottom-left" ${btn.position==='bottom-left'?'selected':''}>左下</option>
          <option value="top-right" ${btn.position==='top-right'?'selected':''}>右上</option>
          <option value="top-left" ${btn.position==='top-left'?'selected':''}>左上</option>
        </select>
        <label style="display:flex;align-items:center;gap:4px;font-size:12px;"><input type="checkbox" ${btn.visible?'checked':''} onchange="UIDIY.updateButton(${i},'visible',this.checked)" style="width:auto;"> 显示</label>
        <button class="btn btn-sm btn-danger" onclick="UIDIY.removeButton(${i})"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
    `).join('');
  },

  /** 开始拖拽按钮（兼容 v3） */
  dragStart(e, index) { this._draggedIndex = index; e.dataTransfer.effectAllowed = 'move'; },

  /** 拖拽经过按钮（兼容 v3） */
  dragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; },

  /** 放置按钮（兼容 v3） */
  drop(e, index) {
    e.preventDefault();
    if (this._draggedIndex === undefined || this._draggedIndex === index) return;
    const buttons = this.getButtons();
    const [moved] = buttons.splice(this._draggedIndex, 1);
    buttons.splice(index, 0, moved);
    this.saveButtons(buttons);
    this.renderButtonList();
  },

  /** 更新按钮属性（兼容 v3） */
  updateButton(i, field, value) {
    const buttons = this.getButtons();
    buttons[i][field] = value;
    this.saveButtons(buttons);
  },

  /** 删除按钮（兼容 v3） */
  removeButton(i) {
    const buttons = this.getButtons();
    buttons.splice(i, 1);
    this.saveButtons(buttons);
    this.renderButtonList();
  },

  /** 添加自定义按钮（兼容 v3） */
  addCustomButton() {
    const label = prompt('按钮名称：'); if (!label) return;
    const buttons = this.getButtons();
    buttons.push({ id: 'btn_custom_' + Date.now(), label, icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>', position: 'bottom-right', style: 'secondary', action: 'custom', visible: true });
    this.saveButtons(buttons);
    this.renderButtonList();
  },

  /** 从表单保存按钮（兼容 v3） */
  saveButtonsFromForm() { App.toast('按钮配置已保存', 'success'); },

  /** 重置按钮（兼容 v3） */
  resetButtons() { this.saveButtons([...this.DEFAULT_BUTTONS]); this.renderButtonList(); App.toast('已恢复默认', 'info'); },

  /** 加载布局（兼容 v3） */
  loadLayout() {
    const layout = this.getLayout();
    const d = document.getElementById('layout_dialog'); if (d) d.value = layout.dialogPosition;
    const s = document.getElementById('layout_status'); if (s) s.value = layout.statusBarPosition;
    const p = document.getElementById('layout_portrait'); if (p) p.value = layout.portraitPosition;
  },

  /** 保存布局（兼容 v3，同时写入 v2 结构） */
  saveLayoutCfg() {
    const layout = {
      dialogPosition: document.getElementById('layout_dialog')?.value || 'bottom',
      statusBarPosition: document.getElementById('layout_status')?.value || 'top-left',
      portraitPosition: document.getElementById('layout_portrait')?.value || 'center-right'
    };
    this.saveLayout(layout);
    App.toast('布局已保存', 'success');
  },

  /** 渲染预览（兼容 v3） */
  renderPreview() {
    const area = document.getElementById('previewButtons');
    if (!area) return;
    const buttons = this.getButtons().filter(b => b.visible);
    area.innerHTML = buttons.map(b => `
      <button class="btn btn-${b.style === 'icon' ? 'sm btn-secondary' : b.style}" style="font-size:${b.style==='icon'?'16px':'13px'};">${b.icon}</button>
    `).join('');
  },

  /** AI 生成 UI 配置（兼容 v3） */
  async aiGenerateUI() {
    const desc = prompt('描述你想要的 UI 交互风格（如：古风简洁、易次元风格、现代科幻）：', '古风简洁，按钮在底部');
    if (!desc) return;
    App.toast('AI 正在生成 UI 配置...', 'info');
    try {
      const prompt = `根据以下描述生成视觉小说 UI 配置 JSON。描述："${desc}"
返回 JSON 格式：{"keys": {"按键名": {"action":"动作","label":"标签"}}, "buttons": [{"label":"名称","icon":"emoji","position":"位置","style":"样式"}], "layout": {"dialogPosition":"bottom/top/center","statusBarPosition":"top-left/top-right/bottom-left/bottom-right","portraitPosition":"center-right/center-left/full"}}
只返回 JSON，不要其他文字。`;
      if (typeof APISettings !== 'undefined' && APISettings.chat) {
        const result = await APISettings.chat(prompt, [], { useAux: true });
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        const config = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        if (!config) { App.toast('AI 未返回有效配置', 'error'); return; }
        if (config.keys) this.saveKeyMap(config.keys);
        if (config.buttons) this.saveButtons(config.buttons);
        if (config.layout) this.saveLayout(config.layout);
        this.renderKeyMap(); this.renderButtonList(); this.loadLayout();
        App.toast('AI 已生成并应用 UI 配置', 'success');
      } else {
        // 降级到启发式生成
        const cfg = this._heuristicBeautify(desc);
        if (cfg.layout) this.saveLayout(cfg.layout);
        App.toast('已应用启发式 UI 配置', 'success');
      }
    } catch (e) { App.toast('生成失败: ' + e.message, 'error'); }
  },

  /* ==================== 运行时集成（兼容 v3） ==================== */

  /** 键盘按下处理 */
  handleKeydown(event) {
    const map = this.getKeyMap();
    const keyName = event.code;
    const entry = map[keyName];
    if (!entry) return;
    if (entry.ctrl && !event.ctrlKey) return;
    event.preventDefault();
    this.executeAction(entry.action);
  },

  /** 执行动作 */
  executeAction(action) {
    switch (action) {
      case 'send': NovelRuntime?.playerSend?.(); break;
      case 'skip': NovelRuntime?._state?.timer && clearInterval(NovelRuntime._state.timer); break;
      case 'auto': NovelRuntime?.toggleAuto?.(); break;
      case 'save': NovelRuntime?.saveGame?.(); break;
      case 'load': NovelRuntime?.showSaves?.(); break;
      case 'history': NovelRuntime?.showHistory?.(); break;
      case 'choices': NovelRuntime?.requestChoices?.(); break;
      case 'menu': App.toggleSidebar(); break;
      default: console.log('Unknown action:', action);
    }
  }
};
