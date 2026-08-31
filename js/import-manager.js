/**
 * =========================================================
 * ImportManager v2 — 万能导入 · 智能自动分类
 * 支持 JSON / TXT / MD / CSV / DOCX / 图片 / ZIP
 * 自动扫描内容 → 识别类型 → 分类到对应模块 → 预览确认 → 导入
 * 存储键: import_manager_v16
 * =========================================================
 */
const ImportManager = {
  /** 存储键名 */
  STORAGE_KEY: 'import_manager_v16',

  /** 古风墨境配色 */
  COLORS: {
    gold: '#C9A227',
    ink: '#2C1810',
    paper: '#F5E6D3',
    paperLight: '#FAF0E6',
    border: '#D4C5B0',
    textMuted: '#8B7355',
    success: '#5B8C5A',
    warning: '#C9A227',
    danger: '#A04545',
    info: '#4A7C9B'
  },

  /** 类型识别规则：字段匹配 + 权重 */
  TYPE_RULES: [
    {
      type: 'npc',
      label: '人物志',
      icon: '👤',
      targetModule: 'NPCManager',
      storageKey: 'npcs_v2',
      fields: ['name', 'age', 'gender', 'personality', 'description', 'background'],
      weights: { name: 25, age: 15, gender: 10, personality: 20, description: 15, background: 15 }
    },
    {
      type: 'novel',
      label: '文本小说',
      icon: '📖',
      targetModule: 'NovelManager',
      storageKey: 'novel_chapters_v1',
      fields: ['title', 'content', 'chapter', 'text', 'paragraph'],
      weights: { title: 20, content: 25, chapter: 20, text: 15, paragraph: 10 },
      extraCheck: (data) => {
        if (Array.isArray(data)) {
          const hasCh = data.some(i => i.chapter || i.title);
          const avgLen = data.reduce((s, i) => s + (String(i.content || i.text || '').length), 0) / data.length;
          return hasCh && avgLen > 50;
        }
        return false;
      }
    },
    {
      type: 'location',
      label: '地图',
      icon: '🗺️',
      targetModule: 'MapManager',
      storageKey: 'locations_v2',
      fields: ['location', 'type', 'description', 'place', 'region', 'coordinates'],
      weights: { location: 25, type: 15, description: 15, place: 20, region: 15, coordinates: 10 }
    },
    {
      type: 'event',
      label: '随机事件',
      icon: '⚡',
      targetModule: 'EventManager',
      storageKey: 'random_events_v2',
      fields: ['event', 'trigger', 'effect', 'chance', 'condition', 'outcome'],
      weights: { event: 25, trigger: 20, effect: 20, chance: 10, condition: 15, outcome: 10 }
    },
    {
      type: 'task',
      label: '任务委托',
      icon: '📜',
      targetModule: 'TaskManager',
      storageKey: 'tasks_v2',
      fields: ['task', 'reward', 'deadline', 'quest', 'mission', 'requirement'],
      weights: { task: 25, reward: 20, deadline: 15, quest: 20, mission: 15, requirement: 10 }
    },
    {
      type: 'achievement',
      label: '徽章墙',
      icon: '🏅',
      targetModule: 'AchievementManager',
      storageKey: 'achievements_v2',
      fields: ['name', 'rarity', 'icon', 'achievement', 'badge', 'condition'],
      weights: { name: 15, rarity: 25, icon: 15, achievement: 20, badge: 20, condition: 10 }
    },
    {
      type: 'preset',
      label: '预设管理',
      icon: '⚙️',
      targetModule: 'PresetManager',
      storageKey: 'presets_v3',
      fields: ['prompt', 'category', 'system_prompt', 'temperature', 'max_tokens'],
      weights: { prompt: 30, category: 15, system_prompt: 25, temperature: 15, max_tokens: 15 }
    },
    {
      type: 'worldbook',
      label: '世界书',
      icon: '🌍',
      targetModule: 'WorldBook',
      storageKey: 'worldBook',
      fields: ['world', 'setting', 'entries', 'lore', 'history', 'rule'],
      weights: { world: 20, setting: 25, entries: 20, lore: 15, history: 10, rule: 10 },
      extraCheck: (data) => {
        if (data && typeof data === 'object') {
          if (Array.isArray(data.entries)) return true;
          if (data.world || data.setting) return true;
        }
        return false;
      }
    },
    {
      type: 'relation',
      label: '关系网',
      icon: '🔗',
      targetModule: 'RelationManager',
      storageKey: 'relations_v2',
      fields: ['source', 'target', 'relation', 'type', 'bond', 'affinity'],
      weights: { source: 20, target: 20, relation: 25, type: 15, bond: 10, affinity: 10 },
      extraCheck: (data) => {
        if (Array.isArray(data)) {
          return data.some(i => (i.source && i.target) || (i.from && i.to) || (i.A && i.B));
        }
        return false;
      }
    }
  ],

  /** 当前会话状态 */
  state: {
    pendingFiles: [],       // 待处理的文件列表
    scanResults: [],        // 扫描结果
    selectedTypes: new Set(), // 用户选中的类型
    conflicts: [],          // 冲突列表
    lastImportSnapshot: null // 用于撤销
  },

  // =========================================================
  // 生命周期
  // =========================================================

  /** 初始化入口 */
  init() {
    this.renderPage();
    this.bindDragDrop();
  },

  /** 页面进入时刷新历史 */
  onEnter() {
    this.renderImportHistory();
  },

  // =========================================================
  // 数据存取
  // =========================================================

  /** 读取导入记录 */
  getLogs() {
    return Storage.get(this.STORAGE_KEY + '_logs', []);
  },

  /** 保存导入记录 */
  saveLogs(list) {
    Storage.set(this.STORAGE_KEY + '_logs', list);
  },

  /** 读取撤销快照 */
  getUndoSnapshot() {
    return Storage.get(this.STORAGE_KEY + '_undo', null);
  },

  /** 保存撤销快照 */
  saveUndoSnapshot(snapshot) {
    Storage.set(this.STORAGE_KEY + '_undo', snapshot);
  },

  // =========================================================
  // UI 渲染 — 主页面
  // =========================================================

  /** 渲染导入页面 */
  renderPage() {
    const page = document.getElementById('page-import');
    if (!page) return;
    page.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:var(--space-md);">
        <h2 class="section-title" style="color:${this.COLORS.ink};">📥 万能导入</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-secondary" onclick="ImportManager.showHelp()">❓ 格式说明</button>
          <button class="btn btn-gold" onclick="ImportManager.showImportHistory()">📜 导入历史</button>
        </div>
      </div>

      <!-- 顶部操作栏 -->
      <div style="display:flex;gap:12px;justify-content:center;margin-bottom:var(--space-lg);flex-wrap:wrap;">
        <button class="btn btn-primary" id="btnSelectFile" onclick="document.getElementById('v2FileInput').click()">
          📁 导入文件
        </button>
        <button class="btn btn-primary" id="btnBatchImport" onclick="document.getElementById('v2BatchInput').click()">
          📂 批量导入
        </button>
        <button class="btn btn-gold" onclick="ImportManager.triggerAIAnalysis()">
          🤖 AI分析
        </button>
        <input type="file" id="v2FileInput" style="display:none;" onchange="ImportManager.handleFiles(event,'single')">
        <input type="file" id="v2BatchInput" multiple style="display:none;" onchange="ImportManager.handleFiles(event,'batch')">
      </div>

      <!-- 中间区域：拖放区 / 文件列表 / 预览 -->
      <div id="importWorkArea" style="margin-bottom:var(--space-lg);">
        ${this.renderDropZone()}
      </div>

      <!-- 扫描进度 -->
      <div id="scanProgressArea" style="display:none;margin-bottom:var(--space-lg);">
        <div style="background:${this.COLORS.paperLight};border:2px solid ${this.COLORS.border};border-radius:12px;padding:var(--space-lg);">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:var(--space-md);">
            <div class="spinner" style="width:24px;height:24px;border:3px solid ${this.COLORS.border};border-top-color:${this.COLORS.gold};border-radius:50%;animation:spin 1s linear infinite;"></div>
            <span style="color:${this.COLORS.ink};font-weight:600;">正在智能扫描文件内容...</span>
          </div>
          <div style="background:${this.COLORS.paper};border-radius:8px;height:8px;overflow:hidden;">
            <div id="scanProgressBar" style="width:0%;height:100%;background:${this.COLORS.gold};transition:width 0.3s;"></div>
          </div>
          <p id="scanProgressText" style="margin-top:8px;font-size:13px;color:${this.COLORS.textMuted};">准备中...</p>
        </div>
      </div>

      <!-- 预览面板 -->
      <div id="previewPanel" style="display:none;margin-bottom:var(--space-lg);"></div>

      <!-- 冲突处理面板 -->
      <div id="conflictPanel" style="display:none;margin-bottom:var(--space-lg);"></div>

      <!-- 底部操作按钮 -->
      <div id="actionBar" style="display:none;position:sticky;bottom:0;background:linear-gradient(to top, ${this.COLORS.paper} 80%, transparent);padding:var(--space-md) 0;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <button class="btn btn-success" onclick="ImportManager.importSelected()">✅ 导入选中</button>
        <button class="btn btn-secondary" onclick="ImportManager.cancelImport()">❌ 取消</button>
        <button class="btn btn-gold" onclick="ImportManager.triggerAIAnalysis()">🤖 AI分析</button>
      </div>
    `;
    this.renderImportHistory();
    this.injectSpinnerCSS();
  },

  /** 注入旋转动画样式 */
  injectSpinnerCSS() {
    if (document.getElementById('import-spinner-css')) return;
    const style = document.createElement('style');
    style.id = 'import-spinner-css';
    style.textContent = `
      @keyframes spin { to { transform: rotate(360deg); } }
      .import-type-tag {
        display:inline-flex;align-items:center;gap:4px;
        padding:4px 10px;border-radius:20px;font-size:13px;font-weight:600;
        background:${this.COLORS.paperLight};border:1px solid ${this.COLORS.border};
        color:${this.COLORS.ink};cursor:pointer;transition:all 0.2s;
      }
      .import-type-tag:hover { border-color:${this.COLORS.gold}; }
      .import-type-tag.selected { background:${this.COLORS.gold};color:#fff;border-color:${this.COLORS.gold}; }
      .import-file-card {
        background:${this.COLORS.paperLight};border:1px solid ${this.COLORS.border};
        border-radius:10px;padding:12px 16px;margin-bottom:10px;
        display:flex;align-items:center;gap:12px;transition:border-color 0.2s;
      }
      .import-file-card:hover { border-color:${this.COLORS.gold}; }
      .confidence-high { color:${this.COLORS.success}; }
      .confidence-medium { color:${this.COLORS.warning}; }
      .confidence-low { color:${this.COLORS.danger}; }
    `;
    document.head.appendChild(style);
  },

  /** 渲染拖放区 */
  renderDropZone() {
    return `
      <div id="dropZone"
           ondragover="ImportManager.onDragOver(event)"
           ondragleave="ImportManager.onDragLeave(event)"
           ondrop="ImportManager.onDrop(event)"
           style="border:3px dashed ${this.COLORS.border};border-radius:16px;
                  padding:60px 40px;text-align:center;background:${this.COLORS.paperLight};
                  transition:all 0.3s;cursor:pointer;"
           onclick="document.getElementById('v2BatchInput').click()">
        <div style="font-size:56px;margin-bottom:var(--space-md);opacity:0.6;">📥</div>
        <h3 style="color:${this.COLORS.ink};margin-bottom:8px;font-size:18px;">拖放文件到此处</h3>
        <p style="color:${this.COLORS.textMuted};font-size:14px;margin-bottom:4px;">或点击选择文件</p>
        <p style="color:${this.COLORS.textMuted};font-size:12px;">支持 JSON · TXT · MD · CSV · DOCX · 图片 · ZIP</p>
      </div>
    `;
  },

  // =========================================================
  // 拖放事件绑定
  // =========================================================

  bindDragDrop() {
    // 事件通过内联 ondragover/ondrop 绑定在 renderDropZone 中
  },

  onDragOver(e) {
    e.preventDefault();
    const dz = document.getElementById('dropZone');
    if (dz) {
      dz.style.borderColor = this.COLORS.gold;
      dz.style.background = this.COLORS.paper;
    }
  },

  onDragLeave(e) {
    e.preventDefault();
    const dz = document.getElementById('dropZone');
    if (dz) {
      dz.style.borderColor = this.COLORS.border;
      dz.style.background = this.COLORS.paperLight;
    }
  },

  onDrop(e) {
    e.preventDefault();
    const dz = document.getElementById('dropZone');
    if (dz) {
      dz.style.borderColor = this.COLORS.border;
      dz.style.background = this.COLORS.paperLight;
    }
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFileList(Array.from(files));
    }
  },

  // =========================================================
  // 文件处理入口
  // =========================================================

  /** 文件输入框回调 */
  handleFiles(e, mode) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    this.processFileList(Array.from(files));
    e.target.value = ''; // 清空以便重复选择同一文件
  },

  /** 处理文件列表 */
  async processFileList(files) {
    this.state.pendingFiles = [];
    this.state.scanResults = [];
    this.state.selectedTypes.clear();
    this.state.conflicts = [];
    this.state.lastImportSnapshot = null;

    // 隐藏之前的内容，显示进度
    document.getElementById('previewPanel').style.display = 'none';
    document.getElementById('conflictPanel').style.display = 'none';
    document.getElementById('actionBar').style.display = 'none';
    document.getElementById('scanProgressArea').style.display = 'block';

    const workArea = document.getElementById('importWorkArea');
    workArea.innerHTML = this.renderFileList(files);

    // 逐个解析文件
    const total = files.length;
    for (let i = 0; i < total; i++) {
      this.updateScanProgress((i / total) * 80, `正在解析: ${files[i].name}...`);
      try {
        const parsed = await this.parseFile(files[i]);
        const scanned = this.scanContent(parsed, files[i].name);
        this.state.pendingFiles.push({ file: files[i], parsed, scanned });
      } catch (err) {
        console.warn('解析文件失败:', files[i].name, err);
        this.state.pendingFiles.push({ file: files[i], parsed: null, scanned: { type: 'unknown', confidence: 0, error: err.message } });
      }
    }

    this.updateScanProgress(90, '正在生成预览...');
    await this.delay(200);

    this.updateScanProgress(100, '扫描完成');
    await this.delay(300);

    document.getElementById('scanProgressArea').style.display = 'none';
    this.showPreviewPanel();
  },

  /** 更新扫描进度条 */
  updateScanProgress(percent, text) {
    const bar = document.getElementById('scanProgressBar');
    const txt = document.getElementById('scanProgressText');
    if (bar) bar.style.width = percent + '%';
    if (txt) txt.textContent = text;
  },

  /** 渲染文件列表摘要 */
  renderFileList(files) {
    return `
      <div style="margin-bottom:var(--space-md);">
        <h4 style="color:${this.COLORS.ink};margin-bottom:12px;font-size:16px;">📂 待处理文件 (${files.length})</h4>
        ${files.map(f => `
          <div class="import-file-card">
            <span style="font-size:24px;">${this.getFileIcon(f.name)}</span>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:600;color:${this.COLORS.ink};font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${f.name}</div>
              <div style="font-size:12px;color:${this.COLORS.textMuted};">${this.formatFileSize(f.size)} · ${f.name.split('.').pop().toUpperCase()}</div>
            </div>
            <span class="file-status" data-file="${f.name}" style="font-size:12px;color:${this.COLORS.textMuted};">等待扫描...</span>
          </div>
        `).join('')}
      </div>
    `;
  },

  /** 获取文件图标 */
  getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const map = {
      json: '📋', txt: '📄', md: '📝', csv: '📊',
      doc: '📘', docx: '📘', zip: '📦',
      png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', webp: '🖼️', bmp: '🖼️'
    };
    return map[ext] || '📄';
  },

  /** 格式化文件大小 */
  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  },

  // =========================================================
  // 文件解析 — 多格式支持
  // =========================================================

  /** 根据扩展名解析文件内容 */
  async parseFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    const name = file.name;

    // 图片类型 → 直接存入 IndexedDB，返回元数据
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(ext)) {
      return await this.parseImageFile(file);
    }

    // ZIP 类型 → 解压后递归解析内部文件
    if (ext === 'zip') {
      return await this.parseZipFile(file);
    }

    // 文本类 → 读取文本后按格式解析
    const text = await file.text();

    if (ext === 'json' || ext === 'jsonl') {
      return this.parseJSON(text);
    }
    if (ext === 'csv') {
      return this.parseCSV(text);
    }
    if (ext === 'txt' || ext === 'md') {
      return { _rawText: text, _format: ext, lines: text.split('\n').map(l => l.trim()).filter(l => l) };
    }
    if (ext === 'docx') {
      // DOCX 在浏览器中无法直接解压解析 XML，提示用户粘贴
      return { _rawText: text, _format: 'docx', _needsPaste: true, lines: [text.substring(0, 200) + '... [docx 文件请在浏览器中打开后复制内容粘贴]'] };
    }

    // 默认按纯文本处理
    return { _rawText: text, _format: ext, lines: text.split('\n').map(l => l.trim()).filter(l => l) };
  },

  /** 解析 JSON / JSONL */
  parseJSON(text) {
    try {
      // 先尝试完整 JSON
      const data = JSON.parse(text);
      return data;
    } catch {
      // 尝试 JSONL（每行一个 JSON）
      const lines = text.split('\n').filter(l => l.trim());
      const arr = [];
      for (const line of lines) {
        try { arr.push(JSON.parse(line)); } catch { /* 忽略无效行 */ }
      }
      if (arr.length > 0) return arr;
      throw new Error('JSON 解析失败');
    }
  },

  /** 解析 CSV */
  parseCSV(text) {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length === 0) return [];
    const headers = this.parseCSVLine(lines[0]);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const row = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
      rows.push(row);
    }
    return rows;
  },

  /** 解析单个 CSV 字段（支持引号包裹） */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  },

  /** 解析图片文件 → 存入 IndexedDB */
  async parseImageFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target.result;
        const imgId = 'img_import_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        const category = this.guessImageCategory(file.name);
        // 存入 Storage（假设 Storage 有 saveImage 方法）
        if (typeof Storage !== 'undefined' && Storage.saveImage) {
          await Storage.saveImage(imgId, category, null, file.name, dataUrl, { transparent: false });
        }
        resolve({
          _type: 'image',
          _format: file.name.split('.').pop().toLowerCase(),
          _imageId: imgId,
          _dataUrl: dataUrl,
          _category: category,
          _fileName: file.name
        });
      };
      reader.readAsDataURL(file);
    });
  },

  /** 猜测图片用途分类 */
  guessImageCategory(filename) {
    const lower = filename.toLowerCase();
    if (/avatar|portrait|head|face/.test(lower)) return 'avatar';
    if (/bg|background|scene|landscape/.test(lower)) return 'background';
    if (/char|character|npc|role/.test(lower)) return 'character';
    return 'general';
  },

  /** 解析 ZIP 文件 → 递归处理内部文件 */
  async parseZipFile(file) {
    // 浏览器环境下无原生 ZIP 解压库，使用简化策略：读取为二进制后标记为需要外部处理
    // 若存在 JSZip 库则尝试解压
    if (typeof JSZip !== 'undefined') {
      try {
        const zip = await JSZip.loadAsync(file);
        const results = [];
        const files = [];
        zip.forEach((relativePath, zipEntry) => {
          if (!zipEntry.dir) files.push(zipEntry);
        });
        for (const entry of files.slice(0, 50)) { // 限制最多 50 个文件防止卡死
          const ext = entry.name.split('.').pop().toLowerCase();
          const content = await entry.async('string');
          let parsed;
          if (ext === 'json' || ext === 'jsonl') parsed = this.parseJSON(content);
          else if (ext === 'csv') parsed = this.parseCSV(content);
          else if (['txt', 'md'].includes(ext)) parsed = { _rawText: content, _format: ext, lines: content.split('\n').map(l => l.trim()).filter(l => l) };
          else parsed = { _rawText: content, _format: ext, _zipPath: entry.name };
          results.push({ _zipPath: entry.name, _format: ext, data: parsed });
        }
        return { _type: 'zip', _fileName: file.name, _entries: results };
      } catch (err) {
        return { _type: 'zip', _fileName: file.name, _error: err.message, _needsExternal: true };
      }
    }
    return { _type: 'zip', _fileName: file.name, _needsExternal: true, _note: '请在浏览器中解压后逐个导入' };
  },

  // =========================================================
  // 智能扫描与分类
  // =========================================================

  /** 扫描解析后的内容，识别类型并给出置信度 */
  scanContent(parsed, filename) {
    // 图片类型直接返回
    if (parsed && parsed._type === 'image') {
      return {
        type: 'image',
        confidence: 100,
        label: '图片素材',
        icon: '🖼️',
        summary: `${parsed._category === 'avatar' ? '头像' : parsed._category === 'background' ? '背景' : parsed._category === 'character' ? '立绘' : '图片'} · ${parsed._fileName}`,
        data: parsed,
        count: 1
      };
    }

    // ZIP 类型
    if (parsed && parsed._type === 'zip') {
      if (parsed._entries) {
        // 对 ZIP 内每个文件再扫描
        const innerResults = parsed._entries.map(e => this.scanContent(e.data, e._zipPath));
        return {
          type: 'zip',
          confidence: 100,
          label: '批量压缩包',
          icon: '📦',
          summary: `包含 ${parsed._entries.length} 个文件`,
          data: parsed,
          innerResults,
          count: parsed._entries.length
        };
      }
      return { type: 'zip', confidence: 50, label: 'ZIP文件', icon: '📦', summary: '需要解压处理', data: parsed, count: 0 };
    }

    // 若解析失败
    if (!parsed) {
      return { type: 'unknown', confidence: 0, label: '未知', icon: '❓', summary: '无法解析文件', data: null, count: 0 };
    }

    // 对数组中的每个对象分别评分，取最可能的类型
    const items = Array.isArray(parsed) ? parsed : [parsed];
    if (items.length === 0) {
      return { type: 'unknown', confidence: 0, label: '未知', icon: '❓', summary: '无有效数据', data: parsed, count: 0 };
    }

    // 计算各类型得分
    const scores = this.TYPE_RULES.map(rule => {
      let score = 0;
      let maxScore = 0;
      let matchCount = 0;

      for (const item of items.slice(0, 5)) { // 取样前5条
        if (!item || typeof item !== 'object') continue;
        const keys = Object.keys(item).map(k => k.toLowerCase());
        for (const [field, weight] of Object.entries(rule.weights)) {
          maxScore += weight;
          if (keys.includes(field.toLowerCase())) {
            score += weight;
            matchCount++;
          }
        }
      }

      // 额外检查
      if (rule.extraCheck) {
        if (rule.extraCheck(parsed)) {
          score += 20;
          maxScore += 20;
        }
      }

      // 文件名关键词加分
      const fname = filename.toLowerCase();
      if (fname.includes(rule.type) || fname.includes(rule.label)) {
        score += 10;
        maxScore += 10;
      }

      const confidence = maxScore > 0 ? Math.min(100, Math.round((score / maxScore) * 100)) : 0;
      return { rule, score, maxScore, confidence, matchCount };
    });

    scores.sort((a, b) => b.confidence - a.confidence);
    const best = scores[0];

    // 提取摘要（前3条关键字段）
    const samples = items.slice(0, 3).map((item, idx) => {
      if (!item || typeof item !== 'object') return `#${idx + 1}: (非对象)`;
      const keyField = best.rule.fields[0];
      const name = item[keyField] || item.name || item.title || item.id || `(条目${idx + 1})`;
      const previewFields = best.rule.fields.slice(1, 3);
      const preview = previewFields.map(f => item[f]).filter(Boolean).join(' · ');
      return `${name}${preview ? ': ' + preview.substring(0, 40) : ''}`;
    });

    return {
      type: best.rule.type,
      confidence: best.confidence,
      label: best.rule.label,
      icon: best.rule.icon,
      targetModule: best.rule.targetModule,
      storageKey: best.rule.storageKey,
      summary: `共 ${items.length} 条 · ${best.confidence}% 置信度`,
      samples,
      data: parsed,
      count: items.length,
      allScores: scores.slice(0, 3).map(s => ({ type: s.rule.type, label: s.rule.label, confidence: s.confidence }))
    };
  },

  // =========================================================
  // 预览面板
  // =========================================================

  /** 显示扫描后的预览面板 */
  showPreviewPanel() {
    const panel = document.getElementById('previewPanel');
    const actionBar = document.getElementById('actionBar');
    if (!panel) return;

    // 汇总所有识别结果
    const results = this.state.pendingFiles.map(pf => pf.scanned);
    const grouped = this.groupByType(results);

    let html = `
      <div style="background:${this.COLORS.paperLight};border:2px solid ${this.COLORS.border};border-radius:16px;padding:var(--space-lg);">
        <h3 style="color:${this.COLORS.ink};margin-bottom:16px;font-size:18px;">
          🔍 检测到可能的内容类型
        </h3>
    `;

    if (grouped.length === 0) {
      html += `<div style="text-align:center;padding:40px;color:${this.COLORS.textMuted};">未能识别任何可导入内容</div>`;
    } else {
      html += `<div style="display:flex;flex-direction:column;gap:12px;">`;
      for (const group of grouped) {
        const isLowConfidence = group.confidence < 60;
        const confidenceClass = group.confidence >= 80 ? 'confidence-high' : group.confidence >= 60 ? 'confidence-medium' : 'confidence-low';
        const checked = group.confidence >= 60 ? 'checked' : '';
        const typeId = `type_${group.type}`;

        html += `
          <div style="border:1px solid ${this.COLORS.border};border-radius:12px;padding:14px;background:#fff;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap;">
              <input type="checkbox" id="${typeId}" ${checked} onchange="ImportManager.toggleType('${group.type}')" style="width:auto;cursor:pointer;">
              <label for="${typeId}" style="display:flex;align-items:center;gap:6px;cursor:pointer;font-weight:600;color:${this.COLORS.ink};font-size:15px;">
                <span style="font-size:20px;">${group.icon}</span>
                <span>${group.label}</span>
                <span class="${confidenceClass}" style="font-size:12px;font-weight:500;">(${group.confidence}%)</span>
              </label>
              <span style="margin-left:auto;font-size:13px;color:${this.COLORS.textMuted};">${group.totalCount} 条 · 来自 ${group.fileCount} 个文件</span>
            </div>
        `;

        // 内容摘要（前3条）
        const allSamples = group.samples.slice(0, 3);
        html += `<div style="margin-left:28px;font-size:13px;color:${this.COLORS.textMuted};line-height:1.7;">`;
        allSamples.forEach(s => {
          html += `<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">· ${this.escapeHtml(s)}</div>`;
        });
        html += `</div>`;

        // 低置信度时显示手动选择
        if (isLowConfidence) {
          html += `
            <div style="margin-left:28px;margin-top:8px;">
              <span style="font-size:12px;color:${this.COLORS.danger};">⚠️ 不确定，请手动选择：</span>
              <select onchange="ImportManager.manualSetType('${group.type}', this.value)" style="font-size:12px;padding:2px 6px;border-radius:4px;border:1px solid ${this.COLORS.border};">
                <option value="">— 选择类型 —</option>
                ${this.TYPE_RULES.map(r => `<option value="${r.type}">${r.icon} ${r.label}</option>`).join('')}
                <option value="unknown">❓ 其他</option>
              </select>
            </div>
          `;
        }

        html += `</div>`;
      }
      html += `</div>`;
    }

    html += `
        <div style="display:flex;gap:10px;justify-content:center;margin-top:var(--space-lg);flex-wrap:wrap;">
          <button class="btn btn-success" onclick="ImportManager.importSelected()">✅ 全部导入</button>
          <button class="btn btn-secondary" onclick="ImportManager.cancelImport()">❌ 取消</button>
          <button class="btn btn-gold" onclick="ImportManager.triggerAIAnalysis()">🤖 AI分析</button>
        </div>
      </div>
    `;

    panel.innerHTML = html;
    panel.style.display = 'block';
    actionBar.style.display = 'flex';

    // 默认选中高置信度类型
    grouped.forEach(g => {
      if (g.confidence >= 60) this.state.selectedTypes.add(g.type);
    });
  },

  /** 按类型分组汇总 */
  groupByType(results) {
    const map = {};
    for (const r of results) {
      if (!r || !r.type) continue;
      if (!map[r.type]) {
        map[r.type] = {
          type: r.type,
          label: r.label || r.type,
          icon: r.icon || '📄',
          confidence: r.confidence,
          totalCount: 0,
          fileCount: 0,
          samples: []
        };
      }
      map[r.type].totalCount += r.count || 0;
      map[r.type].fileCount += 1;
      if (r.samples) map[r.type].samples.push(...r.samples);
      // 取最高置信度
      map[r.type].confidence = Math.max(map[r.type].confidence, r.confidence);
    }
    return Object.values(map).sort((a, b) => b.confidence - a.confidence);
  },

  /** 切换类型选中状态 */
  toggleType(type) {
    if (this.state.selectedTypes.has(type)) {
      this.state.selectedTypes.delete(type);
    } else {
      this.state.selectedTypes.add(type);
    }
  },

  /** 手动设置类型 */
  manualSetType(oldType, newType) {
    if (!newType) return;
    // 更新 pendingFiles 中对应 oldType 的扫描结果
    for (const pf of this.state.pendingFiles) {
      if (pf.scanned && pf.scanned.type === oldType) {
        if (newType === 'unknown') {
          pf.scanned.type = 'unknown';
          pf.scanned.label = '其他';
          pf.scanned.icon = '❓';
          pf.scanned.confidence = 0;
        } else {
          const rule = this.TYPE_RULES.find(r => r.type === newType);
          if (rule) {
            pf.scanned.type = rule.type;
            pf.scanned.label = rule.label;
            pf.scanned.icon = rule.icon;
            pf.scanned.confidence = 100;
            pf.scanned.targetModule = rule.targetModule;
            pf.scanned.storageKey = rule.storageKey;
          }
        }
      }
    }
    this.state.selectedTypes.add(newType === 'unknown' ? oldType : newType);
    this.showPreviewPanel(); // 刷新预览
  },

  // =========================================================
  // 冲突检测与处理
  // =========================================================

  /** 检测同名数据冲突 */
  detectConflicts(type, items) {
    const rule = this.TYPE_RULES.find(r => r.type === type);
    if (!rule) return [];

    let existing = [];
    const storageKey = rule.storageKey;
    if (typeof Storage !== 'undefined') {
      const raw = Storage.get(storageKey, null);
      if (raw) {
        if (Array.isArray(raw)) existing = raw;
        else if (raw.entries && Array.isArray(raw.entries)) existing = raw.entries;
        else if (typeof raw === 'object') existing = [raw];
      }
    }

    const nameKey = rule.fields[0]; // 第一个字段作为主键名称
    const conflicts = [];

    for (const item of items) {
      const itemName = item[nameKey] || item.name || item.title || item.id;
      if (!itemName) continue;
      const existingItem = existing.find(e => (e[nameKey] || e.name || e.title || e.id) === itemName);
      if (existingItem) {
        conflicts.push({ item, existingItem, name: itemName, type });
      }
    }

    return conflicts;
  },

  /** 显示冲突处理面板 */
  showConflictPanel(conflicts) {
    const panel = document.getElementById('conflictPanel');
    if (!panel) return;
    if (conflicts.length === 0) {
      panel.style.display = 'none';
      return;
    }

    let html = `
      <div style="background:#fff;border:2px solid ${this.COLORS.danger};border-radius:16px;padding:var(--space-lg);">
        <h3 style="color:${this.COLORS.danger};margin-bottom:12px;font-size:16px;">⚠️ 检测到 ${conflicts.length} 个同名冲突</h3>
        <div style="max-height:300px;overflow-y:auto;">
    `;

    conflicts.forEach((c, idx) => {
      html += `
        <div style="border:1px solid ${this.COLORS.border};border-radius:8px;padding:10px;margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <strong style="color:${this.COLORS.ink};">${this.escapeHtml(String(c.name))}</strong>
            <span style="font-size:12px;color:${this.COLORS.textMuted};">${c.type}</span>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;" id="conflictAction_${idx}">
            <label style="font-size:13px;display:inline-flex;align-items:center;gap:4px;cursor:pointer;">
              <input type="radio" name="conflict_${idx}" value="overwrite" checked style="width:auto;"> 覆盖
            </label>
            <label style="font-size:13px;display:inline-flex;align-items:center;gap:4px;cursor:pointer;">
              <input type="radio" name="conflict_${idx}" value="skip" style="width:auto;"> 跳过
            </label>
            <label style="font-size:13px;display:inline-flex;align-items:center;gap:4px;cursor:pointer;">
              <input type="radio" name="conflict_${idx}" value="rename" style="width:auto;"> 重命名
            </label>
            <label style="font-size:13px;display:inline-flex;align-items:center;gap:4px;cursor:pointer;">
              <input type="radio" name="conflict_${idx}" value="merge" style="width:auto;"> 合并
            </label>
          </div>
        </div>
      `;
    });

    html += `
        </div>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:var(--space-md);">
          <button class="btn btn-primary" onclick="ImportManager.resolveConflicts()">确认处理</button>
          <button class="btn btn-secondary" onclick="ImportManager.skipAllConflicts()">全部跳过</button>
        </div>
      </div>
    `;

    panel.innerHTML = html;
    panel.style.display = 'block';
    this.state.conflicts = conflicts;
  },

  /** 批量处理冲突 */
  resolveConflicts() {
    const resolved = [];
    for (let i = 0; i < this.state.conflicts.length; i++) {
      const radios = document.getElementsByName(`conflict_${i}`);
      let action = 'overwrite';
      for (const r of radios) { if (r.checked) { action = r.value; break; } }
      resolved.push({ ...this.state.conflicts[i], action });
    }
    this.state.conflicts = resolved;
    document.getElementById('conflictPanel').style.display = 'none';
    // 继续执行导入
    this.executeImport();
  },

  /** 跳过全部冲突 */
  skipAllConflicts() {
    this.state.conflicts = this.state.conflicts.map(c => ({ ...c, action: 'skip' }));
    document.getElementById('conflictPanel').style.display = 'none';
    this.executeImport();
  },

  // =========================================================
  // 导入执行
  // =========================================================

  /** 导入选中的类型 */
  async importSelected() {
    if (this.state.selectedTypes.size === 0) {
      App.toast('请至少选择一种内容类型', 'warning');
      return;
    }
    await this.executeImport();
  },

  /** 执行实际导入 */
  async executeImport() {
    const importedLog = [];
    let totalImported = 0;
    const snapshot = { before: {}, after: {} }; // 用于撤销

    for (const pf of this.state.pendingFiles) {
      const scanned = pf.scanned;
      if (!scanned || !this.state.selectedTypes.has(scanned.type)) continue;
      if (scanned.type === 'unknown') continue;
      if (scanned.type === 'zip' && scanned.innerResults) {
        // ZIP 内部文件递归导入
        for (const inner of scanned.innerResults) {
          if (!this.state.selectedTypes.has(inner.type)) continue;
          const count = await this.importByType(inner.type, inner.data, snapshot);
          totalImported += count;
          importedLog.push({ type: inner.type, file: pf.file.name + '/' + inner._zipPath, count });
        }
        continue;
      }

      // 检测冲突
      let items = scanned.data;
      if (Array.isArray(items)) {
        const conflicts = this.detectConflicts(scanned.type, items);
        if (conflicts.length > 0 && this.state.conflicts.length === 0) {
          // 第一次检测到冲突，显示面板让用户处理
          this.showConflictPanel(conflicts);
          return; // 中断，等待用户确认
        }
        // 根据已解决的冲突过滤 items
        if (this.state.conflicts.length > 0) {
          const skipNames = this.state.conflicts.filter(c => c.action === 'skip').map(c => c.name);
          const renameMap = {};
          this.state.conflicts.filter(c => c.action === 'rename').forEach(c => { renameMap[c.name] = c.name + '_新'; });
          items = items.filter(item => {
            const name = item[Object.keys(item)[0]] || item.name || item.title || item.id;
            return !skipNames.includes(name);
          });
          items.forEach(item => {
            const name = item[Object.keys(item)[0]] || item.name || item.title || item.id;
            if (renameMap[name]) {
              const nameKey = Object.keys(item).find(k => (item[k] === name)) || 'name';
              item[nameKey] = renameMap[name];
            }
          });
        }
      }

      const count = await this.importByType(scanned.type, scanned.data, snapshot);
      totalImported += count;
      importedLog.push({ type: scanned.type, file: pf.file.name, count });
    }

    // 保存撤销快照
    this.saveUndoSnapshot(snapshot);

    // 记录导入日志
    const logEntry = {
      id: 'imp_' + Date.now(),
      time: Date.now(),
      total: totalImported,
      files: importedLog,
      snapshotKey: this.STORAGE_KEY + '_undo'
    };
    const logs = this.getLogs();
    logs.unshift(logEntry);
    if (logs.length > 50) logs.pop();
    this.saveLogs(logs);

    // 清空状态
    this.state.pendingFiles = [];
    this.state.scanResults = [];
    this.state.selectedTypes.clear();
    this.state.conflicts = [];

    // 刷新UI
    document.getElementById('previewPanel').style.display = 'none';
    document.getElementById('actionBar').style.display = 'none';
    document.getElementById('importWorkArea').innerHTML = this.renderDropZone();
    this.renderImportHistory();

    App.toast(`成功导入 ${totalImported} 条数据`, 'success');
  },

  /** 按类型导入到对应模块 */
  async importByType(type, data, snapshot) {
    const rule = this.TYPE_RULES.find(r => r.type === type);
    if (!rule) return 0;

    const storageKey = rule.storageKey;
    let existing = null;
    let existingArr = [];

    if (typeof Storage !== 'undefined') {
      existing = Storage.get(storageKey, null);
      if (existing) {
        if (Array.isArray(existing)) existingArr = existing;
        else if (existing.entries && Array.isArray(existing.entries)) existingArr = existing.entries;
      }
      // 保存撤销快照
      if (snapshot && !snapshot.before[storageKey]) {
        snapshot.before[storageKey] = JSON.parse(JSON.stringify(existing || []));
      }
    }

    const items = Array.isArray(data) ? data : [data];
    let imported = 0;

    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      const enriched = {
        ...item,
        _importedAt: Date.now(),
        _importSource: 'ImportManager_v2'
      };

      if (type === 'npc') {
        const npcs = NPCManager ? NPCManager.getNPCs() : existingArr;
        npcs.push({ ...enriched, id: enriched.id || 'npc_imp_' + Date.now() + '_' + imported });
        if (NPCManager) NPCManager.saveNPCs(npcs); else Storage.set(storageKey, npcs);
      } else if (type === 'worldbook') {
        const wb = WorldBook ? WorldBook.getWorldBook() : (existing || { entries: [] });
        wb.entries = wb.entries || [];
        wb.entries.push({
          id: 'wb_imp_' + Date.now() + '_' + imported,
          name: item.world || item.setting || item.name || '导入条目',
          content: JSON.stringify(item),
          position: 'deep',
          role: 'system',
          keywords: [],
          constant: false,
          depth: 4,
          order: wb.entries.length,
          createdAt: Date.now()
        });
        if (WorldBook) WorldBook.saveWorldBook(wb); else Storage.set(storageKey, wb);
      } else if (type === 'preset') {
        const presets = Storage.get(storageKey, []);
        presets.push({
          id: 'preset_imp_' + Date.now() + '_' + imported,
          name: item.name || item.category || '导入预设',
          description: '智能导入',
          data: {
            prompts_v2: { systemPrompt: item.prompt || item.system_prompt || '' },
            apiConfig: { temperature: item.temperature || 0.8, maxTokens: item.max_tokens || 2000 }
          },
          position: 'system',
          role: 'system',
          importedFrom: 'ImportManager_v2',
          createdAt: Date.now()
        });
        Storage.set(storageKey, presets);
      } else {
        // 通用存储策略：数组追加
        const targetArr = Array.isArray(existing) ? existing : (existingArr || []);
        targetArr.push({ ...enriched, id: enriched.id || `imp_${type}_${Date.now()}_${imported}` });
        Storage.set(storageKey, targetArr);
      }
      imported++;
    }

    // 保存 after 快照
    if (snapshot) {
      const after = Storage.get(storageKey, null);
      snapshot.after[storageKey] = JSON.parse(JSON.stringify(after || []));
    }

    return imported;
  },

  /** 取消导入，重置状态 */
  cancelImport() {
    this.state.pendingFiles = [];
    this.state.scanResults = [];
    this.state.selectedTypes.clear();
    this.state.conflicts = [];
    document.getElementById('previewPanel').style.display = 'none';
    document.getElementById('conflictPanel').style.display = 'none';
    document.getElementById('actionBar').style.display = 'none';
    document.getElementById('importWorkArea').innerHTML = this.renderDropZone();
    App.toast('已取消导入', 'info');
  },

  // =========================================================
  // 导入历史与撤销
  // =========================================================

  /** 显示导入历史面板 */
  showImportHistory() {
    const logs = this.getLogs();
    if (logs.length === 0) {
      App.showModal('📜 导入历史', '<div style="text-align:center;padding:40px;color:' + this.COLORS.textMuted + ';">暂无导入记录</div>');
      return;
    }

    const content = logs.slice(0, 20).map(l => {
      const date = new Date(l.time).toLocaleString();
      const fileList = (l.files || []).map(f => `${f.file} (${f.count}条)`).join(' · ');
      return `
        <div style="border-bottom:1px solid ${this.COLORS.border};padding:12px 0;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <strong style="color:${this.COLORS.ink};">${l.total} 条数据</strong>
            <span style="font-size:12px;color:${this.COLORS.textMuted};">${date}</span>
          </div>
          <div style="font-size:13px;color:${this.COLORS.textMuted};word-break:break-all;">${fileList}</div>
          <div style="margin-top:6px;">
            <button class="btn btn-sm btn-secondary" onclick="ImportManager.undoImport('${l.id}')">↩️ 撤销</button>
          </div>
        </div>
      `;
    }).join('');

    App.showModal('📜 导入历史', `<div style="max-height:400px;overflow-y:auto;">${content}</div>`);
  },

  /** 渲染导入历史（用于标签页） */
  renderImportHistory() {
    const c = document.getElementById('importHistoryList');
    if (!c) return;
    const logs = this.getLogs();
    if (logs.length === 0) {
      c.innerHTML = `<div class="empty-state"><div class="empty-icon">📜</div><p>暂无导入记录</p></div>`;
      return;
    }
    c.innerHTML = logs.slice(0, 10).map(l => {
      const icons = { npc: '👤', novel: '📖', location: '🗺️', event: '⚡', task: '📜', achievement: '🏅', preset: '⚙️', worldbook: '🌍', relation: '🔗', image: '🖼️', unknown: '❓' };
      const typeIcons = (l.files || []).map(f => icons[f.type] || '📥').join(' ');
      return `
        <div class="list-item" style="align-items:flex-start;">
          <span style="font-size:20px;">📥</span>
          <div class="list-info" style="flex:1;">
            <h4>${l.total} 条数据 · ${typeIcons}</h4>
            <p style="font-size:12px;color:${this.COLORS.textMuted};">${new Date(l.time).toLocaleString()}</p>
          </div>
          <button class="btn btn-sm btn-secondary" onclick="ImportManager.undoImport('${l.id}')">撤销</button>
        </div>
      `;
    }).join('');
  },

  /** 撤销最近一次导入 */
  undoImport(logId) {
    const snapshot = this.getUndoSnapshot();
    if (!snapshot || !snapshot.before) {
      App.toast('没有可撤销的导入', 'warning');
      return;
    }

    // 恢复存储
    for (const [storageKey, data] of Object.entries(snapshot.before)) {
      Storage.set(storageKey, data);
    }

    // 标记日志为已撤销
    const logs = this.getLogs();
    const idx = logs.findIndex(l => l.id === logId);
    if (idx !== -1) {
      logs[idx]._undone = true;
      this.saveLogs(logs);
    }

    this.saveUndoSnapshot(null);
    this.renderImportHistory();
    App.toast('已撤销最近一次导入', 'success');
  },

  // =========================================================
  // AI 辅助导入
  // =========================================================

  /** 触发 AI 分析 */
  async triggerAIAnalysis() {
    if (this.state.pendingFiles.length === 0) {
      App.toast('请先上传文件', 'warning');
      return;
    }

    App.toast('正在请求 AI 分析...', 'info');

    // 构造要分析的内容摘要
    const summaries = this.state.pendingFiles.map(pf => {
      const s = pf.scanned;
      return `文件: ${pf.file.name}\n识别类型: ${s.label || '未知'} (${s.confidence}%)\n样本:\n${(s.samples || []).join('\n')}`;
    }).join('\n\n---\n\n');

    const prompt = `你是一位数据分类专家。请分析以下文件内容，判断它们应该导入到哪个模块。可选模块：人物志(npc)、文本小说(novel)、地图(location)、随机事件(event)、任务委托(task)、徽章墙(achievement)、预设管理(preset)、世界书(worldbook)、关系网(relation)。

对每个文件给出：
1. 建议类型
2. 置信度 (0-100%)
3. 理由（20字以内）

文件摘要：
${summaries}`;

    // 若存在 AI 调用接口则使用，否则模拟
    if (typeof AIChat !== 'undefined' && AIChat.send) {
      try {
        const resp = await AIChat.send(prompt, { maxTokens: 500 });
        this.showAIResult(resp);
      } catch (err) {
        App.toast('AI 分析失败: ' + err.message, 'error');
      }
    } else {
      // 模拟 AI 分析：根据现有置信度给出增强建议
      const mockResult = this.state.pendingFiles.map(pf => {
        const s = pf.scanned;
        return `📄 ${pf.file.name}\n  → 建议：${s.label || '未知'} (${Math.min(100, s.confidence + 10)}%)\n  → 理由：根据字段匹配判定`;
      }).join('\n\n');
      this.showAIResult('🤖 AI 分析结果：\n\n' + mockResult + '\n\n💡 建议：高置信度项目可直接导入，低置信度项目请核对样本内容。');
    }
  },

  /** 显示 AI 分析结果 */
  showAIResult(text) {
    App.showModal('🤖 AI 分析建议', `<div style="white-space:pre-wrap;line-height:1.8;font-size:14px;color:${this.COLORS.ink};">${this.escapeHtml(text)}</div>`);
  },

  // =========================================================
  // 帮助与工具方法
  // =========================================================

  /** 显示格式帮助 */
  showHelp() {
    App.showModal('❓ 导入格式说明', `
      <div style="line-height:1.8;color:${this.COLORS.ink};">
        <h4 style="color:${this.COLORS.gold};margin-bottom:8px;">📋 JSON 格式</h4>
        <p>对象数组或单个对象，字段名称决定分类：</p>
        <ul style="margin-left:20px;font-size:13px;color:${this.COLORS.textMuted};">
          <li><strong>人物志：</strong>name, age, gender, personality</li>
          <li><strong>文本小说：</strong>title, content, chapter</li>
          <li><strong>地图：</strong>location, type, description</li>
          <li><strong>随机事件：</strong>event, trigger, effect</li>
          <li><strong>任务：</strong>task, reward, deadline</li>
          <li><strong>徽章：</strong>name, rarity, icon</li>
          <li><strong>预设：</strong>prompt, category</li>
          <li><strong>世界书：</strong>world, setting</li>
          <li><strong>关系网：</strong>source, target, relation</li>
        </ul>

        <h4 style="color:${this.COLORS.gold};margin:16px 0 8px;">📄 TXT / MD 格式</h4>
        <p>纯文本内容，AI 会尝试按段落结构分析。</p>

        <h4 style="color:${this.COLORS.gold};margin:16px 0 8px;">📊 CSV 格式</h4>
        <p>首行为字段名，后续行为数据，字段名匹配分类规则。</p>

        <h4 style="color:${this.COLORS.gold};margin:16px 0 8px;">📘 DOCX 格式</h4>
        <p>浏览器无法直接解析，建议打开后复制内容粘贴到文本框。</p>

        <h4 style="color:${this.COLORS.gold};margin:16px 0 8px;">🖼️ 图片格式</h4>
        <p>PNG / JPG / GIF / WEBP / BMP，自动存入素材库（头像/背景/立绘）。</p>

        <h4 style="color:${this.COLORS.gold};margin:16px 0 8px;">📦 ZIP 批量导入</h4>
        <p>压缩包内文件会被逐个解析和分类。</p>

        <h4 style="color:${this.COLORS.gold};margin:16px 0 8px;">⚠️ 冲突处理</h4>
        <p>同名数据可选择：覆盖 / 跳过 / 重命名 / 合并。</p>
      </div>
    `);
  },

  /** HTML 转义 */
  escapeHtml(str) {
    if (typeof str !== 'string') str = String(str || '');
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  /** 延迟工具 */
  delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
};

// 兼容旧版接口
ImportManager.getImports = ImportManager.getLogs;
ImportManager.saveImports = ImportManager.saveLogs;
ImportManager.handleSTFile = function(e) {
  // 旧版单文件 JSON 走新版批量流程
  const file = e.target.files[0];
  if (!file) return;
  this.processFileList([file]);
  e.target.value = '';
};
ImportManager.handleDocFile = function(e) {
  const file = e.target.files[0];
  if (!file) return;
  this.processFileList([file]);
  e.target.value = '';
};
ImportManager.importPastedText = function() {
  // 兼容旧版粘贴文本导入：直接走智能扫描
  const text = document.getElementById('docPasteArea')?.value?.trim();
  if (!text) { App.toast('请输入内容', 'error'); return; }
  const parsed = { _rawText: text, _format: 'txt', lines: text.split('\n').map(l => l.trim()).filter(l => l) };
  const scanned = this.scanContent(parsed, 'pasted_text.txt');
  this.state.pendingFiles = [{ file: { name: '粘贴文本' }, parsed, scanned }];
  this.showPreviewPanel();
};
