/**
 * =========================================================
 * TimelineSystem v6 — 世界时间线
 * 模块名：TimelineSystem
 * 功能：记录剧情中的时间推进，类似日历系统
 * 支持：年月日设置、十二时辰（子丑寅卯）、四季、天气
 * 时间事件：到达特定时间触发事件提示
 * 时间相关的NPC行为（某些NPC只在特定时间出现）
 * =========================================================
 */
const TimelineSystem = {
  /**
   * 十二时辰对照表
   * 每个时辰对应现代时间的2小时区间
   */
  SHICHEN: [
    { id: 'zi', name: '子时', label: '夜半', startHour: 0, endHour: 1, desc: '夜深人静，万物沉寂' },
    { id: 'chou', name: '丑时', label: '鸡鸣', startHour: 1, endHour: 3, desc: '雄鸡初鸣，天色未明' },
    { id: 'yin', name: '寅时', label: '平旦', startHour: 3, endHour: 5, desc: '黎明破晓，晨光熹微' },
    { id: 'mao', name: '卯时', label: '日出', startHour: 5, endHour: 7, desc: '旭日东升，霞光万道' },
    { id: 'chen', name: '辰时', label: '食时', startHour: 7, endHour: 9, desc: '早餐时分，万物复苏' },
    { id: 'si', name: '巳时', label: '隅中', startHour: 9, endHour: 11, desc: '临近中午，阳光正盛' },
    { id: 'wu', name: '午时', label: '日中', startHour: 11, endHour: 13, desc: '正午时分，烈日当空' },
    { id: 'wei', name: '未时', label: '日昳', startHour: 13, endHour: 15, desc: '午后时光，阳气渐收' },
    { id: 'shen', name: '申时', label: '晡时', startHour: 15, endHour: 17, desc: '黄昏将近，日影西斜' },
    { id: 'you', name: '酉时', label: '日入', startHour: 17, endHour: 19, desc: '夕阳西下，倦鸟归林' },
    { id: 'xu', name: '戌时', label: '黄昏', startHour: 19, endHour: 21, desc: '暮色四合，万家灯火' },
    { id: 'hai', name: '亥时', label: '人定', startHour: 21, endHour: 23, desc: '夜深人静，安枕而眠' }
  ],

  /**
   * 四季定义
   */
  SEASONS: [
    { id: 'spring', name: '春', months: [1, 2, 3], desc: '春暖花开，万物复苏' },
    { id: 'summer', name: '夏', months: [4, 5, 6], desc: '骄阳似火，绿树成荫' },
    { id: 'autumn', name: '秋', months: [7, 8, 9], desc: '金风送爽，硕果累累' },
    { id: 'winter', name: '冬', months: [10, 11, 12], desc: '瑞雪纷飞，银装素裹' }
  ],

  /**
   * 天气类型
   */
  WEATHERS: [
    { id: 'sunny', name: '晴朗', icon: '☀️', desc: '万里无云，碧空如洗' },
    { id: 'cloudy', name: '多云', icon: '⛅', desc: '云卷云舒，天光变幻' },
    { id: 'overcast', name: '阴天', icon: '☁️', desc: '阴云密布，不见天日' },
    { id: 'rain', name: '雨天', icon: '🌧️', desc: '细雨绵绵，润物无声' },
    { id: 'heavyRain', name: '暴雨', icon: '⛈️', desc: '大雨倾盆，电闪雷鸣' },
    { id: 'snow', name: '雪天', icon: '❄️', desc: '雪花飘飘，银装素裹' },
    { id: 'fog', name: '雾天', icon: '🌫️', desc: '大雾弥漫，伸手不见五指' },
    { id: 'windy', name: '大风', icon: '🌬️', desc: '狂风呼啸，飞沙走石' }
  ],

  /**
   * 农历月份别名（用于古风氛围）
   */
  LUNAR_MONTHS: ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'],

  _autoTimer: null,

  /**
   * 初始化模块：渲染页面并恢复自动推进设置
   */
  init() {
    this.renderPage();
    const data = this._getData();
    if (data.autoAdvance) {
      this.startAutoAdvance();
    }
  },

  /**
   * 进入页面时重新渲染
   */
  onEnter() {
    this.renderCalendar();
    this.renderTimeline();
    this.renderEvents();
    this.renderNPCSchedule();
  },

  /**
   * 从Storage读取时间线数据
   */
  _getData() {
    const defaultData = {
      year: 1,
      month: 1,
      day: 1,
      hour: 8,
      minute: 0,
      weather: 'sunny',
      autoAdvance: false,
      advanceInterval: 30,
      history: [],
      timeEvents: [],
      npcSchedule: []
    };
    return Storage.get('timeline_v7', defaultData);
  },

  /**
   * 保存时间线数据到Storage
   */
  _saveData(data) {
    Storage.set('timeline_v7', data);
  },

  /**
   * 获取当前季节
   */
  getCurrentSeason() {
    const data = this._getData();
    return this.SEASONS.find(s => s.months.includes(data.month)) || this.SEASONS[0];
  },

  /**
   * 获取当前时辰
   */
  getCurrentShichen() {
    const data = this._getData();
    const hour = data.hour;
    return this.SHICHEN.find(s => hour >= s.startHour && hour <= s.endHour) || this.SHICHEN[0];
  },

  /**
   * 获取当前天气
   */
  getCurrentWeather() {
    const data = this._getData();
    return this.WEATHERS.find(w => w.id === data.weather) || this.WEATHERS[0];
  },

  /**
   * 推进时间（支持手动和自动）
   * @param {number} hours - 推进的小时数
   * @param {boolean} silent - 是否静默推进（不弹提示）
   */
  advanceTime(hours = 1, silent = false) {
    const data = this._getData();
    let totalMinutes = data.hour * 60 + data.minute + hours * 60;

    // 处理跨天
    while (totalMinutes >= 24 * 60) {
      totalMinutes -= 24 * 60;
      data.day += 1;
      // 处理跨月（简化：每月30天）
      if (data.day > 30) {
        data.day = 1;
        data.month += 1;
        if (data.month > 12) {
          data.month = 1;
          data.year += 1;
        }
      }
    }

    data.hour = Math.floor(totalMinutes / 60);
    data.minute = totalMinutes % 60;

    // 记录历史
    data.history.push({
      year: data.year,
      month: data.month,
      day: data.day,
      hour: data.hour,
      minute: data.minute,
      note: `时间推进 ${hours} 小时`,
      timestamp: Date.now()
    });
    // 只保留最近100条历史
    if (data.history.length > 100) {
      data.history = data.history.slice(-100);
    }

    this._saveData(data);
    this.renderCalendar();
    this.renderTimeline();

    // 检查时间事件
    this._checkTimeEvents();

    if (!silent) {
      const shichen = this.getCurrentShichen();
      App.toast(`时间推进：第${data.year}年 ${data.month}月${data.day}日 ${shichen.name}`, 'info');
    }

    return data;
  },

  /**
   * 设置具体日期时间
   */
  setDateTime(year, month, day, hour, minute) {
    const data = this._getData();
    data.year = Math.max(1, parseInt(year) || 1);
    data.month = Math.max(1, Math.min(12, parseInt(month) || 1));
    data.day = Math.max(1, Math.min(30, parseInt(day) || 1));
    data.hour = Math.max(0, Math.min(23, parseInt(hour) || 0));
    data.minute = Math.max(0, Math.min(59, parseInt(minute) || 0));
    this._saveData(data);
    this.renderCalendar();
    this.renderTimeline();
    App.toast(`时间已设置为：第${data.year}年 ${data.month}月${data.day}日`, 'success');
  },

  /**
   * 设置天气
   */
  setWeather(weatherId) {
    const data = this._getData();
    const weather = this.WEATHERS.find(w => w.id === weatherId);
    if (!weather) {
      App.toast('天气类型无效', 'error');
      return;
    }
    data.weather = weatherId;
    this._saveData(data);
    this.renderCalendar();
    App.toast(`天气变为：${weather.name} ${weather.icon}`, 'success');
  },

  /**
   * 随机天气变化
   */
  randomWeather() {
    const weights = { sunny: 30, cloudy: 20, overcast: 15, rain: 15, heavyRain: 5, snow: 5, fog: 5, windy: 5 };
    let total = 0;
    const entries = Object.entries(weights);
    entries.forEach(([, w]) => { total += w; });
    let r = Math.random() * total;
    for (const [id, w] of entries) {
      r -= w;
      if (r <= 0) {
        this.setWeather(id);
        return;
      }
    }
    this.setWeather('sunny');
  },

  /**
   * 开启自动推进
   */
  startAutoAdvance() {
    const data = this._getData();
    data.autoAdvance = true;
    this._saveData(data);
    if (this._autoTimer) {
      clearInterval(this._autoTimer);
    }
    // 每隔设定分钟数（实际秒数模拟）推进1小时
    const intervalMs = (data.advanceInterval || 30) * 1000;
    this._autoTimer = setInterval(() => {
      this.advanceTime(1, true);
    }, intervalMs);
    App.toast('自动时间推进已开启', 'success');
  },

  /**
   * 停止自动推进
   */
  stopAutoAdvance() {
    const data = this._getData();
    data.autoAdvance = false;
    this._saveData(data);
    if (this._autoTimer) {
      clearInterval(this._autoTimer);
      this._autoTimer = null;
    }
    App.toast('自动时间推进已停止', 'info');
  },

  /**
   * 添加时间事件
   */
  addTimeEvent(title, year, month, day, hour, callback) {
    const data = this._getData();
    const event = {
      id: 'te_' + Date.now(),
      title,
      year: parseInt(year) || 1,
      month: parseInt(month) || 1,
      day: parseInt(day) || 1,
      hour: parseInt(hour) || 0,
      triggered: false,
      createdAt: Date.now()
    };
    data.timeEvents.push(event);
    this._saveData(data);
    App.toast(`时间事件已添加：${title}`, 'success');
    this.renderEvents();
  },

  /**
   * 删除时间事件
   */
  deleteTimeEvent(eventId) {
    const data = this._getData();
    data.timeEvents = data.timeEvents.filter(e => e.id !== eventId);
    this._saveData(data);
    this.renderEvents();
    App.toast('时间事件已删除', 'info');
  },

  /**
   * 检查时间事件是否到达触发条件
   */
  _checkTimeEvents() {
    const data = this._getData();
    const triggered = [];
    data.timeEvents.forEach(ev => {
      if (ev.triggered) return;
      if (data.year > ev.year ||
          (data.year === ev.year && data.month > ev.month) ||
          (data.year === ev.year && data.month === ev.month && data.day > ev.day) ||
          (data.year === ev.year && data.month === ev.month && data.day === ev.day && data.hour >= ev.hour)) {
        ev.triggered = true;
        triggered.push(ev);
      }
    });
    if (triggered.length > 0) {
      this._saveData(data);
      triggered.forEach(ev => {
        App.toast(`⏰ 时间事件触发：${ev.title}`, 'success', 5000);
      });
      this.renderEvents();
    }
  },

  /**
   * 设置NPC时间表
   */
  setNPCSchedule(npcId, npcName, shichenIds, location) {
    const data = this._getData();
    const existing = data.npcSchedule.find(s => s.npcId === npcId);
    if (existing) {
      existing.shichenIds = shichenIds;
      existing.location = location;
      existing.updatedAt = Date.now();
    } else {
      data.npcSchedule.push({
        npcId,
        npcName,
        shichenIds,
        location,
        createdAt: Date.now()
      });
    }
    this._saveData(data);
    this.renderNPCSchedule();
    App.toast(`${npcName} 的时间表已更新`, 'success');
  },

  /**
   * 获取当前时辰出现的NPC
   */
  getActiveNPCs() {
    const data = this._getData();
    const currentShichen = this.getCurrentShichen();
    return data.npcSchedule.filter(s => s.shichenIds.includes(currentShichen.id));
  },

  /**
   * 渲染页面主结构
   */
  renderPage() {
    const page = document.getElementById('page-timeline');
    if (!page) return;
    page.innerHTML = `
      <div style="padding:var(--space-lg);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:8px;">
          <h2 class="section-title">📅 世界时间线</h2>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn btn-sm btn-primary" onclick="TimelineSystem.advanceTime(1)">⏩ 推进1小时</button>
            <button class="btn btn-sm btn-secondary" onclick="TimelineSystem.advanceTime(6)">⏩ 推进6小时</button>
            <button class="btn btn-sm btn-secondary" onclick="TimelineSystem.advanceTime(24)">⏩ 推进1天</button>
            <button class="btn btn-sm btn-gold" onclick="TimelineSystem.randomWeather()">🌤️ 随机天气</button>
            <button class="btn btn-sm btn-secondary" onclick="TimelineSystem.showSettings()">⚙️ 设置</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--space-md);">
          <!-- 当前时间卡片 -->
          <div class="card">
            <div class="card-header">
              <h3 style="font-size:16px;">🕐 当前时间</h3>
            </div>
            <div class="card-body" id="timelineCurrent">
              <!-- 动态渲染 -->
            </div>
          </div>

          <!-- 季节与天气 -->
          <div class="card">
            <div class="card-header">
              <h3 style="font-size:16px;">🌿 季节与天气</h3>
            </div>
            <div class="card-body" id="timelineSeason">
              <!-- 动态渲染 -->
            </div>
          </div>

          <!-- 时辰与NPC -->
          <div class="card">
            <div class="card-header">
              <h3 style="font-size:16px;">👥 时辰NPC</h3>
            </div>
            <div class="card-body" id="timelineNPC">
              <!-- 动态渲染 -->
            </div>
          </div>
        </div>

        <!-- 日历视图 -->
        <div class="card" style="margin-top:var(--space-md);">
          <div class="card-header">
            <h3 style="font-size:16px;">📆 日历</h3>
          </div>
          <div class="card-body" id="timelineCalendar">
            <!-- 动态渲染 -->
          </div>
        </div>

        <!-- 时间轴历史 -->
        <div class="card" style="margin-top:var(--space-md);">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
            <h3 style="font-size:16px;">📜 时间轴</h3>
            <button class="btn btn-sm btn-secondary" onclick="TimelineSystem.clearHistory()">🗑️ 清空</button>
          </div>
          <div class="card-body" id="timelineHistory">
            <!-- 动态渲染 -->
          </div>
        </div>

        <!-- 时间事件 -->
        <div class="card" style="margin-top:var(--space-md);">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
            <h3 style="font-size:16px;">⏰ 时间事件</h3>
            <button class="btn btn-sm btn-primary" onclick="TimelineSystem.showAddEventModal()">➕ 添加</button>
          </div>
          <div class="card-body" id="timelineEvents">
            <!-- 动态渲染 -->
          </div>
        </div>
      </div>
    `;
    this.renderCalendar();
    this.renderTimeline();
    this.renderEvents();
    this.renderNPCSchedule();
  },

  renderCalendar() {
    const container = document.getElementById('timelineCurrent');
    if (!container) return;
    const data = this._getData();
    const shichen = this.getCurrentShichen();
    const season = this.getCurrentSeason();
    const weather = this.getCurrentWeather();
    const lunarMonth = this.LUNAR_MONTHS[data.month - 1] || '';

    container.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:32px;font-weight:700;color:var(--color-gold);margin-bottom:8px;">
          第${data.year}年 ${lunarMonth}${data.day}日
        </div>
        <div style="font-size:18px;color:var(--text-secondary);margin-bottom:4px;">
          ${data.hour.toString().padStart(2, '0')}:${data.minute.toString().padStart(2, '0')}
        </div>
        <div style="font-size:16px;color:var(--color-primary);margin-bottom:4px;">
          ${shichen.name} · ${shichen.label}
        </div>
        <div style="font-size:13px;color:var(--text-muted);">${shichen.desc}</div>
      </div>
    `;

    const seasonContainer = document.getElementById('timelineSeason');
    if (seasonContainer) {
      seasonContainer.innerHTML = `
        <div style="text-align:center;">
          <div style="font-size:28px;margin-bottom:8px;">${weather.icon}</div>
          <div style="font-size:16px;font-weight:600;margin-bottom:4px;">${season.name}季 · ${weather.name}</div>
          <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">${season.desc}</div>
          <div style="font-size:13px;color:var(--text-muted);">${weather.desc}</div>
          <div style="margin-top:12px;display:flex;gap:4px;flex-wrap:wrap;justify-content:center;">
            ${this.WEATHERS.map(w => `
              <button class="btn btn-sm btn-secondary" style="font-size:12px;" onclick="TimelineSystem.setWeather('${w.id}')">${w.icon} ${w.name}</button>
            `).join('')}
          </div>
        </div>
      `;
    }
  },

  renderTimeline() {
    const container = document.getElementById('timelineHistory');
    if (!container) return;
    const data = this._getData();
    const history = data.history || [];

    if (history.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted);text-align:center;">暂无时间记录</p>`;
      return;
    }

    container.innerHTML = `
      <div style="position:relative;padding-left:20px;">
        <div style="position:absolute;left:6px;top:0;bottom:0;width:2px;background:var(--border-color);"></div>
        ${history.slice().reverse().map((h, idx) => `
          <div style="position:relative;margin-bottom:12px;">
            <div style="position:absolute;left:-17px;top:4px;width:10px;height:10px;border-radius:50%;background:${idx === 0 ? 'var(--color-gold)' : 'var(--border-color)'};border:2px solid var(--bg-card);z-index:1;"></div>
            <div style="font-size:13px;color:var(--text-secondary);">
              <strong>第${h.year}年 ${h.month}月${h.day}日 ${h.hour.toString().padStart(2, '0')}:${h.minute.toString().padStart(2, '0')}</strong>
            </div>
            <div style="font-size:12px;color:var(--text-muted);">${h.note || ''}</div>
          </div>
        `).join('')}
      </div>
    `;

    // 渲染日历网格
    const calContainer = document.getElementById('timelineCalendar');
    if (calContainer) {
      const days = [];
      for (let d = 1; d <= 30; d++) {
        const isToday = d === data.day;
        const hasEvent = (data.timeEvents || []).some(e => e.month === data.month && e.day === d);
        days.push(`
          <div style="
            padding:8px;text-align:center;border-radius:4px;font-size:13px;
            ${isToday ? 'background:var(--color-gold);color:#fff;font-weight:600;' : 'background:var(--bg-sidebar);'}
            ${hasEvent && !isToday ? 'border:2px solid var(--color-primary);' : ''}
            cursor:pointer;
          " onclick="TimelineSystem.setDateTime(${data.year}, ${data.month}, ${d}, 8, 0)">
            ${d}${hasEvent ? '<span style="display:block;font-size:10px;margin-top:2px;">●</span>' : ''}
          </div>
        `);
      }
      calContainer.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <button class="btn btn-sm btn-secondary" onclick="TimelineSystem.prevMonth()">◀ 上月</button>
          <strong>${data.year}年 ${this.LUNAR_MONTHS[data.month - 1]}</strong>
          <button class="btn btn-sm btn-secondary" onclick="TimelineSystem.nextMonth()">下月 ▶</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:4px;">
          ${['日','一','二','三','四','五','六'].map(d => `<div style="text-align:center;font-size:12px;color:var(--text-muted);padding:4px;">${d}</div>`).join('')}
        </div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">
          ${days.join('')}
        </div>
      `;
    }
  },

  prevMonth() {
    const data = this._getData();
    data.month -= 1;
    if (data.month < 1) { data.month = 12; data.year -= 1; }
    this._saveData(data);
    this.renderCalendar();
  },

  nextMonth() {
    const data = this._getData();
    data.month += 1;
    if (data.month > 12) { data.month = 1; data.year += 1; }
    this._saveData(data);
    this.renderCalendar();
  },

  renderEvents() {
    const container = document.getElementById('timelineEvents');
    if (!container) return;
    const data = this._getData();
    const events = data.timeEvents || [];

    if (events.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted);text-align:center;">暂无时间事件，点击上方按钮添加</p>`;
      return;
    }

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${events.map(ev => `
          <div style="
            display:flex;justify-content:space-between;align-items:center;
            padding:10px 12px;border-radius:6px;
            ${ev.triggered ? 'background:var(--color-gold)11;border:1px solid var(--color-gold);' : 'background:var(--bg-sidebar);border:1px solid var(--border-color);'}
          ">
            <div>
              <div style="font-size:14px;font-weight:500;">${ev.triggered ? '✅ ' : '⏳ '}${ev.title}</div>
              <div style="font-size:12px;color:var(--text-muted);">
                目标：第${ev.year}年 ${ev.month}月${ev.day}日 ${ev.hour}:00
                ${ev.triggered ? '<span style="color:var(--color-gold);">· 已触发</span>' : ''}
              </div>
            </div>
            <button class="btn btn-sm btn-danger" onclick="TimelineSystem.deleteTimeEvent('${ev.id}')">删除</button>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderNPCSchedule() {
    const container = document.getElementById('timelineNPC');
    if (!container) return;
    const active = this.getActiveNPCs();

    if (active.length === 0) {
      container.innerHTML = `
        <p style="color:var(--text-muted);text-align:center;">当前时辰没有NPC出没</p>
        <button class="btn btn-sm btn-secondary" style="display:block;margin:8px auto;" onclick="TimelineSystem.showAddNPCModal()">➕ 添加NPC时间表</button>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;">
        ${active.map(s => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-radius:4px;background:var(--bg-sidebar);">
            <div>
              <div style="font-size:14px;font-weight:500;">👤 ${s.npcName}</div>
              <div style="font-size:12px;color:var(--text-muted);">📍 ${s.location || '未知地点'}</div>
            </div>
            <span style="font-size:12px;color:var(--color-gold);">在线</span>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-sm btn-secondary" style="width:100%;" onclick="TimelineSystem.showAddNPCModal()">➕ 管理NPC时间表</button>
    `;
  },

  showSettings() {
    const data = this._getData();
    const content = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div>
          <label style="display:block;font-size:13px;margin-bottom:4px;">当前时间设置</label>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">
            <input type="number" id="tsYear" value="${data.year}" min="1" placeholder="年" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
            <input type="number" id="tsMonth" value="${data.month}" min="1" max="12" placeholder="月" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
            <input type="number" id="tsDay" value="${data.day}" min="1" max="30" placeholder="日" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;">
          <input type="number" id="tsHour" value="${data.hour}" min="0" max="23" placeholder="时" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
          <input type="number" id="tsMinute" value="${data.minute}" min="0" max="59" placeholder="分" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        </div>
        <div>
          <label style="display:block;font-size:13px;margin-bottom:4px;">自动推进间隔（秒/小时）</label>
          <input type="number" id="tsInterval" value="${data.advanceInterval || 30}" min="5" placeholder="秒" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);width:100%;">
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-primary" style="flex:1;" onclick="TimelineSystem.saveSettings()">💾 保存设置</button>
          <button class="btn btn-secondary" style="flex:1;" onclick="TimelineSystem.startAutoAdvance()">▶️ 开始自动</button>
          <button class="btn btn-danger" style="flex:1;" onclick="TimelineSystem.stopAutoAdvance()">⏹️ 停止自动</button>
        </div>
      </div>
    `;
    App.showModal('⚙️ 时间线设置', content);
  },

  saveSettings() {
    const year = document.getElementById('tsYear')?.value;
    const month = document.getElementById('tsMonth')?.value;
    const day = document.getElementById('tsDay')?.value;
    const hour = document.getElementById('tsHour')?.value;
    const minute = document.getElementById('tsMinute')?.value;
    const interval = document.getElementById('tsInterval')?.value;
    if (year !== undefined && month !== undefined && day !== undefined) {
      this.setDateTime(year, month, day, hour, minute);
    }
    if (interval) {
      const data = this._getData();
      data.advanceInterval = Math.max(5, parseInt(interval) || 30);
      this._saveData(data);
    }
    App.closeModal();
  },

  showAddEventModal() {
    const data = this._getData();
    const content = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <input type="text" id="teTitle" placeholder="事件名称" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">
          <input type="number" id="teYear" value="${data.year}" placeholder="年" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
          <input type="number" id="teMonth" value="${data.month}" min="1" max="12" placeholder="月" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
          <input type="number" id="teDay" value="${data.day}" min="1" max="30" placeholder="日" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        </div>
        <input type="number" id="teHour" value="${data.hour}" min="0" max="23" placeholder="时" style="padding:6px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <button class="btn btn-primary" onclick="TimelineSystem.saveEvent()">➕ 添加事件</button>
      </div>
    `;
    App.showModal('➕ 添加时间事件', content);
  },

  saveEvent() {
    const title = document.getElementById('teTitle')?.value;
    const year = document.getElementById('teYear')?.value;
    const month = document.getElementById('teMonth')?.value;
    const day = document.getElementById('teDay')?.value;
    const hour = document.getElementById('teHour')?.value;
    if (!title) {
      App.toast('请输入事件名称', 'error');
      return;
    }
    this.addTimeEvent(title, year, month, day, hour);
    App.closeModal();
  },

  showAddNPCModal() {
    const content = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <input type="text" id="npcIdInput" placeholder="NPC ID" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <input type="text" id="npcNameInput" placeholder="NPC 名称" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <div>
          <label style="font-size:13px;display:block;margin-bottom:4px;">选择出现的时辰（可多选）</label>
          <div style="display:flex;flex-wrap:wrap;gap:4px;">
            ${this.SHICHEN.map(s => `
              <label style="display:flex;align-items:center;gap:4px;font-size:12px;padding:4px 8px;background:var(--bg-sidebar);border-radius:4px;cursor:pointer;">
                <input type="checkbox" class="npc-shichen" value="${s.id}"> ${s.name}
              </label>
            `).join('')}
          </div>
        </div>
        <input type="text" id="npcLocationInput" placeholder="出现地点" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <button class="btn btn-primary" onclick="TimelineSystem.saveNPCSchedule()">💾 保存</button>
      </div>
    `;
    App.showModal('👥 添加NPC时间表', content);
  },

  saveNPCSchedule() {
    const npcId = document.getElementById('npcIdInput')?.value;
    const npcName = document.getElementById('npcNameInput')?.value;
    const location = document.getElementById('npcLocationInput')?.value;
    const checkboxes = document.querySelectorAll('.npc-shichen:checked');
    const shichenIds = Array.from(checkboxes).map(cb => cb.value);
    if (!npcId || !npcName) {
      App.toast('请填写NPC信息', 'error');
      return;
    }
    if (shichenIds.length === 0) {
      App.toast('请至少选择一个时辰', 'error');
      return;
    }
    this.setNPCSchedule(npcId, npcName, shichenIds, location);
    App.closeModal();
  },

  clearHistory() {
    if (!confirm('确定要清空所有时间历史记录吗？')) return;
    const data = this._getData();
    data.history = [];
    this._saveData(data);
    this.renderTimeline();
    App.toast('历史记录已清空', 'info');
  }
};
