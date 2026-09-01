/**
 * =========================================================
 * NPCManager v9 — 古风墨境风格角色档案界面
 * 布局：左侧立绘大图 | 中间信息主面板（标签页+属性网格） | 右侧竖排操作按钮
 * 底部：交游/灵台/记事/修改/上徽号/离开 等功能按钮区
 * 配色：古风墨境 — 背景 #F5E6D3，金色 #C9A227，墨色 #2C1810
 * 字体：Noto Serif SC
 * =========================================================
 */
const NPCManager = {
  /* ========== 内置字段定义 ========== */
  BUILTIN_FIELDS: [
    { key: 'name', label: '名字', type: 'text', required: true },
    { key: 'age', label: '年龄', type: 'text' },
    { key: 'gender', label: '性别', type: 'text' },
    { key: 'job', label: '职业', type: 'text' },
    { key: 'marriage', label: '婚姻', type: 'text' },
    { key: 'address', label: '住址', type: 'text' },
    { key: 'bodyType', label: '体型', type: 'text' },
    { key: 'culture', label: '文化', type: 'text' },
    { key: 'lifespan', label: '寿命', type: 'text' },
    { key: 'father', label: '父亲', type: 'text' },
    { key: 'mother', label: '母亲', type: 'text' },
    { key: 'origin', label: '出身', type: 'text' },
    { key: 'temperament', label: '性情', type: 'text' },
    { key: 'money', label: '金钱', type: 'text' },
    { key: 'identity', label: '身份', type: 'text' },
    { key: 'height', label: '身高', type: 'text' },
    { key: 'weight', label: '体重', type: 'text' },
    { key: 'integrity', label: '清廉', type: 'text' },
    { key: 'ambition', label: '野心', type: 'text' },
    { key: 'favor', label: '恩宠', type: 'text' },
    { key: 'culturalCircle', label: '文化圈', type: 'text' },
    { key: 'hometown', label: '籍贯', type: 'text' },
    { key: 'entryDuration', label: '入宫时长', type: 'text' },
    { key: 'title', label: '称号', type: 'text' },
    { key: 'background', label: '背景故事', type: 'textarea' },
    { key: 'dialogStyle', label: '对话风格', type: 'textarea' },
    { key: 'appearance', label: '外貌', type: 'textarea' },
    { key: 'likes', label: '喜好', type: 'text' },
    { key: 'dislikes', label: '厌恶', type: 'text' },
    { key: 'affection', label: '初始好感', type: 'number', default: 50 },
    { key: 'darkSide', label: '阴暗面', type: 'textarea' },
    { key: 'secret', label: '秘密档案', type: 'textarea' },
    { key: 'secretBag', label: '秘密背包', type: 'textarea' },
    { key: 'tags', label: '标签', type: 'text' },
    { key: 'promptOverride', label: '专属提示词', type: 'textarea' }
  ],

  /* ========== 属性网格（21项，数值0-100） ========== */
  STAT_GRID: [
    { key: 'qin', label: '琴', icon: '🎵' },
    { key: 'qi', label: '棋', icon: '⚫' },
    { key: 'shu', label: '书', icon: '📜' },
    { key: 'hua', label: '画', icon: '🎨' },
    { key: 'ge', label: '歌', icon: '🎤' },
    { key: 'wu_dance', label: '舞', icon: '💃' },
    { key: 'qi_ride', label: '骑', icon: '🐴' },
    { key: 'she', label: '射', icon: '🏹' },
    { key: 'xiu', label: '绣', icon: '🧵' },
    { key: 'chu', label: '厨', icon: '🍳' },
    { key: 'yi', label: '医', icon: '💊' },
    { key: 'yun', label: '孕', icon: '👶' },
    { key: 'tong', label: '统', icon: '⚔️' },
    { key: 'wu_fight', label: '武', icon: '🗡️' },
    { key: 'zhi', label: '智', icon: '🧠' },
    { key: 'zheng', label: '政', icon: '📋' },
    { key: 'mei', label: '魅', icon: '✨' },
    { key: 'yu', label: '欲', icon: '🔥' },
    { key: 'jing', label: '经', icon: '📖' },
    { key: 'lian', label: '廉', icon: '🏛️' },
    { key: 'si', label: '思', icon: '💭' }
  ],

  /* ========== 模块标签页定义 ========== */
  TABS: [
    { key: 'info', label: '信息' },
    { key: 'biography', label: '生平记事' },
    { key: 'logs', label: '日志' },
    { key: 'darkSide', label: '阴暗面' },
    { key: 'secret', label: '秘密档案' },
    { key: 'secretBag', label: '秘密背包' },
    { key: 'mood', label: '心情记录' },
    { key: 'relations', label: '关系图' }
  ],

  /* ========== 状态变量 ========== */
  _currentNPC: null,
  _diyFields: [],
  _viewMode: 'list', // 'list' | 'card' | 'detail'
  _activeTab: 'info',

  /* ========== 初始化 ========== */
  init() { this.renderPage(); },
  onEnter() { this.renderList(); },

  /* ========== 数据存取核心方法 ========== */
  getNPCs() {
    return Storage.get('npcs_v3', Storage.get('npcs_v2', []));
  },

  addNPC(npcData) {
    const npcs = this.getNPCs();
    const newNPC = {
      id: 'npc_' + Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      logs: [],
      biography: [],
      customFields: [],
      secretBagItems: [],
      thoughts: [],
      ...npcData
    };
    npcs.push(newNPC);
    this.saveNPCs(npcs);
    if (AchievementSystem?.incrementStat) AchievementSystem.incrementStat('npc_created', 1);
    return newNPC;
  },

  deleteNPC(id) {
    if (!confirm('确定要删除此角色吗？此操作不可撤销。')) return false;
    const npcs = this.getNPCs().filter(n => n.id !== id);
    this.saveNPCs(npcs);
    if (this._currentNPC && this._currentNPC.id === id) {
      this._currentNPC = null;
      this._viewMode = 'card';
    }
    this.renderList();
    App.toast('角色已删除', 'success');
    return true;
  },

  updateNPC(id, updates) {
    const npcs = this.getNPCs();
    const idx = npcs.findIndex(n => n.id === id);
    if (idx === -1) return null;
    npcs[idx] = { ...npcs[idx], ...updates, updatedAt: Date.now() };
    this.saveNPCs(npcs);
    // 如果正在查看该NPC，更新当前引用
    if (this._currentNPC && this._currentNPC.id === id) {
      this._currentNPC = npcs[idx];
    }
    return npcs[idx];
  },

  getNPCById(id) {
    return this.getNPCs().find(n => n.id === id) || null;
  },

  saveNPCs(list) {
    Storage.set('npcs_v3', list);
  },

  getDIYFields() {
    return Storage.get('npcDIYFields_v3', Storage.get('npcDIYFields', []));
  },

  saveDIYFields(f) {
    Storage.set('npcDIYFields_v3', f);
  },

  /* ========== 页面渲染：古风墨境风格 ========== */
  renderPage() {
    const page = document.getElementById('page-npc');
    if (!page) return;
    page.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
      <style id="npc-juncheng-style">
        /* 古风墨境风格额外样式 */
        .juncheng-container {
          font-family: 'Noto Serif SC', serif;
          color: #2C1810;
        }
        .juncheng-left-panel {
          flex: 0 0 260px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .juncheng-portrait-frame {
          width: 100%;
          aspect-ratio: 3/4;
          border: 3px solid #C9A227;
          border-radius: 4px;
          overflow: hidden;
          background: linear-gradient(180deg, #F5E6D3, #e8d5c0);
          box-shadow: 0 4px 20px rgba(44,24,16,0.15);
          position: relative;
        }
        .juncheng-portrait-frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .juncheng-portrait-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 64px;
          color: #C9A227;
        }
        .juncheng-name-plate {
          text-align: center;
          margin-top: 12px;
        }
        .juncheng-name-plate h3 {
          font-size: 22px;
          font-family: 'Noto Serif SC', serif;
          color: #2C1810;
          margin: 0;
          letter-spacing: 4px;
        }
        .juncheng-name-plate .npc-id {
          font-size: 11px;
          color: #8B7355;
          margin-top: 4px;
        }
        .juncheng-center-panel {
          flex: 1;
          min-width: 360px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .juncheng-info-card {
          background: #F5E6D3;
          border: 1px solid #C9A227;
          border-radius: 4px;
          padding: 16px;
        }
        .juncheng-info-card-header {
          font-size: 15px;
          font-weight: 700;
          color: #2C1810;
          border-bottom: 1px solid #C9A227;
          padding-bottom: 8px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .juncheng-info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px 16px;
        }
        .juncheng-info-item {
          font-size: 13px;
          line-height: 1.6;
        }
        .juncheng-info-item .label {
          color: #8B7355;
        }
        .juncheng-info-item .value {
          color: #2C1810;
          font-weight: 600;
        }
        .juncheng-stat-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
        }
        .juncheng-stat-cell {
          text-align: center;
          padding: 6px 2px;
          background: rgba(201,162,39,0.08);
          border: 1px solid rgba(201,162,39,0.3);
          border-radius: 3px;
          transition: all 0.2s;
        }
        .juncheng-stat-cell:hover {
          background: rgba(201,162,39,0.2);
          transform: translateY(-1px);
        }
        .juncheng-stat-cell .stat-icon {
          font-size: 14px;
          display: block;
          margin-bottom: 2px;
        }
        .juncheng-stat-cell .stat-label {
          font-size: 11px;
          color: #8B7355;
          display: block;
        }
        .juncheng-stat-cell .stat-value {
          font-size: 16px;
          font-family: 'Noto Serif SC', serif;
          color: #2C1810;
          font-weight: 700;
          display: block;
          margin-top: 2px;
        }
        .juncheng-right-panel {
          flex: 0 0 100px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .juncheng-vbtn {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          padding: 10px 6px;
          font-size: 13px;
          font-family: 'Noto Serif SC', serif;
          border: 1px solid #C9A227;
          background: linear-gradient(180deg, #F5E6D3, #e8d5c0);
          color: #2C1810;
          cursor: pointer;
          border-radius: 3px;
          transition: all 0.2s;
          letter-spacing: 2px;
          text-align: center;
          min-height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .juncheng-vbtn:hover {
          background: #C9A227;
          color: #F5E6D3;
        }
        .juncheng-vbtn.danger {
          border-color: #b85450;
          color: #b85450;
        }
        .juncheng-vbtn.danger:hover {
          background: #b85450;
          color: #F5E6D3;
        }
        .juncheng-bottom-bar {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid rgba(201,162,39,0.3);
        }
        .juncheng-hbtn {
          padding: 8px 20px;
          font-size: 14px;
          font-family: 'Noto Serif SC', serif;
          border: 1px solid #C9A227;
          background: linear-gradient(180deg, #F5E6D3, #e8d5c0);
          color: #2C1810;
          cursor: pointer;
          border-radius: 3px;
          transition: all 0.2s;
          letter-spacing: 2px;
        }
        .juncheng-hbtn:hover {
          background: #C9A227;
          color: #F5E6D3;
        }
        .juncheng-tab-bar {
          display: flex;
          gap: 4px;
          margin-bottom: 12px;
          border-bottom: 2px solid #C9A227;
          padding-bottom: 4px;
        }
        .juncheng-tab {
          padding: 6px 14px;
          font-size: 13px;
          font-family: 'Noto Serif SC', serif;
          border: 1px solid transparent;
          background: transparent;
          color: #8B7355;
          cursor: pointer;
          border-radius: 3px 3px 0 0;
          transition: all 0.2s;
          letter-spacing: 1px;
        }
        .juncheng-tab.active {
          border-color: #C9A227;
          border-bottom-color: #F5E6D3;
          background: #F5E6D3;
          color: #2C1810;
          font-weight: 700;
        }
        .juncheng-tab:hover:not(.active) {
          color: #2C1810;
          background: rgba(201,162,39,0.1);
        }
        .juncheng-tag {
          display: inline-block;
          padding: 2px 8px;
          font-size: 12px;
          border: 1px solid #C9A227;
          border-radius: 10px;
          color: #2C1810;
          background: rgba(201,162,39,0.1);
          margin: 2px;
        }
        .juncheng-thought-badge {
          display: inline-block;
          padding: 3px 10px;
          font-size: 12px;
          border: 1px solid #C9A227;
          border-radius: 3px;
          color: #F5E6D3;
          background: #2C1810;
          margin: 2px;
          font-family: 'Noto Serif SC', serif;
        }
        .juncheng-timeline {
          position: relative;
          padding-left: 20px;
        }
        .juncheng-timeline::before {
          content: '';
          position: absolute;
          left: 5px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #C9A227;
        }
        .juncheng-timeline-item {
          position: relative;
          margin-bottom: 12px;
          padding-left: 12px;
        }
        .juncheng-timeline-item::before {
          content: '';
          position: absolute;
          left: -20px;
          top: 6px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #C9A227;
          border: 2px solid #F5E6D3;
        }
        .juncheng-timeline-date {
          font-size: 11px;
          color: #8B7355;
          margin-bottom: 2px;
        }
        .juncheng-timeline-text {
          font-size: 13px;
          color: #2C1810;
          line-height: 1.5;
        }
        .juncheng-log-item {
          padding: 8px 12px;
          border-bottom: 1px solid rgba(201,162,39,0.2);
          font-size: 13px;
          line-height: 1.6;
        }
        .juncheng-log-item.recent {
          background: rgba(201,162,39,0.12);
          border-left: 3px solid #C9A227;
        }
        .juncheng-log-date {
          font-size: 11px;
          color: #8B7355;
          margin-bottom: 2px;
        }
        .juncheng-encrypted-panel {
          background: repeating-linear-gradient(
            45deg,
            rgba(44,24,16,0.05),
            rgba(44,24,16,0.05) 10px,
            rgba(44,24,16,0.08) 10px,
            rgba(44,24,16,0.08) 20px
          );
          border: 2px dashed #8B7355;
          padding: 20px;
          text-align: center;
          border-radius: 4px;
        }
        .juncheng-secret-lock {
          font-size: 36px;
          color: #8B7355;
          margin-bottom: 8px;
        }
        .juncheng-secret-text {
          font-size: 14px;
          color: #8B7355;
          font-style: italic;
        }
        .juncheng-diy-field-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 0;
          border-bottom: 1px dashed rgba(201,162,39,0.3);
        }
        .juncheng-diy-field-row .diy-label {
          font-size: 13px;
          color: #8B7355;
          min-width: 80px;
        }
        .juncheng-diy-field-row .diy-value {
          font-size: 13px;
          color: #2C1810;
          font-weight: 600;
          flex: 1;
        }
        .juncheng-diy-actions {
          display: flex;
          gap: 4px;
        }
        .juncheng-diy-actions button {
          padding: 2px 8px;
          font-size: 11px;
          border: 1px solid #C9A227;
          background: transparent;
          color: #2C1810;
          cursor: pointer;
          border-radius: 2px;
        }
        .juncheng-diy-actions button:hover {
          background: #C9A227;
          color: #F5E6D3;
        }
        .juncheng-recent-badge {
          display: inline-block;
          padding: 2px 8px;
          font-size: 11px;
          background: #C9A227;
          color: #F5E6D3;
          border-radius: 10px;
          margin-left: 8px;
        }
        .juncheng-bag-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border: 1px solid rgba(201,162,39,0.3);
          border-radius: 3px;
          margin-bottom: 6px;
          background: rgba(201,162,39,0.05);
        }
        .juncheng-bag-item-name {
          font-size: 13px;
          color: #2C1810;
        }
        .juncheng-bag-item-desc {
          font-size: 11px;
          color: #8B7355;
        }
        .juncheng-empty-state {
          text-align: center;
          padding: 32px;
          color: #8B7355;
          font-size: 14px;
        }
      </style>

      <!-- 页面头部：标题与视图切换 -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
        <h2 style="font-family:'Noto Serif SC',serif;color:#2C1810;font-size:22px;letter-spacing:4px;">人物志</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm btn-secondary" onclick="NPCManager.setViewMode('list')">📋 列表</button>
          <button class="btn btn-sm btn-secondary" onclick="NPCManager.setViewMode('card')">🃏 卡片</button>
          <button class="btn btn-gold" onclick="NPCManager.openPortraitLibrary()">🖼️ 立绘库</button>
          <button class="btn btn-primary" onclick="NPCManager.openCreateNPCModal()">➕ 新建角色</button>
        </div>
      </div>

      <!-- 内容区域 -->
      <div id="npcContent"></div>

      <!-- ========== 模态框定义 ========== -->
      <!-- 立绘库模态框 -->
      <div class="modal-overlay" id="npcPortraitLibModal">
        <div class="modal xl">
          <div class="modal-header">
            <h3 style="font-family:'Noto Serif SC',serif;">🖼️ 立绘库</h3>
            <button class="btn-icon" onclick="App.closeModal('npcPortraitLibModal')">✕</button>
          </div>
          <div class="modal-body" id="portraitLibBody"></div>
        </div>
      </div>

      <!-- 角色编辑器模态框 -->
      <div class="modal-overlay" id="npcEditorModal">
        <div class="modal xl">
          <div class="modal-header">
            <h3 id="npcEditorTitle" style="font-family:'Noto Serif SC',serif;">新建角色</h3>
            <button class="btn-icon" onclick="App.closeModal('npcEditorModal')">✕</button>
          </div>
          <div class="modal-body" id="npcEditorBody"></div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="App.closeModal('npcEditorModal')">取消</button>
            <button class="btn btn-gold" onclick="NPCManager.aiGenProfile()">🤖 AI生成档案</button>
            <button class="btn btn-primary" onclick="NPCManager.saveEditor()">保存</button>
          </div>
        </div>
      </div>

      <!-- 批量立绘模态框 -->
      <div class="modal-overlay" id="npcBatchPortraitModal">
        <div class="modal xl">
          <div class="modal-header">
            <h3 style="font-family:'Noto Serif SC',serif;">📦 批量立绘</h3>
            <button class="btn-icon" onclick="App.closeModal('npcBatchPortraitModal')">✕</button>
          </div>
          <div class="modal-body" id="batchPortraitBody">
            <!-- 批量上传模式切换 -->
            <div style="display:flex;gap:8px;margin-bottom:12px;">
              <button class="btn btn-sm btn-gold" onclick="NPCManager.setBatchMode('album')">相册批量</button>
              <button class="btn btn-sm btn-secondary" onclick="NPCManager.setBatchMode('url')">URL批量</button>
            </div>
            <div id="batchUploadArea">
              <p style="color:#8B7355;font-size:13px;">选择多张图片，系统会自动为角色匹配立绘。</p>
              <input type="file" id="batchPortraitInput" accept="image/*" multiple onchange="NPCManager.handleBatchPortraitUpload(this)">
              <div id="batchPortraitPreview" style="margin-top:12px;"></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="App.closeModal('npcBatchPortraitModal')">取消</button>
            <button class="btn btn-primary" id="batchConfirmBtn" onclick="NPCManager.confirmBatchPortrait()">确认匹配</button>
          </div>
        </div>
      </div>

      <!-- 添加自定义字段模态框 -->
      <div class="modal-overlay" id="npcAddFieldModal">
        <div class="modal">
          <div class="modal-header">
            <h3 style="font-family:'Noto Serif SC',serif;">➕ 添加自定义字段</h3>
            <button class="btn-icon" onclick="App.closeModal('npcAddFieldModal')">✕</button>
          </div>
          <div class="modal-body" id="addFieldBody">
            <div class="form-group">
              <label>字段名称</label>
              <input type="text" id="diyFieldName" placeholder="例如：师承">
            </div>
            <div class="form-group">
              <label>字段类型</label>
              <select id="diyFieldType">
                <option value="text">文本</option>
                <option value="number">数字</option>
                <option value="date">日期</option>
                <option value="textarea">多行文本</option>
                <option value="select">单选</option>
              </select>
            </div>
            <div class="form-group">
              <label>字段值</label>
              <input type="text" id="diyFieldValue" placeholder="默认值">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="App.closeModal('npcAddFieldModal')">取消</button>
            <button class="btn btn-primary" onclick="NPCManager.confirmAddDIYField()">添加</button>
          </div>
        </div>
      </div>
    `;
    this.renderList();
  },

  setViewMode(mode) {
    this._viewMode = mode;
    this.renderList();
  },

  /* ========== 列表/卡片视图渲染 ========== */
  renderList() {
    const c = document.getElementById('npcContent');
    if (!c) return;
    const npcs = this.getNPCs();
    if (npcs.length === 0) {
      c.innerHTML = `
        <div class="juncheng-empty-state">
          <div style="font-size:48px;margin-bottom:12px;">👤</div>
          <p>暂无角色</p>
          <button class="btn btn-primary" onclick="NPCManager.openCreateNPCModal()" style="margin-top:12px;">创建角色</button>
        </div>`;
      return;
    }
    if (this._viewMode === 'detail' && this._currentNPC) {
      this.renderNPCDetail();
      return;
    }
    if (this._viewMode === 'card') {
      c.innerHTML = `<div class="grid grid-3">${npcs.map(n => this.renderNPCCard(n)).join('')}</div>`;
      return;
    }
    // 列表视图
    c.innerHTML = `<div class="grid grid-3">${npcs.map(n => this.renderNPCCard(n)).join('')}</div>`;
  },

  renderNPCCard(npc) {
    const portraitStyle = npc.portraitId ? '' : 'background:linear-gradient(135deg,#2C1810,#C9A227);';
    const nameFirst = npc.name ? npc.name[0] : '?';
    return `
      <div class="card" style="cursor:pointer;transition:all 0.3s;" onclick="NPCManager.viewNPC('${npc.id}')">
        <div style="display:flex;gap:12px;padding:var(--space-md);">
          <div style="width:72px;height:96px;border-radius:var(--border-radius-sm);overflow:hidden;flex-shrink:0;border:2px solid #C9A227;${portraitStyle}">
            ${npc.portraitId
              ? `<img src="${npc.portraitId}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">`
              : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;font-family:'Noto Serif SC',serif;">${nameFirst}</div>`}
          </div>
          <div style="flex:1;min-width:0;">
            <h4 style="font-size:16px;margin-bottom:4px;font-family:'Noto Serif SC',serif;color:#2C1810;">${npc.name || '未命名'}</h4>
            <p style="font-size:12px;color:#8B7355;margin-bottom:6px;">${npc.title || ''} ${npc.age || ''} ${npc.job || ''}</p>
            <div style="display:flex;flex-wrap:wrap;gap:4px;">
              ${(npc.tags || '').split(',').filter(t => t).slice(0,3).map(t => `<span class="juncheng-tag">${t.trim()}</span>`).join('')}
            </div>
            <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">
              <button class="btn btn-sm btn-primary" onclick="event.stopPropagation();NPCManager.talkTo('${npc.id}')">💬 对话</button>
              <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();NPCManager.editNPC('${npc.id}')">✏️</button>
              <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();NPCManager.deleteNPC('${npc.id}')">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* ========== 古风墨境风格详情页渲染 ========== */
  renderNPCDetail() {
    const c = document.getElementById('npcContent');
    if (!c) return;
    const npc = this._currentNPC;
    if (!npc) { this._viewMode = 'card'; this.renderList(); return; }

    // 确保NPC有必要的数组属性
    if (!npc.logs) npc.logs = [];
    if (!npc.biography) npc.biography = [];
    if (!npc.customFields) npc.customFields = [];
    if (!npc.secretBagItems) npc.secretBagItems = [];
    if (!npc.thoughts) npc.thoughts = [];

    c.innerHTML = `
      <div class="juncheng-container" style="display:flex;gap:20px;flex-wrap:wrap;">
        <!-- ===== 左侧：立绘大图区 ===== -->
        <div class="juncheng-left-panel">
          <div class="juncheng-portrait-frame">
            ${npc.portraitId
              ? `<img src="${npc.portraitId}" onerror="this.style.display='none';this.parentElement.innerHTML='<div class=\\'juncheng-portrait-placeholder\\'>👤</div>'">`
              : `<div class="juncheng-portrait-placeholder">👤</div>`}
          </div>
          <div class="juncheng-name-plate">
            <h3>${npc.name || '未命名'}</h3>
            <div class="npc-id">编号：${npc.id}</div>
            ${npc.title ? `<div style="font-size:13px;color:#8B7355;margin-top:4px;">${npc.title}</div>` : ''}
          </div>
          <!-- 左侧快捷操作 -->
          <div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">
            <button class="btn btn-sm btn-secondary" onclick="NPCManager.setViewMode('card')">← 返回</button>
            <button class="btn btn-sm btn-primary" onclick="NPCManager.talkTo('${npc.id}')">💬 对话</button>
          </div>
        </div>

        <!-- ===== 中间：信息主面板 ===== -->
        <div class="juncheng-center-panel">
          <!-- 标签页切换栏 -->
          <div class="juncheng-tab-bar" id="npcTabBar">
            ${this.TABS.map(tab => `
              <button class="juncheng-tab ${this._activeTab === tab.key ? 'active' : ''}"
                      onclick="NPCManager.switchTab('${tab.key}')">${tab.label}</button>
            `).join('')}
          </div>
          <!-- 标签页内容区 -->
          <div id="npcTabContent">
            ${this.renderTabContent(npc, this._activeTab)}
          </div>
        </div>

        <!-- ===== 右侧：操作按钮列（竖排） ===== -->
        <div class="juncheng-right-panel">
          <button class="juncheng-vbtn" onclick="NPCManager.showRelations('${npc.id}')">亲眷</button>
          <button class="juncheng-vbtn" onclick="NPCManager.showInventory('${npc.id}')">库房</button>
          <button class="juncheng-vbtn" onclick="NPCManager.raiseChild('${npc.id}')">抚养</button>
          <button class="juncheng-vbtn" onclick="NPCManager.promoteRank('${npc.id}')">晋封</button>
          <button class="juncheng-vbtn" onclick="NPCManager.changeRank('${npc.id}')">升降位分</button>
          <button class="juncheng-vbtn" onclick="NPCManager.toggleInsurance('${npc.id}')">取消保险</button>
          <button class="juncheng-vbtn" onclick="NPCManager.showAffairs('${npc.id}')">事务</button>
          <button class="juncheng-vbtn danger" onclick="NPCManager.sendToColdPalace('${npc.id}')">冷宫</button>
        </div>
      </div>

      <!-- ===== 底部：功能按钮区 ===== -->
      <div class="juncheng-bottom-bar">
        <button class="juncheng-hbtn" onclick="NPCManager.socialize('${npc.id}')">交游</button>
        <button class="juncheng-hbtn" onclick="NPCManager.divination('${npc.id}')">灵台</button>
        <button class="juncheng-hbtn" onclick="NPCManager.editNPC('${npc.id}')">修改</button>
        <button class="juncheng-hbtn" onclick="NPCManager.viewBiography('${npc.id}')">记事</button>
        <button class="juncheng-hbtn" onclick="NPCManager.giveTitle('${npc.id}')">上徽号</button>
        <button class="juncheng-hbtn" onclick="NPCManager.leaveDetail()">离开</button>
      </div>
    `;
  },

  /* ========== 标签页内容渲染 ========== */
  renderTabContent(npc, tabKey) {
    switch (tabKey) {
      case 'info': return this.renderInfoTab(npc);
      case 'biography': return this.renderBiographyTab(npc);
      case 'logs': return this.renderLogsTab(npc);
      case 'darkSide': return this.renderDarkSideTab(npc);
      case 'secret': return this.renderSecretTab(npc);
      case 'secretBag': return this.renderSecretBagTab(npc);
      case 'mood': return this.renderMoodTab(npc);
      case 'relations': return this.renderRelationsTab(npc);
      default: return this.renderInfoTab(npc);
    }
  },

  switchTab(key) {
    this._activeTab = key;
    const tabBar = document.getElementById('npcTabBar');
    const tabContent = document.getElementById('npcTabContent');
    if (tabBar) {
      tabBar.querySelectorAll('.juncheng-tab').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === this.TABS.find(t => t.key === key)?.label);
      });
    }
    if (tabContent && this._currentNPC) {
      tabContent.innerHTML = this.renderTabContent(this._currentNPC, key);
    }
  },

  renderNPCTabs(npc) {
    // 供外部调用的标签页渲染方法
    return this.TABS.map(tab => ({
      key: tab.key,
      label: tab.label,
      content: this.renderTabContent(npc, tab.key)
    }));
  },

  /* ========== 信息标签页：基础+扩展字段+属性网格+DIY字段 ========== */
  renderInfoTab(npc) {
    // 基础字段
    const basicFields = ['name', 'age', 'job', 'marriage', 'address', 'bodyType'];
    // 扩展字段
    const extendedFields = ['culture', 'lifespan', 'father', 'mother', 'origin', 'temperament',
                           'money', 'identity', 'height', 'weight', 'integrity', 'ambition',
                           'favor', 'culturalCircle', 'hometown', 'entryDuration'];

    const renderFieldRow = (key, label) => {
      const value = npc[key] || '';
      return value
        ? `<div class="juncheng-info-item"><span class="label">${label}：</span><span class="value">${value}</span></div>`
        : '';
    };

    // 属性网格
    const stats = npc.stats || {};
    const statGridHTML = this.STAT_GRID.map(s => `
      <div class="juncheng-stat-cell" title="${s.label} ${stats[s.key] || 0}/100">
        <span class="stat-icon">${s.icon}</span>
        <span class="stat-label">${s.label}</span>
        <span class="stat-value">${stats[s.key] || 0}</span>
      </div>
    `).join('');

    // 喜好标签
    const likesHTML = (npc.likes || '').split(',').filter(t => t).map(t =>
      `<span class="juncheng-tag">${t.trim()}</span>`
    ).join('');

    // 思想标签
    const thoughtsHTML = (npc.thoughts || []).map(thought =>
      `<span class="juncheng-thought-badge">${thought}</span>`
    ).join('');

    // DIY字段渲染
    const customFieldsHTML = (npc.customFields || []).map((field, idx) => `
      <div class="juncheng-diy-field-row">
        <span class="diy-label">${field.name}：</span>
        <span class="diy-value">${field.value || ''}</span>
        <div class="juncheng-diy-actions">
          <button onclick="NPCManager.editDIYField('${npc.id}', ${idx})">编辑</button>
          <button onclick="NPCManager.deleteDIYField('${npc.id}', ${idx})">删除</button>
        </div>
      </div>
    `).join('');

    return `
      <!-- 基础与扩展信息 -->
      <div class="juncheng-info-card">
        <div class="juncheng-info-card-header">📋 人物档案</div>
        <div class="juncheng-info-grid">
          ${basicFields.map(f => renderFieldRow(f, this.getFieldLabel(f))).join('')}
          ${extendedFields.map(f => renderFieldRow(f, this.getFieldLabel(f))).join('')}
        </div>
      </div>

      <!-- 属性面板（21项网格） -->
      <div class="juncheng-info-card">
        <div class="juncheng-info-card-header">⚔️ 属性面板</div>
        <div class="juncheng-stat-grid">
          ${statGridHTML}
        </div>
      </div>

      <!-- 喜好与思想 -->
      ${(likesHTML || thoughtsHTML) ? `
      <div class="juncheng-info-card">
        <div class="juncheng-info-card-header">🏷️ 喜好与思想</div>
        <div style="margin-bottom:8px;">${likesHTML}</div>
        <div>${thoughtsHTML}</div>
      </div>` : ''}

      <!-- DIY自定义字段 -->
      <div class="juncheng-info-card">
        <div class="juncheng-info-card-header" style="display:flex;justify-content:space-between;align-items:center;">
          <span>🔧 自定义字段</span>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-sm btn-gold" onclick="NPCManager.openAddDIYFieldModal('${npc.id}')">➕ 添加字段</button>
            <button class="btn btn-sm btn-secondary" onclick="NPCManager.aiSuggestFields('${npc.id}')">🤖 AI建议</button>
          </div>
        </div>
        ${customFieldsHTML || '<div style="color:#8B7355;font-size:13px;padding:8px 0;">暂无自定义字段</div>'}
      </div>

      <!-- 背景故事（如有） -->
      ${npc.background ? `
      <div class="juncheng-info-card">
        <div class="juncheng-info-card-header">📖 背景故事</div>
        <p style="font-size:14px;line-height:1.8;color:#2C1810;">${npc.background}</p>
      </div>` : ''}
    `;
  },

  /* ========== 生平记事标签页（时间轴） ========== */
  renderBiographyTab(npc) {
    const events = npc.biography || [];
    if (events.length === 0) {
      return `<div class="juncheng-empty-state">暂无生平记事</div>`;
    }
    // 按日期排序
    const sorted = [...events].sort((a, b) => (b.date || 0) - (a.date || 0));
    return `
      <div class="juncheng-info-card">
        <div class="juncheng-info-card-header">📜 生平记事</div>
        <div class="juncheng-timeline">
          ${sorted.map(e => `
            <div class="juncheng-timeline-item">
              <div class="juncheng-timeline-date">${e.date ? new Date(e.date).toLocaleDateString('zh-CN') : '日期不详'}</div>
              <div class="juncheng-timeline-text">${e.content || ''}</div>
            </div>
          `).join('')}
        </div>
        <div style="margin-top:12px;text-align:center;">
          <button class="btn btn-sm btn-secondary" onclick="NPCManager.addBiographyEvent('${npc.id}')">➕ 添加记事</button>
        </div>
      </div>
    `;
  },

  /* ========== 日志标签页（含最近三天高亮） ========== */
  renderLogsTab(npc) {
    const logs = npc.logs || [];
    // 计算最近三天的时间范围
    const now = Date.now();
    const threeDaysAgo = now - (3 * 24 * 60 * 60 * 1000);

    // 按日期排序（最新的在前）
    const sorted = [...logs].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // 筛选最近三天的记录
    const recentLogs = sorted.filter(l => (l.timestamp || 0) >= threeDaysAgo);
    const olderLogs = sorted.filter(l => (l.timestamp || 0) < threeDaysAgo);

    const renderLogItem = (log, isRecent) => `
      <div class="juncheng-log-item ${isRecent ? 'recent' : ''}">
        <div class="juncheng-log-date">${log.timestamp ? new Date(log.timestamp).toLocaleDateString('zh-CN') : '日期不详'}</div>
        <div>${log.content || ''}</div>
      </div>
    `;

    return `
      <div class="juncheng-info-card">
        <div class="juncheng-info-card-header">
          📔 日志
          ${recentLogs.length > 0 ? `<span class="juncheng-recent-badge">最近三天 ${recentLogs.length} 条</span>` : ''}
        </div>

        <!-- 最近三天快捷区域 -->
        ${recentLogs.length > 0 ? `
        <div style="margin-bottom:16px;padding:12px;background:rgba(201,162,39,0.1);border-radius:4px;border:1px solid rgba(201,162,39,0.3);">
          <div style="font-size:13px;font-weight:700;color:#2C1810;margin-bottom:8px;">📌 最近三天</div>
          ${recentLogs.map(l => renderLogItem(l, true)).join('')}
        </div>` : ''}

        <!-- 全部日志 -->
        <div style="max-height:400px;overflow-y:auto;">
          ${sorted.length > 0
            ? sorted.map(l => renderLogItem(l, (l.timestamp || 0) >= threeDaysAgo)).join('')
            : '<div class="juncheng-empty-state">暂无日志记录</div>'}
        </div>

        <div style="margin-top:12px;text-align:center;">
          <button class="btn btn-sm btn-secondary" onclick="NPCManager.addLogEntry('${npc.id}')">➕ 添加日志</button>
        </div>
      </div>
    `;
  },

  /* ========== 阴暗面标签页（点击展开） ========== */
  renderDarkSideTab(npc) {
    const content = npc.darkSide || '';
    const isExpanded = npc._darkSideExpanded || false;
    return `
      <div class="juncheng-info-card">
        <div class="juncheng-info-card-header">🌑 阴暗面</div>
        <div id="darkSideContent">
          ${isExpanded
            ? `<textarea id="darkSideEdit" rows="8" style="width:100%;font-family:'Noto Serif SC',serif;font-size:14px;padding:12px;border:1px solid #C9A227;border-radius:4px;background:#F5E6D3;color:#2C1810;resize:vertical;" placeholder="记录此角色不为人知的阴暗面...">${content}</textarea>
               <div style="margin-top:12px;display:flex;gap:8px;justify-content:center;">
                 <button class="btn btn-primary" onclick="NPCManager.saveDarkSide('${npc.id}')">💾 保存</button>
                 <button class="btn btn-secondary" onclick="NPCManager.toggleDarkSide('${npc.id}')">🔒 收起</button>
               </div>`
            : `<div class="juncheng-encrypted-panel" onclick="NPCManager.toggleDarkSide('${npc.id}')" style="cursor:pointer;">
                 <div class="juncheng-secret-lock">🔒</div>
                 <div class="juncheng-secret-text">点击展开阴暗面记录</div>
                 ${content ? '<div style="font-size:11px;color:#8B7355;margin-top:8px;">已有内容，点击查看</div>' : ''}
               </div>`}
        </div>
      </div>
    `;
  },

  toggleDarkSide(id) {
    const npc = this.getNPCById(id);
    if (!npc) return;
    npc._darkSideExpanded = !npc._darkSideExpanded;
    this._currentNPC = npc;
    this.switchTab('darkSide');
  },

  saveDarkSide(id) {
    const textarea = document.getElementById('darkSideEdit');
    if (!textarea) return;
    this.updateNPC(id, { darkSide: textarea.value });
    App.toast('阴暗面已保存', 'success');
    this.toggleDarkSide(id);
  },

  /* ========== 秘密档案标签页（加密样式） ========== */
  renderSecretTab(npc) {
    const content = npc.secret || '';
    const isUnlocked = npc._secretUnlocked || false;
    return `
      <div class="juncheng-info-card">
        <div class="juncheng-info-card-header">🔐 秘密档案</div>
        <div id="secretContent">
          ${isUnlocked
            ? `<textarea id="secretEdit" rows="8" style="width:100%;font-family:'Noto Serif SC',serif;font-size:14px;padding:12px;border:1px solid #C9A227;border-radius:4px;background:#F5E6D3;color:#2C1810;resize:vertical;" placeholder="记录最高机密的档案内容...">${content}</textarea>
               <div style="margin-top:12px;display:flex;gap:8px;justify-content:center;">
                 <button class="btn btn-primary" onclick="NPCManager.saveSecret('${npc.id}')">💾 保存</button>
                 <button class="btn btn-secondary" onclick="NPCManager.lockSecret('${npc.id}')">🔒 加密</button>
               </div>`
            : `<div class="juncheng-encrypted-panel" onclick="NPCManager.unlockSecret('${npc.id}')" style="cursor:pointer;">
                 <div class="juncheng-secret-lock">🔐</div>
                 <div class="juncheng-secret-text">秘密档案已加密，点击解密查看</div>
                 ${content ? '<div style="font-size:11px;color:#8B7355;margin-top:8px;">档案已有内容</div>' : ''}
               </div>`}
        </div>
      </div>
    `;
  },

  unlockSecret(id) {
    const npc = this.getNPCById(id);
    if (!npc) return;
    npc._secretUnlocked = true;
    this._currentNPC = npc;
    this.switchTab('secret');
  },

  lockSecret(id) {
    const npc = this.getNPCById(id);
    if (!npc) return;
    npc._secretUnlocked = false;
    this._currentNPC = npc;
    this.switchTab('secret');
  },

  saveSecret(id) {
    const textarea = document.getElementById('secretEdit');
    if (!textarea) return;
    this.updateNPC(id, { secret: textarea.value });
    App.toast('秘密档案已保存', 'success');
    this.lockSecret(id);
  },

  /* ========== 秘密背包标签页 ========== */
  renderSecretBagTab(npc) {
    const items = npc.secretBagItems || [];
    return `
      <div class="juncheng-info-card">
        <div class="juncheng-info-card-header" style="display:flex;justify-content:space-between;align-items:center;">
          <span>🎒 秘密背包</span>
          <button class="btn btn-sm btn-gold" onclick="NPCManager.addSecretBagItem('${npc.id}')">➕ 添加物品</button>
        </div>
        ${items.length > 0
          ? `<div>${items.map((item, idx) => `
              <div class="juncheng-bag-item">
                <div>
                  <div class="juncheng-bag-item-name">${item.name || '未命名物品'}</div>
                  <div class="juncheng-bag-item-desc">${item.description || ''}</div>
                </div>
                <button class="btn btn-sm btn-danger" onclick="NPCManager.deleteSecretBagItem('${npc.id}', ${idx})">删除</button>
              </div>
            `).join('')}</div>`
          : '<div class="juncheng-empty-state">背包为空</div>'}
      </div>
    `;
  },

  addSecretBagItem(id) {
    const name = prompt('物品名称：');
    if (!name) return;
    const description = prompt('物品描述：') || '';
    const npc = this.getNPCById(id);
    if (!npc) return;
    const items = npc.secretBagItems || [];
    items.push({ name, description, addedAt: Date.now() });
    this.updateNPC(id, { secretBagItems: items });
    App.toast(`已添加「${name}」到秘密背包`, 'success');
    this.switchTab('secretBag');
  },

  deleteSecretBagItem(id, idx) {
    const npc = this.getNPCById(id);
    if (!npc) return;
    const items = [...(npc.secretBagItems || [])];
    const removed = items.splice(idx, 1);
    this.updateNPC(id, { secretBagItems: items });
    if (removed.length) App.toast(`已删除「${removed[0].name}」`, 'success');
    this.switchTab('secretBag');
  },

  /* ========== 关系图标签页 ========== */
  renderRelationsTab(npc) {
    return `
      <div class="juncheng-info-card">
        <div class="juncheng-info-card-header">🕸️ 关系图</div>
        <div style="text-align:center;padding:32px;">
          <div style="font-size:48px;margin-bottom:12px;">🕸️</div>
          <p style="color:#8B7355;font-size:14px;margin-bottom:16px;">查看此角色的人际关系网络</p>
          <button class="btn btn-primary" onclick="NPCManager.showRelations('${npc.id}')">查看完整关系图</button>
        </div>
      </div>
    `;
  },

  /* ========== 心情记录标签页 ========== */
  renderMoodTab(npc) {
    const containerId = 'mood-chart-container-' + npc.id;
    // 提前设置NPC名称缓存，确保图表能正确显示名称
    if (typeof NPCMoodTracker !== 'undefined' && NPCMoodTracker.setNpcName) {
      NPCMoodTracker.setNpcName(npc.id, npc.name);
    }
    // 使用setTimeout延迟渲染Canvas图表，确保DOM已挂载
    setTimeout(() => {
      if (typeof NPCMoodTracker !== 'undefined' && NPCMoodTracker.renderMoodChart) {
        NPCMoodTracker.renderMoodChart(containerId, npc.id, 0);
      }
    }, 0);
    return `
      <div class="juncheng-info-card">
        <div class="juncheng-info-card-header">📈 心情记录</div>
        <div id="${containerId}" style="min-height:320px;"></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;padding:0 8px 12px;">
          <button class="btn btn-sm btn-secondary" onclick="NPCManager.showMoodComparison('${npc.id}')">对比其他角色</button>
          <button class="btn btn-sm btn-secondary" onclick="NPCManager.generateMoodDemoData('${npc.id}')">生成示例数据</button>
          <button class="btn btn-sm btn-danger" onclick="NPCManager.clearMoodHistory('${npc.id}')">清空记录</button>
          <button class="btn btn-sm btn-primary" onclick="NPCManager.exportMoodChart('${npc.id}')">导出图表</button>
        </div>
      </div>
    `;
  },

  showMoodComparison(npcId) {
    const npcs = this.getNPCs().filter(n => n.id !== npcId);
    if (npcs.length === 0) {
      App.toast('没有其他角色可供对比', 'warning');
      return;
    }
    const names = npcs.map(n => `${n.name || '未命名'} (${n.id})`).join('\n');
    const selected = prompt('请选择要对比的角色（输入角色编号）：\n' + names);
    if (!selected) return;
    const targetId = selected.trim();
    const target = this.getNPCById(targetId);
    if (!target) {
      App.toast('未找到该角色', 'error');
      return;
    }
    const containerId = 'mood-chart-container-' + npcId;
    if (typeof NPCMoodTracker !== 'undefined' && NPCMoodTracker.renderComparisonChart) {
      NPCMoodTracker.renderComparisonChart(containerId, [npcId, targetId], 0);
    }
  },

  generateMoodDemoData(npcId) {
    const npc = this.getNPCById(npcId);
    if (!npc) return;
    if (typeof NPCMoodTracker !== 'undefined' && NPCMoodTracker.generateDemoData) {
      NPCMoodTracker.generateDemoData(npcId, npc.name || '未命名');
      this.switchTab('mood');
      App.toast('示例数据已生成，请重新切换标签查看', 'success');
    }
  },

  clearMoodHistory(npcId) {
    if (!confirm('确定要清空该角色的好感度记录吗？此操作不可撤销。')) return;
    if (typeof NPCMoodTracker !== 'undefined' && NPCMoodTracker.clearHistory) {
      NPCMoodTracker.clearHistory();
      this.switchTab('mood');
      App.toast('好感度记录已清空', 'success');
    }
  },

  exportMoodChart(npcId) {
    const canvasId = 'mood-chart-container-' + npcId + '-mood-canvas';
    if (typeof NPCMoodTracker !== 'undefined' && NPCMoodTracker.exportChartPNG) {
      NPCMoodTracker.exportChartPNG(canvasId);
    }
  },

  /* ========== DIY字段系统 ========== */
  openAddDIYFieldModal(id) {
    this._editingNPCId = id;
    App.showModal('npcAddFieldModal');
  },

  confirmAddDIYField() {
    const name = document.getElementById('diyFieldName')?.value?.trim();
    const type = document.getElementById('diyFieldType')?.value || 'text';
    const value = document.getElementById('diyFieldValue')?.value || '';
    if (!name) { App.toast('字段名称不能为空', 'error'); return; }

    const npc = this.getNPCById(this._editingNPCId);
    if (!npc) return;

    const customFields = [...(npc.customFields || [])];
    customFields.push({ name, type, value, createdAt: Date.now() });
    this.updateNPC(this._editingNPCId, { customFields });

    App.toast(`已添加自定义字段「${name}」`, 'success');
    App.closeModal('npcAddFieldModal');

    // 清空输入
    const nameInput = document.getElementById('diyFieldName');
    const valueInput = document.getElementById('diyFieldValue');
    if (nameInput) nameInput.value = '';
    if (valueInput) valueInput.value = '';

    // 刷新当前标签页
    if (this._currentNPC && this._currentNPC.id === this._editingNPCId) {
      this.switchTab('info');
    }
  },

  editDIYField(id, idx) {
    const npc = this.getNPCById(id);
    if (!npc || !npc.customFields || !npc.customFields[idx]) return;
    const field = npc.customFields[idx];
    const newValue = prompt(`修改「${field.name}」的值：`, field.value || '');
    if (newValue === null) return; // 用户取消
    const customFields = [...npc.customFields];
    customFields[idx] = { ...field, value: newValue };
    this.updateNPC(id, { customFields });
    App.toast(`已更新「${field.name}」`, 'success');
    if (this._currentNPC && this._currentNPC.id === id) {
      this.switchTab('info');
    }
  },

  deleteDIYField(id, idx) {
    if (!confirm('确定删除此自定义字段吗？')) return;
    const npc = this.getNPCById(id);
    if (!npc || !npc.customFields) return;
    const customFields = [...npc.customFields];
    const removed = customFields.splice(idx, 1);
    this.updateNPC(id, { customFields });
    if (removed.length) App.toast(`已删除「${removed[0].name}」`, 'success');
    if (this._currentNPC && this._currentNPC.id === id) {
      this.switchTab('info');
    }
  },

  /* ========== AI建议字段功能 ========== */
  async aiSuggestFields(id) {
    const npc = this.getNPCById(id);
    if (!npc) return;
    App.toast('正在向AI请求字段建议...', 'info');
    try {
      const prompt = `请为以下古风视觉小说角色建议3-5个缺失的自定义字段及其合理值。
角色信息：
名字：${npc.name || '未命名'}
年龄：${npc.age || '不详'}
职业：${npc.job || '不详'}
身份：${npc.identity || npc.title || '不详'}
性情：${npc.temperament || npc.personality || '不详'}
出身：${npc.origin || '不详'}

请返回JSON数组格式，每个元素包含：name（字段名）、type（字段类型：text/number/date/textarea/select）、value（建议值）。
只返回JSON，不要其他文字。`;
      const result = await APISettings.chat(prompt, [], { useAux: true });
      let suggestions = [];
      try {
        // 尝试从返回中提取JSON
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        App.toast('AI返回格式解析失败', 'error');
        return;
      }
      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        App.toast('AI未提供有效建议', 'warning');
        return;
      }
      // 应用建议
      const customFields = [...(npc.customFields || [])];
      suggestions.forEach(s => {
        customFields.push({
          name: s.name || '未命名',
          type: s.type || 'text',
          value: String(s.value || ''),
          createdAt: Date.now(),
          aiSuggested: true
        });
      });
      this.updateNPC(id, { customFields });
      App.toast(`AI已建议并添加 ${suggestions.length} 个字段`, 'success');
      if (this._currentNPC && this._currentNPC.id === id) {
        this.switchTab('info');
      }
    } catch (e) {
      console.error('AI建议字段失败：', e);
      App.toast('AI建议失败，请稍后重试', 'error');
    }
  },

  /* ========== 辅助方法 ========== */
  getFieldLabel(key) {
    const field = this.BUILTIN_FIELDS.find(f => f.key === key);
    return field ? field.label : key;
  },

  viewNPC(id) {
    const npc = this.getNPCById(id);
    if (!npc) return;
    this._currentNPC = npc;
    this._viewMode = 'detail';
    this._activeTab = 'info';
    this.renderList();
  },

  leaveDetail() {
    this._currentNPC = null;
    this._viewMode = 'card';
    this._activeTab = 'info';
    this.renderList();
  },

  talkTo(id) {
    App.navigate('runtime');
    setTimeout(() => {
      if (NovelRuntime && NovelRuntime.selectNPC) NovelRuntime.selectNPC(id);
    }, 300);
  },

  /* ========== 右侧/底部按钮操作占位 ========== */
  showRelations(id) { App.toast('关系图功能开发中...', 'info'); },
  showInventory(id) { App.toast('库房功能开发中...', 'info'); },
  raiseChild(id) { App.toast('抚养功能开发中...', 'info'); },
  promoteRank(id) { App.toast('晋封功能开发中...', 'info'); },
  changeRank(id) { App.toast('升降位分功能开发中...', 'info'); },
  toggleInsurance(id) { App.toast('保险功能开发中...', 'info'); },
  showAffairs(id) { App.toast('事务功能开发中...', 'info'); },
  sendToColdPalace(id) {
    if (confirm('确定要将此角色打入冷宫吗？')) {
      App.toast('已打入冷宫', 'warning');
    }
  },
  socialize(id) { App.toast('交游功能开发中...', 'info'); },
  divination(id) { App.toast('灵台功能开发中...', 'info'); },
  viewBiography(id) {
    this._activeTab = 'biography';
    this.switchTab('biography');
  },
  giveTitle(id) {
    const title = prompt('请输入徽号：');
    if (title) {
      this.updateNPC(id, { title });
      App.toast(`已上徽号「${title}」`, 'success');
      if (this._currentNPC) this.renderNPCDetail();
    }
  },

  /* ========== 日志/记事操作 ========== */
  addLogEntry(id) {
    const content = prompt('请输入日志内容：');
    if (!content) return;
    const npc = this.getNPCById(id);
    if (!npc) return;
    const logs = [...(npc.logs || [])];
    logs.push({ content, timestamp: Date.now() });
    this.updateNPC(id, { logs });
    App.toast('日志已添加', 'success');
    if (this._currentNPC && this._currentNPC.id === id) {
      this.switchTab('logs');
    }
  },

  addBiographyEvent(id) {
    const content = prompt('请输入记事内容：');
    if (!content) return;
    const npc = this.getNPCById(id);
    if (!npc) return;
    const biography = [...(npc.biography || [])];
    biography.push({ content, date: Date.now() });
    this.updateNPC(id, { biography });
    App.toast('记事已添加', 'success');
    if (this._currentNPC && this._currentNPC.id === id) {
      this.switchTab('biography');
    }
  },

  /* ========== 编辑器模态框 ========== */
  openCreateNPCModal() {
    this._currentNPC = null;
    this.renderNPCEditModal();
  },

  openEditor(id) {
    this._currentNPC = id ? this.getNPCById(id) : null;
    this.renderNPCEditModal();
  },

  editNPC(id) { this.openEditor(id); },

  renderNPCEditModal() {
    const titleEl = document.getElementById('npcEditorTitle');
    if (titleEl) {
      titleEl.textContent = this._currentNPC ? '编辑角色' : '新建角色';
    }
    const fields = [...this.BUILTIN_FIELDS, ...this.getDIYFields()];
    const body = document.getElementById('npcEditorBody');
    if (!body) return;

    body.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--space-md);">
        ${fields.map(f => {
          const v = this._currentNPC ? (this._currentNPC[f.key] || '') : (f.default || '');
          return `<div class="form-group">
            <label>${f.label}${f.required ? ' *' : ''}</label>
            ${f.type === 'textarea'
              ? `<textarea id="npc_${f.key}" rows="3">${v}</textarea>`
              : `<input type="${f.type}" id="npc_${f.key}" value="${v}">`}
          </div>`;
        }).join('')}
      </div>
      <!-- 属性网格编辑 -->
      <div style="margin-top:var(--space-md);padding-top:var(--space-md);border-top:1px solid #C9A227;">
        <h4 style="font-size:14px;margin-bottom:var(--space-sm);font-family:'Noto Serif SC',serif;">⚔️ 属性面板（0-100）</h4>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;">
          ${this.STAT_GRID.map(s => {
            const val = this._currentNPC?.stats?.[s.key] || 0;
            return `<div class="form-group" style="margin:0;">
              <label style="font-size:11px;">${s.icon} ${s.label}</label>
              <input type="number" id="npc_stat_${s.key}" value="${val}" min="0" max="100" style="font-size:14px;text-align:center;">
            </div>`;
          }).join('')}
        </div>
      </div>
      <!-- 立绘设置 -->
      <div style="margin-top:var(--space-md);padding-top:var(--space-md);border-top:1px solid #C9A227;">
        <h4 style="font-size:14px;margin-bottom:var(--space-sm);font-family:'Noto Serif SC',serif;">🖼️ 立绘设置</h4>
        <div style="display:flex;gap:var(--space-md);align-items:flex-start;">
          <div>
            <input type="file" id="npcPortraitUpload" accept="image/*" onchange="NPCManager.handlePortraitUpload(this)">
            <p class="hint">支持 JPG / PNG，建议 2:3 比例</p>
          </div>
          <div id="npcPortraitPreview" style="width:120px;height:160px;border:2px solid #C9A227;border-radius:var(--border-radius-sm);display:flex;align-items:center;justify-content:center;color:#8B7355;overflow:hidden;">
            ${this._currentNPC?.portraitId
              ? `<img src="${this._currentNPC.portraitId}" style="max-width:100%;max-height:100%;object-fit:cover;border-radius:var(--border-radius-sm);">`
              : '预览'}
          </div>
        </div>
      </div>
    `;
    App.showModal('npcEditorModal');
  },

  async handlePortraitUpload(input) {
    const file = input.files[0];
    if (!file) return;
    const id = await Storage.saveImage(file);
    const preview = document.getElementById('npcPortraitPreview');
    if (preview) {
      const url = await Storage.getImage(id);
      preview.innerHTML = `<img src="${url}" style="max-width:100%;max-height:100%;object-fit:cover;border-radius:var(--border-radius-sm);">`;
    }
    input.dataset.imageId = id;
  },

  saveEditor() {
    const fields = [...this.BUILTIN_FIELDS, ...this.getDIYFields()];
    const data = {};
    fields.forEach(f => {
      const el = document.getElementById('npc_' + f.key);
      data[f.key] = el ? (f.type === 'number' ? parseInt(el.value) || 0 : el.value) : '';
    });

    // 收集属性值
    const stats = {};
    this.STAT_GRID.forEach(s => {
      const el = document.getElementById('npc_stat_' + s.key);
      stats[s.key] = el ? parseInt(el.value) || 0 : 0;
    });
    data.stats = stats;

    const portraitInput = document.getElementById('npcPortraitUpload');
    if (portraitInput && portraitInput.dataset.imageId) {
      data.portraitId = portraitInput.dataset.imageId;
    } else if (this._currentNPC) {
      data.portraitId = this._currentNPC.portraitId;
    }

    // 保存表情差分
    const expressionsInput = document.getElementById('npcExpressions');
    if (expressionsInput) {
      try {
        const raw = expressionsInput.value.trim();
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) {
          data.expressions = parsed;
        }
      } catch (e) {
        console.warn('表情差分 JSON 解析失败:', e);
      }
    } else if (this._currentNPC && Array.isArray(this._currentNPC.expressions)) {
      data.expressions = this._currentNPC.expressions;
    }

    if (!data.name) { App.toast('姓名必填', 'error'); return; }

    if (this._currentNPC) {
      this.updateNPC(this._currentNPC.id, data);
    } else {
      this.addNPC(data);
    }

    App.closeModal('npcEditorModal');
    this.renderList();
    App.toast('角色已保存', 'success');
    if (EventBridge) EventBridge.emit('npc', 'saved', { count: this.getNPCs().length }, 'NPCManager');
  },

  /* ========== AI生成档案 ========== */
  async aiGenProfile() {
    const name = document.getElementById('npc_name')?.value;
    if (!name) { App.toast('请先输入姓名', 'error'); return; }
    try {
      const prompt = `为角色"${name}"生成一个古风视觉小说风格的完整档案。返回格式：
称号|年龄|性别|职业|婚姻状况|住址|体型|性格|背景故事|对话风格|外貌|喜好|厌恶|初始好感(0-100)
每行一个字段，用|分隔。`;
      const result = await APISettings.chat(prompt, [], { useAux: true });
      const parts = result.split('|').map(p => p.trim());
      const keys = ['title', 'age', 'gender', 'job', 'marriage', 'address', 'bodyType', 'personality', 'background', 'dialogStyle', 'appearance', 'likes', 'dislikes', 'affection'];
      keys.forEach((k, i) => {
        const el = document.getElementById('npc_' + k);
        if (el && parts[i]) el.value = parts[i];
      });
      App.toast('AI已生成档案', 'success');
    } catch (e) { App.toast('AI生成失败', 'error'); }
  },

  /* ========== 立绘库 ========== */
  openPortraitLibrary() {
    App.showModal('npcPortraitLibModal');
    const body = document.getElementById('portraitLibBody');
    if (!body) return;
    const npcs = this.getNPCs().filter(n => n.portraitId);
    if (npcs.length === 0) { body.innerHTML = '<div class="juncheng-empty-state"><p>暂无立绘</p></div>'; return; }
    body.innerHTML = `<div class="grid grid-4">${npcs.map(n => `
      <div class="card" style="cursor:pointer;" onclick="NPCManager.viewNPC('${n.id}')">
        <img src="${n.portraitId}" class="thumb thumb-portrait" alt="${n.name}" onerror="this.style.display='none';this.parentElement.innerHTML='<div style=\\'padding:20px;text-align:center;color:#8B7355;\\'>👤 ${n.name}</div>'">
        <div style="padding:8px;text-align:center;"><h4 style="font-size:13px;font-family:\"Noto Serif SC\",serif;">${n.name}</h4></div>
      </div>
    `).join('')}</div>`;
  },

  /* ========== 立绘/头像相关方法 ========== */
  renderPortrait(npcId) {
    const npc = this.getNPCById(npcId);
    if (!npc) return '';
    return npc.portraitId
      ? `<img src="${npc.portraitId}" style="width:100%;height:100%;object-fit:cover;" alt="${npc.name}" onerror="this.style.display='none'">`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#C9A227;font-size:48px;font-family:'Noto Serif SC',serif;">${npc.name ? npc.name[0] : '?'}</div>`;
  },

  async savePortrait(npcId, imageFile) {
    const imageId = await Storage.saveImage(imageFile);
    this.updateNPC(npcId, { portraitId: imageId });
    return imageId;
  },

  async saveAvatar(npcId, imageFile) {
    const imageId = await Storage.saveImage(imageFile);
    this.updateNPC(npcId, { avatarId: imageId });
    return imageId;
  },

  detectTransparency(imageDataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        try {
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] < 255) { resolve(true); return; }
          }
        } catch (e) { resolve(false); }
        resolve(false);
      };
      img.onerror = () => resolve(false);
      img.src = imageDataUrl;
    });
  },

  /* ========== 批量立绘 ========== */
  openBatchPortraitModal() {
    this._batchMode = 'album';
    App.showModal('npcBatchPortraitModal');
    this.setBatchMode('album');
  },

  setBatchMode(mode) {
    this._batchMode = mode;
    const area = document.getElementById('batchUploadArea');
    if (!area) return;
    if (mode === 'album') {
      area.innerHTML = `
        <p style="color:#8B7355;font-size:13px;">选择多张图片，系统会自动为角色匹配立绘。</p>
        <input type="file" id="batchPortraitInput" accept="image/*" multiple onchange="NPCManager.handleBatchPortraitUpload(this)">
        <div id="batchPortraitPreview" style="margin-top:12px;"></div>
      `;
    } else {
      area.innerHTML = `
        <p style="color:#8B7355;font-size:13px;">每行输入一个图片URL，系统会自动下载并匹配角色。</p>
        <textarea id="batchPortraitUrlList" rows="6" placeholder="https://example.com/npc1.png\nhttps://example.com/npc2.png"></textarea>
        <div id="batchPortraitPreview" style="margin-top:12px;"></div>
      `;
    }
    const btn = document.getElementById('batchConfirmBtn');
    if (btn) btn.textContent = mode === 'album' ? '确认匹配' : '开始下载';
  },

  async handleBatchPortraitUpload(input) {
    const files = Array.from(input.files || []);
    if (files.length === 0) return;
    const preview = document.getElementById('batchPortraitPreview');
    this._batchPendingFiles = files;
    if (preview) {
      preview.innerHTML = `<p style="color:#8B7355;font-size:13px;">已选择 ${files.length} 张图片，点击"确认匹配"为角色分配立绘。</p>`;
    }
    input.dataset.files = JSON.stringify(files.map(f => f.name));
  },

  async confirmBatchPortrait() {
    // URL 模式
    if (this._batchMode === 'url') {
      const textarea = document.getElementById('batchPortraitUrlList');
      const urls = textarea.value.split('\n').map(u => u.trim()).filter(u => /^https?:\/\/.+/.test(u));
      if (!urls.length) { App.toast('请输入有效的图片URL', 'warning'); return; }
      const npcs = this.getNPCs();
      const preview = document.getElementById('batchPortraitPreview');
      let matched = 0, failed = 0;
      preview.innerHTML = `<div class="progress-bar"><div class="progress-fill" style="width:0%"></div></div><p style="font-size:12px;color:#8B7355;">下载中 0/${urls.length}...</p>`;
      for (let i = 0; i < urls.length; i++) {
        try {
          const response = await fetch(urls[i], { mode: 'cors' });
          if (!response.ok) throw new Error('HTTP ' + response.status);
          const blob = await response.blob();
          if (!blob.type.startsWith('image/')) throw new Error('Not image');
          const ext = blob.type.split('/')[1] || 'png';
          const file = new File([blob], `url_npc_${i}.${ext}`, { type: blob.type });
          const data = await Storage.fileToDataUrl(file);
          const imageId = await Storage.saveImage('npc_url_' + Date.now() + '_' + i, 'npc_portrait', null, file.name, data, { sourceUrl: urls[i] });
          if (i < npcs.length) {
            this.updateNPC(npcs[i].id, { portraitId: imageId });
            matched++;
          }
        } catch (e) { failed++; console.error(`URL ${i} failed:`, e); }
        const pct = Math.round(((i+1)/urls.length)*100);
        preview.innerHTML = `<div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div><p style="font-size:12px;color:#8B7355;">下载中 ${i+1}/${urls.length}... 成功 ${matched} 失败 ${failed}</p>`;
      }
      App.toast(`URL立绘下载完成：成功 ${matched}/${urls.length}`, matched > 0 ? 'success' : 'error');
      App.closeModal('npcBatchPortraitModal');
      this.renderList();
      return;
    }

    // 相册模式
    const input = document.getElementById('batchPortraitInput');
    if (!input || !input.files || input.files.length === 0) {
      App.toast('请先选择图片', 'warning'); return;
    }
    const npcs = this.getNPCs();
    const files = Array.from(input.files);
    let matched = 0;
    for (let i = 0; i < Math.min(files.length, npcs.length); i++) {
      try {
        const data = await Storage.fileToDataUrl(files[i]);
        const imageId = await Storage.saveImage('npc_batch_' + Date.now() + '_' + i, 'npc_portrait', null, files[i].name, data);
        this.updateNPC(npcs[i].id, { portraitId: imageId });
        matched++;
      } catch (e) { console.error('批量立绘保存失败：', e); }
    }
    App.toast(`已为 ${matched} 位角色匹配立绘`, 'success');
    App.closeModal('npcBatchPortraitModal');
    this.renderList();
  },

  /* ========== 导入/导出 ========== */
  exportNPCs() {
    const npcs = this.getNPCs();
    const dataStr = JSON.stringify(npcs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `npcs_export_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    App.toast(`已导出 ${npcs.length} 位角色`, 'success');
  },

  importNPCs(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          if (!Array.isArray(imported)) { reject(new Error('格式错误')); return; }
          const existing = this.getNPCs();
          // 去重合并（以ID为准）
          const existingIds = new Set(existing.map(n => n.id));
          const newNPCs = imported.filter(n => n.id && !existingIds.has(n.id));
          const merged = [...existing, ...newNPCs];
          this.saveNPCs(merged);
          App.toast(`导入成功：新增 ${newNPCs.length} 位角色`, 'success');
          this.renderList();
          resolve({ imported: newNPCs.length, total: merged.length });
        } catch (err) { reject(err); }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }
};
