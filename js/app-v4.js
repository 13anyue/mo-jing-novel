/**
 * =========================================================
 * App v4 — 核心应用控制器（v8修复版）
 * =========================================================
 */
const App = {
  version: 'v8',
  currentPage: 'home',
  callbacks: {},
  _modalStack: [],
  async init() {
    try { await Storage.initDB(); } catch(e) { console.warn('[App] Storage.initDB 失败:', e); }
    if (window.EventBridge && typeof EventBridge.init === 'function') {
      try { EventBridge.init(); } catch(e) { console.warn(e); }
    }
    this.loadCustomNavItems();
    this.renderSidebar(); this.renderTopBar(); this.renderBottomNav(); this.bindEvents(); this.initThemes(); this.initModules(); this.handleRoute();
    window.addEventListener('hashchange', () => this.handleRoute());
    if (window.DesignSuiteIntegration && DesignSuiteIntegration.restoreCustomCSS) {
      try { DesignSuiteIntegration.restoreCustomCSS(); } catch(e) { console.warn(e); }
    }
  }
};
