/**
 * =========================================================
 * Dual API System - APISettings v2
 * Main API + Auxiliary API
 * Every generation feature can choose which API to use
 * =========================================================
 */
const APISettings = {
  API_PRESETS: [
    { id: 'openai', name: 'OpenAI (GPT)', baseUrl: 'https://api.openai.com/v1', chatEndpoint: '/chat/completions', embEndpoint: '/embeddings',
      models: ['gpt-4o','gpt-4o-mini','gpt-4-turbo','gpt-3.5-turbo'], embModel: 'text-embedding-3-small', authHeader: 'Authorization', authPrefix: 'Bearer ' },
    { id: 'claude', name: 'Anthropic (Claude)', baseUrl: 'https://api.anthropic.com', chatEndpoint: '/v1/messages', embEndpoint: null,
      models: ['claude-sonnet-4-20250514','claude-3-5-haiku-20241022'], authHeader: 'x-api-key', authPrefix: '' },
    { id: 'ernie', name: '百度文心一言', baseUrl: 'https://qianfan.baidubce.com/v2', chatEndpoint: '/chat/completions', embEndpoint: '/embeddings',
      models: ['ernie-4.0-8k','ernie-3.5-8k','ernie-speed-128k'], embModel: 'embedding-v1', authHeader: 'Authorization', authPrefix: 'Bearer ' },
    { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com', chatEndpoint: '/v1/chat/completions', embEndpoint: null,
      models: ['deepseek-chat','deepseek-reasoner'], authHeader: 'Authorization', authPrefix: 'Bearer ' },
    { id: 'custom', name: '自定义接口', baseUrl: '', chatEndpoint: '/chat/completions', embEndpoint: null, models: [], authHeader: 'Authorization', authPrefix: 'Bearer ' }
  ],

  getDefaultConfig() {
    return {
      provider: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-4o-mini',
      temperature: 0.8, maxTokens: 2000, topP: 1, freqPenalty: 0, presPenalty: 0, timeout: 30000,
      embEnabled: false, embBaseUrl: 'https://api.openai.com/v1', embApiKey: '', embModel: 'text-embedding-3-small',
      auxProvider: 'openai', auxBaseUrl: 'https://api.openai.com/v1', auxApiKey: '', auxModel: 'gpt-4o-mini',
      auxTemperature: 0.9, auxMaxTokens: 1500
    };
  },

  getConfig() { return Storage.get('apiConfig', this.getDefaultConfig()); },
  saveConfig(c) { Storage.set('apiConfig', c); },

  init() { this.renderPage(); },
  onEnter() { this.refreshForm(); },

  renderPage() {
    const page = document.getElementById('page-api');
    if (!page) return;
    const c = this.getConfig();

    page.innerHTML = `
      <div class="card" style="margin-bottom: var(--space-lg);">
        <div class="card-header"><h3>主 API</h3><span class="tag tag-gold">对话生成</span></div>
        <div class="card-body">
          <div class="form-group"><label>服务商</label><select id="ap_provider" onchange="APISettings.onProviderChange(this.value,'main')">${this.API_PRESETS.map(p=>`<option value="${p.id}" ${p.id===c.provider?'selected':''}>${p.name}</option>`).join('')}</select></div>
          <div class="form-group"><label>API Base URL</label><input type="text" id="ap_baseUrl" value="${c.baseUrl}" placeholder="https://api.openai.com/v1"></div>
          <div class="form-group"><label>API Key</label><input type="password" id="ap_apiKey" value="${c.apiKey}" placeholder="sk-..."></div>
          <div class="form-group"><label>模型</label><input type="text" id="ap_model" value="${c.model}" placeholder="模型名称" list="ap_modelList"></div>
          <datalist id="ap_modelList">${this.API_PRESETS.find(p=>p.id===c.provider)?.models?.map(m=>`<option value="${m}">`).join('')||''}</datalist>
          <div class="form-row">
            <div class="form-group"><label>Temperature</label><input type="number" id="ap_temp" value="${c.temperature}" min="0" max="2" step="0.1"></div>
            <div class="form-group"><label>Max Tokens</label><input type="number" id="ap_max" value="${c.maxTokens}" min="100" max="32000" step="100"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Top P</label><input type="number" id="ap_topp" value="${c.topP}" min="0" max="1" step="0.05"></div>
            <div class="form-group"><label>超时(ms)</label><input type="number" id="ap_timeout" value="${c.timeout}" min="5000" max="120000" step="1000"></div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom: var(--space-lg);">
        <div class="card-header"><h3>辅助 API</h3><span class="tag tag-secondary">辅助生成 / 备用</span></div>
        <div class="card-body">
          <div class="form-group"><label>辅助服务商</label><select id="ap_auxProvider" onchange="APISettings.onProviderChange(this.value,'aux')">${this.API_PRESETS.map(p=>`<option value="${p.id}" ${p.id===c.auxProvider?'selected':''}>${p.name}</option>`).join('')}</select></div>
          <div class="form-group"><label>辅助 API Base URL</label><input type="text" id="ap_auxBaseUrl" value="${c.auxBaseUrl}" placeholder="https://api.openai.com/v1"></div>
          <div class="form-group"><label>辅助 API Key</label><input type="password" id="ap_auxApiKey" value="${c.auxApiKey}" placeholder="sk-..."></div>
          <div class="form-group"><label>辅助模型</label><input type="text" id="ap_auxModel" value="${c.auxModel}" placeholder="模型名称"></div>
          <div class="form-row">
            <div class="form-group"><label>辅助 Temperature</label><input type="number" id="ap_auxTemp" value="${c.auxTemperature}" min="0" max="2" step="0.1"></div>
            <div class="form-group"><label>辅助 Max Tokens</label><input type="number" id="ap_auxMax" value="${c.auxMaxTokens}" min="100" max="32000" step="100"></div>
          </div>
          <div class="hint">辅助API用于世界观生成、角色提取、信息生成等辅助功能。主API用于核心对话。</div>
        </div>
      </div>

      <div class="card" style="margin-bottom: var(--space-lg);">
        <div class="card-header"><h3>Embedding API</h3><div class="switch ${c.embEnabled?'on':''}" id="ap_embSwitch" onclick="this.classList.toggle('on')"></div></div>
        <div class="card-body">
          <div class="form-group"><label>Embedding API 地址</label><input type="text" id="ap_embBaseUrl" value="${c.embBaseUrl}" placeholder="https://api.openai.com/v1"></div>
          <div class="form-group"><label>Embedding API Key</label><input type="password" id="ap_embApiKey" value="${c.embApiKey}" placeholder="sk-..."></div>
          <div class="form-group"><label>Embedding 模型</label><input type="text" id="ap_embModel" value="${c.embModel}" placeholder="text-embedding-3-small"></div>
        </div>
      </div>

      <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="APISettings.saveSettings()">保存设置</button>
        <button class="btn btn-secondary" onclick="APISettings.testConnection('main')">测试主API</button>
        <button class="btn btn-secondary" onclick="APISettings.testConnection('aux')">测试辅助API</button>
        <button class="btn btn-secondary" onclick="APISettings.reset()">恢复默认</button>
      </div>
      <div id="ap_testResult" style="margin-top:var(--space-lg);"></div>
    `;
  },

  onProviderChange(id, target) {
    const preset = this.API_PRESETS.find(p => p.id === id);
    if (!preset || id === 'custom') return;
    const prefix = target === 'aux' ? 'ap_aux' : 'ap_';
    const urlEl = document.getElementById(prefix + 'BaseUrl');
    const modelEl = document.getElementById(prefix + 'Model');
    if (urlEl) urlEl.value = preset.baseUrl;
    if (modelEl) modelEl.value = preset.models[0] || '';
    if (target === 'main') {
      const dl = document.getElementById('ap_modelList');
      if (dl) dl.innerHTML = preset.models.map(m => `<option value="${m}">`).join('');
    }
  },

  refreshForm() {
    const c = this.getConfig();
    const fields = {
      ap_provider: c.provider, ap_baseUrl: c.baseUrl, ap_apiKey: c.apiKey, ap_model: c.model,
      ap_temp: c.temperature, ap_max: c.maxTokens, ap_topp: c.topP, ap_timeout: c.timeout,
      ap_auxProvider: c.auxProvider, ap_auxBaseUrl: c.auxBaseUrl, ap_auxApiKey: c.auxApiKey,
      ap_auxModel: c.auxModel, ap_auxTemp: c.auxTemperature, ap_auxMax: c.auxMaxTokens,
      ap_embBaseUrl: c.embBaseUrl, ap_embApiKey: c.embApiKey, ap_embModel: c.embModel
    };
    Object.entries(fields).forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; });
    const sw = document.getElementById('ap_embSwitch');
    if (sw) sw.classList.toggle('on', c.embEnabled);
  },

  saveSettings() {
    const c = this.getDefaultConfig();
    c.provider = document.getElementById('ap_provider').value;
    c.baseUrl = document.getElementById('ap_baseUrl').value;
    c.apiKey = document.getElementById('ap_apiKey').value;
    c.model = document.getElementById('ap_model').value;
    c.temperature = parseFloat(document.getElementById('ap_temp').value) || 0.8;
    c.maxTokens = parseInt(document.getElementById('ap_max').value) || 2000;
    c.topP = parseFloat(document.getElementById('ap_topp').value) || 1;
    c.timeout = parseInt(document.getElementById('ap_timeout').value) || 30000;
    c.auxProvider = document.getElementById('ap_auxProvider').value;
    c.auxBaseUrl = document.getElementById('ap_auxBaseUrl').value;
    c.auxApiKey = document.getElementById('ap_auxApiKey').value;
    c.auxModel = document.getElementById('ap_auxModel').value;
    c.auxTemperature = parseFloat(document.getElementById('ap_auxTemp').value) || 0.9;
    c.auxMaxTokens = parseInt(document.getElementById('ap_auxMax').value) || 1500;
    c.embEnabled = document.getElementById('ap_embSwitch')?.classList.contains('on') || false;
    c.embBaseUrl = document.getElementById('ap_embBaseUrl').value;
    c.embApiKey = document.getElementById('ap_embApiKey').value;
    c.embModel = document.getElementById('ap_embModel').value;
    this.saveConfig(c);
    App.toast('API设置已保存', 'success');
  },

  reset() { if (!confirm('恢复默认？')) return; Storage.set('apiConfig', this.getDefaultConfig()); this.renderPage(); App.toast('已恢复默认', 'info'); },

  async testConnection(target) {
    this.saveSettings();
    const el = document.getElementById('ap_testResult');
    const isAux = target === 'aux';
    el.innerHTML = `<div class="list-item"><div class="list-info"><p>正在测试${isAux?'辅助':'主'}API连接...</p></div></div>`;
    try {
      await this.chat(isAux ? '辅助API测试' : '你好', [{role:'system',content:'你是一个测试助手。'}], {useAux: isAux});
      el.innerHTML = `<div class="card" style="border-left:4px solid var(--color-gold);"><div class="card-body"><h4 style="color:var(--color-gold);">✓ ${isAux?'辅助':'主'}API连接成功</h4></div></div>`;
      App.toast('连接成功！', 'success');
    } catch (e) {
      el.innerHTML = `<div class="card" style="border-left:4px solid var(--color-danger);"><div class="card-body"><h4 style="color:var(--color-danger);">✗ ${isAux?'辅助':'主'}API连接失败</h4><p style="font-size:13px;">${e.message}</p></div></div>`;
      App.toast('连接失败', 'error');
    }
  },

  /**
   * Chat with Main or Auxiliary API
   * @param {string} msg - user message
   * @param {Array} messages - full messages array
   * @param {Object} opts - { useAux: boolean, extraParams: {}, systemPrompt: string }
   */
  async chat(msg, messages = [], opts = {}) {
    const c = this.getConfig();
    const useAux = opts.useAux === true;
    const preset = this.API_PRESETS.find(p => p.id === (useAux ? c.auxProvider : c.provider)) || this.API_PRESETS[4];
    const baseUrl = useAux ? c.auxBaseUrl : c.baseUrl;
    const apiKey = useAux ? c.auxApiKey : c.apiKey;
    const model = useAux ? c.auxModel : c.model;
    const temp = useAux ? c.auxTemperature : c.temperature;
    const maxT = useAux ? c.auxMaxTokens : c.maxTokens;

    if (msg) messages.push({ role: 'user', content: msg });

    const body = { model, messages, temperature: temp, max_tokens: maxT, top_p: c.topP, ...opts.extraParams };
    if (useAux) { delete body.top_p; delete body.frequency_penalty; delete body.presence_penalty; }

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) { headers[preset.authHeader || 'Authorization'] = (preset.authPrefix ?? 'Bearer ') + apiKey; }

    if ((useAux ? c.auxProvider : c.provider) === 'claude') {
      headers['anthropic-version'] = '2023-06-01';
      const sysMsg = messages.find(m => m.role === 'system');
      body.system = sysMsg?.content || '';
      body.messages = messages.filter(m => m.role !== 'system');
      body.max_tokens = maxT; delete body.top_p; delete body.frequency_penalty; delete body.presence_penalty;
    }

    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), c.timeout);
    const resp = await fetch(baseUrl + (preset.chatEndpoint || '/chat/completions'), {
      method: 'POST', headers, body: JSON.stringify(body), signal: ctrl.signal
    });
    clearTimeout(tid);

    if (!resp.ok) { const et = await resp.text().catch(()=>''); throw new Error(`HTTP ${resp.status}: ${et.slice(0,200)}`); }
    const data = await resp.json();
    if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;
    if (data.content?.[0]?.text) return data.content[0].text;
    if (data.result) return data.result;
    return JSON.stringify(data);
  },

  async getEmbedding(text) {
    const c = this.getConfig();
    if (!c.embEnabled || !c.embApiKey) return null;
    const preset = this.API_PRESETS.find(p => p.id === c.provider) || this.API_PRESETS[0];
    const url = c.embBaseUrl + (preset.embEndpoint || '/embeddings');
    const headers = { 'Content-Type': 'application/json', [preset.authHeader||'Authorization']: (preset.authPrefix??'Bearer ')+c.embApiKey };
    const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ model: c.embModel, input: text }) });
    if (!resp.ok) throw new Error(`Embedding ${resp.status}`);
    const data = await resp.json();
    if (data.data?.[0]?.embedding) return data.data[0].embedding;
    if (data.embedding) return data.embedding;
    if (Array.isArray(data)) return data;
    throw new Error('无法解析Embedding');
  }
};
