/**
 * =========================================================
 * HomePage v8 — 古风主操作面板（截图风格重设计）
 * 配色：羊皮纸底色 #F5E6D3 + 金色高亮 #C9A227 + 墨色 #2C1810
 * 结构：顶部状态条 | 左-中-右三栏 | 底部功能导航 | 回府按钮
 * =========================================================
 */
const HomePage = {
  /** 页面初始化入口 */
  init() { this.renderPage(); },

  /** 每次进入本页面时重新渲染 */
  onEnter() { this.renderPage(); },

  /** =========================================================
   *  主渲染方法：构建完整的古风操作面板 HTML
   * ========================================================= */
  renderPage() {
    const page = document.getElementById('page-home');
    if (!page) return;

    // 从本地存储或默认值读取玩家数据
    const playerName   = this._safeGet('playerName',   '苏砚书');
    const playerTitle  = this._safeGet('playerTitle',  '从九品·宝林');
    const playerAvatar = this._safeGet('playerAvatar', '');
    const playerLevel  = this._safeGet('playerLevel',  '30');

    // 构建主面板 HTML
    page.innerHTML = `
      <div id="homeDashboard" style="display:flex;flex-direction:column;height:100%;background:#F5E6D3;overflow:hidden;font-family:'Noto Serif SC',serif;">
        <!-- ① 顶部状态条 -->
        ${this._renderTopBar(playerName, playerTitle, playerAvatar, playerLevel)}

        <!-- ② 中间三栏区域 -->
        ${this._renderMainArea()}

        <!-- ③ 底部功能导航 -->
        ${this._renderBottomNav()}

        <!-- ④ 右下角「回府」大按钮 -->
        <div class="home-back-btn" onclick="HomePage.scrollToTop()" title="回到顶部">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span>回府</span>
        </div>

        <!-- ⑤ 内联样式 -->
        <style>
          /* ===== 顶部状态条 ===== */
          .home-topbar {
            display: flex; align-items: center; justify-content: space-between;
            padding: 8px 14px;
            background: #2C1810;
            border-bottom: 2px solid #C9A227;
            color: #F5E6D3;
            flex-shrink: 0;
          }
          .home-topbar-left {
            display: flex; align-items: center; gap: 10px;
          }
          .home-avatar {
            width: 44px; height: 44px; border-radius: 50%;
            border: 2px solid #C9A227;
            overflow: hidden; flex-shrink: 0;
            background: #4a2e1a;
            display: flex; align-items: center; justify-content: center;
          }
          .home-avatar img { width: 100%; height: 100%; object-fit: cover; }
          .home-avatar-placeholder {
            color: #C9A227; font-size: 20px; font-family: serif;
          }
          .home-player-info {
            display: flex; flex-direction: column; gap: 2px;
          }
          .home-player-name {
            font-size: 16px; font-weight: 700; color: #F5E6D3;
          }
          .home-player-title {
            font-size: 11px; color: #C9A227;
            background: rgba(201,162,39,0.18);
            padding: 1px 7px; border-radius: 4px;
            border: 1px solid rgba(201,162,39,0.35);
            display: inline-block; width: fit-content;
          }
          .home-topbar-right {
            display: flex; align-items: center; gap: 12px;
          }
          .home-currency {
            display: flex; align-items: center; gap: 4px;
            font-size: 14px; font-weight: 600; color: #C9A227;
          }
          .home-currency svg { width: 18px; height: 18px; }
          .home-topbar-btns {
            display: flex; gap: 6px;
          }
          .home-top-btn {
            background: rgba(201,162,39,0.15);
            border: 1px solid rgba(201,162,39,0.35);
            color: #C9A227;
            padding: 5px 10px; border-radius: 10px;
            font-size: 12px; cursor: pointer;
            display: flex; align-items: center; gap: 3px;
            transition: background 0.2s;
            font-family: inherit;
          }
          .home-top-btn:hover { background: rgba(201,162,39,0.3); }

          /* ===== 中间三栏区域 ===== */
          .home-main {
            flex: 1; display: flex; gap: 8px;
            padding: 8px; overflow: hidden;
          }

          /* 左侧边栏：活动/福利/首充等入口 */
          .home-left-bar {
            width: 70px; flex-shrink: 0;
            display: flex; flex-direction: column; gap: 6px;
            padding-top: 4px;
          }
          .home-left-entry {
            width: 100%;
            background: #2C1810;
            border: 1px solid #C9A227;
            border-radius: 6px;
            color: #F5E6D3;
            font-size: 12px;
            padding: 10px 4px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
            writing-mode: vertical-rl;
            text-orientation: mixed;
            letter-spacing: 2px;
            font-family: inherit;
          }
          .home-left-entry:hover {
            background: rgba(201,162,39,0.25);
            color: #C9A227;
          }
          .home-left-entry.gold {
            background: rgba(201,162,39,0.2);
            border-color: #C9A227;
            color: #C9A227;
            font-weight: 700;
          }

          /* 中间主区域：古风场景 + 系统消息 */
          .home-center-panel {
            flex: 1; position: relative;
            background: #2C1810;
            border: 1px solid #C9A227;
            border-radius: 8px;
            overflow: hidden;
          }
          .home-scene-bg {
            position: absolute; inset: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><rect fill="%232C1810" width="800" height="500"/><ellipse cx="400" cy="250" rx="300" ry="180" fill="%233d2518"/><path d="M0 400 Q200 350 400 380 T800 350 V500 H0Z" fill="%234a2e1a" opacity="0.5"/></svg>');
            background-size: cover; background-position: center;
            opacity: 0.35;
          }
          .home-scene-overlay {
            position: absolute; inset: 0;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            padding: 20px;
            gap: 16px;
          }
          .home-sys-msg {
            max-width: 90%;
            background: rgba(44,24,16,0.82);
            border: 1px solid rgba(201,162,39,0.4);
            border-radius: 10px;
            padding: 12px 16px;
            color: #F5E6D3;
            font-size: 14px;
            line-height: 1.7;
            text-align: center;
            backdrop-filter: blur(3px);
          }
          .home-sys-msg strong {
            color: #C9A227;
          }
          .home-location-tag {
            position: absolute; bottom: 12px; left: 50%;
            transform: translateX(-50%);
            background: rgba(44,24,16,0.85);
            border: 1px solid rgba(201,162,39,0.4);
            color: #C9A227;
            padding: 5px 16px; border-radius: 14px;
            font-size: 12px;
            display: flex; align-items: center; gap: 4px;
          }

          /* 右侧边栏：剧情/日常任务卡片 */
          .home-right-bar {
            width: 140px; flex-shrink: 0;
            display: flex; flex-direction: column; gap: 8px;
          }
          .home-right-card {
            background: #2C1810;
            border: 1px solid #C9A227;
            border-radius: 8px;
            padding: 10px;
            cursor: pointer;
            transition: all 0.2s;
          }
          .home-right-card:hover {
            background: rgba(201,162,39,0.12);
            transform: translateY(-1px);
          }
          .home-right-card-title {
            font-size: 13px; font-weight: 700; color: #C9A227;
            margin-bottom: 6px;
            display: flex; align-items: center; gap: 4px;
          }
          .home-right-card-sub {
            font-size: 11px; color: #A08060;
          }
          .home-right-progress {
            margin-top: 6px;
            height: 4px; background: rgba(255,255,255,0.1);
            border-radius: 2px; overflow: hidden;
          }
          .home-right-progress-fill {
            height: 100%; background: #C9A227; border-radius: 2px;
          }
          .home-right-progress-text {
            font-size: 10px; color: #A08060; margin-top: 3px; text-align: right;
          }

          /* ===== 底部功能导航 ===== */
          .home-bottom-nav {
            display: flex; justify-content: space-around;
            padding: 6px 8px;
            background: #2C1810;
            border-top: 2px solid #C9A227;
            flex-shrink: 0;
          }
          .home-nav-item {
            display: flex; flex-direction: column; align-items: center;
            gap: 2px; padding: 4px 10px; cursor: pointer;
            color: #A08060; transition: all 0.2s; border-radius: 8px;
          }
          .home-nav-item:hover { color: #C9A227; background: rgba(201,162,39,0.1); }
          .home-nav-item.active { color: #C9A227; }
          .home-nav-icon { width: 22px; height: 22px; }
          .home-nav-label { font-size: 11px; }

          /* ===== 右下角回府大按钮 ===== */
          .home-back-btn {
            position: absolute; bottom: 72px; right: 12px;
            width: 56px; height: 56px; border-radius: 50%;
            background: #C9A227;
            color: #2C1810;
            border: 3px solid #2C1810;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            gap: 1px; cursor: pointer;
            font-size: 10px; font-weight: 700;
            transition: all 0.2s; z-index: 10;
            font-family: inherit;
          }
          .home-back-btn:hover {
            transform: scale(1.08);
            box-shadow: 0 4px 12px rgba(201,162,39,0.4);
          }
          .home-back-btn svg { width: 20px; height: 20px; }

          /* ===== 移动端适配 ===== */
          @media (max-width: 768px) {
            .home-left-bar { display: none; }
            .home-right-bar { display: none; }
            .home-topbar { padding: 6px 10px; }
            .home-player-name { font-size: 14px; }
            .home-currency { font-size: 12px; }
            .home-top-btn { padding: 4px 7px; font-size: 11px; }
            .home-bottom-nav { padding: 4px 6px; }
            .home-nav-icon { width: 20px; height: 20px; }
            .home-nav-label { font-size: 10px; }
            .home-back-btn { bottom: 66px; right: 8px; width: 48px; height: 48px; }
            .home-back-btn svg { width: 16px; height: 16px; }
            .home-back-btn span { font-size: 9px; }
          }
        </style>
      </div>
    `;

    // 确保页面容器正确撑满
    page.style.display        = 'flex';
    page.style.flexDirection  = 'column';
    page.style.height         = '100%';
    page.style.overflow       = 'hidden';
    page.style.position       = 'relative';   // 为右下角绝对定位按钮提供参考
  },

  /** =========================================================
   *  顶部状态条：头像 + 玩家信息 + 数值 + 按钮
   * ========================================================= */
  _renderTopBar(name, title, avatar, level) {
    // 头像：有图则显示，无图则显示「砚」字占位
    const avatarHtml = avatar
      ? `<img src="${avatar}" alt="${name}">`
      : `<span class="home-avatar-placeholder">砚</span>`;

    return `
      <div class="home-topbar">
        <!-- 左侧：头像 + 玩家名 + 称号 -->
        <div class="home-topbar-left">
          <div class="home-avatar">${avatarHtml}</div>
          <div class="home-player-info">
            <div class="home-player-name">${name}</div>
            <div class="home-player-title">${title}</div>
          </div>
        </div>

        <!-- 右侧：元宝数值 + 操作按钮 -->
        <div class="home-topbar-right">
          <div class="home-currency" title="元宝">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M9 9h6M9 15h6"/></svg>
            23260
          </div>
          <div class="home-topbar-btns">
            <button class="home-top-btn" onclick="App.navigate('settings-hub')" title="设置">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l-.06-.06A1.65 1.65 0 004.62 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
              设置
            </button>
            <button class="home-top-btn" onclick="App.navigate('more')" title="更多">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
              更多
            </button>
            <button class="home-top-btn" onclick="App.navigate('exit')" title="退出">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              退出
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /** =========================================================
   *  中间三栏区域：左侧活动入口 | 中间场景+消息 | 右侧任务卡片
   * ========================================================= */
  _renderMainArea() {
    return `
      <div class="home-main">
        <!-- 左侧边栏：活动 / 福利 / 首充等入口 -->
        <div class="home-left-bar">
          <div class="home-left-entry"       onclick="App.navigate('activity')">活动</div>
          <div class="home-left-entry gold"  onclick="App.navigate('welfare')">福利</div>
          <div class="home-left-entry"       onclick="App.navigate('first-recharge')">首充</div>
          <div class="home-left-entry"       onclick="App.navigate('ranking')">排行榜</div>
          <div class="home-left-entry"       onclick="App.navigate('mail')">邮件</div>
        </div>

        <!-- 中间主区域：古风场景背景 + 系统消息 -->
        <div class="home-center-panel">
          <!-- 半透明古风场景背景 -->
          <div class="home-scene-bg"></div>

          <!-- 系统消息层 -->
          <div class="home-scene-overlay">
            <div class="home-sys-msg">
              <strong>系统消息</strong><br>
              恭喜您家眷儿将随从<b style="color:#C9A227;">秋蝉</b>培养至三阶！<br>
              府中库房新增<b style="color:#C9A227;">丝绸 × 20</b>，请及时查收。
            </div>
            <div class="home-sys-msg">
              <strong>日常提醒</strong><br>
              今日可领取晨昏定省礼，前往<b style="color:#C9A227;">书房</b>触发剧情。
            </div>
          </div>

          <!-- 当前位置标签 -->
          <div class="home-location-tag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            当前：汴京·府邸
          </div>
        </div>

        <!-- 右侧边栏：剧情 / 日常任务卡片 -->
        <div class="home-right-bar">
          <!-- 剧情卡片 -->
          <div class="home-right-card" onclick="App.navigate('story')">
            <div class="home-right-card-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
              第一章·落梅知
            </div>
            <div class="home-right-card-sub">剧情进度</div>
            <div class="home-right-progress">
              <div class="home-right-progress-fill" style="width:35%;"></div>
            </div>
            <div class="home-right-progress-text">35%</div>
          </div>

          <!-- 日常任务卡片 -->
          <div class="home-right-card" onclick="App.navigate('daily-quest')">
            <div class="home-right-card-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              今日可完成
            </div>
            <div class="home-right-card-sub">日常任务</div>
            <div class="home-right-progress">
              <div class="home-right-progress-fill" style="width:60%;"></div>
            </div>
            <div class="home-right-progress-text">3 / 5</div>
          </div>

          <!-- 限时活动卡片 -->
          <div class="home-right-card" onclick="App.navigate('limited-event')">
            <div class="home-right-card-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              限时活动
            </div>
            <div class="home-right-card-sub">中秋赏月宴</div>
            <div class="home-right-progress">
              <div class="home-right-progress-fill" style="width:20%;"></div>
            </div>
            <div class="home-right-progress-text">剩余 2 天</div>
          </div>
        </div>
      </div>
    `;
  },

  /** =========================================================
   *  底部功能导航：随从/衣橱/商城/任务/成就/图鉴/信件/背包
   * ========================================================= */
  _renderBottomNav() {
    // 导航项配置：[图标路径d, 标签文字, 跳转页面]
    const navItems = [
      {
        icon: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        label: '随从',
        page: 'npc'
      },
      {
        icon: '<path d="M20.38 3.46L16 7.84l-1.1-1.1L19.27 2.36a2.5 2.5 0 011.11 1.1z"/><path d="M14 7.84l-2 2L8.62 6.46 10 5.08l2.38 2.38z"/><path d="M4 16l4-4 2 2-4 4z"/><path d="M8 20l-4-4"/>',
        label: '衣橱',
        page: 'wardrobe'
      },
      {
        icon: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
        label: '商城',
        page: 'shop'
      },
      {
        icon: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>',
        label: '任务',
        page: 'quest'
      },
      {
        icon: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
        label: '成就',
        page: 'achievement'
      },
      {
        icon: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
        label: '图鉴',
        page: 'archive'
      },
      {
        icon: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
        label: '信件',
        page: 'letters'
      },
      {
        icon: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
        label: '背包',
        page: 'inventory'
      }
    ];

    return `
      <div class="home-bottom-nav">
        ${navItems.map(item => `
          <div class="home-nav-item" onclick="App.navigate('${item.page}')" title="${item.label}">
            <svg class="home-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              ${item.icon}
            </svg>
            <span class="home-nav-label">${item.label}</span>
          </div>
        `).join('')}
      </div>
    `;
  },

  /** =========================================================
   *  安全读取本地存储数据
   * ========================================================= */
  _safeGet(key, defaultValue) {
    try {
      if (typeof Storage !== 'undefined' && Storage.get) {
        return Storage.get(key, defaultValue);
      }
    } catch (e) {
      /* 静默失败，返回默认值 */
    }
    return defaultValue;
  }
  /** 回到页面顶部 */
  scrollToTop() {
    const content = document.querySelector('.page-frame-content') || document.getElementById('page-home');
    if (content) content.scrollTop = 0;
  }
};

/** 全局暴露，供 App 路由调用 */
window.HomePage = HomePage;
