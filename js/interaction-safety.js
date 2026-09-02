/**
 * 墨境 Interaction Safety v1
 * 统一：可解释错误、连接诊断、取消/返回、Escape 退出、页面返回。
 */
(function(){
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let showing=false;
  function toast(msg,type='info'){
    try{window.App?.toast?.(msg,type);return}catch(_){}
    const t=document.createElement('div');t.className='mo-up-toast '+type;t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),3400);
  }
  function reasonFor(err){
    const raw=String(err?.message||err||'未知错误');
    if(/Failed to fetch|NetworkError|Load failed|网络请求/i.test(raw)) return ['连接失败','浏览器没有收到服务端的有效响应。可能是网络中断、Endpoint 不可达、CORS 跨域、服务未启动或 HTTPS/HTTP 混用。','检查网络、API 地址、服务端状态和 CORS 配置。'];
    if(/401/.test(raw)) return ['鉴权失败','服务端拒绝了身份验证。','检查 API Key、Token、鉴权方式和令牌是否过期。'];
    if(/403/.test(raw)) return ['权限被拒绝','服务端理解了请求，但当前账号或来源没有权限。','检查模型权限、Origin 白名单和服务端权限。'];
    if(/404/.test(raw)) return ['接口不存在','请求地址或接口路径不存在。','检查 Endpoint、API 版本和路径。'];
    if(/429/.test(raw)) return ['请求过于频繁','服务端触发了限流或额度限制。','降低请求频率、稍后重试或检查额度。'];
    if(/5\d\d/.test(raw)) return ['服务端错误','远端服务返回了 5xx 错误。','稍后重试；如果持续失败，请查看服务端日志。'];
    if(/CORS/i.test(raw)) return ['跨域被浏览器拦截','当前网页没有获得 API 服务端允许。','在服务端允许当前站点 Origin，正式环境建议使用后端代理。'];
    if(/JSON|Unexpected token/i.test(raw)) return ['返回格式错误','接口返回的内容不是墨境预期的 JSON 格式。','检查 API 兼容格式或响应解析规则。'];
    if(/不支持|请先|不能为空|没有找到/i.test(raw)) return ['操作无法继续',raw,'补齐当前页面需要的配置或输入。'];
    return ['操作失败',raw,'检查输入、配置和控制台技术信息后再试。'];
  }
  function showError(err,context='操作'){
    if(showing)return; showing=true;
    const raw=String(err?.message||err||'未知错误'); const [title,reason,action]=reasonFor(err);
    console.error('[墨境]',context,err);
    const m=document.createElement('div');m.className='mo-up-modal mo-error-modal';
    m.innerHTML=`<div class="mo-up-dialog"><div class="mo-up-head"><b>${esc(title)}</b><button data-close aria-label="关闭">×</button></div><div class="mo-up-body"><div class="mo-error-card"><div class="mo-error-badge">${esc(context)}</div><h3>${esc(reason)}</h3><p>${esc(action)}</p><details><summary>技术信息</summary><pre>${esc(raw)}</pre></details></div></div><div class="mo-modal-footer"><button class="mo-up-btn" data-close>取消 / 返回</button><button class="mo-up-btn primary" data-close>知道了</button></div></div>`;
    const close=()=>{m.remove();showing=false};m.addEventListener('click',e=>{if(e.target===m||e.target.closest('[data-close]'))close()});document.body.appendChild(m);
    toast(`${title}：${reason}`,'error');
  }
  window.MOError=window.MOError||{show:showError,toast};
  function addCancel(dialog){
    if(!dialog||dialog.querySelector('.mo-modal-footer'))return;
    const footer=document.createElement('div');footer.className='mo-modal-footer';
    footer.innerHTML='<button class="mo-up-btn" data-close>取消 / 返回</button>';dialog.appendChild(footer);
  }
  function enhancePages(){
    document.querySelectorAll('.mo-page-head').forEach(head=>{
      if(head.querySelector('[data-mo-back]'))return;
      const actions=head.querySelector('.mo-page-head-actions');if(!actions)return;
      const b=document.createElement('button');b.className='mo-quiet-btn';b.dataset.moBack='1';b.textContent='‹ 返回';
      b.onclick=()=>{if(history.length>1)history.back();else window.App?.navigate?.('home')};actions.prepend(b);
    });
  }
  const observer=new MutationObserver(()=>{document.querySelectorAll('.mo-up-dialog').forEach(addCancel);enhancePages()});
  function patchAssistant(){
    if(!window.MOAssistant||window.MOAssistant.__safePatched)return;
    for(const key of ['request','generateImage']){
      const fn=window.MOAssistant[key];if(typeof fn!=='function')continue;
      window.MOAssistant[key]=async function(){try{return await fn.apply(this,arguments)}catch(e){showError(e,key==='generateImage'?'生图连接':'AI API 连接');throw e}};
    }
    window.MOAssistant.__safePatched=true;
  }
  function boot(){
    observer.observe(document.body,{childList:true,subtree:true});enhancePages();patchAssistant();
    document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelector('.mo-up-modal')?.remove()});
    setTimeout(patchAssistant,500);setTimeout(patchAssistant,1500);
  }
  window.addEventListener('unhandledrejection',e=>{if(e.reason){showError(e.reason,'未处理的异步操作');e.preventDefault()}});
  window.addEventListener('error',e=>{if(e.error)showError(e.error,'页面运行错误')});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
