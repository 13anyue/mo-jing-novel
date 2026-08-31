/**
 * MarkdownRenderer.js
 * 纯前端 Markdown 渲染引擎，古风墨境主题
 * @version 1.0.0
 * @author DuMate
 *
 * 配色方案：
 *   - 背景色：#F5E6D3（暖羊皮纸底色）
 *   - 文字色：#2C1810（墨色）
 *   - 强调色：#C9A227（金色）
 *   - 次要色：#8B7355（次要文字）
 * 字体：Noto Serif SC
 */

// 全局 MarkdownRenderer 对象
const MarkdownRenderer = {

    /**
     * 将 Markdown 文本渲染为古风主题的 HTML 字符串
     * @param {string} text - Markdown 原文
     * @returns {string} 渲染后的 HTML 字符串
     */
    render(text) {
        if (!text) return '';

        // 预处理：统一换行符，去除首尾空白
        let md = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

        // 按块级元素拆分（代码块、引用、列表、标题、段落、分割线）
        const blocks = this._splitIntoBlocks(md);

        // 逐块渲染并拼接
        const htmlParts = blocks.map(block => this._renderBlock(block));

        return htmlParts.join('\n');
    },

    /**
     * 将 Markdown 文本拆分为块级元素数组
     * @private
     * @param {string} md
     * @returns {Array<{type: string, content: string}>}
     */
    _splitIntoBlocks(md) {
        const blocks = [];
        const lines = md.split('\n');
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];

            // 空行：跳过
            if (line.trim() === '') {
                i++;
                continue;
            }

            // 代码块 ```
            if (line.startsWith('```')) {
                const lang = line.slice(3).trim();
                let codeContent = '';
                i++;
                while (i < lines.length && !lines[i].startsWith('```')) {
                    codeContent += (codeContent ? '\n' : '') + lines[i];
                    i++;
                }
                i++; // 跳过结束 ```
                blocks.push({ type: 'codeblock', lang, content: codeContent });
                continue;
            }

            // 分割线 ---
            if (/^---+\s*$/.test(line)) {
                blocks.push({ type: 'hr', content: '' });
                i++;
                continue;
            }

            // 标题 # ## ###
            const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
            if (headingMatch) {
                blocks.push({ type: 'heading', level: headingMatch[1].length, content: headingMatch[2].trim() });
                i++;
                continue;
            }

            // 引用块 >
            if (line.startsWith('>')) {
                let quoteContent = '';
                while (i < lines.length && lines[i].startsWith('>')) {
                    quoteContent += (quoteContent ? '\n' : '') + lines[i].slice(1).trimStart();
                    i++;
                }
                blocks.push({ type: 'blockquote', content: quoteContent.trim() });
                continue;
            }

            // 无序列表 - item
            if (/^[-*+]\s+/.test(line)) {
                let listItems = [];
                while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
                    listItems.push(lines[i].replace(/^[-*+]\s+/, '').trim());
                    i++;
                    // 跳过空行
                    while (i < lines.length && lines[i].trim() === '') i++;
                }
                blocks.push({ type: 'ul', items: listItems });
                continue;
            }

            // 有序列表 1. item
            const olMatch = line.match(/^(\d+)\.\s+(.*)$/);
            if (olMatch) {
                let listItems = [];
                while (i < lines.length) {
                    const olLineMatch = lines[i].match(/^(\d+)\.\s+(.*)$/);
                    if (olLineMatch) {
                        listItems.push(olLineMatch[2].trim());
                        i++;
                        while (i < lines.length && lines[i].trim() === '') i++;
                    } else {
                        break;
                    }
                }
                blocks.push({ type: 'ol', items: listItems });
                continue;
            }

            // 普通段落（连续非空行）
            let paraLines = [];
            while (i < lines.length && lines[i].trim() !== '' &&
                   !lines[i].startsWith('```') &&
                   !/^---+\s*$/.test(lines[i]) &&
                   !/^#{1,3}\s+/.test(lines[i]) &&
                   !lines[i].startsWith('>') &&
                   !/^[-*+]\s+/.test(lines[i]) &&
                   !/^\d+\.\s+/.test(lines[i])) {
                paraLines.push(lines[i]);
                i++;
            }
            blocks.push({ type: 'paragraph', content: paraLines.join('\n').trim() });
        }

        return blocks;
    },

    /**
     * 渲染单个块级元素
     * @private
     * @param {Object} block
     * @returns {string}
     */
    _renderBlock(block) {
        switch (block.type) {
            case 'heading':
                return this._renderHeading(block.level, block.content);
            case 'paragraph':
                return this._renderParagraph(block.content);
            case 'blockquote':
                return this._renderBlockquote(block.content);
            case 'hr':
                return this._renderHr();
            case 'ul':
                return this._renderUl(block.items);
            case 'ol':
                return this._renderOl(block.items);
            case 'codeblock':
                return this._renderCodeBlock(block.content, block.lang);
            default:
                return '';
        }
    },

    /**
     * 渲染标题
     * @private
     * @param {number} level
     * @param {string} text
     * @returns {string}
     */
    _renderHeading(level, text) {
        const tag = `h${level}`;
        const fontSize = level === 1 ? '28px' : level === 2 ? '24px' : '20px';
        const margin = level === 1 ? '24px 0 16px 0' : level === 2 ? '20px 0 12px 0' : '16px 0 10px 0';
        const escaped = this._renderInline(text);
        return `<${tag} style="font-family:'Noto Serif SC',serif;font-size:${fontSize};font-weight:700;color:#2C1810;margin:${margin};padding-bottom:8px;border-bottom:2px solid #C9A227;line-height:1.4;">${escaped}</${tag}>`;
    },

    /**
     * 渲染普通段落
     * @private
     * @param {string} text
     * @returns {string}
     */
    _renderParagraph(text) {
        const rendered = this._renderInline(text);
        return `<p style="font-family:'Noto Serif SC',serif;font-size:16px;line-height:1.8;color:#2C1810;margin:0 0 16px 0;text-indent:2em;">${rendered}</p>`;
    },

    /**
     * 渲染引用块
     * @private
     * @param {string} text
     * @returns {string}
     */
    _renderBlockquote(text) {
        const rendered = this._renderInline(text);
        return `<blockquote style="font-family:'Noto Serif SC',serif;font-size:16px;line-height:1.8;color:#2C1810;margin:16px 0;padding:12px 20px;background:#F5E6D3;border-left:4px solid #C9A227;border-radius:0 8px 8px 0;font-style:italic;">${rendered}</blockquote>`;
    },

    /**
     * 渲染分割线
     * @private
     * @returns {string}
     */
    _renderHr() {
        return `<hr style="border:none;height:2px;background:linear-gradient(90deg,transparent,#C9A227,transparent);margin:24px 0;opacity:0.6;">`;
    },

    /**
     * 渲染无序列表
     * @private
     * @param {Array<string>} items
     * @returns {string}
     */
    _renderUl(items) {
        const liHtml = items.map(item => {
            const rendered = this._renderInline(item);
            return `<li style="margin-bottom:8px;padding-left:4px;">${rendered}</li>`;
        }).join('');
        return `<ul style="font-family:'Noto Serif SC',serif;font-size:16px;line-height:1.8;color:#2C1810;margin:16px 0;padding-left:28px;list-style:none;">${liHtml}</ul>`;
    },

    /**
     * 渲染有序列表
     * @private
     * @param {Array<string>} items
     * @returns {string}
     */
    _renderOl(items) {
        const liHtml = items.map((item, idx) => {
            const rendered = this._renderInline(item);
            return `<li style="margin-bottom:8px;padding-left:4px;counter-increment:ol-counter;">${rendered}</li>`;
        }).join('');
        return `<ol style="font-family:'Noto Serif SC',serif;font-size:16px;line-height:1.8;color:#2C1810;margin:16px 0;padding-left:28px;list-style:none;counter-reset:ol-counter;">${liHtml}</ol>`;
    },

    /**
     * 渲染代码块
     * @private
     * @param {string} code
     * @param {string} lang
     * @returns {string}
     */
    _renderCodeBlock(code, lang) {
        const escaped = this.escapeHtml(code);
        const langLabel = lang ? `<div style="font-size:12px;color:#8B7355;margin-bottom:8px;font-family:'Noto Serif SC',serif;">${this.escapeHtml(lang)}</div>` : '';
        return `<pre style="font-family:'Noto Serif SC',monospace;font-size:14px;line-height:1.6;color:#2C1810;background:#F5E6D3;border:1px solid #C9A227;border-radius:8px;padding:16px;margin:16px 0;overflow-x:auto;white-space:pre-wrap;word-break:break-all;">${langLabel}<code>${escaped}</code></pre>`;
    },

    /**
     * 渲染行内元素（加粗、斜体、行内代码、链接、图片）
     * @private
     * @param {string} text
     * @returns {string}
     */
    _renderInline(text) {
        let result = text;

        // 转义 HTML 特殊字符（但保留即将渲染的 markdown 语法标记）
        // 先处理图片 ![alt](url)
        result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
            const safeAlt = this.escapeHtml(alt);
            const safeUrl = this.escapeHtml(url);
            return `<img src="${safeUrl}" alt="${safeAlt}" style="max-width:100%;height:auto;display:block;margin:12px auto;border-radius:4px;border:1px solid #C9A227;">`;
        });

        // 处理链接 [text](url)
        result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
            const safeText = this.escapeHtml(linkText);
            const safeUrl = this.escapeHtml(url);
            return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color:#C9A227;text-decoration:none;border-bottom:1px solid #C9A227;transition:opacity 0.2s;">${safeText}</a>`;
        });

        // 处理行内代码 `code`
        result = result.replace(/`([^`]+)`/g, (match, code) => {
            const safeCode = this.escapeHtml(code);
            return `<code style="font-family:'Noto Serif SC',monospace;font-size:14px;color:#C9A227;background:rgba(201,162,39,0.1);padding:2px 6px;border-radius:4px;border:1px solid rgba(201,162,39,0.3);">${safeCode}</code>`;
        });

        // 处理加粗 **text**
        result = result.replace(/\*\*([^*]+)\*\*/g, (match, boldText) => {
            return `<strong style="font-weight:700;color:#2C1810;">${this.escapeHtml(boldText)}</strong>`;
        });

        // 处理斜体 *text*（不与加粗冲突，单星号）
        result = result.replace(/\*([^*]+)\*/g, (match, italicText) => {
            return `<em style="font-style:italic;color:#8B7355;">${this.escapeHtml(italicText)}</em>`;
        });

        // 最后对剩余普通文本进行 HTML 转义
        result = this._escapeRemainingHtml(result);

        return result;
    },

    /**
     * 转义 HTML 特殊字符，但跳过已生成的 HTML 标签
     * @private
     * @param {string} text
     * @returns {string}
     */
    _escapeRemainingHtml(text) {
        // 使用一个占位符策略：先保护已生成的 HTML 标签，再转义其余文本
        const tags = [];
        let processed = text.replace(/(<[^>]+>)/g, (match) => {
            tags.push(match);
            return `\x00TAG_${tags.length - 1}\x00`;
        });

        // 转义剩余文本中的 HTML 特殊字符
        processed = processed
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // 恢复标签
        tags.forEach((tag, i) => {
            processed = processed.replace(`\x00TAG_${i}\x00`, tag);
        });

        return processed;
    },

    /**
     * HTML 特殊字符转义（辅助函数，防 XSS）
     * @param {string} str
     * @returns {string}
     */
    escapeHtml(str) {
        if (typeof str !== 'string') return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
};

// 导出模块（支持 ES Module / CommonJS / 浏览器全局）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MarkdownRenderer };
}
