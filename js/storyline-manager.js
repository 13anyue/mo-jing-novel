/**
 * =========================================================
 * StorylineManager v11 — 交互式剧情树可视化系统
 * 模块名：StorylineManager
 * 功能：
 *   1. 多独立故事线（Slot管理）：每个slot有独立的角色/世界观/进度
 *   2. 分支存档点（Galgame式存档树）：单故事线内回溯并创建新分支
 *   3. 交互式Canvas可视化：树形布局、缩放平移、拖拽节点
 *   4. 存档自动隔离：不同故事线数据互不干扰
 *   5. 一键切换故事线：EventBridge通知所有模块同步
 * =========================================================
 */
const StorylineManager = {
  /* ========== 常量配置 ========== */
  MAX_SLOTS: 10,
  STORAGE_KEY: 'storyline_tree_v11',
  STORYLINE_COLORS: [
    { name: '金色', color: '#C9A227', bg: '#FDF8E8', border: '#D4AF37' },
    { name: '朱红', color: '#C0392B', bg: '#FDEEEE', border: '#D35400' },
    { name: '靛蓝', color: '#2980B9', bg: '#E8F4FD', border: '#3498DB' },
    { name: '紫罗兰', color: '#8E44AD', bg: '#F3E8FD', border: '#9B59B6' },
    { name: '翠绿', color: '#27AE60', bg: '#E8FDEF', border: '#2ECC71' },
    { name: '橙黄', color: '#E67E22', bg: '#FEF3E8', border: '#F39C12' },
    { name: '玫粉', color: '#E91E63', bg: '#FDE8F0', border: '#EC407A' },
    { name: '墨色', color: '#2C1810', bg: '#F5F0EC', border: '#5D4037' }
  ],

  /* 节点样式 */
  NODE_WIDTH: 200,
  NODE_HEIGHT: 72,
  NODE_RADIUS: 12,
  NODE_GAP_X: 60,
  NODE_GAP_Y: 30,
  LINE_WIDTH: 2,
  SELECTED_BORDER_WIDTH: 3,

  /* 视图状态 */
  canvas: null,
  ctx: null,
  dpr: 1,
  zoom: 1,
  minZoom: 0.25,
  maxZoom: 3,
  panX: 0,
  panY: 0,
  isDragging: false,
  isPanning: false,
  dragNode: null,
  dragStartX: 0,
  dragStartY: 0,
  panStartX: 0,
  panStartY: 0,
  lastMouseX: 0,
  lastMouseY: 0,
  selectedNodeId: null,
  hoveredNodeId: null,
  searchQuery: '',
  filterStoryId: 'all',
  nodes: [],
  links: [],
  animating: false,
  contextMenuNode: null,
  simplifiedMode: false,

  /* ========== 初始化 ========== */

  /**
   * 初始化管理器
   */
  init() {
    this._migrateFromV8();
    this.renderPage();
  },

  /**
   * 页面进入时调用
   */
  onEnter() {
    this._initCanvas();
    this._loadNodes();
    this._computeTreeLayout();
    this._startRenderLoop();
    this._bindEvents();
    this._buildUIControls();
    this.fitView();
  },

  /**
   * 从v8版本数据迁移到v11
   */
  _migrateFromV8() {
    const existing = Storage.get(this.STORAGE_KEY);
    if (existing) return;

    const oldSlots = Storage.get('storylineSlots_v8', []);
    const oldBranches = Storage.get('branchSaves_v8', {});
    const nodes = [];

    oldSlots.forEach((slot, idx) => {
      const storyColor = this.STORYLINE_COLORS[idx % this.STORYLINE_COLORS.length];
      const storyId = slot.id;
      const storyName = slot.name;

      /* 将旧slot的创建时间作为根节点 */
      const rootNode = {
        id: storyId,
        label: storyName,
        storyId: storyId,
        storyName: storyName,
        timestamp: slot.createdAt || Date.now(),
        parentId: null,
        branchName: '故事起点',
        description: slot.description || '',
        npcId: null,
        mood: '',
        position: { x: 0, y: 0 },
        colorIdx: idx % this.STORYLINE_COLORS.length,
        isRoot: true,
        slotData: slot.data || {}
      };
      nodes.push(rootNode);

      /* 迁移分支存档 */
      const branches = oldBranches[storyId] || [];
      branches.forEach(b => {
        nodes.push({
          id: b.id,
          label: b.name,
          storyId: storyId,
          storyName: storyName,
          timestamp: b.timestamp || Date.now(),
          parentId: b.parentId || storyId,
          branchName: b.parentId ? '分支存档' : '主线存档',
          description: '',
          npcId: null,
          mood: '',
          position: { x: 0, y: 0 },
          colorIdx: idx % this.STORYLINE_COLORS.length,
          isRoot: false,
          slotData: b.data || {}
        });
      });
    });

    if (nodes.length > 0) {
      Storage.set(this.STORAGE_KEY, nodes);
    }
  },

  /* ========== 数据访问层（兼容v10） ========== */

  /**
   * 获取所有存档槽位（兼容旧API）
   */
  getSlots() {
    const nodes = this._getAllNodes();
    const stories = {};
    nodes.forEach(n => {
      if (!stories[n.storyId]) {
        stories[n.storyId] = {
          id: n.storyId,
          name: n.storyName,
          description: n.description || '',
          createdAt: n.timestamp,
          updatedAt: n.timestamp,
          playTime: 0,
          data: n.slotData || {}
        };
      }
    });
    return Object.values(stories);
  },

  /**
   * 创建新存档槽位（兼容旧API）
   */
  createSlot() {
    const name = prompt('故事线名称：');
    if (!name) return;

    const nodes = this._getAllNodes();
    const storyCount = new Set(nodes.map(n => n.storyId)).size;
    if (storyCount >= this.MAX_SLOTS) {
      App.toast('故事线数量已达上限（' + this.MAX_SLOTS + '）', 'error');
      return;
    }

    const desc = prompt('故事线描述：', '');
    const storyId = 'slot_' + Date.now();
    const colorIdx = storyCount % this.STORYLINE_COLORS.length;

    const rootNode = {
      id: storyId,
      label: name,
      storyId: storyId,
      storyName: name,
      timestamp: Date.now(),
      parentId: null,
      branchName: '故事起点',
      description: desc || '',
      npcId: null,
      mood: '',
      position: { x: 0, y: 0 },
      colorIdx: colorIdx,
      isRoot: true,
      slotData: this._captureSlotData()
    };

    nodes.push(rootNode);
    this._saveAllNodes(nodes);
    this._loadNodes();
    this._computeTreeLayout();
    this._buildUIControls();
    this.fitView();
    App.toast(`故事线「${name}」已创建`, 'success');
    if (EventBridge) EventBridge.emit('storyline', 'slot_created', { slotId: storyId, name }, 'StorylineManager');
  },

  /**
   * 删除存档槽位（兼容旧API）
   */
  deleteSlot(id) {
    if (!confirm('删除此故事线？所有相关分支存档将一并删除！')) return;
    let nodes = this._getAllNodes().filter(n => n.storyId !== id);
    this._saveAllNodes(nodes);
    this._loadNodes();
    this._computeTreeLayout();
    this._buildUIControls();
    if (this.selectedNodeId && !this.nodes.find(n => n.id === this.selectedNodeId)) {
      this.selectedNodeId = null;
      this._hideDetailPanel();
    }
    App.toast('故事线已删除', 'success');
  },

  /**
   * 加载存档槽位（兼容旧API）
   */
  loadSlot(id) {
    const node = this.nodes.find(n => n.id === id);
    if (!node) return;
    this._restoreSlotData(node.slotData);
    App.toast(`已加载「${node.label}」`, 'success');
    setTimeout(() => location.reload(), 800);
  },

  /**
   * 导出存档槽位（兼容旧API）
   */
  exportSlots() {
    const nodes = this._getAllNodes();
    const blob = new Blob([JSON.stringify(nodes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `墨境剧情树-${new Date().toLocaleDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    App.toast('剧情树已导出', 'success');
  },

  /**
   * 导入存档槽位（兼容旧API）
   */
  importSlots() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!Array.isArray(data)) { App.toast('无效的剧情树文件', 'error'); return; }

        /* 重新分配storyId避免冲突 */
        const storyIdMap = {};
        data.forEach(n => {
          if (!storyIdMap[n.storyId]) {
            storyIdMap[n.storyId] = 'slot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
          }
          n.storyId = storyIdMap[n.storyId];
          n.id = n.id === n.storyId ? n.storyId : 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        });

        const existing = this._getAllNodes();
        const merged = existing.concat(data);
        this._saveAllNodes(merged);
        this._loadNodes();
        this._computeTreeLayout();
        this._buildUIControls();
        this.fitView();
        App.toast(`已导入 ${data.length} 个节点`, 'success');
      } catch (err) { App.toast('导入失败：' + err.message, 'error'); }
    };
    input.click();
  },

  /* ========== 节点内部数据操作 ========== */

  _getAllNodes() {
    return Storage.get(this.STORAGE_KEY, []);
  },

  _saveAllNodes(nodes) {
    Storage.set(this.STORAGE_KEY, nodes);
  },

  _loadNodes() {
    let nodes = this._getAllNodes();
    const storyIds = [...new Set(nodes.map(n => n.storyId))];

    /* 为没有colorIdx的节点补充分配 */
    nodes.forEach(n => {
      if (n.colorIdx === undefined) {
        const idx = storyIds.indexOf(n.storyId);
        n.colorIdx = idx >= 0 ? idx % this.STORYLINE_COLORS.length : 0;
      }
    });

    /* 应用筛选 */
    if (this.filterStoryId !== 'all') {
      nodes = nodes.filter(n => n.storyId === this.filterStoryId);
    }

    /* 搜索过滤 */
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      nodes = nodes.filter(n =>
        (n.label && n.label.toLowerCase().includes(q)) ||
        (n.branchName && n.branchName.toLowerCase().includes(q)) ||
        (n.description && n.description.toLowerCase().includes(q))
      );
    }

    this.nodes = nodes;
    this.simplifiedMode = nodes.length > 50;

    /* 构建连线 */
    this.links = [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    nodes.forEach(n => {
      if (n.parentId && nodeMap.has(n.parentId)) {
        this.links.push({ source: n.parentId, target: n.id });
      }
    });
  },

  /* ========== 存档数据快照 ========== */

  _captureSlotData() {
    return {
      npcs: Storage.get('npcs_v3', []),
      backgrounds: Storage.get('backgrounds_v3', []),
      maps: Storage.get('maps_v3', []),
      musicList: Storage.get('musicList', []),
      memories: Storage.get('memories', []),
      worldBook: Storage.get('worldBook', {}),
      worldData: Storage.get('worldData', {}),
      userMask: Storage.get('userMask', {}),
      playerName: Storage.get('playerName', '玩家'),
      gameVars: Storage.get('gameVars', {}),
      gameFlags: Storage.get('gameFlags', []),
      achievements: Storage.get('achievements_unlocked_v6', []),
      inventory: Storage.get('inventory_v6', []),
      alliances: Storage.get('alliances_v6', []),
      customApps: Storage.get('customApps_v6', []),
      scenes: Storage.get('dynamic_scenes_v7', []),
      timeline: Storage.get('timelineState_v7', {}),
      events: Storage.get('events_v7', []),
      runtimeHistory: NovelRuntime?._state?.history || [],
      runtimeSettings: Storage.get('runtimeSettings_v7', {}),
      timestamp: Date.now()
    };
  },

  _restoreSlotData(data) {
    if (!data) return;
    const keys = {
      npcs: 'npcs_v3', backgrounds: 'backgrounds_v3', maps: 'maps_v3',
      musicList: 'musicList', memories: 'memories', worldBook: 'worldBook',
      worldData: 'worldData', userMask: 'userMask', playerName: 'playerName',
      gameVars: 'gameVars', gameFlags: 'gameFlags',
      achievements: 'achievements_unlocked_v6', inventory: 'inventory_v6',
      alliances: 'alliances_v6', customApps: 'customApps_v6',
      scenes: 'dynamic_scenes_v7', timeline: 'timelineState_v7',
      events: 'events_v7', runtimeSettings: 'runtimeSettings_v7'
    };
    Object.entries(keys).forEach(([dataKey, storageKey]) => {
      if (data[dataKey] !== undefined) Storage.set(storageKey, data[dataKey]);
    });
    if (data.playerName) Storage.set('playerName', data.playerName);
    if (data.runtimeHistory && NovelRuntime) NovelRuntime._state.history = data.runtimeHistory;
  },

  /* ========== 树形布局算法 ========== */

  /**
   * 计算树形布局坐标
   */
  _computeTreeLayout() {
    const nodes = this.nodes;
    if (nodes.length === 0) return;

    /* 按storyId分组 */
    const storyGroups = {};
    nodes.forEach(n => {
      if (!storyGroups[n.storyId]) storyGroups[n.storyId] = [];
      storyGroups[n.storyId].push(n);
    });

    let currentY = 50;
    const storyIds = Object.keys(storyGroups);

    storyIds.forEach((storyId, sIdx) => {
      const group = storyGroups[storyId];
      const root = group.find(n => n.parentId === null || !nodes.find(p => p.id === n.parentId));

      if (root) {
        this._layoutSubtree(root, group, 50, currentY, 0);
      } else {
        /* 没有根节点时，水平排列 */
        group.forEach((n, i) => {
          if (!n.position || n.position.x === 0 && n.position.y === 0) {
            n.position = { x: 50 + i * (this.NODE_WIDTH + this.NODE_GAP_X), y: currentY };
          }
        });
      }

      /* 计算本组高度 */
      const maxY = Math.max(...group.map(n => n.position.y));
      currentY = maxY + this.NODE_HEIGHT + this.NODE_GAP_Y + 40;
    });
  },

  /**
   * 递归布局子树（水平方向展开）
   */
  _layoutSubtree(node, allGroupNodes, x, y, depth) {
    if (!node.position) node.position = { x: 0, y: 0 };

    /* 若节点已有手动位置，保留之 */
    const hasManualPos = node.position.x !== 0 || node.position.y !== 0;
    if (!hasManualPos || (node.position._auto === true)) {
      node.position.x = x + depth * (this.NODE_WIDTH + this.NODE_GAP_X);
      node.position.y = y;
      node.position._auto = true;
    }

    /* 找到子节点 */
    const children = allGroupNodes.filter(n => n.parentId === node.id);
    if (children.length === 0) return;

    /* 计算子树总高度 */
    const subtreeHeights = children.map(c => this._getSubtreeHeight(c, allGroupNodes));
    const totalHeight = subtreeHeights.reduce((a, b) => a + b, 0) +
                        (children.length - 1) * this.NODE_GAP_Y;

    let childY = y - totalHeight / 2;
    children.forEach((child, i) => {
      const childHeight = subtreeHeights[i];
      childY += childHeight / 2;
      this._layoutSubtree(child, allGroupNodes, x, childY, depth + 1);
      childY += childHeight / 2 + this.NODE_GAP_Y;
    });
  },

  /**
   * 计算子树高度
   */
  _getSubtreeHeight(node, allNodes) {
    const children = allNodes.filter(n => n.parentId === node.id);
    if (children.length === 0) return this.NODE_HEIGHT + this.NODE_GAP_Y;

    let height = 0;
    children.forEach(c => {
      height += this._getSubtreeHeight(c, allNodes);
    });
    height += (children.length - 1) * this.NODE_GAP_Y;
    return height;
  },

  /* ========== Canvas 渲染引擎 ========== */

  /**
   * 初始化Canvas
   */
  _initCanvas() {
    const container = document.getElementById('treeCanvasContainer');
    if (!container) return;

    this.canvas = document.getElementById('storylineCanvas');
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'storylineCanvas';
      container.appendChild(this.canvas);
    }

    this.ctx = this.canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
    this._resizeCanvas();

    window.addEventListener('resize', () => {
      this._resizeCanvas();
      this._scheduleRender();
    });
  },

  /**
   * 调整Canvas尺寸适配DPI
   */
  _resizeCanvas() {
    if (!this.canvas) return;
    const container = this.canvas.parentElement;
    const rect = container.getBoundingClientRect();
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.scale(this.dpr, this.dpr);
  },

  /**
   * 启动渲染循环
   */
  _startRenderLoop() {
    if (this.animating) return;
    this.animating = true;
    this._renderLoop();
  },

  /**
   * 停止渲染循环
   */
  _stopRenderLoop() {
    this.animating = false;
  },

  /**
   * 动画循环
   */
  _renderLoop() {
    if (!this.animating) return;
    this.renderTree();
    requestAnimationFrame(() => this._renderLoop());
  },

  /**
   * 调度一次渲染
   */
  _scheduleRender() {
    if (!this.animating) {
      this.renderTree();
    }
  },

  /**
   * 主渲染函数
   */
  renderTree() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const width = this.canvas.width / this.dpr;
    const height = this.canvas.height / this.dpr;

    /* 清空画布 */
    ctx.clearRect(0, 0, width, height);

    /* 绘制背景 */
    ctx.fillStyle = '#F5E6D3';
    ctx.fillRect(0, 0, width, height);

    /* 绘制网格（古风细线） */
    this._drawGrid(ctx, width, height);

    /* 保存上下文 */
    ctx.save();

    /* 应用视图变换 */
    ctx.translate(this.panX, this.panY);
    ctx.scale(this.zoom, this.zoom);

    /* 计算视口范围（用于虚拟渲染） */
    const viewport = {
      x: -this.panX / this.zoom - 100,
      y: -this.panY / this.zoom - 100,
      w: width / this.zoom + 200,
      h: height / this.zoom + 200
    };

    /* 绘制连线 */
    this._drawLinks(ctx, viewport);

    /* 绘制节点 */
    this._drawNodes(ctx, viewport);

    ctx.restore();

    /* 绘制UI覆盖层（简化模式提示） */
    if (this.simplifiedMode) {
      ctx.fillStyle = 'rgba(44, 24, 16, 0.7)';
      ctx.beginPath();
      ctx.roundRect(width - 200, 10, 190, 28, 8);
      ctx.fill();
      ctx.fillStyle = '#C9A227';
      ctx.font = '12px "Noto Serif SC", serif';
      ctx.textAlign = 'center';
      ctx.fillText('简化模式：节点超过50个', width - 105, 28);
    }
  },

  /**
   * 绘制背景网格
   */
  _drawGrid(ctx, width, height) {
    const gridSize = 40 * this.zoom;
    const offsetX = this.panX % gridSize;
    const offsetY = this.panY % gridSize;

    ctx.strokeStyle = 'rgba(201, 162, 39, 0.08)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let x = offsetX; x < width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = offsetY; y < height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  },

  /**
   * 绘制节点间连线
   */
  _drawLinks(ctx, viewport) {
    ctx.lineWidth = this.LINE_WIDTH;

    this.links.forEach(link => {
      const source = this.nodes.find(n => n.id === link.source);
      const target = this.nodes.find(n => n.id === link.target);
      if (!source || !target) return;

      /* 虚拟渲染裁剪 */
      if (!this._isInViewport(source.position, viewport) &&
          !this._isInViewport(target.position, viewport)) return;

      const sx = source.position.x + this.NODE_WIDTH;
      const sy = source.position.y + this.NODE_HEIGHT / 2;
      const tx = target.position.x;
      const ty = target.position.y + this.NODE_HEIGHT / 2;

      const color = this.STORYLINE_COLORS[source.colorIdx || 0].color;

      /* 贝塞尔曲线 */
      ctx.strokeStyle = color + '80'; /* 50%透明度 */
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      const cp1x = sx + (tx - sx) * 0.5;
      const cp1y = sy;
      const cp2x = tx - (tx - sx) * 0.5;
      const cp2y = ty;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, tx, ty);
      ctx.stroke();
    });
  },

  /**
   * 绘制所有节点
   */
  _drawNodes(ctx, viewport) {
    this.nodes.forEach(node => {
      /* 虚拟渲染裁剪 */
      if (!this._isInViewport(node.position, viewport)) return;

      const isSelected = node.id === this.selectedNodeId;
      const isHovered = node.id === this.hoveredNodeId;
      const isSearchMatch = this.searchQuery &&
        (node.label.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
         (node.branchName && node.branchName.toLowerCase().includes(this.searchQuery.toLowerCase())));

      this._drawNode(ctx, node, isSelected, isHovered, isSearchMatch);
    });
  },

  /**
   * 绘制单个节点
   */
  _drawNode(ctx, node, isSelected, isHovered, isSearchMatch) {
    const x = node.position.x;
    const y = node.position.y;
    const w = this.NODE_WIDTH;
    const h = this.simplifiedMode ? 36 : this.NODE_HEIGHT;
    const r = this.NODE_RADIUS;
    const colorSet = this.STORYLINE_COLORS[node.colorIdx || 0];

    /* 阴影 */
    if (!this.simplifiedMode) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 3;
    }

    /* 节点背景 */
    ctx.fillStyle = isSearchMatch ? '#FFF8E1' : (colorSet.bg || '#FFF');
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();

    /* 重置阴影 */
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    /* 边框 */
    ctx.lineWidth = isSelected ? this.SELECTED_BORDER_WIDTH : (isHovered ? 2 : 1.5);
    ctx.strokeStyle = isSelected ? '#C9A227' : (isHovered ? colorSet.color : colorSet.border);
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.stroke();

    if (this.simplifiedMode) {
      /* 简化模式只画标签 */
      ctx.fillStyle = '#2C1810';
      ctx.font = 'bold 12px "Noto Serif SC", serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const label = node.label.length > 12 ? node.label.substring(0, 12) + '…' : node.label;
      ctx.fillText(label, x + 10, y + h / 2);
      return;
    }

    /* 故事线颜色条（左侧） */
    ctx.fillStyle = colorSet.color;
    ctx.beginPath();
    ctx.roundRect(x, y, 4, h, { topLeft: r, bottomLeft: r, topRight: 0, bottomRight: 0 });
    ctx.fill();

    /* 标签 */
    ctx.fillStyle = '#2C1810';
    ctx.font = 'bold 14px "Noto Serif SC", serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const label = node.label.length > 14 ? node.label.substring(0, 14) + '…' : node.label;
    ctx.fillText(label, x + 14, y + 10);

    /* 分支名称 */
    if (node.branchName) {
      ctx.fillStyle = colorSet.color;
      ctx.font = '11px "Noto Serif SC", serif';
      ctx.fillText(node.branchName, x + 14, y + 30);
    }

    /* 时间戳 */
    ctx.fillStyle = '#8D6E63';
    ctx.font = '10px "Noto Serif SC", serif';
    const timeStr = new Date(node.timestamp).toLocaleDateString();
    ctx.fillText(timeStr, x + 14, y + 50);

    /* 根节点标记 */
    if (node.isRoot) {
      ctx.fillStyle = '#C9A227';
      ctx.beginPath();
      ctx.arc(x + w - 16, y + 16, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('起', x + w - 16, y + 16);
    }

    /* 搜索高亮标记 */
    if (isSearchMatch) {
      ctx.strokeStyle = '#FF6F00';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.roundRect(x - 2, y - 2, w + 4, h + 4, r + 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  },

  /**
   * 判断节点是否在视口内
   */
  _isInViewport(pos, viewport) {
    return pos.x + this.NODE_WIDTH >= viewport.x &&
           pos.x <= viewport.x + viewport.w &&
           pos.y + this.NODE_HEIGHT >= viewport.y &&
           pos.y <= viewport.y + viewport.h;
  },

  /* ========== 交互事件处理 ========== */

  /**
   * 绑定Canvas交互事件
   */
  _bindEvents() {
    if (!this.canvas) return;

    this.canvas.addEventListener('wheel', e => this.handleZoom(e), { passive: false });
    this.canvas.addEventListener('mousedown', e => this._onMouseDown(e));
    this.canvas.addEventListener('mousemove', e => this._onMouseMove(e));
    this.canvas.addEventListener('mouseup', e => this._onMouseUp(e));
    this.canvas.addEventListener('dblclick', e => this._onDoubleClick(e));
    this.canvas.addEventListener('contextmenu', e => this._onContextMenu(e));

    /* 触摸事件支持 */
    this.canvas.addEventListener('touchstart', e => this._onTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', e => this._onTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', e => this._onTouchEnd(e));
  },

  /**
   * 坐标转换：屏幕 -> 画布世界坐标
   */
  _screenToWorld(screenX, screenY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (screenX - rect.left - this.panX) / this.zoom,
      y: (screenY - rect.top - this.panY) / this.zoom
    };
  },

  /**
   * 获取鼠标位置下的节点
   */
  _getNodeAt(x, y) {
    const world = this._screenToWorld(x, y);
    /* 从后往前找，后绘制的在上面 */
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const n = this.nodes[i];
      const h = this.simplifiedMode ? 36 : this.NODE_HEIGHT;
      if (world.x >= n.position.x && world.x <= n.position.x + this.NODE_WIDTH &&
          world.y >= n.position.y && world.y <= n.position.y + h) {
        return n;
      }
    }
    return null;
  },

  /**
   * 鼠标按下事件
   */
  _onMouseDown(e) {
    if (e.button === 2) return; /* 右键由contextmenu处理 */

    const node = this._getNodeAt(e.clientX, e.clientY);
    if (node) {
      /* 开始拖拽节点 */
      this.isDragging = true;
      this.dragNode = node;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.selectNode(node.id);
    } else {
      /* 开始平移画布 */
      this.isPanning = true;
      this.panStartX = e.clientX - this.panX;
      this.panStartY = e.clientY - this.panY;
      this.canvas.style.cursor = 'grabbing';
    }
  },

  /**
   * 鼠标移动事件
   */
  _onMouseMove(e) {
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;

    if (this.isDragging && this.dragNode) {
      const dx = (e.clientX - this.dragStartX) / this.zoom;
      const dy = (e.clientY - this.dragStartY) / this.zoom;
      this.dragNode.position.x += dx;
      this.dragNode.position.y += dy;
      this.dragNode.position._auto = false; /* 标记为手动位置 */
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this._scheduleRender();
    } else if (this.isPanning) {
      this.panX = e.clientX - this.panStartX;
      this.panY = e.clientY - this.panStartY;
      this._scheduleRender();
    } else {
      /* 检测悬停 */
      const node = this._getNodeAt(e.clientX, e.clientY);
      if (node?.id !== this.hoveredNodeId) {
        this.hoveredNodeId = node ? node.id : null;
        this.canvas.style.cursor = node ? 'pointer' : 'default';
        this._scheduleRender();
      }
    }
  },

  /**
   * 鼠标松开事件
   */
  _onMouseUp(e) {
    if (this.isDragging && this.dragNode) {
      /* 保存新位置 */
      this._saveNodePosition(this.dragNode);
    }
    this.isDragging = false;
    this.dragNode = null;
    this.isPanning = false;
    this.canvas.style.cursor = this.hoveredNodeId ? 'pointer' : 'default';
  },

  /**
   * 双击事件：跳转到存档点
   */
  _onDoubleClick(e) {
    const node = this._getNodeAt(e.clientX, e.clientY);
    if (node) {
      this.loadSlot(node.id);
    }
  },

  /**
   * 右键菜单事件
   */
  _onContextMenu(e) {
    e.preventDefault();
    const node = this._getNodeAt(e.clientX, e.clientY);
    this.contextMenuNode = node;
    this._showContextMenu(e.clientX, e.clientY, node);
  },

  /**
   * 触摸开始
   */
  _onTouchStart(e) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const node = this._getNodeAt(touch.clientX, touch.clientY);
      if (node) {
        this.isDragging = true;
        this.dragNode = node;
        this.dragStartX = touch.clientX;
        this.dragStartY = touch.clientY;
        this.selectNode(node.id);
      } else {
        this.isPanning = true;
        this.panStartX = touch.clientX - this.panX;
        this.panStartY = touch.clientY - this.panY;
      }
    } else if (e.touches.length === 2) {
      /* 双指缩放 */
      this.lastPinchDist = this._getPinchDist(e.touches);
    }
  },

  _onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (this.isDragging && this.dragNode) {
        const dx = (touch.clientX - this.dragStartX) / this.zoom;
        const dy = (touch.clientY - this.dragStartY) / this.zoom;
        this.dragNode.position.x += dx;
        this.dragNode.position.y += dy;
        this.dragNode.position._auto = false;
        this.dragStartX = touch.clientX;
        this.dragStartY = touch.clientY;
        this._scheduleRender();
      } else if (this.isPanning) {
        this.panX = touch.clientX - this.panStartX;
        this.panY = touch.clientY - this.panStartY;
        this._scheduleRender();
      }
    } else if (e.touches.length === 2) {
      const dist = this._getPinchDist(e.touches);
      if (this.lastPinchDist) {
        const scale = dist / this.lastPinchDist;
        this._applyZoom(scale, e.touches[0].clientX, e.touches[0].clientY);
      }
      this.lastPinchDist = dist;
    }
  },

  _onTouchEnd(e) {
    if (this.isDragging && this.dragNode) {
      this._saveNodePosition(this.dragNode);
    }
    this.isDragging = false;
    this.dragNode = null;
    this.isPanning = false;
    this.lastPinchDist = null;
  },

  _getPinchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  },

  /* ========== 交互方法（公开API） ========== */

  /**
   * 处理缩放（滚轮事件）
   */
  handleZoom(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    this._applyZoom(delta, e.clientX, e.clientY);
  },

  /**
   * 应用缩放，以指定点为中心
   */
  _applyZoom(scale, centerX, centerY) {
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * scale));
    if (newZoom === this.zoom) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = centerX - rect.left;
    const y = centerY - rect.top;

    /* 以鼠标位置为中心缩放 */
    this.panX = x - (x - this.panX) * (newZoom / this.zoom);
    this.panY = y - (y - this.panY) * (newZoom / this.zoom);
    this.zoom = newZoom;

    this._scheduleRender();
  },

  /**
   * 处理平移
   */
  handlePan(dx, dy) {
    this.panX += dx;
    this.panY += dy;
    this._scheduleRender();
  },

  /**
   * 处理节点拖拽
   */
  handleNodeDrag(nodeId, newX, newY) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;
    node.position.x = newX;
    node.position.y = newY;
    node.position._auto = false;
    this._saveNodePosition(node);
    this._scheduleRender();
  },

  /**
   * 选中节点
   */
  selectNode(nodeId) {
    this.selectedNodeId = nodeId;
    const node = this.nodes.find(n => n.id === nodeId);
    if (node) {
      this._showDetailPanel(node);
    } else {
      this._hideDetailPanel();
    }
    this._scheduleRender();
  },

  /**
   * 添加节点（作为某个节点的子节点）
   */
  addNode(parentId) {
    const parent = this.nodes.find(n => n.id === parentId);
    if (!parent) return;

    const label = prompt('存档标签：', '新存档点');
    if (!label) return;
    const branchName = prompt('分支名称：', '分支存档');
    const description = prompt('存档描述：', '');

    const allNodes = this._getAllNodes();
    const newNode = {
      id: 'node_' + Date.now(),
      label: label,
      storyId: parent.storyId,
      storyName: parent.storyName,
      timestamp: Date.now(),
      parentId: parentId,
      branchName: branchName || '分支存档',
      description: description || '',
      npcId: null,
      mood: '',
      position: { x: 0, y: 0, _auto: true },
      colorIdx: parent.colorIdx,
      isRoot: false,
      slotData: this._captureSlotData()
    };

    allNodes.push(newNode);
    this._saveAllNodes(allNodes);
    this._loadNodes();
    this._computeTreeLayout();
    this._scheduleRender();
    App.toast('存档点已添加', 'success');
  },

  /**
   * 删除节点
   */
  deleteNode(nodeId) {
    if (!confirm('删除此存档点？子分支将一并删除！')) return;

    const allNodes = this._getAllNodes();

    /* 递归收集要删除的节点 */
    const toDelete = new Set();
    const collect = (id) => {
      toDelete.add(id);
      allNodes.filter(n => n.parentId === id).forEach(c => collect(c.id));
    };
    collect(nodeId);

    const filtered = allNodes.filter(n => !toDelete.has(n.id));
    this._saveAllNodes(filtered);
    this._loadNodes();
    this._computeTreeLayout();
    if (this.selectedNodeId === nodeId || toDelete.has(this.selectedNodeId)) {
      this.selectedNodeId = null;
      this._hideDetailPanel();
    }
    this._scheduleRender();
    App.toast('存档点已删除', 'success');
  },

  /**
   * 编辑节点
   */
  editNode(nodeId) {
    const allNodes = this._getAllNodes();
    const node = allNodes.find(n => n.id === nodeId);
    if (!node) return;

    const label = prompt('存档标签：', node.label);
    if (label === null) return;
    const branchName = prompt('分支名称：', node.branchName || '');
    if (branchName === null) return;
    const description = prompt('存档描述：', node.description || '');
    if (description === null) return;

    node.label = label || node.label;
    node.branchName = branchName;
    node.description = description;
    this._saveAllNodes(allNodes);
    this._loadNodes();
    this._scheduleRender();

    /* 刷新详情面板 */
    if (this.selectedNodeId === nodeId) {
      const updated = this.nodes.find(n => n.id === nodeId);
      if (updated) this._showDetailPanel(updated);
    }
    App.toast('存档点已更新', 'success');
  },

  /**
   * 适应屏幕：缩放并平移使所有节点可见
   */
  fitView() {
    if (this.nodes.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    this.nodes.forEach(n => {
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + this.NODE_WIDTH);
      maxY = Math.max(maxY, n.position.y + this.NODE_HEIGHT);
    });

    const rect = this.canvas.getBoundingClientRect();
    const padding = 60;
    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;

    const scaleX = rect.width / contentW;
    const scaleY = rect.height / contentH;
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, Math.min(scaleX, scaleY) * 0.9));

    this.panX = (rect.width - (maxX - minX) * this.zoom) / 2 - minX * this.zoom;
    this.panY = (rect.height - (maxY - minY) * this.zoom) / 2 - minY * this.zoom;

    this._scheduleRender();
  },

  /**
   * 重置视图
   */
  resetView() {
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this._scheduleRender();
  },

  /* ========== UI 控件 ========== */

  /**
   * 构建页面HTML结构
   */
  renderPage() {
    const page = document.getElementById('page-storyline-manager');
    if (!page) return;
    page.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
<div id="storylineToolbar" style="display:flex;justify-content:space-between;align-items:center;
           padding:12px 16px;background:linear-gradient(135deg,#2C1810,#4A3025);
           border-bottom:2px solid #C9A227;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <h2 style="margin:0;font-size:18px;color:#C9A227;font-family:var(--font-display);">📚 墨境剧情树</h2>
          <select id="storyFilter" class="btn btn-secondary" style="font-size:13px;padding:4px 8px;">
            <option value="all">全部故事线</option>
          </select>
          <input id="nodeSearch" type="text" placeholder="🔍 搜索存档..." style="
            padding:4px 10px;border-radius:6px;border:1px solid #C9A227;
            background:rgba(245,230,211,0.9);color:#2C1810;font-size:13px;width:160px;">
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="StorylineManager.createSlot()">➕ 新故事线</button>
          <button class="btn btn-secondary" onclick="StorylineManager.importSlots()">📥 导入</button>
          <button class="btn btn-secondary" onclick="StorylineManager.exportSlots()">📤 导出</button>
        </div>
      </div>
      <div id="treeCanvasContainer" style="flex:1;position:relative;overflow:hidden;background:#F5E6D3;"></div>
      <div id="storylineZoomControls" style="position:absolute;bottom:20px;right:20px;display:flex;flex-direction:column;gap:4px;z-index:10;">
        <button class="btn btn-secondary" style="width:36px;height:36px;padding:0;font-size:18px;" onclick="StorylineManager._applyZoom(1.25, window.innerWidth-40, window.innerHeight-40)" title="放大">+</button>
        <button class="btn btn-secondary" style="width:36px;height:36px;padding:0;font-size:18px;" onclick="StorylineManager._applyZoom(0.8, window.innerWidth-40, window.innerHeight-40)" title="缩小">−</button>
        <button class="btn btn-secondary" style="width:36px;height:36px;padding:0;font-size:14px;" onclick="StorylineManager.fitView()" title="适应屏幕">⊘</button>
        <button class="btn btn-secondary" style="width:36px;height:36px;padding:0;font-size:14px;" onclick="StorylineManager.resetView()" title="重置">⌂</button>
      </div>
      <div id="nodeDetailPanel" style="display:none;position:absolute;top:80px;right:20px;width:280px;
           background:linear-gradient(180deg,#FDF8E8,#F5E6D3);border:2px solid #C9A227;
           border-radius:12px;box-shadow:0 8px 32px rgba(44,24,16,0.25);z-index:20;overflow:hidden;"></div>
      <div id="nodeContextMenu" style="display:none;position:absolute;background:#FDF8E8;
           border:1px solid #C9A227;border-radius:8px;box-shadow:0 4px 16px rgba(44,24,16,0.2);
           z-index:30;min-width:140px;overflow:hidden;"></div>
    `;
    page.style.display = 'flex';
    page.style.flexDirection = 'column';
    page.style.height = '100%';

    /* 延迟初始化Canvas，等待DOM渲染 */
    setTimeout(() => this.onEnter(), 50);

    /* 绑定搜索和筛选 */
    const searchInput = document.getElementById('nodeSearch');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        this.searchQuery = e.target.value;
        this._loadNodes();
        this._scheduleRender();
      });
    }

    const filterSelect = document.getElementById('storyFilter');
    if (filterSelect) {
      filterSelect.addEventListener('change', e => {
        this.filterStoryId = e.target.value;
        this._loadNodes();
        this._computeTreeLayout();
        this.fitView();
      });
    }

    /* 点击空白处关闭菜单和面板 */
    document.addEventListener('click', e => {
      const menu = document.getElementById('nodeContextMenu');
      const panel = document.getElementById('nodeDetailPanel');
      if (menu && !menu.contains(e.target)) menu.style.display = 'none';
      /* 面板不自动关闭，保留给用户手动关闭 */
    });
  },

  /**
   * 构建UI控件（筛选下拉框等）
   */
  _buildUIControls() {
    const filterSelect = document.getElementById('storyFilter');
    if (!filterSelect) return;

    const allNodes = this._getAllNodes();
    const stories = [...new Set(allNodes.map(n => n.storyId))].map(sid => {
      const node = allNodes.find(n => n.storyId === sid);
      return { id: sid, name: node ? node.storyName : sid };
    });

    const currentVal = filterSelect.value;
    filterSelect.innerHTML = '<option value="all">全部故事线</option>' +
      stories.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    if ([...filterSelect.options].some(o => o.value === currentVal)) {
      filterSelect.value = currentVal;
    }
  },

  /**
   * 显示节点详情面板
   */
  _showDetailPanel(node) {
    const panel = document.getElementById('nodeDetailPanel');
    if (!panel) return;
    const colorSet = this.STORYLINE_COLORS[node.colorIdx || 0];

    panel.innerHTML = `
      <div style="padding:16px;border-bottom:1px solid #C9A22740;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h3 style="margin:0;font-size:16px;color:#2C1810;font-family:var(--font-display);">${node.label}</h3>
          <button onclick="StorylineManager._hideDetailPanel()" style="background:none;border:none;color:#8D6E63;cursor:pointer;font-size:18px;">×</button>
        </div>
        <span style="display:inline-block;margin-top:4px;padding:2px 8px;border-radius:4px;font-size:11px;
          background:${colorSet.bg};color:${colorSet.color};border:1px solid ${colorSet.border};">
          ${node.branchName || '存档点'}
        </span>
      </div>
      <div style="padding:16px;font-size:13px;color:#5D4037;line-height:1.7;">
        <p><strong style="color:#2C1810;">所属故事线：</strong>${node.storyName}</p>
        <p><strong style="color:#2C1810;">存档时间：</strong>${new Date(node.timestamp).toLocaleString()}</p>
        ${node.description ? `<p><strong style="color:#2C1810;">描述：</strong>${node.description}</p>` : ''}
        ${node.npcId ? `<p><strong style="color:#2C1810;">关联NPC：</strong>${node.npcId}</p>` : ''}
        ${node.mood ? `<p><strong style="color:#2C1810;">心情快照：</strong>${node.mood}</p>` : ''}
        <p><strong style="color:#2C1810;">节点ID：</strong><span style="font-size:11px;color:#8D6E63;">${node.id}</span></p>
      </div>
      <div style="padding:12px 16px;border-top:1px solid #C9A22740;display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-primary btn-sm" onclick="StorylineManager.loadSlot('${node.id}')">🎮 继续游戏</button>
        <button class="btn btn-secondary btn-sm" onclick="StorylineManager.editNode('${node.id}')">✏️ 编辑</button>
        <button class="btn btn-sm" style="background:#C0392B;color:#fff;" onclick="StorylineManager.deleteNode('${node.id}')">🗑️ 删除</button>
      </div>
    `;
    panel.style.display = 'block';
  },

  /**
   * 隐藏详情面板
   */
  _hideDetailPanel() {
    const panel = document.getElementById('nodeDetailPanel');
    if (panel) panel.style.display = 'none';
    this.selectedNodeId = null;
    this._scheduleRender();
  },

  /**
   * 显示右键上下文菜单
   */
  _showContextMenu(x, y, node) {
    const menu = document.getElementById('nodeContextMenu');
    if (!menu) return;

    if (node) {
      menu.innerHTML = `
        <div style="padding:8px 0;">
          <div style="padding:6px 14px;font-size:12px;color:#8D6E63;border-bottom:1px solid #C9A22730;">${node.label}</div>
          <button class="context-menu-item" onclick="StorylineManager.addNode('${node.id}');StorylineManager._hideContextMenu()">➕ 添加子节点</button>
          <button class="context-menu-item" onclick="StorylineManager.editNode('${node.id}');StorylineManager._hideContextMenu()">✏️ 编辑节点</button>
          <button class="context-menu-item" onclick="StorylineManager.loadSlot('${node.id}');StorylineManager._hideContextMenu()">🎮 跳转至此</button>
          <div style="border-top:1px solid #C9A22730;margin:4px 0;"></div>
          <button class="context-menu-item" style="color:#C0392B;" onclick="StorylineManager.deleteNode('${node.id}');StorylineManager._hideContextMenu()">🗑️ 删除节点</button>
        </div>
      `;
    } else {
      menu.innerHTML = `
        <div style="padding:8px 0;">
          <button class="context-menu-item" onclick="StorylineManager.fitView();StorylineManager._hideContextMenu()">⊘ 适应屏幕</button>
          <button class="context-menu-item" onclick="StorylineManager.resetView();StorylineManager._hideContextMenu()">⌂ 重置视图</button>
          <button class="context-menu-item" onclick="StorylineManager.createSlot();StorylineManager._hideContextMenu()">➕ 新建故事线</button>
        </div>
      `;
    }

    /* 确保菜单不超出屏幕 */
    const menuW = 160;
    const menuH = node ? 180 : 120;
    let left = x;
    let top = y;
    if (left + menuW > window.innerWidth) left = window.innerWidth - menuW - 10;
    if (top + menuH > window.innerHeight) top = window.innerHeight - menuH - 10;

    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
    menu.style.display = 'block';

    /* 注入菜单项样式 */
    if (!document.getElementById('contextMenuStyles')) {
      const style = document.createElement('style');
      style.id = 'contextMenuStyles';
      style.textContent = `
        .context-menu-item {
          display: block; width: 100%; padding: 8px 14px;
          background: none; border: none; text-align: left;
          font-size: 13px; color: #2C1810; cursor: pointer;
          font-family: var(--font-body); transition: background 0.2s;
        }
        .context-menu-item:hover { background: rgba(201, 162, 39, 0.15); }
      `;
      document.head.appendChild(style);
    }
  },

  _hideContextMenu() {
    const menu = document.getElementById('nodeContextMenu');
    if (menu) menu.style.display = 'none';
  },

  /* ========== 工具方法 ========== */

  /**
   * 保存节点位置到存储
   */
  _saveNodePosition(node) {
    const allNodes = this._getAllNodes();
    const stored = allNodes.find(n => n.id === node.id);
    if (stored) {
      stored.position = { ...node.position };
      this._saveAllNodes(allNodes);
    }
  },

  /* ========== 兼容旧版本的其他方法 ========== */

  /**
   * 创建分支存档（旧API兼容）
   */
  createBranchSave(name) {
    const slotId = this.getSlots()[0]?.id;
    if (!slotId) { App.toast('请先创建故事线', 'info'); return; }
    this.addNode(slotId);
  },

  /**
   * 从分支创建新分支（旧API兼容）
   */
  branchFromSave(branchId) {
    this.addNode(branchId);
  },

  /**
   * 加载分支存档（旧API兼容）
   */
  loadBranchSave(branchId) {
    this.loadSlot(branchId);
  },

  /**
   * 删除分支存档（旧API兼容）
   */
  deleteBranchSave(branchId) {
    this.deleteNode(branchId);
  },

  /**
   * 重命名故事线
   */
  renameSlot(id) {
    const allNodes = this._getAllNodes();
    const nodes = allNodes.filter(n => n.storyId === id);
    if (nodes.length === 0) return;
    const name = prompt('新名称：', nodes[0].storyName);
    if (!name) return;
    nodes.forEach(n => n.storyName = name);
    this._saveAllNodes(allNodes);
    this._loadNodes();
    this._buildUIControls();
    this._scheduleRender();
  },

  /**
   * 切换故事线（旧API兼容）
   */
  switchSlot(id) {
    const allNodes = this._getAllNodes();
    const root = allNodes.find(n => n.storyId === id && n.isRoot);
    if (!root) { App.toast('故事线不存在', 'error'); return; }
    this.loadSlot(root.id);
  },

  /**
   * 保存当前故事线进度（旧API兼容）
   */
  saveCurrentSlot() {
    const slots = this.getSlots();
    if (slots.length === 0) { App.toast('没有激活的故事线', 'error'); return; }

    const allNodes = this._getAllNodes();
    const activeSlot = slots[0];
    const root = allNodes.find(n => n.storyId === activeSlot.id && n.isRoot);
    if (root) {
      root.slotData = this._captureSlotData();
      root.timestamp = Date.now();
      this._saveAllNodes(allNodes);
      App.toast(`「${activeSlot.name}」已保存`, 'success');
    }
  },

  /**
   * 导出单个故事线
   */
  exportSlot(id) {
    const allNodes = this._getAllNodes();
    const storyNodes = allNodes.filter(n => n.storyId === id);
    if (storyNodes.length === 0) return;
    const blob = new Blob([JSON.stringify(storyNodes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `墨境故事线-${storyNodes[0].storyName}.json`;
    a.click();
    URL.revokeObjectURL(url);
    App.toast('故事线已导出', 'success');
  },

  /**
   * 导入单个故事线（旧API兼容）
   */
  importSlot() {
    this.importSlots();
  },

  /**
   * 渲染存档列表（旧API兼容，重定向到Canvas渲染）
   */
  renderSlots() {
    this._loadNodes();
    this._computeTreeLayout();
    this._buildUIControls();
    this._scheduleRender();
  },

  /**
   * 渲染分支树（旧API兼容，重定向到Canvas渲染）
   */
  renderBranchTree() {
    this._loadNodes();
    this._computeTreeLayout();
    this._scheduleRender();
  },

  /**
   * 创建分支存档提示（旧API兼容）
   */
  createBranchSavePrompt() {
    const slots = this.getSlots();
    if (slots.length === 0) { App.toast('请先创建故事线', 'info'); return; }
    this.addNode(slots[0].id);
  }
};

/* 兼容旧版浏览器：为CanvasContext添加roundRect polyfill */
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (typeof r === 'number') r = { topLeft: r, topRight: r, bottomRight: r, bottomLeft: r };
    const { topLeft = 0, topRight = 0, bottomRight = 0, bottomLeft = 0 } = r;
    this.moveTo(x + topLeft, y);
    this.lineTo(x + w - topRight, y);
    this.quadraticCurveTo(x + w, y, x + w, y + topRight);
    this.lineTo(x + w, y + h - bottomRight);
    this.quadraticCurveTo(x + w, y + h, x + w - bottomRight, y + h);
    this.lineTo(x + bottomLeft, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - bottomLeft);
    this.lineTo(x, y + topLeft);
    this.quadraticCurveTo(x, y, x + topLeft, y);
    this.closePath();
    return this;
  };
}
