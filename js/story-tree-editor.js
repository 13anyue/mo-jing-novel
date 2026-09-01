/**
 * Story Tree Editor v1
 * 剧情分支树编辑器 —— 可视化创建/编辑多分支剧情结构
 */
(function() {
  'use strict';

  const StoryTreeEditor = {
    init() {
      this.render();
      this.bindEvents();
    },

    render() {
      const container = document.getElementById('page-storytree');
      if (!container) return;
      container.innerHTML = `
        <div class="card">
          <h2 style="font-family:var(--font-display);color:var(--color-primary-dark);">剧情分支树</h2>
          <p style="color:var(--text-muted);margin-top:8px;">在此可视化编辑你的故事分支结构。</p>
          <div id="storyTreeCanvas" style="margin-top:16px;min-height:300px;background:var(--bg-card);border-radius:var(--border-radius);border:1px solid var(--border-color);display:flex;align-items:center;justify-content:center;color:var(--text-muted);">
            （剧情分支树画布占位 —— 后续接入完整功能）
          </div>
        </div>`;
    },

    bindEvents() {
      // 占位：后续绑定交互事件
    }
  };

  // 暴露到全局
  window.StoryTreeEditor = StoryTreeEditor;

  // 当页面切换到 storytree 时自动初始化
  if (window.App && App.callbacks) {
    App.callbacks['storytree'] = { onEnter: () => StoryTreeEditor.init() };
  }
})();
