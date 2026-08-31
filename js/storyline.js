/**
 * =========================================================
 * Storyline System v6 — 主线/支线/章节管理
 * 君成录风格剧情树：主线剧情 + 个人支线 + 隐藏线
 * 章节推进、条件解锁、分支追踪
 * =========================================================
 */
const StorylineSystem = {
  CHAPTER_TYPES: [
    { id: 'main', name: '主线', color: '#C9A227', desc: '核心剧情' },
    { id: 'branch', name: '支线', color: '#4A90C2', desc: '角色专属' },
    { id: 'hidden', name: '隐藏', color: '#9C27B0', desc: '特殊条件解锁' },
    { id: 'side', name: '番外', color: '#6B8E23', desc: '额外故事' }
  ],

  init() { this.renderPage(); },
  onEnter() { this.renderTree(); },

  getStories() { return Storage.get('storylines_v6', []); },
  saveStories(list) { Storage.set('storylines_v6', list); },

  renderPage() {
    const page = document.getElementById('page-storyline');
    if (!page) return;
    page.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:8px;">
        <h2 class="section-title">📖 故事线</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-primary" onclick="StorylineSystem.createStory()">➕ 新建故事线</button>
          <button class="btn btn-gold" onclick="StorylineSystem.aiGenerateStory()">✨ AI生成</button>
        </div>
      </div>
      <div id="storyTree"></div>
    `;
    this.renderTree();
  },

  renderTree() {
    const c = document.getElementById('storyTree');
    if (!c) return;
    const stories = this.getStories();
    if (stories.length === 0) {
      c.innerHTML = `<div class="empty-state"><div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 01-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
      </div><p>暂无故事线</p><p style="font-size:12px;color:var(--text-muted);">点击"新建故事线"或"AI生成"开始</p></div>`;
      return;
    }

    c.innerHTML = stories.map(s => {
      const type = this.CHAPTER_TYPES.find(t => t.id === s.type) || this.CHAPTER_TYPES[0];
      const chapters = s.chapters || [];
      const completed = chapters.filter(ch => ch.completed).length;
      const total = chapters.length;
      return `
        <div class="card" style="margin-bottom:var(--space-md);">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="background:${type.color};color:#fff;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:700;">${type.name}</span>
              <h3 style="font-size:16px;">${s.title}</h3>
            </div>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-sm btn-secondary" onclick="StorylineSystem.editStory('${s.id}')">编辑</button>
              <button class="btn btn-sm btn-danger" onclick="StorylineSystem.deleteStory('${s.id}')">删除</button>
            </div>
          </div>
          <div class="card-body">
            <p style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;">${s.description || ''}</p>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
              <div style="flex:1;height:6px;background:var(--bg-sidebar);border-radius:3px;overflow:hidden;">
                <div style="width:${total > 0 ? (completed/total*100) : 0}%;height:100%;background:${type.color};transition:width 0.3s;"></div>
              </div>
              <span style="font-size:12px;color:var(--text-muted);">${completed}/${total}</span>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              ${chapters.map((ch, i) => `
                <div style="padding:6px 12px;border-radius:6px;font-size:12px;${ch.completed ? `background:${type.color}22;border:1px solid ${type.color};color:${type.color};` : 'background:var(--bg-sidebar);border:1px solid var(--border-color);color:var(--text-muted);'}">
                  ${i+1}. ${ch.title}${ch.completed ? ' ✓' : ''}
                </div>
              `).join('')}
              <button class="btn btn-sm btn-secondary" style="font-size:12px;" onclick="StorylineSystem.addChapter('${s.id}')">➕ 章节</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  createStory() {
    const title = prompt('故事线名称：'); if (!title) return;
    const type = prompt('类型（main主线/branch支线/hidden隐藏/side番外）：', 'main');
    const stories = this.getStories();
    stories.push({
      id: 'story_' + Date.now(),
      title,
      type: type || 'main',
      description: '',
      chapters: [],
      createdAt: Date.now(),
      active: true
    });
    this.saveStories(stories);
    this.renderTree();
    EventBridge?.emit('storyline', 'created', { title }, 'StorylineSystem');
  },

  addChapter(storyId) {
    const title = prompt('章节名称：'); if (!title) return;
    const stories = this.getStories();
    const story = stories.find(s => s.id === storyId);
    if (!story) return;
    const condition = prompt('解锁条件（可选）：', '');
    story.chapters.push({
      id: 'ch_' + Date.now(),
      title,
      condition,
      completed: false,
      content: '',
      createdAt: Date.now()
    });
    this.saveStories(stories);
    this.renderTree();
    App.toast('章节已添加', 'success');
  },

  async aiGenerateStory() {
    const world = Storage.get('worldData', {});
    const prompt = `为视觉小说「${world.name || '墨境'}」生成故事线大纲。
世界观：${world.description || '古风世界'}

请返回JSON格式：
[
  {
    "title": "故事线名称",
    "type": "main/branch/hidden/side",
    "description": "故事简介",
    "chapters": [
      {"title": "章节名", "condition": "解锁条件"}
    ]
  }
]

生成1条主线+2条支线，每条约3-5章。只返回JSON。`;
    try {
      const result = await APISettings.chat(prompt, [], { useAux: true });
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      const stories = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      if (!Array.isArray(stories)) { App.toast('生成失败', 'error'); return; }

      const existing = this.getStories();
      stories.forEach(s => {
        existing.push({
          id: 'story_ai_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
          title: s.title,
          type: s.type || 'branch',
          description: s.description || '',
          chapters: (s.chapters || []).map((ch, i) => ({
            id: 'ch_ai_' + Date.now() + '_' + i,
            title: ch.title,
            condition: ch.condition || '',
            completed: false,
            content: '',
            createdAt: Date.now()
          })),
          createdAt: Date.now(),
          aiGenerated: true
        });
      });
      this.saveStories(existing);
      this.renderTree();
      App.toast(`已生成 ${stories.length} 条故事线`, 'success');
    } catch (e) { App.toast('生成失败: ' + e.message, 'error'); }
  },

  deleteStory(id) {
    if (!confirm('删除此故事线？')) return;
    this.saveStories(this.getStories().filter(s => s.id !== id));
    this.renderTree();
  },

  editStory(id) {
    const story = this.getStories().find(s => s.id === id);
    if (!story) return;
    const desc = prompt('故事简介：', story.description || '');
    if (desc !== null) { story.description = desc; this.saveStories(this.getStories()); this.renderTree(); }
  },

  // Runtime integration: check chapter completion
  markChapterComplete(storyId, chapterId) {
    const stories = this.getStories();
    const story = stories.find(s => s.id === storyId);
    if (!story) return;
    const ch = story.chapters.find(c => c.id === chapterId);
    if (ch) { ch.completed = true; ch.completedAt = Date.now(); }
    this.saveStories(stories);
    EventBridge?.emit('storyline', 'chapter_completed', { storyId, chapterId, storyTitle: story.title, chapterTitle: ch?.title }, 'StorylineSystem');
  },

  getActiveStory() {
    return this.getStories().find(s => s.active) || this.getStories()[0] || null;
  }
};
