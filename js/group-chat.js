/**
 * group-chat.js
 * 群像对话系统 - 多角色同时在场，AI决定谁发言，用户可随时介入
 *
 * 配色：暖羊皮纸底色 #F5E6D3 / 金色 #C9A227 / 墨色 #2C1810
 */

// ============================================================
// 全局状态
// ============================================================

const GroupChat = {
  /** 当前会话是否激活 */
  isActive: false,

  /** 当前场景ID */
  currentLocationId: null,

  /** 当前在场NPC的ID列表 */
  presentNPCs: [],

  /** 当前发言者NPC ID */
  currentSpeakerId: null,

  /** 会话历史记录 */
  dialogueHistory: [],

  /** 玩家输入缓存 */
  playerInputBuffer: "",

  /** 系统提示词缓存（包含所有在场角色信息） */
  systemPromptCache: "",

  /** 会话开始时间戳 */
  sessionStartTime: null,

  /** 会话唯一标识 */
  sessionId: null,

  /** 是否暂停自动推进 */
  isPaused: false,

  /** 快进模式标志 */
  isFastForward: false,

  /** 自动推进定时器ID */
  autoAdvanceTimer: null,

  /** 默认自动推进间隔（毫秒） */
  autoAdvanceInterval: 3000,

  /** 快进模式间隔（毫秒） */
  fastForwardInterval: 800,

  /** 最大历史记录条数 */
  maxHistoryLength: 200,

  /** 是否正在等待AI响应 */
  isWaitingAI: false,

  /** 天气信息缓存 */
  cachedWeather: null,

  /** 场景信息缓存 */
  cachedSceneInfo: null,
};

// ============================================================
// 本地存储键名常量
// ============================================================

const STORAGE_KEY = "group_chat_sessions_v13";

// ============================================================
// 会话管理
// ============================================================

/**
 * 启动群像会话
 * @param {string} locationId - 场景地点ID
 * @param {string[]} npcIds - 初始在场的NPC ID数组
 * @returns {boolean} 是否成功启动
 */
GroupChat.startSession = function (locationId, npcIds) {
  // 如果已有活跃会话，先结束
  if (this.isActive) {
    this.endSession();
  }

  // 参数校验
  if (!locationId || !Array.isArray(npcIds) || npcIds.length === 0) {
    console.error("[群像会话] 启动失败：地点ID或NPC列表无效");
    return false;
  }

  // 初始化会话状态
  this.isActive = true;
  this.currentLocationId = locationId;
  this.presentNPCs = [...npcIds];
  this.currentSpeakerId = null;
  this.dialogueHistory = [];
  this.playerInputBuffer = "";
  this.isPaused = false;
  this.isFastForward = false;
  this.isWaitingAI = false;
  this.sessionStartTime = Date.now();
  this.sessionId = this._generateSessionId();

  // 获取场景信息
  this.cachedSceneInfo = this._fetchSceneInfo(locationId);

  // 获取天气信息
  this.cachedWeather = this._fetchWeatherInfo();

  // 构建系统提示词
  this._rebuildSystemPrompt();

  // 保存会话到本地存储
  this._saveSession();

  // 渲染UI
  this._renderUI();

  // 触发首个发言回合
  this.nextTurn();

  console.log(`[群像会话] 会话已启动 | 地点：${locationId} | NPC：${npcIds.join(", ")}`);
  return true;
};

/**
 * 添加NPC到当前会话
 * @param {string} npcId - 要添加的NPC ID
 * @returns {boolean} 是否添加成功
 */
GroupChat.addNPC = function (npcId) {
  if (!this.isActive) {
    console.warn("[群像会话] 添加NPC失败：没有活跃的会话");
    return false;
  }

  if (!npcId || typeof npcId !== "string") {
    console.warn("[群像会话] 添加NPC失败：无效的NPC ID");
    return false;
  }

  if (this.presentNPCs.includes(npcId)) {
    console.warn(`[群像会话] NPC ${npcId} 已在场`);
    return false;
  }

  // 添加到在场列表
  this.presentNPCs.push(npcId);

  // 重新构建系统提示词
  this._rebuildSystemPrompt();

  // 保存会话
  this._saveSession();

  // 刷新UI头像区
  this._renderNPCAvatars();

  console.log(`[群像会话] NPC ${npcId} 已加入会话`);

  // 触发该NPC的入场发言（非强制，由AI情境决定）
  // 如果AI认为新角色应该发言，会在下一回合体现

  return true;
};

/**
 * 从当前会话移除NPC
 * @param {string} npcId - 要移除的NPC ID
 * @returns {boolean} 是否移除成功
 */
