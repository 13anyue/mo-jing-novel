/**
 * 世界观引擎 — v16 核心，驱动一切功能和UI
 * @fileoverview 负责管理世界观模板、NPC字段生成、地点类型、事件模板、UI主题切换及系统联动
 * @author 视觉小说系统 v16
 * @version 16.0.0
 */

(function(global) {
    'use strict';

    // ============================================================
    // 常量与配置
    // ============================================================

    /** 存储键前缀 */
    const STORAGE_KEY = 'worldview_engine_v16';
    /** 主题存储键 */
    const THEME_STORAGE_KEY = 'worldview_theme_v16';
    /** 自定义世界观存储键 */
    const CUSTOM_STORAGE_KEY = 'worldview_custom_templates_v16';
    /** 默认世界观ID（古风墨境，宫廷后宫） */
    const DEFAULT_WORLDVIEW = 'palace';

    // ============================================================
    // 内置世界观模板（8套完整定义）
    // ============================================================

    /** 世界观模板库 */
    // ========== 零预设：世界观模板由用户自行创建 ==========
    const BUILTIN_TEMPLATES = [];
    // ============================================================

    // ============================================================
    // 古风墨境默认配色（系统默认主题）
    // ============================================================

    /** 古风墨境配色方案 */
    const ANCIENT_INK_THEME = {
        name: '古风墨境',
        primaryColor: '#2C1810',
        secondaryColor: '#C9A227',
        accentColor: '#8B4513',
        backgroundColor: '#F5E6D3',
        textColor: '#2C1810',
        textSecondary: '#5C4033',
        borderColor: '#C9A227',
        shadowColor: 'rgba(44, 24, 16, 0.15)',
        fontFamily: "'Noto Serif SC', 'STKaiti', 'SimSun', serif",
        textDirection: 'horizontal',
        texture: 'rice-paper',
        specialEffect: 'ink-wash',
        styleDescription: '暖羊皮纸底色搭配墨色与金色，宣纸纹理，水墨渲染效果，古风雅致'
    };

    // ============================================================
    // 辅助工具函数
    // ============================================================

    /**
     * 深拷贝对象
     * @param {any} obj - 要拷贝的对象
     * @returns {any} 深拷贝后的对象
     */
    function deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => deepClone(item));
        if (obj instanceof Object) {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = deepClone(obj[key]);
                }
            }
            return cloned;
        }
        return obj;
    }

    /**
     * 安全获取localStorage
     * @returns {Storage|null} localStorage对象或null
     */
    function getStorage() {
        try {
            return window.localStorage;
        } catch (e) {
            console.warn('[世界观引擎] localStorage不可用，使用内存存储');
            return null;
        }
    }

    /**
     * 从存储中读取数据
     * @param {string} key - 存储键
     * @returns {any} 存储的数据或null
     */
    function storageGet(key) {
        const storage = getStorage();
        if (!storage) return null;
        try {
            const data = storage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.warn(`[世界观引擎] 读取存储失败: ${key}`, e);
            return null;
        }
    }

    /**
     * 向存储中写入数据
     * @param {string} key - 存储键
     * @param {any} value - 要存储的数据
     */
    function storageSet(key, value) {
        const storage = getStorage();
        if (!storage) return;
        try {
            storage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn(`[世界观引擎] 写入存储失败: ${key}`, e);
        }
    }

    /**
     * 生成唯一ID
     * @returns {string} 唯一标识符
     */
    function generateId() {
        return 'wv_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 合并NPC字段（保留共有字段，添加新字段，移除不匹配字段）
     * @param {Array} currentFields - 当前字段列表
     * @param {Array} newFields - 新字段列表
     * @returns {Array} 合并后的字段列表
     */
    function mergeNPCFields(currentFields, newFields) {
        if (!currentFields || currentFields.length === 0) {
            return deepClone(newFields);
        }

        const result = [];
        const newFieldIds = new Set(newFields.map(f => f.id));

        // 保留共有字段（保留用户数据）
        for (const field of currentFields) {
            const newField = newFields.find(f => f.id === field.id);
            if (newField) {
                // 字段存在，保留用户数据，更新定义
                result.push({
                    ...deepClone(newField),
                    value: field.value !== undefined ? field.value : newField.defaultValue,
                    custom: field.custom || false
                });
            }
            // 不匹配的字段被移除
        }

        // 添加新字段
        for (const field of newFields) {
            if (!currentFields.find(f => f.id === field.id)) {
                result.push(deepClone(field));
            }
        }

        return result;
    }

    /**
     * 将主题配置注入CSS变量
     * @param {Object} theme - 主题配置对象
     */
    function injectThemeCSS(theme) {
        if (typeof document === 'undefined') return;

        const root = document.documentElement;
        if (!root) return;

        // 注入CSS变量
        root.style.setProperty('--wv-primary', theme.primaryColor || '#2C1810');
        root.style.setProperty('--wv-secondary', theme.secondaryColor || '#C9A227');
        root.style.setProperty('--wv-accent', theme.accentColor || '#8B4513');
        root.style.setProperty('--wv-bg', theme.backgroundColor || '#F5E6D3');
        root.style.setProperty('--wv-text', theme.textColor || '#2C1810');
        root.style.setProperty('--wv-text-secondary', theme.textSecondary || '#5C4033');
        root.style.setProperty('--wv-border', theme.borderColor || '#C9A227');
        root.style.setProperty('--wv-shadow', theme.shadowColor || 'rgba(44, 24, 16, 0.15)');
        root.style.setProperty('--wv-font', theme.fontFamily || "'Noto Serif SC', serif");

        // 额外辅助变量
        root.style.setProperty('--wv-text-direction', theme.textDirection || 'horizontal');
        root.style.setProperty('--wv-texture', theme.texture || 'none');
        root.style.setProperty('--wv-effect', theme.specialEffect || 'none');

        // 添加主题类名到body
        if (document.body) {
            document.body.classList.remove(
                'theme-palace', 'theme-xianxia', 'theme-wuxia', 'theme-scifi',
                'theme-postapocalyptic', 'theme-campus', 'theme-business', 'theme-mystery',
                'theme-ancient-ink'
            );
            const themeClass = 'theme-' + (theme.id || 'ancient-ink');
            document.body.classList.add(themeClass);
        }

        // 存储主题
        storageSet(THEME_STORAGE_KEY, theme);

        console.log(`[世界观引擎] 主题已注入: ${theme.name || '古风墨境'}`);
    }

    /**
     * 触发EventBridge事件通知所有模块
     * @param {string} eventType - 事件类型
     * @param {Object} data - 事件数据
     */
    function emitEventBridge(eventType, data) {
        // 优先使用全局EventBridge
        if (typeof window !== 'undefined' && window.EventBridge) {
            window.EventBridge.emit('worldview:' + eventType, data);
        }

        // 同时派发DOM自定义事件（作为降级方案）
        if (typeof document !== 'undefined' && document.dispatchEvent) {
            const event = new CustomEvent('worldview-change', {
                detail: { type: eventType, data: data, timestamp: Date.now() }
            });
            document.dispatchEvent(event);
        }

        // 控制台日志
        console.log(`[世界观引擎] 事件通知: ${eventType}`, data);
    }

    /**
     * 获取字段类型对应的UI控件类型
     * @param {string} fieldType - 字段类型
     * @returns {string} UI控件类型
     */
    function getFieldControlType(fieldType) {
        const controlMap = {
            'number': 'range-slider',
            'text': 'text-input',
            'select': 'dropdown',
            'relationship': 'tag-input',
            'status': 'badge-selector'
        };
        return controlMap[fieldType] || 'text-input';
    }

    // ============================================================
    // 核心类：世界观引擎
    // ============================================================

    class WorldviewEngine {
        constructor() {
            /** 当前激活的世界观ID */
            this.currentWorldviewId = DEFAULT_WORLDVIEW;
            /** 内置模板缓存 */
            this.builtinTemplates = deepClone(BUILTIN_TEMPLATES);
            /** 自定义模板缓存 */
            this.customTemplates = [];
            /** 当前世界观实例（完整配置） */
            this.currentConfig = null;
            /** 是否已初始化 */
            this.initialized = false;
            /** 事件监听器 */
            this.listeners = {};

            // 尝试从存储恢复
            this.restoreFromStorage();
        }

        // ==================== 初始化与存储 ====================

        /**
         * 初始化世界观引擎
         * @param {Object} options - 初始化选项
         * @returns {WorldviewEngine} 返回自身实例（链式调用）
         */
        init(options = {}) {
            if (this.initialized) {
                console.log('[世界观引擎] 已经初始化，跳过重复初始化');
                return this;
            }

            console.log('[世界观引擎] 开始初始化 v16...');

            // 加载自定义模板
            this.loadCustomTemplates();

            // 加载当前世界观
            const savedWorldview = storageGet(STORAGE_KEY);
            if (savedWorldview && savedWorldview.currentId) {
                this.currentWorldviewId = savedWorldview.currentId;
            } else if (options.defaultWorldview) {
                this.currentWorldviewId = options.defaultWorldview;
            }

            // 应用当前世界观
            this.applyWorldview(this.currentWorldviewId);

            // 注入主题CSS
            this.injectCurrentTheme();

            this.initialized = true;
            console.log(`[世界观引擎] 初始化完成，当前世界观: ${this.getCurrentWorldview()?.name || '未设置'}`);

            return this;
        }

        /**
         * 从存储恢复状态
         */
        restoreFromStorage() {
            const saved = storageGet(STORAGE_KEY);
            if (saved) {
                if (saved.currentId) {
                    this.currentWorldviewId = saved.currentId;
                }
                if (saved.customTemplates) {
                    this.customTemplates = saved.customTemplates;
                }
            }
        }

        /**
         * 保存当前状态到存储
         */
        saveToStorage() {
            storageSet(STORAGE_KEY, {
                currentId: this.currentWorldviewId,
                customTemplates: this.customTemplates.map(t => ({
                    id: t.id,
                    name: t.name,
                    description: t.description
                }))
            });
        }

        /**
         * 加载自定义模板
         */
        loadCustomTemplates() {
            const saved = storageGet(CUSTOM_STORAGE_KEY);
            if (saved && Array.isArray(saved)) {
                this.customTemplates = saved;
            }
        }

        /**
         * 保存自定义模板到存储
         */
        saveCustomTemplates() {
            storageSet(CUSTOM_STORAGE_KEY, this.customTemplates);
        }

        // ==================== 世界观管理 ====================

        /**
         * 获取所有内置世界观模板
         * @returns {Array} 模板列表
         */
        getTemplates() {
            return deepClone(this.builtinTemplates);
        }

        /**
         * 获取所有自定义模板
         * @returns {Array} 自定义模板列表
         */
        getCustomTemplates() {
            return deepClone(this.customTemplates);
        }

        /**
         * 获取所有模板（内置 + 自定义）
         * @returns {Array} 全部模板列表
         */
        getAllTemplates() {
            return [...this.getTemplates(), ...this.getCustomTemplates()];
        }

        /**
         * 根据ID获取模板
         * @param {string} id - 模板ID
         * @returns {Object|null} 模板对象或null
         */
        getTemplateById(id) {
            return this.getAllTemplates().find(t => t.id === id) || null;
        }

        /**
         * 加载指定世界观模板
         * @param {string} id - 世界观ID
         * @returns {Object|null} 加载的模板配置
         */
        loadTemplate(id) {
            const template = this.getTemplateById(id);
            if (!template) {
                console.warn(`[世界观引擎] 未找到模板: ${id}`);
                return null;
            }
            return deepClone(template);
        }

        /**
         * 获取当前世界观配置
         * @returns {Object|null} 当前世界观配置
         */
        getCurrentWorldview() {
            if (!this.currentConfig) {
                this.currentConfig = this.loadTemplate(this.currentWorldviewId);
            }
            return this.currentConfig ? deepClone(this.currentConfig) : null;
        }

        /**
         * 获取当前世界观ID
         * @returns {string} 当前世界观ID
         */
        getCurrentWorldviewId() {
            return this.currentWorldviewId;
        }

        /**
         * 设置当前世界观（会触发完整切换流程）
         * @param {string} id - 世界观ID
         * @param {Object} options - 切换选项
         * @returns {boolean} 切换是否成功
         */
        setCurrentWorldview(id, options = {}) {
            const template = this.getTemplateById(id);
            if (!template) {
                console.error(`[世界观引擎] 切换失败: 未找到世界观 ${id}`);
                return false;
            }

            const oldWorldview = this.currentWorldviewId;
            const oldConfig = this.getCurrentWorldview();

            // 如果已经是当前世界观，不重复切换
            if (oldWorldview === id) {
                console.log(`[世界观引擎] ${id} 已经是当前世界观，无需切换`);
                return true;
            }

            console.log(`[世界观引擎] 正在切换世界观: ${oldWorldview} -> ${id}`);

            // 执行切换流程
            this.currentWorldviewId = id;
            this.currentConfig = deepClone(template);

            // 1. 保存状态
            this.saveToStorage();

            // 2. 更新UI主题
            this.injectCurrentTheme();

            // 3. 发送切换事件
            emitEventBridge('changed', {
                from: oldWorldview,
                to: id,
                template: this.currentConfig,
                preserveData: options.preserveData !== false,
                timestamp: Date.now()
            });

            // 4. 更新NPC字段通知
            emitEventBridge('npc-fields-updated', {
                worldviewId: id,
                fields: this.getNPCFieldDefinitions(),
                oldFields: oldConfig ? oldConfig.npcFields : [],
                mergeMode: options.preserveData !== false ? 'merge' : 'replace'
            });

            // 5. 更新地点类型通知
            emitEventBridge('locations-updated', {
                worldviewId: id,
                locations: this.getLocationDefinitions(),
                types: template.locations?.types || []
            });

            // 6. 更新事件模板通知
            emitEventBridge('events-updated', {
                worldviewId: id,
                events: this.getEventTemplates(),
                categories: template.events?.categories || []
            });

            // 7. 货币单位更新通知
            emitEventBridge('currency-updated', {
                worldviewId: id,
                currency: this.getCurrencyConfig()
            });

            // 8. 语言风格更新通知
            emitEventBridge('language-updated', {
                worldviewId: id,
                language: this.getLanguageConfig()
            });

            // 9. 时间系统更新通知
            emitEventBridge('time-updated', {
                worldviewId: id,
                timeSystem: this.getTimeSystemConfig()
            });

            console.log(`[世界观引擎] 世界观切换完成: ${template.name}`);
            return true;
        }

        /**
         * 创建自定义世界观模板
         * @param {Object} data - 自定义世界观数据
         * @returns {Object|null} 创建的模板或null
         */
        createCustomTemplate(data) {
            if (!data || !data.name) {
                console.error('[世界观引擎] 创建自定义模板失败: 名称不能为空');
                return null;
            }

            const template = {
                id: data.id || generateId(),
                name: data.name,
                description: data.description || '自定义世界观',
                version: data.version || '1.0',
                icon: data.icon || 'star',
                modules: data.modules || 8,
                mechanics: data.mechanics || { primary: [], secondary: [], resources: [], progression: [] },
                npcFields: data.npcFields || [],
                locations: data.locations || { types: [], defaultList: [] },
                events: data.events || { templates: [], categories: [] },
                theme: { ...ANCIENT_INK_THEME, ...data.theme },
                currency: data.currency || { unit: '点数', symbol: '点', decimal: 0 },
                timeSystem: data.timeSystem || {
                    unit: '时辰',
                    periods: [],
                    seasonNames: ['春', '夏', '秋', '冬'],
                    yearFormat: '{year}年'
                },
                language: data.language || {
                    style: '自定义',
                    tone: '中性',
                    honorifics: [],
                    dialogueStyle: '',
                    aiPrompt: ''
                },
                isCustom: true
            };

            this.customTemplates.push(template);
            this.saveCustomTemplates();

            console.log(`[世界观引擎] 自定义模板创建成功: ${template.name} (${template.id})`);

            // 发送事件
            emitEventBridge('custom-template-created', { template: deepClone(template) });

            return deepClone(template);
        }

        /**
         * 删除自定义世界观模板
         * @param {string} id - 模板ID
         * @returns {boolean} 删除是否成功
         */
        deleteCustomTemplate(id) {
            const index = this.customTemplates.findIndex(t => t.id === id);
            if (index === -1) {
                console.warn(`[世界观引擎] 删除失败: 未找到自定义模板 ${id}`);
                return false;
            }

            const template = this.customTemplates[index];

            // 如果删除的是当前世界观，先切换到默认
            if (this.currentWorldviewId === id) {
                this.setCurrentWorldview(DEFAULT_WORLDVIEW);
            }

            this.customTemplates.splice(index, 1);
            this.saveCustomTemplates();

            console.log(`[世界观引擎] 自定义模板已删除: ${template.name}`);
            emitEventBridge('custom-template-deleted', { id: id, name: template.name });

            return true;
        }

        /**
         * 更新自定义世界观模板
         * @param {string} id - 模板ID
         * @param {Object} updates - 更新内容
         * @returns {Object|null} 更新后的模板
         */
        updateCustomTemplate(id, updates) {
            const index = this.customTemplates.findIndex(t => t.id === id);
            if (index === -1) {
                console.warn(`[世界观引擎] 更新失败: 未找到自定义模板 ${id}`);
                return null;
            }

            const template = this.customTemplates[index];
            Object.assign(template, updates);
            this.saveCustomTemplates();

            // 如果更新的是当前世界观，重新应用
            if (this.currentWorldviewId === id) {
                this.currentConfig = deepClone(template);
                this.injectCurrentTheme();
            }

            emitEventBridge('custom-template-updated', { id: id, template: deepClone(template) });

            return deepClone(template);
        }

        // ==================== NPC字段管理 ====================

        /**
         * 获取当前世界观的NPC字段定义
         * @returns {Array} 字段定义列表
         */
        getNPCFieldDefinitions() {
            const template = this.getCurrentWorldview();
            if (!template || !template.npcFields) {
                return [];
            }
            return deepClone(template.npcFields);
        }

        /**
         * 根据字段ID获取字段定义
         * @param {string} fieldId - 字段ID
         * @returns {Object|null} 字段定义
         */
        getNPCFieldById(fieldId) {
            const fields = this.getNPCFieldDefinitions();
            return fields.find(f => f.id === fieldId) || null;
        }

        /**
         * 获取字段分类列表
         * @returns {Array} 分类名称列表
         */
        getNPCFieldCategories() {
            const fields = this.getNPCFieldDefinitions();
            const categories = new Set(fields.map(f => f.category).filter(Boolean));
            return Array.from(categories);
        }

        /**
         * 按分类获取NPC字段
         * @param {string} category - 分类名称
         * @returns {Array} 该分类下的字段
         */
        getNPCFieldsByCategory(category) {
            const fields = this.getNPCFieldDefinitions();
            return fields.filter(f => f.category === category);
        }

        /**
         * 获取字段UI控件类型
         * @param {string} fieldId - 字段ID
         * @returns {string} 控件类型
         */
        getFieldUIControl(fieldId) {
            const field = this.getNPCFieldById(fieldId);
            if (!field) return 'text-input';
            return getFieldControlType(field.type);
        }

        /**
         * 为NPC生成默认字段值
         * @param {Object} overrides - 覆盖值
         * @returns {Object} 字段值对象
         */
        generateNPCDefaultValues(overrides = {}) {
            const fields = this.getNPCFieldDefinitions();
            const values = {};

            for (const field of fields) {
                values[field.id] = overrides[field.id] !== undefined
                    ? overrides[field.id]
                    : field.defaultValue;
            }

            return values;
        }

        /**
         * 合并现有NPC数据到新世界观字段
         * @param {Object} existingData - 现有NPC数据
         * @returns {Object} 合并后的数据
         */
        mergeNPCDataToCurrentWorldview(existingData) {
            const newFields = this.getNPCFieldDefinitions();
            const result = {};

            for (const field of newFields) {
                if (existingData && existingData[field.id] !== undefined) {
                    result[field.id] = existingData[field.id];
                } else {
                    result[field.id] = field.defaultValue;
                }
            }

            return result;
        }

        // ==================== 地点类型管理 ====================

        /**
         * 获取当前世界观的地点类型定义
         * @returns {Object} 地点定义对象
         */
        getLocationDefinitions() {
            const template = this.getCurrentWorldview();
            if (!template || !template.locations) {
                return { types: [], defaultList: [] };
            }
            return deepClone(template.locations);
        }

        /**
         * 获取地点类型列表
         * @returns {Array} 地点类型
         */
        getLocationTypes() {
            const locations = this.getLocationDefinitions();
            return locations.types || [];
        }

        /**
         * 获取默认地点列表
         * @returns {Array} 地点列表
         */
        getDefaultLocations() {
            const locations = this.getLocationDefinitions();
            return locations.defaultList || [];
        }

        /**
         * 按类型获取地点
         * @param {string} type - 地点类型
         * @returns {Array} 地点列表
         */
        getLocationsByType(type) {
            const locations = this.getDefaultLocations();
            return locations.filter(l => l.type === type);
        }

        /**
         * 根据ID获取地点
         * @param {string} locationId - 地点ID
         * @returns {Object|null} 地点对象
         */
        getLocationById(locationId) {
            const locations = this.getDefaultLocations();
            return locations.find(l => l.id === locationId) || null;
        }

        // ==================== 事件模板管理 ====================

        /**
         * 获取当前世界观的事件模板库
         * @returns {Object} 事件定义对象
         */
        getEventTemplates() {
            const template = this.getCurrentWorldview();
            if (!template || !template.events) {
                return { templates: [], categories: [] };
            }
            return deepClone(template.events);
        }

        /**
         * 获取事件分类列表
         * @returns {Array} 分类列表
         */
        getEventCategories() {
            const events = this.getEventTemplates();
            return events.categories || [];
        }

        /**
         * 获取所有事件模板
         * @returns {Array} 事件模板列表
         */
        getAllEventTemplates() {
            const events = this.getEventTemplates();
            return events.templates || [];
        }

        /**
         * 按分类获取事件
         * @param {string} category - 事件分类
         * @returns {Array} 事件列表
         */
        getEventsByCategory(category) {
            const templates = this.getAllEventTemplates();
            return templates.filter(e => e.category === category);
        }

        /**
         * 根据ID获取事件模板
         * @param {string} eventId - 事件ID
         * @returns {Object|null} 事件模板
         */
        getEventById(eventId) {
            const templates = this.getAllEventTemplates();
            return templates.find(e => e.id === eventId) || null;
        }

        /**
         * 按稀有度获取事件
         * @param {string} rarity - 稀有度
         * @returns {Array} 事件列表
         */
        getEventsByRarity(rarity) {
            const templates = this.getAllEventTemplates();
            return templates.filter(e => e.rarity === rarity);
        }

        // ==================== UI主题管理 ====================

        /**
         * 获取当前世界观的UI主题配置
         * @returns {Object} 主题配置
         */
        getThemeConfig() {
            const template = this.getCurrentWorldview();
            if (!template || !template.theme) {
                return deepClone(ANCIENT_INK_THEME);
            }
            return deepClone(template.theme);
        }

        /**
         * 注入当前主题CSS变量到DOM
         */
        injectCurrentTheme() {
            const theme = this.getThemeConfig();
            theme.id = this.currentWorldviewId;
            injectThemeCSS(theme);
        }

        /**
         * 获取古风墨境默认主题
         * @returns {Object} 默认主题配置
         */
        getDefaultTheme() {
            return deepClone(ANCIENT_INK_THEME);
        }

        /**
         * 获取CSS变量字符串（用于直接嵌入样式）
         * @returns {string} CSS变量字符串
         */
        getCSSVariablesString() {
            const theme = this.getThemeConfig();
            return `
                --wv-primary: ${theme.primaryColor};
                --wv-secondary: ${theme.secondaryColor};
                --wv-accent: ${theme.accentColor};
                --wv-bg: ${theme.backgroundColor};
                --wv-text: ${theme.textColor};
                --wv-text-secondary: ${theme.textSecondary};
                --wv-border: ${theme.borderColor};
                --wv-shadow: ${theme.shadowColor};
                --wv-font: ${theme.fontFamily};
                --wv-text-direction: ${theme.textDirection};
                --wv-texture: ${theme.texture};
                --wv-effect: ${theme.specialEffect};
            `;
        }

        /**
         * 获取主题相关的CSS类名
         * @returns {string} CSS类名字符串
         */
        getThemeClassName() {
            return `theme-${this.currentWorldviewId}`;
        }

        // ==================== 货币与时间系统 ====================

        /**
         * 获取当前世界观的货币配置
         * @returns {Object} 货币配置
         */
        getCurrencyConfig() {
            const template = this.getCurrentWorldview();
            if (!template || !template.currency) {
                return { unit: '点数', symbol: '点', decimal: 0 };
            }
            return deepClone(template.currency);
        }

        /**
         * 格式化货币金额
         * @param {number} amount - 金额
         * @returns {string} 格式化后的货币字符串
         */
        formatCurrency(amount) {
            const currency = this.getCurrencyConfig();
            if (!currency || currency.unit === '无') {
                return amount.toString();
            }
            const decimals = currency.decimal || 0;
            const formatted = amount.toFixed(decimals);
            return `${formatted}${currency.symbol || ''}${currency.unit}`;
        }

        /**
         * 获取当前世界观的时间系统配置
         * @returns {Object} 时间系统配置
         */
        getTimeSystemConfig() {
            const template = this.getCurrentWorldview();
            if (!template || !template.timeSystem) {
                return {
                    unit: '时辰',
                    periods: [],
                    seasonNames: ['春', '夏', '秋', '冬'],
                    yearFormat: '{year}年'
                };
            }
            return deepClone(template.timeSystem);
        }

        /**
         * 获取时间周期名称
         * @returns {Array} 周期名称列表
         */
        getTimePeriods() {
            const timeSystem = this.getTimeSystemConfig();
            return timeSystem.periods || [];
        }

        /**
         * 获取季节名称
         * @returns {Array} 季节名称列表
         */
        getSeasonNames() {
            const timeSystem = getTimeSystemConfig();
            return timeSystem.seasonNames || ['春', '夏', '秋', '冬'];
        }

        /**
         * 格式化年份
         * @param {number} year - 年份数值
         * @param {string} era - 年号（可选）
         * @returns {string} 格式化后的年份字符串
         */
        formatYear(year, era) {
            const timeSystem = this.getTimeSystemConfig();
            let format = timeSystem.yearFormat || '{year}年';
            format = format.replace('{year}', year);
            if (era) {
                format = format.replace('{era}', era);
            }
            return format;
        }

        // ==================== 语言风格管理 ====================

        /**
         * 获取当前世界观的语言风格配置
         * @returns {Object} 语言配置
         */
        getLanguageConfig() {
            const template = this.getCurrentWorldview();
            if (!template || !template.language) {
                return {
                    style: '现代',
                    tone: '中性',
                    honorifics: [],
                    dialogueStyle: '',
                    aiPrompt: '请用现代中文风格撰写对话和描述。'
                };
            }
            return deepClone(template.language);
        }

        /**
         * 获取AI对话提示词
         * @returns {string} AI提示词
         */
        getAIPrompt() {
            const lang = this.getLanguageConfig();
            return lang.aiPrompt || '请用中文撰写对话和描述。';
        }

        /**
         * 获取敬语列表
         * @returns {Array} 敬语列表
         */
        getHonorifics() {
            const lang = this.getLanguageConfig();
            return lang.honorifics || [];
        }

        /**
         * 获取对话风格描述
         * @returns {string} 风格描述
         */
        getDialogueStyle() {
            const lang = this.getLanguageConfig();
            return lang.dialogueStyle || '';
        }

        // ==================== 核心机制 ====================

        /**
         * 获取当前世界观的核心机制定义
         * @returns {Object} 机制定义
         */
        getMechanicsConfig() {
            const template = this.getCurrentWorldview();
            if (!template || !template.mechanics) {
                return { primary: [], secondary: [], resources: [], progression: [] };
            }
            return deepClone(template.mechanics);
        }

        /**
         * 获取进阶路径
         * @returns {Array} 进阶阶段列表
         */
        getProgressionPath() {
            const mechanics = this.getMechanicsConfig();
            return mechanics.progression || [];
        }

        /**
         * 获取主要机制列表
         * @returns {Array} 主要机制
         */
        getPrimaryMechanics() {
            const mechanics = this.getMechanicsConfig();
            return mechanics.primary || [];
        }

        /**
         * 获取次要机制列表
         * @returns {Array} 次要机制
         */
        getSecondaryMechanics() {
            const mechanics = this.getMechanicsConfig();
            return mechanics.secondary || [];
        }

        /**
         * 获取资源类型列表
         * @returns {Array} 资源类型
         */
        getResourceTypes() {
            const mechanics = this.getMechanicsConfig();
            return mechanics.resources || [];
        }

        // ==================== 界面辅助方法 ====================

        /**
         * 获取世界观选择卡片数据
         * @returns {Array} 卡片数据列表
         */
        getWorldviewCards() {
            const templates = this.getAllTemplates();
            return templates.map(t => ({
                id: t.id,
                name: t.name,
                description: t.description,
                icon: t.icon,
                modules: t.modules || 8,
                isCustom: t.isCustom || false,
                isActive: t.id === this.currentWorldviewId,
                theme: t.theme ? {
                    primaryColor: t.theme.primaryColor,
                    backgroundColor: t.theme.backgroundColor
                } : null
            }));
        }

        /**
         * 获取当前世界观状态栏显示信息
         * @returns {Object} 状态栏信息
         */
        getStatusBarInfo() {
            const template = this.getCurrentWorldview();
            if (!template) return null;

            return {
                id: template.id,
                name: template.name,
                icon: template.icon,
                theme: {
                    primaryColor: template.theme?.primaryColor,
                    textColor: template.theme?.textColor
                },
                currency: this.getCurrencyConfig(),
                mechanics: this.getPrimaryMechanics()
            };
        }

        /**
         * 验证自定义世界观数据
         * @param {Object} data - 待验证的数据
         * @returns {Object} 验证结果
         */
        validateCustomTemplate(data) {
            const errors = [];
            const warnings = [];

            if (!data.name || data.name.trim() === '') {
                errors.push('世界观名称不能为空');
            }

            if (data.npcFields && !Array.isArray(data.npcFields)) {
                errors.push('NPC字段必须是数组');
            }

            if (data.npcFields) {
                for (let i = 0; i < data.npcFields.length; i++) {
                    const field = data.npcFields[i];
                    if (!field.id) errors.push(`字段[${i}]缺少id`);
                    if (!field.name) errors.push(`字段[${i}]缺少name`);
                    if (!field.type) warnings.push(`字段[${i}]未指定类型，默认为text`);
                }
            }

            if (data.theme) {
                const requiredColors = ['primaryColor', 'backgroundColor', 'textColor'];
                for (const color of requiredColors) {
                    if (!data.theme[color]) {
                        warnings.push(`主题缺少${color}，将使用默认值`);
                    }
                }
            }

            return {
                valid: errors.length === 0,
                errors: errors,
                warnings: warnings
            };
        }

        // ==================== 事件监听 ====================

        /**
         * 添加事件监听器
         * @param {string} eventType - 事件类型
         * @param {Function} callback - 回调函数
         */
        on(eventType, callback) {
            if (!this.listeners[eventType]) {
                this.listeners[eventType] = [];
            }
            this.listeners[eventType].push(callback);
        }

        /**
         * 移除事件监听器
         * @param {string} eventType - 事件类型
         * @param {Function} callback - 回调函数
         */
        off(eventType, callback) {
            if (!this.listeners[eventType]) return;
            const index = this.listeners[eventType].indexOf(callback);
            if (index !== -1) {
                this.listeners[eventType].splice(index, 1);
            }
        }

        /**
         * 触发本地事件
         * @param {string} eventType - 事件类型
         * @param {Object} data - 事件数据
         */
        emit(eventType, data) {
            if (!this.listeners[eventType]) return;
            for (const callback of this.listeners[eventType]) {
                try {
                    callback(data);
                } catch (e) {
                    console.error(`[世界观引擎] 事件回调错误: ${eventType}`, e);
                }
            }
        }

        // ==================== 导出与导入 ====================

        /**
         * 导出当前世界观配置为JSON
         * @returns {string} JSON字符串
         */
        exportCurrentWorldview() {
            const config = this.getCurrentWorldview();
            return JSON.stringify(config, null, 2);
        }

        /**
         * 导入世界观配置
         * @param {string} jsonString - JSON字符串
         * @param {boolean} asCustom - 是否作为自定义模板导入
         * @returns {Object|null} 导入的模板
         */
        importWorldview(jsonString, asCustom = true) {
            try {
                const data = JSON.parse(jsonString);
                if (asCustom) {
                    return this.createCustomTemplate(data);
                } else {
                    // 临时加载，不保存
                    this.currentConfig = data;
                    this.currentWorldviewId = data.id || generateId();
                    this.injectCurrentTheme();
                    return deepClone(data);
                }
            } catch (e) {
                console.error('[世界观引擎] 导入失败: 无效的JSON', e);
                return null;
            }
        }

        // ==================== 调试与信息 ====================

        /**
         * 获取引擎信息
         * @returns {Object} 引擎信息
         */
        getEngineInfo() {
            return {
                version: '16.0.0',
                storageKey: STORAGE_KEY,
                themeStorageKey: THEME_STORAGE_KEY,
                customStorageKey: CUSTOM_STORAGE_KEY,
                defaultWorldview: DEFAULT_WORLDVIEW,
                currentWorldviewId: this.currentWorldviewId,
                initialized: this.initialized,
                builtinTemplatesCount: this.builtinTemplates.length,
                customTemplatesCount: this.customTemplates.length,
                totalTemplatesCount: this.builtinTemplates.length + this.customTemplates.length
            };
        }

        /**
         * 打印当前世界观信息到控制台
         */
        logCurrentWorldview() {
            const template = this.getCurrentWorldview();
            if (!template) {
                console.log('[世界观引擎] 当前未设置世界观');
                return;
            }

            console.group(`[世界观引擎] 当前世界观: ${template.name}`);
            console.log('ID:', template.id);
            console.log('描述:', template.description);
            console.log('机制:', this.getMechanicsConfig());
            console.log('NPC字段数:', (template.npcFields || []).length);
            console.log('地点类型:', this.getLocationTypes());
            console.log('事件模板数:', (template.events?.templates || []).length);
            console.log('货币:', this.getCurrencyConfig());
            console.log('主题:', this.getThemeConfig().name);
            console.log('语言:', this.getLanguageConfig().style);
            console.groupEnd();
        }

        /**
         * 重置为默认状态
         */
        reset() {
            this.currentWorldviewId = DEFAULT_WORLDVIEW;
            this.currentConfig = null;
            this.customTemplates = [];
            this.saveToStorage();
            this.saveCustomTemplates();
            storageSet(THEME_STORAGE_KEY, null);

            this.applyWorldview(DEFAULT_WORLDVIEW);
            this.injectCurrentTheme();

            emitEventBridge('reset', { to: DEFAULT_WORLDVIEW });
            console.log('[世界观引擎] 已重置为默认状态');
        }

        /**
         * 应用世界观配置（内部方法）
         * @param {string} id - 世界观ID
         */
        applyWorldview(id) {
            const template = this.getTemplateById(id);
            if (template) {
                this.currentConfig = deepClone(template);
            } else {
                console.warn(`[世界观引擎] 应用世界观失败: ${id}`);
                this.currentConfig = null;
            }
        }
    }

    // ============================================================
    // 创建全局实例
    // ============================================================

    const worldviewEngine = new WorldviewEngine();

    // ============================================================
    // 暴露到全局
    // ============================================================

    if (typeof window !== 'undefined') {
        window.WorldviewEngine = worldviewEngine;
    }

    if (typeof global !== 'undefined') {
        global.WorldviewEngine = worldviewEngine;
    }

    // AMD / CommonJS / ES Module 兼容
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = worldviewEngine;
    }

    if (typeof define === 'function' && define.amd) {
        define('WorldviewEngine', [], function() {
            return worldviewEngine;
        });
    }

    // ============================================================
    // 初始化完成日志
    // ============================================================

    console.log('[世界观引擎] v16.0.0 加载完成');
    console.log('[世界观引擎] 内置模板:', BUILTIN_TEMPLATES.map(t => t.name).join(', '));
    console.log('[世界观引擎] 默认配色: 古风墨境');
    console.log('[世界观引擎] 使用方式: WorldviewEngine.init()');

})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
