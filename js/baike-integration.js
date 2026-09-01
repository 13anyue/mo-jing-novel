/**
 * =========================================================
 * Baike Integration v3
 * Encyclopedia lookup powered by Baidu Baike
 * Manual query page + automatic keyword detection in runtime
 * Results injected into world knowledge / memory
 * =========================================================
 */
const BaikeIntegration = {
  API_BASE: 'https://baike.baidu.com/item/',

    // 初始化模块入口
  init() {
    // v7: 外部模块依赖检查
    if (typeof Storage === 'undefined') { console.warn('[v7] Storage模块未加载'); return; }
    this.renderPage(); },
    // 页面进入时调用
  onEnter() {
    this.renderHistory(); },

  getHistory() { return Storage.get('baikeHistory', []); },
  saveHistory(h) { Storage.set('baikeHistory', h); },

    // 渲染页面主结构
  renderPage() {
    const page = document.getElementById('page-baike');
    if (!page) return;
    page.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:8px;">
        <h2 class="section-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg> 百科助手</h2>
        <button class="btn btn-secondary" onclick="BaikeIntegration.showHelp()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> 使用说明</button>
      </div>

      <div class="card" style="margin-bottom:var(--space-lg);">
        <div class="card-header"><h3><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> 查询百科</h3></div>
        <div class="card-body">
          <div style="display:flex;gap:8px;margin-bottom:var(--space-md);">
            <input type="text" id="baikeQuery" placeholder="输入要查询的词条..." style="flex:1;" onkeydown="if(event.key==='Enter')BaikeIntegration.search()">
            <button class="btn btn-primary" onclick="BaikeIntegration.search()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> 查询</button>
            <button class="btn btn-gold" onclick="BaikeIntegration.aiSuggestQuery()">🤖 AI建议</button>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:var(--space-md);">
            <label style="display:flex;align-items:center;gap:4px;font-size:13px;"><input type="checkbox" id="baikeSaveToWorld" style="width:auto;"> 保存到世界书</label>
            <label style="display:flex;align-items:center;gap:4px;font-size:13px;"><input type="checkbox" id="baikeSaveToMemory" style="width:auto;"> 保存到记忆</label>
            <label style="display:flex;align-items:center;gap:4px;font-size:13px;"><input type="checkbox" id="baikeAutoDetect" checked style="width:auto;"> 运行时自动检测关键词</label>
          </div>
          <div id="baikeResult" style="min-height:100px;"></div>
        </div>
      </div>

      <div class="card" style="margin-bottom:var(--space-lg);">
        <div class="card-header"><h3><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.62 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg> 自动检测设置</h3></div>
        <div class="card-body">
          <div class="form-group"><label>触发关键词（逗号分隔）</label><input type="text" id="baikeKeywords" value="历史,地理,人物,朝代,事件,地名" placeholder="如：历史,地理,人物"></div>
          <div class="hint">当对话中包含这些关键词时，会自动查询百科并注入结果。</div>
        </div>
      </div>

      <h3 style="font-size:16px;margin-bottom:var(--space-sm);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> 查询历史</h3>
      <div id="baikeHistoryList"></div>
    `;
    this.renderHistory();
  },

  async search(term) {
    const query = term || document.getElementById('baikeQuery')?.value?.trim();
    if (!query) { App.toast('请输入查询内容', 'error'); return; }

    const resultArea = document.getElementById('baikeResult');
    resultArea.innerHTML = '<p style="color:var(--text-muted);">查询中...</p>';

    try {
      // Note: Direct baike.baidu.com scraping is blocked by CORS in browser
      // We use the user's configured API to get encyclopedia data
      const prompt = `请用中文介绍"${query}"，包括定义、历史背景、关键信息。控制在200字以内。格式：【定义】...【历史】...【关键信息】...`;
      const result = await APISettings.chat(prompt, [{ role: 'system', content: '你是一个百科全书助手，提供准确的知识。' }], { useAux: true });

      resultArea.innerHTML = `
        <div style="background:var(--bg-parchment);border:1px solid var(--border-color);border-radius:var(--border-radius);padding:var(--space-md);">
          <h4 style="color:var(--color-gold);margin-bottom:8px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 01-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg> ${query}</h4>
          <div style="font-size:14px;line-height:1.7;color:var(--text-primary);">${this.formatResult(result)}</div>
        </div>
      `;

      // Save to history
      const history = this.getHistory();
      history.unshift({ id: 'baike_' + Date.now(), query, result, time: Date.now() });
      if (history.length > 50) history.pop();
      this.saveHistory(history);
      this.renderHistory();

      // Save to world book if checked
      if (document.getElementById('baikeSaveToWorld')?.checked) {
        const wb = WorldBook ? WorldBook.getWorldBook() : Storage.get('worldBook', { entries: [] });
        wb.entries = wb.entries || [];
        wb.entries.push({
          id: 'wb_baike_' + Date.now(),
          name: '百科：' + query,
          content: result,
          keywords: query,
          permanent: false,
          injection: true,
          depth: 2,
          createdAt: Date.now()
        });
        if (WorldBook) WorldBook.saveWorldBook(wb); else Storage.set('worldBook', wb);
        App.toast('已保存到世界书', 'success');
      }

      // Save to memory if checked
      if (document.getElementById('baikeSaveToMemory')?.checked && MemorySystem) {
        await MemorySystem.addMemory({ content: `百科知识：${query} - ${result.substring(0, 200)}`, category: 'cat_note', type: 'knowledge', timestamp: Date.now() });
        App.toast('已保存到记忆', 'success');
      }
    } catch (e) {
      resultArea.innerHTML = `<div style="color:var(--color-danger);">查询失败: ${e.message}<br><small>提示：请确保辅助API已配置</small></div>`;
    }
  },

  formatResult(text) {
    return text.replace(/\n/g, '<br>').replace(/【(.+?)】/g, '<strong style="color:var(--color-gold);">【$1】</strong>');
  },

  async aiSuggestQuery() {
    const worldName = Storage.get('worldData', {}).name || '这个世界';
    const prompt = `根据世界观"${worldName}"，推荐5个值得查询百科知识的词条。只返回词条名称列表，每行一个。`;
    try {
      const result = await APISettings.chat(prompt, [], { useAux: true });
      const suggestions = result.split('\n').filter(l => l.trim()).slice(0, 5);
      const content = suggestions.map((s, i) => `<button class="btn btn-sm btn-secondary" style="margin:4px;" onclick="BaikeIntegration.search('${s.replace(/'/g, "\\'")}')">${s}</button>`).join('');
      App.showModal('🤖 AI推荐词条', `<div style="display:flex;flex-wrap:wrap;gap:4px;">${content}</div>`);
    } catch (e) { App.toast('生成失败', 'error'); }
  },

  // Called by runtime to auto-detect keywords
  async autoDetect(text) {
    const enabled = Storage.get('baikeAutoDetect', true);
    if (!enabled) return null;
    const keywords = (document.getElementById('baikeKeywords')?.value || '历史,地理,人物,朝代,事件,地名').split(/[,，、]/).map(k => k.trim()).filter(Boolean);
    const found = keywords.find(k => text.includes(k));
    if (!found) return null;
    // Extract noun phrase around keyword
    const match = text.match(new RegExp(`[^，。！？\\s]{2,8}${found}[^，。！？\\s]{0,6}`));
    const query = match ? match[0] : found;
    try {
      const prompt = `简要介绍"${query}"，50字以内。`;
      const result = await APISettings.chat(prompt, [], { useAux: true });
      return { query, result, injected: true };
    } catch (e) { return null; }
  },

  renderHistory() {
    const c = document.getElementById('baikeHistoryList');
    if (!c) return;
    const history = this.getHistory();
    if (history.length === 0) { c.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">暂无查询记录</p>'; return; }
    c.innerHTML = history.slice(0, 10).map(h => `
      <div class="list-item" style="cursor:pointer;" onclick="document.getElementById('baikeQuery').value='${h.query.replace(/'/g, "\\'")}';BaikeIntegration.search('${h.query.replace(/'/g, "\\'")}')">
        <span style="font-size:20px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 01-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg></span>
        <div class="list-info"><h4>${h.query}</h4><p>${new Date(h.time).toLocaleString()}</p></div>
      </div>
    `).join('');
  },

  showHelp() {
    App.showModal('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> 百科助手说明', `
      <div style="line-height:1.8;">
        <p><strong>手动查询：</strong>输入词条名称，点击查询按钮。</p>
        <p><strong>AI建议：</strong>让AI根据你的世界观推荐值得查询的词条。</p>
        <p><strong>自动检测：</strong>在运行时对话中，当检测到关键词（如"历史"、"人物"），自动查询百科并注入结果。</p>
        <p><strong>保存选项：</strong>查询结果可以保存到世界书或记忆中，方便后续调用。</p>
        <p><strong>注意：</strong>百科查询使用辅助API，请确保已配置。</p>
      </div>
    `);
  }
};