GroupChat.removeNPC = function (npcId) {
  if (!this.isActive) {
    console.warn("[群像会话] 移除NPC失败：没有活跃的会话");
    return false;
  }

  const index = this.presentNPCs.indexOf(npcId);
  if (index === -1) {
    console.warn(`[群像会话] NPC ${npcId} 不在场`);
    return false;
  }

  // 从在场列表移除
  this.presentNPCs.splice(index, 1);

  // 如果当前发言者被移除，清空当前发言者
  if (this.currentSpeakerId === npcId) {
    this.currentSpeakerId = null;
  }

  // 如果场上没有NPC了，结束会话
  if (this.presentNPCs.length === 0) {
    console.log("[群像会话] 所有NPC已离场，会话自动结束");
    this.endSession();
    return true;
  }

  // 重新构建系统提示词
  this._rebuildSystemPrompt();

  // 保存会话
  this._saveSession();

  // 刷新UI头像区
  this._renderNPCAvatars();

  console.log(`[群像会话] NPC ${npcId} 已离开会话`);
  return true;
};

/**
 * AI决定下一个发言者并生成发言
 * 核心逻辑：由用户预设的群像发言规则决定发言顺序，非轮流制
 */
GroupChat.nextTurn = function () {
  if (!this.isActive) {
    console.warn("[群像会话] nextTurn失败：没有活跃的会话");
    return;
  }

  if (this.isPaused) {
    console.log("[群像会话] 处于暂停状态，跳过本回合");
    return;
  }

  if (this.isWaitingAI) {
    console.log("[群像会话] 正在等待AI响应，跳过本回合");
    return;
  }

  if (this.presentNPCs.length === 0) {
    console.warn("[群像会话] 场上没有NPC，无法推进");
    return;
  }

  this.isWaitingAI = true;

  // 构建AI请求上下文
  const context = this._buildAIContext();

  // 调用AI接口（由用户预设的AI调用逻辑）
  this._callAI(context)
    .then((response) => {
      this.isWaitingAI = false;

      // 解析AI返回："{角色名}：{发言内容}"
      const parsed = this._parseAIResponse(response);

      if (parsed) {
        // 查找对应的NPC ID
        const npcId = this._findNPCIdByName(parsed.name);

        if (npcId && this.presentNPCs.includes(npcId)) {
          this.currentSpeakerId = npcId;

          // 添加到对话历史
          const dialogueEntry = {
            type: "npc",
            npcId: npcId,
            npcName: parsed.name,
            content: parsed.content,
            timestamp: Date.now(),
          };
          this.dialogueHistory.push(dialogueEntry);

          // 限制历史长度
          if (this.dialogueHistory.length > this.maxHistoryLength) {
            this.dialogueHistory.shift();
          }

          // 保存会话
          this._saveSession();

          // 更新UI
          this._renderDialogue();
          this._renderNPCAvatars();

          console.log(`[群像会话] ${parsed.name} 发言：${parsed.content}`);
        } else {
          console.warn(`[群像会话] AI返回的角色名"${parsed.name}"未匹配在场NPC`);
        }
      } else {
        console.warn("[群像会话] 无法解析AI响应：", response);
      }

      // 设置自动推进
      this._scheduleNextTurn();
    })
    .catch((error) => {
      this.isWaitingAI = false;
      console.error("[群像会话] AI调用失败：", error);
      this._scheduleNextTurn();
    });
};

/**
 * 玩家发言
 * @param {string} text - 玩家输入的文本
 * @returns {boolean} 是否发言成功
 */
GroupChat.playerSay = function (text) {
  if (!this.isActive) {
    console.warn("[群像会话] 玩家发言失败：没有活跃的会话");
    return false;
  }

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    console.warn("[群像会话] 玩家发言失败：输入为空");
    return false;
  }

  const trimmedText = text.trim();

  // 添加到对话历史
  const dialogueEntry = {
    type: "player",
    content: trimmedText,
    timestamp: Date.now(),
  };
  this.dialogueHistory.push(dialogueEntry);

  // 限制历史长度
  if (this.dialogueHistory.length > this.maxHistoryLength) {
    this.dialogueHistory.shift();
  }

  // 清空玩家输入缓存
  this.playerInputBuffer = "";

  // 保存会话
  this._saveSession();

  // 更新UI
  this._renderDialogue();
  this._clearPlayerInput();

  console.log(`[群像会话] 玩家发言：${trimmedText}`);

  // 取消当前自动推进定时器，让玩家发言后AI立即响应
  this._clearAutoAdvanceTimer();

  // 玩家发言后触发AI回应
  // 给予短暂延迟，模拟对话节奏
  setTimeout(() => {
    this.nextTurn();
  }, 500);

  return true;
};

