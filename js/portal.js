/**
 * =========================================================
 * PortalSystem v2 — 沉浸式场景系统
 * 模块名：PortalSystem
 * 特性：
 * - 零预设场景：场景列表初始为空，完全由用户创建或AI辅助生成
 * - 完全独立的沉浸式环境：每个场景拥有专属背景、BGM、光照、天气、NPC、物品
 * - 与背景库、音乐库、NPC系统、地图系统、群像系统深度联动
 * - 古风墨境配色：暖羊皮纸底色 #F5E6D3 + 金色 #C9A227 + 墨色 #2C1810
 * =========================================================
 */

const PortalSystem = {
  /* ========================================================
   * 常量与配置
   * ======================================================== */

  /** 存储键名 */
  STORAGE_KEY: 'immersive_scenes_v16',
  LEGACY_KEY: 'dynamic_scenes_v7',

  /** 光照效果配置 */
  LIGHTING_CONFIG: {
    bright:    { name: '明亮',    filter: 'brightness(1.1) saturate(1.1)',                tint: 'transparent' },
    dim:       { name: '昏暗',    filter: 'brightness(0.55) contrast(1.2)',             tint: 'rgba(0,0,0,0.35)' },
    moonlight: { name: '月光',    filter: 'brightness(0.7) sepia(0.3) hue-rotate(200deg)', tint: 'rgba(20,30,80,0.25)' },
    candle:    { name: '烛光',    filter: 'brightness(0.8) sepia(0.4) saturate(1.3)',    tint: 'rgba(255,180,80,0.15)' },
    neon:      { name: '霓虹',    filter: 'brightness(1.2) contrast(1.3) saturate(1.5)',   tint: 'rgba(255,0,128,0.08)' },
    foggy:     { name: '雾霭',    filter: 'brightness(0.85) contrast(0.9) blur(1px)',    tint: 'rgba(200,200,200,0.2)' },
    sunset:    { name: '黄昏',    filter: 'brightness(0.9) sepia(0.5) hue-rotate(-20deg)', tint: 'rgba(255,140,60,0.2)' },
  },

  /** 天气特效配置 */
  WEATHER_CONFIG: {
    none:       { name: '无',      className: '',            particleCount: 0 },
    rain:       { name: '雨',      className: 'weather-rain',       particleCount: 60 },
    snow:       { name: '雪',      className: 'weather-snow',       particleCount: 40 },
    petals:     { name: '花瓣',    className: 'weather-petals',     particleCount: 30 },
    leaves:     { name: '落叶',    className: 'weather-leaves',     particleCount: 25 },
    fireflies:  { name: '萤火虫',  className: 'weather-fireflies',  particleCount: 20 },
    ash:        { name: '灰烬',    className: 'weather-ash',        particleCount: 35 },
    starfall:   { name: '流星',    className: 'weather-starfall',   particleCount: 15 },
  },

  /** 时辰选项 */
  TIME_OPTIONS: ['清晨', '上午', '正午', '下午', '黄昏', '夜晚', '深夜', '黎明'],

  /** 季节选项 */
  SEASON_OPTIONS: ['春', '夏', '秋', '冬'],

  /** 物品交互类型 */
  OBJECT_INTERACTIONS: [
    { id: 'view',   name: '查看', icon: '👁️' },
    { id: 'pickup', name: '拾取', icon: '✋' },
    { id: 'use',    name: '使用', icon: '⚡' },
    { id: 'trigger',name: '触发事件', icon: '🔔' },
  ],

  /* ========================================================
   * 状态变量
   * ======================================================== */

  /** 当前场景ID */
  _currentSceneId: null,

  /** 当前视图模式：'list' | 'immersive' | 'edit' | 'ai-generate' */
  _viewMode: 'list',

  /** 搜索关键词 */
  _searchQuery: '',

  /** 筛选条件 */
  _filterLighting: 'all',
  _filterWeather: 'all',

  /** 场景编辑/创建时的临时数据 */
  _editingScene: null,

  /** AI生成预览数据 */
  _aiPreviewScene: null,

  /** 天气动画帧ID */
  _weatherAnimFrame: null,

  /** 氛围文字动画定时器 */
  _ambianceTimer: null,

  /** 当前天气粒子元素数组 */
  _weatherParticles: [],

  /* ========================================================
   * 初始化与生命周期
   * ======================================================== */

  /**
   * 初始化模块
   */
  init() {
    this._migrateLegacyData();
    this._injectWeatherCSS();
    this.renderPage();
  },

  /**
   * 进入页面时调用
   */
  onEnter() {
    this._viewMode = 'list';
    this._currentSceneId = null;
    this._searchQuery = '';
    this._filterLighting = 'all';
    this._filterWeather = 'all';
    this.renderPage();
  },

  /**
   * 离开页面时清理
   */
  onLeave() {
    this._stopWeatherAnimation();
    this._stopAmbianceAnimation();
    this._stopBGM();
  },

  /* ========================================================
   * 数据存取与迁移
   * ======================================================== */

  /**
   * 获取所有场景（零预设，初始为空数组）
   * @returns {Array} 场景列表
   */
  getScenes() {
    const scenes = Storage.get(this.STORAGE_KEY, []);
    return Array.isArray(scenes) ? scenes : [];
  },

  /**
   * 保存场景列表
   * @param {Array} list 场景列表
   */
  saveScenes(list) {
    Storage.set(this.STORAGE_KEY, list);
  },

  /**
   * 根据ID获取单个场景
   * @param {string} id 场景ID
   * @returns {Object|null} 场景对象
   */
  getSceneById(id) {
    return this.getScenes().find(s => s.id === id) || null;
  },

  /**
   * 从旧版本数据迁移
   */
  _migrateLegacyData() {
    const legacy = Storage.get(this.LEGACY_KEY, null);
    if (legacy && Array.isArray(legacy) && legacy.length > 0) {
      const migrated = legacy.map(old => this._migrateOldScene(old));
      const current = this.getScenes();
      if (current.length === 0) {
        this.saveScenes(migrated);
        App.toast('已迁移旧版场景数据', 'info');
      }
    }
  },

  /**
   * 将旧版场景数据转换为新版格式
   * @param {Object} old 旧版场景对象
   * @returns {Object} 新版场景对象
   */
  _migrateOldScene(old) {
    return {
      id: old.id || 'scene_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: old.name || '未命名场景',
      description: old.desc || old.description || '',
      backgroundId: old.bgId || old.backgroundId || null,
      bgMusicId: old.bgMusicId || null,
      lighting: old.lighting || 'bright',
      weatherEffect: old.weatherEffect || 'none',
      npcIds: old.npcIds || [],
      objects: old.objects || [],
      ambiance: old.ambiance || '',
      timeOfDay: old.timeOfDay || '正午',
      season: old.season || '春',
      mapLocationId: old.mapLocationId || null,
      buttons: old.buttons || [],
      createdAt: old.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
  },

  /**
   * 生成唯一场景ID
   * @returns {string} 新ID
   */
  _generateId() {
    return 'scene_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  },

  /* ========================================================
   * 页面渲染总入口
   * ======================================================== */

  /**
   * 渲染页面主框架
   */
  renderPage() {
    const page = document.getElementById('page-juncheng');
    if (!page) return;

    switch (this._viewMode) {
      case 'list':
        this.renderList();
        break;
      case 'immersive':
        this.renderImmersive();
        break;
      case 'edit':
        this.renderEditor();
        break;
      case 'ai-generate':
        this.renderAIGenerator();
        break;
      default:
        this.renderList();
    }
  },

  /* ========================================================
   * 场景列表界面
   * ======================================================== */

  /**
   * 渲染场景列表界面
   */
  renderList() {
    const page = document.getElementById('page-juncheng');
    if (!page) return;

    page.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
<div class="portal-header">
        <h2 class="section-title">🏛️ 场景殿堂</h2>
        <div class="portal-header-actions">
          <button class="btn btn-primary" onclick="PortalSystem.openCreateDialog()">➕ 创建场景</button>
          <button class="btn btn-secondary" onclick="PortalSystem.openAIGenerator()">🤖 AI生成</button>
        </div>
      </div>

      <!-- 搜索与筛选栏 -->
      <div class="portal-filter-bar">
        <input type="text" class="portal-search-input" placeholder="🔍 搜索场景名称或描述..."
               value="${this._searchQuery}" oninput="PortalSystem.onSearch(this.value)">
        <select class="portal-filter-select" onchange="PortalSystem.onFilterLighting(this.value)">
          <option value="all">全部光照</option>
          ${Object.entries(this.LIGHTING_CONFIG).map(([k, v]) =>
            `<option value="${k}" ${this._filterLighting === k ? 'selected' : ''}>${v.name}</option>`
          ).join('')}
        </select>
        <select class="portal-filter-select" onchange="PortalSystem.onFilterWeather(this.value)">
          <option value="all">全部天气</option>
          ${Object.entries(this.WEATHER_CONFIG).map(([k, v]) =>
            `<option value="${k}" ${this._filterWeather === k ? 'selected' : ''}>${v.name}</option>`
          ).join('')}
        </select>
      </div>

      <!-- 场景卡片网格 -->
      <div id="sceneGrid" class="portal-scene-grid"></div>
    `;

    this._renderSceneGrid();
    this._injectPortalCSS();
  },

  /**
   * 渲染场景卡片网格
   */
  _renderSceneGrid() {
    const grid = document.getElementById('sceneGrid');
    if (!grid) return;

    let scenes = this.getScenes();

    // 应用筛选
    if (this._searchQuery) {
      const q = this._searchQuery.toLowerCase();
      scenes = scenes.filter(s =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.ambiance && s.ambiance.toLowerCase().includes(q))
      );
    }
    if (this._filterLighting !== 'all') {
      scenes = scenes.filter(s => s.lighting === this._filterLighting);
    }
    if (this._filterWeather !== 'all') {
      scenes = scenes.filter(s => s.weatherEffect === this._filterWeather);
    }

    // 空状态
    if (scenes.length === 0) {
      grid.innerHTML = `
        <div class="portal-empty-state">
          <div class="portal-empty-icon">🏛️</div>
          <p class="portal-empty-title">暂无场景</p>
          <p class="portal-empty-desc">创建你的第一个沉浸式场景，或让AI根据你的想法生成</p>
          <div class="portal-empty-actions">
            <button class="btn btn-primary" onclick="PortalSystem.openCreateDialog()">创建场景</button>
            <button class="btn btn-secondary" onclick="PortalSystem.openAIGenerator()">AI生成</button>
          </div>
        </div>
      `;
      return;
    }

    // 渲染卡片
    grid.innerHTML = scenes.map(scene => this._renderSceneCard(scene)).join('');

    // 异步加载背景缩略图
    scenes.forEach(scene => {
      if (scene.backgroundId) {
        this._loadBackgroundThumb(scene.backgroundId, scene.id);
      }
    });
  },

  /**
   * 渲染单个场景卡片HTML
   * @param {Object} scene 场景对象
   * @returns {string} HTML字符串
   */
  _renderSceneCard(scene) {
    const npcCount = (scene.npcIds || []).length;
    const objCount = (scene.objects || []).length;
    const lightingName = this.LIGHTING_CONFIG[scene.lighting]?.name || '明亮';
    const weatherName = this.WEATHER_CONFIG[scene.weatherEffect]?.name || '无';
    const timeStr = scene.timeOfDay || '正午';
    const seasonStr = scene.season || '春';

    return `
      <div class="portal-scene-card" onclick="PortalSystem.enterScene('${scene.id}')">
        <div class="portal-card-bg" id="card-bg-${scene.id}" style="background: linear-gradient(180deg, #2C1810 0%, #1a0f08 100%);">
          <div class="portal-card-overlay"></div>
          <div class="portal-card-tags">
            <span class="portal-tag portal-tag-lighting">${lightingName}</span>
            <span class="portal-tag portal-tag-weather">${weatherName}</span>
          </div>
        </div>
        <div class="portal-card-info">
          <h3 class="portal-card-title">${scene.name}</h3>
          <p class="portal-card-desc">${scene.description || '暂无描述'}</p>
          <div class="portal-card-meta">
            <span class="portal-meta-item">🕐 ${timeStr}</span>
            <span class="portal-meta-item">🍂 ${seasonStr}</span>
            <span class="portal-meta-item">👤 ${npcCount}位NPC</span>
            <span class="portal-meta-item">📦 ${objCount}件物品</span>
          </div>
        </div>
        <div class="portal-card-actions">
          <button class="btn btn-sm btn-gold" onclick="event.stopPropagation(); PortalSystem.enterScene('${scene.id}')">🎭 沉浸</button>
          <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); PortalSystem.openEditDialog('${scene.id}')">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); PortalSystem.deleteScene('${scene.id}')">🗑️</button>
        </div>
      </div>
    `;
  },

  /**
   * 异步加载背景缩略图
   * @param {string} bgId 背景图ID
   * @param {string} sceneId 场景ID（用于定位卡片元素）
   */
  async _loadBackgroundThumb(bgId, sceneId) {
    try {
      const url = await Storage.getImage(bgId);
      if (url) {
        const el = document.getElementById(`card-bg-${sceneId}`);
        if (el) {
          el.style.backgroundImage = `url(${url})`;
          el.style.backgroundSize = 'cover';
          el.style.backgroundPosition = 'center';
        }
      }
    } catch (e) {
      // 静默失败，保持渐变背景
    }
  },

  /* ========================================================
   * 搜索与筛选处理
   * ======================================================== */

  onSearch(value) {
    this._searchQuery = value;
    this._renderSceneGrid();
  },

  onFilterLighting(value) {
    this._filterLighting = value;
    this._renderSceneGrid();
  },

  onFilterWeather(value) {
    this._filterWeather = value;
    this._renderSceneGrid();
  },

  /* ========================================================
   * 沉浸式场景界面
   * ======================================================== */

  /**
   * 进入沉浸式场景
   * @param {string} sceneId 场景ID
   */
  enterScene(sceneId) {
    const scene = this.getSceneById(sceneId);
    if (!scene) {
      App.toast('场景不存在', 'error');
      return;
    }
    this._currentSceneId = sceneId;
    this._viewMode = 'immersive';
    this.renderPage();
  },

  /**
   * 渲染沉浸式场景界面
   */
  renderImmersive() {
    const scene = this.getSceneById(this._currentSceneId);
    if (!scene) {
      this._viewMode = 'list';
      this.renderPage();
      return;
    }

    const page = document.getElementById('page-juncheng');
    if (!page) return;

    const lighting = this.LIGHTING_CONFIG[scene.lighting] || this.LIGHTING_CONFIG.bright;
    const weather = this.WEATHER_CONFIG[scene.weatherEffect] || this.WEATHER_CONFIG.none;
    const npcs = this._getNPCsInScene(scene);

    page.innerHTML = `
      <div class="portal-immersive-container">
        <!-- 背景层 -->
        <div class="portal-immersive-bg" id="immersiveBg">
          <div class="portal-immersive-bg-img" id="immersiveBgImg"></div>
          <div class="portal-immersive-tint" style="background: ${lighting.tint}"></div>
          <div class="portal-immersive-filter" style="filter: ${lighting.filter}"></div>
        </div>

        <!-- 天气特效层 -->
        <div class="portal-immersive-weather ${weather.className}" id="immersiveWeather"></div>

        <!-- 顶部信息栏 -->
        <div class="portal-immersive-header">
          <button class="btn btn-sm btn-secondary" onclick="PortalSystem.backToList()">← 返回列表</button>
          <div class="portal-immersive-title">
            <h2>${scene.name}</h2>
            <span class="portal-immersive-subtitle">
              ${scene.timeOfDay || '正午'} · ${scene.season || '春'} · ${lighting.name} · ${weather.name}
            </span>
          </div>
          <div class="portal-immersive-header-actions">
            <button class="btn btn-sm btn-gold" onclick="PortalSystem.toggleBGM()" id="bgmToggleBtn">🎵 BGM</button>
            <button class="btn btn-sm btn-secondary" onclick="PortalSystem.openEditDialog('${scene.id}')">✏️ 编辑</button>
          </div>
        </div>

        <!-- 场景内容层 -->
        <div class="portal-immersive-content">
          <!-- 左侧/上方：氛围描述 -->
          <div class="portal-immersive-ambiance" id="ambianceText"></div>

          <!-- NPC层 -->
          <div class="portal-immersive-npcs" id="immersiveNPCs">
            ${this._renderNPCAvatars(npcs, scene)}
          </div>

          <!-- 物品层 -->
          <div class="portal-immersive-objects" id="immersiveObjects">
            ${this._renderSceneObjects(scene.objects || [])}
          </div>
        </div>

        <!-- 底部操作栏 -->
        <div class="portal-immersive-footer">
          <button class="btn btn-primary portal-action-btn" onclick="PortalSystem.enterDialog()">
            <span class="portal-action-icon">💬</span>
            <span>进入对话</span>
          </button>
          <button class="btn btn-gold portal-action-btn" onclick="PortalSystem.startGroupChat()">
            <span class="portal-action-icon">👥</span>
            <span>群像对话</span>
          </button>
          <button class="btn btn-secondary portal-action-btn" onclick="PortalSystem.viewMap()">
            <span class="portal-action-icon">🗺️</span>
            <span>查看地图</span>
          </button>
          <button class="btn btn-secondary portal-action-btn" onclick="PortalSystem.toggleWeather()">
            <span class="portal-action-icon">🌦️</span>
            <span>${this._isWeatherActive ? '关闭特效' : '开启特效'}</span>
          </button>
        </div>
      </div>
    `;

    // 加载背景图
    this._loadImmersiveBackground(scene.backgroundId);

    // 启动天气特效
    if (scene.weatherEffect && scene.weatherEffect !== 'none') {
      this._startWeatherAnimation(scene.weatherEffect);
    }

    // 启动氛围文字动画
    if (scene.ambiance) {
      this._startAmbianceAnimation(scene.ambiance);
    }

    // 自动播放BGM
    if (scene.bgMusicId) {
      this._playBGM(scene.bgMusicId);
    }

    // 注入沉浸式CSS
    this._injectImmersiveCSS();
  },

  /**
   * 加载沉浸式背景图
   * @param {string} bgId 背景图ID
   */
  async _loadImmersiveBackground(bgId) {
    if (!bgId) return;
    try {
      const url = await Storage.getImage(bgId);
      if (url) {
        const imgEl = document.getElementById('immersiveBgImg');
        if (imgEl) {
          const img = new Image();
          img.onload = () => {
            imgEl.style.backgroundImage = `url(${url})`;
            imgEl.style.opacity = '1';
          };
          img.src = url;
        }
      }
    } catch (e) {
      console.warn('[PortalSystem] 背景图加载失败:', e);
    }
  },

  /**
   * 渲染NPC头像列表
   * @param {Array} npcs NPC对象数组
   * @param {Object} scene 当前场景
   * @returns {string} HTML字符串
   */
  _renderNPCAvatars(npcs, scene) {
    if (!npcs.length) {
      return `<div class="portal-npc-empty">此场景暂无NPC，可在编辑中添加</div>`;
    }
    return npcs.map(npc => `
      <div class="portal-npc-avatar" onclick="PortalSystem.talkToNPC('${npc.id}')">
        <div class="portal-npc-portrait" style="background: var(--bg-parchment); border: 2px solid var(--color-gold);">
          <span style="font-size: 32px;">👤</span>
        </div>
        <div class="portal-npc-name">${npc.name}</div>
      </div>
    `).join('');
  },

  /**
   * 渲染场景物品
   * @param {Array} objects 物品数组
   * @returns {string} HTML字符串
   */
  _renderSceneObjects(objects) {
    if (!objects || !objects.length) return '';
    return objects.map((obj, idx) => `
      <div class="portal-scene-object" onclick="PortalSystem.interactWithObject(${idx})" style="left: ${obj.x || 20}%; top: ${obj.y || 60}%;">
        <div class="portal-object-icon">${obj.icon || '📦'}</div>
        <div class="portal-object-label">${obj.name}</div>
      </div>
    `).join('');
  },

  /**
   * 获取场景内NPC对象数组
   * @param {Object} scene 场景对象
   * @returns {Array} NPC对象数组
   */
  _getNPCsInScene(scene) {
    const allNPCs = (window.NPCManager && NPCManager.getNPCs) ? NPCManager.getNPCs() : [];
    if (!scene.npcIds || !scene.npcIds.length) return [];
    return allNPCs.filter(n => scene.npcIds.includes(n.id));
  },

  /* ========================================================
   * 天气特效系统
   * ======================================================== */

  /**
   * 启动天气动画
   * @param {string} weatherType 天气类型
   */
  _startWeatherAnimation(weatherType) {
    this._stopWeatherAnimation();
    const container = document.getElementById('immersiveWeather');
    if (!container) return;

    const config = this.WEATHER_CONFIG[weatherType];
    if (!config || config.particleCount === 0) return;

    this._isWeatherActive = true;
    container.innerHTML = '';
    this._weatherParticles = [];

    for (let i = 0; i < config.particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'weather-particle';
      this._resetParticle(particle, weatherType, true);
      container.appendChild(particle);
      this._weatherParticles.push(particle);
    }

    this._animateWeather(weatherType);
  },

  /**
   * 重置单个粒子位置和动画参数
   * @param {HTMLElement} particle 粒子元素
   * @param {string} weatherType 天气类型
   * @param {boolean} randomY 是否随机Y轴初始位置
   */
  _resetParticle(particle, weatherType, randomY = false) {
    const w = window.innerWidth;
    const h = window.innerHeight;

    switch (weatherType) {
      case 'rain':
        particle.style.left = Math.random() * w + 'px';
        particle.style.top = randomY ? Math.random() * h + 'px' : '-10px';
        particle.style.animationDuration = (0.5 + Math.random() * 0.5) + 's';
        particle.style.opacity = 0.3 + Math.random() * 0.4;
        break;
      case 'snow':
        particle.style.left = Math.random() * w + 'px';
        particle.style.top = randomY ? Math.random() * h + 'px' : '-10px';
        particle.style.animationDuration = (3 + Math.random() * 4) + 's';
        particle.style.width = (2 + Math.random() * 4) + 'px';
        particle.style.height = particle.style.width;
        break;
      case 'petals':
        particle.style.left = Math.random() * w + 'px';
        particle.style.top = randomY ? Math.random() * h + 'px' : '-20px';
        particle.style.animationDuration = (4 + Math.random() * 3) + 's';
        particle.style.transform = `rotate(${Math.random() * 360}deg)`;
        break;
      case 'leaves':
        particle.style.left = Math.random() * w + 'px';
        particle.style.top = randomY ? Math.random() * h + 'px' : '-20px';
        particle.style.animationDuration = (5 + Math.random() * 4) + 's';
        break;
      case 'fireflies':
        particle.style.left = Math.random() * w + 'px';
        particle.style.top = Math.random() * h + 'px';
        particle.style.animationDuration = (2 + Math.random() * 3) + 's';
        break;
      case 'ash':
        particle.style.left = Math.random() * w + 'px';
        particle.style.top = randomY ? Math.random() * h + 'px' : '-10px';
        particle.style.animationDuration = (3 + Math.random() * 2) + 's';
        break;
      case 'starfall':
        particle.style.left = Math.random() * w + 'px';
        particle.style.top = randomY ? Math.random() * h + 'px' : '-10px';
        particle.style.animationDuration = (1 + Math.random() * 2) + 's';
        break;
    }
  },

  /**
   * 天气动画主循环
   * @param {string} weatherType 天气类型
   */
  _animateWeather(weatherType) {
    const container = document.getElementById('immersiveWeather');
    if (!container || !this._isWeatherActive) return;

    const w = window.innerWidth;
    const h = window.innerHeight;

    this._weatherParticles.forEach(p => {
      const rect = p.getBoundingClientRect();
      const parentRect = container.getBoundingClientRect();
      const relTop = rect.top - parentRect.top;
      const relLeft = rect.left - parentRect.left;

      // 粒子超出边界时重置
      if (relTop > h || relLeft > w || relLeft < -50) {
        this._resetParticle(p, weatherType, false);
      }
    });

    this._weatherAnimFrame = requestAnimationFrame(() => this._animateWeather(weatherType));
  },

  /**
   * 停止天气动画
   */
  _stopWeatherAnimation() {
    this._isWeatherActive = false;
    if (this._weatherAnimFrame) {
      cancelAnimationFrame(this._weatherAnimFrame);
      this._weatherAnimFrame = null;
    }
    const container = document.getElementById('immersiveWeather');
    if (container) container.innerHTML = '';
    this._weatherParticles = [];
  },

  /**
   * 切换天气特效开关
   */
  toggleWeather() {
    const scene = this.getSceneById(this._currentSceneId);
    if (!scene) return;

    if (this._isWeatherActive) {
      this._stopWeatherAnimation();
      App.toast('天气特效已关闭', 'info');
    } else {
      if (scene.weatherEffect && scene.weatherEffect !== 'none') {
        this._startWeatherAnimation(scene.weatherEffect);
        App.toast('天气特效已开启', 'info');
      } else {
        App.toast('当前场景未设置天气特效', 'info');
      }
    }
    // 更新按钮文字
    const btn = document.querySelector('.portal-action-btn[onclick*="toggleWeather"] span:last-child');
    if (btn) btn.textContent = this._isWeatherActive ? '关闭特效' : '开启特效';
  },

  /* ========================================================
   * 氛围文字动画
   * ======================================================== */

  /**
   * 启动氛围文字渐入渐出动画
   * @param {string} text 氛围描述文字
   */
  _startAmbianceAnimation(text) {
    this._stopAmbianceAnimation();
    const el = document.getElementById('ambianceText');
    if (!el || !text) return;

    const sentences = text.split(/[。！？.!?]/).filter(s => s.trim());
    if (sentences.length === 0) sentences.push(text);

    let index = 0;
    el.style.opacity = '0';
    el.textContent = sentences[0];

    const showNext = () => {
      if (!this._ambianceTimer) return;
      el.style.transition = 'opacity 1.5s ease-in-out';
      el.style.opacity = '0';

      setTimeout(() => {
        index = (index + 1) % sentences.length;
        el.textContent = sentences[index];
        el.style.opacity = '1';
      }, 1500);
    };

    // 初始显示
    setTimeout(() => { el.style.opacity = '1'; }, 500);
    this._ambianceTimer = setInterval(showNext, 6000);
  },

  /**
   * 停止氛围文字动画
   */
  _stopAmbianceAnimation() {
    if (this._ambianceTimer) {
      clearInterval(this._ambianceTimer);
      this._ambianceTimer = null;
    }
  },

  /* ========================================================
   * BGM控制
   * ======================================================== */

  /**
   * 播放BGM
   * @param {string} musicId 音乐ID
   */
  async _playBGM(musicId) {
    if (window.MusicManager && MusicManager.play) {
      await MusicManager.play(musicId);
    }
  },

  /**
   * 停止BGM
   */
  _stopBGM() {
    if (window.MusicManager && MusicManager._audio) {
      MusicManager._audio.pause();
      MusicManager._playing = false;
    }
  },

  /**
   * 切换BGM播放/暂停
   */
  toggleBGM() {
    if (window.MusicManager && MusicManager._audio) {
      if (MusicManager._playing) {
        MusicManager._audio.pause();
        MusicManager._playing = false;
        App.toast('BGM已暂停', 'info');
      } else {
        MusicManager._audio.play().catch(() => {});
        MusicManager._playing = true;
        App.toast('BGM已播放', 'info');
      }
    }
  },

  /* ========================================================
   * 场景编辑/创建
   * ======================================================== */

  /**
   * 打开创建场景对话框
   */
  openCreateDialog() {
    this._editingScene = null;
    this._viewMode = 'edit';
    this.renderPage();
  },

  /**
   * 打开编辑场景对话框
   * @param {string} sceneId 场景ID
   */
  openEditDialog(sceneId) {
    const scene = this.getSceneById(sceneId);
    if (!scene) {
      App.toast('场景不存在', 'error');
      return;
    }
    this._editingScene = JSON.parse(JSON.stringify(scene));
    this._viewMode = 'edit';
    this.renderPage();
  },

  /**
   * 渲染场景编辑器
   */
  renderEditor() {
    const page = document.getElementById('page-juncheng');
    if (!page) return;

    const isEdit = !!this._editingScene;
    const scene = isEdit ? this._editingScene : this._getEmptyScene();

    // 获取可选资源
    const backgrounds = (window.BackgroundLibrary && BackgroundLibrary.getBackgrounds)
      ? BackgroundLibrary.getBackgrounds() : Storage.get('backgrounds_v3', []);
    const musicList = (window.MusicManager && MusicManager.getMusicList)
      ? MusicManager.getMusicList() : Storage.get('musicList_v2', []);
    const npcs = (window.NPCManager && NPCManager.getNPCs) ? NPCManager.getNPCs() : [];

    page.innerHTML = `
      <div class="portal-editor">
        <div class="portal-editor-header">
          <button class="btn btn-sm btn-secondary" onclick="PortalSystem.backToList()">← 返回</button>
          <h2 class="section-title">${isEdit ? '✏️ 编辑场景' : '➕ 创建场景'}</h2>
        </div>

        <div class="portal-editor-form">
          <!-- 基本信息 -->
          <div class="portal-form-section">
            <h3>基本信息</h3>
            <div class="form-group">
              <label>场景名称 *</label>
              <input type="text" id="sceneName" value="${scene.name || ''}" placeholder="如：长安城·醉仙楼">
            </div>
            <div class="form-group">
              <label>场景描述</label>
              <textarea id="sceneDesc" rows="3" placeholder="描述这个场景的环境、氛围...">${scene.description || ''}</textarea>
            </div>
            <div class="form-group">
              <label>氛围描述（用于沉浸界面动态显示）</label>
              <textarea id="sceneAmbiance" rows="2" placeholder="如：细雨绵绵，琴声悠扬...">${scene.ambiance || ''}</textarea>
            </div>
          </div>

          <!-- 视觉与听觉 -->
          <div class="portal-form-section">
            <h3>视觉与听觉</h3>
            <div class="form-row">
              <div class="form-group">
                <label>背景图</label>
                <select id="sceneBackground">
                  <option value="">不设置背景</option>
                  ${backgrounds.map(bg => `
                    <option value="${bg.id}" ${scene.backgroundId === bg.id ? 'selected' : ''}>${bg.name}</option>
                  `).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>背景音乐</label>
                <select id="sceneBGM">
                  <option value="">不设置BGM</option>
                  ${musicList.map(m => `
                    <option value="${m.id}" ${scene.bgMusicId === m.id ? 'selected' : ''}>${m.name}</option>
                  `).join('')}
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>光照效果</label>
                <select id="sceneLighting">
                  ${Object.entries(this.LIGHTING_CONFIG).map(([k, v]) => `
                    <option value="${k}" ${scene.lighting === k ? 'selected' : ''}>${v.name}</option>
                  `).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>天气特效</label>
                <select id="sceneWeather">
                  ${Object.entries(this.WEATHER_CONFIG).map(([k, v]) => `
                    <option value="${k}" ${scene.weatherEffect === k ? 'selected' : ''}>${v.name}</option>
                  `).join('')}
                </select>
              </div>
            </div>
          </div>

          <!-- 时间与季节 -->
          <div class="portal-form-section">
            <h3>时间与季节</h3>
            <div class="form-row">
              <div class="form-group">
                <label>时辰</label>
                <select id="sceneTime">
                  ${this.TIME_OPTIONS.map(t => `
                    <option value="${t}" ${scene.timeOfDay === t ? 'selected' : ''}>${t}</option>
                  `).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>季节</label>
                <select id="sceneSeason">
                  ${this.SEASON_OPTIONS.map(s => `
                    <option value="${s}" ${scene.season === s ? 'selected' : ''}>${s}</option>
                  `).join('')}
                </select>
              </div>
            </div>
          </div>

          <!-- NPC设置 -->
          <div class="portal-form-section">
            <h3>在场NPC</h3>
            <div class="portal-npc-selector">
              ${npcs.length === 0 ?
                '<p style="color:var(--text-muted);font-size:13px;">暂无可用NPC，请先在角色管理中创建</p>' :
                npcs.map(npc => `
                  <label class="portal-npc-checkbox ${(scene.npcIds || []).includes(npc.id) ? 'selected' : ''}">
                    <input type="checkbox" value="${npc.id}" ${(scene.npcIds || []).includes(npc.id) ? 'checked' : ''} onchange="PortalSystem._toggleNPCInEditor('${npc.id}')">
                    <span class="portal-npc-check-name">👤 ${npc.name}</span>
                  </label>
                `).join('')
              }
            </div>
          </div>

          <!-- 物品设置 -->
          <div class="portal-form-section">
            <h3>场景物品</h3>
            <div id="editorObjectsList">
              ${this._renderEditorObjectsList(scene.objects || [])}
            </div>
            <button class="btn btn-sm btn-secondary" onclick="PortalSystem._addObjectToEditor()">➕ 添加物品</button>
          </div>

          <!-- 地图联动 -->
          <div class="portal-form-section">
            <h3>地图联动</h3>
            <div class="form-group">
              <label>关联地图地点</label>
              <select id="sceneMapLocation">
                <option value="">不关联</option>
                <!-- 动态加载地图地点 -->
              </select>
              <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">关联后，地图上双击该地点可直接进入此场景</p>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="portal-editor-actions">
            <button class="btn btn-secondary" onclick="PortalSystem.backToList()">取消</button>
            <button class="btn btn-primary" onclick="PortalSystem.saveScene()">${isEdit ? '保存修改' : '创建场景'}</button>
          </div>
        </div>
      </div>
    `;

    // 加载地图地点选项
    this._loadMapLocationOptions(scene.mapLocationId);
    this._injectEditorCSS();
  },

  /**
   * 获取空场景模板
   * @returns {Object} 空场景对象
   */
  _getEmptyScene() {
    return {
      id: this._generateId(),
      name: '',
      description: '',
      backgroundId: null,
      bgMusicId: null,
      lighting: 'bright',
      weatherEffect: 'none',
      npcIds: [],
      objects: [],
      ambiance: '',
      timeOfDay: '正午',
      season: '春',
      mapLocationId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  },

  /**
   * 在编辑器中切换NPC选中状态
   * @param {string} npcId NPC ID
   */
  _toggleNPCInEditor(npcId) {
    if (!this._editingScene) this._editingScene = this._getEmptyScene();
    const idx = this._editingScene.npcIds.indexOf(npcId);
    if (idx > -1) {
      this._editingScene.npcIds.splice(idx, 1);
    } else {
      this._editingScene.npcIds.push(npcId);
    }
  },

  /**
   * 渲染编辑器中的物品列表
   * @param {Array} objects 物品数组
   * @returns {string} HTML字符串
   */
  _renderEditorObjectsList(objects) {
    if (!objects || !objects.length) {
      return '<p style="color:var(--text-muted);font-size:13px;">暂无物品</p>';
    }
    return objects.map((obj, idx) => `
      <div class="portal-editor-object-item">
        <input type="text" placeholder="名称" value="${obj.name || ''}" id="obj-name-${idx}">
        <input type="text" placeholder="描述" value="${obj.description || ''}" id="obj-desc-${idx}">
        <input type="text" placeholder="图标emoji" value="${obj.icon || '📦'}" id="obj-icon-${idx}" style="width:60px;">
        <select id="obj-type-${idx}">
          ${this.OBJECT_INTERACTIONS.map(t => `
            <option value="${t.id}" ${obj.interactionType === t.id ? 'selected' : ''}>${t.name}</option>
          `).join('')}
        </select>
        <button class="btn btn-sm btn-danger" onclick="PortalSystem._removeObjectFromEditor(${idx})">🗑️</button>
      </div>
    `).join('');
  },

  /**
   * 向编辑器添加新物品
   */
  _addObjectToEditor() {
    if (!this._editingScene) this._editingScene = this._getEmptyScene();
    if (!this._editingScene.objects) this._editingScene.objects = [];
    this._editingScene.objects.push({
      name: '',
      description: '',
      icon: '📦',
      interactionType: 'view',
      x: 20 + Math.random() * 60,
      y: 50 + Math.random() * 30,
    });
    // 重新渲染物品列表
    const list = document.getElementById('editorObjectsList');
    if (list) list.innerHTML = this._renderEditorObjectsList(this._editingScene.objects);
  },

  /**
   * 从编辑器移除物品
   * @param {number} index 物品索引
   */
  _removeObjectFromEditor(index) {
    if (!this._editingScene || !this._editingScene.objects) return;
    this._editingScene.objects.splice(index, 1);
    const list = document.getElementById('editorObjectsList');
    if (list) list.innerHTML = this._renderEditorObjectsList(this._editingScene.objects);
  },

  /**
   * 加载地图地点下拉选项
   * @param {string} selectedId 当前选中的地点ID
   */
  _loadMapLocationOptions(selectedId) {
    const select = document.getElementById('sceneMapLocation');
    if (!select) return;

    let locations = [];
    if (window.MapSystem && MapSystem.getLocations) {
      locations = MapSystem.getLocations();
    } else {
      const mapData = Storage.get(MapSystem?.STORAGE_KEY || 'exploration_map_v12', {});
      locations = mapData.locations || [];
    }

    select.innerHTML = `
      <option value="">不关联</option>
      ${locations.map(loc => `
        <option value="${loc.id}" ${selectedId === loc.id ? 'selected' : ''}>${loc.name}</option>
      `).join('')}
    `;
  },

  /**
   * 保存场景（创建或编辑）
   */
  saveScene() {
    const name = document.getElementById('sceneName')?.value?.trim();
    if (!name) {
      App.toast('请输入场景名称', 'error');
      return;
    }

    const isEdit = !!this._editingScene?.id;
    const sceneId = isEdit ? this._editingScene.id : this._generateId();

    // 收集物品数据
    const objects = [];
    const objectItems = document.querySelectorAll('.portal-editor-object-item');
    objectItems.forEach((item, idx) => {
      const nameEl = document.getElementById(`obj-name-${idx}`);
      const descEl = document.getElementById(`obj-desc-${idx}`);
      const iconEl = document.getElementById(`obj-icon-${idx}`);
      const typeEl = document.getElementById(`obj-type-${idx}`);
      if (nameEl) {
        objects.push({
          name: nameEl.value || '未命名物品',
          description: descEl?.value || '',
          icon: iconEl?.value || '📦',
          interactionType: typeEl?.value || 'view',
          x: 20 + Math.random() * 60,
          y: 50 + Math.random() * 30,
        });
      }
    });

    const newScene = {
      id: sceneId,
      name: name,
      description: document.getElementById('sceneDesc')?.value || '',
      backgroundId: document.getElementById('sceneBackground')?.value || null,
      bgMusicId: document.getElementById('sceneBGM')?.value || null,
      lighting: document.getElementById('sceneLighting')?.value || 'bright',
      weatherEffect: document.getElementById('sceneWeather')?.value || 'none',
      npcIds: this._editingScene?.npcIds || [],
      objects: objects,
      ambiance: document.getElementById('sceneAmbiance')?.value || '',
      timeOfDay: document.getElementById('sceneTime')?.value || '正午',
      season: document.getElementById('sceneSeason')?.value || '春',
      mapLocationId: document.getElementById('sceneMapLocation')?.value || null,
      createdAt: isEdit ? (this._editingScene.createdAt || Date.now()) : Date.now(),
      updatedAt: Date.now(),
    };

    const scenes = this.getScenes();
    if (isEdit) {
      const idx = scenes.findIndex(s => s.id === sceneId);
      if (idx > -1) scenes[idx] = newScene;
      else scenes.push(newScene);
    } else {
      scenes.push(newScene);
    }

    this.saveScenes(scenes);
    this._editingScene = null;
    this._viewMode = 'list';
    this.renderPage();
    App.toast(`场景「${name}」${isEdit ? '已保存' : '已创建'}`, 'success');
  },

  /* ========================================================
   * AI生成场景
   * ======================================================== */

  /**
   * 打开AI生成界面
   */
  openAIGenerator() {
    this._aiPreviewScene = null;
    this._viewMode = 'ai-generate';
    this.renderPage();
  },

  /**
   * 渲染AI生成界面
   */
  renderAIGenerator() {
    const page = document.getElementById('page-juncheng');
    if (!page) return;

    page.innerHTML = `
      <div class="portal-ai-generator">
        <div class="portal-editor-header">
          <button class="btn btn-sm btn-secondary" onclick="PortalSystem.backToList()">← 返回</button>
          <h2 class="section-title">🤖 AI生成场景</h2>
        </div>

        <div class="portal-ai-input-section">
          <p style="color:var(--text-secondary);margin-bottom:12px;">描述你想要的场景，AI将为你生成完整的场景配置</p>
          <textarea id="aiScenePrompt" rows="4" placeholder="如：一个雨夜的古代庭院，有樱花飘落，一位白衣女子在弹琴，烛光摇曳..."></textarea>
          <button class="btn btn-primary" onclick="PortalSystem.generateSceneWithAI()" style="margin-top:12px;">
            ✨ 生成场景
          </button>
        </div>

        <div id="aiPreviewArea" style="display:none;">
          <h3 style="margin:24px 0 16px;color:var(--color-gold);">📋 生成结果预览</h3>
          <div id="aiPreviewContent"></div>
          <div style="display:flex;gap:12px;margin-top:20px;">
            <button class="btn btn-secondary" onclick="PortalSystem._aiPreviewScene = null; PortalSystem.renderAIGenerator();">重新生成</button>
            <button class="btn btn-primary" onclick="PortalSystem.confirmAIGeneratedScene()">确认创建</button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 调用AI生成场景
   */
  async generateSceneWithAI() {
    const promptText = document.getElementById('aiScenePrompt')?.value?.trim();
    if (!promptText) {
      App.toast('请输入场景描述', 'error');
      return;
    }

    App.toast('AI正在生成场景配置...', 'info');

    try {
      const aiPrompt = `请根据用户的描述，生成一个完整的沉浸式场景配置。

用户描述：${promptText}

请严格按以下JSON格式返回（不要添加任何其他文字）：
{
  "name": "场景名称（2-6字）",
  "description": "场景详细描述（50字左右）",
  "ambiance": "氛围描述，用于沉浸界面动态显示，用2-3个短句",
  "lighting": "推荐光照：bright/dim/moonlight/candle/neon/foggy/sunset",
  "weatherEffect": "推荐天气：none/rain/snow/petals/leaves/fireflies/ash/starfall",
  "timeOfDay": "推荐时辰：清晨/上午/正午/下午/黄昏/夜晚/深夜/黎明",
  "season": "推荐季节：春/夏/秋/冬",
  "recommendedNPCCount": "推荐的NPC数量（数字）",
  "recommendedNPCPersonalities": ["推荐NPC性格1", "推荐NPC性格2"],
  "bgmType": "推荐BGM风格描述"
}`;

      const result = await APISettings.chat(aiPrompt, [], { useAux: true });

      // 解析JSON
      let parsed;
      try {
        const match = result.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(match ? match[0] : result);
      } catch (e) {
        App.toast('AI返回格式无法解析，请重试或手动创建', 'error');
        return;
      }

      // 构建预览场景
      this._aiPreviewScene = {
        id: this._generateId(),
        name: parsed.name || 'AI生成场景',
        description: parsed.description || '',
        ambiance: parsed.ambiance || '',
        lighting: this._validateLighting(parsed.lighting),
        weatherEffect: this._validateWeather(parsed.weatherEffect),
        timeOfDay: this.TIME_OPTIONS.includes(parsed.timeOfDay) ? parsed.timeOfDay : '正午',
        season: this.SEASON_OPTIONS.includes(parsed.season) ? parsed.season : '春',
        backgroundId: null,
        bgMusicId: null,
        npcIds: [],
        objects: [],
        mapLocationId: null,
        recommendedNPCCount: parsed.recommendedNPCCount || 0,
        recommendedNPCPersonalities: parsed.recommendedNPCPersonalities || [],
        bgmType: parsed.bgmType || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      this._renderAIPreview();
      App.toast('场景配置已生成，请预览确认', 'success');
    } catch (e) {
      App.toast('AI生成失败：' + e.message, 'error');
    }
  },

  /**
   * 验证光照值是否有效
   * @param {string} val 光照值
   * @returns {string} 验证后的光照值
   */
  _validateLighting(val) {
    return this.LIGHTING_CONFIG[val] ? val : 'bright';
  },

  /**
   * 验证天气值是否有效
   * @param {string} val 天气值
   * @returns {string} 验证后的天气值
   */
  _validateWeather(val) {
    return this.WEATHER_CONFIG[val] ? val : 'none';
  },

  /**
   * 渲染AI生成预览
   */
  _renderAIPreview() {
    const area = document.getElementById('aiPreviewArea');
    const content = document.getElementById('aiPreviewContent');
    if (!area || !content || !this._aiPreviewScene) return;

    const scene = this._aiPreviewScene;
    const lighting = this.LIGHTING_CONFIG[scene.lighting];
    const weather = this.WEATHER_CONFIG[scene.weatherEffect];

    content.innerHTML = `
      <div class="portal-ai-preview-card">
        <div class="portal-ai-preview-field">
          <span class="portal-ai-preview-label">场景名称</span>
          <span class="portal-ai-preview-value">${scene.name}</span>
        </div>
        <div class="portal-ai-preview-field">
          <span class="portal-ai-preview-label">场景描述</span>
          <span class="portal-ai-preview-value">${scene.description}</span>
        </div>
        <div class="portal-ai-preview-field">
          <span class="portal-ai-preview-label">氛围描述</span>
          <span class="portal-ai-preview-value portal-ai-preview-ambiance">${scene.ambiance}</span>
        </div>
        <div class="portal-ai-preview-row">
          <div class="portal-ai-preview-field">
            <span class="portal-ai-preview-label">光照</span>
            <span class="portal-ai-preview-value">${lighting?.name || '明亮'}</span>
          </div>
          <div class="portal-ai-preview-field">
            <span class="portal-ai-preview-label">天气</span>
            <span class="portal-ai-preview-value">${weather?.name || '无'}</span>
          </div>
          <div class="portal-ai-preview-field">
            <span class="portal-ai-preview-label">时辰</span>
            <span class="portal-ai-preview-value">${scene.timeOfDay}</span>
          </div>
          <div class="portal-ai-preview-field">
            <span class="portal-ai-preview-label">季节</span>
            <span class="portal-ai-preview-value">${scene.season}</span>
          </div>
        </div>
        <div class="portal-ai-preview-field">
          <span class="portal-ai-preview-label">推荐NPC</span>
          <span class="portal-ai-preview-value">${scene.recommendedNPCCount}位 · ${scene.recommendedNPCPersonalities.join('、') || '无'}</span>
        </div>
        <div class="portal-ai-preview-field">
          <span class="portal-ai-preview-label">推荐BGM</span>
          <span class="portal-ai-preview-value">${scene.bgmType || '无'}</span>
        </div>
        <div style="margin-top:12px;padding:8px 12px;background:rgba(201,162,39,0.1);border-radius:8px;border:1px dashed var(--color-gold);">
          <p style="font-size:12px;color:var(--text-muted);margin:0;">
            💡 确认创建后，背景图和BGM需要手动从现有库中选择或上传。NPC需要手动添加。
          </p>
        </div>
      </div>
    `;

    area.style.display = 'block';
  },

  /**
   * 确认创建AI生成的场景
   */
  confirmAIGeneratedScene() {
    if (!this._aiPreviewScene) return;

    const scenes = this.getScenes();
    scenes.push(this._aiPreviewScene);
    this.saveScenes(scenes);

    const sceneName = this._aiPreviewScene.name;
    this._aiPreviewScene = null;
    this._viewMode = 'list';
    this.renderPage();
    App.toast(`场景「${sceneName}」已创建，请编辑添加背景图和NPC`, 'success');
  },

  /* ========================================================
   * 删除场景
   * ======================================================== */

  /**
   * 删除场景
   * @param {string} sceneId 场景ID
   */
  deleteScene(sceneId) {
    const scene = this.getSceneById(sceneId);
    if (!scene) return;

    if (!confirm(`确定要删除场景「${scene.name}」吗？`)) return;

    let scenes = this.getScenes().filter(s => s.id !== sceneId);
    this.saveScenes(scenes);

    // 如果当前在沉浸式界面中，返回列表
    if (this._currentSceneId === sceneId) {
      this._currentSceneId = null;
      this._viewMode = 'list';
    }

    this.renderPage();
    App.toast('场景已删除', 'success');
  },

  /* ========================================================
   * 交互操作
   * ======================================================== */

  /**
   * 与NPC对话
   * @param {string} npcId NPC ID
   */
  talkToNPC(npcId) {
    this._enterRuntimeWithNPC(npcId);
  },

  /**
   * 进入对话模式
   */
  enterDialog() {
    const scene = this.getSceneById(this._currentSceneId);
    if (!scene) return;

    const npcs = this._getNPCsInScene(scene);
    if (npcs.length === 0) {
      App.toast('此场景暂无NPC，请先添加', 'info');
      return;
    }

    if (npcs.length === 1) {
      this._enterRuntimeWithNPC(npcs[0].id);
    } else {
      // 多NPC时显示选择面板
      this.startDialog();
    }
  },

  /**
   * 显示对话选择面板
   */
  startDialog() {
    const scene = this.getSceneById(this._currentSceneId);
    if (!scene) return;

    const npcs = this._getNPCsInScene(scene);
    if (npcs.length === 0) {
      App.toast('请先创建或添加NPC到场景', 'info');
      return;
    }

    const options = npcs.map(n => `
      <button class="btn btn-secondary" style="margin:6px;padding:12px 24px;" onclick="PortalSystem._enterRuntimeWithNPC('${n.id}');App.closeModal();">
        <div style="font-size:24px;">👤</div>
        <div>${n.name}</div>
      </button>
    `).join('');

    App.showModal(`💬 选择与谁对话${scene ? ' · ' + scene.name : ''}`, `
      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">${options}</div>
    `);
  },

  /**
   * 进入运行时与NPC对话
   * @param {string} npcId NPC ID
   */
  _enterRuntimeWithNPC(npcId) {
    App.navigate('runtime');
    setTimeout(() => {
      if (window.NovelRuntime && NovelRuntime.selectNPC) NovelRuntime.selectNPC(npcId);
      const scene = this.getSceneById(this._currentSceneId);
      if (scene && window.NovelRuntime && NovelRuntime.setSceneContext) {
        NovelRuntime.setSceneContext(scene.name, scene.description);
      }
    }, 300);
  },

  /**
   * 开启群像对话
   */
  startGroupChat() {
    const scene = this.getSceneById(this._currentSceneId);
    if (!scene) return;

    const npcs = this._getNPCsInScene(scene);
    if (npcs.length === 0) {
      App.toast('此场景暂无NPC，无法开启群像对话', 'info');
      return;
    }

    if (npcs.length < 2) {
      App.toast('至少需要2位NPC才能开启群像对话', 'info');
      return;
    }

    const npcIds = npcs.map(n => n.id);

    // 启动群像会话
    if (window.GroupChat && GroupChat.startSession) {
      GroupChat.startSession(scene.id, npcIds);
      App.navigate('group-chat');
      App.toast('群像对话已开启', 'success');
    } else {
      App.toast('群像系统未加载', 'error');
    }
  },

  /**
   * 与场景内物品互动
   * @param {number} objectIndex 物品索引
   */
  interactWithObject(objectIndex) {
    const scene = this.getSceneById(this._currentSceneId);
    if (!scene || !scene.objects || !scene.objects[objectIndex]) return;

    const obj = scene.objects[objectIndex];
    const interaction = this.OBJECT_INTERACTIONS.find(t => t.id === obj.interactionType);

    switch (obj.interactionType) {
      case 'view':
        App.showModal(obj.name, `
          <div style="text-align:center;padding:20px;">
            <div style="font-size:48px;margin-bottom:12px;">${obj.icon || '📦'}</div>
            <p style="color:var(--text-secondary);">${obj.description || '没有什么特别的。'}</p>
          </div>
        `);
        break;
      case 'pickup':
        // 添加到背包
        if (window.Inventory && Inventory.addItem) {
          Inventory.addItem({
            name: obj.name,
            description: obj.description,
            icon: obj.icon || '📦',
            source: scene.name,
          });
          App.toast(`获得了「${obj.name}」`, 'success');
        } else {
          App.toast(`拾取了「${obj.name}」（背包系统未加载）`, 'info');
        }
        break;
      case 'use':
        App.toast(`使用了「${obj.name}」`, 'info');
        break;
      case 'trigger':
        App.toast(`触发了「${obj.name}」相关事件`, 'info');
        break;
      default:
        App.toast(`${interaction?.name || '互动'}了「${obj.name}」`, 'info');
    }
  },

  /**
   * 查看地图
   */
  viewMap() {
    const scene = this.getSceneById(this._currentSceneId);
    if (scene && scene.mapLocationId) {
      // 如果有绑定的地图地点，尝试定位到该地点
      if (window.MapSystem && MapSystem.centerOnLocation) {
        MapSystem.centerOnLocation(scene.mapLocationId);
      }
    }
    App.navigate('map');
  },

  /**
   * 返回列表界面
   */
  backToList() {
    this._stopWeatherAnimation();
    this._stopAmbianceAnimation();
    this._stopBGM();
    this._currentSceneId = null;
    this._viewMode = 'list';
    this.renderPage();
  },

  /* ========================================================
   * 地图联动：从地点生成场景
   * ======================================================== */

  /**
   * 从地图地点生成场景
   * @param {Object} location 地图地点对象
   * @returns {string|null} 新场景ID
   */
  generateSceneFromLocation(location) {
    if (!location || !location.id) return null;

    const scenes = this.getScenes();
    const newScene = {
      id: this._generateId(),
      name: location.name || '未命名地点',
      description: location.description || `位于地图上的${location.name || '地点'}`,
      backgroundId: location.backgroundId || null,
      bgMusicId: null,
      lighting: 'bright',
      weatherEffect: 'none',
      npcIds: location.npcIds || [],
      objects: [],
      ambiance: `你来到了${location.name || '这个地方'}。`,
      timeOfDay: '正午',
      season: '春',
      mapLocationId: location.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    scenes.push(newScene);
    this.saveScenes(scenes);
    return newScene.id;
  },

  /**
   * 获取与地点关联的场景
   * @param {string} locationId 地点ID
   * @returns {Object|null} 场景对象
   */
  getSceneByLocationId(locationId) {
    return this.getScenes().find(s => s.mapLocationId === locationId) || null;
  },

  /* ========================================================
   * CSS注入
   * ======================================================== */

  /**
   * 注入门户系统通用CSS
   */
  _injectPortalCSS() {
    const id = 'portal-system-css';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      .portal-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-lg); flex-wrap:wrap; gap:12px; }
      .portal-header-actions { display:flex; gap:8px; }
      .portal-filter-bar { display:flex; gap:10px; margin-bottom:var(--space-lg); flex-wrap:wrap; align-items:center; }
      .portal-search-input { flex:1; min-width:200px; padding:10px 16px; border:1px solid var(--border-gold); border-radius:var(--border-radius); background:var(--bg-input); color:var(--text-primary); font-size:14px; }
      .portal-search-input:focus { outline:none; border-color:var(--color-gold); box-shadow:0 0 0 3px rgba(201,162,39,0.15); }
      .portal-filter-select { padding:10px 14px; border:1px solid var(--border-gold); border-radius:var(--border-radius); background:var(--bg-input); color:var(--text-primary); font-size:14px; cursor:pointer; }

      .portal-scene-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:16px; }
      .portal-empty-state { grid-column:1 / -1; text-align:center; padding:48px 24px; background:var(--bg-parchment); border:2px dashed var(--color-gold); border-radius:var(--border-radius-lg); }
      .portal-empty-icon { font-size:48px; margin-bottom:16px; }
      .portal-empty-title { font-size:18px; font-weight:600; color:var(--text-primary); margin-bottom:8px; }
      .portal-empty-desc { font-size:13px; color:var(--text-muted); margin-bottom:20px; }
      .portal-empty-actions { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }

      .portal-scene-card { background:var(--bg-parchment); border:1px solid var(--border-gold); border-radius:var(--border-radius-lg); overflow:hidden; cursor:pointer; transition:transform 0.25s, box-shadow 0.25s; position:relative; }
      .portal-scene-card:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(44,24,16,0.18); }
      .portal-card-bg { position:relative; height:140px; overflow:hidden; }
      .portal-card-overlay { position:absolute; inset:0; background:linear-gradient(180deg, transparent 40%, rgba(44,24,16,0.7) 100%); }
      .portal-card-tags { position:absolute; top:10px; left:10px; display:flex; gap:6px; flex-wrap:wrap; }
      .portal-tag { padding:3px 10px; border-radius:12px; font-size:11px; font-weight:500; }
      .portal-tag-lighting { background:rgba(201,162,39,0.25); color:var(--color-gold); border:1px solid rgba(201,162,39,0.4); }
      .portal-tag-weather { background:rgba(255,255,255,0.2); color:#fff; border:1px solid rgba(255,255,255,0.3); }
      .portal-card-info { padding:14px 16px; }
      .portal-card-title { font-size:16px; font-weight:600; color:var(--text-primary); margin-bottom:6px; font-family:var(--font-display); }
      .portal-card-desc { font-size:13px; color:var(--text-secondary); margin-bottom:10px; line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      .portal-card-meta { display:flex; gap:10px; flex-wrap:wrap; font-size:11px; color:var(--text-muted); }
      .portal-meta-item { display:flex; align-items:center; gap:3px; }
      .portal-card-actions { display:flex; gap:6px; padding:0 16px 14px; }

      .portal-immersive-container { position:relative; width:100%; height:calc(100vh - 180px); min-height:500px; border-radius:var(--border-radius-lg); overflow:hidden; border:2px solid var(--color-gold); }
      .portal-immersive-bg { position:absolute; inset:0; z-index:1; }
      .portal-immersive-bg-img { position:absolute; inset:0; background-size:cover; background-position:center; opacity:0; transition:opacity 1.2s ease; }
      .portal-immersive-tint { position:absolute; inset:0; z-index:2; pointer-events:none; transition:background 0.8s ease; }
      .portal-immersive-filter { position:absolute; inset:0; z-index:3; pointer-events:none; transition:filter 0.8s ease; }
      .portal-immersive-weather { position:absolute; inset:0; z-index:4; pointer-events:none; overflow:hidden; }
      .portal-immersive-header { position:absolute; top:0; left:0; right:0; z-index:10; display:flex; align-items:center; justify-content:space-between; padding:16px 20px; background:linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%); }
      .portal-immersive-title h2 { color:#fff; font-size:22px; font-weight:700; margin:0; font-family:var(--font-display); text-shadow:0 2px 8px rgba(0,0,0,0.5); }
      .portal-immersive-subtitle { color:rgba(255,255,255,0.8); font-size:13px; margin-left:4px; }
      .portal-immersive-header-actions { display:flex; gap:8px; }
      .portal-immersive-content { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; justify-content:flex-end; padding:20px; pointer-events:none; }
      .portal-immersive-ambiance { position:absolute; bottom:120px; left:50%; transform:translateX(-50%); max-width:600px; text-align:center; color:rgba(255,255,255,0.9); font-size:15px; line-height:1.8; text-shadow:0 1px 4px rgba(0,0,0,0.8); opacity:0; transition:opacity 1.5s ease; pointer-events:none; font-style:italic; }
      .portal-immersive-npcs { position:absolute; right:20px; top:50%; transform:translateY(-50%); display:flex; flex-direction:column; gap:12px; pointer-events:auto; z-index:6; }
      .portal-npc-avatar { display:flex; align-items:center; gap:10px; cursor:pointer; transition:transform 0.2s; }
      .portal-npc-avatar:hover { transform:translateX(-4px); }
      .portal-npc-portrait { width:52px; height:52px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(201,162,39,0.3); transition:box-shadow 0.2s; }
      .portal-npc-avatar:hover .portal-npc-portrait { box-shadow:0 6px 20px rgba(201,162,39,0.5); }
      .portal-npc-name { color:#fff; font-size:13px; font-weight:500; text-shadow:0 1px 3px rgba(0,0,0,0.8); }
      .portal-npc-empty { color:rgba(255,255,255,0.6); font-size:13px; text-shadow:0 1px 3px rgba(0,0,0,0.5); }
      .portal-immersive-objects { position:absolute; inset:0; z-index:6; pointer-events:none; }
      .portal-scene-object { position:absolute; display:flex; flex-direction:column; align-items:center; gap:4px; cursor:pointer; pointer-events:auto; transition:transform 0.2s; }
      .portal-scene-object:hover { transform:scale(1.15); }
      .portal-object-icon { width:40px; height:40px; border-radius:50%; background:rgba(0,0,0,0.5); border:1px solid var(--color-gold); display:flex; align-items:center; justify-content:center; font-size:20px; backdrop-filter:blur(4px); }
      .portal-object-label { color:#fff; font-size:11px; text-shadow:0 1px 3px rgba(0,0,0,0.8); background:rgba(0,0,0,0.4); padding:2px 8px; border-radius:8px; }
      .portal-immersive-footer { position:absolute; bottom:0; left:0; right:0; z-index:10; display:flex; justify-content:center; gap:12px; padding:16px 20px; background:linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 100%); pointer-events:auto; }
      .portal-action-btn { display:flex; flex-direction:column; align-items:center; gap:4px; padding:10px 20px; min-width:80px; }
      .portal-action-icon { font-size:20px; }

      .portal-editor { max-width:800px; margin:0 auto; }
      .portal-editor-header { display:flex; align-items:center; gap:12px; margin-bottom:var(--space-lg); }
      .portal-editor-form { display:flex; flex-direction:column; gap:var(--space-lg); }
      .portal-form-section { background:var(--bg-parchment); border:1px solid var(--border-gold); border-radius:var(--border-radius); padding:var(--space-md); }
      .portal-form-section h3 { font-size:15px; color:var(--color-gold); margin-bottom:var(--space-sm); font-family:var(--font-display); }
      .portal-form-section .form-group { margin-bottom:var(--space-sm); }
      .portal-form-section .form-group:last-child { margin-bottom:0; }
      .portal-form-row { display:flex; gap:var(--space-md); }
      .portal-form-row .form-group { flex:1; }
      .portal-npc-selector { display:flex; flex-wrap:wrap; gap:8px; }
      .portal-npc-checkbox { display:flex; align-items:center; gap:6px; padding:8px 12px; border:1px solid var(--border-gold); border-radius:var(--border-radius-sm); cursor:pointer; transition:all 0.2s; background:var(--bg-input); }
      .portal-npc-checkbox:hover { border-color:var(--color-gold); }
      .portal-npc-checkbox.selected { background:rgba(201,162,39,0.15); border-color:var(--color-gold); }
      .portal-npc-checkbox input { display:none; }
      .portal-npc-check-name { font-size:13px; color:var(--text-primary); }
      .portal-editor-object-item { display:flex; gap:8px; align-items:center; margin-bottom:8px; flex-wrap:wrap; }
      .portal-editor-object-item input, .portal-editor-object-item select { padding:8px; border:1px solid var(--border-gold); border-radius:var(--border-radius-sm); background:var(--bg-input); color:var(--text-primary); font-size:13px; }
      .portal-editor-object-item input { flex:1; min-width:80px; }
      .portal-editor-actions { display:flex; justify-content:flex-end; gap:12px; margin-top:var(--space-md); padding-top:var(--space-md); border-top:1px solid var(--border-gold); }

      .portal-ai-generator { max-width:700px; margin:0 auto; }
      .portal-ai-input-section textarea { width:100%; padding:12px; border:1px solid var(--border-gold); border-radius:var(--border-radius); background:var(--bg-input); color:var(--text-primary); font-size:14px; resize:vertical; }
      .portal-ai-preview-card { background:var(--bg-parchment); border:1px solid var(--border-gold); border-radius:var(--border-radius); padding:var(--space-md); }
      .portal-ai-preview-field { display:flex; gap:12px; margin-bottom:10px; align-items:flex-start; }
      .portal-ai-preview-label { min-width:80px; font-size:13px; color:var(--text-muted); font-weight:500; flex-shrink:0; }
      .portal-ai-preview-value { font-size:14px; color:var(--text-primary); flex:1; }
      .portal-ai-preview-ambiance { font-style:italic; color:var(--color-gold); }
      .portal-ai-preview-row { display:grid; grid-template-columns:repeat(4, 1fr); gap:12px; margin-bottom:10px; }

      /* 天气粒子基础样式 */
      .weather-particle { position:absolute; pointer-events:none; }
      .weather-rain .weather-particle { width:2px; height:12px; background:rgba(200,220,255,0.6); border-radius:1px; animation:fall linear infinite; }
      .weather-snow .weather-particle { width:4px; height:4px; background:rgba(255,255,255,0.8); border-radius:50%; animation:fall-spin linear infinite; }
      .weather-petals .weather-particle { width:8px; height:8px; background:rgba(255,180,200,0.7); border-radius:50% 0 50% 0; animation:fall-sway linear infinite; }
      .weather-leaves .weather-particle { width:10px; height:6px; background:rgba(200,150,50,0.6); border-radius:50% 0; animation:fall-tumble linear infinite; }
      .weather-fireflies .weather-particle { width:4px; height:4px; background:rgba(255,220,100,0.9); border-radius:50%; animation:firefly-glow ease-in-out infinite alternate; box-shadow:0 0 6px rgba(255,220,100,0.6); }
      .weather-ash .weather-particle { width:3px; height:3px; background:rgba(150,150,150,0.5); border-radius:50%; animation:fall-drift linear infinite; }
      .weather-starfall .weather-particle { width:2px; height:8px; background:rgba(255,255,200,0.8); border-radius:1px; animation:starfall linear infinite; box-shadow:0 0 4px rgba(255,255,200,0.5); }

      @keyframes fall { to { transform:translateY(100vh); } }
      @keyframes fall-spin { to { transform:translateY(100vh) rotate(360deg); } }
      @keyframes fall-sway { 0% { transform:translateY(-20px) translateX(0) rotate(0deg); } 25% { transform:translateY(25vh) translateX(20px) rotate(90deg); } 50% { transform:translateY(50vh) translateX(-10px) rotate(180deg); } 75% { transform:translateY(75vh) translateX(15px) rotate(270deg); } 100% { transform:translateY(100vh) translateX(0) rotate(360deg); } }
      @keyframes fall-tumble { to { transform:translateY(100vh) rotate(720deg); } }
      @keyframes firefly-glow { 0% { opacity:0.3; transform:scale(0.8); } 100% { opacity:1; transform:scale(1.2); } }
      @keyframes fall-drift { 0% { transform:translateY(-10px) translateX(0); } 50% { transform:translateY(50vh) translateX(30px); } 100% { transform:translateY(100vh) translateX(-20px); } }
      @keyframes starfall { 0% { transform:translateY(-10px) translateX(0) rotate(0deg); opacity:1; } 100% { transform:translateY(100vh) translateX(100px) rotate(45deg); opacity:0; } }
    `;
    document.head.appendChild(style);
  },

  /**
   * 注入沉浸式界面专属CSS
   */
  _injectImmersiveCSS() {
    // 已由 _injectPortalCSS 统一注入
  },

  /**
   * 注入编辑器界面专属CSS
   */
  _injectEditorCSS() {
    // 已由 _injectPortalCSS 统一注入
  },

  /**
   * 注入天气系统CSS
   */
  _injectWeatherCSS() {
    const id = 'portal-weather-css';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      /* 天气系统基础样式已由 _injectPortalCSS 注入 */
    `;
    document.head.appendChild(style);
  },
};
