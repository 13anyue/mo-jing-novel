/**
 * text-novel.js
 * 文本小说阅读器页面控制器，古风墨境主题
 * @version 1.0.0
 * @author DuMate
 *
 * 依赖：MarkdownRenderer（markdown-renderer.js）
 *
 * 配色方案：
 *   - 背景色：#F5E6D3（暖羊皮纸底色）
 *   - 文字色：#2C1810（墨色）
 *   - 强调色：#C9A227（金色）
 *   - 次要色：#8B7355（次要文字）
 * 字体：Noto Serif SC
 */

// 全局 TextNovel 对象
const TextNovel = {

    // ========== 状态与配置 ==========

    /** @type {Array<Object>} 章节数据数组，每个元素含 {id, title, content} */
    chapters: [],

    /** @type {number} 当前章节索引 */
    currentChapterIndex: 0,

    /** @type {Object} 阅读设置 {fontSize, lineHeight, darkMode} */
    settings: {
        fontSize: 16,      // 字体大小（px）
        lineHeight: 1.8,   // 行高
        darkMode: false    // 昼夜模式（false=日间，true=夜间）
    },

    /** @type {string} localStorage 进度保存键名 */
    progressKey: 'textNovel_progress_v10',

    /** @type {string} localStorage 设置保存键名 */
    settingsKey: 'textNovel_settings_v10',

    /** @type {string} 页面容器选择器 */
    containerSelector: '#page-text-novel',

    /** @type {boolean} 侧边栏展开状态 */
    sidebarOpen: true,

    /** @type {boolean} 设置面板展开状态 */
    settingsOpen: false,

    // ========== 生命周期方法 ==========

    /**
     * 初始化阅读器：加载示例数据、恢复进度与设置、绑定事件
     */
    init() {
        this._loadDemoData();       // 加载示例数据
        this._loadSettings();       // 恢复设置
        this.loadProgress();        // 恢复阅读进度
        this.renderPage();          // 渲染完整页面
        this._bindEvents();         // 绑定交互事件
    },

    /**
     * 页面进入时的回调（供路由系统调用）
     */
    onEnter() {
        this.renderPage();
        this._bindEvents();
        this.loadProgress();
        this._scrollToTop();
    },

    // ========== 页面渲染 ==========

    /**
     * 渲染完整阅读器页面到 #page-text-novel
     */
    renderPage() {
        const container = document.querySelector(this.containerSelector);
        if (!container) {
            console.warn('[TextNovel] 页面容器不存在：', this.containerSelector);
            return;
        }

        const isDark = this.settings.darkMode;
        const bgColor = isDark ? '#1a1410' : '#F5E6D3';
        const textColor = isDark ? '#E8DCC8' : '#2C1810';
        const panelBg = isDark ? '#2a2018' : '#FFF8F0';
        const borderColor = isDark ? '#5a4a3a' : '#C9A227';

        container.innerHTML = `
            <div class="text-novel-wrapper" style="
                font-family:'Noto Serif SC',serif;
                color:${textColor};
                background:${bgColor};
                min-height:100vh;
                display:flex;
                flex-direction:column;
                position:relative;
                overflow:hidden;
            ">
                <!-- 顶部工具栏 -->
                <header class="novel-toolbar" style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    padding:12px 20px;
                    background:${panelBg};
                    border-bottom:1px solid ${borderColor};
                    position:sticky;
                    top:0;
                    z-index:100;
                    box-shadow:0 2px 8px rgba(0,0,0,0.1);
                ">
                    <div class="toolbar-left" style="display:flex;align-items:center;gap:12px;flex:1;">
                        <button id="btn-toggle-sidebar" class="novel-btn" title="章节列表" style="
                            background:none;
                            border:none;
                            color:${textColor};
                            font-size:20px;
                            cursor:pointer;
                            padding:4px 8px;
                            border-radius:4px;
                            transition:background 0.2s;
                        ">☰</button>
                        <h1 id="chapter-title" class="novel-chapter-title" style="
                            font-size:18px;
                            font-weight:600;
                            margin:0;
                            color:${isDark ? '#C9A227' : '#2C1810'};
                            overflow:hidden;
                            text-overflow:ellipsis;
                            white-space:nowrap;
                        ">${this._getCurrentTitle()}</h1>
                    </div>
                    <div class="toolbar-right" style="display:flex;align-items:center;gap:8px;">
                        <button id="btn-settings" class="novel-btn" title="阅读设置" style="
                            background:none;
                            border:none;
                            color:${textColor};
                            font-size:18px;
                            cursor:pointer;
                            padding:4px 8px;
                            border-radius:4px;
                            transition:background 0.2s;
                        ">⚙</button>
                    </div>
                </header>

                <!-- 主体区域：侧边栏 + 阅读区 -->
                <div class="novel-body" style="display:flex;flex:1;overflow:hidden;">
                    <!-- 左侧章节列表侧边栏 -->
                    <aside id="novel-sidebar" class="novel-sidebar" style="
                        width:260px;
                        min-width:260px;
                        background:${panelBg};
                        border-right:1px solid ${borderColor};
                        overflow-y:auto;
                        transition:margin-left 0.3s ease;
                        padding:16px 0;
                    ">
                        <div class="sidebar-header" style="
                            padding:0 16px 12px;
                            font-size:14px;
                            font-weight:600;
                            color:${isDark ? '#C9A227' : '#8B7355'};
                            border-bottom:1px solid ${borderColor};
                            margin-bottom:8px;
                        ">📖 章节目录</div>
                        <ul class="chapter-list" style="list-style:none;margin:0;padding:0;">
                            ${this._renderChapterList()}
                        </ul>
                        <div class="sidebar-footer" style="
                            padding:12px 16px;
                            border-top:1px solid ${borderColor};
                            margin-top:8px;
                            display:flex;
                            gap:8px;
                        ">
                            <button id="btn-add-chapter" class="novel-btn-small" style="
                                flex:1;
                                padding:6px 10px;
                                font-size:13px;
                                background:${isDark ? '#3a3028' : '#FFF0D4'};
                                color:${textColor};
                                border:1px solid ${borderColor};
                                border-radius:6px;
                                cursor:pointer;
                                font-family:'Noto Serif SC',serif;
                            ">+ 新增</button>
                            <button id="btn-export" class="novel-btn-small" style="
                                flex:1;
                                padding:6px 10px;
                                font-size:13px;
                                background:${isDark ? '#3a3028' : '#FFF0D4'};
                                color:${textColor};
                                border:1px solid ${borderColor};
                                border-radius:6px;
                                cursor:pointer;
                                font-family:'Noto Serif SC',serif;
                            ">📥 导出</button>
                        </div>
                    </aside>

                    <!-- 阅读区域 -->
                    <main id="novel-reader" class="novel-reader" style="
                        flex:1;
                        overflow-y:auto;
                        padding:32px 48px;
                        position:relative;
                        cursor:default;
                    ">
                        <div id="reader-content" class="reader-content" style="
                            max-width:720px;
                            margin:0 auto;
                            font-size:${this.settings.fontSize}px;
                            line-height:${this.settings.lineHeight};
                            color:${textColor};
                        ">
                            ${this._renderCurrentChapter()}
                        </div>

                        <!-- 翻页热区（左右边缘） -->
                        <div id="hotzone-prev" class="hotzone hotzone-prev" title="上一章" style="
                            position:absolute;
                            left:0;
                            top:0;
                            bottom:60px;
                            width:60px;
                            cursor:w-resize;
                            opacity:0;
                            transition:opacity 0.3s;
                            z-index:10;
                        "></div>
                        <div id="hotzone-next" class="hotzone hotzone-next" title="下一章" style="
                            position:absolute;
                            right:0;
                            top:0;
                            bottom:60px;
                            width:60px;
                            cursor:e-resize;
                            opacity:0;
                            transition:opacity 0.3s;
                            z-index:10;
                        "></div>

                        <!-- 章节导航按钮 -->
                        <div class="chapter-nav" style="
                            display:flex;
                            justify-content:space-between;
                            align-items:center;
                            max-width:720px;
                            margin:32px auto 0;
                            padding:16px 0;
                            border-top:1px solid ${borderColor};
                        ">
                            <button id="btn-prev-chapter" class="nav-btn" style="
                                padding:8px 20px;
                                font-size:14px;
                                background:${isDark ? '#3a3028' : '#FFF0D4'};
                                color:${textColor};
                                border:1px solid ${borderColor};
                                border-radius:6px;
                                cursor:pointer;
                                font-family:'Noto Serif SC',serif;
                                opacity:${this.currentChapterIndex > 0 ? 1 : 0.4};
                                pointer-events:${this.currentChapterIndex > 0 ? 'auto' : 'none'};
                            ">◀ 上一章</button>
                            <span class="chapter-indicator" style="
                                font-size:13px;
                                color:${isDark ? '#8B7355' : '#8B7355'};
                            ">第 ${this.currentChapterIndex + 1} / ${this.chapters.length} 章</span>
                            <button id="btn-next-chapter" class="nav-btn" style="
                                padding:8px 20px;
                                font-size:14px;
                                background:${isDark ? '#3a3028' : '#FFF0D4'};
                                color:${textColor};
                                border:1px solid ${borderColor};
                                border-radius:6px;
                                cursor:pointer;
                                font-family:'Noto Serif SC',serif;
                                opacity:${this.currentChapterIndex < this.chapters.length - 1 ? 1 : 0.4};
                                pointer-events:${this.currentChapterIndex < this.chapters.length - 1 ? 'auto' : 'none'};
                            ">下一章 ▶</button>
                        </div>
                    </main>
                </div>

                <!-- 底部进度条 -->
                <footer class="novel-footer" style="
                    padding:8px 20px;
                    background:${panelBg};
                    border-top:1px solid ${borderColor};
                    display:flex;
                    align-items:center;
                    gap:12px;
                    font-size:12px;
                    color:${isDark ? '#8B7355' : '#8B7355'};
                ">
                    <span>阅读进度</span>
                    <div class="progress-bar" style="
                        flex:1;
                        height:4px;
                        background:${isDark ? '#3a3028' : '#E8DCC8'};
                        border-radius:2px;
                        overflow:hidden;
                    ">
                        <div class="progress-fill" style="
                            width:${((this.currentChapterIndex + 1) / this.chapters.length * 100).toFixed(1)}%;
                            height:100%;
                            background:#C9A227;
                            border-radius:2px;
                            transition:width 0.3s ease;
                        "></div>
                    </div>
                    <span>${this.currentChapterIndex + 1} / ${this.chapters.length}</span>
                </footer>

                <!-- 设置面板（浮动） -->
                <div id="settings-panel" class="settings-panel" style="
                    position:fixed;
                    top:60px;
                    right:20px;
                    width:280px;
                    background:${panelBg};
                    border:1px solid ${borderColor};
                    border-radius:12px;
                    padding:20px;
                    box-shadow:0 4px 20px rgba(0,0,0,0.15);
                    z-index:200;
                    display:none;
                    font-family:'Noto Serif SC',serif;
                ">
                    <div class="settings-header" style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        margin-bottom:16px;
                        padding-bottom:12px;
                        border-bottom:1px solid ${borderColor};
                    ">
                        <span style="font-weight:600;font-size:15px;color:${isDark ? '#C9A227' : '#2C1810'};">⚙ 阅读设置</span>
                        <button id="btn-close-settings" style="
                            background:none;
                            border:none;
                            font-size:18px;
                            color:${textColor};
                            cursor:pointer;
                        ">×</button>
                    </div>

                    <!-- 字体大小滑块 -->
                    <div class="setting-item" style="margin-bottom:16px;">
                        <label style="display:block;font-size:13px;color:${isDark ? '#8B7355' : '#8B7355'};margin-bottom:8px;">
                            字体大小：${this.settings.fontSize}px
                        </label>
                        <input type="range" id="slider-font-size" min="12" max="24" step="1"
                            value="${this.settings.fontSize}" style="width:100%;accent-color:#C9A227;">
                    </div>

                    <!-- 行高滑块 -->
                    <div class="setting-item" style="margin-bottom:16px;">
                        <label style="display:block;font-size:13px;color:${isDark ? '#8B7355' : '#8B7355'};margin-bottom:8px;">
                            行高：${this.settings.lineHeight}
                        </label>
                        <input type="range" id="slider-line-height" min="1.5" max="2.5" step="0.1"
                            value="${this.settings.lineHeight}" style="width:100%;accent-color:#C9A227;">
                    </div>

                    <!-- 昼夜模式切换 -->
                    <div class="setting-item" style="display:flex;align-items:center;justify-content:space-between;">
                        <label style="font-size:13px;color:${isDark ? '#8B7355' : '#8B7355'};">🌙 夜间模式</label>
                        <label class="toggle-switch" style="
                            position:relative;
                            display:inline-block;
                            width:44px;
                            height:24px;
                        ">
                            <input type="checkbox" id="toggle-dark-mode" ${this.settings.darkMode ? 'checked' : ''}
                                style="opacity:0;width:0;height:0;">
                            <span class="toggle-slider" style="
                                position:absolute;
                                cursor:pointer;
                                top:0;left:0;right:0;bottom:0;
                                background:${this.settings.darkMode ? '#C9A227' : '#ccc'};
                                border-radius:24px;
                                transition:background 0.3s;
                            "></span>
                        </label>
                    </div>
                </div>

                <!-- 导入对话框 -->
                <div id="import-dialog" class="import-dialog" style="
                    position:fixed;
                    top:50%;left:50%;
                    transform:translate(-50%,-50%);
                    width:480px;
                    max-width:90vw;
                    background:${panelBg};
                    border:1px solid ${borderColor};
                    border-radius:12px;
                    padding:24px;
                    box-shadow:0 8px 32px rgba(0,0,0,0.2);
                    z-index:300;
                    display:none;
                    font-family:'Noto Serif SC',serif;
                ">
                    <h3 style="margin:0 0 16px;font-size:16px;color:${isDark ? '#C9A227' : '#2C1810'};">📥 导入 Markdown 小说</h3>
                    <textarea id="import-textarea" placeholder="粘贴 Markdown 格式的小说文本...&#10;以 # 章节标题 作为分章标记"
                        style="
                            width:100%;
                            min-height:200px;
                            padding:12px;
                            font-family:'Noto Serif SC',serif;
                            font-size:14px;
                            line-height:1.6;
                            color:${textColor};
                            background:${bgColor};
                            border:1px solid ${borderColor};
                            border-radius:8px;
                            resize:vertical;
                            box-sizing:border-box;
                        "></textarea>
                    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
                        <button id="btn-import-cancel" class="novel-btn-small" style="
                            padding:8px 16px;
                            font-size:13px;
                            background:transparent;
                            color:${textColor};
                            border:1px solid ${borderColor};
                            border-radius:6px;
                            cursor:pointer;
                            font-family:'Noto Serif SC',serif;
                        ">取消</button>
                        <button id="btn-import-confirm" class="novel-btn-small" style="
                            padding:8px 16px;
                            font-size:13px;
                            background:#C9A227;
                            color:#FFF;
                            border:none;
                            border-radius:6px;
                            cursor:pointer;
                            font-family:'Noto Serif SC',serif;
                        ">导入</button>
                    </div>
                </div>

                <!-- 遮罩层 -->
                <div id="dialog-overlay" style="
                    position:fixed;
                    top:0;left:0;right:0;bottom:0;
                    background:rgba(0,0,0,0.4);
                    z-index:250;
                    display:none;
                "></div>
            </div>

            <!-- 夜间模式切换按钮样式修正 -->
            <style>
                .text-novel-wrapper .toggle-slider::before {
                    content: "";
                    position: absolute;
                    height: 18px;
                    width: 18px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    border-radius: 50%;
                    transition: transform 0.3s;
                }
                .text-novel-wrapper input:checked + .toggle-slider::before {
                    transform: translateX(20px);
                }
                .text-novel-wrapper .novel-btn:hover,
                .text-novel-wrapper .novel-btn-small:hover,
                .text-novel-wrapper .nav-btn:hover {
                    opacity: 0.8;
                    transform: translateY(-1px);
                }
                .text-novel-wrapper .chapter-item:hover {
                    background: rgba(201, 162, 39, 0.1);
                }
                .text-novel-wrapper .hotzone:hover {
                    opacity: 0.08 !important;
                    background: ${isDark ? '#C9A227' : '#C9A227'};
                }
            </style>
        `;
    },

    // ========== 章节操作 ==========

    /**
     * 加载指定章节内容
     * @param {number} index - 章节索引
     */
    loadChapter(index) {
        if (index < 0 || index >= this.chapters.length) {
            console.warn('[TextNovel] 章节索引越界：', index);
            return;
        }
        this.currentChapterIndex = index;
        this.saveProgress();
        this.renderPage();
        this._scrollToTop();
    },

    /**
     * 加载上一章
     */
    prevChapter() {
        if (this.currentChapterIndex > 0) {
            this.loadChapter(this.currentChapterIndex - 1);
        }
    },

    /**
     * 加载下一章
     */
    nextChapter() {
        if (this.currentChapterIndex < this.chapters.length - 1) {
            this.loadChapter(this.currentChapterIndex + 1);
        }
    },

    /**
     * 添加新章节
     * @param {string} title - 章节标题
     * @param {string} content - 章节内容（Markdown 格式）
     */
    addChapter(title, content) {
        const newId = this.chapters.length > 0
            ? Math.max(...this.chapters.map(c => c.id)) + 1
            : 1;
        this.chapters.push({ id: newId, title: title || `第${newId}章`, content: content || '' });
        this.renderPage();
        this.saveProgress();
    },

    /**
     * 删除指定章节
     * @param {number} index - 章节索引
     */
    deleteChapter(index) {
        if (index < 0 || index >= this.chapters.length) return;
        if (this.chapters.length <= 1) {
            alert('至少保留一章');
            return;
        }
        if (!confirm(`确定要删除「${this.chapters[index].title}」吗？`)) return;

        this.chapters.splice(index, 1);

        // 调整当前章节索引
        if (this.currentChapterIndex >= this.chapters.length) {
            this.currentChapterIndex = this.chapters.length - 1;
        }
        if (this.currentChapterIndex === index && index >= this.chapters.length) {
            this.currentChapterIndex = Math.max(0, this.chapters.length - 1);
        }

        this.saveProgress();
        this.renderPage();
    },

    // ========== 进度保存与恢复 ==========

    /**
     * 保存阅读进度到 localStorage
     */
    saveProgress() {
        try {
            const progress = {
                currentChapterIndex: this.currentChapterIndex,
                timestamp: Date.now()
            };
            localStorage.setItem(this.progressKey, JSON.stringify(progress));
        } catch (e) {
            console.warn('[TextNovel] 保存进度失败：', e);
        }
    },

    /**
     * 从 localStorage 恢复阅读进度
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem(this.progressKey);
            if (saved) {
                const progress = JSON.parse(saved);
                if (typeof progress.currentChapterIndex === 'number' &&
                    progress.currentChapterIndex >= 0 &&
                    progress.currentChapterIndex < this.chapters.length) {
                    this.currentChapterIndex = progress.currentChapterIndex;
                }
            }
        } catch (e) {
            console.warn('[TextNovel] 恢复进度失败：', e);
        }
    },

    /**
     * 保存设置到 localStorage
     */
    _saveSettings() {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(this.settings));
        } catch (e) {
            console.warn('[TextNovel] 保存设置失败：', e);
        }
    },

    /**
     * 从 localStorage 恢复设置
     */
    _loadSettings() {
        try {
            const saved = localStorage.getItem(this.settingsKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.fontSize) this.settings.fontSize = Math.max(12, Math.min(24, parsed.fontSize));
                if (parsed.lineHeight) this.settings.lineHeight = Math.max(1.5, Math.min(2.5, parsed.lineHeight));
                if (typeof parsed.darkMode === 'boolean') this.settings.darkMode = parsed.darkMode;
            }
        } catch (e) {
            console.warn('[TextNovel] 恢复设置失败：', e);
        }
    },

    // ========== 导入与导出 ==========

    /**
     * 导出整本小说为 Markdown 文本并下载
     */
    exportNovel() {
        let md = '';
        this.chapters.forEach((chapter, idx) => {
            md += `# ${chapter.title}\n\n`;
            md += chapter.content + '\n\n';
            if (idx < this.chapters.length - 1) {
                md += '---\n\n';
            }
        });

        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `novel_${new Date().toISOString().slice(0, 10)}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * 从 Markdown 文本导入小说（以 # 章节标题 作为分章标记）
     * @param {string} mdText - Markdown 文本
     */
    importNovel(mdText) {
        if (!mdText || !mdText.trim()) {
            alert('导入内容为空');
            return;
        }

        // 按行拆分，寻找 # 开头的章节标题
        const lines = mdText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
        const newChapters = [];
        let currentTitle = '';
        let currentContent = [];

        lines.forEach(line => {
            const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
            if (headingMatch) {
                // 保存上一章
                if (currentTitle) {
                    newChapters.push({
                        id: newChapters.length + 1,
                        title: currentTitle,
                        content: currentContent.join('\n').trim()
                    });
                }
                currentTitle = headingMatch[2].trim();
                currentContent = [];
            } else {
                currentContent.push(line);
            }
        });

        // 保存最后一章
        if (currentTitle) {
            newChapters.push({
                id: newChapters.length + 1,
                title: currentTitle,
                content: currentContent.join('\n').trim()
            });
        }

        if (newChapters.length === 0) {
            alert('未找到以 # 开头的章节标题，无法导入');
            return;
        }

        this.chapters = newChapters;
        this.currentChapterIndex = 0;
        this.saveProgress();
        this.renderPage();
        alert(`成功导入 ${newChapters.length} 章`);
    },

    // ========== 设置面板 ==========

    /**
     * 更新字体大小
     * @param {number} size - 字体大小（12-24px）
     */
    setFontSize(size) {
        this.settings.fontSize = Math.max(12, Math.min(24, size));
        this._saveSettings();
        this._updateReaderStyle();
    },

    /**
     * 更新行高
     * @param {number} lh - 行高（1.5-2.5）
     */
    setLineHeight(lh) {
        this.settings.lineHeight = Math.max(1.5, Math.min(2.5, lh));
        this._saveSettings();
        this._updateReaderStyle();
    },

    /**
     * 切换昼夜模式
     * @param {boolean} dark - true=夜间，false=日间
     */
    setDarkMode(dark) {
        this.settings.darkMode = dark;
        this._saveSettings();
        this.renderPage(); // 需要重新渲染以应用主题色
    },

    // ========== 内部辅助方法 ==========

    /**
     * 加载示例数据（古风小说风格）
     * @private
     */
    _loadDemoData() {
        this.chapters = [
            {
                id: 1,
                title: '第一章 惊鸿初现',
                content: `长安城，暮春时节，柳絮纷飞。

沈清辞站在醉仙楼的朱漆栏杆旁，目光越过鳞次栉比的屋脊，望向远处若隐若现的终南山。山岚如墨，与她手中那盏温热的碧螺春相得益彰。

> **"浮生若梦，为欢几何？"** 她轻声念道，唇角勾起一抹若有若无的笑意。

楼下忽然传来一阵喧哗。一个身着月白锦袍的年轻公子被几名壮汉簇拥着走入大堂，腰间悬着一枚羊脂玉佩，在灯火映照下温润如水。

那人抬头，恰与沈清辞四目相对。

---

**沈清辞**，江南沈家独女，自幼随父经商，十八岁已是长安城中人人称道的"女财神"。却不知她还有另一重身份——江湖上赫赫有名的 **"墨衣剑客"**。

她缓缓放下茶盏，转身下楼。衣袂翻飞间，隐约可见袖中一抹寒光。

*今夜，注定不会平静。*`
            },
            {
                id: 2,
                title: '第二章 月下密谈',
                content: `月上柳梢头，人约黄昏后。

醉仙楼后院，一株百年老槐下，沈清辞与那月白锦袍的公子相对而坐。石桌上摆着一壶陈年花雕，两只青瓷酒杯。

"在下 **顾长卿**，家父顾远山。" 公子举杯，目光清澈如泉，"久闻沈姑娘大名，今日得见，三生有幸。"

沈清辞淡淡一笑，却不接杯："顾公子深夜相邀，所为何事？"

> "为一桩买卖。" 顾长卿压低声音，"关于前朝遗留下来的 **龙脉藏宝图** 。"

沈清辞瞳孔微缩。

---

龙脉藏宝图，传闻中记录着前朝皇室埋藏在终南山深处的无尽财富。数十年来，江湖上为此掀起无数腥风血雨，却始终无人寻得其踪迹。

沈清辞端起酒杯，一饮而尽。

"条件？"

"五五分成。" 顾长卿伸出五根手指，"而且，我已有线索。"

他缓缓从怀中取出一枚青铜钥匙，钥匙柄上刻着古老的符文，在月光下泛着幽冷的光。

---

*这是通往秘密的第一把钥匙，也是命运交织的起点。*

沈清辞凝视那枚钥匙，忽然笑了。这一笑，如春风化雨，令满庭月色都失了颜色。

"成交。"

---

两人约定三日后启程。临别时，顾长卿回头望了一眼醉仙楼的飞檐，轻声道：

> "沈姑娘，此行凶险，你当真不怕？"

沈清辞倚门而立，衣袂飘飘：

**"怕？我沈清辞这辈子，还不知道怕字怎么写。"**`
            },
            {
                id: 3,
                title: '第三章 终南夜雨',
                content: `三日后，终南山脚。

细雨如丝，山色空蒙。沈清辞与顾长卿共乘一骑，沿着蜿蜒的山道缓缓上行。马蹄踏碎落叶，惊起一林寒鸦。

"前面就是 **雾隐谷** 了。" 顾长卿勒住缰绳，指向云雾缭绕的峡谷，"据线索，藏宝图的第一处标记就在那里。"

沈清辞翻身下马，从包袱中取出一把油纸伞。伞面上绘着江南烟雨，与她此刻的心境竟出奇地吻合。

---

两人冒雨前行，不多时便来到谷口。一块巨大的青石横亘在前，石上刻着模糊的字迹，已被风雨侵蚀得难以辨认。

沈清辞蹲下身子，指尖轻抚石面，忽然停在一处凹陷上。

"这里有机关。"

她将那枚青铜钥匙插入凹陷，轻轻一扭。只听"咔嚓"一声，青石缓缓移开，露出一条幽深的石阶，通向地下。

---

石阶两侧每隔数步便有一盏长明灯，灯油不知燃烧了多少年，却依然明亮如初。空气中弥漫着潮湿与腐朽的气息，却也夹杂着一丝若有若无的檀香。

走了约莫百步，眼前豁然开朗。

一座地下宫殿出现在两人面前。穹顶镶嵌着无数夜明珠，将整座宫殿照得如同白昼。殿中央是一座白玉高台，台上放着一个檀木盒子。

---

> "找到了……" 顾长卿喃喃道，声音中带着难以抑制的激动。

沈清辞却没有动。她的目光落在高台四周的地面上，那里隐约可见复杂的纹路，似乎是某种阵法。

*危险，才刚刚开始。*

她深吸一口气，缓缓拔出袖中短剑。

**"顾公子，退后。"** 她的声音冷静如冰，"让我来。"`
            }
        ];
    },

    /**
     * 获取当前章节标题
     * @private
     * @returns {string}
     */
    _getCurrentTitle() {
        if (this.chapters.length === 0) return '无章节';
        return this.chapters[this.currentChapterIndex]?.title || '未知章节';
    },

    /**
     * 渲染当前章节内容（使用 MarkdownRenderer）
     * @private
     * @returns {string}
     */
    _renderCurrentChapter() {
        if (this.chapters.length === 0) {
            return '<p style="text-align:center;color:#8B7355;padding:40px 0;">暂无内容</p>';
        }
        const chapter = this.chapters[this.currentChapterIndex];
        if (!chapter || !chapter.content) {
            return '<p style="text-align:center;color:#8B7355;padding:40px 0;">本章内容为空</p>';
        }
        // 使用 MarkdownRenderer 渲染 Markdown 内容
        return MarkdownRenderer.render(chapter.content);
    },

    /**
     * 渲染章节列表 HTML
     * @private
     * @returns {string}
     */
    _renderChapterList() {
        if (this.chapters.length === 0) {
            return '<li style="padding:12px 16px;color:#8B7355;font-size:14px;">暂无章节</li>';
        }
        return this.chapters.map((chapter, idx) => {
            const isActive = idx === this.currentChapterIndex;
            const bgColor = isActive ? 'rgba(201,162,39,0.15)' : 'transparent';
            const textColor = isActive ? '#C9A227' : (this.settings.darkMode ? '#E8DCC8' : '#2C1810');
            const borderLeft = isActive ? '3px solid #C9A227' : '3px solid transparent';
            return `
                <li class="chapter-item" data-index="${idx}" style="
                    padding:10px 16px 10px 13px;
                    cursor:pointer;
                    font-size:14px;
                    color:${textColor};
                    background:${bgColor};
                    border-left:${borderLeft};
                    transition:all 0.2s;
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                ">
                    <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${idx + 1}. ${chapter.title}</span>
                    <button class="btn-delete-chapter" data-index="${idx}" style="
                        background:none;
                        border:none;
                        color:#8B7355;
                        font-size:16px;
                        cursor:pointer;
                        padding:2px 6px;
                        border-radius:4px;
                        opacity:0.5;
                        transition:opacity 0.2s;
                    ">×</button>
                </li>
            `;
        }).join('');
    },

    /**
     * 更新阅读区样式（不重新渲染整个页面）
     * @private
     */
    _updateReaderStyle() {
        const reader = document.getElementById('reader-content');
        if (reader) {
            reader.style.fontSize = this.settings.fontSize + 'px';
            reader.style.lineHeight = this.settings.lineHeight;
        }
        // 更新滑块标签
        const fontSizeLabel = document.querySelector('#slider-font-size')?.previousElementSibling;
        if (fontSizeLabel) fontSizeLabel.textContent = `字体大小：${this.settings.fontSize}px`;
        const lineHeightLabel = document.querySelector('#slider-line-height')?.previousElementSibling;
        if (lineHeightLabel) lineHeightLabel.textContent = `行高：${this.settings.lineHeight}`;
    },

    /**
     * 滚动到阅读区顶部
     * @private
     */
    _scrollToTop() {
        const reader = document.getElementById('novel-reader');
        if (reader) reader.scrollTop = 0;
    },

    /**
     * 切换侧边栏显示/隐藏
     * @private
     */
    _toggleSidebar() {
        const sidebar = document.getElementById('novel-sidebar');
        if (!sidebar) return;
        this.sidebarOpen = !this.sidebarOpen;
        sidebar.style.marginLeft = this.sidebarOpen ? '0' : '-260px';
    },

    /**
     * 切换设置面板显示/隐藏
     * @private
     */
    _toggleSettings() {
        const panel = document.getElementById('settings-panel');
        if (!panel) return;
        this.settingsOpen = !this.settingsOpen;
        panel.style.display = this.settingsOpen ? 'block' : 'none';
    },

    /**
     * 显示导入对话框
     * @private
     */
    _showImportDialog() {
        const dialog = document.getElementById('import-dialog');
        const overlay = document.getElementById('dialog-overlay');
        if (dialog) dialog.style.display = 'block';
        if (overlay) overlay.style.display = 'block';
    },

    /**
     * 隐藏导入对话框
     * @private
     */
    _hideImportDialog() {
        const dialog = document.getElementById('import-dialog');
        const overlay = document.getElementById('dialog-overlay');
        if (dialog) dialog.style.display = 'none';
        if (overlay) overlay.style.display = 'none';
        const textarea = document.getElementById('import-textarea');
        if (textarea) textarea.value = '';
    },

    // ========== 事件绑定 ==========

    /**
     * 绑定所有交互事件
     * @private
     */
    _bindEvents() {
        // 侧边栏切换按钮
        const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
        if (btnToggleSidebar) {
            btnToggleSidebar.onclick = () => this._toggleSidebar();
        }

        // 设置按钮
        const btnSettings = document.getElementById('btn-settings');
        if (btnSettings) {
            btnSettings.onclick = () => this._toggleSettings();
        }

        // 关闭设置面板
        const btnCloseSettings = document.getElementById('btn-close-settings');
        if (btnCloseSettings) {
            btnCloseSettings.onclick = () => this._toggleSettings();
        }

        // 字体大小滑块
        const sliderFontSize = document.getElementById('slider-font-size');
        if (sliderFontSize) {
            sliderFontSize.oninput = (e) => {
                this.setFontSize(parseInt(e.target.value));
                // 更新标签文字
                const label = e.target.previousElementSibling;
                if (label) label.textContent = `字体大小：${e.target.value}px`;
            };
        }

        // 行高滑块
        const sliderLineHeight = document.getElementById('slider-line-height');
        if (sliderLineHeight) {
            sliderLineHeight.oninput = (e) => {
                this.setLineHeight(parseFloat(e.target.value));
                const label = e.target.previousElementSibling;
                if (label) label.textContent = `行高：${e.target.value}`;
            };
        }

        // 昼夜模式切换
        const toggleDarkMode = document.getElementById('toggle-dark-mode');
        if (toggleDarkMode) {
            toggleDarkMode.onchange = (e) => {
                this.setDarkMode(e.target.checked);
            };
        }

        // 上一章按钮
        const btnPrev = document.getElementById('btn-prev-chapter');
        if (btnPrev) btnPrev.onclick = () => this.prevChapter();

        // 下一章按钮
        const btnNext = document.getElementById('btn-next-chapter');
        if (btnNext) btnNext.onclick = () => this.nextChapter();

        // 翻页热区 - 上一章
        const hotzonePrev = document.getElementById('hotzone-prev');
        if (hotzonePrev) {
            hotzonePrev.onclick = () => this.prevChapter();
        }

        // 翻页热区 - 下一章
        const hotzoneNext = document.getElementById('hotzone-next');
        if (hotzoneNext) {
            hotzoneNext.onclick = () => this.nextChapter();
        }

        // 章节列表点击
        const chapterList = document.querySelector('.chapter-list');
        if (chapterList) {
            chapterList.onclick = (e) => {
                const item = e.target.closest('.chapter-item');
                if (!item) return;
                const idx = parseInt(item.dataset.index);
                if (!isNaN(idx)) {
                    // 如果点击的是删除按钮
                    if (e.target.classList.contains('btn-delete-chapter')) {
                        e.stopPropagation();
                        this.deleteChapter(idx);
                        return;
                    }
                    this.loadChapter(idx);
                }
            };
        }

        // 新增章节按钮
        const btnAddChapter = document.getElementById('btn-add-chapter');
        if (btnAddChapter) {
            btnAddChapter.onclick = () => {
                const title = prompt('请输入新章节标题：', `第${this.chapters.length + 1}章`);
                if (title) {
                    this.addChapter(title, '');
                    // 自动跳转到新章节
                    this.loadChapter(this.chapters.length - 1);
                }
            };
        }

        // 导出按钮
        const btnExport = document.getElementById('btn-export');
        if (btnExport) {
            btnExport.onclick = () => this._showExportOptions();
        }

        // 导入对话框 - 取消
        const btnImportCancel = document.getElementById('btn-import-cancel');
        if (btnImportCancel) btnImportCancel.onclick = () => this._hideImportDialog();

        // 导入对话框 - 确认导入
        const btnImportConfirm = document.getElementById('btn-import-confirm');
        if (btnImportConfirm) {
            btnImportConfirm.onclick = () => {
                const textarea = document.getElementById('import-textarea');
                if (textarea) {
                    this.importNovel(textarea.value);
                }
                this._hideImportDialog();
            };
        }

        // 遮罩层点击关闭对话框
        const overlay = document.getElementById('dialog-overlay');
        if (overlay) overlay.onclick = () => this._hideImportDialog();

        // 键盘快捷键
        document.onkeydown = (e) => {
            // 仅在阅读器页面生效
            const container = document.querySelector(this.containerSelector);
            if (!container || container.offsetParent === null) return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.prevChapter();
                    break;
                case 'ArrowRight':
                case ' ':
                    e.preventDefault();
                    this.nextChapter();
                    break;
                case 'Escape':
                    if (this.settingsOpen) this._toggleSettings();
                    this._hideImportDialog();
                    break;
            }
        };

        // 滚轮翻页（在阅读区底部时自动下一章）
        const reader = document.getElementById('novel-reader');
        if (reader) {
            reader.onscroll = () => {
                // 保存滚动位置到进度
                this.saveProgress();
            };
        }
    },

    /**
     * 显示导出选项（导出 / 导入）
     * @private
     */
    _showExportOptions() {
        const choice = prompt('选择操作：\n1. 导出为 Markdown 文件\n2. 导入 Markdown 文件\n\n请输入 1 或 2：');
        if (choice === '1') {
            this.exportNovel();
        } else if (choice === '2') {
            this._showImportDialog();
        }
    }
};

// 导出模块（支持 ES Module / CommonJS / 浏览器全局）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TextNovel };
}
