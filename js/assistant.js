/**
 * =========================================================
 * 万能小助手 v3 — 自编程AI引擎
 *
 * 核心能力：
 * 1. 独立API配置 — 与其他API完全分离，使用 assistant_api_v14
 * 2. 自编程能力 — 直接修改代码、创建模块、制作预设/角色/APP
 * 3. 先问后做 — 所有不确定性先问用户，不擅自决定
 * 4. 不跳平台 — 所有操作在墨境助手对话框内完成
 * =========================================================
 */

const Assistant = {
  // =========================================================
  // 状态管理
  // =========================================================

  /** @type {Array<{role:string,content:string,time:number}>} 对话历史 */
  _chatHistory: [],
  /** @type {boolean} 是否显示API设置面板 */
  _showApiPanel: false,
  /** @type {boolean} 是否正在等待用户选择 */
  _waitingForChoice: false,
  /** @type {Function|null} 选择确认后的回调函数 */
  _choiceCallback: null,
  /** @type {string|null} 当前等待选择的上下文类型 */
  _choiceContext: null,

  // =========================================================
  // 系统提示词
  // =========================================================

  _systemPrompt: `你是「万能小助手v3」，一个具备自编程能力的AI引擎，精通墨境视觉小说系统的前端架构。

你可以帮用户：
1. 制作预设（角色卡/场景/世界观/自定义）
2. 美化UI（修改配色、字体、布局等CSS）
3. 制作功能（创建完整JS模块并自动注册到系统）
4. 制作角色（生成NPC完整数据并导入人物志）
5. 制作APP（创建小手机App并添加到虚拟App平台）
6. 修改代码（分析并应用代码补丁）
7. 导入代码（识别并自动导入外部代码）

重要规则：
- 先问后做：任何不确定的操作必须先询问用户
- 提供2-3个选项供用户选择，不要擅自决定
- 所有操作在墨境助手对话框内完成，不跳转页面
- 生成代码时给出完整可用的代码，带中文注释
- 修改代码前先展示修改预览（diff对比）
- 确认后再执行实际操作`,

  // =========================================================
  // 配色方案：古风墨境
  // =========================================================

  _colors: {
    parchment: '#F5E6D3',    // 暖羊皮纸底色
    gold: '#C9A227',         // 金色
    inkDark: '#2C1810',      // 墨色
    inkMid: '#4A3728',       // 中墨色
    inkLight: '#8B7355',     // 浅墨色
    border: '#D4C4B0',       // 边框色
    bgCard: '#FAF3EB',       // 卡片背景
    bgSecondary: '#F0E6D8',  // 次级背景
    textPrimary: '#2C1810',  // 主文字
    textSecondary: '#8B7355' // 次文字
  },

  // =========================================================
  // API配置管理
  // =========================================================

  /**
   * 获取小助手独立API配置
   * 从 localStorage 读取 assistant_api_v14 配置
   * 默认使用与主API相同的provider，但key和model可独立配置
   * @returns {{provider:string,apiKey:string,model:string,baseURL:string,temperature:number,maxTokens:number}}
   */
  getSettings() {
    try {
      const raw = localStorage.getItem('assistant_api_v14');
      if (raw) {
        const parsed = JSON.parse(raw);
        // 验证必要字段
        if (parsed.provider && parsed.model) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[万能小助手] 读取API配置失败:', e);
    }

    // 默认配置：使用主API相同的provider
    const defaultSettings = {
      provider: (typeof window !== 'undefined' && window.APISettings && window.APISettings.config && window.APISettings.config.provider) || 'openai',
      apiKey: '',
      model: (typeof window !== 'undefined' && window.APISettings && window.APISettings.config && window.APISettings.config.model) || 'gpt-4',
      baseURL: (typeof window !== 'undefined' && window.APISettings && window.APISettings.config && window.APISettings.config.baseURL) || '',
      temperature: 0.7,
      maxTokens: 4096
    };

    this.saveSettings(defaultSettings);
    return defaultSettings;
  },

  /**
   * 保存小助手独立API配置到 localStorage
   * @param {Object} settings - 配置对象
   */
  saveSettings(settings) {
    try {
      localStorage.setItem('assistant_api_v14', JSON.stringify(settings));
    } catch (e) {
      console.error('[万能小助手] 保存API配置失败:', e);
    }
  },

  // =========================================================
  // 页面初始化与渲染
  // =========================================================

  /**
   * 初始化小助手页面
   * 由App路由调用
   */
  init() {
    this.renderPage();
  },

  /**
   * 页面进入时触发
   * 渲染对话区域，首次进入显示欢迎消息
   */
  onEnter() {
    this.renderChat();
    // 首次进入显示欢迎消息
    if (this._chatHistory.length === 0) {
      this._addSystemMessage(this._renderWelcomeMessage());
    }
  },

  /**
   * 生成欢迎消息内容
   * @returns {string} Markdown格式的欢迎消息
   */
  _renderWelcomeMessage() {
    return `🎋 **欢迎来到万能小助手 v3**

我是你的自编程AI引擎，具备以下能力：

📋 **制作预设** — 生成角色卡、场景、世界观预设
🎨 **美化UI** — 一键切换配色、字体、布局风格
⚙️ **制作功能** — 创建完整JS模块并自动注册到系统
👤 **制作角色** — 生成NPC完整数据并导入人物志
📱 **制作APP** — 创建小手机App并添加到虚拟App平台
🔧 **修改代码** — 分析并应用代码补丁
📥 **导入代码** — 识别并自动导入外部代码

💡 上方快捷按钮可快速开始，或直接输入你的需求！

⚠️ **我会先询问再执行，所有修改都会征求你的同意。**`;
  },

  /**
   * 渲染整个助手页面HTML结构
   * 包含：标题栏、API设置面板、快捷操作栏、对话区域
   */
  renderPage() {
    const page = document.getElementById('page-assistant');
    if (!page) return;

    page.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
      <!-- 页面标题与API设置按钮 -->
      <div class="assistant-header" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-lg,16px);">
        <h2 class="section-title" style="margin:0;color:${this._colors.inkDark};">🤖 万能小助手 v3</h2>
        <button class="btn btn-sm btn-secondary" onclick="Assistant.toggleApiPanel()" style="display:flex;align-items:center;gap:4px;border-color:${this._colors.gold};color:${this._colors.gold};">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          API设置
        </button>
      </div>

      <!-- API设置面板（默认隐藏） -->
      <div id="assistantApiPanel" class="card" style="display:none;margin-bottom:var(--space-lg,16px);background:${this._colors.bgCard};border:1px solid ${this._colors.border};border-radius:12px;overflow:hidden;">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:${this._colors.inkDark};color:${this._colors.gold};">
          <span style="font-weight:600;font-size:14px;">⚙️ 小助手独立API配置</span>
          <button class="btn btn-sm btn-secondary" onclick="Assistant.toggleApiPanel()" style="color:${this._colors.gold};border-color:${this._colors.gold};">收起</button>
        </div>
        <div class="card-body" style="display:grid;gap:12px;padding:16px;">
          <div style="display:grid;grid-template-columns:120px 1fr;gap:8px;align-items:center;">
            <label style="color:${this._colors.textSecondary};font-size:13px;">API Provider</label>
            <select id="assistProvider" class="form-input" style="background:${this._colors.parchment};color:${this._colors.inkDark};border:1px solid ${this._colors.border};border-radius:6px;padding:6px 10px;font-size:13px;">
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
              <option value="baidu">百度</option>
              <option value="custom">自定义</option>
            </select>
          </div>
          <div style="display:grid;grid-template-columns:120px 1fr;gap:8px;align-items:center;">
            <label style="color:${this._colors.textSecondary};font-size:13px;">API Key</label>
            <input type="password" id="assistApiKey" class="form-input" placeholder="输入你的API Key" style="background:${this._colors.parchment};color:${this._colors.inkDark};border:1px solid ${this._colors.border};border-radius:6px;padding:6px 10px;font-size:13px;">
          </div>
          <div style="display:grid;grid-template-columns:120px 1fr;gap:8px;align-items:center;">
            <label style="color:${this._colors.textSecondary};font-size:13px;">Model</label>
            <input type="text" id="assistModel" class="form-input" placeholder="如 gpt-4, claude-3-opus" style="background:${this._colors.parchment};color:${this._colors.inkDark};border:1px solid ${this._colors.border};border-radius:6px;padding:6px 10px;font-size:13px;">
          </div>
          <div style="display:grid;grid-template-columns:120px 1fr;gap:8px;align-items:center;">
            <label style="color:${this._colors.textSecondary};font-size:13px;">Base URL</label>
            <input type="text" id="assistBaseURL" class="form-input" placeholder="自定义API地址（可选）" style="background:${this._colors.parchment};color:${this._colors.inkDark};border:1px solid ${this._colors.border};border-radius:6px;padding:6px 10px;font-size:13px;">
          </div>
          <div style="display:grid;grid-template-columns:120px 1fr auto;gap:8px;align-items:center;">
            <label style="color:${this._colors.textSecondary};font-size:13px;">Temperature</label>
            <input type="range" id="assistTemp" min="0" max="2" step="0.1" value="0.7" style="width:100%;" oninput="document.getElementById('assistTempValue').textContent=this.value">
            <span id="assistTempValue" style="color:${this._colors.textSecondary};font-size:12px;text-align:right;min-width:36px;">0.7</span>
          </div>
          <div style="display:grid;grid-template-columns:120px 1fr;gap:8px;align-items:center;">
            <label style="color:${this._colors.textSecondary};font-size:13px;">Max Tokens</label>
            <input type="number" id="assistMaxTokens" class="form-input" value="4096" min="256" max="32768" step="256" style="background:${this._colors.parchment};color:${this._colors.inkDark};border:1px solid ${this._colors.border};border-radius:6px;padding:6px 10px;font-size:13px;">
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
            <button class="btn btn-sm btn-secondary" onclick="Assistant.resetApiSettings()" style="border-color:${this._colors.border};color:${this._colors.textSecondary};">恢复默认</button>
            <button class="btn btn-sm btn-primary" onclick="Assistant.saveApiSettings()" style="background:${this._colors.gold};color:${this._colors.inkDark};border:none;">💾 保存配置</button>
          </div>
        </div>
      </div>

      <!-- 快捷操作按钮栏 -->
      <div class="card" style="margin-bottom:var(--space-lg,16px);background:${this._colors.bgCard};border:1px solid ${this._colors.border};border-radius:12px;overflow:hidden;">
        <div class="card-header" style="padding:10px 16px;font-size:13px;color:${this._colors.textSecondary};background:${this._colors.bgSecondary};border-bottom:1px solid ${this._colors.border};">⚡ 快捷操作</div>
        <div class="card-body" style="display:flex;gap:8px;flex-wrap:wrap;padding:12px 16px;">
          <button class="btn btn-sm btn-secondary" onclick="Assistant.quickTask('制作预设')" title="生成预设配置" style="border-color:${this._colors.gold};color:${this._colors.gold};">📋 制作预设</button>
          <button class="btn btn-sm btn-secondary" onclick="Assistant.quickTask('美化UI')" title="修改配色/字体/布局" style="border-color:${this._colors.gold};color:${this._colors.gold};">🎨 美化UI</button>
          <button class="btn btn-sm btn-secondary" onclick="Assistant.quickTask('制作功能')" title="创建JS模块" style="border-color:${this._colors.gold};color:${this._colors.gold};">⚙️ 制作功能</button>
          <button class="btn btn-sm btn-secondary" onclick="Assistant.quickTask('制作角色')" title="生成NPC数据" style="border-color:${this._colors.gold};color:${this._colors.gold};">👤 制作角色</button>
          <button class="btn btn-sm btn-secondary" onclick="Assistant.quickTask('制作APP')" title="创建小手机App" style="border-color:${this._colors.gold};color:${this._colors.gold};">📱 制作APP</button>
          <button class="btn btn-sm btn-secondary" onclick="Assistant.quickTask('修改代码')" title="分析并修改代码" style="border-color:${this._colors.gold};color:${this._colors.gold};">🔧 修改代码</button>
          <button class="btn btn-sm btn-secondary" onclick="Assistant.quickTask('导入代码')" title="导入外部代码" style="border-color:${this._colors.gold};color:${this._colors.gold};">📥 导入代码</button>
        </div>
      </div>

      <!-- 对话区域 -->
      <div class="assistant-chat" id="assistantChat" style="height:520px;display:flex;flex-direction:column;border:1px solid ${this._colors.border};border-radius:12px;overflow:hidden;background:${this._colors.bgCard};">
        <!-- 对话头部 -->
        <div class="assistant-chat-header" style="display:flex;align-items:center;gap:8px;padding:12px 16px;background:${this._colors.inkDark};color:${this._colors.gold};border-bottom:1px solid ${this._colors.border};font-weight:600;font-size:14px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          万能小助手 v3 — 自编程AI引擎
        </div>

        <!-- 文件上传拖放区 -->
        <div id="assistantDropZone" style="display:none;padding:8px 16px;background:${this._colors.bgSecondary};border-bottom:1px dashed ${this._colors.border};text-align:center;font-size:12px;color:${this._colors.textSecondary};">
          📎 拖放文件到此处上传，或
          <input type="file" id="assistantFileInput" style="display:none;" onchange="Assistant.handleFileUpload(this.files[0])">
          <button class="btn btn-sm btn-secondary" onclick="document.getElementById('assistantFileInput').click()" style="border-color:${this._colors.border};color:${this._colors.textSecondary};">选择文件</button>
        </div>

        <!-- 消息列表 -->
        <div class="assistant-chat-body" id="assistantChatBody" style="flex:1;overflow-y:auto;padding:16px;background:${this._colors.parchment};"></div>

        <!-- 输入区域 -->
        <div class="assistant-chat-input" style="display:flex;gap:8px;padding:12px 16px;border-top:1px solid ${this._colors.border};background:${this._colors.bgSecondary};">
          <button class="btn btn-sm btn-secondary" onclick="Assistant.toggleDropZone()" title="上传文件" style="padding:6px 8px;border-color:${this._colors.border};color:${this._colors.textSecondary};">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          </button>
          <input type="text" id="assistantInput" placeholder="输入你的需求，或描述你想制作的内容..."
            style="flex:1;background:${this._colors.parchment};color:${this._colors.inkDark};border:1px solid ${this._colors.border};border-radius:8px;padding:8px 12px;font-size:13px;"
            onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();Assistant.send();}">
          <button class="btn btn-primary" onclick="Assistant.send()" style="padding:8px 16px;background:${this._colors.gold};color:${this._colors.inkDark};border:none;border-radius:8px;font-weight:600;">发送</button>
        </div>
      </div>
    `;

    this.loadApiSettings();
    this.renderChat();
  },

  // =========================================================
  // API设置面板控制
  // =========================================================

  /**
   * 切换API设置面板的显示/隐藏状态
   */
  toggleApiPanel() {
    const panel = document.getElementById('assistantApiPanel');
    if (!panel) return;
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    this._showApiPanel = panel.style.display === 'block';
  },

  /**
   * 从localStorage加载API设置到面板表单
   */
  loadApiSettings() {
    const settings = this.getSettings();
    const ids = ['assistProvider','assistApiKey','assistModel','assistBaseURL','assistTemp','assistMaxTokens'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      switch(id) {
        case 'assistProvider': el.value = settings.provider || 'openai'; break;
        case 'assistApiKey': el.value = settings.apiKey || ''; break;
        case 'assistModel': el.value = settings.model || 'gpt-4'; break;
        case 'assistBaseURL': el.value = settings.baseURL || ''; break;
        case 'assistTemp':
          el.value = settings.temperature ?? 0.7;
          const valEl = document.getElementById('assistTempValue');
          if (valEl) valEl.textContent = el.value;
          break;
        case 'assistMaxTokens': el.value = settings.maxTokens || 4096; break;
      }
    });
  },

  /**
   * 保存面板中的API设置到localStorage
   */
  saveApiSettings() {
    const settings = {
      provider: document.getElementById('assistProvider')?.value || 'openai',
      apiKey: document.getElementById('assistApiKey')?.value || '',
      model: document.getElementById('assistModel')?.value || 'gpt-4',
      baseURL: document.getElementById('assistBaseURL')?.value || '',
      temperature: parseFloat(document.getElementById('assistTemp')?.value || 0.7),
      maxTokens: parseInt(document.getElementById('assistMaxTokens')?.value || 4096)
    };
    this.saveSettings(settings);
    this._addSystemMessage('✅ API配置已保存！小助手将使用独立的API设置。');
  },

  /**
   * 恢复默认API设置（继承主API的provider和model）
   */
  resetApiSettings() {
    const defaults = {
      provider: (typeof window !== 'undefined' && window.APISettings && window.APISettings.config && window.APISettings.config.provider) || 'openai',
      apiKey: '',
      model: (typeof window !== 'undefined' && window.APISettings && window.APISettings.config && window.APISettings.config.model) || 'gpt-4',
      baseURL: (typeof window !== 'undefined' && window.APISettings && window.APISettings.config && window.APISettings.config.baseURL) || '',
      temperature: 0.7,
      maxTokens: 4096
    };
    this.saveSettings(defaults);
    this.loadApiSettings();
    this._addSystemMessage('🔄 API配置已恢复默认。');
  },

  // =========================================================
  // 对话消息渲染
  // =========================================================

  /**
   * 渲染对话消息列表到DOM
   */
  renderChat() {
    const body = document.getElementById('assistantChatBody');
    if (!body) return;

    if (this._chatHistory.length === 0) {
      body.innerHTML = this._renderWelcomeCard();
      return;
    }

    body.innerHTML = this._chatHistory.map(m => this._renderMessage(m)).join('');
    // 滚动到底部
    requestAnimationFrame(() => { body.scrollTop = body.scrollHeight; });
  },

  /**
   * 渲染欢迎卡片（首次进入时显示）
   * @returns {string} HTML字符串
   */
  _renderWelcomeCard() {
    return `
      <div class="assistant-msg ai" style="margin-bottom:16px;">
        <div class="msg-sender" style="font-size:12px;color:${this._colors.gold};margin-bottom:4px;font-weight:600;">🤖 万能小助手</div>
        <div class="msg-content" style="background:${this._colors.bgSecondary};padding:12px 16px;border-radius:8px;border-left:3px solid ${this._colors.gold};color:${this._colors.textPrimary};font-size:13px;line-height:1.7;">
          <p style="margin:0 0 8px 0;font-weight:600;color:${this._colors.inkDark};">🎋 欢迎来到万能小助手 v3</p>
          <p style="margin:0 0 8px 0;">我是你的自编程AI引擎，所有操作在对话框内完成。</p>
          <p style="margin:0;font-size:12px;color:${this._colors.textSecondary};">上方快捷按钮可快速开始，或直接输入你的需求！</p>
        </div>
      </div>
    `;
  },

  /**
   * 渲染单条对话消息
   * @param {{role:string,content:string,time:number}} msg - 消息对象
   * @returns {string} HTML字符串
   */
  _renderMessage(msg) {
    const isAI = msg.role === 'assistant';
    // AI消息使用Markdown渲染，用户消息使用HTML转义
    const content = isAI ? this._renderMarkdown(msg.content) : this.escapeHtml(msg.content);
    return `
      <div class="assistant-msg ${isAI ? 'ai' : 'user'}" style="margin-bottom:16px;${isAI ? '' : 'text-align:right;'}">
        <div class="msg-sender" style="font-size:12px;color:${isAI ? this._colors.gold : this._colors.textSecondary};margin-bottom:4px;font-weight:600;">
          ${isAI ? '🤖 万能小助手' : '👤 你'}
        </div>
        <div class="msg-content" style="display:inline-block;max-width:85%;background:${isAI ? this._colors.bgSecondary : this._colors.inkMid};padding:12px 16px;border-radius:8px;border-left:${isAI ? '3px solid ' + this._colors.gold : 'none'};color:${isAI ? this._colors.textPrimary : this._colors.parchment};font-size:13px;line-height:1.7;text-align:left;">
          ${content}
        </div>
      </div>
    `;
  },

  /**
   * Markdown渲染引擎
   * 支持：代码块高亮+复制按钮、行内代码、粗体、斜体、标题、列表、链接、引用块、表格
   * @param {string} text - Markdown文本
   * @returns {string} HTML字符串
   */
  _renderMarkdown(text) {
    if (!text) return '';
    let html = text;

    // 代码块（带语法高亮和复制按钮）
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang || 'javascript';
      const escapedCode = this.escapeHtml(code.trim());
      const uniqueId = 'code-' + Math.random().toString(36).substr(2, 9);
      return `
        <div style="margin:8px 0;border:1px solid ${this._colors.border};border-radius:8px;overflow:hidden;background:${this._colors.inkDark};">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 12px;background:${this._colors.inkMid};color:${this._colors.gold};font-size:11px;">
            <span>${language}</span>
            <button class="btn btn-sm btn-secondary" onclick="Assistant.copyCode('${uniqueId}')" style="font-size:11px;padding:2px 8px;background:transparent;border:1px solid ${this._colors.gold};color:${this._colors.gold};border-radius:4px;cursor:pointer;">📋 复制</button>
          </div>
          <pre id="${uniqueId}" style="margin:0;padding:12px;overflow-x:auto;font-size:12px;line-height:1.5;color:${this._colors.parchment};background:${this._colors.inkDark};"><code>${escapedCode}</code></pre>
        </div>
      `;
    });

    // 行内代码
    html = html.replace(/`([^`]+)`/g, `<code style="background:${this._colors.inkDark};color:${this._colors.gold};padding:2px 6px;border-radius:4px;font-size:12px;">$1</code>`);

    // 粗体
    html = html.replace(/\*\*(.+?)\*\*/g, `<strong style="color:${this._colors.gold};">$1</strong>`);

    // 斜体
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // 标题 ###
    html = html.replace(/### (.+)/g, `<h4 style="color:${this._colors.gold};margin:12px 0 8px;font-size:14px;">$1</h4>`);
    // 标题 ##
    html = html.replace(/## (.+)/g, `<h3 style="color:${this._colors.gold};margin:16px 0 12px;font-size:16px;border-bottom:1px solid ${this._colors.border};padding-bottom:4px;">$1</h3>`);
    // 标题 #
    html = html.replace(/# (.+)/g, `<h2 style="color:${this._colors.gold};margin:20px 0 12px;font-size:18px;">$1</h2>`);

    // 无序列表（逐行替换，然后包裹）
    // 先标记列表项
    html = html.replace(/^\s*[-*]\s+(.+)$/gm, `<li style="margin:4px 0;padding-left:8px;position:relative;"><span style="position:absolute;left:-8px;color:${this._colors.gold};">•</span>$1</li>`);
    // 包裹连续的li
    html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, `<ul style="margin:8px 0;padding-left:20px;list-style:none;">$&</ul>`);

    // 有序列表
    html = html.replace(/^\s*(\d+)\.\s+(.+)$/gm, `<li style="margin:4px 0;padding-left:8px;"><span style="color:${this._colors.gold};font-weight:600;">$1.</span> $2</li>`);

    // 链接
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" style="color:${this._colors.gold};text-decoration:underline;">$1</a>`);

    // 引用块
    html = html.replace(/^>\s*(.+)$/gm, `<blockquote style="margin:8px 0;padding:8px 12px;border-left:3px solid ${this._colors.gold};background:${this._colors.bgSecondary};color:${this._colors.textSecondary};font-style:italic;">$1</blockquote>`);

    // 水平线
    html = html.replace(/^---+$/gm, `<hr style="border:none;border-top:1px solid ${this._colors.border};margin:16px 0;">`);

    // 表格
    html = html.replace(/\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\n)+)/g, (match, header, rows) => {
      const headers = header.split('|').map(h => h.trim()).filter(Boolean);
      const rowData = rows.trim().split('\n').map(r => r.split('|').map(c => c.trim()).filter(Boolean));
      const headerHtml = headers.map(h => `<th style="padding:8px 12px;text-align:left;color:${this._colors.gold};border-bottom:2px solid ${this._colors.gold};font-size:12px;background:${this._colors.inkDark};">${h}</th>`).join('');
      const rowsHtml = rowData.map(r => `<tr>${r.map(c => `<td style="padding:6px 12px;border-bottom:1px solid ${this._colors.border};font-size:12px;">${c}</td>`).join('')}</tr>`).join('');
      return `<table style="width:100%;border-collapse:collapse;margin:12px 0;background:${this._colors.bgSecondary};border-radius:8px;overflow:hidden;border:1px solid ${this._colors.border};"><thead><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
    });

    // 换行（必须在最后处理，避免破坏前面的标签结构）
    html = html.replace(/\n/g, '<br>');

    return html;
  },

  /**
   * 生成选项按钮组HTML（用于"先问后做"的交互）
   * @param {Array<{id:string,label:string}>} options - 选项列表
   * @param {string} context - 上下文标识
   * @returns {string} HTML字符串
   */
  _renderChoiceButtons(options, context) {
    const btns = options.map(opt =>
      `<button onclick="Assistant._handleChoiceButton('${opt.id}', '${context}')" style="padding:6px 14px;background:${this._colors.gold};color:${this._colors.inkDark};border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;margin:4px 4px 4px 0;">${opt.label}</button>`
    ).join('');
    return `<div style="margin-top:12px;">${btns}</div>`;
  },

  /**
   * 处理选项按钮点击事件
   * @param {string} choiceId - 选择的ID
   * @param {string} context - 上下文标识
   */
  _handleChoiceButton(choiceId, context) {
    // 将按钮选择模拟为文本输入处理
    if (this._waitingForChoice && this._choiceCallback) {
      this._waitingForChoice = false;
      const cb = this._choiceCallback;
      this._choiceCallback = null;
      this._choiceContext = null;
      cb(choiceId);
    }
  },

  /**
   * 复制代码到剪贴板
   * @param {string} elementId - 代码块元素ID
   */
  copyCode(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const code = el.textContent;
    navigator.clipboard.writeText(code).then(() => {
      this._addSystemMessage('✅ 代码已复制到剪贴板');
    }).catch(() => {
      // 降级方案：使用textarea fallback
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this._addSystemMessage('✅ 代码已复制到剪贴板');
    });
  },

  /**
   * HTML特殊字符转义，防止XSS攻击
   * @param {string} text - 原始文本
   * @returns {string} 转义后的安全HTML文本
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
  },

  // =========================================================
  // 消息发送与AI对话
  // =========================================================

  /**
   * 添加系统/AI消息到对话历史并渲染
   * @param {string} content - 消息内容（支持Markdown）
   */
  _addSystemMessage(content) {
    this._chatHistory.push({ role: 'assistant', content, time: Date.now() });
    this.renderChat();
  },

  /**
   * 快捷任务入口
   * 用户点击快捷按钮时触发，预设提示词并进入对应流程
   * @param {string} task - 任务关键词
   */
  quickTask(task) {
    const prompts = {
      '制作预设': '我想制作一个预设。请告诉我你想要什么类型的预设：角色卡、场景、世界观还是自定义？',
      '美化UI': '我想美化UI界面。请描述你想要的风格（如：更古风、更现代、暗黑模式等），或者告诉我具体想修改哪些元素？',
      '制作功能': '我想制作一个新功能。请描述这个功能的作用和使用场景，我会为你生成完整的JS模块代码。',
      '制作角色': '我想制作一个新角色。请描述角色的基本信息（名字、年龄、职业、性格、背景故事等），我会为你生成完整的NPC数据。',
      '制作APP': '我想制作一个小手机App。请描述这个App的功能和界面需求，我会为你生成完整的App代码。',
      '修改代码': '我想修改代码。请描述你想要什么修改（如"把导航栏改成竖排"、"加一个夜间模式"等），我会分析代码并给出修改方案。',
      '导入代码': '我想导入代码。请粘贴代码内容或上传文件，我会分析代码类型并帮助你导入到系统。'
    };
    const prompt = prompts[task] || task;
    this._chatHistory.push({ role: 'user', content: prompt, time: Date.now() });
    this.renderChat();
    // 自动触发AI回复引导
    this._processTask(task);
  },

  /**
   * 处理快捷任务的AI引导回复
   * 显示该任务的操作说明和选项
   * @param {string} task - 任务类型
   */
  async _processTask(task) {
    const responses = {
      '制作预设': `好的！我来帮你制作预设。

**请选择预设类型：**

**A) 角色卡** — 用于定义AI扮演角色的提示词模板
**B) 场景** — 用于设定故事发生场景的提示词模板
**C) 世界观** — 用于构建整个世界观的提示词模板
**D) 自定义** — 其他类型的预设

