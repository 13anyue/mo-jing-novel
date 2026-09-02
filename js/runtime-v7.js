/** 墨境 Runtime v7：场景优先 UI + 统一提示词桥接。 */
(function(){'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id); const safe=(fn,d)=>{try{return fn()}catch(_){return d}};
function promptBridge(text){
 const blocks=[]; let assistant='',preset='',world='',memory='';
 try{assistant=localStorage.getItem('mo_assistant_prompt')||localStorage.getItem('assistantPrompt')||''}catch(_){}
 if(!assistant)try{assistant=window.MOAssistant?.systemPrompt||window.MOAssistant?.prompt||''}catch(_){}
 try{const p=window.PromptSystem?.getPrompts?.()||{};preset=p.systemPrompt||p.npcPrompt||p.preset||''}catch(_){}
 try{world=window.WorldBook?.getInjectionText?.(text)||''}catch(_){}
 try{memory=(window.LongMemory?.search?.(text,6)||[]).map(x=>x.text||x.content||'').filter(Boolean).join('\n---\n')}catch(_){}
 if(assistant)blocks.push('【最高优先级·小助手规则】\n'+assistant);
 if(preset)blocks.push('【第二优先级·预设】\n'+preset);
 if(world)blocks.push('【第三优先级·世界书】\n'+world);
 if(memory)blocks.push('【第四优先级·长期记忆】\n'+memory);
 return blocks.join('\n\n');
}
function installPromptBridge(){
 const rt=window.NovelRuntime;if(!rt||rt.__v7Bridge)return;const original=rt.genAIReply;if(typeof original!=='function')return;
 rt.genAIReply=async function(playerText,extraContext){
  const bridge=extraContext||promptBridge(playerText),api=window.APISettings,chat=api?.chat;
  if(!api||typeof chat!=='function')return original.call(this,playerText);
  const oldChat=api.chat;
  api.chat=async function(system,messages,...rest){
   const ms=Array.isArray(messages)?messages.map(x=>({...x})):[];
   const i=ms.findIndex(x=>x.role==='system');
   if(i>=0)ms[i].content=bridge+'\n\n'+ms[i].content;
   else ms.unshift({role:'system',content:bridge});
   return chat.call(this,system,ms,...rest);
  };
  try{return await original.call(this,playerText)}finally{api.chat=oldChat}
 };
 rt.__v7Bridge=true;
}
function render(){
 const page=$('page-runtime');if(!page||!window.NovelRuntime)return;const rt=window.NovelRuntime,st=rt._state||{};
 page.classList.add('mo-v7-runtime');
 page.innerHTML=`<div class="v7-stage" id="moV7Stage">
 <img id="vnBg" class="v7-bg" alt="" aria-hidden="true"><div class="v7-vignette"></div>
 <header class="v7-topbar"><button class="v7-icon-btn" data-v7-back title="返回">‹</button><div class="v7-world"><span class="v7-kicker">墨境 · STORY</span><strong id="vnSceneBadge">${esc(st.scene||'起始场景')}</strong></div><div class="v7-top-actions"><button class="v7-ghost" data-v7-action="mode">${st.novelMode==='text'?'视觉':'文本'}模式</button><button class="v7-ghost" data-v7-action="save">存档</button><button class="v7-ghost" data-v7-action="settings">设置</button></div></header>
 <aside class="v7-rail"><button class="v7-rail-btn" data-v7-action="cast"><span>群</span><small>群像</small></button><button class="v7-rail-btn" data-v7-action="map"><span>图</span><small>地图</small></button><button class="v7-rail-btn" data-v7-action="history"><span>卷</span><small>回顾</small></button><button class="v7-rail-btn" data-v7-action="more"><span>⋯</span><small>更多</small></button></aside>
 <main class="v7-scene-content"><div id="vnCharLayer" class="v7-character"></div><div class="v7-dialog" id="vnDialogBox"><div class="v7-speaker-row"><span id="vnSpeaker">旁白</span><i></i></div><div class="v7-dialog-text" id="vnDialogText">从这里开始你的故事。</div><div class="v7-next" id="vnNextIndicator">点击输入行动继续</div></div><div id="vnLoading" class="v7-loading" style="display:none">世界正在回应…</div></main>
 <footer class="v7-inputbar"><div class="v7-input-wrap"><textarea id="rt_input" rows="1" placeholder="输入你的行动、对白或想法…"></textarea><button id="v7Send" title="发送">➤</button></div><div class="v7-tools"><button data-v7-action="choice">生成选项</button><button data-v7-action="continue">继续剧情</button><button data-v7-action="rewrite">重写</button></div></footer></div>
 <section class="v7-settings" id="v7Settings" hidden><div class="v7-sheet-head"><strong>导演设置</strong><button data-v7-close>关闭</button></div><div class="v7-setting-grid"><button data-v7-action="mode">切换模式</button><button data-v7-action="fullscreen">沉浸全屏</button><button data-v7-action="save">保存当前进度</button><button data-v7-action="saves">打开存档</button></div></section>`;
 bind();safe(()=>rt.refreshSelectors?.(),null);safe(()=>rt.loadRuntimeSettings?.(),null);
}
function goRoute(route){if(!route)return;try{if(window.App&&typeof App.navigate==='function'){App.navigate(route);return true}if(window.App&&typeof App.go==='function'){App.go(route);return true}}catch(e){safe(()=>window.App?.toast?.('页面跳转失败：'+(e.message||e)),null);return false}location.hash='#'+route;return true}
function backRoute(){try{if(window.App&&typeof App.back==='function'){App.back();return}}catch(e){safe(()=>window.App?.toast?.('返回失败：'+(e.message||e)),null)}history.back()}
function bind(){const rt=window.NovelRuntime,input=$('rt_input');const act=a=>{try{if(a==='mode')return rt.toggleNovelMode?.();if(a==='save')return rt.saveGame?.();if(a==='saves')return rt.showSaves?.();if(a==='fullscreen')return rt.toggleFullscreen?.();if(a==='choice')return rt.requestChoices?.();if(a==='continue')return rt.continueStory?.();if(a==='rewrite')return rt.rewriteLast?.();if(a==='settings'){const x=$('v7Settings');if(x)x.hidden=false;return}if(a==='cast')return goRoute('group-chat');if(a==='map')return goRoute('map');if(a==='history')return rt.showHistory?.()||safe(()=>window.App?.toast?.('当前版本暂未提供独立回顾页，请使用存档查看历史。'),null);if(a==='more')return window.MOPlatformV6?.more?.()||goRoute('settings')}catch(e){safe(()=>window.App?.toast?.('操作失败：'+(e.message||e)),null)}};
document.querySelectorAll('[data-v7-action]').forEach(b=>b.addEventListener('click',()=>act(b.dataset.v7Action)));document.querySelector('[data-v7-close]')?.addEventListener('click',()=>{$('v7Settings').hidden=true});document.querySelector('[data-v7-back]')?.addEventListener('click',backRoute);$('v7Send')?.addEventListener('click',()=>rt.playerSend?.());input?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();rt.playerSend?.()}});input?.addEventListener('input',()=>{input.style.height='auto';input.style.height=Math.min(input.scrollHeight,120)+'px'})}
function install(){installPromptBridge();const rt=window.NovelRuntime;if(!rt)return;rt.__v7Render=render;const oldInit=rt.init;rt.init=function(){safe(()=>this._initTouchGestures?.(),null);render();};rt.__v7OriginalInit=oldInit;const old=rt.onEnter;rt.onEnter=function(){safe(()=>old?.call(this),null);render()};if($('page-runtime')?.classList.contains('active'))render()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);window.MORuntimeV7={render,promptBridge,install};
})();