/**
 * 结束当前会话
 * @returns {boolean} 是否成功结束
 */
GroupChat.endSession = function () {
  if (!this.isActive) {
    console.warn("[群像会话] 没有活跃的会话可结束");
    return false;
  }

  // 清除自动推进定时器
  this._clearAutoAdvanceTimer();

  // 保存最终会话状态
  this._saveSession();

  // 记录会话结束时间
  const sessionEndTime = Date.now();
  const duration = sessionEndTime - this.sessionStartTime;

  console.log(`[群像会话] 会话已结束 | 持续时间：${Math.floor(duration / 1000)}秒 | 对话数：${this.dialogueHistory.length}`);

  // 重置所有状态
  this.isActive = false;
  this.currentLocationId = null;
  this.presentNPCs = [];
  this.currentSpeakerId = null;
  this.dialogueHistory = [];
  this.playerInputBuffer = "";
  this.systemPromptCache = "";
  this.sessionStartTime = null;
  this.sessionId = null;
  this.isPaused = false;
  this.isFastForward = false;
  this.isWaitingAI = false;
  this.cachedWeather = null;
  this.cachedSceneInfo = null;

  // 隐藏群像UI（返回普通场景UI）
  this._hideUI();

  return true;
};

// ============================================================
// 自动推进控制
// ============================================================

/**
 * 暂停自动推进
 */
GroupChat.pause = function () {
  if (!this.isActive) return;
  this.isPaused = true;
  this._clearAutoAdvanceTimer();
  this._updateControlButtonStates();
  console.log("[群像会话] 已暂停");
};

/**
 * 恢复自动推进
 */
GroupChat.resume = function () {
  if (!this.isActive) return;
  this.isPaused = false;
  this._updateControlButtonStates();
  console.log("[群像会话] 已恢复");
  // 如果不在等待AI，立即推进下一回合
  if (!this.isWaitingAI) {
    this.nextTurn();
  }
};

/**
 * 切换快进模式
 */
GroupChat.toggleFastForward = function () {
  if (!this.isActive) return;
  this.isFastForward = !this.isFastForward;
  this._updateControlButtonStates();
  console.log(`[群像会话] 快进模式：${this.isFastForward ? "开启" : "关闭"}`);
};

// ============================================================
// AI交互（零预设 - 群像发言逻辑由用户预设决定）
// ============================================================

/**
 * 构建AI请求上下文
 * @returns {Object} AI请求上下文对象
 */
GroupChat._buildAIContext = function () {
  // 获取在场NPC的详细信息（由外部系统提供）
  const npcDetails = this.presentNPCs.map((npcId) => {
    return this._fetchNPCDetail(npcId);
  });

  // 构建提示词
  const prompt = {
    system: this.systemPromptCache,
    scene: this.cachedSceneInfo,
    weather: this.cachedWeather,
    presentNPCs: npcDetails,
    history: this.dialogueHistory.slice(-20), // 取最近20条作为上下文
    instruction: `
你正在主持一场多角色群像对话。
当前在场角色如上所列。
请根据当前情境、角色性格和对话上下文，决定下一个发言者。

要求：
1. 不是轮流发言，而是由情境决定谁最适合说话
2. 同一个角色可以连续发言，如果情境合理
3. 角色可以互相打断、接话、沉默
4. 返回格式必须严格为：{角色名}：{发言内容}
5. 发言应该自然、符合角色设定、推动对话发展
6. 如果玩家刚刚发言，NPC应该回应玩家或继续话题
`,
  };

  return prompt;
};

/**
 * 调用AI接口（占位，由用户接入具体AI服务）
 * @param {Object} context - AI请求上下文
 * @returns {Promise<string>} AI返回的文本
 */
GroupChat._callAI = function (context) {
  // TODO: 用户在此处接入实际的AI服务（如OpenAI、百度文心等）
  // 示例：
  // return fetch('/api/chat', {
  //   method: 'POST',
  //   body: JSON.stringify(context)
  // }).then(r => r.text());

  // 当前为占位实现，返回模拟响应
  return new Promise((resolve) => {
    setTimeout(() => {
      // 模拟AI响应（开发调试用，生产环境请替换为真实AI调用）
      const mockResponses = [
        "张三：此地风景倒是不错，只是人心难测。",
        "李四：张兄所言极是，不过这茶倒是好茶。",
        "王五：两位莫要争执，何不共饮一杯？",
      ];
      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      resolve(randomResponse);
    }, 500);
  });
};

