/**
 * =========================================================
 * Game Launcher & World Building Wizard
 * Entry page with: New Game / Load Game / User Mask / Settings
 * 4-step wizard: World View -> User Mask -> Main Characters -> Confirm
 * =========================================================
 */
const Launcher = {
  /**
   * 面具（用户角色）字段定义
   * 与NPCManager.BUILTIN_FIELDS保持同构，实现统一角色设定体验
   * key: 存储键名, label: 显示标签, type: 输入类型, required: 是否必填
   */
  MASK_FIELDS: [
    { key: 'playerName', label: '名字', type: 'text', required: true },
    { key: 'gender',     label: '性别', type: 'text' },
    { key: 'age',        label: '年龄', type: 'text' },
    { key: 'identity',   label: '身份 / 角色定位', type: 'text' },
    { key: 'personality',label: '性格标签', type: 'text' },
    { key: 'background', label: '背景故事', type: 'textarea' },
    { key: 'appearance', label: '外貌描述', type: 'textarea' },
    { key: 'likes',      label: '喜好', type: 'text' },
    { key: 'dislikes',   label: '厌恶', type: 'text' },
    { key: 'goals',      label: '目标 / 追求', type: 'textarea' },
    { key: 'fears',      label: '恐惧 / 弱点', type: 'textarea' },
    { key: 'skills',     label: '技能 / 特长', type: 'text' }
  ],

  init() {
    // Launcher is always visible initially; mainApp hidden
    const savedMask = Storage.get('userMask', null);
    if (savedMask && Storage.get('gameLaunched', false)) {
      this.enterMainApp();
    }
  },

  enterMainApp() {
    document.getElementById('gameLauncher').classList.add('hidden');
    document.getElementById('mainApp').style.display = 'flex';
    Storage.set('gameLaunched', true);
    if (window.App) App.init();
  },

  newGame() {
    Wizard.show();
  },

  loadGame() {
    const saves = Storage.get('gameSaves', []);
    if (saves.length === 0) { App.toast('没有存档', 'info'); return; }
    const content = saves.map((s, i) => `<div class="list-item" style="cursor:pointer" onclick="Launcher.doLoad('${s.id}')">
      <div class="list-info"><h4>${s.worldName || '未命名世界'} · ${s.scene || ''}</h4><p>${new Date(s.timestamp).toLocaleString()}</p></div>
    </div>`).join('');
    App.showModal('📂 读档', content);
  },

  doLoad(saveId) {
    const saves = Storage.get('gameSaves', []);
    const save = saves.find(s => s.id === saveId);
    if (!save) return;
    if (save.userMask) Storage.set('userMask', save.userMask);
    if (save.worldData) Storage.set('worldData', save.worldData);
    if (save.npcs) Storage.set('npcs', save.npcs);
    if (save.history) Storage.set('gameHistory', save.history);
    if (save.vars) Storage.set('gameVars', save.vars);
    if (save.flags) Storage.set('gameFlags', save.flags);
    this.enterMainApp();
    App.toast('读档成功', 'success');
  },

  /**
   * 渲染面具表单HTML
   * @param {string} prefix  input元素的ID前缀，如'lm_'或'wiz_'
   * @param {Object} values  当前值对象
   */
  renderMaskFormHTML(prefix, values) {
    const v = values || {};
    return this.MASK_FIELDS.map(f => {
      const id = prefix + f.key;
      const val = v[f.key] || '';
      const inputHtml = f.type === 'textarea'
        ? `<textarea id="${id}" rows="3" placeholder="${f.label}...">${this._esc(val)}</textarea>`
        : `<input type="${f.type}" id="${id}" value="${this._esc(val)}" placeholder="${f.label}">`;
      return `<div class="form-group">
        <label>${f.label}${f.required ? ' *' : ''}</label>
        ${inputHtml}
      </div>`;
    }).join('');
  },

  /**
   * 从表单收集面具数据
   * @param {string} prefix  input元素的ID前缀
   */
  collectMaskFromForm(prefix) {
    const data = {};
    this.MASK_FIELDS.forEach(f => {
      const el = document.getElementById(prefix + f.key);
      if (el) data[f.key] = el.value;
    });
    return data;
  },

  /** 简单HTML转义 */
  _esc(t) {
    return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  userMask() {
    const mask = Storage.get('userMask', {});
    const content = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--space-md);">
        ${this.renderMaskFormHTML('lm_', mask)}
      </div>
      <div class="form-group" style="grid-column:1/-1;">
        <label>玩家头像</label>
        <input type="file" id="lm_avatarInput" accept="image/*" onchange="Launcher.handleAvatar(this)">
        <div id="lm_avatarPreview" style="margin-top:8px;max-width:120px;">
          ${mask.avatarId ? `<img src="${mask.avatarId}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid var(--color-gold);">` : ''}
        </div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap;">
        <button class="btn btn-gold" onclick="Launcher.aiGenMask('lm_')">✨ AI辅助生成</button>
        <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
        <button class="btn btn-primary" onclick="Launcher.saveMask()">保存</button>
      </div>`;
    App.showModal('🎭 用户面具', content);
  },

  /**
   * AI辅助生成面具（用户角色）设定
   * 读取表单中的名字/性别/身份等作为种子，AI扩展成完整档案
   */
  async aiGenMask(prefix) {
    const data = this.collectMaskFromForm(prefix);
    const seedName = data.playerName || data.identity || '主角';
    if (!data.playerName && !data.identity) {
      App.toast('请至少填写「名字」或「身份」，AI才能参考生成', 'info'); return;
    }
    App.toast('AI正在生成面具设定...', 'info');
    try {
      const prompt = `为视觉小说玩家角色生成一个完整的人物档案。
已知信息：名字「${seedName}」${data.gender ? '，性别' + data.gender : ''}${data.identity ? '，身份' + data.identity : ''}${data.personality ? '，性格' + data.personality : ''}

请严格按照以下格式返回（每行一个字段，用 | 分隔）：
名字|性别|年龄|身份|性格标签|背景故事|外貌描述|喜好|厌恶|目标追求|恐惧弱点|技能特长

注意：
1. 必须保持13个字段，用 | 分隔
2. 如果某字段无法推断，用"待定"填充
3. 保持古风视觉小说风格，语言优美有画面感
4. 不要输出任何额外说明文字，只输出一行数据`;
      const result = await APISettings.chat(prompt, [], { useAux: true });
      const parts = result.split('|').map(p => p.trim());
      const keys = ['playerName','gender','age','identity','personality','background','appearance','likes','dislikes','goals','fears','skills'];
      keys.forEach((k, i) => {
        const el = document.getElementById(prefix + k);
        if (el && parts[i] && parts[i] !== '待定') el.value = parts[i];
      });
      App.toast('AI已生成面具设定，请检查后保存', 'success');
    } catch (e) {
      App.toast('AI生成失败：' + e.message, 'error');
    }
  },

  async handleAvatar(input) {
    const file = input.files[0]; if (!file) return;
    const data = await Storage.fileToDataUrl(file);
    const id = 'maskAvatar_' + Date.now();
    await Storage.saveImage(id, 'avatar', null, file.name, data);
    Storage.set('userMaskAvatar', id);
    document.getElementById('lm_avatarPreview').innerHTML = `<img src="${data}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid var(--color-gold);">`;
  },

  saveMask() {
    const data = this.collectMaskFromForm('lm_');
    data.avatarId = Storage.get('userMaskAvatar', null);
    if (!data.playerName) { App.toast('名字必填', 'error'); return; }
    Storage.set('userMask', data);
    App.closeModal();
    App.toast('用户面具已保存', 'success');
  },

  settings() {
    // Quick jump to API settings from launcher
    this.enterMainApp();
    setTimeout(() => App.navigate('api'), 100);
  }
};

const Wizard = {
  _step: 1,
  _worldData: { name: '', description: '', summary: '', mainChars: [], groupshot: false },

  show() {
    this._step = 1; this._worldData = { name: '', description: '', summary: '', mainChars: [], groupshot: false };
    document.getElementById('worldWizard').style.display = 'block';
    this.renderStep();
  },

  renderStep() {
    document.getElementById('wizStepNum').textContent = this._step;
    const body = document.getElementById('wizardContent');
    const prevBtn = document.getElementById('wizPrev');
    const nextBtn = document.getElementById('wizNext');
    prevBtn.style.display = this._step > 1 ? 'block' : 'none';
    nextBtn.textContent = this._step === 4 ? '🚀 开启墨境' : '下一步';

    if (this._step === 1) {
      body.innerHTML = `
        <div class="card"><div class="card-body">
          <h4 style="font-family:var(--font-display);margin-bottom:12px;color:var(--color-primary-dark);">📖 构建世界观</h4>
          <div class="form-group"><label>世界名称</label><input type="text" id="wiz_worldName" value="${this._worldData.name}" placeholder="如：天元大陆"></div>
          <div class="form-group"><label>世界观描述（可让AI帮你生成）</label>
            <textarea id="wiz_worldDesc" rows="6" placeholder="输入一段概括描述，AI会帮你扩展成完整的世界观...">${this._worldData.description}</textarea>
            <div class="hint">如果不想写，直接输入一句话梗概，点击「AI生成」即可</div>
          </div>
          <button class="btn btn-gold" style="width:100%;margin-bottom:12px;" onclick="Wizard.aiGenWorld()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            AI 生成世界观
          </button>
          <div id="wiz_genPreview" style="display:none;"></div>
        </div></div>`;
    } else if (this._step === 2) {
      const mask = Storage.get('userMask', {});
      body.innerHTML = `
        <div class="card"><div class="card-body">
          <h4 style="font-family:var(--font-display);margin-bottom:12px;color:var(--color-primary-dark);">🎭 选择用户面具</h4>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--space-md);">
            ${Launcher.renderMaskFormHTML('wiz_', mask)}
          </div>
          <div style="margin-top:12px;">
            <button class="btn btn-gold" style="width:100%;" onclick="Launcher.aiGenMask('wiz_')">✨ AI辅助生成面具设定</button>
          </div>
        </div></div>`;
    } else if (this._step === 3) {
      const chars = this._worldData.mainChars || [];
      let charList = '';
      if (chars.length > 0) {
        charList = chars.map((c, i) => `<div class="list-item"><div class="list-info"><h4>${c.name}</h4><p>${c.role || ''}</p></div><button class="btn btn-sm btn-danger" onclick="Wizard.removeChar(${i})">删除</button></div>`).join('');
      }
      body.innerHTML = `
        <div class="card"><div class="card-body">
          <h4 style="font-family:var(--font-display);margin-bottom:12px;color:var(--color-primary-dark);">👤 设置主要角色</h4>
          <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">这里是「主要常驻角色」，区别于一般NPC。群像模式也可以设置多个主要角色。</p>
          <div style="display:flex;gap:8px;margin-bottom:12px;">
            <button class="btn btn-secondary" onclick="Wizard.addCharManual()">➕ 手动添加</button>
            <button class="btn btn-gold" onclick="Wizard.aiExtractChars()">🤖 AI从世界观提取</button>
          </div>
          <div id="wiz_charList">${charList || '<p style="color:var(--text-muted);font-size:13px;">暂无主要角色</p>'}</div>
          <div class="form-group" style="margin-top:16px;">
            <label><input type="checkbox" id="wiz_groupshot" ${this._worldData.groupshot?'checked':''}> 群像模式（多个主角）</label>
          </div>
        </div></div>`;
    } else if (this._step === 4) {
      body.innerHTML = `
        <div class="card"><div class="card-body" style="text-align:center;">
          <h4 style="font-family:var(--font-display);margin-bottom:12px;color:var(--color-primary-dark);">✨ 世界概览</h4>
          <div style="text-align:left;font-size:14px;line-height:1.8;color:var(--text-secondary);">
            <p><strong>世界：</strong>${this._worldData.name || '未命名'}</p>
            <p><strong>主角：</strong>${Storage.get('userMask',{}).playerName || '未设置'}</p>
            <p><strong>主要角色：</strong>${this._worldData.mainChars.map(c=>c.name).join('、') || '无'}</p>
            <p><strong>群像模式：</strong>${this._worldData.groupshot ? '是' : '否'}</p>
            <div class="code-block" style="margin-top:12px;font-size:12px;max-height:200px;overflow:auto;">${Launcher._esc((this._worldData.summary || this._worldData.description || '').substring(0, 500))}</div>
          </div>
        </div></div>`;
    }
  },

  prev() { if (this._step > 1) { this._step--; this.renderStep(); } },

  async next() {
    if (this._step === 1) {
      this._worldData.name = document.getElementById('wiz_worldName').value || '未命名世界';
      this._worldData.description = document.getElementById('wiz_worldDesc').value || '';
      this._worldData.summary = document.getElementById('wiz_genPreview')?.dataset?.summary || this._worldData.description;
      if (!this._worldData.description) { App.toast('请输入世界观描述', 'error'); return; }
    } else if (this._step === 2) {
      const mask = Launcher.collectMaskFromForm('wiz_');
      if (!mask.playerName) { App.toast('请填写名字', 'error'); return; }
      Storage.set('userMask', mask);
    } else if (this._step === 3) {
      this._worldData.groupshot = document.getElementById('wiz_groupshot')?.checked || false;
    } else if (this._step === 4) {
      Storage.set('worldData', this._worldData);
      document.getElementById('worldWizard').style.display = 'none';
      Launcher.enterMainApp();
      App.toast(`欢迎来到「${this._worldData.name}」`, 'success');
      return;
    }
    this._step++;
    this.renderStep();
  },

  async aiGenWorld() {
    const desc = document.getElementById('wiz_worldDesc').value.trim();
    if (!desc) { App.toast('请先输入一段概括描述', 'error'); return; }
    const preview = document.getElementById('wiz_genPreview');
    preview.style.display = 'block';
    preview.innerHTML = '<p style="color:var(--text-muted);">AI正在生成世界观...</p>';
    try {
      const prompt = `基于以下梗概，生成一个完整的视觉小说世界观设定（300字以内）：\n\n梗概：${desc}\n\n请包含：世界名称、时代背景、核心冲突、主要势力、整体氛围。只输出世界观正文，不要多余格式。`;
      const result = await APISettings.chat(prompt, [], { useAux: true });
      this._worldData.summary = result;
      preview.innerHTML = `<div class="code-block">${Launcher._esc(result)}</div><div style="margin-top:8px;"><button class="btn btn-sm btn-primary" onclick="Wizard.useGenerated()">采用此世界观</button></div>`;
      preview.dataset.summary = result;
    } catch (e) {
      preview.innerHTML = `<p style="color:var(--color-danger);">生成失败：${e.message}</p>`;
    }
  },

  useGenerated() {
    const summary = document.getElementById('wiz_genPreview').dataset.summary;
    if (summary) {
      document.getElementById('wiz_worldDesc').value = summary;
      this._worldData.description = summary;
      this._worldData.summary = summary;
    }
  },

  addCharManual() {
    const name = prompt('角色名称：'); if (!name) return;
    const role = prompt('角色定位（如：女主角、反派、导师）：') || '';
    this._worldData.mainChars.push({ id: 'main_' + Date.now(), name, role });
    this.renderStep();
  },

  async aiExtractChars() {
    if (!this._worldData.summary && !this._worldData.description) { App.toast('先生成世界观', 'error'); return; }
    const preview = document.getElementById('wiz_charList');
    preview.innerHTML = '<p style="color:var(--text-muted);">AI正在分析世界观...</p>';
    try {
      const prompt = `从以下世界观中提取主要角色（最多8个）。对每个角色给出：名字、角色定位、一句话描述。\n\n格式：\n名字|定位|描述\n\n世界观：\n${this._worldData.summary || this._worldData.description}`;
      const result = await APISettings.chat(prompt, [], { useAux: true });
      const lines = result.split('\n').filter(l => l.includes('|'));
      const extracted = lines.map(l => {
        const parts = l.split('|');
        return { id: 'main_' + Date.now() + '_' + Math.random().toString(36).slice(2,6), name: parts[0]?.trim() || '未知', role: parts[1]?.trim() || '', desc: parts[2]?.trim() || '' };
      }).slice(0, 8);
      if (extracted.length === 0) { preview.innerHTML = '<p style="color:var(--text-muted);">未提取到角色，请手动添加</p>'; return; }
      if (confirm(`提取到 ${extracted.length} 个角色：${extracted.map(c=>c.name).join('、')}\n\n是否添加？`)) {
        this._worldData.mainChars = [...this._worldData.mainChars, ...extracted];
        this.renderStep();
      }
    } catch (e) {
      preview.innerHTML = `<p style="color:var(--color-danger);">提取失败：${e.message}</p>`;
    }
  },

  removeChar(idx) { this._worldData.mainChars.splice(idx, 1); this.renderStep(); },
};
