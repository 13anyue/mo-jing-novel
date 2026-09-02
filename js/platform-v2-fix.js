/* 墨境能力层修复补丁：旧记忆迁移、素材库正确批量导入、创作中枢入口。 */
(function(){'use strict';
function migrate(){try{const old=JSON.parse(localStorage.getItem('mo_long_memory_v1')||'[]');const cur=JSON.parse(localStorage.getItem('mo_long_memory_v2')||'[]');if(Array.isArray(old)&&old.length&&!cur.length&&window.LongMemoryV2){old.forEach(x=>x?.text&&window.LongMemoryV2.add(x.text,{importance:x.importance,source:x.source||'legacy-memory',tags:x.tags||[]}));console.info('[墨境] 已迁移旧长记忆',old.length)}}catch(e){console.warn('[墨境] 旧记忆迁移失败',e)}}
function mount(){if(document.getElementById('moPlatformHubBtn'))return;const b=document.createElement('button');b.id='moPlatformHubBtn';b.className='mo-platform-hub-btn';b.type='button';b.setAttribute('aria-label','打开创作中枢');b.innerHTML='<span>✦</span><em>创作中枢</em>';b.onclick=()=>window.MOPlatformV2?.hub?.();document.body.appendChild(b)}
function bind(){migrate();mount();window.MOPlatformFix={migrate,mount};}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();