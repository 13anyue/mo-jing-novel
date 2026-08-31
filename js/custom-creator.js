/**
 * =========================================================
 * User Custom Feature Creator v3
 * Users can create new functional modules with HTML + JS
 * AI-assisted code generation from descriptions
 * Modules run in sandbox and get added to navigation
 * =========================================================
 */
const CustomCreator = {
  init() { this.renderPage(); },
  onEnter() { this.renderUserModules(); },

  getUserModules() { return Storage.get('userCustomModules', []); },
  saveUserModules(list) { Storage.set('userCustomModules', list); },

  renderPage() {
    const page = document.getElementById('page-custom-creator');
    if (!page) return;
    page.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:8px;">
        <h2 class="section-title">🛠️ 功能创建器</h2>
        <button class="btn btn-secondary" onclick="CustomCreator.showHelp()">❓ 使用说明</button>
      </div>

      <div class="card" style="margin-bottom:var(--space-lg);">
        <div class="card-header"><h3>✨ AI辅助创建</h3></div>
        <div class="card-body">
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:var(--space-md);">
            描述你想要的功能，AI将为你生成完整的HTML和JavaScript代码。
          </p>
          <div class="form-group">
            <label>功能名称</label>
            <input type="text" id="customName" placeholder="如：战斗系统">
          </div>
          <div class="form-group">
            <label>功能描述（详细描述你想要的功能）</label>
            <textarea id="customDesc" rows="4" placeholder="如：一个回合制战斗系统，有血量条、技能按钮、伤害计算..."></textarea>
          </div>
          <div class="form-group">
            <label>AI生成选项</label>
            <div style="display:flex;gap:12px;flex-wrap:wrap;">
              <label style="display:flex;align-items:center;gap:4px;font-size:13px;"><input type="checkbox" id="genHTML" checked style="width:auto;"> 生成HTML结构</label>
              <label style="display:flex;align-items:center;gap:4px;font-size:13px;"><input type="checkbox" id="genJS" checked style="width:auto;"> 生成JavaScript逻辑</label>
              <label style="display:flex;align-items:center;gap:4px;font-size:13px;"><input type="checkbox" id="genCSS" style="width:auto;"> 生成CSS样式</label>
            </div>
          </div>
          <button class="btn btn-gold" onclick="CustomCreator.aiGenerate()">🤖 AI生成代码</button>
        </div>
      </div>

      <div class="card" style="margin-bottom:var(--space-lg);">
        <div class="card-header"><h3>📝 手动编写</h3></div>
        <div class="card-body">
          <div class="form-group"><label>功能名称</label><input type="text" id="manualName" placeholder="功能名称"></div>
          <div class="form-group"><label>HTML模板</label><textarea id="manualHTML" rows="4" placeholder="<div>你的HTML结构</div>"></textarea></div>
          <div class="form-group"><label>JavaScript代码</label><textarea id="manualJS" rows="6" placeholder="const MyModule = { init() { ... } };"></textarea></div>
          <div class="hint">代码将在沙箱中运行。可以使用Storage对象存储数据，使用App.toast()显示提示。</div>
          <div style="display:flex;gap:8px;margin-top:var(--space-md);">
            <button class="btn btn-primary" onclick="CustomCreator.manualCreate()">💾 创建功能</button>
            <button class="btn btn-secondary" onclick="CustomCreator.testCode()">🧪 测试代码</button>
          </div>
        </div>
      </div>

      <h3 style="font-size:16px;margin-bottom:var(--space-sm);">📦 我的功能</h3>
      <div id="userModuleList"></div>
    `;
    this.renderUserModules();
  },

  async aiGenerate() {
    const name = document.getElementById('customName')?.value?.trim();
    const desc = document.getElementById('customDesc')?.value?.trim();
    if (!name || !desc) { App.toast('请填写完整信息', 'error'); return; }

    const genHTML = document.getElementById('genHTML')?.checked;
    const genJS = document.getElementById('genJS')?.checked;
    const genCSS = document.getElementById('genCSS')?.checked;

    App.toast('AI正在生成功能代码...', 'info');
    try {
      const prompt = `为视觉小说引擎创建一个名为"${name}"的功能模块。

功能描述：${desc}

要求：
1. 纯前端JavaScript，不依赖外部库
2. 使用localStorage/IndexedDB存储数据（通过Storage对象）
3. HTML使用内联style或class，兼容古风主题（暖羊皮纸#F5E6D3 + 金色#C9A227）
4. 提供init()和onEnter()方法
5. 代码要有中文注释
6. ${genHTML ? '包含完整的HTML模板' : '不需要HTML'}
7. ${genJS ? '包含完整的JavaScript逻辑' : '不需要JS'}
8. ${genCSS ? '包含内联CSS样式' : '不需要CSS'}

请输出JSON格式：
{
  "html": "HTML代码",
  "js": "JavaScript代码",
  "css": "CSS代码（可选）"
}

只输出JSON，不要其他文字。`;

      const result = await APISettings.chat(prompt, [], { useAux: true });
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      const code = jsonMatch ? JSON.parse(jsonMatch[0]) : { html: '', js: '', css: '' };

      // Show preview for editing
      App.showModal(`✨ AI生成：${name}`, `
        <div style="max-height:60vh;overflow-y:auto;">
          ${code.css ? `<h4 style="color:var(--color-gold);margin:8px 0;">CSS</h4><div class="code-block">${this.escape(code.css)}</div>` : ''}
          ${code.html ? `<h4 style="color:var(--color-gold);margin:8px 0;">HTML</h4><div class="code-block">${this.escape(code.html)}</div>` : ''}
          ${code.js ? `<h4 style="color:var(--color-gold);margin:8px 0;">JavaScript</h4><div class="code-block">${this.escape(code.js)}</div>` : ''}
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:var(--space-md);">
            <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
            <button class="btn btn-primary" onclick="CustomCreator.saveAIGenerated('${name.replace(/'/g,"\\'")}')">保存功能</button>
          </div>
        </div>
      `);

      // Store temporarily
      this._aiGenerated = { name, ...code };
    } catch (e) { App.toast('生成失败: ' + e.message, 'error'); }
  },

  saveAIGenerated(name) {
    if (!this._aiGenerated) return;
    const module = {
      id: 'custom_' + Date.now(),
      name: this._aiGenerated.name || name,
      html: this._aiGenerated.html || '',
      js: this._aiGenerated.js || '',
      css: this._aiGenerated.css || '',
      createdAt: Date.now(),
      source: 'ai'
    };
    const modules = this.getUserModules();
    modules.push(module);
    this.saveUserModules(modules);
    App.closeModal();
    this.renderUserModules();
    App.toast(`功能「${module.name}」已创建`, 'success');
  },

  manualCreate() {
    const name = document.getElementById('manualName')?.value?.trim();
    const html = document.getElementById('manualHTML')?.value?.trim();
    const js = document.getElementById('manualJS')?.value?.trim();
    if (!name) { App.toast('请输入功能名称', 'error'); return; }
    if (!html && !js) { App.toast('请输入HTML或JS代码', 'error'); return; }

    const module = {
      id: 'custom_' + Date.now(),
      name,
      html: html || '<div>自定义功能</div>',
      js: js || '',
      css: '',
      createdAt: Date.now(),
      source: 'manual'
    };
    const modules = this.getUserModules();
    modules.push(module);
    this.saveUserModules(modules);
    this.renderUserModules();
    App.toast(`功能「${name}」已创建`, 'success');
  },

  testCode() {
    const js = document.getElementById('manualJS')?.value?.trim();
    if (!js) { App.toast('请输入JavaScript代码', 'error'); return; }
    try {
      // Create a safe sandbox
      const sandbox = new Function('Storage', 'App', 'APISettings', '"use strict";\n' + js);
      sandbox(Storage, App, APISettings);
      App.toast('代码语法检查通过', 'success');
    } catch (e) {
      App.toast('代码错误: ' + e.message, 'error');
    }
  },

  renderUserModules() {
    const c = document.getElementById('userModuleList');
    if (!c) return;
    const modules = this.getUserModules();
    if (modules.length === 0) { c.innerHTML = '<div class="empty-state"><div class="empty-icon">🛠️</div><p>还没有创建任何功能</p></div>'; return; }
    c.innerHTML = modules.map(m => `
      <div class="list-item">
        <span style="font-size:20px;">${m.source === 'ai' ? '🤖' : '📝'}</span>
        <div class="list-info">
          <h4>${m.name}</h4>
          <p>${m.source === 'ai' ? 'AI生成' : '手动编写'} · ${new Date(m.createdAt).toLocaleString()} · ${m.js?.length || 0}字符</p>
        </div>
        <button class="btn btn-sm btn-secondary" onclick="CustomCreator.viewModule('${m.id}')">👁️</button>
        <button class="btn btn-sm btn-primary" onclick="CustomCreator.runModule('${m.id}')">▶️ 运行</button>
        <button class="btn btn-sm btn-danger" onclick="CustomCreator.deleteModule('${m.id}')">🗑️</button>
      </div>
    `).join('');
  },

  viewModule(id) {
    const m = this.getUserModules().find(x => x.id === id);
    if (!m) return;
    App.showModal(`👁️ ${m.name}`, `
      <div style="max-height:60vh;overflow-y:auto;">
        ${m.css ? `<h4 style="color:var(--color-gold);">CSS</h4><div class="code-block">${this.escape(m.css)}</div>` : ''}
        ${m.html ? `<h4 style="color:var(--color-gold);">HTML</h4><div class="code-block">${this.escape(m.html)}</div>` : ''}
        ${m.js ? `<h4 style="color:var(--color-gold);">JavaScript</h4><div class="code-block">${this.escape(m.js)}</div>` : ''}
      </div>
    `);
  },

  runModule(id) {
    const m = this.getUserModules().find(x => x.id === id);
    if (!m) return;
    try {
      // Apply CSS if any
      if (m.css) {
        const style = document.createElement('style');
        style.id = 'custom_module_' + id;
        style.textContent = m.css;
        document.head.appendChild(style);
      }
      // Execute JS
      if (m.js) {
        const sandbox = new Function('Storage', 'App', 'APISettings', 'NovelRuntime', '"use strict";\n' + m.js);
        sandbox(Storage, App, APISettings, NovelRuntime);
      }
      App.toast(`「${m.name}」已运行`, 'success');
    } catch (e) { App.toast('运行失败: ' + e.message, 'error'); }
  },

  deleteModule(id) {
    if (!confirm('删除此功能？')) return;
    const modules = this.getUserModules().filter(m => m.id !== id);
    this.saveUserModules(modules);
    this.renderUserModules();
    // Remove CSS if applied
    const style = document.getElementById('custom_module_' + id);
    if (style) style.remove();
  },

  escape(text) {
    const d = document.createElement('div');
    d.textContent = text || '';
    return d.innerHTML;
  },

  showHelp() {
    App.showModal('❓ 功能创建器说明', `
      <div style="line-height:1.8;">
        <p><strong>AI辅助创建：</strong>描述你想要的功能，AI会自动生成HTML和JavaScript代码。</p>
        <p><strong>手动编写：</strong>直接输入HTML和JS代码创建功能。</p>
        <p><strong>可用API：</strong></p>
        <ul style="margin-left:20px;">
          <li><code>Storage.get(key, default)</code> - 读取数据</li>
          <li><code>Storage.set(key, value)</code> - 保存数据</li>
          <li><code>App.toast(msg, type)</code> - 显示提示</li>
          <li><code>App.showModal(title, content)</code> - 显示弹窗</li>
          <li><code>APISettings.chat(prompt, messages, opts)</code> - 调用AI</li>
        </ul>
        <p><strong>注意事项：</strong>代码在沙箱中运行，无法直接修改页面导航。创建的功能需要在「插件」页面手动注册到导航栏。</p>
      </div>
    `);
  }
};
