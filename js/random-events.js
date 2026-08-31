/**
 * ============================================================================
 * 随机事件系统 (Random Events System) — random-events.js
 * ============================================================================
 * 视觉小说系统 v6 扩展模块
 * 核心约束：初始事件模板库为空，所有事件/条件/效果由用户自由配置
 * 视觉风格：古风墨境 — 暖羊皮纸底色 #F5E6D3 + 金色 #C9A227 + 墨色 #2C1810
 * 存储键：random_events_v12
 * 全局对象：RandomEvents
 * ============================================================================
 */

(function () {
  "use strict";

  // ============================================================
  // 常量定义
  // ============================================================

  /** 存储键名 */
  const STORAGE_KEY = "random_events_v12";

  /** 古风墨境配色 */
  const COLORS = {
    parchment: "#F5E6D3",   // 暖羊皮纸底色
    gold: "#C9A227",        // 金色
    ink: "#2C1810",         // 墨色
    inkLight: "#5C3D2E",    // 浅墨色
    inkFade: "#8C6D5E",     // 淡墨色
    red: "#B22222",         // 暗红
    green: "#2E5A3E",       // 墨绿
    white: "#FFFDF8",       // 近白
    border: "#D4C4A8",      // 边框色
  };

  /** 稀有度定义 */
  const RARITY = {
    common:   { label: "普通", stars: 1, color: "#8C6D5E" },
    uncommon: { label: "少见", stars: 2, color: "#5C8A3E" },
    rare:     { label: "稀有", stars: 3, color: "#3A7CA5" },
    epic:     { label: "史诗", stars: 4, color: "#7B4397" },
    legendary:{ label: "传说", stars: 5, color: "#C9A227" },
  };

  /** 触发条件类型 */
  const TRIGGER_TYPES = {
    LOCATION:  "location",   // 地点条件
    TIME:      "time",       // 时间条件
    ATTRIBUTE: "attribute",  // 属性条件
    RELATION:  "relation",   // 关系条件
    RANDOM:    "random",     // 随机条件
    COMBINED:  "combined",   // 组合条件
  };

  /** 效果类型 */
  const EFFECT_TYPES = {
    MODIFY_ATTR:  "modify_attribute",   // 修改属性
    MODIFY_FAVOR: "modify_favorability",// 修改好感度
    GAIN_ITEM:    "gain_item",          // 获得物品
    LOSE_ITEM:    "lose_item",          // 失去物品
    TRIGGER_EVENT:"trigger_event",      // 触发其他事件
    SHOW_TEXT:    "show_text",          // 显示提示文本
    AI_PLOT:      "ai_plot",            // AI生成剧情
  };

  /** 组合条件逻辑操作 */
  const COMBINE_OPS = {
    AND: "and",
    OR:  "or",
  };

  // ============================================================
  // 状态数据
  // ============================================================

  /** 事件模板库 */
  let eventTemplates = [];

  /** 分类列表 */
  let categories = [];

  /** 触发记录（历史日志） */
  let triggerHistory = [];

  /** 冷却跟踪：事件ID -> 下次可触发时间戳 */
  let cooldownTracker = {};

  /** 当前激活的事件弹窗 */
  let activeModal = null;

  // ============================================================
  // 工具函数
  // ============================================================

  /**
   * 生成唯一ID
   * @returns {string}
   */
  function generateId() {
    return "evt_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  /**
   * 生成时间戳字符串
   * @returns {string}
   */
  function getTimestamp() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const h = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${d} ${h}:${min}`;
  }

  /**
   * 深拷贝对象
   * @param {any} obj
   * @returns {any}
   */
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * 创建DOM元素并设置属性
   * @param {string} tag
   * @param {Object} attrs
   * @param {string} [text]
   * @returns {HTMLElement}
   */
  function createEl(tag, attrs, text) {
    const el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        if (k === "style" && typeof attrs[k] === "object") {
          Object.assign(el.style, attrs[k]);
        } else {
          el.setAttribute(k, attrs[k]);
        }
      });
    }
    if (text) el.textContent = text;
    return el;
  }

  /**
   * 渲染星级
   * @param {number} count
   * @returns {string}
   */
  function renderStars(count) {
    let html = "";
    for (let i = 0; i < 5; i++) {
      html += i < count ? "<span style=\"color:#C9A227;\">&#9733;</span>" : "<span style=\"color:#D4C4A8;\">&#9734;</span>";
    }
    return html;
  }

  // ============================================================
  // 持久化
  // ============================================================

  /**
   * 从 localStorage 加载数据
   */
  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        eventTemplates = data.eventTemplates || [];
        categories = data.categories || [];
        triggerHistory = data.triggerHistory || [];
        cooldownTracker = data.cooldownTracker || {};
      } else {
        eventTemplates = [];
        categories = [];
        triggerHistory = [];
        cooldownTracker = {};
      }
    } catch (e) {
      console.error("[RandomEvents] 加载数据失败:", e);
      eventTemplates = [];
      categories = [];
      triggerHistory = [];
      cooldownTracker = {};
    }
  }

  /**
   * 保存数据到 localStorage
   */
  function saveData() {
    try {
      const data = {
        eventTemplates: eventTemplates,
        categories: categories,
        triggerHistory: triggerHistory,
        cooldownTracker: cooldownTracker,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("[RandomEvents] 保存数据失败:", e);
    }
  }

  // ============================================================
  // 分类管理
  // ============================================================

  /**
   * 添加新分类
   * @param {string} name
   * @returns {boolean} 是否成功
   */
  function addCategory(name) {
    if (!name || typeof name !== "string") return false;
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (categories.includes(trimmed)) return false;
    categories.push(trimmed);
    saveData();
    return true;
  }

  /**
   * 删除分类（会把该分类下的事件设为未分类）
   * @param {string} name
   * @returns {boolean}
   */
  function removeCategory(name) {
    const idx = categories.indexOf(name);
    if (idx === -1) return false;
    categories.splice(idx, 1);
    eventTemplates.forEach((evt) => {
      if (evt.category === name) evt.category = "";
    });
    saveData();
    return true;
  }

  /**
   * 重命名分类
   * @param {string} oldName
   * @param {string} newName
   * @returns {boolean}
   */
  function renameCategory(oldName, newName) {
    if (!newName || !newName.trim()) return false;
    const trimmed = newName.trim();
    if (categories.includes(trimmed)) return false;
    const idx = categories.indexOf(oldName);
    if (idx === -1) return false;
    categories[idx] = trimmed;
    eventTemplates.forEach((evt) => {
      if (evt.category === oldName) evt.category = trimmed;
    });
    saveData();
    return true;
  }

  /**
   * 获取所有分类
   * @returns {string[]}
   */
  function getCategories() {
    return deepClone(categories);
  }

  // ============================================================
  // 事件模板管理
  // ============================================================

  /**
   * 创建新的事件模板
   * @param {Object} template 事件模板数据（不含id）
   * @returns {Object|null} 创建成功返回模板对象，失败返回null
   */
  function createTemplate(template) {
    if (!template || !template.name || !template.description) return null;
    const evt = {
      id: generateId(),
      name: template.name,
      description: template.description,
      category: template.category || "",
      triggerConditions: template.triggerConditions || [],
      effects: template.effects || [],
      rarity: template.rarity || "common",
      cooldown: template.cooldown || 0, // 冷却时间（毫秒）
      options: template.options || [],    // 事件选项（1-3个）
      createdAt: getTimestamp(),
    };
    eventTemplates.push(evt);
    saveData();
    return deepClone(evt);
  }

  /**
   * 更新事件模板
   * @param {string} id
   * @param {Object} updates
   * @returns {boolean}
   */
  function updateTemplate(id, updates) {
    const idx = eventTemplates.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    const allowed = ["name", "description", "category", "triggerConditions", "effects", "rarity", "cooldown", "options"];
    allowed.forEach((key) => {
      if (updates[key] !== undefined) {
        eventTemplates[idx][key] = updates[key];
      }
    });
    saveData();
    return true;
  }

  /**
   * 删除事件模板
   * @param {string} id
   * @returns {boolean}
   */
  function deleteTemplate(id) {
    const idx = eventTemplates.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    eventTemplates.splice(idx, 1);
    saveData();
    return true;
  }

  /**
   * 获取所有事件模板
   * @returns {Object[]}
   */
  function getTemplates() {
    return deepClone(eventTemplates);
  }

  /**
   * 获取单个事件模板
   * @param {string} id
   * @returns {Object|null}
   */
  function getTemplate(id) {
    const found = eventTemplates.find((e) => e.id === id);
    return found ? deepClone(found) : null;
  }

  /**
   * 示例模板（用户可直接删除）
   * @returns {Object[]}
   */
  function getExampleTemplates() {
    return [
      {
        name: "街边偶遇",
        description: "你在熙熙攘攘的街市中偶然撞见一位故人，目光交汇间似有千言万语。",
        category: "社交",
        triggerConditions: [
          { type: TRIGGER_TYPES.LOCATION, locationType: "city", logic: "equals" },
          { type: TRIGGER_TYPES.RANDOM, probability: 0.15 },
        ],
        effects: [
          { type: EFFECT_TYPES.MODIFY_FAVOR, target: "random_npc", value: 5 },
          { type: EFFECT_TYPES.SHOW_TEXT, text: "与故人寒暄几句，心中感慨万千。" },
        ],
        rarity: "uncommon",
        cooldown: 3600000, // 1小时
        options: [
          { label: "上前攀谈", effects: [{ type: EFFECT_TYPES.MODIFY_FAVOR, target: "random_npc", value: 10 }] },
          { label: "点头致意", effects: [{ type: EFFECT_TYPES.SHOW_TEXT, text: "你微微颔首，继续自己的路。" }] },
        ],
      },
      {
        name: "雨中奇遇",
        description: "一场突如其来的大雨中，你发现了一处隐蔽的避雨亭，亭中似乎有人在低语。",
        category: "奇遇",
        triggerConditions: [
          { type: TRIGGER_TYPES.TIME, weather: "rain", logic: "equals" },
          { type: TRIGGER_TYPES.RANDOM, probability: 0.1 },
        ],
        effects: [
          { type: EFFECT_TYPES.GAIN_ITEM, item: "神秘卷轴", quantity: 1 },
          { type: EFFECT_TYPES.AI_PLOT, prompt: "生成一段雨中亭中偶遇的剧情，包含神秘低语和隐藏线索" },
        ],
        rarity: "rare",
        cooldown: 7200000, // 2小时
        options: [
          { label: "靠近细听", effects: [{ type: EFFECT_TYPES.AI_PLOT, prompt: "描述靠近后听到的秘密内容" }] },
          { label: "避雨离开", effects: [{ type: EFFECT_TYPES.MODIFY_ATTR, target: "health", value: -2 }] },
        ],
      },
      {
        name: "暗夜危机",
        description: "月黑风高之夜，一道寒光闪过——有人在暗处对你不利！",
        category: "危机",
        triggerConditions: [
          { type: TRIGGER_TYPES.TIME, timeOfDay: "night", logic: "equals" },
          { type: TRIGGER_TYPES.ATTRIBUTE, target: "reputation", operator: ">", value: 50 },
          { type: TRIGGER_TYPES.RANDOM, probability: 0.08 },
        ],
        effects: [
          { type: EFFECT_TYPES.MODIFY_ATTR, target: "health", value: -15 },
          { type: EFFECT_TYPES.SHOW_TEXT, text: "你奋力反击，虽然受伤但击退了刺客。" },
        ],
        rarity: "epic",
        cooldown: 14400000, // 4小时
        options: [
          { label: "全力反击", effects: [{ type: EFFECT_TYPES.MODIFY_ATTR, target: "strength", value: 2 }, { type: EFFECT_TYPES.MODIFY_ATTR, target: "health", value: -10 }] },
          { label: "闪身躲避", effects: [{ type: EFFECT_TYPES.MODIFY_ATTR, target: "health", value: -5 }, { type: EFFECT_TYPES.MODIFY_ATTR, target: "agility", value: 1 }] },
          { label: "呼救求援", effects: [{ type: EFFECT_TYPES.TRIGGER_EVENT, eventId: "rescue_event" }] },
        ],
      },
    ];
  }

  // ============================================================
  // 触发条件评估
  // ============================================================

  /**
   * 评估单个触发条件
   * @param {Object} condition 条件对象
   * @param {Object} context 当前上下文
   * @returns {boolean}
   */
  function evaluateCondition(condition, context) {
    if (!condition || !condition.type) return false;

    const ctx = context || {};
    const currentTime = Date.now();

    switch (condition.type) {
      case TRIGGER_TYPES.LOCATION:
        // 地点条件：检查当前地点或地点类型
        if (condition.locationId && ctx.currentLocationId) {
          if (condition.logic === "equals") return ctx.currentLocationId === condition.locationId;
          if (condition.logic === "not_equals") return ctx.currentLocationId !== condition.locationId;
        }
        if (condition.locationType && ctx.currentLocationType) {
          if (condition.logic === "equals") return ctx.currentLocationType === condition.locationType;
          if (condition.logic === "not_equals") return ctx.currentLocationType !== condition.locationType;
        }
        return false;

      case TRIGGER_TYPES.TIME:
        // 时间条件：时辰/季节/天气
        if (condition.timeOfDay && ctx.currentTimeOfDay) {
          if (condition.logic === "equals") return ctx.currentTimeOfDay === condition.timeOfDay;
        }
        if (condition.season && ctx.currentSeason) {
          if (condition.logic === "equals") return ctx.currentSeason === condition.season;
        }
        if (condition.weather && ctx.currentWeather) {
          if (condition.logic === "equals") return ctx.currentWeather === condition.weather;
        }
        return false;

      case TRIGGER_TYPES.ATTRIBUTE:
        // 属性条件：玩家/NPC属性比较
        {
          const val = ctx.attributes && ctx.attributes[condition.target];
          if (val === undefined) return false;
          switch (condition.operator) {
            case ">": return val > condition.value;
            case ">=": return val >= condition.value;
            case "<": return val < condition.value;
            case "<=": return val <= condition.value;
            case "=": case "==": return val === condition.value;
            case "!=": return val !== condition.value;
            default: return false;
          }
        }

      case TRIGGER_TYPES.RELATION:
        // 关系条件：与NPC好感度比较
        {
          const val = ctx.relations && ctx.relations[condition.target];
          if (val === undefined) return false;
          switch (condition.operator) {
            case ">": return val > condition.value;
            case ">=": return val >= condition.value;
            case "<": return val < condition.value;
            case "<=": return val <= condition.value;
            case "=": case "==": return val === condition.value;
            case "!=": return val !== condition.value;
            default: return false;
          }
        }

      case TRIGGER_TYPES.RANDOM:
        // 随机条件：纯概率触发
        {
          const prob = condition.probability || 0;
          return Math.random() < prob;
        }

      case TRIGGER_TYPES.COMBINED:
        // 组合条件：AND/OR
        {
          const op = condition.operator || COMBINE_OPS.AND;
          const subConditions = condition.conditions || [];
          if (subConditions.length === 0) return false;
          if (op === COMBINE_OPS.AND) {
            return subConditions.every((sub) => evaluateCondition(sub, ctx));
          } else {
            return subConditions.some((sub) => evaluateCondition(sub, ctx));
          }
        }

      default:
        return false;
    }
  }

  /**
   * 评估事件模板的全部触发条件
   * @param {Object} template 事件模板
   * @param {Object} context 当前上下文
   * @returns {boolean}
   */
  function canTrigger(template, context) {
    if (!template || !template.triggerConditions || template.triggerConditions.length === 0) return false;

    // 检查冷却时间
    if (template.cooldown > 0) {
      const lastTrigger = cooldownTracker[template.id];
      if (lastTrigger && (Date.now() - lastTrigger) < template.cooldown) {
        return false;
      }
    }

    // 评估所有条件（AND逻辑：所有条件必须满足）
    return template.triggerConditions.every((cond) => evaluateCondition(cond, context));
  }

  // ============================================================
  // 事件触发与效果执行
  // ============================================================

  /**
   * 查找所有可触发的事件
   * @param {Object} context 当前上下文
   * @returns {Object[]} 可触发的事件列表（已按稀有度排序）
   */
  function findTriggerableEvents(context) {
    const candidates = eventTemplates.filter((t) => canTrigger(t, context));
    // 按稀有度降序排列（稀有事件优先检测）
    const rarityOrder = ["legendary", "epic", "rare", "uncommon", "common"];
    candidates.sort((a, b) => {
      return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
    });
    return candidates;
  }

  /**
   * 触发单个事件
   * @param {string} eventId 事件模板ID
   * @param {Object} context 当前上下文
   * @returns {Object|null} 触发结果
   */
  function triggerEvent(eventId, context) {
    const template = eventTemplates.find((e) => e.id === eventId);
    if (!template) return null;

    // 更新冷却时间
    if (template.cooldown > 0) {
      cooldownTracker[template.id] = Date.now();
    }

    // 记录历史
    const record = {
      id: generateId(),
      eventId: template.id,
      eventName: template.name,
      triggeredAt: getTimestamp(),
      location: context && context.currentLocationName ? context.currentLocationName : "未知地点",
      result: "进行中",
      details: {},
    };
    triggerHistory.unshift(record);
    saveData();

    // 显示事件弹窗
    showEventModal(template, context, record);

    return {
      triggered: true,
      event: deepClone(template),
      recordId: record.id,
    };
  }

  /**
   * 自动检测并触发一个事件（按概率和稀有度选择）
   * @param {Object} context 当前上下文
   * @param {string} triggerType 触发来源：move/time/plot/explore
   * @returns {Object|null} 触发结果或null
   */
  function autoTrigger(context, triggerType) {
    const candidates = findTriggerableEvents(context);
    if (candidates.length === 0) return null;

    // 如果只有一个候选，直接触发
    if (candidates.length === 1) {
      return triggerEvent(candidates[0].id, context);
    }

    // 多候选时，按稀有度权重随机选择一个
    // 稀有度越高权重越大，但基础概率更低
    const weights = candidates.map((c) => {
      const rarityWeights = { common: 40, uncommon: 30, rare: 18, epic: 8, legendary: 4 };
      return rarityWeights[c.rarity] || 10;
    });
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let selectedIdx = 0;
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        selectedIdx = i;
        break;
      }
    }

    return triggerEvent(candidates[selectedIdx].id, context);
  }

  /**
   * 执行效果列表
   * @param {Object[]} effects 效果数组
   * @param {Object} context 当前上下文
   * @param {Object} [record] 历史记录对象（用于更新结果）
   */
  function executeEffects(effects, context, record) {
    const results = [];
    const ctx = context || {};

    effects.forEach((eff) => {
      switch (eff.type) {
        case EFFECT_TYPES.MODIFY_ATTR:
          results.push({ type: "attr", target: eff.target, value: eff.value, description: `${eff.target} ${eff.value >= 0 ? "+" : ""}${eff.value}` });
          break;

        case EFFECT_TYPES.MODIFY_FAVOR:
          results.push({ type: "favor", target: eff.target, value: eff.value, description: `与${eff.target}的好感度 ${eff.value >= 0 ? "+" : ""}${eff.value}` });
          break;

        case EFFECT_TYPES.GAIN_ITEM:
          results.push({ type: "gain", item: eff.item, quantity: eff.quantity || 1, description: `获得 ${eff.item} x${eff.quantity || 1}` });
          break;

        case EFFECT_TYPES.LOSE_ITEM:
          results.push({ type: "lose", item: eff.item, quantity: eff.quantity || 1, description: `失去 ${eff.item} x${eff.quantity || 1}` });
          break;

        case EFFECT_TYPES.TRIGGER_EVENT:
          results.push({ type: "trigger", eventId: eff.eventId, description: `触发事件 [${eff.eventId}]` });
          // 延迟触发连锁事件
          setTimeout(() => {
            triggerEvent(eff.eventId, ctx);
          }, 500);
          break;

        case EFFECT_TYPES.SHOW_TEXT:
          results.push({ type: "text", text: eff.text, description: eff.text });
          break;

        case EFFECT_TYPES.AI_PLOT:
          results.push({ type: "ai", prompt: eff.prompt, description: "[AI生成剧情]" });
          // 如果存在全局AI调用接口，可以在这里调用
          if (window.generateAIPlot && eff.prompt) {
            window.generateAIPlot(eff.prompt, ctx);
          }
          break;

        default:
          results.push({ type: "unknown", description: "未知效果" });
      }
    });

    // 更新历史记录的结果
    if (record) {
      record.result = "已完成";
      record.details.effects = results;
      saveData();
    }

    return results;
  }

  // ============================================================
  // 事件历史管理
  // ============================================================

  /**
   * 获取触发历史
   * @param {Object} [filter] 过滤条件
   * @returns {Object[]}
   */
  function getHistory(filter) {
    let list = deepClone(triggerHistory);
    if (filter) {
      if (filter.eventName) {
        list = list.filter((h) => h.eventName.includes(filter.eventName));
      }
      if (filter.location) {
        list = list.filter((h) => h.location.includes(filter.location));
      }
      if (filter.result) {
        list = list.filter((h) => h.result === filter.result);
      }
    }
    return list;
  }

  /**
   * 删除单条历史记录
   * @param {string} recordId
   * @returns {boolean}
   */
  function deleteHistory(recordId) {
    const idx = triggerHistory.findIndex((h) => h.id === recordId);
    if (idx === -1) return false;
    triggerHistory.splice(idx, 1);
    saveData();
    return true;
  }

  /**
   * 清空所有历史
   */
  function clearHistory() {
    triggerHistory = [];
    saveData();
  }

  // ============================================================
  // UI — 古风墨境风格界面
  // ============================================================

  /**
   * 创建主界面面板
   * @returns {HTMLElement}
   */
  function createMainPanel() {
    const panel = createEl("div", {
      id: "random-events-panel",
      style: {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(44, 24, 16, 0.85)",
        zIndex: "9999",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Noto Serif SC', 'SimSun', serif",
      },
    });

    const container = createEl("div", {
      style: {
        width: "90%",
        maxWidth: "900px",
        height: "85%",
        backgroundColor: COLORS.parchment,
        border: `3px double ${COLORS.gold}`,
        borderRadius: "8px",
        boxShadow: "0 8px 32px rgba(44,24,16,0.6)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      },
    });

    // 顶部标题栏
    const header = createEl("div", {
      style: {
        padding: "16px 20px",
        borderBottom: `1px solid ${COLORS.border}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "rgba(201,162,39,0.1)",
      },
    });

    const title = createEl("h2", {
      style: {
        margin: "0",
        color: COLORS.ink,
        fontSize: "22px",
        fontWeight: "bold",
        letterSpacing: "2px",
      },
    }, "随机事件");

    const closeBtn = createEl("button", {
      style: {
        background: "none",
        border: `1px solid ${COLORS.inkFade}`,
        color: COLORS.inkFade,
        padding: "4px 12px",
        cursor: "pointer",
        borderRadius: "4px",
        fontSize: "16px",
        fontFamily: "inherit",
      },
    }, "&#10005;");
    closeBtn.addEventListener("click", () => closeMainPanel());
    closeBtn.innerHTML = "&#10005;"; // 修正HTML实体

    header.appendChild(title);
    header.appendChild(closeBtn);

    // 顶部按钮栏
    const toolbar = createEl("div", {
      style: {
        padding: "12px 20px",
        borderBottom: `1px solid ${COLORS.border}`,
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
      },
    });

    const btnNew = createStyledButton("新建事件", () => openEventEditor());
    const btnLibrary = createStyledButton("事件模板库", () => renderTemplateList(container));
    const btnHistory = createStyledButton("触发记录", () => renderHistoryList(container));
    const btnExplore = createStyledButton("探索", () => manualExplore());
    const btnAI = createStyledButton("AI生成事件", () => openAIGenerator());
    const btnCategory = createStyledButton("分类管理", () => openCategoryManager());

    toolbar.appendChild(btnNew);
    toolbar.appendChild(btnLibrary);
    toolbar.appendChild(btnHistory);
    toolbar.appendChild(btnExplore);
    toolbar.appendChild(btnAI);
    toolbar.appendChild(btnCategory);

    // 内容区域
    const content = createEl("div", {
      id: "random-events-content",
      style: {
        flex: "1",
        overflowY: "auto",
        padding: "20px",
        color: COLORS.ink,
      },
    });

    container.appendChild(header);
    container.appendChild(toolbar);
    container.appendChild(content);
    panel.appendChild(container);

    // 初始显示模板列表
    setTimeout(() => renderTemplateList(container), 0);

    return panel;
  }

  /**
   * 创建古风按钮
   * @param {string} text
   * @param {Function} onClick
   * @returns {HTMLButtonElement}
   */
  function createStyledButton(text, onClick) {
    const btn = createEl("button", {
      style: {
        padding: "8px 16px",
        backgroundColor: "transparent",
        border: `2px solid ${COLORS.gold}`,
        color: COLORS.ink,
        cursor: "pointer",
        borderRadius: "4px",
        fontFamily: "inherit",
        fontSize: "14px",
        transition: "all 0.2s ease",
      },
    }, text);
    btn.addEventListener("mouseenter", () => {
      btn.style.backgroundColor = COLORS.gold;
      btn.style.color = COLORS.white;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.backgroundColor = "transparent";
      btn.style.color = COLORS.ink;
    });
    btn.addEventListener("click", onClick);
    return btn;
  }

  /**
   * 渲染事件模板列表
   * @param {HTMLElement} container
   */
  function renderTemplateList(container) {
    const content = container.querySelector("#random-events-content");
    if (!content) return;
    content.innerHTML = "";

    if (eventTemplates.length === 0) {
      const empty = createEl("div", {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: COLORS.inkFade,
          fontSize: "16px",
        },
      });
      const emptyText = createEl("p", {}, "暂无事件模板，点击上方按钮创建你的第一个事件");
      const hint = createEl("p", { style: { fontSize: "13px", marginTop: "8px" } }, '或使用 "AI生成事件" 让AI为你构思');
      empty.appendChild(emptyText);
      empty.appendChild(hint);
      content.appendChild(empty);
      return;
    }

    // 按分类分组
    const grouped = {};
    eventTemplates.forEach((evt) => {
      const cat = evt.category || "未分类";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(evt);
    });

    Object.keys(grouped).forEach((cat) => {
      const catTitle = createEl("h3", {
        style: {
          color: COLORS.gold,
          borderBottom: `1px solid ${COLORS.border}`,
          paddingBottom: "6px",
          marginTop: "20px",
          marginBottom: "12px",
          fontSize: "16px",
        },
      }, cat);
      content.appendChild(catTitle);

      grouped[cat].forEach((evt) => {
        const card = createTemplateCard(evt);
        content.appendChild(card);
      });
    });
  }

  /**
   * 创建事件模板卡片
   * @param {Object} evt
   * @returns {HTMLElement}
   */
  function createTemplateCard(evt) {
    const card = createEl("div", {
      style: {
        backgroundColor: "rgba(255,253,248,0.8)",
        border: `1px solid ${COLORS.border}`,
        borderRadius: "6px",
        padding: "14px 16px",
        marginBottom: "10px",
        cursor: "pointer",
        transition: "box-shadow 0.2s ease",
      },
    });

    card.addEventListener("mouseenter", () => {
      card.style.boxShadow = "0 2px 8px rgba(201,162,39,0.3)";
    });
    card.addEventListener("mouseleave", () => {
      card.style.boxShadow = "none";
    });
    card.addEventListener("click", () => openEventEditor(evt.id));

    // 名称行
    const nameRow = createEl("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "6px",
      },
    });
    const name = createEl("span", {
      style: {
        fontSize: "16px",
        fontWeight: "bold",
        color: COLORS.ink,
      },
    }, evt.name);
    const stars = createEl("span", {
      style: { fontSize: "14px" },
    });
    stars.innerHTML = renderStars(RARITY[evt.rarity]?.stars || 1);
    nameRow.appendChild(name);
    nameRow.appendChild(stars);

    // 触发条件摘要
    const triggerSummary = evt.triggerConditions
      .map((c) => {
        switch (c.type) {
          case TRIGGER_TYPES.LOCATION: return `地点:${c.locationId || c.locationType || "任意"}`;
          case TRIGGER_TYPES.TIME: return `时间:${c.timeOfDay || c.season || c.weather || "任意"}`;
          case TRIGGER_TYPES.ATTRIBUTE: return `属性:${c.target}${c.operator}${c.value}`;
          case TRIGGER_TYPES.RELATION: return `关系:${c.target}${c.operator}${c.value}`;
          case TRIGGER_TYPES.RANDOM: return `概率:${Math.round((c.probability || 0) * 100)}%`;
          case TRIGGER_TYPES.COMBINED: return `组合条件`;
          default: return "未知条件";
        }
      })
      .join(" | ");

    const triggerLine = createEl("div", {
      style: {
        fontSize: "13px",
        color: COLORS.inkFade,
        marginBottom: "4px",
      },
    }, `触发: ${triggerSummary}`);

    // 稀有度标签
    const rarityTag = createEl("span", {
      style: {
        fontSize: "12px",
        color: RARITY[evt.rarity]?.color || COLORS.inkFade,
        border: `1px solid ${RARITY[evt.rarity]?.color || COLORS.inkFade}`,
        padding: "1px 6px",
        borderRadius: "3px",
        display: "inline-block",
        marginTop: "4px",
      },
    }, RARITY[evt.rarity]?.label || "普通");

    card.appendChild(nameRow);
    card.appendChild(triggerLine);
    card.appendChild(rarityTag);

    return card;
  }

  /**
   * 渲染触发历史列表
   * @param {HTMLElement} container
   */
  function renderHistoryList(container) {
    const content = container.querySelector("#random-events-content");
    if (!content) return;
    content.innerHTML = "";

    if (triggerHistory.length === 0) {
      const empty = createEl("div", {
        style: {
          textAlign: "center",
          color: COLORS.inkFade,
          padding: "40px",
          fontSize: "16px",
        },
      }, "暂无触发记录");
      content.appendChild(empty);
      return;
    }

    // 清空按钮
    const clearBtn = createStyledButton("清空记录", () => {
      if (confirm("确定要清空所有触发记录吗？")) {
        clearHistory();
        renderHistoryList(container);
      }
    });
    clearBtn.style.marginBottom = "16px";
    content.appendChild(clearBtn);

    triggerHistory.forEach((record) => {
      const item = createEl("div", {
        style: {
          borderBottom: `1px solid ${COLORS.border}`,
          padding: "12px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        },
      });

      const info = createEl("div");
      const title = createEl("div", {
        style: { fontWeight: "bold", color: COLORS.ink, marginBottom: "4px" },
      }, record.eventName);
      const meta = createEl("div", {
        style: { fontSize: "13px", color: COLORS.inkFade },
      }, `${record.triggeredAt} · ${record.location} · ${record.result}`);
      info.appendChild(title);
      info.appendChild(meta);

      const delBtn = createEl("button", {
        style: {
          background: "none",
          border: "none",
          color: COLORS.inkFade,
          cursor: "pointer",
          fontSize: "12px",
        },
      }, "删除");
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteHistory(record.id);
        renderHistoryList(container);
      });

      item.appendChild(info);
      item.appendChild(delBtn);
      content.appendChild(item);
    });
  }

  // ============================================================
  // UI — 事件弹窗（古风边框模态框）
  // ============================================================

  /**
   * 显示事件弹窗
   * @param {Object} template 事件模板
   * @param {Object} context 当前上下文
   * @param {Object} record 历史记录
   */
  function showEventModal(template, context, record) {
    // 关闭已有弹窗
    if (activeModal) {
      activeModal.remove();
      activeModal = null;
    }

    const overlay = createEl("div", {
      style: {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(44, 24, 16, 0.75)",
        zIndex: "10000",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Noto Serif SC', 'SimSun', serif",
      },
    });

    const modal = createEl("div", {
      style: {
        width: "90%",
        maxWidth: "520px",
        maxHeight: "80%",
        backgroundColor: COLORS.parchment,
        border: `3px double ${COLORS.gold}`,
        borderRadius: "8px",
        boxShadow: "0 8px 32px rgba(44,24,16,0.6)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      },
    });

    // 花瓣装饰角标
    const corners = ["top-left", "top-right", "bottom-left", "bottom-right"];
    corners.forEach((pos) => {
      const isTop = pos.startsWith("top");
      const isLeft = pos.endsWith("left");
      const corner = createEl("div", {
        style: {
          position: "absolute",
          [isTop ? "top" : "bottom"]: "-6px",
          [isLeft ? "left" : "right"]: "-6px",
          width: "24px",
          height: "24px",
          backgroundColor: COLORS.gold,
          borderRadius: "50%",
          opacity: "0.6",
          zIndex: "2",
        },
      });
      modal.appendChild(corner);
    });

    // 标题区
    const header = createEl("div", {
      style: {
        padding: "20px 24px 12px",
        textAlign: "center",
        borderBottom: `1px solid ${COLORS.border}`,
      },
    });
    const title = createEl("h3", {
      style: {
        margin: "0 0 8px",
        color: COLORS.ink,
        fontSize: "20px",
        fontWeight: "bold",
      },
    }, template.name);
    const rarityLine = createEl("div", {
      style: { fontSize: "13px", color: RARITY[template.rarity]?.color || COLORS.inkFade },
    });
    rarityLine.innerHTML = `${RARITY[template.rarity]?.label || "普通"} ${renderStars(RARITY[template.rarity]?.stars || 1)}`;
    header.appendChild(title);
    header.appendChild(rarityLine);

    // 描述区
    const body = createEl("div", {
      style: {
        padding: "16px 24px",
        color: COLORS.inkLight,
        fontSize: "15px",
        lineHeight: "1.8",
        overflowY: "auto",
        maxHeight: "300px",
      },
    });
    const desc = createEl("p", { style: { margin: "0" } }, template.description);
    body.appendChild(desc);

    // 效果预览
    if (template.effects && template.effects.length > 0) {
      const effectTitle = createEl("div", {
        style: {
          marginTop: "16px",
          fontWeight: "bold",
          color: COLORS.ink,
          fontSize: "14px",
        },
      }, "可能的效果:");
      body.appendChild(effectTitle);

      template.effects.forEach((eff) => {
        let effText = "";
        switch (eff.type) {
          case EFFECT_TYPES.MODIFY_ATTR: effText = `${eff.target} ${eff.value >= 0 ? "+" : ""}${eff.value}`; break;
          case EFFECT_TYPES.MODIFY_FAVOR: effText = `好感度 ${eff.value >= 0 ? "+" : ""}${eff.value}`; break;
          case EFFECT_TYPES.GAIN_ITEM: effText = `获得 ${eff.item} x${eff.quantity || 1}`; break;
          case EFFECT_TYPES.LOSE_ITEM: effText = `失去 ${eff.item} x${eff.quantity || 1}`; break;
          case EFFECT_TYPES.SHOW_TEXT: effText = eff.text; break;
          case EFFECT_TYPES.AI_PLOT: effText = "[AI生成剧情]"; break;
          default: effText = "未知效果";
        }
        const effLine = createEl("div", {
          style: {
            fontSize: "13px",
            color: COLORS.inkFade,
            marginTop: "4px",
            paddingLeft: "12px",
            borderLeft: `2px solid ${COLORS.gold}`,
          },
        }, effText);
        body.appendChild(effLine);
      });
    }

    // 选项按钮区
    const footer = createEl("div", {
      style: {
        padding: "16px 24px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        borderTop: `1px solid ${COLORS.border}`,
      },
    });

    const options = template.options && template.options.length > 0
      ? template.options
      : [{ label: "知道了", effects: [] }];

    options.forEach((opt, idx) => {
      const btn = createEl("button", {
        style: {
          padding: "10px 16px",
          backgroundColor: idx === 0 ? COLORS.gold : "transparent",
          border: `2px solid ${COLORS.gold}`,
          color: idx === 0 ? COLORS.white : COLORS.ink,
          cursor: "pointer",
          borderRadius: "4px",
          fontFamily: "inherit",
          fontSize: "15px",
          transition: "all 0.2s ease",
        },
      }, opt.label);

      btn.addEventListener("mouseenter", () => {
        btn.style.backgroundColor = COLORS.gold;
        btn.style.color = COLORS.white;
      });
      btn.addEventListener("mouseleave", () => {
        if (idx !== 0) {
          btn.style.backgroundColor = "transparent";
          btn.style.color = COLORS.ink;
        }
      });

      btn.addEventListener("click", () => {
        // 执行选项效果
        const allEffects = [...(template.effects || []), ...(opt.effects || [])];
        const results = executeEffects(allEffects, context, record);

        // 关闭弹窗
        overlay.remove();
        activeModal = null;

        // 显示结果提示
        showResultToast(results);
      });

      footer.appendChild(btn);
    });

    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    activeModal = overlay;

    // 点击背景关闭
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
        activeModal = null;
      }
    });
  }

  /**
   * 显示结果提示
   * @param {Object[]} results
   */
  function showResultToast(results) {
    const toast = createEl("div", {
      style: {
        position: "fixed",
        bottom: "40px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: COLORS.ink,
        color: COLORS.parchment,
        padding: "12px 24px",
        borderRadius: "6px",
        border: `1px solid ${COLORS.gold}`,
        fontSize: "14px",
        zIndex: "10001",
        maxWidth: "400px",
        textAlign: "center",
        fontFamily: "'Noto Serif SC', 'SimSun', serif",
        boxShadow: "0 4px 16px rgba(44,24,16,0.4)",
      },
    });

    const summary = results.map((r) => r.description).join("，");
    toast.textContent = summary || "事件结束";
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.5s ease";
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  }

  // ============================================================
  // UI — 事件编辑器
  // ============================================================

  /**
   * 打开事件编辑器（新建或编辑）
   * @param {string} [eventId] 编辑时传入ID，新建时省略
   */
  function openEventEditor(eventId) {
    const isEdit = !!eventId;
    const evt = isEdit ? getTemplate(eventId) : null;

    const overlay = createEl("div", {
      style: {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(44, 24, 16, 0.85)",
        zIndex: "10001",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Noto Serif SC', 'SimSun', serif",
      },
    });

    const modal = createEl("div", {
      style: {
        width: "90%",
        maxWidth: "600px",
        maxHeight: "85%",
        backgroundColor: COLORS.parchment,
        border: `3px double ${COLORS.gold}`,
        borderRadius: "8px",
        boxShadow: "0 8px 32px rgba(44,24,16,0.6)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      },
    });

    const header = createEl("div", {
      style: {
        padding: "16px 20px",
        borderBottom: `1px solid ${COLORS.border}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      },
    });
    const title = createEl("h3", { style: { margin: "0", color: COLORS.ink } }, isEdit ? "编辑事件" : "新建事件");
    const closeBtn = createEl("button", {
      style: {
        background: "none", border: "none", color: COLORS.inkFade, cursor: "pointer", fontSize: "20px",
      },
    }, "&#10005;");
    closeBtn.innerHTML = "&#10005;";
    closeBtn.addEventListener("click", () => overlay.remove());
    header.appendChild(title);
    header.appendChild(closeBtn);

    const body = createEl("div", {
      style: {
        flex: "1",
        overflowY: "auto",
        padding: "16px 20px",
        color: COLORS.ink,
      },
    });

    // 表单字段
    const fields = [
      { key: "name", label: "事件名称", type: "text", value: evt?.name || "" },
      { key: "description", label: "事件描述", type: "textarea", value: evt?.description || "" },
      { key: "category", label: "分类", type: "select", value: evt?.category || "", options: categories },
      { key: "rarity", label: "稀有度", type: "select", value: evt?.rarity || "common", options: Object.keys(RARITY) },
      { key: "cooldown", label: "冷却时间（毫秒）", type: "number", value: evt?.cooldown || 0 },
    ];

    const inputs = {};
    fields.forEach((f) => {
      const row = createEl("div", { style: { marginBottom: "12px" } });
      const label = createEl("label", {
        style: { display: "block", marginBottom: "4px", fontSize: "14px", color: COLORS.inkLight },
      }, f.label);
      let input;
      if (f.type === "textarea") {
        input = createEl("textarea", {
          style: {
            width: "100%",
            minHeight: "60px",
            padding: "8px",
            border: `1px solid ${COLORS.border}`,
            borderRadius: "4px",
            backgroundColor: COLORS.white,
            color: COLORS.ink,
            fontFamily: "inherit",
            fontSize: "14px",
          },
        });
        input.value = f.value;
      } else if (f.type === "select") {
        input = createEl("select", {
          style: {
            width: "100%",
            padding: "8px",
            border: `1px solid ${COLORS.border}`,
            borderRadius: "4px",
            backgroundColor: COLORS.white,
            color: COLORS.ink,
            fontFamily: "inherit",
            fontSize: "14px",
          },
        });
        f.options.forEach((opt) => {
          const o = createEl("option", { value: opt }, opt);
          input.appendChild(o);
        });
        input.value = f.value;
      } else {
        input = createEl("input", {
          type: f.type,
          style: {
            width: "100%",
            padding: "8px",
            border: `1px solid ${COLORS.border}`,
            borderRadius: "4px",
            backgroundColor: COLORS.white,
            color: COLORS.ink,
            fontFamily: "inherit",
            fontSize: "14px",
            boxSizing: "border-box",
          },
        });
        input.value = f.value;
      }
      inputs[f.key] = input;
      row.appendChild(label);
      row.appendChild(input);
      body.appendChild(row);
    });

    // 选项区域（简化版，允许1-3个选项）
    const optionsSection = createEl("div", { style: { marginTop: "16px", borderTop: `1px solid ${COLORS.border}`, paddingTop: "12px" } });
    const optionsTitle = createEl("h4", { style: { margin: "0 0 8px", color: COLORS.gold } }, "事件选项（1-3个）");
    optionsSection.appendChild(optionsTitle);

    const optionsContainer = createEl("div", { id: "editor-options-container" });
    const currentOptions = evt?.options && evt.options.length > 0 ? evt.options : [{ label: "继续", effects: [] }];
    currentOptions.forEach((opt, idx) => {
      const optRow = createEl("div", { style: { marginBottom: "8px", display: "flex", gap: "8px" } });
      const optInput = createEl("input", {
        type: "text",
        placeholder: `选项 ${idx + 1} 文字`,
        "data-idx": String(idx),
        style: {
          flex: "1",
          padding: "6px 8px",
          border: `1px solid ${COLORS.border}`,
          borderRadius: "4px",
          backgroundColor: COLORS.white,
          color: COLORS.ink,
          fontFamily: "inherit",
        },
      });
      optInput.value = opt.label;
      optRow.appendChild(optInput);
      optionsContainer.appendChild(optRow);
    });
    optionsSection.appendChild(optionsContainer);

    // 添加选项按钮
    const addOptBtn = createStyledButton("添加选项", () => {
      const rows = optionsContainer.querySelectorAll("div");
      if (rows.length >= 3) {
        alert("最多只能有3个选项");
        return;
      }
      const optRow = createEl("div", { style: { marginBottom: "8px", display: "flex", gap: "8px" } });
      const optInput = createEl("input", {
        type: "text",
        placeholder: `选项 ${rows.length + 1} 文字`,
        "data-idx": String(rows.length),
        style: {
          flex: "1",
          padding: "6px 8px",
          border: `1px solid ${COLORS.border}`,
          borderRadius: "4px",
          backgroundColor: COLORS.white,
          color: COLORS.ink,
          fontFamily: "inherit",
        },
      });
      optRow.appendChild(optInput);
      optionsContainer.appendChild(optRow);
    });
    optionsSection.appendChild(addOptBtn);
    body.appendChild(optionsSection);

    // 保存按钮
    const footer = createEl("div", {
      style: {
        padding: "12px 20px",
        borderTop: `1px solid ${COLORS.border}`,
        display: "flex",
        justifyContent: "flex-end",
        gap: "10px",
      },
    });

    const saveBtn = createStyledButton("保存", () => {
      const name = inputs.name.value.trim();
      const description = inputs.description.value.trim();
      if (!name || !description) {
        alert("请填写事件名称和描述");
        return;
      }

      const optionInputs = optionsContainer.querySelectorAll("input");
      const options = [];
      optionInputs.forEach((inp) => {
        if (inp.value.trim()) {
          options.push({ label: inp.value.trim(), effects: [] });
        }
      });
      if (options.length === 0) options.push({ label: "继续", effects: [] });

      const data = {
        name,
        description,
        category: inputs.category.value,
        rarity: inputs.rarity.value,
        cooldown: parseInt(inputs.cooldown.value) || 0,
        options,
      };

      if (isEdit) {
        updateTemplate(eventId, data);
      } else {
        createTemplate(data);
      }

      overlay.remove();
      // 刷新列表
      const panel = document.getElementById("random-events-panel");
      if (panel) {
        renderTemplateList(panel.firstChild);
      }
    });

    const cancelBtn = createStyledButton("取消", () => overlay.remove());
    cancelBtn.style.borderColor = COLORS.inkFade;
    cancelBtn.style.color = COLORS.inkFade;

    if (isEdit) {
      const delBtn = createStyledButton("删除", () => {
        if (confirm("确定要删除这个事件模板吗？")) {
          deleteTemplate(eventId);
          overlay.remove();
          const panel = document.getElementById("random-events-panel");
          if (panel) renderTemplateList(panel.firstChild);
        }
      });
      delBtn.style.borderColor = COLORS.red;
      delBtn.style.color = COLORS.red;
      footer.appendChild(delBtn);
    }

    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);

    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  // ============================================================
  // UI — 分类管理器
  // ============================================================

  /**
   * 打开分类管理器
   */
  function openCategoryManager() {
    const overlay = createEl("div", {
      style: {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(44, 24, 16, 0.85)",
        zIndex: "10001",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Noto Serif SC', 'SimSun', serif",
      },
    });

    const modal = createEl("div", {
      style: {
        width: "90%",
        maxWidth: "400px",
        backgroundColor: COLORS.parchment,
        border: `3px double ${COLORS.gold}`,
        borderRadius: "8px",
        padding: "20px",
      },
    });

    const title = createEl("h3", { style: { margin: "0 0 16px", color: COLORS.ink } }, "分类管理");
    modal.appendChild(title);

    const list = createEl("div", { style: { marginBottom: "16px" } });
    const refreshList = () => {
      list.innerHTML = "";
      if (categories.length === 0) {
        list.appendChild(createEl("div", { style: { color: COLORS.inkFade, fontSize: "14px" } }, "暂无分类"));
      } else {
        categories.forEach((cat) => {
          const row = createEl("div", {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 0",
              borderBottom: `1px solid ${COLORS.border}`,
            },
          });
          const name = createEl("span", { style: { color: COLORS.ink } }, cat);
          const actions = createEl("div", { style: { display: "flex", gap: "6px" } });

          const renameBtn = createEl("button", {
            style: {
              background: "none", border: `1px solid ${COLORS.gold}`, color: COLORS.gold,
              padding: "2px 8px", borderRadius: "3px", cursor: "pointer", fontSize: "12px",
            },
          }, "重命名");
          renameBtn.addEventListener("click", () => {
            const newName = prompt(`将 "${cat}" 重命名为:`, cat);
            if (newName && newName.trim() && newName.trim() !== cat) {
              renameCategory(cat, newName.trim());
              refreshList();
            }
          });

          const delBtn = createEl("button", {
            style: {
              background: "none", border: `1px solid ${COLORS.red}`, color: COLORS.red,
              padding: "2px 8px", borderRadius: "3px", cursor: "pointer", fontSize: "12px",
            },
          }, "删除");
          delBtn.addEventListener("click", () => {
            if (confirm(`删除分类 "${cat}"？该分类下的事件将变为未分类。`)) {
              removeCategory(cat);
              refreshList();
            }
          });

          actions.appendChild(renameBtn);
          actions.appendChild(delBtn);
          row.appendChild(name);
          row.appendChild(actions);
          list.appendChild(row);
        });
      }
    };
    refreshList();
    modal.appendChild(list);

    // 添加新分类
    const addRow = createEl("div", { style: { display: "flex", gap: "8px" } });
    const addInput = createEl("input", {
      type: "text",
      placeholder: "新分类名称",
      style: {
        flex: "1",
        padding: "8px",
        border: `1px solid ${COLORS.border}`,
        borderRadius: "4px",
        backgroundColor: COLORS.white,
        color: COLORS.ink,
        fontFamily: "inherit",
      },
    });
    const addBtn = createStyledButton("添加", () => {
      const val = addInput.value.trim();
      if (val) {
        if (addCategory(val)) {
          addInput.value = "";
          refreshList();
        } else {
          alert("分类已存在或名称无效");
        }
      }
    });
    addRow.appendChild(addInput);
    addRow.appendChild(addBtn);
    modal.appendChild(addRow);

    const closeBtn = createStyledButton("关闭", () => overlay.remove());
    closeBtn.style.marginTop = "12px";
    modal.appendChild(closeBtn);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  // ============================================================
  // UI — AI 生成事件
  // ============================================================

  /**
   * 打开AI生成事件界面
   */
  function openAIGenerator() {
    const overlay = createEl("div", {
      style: {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(44, 24, 16, 0.85)",
        zIndex: "10001",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Noto Serif SC', 'SimSun', serif",
      },
    });

    const modal = createEl("div", {
      style: {
        width: "90%",
        maxWidth: "500px",
        backgroundColor: COLORS.parchment,
        border: `3px double ${COLORS.gold}`,
        borderRadius: "8px",
        padding: "20px",
        maxHeight: "80%",
        overflowY: "auto",
      },
    });

    const title = createEl("h3", { style: { margin: "0 0 12px", color: COLORS.ink } }, "AI生成事件");
    modal.appendChild(title);

    const desc = createEl("p", {
      style: { color: COLORS.inkFade, fontSize: "14px", marginBottom: "16px" },
    }, "AI将根据当前游戏上下文（地点、时间、天气、NPC）为你构思一个随机事件模板。");
    modal.appendChild(desc);

    // 上下文输入（可选）
    const ctxLabel = createEl("label", {
      style: { display: "block", marginBottom: "4px", fontSize: "14px", color: COLORS.inkLight },
    }, "补充描述（可选）:");
    const ctxInput = createEl("textarea", {
      placeholder: "例如：我希望是一个与江湖恩怨相关的事件...",
      style: {
        width: "100%",
        minHeight: "60px",
        padding: "8px",
        border: `1px solid ${COLORS.border}`,
        borderRadius: "4px",
        backgroundColor: COLORS.white,
        color: COLORS.ink,
        fontFamily: "inherit",
        fontSize: "14px",
        marginBottom: "12px",
      },
    });
    modal.appendChild(ctxLabel);
    modal.appendChild(ctxInput);

    // 生成结果区域
    const resultArea = createEl("div", {
      style: {
        marginTop: "12px",
        padding: "12px",
        backgroundColor: "rgba(201,162,39,0.08)",
        borderRadius: "4px",
        border: `1px dashed ${COLORS.gold}`,
        minHeight: "80px",
        color: COLORS.inkFade,
        fontSize: "14px",
        display: "none",
      },
    });
    modal.appendChild(resultArea);

    const btnRow = createEl("div", { style: { display: "flex", gap: "10px", marginTop: "12px" } });

    const generateBtn = createStyledButton("生成事件", () => {
      resultArea.style.display = "block";
      resultArea.innerHTML = "<em>AI正在构思事件...</em>";

      // 构造AI提示词
      const context = getCurrentContext ? getCurrentContext() : {};
      const extra = ctxInput.value.trim();
      const prompt = buildAIPrompt(context, extra);

      // 如果有全局AI调用接口，则调用；否则模拟
      if (window.callAI && typeof window.callAI === "function") {
        window.callAI(prompt).then((response) => {
          try {
            const data = JSON.parse(response);
            showGeneratedEvent(data, resultArea);
          } catch (e) {
            resultArea.textContent = "AI返回格式异常，请重试。";
          }
        }).catch(() => {
          resultArea.textContent = "AI调用失败，请重试。";
        });
      } else {
        // 模拟延迟后展示示例
        setTimeout(() => {
          const example = generateMockEvent(context, extra);
          showGeneratedEvent(example, resultArea);
        }, 1500);
      }
    });

    const closeBtn = createStyledButton("关闭", () => overlay.remove());
    closeBtn.style.borderColor = COLORS.inkFade;
    closeBtn.style.color = COLORS.inkFade;

    btnRow.appendChild(closeBtn);
    btnRow.appendChild(generateBtn);
    modal.appendChild(btnRow);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  /**
   * 构造AI提示词
   * @param {Object} context
   * @param {string} extra
   * @returns {string}
   */
  function buildAIPrompt(context, extra) {
    const loc = context.currentLocationName || "未知地点";
    const time = context.currentTimeOfDay || "未知时辰";
    const weather = context.currentWeather || "未知天气";
    const npcs = context.nearbyNPCs ? context.nearbyNPCs.join("、") : "无";
    return `请为古风视觉小说游戏生成一个随机事件模板，返回严格的JSON格式：
{
  "name": "事件名称（5-10字）",
  "description": "事件描述（30-80字）",
  "category": "分类名称",
  "rarity": "common|uncommon|rare|epic|legendary",
  "cooldown": 3600000,
  "triggerConditions": [{"type":"location|time|attribute|relation|random|combined", ...}],
  "effects": [{"type":"modify_attribute|modify_favorability|gain_item|lose_item|trigger_event|show_text|ai_plot", ...}],
  "options": [{"label": "选项文字", "effects": [...]}]
}
当前游戏上下文：地点=${loc}, 时辰=${time}, 天气=${weather}, 附近NPC=${npcs}
${extra ? "额外要求：" + extra : ""}`;
  }

  /**
   * 模拟生成事件（用于无AI接口时演示）
   * @param {Object} context
   * @param {string} extra
   * @returns {Object}
   */
  function generateMockEvent(context, extra) {
    const loc = context.currentLocationName || "城中";
    const time = context.currentTimeOfDay || "黄昏";
    const templates = [
      {
        name: "巷口传闻",
        description: "几个江湖客在巷口低声议论着什么，你隐约听到了一个熟悉的名字...",
        category: "传闻",
        rarity: "common",
        cooldown: 1800000,
        triggerConditions: [{ type: "location", locationType: "city" }, { type: "random", probability: 0.2 }],
        effects: [{ type: "show_text", text: "你记下了这个名字，或许日后有用。" }],
        options: [{ label: "继续听", effects: [{ type: "modify_attr", target: "wisdom", value: 1 }] }, { label: "离开", effects: [] }],
      },
      {
        name: "流萤之约",
        description: "夜色中，流萤点点飞舞，一位素未谋面的少女在桥头驻足，似乎在等什么人。",
        category: "奇遇",
        rarity: "rare",
        cooldown: 3600000,
        triggerConditions: [{ type: "time", timeOfDay: "night" }, { type: "random", probability: 0.1 }],
        effects: [{ type: "ai_plot", prompt: "描述少女的外貌和眼神" }],
        options: [
          { label: "上前搭话", effects: [{ type: "modify_favor", target: "mystery_girl", value: 15 }] },
          { label: "远远观望", effects: [{ type: "show_text", text: "你默默注视着她，直到她消失在夜色中。" }] },
        ],
      },
      {
        name: "铁匠铺暗号",
        description: "老铁匠敲打铁砧的节奏忽然变了，这分明是江湖中某个秘密组织的接头暗号。",
        category: "秘密",
        rarity: "epic",
        cooldown: 7200000,
        triggerConditions: [{ type: "location", locationId: "blacksmith" }, { type: "attribute", target: "intelligence", operator: ">=", value: 60 }],
        effects: [{ type: "gain_item", item: "密信", quantity: 1 }, { type: "show_text", text: "你默默记下了暗号。" }],
        options: [
          { label: "回应暗号", effects: [{ type: "trigger_event", eventId: "secret_meeting" }] },
          { label: "假装不知", effects: [{ type: "modify_attr", target: "caution", value: 2 }] },
        ],
      },
    ];
    // 根据extra关键词选择
    if (extra && extra.includes("江湖")) return templates[2];
    if (extra && extra.includes("少女")) return templates[1];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * 在结果区域展示生成的事件
   * @param {Object} data
   * @param {HTMLElement} container
   */
  function showGeneratedEvent(data, container) {
    container.innerHTML = "";
    if (!data || !data.name) {
      container.textContent = "生成结果无效，请重试。";
      return;
    }

    const preview = createEl("div");
    preview.appendChild(createEl("div", { style: { fontWeight: "bold", color: COLORS.ink, marginBottom: "4px" } }, data.name));
    preview.appendChild(createEl("div", { style: { color: COLORS.inkFade, fontSize: "13px", marginBottom: "8px" } }, data.description));
    preview.appendChild(createEl("div", { style: { fontSize: "12px", color: COLORS.gold } }, `分类: ${data.category || "未分类"} | 稀有度: ${RARITY[data.rarity]?.label || data.rarity}`));
    container.appendChild(preview);

    const useBtn = createStyledButton("使用此模板", () => {
      const created = createTemplate(data);
      if (created) {
        alert(`事件模板 "${created.name}" 已创建！`);
        container.parentElement.querySelector("button:last-child").click(); // 关闭
        const panel = document.getElementById("random-events-panel");
        if (panel) renderTemplateList(panel.firstChild);
      }
    });
    useBtn.style.marginTop = "10px";
    container.appendChild(useBtn);
  }

  // ============================================================
  // 手动探索
  // ============================================================

  /**
   * 用户点击"探索"按钮手动触发事件检测
   */
  function manualExplore() {
    const context = typeof getCurrentContext === "function" ? getCurrentContext() : {};
    const result = autoTrigger(context, "explore");
    if (!result) {
      showResultToast([{ description: "四周静悄悄的，什么也没有发生..." }]);
    }
  }

  // ============================================================
  // 公共API：外部集成钩子
  // ============================================================

  /**
   * 当角色移动到某地点时调用
   * @param {Object} context 包含 currentLocationId, currentLocationName, currentLocationType 等
   */
  function onLocationChange(context) {
    return autoTrigger(context, "move");
  }

  /**
   * 当时间推进（时辰切换）时调用
   * @param {Object} context 包含 currentTimeOfDay, currentSeason, currentWeather 等
   */
  function onTimeAdvance(context) {
    return autoTrigger(context, "time");
  }

  /**
   * 当到达剧情节点时调用
   * @param {Object} context
   * @param {string} nodeId 剧情节点ID
   */
  function onPlotNode(context, nodeId) {
    const ctx = Object.assign({}, context, { currentPlotNode: nodeId });
    return autoTrigger(ctx, "plot");
  }

  /**
   * 获取当前上下文（可由外部覆盖）
   * @returns {Object}
   */
  function getCurrentContext() {
    // 如果游戏核心系统提供了此函数，优先使用外部的
    if (window.GameContext && typeof window.GameContext.get === "function") {
      return window.GameContext.get();
    }
    // 否则返回空对象
    return {};
  }

  // ============================================================
  // 主面板控制
  // ============================================================

  /** 主面板DOM引用 */
  let mainPanelEl = null;

  /**
   * 打开随机事件主面板
   */
  function openPanel() {
    if (mainPanelEl) {
      mainPanelEl.style.display = "flex";
      renderTemplateList(mainPanelEl.firstChild);
      return;
    }
    mainPanelEl = createMainPanel();
    document.body.appendChild(mainPanelEl);
  }

  /**
   * 关闭主面板
   */
  function closeMainPanel() {
    if (mainPanelEl) {
      mainPanelEl.style.display = "none";
    }
  }

  /**
   * 切换主面板显示/隐藏
   */
  function togglePanel() {
    if (mainPanelEl && mainPanelEl.style.display !== "none") {
      closeMainPanel();
    } else {
      openPanel();
    }
  }

  // ============================================================
  // 快捷触发函数（用于外部绑定到游戏系统）
  // ============================================================

  /**
   * 获取存储键名
   * @returns {string}
   */
  function getStorageKey() {
    return STORAGE_KEY;
  }

  /**
   * 导出所有数据（用于备份）
   * @returns {string} JSON字符串
   */
  function exportData() {
    return JSON.stringify({
      eventTemplates: eventTemplates,
      categories: categories,
      triggerHistory: triggerHistory,
      cooldownTracker: cooldownTracker,
    }, null, 2);
  }

  /**
   * 导入数据（用于恢复）
   * @param {string} jsonString
   * @returns {boolean}
   */
  function importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.eventTemplates) eventTemplates = data.eventTemplates;
      if (data.categories) categories = data.categories;
      if (data.triggerHistory) triggerHistory = data.triggerHistory;
      if (data.cooldownTracker) cooldownTracker = data.cooldownTracker;
      saveData();
      return true;
    } catch (e) {
      console.error("[RandomEvents] 导入数据失败:", e);
      return false;
    }
  }

  /**
   * 加载示例模板（供用户一键导入参考）
   */
  function loadExamples() {
    const examples = getExampleTemplates();
    examples.forEach((ex) => createTemplate(ex));
  }

  // ============================================================
  // 初始化
  // ============================================================

  function init() {
    loadData();
    console.log("[RandomEvents] 随机事件系统已初始化，存储键:", STORAGE_KEY);
  }

  // 页面加载完成后自动初始化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // ============================================================
  // 全局对象导出
  // ============================================================

  window.RandomEvents = {
    // 存储键
    storageKey: STORAGE_KEY,

    // 分类管理
    addCategory,
    removeCategory,
    renameCategory,
    getCategories,

    // 事件模板管理
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplates,
    getTemplate,
    getExampleTemplates,
    loadExamples,

    // 事件触发
    canTrigger,
    findTriggerableEvents,
    triggerEvent,
    autoTrigger,
    executeEffects,

    // 触发钩子（集成到游戏循环）
    onLocationChange,
    onTimeAdvance,
    onPlotNode,
    manualExplore,

    // 历史记录
    getHistory,
    deleteHistory,
    clearHistory,

    // UI控制
    openPanel,
    closeMainPanel,
    togglePanel,
    showEventModal,
    showResultToast,

    // AI联动
    openAIGenerator,
    buildAIPrompt,

    // 数据导入导出
    exportData,
    importData,
    loadData,
    saveData,

    // 常量暴露（方便外部使用）
    constants: {
      TRIGGER_TYPES,
      EFFECT_TYPES,
      RARITY,
      COMBINE_OPS,
      COLORS,
    },
  };

})();
