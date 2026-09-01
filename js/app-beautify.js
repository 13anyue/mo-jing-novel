/**
 * =========================================================
 * AppBeautify vv7 美化中心
 * 模块名：AppBeautify
 * 功能：主题配色、字体、边框、动效、背景粒子效果自定义
 * =========================================================
 */
const AppBeautify = {
  PRESETS: [
    { name: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20"/><path d="M12 2l4 4"/><path d="M12 2l-4 4"/><path d="M12 22l4-4"/><path d="M12 22l-4-4"/></svg> 墨境古风', primary: '#C9A227', bg: '#F5E6D3', text: '#2C1810', accent: '#8B4513' },
    { name: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg> 深夜模式', primary: '#64B5F6', bg: '#1a1a2e', text: '#e0e0e0', accent: '#90CAF9' },
    { name: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 7.5a4.5 4.5 0 10-4.5 4.5"/><path d="M12 7.5a4.5 4.5 0 014.5 4.5"/><path d="M12 7.5V3"/><path d="M7.5 12H3"/><path d="M16.5 12H21"/><path d="M12 16.5V21"/><circle cx="12" cy="12" r="9"/></svg> 樱花粉', primary: '#FF69B4', bg: '#FFF0F5', text: '#4a4a4a', accent: '#FFB6C1' },
    { name: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22v-8"/><path d="M12 14l-4-4"/><path d="M12 14l4-4"/><path d="M12 10V2"/><path d="M12 2l-3 3"/><path d="M12 2l3 3"/></svg> 森林绿', primary: '#2E7D32', bg: '#E8F5E9', text: '#1B5E20', accent: '#66BB6A' },
    { name: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12c0 3 2 5 5 5s5-2 5-5-2-5-5-5-5 2-5 5z"/><path d="M12 12c0 3 2 5 5 5s5-2 5-5-2-5-5-5-5 2-5 5z"/><path d="M7 12c0 3 2 5 5 5s5-2 5-5-2-5-5-5-5 2-5 5z"/></svg> 海洋蓝', primary: '#0277BD', bg: '#E1F5FE', text: '#01579B', accent: '#4FC3F7' }
  ],

    // 初始化模块入口
  init() {
    // v7: 外部模块依赖检查
    if (typeof Storage === 'undefined') { console.warn('[v7] Storage模块未加载'); return; }
    this.renderPage(); },
    // 页面进入时调用
  onEnter() {
    this.renderBeautifyInterface(); },

    // 渲染页面主结构
  renderPage() {
    const page = document.getElementById('page-beautify');
    if (!page) return;
    page.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
      <div id="beautifyInterface"></div>`;
    this.renderBeautifyInterface();
  },

  renderBeautifyInterface() {
    const c = document.getElementById('beautifyInterface');
    if (!c) return;
    const current = Storage.get('themeConfig', this.PRESETS[0]);
    c.innerHTML = `
      <div style="padding:var(--space-lg);max-width:800px;margin:0 auto;">
        <h3 style="margin-bottom:var(--space-lg);font-size:20px;">🎨 美化中心</h3>

        <!-- 预设主题 -->
        <div class="card" style="margin-bottom:var(--space-md);">
          <div class="card-header"><h4>快速主题</h4></div>
          <div class="card-body">
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;">
              ${this.PRESETS.map((p, i) => `
                <div style="padding:16px;border-radius:var(--border-radius);cursor:pointer;border:2px solid ${current.name === p.name ? 'var(--color-gold)' : 'transparent'};background:${p.bg};color:${p.text};"
                     onclick="AppBeautify.applyPreset(${i})">
                  <div style="font-size:24px;margin-bottom:8px;">${p.name.split(' ')[0]}</div>
                  <div style="font-size:13px;">${p.name.split(' ')[1]}</div>
                  <div style="margin-top:8px;height:4px;background:${p.primary};border-radius:2px;"></div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- 自定义配色 -->
        <div class="card" style="margin-bottom:var(--space-md);">
          <div class="card-header"><h4>自定义配色</h4></div>
          <div class="card-body">
            <div class="form-group">
              <label>主色调</label>
              <input type="color" id="customPrimary" value="${current.primary || '#C9A227'}">
            </div>
            <div class="form-group">
              <label>背景色</label>
              <input type="color" id="customBg" value="${current.bg || '#F5E6D3'}">
            </div>
            <div class="form-group">
              <label>文字色</label>
              <input type="color" id="customText" value="${current.text || '#2C1810'}">
            </div>
            <div class="form-group">
              <label>强调色</label>
              <input type="color" id="customAccent" value="${current.accent || '#8B4513'}">
            </div>
            <button class="btn btn-primary" onclick="AppBeautify.applyCustom()">应用自定义</button>
          </div>
        </div>

        <!-- 粒子效果 -->
        <div class="card" style="margin-bottom:var(--space-md);">
          <div class="card-header"><h4><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2 7h7l-5.5 4 2 7-5.5-4-5.5 4 2-7L3 9h7z"/></svg> 背景效果</h4></div>
          <div class="card-body">
            <label style="display:flex;align-items:center;gap:8px;margin-bottom:10px;cursor:pointer;">
              <input type="checkbox" id="enableParticles" ${Storage.get('enableParticles', false) ? 'checked' : ''} style="width:auto;">
              <span>启用粒子飘落效果（樱花/雪花/枫叶）</span>
            </label>
            <div class="form-group">
              <label>粒子类型</label>
              <select id="particleType">
                <option value="sakura" ${Storage.get('particleType', 'sakura') === 'sakura' ? 'selected' : ''}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 7.5a4.5 4.5 0 10-4.5 4.5"/><path d="M12 7.5a4.5 4.5 0 014.5 4.5"/><path d="M12 7.5V3"/><path d="M7.5 12H3"/><path d="M16.5 12H21"/><path d="M12 16.5V21"/><circle cx="12" cy="12" r="9"/></svg> 樱花</option>
                <option value="snow" ${Storage.get('particleType') === 'snow' ? 'selected' : ''}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/><line x1="19.07" y1="4.93" x2="4.93" y2="19.07"/></svg> 雪花</option>
                <option value="leaf" ${Storage.get('particleType') === 'leaf' ? 'selected' : ''}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l-3 4"/><path d="M12 2l3 4"/><path d="M12 22V10"/><path d="M12 10l-5 3"/><path d="M12 10l5 3"/><path d="M7 13l-5 2"/><path d="M17 13l5 2"/><path d="M2 15l5-2"/><path d="M22 15l-5-2"/></svg> 枫叶</option>
                <option value="star" ${Storage.get('particleType') === 'star' ? 'selected' : ''}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> 星光</option>
              </select>
            </div>
            <button class="btn btn-primary" onclick="AppBeautify.saveParticles()">保存效果</button>
          </div>
        </div>

        <!-- 字体 -->
        <div class="card">
          <div class="card-header"><h4>📝 字体设置</h4></div>
          <div class="card-body">
            <div class="form-group">
              <label>界面字体</label>
              <select id="uiFont">
                <option value="serif" ${Storage.get('uiFont', 'serif') === 'serif' ? 'selected' : ''}>宋体 / Serif</option>
                <option value="sans-serif" ${Storage.get('uiFont') === 'sans-serif' ? 'selected' : ''}>黑体 / Sans-serif</option>
                <option value="monospace" ${Storage.get('uiFont') === 'monospace' ? 'selected' : ''}>等宽 / Monospace</option>
              </select>
            </div>
            <button class="btn btn-primary" onclick="AppBeautify.saveFont()">保存字体</button>
          </div>
        </div>
      </div>
    `;
  },

  applyPreset(index) {
    const preset = this.PRESETS[index];
    try { Storage.set('themeConfig', preset); } catch(e) { console.warn('[v7] Storage.set失败:', e); }
    this.applyTheme(preset);
    this.renderBeautifyInterface();
    App.toast('主题已切换：' + preset.name, 'success');
  },

  applyCustom() {
    const config = {
      name: '自定义',
      primary: document.getElementById('customPrimary')?.value || '#C9A227',
      bg: document.getElementById('customBg')?.value || '#F5E6D3',
      text: document.getElementById('customText')?.value || '#2C1810',
      accent: document.getElementById('customAccent')?.value || '#8B4513'
    };
    try { Storage.set('themeConfig', config); } catch(e) { console.warn('[v7] Storage.set失败:', e); }
    this.applyTheme(config);
    App.toast('自定义主题已应用', 'success');
  },

  applyTheme(config) {
    const root = document.documentElement;
    if (config.primary) root.style.setProperty('--color-gold', config.primary);
    if (config.bg) root.style.setProperty('--bg-parchment', config.bg);
    if (config.text) root.style.setProperty('--color-ink', config.text);
    if (config.accent) root.style.setProperty('--color-accent', config.accent);
  },

  saveParticles() {
    try { Storage.set('enableParticles', document.getElementById('enableParticles')?.checked || false); } catch(e) { console.warn('[v7] Storage.set失败:', e); }
    try { Storage.set('particleType', document.getElementById('particleType')?.value || 'sakura'); } catch(e) { console.warn('[v7] Storage.set失败:', e); }
    App.toast('背景效果已保存', 'success');
  },

  saveFont() {
    const font = document.getElementById('uiFont')?.value || 'serif';
    try { Storage.set('uiFont', font); } catch(e) { console.warn('[v7] Storage.set失败:', e); }
    document.body.style.fontFamily = font === 'serif' ? '"Noto Serif SC", serif' :
      font === 'sans-serif' ? '"Noto Sans SC", sans-serif' : 'monospace';
    App.toast('字体已保存', 'success');
  }
};
