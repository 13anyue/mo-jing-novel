/**
 * =========================================================
 * Scene System v13 — 场景探索系统
 * 特性：零预设地点/场景、地图双击联动、翻牌子NPC交互、
 *       独立背景图、古风墨境配色
 * =========================================================
 */
const SceneSystem = {
  // ============ 常量定义 ============

  /** 古风墨境配色方案 */
  COLORS: {
    parchment:    '#F5E6D3',
    parchmentDark:'#E8D4BC',
    ink:          '#2C1810',
    inkLight:     '#5C3A2E',
    inkMuted:     '#8B7355',
    gold:         '#C9A227',
    goldLight:    '#E8C84B',
    panelBg:      '#FDF8F0',
    panelBorder:  '#C9A227',
    overlayBg:    'rgba(44,24,16,0.92)',
    text:         '#2C1810'
  },

  /** 存储键名 */
  STORAGE_KEY: 'scene_data_v13',

  /** NPC 默认头像占位 */
  DEFAULT_AVATAR: '🧑',

  // ============ 运行时状态 ============

  /** 当前所在的场景地点ID */
  _currentLocationId: null,

  /** 当前选中的NPC ID */
  _selectedNPCId: null,

  /** 场景覆盖层DOM元素 */
  _overlayEl: null,

  // ============ 初始化入口 ============

  /**
   * 初始化场景系统（注册到App即可，无需立即渲染）
   */
  init() {
    // 监听hash变化，支持从URL直接进入场景
    window.addEventListener('hashchange', () => this.onEnter());
  },

  /**
   * 根据URL参数进入对应场景
   * 匹配 hash: #scene-location-{locationId}
   */
  onEnter() {
    const hash = window.location.hash;
    const match = hash.match(/^#scene-location-(.+)$/);
    if (match) {
      const locationId = match[1];
      this.enterScene(locationId);
    }
  },

  // ============ 数据持久化 ============

  /**
   * 加载场景数据
   */
  _loadData() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        return {
          scenes: data.scenes || {},
          version: data.version || 'v13'
        };
      }
    } catch (e) { console.warn('场景数据读取失败', e); }
    return { scenes: {}, version: 'v13' };
  },

  /**
   * 保存场景数据
   */
  _saveData(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) { console.warn('场景数据保存失败', e); }
  },

  /**
   * 获取指定地点的场景数据（不存在则创建空壳）
   */
  _getScene(locationId) {
    const data = this._loadData();
    if (!data.scenes[locationId]) {
      data.scenes[locationId] = {
        backgroundImageId: null,
        description: '',
        interactions: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      this._saveData(data);
    }
    return data.scenes[locationId];
  },

  /**
   * 保存单个场景数据
   */
  _saveScene(locationId, scene) {
    const data = this._loadData();
    scene.updatedAt = Date.now();
    data.scenes[locationId] = scene;
    this._saveData(data);
  },

  // ============ 地图地点数据获取 ============

  /**
   * 从地图系统获取地点信息
   */
  _getLocationData(locationId) {
    try {
      const raw = localStorage.getItem(MapSystem?.STORAGE_KEY || 'exploration_map_v12');
      if (!raw) return null;
      const mapData = JSON.parse(raw);
      return mapData.locations?.find(l => l.id === locationId) || null;
    } catch (e) { return null; }
  },

  /**
   * 获取所有地点列表（用于场景管理）
   */
  getAllLocations() {
    try {
      const raw = localStorage.getItem(MapSystem?.STORAGE_KEY || 'exploration_map_v12');
      if (!raw) return [];
      const mapData = JSON.parse(raw);
      return mapData.locations || [];
    } catch (e) { return []; }
  },

  // ============ NPC在场状态 ============

  /**
   * 获取NPC列表（从NPCManager兼容读取）
   */
  _getAllNPCs() {
    if (window.NPCManager && typeof NPCManager.getNPCs === 'function') {
      return NPCManager.getNPCs();
    }
    // 兜底：直接从Storage读取
    try {
      const raw = localStorage.getItem('mj_npcs_v3') || localStorage.getItem('npcs_v3') || '[]';
      return JSON.parse(raw);
    } catch (e) { return []; }
  },

  /**
   * 获取在某地点的NPC列表
   * 优先匹配 npc.currentLocationId，其次匹配 address 字段与地点名称
   */
  getNPCsAtLocation(locationId) {
    const npcs = this._getAllNPCs();
    const loc = this._getLocationData(locationId);
    const locName = loc?.name || '';

    return npcs.filter(npc => {
      // 优先使用 currentLocationId 精确匹配
      if (npc.currentLocationId === locationId) return true;
      // 其次尝试用 address 字段模糊匹配地点名称
      if (locName && npc.address && npc.address.includes(locName)) return true;
      return false;
    });
  },

  /**
   * 设置NPC所在地点
   */
  setNPCLocation(npcId, locationId) {
    if (window.NPCManager && typeof NPCManager.updateNPC === 'function') {
      NPCManager.updateNPC(npcId, { currentLocationId: locationId });
      return;
    }
    // 兜底直接修改Storage
    try {
      const npcs = this._getAllNPCs();
      const idx = npcs.findIndex(n => n.id === npcId);
      if (idx !== -1) {
        npcs[idx].currentLocationId = locationId;
        npcs[idx].updatedAt = Date.now();
        localStorage.setItem('mj_npcs_v3', JSON.stringify(npcs));
      }
    } catch (e) { console.warn('设置NPC地点失败', e); }
  },

  // ============ 场景进入与渲染 ============

  /**
   * 进入场景：切换页面、加载背景、加载在场NPC
   * @param {string} locationId - 地点ID
   */
  enterScene(locationId) {
    const loc = this._getLocationData(locationId);
    if (!loc) {
      console.warn(`[SceneSystem] 地点 ${locationId} 不存在`);
      return;
    }

    this._currentLocationId = locationId;
    this._selectedNPCId = null;

    // 更新URL hash（支持浏览器前进后退）
    window.location.hash = `scene-location-${locationId}`;

    // 渲染场景覆盖层
    this._renderOverlay();
    this.renderScene(locationId);

    // 通知信息栏
    if (window.MapSystem && MapSystem._updateInfoBar) {
      MapSystem._updateInfoBar(`已进入场景：${loc.name}`);
    }
  },

  /**
   * 退出场景，返回地图
   */
  exitScene() {
    this._currentLocationId = null;
    this._selectedNPCId = null;
    this._removeOverlay();
    // 返回地图页
    if (window.App && typeof App.navigate === 'function') {
      App.navigate('map');
    } else {
      window.location.hash = 'map';
    }
  },

  /**
   * 渲染场景页面主方法
   * @param {string} locationId - 地点ID
   */
  renderScene(locationId) {
    const loc = this._getLocationData(locationId);
    if (!loc) return;

    const scene = this._getScene(locationId);
    const npcs = this.getNPCsAtLocation(locationId);

    // 获取背景图URL
    let bgUrl = '';
    if (scene.backgroundImageId) {
      bgUrl = this._resolveBackgroundUrl(scene.backgroundImageId);
    }

    const container = document.getElementById('sceneOverlayBody');
    if (!container) return;

    container.innerHTML = `
      <!-- 顶部：场景背景大图 -->
      <div class="scene-bg-area" id="sceneBgArea"
           style="${bgUrl ? `background-image:url('${bgUrl}');` : ''}
                  background-size:cover; background-position:center;">
        <div class="scene-bg-overlay"></div>
        <div class="scene-header">
          <h2 class="scene-title">${loc.name}</h2>
          <p class="scene-subtitle">${loc.description || '此地尚无描述…'}</p>
        </div>
        <button class="scene-exit-btn" onclick="SceneSystem.exitScene()" title="返回地图">✕</button>
        <button class="scene-bg-btn" onclick="SceneSystem.openBackgroundSelector()" title="更换背景">🖼️</button>
      </div>

      <!-- 中部：NPC翻牌子横排 -->
      <div class="scene-npc-bar">
        <div class="scene-npc-label">在场人物</div>
        <div class="scene-npc-list" id="sceneNPCList">
          ${this._renderNPCTiles(npcs)}
        </div>
        ${npcs.length === 0 ? `<div class="scene-npc-empty">此间无人，或可静待有缘人…</div>` : ''}
      </div>

      <!-- 底部：交互区域 -->
      <div class="scene-interaction-area" id="sceneInteractionArea">
        ${this._renderInteractionPanel(scene, npcs)}
      </div>
    `;

    // 绑定NPC头像点击事件
    this._bindNPCTileEvents();
  },

  /**
   * 渲染NPC头像瓷砖（翻牌子风格）
   */
  _renderNPCTiles(npcs) {
    if (!npcs || npcs.length === 0) return '';
    return npcs.map(npc => {
      const avatar = npc.portrait || npc.avatar || this.DEFAULT_AVATAR;
      const isSelected = this._selectedNPCId === npc.id;
      const isImage = avatar.startsWith('data:image') || avatar.startsWith('http');
      const avatarHtml = isImage
        ? `<img src="${avatar}" alt="${npc.name}" class="scene-npc-avatar-img" onerror="this.parentElement.innerHTML='${this.DEFAULT_AVATAR}'">`
        : `<span class="scene-npc-avatar-text">${avatar}</span>`;
      return `
        <div class="scene-npc-tile ${isSelected ? 'selected' : ''}" data-npc-id="${npc.id}" onclick="SceneSystem.selectNPC('${npc.id}')">
          <div class="scene-npc-avatar">${avatarHtml}</div>
          <div class="scene-npc-name">${npc.name || '无名'}</div>
        </div>
      `;
    }).join('');
  },

  /**
   * 渲染底部交互面板
   */
  _renderInteractionPanel(scene, npcs) {
    const selectedNPC = npcs.find(n => n.id === this._selectedNPCId);

    let content = '';
    if (selectedNPC) {
      content = `
        <div class="scene-chat-header">
          <span class="scene-chat-name">${selectedNPC.name}</span>
          <span class="scene-chat-tag">${selectedNPC.job || ''} ${selectedNPC.identity || ''}</span>
        </div>
        <div class="scene-chat-body" id="sceneChatBody">
          <div class="scene-chat-bubble system">
            <p>点击按钮与 <b>${selectedNPC.name}</b> 互动</p>
          </div>
        </div>
        <div class="scene-chat-actions">
          <button class="scene-action-btn" onclick="SceneSystem.startDialog('${selectedNPC.id}')">💬 对话</button>
          <button class="scene-action-btn" onclick="SceneSystem.observeNPC('${selectedNPC.id}')">👁️ 观察</button>
          <button class="scene-action-btn" onclick="SceneSystem.interactWithNPC('${selectedNPC.id}')">🤝 互动</button>
          <button class="scene-action-btn" onclick="SceneSystem.viewNPCDetail('${selectedNPC.id}')">📋 档案</button>
        </div>
      `;
    } else {
      content = `
        <div class="scene-ambient">
          <h4>🏛️ 场景交互</h4>
          <div class="scene-ambient-desc">
            ${scene.description || '你驻足于此，四周静谧无声…'}
          </div>
          <div class="scene-ambient-actions">
            <button class="scene-action-btn" onclick="SceneSystem.observeScene()">👁️ 观察四周</button>
            <button class="scene-action-btn" onclick="SceneSystem.editSceneDesc()">✏️ 编辑描述</button>
            ${scene.interactions.map((ia, i) => `
              <button class="scene-action-btn" onclick="SceneSystem.triggerInteraction(${i})">${ia.label}</button>
            `).join('')}
          </div>
        </div>
      `;
    }

    return content;
  },

  /**
   * 选中某个NPC进行对话
   */
  selectNPC(npcId) {
    this._selectedNPCId = npcId;
    const npcs = this.getNPCsAtLocation(this._currentLocationId);
    const scene = this._getScene(this._currentLocationId);

    // 更新头像选中态
    document.querySelectorAll('.scene-npc-tile').forEach(tile => {
      tile.classList.toggle('selected', tile.dataset.npcId === npcId);
    });

    // 更新交互区
    const area = document.getElementById('sceneInteractionArea');
    if (area) {
      area.innerHTML = this._renderInteractionPanel(scene, npcs);
    }
  },

  // ============ 场景交互方法 ============

  /**
   * 观察当前场景
   */
  observeScene() {
    const loc = this._getLocationData(this._currentLocationId);
    const scene = this._getScene(this._currentLocationId);
    const observations = [
      loc?.description || '此处风景寻常。',
      scene.description || '空气中弥漫着淡淡尘埃。',
      `你环顾${loc?.name || '四周'}，一切安然。`
    ];
    const text = observations.filter(Boolean).join('\n');
    this._showChatBubble('system', `<p style="white-space:pre-line">${text}</p>`);
  },

  /**
   * 编辑场景描述
   */
  editSceneDesc() {
    const scene = this._getScene(this._currentLocationId);
    const newDesc = prompt('编辑场景描述：', scene.description || '');
    if (newDesc !== null) {
      scene.description = newDesc;
      this._saveScene(this._currentLocationId, scene);
      this.renderScene(this._currentLocationId);
    }
  },

  /**
   * 与选中NPC开始对话
   */
  startDialog(npcId) {
    const npc = this._getAllNPCs().find(n => n.id === npcId);
    if (!npc) return;

    // 如果有 NovelRuntime 系统，尝试启动对话
    if (window.NovelRuntime && typeof NovelRuntime.startNPCChat === 'function') {
      NovelRuntime.startNPCChat(npcId, this._currentLocationId);
      return;
    }

    // 兜底：在场景内显示对话气泡
    const greetings = [
      `「${npc.name}」抬眼望来，微微颔首："客官有何吩咐？"`,
      `「${npc.name}」放下手中事务，缓步走近。`,
      `「${npc.name}」似乎正欲开口…`
    ];
    const text = greetings[Math.floor(Math.random() * greetings.length)];
    this._showChatBubble('npc', `<p>${text}</p>`);
  },

  /**
   * 观察NPC
   */
  observeNPC(npcId) {
    const npc = this._getAllNPCs().find(n => n.id === npcId);
    if (!npc) return;
    const desc = npc.appearance || npc.background || `${npc.name} 静立一旁，神态自若。`;
    this._showChatBubble('npc', `<p>你细细打量 ${npc.name}：<br>${desc}</p>`);
  },

  /**
   * 与NPC互动
   */
  interactWithNPC(npcId) {
    const npc = this._getAllNPCs().find(n => n.id === npcId);
    if (!npc) return;
    const actions = [
      `你与 ${npc.name} 寒暄了几句。`,
      `「${npc.name}」微微一笑，气氛融洽。`,
      `你向 ${npc.name} 点了点头，对方亦回礼。`
    ];
    const text = actions[Math.floor(Math.random() * actions.length)];
    this._showChatBubble('system', `<p>${text}</p>`);

    // 尝试增加好感度
    if (window.NPCManager && typeof NPCManager.updateNPC === 'function') {
      const currentFavor = parseInt(npc.affection || 50);
      NPCManager.updateNPC(npcId, { affection: Math.min(100, currentFavor + 1) });
    }
  },

  /**
   * 查看NPC详细档案
   */
  viewNPCDetail(npcId) {
    if (window.NPCManager && typeof NPCManager.viewNPC === 'function') {
      // 退出场景覆盖层，进入NPC详情页
      this._removeOverlay();
      NPCManager.viewNPC(npcId);
      if (window.App && typeof App.navigate === 'function') {
        App.navigate('npc');
      }
    } else {
      alert('NPC 档案系统未就绪');
    }
  },

  /**
   * 触发预设交互
   */
  triggerInteraction(index) {
    const scene = this._getScene(this._currentLocationId);
    const ia = scene.interactions[index];
    if (!ia) return;
    this._showChatBubble('system', `<p><b>${ia.label}</b><br>${ia.content}</p>`);
  },

  // ============ 背景图管理 ============

  /**
   * 设置场景背景图
   * @param {string} locationId - 地点ID
   * @param {string} imageId - 背景图ID（来自BackgroundLibrary）
   */
  setSceneBackground(locationId, imageId) {
    const scene = this._getScene(locationId);
    scene.backgroundImageId = imageId;
    this._saveScene(locationId, scene);

    if (this._currentLocationId === locationId) {
      const bgArea = document.getElementById('sceneBgArea');
      if (bgArea) {
        const url = this._resolveBackgroundUrl(imageId);
        if (url) bgArea.style.backgroundImage = `url('${url}')`;
      }
    }
  },

  /**
   * 打开背景选择器
   */
  openBackgroundSelector() {
    // 尝试从BackgroundLibrary获取背景列表
    let bgs = [];
    if (window.BackgroundLibrary && typeof BackgroundLibrary.getBackgrounds === 'function') {
      bgs = BackgroundLibrary.getBackgrounds();
    }
    // 兜底：从Storage读取
    if (bgs.length === 0) {
      try {
        const raw = localStorage.getItem('mj_backgrounds_v3') || '[]';
        bgs = JSON.parse(raw);
      } catch (e) { bgs = []; }
    }

    if (bgs.length === 0) {
      alert('背景库为空，请先前往「背景库」页面上传背景图');
      return;
    }

    // 构建选择弹窗HTML
    const bgGrid = bgs.map(bg => {
      const url = bg.url || bg.data || bg.src || '';
      const id = bg.id || bg.name || '';
      return `
        <div class="scene-bg-select-item" onclick="SceneSystem.setSceneBackground('${this._currentLocationId}', '${id}'); App.closeModal();">
          <div class="scene-bg-select-thumb" style="background-image:url('${url}');"></div>
          <div class="scene-bg-select-name">${bg.name || '未命名'}</div>
        </div>
      `;
    }).join('');

    if (window.App && typeof App.showModal === 'function') {
      App.showModal('🖼️ 选择场景背景', `
        <div class="scene-bg-select-grid">${bgGrid}</div>
      `, true);
    } else {
      // 兜底：简单的confirm选择
      const names = bgs.map((bg, i) => `${i + 1}. ${bg.name || '未命名'}`).join('\n');
      const choice = prompt(`选择背景（输入序号）：\n${names}`);
      const idx = parseInt(choice) - 1;
      if (idx >= 0 && idx < bgs.length) {
        this.setSceneBackground(this._currentLocationId, bgs[idx].id || bgs[idx].name);
      }
    }
  },

  /**
   * 解析背景图ID为可显示的URL
   */
  _resolveBackgroundUrl(imageId) {
    if (!imageId) return '';
    // 如果直接是dataURL或URL
    if (imageId.startsWith('data:image') || imageId.startsWith('http')) return imageId;

    // 尝试从BackgroundLibrary查找
    if (window.BackgroundLibrary && typeof BackgroundLibrary.getBackgrounds === 'function') {
      const bgs = BackgroundLibrary.getBackgrounds();
      const bg = bgs.find(b => (b.id || b.name) === imageId);
      if (bg) return bg.url || bg.data || bg.src || '';
    }

    // 尝试从Storage.dbGet读取
    if (window.Storage && typeof Storage.dbGet === 'function') {
      Storage.dbGet('images', imageId).then(img => {
        if (img && img.data) return img.data;
      });
    }

    return '';
  },

  // ============ 交互消息气泡 ============

  /**
   * 在聊天区域显示消息气泡
   * @param {string} type - 'system' | 'npc'
   * @param {string} html - 气泡HTML内容
   */
  _showChatBubble(type, html) {
    const body = document.getElementById('sceneChatBody');
    if (!body) return;
    const bubble = document.createElement('div');
    bubble.className = `scene-chat-bubble ${type}`;
    bubble.innerHTML = html;
    body.appendChild(bubble);
    body.scrollTop = body.scrollHeight;
  },

  // ============ DOM 覆盖层管理 ============

  /**
   * 渲染场景全屏覆盖层（不依赖index.html中预置page-scene）
   */
  _renderOverlay() {
    this._removeOverlay(); // 先清除旧覆盖层

    const overlay = document.createElement('div');
    overlay.id = 'sceneSystemOverlay';
    overlay.className = 'scene-overlay';
    overlay.innerHTML = `<div class="scene-overlay-body" id="sceneOverlayBody"></div>`;
    document.body.appendChild(overlay);
    this._overlayEl = overlay;

    // 注入场景专用样式（仅首次）
    if (!document.getElementById('scene-system-styles')) {
      const style = document.createElement('style');
      style.id = 'scene-system-styles';
      style.textContent = `
        .scene-overlay {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: ${this.COLORS.parchment}; z-index: 1000;
          display: flex; flex-direction: column;
          font-family: 'Noto Serif SC', serif;
        }
        .scene-overlay-body {
          flex: 1; display: flex; flex-direction: column; overflow: hidden;
        }
        /* 顶部背景区域 */
        .scene-bg-area {
          position: relative; height: 40vh; min-height: 220px;
          background-size: cover; background-position: center;
          transition: background-image 0.5s ease;
          display: flex; flex-direction: column; justify-content: flex-end;
          border-bottom: 2px solid ${this.COLORS.gold};
        }
        .scene-bg-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent 40%, rgba(44,24,16,0.6) 100%);
        }
        .scene-header {
          position: relative; z-index: 2;
          padding: 16px 20px 20px;
          color: #fff;
        }
        .scene-title {
          margin: 0; font-size: 28px; font-weight: 700;
          text-shadow: 0 2px 8px rgba(0,0,0,0.5); letter-spacing: 6px;
        }
        .scene-subtitle {
          margin: 6px 0 0; font-size: 14px; opacity: 0.9;
          text-shadow: 0 1px 4px rgba(0,0,0,0.5); line-height: 1.5;
          max-width: 600px;
        }
        .scene-exit-btn {
          position: absolute; top: 12px; right: 16px; z-index: 3;
          width: 36px; height: 36px; border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.4); background: rgba(44,24,16,0.5);
          color: #fff; font-size: 18px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(4px); transition: all 0.2s;
        }
        .scene-exit-btn:hover { background: rgba(201,162,39,0.6); border-color: ${this.COLORS.gold}; }
        .scene-bg-btn {
          position: absolute; top: 12px; right: 60px; z-index: 3;
          width: 36px; height: 36px; border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.4); background: rgba(44,24,16,0.5);
          color: #fff; font-size: 16px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(4px); transition: all 0.2s;
        }
        .scene-bg-btn:hover { background: rgba(201,162,39,0.6); border-color: ${this.COLORS.gold}; }

        /* NPC 横排 */
        .scene-npc-bar {
          background: ${this.COLORS.panelBg};
          border-bottom: 1px solid ${this.COLORS.gold};
          padding: 12px 16px;
          flex-shrink: 0;
        }
        .scene-npc-label {
          font-size: 12px; color: ${this.COLORS.inkMuted};
          margin-bottom: 8px; letter-spacing: 2px;
        }
        .scene-npc-list {
          display: flex; gap: 14px; overflow-x: auto;
          padding-bottom: 4px;
        }
        .scene-npc-list::-webkit-scrollbar { height: 4px; }
        .scene-npc-list::-webkit-scrollbar-thumb { background: ${this.COLORS.gold}; border-radius: 2px; }
        .scene-npc-tile {
          flex-shrink: 0; text-align: center; cursor: pointer;
          padding: 6px; border-radius: 8px;
          border: 2px solid transparent;
          transition: all 0.2s; min-width: 64px;
        }
        .scene-npc-tile:hover { background: rgba(201,162,39,0.1); }
        .scene-npc-tile.selected {
          border-color: ${this.COLORS.gold};
          background: rgba(201,162,39,0.15);
          box-shadow: 0 2px 8px rgba(201,162,39,0.2);
        }
        .scene-npc-avatar {
          width: 56px; height: 56px; border-radius: 50%;
          border: 2px solid ${this.COLORS.parchmentDark};
          overflow: hidden; margin: 0 auto 4px;
          background: ${this.COLORS.parchmentDark};
          display: flex; align-items: center; justify-content: center;
        }
        .scene-npc-avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .scene-npc-avatar-text { font-size: 28px; }
        .scene-npc-name { font-size: 12px; color: ${this.COLORS.ink}; white-space: nowrap; }
        .scene-npc-empty { font-size: 13px; color: ${this.COLORS.inkMuted}; font-style: italic; padding: 8px 0; }

        /* 底部交互区 */
        .scene-interaction-area {
          flex: 1; background: ${this.COLORS.parchment};
          padding: 16px 20px; overflow-y: auto;
          display: flex; flex-direction: column;
        }
        .scene-chat-header {
          display: flex; align-items: center; gap: 10px;
          padding-bottom: 10px; border-bottom: 1px solid ${this.COLORS.parchmentDark};
          margin-bottom: 10px;
        }
        .scene-chat-name { font-size: 18px; font-weight: 700; color: ${this.COLORS.ink}; }
        .scene-chat-tag { font-size: 12px; color: ${this.COLORS.gold}; }
        .scene-chat-body {
          flex: 1; overflow-y: auto; padding-right: 4px;
          margin-bottom: 12px;
        }
        .scene-chat-bubble {
          max-width: 80%; padding: 10px 14px; border-radius: 8px;
          margin-bottom: 8px; font-size: 14px; line-height: 1.6;
          animation: sceneFadeIn 0.3s ease;
        }
        .scene-chat-bubble.system {
          background: ${this.COLORS.panelBg};
          color: ${this.COLORS.inkLight};
          border: 1px solid ${this.COLORS.parchmentDark};
        }
        .scene-chat-bubble.npc {
          background: ${this.COLORS.ink};
          color: ${this.COLORS.parchment};
          border: 1px solid ${this.COLORS.gold};
        }
        .scene-chat-actions, .scene-ambient-actions {
          display: flex; gap: 8px; flex-wrap: wrap;
          padding-top: 8px; border-top: 1px solid ${this.COLORS.parchmentDark};
        }
        .scene-action-btn {
          padding: 8px 16px; border-radius: 6px;
          border: 1px solid ${this.COLORS.gold};
          background: transparent; color: ${this.COLORS.ink};
          font-family: inherit; font-size: 13px; cursor: pointer;
          transition: all 0.2s; letter-spacing: 1px;
        }
        .scene-action-btn:hover {
          background: ${this.COLORS.gold}; color: #fff;
        }
        .scene-ambient h4 {
          margin: 0 0 10px; font-size: 16px; color: ${this.COLORS.ink};
        }
        .scene-ambient-desc {
          font-size: 14px; color: ${this.COLORS.inkLight};
          line-height: 1.7; margin-bottom: 12px;
          background: ${this.COLORS.panelBg};
          padding: 12px; border-radius: 6px;
          border: 1px dashed ${this.COLORS.parchmentDark};
        }

        /* 背景选择器 */
        .scene-bg-select-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
          max-height: 400px; overflow-y: auto; padding: 4px;
        }
        .scene-bg-select-item {
          cursor: pointer; border: 2px solid transparent;
          border-radius: 6px; overflow: hidden;
          transition: all 0.2s; text-align: center;
        }
        .scene-bg-select-item:hover { border-color: ${this.COLORS.gold}; }
        .scene-bg-select-thumb {
          width: 100%; aspect-ratio: 16/9;
          background-size: cover; background-position: center;
          background-color: ${this.COLORS.parchmentDark};
        }
        .scene-bg-select-name {
          font-size: 12px; padding: 6px;
          color: ${this.COLORS.ink}; background: ${this.COLORS.panelBg};
        }

        @keyframes sceneFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }

    // 隐藏侧边栏，聚焦场景
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarBackdrop')?.classList.remove('show');
  },

  /**
   * 移除场景覆盖层
   */
  _removeOverlay() {
    const el = document.getElementById('sceneSystemOverlay');
    if (el) el.remove();
    this._overlayEl = null;
  },

  /**
   * 绑定NPC瓷砖事件（动态生成的元素需要事件委托）
   */
  _bindNPCTileEvents() {
    const list = document.getElementById('sceneNPCList');
    if (!list) return;
    // 点击事件已通过onclick内联绑定，此处留作扩展
  },

  // ============ 外部API：供地图系统调用 ============

  /**
   * 判断某地点是否已创建场景
   */
  hasScene(locationId) {
    const data = this._loadData();
    return !!data.scenes[locationId];
  },

  /**
   * 获取某地点的场景描述（快捷方法）
   */
  getSceneDescription(locationId) {
    const scene = this._getScene(locationId);
    return scene.description || '';
  },

  /**
   * 添加场景预设交互
   */
  addInteraction(locationId, label, content) {
    const scene = this._getScene(locationId);
    scene.interactions.push({ label, content });
    this._saveScene(locationId, scene);
  },

  /**
   * 移除场景覆盖层（供App路由切换时调用）
   */
  cleanup() {
    this._removeOverlay();
    this._currentLocationId = null;
    this._selectedNPCId = null;
  }
};

// 注册到App导航系统：当用户通过App.navigate('scene')进入时自动触发
// 实际通过hashchange监听处理 #scene-location-xxx 路由
if (typeof window !== 'undefined') {
  window.SceneSystem = SceneSystem;
}
