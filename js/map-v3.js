/**
 * =========================================================
 * Map System v12 — 自由探索地图系统（Canvas 2D 无限地图）
 * 特性：零预设地点、右键添加、路径连线、Dijkstra寻路、
 *       拖拽平移缩放、地点详情面板、古风墨境配色
 * =========================================================
 */
const MapSystem = {
  // ============ 常量定义 ============

  /** 地点类型配置：8种类型，各自颜色与名称 */
  LOCATION_TYPES: {
    town:   { name: '城镇', color: '#C9A227', border: '#B8941F' },
    wild:   { name: '野外', color: '#4CAF50', border: '#43A047' },
    dungeon:{ name: '副本', color: '#E53935', border: '#C62828' },
    hidden: { name: '隐藏', color: '#9E9E9E', border: '#757575' },
    shop:   { name: '商店', color: '#1E88E5', border: '#1565C0' },
    manor:  { name: '府邸', color: '#7B1FA2', border: '#6A1B9A' },
    temple: { name: '寺庙', color: '#F57C00', border: '#E65100' },
    water:  { name: '水域', color: '#0097A7', border: '#00838F' }
  },

  /** 古风墨境配色方案 */
  COLORS: {
    parchment:   '#F5E6D3',  // 羊皮纸底色
    parchmentDark:'#E8D4BC', // 羊皮纸深色
    ink:          '#2C1810',  // 墨色
    inkLight:     '#5C3A2E', // 浅墨
    inkMuted:     '#8B6F5E', // 淡墨
    gold:         '#C9A227',  // 金色
    goldLight:    '#E8C84B', // 浅金
    gridLine:     '#D4C4A8', // 网格线
    gridAxis:     '#B8A88A', // 坐标轴线
    text:         '#2C1810',  // 文字色
    panelBg:      '#FDF8F0', // 面板背景
    panelBorder:  '#C9A227', // 面板边框
    pathDefault:  '#8B6F5E', // 默认路径
    pathHighlight:'#C9A227', // 高亮路径
    selection:    '#C9A227'   // 选中框
  },

  /** 节点绘制常量 */
  NODE: {
    radius: 14,
    radiusHover: 18,
    fontSize: 13,
    labelOffset: 24
  },

  /** 存储键名 */
  STORAGE_KEY: 'exploration_map_v12',
  LEGACY_KEY:  'maps_v3',

  // ============ 运行时状态 ============

  /** Canvas 上下文 */
  _canvas: null,
  _ctx: null,

  /** 相机状态：世界坐标系下的视口中心 */
  _camera: { x: 0, y: 0, zoom: 1.0 },

  /** 拖拽状态 */
  _isDragging: false,
  _dragStart: { x: 0, y: 0 },
  _cameraStart: { x: 0, y: 0 },
  _draggedNode: null,
  _dragNodeOffset: { x: 0, y: 0 },

  /** 地点与路径选择状态 */
  _selectedLocationId: null,   // 选中的地点（用于创建路径）
  _hoveredLocationId: null,    // 鼠标悬停的地点
  _hoveredPath: null,          // 鼠标悬停的路径
  _currentLocationId: null,      // 玩家当前所在地点
  _shortestPath: null,           // Dijkstra寻路结果 [id, id, ...]

  /** 搜索与筛选 */
  _searchQuery: '',
  _filterTypes: new Set(Object.keys(this?.LOCATION_TYPES || {})),

  /** 脉冲动画 */
  _pulseTime: 0,
  _animFrame: null,

  /** 详情面板当前编辑的地点 */
  _editingLocation: null,

  /** 双击检测：记录上次点击的地点和时间 */
  _lastClickInfo: { locationId: null, time: 0 },

  /** 右键菜单状态 */
  _contextMenu: null,

  /** NPC移动动画状态：记录正在移动的NPC { npcId, fromId, toId, startTime, duration } */
  _movingNPCs: [],

  // ============ 初始化入口 ============

  /**
   * 初始化地图系统
   */
  init() {
    this._filterTypes = new Set(Object.keys(this.LOCATION_TYPES));
    this.renderPage();
  },

  /**
   * 进入地图页面时调用
   */
  onEnter() {
    this._migrateLegacyData();
    const data = this._loadData();
    // 若有地点，将相机置于第一个地点附近
    if (data.locations.length > 0) {
      const first = data.locations[0];
      this._camera.x = first.x;
      this._camera.y = first.y;
    }
    this.renderPage();
    this._startAnimation();
  },

  // ============ 数据持久化 ============

  /**
   * 加载地图数据
   */
  _loadData() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        return {
          locations: data.locations || [],
          paths: data.paths || [],
          currentLocationId: data.currentLocationId || null
        };
      }
    } catch (e) { console.warn('地图数据读取失败', e); }
    return { locations: [], paths: [], currentLocationId: null };
  },

  /**
   * 保存地图数据
   */
  _saveData(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) { console.warn('地图数据保存失败', e); }
  },

  /**
   * 获取完整数据对象
   */
  _getData() {
    return this._loadData();
  },

  /**
   * 兼容旧数据迁移（maps_v3 → exploration_map_v12）
   */
  _migrateLegacyData() {
    try {
      const legacy = localStorage.getItem(this.LEGACY_KEY);
      if (!legacy) return;
      const oldMaps = JSON.parse(legacy);
      if (!Array.isArray(oldMaps) || oldMaps.length === 0) return;

      const newData = this._loadData();
      let migratedCount = 0;

      oldMaps.forEach(map => {
        if (!map.markers) return;
        map.markers.forEach(m => {
          // 类型映射：旧版 type 转新版
          const typeMap = {
            location: 'town', event: 'wild', boss: 'dungeon',
            shop: 'shop', quest: 'hidden'
          };
          const newType = typeMap[m.type] || 'town';
          // 坐标转换：旧版百分比 → 新版世界坐标（映射到 -500~500 范围）
          const wx = (parseFloat(m.x) - 50) * 20;
          const wy = (parseFloat(m.y) - 50) * 20;

          // 避免重复导入（按名称去重）
          if (!newData.locations.find(loc => loc.name === m.name)) {
            newData.locations.push({
              id: 'loc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
              name: m.name,
              type: newType,
              x: wx,
              y: wy,
              description: m.description || '',
              population: '',
              specialty: '',
              danger: 5,
              climate: '',
              relatedNPCs: ''
            });
            migratedCount++;
          }
        });
      });

      if (migratedCount > 0) {
        this._saveData(newData);
        console.log(`[MapSystem] 已迁移 ${migratedCount} 个旧地点`);
      }

      // 迁移后标记，避免重复迁移
      localStorage.setItem(this.LEGACY_KEY + '_migrated', 'true');
    } catch (e) { console.warn('旧数据迁移失败', e); }
  },

  // ============ 页面渲染 ============

  /**
   * 渲染整个地图页面 HTML 结构与控件
   */
  renderPage() {
    const page = document.getElementById('page-map');
    if (!page) return;

    page.innerHTML = `
      <style>
        .map-v12-container { position:relative; width:100%; height:100vh; overflow:hidden; background:${this.COLORS.parchment}; }
        .map-v12-canvas { position:absolute; top:0; left:0; width:100%; height:100%; cursor:grab; }
        .map-v12-canvas:active { cursor:grabbing; }
        .map-v12-canvas.dragging-node { cursor:move; }
        .map-v12-topbar {
          position:absolute; top:12px; left:50%; transform:translateX(-50%);
          display:flex; align-items:center; gap:8px; z-index:100;
          background:rgba(253,248,240,0.92); border:1px solid ${this.COLORS.gold};
          border-radius:24px; padding:6px 16px; box-shadow:0 2px 12px rgba(44,24,16,0.12);
        }
        .map-v12-topbar input {
          background:transparent; border:none; outline:none; color:${this.COLORS.ink};
          font-size:14px; width:180px; font-family:inherit;
        }
        .map-v12-topbar input::placeholder { color:${this.COLORS.inkMuted}; }
        .map-v12-sidebar {
          position:absolute; top:70px; left:12px; width:140px; z-index:100;
          background:rgba(253,248,240,0.92); border:1px solid ${this.COLORS.gold};
          border-radius:12px; padding:10px; box-shadow:0 2px 12px rgba(44,24,16,0.12);
        }
        .map-v12-sidebar h4 { margin:0 0 8px 0; font-size:13px; color:${this.COLORS.inkLight}; }
        .map-v12-type-btn {
          display:flex; align-items:center; gap:6px; width:100%; padding:5px 8px;
          border:none; background:none; border-radius:6px; cursor:pointer;
          font-size:12px; color:${this.COLORS.inkLight}; transition:background 0.2s;
        }
        .map-v12-type-btn:hover { background:rgba(201,162,39,0.12); }
        .map-v12-type-btn.active { background:rgba(201,162,39,0.2); font-weight:bold; color:${this.COLORS.ink}; }
        .map-v12-type-dot { width:10px; height:10px; border-radius:50%; border:2px solid; }
        .map-v12-controls {
          position:absolute; bottom:20px; right:20px; z-index:100;
          display:flex; flex-direction:column; gap:6px;
        }
        .map-v12-control-btn {
          width:38px; height:38px; border-radius:50%; border:1px solid ${this.COLORS.gold};
          background:rgba(253,248,240,0.95); color:${this.COLORS.inkLight};
          font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center;
          box-shadow:0 2px 8px rgba(44,24,16,0.15); transition:all 0.2s;
        }
        .map-v12-control-btn:hover { background:${this.COLORS.gold}; color:#fff; }
        .map-v12-detail-panel {
          position:absolute; top:70px; right:12px; width:260px; max-height:calc(100vh - 100px);
          overflow-y:auto; z-index:100;
          background:rgba(253,248,240,0.96); border:1px solid ${this.COLORS.gold};
          border-radius:12px; padding:14px; box-shadow:0 2px 12px rgba(44,24,16,0.12);
          display:none;
        }
        .map-v12-detail-panel.visible { display:block; }
        .map-v12-detail-panel h3 { margin:0 0 10px 0; font-size:16px; color:${this.COLORS.ink}; border-bottom:1px solid ${this.COLORS.parchmentDark}; padding-bottom:6px; }
        .map-v12-field { margin-bottom:8px; }
        .map-v12-field label { display:block; font-size:11px; color:${this.COLORS.inkMuted}; margin-bottom:2px; }
        .map-v12-field input, .map-v12-field select, .map-v12-field textarea {
          width:100%; padding:5px 8px; border:1px solid ${this.COLORS.parchmentDark};
          border-radius:6px; background:#fff; color:${this.COLORS.ink}; font-size:13px; font-family:inherit;
          box-sizing:border-box;
        }
        .map-v12-field textarea { resize:vertical; min-height:50px; }
        .map-v12-field input[type="range"] { padding:0; }
        .map-v12-range-val { font-size:11px; color:${this.COLORS.gold}; margin-left:4px; }
        .map-v12-btn-row { display:flex; gap:6px; margin-top:10px; }
        .map-v12-btn {
          flex:1; padding:6px 10px; border-radius:6px; border:none; cursor:pointer;
          font-size:12px; font-family:inherit; transition:opacity 0.2s;
        }
        .map-v12-btn:hover { opacity:0.85; }
        .map-v12-btn-primary { background:${this.COLORS.gold}; color:#fff; }
        .map-v12-btn-secondary { background:${this.COLORS.parchmentDark}; color:${this.COLORS.ink}; }
        .map-v12-btn-danger { background:#C62828; color:#fff; }
        .map-v12-context-menu {
          position:absolute; z-index:200; background:rgba(253,248,240,0.98);
          border:1px solid ${this.COLORS.gold}; border-radius:8px;
          box-shadow:0 4px 16px rgba(44,24,16,0.2); padding:4px 0; min-width:140px;
          display:none;
        }
        .map-v12-context-item {
          padding:8px 14px; font-size:13px; color:${this.COLORS.inkLight}; cursor:pointer;
          transition:background 0.15s;
        }
        .map-v12-context-item:hover { background:rgba(201,162,39,0.15); color:${this.COLORS.ink}; }
        .map-v12-info-bar {
          position:absolute; bottom:20px; left:12px; z-index:100;
          background:rgba(253,248,240,0.9); border:1px solid ${this.COLORS.gold};
          border-radius:8px; padding:6px 12px; font-size:12px; color:${this.COLORS.inkMuted};
        }
        .map-v12-search-results {
          position:absolute; top:52px; left:50%; transform:translateX(-50%);
          background:rgba(253,248,240,0.98); border:1px solid ${this.COLORS.gold};
          border-radius:8px; box-shadow:0 4px 16px rgba(44,24,16,0.15);
          max-height:200px; overflow-y:auto; z-index:101; display:none; min-width:220px;
        }
        .map-v12-search-result-item {
          padding:8px 14px; font-size:13px; color:${this.COLORS.inkLight}; cursor:pointer;
          border-bottom:1px solid ${this.COLORS.parchmentDark};
        }
        .map-v12-search-result-item:hover { background:rgba(201,162,39,0.12); }
        .map-v12-search-result-item:last-child { border-bottom:none; }
        .map-v12-npc-avatar {
          width: 22px; height: 22px; border-radius: 50%; border: 2px solid ${this.COLORS.gold};
          background: ${this.COLORS.parchment}; cursor: pointer; object-fit: cover;
          box-shadow: 0 1px 4px rgba(44,24,16,0.2); transition: transform 0.2s;
        }
        .map-v12-npc-avatar:hover { transform: scale(1.2); }
        .map-v12-npc-badge {
          position: absolute; bottom: -4px; right: -4px;
          background: ${this.COLORS.gold}; color: #fff; font-size: 10px;
          width: 14px; height: 14px; border-radius: 50%; display: flex;
          align-items: center; justify-content: center; font-weight: bold;
        }
        .map-v12-npc-list { display: flex; flex-direction: column; gap: 6px; margin: 8px 0; }
        .map-v12-npc-item {
          display: flex; align-items: center; gap: 8px; padding: 6px;
          border-radius: 8px; cursor: pointer; transition: background 0.2s;
          border: 1px solid ${this.COLORS.parchmentDark};
        }
        .map-v12-npc-item:hover { background: rgba(201,162,39,0.1); }
        .map-v12-npc-status {
          font-size: 10px; padding: 1px 6px; border-radius: 8px;
          background: ${this.COLORS.parchmentDark}; color: ${this.COLORS.inkLight};
        }
        .map-v12-suggestion-item {
          padding: 8px; border-radius: 8px; border: 1px dashed ${this.COLORS.gold};
          margin-bottom: 8px; background: rgba(201,162,39,0.05);
        }
      </style>

      <div class="map-v12-container" id="mapV12Container">
        <!-- 顶部搜索栏 -->
        <div class="map-v12-topbar">
          <span style="font-size:16px;">🔍</span>
          <input type="text" id="mapSearchInput" placeholder="搜索地点..." oninput="MapSystem.handleSearch(this.value)">
          <div class="map-v12-search-results" id="mapSearchResults"></div>
        </div>

        <!-- 左侧类型筛选 -->
        <div class="map-v12-sidebar">
          <h4>类型筛选</h4>
          <div id="mapTypeFilters"></div>
        </div>

        <!-- Canvas 地图 -->
        <canvas class="map-v12-canvas" id="mapCanvas"></canvas>

        <!-- 详情面板 -->
        <div class="map-v12-detail-panel" id="mapDetailPanel">
          <h3 id="detailPanelTitle">地点详情</h3>
          <div id="detailPanelBody"></div>
        </div>

        <!-- 缩放控制 -->
        <div class="map-v12-controls">
          <button class="map-v12-control-btn" onclick="MapSystem.zoomIn()" title="放大">+</button>
          <button class="map-v12-control-btn" onclick="MapSystem.zoomOut()" title="缩小">−</button>
          <button class="map-v12-control-btn" onclick="MapSystem.resetView()" title="重置视图">⌂</button>
          <button class="map-v12-control-btn" onclick="MapSystem.locateCurrent()" title="定位当前">⚑</button>
        </div>

    <!-- 信息栏 -->
    <div class="map-v12-info-bar" id="mapInfoBar">
      滚轮缩放 · 拖拽平移 · 右键添加 · 双击地点进入场景 · 点击建路径
    </div>

        <!-- 右键菜单 -->
        <div class="map-v12-context-menu" id="mapContextMenu">
          <div class="map-v12-context-item" onclick="MapSystem.showAddLocationModal()">➕ 添加新地点</div>
          <div class="map-v12-context-item" onclick="MapSystem.setCurrentLocationHere()">⚑ 设为当前位置</div>
        </div>
      </div>
    `;

    this._initCanvas();
    this._renderTypeFilters();
    this._bindEvents();
    this._resizeCanvas();
    this._draw();
  },

  // ============ Canvas 初始化与绘制 ============

  /**
   * 初始化 Canvas 元素与 2D 上下文
   */
  _initCanvas() {
    this._canvas = document.getElementById('mapCanvas');
    if (!this._canvas) return;
    this._ctx = this._canvas.getContext('2d');
    this._resizeCanvas();
  },

  /**
   * 调整 Canvas 尺寸以匹配容器
   */
  _resizeCanvas() {
    if (!this._canvas) return;
    const container = this._canvas.parentElement;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this._canvas.width = rect.width * dpr;
    this._canvas.height = rect.height * dpr;
    this._canvas.style.width = rect.width + 'px';
    this._canvas.style.height = rect.height + 'px';
    this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._draw();
  },

  /**
   * 世界坐标 → 屏幕坐标
   */
  _worldToScreen(wx, wy) {
    if (!this._canvas) return { x: 0, y: 0 };
    const rect = this._canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    return {
      x: cx + (wx - this._camera.x) * this._camera.zoom,
      y: cy + (wy - this._camera.y) * this._camera.zoom
    };
  },

  /**
   * 屏幕坐标 → 世界坐标
   */
  _screenToWorld(sx, sy) {
    if (!this._canvas) return { x: 0, y: 0 };
    const rect = this._canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    return {
      x: this._camera.x + (sx - cx) / this._camera.zoom,
      y: this._camera.y + (sy - cy) / this._camera.zoom
    };
  },

  /**
   * 主绘制函数：背景网格 → 路径 → 地点节点 → 当前位置光环
   */
  _draw() {
    if (!this._ctx || !this._canvas) return;
    const ctx = this._ctx;
    const rect = this._canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;

    ctx.clearRect(0, 0, W, H);

    // 1. 绘制羊皮纸纹理背景
    ctx.fillStyle = this.COLORS.parchment;
    ctx.fillRect(0, 0, W, H);

    // 2. 绘制网格与坐标轴（无限延伸感）
    this._drawGrid(ctx, W, H);

    const data = this._getData();
    const locations = data.locations.filter(loc => this._filterTypes.has(loc.type));
    const locIdSet = new Set(locations.map(l => l.id));

    // 3. 绘制路径连线
    this._drawPaths(ctx, data.paths, locIdSet, locations);

    // 4. 绘制地点节点
    this._drawLocations(ctx, locations);

    // 5. 绘制当前位置脉冲光环
    if (this._currentLocationId) {
      const current = locations.find(l => l.id === this._currentLocationId);
      if (current) this._drawPulseRing(ctx, current);
    }

    // 6. 绘制地点上的NPC头像标记
    this._renderNPCMarkers(ctx, locations);

    // 7. 绘制NPC移动动画
    this._drawNPCMoves(ctx);
  },

  /**
   * 绘制背景网格线与坐标轴，营造无限大地图感
   */
  _drawGrid(ctx, W, H) {
    const zoom = this._camera.zoom;
    const spacing = 100 * zoom;
    if (spacing < 10) return; // 太密不绘制，避免性能问题

    const offsetX = (W / 2 - this._camera.x * zoom) % spacing;
    const offsetY = (H / 2 - this._camera.y * zoom) % spacing;

    ctx.lineWidth = 0.5;
    ctx.strokeStyle = this.COLORS.gridLine;

    // 竖线
    for (let x = offsetX; x < W; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    // 横线
    for (let y = offsetY; y < H; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // 坐标轴（世界原点）
    const origin = this._worldToScreen(0, 0);
    if (origin.x >= 0 && origin.x <= W) {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = this.COLORS.gridAxis;
      ctx.beginPath();
      ctx.moveTo(origin.x, 0);
      ctx.lineTo(origin.x, H);
      ctx.stroke();
    }
    if (origin.y >= 0 && origin.y <= H) {
      ctx.beginPath();
      ctx.moveTo(0, origin.y);
      ctx.lineTo(W, origin.y);
      ctx.stroke();
    }
  },

  /**
   * 绘制地点之间的路径连线
   */
  _drawPaths(ctx, paths, locIdSet, locations) {
    const locMap = new Map(locations.map(l => [l.id, l]));

    paths.forEach(path => {
      const fromLoc = locMap.get(path.from);
      const toLoc = locMap.get(path.to);
      if (!fromLoc || !toLoc) return;
      if (!locIdSet.has(path.from) || !locIdSet.has(path.to)) return;

      const p1 = this._worldToScreen(fromLoc.x, fromLoc.y);
      const p2 = this._worldToScreen(toLoc.x, toLoc.y);

      // 判断是否为高亮路径（Dijkstra结果）
      const isHighlighted = this._shortestPath &&
        this._shortestPath.includes(path.from) &&
        this._shortestPath.includes(path.to);

      // 判断鼠标是否悬停在此路径上
      const isHovered = this._hoveredPath &&
        this._hoveredPath.from === path.from &&
        this._hoveredPath.to === path.to;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);

      if (isHighlighted) {
        ctx.strokeStyle = this.COLORS.pathHighlight;
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
      } else if (isHovered) {
        ctx.strokeStyle = this.COLORS.gold;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
      } else {
        ctx.strokeStyle = this.COLORS.pathDefault;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
      }

      ctx.stroke();
      ctx.setLineDash([]);
    });
  },

  /**
   * 绘制地点节点（圆形+名称标签）
   */
  _drawLocations(ctx, locations) {
    locations.forEach(loc => {
      const pos = this._worldToScreen(loc.x, loc.y);
      const typeConfig = this.LOCATION_TYPES[loc.type] || this.LOCATION_TYPES.town;
      const isSelected = this._selectedLocationId === loc.id;
      const isHovered = this._hoveredLocationId === loc.id;
      const radius = isHovered ? this.NODE.radiusHover : this.NODE.radius;

      // 选中时绘制外圈
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius + 6, 0, Math.PI * 2);
        ctx.strokeStyle = this.COLORS.selection;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 节点圆形背景（羊皮纸色）
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = this.COLORS.parchment;
      ctx.fill();

      // 边框颜色按类型
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.strokeStyle = typeConfig.color;
      ctx.stroke();

      // 内部小圆点（同色填充）
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = typeConfig.color;
      ctx.globalAlpha = 0.3;
      ctx.fill();
      ctx.globalAlpha = 1;

      // 名称标签（墨色文字，竖排感通过横向排列实现古风）
      ctx.font = `${isHovered ? 'bold' : ''} ${this.NODE.fontSize}px serif`;
      ctx.fillStyle = this.COLORS.ink;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(loc.name, pos.x, pos.y + radius + 6);

      // 如果是隐藏类型且未探索，可画半透明遮罩（留作扩展）
      // NPC头像标记由 _renderNPCMarkers 统一绘制
    });
  },

  /**
   * 绘制当前位置的金色脉冲光环动画
   */
  _drawPulseRing(ctx, loc) {
    const pos = this._worldToScreen(loc.x, loc.y);
    const baseRadius = this.NODE.radius + 10;
    const pulse = Math.sin(this._pulseTime * 0.003) * 0.5 + 0.5; // 0~1
    const r = baseRadius + pulse * 15;

    // 外圈光环
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = this.COLORS.gold;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.4 * (1 - pulse);
    ctx.stroke();

    // 内圈光晕
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r - 5, 0, Math.PI * 2);
    ctx.fillStyle = this.COLORS.goldLight;
    ctx.globalAlpha = 0.15 * (1 - pulse);
    ctx.fill();

    ctx.globalAlpha = 1;
  },

  /**
   * 绘制地点节点旁的NPC小头像
   * 最多显示3个，超过显示"+N"数字徽章
   */
  _renderNPCMarkers(ctx, locations) {
    locations.forEach(loc => {
      const npcs = this._getNPCsAtLocation(loc.id);
      if (!npcs || npcs.length === 0) return;

      const pos = this._worldToScreen(loc.x, loc.y);
      const maxDisplay = 3;
      const displayNPCs = npcs.slice(0, maxDisplay);
      const overflow = npcs.length - maxDisplay;
      const avatarSize = 16;
      const gap = 4;
      const startX = pos.x - ((displayNPCs.length * avatarSize + (displayNPCs.length - 1) * gap) / 2);
      const startY = pos.y - this.NODE.radius - avatarSize - 8;

      displayNPCs.forEach((npc, idx) => {
        const ax = startX + idx * (avatarSize + gap);
        const ay = startY;

        // 绘制圆形头像背景
        ctx.beginPath();
        ctx.arc(ax + avatarSize / 2, ay + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = this.COLORS.parchment;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = this.COLORS.gold;
        ctx.stroke();

        // 绘制NPC名字首字（古风墨境配色）
        ctx.font = `bold 10px serif`;
        ctx.fillStyle = this.COLORS.ink;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((npc.name || '?').charAt(0), ax + avatarSize / 2, ay + avatarSize / 2);
      });

      // 超过3个显示"+N"徽章
      if (overflow > 0) {
        const bx = startX + maxDisplay * (avatarSize + gap) - gap / 2;
        const by = startY + avatarSize / 2;
        ctx.beginPath();
        ctx.arc(bx, by, 7, 0, Math.PI * 2);
        ctx.fillStyle = this.COLORS.gold;
        ctx.fill();
        ctx.font = `bold 9px sans-serif`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+' + overflow, bx, by);
      }
    });
  },

  /**
   * 绘制NPC在路径上的移动动画
   */
  _drawNPCMoves(ctx) {
    const now = Date.now();
    this._movingNPCs = this._movingNPCs.filter(m => {
      const elapsed = now - m.startTime;
      if (elapsed >= m.duration) return false; // 动画结束

      const data = this._getData();
      const fromLoc = data.locations.find(l => l.id === m.fromId);
      const toLoc = data.locations.find(l => l.id === m.toId);
      if (!fromLoc || !toLoc) return false;

      const p1 = this._worldToScreen(fromLoc.x, fromLoc.y);
      const p2 = this._worldToScreen(toLoc.x, toLoc.y);
      const progress = elapsed / m.duration;
      const cx = p1.x + (p2.x - p1.x) * progress;
      const cy = p1.y + (p2.y - p1.y) * progress;

      // 绘制移动中的小人图标
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fillStyle = this.COLORS.gold;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = this.COLORS.ink;
      ctx.stroke();

      // 绘制小人的身体
      ctx.beginPath();
      ctx.arc(cx, cy - 3, 3, 0, Math.PI * 2);
      ctx.fillStyle = this.COLORS.ink;
      ctx.fill();

      return true;
    });
  },

  /**
   * 启动动画循环（脉冲效果）
   */
  _startAnimation() {
    if (this._animFrame) cancelAnimationFrame(this._animFrame);
    const loop = (timestamp) => {
      this._pulseTime = timestamp;
      this._draw();
      this._animFrame = requestAnimationFrame(loop);
    };
    this._animFrame = requestAnimationFrame(loop);
  },

  /**
   * 停止动画循环
   */
  _stopAnimation() {
    if (this._animFrame) {
      cancelAnimationFrame(this._animFrame);
      this._animFrame = null;
    }
  },

  // ============ 事件绑定 ============

  /**
   * 绑定 Canvas 与页面各类交互事件
   */
  _bindEvents() {
    if (!this._canvas) return;

    // 鼠标滚轮缩放
    this._canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = this._canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const worldBefore = this._screenToWorld(mouseX, mouseY);

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this._camera.zoom = Math.max(0.2, Math.min(5.0, this._camera.zoom * delta));

      const worldAfter = this._screenToWorld(mouseX, mouseY);
      this._camera.x += worldBefore.x - worldAfter.x;
      this._camera.y += worldBefore.y - worldAfter.y;

      this._draw();
    }, { passive: false });

    // 鼠标按下（开始拖拽或选点）
    this._canvas.addEventListener('mousedown', (e) => {
      if (e.button === 2) return; // 右键由 contextmenu 处理
      const rect = this._canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const worldPos = this._screenToWorld(x, y);

      // 检查是否点击到地点节点
      const data = this._getData();
      const locations = data.locations.filter(loc => this._filterTypes.has(loc.type));
      const clickedLoc = this._findLocationAt(worldPos.x, worldPos.y, locations);

      if (clickedLoc) {
        // 双击检测：短时间内再次点击同一地点 → 进入场景
        const now = Date.now();
        if (this._lastClickInfo.locationId === clickedLoc.id && now - this._lastClickInfo.time < 400) {
          // 双击触发：进入场景
          if (window.SceneSystem && typeof SceneSystem.enterScene === 'function') {
            SceneSystem.enterScene(clickedLoc.id);
            this._lastClickInfo = { locationId: null, time: 0 };
            return;
          }
        }
        this._lastClickInfo = { locationId: clickedLoc.id, time: now };

        // 点击地点：可能是建路径，也可能是拖拽
        if (this._selectedLocationId && this._selectedLocationId !== clickedLoc.id) {
          // 已选中一个地点，再点另一个 → 建立路径
          this._createPath(this._selectedLocationId, clickedLoc.id);
          this._selectedLocationId = null;
          this._draw();
          this._updateInfoBar('路径已建立');
        } else {
          // 开始拖拽地点
          this._isDragging = true;
          this._draggedNode = clickedLoc;
          this._dragNodeOffset = { x: worldPos.x - clickedLoc.x, y: worldPos.y - clickedLoc.y };
          this._selectedLocationId = clickedLoc.id;
          this._showDetailPanel(clickedLoc);
          this._canvas.classList.add('dragging-node');
        }
      } else {
        // 点击空白处：平移地图
        this._isDragging = true;
        this._dragStart = { x: e.clientX, y: e.clientY };
        this._cameraStart = { x: this._camera.x, y: this._camera.y };
        this._selectedLocationId = null;
        this._hideDetailPanel();
        this._shortestPath = null;
      }
    });

    // 鼠标移动（拖拽中或悬停检测）
    this._canvas.addEventListener('mousemove', (e) => {
      const rect = this._canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const worldPos = this._screenToWorld(x, y);

      if (this._isDragging) {
        if (this._draggedNode) {
          // 拖拽地点（实时更新坐标，鼠标松开时统一保存）
          this._draggedNode.x = worldPos.x - this._dragNodeOffset.x;
          this._draggedNode.y = worldPos.y - this._dragNodeOffset.y;
        } else {
          // 平移地图
          const dx = (e.clientX - this._dragStart.x) / this._camera.zoom;
          const dy = (e.clientY - this._dragStart.y) / this._camera.zoom;
          this._camera.x = this._cameraStart.x - dx;
          this._camera.y = this._cameraStart.y - dy;
        }
        this._draw();
        return;
      }

      // 悬停检测：地点
      const data = this._getData();
      const locations = data.locations.filter(loc => this._filterTypes.has(loc.type));
      const hoveredLoc = this._findLocationAt(worldPos.x, worldPos.y, locations);
      const prevHover = this._hoveredLocationId;
      this._hoveredLocationId = hoveredLoc ? hoveredLoc.id : null;

      // 悬停检测：路径
      const hoveredPath = hoveredLoc ? null : this._findPathAt(worldPos.x, worldPos.y, data.paths, locations);
      this._hoveredPath = hoveredPath;

      this._canvas.style.cursor = hoveredLoc ? 'move' : (hoveredPath ? 'pointer' : 'grab');

      if (prevHover !== this._hoveredLocationId || hoveredPath !== this._hoveredPath) {
        this._draw();
      }
    });

    // 鼠标松开（结束拖拽）
    this._canvas.addEventListener('mouseup', (e) => {
      if (this._draggedNode) {
        // 保存拖拽后的位置
        const data = this._getData();
        const loc = data.locations.find(l => l.id === this._draggedNode.id);
        if (loc) {
          loc.x = this._draggedNode.x;
          loc.y = this._draggedNode.y;
          this._saveData(data);
        }
      }
      this._isDragging = false;
      this._draggedNode = null;
      this._canvas.classList.remove('dragging-node');
    });

    // 鼠标离开 Canvas
    this._canvas.addEventListener('mouseleave', () => {
      this._isDragging = false;
      this._draggedNode = null;
      this._hoveredLocationId = null;
      this._hoveredPath = null;
      this._canvas.classList.remove('dragging-node');
      this._draw();
    });

    // 双击地点进入场景
    this._canvas.addEventListener('dblclick', (e) => {
      const rect = this._canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const worldPos = this._screenToWorld(x, y);
      const data = this._getData();
      const locations = data.locations.filter(loc => this._filterTypes.has(loc.type));
      const clickedLoc = this._findLocationAt(worldPos.x, worldPos.y, locations);
      if (clickedLoc) {
        this.enterScene(clickedLoc.id);
      }
    });

    // 右键菜单（空白处弹出添加地点菜单）
    this._canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const rect = this._canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const worldPos = this._screenToWorld(x, y);
      this._contextMenuWorldPos = worldPos;

      // 检查是否右键在路径上
      const data = this._getData();
      const locations = data.locations.filter(loc => this._filterTypes.has(loc.type));
      const path = this._findPathAt(worldPos.x, worldPos.y, data.paths, locations);

      if (path) {
        // 右键路径：确认删除
        if (confirm('删除此路径连线？')) {
          this._deletePath(path.from, path.to);
        }
      } else {
        // 右键空白处：显示菜单
        this._showContextMenu(e.clientX, e.clientY);
      }
    });

    // 点击其他地方关闭右键菜单
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#mapContextMenu')) {
        this._hideContextMenu();
      }
    });

    // 窗口大小变化时重绘
    window.addEventListener('resize', () => {
      this._resizeCanvas();
    });
  },

  /**
   * 显示右键菜单
   */
  _showContextMenu(screenX, screenY) {
    const menu = document.getElementById('mapContextMenu');
    if (!menu) return;
    menu.style.left = screenX + 'px';
    menu.style.top = screenY + 'px';
    menu.style.display = 'block';
  },

  /**
   * 隐藏右键菜单
   */
  _hideContextMenu() {
    const menu = document.getElementById('mapContextMenu');
    if (menu) menu.style.display = 'none';
  },

  // ============ 碰撞检测 ============

  /**
   * 检测世界坐标是否在某地点节点内
   */
  _findLocationAt(wx, wy, locations) {
    const threshold = this.NODE.radius / this._camera.zoom + 4;
    for (const loc of locations) {
      const dx = loc.x - wx;
      const dy = loc.y - wy;
      if (dx * dx + dy * dy <= threshold * threshold) {
        return loc;
      }
    }
    return null;
  },

  /**
   * 检测世界坐标是否在某路径线段附近
   */
  _findPathAt(wx, wy, paths, locations) {
    const locMap = new Map(locations.map(l => [l.id, l]));
    const threshold = 8 / this._camera.zoom;

    for (const path of paths) {
      const from = locMap.get(path.from);
      const to = locMap.get(path.to);
      if (!from || !to) continue;

      const dist = this._pointToSegmentDistance(wx, wy, from.x, from.y, to.x, to.y);
      if (dist <= threshold) {
        return path;
      }
    }
    return null;
  },

  /**
   * 点到线段的最短距离
   */
  _pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
  },

  // ============ 地点 CRUD ============

  /**
   * 显示添加地点的模态框（右键菜单触发）
   */
  showAddLocationModal() {
    this._hideContextMenu();
    const pos = this._contextMenuWorldPos || { x: 0, y: 0 };
    this._showLocationForm(null, pos);
  },

  /**
   * 在右键位置设为当前位置
   */
  setCurrentLocationHere() {
    this._hideContextMenu();
    const pos = this._contextMenuWorldPos;
    if (!pos) return;
    // 查找最近的地点设为当前位置
    const data = this._getData();
    let nearest = null;
    let minDist = Infinity;
    data.locations.forEach(loc => {
      const d = Math.sqrt((loc.x - pos.x) ** 2 + (loc.y - pos.y) ** 2);
      if (d < minDist) { minDist = d; nearest = loc; }
    });
    if (nearest && minDist < 100) {
      this._currentLocationId = nearest.id;
      data.currentLocationId = nearest.id;
      this._saveData(data);
      this._updateInfoBar(`当前位置：${nearest.name}`);
      this._draw();
    } else {
      alert('附近没有地点，请先添加地点');
    }
  },

  /**
   * 显示地点表单（添加或编辑）
   */
  _showLocationForm(loc, worldPos) {
    const isEdit = !!loc;
    const panel = document.getElementById('mapDetailPanel');
    const title = document.getElementById('detailPanelTitle');
    const body = document.getElementById('detailPanelBody');

    this._editingLocation = loc;

    title.textContent = isEdit ? `编辑：${loc.name}` : '添加新地点';

    const typeOptions = Object.entries(this.LOCATION_TYPES).map(([key, cfg]) =>
      `<option value="${key}" ${isEdit && loc.type === key ? 'selected' : ''}>${cfg.name}</option>`
    ).join('');

    body.innerHTML = `
      <div class="map-v12-field">
        <label>地点名称</label>
        <input type="text" id="locName" value="${isEdit ? loc.name : ''}" placeholder="如：长安城">
      </div>
      <div class="map-v12-field">
        <label>类型</label>
        <select id="locType">${typeOptions}</select>
      </div>
      <div class="map-v12-field">
        <label>描述</label>
        <textarea id="locDesc" rows="3" placeholder="地点描述...">${isEdit ? loc.description || '' : ''}</textarea>
      </div>
      <div class="map-v12-field">
        <label>人口</label>
        <input type="text" id="locPop" value="${isEdit ? loc.population || '' : ''}" placeholder="如：十万户">
      </div>
      <div class="map-v12-field">
        <label>特产</label>
        <input type="text" id="locSpec" value="${isEdit ? loc.specialty || '' : ''}" placeholder="如：丝绸、茶叶">
      </div>
      <div class="map-v12-field">
        <label>危险度 <span class="map-v12-range-val" id="dangerVal">${isEdit ? loc.danger || 5 : 5}</span>/10</label>
        <input type="range" id="locDanger" min="1" max="10" value="${isEdit ? loc.danger || 5 : 5}"
          oninput="document.getElementById('dangerVal').textContent=this.value">
      </div>
      <div class="map-v12-field">
        <label>气候</label>
        <input type="text" id="locClimate" value="${isEdit ? loc.climate || '' : ''}" placeholder="如：温带季风">
      </div>
      <div class="map-v12-field">
        <label>关联NPC</label>
        <input type="text" id="locNPCs" value="${isEdit ? loc.relatedNPCs || '' : ''}" placeholder="多个用逗号分隔">
      </div>
      <div class="map-v12-field">
        <label>场景背景ID</label>
        <input type="text" id="locSceneBg" value="${isEdit ? loc.sceneBackgroundId || '' : ''}" placeholder="如：scene_tavern">
      </div>
      <div class="map-v12-field">
        <label>常驻NPC IDs</label>
        <input type="text" id="locNpcIds" value="${isEdit ? (loc.npcIds || []).join(', ') : ''}" placeholder="多个用逗号分隔">
      </div>
      ${!isEdit ? `
      <div class="map-v12-field">
        <label>坐标 X</label>
        <input type="number" id="locX" value="${Math.round(worldPos.x)}" step="1">
      </div>
      <div class="map-v12-field">
        <label>坐标 Y</label>
        <input type="number" id="locY" value="${Math.round(worldPos.y)}" step="1">
      </div>
      ` : ''}
      <div class="map-v12-btn-row">
        <button class="map-v12-btn map-v12-btn-primary" onclick="MapSystem.saveLocation()">保存</button>
        ${isEdit ? `<button class="map-v12-btn map-v12-btn-danger" onclick="MapSystem.deleteLocation()">删除</button>` : ''}
        <button class="map-v12-btn map-v12-btn-secondary" onclick="MapSystem.closeDetailPanel()">取消</button>
      </div>
    `;

    panel.classList.add('visible');
  },

  /**
   * 保存地点（新建或更新）
   */
  saveLocation() {
    const name = document.getElementById('locName')?.value.trim();
    if (!name) { alert('请输入地点名称'); return; }

    const data = this._getData();
    const locData = {
      name,
      type: document.getElementById('locType')?.value || 'town',
      description: document.getElementById('locDesc')?.value || '',
      population: document.getElementById('locPop')?.value || '',
      specialty: document.getElementById('locSpec')?.value || '',
      danger: parseInt(document.getElementById('locDanger')?.value || '5'),
      climate: document.getElementById('locClimate')?.value || '',
      relatedNPCs: document.getElementById('locNPCs')?.value || '',
      sceneBackgroundId: document.getElementById('locSceneBg')?.value || '',
      npcIds: document.getElementById('locNpcIds')?.value ? document.getElementById('locNpcIds').value.split(',').map(s => s.trim()).filter(Boolean) : []
    };

    if (this._editingLocation) {
      // 更新
      const loc = data.locations.find(l => l.id === this._editingLocation.id);
      if (loc) {
        Object.assign(loc, locData);
        this._saveData(data);
        this._updateInfoBar(`地点「${name}」已更新`);
      }
    } else {
      // 新建
      const x = parseFloat(document.getElementById('locX')?.value || '0');
      const y = parseFloat(document.getElementById('locY')?.value || '0');
      const newLoc = {
        id: 'loc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        x, y,
        ...locData
      };
      data.locations.push(newLoc);
      this._saveData(data);
      this._updateInfoBar(`地点「${name}」已添加`);
    }

    this.closeDetailPanel();
    this._draw();
  },

  /**
   * 删除当前编辑的地点
   */
  deleteLocation() {
    if (!this._editingLocation) return;
    if (!confirm(`确定删除地点「${this._editingLocation.name}」？`)) return;

    const data = this._getData();
    data.locations = data.locations.filter(l => l.id !== this._editingLocation.id);
    // 同时删除关联的路径
    data.paths = data.paths.filter(p => p.from !== this._editingLocation.id && p.to !== this._editingLocation.id);
    // 清除当前位置
    if (data.currentLocationId === this._editingLocation.id) {
      data.currentLocationId = null;
      this._currentLocationId = null;
    }
    this._saveData(data);
    this.closeDetailPanel();
    this._updateInfoBar('地点已删除');
    this._draw();
  },

  /**
   * 显示地点详情面板（点击地点时）
   */
  _showDetailPanel(loc) {
    this._editingLocation = loc;
    const panel = document.getElementById('mapDetailPanel');
    const title = document.getElementById('detailPanelTitle');
    const body = document.getElementById('detailPanelBody');

    title.textContent = loc.name;
    const typeCfg = this.LOCATION_TYPES[loc.type] || this.LOCATION_TYPES.town;

    body.innerHTML = `
      <div style="margin-bottom:10px;">
        <span style="display:inline-block;padding:2px 10px;border-radius:10px;border:1px solid ${typeCfg.color};color:${typeCfg.color};font-size:12px;">${typeCfg.name}</span>
        ${loc.danger ? `<span style="margin-left:6px;font-size:12px;color:#C62828;">危险度 ${loc.danger}/10</span>` : ''}
      </div>
      ${loc.description ? `<p style="font-size:13px;color:${this.COLORS.inkLight};line-height:1.5;margin-bottom:8px;">${loc.description}</p>` : ''}
      ${loc.population ? `<div class="map-v12-field"><label>人口</label><div style="font-size:13px;color:${this.COLORS.ink};">${loc.population}</div></div>` : ''}
      ${loc.specialty ? `<div class="map-v12-field"><label>特产</label><div style="font-size:13px;color:${this.COLORS.ink};">${loc.specialty}</div></div>` : ''}
      ${loc.climate ? `<div class="map-v12-field"><label>气候</label><div style="font-size:13px;color:${this.COLORS.ink};">${loc.climate}</div></div>` : ''}
      ${loc.relatedNPCs ? `<div class="map-v12-field"><label>关联NPC</label><div style="font-size:13px;color:${this.COLORS.ink};">${loc.relatedNPCs}</div></div>` : ''}
      <div id="npcListContainer"></div>
      <div class="map-v12-btn-row">
        <button class="map-v12-btn map-v12-btn-primary" onclick="MapSystem.editCurrentLocation()">编辑</button>
        <button class="map-v12-btn map-v12-btn-primary" style="background:${this.COLORS.inkLight};" onclick="MapSystem.enterSceneFromMap()">进入场景</button>
        <button class="map-v12-btn map-v12-btn-secondary" onclick="MapSystem.setAsCurrent('${loc.id}')">设为当前</button>
        <button class="map-v12-btn map-v12-btn-secondary" onclick="MapSystem.findPathTo('${loc.id}')">寻路至此</button>
      </div>
    `;

    panel.classList.add('visible');

    // 渲染当前在场NPC列表
    this._renderNPCListInPanel(loc);
  },

  /**
   * 从地图详情面板进入场景（联动SceneSystem）
   */
  enterSceneFromMap() {
    if (!this._editingLocation) return;
    if (window.SceneSystem && typeof SceneSystem.enterScene === 'function') {
      SceneSystem.enterScene(this._editingLocation.id);
    } else {
      alert('场景系统尚未加载，请刷新页面后再试');
    }
  },

  /**
   * 编辑当前详情面板中的地点
   */
  editCurrentLocation() {
    if (!this._editingLocation) return;
    const data = this._getData();
    const loc = data.locations.find(l => l.id === this._editingLocation.id);
    if (loc) this._showLocationForm(loc, { x: loc.x, y: loc.y });
  },

  /**
   * 将指定地点设为当前位置
   */
  setAsCurrent(locId) {
    const data = this._getData();
    const loc = data.locations.find(l => l.id === locId);
    if (!loc) return;
    this._currentLocationId = locId;
    data.currentLocationId = locId;
    this._saveData(data);
    this._updateInfoBar(`当前位置：${loc.name}`);
    this._draw();
  },

  /**
   * 关闭详情面板
   */
  closeDetailPanel() {
    const panel = document.getElementById('mapDetailPanel');
    if (panel) panel.classList.remove('visible');
    this._editingLocation = null;
    this._selectedLocationId = null;
  },

  /**
   * 隐藏详情面板
   */
  _hideDetailPanel() {
    this.closeDetailPanel();
  },

  // ============ 路径 CRUD ============

  /**
   * 在两点之间建立路径（单向，重复则忽略）
   */
  _createPath(fromId, toId) {
    if (fromId === toId) return;
    const data = this._getData();
    const exists = data.paths.some(p =>
      (p.from === fromId && p.to === toId) || (p.from === toId && p.to === fromId)
    );
    if (exists) {
      this._updateInfoBar('两点之间已有路径');
      return;
    }
    data.paths.push({ from: fromId, to: toId });
    this._saveData(data);
  },

  /**
   * 删除路径
   */
  _deletePath(fromId, toId) {
    const data = this._getData();
    data.paths = data.paths.filter(p =>
      !((p.from === fromId && p.to === toId) || (p.from === toId && p.to === fromId))
    );
    this._saveData(data);
    this._shortestPath = null;
    this._updateInfoBar('路径已删除');
    this._draw();
  },

  // ============ Dijkstra 寻路 ============

  /**
   * 从当前位置寻路到目标地点，高亮最短路径
   */
  findPathTo(targetId) {
    if (!this._currentLocationId) {
      alert('请先设置当前位置');
      return;
    }
    if (this._currentLocationId === targetId) {
      alert('已在该地点');
      return;
    }

    const data = this._getData();
    const path = this._dijkstra(data.locations, data.paths, this._currentLocationId, targetId);

    if (path) {
      this._shortestPath = path;
      this._updateInfoBar(`最短路径：${path.length - 1} 段`);
      // 自动将相机移动到路径中间
      this._focusOnPath(path, data.locations);
    } else {
      this._shortestPath = null;
      alert('无法到达：两点之间没有连通的路径');
    }
    this._draw();
  },

  /**
   * Dijkstra 最短路径算法
   * @returns {string[]|null} 地点 ID 数组，或 null 表示不可达
   */
  _dijkstra(locations, paths, startId, endId) {
    const locIds = new Set(locations.map(l => l.id));
    if (!locIds.has(startId) || !locIds.has(endId)) return null;

    // 构建邻接表（无向图）
    const graph = new Map();
    locations.forEach(l => graph.set(l.id, []));
    paths.forEach(p => {
      if (graph.has(p.from) && graph.has(p.to)) {
        graph.get(p.from).push(p.to);
        graph.get(p.to).push(p.from);
      }
    });

    // Dijkstra
    const dist = new Map();
    const prev = new Map();
    const visited = new Set();
    const pq = [{ id: startId, dist: 0 }];

    locations.forEach(l => dist.set(l.id, Infinity));
    dist.set(startId, 0);

    while (pq.length > 0) {
      pq.sort((a, b) => a.dist - b.dist);
      const { id: u } = pq.shift();
      if (visited.has(u)) continue;
      visited.add(u);
      if (u === endId) break;

      const locU = locations.find(l => l.id === u);
      if (!locU) continue;

      for (const v of graph.get(u) || []) {
        if (visited.has(v)) continue;
        const locV = locations.find(l => l.id === v);
        if (!locV) continue;
        const edgeDist = Math.sqrt((locU.x - locV.x) ** 2 + (locU.y - locV.y) ** 2);
        const alt = dist.get(u) + edgeDist;
        if (alt < dist.get(v)) {
          dist.set(v, alt);
          prev.set(v, u);
          pq.push({ id: v, dist: alt });
        }
      }
    }

    if (dist.get(endId) === Infinity) return null;

    // 回溯路径
    const path = [];
    let curr = endId;
    while (curr) {
      path.unshift(curr);
      curr = prev.get(curr);
    }
    return path;
  },

  /**
   * 将相机聚焦于路径中心
   */
  _focusOnPath(pathIds, locations) {
    const pathLocs = pathIds.map(id => locations.find(l => l.id === id)).filter(Boolean);
    if (pathLocs.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    pathLocs.forEach(l => {
      minX = Math.min(minX, l.x);
      maxX = Math.max(maxX, l.x);
      minY = Math.min(minY, l.y);
      maxY = Math.max(maxY, l.y);
    });

    this._camera.x = (minX + maxX) / 2;
    this._camera.y = (minY + maxY) / 2;

    // 调整缩放以适应路径
    if (this._canvas) {
      const rect = this._canvas.getBoundingClientRect();
      const padding = 100;
      const scaleX = rect.width / (maxX - minX + padding * 2);
      const scaleY = rect.height / (maxY - minY + padding * 2);
      this._camera.zoom = Math.max(0.3, Math.min(2.0, Math.min(scaleX, scaleY)));
    }
  },

  // ============ 搜索与筛选 ============

  /**
   * 处理顶部搜索框输入
   */
  handleSearch(query) {
    this._searchQuery = query.trim().toLowerCase();
    const resultsBox = document.getElementById('mapSearchResults');

    if (!this._searchQuery) {
      resultsBox.style.display = 'none';
      return;
    }

    const data = this._getData();
    const matches = data.locations.filter(loc =>
      loc.name.toLowerCase().includes(this._searchQuery) ||
      (loc.description && loc.description.toLowerCase().includes(this._searchQuery))
    );

    if (matches.length === 0) {
      resultsBox.innerHTML = '<div class="map-v12-search-result-item" style="color:#999;">无匹配结果</div>';
    } else {
      resultsBox.innerHTML = matches.map(loc => {
        const typeCfg = this.LOCATION_TYPES[loc.type] || this.LOCATION_TYPES.town;
        return `<div class="map-v12-search-result-item" onclick="MapSystem.focusLocation('${loc.id}')">
          <span style="color:${typeCfg.color};font-weight:bold;">●</span> ${loc.name}
        </div>`;
      }).join('');
    }
    resultsBox.style.display = 'block';
  },

  /**
   * 聚焦到指定地点（移动相机并选中）
   */
  focusLocation(locId) {
    const data = this._getData();
    const loc = data.locations.find(l => l.id === locId);
    if (!loc) return;

    this._camera.x = loc.x;
    this._camera.y = loc.y;
    this._camera.zoom = 1.5;
    this._selectedLocationId = locId;
    this._showDetailPanel(loc);

    document.getElementById('mapSearchResults').style.display = 'none';
    document.getElementById('mapSearchInput').value = '';
    this._draw();
  },

  /**
   * 渲染左侧类型筛选按钮
   */
  _renderTypeFilters() {
    const container = document.getElementById('mapTypeFilters');
    if (!container) return;

    container.innerHTML = Object.entries(this.LOCATION_TYPES).map(([key, cfg]) => {
      const active = this._filterTypes.has(key);
      return `<button class="map-v12-type-btn ${active ? 'active' : ''}" onclick="MapSystem.toggleTypeFilter('${key}')">
        <span class="map-v12-type-dot" style="border-color:${cfg.color};background:${active ? cfg.color : 'transparent'};"></span>
        ${cfg.name}
      </button>`;
    }).join('');
  },

  /**
   * 切换类型筛选
   */
  toggleTypeFilter(typeKey) {
    if (this._filterTypes.has(typeKey)) {
      this._filterTypes.delete(typeKey);
    } else {
      this._filterTypes.add(typeKey);
    }
    this._renderTypeFilters();
    this._draw();
  },

  // ============ 视图控制 ============

  /**
   * 放大地图
   */
  zoomIn() {
    this._camera.zoom = Math.min(5.0, this._camera.zoom * 1.25);
    this._draw();
  },

  /**
   * 缩小地图
   */
  zoomOut() {
    this._camera.zoom = Math.max(0.2, this._camera.zoom * 0.8);
    this._draw();
  },

  /**
   * 重置视图到原点
   */
  resetView() {
    this._camera.x = 0;
    this._camera.y = 0;
    this._camera.zoom = 1.0;
    this._draw();
  },

  /**
   * 定位到当前位置
   */
  locateCurrent() {
    if (!this._currentLocationId) {
      alert('尚未设置当前位置');
      return;
    }
    const data = this._getData();
    const loc = data.locations.find(l => l.id === this._currentLocationId);
    if (loc) {
      this._camera.x = loc.x;
      this._camera.y = loc.y;
      this._camera.zoom = 1.5;
      this._draw();
    }
  },

  // ============ 工具方法 ============

  /**
   * 更新底部信息栏文字
   */
  _updateInfoBar(text) {
    const bar = document.getElementById('mapInfoBar');
    if (bar) bar.textContent = text;
  },

  /**
   * 导出地图数据为 JSON 字符串
   */
  exportData() {
    const data = this._getData();
    return JSON.stringify(data, null, 2);
  },

  /**
   * 导入地图数据
   */
  importData(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (data.locations && data.paths) {
        this._saveData(data);
        this._currentLocationId = data.currentLocationId || null;
        this._draw();
        return true;
      }
    } catch (e) { console.warn('导入失败', e); }
    return false;
  },

  // ============ NPC与场景交互 ============

  /**
   * 获取指定地点上的NPC列表
   * 优先从 NPCManager 获取，否则从地点数据中的 npcIds 解析
   */
  _getNPCsAtLocation(locId) {
    const data = this._getData();
    const loc = data.locations.find(l => l.id === locId);
    if (!loc) return [];

    // 如果存在全局 NPCManager，优先使用
    if (typeof NPCManager !== 'undefined' && NPCManager.getNPCsAtLocation) {
      return NPCManager.getNPCsAtLocation(locId) || [];
    }

    // 回退：从地点数据中的 npcIds 构建简单NPC对象
    if (loc.npcIds && loc.npcIds.length > 0) {
      return loc.npcIds.map(id => ({
        id,
        name: id,
        avatarId: null,
        status: '在场'
      }));
    }
    return [];
  },

  /**
   * 在地点详情面板中渲染当前在场NPC列表
   */
  _renderNPCListInPanel(loc) {
    const container = document.getElementById('npcListContainer');
    if (!container) return;
    const npcs = this._getNPCsAtLocation(loc.id);
    if (npcs.length === 0) {
      container.innerHTML = '';
      return;
    }

    const html = npcs.map(npc => {
      const avatarChar = (npc.name || npc.id || '?').charAt(0);
      return `
        <div class="map-v12-npc-item" onclick="MapSystem.startNPCDialog('${npc.id}')" title="点击与 ${npc.name || npc.id} 对话">
          <div style="width:28px;height:28px;border-radius:50%;background:${this.COLORS.parchment};border:2px solid ${this.COLORS.gold};display:flex;align-items:center;justify-content:center;font-weight:bold;color:${this.COLORS.ink};font-size:12px;">
            ${avatarChar}
          </div>
          <div style="flex:1;">
            <div style="font-size:13px;color:${this.COLORS.ink};font-weight:bold;">${npc.name || npc.id}</div>
            <span class="map-v12-npc-status">${npc.status || '在场'}</span>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="map-v12-field">
        <label style="margin-bottom:6px;display:block;">当前在场NPC (${npcs.length})</label>
        <div class="map-v12-npc-list">${html}</div>
      </div>
    `;
  },

  /**
   * 双击地点进入该地点的场景页面
   * 调用 SceneSystem.enterScene 并传递 locationId
   */
  enterScene(locId) {
    const data = this._getData();
    const loc = data.locations.find(l => l.id === locId);
    if (!loc) return;

    if (typeof SceneSystem !== 'undefined' && SceneSystem.enterScene) {
      SceneSystem.enterScene(locId, loc.sceneBackgroundId);
      this._updateInfoBar(`进入场景：${loc.name}`);
    } else {
      console.warn('[MapSystem] SceneSystem 未定义，无法进入场景');
      alert(`即将进入 ${loc.name} 的场景（SceneSystem 未加载）`);
    }
  },

  /**
   * 点击NPC头像后与该NPC对话
   * 跳转runtime页面并设置npcId
   */
  startNPCDialog(npcId) {
    if (typeof RuntimeEngine !== 'undefined' && RuntimeEngine.setNPC) {
      RuntimeEngine.setNPC(npcId);
      this._updateInfoBar(`开始与NPC对话`);
    } else {
      console.warn('[MapSystem] RuntimeEngine 未定义，无法启动对话');
      alert(`与NPC ${npcId} 对话（RuntimeEngine 未加载）`);
    }
  },

  /**
   * 显示NPC在地点间的移动动画
   * @param {string} npcId - NPC ID
   * @param {string} fromLocId - 起始地点ID
   * @param {string} toLocId - 目标地点ID
   * @param {number} duration - 动画持续时间（毫秒，默认2000）
   */
  showMoveAnimation(npcId, fromLocId, toLocId, duration = 2000) {
    this._movingNPCs.push({
      npcId,
      fromId: fromLocId,
      toId: toLocId,
      startTime: Date.now(),
      duration
    });
    this._updateInfoBar(`NPC 正在移动...`);
  },

  /**
   * 根据已有世界观（WorldBook）和已有NPC设定，AI建议新地点
   * 建议格式：地点名、类型、理由、关联NPC
   */
  generateLocationSuggestion() {
    // 尝试从 WorldBook 获取世界观设定
    let worldInfo = '';
    if (typeof WorldBook !== 'undefined' && WorldBook.getSummary) {
      worldInfo = WorldBook.getSummary() || '';
    }

    // 获取现有NPC信息
    let npcInfo = '';
    if (typeof NPCManager !== 'undefined' && NPCManager.getAllNPCs) {
      const npcs = NPCManager.getAllNPCs();
      npcInfo = npcs.map(n => `- ${n.name || n.id}：${n.role || '未知身份'}`).join('\n');
    }

    // 获取现有地点（避免重复）
    const data = this._getData();
    const existingNames = data.locations.map(l => l.name);

    // 本地启发式建议作为fallback（当AI接口不可用时）
    const templates = [
      { name: '断魂崖', type: 'wild', reason: '险峻山峰，常有江湖人士决斗', related: '独行侠客' },
      { name: '醉仙楼', type: 'shop', reason: '城中最好的酒馆，消息灵通', related: '酒保、说书人' },
      { name: '藏经阁', type: 'temple', reason: '藏有绝世武功秘籍', related: '扫地僧' },
      { name: '黑市', type: 'hidden', reason: '地下交易场所，可买到罕见物品', related: '神秘商人' },
      { name: '药王谷', type: 'wild', reason: '盛产奇花异草，是炼丹圣地', related: '药王' },
      { name: '铁匠铺', type: 'shop', reason: '打造神兵利器的去处', related: '老铁匠' }
    ];

    // 过滤掉已存在的
    const available = templates.filter(t => !existingNames.includes(t.name));
    const suggestions = available.slice(0, 3).map(t => ({
      name: t.name,
      type: t.type,
      reason: t.reason,
      relatedNPCs: t.related
    }));

    return { worldInfo, npcInfo, existingNames, suggestions };
  },

  /**
   * 渲染地点建议到指定容器
   */
  renderLocationSuggestions(containerId, suggestions) {
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container) return;
    if (!suggestions || suggestions.length === 0) {
      container.innerHTML = '<div style="color:#999;font-size:12px;">暂无建议</div>';
      return;
    }

    container.innerHTML = suggestions.map((s) => {
      const typeCfg = this.LOCATION_TYPES[s.type] || this.LOCATION_TYPES.town;
      return `
        <div class="map-v12-suggestion-item">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <span style="font-weight:bold;color:${this.COLORS.ink};">${s.name}</span>
            <span style="font-size:11px;padding:2px 8px;border-radius:10px;border:1px solid ${typeCfg.color};color:${typeCfg.color};">${typeCfg.name}</span>
          </div>
          <div style="font-size:12px;color:${this.COLORS.inkLight};margin-bottom:4px;">${s.reason}</div>
          <div style="font-size:11px;color:${this.COLORS.gold};">关联：${s.relatedNPCs}</div>
        </div>
      `;
    }).join('');
  }
};
