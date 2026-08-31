/**
 * =========================================================
 * 密谋/阴谋/Intrigue系统 v1
 * ConspiracySystem — 全局对象
 * 核心概念：NPC之间秘密策划阴谋，有策划者、参与者、目标、计划步骤。
 *         玩家可能发现、加入、破坏密谋。
 * 配色：古风墨境 — 羊皮纸底 #F5E6D3，金色 #C9A227，墨色 #2C1810
 * 联动：NPCBehavior / FamilySystem / PoliticalSystem / WorldviewEngine
 * =========================================================
 */

const ConspiracySystem = (function() {
  'use strict';

  // ==================== 常量定义 ====================

  /** 存储键名 */
  const STORAGE_KEY = 'conspiracy_system_v16';

  /** 古风墨境配色方案 */
  const COLORS = {
    parchment: '#F5E6D3',
    parchmentLight: '#FDF8F0',
    ink: '#2C1810',
    inkLight: '#5C3A2E',
    inkMuted: '#8B6F5E',
    gold: '#C9A227',
    goldLight: '#E8C84B',
    border: '#C9A227',
    borderLight: 'rgba(201,162,39,0.3)',
    red: '#B85450',
    green: '#4CAF50',
    blue: '#1E88E5',
    purple: '#7B1FA2',
    orange: '#FF9800',
    cyan: '#0097A7'
  };

  /** 密谋类型枚举 */
  const CONSPIRACY_TYPES = {
    ASSASSINATION: 'assassination',   // 暗杀
    USURPATION: 'usurpation',         // 夺权
    FRAMING: 'framing',               // 陷害
    THEFT: 'theft',                   // 盗窃
    SABOTAGE: 'sabotage',             // 破坏
    TREASON: 'treason',               // 叛变
    MARRIAGE: 'marriage'              // 联姻
  };

  /** 密谋类型中文标签 */
  const TYPE_LABELS = {
    assassination: '暗杀',
    usurpation: '夺权',
    framing: '陷害',
    theft: '盗窃',
    sabotage: '破坏',
    treason: '叛变',
    marriage: '联姻'
  };

  /** 密谋类型颜色 */
  const TYPE_COLORS = {
    assassination: '#B85450',
    usurpation: '#C9A227',
    framing: '#8B6F5E',
    theft: '#1E88E5',
    sabotage: '#FF9800',
    treason: '#7B1FA2',
    marriage: '#E91E63'
  };

  /** 密谋状态枚举 */
  const STATUS = {
    PLANNING: 'planning',     // 策划中
    ACTIVE: 'active',         // 进行中
    COMPLETED: 'completed',   // 已完成
    FAILED: 'failed',         // 已失败
    EXPOSED: 'exposed'        // 已暴露
  };

  /** 状态中文标签 */
  const STATUS_LABELS = {
    planning: '策划中',
    active: '进行中',
    completed: '已完成',
    failed: '已失败',
    exposed: '已暴露'
  };

  /** 状态颜色 */
  const STATUS_COLORS = {
    planning: '#8B6F5E',
    active: '#C9A227',
    completed: '#4CAF50',
    failed: '#B85450',
    exposed: '#F44336'
  };

  /** 网络图节点类型 */
  const NODE_TYPES = {
    CONSPIRACY: 'conspiracy', // 密谋节点（菱形）
    NPC: 'npc',               // NPC节点（圆形）
    TARGET: 'target'          // 目标节点（方形）
  };

  /** 连线类型 */
  const EDGE_TYPES = {
    MASTERMIND: 'mastermind',   // 策划关系
    ACCOMPLICE: 'accomplice',   // 参与关系
    TARGET: 'target'          // 目标关系
  };

  // ==================== 状态管理 ====================

  /**
   * 运行时状态对象
   * @property {Array} conspiracies - 密谋列表
   * @property {Array} investigations - 玩家调查记录
   * @property {Array} suspiciousBehaviors - NPC可疑行为记录
   * @property {Object} networkView - 网络图视图状态
   * @property {Object} settings - 系统设置
   * @property {boolean} isInitialized - 是否已初始化
   */
  let state = {
    conspiracies: [],
    investigations: [],
    suspiciousBehaviors: [],
    networkView: {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      isDragging: false,
      isPanning: false,
      lastMouseX: 0,
      lastMouseY: 0,
      selectedNodeId: null,
      hoverNodeId: null
    },
    settings: {
      autoExecute: true,      // 自动执行密谋步骤
      aiGenerate: true,        // AI自动生成密谋
      notifyPlayer: true,      // 通知玩家新密谋
      discoveryChance: 0.15    // 玩家自然发现概率/时辰
    },
    isInitialized: false
  };

  // ==================== 私有工具函数 ====================

  /**
   * 生成唯一ID
   * @param {string} prefix - ID前缀
   * @returns {string} 唯一标识符
   */
  function _generateId(prefix) {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 保存数据到本地存储
   */
  function _save() {
    try {
      const data = {
        conspiracies: state.conspiracies,
        investigations: state.investigations,
        suspiciousBehaviors: state.suspiciousBehaviors,
        settings: state.settings,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('[ConspiracySystem] 保存失败:', e);
    }
  }

  /**
   * 从本地存储加载数据
   */
  function _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        state.conspiracies = data.conspiracies || [];
        state.investigations = data.investigations || [];
        state.suspiciousBehaviors = data.suspiciousBehaviors || [];
        state.settings = { ...state.settings, ...(data.settings || {}) };
      }
    } catch (e) {
      console.error('[ConspiracySystem] 加载失败:', e);
    }
  }

  /**
   * 获取NPC列表（兼容多种NPC系统）
   * @returns {Array} NPC对象数组
   */
  function _getNPCs() {
    if (typeof NPCManager !== 'undefined' && NPCManager.getNPCs) {
      return NPCManager.getNPCs();
    }
    if (typeof NPCBehavior !== 'undefined' && NPCBehavior.getNPCs) {
      return NPCBehavior.getNPCs();
    }
    return Storage.get('npcs', []);
  }

  /**
   * 获取单个NPC信息
   * @param {string} npcId - NPC标识符
   * @returns {Object|null}
   */
  function _getNPC(npcId) {
    const npcs = _getNPCs();
    return npcs.find(n => n.id === npcId) || null;
  }

  /**
   * 获取NPC与NPC之间的关系值
   * @param {string} npcId1 - NPC1标识
   * @param {string} npcId2 - NPC2标识
   * @returns {number} 关系值 -100~100
   */
  function _getRelationValue(npcId1, npcId2) {
    if (typeof Relations !== 'undefined' && Relations.getRelationValue) {
      return Relations.getRelationValue(npcId1, npcId2);
    }
    const rels = Storage.get('npcRelations', []);
    const rel = rels.find(r =>
      (r.from === npcId1 && r.to === npcId2) ||
      (r.from === npcId2 && r.to === npcId1)
    );
    return rel ? (rel.strength || 0) : 0;
  }

  /**
   * 获取当前时辰（兼容WeatherSystem）
   * @returns {string} 时辰名称
   */
  function _getCurrentShichen() {
    if (typeof WeatherSystem !== 'undefined' && WeatherSystem.getCurrentShichen) {
      const s = WeatherSystem.getCurrentShichen();
      return s ? s.name : '子';
    }
    const hour = new Date().getHours();
    const map = ['子','子','丑','丑','寅','寅','卯','卯','辰','辰','巳','巳',
                 '午','午','未','未','申','申','酉','酉','戌','戌','亥','亥'];
    return map[hour] || '子';
  }

  /**
   * 获取游戏内当前时间戳
   * @returns {number}
   */
  function _getGameTime() {
    if (typeof WeatherSystem !== 'undefined' && WeatherSystem.getGameTime) {
      return WeatherSystem.getGameTime();
    }
    return Date.now();
  }

  /**
   * 计算成功率（基于保密等级、参与者能力等）
   * @param {Object} conspiracy - 密谋对象
   * @param {number} stepIndex - 步骤索引
   * @returns {number} 0~1
   */
  function _calculateSuccessRate(conspiracy, stepIndex) {
    const step = conspiracy.steps[stepIndex];
    if (!step) return 0;
    let base = step.baseSuccessRate || 0.5;
    // 保密等级加成
    const secrecyBonus = (conspiracy.secrecy - 1) * 0.02;
    base += secrecyBonus;
    // 参与者能力加成（简化：假设NPC有ability字段）
    const allParticipants = [conspiracy.mastermind, ...conspiracy.accomplices];
    let abilityBonus = 0;
    allParticipants.forEach(pid => {
      const npc = _getNPC(pid);
      if (npc && npc.ability) abilityBonus += (npc.ability - 50) * 0.001;
    });
    base += abilityBonus;
    // 被发现风险减值
    const riskPenalty = (conspiracy.discoveryRisk / 100) * 0.2;
    base -= riskPenalty;
    return Math.max(0.05, Math.min(0.95, base));
  }

  /**
   * 随机打乱数组（Fisher-Yates算法）
   * @param {Array} arr
   * @returns {Array}
   */
  function _shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /**
   * 深拷贝对象
   * @param {Object} obj
   * @returns {Object}
   */
  function _deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // ==================== 密谋数据管理 ====================

  /**
   * 创建密谋对象
   * @param {Object} params - 创建参数
   * @returns {Object} 密谋对象
   */
  function _createConspiracyObject(params) {
    const now = _getGameTime();
    return {
      id: _generateId('conspiracy'),
      name: params.name || '未命名密谋',
      type: params.type || CONSPIRACY_TYPES.FRAMING,
      mastermind: params.mastermind || '',
      accomplices: params.accomplices || [],
      target: params.target || '',
      goal: params.goal || '',
      steps: (params.steps || []).map((s, i) => ({
        id: _generateId('step'),
        order: i,
        time: s.time || '',
        location: s.location || '',
        action: s.action || '',
        resources: s.resources || [],
        completed: false,
        success: null,
        baseSuccessRate: s.baseSuccessRate || 0.5
      })),
      status: STATUS.PLANNING,
      secrecy: Math.max(1, Math.min(10, params.secrecy || 5)),
      discoveryRisk: Math.max(0, Math.min(100, params.discoveryRisk || 20)),
      createdAt: now,
      completedAt: null,
      exposedBy: null,
      exposedAt: null,
      // 扩展字段：用于群像影响追踪
      impact: {
        reputationChanges: {},   // { npcId: delta }
        resourceChanges: {},     // { npcId: { type, delta } }
        positionChanges: {}      // { npcId: { old, new } }
      },
      // 玩家介入记录
      playerInvolvement: {
        discovered: false,
        discoveredAt: null,
        involvementType: null,  // 'observer'|'participant'|'saboteur'
        actions: []
      }
    };
  }

  /**
   * 添加可疑行为记录
   * @param {string} npcId - NPC标识
   * @param {string} behavior - 行为描述
   * @param {string} conspiracyId - 关联密谋ID（可选）
   */
  function _addSuspiciousBehavior(npcId, behavior, conspiracyId) {
    state.suspiciousBehaviors.push({
      id: _generateId('suspicious'),
      npcId,
      behavior,
      conspiracyId: conspiracyId || null,
      timestamp: _getGameTime(),
      discovered: false
    });
    _save();
  }

  // ==================== 密谋创建 ====================

  /**
   * NPC自主创建密谋（基于性格、关系、目标）
   * @param {string} mastermindId - 主谋NPC标识
   * @returns {Object|null} 创建的密谋或null
   */
  function _npcCreateConspiracy(mastermindId) {
    const mastermind = _getNPC(mastermindId);
    if (!mastermind) return null;

    const npcs = _getNPCs().filter(n => n.id !== mastermindId);
    if (npcs.length < 1) return null;

    // 根据主谋性格选择密谋类型
    let preferredTypes = [CONSPIRACY_TYPES.FRAMING];
    if (mastermind.personality) {
      const p = mastermind.personality;
      if (p.aggressive > 60) preferredTypes.push(CONSPIRACY_TYPES.ASSASSINATION);
      if (p.ambitious > 60) preferredTypes.push(CONSPIRACY_TYPES.USURPATION);
      if (p.cunning > 60) preferredTypes.push(CONSPIRACY_TYPES.THEFT, CONSPIRACY_TYPES.SABOTAGE);
      if (p.loyal < 30) preferredTypes.push(CONSPIRACY_TYPES.TREASON);
      if (p.charming > 60) preferredTypes.push(CONSPIRACY_TYPES.MARRIAGE);
    }

    const type = preferredTypes[Math.floor(Math.random() * preferredTypes.length)];

    // 选择目标：关系差或地位高的NPC更可能成为目标
    const candidates = npcs.map(n => {
      const rel = _getRelationValue(mastermindId, n.id);
      let score = 50;
      if (rel < -20) score += 30;
      if (rel > 50) score -= 20;
      if (n.position && n.position.level > (mastermind.position?.level || 0)) score += 20;
      return { npc: n, score };
    }).sort((a, b) => b.score - a.score);

    if (candidates.length === 0) return null;
    const target = candidates[0].npc;

    // 招募参与者：基于关系和利益分析
    const accomplices = [];
    const shuffled = _shuffle(npcs.filter(n => n.id !== target.id));
    for (const npc of shuffled) {
      if (accomplices.length >= 3) break;
      const relToMaster = _getRelationValue(mastermindId, npc.id);
      const relToTarget = _getRelationValue(npc.id, target.id);
      // 与主谋关系好、与目标关系差更可能参与
      if (relToMaster > 20 && relToTarget < 10) {
        accomplices.push(npc.id);
      }
    }

    // 生成密谋名称
    const typeLabel = TYPE_LABELS[type];
    const names = [
      `${target.name || '目标'}的${typeLabel}计划`,
      `针对${target.name || '目标'}的密谋`,
      `${mastermind.name || '某人'}的${typeLabel}行动`,
      `${typeLabel}·${target.name || '无名'}`,
      `暗中${typeLabel}`
    ];
    const name = names[Math.floor(Math.random() * names.length)];

    // 生成步骤
    const steps = _generateSteps(type, mastermind, target);

    // 计算保密等级和发现风险
    const secrecy = 3 + Math.floor(Math.random() * 5); // 3~7
    const discoveryRisk = Math.max(5, 40 - secrecy * 4 + accomplices.length * 3);

    const conspiracy = _createConspiracyObject({
      name,
      type,
      mastermind: mastermindId,
      accomplices,
      target: target.id,
      goal: `${TYPE_LABELS[type]}${target.name || '目标'}`,
      steps,
      secrecy,
      discoveryRisk
    });

    state.conspiracies.push(conspiracy);
    _save();

    // 记录可疑行为：主谋密会参与者
    accomplices.forEach(aid => {
      const a = _getNPC(aid);
      _addSuspiciousBehavior(mastermindId,
        `与${a ? a.name : '某人'}在偏僻处密谈，神色紧张`,
        conspiracy.id
      );
    });

    return conspiracy;
  }

  /**
   * 根据密谋类型生成步骤
   * @param {string} type - 密谋类型
   * @param {Object} mastermind - 主谋NPC
   * @param {Object} target - 目标NPC
   * @returns {Array} 步骤数组
   */
  function _generateSteps(type, mastermind, target) {
    const mName = mastermind.name || '主谋';
    const tName = target.name || '目标';
    const templates = {
      assassination: [
        { time: '子时', location: '暗巷', action: `探查${tName}的行踪规律`, resources: ['情报'], baseSuccessRate: 0.7 },
        { time: '丑时', location: '黑市', action: '购置暗杀器具', resources: ['银两'], baseSuccessRate: 0.8 },
        { time: '寅时', location: '目标居所外', action: `埋伏等待${tName}出现`, resources: ['耐心'], baseSuccessRate: 0.5 },
        { time: '卯时', location: '暗处', action: '执行暗杀', resources: ['武器'], baseSuccessRate: 0.4 }
      ],
      usurpation: [
        { time: '巳时', location: '书房', action: '拉拢关键人物', resources: ['人脉'], baseSuccessRate: 0.6 },
        { time: '午时', location: '议事厅', action: '散布不利于目标的言论', resources: ['流言'], baseSuccessRate: 0.7 },
        { time: '未时', location: '密室', action: '策划权力交接', resources: ['盟书'], baseSuccessRate: 0.5 },
        { time: '申时', location: '大殿', action: '正式夺权', resources: ['武力支持'], baseSuccessRate: 0.3 }
      ],
      framing: [
        { time: '辰时', location: '书房', action: `伪造${tName}的罪证`, resources: ['笔墨'], baseSuccessRate: 0.7 },
        { time: '巳时', location: '目标府邸', action: '将罪证潜入目标处', resources: ['身手'], baseSuccessRate: 0.5 },
        { time: '午时', location: '衙门', action: '向官府举报', resources: ['门路'], baseSuccessRate: 0.6 }
      ],
      theft: [
        { time: '子时', location: '目标府邸外', action: '踩点观察守卫', resources: ['时间'], baseSuccessRate: 0.8 },
        { time: '丑时', location: '府邸内', action: '潜入密室', resources: ['开锁工具'], baseSuccessRate: 0.5 },
        { time: '寅时', location: '密道', action: '携带赃物撤离', resources: ['运力'], baseSuccessRate: 0.6 }
      ],
      sabotage: [
        { time: '午时', location: '工坊', action: '调查目标产业运作', resources: ['情报'], baseSuccessRate: 0.7 },
        { time: '未时', location: '仓库', action: '破坏关键设备', resources: ['工具'], baseSuccessRate: 0.5 },
        { time: '申时', location: '集市', action: '煽动工人罢工', resources: ['口才'], baseSuccessRate: 0.4 }
      ],
      treason: [
        { time: '子时', location: '密室', action: '与敌方势力密使接触', resources: ['胆量'], baseSuccessRate: 0.5 },
        { time: '寅时', location: '城门', action: '传递机密情报', resources: ['信物'], baseSuccessRate: 0.4 },
        { time: '卯时', location: '约定地点', action: '正式叛逃', resources: ['决心'], baseSuccessRate: 0.3 }
      ],
      marriage: [
        { time: '巳时', location: '花园', action: `制造与${tName}的偶遇`, resources: ['机遇'], baseSuccessRate: 0.6 },
        { time: '午时', location: '诗会', action: '展示才华博取好感', resources: ['才情'], baseSuccessRate: 0.7 },
        { time: '未时', location: '府邸', action: '向家族提亲', resources: ['媒人'], baseSuccessRate: 0.5 },
        { time: '申时', location: '宗祠', action: '完成联姻仪式', resources: ['聘礼'], baseSuccessRate: 0.8 }
      ]
    };
    const steps = templates[type] || templates.framing;
    return steps.map(s => ({ ...s }));
  }

  /**
   * AI生成密谋描述（古风风格）
   * @param {Object} conspiracy - 密谋对象
   * @returns {string} 古风描述文本
   */
  function _generateAIDescription(conspiracy) {
    const mastermind = _getNPC(conspiracy.mastermind);
    const target = _getNPC(conspiracy.target);
    const mName = mastermind ? mastermind.name : '神秘人物';
    const tName = target ? target.name : '无名目标';
    const typeLabel = TYPE_LABELS[conspiracy.type];

    const intros = [
      `月黑风高夜，${mName}于暗室中独坐，烛火摇曳，心中盘算着一桩${typeLabel}之计。`,
      `近日${tName}风头正盛，${mName}暗中嫉恨，遂生${typeLabel}之心。`,
      `江湖传闻，${mName}召集心腹，密谋${typeLabel}${tName}，其事甚为隐秘。`,
      `${mName}城府深沉，于无人之处筹划${typeLabel}${tName}，步步为营。`
    ];
    return intros[Math.floor(Math.random() * intros.length)];
  }

  /**
   * AI生成调查线索描述
   * @param {Object} clue - 线索对象
   * @returns {string} 古风线索描述
   */
  function _generateAIClueDescription(clue) {
    const npc = _getNPC(clue.npcId);
    const name = npc ? npc.name : '某人';
    const behaviors = [
      `近日${name}行踪诡秘，常在夜深人静时外出，似有所图。`,
      `有目击者称，${name}近日与一些生面孔频繁接触，神色紧张。`,
      `${name}近日一反常态，对周遭事务格外关注，似有不可告人之目的。`,
      `据传闻，${name}近日频繁出入偏僻之地，行迹可疑。`,
      `${name}近日言语间多有试探，似在打听某些不该知道的消息。`
    ];
    return behaviors[Math.floor(Math.random() * behaviors.length)];
  }

  // ==================== 密谋执行 ====================

  /**
   * 执行密谋的下一步
   * @param {string} conspiracyId - 密谋标识
   * @returns {Object|null} 执行结果
   */
  function _executeStep(conspiracyId) {
    const conspiracy = state.conspiracies.find(c => c.id === conspiracyId);
    if (!conspiracy) return null;
    if (conspiracy.status !== STATUS.ACTIVE && conspiracy.status !== STATUS.PLANNING) return null;

    // 策划中转为进行中
    if (conspiracy.status === STATUS.PLANNING) {
      conspiracy.status = STATUS.ACTIVE;
    }

    // 找到第一个未完成的步骤
    const step = conspiracy.steps.find(s => !s.completed);
    if (!step) {
      // 所有步骤完成
      conspiracy.status = STATUS.COMPLETED;
      conspiracy.completedAt = _getGameTime();
      _applyConspiracyImpact(conspiracy, true);
      return { success: true, completed: true };
    }

    // 计算成功率
    const rate = _calculateSuccessRate(conspiracy, step.order);
    const roll = Math.random();
    const success = roll < rate;

    step.completed = true;
    step.success = success;
    step.executedAt = _getGameTime();

    if (success) {
      // 成功：增加发现风险
      conspiracy.discoveryRisk = Math.min(100, conspiracy.discoveryRisk + 5);
      // 记录NPC执行密谋的行为变化
      _notifyNPCBehavior(conspiracy.mastermind, 'conspiracy_execute', {
        conspiracyId: conspiracy.id,
        stepId: step.id,
        location: step.location,
        time: step.time
      });
    } else {
      // 失败：可能暴露
      const exposeRoll = Math.random();
      const exposeThreshold = conspiracy.discoveryRisk / 100;
      if (exposeRoll < exposeThreshold) {
        conspiracy.status = STATUS.EXPOSED;
        conspiracy.exposedBy = 'system';
        conspiracy.exposedAt = _getGameTime();
        _applyConspiracyImpact(conspiracy, false);
        _addSuspiciousBehavior(conspiracy.mastermind,
          `密谋行动失败，引起他人怀疑`,
          conspiracy.id
        );
        return { success: false, exposed: true };
      }
      // 未暴露但失败
      conspiracy.discoveryRisk = Math.min(100, conspiracy.discoveryRisk + 15);
    }

    // 检查是否全部完成
    const allDone = conspiracy.steps.every(s => s.completed);
    if (allDone) {
      if (conspiracy.status !== STATUS.EXPOSED && conspiracy.status !== STATUS.FAILED) {
        const allSuccess = conspiracy.steps.every(s => s.success);
        conspiracy.status = allSuccess ? STATUS.COMPLETED : STATUS.FAILED;
        conspiracy.completedAt = _getGameTime();
        _applyConspiracyImpact(conspiracy, allSuccess);
      }
    }

    _save();
    return { success, step: step.order, completed: allDone };
  }

  /**
   * 应用密谋对群像的影响
   * @param {Object} conspiracy - 密谋对象
   * @param {boolean} isSuccess - 是否成功
   */
  function _applyConspiracyImpact(conspiracy, isSuccess) {
    const allParticipants = [conspiracy.mastermind, ...conspiracy.accomplices];
    const targetId = conspiracy.target;

    if (isSuccess) {
      // 成功：参与者获得利益
      allParticipants.forEach(pid => {
        const npc = _getNPC(pid);
        if (!npc) return;
        // 声望提升
        conspiracy.impact.reputationChanges[pid] = (conspiracy.impact.reputationChanges[pid] || 0) + 10;
        // 记录行为变化
        _notifyNPCBehavior(pid, 'conspiracy_success', { conspiracyId: conspiracy.id });
      });
      // 目标受损
      if (targetId) {
        conspiracy.impact.reputationChanges[targetId] = (conspiracy.impact.reputationChanges[targetId] || 0) - 15;
        _notifyNPCBehavior(targetId, 'conspiracy_victim', { conspiracyId: conspiracy.id });
      }
    } else {
      // 失败或暴露：参与者受罚
      allParticipants.forEach(pid => {
        const npc = _getNPC(pid);
        if (!npc) return;
        conspiracy.impact.reputationChanges[pid] = (conspiracy.impact.reputationChanges[pid] || 0) - 10;
        _notifyNPCBehavior(pid, 'conspiracy_failure', { conspiracyId: conspiracy.id });
      });
    }

    // 暴露时影响所有相关NPC的声望
    if (conspiracy.status === STATUS.EXPOSED) {
      allParticipants.forEach(pid => {
        conspiracy.impact.reputationChanges[pid] = (conspiracy.impact.reputationChanges[pid] || 0) - 20;
      });
      if (targetId) {
        conspiracy.impact.reputationChanges[targetId] = (conspiracy.impact.reputationChanges[targetId] || 0) + 5;
      }
    }
  }

  /**
   * 通知NPCBehavior系统NPC行为变化
   * @param {string} npcId - NPC标识
   * @param {string} eventType - 事件类型
   * @param {Object} data - 事件数据
   */
  function _notifyNPCBehavior(npcId, eventType, data) {
    // 若NPCBehavior系统存在，通知其行为改变
    if (typeof NPCBehavior !== 'undefined' && NPCBehavior.onConspiracyEvent) {
      NPCBehavior.onConspiracyEvent(npcId, eventType, data);
    }
    // 记录可疑行为
    const npc = _getNPC(npcId);
    if (npc && eventType === 'conspiracy_execute') {
      _addSuspiciousBehavior(npcId,
        `在${data.time || '深夜'}出现在${data.location || '偏僻处'}，行迹可疑`,
        data.conspiracyId
      );
    }
  }

  /**
   * 自动执行所有进行中的密谋（按时辰触发）
   */
  function _autoExecuteConspiracies() {
    if (!state.settings.autoExecute) return;
    const activeConspiracies = state.conspiracies.filter(c =>
      c.status === STATUS.ACTIVE || c.status === STATUS.PLANNING
    );
    activeConspiracies.forEach(c => {
      // 每个时辰有一定概率执行一步
      if (Math.random() < 0.3) {
        _executeStep(c.id);
      }
    });
  }

  // ==================== 发现与调查 ====================

  /**
   * 玩家发现密谋线索（通过观察）
   * @param {string} npcId - 观察的NPC标识
   * @returns {Object|null} 发现的线索
   */
  function _discoverClueByObservation(npcId) {
    const npc = _getNPC(npcId);
    if (!npc) return null;

    // 查找与该NPC相关的未暴露密谋
    const relatedConspiracies = state.conspiracies.filter(c =>
      (c.mastermind === npcId || c.accomplices.includes(npcId)) &&
      c.status !== STATUS.EXPOSED &&
      c.playerInvolvement && !c.playerInvolvement.discovered
    );

    if (relatedConspiracies.length === 0) return null;

    // 基于发现风险计算发现概率
    const conspiracy = relatedConspiracies[0];
    const discoveryChance = (conspiracy.discoveryRisk / 100) * state.settings.discoveryChance;

    if (Math.random() > discoveryChance) return null;

    // 生成线索
    const clue = {
      id: _generateId('clue'),
      type: 'observation',
      npcId,
      conspiracyId: conspiracy.id,
      description: _generateAIClueDescription({ npcId }),
      timestamp: _getGameTime(),
      progressValue: 20  // 调查进度增加值
    };

    return clue;
  }

  /**
   * 开始调查密谋
   * @param {string} conspiracyId - 密谋标识
   * @returns {Object} 调查对象
   */
  function _startInvestigation(conspiracyId) {
    const existing = state.investigations.find(i => i.conspiracyId === conspiracyId);
    if (existing) return existing;

    const investigation = {
      id: _generateId('investigation'),
      conspiracyId,
      progress: 0,
      clues: [],
      startedAt: _getGameTime(),
      completedAt: null,
      status: 'investigating'
    };

    state.investigations.push(investigation);
    _save();
    return investigation;
  }

  /**
   * 添加调查线索
   * @param {string} investigationId - 调查标识
   * @param {Object} clue - 线索对象
   */
  function _addInvestigationClue(investigationId, clue) {
    const investigation = state.investigations.find(i => i.id === investigationId);
    if (!investigation) return;
    if (investigation.status !== 'investigating') return;

    investigation.clues.push(clue);
    investigation.progress = Math.min(100, investigation.progress + (clue.progressValue || 10));

    // 进度满100%则暴露密谋
    if (investigation.progress >= 100) {
      investigation.status = 'completed';
      investigation.completedAt = _getGameTime();
      _exposeConspiracy(investigation.conspiracyId, 'player');
    }

    _save();
  }

  /**
   * 暴露密谋
   * @param {string} conspiracyId - 密谋标识
   * @param {string} exposedBy - 暴露者
   */
  function _exposeConspiracy(conspiracyId, exposedBy) {
    const conspiracy = state.conspiracies.find(c => c.id === conspiracyId);
    if (!conspiracy) return;
    if (conspiracy.status === STATUS.EXPOSED) return;

    conspiracy.status = STATUS.EXPOSED;
    conspiracy.exposedBy = exposedBy;
    conspiracy.exposedAt = _getGameTime();
    conspiracy.playerInvolvement = conspiracy.playerInvolvement || {};
    conspiracy.playerInvolvement.discovered = true;
    conspiracy.playerInvolvement.discoveredAt = _getGameTime();

    _applyConspiracyImpact(conspiracy, false);
    _save();
  }

  /**
   * 审问嫌疑人获取线索
   * @param {string} npcId - NPC标识
   * @param {string} investigationId - 调查标识
   * @returns {Object|null} 获得的线索
   */
  function _interrogateSuspect(npcId, investigationId) {
    const npc = _getNPC(npcId);
    if (!npc) return null;

    const investigation = state.investigations.find(i => i.id === investigationId);
    if (!investigation) return null;

    // 根据NPC性格计算招供概率
    let confessRate = 0.2;
    if (npc.personality) {
      if (npc.personality.cowardly > 60) confessRate += 0.3;
      if (npc.personality.loyal > 60) confessRate -= 0.2;
    }

    if (Math.random() > confessRate) {
      return { type: 'interrogate', success: false, npcId, message: `${npc.name || '嫌疑人'}拒不招供` };
    }

    // 招供：获得大量进度
    const clue = {
      id: _generateId('clue'),
      type: 'interrogate',
      npcId,
      investigationId,
      description: `${npc.name || '嫌疑人'}在压力下透露了部分内情`,
      timestamp: _getGameTime(),
      progressValue: 35
    };

    _addInvestigationClue(investigationId, clue);
    return { type: 'interrogate', success: true, clue };
  }

  /**
   * 监视目标获取线索
   * @param {string} npcId - NPC标识
   * @param {string} investigationId - 调查标识
   * @returns {Object|null} 监视结果
   */
  function _surveillanceTarget(npcId, investigationId) {
    const npc = _getNPC(npcId);
    if (!npc) return null;

    // 基于该NPC的可疑行为记录
    const behaviors = state.suspiciousBehaviors.filter(b => b.npcId === npcId && !b.discovered);
    if (behaviors.length === 0) {
      return { type: 'surveillance', success: false, npcId, message: '未发现异常行为' };
    }

    // 标记行为为已发现
    behaviors.forEach(b => { b.discovered = true; });

    const investigation = state.investigations.find(i => i.id === investigationId);
    if (!investigation) return null;

    const clue = {
      id: _generateId('clue'),
      type: 'surveillance',
      npcId,
      investigationId,
      description: `监视发现${npc.name || '目标'}${behaviors[0].behavior}`,
      timestamp: _getGameTime(),
      progressValue: 25
    };

    _addInvestigationClue(investigationId, clue);
    return { type: 'surveillance', success: true, clue };
  }

  // ==================== 密谋网络可视化（Canvas） ====================

  /**
   * 构建网络图数据
   * @returns {Object} { nodes, edges }
   */
  function _buildNetworkData() {
    const nodes = [];
    const edges = [];
    const npcs = _getNPCs();

    state.conspiracies.forEach(c => {
      // 密谋节点（菱形）
      nodes.push({
        id: c.id,
        type: NODE_TYPES.CONSPIRACY,
        label: c.name,
        status: c.status,
        x: Math.random() * 600 + 50,
        y: Math.random() * 400 + 50,
        width: 100,
        height: 60
      });

      // 主谋节点
      const master = _getNPC(c.mastermind);
      if (master && !nodes.find(n => n.id === c.mastermind)) {
        nodes.push({
          id: c.mastermind,
          type: NODE_TYPES.NPC,
          label: master.name || '?',
          role: 'mastermind',
          x: Math.random() * 600 + 50,
          y: Math.random() * 400 + 50,
          radius: 24
        });
      }
      edges.push({
        id: _generateId('edge'),
        from: c.mastermind,
        to: c.id,
        type: EDGE_TYPES.MASTERMIND,
        color: COLORS.gold
      });

      // 参与者节点
      c.accomplices.forEach(aid => {
        const a = _getNPC(aid);
        if (a && !nodes.find(n => n.id === aid)) {
          nodes.push({
            id: aid,
            type: NODE_TYPES.NPC,
            label: a.name || '?',
            role: 'accomplice',
            x: Math.random() * 600 + 50,
            y: Math.random() * 400 + 50,
            radius: 20
          });
        }
        edges.push({
          id: _generateId('edge'),
          from: aid,
          to: c.id,
          type: EDGE_TYPES.ACCOMPLICE,
          color: COLORS.inkMuted
        });
      });

      // 目标节点（方形）
      const target = _getNPC(c.target);
      if (target) {
        const targetNodeId = 'target_' + c.target;
        if (!nodes.find(n => n.id === targetNodeId)) {
          nodes.push({
            id: targetNodeId,
            type: NODE_TYPES.TARGET,
            label: target.name || '?',
            npcId: c.target,
            x: Math.random() * 600 + 50,
            y: Math.random() * 400 + 50,
            width: 80,
            height: 40
          });
        }
        edges.push({
          id: _generateId('edge'),
          from: c.id,
          to: targetNodeId,
          type: EDGE_TYPES.TARGET,
          color: COLORS.red
        });
      }
    });

    return { nodes, edges };
  }

  /**
   * 渲染密谋网络Canvas
   * @param {HTMLCanvasElement} canvas - Canvas元素
   */
  function _renderNetworkCanvas(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const view = state.networkView;

    // 清空画布
    ctx.clearRect(0, 0, w, h);

    // 绘制背景
    ctx.fillStyle = COLORS.parchment;
    ctx.fillRect(0, 0, w, h);

    const { nodes, edges } = _buildNetworkData();

    ctx.save();
    ctx.translate(view.offsetX, view.offsetY);
    ctx.scale(view.scale, view.scale);

    // 绘制连线
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      if (!fromNode || !toNode) return;

      const fx = fromNode.x + (fromNode.width ? fromNode.width / 2 : 0);
      const fy = fromNode.y + (fromNode.height ? fromNode.height / 2 : 0);
      const tx = toNode.x + (toNode.width ? toNode.width / 2 : 0);
      const ty = toNode.y + (toNode.height ? toNode.height / 2 : 0);

      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, ty);
      ctx.strokeStyle = edge.color || COLORS.inkMuted;
      ctx.lineWidth = (edge.type === EDGE_TYPES.MASTERMIND) ? 2.5 : 1.5;
      ctx.globalAlpha = 0.7;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // 连线类型标签
      const mx = (fx + tx) / 2;
      const my = (fy + ty) / 2;
      ctx.fillStyle = COLORS.inkMuted;
      ctx.font = '10px serif';
      ctx.textAlign = 'center';
      let label = '';
      if (edge.type === EDGE_TYPES.MASTERMIND) label = '主谋';
      if (edge.type === EDGE_TYPES.ACCOMPLICE) label = '参与';
      if (edge.type === EDGE_TYPES.TARGET) label = '目标';
      ctx.fillText(label, mx, my - 3);
    });

    // 绘制节点
    nodes.forEach(node => {
      const isSelected = view.selectedNodeId === node.id;
      const isHover = view.hoverNodeId === node.id;

      if (node.type === NODE_TYPES.CONSPIRACY) {
        // 菱形：密谋节点
        const cx = node.x + node.width / 2;
        const cy = node.y + node.height / 2;
        const color = STATUS_COLORS[node.status] || COLORS.inkMuted;

        ctx.beginPath();
        ctx.moveTo(cx, node.y);
        ctx.lineTo(node.x + node.width, cy);
        ctx.lineTo(cx, node.y + node.height);
        ctx.lineTo(node.x, cy);
        ctx.closePath();
        ctx.fillStyle = color + '22'; // 透明度
        ctx.fill();
        ctx.strokeStyle = isSelected ? COLORS.gold : color;
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();

        // 标签
        ctx.fillStyle = COLORS.ink;
        ctx.font = 'bold 11px serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, cx, cy + 4);

      } else if (node.type === NODE_TYPES.NPC) {
        // 圆形：NPC节点
        const cx = node.x;
        const cy = node.y;
        const r = node.radius || 22;

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        const fillColor = node.role === 'mastermind' ? COLORS.gold + '25' : COLORS.blue + '18';
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = isSelected ? COLORS.gold : (node.role === 'mastermind' ? COLORS.gold : COLORS.blue);
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();

        // 标签
        ctx.fillStyle = COLORS.ink;
        ctx.font = '10px serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, cx, cy + r + 14);

        // 角色标记
        if (node.role === 'mastermind') {
          ctx.fillStyle = COLORS.gold;
          ctx.font = 'bold 9px serif';
          ctx.fillText('★', cx, cy - r - 6);
        }

      } else if (node.type === NODE_TYPES.TARGET) {
        // 方形：目标节点
        const pad = 4;
        ctx.fillStyle = COLORS.red + '15';
        ctx.fillRect(node.x - pad, node.y - pad, node.width + pad * 2, node.height + pad * 2);
        ctx.strokeStyle = isSelected ? COLORS.gold : COLORS.red;
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.strokeRect(node.x - pad, node.y - pad, node.width + pad * 2, node.height + pad * 2);

        // 标签
        ctx.fillStyle = COLORS.ink;
        ctx.font = 'bold 11px serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x + node.width / 2, node.y + node.height / 2 + 4);
      }
    });

    ctx.restore();
  }

  /**
   * 绑定Canvas交互事件
   * @param {HTMLCanvasElement} canvas - Canvas元素
   */
  function _bindCanvasEvents(canvas) {
    if (!canvas) return;
    const view = state.networkView;

    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - view.offsetX) / view.scale;
      const y = (e.clientY - rect.top - view.offsetY) / view.scale;

      // 检测点击的节点
      const { nodes } = _buildNetworkData();
      let clickedNode = null;
      for (const node of nodes) {
        if (node.type === NODE_TYPES.NPC) {
          const dx = x - node.x;
          const dy = y - node.y;
          if (dx * dx + dy * dy < (node.radius || 22) ** 2) {
            clickedNode = node;
            break;
          }
        } else {
          if (x >= node.x && x <= node.x + (node.width || 80) &&
              y >= node.y && y <= node.y + (node.height || 60)) {
            clickedNode = node;
            break;
          }
        }
      }

      if (clickedNode) {
        view.selectedNodeId = clickedNode.id;
        view.isDragging = true;
        view.lastMouseX = e.clientX;
        view.lastMouseY = e.clientY;
        _renderNetworkCanvas(canvas);
        // 显示详情
        _showNodeDetails(clickedNode);
      } else {
        view.isPanning = true;
        view.lastMouseX = e.clientX;
        view.lastMouseY = e.clientY;
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - view.offsetX) / view.scale;
      const y = (e.clientY - rect.top - view.offsetY) / view.scale;

      if (view.isDragging && view.selectedNodeId) {
        // 拖拽节点（简化：仅更新显示）
        view.lastMouseX = e.clientX;
        view.lastMouseY = e.clientY;
        _renderNetworkCanvas(canvas);
      } else if (view.isPanning) {
        const dx = e.clientX - view.lastMouseX;
        const dy = e.clientY - view.lastMouseY;
        view.offsetX += dx;
        view.offsetY += dy;
        view.lastMouseX = e.clientX;
        view.lastMouseY = e.clientY;
        _renderNetworkCanvas(canvas);
      } else {
        // hover检测
        const { nodes } = _buildNetworkData();
        let hoverNode = null;
        for (const node of nodes) {
          if (node.type === NODE_TYPES.NPC) {
            const dx = x - node.x;
            const dy = y - node.y;
            if (dx * dx + dy * dy < (node.radius || 22) ** 2) {
              hoverNode = node;
              break;
            }
          } else {
            if (x >= node.x && x <= node.x + (node.width || 80) &&
                y >= node.y && y <= node.y + (node.height || 60)) {
              hoverNode = node;
              break;
            }
          }
        }
        if (hoverNode && view.hoverNodeId !== hoverNode.id) {
          view.hoverNodeId = hoverNode.id;
          _renderNetworkCanvas(canvas);
        } else if (!hoverNode && view.hoverNodeId) {
          view.hoverNodeId = null;
          _renderNetworkCanvas(canvas);
        }
      }
    });

    canvas.addEventListener('mouseup', () => {
      view.isDragging = false;
      view.isPanning = false;
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      view.scale = Math.max(0.3, Math.min(3, view.scale * delta));
      _renderNetworkCanvas(canvas);
    });
  }

  /**
   * 显示节点详情（网络图点击后）
   * @param {Object} node - 节点对象
   */
  function _showNodeDetails(node) {
    const panel = document.getElementById('conspiracy-detail-panel');
    if (!panel) return;

    if (node.type === NODE_TYPES.CONSPIRACY) {
      const c = state.conspiracies.find(con => con.id === node.id);
      if (c) renderConspiracyDetail(c.id);
    } else if (node.type === NODE_TYPES.NPC) {
      const npc = _getNPC(node.id);
      if (npc) {
        panel.innerHTML = `
          <div style="padding:12px;">
            <h4 style="color:${COLORS.gold};margin-bottom:8px;">${npc.name || '未知'}</h4>
            <p style="color:${COLORS.inkMuted};font-size:13px;">
              ${node.role === 'mastermind' ? '★ 主谋' : '参与密谋'}
            </p>
            <div style="margin-top:12px;">
              <h5 style="font-size:13px;color:${COLORS.inkLight};margin-bottom:6px;">相关密谋</h5>
              ${state.conspiracies.filter(c =>
                c.mastermind === node.id || c.accomplices.includes(node.id)
              ).map(c => `
                <div style="padding:6px 8px;background:${COLORS.parchmentLight};border-radius:4px;margin-bottom:4px;cursor:pointer;"
                     onclick="ConspiracySystem.renderConspiracyDetail('${c.id}')">
                  <span style="font-size:12px;color:${COLORS.ink};">${c.name}</span>
                  <span style="font-size:11px;color:${STATUS_COLORS[c.status]};float:right;">${STATUS_LABELS[c.status]}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }
    }
  }

  // ==================== 历史与统计 ====================

  /**
   * 获取密谋统计信息
   * @returns {Object} 统计数据
   */
  function _getStatistics() {
    const stats = {
      total: state.conspiracies.length,
      byStatus: {},
      byType: {},
      byNPC: {},
      successRate: 0,
      exposureRate: 0
    };

    state.conspiracies.forEach(c => {
      // 按状态统计
      stats.byStatus[c.status] = (stats.byStatus[c.status] || 0) + 1;
      // 按类型统计
      stats.byType[c.type] = (stats.byType[c.type] || 0) + 1;
      // 按主谋统计
      stats.byNPC[c.mastermind] = (stats.byNPC[c.mastermind] || 0) + 1;
    });

    const completed = state.conspiracies.filter(c => c.status === STATUS.COMPLETED).length;
    const exposed = state.conspiracies.filter(c => c.status === STATUS.EXPOSED).length;
    const finished = state.conspiracies.filter(c =>
      c.status === STATUS.COMPLETED || c.status === STATUS.FAILED || c.status === STATUS.EXPOSED
    ).length;

    stats.successRate = finished > 0 ? (completed / finished) : 0;
    stats.exposureRate = state.conspiracies.length > 0 ? (exposed / state.conspiracies.length) : 0;

    return stats;
  }

  /**
   * 获取密谋历史记录（按状态分类）
   * @param {string} statusFilter - 状态过滤
   * @returns {Array} 密谋列表
   */
  function _getHistory(statusFilter) {
    let list = _deepClone(state.conspiracies);
    if (statusFilter) {
      list = list.filter(c => c.status === statusFilter);
    }
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }

  // ==================== 外部系统联动接口 ====================

  /**
   * 与NPCBehavior联动：当NPC执行密谋时改变行为
   * @param {string} npcId - NPC标识
   * @param {string} action - 行为类型
   * @param {Object} data - 行为数据
   */
  function _onNPCBehaviorEvent(npcId, action, data) {
    if (action === 'conspiracy_execute' && data.location) {
      // 通知NPCBehavior系统改变NPC位置
      if (typeof NPCBehavior !== 'undefined' && NPCBehavior.setNPCLocation) {
        NPCBehavior.setNPCLocation(npcId, data.location);
      }
    }
  }

  /**
   * 与FamilySystem联动：家族内部密谋
   * @param {string} familyId - 家族标识
   * @returns {Array} 该家族相关密谋
   */
  function _getFamilyConspiracies(familyId) {
    // 若FamilySystem存在，获取家族成员
    let familyNPCs = [];
    if (typeof FamilySystem !== 'undefined' && FamilySystem.getFamilyMembers) {
      familyNPCs = FamilySystem.getFamilyMembers(familyId);
    }
    if (familyNPCs.length === 0) return [];

    const ids = familyNPCs.map(n => n.id);
    return state.conspiracies.filter(c =>
      ids.includes(c.mastermind) ||
      c.accomplices.some(aid => ids.includes(aid)) ||
      ids.includes(c.target)
    );
  }

  /**
   * 与PoliticalSystem联动：势力间密谋
   * @param {string} factionId - 势力标识
   * @returns {Array} 该势力相关密谋
   */
  function _getFactionConspiracies(factionId) {
    let factionNPCs = [];
    if (typeof PoliticalSystem !== 'undefined' && PoliticalSystem.getFactionMembers) {
      factionNPCs = PoliticalSystem.getFactionMembers(factionId);
    }
    if (factionNPCs.length === 0) return [];

    const ids = factionNPCs.map(n => n.id);
    return state.conspiracies.filter(c =>
      ids.includes(c.mastermind) ||
      c.accomplices.some(aid => ids.includes(aid)) ||
      ids.includes(c.target)
    );
  }

  /**
   * 与WorldviewEngine联动：根据世界观调整密谋类型
   * @returns {Array} 当前世界观下可用的密谋类型
   */
  function _getWorldviewConspiracyTypes() {
    let worldview = 'ancient'; // 默认古风
    if (typeof WorldviewEngine !== 'undefined' && WorldviewEngine.getWorldview) {
      worldview = WorldviewEngine.getWorldview();
    } else {
      worldview = Storage.get('worldview', 'ancient');
    }

    const typeMap = {
      ancient: [CONSPIRACY_TYPES.ASSASSINATION, CONSPIRACY_TYPES.USURPATION, CONSPIRACY_TYPES.FRAMING,
               CONSPIRACY_TYPES.THEFT, CONSPIRACY_TYPES.SABOTAGE, CONSPIRACY_TYPES.TREASON, CONSPIRACY_TYPES.MARRIAGE],
      wuxia: [CONSPIRACY_TYPES.ASSASSINATION, CONSPIRACY_TYPES.USURPATION, CONSPIRACY_TYPES.FRAMING,
              CONSPIRACY_TYPES.THEFT, CONSPIRACY_TYPES.SABOTAGE, CONSPIRACY_TYPES.TREASON],
      scifi: [CONSPIRACY_TYPES.ASSASSINATION, CONSPIRACY_TYPES.USURPATION, CONSPIRACY_TYPES.SABOTAGE,
              CONSPIRACY_TYPES.TREASON, CONSPIRACY_TYPES.THEFT],
      modern: [CONSPIRACY_TYPES.FRAMING, CONSPIRACY_TYPES.THEFT, CONSPIRACY_TYPES.SABOTAGE,
               CONSPIRACY_TYPES.TREASON, CONSPIRACY_TYPES.MARRIAGE],
      fantasy: [CONSPIRACY_TYPES.ASSASSINATION, CONSPIRACY_TYPES.USURPATION, CONSPIRACY_TYPES.FRAMING,
                CONSPIRACY_TYPES.SABOTAGE, CONSPIRACY_TYPES.TREASON, CONSPIRACY_TYPES.MARRIAGE]
    };

    return typeMap[worldview] || typeMap.ancient;
  }

  // ==================== UI渲染 ====================

  /**
   * 渲染密谋系统主页面
   */
  function _renderPage() {
    const page = document.getElementById('page-conspiracy');
    if (!page) return;

    page.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;background:${COLORS.parchment};">
        <!-- 顶部工具栏 -->
        <div style="padding:12px 16px;border-bottom:1px solid ${COLORS.borderLight};display:flex;
                    justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <h2 style="margin:0;color:${COLORS.ink};font-size:18px;">🕸️ 密谋暗网</h2>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="ConspiracySystem.createConspiracy()">➕ 新建密谋</button>
            <button class="btn btn-sm btn-secondary" onclick="ConspiracySystem.openInvestigation()">🔍 调查</button>
            <button class="btn btn-sm btn-secondary" onclick="ConspiracySystem.openNetwork()">🕸️ 密谋网络</button>
            <button class="btn btn-sm btn-secondary" onclick="ConspiracySystem.showHistory()">📜 历史</button>
          </div>
        </div>

        <!-- 主体区域：三栏布局 -->
        <div style="display:flex;flex:1;overflow:hidden;">
          <!-- 左侧：进行中的密谋列表 -->
          <div style="width:260px;border-right:1px solid ${COLORS.borderLight};overflow-y:auto;background:${COLORS.parchmentLight};">
            <div style="padding:12px 14px;">
              <h4 style="font-size:14px;color:${COLORS.inkLight};margin:0 0 10px 0;">进行中的密谋</h4>
              <div id="conspiracy-list">${_renderConspiracyList()}</div>
            </div>
          </div>

          <!-- 中间：密谋详情面板 -->
          <div id="conspiracy-detail-panel" style="flex:1;overflow-y:auto;padding:16px;background:${COLORS.parchment};">
            ${_renderEmptyDetail()}
          </div>

          <!-- 右侧：NPC嫌疑人列表 -->
          <div style="width:220px;border-left:1px solid ${COLORS.borderLight};overflow-y:auto;background:${COLORS.parchmentLight};">
            <div style="padding:12px 14px;">
              <h4 style="font-size:14px;color:${COLORS.inkLight};margin:0 0 10px 0;">嫌疑人</h4>
              <div id="suspect-list">${_renderSuspectList()}</div>
            </div>
          </div>
        </div>

        <!-- 底部：密谋网络Canvas -->
        <div style="height:200px;border-top:1px solid ${COLORS.borderLight};position:relative;background:${COLORS.parchment};">
          <div style="position:absolute;top:4px;left:8px;font-size:12px;color:${COLORS.inkMuted};z-index:2;">密谋关系网络</div>
          <canvas id="conspiracy-network-canvas" style="width:100%;height:100%;display:block;"></canvas>
        </div>
      </div>
    `;

    // 初始化Canvas
    setTimeout(() => {
      const canvas = document.getElementById('conspiracy-network-canvas');
      if (canvas) {
        _bindCanvasEvents(canvas);
        _renderNetworkCanvas(canvas);
      }
    }, 50);
  }

  /**
   * 渲染空详情面板
   * @returns {string} HTML字符串
   */
  function _renderEmptyDetail() {
    return `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:${COLORS.inkMuted};">
        <div style="font-size:48px;margin-bottom:12px;">🕸️</div>
        <p>选择一个密谋查看详情</p>
        <p style="font-size:12px;">或点击「新建密谋」开始策划</p>
      </div>
    `;
  }

  /**
   * 渲染密谋列表（左侧）
   * @returns {string} HTML字符串
   */
  function _renderConspiracyList() {
    const activeConspiracies = state.conspiracies.filter(c =>
      c.status === STATUS.PLANNING || c.status === STATUS.ACTIVE
    );

    if (activeConspiracies.length === 0) {
      return `<div style="text-align:center;color:${COLORS.inkMuted};padding:20px 0;font-size:12px;">暂无进行中的密谋</div>`;
    }

    return activeConspiracies.map(c => {
      const mastermind = _getNPC(c.mastermind);
      const completedSteps = c.steps.filter(s => s.completed).length;
      const totalSteps = c.steps.length;
      const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

      return `
        <div style="padding:10px 12px;background:#fff;border-radius:6px;margin-bottom:8px;cursor:pointer;
                    border:1px solid ${COLORS.borderLight};transition:all 0.2s;"
             onmouseover="this.style.borderColor='${COLORS.gold}'"
             onmouseout="this.style.borderColor='${COLORS.borderLight}'"
             onclick="ConspiracySystem.renderConspiracyDetail('${c.id}')">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <span style="font-size:13px;font-weight:500;color:${COLORS.ink};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;">${c.name}</span>
            <span style="font-size:11px;padding:2px 6px;border-radius:10px;background:${STATUS_COLORS[c.status]}22;color:${STATUS_COLORS[c.status]};">${STATUS_LABELS[c.status]}</span>
          </div>
          <div style="font-size:11px;color:${COLORS.inkMuted};margin-bottom:6px;">
            主谋：${mastermind ? mastermind.name : '未知'}
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="flex:1;height:4px;background:${COLORS.borderLight};border-radius:2px;overflow:hidden;">
              <div style="width:${progress}%;height:100%;background:${STATUS_COLORS[c.status]};transition:width 0.3s;"></div>
            </div>
            <span style="font-size:10px;color:${COLORS.inkMuted};white-space:nowrap;">${completedSteps}/${totalSteps}</span>
          </div>
          <div style="margin-top:4px;font-size:10px;color:${COLORS.red};">
            风险：${c.discoveryRisk}%
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * 渲染嫌疑人列表（右侧）
   * @returns {string} HTML字符串
   */
  function _renderSuspectList() {
    const npcs = _getNPCs();
    if (npcs.length === 0) {
      return `<div style="text-align:center;color:${COLORS.inkMuted};padding:20px 0;font-size:12px;">暂无NPC数据</div>`;
    }

    // 按可疑行为数量排序
    const sorted = npcs.map(npc => {
      const suspiciousCount = state.suspiciousBehaviors.filter(b => b.npcId === npc.id && !b.discovered).length;
      const involvedConspiracies = state.conspiracies.filter(c =>
        (c.mastermind === npc.id || c.accomplices.includes(npc.id)) &&
        c.status !== STATUS.EXPOSED
      ).length;
      return { npc, suspiciousCount, involvedConspiracies };
    }).sort((a, b) => (b.suspiciousCount + b.involvedConspiracies) - (a.suspiciousCount + a.involvedConspiracies));

    return sorted.map(({ npc, suspiciousCount, involvedConspiracies }) => {
      const isSuspicious = suspiciousCount > 0 || involvedConspiracies > 0;
      return `
        <div style="padding:8px 10px;background:${isSuspicious ? COLORS.red + '08' : '#fff'};border-radius:6px;
                    margin-bottom:6px;border:1px solid ${isSuspicious ? COLORS.red + '30' : COLORS.borderLight};cursor:pointer;"
             onclick="ConspiracySystem.observeNPC('${npc.id}')">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:12px;color:${COLORS.ink};">${npc.name || '?'}</span>
            ${isSuspicious ? `<span style="font-size:10px;color:${COLORS.red};">!</span>` : ''}
          </div>
          ${suspiciousCount > 0 ? `<div style="font-size:10px;color:${COLORS.red};margin-top:2px;">${suspiciousCount}条可疑行为</div>` : ''}
          ${involvedConspiracies > 0 ? `<div style="font-size:10px;color:${COLORS.inkMuted};margin-top:2px;">参与${involvedConspiracies}个密谋</div>` : ''}
        </div>
      `;
    }).join('');
  }

  /**
   * 渲染密谋详情（中间面板）
   * @param {string} conspiracyId - 密谋标识
   * @returns {string} HTML字符串
   */
  function _renderConspiracyDetailHTML(conspiracyId) {
    const c = state.conspiracies.find(con => con.id === conspiracyId);
    if (!c) return _renderEmptyDetail();

    const mastermind = _getNPC(c.mastermind);
    const target = _getNPC(c.target);
    const typeLabel = TYPE_LABELS[c.type] || c.type;
    const statusLabel = STATUS_LABELS[c.status] || c.status;
    const statusColor = STATUS_COLORS[c.status] || COLORS.inkMuted;

    return `
      <div style="max-width:600px;">
        <!-- 密谋头部信息 -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
          <div>
            <h3 style="margin:0 0 6px 0;color:${COLORS.ink};font-size:18px;">${c.name}</h3>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <span style="font-size:12px;padding:3px 10px;border-radius:12px;background:${TYPE_COLORS[c.type]}22;color:${TYPE_COLORS[c.type]};">${typeLabel}</span>
              <span style="font-size:12px;padding:3px 10px;border-radius:12px;background:${statusColor}22;color:${statusColor};">${statusLabel}</span>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:12px;color:${COLORS.inkMuted};">保密等级</div>
            <div style="font-size:20px;color:${COLORS.gold};font-weight:bold;">${c.secrecy}/10</div>
          </div>
        </div>

        <!-- 关键人员 -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:16px;">
          <div style="padding:10px;background:${COLORS.parchmentLight};border-radius:8px;border:1px solid ${COLORS.borderLight};">
            <div style="font-size:11px;color:${COLORS.inkMuted};margin-bottom:4px;">主谋</div>
            <div style="font-size:14px;color:${COLORS.gold};font-weight:500;">${mastermind ? mastermind.name : '未知'}</div>
          </div>
          <div style="padding:10px;background:${COLORS.parchmentLight};border-radius:8px;border:1px solid ${COLORS.borderLight};">
            <div style="font-size:11px;color:${COLORS.inkMuted};margin-bottom:4px;">目标</div>
            <div style="font-size:14px;color:${COLORS.red};font-weight:500;">${target ? target.name : '未知'}</div>
          </div>
          <div style="padding:10px;background:${COLORS.parchmentLight};border-radius:8px;border:1px solid ${COLORS.borderLight};">
            <div style="font-size:11px;color:${COLORS.inkMuted};margin-bottom:4px;">被发现风险</div>
            <div style="font-size:14px;color:${c.discoveryRisk > 50 ? COLORS.red : COLORS.ink};font-weight:500;">${c.discoveryRisk}%</div>
          </div>
        </div>

        <!-- 参与者 -->
        <div style="margin-bottom:16px;">
          <h4 style="font-size:14px;color:${COLORS.inkLight};margin:0 0 8px 0;">参与者</h4>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${c.accomplices.map(aid => {
              const a = _getNPC(aid);
              return `<span style="padding:4px 10px;background:${COLORS.blue}12;color:${COLORS.blue};border-radius:12px;font-size:12px;">${a ? a.name : '?'}</span>`;
            }).join('')}
            ${c.accomplices.length === 0 ? '<span style="font-size:12px;color:${COLORS.inkMuted};">暂无参与者</span>' : ''}
          </div>
        </div>

        <!-- 目的 -->
        <div style="padding:10px;background:${COLORS.parchmentLight};border-radius:8px;border-left:3px solid ${COLORS.gold};margin-bottom:16px;">
          <div style="font-size:12px;color:${COLORS.inkMuted};margin-bottom:4px;">密谋目的</div>
          <div style="font-size:14px;color:${COLORS.ink};">${c.goal || '未设定'}</div>
        </div>

        <!-- 步骤列表 -->
        <div style="margin-bottom:16px;">
          <h4 style="font-size:14px;color:${COLORS.inkLight};margin:0 0 10px 0;">计划步骤</h4>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${c.steps.map((step, i) => {
              const isDone = step.completed;
              const isSuccess = step.success;
              const stepColor = isDone ? (isSuccess ? COLORS.green : COLORS.red) : COLORS.inkMuted;
              const stepBg = isDone ? (isSuccess ? COLORS.green + '10' : COLORS.red + '10') : COLORS.parchmentLight;
              return `
                <div style="display:flex;gap:10px;padding:10px;background:${stepBg};border-radius:6px;border:1px solid ${stepColor + '30'};">
                  <div style="width:24px;height:24px;border-radius:50%;background:${stepColor}22;color:${stepColor};
                              display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;flex-shrink:0;">
                    ${isDone ? (isSuccess ? '✓' : '✗') : (i + 1)}
                  </div>
                  <div style="flex:1;">
                    <div style="font-size:13px;color:${COLORS.ink};margin-bottom:2px;">${step.action}</div>
                    <div style="font-size:11px;color:${COLORS.inkMuted};">
                      ${step.time ? `⏰ ${step.time}` : ''} ${step.location ? `📍 ${step.location}` : ''}
                      ${step.resources && step.resources.length > 0 ? ` · 需：${step.resources.join('、')}` : ''}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- AI生成描述 -->
        <div style="padding:12px;background:${COLORS.parchmentLight};border-radius:8px;border:1px solid ${COLORS.borderLight};margin-bottom:16px;">
          <div style="font-size:12px;color:${COLORS.inkMuted};margin-bottom:6px;">📖 密谋背景</div>
          <div style="font-size:13px;color:${COLORS.ink};line-height:1.6;font-style:italic;">
            ${_generateAIDescription(c)}
          </div>
        </div>

        <!-- 操作按钮 -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${c.status === STATUS.PLANNING || c.status === STATUS.ACTIVE ? `
            <button class="btn btn-sm btn-primary" onclick="ConspiracySystem.executeStep('${c.id}')">▶️ 执行下一步</button>
            <button class="btn btn-sm btn-secondary" onclick="ConspiracySystem.investigate('${c.id}')">🔍 调查此密谋</button>
            <button class="btn btn-sm btn-secondary" onclick="ConspiracySystem.expose('${c.id}')">📢 公开暴露</button>
            <button class="btn btn-sm" style="background:${COLORS.red}22;color:${COLORS.red};" onclick="ConspiracySystem.sabotage('${c.id}')">🛑 暗中破坏</button>
          ` : ''}
          ${c.status === STATUS.EXPOSED ? `
            <button class="btn btn-sm btn-secondary" onclick="ConspiracySystem.useExposed('${c.id}')">💡 利用情报</button>
          ` : ''}
        </div>
      </div>
    `;
  }

  // ==================== 公开API ====================

  const api = {

    // ----- 初始化 -----

    /**
     * 初始化密谋系统
     */
    init() {
      _load();
      state.isInitialized = true;
      console.log('[ConspiracySystem] 密谋系统已初始化');
    },

    /**
     * 进入密谋系统页面时调用
     */
    onEnter() {
      if (!state.isInitialized) this.init();
      _renderPage();
    },

    // ----- 密谋CRUD -----

    /**
     * 获取所有密谋
     * @returns {Array} 密谋列表
     */
    getConspiracies() {
      return _deepClone(state.conspiracies);
    },

    /**
     * 获取单个密谋
     * @param {string} id - 密谋标识
     * @returns {Object|null}
     */
    getConspiracy(id) {
      const c = state.conspiracies.find(con => con.id === id);
      return c ? _deepClone(c) : null;
    },

    /**
     * 玩家手动创建密谋
     */
    createConspiracy() {
      const name = prompt('密谋名称：');
      if (!name) return;

      const typeKeys = Object.keys(TYPE_LABELS);
      const typeStr = prompt('密谋类型（' + typeKeys.map(k => `${k}=${TYPE_LABELS[k]}`).join(', ') + '）：', 'framing');
      const type = typeKeys.includes(typeStr) ? typeStr : CONSPIRACY_TYPES.FRAMING;

      const npcs = _getNPCs();
      const mastermindId = prompt('主谋NPC ID（留空则玩家为主谋）：', npcs[0] ? npcs[0].id : '');
      const targetId = prompt('目标NPC ID：', npcs[1] ? npcs[1].id : '');

      const conspiracy = _createConspiracyObject({
        name,
        type,
        mastermind: mastermindId || 'player',
        target: targetId || '',
        goal: `${TYPE_LABELS[type]}${targetId ? (_getNPC(targetId)?.name || '目标') : '某人'}`,
        steps: [
          { time: '子时', location: '密室', action: '密谋策划', resources: ['时间'], baseSuccessRate: 0.8 },
          { time: '午时', location: '目标附近', action: '执行计划', resources: ['人手'], baseSuccessRate: 0.6 }
        ],
        secrecy: 5,
        discoveryRisk: 25
      });

      state.conspiracies.push(conspiracy);
      _save();
      _renderPage();
      return conspiracy.id;
    },

    /**
     * NPC自主创建密谋（AI驱动）
     * @param {string} npcId - 主谋NPC标识
     * @returns {Object|null}
     */
    npcCreateConspiracy(npcId) {
      const result = _npcCreateConspiracy(npcId);
      if (result && state.settings.notifyPlayer) {
        // 这里可以触发通知系统
        console.log(`[ConspiracySystem] NPC ${npcId} 创建了新密谋：${result.name}`);
      }
      return result;
    },

    /**
     * AI批量生成密谋（基于当前NPC群体）
     * @param {number} count - 生成数量
     * @returns {Array} 生成的密谋列表
     */
    aiGenerateConspiracies(count) {
      const npcs = _getNPCs();
      const created = [];
      for (let i = 0; i < count && i < npcs.length; i++) {
        const c = _npcCreateConspiracy(npcs[i].id);
        if (c) created.push(c);
      }
      return created;
    },

    /**
     * 删除密谋
     * @param {string} id - 密谋标识
     */
    deleteConspiracy(id) {
      if (!confirm('确定删除此密谋？')) return;
      state.conspiracies = state.conspiracies.filter(c => c.id !== id);
      _save();
      _renderPage();
    },

    // ----- 密谋执行 -----

    /**
     * 执行密谋的下一步
     * @param {string} id - 密谋标识
     * @returns {Object|null}
     */
    executeStep(id) {
      const result = _executeStep(id);
      if (result) {
        if (result.exposed) {
          alert('密谋行动失败且已被暴露！');
        } else if (result.completed) {
          alert('密谋已完成！');
        }
      }
      _renderPage();
      return result;
    },

    /**
     * 自动执行所有进行中的密谋（按游戏时辰触发）
     */
    autoExecute() {
      _autoExecuteConspiracies();
      _renderPage();
    },

    // ----- 发现与调查 -----

    /**
     * 观察NPC获取线索
     * @param {string} npcId - NPC标识
     * @returns {Object|null}
     */
    observeNPC(npcId) {
      const clue = _discoverClueByObservation(npcId);
      if (clue) {
        // 自动关联到调查
        const investigation = state.investigations.find(i => i.conspiracyId === clue.conspiracyId);
        if (investigation) {
          _addInvestigationClue(investigation.id, clue);
          alert(`发现线索！\n${clue.description}\n调查进度：${investigation.progress}%`);
        } else {
          // 创建新调查
          const inv = _startInvestigation(clue.conspiracyId);
          _addInvestigationClue(inv.id, clue);
          alert(`发现新密谋线索！已自动开始调查。\n${clue.description}\n调查进度：${inv.progress}%`);
        }
      } else {
        alert('观察了一段时间，未发现异常。');
      }
      _renderPage();
      return clue;
    },

    /**
     * 开始对密谋进行调查
     * @param {string} conspiracyId - 密谋标识
     */
    investigate(conspiracyId) {
      const inv = _startInvestigation(conspiracyId);
      alert(`已开始调查「${this.getConspiracy(conspiracyId)?.name || '未知密谋'}」\n当前进度：${inv.progress}%`);
      _renderPage();
    },

    /**
     * 审问嫌疑人
     * @param {string} npcId - NPC标识
     * @param {string} investigationId - 调查标识
     */
    interrogate(npcId, investigationId) {
      const result = _interrogateSuspect(npcId, investigationId);
      if (result) {
        if (result.success) {
          alert(`${_getNPC(npcId)?.name || '嫌疑人'}招供了！\n调查进度大幅提升。`);
        } else {
          alert(result.message);
        }
      }
      _renderPage();
    },

    /**
     * 监视目标
     * @param {string} npcId - NPC标识
     * @param {string} investigationId - 调查标识
     */
    surveillance(npcId, investigationId) {
      const result = _surveillanceTarget(npcId, investigationId);
      if (result) {
        if (result.success) {
          alert(`监视发现线索！\n${result.clue.description}`);
        } else {
          alert(result.message);
        }
      }
      _renderPage();
    },

    // ----- 暴露与破坏 -----

    /**
     * 玩家公开暴露密谋
     * @param {string} conspiracyId - 密谋标识
     */
    expose(conspiracyId) {
      if (!confirm('确定公开暴露此密谋？这将影响所有相关NPC的声望。')) return;
      _exposeConspiracy(conspiracyId, 'player');
      alert('密谋已暴露！');
      _renderPage();
    },

    /**
     * 玩家暗中破坏密谋
     * @param {string} conspiracyId - 密谋标识
     */
    sabotage(conspiracyId) {
      const c = state.conspiracies.find(con => con.id === conspiracyId);
      if (!c) return;

      // 增加发现风险并降低成功率
      c.discoveryRisk = Math.min(100, c.discoveryRisk + 30);
      c.steps.forEach(s => {
        if (!s.completed) s.baseSuccessRate = Math.max(0.05, (s.baseSuccessRate || 0.5) - 0.2);
      });

      c.playerInvolvement = c.playerInvolvement || {};
      c.playerInvolvement.involvementType = 'saboteur';
      c.playerInvolvement.actions.push({ action: 'sabotage', time: _getGameTime() });

      _save();
      alert('你暗中破坏了密谋，其被发现风险大增！');
      _renderPage();
    },

    /**
     * 利用已暴露的密谋情报
     * @param {string} conspiracyId - 密谋标识
     */
    useExposed(conspiracyId) {
      const c = state.conspiracies.find(con => con.id === conspiracyId);
      if (!c) return;
      alert(`利用「${c.name}」的情报，你可以：\n1. 威胁主谋获取利益\n2. 向目标示好获取信任\n3. 向势力举报获取声望`);
    },

    // ----- 调查管理 -----

    /**
     * 打开调查面板
     */
    openInvestigation() {
      const panel = document.getElementById('conspiracy-detail-panel');
      if (!panel) return;

      const investigations = state.investigations;
      panel.innerHTML = `
        <div style="max-width:600px;">
          <h3 style="margin:0 0 16px 0;color:${COLORS.ink};">🔍 调查记录</h3>
          ${investigations.length === 0 ? `<p style="color:${COLORS.inkMuted};">暂无调查记录</p>` : ''}
          ${investigations.map(inv => {
            const c = state.conspiracies.find(con => con.id === inv.conspiracyId);
            return `
              <div style="padding:12px;background:${COLORS.parchmentLight};border-radius:8px;border:1px solid ${COLORS.borderLight};margin-bottom:10px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                  <span style="font-weight:500;color:${COLORS.ink};">${c ? c.name : '未知密谋'}</span>
                  <span style="font-size:12px;color:${inv.status === 'completed' ? COLORS.green : COLORS.gold};">
                    ${inv.status === 'completed' ? '已完成' : '调查中'}
                  </span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                  <div style="flex:1;height:6px;background:${COLORS.borderLight};border-radius:3px;overflow:hidden;">
                    <div style="width:${inv.progress}%;height:100%;background:${inv.status === 'completed' ? COLORS.green : COLORS.gold};"></div>
                  </div>
                  <span style="font-size:12px;color:${COLORS.inkMuted};">${inv.progress}%</span>
                </div>
                <div style="font-size:12px;color:${COLORS.inkMuted};">
                  线索数：${inv.clues.length} · 开始于：${new Date(inv.startedAt).toLocaleDateString()}
                </div>
                ${inv.clues.length > 0 ? `
                  <div style="margin-top:8px;padding-top:8px;border-top:1px solid ${COLORS.borderLight};">
                    ${inv.clues.map(clue => `
                      <div style="font-size:12px;color:${COLORS.inkLight};padding:3px 0;">
                        · ${clue.description}
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `;
    },

    // ----- 网络可视化 -----

    /**
     * 打开密谋网络视图
     */
    openNetwork() {
      _renderPage();
      // 高亮Canvas区域
      const canvas = document.getElementById('conspiracy-network-canvas');
      if (canvas) {
        canvas.scrollIntoView({ behavior: 'smooth' });
      }
    },

    /**
     * 渲染密谋详情到中间面板
     * @param {string} conspiracyId - 密谋标识
     */
    renderConspiracyDetail(conspiracyId) {
      const panel = document.getElementById('conspiracy-detail-panel');
      if (!panel) return;
      panel.innerHTML = _renderConspiracyDetailHTML(conspiracyId);
    },

    /**
     * 刷新Canvas网络图
     */
    refreshNetwork() {
      const canvas = document.getElementById('conspiracy-network-canvas');
      if (canvas) _renderNetworkCanvas(canvas);
    },

    // ----- 历史与统计 -----

    /**
     * 显示密谋历史
     */
    showHistory() {
      const panel = document.getElementById('conspiracy-detail-panel');
      if (!panel) return;

      const stats = _getStatistics();
      const history = _getHistory();

      panel.innerHTML = `
        <div style="max-width:600px;">
          <h3 style="margin:0 0 16px 0;color:${COLORS.ink};">📜 密谋历史</h3>

          <!-- 统计卡片 -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:20px;">
            <div style="padding:10px;background:${COLORS.parchmentLight};border-radius:8px;text-align:center;border:1px solid ${COLORS.borderLight};">
              <div style="font-size:22px;color:${COLORS.gold};font-weight:bold;">${stats.total}</div>
              <div style="font-size:11px;color:${COLORS.inkMuted};">总密谋数</div>
            </div>
            <div style="padding:10px;background:${COLORS.parchmentLight};border-radius:8px;text-align:center;border:1px solid ${COLORS.borderLight};">
              <div style="font-size:22px;color:${COLORS.green};font-weight:bold;">${Math.round(stats.successRate * 100)}%</div>
              <div style="font-size:11px;color:${COLORS.inkMuted};">成功率</div>
            </div>
            <div style="padding:10px;background:${COLORS.parchmentLight};border-radius:8px;text-align:center;border:1px solid ${COLORS.borderLight};">
              <div style="font-size:22px;color:${COLORS.red};font-weight:bold;">${Math.round(stats.exposureRate * 100)}%</div>
              <div style="font-size:11px;color:${COLORS.inkMuted};">暴露率</div>
            </div>
          </div>

          <!-- 状态分布 -->
          <div style="margin-bottom:16px;">
            <h4 style="font-size:14px;color:${COLORS.inkLight};margin:0 0 8px 0;">状态分布</h4>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              ${Object.entries(stats.byStatus).map(([status, count]) => `
                <span style="padding:4px 10px;border-radius:12px;font-size:12px;background:${STATUS_COLORS[status]}22;color:${STATUS_COLORS[status]};">
                  ${STATUS_LABELS[status]} ${count}
                </span>
              `).join('')}
            </div>
          </div>

          <!-- 类型分布 -->
          <div style="margin-bottom:16px;">
            <h4 style="font-size:14px;color:${COLORS.inkLight};margin:0 0 8px 0;">类型分布</h4>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              ${Object.entries(stats.byType).map(([type, count]) => `
                <span style="padding:4px 10px;border-radius:12px;font-size:12px;background:${TYPE_COLORS[type]}22;color:${TYPE_COLORS[type]};">
                  ${TYPE_LABELS[type]} ${count}
                </span>
              `).join('')}
            </div>
          </div>

          <!-- 历史列表 -->
          <div>
            <h4 style="font-size:14px;color:${COLORS.inkLight};margin:0 0 10px 0;">历史记录</h4>
            ${history.map(c => {
              const mastermind = _getNPC(c.mastermind);
              return `
                <div style="padding:10px;background:${COLORS.parchmentLight};border-radius:6px;border:1px solid ${COLORS.borderLight};margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">
                  <div>
                    <span style="font-size:13px;color:${COLORS.ink};">${c.name}</span>
                    <span style="font-size:11px;color:${COLORS.inkMuted};margin-left:8px;">主谋：${mastermind ? mastermind.name : '?'}</span>
                  </div>
                  <span style="font-size:11px;padding:2px 8px;border-radius:10px;background:${STATUS_COLORS[c.status]}22;color:${STATUS_COLORS[c.status]};">
                    ${STATUS_LABELS[c.status]}
                  </span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    },

    // ----- 联动接口 -----

    /**
     * 获取NPC相关的密谋
     * @param {string} npcId - NPC标识
     * @returns {Array}
     */
    getNPCConspiracies(npcId) {
      return state.conspiracies.filter(c =>
        c.mastermind === npcId || c.accomplices.includes(npcId) || c.target === npcId
      );
    },

    /**
     * 获取家族相关密谋（FamilySystem联动）
     * @param {string} familyId - 家族标识
     * @returns {Array}
     */
    getFamilyConspiracies(familyId) {
      return _getFamilyConspiracies(familyId);
    },

    /**
     * 获取势力相关密谋（PoliticalSystem联动）
     * @param {string} factionId - 势力标识
     * @returns {Array}
     */
    getFactionConspiracies(factionId) {
      return _getFactionConspiracies(factionId);
    },

    /**
     * 获取当前世界观下的密谋类型（WorldviewEngine联动）
     * @returns {Array}
     */
    getWorldviewTypes() {
      return _getWorldviewConspiracyTypes();
    },

    /**
     * NPC行为事件回调（NPCBehavior联动）
     * @param {string} npcId - NPC标识
     * @param {string} eventType - 事件类型
     * @param {Object} data - 事件数据
     */
    onNPCBehaviorEvent(npcId, eventType, data) {
      _onNPCBehaviorEvent(npcId, eventType, data);
    },

    /**
     * 时辰更新回调（由外部系统调用）
     */
    onShichenUpdate() {
      if (state.settings.autoExecute) {
        _autoExecuteConspiracies();
      }
      // 玩家自然发现概率
      if (Math.random() < state.settings.discoveryChance) {
        const npcs = _getNPCs();
        if (npcs.length > 0) {
          const randomNPC = npcs[Math.floor(Math.random() * npcs.length)];
          _discoverClueByObservation(randomNPC.id);
        }
      }
      // 刷新界面
      const page = document.getElementById('page-conspiracy');
      if (page && page.innerHTML.includes('conspiracy-network-canvas')) {
        _renderPage();
      }
    },

    // ----- 设置 -----

    /**
     * 更新设置
     * @param {Object} settings - 设置对象
     */
    updateSettings(settings) {
      state.settings = { ...state.settings, ...settings };
      _save();
    },

    /**
     * 获取当前设置
     * @returns {Object}
     */
    getSettings() {
      return _deepClone(state.settings);
    },

    // ----- 数据持久化 -----

    /**
     * 导出数据
     * @returns {Object}
     */
    exportData() {
      return {
        conspiracies: state.conspiracies,
        investigations: state.investigations,
        suspiciousBehaviors: state.suspiciousBehaviors,
        settings: state.settings,
        exportedAt: new Date().toISOString()
      };
    },

    /**
     * 导入数据
     * @param {Object} data - 数据对象
     */
    importData(data) {
      if (data.conspiracies) state.conspiracies = data.conspiracies;
      if (data.investigations) state.investigations = data.investigations;
      if (data.suspiciousBehaviors) state.suspiciousBehaviors = data.suspiciousBehaviors;
      if (data.settings) state.settings = { ...state.settings, ...data.settings };
      _save();
    },

    /**
     * 重置系统
     */
    reset() {
      if (!confirm('确定重置密谋系统？所有密谋数据将被清除。')) return;
      state.conspiracies = [];
      state.investigations = [];
      state.suspiciousBehaviors = [];
      _save();
      _renderPage();
    }

  };

  // 立即初始化
  api.init();

  return api;

})();

// ==================== 全局兼容 ====================

/**
 * 若页面加载完成时存在page-conspiracy容器，自动渲染
 */
document.addEventListener('DOMContentLoaded', () => {
  const page = document.getElementById('page-conspiracy');
  if (page && ConspiracySystem) {
    ConspiracySystem.onEnter();
  }
});
