/**
 * =========================================================
 * PageFrame v8 — 统一古风操作面板框架
 * 所有功能页面共享：顶部状态条 + 中间内容区 + 底部导航
 * =========================================================
 */
const PageFrame = {
  /** 渲染统一页面框架 */
  render(containerId, title, contentHtml, options = {}) {
    const page = document.getElementById(containerId);
    if (!page) return;

    const playerName = this._safeGet('playerName', '无名');
    const playerTitle = this._safeGet('playerTitle', '寒门书生');
    const currentLocation = this._safeGet('currentLocation', '汴京·市集');
    const currentDate = this._safeGet('currentDate', '第三年·三月初八');
    const playerAvatar = this._safeGet('playerAvatar', '');

    const showTopbar = options.showTopbar !== false;
    const showBottomNav = options.showBottomNav !== false;
    const showBack = options.showBack !== false;
    const customTop = options.customTop || '';

    let html = '';

    if (showTopbar) {
      html += this._renderTopBar(playerName, playerTitle, playerAvatar, currentLocation, currentDate, title, showBack, customTop);
    }

    html += `
      <div class="page-frame-content" style="flex:1;overflow-y:auto;padding:12px;">
        ${contentHtml}
      </div>
    `;

    if (showBottomNav) {
      html += this._renderBottomNav();
    }

    page.innerHTML = `
      <div class="page-frame-wrapper" style="display:flex;flex-direction:column;height:100%;background:var(--bg-body);overflow:hidden;">
        ${html}
      </div>
      <style>
        /* ===== PageFrame v8 统一样式 ===== */
        .pf-topbar {
          display:flex;align-items:center;gap:10px;
          padding:8px 14px;
          background:linear-gradient(180deg, #2C1810 0%, #3d2518 100%);
          border-bottom:2px solid #C9A227;
          color:#F5E6D3; flex-shrink:0; flex-wrap:wrap;
        }
        .pf-avatar { width:40px;height:40px;border-radius:50%;border:2px solid #C9A227;overflow:hidden;background:#5D3A1A;flex-shrink:0; }
        .pf-avatar img { width:100%;height:100%;object-fit:cover; }
        .pf-info { flex:1;min-width:100px; }
        .pf-name-row { display:flex;align-items:center;gap:6px; }
        .pf-name { font-family:'Noto Serif SC',serif;font-size:15px;font-weight:700;color:#F5E6D3; }
        .pf-title-tag { background:rgba(201,162,39,0.25);color:#C9A227;padding:1px 6px;border-radius:4px;font-size:10px;border:1px solid rgba(201,162,39,0.4); }
        .pf-meta { font-size:10px;color:#A08060;margin-top:2px; }
        .pf-page-title { font-family:'Noto Serif SC',serif;font-size:16px;color:#C9A227;margin-left:auto;padding:4px 12px;border-left:1px solid rgba(201,162,39,0.3); }
        .pf-back-btn {
          background:rgba(201,162,39,0.15);border:1px solid rgba(201,162,39,0.3);
          color:#C9A227;padding:4px 10px;border-radius:12px;font-size:12px;
          cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:3px;
        }
        .pf-back-btn:hover { background:rgba(201,162,39,0.3); }

        .pf-bottom-nav {
          display:flex;justify-content:space-around;
          padding:6px 8px;
          background:linear-gradient(180deg, #2C1810 0%, #3d2518 100%);
          border-top:2px solid #C9A227;
          flex-shrink:0;
        }
        .pf-nav-item {
          display:flex;flex-direction:column;align-items:center;
          gap:2px;padding:4px 10px;cursor:pointer;
          color:#A08060;transition:all 0.2s;border-radius:8px;
        }
        .pf-nav-item:hover { color:#C9A227;background:rgba(201,162,39,0.1); }
        .pf-nav-item.active { color:#C9A227; }
        .pf-nav-icon { width:18px;height:18px; }
        .pf-nav-label { font-size:10px; }

        /* 内容区统一卡片 */
        .pf-card {
          background:var(--bg-card);
          border:1px solid var(--border-color);
          border-radius:var(--border-radius-md);
          padding:14px;
          margin-bottom:10px;
        }
        .pf-card-title {
          font-family:'Noto Serif SC',serif;font-size:15px;
          color:var(--color-primary-dark);margin-bottom:10px;
          border-bottom:1px solid var(--border-gold);padding-bottom:6px;
          display:flex;align-items:center;gap:8px;
        }
        .pf-stat-row { display:flex;justify-content:space-between;align-items:center;padding:5px 0;font-size:13px; }
        .pf-stat-name { color:var(--text-secondary); }
        .pf-stat-val { color:var(--color-primary-dark);font-weight:600; }
        .pf-info-row { display:flex;justify-content:space-between;font-size:12px;padding:4px 0; }
        .pf-info-row .label { color:var(--text-muted); }
        .pf-info-row .value { color:var(--text-primary);font-weight:500; }
        .pf-empty {
          text-align:center;padding:40px 20px;color:var(--text-muted);
        }
        .pf-empty svg { opacity:0.4;margin-bottom:12px; }
        .pf-btn-group { display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px; }
        .pf-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px; }

        /* 移动端 */
        @media (max-width:768px) {
          .pf-page-title { display:none; }
          .pf-topbar { padding:6px 10px; }
          .pf-name { font-size:13px; }
        }
      </style>
    `;

    page.style.display = 'flex';
    page.style.flexDirection = 'column';
    page.style.height = '100%';
    page.style.overflow = 'hidden';
  },

  /**
   * 为已有页面注入统一外壳（DOM 操作，保留事件绑定）
   * @param {string} pageId - 页面容器 ID
   * @param {string} title - 页面标题
   */
  wrap(pageId, title) {
    const page = document.getElementById(pageId);
    if (!page) return;

    // 防止重复包装
    if (page.dataset.pfWrapped === '1') return;

    // 获取玩家状态
    const playerName = this._safeGet('playerName', '无名');
    const playerTitle = this._safeGet('playerTitle', '寒门书生');
    const currentLocation = this._safeGet('currentLocation', '汴京·市集');
    const currentDate = this._safeGet('currentDate', '第三年·三月初八');
    const playerAvatar = this._safeGet('playerAvatar', '');

    // 1. 移除页面中原有的返回按钮
    const allButtons = page.querySelectorAll('button');
    allButtons.forEach((btn) => {
      const onclickAttr = btn.getAttribute('onclick') || '';
      const btnText = btn.textContent.trim();
      if (
        onclickAttr.includes("App.navigate('home')") ||
        onclickAttr.includes('App.navigate("home")') ||
        btnText.includes('返回') ||
        btnText.includes('\u2190') || // ←
        btnText.includes('\u2B05')   // ⬅
      ) {
        btn.remove();
      }
    });

    // 2. 收集当前所有子节点（此时返回按钮已被移除）
    const originalNodes = Array.from(page.childNodes);

    // 3. 创建外层 wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'page-frame-wrapper';
    wrapper.style.cssText = 'display:flex;flex-direction:column;height:100%;background:var(--bg-body);overflow:hidden;';

    // 4. 顶部状态条（HTML 字符串 → DOM，复用 _renderTopBar）
    const topBarHtml = this._renderTopBar(
      playerName,
      playerTitle,
      playerAvatar,
      currentLocation,
      currentDate,
      title,
      true,
      ''
    );
    const topBarFrag = document.createRange().createContextualFragment(topBarHtml);
    wrapper.appendChild(topBarFrag);

    // 5. 中间内容区：包裹原有内容，保持事件绑定
    const contentDiv = document.createElement('div');
    contentDiv.className = 'page-frame-content';
    contentDiv.style.cssText = 'flex:1;overflow-y:auto;padding:12px;';
    originalNodes.forEach((node) => contentDiv.appendChild(node));
    wrapper.appendChild(contentDiv);

    // 6. 底部导航（HTML 字符串 → DOM，复用 _renderBottomNav）
    const bottomNavHtml = this._renderBottomNav();
    const bottomNavFrag = document.createRange().createContextualFragment(bottomNavHtml);
    wrapper.appendChild(bottomNavFrag);

    // 7. 清空 page（纯 DOM API，不覆盖 innerHTML）
    while (page.firstChild) {
      page.removeChild(page.firstChild);
    }

    // 8. 注入 wrapper
    page.appendChild(wrapper);

    // 9. 注入统一样式（全局仅一次，避免重复）
    if (!document.getElementById('pf-common-style')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'pf-common-style';
      styleEl.textContent = `
        /* ===== PageFrame 统一样式 ===== */
        .pf-topbar {
          display:flex;align-items:center;gap:10px;
          padding:8px 14px;
          background:linear-gradient(180deg, #2C1810 0%, #3d2518 100%);
          border-bottom:2px solid #C9A227;
          color:#F5E6D3; flex-shrink:0; flex-wrap:wrap;
        }
        .pf-avatar { width:40px;height:40px;border-radius:50%;border:2px solid #C9A227;overflow:hidden;background:#5D3A1A;flex-shrink:0; }
        .pf-avatar img { width:100%;height:100%;object-fit:cover; }
        .pf-info { flex:1;min-width:100px; }
        .pf-name-row { display:flex;align-items:center;gap:6px; }
        .pf-name { font-family:'Noto Serif SC',serif;font-size:15px;font-weight:700;color:#F5E6D3; }
        .pf-title-tag { background:rgba(201,162,39,0.25);color:#C9A227;padding:1px 6px;border-radius:4px;font-size:10px;border:1px solid rgba(201,162,39,0.4); }
        .pf-meta { font-size:10px;color:#A08060;margin-top:2px; }
        .pf-page-title { font-family:'Noto Serif SC',serif;font-size:16px;color:#C9A227;margin-left:auto;padding:4px 12px;border-left:1px solid rgba(201,162,39,0.3); }
        .pf-back-btn {
          background:rgba(201,162,39,0.15);border:1px solid rgba(201,162,39,0.3);
          color:#C9A227;padding:4px 10px;border-radius:12px;font-size:12px;
          cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:3px;
        }
        .pf-back-btn:hover { background:rgba(201,162,39,0.3); }

        .pf-bottom-nav {
          display:flex;justify-content:space-around;
          padding:6px 8px;
          background:linear-gradient(180deg, #2C1810 0%, #3d2518 100%);
          border-top:2px solid #C9A227;
          flex-shrink:0;
        }
        .pf-nav-item {
          display:flex;flex-direction:column;align-items:center;
          gap:2px;padding:4px 10px;cursor:pointer;
          color:#A08060;transition:all 0.2s;border-radius:8px;
        }
        .pf-nav-item:hover { color:#C9A227;background:rgba(201,162,39,0.1); }
        .pf-nav-item.active { color:#C9A227; }
        .pf-nav-icon { width:18px;height:18px; }
        .pf-nav-label { font-size:10px; }

        .pf-card {
          background:var(--bg-card);
          border:1px solid var(--border-color);
          border-radius:var(--border-radius-md);
          padding:14px;
          margin-bottom:10px;
        }
        .pf-card-title {
          font-family:'Noto Serif SC',serif;font-size:15px;
          color:var(--color-primary-dark);margin-bottom:10px;
          border-bottom:1px solid var(--border-gold);padding-bottom:6px;
          display:flex;align-items:center;gap:8px;
        }
        .pf-stat-row { display:flex;justify-content:space-between;align-items:center;padding:5px 0;font-size:13px; }
        .pf-stat-name { color:var(--text-secondary); }
        .pf-stat-val { color:var(--color-primary-dark);font-weight:600; }
        .pf-info-row { display:flex;justify-content:space-between;font-size:12px;padding:4px 0; }
        .pf-info-row .label { color:var(--text-muted); }
        .pf-info-row .value { color:var(--text-primary);font-weight:500; }
        .pf-empty {
          text-align:center;padding:40px 20px;color:var(--text-muted);
        }
        .pf-empty svg { opacity:0.4;margin-bottom:12px; }
        .pf-btn-group { display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px; }
        .pf-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px; }

        @media (max-width:768px) {
          .pf-page-title { display:none; }
          .pf-topbar { padding:6px 10px; }
          .pf-name { font-size:13px; }
        }
      `;
      page.appendChild(styleEl);
    }

    // 10. 设置 page 自身布局
    page.style.display = 'flex';
    page.style.flexDirection = 'column';
    page.style.height = '100%';
    page.style.overflow = 'hidden';

    // 11. 标记已包装，防止重复调用
    page.dataset.pfWrapped = '1';
  },

  _renderTopBar(name, title, avatar, location, date, pageTitle, showBack, customTop) {
    const avatarHtml = avatar
      ? `<img src="${avatar}" alt="${name}">`
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A227" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

    let backBtn = '';
    if (showBack) {
      backBtn = `<button class="pf-back-btn" onclick="App.navigate('home')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>返回
      </button>`;
    }

    let custom = '';
    if (customTop) custom = `<div style="margin-left:auto;display:flex;gap:6px;align-items:center;">${customTop}</div>`;

    return `
      <div class="pf-topbar">
        ${backBtn}
        <div class="pf-avatar">${avatarHtml}</div>
        <div class="pf-info">
          <div class="pf-name-row">
            <span class="pf-name">${name}</span>
            <span class="pf-title-tag">${title}</span>
          </div>
          <div class="pf-meta">${location} · ${date}</div>
        </div>
        <div class="pf-page-title">${pageTitle}</div>
        ${custom}
      </div>
    `;
  },

  _renderBottomNav() {
    const navItems = [
      { icon: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2', extra: '<circle cx="12" cy="7" r="4"/>', label: '人物', page: 'npc' },
      { icon: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z', extra: '<line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>', label: '行囊', page: 'inventory' },
      { icon: 'M14.5 17.5L3 6V3h3l11.5 11.5', extra: '<path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/>', label: '武学', page: 'status' },
      { icon: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2', extra: '<circle cx="12" cy="7" r="4"/><path d="M8 21v-2a4 4 0 014-4h0"/>', label: '关系', page: 'relations' },
      { icon: 'M12 2L2 7l10 5 10-5-10-5z', extra: '<path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>', label: '成就', page: 'achievement' },
      { icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z', extra: '<polyline points="14 2 14 8 20 8"/>', label: '记事', page: 'notes' }
    ];

    return `
      <div class="pf-bottom-nav">
        ${navItems.map(item => `
          <div class="pf-nav-item" onclick="App.navigate('${item.page}')">
            <svg class="pf-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              ${item.icon ? `<path d="${item.icon}"/>` : ''}
              ${item.extra || ''}
            </svg>
            <span class="pf-nav-label">${item.label}</span>
          </div>
        `).join('')}
      </div>
    `;
  },

  _safeGet(key, defaultValue) {
    try { if (typeof Storage !== 'undefined' && Storage.get) return Storage.get(key, defaultValue); }
    catch (e) {}
    return defaultValue;
  }
};

window.PageFrame = PageFrame;
