/**
 * =========================================================
 * UI DIY System v2 — 全面可视化页面定制
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
    { id: 'btn_send', label: '发送 ➤', icon: '➤', position: 'bottom-right', style: 'primary', action: 'send', visible: true },
    { id: 'btn_choices', label: '选项', icon: '🎯', position: 'bottom-right', style: 'secondary', action: 'choices', visible: true },
    { id: 'btn_auto', label: '⚡', icon: '⚡', position: 'bottom-left', style: 'icon', action: 'auto', visible: true },
    { id: 'btn_history', label: '📜', icon: '📜', position: 'bottom-left', style: 'icon', action: 'history', visible: true },
    { id: 'btn_save', label: '💾', icon: '💾', position: 'top-right', style: 'icon', action: 'save', visible: true },
    { id: 'btn_load', label: '📂', icon: '📂', position: 'top-right', style: 'icon', action: 'load', visible: true }
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
  init() { this.renderPage(); },

  /** 进入页面时的回调（保留 v3 兼容） */
  onEnter() { this.renderPage(); },

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
  renderPage() {
    const page = document.getElementById('page-ui-diy');
    if (!page) return;
    page.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:8px;">
        <h2 class="section-title">🎨 UI DIY v2 — 全面可视化页面定制</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-gold" onclick="UIDIY.openSchemeManager()">📁 方案管理</button>
          <button class="btn btn-primary" onclick="UIDIY.aiBeautify()">🤖 AI 一键美化</button>
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
              <h3>👁️ 实时预览</h3>
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
        <div class="card-header"><h3>📄 可定制页面</h3></div>
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
          <span style="font-size:20px;">${item.icon || '📄'}</span>
          <div style="flex:1;">
            <div style="font-weight:600;font-size:14px;">${item.label || pageId}</div>
            <div style="font-size:11px;opacity:0.8;">当前主题：${activeScheme}</div>
          </div>
          <span style="font-size:12px;">➤</span>
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
        <div class="tab active" onclick="UIDIY.switchEditorTab(event,'tab_layout')">📐 布局</div>
        <div class="tab" onclick="UIDIY.switchEditorTab(event,'tab_colors')">🎨 配色</div>
        <div class="tab" onclick="UIDIY.switchEditorTab(event,'tab_typo')">🔤 字体</div>
        <div class="tab" onclick="UIDIY.switchEditorTab(event,'tab_components')">🧩 组件</div>
        <div class="tab" onclick="UIDIY.switchEditorTab(event,'tab_drag')">🖱️ 拖拽</div>
      </div>

      <!-- 布局定制 -->
      <div class="tab-content active" id="tab_layout">
        <div class="card" style="margin-bottom:var(--space-sm);">
          <div class="card-header"><h4>📐 布局方向</h4></div>
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
          <div class="card-header"><h4>🔀 组件排列</h4></div>
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
          <div class="card-header"><h4>📏 间距微调</h4></div>
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
            <h4>🎨 预设方案</h4>
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
          <div class="card-header"><h4>🎨 自定义颜色</h4></div>
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
          <div class="card-header"><h4>🔤 字体家族</h4></div>
          <div class="card-body">
            <select onchange="UIDIY.updateConfig('typography.fontFamily',this.value)" style="width:100%;font-size:13px;">
              ${this.FONT_OPTIONS.map(f=>`<option value="${f.value}" ${cfg.typography.fontFamily===f.value?'selected':''}>${f.label}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h4>📐 字号与间距</h4></div>
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
          <div class="card-header"><h4>🔘 按钮样式</h4></div>
          <div class="card-body">
            ${this._renderSlider('圆角', cfg.components.buttonRadius, 0, 24, 'px', 'components.buttonRadius')}
            ${this._renderSlider('内边距', cfg.components.buttonPadding, 4, 24, 'px', 'components.buttonPadding')}
            ${this._renderSlider('悬停强度', cfg.components.buttonHover, 0, 30, '%', 'components.buttonHover')}
          </div>
        </div>
        <div class="card" style="margin-bottom:var(--space-sm);">
          <div class="card-header"><h4>📝 输入框样式</h4></div>
          <div class="card-body">
            ${this._renderColorPicker('边框颜色', cfg.components.inputBorder, 'components.inputBorder')}
            ${this._renderColorPicker('焦点颜色', cfg.components.inputFocus, 'components.inputFocus')}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h4>🧭 导航栏样式</h4></div>
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
            <h4>🖱️ 可视化拖拽布局</h4>
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
        <button class="btn btn-primary" onclick="UIDIY.saveCurrentPageConfig()">💾 保存当前页配置</button>
        <button class="btn btn-gold" onclick="UIDIY.saveAsScheme()">💾 存为方案</button>
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
            ${item.visible ? '👁️' : '🙈'}
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
          <button class="btn btn-primary" onclick="UIDIY.saveAsScheme()">➕ 保存当前为方案</button>
          <button class="btn btn-secondary" onclick="UIDIY.importScheme()">📥 导入 JSON</button>
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
    App.modal({ title: '📁 方案管理', content, width: 520 });
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

  /* ==================== AI 小助手一键美化 ==================== */

  /** 打开 AI 一键美化对话框 */
  aiBeautify() {
    const desc = prompt('🤖 描述你想要的美化效果：', '更古风一些，加重金色元素，字体更优雅');
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
        <button class="btn btn-sm btn-danger" onclick="UIDIY.removeKey('${key}')">✕</button>
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
        <button class="btn btn-sm btn-danger" onclick="UIDIY.removeButton(${i})">✕</button>
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
    buttons.push({ id: 'btn_custom_' + Date.now(), label, icon: '🔧', position: 'bottom-right', style: 'secondary', action: 'custom', visible: true });
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
