/**
 * =========================================================
 * RankingSystem v17 — 排名/竞争系统
 * 核心概念：通用排行榜框架，适配任何世界观。
 * 支持NPC、家族、势力、自定义对象的排名与竞争。
 *
 * 功能：维度自定义、排名计算、历史对比、趋势图、事件记录
 * 全局对象：RankingSystem
 * 存储键：ranking_system_v17
 * 配色：古风墨境 #F5E6D3 / #C9A227 / #2C1810
 * =========================================================
 */
const RankingSystem = {

  // ===================== 常量与配置 =====================
  STORAGE_KEY: 'ranking_system_v17',
  SNAPSHOT_KEY_SUFFIX: '_snapshot',
  COLORS: {
    parchment: '#F5E6D3', parchmentLight: '#FDF8F0', gold: '#C9A227',
    goldLight: '#E8C84B', goldDark: '#A08020', ink: '#2C1810',
    inkLight: '#5C3A2A', inkMuted: '#8B7355', crimson: '#8B1A1A',
    jade: '#2D5A3D', bronze: '#CD7F32', silver: '#C0C0C0',
    white: '#FDF8F0', shadow: 'rgba(44,24,16,0.15)'
  },
  SOURCE_TYPES: ['npc', 'family', 'faction', 'custom'],
  SNAPSHOT_PERIODS: ['week', 'month', 'year'],
  PAGE_SIZE: 20,
  MAX_SNAPSHOTS: 52,

  // ===================== 状态 =====================
  dimensions: [],
  customEntries: [],
  currentDimensionId: null,
  selectedEntryId: null,
  viewMode: 'table',
  currentPage: 0,
  events: [],
  _dimensionIdCounter: 0,
  _entryIdCounter: 0,
  _eventIdCounter: 0,

  // ===================== 初始化 =====================
  init() {
    this.load();
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'n' && e.ctrlKey) { e.preventDefault(); this.openCreateDimensionModal(); }
        if (e.key === 't') { e.preventDefault(); this.toggleViewMode(); }
      });
    }
    if (typeof window !== 'undefined' && window.EventBridge) {
      window.EventBridge.on('npc', (e) => { if (e.type === 'updated') this.onNPCUpdated(e.payload); }, 'RankingSystem');
      window.EventBridge.on('family', (e) => { if (e.type === 'updated') this.onFamilyUpdated(e.payload); }, 'RankingSystem');
      window.EventBridge.on('political', (e) => { if (e.type === 'updated') this.onFactionUpdated(e.payload); }, 'RankingSystem');
    }
    this.scheduleAutoSnapshot();
    console.log('[RankingSystem] 初始化完成，维度数:', this.dimensions.length);
  },

  onEnter() { this.load(); this.renderPage(); },

  // ===================== 数据持久化 =====================
  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        this.dimensions = data.dimensions || [];
        this.customEntries = data.customEntries || [];
        this.events = data.events || [];
        this._dimensionIdCounter = data._dimensionIdCounter || 0;
        this._entryIdCounter = data._entryIdCounter || 0;
        this._eventIdCounter = data._eventIdCounter || 0;
      }
    } catch (e) {
      console.warn('[RankingSystem] 加载失败:', e);
      this.dimensions = []; this.customEntries = []; this.events = [];
    }
  },

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        dimensions: this.dimensions, customEntries: this.customEntries, events: this.events,
        _dimensionIdCounter: this._dimensionIdCounter, _entryIdCounter: this._entryIdCounter,
        _eventIdCounter: this._eventIdCounter, savedAt: new Date().toISOString()
      }));
    } catch (e) { console.warn('[RankingSystem] 保存失败:', e); }
  },

  getSnapshots(dimensionId, period) {
    try {
      const key = this.STORAGE_KEY + '_' + dimensionId + this.SNAPSHOT_KEY_SUFFIX + '_' + period;
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) { return []; }
  },

  saveSnapshot(dimensionId, period, ranking) {
    try {
      const key = this.STORAGE_KEY + '_' + dimensionId + this.SNAPSHOT_KEY_SUFFIX + '_' + period;
      const snaps = this.getSnapshots(dimensionId, period);
      snaps.push({ timestamp: Date.now(), date: new Date().toISOString(),
        ranking: ranking.map(r => ({ id: r.id, name: r.name, value: r.value, rank: r.rank })) });
      if (snaps.length > this.MAX_SNAPSHOTS) snaps.splice(0, snaps.length - this.MAX_SNAPSHOTS);
      localStorage.setItem(key, JSON.stringify(snaps));
    } catch (e) { console.warn('[RankingSystem] 快照保存失败:', e); }
  },

  // ===================== 维度管理 =====================
  createDimension(config = {}) {
    const dim = {
      id: this._genDimId(), name: config.name || '未命名维度',
      description: config.description || '', category: config.category || '通用',
      metric: config.metric || '分', icon: config.icon || '📊',
      sourceType: config.sourceType || 'custom', sourceField: config.sourceField || 'value',
      sortOrder: config.sortOrder || 'desc', enabled: config.enabled !== false,
      createdAt: Date.now(), updatedAt: Date.now()
    };
    this.dimensions.push(dim); this.save();
    this.addEvent({ type: 'dimension_created', title: '新建维度',
      description: `维度「${dim.name}」已创建`, dimensionId: dim.id, importance: 'normal' });
    this.emitEvent('dimension_created', { dimension: dim });
    return dim;
  },

  getDimensions(filter = {}) {
    let res = [...this.dimensions];
    if (filter.enabled !== undefined) res = res.filter(d => d.enabled === filter.enabled);
    if (filter.category) res = res.filter(d => d.category === filter.category);
    if (filter.search) {
      const q = filter.search.toLowerCase();
      res = res.filter(d => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q));
    }
    return res.sort((a, b) => b.createdAt - a.createdAt);
  },

  getDimension(id) { return this.dimensions.find(d => d.id === id) || null; },

  updateDimension(id, updates) {
    const dim = this.getDimension(id); if (!dim) return null;
    Object.keys(updates).forEach(k => { if (k !== 'id' && k !== 'createdAt') dim[k] = updates[k]; });
    dim.updatedAt = Date.now(); this.save();
    this.addEvent({ type: 'dimension_updated', title: '维度更新',
      description: `维度「${dim.name}」已更新`, dimensionId: id, importance: 'minor' });
    this.emitEvent('dimension_updated', { dimensionId: id, updates });
    return dim;
  },

  setDimensionEnabled(id, enabled) { return this.updateDimension(id, { enabled }); },

  deleteDimension(id) {
    const idx = this.dimensions.findIndex(d => d.id === id);
    if (idx === -1) return false;
    const dim = this.dimensions[idx];
    this.dimensions.splice(idx, 1);
    this.SNAPSHOT_PERIODS.forEach(p => {
      localStorage.removeItem(this.STORAGE_KEY + '_' + id + this.SNAPSHOT_KEY_SUFFIX + '_' + p);
    });
    this.save();
    this.addEvent({ type: 'dimension_deleted', title: '维度删除',
      description: `维度「${dim.name}」已删除`, dimensionId: id, importance: 'normal' });
    if (this.currentDimensionId === id) { this.currentDimensionId = null; this.selectedEntryId = null; }
    return true;
  },

  _genDimId() { this._dimensionIdCounter++; return 'dim_' + Date.now() + '_' + this._dimensionIdCounter; },

  // ===================== 排名对象管理 =====================
  addCustomEntry(config = {}) {
    const entry = {
      id: this._genEntryId(), name: config.name || '未命名',
      description: config.description || '', avatar: config.avatar || '',
      values: config.values || {}, tags: config.tags || [], createdAt: Date.now()
    };
    this.customEntries.push(entry); this.save();
    this.addEvent({ type: 'entry_added', title: '添加对象',
      description: `「${entry.name}」已加入排名`, entryId: entry.id, importance: 'minor' });
    this.emitEvent('entry_added', { entry });
    return entry;
  },

  updateEntryValue(entryId, dimId, value) {
    const entry = this.customEntries.find(e => e.id === entryId); if (!entry) return null;
    const oldVal = entry.values[dimId];
    entry.values[dimId] = value; this.save();
    if (oldVal !== undefined && oldVal !== value) {
      this.addEvent({ type: 'value_changed', title: '数值变化',
        description: `「${entry.name}」从 ${oldVal} 变为 ${value}`,
        entryId, dimensionId: dimId, oldValue: oldVal, newValue: value, importance: 'minor' });
    }
    this.emitEvent('entry_updated', { entryId, dimId, value, oldValue: oldVal });
    return entry;
  },

  deleteCustomEntry(id) {
    const idx = this.customEntries.findIndex(e => e.id === id);
    if (idx === -1) return false;
    const entry = this.customEntries[idx];
    this.customEntries.splice(idx, 1); this.save();
    this.addEvent({ type: 'entry_deleted', title: '删除对象',
      description: `「${entry.name}」已从排名中移除`, entryId: id, importance: 'minor' });
    return true;
  },

  _genEntryId() { this._entryIdCounter++; return 'ent_' + Date.now() + '_' + this._entryIdCounter; },

  // ===================== 排名计算 =====================
  calculateRanking(dimId) {
    const dim = this.getDimension(dimId); if (!dim) return [];
    let entries = [];
    switch (dim.sourceType) {
      case 'npc': entries = this._getNPCEntries(dim); break;
      case 'family': entries = this._getFamilyEntries(dim); break;
      case 'faction': entries = this._getFactionEntries(dim); break;
      case 'custom': entries = this._getCustomEntries(dim); break;
    }
    const desc = dim.sortOrder === 'desc';
    entries.sort((a, b) => desc ? b.value - a.value : a.value - b.value);
    const prev = this._getLatestSnapshot(dimId);
    entries.forEach((e, i) => {
      e.rank = i + 1; e.rankColor = this._getRankColor(i + 1); e.trend = 'same';
      if (prev) {
        const p = prev.ranking.find(x => x.id === e.id);
        if (p) { e.prevRank = p.rank; e.change = p.rank - e.rank; e.trend = e.change > 0 ? 'up' : e.change < 0 ? 'down' : 'same'; }
      }
    });
    return entries;
  },

  _getNPCEntries(dim) {
    const res = [];
    if (typeof NPCManager === 'undefined' || !NPCManager.getNPCs) return res;
    const field = dim.sourceField;
    NPCManager.getNPCs().forEach(npc => {
      let val = 0;
      if (npc.stats && npc.stats[field] !== undefined) val = Number(npc.stats[field]) || 0;
      else if (npc[field] !== undefined) val = Number(npc[field]) || 0;
      res.push({ id: npc.id, name: npc.name || '无名氏', value: val,
        avatar: npc.portraitId || npc.avatar || '', sourceType: 'npc', sourceId: npc.id,
        extra: { age: npc.age || '', job: npc.job || '', gender: npc.gender || '' } });
    });
    return res;
  },

  _getFamilyEntries(dim) {
    const res = [];
    if (typeof FamilySystem === 'undefined' || !FamilySystem.getFamilies) return res;
    const field = dim.sourceField;
    FamilySystem.getFamilies().forEach(f => {
      res.push({ id: f.id, name: f.name || '未命名家族', value: Number(f[field]) || 0,
        avatar: '', sourceType: 'family', sourceId: f.id,
        extra: { type: f.type || '', members: (f.members || []).length, head: f.head || '' } });
    });
    return res;
  },

  _getFactionEntries(dim) {
    const res = [];
    if (typeof PoliticalSystem === 'undefined' || !PoliticalSystem.getFactions) return res;
    const field = dim.sourceField;
    PoliticalSystem.getFactions().forEach(f => {
      let val = 0;
      if (f.resources && f.resources[field] !== undefined) val = Number(f.resources[field]) || 0;
      else if (f[field] !== undefined) val = Number(f[field]) || 0;
      res.push({ id: f.id, name: f.name || '未命名势力', value: val,
        avatar: '', sourceType: 'faction', sourceId: f.id,
        extra: { type: f.typeName || f.type || '', leader: f.leader?.name || '', members: (f.members || []).length } });
    });
    return res;
  },

  _getCustomEntries(dim) {
    return this.customEntries.map(e => ({
      id: e.id, name: e.name, value: Number(e.values[dim.id]) || 0,
      avatar: e.avatar || '', sourceType: 'custom', sourceId: e.id,
      extra: { description: e.description || '', tags: e.tags || [] }
    }));
  },

  _getLatestSnapshot(dimId) {
    const w = this.getSnapshots(dimId, 'week');
    if (w.length) return w[w.length - 1];
    const m = this.getSnapshots(dimId, 'month');
    return m.length ? m[m.length - 1] : null;
  },

  _getRankColor(rank) {
    return rank === 1 ? this.COLORS.gold : rank === 2 ? '#A0A0A0' : rank === 3 ? this.COLORS.bronze : this.COLORS.inkMuted;
  },

  // ===================== 排名事件 =====================
  addEvent(evt) {
    this.events.push({ id: this._genEventId(), timestamp: Date.now(), ...evt });
    if (this.events.length > 500) this.events.splice(0, this.events.length - 500);
    this.save();
  },

  getEvents(filter = {}) {
    let res = [...this.events];
    if (filter.dimensionId) res = res.filter(e => e.dimensionId === filter.dimensionId);
    if (filter.type) res = res.filter(e => e.type === filter.type);
    if (filter.importance) res = res.filter(e => e.importance === filter.importance);
    return res.sort((a, b) => b.timestamp - a.timestamp);
  },

  _genEventId() { this._eventIdCounter++; return 'evt_' + Date.now() + '_' + this._eventIdCounter; },

  triggerRankContest(dimId, entryId) {
    const dim = this.getDimension(dimId);
    const ranking = this.calculateRanking(dimId);
    const entry = ranking.find(r => r.id === entryId);
    if (!dim || !entry) return null;
    const idx = ranking.findIndex(r => r.id === entryId);
    let targetIdx = -1;
    if (idx > 0 && dim.sortOrder === 'desc') targetIdx = idx - 1;
    else if (idx < ranking.length - 1 && dim.sortOrder === 'asc') targetIdx = idx + 1;
    else if (idx > 0) targetIdx = idx - 1;
    if (targetIdx < 0 || targetIdx >= ranking.length) return null;
    const target = ranking[targetIdx];
    const success = Math.random() > 0.5;
    if (success) {
      entry.value = target.value + 1;
      if (entry.sourceType === 'custom') this.updateEntryValue(entry.id, dimId, entry.value);
      this.addEvent({ type: 'rank_contest', title: '排名争夺',
        description: `「${entry.name}」超越「${target.name}」，升至第${target.rank}位`,
        dimensionId: dimId, entryId, targetId: target.id, importance: 'major' });
    } else {
      this.addEvent({ type: 'rank_contest', title: '排名争夺失败',
        description: `「${entry.name}」挑战「${target.name}」失败，仍居第${entry.rank}位`,
        dimensionId: dimId, entryId, targetId: target.id, importance: 'normal' });
    }
    this.emitEvent('rank_contest', { challenger: entry, target, success, dimId });
    return { challenger: entry, target, success };
  },

  // ===================== 快照与历史 =====================
  createSnapshot(dimId, period = 'week') {
    const ranking = this.calculateRanking(dimId);
    this.saveSnapshot(dimId, period, ranking);
    this.addEvent({ type: 'snapshot_created', title: '快照记录',
      description: `已记录「${this.getDimension(dimId)?.name || '未知'}」的排名快照`,
      dimensionId: dimId, importance: 'minor' });
  },

  scheduleAutoSnapshot() {
    setInterval(() => {
      const now = new Date();
      if (now.getDay() === 1 && now.getHours() === 0) {
        this.dimensions.forEach(d => { if (d.enabled) this.createSnapshot(d.id, 'week'); });
      }
      if (now.getDate() === 1 && now.getHours() === 0) {
        this.dimensions.forEach(d => { if (d.enabled) this.createSnapshot(d.id, 'month'); });
      }
    }, 60 * 60 * 1000);
  },

  // ===================== 页面渲染 =====================
  renderPage() {
    const page = document.getElementById('ranking-system-page');
    if (!page) return;
    const C = this.COLORS;
    page.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
<style>
        .ranking-container { font-family: 'Noto Serif SC', serif; color: ${C.ink}; display: flex; flex-direction: column; height: 100%; gap: 12px; }
        .ranking-toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; padding-bottom: 12px; border-bottom: 2px solid ${C.gold}; }
        .ranking-toolbar-left, .ranking-toolbar-right { display: flex; align-items: center; gap: 12px; }
        .ranking-title { font-size: 22px; font-weight: 700; color: ${C.ink}; letter-spacing: 4px; margin: 0; }
        .ranking-dim-select { padding: 6px 12px; font-size: 14px; font-family: 'Noto Serif SC', serif; border: 1px solid ${C.gold}; background: ${C.parchment}; color: ${C.ink}; border-radius: 4px; cursor: pointer; min-width: 160px; }
        .ranking-main { display: flex; flex: 1; gap: 16px; overflow: hidden; }
        .ranking-sidebar { flex: 0 0 220px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }
        .ranking-content { flex: 1; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; min-width: 0; }
        .ranking-detail { flex: 0 0 260px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }
        .ranking-card { background: ${C.parchmentLight}; border: 1px solid ${C.gold}; border-radius: 4px; padding: 12px; }
        .ranking-card-h { font-size: 14px; font-weight: 700; color: ${C.ink}; border-bottom: 1px solid ${C.gold}; padding-bottom: 8px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
        .ranking-dim-item { padding: 8px 10px; border-radius: 3px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px; font-size: 13px; }
        .ranking-dim-item:hover { background: rgba(201,162,39,0.15); }
        .ranking-dim-item.active { background: rgba(201,162,39,0.25); border-left: 3px solid ${C.gold}; }
        .ranking-dim-item.disabled { opacity: 0.5; }
        .ranking-dim-icon { font-size: 16px; width: 24px; text-align: center; }
        .ranking-dim-name { flex: 1; }
        .ranking-dim-badge { font-size: 10px; padding: 2px 6px; border-radius: 10px; background: ${C.inkMuted}; color: ${C.white}; }
        .ranking-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .ranking-table th { background: ${C.ink}; color: ${C.gold}; padding: 10px 12px; text-align: left; font-weight: 600; position: sticky; top: 0; z-index: 10; }
        .ranking-table td { padding: 10px 12px; border-bottom: 1px solid rgba(201,162,39,0.2); }
        .ranking-table tr:hover { background: rgba(201,162,39,0.08); }
        .ranking-table tr.selected { background: rgba(201,162,39,0.2); }
        .rank-num { font-weight: 700; font-size: 15px; width: 40px; text-align: center; }
        .rank-num.gold { color: ${C.gold}; font-size: 18px; }
        .rank-num.silver { color: #A0A0A0; font-size: 16px; }
        .rank-num.bronze { color: ${C.bronze}; font-size: 15px; }
        .rank-name { display: flex; align-items: center; gap: 8px; }
        .rank-avatar { width: 32px; height: 32px; border-radius: 50%; border: 2px solid ${C.gold}; object-fit: cover; background: ${C.ink}; }
        .rank-avatar-ph { width: 32px; height: 32px; border-radius: 50%; border: 2px solid ${C.gold}; background: linear-gradient(135deg, ${C.ink}, ${C.gold}); display: flex; align-items: center; justify-content: center; color: ${C.white}; font-size: 12px; font-weight: 700; }
        .rank-val { font-weight: 700; color: ${C.ink}; font-size: 14px; }
        .rank-trend { display: inline-flex; align-items: center; gap: 2px; font-size: 12px; padding: 2px 6px; border-radius: 3px; }
        .rank-trend.up { color: ${C.jade}; background: rgba(45,90,61,0.1); }
        .rank-trend.down { color: ${C.crimson}; background: rgba(139,26,26,0.1); }
        .rank-trend.same { color: ${C.inkMuted}; background: rgba(139,115,85,0.1); }
        .ranking-podium { display: flex; justify-content: center; align-items: flex-end; gap: 16px; padding: 20px; margin-bottom: 16px; }
        .podium-item { text-align: center; transition: transform 0.3s; }
        .podium-item:hover { transform: translateY(-4px); }
        .podium-avatar { width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 8px; border: 3px solid; object-fit: cover; background: ${C.ink}; }
        .podium-avatar.gold { border-color: ${C.gold}; box-shadow: 0 0 20px rgba(201,162,39,0.4); }
        .podium-avatar.silver { border-color: #A0A0A0; box-shadow: 0 0 20px rgba(160,160,160,0.3); }
        .podium-avatar.bronze { border-color: ${C.bronze}; box-shadow: 0 0 20px rgba(205,127,50,0.3); }
        .podium-name { font-size: 14px; font-weight: 700; color: ${C.ink}; margin-bottom: 4px; }
        .podium-val { font-size: 13px; color: ${C.inkMuted}; }
        .podium-rank { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
        .podium-rank.gold { color: ${C.gold}; } .podium-rank.silver { color: #A0A0A0; } .podium-rank.bronze { color: ${C.bronze}; }
        .ranking-chart-wrap { width: 100%; height: 200px; background: ${C.parchment}; border: 1px solid ${C.gold}; border-radius: 4px; position: relative; overflow: hidden; }
        .ranking-chart { width: 100%; height: 100%; }
        .ranking-empty { text-align: center; padding: 48px; color: ${C.inkMuted}; }
        .ranking-empty-icon { font-size: 48px; margin-bottom: 12px; }
        .ranking-evt { padding: 8px; border-bottom: 1px dashed rgba(201,162,39,0.3); font-size: 12px; line-height: 1.5; }
        .ranking-evt-time { font-size: 10px; color: ${C.inkMuted}; }
        .ranking-evt-major { border-left: 3px solid ${C.gold}; padding-left: 6px; background: rgba(201,162,39,0.08); }
        .ranking-detail-name { font-size: 18px; font-weight: 700; text-align: center; color: ${C.ink}; margin-bottom: 8px; }
        .ranking-detail-rank { text-align: center; font-size: 14px; color: ${C.inkMuted}; margin-bottom: 12px; }
        .ranking-detail-stats { display: flex; flex-direction: column; gap: 8px; }
        .ranking-detail-stat { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed rgba(201,162,39,0.3); font-size: 13px; }
        .ranking-detail-stat .label { color: ${C.inkMuted}; }
        .ranking-detail-stat .value { color: ${C.ink}; font-weight: 600; }
        .ranking-btn { padding: 6px 14px; font-size: 13px; font-family: 'Noto Serif SC', serif; border: 1px solid ${C.gold}; background: linear-gradient(180deg, ${C.parchment}, #e8d5c0); color: ${C.ink}; cursor: pointer; border-radius: 3px; transition: all 0.2s; }
        .ranking-btn:hover { background: ${C.gold}; color: ${C.parchment}; }
        .ranking-btn-sm { padding: 4px 10px; font-size: 12px; }
        .ranking-btn-gold { background: ${C.gold}; color: ${C.parchment}; border-color: ${C.goldDark}; }
        .ranking-btn-gold:hover { background: ${C.goldDark}; }
        .ranking-btn-danger { border-color: ${C.crimson}; color: ${C.crimson}; }
        .ranking-btn-danger:hover { background: ${C.crimson}; color: ${C.white}; }
        .ranking-pag { display: flex; justify-content: center; gap: 4px; margin-top: 12px; }
        .ranking-pag-btn { padding: 4px 10px; font-size: 12px; border: 1px solid ${C.gold}; background: ${C.parchment}; color: ${C.ink}; cursor: pointer; border-radius: 3px; }
        .ranking-pag-btn:hover { background: ${C.gold}; color: ${C.parchment}; }
        .ranking-pag-btn.active { background: ${C.ink}; color: ${C.gold}; border-color: ${C.ink}; }
        .ranking-pag-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .ranking-tag { display: inline-block; padding: 2px 8px; font-size: 11px; border: 1px solid ${C.gold}; border-radius: 10px; color: ${C.ink}; background: rgba(201,162,39,0.1); margin: 2px; }
        @media (max-width: 768px) { .ranking-main { flex-direction: column; } .ranking-sidebar, .ranking-detail { flex: none; max-height: 200px; } }
      </style>

      <div class="ranking-container">
        <div class="ranking-toolbar">
          <div class="ranking-toolbar-left">
            <h2 class="ranking-title">📊 排名榜</h2>
            <select class="ranking-dim-select" id="ranking-dim-select" onchange="RankingSystem.selectDimension(this.value)">${this._renderDimOptions()}</select>
          </div>
          <div class="ranking-toolbar-right">
            <button class="ranking-btn" onclick="RankingSystem.toggleViewMode()">${this.viewMode === 'table' ? '🃏 卡片' : '📋 表格'}</button>
            <button class="ranking-btn ranking-btn-gold" onclick="RankingSystem.openCreateDimensionModal()">➕ 新建维度</button>
            <button class="ranking-btn" onclick="RankingSystem.openAddEntryModal()">➕ 添加对象</button>
          </div>
        </div>
        <div class="ranking-main">
          <div class="ranking-sidebar" id="ranking-sidebar">${this._renderSidebar()}</div>
          <div class="ranking-content" id="ranking-content">${this._renderContent()}</div>
          <div class="ranking-detail" id="ranking-detail">${this._renderDetail()}</div>
        </div>
      </div>

      <div class="modal-overlay" id="ranking-dim-modal" onclick="RankingSystem._closeModal(event,'ranking-dim-modal')">
        <div class="modal" onclick="event.stopPropagation()">
          <div class="modal-header"><h3 style="font-family:'Noto Serif SC',serif;">➕ 新建排名维度</h3><button class="btn-icon" onclick="RankingSystem._closeModal(null,'ranking-dim-modal')">✕</button></div>
          <div class="modal-body" id="ranking-dim-body">${this._renderDimForm()}</div>
          <div class="modal-footer"><button class="ranking-btn" onclick="RankingSystem._closeModal(null,'ranking-dim-modal')">取消</button><button class="ranking-btn ranking-btn-gold" onclick="RankingSystem.submitDimForm()">创建</button></div>
        </div>
      </div>

      <div class="modal-overlay" id="ranking-entry-modal" onclick="RankingSystem._closeModal(event,'ranking-entry-modal')">
        <div class="modal" onclick="event.stopPropagation()">
          <div class="modal-header"><h3 style="font-family:'Noto Serif SC',serif;">➕ 添加排名对象</h3><button class="btn-icon" onclick="RankingSystem._closeModal(null,'ranking-entry-modal')">✕</button></div>
          <div class="modal-body" id="ranking-entry-body">${this._renderEntryForm()}</div>
          <div class="modal-footer"><button class="ranking-btn" onclick="RankingSystem._closeModal(null,'ranking-entry-modal')">取消</button><button class="ranking-btn ranking-btn-gold" onclick="RankingSystem.submitEntryForm()">添加</button></div>
        </div>
      </div>
    `;
  },

  _renderDimOptions() {
    const dims = this.getDimensions();
    if (!dims.length) return '<option value="">暂无维度，请先创建</option>';
    let html = '<option value="">请选择维度</option>';
    dims.forEach(d => {
      html += `<option value="${d.id}" ${d.id === this.currentDimensionId ? 'selected' : ''}>${d.icon || '📊'} ${d.name}</option>`;
    });
    return html;
  },

  _renderSidebar() {
    const dims = this.getDimensions();
    if (!dims.length) {
      return `<div class="ranking-card"><div class="ranking-empty" style="padding:24px;"><div class="ranking-empty-icon">📊</div><p>暂无排名维度</p><button class="ranking-btn ranking-btn-gold ranking-btn-sm" onclick="RankingSystem.openCreateDimensionModal()" style="margin-top:8px;">新建维度</button></div></div>`;
    }
    let html = '<div class="ranking-card"><div class="ranking-card-h">📂 维度列表</div>';
    dims.forEach(d => {
      const active = d.id === this.currentDimensionId;
      html += `<div class="ranking-dim-item ${active ? 'active' : ''} ${!d.enabled ? 'disabled' : ''}" onclick="RankingSystem.selectDimension('${d.id}')"><span class="ranking-dim-icon">${d.icon || '📊'}</span><span class="ranking-dim-name">${d.name}</span><span class="ranking-dim-badge">${this._sourceLabel(d.sourceType)}</span></div>`;
    });
    html += '</div>';
    const evts = this.getEvents({ importance: 'major' }).slice(0, 5);
    if (evts.length) {
      html += '<div class="ranking-card"><div class="ranking-card-h">📜 大事记</div>';
      evts.forEach(e => html += `<div class="ranking-evt ${e.importance === 'major' ? 'ranking-evt-major' : ''}"><div>${e.description}</div><div class="ranking-evt-time">${new Date(e.timestamp).toLocaleDateString('zh-CN')}</div></div>`);
      html += '</div>';
    }
    return html;
  },

  _renderContent() {
    if (!this.currentDimensionId) {
      return `<div class="ranking-card"><div class="ranking-empty"><div class="ranking-empty-icon">📊</div><h3>请选择或创建一个排名维度</h3><p>支持任意类型的排行榜：武力、恩宠、财富、声望……</p><button class="ranking-btn ranking-btn-gold" onclick="RankingSystem.openCreateDimensionModal()" style="margin-top:16px;">➕ 新建维度</button></div></div>`;
    }
    const dim = this.getDimension(this.currentDimensionId);
    if (!dim) return '';
    const ranking = this.calculateRanking(this.currentDimensionId);
    const totalPages = Math.ceil(ranking.length / this.PAGE_SIZE);
    const start = this.currentPage * this.PAGE_SIZE;
    const pageData = ranking.slice(start, start + this.PAGE_SIZE);
    let html = ranking.length > 0 ? this._renderPodium(ranking.slice(0, 3)) : '';
    html += this.viewMode === 'table' ? this._renderTable(pageData, start) : this._renderCards(pageData, start);
    if (totalPages > 1) html += this._renderPagination(totalPages);
    html += this._renderChart(ranking.slice(0, 10));
    return html;
  },

  _renderPodium(top3) {
    const ranks = ['gold', 'silver', 'bronze'], labels = ['🥇', '🥈', '🥉'];
    let html = '<div class="ranking-podium">';
    [1, 0, 2].forEach(idx => {
      const e = top3[idx]; if (!e) return;
      const avatar = e.avatar ? `<img src="${e.avatar}" class="podium-avatar ${ranks[idx]}" onerror="this.style.display='none'">` : `<div class="podium-avatar ${ranks[idx]}"><span style="color:${this.COLORS.white};font-size:20px;">${e.name.charAt(0)}</span></div>`;
      html += `<div class="podium-item"><div class="podium-rank ${ranks[idx]}">${labels[idx]}</div>${avatar}<div class="podium-name">${e.name}</div><div class="podium-val">${e.value} ${this.getDimension(this.currentDimensionId)?.metric || ''}</div></div>`;
    });
    return html + '</div>';
  },

  _renderTable(data, offset) {
    const dim = this.getDimension(this.currentDimensionId); if (!dim) return '';
    let html = `<div class="ranking-card" style="overflow-x:auto;"><table class="ranking-table"><thead><tr><th style="width:50px;">名次</th><th>对象</th><th style="width:120px;">数值</th><th style="width:80px;">变化</th><th style="width:100px;">来源</th></tr></thead><tbody>`;
    data.forEach((e, i) => {
      const rank = offset + i + 1;
      const rc = rank <= 3 ? (rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'bronze') : '';
      const ti = e.trend === 'up' ? '▲' : e.trend === 'down' ? '▼' : '—';
      const tc = e.trend;
      const avatar = e.avatar ? `<img src="${e.avatar}" class="rank-avatar" onerror="this.style.display='none'">` : `<div class="rank-avatar-ph">${e.name.charAt(0)}</div>`;
      html += `<tr class="${this.selectedEntryId === e.id ? 'selected' : ''}" onclick="RankingSystem.selectEntry('${e.id}')"><td class="rank-num ${rc}">${rank}</td><td class="rank-name">${avatar}<span>${e.name}</span></td><td class="rank-val">${e.value} ${dim.metric}</td><td><span class="rank-trend ${tc}">${ti} ${e.change ? Math.abs(e.change) : ''}</span></td><td><span class="ranking-tag">${this._sourceLabel(e.sourceType)}</span></td></tr>`;
    });
    return html + '</tbody></table></div>';
  },

  _renderCards(data, offset) {
    const dim = this.getDimension(this.currentDimensionId); if (!dim) return '';
    let html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;">';
    data.forEach((e, i) => {
      const rank = offset + i + 1;
      const rc = this._getRankColor(rank);
      const ti = e.trend === 'up' ? '▲' : e.trend === 'down' ? '▼' : '—';
      const avatar = e.avatar ? `<img src="${e.avatar}" style="width:48px;height:48px;border-radius:50%;border:2px solid ${rc};object-fit:cover;" onerror="this.style.display='none'">` : `<div style="width:48px;height:48px;border-radius:50%;border:2px solid ${rc};background:linear-gradient(135deg,${this.COLORS.ink},${rc});display:flex;align-items:center;justify-content:center;color:${this.COLORS.white};font-size:16px;font-weight:700;">${e.name.charAt(0)}</div>`;
      html += `<div class="ranking-card ${this.selectedEntryId === e.id ? 'selected' : ''}" style="cursor:pointer;" onclick="RankingSystem.selectEntry('${e.id}')"><div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">${avatar}<div style="flex:1;"><div style="font-weight:700;font-size:15px;color:${this.COLORS.ink};">${e.name}</div><div style="font-size:12px;color:${this.COLORS.inkMuted};">第 ${rank} 名 · ${e.value} ${dim.metric}</div></div></div><div style="display:flex;justify-content:space-between;align-items:center;"><span class="rank-trend ${e.trend}">${ti} ${e.change ? Math.abs(e.change) : ''}</span><span class="ranking-tag">${this._sourceLabel(e.sourceType)}</span></div></div>`;
    });
    return html + '</div>';
  },

  _renderPagination(totalPages) {
    let html = `<div class="ranking-pag"><button class="ranking-pag-btn" onclick="RankingSystem.goToPage(${this.currentPage - 1})" ${this.currentPage <= 0 ? 'disabled' : ''}>上一页</button>`;
    for (let i = 0; i < totalPages; i++) html += `<button class="ranking-pag-btn ${i === this.currentPage ? 'active' : ''}" onclick="RankingSystem.goToPage(${i})">${i + 1}</button>`;
    html += `<button class="ranking-pag-btn" onclick="RankingSystem.goToPage(${this.currentPage + 1})" ${this.currentPage >= totalPages - 1 ? 'disabled' : ''}>下一页</button></div>`;
    return html;
  },

  _renderChart(data) {
    const id = 'ranking-trend-chart';
    setTimeout(() => this._drawChart(id, data), 0);
    return `<div class="ranking-card"><div class="ranking-card-h">📈 排名趋势</div><div class="ranking-chart-wrap"><canvas id="${id}" class="ranking-chart"></canvas></div></div>`;
  },

  _drawChart(canvasId, data) {
    const canvas = document.getElementById(canvasId); if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height, pad = { top: 20, right: 20, bottom: 40, left: 50 };
    const cw = W - pad.left - pad.right, ch = H - pad.top - pad.bottom;
    ctx.fillStyle = this.COLORS.parchment; ctx.fillRect(0, 0, W, H);
    if (!data.length) return;
    const max = Math.max(...data.map(d => d.value), 1);
    const bw = Math.min(cw / data.length * 0.6, 50), gap = cw / data.length;
    ctx.strokeStyle = this.COLORS.inkMuted; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, H - pad.bottom); ctx.lineTo(W - pad.right, H - pad.bottom); ctx.stroke();
    data.forEach((e, i) => {
      const x = pad.left + i * gap + (gap - bw) / 2, bh = (e.value / max) * ch, y = H - pad.bottom - bh;
      const grad = ctx.createLinearGradient(x, y, x, H - pad.bottom);
      const c = this._getRankColor(e.rank); grad.addColorStop(0, c); grad.addColorStop(1, this.COLORS.parchment);
      ctx.fillStyle = grad; ctx.fillRect(x, y, bw, bh);
      ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.strokeRect(x, y, bw, bh);
      ctx.fillStyle = this.COLORS.ink; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(e.value), x + bw / 2, y - 6);
      ctx.save(); ctx.translate(x + bw / 2, H - pad.bottom + 14); ctx.rotate(-Math.PI / 6); ctx.fillStyle = this.COLORS.inkMuted; ctx.font = '10px sans-serif'; ctx.fillText(e.name.substring(0, 6), 0, 0); ctx.restore();
    });
    ctx.fillStyle = this.COLORS.inkMuted; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const val = Math.round((max / 5) * i), y = H - pad.bottom - (ch / 5) * i;
      ctx.fillText(String(val), pad.left - 6, y + 3);
    }
  },

  _renderDetail() {
    if (!this.selectedEntryId || !this.currentDimensionId) {
      return `<div class="ranking-card"><div class="ranking-empty" style="padding:24px;"><div class="ranking-empty-icon">👤</div><p>点击列表中的对象查看详情</p></div></div>`;
    }
    const dim = this.getDimension(this.currentDimensionId);
    const ranking = this.calculateRanking(this.currentDimensionId);
    const e = ranking.find(r => r.id === this.selectedEntryId);
    if (!e || !dim) return '';
    const avatar = e.avatar ? `<img src="${e.avatar}" style="width:80px;height:80px;border-radius:50%;border:3px solid ${e.rankColor};object-fit:cover;margin-bottom:8px;" onerror="this.style.display='none'">` : `<div style="width:80px;height:80px;border-radius:50%;border:3px solid ${e.rankColor};background:linear-gradient(135deg,${this.COLORS.ink},${e.rankColor});display:flex;align-items:center;justify-content:center;margin:0 auto 8px;color:${this.COLORS.white};font-size:28px;font-weight:700;">${e.name.charAt(0)}</div>`;
    let html = `<div class="ranking-card"><div style="text-align:center;padding:16px 0;">${avatar}<div class="ranking-detail-name">${e.name}</div><div class="ranking-detail-rank">第 ${e.rank} 名 · ${e.value} ${dim.metric}</div></div><div class="ranking-detail-stats">`;
    html += `<div class="ranking-detail-stat"><span class="label">来源类型</span><span class="value">${this._sourceLabel(e.sourceType)}</span></div>`;
    html += `<div class="ranking-detail-stat"><span class="label">排名变化</span><span class="value" style="color:${e.trend === 'up' ? this.COLORS.jade : e.trend === 'down' ? this.COLORS.crimson : this.COLORS.inkMuted};">${e.trend === 'up' ? '▲ 上升' : e.trend === 'down' ? '▼ 下降' : '— 持平'} ${e.change ? Math.abs(e.change) + '位' : ''}</span></div>`;
    if (e.extra) {
      Object.entries(e.extra).forEach(([k, v]) => {
        if (v !== undefined && v !== '' && v !== null) {
          const label = { age: '年龄', job: '职业', gender: '性别', type: '类型', members: '成员数', head: '领袖', leader: '领袖', description: '描述', tags: '标签' }[k] || k;
          html += `<div class="ranking-detail-stat"><span class="label">${label}</span><span class="value">${Array.isArray(v) ? v.join(', ') : v}</span></div>`;
        }
      });
    }
    html += `</div><div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap;">`;
    if (e.sourceType === 'custom') {
      html += `<button class="ranking-btn ranking-btn-sm" onclick="RankingSystem.editEntryValue('${e.id}')">✏️ 修改数值</button><button class="ranking-btn ranking-btn-sm ranking-btn-danger" onclick="RankingSystem.deleteEntry('${e.id}')">🗑️ 删除</button>`;
    } else {
      html += `<button class="ranking-btn ranking-btn-sm" onclick="RankingSystem.jumpToSource('${e.sourceType}','${e.sourceId}')">🔍 查看源</button>`;
    }
    html += `<button class="ranking-btn ranking-btn-sm" onclick="RankingSystem.triggerRankContest('${this.currentDimensionId}','${e.id}')">⚔️ 挑战</button></div></div>`;
    html += `<div class="ranking-card"><div class="ranking-card-h">📜 历史对比</div>${this._renderHistoryComp(e)}</div>`;
    return html;
  },

  _renderHistoryComp(entry) {
    const dim = this.getDimension(this.currentDimensionId); if (!dim) return '';
    let html = '';
    const ws = this.getSnapshots(dim.id, 'week');
    if (ws.length) {
      const lw = ws[ws.length - 1], p = lw.ranking.find(r => r.id === entry.id);
      if (p) { const ch = p.rank - entry.rank; html += `<div class="ranking-detail-stat"><span class="label">上周排名</span><span class="value" style="color:${ch > 0 ? this.COLORS.jade : ch < 0 ? this.COLORS.crimson : this.COLORS.inkMuted};">第 ${p.rank} 名 ${ch !== 0 ? '(' + (ch > 0 ? '+' : '') + ch + ')' : ''}</span></div>`; }
    }
    const ms = this.getSnapshots(dim.id, 'month');
    if (ms.length) {
      const lm = ms[ms.length - 1], p = lm.ranking.find(r => r.id === entry.id);
      if (p) { const ch = p.rank - entry.rank; html += `<div class="ranking-detail-stat"><span class="label">上月排名</span><span class="value" style="color:${ch > 0 ? this.COLORS.jade : ch < 0 ? this.COLORS.crimson : this.COLORS.inkMuted};">第 ${p.rank} 名 ${ch !== 0 ? '(' + (ch > 0 ? '+' : '') + ch + ')' : ''}</span></div>`; }
    }
    return html || `<div style="color:${this.COLORS.inkMuted};font-size:12px;text-align:center;padding:8px;">暂无历史数据</div>`;
  },

  _renderDimForm() {
    return `<div style="display:flex;flex-direction:column;gap:12px;"><div class="form-group"><label>维度名称 <span style="color:#8B3333">*</span></label><input type="text" id="dim-name" placeholder="例如：武力排行、恩宠排行"></div><div class="form-group"><label>描述</label><input type="text" id="dim-desc" placeholder="该维度的说明"></div><div class="form-row"><div class="form-group"><label>分类</label><input type="text" id="dim-category" placeholder="例如：宫廷、修仙"></div><div class="form-group"><label>计量单位</label><input type="text" id="dim-metric" value="分" placeholder="如：分、两、级"></div></div><div class="form-row"><div class="form-group"><label>数据来源</label><select id="dim-source-type"><option value="npc">NPC数据</option><option value="family">家族数据</option><option value="faction">势力数据</option><option value="custom">自定义对象</option></select></div><div class="form-group"><label>数据字段</label><input type="text" id="dim-source-field" value="value" placeholder="属性字段名"></div></div><div class="form-row"><div class="form-group"><label>排序方向</label><select id="dim-sort-order"><option value="desc">从高到低</option><option value="asc">从低到高</option></select></div><div class="form-group"><label>图标</label><input type="text" id="dim-icon" value="📊" placeholder="emoji图标"></div></div></div>`;
  },

  _renderEntryForm() {
    const dims = this.getDimensions().filter(d => d.sourceType === 'custom');
    let opts = '';
    if (!dims.length) opts = '<option value="">暂无自定义维度，请先创建</option>';
    else dims.forEach(d => { opts += `<option value="${d.id}" ${d.id === this.currentDimensionId ? 'selected' : ''}>${d.name}</option>`; });
    return `<div style="display:flex;flex-direction:column;gap:12px;"><div class="form-group"><label>所属维度</label><select id="entry-dimension">${opts}</select></div><div class="form-group"><label>对象名称 <span style="color:#8B3333">*</span></label><input type="text" id="entry-name" placeholder="对象名称"></div><div class="form-group"><label>描述</label><input type="text" id="entry-desc" placeholder="对象描述"></div><div class="form-group"><label>初始数值</label><input type="number" id="entry-value" value="0"></div><div class="form-group"><label>标签（逗号分隔）</label><input type="text" id="entry-tags" placeholder="标签1, 标签2"></div></div>`;
  },

  // ===================== 页面交互 =====================
  selectDimension(id) { if (!id) return; this.currentDimensionId = id; this.selectedEntryId = null; this.currentPage = 0; this.renderPage(); },
  selectEntry(id) { this.selectedEntryId = id; const p = document.getElementById('ranking-detail'); if (p) p.innerHTML = this._renderDetail(); const c = document.getElementById('ranking-content'); if (c) c.innerHTML = this._renderContent(); },
  toggleViewMode() { this.viewMode = this.viewMode === 'table' ? 'card' : 'table'; this.renderPage(); },
  goToPage(page) { if (page < 0) return; const dim = this.getDimension(this.currentDimensionId); if (!dim) return; const total = Math.ceil(this.calculateRanking(this.currentDimensionId).length / this.PAGE_SIZE); if (page >= total) return; this.currentPage = page; const c = document.getElementById('ranking-content'); if (c) c.innerHTML = this._renderContent(); },
  openCreateDimensionModal() { const m = document.getElementById('ranking-dim-modal'); if (m) m.classList.add('show'); },
  openAddEntryModal() { const m = document.getElementById('ranking-entry-modal'); if (m) m.classList.add('show'); },
  _closeModal(e, id) { if (e && e.target !== e.currentTarget) return; const m = document.getElementById(id); if (m) m.classList.remove('show'); },

  submitDimForm() {
    const name = document.getElementById('dim-name')?.value?.trim();
    if (!name) { this._toast('请输入维度名称', 'error'); return; }
    const dim = this.createDimension({
      name, description: document.getElementById('dim-desc')?.value || '',
      category: document.getElementById('dim-category')?.value || '通用',
      metric: document.getElementById('dim-metric')?.value || '分',
      sourceType: document.getElementById('dim-source-type')?.value || 'custom',
      sourceField: document.getElementById('dim-source-field')?.value || 'value',
      sortOrder: document.getElementById('dim-sort-order')?.value || 'desc',
      icon: document.getElementById('dim-icon')?.value || '📊'
    });
    this._closeModal(null, 'ranking-dim-modal');
    this.currentDimensionId = dim.id;
    this._toast(`维度「${dim.name}」已创建`, 'success');
    this.renderPage();
  },

  submitEntryForm() {
    const dimId = document.getElementById('entry-dimension')?.value;
    const name = document.getElementById('entry-name')?.value?.trim();
    if (!name) { this._toast('请输入对象名称', 'error'); return; }
    if (!dimId) { this._toast('请先选择一个自定义维度', 'error'); return; }
    const val = Number(document.getElementById('entry-value')?.value) || 0;
    const entry = this.addCustomEntry({
      name, description: document.getElementById('entry-desc')?.value || '',
      values: { [dimId]: val },
      tags: (document.getElementById('entry-tags')?.value || '').split(',').map(s => s.trim()).filter(Boolean)
    });
    this._closeModal(null, 'ranking-entry-modal');
    this.currentDimensionId = dimId;
    this._toast(`「${entry.name}」已添加`, 'success');
    this.renderPage();
  },

  editEntryValue(id) {
    const entry = this.customEntries.find(e => e.id === id);
    if (!entry || !this.currentDimensionId) return;
    const dim = this.getDimension(this.currentDimensionId);
    const cur = entry.values[this.currentDimensionId] || 0;
    const nv = prompt(`修改「${entry.name}」在「${dim?.name || '未知'}」中的数值：`, String(cur));
    if (nv === null) return;
    const v = Number(nv); if (isNaN(v)) { this._toast('请输入有效的数字', 'error'); return; }
    this.updateEntryValue(id, this.currentDimensionId, v);
    this._toast('数值已更新', 'success'); this.renderPage();
  },

  deleteEntry(id) {
    const entry = this.customEntries.find(e => e.id === id); if (!entry) return;
    if (!confirm(`确定要删除「${entry.name}」吗？`)) return;
    this.deleteCustomEntry(id); if (this.selectedEntryId === id) this.selectedEntryId = null;
    this._toast('对象已删除', 'info'); this.renderPage();
  },

  jumpToSource(type, id) {
    switch (type) {
      case 'npc': if (typeof NPCManager !== 'undefined' && NPCManager.viewNPC) NPCManager.viewNPC(id); break;
      case 'family': console.log('[RankingSystem] 跳转到家族:', id); break;
      case 'faction': console.log('[RankingSystem] 跳转到势力:', id); break;
    }
  },

  // ===================== 事件响应 =====================
  onNPCUpdated(payload) {
    this.dimensions.filter(d => d.sourceType === 'npc' && d.enabled).forEach(dim => {
      const ranking = this.calculateRanking(dim.id);
      const e = ranking.find(r => r.id === payload?.npcId);
      if (e && e.change !== 0) {
        this.addEvent({ type: 'rank_changed', title: '排名变化',
          description: `「${e.name}」在${dim.name}中排名${e.change > 0 ? '上升' : '下降'}`,
          dimensionId: dim.id, entryId: e.id, importance: e.rank <= 10 ? 'major' : 'minor' });
      }
    });
  },

  onFamilyUpdated(payload) {
    this.dimensions.filter(d => d.sourceType === 'family' && d.enabled).forEach(dim => {
      const ranking = this.calculateRanking(dim.id);
      const e = ranking.find(r => r.id === payload?.familyId);
      if (e && e.change !== 0) {
        this.addEvent({ type: 'rank_changed', title: '家族排名变化',
          description: `「${e.name}」在${dim.name}中排名${e.change > 0 ? '上升' : '下降'}`,
          dimensionId: dim.id, entryId: e.id, importance: e.rank <= 10 ? 'major' : 'minor' });
      }
    });
  },

  onFactionUpdated(payload) {
    this.dimensions.filter(d => d.sourceType === 'faction' && d.enabled).forEach(dim => {
      const ranking = this.calculateRanking(dim.id);
      const e = ranking.find(r => r.id === payload?.factionId);
      if (e && e.change !== 0) {
        this.addEvent({ type: 'rank_changed', title: '势力排名变化',
          description: `「${e.name}」在${dim.name}中排名${e.change > 0 ? '上升' : '下降'}`,
          dimensionId: dim.id, entryId: e.id, importance: e.rank <= 10 ? 'major' : 'minor' });
      }
    });
  },

  // ===================== 辅助方法 =====================

  /**
   * 获取来源类型标签
   * @param {string} type 来源类型
   * @returns {string} 中文标签
   */
  _sourceLabel(type) { return { npc: 'NPC', family: '家族', faction: '势力', custom: '自定义' }[type] || type; },

  /**
   * 发送EventBridge事件通知其他模块
   * @param {string} type 事件类型
   * @param {Object} payload 事件数据
   */
  emitEvent(type, payload) {
    if (typeof window !== 'undefined' && window.EventBridge && window.EventBridge.emit) {
      window.EventBridge.emit('ranking', { type, payload, source: 'RankingSystem' });
    }
  },

  /**
   * 显示提示消息（优先使用App.toast，否则降级到console）
   * @param {string} msg 消息内容
   * @param {string} type 消息类型 success/error/info/warning
   */
  _toast(msg, type) {
    if (typeof App !== 'undefined' && App.toast) App.toast(msg, type);
    else console.log(`[RankingSystem] ${type}: ${msg}`);
  },

  /**
   * 转义HTML特殊字符，防止XSS注入
   * @param {string} str 原始字符串
   * @returns {string} 转义后的安全字符串
   */
  escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  // ===================== 搜索与筛选 =====================

  /**
   * 搜索排名条目
   * @param {string} dimId 维度ID
   * @param {string} keyword 搜索关键词
   * @returns {Array<Object>} 匹配的排名条目
   */
  searchEntries(dimId, keyword) {
    const ranking = this.calculateRanking(dimId);
    if (!keyword) return ranking;
    const q = keyword.toLowerCase();
    return ranking.filter(e => e.name.toLowerCase().includes(q));
  },

  /**
   * 按排名范围筛选
   * @param {string} dimId 维度ID
   * @param {number} minRank 最小名次（含）
   * @param {number} maxRank 最大名次（含）
   * @returns {Array<Object>} 筛选后的排名条目
   */
  filterByRankRange(dimId, minRank, maxRank) {
    const ranking = this.calculateRanking(dimId);
    return ranking.filter(e => e.rank >= minRank && e.rank <= maxRank);
  },

  /**
   * 按数值范围筛选
   * @param {string} dimId 维度ID
   * @param {number} minValue 最小值（含）
   * @param {number} maxValue 最大值（含）
   * @returns {Array<Object>} 筛选后的排名条目
   */
  filterByValueRange(dimId, minValue, maxValue) {
    const ranking = this.calculateRanking(dimId);
    return ranking.filter(e => e.value >= minValue && e.value <= maxValue);
  },

  // ===================== 批量操作 =====================

  /**
   * 批量更新自定义对象数值
   * @param {string} dimId 维度ID
   * @param {Array<Object>} updates 更新数组 [{entryId, value}]
   * @returns {number} 成功更新的数量
   */
  batchUpdateValues(dimId, updates) {
    let count = 0;
    updates.forEach(u => {
      const entry = this.customEntries.find(e => e.id === u.entryId);
      if (entry) {
        this.updateEntryValue(u.entryId, dimId, u.value);
        count++;
      }
    });
    if (count > 0) {
      this._toast(`已批量更新 ${count} 个对象的数值`, 'success');
      this.renderPage();
    }
    return count;
  },

  /**
   * 批量删除自定义对象
   * @param {Array<string>} entryIds 对象ID数组
   * @returns {number} 成功删除的数量
   */
  batchDeleteEntries(entryIds) {
    if (!confirm(`确定要删除选中的 ${entryIds.length} 个对象吗？`)) return 0;
    let count = 0;
    entryIds.forEach(id => {
      if (this.deleteCustomEntry(id)) count++;
    });
    if (count > 0) {
      this._toast(`已删除 ${count} 个对象`, 'info');
      this.renderPage();
    }
    return count;
  },

  // ===================== 成就与徽章联动 =====================

  /**
   * 检查排名相关成就触发条件
   * @param {string} dimId 维度ID
   * @param {Object} entry 排名条目
   */
  checkRankingAchievements(dimId, entry) {
    if (typeof AchievementSystem === 'undefined' || !AchievementSystem.incrementStat) return;

    // 第一名成就
    if (entry.rank === 1) {
      AchievementSystem.incrementStat('ranking_first_place', 1);
    }
    // 进入前十名
    if (entry.rank <= 10 && entry.trend === 'up') {
      AchievementSystem.incrementStat('ranking_top10_rise', 1);
    }
    // 排名大幅上升（超过5位）
    if (entry.change >= 5) {
      AchievementSystem.incrementStat('ranking_big_jump', 1);
    }
  },

  // ===================== 数据导出导入 =====================

  /**
   * 导出指定维度的排名数据为JSON
   * @param {string} dimId 维度ID
   * @returns {string} JSON字符串
   */
  exportRankingJSON(dimId) {
    const dim = this.getDimension(dimId);
    const ranking = this.calculateRanking(dimId);
    const data = {
      dimension: { name: dim?.name, description: dim?.description, metric: dim?.metric },
      exportedAt: new Date().toISOString(),
      ranking: ranking.map(r => ({
        rank: r.rank, name: r.name, value: r.value,
        trend: r.trend, change: r.change || 0
      }))
    };
    return JSON.stringify(data, null, 2);
  },

  /**
   * 导出所有维度数据（完整备份）
   * @returns {string} JSON字符串
   */
  exportAllData() {
    const data = {
      version: 'v17',
      exportedAt: new Date().toISOString(),
      dimensions: this.dimensions,
      customEntries: this.customEntries,
      events: this.events
    };
    return JSON.stringify(data, null, 2);
  },

  /**
   * 导入维度数据
   * @param {string} jsonString JSON字符串
   * @returns {boolean} 是否成功
   */
  importDimensions(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.dimensions && Array.isArray(data.dimensions)) {
        data.dimensions.forEach(d => {
          // 避免ID冲突，重新生成ID
          d.id = this._genDimId();
          d.createdAt = Date.now();
          this.dimensions.push(d);
        });
      }
      if (data.customEntries && Array.isArray(data.customEntries)) {
        data.customEntries.forEach(e => {
          e.id = this._genEntryId();
          e.createdAt = Date.now();
          this.customEntries.push(e);
        });
      }
      this.save();
      this._toast('数据导入成功', 'success');
      this.renderPage();
      return true;
    } catch (e) {
      this._toast('数据导入失败：格式错误', 'error');
      return false;
    }
  },

  // ===================== 统计与报表 =====================

  /**
   * 获取维度统计摘要
   * @param {string} dimId 维度ID
   * @returns {Object} 统计对象
   */
  getDimensionStats(dimId) {
    const ranking = this.calculateRanking(dimId);
    if (ranking.length === 0) return null;
    const values = ranking.map(r => r.value);
    const total = values.reduce((a, b) => a + b, 0);
    return {
      totalEntries: ranking.length,
      averageValue: Math.round(total / values.length * 100) / 100,
      maxValue: Math.max(...values),
      minValue: Math.min(...values),
      top3: ranking.slice(0, 3).map(r => ({ name: r.name, value: r.value })),
      risingCount: ranking.filter(r => r.trend === 'up').length,
      fallingCount: ranking.filter(r => r.trend === 'down').length
    };
  },

  /**
   * 渲染统计面板（右侧边栏补充）
   * @param {string} dimId 维度ID
   * @returns {string} HTML字符串
   */
  renderStatsPanel(dimId) {
    const stats = this.getDimensionStats(dimId);
    if (!stats) return '';
    const C = this.COLORS;
    return `
      <div class="ranking-card">
        <div class="ranking-card-h">📊 统计摘要</div>
        <div class="ranking-detail-stats">
          <div class="ranking-detail-stat"><span class="label">总条目</span><span class="value">${stats.totalEntries}</span></div>
          <div class="ranking-detail-stat"><span class="label">平均值</span><span class="value">${stats.averageValue}</span></div>
          <div class="ranking-detail-stat"><span class="label">最高值</span><span class="value">${stats.maxValue}</span></div>
          <div class="ranking-detail-stat"><span class="label">最低值</span><span class="value">${stats.minValue}</span></div>
          <div class="ranking-detail-stat"><span class="label">上升数</span><span class="value" style="color:${C.jade}">${stats.risingCount}</span></div>
          <div class="ranking-detail-stat"><span class="label">下降数</span><span class="value" style="color:${C.crimson}">${stats.fallingCount}</span></div>
        </div>
      </div>
    `;
  },

  // ===================== 自动快照管理 =====================

  /**
   * 手动触发所有启用维度的快照
   * @param {string} period 周期 week/month/year
   */
  snapshotAll(period = 'week') {
    let count = 0;
    this.dimensions.forEach(d => {
      if (d.enabled) {
        this.createSnapshot(d.id, period);
        count++;
      }
    });
    this._toast(`已为 ${count} 个维度创建${period === 'week' ? '周' : period === 'month' ? '月' : '年'}度快照`, 'success');
  },

  /**
   * 清除指定维度的所有快照
   * @param {string} dimId 维度ID
   */
  clearSnapshots(dimId) {
    if (!confirm('确定要清除该维度的所有历史快照吗？此操作不可撤销。')) return;
    this.SNAPSHOT_PERIODS.forEach(p => {
      const key = this.STORAGE_KEY + '_' + dimId + this.SNAPSHOT_KEY_SUFFIX + '_' + p;
      localStorage.removeItem(key);
    });
    this._toast('历史快照已清除', 'info');
  },

  // ===================== 高级排名算法 =====================

  /**
   * 计算排名百分比（百分位）
   * @param {string} dimId 维度ID
   * @param {string} entryId 对象ID
   * @returns {number|null} 百分位（0-100），null表示未找到
   */
  getPercentile(dimId, entryId) {
    const ranking = this.calculateRanking(dimId);
    const idx = ranking.findIndex(r => r.id === entryId);
    if (idx === -1) return null;
    return Math.round(((ranking.length - idx) / ranking.length) * 100);
  },

  /**
   * 获取对象的排名历史趋势
   * @param {string} dimId 维度ID
   * @param {string} entryId 对象ID
   * @returns {Array<Object>} 历史排名数组 [{date, rank, value}]
   */
  getEntryRankHistory(dimId, entryId) {
    const history = [];
    ['week', 'month'].forEach(period => {
      const snaps = this.getSnapshots(dimId, period);
      snaps.forEach(snap => {
        const entry = snap.ranking.find(r => r.id === entryId);
        if (entry) {
          history.push({ date: snap.date, rank: entry.rank, value: entry.value, period });
        }
      });
    });
    return history.sort((a, b) => new Date(a.date) - new Date(b.date));
  },

  /**
   * 获取排名相邻的对手
   * @param {string} dimId 维度ID
   * @param {string} entryId 对象ID
   * @param {number} range 前后范围，默认1
   * @returns {Object} { above: [], below: [] }
   */
  getNeighbors(dimId, entryId, range = 1) {
    const ranking = this.calculateRanking(dimId);
    const idx = ranking.findIndex(r => r.id === entryId);
    if (idx === -1) return { above: [], below: [] };
    return {
      above: ranking.slice(Math.max(0, idx - range), idx),
      below: ranking.slice(idx + 1, idx + 1 + range)
    };
  }
};

// ===================== 自动初始化 =====================
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => RankingSystem.init());
  } else {
    RankingSystem.init();
  }
}
