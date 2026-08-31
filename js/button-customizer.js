/**
 * ============================================================
 * 按钮/控件自定义系统 — 全系统按钮DIY
 * ============================================================
 * 模块名称: button-customizer.js
 * 功能: 用户可自定义任何页面上的按钮文字、图标、位置、样式、快捷键
 *       甚至可以让AI重新设计整个界面的按钮布局
 * 存储键: button_customizer_v16
 * 配色风格: 古风墨境 (暖羊皮纸底色 #F5E6D3 + 金色 #C9A227 + 墨色 #2C1810)
 * 版本: v6.0
 * ============================================================
 */

(function () {
    'use strict';

    // ============================================================
    // 常量定义区
    // ============================================================

    /** 存储键名 */
    const STORAGE_KEY = 'button_customizer_v16';

    /** 古风墨境配色方案 */
    const THEME = {
        parchment: '#F5E6D3',      // 暖羊皮纸底色
        gold: '#C9A227',          // 金色
        ink: '#2C1810',           // 墨色
        inkLight: '#4A3728',      // 浅墨色
        goldLight: '#D4B43A',     // 浅金色
        goldDark: '#A08010',      // 深金色
        red: '#8B1A1A',           // 暗红
        green: '#2E5D34',         // 墨绿
        border: 'rgba(44,24,16,0.15)', // 边框色
        shadow: 'rgba(44,24,16,0.08)',  // 阴影色
        overlay: 'rgba(44,24,16,0.5)'   // 遮罩色
    };

    /** 预设样式定义 */
    const STYLE_MAP = {
        primary:   { bg: '#C9A227', color: '#2C1810', border: '#A08010' },
        secondary: { bg: '#F5E6D3', color: '#2C1810', border: '#C9A227' },
        success:   { bg: '#2E5D34', color: '#F5E6D3', border: '#1A3D22' },
        danger:    { bg: '#8B1A1A', color: '#F5E6D3', border: '#5C1010' },
        warning:   { bg: '#B87333', color: '#F5E6D3', border: '#8B5A2B' },
        icon:      { bg: 'transparent', color: '#C9A227', border: 'transparent' }
    };

    /** 位置枚举 */
    const POSITIONS = [
        'top-left', 'top-center', 'top-right',
        'middle-left', 'center', 'middle-right',
        'bottom-left', 'bottom-center', 'bottom-right',
        'custom'
    ];

    /** 页面ID列表（视觉小说系统各页面） */
    const PAGE_IDS = [
        'index', 'story', 'gallery', 'settings',
        'characters', 'achievements', 'save-load', 'credits'
    ];

    /** 动作类型枚举 */
    const ACTION_TYPES = [
        'navigate', 'popup', 'api', 'script', 'event'
    ];

    // ============================================================
    // 默认按钮配置库
    // ============================================================

    /** 系统默认按钮配置（按页面分组） */
    const DEFAULT_BUTTONS = {
        'index': [
            { id: 'btn-start', label: '开始故事', icon: '📖', tooltip: '开始阅读视觉小说', position: 'center', order: 1, style: 'primary', shortcut: 'Enter', visible: true, action: { type: 'navigate', params: { target: 'story' } } },
            { id: 'btn-continue', label: '继续阅读', icon: '▶️', tooltip: '从上次进度继续', position: 'center', order: 2, style: 'primary', shortcut: 'C', visible: true, action: { type: 'navigate', params: { target: 'story', continue: true } } },
            { id: 'btn-gallery', label: '画廊', icon: '🖼️', tooltip: '查看CG画廊', position: 'center', order: 3, style: 'secondary', shortcut: 'G', visible: true, action: { type: 'navigate', params: { target: 'gallery' } } },
            { id: 'btn-settings', label: '设置', icon: '⚙️', tooltip: '系统设置', position: 'top-right', order: 1, style: 'icon', shortcut: 'S', visible: true, action: { type: 'popup', params: { target: 'settings' } } },
            { id: 'btn-achievements', label: '成就', icon: '🏆', tooltip: '成就系统', position: 'top-right', order: 2, style: 'icon', shortcut: 'A', visible: true, action: { type: 'navigate', params: { target: 'achievements' } } }
        ],
        'story': [
            { id: 'btn-menu', label: '菜单', icon: '☰', tooltip: '打开菜单', position: 'top-left', order: 1, style: 'icon', shortcut: 'Esc', visible: true, action: { type: 'popup', params: { target: 'menu' } } },
            { id: 'btn-auto', label: '自动', icon: '▶️', tooltip: '自动播放模式', position: 'bottom-right', order: 1, style: 'secondary', shortcut: 'A', visible: true, action: { type: 'script', params: { script: 'toggleAutoPlay()' } } },
            { id: 'btn-skip', label: '跳过', icon: '⏭️', tooltip: '快速跳过已读内容', position: 'bottom-right', order: 2, style: 'secondary', shortcut: 'Ctrl+S', visible: true, action: { type: 'script', params: { script: 'toggleSkip()' } } },
            { id: 'btn-log', label: '历史', icon: '📜', tooltip: '查看对话历史', position: 'bottom-right', order: 3, style: 'secondary', shortcut: 'L', visible: true, action: { type: 'popup', params: { target: 'log' } } },
            { id: 'btn-save', label: '保存', icon: '💾', tooltip: '快速保存', position: 'top-right', order: 1, style: 'icon', shortcut: 'Ctrl+Q', visible: true, action: { type: 'api', params: { endpoint: '/api/quick-save', method: 'POST' } } },
            { id: 'btn-load', label: '读取', icon: '📂', tooltip: '快速读取', position: 'top-right', order: 2, style: 'icon', shortcut: 'Ctrl+L', visible: true, action: { type: 'popup', params: { target: 'save-load' } } },
            { id: 'btn-hide-ui', label: '隐藏UI', icon: '👁️', tooltip: '隐藏/显示UI', position: 'top-right', order: 3, style: 'icon', shortcut: 'H', visible: true, action: { type: 'script', params: { script: 'toggleUI()' } } }
        ],
        'gallery': [
            { id: 'btn-back', label: '返回', icon: '←', tooltip: '返回主菜单', position: 'top-left', order: 1, style: 'secondary', shortcut: 'Esc', visible: true, action: { type: 'navigate', params: { target: 'index' } } },
            { id: 'btn-cg', label: 'CG', icon: '🖼️', tooltip: 'CG图集', position: 'top-center', order: 1, style: 'primary', shortcut: '1', visible: true, action: { type: 'script', params: { script: 'switchGalleryTab("cg")' } } },
            { id: 'btn-bg', label: '背景', icon: '🏞️', tooltip: '背景图集', position: 'top-center', order: 2, style: 'secondary', shortcut: '2', visible: true, action: { type: 'script', params: { script: 'switchGalleryTab("bg")' } } },
            { id: 'btn-music', label: '音乐', icon: '🎵', tooltip: '音乐鉴赏', position: 'top-center', order: 3, style: 'secondary', shortcut: '3', visible: true, action: { type: 'script', params: { script: 'switchGalleryTab("music")' } } }
        ],
        'settings': [
            { id: 'btn-back', label: '返回', icon: '←', tooltip: '返回', position: 'top-left', order: 1, style: 'secondary', shortcut: 'Esc', visible: true, action: { type: 'navigate', params: { target: 'back' } } },
            { id: 'btn-reset', label: '重置', icon: '🔄', tooltip: '恢复默认设置', position: 'bottom-right', order: 1, style: 'warning', shortcut: 'R', visible: true, action: { type: 'script', params: { script: 'resetSettings()' } } },
            { id: 'btn-apply', label: '应用', icon: '✓', tooltip: '保存设置', position: 'bottom-right', order: 2, style: 'success', shortcut: 'Ctrl+S', visible: true, action: { type: 'api', params: { endpoint: '/api/save-settings', method: 'POST' } } }
        ],
        'characters': [
            { id: 'btn-back', label: '返回', icon: '←', tooltip: '返回主菜单', position: 'top-left', order: 1, style: 'secondary', shortcut: 'Esc', visible: true, action: { type: 'navigate', params: { target: 'index' } } },
            { id: 'btn-prev', label: '上一个', icon: '◀', tooltip: '上一个角色', position: 'middle-left', order: 1, style: 'secondary', shortcut: '←', visible: true, action: { type: 'script', params: { script: 'prevCharacter()' } } },
            { id: 'btn-next', label: '下一个', icon: '▶', tooltip: '下一个角色', position: 'middle-right', order: 1, style: 'secondary', shortcut: '→', visible: true, action: { type: 'script', params: { script: 'nextCharacter()' } } }
        ],
        'achievements': [
            { id: 'btn-back', label: '返回', icon: '←', tooltip: '返回主菜单', position: 'top-left', order: 1, style: 'secondary', shortcut: 'Esc', visible: true, action: { type: 'navigate', params: { target: 'index' } } },
            { id: 'btn-all', label: '全部', icon: '📋', tooltip: '显示全部成就', position: 'top-center', order: 1, style: 'primary', shortcut: '1', visible: true, action: { type: 'script', params: { script: 'filterAchievements("all")' } } },
            { id: 'btn-unlock', label: '已解锁', icon: '🔓', tooltip: '显示已解锁成就', position: 'top-center', order: 2, style: 'secondary', shortcut: '2', visible: true, action: { type: 'script', params: { script: 'filterAchievements("unlocked")' } } },
            { id: 'btn-lock', label: '未解锁', icon: '🔒', tooltip: '显示未解锁成就', position: 'top-center', order: 3, style: 'secondary', shortcut: '3', visible: true, action: { type: 'script', params: { script: 'filterAchievements("locked")' } } }
        ],
        'save-load': [
            { id: 'btn-back', label: '返回', icon: '←', tooltip: '返回', position: 'top-left', order: 1, style: 'secondary', shortcut: 'Esc', visible: true, action: { type: 'navigate', params: { target: 'back' } } },
            { id: 'btn-save-mode', label: '保存模式', icon: '💾', tooltip: '切换到保存模式', position: 'top-center', order: 1, style: 'primary', shortcut: '1', visible: true, action: { type: 'script', params: { script: 'setSaveLoadMode("save")' } } },
            { id: 'btn-load-mode', label: '读取模式', icon: '📂', tooltip: '切换到读取模式', position: 'top-center', order: 2, style: 'secondary', shortcut: '2', visible: true, action: { type: 'script', params: { script: 'setSaveLoadMode("load")' } } },
            { id: 'btn-delete', label: '删除', icon: '🗑️', tooltip: '删除存档', position: 'bottom-right', order: 1, style: 'danger', shortcut: 'Del', visible: true, action: { type: 'script', params: { script: 'deleteSaveSlot()' } } }
        ],
        'credits': [
            { id: 'btn-back', label: '返回', icon: '←', tooltip: '返回主菜单', position: 'top-left', order: 1, style: 'secondary', shortcut: 'Esc', visible: true, action: { type: 'navigate', params: { target: 'index' } } },
            { id: 'btn-skip', label: '跳过', icon: '⏭️', tooltip: '跳过制作名单', position: 'bottom-right', order: 1, style: 'secondary', shortcut: 'Space', visible: true, action: { type: 'script', params: { script: 'skipCredits()' } } }
        ]
    };

    // ============================================================
    // 预设方案定义
    // ============================================================

    /** 内置预设方案 */
    const PRESET_SCHEMES = {
        'default': {
            name: '默认方案',
            description: '系统原始按钮布局',
            buttons: JSON.parse(JSON.stringify(DEFAULT_BUTTONS))
        },
        'minimal': {
            name: '精简方案',
            description: '只保留最核心的按钮',
            buttons: generateMinimalButtons()
        },
        'full': {
            name: '全功能方案',
            description: '显示所有可用按钮',
            buttons: generateFullButtons()
        },
        'left': {
            name: '左手方案',
            description: '按钮集中在左侧，适合左手操作',
            buttons: generateLeftHandButtons()
        },
        'right': {
            name: '右手方案',
            description: '按钮集中在右侧，适合右手操作',
            buttons: generateRightHandButtons()
        }
    };

    /** 生成精简方案按钮配置 */
    function generateMinimalButtons() {
        const minimal = JSON.parse(JSON.stringify(DEFAULT_BUTTONS));
        for (const pageId in minimal) {
            minimal[pageId] = minimal[pageId].filter(btn => {
                const coreIds = ['btn-start', 'btn-continue', 'btn-menu', 'btn-back', 'btn-save', 'btn-apply'];
                return coreIds.includes(btn.id);
            }).map((btn, idx) => { btn.order = idx + 1; return btn; });
        }
        return minimal;
    }

    /** 生成全功能方案按钮配置 */
    function generateFullButtons() {
        const full = JSON.parse(JSON.stringify(DEFAULT_BUTTONS));
        for (const pageId in full) {
            // 为 story 页面添加更多按钮
            if (pageId === 'story') {
                full[pageId].push(
                    { id: 'btn-history', label: '回顾', icon: '📖', tooltip: '章节回顾', position: 'bottom-left', order: 4, style: 'secondary', shortcut: 'Ctrl+H', visible: true, action: { type: 'popup', params: { target: 'history' } } },
                    { id: 'btn-tips', label: '提示', icon: '💡', tooltip: '游戏提示', position: 'bottom-left', order: 5, style: 'secondary', shortcut: 'T', visible: true, action: { type: 'popup', params: { target: 'tips' } } },
                    { id: 'btn-screenshot', label: '截图', icon: '📷', tooltip: '保存截图', position: 'top-right', order: 4, style: 'icon', shortcut: 'PrtSc', visible: true, action: { type: 'script', params: { script: 'takeScreenshot()' } } },
                    { id: 'btn-fullscreen', label: '全屏', icon: '⛶', tooltip: '切换全屏', position: 'top-right', order: 5, style: 'icon', shortcut: 'F11', visible: true, action: { type: 'script', params: { script: 'toggleFullscreen()' } } }
                );
            }
        }
        return full;
    }

    /** 生成左手方案按钮配置（按钮集中在左侧） */
    function generateLeftHandButtons() {
        const left = JSON.parse(JSON.stringify(DEFAULT_BUTTONS));
        for (const pageId in left) {
            left[pageId].forEach(btn => {
                if (btn.position.includes('right')) {
                    btn.position = btn.position.replace('right', 'left');
                }
                if (btn.position === 'center') {
                    btn.position = 'middle-left';
                }
            });
        }
        return left;
    }

    /** 生成右手方案按钮配置（按钮集中在右侧） */
    function generateRightHandButtons() {
        const right = JSON.parse(JSON.stringify(DEFAULT_BUTTONS));
        for (const pageId in right) {
            right[pageId].forEach(btn => {
                if (btn.position.includes('left')) {
                    btn.position = btn.position.replace('left', 'right');
                }
                if (btn.position === 'center') {
                    btn.position = 'middle-right';
                }
            });
        }
        return right;
    }

    // ============================================================
    // 核心类定义: ButtonCustomizer
    // ============================================================

    /**
     * 按钮自定义系统主类
     * 提供按钮配置管理、可视化编辑、预设方案切换、快捷键绑定等完整功能
     */
    class ButtonCustomizerCore {
        constructor() {
            /** 当前按钮配置数据 { pageId: [buttonConfig, ...] } */
            this.config = {};
            /** 用户自定义方案列表 */
            this.customSchemes = [];
            /** 当前激活的方案ID */
            this.activeScheme = 'default';
            /** 快捷键监听器是否已注册 */
            this.shortcutListenerActive = false;
            /** 快捷键映射表 { shortcut: { pageId, buttonId, action } } */
            this.shortcutMap = {};
            /** 编辑器DOM根元素 */
            this.editorRoot = null;
            /** 当前编辑的页面ID */
            this.currentPageId = 'index';
            /** 当前选中的按钮ID */
            this.selectedButtonId = null;
            /** 拖拽状态 */
            this.dragState = { sourceIndex: null, targetIndex: null };
            /** 回调函数注册表 */
            this.callbacks = {};
            /** 是否已初始化 */
            this.initialized = false;
        }

        // --------------------------------------------------------
        // 初始化与持久化
        // --------------------------------------------------------

        /**
         * 初始化系统
         * 从本地存储加载配置，若无则使用默认配置
         */
        init() {
            if (this.initialized) return this;
            this.loadFromStorage();
            this.rebuildShortcutMap();
            this.setupGlobalShortcutListener();
            this.initialized = true;
            console.log('[ButtonCustomizer] 按钮自定义系统初始化完成');
            return this;
        }

        /**
         * 从 localStorage 加载配置
         */
        loadFromStorage() {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const data = JSON.parse(stored);
                    this.config = data.config || this.cloneDefaultButtons();
                    this.customSchemes = data.customSchemes || [];
                    this.activeScheme = data.activeScheme || 'default';
                } else {
                    this.config = this.cloneDefaultButtons();
                    this.activeScheme = 'default';
                }
            } catch (e) {
                console.warn('[ButtonCustomizer] 读取存储失败，使用默认配置:', e);
                this.config = this.cloneDefaultButtons();
                this.activeScheme = 'default';
            }
        }

        /**
         * 保存配置到 localStorage
         */
        saveToStorage() {
            try {
                const data = {
                    config: this.config,
                    customSchemes: this.customSchemes,
                    activeScheme: this.activeScheme,
                    savedAt: new Date().toISOString()
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                return true;
            } catch (e) {
                console.error('[ButtonCustomizer] 保存配置失败:', e);
                return false;
            }
        }

        /**
         * 克隆默认按钮配置（深拷贝）
         */
        cloneDefaultButtons() {
            return JSON.parse(JSON.stringify(DEFAULT_BUTTONS));
        }

        /**
         * 注册回调函数
         * @param {string} event - 事件名称
         * @param {Function} callback - 回调函数
         */
        on(event, callback) {
            if (!this.callbacks[event]) this.callbacks[event] = [];
            this.callbacks[event].push(callback);
        }

        /**
         * 触发回调事件
         * @param {string} event - 事件名称
         * @param {*} data - 事件数据
         */
        emit(event, data) {
            if (this.callbacks[event]) {
                this.callbacks[event].forEach(cb => {
                    try { cb(data); } catch (e) { console.error(e); }
                });
            }
        }

        // --------------------------------------------------------
        // 全局按钮管理 API
        // --------------------------------------------------------

        /**
         * 获取指定页面的指定按钮配置
         * @param {string} pageId - 页面ID
         * @param {string} buttonId - 按钮ID
         * @returns {Object|null} 按钮配置对象，不存在则返回 null
         */
        getButtonConfig(pageId, buttonId) {
            if (!this.config[pageId]) return null;
            return this.config[pageId].find(b => b.id === buttonId) || null;
        }

        /**
         * 设置指定按钮的配置
         * @param {string} pageId - 页面ID
         * @param {string} buttonId - 按钮ID
         * @param {Object} config - 新的配置对象（支持部分更新）
         * @returns {boolean} 是否设置成功
         */
        setButtonConfig(pageId, buttonId, config) {
            if (!this.config[pageId]) return false;
            const idx = this.config[pageId].findIndex(b => b.id === buttonId);
            if (idx === -1) return false;
            // 合并配置
            this.config[pageId][idx] = { ...this.config[pageId][idx], ...config };
            this.saveToStorage();
            this.rebuildShortcutMap();
            this.emit('buttonChanged', { pageId, buttonId, config: this.config[pageId][idx] });
            return true;
        }

        /**
         * 获取某页面的所有按钮配置
         * @param {string} pageId - 页面ID
         * @returns {Array} 按钮配置数组（按 order 排序）
         */
        getPageButtons(pageId) {
            if (!this.config[pageId]) return [];
            return [...this.config[pageId]].sort((a, b) => a.order - b.order);
        }

        /**
         * 向指定页面添加新按钮
         * @param {string} pageId - 页面ID
         * @param {Object} config - 按钮完整配置
         * @returns {boolean} 是否添加成功
         */
        addButton(pageId, config) {
            if (!this.config[pageId]) this.config[pageId] = [];
            // 检查ID是否已存在
            if (this.config[pageId].some(b => b.id === config.id)) {
                console.warn(`[ButtonCustomizer] 按钮ID ${config.id} 已存在于页面 ${pageId}`);
                return false;
            }
            // 自动分配order
            if (config.order === undefined) {
                const maxOrder = this.config[pageId].reduce((max, b) => Math.max(max, b.order || 0), 0);
                config.order = maxOrder + 1;
            }
            // 填充默认值
            const fullConfig = {
                id: config.id,
                label: config.label || '按钮',
                icon: config.icon || '🔘',
                tooltip: config.tooltip || '',
                position: config.position || 'center',
                order: config.order,
                style: config.style || 'secondary',
                shortcut: config.shortcut || '',
                visible: config.visible !== false,
                action: config.action || { type: 'script', params: { script: '' } }
            };
            this.config[pageId].push(fullConfig);
            this.saveToStorage();
            this.rebuildShortcutMap();
            this.emit('buttonAdded', { pageId, buttonId: config.id, config: fullConfig });
            return true;
        }

        /**
         * 删除指定按钮
         * @param {string} pageId - 页面ID
         * @param {string} buttonId - 按钮ID
         * @returns {boolean} 是否删除成功
         */
        removeButton(pageId, buttonId) {
            if (!this.config[pageId]) return false;
            const idx = this.config[pageId].findIndex(b => b.id === buttonId);
            if (idx === -1) return false;
            const removed = this.config[pageId].splice(idx, 1)[0];
            // 重新排序
            this.config[pageId].forEach((b, i) => { b.order = i + 1; });
            this.saveToStorage();
            this.rebuildShortcutMap();
            this.emit('buttonRemoved', { pageId, buttonId, config: removed });
            return true;
        }

        /**
         * 重置某页面的按钮为默认配置
         * @param {string} pageId - 页面ID
         */
        resetPageButtons(pageId) {
            if (DEFAULT_BUTTONS[pageId]) {
                this.config[pageId] = JSON.parse(JSON.stringify(DEFAULT_BUTTONS[pageId]));
            } else {
                this.config[pageId] = [];
            }
            this.saveToStorage();
            this.rebuildShortcutMap();
            this.emit('pageReset', { pageId });
        }

        /**
         * 重置所有页面为默认配置
         */
        resetAllButtons() {
            this.config = this.cloneDefaultButtons();
            this.activeScheme = 'default';
            this.saveToStorage();
            this.rebuildShortcutMap();
            this.emit('allReset', {});
        }

        // --------------------------------------------------------
        // 预设方案管理
        // --------------------------------------------------------

        /**
         * 获取所有可用方案（内置 + 用户自定义）
         * @returns {Object} 方案映射表
         */
        getAllSchemes() {
            const schemes = { ...PRESET_SCHEMES };
            this.customSchemes.forEach((s, idx) => {
                schemes[`custom_${idx}`] = s;
            });
            return schemes;
        }

        /**
         * 获取当前激活方案
         * @returns {Object} 当前方案信息
         */
        getActiveScheme() {
            const all = this.getAllSchemes();
            return all[this.activeScheme] || PRESET_SCHEMES['default'];
        }

        /**
         * 切换方案
         * @param {string} schemeId - 方案ID
         * @returns {boolean} 是否切换成功
         */
        switchScheme(schemeId) {
            const all = this.getAllSchemes();
            if (!all[schemeId]) {
                console.warn(`[ButtonCustomizer] 方案 ${schemeId} 不存在`);
                return false;
            }
            const scheme = all[schemeId];
            this.config = JSON.parse(JSON.stringify(scheme.buttons));
            this.activeScheme = schemeId;
            this.saveToStorage();
            this.rebuildShortcutMap();
            this.emit('schemeChanged', { schemeId, schemeName: scheme.name });
            return true;
        }

        /**
         * 将当前配置保存为新方案
         * @param {string} name - 方案名称
         * @param {string} description - 方案描述
         * @returns {string} 新方案ID
         */
        saveCurrentAsScheme(name, description) {
            const scheme = {
                name: name || '自定义方案',
                description: description || '用户自定义按钮布局',
                buttons: JSON.parse(JSON.stringify(this.config)),
                createdAt: new Date().toISOString()
            };
            this.customSchemes.push(scheme);
            this.saveToStorage();
            const schemeId = `custom_${this.customSchemes.length - 1}`;
            this.emit('schemeSaved', { schemeId, scheme });
            return schemeId;
        }

        /**
         * 删除用户自定义方案
         * @param {string} schemeId - 方案ID（格式: custom_N）
         * @returns {boolean} 是否删除成功
         */
        deleteCustomScheme(schemeId) {
            const match = schemeId.match(/^custom_(\d+)$/);
            if (!match) return false;
            const idx = parseInt(match[1], 10);
            if (idx < 0 || idx >= this.customSchemes.length) return false;
            this.customSchemes.splice(idx, 1);
            // 如果删除的是当前激活方案，切换到默认
            if (this.activeScheme === schemeId) {
                this.activeScheme = 'default';
                this.config = this.cloneDefaultButtons();
            }
            this.saveToStorage();
            this.emit('schemeDeleted', { schemeId });
            return true;
        }

        // --------------------------------------------------------
        // 快捷键系统
        // --------------------------------------------------------

        /**
         * 重建全局快捷键映射表
         */
        rebuildShortcutMap() {
            this.shortcutMap = {};
            for (const pageId in this.config) {
                this.config[pageId].forEach(btn => {
                    if (btn.shortcut && btn.visible) {
                        const normalized = this.normalizeShortcut(btn.shortcut);
                        if (normalized) {
                            this.shortcutMap[normalized] = {
                                pageId,
                                buttonId: btn.id,
                                action: btn.action
                            };
                        }
                    }
                });
            }
        }

        /**
         * 规范化快捷键字符串
         * @param {string} shortcut - 原始快捷键
         * @returns {string|null} 规范化后的快捷键
         */
        normalizeShortcut(shortcut) {
            if (!shortcut) return null;
            return shortcut
                .toUpperCase()
                .replace(/\s+/g, '')
                .replace(/CTRL/g, 'Control')
                .replace(/SHIFT/g, 'Shift')
                .replace(/ALT/g, 'Alt')
                .replace(/META/g, 'Meta')
                .replace(/ENTER/g, 'Enter')
                .replace(/ESC/g, 'Escape')
                .replace(/SPACE/g, ' ')
                .replace(/PRTSC/g, 'PrintScreen')
                .replace(/DEL/g, 'Delete')
                .replace(/←/g, 'ArrowLeft')
                .replace(/→/g, 'ArrowRight')
                .replace(/↑/g, 'ArrowUp')
                .replace(/↓/g, 'ArrowDown');
        }

        /**
         * 将键盘事件转换为快捷键字符串
         * @param {KeyboardEvent} event - 键盘事件
         * @returns {string} 快捷键字符串
         */
        eventToShortcut(event) {
            const parts = [];
            if (event.ctrlKey) parts.push('Control');
            if (event.shiftKey) parts.push('Shift');
            if (event.altKey) parts.push('Alt');
            if (event.metaKey) parts.push('Meta');
            if (parts.length === 0 && event.key.length === 1) {
                return event.key.toUpperCase();
            }
            if (event.key && !['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) {
                parts.push(event.key);
            }
            return parts.join('+');
        }

        /**
         * 设置全局快捷键监听
         */
        setupGlobalShortcutListener() {
            if (this.shortcutListenerActive) return;
            document.addEventListener('keydown', (event) => {
                // 忽略输入框中的快捷键
                if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
                const shortcut = this.eventToShortcut(event);
                const bound = this.shortcutMap[shortcut];
                if (bound && bound.action) {
                    event.preventDefault();
                    this.executeAction(bound.action);
                    this.emit('shortcutTriggered', { shortcut, buttonId: bound.buttonId, pageId: bound.pageId });
                }
            });
            this.shortcutListenerActive = true;
        }

        /**
         * 获取当前所有已绑定的快捷键列表
         * @returns {Array} 快捷键绑定信息数组
         */
        getAllShortcuts() {
            const list = [];
            for (const pageId in this.config) {
                this.config[pageId].forEach(btn => {
                    if (btn.shortcut) {
                        list.push({
                            pageId,
                            buttonId: btn.id,
                            label: btn.label,
                            shortcut: btn.shortcut,
                            action: btn.action
                        });
                    }
                });
            }
            return list.sort((a, b) => a.pageId.localeCompare(b.pageId) || a.buttonId.localeCompare(b.buttonId));
        }

        // --------------------------------------------------------
        // 按钮联动/动作执行
        // --------------------------------------------------------

        /**
         * 执行按钮绑定的动作
         * @param {Object} action - 动作配置 { type, params }
         * @returns {*} 动作执行结果
         */
        executeAction(action) {
            if (!action || !action.type) return null;
            const { type, params } = action;
            this.emit('actionExecuting', { type, params });
            let result = null;
            switch (type) {
                case 'navigate':
                    result = this.handleNavigate(params);
                    break;
                case 'popup':
                    result = this.handlePopup(params);
                    break;
                case 'api':
                    result = this.handleApi(params);
                    break;
                case 'script':
                    result = this.handleScript(params);
                    break;
                case 'event':
                    result = this.handleEvent(params);
                    break;
                default:
                    console.warn(`[ButtonCustomizer] 未知动作类型: ${type}`);
            }
            this.emit('actionExecuted', { type, params, result });
            return result;
        }

        /** 处理页面跳转 */
        handleNavigate(params) {
            if (!params || !params.target) return false;
            if (params.target === 'back') {
                window.history.back();
            } else {
                // 触发页面切换事件，由主系统处理
                this.emit('navigate', params);
                if (window.EventBridge) {
                    window.EventBridge.emit('navigate', params);
                }
            }
            return true;
        }

        /** 处理弹窗打开 */
        handlePopup(params) {
            if (!params || !params.target) return false;
            this.emit('popup', params);
            if (window.EventBridge) {
                window.EventBridge.emit('popup', params);
            }
            return true;
        }

        /** 处理API调用 */
        handleApi(params) {
            if (!params || !params.endpoint) return false;
            const { endpoint, method = 'GET', body = null, headers = {} } = params;
            return fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json', ...headers },
                body: body ? JSON.stringify(body) : null
            }).then(r => r.json()).catch(e => { console.error(e); return null; });
        }

        /** 处理脚本执行 */
        handleScript(params) {
            if (!params || !params.script) return false;
            try {
                // eslint-disable-next-line no-new-func
                const fn = new Function(params.script);
                return fn.call(window);
            } catch (e) {
                console.error('[ButtonCustomizer] 脚本执行失败:', e);
                return false;
            }
        }

        /** 处理EventBridge事件 */
        handleEvent(params) {
            if (!params || !params.eventName) return false;
            if (window.EventBridge) {
                window.EventBridge.emit(params.eventName, params.data || {});
                return true;
            }
            return false;
        }

        // --------------------------------------------------------
        // AI辅助设计
        // --------------------------------------------------------

        /**
         * AI分析当前页面功能，推荐按钮配置
         * @param {string} userPrompt - 用户描述需求
         * @param {string} pageId - 目标页面ID
         * @returns {Object} AI推荐的配置
         */
        aiDesignLayout(userPrompt, pageId) {
            const currentButtons = this.getPageButtons(pageId);
            const recommendations = this.analyzeRequirements(userPrompt, currentButtons);
            this.emit('aiDesignReady', { pageId, prompt: userPrompt, recommendations });
            return recommendations;
        }

        /**
         * 分析用户需求并生成推荐配置
         * @param {string} prompt - 用户需求描述
         * @param {Array} currentButtons - 当前按钮列表
         * @returns {Object} 推荐结果
         */
        analyzeRequirements(prompt, currentButtons) {
            const promptLC = (prompt || '').toLowerCase();
            const result = {
                layoutStyle: 'default',
                visibleButtons: [],
                hiddenButtons: [],
                positionChanges: {},
                styleChanges: {},
                reasoning: []
            };

            // 关键词分析
            if (promptLC.includes('简洁') || promptLC.includes('精简') || promptLC.includes('最少') || promptLC.includes('核心')) {
                result.layoutStyle = 'minimal';
                result.reasoning.push('用户要求简洁界面，建议隐藏次要按钮');
                // 只保留核心按钮
                const coreKeywords = ['开始', '继续', '菜单', '保存', '返回'];
                currentButtons.forEach(btn => {
                    if (coreKeywords.some(kw => btn.label.includes(kw))) {
                        result.visibleButtons.push(btn.id);
                    } else {
                        result.hiddenButtons.push(btn.id);
                    }
                });
            } else if (promptLC.includes('全功能') || promptLC.includes('全部') || promptLC.includes('所有')) {
                result.layoutStyle = 'full';
                result.reasoning.push('用户要求全功能界面，建议显示所有按钮');
                currentButtons.forEach(btn => result.visibleButtons.push(btn.id));
            } else if (promptLC.includes('左手') || promptLC.includes('左侧')) {
                result.layoutStyle = 'left';
                result.reasoning.push('用户偏好左手操作，建议按钮集中到左侧');
                currentButtons.forEach(btn => {
                    result.visibleButtons.push(btn.id);
                    if (btn.position.includes('right')) {
                        result.positionChanges[btn.id] = btn.position.replace('right', 'left');
                    }
                });
            } else if (promptLC.includes('右手') || promptLC.includes('右侧')) {
                result.layoutStyle = 'right';
                result.reasoning.push('用户偏好右手操作，建议按钮集中到右侧');
                currentButtons.forEach(btn => {
                    result.visibleButtons.push(btn.id);
                    if (btn.position.includes('left')) {
                        result.positionChanges[btn.id] = btn.position.replace('left', 'right');
                    }
                });
            } else {
                // 默认智能分析
                result.reasoning.push('根据用户需求进行智能分析');
                currentButtons.forEach(btn => result.visibleButtons.push(btn.id));
            }

            // 样式建议
            if (promptLC.includes('金色') || promptLC.includes('古风')) {
                result.styleChanges['global'] = 'primary';
                result.reasoning.push('用户偏好古风风格，建议使用金色主按钮');
            }

            return result;
        }

        /**
         * 应用AI推荐的配置
         * @param {Object} recommendations - AI推荐结果
         * @param {string} pageId - 目标页面ID
         * @returns {boolean} 是否应用成功
         */
        applyAiRecommendations(recommendations, pageId) {
            if (!this.config[pageId]) return false;
            this.config[pageId].forEach(btn => {
                // 可见性调整
                if (recommendations.hiddenButtons && recommendations.hiddenButtons.includes(btn.id)) {
                    btn.visible = false;
                }
                if (recommendations.visibleButtons && recommendations.visibleButtons.includes(btn.id)) {
                    btn.visible = true;
                }
                // 位置调整
                if (recommendations.positionChanges && recommendations.positionChanges[btn.id]) {
                    btn.position = recommendations.positionChanges[btn.id];
                }
                // 样式调整
                if (recommendations.styleChanges && recommendations.styleChanges[btn.id]) {
                    btn.style = recommendations.styleChanges[btn.id];
                }
            });
            this.saveToStorage();
            this.rebuildShortcutMap();
            this.emit('aiDesignApplied', { pageId, recommendations });
            return true;
        }

        // --------------------------------------------------------
        // 可视化编辑器 UI
        // --------------------------------------------------------

        /**
         * 打开可视化编辑器
         * @param {string} initialPageId - 初始显示的页面ID（可选）
         */
        openEditor(initialPageId) {
            this.currentPageId = initialPageId || 'index';
            this.selectedButtonId = null;
            if (!this.editorRoot) {
                this.createEditorUI();
            }
            this.editorRoot.style.display = 'flex';
            this.renderEditor();
        }

        /**
         * 关闭可视化编辑器
         */
        closeEditor() {
            if (this.editorRoot) {
                this.editorRoot.style.display = 'none';
            }
        }

        /**
         * 切换编辑器显示/隐藏
         */
        toggleEditor() {
            if (!this.editorRoot || this.editorRoot.style.display === 'none') {
                this.openEditor(this.currentPageId);
            } else {
                this.closeEditor();
            }
        }

        /**
         * 销毁编辑器DOM
         */
        destroyEditor() {
            if (this.editorRoot && this.editorRoot.parentNode) {
                this.editorRoot.parentNode.removeChild(this.editorRoot);
                this.editorRoot = null;
            }
        }

        /**
         * 创建编辑器DOM结构
         */
        createEditorUI() {
            const root = document.createElement('div');
            root.id = 'button-customizer-editor';
            root.style.cssText = this.getEditorContainerStyle();
            root.innerHTML = `
                <div id="bc-editor-header" style="${this.getHeaderStyle()}">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <span style="font-size:20px;">🎨</span>
                        <span style="font-weight:bold;font-size:16px;">按钮自定义编辑器</span>
                    </div>
                    <div style="display:flex;gap:8px;align-items:center;">
                        <span style="font-size:12px;opacity:0.7;">页面:</span>
                        <select id="bc-page-selector" style="${this.getSelectStyle()}"></select>
                        <button id="bc-btn-save-scheme" style="${this.getSmallBtnStyle('secondary')}">💾 保存方案</button>
                        <button id="bc-btn-load-scheme" style="${this.getSmallBtnStyle('secondary')}">📂 加载方案</button>
                        <button id="bc-btn-ai-design" style="${this.getSmallBtnStyle('primary')}">✨ AI设计</button>
                        <button id="bc-btn-close" style="${this.getSmallBtnStyle('icon')}" title="关闭">✕</button>
                    </div>
                </div>
                <div id="bc-editor-body" style="${this.getBodyStyle()}">
                    <div id="bc-button-list" style="${this.getListStyle()}">
                        <div style="${this.getPanelTitleStyle()}">📋 按钮列表 <span style="font-size:12px;opacity:0.6;">(拖拽排序)</span></div>
                        <div id="bc-button-items" style="${this.getItemsContainerStyle()}"></div>
                        <button id="bc-btn-add-button" style="${this.getAddBtnStyle()}">+ 添加新按钮</button>
                    </div>
                    <div id="bc-button-editor" style="${this.getEditorPanelStyle()}">
                        <div style="${this.getPanelTitleStyle()}">✏️ 按钮编辑器</div>
                        <div id="bc-editor-form" style="${this.getFormStyle()}">
                            <div style="text-align:center;padding:40px 20px;opacity:0.5;">
                                点击左侧按钮进行编辑
                            </div>
                        </div>
                    </div>
                    <div id="bc-preview-panel" style="${this.getPreviewPanelStyle()}">
                        <div style="${this.getPanelTitleStyle()}">👁️ 实时预览</div>
                        <div id="bc-preview-area" style="${this.getPreviewAreaStyle()}"></div>
                    </div>
                </div>
                <div id="bc-editor-footer" style="${this.getFooterStyle()}">
                    <span id="bc-status-text" style="font-size:12px;opacity:0.7;">就绪</span>
                    <div style="display:flex;gap:8px;">
                        <button id="bc-btn-reset-page" style="${this.getSmallBtnStyle('warning')}">🔄 重置本页</button>
                        <button id="bc-btn-save" style="${this.getSmallBtnStyle('success')}">✓ 保存配置</button>
                    </div>
                </div>
            `;
            document.body.appendChild(root);
            this.editorRoot = root;
            this.bindEditorEvents();
        }

        /**
         * 绑定编辑器事件
         */
        bindEditorEvents() {
            const root = this.editorRoot;
            if (!root) return;

            // 页面选择器
            const pageSelector = root.querySelector('#bc-page-selector');
            if (pageSelector) {
                pageSelector.addEventListener('change', (e) => {
                    this.currentPageId = e.target.value;
                    this.selectedButtonId = null;
                    this.renderEditor();
                });
            }

            // 关闭按钮
            const closeBtn = root.querySelector('#bc-btn-close');
            if (closeBtn) closeBtn.addEventListener('click', () => this.closeEditor());

            // 保存配置按钮
            const saveBtn = root.querySelector('#bc-btn-save');
            if (saveBtn) saveBtn.addEventListener('click', () => {
                this.saveToStorage();
                this.setStatus('配置已保存');
            });

            // 重置页面按钮
            const resetBtn = root.querySelector('#bc-btn-reset-page');
            if (resetBtn) resetBtn.addEventListener('click', () => {
                if (confirm(`确定要重置页面 "${this.currentPageId}" 的按钮为默认配置吗？`)) {
                    this.resetPageButtons(this.currentPageId);
                    this.selectedButtonId = null;
                    this.renderEditor();
                    this.setStatus('页面已重置');
                }
            });

            // 添加按钮
            const addBtn = root.querySelector('#bc-btn-add-button');
            if (addBtn) addBtn.addEventListener('click', () => this.showAddButtonForm());

            // 保存方案
            const saveSchemeBtn = root.querySelector('#bc-btn-save-scheme');
            if (saveSchemeBtn) saveSchemeBtn.addEventListener('click', () => this.showSaveSchemeDialog());

            // 加载方案
            const loadSchemeBtn = root.querySelector('#bc-btn-load-scheme');
            if (loadSchemeBtn) loadSchemeBtn.addEventListener('click', () => this.showLoadSchemeDialog());

            // AI设计
            const aiDesignBtn = root.querySelector('#bc-btn-ai-design');
            if (aiDesignBtn) aiDesignBtn.addEventListener('click', () => this.showAiDesignDialog());
        }

        /**
         * 渲染编辑器的完整界面
         */
        renderEditor() {
            this.renderPageSelector();
            this.renderButtonList();
            this.renderButtonEditor();
            this.renderPreview();
        }

        /**
         * 渲染页面选择器
         */
        renderPageSelector() {
            const selector = this.editorRoot.querySelector('#bc-page-selector');
            if (!selector) return;
            selector.innerHTML = '';
            PAGE_IDS.forEach(pid => {
                const option = document.createElement('option');
                option.value = pid;
                option.textContent = this.getPageDisplayName(pid);
                if (pid === this.currentPageId) option.selected = true;
                selector.appendChild(option);
            });
        }

        /**
         * 获取页面显示名称
         */
        getPageDisplayName(pageId) {
            const names = {
                'index': '🏠 首页',
                'story': '📖 故事',
                'gallery': '🖼️ 画廊',
                'settings': '⚙️ 设置',
                'characters': '👤 角色',
                'achievements': '🏆 成就',
                'save-load': '💾 存读档',
                'credits': '🎬 制作名单'
            };
            return names[pageId] || pageId;
        }

        /**
         * 渲染按钮列表
         */
        renderButtonList() {
            const container = this.editorRoot.querySelector('#bc-button-items');
            if (!container) return;
            container.innerHTML = '';
            const buttons = this.getPageButtons(this.currentPageId);
            buttons.forEach((btn, idx) => {
                const item = document.createElement('div');
                const isSelected = btn.id === this.selectedButtonId;
                item.style.cssText = this.getButtonListItemStyle(isSelected, btn.visible);
                item.draggable = true;
                item.dataset.index = idx;
                item.dataset.buttonId = btn.id;
                item.innerHTML = `
                    <span style="cursor:grab;font-size:16px;margin-right:8px;">☰</span>
                    <span style="font-size:18px;margin-right:8px;">${btn.icon || '🔘'}</span>
                    <span style="flex:1;font-size:14px;${!btn.visible ? 'opacity:0.4;text-decoration:line-through;' : ''}">${btn.label}</span>
                    <span style="font-size:11px;opacity:0.5;margin-right:8px;">${btn.position}</span>
                    ${btn.shortcut ? `<span style="font-size:10px;background:${THEME.gold};color:${THEME.ink};padding:2px 6px;border-radius:4px;margin-right:4px;">${btn.shortcut}</span>` : ''}
                    <button class="bc-btn-delete" data-id="${btn.id}" style="${this.getDeleteBtnStyle()}">🗑️</button>
                `;
                // 点击选择
                item.addEventListener('click', (e) => {
                    if (e.target.closest('.bc-btn-delete')) return;
                    this.selectedButtonId = btn.id;
                    this.renderButtonList();
                    this.renderButtonEditor();
                });
                // 删除按钮
                const delBtn = item.querySelector('.bc-btn-delete');
                if (delBtn) {
                    delBtn.addEventListener('click', () => {
                        if (confirm(`确定删除按钮 "${btn.label}" 吗？`)) {
                            this.removeButton(this.currentPageId, btn.id);
                            if (this.selectedButtonId === btn.id) this.selectedButtonId = null;
                            this.renderEditor();
                        }
                    });
                }
                // 拖拽事件
                item.addEventListener('dragstart', (e) => {
                    this.dragState.sourceIndex = idx;
                    item.style.opacity = '0.5';
                    e.dataTransfer.effectAllowed = 'move';
                });
                item.addEventListener('dragend', () => {
                    item.style.opacity = '1';
                    this.dragState.sourceIndex = null;
                    this.dragState.targetIndex = null;
                    // 清除所有hover样式
                    container.querySelectorAll('[data-index]').forEach(el => {
                        el.style.borderTop = 'none';
                        el.style.borderBottom = 'none';
                    });
                });
                item.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    const targetIdx = parseInt(item.dataset.index, 10);
                    if (targetIdx !== this.dragState.sourceIndex) {
                        item.style.borderTop = '2px dashed ' + THEME.gold;
                    }
                });
                item.addEventListener('dragleave', () => {
                    item.style.borderTop = 'none';
                });
                item.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const targetIdx = parseInt(item.dataset.index, 10);
                    const sourceIdx = this.dragState.sourceIndex;
                    if (sourceIdx !== null && targetIdx !== sourceIdx) {
                        this.reorderButtons(this.currentPageId, sourceIdx, targetIdx);
                        this.renderEditor();
                    }
                });
                container.appendChild(item);
            });
        }

        /**
         * 重新排序按钮
         */
        reorderButtons(pageId, fromIndex, toIndex) {
            if (!this.config[pageId]) return;
            const buttons = this.getPageButtons(pageId);
            const [moved] = buttons.splice(fromIndex, 1);
            buttons.splice(toIndex, 0, moved);
            // 重新分配order
            buttons.forEach((b, i) => {
                const orig = this.config[pageId].find(x => x.id === b.id);
                if (orig) orig.order = i + 1;
            });
            this.saveToStorage();
            this.emit('buttonsReordered', { pageId });
        }

        /**
         * 渲染按钮编辑器面板
         */
        renderButtonEditor() {
            const form = this.editorRoot.querySelector('#bc-editor-form');
            if (!form) return;
            if (!this.selectedButtonId) {
                form.innerHTML = `<div style="text-align:center;padding:40px 20px;opacity:0.5;">点击左侧按钮进行编辑</div>`;
                return;
            }
            const btn = this.getButtonConfig(this.currentPageId, this.selectedButtonId);
            if (!btn) {
                form.innerHTML = `<div style="text-align:center;padding:40px 20px;color:${THEME.red};">按钮不存在</div>`;
                return;
            }
            form.innerHTML = `
                <div style="display:flex;flex-direction:column;gap:12px;">
                    <div>
                        <label style="${this.getLabelStyle()}">按钮ID</label>
                        <input type="text" id="bc-edit-id" value="${btn.id}" disabled style="${this.getInputStyle()} background:${THEME.border};" />
                    </div>
                    <div>
                        <label style="${this.getLabelStyle()}">显示文字 <span style="color:${THEME.red}">*</span></label>
                        <input type="text" id="bc-edit-label" value="${btn.label}" style="${this.getInputStyle()}" />
                    </div>
                    <div>
                        <label style="${this.getLabelStyle()}">图标</label>
                        <div style="display:flex;gap:8px;align-items:center;">
                            <input type="text" id="bc-edit-icon" value="${btn.icon}" style="${this.getInputStyle()} width:60px;text-align:center;font-size:20px;" />
                            <span style="font-size:12px;opacity:0.6;">支持Emoji或SVG代码</span>
                        </div>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">
                            ${['📖','▶️','🖼️','⚙️','🏆','☰','💾','📂','←','✓','🔄','🗑️','💡','📷','⛶','🔓','🔒','📋'].map(e =>
                                `<span class="bc-emoji-pick" data-emoji="${e}" style="cursor:pointer;font-size:20px;padding:4px;border-radius:4px;border:1px solid ${THEME.border};background:${THEME.parchment};">${e}</span>`
                            ).join('')}
                        </div>
                    </div>
                    <div>
                        <label style="${this.getLabelStyle()}">悬停提示</label>
                        <input type="text" id="bc-edit-tooltip" value="${btn.tooltip || ''}" style="${this.getInputStyle()}" />
                    </div>
                    <div>
                        <label style="${this.getLabelStyle()}">位置</label>
                        <select id="bc-edit-position" style="${this.getSelectStyle()}">
                            ${POSITIONS.map(p => `<option value="${p}" ${btn.position === p ? 'selected' : ''}>${p}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="${this.getLabelStyle()}">样式</label>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;">
                            ${Object.keys(STYLE_MAP).map(s => {
                                const style = STYLE_MAP[s];
                                const selected = btn.style === s;
                                return `<div class="bc-style-pick" data-style="${s}" style="cursor:pointer;padding:6px 12px;border-radius:6px;border:2px solid ${selected ? THEME.gold : THEME.border};background:${style.bg};color:${style.color};font-size:13px;">${s}</div>`;
                            }).join('')}
                        </div>
                    </div>
                    <div>
                        <label style="${this.getLabelStyle()}">快捷键</label>
                        <div style="display:flex;gap:8px;align-items:center;">
                            <input type="text" id="bc-edit-shortcut" value="${btn.shortcut || ''}" placeholder="点击后按键盘" readonly style="${this.getInputStyle()} flex:1;" />
                            <button id="bc-btn-record-shortcut" style="${this.getSmallBtnStyle('secondary')}">🎹 录制</button>
                            <button id="bc-btn-clear-shortcut" style="${this.getSmallBtnStyle('icon')}">清除</button>
                        </div>
                        <div id="bc-shortcut-hint" style="font-size:11px;color:${THEME.inkLight};margin-top:4px;">点击"录制"后按下想要的快捷键组合</div>
                    </div>
                    <div>
                        <label style="${this.getLabelStyle()}">可见性</label>
                        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                            <input type="checkbox" id="bc-edit-visible" ${btn.visible ? 'checked' : ''} />
                            <span style="font-size:14px;">显示此按钮</span>
                        </label>
                    </div>
                    <div>
                        <label style="${this.getLabelStyle()}">动作类型</label>
                        <select id="bc-edit-action-type" style="${this.getSelectStyle()}">
                            ${ACTION_TYPES.map(t => `<option value="${t}" ${btn.action && btn.action.type === t ? 'selected' : ''}>${t}</option>`).join('')}
                        </select>
                    </div>
                    <div id="bc-action-params">
                        <label style="${this.getLabelStyle()}">动作参数 (JSON)</label>
                        <textarea id="bc-edit-action-params" rows="3" style="${this.getTextareaStyle()}">${btn.action ? JSON.stringify(btn.action.params, null, 2) : '{}'}</textarea>
                    </div>
                    <div style="display:flex;gap:8px;margin-top:12px;">
                        <button id="bc-btn-apply-edit" style="${this.getSmallBtnStyle('success')};flex:1;">✓ 应用更改</button>
                        <button id="bc-btn-preview-action" style="${this.getSmallBtnStyle('secondary')}">▶ 测试动作</button>
                    </div>
                </div>
            `;
            this.bindFormEvents(btn);
        }

        /**
         * 绑定表单事件
         */
        bindFormEvents(btn) {
            const form = this.editorRoot.querySelector('#bc-editor-form');
            if (!form) return;

            // 样式选择
            form.querySelectorAll('.bc-style-pick').forEach(el => {
                el.addEventListener('click', () => {
                    form.querySelectorAll('.bc-style-pick').forEach(e => e.style.borderColor = THEME.border);
                    el.style.borderColor = THEME.gold;
                });
            });

            // Emoji选择
            form.querySelectorAll('.bc-emoji-pick').forEach(el => {
                el.addEventListener('click', () => {
                    const input = form.querySelector('#bc-edit-icon');
                    if (input) input.value = el.dataset.emoji;
                });
            });

            // 快捷键录制
            const recordBtn = form.querySelector('#bc-btn-record-shortcut');
            if (recordBtn) {
                recordBtn.addEventListener('click', () => {
                    const hint = form.querySelector('#bc-shortcut-hint');
                    if (hint) hint.textContent = '请按下快捷键组合...';
                    const input = form.querySelector('#bc-edit-shortcut');
                    const handler = (e) => {
                        e.preventDefault();
                        const shortcut = this.eventToShortcut(e);
                        if (input) input.value = shortcut;
                        if (hint) hint.textContent = '快捷键已记录: ' + shortcut;
                        document.removeEventListener('keydown', handler);
                        recordBtn.textContent = '🎹 录制';
                    };
                    document.addEventListener('keydown', handler);
                    recordBtn.textContent = '⌨️ 按键盘...';
                });
            }

            // 清除快捷键
            const clearShortcutBtn = form.querySelector('#bc-btn-clear-shortcut');
            if (clearShortcutBtn) {
                clearShortcutBtn.addEventListener('click', () => {
                    const input = form.querySelector('#bc-edit-shortcut');
                    if (input) input.value = '';
                });
            }

            // 应用更改
            const applyBtn = form.querySelector('#bc-btn-apply-edit');
            if (applyBtn) {
                applyBtn.addEventListener('click', () => {
                    const newConfig = this.collectFormData(form);
                    if (newConfig) {
                        this.setButtonConfig(this.currentPageId, btn.id, newConfig);
                        this.renderEditor();
                        this.setStatus('按钮已更新');
                    }
                });
            }

            // 测试动作
            const previewBtn = form.querySelector('#bc-btn-preview-action');
            if (previewBtn) {
                previewBtn.addEventListener('click', () => {
                    const newConfig = this.collectFormData(form);
                    if (newConfig && newConfig.action) {
                        this.executeAction(newConfig.action);
                        this.setStatus('动作已测试执行');
                    }
                });
            }
        }

        /**
         * 从表单收集数据
         */
        collectFormData(form) {
            const label = form.querySelector('#bc-edit-label');
            const icon = form.querySelector('#bc-edit-icon');
            const tooltip = form.querySelector('#bc-edit-tooltip');
            const position = form.querySelector('#bc-edit-position');
            const shortcut = form.querySelector('#bc-edit-shortcut');
            const visible = form.querySelector('#bc-edit-visible');
            const actionType = form.querySelector('#bc-edit-action-type');
            const actionParams = form.querySelector('#bc-edit-action-params');

            if (!label || !label.value.trim()) {
                alert('按钮文字不能为空');
                return null;
            }

            // 获取选中的样式
            let selectedStyle = 'secondary';
            form.querySelectorAll('.bc-style-pick').forEach(el => {
                if (el.style.borderColor === 'rgb(201, 162, 39)' || el.style.borderColor === THEME.gold) {
                    selectedStyle = el.dataset.style;
                }
            });

            // 解析动作参数
            let params = {};
            if (actionParams && actionParams.value) {
                try {
                    params = JSON.parse(actionParams.value);
                } catch (e) {
                    alert('动作参数JSON格式错误');
                    return null;
                }
            }

            return {
                label: label.value.trim(),
                icon: icon ? icon.value : '🔘',
                tooltip: tooltip ? tooltip.value : '',
                position: position ? position.value : 'center',
                style: selectedStyle,
                shortcut: shortcut ? shortcut.value : '',
                visible: visible ? visible.checked : true,
                action: {
                    type: actionType ? actionType.value : 'script',
                    params: params
                }
            };
        }

        /**
         * 显示添加新按钮表单
         */
        showAddButtonForm() {
            const id = prompt('请输入新按钮的ID（英文，唯一）:', 'btn-new-' + Date.now());
            if (!id) return;
            const label = prompt('按钮显示文字:', '新按钮');
            if (!label) return;
            const success = this.addButton(this.currentPageId, {
                id: id.trim(),
                label: label.trim(),
                icon: '🔘',
                position: 'center',
                style: 'secondary'
            });
            if (success) {
                this.selectedButtonId = id.trim();
                this.renderEditor();
                this.setStatus('新按钮已添加');
            } else {
                alert('按钮ID已存在或添加失败');
            }
        }

        /**
         * 显示保存方案对话框
         */
        showSaveSchemeDialog() {
            const name = prompt('方案名称:', '我的自定义方案');
            if (!name) return;
            const desc = prompt('方案描述:', '');
            const schemeId = this.saveCurrentAsScheme(name, desc);
            this.setStatus(`方案 "${name}" 已保存 (ID: ${schemeId})`);
        }

        /**
         * 显示加载方案对话框
         */
        showLoadSchemeDialog() {
            const schemes = this.getAllSchemes();
            const schemeList = Object.entries(schemes).map(([id, s]) => `${id}: ${s.name}`).join('\n');
            const selected = prompt(`可用方案:\n${schemeList}\n\n请输入要加载的方案ID:`, this.activeScheme);
            if (selected && schemes[selected]) {
                this.switchScheme(selected);
                this.renderEditor();
                this.setStatus(`已切换到方案: ${schemes[selected].name}`);
            } else if (selected) {
                alert('方案不存在');
            }
        }

        /**
         * 显示AI设计对话框
         */
        showAiDesignDialog() {
            const prompt = prompt('描述你想要的按钮布局（如："我想要一个简洁的界面，只有最重要的按钮"）:', '');
            if (!prompt) return;
            const recommendations = this.aiDesignLayout(prompt, this.currentPageId);
            const reasoning = recommendations.reasoning.join('\n');
            const visible = recommendations.visibleButtons.join(', ');
            const hidden = recommendations.hiddenButtons.join(', ') || '无';
            const confirmed = confirm(
                `AI设计建议:\n\n` +
                `布局风格: ${recommendations.layoutStyle}\n` +
                `可见按钮: ${visible}\n` +
                `隐藏按钮: ${hidden}\n\n` +
                `推荐理由:\n${reasoning}\n\n` +
                `是否应用此设计？`
            );
            if (confirmed) {
                this.applyAiRecommendations(recommendations, this.currentPageId);
                this.renderEditor();
                this.setStatus('AI设计已应用');
            }
        }

        /**
         * 渲染实时预览区域
         */
        renderPreview() {
            const area = this.editorRoot.querySelector('#bc-preview-area');
            if (!area) return;
            const buttons = this.getPageButtons(this.currentPageId).filter(b => b.visible);
            // 按位置分组
            const byPosition = {};
            buttons.forEach(btn => {
                if (!byPosition[btn.position]) byPosition[btn.position] = [];
                byPosition[btn.position].push(btn);
            });

            // 创建预览布局
            let html = `<div style="position:relative;width:100%;height:100%;background:linear-gradient(135deg, #3d2b1f 0%, #2C1810 100%);border-radius:8px;overflow:hidden;">`;
            // 页面标识
            html += `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:24px;color:${THEME.gold};opacity:0.3;font-weight:bold;">${this.getPageDisplayName(this.currentPageId)}</div>`;

            // 渲染各位置的按钮
            Object.entries(byPosition).forEach(([pos, btns]) => {
                const posStyle = this.getPreviewPositionStyle(pos);
                html += `<div style="${posStyle}">`;
                btns.forEach(btn => {
                    const style = STYLE_MAP[btn.style] || STYLE_MAP.secondary;
                    html += `<div style="padding:4px 10px;border-radius:4px;font-size:12px;margin:2px;background:${style.bg};color:${style.color};border:1px solid ${style.border};white-space:nowrap;box-shadow:0 1px 3px ${THEME.shadow};">${btn.icon || ''} ${btn.label}</div>`;
                });
                html += `</div>`;
            });
            html += `</div>`;
            area.innerHTML = html;
        }

        /**
         * 获取预览位置样式
         */
        getPreviewPositionStyle(position) {
            const base = 'position:absolute;display:flex;flex-wrap:wrap;gap:4px;';
            const map = {
                'top-left':      'top:8px;left:8px;',
                'top-center':    'top:8px;left:50%;transform:translateX(-50%);',
                'top-right':     'top:8px;right:8px;',
                'middle-left':   'top:50%;left:8px;transform:translateY(-50%);flex-direction:column;',
                'center':        'top:50%;left:50%;transform:translate(-50%,-50%);flex-direction:column;align-items:center;',
                'middle-right':  'top:50%;right:8px;transform:translateY(-50%);flex-direction:column;',
                'bottom-left':   'bottom:8px;left:8px;',
                'bottom-center': 'bottom:8px;left:50%;transform:translateX(-50%);',
                'bottom-right':  'bottom:8px;right:8px;',
                'custom':        'top:50%;left:50%;transform:translate(-50%,-50%);'
            };
            return base + (map[position] || map.center);
        }

        /**
         * 设置状态栏文本
         */
        setStatus(text) {
            const status = this.editorRoot.querySelector('#bc-status-text');
            if (status) {
                status.textContent = text;
                setTimeout(() => { status.textContent = '就绪'; }, 3000);
            }
        }

        // --------------------------------------------------------
        // CSS 样式生成
        // --------------------------------------------------------

        getEditorContainerStyle() {
            return `
                position:fixed;top:0;left:0;width:100%;height:100%;z-index:10000;
                display:none;flex-direction:column;
                background:${THEME.parchment};color:${THEME.ink};
                font-family: "Noto Serif SC", "Source Han Serif SC", "SimSun", serif;
            `;
        }

        getHeaderStyle() {
            return `
                display:flex;justify-content:space-between;align-items:center;
                padding:12px 20px;background:${THEME.ink};color:${THEME.gold};
                border-bottom:2px solid ${THEME.gold};flex-shrink:0;
            `;
        }

        getBodyStyle() {
            return `
                display:flex;flex:1;overflow:hidden;gap:12px;padding:12px;
            `;
        }

        getListStyle() {
            return `
                width:260px;flex-shrink:0;display:flex;flex-direction:column;
                background:${THEME.parchment};border:1px solid ${THEME.border};
                border-radius:8px;overflow:hidden;
            `;
        }

        getItemsContainerStyle() {
            return `
                flex:1;overflow-y:auto;padding:8px;display:flex;flex-direction:column;gap:4px;
            `;
        }

        getEditorPanelStyle() {
            return `
                flex:1;display:flex;flex-direction:column;
                background:${THEME.parchment};border:1px solid ${THEME.border};
                border-radius:8px;overflow:hidden;
            `;
        }

        getFormStyle() {
            return `
                flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;
            `;
        }

        getPreviewPanelStyle() {
            return `
                width:300px;flex-shrink:0;display:flex;flex-direction:column;
                background:${THEME.parchment};border:1px solid ${THEME.border};
                border-radius:8px;overflow:hidden;
            `;
        }

        getPreviewAreaStyle() {
            return `
                flex:1;padding:12px;
            `;
        }

        getFooterStyle() {
            return `
                display:flex;justify-content:space-between;align-items:center;
                padding:10px 20px;background:${THEME.ink};
                color:${THEME.parchment};border-top:2px solid ${THEME.gold};flex-shrink:0;
            `;
        }

        getPanelTitleStyle() {
            return `
                padding:10px 12px;background:${THEME.ink};
                color:${THEME.gold};font-size:14px;font-weight:bold;
                border-bottom:1px solid ${THEME.border};flex-shrink:0;
            `;
        }

        getInputStyle() {
            return `
                width:100%;padding:8px 10px;border:1px solid ${THEME.border};
                border-radius:4px;background:${THEME.parchment};color:${THEME.ink};
                font-size:14px;box-sizing:border-box;outline:none;
                font-family:inherit;
            `;
        }

        getTextareaStyle() {
            return `
                width:100%;padding:8px 10px;border:1px solid ${THEME.border};
                border-radius:4px;background:${THEME.parchment};color:${THEME.ink};
                font-size:13px;box-sizing:border-box;outline:none;resize:vertical;
                font-family:monospace;
            `;
        }

        getSelectStyle() {
            return `
                padding:6px 10px;border:1px solid ${THEME.border};
                border-radius:4px;background:${THEME.parchment};color:${THEME.ink};
                font-size:13px;cursor:pointer;outline:none;font-family:inherit;
            `;
        }

        getLabelStyle() {
            return `
                display:block;font-size:12px;font-weight:bold;
                margin-bottom:4px;color:${THEME.inkLight};
            `;
        }

        getSmallBtnStyle(style) {
            const s = STYLE_MAP[style] || STYLE_MAP.secondary;
            return `
                padding:6px 12px;border:1px solid ${s.border};border-radius:4px;
                background:${s.bg};color:${s.color};font-size:12px;
                cursor:pointer;transition:all 0.2s;font-family:inherit;
            `;
        }

        getButtonListItemStyle(selected, visible) {
            return `
                display:flex;align-items:center;padding:8px 10px;
                border-radius:6px;cursor:pointer;transition:all 0.15s;
                background:${selected ? 'rgba(201,162,39,0.15)' : 'transparent'};
                border:1px solid ${selected ? THEME.gold : 'transparent'};
                opacity:${visible ? 1 : 0.5};
            `;
        }

        getDeleteBtnStyle() {
            return `
                padding:4px 6px;border:none;border-radius:4px;
                background:transparent;color:${THEME.red};
                cursor:pointer;font-size:14px;opacity:0.6;
            `;
        }

        getAddBtnStyle() {
            return `
                margin:8px;padding:8px;border:1px dashed ${THEME.gold};
                border-radius:6px;background:transparent;color:${THEME.gold};
                cursor:pointer;font-size:13px;transition:all 0.2s;
                font-family:inherit;
            `;
        }
    }

    // ============================================================
    // 全局导出
    // ============================================================

    /** 创建全局单例 */
    const instance = new ButtonCustomizerCore();

    /** 全局 ButtonCustomizer 对象 */
    window.ButtonCustomizer = {
        // 实例引用
        _instance: instance,

        // 初始化
        init: () => instance.init(),

        // 按钮管理 API
        getButtonConfig: (pageId, buttonId) => instance.getButtonConfig(pageId, buttonId),
        setButtonConfig: (pageId, buttonId, config) => instance.setButtonConfig(pageId, buttonId, config),
        getPageButtons: (pageId) => instance.getPageButtons(pageId),
        addButton: (pageId, config) => instance.addButton(pageId, config),
        removeButton: (pageId, buttonId) => instance.removeButton(pageId, buttonId),
        resetPageButtons: (pageId) => instance.resetPageButtons(pageId),
        resetAllButtons: () => instance.resetAllButtons(),

        // 方案管理
        getAllSchemes: () => instance.getAllSchemes(),
        getActiveScheme: () => instance.getActiveScheme(),
        switchScheme: (schemeId) => instance.switchScheme(schemeId),
        saveCurrentAsScheme: (name, description) => instance.saveCurrentAsScheme(name, description),
        deleteCustomScheme: (schemeId) => instance.deleteCustomScheme(schemeId),

        // 快捷键
        getAllShortcuts: () => instance.getAllShortcuts(),
        normalizeShortcut: (shortcut) => instance.normalizeShortcut(shortcut),
        eventToShortcut: (event) => instance.eventToShortcut(event),

        // AI设计
        aiDesignLayout: (prompt, pageId) => instance.aiDesignLayout(prompt, pageId),
        applyAiRecommendations: (recommendations, pageId) => instance.applyAiRecommendations(recommendations, pageId),

        // 动作执行
        executeAction: (action) => instance.executeAction(action),

        // 编辑器
        openEditor: (pageId) => instance.openEditor(pageId),
        closeEditor: () => instance.closeEditor(),
        toggleEditor: () => instance.toggleEditor(),
        destroyEditor: () => instance.destroyEditor(),

        // 事件系统
        on: (event, callback) => instance.on(event, callback),
        emit: (event, data) => instance.emit(event, data),

        // 工具方法
        getPageDisplayName: (pageId) => instance.getPageDisplayName(pageId),
        getTheme: () => ({ ...THEME }),
        getStyleMap: () => ({ ...STYLE_MAP }),
        getPositions: () => [...POSITIONS],
        getActionTypes: () => [...ACTION_TYPES],
        getPageIds: () => [...PAGE_IDS],

        // 存储控制
        saveToStorage: () => instance.saveToStorage(),
        loadFromStorage: () => instance.loadFromStorage(),

        // 版本信息
        version: '6.0',
        storageKey: STORAGE_KEY
    };

    // ============================================================
    // 自动初始化（DOMReady 后）
    // ============================================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => instance.init());
    } else {
        instance.init();
    }

    console.log('[button-customizer.js] 按钮自定义系统已加载，使用 ButtonCustomizer 对象访问');

})();
