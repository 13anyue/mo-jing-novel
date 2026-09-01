/**
 * =========================================================
 * Hero System v2 — 主角/主要角色独立管理
 * 与NPC系统区分，支持独立上传立绘、头像、详细设定
 * 配色约束：暖羊皮纸底色 #F5E6D3 + 金色 #C9A227 + 墨色 #2C1810
 * 2026-09-01 升级：更精致的卡片网格、更大圆角编辑弹窗、更好表单布局、头像上传视觉反馈
 * =========================================================
 */
const HeroSystem = {
  _heroes: [],

  /**
   * 获取主角列表（带错误防护）
   */
  getHeroes() {
    try { return Storage.get('heroes_v1', []); }
    catch (e) { console.warn('[HeroSystem] 读取主角列表失败:', e); return []; }
  },

  saveHeroes(list) {
    try {
      Storage.set('heroes_v1', list);
      this._heroes = list;
    } catch (e) { console.warn('[HeroSystem] 保存主角列表失败:', e); }
  },

  init() { this.renderPage(); },
  onEnter() { this.renderPage(); },

  renderPage() {
    const page = document.getElementById('page-hero');
    if (!page) return;
    const heroes = this.getHeroes();
    page.innerHTML = `
      <!-- 顶部标题栏 -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
        <button class="btn btn-sm btn-secondary" style="border-radius:20px;padding:6px 14px;" onclick="App.navigate('home')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><polyline points="15 18 9 12 15 6"/></svg>返回
        </button>
        <h2 class="section-title" style="margin:0;">我的角色</h2>
        <div style="flex:1;"></div>
        <button class="btn btn-sm btn-gold" style="border-radius:20px;padding:6px 14px;" onclick="HeroSystem.createHero()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>新建角色
        </button>
      </div>

      <!-- 主角卡片网格：更精致的间距、阴影和圆角 -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(160px, 1fr));gap:16px;">
        ${heroes.map(h => this._renderHeroCard(h)).join('')}
        <!-- 新建角色占位卡片 -->
        <div onclick="HeroSystem.createHero()" style="aspect-ratio:3/4;border-radius:16px;border:2px dashed rgba(201,162,39,0.4);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;cursor:pointer;background:linear-gradient(135deg, rgba(201,162,39,0.04), rgba(201,162,39,0.08));transition:all 0.3s;" onmouseover="this.style.borderColor='var(--color-gold)';this.style.background='linear-gradient(135deg, rgba(201,162,39,0.08), rgba(201,162,39,0.15))';" onmouseout="this.style.borderColor='rgba(201,162,39,0.4)';this.style.background='linear-gradient(135deg, rgba(201,162,39,0.04), rgba(201,162,39,0.08))';">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="opacity:0.6;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span style="font-size:14px;color:var(--text-muted);font-family:'Noto Serif SC',serif;">新建主角</span>
        </div>
      </div>
    `;
  },

  _renderHeroCard(hero) {
    const bgStyle = hero.portraitId
      ? `background-image:url('${hero.portraitId}');background-size:cover;background-position:center;`
      : `background:linear-gradient(135deg, #8B6914, #D4A843);`;
    return `
      <div onclick="HeroSystem.editHero('${hero.id}')" style="border-radius:16px;overflow:hidden;cursor:pointer;box-shadow:0 3px 12px rgba(44,24,16,0.08);transition:all 0.3s ease;background:var(--bg-card);border:1px solid rgba(201,162,39,0.15);" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 24px rgba(44,24,16,0.14)';" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 3px 12px rgba(44,24,16,0.08)';">
        <div style="aspect-ratio:3/4;${bgStyle};position:relative;">
          ${!hero.portraitId ? `
            <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span style="font-size:12px;color:rgba(255,255,255,0.7);font-family:'Noto Serif SC',serif;">未设置立绘</span>
            </div>
          ` : ''}
          ${hero.isMainHero ? `<div style="position:absolute;top:10px;right:10px;background:linear-gradient(135deg, #C9A227, #E8C547);color:#2C1810;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;box-shadow:0 2px 6px rgba(0,0,0,0.15);">主角</div>` : ''}
        </div>
        <div style="padding:14px;background:var(--bg-card);">
          <div style="font-size:15px;font-weight:600;color:var(--text-primary);font-family:'Noto Serif SC',serif;letter-spacing:0.5px;">${hero.name || '未命名'}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px;letter-spacing:0.3px;">${hero.identity || '主角'}</div>
          ${hero.gender || hero.age ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px;opacity:0.8;">${hero.gender || ''}${hero.gender && hero.age ? ' · ' : ''}${hero.age || ''}</div>` : ''}
        </div>
      </div>
    `;
  },

  createHero() {
    const id = 'hero_' + Date.now();
    const name = prompt('角色名称：', '主角');
    if (!name) return;
    const hero = {
      id, name,
      gender: '', age: '', identity: '主角',
      personality: '', background: '', appearance: '',
      portraitId: null, avatarId: null,
      createdAt: Date.now(), isMainHero: true
    };
    const heroes = this.getHeroes();
    heroes.push(hero);
    this.saveHeroes(heroes);
    this.editHero(id);
  },

  editHero(id) {
    const heroes = this.getHeroes();
    const hero = heroes.find(h => h.id === id);
    if (!hero) return;

    // 移除已存在的弹窗
    const existing = document.querySelector('.hero-modal-overlay');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'hero-modal-overlay';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(44,24,16,0.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:200;padding:16px;';
    modal.innerHTML = `
      <!-- 编辑弹窗：更大圆角、更好表单布局 -->
      <div style="max-width:520px;width:100%;max-height:90vh;overflow-y:auto;background:linear-gradient(180deg, #fdf8f2, #f5e6d3);border-radius:24px;box-shadow:0 12px 48px rgba(44,24,16,0.2);border:1px solid rgba(201,162,39,0.25);">
        <!-- 弹窗头部 -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid rgba(201,162,39,0.2);background:linear-gradient(90deg, rgba(201,162,39,0.08), rgba(201,162,39,0.02));">
          <h3 style="font-family:'Noto Serif SC',serif;font-size:18px;color:var(--color-primary);margin:0;letter-spacing:1px;">编辑角色：${hero.name}</h3>
          <button class="btn-icon" style="border-radius:50%;width:32px;height:32px;" onclick="this.closest('.hero-modal-overlay').remove()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- 弹窗内容 -->
        <div style="padding:22px;">
          <!-- 头像和上传区域：更好视觉反馈 -->
          <div style="display:flex;gap:16px;margin-bottom:20px;align-items:center;">
            <div style="width:90px;height:90px;border-radius:50%;background:linear-gradient(135deg, var(--bg-parchment), #e8d5b7);overflow:hidden;flex-shrink:0;border:3px solid rgba(201,162,39,0.35);box-shadow:0 4px 12px rgba(44,24,16,0.1);position:relative;transition:border-color 0.3s;" id="heroPortraitPreview_${id}" onmouseover="this.style.borderColor='var(--color-gold)';" onmouseout="this.style.borderColor='rgba(201,162,39,0.35)';">
              ${hero.portraitId
                ? `<img src="${hero.portraitId}" style="width:100%;height:100%;object-fit:cover;">`
                : `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:12px;gap:4px;">
                     <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="opacity:0.5;"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                     <span>无立绘</span>
                   </div>`
              }
            </div>
            <div style="flex:1;">
              <input type="file" id="heroPortraitInput_${id}" accept="image/*" style="display:none;" onchange="HeroSystem.handlePortraitUpload('${id}', this)">
              <button class="btn btn-sm btn-secondary" style="border-radius:14px;padding:6px 14px;margin-bottom:6px;" onclick="document.getElementById('heroPortraitInput_${id}').click()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>上传立绘
              </button>
              <p style="font-size:12px;color:var(--text-muted);line-height:1.5;">支持 JPG/PNG/WebP，推荐 600x800 比例</p>
              <p style="font-size:11px;color:var(--color-gold);margin-top:4px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:3px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                点击头像区域可重新上传
              </p>
            </div>
          </div>

          <!-- 表单：更好的标签和间距 -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:12px;color:var(--text-muted);margin-bottom:6px;display:block;letter-spacing:0.5px;">名称</label>
              <input type="text" id="heroName_${id}" value="${hero.name || ''}" style="border-radius:10px;padding:8px 12px;border:1px solid var(--border-color);background:var(--bg-input);font-size:14px;width:100%;box-sizing:border-box;transition:border-color 0.2s;" onfocus="this.style.borderColor='var(--color-gold)'" onblur="this.style.borderColor='var(--border-color)'">
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:12px;color:var(--text-muted);margin-bottom:6px;display:block;letter-spacing:0.5px;">性别</label>
              <input type="text" id="heroGender_${id}" value="${hero.gender || ''}" placeholder="男/女/其他" style="border-radius:10px;padding:8px 12px;border:1px solid var(--border-color);background:var(--bg-input);font-size:14px;width:100%;box-sizing:border-box;transition:border-color 0.2s;" onfocus="this.style.borderColor='var(--color-gold)'" onblur="this.style.borderColor='var(--border-color)'">
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:12px;color:var(--text-muted);margin-bottom:6px;display:block;letter-spacing:0.5px;">年龄</label>
              <input type="text" id="heroAge_${id}" value="${hero.age || ''}" style="border-radius:10px;padding:8px 12px;border:1px solid var(--border-color);background:var(--bg-input);font-size:14px;width:100%;box-sizing:border-box;transition:border-color 0.2s;" onfocus="this.style.borderColor='var(--color-gold)'" onblur="this.style.borderColor='var(--border-color)'">
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:12px;color:var(--text-muted);margin-bottom:6px;display:block;letter-spacing:0.5px;">身份</label>
              <input type="text" id="heroIdentity_${id}" value="${hero.identity || ''}" placeholder="如：皇子、侠女..." style="border-radius:10px;padding:8px 12px;border:1px solid var(--border-color);background:var(--bg-input);font-size:14px;width:100%;box-sizing:border-box;transition:border-color 0.2s;" onfocus="this.style.borderColor='var(--color-gold)'" onblur="this.style.borderColor='var(--border-color)'">
            </div>
          </div>

          <div class="form-group" style="margin-top:14px;">
            <label style="font-size:12px;color:var(--text-muted);margin-bottom:6px;display:block;letter-spacing:0.5px;">性格</label>
            <textarea id="heroPersonality_${id}" rows="2" style="border-radius:10px;padding:10px 12px;border:1px solid var(--border-color);background:var(--bg-input);font-size:14px;width:100%;box-sizing:border-box;resize:vertical;transition:border-color 0.2s;" onfocus="this.style.borderColor='var(--color-gold)'" onblur="this.style.borderColor='var(--border-color)'">${hero.personality || ''}</textarea>
          </div>

          <div class="form-group" style="margin-top:14px;">
            <label style="font-size:12px;color:var(--text-muted);margin-bottom:6px;display:block;letter-spacing:0.5px;">背景故事</label>
            <textarea id="heroBackground_${id}" rows="3" style="border-radius:10px;padding:10px 12px;border:1px solid var(--border-color);background:var(--bg-input);font-size:14px;width:100%;box-sizing:border-box;resize:vertical;transition:border-color 0.2s;" onfocus="this.style.borderColor='var(--color-gold)'" onblur="this.style.borderColor='var(--border-color)'">${hero.background || ''}</textarea>
          </div>

          <div class="form-group" style="margin-top:14px;">
            <label style="font-size:12px;color:var(--text-muted);margin-bottom:6px;display:block;letter-spacing:0.5px;">外貌描述</label>
            <textarea id="heroAppearance_${id}" rows="2" style="border-radius:10px;padding:10px 12px;border:1px solid var(--border-color);background:var(--bg-input);font-size:14px;width:100%;box-sizing:border-box;resize:vertical;transition:border-color 0.2s;" onfocus="this.style.borderColor='var(--color-gold)'" onblur="this.style.borderColor='var(--border-color)'">${hero.appearance || ''}</textarea>
          </div>
        </div>

        <!-- 弹窗底部 -->
        <div style="display:flex;gap:10px;justify-content:flex-end;padding:16px 22px;border-top:1px solid rgba(201,162,39,0.15);background:rgba(245,230,211,0.4);">
          <button class="btn btn-secondary" style="border-radius:14px;padding:6px 16px;" onclick="this.closest('.hero-modal-overlay').remove()">取消</button>
          <button class="btn btn-danger" style="border-radius:14px;padding:6px 16px;" onclick="HeroSystem.deleteHero('${id}');this.closest('.hero-modal-overlay').remove()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:3px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>删除
          </button>
          <button class="btn btn-primary" style="border-radius:14px;padding:6px 18px;" onclick="HeroSystem.saveHeroEdit('${id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>保存
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async handlePortraitUpload(heroId, input) {
    const file = input.files[0];
    if (!file) return;
    try {
      let data = null;
      if (typeof Storage !== 'undefined' && Storage && Storage.fileToDataUrl) {
        data = await Storage.fileToDataUrl(file);
      } else {
        // 降级方案：使用 FileReader
        data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
      const heroes = this.getHeroes();
      const hero = heroes.find(h => h.id === heroId);
      if (hero) {
        hero.portraitId = data;
        this.saveHeroes(heroes);
        if (window.App && App.toast) App.toast('立绘已上传', 'success');
        // 刷新预览图
        const preview = document.getElementById('heroPortraitPreview_' + heroId);
        if (preview) {
          preview.innerHTML = `<img src="${data}" style="width:100%;height:100%;object-fit:cover;">`;
        }
      }
    } catch (e) {
      if (window.App && App.toast) App.toast('上传失败：' + e.message, 'error');
      else console.error('上传失败:', e);
    }
  },

  saveHeroEdit(id) {
    const heroes = this.getHeroes();
    const hero = heroes.find(h => h.id === id);
    if (!hero) return;

    const nameEl = document.getElementById('heroName_' + id);
    const genderEl = document.getElementById('heroGender_' + id);
    const ageEl = document.getElementById('heroAge_' + id);
    const identityEl = document.getElementById('heroIdentity_' + id);
    const personalityEl = document.getElementById('heroPersonality_' + id);
    const backgroundEl = document.getElementById('heroBackground_' + id);
    const appearanceEl = document.getElementById('heroAppearance_' + id);

    if (nameEl) hero.name = nameEl.value || hero.name;
    if (genderEl) hero.gender = genderEl.value || '';
    if (ageEl) hero.age = ageEl.value || '';
    if (identityEl) hero.identity = identityEl.value || '';
    if (personalityEl) hero.personality = personalityEl.value || '';
    if (backgroundEl) hero.background = backgroundEl.value || '';
    if (appearanceEl) hero.appearance = appearanceEl.value || '';

    this.saveHeroes(heroes);
    if (window.App && App.toast) App.toast('角色已保存', 'success');
    this.renderPage();
    // 关闭弹窗
    const modal = document.querySelector('.hero-modal-overlay');
    if (modal) modal.remove();
  },

  deleteHero(id) {
    if (!confirm('确定删除这个角色吗？')) return;
    const heroes = this.getHeroes().filter(h => h.id !== id);
    this.saveHeroes(heroes);
    if (window.App && App.toast) App.toast('角色已删除', 'success');
    this.renderPage();
  },

  /**
   * 获取当前主角（第一个标记为isMainHero的）
   */
  getMainHero() {
    const heroes = this.getHeroes();
    return heroes.find(h => h.isMainHero) || heroes[0] || null;
  }
};
