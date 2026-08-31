/**
 * =========================================================
 * ChapterEditor v6 — 简易章节/剧本编辑器
 * 模块名：ChapterEditor
 * 功能：可视化编辑剧情章节，节点关系管理，测试播放
 * 支持：创建章节（标题、场景、背景、NPC、对话内容）
 * 章节类型：主线 / 支线 / 日常 / 隐藏
 * 与 StorylineSystem 配合使用
 * =========================================================
 */
const ChapterEditor = {
  /**
   * 章节类型定义
   */
  CHAPTER_TYPES: [
    { id: 'main', name: '主线', color: '#C9A227', icon: '⭐', desc: '核心剧情，推动故事发展' },
    { id: 'branch', name: '支线', color: '#4A90C2', icon: '🌿', desc: '角色专属剧情' },
    { id: 'daily', name: '日常', color: '#6B8E23', icon: '🌸', desc: '轻松日常，增进感情' },
    { id: 'hidden', name: '隐藏', color: '#9C27B0', icon: '🔮', desc: '特殊条件解锁' }
  ],

  /**
   * 节点类型定义
   */
  NODE_TYPES: [
    { id: 'dialogue', name: '对话', icon: '💬', desc: '角色对话节点' },
    { id: 'choice', name: '选择', icon: '🔀', desc: '分支选择节点' },
    { id: 'action', name: '动作', icon: '⚡', desc: '描述性动作或旁白' },
    { id: 'scene', name: '场景', icon: '🏞️', desc: '场景切换节点' },
    { id: 'condition', name: '条件', icon: '❓', desc: '条件判断节点' },
    { id: 'reward', name: '奖励', icon: '🎁', desc: '发放奖励节点' }
  ],

  _currentStoryId: null,
  _currentChapterId: null,
  _editingNodes: [],

  /**
   * 初始化模块
   */
  init() {
    this.renderPage();
  },

  /**
   * 进入页面时刷新
   */
  onEnter() {
    this.renderStoryList();
    this._currentStoryId = null;
    this._currentChapterId = null;
    this._editingNodes = [];
  },

  /**
   * 从Storage读取编辑器数据
   */
  _getData() {
    return Storage.get('chapter_editor_v7', { stories: [] });
  },

  /**
   * 保存编辑器数据到Storage
   */
  _saveData(data) {
    Storage.set('chapter_editor_v7', data);
  },

  getStories() {
    return this._getData().stories || [];
  },

  getStory(id) {
    return this.getStories().find(s => s.id === id);
  },

  getChapter(storyId, chapterId) {
    const story = this.getStory(storyId);
    if (!story) return null;
    return story.chapters?.find(c => c.id === chapterId);
  },

  /**
   * 创建新故事线
   */
  createStory(title, type, description) {
    const data = this._getData();
    const story = {
      id: 'story_editor_' + Date.now(),
      title: title || '未命名故事',
      type: type || 'main',
      description: description || '',
      chapters: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    data.stories.push(story);
    this._saveData(data);
    this.renderStoryList();
    App.toast(`故事线已创建：${story.title}`, 'success');
    return story;
  },

  /**
   * 删除故事线
   */
  deleteStory(storyId) {
    if (!confirm('确定要删除这个故事线及其所有章节吗？')) return;
    const data = this._getData();
    data.stories = data.stories.filter(s => s.id !== storyId);
    this._saveData(data);
    if (this._currentStoryId === storyId) {
      this._currentStoryId = null;
      this._currentChapterId = null;
    }
    this.renderStoryList();
    App.toast('故事线已删除', 'info');
  },

  /**
   * 创建章节
   */
  createChapter(storyId, title, type, description) {
    const data = this._getData();
    const story = data.stories.find(s => s.id === storyId);
    if (!story) {
      App.toast('故事线不存在', 'error');
      return null;
    }
    const chapter = {
      id: 'ch_editor_' + Date.now(),
      title: title || '未命名章节',
      type: type || story.type || 'main',
      description: description || '',
      background: '',
      npcs: [],
      nodes: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    story.chapters.push(chapter);
    story.updatedAt = Date.now();
    this._saveData(data);
    this.renderChapterList(storyId);
    App.toast(`章节已创建：${chapter.title}`, 'success');
    return chapter;
  },

  /**
   * 删除章节
   */
  deleteChapter(storyId, chapterId) {
    if (!confirm('确定要删除此章节吗？')) return;
    const data = this._getData();
    const story = data.stories.find(s => s.id === storyId);
    if (!story) return;
    story.chapters = story.chapters.filter(c => c.id !== chapterId);
    story.updatedAt = Date.now();
    this._saveData(data);
    if (this._currentChapterId === chapterId) {
      this._currentChapterId = null;
      this._editingNodes = [];
    }
    this.renderChapterList(storyId);
    App.toast('章节已删除', 'info');
  },

  /**
   * 编辑章节内容（设置背景、NPC等）
   */
  editChapter(storyId, chapterId, updates) {
    const data = this._getData();
    const story = data.stories.find(s => s.id === storyId);
    if (!story) return;
    const chapter = story.chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    Object.assign(chapter, updates);
    chapter.updatedAt = Date.now();
    story.updatedAt = Date.now();
    this._saveData(data);
    App.toast('章节已更新', 'success');
  },

  /**
   * 添加节点到章节
   */
  addNode(storyId, chapterId, nodeType, content, options) {
    const data = this._getData();
    const story = data.stories.find(s => s.id === storyId);
    if (!story) return null;
    const chapter = story.chapters.find(c => c.id === chapterId);
    if (!chapter) return null;

    const node = {
      id: 'node_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
      type: nodeType,
      content: content || '',
      speaker: options?.speaker || '',
      background: options?.background || '',
      choices: options?.choices || [],
      nextNodeId: options?.nextNodeId || '',
      condition: options?.condition || '',
      reward: options?.reward || '',
      createdAt: Date.now()
    };

    chapter.nodes.push(node);
    chapter.updatedAt = Date.now();
    story.updatedAt = Date.now();
    this._saveData(data);

    if (this._currentStoryId === storyId && this._currentChapterId === chapterId) {
      this._editingNodes = chapter.nodes;
      this.renderNodeEditor();
    }

    App.toast(`已添加${this.NODE_TYPES.find(n => n.id === nodeType)?.name || '节点'}`, 'success');
    return node;
  },

  /**
   * 删除节点
   */
  deleteNode(storyId, chapterId, nodeId) {
    const data = this._getData();
    const story = data.stories.find(s => s.id === storyId);
    if (!story) return;
    const chapter = story.chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    chapter.nodes = chapter.nodes.filter(n => n.id !== nodeId);
    chapter.updatedAt = Date.now();
    this._saveData(data);

    if (this._currentStoryId === storyId && this._currentChapterId === chapterId) {
      this._editingNodes = chapter.nodes;
      this.renderNodeEditor();
    }
    App.toast('节点已删除', 'info');
  },

  /**
   * 更新节点内容
   */
  updateNode(storyId, chapterId, nodeId, updates) {
    const data = this._getData();
    const story = data.stories.find(s => s.id === storyId);
    if (!story) return;
    const chapter = story.chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    const node = chapter.nodes.find(n => n.id === nodeId);
    if (!node) return;
    Object.assign(node, updates);
    chapter.updatedAt = Date.now();
    this._saveData(data);

    if (this._currentStoryId === storyId && this._currentChapterId === chapterId) {
      this._editingNodes = chapter.nodes;
      this.renderNodeEditor();
    }
  },

  /**
   * 设置节点连接关系（nextNodeId）
   */
  setNodeConnection(storyId, chapterId, fromNodeId, toNodeId) {
    this.updateNode(storyId, chapterId, fromNodeId, { nextNodeId: toNodeId });
    App.toast('节点连接已设置', 'success');
  },

  /**
   * 选择故事线进行编辑
   */
  selectStory(storyId) {
    this._currentStoryId = storyId;
    this._currentChapterId = null;
    this._editingNodes = [];
    this.renderChapterList(storyId);
    this.renderNodeEditor();
  },

  /**
   * 选择章节进行编辑
   */
  selectChapter(storyId, chapterId) {
    this._currentStoryId = storyId;
    this._currentChapterId = chapterId;
    const chapter = this.getChapter(storyId, chapterId);
    this._editingNodes = chapter?.nodes || [];
    this.renderNodeEditor();
    this.renderChapterList(storyId);
  },

  /**
   * 测试播放章节
   * 弹出一个模拟播放窗口
   */
  testPlayChapter(storyId, chapterId) {
    const chapter = this.getChapter(storyId, chapterId);
    if (!chapter) {
      App.toast('章节不存在', 'error');
      return;
    }
    const nodes = chapter.nodes || [];
    if (nodes.length === 0) {
      App.toast('此章节还没有节点内容', 'error');
      return;
    }

    let currentIndex = 0;
    const typeInfo = this.CHAPTER_TYPES.find(t => t.id === chapter.type) || this.CHAPTER_TYPES[0];

    const buildContent = () => {
      if (currentIndex >= nodes.length) {
        return `
          <div style="text-align:center;padding:40px 20px;">
            <div style="font-size:32px;margin-bottom:12px;">🎉</div>
            <div style="font-size:16px;color:var(--text-primary);margin-bottom:16px;">章节测试结束</div>
            <button class="btn btn-primary" onclick="App.closeModal()">关闭</button>
          </div>
        `;
      }

      const node = nodes[currentIndex];
      const nodeTypeInfo = this.NODE_TYPES.find(n => n.id === node.type) || this.NODE_TYPES[0];
      let nodeContent = '';

      switch (node.type) {
        case 'dialogue':
          nodeContent = `
            <div style="margin-bottom:16px;">
              <div style="font-size:14px;color:var(--color-gold);margin-bottom:8px;font-weight:600;">${node.speaker || '旁白'}</div>
              <div style="font-size:15px;line-height:1.8;color:var(--text-primary);padding:12px;background:var(--bg-sidebar);border-radius:8px;">${node.content || '（无内容）'}</div>
            </div>
          `;
          break;
        case 'choice':
          nodeContent = `
            <div style="margin-bottom:16px;">
              <div style="font-size:14px;margin-bottom:8px;color:var(--text-secondary);">${node.content || '请选择：'}</div>
              <div style="display:flex;flex-direction:column;gap:8px;">
                ${(node.choices || []).map((choice, idx) => `
                  <button class="btn btn-secondary" style="text-align:left;" onclick="ChapterEditor._advanceTestPlay(${idx})">
                    ${idx + 1}. ${choice.text || '选项'}
                  </button>
                `).join('')}
              </div>
            </div>
          `;
          break;
        case 'action':
          nodeContent = `
            <div style="margin-bottom:16px;padding:12px;background:var(--bg-sidebar);border-radius:8px;font-style:italic;color:var(--text-secondary);">
              ${node.content || '（动作描述）'}
            </div>
          `;
          break;
        case 'scene':
          nodeContent = `
            <div style="margin-bottom:16px;padding:16px;text-align:center;background:var(--bg-sidebar);border-radius:8px;">
              <div style="font-size:24px;margin-bottom:8px;">🏞️</div>
              <div style="font-size:14px;color:var(--text-primary);">场景切换至：${node.content || '未知场景'}</div>
            </div>
          `;
          break;
        case 'reward':
          nodeContent = `
            <div style="margin-bottom:16px;padding:12px;background:var(--color-gold)11;border:1px solid var(--color-gold)33;border-radius:8px;">
              <div style="font-size:16px;margin-bottom:4px;">🎁 获得奖励</div>
              <div style="font-size:14px;color:var(--color-gold);">${node.reward || node.content || '（无奖励）'}</div>
            </div>
          `;
          break;
        default:
          nodeContent = `
            <div style="margin-bottom:16px;padding:12px;background:var(--bg-sidebar);border-radius:8px;">
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">${nodeTypeInfo.name} 节点</div>
              <div style="font-size:14px;color:var(--text-primary);">${node.content || '（无内容）'}</div>
            </div>
          `;
      }

      const hasChoice = node.type === 'choice' && (node.choices || []).length > 0;
      const hasNext = node.nextNodeId || currentIndex < nodes.length - 1;

      return `
        <div style="display:flex;flex-direction:column;gap:8px;height:100%;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div style="font-size:13px;color:var(--text-muted);">
              <span style="color:${typeInfo.color};font-weight:600;">${typeInfo.icon} ${chapter.title}</span>
              <span style="margin-left:8px;">节点 ${currentIndex + 1} / ${nodes.length}</span>
            </div>
            <span style="font-size:11px;color:var(--text-muted);padding:2px 8px;border-radius:4px;background:var(--bg-sidebar);">${nodeTypeInfo.icon} ${nodeTypeInfo.name}</span>
          </div>
          <div style="flex:1;overflow-y:auto;padding-right:8px;">
            ${nodeContent}
          </div>
          ${!hasChoice && hasNext ? `
            <div style="text-align:center;margin-top:8px;">
              <button class="btn btn-primary" onclick="ChapterEditor._advanceTestPlay()">⏩ 继续</button>
            </div>
          ` : ''}
          <div style="text-align:center;margin-top:4px;">
            <button class="btn btn-sm btn-secondary" onclick="App.closeModal()">关闭测试</button>
          </div>
        </div>
      `;
    };

    const content = `<div id="testPlayContainer" style="min-height:300px;max-height:50vh;">${buildContent()}</div>`;
    App.showModal('▶️ 测试播放', content, true);

    // 将测试播放器状态绑定到闭包
    this._testPlayIndex = currentIndex;
    this._testPlayNodes = nodes;
  },

  /**
   * 测试播放时推进到下一个节点
   */
  _advanceTestPlay(choiceIndex) {
    this._testPlayIndex = (this._testPlayIndex || 0) + 1;
    const container = document.getElementById('testPlayContainer');
    if (!container) return;

    const nodes = this._testPlayNodes || [];
    const currentIndex = this._testPlayIndex;

    if (currentIndex >= nodes.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:40px 20px;">
          <div style="font-size:32px;margin-bottom:12px;">🎉</div>
          <div style="font-size:16px;color:var(--text-primary);margin-bottom:16px;">章节测试结束</div>
          <button class="btn btn-primary" onclick="App.closeModal()">关闭</button>
        </div>
      `;
      return;
    }

    // 重新构建内容（简化版，仅刷新容器）
    // 由于App.showModal创建了动态overlay，这里直接替换innerHTML
    const chapter = this.getChapter(this._currentStoryId, this._currentChapterId);
    const typeInfo = this.CHAPTER_TYPES.find(t => t.id === (chapter?.type || 'main')) || this.CHAPTER_TYPES[0];
    const node = nodes[currentIndex];
    const nodeTypeInfo = this.NODE_TYPES.find(n => n.id === node.type) || this.NODE_TYPES[0];

    let nodeContent = '';
    switch (node.type) {
      case 'dialogue':
        nodeContent = `
          <div style="margin-bottom:16px;">
            <div style="font-size:14px;color:var(--color-gold);margin-bottom:8px;font-weight:600;">${node.speaker || '旁白'}</div>
            <div style="font-size:15px;line-height:1.8;color:var(--text-primary);padding:12px;background:var(--bg-sidebar);border-radius:8px;">${node.content || '（无内容）'}</div>
          </div>
        `;
        break;
      case 'choice':
        nodeContent = `
          <div style="margin-bottom:16px;">
            <div style="font-size:14px;margin-bottom:8px;color:var(--text-secondary);">${node.content || '请选择：'}</div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${(node.choices || []).map((choice, idx) => `
                <button class="btn btn-secondary" style="text-align:left;" onclick="ChapterEditor._advanceTestPlay(${idx})">
                  ${idx + 1}. ${choice.text || '选项'}
                </button>
              `).join('')}
            </div>
          </div>
        `;
        break;
      case 'action':
        nodeContent = `
          <div style="margin-bottom:16px;padding:12px;background:var(--bg-sidebar);border-radius:8px;font-style:italic;color:var(--text-secondary);">
            ${node.content || '（动作描述）'}
          </div>
        `;
        break;
      case 'scene':
        nodeContent = `
          <div style="margin-bottom:16px;padding:16px;text-align:center;background:var(--bg-sidebar);border-radius:8px;">
            <div style="font-size:24px;margin-bottom:8px;">🏞️</div>
            <div style="font-size:14px;color:var(--text-primary);">场景切换至：${node.content || '未知场景'}</div>
          </div>
        `;
        break;
      case 'reward':
        nodeContent = `
          <div style="margin-bottom:16px;padding:12px;background:var(--color-gold)11;border:1px solid var(--color-gold)33;border-radius:8px;">
            <div style="font-size:16px;margin-bottom:4px;">🎁 获得奖励</div>
            <div style="font-size:14px;color:var(--color-gold);">${node.reward || node.content || '（无奖励）'}</div>
          </div>
        `;
        break;
      default:
        nodeContent = `
          <div style="margin-bottom:16px;padding:12px;background:var(--bg-sidebar);border-radius:8px;">
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">${nodeTypeInfo.name} 节点</div>
            <div style="font-size:14px;color:var(--text-primary);">${node.content || '（无内容）'}</div>
          </div>
        `;
    }

    const hasChoice = node.type === 'choice' && (node.choices || []).length > 0;
    const hasNext = currentIndex < nodes.length - 1;

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:8px;height:100%;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div style="font-size:13px;color:var(--text-muted);">
            <span style="color:${typeInfo.color};font-weight:600;">${typeInfo.icon} ${chapter?.title || ''}</span>
            <span style="margin-left:8px;">节点 ${currentIndex + 1} / ${nodes.length}</span>
          </div>
          <span style="font-size:11px;color:var(--text-muted);padding:2px 8px;border-radius:4px;background:var(--bg-sidebar);">${nodeTypeInfo.icon} ${nodeTypeInfo.name}</span>
        </div>
        <div style="flex:1;overflow-y:auto;padding-right:8px;">
          ${nodeContent}
        </div>
        ${!hasChoice && hasNext ? `
          <div style="text-align:center;margin-top:8px;">
            <button class="btn btn-primary" onclick="ChapterEditor._advanceTestPlay()">⏩ 继续</button>
          </div>
        ` : ''}
        <div style="text-align:center;margin-top:4px;">
          <button class="btn btn-sm btn-secondary" onclick="App.closeModal()">关闭测试</button>
        </div>
      </div>
    `;
  },

  /**
   * 将编辑的章节同步到StorylineSystem
   */
  syncToStoryline(storyId) {
    const story = this.getStory(storyId);
    if (!story) {
      App.toast('故事线不存在', 'error');
      return;
    }

    // 读取StorylineSystem现有数据
    const existingStories = Storage.get('storylines_v6', []);

    // 查找是否已有同名故事线
    const existingIndex = existingStories.findIndex(s => s.title === story.title);
    const storylineData = {
      id: existingIndex >= 0 ? existingStories[existingIndex].id : 'story_sync_' + Date.now(),
      title: story.title,
      type: story.type,
      description: story.description,
      chapters: story.chapters.map(ch => ({
        id: ch.id,
        title: ch.title,
        completed: false,
        content: ch.nodes.map(n => {
          if (n.type === 'dialogue') return `${n.speaker || '旁白'}：${n.content}`;
          if (n.type === 'action') return `【${n.content}】`;
          return n.content || '';
        }).join('\n')
      })),
      createdAt: story.createdAt,
      updatedAt: Date.now()
    };

    if (existingIndex >= 0) {
      existingStories[existingIndex] = storylineData;
    } else {
      existingStories.push(storylineData);
    }

    Storage.set('storylines_v6', existingStories);
    App.toast(`已同步「${story.title}」到故事线`, 'success');

    // 触发事件
    if (window.EventBridge) {
      EventBridge.emit('chapter', 'synced', { storyId, title: story.title }, 'ChapterEditor');
    }
  },

  // ========== 渲染方法 ==========

  renderPage() {
    const page = document.getElementById('page-chapter-editor');
    if (!page) return;
    page.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
      <div style="padding:var(--space-lg);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:8px;">
          <h2 class="section-title">✍️ 章节编辑器</h2>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="ChapterEditor.showCreateStoryModal()">➕ 新建故事</button>
            <button class="btn btn-secondary" onclick="ChapterEditor.showImportModal()">📥 导入</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:240px 1fr;gap:var(--space-md);height:calc(100vh - 200px);min-height:400px;">
          <!-- 左侧：故事线和章节列表 -->
          <div style="display:flex;flex-direction:column;gap:var(--space-sm);overflow-y:auto;">
            <div id="storyList" style="flex:1;overflow-y:auto;"></div>
          </div>

          <!-- 右侧：节点编辑器 -->
          <div style="display:flex;flex-direction:column;gap:var(--space-sm);overflow-y:auto;">
            <div id="nodeEditorHeader" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;"></div>
            <div id="nodeEditor" style="flex:1;overflow-y:auto;"></div>
          </div>
        </div>
      </div>
    `;
    this.renderStoryList();
  },

  renderStoryList() {
    const container = document.getElementById('storyList');
    if (!container) return;
    const stories = this.getStories();

    if (stories.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding:20px;">
          <div style="font-size:28px;margin-bottom:8px;">📖</div>
          <p style="font-size:13px;">暂无故事线</p>
          <p style="font-size:12px;color:var(--text-muted);">点击上方按钮创建</p>
        </div>
      `;
      return;
    }

    container.innerHTML = stories.map(s => {
      const typeInfo = this.CHAPTER_TYPES.find(t => t.id === s.type) || this.CHAPTER_TYPES[0];
      const isActive = this._currentStoryId === s.id;
      const chapterCount = s.chapters?.length || 0;
      return `
        <div style="
          padding:10px;border-radius:6px;cursor:pointer;margin-bottom:6px;
          ${isActive ? `background:${typeInfo.color}11;border:1px solid ${typeInfo.color}44;` : 'background:var(--bg-sidebar);border:1px solid var(--border-color);'}
        " onclick="ChapterEditor.selectStory('${s.id}')">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="font-size:14px;">${typeInfo.icon}</span>
              <span style="font-size:13px;font-weight:600;color:var(--text-primary);">${s.title}</span>
            </div>
            <button class="btn btn-sm btn-danger" style="font-size:10px;padding:2px 6px;" onclick="event.stopPropagation();ChapterEditor.deleteStory('${s.id}')">删除</button>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">${s.description || '无描述'}</div>
          <div style="font-size:11px;color:var(--text-muted);">
            <span style="color:${typeInfo.color};">${typeInfo.name}</span> · ${chapterCount} 章节
          </div>
          ${isActive ? this._renderChapterListHTML(s) : ''}
        </div>
      `;
    }).join('');
  },

  _renderChapterListHTML(story) {
    if (!story.chapters || story.chapters.length === 0) {
      return `
        <div style="margin-top:8px;padding-left:8px;">
          <p style="font-size:12px;color:var(--text-muted);">暂无章节</p>
          <button class="btn btn-sm btn-primary" style="margin-top:4px;font-size:12px;" onclick="ChapterEditor.showCreateChapterModal('${story.id}')">➕ 添加章节</button>
        </div>
      `;
    }
    return `
      <div style="margin-top:8px;padding-left:8px;border-left:2px solid var(--border-color);">
        ${story.chapters.map(ch => {
          const chActive = this._currentChapterId === ch.id;
          return `
            <div style="
              padding:6px 8px;border-radius:4px;margin-bottom:4px;cursor:pointer;font-size:12px;
              ${chActive ? 'background:var(--color-primary)11;border:1px solid var(--color-primary)33;' : 'background:var(--bg-card);'}
            " onclick="ChapterEditor.selectChapter('${story.id}', '${ch.id}')">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span>${ch.title}</span>
                <button class="btn btn-sm btn-danger" style="font-size:9px;padding:1px 4px;" onclick="event.stopPropagation();ChapterEditor.deleteChapter('${story.id}', '${ch.id}')">×</button>
              </div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${ch.nodes?.length || 0} 节点</div>
            </div>
          `;
        }).join('')}
        <button class="btn btn-sm btn-secondary" style="margin-top:4px;font-size:12px;" onclick="ChapterEditor.showCreateChapterModal('${story.id}')">➕ 添加章节</button>
      </div>
    `;
  },

  renderChapterList(storyId) {
    // 重新渲染故事列表以更新章节展开状态
    this.renderStoryList();
  },

  renderNodeEditor() {
    const header = document.getElementById('nodeEditorHeader');
    const editor = document.getElementById('nodeEditor');
    if (!header || !editor) return;

    if (!this._currentStoryId || !this._currentChapterId) {
      header.innerHTML = '';
      editor.innerHTML = `
        <div class="empty-state" style="height:100%;display:flex;align-items:center;justify-content:center;">
          <div style="text-align:center;">
            <div style="font-size:32px;margin-bottom:8px;">✍️</div>
            <p>选择一个故事和章节开始编辑</p>
            <p style="font-size:12px;color:var(--text-muted);">左侧点击故事线展开章节</p>
          </div>
        </div>
      `;
      return;
    }

    const story = this.getStory(this._currentStoryId);
    const chapter = this.getChapter(this._currentStoryId, this._currentChapterId);
    if (!story || !chapter) {
      header.innerHTML = '';
      editor.innerHTML = `<p style="color:var(--text-muted);">章节数据异常</p>`;
      return;
    }

    const typeInfo = this.CHAPTER_TYPES.find(t => t.id === chapter.type) || this.CHAPTER_TYPES[0];

    header.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span style="font-size:14px;font-weight:600;">${story.title} › ${chapter.title}</span>
        <span style="font-size:11px;padding:2px 8px;border-radius:4px;background:${typeInfo.color}22;color:${typeInfo.color};">${typeInfo.icon} ${typeInfo.name}</span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <button class="btn btn-sm btn-primary" onclick="ChapterEditor.showAddNodeModal()">➕ 添加节点</button>
        <button class="btn btn-sm btn-secondary" onclick="ChapterEditor.showEditChapterModal('${this._currentStoryId}', '${this._currentChapterId}')">✏️ 编辑</button>
        <button class="btn btn-sm btn-gold" onclick="ChapterEditor.testPlayChapter('${this._currentStoryId}', '${this._currentChapterId}')">▶️ 测试</button>
        <button class="btn btn-sm btn-secondary" onclick="ChapterEditor.syncToStoryline('${this._currentStoryId}')">🔄 同步</button>
      </div>
    `;

    const nodes = chapter.nodes || [];
    if (nodes.length === 0) {
      editor.innerHTML = `
        <div class="empty-state">
          <div style="font-size:28px;margin-bottom:8px;">📄</div>
          <p>此章节还没有节点</p>
          <p style="font-size:12px;color:var(--text-muted);">点击"添加节点"开始编写剧情</p>
        </div>
      `;
      return;
    }

    editor.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${nodes.map((node, index) => {
          const nodeTypeInfo = this.NODE_TYPES.find(n => n.id === node.type) || this.NODE_TYPES[0];
          let preview = node.content || '（无内容）';
          if (preview.length > 60) preview = preview.slice(0, 60) + '...';
          return `
            <div class="card" style="border-left:3px solid ${typeInfo.color};margin-bottom:0;">
              <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="font-size:12px;color:var(--text-muted);width:24px;text-align:center;">${index + 1}</span>
                  <span style="font-size:13px;">${nodeTypeInfo.icon} ${nodeTypeInfo.name}</span>
                  ${node.speaker ? `<span style="font-size:12px;color:var(--color-gold);">👤 ${node.speaker}</span>` : ''}
                </div>
                <div style="display:flex;gap:4px;">
                  <button class="btn btn-sm btn-secondary" style="font-size:11px;padding:2px 6px;" onclick="ChapterEditor.showEditNodeModal('${node.id}')">编辑</button>
                  <button class="btn btn-sm btn-danger" style="font-size:11px;padding:2px 6px;" onclick="ChapterEditor.deleteNode('${this._currentStoryId}', '${this._currentChapterId}', '${node.id}')">删除</button>
                </div>
              </div>
              <div class="card-body" style="padding:8px 12px;font-size:13px;color:var(--text-secondary);">
                ${preview}
                ${node.nextNodeId ? `<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">➡️ 下一节点：${node.nextNodeId.slice(-6)}</div>` : ''}
                ${node.choices?.length ? `<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">🔀 ${node.choices.length} 个选项</div>` : ''}
                ${node.reward ? `<div style="font-size:11px;color:var(--color-gold);margin-top:4px;">🎁 ${node.reward}</div>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // ========== 弹窗方法 ==========

  showCreateStoryModal() {
    const content = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <input type="text" id="storyTitleInput" placeholder="故事线名称 *" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <select id="storyTypeInput" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
          ${this.CHAPTER_TYPES.map(t => `<option value="${t.id}">${t.icon} ${t.name}</option>`).join('')}
        </select>
        <textarea id="storyDescInput" placeholder="故事简介（可选）" rows="3" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);resize:vertical;"></textarea>
        <button class="btn btn-primary" onclick="ChapterEditor.confirmCreateStory()">💾 创建</button>
      </div>
    `;
    App.showModal('➕ 新建故事线', content);
  },

  confirmCreateStory() {
    const title = document.getElementById('storyTitleInput')?.value;
    const type = document.getElementById('storyTypeInput')?.value || 'main';
    const desc = document.getElementById('storyDescInput')?.value || '';
    if (!title) {
      App.toast('请输入故事线名称', 'error');
      return;
    }
    this.createStory(title, type, desc);
    App.closeModal();
  },

  showCreateChapterModal(storyId) {
    const story = this.getStory(storyId);
    const content = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <input type="text" id="chapterTitleInput" placeholder="章节名称 *" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <select id="chapterTypeInput" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
          ${this.CHAPTER_TYPES.map(t => `<option value="${t.id}" ${t.id === (story?.type || 'main') ? 'selected' : ''}>${t.icon} ${t.name}</option>`).join('')}
        </select>
        <textarea id="chapterDescInput" placeholder="章节简介（可选）" rows="2" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);resize:vertical;"></textarea>
        <input type="text" id="chapterBgInput" placeholder="背景图 URL / 名称（可选）" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <button class="btn btn-primary" onclick="ChapterEditor.confirmCreateChapter('${storyId}')">💾 创建</button>
      </div>
    `;
    App.showModal('➕ 添加章节', content);
  },

  confirmCreateChapter(storyId) {
    const title = document.getElementById('chapterTitleInput')?.value;
    const type = document.getElementById('chapterTypeInput')?.value || 'main';
    const desc = document.getElementById('chapterDescInput')?.value || '';
    if (!title) {
      App.toast('请输入章节名称', 'error');
      return;
    }
    const chapter = this.createChapter(storyId, title, type, desc);
    if (chapter) {
      const bg = document.getElementById('chapterBgInput')?.value || '';
      if (bg) this.editChapter(storyId, chapter.id, { background: bg });
    }
    App.closeModal();
  },

  showEditChapterModal(storyId, chapterId) {
    const chapter = this.getChapter(storyId, chapterId);
    if (!chapter) return;
    const content = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <input type="text" id="editChTitle" value="${(chapter.title || '').replace(/"/g, '&quot;')}" placeholder="章节名称" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <select id="editChType" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
          ${this.CHAPTER_TYPES.map(t => `<option value="${t.id}" ${t.id === chapter.type ? 'selected' : ''}>${t.icon} ${t.name}</option>`).join('')}
        </select>
        <textarea id="editChDesc" placeholder="章节简介" rows="2" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);resize:vertical;">${chapter.description || ''}</textarea>
        <input type="text" id="editChBg" value="${(chapter.background || '').replace(/"/g, '&quot;')}" placeholder="背景图 URL / 名称" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <input type="text" id="editChNpcs" value="${(chapter.npcs || []).join(', ').replace(/"/g, '&quot;')}" placeholder="NPC列表（逗号分隔）" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <button class="btn btn-primary" onclick="ChapterEditor.confirmEditChapter('${storyId}', '${chapterId}')">💾 保存</button>
      </div>
    `;
    App.showModal('✏️ 编辑章节', content);
  },

  confirmEditChapter(storyId, chapterId) {
    const updates = {
      title: document.getElementById('editChTitle')?.value || '',
      type: document.getElementById('editChType')?.value || 'main',
      description: document.getElementById('editChDesc')?.value || '',
      background: document.getElementById('editChBg')?.value || '',
      npcs: (document.getElementById('editChNpcs')?.value || '').split(',').map(s => s.trim()).filter(Boolean)
    };
    this.editChapter(storyId, chapterId, updates);
    App.closeModal();
    this.renderStoryList();
    this.renderNodeEditor();
  },

  showAddNodeModal() {
    const content = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div>
          <label style="font-size:13px;display:block;margin-bottom:4px;">节点类型</label>
          <select id="nodeTypeInput" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);width:100%;">
            ${this.NODE_TYPES.map(t => `<option value="${t.id}">${t.icon} ${t.name} — ${t.desc}</option>`).join('')}
          </select>
        </div>
        <textarea id="nodeContentInput" placeholder="节点内容" rows="4" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);resize:vertical;"></textarea>
        <input type="text" id="nodeSpeakerInput" placeholder="说话人（仅对话节点）" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <input type="text" id="nodeBgInput" placeholder="背景图（可选）" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <input type="text" id="nodeRewardInput" placeholder="奖励（可选，如：金币×10）" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <div>
          <label style="font-size:13px;display:block;margin-bottom:4px;">选项（选择节点用，每行一个"文本->下一节点ID"）</label>
          <textarea id="nodeChoicesInput" placeholder="例如：\n同意帮忙->node_xxx\n拒绝->node_yyy" rows="3" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);resize:vertical;font-family:monospace;font-size:12px;"></textarea>
        </div>
        <input type="text" id="nodeNextInput" placeholder="下一节点ID（可选）" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <button class="btn btn-primary" onclick="ChapterEditor.confirmAddNode()">➕ 添加</button>
      </div>
    `;
    App.showModal('➕ 添加节点', content, true);
  },

  confirmAddNode() {
    const type = document.getElementById('nodeTypeInput')?.value || 'dialogue';
    const content = document.getElementById('nodeContentInput')?.value || '';
    const speaker = document.getElementById('nodeSpeakerInput')?.value || '';
    const background = document.getElementById('nodeBgInput')?.value || '';
    const reward = document.getElementById('nodeRewardInput')?.value || '';
    const nextNodeId = document.getElementById('nodeNextInput')?.value || '';

    // 解析选项
    const choicesRaw = document.getElementById('nodeChoicesInput')?.value || '';
    const choices = [];
    if (choicesRaw) {
      choicesRaw.split('\n').forEach(line => {
        const parts = line.split('->');
        if (parts.length >= 2) {
          choices.push({ text: parts[0].trim(), nextNodeId: parts[1].trim() });
        } else if (parts[0].trim()) {
          choices.push({ text: parts[0].trim(), nextNodeId: '' });
        }
      });
    }

    const options = { speaker, background, reward, nextNodeId };
    if (choices.length > 0) options.choices = choices;

    this.addNode(this._currentStoryId, this._currentChapterId, type, content, options);
    App.closeModal();
  },

  showEditNodeModal(nodeId) {
    const chapter = this.getChapter(this._currentStoryId, this._currentChapterId);
    if (!chapter) return;
    const node = chapter.nodes?.find(n => n.id === nodeId);
    if (!node) return;

    const choicesText = (node.choices || []).map(c => `${c.text}${c.nextNodeId ? '->' + c.nextNodeId : ''}`).join('\n');

    const content = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div>
          <label style="font-size:13px;display:block;margin-bottom:4px;">节点类型</label>
          <select id="editNodeType" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);width:100%;">
            ${this.NODE_TYPES.map(t => `<option value="${t.id}" ${t.id === node.type ? 'selected' : ''}>${t.icon} ${t.name}</option>`).join('')}
          </select>
        </div>
        <textarea id="editNodeContent" rows="4" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);resize:vertical;">${(node.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
        <input type="text" id="editNodeSpeaker" value="${(node.speaker || '').replace(/"/g, '&quot;')}" placeholder="说话人" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <input type="text" id="editNodeBg" value="${(node.background || '').replace(/"/g, '&quot;')}" placeholder="背景图" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <input type="text" id="editNodeReward" value="${(node.reward || '').replace(/"/g, '&quot;')}" placeholder="奖励" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <textarea id="editNodeChoices" rows="3" placeholder="选项格式：文本->下一节点ID" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);resize:vertical;font-family:monospace;font-size:12px;">${choicesText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
        <input type="text" id="editNodeNext" value="${(node.nextNodeId || '').replace(/"/g, '&quot;')}" placeholder="下一节点ID" style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);">
        <button class="btn btn-primary" onclick="ChapterEditor.confirmEditNode('${nodeId}')">💾 保存</button>
      </div>
    `;
    App.showModal('✏️ 编辑节点', content, true);
  },

  confirmEditNode(nodeId) {
    const type = document.getElementById('editNodeType')?.value || 'dialogue';
    const content = document.getElementById('editNodeContent')?.value || '';
    const speaker = document.getElementById('editNodeSpeaker')?.value || '';
    const background = document.getElementById('editNodeBg')?.value || '';
    const reward = document.getElementById('editNodeReward')?.value || '';
    const nextNodeId = document.getElementById('editNodeNext')?.value || '';

    const choicesRaw = document.getElementById('editNodeChoices')?.value || '';
    const choices = [];
    if (choicesRaw) {
      choicesRaw.split('\n').forEach(line => {
        const parts = line.split('->');
        if (parts.length >= 2) {
          choices.push({ text: parts[0].trim(), nextNodeId: parts[1].trim() });
        } else if (parts[0].trim()) {
          choices.push({ text: parts[0].trim(), nextNodeId: '' });
        }
      });
    }

    const updates = { type, content, speaker, background, reward, nextNodeId };
    if (choices.length > 0) updates.choices = choices;

    this.updateNode(this._currentStoryId, this._currentChapterId, nodeId, updates);
    App.closeModal();
  },

  showImportModal() {
    const content = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <p style="font-size:13px;color:var(--text-muted);">粘贴故事线JSON数据导入：</p>
        <textarea id="importJsonInput" rows="8" placeholder='[{&quot;title&quot;:&quot;故事名&quot;,&quot;type&quot;:&quot;main&quot;,&quot;chapters&quot;:[{&quot;title&quot;:&quot;章节1&quot;,&quot;nodes&quot;:[]}]}]' style="padding:8px;border-radius:4px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);resize:vertical;font-family:monospace;font-size:12px;"></textarea>
        <button class="btn btn-primary" onclick="ChapterEditor.confirmImport()">📥 导入</button>
      </div>
    `;
    App.showModal('📥 导入故事线', content, true);
  },

  confirmImport() {
    const raw = document.getElementById('importJsonInput')?.value || '';
    if (!raw) {
      App.toast('请输入JSON数据', 'error');
      return;
    }
    try {
      const imported = JSON.parse(raw);
      if (!Array.isArray(imported)) {
        App.toast('数据格式错误：应为数组', 'error');
        return;
      }
      const data = this._getData();
      let count = 0;
      imported.forEach(item => {
        if (!item.title) return;
        const story = {
          id: 'story_import_' + Date.now() + '_' + count,
          title: item.title,
          type: item.type || 'main',
          description: item.description || '',
          chapters: (item.chapters || []).map((ch, idx) => ({
            id: 'ch_import_' + Date.now() + '_' + count + '_' + idx,
            title: ch.title || '未命名章节',
            type: ch.type || item.type || 'main',
            description: ch.description || '',
            background: ch.background || '',
            npcs: ch.npcs || [],
            nodes: (ch.nodes || []).map((n, nidx) => ({
              id: 'node_import_' + Date.now() + '_' + count + '_' + idx + '_' + nidx,
              type: n.type || 'dialogue',
              content: n.content || '',
              speaker: n.speaker || '',
              background: n.background || '',
              choices: n.choices || [],
              nextNodeId: n.nextNodeId || '',
              reward: n.reward || '',
              createdAt: Date.now()
            })),
            createdAt: Date.now()
          })),
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        data.stories.push(story);
        count++;
      });
      this._saveData(data);
      this.renderStoryList();
      App.toast(`已导入 ${count} 条故事线`, 'success');
      App.closeModal();
    } catch (e) {
      App.toast('导入失败：' + e.message, 'error');
    }
  }
};
