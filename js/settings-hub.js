/**
 * ============================================================
 * SettingsHub v14 — 全局设置总控中心
 * 古风墨境风格 / 暖羊皮纸底色 + 金色 + 墨色
 * 集中管理所有系统模块的运行状态（自动/手动/禁用）
 * ============================================================
 */
const SettingsHub = {
  // --- 常量配置 ---
  STORAGE_KEY: 'settings_hub_v14',
  MODULES_KEY: 'settings_hub_v14_modules',
  EVENT_CHANNEL: 'settings_hub',

  // --- 状态数据 ---
  modules: {},      // 已注册模块的元数据 { id: { name, icon, description, settings: [] } }
  settings: {},     // 每个模块的详细设置值 { moduleId: { key: value } }
  states: {},       // 每个模块的当前状态 { moduleId: 'auto'|'manual'|'disabled' }
  isGloballyPaused: false, // 全局暂停标志

  /**
   * 初始化设置总控中心
   * 从 localStorage 恢复数据，注册核心模块，绑定全局监听
   */
  init() {
    this._loadFromStorage();
    this._registerCoreModules();
    this._bindGlobalListeners();
    console.log('[SettingsHub] 初始化完成，已注册模块:', Object.keys(this.modules));
  },

  /**
   * 从 localStorage 加载保存的状态和设置
   */
  _loadFromStorage() {
    try {
      const raw = localStorage.getItem(this.MODULES_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        this.states = saved.states || {};
        this.settings = saved.settings || {};
        this.isGloballyPaused = saved.isGloballyPaused || false;
      }
    } catch (e) {
      console.warn('[SettingsHub] 加载存储失败:', e);
      this.states = {};
      this.settings = {};
      this.isGloballyPaused = false;
    }
  },

  /**
   * 将所有状态和设置保存到 localStorage
   */
  _saveToStorage() {
    try {
      const data = {
        states: this.states,
        settings: this.settings,
        isGloballyPaused: this.isGloballyPaused,
        savedAt: Date.now()
      };
      localStorage.setItem(this.MODULES_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[SettingsHub] 保存存储失败:', e);
    }
  },

  /**
   * 注册一个模块到设置总控中心
   * @param {string} id        — 模块唯一标识
   * @param {string} name      — 模块显示名称
   * @param {string} icon      — 模块图标（Emoji 或 SVG 字符串）
   * @param {string} description — 模块描述
   * @param {Array}  settings  — 设置项数组 [{ key, label, type, default, options?, min?, max?, onChange }]
   */
  registerModule(id, name, icon, description, settings = []) {
    if (!id || !name) {
      console.warn('[SettingsHub] 注册模块失败：id 和 name 不能为空');
      return;
    }

    this.modules[id] = { id, name, icon: icon || '⚙️', description: description || '', settings: settings || [] };

    // 若该模块无保存状态，默认设为 auto
    if (!this.states[id]) {
      this.states[id] = 'auto';
    }

    // 若该模块无保存设置，使用默认值初始化
    if (!this.settings[id]) {
      this.settings[id] = {};
      for (const s of settings) {
        if (s.key !== undefined) {
          this.settings[id][s.key] = s.default !== undefined ? s.default : this._getDefaultForType(s.type);
        }
      }
    }

    this._saveToStorage();
    console.log(`[SettingsHub] 模块已注册: ${id} (${name})`);

    // 发送注册事件
    if (typeof EventBridge !== 'undefined') {
      EventBridge.emit(this.EVENT_CHANNEL, 'module_registered', { id, name, state: this.states[id] }, 'SettingsHub');
    }
  },

  /**
   * 根据类型返回默认空值
   */
  _getDefaultForType(type) {
    switch (type) {
      case 'toggle': return false;
      case 'select': return '';
      case 'number': return 0;
      case 'text': return '';
      default: return null;
    }
  },

  /**
   * 设置模块运行状态
   * @param {string} moduleId — 模块 ID
   * @param {string} state    — 'auto' | 'manual' | 'disabled'
   */
  setModuleState(moduleId, state) {
    if (!this.modules[moduleId]) {
      console.warn(`[SettingsHub] 模块 ${moduleId} 未注册，无法设置状态`);
      return;
    }
    if (!['auto', 'manual', 'disabled'].includes(state)) {
      console.warn(`[SettingsHub] 无效状态: ${state}`);
      return;
    }

    const oldState = this.states[moduleId];
    this.states[moduleId] = state;
    this._saveToStorage();

    // 发送状态变更事件到 EventBridge
    if (typeof EventBridge !== 'undefined') {
      EventBridge.emit(this.EVENT_CHANNEL, 'state_changed', {
        moduleId,
        oldState,
        newState: state
      }, 'SettingsHub');
      // 同时发送到模块自身频道，便于模块直接监听
      EventBridge.emit(moduleId, 'settings_state_changed', {
        oldState,
        newState: state
      }, 'SettingsHub');
    }

    console.log(`[SettingsHub] 模块 ${moduleId} 状态: ${oldState} → ${state}`);

    // 若页面已渲染，更新对应卡片显示
    this._updateCardUI(moduleId);
    this._updateStatusBar();
  },

  /**
   * 获取模块当前状态
   * @param {string} moduleId
   * @returns {string} 'auto' | 'manual' | 'disabled'
   */
  getModuleState(moduleId) {
    return this.states[moduleId] || 'auto';
  },

  /**
   * 判断模块是否为自动模式
   */
  isModuleAuto(moduleId) {
    return this.getModuleState(moduleId) === 'auto';
  },

  /**
   * 判断模块是否为手动模式
   */
  isModuleManual(moduleId) {
    return this.getModuleState(moduleId) === 'manual';
  },

  /**
   * 判断模块是否被禁用
   */
  isModuleDisabled(moduleId) {
    return this.getModuleState(moduleId) === 'disabled';
  },

  /**
   * 判断模块当前是否正在运行
   * 运行定义：auto 模式且全局未暂停，或 manual 模式（随时准备响应用户操作）
   */
  isModuleRunning(moduleId) {
    const state = this.getModuleState(moduleId);
    if (state === 'disabled') return false;
    if (state === 'auto') return !this.isGloballyPaused;
    if (state === 'manual') return true;
    return false;
  },

  /**
   * 设置某个模块的单个设置项值
   * @param {string} moduleId
   * @param {string} key
   * @param {*} value
   */
  setSetting(moduleId, key, value) {
    if (!this.settings[moduleId]) this.settings[moduleId] = {};
    this.settings[moduleId][key] = value;
    this._saveToStorage();

    // 查找并触发 onChange 回调
    const moduleMeta = this.modules[moduleId];
    if (moduleMeta && moduleMeta.settings) {
      const settingDef = moduleMeta.settings.find(s => s.key === key);
      if (settingDef && typeof settingDef.onChange === 'function') {
        try { settingDef.onChange(value, key, moduleId); } catch (e) { console.warn('[SettingsHub] onChange 回调出错:', e); }
      }
    }

    // 发送设置变更事件
    if (typeof EventBridge !== 'undefined') {
      EventBridge.emit(this.EVENT_CHANNEL, 'setting_changed', { moduleId, key, value }, 'SettingsHub');
      EventBridge.emit(moduleId, 'settings_setting_changed', { key, value }, 'SettingsHub');
    }
  },

  /**
   * 获取某个模块的单个设置项值
   */
  getSetting(moduleId, key) {
    if (!this.settings[moduleId]) return undefined;
    return this.settings[moduleId][key];
  },

  // ==========================================================
  // 全局控制
  // ==========================================================

  /**
   * 全局暂停 — 一键暂停所有自动运行的模块
   */
  globalPause() {
    this.isGloballyPaused = true;
    this._saveToStorage();
    console.log('[SettingsHub] 全局暂停');

    if (typeof EventBridge !== 'undefined') {
      EventBridge.emit(this.EVENT_CHANNEL, 'global_pause', { paused: true }, 'SettingsHub');
    }
    this._updateAllCardsUI();
    this._updateStatusBar();
  },

  /**
   * 全局继续 — 一键恢复所有自动运行的模块
   */
  globalResume() {
    this.isGloballyPaused = false;
    this._saveToStorage();
    console.log('[SettingsHub] 全局继续');

    if (typeof EventBridge !== 'undefined') {
      EventBridge.emit(this.EVENT_CHANNEL, 'global_resume', { paused: false }, 'SettingsHub');
    }
    this._updateAllCardsUI();
    this._updateStatusBar();
  },

  /**
   * 全部切换为自动模式
   */
  setAllAuto() {
    for (const id of Object.keys(this.modules)) {
      this.states[id] = 'auto';
    }
    this._saveToStorage();
    console.log('[SettingsHub] 全部切换为自动模式');

    if (typeof EventBridge !== 'undefined') {
      EventBridge.emit(this.EVENT_CHANNEL, 'set_all_auto', {}, 'SettingsHub');
    }
    this._updateAllCardsUI();
    this._updateStatusBar();
  },

  /**
   * 全部切换为手动模式
   */
  setAllManual() {
    for (const id of Object.keys(this.modules)) {
      this.states[id] = 'manual';
    }
    this._saveToStorage();
    console.log('[SettingsHub] 全部切换为手动模式');

    if (typeof EventBridge !== 'undefined') {
      EventBridge.emit(this.EVENT_CHANNEL, 'set_all_manual', {}, 'SettingsHub');
    }
    this._updateAllCardsUI();
    this._updateStatusBar();
  },

  /**
   * 全部禁用
   */
  setAllDisabled() {
    for (const id of Object.keys(this.modules)) {
      this.states[id] = 'disabled';
    }
    this._saveToStorage();
    console.log('[SettingsHub] 全部禁用');

    if (typeof EventBridge !== 'undefined') {
      EventBridge.emit(this.EVENT_CHANNEL, 'set_all_disabled', {}, 'SettingsHub');
    }
    this._updateAllCardsUI();
    this._updateStatusBar();
  },

  // ==========================================================
  // 核心模块默认注册
  // ==========================================================

  /**
   * 系统启动时自动注册 11 个核心模块
   */
  _registerCoreModules() {
    // 1. NPC行为
    this.registerModule('npc-behavior', 'NPC行为', '👤', 'NPC 自动移动、互动与日程执行', [
      { key: 'moveInterval', label: '移动间隔(秒)', type: 'number', default: 30, min: 5, max: 300 },
      { key: 'autoInteract', label: '自动互动', type: 'toggle', default: true },
      { key: 'scheduleMode', label: '日程模式', type: 'select', default: 'full', options: ['full', 'daytime', 'night', 'none'] }
    ]);

    // 2. 天气时辰
    this.registerModule('weather', '天气时辰', '🌤️', '自动时间推进与天气变化', [
      { key: 'timeScale', label: '时间倍速', type: 'number', default: 1, min: 0.1, max: 10 },
      { key: 'autoSeason', label: '自动换季', type: 'toggle', default: true },
      { key: 'weatherIntensity', label: '天气强度', type: 'select', default: 'normal', options: ['light', 'normal', 'heavy', 'extreme'] }
    ]);

    // 3. 随机事件
    this.registerModule('random-events', '随机事件', '⚡', '自动事件触发', [
      { key: 'eventInterval', label: '事件间隔(分)', type: 'number', default: 15, min: 1, max: 120 },
      { key: 'eventTypes', label: '事件类型', type: 'select', default: 'all', options: ['all', 'encounter', 'item', 'story', 'combat'] },
      { key: 'nightEvents', label: '夜间事件', type: 'toggle', default: false }
    ]);

    // 4. 飞鸽传书
    this.registerModule('letter', '飞鸽传书', '🕊️', 'NPC 自动发送书信', [
      { key: 'letterInterval', label: '发信间隔(分)', type: 'number', default: 20, min: 5, max: 180 },
      { key: 'allowUrgent', label: '允许急件', type: 'toggle', default: true },
      { key: 'moodBased', label: '随心情发信', type: 'toggle', default: true }
    ]);

    // 5. 任务系统
    this.registerModule('quest', '任务系统', '📜', '任务自动推进与过期检测', [
      { key: 'autoAdvance', label: '自动推进', type: 'toggle', default: true },
      { key: 'expireWarning', label: '过期警告(时)', type: 'number', default: 24, min: 1, max: 168 },
      { key: 'autoComplete', label: '自动完成', type: 'toggle', default: false }
    ]);

    // 6. 场景系统
    this.registerModule('scene', '场景系统', '🏯', '场景自动更新与环境演化', [
      { key: 'autoUpdate', label: '自动更新', type: 'toggle', default: true },
      { key: 'detailLevel', label: '细节等级', type: 'select', default: 'normal', options: ['minimal', 'normal', 'rich', 'immersive'] },
      { key: 'npcDensity', label: 'NPC密度', type: 'number', default: 5, min: 0, max: 20 }
    ]);

    // 7. 群像对话
    this.registerModule('group-chat', '群像对话', '💬', '群像场景自动推进', [
      { key: 'autoAdvance', label: '自动推进', type: 'toggle', default: true },
      { key: 'turnDelay', label: '回合间隔(秒)', type: 'number', default: 3, min: 1, max: 30 },
      { key: 'maxSpeakers', label: '最大发言人数', type: 'number', default: 3, min: 2, max: 8 }
    ]);

    // 8. 徽章墙
    this.registerModule('badge-wall', '徽章墙', '🏆', '成就自动检测与解锁', [
      { key: 'autoCheck', label: '自动检测', type: 'toggle', default: true },
      { key: 'notifyUnlock', label: '解锁通知', type: 'toggle', default: true },
      { key: 'rareOnly', label: '仅稀有提醒', type: 'toggle', default: false }
    ]);

    // 9. 心情记录
    this.registerModule('mood', '心情记录', '💕', '自动记录 NPC 好感度变化', [
      { key: 'autoTrack', label: '自动追踪', type: 'toggle', default: true },
      { key: 'logInterval', label: '记录间隔(分)', type: 'number', default: 10, min: 1, max: 60 },
      { key: 'showIndicator', label: '显示心情指示器', type: 'toggle', default: true }
    ]);

    // 10. 关系网
    this.registerModule('relations', '关系网', '🕸️', 'NPC 关系自动演化', [
      { key: 'autoEvolve', label: '自动演化', type: 'toggle', default: true },
      { key: 'evolveSpeed', label: '演化速度', type: 'select', default: 'normal', options: ['slow', 'normal', 'fast'] },
      { key: 'conflictEnabled', label: '允许冲突', type: 'toggle', default: true }
    ]);

    // 11. 世界记事
    this.registerModule('world-notes', '世界记事', '📖', '自动从剧情捕捉重要事件', [
      { key: 'autoCapture', label: '自动捕捉', type: 'toggle', default: true },
      { key: 'captureDepth', label: '捕捉深度', type: 'select', default: 'major', options: ['all', 'major', 'minor'] },
      { key: 'maxEntries', label: '最大条目数', type: 'number', default: 100, min: 10, max: 1000 }
    ]);
  },

  // ==========================================================
  // 页面渲染
  // ==========================================================

  /**
   * 渲染设置总控页面
   * 创建一个全屏覆盖层，包含全局控制栏、模块卡片网格和底部状态栏
   * @param {string} containerId — 可选，指定挂载容器 ID；不提供则创建全屏浮层
   */
  renderPage(containerId) {
    const container = containerId ? document.getElementById(containerId) : null;

    if (container) {
      container.innerHTML = '';
      container.appendChild(this._buildPageDOM());
    } else {
      // 创建全屏浮层
      let overlay = document.getElementById('settings-hub-overlay');
      if (overlay) overlay.remove();

      overlay = document.createElement('div');
      overlay.id = 'settings-hub-overlay';
      overlay.appendChild(this._buildPageDOM());
      document.body.appendChild(overlay);
    }

    this._updateStatusBar();
    this._updateAllCardsUI();
    console.log('[SettingsHub] 页面已渲染');
  },

  /**
   * 关闭设置总控页面（仅限浮层模式）
   */
  closePage() {
    const overlay = document.getElementById('settings-hub-overlay');
    if (overlay) overlay.remove();
  },

  /**
   * 构建整个页面的 DOM 结构
   */
  _buildPageDOM() {
    const wrapper = document.createElement('div');
    wrapper.id = 'settings-hub-wrapper';

    // 注入 CSS 样式（古风墨境）
    const style = document.createElement('style');
    style.textContent = this._getCSS();
    wrapper.appendChild(style);

    // 页面容器
    const page = document.createElement('div');
        // 返回按钮
    const backBtn = document.createElement('div');
    backBtn.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px;';
    backBtn.innerHTML = `<button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button>`;
    page.appendChild(backBtn);

    page.className = 'settings-hub-page';

    // 顶部标题栏
    const header = document.createElement('div');
    header.className = 'sh-header';
    header.innerHTML = `
      <div class="sh-title">⚙️ 全局设置总控</div>
      <div class="sh-subtitle">管理所有系统模块的运行状态</div>
      <button class="sh-close-btn" title="关闭">✕</button>
    `;
    header.querySelector('.sh-close-btn').onclick = () => this.closePage();
    page.appendChild(header);

    // 全局控制栏
    const globalBar = document.createElement('div');
    globalBar.className = 'sh-global-bar';
    globalBar.innerHTML = `
      <div class="sh-global-stats">
        <span class="sh-stat sh-stat-auto">自动: <b id="sh-count-auto">0</b></span>
        <span class="sh-stat sh-stat-manual">手动: <b id="sh-count-manual">0</b></span>
        <span class="sh-stat sh-stat-disabled">禁用: <b id="sh-count-disabled">0</b></span>
        <span class="sh-stat sh-stat-paused" id="sh-paused-indicator" style="display:none;">⏸ 全局暂停中</span>
      </div>
      <div class="sh-global-buttons">
        <button class="sh-btn sh-btn-pause" id="sh-btn-pause">⏸ 全局暂停</button>
        <button class="sh-btn sh-btn-resume" id="sh-btn-resume">▶ 全局继续</button>
        <button class="sh-btn sh-btn-all-auto">🔁 全部自动</button>
        <button class="sh-btn sh-btn-all-manual">👆 全部手动</button>
        <button class="sh-btn sh-btn-all-disabled">🚫 全部禁用</button>
      </div>
    `;
    page.appendChild(globalBar);

    // 模块卡片网格
    const grid = document.createElement('div');
    grid.className = 'sh-grid';
    grid.id = 'sh-module-grid';

    const moduleIds = Object.keys(this.modules);
    for (const id of moduleIds) {
      grid.appendChild(this._buildModuleCard(id));
    }
    page.appendChild(grid);

    // 导入/导出工具栏
    const toolbar = document.createElement('div');
    toolbar.className = 'sh-toolbar';
    toolbar.innerHTML = `
      <button class="sh-btn sh-btn-export">📤 导出设置</button>
      <button class="sh-btn sh-btn-import">📥 导入设置</button>
      <input type="file" id="sh-import-input" accept=".json" style="display:none">
      <button class="sh-btn sh-btn-reset">🔄 恢复默认</button>
    `;
    page.appendChild(toolbar);

    // 底部状态栏
    const statusBar = document.createElement('div');
    statusBar.className = 'sh-statusbar';
    statusBar.id = 'sh-statusbar';
    statusBar.innerHTML = `
      <div class="sh-status-left">
        <span class="sh-status-dot sh-dot-running"></span>
        正在自动运行: <b id="sh-running-count">0</b> 个模块
      </div>
      <div class="sh-status-marquee" id="sh-status-marquee">
        <span>暂无自动运行模块</span>
      </div>
    `;
    page.appendChild(statusBar);

    wrapper.appendChild(page);

    // 绑定全局按钮事件
    this._bindGlobalButtonEvents(wrapper);

    return wrapper;
  },

  /**
   * 构建单个模块卡片 DOM
   */
  _buildModuleCard(moduleId) {
    const meta = this.modules[moduleId];
    const state = this.getModuleState(moduleId);
    const running = this.isModuleRunning(moduleId);

    const card = document.createElement('div');
    card.className = 'sh-card';
    card.dataset.moduleId = moduleId;

    card.innerHTML = `
      <div class="sh-card-header">
        <div class="sh-card-icon">${meta.icon}</div>
        <div class="sh-card-info">
          <div class="sh-card-name">${meta.name}</div>
          <div class="sh-card-desc">${meta.description}</div>
        </div>
        <div class="sh-card-status">
          <span class="sh-state-tag sh-state-${state}">${this._stateLabel(state)}</span>
          <span class="sh-running-dot ${running ? 'sh-running-active' : 'sh-running-inactive'}"></span>
        </div>
      </div>
      <div class="sh-card-controls">
        <button class="sh-state-btn ${state === 'auto' ? 'sh-state-active' : ''}" data-state="auto">
          🤖 自动
        </button>
        <button class="sh-state-btn ${state === 'manual' ? 'sh-state-active' : ''}" data-state="manual">
          👆 手动
        </button>
        <button class="sh-state-btn ${state === 'disabled' ? 'sh-state-active' : ''}" data-state="disabled">
          🚫 禁用
        </button>
      </div>
      <div class="sh-card-toggle">
        <span>⚙️ 详细设置</span>
        <span class="sh-toggle-arrow">▼</span>
      </div>
      <div class="sh-card-settings" style="display:none">
        ${this._buildSettingsHTML(moduleId)}
      </div>
    `;

    // 绑定状态切换按钮
    const stateBtns = card.querySelectorAll('.sh-state-btn');
    stateBtns.forEach(btn => {
      btn.onclick = () => {
        const newState = btn.dataset.state;
        this.setModuleState(moduleId, newState);
      };
    });

    // 绑定展开/收起
    const toggle = card.querySelector('.sh-card-toggle');
    const settingsPanel = card.querySelector('.sh-card-settings');
    const arrow = card.querySelector('.sh-toggle-arrow');
    toggle.onclick = () => {
      const isOpen = settingsPanel.style.display !== 'none';
      settingsPanel.style.display = isOpen ? 'none' : 'block';
      arrow.textContent = isOpen ? '▼' : '▲';
    };

    // 绑定设置项变更事件
    this._bindSettingEvents(card, moduleId);

    return card;
  },

  /**
   * 构建某个模块的详细设置项 HTML
   */
  _buildSettingsHTML(moduleId) {
    const meta = this.modules[moduleId];
    if (!meta.settings || meta.settings.length === 0) {
      return '<div class="sh-no-settings">暂无详细设置</div>';
    }

    const vals = this.settings[moduleId] || {};
    let html = '';

    for (const s of meta.settings) {
      const val = vals[s.key] !== undefined ? vals[s.key] : s.default;
      html += `<div class="sh-setting-row" data-key="${s.key}">`;
      html += `<label class="sh-setting-label">${s.label}</label>`;

      switch (s.type) {
        case 'toggle':
          html += `
            <label class="sh-toggle-switch">
              <input type="checkbox" ${val ? 'checked' : ''} data-type="toggle">
              <span class="sh-toggle-slider"></span>
            </label>
          `;
          break;
        case 'select':
          html += `<select class="sh-setting-select" data-type="select">`;
          for (const opt of s.options || []) {
            html += `<option value="${opt}" ${val === opt ? 'selected' : ''}>${opt}</option>`;
          }
          html += `</select>`;
          break;
        case 'number':
          html += `<input type="number" class="sh-setting-number" value="${val}" 
            ${s.min !== undefined ? `min="${s.min}"` : ''} 
            ${s.max !== undefined ? `max="${s.max}"` : ''} data-type="number">`;
          break;
        case 'text':
          html += `<input type="text" class="sh-setting-text" value="${this._escapeHtml(val)}" data-type="text">`;
          break;
      }
      html += `</div>`;
    }

    return html;
  },

  /**
   * 绑定设置项的 change/input 事件
   */
  _bindSettingEvents(card, moduleId) {
    const rows = card.querySelectorAll('.sh-setting-row');
    rows.forEach(row => {
      const key = row.dataset.key;
      const toggle = row.querySelector('input[type="checkbox"]');
      const select = row.querySelector('select');
      const number = row.querySelector('input[type="number"]');
      const text = row.querySelector('input[type="text"]');

      if (toggle) {
        toggle.addEventListener('change', () => {
          this.setSetting(moduleId, key, toggle.checked);
        });
      }
      if (select) {
        select.addEventListener('change', () => {
          this.setSetting(moduleId, key, select.value);
        });
      }
      if (number) {
        number.addEventListener('input', () => {
          let v = parseFloat(number.value);
          if (isNaN(v)) v = 0;
          this.setSetting(moduleId, key, v);
        });
      }
      if (text) {
        text.addEventListener('input', () => {
          this.setSetting(moduleId, key, text.value);
        });
      }
    });
  },

  /**
   * 绑定全局按钮事件
   */
  _bindGlobalButtonEvents(wrapper) {
    const pauseBtn = wrapper.querySelector('#sh-btn-pause');
    const resumeBtn = wrapper.querySelector('#sh-btn-resume');
    const allAutoBtn = wrapper.querySelector('.sh-btn-all-auto');
    const allManualBtn = wrapper.querySelector('.sh-btn-all-manual');
    const allDisabledBtn = wrapper.querySelector('.sh-btn-all-disabled');
    const exportBtn = wrapper.querySelector('.sh-btn-export');
    const importBtn = wrapper.querySelector('.sh-btn-import');
    const importInput = wrapper.querySelector('#sh-import-input');
    const resetBtn = wrapper.querySelector('.sh-btn-reset');

    if (pauseBtn) pauseBtn.onclick = () => this.globalPause();
    if (resumeBtn) resumeBtn.onclick = () => this.globalResume();
    if (allAutoBtn) allAutoBtn.onclick = () => this.setAllAuto();
    if (allManualBtn) allManualBtn.onclick = () => this.setAllManual();
    if (allDisabledBtn) allDisabledBtn.onclick = () => this.setAllDisabled();

    if (exportBtn) exportBtn.onclick = () => this.exportSettings();
    if (importBtn) importBtn.onclick = () => importInput && importInput.click();
    if (importInput) {
      importInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) this.importSettings(file);
      };
    }
    if (resetBtn) resetBtn.onclick = () => {
      if (confirm('确定要恢复所有设置为默认值吗？此操作不可撤销。')) {
        this._resetToDefaults();
      }
    };
  },

  /**
   * 更新单个模块卡片的 UI（状态标签、运行指示器、按钮激活态）
   */
  _updateCardUI(moduleId) {
    const card = document.querySelector(`.sh-card[data-module-id="${moduleId}"]`);
    if (!card) return;

    const state = this.getModuleState(moduleId);
    const running = this.isModuleRunning(moduleId);

    // 更新状态标签
    const tag = card.querySelector('.sh-state-tag');
    if (tag) {
      tag.className = `sh-state-tag sh-state-${state}`;
      tag.textContent = this._stateLabel(state);
    }

    // 更新运行圆点
    const dot = card.querySelector('.sh-running-dot');
    if (dot) {
      dot.className = `sh-running-dot ${running ? 'sh-running-active' : 'sh-running-inactive'}`;
    }

    // 更新按钮激活态
    const btns = card.querySelectorAll('.sh-state-btn');
    btns.forEach(btn => {
      btn.classList.toggle('sh-state-active', btn.dataset.state === state);
    });
  },

  /**
   * 更新所有卡片 UI
   */
  _updateAllCardsUI() {
    for (const id of Object.keys(this.modules)) {
      this._updateCardUI(id);
    }
    // 更新全局统计数字
    this._updateGlobalStats();
  },

  /**
   * 更新顶部全局统计数字
   */
  _updateGlobalStats() {
    let auto = 0, manual = 0, disabled = 0;
    for (const id of Object.keys(this.modules)) {
      const s = this.states[id] || 'auto';
      if (s === 'auto') auto++;
      else if (s === 'manual') manual++;
      else disabled++;
    }

    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setText('sh-count-auto', auto);
    setText('sh-count-manual', manual);
    setText('sh-count-disabled', disabled);

    // 全局暂停指示器
    const pausedInd = document.getElementById('sh-paused-indicator');
    if (pausedInd) {
      pausedInd.style.display = this.isGloballyPaused ? 'inline-block' : 'none';
    }
  },

  /**
   * 更新底部状态栏
   */
  _updateStatusBar() {
    const runningIds = [];
    let runningCount = 0;

    for (const id of Object.keys(this.modules)) {
      if (this.isModuleRunning(id)) {
        runningCount++;
        runningIds.push(this.modules[id].name);
      }
    }

    const countEl = document.getElementById('sh-running-count');
    if (countEl) countEl.textContent = runningCount;

    const marquee = document.getElementById('sh-status-marquee');
    if (marquee) {
      if (runningIds.length === 0) {
        marquee.innerHTML = '<span>暂无自动运行模块</span>';
      } else {
        const text = runningIds.join('  ·  ');
        marquee.innerHTML = `<span class="sh-marquee-text">${text}</span>`;
      }
    }
  },

  /**
   * 状态转中文标签
   */
  _stateLabel(state) {
    switch (state) {
      case 'auto': return '自动';
      case 'manual': return '手动';
      case 'disabled': return '禁用';
      default: return state;
    }
  },

  /**
   * HTML 转义
   */
  _escapeHtml(str) {
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  // ==========================================================
  // 设置导入 / 导出
  // ==========================================================

  /**
   * 导出所有模块状态和详细设置为 JSON 文件
   */
  exportSettings() {
    const data = {
      version: 14,
      exportTime: new Date().toISOString(),
      modules: {},
      states: this.states,
      settings: this.settings,
      isGloballyPaused: this.isGloballyPaused
    };

    // 同时导出模块元数据，便于导入时识别
    for (const id of Object.keys(this.modules)) {
      data.modules[id] = {
        name: this.modules[id].name,
        icon: this.modules[id].icon
      };
    }

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `settings_hub_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('[SettingsHub] 设置已导出');
  },

  /**
   * 从 JSON 文件导入设置
   * @param {File} file — 用户选择的文件对象
   */
  importSettings(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data || typeof data !== 'object') throw new Error('文件格式错误');

        // 恢复状态和设置
        if (data.states) this.states = data.states;
        if (data.settings) this.settings = data.settings;
        if (data.isGloballyPaused !== undefined) this.isGloballyPaused = data.isGloballyPaused;

        // 确保已注册模块有默认值兜底
        for (const id of Object.keys(this.modules)) {
          if (!this.states[id]) this.states[id] = 'auto';
          if (!this.settings[id]) {
            this.settings[id] = {};
            const defs = this.modules[id].settings || [];
            for (const s of defs) {
              if (s.key !== undefined) {
                this.settings[id][s.key] = s.default !== undefined ? s.default : this._getDefaultForType(s.type);
              }
            }
          }
        }

        this._saveToStorage();
        this._updateAllCardsUI();
        this._updateStatusBar();

        console.log('[SettingsHub] 设置已导入');
        alert('设置导入成功！');

        // 发送导入完成事件
        if (typeof EventBridge !== 'undefined') {
          EventBridge.emit(this.EVENT_CHANNEL, 'settings_imported', { source: file.name }, 'SettingsHub');
        }
      } catch (err) {
        console.error('[SettingsHub] 导入失败:', err);
        alert('导入失败: ' + err.message);
      }
    };
    reader.readAsText(file);
  },

  /**
   * 恢复所有设置为默认值
   */
  _resetToDefaults() {
    // 重置所有状态为 auto
    for (const id of Object.keys(this.modules)) {
      this.states[id] = 'auto';
      this.settings[id] = {};
      const defs = this.modules[id].settings || [];
      for (const s of defs) {
        if (s.key !== undefined) {
          this.settings[id][s.key] = s.default !== undefined ? s.default : this._getDefaultForType(s.type);
        }
      }
    }
    this.isGloballyPaused = false;
    this._saveToStorage();
    this._updateAllCardsUI();
    this._updateStatusBar();

    // 重新渲染设置面板值
    const cards = document.querySelectorAll('.sh-card');
    cards.forEach(card => {
      const moduleId = card.dataset.moduleId;
      const settingsPanel = card.querySelector('.sh-card-settings');
      if (settingsPanel) {
        settingsPanel.innerHTML = this._buildSettingsHTML(moduleId);
        this._bindSettingEvents(card, moduleId);
      }
    });

    console.log('[SettingsHub] 已恢复默认设置');
  },

  // ==========================================================
  // 全局监听与辅助
  // ==========================================================

  /**
   * 绑定全局键盘监听（ESC 关闭页面）
   */
  _bindGlobalListeners() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const overlay = document.getElementById('settings-hub-overlay');
        if (overlay) this.closePage();
      }
    });
  },

  // ==========================================================
  // CSS 样式（古风墨境）
  // ==========================================================

  _getCSS() {
    return `
      /* ===== 全局容器 ===== */
      #settings-hub-overlay {
        position: fixed;
        top: 0; left: 0;
        width: 100vw; height: 100vh;
        background: rgba(44, 24, 16, 0.55);
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: "Noto Serif SC", "SimSun", "STSong", serif;
      }

      .settings-hub-page {
        width: 900px;
        max-width: 95vw;
        max-height: 90vh;
        background: #F5E6D3;
        border-radius: 12px;
        border: 2px solid #C9A227;
        box-shadow: 0 8px 32px rgba(44, 24, 16, 0.4);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      /* ===== 顶部标题栏 ===== */
      .sh-header {
        background: linear-gradient(135deg, #2C1810 0%, #4A2C1A 100%);
        color: #F5E6D3;
        padding: 16px 24px;
        display: flex;
        align-items: center;
        gap: 12px;
        position: relative;
        border-bottom: 2px solid #C9A227;
      }
      .sh-title {
        font-size: 22px;
        font-weight: bold;
        color: #C9A227;
        letter-spacing: 2px;
      }
      .sh-subtitle {
        font-size: 13px;
        color: #D4C5A9;
        margin-left: 8px;
      }
      .sh-close-btn {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        background: transparent;
        border: 1px solid #C9A227;
        color: #C9A227;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
        transition: all 0.2s;
      }
      .sh-close-btn:hover {
        background: #C9A227;
        color: #2C1810;
      }

      /* ===== 全局控制栏 ===== */
      .sh-global-bar {
        background: #EBDCC0;
        padding: 12px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
        border-bottom: 1px solid #C9A227;
      }
      .sh-global-stats {
        display: flex;
        gap: 16px;
        font-size: 14px;
      }
      .sh-stat {
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: 500;
      }
      .sh-stat-auto { background: #E8F5E9; color: #2E7D32; }
      .sh-stat-manual { background: #E3F2FD; color: #1565C0; }
      .sh-stat-disabled { background: #F5F5F5; color: #616161; }
      .sh-stat-paused { background: #FFF3E0; color: #E65100; font-weight: bold; }

      .sh-global-buttons {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .sh-btn {
        padding: 6px 14px;
        border: 1px solid #C9A227;
        border-radius: 6px;
        background: #F5E6D3;
        color: #2C1810;
        cursor: pointer;
        font-size: 13px;
        font-family: inherit;
        transition: all 0.2s;
        white-space: nowrap;
      }
      .sh-btn:hover {
        background: #C9A227;
        color: #2C1810;
        box-shadow: 0 2px 6px rgba(201, 162, 39, 0.3);
      }
      .sh-btn:active { transform: translateY(1px); }

      /* ===== 模块卡片网格 ===== */
      .sh-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 16px;
        padding: 20px;
        overflow-y: auto;
        flex: 1;
      }

      .sh-card {
        background: #FFF8F0;
        border: 1px solid #D4C5A9;
        border-radius: 10px;
        padding: 14px;
        transition: all 0.2s;
        position: relative;
      }
      .sh-card:hover {
        border-color: #C9A227;
        box-shadow: 0 4px 12px rgba(44, 24, 16, 0.12);
        transform: translateY(-1px);
      }

      .sh-card-header {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        margin-bottom: 10px;
      }
      .sh-card-icon {
        font-size: 28px;
        line-height: 1;
      }
      .sh-card-info {
        flex: 1;
        min-width: 0;
      }
      .sh-card-name {
        font-size: 16px;
        font-weight: bold;
        color: #2C1810;
        margin-bottom: 2px;
      }
      .sh-card-desc {
        font-size: 12px;
        color: #8B7355;
        line-height: 1.3;
      }
      .sh-card-status {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
      }

      /* 状态标签 */
      .sh-state-tag {
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: bold;
      }
      .sh-state-auto { background: #4CAF50; color: #fff; }
      .sh-state-manual { background: #2196F3; color: #fff; }
      .sh-state-disabled { background: #9E9E9E; color: #fff; }

      /* 运行指示圆点 */
      .sh-running-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        display: inline-block;
        transition: background 0.3s;
      }
      .sh-running-active { background: #4CAF50; box-shadow: 0 0 4px #4CAF50; }
      .sh-running-inactive { background: #BDBDBD; }

      /* 状态切换按钮 */
      .sh-card-controls {
        display: flex;
        gap: 6px;
        margin-bottom: 8px;
      }
      .sh-state-btn {
        flex: 1;
        padding: 5px 0;
        border: 1px solid #D4C5A9;
        border-radius: 6px;
        background: #FFF8F0;
        color: #5D4037;
        cursor: pointer;
        font-size: 12px;
        font-family: inherit;
        transition: all 0.2s;
      }
      .sh-state-btn:hover { border-color: #C9A227; }
      .sh-state-btn.sh-state-active {
        background: #C9A227;
        color: #2C1810;
        border-color: #C9A227;
        font-weight: bold;
      }

      /* 展开详细设置 */
      .sh-card-toggle {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 0;
        border-top: 1px dashed #D4C5A9;
        cursor: pointer;
        font-size: 13px;
        color: #6D4C41;
        user-select: none;
      }
      .sh-card-toggle:hover { color: #C9A227; }
      .sh-toggle-arrow { font-size: 12px; }

      /* 设置面板 */
      .sh-card-settings {
        padding-top: 8px;
        animation: shFadeIn 0.2s ease;
      }
      @keyframes shFadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .sh-no-settings {
        font-size: 12px;
        color: #9E9E9E;
        text-align: center;
        padding: 8px 0;
      }

      .sh-setting-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 0;
        border-bottom: 1px solid #F0E6D3;
      }
      .sh-setting-row:last-child { border-bottom: none; }
      .sh-setting-label {
        font-size: 13px;
        color: #4E342E;
      }

      /* Toggle 开关 */
      .sh-toggle-switch {
        position: relative;
        display: inline-block;
        width: 40px;
        height: 22px;
        cursor: pointer;
      }
      .sh-toggle-switch input { opacity: 0; width: 0; height: 0; }
      .sh-toggle-slider {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: #BDBDBD;
        border-radius: 22px;
        transition: 0.3s;
      }
      .sh-toggle-slider::before {
        content: "";
        position: absolute;
        height: 16px;
        width: 16px;
        left: 3px;
        bottom: 3px;
        background: #fff;
        border-radius: 50%;
        transition: 0.3s;
      }
      .sh-toggle-switch input:checked + .sh-toggle-slider {
        background: #C9A227;
      }
      .sh-toggle-switch input:checked + .sh-toggle-slider::before {
        transform: translateX(18px);
      }

      /* 下拉框 / 数字 / 文本 */
      .sh-setting-select,
      .sh-setting-number,
      .sh-setting-text {
        padding: 4px 8px;
        border: 1px solid #D4C5A9;
        border-radius: 4px;
        background: #FFF8F0;
        color: #2C1810;
        font-family: inherit;
        font-size: 13px;
        min-width: 100px;
      }
      .sh-setting-number { width: 70px; }
      .sh-setting-select:focus,
      .sh-setting-number:focus,
      .sh-setting-text:focus {
        outline: none;
        border-color: #C9A227;
        box-shadow: 0 0 0 2px rgba(201, 162, 39, 0.2);
      }

      /* ===== 工具栏 ===== */
      .sh-toolbar {
        display: flex;
        justify-content: center;
        gap: 10px;
        padding: 12px 20px;
        background: #EBDCC0;
        border-top: 1px solid #C9A227;
      }

      /* ===== 底部状态栏 ===== */
      .sh-statusbar {
        background: #2C1810;
        color: #F5E6D3;
        padding: 8px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
      }
      .sh-status-left {
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
      }
      .sh-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
      }
      .sh-dot-running { background: #4CAF50; box-shadow: 0 0 4px #4CAF50; }

      .sh-status-marquee {
        flex: 1;
        margin-left: 20px;
        overflow: hidden;
        white-space: nowrap;
        mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
      }
      .sh-marquee-text {
        display: inline-block;
        animation: shMarqueeScroll 12s linear infinite;
        color: #C9A227;
        font-size: 12px;
      }
      @keyframes shMarqueeScroll {
        0%   { transform: translateX(100%); }
        100% { transform: translateX(-100%); }
      }

      /* ===== 滚动条美化 ===== */
      .sh-grid::-webkit-scrollbar { width: 8px; }
      .sh-grid::-webkit-scrollbar-track { background: #EBDCC0; }
      .sh-grid::-webkit-scrollbar-thumb { background: #C9A227; border-radius: 4px; }
    `;
  },

  // ==========================================================
  // 调试工具
  // ==========================================================

  /**
   * 获取当前所有模块的快照（用于调试）
   */
  getSnapshot() {
    const snapshot = {
      isGloballyPaused: this.isGloballyPaused,
      modules: {}
    };
    for (const id of Object.keys(this.modules)) {
      snapshot.modules[id] = {
        name: this.modules[id].name,
        state: this.states[id],
        running: this.isModuleRunning(id),
        settings: this.settings[id] || {}
      };
    }
    return snapshot;
  }
};

// ==========================================================
// 页面加载完成后自动初始化
// ==========================================================
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SettingsHub.init());
  } else {
    SettingsHub.init();
  }
}
