/** 墨境长记忆自动采集 v1：浏览器本地、可关闭、去重，不覆盖世界书/预设。 */
(function(){
  'use strict';
  const KEY='mo_memory_autocapture_v1';
  const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16)};
  const get=()=>localStorage.getItem(KEY)==='1';
  const set=v=>localStorage.setItem(KEY,v?'1':'0');
  let last='';
  function capture(text){
    const s=String(text||'').replace(/\s+/g,' ').trim();
    if(!get()||s.length<24||s===last)return;
    const h=hash(s);last=s;
    const seen=JSON.parse(localStorage.getItem('mo_memory_auto_seen_v1')||'[]');
    if(seen.includes(h))return;seen.unshift(h);localStorage.setItem('mo_memory_auto_seen_v1',JSON.stringify(seen.slice(0,500)));
    try{window.LongMemory?.add?.(s.slice(0,1800),{source:'auto-dialogue',importance:.4})}catch(e){console.warn('[墨境长记忆]',e)}
  }
  function mount(){
    if(document.getElementById('moMemoryAuto'))return;
    const b=document.createElement('button');b.id='moMemoryAuto';b.type='button';b.title='自动把剧情对话片段加入长记忆';
    const refresh=()=>{b.textContent=get()?'记忆自动采集：开':'记忆自动采集：关';b.classList.toggle('active',get())};
    b.onclick=()=>{set(!get());refresh()};refresh();document.body.appendChild(b);
    const observer=new MutationObserver(muts=>{if(!get())return;for(const m of muts){for(const n of m.addedNodes||[]){if(!(n instanceof Element))continue;const el=n.matches('.message,.dialogue,.chat-message,.story-text,.mo-dialogue')?n:n.querySelector?.('.message,.dialogue,.chat-message,.story-text,.mo-dialogue');if(el)capture(el.textContent)}}});
    observer.observe(document.body,{subtree:true,childList:true});
  }
  window.MOAutoMemory={enabled:get,toggle:()=>{set(!get());mount()},capture};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
