/**
 * =========================================================
 * NPC动态生活行为系统 v1
 * NPCBehavior — 全局对象
 * 核心概念：NPC不是静态的，他们有自己的生活规律和行为逻辑，
 *         在地图上移动、工作、休息、互动。
 * 配色：古风墨境 — 羊皮纸底 #F5E6D3，金色 #C9A227，墨色 #2C1810
 * =========================================================
 */

const NPCBehavior = (function() {
  'use strict';

  // ==================== 常量定义 ====================

  /** 存储键名 */
  const STORAGE_KEY = 'npc_behavior_v13';

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
    blue: '#1E88E5'
  };

  /** NPC状态枚举 */
  const NPC_STATE = {
    IDLE: 'idle',          // 闲逛
    WORKING: 'working',    // 工作
    RESTING: 'resting',    // 休息
    MOVING: 'moving',      // 移动
    INTERACTING: 'interacting'  // 互动
  };

  /** 状态中文名称映射 */
  const STATE_LABELS = {
    idle: '闲逛',
    working: '工作',
    resting: '休息',
    moving: '移动中',
    interacting: '互动'
  };

  /** 状态图标映射 */
  const STATE_ICONS = {
    idle: '🚶',
    working: '💼',
    resting: '🛏️',
    moving: '🏃',
    interacting: '💬'
  };

  /** 互动类型 */
  const INTERACTION_TYPES = {
    DIALOGUE: 'dialogue',   // 对话
    TRADE: 'trade',         // 交易
    CONFLICT: 'conflict',   // 冲突
    COOPERATE: 'cooperate'  // 合作
  };

  /** 互动类型中文名称 */
  const INTERACTION_LABELS = {
    dialogue: '对话',
    trade: '交易',
    conflict: '冲突',
    cooperate: '合作'
  };

  /** 十二时辰定义（与WeatherSystem对齐） */
  const SHICHEN_ORDER = [
    '子', '丑', '寅', '卯', '辰', '巳',
    '午', '未', '申', '酉', '戌', '亥'
  ];

  /** 默认移动速度（像素/毫秒，假设地图坐标系） */
  const DEFAULT_MOVE_SPEED = 100; // 100单位/游戏时辰

  // ==================== 状态管理 ====================

  /**
   * 运行时状态对象
   * @property {Object} npcStates - 每个NPC的当前状态 { [npcId]: { state, locationId, targetLocationId, moveProgress, schedule, logs, ... } }
   * @property {boolean} isSimulating - 模拟是否进行中
   * @property {number} simulationSpeed - 模拟速度倍率
   * @property {number|null} timerId - setTimeout ID
   * @property {string|null} lastShichen - 上次更新的时辰（用于检测时辰变化）
   * @property {boolean} globalEnabled - 全局行为开关
   */
  let state = {
    npcStates: {},         // { [npcId]: NPCStateObject }
    isSimulating: false,
    simulationSpeed: 1,    // 1x, 2x, 5x, 10x
    timerId: null,
    lastShichen: null,
    globalEnabled: true,
    settings: {
      enableSimulation: true,
      simulationSpeed: 1,
      enableAutoInteract: true,
      enableLogging: true,
      aiParsePreset: true
    }
  };

  /**
   * NPC状态对象结构：
   * {
   *   npcId: string,
   *   currentState: 'idle'|'working'|'resting'|'moving'|'interacting',
   *   currentLocationId: string|null,
   *   targetLocationId: string|null,
   *   moveStartTime: number|null,
   *   moveEndTime: number|null,
   *   moveProgress: number,  // 0-1
   *   schedule: { [shichenName]: { locationId: string, behavior: string } },
   *   logs: Array<{ time: string, type: string, content: string }>,
   *   lastInteraction: { npcId: string, type: string, time: string }|null,
   *   presetParsed: boolean,
   *   initialLocationSet: boolean
   * }
   */

  // ==================== 私有方法 ====================

  /**
   * 保存数据到本地存储
   */
  function _save() {
    try {
      const data = {
        npcStates: state.npcStates,
        settings: state.settings,
        lastShichen: state.lastShichen,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('[NPCBehavior] 保存失败:', e);
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
        state.npcStates = data.npcStates || {};
        state.settings = { ...state.settings, ...(data.settings || {}) };
        state.lastShichen = data.lastShichen || null;
      }
    } catch (e) {
      console.error('[NPCBehavior] 加载失败:', e);
    }
  }

  /**
   * 获取WeatherSystem当前时辰
   * @returns {Object|null} 时辰对象
   */
  function _getCurrentShichen() {
    if (typeof WeatherSystem !== 'undefined' && WeatherSystem.getCurrentShichen) {
      return WeatherSystem.getCurrentShichen();
    }
    // 降级：自行计算当前时辰
    const hour = new Date().getHours();
    const shichenMap = [
      { name: '子', hourStart: 23, hourEnd: 1, label: '子时', desc: '夜半' },
      { name: '丑', hourStart: 1,  hourEnd: 3,  label: '丑时', desc: '鸡鸣' },
      { name: '寅', hourStart: 3,  hourEnd: 5,  label: '寅时', desc: '平旦' },
      { name: '卯', hourStart: 5,  hourEnd: 7,  label: '卯时', desc: '日出' },
      { name: '辰', hourStart: 7,  hourEnd: 9,  label: '辰时', desc: '食时' },
      { name: '巳', hourStart: 9,  hourEnd: 11, label: '巳时', desc: '隅中' },
      { name: '午', hourStart: 11, hourEnd: 13, label: '午时', desc: '日中' },
      { name: '未', hourStart: 13, hourEnd: 15, label: '未时', desc: '日昳' },
      { name: '申', hourStart: 15, hourEnd: 17, label: '申时', desc: '晡时' },
      { name: '酉', hourStart: 17, hourEnd: 19, label: '酉时', desc: '日入' },
      { name: '戌', hourStart: 19, hourEnd: 21, label: '戌时', desc: '黄昏' },
      { name: '亥', hourStart: 21, hourEnd: 23, label: '亥时', desc: '人定' }
    ];
    if (hour === 23) return shichenMap[0];
    return shichenMap.find(s => hour >= s.hourStart && hour < s.hourEnd) || shichenMap[0];
  }

  /**
   * 获取地图数据
   * @returns {Object} { locations: [], paths: [] }
   */
  function _getMapData() {
    if (typeof MapSystem !== 'undefined' && MapSystem._getData) {
      return MapSystem._getData();
    }
    // 降级：从localStorage读取
    try {
      const raw = localStorage.getItem('exploration_map_v12');
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return { locations: [], paths: [] };
  }

  /**
   * 获取所有NPC列表
   * @returns {Array} NPC数组
   */
  function _getNPCs() {
    if (typeof NPCManager !== 'undefined' && NPCManager.getNPCs) {
      return NPCManager.getNPCs();
    }
    return [];
  }

  /**
   * 根据ID获取单个NPC
   * @param {string} npcId
   * @returns {Object|null}
   */
  function _getNPCById(npcId) {
    if (typeof NPCManager !== 'undefined' && NPCManager.getNPCById) {
      return NPCManager.getNPCById(npcId);
    }
    return _getNPCs().find(n => n.id === npcId) || null;
  }

  /**
   * 更新NPC数据（委托给NPCManager）
   * @param {string} npcId
   * @param {Object} updates
   */
  function _updateNPC(npcId, updates) {
    if (typeof NPCManager !== 'undefined' && NPCManager.updateNPC) {
      NPCManager.updateNPC(npcId, updates);
    }
  }

  /**
   * 计算两地点间的路径距离
   * 使用Dijkstra算法或直线距离（无路径时）
   * @param {string} fromId
   * @param {string} toId
   * @returns {number} 距离值
   */
  function _getPathDistance(fromId, toId) {
    const mapData = _getMapData();
    const locations = mapData.locations || [];
    const paths = mapData.paths || [];

    const fromLoc = locations.find(l => l.id === fromId);
    const toLoc = locations.find(l => l.id === toId);
    if (!fromLoc || !toLoc) return Infinity;

    // 构建邻接表
    const adj = {};
    locations.forEach(l => { adj[l.id] = []; });
    paths.forEach(p => {
      const a = p.from || p.source;
      const b = p.to || p.target;
      if (a && b) {
        adj[a].push(b);
        adj[b].push(a);
      }
    });

    // Dijkstra
    const dist = {};
    const prev = {};
    const visited = new Set();
    locations.forEach(l => { dist[l.id] = Infinity; });
    dist[fromId] = 0;

    while (visited.size < locations.length) {
      let u = null;
      let minDist = Infinity;
      for (const id in dist) {
        if (!visited.has(id) && dist[id] < minDist) {
          minDist = dist[id];
          u = id;
        }
      }
      if (u === null) break;
      visited.add(u);

      const uLoc = locations.find(l => l.id === u);
      for (const v of (adj[u] || [])) {
        if (visited.has(v)) continue;
        const vLoc = locations.find(l => l.id === v);
        if (!vLoc) continue;
        // 欧几里得距离作为边权
        const dx = (uLoc.x || 0) - (vLoc.x || 0);
        const dy = (uLoc.y || 0) - (vLoc.y || 0);
        const edgeDist = Math.sqrt(dx * dx + dy * dy);
        const alt = dist[u] + edgeDist;
        if (alt < dist[v]) {
          dist[v] = alt;
          prev[v] = u;
        }
      }
    }

    if (dist[toId] !== Infinity) {
      return dist[toId];
    }

    // 无路径时返回直线距离
    const dx = (fromLoc.x || 0) - (toLoc.x || 0);
    const dy = (fromLoc.y || 0) - (toLoc.y || 0);
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 添加NPC日志记录
   * @param {string} npcId
   * @param {string} type - 日志类型
   * @param {string} content - 日志内容
   */
  function _addLog(npcId, type, content) {
    const ns = state.npcStates[npcId];
    if (!ns) return;
    if (!ns.logs) ns.logs = [];
    const shichen = _getCurrentShichen();
    const timeStr = new Date().toLocaleString('zh-CN');
    ns.logs.push({
      time: timeStr,
      shichen: shichen ? shichen.label : '',
      type: type,
      content: content
    });
    // 限制日志数量
    if (ns.logs.length > 200) {
      ns.logs = ns.logs.slice(-200);
    }
    _save();
  }

  /**
   * 通过EventBridge发送通知
   * @param {string} type - 事件类型
   * @param {Object} payload - 事件载荷
   */
  function _notify(type, payload = {}) {
    if (typeof EventBridge !== 'undefined' && EventBridge.emit) {
      EventBridge.emit('npc_behavior', type, payload, 'NPCBehavior');
    }
  }

  /**
   * 检查两个NPC是否在同一地点
   * @param {string} npcAId
   * @param {string} npcBId
   * @returns {boolean}
   */
  function _areAtSameLocation(npcAId, npcBId) {
    const stateA = state.npcStates[npcAId];
    const stateB = state.npcStates[npcBId];
    if (!stateA || !stateB) return false;
    if (stateA.currentState === NPC_STATE.MOVING || stateB.currentState === NPC_STATE.MOVING) {
      return false;
    }
    return stateA.currentLocationId && stateA.currentLocationId === stateB.currentLocationId;
  }

  /**
   * 触发两个NPC互动
   * @param {string} npcAId
   * @param {string} npcBId
   */
  function _triggerInteraction(npcAId, npcBId) {
    const npcA = _getNPCById(npcAId);
    const npcB = _getNPCById(npcBId);
    if (!npcA || !npcB) return;

    // 随机选择互动类型
    const types = Object.values(INTERACTION_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    const typeLabel = INTERACTION_LABELS[type];

    // 根据性格+关系生成互动内容（简化版，实际可由AI生成）
    const contents = {
      dialogue: [
        `${npcA.name}与${npcB.name}寒暄了几句，谈及近日琐事。`,
        `${npcA.name}向${npcB.name}询问近况，二人相谈甚欢。`,
        `${npcA.name}与${npcB.name}聊起各自的喜好，发现颇为投缘。`
      ],
      trade: [
        `${npcA.name}与${npcB.name}交换了几件小物件。`,
        `${npcA.name}向${npcB.name}购买了一些必需品。`,
        `${npcA.name}赠予${npcB.name}一份薄礼，对方欣然接受。`
      ],
      conflict: [
        `${npcA.name}与${npcB.name}因小事起了争执，气氛一度紧张。`,
        `${npcA.name}对${npcB.name}的言行颇为不满，二人不欢而散。`,
        `${npcA.name}与${npcB.name}意见相左，各自坚持己见。`
      ],
      cooperate: [
        `${npcA.name}与${npcB.name}携手完成了一项小事。`,
        `${npcA.name}与${npcB.name}商量对策，达成共识。`,
        `${npcA.name}与${npcB.name}互相配合，进展顺利。`
      ]
    };

    const candidates = contents[type] || contents.dialogue;
    const content = candidates[Math.floor(Math.random() * candidates.length)];

    // 记录日志
    _addLog(npcAId, 'interact', `【${typeLabel}】${content}`);
    _addLog(npcBId, 'interact', `【${typeLabel}】${content}`);

    // 更新状态
    const nsA = state.npcStates[npcAId];
    const nsB = state.npcStates[npcBId];
    if (nsA) {
      nsA.currentState = NPC_STATE.INTERACTING;
      nsA.lastInteraction = { npcId: npcBId, type: type, time: new Date().toISOString() };
    }
    if (nsB) {
      nsB.currentState = NPC_STATE.INTERACTING;
      nsB.lastInteraction = { npcId: npcAId, type: type, time: new Date().toISOString() };
    }

    // 通知
    _notify('npc_interact', { npcAId, npcBId, type, content });

    // 互动结束后恢复状态（模拟1个时辰后恢复）
    setTimeout(() => {
      if (nsA && nsA.currentState === NPC_STATE.INTERACTING) {
        nsA.currentState = NPC_STATE.IDLE;
      }
      if (nsB && nsB.currentState === NPC_STATE.INTERACTING) {
        nsB.currentState = NPC_STATE.IDLE;
      }
      _notify('npc_interact_end', { npcAId, npcBId });
    }, 5000 / (state.settings.simulationSpeed || 1));
  }

  /**
   * 更新单个NPC状态（根据当前时辰和日程）
   * @param {string} npcId
   * @param {Object} shichen - 当前时辰对象
   */
  function _updateNPCState(npcId, shichen) {
    const ns = state.npcStates[npcId];
    if (!ns) return;

    // 如果正在移动中，检查是否到达
    if (ns.currentState === NPC_STATE.MOVING && ns.targetLocationId) {
      const now = Date.now();
      if (ns.moveEndTime && now >= ns.moveEndTime) {
        // 到达目标地点
        const fromId = ns.currentLocationId;
        ns.currentLocationId = ns.targetLocationId;
        ns.targetLocationId = null;
        ns.moveStartTime = null;
        ns.moveEndTime = null;
        ns.moveProgress = 0;
        ns.currentState = NPC_STATE.IDLE;
        _addLog(npcId, 'move', `已到达${ns.currentLocationId}`);
        _notify('npc_arrived', { npcId, locationId: ns.currentLocationId, fromId });
      } else {
        // 更新移动进度
        if (ns.moveStartTime && ns.moveEndTime) {
          const total = ns.moveEndTime - ns.moveStartTime;
          const elapsed = now - ns.moveStartTime;
          ns.moveProgress = Math.min(1, Math.max(0, elapsed / total));
        }
      }
      return;
    }

    // 如果正在互动，不处理日程
    if (ns.currentState === NPC_STATE.INTERACTING) return;

    // 检查当前时辰的日程
    const scheduleItem = ns.schedule && ns.schedule[shichen.name];
    if (scheduleItem) {
      const targetLoc = scheduleItem.locationId;
      const behavior = scheduleItem.behavior || 'idle';

      // 如果已经在目标地点，更新状态
      if (ns.currentLocationId === targetLoc) {
        if (ns.currentState !== behavior) {
          ns.currentState = behavior;
          _addLog(npcId, 'state_change', `进入${STATE_LABELS[behavior] || behavior}状态`);
        }
      } else {
        // 需要移动到目标地点
        if (ns.currentLocationId) {
          _startMove(npcId, ns.currentLocationId, targetLoc);
        } else {
          // 无当前位置，直接瞬移（首次分配时）
          ns.currentLocationId = targetLoc;
          ns.currentState = behavior;
          _addLog(npcId, 'teleport', `已分配至${targetLoc}`);
        }
      }
    } else {
      // 无日程安排，默认行为：保持idle
      if (!ns.currentLocationId) {
        // 如果连位置都没有，随机分配一个
        _assignRandomLocation(npcId);
      }
      ns.currentState = NPC_STATE.IDLE;
    }
  }

  /**
   * 启动NPC移动
   * @param {string} npcId
   * @param {string} fromId
   * @param {string} toId
   */
  function _startMove(npcId, fromId, toId) {
    const ns = state.npcStates[npcId];
    if (!ns) return;

    const distance = _getPathDistance(fromId, toId);
    if (distance === Infinity) {
      // 无法到达，记录日志并保持原地
      _addLog(npcId, 'move_failed', `无法从${fromId}前往${toId}（无路可通）`);
      return;
    }

    const speed = DEFAULT_MOVE_SPEED * (state.settings.simulationSpeed || 1);
    // 移动时间（毫秒），假设1游戏时辰=2现实分钟（可配置）
    const moveTime = (distance / speed) * 120000;

    ns.currentState = NPC_STATE.MOVING;
    ns.targetLocationId = toId;
    ns.moveStartTime = Date.now();
    ns.moveEndTime = Date.now() + moveTime;
    ns.moveProgress = 0;

    _addLog(npcId, 'move', `从${fromId}前往${toId}，预计${Math.ceil(moveTime / 1000)}秒`);
    _notify('npc_moving', { npcId, fromId, toId, duration: moveTime });
  }

  /**
   * 为NPC随机分配一个地图位置
   * @param {string} npcId
   */
  function _assignRandomLocation(npcId) {
    const mapData = _getMapData();
    const locations = mapData.locations || [];
    if (locations.length === 0) return;
    const randomLoc = locations[Math.floor(Math.random() * locations.length)];
    const ns = state.npcStates[npcId];
    if (ns) {
      ns.currentLocationId = randomLoc.id;
      ns.currentState = NPC_STATE.IDLE;
      _addLog(npcId, 'init', `初始分配至${randomLoc.name || randomLoc.id}`);
    }
  }

  /**
   * 检查并触发地点内NPC互动
   */
  function _checkLocationInteractions() {
    if (!state.settings.enableAutoInteract) return;

    // 按地点分组NPC
    const locationGroups = {};
    for (const npcId in state.npcStates) {
      const ns = state.npcStates[npcId];
      if (ns.currentState !== NPC_STATE.MOVING && ns.currentLocationId) {
        if (!locationGroups[ns.currentLocationId]) locationGroups[ns.currentLocationId] = [];
        locationGroups[ns.currentLocationId].push(npcId);
      }
    }

    // 同一地点有2个以上NPC时，随机触发互动
    for (const locId in locationGroups) {
      const npcs = locationGroups[locId];
      if (npcs.length >= 2) {
        // 随机选两个不同的NPC
        const idxA = Math.floor(Math.random() * npcs.length);
        let idxB = Math.floor(Math.random() * npcs.length);
        let attempts = 0;
        while (idxB === idxA && attempts < 5) {
          idxB = Math.floor(Math.random() * npcs.length);
          attempts++;
        }
        if (idxA !== idxB) {
          // 30%概率触发互动
          if (Math.random() < 0.3) {
            _triggerInteraction(npcs[idxA], npcs[idxB]);
          }
        }
      }
    }
  }

  /**
   * 模拟循环的主tick函数
   */
  function _tick() {
    if (!state.isSimulating || !state.settings.enableSimulation) return;

    const shichen = _getCurrentShichen();
    if (!shichen) return;

    // 检测时辰变化
    const shichenChanged = state.lastShichen !== shichen.name;

    // 更新所有NPC
    for (const npcId in state.npcStates) {
      _updateNPCState(npcId, shichen);
    }

    // 如果时辰变了，检查互动
    if (shichenChanged) {
      state.lastShichen = shichen.name;
      _checkLocationInteractions();
      _notify('shichen_changed', { shichen: shichen.name, label: shichen.label });
    }

    // 持续更新移动进度和渲染
    _renderNPCOverview();
    _renderMapMarkers();

    // 使用requestAnimationFrame或setTimeout进行下一帧
    const interval = Math.max(100, 1000 / (state.settings.simulationSpeed || 1));
    state.timerId = setTimeout(() => {
      _tick();
    }, interval);
  }

  /**
   * 渲染NPC总览表格（如果页面存在）
   */
  function _renderNPCOverview() {
    const container = document.getElementById('npc-behavior-overview');
    if (!container) return;

    const npcs = _getNPCs();
    if (npcs.length === 0) {
      container.innerHTML = '<div class="npc-behavior-empty">暂无NPC</div>';
      return;
    }

    const rows = npcs.map(npc => {
      const ns = state.npcStates[npc.id];
      if (!ns) return '';
      const stateLabel = STATE_LABELS[ns.currentState] || ns.currentState || '未知';
      const stateIcon = STATE_ICONS[ns.currentState] || '❓';
      const locName = ns.currentLocationId || (ns.targetLocationId ? '途中' : '未分配');
      const shichen = _getCurrentShichen();
      const scheduleItem = ns.schedule && shichen ? (ns.schedule[shichen.name] || null) : null;
      const scheduleText = scheduleItem ? `${scheduleItem.locationId} · ${STATE_LABELS[scheduleItem.behavior] || scheduleItem.behavior}` : '无日程';

      return `
        <tr style="border-bottom:1px solid ${COLORS.borderLight};">
          <td style="padding:10px 12px;font-size:14px;color:${COLORS.ink};">${npc.name || '未命名'}</td>
          <td style="padding:10px 12px;font-size:14px;">${stateIcon} ${stateLabel}</td>
          <td style="padding:10px 12px;font-size:13px;color:${COLORS.inkMuted};">${locName}</td>
          <td style="padding:10px 12px;font-size:13px;color:${COLORS.inkMuted};">${scheduleText}</td>
          <td style="padding:10px 12px;">
            <button class="npc-behavior-btn-sm" onclick="NPCBehavior.renderBehaviorTab('${npc.id}')">详情</button>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div style="font-family:'Noto Serif SC',serif;background:${COLORS.parchment};border:2px solid ${COLORS.border};border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,${COLORS.ink},${COLORS.inkLight});color:${COLORS.gold};padding:16px 20px;font-size:18px;font-weight:700;letter-spacing:2px;">
          🏛️ NPC总览 · 当前时辰：${shichen ? shichen.label : '--'}
        </div>
        <div style="padding:12px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;border-bottom:1px solid ${COLORS.borderLight};">
          <span style="font-size:13px;color:${COLORS.inkLight};">模拟状态：</span>
          <span style="font-size:13px;padding:4px 12px;border-radius:12px;background:${state.isSimulating ? COLORS.green + '20' : COLORS.red + '20'};color:${state.isSimulating ? COLORS.green : COLORS.red};border:1px solid ${state.isSimulating ? COLORS.green : COLORS.red};">
            ${state.isSimulating ? '● 运行中' : '○ 已暂停'}
          </span>
          <button class="npc-behavior-btn" onclick="NPCBehavior.startSimulation()">▶ 开始</button>
          <button class="npc-behavior-btn" onclick="NPCBehavior.pauseSimulation()">⏸ 暂停</button>
          <label style="font-size:13px;color:${COLORS.inkLight};display:flex;align-items:center;gap:6px;">
            速度：
            <select onchange="NPCBehavior.setSimulationSpeed(parseInt(this.value))" style="background:${COLORS.parchment};border:1px solid ${COLORS.border};color:${COLORS.ink};padding:4px 8px;border-radius:4px;font-family:inherit;">
              <option value="1" ${state.settings.simulationSpeed === 1 ? 'selected' : ''}>1x</option>
              <option value="2" ${state.settings.simulationSpeed === 2 ? 'selected' : ''}>2x</option>
              <option value="5" ${state.settings.simulationSpeed === 5 ? 'selected' : ''}>5x</option>
              <option value="10" ${state.settings.simulationSpeed === 10 ? 'selected' : ''}>10x</option>
            </select>
          </label>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:rgba(201,162,39,0.15);">
              <th style="padding:12px;text-align:left;font-weight:700;color:${COLORS.ink};font-size:14px;border-bottom:2px solid ${COLORS.border};">姓名</th>
              <th style="padding:12px;text-align:left;font-weight:700;color:${COLORS.ink};font-size:14px;border-bottom:2px solid ${COLORS.border};">状态</th>
              <th style="padding:12px;text-align:left;font-weight:700;color:${COLORS.ink};font-size:14px;border-bottom:2px solid ${COLORS.border};">位置</th>
              <th style="padding:12px;text-align:left;font-weight:700;color:${COLORS.ink};font-size:14px;border-bottom:2px solid ${COLORS.border};">当前日程</th>
              <th style="padding:12px;text-align:left;font-weight:700;color:${COLORS.ink};font-size:14px;border-bottom:2px solid ${COLORS.border};">操作</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  /**
   * 渲染地图上的NPC标记
   */
  function _renderMapMarkers() {
    // 如果地图系统提供了标记渲染接口，通知其更新
    // 否则创建浮动标记DOM
    const mapContainer = document.getElementById('map-npc-markers');
    if (!mapContainer) return;

    const mapData = _getMapData();
    const locations = mapData.locations || [];

    // 按地点分组
    const locNPCs = {};
    for (const npcId in state.npcStates) {
      const ns = state.npcStates[npcId];
      if (ns.currentLocationId && ns.currentState !== NPC_STATE.MOVING) {
        if (!locNPCs[ns.currentLocationId]) locNPCs[ns.currentLocationId] = [];
        locNPCs[ns.currentLocationId].push(npcId);
      }
    }

    let html = '';
    for (const locId in locNPCs) {
      const loc = locations.find(l => l.id === locId);
      if (!loc) continue;
      const npcIds = locNPCs[locId];
      const portraits = npcIds.map(id => {
        const npc = _getNPCById(id);
        const name = npc ? npc.name : id;
        const firstChar = name ? name[0] : '?';
        return `
          <div style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,${COLORS.gold},${COLORS.goldLight});display:flex;align-items:center;justify-content:center;font-size:12px;color:${COLORS.ink};border:1px solid ${COLORS.ink};cursor:pointer;" title="${name}" onclick="NPCBehavior.renderBehaviorTab('${id}')">
            ${firstChar}
          </div>
        `;
      }).join('');

      html += `
        <div style="position:absolute;left:${loc.x || 0}px;top:${loc.y || 0}px;transform:translate(-50%, -100%);display:flex;gap:2px;flex-direction:column;align-items:center;pointer-events:none;">
          <div style="display:flex;gap:2px;pointer-events:auto;">${portraits}</div>
          <div style="font-size:10px;color:${COLORS.ink};background:${COLORS.parchment};padding:1px 4px;border-radius:2px;border:1px solid ${COLORS.border};white-space:nowrap;">${loc.name || locId}</div>
        </div>
      `;
    }

    mapContainer.innerHTML = html;
  }

  // ==================== 公开API ====================

  return {

    // ===== 1. 初始化 =====

    /**
     * 初始化NPC行为系统
     * 加载存储数据，注册EventBridge监听
     */
    init() {
      _load();

      // 确保所有已有NPC都有状态记录
      const npcs = _getNPCs();
      npcs.forEach(npc => {
        if (!state.npcStates[npc.id]) {
          state.npcStates[npc.id] = {
            npcId: npc.id,
            currentState: NPC_STATE.IDLE,
            currentLocationId: null,
            targetLocationId: null,
            moveStartTime: null,
            moveEndTime: null,
            moveProgress: 0,
            schedule: {},
            logs: [],
            lastInteraction: null,
            presetParsed: false,
            initialLocationSet: false
          };
        }
      });

      // 注册EventBridge监听：时辰变化
      if (typeof EventBridge !== 'undefined' && EventBridge.on) {
        EventBridge.on('weather', (e) => {
          if (e.type === 'shichen_changed') {
            // 外部时辰变化时触发一次更新
            const shichen = _getCurrentShichen();
            for (const npcId in state.npcStates) {
              _updateNPCState(npcId, shichen);
            }
            _checkLocationInteractions();
          }
        }, 'NPCBehavior');
      }

      _save();
      console.log('[NPCBehavior] NPC动态生活行为系统初始化完成');
      return this;
    },

    // ===== 2. 模拟控制 =====

    /**
     * 启动行为模拟循环
     */
    startSimulation() {
      if (state.isSimulating) return;
      state.isSimulating = true;
      _notify('simulation_started', {});
      console.log('[NPCBehavior] 模拟已启动');
      _tick();
    },

    /**
     * 暂停行为模拟循环
     */
    pauseSimulation() {
      state.isSimulating = false;
      if (state.timerId) {
        clearTimeout(state.timerId);
        state.timerId = null;
      }
      _notify('simulation_paused', {});
      console.log('[NPCBehavior] 模拟已暂停');
    },

    /**
     * 设置模拟速度
     * @param {number} speed - 速度倍率：1, 2, 5, 10
     */
    setSimulationSpeed(speed) {
      const validSpeeds = [1, 2, 5, 10];
      if (!validSpeeds.includes(speed)) {
        console.error('[NPCBehavior] 无效的模拟速度:', speed);
        return;
      }
      state.settings.simulationSpeed = speed;
      _save();
      console.log('[NPCBehavior] 模拟速度设置为', speed + 'x');
    },

    // ===== 3. 日程管理 =====

    /**
     * 为指定NPC设置一天的日程安排
     * @param {string} npcId - NPC ID
     * @param {Object} schedule - 日程对象，格式：{ '子': { locationId: 'bedroom', behavior: 'resting' }, ... }
     */
    setSchedule(npcId, schedule) {
      if (!state.npcStates[npcId]) {
        console.error('[NPCBehavior] NPC不存在:', npcId);
        return false;
      }
      state.npcStates[npcId].schedule = { ...(schedule || {}) };
      state.npcStates[npcId].presetParsed = true;
      _save();
      _addLog(npcId, 'schedule', '日程已更新');
      console.log('[NPCBehavior] 已为', npcId, '设置日程');
      return true;
    },

    /**
     * 获取NPC当前日程
     * @param {string} npcId
     * @returns {Object} 日程对象
     */
    getSchedule(npcId) {
      if (!state.npcStates[npcId]) return {};
      return { ...state.npcStates[npcId].schedule };
    },

    // ===== 4. 状态查询 =====

    /**
     * 获取NPC当前完整状态
     * @param {string} npcId
     * @returns {Object|null} 状态对象
     */
    getCurrentState(npcId) {
      const ns = state.npcStates[npcId];
      if (!ns) return null;
      const npc = _getNPCById(npcId);
      return {
        npcId: npcId,
        name: npc ? npc.name : '未知',
        state: ns.currentState,
        stateLabel: STATE_LABELS[ns.currentState] || ns.currentState,
        locationId: ns.currentLocationId,
        targetLocationId: ns.targetLocationId,
        moveProgress: ns.moveProgress,
        isMoving: ns.currentState === NPC_STATE.MOVING,
        schedule: { ...ns.schedule },
        logs: [...(ns.logs || [])],
        lastInteraction: ns.lastInteraction ? { ...ns.lastInteraction } : null
      };
    },

    /**
     * 获取所有NPC状态摘要
     * @returns {Array} 状态摘要数组
     */
    getAllStates() {
      const result = [];
      for (const npcId in state.npcStates) {
        const s = this.getCurrentState(npcId);
        if (s) result.push(s);
      }
      return result;
    },

    // ===== 5. 移动控制 =====

    /**
     * 手动移动NPC到指定地点
     * @param {string} npcId - NPC ID
     * @param {string} fromId - 起始地点ID（可为null）
     * @param {string} toId - 目标地点ID
     */
    moveNPC(npcId, fromId, toId) {
      if (!state.npcStates[npcId]) {
        console.error('[NPCBehavior] NPC不存在:', npcId);
        return false;
      }

      const ns = state.npcStates[npcId];
      if (ns.currentState === NPC_STATE.MOVING) {
        console.warn('[NPCBehavior] NPC正在移动中，无法发起新移动');
        return false;
      }

      // 如果fromId为null，使用当前位置
      const actualFrom = fromId || ns.currentLocationId;
      if (!actualFrom) {
        // 无当前位置，直接瞬移
        ns.currentLocationId = toId;
        ns.currentState = NPC_STATE.IDLE;
        _addLog(npcId, 'teleport', `手动瞬移至${toId}`);
        _notify('npc_teleport', { npcId, locationId: toId });
        _save();
        return true;
      }

      _startMove(npcId, actualFrom, toId);
      _save();
      return true;
    },

    /**
     * 强制设置NPC位置（不触发移动）
     * @param {string} npcId
     * @param {string} locationId
     */
    setNPCLocation(npcId, locationId) {
      if (!state.npcStates[npcId]) return false;
      const ns = state.npcStates[npcId];
      ns.currentLocationId = locationId;
      ns.targetLocationId = null;
      ns.moveStartTime = null;
      ns.moveEndTime = null;
      ns.moveProgress = 0;
      ns.currentState = NPC_STATE.IDLE;
      _save();
      return true;
    },

    // ===== 6. 互动控制 =====

    /**
     * 触发两个NPC互动
     * @param {string} npcAId - NPC A ID
     * @param {string} npcBId - NPC B ID
     */
    interact(npcA, npcB) {
      const idA = typeof npcA === 'string' ? npcA : npcA.id;
      const idB = typeof npcB === 'string' ? npcB : npcB.id;

      if (!state.npcStates[idA] || !state.npcStates[idB]) {
        console.error('[NPCBehavior] 互动失败：NPC不存在');
        return false;
      }

      if (!_areAtSameLocation(idA, idB)) {
        console.warn('[NPCBehavior] 互动失败：两NPC不在同一地点');
        return false;
      }

      _triggerInteraction(idA, idB);
      _save();
      return true;
    },

    // ===== 7. 预设解析 =====

    /**
     * 解析NPC预设提示词，自动生成行为日程
     * @param {string} npcId - NPC ID
     * @returns {Object|null} 解析后的日程对象
     */
    parsePresetToSchedule(npcId) {
      const npc = _getNPCById(npcId);
      if (!npc) {
        console.error('[NPCBehavior] NPC不存在:', npcId);
        return null;
      }

      const preset = npc.promptOverride || npc.background || '';
      if (!preset) {
        console.warn('[NPCBehavior] NPC无预设内容可解析:', npcId);
        return null;
      }

      // 基于关键词的简单解析（可扩展为AI解析）
      const schedule = {};
      const presetLower = preset.toLowerCase();

      // 时间关键词映射
      const timeKeywords = {
        '子': ['子', '夜半', '深夜', '半夜'],
        '丑': ['丑', '鸡鸣', '凌晨'],
        '寅': ['寅', '平旦', '拂晓'],
        '卯': ['卯', '日出', '早晨', '早上', '清晨'],
        '辰': ['辰', '食时', '上午', '早饭'],
        '巳': ['巳', '隅中', '临近中午'],
        '午': ['午', '日中', '中午', '午时', '正午'],
        '未': ['未', '日昳', '下午', '午后'],
        '申': ['申', '晡时', '傍晚', '黄昏前'],
        '酉': ['酉', '日入', '日落', '傍晚', '晚上'],
        '戌': ['戌', '黄昏', '晚上', '夜幕'],
        '亥': ['亥', '人定', '深夜', '夜里', '就寝']
      };

      // 行为关键词映射
      const behaviorKeywords = {
        'idle': ['散步', '闲逛', '游走', '漫步', '溜达', '游园'],
        'working': ['工作', '处理', '办公', '读书', '学习', '修炼', '练功', '批阅'],
        'resting': ['休息', '睡觉', '就寝', '午睡', '小憩', '安眠', '卧床'],
        'interacting': ['会客', '接见', '拜访', '宴请', '相聚', '会谈']
      };

      // 地点提取：查找预设中提到的地图地点
      const mapData = _getMapData();
      const locations = mapData.locations || [];

      // 为每个时辰尝试匹配
      for (const [shichenName, keywords] of Object.entries(timeKeywords)) {
        // 检查预设中是否提到该时辰相关词
        const hasTime = keywords.some(k => presetLower.includes(k));
        if (!hasTime) continue;

        // 寻找行为
        let matchedBehavior = 'idle';
        for (const [behavior, bKeywords] of Object.entries(behaviorKeywords)) {
          if (bKeywords.some(bk => presetLower.includes(bk))) {
            matchedBehavior = behavior;
            break;
          }
        }

        // 寻找地点：匹配预设中提到的地点名称
        let matchedLocation = null;
        for (const loc of locations) {
          const locName = (loc.name || '').toLowerCase();
          if (locName && presetLower.includes(locName)) {
            matchedLocation = loc.id;
            break;
          }
        }
        // 如果没找到具体地点，使用第一个地点作为兜底
        if (!matchedLocation && locations.length > 0) {
          matchedLocation = locations[0].id;
        }

        if (matchedLocation) {
          schedule[shichenName] = {
            locationId: matchedLocation,
            behavior: matchedBehavior
          };
        }
      }

      // 如果解析出的日程太少，尝试基于NPC性格补充默认日程
      const shichenCount = Object.keys(schedule).length;
      if (shichenCount < 4 && locations.length > 0) {
        // 未覆盖的时辰填充默认行为
        for (const sc of SHICHEN_ORDER) {
          if (!schedule[sc]) {
            // 夜间默认休息，白天默认闲逛/工作
            const nightShichen = ['子', '丑', '寅', '亥'];
            const workShichen = ['辰', '巳', '午', '未'];
            let defaultBehavior = 'idle';
            if (nightShichen.includes(sc)) defaultBehavior = 'resting';
            else if (workShichen.includes(sc)) defaultBehavior = 'working';

            schedule[sc] = {
              locationId: locations[Math.floor(Math.random() * locations.length)].id,
              behavior: defaultBehavior
            };
          }
        }
      }

      // 保存解析结果
      if (Object.keys(schedule).length > 0) {
        this.setSchedule(npcId, schedule);
        state.npcStates[npcId].presetParsed = true;
        _addLog(npcId, 'preset', 'AI已根据预设自动生成日程');
        console.log('[NPCBehavior] 已为', npcId, '解析预设生成日程');
      }

      return schedule;
    },

    /**
     * 使用AI深度解析预设（异步，调用API）
     * @param {string} npcId
     */
    async aiParsePresetToSchedule(npcId) {
      const npc = _getNPCById(npcId);
      if (!npc) {
        App.toast && App.toast('NPC不存在', 'error');
        return null;
      }

      const preset = npc.promptOverride || npc.background || '';
      if (!preset) {
        App.toast && App.toast('该NPC无预设内容', 'warning');
        return null;
      }

      // 获取地图地点列表
      const mapData = _getMapData();
      const locations = mapData.locations || [];
      const locationList = locations.map(l => `${l.name || l.id}(${l.id})`).join('、');

      App.toast && App.toast('正在使用AI解析预设...', 'info');

      try {
        const prompt = `请为以下古风视觉小说角色解析其行为预设，生成一天的十二时辰日程安排。

角色：${npc.name || '未命名'}
预设内容：${preset}

可用地点：${locationList || '暂无地图地点'}

请返回JSON对象，键为时辰（子、丑、寅、卯、辰、巳、午、未、申、酉、戌、亥），值为对象包含：
- locationId: 地点ID（从可用地点中选择最合适的）
- behavior: 行为类型（idle/working/resting/interacting）

只返回JSON对象，不要任何其他文字。`;

        let result = '';
        if (typeof APISettings !== 'undefined' && APISettings.chat) {
          result = await APISettings.chat(prompt, [], { useAux: true });
        } else {
          // 降级使用本地解析
          return this.parsePresetToSchedule(npcId);
        }

        // 提取JSON
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const schedule = JSON.parse(jsonMatch[0]);
          this.setSchedule(npcId, schedule);
          App.toast && App.toast('AI已成功解析预设并生成日程', 'success');
          return schedule;
        }
      } catch (e) {
        console.error('[NPCBehavior] AI解析预设失败:', e);
        App.toast && App.toast('AI解析失败，已回退到本地解析', 'warning');
        return this.parsePresetToSchedule(npcId);
      }

      return null;
    },

    // ===== 8. AI分配位置 =====

    /**
     * AI根据NPC设定自动分配到合适的地点
     * @param {string} npcId - NPC ID
     */
    aiAssignLocation(npcId) {
      const npc = _getNPCById(npcId);
      if (!npc) {
        console.error('[NPCBehavior] NPC不存在:', npcId);
        return false;
      }

      const mapData = _getMapData();
      const locations = mapData.locations || [];
      if (locations.length === 0) {
        console.warn('[NPCBehavior] 地图为空，无法分配位置');
        return false;
      }

      // 基于NPC属性的简单匹配逻辑
      const npcText = `${npc.name || ''} ${npc.job || ''} ${npc.identity || ''} ${npc.title || ''} ${npc.background || ''}`.toLowerCase();
      let bestLoc = null;
      let bestScore = -1;

      for (const loc of locations) {
        let score = 0;
        const locName = (loc.name || '').toLowerCase();
        const locType = (loc.type || '').toLowerCase();

        // 根据NPC身份匹配地点类型
        if (npcText.includes('皇') || npcText.includes('帝') || npcText.includes('王')) {
          if (locName.includes('宫') || locName.includes('殿') || locType.includes('manor')) score += 10;
        }
        if (npcText.includes('商') || npcText.includes('贾')) {
          if (locName.includes('市') || locName.includes('店') || locType.includes('shop')) score += 10;
        }
        if (npcText.includes('僧') || npcText.includes('道') || npcText.includes('仙')) {
          if (locName.includes('寺') || locName.includes('庙') || locName.includes('观') || locType.includes('temple')) score += 10;
        }
        if (npcText.includes('武') || npcText.includes('将') || npcText.includes('军')) {
          if (locName.includes('营') || locName.includes('场') || locName.includes('武')) score += 10;
        }
        if (npcText.includes('文') || npcText.includes('书') || npcText.includes('才')) {
          if (locName.includes('书') || locName.includes('阁') || locName.includes('斋')) score += 10;
        }

        // 通用匹配
        if (locName.includes(npcText.split('')[0])) score += 1;

        // 随机加分确保有结果
        score += Math.random() * 3;

        if (score > bestScore) {
          bestScore = score;
          bestLoc = loc;
        }
      }

      // 如果没有合适的，随机分配
      if (!bestLoc) {
        bestLoc = locations[Math.floor(Math.random() * locations.length)];
      }

      // 设置位置
      if (!state.npcStates[npcId]) {
        state.npcStates[npcId] = {
          npcId: npcId,
          currentState: NPC_STATE.IDLE,
          currentLocationId: null,
          targetLocationId: null,
          moveStartTime: null,
          moveEndTime: null,
          moveProgress: 0,
          schedule: {},
          logs: [],
          lastInteraction: null,
          presetParsed: false,
          initialLocationSet: true
        };
      }

      state.npcStates[npcId].currentLocationId = bestLoc.id;
      state.npcStates[npcId].initialLocationSet = true;
      _addLog(npcId, 'init', `AI分配至${bestLoc.name || bestLoc.id}`);
      _save();
      _notify('npc_location_assigned', { npcId, locationId: bestLoc.id });

      console.log('[NPCBehavior] 已将', npcId, '分配至', bestLoc.name || bestLoc.id);
      return true;
    },

    /**
     * 为所有未分配位置的NPC自动分配
     */
    aiAssignAllLocations() {
      const npcs = _getNPCs();
      let count = 0;
      npcs.forEach(npc => {
        const ns = state.npcStates[npc.id];
        if (!ns || !ns.currentLocationId) {
          if (this.aiAssignLocation(npc.id)) count++;
        }
      });
      App.toast && App.toast(`已为 ${count} 个NPC分配初始位置`, 'success');
      return count;
    },

    // ===== 9. 界面渲染 =====

    /**
     * 渲染NPC详情页"行为"标签内容
     * @param {string} npcId - NPC ID
     * @returns {string} HTML字符串
     */
    renderBehaviorTab(npcId) {
      const ns = state.npcStates[npcId];
      const npc = _getNPCById(npcId);
      if (!ns || !npc) return '<div class="npc-behavior-empty">NPC不存在</div>';

      const stateLabel = STATE_LABELS[ns.currentState] || ns.currentState || '未知';
      const stateIcon = STATE_ICONS[ns.currentState] || '❓';
      const shichen = _getCurrentShichen();

      // 当前日程
      const currentSchedule = shichen && ns.schedule ? (ns.schedule[shichen.name] || null) : null;

      // 今日完整日程表
      const scheduleRows = SHICHEN_ORDER.map(sc => {
        const item = ns.schedule ? ns.schedule[sc] : null;
        const isCurrent = shichen && shichen.name === sc;
        const locName = item ? (item.locationId || '-') : '-';
        const behaviorLabel = item ? (STATE_LABELS[item.behavior] || item.behavior) : '无安排';
        return `
          <tr style="background:${isCurrent ? 'rgba(201,162,39,0.15)' : 'transparent'};">
            <td style="padding:8px 12px;font-size:13px;color:${isCurrent ? COLORS.ink : COLORS.inkMuted};font-weight:${isCurrent ? '700' : '400'};">${sc}时 ${isCurrent ? '◀ 当前' : ''}</td>
            <td style="padding:8px 12px;font-size:13px;color:${COLORS.inkLight};">${locName}</td>
            <td style="padding:8px 12px;font-size:13px;color:${COLORS.inkLight};">${behaviorLabel}</td>
          </tr>
        `;
      }).join('');

      // 移动历史（最近10条）
      const moveLogs = (ns.logs || []).slice(-10).reverse().map(log => `
        <div style="padding:8px 12px;border-bottom:1px solid ${COLORS.borderLight};font-size:13px;">
          <span style="color:${COLORS.inkMuted};font-size:11px;">${log.time}</span>
          <span style="color:${COLORS.ink};margin-left:8px;">${log.content}</span>
        </div>
      `).join('');

      // 移动进度条
      let progressBar = '';
      if (ns.currentState === NPC_STATE.MOVING && ns.moveProgress > 0) {
        const pct = Math.round(ns.moveProgress * 100);
        progressBar = `
          <div style="margin-top:12px;">
            <div style="font-size:12px;color:${COLORS.inkMuted};margin-bottom:4px;">移动进度</div>
            <div style="background:${COLORS.parchmentLight};border:1px solid ${COLORS.border};border-radius:8px;height:20px;overflow:hidden;">
              <div style="background:linear-gradient(90deg,${COLORS.gold},${COLORS.goldLight});width:${pct}%;height:100%;display:flex;align-items:center;justify-content:flex-end;padding-right:6px;color:${COLORS.ink};font-size:11px;font-weight:700;transition:width 0.3s;">
                ${pct}%
              </div>
            </div>
            <div style="font-size:12px;color:${COLORS.inkMuted};margin-top:4px;">从 ${ns.currentLocationId || '?'} 前往 ${ns.targetLocationId || '?'}</div>
          </div>
        `;
      }

      return `
        <div style="font-family:'Noto Serif SC',serif;color:${COLORS.ink};">
          <!-- 状态卡片 -->
          <div style="background:linear-gradient(135deg,${COLORS.ink},${COLORS.inkLight});color:${COLORS.gold};padding:20px;border-radius:12px;margin-bottom:16px;border:2px solid ${COLORS.gold};box-shadow:0 4px 20px rgba(44,24,16,0.3);">
            <div style="font-size:14px;opacity:0.8;margin-bottom:8px;">当前状态</div>
            <div style="font-size:36px;margin-bottom:8px;">${stateIcon} ${stateLabel}</div>
            <div style="font-size:14px;opacity:0.9;">
              📍 位置：${ns.currentLocationId || (ns.targetLocationId ? '在途中' : '未分配')}
              ${ns.targetLocationId ? `→ ${ns.targetLocationId}` : ''}
            </div>
            ${progressBar}
          </div>

          <!-- 当前时辰日程 -->
          <div style="background:${COLORS.parchment};border:1px solid ${COLORS.border};border-radius:8px;padding:16px;margin-bottom:16px;">
            <div style="font-size:15px;font-weight:700;color:${COLORS.ink};margin-bottom:12px;border-left:4px solid ${COLORS.gold};padding-left:10px;">
              🕐 当前时辰日程 ${shichen ? '(' + shichen.label + ')' : ''}
            </div>
            ${currentSchedule
              ? `<div style="font-size:14px;color:${COLORS.inkLight};padding:8px;background:rgba(201,162,39,0.1);border-radius:4px;">
                  地点：${currentSchedule.locationId} · 行为：${STATE_LABELS[currentSchedule.behavior] || currentSchedule.behavior}
                 </div>`
              : '<div style="font-size:13px;color:#8B7355;padding:8px;">当前时辰无日程安排</div>'
            }
            <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
              <button class="npc-behavior-btn" onclick="NPCBehavior.parsePresetToSchedule('${npcId}')">🤖 AI解析预设</button>
              <button class="npc-behavior-btn" onclick="NPCBehavior.openScheduleEditor('${npcId}')">✏️ 编辑日程</button>
              <button class="npc-behavior-btn" onclick="NPCBehavior.aiAssignLocation('${npcId}')">📍 AI分配位置</button>
            </div>
          </div>

          <!-- 今日完整日程 -->
          <div style="background:${COLORS.parchment};border:1px solid ${COLORS.border};border-radius:8px;padding:16px;margin-bottom:16px;">
            <div style="font-size:15px;font-weight:700;color:${COLORS.ink};margin-bottom:12px;border-left:4px solid ${COLORS.gold};padding-left:10px;">📅 今日完整日程</div>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <thead>
                <tr style="background:rgba(201,162,39,0.2);">
                  <th style="padding:8px 12px;text-align:left;font-size:13px;color:${COLORS.ink};border-bottom:1px solid ${COLORS.border};">时辰</th>
                  <th style="padding:8px 12px;text-align:left;font-size:13px;color:${COLORS.ink};border-bottom:1px solid ${COLORS.border};">地点</th>
                  <th style="padding:8px 12px;text-align:left;font-size:13px;color:${COLORS.ink};border-bottom:1px solid ${COLORS.border};">行为</th>
                </tr>
              </thead>
              <tbody>${scheduleRows}</tbody>
            </table>
          </div>

          <!-- 移动历史 -->
          <div style="background:${COLORS.parchment};border:1px solid ${COLORS.border};border-radius:8px;padding:16px;">
            <div style="font-size:15px;font-weight:700;color:${COLORS.ink};margin-bottom:12px;border-left:4px solid ${COLORS.gold};padding-left:10px;">📜 移动历史（最近10条）</div>
            ${moveLogs || '<div style="color:#8B7355;font-size:13px;padding:8px;">暂无记录</div>'}
          </div>
        </div>
      `;
    },

    /**
     * 渲染NPC总览页面（完整页面）
     * @param {string} containerId - 容器ID（可选）
     */
    renderNPCOverview(containerId) {
      const cid = containerId || 'npc-behavior-overview';
      let container = document.getElementById(cid);
      if (!container) {
        container = document.createElement('div');
        container.id = cid;
        document.body.appendChild(container);
      }
      _renderNPCOverview();
    },

    /**
     * 渲染设置面板
     * @param {string} containerId
     */
    renderSettingsPanel(containerId) {
      const cid = containerId || 'npc-behavior-settings';
      const container = document.getElementById(cid);
      if (!container) return;

      container.innerHTML = `
        <div style="font-family:'Noto Serif SC',serif;background:${COLORS.parchment};border:2px solid ${COLORS.border};border-radius:12px;padding:20px;max-width:500px;">
          <h3 style="margin:0 0 16px 0;color:${COLORS.ink};font-size:18px;border-left:4px solid ${COLORS.gold};padding-left:12px;">⚙️ 行为系统设置</h3>

          <div style="margin-bottom:16px;padding:12px;background:rgba(245,230,211,0.6);border-radius:8px;border:1px solid ${COLORS.borderLight};">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;color:${COLORS.ink};">
              <input type="checkbox" ${state.settings.enableSimulation ? 'checked' : ''}
                onchange="NPCBehavior.toggleSetting('enableSimulation', this.checked)">
              启用行为模拟
            </label>
          </div>

          <div style="margin-bottom:16px;padding:12px;background:rgba(245,230,211,0.6);border-radius:8px;border:1px solid ${COLORS.borderLight};">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;color:${COLORS.ink};">
              <input type="checkbox" ${state.settings.enableAutoInteract ? 'checked' : ''}
                onchange="NPCBehavior.toggleSetting('enableAutoInteract', this.checked)">
              启用自动互动
            </label>
            <div style="font-size:12px;color:${COLORS.inkMuted};margin-top:4px;margin-left:24px;">同一地点的NPC有机会自动触发互动</div>
          </div>

          <div style="margin-bottom:16px;padding:12px;background:rgba(245,230,211,0.6);border-radius:8px;border:1px solid ${COLORS.borderLight};">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;color:${COLORS.ink};">
              <input type="checkbox" ${state.settings.enableLogging ? 'checked' : ''}
                onchange="NPCBehavior.toggleSetting('enableLogging', this.checked)">
              启用行为日志
            </label>
          </div>

          <div style="margin-bottom:16px;padding:12px;background:rgba(245,230,211,0.6);border-radius:8px;border:1px solid ${COLORS.borderLight};">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;color:${COLORS.ink};">
              <input type="checkbox" ${state.settings.aiParsePreset ? 'checked' : ''}
                onchange="NPCBehavior.toggleSetting('aiParsePreset', this.checked)">
              启用AI预设解析
            </label>
          </div>

          <div style="padding:12px;background:rgba(245,230,211,0.6);border-radius:8px;border:1px solid ${COLORS.borderLight};">
            <label style="font-size:14px;color:${COLORS.ink};display:block;margin-bottom:8px;">模拟速度</label>
            <select onchange="NPCBehavior.setSimulationSpeed(parseInt(this.value))" style="background:${COLORS.parchment};border:1px solid ${COLORS.border};color:${COLORS.ink};padding:6px 12px;border-radius:4px;font-family:inherit;width:100%;">
              <option value="1" ${state.settings.simulationSpeed === 1 ? 'selected' : ''}>1x（正常）</option>
              <option value="2" ${state.settings.simulationSpeed === 2 ? 'selected' : ''}>2x（两倍）</option>
              <option value="5" ${state.settings.simulationSpeed === 5 ? 'selected' : ''}>5x（五倍）</option>
              <option value="10" ${state.settings.simulationSpeed === 10 ? 'selected' : ''}>10x（十倍）</option>
            </select>
          </div>
        </div>
      `;
    },

    /**
     * 打开日程编辑器（简单prompt版，可扩展为模态框）
     * @param {string} npcId
     */
    openScheduleEditor(npcId) {
      const ns = state.npcStates[npcId];
      if (!ns) return;

      const npc = _getNPCById(npcId);
      const name = npc ? npc.name : npcId;

      // 获取地图地点列表
      const mapData = _getMapData();
      const locations = mapData.locations || [];
      const locOptions = locations.map(l => `${l.name || l.id}(${l.id})`).join('、') || '暂无地点';

      const example = JSON.stringify({
        '子': { locationId: 'bedroom', behavior: 'resting' },
        '午': { locationId: 'garden', behavior: 'idle' }
      }, null, 2);

      const input = prompt(
        `为「${name}」编辑十二时辰日程\n\n可用地点：${locOptions}\n\n行为类型：idle(闲逛)/working(工作)/resting(休息)/interacting(互动)\n\n格式示例（JSON）：\n${example}\n\n请输入完整日程JSON：`,
        JSON.stringify(ns.schedule || {}, null, 2)
      );

      if (input === null) return; // 用户取消

      try {
        const schedule = JSON.parse(input);
        this.setSchedule(npcId, schedule);
        App.toast && App.toast('日程已保存', 'success');
      } catch (e) {
        App.toast && App.toast('JSON格式错误，请检查输入', 'error');
        console.error('[NPCBehavior] 日程解析失败:', e);
      }
    },

    // ===== 10. 设置管理 =====

    /**
     * 切换设置项
     * @param {string} key - 设置键名
     * @param {boolean} value - 开关值
     */
    toggleSetting(key, value) {
      if (state.settings.hasOwnProperty(key)) {
        state.settings[key] = value;
        _save();
        console.log('[NPCBehavior] 设置已更新:', key, '=', value);
      }
    },

    /**
     * 获取当前设置
     * @returns {Object}
     */
    getSettings() {
      return { ...state.settings };
    },

    // ===== 11. 存储管理 =====

    /**
     * 导出行为数据为JSON字符串
     * @returns {string}
     */
    exportData() {
      return JSON.stringify({
        npcStates: state.npcStates,
        settings: state.settings,
        lastShichen: state.lastShichen,
        exportedAt: new Date().toISOString()
      }, null, 2);
    },

    /**
     * 导入行为数据
     * @param {string} jsonStr - JSON字符串
     */
    importData(jsonStr) {
      try {
        const data = JSON.parse(jsonStr);
        if (data.npcStates) state.npcStates = data.npcStates;
        if (data.settings) state.settings = { ...state.settings, ...data.settings };
        if (data.lastShichen) state.lastShichen = data.lastShichen;
        _save();
        console.log('[NPCBehavior] 数据已导入');
        return true;
      } catch (e) {
        console.error('[NPCBehavior] 数据导入失败:', e);
        return false;
      }
    },

    /**
     * 清空所有行为数据
     */
    clearAllData() {
      if (!confirm('确定要清空所有NPC行为数据吗？此操作不可撤销。')) return;
      state.npcStates = {};
      state.lastShichen = null;
      _save();
      App.toast && App.toast('所有行为数据已清空', 'success');
    },

    // ===== 12. 调试与工具 =====

    /**
     * 获取系统内部状态（调试用）
     */
    _getInternalState() {
      return {
        isSimulating: state.isSimulating,
        simulationSpeed: state.settings.simulationSpeed,
        npcCount: Object.keys(state.npcStates).length,
        lastShichen: state.lastShichen,
        settings: { ...state.settings }
      };
    },

    /**
     * 手动触发一次时辰更新（测试用）
     */
    _forceTick() {
      const shichen = _getCurrentShichen();
      for (const npcId in state.npcStates) {
        _updateNPCState(npcId, shichen);
      }
      _checkLocationInteractions();
      _renderNPCOverview();
    }

  };
})();

// ==================== CSS样式注入 ====================

(function() {
  const style = document.createElement('style');
  style.textContent = `
    /* NPCBehavior 古风墨境样式 */
    .npc-behavior-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 14px;
      font-size: 13px;
      font-family: 'Noto Serif SC', serif;
      border: 1px solid #C9A227;
      background: linear-gradient(180deg, #F5E6D3, #e8d5c0);
      color: #2C1810;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s;
      letter-spacing: 1px;
    }
    .npc-behavior-btn:hover {
      background: #C9A227;
      color: #F5E6D3;
    }
    .npc-behavior-btn-sm {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 3px 8px;
      font-size: 11px;
      font-family: 'Noto Serif SC', serif;
      border: 1px solid #C9A227;
      background: transparent;
      color: #2C1810;
      cursor: pointer;
      border-radius: 3px;
      transition: all 0.2s;
    }
    .npc-behavior-btn-sm:hover {
      background: #C9A227;
      color: #F5E6D3;
    }
    .npc-behavior-empty {
      text-align: center;
      padding: 32px;
      color: #8B7355;
      font-size: 14px;
      font-family: 'Noto Serif SC', serif;
    }
    #npc-behavior-overview {
      margin: 16px 0;
    }
  `;
  if (document.head) {
    document.head.appendChild(style);
  } else {
    // 如果head尚不可用，等待DOMContentLoaded
    window.addEventListener('DOMContentLoaded', () => {
      document.head.appendChild(style);
    });
  }
})();

// ==================== 模块导出 ====================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NPCBehavior;
}
