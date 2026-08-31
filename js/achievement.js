/**
 * =========================================================
 * AchievementSystem v6 — 成就系统
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

  init() { this.renderPage(); this._loadStats(); },
  onEnter() { this.renderAchievements(); },

  _loadStats() { this._stats = Storage.get('achievement_stats_v6', {}); },
  _saveStats() { Storage.set('achievement_stats_v6', this._stats); },

  renderPage() {
    const page = document.getElementById('page-achievement');
    if (!page) return;
    page.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
<div style="padding:var(--space-lg);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);">
          <h2 class="section-title">🏆 成就</h2>
          <div style="font-size:14px;color:var(--text-secondary);">
            进度：<span id="achieveProgress" style="color:var(--color-gold);font-weight:600;">0</span> / ${this.ACHIEVEMENTS.length}
          </div>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:var(--space-md);flex-wrap:wrap;">
          <button class="btn btn-sm btn-primary" onclick="AchievementSystem.filter('all')">全部</button>
          <button class="btn btn-sm btn-secondary" onclick="AchievementSystem.filter('story')">📖 剧情</button>
          <button class="btn btn-sm btn-secondary" onclick="AchievementSystem.filter('collection')">📦 收集</button>
          <button class="btn btn-sm btn-secondary" onclick="AchievementSystem.filter('social')">💬 社交</button>
          <button class="btn btn-sm btn-secondary" onclick="AchievementSystem.filter('explore')">🗺️ 探索</button>
          <button class="btn btn-sm btn-secondary" onclick="AchievementSystem.filter('challenge')">⚔️ 挑战</button>
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
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">🏆</div><p>暂无成就，在徽章墙页面创建你的第一个成就</p></div>`;
      return;
    }

    grid.innerHTML = items.map(a => {
      const isUnlocked = unlocked.includes(a.id);
      return `
        <div class="card" style="text-align:center;${isUnlocked ? '' : 'opacity:0.6;filter:grayscale(0.8);'}">
          <div class="card-body">
            <div style="font-size:40px;margin-bottom:8px;">${isUnlocked ? a.icon : '🔒'}</div>
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
    Storage.set('achievements_unlocked_v6', unlocked);
    App.toast(`🏆 成就解锁：${ach.name}`, 'success');
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
