/**
 * =========================================================
 * AppMail vv7 邮箱系统
 * 模块名：AppMail
 * 功能：收件箱、发件箱、写信、已读标记
 * NPC可自动发邮件（事件触发）
 * =========================================================
 */
const AppMail = {
  _currentFolder: 'inbox',

    // 初始化模块入口
  init() {
    // v7: 外部模块依赖检查
    if (typeof Storage === 'undefined') { console.warn('[v7] Storage模块未加载'); return; }
    this.renderPage(); },
    // 页面进入时调用
  onEnter() {
    this.renderMailInterface(); },

    // 渲染页面主结构
  renderPage() {
    const page = document.getElementById('page-mail');
    if (!page) return;
    page.innerHTML = `<div id="mailInterface" style="height:100%;"></div>`;
    this.renderMailInterface();
  },

  renderMailInterface() {
    const container = document.getElementById('mailInterface');
    if (!container) return;
    container.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
<div style="display:flex;height:100%;">
        <div style="width:220px;border-right:1px solid var(--border-color);background:var(--bg-sidebar);flex-shrink:0;">
          <div style="padding:12px 16px;">
            <button class="btn btn-primary" style="width:100%;" onclick="AppMail.compose()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> 写信</button>
          </div>
          <div id="mailFolderList"></div>
        </div>
        <div style="flex:1;overflow-y:auto;" id="mailList"></div>
      </div>
    `;
    this.renderFolders();
    this.renderMails();
  },

  renderFolders() {
    const c = document.getElementById('mailFolderList');
    if (!c) return;
    const folders = [
      { id: 'inbox', name: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> 收件箱', count: this.getMails().filter(m => m.folder === 'inbox' && !m.read).length },
      { id: 'sent', name: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> 发件箱', count: 0 },
      { id: 'trash', name: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg> 已删除', count: 0 }
    ];
    c.innerHTML = folders.map(f => `
      <div style="padding:10px 16px;cursor:pointer;${this._currentFolder === f.id ? 'background:var(--bg-body);border-left:3px solid var(--color-gold);' : ''}"
           onclick="AppMail.switchFolder('${f.id}')">
        <span>${f.name}</span>
        ${f.count > 0 ? `<span style="float:right;background:var(--color-accent);color:#fff;padding:1px 6px;border-radius:10px;font-size:11px;">${f.count}</span>` : ''}
      </div>
    `).join('');
  },

  getMails() { return Storage.get('mails_v6', []); },
  saveMails(list) { Storage.set('mails_v6', list); },

  switchFolder(f) { this._currentFolder = f; this.renderFolders(); this.renderMails(); },

  renderMails() {
    const c = document.getElementById('mailList');
    if (!c) return;
    const mails = this.getMails().filter(m => m.folder === this._currentFolder).sort((a, b) => b.time - a.time);
    if (mails.length === 0) {
      c.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted);"><div style="font-size:48px;margin-bottom:12px;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div><p>暂无邮件</p></div>`;
      return;
    }
    c.innerHTML = mails.map(m => `
      <div style="padding:12px 16px;border-bottom:1px solid var(--border-color);cursor:pointer;${m.read ? '' : 'background:rgba(201,162,39,0.05);'}"
           onclick="AppMail.readMail('${m.id}')">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:${m.read ? '400' : '700'};font-size:14px;">${m.read ? '' : '<span style="color:var(--color-accent);margin-right:4px;">●</span>'}${this.escapeHtml(m.subject)}</span>
          <span style="font-size:11px;color:var(--text-muted);">${new Date(m.time).toLocaleDateString()}</span>
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">发件人：${this.escapeHtml(m.from)} · 收件人：${this.escapeHtml(m.to)}</div>
      </div>
    `).join('');
  },

  compose() {
    const to = prompt('收件人：'); if (!to) return;
    const subject = prompt('主题：'); if (!subject) return;
    const body = prompt('正文：', '');
    const mails = this.getMails();
    mails.push({
      id: 'mail_' + Date.now(),
      folder: 'sent',
      from: Storage.get('playerName', '玩家'),
      to, subject, body, read: true, time: Date.now()
    });
    this.saveMails(mails);
    App.toast('邮件已发送', 'success');
    this.renderMails();
  },

  readMail(id) {
    const mails = this.getMails();
    const m = mails.find(x => x.id === id); if (!m) return;
    m.read = true; this.saveMails(mails);
    this.renderFolders(); this.renderMails();
    App.showModal(m.subject, `
      <div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">
        <span style="color:var(--color-gold);">发件人：${this.escapeHtml(m.from)}</span>
        · 收件人：${this.escapeHtml(m.to)}
        · ${new Date(m.time).toLocaleString()}
      </div>
      <div style="font-size:14px;line-height:1.8;padding:16px;background:var(--bg-parchment);border-radius:var(--border-radius);">${this.escapeHtml(m.body || '')}</div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px;">
        <button class="btn btn-sm btn-secondary" onclick="AppMail.replyMail('${m.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> 回复</button>
        <button class="btn btn-sm btn-danger" onclick="AppMail.deleteMail('${m.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg> 删除</button>
      </div>
    `);
  },

  replyMail(id) {
    const mails = this.getMails();
    const m = mails.find(x => x.id === id); if (!m) return;
    const body = prompt('回复内容：'); if (!body) return;
    mails.push({
      id: 'mail_' + Date.now(), folder: 'sent',
      from: Storage.get('playerName', '玩家'), to: m.from,
      subject: 'Re: ' + m.subject, body, read: true, time: Date.now()
    });
    this.saveMails(mails);
    App.toast('回复已发送', 'success');
  },

  deleteMail(id) {
    if (!confirm('删除此邮件？')) return;
    this.saveMails(this.getMails().filter(m => m.id !== id));
    this.renderMails();
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
