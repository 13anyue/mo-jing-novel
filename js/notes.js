/**
 * =========================================================
 * Notes / Diary System
 * Notebook with DIY categories
 * =========================================================
 */
const Notes = {
  getNotes() { return Storage.get('notebook', []); },
  saveNotes(list) { Storage.set('notebook', list); },
  getCategories() { return Storage.get('noteCategories', []); },
  saveCategories(c) { Storage.set('noteCategories', c); },

  init() { this.renderPage(); },
  onEnter() { this.renderList(); },

  renderPage() {
    const page = document.getElementById('page-notes');
    if (!page) return;
    page.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);">
        <h2 class="section-title">📖 记事册</h2>
        <button class="btn btn-primary" onclick="Notes.openEditor()">➕ 新建记事</button>
      </div>
      <div id="noteList"></div>
      <div class="modal-overlay" id="noteModal">
        <div class="modal">
          <div class="modal-header"><h3 id="noteTitle">记事</h3><button class="btn-icon" onclick="App.closeModal('noteModal')">✕</button></div>
          <div class="modal-body" id="noteBody"></div>
        </div>
      </div>
    `;
    this.renderList();
  },

  renderList() {
    const c = document.getElementById('noteList');
    if (!c) return;
    const notes = this.getNotes().sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    if (notes.length === 0) { c.innerHTML = '<div class="empty-state"><div class="empty-icon">📖</div><p>记事册为空</p></div>'; return; }
    c.innerHTML = notes.map(n => {
      const cat = this.getCategories().find(c => c.id === n.category);
      return `<div class="card" style="margin-bottom:var(--space-sm);border-left:3px solid ${cat?.color || 'var(--border-color)'};">
        <div class="card-body">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="tag" style="background:${cat?.color || 'var(--border-color)'};color:#fff;font-size:11px;">${cat?.name || '未分类'}</span>
              <span style="font-size:12px;color:var(--text-muted);">${new Date(n.timestamp).toLocaleString()}</span>
            </div>
            <div style="display:flex;gap:4px;">
              <button class="btn btn-sm btn-secondary" onclick="Notes.editNote('${n.id}')">✏️</button>
              <button class="btn btn-sm btn-danger" onclick="Notes.deleteNote('${n.id}')">🗑️</button>
            </div>
          </div>
          <h4 style="font-family:var(--font-display);font-size:15px;margin-bottom:6px;">${n.title || '无标题'}</h4>
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.7;">${(n.content || '').substring(0, 200)}${(n.content || '').length > 200 ? '...' : ''}</p>
        </div>
      </div>`;
    }).join('');
  },

  openEditor(id = null) {
    const note = id ? this.getNotes().find(n => n.id === id) : null;
    this._editingId = id;
    document.getElementById('noteTitle').textContent = note ? '编辑记事' : '新建记事';
    document.getElementById('noteBody').innerHTML = `
      <input type="hidden" id="note_id" value="${note?.id || ''}">
      <div class="form-group"><label>标题</label><input type="text" id="note_title" value="${note?.title || ''}" placeholder="记事标题"></div>
      <div class="form-group"><label>分类</label><select id="note_cat">${this.getCategories().map(c => `<option value="${c.id}" ${note?.category === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}</select></div>
      <div class="form-group"><label>内容</label><textarea id="note_content" rows="8" placeholder="记事内容...">${note?.content || ''}</textarea></div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;">
        <button class="btn btn-secondary" onclick="App.closeModal('noteModal')">取消</button>
        <button class="btn btn-primary" onclick="Notes.saveNote()">保存</button>
      </div>
    `;
    App.openModal('noteModal');
  },

  editNote(id) { this.openEditor(id); },

  saveNote() {
    const notes = this.getNotes();
    const id = document.getElementById('note_id').value || ('note_' + Date.now());
    const note = {
      id, title: document.getElementById('note_title').value,
      category: document.getElementById('note_cat').value,
      content: document.getElementById('note_content').value,
      timestamp: Date.now()
    };
    const idx = notes.findIndex(n => n.id === id);
    if (idx >= 0) notes[idx] = note; else notes.push(note);
    this.saveNotes(notes);
    App.closeModal('noteModal');
    this.renderList();
    App.toast('记事已保存', 'success');
  },

  deleteNote(id) {
    if (!confirm('删除这条记事？')) return;
    this.saveNotes(this.getNotes().filter(n => n.id !== id));
    this.renderList();
  }
};
