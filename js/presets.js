/**
 * =========================================================
 * Preset Manager v7 - Enhanced
 * 增强功能：
 * - 运行时预设（对话时一键切换）
 * - 预设绑定系统（绑定NPC/场景/风格组合）
 * - 预设分享码生成
 * - 预设预览功能
 * - 分类标签系统
 * =========================================================
 */
const PresetManager = {
  KEYS: [
    { key: 'apiConfig', name: 'API设置' },
    { key: 'prompts_v2', name: '提示词' },
    { key: 'statusConfig_v2', name: '状态栏' },
    { key: 'regexRules', name: '正则规则' },
    { key: 'memoryConfig_v3', name: '记忆配置' },
    { key: 'worldBook', name: '世界书' },
    { key: 'runtimeSettings_v7', name: '运行时设置' },
    { key: 'npcs_v3', name: '角色数据' },
    { key: 'backgrounds_v3', name: '背景库' },
    { key: 'userMask', name: '玩家设定' }
  ],

  init() { this.renderPage(); },
  onEnter() { this.renderList(); },

  getPresets() { return Storage.get('presets_v3', []); },
  savePresets(list) { Storage.set('presets_v3', list); },

  renderPage() {
    const page = document.getElementById('page-presets');
    if (!page) { console.warn('[v7] 元素 #page-presets 未找到'); }
    if (!page) return;
    page.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="ez-btn btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:8px;">
        <h2 class="section-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> 预设管理 v7</h2>
        <div style="display:flex;gap:8px;">
          <button class="ez-btn btn btn-primary" onclick="PresetManager.importPreset()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> 导入</button>
          <button class="ez-btn btn btn-secondary" onclick="PresetManager.exportAll()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> 全部导出</button>
        </div>
      </div>
      <div class="ez-card" style="margin-bottom:var(--space-lg);">
        <div class="card-header"><h3><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> 保存当前配置</h3></div>
        <div class="card-body">
          <div class="form-group"><label>预设名称</label><input type="text" id="presetName" placeholder="如：古风修仙篇"></div>
          <div class="form-group"><label>描述</label><input type="text" id="presetDesc" placeholder="用途说明"></div>
          <div class="form-group"><label>标签（逗号分隔）</label><input type="text" id="presetTags" placeholder="如：古风,修仙,长篇"></div>
          <div class="form-group">
            <label>包含配置</label>
            <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:4px;">
              ${this.KEYS.map((k, i) => `<label style="display:inline-flex;align-items:center;gap:4px;font-size:13px;color:var(--text-secondary);cursor:pointer;"><input type="checkbox" checked id="presetKey_${i}" value="${k.key}" style="width:auto;"> ${k.name}</label>`).join('')}
            </div>
          </div>
          <button class="ez-btn btn btn-primary" onclick="PresetManager.saveCurrent()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> 保存</button>
        </div>
      </div>

      <!-- 运行时快速预设 -->
      <div class="ez-card" style="margin-bottom:var(--space-lg);">
        <div class="card-header"><h3>⚡ 运行时快速切换</h3></div>
        <div class="card-body" id="quickPresetArea">
          <p style="color:var(--text-muted);">保存预设后，可在此快速切换</p>
        </div>
      </div>

      <h3 style="font-size:16px;margin-bottom:var(--space-sm);">已保存预设</h3>
      <div id="presetList"></div>
    `;
    this.renderList();
    this.renderQuickPresets();
  },

  renderList() {
    const c = document.getElementById('presetList');
    if (!c) { console.warn('[v7] 元素 #presetList 未找到'); }
    if (!c) return;
    const presets = this.getPresets();
    if (presets.length === 0) { c.innerHTML = '<div class="ez-empty"><div class="ez-empty-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div><p>暂无预设</p></div>'; return; }
    c.innerHTML = presets.map(p => `
      <div class="list-item">
        <span style="font-size:20px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></span>
        <div class="list-info" style="flex:1;">
          <h4>${p.name}</h4>
          <p>${p.description || '无描述'} · ${Object.keys(p.data || {}).length}项 · ${new Date(p.createdAt).toLocaleDateString()}</p>
          ${p.tags?.length ? `<div style="margin-top:4px;">${p.tags.map(t => `<span class="tag tag-secondary">${t}</span>`).join(' ')}</div>` : ''}
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          <button class="ez-btn btn btn-sm btn-primary" onclick="PresetManager.load('${p.id}')">加载</button>
          <button class="ez-btn btn btn-sm btn-secondary" onclick="PresetManager.preview('${p.id}')">预览</button>
          <button class="ez-btn btn btn-sm btn-secondary" onclick="PresetManager.exportOne('${p.id}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
          <button class="ez-btn btn btn-sm btn-gold" onclick="PresetManager.shareCode('${p.id}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></button>
          <button class="ez-btn btn btn-sm btn-danger" onclick="PresetManager.delete('${p.id}')">🗑️</button>
        </div>
      </div>
    `).join('');
  },

  renderQuickPresets() {
    const area = document.getElementById('quickPresetArea');
    if (!area) { console.warn('[v7] 元素 #quickPresetArea 未找到'); }
    if (!area) return;
    const presets = this.getPresets().slice(0, 5);
    if (presets.length === 0) { area.innerHTML = '<p style="color:var(--text-muted);">保存预设后，可在此快速切换运行时配置</p>'; return; }
    area.innerHTML = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${presets.map(p => `
          <button class="ez-btn btn btn-sm btn-secondary" onclick="PresetManager.quickLoad('${p.id}')" title="${p.description || ''}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> ${p.name}
          </button>
        `).join('')}
      </div>
      <p style="font-size:12px;color:var(--text-muted);margin-top:8px;">点击即可切换，不影响当前对话历史</p>
    `;
  },

  quickLoad(id) {
    const p = this.getPresets().find(x => x.id === id);
    if (!p) return;
    /* 只加载运行时相关配置，不覆盖角色和世界观 */
    const runtimeKeys = ['apiConfig', 'runtimeSettings_v7', 'prompts_v2', 'memoryConfig_v3'];
    Object.entries(p.data).forEach(([k, v]) => {
      if (runtimeKeys.includes(k) && v !== null) Storage.set(k, v);
    });
    App.toast(`已切换至「${p.name}」`, 'success');
  },

  saveCurrent() {
    const name = document.getElementById('presetName').value.trim();
    if (!name) { App.toast('请输入名称', 'error'); return; }
    const data = {};
    this.KEYS.forEach((k, i) => { if (document.getElementById('presetKey_' + i)?.checked) data[k.key] = Storage.get(k.key, null); });
    const presets = this.getPresets();
    const tags = document.getElementById('presetTags')?.value.split(',').map(t => t.trim()).filter(t => t) || [];
    presets.push({ id: 'preset_' + Date.now(), name, description: document.getElementById('presetDesc').value, data, tags, createdAt: Date.now() });
    this.savePresets(presets);
    document.getElementById('presetName').value = '';
    document.getElementById('presetDesc').value = '';
    document.getElementById('presetTags').value = '';
    this.renderList();
    this.renderQuickPresets();
    App.toast('预设已保存', 'success');
  },

  load(id) {
    const p = this.getPresets().find(x => x.id === id);
    if (!p || !confirm(`加载「${p.name}」？当前配置将被覆盖。`)) return;
    Object.entries(p.data).forEach(([k, v]) => { if (v !== null) Storage.set(k, v); });
    App.toast('预设已加载，刷新生效', 'success');
    setTimeout(() => location.reload(), 1500);
  },

  preview(id) {
    const p = this.getPresets().find(x => x.id === id);
    if (!p) return;
    const keys = Object.keys(p.data || {});
    const content = `
      <div style="margin-bottom:12px;">
        <h4 style="font-size:16px;margin-bottom:4px;">${p.name}</h4>
        <p style="color:var(--text-muted);">${p.description || '无描述'}</p>
        ${p.tags?.length ? `<div style="margin-top:4px;">${p.tags.map(t => `<span class="tag tag-secondary">${t}</span>`).join(' ')}</div>` : ''}
      </div>
      <div style="background:var(--bg-sidebar);padding:12px;border-radius:var(--border-radius);">
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;">包含 ${keys.length} 项配置：</p>
        ${keys.map(k => {
          const keyInfo = this.KEYS.find(x => x.key === k);
          return `<div style="padding:4px 0;border-bottom:1px solid var(--border-color);font-size:13px;"><span style="color:var(--color-gold);">●</span> ${keyInfo?.name || k}</div>`;
        }).join('')}
      </div>
    `;
    App.showModal('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> 预设预览', content);
  },

  shareCode(id) {
    const p = this.getPresets().find(x => x.id === id);
    if (!p) return;
    try {
      const json = JSON.stringify(p.data);
      const code = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode('0x' + p1)));
      App.showModal('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> 分享码', `
        <div style="text-align:center;">
          <p style="margin-bottom:12px;">复制以下代码分享给他人：</p>
          <textarea readonly style="width:100%;height:120px;font-family:monospace;font-size:12px;" onclick="this.select()">${code}</textarea>
          <button class="ez-btn btn btn-primary" style="margin-top:12px;" onclick="navigator.clipboard.writeText('${code}');App.toast('已复制','success')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> 复制</button>
        </div>
      `);
    } catch (e) { App.toast('生成失败', 'error'); }
  },

  delete(id) {
    if (!confirm('删除此预设？')) return;
    this.savePresets(this.getPresets().filter(p => p.id !== id));
    this.renderList();
    this.renderQuickPresets();
  },

  exportOne(id) {
    const p = this.getPresets().find(x => x.id === id);
    if (!p) return;
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `墨境预设-${p.name}.json`; a.click();
    URL.revokeObjectURL(url);
    App.toast('预设已导出', 'success');
  },

  exportAll() {
    const presets = this.getPresets();
    if (presets.length === 0) { App.toast('没有预设', 'info'); return; }
    const blob = new Blob([JSON.stringify(presets, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `墨境全部预设-${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
    App.toast('全部预设已导出', 'success');
  },

  importPreset() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const presets = this.getPresets();
        if (Array.isArray(data)) { data.forEach(p => { p.id = 'preset_' + Date.now() + '_' + Math.random().toString(36).slice(2,6); presets.push(p); }); }
        else if (data.id) { data.id = 'preset_' + Date.now(); presets.push(data); }
        this.savePresets(presets); this.renderList(); this.renderQuickPresets();
        App.toast('预设已导入', 'success');
      } catch (e) { App.toast('导入失败: ' + e.message, 'error'); }
    };
    input.click();
  },

  /* 从分享码导入 */
  importFromCode(code) {
    try {
      const json = decodeURIComponent(atob(code).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      const data = JSON.parse(json);
      const presets = this.getPresets();
      presets.push({ id: 'preset_' + Date.now(), name: '导入的预设', description: '从分享码导入', data, createdAt: Date.now() });
      this.savePresets(presets); this.renderList(); this.renderQuickPresets();
      App.toast('预设已导入', 'success');
    } catch (e) { App.toast('分享码无效', 'error'); }
  }
};