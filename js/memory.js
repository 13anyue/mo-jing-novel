/**
 * =========================================================
 * Memory System v7 - Enhanced
 * 增强功能：
 * - 对话上下文关联记忆
 * - NPC专属记忆隔离
 * - 时间衰减因子
 * - 记忆标签系统
 * - 记忆重要性评分
 * - 批量记忆管理
 * - 记忆搜索高亮
 * =========================================================
 */
const MemorySystem = {
  RECALL_TOP_N: 5, SIM_THRESHOLD: 0.05, MAX_LEN: 500,
  STOP_WORDS: new Set(['的','了','在','是','我','你','他','她','它','们','这','那','一','个','不','也','都','就','着','过','把','被','让','给','到','上','下','里','外','中','和','与','或','但','而','如','因','所','以','为','会','能','可','要','想','说','做','看','听','去','来','有','没','很','太','些','么','吧','呢','啊','哦','嗯','嘛','哈','呀','哇','吗','喂','唉','对','错','好','行','可以','什么','怎么','为什么','哪里','哪个','谁','多少','几','这个','那个','这些','那些','这里','那里','现在','以前','以后','已经']),

  init() { this.renderPage(); },
  onEnter() { this.renderList(); this.renderStats(); },

  getCategories() {
    return Storage.get('memoryCategories', []);
  },
  saveCategories(c) { Storage.set('memoryCategories', c); },

  getConfig() {
    return Storage.get('memoryConfig_v3', {
      summaryPrompt: '请总结以下对话内容，提取关键信息（人物、事件、地点、情感变化），控制在50字以内。',
      extractPrompt: '从以下文本中提取关键记忆点，每条一行，格式：关键词 - 内容。',
      autoSave: true,
      autoCategorize: true,
      npcIsolation: true,       // NPC记忆隔离
      timeDecay: true,          // 时间衰减
      decayDays: 30,            // 衰减天数
      importanceThreshold: 0.3  // 重要性阈值
    });
  },
  saveConfig(c) { Storage.set('memoryConfig_v3', c); },

  tokenize(text) {
    if (!text) return [];
    const sents = text.split(/[，。！？\n\r,.\!?;:；：、""''""''\s]+/).filter(s => s.length > 0);
    const tokens = [];
    for (const s of sents) {
      const ew = s.match(/[a-zA-Z]+/g) || []; tokens.push(...ew.map(w => w.toLowerCase()));
      const ch = s.match(/[\u4e00-\u9fa5]+/g) || [];
      for (const seg of ch) {
        for (let i = 0; i < seg.length; i++) { const c = seg[i]; if (!this.STOP_WORDS.has(c)) tokens.push(c); }
        for (let i = 0; i < seg.length - 1; i++) { const b = seg.substring(i, i + 2); if (!this.STOP_WORDS.has(b)) tokens.push(b); }
      }
    }
    return tokens;
  },

  computeTF(tokens) { const tf = new Map(); for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1); const tot = tokens.length || 1; for (const [k, v] of tf) tf.set(k, v / tot); return tf; },
  computeIDF(docs) { const df = new Map(); const N = docs.length || 1; for (const dt of docs) { const u = new Set(dt); for (const t of u) df.set(t, (df.get(t) || 0) + 1); } const idf = new Map(); for (const [t, f] of df) idf.set(t, Math.log((N + 1) / (f + 1)) + 1); return idf; },
  buildVector(tf, idf) { const v = new Map(); for (const [t, tfv] of tf) v.set(t, tfv * (idf.get(t) || 1)); return v; },
  cosSim(v1, v7) { let dp = 0, n1 = 0, n2 = 0; const [sm, lg] = v1.size < v2.size ? [v1, v2] : [v2, v1]; for (const [k, val1] of sm) { const val2 = lg.get(k); if (val2 !== undefined) dp += val1 * val2; } for (const [, v] of v7) n1 += v * v; for (const [, v] of v7) n2 += v * v; n1 = Math.sqrt(n1); n2 = Math.sqrt(n2); if (n1 === 0 || n2 === 0) return 0; return dp / (n1 * n2); },
  cosSimArr(a1, a2) { let dp = 0, n1 = 0, n2 = 0; const len = Math.min(a1.length, a2.length); for (let i = 0; i < len; i++) { dp += a1[i] * a2[i]; n1 += a1[i] * a1[i]; n2 += a2[i] * a2[i]; } n1 = Math.sqrt(n1); n2 = Math.sqrt(n2); if (n1 === 0 || n2 === 0) return 0; return dp / (n1 * n2); },

  /* 计算记忆重要性评分 */
  _computeImportance(memory) {
    let score = 0.5;
    if (memory.npcId) score += 0.1;
    if (memory.scene) score += 0.1;
    if (memory.tags && memory.tags.length) score += memory.tags.length * 0.05;
    const age = (Date.now() - (memory.timestamp || Date.now())) / (1000 * 60 * 60 * 24);
    const cfg = this.getConfig();
    if (cfg.timeDecay && age > cfg.decayDays) score *= 0.7;
    return Math.min(score, 1.0);
  },

  async addMemory(m) {
    const id = m.id || ('mem_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
    const content = (m.content || '').substring(0, this.MAX_LEN);
    const tokens = this.tokenize(content);
    const importance = this._computeImportance(m);
    const record = {
      id, content, npcId: m.npcId || null, scene: m.scene || '',
      type: m.type || 'dialogue', category: m.category || 'cat_dialogue',
      tags: m.tags || [], timestamp: Date.now(),
      tokens, tf: this.computeTF(tokens), importance
    };
    await Storage.saveMemory(record);
    return record;
  },

  async recall(query, opts = {}) {
    const topN = opts.topN || this.RECALL_TOP_N;
    const useEmb = opts.useEmb !== false && APISettings.getConfig().embEnabled;
    const catFilter = opts.category || null;
    const cfg = this.getConfig();
    let mems = await Storage.getMemories();

    /* NPC隔离 */
    if (cfg.npcIsolation && opts.npcId) mems = mems.filter(m => !m.npcId || m.npcId === opts.npcId);
    if (catFilter) mems = mems.filter(m => m.category === catFilter);

    if (mems.length === 0) return [];

    const results = [];
    if (useEmb) {
      try {
        const qe = await APISettings.getEmbedding(query);
        if (qe) {
          for (const m of mems) {
            if (!m.embedding) {
              try { m.embedding = await APISettings.getEmbedding(m.content); await Storage.saveMemory(m); }
              catch (e) { m.embedding = null; }
            }
            let score = m.embedding ? this.cosSimArr(qe, m.embedding) : 0;
            score *= (m.importance || 0.5);
            results.push({ memory: m, score });
          }
          results.sort((a, b) => b.score - a.score);
          return results.slice(0, topN).filter(r => r.score > 0.08);
        }
      } catch (e) { console.warn('Embedding fallback:', e.message); }
    }

    const qt = this.tokenize(query);
    const qtf = this.computeTF(qt);
    const allDocTokens = mems.map(m => m.tokens || this.tokenize(m.content));
    const idf = this.computeIDF(allDocTokens);
    const qv = this.buildVector(qtf, idf);
    for (const m of mems) {
      const mtf = m.tf || this.computeTF(m.tokens || this.tokenize(m.content));
      const mv = this.buildVector(mtf, idf);
      let score = this.cosSim(qv, mv) * (m.importance || 0.5);
      results.push({ memory: m, score });
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topN).filter(r => r.score > this.SIM_THRESHOLD);
  },

  /* 批量导入记忆 */
  async batchImport(text, category = 'cat_note') {
    const lines = text.split(/\n+/).filter(l => l.trim());
    let count = 0;
    for (const line of lines) {
      if (line.trim()) { await this.addMemory({ content: line.trim(), category, type: 'note' }); count++; }
    }
    this.renderList(); this.renderStats();
    App.toast(`已导入 ${count} 条记忆`, 'success');
  },

  renderPage() {
    const page = document.getElementById('page-memory');
    if (!page) { console.warn('[v7] 元素 #page-memory 未找到'); }
    if (!page) return;
    page.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="ez-btn btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
      <h2 class="section-title" style="margin-bottom:var(--space-lg);">仿向量记忆 v7</h2>
      <div class="grid grid-3" id="memStats" style="margin-bottom:var(--space-lg);"></div>

      <div class="ez-card" style="margin-bottom:var(--space-lg);">
        <div class="card-header"><h3><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg> 记忆检索</h3></div>
        <div class="card-body">
          <div class="form-group"><textarea id="memQuery" placeholder="输入查询内容..."></textarea></div>
          <div class="form-row">
            <div class="form-group"><select id="memQueryCat"><option value="">全部分类</option></select></div>
            <div class="form-group"><input type="number" id="memTopN" value="5" min="1" max="20" style="width:80px;"></div>
            <div class="form-group"><label style="display:flex;align-items:center;gap:6px;cursor:pointer;"><input type="checkbox" id="memUseNPC" checked style="width:auto;"> NPC隔离</label></div>
          </div>
          <button class="ez-btn btn btn-primary" onclick="MemorySystem.doRecall()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg> 检索</button>
          <label style="display:inline-flex;align-items:center;gap:6px;margin-left:var(--space-md);font-size:13px;color:var(--text-secondary);"><div class="switch ${APISettings.getConfig().embEnabled?'on':''}" onclick="this.classList.toggle('on');MemorySystem._useEmb=this.classList.contains('on')"></div>Embedding</label>
        </div>
      </div>

      <div id="memResults" style="margin-bottom:var(--space-lg);"></div>

      <div class="ez-card" style="margin-bottom:var(--space-lg);">
        <div class="card-header"><h3><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 添加记忆</h3></div>
        <div class="card-body">
          <div class="form-group"><textarea id="memAddContent" placeholder="记忆内容..."></textarea></div>
          <div class="form-row">
            <div class="form-group"><select id="memAddCat"><option value="">选择分类</option></select></div>
            <div class="form-group"><input type="text" id="memAddScene" placeholder="场景"></div>
            <div class="form-group"><input type="text" id="memAddTags" placeholder="标签（逗号分隔）"></div>
          </div>
          <button class="ez-btn btn btn-primary" onclick="MemorySystem.addFromForm()">添加</button>
          <button class="ez-btn btn btn-gold" style="margin-left:8px;" onclick="MemorySystem.aiCategorize()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="16" y1="16" x2="16.01" y2="16"/></svg> AI分类</button>
          <button class="ez-btn btn btn-secondary" style="margin-left:8px;" onclick="MemorySystem.batchImportPrompt()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> 批量导入</button>
        </div>
      </div>

      <div class="ez-card" style="margin-bottom:var(--space-lg);">
        <div class="card-header"><h3>⚙️ 配置</h3></div>
        <div class="card-body" id="memConfigArea"></div>
      </div>

      <h3 style="font-size:16px;margin-bottom:var(--space-sm);">记忆列表</h3>
      <div id="memList"></div>
    `;
    this.fillCatSelectors(); this.renderConfig(); this.renderList(); this.renderStats();
  },

  fillCatSelectors() {
    const cats = this.getCategories();
    const opts = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    ['memQueryCat', 'memAddCat'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = (id === 'memQueryCat' ? '<option value="">全部分类</option>' : '<option value="">选择分类</option>') + opts; });
  },

  renderConfig() {
    const c = this.getConfig();
    const area = document.getElementById('memConfigArea');
    if (!area) { console.warn('[v7] 元素 #memConfigArea 未找到'); }
    if (!area) return;
    area.innerHTML = `
      <div class="form-group"><label>总结提示词</label><textarea id="memSumPrompt" rows="2">${c.summaryPrompt}</textarea></div>
      <div class="form-group"><label>提取提示词</label><textarea id="memExtPrompt" rows="2">${c.extractPrompt}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label><input type="checkbox" id="memAutoSave" ${c.autoSave?'checked':''} style="width:auto;"> 自动保存对话记忆</label></div>
        <div class="form-group"><label><input type="checkbox" id="memAutoCat" ${c.autoCategorize?'checked':''} style="width:auto;"> 自动分类</label></div>
        <div class="form-group"><label><input type="checkbox" id="memNPCIso" ${c.npcIsolation?'checked':''} style="width:auto;"> NPC记忆隔离</label></div>
        <div class="form-group"><label><input type="checkbox" id="memTimeDecay" ${c.timeDecay?'checked':''} style="width:auto;"> 时间衰减</label></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>衰减天数</label><input type="number" id="memDecayDays" value="${c.decayDays}" min="1" max="365"></div>
        <div class="form-group"><label>重要性阈值</label><input type="number" id="memImpThreshold" value="${c.importanceThreshold}" min="0" max="1" step="0.1"></div>
      </div>
      <button class="ez-btn btn btn-primary" onclick="MemorySystem.saveConfigFromForm()">保存配置</button>
      <button class="ez-btn btn btn-secondary" style="margin-left:8px;" onclick="MemorySystem.manageCategories()">管理分类</button>
    `;
  },

  manageCategories() {
    const cats = this.getCategories();
    const content = cats.map((c, i) => `
      <div class="form-row" style="margin-bottom:8px;">
        <input type="text" value="${c.name}" id="cat_name_${i}" style="flex:1;">
        <input type="color" value="${c.color}" id="cat_color_${i}" style="width:60px;">
        <button class="ez-btn btn btn-sm btn-danger" onclick="MemorySystem.deleteCategory('${c.id}')">删除</button>
      </div>
    `).join('') + `
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button class="ez-btn btn btn-sm btn-primary" onclick="MemorySystem.addCategory()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 添加</button>
        <button class="ez-btn btn btn-sm btn-secondary" onclick="MemorySystem.saveCategoriesFromForm()">保存</button>
      </div>`;
    App.showModal('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> 分类管理', content);
  },

  addCategory() {
    const cats = this.getCategories();
    cats.push({ id: 'cat_' + Date.now(), name: '新分类', color: '#8B4513' });
    this.saveCategories(cats);
    this.manageCategories();
  },

  deleteCategory(id) {
    const cats = this.getCategories().filter(c => c.id !== id);
    this.saveCategories(cats);
    this.manageCategories();
  },

  saveCategoriesFromForm() {
    const cats = [];
    document.querySelectorAll('[id^="cat_name_"]').forEach(el => {
      const i = el.id.replace('cat_name_', '');
      const name = el.value;
      const color = document.getElementById('cat_color_' + i)?.value || '#8B4513';
      if (name) cats.push({ id: 'cat_' + Date.now() + '_' + i, name, color });
    });
    this.saveCategories(cats);
    App.closeModal();
    this.fillCatSelectors();
    App.toast('分类已保存', 'success');
  },

  saveConfigFromForm() {
    const c = this.getConfig();
    c.summaryPrompt = document.getElementById('memSumPrompt').value;
    c.extractPrompt = document.getElementById('memExtPrompt').value;
    c.autoSave = document.getElementById('memAutoSave')?.checked || false;
    c.autoCategorize = document.getElementById('memAutoCat')?.checked || false;
    c.npcIsolation = document.getElementById('memNPCIso')?.checked || false;
    c.timeDecay = document.getElementById('memTimeDecay')?.checked || false;
    c.decayDays = parseInt(document.getElementById('memDecayDays')?.value) || 30;
    c.importanceThreshold = parseFloat(document.getElementById('memImpThreshold')?.value) || 0.3;
    this.saveConfig(c);
    App.toast('配置已保存', 'success');
  },

  async doRecall() {
    const q = document.getElementById('memQuery').value.trim();
    if (!q) { App.toast('请输入查询', 'error'); return; }
    const cat = document.getElementById('memQueryCat').value;
    const topN = parseInt(document.getElementById('memTopN').value) || 5;
    const useEmb = this._useEmb ?? APISettings.getConfig().embEnabled;
    const r = document.getElementById('memResults');
    if (!r) { console.warn('[v7] 元素 #memResults 未找到'); }
    r.innerHTML = '<p style="color:var(--text-muted);">检索中...</p>';
    const res = await this.recall(q, { category: cat || null, topN, useEmb });
    if (res.length === 0) { r.innerHTML = '<div class="ez-empty"><p>未找到相关记忆</p></div>'; return; }
    r.innerHTML = '<h4 style="margin-bottom:8px;">检索结果：</h4>' + res.map(x => {
      const m = x.memory; const cat = this.getCategories().find(c => c.id === m.category);
      return `<div class="ez-card" style="margin-bottom:var(--space-sm);border-left:3px solid ${cat?.color || 'var(--border-color)'};">
        <div class="card-body">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-size:12px;color:var(--text-muted);">${cat?.name || ''} · ${m.scene || '无场景'}</span>
            <span style="display:flex;gap:4px;">
              <span class="tag" style="background:var(--color-gold);">${(x.score * 100).toFixed(0)}%</span>
              ${m.importance ? `<span class="tag" style="background:var(--color-primary);">重要度${(m.importance*100).toFixed(0)}%</span>` : ''}
            </span>
          </div>
          <p style="font-size:14px;">${m.content}</p>
          ${m.tags?.length ? `<div style="margin-top:6px;">${m.tags.map(t => `<span class="tag tag-secondary">${t}</span>`).join(' ')}</div>` : ''}
        </div>
      </div>`;
    }).join('');
  },

  async addFromForm() {
    const content = document.getElementById('memAddContent').value.trim();
    if (!content) { App.toast('请输入内容', 'error'); return; }
    const cat = document.getElementById('memAddCat').value || 'cat_dialogue';
    const scene = document.getElementById('memAddScene').value;
    const tags = document.getElementById('memAddTags').value.split(',').map(t => t.trim()).filter(t => t);
    await this.addMemory({ content, category: cat, scene, tags });
    document.getElementById('memAddContent').value = '';
    document.getElementById('memAddTags').value = '';
    this.renderList(); this.renderStats();
    App.toast('记忆已保存', 'success');
  },

  batchImportPrompt() {
    const text = prompt('粘贴要批量导入的文本（每行一条）：');
    if (!text) return;
    const cat = document.getElementById('memAddCat')?.value || 'cat_note';
    this.batchImport(text, cat);
  },

  async aiCategorize() {
    const content = document.getElementById('memAddContent').value.trim();
    if (!content) { App.toast('先输入内容', 'error'); return; }
    try {
      const cats = this.getCategories().map(c => c.name).join('、');
      const prompt = `将以下内容分类到以下类别之一：${cats}。只输出类别名称，不要解释。\n\n内容：${content}`;
      const result = await APISettings.chat(prompt, [], { useAux: true });
      const catName = result.trim();
      const cat = this.getCategories().find(c => c.name === catName || catName.includes(c.name));
      if (cat) {
        const sel = document.getElementById('memAddCat');
        if (sel) sel.value = cat.id;
        App.toast(`AI分类：${cat.name}`, 'success');
      }
    } catch (e) { App.toast('分类失败', 'error'); }
  },

  renderStats() {
    const c = document.getElementById('memStats');
    if (!c) { console.warn('[v7] 元素 #memStats 未找到'); }
    if (!c) return;
    Storage.getMemories().then(mems => {
      const cfg = APISettings.getConfig();
      c.innerHTML = `
        <div class="ez-card"><div class="card-body" style="text-align:center;"><div style="font-size:28px;font-weight:700;color:var(--color-primary);">${mems.length}</div><div style="font-size:12px;color:var(--text-muted);">记忆数</div></div></div>
        <div class="ez-card"><div class="card-body" style="text-align:center;"><div style="font-size:28px;font-weight:700;color:var(--color-gold);">${cfg.embEnabled ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 12L2.5 8.5"/><path d="M12 12v10"/></svg>' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'}</div><div style="font-size:12px;color:var(--text-muted);">${cfg.embEnabled ? 'Embedding' : 'TF-IDF'}</div></div></div>
        <div class="ez-card"><div class="card-body" style="text-align:center;"><div style="font-size:28px;font-weight:700;color:var(--color-accent);">${this.getCategories().length}</div><div style="font-size:12px;color:var(--text-muted);">分类数</div></div></div>
      `;
    });
  },

  async renderList() {
    const c = document.getElementById('memList');
    if (!c) { console.warn('[v7] 元素 #memList 未找到'); }
    if (!c) return;
    const mems = await Storage.getMemories();
    mems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    if (mems.length === 0) { c.innerHTML = '<div class="ez-empty"><div class="ez-empty-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 12L2.5 8.5"/><path d="M12 12v10"/></svg></div><p>暂无记忆</p></div>'; return; }
    c.innerHTML = mems.map(m => {
      const cat = this.getCategories().find(c => c.id === m.category);
      return `<div class="list-item">
        <span style="font-size:20px;">${cat ? '●' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'}</span>
        <div class="list-info">
          <h4>${(m.content || '').substring(0, 50)}${m.content?.length > 50 ? '...' : ''}</h4>
          <p><span style="color:${cat?.color || 'var(--text-muted)'};">${cat?.name || '未分类'}</span> · ${m.scene || '无场景'} · ${m.tokens?.length || 0}词 ${m.importance ? `· 重要度${(m.importance*100).toFixed(0)}%` : ''}</p>
        </div>
        <button class="ez-btn btn btn-sm btn-danger" onclick="MemorySystem.deleteMem('${m.id}')">🗑️</button>
      </div>`;
    }).join('');
  },

  async deleteMem(id) {
    if (!confirm('删除这条记忆？')) return;
    await Storage.deleteMemory(id);
    this.renderList(); this.renderStats();
  },

  async autoSummarize(text) {
    const cfg = this.getConfig();
    if (!cfg.autoSave || !text) return null;
    try {
      const prompt = `${cfg.summaryPrompt}\n\n${text}`;
      return await APISettings.chat(prompt, [], { useAux: true });
    } catch (e) { return null; }
  }
};