/** 墨境 NEW CORE LOADER — presentation and navigation are owned by mo-rewrite.js. */
const KnowledgeData={categories:[],writingTips:[],assetChecklist:[]};
(function(){'use strict';
const load=src=>new Promise((resolve,reject)=>{if(document.querySelector('script[src="'+src+'"]'))return resolve();const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('核心模块加载失败：'+src));document.head.appendChild(s)});
const core=['js/material-library.js','js/interaction-safety.js','js/memory-autocapture.js','js/world-simulation.js','js/world-simulation-v2.js','js/world-state-v3.js','js/vn-engine-v2.js','js/runtime-v7.js'];
core.reduce((p,s)=>p.then(()=>load(s)),Promise.resolve()).catch(e=>console.error('[墨境核心]',e));
})();
