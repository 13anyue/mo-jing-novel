/** Knowledge Framework & Static Data */
const KnowledgeData={categories:[],writingTips:[],assetChecklist:[]};

/* v20 loader：UI、素材库、平台能力、交互安全按顺序载入。 */
(function(){
  const css=['css/ui-overhaul.css','css/interaction-safety.css'];
  css.forEach(href=>{if(!document.querySelector(`link[href="${href}"]`)){const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset.moUi='1';document.head.appendChild(l)}});
  const load=(src)=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('模块加载失败：'+src));document.head.appendChild(s)});
  load('js/material-library.js').then(()=>load('js/ui-overhaul.js')).then(()=>load('js/platform-upgrade.js')).then(()=>load('js/interaction-safety.js')).catch(e=>console.warn('[墨境平台] 加载失败',e));
})();