请回复 A、B、C 或 D，或者直接描述你的需求！`,

      '美化UI': `好的！我来帮你美化UI。

**常见美化方向：**

**A) 更古风** — 加深墨色、增加金色点缀、使用书法字体
**B) 更现代** — 扁平化设计、圆角卡片、渐变色彩
**C) 暗黑模式** — 深色背景、高对比度、暗色调配色
**D) 自定义修改** — 指定具体要修改的元素

请回复 A、B、C 或 D，或者描述你想要的具体效果！`,

      '制作功能': `好的！我来帮你制作新功能。

**请描述你想制作的功能：**

例如：
- "一个任务系统，可以创建每日任务并追踪完成情况"
- "一个背包系统，可以管理物品和装备"
- "一个天气系统，根据现实时间显示不同天气效果"

请详细描述功能需求，我会生成完整的JS模块代码！`,

      '制作角色': `好的！我来帮你制作新角色。

**请描述角色信息：**

建议包含：
- **名字**：角色姓名
- **年龄**：角色年龄
- **职业**：角色身份/职业
- **性格**：性格特征（如温柔、傲娇、冷静等）
- **背景**：角色背景故事
- **外貌**：外貌描述（用于AI生成立绘）

你可以直接发送一段角色设定，我会帮你生成完整的NPC数据！`,

      '制作APP': `好的！我来帮你制作小手机App。

