/** Knowledge Framework & Static Data */
const KnowledgeData={categories:[],writingTips:[],assetChecklist:[]};

/* v33 loader：平台 v6 全局文游壳；旧业务模块继续运行，由 v6 统一视觉与导航。 */
(function(){
  const css=['css/ui-overhaul.css','css/interaction-safety.css','css/ui-reference.css','css/ui-scene-pages.css','css/ui-v3.css','css/ui-v4.css','css/ui-v5.css','css/platform-v2.css','css/platform-v2-fix.css','css/world-state-v3.css','css/platform-v6.css'];
  css.forEach(href=>{if(!document.querySelector(`link[href="${href}"]`)){const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset.moUi='1';document.head.appendChild(l)}});
  const load=(src)=>new Promise((resolve,reject)=>{if(document.querySelector(`script[src="${src}"]`)){resolve();return}const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('模块加载失败：'+src));document.head.appendChild(s)});
  load('js/material-library.js').then(()=>load('js/ui-overhaul.js')).then(()=>load('js/platform-upgrade.js')).then(()=>load('js/interaction-safety.js')).then(()=>load('js/memory-autocapture.js')).then(()=>load('js/ui-reference.js')).then(()=>load('js/ui-scene-pages.js')).then(()=>load('js/world-simulation.js')).then(()=>load('js/world-simulation-v2.js')).then(()=>load('js/world-state-v3.js')).then(()=>load('js/ui-v3.js')).then(()=>load('js/vn-engine-v2.js')).then(()=>load('js/ui-platform-v5.js')).then(()=>load('js/platform-v2.js')).then(()=>load('js/platform-v2-fix.js')).then(()=>load('js/platform-v6.js')).catch(e=>console.warn('[墨境平台] 模块加载失败：',e));
})();