/**
 * 解析AI返回的文本，提取角色名和发言内容
 * @param {string} response - AI返回的原始文本
 * @returns {Object|null} {name, content} 或 null
 */
GroupChat._parseAIResponse = function (response) {
  if (!response || typeof response !== "string") {
    return null;
  }

  const trimmed = response.trim();

  // 匹配格式："{角色名}：{发言内容}"
  const match = trimmed.match(/^(.+?)[：:](.+)$/);

  if (match) {
    return {
      name: match[1].trim(),
      content: match[2].trim(),
    };
  }

  // 如果格式不匹配，尝试其他方式提取
  // 例如，AI可能返回只有内容没有角色名的情况
  console.warn("[群像会话] AI响应格式不匹配预期格式，尝试备用解析");
  return null;
};

/**
 * 通过角色名查找NPC ID
 * @param {string} name - 角色名
 * @returns {string|null} NPC ID 或 null
 */
GroupChat._findNPCIdByName = function (name) {
  // 由外部NPC系统提供名称到ID的映射
  for (const npcId of this.presentNPCs) {
    const detail = this._fetchNPCDetail(npcId);
    if (detail && detail.name === name) {
      return npcId;
    }
  }
  return null;
};

// ============================================================
// 系统提示词管理
// ============================================================

/**
 * 重新构建系统提示词，包含所有在场角色信息
 */
GroupChat._rebuildSystemPrompt = function () {
  const npcDescriptions = this.presentNPCs
    .map((npcId) => {
      const detail = this._fetchNPCDetail(npcId);
      if (detail) {
        return `- ${detail.name}（${npcId}）：${detail.description || "暂无描述"}`;
      }
      return `- 未知角色（${npcId}）`;
    })
    .join("\n");

  this.systemPromptCache = `
当前场景群像对话。
在场角色：
${npcDescriptions}

场景：${this.cachedSceneInfo ? this.cachedSceneInfo.name : "未知地点"}
天气：${this.cachedWeather ? this.cachedWeather.description : "未知"}

规则：
1. 由情境驱动，谁最适合说话谁发言，不是轮流
2. 角色性格鲜明，对话自然
3. 严格使用"角色名：发言内容"格式返回
`;
};

// ============================================================
// 外部系统联动
// ============================================================

/**
 * 获取NPC详细信息（与NPCBehavior系统联动）
 * @param {string} npcId - NPC ID
 * @returns {Object|null} NPC详情
 */
GroupChat._fetchNPCDetail = function (npcId) {
  // 优先从全局NPC系统获取
  if (typeof NPCBehavior !== "undefined" && NPCBehavior.getNPCDetail) {
    return NPCBehavior.getNPCDetail(npcId);
  }

  // 备选：从全局NPC数据获取
  if (typeof window !== "undefined" && window.NPC_DATA && window.NPC_DATA[npcId]) {
    return window.NPC_DATA[npcId];
  }

  // 如果都找不到，返回基础信息
  return {
    id: npcId,
    name: npcId,
    description: "未知角色",
  };
};

/**
 * 获取场景信息（与SceneSystem联动）
 * @param {string} locationId - 地点ID
 * @returns {Object|null} 场景信息
 */
GroupChat._fetchSceneInfo = function (locationId) {
  // 优先从全局场景系统获取
  if (typeof SceneSystem !== "undefined" && SceneSystem.getSceneInfo) {
    return SceneSystem.getSceneInfo(locationId);
  }

  // 备选：从全局场景数据获取
  if (typeof window !== "undefined" && window.SCENE_DATA && window.SCENE_DATA[locationId]) {
    return window.SCENE_DATA[locationId];
  }

  return {
    id: locationId,
    name: locationId,
    backgroundImage: "",
    description: "",
  };
};

/**
 * 获取天气信息（与WeatherSystem联动）
 * @returns {Object|null} 天气信息
 */
GroupChat._fetchWeatherInfo = function () {
  // 优先从全局天气系统获取
  if (typeof WeatherSystem !== "undefined" && WeatherSystem.getCurrentWeather) {
    return WeatherSystem.getCurrentWeather();
  }

  // 备选：从全局天气数据获取
  if (typeof window !== "undefined" && window.CURRENT_WEATHER) {
    return window.CURRENT_WEATHER;
  }

  return {
    type: "clear",
    description: "晴朗",
    temperature: "20°C",
  };
};

/**
 * 场景变更时的联动处理（由SceneSystem调用）
 * @param {string} newLocationId - 新场景ID
 */