**请描述App功能：**

例如：
- "一个日记App，可以记录每日心情和事件"
- "一个天气App，显示当前天气和未来预报"
- "一个音乐播放器App，可以播放本地音乐"

请描述App的主要功能和界面布局需求！`,

      '修改代码': `好的！我来帮你修改代码。

**请描述你想要什么修改：**

例如：
- "把导航栏改成竖排左侧侧边栏"
- "加一个夜间模式切换按钮"
- "修改卡片的圆角大小"

请描述具体修改需求，我会：
1. 分析需要修改哪些文件
2. 生成修改方案（diff对比）
3. 展示修改预览
4. 询问是否应用修改`,

      '导入代码': `好的！我来帮你导入代码。

**请粘贴代码内容或上传文件**

我会自动分析代码类型：
- JS模块 → 导入为系统功能
- App代码 → 导入到虚拟App平台
- 预设数据 → 导入到预设管理
- 角色数据 → 导入到人物志
- CSS样式 → 应用到当前主题

请粘贴代码或点击附件按钮上传文件！`
    };

    const reply = responses[task] || '请描述你的需求，我会尽力帮助你！';
    this._addSystemMessage(reply);
  },

  /**
   * 发送用户输入消息
   * 如果正在等待用户选择，则处理选择；否则进入意图检测和AI对话
   */
  async send() {
    const input = document.getElementById('assistantInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    // 如果正在等待用户选择，优先处理选择
    if (this._waitingForChoice && this._choiceCallback) {
      this._waitingForChoice = false;
      const cb = this._choiceCallback;
      this._choiceCallback = null;
      this._choiceContext = null;
      cb(text);
      return;
    }

    // 记录用户消息
    this._chatHistory.push({ role: 'user', content: text, time: Date.now() });
    this.renderChat();

    // 检测用户意图
    const intent = this._detectIntent(text);
    if (intent) {
      await this._handleIntent(intent, text);
      return;
    }

    // 默认进入AI聊天模式
    await this._chatWithAI(text);
  },

  /**
   * 检测用户输入的意图类型
   * @param {string} text - 用户输入文本
   * @returns {string|null} 意图类型标识，未匹配则返回null
   */
  _detectIntent(text) {
    const lower = text.toLowerCase();
    const keywords = {
      'preset': ['预设', '角色卡', '场景设定', '世界观', '制作预设'],
      'beautify': ['美化', 'ui', '配色', '主题', '风格', '暗黑模式', '颜色', '美化ui'],
      'feature': ['功能', '模块', '系统', '插件', '制作功能', '新功能'],
      'character': ['角色', 'npc', '人物', '制作角色', '新角色'],
      'app': ['app', '应用', '小手机', '制作app', '手机app'],
      'modify': ['修改代码', '改代码', '补丁', '修复', '调整', '代码修改'],
      'import': ['导入', '导入代码', '上传', '粘贴代码']
    };

    for (const [intent, words] of Object.entries(keywords)) {
      if (words.some(w => lower.includes(w))) return intent;
    }
    return null;
  },

  /**
   * 根据检测到的意图路由到对应功能处理
   * @param {string} intent - 意图类型
   * @param {string} text - 用户原始输入
   */
  async _handleIntent(intent, text) {
    switch (intent) {
      case 'preset': await this._makePreset(text); break;
      case 'beautify': await this._beautifyUI(text); break;
      case 'feature': await this._makeFeature(text); break;
      case 'character': await this._makeCharacter(text); break;
      case 'app': await this._makeApp(text); break;
      case 'modify': await this._modifyCode(text); break;
      case 'import': await this._importCode(text); break;
      default: await this._chatWithAI(text);
    }
  },

  /**
   * 与AI进行对话（通用聊天模式）
   * 使用小助手独立的API配置
   * @param {string} text - 用户输入
   */
  async _chatWithAI(text) {
    try {
      const settings = this.getSettings();
      const messages = [
        { role: 'system', content: this._systemPrompt },
        ...this._chatHistory.slice(-20).map(h => ({ role: h.role, content: h.content }))
      ];

      const reply = await this._callAssistantAPI(text, messages, settings);
      this._chatHistory.push({ role: 'assistant', content: reply, time: Date.now() });
      this.renderChat();
    } catch (e) {
      this._chatHistory.push({
        role: 'assistant',
        content: `❌ 抱歉，处理出错：${e.message}\n\n请检查API设置是否正确配置。`,
        time: Date.now()
      });
      this.renderChat();
    }
  },

  /**
   * 调用小助手独立API
   * 优先使用独立配置，失败时回退到主系统API
   * @param {string} text - 用户输入
   * @param {Array} messages - 消息历史
   * @param {Object} settings - API配置
   * @returns {string} AI回复文本
   */
  async _callAssistantAPI(text, messages, settings) {
    // 优先使用主系统的APISettings，但传入小助手的独立配置
    if (typeof window !== 'undefined' && window.APISettings && window.APISettings.chat) {
      try {
        return await window.APISettings.chat(text, messages, {
          provider: settings.provider,
          apiKey: settings.apiKey,
          model: settings.model,
          baseURL: settings.baseURL,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens
        });
      } catch (e) {
        // 如果独立配置调用失败，回退到主API
        console.warn('[万能小助手] 独立API调用失败，尝试使用主API:', e);
        return await window.APISettings.chat(text, messages, { useAux: true });
      }
    }

    // 无API时的模拟回复
    return `🎋 收到你的消息："${text}"\n\n（当前未配置API，请在上方"API设置"中配置你的API Key，或使用系统主API）`;
  },

  // =========================================================
  // 功能实现：制作预设
  // =========================================================

  /**
   * 制作预设功能
   * 引导用户选择预设类型，收集描述，生成预设数据，询问是否导入
   * @param {string} text - 用户输入
   */
  async _makePreset(text) {
    this._addSystemMessage(`📋 开始制作预设...

