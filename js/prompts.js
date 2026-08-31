/**
 * =========================================================
 * Prompt System v2
 * System prompt + NPC template + variables
 * =========================================================
 */
const PromptSystem = {
  VARS: [
    { name: 'char_name', desc: '角色名' }, { name: 'char_personality', desc: '性格' },
    { name: 'char_background', desc: '背景' }, { name: 'char_dialogStyle', desc: '对话风格' },
    { name: 'char_appearance', desc: '外貌' }, { name: 'char_likes', desc: '喜好' },
    { name: 'char_dislikes', desc: '厌恶' }, { name: 'char_affection', desc: '好感度' },
    { name: 'char_promptOverride', desc: '专属提示词' }, { name: 'char_job', desc: '职业' },
    { name: 'char_marriage', desc: '婚姻' }, { name: 'char_address', desc: '住址' },
    { name: 'char_darkSide', desc: '阴暗面' }, { name: 'char_secret', desc: '秘密' },
    { name: 'scene', desc: '场景' }, { name: 'player_name', desc: '玩家名' },
    { name: 'player_identity', desc: '玩家身份' }, { name: 'mood', desc: '氛围' },
    { name: 'inventory', desc: '物品' }, { name: 'time', desc: '时间' },
    { name: 'history', desc: '历史' }, { name: 'memory', desc: '记忆' },
    { name: 'world_name', desc: '世界名' }, { name: 'world_summary', desc: '世界观' }
  ],

  getDefaults() {
    return {
      systemPrompt: `你是一个视觉小说AI角色扮演系统。始终保持角色性格一致性，回复包含叙述和对话，根据好感度调整态度。格式：【旁白】描述场景/动作\n角色名：对话内容。每次回复控制在200字以内。`,
      npcTemplate: `你正在扮演「{{char_name}}」
【角色档案】
姓名：{{char_name}}
性格：{{char_personality}}
职业：{{char_job}}
婚姻：{{char_marriage}}
住址：{{char_address}}
背景：{{char_background}}
对话风格：{{char_dialogStyle}}
外貌：{{char_appearance}}
喜好：{{char_likes}}
厌恶：{{char_dislikes}}
阴暗面：{{char_darkSide}}
秘密：{{char_secret}}

【当前状态】
场景：{{scene}}
好感度：{{char_affection}}/100
玩家：{{player_name}}（{{player_identity}}）
世界：{{world_name}}

【相关记忆】
{{memory}}

【最近对话】
{{history}}

请以{{char_name}}的身份回复。保持性格一致，注意好感度影响。格式：【旁白】描述\n{{char_name}}：对话`,
      narratorPrompt: '你是视觉小说旁白。用第二人称描述场景，营造氛围，简洁有画面感。',
      choicePrompt: '根据当前对话和场景，给出3个让玩家选择的选项。每个选项简短有力。',
      summaryPrompt: '请总结以下对话，提取关键信息（人物、事件、地点、情感变化）。',
      extractPrompt: '从以下文本提取关键记忆点，每条一行：关键词 - 内容。'
    };
  },

  getPrompts() { return Storage.get('prompts_v2', this.getDefaults()); },
  savePrompts(p) { Storage.set('prompts_v2', p); },

  init() { this.renderPage(); },
  onEnter() { this.loadValues(); },

  renderPage() {
    const page = document.getElementById('page-prompts');
    if (!page) return;
    page.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
        <button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button>
      </div>
      <h2 class="section-title" style="margin-bottom:var(--space-lg);">📝 提示词工坊</h2>
      <div class="card" style="margin-bottom:var(--space-lg);">
        <div class="card-header"><h3>可用变量</h3></div>
        <div class="card-body">
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${this.VARS.map(v => `<span class="tag tag-secondary" title="${v.desc}">{{${v.name}}}</span>`).join('')}
          </div>
        </div>
      </div>
      <div class="tabs">
        <div class="tab active" onclick="PromptSystem.switchTab(event,'tab_sys')">系统</div>
        <div class="tab" onclick="PromptSystem.switchTab(event,'tab_npc')">角色模板</div>
        <div class="tab" onclick="PromptSystem.switchTab(event,'tab_narrator')">旁白</div>
        <div class="tab" onclick="PromptSystem.switchTab(event,'tab_choice')">选项</div>
        <div class="tab" onclick="PromptSystem.switchTab(event,'tab_summary')">总结</div>
        <div class="tab" onclick="PromptSystem.switchTab(event,'tab_extract')">提取</div>
      </div>
      <div class="tab-content active" id="tab_sys">
        <div class="card"><div class="card-body">
          <div class="form-group"><label>系统提示词</label><textarea class="prompt-editor" id="pr_system" rows="10"></textarea></div>
        </div></div>
      </div>
      <div class="tab-content" id="tab_npc">
        <div class="card"><div class="card-body">
          <div class="form-group"><label>角色提示词模板</label><textarea class="prompt-editor" id="pr_npc" rows="14"></textarea></div>
        </div></div>
      </div>
      <div class="tab-content" id="tab_narrator">
        <div class="card"><div class="card-body">
          <div class="form-group"><label>旁白提示词</label><textarea class="prompt-editor" id="pr_narrator" rows="6"></textarea></div>
        </div></div>
      </div>
      <div class="tab-content" id="tab_choice">
        <div class="card"><div class="card-body">
          <div class="form-group"><label>选项生成提示词</label><textarea class="prompt-editor" id="pr_choice" rows="6"></textarea></div>
        </div></div>
      </div>
      <div class="tab-content" id="tab_summary">
        <div class="card"><div class="card-body">
          <div class="form-group"><label>总结提示词</label><textarea class="prompt-editor" id="pr_summary" rows="6"></textarea></div>
        </div></div>
      </div>
      <div class="tab-content" id="tab_extract">
        <div class="card"><div class="card-body">
          <div class="form-group"><label>记忆提取提示词</label><textarea class="prompt-editor" id="pr_extract" rows="6"></textarea></div>
        </div></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:var(--space-lg);">
        <button class="btn btn-primary" onclick="PromptSystem.saveAll()">💾 保存全部</button>
        <button class="btn btn-secondary" onclick="PromptSystem.reset()">↺ 恢复默认</button>
        <button class="btn btn-gold" onclick="PromptSystem.testRender()">🧪 测试</button>
      </div>
      <div id="pr_testResult" style="margin-top:var(--space-lg);"></div>
    `;
    this.loadValues();
  },

  switchTab(e, id) { document.querySelectorAll('#page-prompts .tab').forEach(t => t.classList.remove('active')); document.querySelectorAll('#page-prompts .tab-content').forEach(c => c.classList.remove('active')); e.target.classList.add('active'); document.getElementById(id)?.classList.add('active'); },

  loadValues() {
    const p = this.getPrompts();
    ['system', 'npc', 'narrator', 'choice', 'summary', 'extract'].forEach(k => {
      const el = document.getElementById('pr_' + k); if (el) el.value = p[k + 'Prompt'] || p[k + 'Template'] || '';
    });
  },

  saveAll() {
    const p = this.getPrompts();
    p.systemPrompt = document.getElementById('pr_system').value;
    p.npcTemplate = document.getElementById('pr_npc').value;
    p.narratorPrompt = document.getElementById('pr_narrator').value;
    p.choicePrompt = document.getElementById('pr_choice').value;
    p.summaryPrompt = document.getElementById('pr_summary').value;
    p.extractPrompt = document.getElementById('pr_extract').value;
    this.savePrompts(p);
    App.toast('提示词已保存', 'success');
  },

  reset() { if (!confirm('恢复默认？')) return; this.savePrompts(this.getDefaults()); this.loadValues(); App.toast('已恢复默认', 'info'); },

  render(template, vars = {}) {
    let r = template;
    this.VARS.forEach(v => { const ph = new RegExp('\\{\\{' + v.name + '\\}\\}', 'g'); r = r.replace(ph, vars[v.name] !== undefined ? String(vars[v.name]) : ''); });
    return r.replace(/\{\{[^}]+\}\}/g, '');
  },

  buildVars(npcId, extra = {}) {
    const npc = (NPCManager?.getNPCs?.() || []).find(n => n.id === npcId) || {};
    const mask = Storage.get('userMask', {});
    const world = Storage.get('worldData', {});
    const sc = StatusBar?.getStatusConfig ? StatusBar.getStatusConfig() : {};
    const aff = sc.npcAffection?.find(a => a.npcId === npcId);
    return {
      char_name: npc.name || '未知', char_personality: npc.personality || '', char_background: npc.background || '',
      char_dialogStyle: npc.dialogStyle || '', char_appearance: npc.appearance || '', char_likes: npc.likes || '',
      char_dislikes: npc.dislikes || '', char_affection: aff?.value ?? npc.affection ?? 50,
      char_promptOverride: npc.promptOverride || '', char_job: npc.job || '', char_marriage: npc.marriage || '',
      char_address: npc.address || '', char_darkSide: npc.darkSide || '', char_secret: npc.secret || '',
      scene: extra.scene || Storage.get('currentScene', '未知'), player_name: mask.playerName || '玩家',
      player_identity: mask.identity || '', mood: extra.mood || '日常', inventory: extra.inventory || '无',
      time: extra.time || '', history: extra.history || '', memory: extra.memory || '',
      world_name: world.name || '', world_summary: world.summary || '', ...extra
    };
  },

  buildNPCPrompt(npcId, extra = {}) {
    const p = this.getPrompts();
    const vars = this.buildVars(npcId, extra);
    return { system: this.render(p.systemPrompt, vars), user: this.render(p.npcTemplate, vars) };
  },

  testRender() {
    const npcs = NPCManager?.getNPCs?.() || [];
    const result = document.getElementById('pr_testResult');
    if (npcs.length === 0) { result.innerHTML = '<div class="card"><div class="card-body"><p style="color:var(--text-muted);">先创建角色</p></div></div>'; return; }
    const npc = npcs[0];
    const r = this.buildNPCPrompt(npc.id, { history: '测试历史', memory: '(无)' });
    result.innerHTML = `<div class="card"><div class="card-header"><h3>测试结果：${npc.name}</h3></div><div class="card-body"><h4 style="color:var(--color-gold);margin-bottom:8px;">系统提示词</h4><div class="code-block">${this.escape(r.system)}</div><h4 style="color:var(--color-gold);margin-top:16px;margin-bottom:8px;">角色提示词</h4><div class="code-block">${this.escape(r.user)}</div></div></div>`;
  },

  escape(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
};
