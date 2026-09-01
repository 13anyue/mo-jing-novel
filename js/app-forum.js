/**
 * =========================================================
 * AppForum — 论坛系统
 * 模块名：AppForum
 * 功能：板块列表、发帖、回帖、点赞、置顶、精华帖
 * 板块：世界观讨论、角色交流、攻略分享、水区闲聊
 * =========================================================
 */
const AppForum = {
  // 存储键名常量
  KEY_BOARDS: 'appForum_boards',
  KEY_THREADS: 'appForum_threads',
  KEY_POSTS: 'appForum_posts',
  KEY_USER: 'appForum_user',

  // 预设板块
  _defaultBoards: [
    { id: 'board_world', name: '世界观讨论', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>', description: '探讨墨境世界的设定、剧情与背景故事', order: 1 },
    { id: 'board_char', name: '角色交流', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>', description: '角色分析、二创讨论、角色扮演', order: 2 },
    { id: 'board_guide', name: '攻略分享', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>', description: '游戏攻略、技巧分享、疑难解答', order: 3 },
    { id: 'board_chat', name: '水区闲聊', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>', description: '轻松话题、日常闲聊、随便聊聊', order: 4 }
  ],

  // 当前视图状态
  _currentBoard: null,
  _currentThread: null,

  /**
   * 获取论坛用户信息（昵称、等级等）
   */
  getUser() {
    return Storage.get(this.KEY_USER, { name: '墨境玩家', avatar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>', level: 1, exp: 0 });
  },

  saveUser(u) {
    Storage.set(this.KEY_USER, u);
  },

  /**
   * 获取板块列表
   */
  getBoards() {
    return Storage.get(this.KEY_BOARDS, this._defaultBoards);
  },

  saveBoards(list) {
    Storage.set(this.KEY_BOARDS, list);
  },

  /**
   * 获取帖子列表
   */
  getThreads() {
    return Storage.get(this.KEY_THREADS, []);
  },

  saveThreads(list) {
    Storage.set(this.KEY_THREADS, list);
  },

  /**
   * 获取回复列表
   */
  getPosts() {
    return Storage.get(this.KEY_POSTS, []);
  },

  savePosts(list) {
    Storage.set(this.KEY_POSTS, list);
  },

  /**
   * 初始化模块
   */
    // 初始化模块入口
  init() {
    // v7: 外部模块依赖检查
    if (typeof Storage === 'undefined') { console.warn('[v7] Storage模块未加载'); return; }
    // 初始化模块入口
    // 确保板块数据存在
    if (!Storage.get(this.KEY_BOARDS)) {
      this.saveBoards(this._defaultBoards);
    }
    // 初始化示例帖子（仅在空数据时）
    const threads = this.getThreads();
    if (threads.length === 0) {
      this.seedSampleData();
    }
    this.renderPage();
  },

  /**
   * 填充示例数据
   */
  seedSampleData() {
    const now = Date.now();
    const sampleThreads = [
      { id: 'thread_1', boardId: 'board_world', title: '【讨论】墨境世界的地理设定', author: '世界观达人', avatar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>', content: '墨境世界分为五大域，每域各有特色。大家觉得哪个域最有意思？', pinned: true, elite: true, views: 128, likes: 42, lastReply: now - 3600000, createdAt: now - 86400000 * 3 },
      { id: 'thread_2', boardId: 'board_world', title: '关于时间线的疑问', author: '新手玩家', avatar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>', content: '剧情中提到的时间线有些混乱，有没有大佬能梳理一下？', pinned: false, elite: false, views: 56, likes: 12, lastReply: now - 7200000, createdAt: now - 86400000 },
      { id: 'thread_3', boardId: 'board_char', title: '主角性格分析帖', author: '剧情党', avatar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 01-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>', content: '通过多个章节的主角表现，可以看出其性格有明显的成长弧光...', pinned: true, elite: true, views: 256, likes: 89, lastReply: now - 1800000, createdAt: now - 86400000 * 5 },
      { id: 'thread_4', boardId: 'board_guide', title: '【攻略】如何快速提升NPC好感度', author: '攻略组', avatar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>', content: '整理了一份NPC好感度提升指南，欢迎补充。', pinned: false, elite: true, views: 512, likes: 156, lastReply: now - 300000, createdAt: now - 86400000 * 2 },
      { id: 'thread_5', boardId: 'board_chat', title: '今天天气不错，大家来闲聊', author: '水友A', avatar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12c0 3 2 5 5 5s5-2 5-5-2-5-5-5-5 2-5 5z"/><path d="M12 12c0 3 2 5 5 5s5-2 5-5-2-5-5-5-5 2-5 5z"/><path d="M7 12c0 3 2 5 5 5s5-2 5-5-2-5-5-5-5 2-5 5z"/></svg>', content: '闲来无事，聊聊天呗~', pinned: false, elite: false, views: 32, likes: 5, lastReply: now - 60000, createdAt: now - 3600000 }
    ];
    this.saveThreads(sampleThreads);
    const samplePosts = [
      { id: 'post_1', threadId: 'thread_1', author: '剧情党', avatar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 01-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>', content: '我投东域一票，那里的山水描写特别细腻。', createdAt: now - 3000000 },
      { id: 'post_2', threadId: 'thread_1', author: '画手', avatar: '🎨', content: '西域的异域风情更适合做插画！', createdAt: now - 2400000 },
      { id: 'post_3', threadId: 'thread_3', author: '分析帝', avatar: '🧐', content: '同意楼主，主角从冲动到沉稳的转变处理得相当自然。', createdAt: now - 900000 }
    ];
    this.savePosts(samplePosts);
  },

  /**
   * 进入页面时调用
   */
    // 页面进入时调用
  onEnter() {
    // 页面进入时调用
    this._currentBoard = null;
    this._currentThread = null;
    this.renderPage();
  },

  /**
   * 渲染页面整体结构
   */
    // 渲染页面主结构
  renderPage() {
    // 渲染页面主结构
    const page = document.getElementById('page-forum');
    if (!page) return;
    page.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
<div style="display:flex;height:100%;overflow:hidden;border-radius:var(--radius-lg);border:1px solid var(--border-color);background:var(--card-bg);">
        <!-- 左侧：板块导航 -->
        <div id="forumBoardPanel" style="width:220px;min-width:220px;border-right:1px solid var(--border-color);display:flex;flex-direction:column;background:var(--bg-secondary);">
          <div style="padding:12px 16px;border-bottom:1px solid var(--border-color);font-size:16px;font-weight:600;">
            📋 论坛
          </div>
          <div id="forumBoardList" style="flex:1;overflow-y:auto;padding:8px 0;"></div>
        </div>
        <!-- 右侧：内容区 -->
        <div id="forumContentPanel" style="flex:1;display:flex;flex-direction:column;min-width:0;background:var(--bg-primary);">
          <div id="forumHeader" style="padding:12px 16px;border-bottom:1px solid var(--border-color);display:flex;align-items:center;justify-content:space-between;">
            <span id="forumHeaderTitle" style="font-weight:600;font-size:15px;">选择板块</span>
            <button class="btn btn-primary btn-sm" id="forumNewPostBtn" style="display:none;" onclick="AppForum.showNewThreadModal()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 发帖</button>
          </div>
          <div id="forumBody" style="flex:1;overflow-y:auto;padding:16px;">
            <div class="empty-state">
              <div class="empty-icon" style="font-size:48px;">📋</div>
              <p>请从左侧选择一个板块</p>
            </div>
          </div>
        </div>
      </div>
    `;
    this.renderBoard();
  },

  /**
   * 渲染板块列表
   */
  renderBoard() {
    const container = document.getElementById('forumBoardList');
    if (!container) return;
    const boards = this.getBoards();
    container.innerHTML = boards.map(b => {
      const isActive = this._currentBoard === b.id;
      const threadCount = this.getThreads().filter(t => t.boardId === b.id).length;
      return `
        <div class="forum-board-item ${isActive ? 'active' : ''}" data-board="${b.id}" onclick="AppForum.selectBoard('${b.id}')"
          style="padding:10px 16px;cursor:pointer;display:flex;align-items:center;gap:10px;transition:background 0.2s;${isActive ? 'background:var(--primary-bg);border-right:3px solid var(--primary);' : ''}"
          onmouseenter="this.style.background='var(--hover-bg)'" onmouseleave="this.style.background='${isActive ? 'var(--primary-bg)' : 'transparent'}'">
          <span style="font-size:22px;">${b.icon}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;font-size:14px;">${b.name}</div>
            <div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${b.description}</div>
          </div>
          <span style="background:var(--bg-secondary);color:var(--text-muted);font-size:11px;padding:2px 6px;border-radius:10px;flex-shrink:0;">${threadCount}</span>
        </div>
      `;
    }).join('');
  },

  /**
   * 选择板块
   */
  selectBoard(boardId) {
    this._currentBoard = boardId;
    this._currentThread = null;
    this.renderBoard();
    this.renderThreadList(boardId);
    const headerTitle = document.getElementById('forumHeaderTitle');
    const newPostBtn = document.getElementById('forumNewPostBtn');
    const boards = this.getBoards();
    const board = boards.find(b => b.id === boardId);
    if (headerTitle) headerTitle.textContent = board ? `📋 ${board.name}` : '选择板块';
    if (newPostBtn) newPostBtn.style.display = 'inline-block';
  },

  /**
   * 渲染帖子列表
   */
  renderThreadList(boardId) {
    const body = document.getElementById('forumBody');
    if (!body) return;
    let threads = this.getThreads().filter(t => t.boardId === boardId);
    // 排序：置顶 > 精华 > 最后回复时间
    threads.sort((a, b) => {
      if (a.pinned !== b.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
      if (a.elite !== b.elite) return (b.elite ? 1 : 0) - (a.elite ? 1 : 0);
      return (b.lastReply || 0) - (a.lastReply || 0);
    });
    if (threads.length === 0) {
      body.innerHTML = '<div class="empty-state"><div class="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div><p>该板块暂无帖子</p><p style="font-size:12px;color:var(--text-muted);">点击右上角"发帖"创建第一个帖子</p></div>';
      return;
    }
    body.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${threads.map(t => this.renderThreadItem(t)).join('')}
      </div>
    `;
  },

  /**
   * 渲染单条帖子摘要
   */
  renderThreadItem(t) {
    const pinBadge = t.pinned ? '<span style="background:var(--warning);color:#fff;font-size:11px;padding:1px 6px;border-radius:4px;margin-right:4px;">置顶</span>' : '';
    const eliteBadge = t.elite ? '<span style="background:var(--success);color:#fff;font-size:11px;padding:1px 6px;border-radius:4px;margin-right:4px;">精华</span>' : '';
    const timeStr = this.formatTime(t.lastReply || t.createdAt);
    return `
      <div class="card" style="cursor:pointer;transition:box-shadow 0.2s,transform 0.2s;"
        onclick="AppForum.openThread('${t.id}')"
        onmouseenter="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)';this.style.transform='translateY(-1px)'"
        onmouseleave="this.style.boxShadow='';this.style.transform=''">
        <div class="card-body">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
            ${pinBadge}${eliteBadge}
            <span style="font-weight:600;font-size:15px;">${this.escapeHtml(t.title)}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-muted);margin-bottom:8px;">
            <span>${t.avatar || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'} ${t.author}</span>
            <span>|</span>
            <span>👁 ${t.views || 0}</span>
            <span>❤️ ${t.likes || 0}</span>
            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg> ${this.getPostCount(t.id)}</span>
            <span style="margin-left:auto;">${timeStr}</span>
          </div>
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${this.escapeHtml(t.content)}</p>
        </div>
      </div>
    `;
  },

  /**
   * 获取帖子回复数
   */
  getPostCount(threadId) {
    return this.getPosts().filter(p => p.threadId === threadId).length;
  },

  /**
   * 打开帖子详情
   */
  openThread(threadId) {
    this._currentThread = threadId;
    const threads = this.getThreads();
    const thread = threads.find(t => t.id === threadId);
    if (!thread) return;
    // 增加浏览数
    thread.views = (thread.views || 0) + 1;
    this.saveThreads(threads);
    const body = document.getElementById('forumBody');
    const headerTitle = document.getElementById('forumHeaderTitle');
    const newPostBtn = document.getElementById('forumNewPostBtn');
    if (headerTitle) headerTitle.innerHTML = `<span style="cursor:pointer;color:var(--primary);" onclick="AppForum.selectBoard('${thread.boardId}')">← 返回</span> ${this.escapeHtml(thread.title)}`;
    if (newPostBtn) newPostBtn.style.display = 'none';
    if (!body) return;

    const posts = this.getPosts().filter(p => p.threadId === threadId);
    const timeStr = new Date(thread.createdAt).toLocaleString('zh-CN');

    body.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:16px;">
        <!-- 帖子头部 -->
        <div class="card">
          <div class="card-body">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
              <span style="font-size:36px;">${thread.avatar || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'}</span>
              <div>
                <div style="font-weight:600;font-size:15px;">${thread.author}</div>
                <div style="font-size:12px;color:var(--text-muted);">${timeStr}</div>
              </div>
              <div style="margin-left:auto;display:flex;gap:6px;">
                ${thread.pinned ? '<span style="background:var(--warning);color:#fff;font-size:11px;padding:2px 8px;border-radius:4px;">置顶</span>' : ''}
                ${thread.elite ? '<span style="background:var(--success);color:#fff;font-size:11px;padding:2px 8px;border-radius:4px;">精华</span>' : ''}
              </div>
            </div>
            <h3 style="font-size:18px;margin-bottom:10px;">${this.escapeHtml(thread.title)}</h3>
            <div style="font-size:14px;line-height:1.8;color:var(--text-primary);">${this.escapeHtml(thread.content)}</div>
            <div style="display:flex;align-items:center;gap:12px;margin-top:16px;padding-top:12px;border-top:1px solid var(--border-color);">
              <button class="btn btn-sm btn-secondary" onclick="AppForum.likeThread('${threadId}')">❤️ ${thread.likes || 0}</button>
              <span style="font-size:12px;color:var(--text-muted);">👁 ${thread.views || 0} 浏览</span>
              <span style="font-size:12px;color:var(--text-muted);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg> ${posts.length} 回复</span>
            </div>
          </div>
        </div>
        <!-- 回复列表 -->
        ${posts.length > 0 ? `
          <div style="font-weight:600;font-size:14px;padding-left:4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg> ${posts.length} 条回复</div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${posts.map(p => this.renderPostItem(p)).join('')}
          </div>
        ` : '<div class="empty-state" style="padding:20px;"><p>暂无回复，快来抢沙发！</p></div>'}
        <!-- 回复输入区 -->
        <div class="card" style="position:sticky;bottom:0;">
          <div class="card-body" style="display:flex;gap:10px;align-items:flex-start;">
            <span style="font-size:28px;flex-shrink:0;">${this.getUser().avatar}</span>
            <textarea id="forumReplyInput" rows="3" placeholder="发表你的回复..." style="flex:1;padding:8px 12px;border:1px solid var(--border-color);border-radius:var(--radius-md);background:var(--input-bg);color:var(--text-primary);font-size:14px;resize:vertical;"></textarea>
            <button class="btn btn-primary" style="flex-shrink:0;align-self:flex-end;" onclick="AppForum.replyPost()">回复</button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 渲染单条回复
   */
  renderPostItem(p) {
    const timeStr = new Date(p.createdAt).toLocaleString('zh-CN');
    return `
      <div class="card" style="margin-left:20px;">
        <div class="card-body" style="padding:12px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="font-size:24px;">${p.avatar || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'}</span>
            <span style="font-weight:600;font-size:14px;">${p.author}</span>
            <span style="font-size:11px;color:var(--text-muted);margin-left:auto;">${timeStr}</span>
          </div>
          <div style="font-size:14px;line-height:1.7;color:var(--text-primary);">${this.escapeHtml(p.content)}</div>
        </div>
      </div>
    `;
  },

  /**
   * 点赞帖子
   */
  likeThread(threadId) {
    const threads = this.getThreads();
    const idx = threads.findIndex(t => t.id === threadId);
    if (idx !== -1) {
      threads[idx].likes = (threads[idx].likes || 0) + 1;
      this.saveThreads(threads);
      App.toast('已点赞 👍', 'success');
      // 刷新帖子详情页
      if (this._currentThread === threadId) {
        this.openThread(threadId);
      }
    }
  },

  /**
   * 显示新建帖子弹窗
   */
  showNewThreadModal() {
    const user = this.getUser();
    const content = `
      <div class="form-group"><label>标题</label><input type="text" id="newThreadTitle" placeholder="帖子标题"></div>
      <div class="form-group"><label>内容</label><textarea id="newThreadContent" rows="6" placeholder="帖子内容..."></textarea></div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;">
        <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
        <button class="btn btn-primary" onclick="AppForum.createPost()">发布</button>
      </div>
    `;
    App.showModal('发布新帖', content);
  },

  /**
   * 创建帖子
   */
  createPost() {
    const title = document.getElementById('newThreadTitle')?.value.trim();
    const content = document.getElementById('newThreadContent')?.value.trim();
    if (!title) { App.toast('请输入标题', 'error'); return; }
    if (!content) { App.toast('请输入内容', 'error'); return; }
    if (!this._currentBoard) { App.toast('请先选择板块', 'error'); return; }
    const user = this.getUser();
    const thread = {
      id: 'thread_' + Date.now(),
      boardId: this._currentBoard,
      title,
      content,
      author: user.name,
      avatar: user.avatar,
      pinned: false,
      elite: false,
      views: 0,
      likes: 0,
      lastReply: Date.now(),
      createdAt: Date.now()
    };
    const threads = this.getThreads();
    threads.push(thread);
    this.saveThreads(threads);
    // 增加用户经验
    user.exp = (user.exp || 0) + 10;
    this.saveUser(user);
    App.closeModal();
    this.renderThreadList(this._currentBoard);
    this.renderBoard(); // 刷新板块帖子计数
    App.toast('帖子发布成功', 'success');
    // 触发事件
    if (window.EventBridge) {
      EventBridge.emit('forum', 'thread_created', { threadId: thread.id, boardId: this._currentBoard }, 'AppForum');
    }
  },

  /**
   * 回复帖子
   */
  replyPost() {
    const content = document.getElementById('forumReplyInput')?.value.trim();
    if (!content) { App.toast('请输入回复内容', 'error'); return; }
    if (!this._currentThread) { App.toast('请选择一个帖子', 'error'); return; }
    const user = this.getUser();
    const post = {
      id: 'post_' + Date.now(),
      threadId: this._currentThread,
      author: user.name,
      avatar: user.avatar,
      content,
      createdAt: Date.now()
    };
    const posts = this.getPosts();
    posts.push(post);
    this.savePosts(posts);
    // 更新帖子的最后回复时间
    const threads = this.getThreads();
    const idx = threads.findIndex(t => t.id === this._currentThread);
    if (idx !== -1) {
      threads[idx].lastReply = Date.now();
      this.saveThreads(threads);
    }
    // 增加用户经验
    user.exp = (user.exp || 0) + 5;
    this.saveUser(user);
    // 清空输入框并刷新
    const input = document.getElementById('forumReplyInput');
    if (input) input.value = '';
    this.openThread(this._currentThread);
    App.toast('回复成功', 'success');
  },

  /**
   * 格式化时间
   */
  formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
