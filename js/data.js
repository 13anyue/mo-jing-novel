/** 墨境 · CORE LOADER
 * Presentation/navigation are owned by mo-rebuild-all.js.
 * Core engines load in order, then announce readiness so the UI never races them.
 */
const KnowledgeData={categories:[],writingTips:[],assetChecklist:[]};
(function(){'use strict';
const load=src=>new Promise((resolve,reject)=>{if(document.querySelector('script[src="'+src+'"]'))return resolve();const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('核心模块加载失败：'+src));document.head.appendChild(s)});
const core=['js/material-library.js','js/interaction-safety.js','js/memory-autocapture.js','js/world-simulation.js','js/world-simulation-v2.js','js/world-state-v3.js','js/vn-engine-v2.js','js/runtime-v7.js'];
window.MOCoreReady=Promise.resolve();
window.MOCoreReady=core.reduce((p,src)=>p.then(()=>load(src)),Promise.resolve()).then(()=>{window.MOCoreLoaded=true;window.dispatchEvent(new CustomEvent('mo:core-ready'));return true}).catch(err=>{window.MOCoreLoaded=false;window.MOCoreError=err;window.dispatchEvent(new CustomEvent('mo:core-error',{detail:err}));console.error('[墨境核心]',err);return false});
})();
