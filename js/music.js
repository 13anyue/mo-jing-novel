/**
 * =========================================================
 * Music Manager v2
 * Upload and play background music
 * =========================================================
 */
const MusicManager = {
  CATS: [
    { id: 'bgm', name: '背景音乐' }, { id: 'sfx', name: '音效' },
    { id: 'voice', name: '语音' }, { id: 'ambient', name: '环境音' }
  ],
  _audio: null, _current: null, _playing: false, _vol: 0.5,

  init() { this._audio = new Audio(); this._audio.volume = this._vol; this.renderPage(); },
  onEnter() { this.renderList(); },

  getMusicList() { return Storage.get('musicList_v2', []); },
  saveMusicList(list) { Storage.set('musicList_v2', list); },

  renderPage() {
    const page = document.getElementById('page-music');
    if (!page) return;
    page.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
        <button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);">
        <h2 class="section-title">🎵 音乐</h2>
        <button class="btn btn-primary" onclick="MusicManager.openUploader()">➕ 上传</button>
      </div>
      <div class="music-player" style="margin-bottom:var(--space-lg);">
        <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,var(--color-primary),var(--color-primary-dark));display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;" onclick="MusicManager.togglePlay()" id="musicPlayIcon">▶️</div>
        <div class="music-info"><div class="music-title" id="nowPlaying">未播放</div><div class="music-status" id="nowStatus">选择音乐</div></div>
        <div class="music-controls"><input type="range" id="volSlider" min="0" max="1" step="0.05" value="${this._vol}" style="width:80px;" onchange="MusicManager.setVol(this.value)"><span style="font-size:12px;color:var(--text-muted);">音量</span></div>
      </div>
      <div id="musicList"></div>
      <div class="modal-overlay" id="musicUploadModal">
        <div class="modal">
          <div class="modal-header"><h3>上传音乐</h3><button class="btn-icon" onclick="App.closeModal('musicUploadModal')">✕</button></div>
          <div class="modal-body" id="musicUploadBody"></div>
        </div>
      </div>
    `;
    this.renderList();
  },

  renderList() {
    const c = document.getElementById('musicList');
    if (!c) return;
    const music = this.getMusicList();
    if (music.length === 0) { c.innerHTML = '<div class="empty-state"><div class="empty-icon">🎵</div><p>暂无音乐</p></div>'; return; }
    c.innerHTML = music.map(m => `
      <div class="list-item">
        <div style="width:40px;height:40px;border-radius:var(--border-radius-sm);background:var(--bg-input);display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;" onclick="MusicManager.play('${m.id}')">${this._current === m.id && this._playing ? '⏸️' : '▶️'}</div>
        <div class="list-info"><h4>${m.name}</h4><p>${this.CATS.find(c => c.id === m.category)?.name || '其他'} · ${(m.size / 1024 / 1024).toFixed(1)}MB</p></div>
        <button class="btn btn-sm btn-secondary" onclick="MusicManager.play('${m.id}')">播放</button>
        <button class="btn btn-sm btn-danger" onclick="MusicManager.deleteMusic('${m.id}')">🗑️</button>
      </div>
    `).join('');
  },

  openUploader() {
    const body = document.getElementById('musicUploadBody');
    body.innerHTML = `
      <div class="upload-zone" onclick="document.getElementById('musicFileInput').click()"><div class="upload-icon">🎵</div><p>点击上传音频</p><p style="font-size:12px;color:var(--text-muted);">MP3/WAV/OGG</p><input type="file" id="musicFileInput" accept="audio/*" style="display:none;" onchange="MusicManager.handleFile(event)"></div>
      <div id="musicPreview" style="margin-top:var(--space-md);"></div>
      <div class="form-group" style="margin-top:var(--space-md);"><label>名称</label><input type="text" id="musicName" placeholder="如：长安BGM"></div>
      <div class="form-group"><label>分类</label><select id="musicCategory">${this.CATS.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
      <div class="form-group"><label><select id="musicLoop"><option value="true">循环</option><option value="false">一次</option></select></label></div>
      <div style="display:flex;justify-content:flex-end;gap:8px;"><button class="btn btn-secondary" onclick="App.closeModal('musicUploadModal')">取消</button><button class="btn btn-primary" onclick="MusicManager.saveUpload()">保存</button></div>
    `;
    this._pending = null;
    App.openModal('musicUploadModal');
  },

  async handleFile(e) {
    const file = e.target.files[0]; if (!file) return;
    const data = await Storage.fileToDataUrl(file);
    this._pending = { data, name: file.name, size: file.size };
    const n = document.getElementById('musicName'); if (n && !n.value) n.value = file.name.replace(/\.[^.]+$/, '');
    document.getElementById('musicPreview').innerHTML = `<audio controls src="${data}" style="width:100%;"></audio>`;
  },

  async saveUpload() {
    if (!this._pending) { App.toast('请选择文件', 'error'); return; }
    const name = document.getElementById('musicName').value || '未命名';
    const cat = document.getElementById('musicCategory').value;
    const loop = document.getElementById('musicLoop').value === 'true';
    const id = 'audio_' + Date.now();
    await Storage.saveAudio(id, cat, this._pending.name, this._pending.data);
    const list = this.getMusicList();
    list.push({ id, name, category: cat, loop, size: this._pending.size, createdAt: Date.now() });
    this.saveMusicList(list);
    App.closeModal('musicUploadModal');
    this.renderList();
    App.toast('音乐已上传', 'success');
  },

  async play(id) {
    if (this._current === id && this._playing) { this._audio.pause(); this._playing = false; }
    else {
      const track = this.getMusicList().find(m => m.id === id); if (!track) return;
      const data = await Storage.getAudio(id); if (!data) { App.toast('音频不存在', 'error'); return; }
      this._audio.src = data; this._audio.loop = track.loop !== false;
      this._audio.play(); this._current = id; this._playing = true;
      document.getElementById('nowPlaying').textContent = track.name;
      document.getElementById('nowStatus').textContent = this.CATS.find(c => c.id === track.category)?.name + ' · 播放中';
    }
    this.renderList();
  },

  togglePlay() { if (!this._current) { App.toast('请先选择音乐', 'info'); return; } this.play(this._current); },
  setVol(v) { this._vol = parseFloat(v); this._audio.volume = this._vol; },

  deleteMusic(id) {
    const track = this.getMusicList().find(m => m.id === id); if (!track || !confirm(`删除「${track.name}」？`)) return;
    if (this._current === id) { this._audio.pause(); this._playing = false; this._current = null; }
    Storage.deleteAudio(id);
    this.saveMusicList(this.getMusicList().filter(m => m.id !== id));
    this.renderList();
  }
};
