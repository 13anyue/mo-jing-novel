/**
 * weather-system.js
 * 动态天气时辰系统 — 用户自定义天气类型和效果
 *
 * 核心约束：
 * - 没有任何预设天气效果绑定，所有天气对事件/剧情的影响由用户自己配置
 * - 天气类型完全自定义：用户可添加/删除/重命名天气类型
 * - 提供默认天气类型列表供参考，但用户可自由修改
 *
 * 存储键：weather_system_v12
 */

const WeatherSystem = (function() {
  'use strict';

  // ==================== 常量定义 ====================

  /** 存储键 */
  const STORAGE_KEY = 'weather_system_v12';

  /** 十二时辰定义（每个时辰2小时） */
  const SHICHEN = [
    { name: '子', hourStart: 23, hourEnd: 1,  label: '子时', desc: '夜半', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>' },
    { name: '丑', hourStart: 1,  hourEnd: 3,  label: '丑时', desc: '鸡鸣', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a4 4 0 00-4 4c0 1.5.5 2.5 1.5 3.5"/><path d="M12 3a4 4 0 014 4c0 1.5-.5 2.5-1.5 3.5"/><path d="M12 7v14"/><path d="M8 15h8"/></svg>' },
    { name: '寅', hourStart: 3,  hourEnd: 5,  label: '寅时', desc: '平旦', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 18a5 5 0 00-10 0"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/><line x1="23" y1="22" x2="1" y2="22"/></svg>' },
    { name: '卯', hourStart: 5,  hourEnd: 7,  label: '卯时', desc: '日出', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>' },
    { name: '辰', hourStart: 7,  hourEnd: 9,  label: '辰时', desc: '食时', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>' },
    { name: '巳', hourStart: 9,  hourEnd: 11, label: '巳时', desc: '隅中', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>' },
    { name: '午', hourStart: 11, hourEnd: 13, label: '午时', desc: '日中', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>' },
    { name: '未', hourStart: 13, hourEnd: 15, label: '未时', desc: '日昳', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 18a5 5 0 00-10 0"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/></svg>' },
    { name: '申', hourStart: 15, hourEnd: 17, label: '申时', desc: '晡时', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 18a5 5 0 00-10 0"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/></svg>' },
    { name: '酉', hourStart: 17, hourEnd: 19, label: '酉时', desc: '日入', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 18a5 5 0 00-10 0"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/><line x1="23" y1="22" x2="1" y2="22"/></svg>' },
    { name: '戌', hourStart: 19, hourEnd: 21, label: '戌时', desc: '黄昏', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M9 21v-6h6v6"/></svg>' },
    { name: '亥', hourStart: 21, hourEnd: 23, label: '亥时', desc: '人定', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>' }
  ];

  /** 四季定义 */
  const SEASONS = [
    { name: '春', months: [2, 3, 4],  label: '春季', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 7.5a4.5 4.5 0 10-4.5 4.5"/><path d="M12 7.5a4.5 4.5 0 014.5 4.5"/><path d="M12 7.5V3"/><path d="M7.5 12H3"/><path d="M16.5 12H21"/><path d="M12 16.5V21"/><circle cx="12" cy="12" r="9"/></svg>', color: '#8FBC8F' },
    { name: '夏', months: [5, 6, 7],  label: '夏季', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>', color: '#CD5C5C' },
    { name: '秋', months: [8, 9, 10], label: '秋季', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l-3 4"/><path d="M12 2l3 4"/><path d="M12 22V10"/><path d="M12 10l-5 3"/><path d="M12 10l5 3"/><path d="M7 13l-5 2"/><path d="M17 13l5 2"/><path d="M2 15l5-2"/><path d="M22 15l-5-2"/></svg>', color: '#DAA520' },
    { name: '冬', months: [11, 12, 1], label: '冬季', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/><line x1="19.07" y1="4.93" x2="4.93" y2="19.07"/></svg>', color: '#4682B4' }
  ];

  /** 默认天气类型（用户可自由修改） */
  const DEFAULT_WEATHER_TYPES = [
    {
      name: '晴',
      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
      color: '#FFD700',
      probabilities: { spring: 30, summer: 40, autumn: 35, winter: 25 },
      eventTypes: [],
      description: '阳光明媚，万里无云'
    },
    {
      name: '多云',
      icon: '⛅',
      color: '#87CEEB',
      probabilities: { spring: 25, summer: 20, autumn: 25, winter: 20 },
      eventTypes: [],
      description: '云层密布，天色柔和'
    },
    {
      name: '阴',
      icon: '☁️',
      color: '#A9A9A9',
      probabilities: { spring: 15, summer: 10, autumn: 15, winter: 20 },
      eventTypes: [],
      description: '天色阴沉，不见阳光'
    },
    {
      name: '雨',
      icon: '🌧️',
      color: '#4682B4',
      probabilities: { spring: 15, summer: 20, autumn: 15, winter: 10 },
      eventTypes: [],
      description: '细雨绵绵，润物无声'
    },
    {
      name: '雪',
      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/><line x1="19.07" y1="4.93" x2="4.93" y2="19.07"/></svg>',
      color: '#B0E0E6',
      probabilities: { spring: 2, summer: 0, autumn: 5, winter: 20 },
      eventTypes: [],
      description: '雪花纷飞，银装素裹'
    },
    {
      name: '雾',
      icon: '🌫️',
      color: '#D3D3D3',
      probabilities: { spring: 8, summer: 5, autumn: 10, winter: 15 },
      eventTypes: [],
      description: '雾气弥漫，视线朦胧'
    },
    {
      name: '雷暴',
      icon: '⛈️',
      color: '#4B0082',
      probabilities: { spring: 5, summer: 15, autumn: 5, winter: 0 },
      eventTypes: [],
      description: '电闪雷鸣，风雨交加'
    },
    {
      name: '沙尘',
      icon: '🌪️',
      color: '#D2B48C',
      probabilities: { spring: 5, summer: 5, autumn: 5, winter: 5 },
      eventTypes: [],
      description: '黄沙漫天，遮天蔽日'
    },
    {
      name: '冰雹',
      icon: '🌨️',
      color: '#E0E0E0',
      probabilities: { spring: 3, summer: 8, autumn: 2, winter: 5 },
      eventTypes: [],
      description: '冰雹骤降，击打万物'
    }
  ];

  /** 默认设置 */
  const DEFAULT_SETTINGS = {
    timeMode: 'independent', // 'realtime' | 'independent'
    timeSpeed: 1,            // 1, 2, 5, 10, 0(暂停)
    enableNPCSpawn: false,   // 影响NPC出没
    enableEventTrigger: false, // 影响事件触发概率
    enableMapSpeed: false,     // 影响地图移动速度
    enableDialogInject: false, // 影响对话内容注入
    showLunarDate: false,      // 显示农历日期
    customWeatherTypes: []     // 用户自定义的天气类型
  };

  /** 古风墨境配色 */
  const COLORS = {
    parchment: '#F5E6D3',
    gold: '#C9A227',
    ink: '#2C1810',
    inkLight: '#5C4033',
    inkDark: '#1A0F0A',
    red: '#8B4513',
    border: '#D4A574'
  };

  // ==================== 状态管理 ====================

  let state = {
    currentDate: null,       // 当前日期时间
    gameTimeOffset: 0,         // 游戏时间偏移（毫秒）
    lastUpdate: Date.now(),    // 上次更新时间
    currentWeather: null,      // 当前天气
    forecast: [],              // 天气预报
    history: [],               // 历史记录
    settings: { ...DEFAULT_SETTINGS },
    weatherTypes: JSON.parse(JSON.stringify(DEFAULT_WEATHER_TYPES)),
    timerId: null
  };

  // ==================== 私有方法 ====================

  /**
   * 获取当前季节
   * @param {Date} date - 日期对象
   * @returns {Object} 季节对象
   */
  function _getSeason(date) {
    const month = date.getMonth() + 1;
    return SEASONS.find(s => s.months.includes(month)) || SEASONS[0];
  }

  /**
   * 获取当前时辰
   * @param {Date} date - 日期对象
   * @returns {Object} 时辰对象
   */
  function _getShichen(date) {
    const hour = date.getHours();
    // 处理跨天的情况（子时23-1点）
    if (hour === 23) {
      return SHICHEN[0];
    }
    return SHICHEN.find(s => hour >= s.hourStart && hour < s.hourEnd) || SHICHEN[0];
  }

  /**
   * 获取计算后的当前时间
   * @returns {Date} 当前时间（根据模式不同）
   */
  function _getCurrentTime() {
    if (state.settings.timeMode === 'realtime') {
      return new Date();
    } else {
      const now = Date.now();
      const elapsed = now - state.lastUpdate;
      const speed = state.settings.timeSpeed || 1;
      state.gameTimeOffset += elapsed * speed;
      state.lastUpdate = now;
      return new Date(Date.now() + state.gameTimeOffset);
    }
  }

  /**
   * 根据概率生成天气
   * @param {string} seasonName - 季节名称
   * @returns {Object} 天气对象
   */
  function _generateWeatherByProbability(seasonName) {
    const types = state.weatherTypes;
    const weights = types.map(t => t.probabilities[seasonName] || 10);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < types.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return { ...types[i], generatedAt: new Date().toISOString() };
      }
    }
    return { ...types[0], generatedAt: new Date().toISOString() };
  }

  /**
   * 简单的农历转换（简化版）
   * @param {Date} date - 公历日期
   * @returns {string} 农历日期字符串
   */
  function _getLunarDate(date) {
    // 这里使用简化算法，实际项目中可以引入完整农历库
    const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
    const lunarDays = [
      '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
      '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
      '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
    ];

    // 简化计算：以1900年1月31日为基准（农历1900年正月初一）
    const baseDate = new Date(1900, 0, 31);
    const offset = Math.floor((date - baseDate) / 86400000);

    // 使用近似算法
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    // 简化的农历计算（实际应使用完整农历算法）
    const lunarMonth = lunarMonths[month % 12];
    const lunarDay = lunarDays[(day + 5) % 30] || '初一';

    return `农历${lunarMonth}月${lunarDay}`;
  }

  /**
   * 生成未来N个时辰的天气预报
   * @param {number} count - 预报数量
   * @returns {Array} 预报数组
   */
  function _generateForecast(count) {
    const forecast = [];
    const currentTime = _getCurrentTime();
    const season = _getSeason(currentTime);

    for (let i = 1; i <= count; i++) {
      const futureTime = new Date(currentTime.getTime() + i * 2 * 3600000);
      const futureSeason = _getSeason(futureTime);
      const futureShichen = _getShichen(futureTime);
      const weather = _generateWeatherByProbability(futureSeason.name.toLowerCase());

      forecast.push({
        time: futureTime,
        shichen: futureShichen,
        weather: weather,
        season: futureSeason
      });
    }

    return forecast;
  }

  /**
   * 添加历史记录
   * @param {Object} record - 天气记录
   */
  function _addToHistory(record) {
    state.history.unshift({
      ...record,
      recordedAt: new Date().toISOString()
    });

    // 只保留最近7天（168小时）的记录
    const cutoff = new Date(Date.now() - 168 * 3600000).toISOString();
    state.history = state.history.filter(h => h.recordedAt >= cutoff);

    // 限制最多100条
    if (state.history.length > 100) {
      state.history = state.history.slice(0, 100);
    }
  }

  /**
   * 更新当前天气
   */
  function _updateWeather() {
    const currentTime = _getCurrentTime();
    const season = _getSeason(currentTime);
    const shichen = _getShichen(currentTime);

    // 检查是否需要更换天气（每2小时重新生成）
    if (!state.currentWeather || !_isSameShichen(currentTime, state.currentWeather.generatedAt)) {
      const newWeather = _generateWeatherByProbability(season.name.toLowerCase());

      if (state.currentWeather) {
        _addToHistory({
          weather: state.currentWeather,
          shichen: shichen,
          season: season,
          date: currentTime.toISOString()
        });
      }

      state.currentWeather = {
        ...newWeather,
        generatedAt: currentTime.toISOString(),
        season: season.name,
        shichen: shichen.name
      };

      // 重新生成预报
      state.forecast = _generateForecast(6);
    }
  }

  /**
   * 判断是否为同一时辰
   * @param {Date} date1
   * @param {string} isoDate2
   * @returns {boolean}
   */
  function _isSameShichen(date1, isoDate2) {
    if (!isoDate2) return false;
    const date2 = new Date(isoDate2);
    const shichen1 = _getShichen(date1);
    const shichen2 = _getShichen(date2);
    return shichen1.name === shichen2.name && date1.toDateString() === date2.toDateString();
  }

  /**
   * 定时更新
   */
  function _startTimer() {
    if (state.timerId) clearInterval(state.timerId);
    state.timerId = setInterval(() => {
      _updateWeather();
      _render();
    }, 60000); // 每分钟更新一次
  }

  // ==================== 界面渲染 ====================

  /**
   * 主渲染函数
   */
  function _render() {
    const container = document.getElementById('weather-system-container');
    if (!container) return;

    const currentTime = _getCurrentTime();
    const season = _getSeason(currentTime);
    const shichen = _getShichen(currentTime);

    container.innerHTML = `
      <div class="weather-system" style="${_getStyles()}">
        ${_renderTopCard(currentTime, shichen, season)}
        ${_renderForecast()}
        ${_renderSeasonBar(currentTime, season)}
        ${_renderSettings()}
        ${_renderHistory()}
      </div>
    `;

    // 绑定事件
    _bindEvents(container);
  }

  /**
   * 获取CSS样式
   */
  function _getStyles() {
    return `
      font-family: 'Noto Serif SC', 'SimSun', serif;
      background: linear-gradient(135deg, ${COLORS.parchment} 0%, #E8D5C4 100%);
      color: ${COLORS.ink};
      padding: 20px;
      border-radius: 12px;
      border: 2px solid ${COLORS.border};
      max-width: 800px;
      margin: 0 auto;
    `;
  }

  /**
   * 渲染顶部大卡片
   */
  function _renderTopCard(date, shichen, season) {
    const weather = state.currentWeather;
    if (!weather) return '';

    const lunarStr = state.settings.showLunarDate ? `<div class="lunar-date">${_getLunarDate(date)}</div>` : '';

    return `
      <div class="top-card" style="
        background: linear-gradient(135deg, ${COLORS.inkDark} 0%, ${COLORS.ink} 100%);
        color: ${COLORS.gold};
        padding: 30px;
        border-radius: 16px;
        text-align: center;
        margin-bottom: 20px;
        border: 2px solid ${COLORS.gold};
        box-shadow: 0 4px 20px rgba(44, 24, 16, 0.3);
      ">
        <div class="datetime" style="font-size: 14px; opacity: 0.8; margin-bottom: 10px;">
          ${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日
          ${lunarStr}
        </div>
        <div class="shichen-display" style="
          font-size: 48px;
          font-weight: bold;
          margin: 10px 0;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        ">
          ${shichen.icon} ${shichen.label}
        </div>
        <div class="shichen-desc" style="font-size: 16px; margin-bottom: 15px;">
          ${shichen.desc} · ${season.label}
        </div>
        <div class="weather-display" style="
          font-size: 72px;
          margin: 20px 0;
          text-shadow: 0 0 20px ${weather.color}40;
        ">
          ${weather.icon}
        </div>
        <div class="weather-name" style="
          font-size: 28px;
          font-weight: bold;
          color: ${weather.color};
          margin-bottom: 10px;
        ">
          ${weather.name}
        </div>
        <div class="weather-desc" style="font-size: 14px; opacity: 0.9;">
          ${weather.description}
        </div>
      </div>
    `;
  }

  /**
   * 渲染天气预报轮播
   */
  function _renderForecast() {
    if (!state.forecast || state.forecast.length === 0) return '';

    const items = state.forecast.map((item, index) => `
      <div class="forecast-item" style="
        background: rgba(245, 230, 211, 0.8);
        border: 1px solid ${COLORS.border};
        border-radius: 10px;
        padding: 12px;
        text-align: center;
        min-width: 100px;
        transition: transform 0.3s;
      " onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
        <div style="font-size: 12px; color: ${COLORS.inkLight}; margin-bottom: 5px;">
          ${item.shichen.label}
        </div>
        <div style="font-size: 36px; margin: 5px 0;">
          ${item.weather.icon}
        </div>
        <div style="font-size: 14px; font-weight: bold; color: ${item.weather.color};">
          ${item.weather.name}
        </div>
        <div style="font-size: 11px; color: ${COLORS.inkLight}; margin-top: 3px;">
          ${item.time.getHours()}:00
        </div>
      </div>
    `).join('');

    return `
      <div class="forecast-section" style="margin-bottom: 20px;">
        <h3 style="
          color: ${COLORS.ink};
          border-left: 4px solid ${COLORS.gold};
          padding-left: 12px;
          margin-bottom: 15px;
          font-size: 18px;
        ">未来时辰预报</h3>
        <div class="forecast-carousel" style="
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding: 5px;
        ">
          ${items}
        </div>
      </div>
    `;
  }

  /**
   * 渲染季节进度条
   */
  function _renderSeasonBar(date, season) {
    const month = date.getMonth() + 1;
    const seasonMonths = season.months;
    const monthIndex = seasonMonths.indexOf(month);
    const progress = ((monthIndex + 1) / seasonMonths.length) * 100;

    const seasonDays = seasonMonths.length * 30;
    const dayOfSeason = monthIndex * 30 + date.getDate();
    const remainingDays = seasonDays - dayOfSeason;

    return `
      <div class="season-bar" style="margin-bottom: 20px;">
        <h3 style="
          color: ${COLORS.ink};
          border-left: 4px solid ${COLORS.gold};
          padding-left: 12px;
          margin-bottom: 15px;
          font-size: 18px;
        ">季节进度 · ${season.label}</h3>
        <div style="
          background: ${COLORS.parchment};
          border: 2px solid ${COLORS.border};
          border-radius: 20px;
          height: 30px;
          overflow: hidden;
          position: relative;
        ">
          <div style="
            background: linear-gradient(90deg, ${season.color}80, ${season.color});
            width: ${progress}%;
            height: 100%;
            border-radius: 20px;
            transition: width 1s ease;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 10px;
            color: white;
            font-size: 12px;
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
          ">
            ${Math.round(progress)}%
          </div>
        </div>
        <div style="
          text-align: right;
          margin-top: 8px;
          font-size: 13px;
          color: ${COLORS.inkLight};
        ">
          本季剩余约 ${remainingDays} 天
        </div>
      </div>
    `;
  }

  /**
   * 渲染设置面板
   */
  function _renderSettings() {
    const s = state.settings;

    return `
      <div class="settings-panel" style="margin-bottom: 20px;">
        <h3 style="
          color: ${COLORS.ink};
          border-left: 4px solid ${COLORS.gold};
          padding-left: 12px;
          margin-bottom: 15px;
          font-size: 18px;
        ">系统设置</h3>

        <div class="setting-group" style="
          background: rgba(245, 230, 211, 0.6);
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 15px;
          border: 1px solid ${COLORS.border};
        ">
          <h4 style="margin: 0 0 10px 0; color: ${COLORS.ink}; font-size: 15px;">时间系统</h4>

          <div style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px; font-size: 13px;">
              <input type="radio" name="timeMode" value="realtime" ${s.timeMode === 'realtime' ? 'checked' : ''}
                onchange="WeatherSystem.setTimeMode('realtime')">
              同步现实时间
            </label>
            <label style="display: block; font-size: 13px;">
              <input type="radio" name="timeMode" value="independent" ${s.timeMode === 'independent' ? 'checked' : ''}
                onchange="WeatherSystem.setTimeMode('independent')">
              独立游戏时间
            </label>
          </div>

          <div style="margin-top: 10px;">
            <label style="font-size: 13px;">时间流速：</label>
            <select onchange="WeatherSystem.setTimeSpeed(parseInt(this.value))" style="
              background: ${COLORS.parchment};
              border: 1px solid ${COLORS.border};
              color: ${COLORS.ink};
              padding: 5px 10px;
              border-radius: 5px;
              font-family: inherit;
            ">
              <option value="0" ${s.timeSpeed === 0 ? 'selected' : ''}>暂停</option>
              <option value="1" ${s.timeSpeed === 1 ? 'selected' : ''}>1x</option>
              <option value="2" ${s.timeSpeed === 2 ? 'selected' : ''}>2x</option>
              <option value="5" ${s.timeSpeed === 5 ? 'selected' : ''}>5x</option>
              <option value="10" ${s.timeSpeed === 10 ? 'selected' : ''}>10x</option>
            </select>
          </div>

          <div style="margin-top: 10px;">
            <label style="font-size: 13px; cursor: pointer;">
              <input type="checkbox" ${s.showLunarDate ? 'checked' : ''}
                onchange="WeatherSystem.toggleSetting('showLunarDate', this.checked)">
              显示农历日期
            </label>
          </div>
        </div>

        <div class="setting-group" style="
          background: rgba(245, 230, 211, 0.6);
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 15px;
          border: 1px solid ${COLORS.border};
        ">
          <h4 style="margin: 0 0 10px 0; color: ${COLORS.ink}; font-size: 15px;">天气影响开关（默认全部关闭）</h4>

          <label style="display: block; margin-bottom: 8px; font-size: 13px; cursor: pointer;">
            <input type="checkbox" ${s.enableNPCSpawn ? 'checked' : ''}
              onchange="WeatherSystem.toggleSetting('enableNPCSpawn', this.checked)">
            影响NPC出没（某些NPC只在特定天气出现）
          </label>

          <label style="display: block; margin-bottom: 8px; font-size: 13px; cursor: pointer;">
            <input type="checkbox" ${s.enableEventTrigger ? 'checked' : ''}
              onchange="WeatherSystem.toggleSetting('enableEventTrigger', this.checked)">
            影响事件触发概率
          </label>

          <label style="display: block; margin-bottom: 8px; font-size: 13px; cursor: pointer;">
            <input type="checkbox" ${s.enableMapSpeed ? 'checked' : ''}
              onchange="WeatherSystem.toggleSetting('enableMapSpeed', this.checked)">
            影响地图移动速度
          </label>

          <label style="display: block; margin-bottom: 8px; font-size: 13px; cursor: pointer;">
            <input type="checkbox" ${s.enableDialogInject ? 'checked' : ''}
              onchange="WeatherSystem.toggleSetting('enableDialogInject', this.checked)">
            影响对话内容（AI提示词注入天气信息）
          </label>
        </div>
      </div>
    `;
  }

  /**
   * 渲染历史记录
   */
  function _renderHistory() {
    if (!state.history || state.history.length === 0) return '';

    const recentHistory = state.history.slice(0, 7);

    const items = recentHistory.map(h => {
      const date = new Date(h.recordedAt);
      return `
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: rgba(245, 230, 211, 0.5);
          border-radius: 8px;
          margin-bottom: 8px;
          border: 1px solid ${COLORS.border};
        ">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 24px;">${h.weather.icon}</span>
            <div>
              <div style="font-weight: bold; color: ${h.weather.color}; font-size: 14px;">
                ${h.weather.name}
              </div>
              <div style="font-size: 12px; color: ${COLORS.inkLight};">
                ${h.shichen.label} · ${h.season.label}
              </div>
            </div>
          </div>
          <div style="font-size: 12px; color: ${COLORS.inkLight};">
            ${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="history-section">
        <h3 style="
          color: ${COLORS.ink};
          border-left: 4px solid ${COLORS.gold};
          padding-left: 12px;
          margin-bottom: 15px;
          font-size: 18px;
        ">近七天天气记录</h3>
        ${items}
      </div>
    `;
  }

  /**
   * 绑定界面事件
   */
  function _bindEvents(container) {
    // 事件已在HTML中通过inline onchange绑定
  }

  // ==================== 公开API ====================

  return {
    // 存储键
    STORAGE_KEY,

    // 常量
    SHICHEN,
    SEASONS,
    DEFAULT_WEATHER_TYPES,
    COLORS,

    /**
     * 初始化天气系统
     */
      // 初始化模块入口
    init() {
      // v7: 外部模块依赖检查
      if (typeof Storage === 'undefined') { console.warn('[v7] Storage模块未加载'); return; }
    // 初始化模块入口
      this.load();
      _updateWeather();
      _startTimer();
      _render();
      console.log('[WeatherSystem] 天气时辰系统初始化完成');
      return this;
    },

    /**
     * 销毁定时器
     */
    destroy() {
      if (state.timerId) {
        clearInterval(state.timerId);
        state.timerId = null;
      }
    },

    /**
     * 获取当前状态
     */
    getState() {
      return {
        currentTime: _getCurrentTime(),
        currentWeather: state.currentWeather,
        season: _getSeason(_getCurrentTime()),
        shichen: _getShichen(_getCurrentTime()),
        settings: { ...state.settings },
        weatherTypes: [...state.weatherTypes]
      };
    },

    /**
     * 获取当前时辰
     */
    getCurrentShichen() {
      return _getShichen(_getCurrentTime());
    },

    /**
     * 获取当前季节
     */
    getCurrentSeason() {
      return _getSeason(_getCurrentTime());
    },

    /**
     * 获取当前天气
     */
    getCurrentWeather() {
      return state.currentWeather;
    },

    /**
     * 获取当前时间
     */
    getCurrentTime() {
      return _getCurrentTime();
    },

    /**
     * 设置时间模式
     * @param {string} mode - 'realtime' 或 'independent'
     */
    setTimeMode(mode) {
      if (mode !== 'realtime' && mode !== 'independent') {
        console.error('[WeatherSystem] 无效的时间模式:', mode);
        return;
      }
      state.settings.timeMode = mode;
      state.lastUpdate = Date.now();
      this.save();
      _updateWeather();
      _render();
    },

    /**
     * 设置时间流速
     * @param {number} speed - 0(暂停), 1, 2, 5, 10
     */
    setTimeSpeed(speed) {
      const validSpeeds = [0, 1, 2, 5, 10];
      if (!validSpeeds.includes(speed)) {
        console.error('[WeatherSystem] 无效的流速:', speed);
        return;
      }
      state.settings.timeSpeed = speed;
      state.lastUpdate = Date.now();
      this.save();
      _render();
    },

    /**
     * 切换设置项
     * @param {string} key - 设置键名
     * @param {boolean} value - 开关值
     */
    toggleSetting(key, value) {
      if (state.settings.hasOwnProperty(key)) {
        state.settings[key] = value;
        this.save();
        _render();
      }
    },

    /**
     * 获取农历日期
     * @param {Date} date - 日期对象
     * @returns {string} 农历字符串
     */
    getLunarDate(date) {
      return _getLunarDate(date || _getCurrentTime());
    },

    // ==================== 天气类型管理 ====================

    /**
     * 获取所有天气类型
     */
    getWeatherTypes() {
      return [...state.weatherTypes];
    },

    /**
     * 添加自定义天气类型
     * @param {Object} weather - 天气配置对象
     */
    addWeatherType(weather) {
      if (!weather || !weather.name) {
        console.error('[WeatherSystem] 天气类型必须包含名称');
        return false;
      }

      if (state.weatherTypes.find(w => w.name === weather.name)) {
        console.error('[WeatherSystem] 天气类型已存在:', weather.name);
        return false;
      }

      const newWeather = {
        name: weather.name,
        icon: weather.icon || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        color: weather.color || '#888888',
        probabilities: {
          spring: weather.probabilities?.spring || 10,
          summer: weather.probabilities?.summer || 10,
          autumn: weather.probabilities?.autumn || 10,
          winter: weather.probabilities?.winter || 10
        },
        eventTypes: weather.eventTypes || [],
        description: weather.description || ''
      };

      state.weatherTypes.push(newWeather);
      this.save();
      _updateWeather();
      _render();
      console.log('[WeatherSystem] 添加天气类型:', weather.name);
      return true;
    },

    /**
     * 删除天气类型
     * @param {string} name - 天气名称
     */
    removeWeatherType(name) {
      const index = state.weatherTypes.findIndex(w => w.name === name);
      if (index === -1) {
        console.error('[WeatherSystem] 未找到天气类型:', name);
        return false;
      }

      state.weatherTypes.splice(index, 1);
      this.save();
      _updateWeather();
      _render();
      console.log('[WeatherSystem] 删除天气类型:', name);
      return true;
    },

    /**
     * 重命名天气类型
     * @param {string} oldName - 旧名称
     * @param {string} newName - 新名称
     */
    renameWeatherType(oldName, newName) {
      if (!newName || state.weatherTypes.find(w => w.name === newName)) {
        console.error('[WeatherSystem] 新名称无效或已存在:', newName);
        return false;
      }

      const weather = state.weatherTypes.find(w => w.name === oldName);
      if (!weather) {
        console.error('[WeatherSystem] 未找到天气类型:', oldName);
        return false;
      }

      weather.name = newName;
      this.save();
      _updateWeather();
      _render();
      console.log('[WeatherSystem] 重命名天气类型:', oldName, '->', newName);
      return true;
    },

    /**
     * 更新天气类型配置
     * @param {string} name - 天气名称
     * @param {Object} updates - 更新内容
     */
    updateWeatherType(name, updates) {
      const weather = state.weatherTypes.find(w => w.name === name);
      if (!weather) {
        console.error('[WeatherSystem] 未找到天气类型:', name);
        return false;
      }

      Object.assign(weather, updates);
      this.save();
      _render();
      return true;
    },

    /**
     * 重置为默认天气类型
     */
    resetWeatherTypes() {
      state.weatherTypes = JSON.parse(JSON.stringify(DEFAULT_WEATHER_TYPES));
      this.save();
      _updateWeather();
      _render();
      console.log('[WeatherSystem] 已重置为默认天气类型');
    },

    // ==================== 天气影响系统 ====================

    /**
     * 获取当前激活的影响效果
     * @returns {Object} 影响配置
     */
    getActiveEffects() {
      const s = state.settings;
      return {
        npcSpawn: s.enableNPCSpawn,
        eventTrigger: s.enableEventTrigger,
        mapSpeed: s.enableMapSpeed,
        dialogInject: s.enableDialogInject
      };
    },

    /**
     * 检查是否影响NPC出没
     */
    shouldAffectNPC() {
      return state.settings.enableNPCSpawn;
    },

    /**
     * 检查是否影响事件触发
     */
    shouldAffectEvent() {
      return state.settings.enableEventTrigger;
    },

    /**
     * 检查是否影响地图移动速度
     */
    shouldAffectMap() {
      return state.settings.enableMapSpeed;
    },

    /**
     * 检查是否影响对话内容
     */
    shouldAffectDialog() {
      return state.settings.enableDialogInject;
    },

    /**
     * 获取天气对事件触发的影响系数
     * @param {string} eventType - 事件类型
     * @returns {number} 影响系数（1.0为基准，越大越容易触发）
     */
    getEventTriggerModifier(eventType) {
      if (!state.settings.enableEventTrigger || !state.currentWeather) {
        return 1.0;
      }

      const weather = state.currentWeather;
      if (weather.eventTypes && weather.eventTypes.includes(eventType)) {
        return 1.5; // 关联事件更容易触发
      }

      return 1.0;
    },

    /**
     * 获取地图移动速度修正
     * @returns {number} 速度系数
     */
    getMapSpeedModifier() {
      if (!state.settings.enableMapSpeed || !state.currentWeather) {
        return 1.0;
      }

      const weather = state.currentWeather;
      // 恶劣天气降低移动速度
      const slowWeather = ['雨', '雪', '雾', '雷暴', '沙尘', '冰雹'];
      if (slowWeather.includes(weather.name)) {
        return 0.7;
      }

      return 1.0;
    },

    // ==================== AI联动 ====================

    /**
     * 获取天气提示词（用于AI对话注入）
     * @returns {string} 天气描述文本
     */
    getWeatherPrompt() {
      if (!state.settings.enableDialogInject || !state.currentWeather) {
        return '';
      }

      const time = _getCurrentTime();
      const shichen = _getShichen(time);
      const season = _getSeason(time);
      const weather = state.currentWeather;

      return `【当前环境】${season.label}，${shichen.label}（${shichen.desc}），天气${weather.name}。${weather.description}。`;
    },

    /**
     * 生成天气相关随机事件建议
     * @param {string} location - 当前地点
     * @returns {Object} 事件建议
     */
    generateWeatherEvent(location) {
      if (!state.currentWeather) {
        return null;
      }

      const weather = state.currentWeather;
      const time = _getCurrentTime();
      const shichen = _getShichen(time);

      const events = {
        '晴': [
          '阳光正好，适合外出探险或晾晒衣物',
          '晴空万里，远处山脉清晰可见，或许能发现新的路径',
          '温暖的阳光让人昏昏欲睡，可能在路边遇到休憩的旅人'
        ],
        '雨': [
          '雨中传来悠扬的琴声，或许有人在亭中抚琴',
          '雨水冲刷出一条小溪，水中似乎有闪光之物',
          '雨中疾行的身影，似是有人在躲避什么'
        ],
        '雪': [
          '雪地里有一串奇怪的脚印，延伸向密林深处',
          '积雪压断了树枝，露出一个隐秘的树洞',
          '漫天飞雪中，远处有一点昏黄的灯火'
        ],
        '雾': [
          '雾中传来低语声，却看不到任何人影',
          '浓雾中一座古桥若隐若现，桥上有旧日题字',
          '雾气缭绕中，前方的道路似乎发生了微妙的变化'
        ],
        '雷暴': [
          '闪电照亮了一座古老遗迹的轮廓',
          '雷声轰鸣中，听到洞穴深处传来回响',
          '暴雨中有人敲门求助，自称是过路商人'
        ]
      };

      const defaultEvents = [
        `${weather.name}天气下的${location}别有一番景象，似乎有什么事情即将发生`,
        `这样的天气在${location}并不常见，或许会触发特殊的事件`,
        `${shichen.label}时分，${weather.name}，${location}笼罩在异样的氛围中`
      ];

      const weatherEvents = events[weather.name] || defaultEvents;
      const selectedEvent = weatherEvents[Math.floor(Math.random() * weatherEvents.length)];

      return {
        description: selectedEvent,
        weather: weather.name,
        location: location || '未知地点',
        shichen: shichen.label,
        suggestedAction: '可选择调查、忽略或记录此事'
      };
    },

    // ==================== 历史与预报 ====================

    /**
     * 获取历史记录
     * @param {number} days - 天数
     * @returns {Array} 历史记录数组
     */
    getHistory(days) {
      if (!days) return [...state.history];
      const cutoff = new Date(Date.now() - days * 24 * 3600000).toISOString();
      return state.history.filter(h => h.recordedAt >= cutoff);
    },

    /**
     * 获取天气预报
     * @param {number} count - 预报数量
     * @returns {Array} 预报数组
     */
    getForecast(count) {
      if (count && count !== 6) {
        return _generateForecast(count);
      }
      return [...state.forecast];
    },

    /**
     * 强制刷新天气
     */
    refreshWeather() {
      state.currentWeather = null;
      _updateWeather();
      _render();
      console.log('[WeatherSystem] 天气已手动刷新');
    },

    // ==================== 存储管理 ====================

    /**
     * 保存到本地存储
     */
    save() {
      try {
        const data = {
          gameTimeOffset: state.gameTimeOffset,
          currentWeather: state.currentWeather,
          history: state.history,
          settings: state.settings,
          weatherTypes: state.weatherTypes,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        console.log('[WeatherSystem] 数据已保存');
      } catch (e) {
        console.error('[WeatherSystem] 保存失败:', e);
      }
    },

    /**
     * 从本地存储加载
     */
    load() {
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          state.gameTimeOffset = parsed.gameTimeOffset || 0;
          state.currentWeather = parsed.currentWeather || null;
          state.history = parsed.history || [];
          state.settings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) };
          state.weatherTypes = parsed.weatherTypes || JSON.parse(JSON.stringify(DEFAULT_WEATHER_TYPES));
          console.log('[WeatherSystem] 数据已加载');
        } else {
          console.log('[WeatherSystem] 无存档数据，使用默认设置');
        }
      } catch (e) {
        console.error('[WeatherSystem] 加载失败:', e);
      }
    },

    /**
     * 导出配置
     * @returns {string} JSON字符串
     */
    exportConfig() {
      return JSON.stringify({
        settings: state.settings,
        weatherTypes: state.weatherTypes,
        history: state.history,
        exportedAt: new Date().toISOString()
      }, null, 2);
    },

    /**
     * 导入配置
     * @param {string} jsonStr - JSON字符串
     */
    importConfig(jsonStr) {
      try {
        const config = JSON.parse(jsonStr);
        if (config.settings) state.settings = { ...DEFAULT_SETTINGS, ...config.settings };
        if (config.weatherTypes) state.weatherTypes = config.weatherTypes;
        if (config.history) state.history = config.history;
        this.save();
        _updateWeather();
        _render();
        console.log('[WeatherSystem] 配置已导入');
        return true;
      } catch (e) {
        console.error('[WeatherSystem] 配置导入失败:', e);
        return false;
      }
    },

    // ==================== 渲染入口 ====================

    /**
     * 手动触发渲染
     */
    render() {
      _render();
    },

    /**
     * 挂载到指定容器
     * @param {string} containerId - 容器ID
     */
    mount(containerId) {
      let container = document.getElementById(containerId);
      if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        document.body.appendChild(container);
      }
      _render();
    }
  };
})();

// 如果处于模块环境则导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WeatherSystem;
}