GroupChat.onSceneChanged = function (newLocationId) {
  if (!this.isActive) return;

  // 更新场景信息
  this.currentLocationId = newLocationId;
  this.cachedSceneInfo = this._fetchSceneInfo(newLocationId);

  // 重新构建系统提示词
  this._rebuildSystemPrompt();

  // 刷新UI
  this._renderSceneHeader();

  console.log(`[群像会话] 场景已变更至：${newLocationId}`);
};

/**
 * NPC离开场景时的联动处理（由NPCBehavior调用）
 * @param {string} npcId - 离开的NPC ID
 */
GroupChat.onNPCLeftScene = function (npcId) {
  if (!this.isActive) return;

  if (this.presentNPCs.includes(npcId)) {
    this.removeNPC(npcId);
  }
};

/**
 * NPC进入场景时的联动处理（由NPCBehavior调用）
 * @param {string} npcId - 进入的NPC ID
 */
GroupChat.onNPCEnteredScene = function (npcId) {
  if (!this.isActive) return;

  if (!this.presentNPCs.includes(npcId)) {
    this.addNPC(npcId);
  }
};

/**
 * 天气变更时的联动处理（由WeatherSystem调用）
 * @param {Object} weatherData - 新的天气数据
 */
GroupChat.onWeatherChanged = function (weatherData) {
  if (!this.isActive) return;

  this.cachedWeather = weatherData;

  // 重新构建系统提示词（天气信息会注入提示词）
  this._rebuildSystemPrompt();

  // 刷新UI
  this._renderSceneHeader();

  console.log("[群像会话] 天气信息已更新");
};

// ============================================================
// 本地存储
// ============================================================

/**
 * 保存当前会话到本地存储
 */
GroupChat._saveSession = function () {
  if (!this.sessionId) return;

  try {
    const sessionData = {
      sessionId: this.sessionId,
      locationId: this.currentLocationId,
      presentNPCs: [...this.presentNPCs],
      dialogueHistory: [...this.dialogueHistory],
      startTime: this.sessionStartTime,
      lastSaveTime: Date.now(),
      isActive: this.isActive,
    };

    // 读取现有存档
    let allSessions = {};
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        allSessions = JSON.parse(stored);
      }
    } catch (e) {
      console.warn("[群像会话] 读取存档失败，将创建新存档", e);
    }

    // 保存当前会话
    allSessions[this.sessionId] = sessionData;

    // 清理过期存档（保留最近20个）
    const sessionIds = Object.keys(allSessions);
    if (sessionIds.length > 20) {
      const sortedIds = sessionIds.sort((a, b) => {
        return (allSessions[b].lastSaveTime || 0) - (allSessions[a].lastSaveTime || 0);
      });
      const idsToRemove = sortedIds.slice(20);
      idsToRemove.forEach((id) => {
        delete allSessions[id];
      });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSessions));
  } catch (e) {
    console.error("[群像会话] 保存会话失败", e);
  }
};

/**
 * 加载指定会话
 * @param {string} sessionId - 会话ID
 * @returns {Object|null} 会话数据
 */
GroupChat.loadSession = function (sessionId) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const allSessions = JSON.parse(stored);
    return allSessions[sessionId] || null;
  } catch (e) {
    console.error("[群像会话] 加载会话失败", e);
    return null;
  }
};

/**
 * 获取所有存档的会话列表
 * @returns {Array} 会话列表
 */
GroupChat.getSavedSessions = function () {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const allSessions = JSON.parse(stored);
    return Object.values(allSessions).sort((a, b) => {
      return (b.lastSaveTime || 0) - (a.lastSaveTime || 0);
    });
  } catch (e) {
    console.error("[群像会话] 获取存档列表失败", e);
    return [];
  }
};

/**
 * 删除指定存档
 * @param {string} sessionId - 要删除的会话ID
 * @returns {boolean} 是否删除成功
 */
GroupChat.deleteSavedSession = function (sessionId) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;

    const allSessions = JSON.parse(stored);
    if (allSessions[sessionId]) {
      delete allSessions[sessionId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allSessions));
      return true;
    }
    return false;
  } catch (e) {
    console.error("[群像会话] 删除存档失败", e);
    return false;
  }
};

// ============================================================
// UI渲染
// ============================================================

/**
 * 渲染完整群像对话UI
 */
