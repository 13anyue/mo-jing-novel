/**
 * =========================================================
 * AppSettings vv7 设置中心
 * 模块名：AppSettings
 * 功能：账号信息、隐私、通知、语言、数据管理
 * =========================================================
 */
const AppSettings = {
    // 初始化模块入口
  init() {
    // v7: 外部模块依赖检查
    if (typeof Storage === 'undefined') { console.warn('[v7] Storage模块未加载'); return; }
    this.renderPage(); },
    // 页面进入时调用
  onEnter() {
    this.renderSettingsInterface(); },

    // 渲染页面主结构
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
      <h3 style="margin-bottom:var(--space-lg);font-size:20px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.62 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg> 设置</h3>
      <div class="card" style="margin-bottom:var(--space-md);">
        <div class="card-header"><h4><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> 账号信息</h4></div>
        <div class="card-body">
          <div class="form-group"><label>玩家名称</label><input type="text" id="setPlayerName" value="${Storage.get('playerName', '玩家')}"></div>
          <div class="form-group"><label>玩家身份</label><input type="text" id="setPlayerIdentity" value="${Storage.get('userMask', {}).identity || ''}" placeholder="如：穿越者 / 修仙者 / 皇帝"></div>
          <div class="form-group"><label>签名档</label><input type="text" id="setPlayerSignature" value="${Storage.get('userMask', {}).signature || ''}" placeholder="个性签名"></div>
          <button class="btn btn-primary" onclick="AppSettings.saveAccount()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> 保存账号</button>
        </div>
      </div>
      <div class="card" style="margin-bottom:var(--space-md);">
        <div class="card-header"><h4><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg> 通知</h4></div>
        <div class="card-body">
          <label style="display:flex;align-items:center;gap:8px;margin-bottom:10px;cursor:pointer;"><input type="checkbox" id="setNotifyAI" ${Storage.get('notifyAI', true) ? 'checked' : ''} style="width:auto;"><span>AI 回复通知</span></label>
          <label style="display:flex;align-items:center;gap:8px;margin-bottom:10px;cursor:pointer;"><input type="checkbox" id="setNotifyMail" ${Storage.get('notifyMail', true) ? 'checked' : ''} style="width:auto;"><span>邮件通知</span></label>
          <label style="display:flex;align-items:center;gap:8px;margin-bottom:10px;cursor:pointer;"><input type="checkbox" id="setNotifyAchieve" ${Storage.get('notifyAchieve', true) ? 'checked' : ''} style="width:auto;"><span>成就解锁通知</span></label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;"><input type="checkbox" id="setNotifyQuest" ${Storage.get('notifyQuest', true) ? 'checked' : ''} style="width:auto;"><span>任务提醒</span></label>
          <button class="btn btn-primary" style="margin-top:12px;" onclick="AppSettings.saveNotify()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> 保存通知</button>
        </div>
      </div>
      <div class="card" style="margin-bottom:var(--space-md);">
        <div class="card-header"><h4>🎨 显示</h4></div>
        <div class="card-body">
          <div class="form-group"><label>主题风格</label><select id="setTheme" onchange="AppSettings.saveTheme()"><option value="mojing" ${Storage.get('theme', 'mojing') === 'mojing' ? 'selected' : ''}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20"/><path d="M12 2l4 4"/><path d="M12 2l-4 4"/><path d="M12 22l4-4"/><path d="M12 22l-4-4"/></svg> 墨境古风</option><option value="dark" ${Storage.get('theme') === 'dark' ? 'selected' : ''}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg> 深夜模式</option><option value="light" ${Storage.get('theme') === 'light' ? 'selected' : ''}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> 明亮模式</option></select></div>
          <div class="form-group"><label>字体大小</label><select id="setFontSize" onchange="AppSettings.saveFontSize()"><option value="14" ${Storage.get('fontSize', '16') === '14' ? 'selected' : ''}>小</option><option value="16" ${Storage.get('fontSize', '16') === '16' ? 'selected' : ''}>中</option><option value="18" ${Storage.get('fontSize', '16') === '18' ? 'selected' : ''}>大</option></select></div>
          <div class="form-group"><label>小说模式</label><select id="setNovelMode" onchange="AppSettings.saveNovelMode()"><option value="visual" ${Storage.get('novelMode', 'visual') === 'visual' ? 'selected' : ''}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg> 视觉小说（对话+立绘+选项）</option><option value="text" ${Storage.get('novelMode') === 'text' ? 'selected' : ''}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 01-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg> 文本小说（Markdown章节阅读）</option></select></div>
        </div>
      </div>
      <div class="card" style="margin-bottom:var(--space-md);">
        <div class="card-header"><h4><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> 数据管理</h4></div>
        <div class="card-body">
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> 以下操作不可逆，请谨慎操作。</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-secondary" onclick="AppSettings.exportData()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> 导出数据</button>
            <button class="btn btn-secondary" onclick="AppSettings.importData()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> 导入数据</button>
            <button class="btn btn-danger" onclick="AppSettings.resetAll()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> 重置所有数据</button>
          </div>
        </div>
      </div>
    `;
  },

  saveAccount() {
    const name = document.getElementById('setPlayerName')?.value || '玩家';
    const identity = document.getElementById('setPlayerIdentity')?.value || '';
    const signature = document.getElementById('setPlayerSignature')?.value || '';
    try { Storage.set('playerName', name); } catch(e) { console.warn('[v7] Storage.set失败:', e); }
    const mask = Storage.get('userMask', {});
    mask.playerName = name; mask.identity = identity; mask.signature = signature;
    try { Storage.set('userMask', mask); } catch(e) { console.warn('[v7] Storage.set失败:', e); }
    App.toast('账号信息已保存', 'success');
  },

  saveNotify() {
    try { Storage.set('notifyAI', document.getElementById('setNotifyAI')?.checked !== false); } catch(e) { console.warn('[v7] Storage.set失败:', e); }
    try { Storage.set('notifyMail', document.getElementById('setNotifyMail')?.checked !== false); } catch(e) { console.warn('[v7] Storage.set失败:', e); }
    try { Storage.set('notifyAchieve', document.getElementById('setNotifyAchieve')?.checked !== false); } catch(e) { console.warn('[v7] Storage.set失败:', e); }
    try { Storage.set('notifyQuest', document.getElementById('setNotifyQuest')?.checked !== false); } catch(e) { console.warn('[v7] Storage.set失败:', e); }
    App.toast('通知设置已保存', 'success');
  },

  saveTheme() {
    const theme = document.getElementById('setTheme')?.value || 'mojing';
    try { Storage.set('theme', theme); } catch(e) { console.warn('[v7] Storage.set失败:', e); }
    document.documentElement.setAttribute('data-theme', theme);
    App.toast('主题已切换：' + theme, 'success');
  },

  saveFontSize() {
    const size = document.getElementById('setFontSize')?.value || '16';
    try { Storage.set('fontSize', size); } catch(e) { console.warn('[v7] Storage.set失败:', e); }
    document.documentElement.style.fontSize = size + 'px';
    App.toast('字体大小已调整', 'success');
  },

  saveNovelMode() {
    const mode = document.getElementById('setNovelMode')?.value || 'visual';
    try { Storage.set('novelMode', mode); } catch(e) { console.warn('[v7] Storage.set失败:', e); }
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
    if (!confirm('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> 这将删除所有数据！确定要重置吗？')) return;
    localStorage.clear();
    indexedDB.deleteDatabase('MojingDB_v3');
    App.toast('所有数据已重置，页面将刷新', 'info');
    setTimeout(() => location.reload(), 1500);
  }
};
