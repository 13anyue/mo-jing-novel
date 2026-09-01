/**
 * =========================================================
 * RegexEngine v7 — 专业文本处理工具
 * 功能：正则模板库 / 八股文处理 / 可视化测试 / 批量规则链 / 导入导出
 * 存储键：regex_engine_v16
 * 配色：古风墨境（暖羊皮纸底色 + 金色 + 墨色）
 * =========================================================
 */

const RegexEngine = {
  /* ---------- 常量配置 ---------- */
  STORAGE_KEY: 'regex_engine_v16',

  /** 应用场景标签 */
  TAGS: ['去重', '去格式', '提取', '替换', '清洗'],

  /** 内置八股文快捷规则（作为功能入口，不自动加入用户模板库） */
  BAGU_PRESETS: [
    { name: '去除重复段落', tag: '去重', description: '检测相似度>80%的重复段落并去重' },
    { name: '去除空行与多余空格', tag: '去格式', description: '清除连续空行及首尾多余空格' },
    { name: '去除特殊符号与乱码', tag: '清洗', description: '过滤常见乱码及无意义特殊符号' },
    { name: '全角标点转半角', tag: '去格式', description: '将中文全角标点统一为半角' },
    { name: '半角标点转全角', tag: '去格式', description: '将半角标点统一为中文全角' }
  ],

  /** 当前界面状态缓存 */
  state: {
    sidebarCollapsed: false,
    editorRule: null,      // 当前编辑中的规则
    testInput: '',         // 测试区输入文本
    testOutput: '',        // 测试区输出文本
    chainResult: ''        // 规则链执行结果
  },

  /* ---------- 生命周期 ---------- */

  /** 初始化：由外部路由调用，渲染完整页面 */
  init() {
    this.renderPage();
  },

  /** 进入页面时刷新列表 */
  onEnter() {
    this.renderSidebar();
    this.renderChainPanel();
  },

  /* ---------- 数据持久化 ---------- */

  /** 读取完整数据对象 */
  getData() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return { rules: [], version: 2, updatedAt: Date.now() };
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.rules)) parsed.rules = [];
      return parsed;
    } catch (e) {
      return { rules: [], version: 2, updatedAt: Date.now() };
    }
  },

  /** 保存完整数据对象 */
  saveData(data) {
    data.updatedAt = Date.now();
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  },

  /** 获取规则列表（零预设，初始为空数组） */
  getRules() {
    return this.getData().rules;
  },

  /** 保存规则列表 */
  saveRules(rules) {
    const data = this.getData();
    data.rules = rules;
    this.saveData(data);
  },

  /* ---------- 规则 CRUD ---------- */

  /**
   * 创建新规则
   * @param {Object} rule - { name, pattern, replacement, description, tag, flags }
   * @returns {Object} 创建后的规则对象（含自动生成的 id 与 enabled）
   */
  createRule(rule) {
    const rules = this.getRules();
    const newRule = {
      id: 'rule_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      name: rule.name || '未命名规则',
      pattern: rule.pattern || '',
      replacement: rule.replacement || '',
      description: rule.description || '',
      tag: rule.tag || '替换',
      flags: rule.flags || 'g',
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    rules.push(newRule);
    this.saveRules(rules);
    return newRule;
  },

  /**
   * 更新规则
   * @param {string} id - 规则 ID
   * @param {Object} updates - 需要更新的字段
   */
  updateRule(id, updates) {
    const rules = this.getRules();
    const idx = rules.findIndex(r => r.id === id);
    if (idx === -1) return false;
    rules[idx] = { ...rules[idx], ...updates, updatedAt: Date.now() };
    this.saveRules(rules);
    return true;
  },

  /** 删除规则 */
  deleteRule(id) {
    if (!confirm('确定要删除这条规则吗？')) return;
    const rules = this.getRules().filter(r => r.id !== id);
    this.saveRules(rules);
    this.renderSidebar();
    this.renderChainPanel();
    this.toast('规则已删除', 'success');
  },

  /** 切换规则启用状态 */
  toggleRule(id) {
    const rules = this.getRules();
    const r = rules.find(x => x.id === id);
    if (!r) return;
    r.enabled = !r.enabled;
    this.saveRules(rules);
    this.renderSidebar();
    this.renderChainPanel();
  },

  /** 规则上移 */
  moveUp(id) {
    const rules = this.getRules();
    const idx = rules.findIndex(r => r.id === id);
    if (idx <= 0) return;
    [rules[idx - 1], rules[idx]] = [rules[idx], rules[idx - 1]];
    this.saveRules(rules);
    this.renderSidebar();
    this.renderChainPanel();
  },

  /** 规则下移 */
  moveDown(id) {
    const rules = this.getRules();
    const idx = rules.findIndex(r => r.id === id);
    if (idx === -1 || idx >= rules.length - 1) return;
    [rules[idx], rules[idx + 1]] = [rules[idx + 1], rules[idx]];
    this.saveRules(rules);
    this.renderSidebar();
    this.renderChainPanel();
  },

  /* ---------- 八股文处理专项 ---------- */

  /**
   * 去除重复段落：基于字符集合的 Jaccard 相似度
   * @param {string} text - 原始文本
   * @param {number} threshold - 相似度阈值（默认 0.8）
   * @returns {string} 去重后的文本
   */
  removeDuplicateParagraphs(text, threshold = 0.8) {
    const paragraphs = text.split(/\n{2,}/);
    const kept = [];
    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;
      let isDuplicate = false;
      for (const keptPara of kept) {
        if (this.similarity(trimmed, keptPara) >= threshold) {
          isDuplicate = true;
          break;
        }
      }
      if (!isDuplicate) kept.push(trimmed);
    }
    return kept.join('\n\n');
  },

  /** 去除空行与首尾多余空格 */
  removeEmptyLines(text) {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  },

  /** 去除特殊符号与乱码：保留中英文数字及常用标点 */
  removeSpecialChars(text) {
    // 保留汉字、英文、数字、常用中文标点、空格与换行
    return text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s\n\u3000-\u303F\uFF00-\uFFEF\u2000-\u206F]/g, '');
  },

  /** 全角标点转半角 */
  fullWidthToHalf(text) {
    const map = {
      '，': ',', '。': '.', '！': '!', '？': '?', '；': ';', '：': ':',
      '“': '"', '”': '"', '‘': "'", '’': "'", '（': '(', '）': ')',
      '【': '[', '】': ']', '《': '<', '》': '>', '、': ',', '—': '-',
      '…': '...', '～': '~', '　': ' '
    };
    return text.replace(/[，。！？；：“”‘’（）【】《》、—…～　]/g, ch => map[ch] || ch);
  },

  /** 半角标点转全角 */
  halfWidthToFull(text) {
    const map = {
      ',': '，', '.': '。', '!': '！', '?': '？', ';': '；', ':': '：',
      '"': '”', "'": '’', '(': '（', ')': '）', '[': '【', ']': '】',
      '<': '《', '>': '》'
    };
    return text.replace(/[,\.!?;:"'()\[\]<>]/g, ch => map[ch] || ch);
  },

  /** 统一标点：根据参数决定方向 */
  normalizePunctuation(text, toHalf = true) {
    return toHalf ? this.fullWidthToHalf(text) : this.halfWidthToFull(text);
  },

  /* ---------- 字符串相似度算法 ---------- */

  /**
   * 计算两段文本的 Jaccard 字符相似度
   * @param {string} a
   * @param {string} b
   * @returns {number} 0 ~ 1
   */
  similarity(a, b) {
    if (a === b) return 1;
    if (!a || !b) return 0;
    const setA = new Set(a.split(''));
    const setB = new Set(b.split(''));
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  },

  /* ---------- 可视化测试工具 ---------- */

  /**
   * 测试正则：执行匹配与替换，返回结果对象
   * @param {string} text - 输入文本
   * @param {string} pattern - 正则表达式字符串
   * @param {string} flags - 标志位字符串（如 'gi'）
   * @param {string} replacement - 替换文本
   * @returns {Object} { success, error, matches, output, matchCount, replaceCount, charDiff, highlighted }
   */
  testRegex(text, pattern, flags, replacement) {
    let regex;
    try {
      regex = new RegExp(pattern, flags || 'g');
    } catch (e) {
      return { success: false, error: e.message };
    }
    const matches = [];
    let match;
    const cloned = new RegExp(regex.source, regex.flags);
    while ((match = cloned.exec(text)) !== null) {
      matches.push({ text: match[0], index: match.index, groups: match.slice(1) });
      if (cloned.lastIndex === match.index) cloned.lastIndex++; // 防止零宽死循环
    }
    const output = text.replace(regex, replacement || '');
    const matchCount = matches.length;
    const replaceCount = matchCount;
    const charDiff = text.length - output.length;
    const highlighted = this.highlightMatches(text, matches);
    return {
      success: true,
      matches,
      output,
      matchCount,
      replaceCount,
      charDiff,
      highlighted
    };
  },

  /**
   * 高亮匹配文本：将匹配部分用 span 包裹为金色高亮
   * @param {string} text - 原文本
   * @param {Array} matches - 匹配对象数组
   * @returns {string} HTML 字符串
   */
  highlightMatches(text, matches) {
    if (!matches || matches.length === 0) return this.escapeHtml(text);
    let html = '';
    let lastIndex = 0;
    for (const m of matches) {
      if (m.index < lastIndex) continue; // 重叠时跳过
      html += this.escapeHtml(text.slice(lastIndex, m.index));
      html += `<span style="background:#C9A227;color:#2C1810;padding:1px 2px;border-radius:2px;font-weight:bold;">${this.escapeHtml(m.text)}</span>`;
      lastIndex = m.index + m.text.length;
    }
    html += this.escapeHtml(text.slice(lastIndex));
    return html;
  },

  /* ---------- 批量处理 / 规则链 ---------- */

  /**
   * 使用指定规则链处理文本
   * @param {string} text - 原始文本
   * @param {Array} chain - 规则对象数组
   * @returns {Object} { output, logs, stats }
   */
  processWithChain(text, chain) {
    let output = text;
    const logs = [];
    let totalMatches = 0;
    let totalReplacements = 0;
    for (const rule of chain) {
      if (!rule.enabled || !rule.pattern) continue;
      let regex;
      try {
        regex = new RegExp(rule.pattern, rule.flags || 'g');
      } catch (e) {
        logs.push(`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> [${rule.name}] 正则语法错误: ${e.message}`);
        continue;
      }
      const before = output;
      const matches = output.match(regex);
      const count = matches ? matches.length : 0;
      if (count === 0) {
        logs.push(`➖ [${rule.name}] 未匹配`);
        continue;
      }
      output = output.replace(regex, rule.replacement || '');
      totalMatches += count;
      totalReplacements += count;
      const diff = before.length - output.length;
      logs.push(`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> [${rule.name}] 匹配 ${count} 处，字符变化 ${diff >= 0 ? '-' : '+'}${Math.abs(diff)}`);
    }
    return {
      output,
      logs,
      stats: {
        originalLength: text.length,
        outputLength: output.length,
        totalMatches,
        totalReplacements,
        charDiff: text.length - output.length
      }
    };
  },

  /**
   * 执行当前启用的规则链（按列表顺序）
   * @param {string} text - 原始文本
   * @returns {Object} processWithChain 的返回结果
   */
  executeChain(text) {
    const rules = this.getRules().filter(r => r.enabled);
    return this.processWithChain(text, rules);
  },

  /* ---------- AI 生成正则（框架入口） ---------- */

  /**
   * 根据用户描述生成正则表达式（需后端或大模型支持）
   * 当前版本提供前端框架：将描述记录并提示用户确认结果
   * @param {string} description - 用户描述
   */
  generateRegexByAI(description) {
    if (!description || !description.trim()) {
      this.toast('请输入描述内容', 'error');
      return;
    }
    // 简单启发式生成示例（实际场景应调用 AI API）
    let pattern = '';
    let replacement = '';
    const desc = description.toLowerCase();
    if (desc.includes('手机号')) {
      pattern = '1[3-9]\\d{9}';
      replacement = '[手机号]';
    } else if (desc.includes('邮箱') || desc.includes('邮件')) {
      pattern = '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}';
      replacement = '[邮箱]';
    } else if (desc.includes('url') || desc.includes('链接')) {
      pattern = 'https?://[^\\s]+';
      replacement = '[链接]';
    } else if (desc.includes('空格') || desc.includes('空白')) {
      pattern = '\\s+';
      replacement = ' ';
    } else if (desc.includes('数字')) {
      pattern = '\\d+';
      replacement = '[数字]';
    } else {
      pattern = '请根据描述手动编写正则';
    }
    this.state.aiGenerated = { description, pattern, replacement };
    this.renderAIGenResult();
  },

  /* ---------- 导入 / 导出 ---------- */

  /** 导出规则为 JSON 字符串 */
  exportRules() {
    const rules = this.getRules();
    const blob = JSON.stringify(rules, null, 2);
    this.downloadFile(blob, `regex_rules_${Date.now()}.json`, 'application/json');
    this.toast('规则已导出为 JSON', 'success');
  },

  /** 导入规则 JSON */
  importRules(jsonString) {
    let imported;
    try {
      imported = JSON.parse(jsonString);
    } catch (e) {
      this.toast('JSON 格式错误，导入失败', 'error');
      return false;
    }
    if (!Array.isArray(imported)) {
      this.toast('导入内容应为规则数组', 'error');
      return false;
    }
    const current = this.getRules();
    let added = 0;
    for (const item of imported) {
      if (item && item.pattern) {
        const rule = {
          id: 'rule_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7) + '_' + added,
          name: item.name || '导入规则',
          pattern: item.pattern,
          replacement: item.replacement || '',
          description: item.description || '',
          tag: item.tag || '替换',
          flags: item.flags || 'g',
          enabled: item.enabled !== false,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        current.push(rule);
        added++;
      }
    }
    this.saveRules(current);
    this.renderSidebar();
    this.renderChainPanel();
    this.toast(`成功导入 ${added} 条规则`, 'success');
    return true;
  },

  /** 导出处理后的文本为 txt */
  exportText(text, filename = 'processed_text.txt') {
    this.downloadFile(text, filename, 'text/plain');
    this.toast('文本已导出', 'success');
  },

  /* ---------- 工具方法 ---------- */

  /** HTML 转义，防止 XSS */
  escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /** 复制文本到剪贴板 */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.toast('已复制到剪贴板', 'success');
    } catch (e) {
      // 降级方案
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.toast('已复制到剪贴板', 'success');
    }
  },

  /** 触发浏览器文件下载 */
  downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /** 轻量 Toast（兼容无 App 环境） */
  toast(message, type = 'info') {
    if (typeof App !== 'undefined' && App.toast) {
      App.toast(message, type);
      return;
    }
    // 自建简易 Toast
    let container = document.getElementById('regex-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'regex-toast-container';
      container.style.cssText = 'position:fixed;top:16px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
      document.body.appendChild(container);
    }
    const el = document.createElement('div');
    const colors = {
      success: { bg: '#C9A227', color: '#2C1810' },
      error: { bg: '#8B0000', color: '#F5E6D3' },
      info: { bg: '#2C1810', color: '#F5E6D3' }
    };
    const c = colors[type] || colors.info;
    el.style.cssText = `background:${c.bg};color:${c.color};padding:10px 16px;border-radius:4px;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,0.2);transition:opacity 0.3s;`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 2500);
  },

  /* ---------- 界面渲染：主页面 ---------- */

  /** 渲染整页结构 */
  renderPage() {
    const page = document.getElementById('page-regex');
    if (!page) { console.warn('[v7] 元素 #page-regex 未找到'); }
    if (!page) return;
    page.innerHTML = `
      <div id="regex-page" style="display:flex;flex-direction:column;height:100%;background:#F5E6D3;color:#2C1810;font-family:'Noto Serif SC','Microsoft YaHei',serif;">
        <!-- 顶部工具栏 -->
        <div id="regex-toolbar" style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid #C9A227;background:#F5E6D3;flex-shrink:0;flex-wrap:wrap;">
          <button class="ez-btn btn btn-primary" onclick="RegexEngine.openEditor()" style="background:#C9A227;color:#2C1810;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-weight:bold;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 新建规则</button>
          <button class="ez-btn btn btn-secondary" onclick="RegexEngine.openAIGenModal()" style="background:#2C1810;color:#F5E6D3;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg> AI生成规则</button>
          <button class="ez-btn btn btn-secondary" onclick="RegexEngine.triggerImport()" style="background:#8B7355;color:#F5E6D3;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> 导入规则</button>
          <button class="ez-btn btn btn-secondary" onclick="RegexEngine.exportRules()" style="background:#8B7355;color:#F5E6D3;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> 导出规则</button>
          <div style="margin-left:auto;display:flex;align-items:center;gap:8px;">
            <span style="font-size:13px;color:#8B7355;">八股文处理：</span>
            <select onchange="RegexEngine.runBaguProcess(this.value);this.value='';" style="background:#F5E6D3;color:#2C1810;border:1px solid #C9A227;border-radius:4px;padding:4px 8px;font-size:13px;">
              <option value="">选择快捷处理…</option>
              <option value="dedup">去除重复段落</option>
              <option value="trim">去除空行与空格</option>
              <option value="clean">去除特殊符号</option>
              <option value="half">全角转半角</option>
              <option value="full">半角转全角</option>
            </select>
          </div>
        </div>
        <!-- 主体区域：侧边栏 + 三栏主区 -->
        <div style="display:flex;flex:1;overflow:hidden;">
          <!-- 左侧边栏：规则列表 -->
          <div id="regex-sidebar" style="width:260px;flex-shrink:0;border-right:1px solid #C9A227;background:#F5E6D3;overflow-y:auto;transition:width 0.3s;">
            <div style="padding:10px 12px;border-bottom:1px solid #C9A227;display:flex;justify-content:space-between;align-items:center;">
              <strong style="font-size:14px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> 规则列表</strong>
              <button onclick="RegexEngine.toggleSidebar()" style="background:none;border:none;cursor:pointer;color:#2C1810;font-size:16px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></button>
            </div>
            <div id="regex-rule-list" style="padding:8px;"></div>
          </div>
          <!-- 主区域：三栏布局 -->
          <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;">
            <div style="flex:1;display:flex;overflow:hidden;">
              <!-- 输入区 -->
              <div style="flex:1;display:flex;flex-direction:column;border-right:1px solid #C9A227;min-width:220px;">
                <div style="padding:8px 12px;border-bottom:1px solid #C9A227;font-weight:bold;font-size:14px;background:#F5E6D3;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> 输入文本</div>
                <textarea id="rx-input" placeholder="在此粘贴大段文本…" oninput="RegexEngine.onTestInput()"
                  style="flex:1;border:none;resize:none;padding:12px;background:#F5E6D3;color:#2C1810;font-size:14px;line-height:1.7;outline:none;"></textarea>
              </div>
              <!-- 正则设置区 -->
              <div style="width:280px;flex-shrink:0;display:flex;flex-direction:column;border-right:1px solid #C9A227;background:#F5E6D3;">
                <div style="padding:8px 12px;border-bottom:1px solid #C9A227;font-weight:bold;font-size:14px;">⚙️ 正则设置</div>
                <div style="padding:12px;overflow-y:auto;">
                  <div style="margin-bottom:12px;">
                    <label style="display:block;font-size:12px;color:#8B7355;margin-bottom:4px;">正则表达式</label>
                    <input id="rx-pattern" type="text" placeholder="如：\\d+ 或 你好|嗨" oninput="RegexEngine.onTestInput()"
                      style="width:100%;padding:6px 8px;border:1px solid #C9A227;border-radius:4px;background:#F5E6D3;color:#2C1810;font-size:13px;outline:none;box-sizing:border-box;">
                  </div>
                  <div style="margin-bottom:12px;">
                    <label style="display:block;font-size:12px;color:#8B7355;margin-bottom:4px;">替换为</label>
                    <input id="rx-replacement" type="text" placeholder="留空表示删除匹配内容" oninput="RegexEngine.onTestInput()"
                      style="width:100%;padding:6px 8px;border:1px solid #C9A227;border-radius:4px;background:#F5E6D3;color:#2C1810;font-size:13px;outline:none;box-sizing:border-box;">
                  </div>
                  <div style="margin-bottom:12px;">
                    <label style="display:block;font-size:12px;color:#8B7355;margin-bottom:4px;">标志位</label>
                    <div style="display:flex;gap:12px;font-size:13px;">
                      <label style="cursor:pointer;"><input type="checkbox" id="rx-flag-g" checked onchange="RegexEngine.onTestInput()"> 全局(g)</label>
                      <label style="cursor:pointer;"><input type="checkbox" id="rx-flag-i" onchange="RegexEngine.onTestInput()"> 忽略大小写(i)</label>
                      <label style="cursor:pointer;"><input type="checkbox" id="rx-flag-m" onchange="RegexEngine.onTestInput()"> 多行(m)</label>
                    </div>
                  </div>
                  <div style="margin-bottom:12px;">
                    <label style="display:block;font-size:12px;color:#8B7355;margin-bottom:4px;">实时高亮预览</label>
                    <div id="rx-preview" style="width:100%;min-height:60px;max-height:200px;overflow-y:auto;padding:8px;border:1px solid #C9A227;border-radius:4px;background:#2C1810;color:#F5E6D3;font-size:13px;line-height:1.6;box-sizing:border-box;"></div>
                  </div>
                  <div style="font-size:12px;color:#8B7355;line-height:1.6;">
                    提示：<br>• 使用 <code style="background:#E8D5B5;padding:1px 3px;border-radius:2px;">()</code> 捕获分组<br>• <code style="background:#E8D5B5;padding:1px 3px;border-radius:2px;">$1</code> 表示第一个捕获内容
                  </div>
                </div>
              </div>
              <!-- 输出区 -->
              <div style="flex:1;display:flex;flex-direction:column;min-width:220px;">
                <div style="padding:8px 12px;border-bottom:1px solid #C9A227;font-weight:bold;font-size:14px;background:#F5E6D3;display:flex;justify-content:space-between;align-items:center;">
                  <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> 处理结果</span>
                  <div style="display:flex;gap:6px;">
                    <button onclick="RegexEngine.copyOutput()" style="font-size:12px;background:#C9A227;color:#2C1810;border:none;padding:3px 8px;border-radius:3px;cursor:pointer;">复制</button>
                    <button onclick="RegexEngine.exportOutput()" style="font-size:12px;background:#8B7355;color:#F5E6D3;border:none;padding:3px 8px;border-radius:3px;cursor:pointer;">导出txt</button>
                  </div>
                </div>
                <textarea id="rx-output" readonly placeholder="处理后的文本将显示在这里…"
                  style="flex:1;border:none;resize:none;padding:12px;background:#F5E6D3;color:#2C1810;font-size:14px;line-height:1.7;outline:none;"></textarea>
                <!-- 统计信息 -->
                <div id="rx-stats" style="padding:8px 12px;border-top:1px solid #C9A227;font-size:12px;color:#8B7355;background:#F5E6D3;display:none;">
                  匹配次数：<strong id="stat-matches" style="color:#C9A227;">0</strong> &nbsp;|&nbsp;
                  替换数量：<strong id="stat-replaces" style="color:#C9A227;">0</strong> &nbsp;|&nbsp;
                  字符变化：<strong id="stat-diff" style="color:#C9A227;">0</strong>
                </div>
              </div>
            </div>
            <!-- 底部规则链面板 -->
            <div id="regex-chain-panel" style="flex-shrink:0;max-height:160px;overflow-y:auto;border-top:1px solid #C9A227;background:#F5E6D3;padding:10px 14px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <strong style="font-size:14px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> 规则链（按顺序执行）</strong>
                <button onclick="RegexEngine.runChain()" style="background:#C9A227;color:#2C1810;border:none;padding:5px 12px;border-radius:4px;cursor:pointer;font-weight:bold;font-size:13px;">▶ 一键执行规则链</button>
              </div>
              <div id="regex-chain-list" style="font-size:13px;"></div>
            </div>
          </div>
        </div>
      </div>
      <!-- 模态框：规则编辑器 -->
      <div class="modal-overlay" id="regexEditorModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;align-items:center;justify-content:center;">
        <div style="background:#F5E6D3;border:1px solid #C9A227;border-radius:6px;width:520px;max-width:90vw;max-height:90vh;overflow-y:auto;box-shadow:0 4px 16px rgba(0,0,0,0.3);">
          <div style="padding:12px 16px;border-bottom:1px solid #C9A227;display:flex;justify-content:space-between;align-items:center;">
            <h3 id="regexEditorTitle" style="margin:0;font-size:16px;color:#2C1810;">规则编辑器</h3>
            <button onclick="RegexEngine.closeModal('regexEditorModal')" style="background:none;border:none;cursor:pointer;font-size:18px;color:#2C1810;">✕</button>
          </div>
          <div id="regexEditorBody" style="padding:16px;"></div>
          <div style="padding:12px 16px;border-top:1px solid #C9A227;display:flex;justify-content:flex-end;gap:8px;">
            <button onclick="RegexEngine.closeModal('regexEditorModal')" style="background:#8B7355;color:#F5E6D3;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;">取消</button>
            <button onclick="RegexEngine.saveEditor()" style="background:#C9A227;color:#2C1810;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-weight:bold;">保存</button>
          </div>
        </div>
      </div>
      <!-- 模态框：AI 生成正则 -->
      <div class="modal-overlay" id="regexAIGenModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;align-items:center;justify-content:center;">
        <div style="background:#F5E6D3;border:1px solid #C9A227;border-radius:6px;width:480px;max-width:90vw;box-shadow:0 4px 16px rgba(0,0,0,0.3);">
          <div style="padding:12px 16px;border-bottom:1px solid #C9A227;display:flex;justify-content:space-between;align-items:center;">
            <h3 style="margin:0;font-size:16px;color:#2C1810;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg> AI 生成正则</h3>
            <button onclick="RegexEngine.closeModal('regexAIGenModal')" style="background:none;border:none;cursor:pointer;font-size:18px;color:#2C1810;">✕</button>
          </div>
          <div style="padding:16px;">
            <p style="font-size:13px;color:#8B7355;margin-top:0;">描述你想匹配/替换的文本模式，例如"提取所有手机号"、"去掉多余空格"。</p>
            <textarea id="ai-gen-desc" rows="3" placeholder="描述你的需求…" style="width:100%;padding:8px;border:1px solid #C9A227;border-radius:4px;background:#F5E6D3;color:#2C1810;resize:vertical;box-sizing:border-box;outline:none;"></textarea>
            <button onclick="RegexEngine.generateRegexByAI(document.getElementById('ai-gen-desc').value)" style="margin-top:10px;background:#2C1810;color:#F5E6D3;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;">生成</button>
            <div id="ai-gen-result" style="margin-top:12px;"></div>
          </div>
        </div>
      </div>
      <!-- 隐藏的文件导入输入 -->
      <input type="file" id="regex-import-file" accept=".json" style="display:none;" onchange="RegexEngine.onImportFile(this)">
    `;
    this.renderSidebar();
    this.renderChainPanel();
  },

  /* ---------- 界面渲染：侧边栏 ---------- */

  /** 渲染规则列表到侧边栏 */
  renderSidebar() {
    const container = document.getElementById('regex-rule-list');
    if (!container) { console.warn('[v7] 元素 #regex-rule-list 未找到'); }
    if (!container) return;
    const rules = this.getRules();
    if (rules.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:20px;color:#8B7355;font-size:13px;">
          <div style="font-size:28px;margin-bottom:6px;">📭</div>
          <p style="margin:0;">暂无规则</p>
          <p style="margin:4px 0 0;font-size:12px;">点击上方「新建规则」开始</p>
        </div>`;
      return;
    }
    container.innerHTML = rules.map((r, idx) => {
      const tagColor = this.getTagColor(r.tag);
      return `
        <div style="background:#2C1810;color:#F5E6D3;border-radius:4px;padding:8px 10px;margin-bottom:8px;font-size:13px;position:relative;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <div style="display:flex;align-items:center;gap:6px;flex:1;min-width:0;">
              <input type="checkbox" ${r.enabled ? 'checked' : ''} onchange="RegexEngine.toggleRule('${r.id}')" style="cursor:pointer;flex-shrink:0;">
              <strong style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px;" title="${this.escapeHtml(r.name)}">${this.escapeHtml(r.name)}</strong>
              <span style="background:${tagColor};color:#2C1810;font-size:11px;padding:1px 5px;border-radius:3px;flex-shrink:0;">${this.escapeHtml(r.tag || '替换')}</span>
            </div>
            <div style="display:flex;gap:3px;flex-shrink:0;">
              <button onclick="RegexEngine.moveUp('${r.id}')" ${idx === 0 ? 'disabled' : ''} style="background:none;border:none;cursor:pointer;color:#C9A227;font-size:14px;padding:2px;opacity:${idx === 0 ? '0.3' : '1'};">↑</button>
              <button onclick="RegexEngine.moveDown('${r.id}')" ${idx === rules.length - 1 ? 'disabled' : ''} style="background:none;border:none;cursor:pointer;color:#C9A227;font-size:14px;padding:2px;opacity:${idx === rules.length - 1 ? '0.3' : '1'};">↓</button>
              <button onclick="RegexEngine.openEditor('${r.id}')" style="background:none;border:none;cursor:pointer;color:#C9A227;font-size:14px;padding:2px;">✏️</button>
              <button onclick="RegexEngine.deleteRule('${r.id}')" style="background:none;border:none;cursor:pointer;color:#8B0000;font-size:14px;padding:2px;">🗑️</button>
            </div>
          </div>
          <div style="font-size:11px;color:#E8D5B5;opacity:0.9;line-height:1.5;">
            <span>模式：</span><code style="background:rgba(201,162,39,0.2);padding:1px 4px;border-radius:2px;">${this.escapeHtml(r.pattern)}</code>
            ${r.replacement ? `<br><span>替换：</span><code style="background:rgba(201,162,39,0.2);padding:1px 4px;border-radius:2px;">${this.escapeHtml(r.replacement)}</code>` : ''}
          </div>
        </div>`;
    }).join('');
  },

  /** 获取标签对应颜色 */
  getTagColor(tag) {
    const map = { '去重': '#E8A87C', '去格式': '#A8D8EA', '提取': '#C9A227', '替换': '#AA96DA', '清洗': '#88B04B' };
    return map[tag] || '#C9A227';
  },

  /** 折叠/展开侧边栏 */
  toggleSidebar() {
    const sb = document.getElementById('regex-sidebar');
    if (!sb) { console.warn('[v7] 元素 #regex-sidebar 未找到'); }
    if (!sb) return;
    this.state.sidebarCollapsed = !this.state.sidebarCollapsed;
    sb.style.width = this.state.sidebarCollapsed ? '40px' : '260px';
    const list = document.getElementById('regex-rule-list');
    if (list) list.style.display = this.state.sidebarCollapsed ? 'none' : 'block';
    const header = sb.querySelector('div');
    if (header) header.style.display = this.state.sidebarCollapsed ? 'none' : 'flex';
  },

  /* ---------- 界面渲染：规则链面板 ---------- */

  /** 渲染底部规则链状态 */
  renderChainPanel() {
    const container = document.getElementById('regex-chain-list');
    if (!container) { console.warn('[v7] 元素 #regex-chain-list 未找到'); }
    if (!container) return;
    const enabled = this.getRules().filter(r => r.enabled);
    if (enabled.length === 0) {
      container.innerHTML = '<span style="color:#8B7355;">当前没有启用的规则。请在左侧勾选规则以加入规则链。</span>';
      return;
    }
    container.innerHTML = enabled.map((r, i) => `
      <span style="display:inline-flex;align-items:center;gap:4px;background:#2C1810;color:#C9A227;padding:3px 8px;border-radius:3px;margin:2px;font-size:12px;">
        <strong>${i + 1}</strong> ${this.escapeHtml(r.name)}
      </span>
    `).join('<span style="color:#8B7355;margin:0 4px;">→</span>');
  },

  /* ---------- 界面渲染：编辑器模态框 ---------- */

  /**
   * 打开规则编辑器
   * @param {string|null} id - 规则 ID，null 表示新建
   */
  openEditor(id = null) {
    const rule = id ? this.getRules().find(r => r.id === id) : null;
    this.state.editorRule = rule;
    const title = rule ? '编辑规则' : '新建规则';
    document.getElementById('regexEditorTitle').textContent = title;
    document.getElementById('regexEditorBody').innerHTML = `
      <input type="hidden" id="ed-id" value="${rule ? rule.id : ''}">
      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:12px;color:#8B7355;margin-bottom:4px;">规则名称</label>
        <input type="text" id="ed-name" value="${this.escapeHtml(rule ? rule.name : '')}" placeholder="如：去除多余空格"
          style="width:100%;padding:6px 8px;border:1px solid #C9A227;border-radius:4px;background:#F5E6D3;color:#2C1810;box-sizing:border-box;outline:none;">
      </div>
      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:12px;color:#8B7355;margin-bottom:4px;">正则表达式（无需前后斜杠）</label>
        <input type="text" id="ed-pattern" value="${this.escapeHtml(rule ? rule.pattern : '')}" placeholder="如：\\s+"
          style="width:100%;padding:6px 8px;border:1px solid #C9A227;border-radius:4px;background:#F5E6D3;color:#2C1810;box-sizing:border-box;outline:none;">
      </div>
      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:12px;color:#8B7355;margin-bottom:4px;">替换为（留空表示删除匹配内容）</label>
        <input type="text" id="ed-replacement" value="${this.escapeHtml(rule ? rule.replacement : '')}" placeholder="如：一个空格"
          style="width:100%;padding:6px 8px;border:1px solid #C9A227;border-radius:4px;background:#F5E6D3;color:#2C1810;box-sizing:border-box;outline:none;">
      </div>
      <div style="display:flex;gap:10px;margin-bottom:12px;">
        <div style="flex:1;">
          <label style="display:block;font-size:12px;color:#8B7355;margin-bottom:4px;">应用场景</label>
          <select id="ed-tag"
            style="width:100%;padding:6px 8px;border:1px solid #C9A227;border-radius:4px;background:#F5E6D3;color:#2C1810;box-sizing:border-box;outline:none;">
            ${this.TAGS.map(t => `<option value="${t}" ${rule && rule.tag === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div style="flex:1;">
          <label style="display:block;font-size:12px;color:#8B7355;margin-bottom:4px;">标志位</label>
          <input type="text" id="ed-flags" value="${this.escapeHtml(rule ? rule.flags : 'g')}" placeholder="g / gi / gm"
            style="width:100%;padding:6px 8px;border:1px solid #C9A227;border-radius:4px;background:#F5E6D3;color:#2C1810;box-sizing:border-box;outline:none;">
        </div>
      </div>
      <div style="margin-bottom:4px;">
        <label style="display:block;font-size:12px;color:#8B7355;margin-bottom:4px;">说明</label>
        <input type="text" id="ed-desc" value="${this.escapeHtml(rule ? rule.description : '')}" placeholder="简述规则用途"
          style="width:100%;padding:6px 8px;border:1px solid #C9A227;border-radius:4px;background:#F5E6D3;color:#2C1810;box-sizing:border-box;outline:none;">
      </div>
    `;
    this.openModal('regexEditorModal');
  },

  /** 保存编辑器内容 */
  saveEditor() {
    const id = document.getElementById('ed-id').value;
    const name = document.getElementById('ed-name').value.trim();
    const pattern = document.getElementById('ed-pattern').value;
    const replacement = document.getElementById('ed-replacement').value;
    const tag = document.getElementById('ed-tag').value;
    const flags = document.getElementById('ed-flags').value;
    const description = document.getElementById('ed-desc').value;
    if (!name) { this.toast('请输入规则名称', 'error'); return; }
    if (!pattern) { this.toast('请输入正则表达式', 'error'); return; }
    // 验证正则语法
    try { new RegExp(pattern, flags || 'g'); } catch (e) { this.toast('正则语法错误：' + e.message, 'error'); return; }
    if (id) {
      this.updateRule(id, { name, pattern, replacement, tag, flags, description });
      this.toast('规则已更新', 'success');
    } else {
      this.createRule({ name, pattern, replacement, tag, flags, description });
      this.toast('规则已创建', 'success');
    }
    this.closeModal('regexEditorModal');
    this.renderSidebar();
    this.renderChainPanel();
  },

  /* ---------- AI 生成正则模态框 ---------- */

  /** 打开 AI 生成模态框 */
  openAIGenModal() {
    document.getElementById('ai-gen-desc').value = '';
    document.getElementById('ai-gen-result').innerHTML = '';
    this.state.aiGenerated = null;
    this.openModal('regexAIGenModal');
  },

  /** 渲染 AI 生成结果 */
  renderAIGenResult() {
    const container = document.getElementById('ai-gen-result');
    if (!container) { console.warn('[v7] 元素 #ai-gen-result 未找到'); }
    const gen = this.state.aiGenerated;
    if (!gen || !container) return;
    container.innerHTML = `
      <div style="border:1px solid #C9A227;border-radius:4px;padding:10px;background:#2C1810;color:#F5E6D3;">
        <div style="font-size:12px;color:#C9A227;margin-bottom:6px;">根据描述生成：</div>
        <div style="margin-bottom:6px;"><strong>正则：</strong><code style="background:rgba(201,162,39,0.2);padding:2px 6px;border-radius:2px;">${this.escapeHtml(gen.pattern)}</code></div>
        <div style="margin-bottom:10px;"><strong>替换：</strong><code style="background:rgba(201,162,39,0.2);padding:2px 6px;border-radius:2px;">${this.escapeHtml(gen.replacement)}</code></div>
        <button onclick="RegexEngine.createRule({name:'AI生成规则',pattern:'${this.escapeHtml(gen.pattern).replace(/'/g, "\\'")}',replacement:'${this.escapeHtml(gen.replacement).replace(/'/g, "\\'")}',description:'${this.escapeHtml(gen.description).replace(/'/g, "\\'")}',tag:'提取'})" style="background:#C9A227;color:#2C1810;border:none;padding:5px 12px;border-radius:4px;cursor:pointer;font-size:12px;">保存为规则</button>
      </div>
    `;
  },

  /* ---------- 导入 / 导出交互 ---------- */

  /** 触发文件导入 */
  triggerImport() {
    const input = document.getElementById('regex-import-file');
    if (input) input.click();
  },

  /** 文件选择后读取导入 */
  onImportFile(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.importRules(e.target.result);
      input.value = '';
    };
    reader.readAsText(file);
  },

  /* ---------- 事件处理器 ---------- */

  /** 测试区输入变化时实时执行正则 */
  onTestInput() {
    const text = document.getElementById('rx-input').value;
    const pattern = document.getElementById('rx-pattern').value;
    const replacement = document.getElementById('rx-replacement').value;
    const flags = (document.getElementById('rx-flag-g').checked ? 'g' : '') +
                  (document.getElementById('rx-flag-i').checked ? 'i' : '') +
                  (document.getElementById('rx-flag-m').checked ? 'm' : '');
    const preview = document.getElementById('rx-preview');
    if (!preview) { console.warn('[v7] 元素 #rx-preview 未找到'); }
    const output = document.getElementById('rx-output');
    if (!output) { console.warn('[v7] 元素 #rx-output 未找到'); }
    const stats = document.getElementById('rx-stats');
    if (!stats) { console.warn('[v7] 元素 #rx-stats 未找到'); }
    if (!pattern) {
      preview.innerHTML = '<span style="color:#8B7355;opacity:0.6;">请输入正则表达式以预览匹配结果…</span>';
      output.value = text;
      stats.style.display = 'none';
      return;
    }
    const result = this.testRegex(text, pattern, flags, replacement);
    if (!result.success) {
      preview.innerHTML = `<span style="color:#ff6b6b;">正则语法错误：${this.escapeHtml(result.error)}</span>`;
      output.value = text;
      stats.style.display = 'none';
      return;
    }
    preview.innerHTML = result.highlighted || '<span style="color:#8B7355;">无匹配项</span>';
    output.value = result.output;
    document.getElementById('stat-matches').textContent = result.matchCount;
    document.getElementById('stat-replaces').textContent = result.replaceCount;
    document.getElementById('stat-diff').textContent = (result.charDiff >= 0 ? '-' : '+') + Math.abs(result.charDiff);
    stats.style.display = 'flex';
  },

  /** 复制输出 */
  copyOutput() {
    const out = document.getElementById('rx-output');
    if (!out) { console.warn('[v7] 元素 #rx-output 未找到'); }
    if (!out || !out.value) { this.toast('没有可复制的内容', 'error'); return; }
    this.copyToClipboard(out.value);
  },

  /** 导出输出为 txt */
  exportOutput() {
    const out = document.getElementById('rx-output');
    if (!out) { console.warn('[v7] 元素 #rx-output 未找到'); }
    if (!out || !out.value) { this.toast('没有可导出的内容', 'error'); return; }
    this.exportText(out.value, 'regex_output.txt');
  },

  /** 执行规则链 */
  runChain() {
    const text = document.getElementById('rx-input').value;
    if (!text) { this.toast('请输入待处理的文本', 'error'); return; }
    const result = this.executeChain(text);
    document.getElementById('rx-output').value = result.output;
    document.getElementById('rx-preview').innerHTML = result.logs.map(l => `<div style="margin-bottom:3px;">${this.escapeHtml(l)}</div>`).join('');
    document.getElementById('stat-matches').textContent = result.stats.totalMatches;
    document.getElementById('stat-replaces').textContent = result.stats.totalReplacements;
    document.getElementById('stat-diff').textContent = (result.stats.charDiff >= 0 ? '-' : '+') + Math.abs(result.stats.charDiff);
    document.getElementById('rx-stats').style.display = 'flex';
    this.toast(`规则链执行完成，共处理 ${result.stats.totalMatches} 处`, 'success');
  },

  /** 八股文快捷处理 */
  runBaguProcess(type) {
    const input = document.getElementById('rx-input');
    if (!input) { console.warn('[v7] 元素 #rx-input 未找到'); }
    if (!input || !input.value) { this.toast('请输入文本', 'error'); return; }
    let text = input.value;
    switch (type) {
      case 'dedup': text = this.removeDuplicateParagraphs(text, 0.8); this.toast('已去除重复段落', 'success'); break;
      case 'trim': text = this.removeEmptyLines(text); this.toast('已去除空行与多余空格', 'success'); break;
      case 'clean': text = this.removeSpecialChars(text); this.toast('已去除特殊符号与乱码', 'success'); break;
      case 'half': text = this.fullWidthToHalf(text); this.toast('已全角转半角', 'success'); break;
      case 'full': text = this.halfWidthToFull(text); this.toast('已半角转全角', 'success'); break;
      default: return;
    }
    input.value = text;
    this.onTestInput();
  },

  /* ---------- 模态框工具 ---------- */

  /** 打开模态框 */
  openModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
  },

  /** 关闭模态框 */
  closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  },

  /* ---------- 兼容旧版接口（保持全局对象行为稳定） ---------- */

  /**
   * 处理文本（兼容旧版 process 接口）
   * 当前以规则链方式执行启用的规则
   * @param {string} text - 原始文本
   * @returns {Object} { text: 处理后文本, events: 执行日志 }
   */
  process(text) {
    const result = this.executeChain(text);
    return { text: result.output, events: result.logs };
  },

  /**
   * 旧版方法映射：渲染列表（由 onEnter 内部调用，现统一为 renderSidebar）
   */
  renderList() {
    this.renderSidebar();
  }
};
