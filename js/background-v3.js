/**
 * =========================================================
 * Background Library v3
 * Hierarchical categories + subcategories
 * Runtime auto-extracts backgrounds by selected category
 * =========================================================
 */
const BackgroundLibrary = {
  // ========== 零预设：分类树由用户自行创建 ==========
  CAT_TREE: {},
  // ====================================================

  _currentCat: 'all',
  _currentSub: null,

  init() { this.renderPage(); },
  onEnter() { this.renderGrid(); },

  getCategories() { return Storage.get('bgCategories_v3', this.CAT_TREE); },
  saveCategories(c) { Storage.set('bgCategories_v3', c); },
  getBackgrounds() { return Storage.get('backgrounds_v3', []); },
  saveBackgrounds(list) { Storage.set('backgrounds_v3', list); },

  renderPage() {
    const page = document.getElementById('page-background');
    if (!page) return;
    page.innerHTML = `
      <div style="padding:0;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:8px;">
        <h2 class="section-title">🖼️ 背景库</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-gold" onclick="BackgroundLibrary.openCategoryManager()">📁 分类管理</button>
          <button class="btn btn-primary" onclick="BackgroundLibrary.openUploader()">➕ 上传背景</button>
        </div>
      </div>
      <!-- Category Bar -->
      <div style="display:flex;gap:8px;margin-bottom:var(--space-sm);flex-wrap:wrap;" id="bgCatBar"></div>
      <!-- Subcategory Bar -->
      <div style="display:flex;gap:6px;margin-bottom:var(--space-md);flex-wrap:wrap;" id="bgSubBar"></div>
      <!-- Runtime hint -->
      <div style="background:var(--bg-parchment);border:1px dashed var(--color-gold);border-radius:var(--border-radius);padding:8px 12px;margin-bottom:var(--space-md);font-size:13px;color:var(--text-secondary);">
        💡 视觉小说运行时将从<b id="runtimeCatHint">所有分类</b>中随机选取背景
      </div>
      <div id="bgGrid" class="grid grid-3"></div>

      <!-- Upload Modal -->
      <div class="modal-overlay" id="bgUploadModal">
        <div class="modal">
          <div class="modal-header"><h3>上传背景</h3><button class="btn-icon" onclick="App.closeModal('bgUploadModal')">✕</button></div>
          <div class="modal-body" id="bgUploadBody"></div>
        </div>
      </div>

      <!-- Category Manager Modal -->
      <div class="modal-overlay" id="bgCatModal">
        <div class="modal xl">
          <div class="modal-header"><h3>📁 分类管理</h3><button class="btn-icon" onclick="App.closeModal('bgCatModal')">✕</button></div>
          <div class="modal-body" id="bgCatBody"></div>
        </div>
      </div>
    </div>
      <style>
        @media (max-width: 768px) {
          .grid { grid-template-columns: repeat(2, 1fr) !important; }
          .grid-3 { grid-template-columns: repeat(2, 1fr) !important; }
          .grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
        }
      </style>
    `;
    this.renderCatBar();
    this.renderSubBar();
    this.renderGrid();
  },

  renderCatBar() {
    const bar = document.getElementById('bgCatBar');
    if (!bar) return;
    const cats = this.getCategories();
    const allBtn = `<button class="btn btn-sm ${this._currentCat === 'all' ? 'btn-primary' : 'btn-secondary'}" onclick="BackgroundLibrary.filterCat('all')">🖼️ 全部</button>`;
    const catBtns = Object.entries(cats).map(([id, c]) =>
      `<button class="btn btn-sm ${this._currentCat === id ? 'btn-primary' : 'btn-secondary'}" onclick="BackgroundLibrary.filterCat('${id}')">${c.name}</button>`
    ).join('');
    bar.innerHTML = allBtn + catBtns;
  },

  renderSubBar() {
    const bar = document.getElementById('bgSubBar');
    if (!bar) return;
    if (this._currentCat === 'all') { bar.innerHTML = ''; return; }
    const cats = this.getCategories();
    const cat = cats[this._currentCat];
    if (!cat || !cat.subs) { bar.innerHTML = ''; return; }
    const allSub = `<button class="btn btn-sm ${this._currentSub === null ? 'btn-gold' : 'btn-secondary'}" style="font-size:12px;" onclick="BackgroundLibrary.filterSub(null)">全部子分类</button>`;
    const subs = cat.subs.map((s, i) =>
      `<button class="btn btn-sm ${this._currentSub === s ? 'btn-gold' : 'btn-secondary'}" style="font-size:12px;" onclick="BackgroundLibrary.filterSub('${s}')">${s}</button>`
    ).join('');
    bar.innerHTML = allSub + subs;
  },

  filterCat(id) { this._currentCat = id; this._currentSub = null; this.renderCatBar(); this.renderSubBar(); this.renderGrid(); this.updateRuntimeHint(); },
  filterSub(sub) { this._currentSub = sub; this.renderSubBar(); this.renderGrid(); this.updateRuntimeHint(); },

  updateRuntimeHint() {
    const hint = document.getElementById('runtimeCatHint');
    if (!hint) return;
    if (this._currentCat === 'all') hint.textContent = '所有分类';
    else {
      const cats = this.getCategories();
      const catName = cats[this._currentCat]?.name || this._currentCat;
      hint.textContent = this._currentSub ? `${catName} / ${this._currentSub}` : catName;
    }
  },

  getRuntimeCategory() {
    // Called by NovelRuntime to know which category to pick from
    return { cat: this._currentCat, sub: this._currentSub };
  },

  async renderGrid() {
    const grid = document.getElementById('bgGrid');
    if (!grid) return;
    const bgs = this.getBackgrounds();
    let filtered = bgs;
    if (this._currentCat !== 'all') {
      filtered = filtered.filter(b => b.category === this._currentCat);
      if (this._currentSub) filtered = filtered.filter(b => b.subcategory === this._currentSub);
    }
    if (filtered.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">🖼️</div><p>暂无背景</p><p style="font-size:12px;color:var(--text-muted);">${this._currentCat !== 'all' ? '当前分类下没有背景' : '点击上方"上传背景"添加'}</p></div>`;
      return;
    }
    grid.innerHTML = filtered.map(bg => `
      <div class="card" id="bgCard_${bg.id}">
        <div id="bgThumb_${bg.id}" style="width:100%;aspect-ratio:16/9;background:var(--bg-input);display:flex;align-items:center;justify-content:center;font-size:32px;">🖼️</div>
        <div class="card-body" style="padding:var(--space-sm) var(--space-md);">
          <h4 style="font-size:13px;" title="${bg.name}">${bg.name}</h4>
          <p style="font-size:11px;color:var(--text-muted);">${this.getCatLabel(bg.category)}${bg.subcategory ? ' / ' + bg.subcategory : ''}</p>
        </div>
        <div class="card-footer" style="padding:6px var(--space-md);display:flex;gap:4px;justify-content:flex-end;">
          <button class="btn btn-sm btn-secondary" onclick="BackgroundLibrary.viewBg('${bg.id}')">👁️</button>
          <button class="btn btn-sm btn-gold" onclick="BackgroundLibrary.setAsRuntime('${bg.id}')">▶️ 使用</button>
          <button class="btn btn-sm btn-danger" onclick="BackgroundLibrary.deleteBg('${bg.id}')">🗑️</button>
        </div>
      </div>
    `).join('');
    for (const bg of filtered) {
      const d = await Storage.getImage(bg.imageId);
      const el = document.getElementById(`bgThumb_${bg.id}`);
      if (el && d) el.innerHTML = `<img src="${d}" class="thumb">`;
    }
  },

  getCatLabel(catId) {
    const cats = this.getCategories();
    return cats[catId]?.name || catId;
  },

  openUploader() {
    const body = document.getElementById('bgUploadBody');
    const cats = this.getCategories();
    const catOptions = Object.entries(cats).map(([id, c]) => `<option value="${id}">${c.name}</option>`).join('');
    body.innerHTML = `
      <!-- 批量上传入口 -->
      <div style="display:flex;gap:8px;margin-bottom:var(--space-md);flex-wrap:wrap;">
        <button class="btn btn-sm btn-gold" onclick="BackgroundLibrary.switchUploadMode('single')">单张</button>
        <button class="btn btn-sm btn-secondary" onclick="BackgroundLibrary.switchUploadMode('album')">相册批量</button>
        <button class="btn btn-sm btn-secondary" onclick="BackgroundLibrary.switchUploadMode('url')">URL批量</button>
      </div>
      <div id="bgUploadModeArea">
        ${this._renderSingleUpload(catOptions)}
      </div>
    `;
    this._pending = null;
    this._batchPending = [];
    App.openModal('bgUploadModal');
  },

  switchUploadMode(mode) {
    const area = document.getElementById('bgUploadModeArea');
    const cats = this.getCategories();
    const catOptions = Object.entries(cats).map(([id, c]) => `<option value="${id}">${c.name}</option>`).join('');
    if (mode === 'single') {
      area.innerHTML = this._renderSingleUpload(catOptions);
    } else if (mode === 'album') {
      area.innerHTML = this._renderAlbumUpload(catOptions);
    } else if (mode === 'url') {
      area.innerHTML = this._renderUrlUpload(catOptions);
    }
  },

  _renderSingleUpload(catOptions) {
    return `
      <div class="upload-zone" id="bgDropZone" onclick="document.getElementById('bgFileInput').click()">
        <svg width="48" height="48" style="opacity:0.5;margin-bottom:8px;"><use href="#icon-bg"/></svg>
        <p>点击或拖拽上传</p><p style="font-size:12px;color:var(--text-muted);">支持 JPG/PNG/WebP</p>
        <input type="file" id="bgFileInput" accept="image/*" style="display:none;" onchange="BackgroundLibrary.handleFile(event)">
      </div>
      <div id="bgPreview" style="margin-top:var(--space-md);"></div>
      <div class="form-group" style="margin-top:var(--space-md);"><label>名称</label><input type="text" id="bgName" placeholder="如：长安街-黄昏"></div>
      <div class="form-group"><label>分类</label><select id="bgCategory" onchange="BackgroundLibrary.updateSubSelect()">${catOptions}</select></div>
      <div class="form-group"><label>子分类</label><select id="bgSubcategory"><option value="">-- 选择子分类 --</option></select></div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:var(--space-md);">
        <button class="btn btn-secondary" onclick="App.closeModal('bgUploadModal')">取消</button>
        <button class="btn btn-primary" onclick="BackgroundLibrary.saveUpload()">保存</button>
      </div>
    `;
  },

  _renderAlbumUpload(catOptions) {
    return `
      <div style="border:2px dashed var(--border-gold);border-radius:var(--border-radius);padding:var(--space-lg);text-align:center;margin-bottom:var(--space-md);">
        <svg width="48" height="48" style="opacity:0.5;margin-bottom:8px;"><use href="#icon-import"/></svg>
        <p>选择多张图片批量上传</p>
        <input type="file" id="bgBatchInput" accept="image/*" multiple style="display:none;" onchange="BackgroundLibrary.handleBatchFiles(event)">
        <button class="btn btn-primary" style="margin-top:8px;" onclick="document.getElementById('bgBatchInput').click()">选择相册</button>
      </div>
      <div id="bgBatchPreview" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:var(--space-md);max-height:240px;overflow-y:auto;"></div>
      <div class="form-group"><label>分类</label><select id="bgBatchCategory">${catOptions}</select></div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:var(--space-md);">
        <button class="btn btn-secondary" onclick="App.closeModal('bgUploadModal')">取消</button>
        <button class="btn btn-primary" onclick="BackgroundLibrary.saveBatchUpload()">保存全部 (${this._batchPending?.length || 0})</button>
      </div>
    `;
  },

  _renderUrlUpload(catOptions) {
    return `
      <div class="form-group"><label>图片URL（每行一个）</label><textarea id="bgUrlList" rows="6" placeholder="https://example.com/bg1.jpg\nhttps://example.com/bg2.jpg\n支持 http/https 直链"></textarea></div>
      <div class="form-group"><label>分类</label><select id="bgUrlCategory">${catOptions}</select></div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:var(--space-md);">
        <button class="btn btn-secondary" onclick="App.closeModal('bgUploadModal')">取消</button>
        <button class="btn btn-primary" onclick="BackgroundLibrary.saveUrlBatch()">开始下载</button>
      </div>
      <div id="bgUrlProgress" style="margin-top:8px;"></div>
    `;
  },

  async handleBatchFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    this._batchPending = [];
    const preview = document.getElementById('bgBatchPreview');
    let html = '';
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      try {
        const data = await Storage.fileToDataUrl(f);
        this._batchPending.push({ data, name: f.name, file: f });
        html += `<div style="position:relative;border-radius:var(--border-radius-sm);overflow:hidden;border:1px solid var(--border-color);">
          <img src="${data}" style="width:100%;height:80px;object-fit:cover;">
          <div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.6);color:#fff;font-size:10px;padding:2px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${f.name}</div>
        </div>`;
      } catch (err) { console.error(err); }
    }
    preview.innerHTML = html || '<p style="color:var(--text-muted);">无有效图片</p>';
    const btn = document.querySelector('[onclick*="saveBatchUpload"]');
    if (btn) btn.textContent = `保存全部 (${this._batchPending.length})`;
  },

  async saveBatchUpload() {
    if (!this._batchPending?.length) { App.toast('请先选择图片', 'error'); return; }
    const cat = document.getElementById('bgBatchCategory')?.value || '未分类';
    let success = 0;
    for (const item of this._batchPending) {
      try {
        const id = 'bg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        await Storage.saveImage(id, 'background', null, item.name, item.data, { category: cat });
        const bgs = this.getBackgrounds();
        bgs.push({ id, name: item.name.replace(/\.[^.]+$/, ''), category: cat, subcategory: '', addedAt: Date.now() });
        this.saveBackgrounds(bgs);
        success++;
      } catch (e) { console.error('Batch save error:', e); }
    }
    App.toast(`批量上传完成：${success}/${this._batchPending.length}`, success > 0 ? 'success' : 'error');
    this._batchPending = [];
    this.renderGrid();
    App.closeModal('bgUploadModal');
  },

  async saveUrlBatch() {
    const textarea = document.getElementById('bgUrlList');
    const urls = textarea.value.split('\n').map(u => u.trim()).filter(u => /^https?:\/\/.+/.test(u));
    if (!urls.length) { App.toast('请输入有效的图片URL', 'error'); return; }
    const cat = document.getElementById('bgUrlCategory')?.value || '未分类';
    const progress = document.getElementById('bgUrlProgress');
    progress.innerHTML = `<div class="progress-bar"><div class="progress-fill" style="width:0%"></div></div><p style="font-size:12px;color:var(--text-muted);margin-top:4px;">下载中 0/${urls.length}...</p>`;
    let success = 0;
    for (let i = 0; i < urls.length; i++) {
      try {
        const response = await fetch(urls[i], { mode: 'cors' });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const blob = await response.blob();
        if (!blob.type.startsWith('image/')) throw new Error('Not image');
        const ext = blob.type.split('/')[1] || 'jpg';
        const file = new File([blob], `url_bg_${i}.${ext}`, { type: blob.type });
        const data = await Storage.fileToDataUrl(file);
        const id = 'bg_url_' + Date.now() + '_' + i;
        await Storage.saveImage(id, 'background', null, file.name, data, { category: cat, sourceUrl: urls[i] });
        const bgs = this.getBackgrounds();
        bgs.push({ id, name: `URL_${i+1}`, category: cat, subcategory: '', addedAt: Date.now(), sourceUrl: urls[i] });
        this.saveBackgrounds(bgs);
        success++;
      } catch (e) { console.error(`URL ${i} failed:`, e); }
      const pct = Math.round(((i + 1) / urls.length) * 100);
      progress.innerHTML = `<div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div><p style="font-size:12px;color:var(--text-muted);margin-top:4px;">下载中 ${i+1}/${urls.length}... 成功 ${success} 个</p>`;
    }
    App.toast(`URL下载完成：${success}/${urls.length}`, success > 0 ? 'success' : 'error');
    this.renderGrid();
    if (success === urls.length) App.closeModal('bgUploadModal');
  },

  updateSubSelect() {
    const cat = document.getElementById('bgCategory')?.value;
    const sub = document.getElementById('bgSubcategory');
    if (!sub || !cat) return;
    const cats = this.getCategories();
    const subs = cats[cat]?.subs || [];
    sub.innerHTML = '<option value="">-- 选择子分类 --</option>' + subs.map(s => `<option value="${s}">${s}</option>`).join('');
  },

  async handleFile(e) {
    const file = e.target.files[0]; if (!file) return;
    const data = await Storage.fileToDataUrl(file);
    this._pending = { data, name: file.name };
    const n = document.getElementById('bgName'); if (n && !n.value) n.value = file.name.replace(/\.[^.]+$/, '');
    document.getElementById('bgPreview').innerHTML = `<img src="${data}" style="width:100%;border-radius:var(--border-radius-sm);">`;
  },

  async saveUpload() {
    if (!this._pending) { App.toast('请选择图片', 'error'); return; }
    const name = document.getElementById('bgName').value || '未命名';
    const cat = document.getElementById('bgCategory').value;
    const sub = document.getElementById('bgSubcategory').value || '';
    const id = 'bg_' + Date.now();
    await Storage.saveImage(id, 'background', null, this._pending.name, this._pending.data, { category: cat, subcategory: sub });
    const bgs = this.getBackgrounds();
    bgs.push({ id, imageId: id, name, category: cat, subcategory: sub, createdAt: Date.now() });
    this.saveBackgrounds(bgs);
    App.closeModal('bgUploadModal');
    this.renderGrid();
    App.toast('背景已上传', 'success');
  },

  setAsRuntime(bgId) {
    Storage.set('runtimeBgId', bgId);
    App.toast('已设为当前背景', 'success');
  },

  async viewBg(id) {
    const bg = this.getBackgrounds().find(b => b.id === id); if (!bg) return;
    const d = await Storage.getImage(bg.imageId); if (!d) return;
    const w = window.open(); w.document.write(`<title>${bg.name}</title><body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;"><img src="${d}" style="max-width:100%;max-height:100vh;"></body>`);
  },

  deleteBg(id) {
    const bg = this.getBackgrounds().find(b => b.id === id); if (!bg || !confirm(`删除「${bg.name}」？`)) return;
    Storage.deleteImage(bg.imageId);
    this.saveBackgrounds(this.getBackgrounds().filter(b => b.id !== id));
    this.renderGrid();
  },

  // ===== Category Manager =====
  openCategoryManager() {
    const body = document.getElementById('bgCatBody');
    const cats = this.getCategories();
    body.innerHTML = `
      <div style="margin-bottom:var(--space-md);">
        <button class="btn btn-sm btn-primary" onclick="BackgroundLibrary.addCategory()">➕ 添加分类</button>
      </div>
      <div id="catTree"></div>
    `;
    this.renderCatTree();
    App.openModal('bgCatModal');
  },

  renderCatTree() {
    const c = document.getElementById('catTree');
    const cats = this.getCategories();
    c.innerHTML = Object.entries(cats).map(([id, cat]) => `
      <div style="border:1px solid var(--border-color);border-radius:var(--border-radius);margin-bottom:var(--space-sm);padding:var(--space-md);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <h4 style="font-size:15px;color:var(--color-gold);">${cat.name}</h4>
          <button class="btn btn-sm btn-danger" onclick="BackgroundLibrary.delCategory('${id}')">删除</button>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
          ${cat.subs.map(s => `<span style="background:var(--bg-parchment);padding:2px 8px;border-radius:4px;font-size:12px;">${s} <button style="background:none;border:none;color:var(--color-danger);cursor:pointer;font-size:11px;" onclick="BackgroundLibrary.delSub('${id}','${s}')">×</button></span>`).join('')}
        </div>
        <div style="display:flex;gap:6px;">
          <input type="text" id="subInput_${id}" placeholder="新子分类名" style="flex:1;font-size:13px;">
          <button class="btn btn-sm btn-secondary" onclick="BackgroundLibrary.addSub('${id}')">添加</button>
        </div>
      </div>
    `).join('');
  },

  addCategory() {
    const name = prompt('分类名称：'); if (!name) return;
    const id = 'cat_' + Date.now();
    const cats = this.getCategories();
    cats[id] = { name, subs: [] };
    this.saveCategories(cats);
    this.renderCatTree(); this.renderCatBar(); this.renderSubBar();
  },

  delCategory(id) {
    if (!confirm('删除此分类？（分类下的背景将变为"其他"）')) return;
    const cats = this.getCategories();
    delete cats[id];
    this.saveCategories(cats);
    // Migrate backgrounds
    const bgs = this.getBackgrounds().map(b => b.category === id ? { ...b, category: 'other', subcategory: '' } : b);
    this.saveBackgrounds(bgs);
    this.renderCatTree(); this.renderCatBar(); this.renderSubBar(); this.renderGrid();
  },

  addSub(catId) {
    const input = document.getElementById('subInput_' + catId);
    const name = input?.value.trim(); if (!name) return;
    const cats = this.getCategories();
    if (!cats[catId].subs.includes(name)) cats[catId].subs.push(name);
    this.saveCategories(cats);
    input.value = '';
    this.renderCatTree(); this.renderSubBar();
  },

  delSub(catId, sub) {
    const cats = this.getCategories();
    cats[catId].subs = cats[catId].subs.filter(s => s !== sub);
    this.saveCategories(cats);
    this.renderCatTree(); this.renderSubBar(); this.renderGrid();
  }
};
