/**
 * =========================================================
 * Mobile Preview v4 — 小手机模拟器
 * Simulates a phone inside the browser with full VN runtime.
 * Supports multiple device sizes, touch swipe, auto-rotate.
 * Fully linked to all other modules via EventBridge.
 * =========================================================
 */
const MobilePreview = {
  // Device presets
  DEVICES: [
    { id: 'iphone14', name: 'iPhone 14 Pro', width: 393, height: 852, radius: 50, bezel: 12, color: '#1a1a1a', notch: true },
    { id: 'iphoneSE', name: 'iPhone SE', width: 375, height: 667, radius: 40, bezel: 14, color: '#222', notch: false },
    { id: 'pixel7', name: 'Google Pixel 7', width: 412, height: 915, radius: 30, bezel: 8, color: '#0f0f0f', notch: false },
    { id: 's23', name: 'Galaxy S23', width: 360, height: 780, radius: 28, bezel: 10, color: '#1c1c1e', notch: false },
    { id: 'ipad', name: 'iPad Mini', width: 744, height: 1133, radius: 24, bezel: 16, color: '#222', notch: false },
    { id: 'custom', name: '自定义', width: 390, height: 844, radius: 30, bezel: 10, color: '#1a1a1a', notch: false }
  ],

  _currentDevice: 'iphone14',
  _scale: 0.6,
  _orientation: 'portrait',
  _mirrorMode: true,

  init() { this.renderPage(); },
  onEnter() { this.renderPreview(); },

  getDevice(id) { return this.DEVICES.find(d => d.id === id) || this.DEVICES[0]; },
  getCurrentDevice() { return this.getDevice(this._currentDevice); },

  renderPage() {
    const page = document.getElementById('page-mobile-preview');
    if (!page) return;
    page.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:8px;">
        <h2 class="section-title">📱 小手机模拟器</h2>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <select id="mpDeviceSelect" onchange="MobilePreview.selectDevice(this.value)">
            ${this.DEVICES.map(d => `<option value="${d.id}" ${d.id===this._currentDevice?'selected':''}>${d.name}</option>`).join('')}
          </select>
          <button class="btn btn-sm btn-secondary" onclick="MobilePreview.toggleOrientation()">${this._orientation==='portrait'?'↔ 横屏':'↕ 竖屏'}</button>
          <button class="btn btn-sm btn-secondary" onclick="MobilePreview.zoomIn()">🔍+</button>
          <button class="btn btn-sm btn-secondary" onclick="MobilePreview.zoomOut()">🔍-</button>
          <button class="btn btn-sm ${this._mirrorMode?'btn-primary':'btn-secondary'}" onclick="MobilePreview.toggleMirror()">${this._mirrorMode?'🔗 联动中':'断开'}</button>
          <button class="btn btn-sm btn-gold" onclick="MobilePreview.generateApp()">📦 导出App</button>
        </div>
      </div>

      <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap;">
        <!-- Phone Device -->
        <div style="flex:0 0 auto;" id="phoneContainer">
          <div id="phoneFrame" style="position:relative;overflow:hidden;">
            <div id="phoneScreen" style="position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;background:#000;">
              <!-- Simulated VN UI inside phone -->
              <div id="phoneVN" style="width:100%;height:100%;position:relative;overflow:hidden;">
                <img id="phoneBg" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 0.5s;">
                <div id="phoneCharLayer" style="position:absolute;bottom:80px;left:50%;transform:translateX(-50%);height:50%;display:flex;align-items:flex-end;justify-content:center;z-index:10;"></div>
                <div id="phoneStatusBar" style="position:absolute;top:4px;left:4px;right:4px;display:flex;justify-content:space-between;font-size:10px;color:rgba(255,255,255,0.7);z-index:20;padding:2px 6px;">
                  <span>墨境</span><span id="phoneTime">12:00</span>
                </div>
                <div id="phoneControls" style="position:absolute;top:4px;right:4px;z-index:20;display:flex;gap:4px;">
                  <button style="background:rgba(0,0,0,0.5);border:none;color:#fff;padding:4px 8px;border-radius:4px;font-size:10px;cursor:pointer;" onclick="MobilePreview.phoneAction('save')">💾</button>
                  <button style="background:rgba(0,0,0,0.5);border:none;color:#fff;padding:4px 8px;border-radius:4px;font-size:10px;cursor:pointer;" onclick="MobilePreview.phoneAction('load')">📂</button>
                </div>
                <div id="phoneDialogBox" style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.75);padding:12px 16px;z-index:15;">
                  <div id="phoneSpeaker" style="color:var(--color-gold);font-size:12px;font-weight:700;margin-bottom:4px;">--</div>
                  <div id="phoneDialogText" style="color:#fff;font-size:14px;line-height:1.6;min-height:60px;">点击开始对话...</div>
                </div>
                <div id="phoneChoices" style="position:absolute;bottom:80px;left:16px;right:16px;display:none;flex-direction:column;gap:8px;z-index:16;"></div>
                <div id="phoneLoading" style="display:none;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:14px;z-index:40;text-align:center;">
                  <div style="font-size:24px;animation:spin 1s linear infinite;">⚙️</div>
                  <p style="margin-top:4px;">思考中...</p>
                </div>
              </div>
            </div>
            <!-- Notch / camera -->
            <div id="phoneNotch" style="position:absolute;top:0;left:50%;transform:translateX(-50%);background:#000;border-radius:0 0 12px 12px;display:none;"></div>
            <!-- Home bar -->
            <div id="phoneHomeBar" style="position:absolute;bottom:6px;left:50%;transform:translateX(-50%);width:40%;height:4px;background:rgba(255,255,255,0.3);border-radius:2px;z-index:30;"></div>
            <!-- Side buttons -->
            <div id="phoneSideButtons" style="position:absolute;top:120px;right:-3px;width:3px;height:60px;background:rgba(255,255,255,0.15);border-radius:0 2px 2px 0;z-index:-1;"></div>
            <div style="position:absolute;top:190px;right:-3px;width:3px;height:40px;background:rgba(255,255,255,0.15);border-radius:0 2px 2px 0;z-index:-1;"></div>
            <div style="position:absolute;top:120px;left:-3px;width:3px;height:80px;background:rgba(255,255,255,0.15);border-radius:2px 0 0 2px;z-index:-1;"></div>
          </div>
        </div>

        <!-- Controls Panel -->
        <div style="flex:1;min-width:280px;">
          <div class="card" style="margin-bottom:var(--space-md);">
            <div class="card-header"><h3>🎮 快速操作</h3></div>
            <div class="card-body">
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:var(--space-md);">
                <button class="btn btn-primary" onclick="MobilePreview.phoneAction('start')">▶️ 开始</button>
                <button class="btn btn-secondary" onclick="MobilePreview.phoneAction('skip')">⏭ 跳过</button>
                <button class="btn btn-secondary" onclick="MobilePreview.phoneAction('auto')">⚡ 自动</button>
                <button class="btn btn-secondary" onclick="MobilePreview.phoneAction('history')">📜 历史</button>
              </div>
              <div class="form-group" style="margin-bottom:8px;">
                <input type="text" id="phoneInput" placeholder="输入对话..." style="width:100%;" onkeydown="if(event.key==='Enter')MobilePreview.phoneSend()">
              </div>
              <button class="btn btn-primary" style="width:100%;" onclick="MobilePreview.phoneSend()">📤 发送</button>
            </div>
          </div>

          <div class="card" style="margin-bottom:var(--space-md);">
            <div class="card-header"><h3>📊 模拟数据</h3></div>
            <div class="card-body">
              <div class="form-group"><label>角色</label><select id="phoneNPCSelect" onchange="MobilePreview.phoneSelectNPC(this.value)"></select></div>
              <div class="form-group"><label>场景</label><select id="phoneSceneSelect" onchange="MobilePreview.phoneSelectScene(this.value)"></select></div>
              <div class="form-group"><label>背景</label><select id="phoneBGSelect" onchange="MobilePreview.phoneSelectBg(this.value)"></select></div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3>⚙️ 设备设置</h3></div>
            <div class="card-body">
              <div class="form-group"><label>宽度(px)</label><input type="number" id="customWidth" value="393" min="200" max="1200" onchange="MobilePreview.updateCustomDevice()"></div>
              <div class="form-group"><label>高度(px)</label><input type="number" id="customHeight" value="852" min="300" max="2000" onchange="MobilePreview.updateCustomDevice()"></div>
              <div class="form-group"><label>圆角(px)</label><input type="number" id="customRadius" value="50" min="0" max="100" onchange="MobilePreview.updateCustomDevice()"></div>
              <div class="hint">选择"自定义"设备后调整以上参数</div>
            </div>
          </div>
        </div>
      </div>
    `;
    this.renderPreview();
    this.updatePhoneTime();
    setInterval(() => this.updatePhoneTime(), 60000);
  },

  renderPreview() {
    const device = this.getCurrentDevice();
    const isLandscape = this._orientation === 'landscape';
    const w = isLandscape ? device.height * this._scale : device.width * this._scale;
    const h = isLandscape ? device.width * this._scale : device.height * this._scale;
    const bezel = device.bezel * this._scale;
    const frameW = w + bezel * 2;
    const frameH = h + bezel * 2;

    const frame = document.getElementById('phoneFrame');
    if (!frame) return;
    frame.style.cssText = `
      width:${frameW}px; height:${frameH}px;
      border-radius:${device.radius * this._scale}px;
      background:${device.color};
      padding:${bezel}px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4), inset 0 0 10px rgba(255,255,255,0.05);
      position: relative;
    `;

    const notch = document.getElementById('phoneNotch');
    if (notch) {
      notch.style.display = device.notch ? 'block' : 'none';
      notch.style.cssText = device.notch
        ? `position:absolute;top:0;left:50%;transform:translateX(-50%);width:${60*this._scale}px;height:${28*this._scale}px;background:#000;border-radius:0 0 ${12*this._scale}px ${12*this._scale}px;z-index:25;`
        : 'display:none;';
    }

    // Refresh selectors
    this.refreshSelectors();
  },

  refreshSelectors() {
    const npcs = NPCManager?.getNPCs?.() || Storage.get('npcs_v3', []);
    const npcSel = document.getElementById('phoneNPCSelect');
    if (npcSel) npcSel.innerHTML = '<option value="">-- 角色 --</option>' + npcs.map(n => `<option value="${n.id}">${n.name}</option>`).join('');

    const bgs = BackgroundLibrary?.getBackgrounds?.() || Storage.get('backgrounds_v3', []);
    const bgSel = document.getElementById('phoneBGSelect');
    if (bgSel) bgSel.innerHTML = '<option value="">-- 背景 --</option>' + bgs.map(b => `<option value="${b.id}">${b.name}</option>`).join('');

    const scenes = MapSystem?.getMaps?.() || [];
    const sceneSel = document.getElementById('phoneSceneSelect');
    if (sceneSel) sceneSel.innerHTML = '<option value="">-- 场景 --</option>' + scenes.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
  },

  selectDevice(id) { this._currentDevice = id; this.renderPreview(); },
  toggleOrientation() { this._orientation = this._orientation === 'portrait' ? 'landscape' : 'portrait'; this.renderPreview(); },
  zoomIn() { this._scale = Math.min(this._scale + 0.1, 1.2); this.renderPreview(); },
  zoomOut() { this._scale = Math.max(this._scale - 0.1, 0.3); this.renderPreview(); },
  toggleMirror() { this._mirrorMode = !this._mirrorMode; this.renderPreview(); App.toast(this._mirrorMode ? '联动模式开启' : '联动模式关闭', 'info'); },
  updateCustomDevice() {
    const w = parseInt(document.getElementById('customWidth')?.value || 393);
    const h = parseInt(document.getElementById('customHeight')?.value || 852);
    const r = parseInt(document.getElementById('customRadius')?.value || 50);
    const custom = this.DEVICES.find(d => d.id === 'custom');
    if (custom) { custom.width = w; custom.height = h; custom.radius = r; }
    if (this._currentDevice === 'custom') this.renderPreview();
  },

  updatePhoneTime() {
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const el = document.getElementById('phoneTime');
    if (el) el.textContent = timeStr;
  },

  // ===== Phone Actions =====
  async phoneSelectNPC(id) {
    if (!id) return;
    const npc = (NPCManager?.getNPCs?.() || []).find(n => n.id === id);
    if (!npc) return;
    const layer = document.getElementById('phoneCharLayer');
    if (npc.portraitId) {
      const d = await Storage.getImage(npc.portraitId);
      if (d && layer) {
        const imgRec = await Storage.dbGet('images', npc.portraitId);
        const isTrans = imgRec?.meta?.transparent === true;
        if (isTrans) {
          layer.innerHTML = `<img src="${d}" style="max-height:100%;max-width:100%;object-fit:contain;">`;
        } else {
          layer.innerHTML = `<div style="padding:4px;background:linear-gradient(135deg, #F5E6D3 0%, #e8d5b7 100%);border:2px solid #C9A227;border-radius:6px;box-shadow:0 0 15px rgba(201,162,39,0.3);"><img src="${d}" style="max-height:100%;max-width:100%;object-fit:contain;border-radius:3px;"></div>`;
        }
      }
    }
    if (this._mirrorMode) EventBridge.emit('mobile-preview', 'select_npc', { npcId: id }, 'MobilePreview');
  },

  async phoneSelectBg(id) {
    const bg = (BackgroundLibrary?.getBackgrounds?.() || Storage.get('backgrounds_v3', [])).find(b => b.id === id);
    if (!bg) return;
    const d = await Storage.getImage(bg.imageId);
    const img = document.getElementById('phoneBg');
    if (img && d) { img.src = d; img.style.opacity = '1'; }
    if (this._mirrorMode) EventBridge.emit('mobile-preview', 'select_bg', { bgId: id }, 'MobilePreview');
  },

  phoneSelectScene(id) {
    const map = MapSystem?.getMap?.(id);
    if (map && map.markers?.[0]) this.phoneSelectBg(map.markers[0].bgId);
  },

  async phoneSend() {
    const input = document.getElementById('phoneInput');
    if (!input) return;
    const text = input.value.trim(); if (!text) return;
    input.value = '';
    const npcId = document.getElementById('phoneNPCSelect')?.value;
    this.phoneShowDialog('玩家', text);
    if (npcId) await this.phoneGenReply(npcId, text);
  },

  async phoneGenReply(npcId, playerText) {
    const loading = document.getElementById('phoneLoading');
    if (loading) loading.style.display = 'block';
    try {
      const npc = (NPCManager?.getNPCs?.() || []).find(n => n.id === npcId);
      if (!npc) { this.phoneShowDialog('系统', '未找到角色'); return; }

      const histText = (this._phoneHistory || []).slice(-4).map(h => `${h.speaker}：${h.content}`).join('\n');
      const recalled = MemorySystem ? await MemorySystem.recall(playerText, { npcId }) : [];
      const memText = recalled.map(r => r.memory.content).join('\n') || '(无)';
      const wbText = WorldBook ? WorldBook.getInjectionText(playerText + ' ' + histText) : '';

      let sysPrompt = '', userPrompt = '';
      if (PromptSystem?.buildNPCPrompt) {
        const pd = PromptSystem.buildNPCPrompt(npcId, { history: histText, memory: memText, scene: '手机模拟场景' });
        sysPrompt = pd.system; userPrompt = pd.user;
      } else {
        sysPrompt = `你是${npc.name}。性格：${npc.personality || ''}。背景：${npc.background || ''}`;
        userPrompt = playerText;
      }
      if (wbText) sysPrompt += '\n\n【世界设定】\n' + wbText;

      const messages = [{ role: 'system', content: sysPrompt }];
      (this._phoneHistory || []).slice(-6).forEach(h => messages.push({ role: h.speaker === '玩家' ? 'user' : 'assistant', content: h.content }));
      messages.push({ role: 'user', content: userPrompt });

      let reply;
      try { reply = await APISettings.chat(null, messages); }
      catch (e) { reply = '（API调用失败：' + e.message + '）'; }

      this.phoneShowDialog(npc.name || '角色', reply, true);
      if (!this._phoneHistory) this._phoneHistory = [];
      this._phoneHistory.push({ speaker: '玩家', content: playerText });
      this._phoneHistory.push({ speaker: npc.name || '角色', content: reply });

      if (this._mirrorMode) {
        EventBridge.emit('mobile-preview', 'send_message', { text: playerText, npcId }, 'MobilePreview');
      }
    } catch (e) { this.phoneShowDialog('错误', e.message); }
    finally { if (loading) loading.style.display = 'none'; }
  },

  phoneShowDialog(speaker, text, typewriter = false) {
    const spEl = document.getElementById('phoneSpeaker');
    const txtEl = document.getElementById('phoneDialogText');
    if (!spEl || !txtEl) return;
    spEl.textContent = speaker;
    if (typewriter) {
      let i = 0; txtEl.textContent = '';
      const timer = setInterval(() => {
        if (i < text.length) { txtEl.textContent += text[i]; i++; }
        else clearInterval(timer);
      }, 25);
    } else { txtEl.textContent = text; }
  },

  phoneAction(action) {
    switch (action) {
      case 'start': this.phoneShowDialog('系统', '欢迎来到墨境手机版！选择角色开始对话。'); break;
      case 'skip': break;
      case 'auto': App.toast('自动播放请在桌面版设置', 'info'); break;
      case 'history':
        const hist = (this._phoneHistory || []).map(h => `${h.speaker}：${h.content}`).join('\n');
        App.showModal('📜 手机对话历史', `<div style="font-size:13px;line-height:1.6;white-space:pre-wrap;">${hist || '无记录'}</div>`);
        break;
      case 'save':
        Storage.set('phoneHistory_backup', this._phoneHistory);
        App.toast('手机对话已存档', 'success');
        break;
      case 'load':
        this._phoneHistory = Storage.get('phoneHistory_backup', []);
        App.toast('手机对话已读档', 'success');
        break;
    }
  },

  // ===== App Export =====
  generateApp() {
    const device = this.getCurrentDevice();
    const html = this.buildAppHTML(device);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `墨境手机版_${device.name.replace(/\s+/g,'_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    App.toast(`已导出「墨境手机版-${device.name}」`, 'success');
  },

  buildAppHTML(device) {
    // Build a self-contained single-file HTML app
    const npcs = NPCManager?.getNPCs?.() || Storage.get('npcs_v3', []);
    const bgs = BackgroundLibrary?.getBackgrounds?.() || Storage.get('backgrounds_v3', []);

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#2C1810">
<title>墨境 - 手机版</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { background:#1a1a1a; color:#fff; font-family: -apple-system, sans-serif; overflow:hidden; }
#app { position:fixed; top:0; left:0; width:100%; height:100%; display:flex; flex-direction:column; }
#bg { position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; opacity:0; transition:opacity 0.5s; z-index:1; }
#charLayer { position:absolute; bottom:80px; left:50%; transform:translateX(-50%); height:50%; z-index:5; display:flex; align-items:flex-end; justify-content:center; }
#charLayer img { max-height:100%; max-width:100%; object-fit:contain; }
#dialogBox { position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.8); padding:12px 16px; z-index:10; }
#speaker { color:#C9A227; font-size:13px; font-weight:700; margin-bottom:4px; }
#dialogText { color:#fff; font-size:15px; line-height:1.6; min-height:60px; }
#inputArea { position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.9); padding:8px 12px; display:flex; gap:8px; z-index:20; }
#inputArea input { flex:1; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); border-radius:20px; padding:8px 14px; color:#fff; font-size:14px; }
#inputArea button { background:#C9A227; border:none; border-radius:20px; padding:8px 16px; color:#2C1810; font-weight:700; }
#choices { position:absolute; bottom:80px; left:16px; right:16px; display:none; flex-direction:column; gap:8px; z-index:15; }
.choice-btn { background:rgba(0,0,0,0.7); border:1px solid #C9A227; border-radius:8px; padding:12px; color:#fff; text-align:center; font-size:14px; }
#topBar { position:absolute; top:0; left:0; right:0; display:flex; justify-content:space-between; padding:8px 12px; z-index:10; font-size:12px; color:rgba(255,255,255,0.6); }
#loading { display:none; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); z-index:40; text-align:center; color:#fff; }
@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
</style>
</head>
<body>
<div id="app">
  <img id="bg" alt="">
  <div id="charLayer"></div>
  <div id="topBar"><span>墨境</span><span id="time"></span></div>
  <div id="dialogBox"><div id="speaker">--</div><div id="dialogText">选择角色开始对话...</div></div>
  <div id="choices"></div>
  <div id="loading"><div style="font-size:32px;animation:spin 1s linear infinite;">⚙️</div><p>思考中...</p></div>
  <div id="inputArea">
    <input type="text" id="msgInput" placeholder="输入对话...">
    <button onclick="send()">发送</button>
  </div>
</div>
<script>
const NPCs = ${JSON.stringify(npcs.map(n => ({ id: n.id, name: n.name, portraitId: n.portraitId, personality: n.personality, background: n.background })))};
const BGs = ${JSON.stringify(bgs.map(b => ({ id: b.id, name: b.name, imageId: b.imageId })))};
let currentNPC = null, history = [];

function setSpeaker(name) { document.getElementById('speaker').textContent = name; }
function setText(text) { document.getElementById('dialogText').textContent = text; }
function showLoading(show) { document.getElementById('loading').style.display = show ? 'block' : 'none'; }
function updateTime() { const n=new Date(); document.getElementById('time').textContent=n.getHours().toString().padStart(2,'0')+':'+n.getMinutes().toString().padStart(2,'0'); }
setInterval(updateTime, 60000); updateTime();

function selectNPC(id) { currentNPC = NPCs.find(n=>n.id===id); if(!currentNPC) return; }
function selectBg(id) { const bg=BGs.find(b=>b.id===id); if(!bg)return; /* Would need image data */ }
function send() { const input=document.getElementById('msgInput'); const text=input.value.trim(); if(!text||!currentNPC)return; input.value=''; setSpeaker('玩家'); setText(text); showLoading(true); setTimeout(()=>{ setSpeaker(currentNPC.name); setText('（此为演示模式，请配置API后使用完整版）'); showLoading(false); history.push({speaker:'玩家',content:text}); history.push({speaker:currentNPC.name,content:'演示回复'}); }, 1500); }
</script>
</body>
</html>`;
  }
};
