/**
 * =========================================================
 * LetterSystem v12 — 书信/飞鸽传书系统
 * 模块名：LetterSystem
 * 功能：信件管理、NPC主动发信、收件箱、写信、飞鸽动画
 * 存储键：letter_system_v12
 * 配色：古风墨境 — 背景 #F5E6D3，金色 #C9A227，墨色 #2C1810
 * =========================================================
 */
const LetterSystem = {
  /* ========== 默认信件类型（用户可增删改） ========== */
  DEFAULT_TYPES: [
    { id: 'private',  name: '私信',   icon: '✉️',  color: '#4A90C2', desc: '私人往来信件' },
    { id: 'official', name: '公文',   icon: '📜',  color: '#8B4513', desc: '公务文书' },
    { id: 'love',     name: '情书',   icon: '💌',  color: '#E91E63', desc: '情意绵绵' },
    { id: 'challenge',name: '挑战书', icon: '⚔️',  color: '#B22222', desc: '战书邀约' },
    { id: 'invite',   name: '邀请函', icon: '🎴',  color: '#6B8E23', desc: '宴请邀约' },
    { id: 'sos',      name: '求救信', icon: '🆘',  color: '#DC143C', desc: '十万火急' },
    { id: 'thanks',   name: '感谢信', icon: '🙏',  color: '#C9A227', desc: '感恩致谢' }
  ],

  /* ========== 紧急程度定义 ========== */
  URGENCY_LEVELS: [
    { id: 'normal',  name: '普通', color: '#6B8E23', icon: '○' },
    { id: 'urgent',  name: '紧急', color: '#C9A227', icon: '◐' },
    { id: 'critical',name: '十万火急', color: '#DC143C', icon: '●' }
  ],

  /* ========== 状态变量 ========== */
  _currentFolder: 'inbox',     // inbox | sent | trash
  _selectedLetterId: null,     // 当前选中信件ID
  _filterType: 'all',          // 类型筛选
  _filterSender: 'all',        // 发件人筛选
  _filterRead: 'all',          // read | unread | all
  _filterUrgency: 'all',       // 紧急程度筛选
  _composeTarget: null,        // 写信目标NPC
  _composeReplyTo: null,       // 回复哪封信

  /* ========== 初始化 ========== */
  init() { this.renderPage(); },
  onEnter() { this.renderLetterInterface(); },

  /* ========== 数据存取核心方法 ========== */
  /**
   * 获取完整数据对象
   * 结构：{ letters: [], types: [], rules: [], settings: {} }
   */
  getData() {
    const raw = Storage.get('letter_system_v12', null);
    if (!raw) {
      const initial = {
        letters: [],
        types: JSON.parse(JSON.stringify(this.DEFAULT_TYPES)),
        rules: [],
        settings: {
          baseSpeed: 10,           // 基础送信速度（单位距离/小时）
          enablePigeonAnim: true,  // 是否启用飞鸽动画
          enableSound: true        // 是否启用提示音
        }
      };
      Storage.set('letter_system_v12', initial);
      return initial;
    }
    // 确保字段完整
    if (!raw.types) raw.types = JSON.parse(JSON.stringify(this.DEFAULT_TYPES));
    if (!raw.rules) raw.rules = [];
    if (!raw.settings) raw.settings = { baseSpeed: 10, enablePigeonAnim: true, enableSound: true };
    return raw;
  },

  /** 保存完整数据 */
  saveData(data) {
    Storage.set('letter_system_v12', data);
  },

  /** 获取信件列表 */
  getLetters() { return this.getData().letters || []; },

  /** 获取信件类型列表 */
  getTypes() { return this.getData().types || []; },

  /** 获取NPC发信规则 */
  getRules() { return this.getData().rules || []; },

  /** 获取设置 */
  getSettings() { return this.getData().settings || {}; },

  /* ========== 信件类型管理（用户自定义） ========== */

  /**
   * 添加自定义信件类型
   * @param {Object} type - { name, icon, color, desc }
   */
  addLetterType(type) {
    const data = this.getData();
    const newType = {
      id: 'type_' + Date.now(),
      name: type.name || '未命名',
      icon: type.icon || '📄',
      color: type.color || '#4A90C2',
      desc: type.desc || ''
    };
    data.types.push(newType);
    this.saveData(data);
    App.toast(`已添加信件类型「${newType.name}」`, 'success');
    return newType.id;
  },

  /**
   * 删除信件类型
   * @param {string} typeId
   */
  removeLetterType(typeId) {
    const data = this.getData();
    const type = data.types.find(t => t.id === typeId);
    if (!type) return;
    if (!confirm(`删除信件类型「${type.name}」？使用该类型的信件将变为「私信」类型。`)) return;
    // 将该类型的信件改为默认类型
    data.letters.forEach(l => {
      if (l.type === typeId) l.type = 'private';
    });
    data.types = data.types.filter(t => t.id !== typeId);
    this.saveData(data);
    App.toast(`已删除信件类型「${type.name}」`, 'info');
    this.renderLetterInterface();
  },

  /**
   * 重命名信件类型
   * @param {string} typeId
   * @param {string} newName
   */
  renameLetterType(typeId, newName) {
    const data = this.getData();
    const type = data.types.find(t => t.id === typeId);
    if (type && newName) {
      type.name = newName;
      this.saveData(data);
      App.toast(`已重命名为「${newName}」`, 'success');
      this.renderLetterInterface();
    }
  },

  /* ========== NPC主动发信规则配置 ========== */

  /**
   * 配置NPC发信规则
   * @param {Object} rule - { npcId, minAffection, probability, letterTypes, delayMode, delayValue, contentTemplate, triggerEvents }
   */
  configureNPCRule(rule) {
    const data = this.getData();
    const newRule = {
      id: rule.id || 'rule_' + Date.now(),
      npcId: rule.npcId,                     // NPC ID
      minAffection: rule.minAffection || 0,  // 最低好感度
      maxAffection: rule.maxAffection || 100,// 最高好感度
      probability: rule.probability || 0.3,  // 触发概率 0-1
      letterTypes: rule.letterTypes || ['private'], // 可发送的信件类型
      delayMode: rule.delayMode || 'distance', // distance | fixed
      delayValue: rule.delayValue || 1,      // 固定延迟小时数 / 距离系数
      contentTemplate: rule.contentTemplate || '', // 内容模板提示词
      triggerEvents: rule.triggerEvents || ['affection_change'], // 触发事件
      cooldown: rule.cooldown || 24,         // 冷却时间（小时）
      lastSent: rule.lastSent || 0,          // 上次发送时间
      enabled: rule.enabled !== false        // 是否启用
    };
    const existingIdx = data.rules.findIndex(r => r.id === newRule.id);
    if (existingIdx >= 0) {
      data.rules[existingIdx] = newRule;
    } else {
      data.rules.push(newRule);
    }
    this.saveData(data);
    return newRule.id;
  },

  /**
   * 删除NPC发信规则
   * @param {string} ruleId
   */
  removeNPCRule(ruleId) {
    const data = this.getData();
    data.rules = data.rules.filter(r => r.id !== ruleId);
    this.saveData(data);
    App.toast('已删除发信规则', 'info');
  },

  /**
   * 检查并触发NPC发信
   * 由外部事件系统调用，如好感度变化、剧情节点等
   * @param {string} eventType - 事件类型
   * @param {Object} context - 上下文 { npcId, affection, locationId, sceneId }
   */
  checkNPCLetterTriggers(eventType, context) {
    const data = this.getData();
    const now = Date.now();
    const rules = data.rules.filter(r =>
      r.enabled &&
      r.triggerEvents.includes(eventType) &&
      r.npcId === context.npcId
    );

    for (const rule of rules) {
      // 检查冷却
      const hoursSinceLast = (now - rule.lastSent) / (1000 * 60 * 60);
      if (hoursSinceLast < rule.cooldown) continue;

      // 检查好感度范围
      const affection = context.affection || 50;
      if (affection < rule.minAffection || affection > rule.maxAffection) continue;

      // 概率判定
      if (Math.random() > rule.probability) continue;

      // 触发发信
      this._triggerNPCSend(rule, context);
      rule.lastSent = now;
    }

    this.saveData(data);
  },

  /**
   * 内部：NPC执行发信
   * @param {Object} rule
   * @param {Object} context
   */
  _triggerNPCSend(rule, context) {
    const npc = this._getNPCById(rule.npcId);
    const npcName = npc ? npc.name : '神秘人';
    const npcLocation = npc ? (npc.address || npc.locationId || '未知') : '未知';

    // 随机选择信件类型
    const typeId = rule.letterTypes[Math.floor(Math.random() * rule.letterTypes.length)];
    const type = this.getTypes().find(t => t.id === typeId) || this.DEFAULT_TYPES[0];

    // 计算到达时间
    const arrivalTime = this.calculateArrivalTime(
      npcLocation,
      'player',
      rule.delayMode,
      rule.delayValue
    );

    // 生成信件内容（优先使用模板，否则AI生成占位）
    let content = rule.contentTemplate;
    if (!content && npc) {
      content = this._generateNPCLetterContent(npc, type, context);
    }

    const letter = {
      id: 'letter_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      fromNpcId: rule.npcId,
      fromName: npcName,
      toPlayer: true,
      subject: this._generateSubject(npcName, type),
      content: content || '（这封信的内容似乎被风沙侵蚀了……）',
      type: typeId,
      urgency: 'normal',
      sendTime: Date.now(),
      arriveTime: arrivalTime,
      isRead: false,
      replyToId: null,
      locationId: npcLocation,
      attachments: [],
      folder: 'inbox'
    };

    this._addLetter(letter);

    // 飞鸽通知
    if (this.getSettings().enablePigeonAnim) {
      this.showPigeonAnimation(npcName, type.name);
    }

    App.toast(`🕊️ ${npcName} 寄来一封${type.name}`, 'success');

    // 广播事件
    if (window.EventBridge) {
      EventBridge.emit('letter', 'npc_letter_sent', {
        letterId: letter.id,
        npcId: rule.npcId,
        type: typeId,
        arrivalDelay: arrivalTime - Date.now()
      }, 'LetterSystem');
    }
  },

  /**
   * 生成NPC信件内容（基于性格和情境）
   * @param {Object} npc
   * @param {Object} type
   * @param {Object} context
   */
  _generateNPCLetterContent(npc, type, context) {
    const templates = {
      private: [
        '近日诸事繁杂，偶得闲暇，提笔写信与你。不知你近况如何？',
        '昨夜梦见与你同游长安，醒来犹记梦中情景，故写信一问。',
        '听闻你近日行踪不定，我心甚念，特修书一封以表关切。'
      ],
      love: [
        '月色如水，念你如昔。不知你是否也在同一片月光下？',
        '自从那日分别，心中始终放不下你。愿君安好，我便安心。',
        '见字如面，思卿如狂。千言万语，不及一句：我想你。'
      ],
      official: [
        '奉上级之命，特致书函，请于三日内至衙门一叙。',
        '公务紧急，请速来商议要事，切勿延误。',
        '兹有公文一纸，请查收并依示办理。'
      ],
      thanks: [
        '前日承蒙相助，此恩没齿难忘，特修书致谢。',
        '若非你出手相救，我恐怕已身陷囹圄。大恩不言谢，日后必当厚报。',
        '你赠我之物，我已珍藏。这份心意，比千金更重。'
      ],
      sos: [
        '十万火急！我现被困于某地，请你速来相救！',
        '大事不妙！此处发生变故，我性命堪忧，求你速援！',
        '情况危急，来不及细说。若你看到此信，请务必赶来！'
      ],
      challenge: [
        '久闻你武艺高强，特下战书一封，三日后午时，城外一战！',
        '我不服你！敢不敢与我一较高下？',
        '有人说你棋艺天下第一，我不信，特来挑战！'
      ],
      invite: [
        '下月初三，我在府上设宴，恭请大驾光临。',
        '恰逢佳节，欲邀你共赏灯河，不知可否赏脸？',
        '我有珍藏好酒一坛，特请你来品鉴。不见不散。'
      ]
    };

    const typeTemplates = templates[type.id] || templates.private;
    let content = typeTemplates[Math.floor(Math.random() * typeTemplates.length)];

    // 根据NPC性格调整
    if (npc.temperament) {
      if (npc.temperament.includes('冷')) content = content.replace(/。/g, '。').replace(/！/g, '。');
      if (npc.temperament.includes('热')) content = content.replace(/。/g, '！');
    }

    // 根据好感度调整结尾
    const affection = context.affection || 50;
    if (affection > 80) {
      content += '\n\n——日夜思君，望早日相见。';
    } else if (affection > 50) {
      content += '\n\n——盼复。';
    } else {
      content += '\n\n——此致敬礼。';
    }

    // 署名
    content += `\n\n${npc.name} 敬上`;

    return content;
  },

  /**
   * 生成信件主题
   * @param {string} npcName
   * @param {Object} type
   */
  _generateSubject(npcName, type) {
    const subjects = {
      private: ['闲来一叙', '近况如何', '念君安好'],
      love: ['相思无用', '月色与卿', '心中所念'],
      official: ['公务函', '紧急文书', '请阅'],
      thanks: ['谢恩书', '感恩不尽', '承蒙关照'],
      sos: ['【急】求救！', '十万火急', '速来救援'],
      challenge: ['战书', '挑战', '一较高下'],
      invite: ['邀君一聚', '宴会请帖', '把酒言欢']
    };
    const list = subjects[type.id] || subjects.private;
    return list[Math.floor(Math.random() * list.length)];
  },

  /**
   * 获取NPC信息
   * @param {string} npcId
   */
  _getNPCById(npcId) {
    if (window.NPCManager && NPCManager.getNPCs) {
      return NPCManager.getNPCs().find(n => n.id === npcId);
    }
    return null;
  },

  /* ========== 距离与到达时间计算 ========== */

  /**
   * 计算两地之间的距离
   * 优先使用地图坐标，否则返回默认值
   * @param {string} fromLoc - 发信地点ID或名称
   * @param {string} toLoc - 收信地点ID或名称
   * @returns {number} 距离单位
   */
  calculateDistance(fromLoc, toLoc) {
    // 尝试从地图系统获取坐标
    let fromCoords = null;
    let toCoords = null;

    if (window.MapSystem && MapSystem.getMaps) {
      const maps = MapSystem.getMaps();
      for (const map of maps) {
        if (map.markers) {
          for (const marker of map.markers) {
            if (marker.name === fromLoc || marker.id === fromLoc) {
              fromCoords = { x: marker.x, y: marker.y };
            }
            if (marker.name === toLoc || marker.id === toLoc) {
              toCoords = { x: marker.x, y: marker.y };
            }
          }
        }
      }
    }

    if (fromCoords && toCoords) {
      // 欧几里得距离
      const dx = fromCoords.x - toCoords.x;
      const dy = fromCoords.y - toCoords.y;
      return Math.sqrt(dx * dx + dy * dy);
    }

    // 默认返回中等距离
    return 50;
  },

  /**
   * 计算信件到达时间
   * @param {string} fromLoc
   * @param {string} toLoc
   * @param {string} mode - distance | fixed
   * @param {number} value
   * @returns {number} 到达时间戳
   */
  calculateArrivalTime(fromLoc, toLoc, mode, value) {
    const now = Date.now();
    const settings = this.getSettings();

    if (mode === 'fixed') {
      // 固定延迟（小时）
      return now + (value * 60 * 60 * 1000);
    } else {
      // 按距离计算
      const distance = this.calculateDistance(fromLoc, toLoc);
      const speed = settings.baseSpeed || 10; // 单位/小时
      const hours = distance / speed;
      // 加上随机波动 ±20%
      const variance = 0.8 + Math.random() * 0.4;
      return now + (hours * 60 * 60 * 1000 * variance);
    }
  },

  /* ========== 信件CRUD操作 ========== */

  /**
   * 创建信件（内部方法）
   * @param {Object} letter
   */
  _addLetter(letter) {
    const data = this.getData();
    data.letters.push(letter);
    this.saveData(data);
    // 如果当前在收件箱界面，刷新列表
    if (this._currentFolder === letter.folder) {
      this.renderLetterList();
    }
    return letter.id;
  },

  /**
   * 玩家发送信件给NPC
   * @param {string} npcId
   * @param {string} subject
   * @param {string} content
   * @param {string} typeId
   * @param {Array} attachments - 附带物品ID列表
   */
  sendLetterToNPC(npcId, subject, content, typeId, attachments) {
    const npc = this._getNPCById(npcId);
    const npcName = npc ? npc.name : '未知角色';
    const playerName = Storage.get('playerName', '玩家');

    const letter = {
      id: 'letter_' + Date.now(),
      fromNpcId: null,
      fromName: playerName,
      toPlayer: false,
      toNpcId: npcId,
      toNpcName: npcName,
      subject: subject || '无主题',
      content: content || '',
      type: typeId || 'private',
      urgency: 'normal',
      sendTime: Date.now(),
      arriveTime: Date.now(), // 玩家发的信立即到达NPC（玩家视角）
      isRead: true,
      replyToId: this._composeReplyTo,
      locationId: 'player',
      attachments: attachments || [],
      folder: 'sent'
    };

    this._addLetter(letter);

    // 清空写信状态
    this._composeTarget = null;
    this._composeReplyTo = null;

    App.toast(`信件已发送给 ${npcName}`, 'success');

    // 广播事件
    if (window.EventBridge) {
      EventBridge.emit('letter', 'player_letter_sent', {
        letterId: letter.id,
        npcId: npcId,
        type: typeId
      }, 'LetterSystem');
    }

    return letter.id;
  },

  /**
   * 删除信件
   * @param {string} letterId
   */
  deleteLetter(letterId) {
    if (!confirm('确定要删除这封信吗？')) return;
    const data = this.getData();
    data.letters = data.letters.filter(l => l.id !== letterId);
    this.saveData(data);
    if (this._selectedLetterId === letterId) {
      this._selectedLetterId = null;
    }
    App.toast('信件已删除', 'info');
    this.renderLetterInterface();
  },

  /**
   * 标记信件为已读/未读
   * @param {string} letterId
   * @param {boolean} isRead
   */
  markAsRead(letterId, isRead) {
    const data = this.getData();
    const letter = data.letters.find(l => l.id === letterId);
    if (letter) {
      letter.isRead = isRead;
      this.saveData(data);
      this.renderLetterList();
      if (this._selectedLetterId === letterId) {
        this.renderLetterDetail(letterId);
      }
    }
  },

  /**
   * 回复信件
   * @param {string} originalLetterId
   */
  replyToLetter(originalLetterId) {
    const data = this.getData();
    const original = data.letters.find(l => l.id === originalLetterId);
    if (!original) return;

    if (original.toPlayer) {
      // 原信是NPC发给玩家的，回复给该NPC
      this._composeTarget = original.fromNpcId;
      this._composeReplyTo = originalLetterId;
      this.renderCompose();
    } else {
      // 原信是玩家发出的，不允许回复自己
      App.toast('这是你自己发出的信件', 'warning');
    }
  },

  /* ========== 飞鸽传书动画 ========== */

  /**
   * 显示飞鸽传书动画
   * @param {string} senderName
   * @param {string} letterType
   */
  showPigeonAnimation(senderName, letterType) {
    // 创建飞鸽容器
    let pigeonContainer = document.getElementById('pigeonAnimContainer');
    if (!pigeonContainer) {
      pigeonContainer = document.createElement('div');
      pigeonContainer.id = 'pigeonAnimContainer';
      pigeonContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 80px;
        pointer-events: none;
        z-index: 9999;
        overflow: hidden;
      `;
      document.body.appendChild(pigeonContainer);
    }

    // 创建飞鸽元素
    const pigeon = document.createElement('div');
    pigeon.innerHTML = '🕊️';
    pigeon.style.cssText = `
      position: absolute;
      top: 20px;
      left: -60px;
      font-size: 40px;
      animation: pigeonFly 4s ease-in-out forwards;
      filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.2));
    `;

    // 添加信件标签
    const label = document.createElement('div');
    label.textContent = `${senderName} · ${letterType}`;
    label.style.cssText = `
      position: absolute;
      top: 55px;
      left: -100px;
      font-size: 12px;
      color: #C9A227;
      background: rgba(44, 24, 16, 0.85);
      padding: 2px 8px;
      border-radius: 4px;
      white-space: nowrap;
      animation: pigeonLabelFly 4s ease-in-out forwards;
      font-family: 'Noto Serif SC', serif;
    `;

    pigeonContainer.appendChild(pigeon);
    pigeonContainer.appendChild(label);

    // 动画结束后清理
    setTimeout(() => {
      if (pigeon.parentNode) pigeon.parentNode.removeChild(pigeon);
      if (label.parentNode) label.parentNode.removeChild(label);
    }, 4000);

    // 显示通知
    this._showLetterNotification(senderName, letterType);
  },

  /**
   * 显示信件到达通知
   * @param {string} senderName
   * @param {string} letterType
   */
  _showLetterNotification(senderName, letterType) {
    const notif = document.createElement('div');
    notif.style.cssText = `
      position: fixed;
      top: 80px;
      right: -300px;
      background: linear-gradient(135deg, #F5E6D3 0%, #E8D4B8 100%);
      border: 2px solid #C9A227;
      border-radius: 8px;
      padding: 12px 16px;
      min-width: 240px;
      box-shadow: 0 4px 16px rgba(44, 24, 16, 0.3);
      z-index: 9998;
      animation: letterNotifSlideIn 0.5s ease-out forwards, letterNotifSlideOut 0.5s ease-in 4s forwards;
      font-family: 'Noto Serif SC', serif;
    `;
    notif.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:28px;">🕊️</span>
        <div>
          <div style="font-size:14px;font-weight:600;color:#2C1810;">有信件送达</div>
          <div style="font-size:12px;color:#8B7355;margin-top:2px;">${senderName} 寄来一封${letterType}</div>
        </div>
      </div>
    `;

    // 添加动画样式（如果不存在）
    this._ensurePigeonStyles();

    document.body.appendChild(notif);
    setTimeout(() => {
      if (notif.parentNode) notif.parentNode.removeChild(notif);
    }, 5000);
  },

  /**
   * 确保飞鸽动画CSS样式存在
   */
  _ensurePigeonStyles() {
    if (document.getElementById('pigeonAnimStyles')) return;
    const style = document.createElement('style');
    style.id = 'pigeonAnimStyles';
    style.textContent = `
      @keyframes pigeonFly {
        0% { left: -60px; transform: translateY(0) rotate(0deg); }
        15% { transform: translateY(-5px) rotate(-5deg); }
        30% { transform: translateY(3px) rotate(3deg); }
        45% { transform: translateY(-3px) rotate(-2deg); }
        60% { transform: translateY(2px) rotate(1deg); }
        75% { transform: translateY(-2px) rotate(-1deg); }
        100% { left: calc(100% + 60px); transform: translateY(0) rotate(0deg); }
      }
      @keyframes pigeonLabelFly {
        0% { left: -100px; opacity: 0; }
        10% { opacity: 1; }
        100% { left: calc(100% + 20px); opacity: 0; }
      }
      @keyframes letterNotifSlideIn {
        0% { right: -300px; opacity: 0; }
        100% { right: 20px; opacity: 1; }
      }
      @keyframes letterNotifSlideOut {
        0% { right: 20px; opacity: 1; }
        100% { right: -300px; opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  },

  /* ========== AI辅助润色 ========== */

  /**
   * AI辅助润色信件内容
   * @param {string} rawContent
   * @param {string} tone - 语气风格
   * @returns {string} 润色后的内容
   */
  aiPolishLetter(rawContent, tone) {
    if (!rawContent) return '';

    // 古风开场白库
    const openings = {
      formal: ['敬启者：', '见字如晤：', '顿首再拜：'],
      warm: ['展信安：', '卿卿如晤：', '吾爱：'],
      casual: ['嗨：', '近来可好：', '又见面了：'],
      urgent: ['【急】', '十万火急：', '刻不容缓：']
    };

    // 古风结尾库
    const closings = {
      formal: ['此致敬礼。', '顺颂时祺。', '谨上。'],
      warm: ['日夜思君，盼早日相见。', '纸短情长，伏惟珍重。', '愿君安好，我便安心。'],
      casual: ['改日再叙。', '后会有期。', '有空回信。'],
      urgent: ['速来相救！', '十万火急，切勿延误！', '盼速回复！']
    };

    const t = tone || 'formal';
    const opening = openings[t][Math.floor(Math.random() * openings[t].length)];
    const closing = closings[t][Math.floor(Math.random() * closings[t].length)];

    // 简单润色：添加古风词汇替换
    let polished = rawContent;
    const replacements = {
      '你好': '别来无恙',
      '好吗': '一切可好',
      '谢谢': '感激不尽',
      '再见': '后会有期',
      '想你了': '甚是想念',
      '对不起': '多有得罪',
      '没问题': '无妨',
      '明白了': '了然于胸',
      '不知道': '不得而知',
      '快点': '速速',
      '帮忙': '相助',
      '喜欢': '倾心',
      '讨厌': '厌恶',
      '开心': '欣喜',
      '难过': '黯然',
      '生气': '愤然',
      '害怕': '惶恐'
    };

    Object.entries(replacements).forEach(([modern, classical]) => {
      polished = polished.split(modern).join(classical);
    });

    return `${opening}\n\n${polished}\n\n${closing}`;
  },

  /* ========== 背包联动 ========== */

  /**
   * 获取可附带的物品列表
   * @returns {Array}
   */
  getAttachableItems() {
    if (window.InventorySystem && InventorySystem.getItems) {
      return InventorySystem.getItems();
    }
    return [];
  },

  /**
   * 附带物品到信件
   * @param {string} letterId
   * @param {string} itemId
   */
  attachItem(letterId, itemId) {
    const data = this.getData();
    const letter = data.letters.find(l => l.id === letterId);
    if (!letter) return;

    const items = this.getAttachableItems();
    const item = items.find(i => i.id === itemId);
    if (!item) {
      App.toast('物品不存在', 'error');
      return;
    }

    if (!letter.attachments) letter.attachments = [];
    letter.attachments.push({
      itemId: itemId,
      name: item.name,
      icon: item.icon,
      quantity: 1
    });

    this.saveData(data);
    App.toast(`已将「${item.name}」附在信中`, 'success');
  },

  /**
   * 从信件中移除附带物品
   * @param {string} letterId
   * @param {string} itemId
   */
  detachItem(letterId, itemId) {
    const data = this.getData();
    const letter = data.letters.find(l => l.id === letterId);
    if (!letter || !letter.attachments) return;

    letter.attachments = letter.attachments.filter(a => a.itemId !== itemId);
    this.saveData(data);
    this.renderLetterDetail(letterId);
  },

  /* ========== 信件筛选 ========== */

  /**
   * 获取筛选后的信件列表
   */
  getFilteredLetters() {
    let letters = this.getLetters().filter(l => l.folder === this._currentFolder);

    if (this._filterType !== 'all') {
      letters = letters.filter(l => l.type === this._filterType);
    }

    if (this._filterSender !== 'all') {
      letters = letters.filter(l =>
        (l.fromNpcId === this._filterSender) || (l.toNpcId === this._filterSender)
      );
    }

    if (this._filterRead !== 'all') {
      letters = letters.filter(l =>
        this._filterRead === 'read' ? l.isRead : !l.isRead
      );
    }

    if (this._filterUrgency !== 'all') {
      letters = letters.filter(l => l.urgency === this._filterUrgency);
    }

    // 按到达时间倒序，未读优先
    letters.sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      return (b.arriveTime || b.sendTime) - (a.arriveTime || a.sendTime);
    });

    return letters;
  },

  /**
   * 设置筛选条件
   */
  setFilter(key, value) {
    this['_' + key] = value;
    this.renderLetterList();
  },

  /* ========== 界面渲染 ========== */

  /** 渲染页面容器 */
  renderPage() {
    const page = document.getElementById('page-letter');
    if (!page) return;
    page.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
      <div id="letterInterface" style="height:100%;"></div>`;
    this.renderLetterInterface();
  },

  /** 渲染书信界面主框架 */
  renderLetterInterface() {
    const container = document.getElementById('letterInterface');
    if (!container) return;

    container.innerHTML = `
      <div style="display:flex;height:100%;gap:0;">
        <!-- 左侧：文件夹 + 信件列表 -->
        <div style="width:320px;display:flex;flex-direction:column;border-right:1px solid #D4C4A8;background:linear-gradient(180deg, #FAF0E0 0%, #F5E6D3 100%);flex-shrink:0;">
          <!-- 顶部操作栏 -->
          <div style="padding:12px;border-bottom:1px solid #D4C4A8;background:rgba(201,162,39,0.08);">
            <button class="btn btn-primary" style="width:100%;font-size:14px;" onclick="LetterSystem.renderCompose()">
              ✍️ 提笔写信
            </button>
          </div>
          <!-- 文件夹切换 -->
          <div style="display:flex;border-bottom:1px solid #D4C4A8;" id="letterFolderTabs"></div>
          <!-- 筛选器 -->
          <div style="padding:8px 12px;border-bottom:1px solid #D4C4A8;background:rgba(44,24,16,0.03);" id="letterFilters"></div>
          <!-- 信件列表 -->
          <div style="flex:1;overflow-y:auto;" id="letterList"></div>
        </div>

        <!-- 右侧：信件阅读区 -->
        <div style="flex:1;display:flex;flex-direction:column;background:#FDF6EC;" id="letterReadingArea"></div>
      </div>
    `;

    this.renderFolderTabs();
    this.renderFilters();
    this.renderLetterList();
    this.renderLetterDetail(this._selectedLetterId);
  },

  /** 渲染文件夹标签 */
  renderFolderTabs() {
    const c = document.getElementById('letterFolderTabs');
    if (!c) return;

    const folders = [
      { id: 'inbox', name: '📥 收件箱', icon: '📥' },
      { id: 'sent', name: '📤 发件箱', icon: '📤' },
      { id: 'trash', name: '🗑️ 已删除', icon: '🗑️' }
    ];

    const unreadCount = this.getLetters().filter(l => l.folder === 'inbox' && !l.isRead).length;

    c.innerHTML = folders.map(f => {
      const isActive = this._currentFolder === f.id;
      const count = f.id === 'inbox' && unreadCount > 0
        ? `<span style="background:#DC143C;color:#fff;padding:1px 5px;border-radius:8px;font-size:10px;margin-left:4px;">${unreadCount}</span>`
        : '';
      return `
        <div onclick="LetterSystem.switchFolder('${f.id}')"
             style="flex:1;padding:10px;text-align:center;cursor:pointer;font-size:13px;
                    ${isActive ? 'background:rgba(201,162,39,0.15);border-bottom:2px solid #C9A227;color:#2C1810;font-weight:600;' : 'color:#8B7355;border-bottom:2px solid transparent;'}">
          ${f.name}${count}
        </div>
      `;
    }).join('');
  },

  /** 渲染筛选器 */
  renderFilters() {
    const c = document.getElementById('letterFilters');
    if (!c) return;

    const types = this.getTypes();
    const npcs = this._getAllNPCs();

    c.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:6px;">
        <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center;">
          <span style="font-size:11px;color:#8B7355;white-space:nowrap;">类型：</span>
          <select onchange="LetterSystem.setFilter('filterType', this.value)"
                  style="font-size:11px;padding:2px 4px;border-radius:4px;border:1px solid #D4C4A8;background:#FDF6EC;color:#2C1810;cursor:pointer;">
            <option value="all" ${this._filterType === 'all' ? 'selected' : ''}>全部</option>
            ${types.map(t => `<option value="${t.id}" ${this._filterType === t.id ? 'selected' : ''}>${t.icon} ${t.name}</option>`).join('')}
          </select>
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center;">
          <span style="font-size:11px;color:#8B7355;white-space:nowrap;">发件人：</span>
          <select onchange="LetterSystem.setFilter('filterSender', this.value)"
                  style="font-size:11px;padding:2px 4px;border-radius:4px;border:1px solid #D4C4A8;background:#FDF6EC;color:#2C1810;cursor:pointer;">
            <option value="all" ${this._filterSender === 'all' ? 'selected' : ''}>全部</option>
            ${npcs.map(n => `<option value="${n.id}" ${this._filterSender === n.id ? 'selected' : ''}>${n.name}</option>`).join('')}
          </select>
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center;">
          <span style="font-size:11px;color:#8B7355;white-space:nowrap;">状态：</span>
          <select onchange="LetterSystem.setFilter('filterRead', this.value)"
                  style="font-size:11px;padding:2px 4px;border-radius:4px;border:1px solid #D4C4A8;background:#FDF6EC;color:#2C1810;cursor:pointer;">
            <option value="all" ${this._filterRead === 'all' ? 'selected' : ''}>全部</option>
            <option value="unread" ${this._filterRead === 'unread' ? 'selected' : ''}>未读</option>
            <option value="read" ${this._filterRead === 'read' ? 'selected' : ''}>已读</option>
          </select>
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center;">
          <span style="font-size:11px;color:#8B7355;white-space:nowrap;">紧急：</span>
          <select onchange="LetterSystem.setFilter('filterUrgency', this.value)"
                  style="font-size:11px;padding:2px 4px;border-radius:4px;border:1px solid #D4C4A8;background:#FDF6EC;color:#2C1810;cursor:pointer;">
            <option value="all" ${this._filterUrgency === 'all' ? 'selected' : ''}>全部</option>
            ${this.URGENCY_LEVELS.map(u => `<option value="${u.id}" ${this._filterUrgency === u.id ? 'selected' : ''}>${u.icon} ${u.name}</option>`).join('')}
          </select>
        </div>
      </div>
    `;
  },

  /** 获取所有NPC列表 */
  _getAllNPCs() {
    if (window.NPCManager && NPCManager.getNPCs) {
      return NPCManager.getNPCs();
    }
    return [];
  },

  /** 渲染信件列表 */
  renderLetterList() {
    const c = document.getElementById('letterList');
    if (!c) return;

    const letters = this.getFilteredLetters();
    const types = this.getTypes();

    if (letters.length === 0) {
      c.innerHTML = `
        <div style="padding:40px 20px;text-align:center;color:#A08B6D;">
          <div style="font-size:48px;margin-bottom:12px;opacity:0.6;">📭</div>
          <p style="font-size:14px;">此处空空如也</p>
          <p style="font-size:12px;color:#B8A88A;margin-top:4px;">暂无符合条件的信件</p>
        </div>
      `;
      return;
    }

    c.innerHTML = letters.map(l => {
      const type = types.find(t => t.id === l.type) || this.DEFAULT_TYPES[0];
      const urgency = this.URGENCY_LEVELS.find(u => u.id === l.urgency) || this.URGENCY_LEVELS[0];
      const isSelected = this._selectedLetterId === l.id;
      const isUnread = !l.isRead;
      const senderName = l.toPlayer ? (l.fromName || '未知') : (l.toNpcName || '未知');
      const timeStr = this.formatDate(l.arriveTime || l.sendTime);

      return `
        <div onclick="LetterSystem.selectLetter('${l.id}')"
             style="padding:10px 14px;border-bottom:1px solid rgba(212,196,168,0.4);cursor:pointer;position:relative;
                    ${isSelected ? 'background:rgba(201,162,39,0.12);border-left:3px solid #C9A227;' : 'border-left:3px solid transparent;'}
                    ${isUnread ? 'background:rgba(201,162,39,0.04);' : ''}">
          <!-- 紧急标记 -->
          ${l.urgency !== 'normal' ? `<div style="position:absolute;top:4px;right:8px;width:8px;height:8px;border-radius:50%;background:${urgency.color};box-shadow:0 0 4px ${urgency.color};"></div>` : ''}
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;">
            <span style="font-size:13px;font-weight:${isUnread ? '700' : '400'};color:#2C1810;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
              ${isUnread ? `<span style="color:#C9A227;margin-right:4px;">●</span>` : ''}
              ${this.escapeHtml(l.subject)}
            </span>
            <span style="font-size:10px;color:#A08B6D;white-space:nowrap;flex-shrink:0;">${timeStr}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
            <span style="font-size:11px;color:#8B7355;">
              <span style="display:inline-flex;align-items:center;gap:3px;background:${type.color}15;color:${type.color};padding:1px 5px;border-radius:3px;font-size:10px;">
                ${type.icon} ${type.name}
              </span>
              <span style="margin-left:6px;">${this.escapeHtml(senderName)}</span>
            </span>
            ${l.attachments && l.attachments.length > 0 ? '<span style="font-size:12px;">📎</span>' : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  /** 选中某封信 */
  selectLetter(id) {
    this._selectedLetterId = id;
    // 标记为已读
    this.markAsRead(id, true);
    this.renderLetterList();
    this.renderLetterDetail(id);
  },

  /** 渲染信件详情 */
  renderLetterDetail(letterId) {
    const c = document.getElementById('letterReadingArea');
    if (!c) return;

    if (!letterId) {
      c.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#A08B6D;">
          <div style="font-size:64px;margin-bottom:16px;opacity:0.4;">📜</div>
          <p style="font-size:16px;">请选择一封信件阅读</p>
          <p style="font-size:12px;color:#B8A88A;margin-top:8px;">或是提笔写一封新信</p>
        </div>
      `;
      return;
    }

    const data = this.getData();
    const letter = data.letters.find(l => l.id === letterId);
    if (!letter) {
      this._selectedLetterId = null;
      this.renderLetterDetail(null);
      return;
    }

    const types = this.getTypes();
    const type = types.find(t => t.id === letter.type) || this.DEFAULT_TYPES[0];
    const urgency = this.URGENCY_LEVELS.find(u => u.id === letter.urgency) || this.URGENCY_LEVELS[0];

    // 获取发件人头像（如果有）
    let senderAvatar = '';
    let senderTitle = '';
    if (letter.fromNpcId) {
      const npc = this._getNPCById(letter.fromNpcId);
      if (npc) {
        senderAvatar = npc.avatar || '';
        senderTitle = npc.title || '';
      }
    }

    const sendDate = this.formatDate(letter.sendTime, true);
    const arriveDate = this.formatDate(letter.arriveTime, true);

    c.innerHTML = `
      <!-- 信件头部 -->
      <div style="padding:16px 20px;border-bottom:1px solid #D4C4A8;background:linear-gradient(90deg, rgba(201,162,39,0.06) 0%, transparent 100%);display:flex;justify-content:space-between;align-items:flex-start;">
        <div style="display:flex;gap:12px;align-items:center;">
          ${senderAvatar ? `<img src="${senderAvatar}" style="width:44px;height:44px;border-radius:50%;border:2px solid #C9A227;object-fit:cover;" alt="">` : '<div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg, #C9A227 0%, #8B6914 100%);display:flex;align-items:center;justify-content:center;font-size:20px;color:#F5E6D3;border:2px solid #C9A227;">🎭</div>'}
          <div>
            <div style="font-size:15px;font-weight:600;color:#2C1810;">${this.escapeHtml(letter.fromName || letter.toNpcName || '未知')}</div>
            ${senderTitle ? `<div style="font-size:11px;color:#8B7355;">${this.escapeHtml(senderTitle)}</div>` : ''}
            <div style="font-size:11px;color:#A08B6D;margin-top:2px;">
              ${letter.toPlayer ? '发件人' : '收件人'} · ${sendDate}
              ${letter.arriveTime > letter.sendTime ? ` · 送达 ${arriveDate}` : ''}
            </div>
          </div>
        </div>
        <div style="display:flex;gap:4px;align-items:center;">
          <span style="display:inline-flex;align-items:center;gap:3px;background:${type.color}15;color:${type.color};padding:3px 8px;border-radius:4px;font-size:11px;border:1px solid ${type.color}30;">
            ${type.icon} ${type.name}
          </span>
          ${letter.urgency !== 'normal' ? `<span style="display:inline-flex;align-items:center;gap:3px;background:${urgency.color}15;color:${urgency.color};padding:3px 8px;border-radius:4px;font-size:11px;border:1px solid ${urgency.color}30;">${urgency.icon} ${urgency.name}</span>` : ''}
        </div>
      </div>

      <!-- 信件主题 -->
      <div style="padding:12px 20px;background:rgba(201,162,39,0.03);border-bottom:1px dashed #D4C4A8;">
        <h2 style="font-size:18px;font-weight:600;color:#2C1810;margin:0;font-family:'Noto Serif SC', serif;">
          ${this.escapeHtml(letter.subject)}
        </h2>
      </div>

      <!-- 信件正文（古风信纸样式） -->
      <div style="flex:1;overflow-y:auto;padding:24px 28px;">
        <div style="background:linear-gradient(180deg, #FFFBF0 0%, #FDF6EC 50%, #F5E6D3 100%);border:1px solid #D4C4A8;border-radius:4px;padding:28px 32px;min-height:300px;position:relative;box-shadow:inset 0 0 30px rgba(201,162,39,0.05);">
          <!-- 信纸装饰边框 -->
          <div style="position:absolute;top:8px;left:8px;right:8px;bottom:8px;border:1px solid rgba(201,162,39,0.2);pointer-events:none;"></div>
          <!-- 内容 -->
          <div style="font-size:15px;line-height:2;color:#2C1810;font-family:'Noto Serif SC', 'SimSun', serif;white-space:pre-wrap;">${this.escapeHtml(letter.content)}</div>

          <!-- 附带物品 -->
          ${letter.attachments && letter.attachments.length > 0 ? `
            <div style="margin-top:24px;padding-top:16px;border-top:1px dashed #D4C4A8;">
              <div style="font-size:12px;color:#8B7355;margin-bottom:8px;">📎 附带物品：</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                ${letter.attachments.map(a => `
                  <div style="display:flex;align-items:center;gap:4px;background:rgba(201,162,39,0.08);padding:4px 10px;border-radius:4px;border:1px solid #D4C4A8;">
                    <span>${a.icon || '📦'}</span>
                    <span style="font-size:12px;color:#2C1810;">${this.escapeHtml(a.name)} ×${a.quantity || 1}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- 地点标记 -->
          ${letter.locationId ? `
            <div style="margin-top:16px;text-align:right;">
              <span style="font-size:11px;color:#A08B6D;">📍 从 ${this.escapeHtml(letter.locationId)} 发出</span>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div style="padding:12px 20px;border-top:1px solid #D4C4A8;background:rgba(44,24,16,0.02);display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;">
        ${letter.toPlayer && letter.fromNpcId ? `
          <button class="btn btn-primary" onclick="LetterSystem.replyToLetter('${letter.id}')">✍️ 回信</button>
        ` : ''}
        <button class="btn btn-sm btn-secondary" onclick="LetterSystem.markAsRead('${letter.id}', ${!letter.isRead})">${letter.isRead ? '🔘 标记未读' : '🔵 标记已读'}</button>
        <button class="btn btn-sm btn-danger" onclick="LetterSystem.deleteLetter('${letter.id}')">🗑️ 删除</button>
      </div>
    `;
  },

  /** 切换文件夹 */
  switchFolder(folderId) {
    this._currentFolder = folderId;
    this._selectedLetterId = null;
    this.renderLetterInterface();
  },

  /* ========== 写信界面 ========== */

  /** 渲染写信界面 */
  renderCompose() {
    const c = document.getElementById('letterReadingArea');
    if (!c) return;

    const npcs = this._getAllNPCs();
    const types = this.getTypes();

    // 如果有回复目标，获取原信信息
    let replyInfo = '';
    if (this._composeReplyTo) {
      const data = this.getData();
      const original = data.letters.find(l => l.id === this._composeReplyTo);
      if (original) {
        replyInfo = `
          <div style="padding:8px 12px;background:rgba(201,162,39,0.08);border-radius:4px;margin-bottom:12px;border-left:3px solid #C9A227;">
            <div style="font-size:12px;color:#8B7355;">回复信件：${this.escapeHtml(original.subject)}</div>
            <div style="font-size:11px;color:#A08B6D;">发件人：${this.escapeHtml(original.fromName || '未知')}</div>
          </div>
        `;
      }
    }

    c.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;">
        <!-- 写信头部 -->
        <div style="padding:16px 20px;border-bottom:1px solid #D4C4A8;background:rgba(201,162,39,0.06);">
          <h3 style="font-size:16px;font-weight:600;color:#2C1810;margin:0;font-family:'Noto Serif SC', serif;">✍️ 提笔写信</h3>
        </div>

        <!-- 写信表单 -->
        <div style="flex:1;overflow-y:auto;padding:20px;">
          ${replyInfo}

          <div style="display:flex;flex-direction:column;gap:14px;max-width:600px;">
            <!-- 收件人 -->
            <div>
              <label style="display:block;font-size:13px;color:#8B7355;margin-bottom:4px;">收件人</label>
              <select id="composeRecipient" style="width:100%;padding:8px 10px;border:1px solid #D4C4A8;border-radius:4px;background:#FDF6EC;color:#2C1810;font-size:14px;">
                <option value="">请选择收信人</option>
                ${npcs.map(n => `<option value="${n.id}" ${this._composeTarget === n.id ? 'selected' : ''}>${n.name} ${n.title ? '(' + n.title + ')' : ''}</option>`).join('')}
              </select>
            </div>

            <!-- 信件类型 -->
            <div>
              <label style="display:block;font-size:13px;color:#8B7355;margin-bottom:4px;">信件类型</label>
              <div style="display:flex;gap:6px;flex-wrap:wrap;">
                ${types.map(t => `
                  <label style="display:flex;align-items:center;gap:4px;padding:4px 10px;border-radius:4px;border:1px solid #D4C4A8;background:rgba(255,255,255,0.4);cursor:pointer;font-size:12px;">
                    <input type="radio" name="composeType" value="${t.id}" ${t.id === 'private' ? 'checked' : ''}>
                    <span style="color:${t.color};">${t.icon}</span>
                    <span>${t.name}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <!-- 主题 -->
            <div>
              <label style="display:block;font-size:13px;color:#8B7355;margin-bottom:4px;">主题</label>
              <input type="text" id="composeSubject" placeholder="请输入信件主题..."
                     style="width:100%;padding:8px 10px;border:1px solid #D4C4A8;border-radius:4px;background:#FDF6EC;color:#2C1810;font-size:14px;font-family:'Noto Serif SC', serif;">
            </div>

            <!-- 正文 -->
            <div>
              <label style="display:block;font-size:13px;color:#8B7355;margin-bottom:4px;">正文</label>
              <textarea id="composeContent" placeholder="在此书写你的信件内容..."
                        style="width:100%;height:200px;padding:10px;border:1px solid #D4C4A8;border-radius:4px;background:#FDF6EC;color:#2C1810;font-size:14px;line-height:1.8;font-family:'Noto Serif SC', serif;resize:vertical;"></textarea>
            </div>

            <!-- AI润色 -->
            <div style="display:flex;gap:8px;align-items:center;">
              <button class="btn btn-sm btn-secondary" onclick="LetterSystem.applyPolish('formal')">🎭 正式润色</button>
              <button class="btn btn-sm btn-secondary" onclick="LetterSystem.applyPolish('warm')">💖 温情润色</button>
              <button class="btn btn-sm btn-secondary" onclick="LetterSystem.applyPolish('urgent')">🔥 紧急润色</button>
            </div>

            <!-- 附带物品 -->
            <div>
              <label style="display:block;font-size:13px;color:#8B7355;margin-bottom:4px;">附带物品（与背包联动）</label>
              <div id="composeAttachments" style="display:flex;gap:6px;flex-wrap:wrap;"></div>
              <button class="btn btn-sm btn-secondary" onclick="LetterSystem.showAttachItemPicker()" style="margin-top:6px;">📎 添加物品</button>
            </div>

            <!-- 紧急程度 -->
            <div>
              <label style="display:block;font-size:13px;color:#8B7355;margin-bottom:4px;">紧急程度</label>
              <div style="display:flex;gap:6px;">
                ${this.URGENCY_LEVELS.map(u => `
                  <label style="display:flex;align-items:center;gap:4px;padding:4px 10px;border-radius:4px;border:1px solid ${u.color}40;background:rgba(255,255,255,0.4);cursor:pointer;font-size:12px;">
                    <input type="radio" name="composeUrgency" value="${u.id}" ${u.id === 'normal' ? 'checked' : ''}>
                    <span style="color:${u.color};">${u.icon}</span>
                    <span>${u.name}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- 底部发送栏 -->
        <div style="padding:12px 20px;border-top:1px solid #D4C4A8;background:rgba(44,24,16,0.02);display:flex;gap:8px;justify-content:flex-end;">
          <button class="btn btn-secondary" onclick="LetterSystem.cancelCompose()">取消</button>
          <button class="btn btn-primary" onclick="LetterSystem.sendCompose()">🕊️ 飞鸽传书</button>
        </div>
      </div>
    `;

    // 如果有目标NPC，自动填充
    if (this._composeTarget) {
      const select = document.getElementById('composeRecipient');
      if (select) select.value = this._composeTarget;
    }
  },

  /** 取消写信 */
  cancelCompose() {
    this._composeTarget = null;
    this._composeReplyTo = null;
    this.renderLetterInterface();
  },

  /** 发送信件 */
  sendCompose() {
    const recipientSelect = document.getElementById('composeRecipient');
    const subjectInput = document.getElementById('composeSubject');
    const contentInput = document.getElementById('composeContent');
    const typeRadio = document.querySelector('input[name="composeType"]:checked');
    const urgencyRadio = document.querySelector('input[name="composeUrgency"]:checked');

    const npcId = recipientSelect ? recipientSelect.value : this._composeTarget;
    const subject = subjectInput ? subjectInput.value.trim() : '';
    const content = contentInput ? contentInput.value.trim() : '';
    const typeId = typeRadio ? typeRadio.value : 'private';
    const urgency = urgencyRadio ? urgencyRadio.value : 'normal';

    if (!npcId) {
      App.toast('请选择收件人', 'warning');
      return;
    }
    if (!subject) {
      App.toast('请输入信件主题', 'warning');
      return;
    }

    this.sendLetterToNPC(npcId, subject, content, typeId, []);
    this.cancelCompose();
  },

  /** 应用AI润色 */
  applyPolish(tone) {
    const contentInput = document.getElementById('composeContent');
    if (!contentInput) return;
    const raw = contentInput.value.trim();
    if (!raw) {
      App.toast('请先输入一些内容', 'warning');
      return;
    }
    const polished = this.aiPolishLetter(raw, tone);
    if (confirm('润色后的内容：\n\n' + polished + '\n\n是否应用？')) {
      contentInput.value = polished;
    }
  },

  /** 显示物品选择器 */
  showAttachItemPicker() {
    const items = this.getAttachableItems();
    if (items.length === 0) {
      App.toast('背包中没有物品', 'warning');
      return;
    }
    const itemList = items.map((i, idx) => `${idx + 1}. ${i.icon || '📦'} ${i.name} ×${i.quantity || 1}`).join('\n');
    const choice = prompt(`选择要附带的物品（输入序号）：\n\n${itemList}\n\n0. 取消`);
    if (!choice || choice === '0') return;
    const idx = parseInt(choice) - 1;
    if (idx >= 0 && idx < items.length) {
      // 添加到写信界面的附件区
      this._addAttachmentUI(items[idx]);
    }
  },

  /** 在写信界面添加附件UI */
  _addAttachmentUI(item) {
    const container = document.getElementById('composeAttachments');
    if (!container) return;
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:center;gap:4px;background:rgba(201,162,39,0.08);padding:4px 10px;border-radius:4px;border:1px solid #D4C4A8;font-size:12px;';
    div.innerHTML = `
      <span>${item.icon || '📦'}</span>
      <span>${this.escapeHtml(item.name)}</span>
      <span style="cursor:pointer;color:#DC143C;margin-left:4px;" onclick="this.parentNode.remove()">✕</span>
    `;
    div.dataset.itemId = item.id;
    container.appendChild(div);
  },

  /* ========== NPC发信规则管理界面 ========== */

  /** 渲染规则管理界面 */
  renderRuleManager() {
    const c = document.getElementById('letterReadingArea');
    if (!c) return;

    const rules = this.getRules();
    const npcs = this._getAllNPCs();
    const types = this.getTypes();

    c.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;">
        <div style="padding:16px 20px;border-bottom:1px solid #D4C4A8;background:rgba(201,162,39,0.06);display:flex;justify-content:space-between;align-items:center;">
          <h3 style="font-size:16px;font-weight:600;color:#2C1810;margin:0;">🤖 NPC发信规则</h3>
          <button class="btn btn-primary" onclick="LetterSystem.showAddRuleModal()">➕ 添加规则</button>
        </div>
        <div style="flex:1;overflow-y:auto;padding:20px;">
          ${rules.length === 0 ? `
            <div style="text-align:center;padding:40px;color:#A08B6D;">
              <div style="font-size:48px;margin-bottom:12px;opacity:0.5;">📋</div>
              <p>暂无发信规则</p>
              <p style="font-size:12px;color:#B8A88A;margin-top:4px;">添加规则让NPC主动给你写信</p>
            </div>
          ` : `
            <div style="display:flex;flex-direction:column;gap:10px;">
              ${rules.map(r => {
                const npc = npcs.find(n => n.id === r.npcId);
                const typeNames = r.letterTypes.map(tid => {
                  const t = types.find(x => x.id === tid);
                  return t ? t.name : tid;
                }).join('、');
                return `
                  <div style="background:linear-gradient(135deg, #FFFBF0 0%, #FDF6EC 100%);border:1px solid #D4C4A8;border-radius:6px;padding:14px;position:relative;">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                      <div>
                        <span style="font-size:14px;font-weight:600;color:#2C1810;">${npc ? npc.name : '未知NPC'}</span>
                        <span style="font-size:11px;color:#8B7355;margin-left:8px;">好感度 ${r.minAffection}-${r.maxAffection}</span>
                      </div>
                      <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-secondary" onclick="LetterSystem.editRule('${r.id}')">编辑</button>
                        <button class="btn btn-sm btn-danger" onclick="LetterSystem.removeNPCRule('${r.id}')">删除</button>
                      </div>
                    </div>
                    <div style="font-size:12px;color:#8B7355;line-height:1.6;">
                      <div>📨 可发类型：${typeNames}</div>
                      <div>🎯 触发概率：${Math.round(r.probability * 100)}%</div>
                      <div>⏱️ 冷却时间：${r.cooldown}小时</div>
                      <div>🚀 延迟模式：${r.delayMode === 'distance' ? '按距离' : '固定' + r.delayValue + '小时'}</div>
                      <div>📡 触发事件：${r.triggerEvents.join('、')}</div>
                    </div>
                    <div style="position:absolute;top:8px;right:8px;">
                      ${r.enabled ? '<span style="font-size:11px;color:#6B8E23;">● 启用</span>' : '<span style="font-size:11px;color:#A08B6D;">○ 停用</span>'}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  },

  /** 显示添加规则弹窗 */
  showAddRuleModal() {
    const npcs = this._getAllNPCs();
    const types = this.getTypes();

    App.showModal('添加NPC发信规则', `
      <div style="display:flex;flex-direction:column;gap:12px;max-width:500px;">
        <div>
          <label style="display:block;font-size:13px;color:#8B7355;margin-bottom:4px;">选择NPC</label>
          <select id="ruleNpcId" style="width:100%;padding:8px;border:1px solid #D4C4A8;border-radius:4px;background:#FDF6EC;">
            ${npcs.map(n => `<option value="${n.id}">${n.name}</option>`).join('')}
          </select>
        </div>
        <div style="display:flex;gap:8px;">
          <div style="flex:1;">
            <label style="display:block;font-size:13px;color:#8B7355;margin-bottom:4px;">最低好感度</label>
            <input type="number" id="ruleMinAffection" value="50" min="0" max="100" style="width:100%;padding:8px;border:1px solid #D4C4A8;border-radius:4px;background:#FDF6EC;">
          </div>
          <div style="flex:1;">
            <label style="display:block;font-size:13px;color:#8B7355;margin-bottom:4px;">最高好感度</label>
            <input type="number" id="ruleMaxAffection" value="100" min="0" max="100" style="width:100%;padding:8px;border:1px solid #D4C4A8;border-radius:4px;background:#FDF6EC;">
          </div>
        </div>
        <div>
          <label style="display:block;font-size:13px;color:#8B7355;margin-bottom:4px;">触发概率（0-1）</label>
          <input type="number" id="ruleProbability" value="0.3" min="0" max="1" step="0.1" style="width:100%;padding:8px;border:1px solid #D4C4A8;border-radius:4px;background:#FDF6EC;">
        </div>
        <div>
          <label style="display:block;font-size:13px;color:#8B7355;margin-bottom:4px;">可发信件类型</label>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${types.map(t => `
              <label style="display:flex;align-items:center;gap:3px;font-size:12px;cursor:pointer;">
                <input type="checkbox" class="ruleTypeCheckbox" value="${t.id}" checked>
                <span>${t.icon} ${t.name}</span>
              </label>
            `).join('')}
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          <div style="flex:1;">
            <label style="display:block;font-size:13px;color:#8B7355;margin-bottom:4px;">延迟模式</label>
            <select id="ruleDelayMode" style="width:100%;padding:8px;border:1px solid #D4C4A8;border-radius:4px;background:#FDF6EC;">
              <option value="distance">按地图距离</option>
              <option value="fixed">固定延迟</option>
            </select>
          </div>
          <div style="flex:1;">
            <label style="display:block;font-size:13px;color:#8B7355;margin-bottom:4px;">延迟值</label>
            <input type="number" id="ruleDelayValue" value="1" min="0" style="width:100%;padding:8px;border:1px solid #D4C4A8;border-radius:4px;background:#FDF6EC;">
          </div>
        </div>
        <div>
          <label style="display:block;font-size:13px;color:#8B7355;margin-bottom:4px;">冷却时间（小时）</label>
          <input type="number" id="ruleCooldown" value="24" min="1" style="width:100%;padding:8px;border:1px solid #D4C4A8;border-radius:4px;background:#FDF6EC;">
        </div>
        <div>
          <label style="display:block;font-size:13px;color:#8B7355;margin-bottom:4px;">内容模板提示（可选，留空则AI生成）</label>
          <textarea id="ruleTemplate" placeholder="例如：表达对玩家的思念之情..." style="width:100%;height:60px;padding:8px;border:1px solid #D4C4A8;border-radius:4px;background:#FDF6EC;font-size:13px;resize:vertical;"></textarea>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px;">
          <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
          <button class="btn btn-primary" onclick="LetterSystem.saveNewRule()">保存规则</button>
        </div>
      </div>
    `);
  },

  /** 保存新规则 */
  saveNewRule() {
    const npcId = document.getElementById('ruleNpcId')?.value;
    const minAffection = parseInt(document.getElementById('ruleMinAffection')?.value || 0);
    const maxAffection = parseInt(document.getElementById('ruleMaxAffection')?.value || 100);
    const probability = parseFloat(document.getElementById('ruleProbability')?.value || 0.3);
    const delayMode = document.getElementById('ruleDelayMode')?.value || 'distance';
    const delayValue = parseFloat(document.getElementById('ruleDelayValue')?.value || 1);
    const cooldown = parseInt(document.getElementById('ruleCooldown')?.value || 24);
    const template = document.getElementById('ruleTemplate')?.value || '';

    const checkedTypes = Array.from(document.querySelectorAll('.ruleTypeCheckbox:checked')).map(cb => cb.value);

    this.configureNPCRule({
      npcId,
      minAffection,
      maxAffection,
      probability,
      letterTypes: checkedTypes.length > 0 ? checkedTypes : ['private'],
      delayMode,
      delayValue,
      contentTemplate: template,
      cooldown,
      triggerEvents: ['affection_change'],
      enabled: true
    });

    App.closeModal();
    App.toast('发信规则已保存', 'success');
    this.renderRuleManager();
  },

  /** 编辑规则 */
  editRule(ruleId) {
    // 简化实现：删除旧规则，让用户重新添加
    if (confirm('编辑规则将删除旧规则并重新创建，是否继续？')) {
      this.removeNPCRule(ruleId);
      this.showAddRuleModal();
    }
  },

  /* ========== 设置管理 ========== */

  /** 渲染设置界面 */
  renderSettings() {
    const c = document.getElementById('letterReadingArea');
    if (!c) return;

    const settings = this.getSettings();

    c.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;">
        <div style="padding:16px 20px;border-bottom:1px solid #D4C4A8;background:rgba(201,162,39,0.06);">
          <h3 style="font-size:16px;font-weight:600;color:#2C1810;margin:0;">⚙️ 飞鸽传书设置</h3>
        </div>
        <div style="flex:1;overflow-y:auto;padding:20px;">
          <div style="display:flex;flex-direction:column;gap:16px;max-width:500px;">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:rgba(255,255,255,0.4);border-radius:6px;border:1px solid #D4C4A8;">
              <div>
                <div style="font-size:14px;color:#2C1810;font-weight:500;">飞鸽动画</div>
                <div style="font-size:11px;color:#8B7355;margin-top:2px;">新信件到达时播放飞鸽飞过动画</div>
              </div>
              <label style="position:relative;display:inline-block;width:44px;height:24px;">
                <input type="checkbox" id="settingPigeonAnim" ${settings.enablePigeonAnim ? 'checked' : ''} style="opacity:0;width:0;height:0;" onchange="LetterSystem.toggleSetting('enablePigeonAnim', this.checked)">
                <span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:${settings.enablePigeonAnim ? '#C9A227' : '#ccc'};border-radius:24px;transition:0.3s;"></span>
                <span style="position:absolute;content:'';height:18px;width:18px;left:3px;bottom:3px;background:white;border-radius:50%;transition:0.3s;transform:${settings.enablePigeonAnim ? 'translateX(20px)' : 'translateX(0)'};"></span>
              </label>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:rgba(255,255,255,0.4);border-radius:6px;border:1px solid #D4C4A8;">
              <div>
                <div style="font-size:14px;color:#2C1810;font-weight:500;">提示音</div>
                <div style="font-size:11px;color:#8B7355;margin-top:2px;">新信件到达时播放提示音效</div>
              </div>
              <label style="position:relative;display:inline-block;width:44px;height:24px;">
                <input type="checkbox" id="settingSound" ${settings.enableSound ? 'checked' : ''} style="opacity:0;width:0;height:0;" onchange="LetterSystem.toggleSetting('enableSound', this.checked)">
                <span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:${settings.enableSound ? '#C9A227' : '#ccc'};border-radius:24px;transition:0.3s;"></span>
                <span style="position:absolute;content:'';height:18px;width:18px;left:3px;bottom:3px;background:white;border-radius:50%;transition:0.3s;transform:${settings.enableSound ? 'translateX(20px)' : 'translateX(0)'};"></span>
              </label>
            </div>

            <div style="padding:12px;background:rgba(255,255,255,0.4);border-radius:6px;border:1px solid #D4C4A8;">
              <div style="font-size:14px;color:#2C1810;font-weight:500;margin-bottom:8px;">送信速度</div>
              <div style="font-size:11px;color:#8B7355;margin-bottom:8px;">基础速度（单位距离/小时）</div>
              <input type="range" id="settingBaseSpeed" min="1" max="100" value="${settings.baseSpeed}" style="width:100%;"
                     oninput="document.getElementById('speedValue').textContent=this.value"
                     onchange="LetterSystem.updateSetting('baseSpeed', parseInt(this.value))">
              <div style="text-align:center;margin-top:4px;font-size:12px;color:#C9A227;">
                <span id="speedValue">${settings.baseSpeed}</span> 单位/小时
              </div>
            </div>

            <!-- 信件类型管理 -->
            <div style="padding:12px;background:rgba(255,255,255,0.4);border-radius:6px;border:1px solid #D4C4A8;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <div style="font-size:14px;color:#2C1810;font-weight:500;">信件类型管理</div>
                <button class="btn btn-sm btn-primary" onclick="LetterSystem.showAddTypeModal()">➕ 添加</button>
              </div>
              <div id="typeManagerList" style="display:flex;flex-direction:column;gap:6px;"></div>
            </div>

            <!-- 快捷入口 -->
            <div style="padding:12px;background:rgba(255,255,255,0.4);border-radius:6px;border:1px solid #D4C4A8;">
              <div style="font-size:14px;color:#2C1810;font-weight:500;margin-bottom:10px;">管理入口</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button class="btn btn-secondary" onclick="LetterSystem.renderRuleManager()">🤖 NPC发信规则</button>
                <button class="btn btn-secondary" onclick="LetterSystem.forceCheckTriggers()">🔍 手动检查触发</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderTypeManagerList();
  },

  /** 渲染类型管理列表 */
  renderTypeManagerList() {
    const c = document.getElementById('typeManagerList');
    if (!c) return;

    const types = this.getTypes();
    c.innerHTML = types.map(t => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;background:rgba(201,162,39,0.04);border-radius:4px;">
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:16px;">${t.icon}</span>
          <span style="font-size:13px;color:#2C1810;">${t.name}</span>
          <span style="font-size:10px;color:#8B7355;">${t.desc || ''}</span>
        </div>
        <div style="display:flex;gap:4px;">
          <button class="btn btn-sm btn-secondary" onclick="LetterSystem.renameLetterTypePrompt('${t.id}')">重命名</button>
          <button class="btn btn-sm btn-danger" onclick="LetterSystem.removeLetterType('${t.id}')">删除</button>
        </div>
      </div>
    `).join('');
  },

  /** 显示添加类型弹窗 */
  showAddTypeModal() {
    App.showModal('添加信件类型', `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div>
          <label style="display:block;font-size:13px;color:#8B7355;margin-bottom:4px;">类型名称</label>
          <input type="text" id="newTypeName" placeholder="例如：密函" style="width:100%;padding:8px;border:1px solid #D4C4A8;border-radius:4px;background:#FDF6EC;">
        </div>
        <div>
          <label style="display:block;font-size:13px;color:#8B7355;margin-bottom:4px;">图标（emoji）</label>
          <input type="text" id="newTypeIcon" value="📄" style="width:100%;padding:8px;border:1px solid #D4C4A8;border-radius:4px;background:#FDF6EC;">
        </div>
        <div>
          <label style="display:block;font-size:13px;color:#8B7355;margin-bottom:4px;">颜色</label>
          <input type="color" id="newTypeColor" value="#4A90C2" style="width:100%;padding:4px;border:1px solid #D4C4A8;border-radius:4px;background:#FDF6EC;height:36px;">
        </div>
        <div>
          <label style="display:block;font-size:13px;color:#8B7355;margin-bottom:4px;">描述</label>
          <input type="text" id="newTypeDesc" placeholder="简短描述..." style="width:100%;padding:8px;border:1px solid #D4C4A8;border-radius:4px;background:#FDF6EC;">
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px;">
          <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
          <button class="btn btn-primary" onclick="LetterSystem.saveNewType()">添加</button>
        </div>
      </div>
    `);
  },

  /** 保存新类型 */
  saveNewType() {
    const name = document.getElementById('newTypeName')?.value?.trim();
    const icon = document.getElementById('newTypeIcon')?.value || '📄';
    const color = document.getElementById('newTypeColor')?.value || '#4A90C2';
    const desc = document.getElementById('newTypeDesc')?.value || '';

    if (!name) {
      App.toast('请输入类型名称', 'warning');
      return;
    }

    this.addLetterType({ name, icon, color, desc });
    App.closeModal();
    this.renderTypeManagerList();
  },

  /** 重命名类型提示 */
  renameLetterTypePrompt(typeId) {
    const data = this.getData();
    const type = data.types.find(t => t.id === typeId);
    if (!type) return;
    const newName = prompt('新名称：', type.name);
    if (newName && newName.trim()) {
      this.renameLetterType(typeId, newName.trim());
      this.renderTypeManagerList();
    }
  },

  /** 切换设置 */
  toggleSetting(key, value) {
    const data = this.getData();
    data.settings[key] = value;
    this.saveData(data);
    this.renderSettings();
  },

  /** 更新设置值 */
  updateSetting(key, value) {
    const data = this.getData();
    data.settings[key] = value;
    this.saveData(data);
  },

  /** 手动检查触发器 */
  forceCheckTriggers() {
    const npcs = this._getAllNPCs();
    let triggered = 0;
    for (const npc of npcs) {
      const affection = npc.affection || 50;
      this.checkNPCLetterTriggers('manual_check', {
        npcId: npc.id,
        affection: affection,
        locationId: npc.address || npc.locationId
      });
    }
    App.toast('触发检查完成', 'info');
    this.renderLetterInterface();
  },

  /* ========== 工具方法 ========== */

  /** HTML转义 */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /** 格式化日期 */
  formatDate(timestamp, full) {
    if (!timestamp) return '未知时间';
    const date = new Date(timestamp);
    if (full) {
      return date.toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    }
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const mins = Math.floor(diff / (1000 * 60));
        return mins <= 0 ? '刚刚' : `${mins}分钟前`;
      }
      return `${hours}小时前`;
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    }
  },

  /** 获取NPC名称 */
  getNPCName(npcId) {
    const npc = this._getNPCById(npcId);
    return npc ? npc.name : '未知';
  },

  /** 获取未读信件数量 */
  getUnreadCount() {
    return this.getLetters().filter(l => l.folder === 'inbox' && !l.isRead).length;
  }
};
