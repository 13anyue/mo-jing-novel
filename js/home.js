/**
 * =========================================================
 * Home Page v4.1 — 沉浸式启动页（易次元风格升级版）
 * 全屏背景 + 精致毛玻璃标题 + 底部入口卡片
 * 特性：大圆角、悬停发光、触摸反馈、 stagger 入场动画
 * =========================================================
 */
const HomePage = {
  init() { this.renderPage(); },
  onEnter() { this._refreshWorldBg(); this._updateHomeThemeStyles(); },

  /** 获取当前主题ID */
  _getCurrentThemeId() {
    if (typeof App !== 'undefined' && App.getCurrentThemeId) return App.getCurrentThemeId();
    try { return Storage.get('currentThemeId', 'ancient'); } catch(e) { return 'ancient'; }
  },

  /** 根据主题动态调整主页样式 */
  _updateHomeThemeStyles() {
    const themeId = this._getCurrentThemeId();
    const bgContainer = document.getElementById('homeBgContainer');
    if (!bgContainer) return;
    // 主题渐变背景映射
    const gradients = {
      ancient: 'linear-gradient(180deg, #4a7c59 0%, #2d5a3d 50%, #1a3a2a 100%)',
      modern:  'linear-gradient(180deg, #4a6fa5 0%, #2c3e50 50%, #1a252f 100%)',
      scifi:   'linear-gradient(180deg, #1a1a3e 0%, #0a0e1a 50%, #050814 100%)',
      campus:  'linear-gradient(180deg, #5CB85C 0%, #2d8f2d 50%, #1a6b1a 100%)',
      dark:    'linear-gradient(180deg, #2a2a2a 0%, #0d0d0d 50%, #000000 100%)'
    };
    const bgUrl = this._getWorldBgUrl();
    if (!bgUrl) {
      bgContainer.style.background = gradients[themeId] || gradients.ancient;
      bgContainer.style.backgroundImage = '';
    }
    // 动态调整卡片透明度与强调色
    const entryCards = document.querySelectorAll('.home-entry-card');
    const isDark = themeId === 'scifi' || themeId === 'dark';
    entryCards.forEach(card => {
      if (isDark) {
        card.style.background = 'rgba(0,0,0,0.35)';
        card.style.borderColor = 'rgba(255,255,255,0.15)';
      } else {
        card.style.background = 'rgba(255,255,255,0.12)';
        card.style.borderColor = 'rgba(255,255,255,0.2)';
      }
    });
    // 更新图标按钮渐变
    const iconBtns = document.querySelectorAll('.home-entry-icon');
    iconBtns.forEach(btn => {
      btn.style.background = 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))';
    });
  },

  _getWorldBgUrl() {
    try {
      if (typeof WorldviewEngine !== 'undefined' && WorldviewEngine.currentConfig) {
        const cfg = WorldviewEngine.currentConfig;
        if (cfg && cfg.backgroundImage) return cfg.backgroundImage;
        if (cfg && cfg.theme && cfg.theme.backgroundImage) return cfg.theme.backgroundImage;
      }
    } catch (e) {}
    try {
      const savedBg = Storage.get('homeWorldBg_v1');
      if (savedBg) return savedBg;
    } catch (e) {}
    return null;
  },

  _refreshWorldBg() {
    const container = document.getElementById('homeBgContainer');
    if (!container) return;
    const bgUrl = this._getWorldBgUrl();
    if (bgUrl) {
      container.style.backgroundImage = `url('${bgUrl}')`;
      container.style.backgroundSize = 'cover';
      container.style.backgroundPosition = 'center';
    } else {
      this._updateHomeThemeStyles();
    }
  },

  renderPage() {
    const page = document.getElementById('page-home');
    if (!page) return;
    const bgUrl = this._getWorldBgUrl();
    const themeId = this._getCurrentThemeId();
    const gradients = {
      ancient: 'linear-gradient(180deg, #4a7c59 0%, #2d5a3d 50%, #1a3a2a 100%)',
      modern:  'linear-gradient(180deg, #4a6fa5 0%, #2c3e50 50%, #1a252f 100%)',
      scifi:   'linear-gradient(180deg, #1a1a3e 0%, #0a0e1a 50%, #050814 100%)',
      campus:  'linear-gradient(180deg, #5CB85C 0%, #2d8f2d 50%, #1a6b1a 100%)',
      dark:    'linear-gradient(180deg, #2a2a2a 0%, #0d0d0d 50%, #000000 100%)'
    };
    const bgStyle = bgUrl
      ? `background-image:url('${bgUrl}');background-size:cover;background-position:center;`
      : `background:${gradients[themeId] || gradients.ancient};`;

    page.innerHTML = `
      <style>
        /* 入场动画定义 */
        @keyframes homeFadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes homeScaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes homeGlowPulse {
          0%, 100% { box-shadow: 0 0 40px rgba(201,162,39,0.12), 0 8px 32px rgba(0,0,0,0.3); }
          50%      { box-shadow: 0 0 60px rgba(201,162,39,0.22), 0 8px 32px rgba(0,0,0,0.3); }
        }
        /* 标题卡片入场 */
        .home-title-card {
          animation: homeFadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        /* 入口卡片依次弹出（stagger 延迟） */
        .home-entry-card {
          animation: homeFadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .home-entry-card:nth-child(1) { animation-delay: 0.15s; }
        .home-entry-card:nth-child(2) { animation-delay: 0.25s; }
        .home-entry-card:nth-child(3) { animation-delay: 0.35s; }
        .home-entry-card:nth-child(4) { animation-delay: 0.45s; }
        /* 悬停发光效果 */
        .home-entry-card {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .home-entry-card:hover {
          background: rgba(255,255,255,0.22) !important;
          transform: translateY(-3px) !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.25), 0 0 16px rgba(201,162,39,0.15) !important;
          border-color: rgba(255,255,255,0.35) !important;
        }
        .home-entry-card:active {
          transform: scale(0.97) !important;
          transition-duration: 0.1s;
        }
        /* 移动端适配 */
        @media (max-width: 375px) {
          .home-title-card h1 { font-size: 32px !important; letter-spacing: 6px !important; }
          .home-title-card p  { font-size: 15px !important; letter-spacing: 2px !important; }
          .home-title-card .sub { font-size: 10px !important; letter-spacing: 2px !important; }
          .home-entry-card { padding: 14px 16px !important; gap: 12px !important; }
          .home-entry-icon  { width: 44px !important; height: 44px !important; }
          .home-entry-icon svg { width: 20px !important; height: 20px !important; }
          .home-entry-title   { font-size: 16px !important; }
          .home-entry-sub     { font-size: 12px !important; }
          .home-entry-arrow   { width: 18px !important; height: 18px !important; }
        }
      </style>

      <div id="homeBgContainer" style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:0;${bgStyle}transition:background-image 0.5s ease;">
        <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.7) 100%);"></div>
      </div>
      <div style="position:relative;z-index:1;height:env(safe-area-inset-top, 24px);min-height:24px;"></div>
      <div style="position:relative;z-index:1;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;">
        <!-- 毛玻璃标题卡片：更大模糊半径 + 边框发光 -->
        <div class="home-title-card" style="background:rgba(255,255,255,0.12);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-radius:28px;padding:32px 56px;text-align:center;border:1px solid rgba(255,255,255,0.3);box-shadow:0 0 40px rgba(201,162,39,0.12),0 8px 32px rgba(0,0,0,0.3);max-width:90vw;animation: homeFadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards, homeGlowPulse 3s ease-in-out infinite 0.8s;">
          <h1 style="font-family:'Noto Serif SC',serif;font-size:40px;color:#fff;letter-spacing:10px;margin-bottom:6px;text-shadow:0 2px 8px rgba(0,0,0,0.5);">墨境</h1>
          <p style="font-family:'Noto Serif SC',serif;font-size:18px;color:rgba(255,255,255,0.9);letter-spacing:4px;font-style:italic;text-shadow:0 1px 4px rgba(0,0,0,0.4);">Story World</p>
          <p class="sub" style="font-size:12px;color:rgba(255,255,255,0.6);letter-spacing:3px;margin-top:10px;text-transform:uppercase;">Switch & Edit World</p>
        </div>
      </div>
      <div style="position:relative;z-index:1;padding:0 20px 28px 20px;display:flex;flex-direction:column;gap:12px;">
        ${this._renderEntryCard({ idx:0, icon:'game', title:'开始冒险', subtitle:'继续最近的故事', onclick:"HomePage._startAdventure()" })}
        ${this._renderEntryCard({ idx:1, icon:'world', title:'选择世界', subtitle:'切换或管理存档', onclick:"App.navigate('world-selector')" })}
        ${this._renderEntryCard({ idx:2, icon:'npc', title:'我的角色', subtitle:'管理玩家化身与收录角色卡', onclick:"App.navigate('hero')" })}
        ${this._renderEntryCard({ idx:3, icon:'palette', title:'切换主题', subtitle:'循环切换古风/现代/科幻/校园/暗黑', onclick:"App.toggleTheme()" })}
        ${this._renderEntryCard({ idx:4, icon:'settings', title:'设置', subtitle:'API & 主题高级设置', onclick:"App.navigate('settings-hub')" })}
      </div>
      <div style="position:relative;z-index:1;height:env(safe-area-inset-bottom, 12px);min-height:12px;"></div>
    `;
    page.style.display = 'flex';
    page.style.flexDirection = 'column';
    page.style.minHeight = '100vh';
    page.style.padding = '0';
  },

  _renderEntryCard(p) {
    const icons = {
      game: '<polygon points="5 3 19 12 5 21 5 3"/>',
      world: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>',
      npc: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      palette: '<circle cx="13.5" cy="6.5" r="0.5"/><circle cx="17.5" cy="10.5" r="0.5"/><circle cx="8.5" cy="7.5" r="0.5"/><circle cx="6.5" cy="12.5" r="0.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.01 17.461 2 12 2z"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.62 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>'
    };
    const svgPath = icons[p.icon] || icons.game;
    return `
      <div onclick="${p.onclick}" class="home-entry-card"
           style="background:rgba(255,255,255,0.12);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-radius:22px;padding:16px 20px;display:flex;align-items:center;gap:16px;border:1px solid rgba(255,255,255,0.2);cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
        <div class="home-entry-icon" style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,0.2);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgPath}</svg>
        </div>
        <div style="flex:1;">
          <div class="home-entry-title" style="font-size:18px;font-weight:600;color:#fff;letter-spacing:2px;font-family:'Noto Serif SC',serif;">${p.title}</div>
          <div class="home-entry-sub" style="font-size:13px;color:rgba(255,255,255,0.65);margin-top:3px;">${p.subtitle}</div>
        </div>
        <svg class="home-entry-arrow" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    `;
  },

  _startAdventure() {
    try {
      const lastSave = Storage.get('lastSaveSlot_v1');
      if (lastSave && lastSave.worldId) {
        if (typeof NovelRuntime !== 'undefined') {
          NovelRuntime._state.npcId = lastSave.npcId || null;
          NovelRuntime._state.scene = lastSave.scene || '起始场景';
          NovelRuntime._state.history = lastSave.history || [];
        }
        App.navigate('runtime');
        App.toast('已恢复上次冒险', 'success');
        return;
      }
    } catch (e) {}
    App.navigate('world-selector');
  }
};
