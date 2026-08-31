/**
 * =========================================================
 * PWA System v4 — 渐进式Web应用
 * manifest.json + Service Worker + 安装引导
 * Add-to-home-screen support for mobile
 * =========================================================
 */
const PWASystem = {
  init() { this.registerSW(); this.renderPage(); },
  onEnter() { this.renderInstallStatus(); },

  renderPage() {
    const page = document.getElementById('page-pwa');
    if (!page) return;
    page.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:8px;">
        <h2 class="section-title">📱 PWA 应用</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-primary" onclick="PWASystem.showInstallPrompt()">⬇️ 安装到手机</button>
          <button class="btn btn-secondary" onclick="PWASystem.generateManifest()">📄 生成配置</button>
        </div>
      </div>

      <div class="card" style="margin-bottom:var(--space-lg);">
        <div class="card-header"><h3>📲 安装到主屏幕</h3></div>
        <div class="card-body">
          <div id="installStatus" style="margin-bottom:var(--space-md);"></div>
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.8;margin-bottom:var(--space-md);">
            将墨境安装为手机/桌面应用，像普通App一样从主屏幕启动，无需浏览器地址栏。
          </p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-sm btn-secondary" onclick="PWASystem.showIOSInstallGuide()">📱 iOS安装指南</button>
            <button class="btn btn-sm btn-secondary" onclick="PWASystem.showAndroidInstallGuide()">🤖 Android安装指南</button>
            <button class="btn btn-sm btn-secondary" onclick="PWASystem.showDesktopInstallGuide()">💻 桌面安装指南</button>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:var(--space-lg);">
        <div class="card-header"><h3>⚙️ PWA配置</h3></div>
        <div class="card-body">
          <div class="form-group"><label>应用名称</label><input type="text" id="pwaAppName" value="墨境" placeholder="显示在主屏幕的名称"></div>
          <div class="form-group"><label>应用描述</label><input type="text" id="pwaAppDesc" value="AI视觉小说引擎" placeholder="应用描述"></div>
          <div class="form-group"><label>主题色</label><input type="color" id="pwaThemeColor" value="#2C1810"></div>
          <div class="form-group"><label>启动画面色</label><input type="color" id="pwaBgColor" value="#F5E6D3"></div>
          <div class="form-group"><label>显示模式</label>
            <select id="pwaDisplay">
              <option value="standalone">独立应用（推荐）</option>
              <option value="fullscreen">全屏</option>
              <option value="minimal-ui">最小UI</option>
            </select>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-primary" onclick="PWASystem.saveConfig()">💾 保存配置</button>
            <button class="btn btn-secondary" onclick="PWASystem.downloadManifest()">📥 下载 manifest.json</button>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:var(--space-lg);">
        <div class="card-header"><h3>🎨 图标设置</h3></div>
        <div class="card-body">
          <div style="display:flex;gap:var(--space-md);flex-wrap:wrap;">
            <div style="text-align:center;">
              <div id="pwaIconPreview" style="width:128px;height:128px;background:var(--bg-sidebar);border-radius:24px;display:flex;align-items:center;justify-content:center;font-size:48px;margin:0 auto 8px;">📱</div>
              <p style="font-size:12px;color:var(--text-muted);">192×192 图标</p>
            </div>
            <div style="flex:1;min-width:200px;">
              <div class="form-group">
                <label>上传图标</label>
                <div class="upload-zone" onclick="document.getElementById('pwaIconInput').click()">
                  <div class="upload-icon">🖼️</div><p>点击上传 192×192 PNG</p>
                </div>
                <input type="file" id="pwaIconInput" accept="image/png,image/jpeg" style="display:none;" onchange="PWASystem.handleIconUpload(event)">
              </div>
              <div class="hint">建议使用192×192或512×512像素的PNG图片，支持透明背景。</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3>📊 状态</h3></div>
        <div class="card-body">
          <div id="pwaStatusInfo"></div>
        </div>
      </div>
    `;
    this.renderInstallStatus();
    this.loadConfig();
  },

  // ===== Service Worker Registration =====
  async registerSW() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }
    try {
      const swCode = this.generateServiceWorkerCode();
      const blob = new Blob([swCode], { type: 'application/javascript' });
      const swUrl = URL.createObjectURL(blob);
      const registration = await navigator.serviceWorker.register(swUrl);
      console.log('SW registered:', registration.scope);
      this._swRegistration = registration;
    } catch (e) {
      console.error('SW registration failed:', e);
    }
  },

  generateServiceWorkerCode() {
    return `
      const CACHE_NAME = 'mojing-v4-cache-v1';
      const urlsToCache = ['/'];

      self.addEventListener('install', (event) => {
        event.waitUntil(
          caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
        );
        self.skipWaiting();
      });

      self.addEventListener('activate', (event) => {
        event.waitUntil(self.clients.claim());
      });

      self.addEventListener('fetch', (event) => {
        event.respondWith(
          caches.match(event.request).then((response) => {
            if (response) return response;
            return fetch(event.request).catch(() => {
              // Fallback for offline
              return new Response('<html><body style="background:#2C1810;color:#F5E6D3;text-align:center;padding:40px;"><h1>墨境</h1><p>离线模式</p></body></html>', {
                headers: { 'Content-Type': 'text/html' }
              });
            });
          })
        );
      });
    `;
  },

  // ===== Manifest Generation =====
  generateManifest() {
    const name = document.getElementById('pwaAppName')?.value || '墨境';
    const desc = document.getElementById('pwaAppDesc')?.value || 'AI视觉小说引擎';
    const theme = document.getElementById('pwaThemeColor')?.value || '#2C1810';
    const bg = document.getElementById('pwaBgColor')?.value || '#F5E6D3';
    const display = document.getElementById('pwaDisplay')?.value || 'standalone';
    const iconId = Storage.get('pwaIconId', null);

    const manifest = {
      name: name,
      short_name: name.slice(0, 12),
      description: desc,
      start_url: '.',
      display: display,
      background_color: bg,
      theme_color: theme,
      orientation: 'portrait',
      icons: iconId ? [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
      ] : []
    };

    return JSON.stringify(manifest, null, 2);
  },

  downloadManifest() {
    const json = this.generateManifest();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'manifest.json'; a.click();
    URL.revokeObjectURL(url);
    App.toast('manifest.json 已下载', 'success');
  },

  // ===== Install Prompt =====
  showInstallPrompt() {
    if (this._deferredPrompt) {
      this._deferredPrompt.prompt();
      this._deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          App.toast('墨境已安装到主屏幕', 'success');
        }
        this._deferredPrompt = null;
      });
    } else {
      // Show manual instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) this.showIOSInstallGuide();
      else this.showAndroidInstallGuide();
    }
  },

  // Listen for beforeinstallprompt
  setupInstallListener() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this._deferredPrompt = e;
      this.renderInstallStatus();
    });
    window.addEventListener('appinstalled', () => {
      this._deferredPrompt = null;
      App.toast('墨境安装成功', 'success');
      this.renderInstallStatus();
    });
  },

  renderInstallStatus() {
    const el = document.getElementById('installStatus');
    if (!el) return;
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    if (isInstalled) {
      el.innerHTML = '<div style="background:rgba(76,175,80,0.1);border:1px solid #4CAF50;border-radius:var(--border-radius);padding:12px;color:#4CAF50;font-size:14px;">✅ 墨境已作为应用安装</div>';
    } else if (this._deferredPrompt) {
      el.innerHTML = '<div style="background:rgba(201,162,39,0.1);border:1px solid var(--color-gold);border-radius:var(--border-radius);padding:12px;color:var(--color-gold);font-size:14px;">📲 可以安装到主屏幕！点击上方按钮</div>';
    } else {
      el.innerHTML = '<div style="background:var(--bg-parchment);border:1px dashed var(--border-color);border-radius:var(--border-radius);padding:12px;color:var(--text-muted);font-size:14px;">💡 使用浏览器打开本页面，可安装为独立应用</div>';
    }

    const statusEl = document.getElementById('pwaStatusInfo');
    if (statusEl) {
      statusEl.innerHTML = `
        <p style="font-size:13px;color:var(--text-secondary);line-height:1.8;">
          <strong>Service Worker：</strong>${'serviceWorker' in navigator ? '✅ 已注册' : '❌ 浏览器不支持'}<br>
          <strong>安装状态：</strong>${isInstalled ? '✅ 已安装为应用' : '⏳ 未安装'}<br>
          <strong>离线缓存：</strong>${'caches' in window ? '✅ 支持' : '❌ 不支持'}<br>
          <strong>浏览器：</strong>${navigator.userAgent.split(' ').pop() || '未知'}
        </p>
      `;
    }
  },

  // ===== Install Guides =====
  showIOSInstallGuide() {
    App.showModal('📱 iOS 安装指南', `
      <div style="line-height:1.8;">
        <p><strong>Safari 浏览器：</strong></p>
        <ol style="margin-left:20px;margin-top:8px;">
          <li>使用 Safari 打开本页面</li>
          <li>点击底部「分享」按钮（方框+箭头图标）</li>
          <li>向上滑动，找到「添加到主屏幕」</li>
          <li>点击「添加」</li>
        </ol>
        <p style="margin-top:16px;color:var(--text-muted);font-size:13px;">安装后，墨境会像普通App一样显示在主屏幕上。</p>
      </div>
    `);
  },

  showAndroidInstallGuide() {
    App.showModal('🤖 Android 安装指南', `
      <div style="line-height:1.8;">
        <p><strong>Chrome 浏览器：</strong></p>
        <ol style="margin-left:20px;margin-top:8px;">
          <li>使用 Chrome 打开本页面</li>
          <li>点击右上角「⋮」菜单</li>
          <li>选择「添加到主屏幕」或「安装应用」</li>
          <li>点击「安装」</li>
        </ol>
        <p style="margin-top:12px;"><strong>三星浏览器 / Edge：</strong></p>
        <ol style="margin-left:20px;">
          <li>点击底部菜单或「⋮」</li>
          <li>选择「添加页面到」→「主屏幕」</li>
        </ol>
      </div>
    `);
  },

  showDesktopInstallGuide() {
    App.showModal('💻 桌面安装指南', `
      <div style="line-height:1.8;">
        <p><strong>Chrome / Edge：</strong></p>
        <ol style="margin-left:20px;margin-top:8px;">
          <li>地址栏右侧会出现「➕ 安装」图标</li>
          <li>点击它，选择「安装」</li>
          <li>或点击「⋮」菜单 → 「保存并分享」→ 「创建快捷方式」</li>
        </ol>
        <p style="margin-top:12px;"><strong>macOS Safari：</strong></p>
        <ol style="margin-left:20px;">
          <li>「文件」→「添加到 Dock」</li>
        </ol>
      </div>
    `);
  },

  // ===== Config =====
  saveConfig() {
    const config = {
      name: document.getElementById('pwaAppName')?.value || '墨境',
      description: document.getElementById('pwaAppDesc')?.value || 'AI视觉小说引擎',
      themeColor: document.getElementById('pwaThemeColor')?.value || '#2C1810',
      bgColor: document.getElementById('pwaBgColor')?.value || '#F5E6D3',
      display: document.getElementById('pwaDisplay')?.value || 'standalone'
    };
    Storage.set('pwaConfig', config);
    App.toast('PWA配置已保存', 'success');
    this.updateMetaTags(config);
  },

  loadConfig() {
    const config = Storage.get('pwaConfig', {});
    if (config.name) {
      const n = document.getElementById('pwaAppName'); if (n) n.value = config.name;
    }
    if (config.description) {
      const d = document.getElementById('pwaAppDesc'); if (d) d.value = config.description;
    }
    if (config.themeColor) {
      const t = document.getElementById('pwaThemeColor'); if (t) t.value = config.themeColor;
    }
    if (config.bgColor) {
      const b = document.getElementById('pwaBgColor'); if (b) b.value = config.bgColor;
    }
    if (config.display) {
      const dis = document.getElementById('pwaDisplay'); if (dis) dis.value = config.display;
    }
  },

  updateMetaTags(config) {
    // Update meta theme-color
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = config.themeColor || '#2C1810';
  },

  // ===== Icon Upload =====
  async handleIconUpload(e) {
    const file = e.target.files[0]; if (!file) return;
    try {
      const data = await Storage.fileToDataUrl(file);
      const id = 'pwa_icon_' + Date.now();
      await Storage.saveImage(id, 'pwa_icon', null, file.name, data, { size: file.size });
      Storage.set('pwaIconId', id);
      const preview = document.getElementById('pwaIconPreview');
      if (preview) preview.innerHTML = `<img src="${data}" style="width:100%;height:100%;object-fit:cover;border-radius:24px;">`;
      App.toast('图标已上传', 'success');
    } catch (err) { App.toast('上传失败: ' + err.message, 'error'); }
  }
};

// Auto-setup install listener on load
document.addEventListener('DOMContentLoaded', () => {
  if (window.PWASystem) PWASystem.setupInstallListener();
});
