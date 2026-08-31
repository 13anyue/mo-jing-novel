/**
 * =========================================================
 * Storage Manager v3
 * Enhanced localStorage + IndexedDB with backup support
 * Stores: images, audio, memories, plugins, files, backups
 * =========================================================
 */
const Storage = {
  PREFIX: 'mj_',
  DB_NAME: 'MojingDB_v3',
  DB_VERSION: 3,
  _db: null,

  async initDB() {
    if (this._db) return this._db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => { this._db = req.result; resolve(this._db); };
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        const stores = ['images','audio','memories','plugins','files','backups'];
        stores.forEach(name => {
          if (!db.objectStoreNames.contains(name)) {
            const s = db.createObjectStore(name, { keyPath: 'id' });
            if (name === 'images') { s.createIndex('category', 'category', { unique: false }); s.createIndex('parentId', 'parentId', { unique: false }); }
            if (name === 'audio') s.createIndex('category', 'category', { unique: false });
            if (name === 'memories') { s.createIndex('timestamp', 'timestamp', { unique: false }); s.createIndex('category', 'category', { unique: false }); }
          }
        });
      };
    });
  },

  _tx(store, mode) { return this._db.transaction(store, mode).objectStore(store); },
  async dbGet(store, key) {
    const db = await this.initDB();
    return new Promise((r, j) => { const q = db.transaction(store, 'readonly').objectStore(store).get(key); q.onsuccess = () => r(q.result || null); q.onerror = () => j(q.error); });
  },
  async dbGetAll(store) {
    const db = await this.initDB();
    return new Promise((r, j) => { const q = db.transaction(store, 'readonly').objectStore(store).getAll(); q.onsuccess = () => r(q.result || []); q.onerror = () => j(q.error); });
  },
  async dbPut(store, data) {
    const db = await this.initDB();
    return new Promise((r, j) => { const q = db.transaction(store, 'readwrite').objectStore(store).put(data); q.onsuccess = () => r(q.result); q.onerror = () => j(q.error); });
  },
  async dbDel(store, key) {
    const db = await this.initDB();
    return new Promise((r, j) => { const q = db.transaction(store, 'readwrite').objectStore(store).delete(key); q.onsuccess = () => r(true); q.onerror = () => j(q.error); });
  },

  // Images
  async saveImage(id, category, parentId, name, dataUrl, meta = {}) { return this.dbPut('images', { id, category, parentId, name, data: dataUrl, meta, timestamp: Date.now() }); },
  async getImage(id) { const img = await this.dbGet('images', id); return img ? img.data : null; },
  async getImages(cat, parent) {
    const all = await this.dbGetAll('images');
    let r = all;
    if (cat) r = r.filter(i => i.category === cat);
    if (parent) r = r.filter(i => i.parentId === parent);
    return r;
  },
  async deleteImage(id) { return this.dbDel('images', id); },

  // Audio
  async saveAudio(id, category, name, dataUrl) { return this.dbPut('audio', { id, category, name, data: dataUrl, timestamp: Date.now() }); },
  async getAudio(id) { const a = await this.dbGet('audio', id); return a ? a.data : null; },
  async getAudios(cat) { const all = await this.dbGetAll('audio'); return cat ? all.filter(a => a.category === cat) : all; },
  async deleteAudio(id) { return this.dbDel('audio', id); },

  // Memories
  async saveMemory(m) { return this.dbPut('memories', { ...m, timestamp: m.timestamp || Date.now() }); },
  async getMemories() { return this.dbGetAll('memories'); },
  async deleteMemory(id) { return this.dbDel('memories', id); },

  // Plugins
  async savePlugin(p) { return this.dbPut('plugins', p); },
  async getPlugins() { return this.dbGetAll('plugins'); },
  async deletePlugin(id) { return this.dbDel('plugins', id); },

  // Files (generic blob storage)
  async saveFile(id, data, meta) { return this.dbPut('files', { id, data, meta, timestamp: Date.now() }); },
  async getFile(id) { return this.dbGet('files', id); },

  // Backups
  async saveBackup(id, name, data, size) { return this.dbPut('backups', { id, name, data, size, createdAt: Date.now() }); },
  async getBackups() { return this.dbGetAll('backups'); },
  async deleteBackup(id) { return this.dbDel('backups', id); },
  async getBackup(id) { const b = await this.dbGet('backups', id); return b ? b.data : null; },

  // localStorage helpers
  set(k, v) { try { localStorage.setItem(this.PREFIX + k, JSON.stringify(v)); } catch (e) { console.error(e); } },
  get(k, d) { try { const raw = localStorage.getItem(this.PREFIX + k); return raw ? JSON.parse(raw) : d; } catch (e) { return d; } },
  remove(k) { localStorage.removeItem(this.PREFIX + k); },

  fileToDataUrl(file) { return new Promise((r, j) => { const rd = new FileReader(); rd.onload = () => r(rd.result); rd.onerror = () => j(rd.error); rd.readAsDataURL(file); }); },
  async detectTransparency(imageDataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        try {
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let hasTransparent = false;
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] < 255) { hasTransparent = true; break; }
          }
          resolve(hasTransparent);
        } catch (e) { resolve(false); }
      };
      img.onerror = () => resolve(false);
      img.src = imageDataUrl;
    });
  }
};
