/**
 * =========================================================
 * Relationship Network v9 — 可交互关系图谱
 * 模块名：Relations
 * 功能：
 *   - Canvas交互式力导向图（拖拽节点、缩放画布、平移）
 *   - 点击节点查看角色详情面板
 *   - 关系连线动态渲染（粗细表示亲密度，颜色表示关系类型）
 *   - 右键菜单：添加关系/编辑角色/删除节点
 *   - 力导向布局自动排列
 *   - 支持关系方向箭头
 * =========================================================
 */
const Relations = {
  _canvas: null, _ctx: null, _dpr: 1,
  _nodes: [], _edges: [],
  _scale: 1, _offsetX: 0, _offsetY: 0,
  _isDragging: false, _dragNode: null, _hoverNode: null,
  _lastMouseX: 0, _lastMouseY: 0,
  _selectedNodeId: null,
  _isPanning: false,
  _animationId: null,

  RELATION_COLORS: {
    '爱慕': '#E91E63', '仇恨': '#F44336', '师徒': '#4A90C2',
    '朋友': '#8BC34A', '亲人': '#FF9800', '敌对': '#9E9E9E',
    '君臣': '#C9A227', '同门': '#9C27B0', ' default': '#C9A227'
  },

  init() { this.renderPage(); this._bindKeyboard(); },
  onEnter() { this._buildGraph(); this._startAnimation(); this.renderList(); },

  getRelations() { return Storage.get('npcRelations', []); },
  saveRelations(r) { Storage.set('npcRelations', r); },

  /* 构建图数据结构 */
  _buildGraph() {
    const npcs = (NPCManager?.getNPCs?.() || []);
    const rels = this.getRelations();
    this._nodes = npcs.map(n => ({
      id: n.id, name: n.name || '?', avatar: n.portraitId,
      x: 0, y: 0, vx: 0, vy: 0,
      radius: 32,
      color: n.gender === '女' ? 'rgba(233,30,99,0.15)' : 'rgba(74,144,194,0.15)',
      stroke: n.gender === '女' ? '#E91E63' : '#4A90C2',
      data: n
    }));
    this._edges = rels.map(r => ({
      id: r.id, from: r.from, to: r.to,
      type: r.type || '', description: r.description || '',
      strength: r.strength || 50,
      color: this.RELATION_COLORS[r.type] || this.RELATION_COLORS.default
    }));
    /* 初始环形布局 */
    const cx = 400, cy = 300;
    this._nodes.forEach((n, i) => {
      const angle = (i / Math.max(this._nodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
      const r = Math.min(200, this._nodes.length * 25);
      n.x = cx + Math.cos(angle) * r;
      n.y = cy + Math.sin(angle) * r;
    });
    this._offsetX = 0; this._offsetY = 0; this._scale = 1;
  },

  renderPage() {
    const page = document.getElementById('page-relations');
    if (!page) return;
    page.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:8px;">
        <h2 class="section-title">🔗 关系网</h2>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-sm btn-secondary" onclick="Relations.resetView()">🔍 重置视图</button>
          <button class="btn btn-sm btn-secondary" onclick="Relations.autoLayout()">🎯 自动布局</button>
          <button class="btn btn-primary" onclick="Relations.addRelation()">➕ 添加关系</button>
        </div>
      </div>

      <div style="display:flex;gap:var(--space-lg);flex-wrap:wrap;">
        <!-- 画布区域 -->
        <div style="flex:1;min-width:500px;position:relative;">
          <div style="position:relative;border:2px solid var(--border-gold);border-radius:var(--border-radius-lg);overflow:hidden;background:linear-gradient(135deg,#faf0e6,#f5e6d3);box-shadow:var(--shadow-lg);">
            <canvas id="relationCanvas" style="width:100%;height:500px;display:block;cursor:grab;"></canvas>
            <!-- 缩放控制 -->
            <div style="position:absolute;bottom:12px;right:12px;display:flex;flex-direction:column;gap:4px;">
              <button class="btn-icon" onclick="Relations.zoom(1.2)" style="width:28px;height:28px;font-size:14px;">+</button>
              <button class="btn-icon" onclick="Relations.zoom(0.8)" style="width:28px;height:28px;font-size:14px;">−</button>
              <button class="btn-icon" onclick="Relations.resetView()" style="width:28px;height:28px;font-size:12px;">⌂</button>
            </div>
            <!-- 提示 -->
            <div style="position:absolute;top:8px;left:8px;font-size:11px;color:var(--text-muted);background:rgba(255,255,255,0.7);padding:4px 8px;border-radius:4px;">
              拖拽移动 · 滚轮缩放 · 点击查看 · 右键菜单
            </div>
          </div>
        </div>

        <!-- 右侧详情面板 -->
        <div style="flex:0 0 300px;">
          <div id="nodeDetailPanel" class="card" style="display:none;position:sticky;top:var(--space-lg);">
            <div class="card-header"><h4 id="detailName">角色详情</h4></div>
            <div class="card-body" id="detailBody"></div>
          </div>
          <div id="relationLegend" class="card" style="margin-top:var(--space-md);">
            <div class="card-header"><h4 style="font-size:14px;">关系图例</h4></div>
            <div class="card-body" style="padding:var(--space-sm);">
              ${Object.entries(this.RELATION_COLORS).map(([type, color]) => type !== 'default' ? `
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;font-size:12px;">
                  <div style="width:20px;height:3px;background:${color};border-radius:2px;"></div>
                  <span>${type}</span>
                </div>
              ` : '').join('')}
            </div>
          </div>
        </div>
      </div>

      <h3 style="font-size:16px;margin:var(--space-lg) 0 var(--space-sm);">关系列表</h3>
      <div id="relationList"></div>

      <!-- 右键菜单 -->
      <div id="graphContextMenu" style="display:none;position:fixed;background:var(--bg-parchment);border:1px solid var(--border-gold);border-radius:var(--border-radius-sm);box-shadow:var(--shadow-lg);z-index:100;padding:4px 0;min-width:140px;">
        <div style="padding:6px 12px;font-size:13px;cursor:pointer;transition:background 0.15s;" onmouseenter="this.style.background='rgba(201,162,39,0.1)'" onmouseleave="this.style.background=''" onclick="Relations.ctxAddRelation()">➕ 添加关系</div>
        <div style="padding:6px 12px;font-size:13px;cursor:pointer;transition:background 0.15s;" onmouseenter="this.style.background='rgba(201,162,39,0.1)'" onmouseleave="this.style.background=''" onclick="Relations.ctxEditNode()">✏️ 编辑角色</div>
        <div style="padding:6px 12px;font-size:13px;cursor:pointer;transition:background 0.15s;" onmouseenter="this.style.background='rgba(201,162,39,0.1)'" onmouseleave="this.style.background=''" onclick="Relations.ctxTalkTo()">💬 开始对话</div>
        <div style="padding:6px 12px;font-size:13px;color:#8B3333;cursor:pointer;transition:background 0.15s;" onmouseenter="this.style.background='rgba(139,51,51,0.1)'" onmouseleave="this.style.background=''" onclick="Relations.ctxDeleteNode()">🗑️ 删除角色</div>
      </div>
    `;
    this._setupCanvas();
    this.renderList();
  },

  _setupCanvas() {
    this._canvas = document.getElementById('relationCanvas');
    if (!this._canvas) return;
    this._ctx = this._canvas.getContext('2d');
    this._dpr = window.devicePixelRatio || 1;
    this._resizeCanvas();
    window.addEventListener('resize', () => { this._resizeCanvas(); });

    const c = this._canvas;
    c.addEventListener('mousedown', e => this._onMouseDown(e));
    c.addEventListener('mousemove', e => this._onMouseMove(e));
    c.addEventListener('mouseup', e => this._onMouseUp(e));
    c.addEventListener('wheel', e => this._onWheel(e), { passive: false });
    c.addEventListener('contextmenu', e => { e.preventDefault(); this._onRightClick(e); });
    c.addEventListener('click', e => this._onClick(e));
    document.addEventListener('click', () => this._hideContextMenu());
  },

  _resizeCanvas() {
    if (!this._canvas) return;
    const rect = this._canvas.getBoundingClientRect();
    this._canvas.width = rect.width * this._dpr;
    this._canvas.height = rect.height * this._dpr;
    this._ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
  },

  _getMousePos(e) {
    const rect = this._canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - this._offsetX) / this._scale,
      y: (e.clientY - rect.top - this._offsetY) / this._scale
    };
  },

  _hitTest(x, y) {
    for (const node of this._nodes) {
      const dx = x - node.x, dy = y - node.y;
      if (dx * dx + dy * dy <= node.radius * node.radius) return node;
    }
    return null;
  },

  _onMouseDown(e) {
    const pos = this._getMousePos(e);
    const node = this._hitTest(pos.x, pos.y);
    if (node) {
      this._isDragging = true;
      this._dragNode = node;
      this._selectedNodeId = node.id;
      this._showNodeDetail(node);
    } else if (e.button === 0 || e.button === 1) {
      this._isPanning = true;
      this._lastMouseX = e.clientX;
      this._lastMouseY = e.clientY;
    }
    this._canvas.style.cursor = this._isDragging ? 'grabbing' : 'grabbing';
  },

  _onMouseMove(e) {
    if (this._isDragging && this._dragNode) {
      const pos = this._getMousePos(e);
      this._dragNode.x = pos.x;
      this._dragNode.y = pos.y;
      this._dragNode.vx = 0; this._dragNode.vy = 0;
    } else if (this._isPanning) {
      this._offsetX += e.clientX - this._lastMouseX;
      this._offsetY += e.clientY - this._lastMouseY;
      this._lastMouseX = e.clientX;
      this._lastMouseY = e.clientY;
    } else {
      const pos = this._getMousePos(e);
      const node = this._hitTest(pos.x, pos.y);
      this._hoverNode = node;
      this._canvas.style.cursor = node ? 'pointer' : 'grab';
    }
  },

  _onMouseUp() {
    this._isDragging = false;
    this._dragNode = null;
    this._isPanning = false;
    this._canvas.style.cursor = 'grab';
  },

  _onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    this.zoom(delta);
  },

  _onClick(e) {
    const pos = this._getMousePos(e);
    const node = this._hitTest(pos.x, pos.y);
    if (node) {
      this._selectedNodeId = node.id;
      this._showNodeDetail(node);
    }
  },

  _onRightClick(e) {
    const pos = this._getMousePos(e);
    const node = this._hitTest(pos.x, pos.y);
    this._selectedNodeId = node ? node.id : null;
    const menu = document.getElementById('graphContextMenu');
    if (!menu) return;
    menu.style.display = 'block';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
  },

  _hideContextMenu() {
    const menu = document.getElementById('graphContextMenu');
    if (menu) menu.style.display = 'none';
  },

  /* 右键菜单操作 */
  ctxAddRelation() {
    this._hideContextMenu();
    if (!this._selectedNodeId) return;
    const npcs = NPCManager?.getNPCs?.() || [];
    const from = npcs.find(n => n.id === this._selectedNodeId);
    if (!from) return;
    const toOpts = npcs.filter(n => n.id !== from.id).map(n => `<option value="${n.id}">${n.name}</option>`).join('');
    App.showModal('➕ 添加关系', `
      <div class="form-group"><label>从</label><input type="text" value="${from.name}" disabled></div>
      <div class="form-group"><label>关系类型</label>
        <select id="ctxRelType">
          ${Object.keys(this.RELATION_COLORS).filter(k => k !== 'default').map(t => `<option value="${t}">${t}</option>`).join('')}
          <option value="">自定义</option>
        </select>
      </div>
      <div class="form-group"><label>到</label><select id="ctxRelTo">${toOpts}</select></div>
      <div class="form-group"><label>亲密度(0-100)</label><input type="range" id="ctxRelStrength" min="0" max="100" value="50"></div>
      <div class="form-group"><label>描述</label><textarea id="ctxRelDesc" rows="2"></textarea></div>
      <button class="btn btn-primary" onclick="Relations.saveCtxRelation()">保存</button>
    `);
  },
  saveCtxRelation() {
    const type = document.getElementById('ctxRelType').value;
    const to = document.getElementById('ctxRelTo').value;
    const strength = parseInt(document.getElementById('ctxRelStrength').value) || 50;
    const desc = document.getElementById('ctxRelDesc').value;
    const rels = this.getRelations();
    rels.push({ id: 'rel_' + Date.now(), from: this._selectedNodeId, to, type, strength, description: desc });
    this.saveRelations(rels);
    this._buildGraph(); App.closeModal(); this.renderList();
    App.toast('关系已添加', 'success');
  },
  ctxEditNode() { this._hideContextMenu(); NPCManager?.editNPC?.(this._selectedNodeId); },
  ctxTalkTo() { this._hideContextMenu(); const id = this._selectedNodeId; App.navigate('runtime'); setTimeout(() => NovelRuntime?.selectNPC?.(id), 300); },
  ctxDeleteNode() {
    this._hideContextMenu();
    if (!confirm('删除此角色及其所有关系？')) return;
    const npcs = NPCManager?.getNPCs?.() || [];
    NPCManager?.saveNPCs?.(npcs.filter(n => n.id !== this._selectedNodeId));
    const rels = this.getRelations().filter(r => r.from !== this._selectedNodeId && r.to !== this._selectedNodeId);
    this.saveRelations(rels);
    this._buildGraph(); this.renderList();
    App.toast('角色已删除', 'success');
  },

  /* 力导向布局 */
  _applyForces() {
    const k = 200; /* 弹簧常数 */
    const repulsion = 5000;
    const damping = 0.85;
    const centerX = 400, centerY = 250;

    /* 节点间斥力 */
    for (let i = 0; i < this._nodes.length; i++) {
      for (let j = i + 1; j < this._nodes.length; j++) {
        const a = this._nodes[i], b = this._nodes[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsion / (dist * dist);
        const fx = (dx / dist) * force, fy = (dy / dist) * force;
        a.vx -= fx; a.vy -= fy; b.vx += fx; b.vy += fy;
      }
    }

    /* 连线引力 */
    for (const edge of this._edges) {
      const from = this._nodes.find(n => n.id === edge.from);
      const to = this._nodes.find(n => n.id === edge.to);
      if (!from || !to) continue;
      const dx = to.x - from.x, dy = to.y - from.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const targetDist = 150 + (100 - edge.strength);
      const force = (dist - targetDist) * 0.01;
      const fx = (dx / dist) * force, fy = (dy / dist) * force;
      from.vx += fx; from.vy += fy; to.vx -= fx; to.vy -= fy;
    }

    /* 中心引力 */
    for (const node of this._nodes) {
      node.vx += (centerX - node.x) * 0.001;
      node.vy += (centerY - node.y) * 0.001;
      node.vx *= damping; node.vy *= damping;
      if (!this._isDragging || this._dragNode !== node) {
        node.x += node.vx; node.y += node.vy;
      }
    }
  },

  _renderFrame() {
    if (!this._ctx || !this._canvas) return;
    const w = this._canvas.width / this._dpr;
    const h = this._canvas.height / this._dpr;
    this._ctx.clearRect(0, 0, w, h);

    this._ctx.save();
    this._ctx.translate(this._offsetX, this._offsetY);
    this._ctx.scale(this._scale, this._scale);

    /* 绘制连线 */
    for (const edge of this._edges) {
      const from = this._nodes.find(n => n.id === edge.from);
      const to = this._nodes.find(n => n.id === edge.to);
      if (!from || !to) continue;
      this._ctx.beginPath();
      this._ctx.moveTo(from.x, from.y);
      this._ctx.lineTo(to.x, to.y);
      this._ctx.strokeStyle = edge.color || this.RELATION_COLORS.default;
      this._ctx.lineWidth = Math.max(1, edge.strength / 25);
      this._ctx.globalAlpha = 0.6;
      this._ctx.stroke();
      this._ctx.globalAlpha = 1;

      /* 中点标签 */
      const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2;
      this._ctx.fillStyle = edge.color;
      this._ctx.font = '11px var(--font-main)';
      this._ctx.textAlign = 'center';
      this._ctx.textBaseline = 'middle';
      const bw = this._ctx.measureText(edge.type).width + 8;
      this._ctx.fillStyle = 'rgba(250,240,230,0.85)';
      this._ctx.fillRect(mx - bw/2, my - 8, bw, 16);
      this._ctx.fillStyle = edge.color;
      this._ctx.fillText(edge.type, mx, my);
    }

    /* 绘制节点 */
    for (const node of this._nodes) {
      const isHover = this._hoverNode === node;
      const isSelected = this._selectedNodeId === node.id;
      const r = node.radius + (isHover ? 4 : 0);

      /* 光晕 */
      if (isSelected || isHover) {
        this._ctx.beginPath();
        this._ctx.arc(node.x, node.y, r + 8, 0, Math.PI * 2);
        this._ctx.fillStyle = isSelected ? 'rgba(201,162,39,0.2)' : 'rgba(201,162,39,0.1)';
        this._ctx.fill();
      }

      /* 节点圆 */
      this._ctx.beginPath();
      this._ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      this._ctx.fillStyle = node.color;
      this._ctx.fill();
      this._ctx.strokeStyle = isSelected ? '#C9A227' : node.stroke;
      this._ctx.lineWidth = isSelected ? 3 : 2;
      this._ctx.stroke();

      /* 头像或首字 */
      if (node.avatar) {
        /* 简单圆形裁剪显示 */
        this._ctx.beginPath();
        this._ctx.arc(node.x, node.y, r - 4, 0, Math.PI * 2);
        this._ctx.clip();
        this._ctx.drawImage(node.avatar, node.x - r + 4, node.y - r + 4, (r - 4) * 2, (r - 4) * 2);
        this._ctx.beginPath(); this._ctx.rect(0, 0, 9999, 9999); this._ctx.clip();
      } else {
        this._ctx.fillStyle = node.stroke;
        this._ctx.font = 'bold 14px var(--font-display)';
        this._ctx.textAlign = 'center';
        this._ctx.textBaseline = 'middle';
        this._ctx.fillText(node.name[0] || '?', node.x, node.y);
      }

      /* 名字标签 */
      this._ctx.fillStyle = 'var(--color-ink)';
      this._ctx.font = '12px var(--font-main)';
      this._ctx.textAlign = 'center';
      this._ctx.fillText(node.name, node.x, node.y + r + 14);
    }

    this._ctx.restore();
    this._applyForces();
    this._animationId = requestAnimationFrame(() => this._renderFrame());
  },

  _startAnimation() {
    if (this._animationId) cancelAnimationFrame(this._animationId);
    this._renderFrame();
  },

  _showNodeDetail(node) {
    const panel = document.getElementById('nodeDetailPanel');
    const name = document.getElementById('detailName');
    const body = document.getElementById('detailBody');
    if (!panel || !body) return;
    panel.style.display = 'block';
    name.textContent = node.name;

    const npc = node.data;
    const connected = this._edges.filter(e => e.from === node.id || e.to === node.id);
    body.innerHTML = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <span class="tag" style="background:${node.stroke};color:#fff;">${npc.gender || '?'}</span>
        <span class="tag tag-secondary">${npc.age || '?'}</span>
        <span class="tag tag-secondary">${npc.job || '?'}</span>
      </div>
      <div style="font-size:13px;color:var(--text-secondary);line-height:1.8;margin-bottom:12px;">
        ${npc.personality ? `<p><strong>性格：</strong>${npc.personality.substring(0, 60)}${npc.personality.length > 60 ? '...' : ''}</p>` : ''}
        ${npc.background ? `<p><strong>背景：</strong>${npc.background.substring(0, 60)}${npc.background.length > 60 ? '...' : ''}</p>` : ''}
      </div>
      <div style="border-top:1px solid var(--border-color);padding-top:12px;">
        <h5 style="font-size:13px;margin-bottom:8px;color:var(--text-muted);">关系 (${connected.length})</h5>
        ${connected.map(e => {
          const otherId = e.from === node.id ? e.to : e.from;
          const other = this._nodes.find(n => n.id === otherId);
          return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;font-size:12px;">
            <div style="width:8px;height:8px;border-radius:50%;background:${e.color};"></div>
            <span>${e.type}</span>
            <strong>${other?.name || '?'}</strong>
            <span style="color:var(--text-muted);">(${e.strength || 50})</span>
          </div>`;
        }).join('') || '<p style="color:var(--text-muted);font-size:12px;">暂无关系</p>'}
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button class="btn btn-sm btn-primary" onclick="NPCManager.editNPC('${node.id}')">编辑</button>
        <button class="btn btn-sm btn-secondary" onclick="NovelRuntime.selectNPC('${node.id}');App.navigate('runtime')">对话</button>
      </div>
    `;
  },

  zoom(factor) {
    const oldScale = this._scale;
    this._scale = Math.max(0.3, Math.min(3, this._scale * factor));
    /* 以画布中心为缩放原点 */
    const rect = this._canvas.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height / 2;
    this._offsetX = cx - (cx - this._offsetX) * (this._scale / oldScale);
    this._offsetY = cy - (cy - this._offsetY) * (this._scale / oldScale);
  },

  resetView() { this._scale = 1; this._offsetX = 0; this._offsetY = 0; },
  autoLayout() { this._buildGraph(); },

  _bindKeyboard() {
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this._hideContextMenu();
    });
  },

  /* 原有列表功能 */
  renderList() {
    const c = document.getElementById('relationList');
    if (!c) return;
    const rels = this.getRelations();
    const npcs = NPCManager?.getNPCs?.() || [];
    if (rels.length === 0) { c.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">暂无关系，点击"添加关系"或右键节点</p>'; return; }
    c.innerHTML = rels.map(r => {
      const from = npcs.find(n => n.id === r.from);
      const to = npcs.find(n => n.id === r.to);
      const color = this.RELATION_COLORS[r.type] || this.RELATION_COLORS.default;
      return `<div class="list-item" style="border-left:3px solid ${color};">
        <div class="list-info" style="flex:1;">
          <h4 style="font-size:14px;">${from?.name || '?'} <span style="color:${color};">${r.type || '关系'}</span> ${to?.name || '?'}</h4>
          <p style="font-size:12px;color:var(--text-muted);">${r.description || ''} ${r.strength ? `· 亲密度 ${r.strength}` : ''}</p>
        </div>
        <button class="btn btn-sm btn-danger" onclick="Relations.deleteRelation('${r.id}')">🗑️</button>
      </div>`;
    }).join('') || '<p style="color:var(--text-muted);">暂无关系</p>';
  },

  addRelation() { this._selectedNodeId = null; this.ctxAddRelation(); },
  deleteRelation(id) {
    if (!confirm('删除此关系？')) return;
    this.saveRelations(this.getRelations().filter(r => r.id !== id));
    this._buildGraph(); this.renderList();
  }
};
