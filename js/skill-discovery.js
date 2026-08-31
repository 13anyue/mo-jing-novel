/**
 * =========================================================
 * Dumate Skill Discovery Integration v3
 * Find and install skills from available_plugins
 * Provides a dashboard of available capabilities
 * =========================================================
 */
const SkillDiscovery = {
  // Static list of available skills from the system
  AVAILABLE_SKILLS: [
    { id: 'baidu-baike-data', name: '百度百科', category: '知识', desc: '查询百科词条，获取权威解释', icon: '📚', status: 'installed' },
    { id: 'baidu-image-gen', name: 'AI生图', category: '创作', desc: '生成角色立绘、场景背景、CG插画', icon: '🎨', status: 'available' },
    { id: 'baidu-text-to-speech', name: '语音合成', category: '多媒体', desc: '将文本转为语音，生成角色配音', icon: '🔊', status: 'available' },
    { id: 'baidu-text-video', name: '文稿视频', category: '多媒体', desc: '将文案转为图文解说视频', icon: '🎬', status: 'available' },
    { id: 'build-website-page', name: '网页构建', category: '开发', desc: '生成和构建响应式网页', icon: '🌐', status: 'available' },
    { id: 'build-h5-content-studio', name: 'H5内容页', category: '开发', desc: '生成多类型H5内容页面', icon: '📱', status: 'available' },
    { id: 'build-ecommerce-detail-page', name: '电商详情页', category: '开发', desc: '生成电商商品详情页面', icon: '🛍️', status: 'available' },
    { id: 'icon-system', name: '图标系统', category: '设计', desc: '图标搜索、生成和集成', icon: '🔣', status: 'available' },
    { id: 'product-refinement', name: '图像精修', category: '设计', desc: '商品图、立绘精修换背景', icon: '✨', status: 'available' },
    { id: 'qianfan-deepresearch', name: '深度研究', category: '知识', desc: '系统性深度研究，产出调研报告', icon: '🔬', status: 'available' },
    { id: 'visualized-output', name: '可视化输出', category: '展示', desc: '图表、流程图、架构图渲染', icon: '📊', status: 'available' },
    { id: 'dumate-browser-use', name: '浏览器自动化', category: '工具', desc: '网页自动化操作和数据采集', icon: '🌐', status: 'available' },
    { id: 'docx', name: 'Word文档', category: '文档', desc: '读取、创建和编辑Word文档', icon: '📝', status: 'available' },
    { id: 'xlsx', name: 'Excel表格', category: '文档', desc: '读取、创建和编辑Excel表格', icon: '📊', status: 'available' },
    { id: 'pdf', name: 'PDF处理', category: '文档', desc: '生成、编辑和解析PDF文件', icon: '📄', status: 'available' },
    { id: 'pptx', name: 'PPT演示文稿', category: '文档', desc: '创建和编辑幻灯片', icon: '🎞️', status: 'available' },
    { id: 'miaoda-app-builder', name: '秒哒应用构建', category: '开发', desc: '通过自然语言构建应用', icon: '🚀', status: 'available' }
  ],

  init() { this.renderPage(); },
  onEnter() { this.renderSkillGrid(); },

  getUserSkills() { return Storage.get('userInstalledSkills', []); },
  saveUserSkills(list) { Storage.set('userInstalledSkills', list); },

  renderPage() {
    const page = document.getElementById('page-skill-discovery');
    if (!page) return;
    page.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:8px;">
        <h2 class="section-title">🔍 技能发现</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-secondary" onclick="SkillDiscovery.refreshList()">🔄 刷新</button>
        </div>
      </div>

      <div class="card" style="margin-bottom:var(--space-lg);">
        <div class="card-header"><h3>📦 已安装技能</h3></div>
        <div class="card-body">
          <div id="installedSkills" style="display:flex;gap:8px;flex-wrap:wrap;"></div>
        </div>
      </div>

      <div class="card" style="margin-bottom:var(--space-lg);">
        <div class="card-header"><h3>🔎 搜索技能</h3></div>
        <div class="card-body">
          <div style="display:flex;gap:8px;margin-bottom:var(--space-md);">
            <input type="text" id="skillSearch" placeholder="搜索技能名称或功能..." style="flex:1;" oninput="SkillDiscovery.filterSkills()">
            <select id="skillCategory" onchange="SkillDiscovery.filterSkills()" style="width:auto;">
              <option value="">全部分类</option>
              <option value="知识">知识</option>
              <option value="创作">创作</option>
              <option value="多媒体">多媒体</option>
              <option value="设计">设计</option>
              <option value="开发">开发</option>
              <option value="工具">工具</option>
              <option value="文档">文档</option>
              <option value="展示">展示</option>
            </select>
          </div>
          <div id="skillGrid" class="grid grid-3"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3>➕ 创建自定义功能</h3></div>
        <div class="card-body">
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:var(--space-md);">
            你也可以创建自己的功能模块。输入功能描述，AI将帮你生成代码。
          </p>
          <div style="display:flex;gap:8px;">
            <input type="text" id="customSkillDesc" placeholder="描述你想创建的功能..." style="flex:1;">
            <button class="btn btn-gold" onclick="SkillDiscovery.createCustomSkill()">🤖 AI创建</button>
          </div>
        </div>
      </div>
    `;
    this.renderInstalled(); this.renderSkillGrid();
  },

  renderInstalled() {
    const c = document.getElementById('installedSkills');
    if (!c) return;
    const userSkills = this.getUserSkills();
    const installed = this.AVAILABLE_SKILLS.filter(s => s.status === 'installed' || userSkills.includes(s.id));
    if (installed.length === 0) { c.innerHTML = '<span style="color:var(--text-muted);font-size:13px;">暂无已安装技能</span>'; return; }
    c.innerHTML = installed.map(s => `
      <span style="display:inline-flex;align-items:center;gap:4px;background:var(--bg-parchment);border:1px solid var(--color-gold);padding:4px 12px;border-radius:20px;font-size:13px;">
        ${s.icon} ${s.name}
        <button style="background:none;border:none;color:var(--color-danger);cursor:pointer;font-size:11px;" onclick="SkillDiscovery.uninstallSkill('${s.id}')">×</button>
      </span>
    `).join('');
  },

  renderSkillGrid() {
    const grid = document.getElementById('skillGrid');
    if (!grid) return;
    const search = document.getElementById('skillSearch')?.value?.toLowerCase() || '';
    const cat = document.getElementById('skillCategory')?.value || '';
    const userSkills = this.getUserSkills();

    let filtered = this.AVAILABLE_SKILLS.filter(s => {
      if (s.status === 'installed' || userSkills.includes(s.id)) return false; // Hide already installed
      if (cat && s.category !== cat) return false;
      if (search && !s.name.includes(search) && !s.desc.includes(search)) return false;
      return true;
    });

    if (filtered.length === 0) { grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">🔍</div><p>没有找到匹配的技能</p></div>'; return; }

    grid.innerHTML = filtered.map(s => `
      <div class="card" style="cursor:pointer;" onclick="SkillDiscovery.showSkillDetail('${s.id}')">
        <div style="display:flex;align-items:center;gap:12px;padding:var(--space-md);">
          <div style="width:48px;height:48px;border-radius:12px;background:var(--bg-sidebar);display:flex;align-items:center;justify-content:center;font-size:28px;">${s.icon}</div>
          <div style="flex:1;">
            <h4 style="font-size:14px;margin-bottom:2px;">${s.name}</h4>
            <span style="font-size:11px;color:var(--color-gold);background:rgba(201,162,39,0.1);padding:1px 6px;border-radius:4px;">${s.category}</span>
            <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">${s.desc}</p>
          </div>
        </div>
        <div style="padding:0 var(--space-md) var(--space-md);display:flex;gap:8px;justify-content:flex-end;">
          <button class="btn btn-sm btn-primary" onclick="event.stopPropagation();SkillDiscovery.installSkill('${s.id}')">安装</button>
        </div>
      </div>
    `).join('');
  },

  filterSkills() { this.renderSkillGrid(); },
  refreshList() { this.renderInstalled(); this.renderSkillGrid(); App.toast('列表已刷新', 'info'); },

  showSkillDetail(id) {
    const skill = this.AVAILABLE_SKILLS.find(s => s.id === id);
    if (!skill) return;
    App.showModal(`${skill.icon} ${skill.name}`, `
      <div style="line-height:1.8;">
        <p><strong>分类：</strong>${skill.category}</p>
        <p><strong>描述：</strong>${skill.desc}</p>
        <p><strong>ID：</strong><code style="background:var(--bg-input);padding:2px 6px;border-radius:4px;font-size:12px;">${skill.id}</code></p>
        <div style="margin-top:var(--space-md);display:flex;gap:8px;justify-content:flex-end;">
          <button class="btn btn-primary" onclick="App.closeModal();SkillDiscovery.installSkill('${skill.id}')">安装技能</button>
        </div>
      </div>
    `);
  },

  installSkill(id) {
    const userSkills = this.getUserSkills();
    if (userSkills.includes(id)) { App.toast('技能已安装', 'info'); return; }
    userSkills.push(id);
    this.saveUserSkills(userSkills);
    this.renderInstalled(); this.renderSkillGrid();
    App.toast('技能已安装', 'success');
  },

  uninstallSkill(id) {
    const userSkills = this.getUserSkills();
    this.saveUserSkills(userSkills.filter(s => s !== id));
    this.renderInstalled(); this.renderSkillGrid();
    App.toast('技能已卸载', 'info');
  },

  async createCustomSkill() {
    const desc = document.getElementById('customSkillDesc')?.value?.trim();
    if (!desc) { App.toast('请输入功能描述', 'error'); return; }
    App.toast('AI正在生成功能代码...', 'info');
    try {
      const prompt = `为视觉小说引擎创建一个JavaScript功能模块。功能描述："${desc}"
要求：
1. 使用纯前端JavaScript
2. 符合现有代码风格（使用Storage对象进行数据存储）
3. 提供init()和onEnter()方法
4. 包含renderPage()方法生成HTML
5. 代码需要有详细中文注释
6. 模块名使用驼峰命名

请直接输出完整的JavaScript代码，包含在 <script> 标签中。`;
      const result = await APISettings.chat(prompt, [], { useAux: true });

      // Extract code from response
      const codeMatch = result.match(/<script[^>]*>([\s\S]*?)<\/script>/);
      const code = codeMatch ? codeMatch[1] : result;

      // Save as a user-created plugin
      const pluginId = 'custom_skill_' + Date.now();
      const pluginData = {
        id: pluginId,
        name: '自定义：' + desc.slice(0, 20),
        description: desc,
        code: code,
        createdAt: Date.now(),
        type: 'custom_skill'
      };
      await Storage.savePlugin(pluginData);

      // Add to installed list
      const userSkills = this.getUserSkills();
      userSkills.push(pluginId);
      this.saveUserSkills(userSkills);

      App.showModal('✨ 自定义功能已创建', `
        <div style="line-height:1.8;">
          <p><strong>功能名称：</strong>${pluginData.name}</p>
          <p><strong>描述：</strong>${desc}</p>
          <p style="margin-top:var(--space-md);">代码已保存到插件库。你可以在「插件」页面查看和编辑。</p>
          <div class="code-block" style="max-height:200px;overflow-y:auto;margin-top:var(--space-md);font-size:12px;">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
      `);
      this.renderInstalled();
    } catch (e) { App.toast('创建失败: ' + e.message, 'error'); }
  }
};
