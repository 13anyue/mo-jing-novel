/**
 * =========================================================
 * Plugin System
 * Custom functions like plugins - can be independent or universal
 * Users can create, import, enable/disable plugins
 * =========================================================
 */
const Plugins = {
  _plugins: [],

  init() { this.loadPlugins(); this.renderPage(); },
  onEnter() { this.renderList(); },

  loadPlugins() { this._plugins = Storage.get('pluginsList', []); },
  savePlugins() { Storage.set('pluginsList', this._plugins); },

  renderPage() {
    const page = document.getElementById('page-plugins');
    if (!page) return;
    page.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);">
        <h2 class="section-title">🔌 插件工坊</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-primary" onclick="Plugins.createPlugin()">➕ 新建插件</button>
          <button class="btn btn-secondary" onclick="Plugins.importPlugin()">📥 导入</button>
        </div>
      </div>
      <div class="card" style="margin-bottom:var(--space-lg);">
        <div class="card-body">
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.7;">
            插件是自定义功能模块，可以独立运行，也可以与墨境引擎联动。<br>
            插件可以：添加新功能、修改UI、扩展数据类型、集成外部API...<br>
            支持从文件导入，也可以让墨境助手帮你编写后导入。
          </p>
        </div>
      </div>
      <div id="pluginList" class="grid grid-3"></div>
      <div class="modal-overlay" id="pluginEditorModal">
        <div class="modal xl">
          <div class="modal-header"><h3 id="pluginEditorTitle">插件编辑器</h3><button class="btn-icon" onclick="App.closeModal('pluginEditorModal')">✕</button></div>
          <div class="modal-body" id="pluginEditorBody"></div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="App.closeModal('pluginEditorModal')">取消</button>
            <button class="btn btn-primary" onclick="Plugins.savePlugin()">保存</button>
          </div>
        </div>
      </div>
    `;
    this.renderList();
  },

  renderList() {
    const c = document.getElementById('pluginList');
    if (!c) return;
    if (this._plugins.length === 0) { c.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">🔌</div><p>暂无插件</p></div>'; return; }
    c.innerHTML = this._plugins.map(p => `
      <div class="plugin-card" onclick="Plugins.editPlugin('${p.id}')">
        <div class="plugin-icon">${p.icon || '🔌'}</div>
        <h4>${p.name}</h4>
        <p>${p.description || '无描述'}</p>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
          <span class="plugin-status ${p.enabled ? 'enabled' : 'disabled'}">${p.enabled ? '已启用' : '已禁用'}</span>
          <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();Plugins.deletePlugin('${p.id}')">删除</button>
        </div>
      </div>
    `).join('');
  },

  createPlugin() {
    this._editingId = null;
    document.getElementById('pluginEditorTitle').textContent = '新建插件';
    document.getElementById('pluginEditorBody').innerHTML = `
      <div class="form-group"><label>插件名称</label><input type="text" id="pl_name" placeholder="如：好感度计算器"></div>
      <div class="form-group"><label>描述</label><input type="text" id="pl_desc" placeholder="插件功能说明"></div>
      <div class="form-group"><label>图标</label><input type="text" id="pl_icon" value="🔌" placeholder="emoji图标"></div>
      <div class="form-group"><label>插件代码 (JavaScript)</label>
        <textarea id="pl_code" rows="12" class="code-block" style="width:100%;min-height:200px;" placeholder="// 插件入口函数名为 run
// 可用全局对象：Storage, APISettings, App
// 示例：
function run() {
  // 你的代码
  return '插件运行结果';
}">function run() {
  // 插件入口
  return 'Hello from plugin!';
}</textarea>
      </div>
      <div class="form-group"><label><input type="checkbox" id="pl_enabled" checked style="width:auto;"> 启用插件</label></div>
      <div class="form-group"><label><input type="checkbox" id="pl_universal" checked style="width:auto;"> 通用插件（所有场景可用）</label></div>
      <div class="hint">插件代码将在安全沙箱中运行。可使用 Storage 读写数据，APISettings 调用AI。</div>
    `;
    App.openModal('pluginEditorModal');
  },

  editPlugin(id) {
    const p = this._plugins.find(x => x.id === id);
    if (!p) return;
    this._editingId = id;
    document.getElementById('pluginEditorTitle').textContent = '编辑插件';
    document.getElementById('pluginEditorBody').innerHTML = `
      <input type="hidden" id="pl_id" value="${p.id}">
      <div class="form-group"><label>插件名称</label><input type="text" id="pl_name" value="${p.name}" placeholder="插件名称"></div>
      <div class="form-group"><label>描述</label><input type="text" id="pl_desc" value="${p.description || ''}" placeholder="插件功能说明"></div>
      <div class="form-group"><label>图标</label><input type="text" id="pl_icon" value="${p.icon || '🔌'}" placeholder="emoji图标"></div>
      <div class="form-group"><label>插件代码</label><textarea id="pl_code" rows="12" class="code-block" style="width:100%;min-height:200px;">${p.code || ''}</textarea></div>
      <div class="form-group"><label><input type="checkbox" id="pl_enabled" ${p.enabled ? 'checked' : ''} style="width:auto;"> 启用</label></div>
      <div class="form-group"><label><input type="checkbox" id="pl_universal" ${p.universal !== false ? 'checked' : ''} style="width:auto;"> 通用插件</label></div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-gold" onclick="Plugins.runPlugin('${p.id}')">▶️ 运行测试</button>
      </div>
      <div id="pluginRunResult" style="margin-top:12px;"></div>
    `;
    App.openModal('pluginEditorModal');
  },

  savePlugin() {
    const id = document.getElementById('pl_id')?.value || ('plugin_' + Date.now());
    const p = {
      id, name: document.getElementById('pl_name').value,
      description: document.getElementById('pl_desc').value,
      icon: document.getElementById('pl_icon').value || '🔌',
      code: document.getElementById('pl_code').value,
      enabled: document.getElementById('pl_enabled')?.checked || false,
      universal: document.getElementById('pl_universal')?.checked !== false,
      createdAt: Date.now()
    };
    const idx = this._plugins.findIndex(x => x.id === id);
    if (idx >= 0) this._plugins[idx] = { ...this._plugins[idx], ...p };
    else this._plugins.push(p);
    this.savePlugins();
    App.closeModal('pluginEditorModal');
    this.renderList();
    App.toast('插件已保存', 'success');
  },

  runPlugin(id) {
    const p = this._plugins.find(x => x.id === id);
    if (!p || !p.code) return;
    try {
      const fn = new Function('Storage', 'APISettings', 'App', p.code + '; return typeof run === "function" ? run() : "无 run 函数";');
      const result = fn(Storage, APISettings, App);
      document.getElementById('pluginRunResult').innerHTML = `<div class="card" style="border-left:3px solid var(--color-gold);"><div class="card-body"><h4 style="color:var(--color-gold);">运行结果</h4><pre style="font-size:13px;margin-top:8px;">${this.escapeHtml(String(result))}</pre></div></div>`;
    } catch (e) {
      document.getElementById('pluginRunResult').innerHTML = `<div class="card" style="border-left:3px solid var(--color-danger);"><div class="card-body"><h4 style="color:var(--color-danger);">运行错误</h4><pre style="font-size:13px;margin-top:8px;">${this.escapeHtml(e.message)}</pre></div></div>`;
    }
  },

  deletePlugin(id) {
    if (!confirm('删除此插件？')) return;
    this._plugins = this._plugins.filter(p => p.id !== id);
    this.savePlugins();
    this.renderList();
  },

  importPlugin() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json,.js';
    input.onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try {
        const text = await file.text();
        let plugin;
        if (file.name.endsWith('.json')) { plugin = JSON.parse(text); }
        else {
          plugin = { id: 'plugin_' + Date.now(), name: file.name.replace(/\.js$/, ''), description: '导入的插件', icon: '🔌', code: text, enabled: false, universal: true, createdAt: Date.now() };
        }
        this._plugins.push(plugin);
        this.savePlugins();
        this.renderList();
        App.toast('插件已导入', 'success');
      } catch (e) { App.toast('导入失败: ' + e.message, 'error'); }
    };
    input.click();
  },

  escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
};