GroupChat._renderUI = function () {
  const container = this._getOrCreateContainer();

  container.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
<div id="group-chat-overlay" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #2C1810;
      z-index: 1000;
      display: flex;
      flex-direction: column;
    ">
      <!-- 顶部：场景背景与信息 -->
      <div id="gc-scene-header" style="
        position: relative;
        height: 25%;
        min-height: 160px;
        background-size: cover;
        background-position: center;
        flex-shrink: 0;
      ">
        <div style="
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px 20px;
          background: linear-gradient(to top, rgba(44,24,16,0.95), transparent);
          color: #F5E6D3;
        ">
          <div id="gc-scene-name" style="
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 4px;
          "></div>
          <div id="gc-scene-meta" style="
            font-size: 13px;
            opacity: 0.8;
          "></div>
        </div>
      </div>

      <!-- 中部：NPC头像横排 -->
      <div id="gc-npc-avatars" style="
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 16px;
        padding: 12px 20px;
        background-color: rgba(44,24,16,0.6);
        border-bottom: 1px solid rgba(201,162,39,0.3);
        flex-shrink: 0;
        overflow-x: auto;
      "></div>

      <!-- 群像控制栏 -->
      <div id="gc-control-bar" style="
        display: flex;
        justify-content: center;
        gap: 8px;
        padding: 8px 20px;
        background-color: rgba(44,24,16,0.8);
        border-bottom: 1px solid rgba(201,162,39,0.2);
        flex-shrink: 0;
      ">
        <button id="gc-btn-pause" onclick="GroupChat._onPauseClick()" style="
          padding: 6px 14px;
          background-color: transparent;
          border: 1px solid #C9A227;
          color: #C9A227;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        ">暂停</button>
        <button id="gc-btn-ff" onclick="GroupChat._onFastForwardClick()" style="
          padding: 6px 14px;
          background-color: transparent;
          border: 1px solid #C9A227;
          color: #C9A227;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        ">快进</button>
        <button id="gc-btn-add" onclick="GroupChat._onAddNPCClick()" style="
          padding: 6px 14px;
          background-color: transparent;
          border: 1px solid #C9A227;
          color: #C9A227;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        ">添加角色</button>
        <button id="gc-btn-leave" onclick="GroupChat._onLeaveClick()" style="
          padding: 6px 14px;
          background-color: #C9A227;
          border: none;
          color: #2C1810;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: bold;
        ">离开</button>
      </div>

      <!-- 底部：对话区 -->
      <div id="gc-dialogue-area" style="
        flex: 1;
        overflow-y: auto;
        padding: 16px 20px;
        background-color: rgba(245,230,211,0.05);
      "></div>

      <!-- 输入区 -->
      <div id="gc-input-area" style="
        display: flex;
        gap: 8px;
        padding: 12px 20px;
        background-color: rgba(44,24,16,0.9);
        border-top: 1px solid rgba(201,162,39,0.3);
        flex-shrink: 0;
      ">
        <input
          id="gc-player-input"
          type="text"
          placeholder="输入你想说的话..."
          onkeydown="GroupChat._onInputKeydown(event)"
          style="
            flex: 1;
            padding: 10px 14px;
            background-color: rgba(245,230,211,0.1);
            border: 1px solid rgba(201,162,39,0.4);
            border-radius: 6px;
            color: #F5E6D3;
            font-size: 14px;
            outline: none;
          "
        />
        <button onclick="GroupChat._onSendClick()" style="
          padding: 10px 20px;
          background-color: #C9A227;
          border: none;
          border-radius: 6px;
          color: #2C1810;
          font-weight: bold;
          cursor: pointer;
          font-size: 14px;
        ">发送</button>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  // 初始渲染各个区域
  this._renderSceneHeader();
  this._renderNPCAvatars();
  this._renderDialogue();
  this._updateControlButtonStates();
};

/**
 * 隐藏群像对话UI
 */
GroupChat._hideUI = function () {
  const container = document.getElementById("group-chat-root");
  if (container) {
    container.innerHTML = "";
    container.style.display = "none";
  }
};

/**
 * 渲染场景头部信息
 */
GroupChat._renderSceneHeader = function () {
  const header = document.getElementById("gc-scene-header");
  const nameEl = document.getElementById("gc-scene-name");
  const metaEl = document.getElementById("gc-scene-meta");

  if (!header || !nameEl || !metaEl) return;

  const scene = this.cachedSceneInfo || {};
  const weather = this.cachedWeather || {};

  // 设置背景图
  if (scene.backgroundImage) {
    header.style.backgroundImage = `url(${scene.backgroundImage})`;
  }

  // 设置场景名称
  nameEl.textContent = scene.name || this.currentLocationId || "未知地点";

  // 设置元信息（地点/时间/天气）
  const timeStr = this._formatTime(new Date());
  const weatherStr = weather.description || "未知天气";
  metaEl.textContent = `${this.currentLocationId || "未知地点"} · ${timeStr} · ${weatherStr}`;
};

