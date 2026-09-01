/**
 * =========================================================
 * SystemBuilder vv2 系统DIY生成器 / System DIY Generator
 *
 * 核心概念：用户描述想要什么游戏系统（如"修仙系统"、"武侠门派"），
 * 小助手生成一整套包含多个互相联动模块的代码，自动注册到系统。
 * 不需要手动修改任何文件。
 *
 * 功能模块：
 *   1. 系统模板市场 — 5套预置完整系统模板，一键生成
 *   2. 自定义系统生成 — 自然语言描述→关键词提取→模板匹配→代码生成
 *   3. 系统生命周期 — 安装/启用/暂停/卸载
 *   4. 联动规则配置 — 可视化规则编辑器，拖拽式配置
 *   5. 系统依赖管理 — 自动检查依赖，支持循环依赖检测
 *   6. 系统数据隔离 — 每个系统独立localStorage命名空间
 *   7. UI界面 — 模板市场/自定义生成/我的系统 三大面板
 *   8. 小助手联动 — Assistant新增"制作系统"按钮
 *   9. 安全机制 — 沙箱验证/语法校验/存储检查/自动备份
 *
 * 全局对象：SystemBuilder
 * 存储前缀：system_builder_v15_
 * 配色方案：古风墨境 — 暖羊皮纸 #F5E6D3 / 金色 #C9A227 / 墨色 #2C1810
 * =========================================================
 */
