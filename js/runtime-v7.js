/** 墨境 Runtime v8：高级文游沉浸运行层。 */
(function(){'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id); const safe=(fn,d)=>{try{return fn()}catch(e){console.warn('[墨境 Runtime]',e);return d}};
function toast(text,type='error'){safe(()=>window.App?.toast?.(text,type,5000),null)}
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
 const rt=window.NovelRuntime;if(!rt||rt.__v8Bridge)return;const original=rt.genAIReply;if(typeof original!=='function')return;
 rt.genAIReply=async function(playerText,extraContext){
  const bridge=extraContext||promptBridge(playerText),api=window.APISettings,chat=api?.chat;
  if(!api||typeof chat!=='function')return original.call(this,playerText);
  const oldChat=api.chat;
  api.chat=async function(system,messages,...rest){
   const ms=Array.isArray(messages)?messages.map(x=>({...x})):[]; const i=ms.findIndex(x=>x.role==='system');
   if(i>=0)ms[i].content=bridge+'\n\n'+ms[i].content; else ms.unshift({role:'system',content:bridge});
   return chat.call(this,system,ms,...rest);
  };
  try{return await original.call(this,playerText)}finally{api.chat=oldChat}
 };
 rt.__v8Bridge=true;
}
function state(){return window.NovelRuntime?._state||{}}
function sceneImage(st){
 return st.currentBgUrl||st.currentBackground||st.sceneContext?.image||st.sceneContext?.bg||st.backgroundUrl||'';
}
function charImage(st){return st.currentNpcImage||st.npcImage||st.characterImage||st.sceneContext?.characterImage||''}
function speaker(st){return st.currentSpeaker||st.speaker||st.npcName||st.sceneContext?.name||'旁白'}
function dialog(st){
 const h=Array.isArray(st.history)?st.history:[]; const last=h[h.length-1];
 return st.dialogText||st.currentText||last?.content||last?.text||'从这里开始你的故事。';
}
function render(){
 const page=$('page-runtime');if(!page||!window.NovelRuntime)return;const rt=window.NovelRuntime,st=state();
 page.classList.add('mo-v7-runtime');
 page.innerHTML=`<div class="v7-stage" id="moV7Stage">
 <div class="v7-bg-layer"><img id="vnBg" class="v7-bg" alt="场景背景" aria-hidden="true"><div class="v7-vignette"></div><div class="v7-grain"></div></div>
 <header class="v7-topbar"><button class="v7-icon-btn" data-v7-back aria-label="返回">‹</button><div class="v7-world"><span class="v7-kicker">MOJING · IMMERSIVE NOVEL</span><strong id="vnSceneBadge">${esc(st.scene||'起始场景')}</strong><span class="v7-subline">${esc(st.groupMode?'群像进行中':'沉浸叙事')}</span></div><div class="v7-top-actions"><button class="v7-ghost" data-v7-action="mode">${st.novelMode==='text'?'视觉模式':'文本模式'}</button><button class="v7-ghost" data-v7-action="save">存档</button><button class="v7-ghost" data-v7-action="settings">⚙ 设置</button></div></header>
 <div class="v7-progress"><span></span></div>
 <aside class="v7-rail" aria-label="快捷操作"><button class="v7-rail-btn" data-v7-action="cast"><b>群</b><small>群像</small></button><button class="v7-rail-btn" data-v7-action="map"><b>图</b><small>地图</small></button><button class="v7-rail-btn" data-v7-action="history"><b>卷</b><small>回顾</small></button><button class="v7-rail-btn" data-v7-action="more"><b>⋯</b><small>更多</small></button></aside>
 <main class="v7-scene-content"><div class="v7-scene-meta"><span class="v7-chip">${esc(st.groupMode?'群像':'单线')}</span><span>${esc(st.scene||'当前场景')}</span></div><div id="vnCharLayer" class="v7-character">${charImage(st)?`<img class="vn-character" src="${esc(charImage(st))}" alt="${esc(speaker(st))}">`:''}</div><div class="v7-dialog" id="vnDialogBox"><div class="v7-speaker-row"><strong id="vnSpeaker">${esc(speaker(st))}</strong><i></i><span class="v7-affection">${st.affection!=null?'好感 '+esc(st.affection):''}</span></div><div class="v7-dialog-text" id="vnDialogText">${esc(dialog(st))}</div><div class="v7-next" id="vnNextIndicator">输入行动继续 · Shift+Enter 换行</div></div><div id="vnLoading" class="v7-loading" style="display:none">世界正在回应…</div></main>
 <footer class="v7-inputbar"><div class="v7-input-wrap"><textarea id="rt_input" rows="1" placeholder="告诉角色你要做什么……"></textarea><button id="v7Send" title="发送" aria-label="发送">➤</button></div><div class="v7-tools"><button data-v7-action="choice">生成选项</button><button data-v7-action="continue">继续剧情</button><button data-v7-action="rewrite">重写上一段</button></div></footer>
 <nav class="v7-bottom-nav"><button data-v7-action="cast">人物志</button><button data-v7-action="map">世界地图</button><button data-v7-action="home">返回书架</button><button data-v7-action="saves">存档</button></nav>
 <section class="v7-settings" id="v7Settings" hidden role="dialog" aria-modal="true" aria-label="导演设置"><div class="v7-sheet-head"><div><small>SCENE CONTROL</small><strong>导演设置</strong></div><button data-v7-close aria-label="关闭">×</button></div><div class="v7-setting-grid"><button data-v7-action="mode">切换视觉 / 文本</button><button data-v7-action="fullscreen">沉浸全屏</button><button data-v7-action="save">保存当前进度</button><button data-v7-action="saves">打开存档</button><button data-v7-action="home">退出当前故事</button><button data-v7-action="api">API / 连接诊断</button></div><p class="v7-help">遇到连接失败时，会区分网络、CORS、401/403 权限、404 地址、429 限流与 5xx 服务端错误；请按提示排查，不会静默吞掉原因。</p></section>
 </div>`;
 const bg=sceneImage(st); if(bg&&$('vnBg'))$('vnBg').src=bg;
 bind();
 safe(()=>rt.refreshSelectors?.(),null); safe(()=>rt.loadRuntimeSettings?.(),null);
}
function goRoute(route){if(!route)return;try{if(window.App?.navigate){App.navigate(route);return true}if(window.App?.go){App.go(route);return true}}catch(e){toast('页面跳转失败：'+(e?.message||'路由异常')+'。请检查目标页面是否存在、脚本是否加载完成。');return false}location.hash='#'+route;return true}
function backRoute(){try{if(window.App?.back){App.back();return}}catch(e){toast('返回失败：'+(e?.message||'历史记录异常')+'。可以使用浏览器返回按钮。')}history.back()}
function bind(){const rt=window.NovelRuntime,input=$('rt_input');
 const act=a=>{try{
  if(a==='mode')return rt.toggleNovelMode?.(); if(a==='save')return rt.saveGame?.(); if(a==='saves')return rt.showSaves?.(); if(a==='fullscreen')return rt.toggleFullscreen?.();
  if(a==='choice')return rt.requestChoices?.(); if(a==='continue')return rt.continueStory?.(); if(a==='rewrite')return rt.rewriteLast?.();
  if(a==='settings'){const x=$('v7Settings');if(x)x.hidden=false;return} if(a==='cast')return goRoute('npc'); if(a==='map')return goRoute('map');
  if(a==='history')return rt.showHistory?.()||toast('当前没有独立回顾面板。可通过存档读取历史，或先保存当前进度。','info');
  if(a==='more')return window.MOPlatformV6?.more?.()||goRoute('settings'); if(a==='api')return goRoute('api'); if(a==='home')return goRoute('home');
 }catch(e){toast('操作失败：'+(e?.message||'未知错误')+'。请检查对应模块是否加载、浏览器控制台是否存在脚本错误。')}};
 document.querySelectorAll('[data-v7-action]').forEach(b=>b.addEventListener('click',()=>act(b.dataset.v7Action))); document.querySelector('[data-v7-close]')?.addEventListener('click',()=>{$('v7Settings').hidden=true}); document.querySelector('[data-v7-back]')?.addEventListener('click',backRoute);
 $('v7Send')?.addEventListener('click',()=>rt.playerSend?.()); input?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();rt.playerSend?.()}}); input?.addEventListener('input',()=>{input.style.height='auto';input.style.height=Math.min(input.scrollHeight,120)+'px'});
 document.addEventListener('keydown',window.__moV8EscHandler|| (window.__moV8EscHandler=e=>{if(e.key==='Escape'){const x=$('v7Settings');if(x&&!x.hidden)x.hidden=true;else backRoute()}}));
}
function install(){installPromptBridge();const rt=window.NovelRuntime;if(!rt)return;rt.__v8Render=render;const oldRender=rt.renderPage;rt.__v8OriginalRender=oldRender;
 rt.renderPage=function(){render()}; const oldInit=rt.init;rt.init=function(){safe(()=>this._initTouchGestures?.(),null);render()};rt.__v8OriginalInit=oldInit;
 const oldEnter=rt.onEnter;rt.onEnter=function(){safe(()=>oldEnter?.call(this),null);render()}; if($('page-runtime')?.classList.contains('active'))render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);window.MORuntimeV8={render,promptBridge,install};
})();