/**
 * =========================================================
 * Status Bar v7
 * Custom fields, affection bars, overlay
 * =========================================================
 */
const StatusBar = {
  getDefault() {
    return {
      showScene: true, showTime: true, showWorld: true,
      customFields: [
        { id: 'f1', label: '体力', value: 100, max: 100, type: 'bar' },
        { id: 'f2', label: '灵石', value: 50, max: null, type: 'text' },
        { id: 'f3', label: '修为', value: 1, max: 100, type: 'bar' }
      ],
      npcAffection: []
    };
  },
  getConfig() { return Storage.get('statusConfig_v2', this.getDefault()); },
  saveConfig(c) { Storage.set('statusConfig_v2', c); },

  init() { this.renderPage(); },
  onEnter() { this.renderConfig(); this.renderPreview(); },

  renderPage() {
    const page = document.getElementById('page-status');
    if (!page) { console.warn('[v7] 元素 #page-status 未找到'); }
    if (!page) return;
    page.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
        <button class="ez-btn btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button>
      </div>
      <h2 class="section-title" style="margin-bottom:var(--space-lg);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> 状态栏</h2>
      <div class="grid grid-2">
        <div class="ez-card"><div class="card-header"><h3>配置</h3></div><div class="card-body" id="statusConfigArea"></div></div>
        <div class="ez-card"><div class="card-header"><h3>预览</h3></div><div class="card-body" id="statusPreviewArea"></div></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:var(--space-lg);">
        <button class="ez-btn btn btn-primary" onclick="StatusBar.save()">保存</button>
        <button class="ez-btn btn btn-secondary" onclick="StatusBar.addField()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 状态项</button>
        <button class="ez-btn btn btn-secondary" onclick="StatusBar.addAffection()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 好感度</button>
      </div>
    `;
    this.renderConfig(); this.renderPreview();
  },

  renderConfig() {
    const c = this.getConfig();
    const area = document.getElementById('statusConfigArea');
    if (!area) { console.warn('[v7] 元素 #statusConfigArea 未找到'); }
    if (!area) return;
    area.innerHTML = `
      <div class="form-group"><label>显示场景</label><div class="switch ${c.showScene ? 'on' : ''}" onclick="this.classList.toggle('on')" id="st_scene"></div></div>
      <div class="form-group"><label>显示时间</label><div class="switch ${c.showTime ? 'on' : ''}" onclick="this.classList.toggle('on')" id="st_time"></div></div>
      <div class="form-group"><label>显示世界</label><div class="switch ${c.showWorld ? 'on' : ''}" onclick="this.classList.toggle('on')" id="st_world"></div></div>
      <h4 style="margin:var(--space-md) 0 var(--space-sm);color:var(--text-secondary);">自定义状态</h4>
      <div id="statusCustomFields"></div>
      <h4 style="margin:var(--space-lg) 0 var(--space-sm);color:var(--text-secondary);">NPC好感度</h4>
      <div id="statusAffection"></div>
    `;
    this.renderCustomFields(); this.renderAffection();
  },

  renderCustomFields() {
    const c = document.getElementById('statusCustomFields');
    if (!c) { console.warn('[v7] 元素 #statusCustomFields 未找到'); }
    if (!c) return;
    const cfg = this.getConfig();
    c.innerHTML = cfg.customFields.map(f => `
      <div class="regex-item" style="margin-bottom:8px;">
        <div class="form-row">
          <div class="form-group"><input type="text" value="${f.label}" onchange="StatusBar.updateField('${f.id}','label',this.value)" placeholder="名称"></div>
          <div class="form-group"><input type="number" value="${f.value}" onchange="StatusBar.updateField('${f.id}','value',parseFloat(this.value))" placeholder="数值"></div>
          <div class="form-group"><input type="number" value="${f.max || ''}" onchange="StatusBar.updateField('${f.id}','max',this.value?parseFloat(this.value):null)" placeholder="最大值"></div>
          <div class="form-group"><select onchange="StatusBar.updateField('${f.id}','type',this.value)"><option value="bar" ${f.type === 'bar' ? 'selected' : ''}>进度条</option><option value="text" ${f.type === 'text' ? 'selected' : ''}>文本</option></select></div>
        </div>
        <button class="ez-btn btn btn-sm btn-danger" onclick="StatusBar.removeField('${f.id}')">删除</button>
      </div>
    `).join('');
  },

  renderAffection() {
    const c = document.getElementById('statusAffection');
    if (!c) { console.warn('[v7] 元素 #statusAffection 未找到'); }
    if (!c) return;
    const cfg = this.getConfig();
    const npcs = NPCManager?.getNPCs?.() || [];
    if (cfg.npcAffection.length === 0) { c.innerHTML = '<p style="font-size:13px;color:var(--text-muted);">暂无好感度条</p>'; return; }
    c.innerHTML = cfg.npcAffection.map(a => {
      const npc = npcs.find(n => n.id === a.npcId);
      return `<div class="regex-item" style="margin-bottom:8px;">
        <div class="form-row">
          <div class="form-group"><select onchange="StatusBar.updateAff('${a.id}','npcId',this.value)"><option value="">选择NPC</option>${npcs.map(n => `<option value="${n.id}" ${a.npcId === n.id ? 'selected' : ''}>${n.name}</option>`).join('')}</select></div>
          <div class="form-group"><input type="number" value="${a.value}" onchange="StatusBar.updateAff('${a.id}','value',parseFloat(this.value))" placeholder="当前"></div>
          <div class="form-group"><input type="number" value="${a.max}" onchange="StatusBar.updateAff('${a.id}','max',parseFloat(this.value))" placeholder="最大"></div>
        </div>
        <button class="ez-btn btn btn-sm btn-danger" onclick="StatusBar.removeAff('${a.id}')">删除</button>
      </div>`;
    }).join('');
  },

  renderPreview() {
    const area = document.getElementById('statusPreviewArea');
    if (!area) { console.warn('[v7] 元素 #statusPreviewArea 未找到'); }
    if (!area) return;
    area.innerHTML = `<div class="status-bar-widget">${this.getHTML()}</div>`;
  },

  getHTML() {
    const c = this.getConfig();
    let h = '';
    if (c.showScene) h += `<div class="status-row"><span class="status-label"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> 场景</span><span class="status-value" id="st_sceneName">${Storage.get('currentScene', '未知')}</span></div>`;
    if (c.showTime) h += `<div class="status-row"><span class="status-label">⏰ 时间</span><span class="status-value" id="st_timeVal">--:--</span></div>`;
    if (c.showWorld) { const w = Storage.get('worldData', {}); if (w.name) h += `<div class="status-row"><span class="status-label"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> 世界</span><span class="status-value">${w.name}</span></div>`; }
    c.customFields.forEach(f => {
      if (f.type === 'bar' && f.max) { const pct = Math.min(100, (f.value / f.max) * 100); h += `<div class="status-row" style="flex-direction:column;align-items:stretch;"><div style="display:flex;justify-content:space-between;"><span class="status-label">${f.label}</span><span class="status-value">${f.value}/${f.max}</span></div><div class="affection-bar"><div class="affection-fill" style="width:${pct}%"></div></div></div>`; }
      else { h += `<div class="status-row"><span class="status-label">${f.label}</span><span class="status-value">${f.value}</span></div>`; }
    });
    c.npcAffection.forEach(a => {
      const npc = (NPCManager?.getNPCs?.() || []).find(n => n.id === a.npcId);
      const name = npc?.name || '?';
      const pct = a.max ? Math.min(100, (a.value / a.max) * 100) : 0;
      h += `<div class="status-row" style="flex-direction:column;align-items:stretch;"><div style="display:flex;justify-content:space-between;"><span class="status-label"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> ${name}</span><span class="status-value">${a.value}${a.max ? '/' + a.max : ''}</span></div><div class="affection-bar"><div class="affection-fill" style="width:${pct}%"></div></div></div>`;
    });
    return h || '<p style="color:var(--text-muted);font-size:13px;">无状态项</p>';
  },

  getOverlayHTML() {
    const c = this.getConfig();
    let h = '';
    if (c.showScene) { const scene = Storage.get('currentScene', '--'); h += `<div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${scene}</div>`; }
    c.customFields.filter(f => f.type === 'text').forEach(f => { h += `<div>${f.label}: ${f.value}</div>`; });
    c.npcAffection.slice(0, 3).forEach(a => { const npc = (NPCManager?.getNPCs?.() || []).find(n => n.id === a.npcId); h += `<div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>${npc?.name || '?'}: ${a.value}${a.max ? '/' + a.max : ''}</div>`; });
    return h;
  },

  addField() { const c = this.getConfig(); c.customFields.push({ id: 'f_' + Date.now(), label: '新状态', value: 0, max: 100, type: 'bar' }); this.saveConfig(c); this.renderConfig(); this.renderPreview(); },
  removeField(id) { const c = this.getConfig(); c.customFields = c.customFields.filter(f => f.id !== id); this.saveConfig(c); this.renderConfig(); this.renderPreview(); },
  updateField(id, key, val) { const c = this.getConfig(); const f = c.customFields.find(x => x.id === id); if (f) { f[key] = val; this.saveConfig(c); this.renderPreview(); } },
  addAffection() { const c = this.getConfig(); c.npcAffection.push({ id: 'aff_' + Date.now(), npcId: '', value: 50, max: 100 }); this.saveConfig(c); this.renderConfig(); this.renderPreview(); },
  removeAff(id) { const c = this.getConfig(); c.npcAffection = c.npcAffection.filter(a => a.id !== id); this.saveConfig(c); this.renderConfig(); this.renderPreview(); },
  updateAff(id, key, val) { const c = this.getConfig(); const a = c.npcAffection.find(x => x.id === id); if (a) { a[key] = val; this.saveConfig(c); this.renderPreview(); } },

  save() {
    const c = this.getConfig();
    c.showScene = document.getElementById('st_scene')?.classList.contains('on') ?? true;
    c.showTime = document.getElementById('st_time')?.classList.contains('on') ?? true;
    c.showWorld = document.getElementById('st_world')?.classList.contains('on') ?? true;
    this.saveConfig(c);
    App.toast('状态栏已保存', 'success');
  },

  updateOverlay() {
    const overlay = document.getElementById('vnStatusOverlay');
    if (overlay) overlay.innerHTML = this.getOverlayHTML();
    const sceneEl = document.getElementById('st_sceneName');
    if (sceneEl) sceneEl.textContent = Storage.get('currentScene', '未知');
  }
};
