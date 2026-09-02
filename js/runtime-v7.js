/**
 * 墨境 Runtime v7
 * 场景优先的高级视觉小说运行时外壳。
 * 不替换旧 Runtime 的业务 API，只重绘运行页，并为 VNEngine 提供额外上下文桥。
 */
(function(){'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $=id=>document.getElementById(id);
  const safe=(fn,d)=>{try{return fn()}catch(_){return d}};

  function promptBridge(text){
    const blocks=[];
    // 严格优先级：小助手 > 预设 > 世界书 > 记忆。模块不存在时仍保持明确边界。
    let assistant='';
    try{ assistant=localStorage.getItem('mo_assistant_prompt')||localStorage.getItem('assistantPrompt')||''; }catch(_){ }
    if(!assistant){ try{assistant=window.MOAssistant?.systemPrompt||window.MOAssistant?.prompt||'';}catch(_){} }
    let preset='';
    try{ const p=window.PromptSystem?.getPrompts?.()||{}; preset=p.systemPrompt||p.npcPrompt||p.preset||''; }catch(_){}
    let world='';
    try{ world=window.WorldBook?.getInjectionText?.(text)||''; }catch(_){}
    let memory='';
    try{
      const m=window.LongMemory?.search?.(text,6)||[];
      memory=m.map(x=>x.text||x.content||'').filter(Boolean).join('\n---\n');
    }catch(_){}
    if(assistant)blocks.push('【最高优先级·小助手规则】\n'+assistant);
    if(preset)blocks.push('【第二优先级·预设】\n'+preset);
    if(world)blocks.push('【第三优先级·世界书】\n'+world);
    if(memory)blocks.push('【第四优先级·长期记忆】\n'+memory);
    return blocks.join('\n\n');
  }

  function installPromptBridge(){
    if(!window.NovelRuntime||window.NovelRuntime.__v7Bridge)return;
    const rt=window.NovelRuntime, original=rt.genAIReply;
    if(typeof original!=='function')return;
    rt.genAIReply=async function(playerText,extraContext){
      const bridge=extraContext||promptBridge(playerText);
      const previous=this.__v7ExtraContext;
      this.__v7ExtraContext=bridge;
      try{return await original.call(this,playerText)}finally{this.__v7ExtraContext=previous;}
    };
    rt.__v7Bridge=true;
  }

  function render(){
    const page=$('page-runtime'); if(!page||!window.NovelRuntime)return;
    const rt=window.NovelRuntime, st=rt._state||{};
    const scene=esc(st.scene||'起始场景'), mode=st.novelMode==='text'?'文本':'视觉';
    page.classList.add('mo-v7-runtime');
    page.innerHTML=`
      <div class="v7-stage" id="moV7Stage">
        <img id="vnBg" class="v7-bg" alt="" aria-hidden="true">
        <div class="v7-vignette"></div>
        <header class="v7-topbar">
          <button class="v7-icon-btn" data-v7-back title="返回">‹</button>
          <div class="v7-world"><span class="v7-kicker">墨境 · STORY</span><strong id="vnSceneBadge">${scene}</strong></div>
          <div class="v7-top-actions">
            <button class="v7-ghost" data-v7-action="mode">${mode}模式</button>
            <button class="v7-ghost" data-v7-action="save">存档</button>
            <button class="v7-ghost" data-v7-action="settings">设置</button>
          </div>
        </header>

        <aside class="v7-rail">
          <button class="v7-rail-btn" data-v7-action="cast"><span>群</span><small>群像</small></button>
          <button class="v7-rail-btn" data-v7-action="map"><span>图</span><small>地图</small></button>
          <button class="v7-rail-btn" data-v7-action="history"><span>卷</span><small>回顾</small></button>
          <button class="v7-rail-btn" data-v7-action="more"><span>⋯</span><small>更多</small></button>
        </aside>

        <main class="v7-scene-content">
          <div id="vnCharLayer" class="v7-character"></div>
          <div class="v7-dialog" id="vnDialogBox">
            <div class="v7-speaker-row"><span id="vnSpeaker">旁白</span><i></i></div>
            <div class="v7-dialog-text" id="vnDialogText">从这里开始你的故事。</div>
            <div class="v7-next" id="vnNextIndicator">点击输入行动继续</div>
          </div>
          <div id="vnLoading" class="v7-loading" style="display:none">世界正在回应…</div>
        </main>

        <footer class="v7-inputbar">
          <div class="v7-input-wrap">
            <textarea id="rt_input" rows="1" placeholder="输入你的行动、对白或想法…"></textarea>
            <button id="v7Send" title="发送">➤</button>
          </div>
          <div class="v7-tools">
            <button data-v7-action="choice">生成选项</button>
            <button data-v7-action="continue">继续剧情</button>
            <button data-v7-action="rewrite">重写</button>
          </div>
        </footer>
      </div>
      <section class="v7-settings" id="v7Settings" hidden>
        <div class="v7-sheet-head"><strong>导演设置</strong><button data-v7-close>关闭</button></div>
        <div class="v7-setting-grid">
          <button data-v7-action="mode">切换${mode==='视觉'?'文本':'视觉'}模式</button>
          <button data-v7-action="fullscreen">沉浸全屏</button>
          <button data-v7-action="save">保存当前进度</button>
          <button data-v7-action="saves">打开存档</button>
        </div>
      </section>`;
    bind();
    safe(()=>rt.refreshSelectors?.(),null);
    safe(()=>rt.loadRuntimeSettings?.(),null);
  }

  function bind(){
    const rt=window.NovelRuntime;
    const input=$('rt_input'),send=$('v7Send');
    const act=a=>{
      try{
        if(a==='mode')return rt.toggleNovelMode?.();
        if(a==='save')return rt.saveGame?.();
        if(a==='saves')return rt.showSaves?.();
        if(a==='fullscreen')return rt.toggleFullscreen?.();
        if(a==='choice')return rt.requestChoices?.();
        if(a==='continue')return rt.continueStory?.();
        if(a==='rewrite')return rt.rewriteLast?.();
        if(a==='settings'){const x=$('v7Settings');if(x)x.hidden=false;return;}
        if(a==='cast')return safe(()=>window.App?.go?.('group-chat')||window.App?.go?.('npc'),null);
        if(a==='map')return safe(()=>window.App?.go?.('map'),null);
        if(a==='history')return safe(()=>rt.showHistory?.(),null);
        if(a==='more')return safe(()=>window.MOPlatformV6?.more?.(),null);
      }catch(e){safe(()=>window.App?.toast?.('操作失败：'+e.message),null);}
    };
    document.querySelectorAll('[data-v7-action]').forEach(b=>b.addEventListener('click',()=>act(b.dataset.v7Action)));
    document.querySelectorAll('[data-v7-close]').forEach(b=>b.addEventListener('click',()=>{$('v7Settings').hidden=true;}));
    document.querySelector('[data-v7-back]')?.addEventListener('click',()=>safe(()=>window.App?.back?.()||history.back(),null));
    send?.addEventListener('click',()=>rt.playerSend?.());
    input?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();rt.playerSend?.();}});
    input?.addEventListener('input',()=>{input.style.height='auto';input.style.height=Math.min(input.scrollHeight,120)+'px';});
  }

  function install(){
    installPromptBridge();
    if(window.NovelRuntime){
      window.NovelRuntime.__v7Render=render;
      const oldInit=window.NovelRuntime.init;
      window.NovelRuntime.init=function(){
        if(this.__v7Rendering)return;
        this.__v7Rendering=true;
        try{render();}finally{this.__v7Rendering=false;}
      };
      const oldOnEnter=window.NovelRuntime.onEnter;
      window.NovelRuntime.onEnter=function(){safe(()=>oldOnEnter?.call(this),null);render();};
      if(document.getElementById('page-runtime')?.classList.contains('active'))render();
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);
  window.MORuntimeV7={render, promptBridge, install};
})();
