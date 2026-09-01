/**
 * =========================================================
 * BadgeWall vv13 成就徽章墙系统
 * 模块名：BadgeWall
 * 功能：用户自定义成就/徽章/稀有度/解锁条件，含瀑布流展示、解锁动画、管理面板
 * 配色：古风墨境 — 暖羊皮纸底色 #F5E6D3 + 金色 #C9A227 + 墨色 #2C1810
 * 存储键：badge_wall_v12
 * =========================================================
 */
const BadgeWall = {
  // === 存储键名 ===
  STORAGE_KEY: 'badge_wall_v12',

  // === 默认稀有度系统（用户可扩展） ===
  DEFAULT_RARITIES: {
    bronze:    { name: '铜',    color: '#CD7F32', borderColor: '#CD7F32', glow: 'none',   animation: 'none' },
    silver:    { name: '银',    color: '#C0C0C0', borderColor: '#C0C0C0', glow: 'none',   animation: 'none' },
    gold:      { name: '金',    color: '#C9A227', borderColor: '#C9A227', glow: 'pulse',  animation: 'pulse-gold' },
    legendary: { name: '传说',  color: '#FFD700', borderColor: '#FFD700', glow: 'rainbow', animation: 'legendary-glow' }
  },

  // === 默认条件类型（用户可扩展） ===
  DEFAULT_CONDITION_TYPES: [
    { id: 'reach_level',       name: '达到等级',      icon: '📈', desc: '角色达到指定等级' },
    { id: 'complete_tasks',  name: '完成任务',      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>', desc: '完成指定数量的任务' },
    { id: 'talk_npc',        name: 'NPC对话',       icon: '🗣️', desc: '与指定数量的NPC对话' },
    { id: 'collect_items',   name: '收集物品',      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>', desc: '收集指定数量的物品' },
    { id: 'visit_locations', name: '到达地点',      icon: '📍', desc: '访问指定数量的地点' },
    { id: 'playtime_hours',  name: '游戏时长',      icon: '⏱️', desc: '累计游戏时长达到指定小时数' },
    { id: 'login_streak',    name: '连续登录',      icon: '🔥', desc: '连续登录指定天数' },
    { id: 'custom_event',    name: '自定义事件',     icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>', desc: '触发指定的自定义事件' }
  ],

  // === 内部状态 ===
  _achievements: [],        // 成就列表
  _rarities: {},              // 稀有度配置
  _conditionTypes: [],        // 条件类型列表
  _unlockedIds: new Set(),    // 已解锁成就ID集合
  _filter: { category: 'all', rarity: 'all', status: 'all' },
  _sortMode: 'default',       // default | rarity | name | date
  _editingId: null,           // 当前编辑的成就ID
  _pendingUnlockAnimation: null, // 待播放的解锁动画队列

  // =========================================================
  // 初始化
  // =========================================================
    // 初始化模块入口
  init() {
    // v7: 外部模块依赖检查
    if (typeof Storage === 'undefined') { console.warn('[v7] Storage模块未加载'); return; }
    // 初始化模块入口
    this._loadData();
    this._injectStyles();
    this.renderPage();
  },

    // 页面进入时调用
  onEnter() {
    // 页面进入时调用
    this.renderBadgeGrid();
    this.renderStatsPanel();
  },

  // =========================================================
  // 数据持久化
  // =========================================================
  _loadData() {
    const raw = Storage.get(this.STORAGE_KEY, null);
    if (raw) {
      this._achievements = raw.achievements || [];
      this._rarities = raw.rarities || { ...this.DEFAULT_RARITIES };
      this._conditionTypes = raw.conditionTypes || [...this.DEFAULT_CONDITION_TYPES];
      this._unlockedIds = new Set(raw.unlockedIds || []);
    } else {
      // 首次初始化：空成就列表 + 默认稀有度 + 默认条件类型
      this._achievements = [];
      this._rarities = { ...this.DEFAULT_RARITIES };
      this._conditionTypes = [...this.DEFAULT_CONDITION_TYPES];
      this._unlockedIds = new Set();
      this._saveData();
    }
  },

  _saveData() {
    Storage.set(this.STORAGE_KEY, {
      achievements: this._achievements,
      rarities: this._rarities,
      conditionTypes: this._conditionTypes,
      unlockedIds: Array.from(this._unlockedIds)
    });
  },

  // =========================================================
  // CSS样式注入（古风墨境配色）
  // =========================================================
  _injectStyles() {
    if (document.getElementById('badge-wall-styles')) return;
    const style = document.createElement('style');
    style.id = 'badge-wall-styles';
    style.textContent = `
      /* === 徽章墙容器 === */
      .badge-wall-container {
        padding: var(--space-lg);
        max-width: var(--max-width);
        margin: 0 auto;
      }

      /* === 顶部统计面板 === */
      .badge-stats-panel {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: var(--space-md);
        margin-bottom: var(--space-lg);
        padding: var(--space-lg);
        background: linear-gradient(135deg, var(--bg-card), var(--bg-parchment));
        border: 2px solid var(--border-gold);
        border-radius: var(--border-radius-lg);
        box-shadow: var(--shadow-md);
      }
      .badge-stat-item {
        text-align: center;
        padding: var(--space-md);
        border-radius: var(--border-radius);
        background: rgba(201, 162, 39, 0.08);
        border: 1px solid var(--border-color);
        transition: all var(--transition-fast);
      }
      .badge-stat-item:hover {
        background: rgba(201, 162, 39, 0.15);
        transform: translateY(-2px);
      }
      .badge-stat-number {
        font-size: 28px;
        font-weight: 700;
        color: var(--color-gold);
        font-family: var(--font-display);
      }
      .badge-stat-label {
        font-size: 12px;
        color: var(--text-muted);
        margin-top: 4px;
      }
      .badge-completion-bar {
        grid-column: 1 / -1;
        margin-top: var(--space-sm);
      }
      .badge-completion-track {
        width: 100%;
        height: 8px;
        background: var(--bg-input);
        border-radius: 4px;
        overflow: hidden;
      }
      .badge-completion-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--color-gold), var(--color-accent-light));
        border-radius: 4px;
        transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .badge-completion-text {
        text-align: center;
        font-size: 13px;
        color: var(--text-secondary);
        margin-top: 6px;
      }

      /* === 筛选工具栏 === */
      .badge-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-sm);
        margin-bottom: var(--space-lg);
        padding: var(--space-md);
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
      }
      .badge-filter-group {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .badge-filter-label {
        font-size: 13px;
        color: var(--text-muted);
        white-space: nowrap;
      }
      .badge-filter-btn {
        padding: 6px 12px;
        border-radius: var(--border-radius-sm);
        border: 1px solid var(--border-color);
        background: var(--bg-input);
        color: var(--text-secondary);
        font-size: 13px;
        cursor: pointer;
        transition: all var(--transition-fast);
      }
      .badge-filter-btn:hover {
        border-color: var(--color-gold);
        color: var(--color-gold);
      }
      .badge-filter-btn.active {
        background: var(--color-gold);
        border-color: var(--color-gold);
        color: #fff;
      }

      /* === 徽章网格/瀑布流 === */
      .badge-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: var(--space-md);
      }
      .badge-grid.waterfall {
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        grid-auto-rows: minmax(200px, auto);
      }

      /* === 单个徽章卡片 === */
      .badge-card {
        position: relative;
        background: var(--bg-card);
        border: 2px solid var(--border-color);
        border-radius: var(--border-radius-lg);
        padding: var(--space-lg);
        text-align: center;
        cursor: pointer;
        transition: all var(--transition-normal);
        overflow: hidden;
      }
      .badge-card::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        border-radius: inherit;
        opacity: 0;
        transition: opacity var(--transition-normal);
        pointer-events: none;
      }
      .badge-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
      }
      .badge-card.locked {
        opacity: 0.55;
        filter: grayscale(0.85);
      }
      .badge-card.locked:hover {
        opacity: 0.75;
        filter: grayscale(0.6);
      }
      .badge-card.secret-hidden {
        display: none !important;
      }
      .badge-card.highlighted {
        animation: badge-highlight-pulse 3s ease-out;
      }

      /* 稀有度边框样式 */
      .badge-card.rarity-bronze    { border-color: #CD7F32; }
      .badge-card.rarity-silver    { border-color: #C0C0C0; }
      .badge-card.rarity-gold      { border-color: #C9A227; box-shadow: 0 0 12px rgba(201, 162, 39, 0.2); }
      .badge-card.rarity-legendary {
        border-color: #FFD700;
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
        background: linear-gradient(135deg, var(--bg-card), rgba(255, 215, 0, 0.05));
      }

      /* 徽章图标 */
      .badge-icon-wrap {
        width: 72px;
        height: 72px;
        margin: 0 auto var(--space-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--bg-parchment), var(--bg-input));
        border: 2px solid var(--border-color);
        font-size: 36px;
        transition: all var(--transition-normal);
      }
      .badge-card:hover .badge-icon-wrap {
        transform: scale(1.1);
      }
      .badge-card.rarity-gold .badge-icon-wrap {
        border-color: #C9A227;
        animation: pulse-gold 2s infinite;
      }
      .badge-card.rarity-legendary .badge-icon-wrap {
        border-color: #FFD700;
        animation: legendary-glow 3s infinite;
      }

      /* 徽章文字 */
      .badge-name {
        font-size: 15px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 4px;
        font-family: var(--font-display);
      }
      .badge-desc {
        font-size: 12px;
        color: var(--text-muted);
        line-height: 1.5;
        margin-bottom: 8px;
      }
      .badge-category-tag {
        display: inline-block;
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 10px;
        background: rgba(139, 69, 19, 0.1);
        color: var(--text-secondary);
        margin-bottom: 6px;
      }
      .badge-rarity-tag {
        display: inline-block;
        font-size: 11px;
        padding: 2px 10px;
        border-radius: 10px;
        font-weight: 600;
      }
      .badge-rarity-tag.rarity-bronze    { background: rgba(205, 127, 50, 0.15); color: #CD7F32; }
      .badge-rarity-tag.rarity-silver    { background: rgba(192, 192, 192, 0.15); color: #888; }
      .badge-rarity-tag.rarity-gold      { background: rgba(201, 162, 39, 0.15); color: #C9A227; }
      .badge-rarity-tag.rarity-legendary { background: linear-gradient(90deg, rgba(255,215,0,0.15), rgba(255,107,53,0.15)); color: #FF8C00; }
      .badge-unlock-date {
        font-size: 11px;
        color: var(--color-gold);
        margin-top: 6px;
      }
      .badge-locked-mask {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 32px;
        color: var(--text-muted);
        opacity: 0.6;
      }

      /* === 管理面板 === */
      .badge-manager-panel {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: var(--bg-overlay);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-lg);
      }
      .badge-manager-content {
        background: var(--bg-card);
        border: 2px solid var(--border-gold);
        border-radius: var(--border-radius-lg);
        width: 100%;
        max-width: 640px;
        max-height: 85vh;
        overflow-y: auto;
        padding: var(--space-xl);
        box-shadow: var(--shadow-lg);
      }
      .badge-manager-title {
        font-size: 20px;
        font-family: var(--font-display);
        color: var(--color-primary-dark);
        margin-bottom: var(--space-lg);
        text-align: center;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: var(--space-md);
      }
      .badge-form-row {
        margin-bottom: var(--space-md);
      }
      .badge-form-label {
        display: block;
        font-size: 13px;
        color: var(--text-secondary);
        margin-bottom: 6px;
      }
      .badge-form-input, .badge-form-select, .badge-form-textarea {
        width: 100%;
        padding: 10px 14px;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-sm);
        background: var(--bg-input);
        color: var(--text-primary);
        font-size: 14px;
      }
      .badge-form-textarea {
        min-height: 60px;
        resize: vertical;
      }
      .badge-form-hint {
        font-size: 11px;
        color: var(--text-muted);
        margin-top: 4px;
      }
      .badge-condition-builder {
        background: var(--bg-parchment);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        padding: var(--space-md);
        margin-top: var(--space-sm);
      }
      .badge-condition-row {
        display: flex;
        gap: var(--space-sm);
        align-items: center;
        margin-bottom: var(--space-sm);
        flex-wrap: wrap;
      }
      .badge-condition-row select, .badge-condition-row input {
        flex: 1;
        min-width: 100px;
      }
      .badge-condition-connector {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-sm);
        margin: var(--space-sm) 0;
        font-size: 13px;
        color: var(--text-muted);
      }
      .badge-condition-connector label {
        display: flex;
        align-items: center;
        gap: 4px;
        cursor: pointer;
      }
      .badge-btn-group {
        display: flex;
        gap: var(--space-sm);
        justify-content: center;
        margin-top: var(--space-lg);
      }
      .badge-btn {
        padding: 10px 24px;
        border-radius: var(--border-radius-sm);
        border: none;
        font-size: 14px;
        cursor: pointer;
        transition: all var(--transition-fast);
        font-family: var(--font-main);
      }
      .badge-btn-primary {
        background: var(--color-gold);
        color: #fff;
      }
      .badge-btn-primary:hover {
        background: var(--color-accent);
        box-shadow: var(--shadow-gold);
      }
      .badge-btn-secondary {
        background: var(--bg-input);
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
      }
      .badge-btn-secondary:hover {
        border-color: var(--color-gold);
        color: var(--color-gold);
      }
      .badge-btn-danger {
        background: #C0392B;
        color: #fff;
      }
      .badge-btn-danger:hover {
        background: #E74C3C;
      }

      /* === 解锁动画 === */
      .badge-unlock-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(44, 24, 16, 0.9);
        z-index: 2000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        animation: unlock-fade-in 0.5s ease-out;
      }
      @keyframes unlock-fade-in {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      .badge-unlock-pulse {
        position: absolute;
        width: 200vmax;
        height: 200vmax;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(201,162,39,0.15) 0%, transparent 60%);
        animation: unlock-golden-pulse 2s ease-out forwards;
      }
      @keyframes unlock-golden-pulse {
        0%   { transform: scale(0); opacity: 1; }
        50%  { transform: scale(1); opacity: 0.6; }
        100% { transform: scale(2); opacity: 0; }
      }
      .badge-unlock-card {
        position: relative;
        z-index: 2;
        background: linear-gradient(135deg, var(--bg-card), var(--bg-parchment));
        border: 3px solid var(--color-gold);
        border-radius: var(--border-radius-lg);
        padding: var(--space-2xl);
        text-align: center;
        max-width: 400px;
        animation: unlock-card-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: 0 0 60px rgba(201, 162, 39, 0.4);
      }
      @keyframes unlock-card-pop {
        0%   { transform: scale(0.5) translateY(40px); opacity: 0; }
        100% { transform: scale(1) translateY(0); opacity: 1; }
      }
      .badge-unlock-icon {
        font-size: 80px;
        margin-bottom: var(--space-md);
        animation: unlock-icon-bounce 0.8s ease-out;
      }
      @keyframes unlock-icon-bounce {
        0%   { transform: scale(0) rotate(-20deg); }
        50%  { transform: scale(1.2) rotate(5deg); }
        70%  { transform: scale(0.9) rotate(-3deg); }
        100% { transform: scale(1) rotate(0deg); }
      }
      .badge-unlock-name {
        font-size: 24px;
        font-family: var(--font-display);
        color: var(--color-gold);
        margin-bottom: var(--space-sm);
      }
      .badge-unlock-desc {
        font-size: 14px;
        color: var(--text-secondary);
        margin-bottom: var(--space-md);
      }
      .badge-unlock-rare-label {
        display: inline-block;
        padding: 4px 16px;
        border-radius: 20px;
        background: linear-gradient(90deg, #FFD700, #FF6B35);
        color: #fff;
        font-size: 13px;
        font-weight: 700;
        animation: rare-label-shine 1.5s infinite;
      }
      @keyframes rare-label-shine {
        0%, 100% { filter: brightness(1); }
        50%      { filter: brightness(1.3); }
      }
      .badge-unlock-close {
        margin-top: var(--space-lg);
        padding: 8px 32px;
        background: transparent;
        border: 1px solid var(--color-gold);
        color: var(--color-gold);
        border-radius: var(--border-radius-sm);
        cursor: pointer;
        font-size: 14px;
        transition: all var(--transition-fast);
      }
      .badge-unlock-close:hover {
        background: var(--color-gold);
        color: #fff;
      }

      /* === 高亮动画 === */
      @keyframes badge-highlight-pulse {
        0%   { box-shadow: 0 0 0 0 rgba(201, 162, 39, 0.6); }
        50%  { box-shadow: 0 0 0 12px rgba(201, 162, 39, 0); }
        100% { box-shadow: 0 0 0 0 rgba(201, 162, 39, 0); }
      }
      @keyframes pulse-gold {
        0%, 100% { box-shadow: 0 0 8px rgba(201, 162, 39, 0.3); }
        50%      { box-shadow: 0 0 20px rgba(201, 162, 39, 0.6); }
      }
      @keyframes legendary-glow {
        0%   { box-shadow: 0 0 8px rgba(255, 215, 0, 0.3); border-color: #FFD700; }
        33%  { box-shadow: 0 0 20px rgba(255, 107, 53, 0.4); border-color: #FF6B35; }
        66%  { box-shadow: 0 0 20px rgba(255, 215, 0, 0.4); border-color: #FFD700; }
        100% { box-shadow: 0 0 8px rgba(255, 215, 0, 0.3); border-color: #FFD700; }
      }

      /* === AI建议面板 === */
      .badge-ai-suggestions {
        background: linear-gradient(135deg, rgba(201,162,39,0.08), rgba(139,69,19,0.05));
        border: 1px dashed var(--border-gold);
        border-radius: var(--border-radius);
        padding: var(--space-md);
        margin-top: var(--space-md);
      }
      .badge-ai-suggestions h4 {
        font-size: 14px;
        color: var(--color-gold);
        margin-bottom: var(--space-sm);
        font-family: var(--font-display);
      }
      .badge-suggestion-item {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: 8px 12px;
        background: var(--bg-card);
        border-radius: var(--border-radius-sm);
        margin-bottom: 6px;
        cursor: pointer;
        transition: all var(--transition-fast);
        border: 1px solid transparent;
      }
      .badge-suggestion-item:hover {
        border-color: var(--color-gold);
        transform: translateX(4px);
      }
      .badge-suggestion-icon {
        font-size: 20px;
      }
      .badge-suggestion-info {
        flex: 1;
      }
      .badge-suggestion-name {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary);
      }
      .badge-suggestion-desc {
        font-size: 11px;
        color: var(--text-muted);
      }
      .badge-suggestion-add {
        padding: 4px 12px;
        background: var(--color-gold);
        color: #fff;
        border-radius: var(--border-radius-sm);
        font-size: 12px;
        cursor: pointer;
        border: none;
      }

      /* === 导出/导入面板 === */
      .badge-io-panel {
        margin-top: var(--space-lg);
        padding: var(--space-md);
        background: var(--bg-parchment);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
      }
      .badge-io-textarea {
        width: 100%;
        min-height: 120px;
        padding: var(--space-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-sm);
        background: var(--bg-input);
        color: var(--text-primary);
        font-family: var(--font-mono);
        font-size: 12px;
        resize: vertical;
      }

      /* === 隐藏成就占位 === */
      .badge-secret-placeholder {
        background: var(--bg-input);
        border: 2px dashed var(--border-color);
        border-radius: var(--border-radius-lg);
        padding: var(--space-lg);
        text-align: center;
        color: var(--text-muted);
        font-size: 13px;
      }
      .badge-secret-placeholder::before {
        content: '?';
        display: block;
        font-size: 40px;
        margin-bottom: var(--space-sm);
        opacity: 0.3;
      }
    `;
    document.head.appendChild(style);
  },

  // =========================================================
  // 页面渲染
  // =========================================================
    // 渲染页面主结构
  renderPage() {
    // 渲染页面主结构
    const page = document.getElementById('page-badge-wall');
    if (!page) return;
    page.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
      <div class="badge-wall-container">
        <!-- 标题区 -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);">
          <h2 class="section-title">🏅 成就徽章墙</h2>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-sm btn-secondary" onclick="BadgeWall.toggleLayout()">📐 切换布局</button>
            <button class="btn btn-sm btn-primary" onclick="BadgeWall.openManager()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 管理成就</button>
          </div>
        </div>

        <!-- 统计面板 -->
        <div id="badgeStatsPanel" class="badge-stats-panel"></div>

        <!-- 筛选工具栏 -->
        <div class="badge-toolbar">
          <div class="badge-filter-group">
            <span class="badge-filter-label">分类：</span>
            <button class="badge-filter-btn active" data-filter="category" data-value="all" onclick="BadgeWall.setFilter('category','all')">全部</button>
            <div id="badgeCategoryFilters"></div>
          </div>
          <div class="badge-filter-group">
            <span class="badge-filter-label">稀有度：</span>
            <button class="badge-filter-btn active" data-filter="rarity" data-value="all" onclick="BadgeWall.setFilter('rarity','all')">全部</button>
            <div id="badgeRarityFilters"></div>
          </div>
          <div class="badge-filter-group">
            <span class="badge-filter-label">状态：</span>
            <button class="badge-filter-btn active" data-filter="status" data-value="all" onclick="BadgeWall.setFilter('status','all')">全部</button>
            <button class="badge-filter-btn" data-filter="status" data-value="unlocked" onclick="BadgeWall.setFilter('status','unlocked')">已解锁</button>
            <button class="badge-filter-btn" data-filter="status" data-value="locked" onclick="BadgeWall.setFilter('status','locked')">未解锁</button>
          </div>
        </div>

        <!-- 徽章网格 -->
        <div id="badgeGrid" class="badge-grid"></div>

        <!-- 空状态 -->
        <div id="badgeEmptyState" style="display:none;text-align:center;padding:var(--space-2xl);">
          <div style="font-size:48px;margin-bottom:var(--space-md);">🏅</div>
          <h3 style="font-family:var(--font-display);color:var(--text-secondary);margin-bottom:var(--space-sm);">暂无成就</h3>
          <p style="color:var(--text-muted);font-size:14px;">点击下方按钮创建你的第一个成就，或让AI为你生成建议！</p>
          <button class="btn btn-primary" style="margin-top:var(--space-md);" onclick="BadgeWall.openManager()">创建成就</button>
        </div>
      </div>
    `;
    this.renderStatsPanel();
    this.renderFilters();
    this.renderBadgeGrid();
  },

  // =========================================================
  // 统计面板渲染
  // =========================================================
  renderStatsPanel() {
    const panel = document.getElementById('badgeStatsPanel');
    if (!panel) return;
    const total = this._achievements.length;
    const unlocked = this._unlockedIds.size;
    const locked = total - unlocked;
    const completionRate = total > 0 ? Math.round((unlocked / total) * 100) : 0;

    // 按稀有度统计
    const rarityCounts = {};
    Object.keys(this._rarities).forEach(r => rarityCounts[r] = { total: 0, unlocked: 0 });
    this._achievements.forEach(a => {
      if (rarityCounts[a.rarity]) {
        rarityCounts[a.rarity].total++;
        if (this._unlockedIds.has(a.id)) rarityCounts[a.rarity].unlocked++;
      }
    });

    let rarityStatsHtml = '';
    Object.entries(this._rarities).forEach(([key, info]) => {
      const rc = rarityCounts[key] || { total: 0, unlocked: 0 };
      if (rc.total > 0) {
        rarityStatsHtml += `
          <div class="badge-stat-item">
            <div class="badge-stat-number" style="color:${info.color};">${rc.unlocked}/${rc.total}</div>
            <div class="badge-stat-label">${info.name}</div>
          </div>
        `;
      }
    });

    panel.innerHTML = `
      <div class="badge-stat-item">
        <div class="badge-stat-number">${total}</div>
        <div class="badge-stat-label">总成就数</div>
      </div>
      <div class="badge-stat-item">
        <div class="badge-stat-number" style="color:#27AE60;">${unlocked}</div>
        <div class="badge-stat-label">已解锁</div>
      </div>
      <div class="badge-stat-item">
        <div class="badge-stat-number" style="color:#E74C3C;">${locked}</div>
        <div class="badge-stat-label">未解锁</div>
      </div>
      ${rarityStatsHtml}
      <div class="badge-completion-bar">
        <div class="badge-completion-track">
          <div class="badge-completion-fill" style="width:${completionRate}%;"></div>
        </div>
        <div class="badge-completion-text">完成率：${completionRate}%${completionRate === 100 ? ' — 恭喜达成全成就！<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>' : ''}</div>
      </div>
    `;
  },

  // =========================================================
  // 筛选器渲染
  // =========================================================
  renderFilters() {
    // 分类筛选（动态从成就中提取）
    const categories = [...new Set(this._achievements.map(a => a.category))];
    const catContainer = document.getElementById('badgeCategoryFilters');
    if (catContainer) {
      catContainer.innerHTML = categories.map(cat =>
        `<button class="badge-filter-btn" data-filter="category" data-value="${cat}" onclick="BadgeWall.setFilter('category','${cat}')">${cat}</button>`
      ).join('');
    }

    // 稀有度筛选
    const rarityContainer = document.getElementById('badgeRarityFilters');
    if (rarityContainer) {
      rarityContainer.innerHTML = Object.entries(this._rarities).map(([key, info]) =>
        `<button class="badge-filter-btn" data-filter="rarity" data-value="${key}" onclick="BadgeWall.setFilter('rarity','${key}')" style="color:${info.color};">${info.name}</button>`
      ).join('');
    }
  },

  // =========================================================
  // 筛选逻辑
  // =========================================================
  setFilter(type, value) {
    this._filter[type] = value;
    // 更新按钮激活状态
    document.querySelectorAll(`[data-filter="${type}"]`).forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === value);
    });
    this.renderBadgeGrid();
  },

  _layoutMode: 'grid',
  toggleLayout() {
    this._layoutMode = this._layoutMode === 'grid' ? 'waterfall' : 'grid';
    const grid = document.getElementById('badgeGrid');
    if (grid) {
      grid.classList.toggle('waterfall', this._layoutMode === 'waterfall');
    }
  },

  // =========================================================
  // 徽章网格渲染
  // =========================================================
  renderBadgeGrid() {
    const grid = document.getElementById('badgeGrid');
    const emptyState = document.getElementById('badgeEmptyState');
    if (!grid) return;

    if (this._achievements.length === 0) {
      grid.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }
    if (emptyState) emptyState.style.display = 'none';

    // 筛选
    let items = this._achievements.filter(a => {
      if (a.isSecret && !this._unlockedIds.has(a.id)) return false; // 隐藏未解锁的不显示
      if (this._filter.category !== 'all' && a.category !== this._filter.category) return false;
      if (this._filter.rarity !== 'all' && a.rarity !== this._filter.rarity) return false;
      if (this._filter.status !== 'all') {
        const isUnlocked = this._unlockedIds.has(a.id);
        if (this._filter.status === 'unlocked' && !isUnlocked) return false;
        if (this._filter.status === 'locked' && isUnlocked) return false;
      }
      return true;
    });

    // 排序
    const rarityOrder = Object.keys(this._rarities);
    items.sort((a, b) => {
      if (this._sortMode === 'rarity') {
        return rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity);
      }
      if (this._sortMode === 'name') return a.name.localeCompare(b.name);
      if (this._sortMode === 'date') {
        const da = a.unlockedAt ? new Date(a.unlockedAt) : new Date(0);
        const db = b.unlockedAt ? new Date(b.unlockedAt) : new Date(0);
        return db - da;
      }
      return 0; // default: 按创建顺序
    });

    grid.innerHTML = items.map(a => this._renderBadgeCard(a)).join('');
  },

  _renderBadgeCard(achievement) {
    const isUnlocked = this._unlockedIds.has(achievement.id);
    const rarityInfo = this._rarities[achievement.rarity] || this._rarities.bronze;
    const customStyle = achievement.customStyle || '';

    if (achievement.isSecret && !isUnlocked) {
      return `<div class="badge-secret-placeholder">隐藏成就<br><small>解锁后可见</small></div>`;
    }

    return `
      <div id="badge-${achievement.id}"
           class="badge-card rarity-${achievement.rarity} ${isUnlocked ? '' : 'locked'}"
           style="${customStyle}"
           onclick="BadgeWall.showBadgeDetail('${achievement.id}')">
        <div class="badge-icon-wrap">${isUnlocked ? achievement.icon : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>'}</div>
        <div class="badge-name">${achievement.name}</div>
        <div class="badge-desc">${achievement.description}</div>
        <div>
          <span class="badge-category-tag">${achievement.category}</span>
        </div>
        <div>
          <span class="badge-rarity-tag rarity-${achievement.rarity}">${rarityInfo.name}</span>
        </div>
        ${isUnlocked && achievement.unlockedAt ?
          `<div class="badge-unlock-date"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2 7h7l-5.5 4 2 7-5.5-4-5.5 4 2-7L3 9h7z"/></svg> ${new Date(achievement.unlockedAt).toLocaleDateString('zh-CN')} 解锁</div>` : ''}
        ${!isUnlocked ? `<div class="badge-locked-mask"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div>` : ''}
      </div>
    `;
  },

  // =========================================================
  // 成就详情弹窗
  // =========================================================
  showBadgeDetail(id) {
    const a = this._achievements.find(x => x.id === id);
    if (!a) return;
    const isUnlocked = this._unlockedIds.has(id);
    const rarityInfo = this._rarities[a.rarity] || this._rarities.bronze;

    const conditionText = this._formatCondition(a.unlockCondition);

    const detailHtml = `
      <div class="badge-manager-panel" onclick="if(event.target===this)BadgeWall.closeManager()">
        <div class="badge-manager-content" style="max-width:480px;">
          <div style="text-align:center;margin-bottom:var(--space-lg);">
            <div class="badge-icon-wrap" style="width:96px;height:96px;font-size:48px;margin-bottom:var(--space-md);
              ${isUnlocked ? '' : 'filter:grayscale(1);opacity:0.6;'}">
              ${isUnlocked ? a.icon : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>'}
            </div>
            <h3 style="font-family:var(--font-display);font-size:22px;color:var(--text-primary);">${a.name}</h3>
            <p style="color:var(--text-muted);font-size:14px;margin-top:4px;">${a.description}</p>
            <div style="margin-top:var(--space-sm);">
              <span class="badge-rarity-tag rarity-${a.rarity}">${rarityInfo.name}</span>
              <span class="badge-category-tag">${a.category}</span>
            </div>
          </div>

          <div style="background:var(--bg-parchment);border-radius:var(--border-radius);padding:var(--space-md);margin-bottom:var(--space-md);">
            <h4 style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;">🔓 解锁条件</h4>
            <p style="font-size:13px;color:var(--text-primary);line-height:1.6;">${conditionText}</p>
          </div>

          ${isUnlocked ? `
            <div style="text-align:center;color:var(--color-gold);font-size:14px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2 7h7l-5.5 4 2 7-5.5-4-5.5 4 2-7L3 9h7z"/></svg> 已于 ${new Date(a.unlockedAt).toLocaleString('zh-CN')} 解锁
            </div>
          ` : `
            <div style="text-align:center;color:var(--text-muted);font-size:14px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> 尚未解锁 — 达成条件后自动解锁
            </div>
          `}

          <div class="badge-btn-group">
            <button class="badge-btn badge-btn-secondary" onclick="BadgeWall.closeManager()">关闭</button>
            <button class="badge-btn badge-btn-primary" onclick="BadgeWall.editBadge('${a.id}')">编辑</button>
            <button class="badge-btn badge-btn-danger" onclick="BadgeWall.deleteBadge('${a.id}')">删除</button>
          </div>
        </div>
      </div>
    `;
    this._showModal(detailHtml);
  },

  _formatCondition(condition) {
    if (!condition) return '无特定条件';
    if (typeof condition === 'string') return condition;
    if (condition.type && condition.value !== undefined) {
      const ct = this._conditionTypes.find(c => c.id === condition.type);
      return `${ct ? ct.name : condition.type} ≥ ${condition.value}`;
    }
    if (condition.and) {
      return condition.and.map(c => this._formatCondition(c)).join(' 且 ');
    }
    if (condition.or) {
      return condition.or.map(c => this._formatCondition(c)).join(' 或 ');
    }
    return JSON.stringify(condition);
  },

  // =========================================================
  // 成就管理面板（创建/编辑）
  // =========================================================
  openManager() {
    this._editingId = null;
    this._renderManagerPanel();
  },

  editBadge(id) {
    this._editingId = id;
    this._renderManagerPanel();
  },

  _renderManagerPanel() {
    const isEdit = !!this._editingId;
    const a = isEdit ? this._achievements.find(x => x.id === this._editingId) : null;

    const rarityOptions = Object.entries(this._rarities).map(([key, info]) =>
      `<option value="${key}" ${a && a.rarity === key ? 'selected' : ''}>${info.name} (${key})</option>`
    ).join('');

    const conditionHtml = isEdit && a ? this._renderConditionBuilder(a.unlockCondition) : this._renderConditionBuilder();

    const panelHtml = `
      <div class="badge-manager-panel" id="badgeManagerPanel" onclick="if(event.target===this)BadgeWall.closeManager()">
        <div class="badge-manager-content">
          <h3 class="badge-manager-title">${isEdit ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> 编辑成就' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 创建新成就'}</h3>

          <div class="badge-form-row">
            <label class="badge-form-label">成就名称 *</label>
            <input type="text" id="badgeFormName" class="badge-form-input" value="${a ? a.name : ''}" placeholder="例如：初出茅庐">
          </div>

          <div class="badge-form-row">
            <label class="badge-form-label">描述</label>
            <textarea id="badgeFormDesc" class="badge-form-textarea" placeholder="成就的详细描述">${a ? a.description : ''}</textarea>
          </div>

          <div class="badge-form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);">
            <div>
              <label class="badge-form-label">分类</label>
              <input type="text" id="badgeFormCategory" class="badge-form-input" value="${a ? a.category : '自定义'}" placeholder="例如：剧情/收集/探索">
            </div>
            <div>
              <label class="badge-form-label">稀有度</label>
              <select id="badgeFormRarity" class="badge-form-select">${rarityOptions}</select>
            </div>
          </div>

          <div class="badge-form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);">
            <div>
              <label class="badge-form-label">图标 (Emoji)</label>
              <input type="text" id="badgeFormIcon" class="badge-form-input" value="${a ? a.icon : '🏅'}" placeholder="例如：<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/></svg>">
            </div>
            <div>
              <label class="badge-form-label">隐藏成就</label>
              <label style="display:flex;align-items:center;gap:6px;cursor:pointer;margin-top:8px;">
                <input type="checkbox" id="badgeFormSecret" ${a && a.isSecret ? 'checked' : ''}>
                <span style="font-size:13px;color:var(--text-secondary);">达成前不显示</span>
              </label>
            </div>
          </div>

          <div class="badge-form-row">
            <label class="badge-form-label">自定义CSS样式（可选）</label>
            <textarea id="badgeFormStyle" class="badge-form-textarea" placeholder="例如：border: 2px solid red;">${a ? a.customStyle || '' : ''}</textarea>
            <div class="badge-form-hint">可为该徽章添加特殊的CSS样式</div>
          </div>

          <div class="badge-form-row">
            <label class="badge-form-label">解锁条件配置</label>
            <div id="badgeConditionBuilder" class="badge-condition-builder">
              ${conditionHtml}
            </div>
            <div class="badge-form-hint">选择条件类型并输入目标值，支持组合条件</div>
          </div>

          <!-- AI建议区 -->
          <div class="badge-ai-suggestions" style="display:none;" id="badgeAiSuggestions"></div>

          <div class="badge-btn-group">
            <button class="badge-btn badge-btn-secondary" onclick="BadgeWall.closeManager()">取消</button>
            <button class="badge-btn badge-btn-primary" onclick="BadgeWall.saveBadge()">${isEdit ? '保存修改' : '创建成就'}</button>
          </div>

          <div class="badge-io-panel">
            <h4 style="font-size:14px;color:var(--text-secondary);margin-bottom:var(--space-sm);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg> 批量操作</h4>
            <div style="display:flex;gap:var(--space-sm);margin-bottom:var(--space-sm);flex-wrap:wrap;">
              <button class="badge-btn badge-btn-secondary" onclick="BadgeWall.exportBadges()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> 导出成就列表</button>
              <button class="badge-btn badge-btn-secondary" onclick="BadgeWall.showImportPanel()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> 导入成就列表</button>
              <button class="badge-btn badge-btn-secondary" onclick="BadgeWall.generateAiSuggestions()">🤖 AI生成建议</button>
            </div>
            <div id="badgeIoArea" style="display:none;">
              <textarea id="badgeIoTextarea" class="badge-io-textarea" placeholder="在此处粘贴JSON数据..."></textarea>
              <div class="badge-btn-group" style="margin-top:var(--space-sm);">
                <button class="badge-btn badge-btn-primary" onclick="BadgeWall.importBadges()">确认导入</button>
                <button class="badge-btn badge-btn-secondary" onclick="document.getElementById('badgeIoArea').style.display='none'">取消</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    this._showModal(panelHtml);
  },

  // =========================================================
  // 条件构建器UI
  // =========================================================
  _renderConditionBuilder(existingCondition) {
    const typeOptions = this._conditionTypes.map(ct =>
      `<option value="${ct.id}">${ct.icon} ${ct.name}</option>`
    ).join('');

    if (existingCondition && (existingCondition.and || existingCondition.or)) {
      // 组合条件渲染（简化版，支持一层的and/or）
      const conn = existingCondition.and ? 'and' : 'or';
      const list = existingCondition[conn];
      return `
        <div id="conditionRows">
          ${list.map((c, i) => `
            <div class="badge-condition-row" data-index="${i}">
              <select class="cond-type" style="flex:2;">
                ${this._conditionTypes.map(ct =>
                  `<option value="${ct.id}" ${c.type === ct.id ? 'selected' : ''}>${ct.icon} ${ct.name}</option>`
                ).join('')}
              </select>
              <span style="color:var(--text-muted);">≥</span>
              <input type="number" class="cond-value" value="${c.value || 1}" min="1" style="flex:1;">
              <button class="badge-btn badge-btn-danger" style="padding:4px 10px;font-size:12px;" onclick="this.parentElement.remove()">✕</button>
            </div>
          `).join('')}
        </div>
        <div class="badge-condition-connector">
          <label><input type="radio" name="condConnector" value="and" ${conn === 'and' ? 'checked' : ''}> 且（全部满足）</label>
          <label><input type="radio" name="condConnector" value="or" ${conn === 'or' ? 'checked' : ''}> 或（任一满足）</label>
        </div>
        <button class="badge-btn badge-btn-secondary" style="width:100%;margin-top:var(--space-sm);" onclick="BadgeWall.addConditionRow()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 添加条件</button>
      `;
    }

    // 单个条件或空
    const singleType = existingCondition && existingCondition.type ? existingCondition.type : '';
    const singleValue = existingCondition && existingCondition.value ? existingCondition.value : 1;

    return `
      <div id="conditionRows">
        <div class="badge-condition-row">
          <select class="cond-type" style="flex:2;">
            <option value="">-- 选择条件 --</option>
            ${typeOptions}
          </select>
          <span style="color:var(--text-muted);">≥</span>
          <input type="number" class="cond-value" value="${singleValue}" min="1" style="flex:1;">
        </div>
      </div>
      <div class="badge-condition-connector">
        <label><input type="radio" name="condConnector" value="and" checked> 且（全部满足）</label>
        <label><input type="radio" name="condConnector" value="or"> 或（任一满足）</label>
      </div>
      <button class="badge-btn badge-btn-secondary" style="width:100%;margin-top:var(--space-sm);" onclick="BadgeWall.addConditionRow()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 添加条件</button>
    `;
  },

  addConditionRow() {
    const container = document.getElementById('conditionRows');
    if (!container) return;
    const typeOptions = this._conditionTypes.map(ct =>
      `<option value="${ct.id}">${ct.icon} ${ct.name}</option>`
    ).join('');
    const row = document.createElement('div');
    row.className = 'badge-condition-row';
    row.innerHTML = `
      <select class="cond-type" style="flex:2;"><option value="">-- 选择条件 --</option>${typeOptions}</select>
      <span style="color:var(--text-muted);">≥</span>
      <input type="number" class="cond-value" value="1" min="1" style="flex:1;">
      <button class="badge-btn badge-btn-danger" style="padding:4px 10px;font-size:12px;" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(row);
  },

  _collectConditionFromForm() {
    const rows = document.querySelectorAll('#conditionRows .badge-condition-row');
    if (rows.length === 0) return null;

    const conditions = [];
    rows.forEach(row => {
      const type = row.querySelector('.cond-type')?.value;
      const value = parseInt(row.querySelector('.cond-value')?.value || '1', 10);
      if (type) conditions.push({ type, value });
    });

    if (conditions.length === 0) return null;
    if (conditions.length === 1) return conditions[0];

    const connector = document.querySelector('input[name="condConnector"]:checked')?.value || 'and';
    return { [connector]: conditions };
  },

  // =========================================================
  // 保存成就
  // =========================================================
  saveBadge() {
    const name = document.getElementById('badgeFormName')?.value.trim();
    if (!name) { App.toast('请输入成就名称', 'error'); return; }

    const desc = document.getElementById('badgeFormDesc')?.value.trim() || '';
    const category = document.getElementById('badgeFormCategory')?.value.trim() || '自定义';
    const rarity = document.getElementById('badgeFormRarity')?.value || 'bronze';
    const icon = document.getElementById('badgeFormIcon')?.value.trim() || '🏅';
    const isSecret = document.getElementById('badgeFormSecret')?.checked || false;
    const customStyle = document.getElementById('badgeFormStyle')?.value.trim() || '';
    const unlockCondition = this._collectConditionFromForm();

    if (this._editingId) {
      // 编辑模式
      const idx = this._achievements.findIndex(x => x.id === this._editingId);
      if (idx >= 0) {
        const old = this._achievements[idx];
        this._achievements[idx] = {
          ...old,
          name, description: desc, category, rarity, icon,
          isSecret, customStyle, unlockCondition
        };
        App.toast('成就已更新', 'success');
      }
    } else {
      // 创建模式
      const id = 'badge_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      this._achievements.push({
        id, name, description: desc, category, rarity, icon,
        unlockCondition, unlockedAt: null, isSecret, customStyle
      });
      App.toast('新成就已创建', 'success');
    }

    this._saveData();
    this.closeManager();
    this.renderStatsPanel();
    this.renderFilters();
    this.renderBadgeGrid();
  },

  // =========================================================
  // 删除成就
  // =========================================================
  deleteBadge(id) {
    if (!confirm('确定要删除这个成就吗？此操作不可撤销。')) return;
    this._achievements = this._achievements.filter(a => a.id !== id);
    this._unlockedIds.delete(id);
    this._saveData();
    this.closeManager();
    this.renderStatsPanel();
    this.renderFilters();
    this.renderBadgeGrid();
    App.toast('成就已删除', 'info');
  },

  // =========================================================
  // AI生成成就建议
  // =========================================================
  generateAiSuggestions() {
    const container = document.getElementById('badgeAiSuggestions');
    if (!container) return;

    // 基于现有内容智能生成建议
    const existingCategories = [...new Set(this._achievements.map(a => a.category))];
    const hasStory = existingCategories.includes('剧情') || existingCategories.includes('story');
    const hasExplore = existingCategories.includes('探索') || existingCategories.includes('explore');

    const suggestions = [
      { name: '初次邂逅', desc: '与第一个NPC建立联系', icon: '👋', category: '社交', rarity: 'bronze', condition: { type: 'talk_npc', value: 1 } },
      { name: '收藏家', desc: '收集10个珍贵物品', icon: '💎', category: '收集', rarity: 'silver', condition: { type: 'collect_items', value: 10 } },
      { name: '世界旅人', desc: '访问所有已解锁地点', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>', category: '探索', rarity: 'gold', condition: { type: 'visit_locations', value: 5 } },
      { name: '速读达人', desc: '一天内完成5章剧情', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>', category: '挑战', rarity: 'silver', condition: { type: 'custom_event', value: 5 } },
      { name: '完美主义者', desc: '达成所有完美结局', icon: '💯', category: '剧情', rarity: 'legendary', condition: { type: 'custom_event', value: 1 } },
      { name: '坚持不懈', desc: '连续登录7天', icon: '🔥', category: '挑战', rarity: 'bronze', condition: { type: 'login_streak', value: 7 } },
      { name: '社交达人', desc: '与20个NPC对话', icon: '🦋', category: '社交', rarity: 'gold', condition: { type: 'talk_npc', value: 20 } },
      { name: '时间管理大师', desc: '累计游戏时长超过24小时', icon: '⏳', category: '挑战', rarity: 'silver', condition: { type: 'playtime_hours', value: 24 } },
      { name: '隐藏剧情发现者', desc: '触发隐藏剧情线', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>', category: '探索', rarity: 'gold', condition: { type: 'custom_event', value: 1 } },
      { name: '传说级冒险家', desc: '完成所有类型成就各一个', icon: '👑', category: '挑战', rarity: 'legendary', condition: { type: 'custom_event', value: 1 } }
    ];

    // 过滤掉已有相似名称的
    const existingNames = new Set(this._achievements.map(a => a.name));
    const filtered = suggestions.filter(s => !existingNames.has(s.name));

    container.style.display = 'block';
    container.innerHTML = `
      <h4>🤖 AI成就建议</h4>
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:var(--space-sm);">根据你现有的${this._achievements.length}个成就，推荐以下有趣成就：</p>
      ${filtered.slice(0, 8).map(s => `
        <div class="badge-suggestion-item" onclick="BadgeWall.addSuggestion(this)">
          <span class="badge-suggestion-icon">${s.icon}</span>
          <div class="badge-suggestion-info">
            <div class="badge-suggestion-name">${s.name}</div>
            <div class="badge-suggestion-desc">${s.desc} — ${this._rarities[s.rarity]?.name || s.rarity}</div>
          </div>
          <button class="badge-suggestion-add" onclick="event.stopPropagation();BadgeWall.addSuggestionByData(${JSON.stringify(s).replace(/"/g, '&quot;')})">添加</button>
        </div>
      `).join('')}
    `;
  },

  addSuggestion(el) {
    // 从DOM提取数据添加
    const icon = el.querySelector('.badge-suggestion-icon')?.textContent || '🏅';
    const name = el.querySelector('.badge-suggestion-name')?.textContent || '';
    const descFull = el.querySelector('.badge-suggestion-desc')?.textContent || '';
    const desc = descFull.split(' — ')[0] || descFull;

    this._quickAddBadge(name, desc, icon, '自定义', 'bronze');
  },

  addSuggestionByData(dataStr) {
    try {
      const s = JSON.parse(dataStr);
      this._quickAddBadge(s.name, s.desc, s.icon, s.category, s.rarity, s.condition);
    } catch (e) {
      App.toast('添加失败', 'error');
    }
  },

  _quickAddBadge(name, desc, icon, category, rarity, condition) {
    const id = 'badge_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    this._achievements.push({
      id, name, description: desc, category, rarity, icon,
      unlockCondition: condition || { type: 'custom_event', value: 1 },
      unlockedAt: null, isSecret: false, customStyle: ''
    });
    this._saveData();
    this.renderStatsPanel();
    this.renderFilters();
    this.renderBadgeGrid();
    App.toast(`已添加成就：${name}`, 'success');
  },

  // =========================================================
  // 导出 / 导入
  // =========================================================
  exportBadges() {
    const data = {
      version: 12,
      exportDate: new Date().toISOString(),
      achievements: this._achievements,
      rarities: this._rarities,
      conditionTypes: this._conditionTypes,
      unlockedIds: Array.from(this._unlockedIds)
    };
    const json = JSON.stringify(data, null, 2);

    const textarea = document.getElementById('badgeIoTextarea');
    const area = document.getElementById('badgeIoArea');
    if (textarea && area) {
      textarea.value = json;
      area.style.display = 'block';
      textarea.select();
      App.toast('成就数据已填入文本框，请复制保存', 'info');
    }
  },

  showImportPanel() {
    const area = document.getElementById('badgeIoArea');
    if (area) {
      area.style.display = 'block';
      document.getElementById('badgeIoTextarea')?.focus();
    }
  },

  importBadges() {
    const textarea = document.getElementById('badgeIoTextarea');
    if (!textarea) return;
    const raw = textarea.value.trim();
    if (!raw) { App.toast('请先粘贴数据', 'error'); return; }

    try {
      const data = JSON.parse(raw);
      if (!data.achievements || !Array.isArray(data.achievements)) {
        throw new Error('数据格式不正确');
      }

      // 合并策略：按名称去重，保留现有数据
      const existingNames = new Set(this._achievements.map(a => a.name));
      let added = 0;
      data.achievements.forEach(a => {
        if (!existingNames.has(a.name)) {
          a.id = a.id || ('badge_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8));
          a.unlockedAt = null; // 导入时不保留解锁状态
          this._achievements.push(a);
          existingNames.add(a.name);
          added++;
        }
      });

      // 合并稀有度和条件类型（保留用户已有 + 导入新增）
      if (data.rarities) {
        Object.entries(data.rarities).forEach(([k, v]) => {
          if (!this._rarities[k]) this._rarities[k] = v;
        });
      }
      if (data.conditionTypes) {
        const existingIds = new Set(this._conditionTypes.map(c => c.id));
        data.conditionTypes.forEach(c => {
          if (!existingIds.has(c.id)) {
            this._conditionTypes.push(c);
            existingIds.add(c.id);
          }
        });
      }

      this._saveData();
      this.closeManager();
      this.renderStatsPanel();
      this.renderFilters();
      this.renderBadgeGrid();
      App.toast(`成功导入 ${added} 个新成就`, 'success');
    } catch (e) {
      App.toast('导入失败：' + e.message, 'error');
    }
  },

  // =========================================================
  // 稀有度管理（用户可添加自定义稀有度）
  // =========================================================
  addCustomRarity(key, name, color, borderColor, animation) {
    if (!key || !name || !color) { App.toast('请提供稀有度键名、名称和颜色', 'error'); return; }
    this._rarities[key] = {
      name, color, borderColor: borderColor || color,
      glow: animation ? 'custom' : 'none', animation: animation || 'none'
    };
    this._saveData();
    this.renderFilters();
    this.renderBadgeGrid();
    App.toast(`已添加稀有度：${name}`, 'success');
  },

  removeCustomRarity(key) {
    if (this.DEFAULT_RARITIES[key]) { App.toast('不能删除默认稀有度', 'error'); return; }
    const hasBadges = this._achievements.some(a => a.rarity === key);
    if (hasBadges) { App.toast('请先删除使用该稀有度的成就', 'error'); return; }
    delete this._rarities[key];
    this._saveData();
    this.renderFilters();
    this.renderBadgeGrid();
    App.toast('稀有度已删除', 'info');
  },

  // =========================================================
  // 条件类型管理（用户可添加自定义条件）
  // =========================================================
  addCustomConditionType(id, name, icon, desc) {
    if (!id || !name) { App.toast('请提供条件ID和名称', 'error'); return; }
    if (this._conditionTypes.some(c => c.id === id)) { App.toast('该条件类型已存在', 'error'); return; }
    this._conditionTypes.push({ id, name: name, icon: icon || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>', desc: desc || '' });
    this._saveData();
    App.toast(`已添加条件类型：${name}`, 'success');
  },

  // =========================================================
  // 解锁成就
  // =========================================================
  unlock(achievementId, skipAnimation = false) {
    if (this._unlockedIds.has(achievementId)) return false; // 已解锁

    const a = this._achievements.find(x => x.id === achievementId);
    if (!a) return false;

    // 更新状态
    a.unlockedAt = new Date().toISOString();
    this._unlockedIds.add(achievementId);
    this._saveData();

    // 更新UI
    this.renderStatsPanel();
    this.renderBadgeGrid();

    // 播放解锁动画
    if (!skipAnimation) {
      this._playUnlockAnimation(a);
    }

    return true;
  },

  // =========================================================
  // 检查并自动解锁（根据游戏事件触发）
  // =========================================================
  checkUnlocks(gameStats) {
    // gameStats 格式：{ level, tasksCompleted, npcTalked, itemsCollected, locationsVisited, playtimeHours, loginStreak, customEvents }
    if (!gameStats) return;

    const newlyUnlocked = [];
    this._achievements.forEach(a => {
      if (this._unlockedIds.has(a.id)) return;
      if (this._evaluateCondition(a.unlockCondition, gameStats)) {
        if (this.unlock(a.id)) {
          newlyUnlocked.push(a);
        }
      }
    });

    return newlyUnlocked;
  },

  _evaluateCondition(condition, stats) {
    if (!condition) return true;
    if (typeof condition === 'string') return false; // 字符串条件不支持自动评估

    if (condition.and) {
      return condition.and.every(c => this._evaluateSingleCondition(c, stats));
    }
    if (condition.or) {
      return condition.or.some(c => this._evaluateSingleCondition(c, stats));
    }
    return this._evaluateSingleCondition(condition, stats);
  },

  _evaluateSingleCondition(condition, stats) {
    const val = condition.value || 1;
    switch (condition.type) {
      case 'reach_level':       return (stats.level || 0) >= val;
      case 'complete_tasks':    return (stats.tasksCompleted || 0) >= val;
      case 'talk_npc':          return (stats.npcTalked || 0) >= val;
      case 'collect_items':     return (stats.itemsCollected || 0) >= val;
      case 'visit_locations':   return (stats.locationsVisited || 0) >= val;
      case 'playtime_hours':    return (stats.playtimeHours || 0) >= val;
      case 'login_streak':      return (stats.loginStreak || 0) >= val;
      case 'custom_event':      return (stats.customEvents || []).includes(condition.eventName || val);
      default: return false;
    }
  },

  // =========================================================
  // 解锁动画系统
  // =========================================================
  _playUnlockAnimation(achievement) {
    const rarityInfo = this._rarities[achievement.rarity] || this._rarities.bronze;

    // 创建全屏遮罩
    const overlay = document.createElement('div');
    overlay.className = 'badge-unlock-overlay';
    overlay.innerHTML = `
      <div class="badge-unlock-pulse"></div>
      <div class="badge-unlock-card">
        <div class="badge-unlock-icon">${achievement.icon}</div>
        <div class="badge-unlock-name">${achievement.name}</div>
        <div class="badge-unlock-desc">${achievement.description}</div>
        ${achievement.rarity === 'gold' || achievement.rarity === 'legendary' ?
          `<div class="badge-unlock-rare-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2 7h7l-5.5 4 2 7-5.5-4-5.5 4 2-7L3 9h7z"/></svg> 稀有成就！</div>` : ''}
        <button class="badge-unlock-close" onclick="BadgeWall._closeUnlockAnimation()">太棒了！</button>
      </div>
    `;
    document.body.appendChild(overlay);
    this._currentUnlockOverlay = overlay;

    // 音效提示（如果用户启用了音效）
    this._playUnlockSound(achievement.rarity);

    // 自动滚动并高亮徽章
    setTimeout(() => this._scrollToBadge(achievement.id), 800);
  },

  _closeUnlockAnimation() {
    if (this._currentUnlockOverlay) {
      this._currentUnlockOverlay.style.animation = 'unlock-fade-in 0.3s ease-out reverse';
      setTimeout(() => {
        this._currentUnlockOverlay?.remove();
        this._currentUnlockOverlay = null;
      }, 300);
    }
  },

  _scrollToBadge(id) {
    const el = document.getElementById(`badge-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('highlighted');
    setTimeout(() => el.classList.remove('highlighted'), 3000);
  },

  _playUnlockSound(rarity) {
    // 可选音效：使用 Web Audio API 播放简单的提示音
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      // 根据稀有度调整音调
      const freq = rarity === 'legendary' ? 880 : rarity === 'gold' ? 660 : rarity === 'silver' ? 550 : 440;
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);

      // 传说稀有度播放和弦
      if (rarity === 'legendary') {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1100;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.1, ctx.currentTime + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
        osc2.start(ctx.currentTime + 0.15);
        osc2.stop(ctx.currentTime + 1.0);
      }
    } catch (e) {
      // 音频播放失败静默处理
    }
  },

  // =========================================================
  // 手动解锁/重置
  // =========================================================
  manualUnlock(id) {
    const a = this._achievements.find(x => x.id === id);
    if (!a) { App.toast('成就不存在', 'error'); return; }
    if (this._unlockedIds.has(id)) { App.toast('该成就已解锁', 'info'); return; }
    this.unlock(id);
    App.toast(`已手动解锁：${a.name}`, 'success');
  },

  resetUnlock(id) {
    if (!confirm('确定要重置这个成就的解锁状态吗？')) return;
    this._unlockedIds.delete(id);
    const a = this._achievements.find(x => x.id === id);
    if (a) a.unlockedAt = null;
    this._saveData();
    this.renderStatsPanel();
    this.renderBadgeGrid();
    App.toast('解锁状态已重置', 'info');
  },

  resetAllUnlocks() {
    if (!confirm('确定要重置所有成就的解锁状态吗？此操作不可撤销！')) return;
    this._unlockedIds.clear();
    this._achievements.forEach(a => a.unlockedAt = null);
    this._saveData();
    this.renderStatsPanel();
    this.renderBadgeGrid();
    App.toast('所有成就解锁状态已重置', 'info');
  },

  // =========================================================
  // 模态框辅助
  // =========================================================
  _showModal(html) {
    this.closeManager();
    const wrapper = document.createElement('div');
    wrapper.id = 'badgeWallModal';
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);
  },

  closeManager() {
    const modal = document.getElementById('badgeWallModal');
    if (modal) modal.remove();
    const panel = document.getElementById('badgeManagerPanel');
    if (panel) panel.remove();
    this._currentUnlockOverlay?.remove();
    this._currentUnlockOverlay = null;
  },

  // =========================================================
  // 批量操作
  // =========================================================
  clearAllAchievements() {
    if (!confirm('警告：这将删除所有成就！此操作不可撤销，是否继续？')) return;
    this._achievements = [];
    this._unlockedIds.clear();
    this._saveData();
    this.renderStatsPanel();
    this.renderFilters();
    this.renderBadgeGrid();
    App.toast('所有成就已清除', 'info');
  },

  // =========================================================
  // 公共API汇总
  // =========================================================
  getAchievements() { return [...this._achievements]; },
  getUnlockedIds() { return Array.from(this._unlockedIds); },
  getAchievementById(id) { return this._achievements.find(a => a.id === id); },
  isUnlocked(id) { return this._unlockedIds.has(id); },
  getStats() {
    const total = this._achievements.length;
    const unlocked = this._unlockedIds.size;
    const byRarity = {};
    Object.keys(this._rarities).forEach(r => byRarity[r] = { total: 0, unlocked: 0 });
    this._achievements.forEach(a => {
      if (byRarity[a.rarity]) {
        byRarity[a.rarity].total++;
        if (this._unlockedIds.has(a.id)) byRarity[a.rarity].unlocked++;
      }
    });
    return { total, unlocked, locked: total - unlocked, completionRate: total > 0 ? unlocked / total : 0, byRarity };
  }
};

// =========================================================
// 全局暴露
// =========================================================
window.BadgeWall = BadgeWall;
