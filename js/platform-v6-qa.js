/* 墨境 v6 QA/自愈：启动后检查路由、关键模块、重复平台壳、明显 DOM/JS 问题；不阻断业务。 */
(function(){'use strict';
const critical={App:['navigate','handleRoute'],Storage:['get','set'],NovelRuntime:['genAIReply'],LongMemory:['search','add'],MOWorldState:['context','snapshot'],WorldSimulation:['openGroup'],VNEngineV2:['send']};
const aliases={people:'npc',users:'npc',bag:'inventory',task:'quest',more:'settings-hub'};
function report(){const issues=[];for(const [obj,methods] of Object.entries(critical)){const x=window[obj];if(!x){issues.push(obj+' 模块未加载');continue}methods.forEach(m=>{if(typeof x[m]!=='function')issues.push(obj+'.'+m+' 不可用')})}
 document.querySelectorAll('.page-view').forEach(p=>{const id=p.id.replace(/^page-/,'');if(!id)return;if(p.querySelectorAll('[id]').length>900)issues.push(id+' 页面 DOM 过大，请检查重复渲染')});
 if(document.querySelectorAll('#moV6Shell').length>1)issues.push('检测到重复 v6 平台壳');if(document.querySelectorAll('#moReferenceChrome').length>1)issues.push('检测到重复旧版平台壳');
 window.MOPlatformV6QA={time:Date.now(),issues,route:location.hash||'#home'};if(issues.length)console.warn('[墨境QA]',issues);return issues}
function repair(){try{document.querySelectorAll('#moV6Shell').forEach((x,i)=>{if(i)x.remove()});document.querySelectorAll('#moReferenceChrome').forEach(x=>x.style.display='none');document.querySelectorAll('.mo5-page-mark').forEach(x=>x.style.display='none')}catch(e){console.warn('[墨境QA自愈]',e)}return report()}
function bind(){window.MOPlatformV6QA={report,repair,aliases};setTimeout(()=>{repair()},900);window.addEventListener('hashchange',()=>setTimeout(report,250));window.addEventListener('error',e=>{if(e?.message)window.MOPlatformV6QA.lastError=e.message});window.addEventListener('unhandledrejection',e=>{window.MOPlatformV6QA.lastPromiseError=String(e?.reason||'unknown')})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