请确认预设类型：
**A) 角色卡** — AI扮演的角色设定
**B) 场景** — 故事发生场景
**C) 世界观** — 整个世界观框架
**D) 自定义** — 其他类型

请回复选项（A/B/C/D）或详细描述你的需求。`);

    this._waitingForChoice = true;
    this._choiceContext = 'preset_type';
    this._choiceCallback = async (choice) => {
      const typeMap = { 'a': '角色卡', 'b': '场景', 'c': '世界观', 'd': '自定义' };
      const type = typeMap[choice.toLowerCase().trim()] || '自定义';

      this._addSystemMessage(`✅ 已选择：**${type}**\n\n请描述这个预设的详细内容，例如名称、描述、提示词模板等。我会为你生成完整的预设数据。`);

      this._waitingForChoice = true;
      this._choiceContext = 'preset_detail';
      this._choiceCallback = async (detail) => {
        // 生成预设数据对象
        const preset = {
          id: 'preset_' + Date.now(),
          name: detail.split('\n')[0].substring(0, 20) || `${type}_${Date.now()}`,
          category: type,
          description: detail.substring(0, 100),
          promptTemplate: detail,
          variables: this._extractVariables(detail),
          createdAt: Date.now()
        };

        // 显示预览卡片
        const preview = `📝 **预设预览**

| 字段 | 内容 |
|------|------|
| 名称 | ${preset.name} |
| 类型 | ${preset.category} |
| 描述 | ${preset.description} |
| 变量 | ${preset.variables.join(', ') || '无'} |

