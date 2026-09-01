/**
 * =========================================================
 * QuestSystem - 任务/委托系统 v1.0
 * 古风墨境风格 · 古风墨境配色
 * 零预设 · 全用户自定义 · AI辅助 · 模板支持
 * =========================================================
 */

const QuestSystem = {
  // === 存储键 ===
  storageKey: 'quest_system_v12',

  // === 内部状态 ===
  data: {
    tasks: [],         // 任务列表
    categories: [],    // 分类列表（完全自定义）
    templates: [],     // 任务模板
    filter: {          // 当前筛选
      category: 'all',
      status: 'all',
      search: ''
    },
    selectedTaskId: null,
    viewMode: 'board'  // board | detail
  },

  // =========================================================
  // 初始化
  // =========================================================

  /**
   * 初始化任务系统
   * 从本地存储加载数据，若首次使用则初始化空数据结构
   */
    // 初始化模块入口
  init() {
    // v7: 外部模块依赖检查
    if (typeof Storage === 'undefined') { console.warn('[v7] Storage模块未加载'); return; }
    // 初始化模块入口
    this.loadData();
    this.bindGlobalEvents();
    console.log('[QuestSystem] 任务系统已初始化');
  },

  /**
   * 进入任务页面时调用
   * 渲染任务板主界面
   */
    // 页面进入时调用
  onEnter() {
    // 页面进入时调用
    this.renderPage();
  },

  // =========================================================
  // 数据持久化
  // =========================================================

  /**
   * 从 localStorage 加载数据
   */
  loadData() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.data.tasks = parsed.tasks || [];
        this.data.categories = parsed.categories || [];
        this.data.templates = parsed.templates || [];
      } else {
        // 首次使用：全部为空
        this.data.tasks = [];
        this.data.categories = [];
        this.data.templates = [];
      }
    } catch (e) {
      console.error('[QuestSystem] 加载数据失败:', e);
      this.data.tasks = [];
      this.data.categories = [];
      this.data.templates = [];
    }
  },

  /**
   * 保存数据到 localStorage
   */
  saveData() {
    try {
      const payload = {
        tasks: this.data.tasks,
        categories: this.data.categories,
        templates: this.data.templates,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
    } catch (e) {
      console.error('[QuestSystem] 保存数据失败:', e);
    }
  },

  // =========================================================
  // 页面渲染
  // =========================================================

  /**
   * 渲染任务系统主页面
   * 包含：顶部工具栏、分类筛选、任务板、统计面板
   */
    // 渲染页面主结构
  renderPage() {
    // 渲染页面主结构
    const page = document.getElementById('quest-system-page');
    if (!page) return;

    page.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
      <div class="quest-system-container">
        <!-- 顶部工具栏 -->
        <div class="quest-toolbar">
          <div class="quest-toolbar-left">
            <h2 class="section-title">任务委托</h2>
          </div>
          <div class="quest-toolbar-right">
            <div class="quest-search">
              <input type="text" id="quest-search-input" placeholder="搜索任务..." 
                value="${this.escapeHtml(this.data.filter.search)}">
              <span class="search-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
            </div>
            <button class="btn btn-gold btn-sm" onclick="QuestSystem.openCreateModal()">
              <span>+</span> 新建任务
            </button>
            <button class="btn btn-secondary btn-sm" onclick="QuestSystem.openCategoryModal()">
              <span>⚙</span> 分类管理
            </button>
          </div>
        </div>

        <!-- 分类筛选标签 -->
        <div class="quest-category-tabs" id="quest-category-tabs">
          ${this.renderCategoryTabs()}
        </div>

        <!-- 主体区域：任务列表 + 统计面板 -->
        <div class="quest-main">
          <div class="quest-board" id="quest-board">
            ${this.renderTaskList()}
          </div>
          <div class="quest-sidebar" id="quest-sidebar">
            ${this.renderStatsPanel()}
          </div>
        </div>
      </div>

      <!-- 任务详情/编辑 模态框 -->
      <div class="modal-overlay" id="quest-modal-overlay" onclick="QuestSystem.closeModal(event)">
        <div class="modal lg" id="quest-modal" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3 id="quest-modal-title">任务详情</h3>
            <button class="btn-icon" onclick="QuestSystem.closeModal()">✕</button>
          </div>
          <div class="modal-body" id="quest-modal-body"></div>
          <div class="modal-footer" id="quest-modal-footer"></div>
        </div>
      </div>

      <!-- 新建/编辑任务 模态框 -->
      <div class="modal-overlay" id="quest-form-overlay" onclick="QuestSystem.closeFormModal(event)">
        <div class="modal lg" id="quest-form-modal" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3 id="quest-form-title">新建任务</h3>
            <button class="btn-icon" onclick="QuestSystem.closeFormModal()">✕</button>
          </div>
          <div class="modal-body" id="quest-form-body"></div>
          <div class="modal-footer" id="quest-form-footer"></div>
        </div>
      </div>

      <!-- 分类管理 模态框 -->
      <div class="modal-overlay" id="quest-category-overlay" onclick="QuestSystem.closeCategoryModal(event)">
        <div class="modal" id="quest-category-modal" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>分类管理</h3>
            <button class="btn-icon" onclick="QuestSystem.closeCategoryModal()">✕</button>
          </div>
          <div class="modal-body" id="quest-category-body"></div>
          <div class="modal-footer" id="quest-category-footer"></div>
        </div>
      </div>

      <!-- 模板管理 模态框 -->
      <div class="modal-overlay" id="quest-template-overlay" onclick="QuestSystem.closeTemplateModal(event)">
        <div class="modal lg" id="quest-template-modal" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>任务模板</h3>
            <button class="btn-icon" onclick="QuestSystem.closeTemplateModal()">✕</button>
          </div>
          <div class="modal-body" id="quest-template-body"></div>
          <div class="modal-footer" id="quest-template-footer"></div>
        </div>
      </div>

      <!-- AI建议 模态框 -->
      <div class="modal-overlay" id="quest-ai-overlay" onclick="QuestSystem.closeAiModal(event)">
        <div class="modal lg" id="quest-ai-modal" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>🌟 AI 任务建议</h3>
            <button class="btn-icon" onclick="QuestSystem.closeAiModal()">✕</button>
          </div>
          <div class="modal-body" id="quest-ai-body"></div>
          <div class="modal-footer" id="quest-ai-footer"></div>
        </div>
      </div>

      <!-- 完成动画层 -->
      <div id="quest-completion-fx" class="quest-completion-fx"></div>
    `;

    this.bindPageEvents();
    this.updateCategoryTabs();
  },

  /**
   * 渲染分类筛选标签栏
   */
  renderCategoryTabs() {
    const cats = this.data.categories;
    let html = `
      <button class="quest-tab ${this.data.filter.category === 'all' ? 'active' : ''}" 
        data-cat="all" onclick="QuestSystem.setCategoryFilter('all')">全部</button>
    `;
    cats.forEach(cat => {
      const color = cat.color || '#8B4513';
      html += `
        <button class="quest-tab ${this.data.filter.category === cat.name ? 'active' : ''}" 
          data-cat="${this.escapeHtml(cat.name)}" 
          onclick="QuestSystem.setCategoryFilter('${this.escapeHtml(cat.name)}')"
          style="--cat-color: ${this.escapeHtml(color)}">
          <span class="cat-dot" style="background:${this.escapeHtml(color)}"></span>
          ${this.escapeHtml(cat.name)}
        </button>
      `;
    });
    return html;
  },

  /**
   * 渲染任务卡片列表
   */
  renderTaskList() {
    const filtered = this.getFilteredTasks();

    if (filtered.length === 0) {
      return `
        <div class="quest-empty-state">
          <div class="empty-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>
          <h3>暂无任务</h3>
          <p>点击上方「新建任务」按钮，创建你的第一个任务</p>
          <button class="btn btn-gold" onclick="QuestSystem.openCreateModal()">
            <span>+</span> 新建任务
          </button>
          <div style="margin-top: 16px;">
            <button class="btn btn-secondary btn-sm" onclick="QuestSystem.openAiSuggestModal()">
              🤖 AI生成任务
            </button>
          </div>
        </div>
      `;
    }

    let html = '<div class="quest-grid">';
    filtered.forEach(task => {
      html += this.renderTaskCard(task);
    });
    html += '</div>';
    return html;
  },

  /**
   * 渲染单个任务卡片
   * @param {Object} task - 任务对象
   */
  renderTaskCard(task) {
    const cat = this.getCategoryByName(task.category);
    const catColor = cat ? cat.color : '#8B4513';
    const statusConfig = this.getStatusConfig(task.status);
    const deadlineStr = this.formatDeadline(task.deadline);
    const countdown = this.calcCountdown(task.deadline);

    // 关联NPC头像（最多显示3个）
    let npcHtml = '';
    if (task.relatedNpcIds && task.relatedNpcIds.length > 0) {
      npcHtml = '<div class="task-npcs">';
      task.relatedNpcIds.slice(0, 3).forEach(npcId => {
        // 从全局NPC系统获取头像（如果存在）
        const npc = this.getNpcById(npcId);
        if (npc) {
          npcHtml += `<img src="${this.escapeHtml(npc.avatar || '')}" alt="${this.escapeHtml(npc.name || '')}" 
            class="task-npc-avatar" title="${this.escapeHtml(npc.name || '')}" 
            onerror="this.style.display='none'">`;
        } else {
          npcHtml += `<div class="task-npc-avatar task-npc-placeholder" title="NPC #${npcId}">?</div>`;
        }
      });
      if (task.relatedNpcIds.length > 3) {
        npcHtml += `<div class="task-npc-more">+${task.relatedNpcIds.length - 3}</div>`;
      }
      npcHtml += '</div>';
    }

    return `
      <div class="quest-card" data-id="${task.id}" onclick="QuestSystem.openDetailModal('${task.id}')">
        <div class="quest-card-header">
          <span class="quest-card-category" style="background:${this.escapeHtml(catColor)}20; color:${this.escapeHtml(catColor)}; border-color:${this.escapeHtml(catColor)}40;">
            ${this.escapeHtml(task.category)}
          </span>
          <span class="quest-card-status ${this.escapeHtml(task.status)}">${statusConfig.label}</span>
        </div>
        <div class="quest-card-body">
          <h4 class="quest-card-title">${this.escapeHtml(task.title)}</h4>
          <p class="quest-card-desc">${this.escapeHtml(task.description || '').substring(0, 60)}${(task.description || '').length > 60 ? '...' : ''}</p>
        </div>
        <div class="quest-card-footer">
          <div class="quest-card-meta">
            ${task.deadline ? `<span class="quest-deadline ${countdown.urgent ? 'urgent' : ''}">⏳ ${deadlineStr}</span>` : ''}
            ${task.reward ? `<span class="quest-reward"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/></svg> ${this.escapeHtml(task.reward)}</span>` : ''}
          </div>
          ${npcHtml}
        </div>
      </div>
    `;
  },

  /**
   * 渲染任务详情面板（模态框内）
   * @param {string} taskId - 任务ID
   */
  renderTaskDetail(taskId) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task) return '<p>任务不存在</p>';

    const cat = this.getCategoryByName(task.category);
    const catColor = cat ? cat.color : '#8B4513';
    const statusConfig = this.getStatusConfig(task.status);

    // 状态流转按钮
    let actionButtons = '';
    if (task.status === 'pending') {
      actionButtons += `<button class="btn btn-primary" onclick="QuestSystem.updateStatus('${task.id}', 'active')">🚀 接取任务</button>`;
      actionButtons += `<button class="btn btn-danger" onclick="QuestSystem.updateStatus('${task.id}', 'failed')">✕ 标记失败</button>`;
    } else if (task.status === 'active') {
      actionButtons += `<button class="btn btn-gold" onclick="QuestSystem.updateStatus('${task.id}', 'completed')">✓ 完成任务</button>`;
      actionButtons += `<button class="btn btn-danger" onclick="QuestSystem.updateStatus('${task.id}', 'failed')">✕ 任务失败</button>`;
    } else {
      actionButtons += `<button class="btn btn-secondary" onclick="QuestSystem.updateStatus('${task.id}', 'pending')">↺ 重置为未接</button>`;
    }

    // 关联NPC详情
    let npcDetailHtml = '';
    if (task.relatedNpcIds && task.relatedNpcIds.length > 0) {
      npcDetailHtml = '<div class="detail-section"><h5>🧑 关联角色</h5><div class="detail-npc-list">';
      task.relatedNpcIds.forEach(npcId => {
        const npc = this.getNpcById(npcId);
        if (npc) {
          npcDetailHtml += `
            <div class="detail-npc-item" onclick="QuestSystem.jumpToNpc('${npcId}')">
              <img src="${this.escapeHtml(npc.avatar || '')}" alt="${this.escapeHtml(npc.name || '')}" 
                class="detail-npc-avatar" onerror="this.style.display='none'">
              <span>${this.escapeHtml(npc.name || '未知角色')}</span>
            </div>`;
        } else {
          npcDetailHtml += `<div class="detail-npc-item">NPC #${npcId}</div>`;
        }
      });
      npcDetailHtml += '</div></div>';
    }

    // 关联地点详情
    let locDetailHtml = '';
    if (task.relatedLocationIds && task.relatedLocationIds.length > 0) {
      locDetailHtml = '<div class="detail-section"><h5>📍 关联地点</h5><div class="detail-loc-list">';
      task.relatedLocationIds.forEach(locId => {
        const loc = this.getLocationById(locId);
        if (loc) {
          locDetailHtml += `
            <div class="detail-loc-item" onclick="QuestSystem.jumpToLocation('${locId}')">
              <span class="loc-icon">📍</span>
              <span>${this.escapeHtml(loc.name || '未知地点')}</span>
            </div>`;
        } else {
          locDetailHtml += `<div class="detail-loc-item">地点 #${locId}</div>`;
        }
      });
      locDetailHtml += '</div></div>';
    }

    // 操作历史
    let historyHtml = '';
    if (task.history && task.history.length > 0) {
      historyHtml = '<div class="detail-section"><h5>📋 操作历史</h5><ul class="detail-history">';
      [...task.history].reverse().forEach(h => {
        historyHtml += `<li><span class="history-time">${this.formatDate(h.time)}</span> ${this.escapeHtml(h.action)}</li>`;
      });
      historyHtml += '</ul></div>';
    }

    return `
      <div class="quest-detail">
        <div class="detail-header">
          <span class="detail-category" style="background:${this.escapeHtml(catColor)}20; color:${this.escapeHtml(catColor)};">
            ${this.escapeHtml(task.category)}
          </span>
          <span class="detail-status ${this.escapeHtml(task.status)}">${statusConfig.label}</span>
        </div>

        <h2 class="detail-title">${this.escapeHtml(task.title)}</h2>

        <div class="detail-meta-bar">
          ${task.deadline ? `<span>⏳ 期限：${this.formatDeadline(task.deadline)} (${this.calcCountdown(task.deadline).text})</span>` : ''}
          ${task.reward ? `<span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/></svg> 奖励：${this.escapeHtml(task.reward)}</span>` : ''}
          <span>🕐 创建：${this.formatDate(task.createdAt)}</span>
          ${task.completedAt ? `<span>✓ 完成：${this.formatDate(task.completedAt)}</span>` : ''}
        </div>

        <div class="detail-section">
          <h5>📝 任务描述</h5>
          <div class="detail-description">${this.nl2br(this.escapeHtml(task.description || '暂无描述'))}</div>
        </div>

        ${npcDetailHtml}
        ${locDetailHtml}
        ${historyHtml}
      </div>
    `;
  },

  /**
   * 渲染右侧统计面板
   */
  renderStatsPanel() {
    const stats = this.calcStats();
    const total = this.data.tasks.length;
    const completed = this.data.tasks.filter(t => t.status === 'completed').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    let catStatsHtml = '';
    this.data.categories.forEach(cat => {
      const catTasks = this.data.tasks.filter(t => t.category === cat.name);
      const catTotal = catTasks.length;
      const catCompleted = catTasks.filter(t => t.status === 'completed').length;
      const catRate = catTotal > 0 ? Math.round((catCompleted / catTotal) * 100) : 0;
      catStatsHtml += `
        <div class="stat-cat-row">
          <span class="stat-cat-name"><span class="cat-dot" style="background:${this.escapeHtml(cat.color || '#8B4513')}"></span>${this.escapeHtml(cat.name)}</span>
          <span class="stat-cat-count">${catCompleted}/${catTotal}</span>
          <div class="stat-mini-bar"><div class="stat-mini-fill" style="width:${catRate}%; background:${this.escapeHtml(cat.color || '#8B4513')}"></div></div>
        </div>
      `;
    });

    return `
      <div class="quest-stats-card">
        <h4><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg> 任务统计</h4>
        <div class="stat-overview">
          <div class="stat-circle">
            <svg viewBox="0 0 36 36">
              <path class="stat-circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path class="stat-circle-fill" stroke-dasharray="${completionRate}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div class="stat-circle-text">${completionRate}%</div>
          </div>
          <div class="stat-numbers">
            <div class="stat-item"><span class="stat-num">${total}</span><span class="stat-label">总计</span></div>
            <div class="stat-item"><span class="stat-num">${completed}</span><span class="stat-label">已完成</span></div>
            <div class="stat-item"><span class="stat-num">${stats.active}</span><span class="stat-label">进行中</span></div>
            <div class="stat-item"><span class="stat-num">${stats.failed}</span><span class="stat-label">已失败</span></div>
          </div>
        </div>

        <div class="stat-categories">
          <h5>分类详情</h5>
          ${catStatsHtml || '<p style="color:var(--text-muted); font-size:12px;">暂无分类，请先创建分类</p>'}
        </div>

        <div class="stat-actions">
          <button class="btn btn-gold btn-sm" style="width:100%;" onclick="QuestSystem.openAiSuggestModal()">
            🤖 AI生成任务
          </button>
          <button class="btn btn-secondary btn-sm" style="width:100%; margin-top:8px;" onclick="QuestSystem.openTemplateModal()">
            📋 任务模板
          </button>
        </div>
      </div>
    `;
  },

  // =========================================================
  // 任务 CRUD
  // =========================================================

  /**
   * 创建新任务
   * @param {Object} taskData - 任务数据对象
   * @returns {Object} 创建的任务对象
   */
  createTask(taskData) {
    const now = new Date().toISOString();
    const newTask = {
      id: 'quest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      title: taskData.title || '未命名任务',
      description: taskData.description || '',
      category: taskData.category || (this.data.categories[0] ? this.data.categories[0].name : '未分类'),
      status: taskData.status || 'pending',
      reward: taskData.reward || '',
      deadline: taskData.deadline || null,
      relatedNpcIds: taskData.relatedNpcIds || [],
      relatedLocationIds: taskData.relatedLocationIds || [],
      steps: taskData.steps || [],
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      history: [{ time: now, action: '创建任务' }]
    };

    this.data.tasks.push(newTask);
    this.saveData();
    this.renderPage();
    this.showToast('任务已创建', 'success');
    return newTask;
  },

  /**
   * 编辑任务
   * @param {string} taskId - 任务ID
   * @param {Object} updates - 更新的字段
   */
  editTask(taskId, updates) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task) {
      this.showToast('任务不存在', 'error');
      return null;
    }

    const now = new Date().toISOString();
    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'createdAt' && key !== 'history') {
        task[key] = updates[key];
      }
    });
    task.updatedAt = now;
    task.history.push({ time: now, action: '编辑任务信息' });

    this.saveData();
    this.renderPage();
    this.showToast('任务已更新', 'success');
    return task;
  },

  /**
   * 删除任务
   * @param {string} taskId - 任务ID
   */
  deleteTask(taskId) {
    if (!confirm('确定要删除此任务吗？此操作不可撤销。')) return;

    const idx = this.data.tasks.findIndex(t => t.id === taskId);
    if (idx === -1) {
      this.showToast('任务不存在', 'error');
      return;
    }

    this.data.tasks.splice(idx, 1);
    this.saveData();
    this.closeModal();
    this.renderPage();
    this.showToast('任务已删除', 'info');
  },

  /**
   * 更新任务状态
   * @param {string} taskId - 任务ID
   * @param {string} newStatus - 新状态：pending/active/completed/failed
   */
  updateStatus(taskId, newStatus) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task) {
      this.showToast('任务不存在', 'error');
      return;
    }

    const validStatuses = ['pending', 'active', 'completed', 'failed'];
    if (!validStatuses.includes(newStatus)) {
      this.showToast('无效的状态值', 'error');
      return;
    }

    const now = new Date().toISOString();
    const statusLabels = { pending: '未接', active: '进行中', completed: '已完成', failed: '失败' };

    task.status = newStatus;
    task.updatedAt = now;

    if (newStatus === 'completed') {
      task.completedAt = now;
      task.history.push({ time: now, action: `任务完成` });
      this.playCompletionFx();
      this.showToast(`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2 7h7l-5.5 4 2 7-5.5-4-5.5 4 2-7L3 9h7z"/></svg> 「${task.title}」已完成！`, 'success');
    } else if (newStatus === 'failed') {
      task.history.push({ time: now, action: `任务失败` });
      this.showToast(`「${task.title}」已标记为失败`, 'error');
    } else {
      task.history.push({ time: now, action: `状态变更为「${statusLabels[newStatus]}」` });
      this.showToast(`任务状态已更新`, 'info');
    }

    this.saveData();
    this.renderPage();

    // 如果详情模态框开着，刷新内容
    const modalBody = document.getElementById('quest-modal-body');
    if (modalBody && document.getElementById('quest-modal-overlay').classList.contains('show')) {
      modalBody.innerHTML = this.renderTaskDetail(taskId);
      this.updateModalFooter(taskId);
    }
  },

  /**
   * 获取任务列表（支持筛选）
   * @param {Object} filter - 筛选条件 {category, status, search}
   * @returns {Array} 符合条件的任务数组
   */
  getTasks(filter = {}) {
    let result = [...this.data.tasks];

    if (filter.category && filter.category !== 'all') {
      result = result.filter(t => t.category === filter.category);
    }
    if (filter.status && filter.status !== 'all') {
      result = result.filter(t => t.status === filter.status);
    }
    if (filter.search) {
      const kw = filter.search.toLowerCase();
      result = result.filter(t =>
        (t.title && t.title.toLowerCase().includes(kw)) ||
        (t.description && t.description.toLowerCase().includes(kw))
      );
    }

    return result;
  },

  // =========================================================
  // 分类管理
  // =========================================================

  /**
   * 创建新分类
   * @param {string} name - 分类名称
   * @param {string} color - 分类颜色（可选，默认随机古风色）
   */
  createCategory(name, color) {
    if (!name || name.trim() === '') {
      this.showToast('分类名称不能为空', 'error');
      return null;
    }

    if (this.data.categories.some(c => c.name === name.trim())) {
      this.showToast('分类名称已存在', 'error');
      return null;
    }

    const newCat = {
      name: name.trim(),
      color: color || this.randomInkColor()
    };

    this.data.categories.push(newCat);
    this.saveData();
    this.renderPage();
    this.showToast(`分类「${newCat.name}」已创建`, 'success');
    return newCat;
  },

  /**
   * 删除分类
   * @param {string} name - 分类名称
   */
  deleteCategory(name) {
    const cat = this.data.categories.find(c => c.name === name);
    if (!cat) {
      this.showToast('分类不存在', 'error');
      return;
    }

    const tasksInCat = this.data.tasks.filter(t => t.category === name);
    if (tasksInCat.length > 0) {
      if (!confirm(`该分类下还有 ${tasksInCat.length} 个任务，删除后这些任务将变为「未分类」。确定删除吗？`)) {
        return;
      }
      // 将该分类下的任务改为默认分类或"未分类"
      this.data.tasks.forEach(t => {
        if (t.category === name) {
          t.category = this.data.categories[0] ? this.data.categories[0].name : '未分类';
          t.updatedAt = new Date().toISOString();
        }
      });
    }

    this.data.categories = this.data.categories.filter(c => c.name !== name);
    this.saveData();
    this.renderPage();
    this.showToast(`分类「${name}」已删除`, 'info');
  },

  // =========================================================
  // AI 辅助
  // =========================================================

  /**
   * AI生成任务建议
   * 根据当前世界观、已有NPC、已有地点，建议3-5个新任务
   * @returns {Array} 建议的任务数组
   */
  aiSuggestTasks() {
    // 获取当前世界上下文
    const worldInfo = this.getWorldContext();
    const npcs = worldInfo.npcs || [];
    const locations = worldInfo.locations || [];
    const existingTitles = this.data.tasks.map(t => t.title);

    // 预置的任务模板库（古风视觉小说常见任务类型）
    const taskTemplates = [
      { titlePrefix: '寻访', desc: '前往{location}寻访{npc}，打听{topic}的消息。', topics: ['江湖秘闻', '失落的宝物', '神秘事件', '故人下落'] },
      { titlePrefix: '护送', desc: '护送{npc}安全抵达{location}，途中可能会遭遇{threat}。', threats: ['山贼劫匪', '仇家追杀', '妖兽袭击', '朝廷追兵'] },
      { titlePrefix: '调查', desc: '{location}发生了{event}，需要前往调查真相。', events: ['离奇命案', '宝物失窃', '诡异现象', '村民失踪'] },
      { titlePrefix: '收集', desc: '帮{npc}收集{amount}份{item}，可在{location}附近寻找。', items: ['灵芝草', '玄铁矿石', '千年人参', '古旧书卷', '稀有药材'] },
      { titlePrefix: '比试', desc: '{npc}邀请你于{location}进行一场{contest}。', contests: ['武艺切磋', '棋艺对弈', '诗词比试', '琴音较量'] },
      { titlePrefix: '传信', desc: '将{npc}的密信送往{location}交给{target}，务必保密。', targets: ['神秘商人', '隐居高人', '帮派首领', '朝廷密探'] },
      { titlePrefix: '营救', desc: '{npc}被困于{location}，需要尽快营救。', topics: [] },
      { titlePrefix: '寻物', desc: '帮{npc}寻找遗失的{item}，最后一次出现在{location}附近。', items: ['家传玉佩', '武功秘籍', '定情信物', '重要账册'] }
    ];

    const suggestions = [];
    const count = Math.min(3 + Math.floor(Math.random() * 3), 5);

    for (let i = 0; i < count; i++) {
      const tpl = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
      const npc = npcs.length > 0 ? npcs[Math.floor(Math.random() * npcs.length)] : { name: '某位神秘人物', id: null };
      const loc = locations.length > 0 ? locations[Math.floor(Math.random() * locations.length)] : { name: '未知之地', id: null };

      let title = tpl.titlePrefix;
      let desc = tpl.desc;

      // 替换模板变量
      desc = desc.replace('{npc}', npc.name || '某位神秘人物');
      desc = desc.replace('{location}', loc.name || '未知之地');
      if (tpl.topics && tpl.topics.length > 0) {
        desc = desc.replace('{topic}', tpl.topics[Math.floor(Math.random() * tpl.topics.length)]);
      }
      if (tpl.threats) {
        desc = desc.replace('{threat}', tpl.threats[Math.floor(Math.random() * tpl.threats.length)]);
      }
      if (tpl.events) {
        desc = desc.replace('{event}', tpl.events[Math.floor(Math.random() * tpl.events.length)]);
      }
      if (tpl.items) {
        desc = desc.replace('{item}', tpl.items[Math.floor(Math.random() * tpl.items.length)]);
      }
      if (tpl.amount !== undefined) {
        desc = desc.replace('{amount}', Math.floor(Math.random() * 5 + 1));
      }
      if (tpl.contests) {
        desc = desc.replace('{contest}', tpl.contests[Math.floor(Math.random() * tpl.contests.length)]);
      }
      if (tpl.targets) {
        desc = desc.replace('{target}', tpl.targets[Math.floor(Math.random() * tpl.targets.length)]);
      }

      // 避免与已有任务重名
      let finalTitle = title + '·' + npc.name;
      let attempt = 0;
      while (existingTitles.includes(finalTitle) && attempt < 5) {
        finalTitle = title + '·' + npc.name + ' (' + (attempt + 2) + ')';
        attempt++;
      }

      const category = this.data.categories.length > 0
        ? this.data.categories[Math.floor(Math.random() * this.data.categories.length)].name
        : '支线';

      suggestions.push({
        title: finalTitle,
        description: desc,
        category: category,
        reward: ['银两 x' + (Math.floor(Math.random() * 100 + 10)), '声望 +' + (Math.floor(Math.random() * 20 + 5)), '随机道具', '好感度提升'][Math.floor(Math.random() * 4)],
        relatedNpcIds: npc.id ? [npc.id] : [],
        relatedLocationIds: loc.id ? [loc.id] : [],
        deadline: null
      });
    }

    return suggestions;
  },

  /**
   * AI完善任务描述
   * @param {string} description - 原始描述
   * @returns {string} 优化后的描述
   */
  aiRefineDescription(description) {
    if (!description || description.trim() === '') {
      return '暂无详细描述……';
    }

    // 简单的文本增强逻辑（在真实AI环境中可替换为LLM调用）
    let refined = description.trim();

    // 添加古风修辞
    const flourishes = [
      '此事颇为紧要，',
      '据闻，',
      '江湖传言，',
      '近来，',
      '冥冥之中，'
    ];

    if (!/^[据闻此事近来江湖]/.test(refined)) {
      refined = flourishes[Math.floor(Math.random() * flourishes.length)] + refined;
    }

    // 如果描述较短，添加结语
    if (refined.length < 50) {
      const closings = [
        '还望阁下三思而后行。',
        '切记小心为上。',
        '成败在此一举。',
        '愿阁下一路顺风。'
      ];
      refined += ' ' + closings[Math.floor(Math.random() * closings.length)];
    }

    return refined;
  },

  // =========================================================
  // 任务模板
  // =========================================================

  /**
   * 将任务保存为模板
   * @param {string} taskId - 任务ID
   */
  saveTemplate(taskId) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task) {
      this.showToast('任务不存在', 'error');
      return null;
    }

    const template = {
      id: 'tpl_' + Date.now(),
      name: task.title + ' 模板',
      title: task.title,
      description: task.description,
      category: task.category,
      reward: task.reward,
      steps: task.steps || [],
      relatedNpcIds: [],
      relatedLocationIds: [],
      createdAt: new Date().toISOString()
    };

    this.data.templates.push(template);
    this.saveData();
    this.showToast('已保存为模板', 'success');
    return template;
  },

  /**
   * 使用模板创建任务
   * @param {string} templateId - 模板ID
   */
  useTemplate(templateId) {
    const tpl = this.data.templates.find(t => t.id === templateId);
    if (!tpl) {
      this.showToast('模板不存在', 'error');
      return null;
    }

    // 打开创建模态框，预填充模板内容
    this.openCreateModal({
      title: tpl.title + ' (副本)',
      description: tpl.description,
      category: tpl.category,
      reward: tpl.reward,
      steps: tpl.steps || []
    });
    this.showToast('已加载模板，请修改后保存', 'info');
    return tpl;
  },

  /**
   * 删除模板
   * @param {string} templateId - 模板ID
   */
  deleteTemplate(templateId) {
    if (!confirm('确定删除此模板吗？')) return;
    this.data.templates = this.data.templates.filter(t => t.id !== templateId);
    this.saveData();
    this.openTemplateModal();
    this.showToast('模板已删除', 'info');
  },

  // =========================================================
  // 模态框控制
  // =========================================================

  /** 打开任务详情模态框 */
  openDetailModal(taskId) {
    const body = document.getElementById('quest-modal-body');
    const title = document.getElementById('quest-modal-title');
    const footer = document.getElementById('quest-modal-footer');
    if (!body) return;

    body.innerHTML = this.renderTaskDetail(taskId);
    title.textContent = '任务详情';
    this.updateModalFooter(taskId);

    document.getElementById('quest-modal-overlay').classList.add('show');
  },

  /** 更新详情模态框底部按钮 */
  updateModalFooter(taskId) {
    const footer = document.getElementById('quest-modal-footer');
    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task || !footer) return;

    let html = '';

    if (task.status === 'pending') {
      html += `<button class="btn btn-primary" onclick="QuestSystem.updateStatus('${task.id}', 'active')">🚀 接取任务</button>`;
    } else if (task.status === 'active') {
      html += `<button class="btn btn-gold" onclick="QuestSystem.updateStatus('${task.id}', 'completed')">✓ 完成任务</button>`;
      html += `<button class="btn btn-danger" onclick="QuestSystem.updateStatus('${task.id}', 'failed')">✕ 任务失败</button>`;
    } else {
      html += `<button class="btn btn-secondary" onclick="QuestSystem.updateStatus('${task.id}', 'pending')">↺ 重置</button>`;
    }

    html += `
      <button class="btn btn-secondary" onclick="QuestSystem.openEditModal('${task.id}')">✎ 编辑</button>
      <button class="btn btn-secondary" onclick="QuestSystem.saveTemplate('${task.id}')">📋 存为模板</button>
      <button class="btn btn-danger" onclick="QuestSystem.deleteTask('${task.id}')">🗑 删除</button>
    `;

    footer.innerHTML = html;
  },

  /** 关闭详情模态框 */
  closeModal(e) {
    if (e && e.target !== e.currentTarget) return;
    const overlay = document.getElementById('quest-modal-overlay');
    if (overlay) overlay.classList.remove('show');
  },

  /** 打开新建/编辑任务模态框 */
  openCreateModal(prefill = null) {
    const isEdit = !!prefill && !!prefill.id;
    const body = document.getElementById('quest-form-body');
    const title = document.getElementById('quest-form-title');
    const footer = document.getElementById('quest-form-footer');
    if (!body) return;

    const task = isEdit ? this.data.tasks.find(t => t.id === prefill.id) : null;
    const editing = isEdit && task;

    // 生成分类选项
    let catOptions = this.data.categories.map(c =>
      `<option value="${this.escapeHtml(c.name)}" ${editing && editing.category === c.name ? 'selected' : ''}>${this.escapeHtml(c.name)}</option>`
    ).join('');
    if (!editing) {
      catOptions = `<option value="">请选择分类</option>` + catOptions;
    }

    title.textContent = editing ? '编辑任务' : '新建任务';

    body.innerHTML = `
      <form id="quest-form" onsubmit="event.preventDefault(); QuestSystem.handleFormSubmit('${editing ? editing.id : ''}');">
        <div class="form-group">
          <label>任务标题 <span style="color:#8B3333">*</span></label>
          <input type="text" name="title" required value="${this.escapeHtml(editing ? editing.title : (prefill ? prefill.title : ''))}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>分类</label>
            <select name="category">${catOptions}</select>
          </div>
          <div class="form-group">
            <label>期限（可选）</label>
            <input type="datetime-local" name="deadline" value="${this.escapeHtml(editing && editing.deadline ? this.toDatetimeLocal(editing.deadline) : '')}">
          </div>
        </div>
        <div class="form-group">
          <label>任务描述</label>
          <textarea name="description" rows="4">${this.escapeHtml(editing ? editing.description : (prefill ? prefill.description : ''))}</textarea>
          <div style="text-align:right; margin-top:4px;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="QuestSystem.handleAiRefine()">🤖 AI完善描述</button>
          </div>
        </div>
        <div class="form-group">
          <label>奖励</label>
          <input type="text" name="reward" placeholder="例如：银两 x100、声望 +10" 
            value="${this.escapeHtml(editing ? editing.reward : (prefill ? prefill.reward : ''))}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>关联NPC IDs（逗号分隔）</label>
            <input type="text" name="npcIds" placeholder="npc_001, npc_002" 
              value="${this.escapeHtml(editing && editing.relatedNpcIds ? editing.relatedNpcIds.join(', ') : '')}">
          </div>
          <div class="form-group">
            <label>关联地点 IDs（逗号分隔）</label>
            <input type="text" name="locIds" placeholder="loc_001, loc_002" 
              value="${this.escapeHtml(editing && editing.relatedLocationIds ? editing.relatedLocationIds.join(', ') : '')}">
          </div>
        </div>
      </form>
    `;

    footer.innerHTML = `
      <button class="btn btn-secondary" onclick="QuestSystem.closeFormModal()">取消</button>
      <button class="btn btn-primary" onclick="QuestSystem.handleFormSubmit('${editing ? editing.id : ''}')">${editing ? '保存修改' : '创建任务'}</button>
    `;

    document.getElementById('quest-form-overlay').classList.add('show');
  },

  /** 打开编辑模态框 */
  openEditModal(taskId) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task) return;
    this.closeModal();
    this.openCreateModal(task);
  },

  /** 关闭表单模态框 */
  closeFormModal(e) {
    if (e && e.target !== e.currentTarget) return;
    const overlay = document.getElementById('quest-form-overlay');
    if (overlay) overlay.classList.remove('show');
  },

  /** 表单提交处理 */
  handleFormSubmit(taskId) {
    const form = document.getElementById('quest-form');
    if (!form) return;

    const fd = new FormData(form);
    const data = {
      title: fd.get('title')?.trim(),
      category: fd.get('category'),
      description: fd.get('description')?.trim(),
      reward: fd.get('reward')?.trim(),
      deadline: fd.get('deadline') || null,
      relatedNpcIds: this.parseIdList(fd.get('npcIds')),
      relatedLocationIds: this.parseIdList(fd.get('locIds'))
    };

    if (!data.title) {
      this.showToast('请输入任务标题', 'error');
      return;
    }

    if (taskId) {
      this.editTask(taskId, data);
    } else {
      this.createTask(data);
    }

    this.closeFormModal();
  },

  /** AI完善描述按钮 */
  handleAiRefine() {
    const form = document.getElementById('quest-form');
    if (!form) return;
    const desc = form.querySelector('[name="description"]');
    if (!desc) return;
    desc.value = this.aiRefineDescription(desc.value);
    this.showToast('描述已优化', 'success');
  },

  /** 打开分类管理模态框 */
  openCategoryModal() {
    const body = document.getElementById('quest-category-body');
    const footer = document.getElementById('quest-category-footer');
    if (!body) return;

    let listHtml = '';
    this.data.categories.forEach(cat => {
      listHtml += `
        <div class="category-item">
          <div class="category-info">
            <span class="cat-dot" style="background:${this.escapeHtml(cat.color)}"></span>
            <span class="category-name">${this.escapeHtml(cat.name)}</span>
          </div>
          <button class="btn btn-danger btn-sm" onclick="QuestSystem.deleteCategory('${this.escapeHtml(cat.name)}')">删除</button>
        </div>
      `;
    });

    body.innerHTML = `
      <div class="category-list">
        ${listHtml || '<p style="color:var(--text-muted); text-align:center; padding:20px;">暂无分类</p>'}
      </div>
      <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--border-color);">
        <h5 style="margin-bottom:12px;">新建分类</h5>
        <div class="form-row">
          <div class="form-group" style="flex:2;">
            <input type="text" id="new-cat-name" placeholder="分类名称">
          </div>
          <div class="form-group" style="flex:1;">
            <input type="color" id="new-cat-color" value="#8B4513">
          </div>
        </div>
      </div>
    `;

    footer.innerHTML = `
      <button class="btn btn-secondary" onclick="QuestSystem.closeCategoryModal()">关闭</button>
      <button class="btn btn-primary" onclick="QuestSystem.handleCreateCategory()">新建分类</button>
    `;

    document.getElementById('quest-category-overlay').classList.add('show');
  },

  /** 关闭分类模态框 */
  closeCategoryModal(e) {
    if (e && e.target !== e.currentTarget) return;
    const overlay = document.getElementById('quest-category-overlay');
    if (overlay) overlay.classList.remove('show');
  },

  /** 新建分类处理 */
  handleCreateCategory() {
    const name = document.getElementById('new-cat-name')?.value;
    const color = document.getElementById('new-cat-color')?.value;
    if (this.createCategory(name, color)) {
      this.openCategoryModal(); // 刷新
    }
  },

  /** 打开AI建议模态框 */
  openAiSuggestModal() {
    const body = document.getElementById('quest-ai-body');
    const footer = document.getElementById('quest-ai-footer');
    if (!body) return;

    const suggestions = this.aiSuggestTasks();

    let html = '<div class="ai-suggestions">';
    suggestions.forEach((s, i) => {
      html += `
        <div class="ai-suggestion-card">
          <div class="ai-suggestion-header">
            <h5>${this.escapeHtml(s.title)}</h5>
            <span class="ai-suggestion-cat">${this.escapeHtml(s.category)}</span>
          </div>
          <p class="ai-suggestion-desc">${this.escapeHtml(s.description)}</p>
          <div class="ai-suggestion-meta">
            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/></svg> ${this.escapeHtml(s.reward)}</span>
          </div>
          <button class="btn btn-gold btn-sm" style="width:100%; margin-top:8px;" 
            onclick="QuestSystem.createTaskFromSuggestion(${i})">
            添加此任务
          </button>
        </div>
      `;
    });
    html += '</div>';

    // 存储当前建议供后续使用
    this._currentSuggestions = suggestions;

    body.innerHTML = html;
    footer.innerHTML = `<button class="btn btn-secondary" onclick="QuestSystem.closeAiModal()">关闭</button>`;

    document.getElementById('quest-ai-overlay').classList.add('show');
  },

  /** 从AI建议创建任务 */
  createTaskFromSuggestion(index) {
    const s = this._currentSuggestions?.[index];
    if (!s) return;
    this.createTask(s);
    this.closeAiModal();
  },

  /** 关闭AI模态框 */
  closeAiModal(e) {
    if (e && e.target !== e.currentTarget) return;
    const overlay = document.getElementById('quest-ai-overlay');
    if (overlay) overlay.classList.remove('show');
    this._currentSuggestions = null;
  },

  /** 打开模板管理模态框 */
  openTemplateModal() {
    const body = document.getElementById('quest-template-body');
    const footer = document.getElementById('quest-template-footer');
    if (!body) return;

    let listHtml = '';
    this.data.templates.forEach(tpl => {
      listHtml += `
        <div class="template-item">
          <div class="template-info">
            <h5>${this.escapeHtml(tpl.name)}</h5>
            <p>${this.escapeHtml((tpl.description || '').substring(0, 60))}${(tpl.description || '').length > 60 ? '...' : ''}</p>
            <span class="template-cat">${this.escapeHtml(tpl.category)}</span>
          </div>
          <div class="template-actions">
            <button class="btn btn-gold btn-sm" onclick="QuestSystem.useTemplate('${tpl.id}')">使用</button>
            <button class="btn btn-danger btn-sm" onclick="QuestSystem.deleteTemplate('${tpl.id}')">删除</button>
          </div>
        </div>
      `;
    });

    body.innerHTML = `
      <div class="template-list">
        ${listHtml || '<p style="color:var(--text-muted); text-align:center; padding:40px 20px;">暂无模板<br>可在任务详情中「存为模板」</p>'}
      </div>
    `;

    footer.innerHTML = `<button class="btn btn-secondary" onclick="QuestSystem.closeTemplateModal()">关闭</button>`;

    document.getElementById('quest-template-overlay').classList.add('show');
  },

  /** 关闭模板模态框 */
  closeTemplateModal(e) {
    if (e && e.target !== e.currentTarget) return;
    const overlay = document.getElementById('quest-template-overlay');
    if (overlay) overlay.classList.remove('show');
  },

  // =========================================================
  // 筛选与查询
  // =========================================================

  /**
   * 设置分类筛选
   * @param {string} category - 分类名称或'all'
   */
  setCategoryFilter(category) {
    this.data.filter.category = category;
    this.updateCategoryTabs();
    this.refreshBoard();
  },

  /**
   * 设置搜索关键词
   * @param {string} keyword - 搜索关键词
   */
  setSearchFilter(keyword) {
    this.data.filter.search = keyword;
    this.refreshBoard();
  },

  /** 更新分类标签栏激活状态 */
  updateCategoryTabs() {
    const tabs = document.getElementById('quest-category-tabs');
    if (!tabs) return;
    tabs.innerHTML = this.renderCategoryTabs();
  },

  /** 刷新任务板（不重新渲染整个页面） */
  refreshBoard() {
    const board = document.getElementById('quest-board');
    const sidebar = document.getElementById('quest-sidebar');
    if (board) board.innerHTML = this.renderTaskList();
    if (sidebar) sidebar.innerHTML = this.renderStatsPanel();
  },

  /**
   * 获取筛选后的任务列表
   * @returns {Array} 筛选后的任务
   */
  getFilteredTasks() {
    return this.getTasks(this.data.filter);
  },

  /**
   * 根据名称获取分类
   * @param {string} name - 分类名称
   */
  getCategoryByName(name) {
    return this.data.categories.find(c => c.name === name);
  },

  // =========================================================
  // 辅助方法
  // =========================================================

  /**
   * 获取状态配置（标签文本和样式）
   * @param {string} status - 状态码
   */
  getStatusConfig(status) {
    const map = {
      pending: { label: '未接', class: 'status-pending' },
      active: { label: '进行中', class: 'status-active' },
      completed: { label: '已完成', class: 'status-completed' },
      failed: { label: '失败', class: 'status-failed' }
    };
    return map[status] || { label: status, class: '' };
  },

  /**
   * 格式化截止日期
   * @param {string} deadline - ISO日期字符串
   */
  formatDeadline(deadline) {
    if (!deadline) return '';
    const d = new Date(deadline);
    const now = new Date();
    const diff = d - now;

    if (diff < 0) return '已逾期';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 30) return d.toLocaleDateString('zh-CN');
    if (days > 0) return `${days}天后`;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) return `${hours}小时后`;
    const mins = Math.floor(diff / (1000 * 60));
    return `${mins}分钟后`;
  },

  /**
   * 计算倒计时（带紧急标记）
   * @param {string} deadline - ISO日期字符串
   */
  calcCountdown(deadline) {
    if (!deadline) return { text: '', urgent: false };
    const d = new Date(deadline);
    const now = new Date();
    const diff = d - now;

    if (diff < 0) return { text: '已逾期', urgent: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 7) return { text: `${days}天后截止`, urgent: false };
    if (days > 0) return { text: `${days}天后截止`, urgent: days <= 1 };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) return { text: `${hours}小时后截止`, urgent: true };
    const mins = Math.floor(diff / (1000 * 60));
    return { text: `${mins}分钟后截止`, urgent: true };
  },

  /**
   * 格式化日期显示
   * @param {string} iso - ISO日期字符串
   */
  formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  },

  /**
   * 将ISO字符串转为datetime-local输入值
   * @param {string} iso - ISO日期字符串
   */
  toDatetimeLocal(iso) {
    const d = new Date(iso);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  },

  /** 转义HTML特殊字符 */
  escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  /** 将换行符转为<br> */
  nl2br(str) {
    return str.replace(/\n/g, '<br>');
  },

  /** 解析逗号分隔的ID列表 */
  parseIdList(str) {
    if (!str) return [];
    return str.split(/[,，]/).map(s => s.trim()).filter(s => s);
  },

  /** 生成随机古风墨色 */
  randomInkColor() {
    const colors = [
      '#8B4513', '#5D2E0C', '#A0522D', '#6B4423',
      '#C9A227', '#B8860B', '#8B7355', '#4A3728',
      '#7B3F00', '#9B7653', '#D4AF37', '#BC8F8F'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  },

  /** 计算统计数据 */
  calcStats() {
    const tasks = this.data.tasks;
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      active: tasks.filter(t => t.status === 'active').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length
    };
  },

  /** 播放完成动画 */
  playCompletionFx() {
    const fx = document.getElementById('quest-completion-fx');
    if (!fx) return;

    fx.innerHTML = `
      <div class="completion-text"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2 7h7l-5.5 4 2 7-5.5-4-5.5 4 2-7L3 9h7z"/></svg> 任务完成 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2 7h7l-5.5 4 2 7-5.5-4-5.5 4 2-7L3 9h7z"/></svg></div>
    `;
    fx.classList.add('show');

    setTimeout(() => {
      fx.classList.remove('show');
      fx.innerHTML = '';
    }, 2000);
  },

  /** 显示Toast通知 */
  showToast(message, type = 'info') {
    // 复用系统toast或创建独立toast
    let toast = document.getElementById('quest-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'quest-toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }

    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${this.escapeHtml(message)}</span>`;
    toast.classList.add('show');

    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  },

  /** 获取NPC数据（从全局系统） */
  getNpcById(id) {
    // 尝试从全局NPC系统获取
    if (typeof window.NPCSystem !== 'undefined' && window.NPCSystem.getCharacterById) {
      return window.NPCSystem.getCharacterById(id);
    }
    // 尝试从localStorage的npc_system获取
    try {
      const npcData = JSON.parse(localStorage.getItem('npc_system_v1') || '{}');
      return (npcData.characters || []).find(c => c.id === id);
    } catch (e) {
      return null;
    }
  },

  /** 获取地点数据（从全局系统） */
  getLocationById(id) {
    // 尝试从全局地点系统获取
    if (typeof window.LocationSystem !== 'undefined' && window.LocationSystem.getLocationById) {
      return window.LocationSystem.getLocationById(id);
    }
    // 尝试从localStorage获取
    try {
      const locData = JSON.parse(localStorage.getItem('location_system_v1') || '{}');
      return (locData.locations || []).find(l => l.id === id);
    } catch (e) {
      return null;
    }
  },

  /** 获取世界上下文（用于AI建议） */
  getWorldContext() {
    let npcs = [];
    let locations = [];

    // 从全局系统获取
    if (typeof window.NPCSystem !== 'undefined' && window.NPCSystem.data && window.NPCSystem.data.characters) {
      npcs = window.NPCSystem.data.characters;
    } else {
      try {
        const npcData = JSON.parse(localStorage.getItem('npc_system_v1') || '{}');
        npcs = npcData.characters || [];
      } catch (e) {}
    }

    if (typeof window.LocationSystem !== 'undefined' && window.LocationSystem.data && window.LocationSystem.data.locations) {
      locations = window.LocationSystem.data.locations;
    } else {
      try {
        const locData = JSON.parse(localStorage.getItem('location_system_v1') || '{}');
        locations = locData.locations || [];
      } catch (e) {}
    }

    return { npcs, locations };
  },

  /** 跳转到NPC页面 */
  jumpToNpc(npcId) {
    // 触发全局路由跳转到NPC页面
    if (typeof window.Router !== 'undefined' && window.Router.navigate) {
      window.Router.navigate('npc', { npcId });
    } else {
      this.showToast('NPC系统未加载，无法跳转', 'error');
    }
  },

  /** 跳转到地点页面 */
  jumpToLocation(locId) {
    // 触发全局路由跳转到地点/地图页面
    if (typeof window.Router !== 'undefined' && window.Router.navigate) {
      window.Router.navigate('map', { locId });
    } else {
      this.showToast('地图系统未加载，无法跳转', 'error');
    }
  },

  // =========================================================
  // 事件绑定
  // =========================================================

  /** 绑定页面级事件 */
  bindPageEvents() {
    const searchInput = document.getElementById('quest-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.setSearchFilter(e.target.value);
      });
    }
  },

  /** 绑定全局事件 */
  bindGlobalEvents() {
    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
        this.closeFormModal();
        this.closeCategoryModal();
        this.closeAiModal();
        this.closeTemplateModal();
      }
    });
  }
};

// =========================================================
// 注入任务系统专属样式（古风墨境）
// =========================================================
(function injectQuestStyles() {
  if (document.getElementById('quest-system-styles')) return;

  const style = document.createElement('style');
  style.id = 'quest-system-styles';
  style.textContent = `
    /* === 任务系统容器 === */
    .quest-system-container { padding: var(--space-lg); }

    /* === 工具栏 === */
    .quest-toolbar {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: var(--space-lg); flex-wrap: wrap; gap: var(--space-md);
    }
    .quest-toolbar-left .section-title { margin-bottom: 0; }
    .quest-toolbar-right {
      display: flex; align-items: center; gap: var(--space-sm);
    }
    .quest-search {
      position: relative;
    }
    .quest-search input {
      padding-left: 36px;
      width: 220px;
      background: var(--bg-input);
    }
    .quest-search .search-icon {
      position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
      font-size: 14px; opacity: 0.5;
    }

    /* === 分类标签 === */
    .quest-category-tabs {
      display: flex; gap: var(--space-sm); flex-wrap: wrap;
      margin-bottom: var(--space-lg); padding-bottom: var(--space-md);
      border-bottom: 1px solid var(--border-color);
    }
    .quest-tab {
      padding: 6px 16px; border-radius: 20px;
      background: var(--bg-card); border: 1px solid var(--border-color);
      color: var(--text-secondary); font-size: 13px; cursor: pointer;
      transition: all var(--transition-fast); font-family: var(--font-display);
      display: flex; align-items: center; gap: 6px;
    }
    .quest-tab:hover { background: var(--bg-card-hover); border-color: var(--color-gold); }
    .quest-tab.active {
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
      color: var(--text-light); border-color: var(--color-primary-dark);
      box-shadow: var(--shadow-sm);
    }
    .quest-tab .cat-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

    /* === 主体布局 === */
    .quest-main {
      display: grid; grid-template-columns: 1fr 320px; gap: var(--space-lg);
    }
    @media (max-width: 900px) {
      .quest-main { grid-template-columns: 1fr; }
      .quest-sidebar { order: -1; }
    }

    /* === 任务卡片网格 === */
    .quest-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--space-md);
    }

    /* === 任务卡片 === */
    .quest-card {
      background: var(--bg-card); border-radius: var(--border-radius);
      border: 1px solid var(--border-color);
      overflow: hidden; cursor: pointer;
      transition: all var(--transition-fast);
      display: flex; flex-direction: column;
    }
    .quest-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-md);
      border-color: var(--border-gold);
    }
    .quest-card-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-sm) var(--space-md);
      border-bottom: 1px solid var(--border-color);
      background: linear-gradient(180deg, var(--bg-parchment), var(--bg-card));
    }
    .quest-card-category {
      font-size: 11px; padding: 2px 10px; border-radius: 12px;
      border: 1px solid; font-family: var(--font-display);
    }
    .quest-card-status {
      font-size: 11px; padding: 2px 8px; border-radius: 10px;
      font-family: var(--font-display);
    }
    .quest-card-status.pending { background: #E8D5C4; color: #8B7355; }
    .quest-card-status.active { background: #E6F0FF; color: #4A7C9B; }
    .quest-card-status.completed { background: #E8F5E0; color: #5B8C3A; }
    .quest-card-status.failed { background: #F5E0E0; color: #8B3333; }

    .quest-card-body { padding: var(--space-md); flex: 1; }
    .quest-card-title {
      font-size: 15px; font-family: var(--font-display);
      color: var(--text-primary); margin-bottom: 6px;
      line-height: 1.4;
    }
    .quest-card-desc {
      font-size: 12px; color: var(--text-muted); line-height: 1.6;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .quest-card-footer {
      padding: var(--space-sm) var(--space-md);
      border-top: 1px solid var(--border-color);
      display: flex; justify-content: space-between; align-items: center;
      background: var(--bg-parchment);
    }
    .quest-card-meta {
      display: flex; flex-direction: column; gap: 2px;
      font-size: 11px; color: var(--text-muted);
    }
    .quest-deadline.urgent { color: #8B3333; font-weight: 600; }
    .quest-reward { color: var(--color-gold); }

    .task-npcs { display: flex; align-items: center; }
    .task-npc-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      border: 2px solid var(--bg-card); margin-left: -8px;
      object-fit: cover; background: var(--bg-sidebar);
    }
    .task-npc-avatar:first-child { margin-left: 0; }
    .task-npc-placeholder {
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; color: var(--text-muted); background: var(--bg-sidebar);
    }
    .task-npc-more {
      width: 28px; height: 28px; border-radius: 50%;
      background: var(--bg-sidebar); border: 2px solid var(--bg-card); margin-left: -8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; color: var(--text-muted);
    }

    /* === 空状态 === */
    .quest-empty-state {
      grid-column: 1 / -1;
      text-align: center; padding: var(--space-2xl);
      color: var(--text-muted);
    }
    .quest-empty-state .empty-icon { font-size: 56px; margin-bottom: var(--space-md); }
    .quest-empty-state h3 { font-family: var(--font-display); margin-bottom: var(--space-sm); color: var(--text-secondary); }
    .quest-empty-state p { margin-bottom: var(--space-lg); }

    /* === 统计面板 === */
    .quest-stats-card {
      background: var(--bg-card); border-radius: var(--border-radius);
      border: 1px solid var(--border-color); padding: var(--space-lg);
      position: sticky; top: var(--space-lg);
    }
    .quest-stats-card h4 {
      font-family: var(--font-display); font-size: 16px;
      margin-bottom: var(--space-md); color: var(--color-primary-dark);
    }
    .stat-overview { display: flex; align-items: center; gap: var(--space-lg); margin-bottom: var(--space-lg); }
    .stat-circle {
      position: relative; width: 80px; height: 80px; flex-shrink: 0;
    }
    .stat-circle svg { transform: rotate(-90deg); }
    .stat-circle-bg {
      fill: none; stroke: var(--bg-input); stroke-width: 3;
    }
    .stat-circle-fill {
      fill: none; stroke: var(--color-gold); stroke-width: 3;
      stroke-linecap: round;
      transition: stroke-dasharray var(--transition-normal);
    }
    .stat-circle-text {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      font-size: 18px; font-weight: 600; color: var(--color-gold);
      font-family: var(--font-display);
    }
    .stat-numbers {
      display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-sm);
      flex: 1;
    }
    .stat-item { text-align: center; }
    .stat-num { font-size: 18px; font-weight: 600; color: var(--text-primary); display: block; }
    .stat-label { font-size: 11px; color: var(--text-muted); }

    .stat-categories { margin-top: var(--space-md); }
    .stat-categories h5 {
      font-size: 13px; color: var(--text-secondary); margin-bottom: var(--space-sm);
      font-family: var(--font-display);
    }
    .stat-cat-row {
      display: flex; align-items: center; gap: var(--space-sm);
      padding: 4px 0; font-size: 12px;
    }
    .stat-cat-name { flex: 1; display: flex; align-items: center; gap: 6px; }
    .stat-cat-count { color: var(--text-muted); min-width: 40px; text-align: right; }
    .stat-mini-bar {
      width: 60px; height: 4px; background: var(--bg-input); border-radius: 2px; overflow: hidden;
    }
    .stat-mini-fill { height: 100%; border-radius: 2px; transition: width var(--transition-normal); }

    .stat-actions { margin-top: var(--space-lg); padding-top: var(--space-md); border-top: 1px solid var(--border-color); }

    /* === 详情面板 === */
    .quest-detail { }
    .detail-header {
      display: flex; gap: var(--space-sm); margin-bottom: var(--space-md);
    }
    .detail-category {
      font-size: 12px; padding: 2px 12px; border-radius: 12px;
      font-family: var(--font-display);
    }
    .detail-status {
      font-size: 12px; padding: 2px 10px; border-radius: 10px;
      font-family: var(--font-display);
    }
    .detail-status.pending { background: #E8D5C4; color: #8B7355; }
    .detail-status.active { background: #E6F0FF; color: #4A7C9B; }
    .detail-status.completed { background: #E8F5E0; color: #5B8C3A; }
    .detail-status.failed { background: #F5E0E0; color: #8B3333; }
    .detail-title {
      font-size: 22px; font-family: var(--font-display);
      color: var(--text-primary); margin-bottom: var(--space-md);
    }
    .detail-meta-bar {
      display: flex; flex-wrap: wrap; gap: var(--space-md);
      font-size: 13px; color: var(--text-secondary); margin-bottom: var(--space-lg);
      padding: var(--space-sm) 0; border-bottom: 1px solid var(--border-color);
    }
    .detail-section { margin-bottom: var(--space-lg); }
    .detail-section h5 {
      font-size: 14px; color: var(--color-primary); margin-bottom: var(--space-sm);
      font-family: var(--font-display);
    }
    .detail-description {
      line-height: 1.8; color: var(--text-secondary); font-size: 14px;
      background: var(--bg-parchment); padding: var(--space-md);
      border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);
    }

    .detail-npc-list, .detail-loc-list {
      display: flex; flex-wrap: wrap; gap: var(--space-sm);
    }
    .detail-npc-item, .detail-loc-item {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 12px; background: var(--bg-parchment);
      border: 1px solid var(--border-color); border-radius: var(--border-radius-sm);
      font-size: 13px; cursor: pointer; transition: all var(--transition-fast);
    }
    .detail-npc-item:hover, .detail-loc-item:hover {
      border-color: var(--color-gold); background: var(--bg-card-hover);
    }
    .detail-npc-avatar {
      width: 32px; height: 32px; border-radius: 50%; object-fit: cover;
      background: var(--bg-sidebar);
    }

    .detail-history {
      list-style: none; padding: 0;
      max-height: 200px; overflow-y: auto;
    }
    .detail-history li {
      padding: 6px 0; border-bottom: 1px dashed var(--border-color);
      font-size: 13px; color: var(--text-secondary);
    }
    .history-time { color: var(--text-muted); font-size: 11px; margin-right: 8px; }

    /* === 分类管理 === */
    .category-list { max-height: 300px; overflow-y: auto; }
    .category-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px; border-bottom: 1px solid var(--border-color);
    }
    .category-info { display: flex; align-items: center; gap: 10px; }
    .category-name { font-size: 14px; font-family: var(--font-display); }

    /* === AI建议 === */
    .ai-suggestions {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: var(--space-md);
    }
    .ai-suggestion-card {
      background: var(--bg-parchment); border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm); padding: var(--space-md);
      transition: all var(--transition-fast);
    }
    .ai-suggestion-card:hover { border-color: var(--color-gold); }
    .ai-suggestion-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: var(--space-sm); gap: var(--space-sm);
    }
    .ai-suggestion-header h5 {
      font-size: 14px; font-family: var(--font-display); flex: 1; line-height: 1.4;
    }
    .ai-suggestion-cat {
      font-size: 11px; padding: 2px 8px; border-radius: 10px;
      background: var(--color-gold); color: var(--color-ink);
      white-space: nowrap;
    }
    .ai-suggestion-desc {
      font-size: 13px; color: var(--text-secondary); line-height: 1.6;
      margin-bottom: var(--space-sm);
    }
    .ai-suggestion-meta {
      font-size: 12px; color: var(--color-gold);
    }

    /* === 模板 === */
    .template-list { max-height: 400px; overflow-y: auto; }
    .template-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-md); border-bottom: 1px solid var(--border-color);
      gap: var(--space-md);
    }
    .template-info { flex: 1; }
    .template-info h5 { font-size: 14px; font-family: var(--font-display); margin-bottom: 4px; }
    .template-info p { font-size: 12px; color: var(--text-muted); margin-bottom: 4px; }
    .template-cat {
      font-size: 11px; padding: 2px 8px; border-radius: 10px;
      background: var(--bg-input); color: var(--text-secondary);
    }
    .template-actions { display: flex; gap: var(--space-sm); }

    /* === 完成动画 === */
    .quest-completion-fx {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      pointer-events: none; z-index: 9999;
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.5s;
    }
    .quest-completion-fx.show { opacity: 1; }
    .completion-text {
      font-size: 36px; font-family: var(--font-display);
      color: var(--color-gold); text-shadow: 0 0 40px rgba(201, 162, 39, 0.6);
      animation: completionPulse 2s ease-in-out;
    }
    @keyframes completionPulse {
      0% { transform: scale(0.5); opacity: 0; }
      30% { transform: scale(1.1); opacity: 1; }
      70% { transform: scale(1); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0; }
    }
  `;

  document.head.appendChild(style);
})();

// 自动初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => QuestSystem.init());
} else {
  QuestSystem.init();
}
