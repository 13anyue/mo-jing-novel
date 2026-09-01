/**
 * =========================================================
 * StoryTreeEditor v1 — 剧情分支树可视化编辑器
 * 古风墨境风格 · 纯DOM实现 · 支持6种节点类型
 * =========================================================
 * 
 * 功能：
 *   - 6种节点：对话/选择/条件/跳转/场景/CG
 *   - 拖拽画布 + 节点拖拽定位
 *   - SVG连线 + 贝塞尔曲线
 *   - 节点属性面板（右侧面板）
 *   - 左侧工具栏（节点类型选择）
 *   - 多分支树管理（CRUD + 导入导出）
 *   - 移动端适配（列表视图 + 简化编辑）
 * 
 * 数据结构：
 *   tree = {
 *     id, name, description, createdAt, updatedAt,
 *     nodes: [{ id, type, x, y, data, connections: [targetId] }],
 *     startNodeId
 *   }
 */
const StoryTreeEditor = {
  /* === 配置 === */
  NODE_TYPES: [
    { key: 'dialog', label: '对话', icon: '💬', color: '#8B4513', desc: 'NPC对话文本' },
    { key: 'choice', label: '选择', icon: '🔀', color: '#C9A227', desc: '玩家选项分支' },
    { key: 'condition', label: '条件', icon: '⚖️', color: '#6B8E23', desc: '属性/好感度判断' },
    { key: 'jump', label: '跳转', icon: '↗️', color: '#4682B4', desc: '跳转到其他节点' },
    { key: 'scene', label: '场景', icon: '🏞️', color: '#9370DB', desc: '切换背景/音乐' },
    { key: 'cg', label: 'CG', icon: '🖼️', color: '#D2691E', desc: '显示CG插画' }
  ],

  GRID_SIZE: 20,
  CANVAS_WIDTH: 3000,
  CANVAS_HEIGHT: 2000,

  /* === 状态 === */
  _trees: [],
  _currentTree: null,
  _selectedNode: null,
  _connectingFrom: null,
  _draggingNode: null,
  _dragOffset: { x: 0, y: 0 },
  _panOffset: { x: 0, y: 0 },
  _isPanning: false,
  _scale: 1,
  _viewMode: 'canvas', // 'canvas' | 'list' (mobile)

  /* === 初始化 === */
  init() { this.loadTrees(); },

  /* === 数据持久化 === */
  loadTrees() {
    try { this._trees = Storage.get('storyTrees_v8', []); }
    catch(e) { this._trees = []; console.warn('[StoryTree] 加载失败:', e); }
  },
  saveTrees() {
    try { Storage.set('storyTrees_v8', this._trees); }
    catch(e) { console.warn('[StoryTree] 保存失败:', e); }
  },

  /* === 分支树CRUD === */
  createTree(name = '未命名分支树') {
    const tree = {
      id: 'tree_' + Date.now(),
      name,
      description: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      nodes: [],
      startNodeId: null
    };
    // 自动创建起始节点
    const startNode = this._createNode('dialog', 400, 300, { text: '故事开始...', speaker: '' });
    tree.nodes.push(startNode);
    tree.startNodeId = startNode.id;
    this._trees.push(tree);
    this.saveTrees();
    return tree;
  },

  deleteTree(id) {
    if (!confirm('确定删除此分支树？所有节点数据将丢失！')) return false;
    this._trees = this._trees.filter(t => t.id !== id);
    if (this._currentTree && this._currentTree.id === id) {
      this._currentTree = null;
      this._selectedNode = null;
    }
    this.saveTrees();
    App.toast('分支树已删除', 'success');
    return true;
  },

  duplicateTree(id) {
    const tree = this._trees.find(t => t.id === id);
    if (!tree) return null;
    const copy = JSON.parse(JSON.stringify(tree));
    copy.id = 'tree_' + Date.now();
    copy.name = tree.name + ' (副本)';
    copy.createdAt = Date.now();
    copy.updatedAt = Date.now();
    // 重新生成所有节点ID，避免冲突
    const idMap = {};
    copy.nodes.forEach(n => {
      const oldId = n.id;
      n.id = 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      idMap[oldId] = n.id;
    });
    // 更新连接关系
    copy.nodes.forEach(n => {
      if (n.connections) n.connections = n.connections.map(c => idMap[c] || c);
    });
    copy.startNodeId = idMap[copy.startNodeId] || copy.startNodeId;
    this._trees.push(copy);
    this.saveTrees();
    App.toast('分支树已复制', 'success');
    return copy;
  },

  renameTree(id, newName) {
    const tree = this._trees.find(t => t.id === id);
    if (!tree || !newName.trim()) return false;
    tree.name = newName.trim();
    tree.updatedAt = Date.now();
    this.saveTrees();
    return true;
  },

  exportTree(id) {
    const tree = this._trees.find(t => t.id === id);
    if (!tree) return;
    const blob = new Blob([JSON.stringify(tree, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${tree.name}_分支树.json`; a.click();
    URL.revokeObjectURL(url);
    App.toast('分支树已导出', 'success');
  },

  async importTree(file) {
    try {
      const text = await file.text();
      const tree = JSON.parse(text);
      if (!tree.nodes || !Array.isArray(tree.nodes)) {
        App.toast('文件格式不正确', 'error'); return;
      }
      tree.id = 'tree_' + Date.now();
      tree.name = (tree.name || '导入的分支树').replace(/\.json$/i, '');
      tree.createdAt = Date.now();
      tree.updatedAt = Date.now();
      this._trees.push(tree);
      this.saveTrees();
      App.toast('分支树已导入', 'success');
      this.renderEditor();
    } catch(e) { App.toast('导入失败：' + e.message, 'error'); }
  },

  /* === 节点操作 === */
  _createNode(type, x, y, data = {}) {
    const typeInfo = this.NODE_TYPES.find(t => t.key === type) || this.NODE_TYPES[0];
    return {
      id: 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      type,
      x, y,
      data: {
        name: typeInfo.label + '节点',
        text: '',
        speaker: '',
        backgroundId: '',
        musicId: '',
        portraitId: '',
        cgId: '',
        condition: { stat: 'affection', operator: '>', value: 50 },
        choices: [{ text: '选项1', targetId: '' }, { text: '选项2', targetId: '' }],
        targetId: '', // 跳转节点目标
        tags: [],
        notes: '',
        ...data
      },
      connections: []
    };
  },

  addNode(type, x, y) {
    if (!this._currentTree) return null;
    const node = this._createNode(type, x, y);
    this._currentTree.nodes.push(node);
    this._currentTree.updatedAt = Date.now();
    this.saveTrees();
    this._renderNode(node);
    this._renderConnections();
    this.selectNode(node.id);
    return node;
  },

  deleteNode(id) {
    if (!this._currentTree) return;
    const idx = this._currentTree.nodes.findIndex(n => n.id === id);
    if (idx === -1) return;
    // 不能删除起始节点且是唯一节点
    if (this._currentTree.nodes.length === 1) {
      App.toast('至少保留一个节点', 'warning'); return;
    }
    // 删除节点
    this._currentTree.nodes.splice(idx, 1);
    // 清理其他节点对该节点的连接
    this._currentTree.nodes.forEach(n => {
      n.connections = n.connections.filter(c => c !== id);
      // 清理选择节点的targetId
      if (n.data.choices) {
        n.data.choices.forEach(c => { if (c.targetId === id) c.targetId = ''; });
      }
      if (n.data.targetId === id) n.data.targetId = '';
    });
    if (this._currentTree.startNodeId === id) {
      this._currentTree.startNodeId = this._currentTree.nodes[0]?.id || null;
    }
    this._currentTree.updatedAt = Date.now();
    this.saveTrees();
    if (this._selectedNode && this._selectedNode.id === id) this._selectedNode = null;
    this._renderAllNodes();
    this._renderConnections();
    this._renderPropertiesPanel();
  },

  updateNodeData(id, newData) {
    if (!this._currentTree) return;
    const node = this._currentTree.nodes.find(n => n.id === id);
    if (!node) return;
    node.data = { ...node.data, ...newData };
    this._currentTree.updatedAt = Date.now();
    this.saveTrees();
    this._updateNodeVisual(node);
  },

  moveNode(id, x, y) {
    if (!this._currentTree) return;
    const node = this._currentTree.nodes.find(n => n.id === id);
    if (!node) return;
    node.x = Math.max(60, Math.min(this.CANVAS_WIDTH - 60, x));
    node.y = Math.max(40, Math.min(this.CANVAS_HEIGHT - 40, y));
    this._currentTree.updatedAt = Date.now();
    this.saveTrees();
    this._updateNodePosition(node);
    this._renderConnections();
  },

  connectNodes(fromId, toId) {
    if (!this._currentTree || fromId === toId) return false;
    const fromNode = this._currentTree.nodes.find(n => n.id === fromId);
    if (!fromNode) return false;
    if (!fromNode.connections.includes(toId)) {
      fromNode.connections.push(toId);
      this._currentTree.updatedAt = Date.now();
      this.saveTrees();
      this._renderConnections();
      return true;
    }
    return false;
  },

  disconnectNodes(fromId, toId) {
    if (!this._currentTree) return;
    const fromNode = this._currentTree.nodes.find(n => n.id === fromId);
    if (!fromNode) return;
    fromNode.connections = fromNode.connections.filter(c => c !== toId);
    // 清理choice的targetId
    if (fromNode.data.choices) {
      fromNode.data.choices.forEach(c => { if (c.targetId === toId) c.targetId = ''; });
    }
    this._currentTree.updatedAt = Date.now();
    this.saveTrees();
    this._renderConnections();
  },

  /* === 选择与高亮 === */
  selectNode(id) {
    if (!this._currentTree) return;
    const node = this._currentTree.nodes.find(n => n.id === id);
    this._selectedNode = node || null;
    // 更新视觉高亮
    document.querySelectorAll('.st-node').forEach(el => el.classList.remove('st-selected'));
    if (node) {
      const el = document.getElementById('st_node_' + node.id);
      if (el) el.classList.add('st-selected');
    }
    this._renderPropertiesPanel();
  },

  /* === 页面渲染：编辑器 === */
  renderPage() {
    const page = document.getElementById('page-storytree');
    if (!page) return;
    if (!this._currentTree) {
      page.innerHTML = this._renderTreeList();
      return;
    }
    page.innerHTML = this._renderEditor();
    this._initEditorEvents();
    this._renderAllNodes();
    this._renderConnections();
    this._renderPropertiesPanel();
  },

  /* --- 分支树列表页 --- */
  _renderTreeList() {
    const trees = this._trees;
    return `
      <div class="st-tree-list">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
          <h2 class="section-title">🌳 剧情分支树</h2>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="StoryTreeEditor.createNewTreePrompt()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 新建分支树
            </button>
            <label class="btn btn-secondary" style="cursor:pointer;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> 导入
              <input type="file" accept=".json" style="display:none;" onchange="StoryTreeEditor.importTree(this.files[0])">
            </label>
          </div>
        </div>
        ${trees.length === 0 ? `
          <div class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1" style="opacity:0.4;margin-bottom:16px;"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            <p>还没有剧情分支树</p>
            <p style="font-size:13px;color:var(--text-muted);margin-top:8px;">点击「新建分支树」开始创作你的故事吧</p>
          </div>
        ` : `
          <div class="card-grid">
            ${trees.map(t => `
              <div class="card story-tree-card" style="cursor:pointer;" onclick="StoryTreeEditor.openTree('${t.id}')">
                <div class="card-header">
                  <h3 style="font-family:'Noto Serif SC',serif;font-size:16px;">${this._escapeHtml(t.name)}</h3>
                  <span class="badge">${t.nodes.length} 节点</span>
                </div>
                <div class="card-body">
                  <p style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">${this._escapeHtml(t.description || '暂无描述')}</p>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
                    ${t.nodes.slice(0, 5).map(n => {
                      const ti = this.NODE_TYPES.find(x => x.key === n.type);
                      return `<span style="font-size:11px;padding:2px 6px;border-radius:4px;background:${ti ? ti.color + '20' : '#eee'};color:${ti ? ti.color : '#666'};">${ti ? ti.label : n.type}</span>`;
                    }).join('')}
                    ${t.nodes.length > 5 ? `<span style="font-size:11px;color:var(--text-muted);">+${t.nodes.length - 5}</span>` : ''}
                  </div>
                  <p style="font-size:11px;color:var(--text-muted);">更新于 ${this._formatDate(t.updatedAt)}</p>
                </div>
                <div class="card-footer" style="display:flex;gap:6px;justify-content:flex-end;" onclick="event.stopPropagation();">
                  <button class="btn btn-sm btn-secondary" onclick="StoryTreeEditor.renameTreePrompt('${t.id}')">重命名</button>
                  <button class="btn btn-sm btn-secondary" onclick="StoryTreeEditor.duplicateTree('${t.id}');event.stopPropagation();">复制</button>
                  <button class="btn btn-sm btn-secondary" onclick="StoryTreeEditor.exportTree('${t.id}');event.stopPropagation();">导出</button>
                  <button class="btn btn-sm btn-danger" onclick="StoryTreeEditor.deleteTree('${t.id}');event.stopPropagation();">删除</button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  /* --- 编辑器主界面 --- */
  _renderEditor() {
    const tree = this._currentTree;
    const isMobile = window.innerWidth < 768;
    return `
      <div class="st-editor" id="stEditor">
        <!-- 顶部工具栏 -->
        <div class="st-editor-header">
          <div style="display:flex;align-items:center;gap:12px;">
            <button class="btn btn-sm btn-secondary" onclick="StoryTreeEditor.closeEditor()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg> 返回列表
            </button>
            <h3 style="font-family:'Noto Serif SC',serif;font-size:18px;color:var(--color-primary-dark);margin:0;">${this._escapeHtml(tree.name)}</h3>
            <span class="badge">${tree.nodes.length} 节点</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-sm btn-secondary" onclick="StoryTreeEditor.saveCurrentTree()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg> 保存
            </button>
            <button class="btn btn-sm btn-secondary" onclick="StoryTreeEditor.exportTree('${tree.id}')">导出</button>
            <button class="btn btn-sm btn-gold" onclick="StoryTreeEditor.testRunTree()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> 试运行
            </button>
          </div>
        </div>

        <!-- 主体：左侧工具栏 + 中间画布 + 右侧面板 -->
        <div class="st-editor-body">
          <!-- 左侧节点工具栏 -->
          <div class="st-toolbar" id="stToolbar">
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;padding:0 4px;">节点类型</div>
            ${this.NODE_TYPES.map(t => `
              <div class="st-tool-item" draggable="true" data-type="${t.key}" title="${t.desc}">
                <div class="st-tool-icon" style="background:${t.color}20;color:${t.color};">${t.label[0]}</div>
                <span class="st-tool-label">${t.label}</span>
              </div>
            `).join('')}
            <div style="border-top:1px solid var(--border-color);margin:12px 0;padding-top:8px;">
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;padding:0 4px;">操作</div>
              <button class="st-tool-btn" onclick="StoryTreeEditor.setConnectMode()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg> 连线
              </button>
              <button class="st-tool-btn" onclick="StoryTreeEditor.setSelectMode()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg> 选择
              </button>
              <button class="st-tool-btn" onclick="StoryTreeEditor.deleteSelectedNode()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg> 删除
              </button>
            </div>
          </div>

          <!-- 中间画布 -->
          <div class="st-canvas-wrapper" id="stCanvasWrapper">
            <div class="st-canvas" id="stCanvas" style="width:${this.CANVAS_WIDTH}px;height:${this.CANVAS_HEIGHT}px;">
              <!-- SVG连线层 -->
              <svg class="st-connections" id="stConnections" width="100%" height="100%">
                <defs>
                  <marker id="stArrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#C9A227" opacity="0.7"/>
                  </marker>
                </defs>
              </svg>
              <!-- 节点层 -->
              <div class="st-nodes-layer" id="stNodesLayer"></div>
              <!-- 网格背景 -->
              <div class="st-grid" id="stGrid"></div>
            </div>
            <!-- 画布控制 -->
            <div class="st-canvas-controls">
              <button class="st-canvas-btn" onclick="StoryTreeEditor.zoomIn()" title="放大">+</button>
              <button class="st-canvas-btn" onclick="StoryTreeEditor.zoomOut()" title="缩小">−</button>
              <button class="st-canvas-btn" onclick="StoryTreeEditor.resetView()" title="重置">⌂</button>
              <span class="st-zoom-label" id="stZoomLabel">100%</span>
            </div>
          </div>

          <!-- 右侧属性面板 -->
          <div class="st-properties" id="stProperties">
            <div style="font-size:12px;color:var(--text-muted);padding:12px 16px;border-bottom:1px solid var(--border-color);">
              ${this._selectedNode ? '节点属性' : '属性面板'}
            </div>
            <div id="stPropertiesContent" style="padding:16px;">
              <p style="color:var(--text-muted);font-size:13px;text-align:center;">点击节点编辑属性</p>
            </div>
          </div>
        </div>
      </div>

      <style>
        /* ===== StoryTreeEditor v1 Styles ===== */
        .st-tree-list { padding: var(--space-md); }
        .story-tree-card { transition: transform 0.2s, box-shadow 0.2s; }
        .story-tree-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }

        .st-editor { display: flex; flex-direction: column; height: calc(100vh - 60px); }
        .st-editor-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 20px;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-card);
          flex-shrink: 0;
          gap: 12px;
          flex-wrap: wrap;
        }
        .st-editor-body {
          display: flex; flex: 1; overflow: hidden;
        }

        /* 左侧工具栏 */
        .st-toolbar {
          width: 140px; flex-shrink: 0;
          background: var(--bg-card);
          border-right: 1px solid var(--border-color);
          padding: 16px 10px;
          overflow-y: auto;
        }
        .st-tool-item {
          display: flex; align-items: center; gap: 8px;
          padding: 8px; margin-bottom: 4px;
          border-radius: var(--border-radius-sm);
          cursor: grab;
          transition: all 0.2s;
        }
        .st-tool-item:hover { background: rgba(201,162,39,0.1); }
        .st-tool-item:active { cursor: grabbing; }
        .st-tool-icon {
          width: 28px; height: 28px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 600;
          flex-shrink: 0;
        }
        .st-tool-label { font-size: 12px; color: var(--text-primary); }
        .st-tool-btn {
          display: flex; align-items: center; gap: 6px;
          width: 100%; padding: 8px;
          background: none; border: none;
          border-radius: var(--border-radius-sm);
          color: var(--text-primary); font-size: 12px;
          cursor: pointer; transition: all 0.2s;
        }
        .st-tool-btn:hover { background: rgba(201,162,39,0.1); }

        /* 中间画布 */
        .st-canvas-wrapper {
          flex: 1; position: relative;
          overflow: hidden;
          background: var(--bg-body);
          cursor: grab;
        }
        .st-canvas-wrapper:active { cursor: grabbing; }
        .st-canvas {
          position: absolute;
          background: var(--bg-body);
          transform-origin: 0 0;
          transition: transform 0.1s;
        }
        .st-grid {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background-image:
            linear-gradient(rgba(201,162,39,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,162,39,0.06) 1px, transparent 1px);
          background-size: 20px 20px;
          pointer-events: none;
        }
        .st-connections {
          position: absolute; top: 0; left: 0;
          pointer-events: none;
          z-index: 1;
        }
        .st-nodes-layer {
          position: absolute; top: 0; left: 0;
          z-index: 2;
        }
        .st-canvas-controls {
          position: absolute; bottom: 16px; right: 16px;
          display: flex; flex-direction: column; gap: 4px;
          z-index: 10;
        }
        .st-canvas-btn {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 16px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
        }
        .st-canvas-btn:hover { background: rgba(201,162,39,0.15); border-color: var(--color-gold); }
        .st-zoom-label {
          text-align: center; font-size: 11px;
          color: var(--text-muted); margin-top: 4px;
        }

        /* 节点卡片 */
        .st-node {
          position: absolute;
          width: 160px;
          background: linear-gradient(135deg, #FFF8F0, #F5E6D3);
          border: 2px solid var(--border-color);
          border-radius: 12px;
          padding: 10px 12px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(44,24,16,0.08);
          user-select: none;
          z-index: 3;
        }
        .st-node:hover {
          box-shadow: 0 4px 16px rgba(44,24,16,0.15);
          transform: translateY(-2px);
        }
        .st-node.st-selected {
          border-color: #C9A227;
          box-shadow: 0 0 20px rgba(201,162,39,0.3), 0 4px 16px rgba(44,24,16,0.15);
        }
        .st-node.st-start {
          border-color: #C9A227;
          border-width: 3px;
        }
        .st-node-header {
          display: flex; align-items: center; gap: 6px;
          margin-bottom: 6px;
        }
        .st-node-badge {
          width: 18px; height: 18px; border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 600; color: #fff;
          flex-shrink: 0;
        }
        .st-node-title {
          font-size: 13px; font-weight: 600;
          font-family: 'Noto Serif SC', serif;
          color: var(--color-primary-dark);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .st-node-body {
          font-size: 11px; color: var(--text-muted);
          line-height: 1.5;
          overflow: hidden;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
        }
        .st-node-ports {
          position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%);
          display: flex; gap: 4px;
        }
        .st-port {
          width: 12px; height: 12px; border-radius: 50%;
          background: var(--color-gold); border: 2px solid #fff;
          cursor: crosshair; transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .st-port:hover { transform: scale(1.3); }

        /* 连线 */
        .st-connection {
          fill: none;
          stroke: #C9A227;
          stroke-width: 2;
          opacity: 0.6;
          marker-end: url(#stArrowhead);
          transition: opacity 0.2s;
        }
        .st-connection:hover { opacity: 1; stroke-width: 3; }

        /* 右侧面板 */
        .st-properties {
          width: 280px; flex-shrink: 0;
          background: var(--bg-card);
          border-left: 1px solid var(--border-color);
          overflow-y: auto;
        }

        /* 移动端适配 */
        @media (max-width: 768px) {
          .st-toolbar { width: 100px; padding: 10px 6px; }
          .st-tool-label { display: none; }
          .st-properties { width: 200px; }
          .st-node { width: 130px; padding: 8px 10px; }
        }
      </style>
    `;
  },

  /* === 节点渲染 === */
  _renderAllNodes() {
    const layer = document.getElementById('stNodesLayer');
    if (!layer || !this._currentTree) return;
    layer.innerHTML = '';
    this._currentTree.nodes.forEach(node => this._renderNode(node));
  },

  _renderNode(node) {
    const layer = document.getElementById('stNodesLayer');
    if (!layer) return;
    const typeInfo = this.NODE_TYPES.find(t => t.key === node.type) || this.NODE_TYPES[0];
    const isStart = this._currentTree && this._currentTree.startNodeId === node.id;
    const isSelected = this._selectedNode && this._selectedNode.id === node.id;

    const el = document.createElement('div');
    el.id = 'st_node_' + node.id;
    el.className = `st-node ${isStart ? 'st-start' : ''} ${isSelected ? 'st-selected' : ''}`;
    el.style.left = node.x + 'px';
    el.style.top = node.y + 'px';
    el.dataset.nodeId = node.id;

    el.innerHTML = `
      <div class="st-node-header">
        <div class="st-node-badge" style="background:${typeInfo.color};">${typeInfo.label[0]}</div>
        <div class="st-node-title">${this._escapeHtml(node.data.name || typeInfo.label)}</div>
      </div>
      <div class="st-node-body">${this._escapeHtml(node.data.text || '').substring(0, 50)}${(node.data.text || '').length > 50 ? '...' : ''}</div>
      <div class="st-node-ports">
        <div class="st-port" data-node-id="${node.id}" title="拖动连接"></div>
      </div>
    `;

    // 节点点击选择
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('st-port')) return;
      this.selectNode(node.id);
    });

    // 节点拖拽
    el.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('st-port')) {
        // 开始连线
        this._connectingFrom = node.id;
        return;
      }
      this._draggingNode = node.id;
      const rect = el.getBoundingClientRect();
      const canvasRect = document.getElementById('stCanvas').getBoundingClientRect();
      this._dragOffset = {
        x: (e.clientX - canvasRect.left) / this._scale - node.x,
        y: (e.clientY - canvasRect.top) / this._scale - node.y
      };
      e.stopPropagation();
    });

    layer.appendChild(el);
  },

  _updateNodeVisual(node) {
    const el = document.getElementById('st_node_' + node.id);
    if (!el) return;
    const typeInfo = this.NODE_TYPES.find(t => t.key === node.type) || this.NODE_TYPES[0];
    const titleEl = el.querySelector('.st-node-title');
    const bodyEl = el.querySelector('.st-node-body');
    const badgeEl = el.querySelector('.st-node-badge');
    if (titleEl) titleEl.textContent = this._escapeHtml(node.data.name || typeInfo.label);
    if (bodyEl) bodyEl.textContent = this._escapeHtml(node.data.text || '').substring(0, 50) + ((node.data.text || '').length > 50 ? '...' : '');
    if (badgeEl) badgeEl.style.background = typeInfo.color;
  },

  _updateNodePosition(node) {
    const el = document.getElementById('st_node_' + node.id);
    if (el) { el.style.left = node.x + 'px'; el.style.top = node.y + 'px'; }
  },

  /* === 连线渲染 === */
  _renderConnections() {
    const svg = document.getElementById('stConnections');
    if (!svg || !this._currentTree) return;
    // 清除旧连线
    while (svg.lastChild && svg.lastChild.tagName !== 'defs') {
      svg.removeChild(svg.lastChild);
    }

    this._currentTree.nodes.forEach(fromNode => {
      if (!fromNode.connections || fromNode.connections.length === 0) return;
      fromNode.connections.forEach(toId => {
        const toNode = this._currentTree.nodes.find(n => n.id === toId);
        if (!toNode) return;
        this._drawConnection(svg, fromNode, toNode);
      });
    });
  },

  _drawConnection(svg, fromNode, toNode) {
    const fromX = fromNode.x + 80; // 节点中心x
    const fromY = fromNode.y + 55; // 节点底部y
    const toX = toNode.x + 80;
    const toY = toNode.y + 10;

    // 贝塞尔曲线控制点
    const c1x = fromX;
    const c1y = fromY + 40;
    const c2x = toX;
    const c2y = toY - 40;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${fromX} ${fromY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${toX} ${toY}`);
    path.setAttribute('class', 'st-connection');
    path.dataset.from = fromNode.id;
    path.dataset.to = toNode.id;
    svg.appendChild(path);
  },

  /* === 属性面板 === */
  _renderPropertiesPanel() {
    const container = document.getElementById('stPropertiesContent');
    if (!container) return;

    if (!this._selectedNode) {
      container.innerHTML = `
        <div style="text-align:center;color:var(--text-muted);padding:40px 20px;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1" style="opacity:0.4;margin-bottom:12px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          <p style="font-size:13px;">点击画布上的节点<br>编辑其属性</p>
        </div>
      `;
      return;
    }

    const node = this._selectedNode;
    const typeInfo = this.NODE_TYPES.find(t => t.key === node.type);
    const npcs = (typeof NPCManager !== 'undefined' && NPCManager.getNPCs) ? NPCManager.getNPCs() : [];
    const bgs = (typeof BackgroundLibrary !== 'undefined' && BackgroundLibrary.getBackgrounds) ? BackgroundLibrary.getBackgrounds() : [];
    const musics = (typeof MusicManager !== 'undefined' && MusicManager.getTracks) ? MusicManager.getTracks() : [];
    const cgs = (typeof CGGallery !== 'undefined' && CGGallery.getCGs) ? CGGallery.getCGs() : [];

    let extraFields = '';

    // 根据节点类型渲染额外字段
    if (node.type === 'dialog') {
      extraFields = `
        <div class="form-group"><label>对话文本</label><textarea id="stNodeText" rows="4" onchange="StoryTreeEditor._saveNodeProp('text',this.value)">${this._escapeHtml(node.data.text || '')}</textarea></div>
        <div class="form-group"><label>说话人</label>
          <select id="stNodeSpeaker" onchange="StoryTreeEditor._saveNodeProp('speaker',this.value)">
            <option value="">（旁白/无）</option>
            ${npcs.map(n => `<option value="${this._escapeHtml(n.name)}" ${node.data.speaker === n.name ? 'selected' : ''}>${this._escapeHtml(n.name)}</option>`).join('')}
          </select>
        </div>
      `;
    } else if (node.type === 'choice') {
      extraFields = `
        <div class="form-group"><label>选项设置</label>
          <div id="stChoicesList">
            ${(node.data.choices || []).map((ch, i) => `
              <div style="display:flex;gap:6px;margin-bottom:8px;align-items:center;">
                <input type="text" value="${this._escapeHtml(ch.text || '')}" placeholder="选项文本" onchange="StoryTreeEditor._saveChoice(${i},'text',this.value)" style="flex:1;">
                <select onchange="StoryTreeEditor._saveChoice(${i},'targetId',this.value)" style="flex:1;">
                  <option value="">（选择目标节点）</option>
                  ${this._currentTree.nodes.filter(n => n.id !== node.id).map(n => `<option value="${n.id}" ${ch.targetId === n.id ? 'selected' : ''}>${this._escapeHtml(n.data.name || n.type)}</option>`).join('')}
                </select>
                <button class="btn btn-sm btn-danger" onclick="StoryTreeEditor._removeChoice(${i})" style="padding:4px 8px;">×</button>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-sm btn-secondary" onclick="StoryTreeEditor._addChoice()" style="margin-top:8px;">+ 添加选项</button>
        </div>
      `;
    } else if (node.type === 'condition') {
      const stats = [
        { key: 'affection', label: '好感度' },
        { key: 'integrity', label: '清廉' },
        { key: 'ambition', label: '野心' },
        { key: 'favor', label: '恩宠' },
        { key: 'money', label: '金钱' }
      ];
      const cond = node.data.condition || { stat: 'affection', operator: '>', value: 50 };
      extraFields = `
        <div class="form-group"><label>判断条件</label>
          <div style="display:flex;gap:8px;align-items:center;">
            <select id="stCondStat" onchange="StoryTreeEditor._saveCondition()" style="flex:1;">
              ${stats.map(s => `<option value="${s.key}" ${cond.stat === s.key ? 'selected' : ''}>${s.label}</option>`).join('')}
            </select>
            <select id="stCondOp" onchange="StoryTreeEditor._saveCondition()" style="width:80px;">
              <option value=">" ${cond.operator === '>' ? 'selected' : ''}>大于</option>
              <option value=">=" ${cond.operator === '>=' ? 'selected' : ''}>大于等于</option>
              <option value="=" ${cond.operator === '=' ? 'selected' : ''}>等于</option>
              <option value="<=" ${cond.operator === '<=' ? 'selected' : ''}>小于等于</option>
              <option value="<" ${cond.operator === '<' ? 'selected' : ''}>小于</option>
            </select>
            <input type="number" id="stCondValue" value="${cond.value}" onchange="StoryTreeEditor._saveCondition()" style="width:70px;">
          </div>
        </div>
        <div class="form-group"><label>满足时跳转到</label>
          <select id="stCondTrueTarget" onchange="StoryTreeEditor._saveNodeProp('conditionTrueTarget',this.value)">
            <option value="">（选择节点）</option>
            ${this._currentTree.nodes.filter(n => n.id !== node.id).map(n => `<option value="${n.id}" ${node.data.conditionTrueTarget === n.id ? 'selected' : ''}>${this._escapeHtml(n.data.name || n.type)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>不满足时跳转到</label>
          <select id="stCondFalseTarget" onchange="StoryTreeEditor._saveNodeProp('conditionFalseTarget',this.value)">
            <option value="">（选择节点）</option>
            ${this._currentTree.nodes.filter(n => n.id !== node.id).map(n => `<option value="${n.id}" ${node.data.conditionFalseTarget === n.id ? 'selected' : ''}>${this._escapeHtml(n.data.name || n.type)}</option>`).join('')}
          </select>
        </div>
      `;
    } else if (node.type === 'jump') {
      extraFields = `
        <div class="form-group"><label>跳转到节点</label>
          <select id="stJumpTarget" onchange="StoryTreeEditor._saveNodeProp('targetId',this.value)">
            <option value="">（选择目标节点）</option>
            ${this._currentTree.nodes.filter(n => n.id !== node.id).map(n => `<option value="${n.id}" ${node.data.targetId === n.id ? 'selected' : ''}>${this._escapeHtml(n.data.name || n.type)}</option>`).join('')}
          </select>
        </div>
      `;
    } else if (node.type === 'scene') {
      extraFields = `
        <div class="form-group"><label>切换背景</label>
          <select id="stSceneBg" onchange="StoryTreeEditor._saveNodeProp('backgroundId',this.value)">
            <option value="">（保持当前）</option>
            ${bgs.map(b => `<option value="${b.id}" ${node.data.backgroundId === b.id ? 'selected' : ''}>${this._escapeHtml(b.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>切换音乐</label>
          <select id="stSceneMusic" onchange="StoryTreeEditor._saveNodeProp('musicId',this.value)">
            <option value="">（保持当前）</option>
            ${musics.map(m => `<option value="${m.id}" ${node.data.musicId === m.id ? 'selected' : ''}>${this._escapeHtml(m.name || m.title || '未命名')}</option>`).join('')}
          </select>
        </div>
      `;
    } else if (node.type === 'cg') {
      extraFields = `
        <div class="form-group"><label>显示CG</label>
          <select id="stCGSelect" onchange="StoryTreeEditor._saveNodeProp('cgId',this.value)">
            <option value="">（选择CG）</option>
            ${cgs.map(c => `<option value="${c.id}" ${node.data.cgId === c.id ? 'selected' : ''}>${this._escapeHtml(c.title || c.name || '未命名')}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>CG显示文本</label><input type="text" id="stCGText" value="${this._escapeHtml(node.data.text || '')}" onchange="StoryTreeEditor._saveNodeProp('text',this.value)"></div>
      `;
    }

    container.innerHTML = `
      <div style="margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
          <div class="st-node-badge" style="background:${typeInfo.color};width:22px;height:22px;font-size:11px;">${typeInfo.label[0]}</div>
          <span style="font-size:14px;font-weight:600;color:var(--color-primary-dark);">${typeInfo.label}节点</span>
        </div>
        <div class="form-group"><label>节点名称</label><input type="text" id="stNodeName" value="${this._escapeHtml(node.data.name || '')}" onchange="StoryTreeEditor._saveNodeProp('name',this.value)"></div>
        ${extraFields}
        <div class="form-group"><label>备注</label><textarea id="stNodeNotes" rows="2" onchange="StoryTreeEditor._saveNodeProp('notes',this.value)">${this._escapeHtml(node.data.notes || '')}</textarea></div>
        <div style="display:flex;gap:8px;margin-top:16px;">
          <button class="btn btn-sm btn-secondary" onclick="StoryTreeEditor.setAsStartNode()">设为起始</button>
          <button class="btn btn-sm btn-danger" onclick="StoryTreeEditor.deleteNode('${node.id}')">删除节点</button>
        </div>
      </div>
    `;
  },

  /* === 属性保存辅助 === */
  _saveNodeProp(key, value) {
    if (!this._selectedNode) return;
    this.updateNodeData(this._selectedNode.id, { [key]: value });
    this._updateNodeVisual(this._selectedNode);
  },

  _saveChoice(index, key, value) {
    if (!this._selectedNode || !this._selectedNode.data.choices) return;
    this._selectedNode.data.choices[index][key] = value;
    this._currentTree.updatedAt = Date.now();
    this.saveTrees();
    this._renderConnections();
  },

  _addChoice() {
    if (!this._selectedNode) return;
    if (!this._selectedNode.data.choices) this._selectedNode.data.choices = [];
    this._selectedNode.data.choices.push({ text: '新选项', targetId: '' });
    this._currentTree.updatedAt = Date.now();
    this.saveTrees();
    this._renderPropertiesPanel();
  },

  _removeChoice(index) {
    if (!this._selectedNode || !this._selectedNode.data.choices) return;
    this._selectedNode.data.choices.splice(index, 1);
    this._currentTree.updatedAt = Date.now();
    this.saveTrees();
    this._renderPropertiesPanel();
  },

  _saveCondition() {
    const stat = document.getElementById('stCondStat')?.value || 'affection';
    const operator = document.getElementById('stCondOp')?.value || '>';
    const value = parseInt(document.getElementById('stCondValue')?.value) || 0;
    this._saveNodeProp('condition', { stat, operator, value });
  },

  setAsStartNode() {
    if (!this._selectedNode || !this._currentTree) return;
    this._currentTree.startNodeId = this._selectedNode.id;
    this._currentTree.updatedAt = Date.now();
    this.saveTrees();
    // 更新视觉
    document.querySelectorAll('.st-node').forEach(el => el.classList.remove('st-start'));
    const el = document.getElementById('st_node_' + this._selectedNode.id);
    if (el) el.classList.add('st-start');
    App.toast('已设为起始节点', 'success');
  },

  /* === 编辑器事件初始化 === */
  _initEditorEvents() {
    const wrapper = document.getElementById('stCanvasWrapper');
    const canvas = document.getElementById('stCanvas');
    if (!wrapper || !canvas) return;

    // 画布拖拽（平移）
    wrapper.addEventListener('mousedown', (e) => {
      if (e.target === wrapper || e.target.classList.contains('st-grid')) {
        this._isPanning = true;
        this._panStart = { x: e.clientX - this._panOffset.x, y: e.clientY - this._panOffset.y };
        wrapper.style.cursor = 'grabbing';
      }
    });

    // 鼠标移动（拖拽节点或平移画布）
    document.addEventListener('mousemove', (e) => {
      if (this._draggingNode && this._currentTree) {
        const canvasRect = canvas.getBoundingClientRect();
        const x = (e.clientX - canvasRect.left) / this._scale - this._dragOffset.x;
        const y = (e.clientY - canvasRect.top) / this._scale - this._dragOffset.y;
        this.moveNode(this._draggingNode, x, y);
      } else if (this._isPanning) {
        this._panOffset = {
          x: e.clientX - this._panStart.x,
          y: e.clientY - this._panStart.y
        };
        this._applyTransform();
      }
    });

    // 鼠标释放
    document.addEventListener('mouseup', (e) => {
      if (this._draggingNode) {
        this._draggingNode = null;
      }
      if (this._isPanning) {
        this._isPanning = false;
        wrapper.style.cursor = 'grab';
      }
      // 连线结束
      if (this._connectingFrom) {
        // 检查是否释放到另一个节点的port上
        const targetEl = e.target.closest('.st-node');
        if (targetEl) {
          const targetId = targetEl.dataset.nodeId;
          if (targetId && targetId !== this._connectingFrom) {
            this.connectNodes(this._connectingFrom, targetId);
          }
        }
        this._connectingFrom = null;
      }
    });

    // 画布点击（空白处取消选择）
    wrapper.addEventListener('click', (e) => {
      if (e.target === wrapper || e.target.classList.contains('st-grid')) {
        this.selectNode(null);
      }
    });

    // 滚轮缩放
    wrapper.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      this._scale = Math.max(0.3, Math.min(2.0, this._scale + delta));
      this._applyTransform();
    }, { passive: false });

    // 工具栏拖拽创建节点
    document.querySelectorAll('.st-tool-item').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('nodeType', item.dataset.type);
      });
    });

    canvas.addEventListener('dragover', (e) => e.preventDefault());
    canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('nodeType');
      if (type) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this._scale;
        const y = (e.clientY - rect.top) / this._scale;
        this.addNode(type, x, y);
      }
    });
  },

  _applyTransform() {
    const canvas = document.getElementById('stCanvas');
    const label = document.getElementById('stZoomLabel');
    if (canvas) {
      canvas.style.transform = `translate(${this._panOffset.x}px, ${this._panOffset.y}px) scale(${this._scale})`;
    }
    if (label) {
      label.textContent = Math.round(this._scale * 100) + '%';
    }
  },

  /* === 画布控制 === */
  zoomIn() { this._scale = Math.min(2.0, this._scale + 0.2); this._applyTransform(); },
  zoomOut() { this._scale = Math.max(0.3, this._scale - 0.2); this._applyTransform(); },
  resetView() { this._scale = 1; this._panOffset = { x: 0, y: 0 }; this._applyTransform(); },

  /* === 工具栏操作 === */
  setConnectMode() { App.toast('点击节点底部的圆点并拖动到另一节点以创建连接', 'info'); },
  setSelectMode() { /* 默认就是选择模式 */ },
  deleteSelectedNode() {
    if (this._selectedNode) this.deleteNode(this._selectedNode.id);
    else App.toast('请先选择一个节点', 'warning');
  },

  /* === 页面跳转 === */
  openTree(id) {
    const tree = this._trees.find(t => t.id === id);
    if (!tree) return;
    this._currentTree = tree;
    this._selectedNode = null;
    this._scale = 1;
    this._panOffset = { x: 0, y: 0 };
    this.renderPage();
  },

  closeEditor() {
    this._currentTree = null;
    this._selectedNode = null;
    this.renderPage();
  },

  createNewTreePrompt() {
    const name = prompt('请输入分支树名称：', '新分支树');
    if (name && name.trim()) {
      const tree = this.createTree(name.trim());
      this.openTree(tree.id);
    }
  },

  renameTreePrompt(id) {
    const tree = this._trees.find(t => t.id === id);
    if (!tree) return;
    const name = prompt('新名称：', tree.name);
    if (name && name.trim()) {
      this.renameTree(id, name.trim());
      this.renderPage();
    }
  },

  saveCurrentTree() {
    if (this._currentTree) {
      this._currentTree.updatedAt = Date.now();
      this.saveTrees();
      App.toast('分支树已保存', 'success');
    }
  },

  /* === 试运行 === */
  testRunTree() {
    if (!this._currentTree) return;
    if (!this._currentTree.startNodeId) {
      App.toast('请先设置起始节点', 'warning'); return;
    }
    // 保存到临时存储，让运行时加载
    try { Storage.set('storyTree_testRun', this._currentTree); } catch(e) {}
    App.toast('正在启动试运行...', 'info');
    // 导航到运行时页面并加载分支树
    if (typeof StoryTreeRuntime !== 'undefined') {
      StoryTreeRuntime.loadTree(this._currentTree);
      App.navigate('runtime');
    } else {
      App.toast('运行时模块未加载', 'error');
    }
  },

  /* === 工具函数 === */
  _escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },
  _formatDate(ts) {
    if (!ts) return '--';
    const d = new Date(ts);
    return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
  }
};

// 全局暴露
window.StoryTreeEditor = StoryTreeEditor;
