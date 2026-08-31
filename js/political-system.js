/**
 * =========================================================
 * PoliticalSystem v1 -- 势力/政治/王朝系统
 * 模块名：PoliticalSystem
 * 核心概念：多势力并存，有权力结构、领土控制、外交关系、战争与和平。
 *          群像NPC在势力中担任不同职位，形成动态权力斗争。
 *
 * 功能模块：
 *   1. 势力数据结构 -- 完整的势力档案（领袖、层级、成员、领土、资源、外交、法令、历史）
 *   2. 势力地图 -- 在现有地图系统上叠加势力控制区域
 *   3. 职位与权力 -- 职位体系、晋升/降职/罢免/流放
 *   4. 外交系统 -- 势力间关系：同盟/中立/敌对/战争
 *   5. 战争系统（简化） -- 宣战、集结、战斗、结果
 *   6. 法令与政策 -- 税收、征兵、贸易、外交、内政
 *   7. 势力历史 -- 重大事件时间轴
 *   8. 界面 -- 势力列表、详情、外交面板、战争面板、法令编辑器
 *
 * 全局对象：PoliticalSystem
 * 存储键：political_system_v16
 * 配色：古风墨境 -- 暖羊皮纸底 #F5E6D3 / 金色 #C9A227 / 墨色 #2C1810
 *
 * 联动：
 *   - FamilySystem：家族成员在势力中任职
 *   - MapSystem：势力控制区域显示在地图上
 *   - WorldviewEngine：势力类型根据世界观变化
 *   - NPCManager：NPC担任势力职位
 * =========================================================
 */

