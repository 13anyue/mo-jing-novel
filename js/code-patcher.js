/**
 * =========================================================
 * CodePatcher v1 — 自编程引擎 / 运行时动态代码修改系统
 *
 * 核心概念：纯前端运行时动态修改代码，通过 localStorage
 * 持久化自定义代码，浏览器刷新后自动加载，无需手动改文件。
 *
 * 功能模块：
 *   1. 代码搜索     — searchCode()
 *   2. 代码补丁     — applyPatch() / previewPatch() / undoLastPatch()
 *   3. 模块创建     — createModule()
 *   4. 模块管理     — saveModule() / loadModule() / deleteModule() / listModules()
 *   5. 自动加载     — autoLoadAll()
 *   6. 安全沙箱     — executeInSandbox()
 *   7. UI 界面      — 编辑器 / 搜索面板 / 补丁面板 / 模块列表
 *   8. 导入导出     — exportAll() / importAll()
 *   9. 小助手联动   — 供 Assistant 调用的钩子
 *
 * 存储前缀：code_patcher_v14_
 * 配色方案：古风墨境 — 暖羊皮纸 #F5E6D3 / 金色 #C9A227 / 墨色 #2C1810
 * =========================================================
 */
const CodePatcher = {
  // ===================== 常量配置 =====================
  /** @type {string} localStorage 键前缀 */
  PREFIX: 'code_patcher_v14_',
  /** @type {number} 单个补丁大小限制（字节） */
  MAX_PATCH_SIZE: 50 * 1024,
  /** @type {number} 补丁历史最大保留数 */
  MAX_PATCH_HISTORY: 50,
  /** @type {number} 搜索上下文前后行数 */
  CONTEXT_LINES: 3,
  /** @type {Array<string>} 禁止调用的敏感 API 关键字 */
  FORBIDDEN_APIS: [
    'window.top', 'window.parent', 'document.cookie',
    'localStorage', 'sessionStorage', 'indexedDB',
    'fetch', 'XMLHttpRequest', 'WebSocket',
    'eval', 'Function.constructor', 'setTimeout', 'setInterval'
  ],
  /** @type {Array<string>} 允许的全局注入对象白名单 */
  ALLOWED_GLOBALS: [
    'Storage', 'App', 'APISettings', 'EventBridge',
    'NovelRuntime', 'NPCManager', 'BackgroundLibrary',
    'MapSystem', 'StatusBar', 'PromptSystem',
    'MemorySystem', 'PresetManager', 'RegexEngine',
    'WorldBook', 'ImportManager', 'BackupManager',
    'UIDIY', 'BaikeIntegration', 'DesignSuiteIntegration',
    'SkillDiscovery', 'CustomCreator', 'MobilePreview',
    'PWASystem', 'CGGallery', 'Assistant', 'Plugins',
    'Notes', 'Relations', 'HomePage', 'StorylineSystem',
    'StorylineManager', 'AppChat', 'AppForum', 'AppMail',
    'AppSettings', 'AppBeautify', 'AppCustom',
    'AchievementSystem', 'InventorySystem', 'AllianceSystem',
    'FunFeatures', 'JunChengStyle', 'TimelineSystem',
    'EventSystem', 'SaveManager', 'ChapterEditor',
        'WorldNotes', 'TextNovel', 'QuestSystem',
    'WeatherSystem', 'LetterSystem', 'RandomEvents',
    'BadgeWall', 'SceneSystem', 'NPCBehavior',
    'GroupChat', 'Launcher', 'Wizard', 'CodePatcher'
  ],
  /** @type {Object} 模块源码缓存 { moduleName: sourceString } */
  _sourceCache: {},
  /** @type {Object} 补丁历史缓存 { moduleName: [patchRecord, ...] } */
  _patchHistory: {},
  /** @type {Array<Object>} 操作日志，供小助手读取 */
  _operationLog: [],
  /** @type {boolean} 是否已执行过自动加载 */
  _autoLoaded: false,

  // ===================== 初始化 =====================
  /**
   * 初始化 CodePatcher，捕获所有 script 标签源码，并触发自动加载
   */
  init() {
    this._captureModuleSources();
    this._loadPatchHistory();
    this._loadOperationLog();
    // 延迟自动加载，确保其他模块已就绪
    if (!this._autoLoaded) {
      setTimeout(() => {
        this.autoLoadAll();
        this._autoLoaded = true;
      }, 500);
    }
    console.log('[CodePatcher] 自编程引擎已初始化');
  },

  // ===================== 1. 代码搜索 =====================
  /**
   * 在指定模块的源代码中搜索匹配模式
   * @param {string} moduleName — 模块名称（不含 .js 后缀）
   * @param {string|RegExp} pattern — 搜索模式，支持字符串或正则
   * @returns {Array<{line:number, text:string, context:string}>} 匹配结果列表
   */
  searchCode(moduleName, pattern) {
    const source = this._getCachedSource(moduleName);
    if (!source) {
      return [{ line: -1, text: `模块「${moduleName}」源码未找到`, context: '' }];
    }
    const lines = source.split('\n');
    const results = [];
    const regex = pattern instanceof RegExp ? pattern : new RegExp(this._escapeRegExp(pattern), 'g');
    for (let i = 0; i < lines.length; i++) {
      regex.lastIndex = 0;
      if (regex.test(lines[i])) {
        const start = Math.max(0, i - this.CONTEXT_LINES);
        const end = Math.min(lines.length, i + this.CONTEXT_LINES + 1);
        const contextLines = lines.slice(start, end);
        const context = contextLines
          .map((ln, idx) => {
            const lineNum = start + idx + 1;
            const marker = (lineNum === i + 1) ? '>> ' : '   ';
            return `${marker}${String(lineNum).padStart(4, ' ')} | ${ln}`;
          })
          .join('\n');
        results.push({
          line: i + 1,
          text: lines[i].trim(),
          context: context
        });
      }
    }
    this._logOperation('search', { moduleName, pattern: pattern.toString(), resultsCount: results.length });
    return results;
  },

  // ===================== 2. 代码补丁 =====================
  /**
   * 应用代码补丁到指定模块
   * @param {string} moduleName — 模块名称
   * @param {Object} patch — 补丁对象
   *   @param {string} patch.type — 补丁类型，目前仅支持 'replace'
   *   @param {string} patch.oldCode — 要被替换的旧代码片段
   *   @param {string} patch.newCode — 替换后的新代码片段
   * @returns {Object} { success: boolean, message: string, diff?: string }
   */
  applyPatch(moduleName, patch) {
    // 安全检查：补丁大小
    const patchSize = JSON.stringify(patch).length;
    if (patchSize > this.MAX_PATCH_SIZE) {
      const msg = `补丁大小 ${patchSize} 字节超过限制 ${this.MAX_PATCH_SIZE} 字节`;
      this._logOperation('applyPatch', { moduleName, success: false, error: msg });
      return { success: false, message: msg };
    }
    // 安全检查：代码内容
    const securityCheck = this._securityCheck(patch.newCode);
    if (!securityCheck.safe) {
      this._logOperation('applyPatch', { moduleName, success: false, error: securityCheck.reason });
      return { success: false, message: securityCheck.reason };
    }
    const source = this._getCachedSource(moduleName);
    if (!source) {
      return { success: false, message: `模块「${moduleName}」源码未找到` };
    }
    // 验证旧代码是否匹配
    if (!source.includes(patch.oldCode)) {
      return {
        success: false,
        message: `补丁验证失败：当前源码中未找到指定的旧代码片段。可能是源码已变更，请重新搜索确认。`
      };
    }
    // 生成 diff 预览
    const diff = this._generateDiff(source, patch.oldCode, patch.newCode);
    // 应用补丁
    const newSource = source.replace(patch.oldCode, patch.newCode);
    if (newSource === source) {
      return { success: false, message: '替换后源码无变化，可能 oldCode 和 newCode 相同' };
    }
    // 语法校验
    const syntaxCheck = this._checkSyntax(newSource, moduleName);
    if (!syntaxCheck.valid) {
      return { success: false, message: `语法错误：${syntaxCheck.error}` };
    }
    // 更新缓存
    this._sourceCache[moduleName] = newSource;
    // 保存补丁到 localStorage
    this._savePatch(moduleName, patch);
    // 重新加载模块
    this._reloadModule(moduleName, newSource);
    // 记录操作
    this._logOperation('applyPatch', { moduleName, success: true, diff });
    // 通知 EventBridge
    if (window.EventBridge) {
      EventBridge.emit('code-patcher', 'patch_applied', { moduleName, patch }, 'CodePatcher');
    }
    return { success: true, message: '补丁已应用并通过语法校验', diff };
  },

  /**
   * 在沙箱中预览补丁效果，不实际应用
   * @param {string} moduleName — 模块名称
   * @param {Object} patch — 补丁对象（同 applyPatch）
   * @returns {Object} { canApply: boolean, diff: string, message: string }
   */
  previewPatch(moduleName, patch) {
    const source = this._getCachedSource(moduleName);
    if (!source) {
      return { canApply: false, diff: '', message: `模块「${moduleName}」源码未找到` };
    }
    if (!source.includes(patch.oldCode)) {
      return {
        canApply: false,
        diff: '',
        message: '预览失败：当前源码中未找到旧代码片段，无法应用补丁。'
      };
    }
    const diff = this._generateDiff(source, patch.oldCode, patch.newCode);
    // 尝试在内存中应用并校验语法
    const newSource = source.replace(patch.oldCode, patch.newCode);
    const syntaxCheck = this._checkSyntax(newSource, moduleName);
    if (!syntaxCheck.valid) {
      return { canApply: false, diff, message: `预览通过但语法错误：${syntaxCheck.error}` };
    }
    return { canApply: true, diff, message: '补丁可以安全应用' };
  },

  /**
   * 撤销指定模块的最后一次补丁
   * @param {string} moduleName — 模块名称
   * @returns {Object} { success: boolean, message: string }
   */
  undoLastPatch(moduleName) {
    const history = this._getPatchHistory(moduleName);
    if (!history || history.length === 0) {
      return { success: false, message: `模块「${moduleName}」没有可撤销的补丁` };
    }
    const lastPatch = history.pop();
    // 逆向应用：把 newCode 替换回 oldCode
    const source = this._getCachedSource(moduleName);
    if (!source) {
      return { success: false, message: `模块「${moduleName}」源码未找到` };
    }
    if (!source.includes(lastPatch.newCode)) {
      return { success: false, message: '无法撤销：当前源码中未找到补丁修改后的代码' };
    }
    const restoredSource = source.replace(lastPatch.newCode, lastPatch.oldCode);
    this._sourceCache[moduleName] = restoredSource;
    this._savePatchHistory(moduleName, history);
    this._reloadModule(moduleName, restoredSource);
    this._logOperation('undoPatch', { moduleName, restoredPatch: lastPatch });
    if (window.EventBridge) {
      EventBridge.emit('code-patcher', 'patch_undone', { moduleName }, 'CodePatcher');
    }
    return { success: true, message: '已撤销最后一次补丁，模块已恢复' };
  },

  // ===================== 3. 模块创建 =====================
  /**
   * 创建全新模块并自动注册到系统
   * @param {string} moduleName — 模块名称（英文，将作为全局对象名）
   * @param {string} code — 模块代码（应包含 init 和 onEnter 方法）
   * @returns {Object} { success: boolean, message: string }
   */
  createModule(moduleName, code) {
    if (!moduleName || !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(moduleName)) {
      return { success: false, message: '模块名称必须是合法的 JavaScript 标识符' };
    }
    // 安全检查
    const sec = this._securityCheck(code);
    if (!sec.safe) {
      return { success: false, message: sec.reason };
    }
    // 语法校验
    const syntax = this._checkSyntax(code, moduleName);
    if (!syntax.valid) {
      return { success: false, message: `语法错误：${syntax.error}` };
    }
    // 自动包装：确保代码创建全局对象
    const wrappedCode = this._wrapModuleCode(moduleName, code);
    // 保存到 localStorage
    this._saveModule(moduleName, wrappedCode);
    // 在沙箱中执行注册
    const execResult = this._executeInSandbox(wrappedCode, moduleName);
    if (!execResult.success) {
      return { success: false, message: `模块注册失败：${execResult.error}` };
    }
    // 检查是否导出了 init/onEnter
    const globalObj = window[moduleName];
    const hasInit = globalObj && typeof globalObj.init === 'function';
    const hasEnter = globalObj && typeof globalObj.onEnter === 'function';
    // 若模块有 init 且系统已就绪，立即初始化
    if (hasInit && window.App && window.App.init) {
      try { globalObj.init(); } catch (e) { console.warn(`[CodePatcher] ${moduleName}.init() 执行警告:`, e); }
    }
    // 若模块有 onEnter 且当前页面匹配，触发进入
    const currentPage = window.location.hash.slice(1) || 'home';
    if (hasEnter && currentPage === moduleName.toLowerCase().replace(/_/g, '-')) {
      try { globalObj.onEnter(); } catch (e) { console.warn(`[CodePatcher] ${moduleName}.onEnter() 执行警告:`, e); }
    }
    // 记录操作
    this._logOperation('createModule', { moduleName, hasInit, hasEnter });
    if (window.EventBridge) {
      EventBridge.emit('code-patcher', 'module_created', { moduleName, hasInit, hasEnter }, 'CodePatcher');
    }
    return {
      success: true,
      message: `模块「${moduleName}」已创建${hasInit ? '并初始化' : ''}${hasEnter ? '（支持页面进入回调）' : ''}`
    };
  },

  // ===================== 4. 模块管理 =====================
  /**
   * 保存模块代码到 localStorage
   * @param {string} moduleName — 模块名称
   * @param {string} code — 模块完整代码
   */
  saveModule(moduleName, code) {
    const key = this.PREFIX + 'module_' + moduleName;
    localStorage.setItem(key, code);
    this._logOperation('saveModule', { moduleName, codeLength: code.length });
  },

  /**
   * 从 localStorage 加载模块代码
   * @param {string} moduleName — 模块名称
   * @returns {string|null} 模块代码，不存在时返回 null
   */
  loadModule(moduleName) {
    const key = this.PREFIX + 'module_' + moduleName;
    return localStorage.getItem(key);
  },

  /**
   * 删除模块（从 localStorage 移除，并从全局命名空间清理）
   * @param {string} moduleName — 模块名称
   * @returns {boolean} 是否成功删除
   */
  deleteModule(moduleName) {
    const key = this.PREFIX + 'module_' + moduleName;
    const existed = localStorage.getItem(key) !== null;
    localStorage.removeItem(key);
    // 清理全局对象（设为 undefined，注意不影响内置模块）
    if (window[moduleName] && !this._isBuiltInModule(moduleName)) {
      try { window[moduleName] = undefined; } catch (e) { /* 可能不可写 */ }
    }
    this._logOperation('deleteModule', { moduleName, existed });
    if (window.EventBridge) {
      EventBridge.emit('code-patcher', 'module_deleted', { moduleName }, 'CodePatcher');
    }
    return existed;
  },

  /**
   * 列出所有自定义模块
   * @returns {Array<{name:string, size:number, createdAt:number, hasInit:boolean, hasOnEnter:boolean}>}
   */
  listModules() {
    const modules = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.PREFIX + 'module_')) {
        const name = key.slice((this.PREFIX + 'module_').length);
        const code = localStorage.getItem(key);
        const hasInit = code ? /init\s*\(\s*\)/.test(code) || /init\s*:\s*function/.test(code) || /init\s*\(\)/.test(code) : false;
        const hasOnEnter = code ? /onEnter\s*\(\s*\)/.test(code) || /onEnter\s*:\s*function/.test(code) || /onEnter\s*\(\)/.test(code) : false;
        modules.push({
          name,
          size: code ? code.length : 0,
          createdAt: this._getStorageTime(key),
          hasInit,
          hasOnEnter
        });
      }
    }
    return modules.sort((a, b) => b.createdAt - a.createdAt);
  },

  // ===================== 5. 启动自动加载 =====================
  /**
   * 系统启动时自动加载所有保存的补丁和自定义模块
   * 按依赖顺序加载：先模块，后补丁；每个模块加载前检查语法
   */
  autoLoadAll() {
    let loadedModules = 0;
    let loadedPatches = 0;
    let errors = [];
    // 第一步：加载所有自定义模块
    const modules = this.listModules();
    for (const mod of modules) {
      const code = this.loadModule(mod.name);
      if (!code) continue;
      const syntax = this._checkSyntax(code, mod.name);
      if (!syntax.valid) {
        errors.push(`模块「${mod.name}」语法错误：${syntax.error}`);
        console.warn(`[CodePatcher] 自动加载跳过模块 ${mod.name}：${syntax.error}`);
        continue;
      }
      const exec = this._executeInSandbox(code, mod.name);
      if (!exec.success) {
        errors.push(`模块「${mod.name}」执行错误：${exec.error}`);
        console.warn(`[CodePatcher] 自动加载跳过模块 ${mod.name}：${exec.error}`);
        continue;
      }
      // 初始化
      const globalObj = window[mod.name];
      if (globalObj && typeof globalObj.init === 'function') {
        try { globalObj.init(); } catch (e) { console.warn(`[CodePatcher] ${mod.name}.init() 错误:`, e); }
      }
      loadedModules++;
    }
    // 第二步：加载所有补丁（按模块分组，按时间顺序）
    const patchKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.PREFIX + 'patches_')) {
        const moduleName = key.slice((this.PREFIX + 'patches_').length);
        patchKeys.push({ key, moduleName });
      }
    }
    for (const { moduleName } of patchKeys) {
      const history = this._getPatchHistory(moduleName);
      for (const patch of history) {
        const source = this._getCachedSource(moduleName);
        if (!source) continue;
        if (!source.includes(patch.oldCode)) {
          console.warn(`[CodePatcher] 补丁跳过：${moduleName} 的源码已变更，旧代码不再匹配`);
          continue;
        }
        const newSource = source.replace(patch.oldCode, patch.newCode);
        const syntax = this._checkSyntax(newSource, moduleName);
        if (!syntax.valid) {
          console.warn(`[CodePatcher] 补丁跳过：${moduleName} 补丁导致语法错误`);
          continue;
        }
        this._sourceCache[moduleName] = newSource;
        this._reloadModule(moduleName, newSource);
        loadedPatches++;
      }
    }
    this._autoLoaded = true;
    this._logOperation('autoLoadAll', { loadedModules, loadedPatches, errors: errors.length });
    console.log(`[CodePatcher] 自动加载完成：${loadedModules} 个模块，${loadedPatches} 个补丁，${errors.length} 个错误`);
    return { loadedModules, loadedPatches, errors };
  },

  // ===================== 6. 安全机制 =====================
  /**
   * 在受控沙箱中执行代码
   * @param {string} code — 要执行的 JavaScript 代码
   * @param {string} moduleName — 模块名称（用于错误报告）
   * @returns {Object} { success: boolean, error?: string, result?: any }
   */
  _executeInSandbox(code, moduleName = 'anonymous') {
    try {
      // 构建受控的全局对象：只暴露白名单 API
      const sandboxGlobals = {};
      for (const name of this.ALLOWED_GLOBALS) {
        if (window[name] !== undefined) {
          sandboxGlobals[name] = window[name];
        }
      }
      // 创建安全的 Function，在严格模式下运行
      const sandboxFn = new Function(
        ...Object.keys(sandboxGlobals),
        '"use strict";\n' + code
      );
      // 执行
      const result = sandboxFn(...Object.values(sandboxGlobals));
      return { success: true, result };
    } catch (e) {
      return { success: false, error: e.message || String(e) };
    }
  },

  /**
   * 执行外部传入的代码（公开接口，供 UI 调用）
   * @param {string} code — 要执行的代码
   * @returns {Object} { success: boolean, error?: string }
   */
  executeInSandbox(code) {
    const sec = this._securityCheck(code);
    if (!sec.safe) {
      return { success: false, error: sec.reason };
    }
    const syntax = this._checkSyntax(code, 'sandbox');
    if (!syntax.valid) {
      return { success: false, error: syntax.error };
    }
    return this._executeInSandbox(code, 'user-sandbox');
  },

  /**
   * 安全检查：扫描代码是否包含禁止调用的 API
   * @param {string} code — 要检查的代码
   * @returns {Object} { safe: boolean, reason?: string }
   */
  _securityCheck(code) {
    // 检查禁止 API
    for (const api of this.FORBIDDEN_APIS) {
      // 简单的字符串匹配（生产环境可使用 AST 解析）
      const escapedApi = api.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp('\\b' + escapedApi + '\\b');
      if (regex.test(code)) {
        // 允许 localStorage 在特定上下文（CodePatcher 自身使用）
        if (api === 'localStorage' && code.includes('CodePatcher')) continue;
        return { safe: false, reason: `代码中包含禁止调用的 API：${api}` };
      }
    }
    return { safe: true };
  },

  /**
   * 语法校验
   * @param {string} code — 要检查的代码
   * @param {string} moduleName — 模块名称
   * @returns {Object} { valid: boolean, error?: string }
   */
  _checkSyntax(code, moduleName = 'unknown') {
    try {
      // 使用 new Function 进行语法检查（不执行）
      // eslint-disable-next-line no-new
      new Function(code);
      return { valid: true };
    } catch (e) {
      const errorMsg = e.message || String(e);
      console.warn(`[CodePatcher] 语法错误 [${moduleName}]:`, errorMsg);
      return { valid: false, error: errorMsg };
    }
  },

  // ===================== 7. UI 界面 =====================
  /** 当前显示的 UI 面板 */
  _currentPanel: null,

  /**
   * 渲染 CodePatcher 主面板（供导航页调用）
   */
  renderPage() {
    const page = document.getElementById('page-code-patcher');
    if (!page) return;
    page.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:8px;">
        <h2 class="section-title">🔧 自编程引擎</h2>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-secondary" onclick="CodePatcher.renderSearchPanel()">🔍 代码搜索</button>
          <button class="btn btn-secondary" onclick="CodePatcher.renderPatchPanel()">🩹 补丁管理</button>
          <button class="btn btn-secondary" onclick="CodePatcher.renderModulePanel()">📦 模块列表</button>
          <button class="btn btn-secondary" onclick="CodePatcher.renderEditorPanel()">📝 代码编辑器</button>
          <button class="btn btn-danger" onclick="CodePatcher.resetAll()">↺ 恢复默认</button>
        </div>
      </div>
      <div id="cp_mainPanel" style="min-height:400px;">
        <div class="empty-state">
          <div class="empty-icon" style="font-size:48px;">🔧</div>
          <p>欢迎使用自编程引擎</p>
          <p style="font-size:13px;color:var(--text-secondary);margin-top:8px;">
            选择上方功能开始动态修改代码。所有修改通过 localStorage 持久化，刷新后自动恢复。
          </p>
        </div>
      </div>
    `;
  },

  /**
   * 页面进入回调（由 App.navigate 触发）
   */
  onEnter() {
    this.renderPage();
  },

  /**
   * 渲染代码搜索面板
   */
  renderSearchPanel() {
    const panel = document.getElementById('cp_mainPanel');
    if (!panel) return;
    panel.innerHTML = `
      <div class="card" style="margin-bottom:var(--space-lg);">
        <div class="card-header"><h3>🔍 代码搜索</h3></div>
        <div class="card-body">
          <div style="display:flex;gap:12px;margin-bottom:var(--space-md);flex-wrap:wrap;">
            <div class="form-group" style="flex:1;min-width:200px;">
              <label>模块名称</label>
              <input type="text" id="cp_searchModule" placeholder="如：app-v4" value="app-v4">
            </div>
            <div class="form-group" style="flex:2;min-width:300px;">
              <label>搜索模式（支持正则）</label>
              <input type="text" id="cp_searchPattern" placeholder="输入字符串或正则表达式...">
            </div>
          </div>
          <button class="btn btn-primary" onclick="CodePatcher.doSearch()">🔍 搜索</button>
          <div id="cp_searchResults" style="margin-top:var(--space-md);"></div>
        </div>
      </div>
    `;
    this._currentPanel = 'search';
  },

  /**
   * 执行搜索并渲染结果
   */
  doSearch() {
    const moduleName = document.getElementById('cp_searchModule')?.value?.trim();
    const pattern = document.getElementById('cp_searchPattern')?.value?.trim();
    if (!moduleName || !pattern) { App.toast('请填写模块名称和搜索模式', 'error'); return; }
    const results = this.searchCode(moduleName, pattern);
    const container = document.getElementById('cp_searchResults');
    if (!container) return;
    if (results.length === 0 || results[0].line === -1) {
      container.innerHTML = `<div class="hint">未找到匹配结果</div>`;
      return;
    }
    container.innerHTML = results.map((r, i) => `
      <div class="card" style="margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span style="font-size:12px;color:var(--color-gold);">第 ${r.line} 行</span>
          <button class="btn btn-sm btn-secondary" onclick="CodePatcher.useSearchResult(${i})">使用此片段</button>
        </div>
        <pre class="code-block" style="font-size:12px;line-height:1.5;overflow-x:auto;">${this._escapeHtml(r.context)}</pre>
      </div>
    `).join('');
    // 缓存搜索结果供后续使用
    this._lastSearchResults = results;
  },

  /**
   * 将搜索结果填入补丁面板的 oldCode 区域
   * @param {number} index — 搜索结果索引
   */
  useSearchResult(index) {
    const result = this._lastSearchResults?.[index];
    if (!result) return;
    this.renderPatchPanel();
    const oldCodeInput = document.getElementById('cp_patchOld');
    if (oldCodeInput) oldCodeInput.value = result.text;
  },

  /**
   * 渲染补丁管理面板
   */
  renderPatchPanel() {
    const panel = document.getElementById('cp_mainPanel');
    if (!panel) return;
    panel.innerHTML = `
      <div class="card" style="margin-bottom:var(--space-lg);">
        <div class="card-header"><h3>🩹 应用补丁</h3></div>
        <div class="card-body">
          <div class="form-group">
            <label>目标模块</label>
            <input type="text" id="cp_patchModule" placeholder="如：app-v4" value="app-v4">
          </div>
          <div class="form-group">
            <label>旧代码片段（将被替换）</label>
            <div style="position:relative;">
              <textarea id="cp_patchOld" rows="4" placeholder="粘贴要替换的原始代码..."></textarea>
              <div id="cp_patchOldLines" style="position:absolute;left:0;top:0;width:32px;height:100%;background:#2C181005;border-right:1px solid #C9A22730;color:#C9A227;font-size:11px;line-height:1.6;text-align:right;padding:8px 4px;box-sizing:border-box;overflow:hidden;pointer-events:none;"></div>
            </div>
          </div>
          <div class="form-group">
            <label>新代码片段</label>
            <div style="position:relative;">
              <textarea id="cp_patchNew" rows="4" placeholder="粘贴替换后的新代码..."></textarea>
              <div id="cp_patchNewLines" style="position:absolute;left:0;top:0;width:32px;height:100%;background:#2C181005;border-right:1px solid #C9A22730;color:#C9A227;font-size:11px;line-height:1.6;text-align:right;padding:8px 4px;box-sizing:border-box;overflow:hidden;pointer-events:none;"></div>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-secondary" onclick="CodePatcher.doPreviewPatch()">👁️ 预览差异</button>
            <button class="btn btn-primary" onclick="CodePatcher.doApplyPatch()">✓ 确认应用</button>
            <button class="btn btn-secondary" onclick="CodePatcher.doUndoPatch()">↩ 撤销最后补丁</button>
          </div>
          <div id="cp_patchPreview" style="margin-top:var(--space-md);"></div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3>📜 补丁历史</h3></div>
        <div class="card-body" id="cp_patchHistory"></div>
      </div>
    `;
    this._bindLineNumbers('cp_patchOld', 'cp_patchOldLines');
    this._bindLineNumbers('cp_patchNew', 'cp_patchNewLines');
    this._renderPatchHistory();
    this._currentPanel = 'patch';
  },

  /**
   * 为 textarea 绑定行号显示
   * @param {string} textareaId — textarea 元素 ID
   * @param {string} linesId — 行号容器 ID
   */
  _bindLineNumbers(textareaId, linesId) {
    const textarea = document.getElementById(textareaId);
    const linesDiv = document.getElementById(linesId);
    if (!textarea || !linesDiv) return;
    const updateLines = () => {
      const count = (textarea.value.match(/\n/g) || []).length + 1;
      linesDiv.innerHTML = Array.from({ length: count }, (_, i) => `<div>${i + 1}</div>`).join('');
    };
    textarea.addEventListener('input', updateLines);
    textarea.addEventListener('scroll', () => { linesDiv.scrollTop = textarea.scrollTop; });
    updateLines();
  },

  /**
   * 预览补丁差异
   */
  doPreviewPatch() {
    const moduleName = document.getElementById('cp_patchModule')?.value?.trim();
    const oldCode = document.getElementById('cp_patchOld')?.value;
    const newCode = document.getElementById('cp_patchNew')?.value;
    if (!moduleName || !oldCode) { App.toast('请填写模块名称和旧代码', 'error'); return; }
    const result = this.previewPatch(moduleName, { type: 'replace', oldCode, newCode });
    const container = document.getElementById('cp_patchPreview');
    if (!container) return;
    if (result.canApply) {
      container.innerHTML = `
        <div style="background:#C9A22710;border:1px solid var(--color-gold);border-radius:8px;padding:12px;">
          <p style="color:var(--color-gold);margin-bottom:8px;">✓ ${result.message}</p>
          <pre class="code-block" style="font-size:12px;">${this._escapeHtml(result.diff)}</pre>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div style="background:#ff444410;border:1px solid #ff4444;border-radius:8px;padding:12px;">
          <p style="color:#ff4444;margin-bottom:8px;">✗ ${result.message}</p>
          ${result.diff ? `<pre class="code-block" style="font-size:12px;">${this._escapeHtml(result.diff)}</pre>` : ''}
        </div>
      `;
    }
  },

  /**
   * 确认应用补丁
   */
  doApplyPatch() {
    const moduleName = document.getElementById('cp_patchModule')?.value?.trim();
    const oldCode = document.getElementById('cp_patchOld')?.value;
    const newCode = document.getElementById('cp_patchNew')?.value;
    if (!moduleName || !oldCode) { App.toast('请填写完整信息', 'error'); return; }
    const result = this.applyPatch(moduleName, { type: 'replace', oldCode, newCode });
    if (result.success) {
      App.toast(result.message, 'success');
      this._renderPatchHistory();
      document.getElementById('cp_patchPreview').innerHTML = `
        <div style="background:#22c55e10;border:1px solid #22c55e;border-radius:8px;padding:12px;">
          <p style="color:#22c55e;">✓ 补丁已成功应用！模块已重新加载。</p>
        </div>
      `;
    } else {
      App.toast(result.message, 'error');
      document.getElementById('cp_patchPreview').innerHTML = `
        <div style="background:#ff444410;border:1px solid #ff4444;border-radius:8px;padding:12px;">
          <p style="color:#ff4444;">✗ ${result.message}</p>
        </div>
      `;
    }
  },

  /**
   * 撤销最后一次补丁
   */
  doUndoPatch() {
    const moduleName = document.getElementById('cp_patchModule')?.value?.trim() || 'app-v4';
    const result = this.undoLastPatch(moduleName);
    App.toast(result.message, result.success ? 'success' : 'error');
    if (result.success) this._renderPatchHistory();
  },

  /**
   * 渲染补丁历史列表
   */
  _renderPatchHistory() {
    const container = document.getElementById('cp_patchHistory');
    if (!container) return;
    // 收集所有模块的补丁历史
    let html = '';
    const allModules = Object.keys(this._patchHistory);
    if (allModules.length === 0) {
      container.innerHTML = '<div class="hint">暂无补丁历史</div>';
      return;
    }
    for (const moduleName of allModules) {
      const history = this._patchHistory[moduleName];
      if (!history || history.length === 0) continue;
      html += `<div style="margin-bottom:12px;"><strong style="color:var(--color-gold);">📄 ${moduleName}</strong>（${history.length} 个补丁）`;
      html += history.map((p, i) => `
        <div style="margin-left:16px;font-size:12px;color:var(--text-secondary);margin-top:4px;">
          ${i + 1}. ${new Date(p.time).toLocaleString()} — ${p.oldCode.substring(0, 30)}... → ${p.newCode.substring(0, 30)}...
        </div>
      `).join('');
      html += '</div>';
    }
    container.innerHTML = html;
  },

  /**
   * 渲染模块列表面板
   */
  renderModulePanel() {
    const panel = document.getElementById('cp_mainPanel');
    if (!panel) return;
    panel.innerHTML = `
      <div class="card" style="margin-bottom:var(--space-lg);">
        <div class="card-header"><h3>📦 自定义模块</h3></div>
        <div class="card-body" id="cp_moduleList"></div>
      </div>
      <div class="card">
        <div class="card-header"><h3>➕ 导入模块</h3></div>
        <div class="card-body">
          <div class="form-group">
            <label>导入 JSON（包含模块代码）</label>
            <textarea id="cp_importJson" rows="6" placeholder='{"modules": {"MyModule": "const MyModule = {...}"}}'></textarea>
          </div>
          <button class="btn btn-primary" onclick="CodePatcher.doImport()">📥 导入</button>
        </div>
      </div>
    `;
    this._renderModuleList();
    this._currentPanel = 'module';
  },

  /**
   * 渲染模块卡片列表
   */
  _renderModuleList() {
    const container = document.getElementById('cp_moduleList');
    if (!container) return;
    const modules = this.listModules();
    if (modules.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <p>暂无自定义模块</p>
          <p style="font-size:13px;color:var(--text-secondary);">在「代码编辑器」面板中创建新模块</p>
        </div>
      `;
      return;
    }
    container.innerHTML = modules.map(m => `
      <div class="list-item" style="flex-wrap:wrap;gap:8px;">
        <div class="list-info" style="flex:1;">
          <h4>${m.name}</h4>
          <p>${m.size} 字符 · ${new Date(m.createdAt).toLocaleString()} ${m.hasInit ? '· ✅ init' : ''} ${m.hasOnEnter ? '· ✅ onEnter' : ''}</p>
        </div>
        <div style="display:flex;gap:4px;">
          <button class="btn btn-sm btn-secondary" onclick="CodePatcher.viewModuleCode('${m.name}')">👁️</button>
          <button class="btn btn-sm btn-secondary" onclick="CodePatcher.exportModule('${m.name}')">📤</button>
          <button class="btn btn-sm btn-danger" onclick="CodePatcher.deleteModuleAndRefresh('${m.name}')">🗑️</button>
        </div>
      </div>
    `).join('');
  },

  /**
   * 查看模块代码
   * @param {string} moduleName — 模块名称
   */
  viewModuleCode(moduleName) {
    const code = this.loadModule(moduleName);
    if (!code) { App.toast('模块不存在', 'error'); return; }
    App.showModal(`👁️ ${moduleName}`, `
      <pre class="code-block" style="max-height:60vh;overflow-y:auto;font-size:12px;">${this._escapeHtml(code)}</pre>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">
        <button class="btn btn-secondary" onclick="App.closeModal()">关闭</button>
        <button class="btn btn-primary" onclick="CodePatcher.editModule('${moduleName}')">编辑</button>
      </div>
    `);
  },

  /**
   * 删除模块并刷新列表
   * @param {string} moduleName — 模块名称
   */
  deleteModuleAndRefresh(moduleName) {
    if (!confirm(`确定删除模块「${moduleName}」？`)) return;
    this.deleteModule(moduleName);
    this._renderModuleList();
    App.toast(`模块「${moduleName}」已删除`, 'success');
  },

  /**
   * 渲染代码编辑器面板（创建新模块）
   */
  renderEditorPanel() {
    const panel = document.getElementById('cp_mainPanel');
    if (!panel) return;
    panel.innerHTML = `
      <div class="card" style="margin-bottom:var(--space-lg);">
        <div class="card-header"><h3>📝 创建新模块</h3></div>
        <div class="card-body">
          <div class="form-group">
            <label>模块名称（英文标识符）</label>
            <input type="text" id="cp_newModuleName" placeholder="如：MyFeature">
          </div>
          <div class="form-group">
            <label>模块代码</label>
            <div style="position:relative;">
              <textarea id="cp_newModuleCode" rows="16" placeholder="const MyFeature = {\n  init() { /* 初始化 */ },\n  onEnter() { /* 页面进入 */ }\n};"></textarea>
              <div id="cp_editorLines" style="position:absolute;left:0;top:0;width:36px;height:100%;background:#2C181008;border-right:1px solid #C9A22725;color:#C9A227;font-size:11px;line-height:1.6;text-align:right;padding:8px 4px;box-sizing:border-box;overflow:hidden;pointer-events:none;"></div>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="CodePatcher.doCreateModule()">💾 创建并注册</button>
            <button class="btn btn-secondary" onclick="CodePatcher.doTestCode()">🧪 语法测试</button>
            <button class="btn btn-secondary" onclick="CodePatcher.exportAllModules()">📤 导出全部</button>
          </div>
          <div id="cp_editorResult" style="margin-top:var(--space-md);"></div>
        </div>
      </div>
    `;
    this._bindLineNumbers('cp_newModuleCode', 'cp_editorLines');
    this._currentPanel = 'editor';
  },

  /**
   * 创建新模块
   */
  doCreateModule() {
    const name = document.getElementById('cp_newModuleName')?.value?.trim();
    const code = document.getElementById('cp_newModuleCode')?.value;
    if (!name) { App.toast('请输入模块名称', 'error'); return; }
    if (!code) { App.toast('请输入模块代码', 'error'); return; }
    const result = this.createModule(name, code);
    const resultDiv = document.getElementById('cp_editorResult');
    if (resultDiv) {
      resultDiv.innerHTML = result.success
        ? `<div style="background:#22c55e10;border:1px solid #22c55e;border-radius:8px;padding:12px;color:#22c55e;">✓ ${result.message}</div>`
        : `<div style="background:#ff444410;border:1px solid #ff4444;border-radius:8px;padding:12px;color:#ff4444;">✗ ${result.message}</div>`;
    }
    App.toast(result.message, result.success ? 'success' : 'error');
  },

  /**
   * 测试代码语法
   */
  doTestCode() {
    const code = document.getElementById('cp_newModuleCode')?.value;
    if (!code) { App.toast('请输入代码', 'error'); return; }
    const syntax = this._checkSyntax(code, 'test');
    const sec = this._securityCheck(code);
    const resultDiv = document.getElementById('cp_editorResult');
    let html = '';
    if (syntax.valid && sec.safe) {
      html = `<div style="background:#22c55e10;border:1px solid #22c55e;border-radius:8px;padding:12px;color:#22c55e;">✓ 语法检查通过，安全检查通过</div>`;
    } else {
      html = `<div style="background:#ff444410;border:1px solid #ff4444;border-radius:8px;padding:12px;color:#ff4444;">`;
      if (!syntax.valid) html += `<p>✗ 语法错误：${syntax.error}</p>`;
      if (!sec.safe) html += `<p>✗ 安全检查：${sec.reason}</p>`;
      html += `</div>`;
    }
    if (resultDiv) resultDiv.innerHTML = html;
  },

  /**
   * 编辑已有模块（跳转到编辑器面板并填充代码）
   * @param {string} moduleName — 模块名称
   */
  editModule(moduleName) {
    App.closeModal();
    this.renderEditorPanel();
    const nameInput = document.getElementById('cp_newModuleName');
    const codeInput = document.getElementById('cp_newModuleCode');
    if (nameInput) nameInput.value = moduleName;
    if (codeInput) {
      codeInput.value = this.loadModule(moduleName) || '';
      // 触发行号更新
      codeInput.dispatchEvent(new Event('input'));
    }
  },

  // ===================== 8. 导入导出 =====================
  /**
   * 导出单个模块为 JSON
   * @param {string} moduleName — 模块名称
   */
  exportModule(moduleName) {
    const code = this.loadModule(moduleName);
    if (!code) { App.toast('模块不存在', 'error'); return; }
    const data = { modules: { [moduleName]: code }, exportedAt: Date.now(), version: '1.0' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${moduleName}_module.json`;
    a.click();
    URL.revokeObjectURL(url);
    App.toast(`模块「${moduleName}」已导出`, 'success');
  },

  /**
   * 导出所有模块和补丁
   */
  exportAllModules() {
    const data = { modules: {}, patches: {}, exportedAt: Date.now(), version: '1.0' };
    const modules = this.listModules();
    for (const m of modules) {
      data.modules[m.name] = this.loadModule(m.name);
    }
    // 导出补丁历史
    for (const key in this._patchHistory) {
      data.patches[key] = this._patchHistory[key];
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code_patcher_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    App.toast('所有模块和补丁已导出', 'success');
  },

  /**
   * 从 JSON 导入模块
   */
  doImport() {
    const json = document.getElementById('cp_importJson')?.value?.trim();
    if (!json) { App.toast('请输入 JSON 数据', 'error'); return; }
    try {
      const data = JSON.parse(json);
      let imported = 0;
      let errors = [];
      if (data.modules) {
        for (const [name, code] of Object.entries(data.modules)) {
          const result = this.createModule(name, code);
          if (result.success) imported++;
          else errors.push(`${name}: ${result.message}`);
        }
      }
      if (data.patches) {
        for (const [moduleName, patches] of Object.entries(data.patches)) {
          this._savePatchHistory(moduleName, patches);
        }
      }
      this._renderModuleList();
      App.toast(`导入完成：${imported} 个模块成功${errors.length > 0 ? '，' + errors.length + ' 个失败' : ''}`, errors.length > 0 ? 'info' : 'success');
      if (errors.length > 0) {
        console.warn('[CodePatcher] 导入错误:', errors);
      }
    } catch (e) {
      App.toast('JSON 解析失败：' + e.message, 'error');
    }
  },

  // ===================== 9. 恢复默认 =====================
  /**
   * 一键清除所有自定义代码（模块 + 补丁 + 源码缓存）
   * 弹窗确认，防止误操作
   */
  resetAll() {
    if (!confirm('⚠️ 警告：此操作将删除所有自定义模块和补丁！\n\n确定要恢复默认状态吗？此操作不可撤销。')) return;
    // 删除所有相关 localStorage 项
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.PREFIX)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
    // 清理源码缓存
    this._sourceCache = {};
    this._patchHistory = {};
    this._operationLog = [];
    this._autoLoaded = false;
    App.toast('已清除所有自定义代码，即将刷新页面...', 'success');
    setTimeout(() => location.reload(), 1500);
  },

  // ===================== 10. 小助手联动 =====================
  /**
   * 供小助手（Assistant）调用的自动化接口：
   * 一键搜索、预览、应用补丁的完整流程
   *
   * @param {string} moduleName — 目标模块
   * @param {string} oldCode — 旧代码片段
   * @param {string} newCode — 新代码片段
   * @returns {Object} 完整操作结果
   */
  assistantPatch(moduleName, oldCode, newCode) {
    // 第一步：搜索确认
    const searchResults = this.searchCode(moduleName, oldCode.split('\n')[0]);
    // 第二步：预览
    const preview = this.previewPatch(moduleName, { type: 'replace', oldCode, newCode });
    // 第三步：应用（如果预览通过）
    let applyResult = null;
    if (preview.canApply) {
      applyResult = this.applyPatch(moduleName, { type: 'replace', oldCode, newCode });
    }
    // 记录到小助手对话历史（通过 EventBridge 通知 Assistant）
    if (window.EventBridge) {
      EventBridge.emit('assistant', 'code-patcher-result', {
        moduleName,
        searchResults,
        preview,
        applyResult
      }, 'CodePatcher');
    }
    return {
      search: searchResults,
      preview,
      apply: applyResult,
      success: applyResult?.success || false
    };
  },

  /**
   * 供小助手查询当前系统状态
   * @returns {Object} 模块数、补丁数、最近操作等信息
   */
  getStatus() {
    const modules = this.listModules();
    let patchCount = 0;
    for (const key in this._patchHistory) {
      patchCount += (this._patchHistory[key] || []).length;
    }
    return {
      moduleCount: modules.length,
      patchCount,
      lastOperation: this._operationLog[this._operationLog.length - 1] || null,
      recentModules: modules.slice(0, 5),
      autoLoaded: this._autoLoaded
    };
  },

  // ===================== 内部工具方法 =====================
  /**
   * 获取模块源码（优先从缓存，其次尝试 fetch）
   * @param {string} moduleName — 模块名称
   * @returns {string|null} 源码字符串
   */
  _getCachedSource(moduleName) {
    // 1. 检查内存缓存
    if (this._sourceCache[moduleName]) {
      return this._sourceCache[moduleName];
    }
    // 2. 检查 localStorage 中保存的原始源码
    const saved = localStorage.getItem(this.PREFIX + 'source_' + moduleName);
    if (saved) {
      this._sourceCache[moduleName] = saved;
      return saved;
    }
    // 3. 尝试从页面 script 标签捕获
    const captured = this._captureScriptSource(moduleName);
    if (captured) {
      this._sourceCache[moduleName] = captured;
      localStorage.setItem(this.PREFIX + 'source_' + moduleName, captured);
      return captured;
    }
    return null;
  },

  /**
   * 捕获页面中所有 script 标签的源码
   */
  _captureModuleSources() {
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      if (script.src) {
        // 外部脚本：尝试从 src 路径推断模块名
        const match = script.src.match(/\/([^\/]+)\.js$/);
        if (match) {
          const name = match[1];
          // 尝试获取已加载的内容（对于内联可能为空）
          // 外部脚本无法直接读取内容，需 fetch
          this._fetchScriptSource(name, script.src);
        }
      } else {
        // 内联脚本
        const content = script.textContent || script.innerText || '';
        if (content.trim().length > 100) {
          // 尝试从内容中推断模块名（查找 const Xxx = {）
          const nameMatch = content.match(/const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/);
          if (nameMatch) {
            const name = nameMatch[1];
            this._sourceCache[name] = content;
            localStorage.setItem(this.PREFIX + 'source_' + name, content);
          }
        }
      }
    }
  },

  /**
   * 异步获取外部 script 源码
   * @param {string} moduleName — 模块名称
   * @param {string} src — script src URL
   */
  async _fetchScriptSource(moduleName, src) {
    try {
      const response = await fetch(src);
      if (response.ok) {
        const text = await response.text();
        this._sourceCache[moduleName] = text;
        localStorage.setItem(this.PREFIX + 'source_' + moduleName, text);
      }
    } catch (e) {
      console.warn(`[CodePatcher] 无法获取模块 ${moduleName} 源码:`, e);
    }
  },

  /**
   * 尝试从已存在的 script 标签捕获源码（内联脚本）
   * @param {string} moduleName — 模块名称
   * @returns {string|null}
   */
  _captureScriptSource(moduleName) {
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      if (!script.src) {
        const content = script.textContent || script.innerText || '';
        // 检查内容是否包含该模块定义
        const regex = new RegExp(`const\\s+${moduleName}\\s*=`);
        if (regex.test(content)) {
          return content;
        }
      }
    }
    return null;
  },

  /**
   * 重新加载模块：通过创建新 script 标签执行新源码
   * @param {string} moduleName — 模块名称
   * @param {string} source — 新源码
   */
  _reloadModule(moduleName, source) {
    // 创建临时 script 标签执行新代码
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.textContent = source;
    script.id = 'cp_reloaded_' + moduleName + '_' + Date.now();
    document.head.appendChild(script);
    // 更新缓存
    this._sourceCache[moduleName] = source;
    localStorage.setItem(this.PREFIX + 'source_' + moduleName, source);
    console.log(`[CodePatcher] 模块 ${moduleName} 已重新加载`);
  },

  /**
   * 保存补丁到历史记录
   * @param {string} moduleName — 模块名称
   * @param {Object} patch — 补丁对象
   */
  _savePatch(moduleName, patch) {
    const history = this._getPatchHistory(moduleName);
    history.push({ ...patch, time: Date.now() });
    // 限制历史长度
    if (history.length > this.MAX_PATCH_HISTORY) {
      history.shift();
    }
    this._savePatchHistory(moduleName, history);
  },

  /**
   * 获取模块的补丁历史
   * @param {string} moduleName — 模块名称
   * @returns {Array<Object>}
   */
  _getPatchHistory(moduleName) {
    if (this._patchHistory[moduleName]) {
      return this._patchHistory[moduleName];
    }
    const raw = localStorage.getItem(this.PREFIX + 'patches_' + moduleName);
    if (raw) {
      try {
        this._patchHistory[moduleName] = JSON.parse(raw);
        return this._patchHistory[moduleName];
      } catch (e) {
        return [];
      }
    }
    return [];
  },

  /**
   * 保存补丁历史到 localStorage
   * @param {string} moduleName — 模块名称
   * @param {Array<Object>} history — 补丁历史数组
   */
  _savePatchHistory(moduleName, history) {
    this._patchHistory[moduleName] = history;
    localStorage.setItem(this.PREFIX + 'patches_' + moduleName, JSON.stringify(history));
  },

  /**
   * 加载所有补丁历史到内存
   */
  _loadPatchHistory() {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.PREFIX + 'patches_')) {
        const moduleName = key.slice((this.PREFIX + 'patches_').length);
        const raw = localStorage.getItem(key);
        if (raw) {
          try { this._patchHistory[moduleName] = JSON.parse(raw); } catch (e) {}
        }
      }
    }
  },

  /**
   * 记录操作日志
   * @param {string} action — 操作类型
   * @param {Object} data — 操作数据
   */
  _logOperation(action, data) {
    const log = { action, data, time: Date.now() };
    this._operationLog.push(log);
    if (this._operationLog.length > 200) {
      this._operationLog.shift();
    }
    localStorage.setItem(this.PREFIX + 'operation_log', JSON.stringify(this._operationLog));
  },

  /**
   * 加载操作日志
   */
  _loadOperationLog() {
    const raw = localStorage.getItem(this.PREFIX + 'operation_log');
    if (raw) {
      try { this._operationLog = JSON.parse(raw); } catch (e) { this._operationLog = []; }
    }
  },

  /**
   * 生成 diff 文本（统一 diff 简化格式）
   * @param {string} source — 原始源码
   * @param {string} oldCode — 旧代码
   * @param {string} newCode — 新代码
   * @returns {string} diff 文本
   */
  _generateDiff(source, oldCode, newCode) {
    const oldLines = oldCode.split('\n');
    const newLines = newCode.split('\n');
    let diff = '--- 原始代码\n+++ 修改后\n';
    for (const line of oldLines) {
      diff += `- ${line}\n`;
    }
    for (const line of newLines) {
      diff += `+ ${line}\n`;
    }
    return diff;
  },

  /**
   * 转义 HTML 特殊字符
   * @param {string} text — 原始文本
   * @returns {string} 转义后的文本
   */
  _escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * 转义正则表达式特殊字符
   * @param {string} str — 原始字符串
   * @returns {string} 转义后的字符串
   */
  _escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  /**
   * 获取 localStorage 项的创建时间（通过遍历猜测，实际为当前时间）
   * @param {string} key — localStorage 键
   * @returns {number} 时间戳
   */
  _getStorageTime(key) {
    // localStorage 不记录创建时间，返回当前时间作为近似
    // 对于模块，可通过 patch 历史推断
    const patches = this._getPatchHistory(key.replace(this.PREFIX + 'module_', ''));
    if (patches.length > 0) return patches[0].time;
    return Date.now();
  },

  /**
   * 判断是否为内置模块（不可删除全局对象）
   * @param {string} moduleName — 模块名称
   * @returns {boolean}
   */
  _isBuiltInModule(moduleName) {
    const builtIns = [
      'App', 'Storage', 'APISettings', 'EventBridge',
      'NovelRuntime', 'NPCManager', 'BackgroundLibrary',
      'MapSystem', 'StatusBar', 'PromptSystem',
      'MemorySystem', 'PresetManager', 'RegexEngine',
      'WorldBook', 'ImportManager', 'BackupManager',
      'UIDIY', 'BaikeIntegration', 'DesignSuiteIntegration',
      'SkillDiscovery', 'CustomCreator', 'MobilePreview',
      'PWASystem', 'CGGallery', 'Assistant', 'Plugins',
      'Notes', 'Relations', 'HomePage', 'StorylineSystem',
      'StorylineManager', 'AppChat', 'AppForum', 'AppMail',
      'AppSettings', 'AppBeautify', 'AppCustom',
      'AchievementSystem', 'InventorySystem', 'AllianceSystem',
      'FunFeatures', 'JunChengStyle', 'TimelineSystem',
      'EventSystem', 'SaveManager', 'ChapterEditor',
      'WorldNotes', 'TextNovel', 'QuestSystem',
      'WeatherSystem', 'LetterSystem', 'RandomEvents',
      'BadgeWall', 'SceneSystem', 'NPCBehavior',
      'GroupChat', 'Launcher', 'Wizard', 'CodePatcher'
    ];
    return builtIns.includes(moduleName);
  },

  /**
   * 自动包装模块代码，确保创建全局对象
   * @param {string} moduleName — 模块名称
   * @param {string} code — 用户提供的代码
   * @returns {string} 包装后的完整代码
   */
  _wrapModuleCode(moduleName, code) {
    // 如果代码中已经定义了该全局对象，则不包装
    const hasGlobalDef = new RegExp(`const\\s+${moduleName}\\s*=|var\\s+${moduleName}\\s*=|let\\s+${moduleName}\\s*=`).test(code);
    if (hasGlobalDef) {
      return code;
    }
    // 简单包装：把用户代码放入一个对象中
    return `const ${moduleName} = {\n${code}\n};`;
  }
};

// ===================== 自动注册到系统 =====================
/**
 * 当 App 初始化时，CodePatcher 会自动被调用 init()。
 * 如果 App 已经就绪，立即初始化。
 */
if (window.App && window.App.init) {
  // App 已经加载，延迟初始化以确保所有脚本就绪
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => CodePatcher.init(), 300);
  } else {
    document.addEventListener('DOMContentLoaded', () => setTimeout(() => CodePatcher.init(), 300));
  }
} else {
  // 等待 App 加载
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (window.App && window.App.init) {
        CodePatcher.init();
      }
    }, 500);
  });
}

console.log('[CodePatcher] code-patcher.js 已加载，等待系统初始化...');
