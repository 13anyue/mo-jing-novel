/**
 * =========================================================
 * FamilySystem v16 — 家族/宗族系统
 * 核心概念：NPC属于家族/宗族/门派/势力，家族有树状结构、
 *         声望、资源、政治影响力。支持无限规模群像管理。
 *
 * 功能模块：
 *   1. 家族数据结构（动态类型根据世界观变化）
 *   2. 家族树可视化（Canvas绘制，支持缩放/平移/拖拽）
 *   3. 成员管理（添加、关系、状态、职位）
 *   4. 家族互动（联姻、结仇、吞并、分家）
 *   5. 家族声望与影响力
 *   6. 继承系统（多种继承规则）
 *   7. 家族大事记（时间轴）
 *   8. 无上限设计（虚拟滚动、分页加载）
 *   9. 三栏式界面（左列表面板、中树Canvas、右详情面板）
 *   10. EventBridge联动
 *
 * 全局对象：FamilySystem
 * 存储键：family_system_v16
 * 配色：古风墨境 — 暖羊皮纸 #F5E6D3 / 金色 #C9A227 / 墨色 #2C1810
 * =========================================================
 */
const FamilySystem = {

  // ===================== 常量与配置 =====================

  /** @type {string} localStorage 存储键 */
  STORAGE_KEY: 'family_system_v16',

  /** @type {string} 大事记存储键后缀 */
  HISTORY_KEY_SUFFIX: '_history',

  /** @type {Object} 古风墨境默认配色方案 */
  COLORS: {
    parchment: '#F5E6D3',      // 暖羊皮纸底色
    gold: '#C9A227',           // 金色
    ink: '#2C1810',            // 墨色
    inkLight: '#5C3A2A',       // 浅墨色
    inkMuted: '#8B7355',       // 淡墨色
    crimson: '#8B1A1A',        // 深红（敌对）
    jade: '#2D5A3D',           // 翠绿（同盟）
    amber: '#B8860B',          // 琥珀（进行中）
    gray: '#A09080',           // 灰色（已故）
    white: '#FDF8F0',          // 纯白
    shadow: 'rgba(44,24,16,0.15)' // 阴影
  },

  /** @type {Object} 家族类型映射（根据世界观动态变化） */
  FAMILY_TYPES: {
    // 宫廷世界观
    gongting: ['世家', '皇族', '外戚', '权臣', '藩王', '宦官集团'],
    // 修仙世界观
    xianxiu: ['宗门', '世家', '散修联盟', '仙族', '魔道', '妖族'],
    // 武侠世界观
    wuxia: ['门派', '世家', '帮会', '镖局', '商会', '隐士'],
    // 商贾世界观
    shanggu: ['商帮', '钱庄', '行会', '世家', '官商', '海商'],
    // 默认
    default: ['世家', '皇族', '门派', '商帮', '宗族', '势力']
  },

  /** @type {Array<string>} 成员关系类型 */
  RELATION_TYPES: ['父', '母', '子', '女', '兄', '弟', '姐', '妹', '师', '徒', '从', '主', '仆'],

  /** @type {Array<string>} 成员职位 */
  POSITIONS: ['家主', '长老', '嫡子', '庶子', '外戚', '门客', '弟子', '护法', '供奉', '执事'],

  /** @type {Array<string>} 成员状态 */
  MEMBER_STATUSES: ['在世', '已故', '失踪', '流放'],

  /** @type {Array<string>} 继承规则 */
  INHERITANCE_RULES: ['长子继承', '立贤', '指定', '争斗'],

  /** @type {number} 家族树Canvas节点半径 */
  NODE_RADIUS: 28,

  /** @type {number} 家族树节点垂直间距 */
  NODE_V_GAP: 90,

  /** @type {number} 家族树节点水平间距 */
  NODE_H_GAP: 100,

  /** @type {number} 成员列表每页数量 */
  PAGE_SIZE: 20,

  /** @type {number} 最大渲染节点数（虚拟滚动阈值） */
  MAX_RENDER_NODES: 200,

  // ===================== 状态 =====================

  /** @type {Array<Object>} 家族列表 */
  families: [],

  /** @type {string|null} 当前选中家族ID */
  currentFamilyId: null,

  /** @type {string|null} 当前选中成员ID */
  selectedMemberId: null,

  /** @type {Object} Canvas视图状态 */
  viewState: {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    lastMouseX: 0,
    lastMouseY: 0
  },

  /** @type {Object} UI状态 */
  uiState: {
    currentTab: 'families',    // 'families' | 'history' | 'alliances'
    searchQuery: '',
    memberPage: 0,
    showDeceased: true,
    filterType: 'all',
    expandedBranches: new Set()
  },

  /** @type {HTMLCanvasElement|null} 家族树Canvas */
  treeCanvas: null,

  /** @type {CanvasRenderingContext2D|null} Canvas上下文 */
  treeCtx: null,

  /** @type {Object|null} 预计算的树布局 */
  treeLayout: null,

  /** @type {number} 家族ID计数器 */
  _familyIdCounter: 0,

  /** @type {number} 成员ID计数器 */
  _memberIdCounter: 0,

  // ===================== 初始化 =====================

  /**
   * 初始化家族系统
   */
  init() {
    this.load();
    this.bindKeyboardShortcuts();
    this.listenToEventBridge();
    console.log('[FamilySystem] 家族系统初始化完成');
  },

  /**
   * 绑定键盘快捷键
   */
  bindKeyboardShortcuts() {
    if (typeof document === 'undefined') return;
    document.addEventListener('keydown', (e) => {
      if (!this.treeCanvas) return;
      if (e.key === '+' || e.key === '=') { e.preventDefault(); this.zoomIn(); }
      if (e.key === '-' || e.key === '_') { e.preventDefault(); this.zoomOut(); }
      if (e.key === '0') { e.preventDefault(); this.resetView(); }
      if (e.key === 'f' && e.ctrlKey) { e.preventDefault(); this.focusSearch(); }
    });
  },

  /**
   * 监听EventBridge事件
   */
  listenToEventBridge() {
    if (typeof window === 'undefined' || !window.EventBridge) return;
    // 监听NPC创建事件，自动关联家族
    EventBridge.on('npc', (e) => {
      if (e.type === 'created' && e.payload?.familyId) {
        this.addMemberToFamily(e.payload.familyId, e.payload.npcData);
      }
    }, 'FamilySystem');
    // 监听世界观变化，更新家族类型
    EventBridge.on('worldbook', (e) => {
      if (e.type === 'worldview_changed') {
        this.onWorldviewChanged(e.payload?.worldview);
      }
    }, 'FamilySystem');
  },

  // ===================== 数据持久化 =====================

  /**
   * 从localStorage加载数据
   */
  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        this.families = data.families || [];
        this._familyIdCounter = data._familyIdCounter || 0;
        this._memberIdCounter = data._memberIdCounter || 0;
        // 恢复UI状态
        if (data.uiState) {
          this.uiState = { ...this.uiState, ...data.uiState };
        }
      }
    } catch (e) {
      console.warn('[FamilySystem] 加载数据失败:', e);
      this.families = [];
    }
  },

  /**
   * 保存数据到localStorage
   */
  save() {
    try {
      const data = {
        families: this.families,
        _familyIdCounter: this._familyIdCounter,
        _memberIdCounter: this._memberIdCounter,
        uiState: {
          searchQuery: this.uiState.searchQuery,
          showDeceased: this.uiState.showDeceased,
          filterType: this.uiState.filterType
        }
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[FamilySystem] 保存数据失败:', e);
    }
  },

  /**
   * 获取家族大事记数据
   * @param {string} familyId 家族ID
   * @returns {Array<Object>} 大事记列表
   */
  getHistory(familyId) {
    try {
      const key = this.STORAGE_KEY + '_' + familyId + this.HISTORY_KEY_SUFFIX;
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) { return []; }
  },

  /**
   * 保存家族大事记
   * @param {string} familyId 家族ID
   * @param {Array<Object>} history 大事记列表
   */
  saveHistory(familyId, history) {
    try {
      const key = this.STORAGE_KEY + '_' + familyId + this.HISTORY_KEY_SUFFIX;
      localStorage.setItem(key, JSON.stringify(history));
    } catch (e) {
      console.warn('[FamilySystem] 保存大事记失败:', e);
    }
  },

  /**
   * 添加单条大事记
   * @param {string} familyId 家族ID
   * @param {Object} record 大事记记录
   */
  addHistoryRecord(familyId, record) {
    const history = this.getHistory(familyId);
    history.push({
      id: this._generateHistoryId(),
      timestamp: Date.now(),
      ...record
    });
    // 限制存储数量，防止无限增长
    if (history.length > 1000) history.splice(0, history.length - 1000);
    this.saveHistory(familyId, history);
    // 通知其他模块
    this.emitEvent('history_added', { familyId, record });
  },

  /**
   * 生成大事记唯一ID
   * @returns {string} 唯一ID
   */
  _generateHistoryId() {
    return 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  },

  // ===================== 家族CRUD =====================

  /**
   * 创建新家族
   * @param {Object} config 家族配置
   * @returns {Object} 创建的家族对象
   */
  createFamily(config = {}) {
    const worldview = this.getCurrentWorldview();
    const validTypes = this.FAMILY_TYPES[worldview] || this.FAMILY_TYPES.default;
    const type = config.type || validTypes[0];

    const family = {
      id: this._generateFamilyId(),
      name: config.name || this._generateFamilyName(type),
      type: validTypes.includes(type) ? type : validTypes[0],
      founder: config.founder || '',
      establishedDate: config.establishedDate || this._formatGameDate(),
      reputation: config.reputation ?? 50,
      wealth: config.wealth ?? 500,
      territory: config.territory || '',
      members: config.members || [],
      alliances: config.alliances || [],
      enemies: config.enemies || [],
      head: config.head || '',
      heir: config.heir || '',
      inheritanceRule: config.inheritanceRule || '长子继承',
      description: config.description || '',
      color: config.color || this._generateBranchColor(0),
      createdAt: Date.now()
    };

    this.families.push(family);
    this.save();

    // 记录大事记
    this.addHistoryRecord(family.id, {
      type: '家族建立',
      title: '家族成立',
      description: `${family.name} 由 ${family.founder || '无名氏'} 建立`,
      importance: 'major'
    });

    this.emitEvent('family_created', { family });
    return family;
  },

  /**
   * 获取家族列表
   * @param {Object} filter 过滤条件
   * @returns {Array<Object>} 家族列表
   */
  getFamilies(filter = {}) {
    let result = [...this.families];
    if (filter.type && filter.type !== 'all') {
      result = result.filter(f => f.type === filter.type);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.founder.toLowerCase().includes(q) ||
        f.territory.toLowerCase().includes(q)
      );
    }
    if (filter.minReputation) {
      result = result.filter(f => f.reputation >= filter.minReputation);
    }
    // 按声望排序
    return result.sort((a, b) => b.reputation - a.reputation);
  },

  /**
   * 获取单个家族
   * @param {string} familyId 家族ID
   * @returns {Object|null} 家族对象
   */
  getFamily(familyId) {
    return this.families.find(f => f.id === familyId) || null;
  },

  /**
   * 更新家族信息
   * @param {string} familyId 家族ID
   * @param {Object} updates 更新字段
   * @returns {Object|null} 更新后的家族
   */
  updateFamily(familyId, updates) {
    const family = this.getFamily(familyId);
    if (!family) return null;
    Object.assign(family, updates, { updatedAt: Date.now() });
    this.save();
    this.emitEvent('family_updated', { familyId, updates });
    return family;
  },

  /**
   * 删除家族（谨慎操作）
   * @param {string} familyId 家族ID
   * @returns {boolean} 是否成功
   */
  deleteFamily(familyId) {
    const idx = this.families.findIndex(f => f.id === familyId);
    if (idx === -1) return false;
    const family = this.families[idx];
    this.families.splice(idx, 1);
    // 清理关联数据
    this.saveHistory(familyId, []);
    this.save();
    this.emitEvent('family_deleted', { familyId, familyName: family.name });
    if (this.currentFamilyId === familyId) {
      this.currentFamilyId = null;
      this.selectedMemberId = null;
    }
    return true;
  },

  /**
   * 生成家族唯一ID
   * @returns {string} 家族ID
   */
  _generateFamilyId() {
    this._familyIdCounter++;
    return 'fam_' + Date.now() + '_' + this._familyIdCounter;
  },

  /**
   * 生成默认家族名
   * @param {string} type 家族类型
   * @returns {string} 家族名
   */
  _generateFamilyName(type) {
    const surnames = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴',
                      '欧阳', '司马', '上官', '慕容', '南宫', '诸葛', '司徒', '独孤'];
    const suffixes = {
      '世家': '氏', '皇族': '氏', '外戚': '府', '权臣': '府', '藩王': '府',
      '宗门': '宗', '仙族': '族', '魔道': '教', '妖族': '族',
      '门派': '派', '帮会': '帮', '镖局': '局', '隐士': '居',
      '商帮': '行', '钱庄': '号', '行会': '会', '海商': '商号',
      '宗族': '宗祠', '势力': '盟'
    };
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    const suffix = suffixes[type] || '氏';
    return surname + suffix;
  },

  // ===================== 成员管理 =====================

  /**
   * 添加成员到家族
   * @param {string} familyId 家族ID
   * @param {Object} memberConfig 成员配置
   * @returns {Object|null} 添加的成员
   */
  addMember(familyId, memberConfig = {}) {
    const family = this.getFamily(familyId);
    if (!family) return null;

    const member = {
      id: this._generateMemberId(),
      name: memberConfig.name || '无名氏',
      gender: memberConfig.gender || '男',
      birthDate: memberConfig.birthDate || this._formatGameDate(),
      deathDate: memberConfig.deathDate || '',
      status: memberConfig.status || '在世',
      position: memberConfig.position || '门客',
      generation: memberConfig.generation || 1,
      parents: memberConfig.parents || [],
      children: memberConfig.children || [],
      spouse: memberConfig.spouse || '',
      master: memberConfig.master || '',
      apprentices: memberConfig.apprentices || [],
      avatar: memberConfig.avatar || '',
      traits: memberConfig.traits || [],
      biography: memberConfig.biography || '',
      reputation: memberConfig.reputation ?? 0,
      wealth: memberConfig.wealth ?? 0,
      power: memberConfig.power ?? 0,
      // 关联NPC系统
      npcId: memberConfig.npcId || ''
    };

    // 如果指定了父母，自动计算辈分
    if (member.parents.length > 0) {
      member.generation = this._calculateGeneration(familyId, member.parents);
    }

    family.members.push(member);
    this.save();

    // 如果是第一个成员且没有家主，设为家主
    if (family.members.length === 1 && !family.head) {
      family.head = member.id;
      if (!family.heir) family.heir = member.id;
    }

    // 记录大事记
    this.addHistoryRecord(familyId, {
      type: '成员诞生',
      title: '家族添丁',
      description: `${member.name} 加入 ${family.name}`,
      memberId: member.id,
      importance: 'normal'
    });

    this.emitEvent('member_added', { familyId, member });
    return member;
  },

  /**
   * 从NPC数据添加成员
   * @param {string} familyId 家族ID
   * @param {Object} npcData NPC数据
   * @returns {Object|null} 添加的成员
   */
  addMemberFromNPC(familyId, npcData) {
    return this.addMember(familyId, {
      name: npcData.name,
      gender: npcData.gender || '未知',
      avatar: npcData.avatar || '',
      npcId: npcData.id || '',
      traits: npcData.traits || [],
      biography: npcData.description || '',
      reputation: npcData.reputation || 0
    });
  },

  /**
   * 获取成员
   * @param {string} familyId 家族ID
   * @param {string} memberId 成员ID
   * @returns {Object|null} 成员对象
   */
  getMember(familyId, memberId) {
    const family = this.getFamily(familyId);
    if (!family) return null;
    return family.members.find(m => m.id === memberId) || null;
  },

  /**
   * 更新成员信息
   * @param {string} familyId 家族ID
   * @param {string} memberId 成员ID
   * @param {Object} updates 更新字段
   * @returns {Object|null} 更新后的成员
   */
  updateMember(familyId, memberId, updates) {
    const member = this.getMember(familyId, memberId);
    if (!member) return null;
    Object.assign(member, updates, { updatedAt: Date.now() });
    this.save();
    this.emitEvent('member_updated', { familyId, memberId, updates });
    return member;
  },

  /**
   * 删除成员
   * @param {string} familyId 家族ID
   * @param {string} memberId 成员ID
   * @returns {boolean} 是否成功
   */
  deleteMember(familyId, memberId) {
    const family = this.getFamily(familyId);
    if (!family) return false;
    const idx = family.members.findIndex(m => m.id === memberId);
    if (idx === -1) return false;
    const member = family.members[idx];
    family.members.splice(idx, 1);

    // 清理关系引用
    family.members.forEach(m => {
      m.parents = m.parents.filter(p => p !== memberId);
      m.children = m.children.filter(c => c !== memberId);
      if (m.spouse === memberId) m.spouse = '';
      if (m.master === memberId) m.master = '';
      m.apprentices = m.apprentices.filter(a => a !== memberId);
    });

    // 如果删除的是家主，触发继承
    if (family.head === memberId) {
      this.triggerInheritance(familyId);
    }

    this.save();
    this.emitEvent('member_deleted', { familyId, memberId, memberName: member.name });
    return true;
  },

  /**
   * 设置成员关系
   * @param {string} familyId 家族ID
   * @param {string} memberId 成员ID
   * @param {string} relationType 关系类型
   * @param {string} targetId 目标成员ID
   * @returns {boolean} 是否成功
   */
  setRelation(familyId, memberId, relationType, targetId) {
    const member = this.getMember(familyId, memberId);
    const target = this.getMember(familyId, targetId);
    if (!member || !target || memberId === targetId) return false;

    switch (relationType) {
      case '父':
      case '母':
        if (!member.parents.includes(targetId)) member.parents.push(targetId);
        if (!target.children.includes(memberId)) target.children.push(memberId);
        break;
      case '子':
      case '女':
        if (!member.children.includes(targetId)) member.children.push(targetId);
        if (!target.parents.includes(memberId)) target.parents.push(memberId);
        break;
      case '兄':
      case '弟':
      case '姐':
      case '妹':
        // 兄弟姐妹关系通过共享父母隐式处理
        break;
      case '师':
        member.master = targetId;
        if (!target.apprentices.includes(memberId)) target.apprentices.push(memberId);
        break;
      case '徒':
        if (!member.apprentices.includes(targetId)) member.apprentices.push(targetId);
        target.master = memberId;
        break;
      case '从':
        // 从属关系记录到traits中
        if (!member.traits.includes('从属:' + target.name)) {
          member.traits.push('从属:' + target.name);
        }
        break;
      default:
        return false;
    }

    this.save();
    this.emitEvent('relation_set', { familyId, memberId, relationType, targetId });
    return true;
  },

  /**
   * 设置配偶关系（联姻）
   * @param {string} familyId 家族ID
   * @param {string} memberId 成员ID
   * @param {string} spouseId 配偶成员ID
   * @returns {boolean} 是否成功
   */
  setSpouse(familyId, memberId, spouseId) {
    const member = this.getMember(familyId, memberId);
    const spouse = this.getMember(familyId, spouseId);
    if (!member || !spouse || memberId === spouseId) return false;
    member.spouse = spouseId;
    spouse.spouse = memberId;
    this.save();
    this.emitEvent('spouse_set', { familyId, memberId, spouseId });
    return true;
  },

  /**
   * 变更成员状态
   * @param {string} familyId 家族ID
   * @param {string} memberId 成员ID
   * @param {string} newStatus 新状态
   * @returns {Object|null} 更新后的成员
   */
  changeMemberStatus(familyId, memberId, newStatus) {
    if (!this.MEMBER_STATUSES.includes(newStatus)) return null;
    const member = this.getMember(familyId, memberId);
    if (!member) return null;
    const oldStatus = member.status;
    member.status = newStatus;

    if (newStatus === '已故') {
      member.deathDate = this._formatGameDate();
      // 如果是家主去世，触发继承
      const family = this.getFamily(familyId);
      if (family && family.head === memberId) {
        this.triggerInheritance(familyId);
      }
      this.addHistoryRecord(familyId, {
        type: '成员死亡',
        title: '家族悲讯',
        description: `${member.name} 离世`,
        memberId,
        importance: 'major'
      });
    }

    this.save();
    this.emitEvent('member_status_changed', { familyId, memberId, oldStatus, newStatus });
    return member;
  },

  /**
   * 变更成员职位
   * @param {string} familyId 家族ID
   * @param {string} memberId 成员ID
   * @param {string} newPosition 新职位
   * @returns {Object|null} 更新后的成员
   */
  changeMemberPosition(familyId, memberId, newPosition) {
    if (!this.POSITIONS.includes(newPosition)) return null;
    const member = this.getMember(familyId, memberId);
    if (!member) return null;
    member.position = newPosition;
    this.save();
    this.emitEvent('member_position_changed', { familyId, memberId, newPosition });
    return member;
  },

  /**
   * 计算成员辈分
   * @param {string} familyId 家族ID
   * @param {Array<string>} parentIds 父母ID列表
   * @returns {number} 辈分（代数）
   */
  _calculateGeneration(familyId, parentIds) {
    let maxGen = 0;
    for (const pid of parentIds) {
      const parent = this.getMember(familyId, pid);
      if (parent && parent.generation > maxGen) {
        maxGen = parent.generation;
      }
    }
    return maxGen + 1;
  },

  /**
   * 生成成员唯一ID
   * @returns {string} 成员ID
   */
  _generateMemberId() {
    this._memberIdCounter++;
    return 'mem_' + Date.now() + '_' + this._memberIdCounter;
  },

  /**
   * 获取成员关系链（向上追溯）
   * @param {string} familyId 家族ID
   * @param {string} memberId 成员ID
   * @returns {Array<Object>} 祖先链
   */
  getAncestryChain(familyId, memberId) {
    const chain = [];
    const visited = new Set();
    const visit = (mid) => {
      if (visited.has(mid)) return;
      visited.add(mid);
      const member = this.getMember(familyId, mid);
      if (!member) return;
      chain.push(member);
      member.parents.forEach(visit);
    };
    visit(memberId);
    return chain;
  },

  /**
   * 获取成员后代（向下遍历）
   * @param {string} familyId 家族ID
   * @param {string} memberId 成员ID
   * @returns {Array<Object>} 后代列表
   */
  getDescendants(familyId, memberId) {
    const descendants = [];
    const visited = new Set();
    const visit = (mid) => {
      if (visited.has(mid)) return;
      visited.add(mid);
      const member = this.getMember(familyId, mid);
      if (!member || mid !== memberId) descendants.push(member);
      member.children.forEach(visit);
    };
    visit(memberId);
    return descendants.filter(m => m);
  },

  // ===================== 家族树可视化 =====================

  /**
   * 计算家族树布局（改进的Reingold-Tilford算法）
   * @param {string} familyId 家族ID
   * @returns {Object} 布局数据
   */
  calculateTreeLayout(familyId) {
    const family = this.getFamily(familyId);
    if (!family) return null;

    const members = family.members;
    const visibleMembers = members.filter(m =>
      this.uiState.showDeceased || m.status !== '已故'
    );

    // 按代数分组
    const genMap = new Map();
    visibleMembers.forEach(m => {
      const gen = m.generation || 1;
      if (!genMap.has(gen)) genMap.set(gen, []);
      genMap.get(gen).push(m);
    });

    // 排序每一代（按父母位置排序以保持树的整洁）
    const sortedGens = Array.from(genMap.entries()).sort((a, b) => a[0] - b[0]);

    const nodes = [];
    const edges = [];
    const positions = new Map();

    // 预计算每代宽度
    const genWidths = sortedGens.map(([gen, members]) => {
      return members.length * this.NODE_H_GAP;
    });
    const maxWidth = Math.max(...genWidths, 800);

    // 布局节点
    sortedGens.forEach(([gen, genMembers], genIdx) => {
      const totalWidth = genMembers.length * this.NODE_H_GAP;
      const startX = (maxWidth - totalWidth) / 2;
      const y = 80 + genIdx * this.NODE_V_GAP;

      genMembers.forEach((member, idx) => {
        const x = startX + idx * this.NODE_H_GAP + this.NODE_H_GAP / 2;
        positions.set(member.id, { x, y, gen, idx });
        nodes.push({
          id: member.id,
          x, y,
          member,
          generation: gen,
          color: this._getMemberNodeColor(member),
          radius: this.NODE_RADIUS
        });
      });
    });

    // 计算连线
    visibleMembers.forEach(m => {
      const from = positions.get(m.id);
      if (!from) return;
      // 到父母的连线
      m.parents.forEach(pid => {
        const to = positions.get(pid);
        if (to) {
          edges.push({ from: m.id, to: pid, type: 'parent', x1: from.x, y1: from.y, x2: to.x, y2: to.y });
        }
      });
      // 到配偶的连线
      if (m.spouse) {
        const to = positions.get(m.spouse);
        if (to && m.id < m.spouse) { // 只画一次
          edges.push({
            from: m.id, to: m.spouse, type: 'spouse',
            x1: from.x, y1: from.y, x2: to.x, y2: to.y
          });
        }
      }
      // 到师傅的连线
      if (m.master) {
        const to = positions.get(m.master);
        if (to) {
          edges.push({ from: m.id, to: m.master, type: 'master', x1: from.x, y1: from.y, x2: to.x, y2: to.y });
        }
      }
    });

    const layout = { nodes, edges, width: maxWidth, height: sortedGens.length * this.NODE_V_GAP + 100 };
    this.treeLayout = layout;
    return layout;
  },

  /**
   * 获取成员节点颜色
   * @param {Object} member 成员对象
   * @returns {string} 颜色代码
   */
  _getMemberNodeColor(member) {
    if (member.status === '已故') return this.COLORS.gray;
    if (member.position === '家主') return this.COLORS.gold;
    if (member.position === '长老') return this.COLORS.inkLight;
    return this.COLORS.ink;
  },

  /**
   * 渲染家族树到Canvas
   * @param {string} familyId 家族ID
   * @param {HTMLCanvasElement} canvas Canvas元素
   */
  renderTree(familyId, canvas) {
    if (!canvas) return;
    this.treeCanvas = canvas;
    this.treeCtx = canvas.getContext('2d');

    const layout = this.calculateTreeLayout(familyId);
    if (!layout) return;

    // 设置Canvas尺寸（考虑DPI）
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    this.treeCtx.scale(dpr, dpr);

    // 清空并绘制背景
    this.treeCtx.clearRect(0, 0, rect.width, rect.height);
    this._drawTreeBackground(rect.width, rect.height);

    // 应用视图变换
    this.treeCtx.save();
    this.treeCtx.translate(this.viewState.offsetX, this.viewState.offsetY);
    this.treeCtx.scale(this.viewState.scale, this.viewState.scale);

    // 绘制连线
    this._drawEdges(layout.edges);

    // 绘制节点（虚拟滚动：只绘制视口内节点）
    const visibleNodes = this._getVisibleNodes(layout.nodes, rect.width, rect.height);
    visibleNodes.forEach(node => this._drawNode(node));

    this.treeCtx.restore();

    // 绘制UI覆盖层（缩放比例、家族名等）
    this._drawOverlay(familyId, rect.width, rect.height);
  },

  /**
   * 绘制树背景
   * @param {number} width 宽度
   * @param {number} height 高度
   */
  _drawTreeBackground(width, height) {
    const ctx = this.treeCtx;
    // 暖羊皮纸底色
    ctx.fillStyle = this.COLORS.parchment;
    ctx.fillRect(0, 0, width, height);

    // 绘制 subtle 网格
    ctx.strokeStyle = 'rgba(201,162,39,0.08)';
    ctx.lineWidth = 0.5;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
  },

  /**
   * 绘制连线
   * @param {Array<Object>} edges 连线列表
   */
  _drawEdges(edges) {
    const ctx = this.treeCtx;
    edges.forEach(edge => {
      ctx.beginPath();
      ctx.strokeStyle = this._getEdgeColor(edge.type);
      ctx.lineWidth = edge.type === 'spouse' ? 2 : 1.5;
      ctx.setLineDash(edge.type === 'spouse' ? [4, 3] : []);

      if (edge.type === 'parent') {
        // 血缘连线：从子到父的垂直+水平折线
        const midY = (edge.y1 + edge.y2) / 2;
        ctx.moveTo(edge.x1, edge.y1 - this.NODE_RADIUS);
        ctx.lineTo(edge.x1, midY);
        ctx.lineTo(edge.x2, midY);
        ctx.lineTo(edge.x2, edge.y2 + this.NODE_RADIUS);
      } else if (edge.type === 'spouse') {
        // 配偶连线：水平直线
        ctx.moveTo(edge.x1 + this.NODE_RADIUS, edge.y1);
        ctx.lineTo(edge.x2 - this.NODE_RADIUS, edge.y2);
      } else {
        // 师徒等其他连线：曲线
        ctx.moveTo(edge.x1, edge.y1);
        ctx.quadraticCurveTo(
          (edge.x1 + edge.x2) / 2 + 30,
          (edge.y1 + edge.y2) / 2,
          edge.x2, edge.y2
        );
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });
  },

  /**
   * 获取连线颜色
   * @param {string} type 连线类型
   * @returns {string} 颜色
   */
  _getEdgeColor(type) {
    switch (type) {
      case 'parent': return 'rgba(44,24,16,0.5)';
      case 'spouse': return this.COLORS.crimson;
      case 'master': return this.COLORS.jade;
      default: return this.COLORS.inkMuted;
    }
  },

  /**
   * 获取视口内节点（虚拟滚动优化）
   * @param {Array<Object>} nodes 所有节点
   * @param {number} vw 视口宽
   * @param {number} vh 视口高
   * @returns {Array<Object>} 可见节点
   */
  _getVisibleNodes(nodes, vw, vh) {
    // 如果节点数较少，直接全部渲染
    if (nodes.length <= this.MAX_RENDER_NODES) return nodes;

    const margin = 100;
    const minX = (-this.viewState.offsetX / this.viewState.scale) - margin;
    const maxX = minX + (vw / this.viewState.scale) + margin * 2;
    const minY = (-this.viewState.offsetY / this.viewState.scale) - margin;
    const maxY = minY + (vh / this.viewState.scale) + margin * 2;

    return nodes.filter(n =>
      n.x >= minX && n.x <= maxX && n.y >= minY && n.y <= maxY
    );
  },

  /**
   * 绘制单个节点
   * @param {Object} node 节点数据
   */
  _drawNode(node) {
    const ctx = this.treeCtx;
    const { x, y, member, color, radius } = node;

    // 选中高亮
    const isSelected = this.selectedMemberId === member.id;
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
      ctx.strokeStyle = this.COLORS.gold;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // 节点圆形背景
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = member.status === '已故' ? this.COLORS.white : this.COLORS.white;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 头像（如果有）
    if (member.avatar) {
      // 简化为圆形裁剪区域，实际头像由外部加载
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius - 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = this.COLORS.parchment;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      ctx.restore();
    } else {
      // 默认：显示名字首字
      ctx.fillStyle = color;
      ctx.font = 'bold 14px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initial = member.name ? member.name.charAt(0) : '?';
      ctx.fillText(initial, x, y);
    }

    // 家主标识
    if (member.position === '家主') {
      ctx.beginPath();
      ctx.arc(x + radius - 4, y - radius + 4, 5, 0, Math.PI * 2);
      ctx.fillStyle = this.COLORS.gold;
      ctx.fill();
    }

    // 名字标签
    ctx.fillStyle = this.COLORS.ink;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(member.name, x, y + radius + 16);

    // 职位标签
    if (member.position && member.position !== '门客') {
      ctx.fillStyle = color;
      ctx.font = '10px sans-serif';
      ctx.fillText(member.position, x, y + radius + 28);
    }

    // 已故标记
    if (member.status === '已故') {
      ctx.fillStyle = this.COLORS.gray;
      ctx.font = '10px sans-serif';
      ctx.fillText('已故', x, y + radius + 40);
    }
  },

  /**
   * 绘制UI覆盖层
   * @param {string} familyId 家族ID
   * @param {number} width 宽度
   * @param {number} height 高度
   */
  _drawOverlay(familyId, width, height) {
    const ctx = this.treeCtx;
    const family = this.getFamily(familyId);
    if (!family) return;

    // 左上角：家族信息
    ctx.fillStyle = 'rgba(245,230,211,0.9)';
    ctx.strokeStyle = this.COLORS.gold;
    ctx.lineWidth = 1;
    ctx.fillRect(10, 10, 200, 60);
    ctx.strokeRect(10, 10, 200, 60);

    ctx.fillStyle = this.COLORS.ink;
    ctx.font = 'bold 14px serif';
    ctx.textAlign = 'left';
    ctx.fillText(family.name, 20, 30);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = this.COLORS.inkMuted;
    ctx.fillText(`成员: ${family.members.length} | 声望: ${family.reputation}`, 20, 48);
    ctx.fillText(`家主: ${this._getMemberName(familyId, family.head) || '空缺'}`, 20, 62);

    // 右下角：缩放比例
    ctx.fillStyle = 'rgba(245,230,211,0.8)';
    ctx.fillRect(width - 100, height - 30, 90, 22);
    ctx.fillStyle = this.COLORS.ink;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(this.viewState.scale * 100)}%`, width - 15, height - 14);
  },

  /**
   * 获取成员名字
   * @param {string} familyId 家族ID
   * @param {string} memberId 成员ID
   * @returns {string} 成员名
   */
  _getMemberName(familyId, memberId) {
    const member = this.getMember(familyId, memberId);
    return member ? member.name : '';
  },

  // ===================== Canvas交互 =====================

  /**
   * 绑定Canvas事件
   * @param {HTMLCanvasElement} canvas Canvas元素
   */
  bindCanvasEvents(canvas) {
    if (!canvas) return;

    canvas.addEventListener('mousedown', (e) => {
      this.viewState.isDragging = true;
      this.viewState.dragStartX = e.clientX;
      this.viewState.dragStartY = e.clientY;
      this.viewState.lastMouseX = e.clientX;
      this.viewState.lastMouseY = e.clientY;
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (this.viewState.isDragging) {
        const dx = e.clientX - this.viewState.lastMouseX;
        const dy = e.clientY - this.viewState.lastMouseY;
        this.viewState.offsetX += dx;
        this.viewState.offsetY += dy;
        this.viewState.lastMouseX = e.clientX;
        this.viewState.lastMouseY = e.clientY;
        this.renderTree(this.currentFamilyId, canvas);
      }

      // 悬停检测
      const hovered = this._hitTestNode(x, y);
      canvas.style.cursor = hovered ? 'pointer' : (this.viewState.isDragging ? 'grabbing' : 'grab');
    });

    canvas.addEventListener('mouseup', (e) => {
      if (this.viewState.isDragging) {
        const dx = Math.abs(e.clientX - this.viewState.dragStartX);
        const dy = Math.abs(e.clientY - this.viewState.dragStartY);
        // 如果移动距离很小，视为点击
        if (dx < 5 && dy < 5) {
          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const clicked = this._hitTestNode(x, y);
          if (clicked) {
            this.selectedMemberId = clicked.member.id;
            this.renderTree(this.currentFamilyId, canvas);
            this.renderMemberDetails(this.currentFamilyId, clicked.member.id);
          }
        }
      }
      this.viewState.isDragging = false;
    });

    canvas.addEventListener('mouseleave', () => {
      this.viewState.isDragging = false;
    });

    // 滚轮缩放
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.2, Math.min(3, this.viewState.scale * delta));

      // 以鼠标位置为中心缩放
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldX = (mouseX - this.viewState.offsetX) / this.viewState.scale;
      const worldY = (mouseY - this.viewState.offsetY) / this.viewState.scale;

      this.viewState.scale = newScale;
      this.viewState.offsetX = mouseX - worldX * newScale;
      this.viewState.offsetY = mouseY - worldY * newScale;

      this.renderTree(this.currentFamilyId, canvas);
    }, { passive: false });

    // 双击重置视图
    canvas.addEventListener('dblclick', () => {
      this.resetView();
      this.renderTree(this.currentFamilyId, canvas);
    });
  },

  /**
   * 点击检测
   * @param {number} x 鼠标X
   * @param {number} y 鼠标Y
   * @returns {Object|null} 点击的节点
   */
  _hitTestNode(x, y) {
    if (!this.treeLayout) return null;

    // 转换到世界坐标
    const worldX = (x - this.viewState.offsetX) / this.viewState.scale;
    const worldY = (y - this.viewState.offsetY) / this.viewState.scale;

    for (const node of this.treeLayout.nodes) {
      const dx = worldX - node.x;
      const dy = worldY - node.y;
      if (dx * dx + dy * dy <= this.NODE_RADIUS * this.NODE_RADIUS) {
        return node;
      }
    }
    return null;
  },

  /**
   * 放大
   */
  zoomIn() {
    this.viewState.scale = Math.min(3, this.viewState.scale * 1.2);
    if (this.treeCanvas) this.renderTree(this.currentFamilyId, this.treeCanvas);
  },

  /**
   * 缩小
   */
  zoomOut() {
    this.viewState.scale = Math.max(0.2, this.viewState.scale / 1.2);
    if (this.treeCanvas) this.renderTree(this.currentFamilyId, this.treeCanvas);
  },

  /**
   * 重置视图
   */
  resetView() {
    this.viewState.scale = 1;
    this.viewState.offsetX = 0;
    this.viewState.offsetY = 0;
  },

  // ===================== 家族互动 =====================

  /**
   * 联姻：两个家族通过婚姻结盟
   * @param {string} familyAId 家族A ID
   * @param {string} memberAId 成员A ID
   * @param {string} familyBId 家族B ID
   * @param {string} memberBId 成员B ID
   * @returns {Object|null} 联姻结果
   */
  formAlliance(familyAId, memberAId, familyBId, memberBId) {
    const familyA = this.getFamily(familyAId);
    const familyB = this.getFamily(familyBId);
    const memberA = this.getMember(familyAId, memberAId);
    const memberB = this.getMember(familyBId, memberBId);

    if (!familyA || !familyB || !memberA || !memberB) return null;
    if (memberA.spouse || memberB.spouse) return null; // 已有配偶

    // 建立配偶关系
    if (familyAId === familyBId) {
      this.setSpouse(familyAId, memberAId, memberBId);
    }

    // 家族间建立同盟
    if (!familyA.alliances.includes(familyBId)) {
      familyA.alliances.push(familyBId);
    }
    if (!familyB.alliances.includes(familyAId)) {
      familyB.alliances.push(familyAId);
    }

    // 移除敌对关系
    familyA.enemies = familyA.enemies.filter(id => id !== familyBId);
    familyB.enemies = familyB.enemies.filter(id => id !== familyAId);

    // 提升声望
    familyA.reputation = Math.min(100, familyA.reputation + 5);
    familyB.reputation = Math.min(100, familyB.reputation + 5);

    this.save();

    // 记录大事记
    this.addHistoryRecord(familyAId, {
      type: '联姻',
      title: '家族联姻',
      description: `${familyA.name} 的 ${memberA.name} 与 ${familyB.name} 的 ${memberB.name} 联姻`,
      relatedFamilyId: familyBId,
      importance: 'major'
    });
    if (familyAId !== familyBId) {
      this.addHistoryRecord(familyBId, {
        type: '联姻',
        title: '家族联姻',
        description: `${familyB.name} 的 ${memberB.name} 与 ${familyA.name} 的 ${memberA.name} 联姻`,
        relatedFamilyId: familyAId,
        importance: 'major'
      });
    }

    // 通知EventBridge
    this.emitEvent('alliance_formed', {
      familyAId, familyBId,
      memberAId, memberBId,
      memberAName: memberA.name,
      memberBName: memberB.name
    });

    return { familyA, familyB, memberA, memberB };
  },

  /**
   * 结仇：家族间因事件产生敌对
   * @param {string} familyAId 家族A ID
   * @param {string} familyBId 家族B ID
   * @param {string} reason 结仇原因
   * @returns {Object|null} 结仇结果
   */
  formEnmity(familyAId, familyBId, reason = '') {
    const familyA = this.getFamily(familyAId);
    const familyB = this.getFamily(familyBId);
    if (!familyA || !familyB || familyAId === familyBId) return null;

    // 建立敌对关系
    if (!familyA.enemies.includes(familyBId)) {
      familyA.enemies.push(familyBId);
    }
    if (!familyB.enemies.includes(familyAId)) {
      familyB.enemies.push(familyAId);
    }

    // 移除同盟关系
    familyA.alliances = familyA.alliances.filter(id => id !== familyBId);
    familyB.alliances = familyB.alliances.filter(id => id !== familyAId);

    // 降低声望
    familyA.reputation = Math.max(0, familyA.reputation - 3);
    familyB.reputation = Math.max(0, familyB.reputation - 3);

    this.save();

    const desc = reason || '因不明缘由结仇';
    this.addHistoryRecord(familyAId, {
      type: '结仇',
      title: '家族结仇',
      description: `${familyA.name} 与 ${familyB.name} ${desc}`,
      relatedFamilyId: familyBId,
      importance: 'major'
    });
    this.addHistoryRecord(familyBId, {
      type: '结仇',
      title: '家族结仇',
      description: `${familyB.name} 与 ${familyA.name} ${desc}`,
      relatedFamilyId: familyAId,
      importance: 'major'
    });

    this.emitEvent('enmity_formed', { familyAId, familyBId, reason });
    return { familyA, familyB };
  },

  /**
   * 吞并：强家族吞并弱家族
   * @param {string} strongFamilyId 强家族ID
   * @param {string} weakFamilyId 弱家族ID
   * @returns {Object|null} 吞并结果
   */
  annexFamily(strongFamilyId, weakFamilyId) {
    const strong = this.getFamily(strongFamilyId);
    const weak = this.getFamily(weakFamilyId);
    if (!strong || !weak || strongFamilyId === weakFamilyId) return null;

    // 条件判断：强家族声望必须高于弱家族20点以上
    if (strong.reputation <= weak.reputation + 20) return null;

    // 转移成员
    weak.members.forEach(m => {
      m.position = m.position === '家主' ? '长老' : '门客';
      strong.members.push(m);
    });

    // 转移资源
    strong.wealth += weak.wealth;
    strong.reputation = Math.min(100, strong.reputation + 10);

    // 继承同盟与敌对
    weak.alliances.forEach(id => {
      if (!strong.alliances.includes(id) && id !== strongFamilyId) {
        strong.alliances.push(id);
      }
    });

    // 记录历史
    this.addHistoryRecord(strongFamilyId, {
      type: '吞并',
      title: '家族吞并',
      description: `${strong.name} 吞并了 ${weak.name}，收编 ${weak.members.length} 名成员`,
      relatedFamilyId: weakFamilyId,
      importance: 'major'
    });

    // 删除被吞并的家族
    this.deleteFamily(weakFamilyId);

    this.emitEvent('family_annexed', { strongFamilyId, weakFamilyId, weakFamilyName: weak.name });
    return { strong, weak };
  },

  /**
   * 分家：大家族分裂为多个小家族
   * @param {string} familyId 原家族ID
   * @param {Array<Object>} splits 分裂配置 [{leaderId, memberIds, newName}]
   * @returns {Array<Object>} 新家族列表
   */
  splitFamily(familyId, splits) {
    const original = this.getFamily(familyId);
    if (!original || !splits || splits.length === 0) return [];

    const newFamilies = [];

    splits.forEach(split => {
      const leader = this.getMember(familyId, split.leaderId);
      if (!leader) return;

      const newFamily = this.createFamily({
        name: split.newName || `${leader.name}分支`,
        type: original.type,
        founder: leader.name,
        head: leader.id,
        heir: split.heirId || leader.id,
        reputation: Math.floor(original.reputation * 0.6),
        wealth: Math.floor(original.wealth / splits.length),
        territory: original.territory,
        inheritanceRule: original.inheritanceRule
      });

      // 转移指定成员
      (split.memberIds || []).forEach(mid => {
        const member = this.getMember(familyId, mid);
        if (member) {
          // 从原家族移除
          const idx = original.members.findIndex(m => m.id === mid);
          if (idx !== -1) original.members.splice(idx, 1);
          // 添加到新家族
          newFamily.members.push({ ...member });
        }
      });

      // 建立同盟关系
      if (!newFamily.alliances.includes(familyId)) {
        newFamily.alliances.push(familyId);
      }
      if (!original.alliances.includes(newFamily.id)) {
        original.alliances.push(newFamily.id);
      }

      newFamilies.push(newFamily);

      this.addHistoryRecord(newFamily.id, {
        type: '分家',
        title: '家族分家',
        description: `${newFamily.name} 从 ${original.name} 分出`,
        relatedFamilyId: familyId,
        importance: 'major'
      });
    });

    this.addHistoryRecord(familyId, {
      type: '分家',
      title: '家族分家',
      description: `${original.name} 分裂为 ${splits.length} 支`,
      importance: 'major'
    });

    this.save();
    this.emitEvent('family_split', { originalFamilyId: familyId, newFamilyIds: newFamilies.map(f => f.id) });
    return newFamilies;
  },

  // ===================== 继承系统 =====================

  /**
   * 触发继承流程
   * @param {string} familyId 家族ID
   * @returns {Object|null} 继承结果
   */
  triggerInheritance(familyId) {
    const family = this.getFamily(familyId);
    if (!family) return null;

    const rule = family.inheritanceRule || '长子继承';
    let heir = null;

    switch (rule) {
      case '长子继承':
        heir = this._findEldestSon(familyId);
        break;
      case '立贤':
        heir = this._findMostCapable(familyId);
        break;
      case '指定':
        heir = family.heir ? this.getMember(familyId, family.heir) : null;
        break;
      case '争斗':
        return this._resolveInheritanceByContest(familyId);
      default:
        heir = this._findEldestSon(familyId);
    }

    if (heir && heir.status === '在世') {
      // 变更家主
      const oldHead = family.head;
      family.head = heir.id;
      heir.position = '家主';

      // 原家主降级
      if (oldHead) {
        const old = this.getMember(familyId, oldHead);
        if (old && old.status === '已故') {
          // 已故无需处理
        } else if (old) {
          old.position = '长老';
        }
      }

      this.save();

      this.addHistoryRecord(familyId, {
        type: '继承',
        title: '家主继承',
        description: `${heir.name} 继承 ${family.name} 家主之位`,
        memberId: heir.id,
        importance: 'major'
      });

      this.emitEvent('inheritance_completed', { familyId, newHeadId: heir.id, rule });
      return { success: true, newHead: heir, rule };
    }

    // 继承失败，可能触发家族内战
    this.addHistoryRecord(familyId, {
      type: '继承失败',
      title: '继承危机',
      description: `${family.name} 家主之位空缺，无人继承`,
      importance: 'major'
    });

    this.emitEvent('inheritance_failed', { familyId, rule });
    return { success: false, rule, reason: '无合适继承人' };
  },

  /**
   * 查找长子
   * @param {string} familyId 家族ID
   * @returns {Object|null} 长子成员
   */
  _findEldestSon(familyId) {
    const family = this.getFamily(familyId);
    if (!family) return null;
    const sons = family.members.filter(m =>
      m.gender === '男' && m.status === '在世' && m.position !== '家主'
    );
    return sons.sort((a, b) => (a.birthDate || '') > (b.birthDate || '') ? 1 : -1)[0] || null;
  },

  /**
   * 查找最贤能者（声望+实力综合）
   * @param {string} familyId 家族ID
   * @returns {Object|null} 最贤能成员
   */
  _findMostCapable(familyId) {
    const family = this.getFamily(familyId);
    if (!family) return null;
    const candidates = family.members.filter(m =>
      m.status === '在世' && m.position !== '家主'
    );
    return candidates.sort((a, b) => {
      const scoreA = (a.reputation || 0) + (a.power || 0);
      const scoreB = (b.reputation || 0) + (b.power || 0);
      return scoreB - scoreA;
    })[0] || null;
  },

  /**
   * 争斗继承（模拟内战）
   * @param {string} familyId 家族ID
   * @returns {Object|null} 争斗结果
   */
  _resolveInheritanceByContest(familyId) {
    const family = this.getFamily(familyId);
    if (!family) return null;
    const candidates = family.members.filter(m =>
      m.status === '在世' && m.position !== '家主' && (m.power || 0) > 20
    );

    if (candidates.length === 0) {
      return this.triggerInheritance(familyId); //  fallback to eldest
    }

    // 模拟争斗：实力+随机因素
    const results = candidates.map(c => ({
      member: c,
      score: (c.power || 0) + Math.random() * 50
    })).sort((a, b) => b.score - a.score);

    const winner = results[0].member;
    const losers = results.slice(1).map(r => r.member);

    // 失败者可能受伤或死亡
    losers.forEach(l => {
      if (Math.random() < 0.3) {
        this.changeMemberStatus(familyId, l.id, '已故');
      }
    });

    family.head = winner.id;
    winner.position = '家主';
    this.save();

    this.addHistoryRecord(familyId, {
      type: '继承',
      title: '家主争斗',
      description: `${winner.name} 在继承争斗中胜出，成为新家主`,
      memberId: winner.id,
      importance: 'major'
    });

    this.emitEvent('inheritance_contest', {
      familyId, winnerId: winner.id, loserIds: losers.map(l => l.id)
    });

    return { success: true, newHead: winner, losers, rule: '争斗' };
  },

  // ===================== 家族大事记 =====================

  /**
   * 获取大事记（支持筛选）
   * @param {string} familyId 家族ID
   * @param {Object} filter 筛选条件
   * @returns {Array<Object>} 大事记列表
   */
  getHistoryRecords(familyId, filter = {}) {
    let records = this.getHistory(familyId);

    if (filter.type && filter.type !== 'all') {
      records = records.filter(r => r.type === filter.type);
    }
    if (filter.importance) {
      records = records.filter(r => r.importance === filter.importance);
    }
    if (filter.startTime) {
      records = records.filter(r => r.timestamp >= filter.startTime);
    }
    if (filter.endTime) {
      records = records.filter(r => r.timestamp <= filter.endTime);
    }

    // 按时间倒序
    return records.sort((a, b) => b.timestamp - a.timestamp);
  },

  /**
   * 获取大事记统计
   * @param {string} familyId 家族ID
   * @returns {Object} 统计数据
   */
  getHistoryStats(familyId) {
    const records = this.getHistory(familyId);
    const stats = {
      total: records.length,
      byType: {},
      byImportance: { major: 0, normal: 0, minor: 0 }
    };
    records.forEach(r => {
      stats.byType[r.type] = (stats.byType[r.type] || 0) + 1;
      stats.byImportance[r.importance || 'normal']++;
    });
    return stats;
  },

  // ===================== 搜索与虚拟滚动 =====================

  /**
   * 搜索成员（跨家族）
   * @param {string} query 搜索关键词
   * @param {Object} options 搜索选项
   * @returns {Array<Object>} 搜索结果 [{familyId, member}]
   */
  searchMembers(query, options = {}) {
    if (!query) return [];
    const q = query.toLowerCase();
    const results = [];

    const families = options.familyId ?
      [this.getFamily(options.familyId)].filter(Boolean) :
      this.families;

    families.forEach(family => {
      family.members.forEach(m => {
        let match = m.name.toLowerCase().includes(q);
        if (!match && options.includeTraits) {
          match = m.traits.some(t => t.toLowerCase().includes(q));
        }
        if (!match && options.includeBiography && m.biography) {
          match = m.biography.toLowerCase().includes(q);
        }
        if (!match && options.includePosition) {
          match = m.position.toLowerCase().includes(q);
        }
        if (match) {
          results.push({ familyId: family.id, familyName: family.name, member: m });
        }
      });
    });

    return results;
  },

  /**
   * 搜索家族
   * @param {string} query 搜索关键词
   * @returns {Array<Object>} 家族列表
   */
  searchFamilies(query) {
    if (!query) return this.families;
    const q = query.toLowerCase();
    return this.families.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.type.toLowerCase().includes(q) ||
      f.territory.toLowerCase().includes(q)
    );
  },

  /**
   * 获取分页成员列表
   * @param {string} familyId 家族ID
   * @param {number} page 页码
   * @param {Object} filter 过滤条件
   * @returns {Object} {members, total, hasMore}
   */
  getMembersPage(familyId, page = 0, filter = {}) {
    const family = this.getFamily(familyId);
    if (!family) return { members: [], total: 0, hasMore: false };

    let members = [...family.members];

    // 过滤
    if (filter.status && filter.status !== 'all') {
      members = members.filter(m => m.status === filter.status);
    }
    if (filter.position && filter.position !== 'all') {
      members = members.filter(m => m.position === filter.position);
    }
    if (filter.generation) {
      members = members.filter(m => m.generation === filter.generation);
    }

    const total = members.length;
    const start = page * this.PAGE_SIZE;
    const end = start + this.PAGE_SIZE;

    return {
      members: members.slice(start, end),
      total,
      hasMore: end < total,
      page,
      pageSize: this.PAGE_SIZE
    };
  },

  // ===================== 声望与影响力 =====================

  /**
   * 更新家族声望
   * @param {string} familyId 家族ID
   * @param {number} delta 变化值
   * @param {string} reason 原因
   * @returns {number} 更新后的声望
   */
  updateReputation(familyId, delta, reason = '') {
    const family = this.getFamily(familyId);
    if (!family) return 0;
    family.reputation = Math.max(0, Math.min(100, family.reputation + delta));
    this.save();
    if (reason) {
      this.addHistoryRecord(familyId, {
        type: '声望变化',
        title: delta > 0 ? '声望提升' : '声望下降',
        description: `${family.name} 声望 ${delta > 0 ? '+' : ''}${delta}：${reason}`,
        importance: Math.abs(delta) >= 10 ? 'major' : 'normal'
      });
    }
    this.emitEvent('reputation_changed', { familyId, delta, newValue: family.reputation });
    return family.reputation;
  },

  /**
   * 更新家族财富
   * @param {string} familyId 家族ID
   * @param {number} delta 变化值
   * @returns {number} 更新后的财富
   */
  updateWealth(familyId, delta) {
    const family = this.getFamily(familyId);
    if (!family) return 0;
    family.wealth = Math.max(0, family.wealth + delta);
    this.save();
    this.emitEvent('wealth_changed', { familyId, delta, newValue: family.wealth });
    return family.wealth;
  },

  /**
   * 获取家族综合实力评分
   * @param {string} familyId 家族ID
   * @returns {number} 综合评分 0-100
   */
  getFamilyPower(familyId) {
    const family = this.getFamily(familyId);
    if (!family) return 0;
    const memberPower = family.members.reduce((sum, m) => sum + (m.power || 0), 0);
    const avgPower = family.members.length > 0 ? memberPower / family.members.length : 0;
    return Math.min(100, Math.round(
      family.reputation * 0.3 +
      Math.min(family.wealth / 50, 30) +
      avgPower * 0.2 +
      family.members.length * 0.5
    ));
  },

  // ===================== UI渲染 =====================

  /**
   * 渲染家族系统完整界面
   * @param {HTMLElement} container 容器元素
   */
  render(container) {
    if (!container) return;
    container.innerHTML = '';
    container.style.cssText = `
      display: flex; flex-direction: column; height: 100vh;
      background: ${this.COLORS.parchment}; color: ${this.COLORS.ink};
      font-family: "Noto Serif SC", "SimSun", serif;
    `;

    // 顶部操作栏
    const topBar = this._createTopBar();
    container.appendChild(topBar);

    // 主体三栏布局
    const mainArea = document.createElement('div');
    mainArea.style.cssText = 'display: flex; flex: 1; overflow: hidden;';

    // 左侧：家族列表
    const leftPanel = this._createLeftPanel();
    leftPanel.style.cssText = `width: 280px; min-width: 240px; max-width: 350px;
      border-right: 1px solid ${this.COLORS.gold}; overflow-y: auto;
      background: rgba(245,230,211,0.5); padding: 12px;`;
    mainArea.appendChild(leftPanel);

    // 中间：家族树Canvas
    const centerPanel = document.createElement('div');
    centerPanel.style.cssText = 'flex: 1; position: relative; overflow: hidden;';
    const canvas = document.createElement('canvas');
    canvas.id = 'family-tree-canvas';
    canvas.style.cssText = 'width: 100%; height: 100%; display: block; cursor: grab;';
    centerPanel.appendChild(canvas);
    mainArea.appendChild(centerPanel);

    // 右侧：成员详情
    const rightPanel = this._createRightPanel();
    rightPanel.style.cssText = `width: 300px; min-width: 260px; max-width: 400px;
      border-left: 1px solid ${this.COLORS.gold}; overflow-y: auto;
      background: rgba(245,230,211,0.5); padding: 16px;`;
    mainArea.appendChild(rightPanel);

    container.appendChild(mainArea);

    // 底部：大事记时间轴
    const bottomPanel = this._createBottomPanel();
    bottomPanel.style.cssText = `height: 160px; min-height: 120px; max-height: 200px;
      border-top: 1px solid ${this.COLORS.gold}; overflow-y: auto;
      background: rgba(245,230,211,0.7); padding: 12px 16px;`;
    container.appendChild(bottomPanel);

    // 绑定Canvas事件
    this.bindCanvasEvents(canvas);

    // 初始渲染
    if (this.currentFamilyId) {
      this.renderTree(this.currentFamilyId, canvas);
      this.renderFamilyList();
      this.renderMemberDetails(this.currentFamilyId, this.selectedMemberId);
      this.renderHistory(this.currentFamilyId);
    } else if (this.families.length > 0) {
      this.selectFamily(this.families[0].id);
    }
  },

  /**
   * 创建顶部操作栏
   * @returns {HTMLElement} 顶部栏元素
   */
  _createTopBar() {
    const bar = document.createElement('div');
    bar.style.cssText = `
      display: flex; align-items: center; gap: 10px; padding: 10px 16px;
      border-bottom: 2px solid ${this.COLORS.gold};
      background: linear-gradient(to right, ${this.COLORS.parchment}, rgba(201,162,39,0.1));
    `;

    const title = document.createElement('span');
    title.textContent = '家族谱系';
    title.style.cssText = `font-size: 18px; font-weight: bold; color: ${this.COLORS.ink}; margin-right: 16px;`;
    bar.appendChild(title);

    const buttons = [
      { text: '创建家族', action: () => this.showCreateFamilyDialog() },
      { text: '添加成员', action: () => this.showAddMemberDialog() },
      { text: '联姻', action: () => this.showAllianceDialog() },
      { text: '结仇', action: () => this.showEnmityDialog() },
      { text: '查看大事记', action: () => this.toggleHistoryPanel() },
      { text: '搜索', action: () => this.focusSearch() }
    ];

    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.textContent = btn.text;
      button.style.cssText = `
        padding: 6px 14px; border: 1px solid ${this.COLORS.gold};
        background: ${this.COLORS.white}; color: ${this.COLORS.ink};
        border-radius: 4px; cursor: pointer; font-family: inherit;
        transition: all 0.2s;
      `;
      button.onmouseenter = () => {
        button.style.background = this.COLORS.gold;
        button.style.color = this.COLORS.white;
      };
      button.onmouseleave = () => {
        button.style.background = this.COLORS.white;
        button.style.color = this.COLORS.ink;
      };
      button.onclick = btn.action;
      bar.appendChild(button);
    });

    // 搜索框
    const searchBox = document.createElement('input');
    searchBox.type = 'text';
    searchBox.id = 'family-search-input';
    searchBox.placeholder = '搜索家族或成员...';
    searchBox.style.cssText = `
      margin-left: auto; padding: 6px 12px; width: 200px;
      border: 1px solid ${this.COLORS.gold}; border-radius: 4px;
      background: ${this.COLORS.white}; color: ${this.COLORS.ink};
      font-family: inherit;
    `;
    searchBox.oninput = (e) => {
      this.uiState.searchQuery = e.target.value;
      this.renderFamilyList();
    };
    bar.appendChild(searchBox);

    return bar;
  },

  /**
   * 创建左侧面板（家族列表）
   * @returns {HTMLElement} 左侧面板
   */
  _createLeftPanel() {
    const panel = document.createElement('div');
    panel.id = 'family-list-panel';
    return panel;
  },

  /**
   * 渲染家族列表
   */
  renderFamilyList() {
    const panel = document.getElementById('family-list-panel');
    if (!panel) return;
    panel.innerHTML = '';

    // 过滤栏
    const filterBar = document.createElement('div');
    filterBar.style.cssText = 'margin-bottom: 12px; display: flex; gap: 8px; flex-wrap: wrap;';

    const worldview = this.getCurrentWorldview();
    const types = this.FAMILY_TYPES[worldview] || this.FAMILY_TYPES.default;
    const typeSelect = document.createElement('select');
    typeSelect.style.cssText = `
      padding: 4px 8px; border: 1px solid ${this.COLORS.gold}; border-radius: 4px;
      background: ${this.COLORS.white}; font-family: inherit; font-size: 12px;
    `;
    typeSelect.innerHTML = '<option value="all">全部类型</option>' +
      types.map(t => `<option value="${t}">${t}</option>`).join('');
    typeSelect.value = this.uiState.filterType;
    typeSelect.onchange = (e) => {
      this.uiState.filterType = e.target.value;
      this.renderFamilyList();
    };
    filterBar.appendChild(typeSelect);

    const deceasedToggle = document.createElement('label');
    deceasedToggle.style.cssText = 'display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer;';
    deceasedToggle.innerHTML = `
      <input type="checkbox" ${this.uiState.showDeceased ? 'checked' : ''}>
      <span>显示已故</span>
    `;
    deceasedToggle.querySelector('input').onchange = (e) => {
      this.uiState.showDeceased = e.target.checked;
      this.renderFamilyList();
      if (this.currentFamilyId) {
        const canvas = document.getElementById('family-tree-canvas');
        if (canvas) this.renderTree(this.currentFamilyId, canvas);
      }
    };
    filterBar.appendChild(deceasedToggle);

    panel.appendChild(filterBar);

    // 家族卡片列表
    const families = this.getFamilies({
      type: this.uiState.filterType,
      search: this.uiState.searchQuery
    });

    if (families.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = '暂无家族，点击上方"创建家族"开始';
      empty.style.cssText = `text-align: center; padding: 40px 20px; color: ${this.COLORS.inkMuted}; font-size: 14px;`;
      panel.appendChild(empty);
      return;
    }

    families.forEach(family => {
      const card = document.createElement('div');
      const isActive = this.currentFamilyId === family.id;
      card.style.cssText = `
        padding: 12px; margin-bottom: 8px; border-radius: 6px;
        border: 1px solid ${isActive ? this.COLORS.gold : 'rgba(201,162,39,0.3)'};
        background: ${isActive ? 'rgba(201,162,39,0.15)' : this.COLORS.white};
        cursor: pointer; transition: all 0.2s;
      `;
      card.onmouseenter = () => { card.style.borderColor = this.COLORS.gold; };
      card.onmouseleave = () => { card.style.borderColor = isActive ? this.COLORS.gold : 'rgba(201,162,39,0.3)'; };
      card.onclick = () => this.selectFamily(family.id);

      const header = document.createElement('div');
      header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;';
      const name = document.createElement('span');
      name.textContent = family.name;
      name.style.cssText = `font-weight: bold; font-size: 15px; color: ${this.COLORS.ink};`;
      const type = document.createElement('span');
      type.textContent = family.type;
      type.style.cssText = `
        font-size: 11px; padding: 2px 8px; border-radius: 10px;
        background: ${this.COLORS.gold}; color: ${this.COLORS.white};
      `;
      header.appendChild(name);
      header.appendChild(type);
      card.appendChild(header);

      const stats = document.createElement('div');
      stats.style.cssText = `
        display: flex; gap: 12px; font-size: 12px; color: ${this.COLORS.inkMuted};
      `;
      const memberCount = family.members.filter(m => this.uiState.showDeceased || m.status !== '已故').length;
      stats.innerHTML = `
        <span>成员 ${memberCount}</span>
        <span>声望 ${family.reputation}</span>
        <span>财富 ${family.wealth}</span>
      `;
      card.appendChild(stats);

      const headName = this._getMemberName(family.id, family.head);
      if (headName) {
        const headInfo = document.createElement('div');
        headInfo.textContent = '家主: ' + headName;
        headInfo.style.cssText = `font-size: 12px; margin-top: 4px; color: ${this.COLORS.inkLight};`;
        card.appendChild(headInfo);
      }

      // 快捷操作
      const actions = document.createElement('div');
      actions.style.cssText = 'display: flex; gap: 6px; margin-top: 8px;';
      const editBtn = document.createElement('button');
      editBtn.textContent = '编辑';
      editBtn.style.cssText = this._getSmallBtnStyle();
      editBtn.onclick = (e) => { e.stopPropagation(); this.showEditFamilyDialog(family.id); };
      actions.appendChild(editBtn);

      const delBtn = document.createElement('button');
      delBtn.textContent = '删除';
      delBtn.style.cssText = this._getSmallBtnStyle(this.COLORS.crimson);
      delBtn.onclick = (e) => { e.stopPropagation(); this.confirmDeleteFamily(family.id); };
      actions.appendChild(delBtn);

      card.appendChild(actions);
      panel.appendChild(card);
    });
  },

  /**
   * 创建右侧面板（成员详情）
   * @returns {HTMLElement} 右侧面板
   */
  _createRightPanel() {
    const panel = document.createElement('div');
    panel.id = 'member-detail-panel';
    return panel;
  },

  /**
   * 渲染成员详情
   * @param {string} familyId 家族ID
   * @param {string} memberId 成员ID
   */
  renderMemberDetails(familyId, memberId) {
    const panel = document.getElementById('member-detail-panel');
    if (!panel) return;
    panel.innerHTML = '';

    if (!memberId) {
      panel.innerHTML = `<div style="text-align: center; padding: 40px 20px; color: ${this.COLORS.inkMuted};">
        点击家族树中的节点查看成员详情
      </div>`;
      return;
    }

    const member = this.getMember(familyId, memberId);
    if (!member) return;

    // 头像区域
    const avatarSection = document.createElement('div');
    avatarSection.style.cssText = 'text-align: center; margin-bottom: 16px;';
    const avatar = document.createElement('div');
    avatar.style.cssText = `
      width: 80px; height: 80px; border-radius: 50%;
      background: ${this.COLORS.white}; border: 3px solid ${this.COLORS.gold};
      margin: 0 auto; display: flex; align-items: center; justify-content: center;
      font-size: 32px; color: ${this.COLORS.ink};
    `;
    avatar.textContent = member.name.charAt(0);
    avatarSection.appendChild(avatar);
    panel.appendChild(avatarSection);

    // 基本信息
    const info = document.createElement('div');
    info.style.cssText = 'margin-bottom: 16px;';
    const fields = [
      { label: '姓名', value: member.name },
      { label: '性别', value: member.gender },
      { label: '辈分', value: `第${member.generation}代` },
      { label: '职位', value: member.position },
      { label: '状态', value: member.status, color: member.status === '已故' ? this.COLORS.gray : this.COLORS.jade },
      { label: '生年', value: member.birthDate },
      { label: '卒年', value: member.deathDate || '-' },
      { label: '声望', value: member.reputation || 0 },
      { label: '实力', value: member.power || 0 }
    ];
    fields.forEach(f => {
      const row = document.createElement('div');
      row.style.cssText = `
        display: flex; justify-content: space-between; padding: 6px 0;
        border-bottom: 1px solid rgba(201,162,39,0.2); font-size: 13px;
      `;
      row.innerHTML = `<span style="color: ${this.COLORS.inkMuted};">${f.label}</span>
        <span style="color: ${f.color || this.COLORS.ink}; font-weight: ${f.label === '姓名' ? 'bold' : 'normal'};">${f.value}</span>`;
      info.appendChild(row);
    });
    panel.appendChild(info);

    // 关系
    if (member.parents.length > 0 || member.children.length > 0 || member.spouse) {
      const relationSection = document.createElement('div');
      relationSection.style.cssText = 'margin-bottom: 16px;';
      const relTitle = document.createElement('div');
      relTitle.textContent = '人际关系';
      relTitle.style.cssText = `font-weight: bold; margin-bottom: 8px; color: ${this.COLORS.gold};`;
      relationSection.appendChild(relTitle);

      const rels = [];
      member.parents.forEach(pid => {
        const p = this.getMember(familyId, pid);
        if (p) rels.push({ type: '父母', name: p.name, status: p.status });
      });
      member.children.forEach(cid => {
        const c = this.getMember(familyId, cid);
        if (c) rels.push({ type: '子女', name: c.name, status: c.status });
      });
      if (member.spouse) {
        const s = this.getMember(familyId, member.spouse);
        if (s) rels.push({ type: '配偶', name: s.name, status: s.status });
      }

      rels.forEach(r => {
        const row = document.createElement('div');
        row.style.cssText = `
          display: flex; justify-content: space-between; padding: 4px 0;
          font-size: 12px; color: ${r.status === '已故' ? this.COLORS.gray : this.COLORS.ink};
        `;
        row.innerHTML = `<span>${r.type}: ${r.name}</span><span>${r.status}</span>`;
        relationSection.appendChild(row);
      });
      panel.appendChild(relationSection);
    }

    // 特质
    if (member.traits && member.traits.length > 0) {
      const traitSection = document.createElement('div');
      traitSection.style.cssText = 'margin-bottom: 16px;';
      const traitTitle = document.createElement('div');
      traitTitle.textContent = '特质';
      traitTitle.style.cssText = `font-weight: bold; margin-bottom: 8px; color: ${this.COLORS.gold};`;
      traitSection.appendChild(traitTitle);

      member.traits.forEach(t => {
        const tag = document.createElement('span');
        tag.textContent = t;
        tag.style.cssText = `
          display: inline-block; padding: 2px 8px; margin: 2px;
          border: 1px solid ${this.COLORS.gold}; border-radius: 12px;
          font-size: 11px; color: ${this.COLORS.ink};
        `;
        traitSection.appendChild(tag);
      });
      panel.appendChild(traitSection);
    }

    // 传记
    if (member.biography) {
      const bioSection = document.createElement('div');
      bioSection.style.cssText = 'margin-bottom: 16px;';
      const bioTitle = document.createElement('div');
      bioTitle.textContent = '传记';
      bioTitle.style.cssText = `font-weight: bold; margin-bottom: 8px; color: ${this.COLORS.gold};`;
      bioSection.appendChild(bioTitle);
      const bioText = document.createElement('div');
      bioText.textContent = member.biography;
      bioText.style.cssText = `font-size: 12px; line-height: 1.6; color: ${this.COLORS.inkLight};`;
      bioSection.appendChild(bioText);
      panel.appendChild(bioSection);
    }

    // 操作按钮
    const actions = document.createElement('div');
    actions.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap;';
    const actionButtons = [
      { text: '设为家主', action: () => this.setFamilyHead(familyId, memberId), show: member.status === '在世' },
      { text: '设为继承人', action: () => this.setFamilyHeir(familyId, memberId), show: member.status === '在世' },
      { text: '编辑', action: () => this.showEditMemberDialog(familyId, memberId) },
      { text: '删除', action: () => this.confirmDeleteMember(familyId, memberId), color: this.COLORS.crimson }
    ];
    actionButtons.forEach(btn => {
      if (btn.show === false) return;
      const button = document.createElement('button');
      button.textContent = btn.text;
      button.style.cssText = this._getSmallBtnStyle(btn.color);
      button.onclick = btn.action;
      actions.appendChild(button);
    });
    panel.appendChild(actions);
  },

  /**
   * 创建底部面板（大事记）
   * @returns {HTMLElement} 底部面板
   */
  _createBottomPanel() {
    const panel = document.createElement('div');
    panel.id = 'family-history-panel';
    return panel;
  },

  /**
   * 渲染大事记
   * @param {string} familyId 家族ID
   */
  renderHistory(familyId) {
    const panel = document.getElementById('family-history-panel');
    if (!panel) return;
    panel.innerHTML = '';

    const history = this.getHistoryRecords(familyId, { type: 'all' });
    const stats = this.getHistoryStats(familyId);

    // 标题和统计
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;';
    const title = document.createElement('span');
    title.textContent = `家族大事记 (${stats.total})`;
    title.style.cssText = `font-weight: bold; color: ${this.COLORS.gold};`;
    header.appendChild(title);

    const filterSelect = document.createElement('select');
    filterSelect.style.cssText = `
      padding: 2px 8px; border: 1px solid ${this.COLORS.gold}; border-radius: 4px;
      background: ${this.COLORS.white}; font-size: 12px; font-family: inherit;
    `;
    const types = ['all', '家族建立', '成员诞生', '成员死亡', '联姻', '结仇', '吞并', '分家', '继承', '声望变化'];
    filterSelect.innerHTML = types.map(t => `<option value="${t}">${t === 'all' ? '全部' : t}</option>`).join('');
    filterSelect.onchange = (e) => {
      this.renderHistoryFiltered(familyId, e.target.value);
    };
    header.appendChild(filterSelect);
    panel.appendChild(header);

    // 时间轴
    const timeline = document.createElement('div');
    timeline.style.cssText = 'display: flex; gap: 12px; overflow-x: auto; padding: 4px;';

    history.slice(0, 50).forEach(record => {
      const item = document.createElement('div');
      item.style.cssText = `
        min-width: 180px; padding: 10px 12px; border-radius: 6px;
        border-left: 3px solid ${this._getImportanceColor(record.importance)};
        background: ${this.COLORS.white}; flex-shrink: 0;
      `;

      const date = document.createElement('div');
      date.textContent = this._formatTimestamp(record.timestamp);
      date.style.cssText = `font-size: 11px; color: ${this.COLORS.inkMuted}; margin-bottom: 4px;`;
      item.appendChild(date);

      const type = document.createElement('div');
      type.textContent = record.type;
      type.style.cssText = `
        font-size: 12px; font-weight: bold; color: ${this._getImportanceColor(record.importance)};
        margin-bottom: 2px;
      `;
      item.appendChild(type);

      const desc = document.createElement('div');
      desc.textContent = record.description;
      desc.style.cssText = `font-size: 11px; color: ${this.COLORS.inkLight}; line-height: 1.4;`;
      item.appendChild(desc);

      timeline.appendChild(item);
    });

    panel.appendChild(timeline);
  },

  /**
   * 渲染过滤后的大事记
   * @param {string} familyId 家族ID
   * @param {string} type 类型过滤
   */
  renderHistoryFiltered(familyId, type) {
    const panel = document.getElementById('family-history-panel');
    if (!panel) return;
    // 重新渲染（简单实现：清空后重绘）
    const history = this.getHistoryRecords(familyId, { type });
    // 保留标题，重绘内容
    const timeline = panel.querySelector('div:last-child');
    if (timeline) timeline.remove();
    this._renderHistoryTimeline(panel, history);
  },

  /**
   * 渲染时间轴内容
   * @param {HTMLElement} container 容器
   * @param {Array<Object>} history 大事记列表
   */
  _renderHistoryTimeline(container, history) {
    const timeline = document.createElement('div');
    timeline.style.cssText = 'display: flex; gap: 12px; overflow-x: auto; padding: 4px;';
    history.slice(0, 50).forEach(record => {
      const item = document.createElement('div');
      item.style.cssText = `
        min-width: 180px; padding: 10px 12px; border-radius: 6px;
        border-left: 3px solid ${this._getImportanceColor(record.importance)};
        background: ${this.COLORS.white}; flex-shrink: 0;
      `;
      item.innerHTML = `
        <div style="font-size: 11px; color: ${this.COLORS.inkMuted};">${this._formatTimestamp(record.timestamp)}</div>
        <div style="font-size: 12px; font-weight: bold; color: ${this._getImportanceColor(record.importance)};">${record.type}</div>
        <div style="font-size: 11px; color: ${this.COLORS.inkLight}; line-height: 1.4;">${record.description}</div>
      `;
      timeline.appendChild(item);
    });
    container.appendChild(timeline);
  },

  /**
   * 获取重要度颜色
   * @param {string} importance 重要度
   * @returns {string} 颜色
   */
  _getImportanceColor(importance) {
    switch (importance) {
      case 'major': return this.COLORS.crimson;
      case 'minor': return this.COLORS.inkMuted;
      default: return this.COLORS.gold;
    }
  },

  // ===================== 交互方法 =====================

  /**
   * 选择家族
   * @param {string} familyId 家族ID
   */
  selectFamily(familyId) {
    this.currentFamilyId = familyId;
    this.selectedMemberId = null;
    this.resetView();
    this.renderFamilyList();
    const canvas = document.getElementById('family-tree-canvas');
    if (canvas) this.renderTree(familyId, canvas);
    this.renderMemberDetails(familyId, null);
    this.renderHistory(familyId);
  },

  /**
   * 设置家族家主
   * @param {string} familyId 家族ID
   * @param {string} memberId 成员ID
   */
  setFamilyHead(familyId, memberId) {
    const family = this.getFamily(familyId);
    const member = this.getMember(familyId, memberId);
    if (!family || !member || member.status !== '在世') return;

    const oldHead = family.head;
    family.head = memberId;
    member.position = '家主';

    if (oldHead) {
      const old = this.getMember(familyId, oldHead);
      if (old) old.position = '长老';
    }

    this.save();
    this.addHistoryRecord(familyId, {
      type: '继承',
      title: '家主更替',
      description: `${member.name} 成为新家主`,
      memberId,
      importance: 'major'
    });

    this.renderMemberDetails(familyId, memberId);
    this.renderFamilyList();
    const canvas = document.getElementById('family-tree-canvas');
    if (canvas) this.renderTree(familyId, canvas);
  },

  /**
   * 设置家族继承人
   * @param {string} familyId 家族ID
   * @param {string} memberId 成员ID
   */
  setFamilyHeir(familyId, memberId) {
    const family = this.getFamily(familyId);
    const member = this.getMember(familyId, memberId);
    if (!family || !member || member.status !== '在世') return;
    family.heir = memberId;
    this.save();
    this.emitEvent('heir_set', { familyId, memberId });
    this.renderMemberDetails(familyId, memberId);
  },

  /**
   * 聚焦搜索框
   */
  focusSearch() {
    const input = document.getElementById('family-search-input');
    if (input) input.focus();
  },

  /**
   * 切换大事记面板显隐
   */
  toggleHistoryPanel() {
    const panel = document.getElementById('family-history-panel');
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
  },

  // ===================== 对话框 =====================

  /**
   * 显示创建家族对话框
   */
  showCreateFamilyDialog() {
    const worldview = this.getCurrentWorldview();
    const types = this.FAMILY_TYPES[worldview] || this.FAMILY_TYPES.default;
    const typeOptions = types.map(t => `<option value="${t}">${t}</option>`).join('');

    this._showDialog('创建家族', `
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; color: ${this.COLORS.inkMuted};">家族名称</label>
        <input id="dialog-family-name" type="text" style="width: 100%; padding: 8px; border: 1px solid ${this.COLORS.gold}; border-radius: 4px; background: ${this.COLORS.white}; font-family: inherit;">
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; color: ${this.COLORS.inkMuted};">家族类型</label>
        <select id="dialog-family-type" style="width: 100%; padding: 8px; border: 1px solid ${this.COLORS.gold}; border-radius: 4px; background: ${this.COLORS.white}; font-family: inherit;">
          ${typeOptions}
        </select>
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; color: ${this.COLORS.inkMuted};">创始人</label>
        <input id="dialog-family-founder" type="text" style="width: 100%; padding: 8px; border: 1px solid ${this.COLORS.gold}; border-radius: 4px; background: ${this.COLORS.white}; font-family: inherit;">
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; color: ${this.COLORS.inkMuted};">领地</label>
        <input id="dialog-family-territory" type="text" style="width: 100%; padding: 8px; border: 1px solid ${this.COLORS.gold}; border-radius: 4px; background: ${this.COLORS.white}; font-family: inherit;">
      </div>
    `, () => {
      const name = document.getElementById('dialog-family-name').value.trim();
      const type = document.getElementById('dialog-family-type').value;
      const founder = document.getElementById('dialog-family-founder').value.trim();
      const territory = document.getElementById('dialog-family-territory').value.trim();
      if (!name) return alert('请输入家族名称');
      const family = this.createFamily({ name, type, founder, territory });
      this.selectFamily(family.id);
    });
  },

  /**
   * 显示添加成员对话框
   */
  showAddMemberDialog() {
    if (!this.currentFamilyId) return alert('请先选择一个家族');
    const family = this.getFamily(this.currentFamilyId);
    const positionOptions = this.POSITIONS.map(p => `<option value="${p}">${p}</option>`).join('');
    const parentOptions = family.members.filter(m => m.status === '在世').map(m =>
      `<option value="${m.id}">${m.name} (${m.position})</option>`
    ).join('');

    this._showDialog('添加成员', `
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; color: ${this.COLORS.inkMuted};">姓名</label>
        <input id="dialog-member-name" type="text" style="width: 100%; padding: 8px; border: 1px solid ${this.COLORS.gold}; border-radius: 4px; background: ${this.COLORS.white}; font-family: inherit;">
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; color: ${this.COLORS.inkMuted};">性别</label>
        <select id="dialog-member-gender" style="width: 100%; padding: 8px; border: 1px solid ${this.COLORS.gold}; border-radius: 4px; background: ${this.COLORS.white}; font-family: inherit;">
          <option value="男">男</option><option value="女">女</option><option value="未知">未知</option>
        </select>
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; color: ${this.COLORS.inkMuted};">职位</label>
        <select id="dialog-member-position" style="width: 100%; padding: 8px; border: 1px solid ${this.COLORS.gold}; border-radius: 4px; background: ${this.COLORS.white}; font-family: inherit;">
          ${positionOptions}
        </select>
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; color: ${this.COLORS.inkMuted};">父母（可选）</label>
        <select id="dialog-member-parent" style="width: 100%; padding: 8px; border: 1px solid ${this.COLORS.gold}; border-radius: 4px; background: ${this.COLORS.white}; font-family: inherit;">
          <option value="">无</option>${parentOptions}
        </select>
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; color: ${this.COLORS.inkMuted};">师傅（可选）</label>
        <select id="dialog-member-master" style="width: 100%; padding: 8px; border: 1px solid ${this.COLORS.gold}; border-radius: 4px; background: ${this.COLORS.white}; font-family: inherit;">
          <option value="">无</option>${parentOptions}
        </select>
      </div>
    `, () => {
      const name = document.getElementById('dialog-member-name').value.trim();
      if (!name) return alert('请输入成员姓名');
      const gender = document.getElementById('dialog-member-gender').value;
      const position = document.getElementById('dialog-member-position').value;
      const parentId = document.getElementById('dialog-member-parent').value;
      const masterId = document.getElementById('dialog-member-master').value;

      const config = { name, gender, position };
      if (parentId) config.parents = [parentId];
      if (masterId) config.master = masterId;

      const member = this.addMember(this.currentFamilyId, config);
      if (member) {
        if (parentId) this.setRelation(this.currentFamilyId, member.id, '父', parentId);
        const canvas = document.getElementById('family-tree-canvas');
        if (canvas) this.renderTree(this.currentFamilyId, canvas);
        this.renderFamilyList();
      }
    });
  },

  /**
   * 显示联姻对话框
   */
  showAllianceDialog() {
    if (this.families.length < 2) return alert('需要至少两个家族才能联姻');
    const familyOptions = this.families.map(f =>
      `<option value="${f.id}">${f.name} (${f.members.length}人)</option>`
    ).join('');

    this._showDialog('家族联姻', `
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; color: ${this.COLORS.inkMuted};">家族A</label>
        <select id="dialog-alliance-fam-a" style="width: 100%; padding: 8px; border: 1px solid ${this.COLORS.gold}; border-radius: 4px; background: ${this.COLORS.white}; font-family: inherit;">${familyOptions}</select>
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; color: ${this.COLORS.inkMuted};">家族B</label>
        <select id="dialog-alliance-fam-b" style="width: 100%; padding: 8px; border: 1px solid ${this.COLORS.gold}; border-radius: 4px; background: ${this.COLORS.white}; font-family: inherit;">${familyOptions}</select>
      </div>
      <div style="margin-bottom: 12px; font-size: 12px; color: ${this.COLORS.inkMuted};">
        联姻后两家族将建立同盟关系，移除敌对关系。
      </div>
    `, () => {
      const famA = document.getElementById('dialog-alliance-fam-a').value;
      const famB = document.getElementById('dialog-alliance-fam-b').value;
      if (famA === famB) return alert('不能选择同一个家族');

      // 自动选择第一个未婚成员
      const familyA = this.getFamily(famA);
      const familyB = this.getFamily(famB);
      const memA = familyA.members.find(m => m.status === '在世' && !m.spouse);
      const memB = familyB.members.find(m => m.status === '在世' && !m.spouse);
      if (!memA || !memB) return alert('双方家族需要有未婚的在世成员');

      this.formAlliance(famA, memA.id, famB, memB.id);
      this.renderFamilyList();
    });
  },

  /**
   * 显示结仇对话框
   */
  showEnmityDialog() {
    if (this.families.length < 2) return alert('需要至少两个家族');
    const familyOptions = this.families.map(f =>
      `<option value="${f.id}">${f.name}</option>`
    ).join('');

    this._showDialog('家族结仇', `
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; color: ${this.COLORS.inkMuted};">家族A</label>
        <select id="dialog-enmity-fam-a" style="width: 100%; padding: 8px; border: 1px solid ${this.COLORS.gold}; border-radius: 4px; background: ${this.COLORS.white}; font-family: inherit;">${familyOptions}</select>
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; color: ${this.COLORS.inkMuted};">家族B</label>
        <select id="dialog-enmity-fam-b" style="width: 100%; padding: 8px; border: 1px solid ${this.COLORS.gold}; border-radius: 4px; background: ${this.COLORS.white}; font-family: inherit;">${familyOptions}</select>
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; color: ${this.COLORS.inkMuted};">结仇原因</label>
        <input id="dialog-enmity-reason" type="text" placeholder="例如：争夺地盘、世仇..." style="width: 100%; padding: 8px; border: 1px solid ${this.COLORS.gold}; border-radius: 4px; background: ${this.COLORS.white}; font-family: inherit;">
      </div>
    `, () => {
      const famA = document.getElementById('dialog-enmity-fam-a').value;
      const famB = document.getElementById('dialog-enmity-fam-b').value;
      if (famA === famB) return alert('不能选择同一个家族');
      const reason = document.getElementById('dialog-enmity-reason').value.trim();
      this.formEnmity(famA, famB, reason);
      this.renderFamilyList();
    });
  },

  /**
   * 显示编辑家族对话框
   * @param {string} familyId 家族ID
   */
  showEditFamilyDialog(familyId) {
    const family = this.getFamily(familyId);
    if (!family) return;
    this._showDialog('编辑家族', `
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; color: ${this.COLORS.inkMuted};">家族名称</label>
        <input id="dialog-edit-name" type="text" value="${family.name}" style="width: 100%; padding: 8px; border: 1px solid ${this.COLORS.gold}; border-radius: 4px; background: ${this.COLORS.white}; font-family: inherit;">
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; color: ${this.COLORS.inkMuted};">领地</label>
        <input id="dialog-edit-territory" type="text" value="${family.territory}" style="width: 100%; padding: 8px; border: 1px solid ${this.COLORS.gold}; border-radius: 4px; background: ${this.COLORS.white}; font-family: inherit;">
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; color: ${this.COLORS.inkMuted};">描述</label>
        <textarea id="dialog-edit-desc" style="width: 100%; padding: 8px; border: 1px solid ${this.COLORS.gold}; border-radius: 4px; background: ${this.COLORS.white}; font-family: inherit; resize: vertical; min-height: 60px;">${family.description || ''}</textarea>
      </div>
    `, () => {
      const name = document.getElementById('dialog-edit-name').value.trim();
      if (!name) return;
      this.updateFamily(familyId, {
        name,
        territory: document.getElementById('dialog-edit-territory').value.trim(),
        description: document.getElementById('dialog-edit-desc').value.trim()
      });
      this.renderFamilyList();
    });
  },

  /**
   * 显示编辑成员对话框
   * @param {string} familyId 家族ID
   * @param {string} memberId 成员ID
   */
  showEditMemberDialog(familyId, memberId) {
    const member = this.getMember(familyId, memberId);
    if (!member) return;
    const statusOptions = this.MEMBER_STATUSES.map(s =>
      `<option value="${s}" ${member.status === s ? 'selected' : ''}>${s}</option>`
    ).join('');

    this._showDialog('编辑成员', `
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; color: ${this.COLORS.inkMuted};">姓名</label>
        <input id="dialog-edit-m-name" type="text" value="${member.name}" style="width: 100%; padding: 8px; border: 1px solid ${this.COLORS.gold}; border-radius: 4px; background: ${this.COLORS.white}; font-family: inherit;">
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; color: ${this.COLORS.inkMuted};">状态</label>
        <select id="dialog-edit-m-status" style="width: 100%; padding: 8px; border: 1px solid ${this.COLORS.gold}; border-radius: 4px; background: ${this.COLORS.white}; font-family: inherit;">${statusOptions}</select>
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; color: ${this.COLORS.inkMuted};">传记</label>
        <textarea id="dialog-edit-m-bio" style="width: 100%; padding: 8px; border: 1px solid ${this.COLORS.gold}; border-radius: 4px; background: ${this.COLORS.white}; font-family: inherit; resize: vertical; min-height: 80px;">${member.biography || ''}</textarea>
      </div>
    `, () => {
      const name = document.getElementById('dialog-edit-m-name').value.trim();
      if (!name) return;
      const newStatus = document.getElementById('dialog-edit-m-status').value;
      if (newStatus !== member.status) {
        this.changeMemberStatus(familyId, memberId, newStatus);
      }
      this.updateMember(familyId, memberId, {
        name,
        biography: document.getElementById('dialog-edit-m-bio').value.trim()
      });
      this.renderMemberDetails(familyId, memberId);
      const canvas = document.getElementById('family-tree-canvas');
      if (canvas) this.renderTree(familyId, canvas);
    });
  },

  /**
   * 确认删除家族
   * @param {string} familyId 家族ID
   */
  confirmDeleteFamily(familyId) {
    const family = this.getFamily(familyId);
    if (!family) return;
    if (!confirm(`确定要删除家族「${family.name}」吗？此操作不可恢复！`)) return;
    this.deleteFamily(familyId);
    this.renderFamilyList();
    const canvas = document.getElementById('family-tree-canvas');
    if (canvas && this.currentFamilyId) this.renderTree(this.currentFamilyId, canvas);
  },

  /**
   * 确认删除成员
   * @param {string} familyId 家族ID
   * @param {string} memberId 成员ID
   */
  confirmDeleteMember(familyId, memberId) {
    const member = this.getMember(familyId, memberId);
    if (!member) return;
    if (!confirm(`确定要删除成员「${member.name}」吗？`)) return;
    this.deleteMember(familyId, memberId);
    this.selectedMemberId = null;
    this.renderMemberDetails(familyId, null);
    const canvas = document.getElementById('family-tree-canvas');
    if (canvas) this.renderTree(familyId, canvas);
    this.renderFamilyList();
  },

  /**
   * 显示通用对话框
   * @param {string} title 标题
   * @param {string} content HTML内容
   * @param {Function} onConfirm 确认回调
   */
  _showDialog(title, content, onConfirm) {
    // 移除已有对话框
    const existing = document.getElementById('family-system-dialog');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'family-system-dialog';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(44,24,16,0.5); z-index: 1000;
      display: flex; align-items: center; justify-content: center;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: ${this.COLORS.parchment}; border: 2px solid ${this.COLORS.gold};
      border-radius: 8px; padding: 24px; max-width: 420px; width: 90%;
      max-height: 80vh; overflow-y: auto;
      box-shadow: 0 8px 32px rgba(44,24,16,0.3);
    `;

    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    titleEl.style.cssText = `margin: 0 0 16px 0; color: ${this.COLORS.ink}; font-size: 18px;`;
    dialog.appendChild(titleEl);

    const contentEl = document.createElement('div');
    contentEl.innerHTML = content;
    dialog.appendChild(contentEl);

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.style.cssText = this._getSmallBtnStyle();
    cancelBtn.onclick = () => overlay.remove();
    btnRow.appendChild(cancelBtn);

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = '确认';
    confirmBtn.style.cssText = this._getSmallBtnStyle(this.COLORS.gold);
    confirmBtn.onclick = () => {
      onConfirm();
      overlay.remove();
    };
    btnRow.appendChild(confirmBtn);

    dialog.appendChild(btnRow);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // 点击背景关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  },

  // ===================== 世界观联动 =====================

  /**
   * 获取当前世界观
   * @returns {string} 世界观标识
   */
  getCurrentWorldview() {
    // 尝试从其他模块获取世界观信息
    if (typeof window !== 'undefined' && window.WorldviewEngine) {
      return window.WorldviewEngine.getCurrentWorldview?.() || 'default';
    }
    // 从存储中读取
    try {
      const stored = localStorage.getItem('mj_worldview_type');
      if (stored) return stored;
    } catch (e) {}
    return 'default';
  },

  /**
   * 世界观变化时的回调
   * @param {string} worldview 新世界观
   */
  onWorldviewChanged(worldview) {
    console.log('[FamilySystem] 世界观变化:', worldview);
    // 重新渲染家族列表（类型选项会更新）
    this.renderFamilyList();
  },

  // ===================== 工具函数 =====================

  /**
   * 生成分支颜色
   * @param {number} index 分支索引
   * @returns {string} 颜色
   */
  _generateBranchColor(index) {
    const colors = [
      '#C9A227', '#8B1A1A', '#2D5A3D', '#4A6741', '#7B5B3A',
      '#5C3A2A', '#8B6914', '#2C5F7C', '#6B4E3D', '#4A7C59'
    ];
    return colors[index % colors.length];
  },

  /**
   * 获取小按钮样式
   * @param {string} color 主色
   * @returns {string} CSS样式字符串
   */
  _getSmallBtnStyle(color) {
    const c = color || this.COLORS.inkLight;
    return `
      padding: 4px 10px; border: 1px solid ${c};
      background: ${this.COLORS.white}; color: ${c};
      border-radius: 4px; cursor: pointer; font-size: 12px;
      font-family: inherit; transition: all 0.2s;
    `;
  },

  /**
   * 格式化时间戳为可读日期
   * @param {number} timestamp 时间戳
   * @returns {string} 格式化字符串
   */
  _formatTimestamp(timestamp) {
    if (!timestamp) return '未知时间';
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  /**
   * 格式化游戏内日期
   * @returns {string} 游戏日期字符串
   */
  _formatGameDate() {
    // 尝试从运行时获取游戏时间
    if (typeof window !== 'undefined' && window.Runtime) {
      const gameTime = window.Runtime.getGameTime?.();
      if (gameTime) return gameTime;
    }
    return this._formatTimestamp(Date.now());
  },

  /**
   * 发送EventBridge事件
   * @param {string} type 事件类型
   * @param {Object} payload 事件数据
   */
  emitEvent(type, payload = {}) {
    if (typeof window !== 'undefined' && window.EventBridge) {
      EventBridge.emit('family', type, payload, 'FamilySystem');
    }
  },

  // ===================== 数据导出/导入 =====================

  /**
   * 导出家族数据为JSON
   * @returns {string} JSON字符串
   */
  exportData() {
    const exportObj = {
      version: 'v16',
      exportDate: Date.now(),
      families: this.families,
      _familyIdCounter: this._familyIdCounter,
      _memberIdCounter: this._memberIdCounter
    };
    // 包含大事记
    const histories = {};
    this.families.forEach(f => {
      histories[f.id] = this.getHistory(f.id);
    });
    exportObj.histories = histories;
    return JSON.stringify(exportObj, null, 2);
  },

  /**
   * 导入家族数据
   * @param {string} jsonString JSON字符串
   * @returns {boolean} 是否成功
   */
  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data.families) return false;
      this.families = data.families;
      this._familyIdCounter = data._familyIdCounter || 0;
      this._memberIdCounter = data._memberIdCounter || 0;

      // 导入大事记
      if (data.histories) {
        Object.entries(data.histories).forEach(([familyId, history]) => {
          this.saveHistory(familyId, history);
        });
      }

      this.save();
      this.emitEvent('data_imported', { familyCount: this.families.length });
      return true;
    } catch (e) {
      console.error('[FamilySystem] 导入失败:', e);
      return false;
    }
  },

  /**
   * 获取统计信息
   * @returns {Object} 统计对象
   */
  getStats() {
    const totalMembers = this.families.reduce((sum, f) => sum + f.members.length, 0);
    const totalAlliances = this.families.reduce((sum, f) => sum + f.alliances.length, 0);
    const totalEnemies = this.families.reduce((sum, f) => sum + f.enemies.length, 0);
    const worldview = this.getCurrentWorldview();
    return {
      familyCount: this.families.length,
      totalMembers,
      totalAlliances,
      totalEnemies,
      worldview,
      avgReputation: this.families.length > 0 ?
        Math.round(this.families.reduce((s, f) => s + f.reputation, 0) / this.families.length) : 0
    };
  }
};

// ===================== 自动初始化 =====================
if (typeof window !== 'undefined') {
  window.FamilySystem = FamilySystem;
  // DOM就绪后自动初始化（如果已经就绪则立即执行）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => FamilySystem.init());
  } else {
    FamilySystem.init();
  }
}

// Node.js / 模块导出支持
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FamilySystem;
}
