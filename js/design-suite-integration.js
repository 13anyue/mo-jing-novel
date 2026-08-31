/**
 * =========================================================
 * Design Suite Integration v3
 * Page template library from design-suite-router
 * One-click apply preset page styles
 * =========================================================
 */
const DesignSuiteIntegration = {
  TEMPLATES: [
    { id: 'classic_vn', name: '经典视觉小说', desc: '底部对话框 + 中央立绘', preview: '🎮', config: { dialogPosition: 'bottom', portraitPosition: 'center-right', statusBarPosition: 'top-left' } },
    { id: 'immersive', name: '沉浸式体验', desc: '全屏背景 + 悬浮对话框', preview: '🌄', config: { dialogPosition: 'bottom', portraitPosition: 'full', statusBarPosition: 'top-right' } },
    { id: 'minimal', name: '极简风格', desc: '隐藏UI + 纯净阅读', preview: '📖', config: { dialogPosition: 'center', portraitPosition: 'center-right', statusBarPosition: 'hidden' } },
    { id: 'mobile', name: '手机优化', desc: '大按钮 + 触摸友好', preview: '📱', config: { dialogPosition: 'bottom', portraitPosition: 'center-right', statusBarPosition: 'bottom-left' } },
    { id: 'retro', name: '复古像素', desc: '像素风UI + 怀旧配色', preview: '👾', config: { dialogPosition: 'bottom', portraitPosition: 'center-right', statusBarPosition: 'top-left' } },
    { id: 'elegant', name: '典雅古风', desc: '卷轴式对话框 + 水墨边框', preview: '🏮', config: { dialogPosition: 'bottom', portraitPosition: 'center-right', statusBarPosition: 'top-right' } }
  ],

  init() { this.renderPage(); },
  onEnter() { this.renderTemplates(); },

  renderPage() {
    const page = document.getElementById('page-design-suite');
    if (!page) return;
    page.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:8px;">
        <h2 class="section-title">🎨 设计套件</h2>
        <button class="btn btn-secondary" onclick="DesignSuiteIntegration.showAbout()">ℹ️ 关于</button>
      </div>

      <div class="card" style="margin-bottom:var(--space-lg);">
        <div class="card-header"><h3>📐 页面模板库</h3></div>
        <div class="card-body">
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:var(--space-md);">
            选择预设模板一键应用到你的视觉小说。包含布局、配色、按钮样式等完整配置。
          </p>
          <div id="templateGrid" class="grid grid-3"></div>
        </div>
      </div>

      <div class="card" style="margin-bottom:var(--space-lg);">
        <div class="card-header"><h3>🎨 主题配色</h3></div>
        <div class="card-body">
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            ${this.renderColorPresets()}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3>🔧 自定义样式</h3></div>
        <div class="card-body">
          <div class="form-group"><label>自定义CSS（高级）</label><textarea id="customCSS" rows="6" placeholder="输入自定义CSS样式..."></textarea></div>
          <button class="btn btn-primary" onclick="DesignSuiteIntegration.applyCustomCSS()">应用样式</button>
        </div>
      </div>
    `;
    this.renderTemplates();
  },

  renderTemplates() {
    const grid = document.getElementById('templateGrid');
    if (!grid) return;
    grid.innerHTML = this.TEMPLATES.map(t => `
      <div class="card" style="cursor:pointer;transition:transform 0.2s;" onmouseenter="this.style.transform='translateY(-4px)'" onmouseleave="this.style.transform=''" onclick="DesignSuiteIntegration.applyTemplate('${t.id}')">
        <div style="height:120px;background:var(--bg-sidebar);display:flex;align-items:center;justify-content:center;font-size:48px;border-radius:var(--border-radius-sm) var(--border-radius-sm) 0 0;">${t.preview}</div>
        <div class="card-body" style="text-align:center;">
          <h4 style="font-size:15px;margin-bottom:4px;">${t.name}</h4>
          <p style="font-size:12px;color:var(--text-muted);">${t.desc}</p>
        </div>
      </div>
    `).join('');
  },

  renderColorPresets() {
    const presets = [
      { name: '墨境古风', primary: '#2C1810', gold: '#C9A227', bg: '#F5E6D3' },
      { name: '青云仙侠', primary: '#1a3a5c', gold: '#4a90c2', bg: '#e8f0f8' },
      { name: '红尘客栈', primary: '#5c1a1a', gold: '#d4a574', bg: '#f5e6d8' },
      { name: '竹林幽径', primary: '#1a3a1a', gold: '#7cb342', bg: '#e8f5e9' },
      { name: '紫禁之巅', primary: '#3a1a5c', gold: '#9c27b0', bg: '#f3e5f5' },
      { name: '水墨丹青', primary: '#1a1a1a', gold: '#666666', bg: '#f5f5f5' }
    ];
    return presets.map(p => `
      <div style="cursor:pointer;padding:12px;border:2px solid var(--border-color);border-radius:var(--border-radius);text-align:center;min-width:100px;" onclick="DesignSuiteIntegration.applyColorPreset('${p.primary}','${p.gold}','${p.bg}')">
        <div style="width:40px;height:40px;margin:0 auto 8px;border-radius:50%;background:linear-gradient(135deg, ${p.primary} 50%, ${p.gold} 50%);"></div>
        <div style="font-size:12px;">${p.name}</div>
      </div>
    `).join('');
  },

  applyTemplate(id) {
    const template = this.TEMPLATES.find(t => t.id === id);
    if (!template) return;
    if (UIDIY) {
      UIDIY.saveLayout(template.config);
      App.toast(`已应用「${template.name}」模板`, 'success');
    } else {
      App.toast('UI DIY模块未加载', 'error');
    }
  },

  applyColorPreset(primary, gold, bg) {
    const style = document.createElement('style');
    style.id = 'customColorPreset';
    style.textContent = `
      :root { --color-primary: ${primary} !important; --color-primary-dark: ${primary} !important; --color-gold: ${gold} !important; --bg-body: ${bg} !important; --bg-parchment: ${bg} !important; }
    `;
    const old = document.getElementById('customColorPreset');
    if (old) old.remove();
    document.head.appendChild(style);
    Storage.set('customColorPreset', { primary, gold, bg });
    App.toast('配色已应用', 'success');
  },

  applyCustomCSS() {
    const css = document.getElementById('customCSS')?.value?.trim();
    if (!css) { App.toast('请输入CSS', 'error'); return; }
    const style = document.createElement('style');
    style.id = 'userCustomCSS';
    style.textContent = css;
    const old = document.getElementById('userCustomCSS');
    if (old) old.remove();
    document.head.appendChild(style);
    Storage.set('userCustomCSS', css);
    App.toast('自定义样式已应用', 'success');
  },

  showAbout() {
    App.showModal('ℹ️ 设计套件', `
      <div style="line-height:1.8;">
        <p><strong>设计套件</strong>为墨境提供页面模板和配色方案。</p>
        <p>选择模板可一键调整布局、对话框位置、立绘位置等。</p>
        <p>高级用户可通过自定义CSS完全控制界面样式。</p>
      </div>
    `);
  },

  // Restore saved custom CSS on load
  restoreCustomCSS() {
    const preset = Storage.get('customColorPreset', null);
    if (preset) this.applyColorPreset(preset.primary, preset.gold, preset.bg);
    const css = Storage.get('userCustomCSS', '');
    if (css) {
      const style = document.createElement('style');
      style.id = 'userCustomCSS';
      style.textContent = css;
      document.head.appendChild(style);
    }
  }
};
