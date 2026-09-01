/**
 * =========================================================
 * InventorySystem vv7 背包系统
 * 模块名：InventorySystem
 * 功能：道具/装备/材料/消耗品，使用、丢弃、赠送、合成
 * 物品来源：剧情奖励、NPC赠送、探索获得
 * =========================================================
 */
const InventorySystem = {
  CATEGORIES: [
    { id: 'item', name: '道具', color: '#4A90C2', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 000 20 14.5 14.5 0 000-20"/><path d="M2 12h20"/></svg>' },
    { id: 'equip', name: '装备', color: '#C9A227', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/></svg>' },
    { id: 'material', name: '材料', color: '#6B8E23', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 21c0-3 2-5 4-7"/><path d="M18 21c0-3-2-5-4-7"/><path d="M12 21V11"/><path d="M12 11c-2-2-2-6 0-8"/><path d="M12 11c2-2 2-6 0-8"/></svg>' },
    { id: 'consume', name: '消耗品', color: '#E91E63', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20.94c1.54 0 3.03-.5 4.18-1.41"/><path d="M12 20.94c-1.54 0-3.03-.5-4.18-1.41"/><path d="M12 20.94V12"/><path d="M12 12c-2.5-2.5-2.5-6.5 0-9"/><path d="M12 12c2.5-2.5 2.5-6.5 0-9"/></svg>' },
    { id: 'quest', name: '任务', color: '#9C27B0', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>' }
  ],

  _filter: 'all',

    // 初始化模块入口
  init() {
    // v7: 外部模块依赖检查
    if (typeof Storage === 'undefined') { console.warn('[v7] Storage模块未加载'); return; }
    this.renderPage(); },
    // 页面进入时调用
  onEnter() {
    this.renderInventory(); },

  getItems() { return Storage.get('inventory_v6', []); },
  saveItems(list) { Storage.set('inventory_v6', list); },

    // 渲染页面主结构
  renderPage() {
    const page = document.getElementById('page-inventory');
    if (!page) return;
    page.innerHTML = `
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:8px;">
        <h2 class="section-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> 背包</h2>
        <div style="display:flex;gap:8px;align-items:center;">
          <span style="font-size:14px;color:var(--text-secondary);">
            容量：<span id="invCount" style="color:var(--color-gold);font-weight:600;">0</span> / <span id="invMax">99</span>
          </span>
          <button class="btn btn-primary" onclick="InventorySystem.addItemPrompt()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 添加物品</button>
        </div>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:var(--space-md);flex-wrap:wrap;">
        <button class="btn btn-sm ${this._filter === 'all' ? 'btn-primary' : 'btn-secondary'}" onclick="InventorySystem.filter('all')">全部</button>
        ${this.CATEGORIES.map(c => `
          <button class="btn btn-sm ${this._filter === c.id ? 'btn-primary' : 'btn-secondary'}" onclick="InventorySystem.filter('${c.id}')">${c.icon} ${c.name}</button>
        `).join('')}
      </div>
      <div id="inventoryGrid" class="grid grid-4"></div>
    `;
    this.renderInventory();
  },

  filter(cat) { this._filter = cat; this.renderPage(); },

  renderInventory() {
    const grid = document.getElementById('inventoryGrid');
    if (!grid) return;
    let items = this.getItems();
    if (this._filter && this._filter !== 'all') {
      items = items.filter(i => i.category === this._filter);
    }

    const elCount = document.getElementById('invCount');
    const elMax = document.getElementById('invMax');
    if (elCount) elCount.textContent = items.length;

    if (items.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg></div>
          <p>背包空空如也</p>
          <p style="font-size:12px;color:var(--text-muted);">点击右上角添加物品</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = items.map(item => {
      const cat = this.CATEGORIES.find(c => c.id === item.category) || this.CATEGORIES[0];
      return `
        <div class="card" style="position:relative;overflow:hidden;">
          <div style="position:absolute;top:0;right:0;background:${cat.color};color:#fff;padding:3px 10px;border-radius:0 0 0 8px;font-size:11px;font-weight:500;">
            ${cat.name}
          </div>
          <div class="card-body" style="text-align:center;padding-top:var(--space-lg);">
            <div style="font-size:40px;margin-bottom:8px;">${item.icon || cat.icon}</div>
            <h4 style="font-size:15px;margin-bottom:4px;">${item.name}</h4>
            <p style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">${item.desc || ''}</p>
            <p style="font-size:13px;color:var(--color-gold);font-weight:600;">× ${item.quantity || 1}</p>
          </div>
          <div class="card-footer" style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">
            <button class="btn btn-sm btn-primary" onclick="InventorySystem.useItem('${item.id}')">使用</button>
            <button class="btn btn-sm btn-secondary" onclick="InventorySystem.giftItem('${item.id}')">赠送</button>
            <button class="btn btn-sm btn-danger" onclick="InventorySystem.removeItem('${item.id}')">丢弃</button>
          </div>
        </div>
      `;
    }).join('');
  },

  addItemPrompt() {
    const name = prompt('物品名称：'); if (!name) return;
    const category = prompt('类型（item道具/equip装备/material材料/consume消耗品/quest任务）：', 'item');
    const icon = prompt('图标（emoji）：', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>');
    const desc = prompt('描述：', '');
    const effect = prompt('效果（如 affection+10 / hp+20）：', '');
    this.addItem({ name, category: category || 'item', icon, desc, effect, quantity: 1 });
  },

  addItem(item) {
    const items = this.getItems();
    const existing = items.find(i => i.name === item.name && i.category === item.category);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
    } else {
      items.push({ ...item, id: 'inv_' + Date.now() });
    }
    this.saveItems(items);
    this.renderInventory();
    App.toast(`获得「${item.name}」×${item.quantity || 1}`, 'success');
    if (window.EventBridge) {
      EventBridge.emit('inventory', 'item_obtained', { itemName: item.name, quantity: item.quantity || 1 }, 'InventorySystem');
    }
  },

  useItem(id) {
    const items = this.getItems();
    const item = items.find(i => i.id === id); if (!item) return;
    App.toast(`使用了「${item.name}」`, 'info');
    if (item.effect) {
      const match = item.effect.match(/(\w+)([+-]\d+)/);
      if (match && window.EventBridge) {
        const [, stat, delta] = match;
        EventBridge.emit('inventory', 'item_used', { itemId: id, stat, delta: parseInt(delta) }, 'InventorySystem');
      }
    }
    item.quantity = (item.quantity || 1) - 1;
    if (item.quantity <= 0) {
      this.saveItems(items.filter(i => i.id !== id));
    } else {
      this.saveItems(items);
    }
    this.renderInventory();
  },

  giftItem(id) {
    const items = this.getItems();
    const item = items.find(i => i.id === id); if (!item) return;
    const target = prompt('赠送给（角色名称）：');
    if (!target) return;
    App.toast(`将「${item.name}」赠送给了 ${target}`, 'success');
    item.quantity = (item.quantity || 1) - 1;
    if (item.quantity <= 0) {
      this.saveItems(items.filter(i => i.id !== id));
    } else {
      this.saveItems(items);
    }
    this.renderInventory();
  },

  removeItem(id) {
    const items = this.getItems();
    const item = items.find(i => i.id === id);
    if (!item || !confirm(`丢弃「${item.name}」？`)) return;
    this.saveItems(items.filter(i => i.id !== id));
    this.renderInventory();
  }
};
