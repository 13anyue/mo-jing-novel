/**
 * =========================================================
 * Visual Novel Runtime v8
 * 墨境AI视觉小说引擎 - 运行时双模式
 * 配色约束：暖羊皮纸底色 #F5E6D3 + 金色 #C9A227 + 墨色 #2C1810
 * 2026-09-01 升级内容：
 * - 视觉小说模式：更精致的对话框（更大圆角、更强毛玻璃、金色边框发光）
 * - Markdown模式：左侧立绘区渐变背景+角色名标签，右侧更大内边距+分隔线+对话气泡
 * - 顶部导航栏：圆角按钮、更好间距
 * - 输入区：聊天App风格（圆角输入框+SVG发送图标）
 * - 所有emoji替换为SVG
 * - 全局空值检查与try-catch防护
 * =========================================================
 */
const NovelRuntime = {
  _state: {
    npcId: null,
    scene: '起始场景',
    history: [],
    isTyping: false,
    timer: null,
    isAIThinking: false,
    autoPlay: false,
    currentBgId: null,
    currentMusicId: null,
    inputMode: 'free', // 'free' | 'choice' | 'both'
    sceneContext: { name: '', desc: '' },
    novelMode: 'visual', // 'visual' | 'text'
    groupMode: false,
    groupNPCs: []
  },

  /* ====== 运行时设置（带错误防护） ====== */
  getSettings() {
    try {
      return Storage.get('runtimeSettings_v7', {
        wordCount: 'medium',
        customWordCount: 200,
        style: 'normal',
        customStylePrompt: '',
        enableMemory: true,
        enableWorldBook: true,
        enableBaike: true,
        enableStatusBar: true,
        enableTypingEffect: true,
        typingSpeed: 30,
        autoSaveInterval: 0,
        showHistoryPanel: true
      });
    } catch (e) {
      console.warn('[NovelRuntime] 读取设置失败:', e);
      return {
        wordCount: 'medium', customWordCount: 200, style: 'normal',
        customStylePrompt: '', enableMemory: true, enableWorldBook: true,
        enableBaike: true, enableStatusBar: true, enableTypingEffect: true,
        typingSpeed: 30, autoSaveInterval: 0, showHistoryPanel: true
      };
    }
  },

  saveSettings(s) {
    try { Storage.set('runtimeSettings_v7', s); }
    catch (e) { console.warn('[NovelRuntime] 保存设置失败:', e); }
  },

  init() { this.renderPage(); this._initTouchGestures(); },
  onEnter() { this.refreshSelectors(); this.loadRuntimeSettings(); this._renderSettingsBar(); },

  renderPage() {
    const page = document.getElementById('page-runtime');
    if (!page) return;
    const layout = (typeof UIDIY !== 'undefined' && UIDIY) ? UIDIY.getLayout() : { dialogPosition: 'bottom', statusBarPosition: 'top-left', portraitPosition: 'center-right' };
    const dialogPosClass = 'dialog-' + layout.dialogPosition;
    const portraitPosClass = 'portrait-' + layout.portraitPosition;

    page.innerHTML = `
      <!-- 顶部导航栏：更精致，圆角按钮、更好间距 -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
        <button class="btn btn-sm btn-secondary" style="border-radius:20px;padding:6px 14px;" onclick="App.navigate('home')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><polyline points="15 18 9 12 15 6"/></svg>返回
        </button>
        <button class="btn btn-sm btn-gold" style="border-radius:20px;padding:6px 14px;" onclick="NovelRuntime.toggleNovelMode()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          ${this._state.novelMode === 'visual' ? '文本模式' : '视觉模式'}
        </button>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md);flex-wrap:wrap;gap:8px;">
        <h2 class="section-title">墨境</h2>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-sm btn-secondary" style="border-radius:16px;padding:5px 12px;" onclick="NovelRuntime.saveGame()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>存档
          </button>
          <button class="btn btn-sm btn-secondary" style="border-radius:16px;padding:5px 12px;" onclick="NovelRuntime.showSaves()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>读档
          </button>
          <button class="btn btn-sm btn-secondary" style="border-radius:16px;padding:5px 12px;" onclick="NovelRuntime.toggleFullscreen()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>全屏
          </button>
          <button class="btn btn-sm btn-gold" style="border-radius:16px;padding:5px 12px;" onclick="NovelRuntime.toggleSettings()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.62 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          </button>
        </div>
      </div>

      <!-- v9: 快速操作条 -->
      <div style="display:flex;gap:8px;margin-bottom:var(--space-md);flex-wrap:wrap;">
        <button class="btn btn-sm btn-secondary" style="border-radius:16px;padding:5px 12px;" onclick="NovelRuntime.undo()">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 111.13-9.36L1 10"/></svg>撤回
        </button>
        <button class="btn btn-sm btn-secondary" style="border-radius:16px;padding:5px 12px;" onclick="NovelRuntime.redo()">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-1.13-9.36L23 10"/></svg>重做
        </button>
        <button class="btn btn-sm btn-secondary" style="border-radius:16px;padding:5px 12px;" onclick="NovelRuntime.rewriteLast()">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>重写
        </button>
        <button class="btn btn-sm btn-secondary" style="border-radius:16px;padding:5px 12px;" onclick="NovelRuntime.continueStory()">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>继续
        </button>
        <button class="btn btn-sm btn-secondary" style="border-radius:16px;padding:5px 12px;" onclick="NovelRuntime.exportStoryText()">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>导出文本
        </button>
        <div style="flex:1;"></div>
        <span id="undoStatus" style="font-size:12px;color:var(--text-muted);align-self:center;"></span>
      </div>

      <!-- 运行时设置条 -->
      <div id="runtimeSettingsBar" style="display:none;margin-bottom:var(--space-md);"></div>

      <div class="card" style="margin-bottom:var(--space-md);">
        <div class="card-body" style="display:flex;gap:var(--space-md);flex-wrap:wrap;align-items:flex-end;">
          <div class="form-group" style="flex:1;min-width:120px;"><label>角色</label><select id="rt_npc" onchange="NovelRuntime.selectNPC(this.value)"></select></div>
          <div class="form-group" style="flex:1;min-width:120px;"><label>场景</label><select id="rt_bg" onchange="NovelRuntime.selectBg(this.value)"></select></div>
          <div class="form-group" style="flex:1;min-width:120px;"><label>音乐</label><select id="rt_music" onchange="NovelRuntime.selectMusic(this.value)"></select></div>
          <div class="form-group" style="flex:0 0 auto;">
            <label>玩家</label>
            <input type="text" id="rt_playerName" value="${this._safeStorageGet('playerName','玩家')}" style="width:100px;" onchange="try{Storage.set('playerName',this.value)}catch(e){console.warn(e)}">
          </div>
        </div>
      </div>

      <!-- ====== 双模式对话区 ====== -->
      <div id="novelModeContainer">
        ${this._state.novelMode === 'visual' ? this._renderVisualNovelMode(portraitPosClass) : this._renderMarkdownMode()}
      </div>

      <!-- 输入区：聊天App风格，圆角输入框+SVG发送图标 -->
      <div style="max-width:1200px;margin:var(--space-md) auto 0;">
        <div class="card" style="border-radius:24px;box-shadow:0 2px 12px rgba(44,24,16,0.08);">
          <div class="card-body" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;padding:12px 16px;">
            <div style="flex:1;display:flex;gap:10px;min-width:200px;align-items:center;">
              <div style="flex:1;position:relative;">
                <input type="text" id="rt_input" placeholder="输入对话..." onkeydown="if(event.key==='Enter')NovelRuntime.playerSend()" style="width:100%;border-radius:20px;padding:10px 16px;border:1px solid var(--border-color);background:#faf8f5;font-size:15px;box-shadow:inset 0 1px 3px rgba(0,0,0,0.05);transition:box-shadow 0.2s,border-color 0.2s;" onfocus="this.style.borderColor='var(--color-gold)';this.style.boxShadow='0 0 0 3px rgba(201,162,39,0.15),inset 0 1px 3px rgba(0,0,0,0.05)';" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='inset 0 1px 3px rgba(0,0,0,0.05)';">
              </div>
              <button class="btn btn-primary" style="border-radius:50%;width:42px;height:42px;padding:0;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(201,162,39,0.3);" onclick="NovelRuntime.playerSend()" title="发送">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left:2px;"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button class="btn btn-sm btn-secondary" style="border-radius:14px;padding:5px 12px;" onclick="NovelRuntime.requestChoices()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:3px;"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>选项
              </button>
              <button class="btn btn-sm btn-secondary" style="border-radius:14px;padding:5px 12px;" onclick="NovelRuntime.toggleInputMode()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:3px;"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>${this._state.inputMode === 'choice' ? '自由' : '选项'}
              </button>
              <button class="btn btn-sm btn-secondary" style="border-radius:14px;padding:5px 12px;" onclick="NovelRuntime.showHistory()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:3px;"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 111.13-9.36L1 10"/></svg>历史
              </button>
              <button class="btn btn-sm btn-secondary" style="border-radius:14px;padding:5px 12px;" onclick="NovelRuntime.clearHistory()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:3px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>清屏
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    this.refreshSelectors();
    if (typeof UIDIY !== 'undefined' && UIDIY) document.addEventListener('keydown', (e) => UIDIY.handleKeydown(e));
  },

  /* 安全读取Storage（防报错） */
  _safeStorageGet(key, fallback) {
    try { return Storage.get(key, fallback); }
    catch (e) { console.warn('[NovelRuntime] Storage.get 失败:', key, e); return fallback; }
  },

  /* ====== 运行时设置面板 ====== */
  toggleSettings() {
    const bar = document.getElementById('runtimeSettingsBar');
    if (!bar) return;
    if (bar.style.display === 'none') { this._renderSettingsBar(); bar.style.display = 'block'; }
    else bar.style.display = 'none';
  },

  _renderSettingsBar() {
    const bar = document.getElementById('runtimeSettingsBar');
    if (!bar) return;
    const s = this.getSettings();
    bar.innerHTML = `
      <div class="card" style="background:linear-gradient(135deg, var(--bg-parchment), var(--bg-card));border-radius:16px;">
        <div class="card-body" style="padding:var(--space-md);">
          <div style="display:flex;gap:var(--space-md);flex-wrap:wrap;align-items:flex-end;">
            <div class="form-group" style="flex:0 0 140px;">
              <label style="font-size:12px;">字数</label>
              <select id="rtSetWordCount" onchange="NovelRuntime.updateSetting('wordCount',this.value)">
                <option value="short" ${s.wordCount==='short'?'selected':''}>简短</option>
                <option value="medium" ${s.wordCount==='medium'?'selected':''}>适中</option>
                <option value="long" ${s.wordCount==='long'?'selected':''}>长文</option>
                <option value="custom" ${s.wordCount==='custom'?'selected':''}>自定义</option>
              </select>
            </div>
            ${s.wordCount==='custom'?`<div class="form-group" style="flex:0 0 100px;"><label style="font-size:12px;">自定义字数</label><input type="number" id="rtSetCustomCount" value="${s.customWordCount}" onchange="NovelRuntime.updateSetting('customWordCount',parseInt(this.value)||200)" style="width:80px;"></div>`:''}
            <div class="form-group" style="flex:0 0 140px;">
              <label style="font-size:12px;">文风</label>
              <select id="rtSetStyle" onchange="NovelRuntime.updateSetting('style',this.value)">
                <option value="normal" ${s.style==='normal'?'selected':''}>正常</option>
                <option value="poetic" ${s.style==='poetic'?'selected':''}>诗意</option>
                <option value="dramatic" ${s.style==='dramatic'?'selected':''}>戏剧</option>
                <option value="concise" ${s.style==='concise'?'selected':''}>简洁</option>
                <option value="custom" ${s.style==='custom'?'selected':''}>自定义</option>
              </select>
            </div>
            ${s.style==='custom'?`<div class="form-group" style="flex:1;min-width:200px;"><label style="font-size:12px;">自定义文风提示词</label><input type="text" id="rtSetCustomStyle" value="${s.customStylePrompt}" onchange="NovelRuntime.updateSetting('customStylePrompt',this.value)" placeholder="如：古风文言、现代白话..."></div>`:''}
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
              <label style="font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" ${s.enableMemory?'checked':''} onchange="NovelRuntime.updateSetting('enableMemory',this.checked)" style="width:auto;"> 记忆</label>
              <label style="font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" ${s.enableWorldBook?'checked':''} onchange="NovelRuntime.updateSetting('enableWorldBook',this.checked)" style="width:auto;"> 世界书</label>
              <label style="font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" ${s.enableBaike?'checked':''} onchange="NovelRuntime.updateSetting('enableBaike',this.checked)" style="width:auto;"> 百科</label>
              <label style="font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" ${s.enableStatusBar?'checked':''} onchange="NovelRuntime.updateSetting('enableStatusBar',this.checked)" style="width:auto;"> 状态栏</label>
              <label style="font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" ${s.enableTypingEffect?'checked':''} onchange="NovelRuntime.updateSetting('enableTypingEffect',this.checked)" style="width:auto;"> 打字机</label>
            </div>
            <div class="form-group" style="flex:0 0 100px;">
              <label style="font-size:12px;">打字速度</label>
              <input type="range" min="10" max="100" value="${s.typingSpeed}" onchange="NovelRuntime.updateSetting('typingSpeed',parseInt(this.value))" style="width:80px;">
            </div>
          </div>
        </div>
      </div>
    `;
  },

  updateSetting(key, value) {
    const s = this.getSettings();
    s[key] = value;
    this.saveSettings(s);
    this._renderSettingsBar();
    if (window.App && App.toast) App.toast('设置已更新', 'success');
  },

  toggleInputMode() {
    this._state.inputMode = this._state.inputMode === 'free' ? 'choice' : 'free';
    if (window.App && App.toast) App.toast(this._state.inputMode === 'choice' ? '切换为选项模式' : '切换为自由输入模式', 'info');
    this.renderPage();
  },

  /**
   * 切换小说显示模式：visual（沉浸式全屏）↔ text（Markdown左立绘右面板）
   */
  toggleNovelMode() {
    this._state.novelMode = this._state.novelMode === 'visual' ? 'text' : 'visual';
    if (window.App && App.toast) App.toast(this._state.novelMode === 'visual' ? '切换为沉浸式视觉小说模式' : '切换为Markdown对话模式', 'info');
    this.renderPage();
    this._refreshDisplay();
  },

  setSceneContext(name, desc) {
    this._state.sceneContext = { name, desc };
    if (name) this._state.scene = name;
  },

  /* 字数和文风提示词生成 */
  _getStylePrompt() {
    const s = this.getSettings();
    const wordMap = { short: '50字以内', medium: '100-200字', long: '300-500字', custom: s.customWordCount + '字左右' };
    const styleMap = {
      normal: '用自然流畅的语言回复',
      poetic: '用诗意优美的语言回复，适当运用修辞手法',
      dramatic: '用戏剧化的语言回复，注重情感张力和场面描写',
      concise: '用简洁干练的语言回复，直击要点',
      custom: s.customStylePrompt || '用自然流畅的语言回复'
    };
    return `回复长度控制在${wordMap[s.wordCount] || wordMap.medium}。${styleMap[s.style] || styleMap.normal}。`;
  },

  /* 其余方法保持不变或增强 */
  renderControlButtons() {
    if (!UIDIY) {
      return `
        <button class="btn-icon" onclick="NovelRuntime.toggleAuto()" title="自动" id="vnAutoBtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        </button>
        <button class="btn-icon" onclick="NovelRuntime.showHistory()" title="历史">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 111.13-9.36L1 10"/></svg>
        </button>
        <button class="btn-icon" onclick="NovelRuntime.toggleSettings()" title="设置">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.62 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        </button>
      `;
    }
    const buttons = UIDIY.getButtons().filter(b => b.visible);
    return buttons.map(b => {
      if (b.style === 'icon') return `<button class="btn-icon" onclick="UIDIY.executeAction('${b.action}')" title="${b.label}">${b.icon}</button>`;
      return `<button class="btn btn-sm btn-${b.style}" onclick="UIDIY.executeAction('${b.action}')">${b.icon} ${b.label}</button>`;
    }).join('');
  },

  refreshSelectors() {
    const npcSel = document.getElementById('rt_npc');
    let npcs = [];
    if (typeof NPCManager !== 'undefined' && NPCManager && NPCManager.getNPCs) {
      try { npcs = NPCManager.getNPCs(); } catch(e) { console.warn(e); }
    }
    if (npcSel) npcSel.innerHTML = '<option value="">-- 角色 --</option>' + npcs.map(n => `<option value="${n.id}" ${this._state.npcId===n.id?'selected':''}>${n.name}</option>`).join('');
    const bgSel = document.getElementById('rt_bg');
    if (bgSel) {
      let bgs = [];
      if (typeof BackgroundLibrary !== 'undefined' && BackgroundLibrary && BackgroundLibrary.getBackgrounds) {
        try {
          bgs = BackgroundLibrary.getBackgrounds();
          const cat = BackgroundLibrary.getRuntimeCategory ? BackgroundLibrary.getRuntimeCategory() : { cat: 'all', sub: null };
          if (cat && cat.cat !== 'all') { bgs = bgs.filter(b => b.category === cat.cat); if (cat.sub) bgs = bgs.filter(b => b.subcategory === cat.sub); }
        } catch(e) { console.warn(e); }
      } else {
        try { bgs = Storage.get('backgrounds_v3', Storage.get('backgrounds_v2', [])); } catch(e) { console.warn(e); }
      }
      bgSel.innerHTML = '<option value="">-- 背景 --</option>' + bgs.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
    }
    const musicSel = document.getElementById('rt_music');
    if (musicSel) {
      let musicList = [];
      if (typeof MusicManager !== 'undefined' && MusicManager && MusicManager.getMusicList) {
        try { musicList = MusicManager.getMusicList(); } catch(e) { console.warn(e); }
      }
      if (musicList.length === 0) {
        try { musicList = Storage.get('musicList', []); } catch(e) { console.warn(e); }
      }
      musicSel.innerHTML = '<option value="">-- 音乐 --</option>' + musicList.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
    }
  },

  loadRuntimeSettings() {
    let savedBg = null;
    try { savedBg = Storage.get('runtimeBgId', null); } catch(e) { console.warn(e); }
    if (savedBg) this.selectBg(savedBg);
    const s = this.getSettings();
    const sb = document.getElementById('vnStatusOverlay');
    if (sb) sb.style.display = s.enableStatusBar ? 'block' : 'none';
  },

  async selectNPC(id) {
    this._state.npcId = id;
    let npcs = [];
    if (typeof NPCManager !== 'undefined' && NPCManager && NPCManager.getNPCs) {
      try { npcs = NPCManager.getNPCs(); } catch(e) { console.warn(e); }
    }
    const npc = npcs.find(n => n.id === id);
    
    // v7: 增强自动立绘分配 - 优先使用角色专属立绘，支持多表情差分
    if (npc && !npc.portraitId) {
      let assigned = false;
      
      // 1. 尝试从NPC自身的立绘数据获取
      if (npc.portrait && npc.portrait.data) {
        try {
          const portraitId = 'npc_portrait_' + npc.id;
          await Storage.saveImage(portraitId, npc.portrait.data, { 
            name: npc.name + '立绘', 
            category: 'npc_portrait',
            npcId: npc.id,
            transparent: npc.portrait.transparent || false
          });
          npc.portraitId = portraitId;
          assigned = true;
          if (window.App && App.toast) App.toast(`已为「${npc.name}」加载专属立绘`, 'success');
        } catch(e) { console.warn('加载NPC专属立绘失败:', e); }
      }
      
      // 2. 尝试从CG库找角色相关CG
      if (!assigned) {
        let cgs = [];
        if (typeof CGGallery !== 'undefined' && CGGallery && CGGallery.getCGs) {
          try { cgs = CGGallery.getCGs(); } catch(e) { console.warn(e); }
        }
        if (cgs.length > 0) {
          // 优先匹配角色名称
          const charCGs = cgs.filter(c => 
            c.type === 'character' || 
            (c.title && npc.name && c.title.includes(npc.name)) || 
            (c.scene && c.scene.includes('角色')) ||
            (c.tags && c.tags.includes('立绘'))
          );
          if (charCGs.length > 0) {
            const selectedCG = charCGs[Math.floor(Math.random() * charCGs.length)];
            npc.portraitId = selectedCG.imageId || selectedCG.id;
            assigned = true;
          }
        }
      }
      
      // 3. 尝试从背景库找合适图片
      if (!assigned) {
        let bgs = [];
        if (typeof BackgroundLibrary !== 'undefined' && BackgroundLibrary && BackgroundLibrary.getBackgrounds) {
          try { bgs = BackgroundLibrary.getBackgrounds(); } catch(e) { console.warn(e); }
        }
        if (bgs.length > 0) {
          // 优先选人物/角色相关背景
          const charBgs = bgs.filter(b => 
            b.category === 'character' || 
            (b.name && npc.name && b.name.includes(npc.name)) ||
            (b.tags && b.tags.includes('人物'))
          );
          const selectedBg = charBgs.length > 0 
            ? charBgs[Math.floor(Math.random() * charBgs.length)]
            : bgs[Math.floor(Math.random() * bgs.length)];
          npc.portraitId = selectedBg.imageId || selectedBg.id;
          assigned = true;
        }
      }
      
      // 保存分配的立绘ID
      if (assigned && npc.portraitId) {
        try {
          if (typeof NPCManager !== 'undefined' && NPCManager && NPCManager.updateNPC) {
            NPCManager.updateNPC(npc.id, { portraitId: npc.portraitId });
          }
        } catch(e) { console.warn(e); }
      }
    }
    
    // v7: 支持多表情差分 - 如果有expression字段，尝试加载对应表情
    let portraitUrl = null;
    let isTransparent = false;
    if (npc && npc.portraitId) {
      try {
        // 检查是否有表情差分
        if (npc.expressions && npc.expressions.length > 0 && npc.currentExpression) {
          const expr = npc.expressions.find(e => e.name === npc.currentExpression);
          if (expr && expr.imageId) {
            portraitUrl = await Storage.getImage(expr.imageId);
            isTransparent = expr.transparent || false;
          }
        }
        // 没有表情差分则使用默认立绘
        if (!portraitUrl) {
          portraitUrl = await Storage.getImage(npc.portraitId);
          const imgRecord = await Storage.dbGet?.('images', npc.portraitId);
          isTransparent = imgRecord && imgRecord.meta && imgRecord.meta.transparent === true;
        }
      } catch(e) { console.warn('获取立绘失败:', e); }
    }
    
    // 视觉小说模式 - 增强渲染
    const layer = document.getElementById('vnCharLayer');
    if (layer) {
      if (!id) { 
        layer.innerHTML = ''; 
      } else if (portraitUrl && npc) {
        // v7: 增强立绘显示效果
        const imgStyle = isTransparent 
          ? 'border:none;box-shadow:none;filter:drop-shadow(0 8px 16px rgba(44,24,16,0.3));'
          : 'border-radius:8px;';
        const wrapperStyle = isTransparent
          ? ''
          : 'padding:8px;background:linear-gradient(135deg, rgba(245,230,211,0.9) 0%, rgba(232,213,185,0.9) 100%);border:3px solid rgba(201,162,39,0.6);border-radius:16px;box-shadow:0 0 40px rgba(201,162,39,0.25), 0 12px 32px rgba(44,24,16,0.2);backdrop-filter:blur(8px);';
        
        layer.innerHTML = `<div style="${wrapperStyle}animation:vnCharEnter 0.6s ease-out;"><img src="${portraitUrl}" class="vn-character" alt="${npc.name}" style="max-height:55vh;object-fit:contain;${imgStyle}"></div>`;
        
        // 更新角色名标签
        const mdCharNameTag = document.getElementById('mdCharNameTag');
        if (mdCharNameTag) {
          mdCharNameTag.textContent = npc.name || '角色';
          mdCharNameTag.style.display = 'block';
        }
      } else {
        // 无立绘时的占位符
        layer.innerHTML = `<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1" style="opacity:0.4;margin-bottom:8px;"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><p>${npc && npc.name ? npc.name : '角色'}<br><small>暂无立绘</small></p></div>`;
      }
    }
    
    // Markdown模式
    const mdCharLayer = document.getElementById('mdCharLayer');
    if (mdCharLayer && id) {
      if (portraitUrl && npc) {
        mdCharLayer.innerHTML = `<img src="${portraitUrl}" alt="${npc.name}" style="max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.2));animation:vnCharEnter 0.5s ease-out;">`;
      } else {
        mdCharLayer.innerHTML = this._renderPlaceholder(npc && npc.name ? npc.name : '选择角色后<br>立绘将显示于此');
      }
    }
  },

  _renderPlaceholder(text) {
    return `<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px;">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1" style="opacity:0.4;margin-bottom:8px;"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <p>${text}</p>
    </div>`;
  },

  async selectBg(id) {
    if (!id) return;
    let bg;
    if (typeof BackgroundLibrary !== 'undefined' && BackgroundLibrary && BackgroundLibrary.getBackgrounds) {
      try { bg = BackgroundLibrary.getBackgrounds().find(b => b.id === id); } catch(e) { console.warn(e); }
    }
    if (!bg) {
      try { bg = Storage.get('backgrounds_v3', Storage.get('backgrounds_v2', [])).find(b => b.id === id); } catch(e) { console.warn(e); }
    }
    const img = document.getElementById('vnBg');
    const sceneBadge = document.getElementById('vnSceneBadge');
    if (!img || !bg) return;
    try {
      const d = await Storage.getImage(bg.imageId);
      if (d) {
        // v7: 淡入淡出切换背景
        img.style.opacity = '0';
        img.classList.remove('vn-bg-active');
        await new Promise(r => setTimeout(r, 300));
        img.src = d;
        img.onload = () => {
          img.style.opacity = '1';
          img.classList.add('vn-bg-active');
        };
        if (!img.onload) img.style.opacity = '1';
        
        this._state.scene = bg.name;
        try { Storage.set('currentScene', bg.name); } catch(e) {}
        this._state.currentBgId = id;
        
        // 更新场景名标签
        if (sceneBadge) sceneBadge.textContent = bg.name || '场景';
      }
    } catch(e) { console.warn(e); }
  },

  async selectMusic(id) {
    if (!id) {
      if (typeof MusicManager !== 'undefined' && MusicManager && MusicManager._audio) MusicManager._audio.pause();
      return;
    }
    if (typeof MusicManager !== 'undefined' && MusicManager && MusicManager.play) {
      try { await MusicManager.play(id); } catch(e) { console.warn(e); }
    }
    this._state.currentMusicId = id;
  },

  async playerSend() {
    const input = document.getElementById('rt_input');
    if (!input) return;
    const text = input.value.trim();
    if (!text || this._state.isAIThinking) return;
    input.value = '';
    this._pushUndo();
    let playerName = '玩家';
    try { playerName = Storage.get('playerName', '玩家'); } catch(e) { console.warn(e); }
    this.showDialog(playerName, text);
    this._state.history.push({ role: 'user', content: text, speaker: playerName });
    if (this._state.npcId) await this.genAIReply(text);
    else this.showDialog('系统', '请先在上方选择角色。');
  },

  async genAIReply(playerText) {
    this._pushUndo();
    this._state.isAIThinking = true;
    const loading = document.getElementById('vnLoading');
    if (loading) loading.style.display = 'block';
    try {
      const s = this.getSettings();
      const histText = this._state.history.slice(-6).map(h => `${h.speaker || '??'}：${h.content}`).join('\n');

      /* 1. Memory recall */
      let memText = '(无相关记忆)';
      if (s.enableMemory && typeof MemorySystem !== 'undefined' && MemorySystem && MemorySystem.recall) {
        try {
          const recalled = await MemorySystem.recall(playerText, { npcId: this._state.npcId });
          if (recalled.length > 0) memText = recalled.map(r => r.memory.content).join('\n---\n');
        } catch(e) { console.warn(e); }
      }

      /* 2. World book injection */
      let wbText = '';
      if (s.enableWorldBook && typeof WorldBook !== 'undefined' && WorldBook && WorldBook.getInjectionText) {
        try { wbText = WorldBook.getInjectionText(playerText + ' ' + histText); } catch(e) { console.warn(e); }
      }

      /* 3. Baike auto-detect */
      let baikeText = '';
      if (s.enableBaike && typeof BaikeIntegration !== 'undefined' && BaikeIntegration && BaikeIntegration.autoDetect) {
        try {
          const baikeResult = await BaikeIntegration.autoDetect(playerText);
          if (baikeResult && baikeResult.injected) baikeText = `【百科知识】${baikeResult.query}：${baikeResult.result}\n`;
        } catch(e) { console.warn(e); }
      }

      /* 4. Scene context */
      let sceneText = '';
      if (this._state.sceneContext.name) sceneText = `【当前场景】${this._state.sceneContext.name}：${this._state.sceneContext.desc}\n`;
      else sceneText = `【当前场景】${this._state.scene}\n`;

      /* 5. Style & length prompt */
      const stylePrompt = this._getStylePrompt();

      /* 6. Build prompts */
      let sysPrompt = '', userPrompt = '';
      if (typeof PromptSystem !== 'undefined' && PromptSystem && PromptSystem.buildNPCPrompt) {
        try {
          const pd = PromptSystem.buildNPCPrompt(this._state.npcId, { history: histText, memory: memText, scene: this._state.scene });
          sysPrompt = pd.system;
          userPrompt = pd.user;
        } catch(e) { console.warn(e); }
      }
      sysPrompt += '\n\n' + stylePrompt + '\n' + sceneText;
      if (wbText) sysPrompt += '\n【世界设定】\n' + wbText;
      if (baikeText) sysPrompt += '\n' + baikeText;

      const messages = [{ role: 'system', content: sysPrompt }];
      const recent = this._state.history.slice(-10).map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content }));
      messages.push(...recent, { role: 'user', content: userPrompt });

      let reply;
      try { reply = await APISettings.chat(null, messages); }
      catch (apiErr) { reply = `【旁白】（API调用失败：${apiErr.message}）\n请检查API设置。`; }

      /* 7. Regex processing */
      let processed = { text: reply, events: [] };
      if (typeof RegexEngine !== 'undefined' && RegexEngine && RegexEngine.process) {
        try { processed = RegexEngine.process(reply, { npcId: this._state.npcId, scene: this._state.scene }); } catch(e) { console.warn(e); }
      }
      reply = processed.text;

      /* 8. Save memory */
      let npcs = [];
      if (typeof NPCManager !== 'undefined' && NPCManager && NPCManager.getNPCs) {
        try { npcs = NPCManager.getNPCs(); } catch(e) { console.warn(e); }
      }
      const npc = npcs.find(n => n.id === this._state.npcId);
      if (typeof MemorySystem !== 'undefined' && MemorySystem && MemorySystem.addMemory) {
        try {
          await MemorySystem.addMemory({ content: `${npc && npc.name ? npc.name : '角色'}：${reply}`, npcId: this._state.npcId, scene: this._state.scene, type: 'dialogue' });
          await MemorySystem.addMemory({ content: `${playerText}`, npcId: this._state.npcId, scene: this._state.scene, type: 'dialogue' });
        } catch(e) { console.warn(e); }
      }

      /* 9. Show reply */
      const speaker = npc && npc.name ? npc.name : '角色';
      this.showDialog(speaker, reply, s.enableTypingEffect);
      this._state.history.push({ role: 'assistant', content: reply, speaker });

      /* 10. Events & status */
      if (processed.events && processed.events.length > 0 && typeof RegexEngine !== 'undefined' && RegexEngine && RegexEngine.handleEvents) {
        try { RegexEngine.handleEvents(processed.events); } catch(e) { console.warn(e); }
      }
      if (typeof StatusBar !== 'undefined' && StatusBar && StatusBar.updateOverlay) {
        try { StatusBar.updateOverlay(); } catch(e) { console.warn(e); }
      }

      /* 11. Achievement tracking */
      if (typeof AchievementSystem !== 'undefined' && AchievementSystem && AchievementSystem.incrementStat) {
        try {
          AchievementSystem.incrementStat('chat_count', 1);
          if (this._state.history.length >= 10) AchievementSystem.unlock('social_butterfly');
        } catch(e) { console.warn(e); }
      }

      // v11 自动记录NPC好感度
      if (this._state.npcId && typeof NPCMoodTracker !== 'undefined' && NPCMoodTracker && NPCMoodTracker.recordMood) {
        try {
          let npcRecord = null;
          if (typeof NPCManager !== 'undefined' && NPCManager && NPCManager.getNPCById) {
            npcRecord = NPCManager.getNPCById(this._state.npcId);
          }
          const affectionValue = npcRecord && npcRecord.affection !== undefined ? npcRecord.affection : 50;
          const moodSummary = reply.substring(0, 20) + '...';
          NPCMoodTracker.recordMood(this._state.npcId, affectionValue, moodSummary);
        } catch(e) { console.warn(e); }
      }
    } catch (e) {
      this.showDialog('系统', '错误：' + e.message);
    } finally {
      this._state.isAIThinking = false;
      if (loading) loading.style.display = 'none';
    }
  },

  async requestChoices() {
    if (!this._state.npcId) { if (window.App && App.toast) App.toast('选择角色', 'info'); return; }
    if (this._state.isAIThinking) return;
    this._state.isAIThinking = true;
    const loading = document.getElementById('vnLoading');
    if (loading) loading.style.display = 'block';
    try {
      let prompts = {};
      if (typeof PromptSystem !== 'undefined' && PromptSystem && PromptSystem.getPrompts) {
        try { prompts = PromptSystem.getPrompts(); } catch(e) { console.warn(e); }
      }
      const hist = this._state.history.slice(-6).map(h => `${h.speaker}：${h.content}`).join('\n');
      let recalled = [];
      if (typeof MemorySystem !== 'undefined' && MemorySystem && MemorySystem.recall) {
        try { recalled = await MemorySystem.recall('选项', { npcId: this._state.npcId }); } catch(e) { console.warn(e); }
      }
      const memText = recalled.map(r => r.memory.content).join('\n') || '(无)';
      let vars = {};
      if (typeof PromptSystem !== 'undefined' && PromptSystem && PromptSystem.buildVars) {
        try { vars = PromptSystem.buildVars(this._state.npcId, { history: hist, memory: memText, scene: this._state.scene }); } catch(e) { console.warn(e); }
      }
      let choicePrompt = '给出3个选项';
      if (typeof PromptSystem !== 'undefined' && PromptSystem && PromptSystem.render) {
        try { choicePrompt = PromptSystem.render(prompts.choicePrompt || '给出3个选项', vars); } catch(e) { console.warn(e); }
      }
      const style = this._getStylePrompt();
      const result = await APISettings.chat(choicePrompt, [{ role: 'system', content: '你是视觉小说选项生成器。只返回3个选项，每行一个。' + style }], { useAux: true });
      const choices = result.split('\n').filter(l => l.trim()).slice(0, 5);
      this.showChoices(choices);
    } catch (e) { if (window.App && App.toast) App.toast('选项生成失败: ' + e.message, 'error'); }
    finally { this._state.isAIThinking = false; if (loading) loading.style.display = 'none'; }
  },

  showDialog(speaker, text, typewriter = false) {
    const s = this.getSettings();
    // ====== 沉浸式视觉小说模式 ======
    const box = document.getElementById('vnDialogBox');
    const spEl = document.getElementById('vnSpeaker');
    const txtEl = document.getElementById('vnDialogText');
    const nextInd = document.getElementById('vnNextIndicator');
    if (box && spEl && txtEl) {
      box.style.display = 'block';
      spEl.textContent = speaker;
      if (this._state.timer) { clearInterval(this._state.timer); this._state.timer = null; }
      if (typewriter && s.enableTypingEffect) {
        this._state.isTyping = true;
        let i = 0; txtEl.innerHTML = '<span class="vn-dialog-cursor"></span>';
        if (nextInd) nextInd.style.display = 'none';
        this._state.timer = setInterval(() => {
          if (i < text.length) { txtEl.innerHTML = text.substring(0, i + 1) + '<span class="vn-dialog-cursor"></span>'; i++; }
          else { clearInterval(this._state.timer); this._state.timer = null; this._state.isTyping = false; txtEl.innerHTML = text; if (nextInd) nextInd.style.display = 'block'; }
        }, s.typingSpeed || 30);
      } else { txtEl.textContent = text; if (nextInd) nextInd.style.display = 'block'; }
    }
    // ====== Markdown对话模式 ======
    const mdSpeakerBar = document.getElementById('mdSpeakerBar');
    const mdSpeakerName = document.getElementById('mdSpeakerName');
    const mdDialogText = document.getElementById('mdDialogText');
    const mdSceneName = document.getElementById('mdSceneName');
    if (mdDialogText) {
      if (mdSpeakerBar) mdSpeakerBar.style.display = 'flex';
      if (mdSpeakerName) mdSpeakerName.textContent = speaker;
      if (mdSceneName) mdSceneName.textContent = this._state.scene || '起始场景';
      // 更精致的对话气泡样式
      const entry = document.createElement('div');
      const isPlayer = speaker === this._safeStorageGet('playerName','玩家') || speaker.includes('玩家');
      entry.style.cssText = `margin-bottom:14px;padding:12px 14px;border-radius:12px;${
        isPlayer
          ? 'background:linear-gradient(135deg, rgba(201,162,39,0.12), rgba(201,162,39,0.05));border-left:3px solid var(--color-gold);'
          : 'background:rgba(245,230,211,0.6);border-left:3px solid var(--color-primary);'
      }box-shadow:0 1px 4px rgba(44,24,16,0.04);`;
      entry.innerHTML = `<div style="font-size:13px;font-weight:600;color:${isPlayer?'var(--color-gold)':'var(--color-primary)'};margin-bottom:6px;font-family:'Noto Serif SC',serif;letter-spacing:0.5px;">${speaker}</div><div style="font-size:14px;color:var(--text-primary);line-height:1.8;white-space:pre-wrap;">${text.replace(/</g, '&lt;')}</div>`;
      mdDialogText.appendChild(entry);
      const mdDialogBody = document.getElementById('mdDialogBody');
      if (mdDialogBody) mdDialogBody.scrollTop = mdDialogBody.scrollHeight;
    }
  },

  showChoices(choices) {
    const c = document.getElementById('vnChoices');
    if (c) {
      c.innerHTML = choices.map(ch => {
        const t = ch.replace(/^\d+\.\s*/, '').trim();
        return `<button class="vn-immersive-choice" onclick="NovelRuntime.pickChoice('${t.replace(/'/g, "\\'")}')">${t}</button>`;
      }).join('');
      c.style.display = 'flex';
    }
    const mdChoices = document.getElementById('mdChoices');
    if (mdChoices) {
      mdChoices.innerHTML = choices.map((ch, i) => {
        const t = ch.replace(/^\d+\.\s*/, '').trim();
        return `<button class="btn btn-sm btn-secondary" style="margin:4px;border-radius:14px;" onclick="NovelRuntime.pickChoice('${t.replace(/'/g, "\\'")}')">${i + 1}. ${t}</button>`;
      }).join('');
      mdChoices.style.display = 'flex';
      mdChoices.style.flexWrap = 'wrap';
    }
  },

  pickChoice(text) {
    const vnChoices = document.getElementById('vnChoices');
    if (vnChoices) vnChoices.style.display = 'none';
    const mdChoices = document.getElementById('mdChoices');
    if (mdChoices) mdChoices.style.display = 'none';
    const input = document.getElementById('rt_input');
    if (input) input.value = text;
    this.playerSend();
  },

  saveGame() {
    let saves = [];
    try { saves = Storage.get('gameSaves', []); } catch(e) { console.warn(e); }
    let worldData = {}, playerName = '玩家', userMask = {}, npcs = [], gameVars = {}, gameFlags = [];
    try { worldData = Storage.get('worldData', {}); } catch(e) {}
    try { playerName = Storage.get('playerName', '玩家'); } catch(e) {}
    try { userMask = Storage.get('userMask', {}); } catch(e) {}
    try { npcs = Storage.get('npcs_v3', Storage.get('npcs_v2', [])); } catch(e) {}
    try { gameVars = Storage.get('gameVars', {}); } catch(e) {}
    try { gameFlags = Storage.get('gameFlags', []); } catch(e) {}
    saves.unshift({
      id: 'save_' + Date.now(),
      worldName: worldData.name || '',
      npcId: this._state.npcId,
      scene: this._state.scene,
      history: this._state.history,
      playerName: playerName,
      userMask: userMask,
      worldData: worldData,
      npcs: npcs,
      vars: gameVars,
      flags: gameFlags,
      timestamp: Date.now()
    });
    if (saves.length > 10) saves.pop();
    try { Storage.set('gameSaves', saves); } catch(e) { console.warn(e); }
    if (window.App && App.toast) App.toast('已存档', 'success');
  },

  showSaves() {
    let saves = [];
    try { saves = Storage.get('gameSaves', []); } catch(e) { console.warn(e); }
    if (saves.length === 0) { if (window.App && App.toast) App.toast('没有存档', 'info'); return; }
    const content = saves.map(s => `<div class="list-item" style="cursor:pointer;" onclick="NovelRuntime.doLoad('${s.id}')"><div class="list-info"><h4>${s.worldName || '未命名'} · ${s.scene || ''}</h4><p>${new Date(s.timestamp).toLocaleString()}</p></div></div>`).join('');
    if (window.App && App.showModal) App.showModal('读档', content);
  },

  doLoad(id) {
    let saves = [];
    try { saves = Storage.get('gameSaves', []); } catch(e) { console.warn(e); }
    const save = saves.find(s => s.id === id);
    if (!save) return;
    if (save.userMask) { try { Storage.set('userMask', save.userMask); } catch(e) {} }
    if (save.worldData) { try { Storage.set('worldData', save.worldData); } catch(e) {} }
    if (save.npcs) { try { Storage.set('npcs_v3', save.npcs); } catch(e) {} }
    if (save.history) this._state.history = save.history;
    if (save.vars) { try { Storage.set('gameVars', save.vars); } catch(e) {} }
    if (save.flags) { try { Storage.set('gameFlags', save.flags); } catch(e) {} }
    this._state.npcId = save.npcId;
    this._state.scene = save.scene || '起始场景';
    try { Storage.set('playerName', save.playerName || '玩家'); } catch(e) {}
    if (window.App && App.closeModal) App.closeModal();
    this.refreshSelectors();
    this.selectNPC(this._state.npcId);
    const last = this._state.history.slice(-2);
    last.forEach(h => this.showDialog(h.speaker || '??', h.content));
    if (window.App && App.toast) App.toast('读档成功', 'success');
  },

  clearHistory() {
    this._state.history = [];
    const box = document.getElementById('vnDialogBox');
    const choices = document.getElementById('vnChoices');
    if (box) box.style.display = 'none';
    if (choices) choices.style.display = 'none';
    const mdDialogText = document.getElementById('mdDialogText');
    if (mdDialogText) mdDialogText.innerHTML = '';
    const mdSpeakerBar = document.getElementById('mdSpeakerBar');
    if (mdSpeakerBar) mdSpeakerBar.style.display = 'none';
    if (window.App && App.toast) App.toast('对话已清空', 'info');
  },

  toggleAuto() {
    this._state.autoPlay = !this._state.autoPlay;
    const btn = document.getElementById('vnAutoBtn');
    if (btn) {
      btn.innerHTML = this._state.autoPlay
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
    }
    if (window.App && App.toast) App.toast(this._state.autoPlay ? '自动播放开启' : '自动播放关闭', 'info');
  },

  showHistory() {
    const body = this._state.history.length === 0
      ? '<p style="color:var(--text-muted);text-align:center;padding:20px;">无记录</p>'
      : this._state.history.map(h => `<div style="padding:8px 0;border-bottom:1px solid var(--border-color);"><strong style="color:var(--color-gold);">${h.speaker || '??'}</strong><p style="margin-top:4px;font-size:14px;">${h.content}</p></div>`).join('');
    if (window.App && App.showModal) App.showModal('历史记录', body);
  },

  toggleFullscreen() {
    const container = document.getElementById('vnContainer');
    if (!container) return;
    if (document.fullscreenElement) { document.exitFullscreen(); container.classList.remove('fullscreen'); }
    else { if (container.requestFullscreen) container.requestFullscreen(); else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen(); container.classList.add('fullscreen'); }
  },

  /* 剧情撤回、重写、继续功能 */
  _undoStack: [],
  _redoStack: [],
  _maxUndoSize: 20,

  _pushUndo() {
    const state = JSON.parse(JSON.stringify({
      history: this._state.history,
      npcId: this._state.npcId,
      scene: this._state.scene,
      currentBgId: this._state.currentBgId,
      currentMusicId: this._state.currentMusicId
    }));
    this._undoStack.push(state);
    if (this._undoStack.length > this._maxUndoSize) this._undoStack.shift();
    this._redoStack = [];
  },

  undo() {
    if (this._undoStack.length === 0) { if (window.App && App.toast) App.toast('没有可撤回的步骤', 'info'); return; }
    const current = JSON.parse(JSON.stringify({
      history: this._state.history,
      npcId: this._state.npcId,
      scene: this._state.scene,
      currentBgId: this._state.currentBgId,
      currentMusicId: this._state.currentMusicId
    }));
    this._redoStack.push(current);
    const prev = this._undoStack.pop();
    this._state.history = prev.history;
    this._state.npcId = prev.npcId;
    this._state.scene = prev.scene;
    this._state.currentBgId = prev.currentBgId;
    this._state.currentMusicId = prev.currentMusicId;
    this._refreshDisplay();
    if (window.App && App.toast) App.toast('已撤回上一步', 'success');
  },

  redo() {
    if (this._redoStack.length === 0) { if (window.App && App.toast) App.toast('没有可重做的步骤', 'info'); return; }
    const current = JSON.parse(JSON.stringify({
      history: this._state.history,
      npcId: this._state.npcId,
      scene: this._state.scene,
      currentBgId: this._state.currentBgId,
      currentMusicId: this._state.currentMusicId
    }));
    this._undoStack.push(current);
    const next = this._redoStack.pop();
    this._state.history = next.history;
    this._state.npcId = next.npcId;
    this._state.scene = next.scene;
    this._state.currentBgId = next.currentBgId;
    this._state.currentMusicId = next.currentMusicId;
    this._refreshDisplay();
    if (window.App && App.toast) App.toast('已重做', 'success');
  },

  async rewriteLast() {
    if (this._state.history.length === 0) { if (window.App && App.toast) App.toast('没有可重写的内容', 'info'); return; }
    let lastAIIndex = -1;
    for (let i = this._state.history.length - 1; i >= 0; i--) {
      if (this._state.history[i].role === 'assistant') { lastAIIndex = i; break; }
    }
    if (lastAIIndex === -1) { if (window.App && App.toast) App.toast('没有找到AI回复', 'info'); return; }
    this._pushUndo();
    const newHistory = this._state.history.slice(0, lastAIIndex);
    this._state.history = newHistory;
    const lastUserMsg = newHistory.length > 0 && newHistory[newHistory.length - 1].role === 'user'
      ? newHistory[newHistory.length - 1].content : '';
    await this.genAIReply(lastUserMsg || '请继续');
    if (window.App && App.toast) App.toast('已重写最后一条回复', 'success');
  },

  async continueStory() {
    if (this._state.history.length === 0) { if (window.App && App.toast) App.toast('没有上下文，请先开始对话', 'info'); return; }
    this._pushUndo();
    const lastEntry = this._state.history[this._state.history.length - 1];
    const prompt = lastEntry.role === 'assistant'
      ? '请继续剧情，自然地延续上文。'
      : lastEntry.content;
    await this.genAIReply(prompt);
    if (window.App && App.toast) App.toast('剧情继续', 'success');
  },

  _refreshDisplay() {
    const box = document.getElementById('vnDialogBox');
    const choices = document.getElementById('vnChoices');
    if (choices) choices.style.display = 'none';
    if (this._state.history.length === 0) {
      if (box) box.style.display = 'none';
      return;
    }
    const recent = this._state.history.slice(-2);
    if (recent.length > 0) {
      const last = recent[recent.length - 1];
      this.showDialog(last.speaker || '??', last.content, false);
    }
    this.refreshSelectors();
    if (this._state.npcId) this.selectNPC(this._state.npcId);
  },

  exportStoryText() {
    if (this._state.history.length === 0) { if (window.App && App.toast) App.toast('没有剧情可导出', 'info'); return; }
    const text = this._state.history.map(h => `${h.speaker || '??'}：${h.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `剧情文本_${new Date().toISOString().slice(0,10)}.txt`; a.click();
    URL.revokeObjectURL(url);
    if (window.App && App.toast) App.toast('剧情文本已导出', 'success');
  },

  /**
   * v7: 跳过正在进行的打字机文本
   */
  skipText() {
    if (this._state.isTyping && this._state.timer) {
      clearInterval(this._state.timer);
      this._state.timer = null;
      this._state.isTyping = false;
      // 显示完整文本
      const txtEl = document.getElementById('vnDialogText');
      const nextInd = document.getElementById('vnNextIndicator');
      if (txtEl && this._state.history.length > 0) {
        const last = this._state.history[this._state.history.length - 1];
        txtEl.textContent = last.content;
      }
      if (nextInd) nextInd.style.display = 'block';
    }
  },

  /* ====== 触摸手势支持 v7 ====== */
  _initTouchGestures() {
    const container = document.getElementById('vnContainer');
    if (!container || this._touchInitialized) return;
    this._touchInitialized = true;
    
    let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
    
    container.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }, { passive: true });
    
    container.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const deltaTime = Date.now() - touchStartTime;
      
      // 点击（轻触）- 跳过文本或显示下一条
      if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 300) {
        if (this._state.isTyping) {
          this.skipText();
        } else {
          // 点击空白处继续剧情
          const input = document.getElementById('rt_input');
          if (input && !this._state.isAIThinking) {
            // 可以触发继续剧情
          }
        }
      }
      // 左滑 - 显示历史
      else if (deltaX < -50 && Math.abs(deltaY) < 50) {
        this.showHistory();
      }
      // 右滑 - 隐藏历史/菜单
      else if (deltaX > 50 && Math.abs(deltaY) < 50) {
        // 可以隐藏面板
      }
      // 上滑 - 存档
      else if (deltaY < -50 && Math.abs(deltaX) < 50) {
        this.saveGame();
      }
    }, { passive: true });
  },

  jumpToHistory(index) {
    if (index < 0 || index >= this._state.history.length) return;
    this._pushUndo();
    this._state.history = this._state.history.slice(0, index + 1);
    this._refreshDisplay();
    if (window.App && App.toast) App.toast(`已跳转到第 ${index + 1} 条记录`, 'success');
  },

  openInteraction(npcId) {
    const panel = document.getElementById('interactionPanel');
    if (!panel) return;
    let npcs = [];
    if (typeof NPCManager !== 'undefined' && NPCManager && NPCManager.getNPCs) {
      try { npcs = NPCManager.getNPCs(); } catch(e) { console.warn(e); }
    }
    const npc = npcs.find(n => n.id === npcId);
    const titleEl = document.getElementById('interactionTitle');
    if (titleEl) titleEl.textContent = npc && npc.name ? npc.name : '对话';
    const subtitleEl = document.getElementById('interactionSubtitle');
    if (subtitleEl) subtitleEl.textContent = (this._state.sceneContext.name || this._state.scene) + (npc ? ' · ' + npc.name : '');
    const bodyEl = document.getElementById('interactionBody');
    if (bodyEl) bodyEl.innerHTML = `<div class="interaction-msg npc"><strong>${npc && npc.name ? npc.name : '角色'}</strong><br>正在进入闲聊...</div>`;
    panel.style.display = 'flex';
  },

  closeInteraction() {
    const panel = document.getElementById('interactionPanel');
    if (panel) panel.style.display = 'none';
  },

  /* ====== 双模式渲染 ====== */

  /**
   * 沉浸式视觉小说模式 v7 - 易次元风格全屏沉浸式UI
   * 特性：全屏场景覆盖 | 角色立绘动态进入 | 底部半透明对话栏 | 顶部信息条 | 触摸手势支持
   */
  _renderVisualNovelMode(portraitPosClass) {
    return `
      <div class="vn-game-container vn-immersive" id="vnContainer" style="min-height:60vh;position:relative;overflow:hidden;border-radius:20px;margin-bottom:var(--space-md);box-shadow:0 4px 20px rgba(44,24,16,0.12);">
        <!-- 背景层：支持淡入淡出切换 -->
        <div class="vn-bg-wrapper" id="vnBgWrapper" style="position:absolute;top:0;left:0;right:0;bottom:0;z-index:1;">
          <img class="vn-bg-layer" id="vnBg" alt="" style="opacity:0;transition:opacity 0.8s ease-in-out;">
          <div class="vn-bg-vignette" style="position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(ellipse at center, transparent 40%, rgba(44,24,16,0.4) 100%);z-index:2;pointer-events:none;"></div>
        </div>

        <!-- 角色立绘层：动态进入动画 -->
        <div class="vn-char-layer ${portraitPosClass}" id="vnCharLayer" style="filter:drop-shadow(0 12px 24px rgba(44,24,16,0.35));transition:all 0.5s ease;"></div>

        <!-- 顶部信息条：场景名称+时间+状态 -->
        <div class="vn-top-bar" id="vnTopBar" style="position:absolute;top:0;left:0;right:0;z-index:15;display:flex;align-items:center;justify-content:space-between;padding:10px 20px;background:linear-gradient(180deg, rgba(44,24,16,0.7) 0%, transparent 100%);pointer-events:none;">
          <div style="display:flex;align-items:center;gap:8px;pointer-events:auto;">
            <span id="vnSceneBadge" style="background:rgba(201,162,39,0.25);border:1px solid rgba(201,162,39,0.5);color:#C9A227;padding:3px 10px;border-radius:12px;font-size:12px;font-family:'Noto Serif SC',serif;backdrop-filter:blur(4px);">场景</span>
            <span id="vnTimeBadge" style="background:rgba(44,24,16,0.4);border:1px solid rgba(255,255,255,0.15);color:#F5E6D3;padding:3px 10px;border-radius:12px;font-size:12px;backdrop-filter:blur(4px);">--:--</span>
          </div>
          <div class="vn-status-bar" id="vnStatusOverlay" style="pointer-events:auto;">${typeof StatusBar !== 'undefined' && StatusBar && StatusBar.getOverlayHTML ? StatusBar.getOverlayHTML() : ''}</div>
        </div>

        <!-- 右侧快捷操作栏（类似易次元侧边菜单） -->
        <div class="vn-side-menu" id="vnSideMenu" style="position:absolute;top:50%;right:12px;transform:translateY(-50%);z-index:15;display:flex;flex-direction:column;gap:8px;opacity:0.7;transition:opacity 0.3s;">
          <button class="vn-side-btn" onclick="NovelRuntime.saveGame()" title="存档">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5E6D3" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
          </button>
          <button class="vn-side-btn" onclick="NovelRuntime.showSaves()" title="读档">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5E6D3" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/></svg>
          </button>
          <button class="vn-side-btn" onclick="NovelRuntime.toggleAuto()" title="自动播放" id="vnAutoBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5E6D3" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </button>
          <button class="vn-side-btn" onclick="NovelRuntime.toggleSettings()" title="设置">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5E6D3" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06-.06a2 2 0 01-2.83 0 2 2 0 010-2.83l-.06-.06A1.65 1.65 0 004.62 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06-.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          </button>
          <button class="vn-side-btn" onclick="NovelRuntime.toggleFullscreen()" title="全屏">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5E6D3" stroke-width="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
          </button>
        </div>

        <!-- 底部操作栏：返回+历史+跳过 -->
        <div class="vn-bottom-bar" style="position:absolute;bottom:0;left:0;right:0;z-index:15;display:flex;justify-content:space-between;align-items:center;padding:8px 20px;background:linear-gradient(0deg, rgba(44,24,16,0.6) 0%, transparent 100%);pointer-events:none;">
          <button class="vn-bottom-btn" onclick="App.navigate('home')" style="pointer-events:auto;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5E6D3" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg> 返回
          </button>
          <div style="display:flex;gap:6px;pointer-events:auto;">
            <button class="vn-bottom-btn" onclick="NovelRuntime.showHistory()" title="历史">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5E6D3" stroke-width="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 111.13-9.36L1 10"/></svg>
            </button>
            <button class="vn-bottom-btn" onclick="NovelRuntime.skipText()" title="跳过">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5E6D3" stroke-width="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
            </button>
          </div>
        </div>

        <!-- 互动面板 -->
        <div class="interaction-panel" id="interactionPanel" style="display:none;">
          <div class="interaction-header">
            <div>
              <h4 id="interactionTitle">对话</h4>
              <p style="font-size:12px;color:var(--text-muted);margin-top:2px;" id="interactionSubtitle"></p>
            </div>
            <button class="close-btn" onclick="NovelRuntime.closeInteraction()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="interaction-body" id="interactionBody"></div>
          <div class="interaction-input-area">
            <input type="text" id="interactionInput" placeholder="点击此处开始闲聊..." onkeydown="if(event.key==='Enter')NovelRuntime.sendFromPanel()">
            <button class="btn btn-sm btn-primary" onclick="NovelRuntime.sendFromPanel()">发送</button>
          </div>
        </div>

        <!-- v7 沉浸式对话区：底部居中，更大更通透 -->
        <div class="vn-dialog-immersive" id="vnDialogBox" style="display:none;">
          <div class="vn-immersive-speaker-row">
            <div class="vn-immersive-speaker" id="vnSpeaker">--</div>
            <div class="vn-immersive-line"></div>
          </div>
          <div class="vn-immersive-text" id="vnDialogText"></div>
          <div class="vn-immersive-next-indicator" id="vnNextIndicator" style="display:none;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A227" stroke-width="2" style="animation:vnBounce 1.5s infinite;"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>

        <!-- 选项区：底部对话框上方 -->
        <div class="vn-immersive-choices" id="vnChoices" style="display:none;"></div>

        <!-- 加载动画 -->
        <div id="vnLoading" style="display:none;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:16px;z-index:40;">
          <div style="text-align:center;">
            <div style="font-size:32px;animation:vnSpin 1s linear infinite;display:inline-block;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            </div>
            <p style="margin-top:8px;font-family:'Noto Serif SC',serif;">墨境思考中...</p>
          </div>
        </div>
      </div>

      <style>
        /* ===== v7 沉浸式视觉小说样式 ===== */
        @keyframes vnSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes vnBounce{0%,100%{transform:translateY(0);opacity:1}50%{transform:translateY(6px);opacity:0.5}}
        @keyframes vnCharEnter{from{opacity:0;transform:translateY(30px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes vnBgFade{from{opacity:0}to{opacity:1}}
        @keyframes vnDialogSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}

        .vn-immersive .vn-char-layer img {
          animation: vnCharEnter 0.6s ease-out;
        }
        .vn-immersive .vn-bg-layer.vn-bg-active {
          animation: vnBgFade 0.8s ease-in-out;
        }

        .vn-side-btn {
          width:36px;height:36px;border-radius:50%;
          background:rgba(44,24,16,0.6);border:1px solid rgba(201,162,39,0.3);
          display:flex;align-items:center;justify-content:center;
          cursor:pointer;transition:all 0.2s;backdrop-filter:blur(4px);
        }
        .vn-side-btn:hover { background:rgba(201,162,39,0.3);border-color:#C9A227;transform:scale(1.1); }

        .vn-bottom-btn {
          background:rgba(44,24,16,0.5);border:1px solid rgba(255,255,255,0.15);
          color:#F5E6D3;padding:6px 12px;border-radius:16px;font-size:12px;
          cursor:pointer;transition:all 0.2s;backdrop-filter:blur(4px);
          display:flex;align-items:center;gap:4px;
        }
        .vn-bottom-btn:hover { background:rgba(201,162,39,0.25);border-color:rgba(201,162,39,0.5); }

        .vn-dialog-immersive {
          position:absolute;
          bottom:48px;
          left:50%;transform:translateX(-50%);
          width:92%;max-width:720px;
          background:linear-gradient(180deg, rgba(44,24,16,0.82) 0%, rgba(44,24,16,0.92) 100%);
          backdrop-filter:blur(20px) saturate(1.2);
          -webkit-backdrop-filter:blur(20px) saturate(1.2);
          border:1px solid rgba(201,162,39,0.5);
          border-radius:24px;
          padding:22px 28px;
          box-shadow:0 -4px 40px rgba(201,162,39,0.15), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
          z-index:20;
          max-height:38vh;
          overflow-y:auto;
          animation:vnDialogSlideUp 0.4s ease-out;
        }
        .vn-immersive-speaker-row {
          display:flex;align-items:center;gap:12px;margin-bottom:10px;
        }
        .vn-immersive-speaker {
          font-family:'Noto Serif SC',serif;
          font-size:16px;font-weight:700;
          color:#C9A227;
          letter-spacing:2px;
          text-shadow:0 0 12px rgba(201,162,39,0.5);
          white-space:nowrap;
        }
        .vn-immersive-line {
          flex:1;height:1px;
          background:linear-gradient(90deg, rgba(201,162,39,0.6), transparent);
        }
        .vn-immersive-text {
          font-size:15.5px;line-height:1.9;
          color:#F5E6D3;
          white-space:pre-wrap;
          text-shadow:0 1px 3px rgba(0,0,0,0.4);
          min-height:40px;
        }
        .vn-immersive-next-indicator {
          text-align:center;margin-top:8px;
        }

        .vn-immersive-choices {
          position:absolute;
          bottom:calc(38vh + 56px);
          left:50%;transform:translateX(-50%);
          width:92%;max-width:720px;
          display:flex;flex-direction:column;gap:10px;
          z-index:20;
        }
        .vn-immersive-choice {
          background:rgba(44,24,16,0.75);
          backdrop-filter:blur(12px);
          border:1px solid rgba(201,162,39,0.4);
          border-radius:16px;
          padding:14px 20px;
          color:#F5E6D3;
          font-size:14.5px;
          cursor:pointer;
          transition:all 0.25s;
          text-align:center;
          box-shadow:0 2px 12px rgba(0,0,0,0.2);
        }
        .vn-immersive-choice:hover {
          background:rgba(201,162,39,0.2);
          border-color:#C9A227;
          transform:translateX(4px);
          box-shadow:0 4px 20px rgba(201,162,39,0.2);
        }

        /* 移动端适配 */
        @media (max-width:768px) {
          .vn-dialog-immersive { width:95%;padding:16px 20px;border-radius:20px;bottom:44px; }
          .vn-immersive-speaker { font-size:14px; }
          .vn-immersive-text { font-size:14px;line-height:1.8; }
          .vn-side-menu { right:6px;gap:6px; }
          .vn-side-btn { width:32px;height:32px; }
          .vn-bottom-bar { padding:6px 12px; }
        }
      </style>
    `;
  },

  /**
   * Markdown对话模式（左立绘 + 右米色面板）
   * 升级：左侧渐变背景+角色名标签，右侧更大内边距+分隔线+对话气泡
   */
  _renderMarkdownMode() {
    return `
      <div id="markdownModeContainer" style="display:flex;gap:0;border-radius:20px;overflow:hidden;border:1px solid var(--border-color);margin-bottom:var(--space-md);min-height:60vh;background:var(--bg-card);box-shadow:0 4px 20px rgba(44,24,16,0.08);">
        <!-- 左侧立绘区：渐变背景 + 角色名标签 -->
        <div id="mdPortraitArea" style="width:35%;min-width:120px;background:linear-gradient(180deg, rgba(232,221,208,0.9) 0%, rgba(245,230,211,0.95) 50%, #f5e6d3 100%);display:flex;align-items:flex-end;justify-content:center;position:relative;overflow:hidden;flex-shrink:0;">
          <!-- 角色名标签 -->
          <div id="mdCharNameTag" style="position:absolute;top:16px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg, rgba(44,24,16,0.8), rgba(44,24,16,0.6));color:#F5E6D3;padding:4px 14px;border-radius:20px;font-size:13px;font-family:'Noto Serif SC',serif;letter-spacing:1px;backdrop-filter:blur(4px);border:1px solid rgba(201,162,39,0.3);display:none;z-index:5;"></div>
          <div id="mdCharLayer" style="width:100%;height:100%;display:flex;align-items:flex-end;justify-content:center;">
            <div style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px;">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1" style="opacity:0.4;margin-bottom:8px;"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <p>选择角色后<br>立绘将显示于此</p>
            </div>
          </div>
        </div>

        <!-- 右侧对话面板：更大内边距、更好分隔线、更精致排版 -->
        <div style="flex:1;display:flex;flex-direction:column;min-width:200px;background:#fdf9f4;">
          <!-- 顶部栏 -->
          <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid rgba(201,162,39,0.2);background:linear-gradient(90deg, rgba(245,230,211,0.6), rgba(245,230,211,0.3));">
            <div style="display:flex;align-items:center;gap:8px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span id="mdSceneName" style="font-size:13px;color:var(--text-primary);font-family:'Noto Serif SC',serif;letter-spacing:0.5px;">${this._state.scene || '起始场景'}</span>
            </div>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-sm btn-secondary" style="border-radius:12px;" onclick="NovelRuntime.showHistory()" title="历史">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 111.13-9.36L1 10"/></svg>
              </button>
              <button class="btn btn-sm btn-secondary" style="border-radius:12px;" onclick="NovelRuntime.clearHistory()" title="清屏">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              </button>
            </div>
          </div>

          <!-- 对话标题：NPC名称 -->
          <div id="mdSpeakerBar" style="padding:12px 18px;border-bottom:1px dashed rgba(201,162,39,0.25);display:none;background:rgba(245,230,211,0.3);">
            <span id="mdSpeakerName" style="font-size:15px;font-weight:600;color:var(--color-primary);font-family:'Noto Serif SC',serif;letter-spacing:0.5px;">--</span>
          </div>

          <!-- 对话内容区：更大内边距 -->
          <div id="mdDialogBody" style="flex:1;overflow-y:auto;padding:18px;max-height:50vh;">
            <div id="mdDialogText" style="font-size:15px;line-height:1.8;color:var(--text-primary);white-space:pre-wrap;"></div>
          </div>

          <!-- 选项区 -->
          <div id="mdChoices" style="display:none;padding:0 18px 14px;"></div>

          <!-- 加载动画 -->
          <div id="mdLoading" style="display:none;padding:20px;text-align:center;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" style="animation:spin 1s linear infinite;"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <p style="font-size:13px;color:var(--text-muted);margin-top:8px;">墨境思考中...</p>
          </div>
        </div>
      </div>
      <style>@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}</style>
    `;
  },

  sendFromPanel() {
    const input = document.getElementById('interactionInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    const body = document.getElementById('interactionBody');
    if (body) {
      let playerName = '玩家';
      try { playerName = Storage.get('playerName', '玩家'); } catch(e) { console.warn(e); }
      body.innerHTML += `<div class="interaction-msg"><strong>${playerName}</strong><br>${text}</div>`;
      body.scrollTop = body.scrollHeight;
    }
    const rtInput = document.getElementById('rt_input');
    if (rtInput) rtInput.value = text;
    this.playerSend();
  },

  get playerName() { return this._safeStorageGet('playerName', '玩家'); }
};
