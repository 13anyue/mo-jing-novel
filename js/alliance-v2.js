/**
 * =========================================================
 * AllianceSystem v2 — 联盟系统 v2（势力/家族/个人联盟关系）
 * 模块名：AllianceSystem
 * 功能：
 *   1. 联盟类型自定义（国家/家族/门派/朋友圈/商帮/任意）
 *   2. 成员管理（邀请、职位自定义、权限、贡献、退出/驱逐）
 *   3. 联盟互动（结盟/断交/敌对/合并/分裂）
 *   4. 联盟实际功能影响（资源共享、领地加成、贸易/战争、科技文化）
 *   5. 联盟关系网络可视化（Canvas 节点连线，支持缩放/平移）
 *   6. 联盟事件（自动生成 + 成员共同决策）
 *   7. 三栏式界面 + 底部网络图
 *
 * 全局对象：AllianceSystem（覆盖旧版本）
 * 存储键：alliance_system_v16
 * 配色：古风墨境 — 暖羊皮纸 #F5E6D3 / 金色 #C9A227 / 墨色 #2C1810
 * 联动：
 *   - FamilySystem：家族成员可加入联盟
 *   - PoliticalSystem：势力可视为大型联盟
 * =========================================================
 */

const AllianceSystem = {

  // ===================== 常量与配置 =====================

  /** @type {string} localStorage 存储键 */
  STORAGE_KEY: 'alliance_system_v16',

  /** @type {Object} 古风墨境配色方案 */
  COLORS: {
    parchment: '#F5E6D3',         // 暖羊皮纸底色
    parchmentLight: '#FDF8F0',    // 浅羊皮纸
    parchmentDark: '#E8D4BC',     // 深羊皮纸
    ink: '#2C1810',               // 墨色
    inkLight: '#5C3A2A',          // 浅墨色
    inkMuted: '#8B7355',          // 淡墨色
    gold: '#C9A227',              // 金色
    goldLight: '#E8C84B',         // 亮金
    goldDark: '#A08020',          // 暗金
    crimson: '#8B1A1A',           // 深红（敌对）
    jade: '#2D5A3D',              // 翠绿（同盟）
    amber: '#B8860B',             // 琥珀（中立/紧张）
    white: '#FDF8F0',             // 纯白
    shadow: 'rgba(44,24,16,0.15)' // 阴影
  },

  /** @type {Array<Object>} 规模等级定义 */
  SCALE_LEVELS: [
    { name: '小型',  min: 0,   max: 10,  radius: 20, prestigeMultiplier: 1.0 },
    { name: '中型',  min: 11,  max: 50,  radius: 30, prestigeMultiplier: 1.5 },
    { name: '大型',  min: 51,  max: 200, radius: 42, prestigeMultiplier: 2.0 },
    { name: '巨型',  min: 201, max: Infinity, radius: 56, prestigeMultiplier: 3.0 }
  ],

  /** @type {Array<string>} 默认权限列表 */
  DEFAULT_PERMISSIONS: ['发言', '决策', '管理', '外交', '驱逐'],

  /** @type {Object} 预设事件类型 */
  EVENT_TYPES: {
    internal_dispute: { name: '内部分歧', desc: '联盟内部出现意见分歧，需要共同决策', severity: 'normal' },
    external_threat:  { name: '外部威胁', desc: '敌对势力蠢蠢欲动', severity: 'high' },
    development:      { name: '发展机遇', desc: '发现新的发展机遇', severity: 'normal' },
    celebration:      { name: '联盟庆典', desc: '联盟周年庆典或重大节日', severity: 'low' },
    emergency:        { name: '紧急会议', desc: '突发状况需要紧急召集', severity: 'high' },
    member_join:      { name: '新成员加入', desc: '有新成员申请加入联盟', severity: 'low' },
    member_leave:     { name: '成员离开', desc: '成员退出或被驱逐', severity: 'normal' },
    war_declare:      { name: '宣战', desc: '联盟对外宣战或被宣战', severity: 'high' },
    trade_agreement:  { name: '贸易协定', desc: '与其他联盟达成贸易协定', severity: 'normal' }
  },

  /** @type {Object} 外交关系类型与颜色 */
  RELATION_TYPES: {
    ally:    { name: '同盟', color: '#4CAF50', lineColor: '#2D5A3D' },
    neutral: { name: '中立', color: '#9E9E9E', lineColor: '#8B7355' },
    hostile: { name: '敌对', color: '#F44336', lineColor: '#8B1A1A' }
  },

  /** @type {number} 最大存储事件数量 */
  MAX_EVENTS: 500,

  /** @type {number} 最大历史记录数 */
  MAX_HISTORY: 1000,

  // ===================== 运行时状态 =====================

  /** @type {Array<Object>} 联盟列表 */
  alliances: [],

  /** @type {string|null} 当前选中联盟ID */
  currentAllianceId: null,

  /** @type {Object} Canvas 视图状态 */
  networkState: {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    lastMouseX: 0,
    lastMouseY: 0
  },

  /** @type {HTMLCanvasElement|null} 关系网络 Canvas */
  networkCanvas: null,

  /** @type {CanvasRenderingContext2D|null} Canvas 上下文 */
  networkCtx: null,

  /** @type {Object} UI 状态 */
  uiState: {
    tab: 'list',           // 'list' | 'events' | 'diplomacy'
    searchQuery: '',
    showEmpty: false,
    selectedMemberId: null,
    selectedEventId: null,
    modalOpen: false
  },

  /** @type {number} ID 计数器 */
  _idCounter: 0,

  // ===================== 初始化 =====================

  /**
   * 初始化联盟系统
   */
  init() {
    this.load();
    this.bindKeyboardShortcuts();
    this.listenToEventBridge();
    console.log('[AllianceSystem] 联盟系统 v2 初始化完成，联盟数:', this.alliances.length);
  },

  /**
   * 进入联盟页面时调用
   */
  onEnter() {
    this.load();
    this.renderPage();
  },

  /**
   * 绑定键盘快捷键
   */
  bindKeyboardShortcuts() {
    if (typeof document === 'undefined') return;
    document.addEventListener('keydown', (e) => {
      if (!this.networkCanvas) return;
      if (e.key === '+' || e.key === '=') { e.preventDefault(); this.zoomIn(); }
      if (e.key === '-' || e.key === '_') { e.preventDefault(); this.zoomOut(); }
      if (e.key === '0') { e.preventDefault(); this.resetCanvasView(); }
    });
  },

  /**
   * 监听 EventBridge 事件
   */
  listenToEventBridge() {
    if (typeof window === 'undefined' || !window.EventBridge) return;
    // 监听家族事件，自动关联
    EventBridge.on('family', (e) => {
      if (e.type === 'family_created' && e.payload?.familyId) {
        this.syncFromFamilySystem();
      }
    }, 'AllianceSystem');
    // 监听势力事件，自动关联
    EventBridge.on('political', (e) => {
      if (e.type === 'faction_created') {
        this.syncFromPoliticalSystem();
      }
    }, 'AllianceSystem');
  },

  // ===================== 数据持久化 =====================

  /**
   * 从 localStorage 加载数据
   */
  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        this.alliances = data.alliances || [];
        this._idCounter = data._idCounter || 0;
        if (data.uiState) {
          this.uiState = { ...this.uiState, ...data.uiState };
        }
      }
    } catch (e) {
      console.warn('[AllianceSystem] 加载数据失败:', e);
      this.alliances = [];
    }
  },

  /**
   * 保存数据到 localStorage
   */
  save() {
    try {
      const data = {
        alliances: this.alliances,
        _idCounter: this._idCounter,
        uiState: {
          tab: this.uiState.tab,
          searchQuery: this.uiState.searchQuery
        },
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[AllianceSystem] 保存数据失败:', e);
    }
  },

  // ===================== 联盟类型与规模 =====================

  /**
   * 根据成员数量获取规模等级
   * @param {number} memberCount
   * @returns {Object}
   */
  getScaleLevel(memberCount) {
    return this.SCALE_LEVELS.find(lv => memberCount >= lv.min && memberCount <= lv.max)
      || this.SCALE_LEVELS[this.SCALE_LEVELS.length - 1];
  },

  /**
   * 计算联盟声望
   * @param {Object} alliance
   * @returns {number}
   */
  calculatePrestige(alliance) {
    const scale = this.getScaleLevel((alliance.members || []).length);
    let prestige = (alliance.resources?.prestige || 0);
    // 盟友加成
    const allyCount = Object.keys(alliance.allies || {}).length;
    prestige += allyCount * 10 * scale.prestigeMultiplier;
    // 敌对减分
    const enemyCount = Object.keys(alliance.enemies || {}).length;
    prestige -= enemyCount * 5;
    // 成员贡献加成
    const totalContribution = (alliance.members || []).reduce((sum, m) => sum + (m.contribution || 0), 0);
    prestige += totalContribution * 0.1;
    return Math.max(0, Math.round(prestige));
  },

  // ===================== 联盟 CRUD =====================

  /**
   * 创建新联盟
   * @param {Object} config
   * @returns {Object|null}
   */
  createAlliance(config = {}) {
    const name = config.name || this._generateAllianceName();
    const type = config.type || '自定义联盟';

    // 检查重名
    if (this.alliances.some(a => a.name === name)) {
      console.warn('[AllianceSystem] 联盟名称已存在:', name);
      return null;
    }

    const alliance = {
      id: this._generateId(),
      name: name,
      type: type,
      description: config.description || '',
      foundedDate: config.foundedDate || this._formatDate(Date.now()),
      founder: config.founder || this._getPlayerName(),
      leader: config.leader || this._getPlayerName(),
      members: config.members || [this._createPlayerMember()],
      allies: config.allies || {},      // { [allianceId]: { since, notes } }
      enemies: config.enemies || {},    // { [allianceId]: { since, reason } }
      resources: {
        gold: config.resources?.gold || 1000,
        food: config.resources?.food || 500,
        troops: config.resources?.troops || 100,
        territory: config.resources?.territory || 0,
        prestige: config.resources?.prestige || 50,
        tech: config.resources?.tech || 0,
        culture: config.resources?.culture || 0,
        ...(config.resources || {})
      },
      territory: config.territory || [],
      laws: config.laws || [],
      events: config.events || [],
      history: config.history || [],
      invitations: config.invitations || [],
      mergeRequests: config.mergeRequests || [],
      settings: {
        autoAccept: false,
        openJoin: false,
        contributionThreshold: 0,
        ...config.settings
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.alliances.push(alliance);
    this.save();

    // 记录历史
    this.addHistory(alliance.id, {
      type: '创建',
      title: '联盟成立',
      description: `${alliance.name} 由 ${alliance.founder} 创建，类型：${type}`
    });

    this.emitEvent('alliance_created', { alliance });
    return alliance;
  },

  /**
   * 获取单个联盟
   * @param {string} id
   * @returns {Object|null}
   */
  getAlliance(id) {
    return this.alliances.find(a => a.id === id) || null;
  },

  /**
   * 获取联盟列表
   * @param {Object} filter
   * @returns {Array<Object>}
   */
  getAlliances(filter = {}) {
    let result = [...this.alliances];
    if (filter.type) {
      result = result.filter(a => a.type === filter.type);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q)
      );
    }
    if (filter.minPrestige) {
      result = result.filter(a => this.calculatePrestige(a) >= filter.minPrestige);
    }
    // 按声望降序
    return result.sort((a, b) => this.calculatePrestige(b) - this.calculatePrestige(a));
  },

  /**
   * 更新联盟信息
   * @param {string} id
   * @param {Object} updates
   * @returns {Object|null}
   */
  updateAlliance(id, updates) {
    const alliance = this.getAlliance(id);
    if (!alliance) return null;

    Object.keys(updates).forEach(key => {
      if (key === 'resources') {
        alliance.resources = { ...alliance.resources, ...updates.resources };
      } else if (key === 'settings') {
        alliance.settings = { ...alliance.settings, ...updates.settings };
      } else if (key !== 'id') {
        alliance[key] = updates[key];
      }
    });
    alliance.updatedAt = Date.now();
    this.save();
    this.emitEvent('alliance_updated', { allianceId: id, updates });
    return alliance;
  },

  /**
   * 删除联盟
   * @param {string} id
   * @returns {boolean}
   */
  deleteAlliance(id) {
    const idx = this.alliances.findIndex(a => a.id === id);
    if (idx === -1) return false;
    const alliance = this.alliances[idx];

    // 清理其他联盟的外交记录
    this.alliances.forEach(a => {
      if (a.allies && a.allies[id]) delete a.allies[id];
      if (a.enemies && a.enemies[id]) delete a.enemies[id];
    });

    this.alliances.splice(idx, 1);
    if (this.currentAllianceId === id) this.currentAllianceId = null;
    this.save();
    this.emitEvent('alliance_deleted', { allianceId: id, name: alliance.name });
    return true;
  },

  /**
   * 生成联盟唯一 ID
   * @returns {string}
   */
  _generateId() {
    this._idCounter++;
    return 'al_' + Date.now() + '_' + this._idCounter;
  },

  /**
   * 生成默认联盟名称
   * @returns {string}
   */
  _generateAllianceName() {
    const prefixes = ['天', '地', '玄', '黄', '苍', '穹', '星', '月', '风', '云', '龙', '凤'];
    const suffixes = ['盟', '会', '阁', '宗', '帮', '团', '社', '联', '社', '族'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const s = suffixes[Math.floor(Math.random() * suffixes.length)];
    return p + s;
  },

  /**
   * 获取玩家名称
   * @returns {string}
   */
  _getPlayerName() {
    if (typeof Storage !== 'undefined' && Storage.get) {
      return Storage.get('playerName', '玩家');
    }
    return '玩家';
  },

  /**
   * 创建玩家默认成员对象
   * @returns {Object}
   */
  _createPlayerMember() {
    return {
      id: this._generateId(),
      name: this._getPlayerName(),
      role: '盟主',
      permissions: ['发言', '决策', '管理', '外交', '驱逐'],
      contribution: 100,
      joinedAt: Date.now(),
      status: 'active',
      avatar: '',
      npcId: '',
      familyId: ''
    };
  },

  /**
   * 格式化日期
   * @param {number} ts
   * @returns {string}
   */
  _formatDate(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  // ===================== 成员管理 =====================

  /**
   * 邀请成员加入联盟
   * @param {string} allianceId
   * @param {string} targetName
   * @param {Object} extra
   * @returns {boolean}
   */
  inviteMember(allianceId, targetName, extra = {}) {
    const alliance = this.getAlliance(allianceId);
    if (!alliance || !targetName) return false;

    const invitation = {
      id: this._generateId(),
      targetName: targetName,
      role: extra.role || '成员',
      invitedBy: extra.invitedBy || this._getPlayerName(),
      invitedAt: Date.now(),
      status: 'pending' // pending | accepted | rejected
    };

    alliance.invitations = alliance.invitations || [];
    alliance.invitations.push(invitation);
    this.save();

    this.addHistory(allianceId, {
      type: '成员',
      title: '发送邀请',
      description: `向 ${targetName} 发送了加入邀请`
    });
    this.emitEvent('member_invited', { allianceId, invitation });
    return true;
  },

  /**
   * 确认加入联盟（被邀请者同意）
   * @param {string} allianceId
   * @param {string} invitationId
   * @returns {boolean}
   */
  confirmJoin(allianceId, invitationId) {
    const alliance = this.getAlliance(allianceId);
    if (!alliance) return false;

    const invite = (alliance.invitations || []).find(i => i.id === invitationId);
    if (!invite || invite.status !== 'pending') return false;

    invite.status = 'accepted';

    const member = {
      id: this._generateId(),
      name: invite.targetName,
      role: invite.role || '成员',
      permissions: ['发言'],
      contribution: 0,
      joinedAt: Date.now(),
      status: 'active',
      avatar: '',
      npcId: invite.npcId || '',
      familyId: invite.familyId || ''
    };

    alliance.members = alliance.members || [];
    alliance.members.push(member);
    this.save();

    this.addHistory(allianceId, {
      type: '成员',
      title: '新成员加入',
      description: `${member.name} 加入 ${alliance.name}，担任 ${member.role}`
    });
    this.emitEvent('member_joined', { allianceId, member });
    return true;
  },

  /**
   * 设置成员职位与权限
   * @param {string} allianceId
   * @param {string} memberId
   * @param {string} role
   * @param {Array<string>} permissions
   * @returns {boolean}
   */
  setMemberRole(allianceId, memberId, role, permissions) {
    const alliance = this.getAlliance(allianceId);
    if (!alliance) return false;

    const member = (alliance.members || []).find(m => m.id === memberId);
    if (!member) return false;

    const oldRole = member.role;
    member.role = role || member.role;
    if (Array.isArray(permissions)) {
      member.permissions = permissions;
    }
    this.save();

    this.addHistory(allianceId, {
      type: '职位',
      title: '职位变更',
      description: `${member.name} 从 ${oldRole} 变更为 ${member.role}`
    });
    this.emitEvent('member_role_changed', { allianceId, memberId, oldRole, newRole: member.role });
    return true;
  },

  /**
   * 获取成员权限列表
   * @param {string} allianceId
   * @param {string} memberId
   * @returns {Array<string>}
   */
  getMemberPermissions(allianceId, memberId) {
    const alliance = this.getAlliance(allianceId);
    if (!alliance) return [];
    const member = (alliance.members || []).find(m => m.id === memberId);
    return member ? (member.permissions || []) : [];
  },

  /**
   * 增加成员贡献值
   * @param {string} allianceId
   * @param {string} memberId
   * @param {number} value
   * @returns {boolean}
   */
  addContribution(allianceId, memberId, value) {
    const alliance = this.getAlliance(allianceId);
    if (!alliance || !value) return false;
    const member = (alliance.members || []).find(m => m.id === memberId);
    if (!member) return false;
    member.contribution = (member.contribution || 0) + value;
    this.save();
    this.emitEvent('contribution_added', { allianceId, memberId, value, total: member.contribution });
    return true;
  },

  /**
   * 成员退出联盟
   * @param {string} allianceId
   * @param {string} memberId
   * @returns {boolean}
   */
  leaveAlliance(allianceId, memberId) {
    const alliance = this.getAlliance(allianceId);
    if (!alliance) return false;

    const idx = (alliance.members || []).findIndex(m => m.id === memberId);
    if (idx === -1) return false;
    const member = alliance.members[idx];
    alliance.members.splice(idx, 1);

    // 如果退出者是盟主且还有成员，自动转让
    if (member.name === alliance.leader && alliance.members.length > 0) {
      const newLeader = alliance.members.reduce((max, m) => (m.contribution > max.contribution ? m : max), alliance.members[0]);
      alliance.leader = newLeader.name;
      newLeader.role = '盟主';
      newLeader.permissions = ['发言', '决策', '管理', '外交', '驱逐'];
    }

    this.save();
    this.addHistory(allianceId, {
      type: '成员',
      title: '成员退出',
      description: `${member.name} 退出联盟`
    });
    this.emitEvent('member_left', { allianceId, memberId, memberName: member.name });
    return true;
  },

  /**
   * 驱逐成员
   * @param {string} allianceId
   * @param {string} memberId
   * @param {string} reason
   * @returns {boolean}
   */
  expelMember(allianceId, memberId, reason) {
    const alliance = this.getAlliance(allianceId);
    if (!alliance) return false;
    const idx = (alliance.members || []).findIndex(m => m.id === memberId);
    if (idx === -1) return false;
    const member = alliance.members[idx];
    alliance.members.splice(idx, 1);
    this.save();
    this.addHistory(allianceId, {
      type: '成员',
      title: '成员被驱逐',
      description: `${member.name} 被驱逐，原因：${reason || '无'}`
    });
    this.emitEvent('member_expelled', { allianceId, memberId, reason });
    return true;
  },

  // ===================== 联盟互动 =====================

  /**
   * 建立同盟关系
   * @param {string} fromId
   * @param {string} toId
   * @returns {boolean}
   */
  formAlliance(fromId, toId) {
    if (fromId === toId) return false;
    const a = this.getAlliance(fromId);
    const b = this.getAlliance(toId);
    if (!a || !b) return false;

    a.allies = a.allies || {};
    b.allies = b.allies || {};

    // 移除敌对
    if (a.enemies && a.enemies[toId]) delete a.enemies[toId];
    if (b.enemies && b.enemies[fromId]) delete b.enemies[fromId];

    a.allies[toId] = { since: Date.now(), notes: '' };
    b.allies[fromId] = { since: Date.now(), notes: '' };
    this.save();

    this.addHistory(fromId, { type: '外交', title: '缔结同盟', description: `与 ${b.name} 建立同盟关系` });
    this.addHistory(toId,   { type: '外交', title: '缔结同盟', description: `与 ${a.name} 建立同盟关系` });
    this.emitEvent('alliance_formed', { fromId, toId });
    return true;
  },

  /**
   * 解除同盟
   * @param {string} fromId
   * @param {string} toId
   * @returns {boolean}
   */
  breakAlliance(fromId, toId) {
    const a = this.getAlliance(fromId);
    const b = this.getAlliance(toId);
    if (!a || !b) return false;

    if (a.allies && a.allies[toId]) delete a.allies[toId];
    if (b.allies && b.allies[fromId]) delete b.allies[fromId];
    this.save();

    this.addHistory(fromId, { type: '外交', title: '解除同盟', description: `与 ${b.name} 解除同盟` });
    this.addHistory(toId,   { type: '外交', title: '解除同盟', description: `与 ${a.name} 解除同盟` });
    this.emitEvent('alliance_broken', { fromId, toId });
    return true;
  },

  /**
   * 宣布敌对
   * @param {string} fromId
   * @param {string} toId
   * @param {string} reason
   * @returns {boolean}
   */
  declareHostile(fromId, toId, reason) {
    if (fromId === toId) return false;
    const a = this.getAlliance(fromId);
    const b = this.getAlliance(toId);
    if (!a || !b) return false;

    a.enemies = a.enemies || {};
    b.enemies = b.enemies || {};

    // 移除同盟
    if (a.allies && a.allies[toId]) delete a.allies[toId];
    if (b.allies && b.allies[fromId]) delete b.allies[fromId];

    a.enemies[toId] = { since: Date.now(), reason: reason || '' };
    b.enemies[fromId] = { since: Date.now(), reason: reason || '' };
    this.save();

    this.addHistory(fromId, { type: '外交', title: '宣布敌对', description: `向 ${b.name} 宣战/宣布敌对：${reason || '无'}` });
    this.addHistory(toId,   { type: '外交', title: '被宣战',    description: `被 ${a.name} 宣战/敌对：${reason || '无'}` });
    this.emitEvent('hostility_declared', { fromId, toId, reason });
    return true;
  },

  /**
   * 合并两个联盟（需双方同意）
   * @param {string} idA
   * @param {string} idB
   * @param {Object} mergeConfig
   * @returns {Object|null}
   */
  mergeAlliances(idA, idB, mergeConfig = {}) {
    const a = this.getAlliance(idA);
    const b = this.getAlliance(idB);
    if (!a || !b) return null;

    const newName = mergeConfig.name || `${a.name}·${b.name}合盟`;
    const newLeader = mergeConfig.leader || a.leader;

    // 合并成员
    const mergedMembers = [...a.members];
    b.members.forEach(m => {
      const exists = mergedMembers.find(x => x.name === m.name);
      if (!exists) mergedMembers.push({ ...m, id: this._generateId() });
    });

    // 合并资源
    const mergedResources = {
      gold: (a.resources?.gold || 0) + (b.resources?.gold || 0),
      food: (a.resources?.food || 0) + (b.resources?.food || 0),
      troops: (a.resources?.troops || 0) + (b.resources?.troops || 0),
      territory: (a.resources?.territory || 0) + (b.resources?.territory || 0),
      prestige: Math.max(a.resources?.prestige || 0, b.resources?.prestige || 0) + 50,
      tech: Math.max(a.resources?.tech || 0, b.resources?.tech || 0),
      culture: Math.max(a.resources?.culture || 0, b.resources?.culture || 0)
    };

    // 合并外交关系
    const mergedAllies = { ...a.allies };
    Object.keys(b.allies || {}).forEach(k => { if (k !== idA) mergedAllies[k] = b.allies[k]; });

    const mergedEnemies = { ...a.enemies };
    Object.keys(b.enemies || {}).forEach(k => { if (k !== idA) mergedEnemies[k] = b.enemies[k]; });

    // 创建新联盟
    const newAlliance = this.createAlliance({
      name: newName,
      type: mergeConfig.type || a.type,
      description: `由 ${a.name} 与 ${b.name} 合并而成`,
      founder: newLeader,
      leader: newLeader,
      members: mergedMembers,
      resources: mergedResources,
      allies: mergedAllies,
      enemies: mergedEnemies,
      territory: [...(a.territory || []), ...(b.territory || [])],
      laws: [...(a.laws || []), ...(b.laws || [])]
    });

    if (!newAlliance) return null;

    // 删除旧联盟
    this.deleteAlliance(idA);
    this.deleteAlliance(idB);

    // 更新其他联盟的外交记录指向新联盟
    this.alliances.forEach(al => {
      if (al.allies) {
        const hadA = al.allies[idA]; const hadB = al.allies[idB];
        if (hadA) { al.allies[newAlliance.id] = hadA; delete al.allies[idA]; }
        if (hadB) { al.allies[newAlliance.id] = hadB; delete al.allies[idB]; }
      }
      if (al.enemies) {
        const hadA = al.enemies[idA]; const hadB = al.enemies[idB];
        if (hadA) { al.enemies[newAlliance.id] = hadA; delete al.enemies[idA]; }
        if (hadB) { al.enemies[newAlliance.id] = hadB; delete al.enemies[idB]; }
      }
    });

    this.save();
    this.addHistory(newAlliance.id, { type: '合并', title: '联盟合并', description: `${a.name} 与 ${b.name} 合并为 ${newName}` });
    this.emitEvent('alliance_merged', { newAllianceId: newAlliance.id, oldIds: [idA, idB] });
    return newAlliance;
  },

  /**
   * 分裂联盟
   * @param {string} allianceId
   * @param {Array<Object>} splitGroups — 每组包含 memberIds 和 config
   * @returns {Array<Object>|null}
   */
  splitAlliance(allianceId, splitGroups) {
    const parent = this.getAlliance(allianceId);
    if (!parent || !Array.isArray(splitGroups) || splitGroups.length < 2) return null;

    const newAlliances = [];
    splitGroups.forEach((group, idx) => {
      const members = (parent.members || []).filter(m => group.memberIds && group.memberIds.includes(m.id));
      if (members.length === 0) return;

      const config = group.config || {};
      const na = this.createAlliance({
        name: config.name || `${parent.name}·分支${idx + 1}`,
        type: config.type || parent.type,
        description: `从 ${parent.name} 分裂而出`,
        founder: members[0].name,
        leader: members[0].name,
        members: members.map(m => ({ ...m, id: this._generateId() })),
        resources: {
          gold: Math.floor((parent.resources?.gold || 0) / splitGroups.length),
          food: Math.floor((parent.resources?.food || 0) / splitGroups.length),
          troops: Math.floor((parent.resources?.troops || 0) / splitGroups.length),
          prestige: Math.floor((parent.resources?.prestige || 0) / splitGroups.length)
        }
      });
      if (na) newAlliances.push(na);
    });

    if (newAlliances.length > 0) {
      this.deleteAlliance(allianceId);
      this.save();
      this.emitEvent('alliance_split', { parentId: allianceId, newIds: newAlliances.map(n => n.id) });
    }
    return newAlliances;
  },

  /**
   * 更新联盟声望（带边界校验）
   * @param {string} allianceId
   * @param {number} delta
   */
  updateReputation(allianceId, delta) {
    const alliance = this.getAlliance(allianceId);
    if (!alliance) return;
    alliance.resources = alliance.resources || {};
    alliance.resources.prestige = Math.max(0, (alliance.resources.prestige || 0) + delta);
    this.save();
    this.emitEvent('reputation_changed', { allianceId, delta, prestige: alliance.resources.prestige });
  },

  // ===================== 联盟实际功能影响 =====================

  /**
   * 获取联盟共享资源池
   * @param {string} allianceId
   * @returns {Object}
   */
  getSharedResources(allianceId) {
    const alliance = this.getAlliance(allianceId);
    if (!alliance) return {};
    return {
      gold: alliance.resources?.gold || 0,
      food: alliance.resources?.food || 0,
      troops: alliance.resources?.troops || 0,
      sharedWith: Object.keys(alliance.allies || {})
    };
  },

  /**
   * 获取领地内 NPC 加成
   * @param {string} allianceId
   * @returns {Object}
   */
  getTerritoryBonus(allianceId) {
    const alliance = this.getAlliance(allianceId);
    if (!alliance) return { bonus: 0, desc: '无领地' };
    const territoryCount = (alliance.territory || []).length;
    const memberCount = (alliance.members || []).length;
    const bonus = territoryCount * 2 + Math.floor(memberCount / 10);
    return {
      bonus,
      desc: `领地 ${territoryCount} 块，成员 ${memberCount} 人，加成 ${bonus}%`,
      types: ['经济', '防御', '生产']
    };
  },

  /**
   * 应用贸易效果
   * @param {string} fromId
   * @param {string} toId
   * @param {number} amount
   * @returns {boolean}
   */
  applyTradeEffect(fromId, toId, amount) {
    const a = this.getAlliance(fromId);
    const b = this.getAlliance(toId);
    if (!a || !b || !amount) return false;

    a.resources = a.resources || {};
    b.resources = b.resources || {};
    a.resources.gold = (a.resources.gold || 0) - amount;
    b.resources.gold = (b.resources.gold || 0) + Math.floor(amount * 0.9); // 10% 损耗
    this.save();

    this.addHistory(fromId, { type: '贸易', title: '贸易支出', description: `向 ${b.name} 贸易支出 ${amount} 金` });
    this.addHistory(toId,   { type: '贸易', title: '贸易收入', description: `从 ${a.name} 贸易收入 ${Math.floor(amount * 0.9)} 金` });
    this.emitEvent('trade_executed', { fromId, toId, amount });
    return true;
  },

  /**
   * 应用战争效果（双向资源消耗）
   * @param {string} idA
   * @param {string} idB
   * @returns {Object}
   */
  applyWarEffect(idA, idB) {
    const a = this.getAlliance(idA);
    const b = this.getAlliance(idB);
    if (!a || !b) return null;

    const lossA = Math.floor(Math.random() * 50) + 10;
    const lossB = Math.floor(Math.random() * 50) + 10;

    a.resources = a.resources || {};
    b.resources = b.resources || {};
    a.resources.troops = Math.max(0, (a.resources.troops || 0) - lossA);
    a.resources.prestige = Math.max(0, (a.resources.prestige || 0) - 5);
    b.resources.troops = Math.max(0, (b.resources.troops || 0) - lossB);
    b.resources.prestige = Math.max(0, (b.resources.prestige || 0) - 5);

    this.save();
    this.addHistory(idA, { type: '战争', title: '战争损耗', description: `与 ${b.name} 交战，损失兵力 ${lossA}` });
    this.addHistory(idB, { type: '战争', title: '战争损耗', description: `与 ${a.name} 交战，损失兵力 ${lossB}` });
    this.emitEvent('war_effect', { idA, idB, lossA, lossB });
    return { lossA, lossB };
  },

  /**
   * 推进联盟科技
   * @param {string} allianceId
   * @param {string} techName
   * @param {number} value
   * @returns {boolean}
   */
  advanceTech(allianceId, techName, value = 1) {
    const alliance = this.getAlliance(allianceId);
    if (!alliance || !techName) return false;
    alliance.resources = alliance.resources || {};
    alliance.resources.tech = (alliance.resources.tech || 0) + value;
    this.save();
    this.addHistory(allianceId, { type: '科技', title: '科技进步', description: `科技 ${techName} 提升 +${value}` });
    this.emitEvent('tech_advanced', { allianceId, techName, value });
    return true;
  },

  /**
   * 增加联盟文化值
   * @param {string} allianceId
   * @param {string} cultureName
   * @param {number} value
   * @returns {boolean}
   */
  addCulture(allianceId, cultureName, value = 1) {
    const alliance = this.getAlliance(allianceId);
    if (!alliance || !cultureName) return false;
    alliance.resources = alliance.resources || {};
    alliance.resources.culture = (alliance.resources.culture || 0) + value;
    this.save();
    this.addHistory(allianceId, { type: '文化', title: '文化积累', description: `文化 ${cultureName} 提升 +${value}` });
    this.emitEvent('culture_added', { allianceId, cultureName, value });
    return true;
  },

  // ===================== 联盟事件 =====================

  /**
   * 自动生成随机事件
   * @param {string} allianceId
   * @returns {Object|null}
   */
  generateRandomEvent(allianceId) {
    const alliance = this.getAlliance(allianceId);
    if (!alliance) return null;

    const types = Object.keys(this.EVENT_TYPES);
    const typeKey = types[Math.floor(Math.random() * types.length)];
    const typeInfo = this.EVENT_TYPES[typeKey];

    const event = {
      id: this._generateId(),
      type: typeKey,
      name: typeInfo.name,
      description: typeInfo.desc,
      severity: typeInfo.severity,
      createdAt: Date.now(),
      status: 'pending', // pending | resolved | ignored
      decisions: [],
      votes: {},
      result: null
    };

    // 根据事件类型生成选项
    if (typeKey === 'internal_dispute') {
      event.options = [
        { id: 'vote_compromise', label: '妥协调和', effect: { prestige: -5, stability: +10 } },
        { id: 'vote_firm',       label: '强硬压下', effect: { prestige: +5, stability: -10 } },
        { id: 'vote_discuss',    label: '召集会议', effect: { prestige: 0,  stability: +5 } }
      ];
    } else if (typeKey === 'external_threat') {
      event.options = [
        { id: 'vote_defend',  label: '全面防御', effect: { troops: -20, prestige: +10 } },
        { id: 'vote_negotiate', label: '外交谈判', effect: { gold: -100, prestige: +5 } },
        { id: 'vote_attack',  label: '主动出击', effect: { troops: -30, prestige: +20 } }
      ];
    } else if (typeKey === 'development') {
      event.options = [
        { id: 'vote_invest', label: '大力投资', effect: { gold: -200, tech: +10 } },
        { id: 'vote_caution', label: '谨慎观望', effect: { gold: 0, tech: +2 } }
      ];
    } else {
      event.options = [
        { id: 'vote_accept', label: '接受/举办', effect: { prestige: +5 } },
        { id: 'vote_ignore', label: '忽略',      effect: { prestige: -2 } }
      ];
    }

    alliance.events = alliance.events || [];
    alliance.events.push(event);
    // 限制数量
    if (alliance.events.length > this.MAX_EVENTS) {
      alliance.events.splice(0, alliance.events.length - this.MAX_EVENTS);
    }
    this.save();
    this.emitEvent('event_generated', { allianceId, event });
    return event;
  },

  /**
   * 处理事件决策
   * @param {string} allianceId
   * @param {string} eventId
   * @param {string} decisionId
   * @param {string} voterName
   * @returns {boolean}
   */
  handleEventDecision(allianceId, eventId, decisionId, voterName) {
    const alliance = this.getAlliance(allianceId);
    if (!alliance) return false;
    const event = (alliance.events || []).find(e => e.id === eventId);
    if (!event || event.status !== 'pending') return false;

    event.votes = event.votes || {};
    event.votes[voterName] = decisionId;

    // 当投票人数超过成员半数时，自动结算
    const memberCount = (alliance.members || []).length;
    const voteCount = Object.keys(event.votes).length;
    if (voteCount >= Math.ceil(memberCount / 2)) {
      this._resolveEvent(alliance, event);
    }

    this.save();
    this.emitEvent('event_voted', { allianceId, eventId, decisionId, voterName });
    return true;
  },

  /**
   * 手动结算事件（所有成员投票完毕或盟主强制结算）
   * @param {string} allianceId
   * @param {string} eventId
   * @returns {boolean}
   */
  resolveEvent(allianceId, eventId) {
    const alliance = this.getAlliance(allianceId);
    if (!alliance) return false;
    const event = (alliance.events || []).find(e => e.id === eventId);
    if (!event || event.status !== 'pending') return false;
    this._resolveEvent(alliance, event);
    this.save();
    return true;
  },

  /**
   * 内部事件结算逻辑
   * @param {Object} alliance
   * @param {Object} event
   */
  _resolveEvent(alliance, event) {
    const votes = event.votes || {};
    const tally = {};
    Object.values(votes).forEach(v => { tally[v] = (tally[v] || 0) + 1; });
    const winner = Object.keys(tally).reduce((a, b) => (tally[a] > tally[b] ? a : b), Object.keys(tally)[0]);
    const option = (event.options || []).find(o => o.id === winner);

    event.status = 'resolved';
    event.result = { winner, tally, option };

    // 应用效果
    if (option && option.effect) {
      alliance.resources = alliance.resources || {};
      Object.keys(option.effect).forEach(k => {
        if (typeof alliance.resources[k] === 'number') {
          alliance.resources[k] += option.effect[k];
        }
      });
      // 稳定性特殊处理（不在 resources 中时）
      if (option.effect.stability) {
        alliance.stability = (alliance.stability || 50) + option.effect.stability;
      }
    }

    this.addHistory(alliance.id, {
      type: '事件',
      title: event.name + ' 已解决',
      description: `决策结果：${option ? option.label : winner}`
    });
    this.emitEvent('event_resolved', { allianceId: alliance.id, eventId: event.id, result: event.result });
  },

  /**
   * 获取联盟事件列表
   * @param {string} allianceId
   * @param {string} statusFilter
   * @returns {Array<Object>}
   */
  getEvents(allianceId, statusFilter) {
    const alliance = this.getAlliance(allianceId);
    if (!alliance) return [];
    let events = alliance.events || [];
    if (statusFilter) {
      events = events.filter(e => e.status === statusFilter);
    }
    return events.sort((a, b) => b.createdAt - a.createdAt);
  },

  /**
   * 添加自定义事件
   * @param {string} allianceId
   * @param {Object} eventData
   * @returns {Object|null}
   */
  addEvent(allianceId, eventData) {
    const alliance = this.getAlliance(allianceId);
    if (!alliance) return null;
    const event = {
      id: this._generateId(),
      type: eventData.type || 'custom',
      name: eventData.name || '自定义事件',
      description: eventData.description || '',
      severity: eventData.severity || 'normal',
      createdAt: Date.now(),
      status: 'pending',
      options: eventData.options || [],
      votes: {},
      result: null
    };
    alliance.events = alliance.events || [];
    alliance.events.push(event);
    if (alliance.events.length > this.MAX_EVENTS) {
      alliance.events.splice(0, alliance.events.length - this.MAX_EVENTS);
    }
    this.save();
    this.emitEvent('event_added', { allianceId, event });
    return event;
  },

  // ===================== 历史记录 =====================

  /**
   * 添加历史记录
   * @param {string} allianceId
   * @param {Object} record
   */
  addHistory(allianceId, record) {
    const alliance = this.getAlliance(allianceId);
    if (!alliance) return;
    alliance.history = alliance.history || [];
    alliance.history.push({
      id: this._generateId(),
      timestamp: Date.now(),
      ...record
    });
    if (alliance.history.length > this.MAX_HISTORY) {
      alliance.history.splice(0, alliance.history.length - this.MAX_HISTORY);
    }
    this.save();
  },

  /**
   * 获取历史记录
   * @param {string} allianceId
   * @returns {Array<Object>}
   */
  getHistory(allianceId) {
    const alliance = this.getAlliance(allianceId);
    return alliance ? (alliance.history || []).sort((a, b) => b.timestamp - a.timestamp) : [];
  },

  // ===================== 联盟关系网络可视化 =====================

  /**
   * 初始化关系网络 Canvas
   * @param {string} canvasId
   */
  initNetworkCanvas(canvasId) {
    if (typeof document === 'undefined') return;
    this.networkCanvas = document.getElementById(canvasId || 'allianceNetworkCanvas');
    if (!this.networkCanvas) return;
    this.networkCtx = this.networkCanvas.getContext('2d');

    // 绑定鼠标事件
    this.networkCanvas.addEventListener('mousedown', (e) => this._onCanvasMouseDown(e));
    this.networkCanvas.addEventListener('mousemove', (e) => this._onCanvasMouseMove(e));
    this.networkCanvas.addEventListener('mouseup',   (e) => this._onCanvasMouseUp(e));
    this.networkCanvas.addEventListener('wheel',     (e) => this._onCanvasWheel(e));
    this.networkCanvas.addEventListener('click',     (e) => this._onCanvasClick(e));

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.renderNetwork();
  },

  /**
   * 调整 Canvas 尺寸
   */
  resizeCanvas() {
    if (!this.networkCanvas) return;
    const rect = this.networkCanvas.parentElement.getBoundingClientRect();
    this.networkCanvas.width = rect.width;
    this.networkCanvas.height = 300;
    this.renderNetwork();
  },

  /**
   * 渲染关系网络
   */
  renderNetwork() {
    if (!this.networkCtx || !this.networkCanvas) return;
    const ctx = this.networkCtx;
    const w = this.networkCanvas.width;
    const h = this.networkCanvas.height;
    const ns = this.networkState;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(ns.offsetX, ns.offsetY);
    ctx.scale(ns.scale, ns.scale);

    // 构建节点与边
    const nodes = this._buildNetworkNodes();
    const edges = this._buildNetworkEdges();

    // 绘制边
    edges.forEach(edge => this._drawEdge(ctx, edge));
    // 绘制节点
    nodes.forEach(node => this._drawNode(ctx, node));

    ctx.restore();

    // 绘制图例
    this._drawLegend(ctx, w, h);
  },

  /**
   * 构建网络节点
   * @returns {Array<Object>}
   */
  _buildNetworkNodes() {
    const list = this.getAlliances();
    if (list.length === 0) return [];

    // 简单的圆形布局（按声望排序后均匀分布）
    const centerX = 0;
    const centerY = 0;
    const radiusBase = Math.max(200, list.length * 40);

    return list.map((a, i) => {
      const angle = (2 * Math.PI * i) / Math.max(list.length, 1);
      const scaleLv = this.getScaleLevel((a.members || []).length);
      const prestige = this.calculatePrestige(a);
      const r = scaleLv.radius + Math.min(prestige / 20, 20);

      // 根据关系状态决定颜色（相对于当前选中联盟）
      let color = this.COLORS.gold;
      if (this.currentAllianceId) {
        if (a.id === this.currentAllianceId) {
          color = this.COLORS.goldLight;
        } else if (a.allies && a.allies[this.currentAllianceId]) {
          color = this.COLORS.jade;
        } else if (a.enemies && a.enemies[this.currentAllianceId]) {
          color = this.COLORS.crimson;
        } else {
          color = this.COLORS.inkMuted;
        }
      }

      return {
        id: a.id,
        name: a.name,
        x: centerX + radiusBase * Math.cos(angle),
        y: centerY + radiusBase * Math.sin(angle),
        radius: r,
        color,
        scaleName: scaleLv.name,
        memberCount: (a.members || []).length,
        prestige
      };
    });
  },

  /**
   * 构建网络边
   * @returns {Array<Object>}
   */
  _buildNetworkEdges() {
    const edges = [];
    const nodeMap = {};
    const nodes = this._buildNetworkNodes();
    nodes.forEach(n => { nodeMap[n.id] = n; });

    this.alliances.forEach(a => {
      const from = nodeMap[a.id];
      if (!from) return;
      // 同盟边（绿色）
      Object.keys(a.allies || {}).forEach(allyId => {
        const to = nodeMap[allyId];
        if (to && a.id < allyId) { // 避免重复绘制
          edges.push({ from, to, type: 'ally', color: this.RELATION_TYPES.ally.lineColor });
        }
      });
      // 敌对边（红色）
      Object.keys(a.enemies || {}).forEach(enemyId => {
        const to = nodeMap[enemyId];
        if (to && a.id < enemyId) {
          edges.push({ from, to, type: 'hostile', color: this.RELATION_TYPES.hostile.lineColor });
        }
      });
    });

    return edges;
  },

  /**
   * 绘制节点
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} node
   */
  _drawNode(ctx, node) {
    // 外发光
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius + 4, 0, Math.PI * 2);
    ctx.fillStyle = node.color + '33'; // 20% 透明度
    ctx.fill();

    // 主体圆
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.COLORS.parchmentLight;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = node.color;
    ctx.stroke();

    // 文字
    ctx.fillStyle = this.COLORS.ink;
    ctx.font = `bold ${Math.max(10, node.radius / 2)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.name, node.x, node.y - 6);

    ctx.font = `${Math.max(9, node.radius / 2.5)}px sans-serif`;
    ctx.fillStyle = this.COLORS.inkMuted;
    ctx.fillText(`${node.scaleName} · ${node.memberCount}人`, node.x, node.y + 8);
  },

  /**
   * 绘制边
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} edge
   */
  _drawEdge(ctx, edge) {
    ctx.beginPath();
    ctx.moveTo(edge.from.x, edge.from.y);
    ctx.lineTo(edge.to.x, edge.to.y);
    ctx.lineWidth = edge.type === 'hostile' ? 2.5 : 1.5;
    ctx.strokeStyle = edge.color;
    if (edge.type === 'hostile') {
      ctx.setLineDash([6, 4]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  },

  /**
   * 绘制图例
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w
   * @param {number} h
   */
  _drawLegend(ctx, w, h) {
    const legendX = w - 130;
    const legendY = 10;
    const itemHeight = 18;
    const items = [
      { label: '同盟', color: this.RELATION_TYPES.ally.lineColor },
      { label: '中立', color: this.COLORS.inkMuted },
      { label: '敌对', color: this.RELATION_TYPES.hostile.lineColor }
    ];

    ctx.fillStyle = 'rgba(253,248,240,0.9)';
    ctx.strokeStyle = this.COLORS.gold;
    ctx.lineWidth = 1;
    const boxH = items.length * itemHeight + 12;
    ctx.fillRect(legendX - 8, legendY - 4, 120, boxH);
    ctx.strokeRect(legendX - 8, legendY - 4, 120, boxH);

    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    items.forEach((item, i) => {
      const y = legendY + i * itemHeight + 8;
      ctx.beginPath();
      ctx.moveTo(legendX, y);
      ctx.lineTo(legendX + 20, y);
      ctx.lineWidth = 2;
      ctx.strokeStyle = item.color;
      if (item.label === '敌对') ctx.setLineDash([4, 2]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = this.COLORS.ink;
      ctx.fillText(item.label, legendX + 28, y);
    });
  },

  /**
   * Canvas 鼠标按下事件
   * @param {MouseEvent} e
   */
  _onCanvasMouseDown(e) {
    const ns = this.networkState;
    ns.isDragging = true;
    ns.dragStartX = e.clientX - ns.offsetX;
    ns.dragStartY = e.clientY - ns.offsetY;
  },

  /**
   * Canvas 鼠标移动事件
   * @param {MouseEvent} e
   */
  _onCanvasMouseMove(e) {
    const ns = this.networkState;
    ns.lastMouseX = e.clientX;
    ns.lastMouseY = e.clientY;
    if (ns.isDragging) {
      ns.offsetX = e.clientX - ns.dragStartX;
      ns.offsetY = e.clientY - ns.dragStartY;
      this.renderNetwork();
    }
  },

  /**
   * Canvas 鼠标松开事件
   * @param {MouseEvent} e
   */
  _onCanvasMouseUp(e) {
    this.networkState.isDragging = false;
  },

  /**
   * Canvas 滚轮缩放事件
   * @param {WheelEvent} e
   */
  _onCanvasWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(0.3, Math.min(3.0, this.networkState.scale + delta));
    this.networkState.scale = newScale;
    this.renderNetwork();
  },

  /**
   * Canvas 点击事件（选中联盟）
   * @param {MouseEvent} e
   */
  _onCanvasClick(e) {
    if (this.networkState.isDragging) return;
    const rect = this.networkCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - this.networkState.offsetX) / this.networkState.scale;
    const y = (e.clientY - rect.top - this.networkState.offsetY) / this.networkState.scale;

    const nodes = this._buildNetworkNodes();
    for (const node of nodes) {
      const dx = x - node.x;
      const dy = y - node.y;
      if (dx * dx + dy * dy <= node.radius * node.radius) {
        this.currentAllianceId = node.id;
        this.renderPage();
        this.emitEvent('network_node_clicked', { allianceId: node.id });
        break;
      }
    }
  },

  /**
   * 放大视图
   */
  zoomIn() {
    this.networkState.scale = Math.min(3.0, this.networkState.scale + 0.2);
    this.renderNetwork();
  },

  /**
   * 缩小视图
   */
  zoomOut() {
    this.networkState.scale = Math.max(0.3, this.networkState.scale - 0.2);
    this.renderNetwork();
  },

  /**
   * 重置视图
   */
  resetCanvasView() {
    this.networkState.scale = 1;
    this.networkState.offsetX = 0;
    this.networkState.offsetY = 0;
    this.renderNetwork();
  },

  // ===================== 界面渲染 =====================

  /**
   * 渲染完整页面
   */
  renderPage() {
    const page = document.getElementById('page-alliance');
    if (!page) return;

    const C = this.COLORS;
    page.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
<div id="alliancePage" style="display:flex;flex-direction:column;height:100%;background:${C.parchment};color:${C.ink};">
        ${this._renderHeader()}
        <div style="display:flex;flex:1;overflow:hidden;">
          ${this._renderLeftPanel()}
          ${this._renderCenterPanel()}
          ${this._renderRightPanel()}
        </div>
        ${this._renderBottomCanvas()}
      </div>
    `;

    // 初始化 Canvas
    setTimeout(() => this.initNetworkCanvas('allianceNetworkCanvas'), 0);
  },

  /**
   * 渲染顶部栏
   * @returns {string}
   */
  _renderHeader() {
    const C = this.COLORS;
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid ${C.gold};background:${C.parchmentLight};">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:20px;">⚔️</span>
          <span style="font-size:18px;font-weight:bold;color:${C.ink};">联盟系统</span>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-primary" onclick="AllianceSystem.openCreateModal()"
            style="background:${C.gold};color:${C.ink};border:1px solid ${C.goldDark};padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:500;">
            ➕ 创建联盟
          </button>
          <button class="btn btn-secondary" onclick="AllianceSystem.resetCanvasView()"
            style="background:${C.parchmentDark};color:${C.ink};border:1px solid ${C.gold};padding:6px 14px;border-radius:6px;cursor:pointer;">
            🌐 重置关系图
          </button>
        </div>
      </div>
    `;
  },

  /**
   * 渲染左侧：我的联盟列表
   * @returns {string}
   */
  _renderLeftPanel() {
    const C = this.COLORS;
    const list = this.getAlliances();
    if (list.length === 0) {
      return `
        <div style="width:260px;border-right:1px solid ${C.gold};background:${C.parchmentLight};padding:16px;overflow-y:auto;">
          <div style="text-align:center;padding:40px 20px;color:${C.inkMuted};">
            <div style="font-size:36px;margin-bottom:8px;">🏛️</div>
            <p style="font-size:14px;">暂无联盟</p>
            <p style="font-size:12px;">创建或加入一个联盟吧</p>
          </div>
        </div>
      `;
    }

    const cards = list.map(a => {
      const isActive = this.currentAllianceId === a.id;
      const scaleLv = this.getScaleLevel((a.members || []).length);
      const prestige = this.calculatePrestige(a);
      const borderColor = isActive ? C.gold : 'transparent';
      return `
        <div onclick="AllianceSystem.selectAlliance('${a.id}')"
          style="cursor:pointer;padding:12px;border:1px solid ${borderColor};border-radius:8px;margin-bottom:10px;background:${isActive ? C.parchment : C.parchmentLight};transition:background 0.2s;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <span style="font-weight:bold;font-size:15px;color:${C.ink};">${a.name}</span>
            <span style="font-size:11px;padding:2px 6px;border-radius:10px;background:${C.gold}22;color:${C.goldDark};">${scaleLv.name}</span>
          </div>
          <div style="font-size:12px;color:${C.inkMuted};display:flex;gap:10px;">
            <span>👥 ${(a.members || []).length} 人</span>
            <span>⭐ ${prestige}</span>
          </div>
          <div style="font-size:11px;color:${C.inkMuted};margin-top:4px;">${a.type}</div>
        </div>
      `;
    }).join('');

    return `
      <div style="width:260px;border-right:1px solid ${C.gold};background:${C.parchmentLight};padding:16px;overflow-y:auto;">
        <div style="font-size:14px;font-weight:bold;margin-bottom:12px;color:${C.inkLight};">我的联盟 (${list.length})</div>
        ${cards}
      </div>
    `;
  },

  /**
   * 渲染中间：选中联盟详情
   * @returns {string}
   */
  _renderCenterPanel() {
    const C = this.COLORS;
    const alliance = this.currentAllianceId ? this.getAlliance(this.currentAllianceId) : null;
    if (!alliance) {
      return `
        <div style="flex:1;padding:24px;background:${C.parchment};">
          <div style="text-align:center;padding:60px 20px;color:${C.inkMuted};">
            <div style="font-size:48px;margin-bottom:12px;">📜</div>
            <p style="font-size:16px;">请在左侧选择一个联盟查看详情</p>
          </div>
        </div>
      `;
    }

    const scaleLv = this.getScaleLevel((alliance.members || []).length);
    const prestige = this.calculatePrestige(alliance);

    // 成员列表
    const membersHtml = (alliance.members || []).map(m => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-bottom:1px solid ${C.gold}22;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:14px;">👤</span>
          <div>
            <div style="font-size:14px;font-weight:500;color:${C.ink};">${m.name}</div>
            <div style="font-size:11px;color:${C.inkMuted};">贡献: ${m.contribution || 0}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:11px;padding:2px 8px;border-radius:10px;background:${C.gold}18;color:${C.goldDark};">${m.role || '成员'}</span>
          <span style="font-size:11px;color:${C.inkMuted};">${(m.permissions || []).join('/') || '无权限'}</span>
        </div>
      </div>
    `).join('');

    // 资源面板
    const res = alliance.resources || {};
    const resHtml = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;">
        <div style="background:${C.parchmentLight};padding:8px;border-radius:6px;text-align:center;border:1px solid ${C.gold}33;">
          <div style="font-size:11px;color:${C.inkMuted};">金币</div>
          <div style="font-size:15px;font-weight:bold;color:${C.gold};">${res.gold || 0}</div>
        </div>
        <div style="background:${C.parchmentLight};padding:8px;border-radius:6px;text-align:center;border:1px solid ${C.gold}33;">
          <div style="font-size:11px;color:${C.inkMuted};">粮食</div>
          <div style="font-size:15px;font-weight:bold;color:${C.ink};">${res.food || 0}</div>
        </div>
        <div style="background:${C.parchmentLight};padding:8px;border-radius:6px;text-align:center;border:1px solid ${C.gold}33;">
          <div style="font-size:11px;color:${C.inkMuted};">兵力</div>
          <div style="font-size:15px;font-weight:bold;color:${C.crimson};">${res.troops || 0}</div>
        </div>
        <div style="background:${C.parchmentLight};padding:8px;border-radius:6px;text-align:center;border:1px solid ${C.gold}33;">
          <div style="font-size:11px;color:${C.inkMuted};">声望</div>
          <div style="font-size:15px;font-weight:bold;color:${C.jade};">${res.prestige || 0}</div>
        </div>
        <div style="background:${C.parchmentLight};padding:8px;border-radius:6px;text-align:center;border:1px solid ${C.gold}33;">
          <div style="font-size:11px;color:${C.inkMuted};">科技</div>
          <div style="font-size:15px;font-weight:bold;color:${C.inkLight};">${res.tech || 0}</div>
        </div>
        <div style="background:${C.parchmentLight};padding:8px;border-radius:6px;text-align:center;border:1px solid ${C.gold}33;">
          <div style="font-size:11px;color:${C.inkMuted};">文化</div>
          <div style="font-size:15px;font-weight:bold;color:${C.inkLight};">${res.culture || 0}</div>
        </div>
      </div>
    `;

    // 事件列表（仅显示最近 5 条未解决）
    const pendingEvents = (alliance.events || []).filter(e => e.status === 'pending').slice(-5);
    const eventsHtml = pendingEvents.length === 0
      ? `<div style="font-size:12px;color:${C.inkMuted};padding:8px;">暂无待处理事件</div>`
      : pendingEvents.map(e => `
          <div style="padding:8px 10px;border-bottom:1px solid ${C.gold}22;">
            <div style="display:flex;justify-content:space-between;">
              <span style="font-size:13px;font-weight:500;color:${C.ink};">${e.name}</span>
              <span style="font-size:11px;padding:2px 6px;border-radius:8px;background:${this._severityColor(e.severity)}22;color:${this._severityColor(e.severity)};">${e.severity === 'high' ? '紧急' : e.severity === 'normal' ? '普通' : '轻微'}</span>
            </div>
            <div style="font-size:11px;color:${C.inkMuted};margin-top:2px;">${e.description}</div>
          </div>
        `).join('');

    return `
      <div style="flex:1;padding:20px;background:${C.parchment};overflow-y:auto;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
          <div>
            <div style="font-size:22px;font-weight:bold;color:${C.ink};">${alliance.name}</div>
            <div style="font-size:12px;color:${C.inkMuted};margin-top:4px;">${alliance.type} · ${scaleLv.name} ·  founded ${alliance.foundedDate || '未知'}</div>
            <div style="font-size:12px;color:${C.inkMuted};margin-top:2px;">${alliance.description || ''}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:13px;color:${C.goldDark};">盟主: ${alliance.leader || '无'}</div>
            <div style="font-size:13px;color:${C.goldDark};">声望: ${prestige}</div>
          </div>
        </div>

        ${resHtml}

        <div style="margin-bottom:12px;">
          <div style="font-size:14px;font-weight:bold;color:${C.inkLight};margin-bottom:8px;">成员列表 (${(alliance.members || []).length})</div>
          <div style="background:${C.parchmentLight};border:1px solid ${C.gold}33;border-radius:8px;overflow:hidden;">
            ${membersHtml || '<div style="padding:10px;color:${C.inkMuted};">暂无成员</div>'}
          </div>
        </div>

        <div>
          <div style="font-size:14px;font-weight:bold;color:${C.inkLight};margin-bottom:8px;">待处理事件</div>
          <div style="background:${C.parchmentLight};border:1px solid ${C.gold}33;border-radius:8px;overflow:hidden;">
            ${eventsHtml}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 渲染右侧：操作面板
   * @returns {string}
   */
  _renderRightPanel() {
    const C = this.COLORS;
    const alliance = this.currentAllianceId ? this.getAlliance(this.currentAllianceId) : null;

    if (!alliance) {
      return `
        <div style="width:220px;border-left:1px solid ${C.gold};background:${C.parchmentLight};padding:16px;">
          <div style="font-size:13px;color:${C.inkMuted};text-align:center;padding:20px;">
            选择一个联盟后<br>可进行操作
          </div>
        </div>
      `;
    }

    return `
      <div style="width:220px;border-left:1px solid ${C.gold};background:${C.parchmentLight};padding:16px;overflow-y:auto;">
        <div style="font-size:14px;font-weight:bold;margin-bottom:12px;color:${C.inkLight};">操作面板</div>

        <div style="display:flex;flex-direction:column;gap:8px;">
          <button onclick="AllianceSystem.openInviteModal()"
            style="padding:8px 12px;border-radius:6px;border:1px solid ${C.gold};background:${C.gold}15;color:${C.ink};cursor:pointer;font-size:13px;text-align:left;">
            📩 邀请成员
          </button>
          <button onclick="AllianceSystem.openAllianceDiplomacy('ally')"
            style="padding:8px 12px;border-radius:6px;border:1px solid ${C.jade};background:${C.jade}10;color:${C.jade};cursor:pointer;font-size:13px;text-align:left;">
            🤝 结盟
          </button>
          <button onclick="AllianceSystem.openAllianceDiplomacy('hostile')"
            style="padding:8px 12px;border-radius:6px;border:1px solid ${C.crimson};background:${C.crimson}10;color:${C.crimson};cursor:pointer;font-size:13px;text-align:left;">
            ⚔️ 宣布敌对
          </button>
          <button onclick="AllianceSystem.openBreakAllianceModal()"
            style="padding:8px 12px;border-radius:6px;border:1px solid ${C.amber};background:${C.amber}10;color:${C.amber};cursor:pointer;font-size:13px;text-align:left;">
            💔 断交
          </button>
          <button onclick="AllianceSystem.openMergeModal()"
            style="padding:8px 12px;border-radius:6px;border:1px solid ${C.inkMuted};background:${C.inkMuted}10;color:${C.inkMuted};cursor:pointer;font-size:13px;text-align:left;">
            🔗 合并联盟
          </button>
          <button onclick="AllianceSystem.generateEventNow()"
            style="padding:8px 12px;border-radius:6px;border:1px solid ${C.inkLight};background:${C.inkLight}10;color:${C.inkLight};cursor:pointer;font-size:13px;text-align:left;">
            🔔 生成事件
          </button>
          <button onclick="AllianceSystem.leaveCurrentAlliance()"
            style="padding:8px 12px;border-radius:6px;border:1px solid ${C.crimson};background:${C.crimson}10;color:${C.crimson};cursor:pointer;font-size:13px;text-align:left;margin-top:8px;">
            🚪 退出联盟
          </button>
        </div>

        <div style="margin-top:16px;padding-top:12px;border-top:1px solid ${C.gold}33;">
          <div style="font-size:12px;font-weight:bold;color:${C.inkLight};margin-bottom:8px;">外交关系</div>
          <div style="font-size:11px;color:${C.inkMuted};margin-bottom:4px;">
            同盟: ${Object.keys(alliance.allies || {}).length}
          </div>
          <div style="font-size:11px;color:${C.inkMuted};">
            敌对: ${Object.keys(alliance.enemies || {}).length}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 渲染底部：关系网络 Canvas
   * @returns {string}
   */
  _renderBottomCanvas() {
    const C = this.COLORS;
    return `
      <div style="height:300px;border-top:1px solid ${C.gold};background:${C.parchmentLight};position:relative;">
        <canvas id="allianceNetworkCanvas" style="width:100%;height:100%;display:block;"></canvas>
        <div style="position:absolute;top:8px;left:8px;font-size:11px;color:${C.inkMuted};background:rgba(253,248,240,0.8);padding:4px 8px;border-radius:4px;">
          滚轮缩放 · 拖拽平移 · 点击节点选中
        </div>
      </div>
    `;
  },

  /**
   * 获取严重度颜色
   * @param {string} severity
   * @returns {string}
   */
  _severityColor(severity) {
    const map = { high: this.COLORS.crimson, normal: this.COLORS.amber, low: this.COLORS.jade };
    return map[severity] || this.COLORS.inkMuted;
  },

  // ===================== 界面交互方法 =====================

  /**
   * 选中联盟
   * @param {string} id
   */
  selectAlliance(id) {
    this.currentAllianceId = id;
    this.renderPage();
  },

  /**
   * 打开创建联盟弹窗
   */
  openCreateModal() {
    const name = prompt('联盟名称：');
    if (!name) return;
    const type = prompt('联盟类型（如：门派/家族/商帮/朋友圈）：', '自定义');
    const desc = prompt('联盟描述：', '');
    const alliance = this.createAlliance({ name, type: type || '自定义联盟', description: desc || '' });
    if (alliance) {
      this.currentAllianceId = alliance.id;
      this.renderPage();
      if (typeof App !== 'undefined' && App.toast) App.toast(`联盟「${alliance.name}」已创建`, 'success');
    }
  },

  /**
   * 打开邀请成员弹窗
   */
  openInviteModal() {
    if (!this.currentAllianceId) return;
    const target = prompt('请输入要邀请的成员名称：');
    if (!target) return;
    const role = prompt('授予职位（默认：成员）：', '成员');
    if (this.inviteMember(this.currentAllianceId, target, { role: role || '成员', invitedBy: this._getPlayerName() })) {
      this.renderPage();
      if (typeof App !== 'undefined' && App.toast) App.toast(`已向 ${target} 发送邀请`, 'success');
    }
  },

  /**
   * 打开外交弹窗（结盟/敌对）
   * @param {string} action
   */
  openAllianceDiplomacy(action) {
    if (!this.currentAllianceId) return;
    const others = this.alliances.filter(a => a.id !== this.currentAllianceId);
    if (others.length === 0) {
      alert('当前没有其他联盟可交互');
      return;
    }
    const names = others.map((a, i) => `${i + 1}. ${a.name} [${a.id}]`).join('\n');
    const input = prompt(`选择目标联盟编号或输入ID：\n${names}`);
    if (!input) return;
    const target = others.find(a => a.id === input || a.name === input) || others[parseInt(input, 10) - 1];
    if (!target) { alert('未找到目标联盟'); return; }

    if (action === 'ally') {
      if (this.formAlliance(this.currentAllianceId, target.id)) {
        this.renderPage();
        if (typeof App !== 'undefined' && App.toast) App.toast(`与「${target.name}」缔结同盟`, 'success');
      }
    } else if (action === 'hostile') {
      const reason = prompt('敌对原因：', '');
      if (this.declareHostile(this.currentAllianceId, target.id, reason)) {
        this.renderPage();
        if (typeof App !== 'undefined' && App.toast) App.toast(`向「${target.name}」宣布敌对`, 'warning');
      }
    }
  },

  /**
   * 打开断交弹窗
   */
  openBreakAllianceModal() {
    if (!this.currentAllianceId) return;
    const alliance = this.getAlliance(this.currentAllianceId);
    const allyIds = Object.keys(alliance.allies || {});
    if (allyIds.length === 0) { alert('当前没有同盟'); return; }
    const others = allyIds.map(id => this.getAlliance(id)).filter(Boolean);
    const names = others.map((a, i) => `${i + 1}. ${a.name} [${a.id}]`).join('\n');
    const input = prompt(`选择要断交的联盟：\n${names}`);
    if (!input) return;
    const target = others.find(a => a.id === input || a.name === input) || others[parseInt(input, 10) - 1];
    if (!target) return;
    if (this.breakAlliance(this.currentAllianceId, target.id)) {
      this.renderPage();
      if (typeof App !== 'undefined' && App.toast) App.toast(`与「${target.name}」解除同盟`, 'info');
    }
  },

  /**
   * 打开合并弹窗
   */
  openMergeModal() {
    if (!this.currentAllianceId) return;
    const others = this.alliances.filter(a => a.id !== this.currentAllianceId);
    if (others.length === 0) { alert('没有其他联盟可合并'); return; }
    const names = others.map((a, i) => `${i + 1}. ${a.name} [${a.id}]`).join('\n');
    const input = prompt(`选择要合并的联盟：\n${names}`);
    if (!input) return;
    const target = others.find(a => a.id === input || a.name === input) || others[parseInt(input, 10) - 1];
    if (!target) return;
    const newName = prompt('合并后新联盟名称：', `${this.getAlliance(this.currentAllianceId).name}·${target.name}合盟`);
    const result = this.mergeAlliances(this.currentAllianceId, target.id, { name: newName });
    if (result) {
      this.currentAllianceId = result.id;
      this.renderPage();
      if (typeof App !== 'undefined' && App.toast) App.toast(`已合并为「${result.name}」`, 'success');
    }
  },

  /**
   * 为当前联盟生成事件
   */
  generateEventNow() {
    if (!this.currentAllianceId) return;
    const ev = this.generateRandomEvent(this.currentAllianceId);
    if (ev) {
      this.renderPage();
      if (typeof App !== 'undefined' && App.toast) App.toast(`新事件：${ev.name}`, 'info');
    }
  },

  /**
   * 退出当前联盟
   */
  leaveCurrentAlliance() {
    if (!this.currentAllianceId) return;
    const alliance = this.getAlliance(this.currentAllianceId);
    if (!alliance) return;
    const me = (alliance.members || []).find(m => m.name === this._getPlayerName());
    if (!me) { alert('你不是该联盟成员'); return; }
    if (!confirm(`确定要退出「${alliance.name}」吗？`)) return;
    if (this.leaveAlliance(this.currentAllianceId, me.id)) {
      this.currentAllianceId = null;
      this.renderPage();
      if (typeof App !== 'undefined' && App.toast) App.toast('已退出联盟', 'info');
    }
  },

  // ===================== 联动接口 =====================

  /**
   * 关联家族成员加入联盟
   * @param {string} familyId
   * @param {string} allianceId
   * @returns {boolean}
   */
  linkFamily(familyId, allianceId) {
    const alliance = this.getAlliance(allianceId);
    if (!alliance) return false;

    let family = null;
    if (typeof FamilySystem !== 'undefined' && FamilySystem.getFamily) {
      family = FamilySystem.getFamily(familyId);
    }
    if (!family) return false;

    (family.members || []).forEach(fm => {
      const exists = (alliance.members || []).some(am => am.name === fm.name);
      if (!exists) {
        alliance.members.push({
          id: this._generateId(),
          name: fm.name,
          role: '家族成员',
          permissions: ['发言'],
          contribution: 0,
          joinedAt: Date.now(),
          status: 'active',
          familyId: familyId,
          npcId: fm.npcId || ''
        });
      }
    });
    this.save();
    this.emitEvent('family_linked', { familyId, allianceId });
    return true;
  },

  /**
   * 关联势力视为大型联盟
   * @param {string} factionId
   * @param {string} allianceId
   * @returns {boolean}
   */
  linkFaction(factionId, allianceId) {
    const alliance = this.getAlliance(allianceId);
    if (!alliance) return false;

    let faction = null;
    if (typeof PoliticalSystem !== 'undefined' && PoliticalSystem.getFaction) {
      faction = PoliticalSystem.getFaction(factionId);
    }
    if (!faction) return false;

    // 将势力成员导入联盟
    (faction.members || []).forEach(fm => {
      const exists = (alliance.members || []).some(am => am.name === fm.name);
      if (!exists) {
        alliance.members.push({
          id: this._generateId(),
          name: fm.name,
          role: fm.position || '势力成员',
          permissions: fm.level === 0 ? ['发言', '决策', '管理', '外交', '驱逐'] : ['发言'],
          contribution: fm.influence || 0,
          joinedAt: Date.now(),
          status: 'active',
          npcId: fm.npcId || ''
        });
      }
    });

    // 同步资源
    if (faction.resources) {
      alliance.resources = alliance.resources || {};
      alliance.resources.gold = (alliance.resources.gold || 0) + (faction.resources.gold || 0);
      alliance.resources.food = (alliance.resources.food || 0) + (faction.resources.food || 0);
      alliance.resources.troops = (alliance.resources.troops || 0) + (faction.resources.troops || 0);
      alliance.resources.prestige = (alliance.resources.prestige || 0) + (faction.resources.prestige || 0);
    }

    this.save();
    this.emitEvent('faction_linked', { factionId, allianceId });
    return true;
  },

  /**
   * 从 FamilySystem 同步家族为联盟
   */
  syncFromFamilySystem() {
    if (typeof FamilySystem === 'undefined' || !FamilySystem.getFamilies) return;
    const families = FamilySystem.getFamilies();
    families.forEach(f => {
      const exists = this.alliances.some(a => a.name === f.name);
      if (!exists) {
        this.createAlliance({
          name: f.name,
          type: f.type || '家族',
          description: f.description || '',
          founder: f.founder || '',
          leader: f.head || '',
          members: (f.members || []).map(m => ({
            id: this._generateId(),
            name: m.name,
            role: m.position || '家族成员',
            permissions: ['发言'],
            contribution: 0,
            joinedAt: Date.now(),
            status: m.status === '在世' ? 'active' : 'inactive',
            familyId: f.id,
            npcId: m.npcId || ''
          })),
          resources: { prestige: f.reputation || 50, gold: f.wealth || 500 }
        });
      }
    });
  },

  /**
   * 从 PoliticalSystem 同步势力为联盟
   */
  syncFromPoliticalSystem() {
    if (typeof PoliticalSystem === 'undefined' || !PoliticalSystem.getFactions) return;
    const factions = PoliticalSystem.getFactions();
    factions.forEach(f => {
      const exists = this.alliances.some(a => a.name === f.name);
      if (!exists) {
        this.createAlliance({
          name: f.name,
          type: f.typeName || '势力',
          description: f.description || '',
          founder: f.leader?.name || '',
          leader: f.leader?.name || '',
          members: (f.members || []).map(m => ({
            id: this._generateId(),
            name: m.name,
            role: m.position || '成员',
            permissions: m.level === 0 ? ['发言', '决策', '管理', '外交', '驱逐'] : ['发言'],
            contribution: m.influence || 0,
            joinedAt: Date.now(),
            status: 'active',
            npcId: m.npcId || ''
          })),
          resources: { ...f.resources }
        });
      }
    });
  },

  // ===================== 事件与通知 =====================

  /**
   * 发送 EventBridge 事件
   * @param {string} type
   * @param {Object} payload
   */
  emitEvent(type, payload) {
    if (typeof window !== 'undefined' && window.EventBridge) {
      EventBridge.emit('alliance', { type, payload, source: 'AllianceSystem' });
    }
  }
};

// ===================== 自动初始化 =====================
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AllianceSystem.init());
  } else {
    AllianceSystem.init();
  }
}