const PoliticalSystem = {

  // ===================== 常量配置 =====================

  /** 存储键名 */
  STORAGE_KEY: 'political_system_v16',

  /** 势力类型枚举 */
  FACTION_TYPES: {
    court:    { name: '朝廷',   icon: '👑', desc: '统治天下的中央政权' },
    sect:     { name: '门派',   icon: '⚔️', desc: '江湖武林势力' },
    nation:   { name: '国家',   icon: '🏛️', desc: '独立政权实体' },
    gang:     { name: '帮派',   icon: '🗡️', desc: '江湖帮派组织' },
    company:  { name: '公司',   icon: '🏢', desc: '商业集团势力' },
    tribe:    { name: '部落',   icon: '🏕️', desc: '原始部落联盟' },
    guild:    { name: '商会',   icon: '💰', desc: '商业行会组织' },
    cult:     { name: '教派',   icon: '☸️', desc: '宗教信仰势力' }
  },

  /** 外交关系类型 */
  DIPLOMACY_TYPES: {
    alliance:   { name: '同盟', color: '#4CAF50', icon: '🤝', desc: '军事互助、贸易优惠' },
    friendly:   { name: '友好', color: '#8BC34A', icon: '☺️', desc: '关系良好' },
    neutral:    { name: '中立', color: '#9E9E9E', icon: '😐', desc: '互不干涉' },
    tense:      { name: '紧张', color: '#FF9800', icon: '😠', desc: '关系恶化' },
    hostile:    { name: '敌对', color: '#F44336', icon: '💢', desc: '冲突边缘' },
    war:        { name: '战争', color: '#B71C1C', icon: '⚔️', desc: '全面战争' }
  },

  /** 职位层级定义 */
  HIERARCHY_LEVELS: [
    { level: 0, name: '领袖',     power: 100, salaryBase: 1000, desc: '势力的最高统治者' },
    { level: 1, name: '副手/长老', power: 80,  salaryBase: 600,  desc: '核心决策层' },
    { level: 2, name: '中层',     power: 50,  salaryBase: 300,  desc: '执行管理层' },
    { level: 3, name: '基层',     power: 20,  salaryBase: 100,  desc: '普通成员' },
    { level: 4, name: '平民/外门', power: 5,   salaryBase: 30,   desc: '外围成员' }
  ],

  /** 法令类型 */
  LAW_TYPES: {
    tax:      { name: '税收法令', icon: '💰', desc: '调整税率与征收方式' },
    conscript:{ name: '征兵法令', icon: '🎖️', desc: '强制征召兵力' },
    trade:    { name: '贸易法令', icon: '📦', desc: '调控对外贸易' },
    diplomacy:{ name: '外交法令', icon: '📜', desc: '对外政策调整' },
    internal: { name: '内政法令', icon: '🏛️', desc: '内部管理制度' },
    military: { name: '军务法令', icon: '⚔️', desc: '军事部署与调动' },
    justice:  { name: '司法法令', icon: '⚖️', desc: '刑罚与审判制度' }
  },

  /** 古风墨境配色 */
  COLORS: {
    parchment:    '#F5E6D3',
    parchmentLight:'#FDF8F0',
    parchmentDark: '#E8D4BC',
    ink:           '#2C1810',
    inkLight:      '#5C3A2E',
    inkMuted:      '#8B6F5E',
    gold:          '#C9A227',
    goldLight:     '#E8C84B',
    goldDark:      '#A08020',
    border:        '#C9A227',
    borderLight:   'rgba(201,162,39,0.3)',
    red:           '#B85450',
    green:         '#4CAF50',
    blue:          '#1E88E5',
    orange:        '#F57C00',
    panelBg:       '#FDF8F0',
    text:          '#2C1810',
    textMuted:     '#8B6F5E'
  },

  /** 势力预设颜色（每个势力分配唯一颜色） */
  FACTION_COLORS: [
    '#C9A227', '#B85450', '#4A90C2', '#4CAF50', '#9C27B0',
    '#FF5722', '#0097A7', '#795548', '#607D8B', '#E91E63',
    '#3F51B5', '#8BC34A', '#FF9800', '#00BCD4', '#673AB7'
  ],

  /** 战争结果类型 */
  WAR_RESULTS: {
    victory:   { name: '大胜', desc: '全面胜利，获得领土与资源' },
    minor_win: { name: '小胜', desc: '取得局部优势' },
    draw:      { name: '僵持', desc: '双方损失相当' },
    minor_loss:{ name: '小败', desc: '损失部分资源' },
    defeat:    { name: '惨败', desc: '主力溃散，可能覆灭' }
  },

  /** NPC对法令的反应 */
  LAW_REACTIONS: {
    support:   { name: '支持', icon: '👍', color: '#4CAF50' },
    oppose:    { name: '反对', icon: '👎', color: '#F44336' },
    neutral:   { name: '中立', icon: '😐', color: '#9E9E9E' },
    ignore:    { name: '漠视', icon: '🙄', color: '#607D8B' }
  },

  // ===================== 运行时状态 =====================

  /** 势力数据缓存 */
  _factions: [],
  /** 当前选中势力ID */
  _selectedFactionId: null,
  /** 当前查看的外交面板 */
  _currentDiplomacyView: 'matrix',
  /** 当前战争ID（正在查看的） */
  _currentWarId: null,
  /** 势力颜色映射 { factionId: color } */
  _factionColorMap: {},
  /** 地图覆盖层状态 */
  _mapOverlayEnabled: true,

  // ===================== 数据持久化 =====================

  /**
   * 从本地存储加载势力数据
   */
  _loadData() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        this._factions = data.factions || [];
        this._factionColorMap = data.colorMap || {};
        this._assignColorsIfNeeded();
        return data;
      }
    } catch (e) {
      console.error('[PoliticalSystem] 加载数据失败:', e);
    }
    this._factions = [];
    this._factionColorMap = {};
    return { factions: [], colorMap: {}, wars: [], history: [] };
  },

  /**
   * 保存势力数据到本地存储
   */
  _saveData() {
    try {
      const data = {
        factions: this._factions,
        colorMap: this._factionColorMap,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('[PoliticalSystem] 保存数据失败:', e);
    }
  },

  /**
   * 为没有颜色的势力分配颜色
   */
  _assignColorsIfNeeded() {
    this._factions.forEach((f, i) => {
      if (!this._factionColorMap[f.id]) {
        this._factionColorMap[f.id] = this.FACTION_COLORS[i % this.FACTION_COLORS.length];
      }
    });
  },

  /**
   * 获取势力颜色
   * @param {string} factionId
   * @returns {string} 颜色代码
   */
  getFactionColor(factionId) {
    return this._factionColorMap[factionId] || this.COLORS.gold;
  },

  /**
   * 设置势力颜色
   * @param {string} factionId
   * @param {string} color
   */
  setFactionColor(factionId, color) {
    this._factionColorMap[factionId] = color;
    this._saveData();
  },

  // ===================== 核心API：势力管理 =====================

  /**
   * 初始化势力系统
   */
  init() {
    this._loadData();
    this._assignColorsIfNeeded();
    console.log('[PoliticalSystem] 势力系统初始化完成，当前势力数:', this._factions.length);
    return this;
  },

  /**
   * 进入势力页面时调用
   */
  onEnter() {
    this._loadData();
    this.renderPage();
  },

  /**
   * 获取所有势力
   * @returns {Array} 势力数组
   */
  getFactions() {
    return this._factions;
  },

  /**
   * 根据ID获取势力
   * @param {string} id
   * @returns {Object|null}
   */
  getFaction(id) {
    return this._factions.find(f => f.id === id) || null;
  },

  /**
   * 创建新势力
   * @param {Object} params -- 势力参数
   * @returns {Object} 新创建的势力
   */
  createFaction(params = {}) {
    const id = params.id || ('faction_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
    const typeKey = params.type || 'court';
    const typeInfo = this.FACTION_TYPES[typeKey] || this.FACTION_TYPES.court;

    const faction = {
      id,
      name: params.name || `新势力`,
      type: typeKey,
      typeName: typeInfo.name,
      typeIcon: typeInfo.icon,
      leader: params.leader || null,      // { npcId, name, title }
      hierarchy: params.hierarchy || this._createDefaultHierarchy(),
      members: params.members || [],        // [{ npcId, name, position, level, power, salary, duties, appointedAt }]
      territory: params.territory || [],    // [{ locationId, name, controlledAt, garrison }]
      resources: {
        gold: params.resources?.gold || 1000,
        food: params.resources?.food || 500,
        troops: params.resources?.troops || 100,
        population: params.resources?.population || 1000,
        prestige: params.resources?.prestige || 50,
        ...(params.resources || {})
      },
      diplomacy: params.diplomacy || {},    // { [otherFactionId]: { type, value, treaties:[] } }
      laws: params.laws || [],              // [{ id, type, title, content, issuedAt, issuedBy, status, reactions:[] }]
      history: params.history || [],        // [{ date, type, title, description, relatedIds:[] }]
      foundedAt: params.foundedAt || Date.now(),
      motto: params.motto || '',
      banner: params.banner || '',          // 势力旗帜/徽记描述
      description: params.description || '',
      status: params.status || 'active',    // active / dissolved / exiled / vassal
      parentFactionId: params.parentFactionId || null, // 宗主势力（藩属关系）
      settings: {
        autoTax: false,
        autoConscript: false,
        openRecruitment: true,
        ...params.settings
      }
    };

    this._factions.push(faction);
    this._assignColorsIfNeeded();
    this._saveData();

    // 记录创建历史
    this._addHistoryEvent(id, 'found', `「${faction.name}」建立`, `${faction.name}于今日建立，领袖为${faction.leader?.name || '待定'}。`);

    console.log('[PoliticalSystem] 创建势力:', faction.name);
    return faction;
  },

  /**
   * 创建默认层级结构
   * @returns {Array} 层级数组
   */
  _createDefaultHierarchy() {
    return this.HIERARCHY_LEVELS.map(h => ({
      level: h.level,
      name: h.name,
      power: h.power,
      salaryBase: h.salaryBase,
      desc: h.desc,
      maxMembers: h.level === 0 ? 1 : (h.level === 1 ? 3 : (h.level === 2 ? 8 : 20)),
      duties: []
    }));
  },

  /**
   * 更新势力信息
   * @param {string} factionId
   * @param {Object} updates
   * @returns {Object|null}
   */
  updateFaction(factionId, updates) {
    const faction = this.getFaction(factionId);
    if (!faction) return null;

    Object.keys(updates).forEach(key => {
      if (key === 'resources') {
        faction.resources = { ...faction.resources, ...updates.resources };
      } else if (key === 'diplomacy') {
        faction.diplomacy = { ...faction.diplomacy, ...updates.diplomacy };
      } else if (key !== 'id') {
        faction[key] = updates[key];
      }
    });

    this._saveData();
    return faction;
  },

  /**
   * 删除势力
   * @param {string} factionId
   * @param {boolean} dissolve -- 是否记录为解散（false则彻底删除）
   */
  deleteFaction(factionId, dissolve = true) {
    const idx = this._factions.findIndex(f => f.id === factionId);
    if (idx < 0) return false;

    const faction = this._factions[idx];

    if (dissolve) {
      faction.status = 'dissolved';
      this._addHistoryEvent(factionId, 'dissolve', `「${faction.name}」覆灭`, `${faction.name}已覆灭，所有成员各奔东西。`);
      console.log('[PoliticalSystem] 势力解散:', faction.name);
    } else {
      this._factions.splice(idx, 1);
      delete this._factionColorMap[factionId];
      console.log('[PoliticalSystem] 势力删除:', faction.name);
    }

    // 清理其他势力对该势力的外交记录
    this._factions.forEach(f => {
      if (f.diplomacy && f.diplomacy[factionId]) {
        delete f.diplomacy[factionId];
      }
    });

    this._saveData();
    return true;
  },

  /**
   * 添加历史事件
   * @param {string} factionId
   * @param {string} type
   * @param {string} title
   * @param {string} description
   * @param {Array} relatedIds
   */
  _addHistoryEvent(factionId, type, title, description, relatedIds = []) {
    const faction = this.getFaction(factionId);
    if (!faction) return;
    faction.history = faction.history || [];
    faction.history.push({
      id: 'hist_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      date: Date.now(),
      type,
      title,
      description,
      relatedIds
    });
    // 限制历史记录数量
    if (faction.history.length > 200) {
      faction.history = faction.history.slice(-200);
    }
  },

  // ===================== 成员与职位管理 =====================

  /**
   * 任命NPC到职位
   * @param {string} factionId
   * @param {string} npcId
   * @param {Object} appointment -- { position, level, duties, salary }
   * @returns {boolean}
   */
  appointMember(factionId, npcId, appointment = {}) {
    const faction = this.getFaction(factionId);
    if (!faction) return false;

    // 获取NPC信息
    let npcName = appointment.name || '';
    let npcData = null;
    if (typeof NPCManager !== 'undefined' && NPCManager.getNPCById) {
      npcData = NPCManager.getNPCById(npcId);
      if (npcData) npcName = npcData.name;
    }

    // 检查是否已在此势力
    const existingIdx = faction.members.findIndex(m => m.npcId === npcId);
    const member = {
      npcId,
      name: npcName || '未知',
      position: appointment.position || '成员',
      level: appointment.level ?? 3,
      power: appointment.power ?? this._getDefaultPower(appointment.level ?? 3),
      salary: appointment.salary ?? this._getDefaultSalary(appointment.level ?? 3),
      duties: appointment.duties || [],
      appointedAt: Date.now(),
      promotedAt: Date.now(),
      demotedAt: null,
      achievements: [],
      loyalty: appointment.loyalty ?? 50,
      influence: appointment.influence ?? 10
    };

    if (existingIdx >= 0) {
      // 更新现有成员
      faction.members[existingIdx] = { ...faction.members[existingIdx], ...member };
    } else {
      faction.members.push(member);
    }

    // 如果是领袖级别，更新势力领袖
    if (member.level === 0) {
      faction.leader = { npcId, name: member.name, title: member.position };
    }

    this._addHistoryEvent(factionId, 'appoint', `任命${member.name}`, `${member.name}被任命为${member.position}。`);
    this._saveData();
    return true;
  },

  /**
   * 获取默认权力值
   * @param {number} level
   * @returns {number}
   */
  _getDefaultPower(level) {
    const h = this.HIERARCHY_LEVELS.find(h => h.level === level);
    return h ? h.power : 10;
  },

  /**
   * 获取默认俸禄
   * @param {number} level
   * @returns {number}
   */
  _getDefaultSalary(level) {
    const h = this.HIERARCHY_LEVELS.find(h => h.level === level);
    return h ? h.salaryBase : 10;
  },

  /**
   * 晋升NPC
   * @param {string} factionId
   * @param {string} npcId
   * @returns {boolean}
   */
  promoteMember(factionId, npcId) {
    const faction = this.getFaction(factionId);
    if (!faction) return false;

    const member = faction.members.find(m => m.npcId === npcId);
    if (!member) return false;
    if (member.level <= 0) return false; // 已是最高级

    const oldLevel = member.level;
    const newLevel = Math.max(0, member.level - 1);
    member.level = newLevel;
    member.power = this._getDefaultPower(newLevel);
    member.salary = this._getDefaultSalary(newLevel);
    member.promotedAt = Date.now();
    member.achievements = member.achievements || [];
    member.achievements.push({ type: 'promote', from: oldLevel, to: newLevel, date: Date.now() });

    // 如果晋升为领袖
    if (newLevel === 0) {
      faction.leader = { npcId, name: member.name, title: member.position };
      // 原领袖降级
      const oldLeader = faction.members.find(m => m.npcId !== npcId && m.level === 0);
      if (oldLeader) {
        oldLeader.level = 1;
        oldLeader.power = this._getDefaultPower(1);
        oldLeader.salary = this._getDefaultSalary(1);
      }
    }

    this._addHistoryEvent(factionId, 'promote', `${member.name}晋升`, `${member.name}从${this.HIERARCHY_LEVELS.find(h => h.level === oldLevel)?.name || '?'}晋升为${this.HIERARCHY_LEVELS.find(h => h.level === newLevel)?.name || '?'}。`);
    this._saveData();
    return true;
  },

  /**
   * 降职NPC
   * @param {string} factionId
   * @param {string} npcId
   * @returns {boolean}
   */
  demoteMember(factionId, npcId) {
    const faction = this.getFaction(factionId);
    if (!faction) return false;

    const member = faction.members.find(m => m.npcId === npcId);
    if (!member) return false;
    if (member.level >= this.HIERARCHY_LEVELS.length - 1) return false;

    const oldLevel = member.level;
    const newLevel = Math.min(this.HIERARCHY_LEVELS.length - 1, member.level + 1);
    member.level = newLevel;
    member.power = this._getDefaultPower(newLevel);
    member.salary = this._getDefaultSalary(newLevel);
    member.demotedAt = Date.now();
    member.loyalty = Math.max(0, (member.loyalty || 50) - 20); // 忠诚度下降

    this._addHistoryEvent(factionId, 'demote', `${member.name}降职`, `${member.name}从${this.HIERARCHY_LEVELS.find(h => h.level === oldLevel)?.name || '?'}降职为${this.HIERARCHY_LEVELS.find(h => h.level === newLevel)?.name || '?'}。`);
    this._saveData();
    return true;
  },

  /**
   * 罢免NPC
   * @param {string} factionId
   * @param {string} npcId
   * @returns {boolean}
   */
  removeMember(factionId, npcId) {
    const faction = this.getFaction(factionId);
    if (!faction) return false;

    const member = faction.members.find(m => m.npcId === npcId);
    if (!member) return false;

    faction.members = faction.members.filter(m => m.npcId !== npcId);

    // 如果罢免的是领袖，清空领袖
    if (faction.leader && faction.leader.npcId === npcId) {
      faction.leader = null;
    }

    this._addHistoryEvent(factionId, 'remove', `${member.name}被罢免`, `${member.name}被罢免${member.position}职位，逐出势力。`);
    this._saveData();
    return true;
  },

  /**
   * 流放NPC
   * @param {string} factionId
   * @param {string} npcId
   * @returns {boolean}
   */
  exileMember(factionId, npcId) {
    const faction = this.getFaction(factionId);
    if (!faction) return false;

    const member = faction.members.find(m => m.npcId === npcId);
    if (!member) return false;

    member.status = 'exiled';
    member.exiledAt = Date.now();
    member.loyalty = 0;

    // 从活跃成员中标记为流放，但不删除
    this._addHistoryEvent(factionId, 'exile', `${member.name}被流放`, `${member.name}因罪被流放，永世不得返回。`);
    this._saveData();
    return true;
  },

  /**
   * 检查晋升资格
   * @param {string} factionId
   * @param {string} npcId
   * @returns {Object} { eligible, reasons }
   */
  checkPromotionEligibility(factionId, npcId) {
    const faction = this.getFaction(factionId);
    if (!faction) return { eligible: false, reasons: ['势力不存在'] };

    const member = faction.members.find(m => m.npcId === npcId);
    if (!member) return { eligible: false, reasons: ['非势力成员'] };

    const reasons = [];
    let eligible = true;

    // 条件1：资历（任职时间）
    const tenure = Date.now() - (member.appointedAt || Date.now());
    const minTenure = 7 * 24 * 60 * 60 * 1000; // 7天
    if (tenure < minTenure) {
      eligible = false;
      reasons.push('资历不足（需满7天）');
    } else {
      reasons.push('资历充足');
    }

    // 条件2：功绩
    const achievementCount = (member.achievements || []).length;
    if (achievementCount < 3) {
      eligible = false;
      reasons.push(`功绩不足（需3项以上，当前${achievementCount}项）`);
    } else {
      reasons.push('功绩充足');
    }

    // 条件3：忠诚度
    if ((member.loyalty || 0) < 60) {
      eligible = false;
      reasons.push('忠诚度不足（需60以上）');
    } else {
      reasons.push('忠诚度合格');
    }

    // 条件4：层级上限
    const targetLevel = Math.max(0, member.level - 1);
    const targetTier = faction.hierarchy.find(h => h.level === targetLevel);
    const currentCount = faction.members.filter(m => m.level === targetLevel).length;
    if (targetTier && currentCount >= targetTier.maxMembers) {
      eligible = false;
      reasons.push('该层级人数已满');
    } else if (targetTier) {
      reasons.push('层级有空缺');
    }

    return { eligible, reasons };
  },

  /**
   * 获取NPC在势力中的信息
   * @param {string} npcId
   * @returns {Object|null} { faction, member }
   */
  getMemberFaction(npcId) {
    for (const faction of this._factions) {
      const member = faction.members.find(m => m.npcId === npcId);
      if (member) return { faction, member };
    }
    return null;
  },

  /**
   * 获取NPC发言权重
   * @param {string} npcId
   * @returns {number} 权重值（0-100）
   */
  getNPCSpeechWeight(npcId) {
    const info = this.getMemberFaction(npcId);
    if (!info) return 5; // 平民权重
    const { member } = info;
    return member.power || 5;
  }
};

