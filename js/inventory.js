/**
 * =========================================================
 * InventorySystem v6 — 背包系统
 * 模块名：InventorySystem
 * 功能：道具/装备/材料/消耗品，使用、丢弃、赠送、合成
 * 物品来源：剧情奖励、NPC赠送、探索获得
 * =========================================================
 */
const InventorySystem = {
  CATEGORIES: [
    { id: 'item', name: '道具', color: '#4A90C2', icon: '🔮' },
    { id: 'equip', name: '装备', color: '#C9A227', icon: '⚔️' },
    { id: 'material', name: '材料', color: '#6B8E23', icon: '🌿' },
    { id: 'consume', name: '消耗品', color: '#E91E63', icon: '🍎' },
    { id: 'quest', name: '任务', color: '#9C27B0', icon: '📜' }
  ],

  _filter: 'all',

  init() { this.renderPage(); },
  onEnter() { this.renderInventory(); },

  getItems() { return Storage.get('inventory_v6', []); },
  saveItems(list) { Storage.set('inventory_v6', list); },

  renderPage() {
    const page = document.getElementById('page-inventory');
    if (!page) return;
    page.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:8px;">
        <h2 class="section-title">🎒 背包</h2>
        <div style="display:flex;gap:8px;align-items:center;">
          <span style="font-size:14px;color:var(--text-secondary);">
            容量：<span id="invCount" style="color:var(--color-gold);font-weight:600;">0</span> / <span id="invMax">99</span>
          </span>
          <button class="btn btn-primary" onclick="InventorySystem.addItemPrompt()">➕ 添加物品</button>
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
          <div class="empty-icon">🎒</div>
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
    const icon = prompt('图标（emoji）：', '📦');
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