const SystemBuilder = {
  // ===================== 常量配置 =====================
  /** @type {string} localStorage 键前缀 */
  PREFIX: 'system_builder_v15_',
  /** @type {number} 单个系统大小限制（字节） */
  MAX_SYSTEM_SIZE: 500 * 1024,
  /** @type {number} 最大同时启用系统数 */
  MAX_ACTIVE_SYSTEMS: 10,
  /** @type {string} 联动规则存储键 */
  RULES_KEY: 'system_rules_v15',

  // ===================== 预置系统模板 =====================
  /** @type {Object} 5套预置模板 */
  TEMPLATES: {
    // a. 修仙系统
    xianxiu: {
      id: 'xianxiu',
      name: '修仙系统',
      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
      description: '境界突破 + 灵根检测 + 功法修炼 + 炼丹 + 法宝 + 渡劫',
      modules: [
        { name: '境界突破', id: 'cultivation', desc: '从炼气到渡劫的九重境界' },
        { name: '灵根检测', id: 'spiritRoot', desc: '金木水火土五行灵根资质' },
        { name: '功法修炼', id: 'skills', desc: '内外功法心法修炼体系' },
        { name: '炼丹', id: 'alchemy', desc: '采集灵草炼制丹药' },
        { name: '法宝', id: 'artifacts', desc: '锻造与使用法宝武器' },
        { name: '渡劫', id: 'tribulation', desc: '天劫考验与突破' }
      ],
      rules: [
        { trigger: '炼丹成功', condition: '炼丹品质>=优品', action: '提升修为', target: 'cultivation', amount: 50 },
        { trigger: '修为提升', condition: '修为>=当前境界上限', action: '触发渡劫检查', target: 'tribulation' },
        { trigger: '渡劫成功', condition: '', action: '解锁新地图', target: 'mapUnlock' },
        { trigger: '灵根觉醒', condition: '灵根纯度>=80%', action: '解锁稀有功法', target: 'skills' }
      ],
      dependencies: [],
      dataSchema: {
        cultivation: { level: 0, exp: 0, maxExp: 100, realm: '炼气期' },
        spiritRoot: { gold: 0, wood: 0, water: 0, fire: 0, earth: 0, purity: 0 },
        skills: { known: [], active: null, exp: {} },
        alchemy: { recipes: [], materials: {}, pills: [] },
        artifacts: { owned: [], equipped: null },
        tribulation: { count: 0, lastResult: null }
      }
    },

    // b. 武侠门派
    wuxia: {
      id: 'wuxia',
      name: '武侠门派',
      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/></svg>',
      description: '门派创建 + 武学招式 + 江湖历练 + 恩怨情仇 + 掌门竞争',
      modules: [
        { name: '门派创建', id: 'sect', desc: '创建或加入门派势力' },
        { name: '武学招式', id: 'martial', desc: '剑法、拳法、暗器等武学' },
        { name: '江湖历练', id: 'adventure', desc: '行走江湖完成任务' },
        { name: '恩怨情仇', id: 'grudges', desc: '江湖恩怨与结交' },
        { name: '掌门竞争', id: 'competition', desc: '争夺掌门之位' }
      ],
      rules: [
        { trigger: '击败对手', condition: '对手等级>=自身', action: '提升声望', target: 'sect', amount: 10 },
        { trigger: '声望提升', condition: '声望>=100', action: '解锁高级武学', target: 'martial' },
        { trigger: '解锁高级武学', condition: '', action: '门派排名上升', target: 'sect' },
        { trigger: '完成历练', condition: '历练次数>=5', action: '获得掌门候选资格', target: 'competition' }
      ],
      dependencies: [],
      dataSchema: {
        sect: { name: '', rank: 0, reputation: 0, members: [] },
        martial: { skills: [], activeSkill: null, proficiency: {} },
        adventure: { quests: [], completed: 0, currentLocation: '' },
        grudges: { friends: [], enemies: [], stories: [] },
        competition: { canCompete: false, wins: 0, losses: 0 }
      }
    },

    // c. 宫廷宫斗
    gongting: {
      id: 'gongting',
      name: '宫廷宫斗',
      icon: '👑',
      description: '位分晋升 + 恩宠值 + 派系结盟 + 皇子教育 + 宫务管理',
      modules: [
        { name: '位分晋升', id: 'rank', desc: '从答应到皇后的晋升之路' },
        { name: '恩宠值', id: 'favor', desc: '皇帝恩宠程度' },
        { name: '派系结盟', id: 'faction', desc: '后宫派系势力' },
        { name: '皇子教育', id: 'prince', desc: '皇子皇女培养' },
        { name: '宫务管理', id: 'affairs', desc: '后宫事务管理' }
      ],
      rules: [
        { trigger: '获得恩宠', condition: '恩宠值>=80', action: '位分晋升', target: 'rank' },
        { trigger: '位分晋升', condition: '位分>=嫔', action: '解锁新区域', target: 'mapUnlock' },
        { trigger: '解锁新区域', condition: '', action: '触发嫉妒事件', target: 'faction' },
        { trigger: '派系结盟', condition: '盟友>=3', action: '皇子教育加成', target: 'prince' }
      ],
      dependencies: [],
      dataSchema: {
        rank: { current: '答应', points: 0, history: [] },
        favor: { value: 0, max: 100, trend: 'stable' },
        faction: { alliance: [], rivals: [], influence: 0 },
        prince: { children: [], education: {}, talents: [] },
        affairs: { daily: [], resolved: 0, pending: [] }
      }
    },

    // d. 商贾经营
    shanggu: {
      id: 'shanggu',
      name: '商贾经营',
      icon: '💰',
      description: '店铺经营 + 货物买卖 + 商路开拓 + 伙计招募 + 价格战',
      modules: [
        { name: '店铺经营', id: 'shop', desc: '开设与管理各类店铺' },
        { name: '货物买卖', id: 'trade', desc: '低买高卖的经商之道' },
        { name: '商路开拓', id: 'route', desc: '开辟新的贸易路线' },
        { name: '伙计招募', id: 'hire', desc: '招募各类伙计' },
        { name: '价格战', id: 'priceWar', desc: '与其他商人竞争' }
      ],
      rules: [
        { trigger: '商路开拓', condition: '新路线盈利>0', action: '店铺等级提升', target: 'shop' },
        { trigger: '伙计招募', condition: '伙计技能>=中级', action: '交易效率提升', target: 'trade' },
        { trigger: '价格战胜利', condition: '连续胜利>=3', action: '垄断区域', target: 'route' },
        { trigger: '店铺升级', condition: '店铺等级>=5', action: '解锁稀有货物', target: 'trade' }
      ],
      dependencies: [],
      dataSchema: {
        shop: { level: 1, income: 0, expenses: 0, locations: [] },
        trade: { inventory: {}, gold: 1000, deals: [] },
        route: { known: [], active: [], profit: 0 },
        hire: { staff: [], maxStaff: 5, wages: 0 },
        priceWar: { wins: 0, losses: 0, reputation: 0 }
      }
    },

    // e. 科幻舰队
    sci_fi: {
      id: 'sci_fi',
      name: '科幻舰队',
      icon: '🚀',
      description: '舰船建造 + 星图探索 + 船员管理 + 星际贸易 + 外星接触',
      modules: [
        { name: '舰船建造', id: 'shipyard', desc: '设计与建造星际舰船' },
        { name: '星图探索', id: 'starmap', desc: '探索未知星域' },
        { name: '船员管理', id: 'crew', desc: '招募与管理船员' },
        { name: '星际贸易', id: 'spacetrade', desc: '跨星球贸易' },
        { name: '外星接触', id: 'alien', desc: '与外星文明交流' }
      ],
      rules: [
        { trigger: '星图探索', condition: '发现宜居星球', action: '解锁贸易路线', target: 'spacetrade' },
        { trigger: '外星接触', condition: '友好度>=50', action: '获得科技', target: 'shipyard' },
        { trigger: '获得科技', condition: '', action: '舰船升级', target: 'shipyard' },
        { trigger: '船员升级', condition: '船员经验>=1000', action: '探索范围扩大', target: 'starmap' }
      ],
      dependencies: [],
      dataSchema: {
        shipyard: { ships: [], tech: [], resources: {} },
        starmap: { explored: [], known: [], current: '' },
        crew: { members: [], morale: 100, skills: {} },
        spacetrade: { routes: [], profit: 0, cargo: {} },
        alien: { contacts: [], relations: {}, techShared: [] }
      }
    }
  },

  // ===================== 状态管理 =====================
  /** @type {Array<Object>} 已安装的系统列表 */
  installedSystems: [],
  /** @type {Array<string>} 当前启用的系统ID列表 */
  activeSystems: [],
  /** @type {Object} 当前UI状态 */
  uiState: {
    currentTab: 'market', // 'market' | 'custom' | 'my-systems'
    editingSystem: null,
    generatingSystem: null
  },

  // ===================== 初始化 =====================
  /**
   * 初始化 SystemBuilder
   */
    // 初始化模块入口
  init() {
    // v7: 外部模块依赖检查
    if (typeof Storage === 'undefined') { console.warn('[v7] Storage模块未加载'); return; }
    // 初始化模块入口
    this._loadInstalledSystems();
    this._loadActiveSystems();
    this._loadRules();
    this._ensurePageContainer();
    console.log('[SystemBuilder] 系统DIY生成器已初始化');
  },

  /**
   * 确保页面容器存在（如果不存在则自动创建）
   */
  _ensurePageContainer() {
    const contentArea = document.getElementById('contentArea');
    if (contentArea && !document.getElementById('page-system-builder')) {
      const section = document.createElement('section');
      section.className = 'page-view';
      section.id = 'page-system-builder';
      contentArea.appendChild(section);
    }
  },

  // ===================== 1. 系统模板市场 =====================
  /**
   * 获取所有预置模板
   * @returns {Array<Object>} 模板列表
   */
  getTemplates() {
    return Object.values(this.TEMPLATES).map(t => ({
      id: t.id,
      name: t.name,
      icon: t.icon,
      description: t.description,
      moduleCount: t.modules.length,
      ruleCount: t.rules.length,
      dependencies: t.dependencies
    }));
  },

  /**
   * 预览模板详情
   * @param {string} templateId 模板ID
   * @returns {Object|null} 模板详情
   */
  previewTemplate(templateId) {
    const tmpl = this.TEMPLATES[templateId];
    if (!tmpl) return null;
    return {
      ...tmpl,
      estimatedSize: JSON.stringify(tmpl).length,
      estimatedStorage: this._estimateStorage(tmpl)
    };
  },

  /**
   * 从模板一键生成系统
   * @param {string} templateId 模板ID
   * @param {Object} overrides 可选覆盖配置
   * @returns {Object} { success, systemId, message }
   */
  generateFromTemplate(templateId, overrides = {}) {
    const tmpl = this.TEMPLATES[templateId];
    if (!tmpl) {
      return { success: false, systemId: null, message: `模板「${templateId}」不存在` };
    }
    const systemData = {
      ...tmpl,
      ...overrides,
      systemId: this._generateSystemId(templateId),
      source: 'template',
      createdAt: Date.now(),
      status: 'installed'
    };
    return this._generateSystemFiles(systemData);
  },

  // ===================== 2. 自定义系统生成 =====================
  /**
   * 用户输入自然语言描述，生成系统
   * @param {string} description 用户描述
   * @returns {Object} { success, systemId, systemData, message }
   */
  generateSystem(description) {
    if (!description || description.trim().length < 5) {
      return { success: false, systemId: null, message: '描述太短，请至少输入5个字符' };
    }

    // Step 1: 提取关键词
    const keywords = this._extractKeywords(description);

    // Step 2: 匹配最接近的模板
    const matchedTemplate = this._matchTemplate(keywords);

    // Step 3: 基于模板生成自定义系统
    const systemData = this._buildCustomSystem(description, keywords, matchedTemplate);

    // Step 4: 预估存储
    const estimatedSize = JSON.stringify(systemData).length;
    if (estimatedSize > this.MAX_SYSTEM_SIZE) {
      return {
        success: false,
        systemId: null,
        message: `系统预估大小 ${(estimatedSize / 1024).toFixed(1)}KB 超过限制 ${(this.MAX_SYSTEM_SIZE / 1024).toFixed(0)}KB`
      };
    }

    // Step 5: 保存到预览状态
    this.uiState.generatingSystem = systemData;

    return {
      success: true,
      systemId: systemData.systemId,
      systemData,
      message: `系统「${systemData.name}」已生成预览，包含 ${systemData.modules.length} 个模块、${systemData.rules.length} 条联动规则`
    };
  },

  /**
   * 确认安装预览中的系统
   * @returns {Object} { success, systemId, message }
   */
  confirmInstall() {
    const system = this.uiState.generatingSystem;
    if (!system) {
      return { success: false, message: '没有待安装的系统，请先生成' };
    }
    const result = this.installSystem(system);
    if (result.success) {
      this.uiState.generatingSystem = null;
    }
    return result;
  },

  /**
   * 取消安装预览中的系统
   */
  cancelInstall() {
    this.uiState.generatingSystem = null;
    return { success: true, message: '已取消安装' };
  },

  // ===================== 3. 系统生命周期管理 =====================
  /**
   * 安装系统
   * @param {Object} systemData 系统数据
   * @returns {Object} { success, systemId, message }
   */
  installSystem(systemData) {
    // 检查依赖
    const depCheck = this._checkDependencies(systemData.dependencies);
    if (!depCheck.satisfied) {
      return {
        success: false,
        message: `依赖未满足：${depCheck.missing.join(', ')}`
      };
    }

    // 检查存储空间
    const currentSize = this._getTotalStorageSize();
    const systemSize = JSON.stringify(systemData).length;
    if (currentSize + systemSize > this.MAX_SYSTEM_SIZE * 2) {
      return {
        success: false,
        message: `存储空间不足，当前已用 ${(currentSize / 1024).toFixed(1)}KB`
      };
    }

    // 自动备份
    this._backupCurrentState();

    // 生成代码并注册
    const genResult = this._generateSystemFiles(systemData);
    if (!genResult.success) {
      return genResult;
    }

    // 保存系统数据
    const systems = this._getInstalledSystems();
    const existingIdx = systems.findIndex(s => s.systemId === systemData.systemId);
    if (existingIdx >= 0) {
      systems[existingIdx] = systemData;
    } else {
      systems.push(systemData);
    }
    this._saveInstalledSystems(systems);
    this.installedSystems = systems;

    // 注册导航项
    this._registerNavItem(systemData);

    // 注册页面容器
    this._registerPageContainer(systemData);

    // 初始化数据
    this._initSystemData(systemData);

    // 默认启用
    this.enableSystem(systemData.systemId);

    // 通知 EventBridge
    if (window.EventBridge) {
      EventBridge.emit('system-builder', 'system_installed', { systemId: systemData.systemId }, 'SystemBuilder');
    }

    return {
      success: true,
      systemId: systemData.systemId,
      message: `系统「${systemData.name}」已安装并启用`
    };
  },

  /**
   * 启用系统
   * @param {string} systemId 系统ID
   * @returns {Object} { success, message }
   */
  enableSystem(systemId) {
    const systems = this._getInstalledSystems();
    const system = systems.find(s => s.systemId === systemId);
    if (!system) {
      return { success: false, message: `系统「${systemId}」未安装` };
    }

    const active = this._getActiveSystems();
    if (active.includes(systemId)) {
      return { success: false, message: '系统已经是启用状态' };
    }

    if (active.length >= this.MAX_ACTIVE_SYSTEMS) {
      return { success: false, message: `最多同时启用 ${this.MAX_ACTIVE_SYSTEMS} 个系统` };
    }

    active.push(systemId);
    this._saveActiveSystems(active);
    this.activeSystems = active;

    // 更新系统状态
    system.status = 'active';
    this._saveInstalledSystems(systems);
    this.installedSystems = systems;

    // 注册回调
    this._registerSystemCallbacks(system);

    if (window.EventBridge) {
      EventBridge.emit('system-builder', 'system_enabled', { systemId }, 'SystemBuilder');
    }

    return { success: true, message: `系统「${system.name}」已启用` };
  },

  /**
   * 暂停系统
   * @param {string} systemId 系统ID
   * @returns {Object} { success, message }
   */
  pauseSystem(systemId) {
    const systems = this._getInstalledSystems();
    const system = systems.find(s => s.systemId === systemId);
    if (!system) {
      return { success: false, message: `系统「${systemId}」未安装` };
    }

    const active = this._getActiveSystems();
    const idx = active.indexOf(systemId);
    if (idx === -1) {
      return { success: false, message: '系统已经是暂停状态' };
    }

    active.splice(idx, 1);
    this._saveActiveSystems(active);
    this.activeSystems = active;

    system.status = 'paused';
    this._saveInstalledSystems(systems);
    this.installedSystems = systems;

    // 注销回调
    this._unregisterSystemCallbacks(systemId);

    if (window.EventBridge) {
      EventBridge.emit('system-builder', 'system_paused', { systemId }, 'SystemBuilder');
    }

    return { success: true, message: `系统「${system.name}」已暂停` };
  },

  /**
   * 卸载系统
   * @param {string} systemId 系统ID
   * @returns {Object} { success, message }
   */
  uninstallSystem(systemId) {
    const systems = this._getInstalledSystems();
    const system = systems.find(s => s.systemId === systemId);
    if (!system) {
      return { success: false, message: `系统「${systemId}」未安装` };
    }

    // 先暂停
    this.pauseSystem(systemId);

    // 检查是否有其他系统依赖此系统
    const dependents = systems.filter(s =>
      s.dependencies && s.dependencies.includes(systemId)
    );
    if (dependents.length > 0) {
      return {
        success: false,
        message: `以下系统依赖此系统：${dependents.map(d => d.name).join(', ')}`
      };
    }

    // 删除所有相关数据
    this._clearSystemData(systemId);

    // 删除代码模块
    this._deleteSystemModules(systemId);

    // 注销导航
    this._unregisterNavItem(systemId);

    // 从列表移除
    const newSystems = systems.filter(s => s.systemId !== systemId);
    this._saveInstalledSystems(newSystems);
    this.installedSystems = newSystems;

    if (window.EventBridge) {
      EventBridge.emit('system-builder', 'system_uninstalled', { systemId }, 'SystemBuilder');
    }

    return { success: true, message: `系统「${system.name}」已卸载` };
  },

  // ===================== 4. 联动规则配置 =====================
  /**
   * 添加联动规则
   * @param {Object} rule 规则对象
   * @returns {Object} { success, message }
   */
  addRule(rule) {
    const rules = this._getRules();
    rule.id = 'rule_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    rule.createdAt = Date.now();
    rules.push(rule);
    this._saveRules(rules);

    if (window.EventBridge) {
      EventBridge.emit('system-builder', 'rule_added', { ruleId: rule.id }, 'SystemBuilder');
    }

    return { success: true, message: '规则已添加' };
  },

  /**
   * 删除联动规则
   * @param {string} ruleId 规则ID
   * @returns {Object} { success, message }
   */
  removeRule(ruleId) {
    const rules = this._getRules();
    const newRules = rules.filter(r => r.id !== ruleId);
    this._saveRules(newRules);
    return { success: true, message: '规则已删除' };
  },

  /**
   * 获取所有联动规则
   * @returns {Array<Object>}
   */
  getRules() {
    return this._getRules();
  },

  /**
   * 执行联动规则
   * @param {string} event 触发事件
   * @param {Object} context 事件上下文
   */
  executeRules(event, context = {}) {
    const rules = this._getRules();
    const triggered = rules.filter(r => r.trigger === event);

    for (const rule of triggered) {
      // 检查条件
      if (rule.condition && !this._evaluateCondition(rule.condition, context)) {
        continue;
      }

      // 执行动作
      this._executeRuleAction(rule, context);

      if (window.EventBridge) {
        EventBridge.emit('system-builder', 'rule_triggered', { ruleId: rule.id, event }, 'SystemBuilder');
      }
    }
  },

  // ===================== 5. 系统依赖管理 =====================
  /**
   * 检查依赖是否满足
   * @param {Array<string>} dependencies 依赖的系统ID列表
   * @returns {Object} { satisfied, missing }
   */
  _checkDependencies(dependencies) {
    if (!dependencies || dependencies.length === 0) {
      return { satisfied: true, missing: [] };
    }
    const installed = this._getInstalledSystems().map(s => s.systemId);
    const missing = dependencies.filter(d => !installed.includes(d));
    return { satisfied: missing.length === 0, missing };
  },

  /**
   * 检测循环依赖
   * @param {string} systemId 要检查的系统ID
   * @param {Array<string>} dependencies 依赖列表
   * @returns {boolean} 是否存在循环依赖
   */
  _detectCircularDependency(systemId, dependencies) {
    const systems = this._getInstalledSystems();
    const visited = new Set();
    const stack = new Set();

    const dfs = (id) => {
      if (stack.has(id)) return true;
      if (visited.has(id)) return false;
      visited.add(id);
      stack.add(id);

      const sys = systems.find(s => s.systemId === id);
      if (sys && sys.dependencies) {
        for (const dep of sys.dependencies) {
          if (dfs(dep)) return true;
        }
      }
      stack.delete(id);
      return false;
    };

    for (const dep of dependencies) {
      if (dep === systemId) return true;
      if (dfs(dep)) return true;
    }
    return false;
  },

  // ===================== 6. 系统数据隔离 =====================
  /**
   * 获取系统数据存储键
   * @param {string} systemId 系统ID
   * @param {string} key 数据键
   * @returns {string} 完整存储键
   */
  _getDataKey(systemId, key) {
    return `system_${systemId}_${key}`;
  },

  /**
   * 读取系统数据
   * @param {string} systemId 系统ID
   * @param {string} key 数据键
   * @param {*} defaultValue 默认值
   * @returns {*} 数据值
   */
  getSystemData(systemId, key, defaultValue = null) {
    const fullKey = this._getDataKey(systemId, key);
    return Storage.get(fullKey, defaultValue);
  },

  /**
   * 写入系统数据
   * @param {string} systemId 系统ID
   * @param {string} key 数据键
   * @param {*} value 数据值
   */
  setSystemData(systemId, key, value) {
    const fullKey = this._getDataKey(systemId, key);
    Storage.set(fullKey, value);
  },

  /**
   * 删除系统数据
   * @param {string} systemId 系统ID
   * @param {string} key 数据键
   */
  deleteSystemData(systemId, key) {
    const fullKey = this._getDataKey(systemId, key);
    localStorage.removeItem(fullKey);
  },

  /**
   * 跨系统数据读取（只读）
   * @param {string} targetSystemId 目标系统ID
   * @param {string} key 数据键
   * @param {*} defaultValue 默认值
   * @returns {*} 数据值
   */
  readCrossSystemData(targetSystemId, key, defaultValue = null) {
    return this.getSystemData(targetSystemId, key, defaultValue);
  },

  /**
   * 清空某个系统的所有数据
   * @param {string} systemId 系统ID
   */
  _clearSystemData(systemId) {
    const prefix = `system_${systemId}_`;
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  },

  // ===================== 7. UI界面 =====================
  /**
   * 页面进入回调 — 渲染SystemBuilder界面
   */
    // 页面进入时调用
  onEnter() {
    // 页面进入时调用
    this._ensurePageContainer();
    const page = document.getElementById('page-system-builder');
    if (!page) return;

    page.innerHTML = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>` + this._renderUI();
    this._bindUIEvents();
  },

  /**
   * 渲染完整UI
   * @returns {string} HTML字符串
   */
  _renderUI() {
    const styles = this._getUIStyles();
    return `
      <div class="system-builder-container" style="${styles.container}">
        ${styles.css}
        <!-- 顶部导航 -->
        <div class="sb-header" style="${styles.header}">
          <h2 style="${styles.title}">🏗️ 系统DIY生成器</h2>
          <div class="sb-tabs" style="${styles.tabs}">
            <button class="sb-tab ${this.uiState.currentTab === 'market' ? 'active' : ''}" data-tab="market" style="${styles.tab}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg> 模板市场
            </button>
            <button class="sb-tab ${this.uiState.currentTab === 'custom' ? 'active' : ''}" data-tab="custom" style="${styles.tab}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2 7h7l-5.5 4 2 7-5.5-4-5.5 4 2-7L3 9h7z"/></svg> 自定义生成
            </button>
            <button class="sb-tab ${this.uiState.currentTab === 'my-systems' ? 'active' : ''}" data-tab="my-systems" style="${styles.tab}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg> 我的系统
            </button>
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="sb-content" style="${styles.content}">
          ${this.uiState.currentTab === 'market' ? this._renderMarketTab() : ''}
          ${this.uiState.currentTab === 'custom' ? this._renderCustomTab() : ''}
          ${this.uiState.currentTab === 'my-systems' ? this._renderMySystemsTab() : ''}
        </div>
      </div>
    `;
  },

  /**
   * 渲染模板市场标签页
   * @returns {string} HTML字符串
   */
  _renderMarketTab() {
    const templates = this.getTemplates();
    const styles = this._getUIStyles();

    return `
      <div class="sb-market" style="${styles.market}">
        <p style="${styles.subtitle}">选择一套预设系统模板，一键生成到你的世界中</p>
        <div class="sb-template-grid" style="${styles.grid}">
          ${templates.map(t => `
            <div class="sb-template-card" data-template="${t.id}" style="${styles.card}">
              <div class="sb-card-icon" style="${styles.cardIcon}">${t.icon}</div>
              <h3 style="${styles.cardTitle}">${t.name}</h3>
              <p style="${styles.cardDesc}">${t.description}</p>
              <div class="sb-card-meta" style="${styles.cardMeta}">
                <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg> ${t.moduleCount} 个模块</span>
                <span>🔗 ${t.ruleCount} 条规则</span>
              </div>
              <div class="sb-card-actions" style="${styles.cardActions}">
                <button class="sb-btn-preview" data-template="${t.id}" style="${styles.btnSecondary}">👁️ 预览</button>
                <button class="sb-btn-generate" data-template="${t.id}" style="${styles.btnPrimary}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> 一键生成</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  /**
   * 渲染自定义生成标签页
   * @returns {string} HTML字符串
   */
  _renderCustomTab() {
    const styles = this._getUIStyles();
    const generating = this.uiState.generatingSystem;

    if (generating) {
      return this._renderSystemPreview(generating);
    }

    return `
      <div class="sb-custom" style="${styles.custom}">
        <p style="${styles.subtitle}">描述你想要的系统，AI小助手为你生成</p>
        <div class="sb-input-group" style="${styles.inputGroup}">
          <textarea
            id="sb-description"
            placeholder="描述你想要的系统... 例如：我想要一个修仙系统，包含境界突破、炼丹、法宝等功能"
            style="${styles.textarea}"
            rows="6"
          ></textarea>
          <button id="sb-generate-btn" style="${styles.btnPrimary}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2 7h7l-5.5 4 2 7-5.5-4-5.5 4 2-7L3 9h7z"/></svg> AI生成系统</button>
        </div>
        <div class="sb-hints" style="${styles.hints}">
          <p><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 00-7 7c0 2.5 1.5 4.5 3 6v2h8v-2c1.5-1.5 3-3.5 3-6a7 7 0 00-7-7z"/></svg> 试试这些描述：</p>
          <ul style="${styles.hintList}">
            <li>"一个武侠门派系统，有武学招式和江湖历练"</li>
            <li>"宫廷宫斗系统，包含位分晋升和恩宠值"</li>
            <li>"商贾经营系统，可以开店铺和招募伙计"</li>
            <li>"科幻舰队系统，能建造舰船和探索星图"</li>
          </ul>
        </div>
      </div>
    `;
  },

  /**
   * 渲染系统预览（生成后确认安装）
   * @param {Object} system 系统数据
   * @returns {string} HTML字符串
   */
  _renderSystemPreview(system) {
    const styles = this._getUIStyles();
    const size = JSON.stringify(system).length;

    return `
      <div class="sb-preview" style="${styles.preview}">
        <h3 style="${styles.previewTitle}">📋 系统预览：${system.name}</h3>

        <div class="sb-preview-section" style="${styles.previewSection}">
          <h4 style="${styles.previewSectionTitle}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg> 包含模块 (${system.modules.length})</h4>
          <ul style="${styles.previewList}">
            ${system.modules.map(m => `
              <li style="${styles.previewItem}">
                <strong>${m.name}</strong> — ${m.desc}
              </li>
            `).join('')}
          </ul>
        </div>

        <div class="sb-preview-section" style="${styles.previewSection}">
          <h4 style="${styles.previewSectionTitle}">🔗 联动规则 (${system.rules.length})</h4>
          <ul style="${styles.previewList}">
            ${system.rules.map(r => `
              <li style="${styles.previewItem}">
                ${r.trigger}
                ${r.condition ? `（条件：${r.condition}）` : ''}
                → ${r.action}
                ${r.target ? `→ ${r.target}` : ''}
              </li>
            `).join('')}
          </ul>
        </div>

        <div class="sb-preview-section" style="${styles.previewSection}">
          <h4 style="${styles.previewSectionTitle}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> 存储信息</h4>
          <p style="${styles.previewInfo}">预估大小：${(size / 1024).toFixed(1)} KB</p>
          <p style="${styles.previewInfo}">数据隔离：system_${system.systemId}_*</p>
          ${system.dependencies.length > 0 ? `<p style="${styles.previewInfo}">依赖：${system.dependencies.join(', ')}</p>` : '<p style="${styles.previewInfo}">无外部依赖</p>'}
        </div>

        <div class="sb-preview-actions" style="${styles.previewActions}">
          <button id="sb-confirm-install" style="${styles.btnPrimary}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> 安装此系统</button>
          <button id="sb-cancel-install" style="${styles.btnSecondary}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> 取消</button>
        </div>
      </div>
    `;
  },

  /**
   * 渲染"我的系统"标签页
   * @returns {string} HTML字符串
   */
  _renderMySystemsTab() {
    const systems = this._getInstalledSystems();
    const styles = this._getUIStyles();

    if (systems.length === 0) {
      return `
        <div class="sb-empty" style="${styles.empty}">
          <div style="font-size:48px;margin-bottom:16px;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
          <h3 style="${styles.emptyTitle}">暂无自定义系统</h3>
          <p style="${styles.emptyDesc}">从模板市场选择一套系统，或让AI小助手为你生成</p>
          <button onclick="SystemBuilder.switchTab('market')" style="${styles.btnPrimary}">前往模板市场</button>
        </div>
      `;
    }

    return `
      <div class="sb-my-systems" style="${styles.mySystems}">
        <div class="sb-systems-list" style="${styles.systemsList}">
          ${systems.map(s => {
            const isActive = this._getActiveSystems().includes(s.systemId);
            const moduleCount = s.modules ? s.modules.length : 0;
            return `
              <div class="sb-system-item" style="${styles.systemItem}">
                <div class="sb-system-info" style="${styles.systemInfo}">
                  <div class="sb-system-name" style="${styles.systemName}">
                    ${s.icon || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>'} ${s.name}
                    <span class="sb-status-badge ${isActive ? 'active' : 'paused'}" style="${isActive ? styles.badgeActive : styles.badgePaused}">
                      ${isActive ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> 启用' : '⏸️ 暂停'}
                    </span>
                  </div>
                  <div class="sb-system-meta" style="${styles.systemMeta}">
                    <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg> ${moduleCount} 个模块</span>
                    <span>📅 ${new Date(s.createdAt).toLocaleDateString()}</span>
                    <span>📂 ${s.source === 'template' ? '模板' : '自定义'}</span>
                  </div>
                </div>
                <div class="sb-system-actions" style="${styles.systemActions}">
                  ${isActive
                    ? `<button class="sb-btn-pause" data-system="${s.systemId}" style="${styles.btnSecondary}">⏸️ 暂停</button>`
                    : `<button class="sb-btn-enable" data-system="${s.systemId}" style="${styles.btnPrimary}">▶️ 启用</button>`
                  }
                  <button class="sb-btn-uninstall" data-system="${s.systemId}" style="${styles.btnDanger}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg> 卸载</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="sb-backup-action" style="${styles.backupAction}">
          <button id="sb-backup-btn" style="${styles.btnSecondary}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> 备份当前系统</button>
        </div>
      </div>
    `;
  },

  /**
   * 切换标签页
   * @param {string} tab 标签页名称
   */
  switchTab(tab) {
    this.uiState.currentTab = tab;
    this.onEnter();
  },

  /**
   * 绑定UI事件
   */
  _bindUIEvents() {
    const page = document.getElementById('page-system-builder');
    if (!page) return;

    // 标签切换
    page.querySelectorAll('.sb-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTab(btn.dataset.tab);
      });
    });

    // 模板市场：预览
    page.querySelectorAll('.sb-btn-preview').forEach(btn => {
      btn.addEventListener('click', () => {
        const tmpl = this.previewTemplate(btn.dataset.template);
        if (tmpl) {
          const content = `
            <h3>${tmpl.icon} ${tmpl.name}</h3>
            <p>${tmpl.description}</p>
            <p><strong>模块数：</strong>${tmpl.modules.length}</p>
            <p><strong>联动规则：</strong>${tmpl.rules.length}</p>
            <p><strong>预估大小：</strong>${(tmpl.estimatedSize / 1024).toFixed(1)} KB</p>
            <hr style="border-color:#C9A227;margin:12px 0;">
            <h4>包含模块：</h4>
            <ul>${tmpl.modules.map(m => `<li>${m.name} — ${m.desc}</li>`).join('')}</ul>
            <h4>联动规则：</h4>
            <ul>${tmpl.rules.map(r => `<li>${r.trigger} → ${r.action}</li>`).join('')}</ul>
          `;
          if (window.App) App.showModal('模板预览', content, true);
        }
      });
    });

    // 模板市场：一键生成
    page.querySelectorAll('.sb-btn-generate').forEach(btn => {
      btn.addEventListener('click', () => {
        const result = this.generateFromTemplate(btn.dataset.template);
        if (result.success) {
          if (window.App) App.toast(`系统「${result.systemId}」已生成`, 'success');
          this.switchTab('my-systems');
        } else {
          if (window.App) App.toast(result.message, 'error');
        }
      });
    });

    // 自定义生成
    const generateBtn = page.querySelector('#sb-generate-btn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        const desc = page.querySelector('#sb-description')?.value;
        if (!desc) {
          if (window.App) App.toast('请输入系统描述', 'error');
          return;
        }
        const result = this.generateSystem(desc);
        if (result.success) {
          this.onEnter(); // 重新渲染显示预览
          if (window.App) App.toast(result.message, 'success');
        } else {
          if (window.App) App.toast(result.message, 'error');
        }
      });
    }

    // 确认安装
    const confirmBtn = page.querySelector('#sb-confirm-install');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const result = this.confirmInstall();
        if (result.success) {
          this.switchTab('my-systems');
          if (window.App) App.toast(result.message, 'success');
        } else {
          if (window.App) App.toast(result.message, 'error');
        }
      });
    }

    // 取消安装
    const cancelBtn = page.querySelector('#sb-cancel-install');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.cancelInstall();
        this.onEnter();
        if (window.App) App.toast('已取消安装', 'info');
      });
    }

    // 启用/暂停/卸载
    page.querySelectorAll('.sb-btn-enable').forEach(btn => {
      btn.addEventListener('click', () => {
        const result = this.enableSystem(btn.dataset.system);
        if (window.App) App.toast(result.message, result.success ? 'success' : 'error');
        if (result.success) this.onEnter();
      });
    });

    page.querySelectorAll('.sb-btn-pause').forEach(btn => {
      btn.addEventListener('click', () => {
        const result = this.pauseSystem(btn.dataset.system);
        if (window.App) App.toast(result.message, result.success ? 'success' : 'error');
        if (result.success) this.onEnter();
      });
    });

    page.querySelectorAll('.sb-btn-uninstall').forEach(btn => {
      btn.addEventListener('click', () => {
        const sysId = btn.dataset.system;
        const systems = this._getInstalledSystems();
        const sys = systems.find(s => s.systemId === sysId);
        const name = sys ? sys.name : sysId;
        if (window.confirm(`确定要卸载系统「${name}」吗？此操作不可恢复！`)) {
          const result = this.uninstallSystem(sysId);
          if (window.App) App.toast(result.message, result.success ? 'success' : 'error');
          if (result.success) this.onEnter();
        }
      });
    });

    // 备份按钮
    const backupBtn = page.querySelector('#sb-backup-btn');
    if (backupBtn) {
      backupBtn.addEventListener('click', () => {
        this._backupCurrentState();
        if (window.App) App.toast('系统状态已备份', 'success');
      });
    }
  },

  // ===================== 8. 与小助手联动 =====================
  /**
   * 小助手调用入口 — 制作系统
   * @param {string} userDescription 用户描述
   * @returns {Object} { success, systemId, preview, message }
   */
  assistantBuildSystem(userDescription) {
    const result = this.generateSystem(userDescription);
    if (!result.success) return result;

    const system = result.systemData;
    const preview = {
      name: system.name,
      modules: system.modules.map(m => m.name),
      rules: system.rules.map(r => `${r.trigger} → ${r.action}`),
      estimatedSize: JSON.stringify(system).length,
      dependencies: system.dependencies
    };

    return {
      success: true,
      systemId: result.systemId,
      preview,
      message: `系统「${system.name}」已生成预览。包含 ${system.modules.length} 个模块、${system.rules.length} 条联动规则。是否安装？`
    };
  },

  /**
   * 小助手确认安装
   * @param {string} systemId 系统ID
   * @returns {Object}
   */
  assistantConfirmInstall(systemId) {
    if (this.uiState.generatingSystem && this.uiState.generatingSystem.systemId === systemId) {
      return this.confirmInstall();
    }
    return { success: false, message: '没有对应的待安装系统' };
  },

  // ===================== 9. 安全机制 =====================
  /**
   * 沙箱验证代码
   * @param {string} code 代码字符串
   * @returns {Object} { valid, error? }
   */
  _validateCode(code) {
    // 使用 CodePatcher 的沙箱验证
    if (window.CodePatcher && typeof CodePatcher.executeInSandbox === 'function') {
      return CodePatcher.executeInSandbox(code);
    }
    // 降级：基本语法检查
    try {
      new Function(code);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * 检查存储空间
   * @returns {Object} { available, used, total }
   */
  checkStorage() {
    const used = this._getTotalStorageSize();
    const total = this.MAX_SYSTEM_SIZE * 2;
    return {
      available: total - used,
      used,
      total,
      usedPercent: (used / total * 100).toFixed(1)
    };
  },

  /**
   * 备份当前系统状态
   */
  _backupCurrentState() {
    const backup = {
      timestamp: Date.now(),
      systems: this._getInstalledSystems(),
      active: this._getActiveSystems(),
      rules: this._getRules()
    };
    const backups = Storage.get(this.PREFIX + 'backups', []);
    backups.push(backup);
    // 最多保留10个备份
    if (backups.length > 10) backups.shift();
    Storage.set(this.PREFIX + 'backups', backups);
  },

  /**
   * 恢复备份
   * @param {number} index 备份索引（从0开始，0是最新的）
   * @returns {Object} { success, message }
   */
  restoreBackup(index = 0) {
    const backups = Storage.get(this.PREFIX + 'backups', []);
    if (index >= backups.length) {
      return { success: false, message: '备份索引超出范围' };
    }
    const backup = backups[backups.length - 1 - index];
    this._saveInstalledSystems(backup.systems);
    this._saveActiveSystems(backup.active);
    this._saveRules(backup.rules);
    this.installedSystems = backup.systems;
    this.activeSystems = backup.active;
    return { success: true, message: `已恢复到 ${new Date(backup.timestamp).toLocaleString()} 的备份` };
  },

  // ===================== 代码生成核心 =====================
  /**
   * 生成系统代码文件
   * @param {Object} systemData 系统数据
   * @returns {Object} { success, systemId, message }
   */
  _generateSystemFiles(systemData) {
    const systemId = systemData.systemId;
    const varName = this._toCamelCase(systemId);

    // 1. 生成主控制器模块
    const controllerCode = this._generateController(systemData, varName);
    const ctrlValidation = this._validateCode(controllerCode);
    if (!ctrlValidation.success) {
      return { success: false, systemId: null, message: `控制器语法错误：${ctrlValidation.error}` };
    }

    // 2. 生成UI模块
    const uiCode = this._generateUI(systemData, varName);
    const uiValidation = this._validateCode(uiCode);
    if (!uiValidation.success) {
      return { success: false, systemId: null, message: `UI模块语法错误：${uiValidation.error}` };
    }

    // 3. 生成数据模型模块
    const dataCode = this._generateData(systemData, varName);
    const dataValidation = this._validateCode(dataCode);
    if (!dataValidation.success) {
      return { success: false, systemId: null, message: `数据模块语法错误：${dataValidation.error}` };
    }

    // 4. 生成联动规则模块
    const rulesCode = this._generateRules(systemData, varName);
    const rulesValidation = this._validateCode(rulesCode);
    if (!rulesValidation.success) {
      return { success: false, systemId: null, message: `规则模块语法错误：${rulesValidation.error}` };
    }

    // 保存代码到 localStorage
    Storage.set(this.PREFIX + 'code_' + systemId + '_controller', controllerCode);
    Storage.set(this.PREFIX + 'code_' + systemId + '_ui', uiCode);
    Storage.set(this.PREFIX + 'code_' + systemId + '_data', dataCode);
    Storage.set(this.PREFIX + 'code_' + systemId + '_rules', rulesCode);

    // 通过 CodePatcher 执行注册
    if (window.CodePatcher && typeof CodePatcher.createModule === 'function') {
      try {
        CodePatcher.createModule(varName + 'Controller', controllerCode);
        CodePatcher.createModule(varName + 'UI', uiCode);
        CodePatcher.createModule(varName + 'Data', dataCode);
        CodePatcher.createModule(varName + 'Rules', rulesCode);
      } catch (e) {
        console.warn('[SystemBuilder] CodePatcher注册警告:', e);
      }
    }

    // 合并为一个完整对象供直接执行
    const combinedCode = `
      ${controllerCode}
      ${uiCode}
      ${dataCode}
      ${rulesCode}
    `;

    // 沙箱验证完整代码
    const finalValidation = this._validateCode(combinedCode);
    if (!finalValidation.success) {
      return { success: false, systemId: null, message: `完整代码语法错误：${finalValidation.error}` };
    }

    // 执行注册
    try {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.textContent = combinedCode;
      script.id = 'sb_system_' + systemId;
      document.head.appendChild(script);
    } catch (e) {
      return { success: false, systemId: null, message: `代码执行失败：${e.message}` };
    }

    return {
      success: true,
      systemId,
      message: `系统「${systemData.name}」代码已生成并注册`
    };
  },

  /**
   * 生成主控制器模块代码
   * @param {Object} systemData 系统数据
   * @param {string} varName 变量名
   * @returns {string} 代码字符串
   */
  _generateController(systemData, varName) {
    const modules = systemData.modules || [];
    const rules = systemData.rules || [];

    return `
      // 系统「${systemData.name}」— 主控制器
      const ${varName}Controller = {
        systemId: '${systemData.systemId}',
        name: '${systemData.name}',
        active: false,
        modules: ${JSON.stringify(modules)},
        rules: ${JSON.stringify(rules)},

          // 初始化模块入口
        init() {
    // 初始化模块入口
          console.log('[${systemData.name}] 系统已初始化');
          this.active = true;
          this._loadData();
          this._bindEvents();
        },

          // 页面进入时调用
        onEnter() {
    // 页面进入时调用
          ${varName}UI.render();
        },

        _loadData() {
          const data = SystemBuilder.getSystemData('${systemData.systemId}', 'state', {});
          this.state = data;
        },

        _saveData() {
          SystemBuilder.setSystemData('${systemData.systemId}', 'state', this.state);
        },

        _bindEvents() {
          if (window.EventBridge) {
            EventBridge.on('${systemData.systemId}', (e) => {
              SystemBuilder.executeRules(e.type, e.data);
            }, '${systemData.systemId}Controller');
          }
        },

        getModule(name) {
          return this.modules.find(m => m.id === name || m.name === name);
        },

        updateState(key, value) {
          if (!this.state) this.state = {};
          this.state[key] = value;
          this._saveData();
        }
      };
    `;
  },

  /**
   * 生成UI模块代码
   * @param {Object} systemData 系统数据
   * @param {string} varName 变量名
   * @returns {string} 代码字符串
   */
  _generateUI(systemData, varName) {
    const modules = systemData.modules || [];
    const sysId = systemData.systemId;
    const icon = systemData.icon || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>';
    const name = systemData.name;
    const desc = systemData.description || '';

    const moduleCards = modules.map(m => {
      return "    '<div class=\"sb-module-card\" data-module=\"" + m.id + "\" style=\"" +
        "background:#FFF8F0;border:1px solid #C9A227;border-radius:8px;" +
        "padding:16px;cursor:pointer;transition:transform 0.2s;\">' +\n" +
        "      '<h4 style=\"color:#2C1810;margin:0 0 8px;\">" + m.name + "</h4>' +\n" +
        "      '<p style=\"color:#8B7355;font-size:13px;margin:0;\">" + m.desc + "</p>' +\n" +
        "    '</div>'";
    }).join(' +\n');

    return [
      "// 系统「" + name + "」— UI模块",
      "const " + varName + "UI = {",
      "  systemId: '" + sysId + "',",
      "",
      "  render() {",
      "    const page = document.getElementById('page-" + sysId + "');",
      "    if (!page) return;",
      "    page.innerHTML = this._buildHTML();",
      "    this._bindEvents();",
      "  },",
      "",
      "  _buildHTML() {",
      "    const state = SystemBuilder.getSystemData('" + sysId + "', 'state', {});",
      "    return '<div style=\"padding:20px;background:#F5E6D3;min-height:100%;\">' +",
      "      '<h2 style=\"color:#2C1810;font-family:var(--font-display);margin-bottom:16px;\">' +",
      "        '" + icon + " " + name + "' +",
      "      '</h2>' +",
      "      '<p style=\"color:#8B7355;margin-bottom:20px;\">" + desc + "</p>' +",
      "      '<div style=\"display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;\">' +",
      moduleCards ? "      " + moduleCards + " +" : "      '',",
      "      '</div>' +",
      "      '<div id=\"" + sysId + "-detail\" style=\"margin-top:20px;padding:16px;background:#FFF8F0;border-radius:8px;border:1px solid #C9A227;display:none;\">' +",
      "        '<p style=\"color:#8B7355;\">点击上方模块查看详情</p>' +",
      "      '</div>' +",
      "    '</div>';",
      "  },",
      "",
      "  _bindEvents() {",
      "    const page = document.getElementById('page-" + sysId + "');",
      "    if (!page) return;",
      "    page.querySelectorAll('.sb-module-card').forEach(card => {",
      "      card.addEventListener('click', () => {",
      "        const moduleId = card.dataset.module;",
      "        this._showModuleDetail(moduleId);",
      "      });",
      "    });",
      "  },",
      "",
      "  _showModuleDetail(moduleId) {",
      "    const detail = document.getElementById('" + sysId + "-detail');",
      "    if (!detail) return;",
      "    const module = " + varName + "Controller.getModule(moduleId);",
      "    if (!module) return;",
      "    detail.style.display = 'block';",
      "    detail.innerHTML = '<h3 style=\"color:#2C1810;margin:0 0 12px;\">' + module.name + '</h3>' +",
      "      '<p style=\"color:#8B7355;margin:0 0 12px;\">' + module.desc + '</p>' +",
      "      '<div style=\"display:flex;gap:8px;\"><button onclick=\"" + varName + "Controller.updateState(' + \"'lastAction',\\x27' + moduleId + '\\x27' + ')\" style=\"background:#C9A227;color:#2C1810;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;\">执行</button></div>';",
      "  }",
      "};"
    ].join('\n');
  },

  /**
   * 生成数据模型模块代码
   * @param {Object} systemData 系统数据
   * @param {string} varName 变量名
   * @returns {string} 代码字符串
   */
  _generateData(systemData, varName) {
    const schema = systemData.dataSchema || {};

    return `
      // 系统「${systemData.name}」— 数据模型
      const ${varName}Data = {
        systemId: '${systemData.systemId}',
        schema: ${JSON.stringify(schema)},

          // 初始化模块入口
        init() {
    // 初始化模块入口
          // 初始化默认值
          const existing = SystemBuilder.getSystemData('${systemData.systemId}', 'data', null);
          if (!existing) {
            SystemBuilder.setSystemData('${systemData.systemId}', 'data', this.schema);
          }
        },

        get(key) {
          const data = SystemBuilder.getSystemData('${systemData.systemId}', 'data', {});
          return key ? data[key] : data;
        },

        set(key, value) {
          const data = SystemBuilder.getSystemData('${systemData.systemId}', 'data', {});
          data[key] = value;
          SystemBuilder.setSystemData('${systemData.systemId}', 'data', data);
          return data;
        },

        reset() {
          SystemBuilder.setSystemData('${systemData.systemId}', 'data', this.schema);
          return this.schema;
        },

        export() {
          return SystemBuilder.getSystemData('${systemData.systemId}', 'data', {});
        },

        import(data) {
          SystemBuilder.setSystemData('${systemData.systemId}', 'data', data);
          return data;
        }
      };
    `;
  },

  /**
   * 生成联动规则模块代码
   * @param {Object} systemData 系统数据
   * @param {string} varName 变量名
   * @returns {string} 代码字符串
   */
  _generateRules(systemData, varName) {
    const rules = systemData.rules || [];

    return `
      // 系统「${systemData.name}」— 联动规则
      const ${varName}Rules = {
        systemId: '${systemData.systemId}',
        rules: ${JSON.stringify(rules)},

          // 初始化模块入口
        init() {
    // 初始化模块入口
          if (window.EventBridge) {
            EventBridge.on('global', (e) => {
              this._processEvent(e.type, e.data);
            }, '${systemData.systemId}Rules');
          }
        },

        _processEvent(event, data) {
          for (const rule of this.rules) {
            if (rule.trigger === event || event.includes(rule.trigger)) {
              this._executeRule(rule, data);
            }
          }
        },

        _executeRule(rule, context) {
          try {
            // 条件判断
            if (rule.condition && !this._checkCondition(rule.condition, context)) {
              return;
            }
            // 执行动作
            console.log(\`[${systemData.name}] 规则触发: \${rule.trigger} → \${rule.action}\`);
            if (window.EventBridge) {
              EventBridge.emit('${systemData.systemId}', rule.action, { rule, context }, '${systemData.systemId}Rules');
            }
          } catch (e) {
            console.warn('[${systemData.name}] 规则执行错误:', e);
          }
        },

        _checkCondition(condition, context) {
          try {
            const fn = new Function('context', 'with(context){return (' + condition + ')}');
            return fn(context || {});
          } catch (e) {
            return false;
          }
        },

        addRule(rule) {
          rule.id = 'rule_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
          this.rules.push(rule);
          return rule;
        },

        removeRule(ruleId) {
          this.rules = this.rules.filter(r => r.id !== ruleId);
        },

        listRules() {
          return this.rules;
        }
      };
    `;
  },

  // ===================== 辅助方法 =====================
  /**
   * 提取关键词
   * @param {string} description 用户描述
   * @returns {Array<string>} 关键词列表
   */
  _extractKeywords(description) {
    const keywordMap = {
      '修仙': ['xianxiu', 'cultivation', 'immortal'],
      '修真': ['xianxiu'],
      '境界': ['xianxiu', 'cultivation'],
      '灵根': ['xianxiu', 'spiritRoot'],
      '功法': ['xianxiu', 'wuxia'],
      '炼丹': ['xianxiu', 'alchemy'],
      '法宝': ['xianxiu', 'artifacts'],
      '渡劫': ['xianxiu', 'tribulation'],

      '武侠': ['wuxia', 'martial'],
      '门派': ['wuxia'],
      '江湖': ['wuxia', 'adventure'],
      '武学': ['wuxia', 'martial'],
      '招式': ['wuxia', 'martial'],
      '掌门': ['wuxia', 'competition'],

      '宫廷': ['gongting', 'palace'],
      '宫斗': ['gongting'],
      '位分': ['gongting', 'rank'],
      '恩宠': ['gongting', 'favor'],
      '皇子': ['gongting', 'prince'],
      '后宫': ['gongting'],

      '商贾': ['shanggu', 'merchant'],
      '经营': ['shanggu'],
      '店铺': ['shanggu', 'shop'],
      '买卖': ['shanggu', 'trade'],
      '伙计': ['shanggu', 'hire'],

      '科幻': ['sci_fi', 'scifi'],
      '舰队': ['sci_fi'],
      '舰船': ['sci_fi', 'shipyard'],
      '星际': ['sci_fi', 'spacetrade'],
      '星图': ['sci_fi', 'starmap'],
      '外星': ['sci_fi', 'alien']
    };

    const keywords = [];
    for (const [word, tags] of Object.entries(keywordMap)) {
      if (description.includes(word)) {
        keywords.push(...tags);
      }
    }
    return [...new Set(keywords)];
  },

  /**
   * 匹配最接近的模板
   * @param {Array<string>} keywords 关键词
   * @returns {Object|null} 匹配的模板
   */
  _matchTemplate(keywords) {
    const scores = {};
    for (const [id, tmpl] of Object.entries(this.TEMPLATES)) {
      scores[id] = 0;
      for (const kw of keywords) {
        if (id.includes(kw) || kw.includes(id)) scores[id] += 3;
        for (const mod of tmpl.modules) {
          if (mod.id === kw || mod.name.includes(kw)) scores[id] += 2;
        }
      }
    }

    let bestId = null;
    let bestScore = 0;
    for (const [id, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestId = id;
      }
    }

    if (bestId && bestScore >= 2) {
      return this.TEMPLATES[bestId];
    }
    return null;
  },

  /**
   * 构建自定义系统
   * @param {string} description 原始描述
   * @param {Array<string>} keywords 关键词
   * @param {Object|null} template 匹配模板
   * @returns {Object} 系统数据
   */
  _buildCustomSystem(description, keywords, template) {
    const systemId = this._generateSystemId('custom');
    let modules = [];
    let rules = [];
    let dataSchema = {};

    if (template) {
      // 基于模板修改
      modules = [...template.modules];
      rules = [...template.rules];
      dataSchema = { ...template.dataSchema };
    }

    // 从描述中提取额外模块
    const moduleKeywords = {
      '背包': { name: '背包', id: 'inventory', desc: '物品存储与管理' },
      '任务': { name: '任务', id: 'quest', desc: '任务接取与完成' },
      '成就': { name: '成就', id: 'achievement', desc: '成就解锁与收集' },
      '技能': { name: '技能树', id: 'skillTree', desc: '技能学习与升级' },
      '商店': { name: '商店', id: 'shop', desc: '物品购买与出售' },
      '合成': { name: '合成', id: 'craft', desc: '物品合成与制造' },
      '宠物': { name: '宠物', id: 'pet', desc: '宠物培养与战斗' },
      '坐骑': { name: '坐骑', id: 'mount', desc: '坐骑获取与骑乘' }
    };

    for (const [word, mod] of Object.entries(moduleKeywords)) {
      if (description.includes(word) && !modules.find(m => m.id === mod.id)) {
        modules.push(mod);
        dataSchema[mod.id] = {};
      }
    }

    // 生成规则（如果没有模板）
    if (rules.length === 0 && modules.length >= 2) {
      for (let i = 0; i < modules.length - 1; i++) {
        rules.push({
          trigger: `${modules[i].name}完成`,
          condition: '',
          action: `解锁${modules[i + 1].name}`,
          target: modules[i + 1].id
        });
      }
    }

    return {
      systemId,
      name: this._extractSystemName(description) || (template ? template.name : '自定义系统'),
      icon: template ? template.icon : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>',
      description: description,
      source: 'custom',
      modules,
      rules,
      dependencies: template ? [...template.dependencies] : [],
      dataSchema,
      keywords,
      basedOn: template ? template.id : null,
      createdAt: Date.now(),
      status: 'installed'
    };
  },

  /**
   * 从描述中提取系统名称
   * @param {string} description 描述
   * @returns {string|null}
   */
  _extractSystemName(description) {
    const match = description.match(/(.+?)(?:系统|模块|功能)/);
    if (match) {
      return match[1].trim() + '系统';
    }
    return null;
  },

  /**
   * 生成系统ID
   * @param {string} prefix 前缀
   * @returns {string} 系统ID
   */
  _generateSystemId(prefix) {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  },

  /**
   * 转换为驼峰命名
   * @param {string} str 字符串
   * @returns {string} 驼峰命名
   */
  _toCamelCase(str) {
    return str.replace(/[_-]+(.)?/g, (_, char) => char ? char.toUpperCase() : '').replace(/^./, c => c.toUpperCase());
  },

  /**
   * 预估存储大小
   * @param {Object} tmpl 模板
   * @returns {number} 字节数
   */
  _estimateStorage(tmpl) {
    let size = JSON.stringify(tmpl).length;
    for (const mod of tmpl.modules) {
      size += 1024; // 每个模块代码约1KB
    }
    for (const rule of tmpl.rules) {
      size += 512; // 每条规则约0.5KB
    }
    return size;
  },

  // ===================== 注册与注销 =====================
  /**
   * 注册导航项
   * @param {Object} systemData 系统数据
   */
  _registerNavItem(systemData) {
    if (!window.App) return;
    const pageId = systemData.systemId;
    const item = {
      iconSvg: 'icon-skills',
      label: systemData.name,
      page: pageId
    };
    App.addNavItem(item);
  },

  /**
   * 注销导航项
   * @param {string} systemId 系统ID
   */
  _unregisterNavItem(systemId) {
    if (!window.App) return;
    App.removeNavItem(systemId);
  },

  /**
   * 注册页面容器
   * @param {Object} systemData 系统数据
   */
  _registerPageContainer(systemData) {
    const contentArea = document.getElementById('contentArea');
    if (!contentArea) return;

    const pageId = 'page-' + systemData.systemId;
    if (!document.getElementById(pageId)) {
      const section = document.createElement('section');
      section.className = 'page-view';
      section.id = pageId;
      contentArea.appendChild(section);
    }

    // 注册到 App.onPageEnter 回调
    if (window.App && App.onPageEnter) {
      const callbacks = App.onPageEnter._callbacks || {};
      const varName = this._toCamelCase(systemData.systemId);
      callbacks[systemData.systemId] = {
        onEnter: () => {
          const ctrl = window[varName + 'Controller'];
          if (ctrl && typeof ctrl.onEnter === 'function') {
            ctrl.onEnter();
          }
        }
      };
    }
  },

  /**
   * 注册系统回调
   * @param {Object} systemData 系统数据
   */
  _registerSystemCallbacks(systemData) {
    const varName = this._toCamelCase(systemData.systemId);
    const ctrl = window[varName + 'Controller'];
    if (ctrl && typeof ctrl.init === 'function') {
      try { ctrl.init(); } catch (e) { console.warn('[SystemBuilder] init error:', e); }
    }
    const data = window[varName + 'Data'];
    if (data && typeof data.init === 'function') {
      try { data.init(); } catch (e) { console.warn('[SystemBuilder] data init error:', e); }
    }
    const rules = window[varName + 'Rules'];
    if (rules && typeof rules.init === 'function') {
      try { rules.init(); } catch (e) { console.warn('[SystemBuilder] rules init error:', e); }
    }
  },

  /**
   * 注销系统回调
   * @param {string} systemId 系统ID
   */
  _unregisterSystemCallbacks(systemId) {
    const varName = this._toCamelCase(systemId);
    const ctrl = window[varName + 'Controller'];
    if (ctrl) ctrl.active = false;
  },

  /**
   * 初始化系统数据
   * @param {Object} systemData 系统数据
   */
  _initSystemData(systemData) {
    const existing = this.getSystemData(systemData.systemId, 'initialized', false);
    if (!existing && systemData.dataSchema) {
      this.setSystemData(systemData.systemId, 'data', systemData.dataSchema);
      this.setSystemData(systemData.systemId, 'initialized', true);
    }
  },

  /**
   * 删除系统模块代码
   * @param {string} systemId 系统ID
   */
  _deleteSystemModules(systemId) {
    const keys = ['_controller', '_ui', '_data', '_rules'];
    for (const suffix of keys) {
      localStorage.removeItem(this.PREFIX + 'code_' + systemId + suffix);
    }

    // 删除 script 标签
    const script = document.getElementById('sb_system_' + systemId);
    if (script && script.parentNode) {
      script.parentNode.removeChild(script);
    }

    // 清理全局对象
    const varName = this._toCamelCase(systemId);
    try {
      window[varName + 'Controller'] = undefined;
      window[varName + 'UI'] = undefined;
      window[varName + 'Data'] = undefined;
      window[varName + 'Rules'] = undefined;
    } catch (e) {
      console.warn('[SystemBuilder] 清理全局对象警告:', e);
    }
  },

  // ===================== 规则执行辅助 =====================
  /**
   * 评估条件
   * @param {string} condition 条件表达式
   * @param {Object} context 上下文
   * @returns {boolean}
   */
  _evaluateCondition(condition, context) {
    if (!condition) return true;
    try {
      const fn = new Function('ctx', 'with(ctx){return (' + condition + ')}');
      return fn(context || {});
    } catch (e) {
      console.warn('[SystemBuilder] 条件评估错误:', e);
      return false;
    }
  },

  /**
   * 执行规则动作
   * @param {Object} rule 规则
   * @param {Object} context 上下文
   */
  _executeRuleAction(rule, context) {
    console.log(`[SystemBuilder] 执行规则: ${rule.trigger} → ${rule.action}`);

    // 查找目标系统
    const systems = this._getInstalledSystems();
    const targetSystem = systems.find(s => s.systemId === rule.target || s.modules.some(m => m.id === rule.target));

    if (targetSystem) {
      // 发送事件到目标系统
      if (window.EventBridge) {
        EventBridge.emit(rule.target, rule.action, { rule, context, amount: rule.amount }, 'SystemBuilder');
      }

      // 更新数据
      if (rule.amount && targetSystem.systemId) {
        const data = this.getSystemData(targetSystem.systemId, 'data', {});
        if (data && typeof data === 'object') {
          // 尝试找到合适的字段更新
          for (const key of Object.keys(data)) {
            if (typeof data[key] === 'number') {
              data[key] += rule.amount;
              this.setSystemData(targetSystem.systemId, 'data', data);
              break;
            }
          }
        }
      }
    }
  },

  // ===================== 存储操作 =====================
  /**
   * 获取已安装系统列表
   * @returns {Array<Object>}
   */
  _getInstalledSystems() {
    return Storage.get(this.PREFIX + 'installed', []);
  },

  /**
   * 保存已安装系统列表
   * @param {Array<Object>} systems
   */
  _saveInstalledSystems(systems) {
    Storage.set(this.PREFIX + 'installed', systems);
  },

  /**
   * 获取启用的系统列表
   * @returns {Array<string>}
   */
  _getActiveSystems() {
    return Storage.get(this.PREFIX + 'active', []);
  },
  /**
   * 保存启用的系统列表
   * @param {Array<string>} active
   */
  _saveActiveSystems(active) {
    Storage.set(this.PREFIX + 'active', active);
  },

  /**
   * 获取联动规则
   * @returns {Array<Object>}
   */
  _getRules() {
    return Storage.get(this.RULES_KEY, []);
  },

  /**
   * 保存联动规则
   * @param {Array<Object>} rules
   */
  _saveRules(rules) {
    Storage.set(this.RULES_KEY, rules);
  },

  /**
   * 加载状态
   */
  _loadInstalledSystems() {
    this.installedSystems = this._getInstalledSystems();
  },

  _loadActiveSystems() {
    this.activeSystems = this._getActiveSystems();
  },

  _loadRules() {
    // 规则已存储在 this.RULES_KEY
  },

  /**
   * 获取总存储大小
   * @returns {number} 字节数
   */
  _getTotalStorageSize() {
    let size = 0;
    const prefix = this.PREFIX;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        size += localStorage.getItem(key).length;
      }
    }
    return size;
  },

  // ===================== UI样式 =====================
  /**
   * 获取UI样式字符串
   * @returns {Object} 样式对象
   */
  _getUIStyles() {
    return {
      container: 'padding:0;min-height:100%;background:#F5E6D3;',
      css: `
        <style>
          .sb-template-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(44,24,16,0.15); }
          .sb-module-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(44,24,16,0.1); }
          .sb-tab.active { background:#C9A227;color:#2C1810;font-weight:bold; }
          .sb-status-badge.active { background:#C9A227;color:#2C1810; }
          .sb-status-badge.paused { background:#8B7355;color:#FFF8F0; }
        </style>
      `,
      header: 'padding:20px 24px;border-bottom:2px solid #C9A227;background:#FFF8F0;',
      title: 'margin:0 0 16px;color:#2C1810;font-family:var(--font-display);font-size:24px;',
      tabs: 'display:flex;gap:8px;',
      tab: 'padding:8px 16px;border:1px solid #C9A227;border-radius:6px;background:transparent;color:#8B7355;cursor:pointer;font-family:var(--font-body);font-size:14px;transition:all 0.2s;',
      content: 'padding:24px;',
      market: '',
      subtitle: 'color:#8B7355;margin:0 0 20px;font-size:14px;',
      grid: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;',
      card: 'background:#FFF8F0;border:2px solid #C9A227;border-radius:12px;padding:20px;cursor:pointer;transition:transform 0.2s,box-shadow 0.2s;',
      cardIcon: 'font-size:36px;margin-bottom:12px;text-align:center;',
      cardTitle: 'margin:0 0 8px;color:#2C1810;font-size:16px;text-align:center;',
      cardDesc: 'color:#8B7355;font-size:13px;margin:0 0 12px;text-align:center;',
      cardMeta: 'display:flex;justify-content:center;gap:12px;color:#8B7355;font-size:12px;margin-bottom:16px;',
      cardActions: 'display:flex;gap:8px;justify-content:center;',
      btnPrimary: 'padding:8px 16px;background:#C9A227;color:#2C1810;border:none;border-radius:6px;cursor:pointer;font-family:var(--font-body);font-size:14px;font-weight:bold;transition:opacity 0.2s;',
      btnSecondary: 'padding:8px 16px;background:transparent;color:#8B7355;border:1px solid #C9A227;border-radius:6px;cursor:pointer;font-family:var(--font-body);font-size:14px;transition:all 0.2s;',
      btnDanger: 'padding:8px 16px;background:#C0392B;color:#FFF;border:none;border-radius:6px;cursor:pointer;font-family:var(--font-body);font-size:14px;transition:opacity 0.2s;',
      custom: 'max-width:700px;',
      inputGroup: 'display:flex;flex-direction:column;gap:12px;',
      textarea: 'width:100%;padding:12px;border:2px solid #C9A227;border-radius:8px;background:#FFF8F0;color:#2C1810;font-family:var(--font-body);font-size:14px;resize:vertical;',
      hints: 'margin-top:20px;padding:16px;background:#FFF8F0;border-radius:8px;border:1px solid #C9A227;',
      hintList: 'margin:8px 0 0;padding-left:20px;color:#8B7355;font-size:13px;',
      preview: 'max-width:700px;',
      previewTitle: 'margin:0 0 20px;color:#2C1810;font-size:20px;',
      previewSection: 'margin-bottom:20px;padding:16px;background:#FFF8F0;border-radius:8px;border:1px solid #C9A227;',
      previewSectionTitle: 'margin:0 0 12px;color:#2C1810;font-size:16px;',
      previewList: 'margin:0;padding-left:20px;color:#8B7355;font-size:14px;',
      previewItem: 'margin-bottom:6px;',
      previewInfo: 'margin:4px 0;color:#8B7355;font-size:13px;',
      previewActions: 'display:flex;gap:12px;margin-top:20px;',
      empty: 'text-align:center;padding:60px 20px;',
      emptyTitle: 'color:#2C1810;margin:0 0 8px;font-size:18px;',
      emptyDesc: 'color:#8B7355;margin:0 0 20px;font-size:14px;',
      mySystems: '',
      systemsList: 'display:flex;flex-direction:column;gap:12px;',
      systemItem: 'display:flex;justify-content:space-between;align-items:center;padding:16px;background:#FFF8F0;border-radius:8px;border:1px solid #C9A227;',
      systemInfo: 'flex:1;',
      systemName: 'display:flex;align-items:center;gap:8px;color:#2C1810;font-size:16px;font-weight:bold;margin-bottom:6px;',
      badgeActive: 'padding:2px 8px;border-radius:4px;font-size:11px;',
      badgePaused: 'padding:2px 8px;border-radius:4px;font-size:11px;',
      systemMeta: 'display:flex;gap:12px;color:#8B7355;font-size:12px;',
      systemActions: 'display:flex;gap:8px;',
      backupAction: 'margin-top:20px;text-align:center;'
    };
  },

  // ===================== 导出/导入 =====================
  /**
   * 导出所有系统数据
   * @returns {Object}
   */
  exportAll() {
    return {
      version: '1.0',
      exportedAt: Date.now(),
      systems: this._getInstalledSystems(),
      active: this._getActiveSystems(),
      rules: this._getRules()
    };
  },

  /**
   * 导入系统数据
   * @param {Object} data 导入数据
   * @returns {Object} { success, message }
   */
  importAll(data) {
    if (!data.systems || !Array.isArray(data.systems)) {
      return { success: false, message: '无效的系统数据' };
    }

    this._backupCurrentState();

    for (const system of data.systems) {
      this.installSystem(system);
    }

    if (data.active && Array.isArray(data.active)) {
      for (const sysId of data.active) {
        this.enableSystem(sysId);
      }
    }

    if (data.rules && Array.isArray(data.rules)) {
      const existing = this._getRules();
      this._saveRules([...existing, ...data.rules]);
    }

    return { success: true, message: `已导入 ${data.systems.length} 个系统` };
  }
};

// 自动初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => SystemBuilder.init());
} else {
  SystemBuilder.init();
}
