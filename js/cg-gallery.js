/**
 * =========================================================
 * CG Gallery v5 — 君成录风格场景CG系统
 * Worldview-driven CG generation. User writes or AI generates
 * scene illustrations tied to story progress.
 * =========================================================
 */
const CGGallery = {
  // CG rarity tiers
  TIERS: [
    { id: 'common', name: '寻常', color: '#8B7355', label: '寻常场景' },
    { id: 'rare', name: '珍稀', color: '#4A90C2', label: '珍稀CG' },
    { id: 'epic', name: '史诗', color: '#9C27B0', label: '史诗CG' },
    { id: 'legendary', name: '传说', color: '#C9A227', label: '传说CG' }
  ],

  // CG types matching Jun Cheng Lu style
  CG_TYPES: [
    { id: 'scene', name: '场景', icon: 'landscape', desc: '世界观场景插画' },
    { id: 'event', name: '事件', icon: 'sparkles', desc: '剧情事件CG' },
    { id: 'character', name: '人物', icon: 'user', desc: '角色专属CG' },
    { id: 'ending', name: '结局', icon: 'flag', desc: '结局CG (HE/BE)' },
    { id: 'item', name: '物品', icon: 'gem', desc: '关键道具CG' },
    { id: 'memory', name: '回忆', icon: 'clock', desc: '回忆场景CG' }
  ],

  _currentFilter: 'all',
  _currentType: 'all',
  _currentTier: 'all',

  init() { this.renderPage(); },
  onEnter() { this.renderGallery(); },

  getCGs() { return Storage.get('cgGallery_v5', []); },
  saveCGs(list) { Storage.set('cgGallery_v5', list); },

  renderPage() {
    const page = document.getElementById('page-cg-gallery');
    if (!page) return;
    page.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:8px;">
        <h2 class="section-title">🖼️ CG画廊</h2>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-gold" onclick="CGGallery.aiGenerateCG()">✨ AI生成CG</button>
          <button class="btn btn-primary" onclick="CGGallery.openUploader()">➕ 添加CG</button>
          <button class="btn btn-secondary" onclick="CGGallery.showHelp()">❓ 说明</button>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-4" style="margin-bottom:var(--space-lg);">
        ${this.TIERS.map(t => `
          <div class="card" style="border-left:3px solid ${t.color};">
            <div class="card-body" style="text-align:center;">
              <div style="font-size:24px;font-weight:700;color:${t.color};" id="cgStat_${t.id}">0</div>
              <div style="font-size:12px;color:var(--text-muted);">${t.label}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Filters -->
      <div style="display:flex;gap:8px;margin-bottom:var(--space-md);flex-wrap:wrap;align-items:center;">
        <span style="font-size:13px;color:var(--text-secondary);">类型：</span>
        <button class="btn btn-sm ${this._currentType==='all'?'btn-primary':'btn-secondary'}" onclick="CGGallery.filterType('all')">全部</button>
        ${this.CG_TYPES.map(t => `<button class="btn btn-sm ${this._currentType===t.id?'btn-primary':'btn-secondary'}" onclick="CGGallery.filterType('${t.id}')">${t.name}</button>`).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-bottom:var(--space-lg);flex-wrap:wrap;align-items:center;">
        <span style="font-size:13px;color:var(--text-secondary);">稀有度：</span>
        <button class="btn btn-sm ${this._currentTier==='all'?'btn-primary':'btn-secondary'}" onclick="CGGallery.filterTier('all')">全部</button>
        ${this.TIERS.map(t => `<button class="btn btn-sm ${this._currentTier===t.id?'btn-primary':'btn-secondary'}" style="border-color:${t.color};color:${this._currentTier===t.id?'#fff':t.color};" onclick="CGGallery.filterTier('${t.id}')">${t.name}</button>`).join('')}
      </div>

      <!-- Gallery Grid -->
      <div id="cgGalleryGrid" class="grid grid-3"></div>

      <!-- Upload Modal -->
      <div class="modal-overlay" id="cgUploadModal">
        <div class="modal xl">
          <div class="modal-header"><h3>添加CG</h3><button class="btn-icon" onclick="App.closeModal('cgUploadModal')">✕</button></div>
          <div class="modal-body" id="cgUploadBody"></div>
        </div>
      </div>

      <!-- CG Viewer Modal -->
      <div class="modal-overlay" id="cgViewerModal">
        <div class="modal xl" style="max-width:90vw;">
          <div class="modal-header"><h3 id="cgViewerTitle">CG预览</h3><button class="btn-icon" onclick="App.closeModal('cgViewerModal')">✕</button></div>
          <div class="modal-body" id="cgViewerBody" style="text-align:center;"></div>
        </div>
      </div>
    `;
    this.renderStats();
    this.renderGallery();
  },

  renderStats() {
    const cgs = this.getCGs();
    this.TIERS.forEach(t => {
      const el = document.getElementById('cgStat_' + t.id);
      if (el) el.textContent = cgs.filter(c => c.tier === t.id).length;
    });
  },

  async renderGallery() {
    const grid = document.getElementById('cgGalleryGrid');
    if (!grid) return;
    let cgs = this.getCGs();

    if (this._currentType !== 'all') cgs = cgs.filter(c => c.type === this._currentType);
    if (this._currentTier !== 'all') cgs = cgs.filter(c => c.tier === this._currentTier);

    if (cgs.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
        </div>
        <p>CG画廊为空</p>
        <p style="font-size:12px;color:var(--text-muted);">点击"AI生成CG"或"添加CG"开始收集</p>
      </div>`;
      return;
    }

    // Sort by tier then by time
    const tierOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
    cgs.sort((a, b) => (tierOrder[a.tier] || 4) - (tierOrder[b.tier] || 4));

    grid.innerHTML = cgs.map(cg => {
      const tier = this.TIERS.find(t => t.id === cg.tier) || this.TIERS[0];
      const type = this.CG_TYPES.find(t => t.id === cg.type) || this.CG_TYPES[0];
      return `
        <div class="card cg-card" style="cursor:pointer;position:relative;overflow:hidden;" onclick="CGGallery.viewCG('${cg.id}')">
          <div id="cgThumb_${cg.id}" style="width:100%;aspect-ratio:16/9;background:var(--bg-sidebar);display:flex;align-items:center;justify-content:center;overflow:hidden;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          </div>
          <div style="position:absolute;top:8px;right:8px;background:${tier.color};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;">${tier.name}</div>
          <div style="position:absolute;top:8px;left:8px;background:rgba(0,0,0,0.5);color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;">${type.name}</div>
          <div class="card-body" style="padding:var(--space-sm) var(--space-md);">
            <h4 style="font-size:14px;margin-bottom:4px;" title="${cg.title}">${cg.title}</h4>
            <p style="font-size:12px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${cg.description || ''}</p>
            <p style="font-size:11px;color:var(--text-muted);margin-top:4px;">${cg.scene || ''} · ${cg.unlockedAt ? new Date(cg.unlockedAt).toLocaleDateString() : ''}</p>
          </div>
        </div>
      `;
    }).join('');

    // Load thumbnails
    for (const cg of cgs) {
      if (cg.imageId) {
        const d = await Storage.getImage(cg.imageId);
        const el = document.getElementById('cgThumb_' + cg.id);
        if (el && d) el.innerHTML = `<img src="${d}" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s;">`;
      }
    }
  },

  filterType(type) { this._currentType = type; this.renderPage(); },
  filterTier(tier) { this._currentTier = tier; this.renderPage(); },

  openUploader() {
    const body = document.getElementById('cgUploadBody');
    body.innerHTML = `
      <div class="upload-zone" onclick="document.getElementById('cgFileInput').click()">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>
        <p>点击或拖拽上传CG图片</p>
        <p style="font-size:12px;color:var(--text-muted);">支持 JPG / PNG / WebP</p>
        <input type="file" id="cgFileInput" accept="image/*" style="display:none;" onchange="CGGallery.handleFile(event)">
      </div>
      <div id="cgUploadPreview" style="margin-top:var(--space-md);"></div>
      <div class="form-group" style="margin-top:var(--space-md);"><label>CG标题</label><input type="text" id="cgTitle" placeholder="如：月下独酌"></div>
      <div class="form-group"><label>描述</label><textarea id="cgDesc" rows="2" placeholder="场景描述..."></textarea></div>
      <div class="form-group"><label>关联场景</label><input type="text" id="cgScene" placeholder="如：长安街-月夜"></div>
      <div class="form-row">
        <div class="form-group"><label>类型</label><select id="cgType">${this.CG_TYPES.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}</select></div>
        <div class="form-group"><label>稀有度</label><select id="cgTier">${this.TIERS.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}</select></div>
      </div>
      <div class="form-group"><label>解锁条件（可选）</label><input type="text" id="cgUnlockCondition" placeholder="如：完成第三章"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:var(--space-md);">
        <button class="btn btn-secondary" onclick="App.closeModal('cgUploadModal')">取消</button>
        <button class="btn btn-primary" onclick="CGGallery.saveCG()">保存CG</button>
      </div>
    `;
    this._pendingCG = null;
    App.openModal('cgUploadModal');
  },

  async handleFile(e) {
    const file = e.target.files[0]; if (!file) return;
    const data = await Storage.fileToDataUrl(file);
    this._pendingCG = { data, name: file.name };
    const n = document.getElementById('cgTitle');
    if (n && !n.value) n.value = file.name.replace(/\.[^.]+$/, '');
    document.getElementById('cgUploadPreview').innerHTML = `<img src="${data}" style="width:100%;max-height:300px;object-fit:contain;border-radius:var(--border-radius-sm);">`;
  },

  async saveCG() {
    if (!this._pendingCG) { App.toast('请选择图片', 'error'); return; }
    const title = document.getElementById('cgTitle').value || '未命名';
    const desc = document.getElementById('cgDesc').value || '';
    const scene = document.getElementById('cgScene').value || '';
    const type = document.getElementById('cgType').value;
    const tier = document.getElementById('cgTier').value;
    const condition = document.getElementById('cgUnlockCondition').value || '';

    const id = 'cg_' + Date.now();
    await Storage.saveImage(id, 'cg', null, title, this._pendingCG.data, { type, tier, scene });

    const cgs = this.getCGs();
    cgs.push({ id, imageId: id, title, description: desc, scene, type, tier, unlockCondition: condition, unlockedAt: Date.now(), createdAt: Date.now() });
    this.saveCGs(cgs);

    App.closeModal('cgUploadModal');
    this.renderStats(); this.renderGallery();
    App.toast(`CG「${title}」已添加`, 'success');

    // Emit event for linkage
    EventBridge?.emit('cg-gallery', 'cg_added', { id, title, tier }, 'CGGallery');
  },

  async viewCG(id) {
    const cg = this.getCGs().find(c => c.id === id);
    if (!cg) return;
    const d = await Storage.getImage(cg.imageId);
    if (!d) return;

    const tier = this.TIERS.find(t => t.id === cg.tier) || this.TIERS[0];
    const type = this.CG_TYPES.find(t => t.id === cg.type) || this.CG_TYPES[0];

    document.getElementById('cgViewerTitle').textContent = cg.title;
    document.getElementById('cgViewerBody').innerHTML = `
      <div style="position:relative;display:inline-block;">
        <img src="${d}" style="max-width:100%;max-height:70vh;border-radius:var(--border-radius);box-shadow:0 8px 32px rgba(0,0,0,0.3);">
        <div style="position:absolute;top:12px;right:12px;background:${tier.color};color:#fff;padding:4px 12px;border-radius:4px;font-size:14px;font-weight:700;">${tier.name}</div>
        <div style="position:absolute;top:12px;left:12px;background:rgba(0,0,0,0.6);color:#fff;padding:4px 12px;border-radius:4px;font-size:14px;">${type.name}</div>
      </div>
      <div style="margin-top:var(--space-md);text-align:left;max-width:600px;margin-left:auto;margin-right:auto;">
        <p style="font-size:14px;color:var(--text-secondary);line-height:1.8;"><strong style="color:var(--color-gold);">描述：</strong>${cg.description || '无描述'}</p>
        <p style="font-size:14px;color:var(--text-secondary);"><strong style="color:var(--color-gold);">场景：</strong>${cg.scene || '无'}</p>
        ${cg.unlockCondition ? `<p style="font-size:14px;color:var(--text-secondary);"><strong style="color:var(--color-gold);">解锁条件：</strong>${cg.unlockCondition}</p>` : ''}
        <p style="font-size:12px;color:var(--text-muted);margin-top:8px;">解锁于 ${new Date(cg.unlockedAt).toLocaleString()}</p>
      </div>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:var(--space-md);">
        <button class="btn btn-secondary" onclick="CGGallery.setAsBackground('${cg.id}')">🖼️ 设为背景</button>
        <button class="btn btn-danger" onclick="CGGallery.deleteCG('${cg.id}')">🗑️ 删除</button>
      </div>
    `;
    App.openModal('cgViewerModal');
  },

  async aiGenerateCG() {
    const world = Storage.get('worldData', {});
    const worldName = world.name || '这个世界';
    const worldDesc = world.description || '';
    const npcs = NPCManager?.getNPCs?.() || [];
    const npcNames = npcs.slice(0, 3).map(n => n.name).join('、') || '角色';

    const prompt = prompt?.('描述你想要的CG场景（可留空让AI根据世界观生成）：', `${worldName}的标志性场景`);
    if (prompt === null) return;

    App.toast('AI正在生成CG建议...', 'info');
    try {
      const aiPrompt = `为视觉小说「${worldName}」生成CG插画建议。
世界观：${worldDesc}
角色：${npcNames}
${prompt ? '用户要求：' + prompt : ''}

请返回JSON格式：
{
  "title": "CG标题",
  "description": "场景描述（100字内）",
  "scene": "关联场景名称",
  "type": "scene/event/character/ending/item/memory",
  "tier": "common/rare/epic/legendary"
}

只返回JSON，不要其他文字。`;

      const result = await APISettings.chat(aiPrompt, [], { useAux: true });
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      const cg = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      if (!cg) { App.toast('AI未返回有效数据', 'error'); return; }

      // Show preview for user confirmation
      App.showModal('✨ AI生成的CG建议', `
        <div style="text-align:center;padding:var(--space-lg);">
          <h3 style="color:var(--color-gold);font-size:20px;margin-bottom:var(--space-md);">${cg.title}</h3>
          <p style="font-size:14px;color:var(--text-secondary);line-height:1.8;margin-bottom:var(--space-md);">${cg.description}</p>
          <div style="display:flex;gap:8px;justify-content:center;margin-bottom:var(--space-md);">
            <span style="background:var(--bg-parchment);padding:4px 12px;border-radius:4px;font-size:12px;">类型：${cg.type}</span>
            <span style="background:var(--bg-parchment);padding:4px 12px;border-radius:4px;font-size:12px;">稀有度：${cg.tier}</span>
          </div>
          <p style="font-size:12px;color:var(--text-muted);">你可以上传图片来完成这个CG，或让AI生成描述供你参考创作。</p>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:var(--space-md);">
          <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
          <button class="btn btn-primary" onclick="CGGallery.saveAiCG('${cg.title.replace(/'/g,"\\'")}','${cg.description.replace(/'/g,"\\'")}','${cg.scene?.replace(/'/g,"\\'") || ''}','${cg.type}','${cg.tier}')">📥 保存到画廊</button>
        </div>
      `);
    } catch (e) { App.toast('生成失败: ' + e.message, 'error'); }
  },

  saveAiCG(title, description, scene, type, tier) {
    const id = 'cg_ai_' + Date.now();
    const cgs = this.getCGs();
    cgs.push({ id, imageId: null, title, description, scene, type, tier, unlockedAt: Date.now(), createdAt: Date.now(), aiGenerated: true });
    this.saveCGs(cgs);
    App.closeModal();
    this.renderStats(); this.renderGallery();
    App.toast(`CG「${title}」已保存（待添加图片）`, 'success');
  },

  async setAsBackground(id) {
    const cg = this.getCGs().find(c => c.id === id);
    if (!cg || !cg.imageId) return;
    const d = await Storage.getImage(cg.imageId);
    if (!d) { App.toast('图片不存在', 'error'); return; }

    // Add to background library
    const bgs = BackgroundLibrary?.getBackgrounds?.() || Storage.get('backgrounds_v3', []);
    const bgId = 'bg_cg_' + Date.now();
    await Storage.saveImage(bgId, 'background', null, cg.title, d, { category: 'cg', fromCG: cg.id });
    bgs.push({ id: bgId, imageId: bgId, name: 'CG: ' + cg.title, category: 'other', subcategory: '', createdAt: Date.now() });
    if (BackgroundLibrary?.saveBackgrounds) BackgroundLibrary.saveBackgrounds(bgs); else Storage.set('backgrounds_v3', bgs);

    App.toast('已设为背景', 'success');
    EventBridge?.emit('cg-gallery', 'cg_as_bg', { cgId: id, bgId }, 'CGGallery');
  },

  deleteCG(id) {
    const cg = this.getCGs().find(c => c.id === id);
    if (!cg || !confirm(`删除CG「${cg.title}」？`)) return;
    if (cg.imageId) Storage.deleteImage(cg.imageId);
    this.saveCGs(this.getCGs().filter(c => c.id !== id));
    App.closeModal('cgViewerModal');
    this.renderStats(); this.renderGallery();
    App.toast('已删除', 'info');
  },

  showHelp() {
    App.showModal('❓ CG画廊说明', `
      <div style="line-height:1.8;">
        <p><strong>什么是CG？</strong></p>
        <p>CG（Computer Graphics）是视觉小说中的插画。在墨境中，CG根据你的世界观和剧情自动生成或手动添加。</p>
        <p style="margin-top:12px;"><strong>CG类型：</strong></p>
        <ul style="margin-left:20px;">
          <li><strong>场景</strong> - 世界观标志性场景</li>
          <li><strong>事件</strong> - 剧情关键事件插画</li>
          <li><strong>人物</strong> - 角色专属CG（如觉醒、特殊造型）</li>
          <li><strong>结局</strong> - HE/BE结局CG</li>
          <li><strong>物品</strong> - 关键道具特写</li>
          <li><strong>回忆</strong> - 过去场景回忆</li>
        </ul>
        <p style="margin-top:12px;"><strong>稀有度：</strong></p>
        <ul style="margin-left:20px;">
          <li><strong style="color:#8B7355;">寻常</strong> - 普通场景</li>
          <li><strong style="color:#4A90C2;">珍稀</strong> - 特殊CG</li>
          <li><strong style="color:#9C27B0;">史诗</strong> - 关键剧情CG</li>
          <li><strong style="color:#C9A227;">传说</strong> - 结局/限定CG</li>
        </ul>
        <p style="margin-top:12px;"><strong>君成录风格：</strong>CG与剧情进度挂钩，解锁特定CG需要满足条件（如完成某章节、达到某好感度）。</p>
      </div>
    `);
  }
};
