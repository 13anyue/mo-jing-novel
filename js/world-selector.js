/**
 * =========================================================
 * World Selector v2.1 — 世界选择页（易次元风格升级版）
 * 大圆角卡片、精致阴影层次、骨架屏加载、友好空状态
 * =========================================================
 */
const WorldSelector = {
  _worlds: [],
  _loading: false,

  init() { this.renderPage(); },
  onEnter() { this.loadWorlds(); this.renderPage(); },

  loadWorlds() {
    this._loading = true;
    this._renderSkeleton(); // 显示骨架屏

    // 模拟异步加载感，100ms 后填充数据
    setTimeout(() => {
      try {
        if (typeof WorldviewEngine !== 'undefined' && WorldviewEngine.getCustomTemplates) {
          const templates = WorldviewEngine.getCustomTemplates() || [];
          this._worlds = templates.map(t => ({
            id: t.id || ('world_' + Math.random().toString(36).slice(2)),
            name: t.name || '未命名世界',
            description: t.description || '',
            bgImage: t.backgroundImage || (t.theme && t.theme.backgroundImage) || null,
            themeName: (t.theme && t.theme.name) || '古风墨境',
            npcCount: (t.npcs && t.npcs.length) || 0,
            createdAt: t.createdAt || Date.now()
          }));
        }
      } catch (e) { this._worlds = []; }
      if (!this._worlds.length) {
        this._worlds = [
          { id: 'default_palace', name: '女帝', description: '这是一个女尊世界，一个以绝对女帝为唯一权力核心的中国古代...', bgImage: null, themeName: '古风墨境', npcCount: 1, createdAt: Date.now() },
          { id: 'world_example_2', name: '三国', description: '群雄逐鹿，乱世争霸', bgImage: null, themeName: '古风墨境', npcCount: 0, createdAt: Date.now() }
        ];
      }
      this._loading = false;
      this.renderPage();
    }, 120);
  },

  _getWorldBg(world) {
    if (world.bgImage) return world.bgImage;
    try {
      const bgs = (typeof BackgroundLibrary !== 'undefined' && BackgroundLibrary.getBackgrounds) ? BackgroundLibrary.getBackgrounds() : [];
      if (bgs.length) {
        const randomBg = bgs[Math.floor(Math.random() * bgs.length)];
        return randomBg.data || null;
      }
    } catch (e) {}
    return null;
  },

  renderPage() {
    const page = document.getElementById('page-world-selector');
    if (!page) return;
    page.innerHTML = `
      <style>
        /* 骨架屏脉冲动画 */
        @keyframes skeletonPulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
        .world-skeleton {
          background: linear-gradient(135deg, rgba(245,230,211,0.6) 0%, rgba(235,220,195,0.8) 50%, rgba(245,230,211,0.6) 100%);
          background-size: 200% 200%;
          animation: skeletonPulse 1.5s ease-in-out infinite;
          border-radius: 24px;
          aspect-ratio: 1;
        }
        /* 世界卡片悬停与触摸 */
        .world-card-v2 {
          position: relative;
          aspect-ratio: 1;
          border-radius: 24px;
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(44, 24, 16, 0.12), 0 1px 3px rgba(44, 24, 16, 0.08);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          background-size: cover;
          background-position: center;
          border: 1px solid rgba(201, 162, 39, 0.15);
        }
        .world-card-v2:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 32px rgba(44, 24, 16, 0.18), 0 0 20px rgba(201, 162, 39, 0.12);
        }
        .world-card-v2:active {
          transform: scale(0.97);
          transition-duration: 0.1s;
        }
        /* 新增世界占位 */
        .world-card-add-v2 {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          border: 2px dashed rgba(201, 162, 39, 0.4);
          background: rgba(201, 162, 39, 0.04);
          border-radius: 24px;
          aspect-ratio: 1;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 2px 8px rgba(44, 24, 16, 0.06);
        }
        .world-card-add-v2:hover {
          background: rgba(201, 162, 39, 0.1);
          border-color: rgba(201, 162, 39, 0.6);
          box-shadow: 0 4px 16px rgba(201, 162, 39, 0.15);
          transform: translateY(-3px);
        }
        .world-card-add-v2:active {
          transform: scale(0.97);
          transition-duration: 0.1s;
        }
        /* 空状态友好UI */
        .world-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 20px;
          text-align: center;
          color: var(--text-muted);
        }
        .world-empty-state svg {
          margin-bottom: 16px;
          opacity: 0.4;
        }
        .world-empty-state h4 {
          font-family: 'Noto Serif SC', serif;
          font-size: 18px;
          color: var(--text-secondary);
          margin-bottom: 8px;
          letter-spacing: 2px;
        }
        .world-empty-state p {
          font-size: 13px;
          line-height: 1.6;
          max-width: 260px;
        }
        /* 入场动画 */
        @keyframes cardPopIn {
          from { opacity: 0; transform: scale(0.92) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .world-card-v2, .world-card-add-v2 {
          animation: cardPopIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .world-card-v2:nth-child(1), .world-card-add-v2:nth-child(1) { animation-delay: 0.05s; }
        .world-card-v2:nth-child(2), .world-card-add-v2:nth-child(2) { animation-delay: 0.12s; }
        .world-card-v2:nth-child(3), .world-card-add-v2:nth-child(3) { animation-delay: 0.19s; }
        .world-card-v2:nth-child(4), .world-card-add-v2:nth-child(4) { animation-delay: 0.26s; }
        .world-card-v2:nth-child(5), .world-card-add-v2:nth-child(5) { animation-delay: 0.33s; }
        .world-card-v2:nth-child(6), .world-card-add-v2:nth-child(6) { animation-delay: 0.40s; }
        .world-card-v2:nth-child(7), .world-card-add-v2:nth-child(7) { animation-delay: 0.47s; }
        .world-card-v2:nth-child(8), .world-card-add-v2:nth-child(8) { animation-delay: 0.54s; }
        /* 移动端网格适配 */
        @media (max-width: 480px) {
          .world-grid-v2 {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
          .world-card-v2, .world-card-add-v2 { border-radius: 20px; }
        }
        @media (max-width: 375px) {
          .world-grid-v2 {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
        }
      </style>

      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
        <button class="btn btn-sm btn-secondary" onclick="App.navigate('home')" style="border-radius:50%;width:36px;height:36px;padding:0;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.08);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h2 style="margin:0;font-family:'Noto Serif SC',serif;font-size:22px;color:var(--text-primary);letter-spacing:2px;">我的世界</h2>
        <div style="flex:1;"></div>
        <button class="btn btn-sm btn-gold" onclick="WorldSelector.createWorld()" style="border-radius:20px;padding:6px 16px;font-size:14px;letter-spacing:1px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:4px;margin-top:-1px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新建
        </button>
      </div>

      ${this._loading ? this._renderSkeletonGrid() : this._renderWorldGrid()}
    `;
  },

  _renderSkeletonGrid() {
    // 骨架屏：3个占位卡片 + 1个新建占位
    return `
      <div class="world-grid-v2" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(180px, 1fr));gap:16px;">
        <div class="world-skeleton"></div>
        <div class="world-skeleton"></div>
        <div class="world-skeleton"></div>
        <div class="world-skeleton" style="opacity:0.4;"></div>
      </div>
    `;
  },

  _renderWorldGrid() {
    if (!this._worlds.length) {
      return `
        <div class="world-empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
          </svg>
          <h4>暂无世界</h4>
          <p>点击下方「新建」按钮，或右上角按钮，创造属于你的第一个故事世界</p>
          <button class="btn btn-gold" onclick="WorldSelector.createWorld()" style="margin-top:16px;border-radius:20px;padding:10px 24px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:6px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            创建新世界
          </button>
        </div>
      `;
    }
    return `
      <div class="world-grid-v2" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(180px, 1fr));gap:16px;">
        ${this._worlds.map(w => this._renderWorldCard(w)).join('')}
        <div onclick="WorldSelector.createWorld()" class="world-card-add-v2">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="opacity:0.6;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span style="font-size:13px;color:var(--text-muted);letter-spacing:1px;">新建世界</span>
        </div>
      </div>
    `;
  },

  _renderWorldCard(world) {
    const bgUrl = this._getWorldBg(world);
    const bgStyle = bgUrl
      ? `background-image:url('${bgUrl}');background-size:cover;background-position:center;`
      : `background:linear-gradient(135deg, #5a7d5a, #4A6B4A);`;
    return `
      <div onclick="WorldSelector.enterWorld('${world.id}')" class="world-card-v2" style="${bgStyle}">
        <div class="world-card-overlay"></div>
        <div class="world-card-content">
          <div class="world-card-name">${world.name}</div>
          ${world.npcCount > 0 ? `<div class="world-card-badge">${world.npcCount} 位角色</div>` : ''}
        </div>
      </div>
    `;
  },

  enterWorld(worldId) {
    const world = this._worlds.find(w => w.id === worldId);
    if (world) {
      try { Storage.set('selectedWorldId_v1', worldId); } catch (e) {}
      App.navigate('world-detail');
    }
  },

  createWorld() {
    const name = prompt('请输入新世界名称：', '我的新世界');
    if (!name) return;
    const newWorld = {
      id: 'world_' + Date.now(),
      name, description: '',
      bgImage: null, themeName: '古风墨境',
      npcCount: 0, createdAt: Date.now()
    };
    this._worlds.push(newWorld);
    try {
      const list = Storage.get('worldList_v1') || [];
      list.push(newWorld);
      Storage.set('worldList_v1', list);
    } catch (e) {}
    this.renderPage();
    App.toast('世界「' + name + '」已创建', 'success');
  }
};
