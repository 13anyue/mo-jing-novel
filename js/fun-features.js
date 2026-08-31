/**
 * =========================================================
 * FunFeatures v6 — 趣味功能合集
 * 模块名：FunFeatures
 * 功能：骰子、抽签、诗词生成、每日运势、转盘
 * =========================================================
 */
const FunFeatures = {
  init() { this.renderPage(); },
  onEnter() { this.renderFeatures(); },

  renderPage() {
    const page = document.getElementById('page-fun');
    if (!page) return;
    page.innerHTML = `
      <div style="padding:var(--space-lg);max-width:900px;margin:0 auto;">
        <h2 class="section-title" style="margin-bottom:var(--space-lg);">🎮 趣味功能</h2>
        <div id="funContent"></div>
      </div>
    `;
    this.renderFeatures();
  },

  renderFeatures() {
    const c = document.getElementById('funContent');
    if (!c) return;
    c.innerHTML = `
      <div class="grid grid-3">
        <div class="card" style="text-align:center;cursor:pointer;" onclick="FunFeatures.renderDice(this)">
          <div class="card-body">
            <div style="font-size:48px;margin-bottom:12px;">🎲</div>
            <h4>骰子</h4>
            <p style="font-size:12px;color:var(--text-muted);">投掷骰子，随机决定</p>
          </div>
        </div>
        <div class="card" style="text-align:center;cursor:pointer;" onclick="FunFeatures.renderFortune(this)">
          <div class="card-body">
            <div style="font-size:48px;margin-bottom:12px;">🎐</div>
            <h4>每日运势</h4>
            <p style="font-size:12px;color:var(--text-muted);">抽取今日运势签</p>
          </div>
        </div>
        <div class="card" style="text-align:center;cursor:pointer;" onclick="FunFeatures.renderPoem(this)">
          <div class="card-body">
            <div style="font-size:48px;margin-bottom:12px;">📜</div>
            <h4>诗词生成</h4>
            <p style="font-size:12px;color:var(--text-muted);">AI生成古风诗词</p>
          </div>
        </div>
        <div class="card" style="text-align:center;cursor:pointer;" onclick="FunFeatures.renderWheel(this)">
          <div class="card-body">
            <div style="font-size:48px;margin-bottom:12px;">🎯</div>
            <h4>幸运转盘</h4>
            <p style="font-size:12px;color:var(--text-muted);">转盘抽奖</p>
          </div>
        </div>
        <div class="card" style="text-align:center;cursor:pointer;" onclick="FunFeatures.renderRiddle(this)">
          <div class="card-body">
            <div style="font-size:48px;margin-bottom:12px;">🏮</div>
            <h4>猜谜语</h4>
            <p style="font-size:12px;color:var(--text-muted);">趣味谜语挑战</p>
          </div>
        </div>
        <div class="card" style="text-align:center;cursor:pointer;" onclick="FunFeatures.renderNameGen(this)">
          <div class="card-body">
            <div style="font-size:48px;margin-bottom:12px;">✨</div>
            <h4>起名生成器</h4>
            <p style="font-size:12px;color:var(--text-muted);">生成古风角色名</p>
          </div>
        </div>
      </div>
    `;
  },

  renderDice(container) {
    if (!container) container = document.getElementById('funContent');
    const result = Math.floor(Math.random() * 6) + 1;
    const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    App.showModal('🎲 骰子', `
      <div style="text-align:center;padding:20px;">
        <div style="font-size:80px;margin-bottom:16px;">${diceFaces[result - 1]}</div>
        <div style="font-size:24px;color:var(--color-gold);font-weight:700;">点数：${result}</div>
        <button class="btn btn-primary" style="margin-top:20px;" onclick="FunFeatures.renderDice()">再投一次</button>
      </div>
    `);
  },

  renderFortune() {
    const fortunes = [
      { level: '大吉', desc: '鸿运当头，万事如意', color: '#C9A227' },
      { level: '中吉', desc: '顺风顺水，心想事成', color: '#8BC34A' },
      { level: '小吉', desc: '平安喜乐，小有收获', color: '#4CAF50' },
      { level: '平', desc: '波澜不惊，平淡是真', color: '#9E9E9E' },
      { level: '小凶', desc: '谨慎行事，注意安全', color: '#FF9800' },
      { level: '凶', desc: '诸事不宜，韬光养晦', color: '#F44336' }
    ];
    const f = fortunes[Math.floor(Math.random() * fortunes.length)];
    App.showModal('🎐 每日运势', `
      <div style="text-align:center;padding:20px;">
        <div style="font-size:64px;margin-bottom:12px;">🎐</div>
        <div style="font-size:36px;color:${f.color};font-weight:700;margin-bottom:8px;">${f.level}</div>
        <div style="font-size:16px;color:var(--text-secondary);">${f.desc}</div>
        <div style="margin-top:16px;font-size:12px;color:var(--text-muted);">
          ${new Date().toLocaleDateString('zh-CN')} · 仅供娱乐
        </div>
      </div>
    `);
  },

  renderPoem() {
    const poems = [
      '春风得意马蹄疾，一日看尽长安花。',
      '落霞与孤鹜齐飞，秋水共长天一色。',
      '山重水复疑无路，柳暗花明又一村。',
      '曾经沧海难为水，除却巫山不是云。',
      '人生若只如初见，何事秋风悲画扇。',
      '两情若是久长时，又岂在朝朝暮暮。'
    ];
    const p = poems[Math.floor(Math.random() * poems.length)];
    App.showModal('📜 诗词', `
      <div style="text-align:center;padding:24px;">
        <div style="font-size:48px;margin-bottom:16px;">📜</div>
        <div style="font-size:18px;line-height:2;color:var(--color-ink);font-family:serif;letter-spacing:2px;">${p}</div>
        <button class="btn btn-primary" style="margin-top:20px;" onclick="FunFeatures.renderPoem()">再来一首</button>
      </div>
    `);
  },

  renderWheel() {
    const prizes = ['🎁 神秘礼物', '💰 100金币', '❤️ 好感度+5', '📦 随机道具', '🍀 幸运加成', '💎 稀有材料'];
    const prize = prizes[Math.floor(Math.random() * prizes.length)];
    App.showModal('🎯 幸运转盘', `
      <div style="text-align:center;padding:20px;">
        <div style="font-size:64px;margin-bottom:16px;">🎯</div>
        <div style="font-size:20px;color:var(--color-gold);font-weight:700;margin-bottom:8px;">获得：${prize}</div>
        <button class="btn btn-primary" style="margin-top:16px;" onclick="FunFeatures.renderWheel()">再转一次</button>
      </div>
    `);
  },

  renderRiddle() {
    const riddles = [
      { q: '千条线，万条线，掉到水里看不见。', a: '雨' },
      { q: '白天躲夜晚出，嗡嗡嗡咬人肤。', a: '蚊子' },
      { q: '有面无口，有脚无手，听人说话，陪人喝酒。', a: '桌子' }
    ];
    const r = riddles[Math.floor(Math.random() * riddles.length)];
    App.showModal('🏮 猜谜语', `
      <div style="padding:20px;">
        <div style="font-size:48px;text-align:center;margin-bottom:16px;">🏮</div>
        <div style="font-size:16px;line-height:1.8;margin-bottom:16px;text-align:center;">${r.q}</div>
        <div style="text-align:center;">
          <button class="btn btn-primary" onclick="App.toast('谜底：${r.a}', 'info')">查看答案</button>
        </div>
      </div>
    `);
  },

  renderNameGen() {
    const surnames = ['云', '墨', '风', '月', '星', '霜', '雪', '花', '柳', '竹'];
    const names = ['遥', '澜', '轩', '璃', '殇', '芷', '瑾', '琰', '璇', '翎'];
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    const name = names[Math.floor(Math.random() * names.length)] + names[Math.floor(Math.random() * names.length)];
    App.showModal('✨ 起名生成器', `
      <div style="text-align:center;padding:20px;">
        <div style="font-size:48px;margin-bottom:16px;">✨</div>
        <div style="font-size:32px;color:var(--color-gold);font-weight:700;margin-bottom:8px;font-family:serif;">${surname}${name}</div>
        <div style="font-size:13px;color:var(--text-muted);">古风角色名</div>
        <button class="btn btn-primary" style="margin-top:16px;" onclick="FunFeatures.renderNameGen()">重新生成</button>
      </div>
    `);
  }
};
