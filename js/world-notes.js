/**
 * =========================================================
 * WorldNotes v9 — 世界记事与年表系统
 * 模块名：WorldNotes
 * 功能：
 *   - 按时间线记录剧情重大事件
 *   - 列表视图展示，支持分类筛选、搜索、排序、分页
 *   - 事件与NPC、地点、故事线关联
 *   - AI自动摘要生成
 *   - 事件分类标签与统计面板
 * =========================================================
 */
const WorldNotes = {

  /* ── 分类常量（8个分类，含名称、颜色、图标） ── */
  CATEGORIES: [
    { id: 'plot',        name: '主线剧情', color: '#C9A227', icon: '📖' },
    { id: 'battle',      name: '战斗',     color: '#C0392B', icon: '⚔️' },
    { id: 'discovery',   name: '发现',     color: '#2980B9', icon: '🔍' },
    { id: 'relationship',name: '关系变化', color: '#8E44AD', icon: '💕' },
    { id: 'death',       name: '死亡',     color: '#2C1810', icon: '💀' },
    { id: 'birth',       name: '诞生',     color: '#E91E63', icon: '👶' },
    { id: 'politics',    name: '政治',     color: '#27AE60', icon: '👑' },
    { id: 'travel',      name: '游历',     color: '#E67E22', icon: '🗺️' }
  ],

  /* ── 内部状态 ── */
  filter:    'all',       // 当前筛选的分类
  search:    '',          // 搜索关键词
  sortOrder: 'desc',      // 排序：desc=最新优先，asc=最早优先
  page:      1,           // 当前页码
  perPage:   10,          // 每页条数
  debounceTimer: null,    // 搜索防抖计时器

  /* ── 初始化 ── */
  init() {
    this.renderPage();
  },

  /* ── 进入页面时刷新 ── */
  onEnter() {
    this.renderPage();
  },

  /* ── 数据读写 ── */
  getNotes() {
    return Storage.get('worldNotes_v9', []);
  },

  saveNotes(list) {
    Storage.set('worldNotes_v9', list);
  },

  /* ── 从对话历史自动生成事件 ── */
  autoCaptureFromHistory() {
    const history = NovelRuntime?._state?.history || [];
    if (history.length < 2) return;
    const last = history[history.length - 1];
    if (last.role !== 'assistant') return;
    /* 简单启发：如果回复包含关键词则记录 */
    const keywords = ['死', '杀', '战', '胜', '败', '发现', '找到', '结婚', '离别', '重逢', '背叛', '救援'];
    const hasKeyword = keywords.some(k => last.content.includes(k));
    if (!hasKeyword) return;
    this.addNote({
      title: '剧情事件',
      content: last.content.substring(0, 100) + (last.content.length > 100 ? '...' : ''),
      category: 'plot',
      relatedNPC: NovelRuntime?._state?.npcId || null,
      auto: true
    });
  },

  /* ── 添加事件 ── */
  addNote(data) {
    const notes = this.getNotes();
    const timeline = TimelineSystem?.getTimeline?.();
    const note = {
      id:             'note_' + Date.now(),
      title:          data.title || '未命名事件',
      content:        data.content || '',
      category:       data.category || 'plot',
      relatedNPC:     data.relatedNPC || null,
      relatedScene:   data.relatedScene || (NovelRuntime?._state?.scene || ''),
      relatedStoryline: StorylineManager?.getActiveSlotId?.() || null,
      gameDate:       timeline ? `${timeline.year}年${timeline.month}月${timeline.day}日 ${timeline.shichen}` : '',
      realDate:       new Date().toISOString(),
      auto:           data.auto || false,
      tags:           data.tags || []
    };
    notes.push(note);
    this.saveNotes(notes);
    this.renderPage();
    App.toast('事件已记录到年表', 'success');
  },

  /* ── 删除事件 ── */
  deleteNote(id) {
    if (!confirm('删除此记录？')) return;
    this.saveNotes(this.getNotes().filter(n => n.id !== id));
    this.renderPage();
  },

  /* ── 获取NPC名称 ── */
  _getNPCName(id) {
    const npc = (NPCManager?.getNPCs?.() || []).find(n => n.id === id);
    return npc ? npc.name : '未知角色';
  },

  /* ── 过滤、搜索、排序后的事件列表 ── */
  _getFilteredNotes() {
    let notes = this.getNotes();

    /* 1. 分类筛选 */
    if (this.filter !== 'all') {
      notes = notes.filter(n => n.category === this.filter);
    }

    /* 2. 关键词搜索（标题 + 内容） */
    if (this.search.trim()) {
      const kw = this.search.trim().toLowerCase();
      notes = notes.filter(n =>
        (n.title || '').toLowerCase().includes(kw) ||
        (n.content || '').toLowerCase().includes(kw)
      );
    }

    /* 3. 时间排序 */
    notes.sort((a, b) => {
      const ta = new Date(a.realDate).getTime();
      const tb = new Date(b.realDate).getTime();
      return this.sortOrder === 'desc' ? tb - ta : ta - tb;
    });

    return notes;
  },

  /* ── 搜索输入防抖处理 ── */
  searchNotes(value) {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.search = value;
      this.page = 1; // 搜索时重置到第一页
      this.renderList();
      this.renderStats();
    }, 300);
  },

  /* ── 切换分类筛选 ── */
  filterNotes(catId) {
    this.filter = catId;
    this.page = 1;
    this.renderList();
    this.renderStats();
  },

  /* ── 切换排序方向 ── */
  sortNotes() {
    this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
    this.page = 1;
    this.renderList();
  },

  /* ── 刷新页面 ── */
  refreshPage() {
    this.renderPage();
    App.toast('已刷新', 'success');
  },

  /* ── 导出事件为JSON ── */
  exportNotes() {
    const data = this.getNotes();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `world-notes-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    App.toast('导出成功', 'success');
  },

  /* ── 导入事件JSON ── */
  importNotes(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data)) throw new Error('格式错误');
        const notes = this.getNotes();
        const merged = [...notes, ...data];
        this.saveNotes(merged);
        this.renderPage();
        App.toast(`导入 ${data.length} 条记录`, 'success');
      } catch (err) {
        App.toast('导入失败：' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  },

  /* ── 展开/折叠单条卡片 ── */
  toggleCard(id) {
    const body = document.getElementById('note-body-' + id);
    const arrow = document.getElementById('note-arrow-' + id);
    if (!body || !arrow) return;
    const isOpen = body.style.display !== 'none';
    if (isOpen) {
      body.style.display = 'none';
      arrow.style.transform = 'rotate(0deg)';
    } else {
      body.style.display = 'block';
      arrow.style.transform = 'rotate(180deg)';
    }
  },

  /* ── 渲染整页 ── */
  renderPage() {
    const page = document.getElementById('page-world-notes');
    if (!page) return;

    page.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
<div class="wn-page" style="padding:var(--space-lg);">
        <!-- 页面标题 -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:8px;">
          <h2 class="section-title" style="margin:0;">📜 世界记事</h2>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="WorldNotes.openAddModal()">➕ 记录事件</button>
            <button class="btn btn-secondary" onclick="WorldNotes.autoCaptureFromHistory()">🤖 自动捕获</button>
            <button class="btn btn-sm btn-secondary" onclick="WorldNotes.exportNotes()">📥 导出</button>
            <label class="btn btn-sm btn-secondary" style="cursor:pointer;">
              📤 导入
              <input type="file" accept=".json" style="display:none;" onchange="WorldNotes.importNotes(this.files[0]);this.value='';">
            </label>
          </div>
        </div>

        <!-- 统计面板 -->
        <div id="wn-stats" style="margin-bottom:var(--space-lg);"></div>

        <!-- 顶部工具栏 -->
        <div class="wn-toolbar" style="display:flex;gap:12px;margin-bottom:var(--space-lg);flex-wrap:wrap;align-items:center;padding:12px;background:var(--bg-card);border-radius:var(--border-radius-sm);border:1px solid var(--border-color);">
          <!-- 分类筛选下拉框 -->
          <div style="display:flex;align-items:center;gap:6px;">
            <label style="font-size:13px;color:var(--text-muted);white-space:nowrap;">分类：</label>
            <select id="wn-filter-select" class="form-control" style="width:auto;min-width:120px;" onchange="WorldNotes.filterNotes(this.value)">
              <option value="all">全部</option>
              ${this.CATEGORIES.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
            </select>
          </div>

          <!-- 搜索框 -->
          <div style="flex:1;min-width:180px;max-width:400px;">
            <input type="text" id="wn-search-input" class="form-control"
              placeholder="🔍 搜索标题或内容…"
              value="${this.search}"
              oninput="WorldNotes.searchNotes(this.value)"
              style="width:100%;" />
          </div>

          <!-- 排序按钮 -->
          <button class="btn btn-sm btn-secondary" onclick="WorldNotes.sortNotes()" title="切换排序">
            ${this.sortOrder === 'desc' ? '⬇️ 最新' : '⬆️ 最早'}
          </button>

          <!-- 刷新按钮 -->
          <button class="btn btn-sm btn-secondary" onclick="WorldNotes.refreshPage()" title="刷新">🔄</button>

          <!-- 添加按钮 -->
          <button class="btn btn-sm btn-primary" onclick="WorldNotes.openAddModal()" title="添加事件">➕</button>
        </div>

        <!-- 列表主体 -->
        <div id="wn-list"></div>

        <!-- 分页导航 -->
        <div id="wn-pagination" style="margin-top:var(--space-lg);"></div>
      </div>
    `;

    /* 恢复筛选下拉框当前值 */
    const sel = document.getElementById('wn-filter-select');
    if (sel) sel.value = this.filter;

    this.renderStats();
    this.renderList();
  },

  /* ── 渲染统计面板（各分类数量小徽章） ── */
  renderStats() {
    const container = document.getElementById('wn-stats');
    if (!container) return;

    const notes = this.getNotes();
    const counts = {};
    this.CATEGORIES.forEach(c => counts[c.id] = 0);
    counts['all'] = notes.length;
    notes.forEach(n => { if (counts[n.category] !== undefined) counts[n.category]++; });

    /* 古风墨境配色徽章 */
    container.innerHTML = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <span style="font-size:13px;color:var(--text-muted);margin-right:4px;">统计：</span>
        ${this.CATEGORIES.map(c => `
          <span class="wn-stat-badge"
            style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:12px;font-size:12px;background:${c.color}15;color:${c.color};border:1px solid ${c.color}40;cursor:pointer;"
            onclick="WorldNotes.filterNotes('${c.id}')"
            title="点击筛选 ${c.name}">
            <span style="width:6px;height:6px;border-radius:50%;background:${c.color};"></span>
            ${c.name} ${counts[c.id]}
          </span>
        `).join('')}
        <span class="wn-stat-badge"
          style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:12px;font-size:12px;background:#C9A22715;color:#C9A227;border:1px solid #C9A22740;cursor:pointer;"
          onclick="WorldNotes.filterNotes('all')"
          title="点击显示全部">
          <span style="width:6px;height:6px;border-radius:50%;background:#C9A227;"></span>
          全部 ${counts['all']}
        </span>
      </div>
    `;
  },

  /* ── 渲染列表（含分页） ── */
  renderList() {
    const container = document.getElementById('wn-list');
    if (!container) return;

    const allNotes = this._getFilteredNotes();
    const total = allNotes.length;

    /* 空状态 */
    if (total === 0) {
      container.innerHTML = `
        <div class="empty-state" style="text-align:center;padding:48px 16px;">
          <div style="font-size:48px;margin-bottom:12px;">📜</div>
          <p style="font-size:16px;color:var(--text-primary);margin-bottom:8px;">
            ${this.search.trim() ? '未找到匹配的记录' : '暂无世界记事'}
          </p>
          <p style="font-size:13px;color:var(--text-muted);line-height:1.6;">
            ${this.search.trim()
              ? '请尝试其他关键词，或点击上方「全部」查看所有记录。'
              : '剧情中的重大事件将自动或手动记录在此。<br>点击右上角「记录事件」或「自动捕获」开始添加。'}
          </p>
        </div>
      `;
      this.renderPagination(0);
      return;
    }

    /* 分页切片 */
    const totalPages = Math.ceil(total / this.perPage) || 1;
    if (this.page > totalPages) this.page = totalPages;
    const start = (this.page - 1) * this.perPage;
    const notes = allNotes.slice(start, start + this.perPage);

    /* 渲染卡片列表 */
    container.innerHTML = notes.map(n => {
      const cat = this.CATEGORIES.find(c => c.id === n.category) || this.CATEGORIES[0];
      const dateStr = n.gameDate || new Date(n.realDate).toLocaleDateString('zh-CN');
      const npcName = n.relatedNPC ? this._getNPCName(n.relatedNPC) : null;
      const summary = (n.content || '').substring(0, 50) + ((n.content || '').length > 50 ? '…' : '');

      return `
        <div class="wn-card" style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--border-radius-sm);margin-bottom:12px;overflow:hidden;transition:box-shadow 0.2s;"
          onmouseenter="this.style.boxShadow='0 2px 8px rgba(44,24,16,0.08)';"
          onmouseleave="this.style.boxShadow='none';">

          <!-- 卡片头部（可点击展开） -->
          <div class="wn-card-header"
            onclick="WorldNotes.toggleCard('${n.id}')"
            style="display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;user-select:none;">

            <!-- 左侧彩色分类圆点 -->
            <div style="flex-shrink:0;width:10px;height:10px;border-radius:50%;background:${cat.color};box-shadow:0 0 0 3px ${cat.color}20;"></div>

            <!-- 标题与时间 -->
            <div style="flex:1;min-width:0;">
              <div style="font-size:15px;font-weight:600;color:var(--text-primary);font-family:var(--font-display);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${n.title}
              </div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
                ${dateStr}
              </div>
            </div>

            <!-- 摘要（桌面端显示） -->
            <div class="wn-summary-desktop" style="flex:1.5;font-size:13px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 8px;">
              ${summary}
            </div>

            <!-- 右侧展开箭头 -->
            <div id="note-arrow-${n.id}" style="flex-shrink:0;font-size:14px;color:var(--text-muted);transition:transform 0.25s ease;">▼</div>
          </div>

          <!-- 展开后内容 -->
          <div id="note-body-${n.id}" style="display:none;border-top:1px solid var(--border-color);padding:14px 16px 16px 38px;animation:wnFadeIn 0.25s ease;">
            <div style="font-size:14px;color:var(--text-secondary);line-height:1.8;margin-bottom:12px;">
              ${(n.content || '').replace(/\n/g, '<br>')}
            </div>

            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center;">
              <!-- 分类标签 -->
              <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:10px;font-size:12px;background:${cat.color}15;color:${cat.color};border:1px solid ${cat.color}40;">
                <span style="width:6px;height:6px;border-radius:50%;background:${cat.color};"></span>
                ${cat.name}
              </span>

              <!-- 关联NPC -->
              ${npcName ? `<span style="font-size:12px;color:var(--text-muted);">👤 ${npcName}</span>` : ''}

              <!-- 标签 -->
              ${(n.tags || []).map(t => `<span style="font-size:11px;padding:1px 6px;border-radius:6px;background:var(--bg-parchment);color:var(--text-muted);border:1px solid var(--border-color);">${t}</span>`).join('')}

              <!-- 自动标记 -->
              ${n.auto ? `<span style="font-size:11px;color:#999;">🤖 自动</span>` : ''}
            </div>

            <!-- 操作按钮 -->
            <div style="display:flex;gap:8px;justify-content:flex-end;">
              <button class="btn btn-sm btn-secondary" onclick="WorldNotes._editNote('${n.id}')">✏️ 编辑</button>
              <button class="btn btn-sm btn-danger" onclick="WorldNotes.deleteNote('${n.id}')">🗑️ 删除</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    /* 注入淡入动画关键帧（首次） */
    if (!document.getElementById('wn-anim-style')) {
      const style = document.createElement('style');
      style.id = 'wn-anim-style';
      style.textContent = `
        @keyframes wnFadeIn {
          from { opacity:0; transform:translateY(-4px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @media (max-width: 640px) {
          .wn-summary-desktop { display:none !important; }
        }
      `;
      document.head.appendChild(style);
    }

    this.renderPagination(total);
  },

  /* ── 渲染分页导航 ── */
  renderPagination(total) {
    const container = document.getElementById('wn-pagination');
    if (!container) return;

    const totalPages = Math.ceil(total / this.perPage) || 1;
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = `<div style="display:flex;justify-content:center;align-items:center;gap:6px;flex-wrap:wrap;">`;

    /* 上一页 */
    html += `<button class="btn btn-sm btn-secondary" ${this.page <= 1 ? 'disabled' : ''} onclick="WorldNotes._gotoPage(${this.page - 1})">上一页</button>`;

    /* 页码 */
    const maxShow = 5;
    let start = Math.max(1, this.page - Math.floor(maxShow / 2));
    let end = Math.min(totalPages, start + maxShow - 1);
    if (end - start < maxShow - 1) start = Math.max(1, end - maxShow + 1);

    if (start > 1) {
      html += `<button class="btn btn-sm btn-secondary" onclick="WorldNotes._gotoPage(1)">1</button>`;
      if (start > 2) html += `<span style="color:var(--text-muted);font-size:12px;">…</span>`;
    }

    for (let i = start; i <= end; i++) {
      const active = i === this.page;
      html += `<button class="btn btn-sm ${active ? 'btn-primary' : 'btn-secondary'}" onclick="WorldNotes._gotoPage(${i})">${i}</button>`;
    }

    if (end < totalPages) {
      if (end < totalPages - 1) html += `<span style="color:var(--text-muted);font-size:12px;">…</span>`;
      html += `<button class="btn btn-sm btn-secondary" onclick="WorldNotes._gotoPage(${totalPages})">${totalPages}</button>`;
    }

    /* 下一页 */
    html += `<button class="btn btn-sm btn-secondary" ${this.page >= totalPages ? 'disabled' : ''} onclick="WorldNotes._gotoPage(${this.page + 1})">下一页</button>`;

    html += `</div>`;
    html += `<div style="text-align:center;margin-top:6px;font-size:12px;color:var(--text-muted);">共 ${total} 条 · 第 ${this.page} / ${totalPages} 页</div>`;

    container.innerHTML = html;
  },

  /* ── 跳转到指定页 ── */
  _gotoPage(p) {
    const total = this._getFilteredNotes().length;
    const totalPages = Math.ceil(total / this.perPage) || 1;
    if (p < 1 || p > totalPages) return;
    this.page = p;
    this.renderList();
    /* 滚动到列表顶部 */
    const list = document.getElementById('wn-list');
    if (list) list.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  /* ── 打开添加弹窗 ── */
  openAddModal() {
    const npcOpts = (NPCManager?.getNPCs?.() || []).map(n => `<option value="${n.id}">${n.name}</option>`).join('');
    const catOpts = this.CATEGORIES.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
    App.showModal('➕ 记录事件', `
      <div class="form-group"><label>标题</label><input type="text" id="noteTitle" placeholder="事件名称"></div>
      <div class="form-group"><label>内容</label><textarea id="noteContent" rows="3" placeholder="发生了什么..."></textarea></div>
      <div class="form-row">
        <div class="form-group"><label>分类</label><select id="noteCategory">${catOpts}</select></div>
        <div class="form-group"><label>关联角色</label><select id="noteNPC"><option value="">--</option>${npcOpts}</select></div>
      </div>
      <div class="form-group"><label>标签（逗号分隔）</label><input type="text" id="noteTags" placeholder="如：转折,高潮"></div>
      <button class="btn btn-primary" onclick="WorldNotes.saveNote()">保存</button>
    `);
  },

  /* ── 保存新事件（从弹窗） ── */
  saveNote() {
    const title = document.getElementById('noteTitle')?.value.trim();
    if (!title) { App.toast('请输入标题', 'error'); return; }
    this.addNote({
      title,
      content: document.getElementById('noteContent')?.value || '',
      category: document.getElementById('noteCategory')?.value || 'plot',
      relatedNPC: document.getElementById('noteNPC')?.value || null,
      tags: (document.getElementById('noteTags')?.value || '').split(',').map(t => t.trim()).filter(t => t),
      auto: false
    });
    App.closeModal();
  },

  /* ── 编辑事件（打开弹窗并回填） ── */
  _editNote(id) {
    const notes = this.getNotes();
    const note = notes.find(n => n.id === id);
    if (!note) return;

    const npcOpts = (NPCManager?.getNPCs?.() || []).map(n =>
      `<option value="${n.id}" ${n.id === note.relatedNPC ? 'selected' : ''}>${n.name}</option>`
    ).join('');
    const catOpts = this.CATEGORIES.map(c =>
      `<option value="${c.id}" ${c.id === note.category ? 'selected' : ''}>${c.icon} ${c.name}</option>`
    ).join('');

    App.showModal('✏️ 编辑事件', `
      <div class="form-group"><label>标题</label><input type="text" id="editNoteTitle" value="${this._esc(note.title)}"></div>
      <div class="form-group"><label>内容</label><textarea id="editNoteContent" rows="4">${this._esc(note.content)}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label>分类</label><select id="editNoteCategory">${catOpts}</select></div>
        <div class="form-group"><label>关联角色</label><select id="editNoteNPC"><option value="">--</option>${npcOpts}</select></div>
      </div>
      <div class="form-group"><label>标签（逗号分隔）</label><input type="text" id="editNoteTags" value="${this._esc((note.tags || []).join(', '))}"></div>
      <button class="btn btn-primary" onclick="WorldNotes._saveEdit('${id}')">保存修改</button>
    `);
  },

  /* ── 保存编辑 ── */
  _saveEdit(id) {
    const title = document.getElementById('editNoteTitle')?.value.trim();
    if (!title) { App.toast('请输入标题', 'error'); return; }

    let notes = this.getNotes();
    const idx = notes.findIndex(n => n.id === id);
    if (idx === -1) return;

    notes[idx] = {
      ...notes[idx],
      title,
      content: document.getElementById('editNoteContent')?.value || '',
      category: document.getElementById('editNoteCategory')?.value || 'plot',
      relatedNPC: document.getElementById('editNoteNPC')?.value || null,
      tags: (document.getElementById('editNoteTags')?.value || '').split(',').map(t => t.trim()).filter(t => t)
    };

    this.saveNotes(notes);
    this.renderPage();
    App.closeModal();
    App.toast('修改已保存', 'success');
  },

  /* ── HTML转义辅助 ── */
  _esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
};