**提示词模板（前200字）：**
\`\`\`
${preset.promptTemplate.substring(0, 200)}${preset.promptTemplate.length > 200 ? '...' : ''}
\`\`\`

是否自动导入到预设管理？`;

        this._addSystemMessage(preview + '\n\n' + this._renderChoiceButtons([
          { id: 'import_yes', label: '✅ 是，立即导入' },
          { id: 'import_no_edit', label: '✏️ 否，我再修改' },
          { id: 'import_draft', label: '📝 保存为草稿' }
        ], 'preset_confirm'));

        this._waitingForChoice = true;
        this._choiceContext = 'preset_confirm';
        this._choiceCallback = (confirm) => {
          const c = confirm.toLowerCase().trim();
          if (c === 'import_yes' || c === 'a' || c.includes('是') || c.includes('导入')) {
            if (typeof window !== 'undefined' && window.PresetManager && window.PresetManager.addPreset) {
              window.PresetManager.addPreset(preset);
              this._addSystemMessage(`✅ 预设「${preset.name}」已成功导入到预设管理！\n\n你可以在「预设」页面查看和使用。`);
            } else {
              // 预设管理器未加载时的降级方案：保存到localStorage
              const presets = JSON.parse(localStorage.getItem('assistant_presets') || '[]');
              presets.push(preset);
              localStorage.setItem('assistant_presets', JSON.stringify(presets));
              this._addSystemMessage(`✅ 预设「${preset.name}」已保存！\n\n（预设管理器未加载，已保存到助手草稿箱）`);
            }
          } else if (c === 'import_no_edit' || c === 'b' || c.includes('修改')) {
            this._addSystemMessage('好的，请告诉我需要修改哪里，我会更新预设内容。');
          } else {
            this._addSystemMessage('已保存为草稿，你可以在稍后继续编辑。');
          }
        };
      };
    };
  },

  /**
   * 从文本中提取变量占位符 {{变量名}}
   * @param {string} text - 文本内容
   * @returns {Array<string>} 去重后的变量名列表
   */
  _extractVariables(text) {
    const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
    return [...new Set(matches.map(m => m.replace(/[{}]/g, '').trim()))];
  },

  // =========================================================
  // 功能实现：美化UI
  // =========================================================

  /**
   * 美化UI功能
   * 引导用户选择美化方向，生成CSS变更方案，展示diff预览，询问是否应用
   * @param {string} text - 用户输入
   */
  async _beautifyUI(text) {
    this._addSystemMessage(`🎨 开始分析UI美化需求...

**请选择美化方向：**

**A) 更古风** — 暖羊皮纸底色 + 金色点缀 + 书法字体
**B) 更现代** — 扁平设计 + 大圆角 + 渐变色彩
**C) 暗黑模式** — 深色背景 + 高对比度 + 暗金色调
**D) 自定义** — 指定具体修改

请回复选项（A/B/C/D）或描述你想要的具体效果。`);

    this._waitingForChoice = true;
    this._choiceContext = 'ui_theme';
    this._choiceCallback = async (choice) => {
      const lower = choice.toLowerCase().trim();
      let themeName = '';
      let cssChanges = [];

      if (lower === 'a' || lower.includes('古风')) {
        themeName = '古风墨境';
        cssChanges = [
          { selector: ':root', property: '--bg-primary', oldValue: '当前值', newValue: '#F5E6D3' },
          { selector: ':root', property: '--bg-secondary', oldValue: '当前值', newValue: '#EDE0D0' },
          { selector: ':root', property: '--gold', oldValue: '当前值', newValue: '#C9A227' },
          { selector: ':root', property: '--ink-dark', oldValue: '当前值', newValue: '#2C1810' },
          { selector: ':root', property: '--ink-mid', oldValue: '当前值', newValue: '#4A3728' }
        ];
      } else if (lower === 'b' || lower.includes('现代')) {
        themeName = '现代简约';
        cssChanges = [
          { selector: ':root', property: '--bg-primary', oldValue: '当前值', newValue: '#FAFBFC' },
          { selector: ':root', property: '--bg-secondary', oldValue: '当前值', newValue: '#F0F2F5' },
          { selector: ':root', property: '--gold', oldValue: '当前值', newValue: '#2563EB' },
          { selector: ':root', property: '--ink-dark', oldValue: '当前值', newValue: '#1E293B' },
          { selector: ':root', property: '--ink-mid', oldValue: '当前值', newValue: '#475569' }
        ];
      } else if (lower === 'c' || lower.includes('暗黑')) {
        themeName = '墨夜模式';
        cssChanges = [
          { selector: ':root', property: '--bg-primary', oldValue: '当前值', newValue: '#0F0F0F' },
          { selector: ':root', property: '--bg-secondary', oldValue: '当前值', newValue: '#1A1A1A' },
          { selector: ':root', property: '--gold', oldValue: '当前值', newValue: '#D4A853' },
          { selector: ':root', property: '--ink-dark', oldValue: '当前值', newValue: '#E8E8E8' },
          { selector: ':root', property: '--ink-mid', oldValue: '当前值', newValue: '#A0A0A0' }
        ];
      } else {
        themeName = '自定义';
        cssChanges = [{ selector: 'custom', property: 'custom', oldValue: '根据你的描述', newValue: '待生成' }];
      }

      // 生成diff预览表格
      let diffPreview = `🎨 **「${themeName}」主题预览**

**CSS变更对比：**\n\n`;
      diffPreview += '| 属性 | 变更前 | 变更后 |\n';
      diffPreview += '|------|--------|--------|\n';
      cssChanges.forEach(c => {
        diffPreview += `| ${c.property} | ${c.oldValue} | **${c.newValue}** |\n`;
      });

      diffPreview += `\n\n是否应用这些修改？`;

      this._addSystemMessage(diffPreview + '\n\n' + this._renderChoiceButtons([
        { id: 'apply_yes', label: '✅ 是，应用修改' },
        { id: 'apply_adjust', label: '✏️ 否，我再调整' },
        { id: 'apply_preview', label: '👁️ 仅预览不应用' }
      ], 'ui_confirm'));

      this._waitingForChoice = true;
      this._choiceContext = 'ui_confirm';
      this._choiceCallback = async (confirm) => {
        const c = confirm.toLowerCase().trim();
        if (c === 'apply_yes' || c === 'a' || c.includes('是') || c.includes('应用')) {
          if (typeof window !== 'undefined' && window.CodePatcher && window.CodePatcher.applyPatch) {
            const success = await window.CodePatcher.applyPatch(cssChanges);
            if (success) {
              this._addSystemMessage(`✅ 「${themeName}」主题已成功应用！\n\n页面样式已更新，你可以立即看到效果。`);
            } else {
              this._addSystemMessage(`❌ 应用失败，CodePatcher返回错误。\n\n你可以尝试手动修改CSS，或检查CodePatcher是否可用。`);
            }
          } else {
            // 降级方案：直接修改CSS变量
            this._applyCSSChanges(cssChanges);
            this._addSystemMessage(`✅ 「${themeName}」主题已通过CSS变量应用！\n\n（CodePatcher未加载，使用了降级方案）`);
          }
        } else if (c === 'apply_adjust' || c === 'b' || c.includes('调整')) {
          this._addSystemMessage('好的，请告诉我想要调整的地方，我会更新修改方案。');
        } else {
          this._addSystemMessage('已取消应用，当前样式保持不变。');
        }
      };
    };
  },

  /**
   * 直接应用CSS变更（CodePatcher不可用时的降级方案）
   * 修改CSS变量并持久化到localStorage
   * @param {Array} changes - CSS变更列表
   */
  _applyCSSChanges(changes) {
    const root = document.documentElement;
    changes.forEach(c => {
      if (c.property && c.newValue && c.property !== 'custom') {
        root.style.setProperty(c.property, c.newValue);
      }
    });
    // 保存到localStorage以便持久化
    const saved = JSON.parse(localStorage.getItem('assistant_css_theme') || '{}');
    changes.forEach(c => {
      if (c.property && c.property !== 'custom') {
        saved[c.property] = c.newValue;
      }
    });
    localStorage.setItem('assistant_css_theme', JSON.stringify(saved));
  },

  // =========================================================
  // 功能实现：制作功能（JS模块）
  // =========================================================

  /**
   * 制作新功能模块
   * 收集功能描述，生成完整JS模块代码，询问是否自动导入系统
   * @param {string} text - 用户输入
   */
  async _makeFeature(text) {
    this._addSystemMessage(`⚙️ 开始制作新功能模块...

请详细描述你想要的功能：

**建议包含：**
- 功能名称
- 功能作用
- 使用场景
- 需要的界面元素（如按钮、列表、表单等）
- 数据存储需求

例如："一个任务追踪系统，可以创建任务、标记完成、查看进度统计"

请描述你的功能需求：`);

    this._waitingForChoice = true;
    this._choiceContext = 'feature_detail';
    this._choiceCallback = async (detail) => {
      // 从描述中提取模块名称
      const moduleName = detail.split(/[\s，。]/)[0].replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '') || 'CustomModule';
      const moduleId = moduleName.toLowerCase().replace(/[^a-z0-9]/g, '') + '_v3';

      // 生成完整的JS模块代码模板
      const code = `/**
 * =========================================================
 * ${moduleName} 模块
 * 由万能小助手v3自动生成
 * 功能描述：${detail.substring(0, 50)}
 * =========================================================
 */
const ${moduleName} = {
  // 模块配置信息
  config: {
    id: '${moduleId}',
    name: '${moduleName}',
    version: '1.0.0',
    description: '${detail.substring(0, 80).replace(/'/g, "\\'")}'
  },

  // 模块内部数据存储
  data: {},

  /**
   * 初始化模块
   * 由系统路由调用，加载持久化数据并渲染页面
   */
  init() {
    this.loadData();
    this.renderPage();
    console.log('[${moduleName}] 模块已初始化，版本: 1.0.0');
  },

  /**
   * 页面进入时触发
   * 重新渲染页面并刷新数据
   */
  onEnter() {
    this.renderPage();
    this.loadData();
  },

  /**
   * 渲染模块页面到DOM
   * 查找 page-${moduleId} 容器并填充内容
   */
  renderPage() {
    const page = document.getElementById('page-${moduleId}');
    if (!page) return;
    page.innerHTML = \`
      <h2 class="section-title" style="color:${this._colors.inkDark};">${moduleName}</h2>
      <div class="card" style="background:${this._colors.bgCard};border:1px solid ${this._colors.border};border-radius:12px;">
        <div class="card-body" style="padding:16px;">
          <p style="color:${this._colors.textSecondary};font-size:13px;line-height:1.6;">
            ${detail.substring(0, 100).replace(/'/g, "\\'")}
          </p>
          <div style="margin-top:16px;display:flex;gap:8px;">
            <button class="btn btn-primary" onclick="${moduleName}.mainAction()" style="background:${this._colors.gold};color:${this._colors.inkDark};border:none;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer;">
              主要功能
            </button>
            <button class="btn btn-secondary" onclick="${moduleName}.saveData()" style="background:transparent;border:1px solid ${this._colors.gold};color:${this._colors.gold};border-radius:6px;padding:8px 16px;cursor:pointer;">
              保存数据
            </button>
          </div>
        </div>
      </div>
    \`;
  },

  /**
   * 主要功能入口
   * 由用户点击触发，实现核心逻辑
   */
  mainAction() {
    alert('${moduleName} 功能已触发！请在此方法中实现具体逻辑。');
    // TODO: 在此处实现具体功能逻辑
  },

  /**
   * 从localStorage加载持久化数据
   */
  loadData() {
    try {
      const saved = localStorage.getItem('${moduleId}_data');
      if (saved) this.data = JSON.parse(saved);
    } catch (e) {
      console.warn('[${moduleName}] 加载数据失败:', e);
    }
  },

  /**
   * 保存数据到localStorage
   */
  saveData() {
    try {
      localStorage.setItem('${moduleId}_data', JSON.stringify(this.data));
      console.log('[${moduleName}] 数据已保存');
    } catch (e) {
      console.error('[${moduleName}] 保存数据失败:', e);
    }
  }
};

// =========================================================
// 自动注册到App系统（如果App对象存在）
// =========================================================
if (typeof window !== 'undefined' && window.App) {
  window.App.mods = window.App.mods || {};
  window.App.mods['${moduleId}'] = ${moduleName};
  window.App.callbacks = window.App.callbacks || {};
  window.App.callbacks['${moduleId}'] = () => ${moduleName}.onEnter();
  console.log('[${moduleName}] 已自动注册到App系统');
}`;

      // 显示代码预览和选项按钮
      const preview = `⚙️ **「${moduleName}」模块预览**

\`\`\`javascript
${code}
\`\`\`

**模块信息：**
| 属性 | 值 |
|------|-----|
| 模块ID | ${moduleId} |
| 模块名称 | ${moduleName} |
| 版本 | 1.0.0 |

是否自动导入到系统？`;

      this._addSystemMessage(preview + '\n\n' + this._renderChoiceButtons([
        { id: 'feature_import', label: '✅ 是，导入并注册' },
        { id: 'feature_save', label: '💾 否，仅保存代码' },
        { id: 'feature_edit', label: '✏️ 我需要修改代码' }
      ], 'feature_confirm'));

      // 保存代码到临时存储
      localStorage.setItem('assistant_temp_module', code);

      this._waitingForChoice = true;
      this._choiceContext = 'feature_confirm';
      this._choiceCallback = async (confirm) => {
        const c = confirm.toLowerCase().trim();
        if (c === 'feature_import' || c === 'a' || c.includes('是') || c.includes('导入')) {
          await this._importFeatureModule(moduleName, moduleId, code);
        } else if (c === 'feature_save' || c === 'b' || c.includes('保存')) {
          this._addSystemMessage(`✅ 代码已保存到助手草稿箱。\n\n你可以在 localStorage 的 assistant_temp_module 中找到这段代码。`);
        } else {
          this._addSystemMessage('好的，请告诉我需要修改哪里，我会更新代码。');
        }
      };
    };
  },

  /**
   * 导入功能模块到系统
   * 流程：1) CodePatcher.createModule 2) localStorage保存 3) 执行代码注册全局 4) 注册到App.NAV_ITEMS
   * @param {string} moduleName - 模块名称
   * @param {string} moduleId - 模块ID
   * @param {string} code - 模块代码
   */
  async _importFeatureModule(moduleName, moduleId, code) {
    try {
      // 1. 通过CodePatcher创建模块（如果可用）
      if (typeof window !== 'undefined' && window.CodePatcher && window.CodePatcher.createModule) {
        window.CodePatcher.createModule(moduleId, code);
      }

      // 2. 保存到localStorage持久化
      const modules = JSON.parse(localStorage.getItem('assistant_modules') || '{}');
      modules[moduleId] = { name: moduleName, code, createdAt: Date.now() };
      localStorage.setItem('assistant_modules', JSON.stringify(modules));

      // 3. 动态执行代码，注册到全局作用域
      const script = document.createElement('script');
      script.textContent = code;
      document.head.appendChild(script);

      // 4. 注册到App导航和回调
      if (typeof window !== 'undefined' && window.App) {
        window.App.NAV_ITEMS = window.App.NAV_ITEMS || [];
        // 避免重复注册
        const exists = window.App.NAV_ITEMS.some(item => item.id === moduleId);
        if (!exists) {
          window.App.NAV_ITEMS.push({ id: moduleId, label: moduleName, icon: '⚙️' });
        }
        this._addSystemMessage(`✅ 模块「${moduleName}」已成功导入并注册到系统！\n\n请刷新页面以使用新功能。`);
      } else {
        this._addSystemMessage(`✅ 模块「${moduleName}」已保存！\n\n（App对象未加载，已保存到草稿箱，稍后手动注册即可）`);
      }
    } catch (e) {
      this._addSystemMessage(`❌ 导入失败：${e.message}\n\n代码已保存到草稿箱，你可以手动导入。`);
    }
  },

  // =========================================================
  // 功能实现：制作角色（NPC）
  // =========================================================

  /**
   * 制作新角色
   * 收集角色描述，解析为NPC数据结构，询问是否导入人物志
   * @param {string} text - 用户输入
   */
  async _makeCharacter(text) {
    this._addSystemMessage(`👤 开始制作新角色...

请描述角色信息（可以分条或一整段）：

**建议包含：**
- **名字**：角色姓名
- **年龄**：角色年龄
- **职业**：身份/职业
- **性格**：性格特征
- **背景**：背景故事
- **外貌**：外貌描述（用于AI生成立绘）
- **日程**（可选）：一天中的活动安排

请发送角色设定：`);

    this._waitingForChoice = true;
    this._choiceContext = 'character_detail';
    this._choiceCallback = async (detail) => {
      // 解析角色文本为结构化NPC数据
      const npc = this._parseCharacterInfo(detail);

      // 显示角色预览卡片
      const preview = `👤 **「${npc.name}」角色预览**

| 属性 | 内容 |
|------|------|
| 姓名 | ${npc.name} |
| 年龄 | ${npc.age || '未知'} |
| 职业 | ${npc.occupation || '未知'} |
| 性格 | ${npc.personality || '未知'} |

**背景故事：**
${npc.background ? npc.background.substring(0, 100) + (npc.background.length > 100 ? '...' : '') : '未提供'}

**日程安排：**
${npc.schedule ? Object.entries(npc.schedule).map(([k, v]) => `- ${k}: ${v}`).join('\n') : '未设置'}

是否自动导入到人物志？`;

      this._addSystemMessage(preview + '\n\n' + this._renderChoiceButtons([
        { id: 'char_import', label: '✅ 是，导入角色' },
        { id: 'char_edit', label: '✏️ 否，我再修改' },
        { id: 'char_portrait', label: '🎨 同时AI生成立绘描述词' }
      ], 'character_confirm'));

      this._waitingForChoice = true;
      this._choiceContext = 'character_confirm';
      this._choiceCallback = async (confirm) => {
        const c = confirm.toLowerCase().trim();
        if (c === 'char_import' || c === 'a' || c.includes('是') || c.includes('导入')) {
          if (typeof window !== 'undefined' && window.NPCManager && window.NPCManager.addNPC) {
            window.NPCManager.addNPC(npc);
            this._addSystemMessage(`✅ 角色「${npc.name}」已成功导入到人物志！\n\n你可以在「人物志」页面查看。`);
          } else {
            const npcs = JSON.parse(localStorage.getItem('assistant_npcs') || '[]');
            npcs.push(npc);
            localStorage.setItem('assistant_npcs', JSON.stringify(npcs));
            this._addSystemMessage(`✅ 角色「${npc.name}」已保存！\n\n（人物志管理器未加载，已保存到助手草稿箱）`);
          }
        } else if (c === 'char_edit' || c === 'b' || c.includes('修改')) {
          this._addSystemMessage('好的，请告诉我需要修改哪里。');
        } else if (c === 'char_portrait' || c === 'c' || c.includes('立绘')) {
          // 生成AI立绘提示词
          const prompt = this._generatePortraitPrompt(npc);
          npc.portraitPrompt = prompt;
          this._addSystemMessage(`🎨 **AI立绘提示词已生成：**\n\n\`\`\`\n${prompt}\n\`\`\`\n\n你可以使用这个提示词在AI绘图工具中生成立绘。\n\n是否现在导入角色？` +
            '\n\n' + this._renderChoiceButtons([
              { id: 'char_import_now', label: '✅ 导入角色' },
              { id: 'char_wait', label: '📝 先不导入' }
            ], 'character_final'));

          this._waitingForChoice = true;
          this._choiceContext = 'character_final';
          this._choiceCallback = (final) => {
            const fc = final.toLowerCase().trim();
            if (fc === 'char_import_now' || fc.includes('导入')) {
              if (typeof window !== 'undefined' && window.NPCManager && window.NPCManager.addNPC) {
                window.NPCManager.addNPC(npc);
                this._addSystemMessage(`✅ 角色「${npc.name}」已导入（含立绘提示词）！`);
              } else {
                const npcs = JSON.parse(localStorage.getItem('assistant_npcs') || '[]');
                npcs.push(npc);
                localStorage.setItem('assistant_npcs', JSON.stringify(npcs));
                this._addSystemMessage(`✅ 角色「${npc.name}」已保存（含立绘提示词）！`);
              }
            }
          };
        }
      };
    };
  },

  /**
   * 解析角色描述文本为结构化NPC对象
   * 通过关键词匹配提取：名字、年龄、职业、性格、背景
   * @param {string} text - 角色描述文本
   * @returns {Object} 解析后的NPC对象
   */
  _parseCharacterInfo(text) {
    const npc = {
      id: 'npc_' + Date.now(),
      name: '未命名',
      age: '',
      occupation: '',
      personality: '',
      background: '',
      portraitPrompt: '',
      schedule: {},
      createdAt: Date.now()
    };

    // 按行和标点分割文本进行解析
    const lines = text.split(/\n|，|。/);
    lines.forEach(line => {
      const lower = line.toLowerCase();
      if (lower.includes('名字') || lower.includes('姓名') || lower.includes('名为')) {
        npc.name = line.replace(/.*名字[：:]?\s*/, '').replace(/.*姓名[：:]?\s*/, '').replace(/.*名为\s*/, '').trim() || npc.name;
      }
      if (lower.includes('年龄') || lower.includes('岁')) {
        const match = line.match(/(\d+)/);
        if (match) npc.age = match[1];
      }
      if (lower.includes('职业') || lower.includes('身份') || lower.includes('是')) {
        npc.occupation = line.replace(/.*职业[：:]?\s*/, '').replace(/.*身份[：:]?\s*/, '').trim();
      }
      if (lower.includes('性格') || lower.includes('个性')) {
        npc.personality = line.replace(/.*性格[：:]?\s*/, '').replace(/.*个性[：:]?\s*/, '').trim();
      }
      if (lower.includes('背景') || lower.includes('故事') || lower.includes('经历')) {
        npc.background += line + '\n';
      }
    });

    // 如果没提取到名字，取第一行作为名字（截断10字符）
    if (npc.name === '未命名' && lines[0]) {
      npc.name = lines[0].substring(0, 10);
    }

    npc.background = npc.background.trim() || text;

    // 生成默认古风日程（如果用户没有提供）
    npc.schedule = {
      '子时': '寝宫休息',
      '辰时': '书房读书',
      '午时': '厅堂用膳',
      '申时': '庭院散步',
      '戌时': '月下抚琴'
    };

    return npc;
  },

  /**
   * 生成AI立绘提示词
   * 根据NPC信息组合古风风格的AI绘图提示词
   * @param {Object} npc - NPC对象
   * @returns {string} 立绘提示词
   */
  _generatePortraitPrompt(npc) {
    return `古风水墨风格人物立绘，${npc.name}，${npc.age || '青年'}岁，${npc.occupation || ''}，${npc.personality || '气质优雅'}，` +
           `身穿传统汉服，背景为山水庭院，暖色调，金色点缀，细腻笔触，高品质，8k分辨率，` +
           `ancient Chinese painting style, portrait, detailed, masterpiece`;
  },

  // =========================================================
  // 功能实现：制作APP（小手机App）
  // =========================================================

  /**
   * 制作小手机App
   * 收集App描述，生成完整App代码，询问是否导入虚拟App平台
   * @param {string} text - 用户输入
   */
  async _makeApp(text) {
    this._addSystemMessage(`📱 开始制作小手机App...

请描述App功能：

**建议包含：**
- App名称
- 主要功能
- 界面布局需求
- 需要的按钮/列表/表单等

例如："一个日记App，可以写每日心情、查看历史记录"

请描述你的App需求：`);

    this._waitingForChoice = true;
    this._choiceContext = 'app_detail';
    this._choiceCallback = async (detail) => {
      // 提取App名称
      const appName = detail.split(/[\s，。]/)[0].replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '') || 'CustomApp';
      const appId = 'app_' + appName.toLowerCase().replace(/[^a-z0-9]/g, '');

      // 生成App模块代码
      const code = `/**
 * =========================================================
 * ${appName} App
 * 由万能小助手v3自动生成
 * 用途：虚拟App平台（小手机）
 * =========================================================
 */
const ${appName} = {
  // App配置信息
  config: {
    id: '${appId}',
    name: '${appName}',
    version: '1.0.0',
    icon: '📱',
    description: '${detail.substring(0, 50).replace(/'/g, "\\'")}',
    color: '${this._colors.gold}'
  },

  // App内部数据
  data: {},

  /**
   * 初始化App
   */
  init() {
    this.loadData();
    console.log('[${appName}] App已初始化');
  },

  /**
   * 页面进入时触发
   */
  onEnter() {
    this.renderPage();
    this.loadData();
  },

  /**
   * 渲染App界面
   * 动态创建页面容器（如果不存在）
   */
  renderPage() {
    let page = document.getElementById('page-${appId}');
    if (!page) {
      const pagesContainer = document.getElementById('pages') || document.body;
      const newPage = document.createElement('div');
      newPage.id = 'page-${appId}';
      newPage.className = 'page';
      newPage.style.display = 'none';
      pagesContainer.appendChild(newPage);
      page = newPage;
    }

    page.innerHTML = \`
      <div class="app-header" style="padding:12px 16px;background:${this._colors.gold};color:${this._colors.inkDark};display:flex;align-items:center;gap:8px;">
        <span style="font-size:20px;">${appName}.config.icon</span>
        <span style="font-weight:600;font-size:16px;">${appName}</span>
      </div>
      <div class="app-body" style="padding:16px;background:${this._colors.parchment};">
        <div class="card" style="margin-bottom:12px;background:${this._colors.bgCard};border:1px solid ${this._colors.border};border-radius:8px;">
          <div class="card-body" style="padding:12px;">
            <p style="color:${this._colors.textSecondary};font-size:13px;line-height:1.6;">${detail.substring(0, 100).replace(/'/g, "\\'")}</p>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="${appName}.mainAction()" style="flex:1;background:${this._colors.gold};color:${this._colors.inkDark};border:none;border-radius:6px;padding:10px;font-weight:600;cursor:pointer;">
            主要功能
          </button>
        </div>
      </div>
    \`;
  },

  /**
   * App主要功能入口
   */
  mainAction() {
    alert('${appName} 功能已触发！请在此处实现具体逻辑。');
  },

  /**
   * 从localStorage加载数据
   */
  loadData() {
    try {
      const saved = localStorage.getItem('${appId}_data');
      if (saved) this.data = JSON.parse(saved);
    } catch (e) {
      console.warn('[${appName}] 加载数据失败:', e);
    }
  },

  /**
   * 保存数据到localStorage
   */
  saveData() {
    try {
      localStorage.setItem('${appId}_data', JSON.stringify(this.data));
    } catch (e) {
      console.error('[${appName}] 保存数据失败:', e);
    }
  }
};

// =========================================================
// 注册到虚拟App平台（如果存在）
// =========================================================
if (typeof window !== 'undefined' && window.MobilePreview && window.MobilePreview.apps) {
  window.MobilePreview.apps.push(${appName});
  console.log('[${appName}] 已注册到虚拟App平台');
}`;

      // 显示预览
      const preview = `📱 **「${appName}」App预览**

\`\`\`javascript
${code}
\`\`\`

**App信息：**
| 属性 | 值 |
|------|-----|
| App ID | ${appId} |
| 名称 | ${appName} |
| 图标 | 📱 |

是否自动导入到虚拟App平台？`;

      this._addSystemMessage(preview + '\n\n' + this._renderChoiceButtons([
        { id: 'app_import', label: '✅ 是，导入App' },
        { id: 'app_save', label: '💾 否，仅保存代码' },
        { id: 'app_edit', label: '✏️ 我需要修改' }
      ], 'app_confirm'));

      localStorage.setItem('assistant_temp_app', code);

      this._waitingForChoice = true;
      this._choiceContext = 'app_confirm';
      this._choiceCallback = async (confirm) => {
        const c = confirm.toLowerCase().trim();
        if (c === 'app_import' || c === 'a' || c.includes('是') || c.includes('导入')) {
          await this._importApp(appName, appId, code);
        } else if (c === 'app_save' || c === 'b' || c.includes('保存')) {
          this._addSystemMessage(`✅ App代码已保存到助手草稿箱。`);
        } else {
          this._addSystemMessage('好的，请告诉我需要修改哪里。');
        }
      };
    };
  },

  /**
   * 导入App到虚拟App平台
   * 流程：1) CodePatcher.createModule 2) localStorage保存 3) 执行代码 4) 添加到MobilePreview.apps
   * @param {string} appName - App名称
   * @param {string} appId - App ID
   * @param {string} code - App代码
   */
  async _importApp(appName, appId, code) {
    try {
      // 1. 创建模块
      if (typeof window !== 'undefined' && window.CodePatcher && window.CodePatcher.createModule) {
        window.CodePatcher.createModule(appId, code);
      }

      // 2. 保存到localStorage
      const apps = JSON.parse(localStorage.getItem('assistant_apps') || '{}');
      apps[appId] = { name: appName, code, createdAt: Date.now() };
      localStorage.setItem('assistant_apps', JSON.stringify(apps));

      // 3. 动态执行代码
      const script = document.createElement('script');
      script.textContent = code;
      document.head.appendChild(script);

      // 4. 添加到虚拟App平台
      if (typeof window !== 'undefined' && window.MobilePreview && window.MobilePreview.apps) {
        const appObj = window[appName];
        if (appObj) {
          window.MobilePreview.apps.push(appObj);
          this._addSystemMessage(`✅ App「${appName}」已成功导入到虚拟App平台！\n\n请刷新页面以在小手机页面看到新App。`);
        } else {
          this._addSystemMessage(`⚠️ App「${appName}」代码已执行，但未能自动注册。\n\n请手动添加到虚拟App平台。`);
        }
      } else {
        this._addSystemMessage(`✅ App「${appName}」已保存！\n\n（虚拟App平台未加载，已保存到草稿箱）`);
      }
    } catch (e) {
      this._addSystemMessage(`❌ 导入失败：${e.message}`);
    }
  },

  // =========================================================
  // 功能实现：修改代码
  // =========================================================

  /**
   * 修改代码功能
   * 收集修改需求，分析目标文件，生成diff预览，询问是否应用
   * @param {string} text - 用户输入
   */
  async _modifyCode(text) {
    this._addSystemMessage(`🔧 开始分析代码修改需求...

请描述你想要什么修改：

**示例：**
- "把导航栏改成竖排左侧侧边栏"
- "加一个夜间模式切换按钮"
- "修改卡片的圆角大小为12px"
- "在首页添加一个天气组件"

请描述具体修改需求：`);

    this._waitingForChoice = true;
    this._choiceContext = 'modify_detail';
    this._choiceCallback = async (detail) => {
      // 分析需要修改的目标文件
      const targetFiles = this._analyzeTargetFiles(detail);

      const analysis = `🔧 **修改分析**

**需求：** ${detail}

**目标文件：**
${targetFiles.map(f => `- ${f}`).join('\n')}

正在生成修改方案...`;

      this._addSystemMessage(analysis);

      // 生成模拟的diff预览
      const diffPreview = this._generateDiffPreview(detail, targetFiles);
      this._addSystemMessage(diffPreview + '\n\n' + this._renderChoiceButtons([
        { id: 'mod_apply', label: '✅ 是，应用修改' },
        { id: 'mod_adjust', label: '✏️ 否，我再调整' },
        { id: 'mod_cancel', label: '❌ 取消' }
      ], 'modify_confirm'));

      this._waitingForChoice = true;
      this._choiceContext = 'modify_confirm';
      this._choiceCallback = async (confirm) => {
        const c = confirm.toLowerCase().trim();
        if (c === 'mod_apply' || c === 'a' || c.includes('是') || c.includes('应用')) {
          if (typeof window !== 'undefined' && window.CodePatcher && window.CodePatcher.applyPatch) {
            const success = window.CodePatcher.applyPatch(diffPreview);
            if (success) {
              this._addSystemMessage(`✅ 修改已成功应用！\n\n修改内容已生效，请刷新页面查看效果。`);
            } else {
              this._addSystemMessage(`❌ 应用失败。\n\n请检查CodePatcher是否可用，或尝试手动修改。`);
            }
          } else {
            this._addSystemMessage(`⚠️ CodePatcher未加载，无法自动应用。\n\n以下是手动修改步骤：\n\n${diffPreview}\n\n请按照上述diff手动修改对应文件。`);
          }
        } else if (c === 'mod_adjust' || c === 'b' || c.includes('调整')) {
          this._addSystemMessage('好的，请告诉我需要调整哪里。');
        } else {
          this._addSystemMessage('已取消修改。');
        }
      };
    };
  },

  /**
   * 根据修改需求分析可能涉及的目标文件
   * @param {string} detail - 修改需求描述
   * @returns {Array<string>} 目标文件路径列表
   */
  _analyzeTargetFiles(detail) {
    const files = [];
    const lower = detail.toLowerCase();
    if (lower.includes('导航') || lower.includes('nav')) files.push('index.html', 'app.js');
    if (lower.includes('样式') || lower.includes('颜色') || lower.includes('css')) files.push('style.css', 'theme.css');
    if (lower.includes('卡片') || lower.includes('组件')) files.push('style.css', 'ui-components.css');
    if (lower.includes('功能') || lower.includes('按钮')) files.push('app.js');
    if (lower.includes('页面') || lower.includes('布局')) files.push('index.html', 'style.css');
    if (files.length === 0) files.push('app.js', 'style.css');
    return [...new Set(files)];
  },

  /**
   * 生成diff格式的修改预览
   * @param {string} detail - 修改需求
   * @param {Array<string>} files - 目标文件
   * @returns {string} diff预览文本
   */
  _generateDiffPreview(detail, files) {
    return `🔧 **修改预览（Diff）**

**变更文件：** ${files.join(', ')}

---

**变更前：**
\`\`\`
/* 原始代码 */
.navigation {
  display: flex;
  flex-direction: row;
}
\`\`\`

**变更后：**
\`\`\`
/* 修改后的代码 */
.navigation {
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: 200px;
}
\`\`\`

---

**说明：** 根据你的需求「${detail}」，建议修改以上代码。`;
  },

  // =========================================================
  // 功能实现：导入代码
  // =========================================================

  /**
   * 导入代码功能
   * 分析代码类型，询问用户确认，调用对应导入方法
   * @param {string} text - 用户粘贴的代码内容
   */
  async _importCode(text) {
    if (!text || text.length < 20) {
      this._addSystemMessage(`📥 导入代码功能

请粘贴代码内容，或点击附件按钮上传文件。

我会自动识别代码类型：
- **JS模块** → 导入为系统功能
- **App代码** → 导入到虚拟App平台
- **预设数据** → 导入到预设管理
- **角色数据** → 导入到人物志
- **CSS样式** → 应用到当前主题

请粘贴代码内容：`);
      return;
    }

    // 分析代码类型
    const type = this._detectCodeType(text);

    const analysis = `📥 **代码分析结果**

**检测到的类型：** ${type}

**代码预览（前200字符）：**
\`\`\`
${text.substring(0, 200)}${text.length > 200 ? '...' : ''}
\`\`\`

是否导入这段代码？`;

    this._addSystemMessage(analysis + '\n\n' + this._renderChoiceButtons([
      { id: 'imp_yes', label: '✅ 是，自动导入' },
      { id: 'imp_repaste', label: '📝 否，重新粘贴' },
      { id: 'imp_edit', label: '✏️ 我需要先修改代码' }
    ], 'import_confirm'));

    this._waitingForChoice = true;
    this._choiceContext = 'import_confirm';
    this._choiceCallback = async (confirm) => {
      const c = confirm.toLowerCase().trim();
      if (c === 'imp_yes' || c === 'a' || c.includes('是') || c.includes('导入')) {
        await this._importByType(type, text);
      } else if (c === 'imp_repaste' || c === 'b' || c.includes('重新')) {
        this._addSystemMessage('好的，请重新粘贴代码内容。');
      } else {
        this._addSystemMessage('你可以直接编辑代码后重新发送，我会再次分析。');
      }
    };
  },

  /**
   * 检测代码内容类型
   * @param {string} code - 代码内容
   * @returns {string} 检测到的代码类型
   */
  _detectCodeType(code) {
    const lower = code.toLowerCase();
    if (lower.includes('app') && lower.includes('renderpage')) return 'App模块';
    if (lower.includes('preset') || lower.includes('prompttemplate')) return '预设数据';
    if (lower.includes('npc') || lower.includes('character')) return '角色数据';
    if (lower.includes('css') || (lower.includes('style') && lower.includes('{'))) return 'CSS样式';
    if (lower.includes('init') && lower.includes('renderpage')) return 'JS功能模块';
    if (lower.includes('json') || code.trim().startsWith('{')) return 'JSON数据';
    return 'JS代码（通用）';
  },

  /**
   * 根据检测到的类型执行对应导入逻辑
   * @param {string} type - 代码类型
   * @param {string} code - 代码内容
   */
  async _importByType(type, code) {
    try {
      switch (type) {
        case 'App模块':
          this._addSystemMessage('📱 检测到App代码，正在导入到虚拟App平台...');
          await this._importApp('ImportedApp', 'app_imported_' + Date.now(), code);
          break;
        case '预设数据':
          this._addSystemMessage('📋 检测到预设数据，正在导入到预设管理...');
          if (typeof window !== 'undefined' && window.PresetManager && window.PresetManager.addPreset) {
            const preset = JSON.parse(code);
            window.PresetManager.addPreset(preset);
            this._addSystemMessage('✅ 预设已导入！');
          } else {
            localStorage.setItem('assistant_imported_preset', code);
            this._addSystemMessage('✅ 预设已保存到草稿箱！');
          }
          break;
        case '角色数据':
          this._addSystemMessage('👤 检测到角色数据，正在导入到人物志...');
          if (typeof window !== 'undefined' && window.NPCManager && window.NPCManager.addNPC) {
            const npc = JSON.parse(code);
            window.NPCManager.addNPC(npc);
            this._addSystemMessage('✅ 角色已导入！');
          } else {
            localStorage.setItem('assistant_imported_npc', code);
            this._addSystemMessage('✅ 角色已保存到草稿箱！');
          }
          break;
        case 'CSS样式':
          this._addSystemMessage('🎨 检测到CSS样式，正在应用...');
          const style = document.createElement('style');
          style.textContent = code;
          document.head.appendChild(style);
          this._addSystemMessage('✅ CSS样式已应用到当前页面！');
          break;
        default:
          this._addSystemMessage('⚙️ 检测到JS模块，正在注册...');
          const script = document.createElement('script');
          script.textContent = code;
          document.head.appendChild(script);
          this._addSystemMessage('✅ JS模块已加载到页面！');
      }
    } catch (e) {
      this._addSystemMessage(`❌ 导入失败：${e.message}\n\n请检查代码格式是否正确。`);
    }
  },

  // =========================================================
  // 文件上传处理
  // =========================================================

  /**
   * 切换文件拖放区的显示/隐藏
   */
  toggleDropZone() {
    const dropZone = document.getElementById('assistantDropZone');
    if (!dropZone) return;
    dropZone.style.display = dropZone.style.display === 'none' ? 'block' : 'none';
  },

  /**
   * 处理文件上传
   * 读取文件文本内容后作为代码导入处理
   * @param {File} file - 上传的文件对象
   */
  async handleFileUpload(file) {
    if (!file) return;

    this._addSystemMessage(`📎 正在读取文件：${file.name} (${(file.size / 1024).toFixed(1)}KB)`);

    try {
      const text = await file.text();
      this._addSystemMessage(`✅ 文件读取完成！正在分析内容...`);
      // 将文件内容作为用户消息记录
      this._chatHistory.push({ role: 'user', content: `【上传文件：${file.name}】\n\n${text.substring(0, 500)}${text.length > 500 ? '...' : ''}`, time: Date.now() });
      this.renderChat();
      // 触发导入分析
      await this._importCode(text);
    } catch (e) {
      this._addSystemMessage(`❌ 文件读取失败：${e.message}`);
    }

    // 隐藏拖放区
    const dropZone = document.getElementById('assistantDropZone');
    if (dropZone) dropZone.style.display = 'none';
  }
};

// =========================================================
// 全局拖拽事件监听（文件拖放上传）
// =========================================================

document.addEventListener('dragover', (e) => {
  const chat = document.getElementById('assistantChat');
  if (chat && chat.contains(e.target)) {
    e.preventDefault();
  }
});

document.addEventListener('drop', (e) => {
  const chat = document.getElementById('assistantChat');
  if (chat && chat.contains(e.target)) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      Assistant.handleFileUpload(files[0]);
    }
  }
});