/**
 * 渲染NPC头像横排
 */
GroupChat._renderNPCAvatars = function () {
  const container = document.getElementById("gc-npc-avatars");
  if (!container) return;

  container.innerHTML = this.presentNPCs
    .map((npcId) => {
      const detail = this._fetchNPCDetail(npcId);
      const isCurrentSpeaker = this.currentSpeakerId === npcId;

      return `
        <div
          class="gc-npc-avatar ${isCurrentSpeaker ? "gc-npc-active" : ""}"
          data-npc-id="${npcId}"
          onclick="GroupChat._onAvatarClick('${npcId}')"
          style="
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            padding: 6px;
            border-radius: 8px;
            transition: all 0.3s ease;
            ${isCurrentSpeaker ? "background-color: rgba(201,162,39,0.2);" : ""}
          "
          onmouseover="this.style.backgroundColor='rgba(201,162,39,0.15)';"
          onmouseout="this.style.backgroundColor='${isCurrentSpeaker ? "rgba(201,162,39,0.2)" : "transparent"}';"
        >
          <div style="
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background-color: ${isCurrentSpeaker ? "#C9A227" : "rgba(245,230,211,0.2)"};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            color: ${isCurrentSpeaker ? "#2C1810" : "#F5E6D3"};
            border: ${isCurrentSpeaker ? "2px solid #C9A227" : "2px solid transparent"};
            box-shadow: ${isCurrentSpeaker ? "0 0 12px rgba(201,162,39,0.6)" : "none"};
            transition: all 0.3s ease;
          ">
            ${detail.avatarEmoji || "👤"}
          </div>
          <span style="
            font-size: 11px;
            color: ${isCurrentSpeaker ? "#C9A227" : "#F5E6D3"};
            max-width: 60px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            transition: color 0.3s ease;
          ">${detail.name || npcId}</span>
        </div>
      `;
    })
    .join("");
};

/**
 * 渲染对话区
 */
GroupChat._renderDialogue = function () {
  const container = document.getElementById("gc-dialogue-area");
  if (!container) return;

  container.innerHTML = this.dialogueHistory
    .map((entry) => {
      if (entry.type === "player") {
        // 玩家发言 - 右对齐
        return `
          <div style="
            display: flex;
            justify-content: flex-end;
            margin-bottom: 12px;
          ">
            <div style="
              max-width: 70%;
              padding: 10px 14px;
              background-color: rgba(201,162,39,0.2);
              border: 1px solid rgba(201,162,39,0.4);
              border-radius: 12px 12px 2px 12px;
              color: #F5E6D3;
              font-size: 14px;
              line-height: 1.5;
            ">${this._escapeHtml(entry.content)}</div>
          </div>
        `;
      } else {
        // NPC发言 - 左对齐
        const detail = this._fetchNPCDetail(entry.npcId);
        return `
          <div style="
            display: flex;
            justify-content: flex-start;
            margin-bottom: 12px;
          ">
            <div style="
              max-width: 70%;
              padding: 10px 14px;
              background-color: rgba(245,230,211,0.08);
              border: 1px solid rgba(245,230,211,0.2);
              border-radius: 12px 12px 12px 2px;
              color: #F5E6D3;
              font-size: 14px;
              line-height: 1.5;
            ">
              <div style="
                font-size: 12px;
                color: #C9A227;
                margin-bottom: 4px;
                font-weight: bold;
              ">${this._escapeHtml(entry.npcName || detail.name || entry.npcId)}</div>
              <div>${this._escapeHtml(entry.content)}</div>
            </div>
          </div>
        `;
      }
    })
    .join("");

  // 滚动到底部
  container.scrollTop = container.scrollHeight;
};

/**
 * 更新控制按钮状态
 */
GroupChat._updateControlButtonStates = function () {
  const pauseBtn = document.getElementById("gc-btn-pause");
  const ffBtn = document.getElementById("gc-btn-ff");

  if (pauseBtn) {
    pauseBtn.textContent = this.isPaused ? "继续" : "暂停";
    pauseBtn.style.backgroundColor = this.isPaused ? "rgba(201,162,39,0.2)" : "transparent";
  }

  if (ffBtn) {
    ffBtn.textContent = this.isFastForward ? "正常" : "快进";
    ffBtn.style.backgroundColor = this.isFastForward ? "rgba(201,162,39,0.2)" : "transparent";
  }
};

