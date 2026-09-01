/**
 * =========================================================
 * World Detail Page v2.1 — 世界详情页（易次元风格升级版）
 * 大圆角封面、精致折叠面板动画、角色头像优化、渐变按钮
 * =========================================================
 */
const WorldDetail = {
  _world: null,
  _npcs: [],
  _expanded: { intro: true, npcs: false, relations: false },

  init() { this.renderPage(); },
  onEnter() { this.loadData(); this.renderPage(); },

  loadData() {
    let worldId = null;
    try { worldId = Storage.get('selectedWorldId_v1'); } catch (e) {}
    if (!worldId) {
      App.toast('未选择世界', 'error');
      App.navigate('world-selector');
      return;
    }
    let world = null;
    try {
      if (typeof WorldviewEngine !== 'undefined' && WorldviewEngine.getCustomTemplates) {
        const templates = WorldviewEngine.getCustomTemplates() || [];
        world = templates.find(t => t.id === worldId);
      }
    } catch (e) {}
    if (!world) {
      try {
        const list = Storage.get('worldList_v1') || [];
        world = list.find(w => w.id === worldId);
      } catch (e) {}
    }
    this._world = world || { id: worldId, name: '未知世界', description: '', npcCount: 0 };
    try {
      const allNpcs = (typeof NPCManager !== 'undefined' && NPCManager.getNPCs) ? NPCManager.getNPCs() : [];
      this._npcs = allNpcs.filter(n => !n.worldId || n.worldId === worldId);
    } catch (e) { this._npcs = []; }
  },

  renderPage() {
    const page = document.getElementById('page-world-detail');
    if (!page) return;
    const w = this._world || { name: '未知世界', description: '', npcCount: 0 };
    const bgUrl = w.bgImage || (w.theme && w.theme.backgroundImage);
    const headerBg = bgUrl
      ? `background-image:url('${bgUrl}');background-size:cover;background-position:center;`
      : `background:linear-gradient(135deg, #5a8f6e, #3d6b4f);`;

    page.innerHTML = `
      <style>
        /* 折叠面板箭头旋转动画 */
        .detail-toggle-icon {
          transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .detail-toggle-icon.expanded {
          transform: rotate(180deg);
        }
        /* 折叠内容滑入滑出动画 */
        .detail-section-body {
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transform: translateY(-8px);
          transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                      opacity 0.25s ease,
                      transform 0.25s ease,
                      padding 0.35s ease;
          padding: 0 16px;
        }
        .detail-section-body.expanded {
          max-height: 2000px;
          opacity: 1;
          transform: translateY(0);
          padding: 0 16px 14px;
        }
        /* 角色头像大圆角 */
        .npc-avatar-round {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          overflow: hidden;
          flex-shrink: 0;
          border: 2px solid var(--border-gold);
          box-shadow: 0 2px 6px rgba(44, 24, 16, 0.12);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          background: var(--bg-body);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .npc-avatar-round:hover {
          transform: scale(1.06);
          box-shadow: 0 4px 12px rgba(44, 24, 16, 0.2);
        }
        .npc-avatar-round img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        /* 详情页大圆角封面 */
        .world-cover {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          margin-bottom: 18px;
          min-height: 180px;
          display: flex;
          align-items: flex-end;
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(201, 162, 39, 0.15);
        }
        .world-cover::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(transparent 25%, rgba(0,0,0,0.7) 100%);
          pointer-events: none;
        }
        .world-cover-content {
          position: relative;
          z-index: 2;
          padding: 24px 20px;
          width: 100%;
        }
        /* 底部按钮精致渐变 */
        .btn-world-action {
          flex: 1;
          border-radius: 16px;
          padding: 12px;
          font-size: 15px;
          font-family: 'Noto Serif SC', serif;
          letter-spacing: 2px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 48px;
        }
        .btn-world-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        }
        .btn-world-action:active {
          transform: scale(0.97);
          transition-duration: 0.1s;
        }
        .btn-action-secondary {
          background: var(--bg-input);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
        }
        .btn-action-secondary:hover {
          background: var(--bg-card-hover);
          border-color: var(--color-gold);
        }
        .btn-action-primary {
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
          color: var(--text-light);
          box-shadow: 0 4px 12px rgba(139, 69, 19, 0.3);
        }
        .btn-action-primary:hover {
          filter: brightness(1.08);
          box-shadow: 0 6px 20px rgba(201, 162, 39, 0.3);
        }
        /* 入场动画 */
        @keyframes detailFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .detail-animate {
          animation: detailFadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .detail-animate:nth-child(1) { animation-delay: 0.02s; }
        .detail-animate:nth-child(2) { animation-delay: 0.08s; }
        .detail-animate:nth-child(3) { animation-delay: 0.14s; }
        .detail-animate:nth-child(4) { animation-delay: 0.20s; }
        .detail-animate:nth-child(5) { animation-delay: 0.26s; }
        /* 移动端 */
        @media (max-width: 375px) {
          .world-cover { border-radius: 18px; min-height: 150px; }
          .world-cover-content { padding: 18px 14px; }
          .world-cover h1 { font-size: 26px !important; }
          .npc-avatar-round { width: 44px; height: 44px; border-radius: 14px; }
          .btn-world-action { border-radius: 14px; font-size: 14px; padding: 10px; }
        }
      </style>

      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;" class="detail-animate">
        <button class="btn btn-sm btn-secondary" onclick="App.navigate('world-selector')" style="border-radius:50%;width:40px;height:40px;padding:0;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.08);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h2 style="margin:0;font-family:'Noto Serif SC',serif;font-size:20px;color:var(--text-primary);flex:1;text-align:center;letter-spacing:2px;">我的世界</h2>
        <button class="btn btn-sm btn-gold" onclick="WorldDetail.exportWorld()" style="border-radius:20px;padding:6px 16px;font-size:13px;letter-spacing:1px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:4px;"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          导出
        </button>
      </div>

      <!-- 封面区域：更大圆角、更好渐变遮罩 -->
      <div class="world-cover detail-animate" style="${headerBg}">
        <div class="world-cover-content">
          <h1 style="font-family:'Noto Serif SC',serif;font-size:32px;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,0.6);margin-bottom:8px;letter-spacing:3px;">${w.name}</h1>
          <p style="font-size:13px;color:rgba(255,255,255,0.9);display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="background:rgba(201,162,39,0.35);padding:3px 12px;border-radius:12px;font-size:11px;letter-spacing:1px;">${w.themeName || '古风墨境'}</span>
            <span style="opacity:0.85;">${this._npcs.length} 位角色</span>
          </p>
        </div>
      </div>

      <!-- 世界简介折叠面板 -->
      <div class="detail-card detail-animate">
        <div class="detail-card-header" onclick="WorldDetail.toggleSection('intro')" style="padding:16px 18px;">
          <span style="font-size:15px;font-weight:600;color:var(--text-primary);font-family:'Noto Serif SC',serif;letter-spacing:1px;">世界简介</span>
          <svg id="icon-intro" class="detail-toggle-icon ${this._expanded.intro ? 'expanded' : ''}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div id="section-intro" class="detail-section-body ${this._expanded.intro ? 'expanded' : ''}">
          <p style="font-size:14px;color:var(--text-secondary);line-height:1.9;">${w.description || '暂无简介，点击下方「编辑世界」添加属于这个世界的故事背景。'}</p>
        </div>
      </div>

      <!-- 角色列表折叠面板 -->
      <div class="detail-card detail-animate">
        <div class="detail-card-header" onclick="WorldDetail.toggleSection('npcs')" style="padding:16px 18px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
            <span style="font-size:15px;font-weight:600;color:var(--text-primary);font-family:'Noto Serif SC',serif;letter-spacing:1px;">角色列表</span>
            <span style="background:var(--color-primary);color:#fff;font-size:11px;padding:2px 10px;border-radius:10px;min-width:24px;text-align:center;">${this._npcs.length}</span>
          </div>
          <svg id="icon-npcs" class="detail-toggle-icon ${this._expanded.npcs ? 'expanded' : ''}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div id="section-npcs" class="detail-section-body ${this._expanded.npcs ? 'expanded' : ''}">
          ${this._npcs.length ? this._npcs.map(n => `
            <div style="display:flex;align-items:center;gap:14px;padding:10px 0;border-bottom:1px solid var(--border-light);">
              <!-- 头像：更大圆角、更好布局 -->
              <div class="npc-avatar-round">
                ${n.portraitId ? `<img src="${n.portraitId}" alt="" onerror="this.style.display='none';this.parentElement.innerHTML=\'<svg width=\\'18\\' height=\\'18\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'var(--text-muted)\\' stroke-width=\\'1.5\\'><path d=\\'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2\\'/><circle cx=\\'12\\' cy=\\'7\\' r=\\'4\\'/></svg>\';">` : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'}
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:15px;font-weight:500;color:var(--text-primary);font-family:'Noto Serif SC',serif;">${n.name || '未命名'}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${n.identity || n.gender || '未知身份'}</div>
              </div>
              <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();App.navigate('npc')" style="border-radius:12px;padding:5px 12px;font-size:12px;white-space:nowrap;">查看</button>
            </div>
          `).join('') : `
            <div style="text-align:center;padding:24px 0;color:var(--text-muted);">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="opacity:0.4;margin-bottom:8px;"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <p style="font-size:13px;line-height:1.6;">暂无角色<br>前往「人物志」添加你的第一个角色</p>
            </div>
          `}
        </div>
      </div>

      <!-- 人物关系折叠面板 -->
      <div class="detail-card detail-animate">
        <div class="detail-card-header" onclick="WorldDetail.toggleSection('relations')" style="padding:16px 18px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2"><circle cx="5" cy="6" r="3"/><circle cx="19" cy="6" r="3"/><circle cx="12" cy="18" r="3"/><line x1="5" y1="9" x2="10" y2="15"/><line x1="19" y1="9" x2="14" y2="15"/></svg>
            <span style="font-size:15px;font-weight:600;color:var(--text-primary);font-family:'Noto Serif SC',serif;letter-spacing:1px;">人物关系</span>
            <span style="background:var(--border-color);color:var(--text-muted);font-size:11px;padding:2px 10px;border-radius:10px;">0</span>
          </div>
          <svg id="icon-relations" class="detail-toggle-icon ${this._expanded.relations ? 'expanded' : ''}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div id="section-relations" class="detail-section-body ${this._expanded.relations ? 'expanded' : ''}">
          <div style="text-align:center;padding:24px 0;color:var(--text-muted);">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="opacity:0.4;margin-bottom:8px;"><circle cx="5" cy="6" r="3"/><circle cx="19" cy="6" r="3"/><circle cx="12" cy="18" r="3"/><line x1="5" y1="9" x2="10" y2="15"/><line x1="19" y1="9" x2="14" y2="15"/></svg>
            <p style="font-size:13px;line-height:1.6;">关系网络尚未建立<br>前往「关系网」管理人物关系</p>
          </div>
        </div>
      </div>

      <!-- 媒体画廊入口卡片 -->
      <div class="detail-card detail-animate" onclick="App.navigate('cg-gallery')" style="cursor:pointer;transition:box-shadow 0.2s,border-color 0.2s;" onmouseover="this.style.boxShadow='0 4px 16px rgba(44,24,16,0.1)';this.style.borderColor='var(--color-gold)';" onmouseout="this.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)';this.style.borderColor='var(--border-color)';">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 18px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span style="font-size:15px;font-weight:600;color:var(--text-primary);font-family:'Noto Serif SC',serif;letter-spacing:1px;">媒体画廊</span>
          </div>
          <div style="display:flex;align-items:center;gap:4px;">
            <span style="font-size:12px;color:var(--text-muted);">查看生成的图片和语音</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>

      <!-- 底部按钮：更大圆角、更好渐变 -->
      <div style="display:flex;gap:12px;margin-top:20px;padding-bottom:20px;" class="detail-animate">
        <button class="btn-world-action btn-action-secondary" onclick="App.navigate('worldview')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          编辑世界
        </button>
        <button class="btn-world-action btn-action-primary" onclick="WorldDetail.enterGame()">
          进入世界
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </div>
    `;
  },

  toggleSection(key) {
    this._expanded[key] = !this._expanded[key];
    const section = document.getElementById('section-' + key);
    const icon = document.getElementById('icon-' + key);
    if (section) {
      if (this._expanded[key]) {
        section.classList.add('expanded');
      } else {
        section.classList.remove('expanded');
      }
    }
    if (icon) {
      if (this._expanded[key]) {
        icon.classList.add('expanded');
      } else {
        icon.classList.remove('expanded');
      }
    }
  },

  enterGame() {
    if (this._world) {
      try {
        Storage.set('currentWorldId_v1', this._world.id);
        if (this._world.bgImage) Storage.set('homeWorldBg_v1', this._world.bgImage);
      } catch (e) {}
      App.toast('进入「' + this._world.name + '」', 'success');
    }
    App.navigate('runtime');
  },

  exportWorld() {
    if (!this._world) return;
    try {
      const data = JSON.stringify(this._world, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'world_' + this._world.name + '_' + new Date().toISOString().slice(0,10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
      App.toast('世界配置已导出', 'success');
    } catch (e) {
      App.toast('导出失败', 'error');
    }
  }
};
