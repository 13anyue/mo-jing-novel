/**
 * =========================================================
 * Event Bridge v4 — 联动中枢
 * Central event bus: all modules broadcast & listen.
 * Key channels: npc, background, map, worldbook, memory,
 *               backup, import, ui-diy, runtime, baike
 * =========================================================
 */
const EventBridge = {
  // { channel: [ { handler, module } ] }
  _listeners: {},

  /**
   * Subscribe to a channel. Returns an unsubscriber function.
   */
  on(channel, handler, moduleName = 'unknown') {
    if (!this._listeners[channel]) this._listeners[channel] = [];
    const entry = { handler, module: moduleName };
    this._listeners[channel].push(entry);
    return () => {
      const idx = this._listeners[channel].indexOf(entry);
      if (idx !== -1) this._listeners[channel].splice(idx, 1);
    };
  },

  /**
   * Publish an event to a channel. All listeners receive { channel, type, payload, source, time }.
   */
  emit(channel, type, payload = {}, source = 'system') {
    const event = { channel, type, payload, source, time: Date.now() };
    const list = this._listeners[channel] || [];
    for (const { handler, module } of list) {
      try { handler(event); } catch (e) { console.warn(`[EventBridge] ${module} handler error:`, e); }
    }
    // Auto-save bridge log for debug / replay
    this._log(channel, event);
  },

  _log(channel, event) {
    const logs = Storage.get('_bridgeLog', []);
    logs.push({ channel, time: event.time, source: event.source, type: event.type });
    if (logs.length > 500) logs.shift();
    Storage.set('_bridgeLog', logs);
  },

  // ===== Built-in cross-module wiring =====
  init() { this.wireAll(); },

  wireAll() {
    // 1. Import → NPC  (role card auto-sync)
    this.on('import', (e) => {
      if (e.type === 'character_imported') {
        const { npcData } = e.payload;
        this.emit('npc', 'sync_from_import', npcData, 'EventBridge');
        // Also refresh runtime selector
        this.emit('runtime', 'npcs_changed', null, 'EventBridge');
      }
    }, 'EventBridge');

    // 2. NPC → Runtime (new NPC available for chat)
    this.on('npc', (e) => {
      if (e.type === 'created' || e.type === 'updated' || e.type === 'sync_from_import') {
        this.emit('runtime', 'npcs_changed', null, 'EventBridge');
      }
    }, 'EventBridge');

    // 3. WorldBook → Runtime (entries injection)
    this.on('worldbook', (e) => {
      if (e.type === 'entry_created' || e.type === 'entry_updated' || e.type === 'entry_deleted') {
        this.emit('runtime', 'worldbook_changed', null, 'EventBridge');
      }
    }, 'EventBridge');

    // 4. Map → Background (go-to location triggers bg swap)
    this.on('map', (e) => {
      if (e.type === 'location_activated' && e.payload?.bgId) {
        this.emit('background', 'runtime_select', e.payload, 'EventBridge');
        this.emit('runtime', 'scene_changed', { bgId: e.payload.bgId, sceneName: e.payload.sceneName }, 'EventBridge');
      }
    }, 'EventBridge');

    // 5. Background → Runtime (runtime selected bg)
    this.on('background', (e) => {
      if (e.type === 'runtime_select') {
        this.emit('runtime', 'bg_changed', e.payload, 'EventBridge');
      }
    }, 'EventBridge');

    // 6. Baike → WorldBook / Memory (auto-save query results)
    this.on('baike', (e) => {
      if (e.type === 'query_result' && e.payload?.saveTarget) {
        const { saveTarget, query, result } = e.payload;
        if (saveTarget === 'worldbook') {
          this.emit('worldbook', 'baike_import', { name: '百科：' + query, content: result, keywords: [query] }, 'EventBridge');
        } else if (saveTarget === 'memory') {
          this.emit('memory', 'baike_import', { content: `百科知识：${query} - ${result}`, category: 'cat_note', type: 'knowledge' }, 'EventBridge');
        }
      }
    }, 'EventBridge');

    // 7. UI-DIY → Runtime (key/button/layout updates)
    this.on('ui-diy', (e) => {
      if (e.type === 'config_changed') {
        this.emit('runtime', 'ui_refresh', e.payload, 'EventBridge');
      }
    }, 'EventBridge');

    // 8. Custom Creator → App navigation (new module registered)
    this.on('custom-creator', (e) => {
      if (e.type === 'module_registered') {
        this.emit('app', 'nav_refresh', e.payload, 'EventBridge');
      }
    }, 'EventBridge');

    // 9. Backup → All modules (after restore, notify every module to reload)
    this.on('backup', (e) => {
      if (e.type === 'restored') {
        this.emit('runtime', 'full_reload', null, 'EventBridge');
        this.emit('npc', 'full_reload', null, 'EventBridge');
        this.emit('background', 'full_reload', null, 'EventBridge');
        this.emit('map', 'full_reload', null, 'EventBridge');
        this.emit('worldbook', 'full_reload', null, 'EventBridge');
        this.emit('memory', 'full_reload', null, 'EventBridge');
        this.emit('app', 'nav_refresh', null, 'EventBridge');
        this.emit('ui-diy', 'full_reload', null, 'EventBridge');
      }
    }, 'EventBridge');

    // 10. Preset → All modules (apply preset pushes config everywhere)
    this.on('preset', (e) => {
      if (e.type === 'applied') {
        const data = e.payload?.data || {};
        if (data.apiConfig) this.emit('api', 'config_applied', data.apiConfig, 'EventBridge');
        if (data.prompts_v2) this.emit('prompts', 'config_applied', data.prompts_v2, 'EventBridge');
        if (data.statusConfig_v2) this.emit('status', 'config_applied', data.statusConfig_v2, 'EventBridge');
        if (data.regexRules) this.emit('regex', 'config_applied', data.regexRules, 'EventBridge');
        if (data.memoryConfig) this.emit('memory', 'config_applied', data.memoryConfig, 'EventBridge');
        if (data.worldBook) this.emit('worldbook', 'config_applied', data.worldBook, 'EventBridge');
      }
    }, 'EventBridge');

    // 11. Assistant → Any module (AI-generated configs pushed to target)
    this.on('assistant', (e) => {
      if (e.type === 'generate_module') {
        const { targetModule, data } = e.payload;
        if (targetModule && data) this.emit(targetModule, 'ai_generated', data, 'EventBridge');
      }
    }, 'EventBridge');

    // 12. Mobile Preview ↔ Runtime (mirror actions in preview)
    this.on('mobile-preview', (e) => {
      if (e.type === 'send_message') {
        this.emit('runtime', 'player_send', e.payload, 'EventBridge');
      }
      if (e.type === 'select_npc') {
        this.emit('runtime', 'npc_selected', e.payload, 'EventBridge');
      }
      if (e.type === 'select_bg') {
        this.emit('runtime', 'bg_selected', e.payload, 'EventBridge');
      }
    }, 'EventBridge');
    this.on('runtime', (e) => {
      if (e.type === 'dialog_updated' || e.type === 'bg_changed' || e.type === 'npc_selected') {
        this.emit('mobile-preview', 'mirror_update', e, 'EventBridge');
      }
    }, 'EventBridge');
  },

  // ===== Debug / utility =====
  getLogs() { return Storage.get('_bridgeLog', []); },
  clearLogs() { Storage.set('_bridgeLog', []); },

  // ===== Preset auto-apply dispatcher =====
  dispatchPreset(data) {
    this.emit('preset', 'applied', { data }, 'EventBridge');
  }
};
