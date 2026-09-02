/** Knowledge Framework & Static Data */
const KnowledgeData={categories:[],writingTips:[],assetChecklist:[]};

/* v18 UI loader：保持主 index 兼容，同时按顺序载入重构 UI 与统一素材库。 */
(function(){
  const css='css/ui-overhaul.css';
  if(!document.querySelector('link[data-mo-ui]')){const l=document.createElement('link');l.rel='stylesheet';l.href=css;l.dataset.moUi='1';document.head.appendChild(l)}
  const load=(src)=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
  load('js/material-library.js').then(()=>load('js/ui-overhaul.js')).catch(e=>console.warn('[墨境 UI] 加载失败',e));
})();