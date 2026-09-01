/**
 * =========================================================
 * Emoji → SVG 运行时替换器 v1
 * 自动将界面按钮/标题中的 emoji 替换为 SVG 图标
 * 原理：MutationObserver 监听 DOM 变化，只替换特定元素内的文本
 * =========================================================
 */
const EmojiSVGReplacer = {
  // emoji → SVG symbol ID 映射（只使用 index.html 中已定义的 symbol）
  MAP: {
    // 操作类
    '➕': 'icon-creator', '➕ ': 'icon-creator',
    '✏️': 'icon-skills',
    '🗑️': 'icon-design',
    '❌': 'icon-design',
    '✅': 'icon-skills',
    '✨': 'icon-presets',
    '🤖': 'icon-assistant',
    '🔍': 'icon-baike',
    '📥': 'icon-import',
    '📤': 'icon-backup',
    '⬅️': 'icon-import',
    '←': 'icon-import',
    '🔙': 'icon-import',

    // 模块/功能
    '🎮': 'icon-game',
    '📂': 'icon-import',
    '📖': 'icon-worldbook',
    '🎭': 'icon-npc',
    '👤': 'icon-npc',
    '🖼️': 'icon-bg',
    '🎵': 'icon-music',
    '🗺️': 'icon-map',
    '📊': 'icon-status',
    '📝': 'icon-prompts',
    '💾': 'icon-backup',
    '⚙️': 'icon-skills',
    '🏆': 'icon-cg',
    '💬': 'icon-memory',
    '📧': 'icon-notes',
    '📱': 'icon-mobile',
    '🚀': 'icon-pwa',
    '🎯': 'icon-creator',
    '🔗': 'icon-relations',
    '📒': 'icon-notes',
    '🕸️': 'icon-relations',
    '🎬': 'icon-cg',
    '🏗️': 'icon-creator',
    '👆': 'icon-status',
    '🚫': 'icon-design',
    '🔁': 'icon-pwa',
    '⏸': 'icon-status',
    '▶': 'icon-game',
    '▶️': 'icon-game',
    '🏷️': 'icon-prompts',
    '📋': 'icon-notes',
    '🔮': 'icon-baike',
    '🎁': 'icon-creator',
    '💡': 'icon-baike',
    '🔥': 'icon-regex',
    '⭐': 'icon-cg',
    '🌟': 'icon-cg',
    '💎': 'icon-cg',
    '🔔': 'icon-memory',
    '📢': 'icon-baike',
    '🎊': 'icon-cg',
    '🎉': 'icon-cg',
    '🏅': 'icon-cg',
    '🥇': 'icon-cg',
    '🥈': 'icon-cg',
    '🥉': 'icon-cg',

    // 其他
    '📦': 'icon-presets',
    '🔧': 'icon-skills',
    '📜': 'icon-worldbook',
    '🎨': 'icon-ui',
    '⚔️': 'icon-regex',
    '👑': 'icon-memory',
    '💰': 'icon-cg',
    '🏠': 'icon-home',
    '☰': 'icon-ui',
    '☰️': 'icon-ui',
    '✕': 'icon-design',
    '×': 'icon-design',
    '✕️': 'icon-design',
  },

  init() {
    // 延迟启动，确保 SVG sprite 已加载
    setTimeout(() => {
      this._replaceInDocument();
      this._startObserver();
      console.log('[EmojiSVGReplacer] 初始化完成，已扫描文档');
    }, 200);
  },

  _startObserver() {
    this._observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this._replaceInElement(node);
          }
        }
      }
    });
    this._observer.observe(document.body, { childList: true, subtree: true });
  },

  _replaceInDocument() {
    // 只替换 UI 控件中的 emoji，保留正文文本中的 emoji
    const selectors = [
      '.btn', '.nav-item', '.launcher-btn', '.launcher-btn-small',
      '.sh-btn', '.context-menu-item', '.juncheng-hbtn',
      '.portal-action-btn', '.ranking-btn', '.map-v12-type-btn',
      '.top-actions button', '.menu-toggle', '.btn-icon',
      '.card-header h3', '.modal-header h3', '.section-title',
      '.sh-title', '.sh-stat', '.ranking-card-h', '.ranking-empty-icon',
      '.portal-meta-item', '.portal-action-icon', '.portal-object-icon',
      '.context-menu-item', '.juncheng-hbtn', '.juncheng-btn-group button',
      'button', '.btn-sm', '.btn-primary', '.btn-secondary', '.btn-gold', '.btn-danger'
    ];
    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach(el => this._replaceInElement(el));
    }
  },

  _replaceInElement(el) {
    // 跳过已经处理过的元素和 SVG 内部
    if (el.dataset && el.dataset.emojiReplaced === '1') return;
    if (el.tagName === 'svg' || el.tagName === 'use' || el.tagName === 'path') return;
    if (el.closest('svg')) return;

    // 收集所有纯文本子节点
    const textNodes = [];
    for (const child of el.childNodes) {
      if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
        textNodes.push(child);
      }
    }

    let replacedAny = false;
    for (const node of textNodes) {
      let text = node.textContent;
      let changed = false;
      for (const [emoji, iconId] of Object.entries(this.MAP)) {
        if (text.includes(emoji)) {
          text = text.split(emoji).join(`{SVG:${iconId}}`);
          changed = true;
        }
      }
      if (changed) {
        const span = document.createElement('span');
        span.innerHTML = text.replace(/{SVG:([^}]+)}/g, (match, iconId) => {
          return `<svg width="16" height="16" style="display:inline-block;vertical-align:middle;margin:0 3px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="#${iconId}"/></svg>`;
        });
        node.parentNode.replaceChild(span, node);
        replacedAny = true;
      }
    }

    if (replacedAny && el.dataset) {
      el.dataset.emojiReplaced = '1';
    }
  }
};

// 自动初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => EmojiSVGReplacer.init());
} else {
  EmojiSVGReplacer.init();
}
