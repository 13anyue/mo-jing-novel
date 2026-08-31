/**
 * =========================================================
 * Home Page v2
 * Knowledge framework + feature navigation
 * =========================================================
 */
const HomePage = {
  init() { this.renderPage(); },
  onEnter() {},

  renderPage() {
    const page = document.getElementById('page-home');
    if (!page) return;
    page.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
<div class="hero-section" style="background: linear-gradient(180deg, rgba(139,69,19,0.08), transparent); padding: var(--space-2xl); border-radius: var(--border-radius); margin-bottom: var(--space-xl); text-align: center;">
        <h2 style="font-family:var(--font-display); font-size: 32px; margin-bottom: 8px; color: var(--color-primary-dark); letter-spacing: 8px;">墨 境</h2>
        <p style="color: var(--text-secondary); font-size: 16px; letter-spacing: 4px;">AI 视觉小说引擎 · 浏览器即运行</p>
      </div>

      <div class="grid grid-3" style="margin-bottom: var(--space-xl);">
        ${this.renderFeatureCards()}
      </div>

      <h2 class="section-title" style="margin-bottom: var(--space-lg);">全景知识体系</h2>
      <div class="grid grid-2" style="margin-bottom: var(--space-xl);">
        ${this.renderKnowledgeTree()}
      </div>

      <h2 class="section-title" style="margin-bottom: var(--space-md);">对抗写剧本枯燥的两大独门秘笈</h2>
      <div class="grid grid-2" style="margin-bottom: var(--space-xl);">
        ${KnowledgeData.writingTips.map(t => `
          <div class="card">
            <div class="card-body" style="display:flex; gap:var(--space-md); align-items:start;">
              <div style="font-size:32px; flex-shrink:0;">${t.icon}</div>
              <div>
                <h4 style="font-family:var(--font-display); margin-bottom:6px; color:var(--color-primary-dark);">${t.title}</h4>
                <p style="font-size:14px; color:var(--text-secondary); line-height:1.7;">${t.desc}</p>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <h2 class="section-title" style="margin-bottom: var(--space-md);">视觉资源全清单</h2>
      <div class="grid grid-4">
        ${KnowledgeData.assetChecklist.map(a => `
          <div class="card">
            <div class="card-body" style="text-align:center;">
              <div style="font-size:36px; margin-bottom:8px;">${a.icon}</div>
              <h4 style="font-family:var(--font-display); font-size:14px; margin-bottom:4px;">${a.label}</h4>
              <p style="font-size:12px; color:var(--text-muted);">${a.desc}</p>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="card" style="margin-top: var(--space-xl);">
        <div class="card-header"><h3>🚀 快速开始</h3></div>
        <div class="card-body">
          <div style="display:flex; gap:var(--space-lg); flex-wrap:wrap;">
            <div style="flex:1; min-width:200px;">
              <h4 style="font-family:var(--font-display); color:var(--color-primary); margin-bottom:6px;">1️⃣ 配置 API</h4>
              <p style="font-size:13px; color:var(--text-secondary);">前往「API设置」，填入AI接口地址和密钥，测试连接。</p>
            </div>
            <div style="flex:1; min-width:200px;">
              <h4 style="font-family:var(--font-display); color:var(--color-primary); margin-bottom:6px;">2️⃣ 创建角色</h4>
              <p style="font-size:13px; color:var(--text-secondary);">前往「人物志」，上传立绘头像，设定性格背景。</p>
            </div>
            <div style="flex:1; min-width:200px;">
              <h4 style="font-family:var(--font-display); color:var(--color-primary); margin-bottom:6px;">3️⃣ 开始游戏</h4>
              <p style="font-size:13px; color:var(--text-secondary);">前往「开始游戏」，选择角色背景，与AI对话互动。</p>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderFeatureCards() {
    const features = [
      { icon: '🔌', title: 'API 设置', desc: '主API + 辅助API，兼容多种LLM', page: 'api' },
      { icon: '👤', title: '人物志', desc: '批量立绘库，DIY档案，AI生成', page: 'npc' },
      { icon: '🖼️', title: '背景库', desc: '分类管理场景背景图片', page: 'background' },
      { icon: '🎵', title: '音乐', desc: '上传MP3，播放控制', page: 'music' },
      { icon: '🗺️', title: '天下图', desc: '地点标记，点击进入场景', page: 'map' },
      { icon: '📊', title: '状态栏', desc: '自定义状态，好感度条', page: 'status' },
      { icon: '📝', title: '提示词', desc: '系统/角色模板，变量插值', page: 'prompts' },
      { icon: '🧠', title: '仿向量记忆', desc: 'TF-IDF + Embedding，分类命中', page: 'memory' },
      { icon: '📦', title: '预设管理', desc: '保存加载导出导入配置', page: 'presets' },
      { icon: '🔮', title: '正则引擎', desc: '对话匹配触发替换', page: 'regex' },
      { icon: '📚', title: '世界书', desc: '注入/常驻/深度设定', page: 'worldbook' },
      { icon: '🤖', title: '墨境助手', desc: '万能AI助手，读取源码', page: 'assistant' },
      { icon: '🔌', title: '插件工坊', desc: '自定义功能，可导入', page: 'plugins' },
      { icon: '📖', title: '记事册', desc: '分类记事，灵感记录', page: 'notes' },
      { icon: '🔗', title: '关系网', desc: '角色关系可视化', page: 'relations' },
      { icon: '🚀', title: '开始游戏', desc: '视觉小说运行时', page: 'runtime' }
    ];
    return features.map(f => `
      <div class="card feature-card" onclick="App.navigate('${f.page}')">
        <div class="feature-icon" style="background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));">${f.icon}</div>
        <div class="feature-title">${f.title}</div>
        <div class="feature-desc">${f.desc}</div>
      </div>
    `).join('');
  },

  renderKnowledgeTree() {
    return KnowledgeData.categories.map(cat => `
      <div class="card">
        <div class="card-header"><h3>${cat.icon} ${cat.title}</h3></div>
        <div class="card-body">
          ${cat.children.map(child => `
            <div class="knowledge-node">
              <div class="node-title">${child.title}</div>
              <div class="node-detail">${child.detail}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }
};
