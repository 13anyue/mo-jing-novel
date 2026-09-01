/**
 * =========================================================
 * AchievementSystem vv7 成就系统
 * 模块名：AchievementSystem
 * 功能：成就解锁、进度追踪、徽章展示、统计面板
 * 成就类型：剧情、收集、社交、探索、挑战
 * =========================================================
 */
const AchievementSystem = {
  // ========== 零预设：成就列表由用户自行创建 ==========
  ACHIEVEMENTS: [],
  // ====================================================

  _stats: {},

    // 初始化模块入口
  init() {
    // v7: 外部模块依赖检查
    if (typeof Storage === 'undefined') { console.warn('[v7] Storage模块未加载'); return; }
    this.renderPage(); this._loadStats(); },
    // 页面进入时调用
  onEnter() {
    this.renderAchievements(); },

  _loadStats() { this._stats = Storage.get('achievement_stats_v6', {}); },
  _saveStats() { Storage.set('achievement_stats_v6', this._stats); },

    // 渲染页面主结构
  renderPage() {
    const page = document.getElementById('page-achievement');
    if (!page) return;
    page.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
<div style="padding:var(--space-lg);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);">
          <h2 class="section-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/></svg> 成就</h2>
          <div style="font-size:14px;color:var(--text-secondary);">
            进度：<span id="achieveProgress" style="color:var(--color-gold);font-weight:600;">0</span> / ${this.ACHIEVEMENTS.length}
          </div>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:var(--space-md);flex-wrap:wrap;">
          <button class="btn btn-sm btn-primary" onclick="AchievementSystem.filter('all')">全部</button>
          <button class="btn btn-sm btn-secondary" onclick="AchievementSystem.filter('story')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 01-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg> 剧情</button>
          <button class="btn btn-sm btn-secondary" onclick="AchievementSystem.filter('collection')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg> 收集</button>
          <button class="btn btn-sm btn-secondary" onclick="AchievementSystem.filter('social')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg> 社交</button>
          <button class="btn btn-sm btn-secondary" onclick="AchievementSystem.filter('explore')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg> 探索</button>
          <button class="btn btn-sm btn-secondary" onclick="AchievementSystem.filter('challenge')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/></svg> 挑战</button>
        </div>
        <div id="achievementGrid" class="grid grid-4"></div>
      </div>
    `;
    this.renderAchievements();
  },

  _filter: 'all',
  filter(cat) { this._filter = cat; this.renderAchievements(); },

  renderAchievements() {
    const grid = document.getElementById('achievementGrid');
    if (!grid) return;
    const unlocked = Storage.get('achievements_unlocked_v6', []);
    let items = this.ACHIEVEMENTS;
    if (this._filter !== 'all') items = items.filter(a => a.category === this._filter);

    const progress = document.getElementById('achieveProgress');
    if (progress) progress.textContent = unlocked.length;

    // 零预设：空状态友好提示
    if (items.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/></svg></div><p>暂无成就，在徽章墙页面创建你的第一个成就</p></div>`;
      return;
    }

    grid.innerHTML = items.map(a => {
      const isUnlocked = unlocked.includes(a.id);
      return `
        <div class="card" style="text-align:center;${isUnlocked ? '' : 'opacity:0.6;filter:grayscale(0.8);'}">
          <div class="card-body">
            <div style="font-size:40px;margin-bottom:8px;">${isUnlocked ? a.icon : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>'}</div>
            <h4 style="font-size:14px;margin-bottom:4px;">${a.name}</h4>
            <p style="font-size:12px;color:var(--text-muted);">${a.desc}</p>
            <div style="margin-top:8px;">
              <span style="font-size:11px;padding:2px 8px;border-radius:10px;background:${isUnlocked ? 'var(--color-gold)' : 'var(--bg-sidebar)'};color:${isUnlocked ? '#fff' : 'var(--text-muted)'};">
                ${isUnlocked ? '✓ 已解锁' : '未解锁'}
              </span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  unlock(id) {
    const unlocked = Storage.get('achievements_unlocked_v6', []);
    if (unlocked.includes(id)) return;
    const ach = this.ACHIEVEMENTS.find(a => a.id === id);
    if (!ach) return;
    unlocked.push(id);
    try { Storage.set('achievements_unlocked_v6', unlocked); } catch(e) { console.warn('[v7] Storage.set失败:', e); }
    App.toast(`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/></svg> 成就解锁：${ach.name}`, 'success');
    this.renderAchievements();
  },

  incrementStat(key, value = 1) {
    this._stats[key] = (this._stats[key] || 0) + value;
    this._saveStats();
    this._checkAchievements();
  },

  _checkAchievements() {
    const s = this._stats;
    // 自动检查成就条件
    if ((s.npc_created || 0) >= 1) this.unlock('first_npc');
    if ((s.npc_created || 0) >= 10) this.unlock('npc_collector');
    if ((s.chat_count || 0) >= 1) this.unlock('first_chat');
    if ((s.chat_count || 0) >= 10) this.unlock('social_butterfly');
    if ((s.gift_count || 0) >= 10) this.unlock('gift_giver');
    if ((s.cg_count || 0) >= 20) this.unlock('cg_collector');
    if ((s.bg_uploaded || 0) >= 10) this.unlock('bg_collector');
    if ((s.map_visit || 0) >= 1) this.unlock('first_map');
    if ((s.item_count || 0) >= 1) this.unlock('first_step');
  }
};
