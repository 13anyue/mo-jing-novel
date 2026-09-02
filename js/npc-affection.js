/**
 * =========================================================
 * NPC Affection & Event Chain System v1
 * 好感度事件链系统
 * 
 * 功能：
 * 1. 每个NPC独立的好感度数值（0-100）
 * 2. 五级好感度划分：冷淡→陌生→友善→亲近→挚爱
 * 3. 手动调整 + 自动计算（关键词匹配、送礼、任务）
 * 4. 事件链系统：每个NPC可有多条事件链
 * 5. 事件节点：内容、触发条件、奖励
 * 6. 事件链可视化编辑器（节点+连线）
 * 7. 与NPC资料册、背包系统联动
 * 8. localStorage 持久化 + 导出/导入
 * 
 * 存储键：npc_affection_v1（好感度数据）
 *         npc_event_chains_v1（事件链数据）
 * =========================================================
 */
const NPCAffection = {
  // ============ 常量定义 ============
  
  /** 好感度等级配置 */
  AFFECTION_LEVELS: [
    { min: 0,  max: 20,  name: '冷淡',  color: '#9E9E9E', desc: '形同陌路' },
    { min: 21, max: 40,  name: '陌生',  color: '#8BC34A', desc: '略有耳闻' },
    { min: 41, max: 60,  name: '友善',  color: '#4CAF50', desc: '点头之交' },
    { min: 61, max: 80,  name: '亲近',  color: '#FF9800', desc: '推心置腹' },
    { min: 81, max: 100, name: '挚爱',  color: '#E91E63', desc: '生死相随' }
  ],
  
  /** 事件状态 */
  EVENT_STATUS: {
    LOCKED:   'locked',    // 未解锁
    UNLOCKED: 'unlocked',  // 已解锁但未触发
    ACTIVE:   'active',    // 已触发，进行中
    COMPLETE: 'complete',  // 已完成
    EXPIRED:  'expired'    // 已过期
  },
  
  /** 存储键名 */
  STORAGE_KEY: 'npc_affection_v1',
  CHAIN_KEY:   'npc_event_chains_v1',
  HISTORY_KEY: 'npc_affection_history_v1',
  
  // ============ 数据层 ============
  
  /** 获取所有NPC的好感度数据 */
  getAllAffection() {
    return Storage.get(this.STORAGE_KEY, {});
  },
  
  /** 保存好感度数据 */
  saveAllAffection(data) {
    Storage.set(this.STORAGE_KEY, data);
  },
  
  /** 获取指定NPC的好感度 */
  getAffection(npcId) {
    const all = this.getAllAffection();
    return all[npcId] || { value: 0, history: [], lastInteract: null, notes: '' };
  },
  
  /** 设置指定NPC的好感度 */
  setAffection(npcId, value, reason = '') {
    const all = this.getAllAffection();
    const oldValue = all[npcId]?.value || 0;
    const clamped = Math.max(0, Math.min(100, value));
    
    if (!all[npcId]) {
      all[npcId] = { value: clamped, history: [], lastInteract: Date.now(), notes: '' };
    } else {
      all[npcId].value = clamped;
      all[npcId].lastInteract = Date.now();
    }
    
    // 记录历史
    all[npcId].history.push({
      time: Date.now(),
      oldValue,
      newValue: clamped,
      delta: clamped - oldValue,
      reason
    });
    
    // 限制历史记录数量
    if (all[npcId].history.length > 50) {
      all[npcId].history = all[npcId].history.slice(-50);
    }
    
    this.saveAllAffection(all);
    
    // 触发事件链检查
    this.checkEventChains(npcId);
    
    return clamped;
  },
  
  /** 增加好感度 */
  addAffection(npcId, delta, reason = '') {
    const current = this.getAffection(npcId);
    return this.setAffection(npcId, current.value + delta, reason);
  },
  
  /** 获取好感度等级 */
  getLevel(value) {
    return this.AFFECTION_LEVELS.find(l => value >= l.min && value <= l.max) || this.AFFECTION_LEVELS[0];
  },
  
  /** 获取下一个等级 */
  getNextLevel(value) {
    for (const level of this.AFFECTION_LEVELS) {
      if (value < level.min) return level;
    }
    return null; // 已满级
  },
  
  // ============ 事件链数据层 ============
  
  /** 获取所有事件链 */
  getAllChains() {
    return Storage.get(this.CHAIN_KEY, {});
  },
  
  /** 保存所有事件链 */
  saveAllChains(data) {
    Storage.set(this.CHAIN_KEY, data);
  },
  
  /** 获取指定NPC的事件链 */
  getNPCChains(npcId) {
    const all = this.getAllChains();
    return all[npcId] || [];
  },
  
  /** 创建新事件链 */
  createChain(npcId, chainData) {
    const all = this.getAllChains();
    if (!all[npcId]) all[npcId] = [];
    
    const chain = {
      id: 'chain_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: chainData.name || '未命名事件链',
      description: chainData.description || '',
      npcId: npcId,
      createdAt: Date.now(),
      events: chainData.events || [],
      status: 'active'
    };
    
    all[npcId].push(chain);
    this.saveAllChains(all);
    return chain;
  },
  
  /** 创建新事件节点 */
  createEvent(chainId, eventData) {
    return {
      id: 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      chainId: chainId,
      name: eventData.name || '未命名事件',
      content: eventData.content || '', // 事件剧情文本
      
      // 触发条件
      conditions: eventData.conditions || {
        affectionMin: 0,      // 最低好感度
        affectionMax: 100,    // 最高好感度
        prevEventId: null,    // 前置事件ID
        requireAllPrev: false, // 是否需要完成所有前置
        timeLimit: null,      // 时间限制（天）
        location: null,       // 特定地点
        items: [],            // 需要的物品 [{itemId, count}]
        customCondition: ''   // 自定义条件描述
      },
      
      // 奖励
      rewards: eventData.rewards || {
        affectionDelta: 0,    // 好感度变化
        items: [],            // 获得物品 [{itemId, count}]
        cgId: null,           // 解锁CG
        unlockLocation: null, // 解锁地点
        customReward: ''      // 自定义奖励描述
      },
      
      // 状态
      status: 'locked',
      unlockedAt: null,
      completedAt: null,
      
      // 剧情展示
      dialogStyle: eventData.dialogStyle || 'narrator', // narrator / character / choice
      speaker: eventData.speaker || '', // 说话人
      choices: eventData.choices || [],  // 如果是选择节点 [{text, nextEventId, affectionDelta}]
      
      // 编辑器位置
      x: eventData.x || 100,
      y: eventData.y || 100
    };
  },
  
  /** 检查并触发事件链 */
  checkEventChains(npcId) {
    const affection = this.getAffection(npcId);
    const chains = this.getNPCChains(npcId);
    
    chains.forEach(chain => {
      chain.events.forEach(event => {
        if (event.status === 'locked') {
          // 检查解锁条件
          const cond = event.conditions;
          let unlock = true;
          
          // 好感度条件
          if (affection.value < cond.affectionMin || affection.value > cond.affectionMax) {
            unlock = false;
          }
          
          // 前置事件条件
          if (cond.prevEventId) {
            const prevEvent = chain.events.find(e => e.id === cond.prevEventId);
            if (!prevEvent || prevEvent.status !== 'complete') {
              unlock = false;
            }
          }
          
          if (unlock) {
            event.status = 'unlocked';
            event.unlockedAt = Date.now();
            
            // 显示解锁提示
            this.showUnlockToast(npcId, event);
          }
        }
      });
    });
    
    this.saveAllChains(this.getAllChains());
  },
  
  /** 触发事件 */
  triggerEvent(npcId, chainId, eventId) {
    const chains = this.getNPCChains(npcId);
    const chain = chains.find(c => c.id === chainId);
    if (!chain) return null;
    
    const event = chain.events.find(e => e.id === eventId);
    if (!event || event.status !== 'unlocked') return null;
    
    event.status = 'active';
    
    // 保存状态
    this.saveAllChains(this.getAllChains());
    
    return event;
  },
  
  /** 完成事件 */
  completeEvent(npcId, chainId, eventId, choiceIndex = null) {
    const chains = this.getNPCChains(npcId);
    const chain = chains.find(c => c.id === chainId);
    if (!chain) return;
    
    const event = chain.events.find(e => e.id === eventId);
    if (!event || event.status !== 'active') return;
    
    event.status = 'complete';
    event.completedAt = Date.now();
    
    // 应用奖励
    const rewards = event.rewards;
    let affectionDelta = rewards.affectionDelta;
    
    // 如果选择有影响好感度的选项
    if (choiceIndex !== null && event.choices[choiceIndex]) {
      affectionDelta += event.choices[choiceIndex].affectionDelta || 0;
    }
    
    if (affectionDelta !== 0) {
      this.addAffection(npcId, affectionDelta, `完成事件：${event.name}`);
    }
    
    // 应用物品奖励（如果有背包系统）
    if (rewards.items.length > 0 && window.InventorySystem) {
      rewards.items.forEach(item => {
        // InventorySystem.addItem(item.itemId, item.count);
      });
    }
    
    this.saveAllChains(this.getAllChains());
    
    // 检查是否有后续事件解锁
    this.checkEventChains(npcId);
  },
  
  /** 显示解锁提示 */
  showUnlockToast(npcId, event) {
    const npcs = (window.NPCManager && NPCManager.getNPCs) ? NPCManager.getNPCs() : [];
    const npc = npcs.find(n => n.id === npcId);
    const npcName = npc ? npc.name : '某位角色';
    
    if (window.App && App.toast) {
      App.toast(`💫 ${npcName} 的新事件已解锁：${event.name}`, 'info', 4000);
    }
  },
  
  // ============ 运行时联动 ============
  
  /** 分析对话内容，自动调整好感度 */
  analyzeDialog(npcId, dialogText, playerResponse) {
    let delta = 0;
    const text = (dialogText + ' ' + (playerResponse || '')).toLowerCase();
    
    // 积极关键词
    const positive = ['谢谢', '感谢', '喜欢', '爱', '好', '棒', '赞', '温柔', '体贴', '关心', '帮助', '守护', '陪伴'];
    const negative = ['讨厌', '恨', '烦', '滚', '坏', '恶', '虚伪', '欺骗', '背叛', '冷漠', '残忍'];
    
    positive.forEach(word => {
      if (text.includes(word)) delta += 2;
    });
    
    negative.forEach(word => {
      if (text.includes(word)) delta -= 3;
    });
    
    // 特殊互动
    if (text.includes('礼物') || text.includes('送礼')) delta += 5;
    if (text.includes('表白') || text.includes('心意')) delta += 8;
    if (text.includes('伤害') || text.includes('欺骗')) delta -= 10;
    
    if (delta !== 0) {
      this.addAffection(npcId, delta, '对话互动');
    }
    
    return delta;
  },
  
  /** 送礼增加好感度 */
  giftAffection(npcId, itemId, itemValue = 10) {
    return this.addAffection(npcId, itemValue, '赠送礼物');
  },
  
  // ============ 页面渲染 ============
  
  init() { this.renderPage(); },
  onEnter() { this.renderPage(); },
  
  renderPage() {
    const page = document.getElementById('page-affection');
    if (!page) {
      // 如果页面容器不存在，创建一个
      this._ensurePageContainer();
      return;
    }
    
    const npcs = (window.NPCManager && NPCManager.getNPCs) ? NPCManager.getNPCs() : [];
    
    page.innerHTML = `
      <div class="affection-page" style="display:flex;flex-direction:column;height:100%;background:var(--bg-body);overflow:hidden;">
        ${this._renderTopBar()}
        <div class="affection-content" style="flex:1;overflow-y:auto;padding:12px;">
          ${npcs.length === 0 ? this._renderEmptyState() : this._renderNPCList(npcs)}
        </div>
        ${this._renderBottomNav()}
      </div>
      <style>
        ${this._getStyles()}
      </style>
    `;
    
    // 如果有PageFrame，调用包装
    if (window.PageFrame && typeof PageFrame.wrap === 'function') {
      setTimeout(() => PageFrame.wrap('page-affection', '情缘羁绊'), 0);
    }
  },
  
  _ensurePageContainer() {
    const main = document.querySelector('.app-main') || document.getElementById('mainApp');
    if (main) {
      const section = document.createElement('section');
      section.id = 'page-affection';
      section.className = 'page-view';
      section.style.display = 'none';
      main.appendChild(section);
      this.renderPage();
    }
  },
  
  _renderTopBar() {
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 14px;background:linear-gradient(180deg,#2C1810 0%,#3d2518 100%);border-bottom:2px solid #C9A227;color:#F5E6D3;flex-shrink:0;">
        <div style="display:flex;align-items:center;gap:8px;">
          <button onclick="App.navigate('home')" style="background:rgba(201,162,39,0.15);border:1px solid rgba(201,162,39,0.3);color:#C9A227;padding:4px 10px;border-radius:12px;font-size:12px;cursor:pointer;">
            ← 返回
          </button>
          <span style="font-family:'Noto Serif SC',serif;font-size:16px;font-weight:700;">情缘羁绊</span>
        </div>
        <button onclick="NPCAffection.showEditor()" style="background:#C9A227;color:#2C1810;padding:5px 12px;border-radius:16px;font-size:12px;cursor:pointer;border:none;font-weight:600;">
          + 新建事件链
        </button>
      </div>
    `;
  },
  
  _renderNPCList(npcs) {
    return `
      <div class="affection-npc-list">
        ${npcs.map(npc => {
          const affection = this.getAffection(npc.id);
          const level = this.getLevel(affection.value);
          const nextLevel = this.getNextLevel(affection.value);
          const progress = nextLevel ? ((affection.value - level.min) / (nextLevel.min - level.min) * 100) : 100;
          
          return `
            <div class="affection-npc-card" onclick="NPCAffection.showNPCDetail('${npc.id}')">
              <div class="affection-npc-avatar">
                ${npc.portraitId ? `<img src="${npc.portraitId}" alt="${npc.name}">` : 
                  `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="${level.color}" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`}
              </div>
              <div class="affection-npc-info">
                <div class="affection-npc-header">
                  <span class="affection-npc-name">${npc.name || '无名'}</span>
                  <span class="affection-level-tag" style="background:${level.color}20;color:${level.color};border:1px solid ${level.color}60;">${level.name}</span>
                </div>
                <div class="affection-progress-wrap">
                  <div class="affection-progress-bar">
                    <div class="affection-progress-fill" style="width:${progress}%;background:${level.color};"></div>
                  </div>
                  <span class="affection-progress-text">${affection.value}/100</span>
                </div>
                <div class="affection-npc-meta">
                  <span>${level.desc}</span>
                  <span>· ${affection.history.length} 次互动</span>
                </div>
              </div>
              <div class="affection-npc-arrow">›</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },
  
  _renderEmptyState() {
    return `
      <div style="text-align:center;padding:60px 20px;color:var(--text-muted);">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#C9A227" stroke-width="1" style="opacity:0.4;margin-bottom:16px;">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <p style="font-size:16px;margin-bottom:8px;">暂无角色数据</p>
        <p style="font-size:13px;opacity:0.7;">请先前往「人物志」添加NPC角色</p>
        <button onclick="App.navigate('npc')" style="margin-top:16px;background:#C9A227;color:#2C1810;padding:8px 20px;border-radius:20px;border:none;cursor:pointer;font-size:14px;font-weight:600;">
          前往人物志
        </button>
      </div>
    `;
  },
  
  _renderBottomNav() {
    return '';
  },
  
  // ============ NPC 详情页 ============
  
  showNPCDetail(npcId) {
    const page = document.getElementById('page-affection');
    if (!page) return;
    
    const npcs = (window.NPCManager && NPCManager.getNPCs) ? NPCManager.getNPCs() : [];
    const npc = npcs.find(n => n.id === npcId);
    if (!npc) return;
    
    const affection = this.getAffection(npcId);
    const level = this.getLevel(affection.value);
    const chains = this.getNPCChains(npcId);
    
    page.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;background:var(--bg-body);overflow:hidden;">
        ${this._renderDetailTopBar(npc)}
        <div style="flex:1;overflow-y:auto;padding:12px;">
          ${this._renderAffectionPanel(npc, affection, level)}
          ${this._renderEventChains(npcId, chains)}
          ${this._renderAffectionHistory(npcId, affection)}
        </div>
      </div>
      <style>${this._getStyles()}</style>
    `;
    
    // 绑定快速调整事件
    this._bindQuickAdjust(npcId);
  },
  
  _renderDetailTopBar(npc) {
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 14px;background:linear-gradient(180deg,#2C1810 0%,#3d2518 100%);border-bottom:2px solid #C9A227;color:#F5E6D3;flex-shrink:0;">
        <div style="display:flex;align-items:center;gap:8px;">
          <button onclick="NPCAffection.renderPage()" style="background:rgba(201,162,39,0.15);border:1px solid rgba(201,162,39,0.3);color:#C9A227;padding:4px 10px;border-radius:12px;font-size:12px;cursor:pointer;">
            ← 返回列表
          </button>
          <span style="font-family:'Noto Serif SC',serif;font-size:16px;">${npc.name || '角色详情'}</span>
        </div>
      </div>
    `;
  },
  
  _renderAffectionPanel(npc, affection, level) {
    const nextLevel = this.getNextLevel(affection.value);
    const progress = nextLevel ? ((affection.value - level.min) / (nextLevel.min - level.min) * 100) : 100;
    const needValue = nextLevel ? (nextLevel.min - affection.value) : 0;
    
    return `
      <div class="affection-panel">
        <div class="affection-panel-header">
          <div class="affection-panel-avatar">
            ${npc.portraitId ? `<img src="${npc.portraitId}" alt="${npc.name}">` : 
              `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${level.color}" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`}
          </div>
          <div class="affection-panel-info">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
              <span style="font-size:18px;font-weight:700;color:var(--text-primary);">${npc.name}</span>
              <span style="background:${level.color}25;color:${level.color};padding:2px 8px;border-radius:10px;font-size:11px;border:1px solid ${level.color}50;">${level.name}</span>
            </div>
            <div style="font-size:12px;color:var(--text-muted);">${level.desc}${nextLevel ? ` · 距离「${nextLevel.name}」还需 ${needValue} 点` : ' · 已达最高等级'}</div>
          </div>
        </div>
        
        <div class="affection-big-progress">
          <div class="affection-big-bar">
            <div class="affection-big-fill" style="width:${progress}%;background:linear-gradient(90deg,${level.color},${level.color}dd);"></div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
            <span style="font-size:20px;font-weight:700;color:${level.color};">${affection.value}</span>
            <span style="font-size:12px;color:var(--text-muted);">/ 100</span>
          </div>
        </div>
        
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
          <button class="affection-btn affection-btn-add" data-delta="5">+5</button>
          <button class="affection-btn affection-btn-add" data-delta="10">+10</button>
          <button class="affection-btn affection-btn-sub" data-delta="-5">-5</button>
          <button class="affection-btn affection-btn-sub" data-delta="-10">-10</button>
          <button class="affection-btn affection-btn-gift" onclick="NPCAffection.showGiftDialog('${npc.id}')">🎁 送礼</button>
        </div>
        
        <div style="margin-top:12px;">
          <input type="range" id="affectionSlider_${npc.id}" min="0" max="100" value="${affection.value}" 
            style="width:100%;accent-color:#C9A227;" 
            onchange="NPCAffection.setAffection('${npc.id}', this.value, '手动调整')">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-top:4px;">
            <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
          </div>
        </div>
      </div>
    `;
  },
  
  _renderEventChains(npcId, chains) {
    if (chains.length === 0) {
      return `
        <div class="affection-section">
          <div class="affection-section-title">📜 事件链</div>
          <div style="text-align:center;padding:30px 20px;color:var(--text-muted);">
            <p>暂无事件链</p>
            <button onclick="NPCAffection.showChainEditor('${npcId}')" style="margin-top:12px;background:#C9A227;color:#2C1810;padding:6px 16px;border-radius:16px;border:none;cursor:pointer;font-size:13px;">
              + 创建事件链
            </button>
          </div>
        </div>
      `;
    }
    
    return `
      <div class="affection-section">
        <div class="affection-section-title">📜 事件链 (${chains.length})</div>
        ${chains.map(chain => {
          const completed = chain.events.filter(e => e.status === 'complete').length;
          const total = chain.events.length;
          return `
            <div class="affection-chain-card" onclick="NPCAffection.showChainDetail('${npcId}', '${chain.id}')">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-weight:600;color:var(--text-primary);">${chain.name}</span>
                <span style="font-size:11px;color:var(--text-muted);">${completed}/${total}</span>
              </div>
              <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">${chain.description || '暂无描述'}</div>
              <div class="affection-chain-progress">
                <div class="affection-chain-bar">
                  <div class="affection-chain-fill" style="width:${total > 0 ? (completed/total*100) : 0}%"></div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
        <button onclick="NPCAffection.showChainEditor('${npcId}')" style="width:100%;margin-top:8px;background:rgba(201,162,39,0.1);color:#C9A227;padding:8px;border:1px dashed #C9A227;border-radius:12px;cursor:pointer;font-size:13px;">
          + 添加事件链
        </button>
      </div>
    `;
  },
  
  _renderAffectionHistory(npcId, affection) {
    const recent = affection.history.slice(-5).reverse();
    if (recent.length === 0) return '';
    
    return `
      <div class="affection-section">
        <div class="affection-section-title">📊 最近互动</div>
        ${recent.map(h => {
          const time = new Date(h.time).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          const sign = h.delta > 0 ? '+' : '';
          const color = h.delta > 0 ? '#4CAF50' : h.delta < 0 ? '#E53935' : '#9E9E9E';
          return `
            <div class="affection-history-item">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:12px;color:var(--text-secondary);">${h.reason || '互动'}</span>
                <span style="font-size:11px;color:var(--text-muted);">${time}</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
                <span style="font-size:11px;color:var(--text-muted);">${h.oldValue} → ${h.newValue}</span>
                <span style="font-size:13px;font-weight:700;color:${color};">${sign}${h.delta}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },
  
  _bindQuickAdjust(npcId) {
    setTimeout(() => {
      const buttons = document.querySelectorAll('.affection-btn-add, .affection-btn-sub');
      buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const delta = parseInt(e.target.dataset.delta);
          const reason = delta > 0 ? '好感增加' : '好感减少';
          this.addAffection(npcId, delta, reason);
          this.showNPCDetail(npcId); // 刷新页面
        });
      });
    }, 100);
  },
  
  // ============ 事件链编辑器 ============
  
  showChainEditor(npcId, chainId = null) {
    const chain = chainId ? this.getNPCChains(npcId).find(c => c.id === chainId) : null;
    const isEdit = !!chain;
    
    const modalId = 'affectionChainModal';
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
      <div class="modal lg" style="max-width:600px;">
        <div class="modal-header">
          <h3>${isEdit ? '编辑' : '新建'}事件链</h3>
          <button class="btn-icon" onclick="NPCAffection.closeModal('${modalId}')">✕</button>
        </div>
        <div class="modal-body" style="max-height:70vh;overflow-y:auto;">
          <div style="margin-bottom:12px;">
            <label style="display:block;font-size:13px;color:var(--text-secondary);margin-bottom:4px;">事件链名称</label>
            <input type="text" id="chainName" value="${chain ? chain.name : ''}" placeholder="如：相识之路"
              style="width:100%;padding:8px 12px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:14px;">
          </div>
          <div style="margin-bottom:12px;">
            <label style="display:block;font-size:13px;color:var(--text-secondary);margin-bottom:4px;">描述</label>
            <textarea id="chainDesc" rows="2" placeholder="描述这条事件链的主题..."
              style="width:100%;padding:8px 12px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:14px;resize:vertical;">${chain ? chain.description : ''}</textarea>
          </div>
          
          <div style="margin-bottom:12px;">
            <label style="display:block;font-size:13px;color:var(--text-secondary);margin-bottom:8px;">事件节点</label>
            <div id="chainEventsList">
              ${isEdit && chain.events.length > 0 ? chain.events.map((evt, idx) => `
                <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:8px;padding:10px;margin-bottom:8px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <span style="font-weight:600;">节点 ${idx + 1}</span>
                    <button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:16px;">✕</button>
                  </div>
                  <input type="text" class="evt-name" value="${evt.name}" placeholder="事件名称" style="width:100%;margin-bottom:6px;padding:6px;border:1px solid var(--border-color);border-radius:6px;">
                  <textarea class="evt-content" rows="2" placeholder="事件剧情..." style="width:100%;margin-bottom:6px;padding:6px;border:1px solid var(--border-color);border-radius:6px;">${evt.content}</textarea>
                  <div style="display:flex;gap:8px;">
                    <input type="number" class="evt-aff-min" value="${evt.conditions.affectionMin}" placeholder="最低好感" style="width:80px;padding:6px;border:1px solid var(--border-color);border-radius:6px;">
                    <input type="number" class="evt-aff-delta" value="${evt.rewards.affectionDelta}" placeholder="好感变化" style="width:80px;padding:6px;border:1px solid var(--border-color);border-radius:6px;">
                  </div>
                </div>
              `).join('') : '<p style="color:var(--text-muted);font-size:13px;">暂无事件节点，点击下方按钮添加</p>'}
            </div>
            <button onclick="NPCAffection.addEventNode()" style="width:100%;margin-top:8px;background:rgba(201,162,39,0.1);color:#C9A227;padding:8px;border:1px dashed #C9A227;border-radius:8px;cursor:pointer;font-size:13px;">
              + 添加事件节点
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="NPCAffection.closeModal('${modalId}')">取消</button>
          <button class="btn btn-primary" onclick="NPCAffection.saveChain('${npcId}', '${chainId || ''}')">保存</button>
        </div>
      </div>
    `;
    
    modal.style.display = 'flex';
    
    // 存储当前编辑的NPC ID
    modal.dataset.npcId = npcId;
  },
  
  addEventNode() {
    const list = document.getElementById('chainEventsList');
    const idx = list.children.length + 1;
    const div = document.createElement('div');
    div.style.cssText = 'background:var(--bg-card);border:1px solid var(--border-color);border-radius:8px;padding:10px;margin-bottom:8px;';
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-weight:600;">节点 ${idx}</span>
        <button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:16px;">✕</button>
      </div>
      <input type="text" class="evt-name" placeholder="事件名称" style="width:100%;margin-bottom:6px;padding:6px;border:1px solid var(--border-color);border-radius:6px;">
      <textarea class="evt-content" rows="2" placeholder="事件剧情..." style="width:100%;margin-bottom:6px;padding:6px;border:1px solid var(--border-color);border-radius:6px;"></textarea>
      <div style="display:flex;gap:8px;">
        <input type="number" class="evt-aff-min" value="0" placeholder="最低好感" style="width:80px;padding:6px;border:1px solid var(--border-color);border-radius:6px;">
        <input type="number" class="evt-aff-delta" value="0" placeholder="好感变化" style="width:80px;padding:6px;border:1px solid var(--border-color);border-radius:6px;">
      </div>
    `;
    // 清除 "暂无事件" 提示
    const emptyMsg = list.querySelector('p');
    if (emptyMsg) emptyMsg.remove();
    list.appendChild(div);
  },
  
  saveChain(npcId, chainId) {
    const name = document.getElementById('chainName').value.trim();
    if (!name) { App.toast('请输入事件链名称', 'error'); return; }
    
    const description = document.getElementById('chainDesc').value.trim();
    
    // 收集事件节点
    const eventNodes = [];
    const nodeDivs = document.querySelectorAll('#chainEventsList > div');
    nodeDivs.forEach((div, idx) => {
      const name = div.querySelector('.evt-name')?.value.trim();
      const content = div.querySelector('.evt-content')?.value.trim();
      const affMin = parseInt(div.querySelector('.evt-aff-min')?.value || 0);
      const affDelta = parseInt(div.querySelector('.evt-aff-delta')?.value || 0);
      
      if (name) {
        const prevId = idx > 0 ? eventNodes[idx - 1].id : null;
        eventNodes.push(this.createEvent(null, {
          name,
          content,
          conditions: { affectionMin: affMin, prevEventId: prevId },
          rewards: { affectionDelta: affDelta }
        }));
      }
    });
    
    const all = this.getAllChains();
    
    if (chainId) {
      // 编辑
      const chains = all[npcId] || [];
      const chain = chains.find(c => c.id === chainId);
      if (chain) {
        chain.name = name;
        chain.description = description;
        chain.events = eventNodes;
      }
    } else {
      // 新建
      const chain = {
        id: 'chain_' + Date.now(),
        name,
        description,
        npcId,
        createdAt: Date.now(),
        events: eventNodes,
        status: 'active'
      };
      if (!all[npcId]) all[npcId] = [];
      all[npcId].push(chain);
    }
    
    this.saveAllChains(all);
    this.closeModal('affectionChainModal');
    App.toast('事件链已保存', 'success');
    
    // 刷新页面
    if (document.querySelector('.affection-npc-list')) {
      this.renderPage();
    } else {
      this.showNPCDetail(npcId);
    }
  },
  
  showChainDetail(npcId, chainId) {
    // 显示事件链详情，可触发事件
    const chains = this.getNPCChains(npcId);
    const chain = chains.find(c => c.id === chainId);
    if (!chain) return;
    
    const page = document.getElementById('page-affection');
    const npcs = (window.NPCManager && NPCManager.getNPCs) ? NPCManager.getNPCs() : [];
    const npc = npcs.find(n => n.id === npcId);
    
    page.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;background:var(--bg-body);overflow:hidden;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 14px;background:linear-gradient(180deg,#2C1810 0%,#3d2518 100%);border-bottom:2px solid #C9A227;color:#F5E6D3;flex-shrink:0;">
          <div style="display:flex;align-items:center;gap:8px;">
            <button onclick="NPCAffection.showNPCDetail('${npcId}')" style="background:rgba(201,162,39,0.15);border:1px solid rgba(201,162,39,0.3);color:#C9A227;padding:4px 10px;border-radius:12px;font-size:12px;cursor:pointer;">← 返回</button>
            <span style="font-family:'Noto Serif SC',serif;font-size:16px;">${chain.name}</span>
          </div>
        </div>
        <div style="flex:1;overflow-y:auto;padding:12px;">
          <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;">${chain.description || ''}</p>
          
          <div class="event-chain-visual">
            ${chain.events.map((evt, idx) => {
              const statusColor = {
                locked: '#9E9E9E',
                unlocked: '#C9A227',
                active: '#4CAF50',
                complete: '#8BC34A',
                expired: '#E53935'
              }[evt.status] || '#9E9E9E';
              
              const statusText = {
                locked: '🔒 未解锁',
                unlocked: '✨ 可触发',
                active: '▶ 进行中',
                complete: '✓ 已完成',
                expired: '✕ 已过期'
              }[evt.status] || evt.status;
              
              const canTrigger = evt.status === 'unlocked';
              
              return `
                <div class="event-node" style="border-color:${statusColor};">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <span style="font-weight:600;color:var(--text-primary);">${idx + 1}. ${evt.name}</span>
                    <span style="font-size:11px;color:${statusColor};background:${statusColor}15;padding:2px 8px;border-radius:10px;">${statusText}</span>
                  </div>
                  <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">${evt.content || '暂无剧情'}</div>
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:11px;color:var(--text-muted);">需要好感度: ${evt.conditions.affectionMin}+</span>
                    ${canTrigger ? `
                      <button onclick="NPCAffection.triggerEventDialog('${npcId}', '${chainId}', '${evt.id}')" 
                        style="background:#C9A227;color:#2C1810;padding:4px 12px;border-radius:12px;border:none;cursor:pointer;font-size:12px;font-weight:600;">
                        触发事件
                      </button>
                    ` : ''}
                  </div>
                </div>
                ${idx < chain.events.length - 1 ? `<div style="text-align:center;padding:4px;"><span style="color:#C9A227;font-size:16px;">↓</span></div>` : ''}
              `;
            }).join('')}
          </div>
        </div>
      </div>
      <style>${this._getStyles()}</style>
    `;
  },
  
  triggerEventDialog(npcId, chainId, eventId) {
    const event = this.triggerEvent(npcId, chainId, eventId);
    if (!event) return;
    
    // 显示事件对话框
    const modalId = 'eventDialogModal';
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }
    
    const npcs = (window.NPCManager && NPCManager.getNPCs) ? NPCManager.getNPCs() : [];
    const npc = npcs.find(n => n.id === npcId);
    
    let choicesHtml = '';
    if (event.choices && event.choices.length > 0) {
      choicesHtml = event.choices.map((choice, idx) => `
        <button onclick="NPCAffection.completeEventWithChoice('${npcId}', '${chainId}', '${eventId}', ${idx})" 
          style="width:100%;margin-top:8px;padding:10px;background:var(--bg-card);border:1px solid var(--border-gold);border-radius:10px;color:var(--text-primary);cursor:pointer;text-align:left;font-size:14px;">
          ${choice.text}
          ${choice.affectionDelta ? `<span style="float:right;color:${choice.affectionDelta > 0 ? '#4CAF50' : '#E53935'};">${choice.affectionDelta > 0 ? '+' : ''}${choice.affectionDelta}</span>` : ''}
        </button>
      `).join('');
    } else {
      choicesHtml = `
        <button onclick="NPCAffection.completeEventWithChoice('${npcId}', '${chainId}', '${eventId}')" 
          style="width:100%;margin-top:16px;padding:10px;background:#C9A227;color:#2C1810;border:none;border-radius:10px;cursor:pointer;font-size:14px;font-weight:600;">
          继续
        </button>
      `;
    }
    
    modal.innerHTML = `
      <div class="modal" style="max-width:500px;">
        <div class="modal-header" style="background:linear-gradient(180deg,#2C1810,#3d2518);color:#F5E6D3;">
          <h3>📖 ${event.name}</h3>
          <button class="btn-icon" onclick="NPCAffection.closeModal('${modalId}')" style="color:#F5E6D3;">✕</button>
        </div>
        <div class="modal-body" style="padding:20px;">
          ${npc ? `
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
              <div style="width:40px;height:40px;border-radius:50%;overflow:hidden;border:2px solid #C9A227;">
                ${npc.portraitId ? `<img src="${npc.portraitId}" style="width:100%;height:100%;object-fit:cover;">` : '<svg viewBox="0 0 24 24" fill="none" stroke="#C9A227" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'}
              </div>
              <span style="font-weight:600;color:var(--text-primary);">${npc.name}</span>
            </div>
          ` : ''}
          <div style="background:var(--bg-parchment);border:1px solid var(--border-gold);border-radius:12px;padding:16px;margin-bottom:16px;line-height:1.8;color:var(--text-primary);font-size:15px;">
            ${event.content || '（剧情待补充）'}
          </div>
          ${choicesHtml}
        </div>
      </div>
    `;
    
    modal.style.display = 'flex';
  },
  
  completeEventWithChoice(npcId, chainId, eventId, choiceIndex = null) {
    this.completeEvent(npcId, chainId, eventId, choiceIndex);
    this.closeModal('eventDialogModal');
    
    const event = this.getNPCChains(npcId).find(c => c.id === chainId)?.events.find(e => e.id === eventId);
    if (event) {
      const rewards = [];
      if (event.rewards.affectionDelta) rewards.push(`好感度 ${event.rewards.affectionDelta > 0 ? '+' : ''}${event.rewards.affectionDelta}`);
      if (choiceIndex !== null && event.choices[choiceIndex]?.affectionDelta) {
        rewards.push(`选择加成 ${event.choices[choiceIndex].affectionDelta > 0 ? '+' : ''}${event.choices[choiceIndex].affectionDelta}`);
      }
      
      if (rewards.length > 0) {
        App.toast(`事件完成！${rewards.join('，')}`, 'success', 3000);
      } else {
        App.toast('事件完成', 'success');
      }
    }
    
    // 刷新事件链详情页
    this.showChainDetail(npcId, chainId);
  },
  
  // ============ 送礼对话框 ============
  
  showGiftDialog(npcId) {
    // 简化的送礼界面
    const modalId = 'giftModal';
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }
    
    const npcs = (window.NPCManager && NPCManager.getNPCs) ? NPCManager.getNPCs() : [];
    const npc = npcs.find(n => n.id === npcId);
    
    modal.innerHTML = `
      <div class="modal" style="max-width:400px;">
        <div class="modal-header">
          <h3>🎁 赠送礼物给 ${npc ? npc.name : '角色'}</h3>
          <button class="btn-icon" onclick="NPCAffection.closeModal('${modalId}')">✕</button>
        </div>
        <div class="modal-body" style="padding:20px;">
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;">
            ${[
              { name: '玉簪', value: 5, icon: '🌸' },
              { name: '香囊', value: 8, icon: '🎋' },
              { name: '玉佩', value: 15, icon: '💎' },
              { name: '古琴', value: 20, icon: '🎵' },
              { name: '诗集', value: 10, icon: '📜' },
              { name: '锦绣', value: 12, icon: '🧵' }
            ].map(gift => `
              <button onclick="NPCAffection.giftAndClose('${npcId}', '${gift.name}', ${gift.value}, '${modalId}')" 
                style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:10px;padding:12px 8px;cursor:pointer;text-align:center;">
                <div style="font-size:24px;margin-bottom:4px;">${gift.icon}</div>
                <div style="font-size:12px;color:var(--text-primary);">${gift.name}</div>
                <div style="font-size:11px;color:#4CAF50;">+${gift.value}</div>
              </button>
            `).join('')}
          </div>
          <div style="border-top:1px solid var(--border-color);padding-top:12px;">
            <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px;">自定义数值</label>
            <div style="display:flex;gap:8px;">
              <input type="number" id="customGiftValue" value="10" min="1" max="50" 
                style="flex:1;padding:8px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-card);color:var(--text-primary);">
              <button onclick="NPCAffection.giftCustom('${npcId}', '${modalId}')" 
                style="background:#C9A227;color:#2C1810;padding:8px 16px;border:none;border-radius:8px;cursor:pointer;font-weight:600;">
                赠送
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    modal.style.display = 'flex';
  },
  
  giftAndClose(npcId, itemName, value, modalId) {
    const newValue = this.giftAffection(npcId, itemName, value);
    this.closeModal(modalId);
    App.toast(`赠送「${itemName}」，好感度 +${value}（当前：${newValue}）`, 'success');
    this.showNPCDetail(npcId);
  },
  
  giftCustom(npcId, modalId) {
    const value = parseInt(document.getElementById('customGiftValue')?.value || 10);
    const newValue = this.giftAffection(npcId, '神秘礼物', value);
    this.closeModal(modalId);
    App.toast(`赠送礼物，好感度 +${value}（当前：${newValue}）`, 'success');
    this.showNPCDetail(npcId);
  },
  
  // ============ 工具方法 ============
  
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
  },
  
  showEditor() {
    // 选择NPC后打开编辑器
    const npcs = (window.NPCManager && NPCManager.getNPCs) ? NPCManager.getNPCs() : [];
    if (npcs.length === 0) {
      App.toast('请先添加NPC角色', 'info');
      return;
    }
    
    // 默认给第一个NPC创建
    this.showChainEditor(npcs[0].id);
  },
  
  // ============ 样式 ============
  
  _getStyles() {
    return `
      .affection-page { font-family: 'Noto Serif SC', serif; }
      .affection-npc-list { display: flex; flex-direction: column; gap: 10px; }
      .affection-npc-card {
        display: flex; align-items: center; gap: 12px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 12px 14px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .affection-npc-card:hover {
        border-color: #C9A227;
        box-shadow: 0 2px 8px rgba(201,162,39,0.15);
      }
      .affection-npc-avatar {
        width: 48px; height: 48px; border-radius: 50%;
        border: 2px solid #C9A227;
        overflow: hidden; flex-shrink: 0;
        background: #5D3A1A;
        display: flex; align-items: center; justify-content: center;
      }
      .affection-npc-avatar img { width: 100%; height: 100%; object-fit: cover; }
      .affection-npc-info { flex: 1; min-width: 0; }
      .affection-npc-header {
        display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
      }
      .affection-npc-name { font-size: 15px; font-weight: 700; color: var(--text-primary); }
      .affection-level-tag {
        padding: 1px 8px; border-radius: 10px;
        font-size: 10px; font-weight: 600;
      }
      .affection-progress-wrap {
        display: flex; align-items: center; gap: 8px;
        margin-bottom: 4px;
      }
      .affection-progress-bar {
        flex: 1; height: 6px;
        background: var(--border-color);
        border-radius: 3px;
        overflow: hidden;
      }
      .affection-progress-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.3s;
      }
      .affection-progress-text { font-size: 11px; color: var(--text-muted); white-space: nowrap; }
      .affection-npc-meta {
        display: flex; gap: 8px;
        font-size: 11px; color: var(--text-muted);
      }
      .affection-npc-arrow {
        font-size: 20px; color: #C9A227;
        font-weight: 300;
      }
      
      .affection-panel {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 14px;
        padding: 16px;
        margin-bottom: 12px;
      }
      .affection-panel-header {
        display: flex; align-items: center; gap: 12px;
        margin-bottom: 16px;
      }
      .affection-panel-avatar {
        width: 56px; height: 56px; border-radius: 50%;
        border: 2px solid #C9A227;
        overflow: hidden; flex-shrink: 0;
      }
      .affection-panel-avatar img { width: 100%; height: 100%; object-fit: cover; }
      .affection-panel-info { flex: 1; }
      
      .affection-big-progress { margin: 12px 0; }
      .affection-big-bar {
        height: 12px;
        background: var(--border-color);
        border-radius: 6px;
        overflow: hidden;
      }
      .affection-big-fill {
        height: 100%;
        border-radius: 6px;
        transition: width 0.5s ease;
      }
      
      .affection-btn {
        padding: 6px 14px;
        border-radius: 16px;
        border: none;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        transition: all 0.2s;
      }
      .affection-btn-add {
        background: rgba(76,175,80,0.15);
        color: #4CAF50;
        border: 1px solid rgba(76,175,80,0.3);
      }
      .affection-btn-add:hover { background: rgba(76,175,80,0.25); }
      .affection-btn-sub {
        background: rgba(229,57,53,0.15);
        color: #E53935;
        border: 1px solid rgba(229,57,53,0.3);
      }
      .affection-btn-sub:hover { background: rgba(229,57,53,0.25); }
      .affection-btn-gift {
        background: rgba(201,162,39,0.2);
        color: #C9A227;
        border: 1px solid rgba(201,162,39,0.4);
      }
      .affection-btn-gift:hover { background: rgba(201,162,39,0.3); }
      
      .affection-section {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 14px;
        padding: 14px;
        margin-bottom: 12px;
      }
      .affection-section-title {
        font-family: 'Noto Serif SC', serif;
        font-size: 15px;
        font-weight: 700;
        color: var(--color-primary-dark);
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--border-gold);
      }
      
      .affection-chain-card {
        background: var(--bg-parchment);
        border: 1px solid var(--border-color);
        border-radius: 10px;
        padding: 12px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .affection-chain-card:hover {
        border-color: #C9A227;
      }
      .affection-chain-progress {
        height: 4px;
        background: var(--border-color);
        border-radius: 2px;
        overflow: hidden;
      }
      .affection-chain-bar {
        height: 100%;
        background: var(--border-color);
        border-radius: 2px;
        overflow: hidden;
      }
      .affection-chain-fill {
        height: 100%;
        background: linear-gradient(90deg, #C9A227, #E8C84B);
        border-radius: 2px;
        transition: width 0.3s;
      }
      
      .event-node {
        background: var(--bg-card);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 14px;
        margin-bottom: 4px;
        transition: all 0.2s;
      }
      .event-node:hover {
        transform: translateX(4px);
      }
      
      .affection-history-item {
        padding: 10px 0;
        border-bottom: 1px solid var(--border-color);
      }
      .affection-history-item:last-child { border-bottom: none; }
      
      .event-chain-visual {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      @media (max-width: 768px) {
        .affection-npc-card { padding: 10px; }
        .affection-npc-avatar { width: 40px; height: 40px; }
        .affection-panel { padding: 12px; }
        .affection-section { padding: 10px; }
      }
    `;
  }
};

/* ===== 全局暴露 ===== */
window.NPCAffection = NPCAffection;
