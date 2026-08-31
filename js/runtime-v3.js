/**
 * =========================================================
 * Visual Novel Runtime v7
 * 增强功能：
 * - 选项 + 自由输入双模式
 * - 顶部状态栏快捷按键
 * - 字数和文风设置
 * - 知识库/世界书/记忆绑定开关
 * - 打字机效果优化
 * - 对话历史管理
 * - 场景上下文联动
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
    novelMode: 'visual', // 'visual' | 'text'  —— v10 双小说模式
    groupMode: false, // v13 群像模式开关
    groupNPCs: [] // v13 群像模式下的在场NPC列表
  },

  /* 运行时设置 */
  getSettings() {
    return Storage.get('runtimeSettings_v7', {
      wordCount: 'medium',      // short / medium / long / custom
      customWordCount: 200,
      style: 'normal',          // normal / poetic / dramatic / concise / custom
      customStylePrompt: '',
      enableMemory: true,
      enableWorldBook: true,
      enableBaike: true,
      enableStatusBar: true,
      enableTypingEffect: true,
      typingSpeed: 30,
      autoSaveInterval: 0,       // 0 = disabled, minutes
      showHistoryPanel: true
    });
  },
  saveSettings(s) { Storage.set('runtimeSettings_v7', s); },

  init() { this.renderPage(); },
  onEnter() { this.refreshSelectors(); this.loadRuntimeSettings(); this._renderSettingsBar(); },

  renderPage() {
    const page = document.getElementById('page-runtime');
    if (!page) return;
    const layout = UIDIY ? UIDIY.getLayout() : { dialogPosition: 'bottom', statusBarPosition: 'top-left', portraitPosition: 'center-right' };
    const dialogPosClass = 'dialog-' + layout.dialogPosition;
    const portraitPosClass = 'portrait-' + layout.portraitPosition;

    page.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md);flex-wrap:wrap;gap:8px;">
        <h2 class="section-title">墨境</h2>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn btn-sm btn-secondary" onclick="NovelRuntime.saveGame()">💾 存档</button>
          <button class="btn btn-sm btn-secondary" onclick="NovelRuntime.showSaves()">📂 读档</button>
          <button class="btn btn-sm btn-secondary" onclick="NovelRuntime.toggleFullscreen()">⛶ 全屏</button>
          <button class="btn btn-sm btn-gold" onclick="NovelRuntime.toggleSettings()">⚙️</button>
        </div>
      </div>

      <!-- v9: 快速操作条 -->
      <div style="display:flex;gap:6px;margin-bottom:var(--space-md);flex-wrap:wrap;">
        <button class="btn btn-sm btn-secondary" onclick="NovelRuntime.undo()">↩️ 撤回</button>
        <button class="btn btn-sm btn-secondary" onclick="NovelRuntime.redo()">↪️ 重做</button>
        <button class="btn btn-sm btn-secondary" onclick="NovelRuntime.rewriteLast()">✏️ 重写</button>
        <button class="btn btn-sm btn-secondary" onclick="NovelRuntime.continueStory()">⏩ 继续</button>
        <button class="btn btn-sm btn-secondary" onclick="NovelRuntime.exportStoryText()">📄 导出文本</button>
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
          <div class="form-group" style="flex:0 0 auto;"><label>玩家</label><input type="text" id="rt_playerName" value="${Storage.get('playerName','玩家')}" style="width:100px;" onchange="Storage.set('playerName',this.value)"></div>
        </div>
      </div>

      <!-- v8: 古风对话界面 -->
      <div class="vn-game-container" id="vnContainer">
        <img class="vn-bg-layer" id="vnBg" alt="" style="opacity:0;">
        <div class="vn-char-layer ${portraitPosClass}" id="vnCharLayer"></div>
        <div class="vn-status-bar" id="vnStatusOverlay">${StatusBar?.getOverlayHTML ? StatusBar.getOverlayHTML() : ''}</div>
        <div class="vn-bottom-controls">
          <button class="btn-icon" onclick="NovelRuntime.toggleSettings()" title="设置">⚙️</button>
          <button class="btn-icon" onclick="NovelRuntime.toggleFullscreen()" title="全屏">⛶</button>
          <button class="btn-icon" onclick="NovelRuntime.saveGame()" title="存档">💾</button>
          <button class="btn-icon" onclick="NovelRuntime.toggleAuto()" title="自动" id="vnAutoBtn">⚡</button>
          <button class="btn-icon" onclick="NovelRuntime.showHistory()" title="历史">📜</button>
        </div>

        <!-- 互动面板（参考图4，默认隐藏） -->
        <div class="interaction-panel" id="interactionPanel" style="display:none;">
          <div class="interaction-header">
            <div>
              <h4 id="interactionTitle">对话</h4>
              <p style="font-size:12px;color:var(--text-muted);margin-top:2px;" id="interactionSubtitle"></p>
            </div>
            <button class="close-btn" onclick="NovelRuntime.closeInteraction()">✕</button>
          </div>
          <div class="interaction-body" id="interactionBody"></div>
          <div class="interaction-input-area">
            <input type="text" id="interactionInput" placeholder="点击此处开始闲聊..." onkeydown="if(event.key==='Enter')NovelRuntime.sendFromPanel()">
            <button class="btn btn-sm btn-primary" onclick="NovelRuntime.sendFromPanel()">发送</button>
          </div>
        </div>

        <!-- 对话区（参考图3风格） -->
        <div class="vn-dialog-classic" id="vnDialogBox" style="display:none;">
          <div class="vn-classic-speaker" id="vnSpeaker">--</div>
          <div class="vn-classic-text" id="vnDialogText"></div>
        </div>
        <div class="vn-classic-choices" id="vnChoices" style="display:none;"></div>
        <div id="vnLoading" style="display:none;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:16px;z-index:40;">
          <div style="text-align:center;">
            <div style="font-size:32px;animation:spin 1s linear infinite;display:inline-block;">⚙️</div>
            <p style="margin-top:8px;">墨境思考中...</p>
          </div>
        </div>
      </div>
      <style>@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}</style>

      <!-- 输入区 -->
      <div style="max-width:1200px;margin:var(--space-md) auto 0;">
        <div class="card">
          <div class="card-body" style="display:flex;gap:var(--space-sm);flex-wrap:wrap;align-items:center;">
            <div style="flex:1;display:flex;gap:8px;min-width:200px;">
              <input type="text" id="rt_input" placeholder="输入对话..." onkeydown="if(event.key==='Enter')NovelRuntime.playerSend()" style="flex:1;">
              <button class="btn btn-primary" onclick="NovelRuntime.playerSend()">发送 ➤</button>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button class="btn btn-sm btn-secondary" onclick="NovelRuntime.requestChoices()">💡 选项</button>
              <button class="btn btn-sm btn-secondary" onclick="NovelRuntime.toggleInputMode()">${this._state.inputMode === 'choice' ? '⌨️ 自由' : '📋 选项'}</button>
              <button class="btn btn-sm btn-secondary" onclick="NovelRuntime.showHistory()">📜 历史</button>
              <button class="btn btn-sm btn-secondary" onclick="NovelRuntime.clearHistory()">🗑️ 清屏</button>
            </div>
          </div>
        </div>
      </div>
    `;
    this.refreshSelectors();
    if (UIDIY) document.addEventListener('keydown', (e) => UIDIY.handleKeydown(e));
  },

  /* 运行时设置面板 */
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
      <div class="card" style="background:linear-gradient(135deg, var(--bg-parchment), var(--bg-card));">
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
    App.toast('设置已更新', 'success');
  },

  toggleInputMode() {
    this._state.inputMode = this._state.inputMode === 'free' ? 'choice' : 'free';
    App.toast(this._state.inputMode === 'choice' ? '切换为选项模式' : '切换为自由输入模式', 'info');
    this.renderPage();
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
        <button class="btn-icon" onclick="NovelRuntime.toggleAuto()" title="自动" id="vnAutoBtn">⚡</button>
        <button class="btn-icon" onclick="NovelRuntime.showHistory()" title="历史">📜</button>
        <button class="btn-icon" onclick="NovelRuntime.toggleSettings()" title="设置">⚙️</button>
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
    if (npcSel) npcSel.innerHTML = '<option value="">-- 角色 --</option>' + (NPCManager?.getNPCs?.() || []).map(n => `<option value="${n.id}" ${this._state.npcId===n.id?'selected':''}>${n.name}</option>`).join('');
    const bgSel = document.getElementById('rt_bg');
    if (bgSel) {
      let bgs = [];
      if (BackgroundLibrary?.getBackgrounds) {
        bgs = BackgroundLibrary.getBackgrounds();
        const cat = BackgroundLibrary.getRuntimeCategory ? BackgroundLibrary.getRuntimeCategory() : { cat: 'all', sub: null };
        if (cat && cat.cat !== 'all') { bgs = bgs.filter(b => b.category === cat.cat); if (cat.sub) bgs = bgs.filter(b => b.subcategory === cat.sub); }
      } else { bgs = Storage.get('backgrounds_v3', Storage.get('backgrounds_v2', [])); }
      bgSel.innerHTML = '<option value="">-- 背景 --</option>' + bgs.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
    }
    const musicSel = document.getElementById('rt_music');
    if (musicSel) musicSel.innerHTML = '<option value="">-- 音乐 --</option>' + (MusicManager?.getMusicList?.() || Storage.get('musicList', [])).map(m => `<option value="${m.id}">${m.name}</option>`).join('');
  },

  loadRuntimeSettings() {
    const savedBg = Storage.get('runtimeBgId', null);
    if (savedBg) this.selectBg(savedBg);
    const s = this.getSettings();
    const sb = document.getElementById('vnStatusOverlay');
    if (sb) sb.style.display = s.enableStatusBar ? 'block' : 'none';
  },

  async selectNPC(id) {
    this._state.npcId = id;
    const layer = document.getElementById('vnCharLayer');
    if (!layer) return;
    if (!id) { layer.innerHTML = ''; return; }
    const npc = (NPCManager?.getNPCs?.() || []).find(n => n.id === id);
    if (npc?.portraitId) {
      const d = await Storage.getImage(npc.portraitId);
      if (d) {
        const imgRecord = await Storage.dbGet?.('images', npc.portraitId);
        const isTransparent = imgRecord?.meta?.transparent === true;
        if (isTransparent) layer.innerHTML = `<img src="${d}" class="vn-character" alt="${npc.name}" style="border:none;box-shadow:none;">`;
        else layer.innerHTML = `<div style="padding:6px;background:linear-gradient(135deg, var(--bg-parchment) 0%, #e8d5b7 100%);border:3px solid var(--color-gold);border-radius:8px;box-shadow:0 0 25px rgba(201,162,39,0.4);"><img src="${d}" class="vn-character" alt="${npc.name}" style="border-radius:4px;"></div>`;
      }
    } else layer.innerHTML = '';
  },

  async selectBg(id) {
    if (!id) return;
    let bg;
    if (BackgroundLibrary?.getBackgrounds) bg = BackgroundLibrary.getBackgrounds().find(b => b.id === id);
    else bg = Storage.get('backgrounds_v3', Storage.get('backgrounds_v2', [])).find(b => b.id === id);
    const img = document.getElementById('vnBg');
    if (!img || !bg) return;
    const d = await Storage.getImage(bg.imageId);
    if (d) { img.src = d; img.style.opacity = '1'; this._state.scene = bg.name; Storage.set('currentScene', bg.name); this._state.currentBgId = id; }
  },

  async selectMusic(id) {
    if (!id) { if (MusicManager?._audio) MusicManager._audio.pause(); return; }
    if (MusicManager?.play) await MusicManager.play(id);
    this._state.currentMusicId = id;
  },

  async playerSend() {
    const input = document.getElementById('rt_input');
    if (!input) return;
    const text = input.value.trim();
    if (!text || this._state.isAIThinking) return;
    input.value = '';
    /* v9: 保存undo状态 */
    this._pushUndo();
    const playerName = Storage.get('playerName', '玩家');
    this.showDialog(playerName, text);
    this._state.history.push({ role: 'user', content: text, speaker: playerName });
    if (this._state.npcId) await this.genAIReply(text);
    else this.showDialog('系统', '请先在上方选择角色。');
  },

  async genAIReply(playerText) {
    this._pushUndo(); // v9 剧情快照
    this._state.isAIThinking = true;
    const loading = document.getElementById('vnLoading');
    if (loading) loading.style.display = 'block';
    try {
      const s = this.getSettings();
      const histText = this._state.history.slice(-6).map(h => `${h.speaker || '??'}：${h.content}`).join('\n');

      /* 1. Memory recall */
      let memText = '(无相关记忆)';
      if (s.enableMemory && MemorySystem) {
        const recalled = await MemorySystem.recall(playerText, { npcId: this._state.npcId });
        if (recalled.length > 0) memText = recalled.map(r => r.memory.content).join('\n---\n');
      }

      /* 2. World book injection */
      let wbText = '';
      if (s.enableWorldBook && WorldBook) wbText = WorldBook.getInjectionText(playerText + ' ' + histText);

      /* 3. Baike auto-detect */
      let baikeText = '';
      if (s.enableBaike && BaikeIntegration) {
        const baikeResult = await BaikeIntegration.autoDetect(playerText);
        if (baikeResult?.injected) baikeText = `【百科知识】${baikeResult.query}：${baikeResult.result}\n`;
      }

      /* 4. Scene context */
      let sceneText = '';
      if (this._state.sceneContext.name) sceneText = `【当前场景】${this._state.sceneContext.name}：${this._state.sceneContext.desc}\n`;
      else sceneText = `【当前场景】${this._state.scene}\n`;

      /* 5. Style & length prompt */
      const stylePrompt = this._getStylePrompt();

      /* 6. Build prompts */
      let sysPrompt = '', userPrompt = '';
      if (PromptSystem && PromptSystem.buildNPCPrompt) {
        const pd = PromptSystem.buildNPCPrompt(this._state.npcId, { history: histText, memory: memText, scene: this._state.scene });
        sysPrompt = pd.system;
        userPrompt = pd.user;
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
      const processed = RegexEngine ? RegexEngine.process(reply, { npcId: this._state.npcId, scene: this._state.scene }) : { text: reply, events: [] };
      reply = processed.text;

      /* 8. Save memory */
      const npc = (NPCManager?.getNPCs?.() || []).find(n => n.id === this._state.npcId);
      if (MemorySystem) {
        await MemorySystem.addMemory({ content: `${npc?.name || '角色'}：${reply}`, npcId: this._state.npcId, scene: this._state.scene, type: 'dialogue' });
        await MemorySystem.addMemory({ content: `${playerName}：${playerText}`, npcId: this._state.npcId, scene: this._state.scene, type: 'dialogue' });
      }

      /* 9. Show reply */
      const speaker = npc?.name || '角色';
      this.showDialog(speaker, reply, s.enableTypingEffect);
      this._state.history.push({ role: 'assistant', content: reply, speaker });

      /* 10. Events & status */
      if (processed.events.length > 0 && RegexEngine.handleEvents) RegexEngine.handleEvents(processed.events);
      if (StatusBar?.updateOverlay) StatusBar.updateOverlay();

      /* 11. Achievement tracking */
      if (AchievementSystem?.incrementStat) {
        AchievementSystem.incrementStat('chat_count', 1);
        if (this._state.history.length >= 10) AchievementSystem.unlock('social_butterfly');
      }

      // v11 自动记录NPC好感度
      if (this._state.npcId && typeof NPCMoodTracker !== 'undefined' && NPCMoodTracker?.recordMood) {
        const npcRecord = NPCManager?.getNPCById?.(this._state.npcId);
        const affectionValue = npcRecord?.affection ?? 50;
        const moodSummary = reply.substring(0, 20) + '...';
        NPCMoodTracker.recordMood(this._state.npcId, affectionValue, moodSummary);
      }
    } catch (e) { this.showDialog('系统', '错误：' + e.message); }
    finally { this._state.isAIThinking = false; if (loading) loading.style.display = 'none'; }
  },

  async requestChoices() {
    if (!this._state.npcId) { App.toast('选择角色', 'info'); return; }
    if (this._state.isAIThinking) return;
    this._state.isAIThinking = true;
    const loading = document.getElementById('vnLoading');
    if (loading) loading.style.display = 'block';
    try {
      const prompts = PromptSystem ? PromptSystem.getPrompts() : {};
      const hist = this._state.history.slice(-6).map(h => `${h.speaker}：${h.content}`).join('\n');
      const recalled = MemorySystem ? await MemorySystem.recall('选项', { npcId: this._state.npcId }) : [];
      const memText = recalled.map(r => r.memory.content).join('\n') || '(无)';
      const vars = PromptSystem && PromptSystem.buildVars ? PromptSystem.buildVars(this._state.npcId, { history: hist, memory: memText, scene: this._state.scene }) : {};
      const choicePrompt = PromptSystem && PromptSystem.render ? PromptSystem.render(prompts.choicePrompt || '给出3个选项', vars) : '给出3个选项';
      const style = this._getStylePrompt();
      const result = await APISettings.chat(choicePrompt, [{ role: 'system', content: '你是视觉小说选项生成器。只返回3个选项，每行一个。' + style }], { useAux: true });
      const choices = result.split('\n').filter(l => l.trim()).slice(0, 5);
      this.showChoices(choices);
    } catch (e) { App.toast('选项生成失败: ' + e.message, 'error'); }
    finally { this._state.isAIThinking = false; if (loading) loading.style.display = 'none'; }
  },

  showDialog(speaker, text, typewriter = false) {
    const box = document.getElementById('vnDialogBox');
    const spEl = document.getElementById('vnSpeaker');
    const txtEl = document.getElementById('vnDialogText');
    if (!box || !spEl || !txtEl) return;
    box.style.display = 'block';
    spEl.textContent = speaker;
    if (this._state.timer) { clearInterval(this._state.timer); this._state.timer = null; }
    const s = this.getSettings();
    if (typewriter && s.enableTypingEffect) {
      this._state.isTyping = true;
      let i = 0; txtEl.innerHTML = '<span class="vn-dialog-cursor"></span>';
      this._state.timer = setInterval(() => {
        if (i < text.length) { txtEl.innerHTML = text.substring(0, i + 1) + '<span class="vn-dialog-cursor"></span>'; i++; }
        else { clearInterval(this._state.timer); this._state.timer = null; this._state.isTyping = false; txtEl.innerHTML = text; }
      }, s.typingSpeed || 30);
    } else { txtEl.textContent = text; }
  },

  showChoices(choices) {
    const c = document.getElementById('vnChoices');
    if (!c) return;
    c.innerHTML = choices.map(ch => {
      const t = ch.replace(/^\d+\.\s*/, '').trim();
      return `<button class="vn-classic-choice" onclick="NovelRuntime.pickChoice('${t.replace(/'/g, "\\'")}')">${t}</button>`;
    }).join('');
    c.style.display = 'flex';
  },

  pickChoice(text) {
    document.getElementById('vnChoices').style.display = 'none';
    document.getElementById('rt_input').value = text;
    this.playerSend();
  },

  saveGame() {
    const saves = Storage.get('gameSaves', []);
    saves.unshift({
      id: 'save_' + Date.now(),
      worldName: Storage.get('worldData', {}).name,
      npcId: this._state.npcId,
      scene: this._state.scene,
      history: this._state.history,
      playerName: Storage.get('playerName', '玩家'),
      userMask: Storage.get('userMask', {}),
      worldData: Storage.get('worldData', {}),
      npcs: Storage.get('npcs_v3', Storage.get('npcs_v2', [])),
      vars: Storage.get('gameVars', {}),
      flags: Storage.get('gameFlags', []),
      timestamp: Date.now()
    });
    if (saves.length > 10) saves.pop();
    Storage.set('gameSaves', saves);
    App.toast('已存档', 'success');
  },

  showSaves() {
    const saves = Storage.get('gameSaves', []);
    if (saves.length === 0) { App.toast('没有存档', 'info'); return; }
    const content = saves.map(s => `<div class="list-item" style="cursor:pointer;" onclick="NovelRuntime.doLoad('${s.id}')"><div class="list-info"><h4>${s.worldName || '未命名'} · ${s.scene || ''}</h4><p>${new Date(s.timestamp).toLocaleString()}</p></div></div>`).join('');
    App.showModal('📂 读档', content);
  },

  doLoad(id) {
    const save = Storage.get('gameSaves', []).find(s => s.id === id);
    if (!save) return;
    if (save.userMask) Storage.set('userMask', save.userMask);
    if (save.worldData) Storage.set('worldData', save.worldData);
    if (save.npcs) Storage.set('npcs_v3', save.npcs);
    if (save.history) this._state.history = save.history;
    if (save.vars) Storage.set('gameVars', save.vars);
    if (save.flags) Storage.set('gameFlags', save.flags);
    this._state.npcId = save.npcId;
    this._state.scene = save.scene || '起始场景';
    Storage.set('playerName', save.playerName || '玩家');
    App.closeModal();
    this.refreshSelectors();
    this.selectNPC(this._state.npcId);
    const last = this._state.history.slice(-2);
    last.forEach(h => this.showDialog(h.speaker || '??', h.content));
    App.toast('读档成功', 'success');
  },

  clearHistory() {
    this._state.history = [];
    document.getElementById('vnDialogBox').style.display = 'none';
    document.getElementById('vnChoices').style.display = 'none';
    App.toast('对话已清空', 'info');
  },

  toggleAuto() {
    this._state.autoPlay = !this._state.autoPlay;
    document.getElementById('vnAutoBtn').textContent = this._state.autoPlay ? '⏸' : '⚡';
    App.toast(this._state.autoPlay ? '自动播放开启' : '自动播放关闭', 'info');
  },

  showHistory() {
    const body = this._state.history.length === 0 ? '<p style="color:var(--text-muted);text-align:center;">无记录</p>' : this._state.history.map(h => `<div style="padding:8px 0;border-bottom:1px solid var(--border-color);"><strong style="color:var(--color-gold);">${h.speaker || '??'}</strong><p style="margin-top:4px;font-size:14px;">${h.content}</p></div>`).join('');
    App.showModal('📜 历史', body);
  },

  toggleFullscreen() {
    const container = document.getElementById('vnContainer');
    if (!container) return;
    if (document.fullscreenElement) { document.exitFullscreen(); container.classList.remove('fullscreen'); }
    else { container.requestFullscreen?.() || container.webkitRequestFullscreen?.(); container.classList.add('fullscreen'); }
  },

  /* 剧情撤回、重写、继续功能 */
  _undoStack: [],
  _redoStack: [],
  _maxUndoSize: 20,

  /* 保存当前状态到撤回栈 */
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
    this._redoStack = []; /* 新操作清空重做栈 */
  },

  /* 撤回上一步 */
  undo() {
    if (this._undoStack.length === 0) { App.toast('没有可撤回的步骤', 'info'); return; }
    /* 保存当前状态到重做栈 */
    const current = JSON.parse(JSON.stringify({
      history: this._state.history,
      npcId: this._state.npcId,
      scene: this._state.scene,
      currentBgId: this._state.currentBgId,
      currentMusicId: this._state.currentMusicId
    }));
    this._redoStack.push(current);
    /* 恢复上一个状态 */
    const prev = this._undoStack.pop();
    this._state.history = prev.history;
    this._state.npcId = prev.npcId;
    this._state.scene = prev.scene;
    this._state.currentBgId = prev.currentBgId;
    this._state.currentMusicId = prev.currentMusicId;
    /* 刷新显示 */
    this._refreshDisplay();
    App.toast('已撤回上一步', 'success');
  },

  /* 重做 */
  redo() {
    if (this._redoStack.length === 0) { App.toast('没有可重做的步骤', 'info'); return; }
    /* 保存当前状态到撤回栈 */
    const current = JSON.parse(JSON.stringify({
      history: this._state.history,
      npcId: this._state.npcId,
      scene: this._state.scene,
      currentBgId: this._state.currentBgId,
      currentMusicId: this._state.currentMusicId
    }));
    this._undoStack.push(current);
    /* 恢复重做状态 */
    const next = this._redoStack.pop();
    this._state.history = next.history;
    this._state.npcId = next.npcId;
    this._state.scene = next.scene;
    this._state.currentBgId = next.currentBgId;
    this._state.currentMusicId = next.currentMusicId;
    this._refreshDisplay();
    App.toast('已重做', 'success');
  },

  /* 重写最后一条AI回复 */
  async rewriteLast() {
    if (this._state.history.length === 0) { App.toast('没有可重写的内容', 'info'); return; }
    /* 找到最后一条AI回复 */
    let lastAIIndex = -1;
    for (let i = this._state.history.length - 1; i >= 0; i--) {
      if (this._state.history[i].role === 'assistant') { lastAIIndex = i; break; }
    }
    if (lastAIIndex === -1) { App.toast('没有找到AI回复', 'info'); return; }

    /* 保存当前状态到撤回栈 */
    this._pushUndo();

    /* 截断到该条之前的记录 */
    const newHistory = this._state.history.slice(0, lastAIIndex);
    this._state.history = newHistory;

    /* 重新生成 */
    const lastUserMsg = newHistory.length > 0 && newHistory[newHistory.length - 1].role === 'user'
      ? newHistory[newHistory.length - 1].content : '';
    await this.genAIReply(lastUserMsg || '请继续');
    App.toast('已重写最后一条回复', 'success');
  },

  /* 继续生成（基于当前上下文延伸） */
  async continueStory() {
    if (this._state.history.length === 0) { App.toast('没有上下文，请先开始对话', 'info'); return; }
    /* 保存状态 */
    this._pushUndo();
    /* 生成"继续"的AI回复 */
    const lastEntry = this._state.history[this._state.history.length - 1];
    const prompt = lastEntry.role === 'assistant'
      ? '请继续剧情，自然地延续上文。'
      : lastEntry.content;
    await this.genAIReply(prompt);
    App.toast('剧情继续', 'success');
  },

  /* 刷新显示区域 */
  _refreshDisplay() {
    const box = document.getElementById('vnDialogBox');
    const choices = document.getElementById('vnChoices');
    if (choices) choices.style.display = 'none';
    if (this._state.history.length === 0) {
      if (box) box.style.display = 'none';
      return;
    }
    /* 显示最后两条 */
    const recent = this._state.history.slice(-2);
    if (recent.length > 0) {
      const last = recent[recent.length - 1];
      this.showDialog(last.speaker || '??', last.content, false);
    }
    /* 恢复选择器 */
    this.refreshSelectors();
    if (this._state.npcId) this.selectNPC(this._state.npcId);
  },

  /* 导出剧情文本 */
  exportStoryText() {
    if (this._state.history.length === 0) { App.toast('没有剧情可导出', 'info'); return; }
    const text = this._state.history.map(h => `${h.speaker || '??'}：${h.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `剧情文本_${new Date().toISOString().slice(0,10)}.txt`; a.click();
    URL.revokeObjectURL(url);
    App.toast('剧情文本已导出', 'success');
  },

  /* 剧情跳转：直接跳到某条历史记录 */
  jumpToHistory(index) {
    if (index < 0 || index >= this._state.history.length) return;
    this._pushUndo();
    this._state.history = this._state.history.slice(0, index + 1);
    this._refreshDisplay();
    App.toast(`已跳转到第 ${index + 1} 条记录`, 'success');
  },
  openInteraction(npcId) {
    const panel = document.getElementById('interactionPanel');
    if (!panel) return;
    const npc = (NPCManager?.getNPCs?.() || []).find(n => n.id === npcId);
    document.getElementById('interactionTitle').textContent = npc?.name || '对话';
    document.getElementById('interactionSubtitle').textContent = (this._state.sceneContext.name || this._state.scene) + (npc ? ' · ' + npc.name : '');
    document.getElementById('interactionBody').innerHTML = `
      <div class="interaction-msg npc">
        <strong>${npc?.name || '角色'}</strong><br>
        正在进入闲聊...
      </div>
    `;
    panel.style.display = 'flex';
  },

  closeInteraction() {
    const panel = document.getElementById('interactionPanel');
    if (panel) panel.style.display = 'none';
  },

  sendFromPanel() {
    const input = document.getElementById('interactionInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    const body = document.getElementById('interactionBody');
    if (body) {
      body.innerHTML += `<div class="interaction-msg"><strong>${Storage.get('playerName','玩家')}</strong><br>${text}</div>`;
      body.scrollTop = body.scrollHeight;
    }
    /* 转发到主对话 */
    document.getElementById('rt_input').value = text;
    this.playerSend();
  },

  get playerName() { return Storage.get('playerName', '玩家'); }
};