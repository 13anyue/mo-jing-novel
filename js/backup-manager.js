/**
 * =========================================================
 * Backup Manager v3
 * Full system backup: exports all localStorage + IndexedDB data
 * JSON format with Base64 resources. Multi-version backup history.
 * =========================================================
 */
const BackupManager = {
  init() { this.renderPage(); },
  onEnter() { this.renderList(); },

  getBackups() { return Storage.get('backupList_v3', []); },
  saveBackupList(list) { Storage.set('backupList_v3', list); },

  renderPage() {
    const page = document.getElementById('page-backup');
    if (!page) return;
    page.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:8px;">
        <h2 class="section-title">💾 备份管理</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-primary" onclick="BackupManager.createBackup()">📦 创建备份</button>
          <button class="btn btn-secondary" onclick="BackupManager.importBackup()">📥 导入备份</button>
        </div>
      </div>

      <div class="card" style="margin-bottom:var(--space-lg);">
        <div class="card-header"><h3>📦 创建完整备份</h3></div>
        <div class="card-body">
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:var(--space-md);">
            备份将包含所有角色、世界书、记忆、设置、背景、音乐、地图、插件等数据，以及IndexedDB中的图片和音频资源。
          </p>
          <div class="form-group"><label>备份名称</label><input type="text" id="backupName" placeholder="如：修仙篇-第一章完成"></div>
          <div class="form-group"><label>备注</label><textarea id="backupNote" rows="2" placeholder="备份描述..."></textarea></div>
          <div style="display:flex;gap:8px;align-items:center;">
            <button class="btn btn-primary" onclick="BackupManager.createBackup()">💾 立即备份</button>
            <label style="display:flex;align-items:center;gap:4px;font-size:13px;color:var(--text-secondary);"><input type="checkbox" id="backupIncludeMedia" checked style="width:auto;"> 包含图片/音频（文件较大）</label>
          </div>
        </div>
      </div>

      <h3 style="font-size:16px;margin-bottom:var(--space-sm);">📜 备份历史</h3>
      <div id="backupList"></div>
    `;
    this.renderList();
  },

  async createBackup() {
    const name = document.getElementById('backupName')?.value?.trim() || `备份_${new Date().toLocaleString()}`;
    const note = document.getElementById('backupNote')?.value || '';
    const includeMedia = document.getElementById('backupIncludeMedia')?.checked !== false;

    App.toast('正在创建备份...', 'info');
    try {
      const data = await this.exportAll(includeMedia);
      const jsonStr = JSON.stringify(data);
      const size = Math.round(jsonStr.length / 1024);

      // Save to IndexedDB for in-app access
      const id = 'backup_' + Date.now();
      await Storage.saveBackup(id, name, jsonStr, size);

      // Also save to localStorage list for quick access
      const list = this.getBackups();
      list.unshift({ id, name, note, size, createdAt: Date.now() });
      if (list.length > 20) list.pop(); // Keep last 20
      this.saveBackupList(list);

      // Download file
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `墨境备份_${name}_${new Date().toISOString().slice(0,10)}.json`; a.click();
      URL.revokeObjectURL(url);

      this.renderList();
      App.toast(`备份完成 (${size}KB)`, 'success');
    } catch (e) { App.toast('备份失败: ' + e.message, 'error'); }
  },

  async exportAll(includeMedia = true) {
    const data = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      name: '墨境v3完整备份',
      localStorage: {},
      indexedDB: {}
    };

    // Export all localStorage with our prefix
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(Storage.PREFIX)) {
        try { data.localStorage[key] = JSON.parse(localStorage.getItem(key)); } catch (e) { data.localStorage[key] = localStorage.getItem(key); }
      }
    }

    // Export all IndexedDB stores
    if (includeMedia) {
      data.indexedDB.images = await Storage.dbGetAll('images');
      data.indexedDB.audio = await Storage.dbGetAll('audio');
    }
    data.indexedDB.memories = await Storage.dbGetAll('memories');
    data.indexedDB.plugins = await Storage.dbGetAll('plugins');
    data.indexedDB.backups = (await Storage.dbGetAll('backups')).map(b => ({ id: b.id, name: b.name, size: b.size, createdAt: b.createdAt })); // Don't include backup data inside backups

    return data;
  },

  async importBackup() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.version || !data.localStorage) { App.toast('无效的备份文件', 'error'); return; }

        if (!confirm(`导入备份「${data.name || '未命名'}」？\n此操作将覆盖当前所有数据！`)) return;

        App.toast('正在导入...', 'info');
        await this.importAll(data);

        // Add to backup list
        const list = this.getBackups();
        list.unshift({ id: 'backup_import_' + Date.now(), name: data.name || '导入备份', note: '外部导入', size: Math.round(text.length/1024), createdAt: Date.now() });
        this.saveBackupList(list);

        App.toast('备份已导入，页面将刷新', 'success');
        setTimeout(() => location.reload(), 1500);
      } catch (e) { App.toast('导入失败: ' + e.message, 'error'); }
    };
    input.click();
  },

  async importAll(data) {
    // Restore localStorage
    if (data.localStorage) {
      for (const [k, v] of Object.entries(data.localStorage)) {
        localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
      }
    }
    // Restore IndexedDB
    if (data.indexedDB) {
      if (data.indexedDB.images) for (const i of data.indexedDB.images) await Storage.dbPut('images', i);
      if (data.indexedDB.audio) for (const a of data.indexedDB.audio) await Storage.dbPut('audio', a);
      if (data.indexedDB.memories) for (const m of data.indexedDB.memories) await Storage.dbPut('memories', m);
      if (data.indexedDB.plugins) for (const p of data.indexedDB.plugins) await Storage.dbPut('plugins', p);
    }
  },

  async restoreFromHistory(backupId) {
    const data = await Storage.getBackup(backupId);
    if (!data) { App.toast('备份数据不存在', 'error'); return; }
    if (!confirm('恢复此备份？当前数据将被覆盖！')) return;
    try {
      const parsed = JSON.parse(data);
      await this.importAll(parsed);
      App.toast('备份已恢复，页面将刷新', 'success');
      setTimeout(() => location.reload(), 1500);
    } catch (e) { App.toast('恢复失败: ' + e.message, 'error'); }
  },

  async deleteBackup(id) {
    if (!confirm('删除此备份？')) return;
    await Storage.deleteBackup(id);
    this.saveBackupList(this.getBackups().filter(b => b.id !== id));
    this.renderList();
  },

  async downloadBackup(id) {
    const data = await Storage.getBackup(id);
    if (!data) { App.toast('备份不存在', 'error'); return; }
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `墨境备份_${id}.json`; a.click();
    URL.revokeObjectURL(url);
  },

  renderList() {
    const c = document.getElementById('backupList');
    if (!c) return;
    const list = this.getBackups();
    if (list.length === 0) { c.innerHTML = '<div class="empty-state"><div class="empty-icon">💾</div><p>暂无备份</p></div>'; return; }
    c.innerHTML = list.map(b => `
      <div class="list-item">
        <span style="font-size:20px;">📦</span>
        <div class="list-info">
          <h4>${b.name}</h4>
          <p>${b.note || '无备注'} · ${b.size}KB · ${new Date(b.createdAt).toLocaleString()}</p>
        </div>
        <button class="btn btn-sm btn-primary" onclick="BackupManager.restoreFromHistory('${b.id}')">恢复</button>
        <button class="btn btn-sm btn-secondary" onclick="BackupManager.downloadBackup('${b.id}')">📥</button>
        <button class="btn btn-sm btn-danger" onclick="BackupManager.deleteBackup('${b.id}')">🗑️</button>
      </div>
    `).join('');
  }
};
