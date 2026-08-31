/**
 * =========================================================
 * AppSettings v6 — 设置中心
 * 模块名：AppSettings
 * 功能：账号信息、隐私、通知、语言、数据管理
 * =========================================================
 */
const AppSettings = {
  init() { this.renderPage(); },
  onEnter() { this.renderSettingsInterface(); },

  renderPage() {
    const page = document.getElementById('page-settings');
    if (!page) return;
    page.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
      <div id="settingsInterface" style="max-width:700px;margin:0 auto;padding:var(--space-lg);"></div>`;
    this.renderSettingsInterface();
  },

  renderSettingsInterface() {
    const c = document.getElementById('settingsInterface');
    if (!c) return;
    c.innerHTML = `
      <h3 style="margin-bottom:var(--space-lg);font-size:20px;">⚙️ 设置</h3>
      <div class="card" style="margin-bottom:var(--space-md);">
        <div class="card-header"><h4>👤 账号信息</h4></div>
        <div class="card-body">
          <div class="form-group"><label>玩家名称</label><input type="text" id="setPlayerName" value="${Storage.get('playerName', '玩家')}"></div>
          <div class="form-group"><label>玩家身份</label><input type="text" id="setPlayerIdentity" value="${Storage.get('userMask', {}).identity || ''}" placeholder="如：穿越者 / 修仙者 / 皇帝"></div>
          <div class="form-group"><label>签名档</label><input type="text" id="setPlayerSignature" value="${Storage.get('userMask', {}).signature || ''}" placeholder="个性签名"></div>
          <button class="btn btn-primary" onclick="AppSettings.saveAccount()">💾 保存账号</button>
        </div>
      </div>
      <div class="card" style="margin-bottom:var(--space-md);">
        <div class="card-header"><h4>🔔 通知</h4></div>
        <div class="card-body">
          <label style="display:flex;align-items:center;gap:8px;margin-bottom:10px;cursor:pointer;"><input type="checkbox" id="setNotifyAI" ${Storage.get('notifyAI', true) ? 'checked' : ''} style="width:auto;"><span>AI 回复通知</span></label>
          <label style="display:flex;align-items:center;gap:8px;margin-bottom:10px;cursor:pointer;"><input type="checkbox" id="setNotifyMail" ${Storage.get('notifyMail', true) ? 'checked' : ''} style="width:auto;"><span>邮件通知</span></label>
          <label style="display:flex;align-items:center;gap:8px;margin-bottom:10px;cursor:pointer;"><input type="checkbox" id="setNotifyAchieve" ${Storage.get('notifyAchieve', true) ? 'checked' : ''} style="width:auto;"><span>成就解锁通知</span></label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;"><input type="checkbox" id="setNotifyQuest" ${Storage.get('notifyQuest', true) ? 'checked' : ''} style="width:auto;"><span>任务提醒</span></label>
          <button class="btn btn-primary" style="margin-top:12px;" onclick="AppSettings.saveNotify()">💾 保存通知</button>
        </div>
      </div>
      <div class="card" style="margin-bottom:var(--space-md);">
        <div class="card-header"><h4>🎨 显示</h4></div>
        <div class="card-body">
          <div class="form-group"><label>主题风格</label><select id="setTheme" onchange="AppSettings.saveTheme()"><option value="mojing" ${Storage.get('theme', 'mojing') === 'mojing' ? 'selected' : ''}>🎋 墨境古风</option><option value="dark" ${Storage.get('theme') === 'dark' ? 'selected' : ''}>🌙 深夜模式</option><option value="light" ${Storage.get('theme') === 'light' ? 'selected' : ''}>☀️ 明亮模式</option></select></div>
          <div class="form-group"><label>字体大小</label><select id="setFontSize" onchange="AppSettings.saveFontSize()"><option value="14" ${Storage.get('fontSize', '16') === '14' ? 'selected' : ''}>小</option><option value="16" ${Storage.get('fontSize', '16') === '16' ? 'selected' : ''}>中</option><option value="18" ${Storage.get('fontSize', '16') === '18' ? 'selected' : ''}>大</option></select></div>
          <div class="form-group"><label>小说模式</label><select id="setNovelMode" onchange="AppSettings.saveNovelMode()"><option value="visual" ${Storage.get('novelMode', 'visual') === 'visual' ? 'selected' : ''}>🎬 视觉小说（对话+立绘+选项）</option><option value="text" ${Storage.get('novelMode') === 'text' ? 'selected' : ''}>📖 文本小说（Markdown章节阅读）</option></select></div>
        </div>
      </div>
      <div class="card" style="margin-bottom:var(--space-md);">
        <div class="card-header"><h4>💾 数据管理</h4></div>
        <div class="card-body">
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">⚠️ 以下操作不可逆，请谨慎操作。</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-secondary" onclick="AppSettings.exportData()">📤 导出数据</button>
            <button class="btn btn-secondary" onclick="AppSettings.importData()">📥 导入数据</button>
            <button class="btn btn-danger" onclick="AppSettings.resetAll()">⚠️ 重置所有数据</button>
          </div>
        </div>
      </div>
    `;
  },

  saveAccount() {
    const name = document.getElementById('setPlayerName')?.value || '玩家';
    const identity = document.getElementById('setPlayerIdentity')?.value || '';
    const signature = document.getElementById('setPlayerSignature')?.value || '';
    Storage.set('playerName', name);
    const mask = Storage.get('userMask', {});
    mask.playerName = name; mask.identity = identity; mask.signature = signature;
    Storage.set('userMask', mask);
    App.toast('账号信息已保存', 'success');
  },

  saveNotify() {
    Storage.set('notifyAI', document.getElementById('setNotifyAI')?.checked !== false);
    Storage.set('notifyMail', document.getElementById('setNotifyMail')?.checked !== false);
    Storage.set('notifyAchieve', document.getElementById('setNotifyAchieve')?.checked !== false);
    Storage.set('notifyQuest', document.getElementById('setNotifyQuest')?.checked !== false);
    App.toast('通知设置已保存', 'success');
  },

  saveTheme() {
    const theme = document.getElementById('setTheme')?.value || 'mojing';
    Storage.set('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    App.toast('主题已切换：' + theme, 'success');
  },

  saveFontSize() {
    const size = document.getElementById('setFontSize')?.value || '16';
    Storage.set('fontSize', size);
    document.documentElement.style.fontSize = size + 'px';
    App.toast('字体大小已调整', 'success');
  },

  saveNovelMode() {
    const mode = document.getElementById('setNovelMode')?.value || 'visual';
    Storage.set('novelMode', mode);
    NovelRuntime._state.novelMode = mode;
    App.toast('小说模式已切换：' + (mode === 'visual' ? '视觉小说' : '文本小说'), 'success');
  },

  exportData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('mj_')) data[key] = localStorage.getItem(key);
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'mojing_backup_' + new Date().toISOString().slice(0, 10) + '.json';
    a.click(); URL.revokeObjectURL(url);
    App.toast('数据已导出', 'success');
  },

  importData() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          Object.keys(data).forEach(key => localStorage.setItem(key, data[key]));
          App.toast('数据已导入，页面将刷新', 'success');
          setTimeout(() => location.reload(), 1500);
        } catch (err) { App.toast('导入失败：' + err.message, 'error'); }
      };
      reader.readAsText(file);
    };
    input.click();
  },

  resetAll() {
    if (!confirm('⚠️ 这将删除所有数据！确定要重置吗？')) return;
    localStorage.clear();
    indexedDB.deleteDatabase('MojingDB_v3');
    App.toast('所有数据已重置，页面将刷新', 'info');
    setTimeout(() => location.reload(), 1500);
  }
};
