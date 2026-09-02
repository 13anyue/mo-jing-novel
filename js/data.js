/** Knowledge Framework & Static Data */
const KnowledgeData={categories:[],writingTips:[],assetChecklist:[]};

/* v25 loader：统一 UI、素材库、平台能力、安全层、长记忆、参考图布局、逐页沉浸式重排、世界背面与群像生活模拟。 */
(function(){
  const css=['css/ui-overhaul.css','css/interaction-safety.css','css/ui-reference.css','css/ui-scene-pages.css'];
  css.forEach(href=>{if(!document.querySelector(`link[href="${href}"]`)){const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset.moUi='1';document.head.appendChild(l)}});
  const load=(src)=>new Promise((resolve,reject)=>{if(document.querySelector(`script[src="${src}"]`)){resolve();return}const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('模块加载失败：'+src));document.head.appendChild(s)});
  load('js/material-library.js')
    .then(()=>load('js/ui-overhaul.js'))
    .then(()=>load('js/platform-upgrade.js'))
    .then(()=>load('js/interaction-safety.js'))
    .then(()=>load('js/memory-autocapture.js'))
    .then(()=>load('js/ui-reference.js'))
    .then(()=>load('js/ui-scene-pages.js'))
    .then(()=>load('js/world-simulation.js'))
    .then(()=>load('js/world-simulation-v2.js'))
    .catch(e=>console.warn('[墨境平台] 模块加载失败：',e));
})();
