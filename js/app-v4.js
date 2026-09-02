/**
 * =========================================================
 * App v4 — 核心应用控制器（v8修复版）
 * =========================================================
 */
// [restored from uploaded project with NPC affection module registered]
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
    this.renderSidebar();
    this.renderTopBar();
    this.renderBottomNav();
    this.bindEvents();
    this.initThemes();
    this.initModules();
    this.handleRoute();
    window.addEventListener('hashchange', () => this.handleRoute());
    if (window.DesignSuiteIntegration && DesignSuiteIntegration.restoreCustomCSS) {
      try { DesignSuiteIntegration.restoreCustomCSS(); } catch(e) { console.warn(e); }
    }
  },

  initThemes() {
    Object.keys(BUILT_IN_THEMES || {}).forEach(id => this.registerTheme(id, BUILT_IN_THEMES[id]));
    let customs = {};
    try { customs = Storage.get(this.CUSTOM_THEMES_KEY, {}); } catch(e) { console.warn(e); }
    Object.keys(customs).forEach(id => { this.themes[id] = customs[id]; });
    let saved = 'ancient';
    try { saved = Storage.get('currentThemeId', 'ancient'); } catch(e) { console.warn(e); }
    this.applyTheme(saved, true);
  },
  registerTheme(id, theme) { this.themes[id] = theme; },
  getCurrentThemeId() { try { return Storage.get('currentThemeId', 'ancient'); } catch(e) { return 'ancient'; } },

  initModules() {
    const modules = ['HomePage','NovelRuntime','APISettings','NPCManager','BackgroundLibrary','MusicManager','MapSystem','StatusBar','PromptSystem','MemorySystem','PresetManager','RegexEngine','WorldBook','CGGallery','StoryTreeEditor','SettingsHub','InventorySystem','QuestSystem','WeatherSystem','LetterSystem','Notes','Relations','AchievementSystem','Timeline','Events','SaveManager','ChapterEditor','TextNovel','WorldNotes','SceneSystem','NPCBehavior','CodePatcher','NPCAffection'];
    modules.forEach(modName => {
      const mod = window[modName] || window[modName.replace(/System$/, '')];
      if (mod && typeof mod.init === 'function') { try { mod.init(); } catch(e) { console.warn('[App]', modName, 'init失败:', e.message); } }
    });
    const pageMap = {
      home:'HomePage',runtime:'NovelRuntime',api:'APISettings',npc:'NPCManager',background:'BackgroundLibrary',music:'MusicManager',map:'MapSystem',status:'StatusBar',prompts:'PromptSystem',memory:'MemorySystem',presets:'PresetManager',regex:'RegexEngine',worldbook:'WorldBook','cg-gallery':'CGGallery',storytree:'StoryTreeEditor','settings-hub':'SettingsHub',inventory:'InventorySystem',quest:'QuestSystem',weather:'WeatherSystem',letter:'LetterSystem',notes:'Notes',relations:'Relations',achievement:'AchievementSystem',timeline:'Timeline',events:'Events','save-manager':'SaveManager','chapter-editor':'ChapterEditor','text-novel':'TextNovel','world-notes':'WorldNotes',scene:'SceneSystem','npc-behavior':'NPCBehavior','code-patcher':'CodePatcher',affection:'NPCAffection','world-selector':'WorldSelector',hero:'HeroSystem',import:'ImportManager',backup:'BackupManager','ui-diy':'UIDIY',baike:'BaikeIntegration','design-suite':'DesignSuite', 'skill-discovery':'SkillDiscovery','custom-creator':'CustomCreator','mobile-preview':'MobilePreview',pwa:'PWASystem',assistant:'Assistant',plugins:'PluginManager',chat:'AppChat',forum:'AppForum',mail:'AppMail',settings:'AppSettings',beautify:'AppBeautify',custom:'AppCustom',alliance:'AllianceSystem',fun:'FunFeatures',juncheng:'Portal',storyline:'Storyline','storyline-manager':'StorylineManager','random-events':'RandomEvents','badge-wall':'BadgeWall','system-builder':'SystemBuilder',worldview:'WorldviewEngine',family:'FamilySystem',political:'PoliticalSystem',conspiracy:'ConspiracySystem','button-customizer':'ButtonCustomizer'
    };
    Object.keys(pageMap).forEach(pageId => { const mod=window[pageMap[pageId]]; if(mod&&typeof mod.renderPage==='function') this.callbacks[pageId]={onEnter:()=>mod.renderPage()}; });
  },
  renderSidebar(){const s=document.getElementById('sidebar');if(s)s.style.display='none';},
  renderTopBar(){}, renderBottomNav(){}, loadCustomNavItems(){},
  bindEvents(){ document.addEventListener('keydown',e=>{if(e.key==='Escape'&&this.closeModal)this.closeModal();}); }
};

App.NAV_ITEMS = App.NAV_ITEMS || [];
window.App = App;

document.addEventListener('DOMContentLoaded', () => {
  let savedMask=null, gameLaunched=false;
  try { savedMask=Storage.get('userMask',null); gameLaunched=Storage.get('gameLaunched',false); } catch(e) { console.warn(e); }
  if(savedMask&&gameLaunched){const launcher=document.getElementById('gameLauncher');if(launcher)launcher.classList.add('hidden');const mainApp=document.getElementById('mainApp');if(mainApp)mainApp.style.display='flex';App.init();}
  else if(window.Launcher&&typeof Launcher.init==='function'){try{Launcher.init();}catch(e){console.warn(e);}}
});