/**
 * 清空玩家输入框
 */
GroupChat._clearPlayerInput = function () {
  const input = document.getElementById("gc-player-input");
  if (input) {
    input.value = "";
  }
};

// ============================================================
// UI事件处理
// ============================================================

/**
 * 点击暂停/继续按钮
 */
GroupChat._onPauseClick = function () {
  if (this.isPaused) {
    this.resume();
  } else {
    this.pause();
  }
};

/**
 * 点击快进按钮
 */
GroupChat._onFastForwardClick = function () {
  this.toggleFastForward();
};

/**
 * 点击添加角色按钮
 */
GroupChat._onAddNPCClick = function () {
  // TODO: 由用户实现角色选择界面
  // 示例：弹出选择面板，选择后调用 GroupChat.addNPC(npcId)
  console.log("[群像会话] 触发添加角色事件 - 等待用户实现选择界面");

  // 派发自定义事件，供外部监听
  const event = new CustomEvent("groupChat:addNPCRequested", {
    detail: { presentNPCs: [...this.presentNPCs] },
  });
  document.dispatchEvent(event);
};

/**
 * 点击离开按钮
 */
GroupChat._onLeaveClick = function () {
  if (confirm("确定要离开当前群像对话吗？")) {
    this.endSession();
  }
};

/**
 * 点击NPC头像
 * @param {string} npcId - 被点击的NPC ID
 */
GroupChat._onAvatarClick = function (npcId) {
  // TODO: 由用户实现头像点击交互
  // 示例：显示角色详情、触发与特定角色对话等
  console.log(`[群像会话] 点击NPC头像：${npcId}`);

  // 派发自定义事件，供外部监听
  const detail = this._fetchNPCDetail(npcId);
  const event = new CustomEvent("groupChat:npcAvatarClicked", {
    detail: { npcId, npcDetail: detail },
  });
  document.dispatchEvent(event);
};

/**
 * 输入框回车事件
 * @param {KeyboardEvent} event - 键盘事件
 */
GroupChat._onInputKeydown = function (event) {
  if (event.key === "Enter") {
    this._onSendClick();
  }
};

/**
 * 点击发送按钮
 */
GroupChat._onSendClick = function () {
  const input = document.getElementById("gc-player-input");
  if (!input) return;

  const text = input.value.trim();
  if (text) {
    this.playerSay(text);
  }
};

// ============================================================
// 自动推进调度
// ============================================================

/**
 * 设置下一回合的自动推进定时器
 */
GroupChat._scheduleNextTurn = function () {
  if (!this.isActive || this.isPaused) return;

  this._clearAutoAdvanceTimer();

  const interval = this.isFastForward ? this.fastForwardInterval : this.autoAdvanceInterval;

  this.autoAdvanceTimer = setTimeout(() => {
    this.nextTurn();
  }, interval);
};

/**
 * 清除自动推进定时器
 */
GroupChat._clearAutoAdvanceTimer = function () {
  if (this.autoAdvanceTimer) {
    clearTimeout(this.autoAdvanceTimer);
    this.autoAdvanceTimer = null;
  }
};

// ============================================================
// 工具方法
// ============================================================

/**
 * 获取或创建群像对话容器
 * @returns {HTMLElement} 容器元素
 */
GroupChat._getOrCreateContainer = function () {
  let container = document.getElementById("group-chat-root");
  if (!container) {
    container = document.createElement("div");
    container.id = "group-chat-root";
    container.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1000;";
    document.body.appendChild(container);
  }
  container.style.display = "block";
  return container;
};

/**
 * 生成会话唯一ID
 * @returns {string} 会话ID
 */
GroupChat._generateSessionId = function () {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `gc_${timestamp}_${random}`;
};

/**
 * 格式化时间显示
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的时间字符串
 */
GroupChat._formatTime = function (date) {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

/**
 * HTML转义，防止XSS
 * @param {string} text - 原始文本
 * @returns {string} 转义后的文本
 */
GroupChat._escapeHtml = function (text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

// ============================================================
// 初始化入口
// ============================================================

/**
 * 模块初始化
 */
GroupChat.init = function () {
  console.log("[群像会话] 群像对话系统已初始化");
  console.log("[群像会话] 可用方法：startSession, addNPC, removeNPC, nextTurn, playerSay, endSession, pause, resume, toggleFastForward");
};

// 自动初始化
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => GroupChat.init());
  } else {
    GroupChat.init();
  }
}

// 兼容模块导出
if (typeof module !== "undefined" && module.exports) {
  module.exports = { GroupChat };
}
