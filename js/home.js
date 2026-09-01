/**
 * =========================================================
 * Home Page v8 — 主操作面板（参考UI重设计）
 * 古风墨境风格 · 顶部状态条 · 大地图 · 底部功能导航
 * =========================================================
 */
const HomePage = {
  init() { this.renderPage(); },
  onEnter() { this.renderPage(); },

  renderPage() {
    const page = document.getElementById('page-home');
    if (!page) return;

    // 获取玩家数据
    const playerName = this._safeGet('playerName', '无名');
    const playerTitle = this._safeGet('playerTitle', '寒门书生');
    const playerAge = this._safeGet('playerAge', '18');
    const playerAvatar = this._safeGet('playerAvatar', '');
    const currentLocation = this._safeGet('currentLocation', '汴京·市集');
    const currentDate = this._safeGet('currentDate', '第三年·三月初八');
    const currentWeather = this._safeGet('currentWeather', '晴');

    page.innerHTML = `
      <div id="homeDashboard" style="display:flex;flex-direction:column;height:100%;background:var(--bg-body);overflow:hidden;">
        ${this._renderTopBar(playerName, playerTitle, playerAvatar, currentLocation, currentDate, currentWeather)}
        ${this._renderMainArea()}
        ${this._renderBottomNav()}
      </div>
      <style>
        /* ===== v8 主操作面板样式 ===== */
        .dash-topbar {
          display: flex; align-items: center; gap: 12px;
          padding: 8px 16px;
          background: linear-gradient(180deg, #2C1810 0%, #3d2518 100%);
          border-bottom: 2px solid #C9A227;
          color: #F5E6D3;
          flex-shrink: 0;
          flex-wrap: wrap;
        }
        .dash-avatar {
          width: 44px; height: 44px; border-radius: 50%;
          border: 2px solid #C9A227;
          overflow: hidden; flex-shrink: 0;
          background: #5D3A1A;
        }
        .dash-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .dash-info { flex: 1; min-width: 120px; }
        .dash-name-row { display: flex; align-items: center; gap: 6px; }
        .dash-name { font-family: 'Noto Serif SC', serif; font-size: 16px; font-weight: 700; color: #F5E6D3; }
        .dash-title-tag {
          background: rgba(201,162,39,0.25); color: #C9A227;
          padding: 1px 6px; border-radius: 4px; font-size: 11px;
          border: 1px solid rgba(201,162,39,0.4);
        }
        .dash-meta { font-size: 11px; color: #A08060; margin-top: 2px; }
        .dash-stats { display: flex; gap: 8px; align-items: center; }
        .dash-stat-item { display: flex; flex-direction: column; align-items: center; }
        .dash-stat-bar { width: 40px; height: 4px; background: rgba(255,255,255,0.15); border-radius: 2px; overflow: hidden; }
        .dash-stat-fill { height: 100%; border-radius: 2px; }
        .dash-stat-label { font-size: 9px; color: #A08060; margin-top: 2px; }
        .dash-resources { display: flex; gap: 10px; align-items: center; }
        .dash-res-item { font-size: 12px; color: #C9A227; }
        .dash-quick-btns { display: flex; gap: 6px; flex-wrap: wrap; }
        .dash-qbtn {
          background: rgba(201,162,39,0.15); border: 1px solid rgba(201,162,39,0.3);
          color: #C9A227; padding: 4px 10px; border-radius: 12px;
          font-size: 12px; cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; gap: 3px;
        }
        .dash-qbtn:hover { background: rgba(201,162,39,0.3); }

        /* 主区域 */
        .dash-main {
          flex: 1; display: flex; gap: 8px;
          padding: 8px; overflow: hidden;
        }
        .dash-left-panel, .dash-right-panel {
          width: 180px; flex-shrink: 0;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-md);
          padding: 10px;
          overflow-y: auto;
        }
        .dash-center-panel {
          flex: 1; position: relative;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-md);
          overflow: hidden;
        }
        .dash-map-bg {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background-size: cover; background-position: center;
          opacity: 0.6;
        }
        .dash-map-overlay {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .dash-map-label {
          background: rgba(44,24,16,0.7); border: 1px solid rgba(201,162,39,0.4);
          color: #F5E6D3; padding: 4px 12px; border-radius: 14px;
          font-size: 13px; cursor: pointer; transition: all 0.2s;
          backdrop-filter: blur(4px);
        }
        .dash-map-label:hover {
          background: rgba(201,162,39,0.3); border-color: #C9A227;
          transform: scale(1.05);
        }
        .dash-panel-title {
          font-family: 'Noto Serif SC', serif; font-size: 14px;
          color: var(--color-primary-dark); margin-bottom: 8px;
          border-bottom: 1px solid var(--border-gold); padding-bottom: 4px;
        }
        .dash-info-row { display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0; }
        .dash-info-row .label { color: var(--text-muted); }
        .dash-info-row .value { color: var(--text-primary); font-weight: 500; }
        .dash-stat-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }
        .dash-stat-name { font-size: 12px; color: var(--text-secondary); }
        .dash-stat-val { font-size: 12px; font-weight: 600; color: var(--color-primary-dark); }

        /* 底部区域 */
        .dash-bottom {
          display: flex; gap: 8px;
          padding: 0 8px 8px;
          flex-shrink: 0;
        }
        .dash-bottom-panel {
          flex: 1;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-md);
          padding: 10px;
          min-height: 120px;
          overflow-y: auto;
        }
        .dash-event-item {
          font-size: 12px; color: var(--text-secondary); padding: 4px 0;
          border-bottom: 1px solid rgba(201,162,39,0.1);
        }
        .dash-event-item:last-child { border-bottom: none; }
        .dash-relation-card {
          display: flex; align-items: center; gap: 8px;
          padding: 6px 0;
          border-bottom: 1px solid rgba(201,162,39,0.1);
        }
        .dash-rel-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: var(--bg-body); border: 1px solid var(--border-color);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; flex-shrink: 0;
        }
        .dash-rel-info { flex: 1; }
        .dash-rel-name { font-size: 12px; font-weight: 600; color: var(--text-primary); }
        .dash-rel-desc { font-size: 10px; color: var(--text-muted); }
        .dash-rel-tag {
          font-size: 10px; padding: 1px 5px; border-radius: 3px;
          background: rgba(201,162,39,0.15); color: #C9A227;
        }

        /* 底部导航 */
        .dash-bottom-nav {
          display: flex; justify-content: space-around;
          padding: 6px 8px;
          background: linear-gradient(180deg, #2C1810 0%, #3d2518 100%);
          border-top: 2px solid #C9A227;
          flex-shrink: 0;
        }
        .dash-nav-item {
          display: flex; flex-direction: column; align-items: center;
          gap: 2px; padding: 4px 12px; cursor: pointer;
          color: #A08060; transition: all 0.2s; border-radius: 8px;
        }
        .dash-nav-item:hover { color: #C9A227; background: rgba(201,162,39,0.1); }
        .dash-nav-item.active { color: #C9A227; }
        .dash-nav-icon { width: 20px; height: 20px; }
        .dash-nav-label { font-size: 10px; }

        /* 移动端适配 */
        @media (max-width: 768px) {
          .dash-left-panel, .dash-right-panel { display: none; }
          .dash-topbar { padding: 6px 10px; gap: 8px; }
          .dash-name { font-size: 14px; }
          .dash-resources { gap: 6px; }
          .dash-res-item { font-size: 10px; }
          .dash-quick-btns { gap: 4px; }
          .dash-qbtn { padding: 3px 6px; font-size: 10px; }
          .dash-bottom-panel { min-height: 80px; padding: 6px; }
          .dash-bottom { gap: 4px; padding: 0 4px 4px; }
        }
      </style>
    `;

    page.style.display = 'flex';
    page.style.flexDirection = 'column';
    page.style.height = '100%';
    page.style.overflow = 'hidden';
  },

  _renderTopBar(name, title, avatar, location, date, weather) {
    const avatarHtml = avatar
      ? `<img src="${avatar}" alt="${name}">`
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A227" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

    return `
      <div class="dash-topbar">
        <div class="dash-avatar">${avatarHtml}</div>
        <div class="dash-info">
          <div class="dash-name-row">
            <span class="dash-name">${name}</span>
            <span class="dash-title-tag">${title}</span>
          </div>
          <div class="dash-meta">${location} · ${date} · ${weather}</div>
        </div>
        <div class="dash-stats">
          <div class="dash-stat-item">
            <div class="dash-stat-bar"><div class="dash-stat-fill" style="width:82%;background:#7CB342;"></div></div>
            <span class="dash-stat-label">体力</span>
          </div>
          <div class="dash-stat-item">
            <div class="dash-stat-bar"><div class="dash-stat-fill" style="width:72%;background:#42A5F5;"></div></div>
            <span class="dash-stat-label">心情</span>
          </div>
          <div class="dash-stat-item">
            <div class="dash-stat-bar"><div class="dash-stat-fill" style="width:90%;background:#EF5350;"></div></div>
            <span class="dash-stat-label">健康</span>
          </div>
        </div>
        <div class="dash-resources">
          <span class="dash-res-item">💰 352两</span>
          <span class="dash-res-item">🏆 326</span>
          <span class="dash-res-item">📜 421</span>
        </div>
        <div class="dash-quick-btns">
          <button class="dash-qbtn" onclick="App.navigate('save-manager')" title="存档">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>存档
          </button>
          <button class="dash-qbtn" onclick="App.navigate('save-manager')" title="读档">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/></svg>读档
          </button>
          <button class="dash-qbtn" onclick="App.navigate('settings-hub')" title="设置">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l-.06-.06A1.65 1.65 0 004.62 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06-.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>设置
          </button>
          <button class="dash-qbtn" onclick="App.navigate('map')" title="地图">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 21 18 21 2 16 6 8 2 1 6"/></svg>地图
          </button>
          <button class="dash-qbtn" onclick="App.navigate('quest')" title="任务">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>任务
          </button>
          <button class="dash-qbtn" onclick="App.navigate('npc')" title="人物">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>人物
          </button>
          <button class="dash-qbtn" onclick="App.navigate('inventory')" title="背包">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>背包
          </button>
        </div>
      </div>
    `;
  },

  _renderMainArea() {
    return `
      <div class="dash-main">
        <!-- 左侧面板：基本信息+能力属性 -->
        <div class="dash-left-panel">
          <div class="dash-panel-title">基本信息</div>
          <div class="dash-info-row"><span class="label">年龄</span><span class="value">18岁</span></div>
          <div class="dash-info-row"><span class="label">身份</span><span class="value">寒门书生</span></div>
          <div class="dash-info-row"><span class="label">出身</span><span class="value">江南小镇</span></div>
          <div class="dash-info-row"><span class="label">家境</span><span class="value">清贫</span></div>
          <div class="dash-info-row"><span class="label">性格</span><span class="value">聪慧内敛</span></div>
          <div class="dash-info-row"><span class="label">特长</span><span class="value">诗文、书法</span></div>
          <div class="dash-info-row"><span class="label">武艺</span><span class="value">略知一二</span></div>

          <div class="dash-panel-title" style="margin-top:12px;">能力属性</div>
          <div class="dash-stat-row"><span class="dash-stat-name">文才</span><span class="dash-stat-val">72</span></div>
          <div class="dash-stat-row"><span class="dash-stat-name">智谋</span><span class="dash-stat-val">65</span></div>
          <div class="dash-stat-row"><span class="dash-stat-name">口才</span><span class="dash-stat-val">58</span></div>
          <div class="dash-stat-row"><span class="dash-stat-name">武艺</span><span class="dash-stat-val">41</span></div>
          <div class="dash-stat-row"><span class="dash-stat-name">交际</span><span class="dash-stat-val">53</span></div>
          <div class="dash-stat-row"><span class="dash-stat-name">魅力</span><span class="dash-stat-val">60</span></div>
        </div>

        <!-- 中间：地图探索区域 -->
        <div class="dash-center-panel">
          <div class="dash-map-bg" style="background-image:linear-gradient(180deg, #6b8e6b 0%, #5d7a5d 50%, #4a6b4a 100%);"></div>
          <div class="dash-map-overlay" style="position:relative;flex-wrap:wrap;gap:12px;padding:20px;">
            <div class="dash-map-label" onclick="App.navigate('map')">🏯 城北</div>
            <div class="dash-map-label" onclick="App.navigate('map')">📚 书院</div>
            <div class="dash-map-label" onclick="App.navigate('map')">🏛️ 官署</div>
            <div class="dash-map-label" onclick="App.navigate('map')">🐎 驿站</div>
            <div class="dash-map-label" onclick="App.navigate('map')">🏨 客栈</div>
            <div class="dash-map-label" onclick="App.navigate('map')">🏪 商铺</div>
            <div class="dash-map-label" onclick="App.navigate('map')">🌿 郊外</div>
            <div class="dash-map-label" onclick="App.navigate('map')">🏠 居所</div>
            <div class="dash-map-label" onclick="App.navigate('map')">🎪 市集</div>
            <div class="dash-map-label" onclick="App.navigate('map')">⚓ 码头</div>
          </div>
          <div style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);background:rgba(44,24,16,0.8);color:#C9A227;padding:4px 14px;border-radius:12px;font-size:12px;border:1px solid rgba(201,162,39,0.3);">
            📍 当前：汴京·市集 · 点击地点探索
          </div>
        </div>

        <!-- 右侧面板：今日行程 -->
        <div class="dash-right-panel">
          <div class="dash-panel-title">今日行程</div>
          <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">
            <div style="padding:6px 0;border-bottom:1px dashed rgba(201,162,39,0.2);">① 书院上课 <span style="color:var(--text-muted);font-size:10px;">未开始</span></div>
            <div style="padding:6px 0;border-bottom:1px dashed rgba(201,162,39,0.2);">② 温习功课 <span style="color:var(--text-muted);font-size:10px;">未开始</span></div>
            <div style="padding:6px 0;">③ 前往市集 <span style="color:var(--text-muted);font-size:10px;">未开始</span></div>
          </div>
          <button class="btn btn-sm btn-gold" style="width:100%;margin-top:8px;" onclick="App.navigate('runtime')">🚀 开始今日</button>
          <button class="btn btn-sm btn-secondary" style="width:100%;margin-top:6px;" onclick="App.navigate('runtime')">🎮 进入剧情</button>

          <div class="dash-panel-title" style="margin-top:12px;">生活状态</div>
          <div class="dash-info-row"><span class="label">衣食</span><span class="value">78(温饱)</span></div>
          <div class="dash-info-row"><span class="label">住所</span><span class="value">62(简陋)</span></div>
          <div class="dash-info-row"><span class="label">学业</span><span class="value">68(勤勉)</span></div>
          <div class="dash-info-row"><span class="label">家庭</span><span class="value">55(和睦)</span></div>
        </div>
      </div>

      <!-- 底部区域：事件+关系+物品 -->
      <div class="dash-bottom">
        <div class="dash-bottom-panel" style="flex:1.2;">
          <div class="dash-panel-title">近期事件</div>
          <div class="dash-event-item">· 你在书院的表现引起了先生的注意。<span style="color:var(--text-muted);font-size:10px;">(2日前)</span></div>
          <div class="dash-event-item">· 母亲托人送来一点盘缠。<span style="color:var(--text-muted);font-size:10px;">(5日前)</span></div>
          <div class="dash-event-item">· 邻居张叔家女儿对你似乎有些好感。<span style="color:var(--text-muted);font-size:10px;">(7日前)</span></div>
          <div class="dash-event-item">· 听说今年春闱竞争比往年更加激烈。<span style="color:var(--text-muted);font-size:10px;">(10日前)</span></div>
        </div>
        <div class="dash-bottom-panel" style="flex:1;">
          <div class="dash-panel-title">人物关系</div>
          <div class="dash-relation-card">
            <div class="dash-rel-avatar">👴</div>
            <div class="dash-rel-info">
              <div class="dash-rel-name">先生·周敬之</div>
              <div class="dash-rel-desc">教导之恩，受益匪浅。</div>
            </div>
            <span class="dash-rel-tag">尊敬</span>
          </div>
          <div class="dash-relation-card">
            <div class="dash-rel-avatar">👨</div>
            <div class="dash-rel-info">
              <div class="dash-rel-name">同窗·陆文轩</div>
              <div class="dash-rel-desc">志趣相投，常相互切磋。</div>
            </div>
            <span class="dash-rel-tag">友好</span>
          </div>
          <div class="dash-relation-card">
            <div class="dash-rel-avatar">👩</div>
            <div class="dash-rel-info">
              <div class="dash-rel-name">邻居·苏小娘</div>
              <div class="dash-rel-desc">常在巷口遇见，笑意盈盈。</div>
            </div>
            <span class="dash-rel-tag">好感</span>
          </div>
        </div>
        <div class="dash-bottom-panel" style="flex:0.8;">
          <div class="dash-panel-title">携带物品</div>
          <div class="dash-info-row"><span class="label">银两</span><span class="value">352两</span></div>
          <div class="dash-info-row"><span class="label">文房四宝</span><span class="value">1套</span></div>
          <div class="dash-info-row"><span class="label">粗布衣</span><span class="value">2件</span></div>
          <div class="dash-info-row"><span class="label">馒头</span><span class="value">3个</span></div>
        </div>
      </div>
    `;
  },

  _renderBottomNav() {
    const navItems = [
      { icon: 'npc', label: '人物', page: 'npc' },
      { icon: 'bg', label: '行囊', page: 'inventory' },
      { icon: 'api', label: '武学', page: 'status' },
      { icon: 'relations', label: '关系', page: 'relations' },
      { icon: 'game', label: '成就', page: 'achievement' },
      { icon: 'notes', label: '记事', page: 'notes' }
    ];

    const icons = {
      npc: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      bg: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
      api: '<rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>',
      relations: '<circle cx="5" cy="6" r="3"/><circle cx="19" cy="6" r="3"/><circle cx="12" cy="18" r="3"/><line x1="5" y1="9" x2="10" y2="15"/><line x1="19" y1="9" x2="14" y2="15"/>',
      game: '<polygon points="5 3 19 12 5 21 5 3"/>',
      notes: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>'
    };

    return `
      <div class="dash-bottom-nav">
        ${navItems.map(item => `
          <div class="dash-nav-item" onclick="App.navigate('${item.page}')">
            <svg class="dash-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              ${icons[item.icon] || icons.game}
            </svg>
            <span class="dash-nav-label">${item.label}</span>
          </div>
        `).join('')}
      </div>
    `;
  },

  /* ===== 辅助函数 ===== */
  _safeGet(key, defaultValue) {
    try {
      if (typeof Storage !== 'undefined' && Storage.get) {
        return Storage.get(key, defaultValue);
      }
    } catch (e) {}
    return defaultValue;
  }
};

// 全局暴露
window.HomePage = HomePage;
