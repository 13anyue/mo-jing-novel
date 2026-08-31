/**
 * =========================================================
 * EventSystem v6 — 事件系统
 * 模块名：EventSystem
 * 功能：触发式剧情事件管理
 * 支持：创建事件（名称、触发条件、描述、奖励）
 * 触发条件类型：时间到达、NPC好感度、物品拥有、地点访问、随机触发
 * 事件状态：未触发/进行中/已完成
 * 事件与NPC、场景、物品联动
 * =========================================================
 */
const EventSystem = {
  /**
   * 触发条件类型定义
   */
  TRIGGER_TYPES: [
    { id: 'time', name: '时间到达', icon: '⏰', desc: '游戏时间到达指定日期' },
    { id: 'affection', name: 'NPC好感度', icon: '❤️', desc: '指定NPC好感度达到阈值' },
    { id: 'item', name: '物品拥有', icon: '📦', desc: '拥有特定物品或数量' },
    { id: 'location', name: '地点访问', icon: '📍', desc: '访问过指定地点' },
    { id: 'random', name: '随机触发', icon: '🎲', desc: '满足条件时随机概率触发' },
    { id: 'story', name: '剧情进度', icon: '📖', desc: '完成特定剧情章节' },
    { id: 'achievement', name: '成就解锁', icon: '🏆', desc: '解锁特定成就后触发' }
  ],

  /**
   * 事件状态定义
   */
  STATUS: {
    UNTIGGERED: 'untriggered',
    ACTIVE: 'active',
    COMPLETED: 'completed'
  },

  /**
   * 事件模板库（零预设）
   */
  TEMPLATES: [],

  _filterType: 'all',
  _filterStatus: 'all',

  /**
   * 初始化模块：渲染页面
   */
  init() {
    this.renderPage();
  },

  /**
   * 进入页面时刷新列表
   */
  onEnter() {
    this.renderEvents();
  },

  /**
   * 从Storage读取事件数据
   */
  _getData() {
    return Storage.get('events_v7', { events: [] });
  },

  /**
   * 保存事件数据到Storage
   */
  _saveData(data) {
    Storage.set('events_v7', data);
  },

  /**
   * 获取所有事件
   */
  getEvents() {
    return this._getData().events || [];
  },

  /**
   * 创建新事件
   */
  createEvent(title, description, type, trigger, reward, linkedNpcId, linkedSceneId) {
    const data = this._getData();
    const event = {
      id: 'evt_' + Date.now(),
      title,
      description,
      type,
      trigger,
      reward: reward || '',
      linkedNpcId: linkedNpcId || '',
      linkedSceneId: linkedSceneId || '',
      status: this.STATUS.UNTIGGERED,
      createdAt: Date.now(),
      triggeredAt: null,
      completedAt: null
    };
    data.events.push(event);
    this._saveData(data);
    this.renderEvents();
    App.toast(`事件已创建：${title}`, 'success');
    return event;
  },

  /**
   * 删除事件
   */
  deleteEvent(eventId) {
    const data = this._getData();
    data.events = data.events.filter(e => e.id !== eventId);
    this._saveData(data);
    this.renderEvents();
    App.toast('事件已删除', 'info');
  },

  /**
   * 更新事件状态
   */
  updateStatus(eventId, status) {
    const data = this._getData();
    const event = data.events.find(e => e.id === eventId);
    if (!event) return false;
    event.status = status;
    if (status === this.STATUS.ACTIVE && !event.triggeredAt) {
      event.triggeredAt = Date.now();
    }
    if (status === this.STATUS.COMPLETED && !event.completedAt) {
      event.completedAt = Date.now();
    }
    this._saveData(data);
    this.renderEvents();
    return true;
  },

  /**
   * 手动触发事件（用于测试或GM模式）
   */
  manualTrigger(eventId) {
    const event = this.getEvents().find(e => e.id === eventId);
    if (!event) return;
    if (event.status !== this.STATUS.UNTIGGERED) {
      App.toast('该事件已经触发或完成', 'error');
      return;
    }
    this.updateStatus(eventId, this.STATUS.ACTIVE);
    App.toast(`🎉 事件触发：${event.title}`, 'success', 5000);
    if (event.reward) {
      App.toast(`获得奖励：${event.reward}`, 'info', 4000);
    }
    // 通过EventBridge通知其他模块
    if (window.EventBridge) {
      EventBridge.emit('event', 'triggered', { eventId, title: event.title }, 'EventSystem');
    }
  },

  /**
   * 完成事件
   */
  completeEvent(eventId) {
    const updated = this.updateStatus(eventId, this.STATUS.COMPLETED);
    if (updated) {
      const event = this.getEvents().find(e => e.id === eventId);
      App.toast(`✅ 事件完成：${event?.title || ''}`, 'success');
      if (event && event.reward) {
        App.toast(`🎁 获得奖励：${event.reward}`, 'success', 4000);
      }
    }
  },

  /**
   * 检查所有事件的触发条件
   * 应在游戏循环或关键操作后调用
   */
  checkTriggers(context) {
    const data = this._getData();
    const now = new Date();
    const triggered = [];

    data.events.forEach(ev => {
      if (ev.status !== this.STATUS.UNTIGGERED) return;
      const trigger = ev.trigger;
      if (!trigger) return;

      let shouldTrigger = false;
      switch (trigger.type) {
        case 'time': {
          // 检查时间条件（需要TimelineSystem配合）
          const timeline = Storage.get('timeline_v7', {});
          if (timeline.year > trigger.year ||
              (timeline.year === trigger.year && timeline.month > trigger.month) ||
              (timeline.year === trigger.year && timeline.month === trigger.month && timeline.day > trigger.day) ||
              (timeline.year === trigger.year && timeline.month === trigger.month && timeline.day === trigger.day && timeline.hour >= trigger.hour)) {
            shouldTrigger = true;
          }
          break;
        }
        case 'affection': {
          // 检查NPC好感度
          const relations = Storage.get('relations_data', []);
          const relation = relations.find(r => r.npcId === trigger.npcId);
          if (relation && (relation.affection || 0) >= (trigger.threshold || 0)) {
            shouldTrigger = true;
          }
          break;
        }
        case 'item': {
          // 检查物品拥有
          const inventory = Storage.get('inventory_items', []);
          const item = inventory.find(i => i.id === trigger.itemId);
          if (item && (item.quantity || 0) >= (trigger.quantity || 1)) {
            shouldTrigger = true;
          }
          break;
        }
        case 'location': {
          // 检查地点访问
          const visited = Storage.get('visited_locations', []);
          if (visited.includes(trigger.locationId)) {
            shouldTrigger = true;
          }
          break;
        }
        case 'random': {
          // 随机触发，需要配合前置条件
          if (trigger.chance && Math.random() < trigger.chance) {
            shouldTrigger = true;
          }
          break;
        }
        case 'story': {
          // 检查剧情进度
          const stories = Storage.get('storylines_v6', []);
          const story = stories.find(s => s.id === trigger.storyId);
          if (story) {
            const chapter = story.chapters?.find(c => c.id === trigger.chapterId);
            if (chapter && chapter.completed) {
              shouldTrigger = true;
            }
          }
          break;
        }
        case 'achievement': {
          // 检查成就
          const achievements = Storage.get('achievements_unlocked_v6', []);
          if (achievements.includes(trigger.achievementId)) {
            shouldTrigger = true;
          }
          break;
        }
      }

      if (shouldTrigger) {
        ev.status = this.STATUS.ACTIVE;
        ev.triggeredAt = Date.now();
        triggered.push(ev);
      }
    });

    if (triggered.length > 0) {
      this._saveData(data);
      triggered.forEach(ev => {
        App.toast(`🎉 事件触发：${ev.title}`, 'success', 5000);
        if (ev.reward) {
          App.toast(`💰 奖励：${ev.reward}`, 'info', 4000);
        }
        if (window.EventBridge) {
          EventBridge.emit('event', 'triggered', { eventId: ev.id, title: ev.title }, 'EventSystem');
        }
      });
      this.renderEvents();
    }

    return triggered;
  },

  /**
   * 渲染页面主结构
   */
  renderPage() {
    const page = document.getElementById('page-events');
    if (!page) return;
    page.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
      <div style="padding:var(--space-lg);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:8px;">
          <h2 class="section-title">🎭 事件系统</h2>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="EventSystem.showCreateModal()">➕ 创建事件</button>
            <button class="btn btn-secondary" onclick="EventSystem.checkTriggers()">🔍 检查触发</button>
            <button class="btn btn-sm btn-secondary" onclick="EventSystem.showTemplateModal()">📋 模板</button>
          </div>
        </div>

        <!-- 筛选栏 -->
        <div style="display:flex;gap:8px;margin-bottom:var(--space-md);flex-wrap:wrap;align-items:center;">
          <span style="font-size:13px;color:var(--text-muted);">条件类型：</span>
          <select id="eventFilterType" onchange="EventSystem.setFilterType(this.value)" style="padding:4px 8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);font-size:13px;">
            <option value="all">全部</option>
            ${this.TRIGGER_TYPES.map(t => `<option value="${t.id}">${t.icon} ${t.name}</option>`).join('')}
          </select>
          <span style="font-size:13px;color:var(--text-muted);margin-left:8px;">状态：</span>
          <select id="eventFilterStatus" onchange="EventSystem.setFilterStatus(this.value)" style="padding:4px 8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);font-size:13px;">
            <option value="all">全部</option>
            <option value="untriggered">未触发</option>
            <option value="active">进行中</option>
            <option value="completed">已完成</option>
          </select>
          <input type="text" id="eventSearch" placeholder="搜索事件..." oninput="EventSystem.renderEvents()" style="padding:4px 8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);font-size:13px;flex:1;min-width:120px;">
        </div>

        <!-- 事件列表 -->
        <div id="eventsList"></div>

        <!-- 统计 -->
        <div style="margin-top:var(--space-md);padding:12px;background:var(--bg-sidebar);border-radius:8px;display:flex;gap:16px;flex-wrap:wrap;">
          <span style="font-size:13px;color:var(--text-muted);">总事件：<strong id="statTotal" style="color:var(--text-primary);">0</strong></span>
          <span style="font-size:13px;color:var(--text-muted);">未触发：<strong id="statUntriggered" style="color:var(--text-secondary);">0</strong></span>
          <span style="font-size:13px;color:var(--text-muted);">进行中：<strong id="statActive" style="color:var(--color-primary);">0</strong></span>
          <span style="font-size:13px;color:var(--text-muted);">已完成：<strong id="statCompleted" style="color:var(--color-gold);">0</strong></span>
        </div>
      </div>
    `;
    this.renderEvents();
  },

  setFilterType(type) {
    this._filterType = type;
    this.renderEvents();
  },

  setFilterStatus(status) {
    this._filterStatus = status;
    this.renderEvents();
  },

  renderEvents() {
    const container = document.getElementById('eventsList');
    if (!container) return;
    let events = this.getEvents();
    const searchTerm = (document.getElementById('eventSearch')?.value || '').toLowerCase();

    // 筛选条件类型
    if (this._filterType !== 'all') {
      events = events.filter(e => e.trigger && e.trigger.type === this._filterType);
    }
    // 筛选状态
    if (this._filterStatus !== 'all') {
      events = events.filter(e => e.status === this._filterStatus);
    }
    // 搜索
    if (searchTerm) {
      events = events.filter(e => (e.title + e.description).toLowerCase().includes(searchTerm));
    }

    // 更新统计
    const all = this.getEvents();
    const statTotal = document.getElementById('statTotal');
    const statUntriggered = document.getElementById('statUntriggered');
    const statActive = document.getElementById('statActive');
    const statCompleted = document.getElementById('statCompleted');
    if (statTotal) statTotal.textContent = all.length;
    if (statUntriggered) statUntriggered.textContent = all.filter(e => e.status === this.STATUS.UNTIGGERED).length;
    if (statActive) statActive.textContent = all.filter(e => e.status === this.STATUS.ACTIVE).length;
    if (statCompleted) statCompleted.textContent = all.filter(e => e.status === this.STATUS.COMPLETED).length;

    if (events.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div style="font-size:32px;margin-bottom:8px;">🍃</div>
          <p>暂无符合条件的事件</p>
          <p style="font-size:12px;color:var(--text-muted);">点击"创建事件"或"模板"开始</p>
        </div>
      `;
      return;
    }

    container.innerHTML = events.map(ev => {
      const triggerType = this.TRIGGER_TYPES.find(t => t.id === (ev.trigger?.type || '')) || { name: '未知', icon: '❓' };
      const statusColors = {
        [this.STATUS.UNTIGGERED]: { bg: 'var(--bg-sidebar)', border: 'var(--border-color)', label: '⏳ 未触发' },
        [this.STATUS.ACTIVE]: { bg: 'var(--color-primary)11', border: 'var(--color-primary)', label: '🔥 进行中' },
        [this.STATUS.COMPLETED]: { bg: 'var(--color-gold)11', border: 'var(--color-gold)', label: '✅ 已完成' }
      };
      const sc = statusColors[ev.status] || statusColors[this.STATUS.UNTIGGERED];
      return `
        <div class="card" style="margin-bottom:var(--space-sm);border-left:4px solid ${sc.border};">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:18px;">${triggerType.icon}</span>
              <h3 style="font-size:15px;margin:0;">${ev.title}</h3>
              <span style="font-size:11px;padding:2px 8px;border-radius:10px;background:${sc.bg};border:1px solid ${sc.border};color:var(--text-muted);">${sc.label}</span>
            </div>
            <div style="display:flex;gap:4px;">
              ${ev.status === this.STATUS.UNTIGGERED ? `<button class="btn btn-sm btn-primary" onclick="EventSystem.manualTrigger('${ev.id}')">⚡ 触发</button>` : ''}
              ${ev.status === this.STATUS.ACTIVE ? `<button class="btn btn-sm btn-gold" onclick="EventSystem.completeEvent('${ev.id}')">✅ 完成</button>` : ''}
              <button class="btn btn-sm btn-secondary" onclick="EventSystem.showDetailModal('${ev.id}')">详情</button>
              <button class="btn btn-sm btn-danger" onclick="EventSystem.deleteEvent('${ev.id}')">删除</button>
            </div>
          </div>
          <div class="card-body">
            <p style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;">${ev.description || '无描述'}</p>
            <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--text-muted);">
              <span>📌 触发：${triggerType.name}</span>
              ${ev.reward ? `<span>🎁 奖励：${ev.reward}</span>` : ''}
              ${ev.linkedNpcId ? `<span>👤 NPC：${ev.linkedNpcId}</span>` : ''}
              ${ev.linkedSceneId ? `<span>📍 场景：${ev.linkedSceneId}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  showCreateModal() {
    const content = `
      <div style="display:flex;flex-direction:column;gap:12px;max-height:60vh;overflow-y:auto;">
        <input type="text" id="evtTitle" placeholder="事件名称 *" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <textarea id="evtDesc" placeholder="事件描述" rows="3" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);resize:vertical;"></textarea>
        <div>
          <label style="font-size:13px;display:block;margin-bottom:4px;">触发条件类型</label>
          <select id="evtTriggerType" onchange="EventSystem.updateTriggerForm()" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);width:100%;">
            ${this.TRIGGER_TYPES.map(t => `<option value="${t.id}">${t.icon} ${t.name}</option>`).join('')}
          </select>
        </div>
        <div id="evtTriggerForm" style="display:flex;flex-direction:column;gap:8px;">
          <!-- 动态表单 -->
        </div>
        <input type="text" id="evtReward" placeholder="奖励（可选）" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <input type="text" id="evtNpcId" placeholder="关联NPC ID（可选）" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <input type="text" id="evtSceneId" placeholder="关联场景 ID（可选）" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <button class="btn btn-primary" onclick="EventSystem.saveEvent()">💾 创建事件</button>
      </div>
    `;
    App.showModal('➕ 创建事件', content, true);
    // 初始化触发条件表单
    setTimeout(() => this.updateTriggerForm(), 50);
  },

  updateTriggerForm() {
    const type = document.getElementById('evtTriggerType')?.value || 'time';
    const container = document.getElementById('evtTriggerForm');
    if (!container) return;

    const forms = {
      time: `
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">
          <input type="number" id="trgYear" value="1" min="1" placeholder="年" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
          <input type="number" id="trgMonth" value="1" min="1" max="12" placeholder="月" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
          <input type="number" id="trgDay" value="1" min="1" max="30" placeholder="日" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
          <input type="number" id="trgHour" value="0" min="0" max="23" placeholder="时" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        </div>
      `,
      affection: `
        <input type="text" id="trgNpcId" placeholder="NPC ID" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <input type="number" id="trgThreshold" value="50" min="0" placeholder="好感度阈值" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
      `,
      item: `
        <input type="text" id="trgItemId" placeholder="物品 ID" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <input type="number" id="trgQuantity" value="1" min="1" placeholder="数量" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
      `,
      location: `
        <input type="text" id="trgLocationId" placeholder="地点 ID" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
      `,
      random: `
        <input type="number" id="trgChance" value="0.3" min="0" max="1" step="0.1" placeholder="触发概率 (0-1)" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <input type="text" id="trgPrecondition" placeholder="前置条件（可选）" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
      `,
      story: `
        <input type="text" id="trgStoryId" placeholder="故事线 ID" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <input type="text" id="trgChapterId" placeholder="章节 ID" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
      `,
      achievement: `
        <input type="text" id="trgAchievementId" placeholder="成就 ID" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
      `
    };
    container.innerHTML = forms[type] || forms.time;
  },

  saveEvent() {
    const title = document.getElementById('evtTitle')?.value;
    const description = document.getElementById('evtDesc')?.value || '';
    const type = document.getElementById('evtTriggerType')?.value || 'time';
    const reward = document.getElementById('evtReward')?.value || '';
    const linkedNpcId = document.getElementById('evtNpcId')?.value || '';
    const linkedSceneId = document.getElementById('evtSceneId')?.value || '';

    if (!title) {
      App.toast('请输入事件名称', 'error');
      return;
    }

    let trigger = { type };
    switch (type) {
      case 'time':
        trigger.year = parseInt(document.getElementById('trgYear')?.value) || 1;
        trigger.month = parseInt(document.getElementById('trgMonth')?.value) || 1;
        trigger.day = parseInt(document.getElementById('trgDay')?.value) || 1;
        trigger.hour = parseInt(document.getElementById('trgHour')?.value) || 0;
        break;
      case 'affection':
        trigger.npcId = document.getElementById('trgNpcId')?.value || '';
        trigger.threshold = parseInt(document.getElementById('trgThreshold')?.value) || 50;
        break;
      case 'item':
        trigger.itemId = document.getElementById('trgItemId')?.value || '';
        trigger.quantity = parseInt(document.getElementById('trgQuantity')?.value) || 1;
        break;
      case 'location':
        trigger.locationId = document.getElementById('trgLocationId')?.value || '';
        break;
      case 'random':
        trigger.chance = parseFloat(document.getElementById('trgChance')?.value) || 0.3;
        trigger.precondition = document.getElementById('trgPrecondition')?.value || '';
        break;
      case 'story':
        trigger.storyId = document.getElementById('trgStoryId')?.value || '';
        trigger.chapterId = document.getElementById('trgChapterId')?.value || '';
        break;
      case 'achievement':
        trigger.achievementId = document.getElementById('trgAchievementId')?.value || '';
        break;
    }

    this.createEvent(title, description, type, trigger, reward, linkedNpcId, linkedSceneId);
    App.closeModal();
  },

  showDetailModal(eventId) {
    const event = this.getEvents().find(e => e.id === eventId);
    if (!event) return;
    const triggerType = this.TRIGGER_TYPES.find(t => t.id === (event.trigger?.type || '')) || { name: '未知', icon: '❓' };
    const statusLabels = {
      [this.STATUS.UNTIGGERED]: '⏳ 未触发',
      [this.STATUS.ACTIVE]: '🔥 进行中',
      [this.STATUS.COMPLETED]: '✅ 已完成'
    };
    const content = `
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:24px;">${triggerType.icon}</span>
          <h3 style="margin:0;font-size:18px;">${event.title}</h3>
        </div>
        <div style="font-size:13px;color:var(--text-muted);">
          状态：${statusLabels[event.status] || '未知'}
        </div>
        <p style="font-size:14px;color:var(--text-secondary);line-height:1.6;">${event.description || '无描述'}</p>
        <div style="background:var(--bg-sidebar);padding:10px;border-radius:6px;">
          <div style="font-size:13px;font-weight:600;margin-bottom:6px;">触发条件</div>
          <div style="font-size:12px;color:var(--text-muted);font-family:monospace;white-space:pre-wrap;">${JSON.stringify(event.trigger, null, 2)}</div>
        </div>
        ${event.reward ? `<div style="font-size:13px;">🎁 奖励：<span style="color:var(--color-gold);">${event.reward}</span></div>` : ''}
        ${event.linkedNpcId ? `<div style="font-size:13px;">👤 关联NPC：${event.linkedNpcId}</div>` : ''}
        ${event.linkedSceneId ? `<div style="font-size:13px;">📍 关联场景：${event.linkedSceneId}</div>` : ''}
        <div style="font-size:12px;color:var(--text-muted);margin-top:8px;">
          创建：${new Date(event.createdAt).toLocaleString()}
          ${event.triggeredAt ? `<br>触发：${new Date(event.triggeredAt).toLocaleString()}` : ''}
          ${event.completedAt ? `<br>完成：${new Date(event.completedAt).toLocaleString()}` : ''}
        </div>
      </div>
    `;
    App.showModal('📋 事件详情', content);
  },

  showTemplateModal() {
    const content = `
      <div style="display:flex;flex-direction:column;gap:10px;max-height:50vh;overflow-y:auto;">
        ${this.TEMPLATES.map((t, i) => `
          <div style="padding:10px;border:1px solid var(--border-color);border-radius:6px;cursor:pointer;" onclick="EventSystem.applyTemplate(${i})" onmouseover="this.style.background='var(--bg-sidebar)'" onmouseout="this.style.background=''">
            <div style="font-size:14px;font-weight:600;margin-bottom:4px;">${t.title}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">${t.desc}</div>
            <div style="font-size:12px;color:var(--text-secondary);">🎁 ${t.reward}</div>
          </div>
        `).join('')}
      </div>
    `;
    App.showModal('📋 事件模板', content);
  },

  applyTemplate(index) {
    const t = this.TEMPLATES[index];
    if (!t) return;
    this.createEvent(t.title, t.desc, t.type, t.trigger, t.reward);
    App.closeModal();
  }
};
