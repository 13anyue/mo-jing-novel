/* 墨境平台 UI v5：统一页面 chrome、返回/取消、Esc、状态徽标。只增强，不替换业务模块。 */
(function(){'use strict';
const SKIP=new Set(['home','runtime']);
const label={map:'地图',npc:'人物志',inventory:'背包',quest:'任务',relations:'关系',background:'背景库',music:'音乐',memory:'长记忆',worldbook:'世界书',prompts:'提示词',presets:'预设',regex:'正则',assistant:'小助手',settings:'设置',settings-hub:'设置',api:'API',chat:'聊天',material-library:'素材库',cg-gallery:'CG画廊',storyline:'剧情',timeline:'时间线',events:'世界事件',save-manager:'存档',world-notes:'世界札记',npc-behavior:'人物行为',worldview:'世界观'};
const toast=m=>{let x=document.querySelector('.mo5-toast');if(!x){x=document.createElement('div');x.className='mo5-toast';document.body.appendChild(x)}x.textContent=m;clearTimeout(x._t);x._t=setTimeout(()=>x.remove(),2600)};
function current(){return (location.hash||'#home').slice(1).split('?')[0]||'home'}
function back(){try{if(history.length>1){history.back()}else{window.App?.navigate?.('home')}}catch(e){window.App?.navigate?.('home')}}
function closeOverlays(){document.querySelectorAll('.mo-overlay,.mo-modal,.modal-backdrop,[role="dialog"].is-open').forEach(x=>{x.classList.remove('is-open');x.style.display='none'});document.querySelectorAll('#moV3Stage').forEach(x=>x.remove())}
function enhance(page){if(!page||SKIP.has(page.dataset.pageId))return; if(page.querySelector('.mo5-page-mark'))return; const title=label[page.dataset.pageId]||page.querySelector('h1,h2,.page-title')?.textContent?.trim(); if(!title)return; const b=document.createElement('button');b.className='mo5-page-mark mo5-back';b.type='button';b.innerHTML='‹ 返回';b.onclick=back;page.appendChild(b);page.classList.add('mo-v5-page')}
function scan(){document.querySelectorAll('.page-view').forEach(p=>{const id=(p.id||'').replace(/^page-/,'');p.dataset.pageId=id;enhance(p)})}
function bind(){scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeOverlays()}});window.addEventListener('hashchange',()=>setTimeout(scan,30));window.MOPlatformV5={back,toast,closeOverlays,scan};}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
