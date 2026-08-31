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

  init() { this.renderPage(); },
  onEnter() { this.renderHistory(); },

  getHistory() { return Storage.get('baikeHistory', []); },
  saveHistory(h) { Storage.set('baikeHistory', h); },

  renderPage() {
    const page = document.getElementById('page-baike');
    if (!page) return;
    page.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:8px;">
        <h2 class="section-title">📚 百科助手</h2>
        <button class="btn btn-secondary" onclick="BaikeIntegration.showHelp()">❓ 使用说明</button>
      </div>

      <div class="card" style="margin-bottom:var(--space-lg);">
        <div class="card-header"><h3>🔍 查询百科</h3></div>
        <div class="card-body">
          <div style="display:flex;gap:8px;margin-bottom:var(--space-md);">
            <input type="text" id="baikeQuery" placeholder="输入要查询的词条..." style="flex:1;" onkeydown="if(event.key==='Enter')BaikeIntegration.search()">
            <button class="btn btn-primary" onclick="BaikeIntegration.search()">🔍 查询</button>
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
        <div class="card-header"><h3>⚙️ 自动检测设置</h3></div>
        <div class="card-body">
          <div class="form-group"><label>触发关键词（逗号分隔）</label><input type="text" id="baikeKeywords" value="历史,地理,人物,朝代,事件,地名" placeholder="如：历史,地理,人物"></div>
          <div class="hint">当对话中包含这些关键词时，会自动查询百科并注入结果。</div>
        </div>
      </div>

      <h3 style="font-size:16px;margin-bottom:var(--space-sm);">📜 查询历史</h3>
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
          <h4 style="color:var(--color-gold);margin-bottom:8px;">📖 ${query}</h4>
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
        <span style="font-size:20px;">📖</span>
        <div class="list-info"><h4>${h.query}</h4><p>${new Date(h.time).toLocaleString()}</p></div>
      </div>
    `).join('');
  },

  showHelp() {
    App.showModal('❓ 百科助手说明', `
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
