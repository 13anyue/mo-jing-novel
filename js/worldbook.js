/**
 * =========================================================
 * World Book System
 * - Injection (prompt injection at runtime)
 * - Permanent (always loaded world knowledge)
 * - Depth (hierarchical depth levels)
 * =========================================================
 */
const WorldBook = {
  getData() { return Storage.get('worldBook', { entries: [] }); },
  saveData(d) { Storage.set('worldBook', d); },

  init() { this.renderPage(); },
  onEnter() { this.renderList(); },

  renderPage() {
    const page = document.getElementById('page-worldbook');
    if (!page) return;
    page.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);">
        <h2 class="section-title">世界书</h2>
        <button class="btn btn-primary" onclick="WorldBook.openEditor()">➕ 新建条目</button>
      </div>
      <div class="grid grid-3" id="worldbookStats" style="margin-bottom:var(--space-lg);"></div>
      <div id="worldbookList"></div>
      <div class="modal-overlay" id="wbModal">
        <div class="modal lg">
          <div class="modal-header"><h3 id="wbTitle">世界书条目</h3><button class="btn-icon" onclick="App.closeModal('wbModal')">✕</button></div>
          <div class="modal-body" id="wbBody"></div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="App.closeModal('wbModal')">取消</button>
            <button class="btn btn-primary" onclick="WorldBook.saveEntry()">保存</button>
          </div>
        </div>
      </div>
    `;
    this.renderStats(); this.renderList();
  },

  renderStats() {
    const data = this.getData();
    const stats = { total: data.entries.length, permanent: data.entries.filter(e => e.permanent).length, injection: data.entries.filter(e => e.injection).length };
    document.getElementById('worldbookStats').innerHTML = `
      <div class="card"><div class="card-body" style="text-align:center;"><div style="font-size:28px;font-weight:700;color:var(--color-primary);">${stats.total}</div><div style="font-size:12px;color:var(--text-muted);">总条目</div></div></div>
      <div class="card"><div class="card-body" style="text-align:center;"><div style="font-size:28px;font-weight:700;color:var(--color-gold);">${stats.permanent}</div><div style="font-size:12px;color:var(--text-muted);">常驻</div></div></div>
      <div class="card"><div class="card-body" style="text-align:center;"><div style="font-size:28px;font-weight:700;color:var(--color-accent);">${stats.injection}</div><div style="font-size:12px;color:var(--text-muted);">注入</div></div></div>
    `;
  },

  renderList() {
    const c = document.getElementById('worldbookList');
    if (!c) return;
    const data = this.getData();
    if (data.entries.length === 0) { c.innerHTML = '<div class="empty-state"><div class="empty-icon">📚</div><p>世界书为空</p></div>'; return; }
    c.innerHTML = data.entries.map(e => `
      <div class="worldbook-entry">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:4px;">
          <h4 style="font-family:var(--font-display);display:flex;align-items:center;gap:8px;">
            ${e.title}
            ${e.permanent ? '<span class="tag tag-gold">常驻</span>' : ''}
            ${e.injection ? '<span class="tag">注入</span>' : ''}
            ${e.depth > 0 ? `<span class="tag tag-secondary">深度 ${e.depth}</span>` : ''}
          </h4>
          <div style="display:flex;gap:4px;">
            <button class="btn btn-sm btn-secondary" onclick="WorldBook.openEditor('${e.id}')">✏️</button>
            <button class="btn btn-sm btn-danger" onclick="WorldBook.deleteEntry('${e.id}')">🗑️</button>
          </div>
        </div>
        <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;">${e.content?.substring(0, 120)}${e.content?.length > 120 ? '...' : ''}</p>
        ${e.keywords ? `<div style="margin-top:6px;"><span style="font-size:11px;color:var(--text-muted);">关键词：${e.keywords}</span></div>` : ''}
      </div>
    `).join('');
  },

  openEditor(id = null) {
    const data = this.getData();
    const entry = id ? data.entries.find(e => e.id === id) : null;
    this._editingId = id;
    document.getElementById('wbTitle').textContent = entry ? '编辑条目' : '新建条目';
    document.getElementById('wbBody').innerHTML = `
      <input type="hidden" id="wb_id" value="${entry?.id || ''}">
      <div class="form-group"><label>标题</label><input type="text" id="wb_title" value="${entry?.title || ''}" placeholder="如：天元宗门规"></div>
      <div class="form-group"><label>内容</label><textarea id="wb_content" rows="6" placeholder="世界设定内容...">${entry?.content || ''}</textarea></div>
      <div class="form-group"><label>关键词（用于注入匹配）</label><input type="text" id="wb_keywords" value="${entry?.keywords || ''}" placeholder="如：宗门, 规矩, 修行"></div>
      <div class="form-row">
        <div class="form-group"><label><input type="checkbox" id="wb_permanent" ${entry?.permanent ? 'checked' : ''} style="width:auto;"> 常驻（始终加载）</label></div>
        <div class="form-group"><label><input type="checkbox" id="wb_injection" ${entry?.injection ? 'checked' : ''} style="width:auto;"> 注入（匹配关键词时注入提示词）</label></div>
      </div>
      <div class="form-group"><label>深度等级（0=基础, 1=进阶, 2=深层）</label><input type="number" id="wb_depth" value="${entry?.depth ?? 0}" min="0" max="5"></div>
      <div class="hint">常驻条目会始终出现在AI提示词中。注入条目只有当对话中出现关键词时才会被注入。</div>
    `;
    App.openModal('wbModal');
  },

  saveEntry() {
    const data = this.getData();
    const id = document.getElementById('wb_id').value || ('wb_' + Date.now());
    const entry = {
      id, title: document.getElementById('wb_title').value,
      content: document.getElementById('wb_content').value,
      keywords: document.getElementById('wb_keywords').value,
      permanent: document.getElementById('wb_permanent')?.checked || false,
      injection: document.getElementById('wb_injection')?.checked || false,
      depth: parseInt(document.getElementById('wb_depth').value) || 0,
      updatedAt: Date.now()
    };
    const idx = data.entries.findIndex(e => e.id === id);
    if (idx >= 0) data.entries[idx] = entry;
    else { entry.createdAt = Date.now(); data.entries.push(entry); }
    this.saveData(data);
    App.closeModal('wbModal');
    this.renderStats(); this.renderList();
    App.toast('条目已保存', 'success');
  },

  deleteEntry(id) {
    if (!confirm('删除此条目？')) return;
    const data = this.getData();
    data.entries = data.entries.filter(e => e.id !== id);
    this.saveData(data);
    this.renderStats(); this.renderList();
  },

  /**
   * Get prompt injection text based on current context
   * Called by runtime before each AI call
   */
  getInjectionText(contextText) {
    const data = this.getData();
    let text = '';
    // Permanent entries always included
    data.entries.filter(e => e.permanent).forEach(e => { text += `【${e.title}】${e.content}\n`; });
    // Injection entries only when keywords match
    if (contextText) {
      data.entries.filter(e => e.injection && e.keywords).forEach(e => {
        const kws = e.keywords.split(/[,，、]/).map(k => k.trim()).filter(Boolean);
        if (kws.some(k => contextText.includes(k))) {
          text += `【${e.title}】${e.content}\n`;
        }
      });
    }
    return text;
  },

  getPermanentEntries() {
    return this.getData().entries.filter(e => e.permanent);
  }
};
