/**
 * =========================================================
 * SaveManager vv7 增强存档管理
 * 模块名：SaveManager
 * 功能：无限存档、存档备注、搜索过滤、分类管理、导入导出
 * 支持：手动存档 / 自动存档 / 章节存档
 * 数据存储：Storage.get('saves_v7') / Storage.set('saves_v7')
 * =========================================================
 */
const SaveManager = {
  /**
   * 存档分类定义
   */
  CATEGORIES: [
    { id: 'manual', name: '手动存档', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>', color: '#4A90C2', desc: '玩家手动保存的进度' },
    { id: 'auto', name: '自动存档', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>', color: '#6B8E23', desc: '系统自动保存的关键节点' },
    { id: 'chapter', name: '章节存档', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 01-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>', color: '#C9A227', desc: '章节完成时的自动存档' }
  ],

  /**
   * 每页显示数量
   */
  PAGE_SIZE: 12,

  _currentPage: 1,
  _filterCategory: 'all',
  _searchTerm: '',
  _sortBy: 'newest',

  /**
   * 初始化模块
   */
    // 初始化模块入口
  init() {
    // v7: 外部模块依赖检查
    if (typeof Storage === 'undefined') { console.warn('[v7] Storage模块未加载'); return; }
    // 初始化模块入口
    this.renderPage();
  },

  /**
   * 进入页面时刷新
   */
    // 页面进入时调用
  onEnter() {
    // 页面进入时调用
    this._currentPage = 1;
    this.renderSaveList();
    this.renderStats();
  },

  /**
   * 从Storage读取存档数据
   */
  _getData() {
    const defaultData = {
      saves: [],
      maxAutoSaves: 10,
      maxChapterSaves: 20,
      settings: { autoSave: true, autoSaveInterval: 300 }
    };
    return Storage.get('saves_v7', defaultData);
  },

  /**
   * 保存存档数据到Storage
   */
  _saveData(data) {
    try { Storage.set('saves_v7', data); } catch(e) { console.warn('[v7] Storage.set失败:', e); }
  },

  /**
   * 获取所有存档列表
   */
  getSaves() {
    return this._getData().saves || [];
  },

  /**
   * 创建新存档
   * @param {string} category - 存档分类：manual/auto/chapter
   * @param {string} note - 存档备注描述
   * @param {object} snapshot - 游戏状态快照（可选，默认收集当前状态）
   */
  createSave(category, note, snapshot) {
    const data = this._getData();
    const now = Date.now();

    // 限制自动存档和章节存档数量
    if (category === 'auto') {
      const autoSaves = data.saves.filter(s => s.category === 'auto');
      if (autoSaves.length >= (data.maxAutoSaves || 10)) {
        // 删除最旧的自动存档
        const oldest = autoSaves.sort((a, b) => a.createdAt - b.createdAt)[0];
        data.saves = data.saves.filter(s => s.id !== oldest.id);
      }
    }
    if (category === 'chapter') {
      const chapterSaves = data.saves.filter(s => s.category === 'chapter');
      if (chapterSaves.length >= (data.maxChapterSaves || 20)) {
        const oldest = chapterSaves.sort((a, b) => a.createdAt - b.createdAt)[0];
        data.saves = data.saves.filter(s => s.id !== oldest.id);
      }
    }

    // 收集当前游戏状态（如果没有提供snapshot）
    const gameSnapshot = snapshot || this._collectGameState();

    const save = {
      id: 'save_' + now + '_' + Math.random().toString(36).slice(2, 6),
      category: category || 'manual',
      note: note || this._generateDefaultNote(),
      snapshot: gameSnapshot,
      createdAt: now,
      playTime: gameSnapshot.playTime || 0,
      version: 'v6',
      // 元信息用于快速展示
      chapterTitle: gameSnapshot.chapterTitle || '',
      location: gameSnapshot.location || '',
      npcName: gameSnapshot.npcName || ''
    };

    data.saves.push(save);
    this._saveData(data);
    this.renderSaveList();
    this.renderStats();

    const catName = this.CATEGORIES.find(c => c.id === category)?.name || '存档';
    App.toast(`${catName} 已保存`, 'success');
    return save;
  },

  /**
   * 收集当前游戏状态（用于存档）
   * 这里收集关键数据，避免存档过大
   */
  _collectGameState() {
    const state = {
      // 时间线
      timeline: Storage.get('timeline_v7', {}),
      // 故事线进度
      storylines: Storage.get('storylines_v6', []),
      // 关系数据
      relations: Storage.get('relations_data', []),
      // 背包
      inventory: Storage.get('inventory_items', []),
      // 成就
      achievements: Storage.get('achievements_unlocked_v6', []),
      // 事件
      events: Storage.get('events_v7', {}),
      // 记忆
      memories: Storage.get('memories_v2', []),
      // 游戏时长估算
      playTime: Storage.get('game_playtime', 0),
      // 当前场景信息
      chapterTitle: '',
      location: '',
      npcName: ''
    };

    // 尝试获取当前运行状态
    try {
      const activeStory = (window.StorylineSystem && StorylineSystem.getActiveStory) ? StorylineSystem.getActiveStory() : null;
      if (activeStory) {
        state.chapterTitle = activeStory.title || '';
        const currentCh = activeStory.chapters?.find(c => !c.completed);
        if (currentCh) state.chapterTitle += ' - ' + currentCh.title;
      }
    } catch (e) { /* 忽略 */ }

    return state;
  },

  /**
   * 生成默认存档备注
   */
  _generateDefaultNote() {
    const timeline = Storage.get('timeline_v7', {});
    const now = new Date();
    const dateStr = now.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const gameTime = timeline.year ? `第${timeline.year}年${timeline.month || 1}月${timeline.day || 1}日` : '';
    return gameTime ? `${gameTime} · ${dateStr}` : dateStr;
  },

  /**
   * 加载存档
   */
  loadSave(saveId) {
    const data = this._getData();
    const save = data.saves.find(s => s.id === saveId);
    if (!save) {
      App.toast('存档不存在', 'error');
      return false;
    }

    const snapshot = save.snapshot;
    if (!snapshot) {
      App.toast('存档数据损坏', 'error');
      return false;
    }

    // 恢复各个系统数据
    if (snapshot.timeline) Storage.set('timeline_v7', snapshot.timeline);
    if (snapshot.storylines) Storage.set('storylines_v6', snapshot.storylines);
    if (snapshot.relations) Storage.set('relations_data', snapshot.relations);
    if (snapshot.inventory) Storage.set('inventory_items', snapshot.inventory);
    if (snapshot.achievements) Storage.set('achievements_unlocked_v6', snapshot.achievements);
    if (snapshot.events) Storage.set('events_v7', snapshot.events);
    if (snapshot.memories) Storage.set('memories_v2', snapshot.memories);

    App.toast(`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> 已加载存档：${save.note}`, 'success', 4000);

    // 通知其他模块刷新
    if (window.EventBridge) {
      EventBridge.emit('save', 'loaded', { saveId, note: save.note }, 'SaveManager');
    }

    return true;
  },

  /**
   * 删除存档
   */
  deleteSave(saveId) {
    if (!confirm('确定要删除此存档吗？此操作不可恢复。')) return;
    const data = this._getData();
    data.saves = data.saves.filter(s => s.id !== saveId);
    this._saveData(data);
    this.renderSaveList();
    this.renderStats();
    App.toast('存档已删除', 'info');
  },

  /**
   * 批量删除存档
   */
  deleteSavesByCategory(category) {
    if (!confirm(`确定要删除所有${this.CATEGORIES.find(c => c.id === category)?.name || ''}吗？`)) return;
    const data = this._getData();
    data.saves = data.saves.filter(s => s.category !== category);
    this._saveData(data);
    this.renderSaveList();
    this.renderStats();
    App.toast('批量删除完成', 'info');
  },

  /**
   * 导出单个存档为JSON文件
   */
  exportSave(saveId) {
    const data = this._getData();
    const save = data.saves.find(s => s.id === saveId);
    if (!save) {
      App.toast('存档不存在', 'error');
      return;
    }

    const exportData = {
      version: 'save_v1',
      exportedAt: new Date().toISOString(),
      save: save
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `墨境存档_${save.note.replace(/[^\w\u4e00-\u9fa5]/g, '_')}_${new Date(save.createdAt).toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    App.toast('存档已导出', 'success');
  },

  /**
   * 导入单个存档
   */
  importSave() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        if (!imported.save || !imported.save.id) {
          App.toast('无效的存档文件', 'error');
          return;
        }
        // 重新生成ID避免冲突
        imported.save.id = 'save_import_' + Date.now();
        imported.save.importedAt = Date.now();

        const data = this._getData();
        data.saves.push(imported.save);
        this._saveData(data);
        this.renderSaveList();
        this.renderStats();
        App.toast('存档导入成功', 'success');
      } catch (err) {
        App.toast('导入失败：' + err.message, 'error');
      }
    };
    input.click();
  },

  /**
   * 更新存档备注
   */
  updateNote(saveId, newNote) {
    const data = this._getData();
    const save = data.saves.find(s => s.id === saveId);
    if (!save) return;
    save.note = newNote || save.note;
    save.updatedAt = Date.now();
    this._saveData(data);
    this.renderSaveList();
    App.toast('备注已更新', 'success');
  },

  /**
   * 设置筛选条件
   */
  setFilter(category) {
    this._filterCategory = category;
    this._currentPage = 1;
    this.renderSaveList();
  },

  /**
   * 设置排序方式
   */
  setSort(sortBy) {
    this._sortBy = sortBy;
    this.renderSaveList();
  },

  /**
   * 搜索存档
   */
  search(term) {
    this._searchTerm = (term || '').toLowerCase();
    this._currentPage = 1;
    this.renderSaveList();
  },

  /**
   * 翻页
   */
  goPage(page) {
    this._currentPage = Math.max(1, page);
    this.renderSaveList();
  },

  /**
   * 渲染页面主结构
   */
    // 渲染页面主结构
  renderPage() {
    // 渲染页面主结构
    const page = document.getElementById('page-save-manager');
    if (!page) return;
    page.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
      <div style="padding:var(--space-lg);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:8px;">
          <h2 class="section-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> 存档管理</h2>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="SaveManager.showCreateModal('manual')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 手动存档</button>
            <button class="btn btn-secondary" onclick="SaveManager.createSave('auto', '自动存档')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg> 立即自动存档</button>
            <button class="btn btn-sm btn-secondary" onclick="SaveManager.importSave()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> 导入</button>
            <button class="btn btn-sm btn-secondary" onclick="SaveManager.showSettings()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.62 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg> 设置</button>
          </div>
        </div>

        <!-- 筛选与搜索 -->
        <div style="display:flex;gap:8px;margin-bottom:var(--space-md);flex-wrap:wrap;align-items:center;">
          <div style="display:flex;gap:4px;">
            <button class="btn btn-sm btn-secondary ${this._filterCategory === 'all' ? 'btn-primary' : ''}" onclick="SaveManager.setFilter('all')">全部</button>
            ${this.CATEGORIES.map(c => `
              <button class="btn btn-sm btn-secondary ${this._filterCategory === c.id ? 'btn-primary' : ''}" onclick="SaveManager.setFilter('${c.id}')">${c.icon} ${c.name}</button>
            `).join('')}
          </div>
          <select id="saveSort" onchange="SaveManager.setSort(this.value)" style="padding:4px 8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);font-size:13px;">
            <option value="newest">最新优先</option>
            <option value="oldest">最旧优先</option>
            <option value="playtime">游戏时长</option>
          </select>
          <input type="text" id="saveSearch" placeholder="搜索存档备注..." oninput="SaveManager.search(this.value)" style="padding:4px 8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);font-size:13px;flex:1;min-width:120px;">
          <button class="btn btn-sm btn-danger" onclick="SaveManager.deleteSavesByCategory('auto')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg> 清理自动</button>
        </div>

        <!-- 统计 -->
        <div id="saveStats" style="margin-bottom:var(--space-md);"></div>

        <!-- 存档列表 -->
        <div id="saveList"></div>

        <!-- 分页 -->
        <div id="savePagination" style="display:flex;justify-content:center;gap:6px;margin-top:var(--space-md);"></div>
      </div>
    `;
    this.renderSaveList();
    this.renderStats();
  },

  /**
   * 渲染统计信息
   */
  renderStats() {
    const container = document.getElementById('saveStats');
    if (!container) return;
    const saves = this.getSaves();
    const stats = {
      total: saves.length,
      manual: saves.filter(s => s.category === 'manual').length,
      auto: saves.filter(s => s.category === 'auto').length,
      chapter: saves.filter(s => s.category === 'chapter').length
    };
    container.innerHTML = `
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <div style="padding:8px 14px;background:var(--bg-sidebar);border-radius:8px;font-size:13px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg> 总计：<strong>${stats.total}</strong>
        </div>
        ${this.CATEGORIES.map(c => `
          <div style="padding:8px 14px;background:${c.color}11;border:1px solid ${c.color}33;border-radius:8px;font-size:13px;">
            ${c.icon} ${c.name}：<strong>${stats[c.id] || 0}</strong>
          </div>
        `).join('')}
      </div>
    `;
  },

  /**
   * 渲染存档列表
   */
  renderSaveList() {
    const container = document.getElementById('saveList');
    if (!container) return;
    let saves = this.getSaves();

    // 筛选分类
    if (this._filterCategory !== 'all') {
      saves = saves.filter(s => s.category === this._filterCategory);
    }

    // 搜索
    if (this._searchTerm) {
      saves = saves.filter(s => {
        const text = (s.note + (s.chapterTitle || '') + (s.location || '') + (s.npcName || '')).toLowerCase();
        return text.includes(this._searchTerm);
      });
    }

    // 排序
    saves = saves.slice().sort((a, b) => {
      if (this._sortBy === 'oldest') return a.createdAt - b.createdAt;
      if (this._sortBy === 'playtime') return (b.playTime || 0) - (a.playTime || 0);
      return b.createdAt - a.createdAt; // newest default
    });

    // 分页
    const total = saves.length;
    const totalPages = Math.max(1, Math.ceil(total / this.PAGE_SIZE));
    const start = (this._currentPage - 1) * this.PAGE_SIZE;
    const pageSaves = saves.slice(start, start + this.PAGE_SIZE);

    if (pageSaves.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div style="font-size:32px;margin-bottom:8px;">📂</div>
          <p>暂无存档</p>
          <p style="font-size:12px;color:var(--text-muted);">点击"手动存档"创建你的第一个存档</p>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:var(--space-sm);">
          ${pageSaves.map(s => {
            const cat = this.CATEGORIES.find(c => c.id === s.category) || this.CATEGORIES[0];
            const date = new Date(s.createdAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            const playTimeMin = Math.floor((s.playTime || 0) / 60);
            return `
              <div class="card" style="border-top:3px solid ${cat.color};position:relative;">
                <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-size:16px;">${cat.icon}</span>
                    <span style="font-size:12px;color:var(--text-muted);">${cat.name}</span>
                  </div>
                  <span style="font-size:11px;color:var(--text-muted);">${date}</span>
                </div>
                <div class="card-body">
                  <div style="font-size:14px;font-weight:600;margin-bottom:6px;word-break:break-all;">${s.note || '无备注'}</div>
                  <div style="font-size:12px;color:var(--text-muted);display:flex;flex-direction:column;gap:2px;">
                    ${s.chapterTitle ? `<span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 01-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg> ${s.chapterTitle}</span>` : ''}
                    ${s.location ? `<span>📍 ${s.location}</span>` : ''}
                    ${s.npcName ? `<span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${s.npcName}</span>` : ''}
                    <span>⏱️ 游戏时长：${playTimeMin} 分钟</span>
                  </div>
                  <div style="display:flex;gap:4px;margin-top:10px;flex-wrap:wrap;">
                    <button class="btn btn-sm btn-primary" style="flex:1;" onclick="SaveManager.loadSave('${s.id}')">📂 读取</button>
                    <button class="btn btn-sm btn-secondary" onclick="SaveManager.showEditModal('${s.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    <button class="btn btn-sm btn-secondary" onclick="SaveManager.exportSave('${s.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></button>
                    <button class="btn btn-sm btn-danger" onclick="SaveManager.deleteSave('${s.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // 渲染分页
    const pageContainer = document.getElementById('savePagination');
    if (pageContainer) {
      let pages = '';
      for (let i = 1; i <= totalPages; i++) {
        pages += `<button class="btn btn-sm ${i === this._currentPage ? 'btn-primary' : 'btn-secondary'}" onclick="SaveManager.goPage(${i})">${i}</button>`;
      }
      pageContainer.innerHTML = pages;
    }
  },

  /**
   * 显示创建存档的弹窗
   */
  showCreateModal(category) {
    const content = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <input type="text" id="saveNoteInput" placeholder="存档备注（可选，留空自动生成）" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <div style="font-size:12px;color:var(--text-muted);">
          分类：${this.CATEGORIES.find(c => c.id === category)?.name || '手动存档'}
        </div>
        <button class="btn btn-primary" onclick="SaveManager.confirmCreate('${category}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> 确认存档</button>
      </div>
    `;
    App.showModal('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> 创建存档', content);
  },

  confirmCreate(category) {
    const note = document.getElementById('saveNoteInput')?.value || '';
    this.createSave(category, note);
    App.closeModal();
  },

  /**
   * 显示编辑存档备注的弹窗
   */
  showEditModal(saveId) {
    const save = this.getSaves().find(s => s.id === saveId);
    if (!save) return;
    const content = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <input type="text" id="editNoteInput" value="${(save.note || '').replace(/"/g, '&quot;')}" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <button class="btn btn-primary" onclick="SaveManager.confirmEdit('${saveId}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> 保存备注</button>
      </div>
    `;
    App.showModal('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> 编辑备注', content);
  },

  confirmEdit(saveId) {
    const note = document.getElementById('editNoteInput')?.value || '';
    this.updateNote(saveId, note);
    App.closeModal();
  },

  /**
   * 显示设置弹窗
   */
  showSettings() {
    const data = this._getData();
    const content = `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label style="display:block;font-size:13px;margin-bottom:4px;">自动存档数量上限</label>
          <input type="number" id="maxAuto" value="${data.maxAutoSaves || 10}" min="3" max="50" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);width:100%;">
        </div>
        <div>
          <label style="display:block;font-size:13px;margin-bottom:4px;">章节存档数量上限</label>
          <input type="number" id="maxChapter" value="${data.maxChapterSaves || 20}" min="5" max="100" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);width:100%;">
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <input type="checkbox" id="autoSaveEnable" ${data.settings?.autoSave ? 'checked' : ''}>
          <label for="autoSaveEnable" style="font-size:13px;">启用自动存档</label>
        </div>
        <div>
          <label style="display:block;font-size:13px;margin-bottom:4px;">自动存档间隔（秒）</label>
          <input type="number" id="autoSaveInterval" value="${data.settings?.autoSaveInterval || 300}" min="60" max="3600" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);width:100%;">
        </div>
        <button class="btn btn-primary" onclick="SaveManager.saveSettings()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> 保存设置</button>
      </div>
    `;
    App.showModal('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.62 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg> 存档设置', content);
  },

  saveSettings() {
    const data = this._getData();
    data.maxAutoSaves = parseInt(document.getElementById('maxAuto')?.value) || 10;
    data.maxChapterSaves = parseInt(document.getElementById('maxChapter')?.value) || 20;
    data.settings = data.settings || {};
    data.settings.autoSave = document.getElementById('autoSaveEnable')?.checked || false;
    data.settings.autoSaveInterval = parseInt(document.getElementById('autoSaveInterval')?.value) || 300;
    this._saveData(data);
    App.closeModal();
    App.toast('设置已保存', 'success');
  }
};
