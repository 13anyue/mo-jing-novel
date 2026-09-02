/* 墨境 v8 QA：启动后做轻量静态运行态检查，并提供可读的故障原因与排查路径。 */
(function(){'use strict';
const required=['moV8Stage','moV8Body','moV8Foot'];
const modules=['MaterialLibrary','MOWorldV2','LongMemory','NovelRuntime','APISettings','MOAssistant','App'];
function msg(text){try{window.App?.toast?.(text,'error',5000)}catch(e){console.warn('[墨境 QA]',text)}}
function check(){const missing=required.filter(id=>!document.getElementById(id));const absent=modules.filter(k=>!(k in window));if(missing.length)msg('界面诊断：缺少核心节点 '+missing.join(', ')+'。排查：检查 platform-v8.js 是否加载、脚本顺序及浏览器控制台错误。');if(absent.length)console.info('[墨境 QA] 当前未暴露的可选模块：',absent.join(', '));try{if(location.protocol==='file:')msg('运行环境提示：当前是 file:// 本地打开。部分 API、音频、跨域请求会被浏览器限制；请使用 HTTP/HTTPS 静态服务器。')}catch(e){}}
function installErrors(){window.addEventListener('error',e=>{const t=e?.message||'未知脚本错误';msg('运行错误：'+t+'。排查：刷新页面；检查对应脚本是否 404、语法错误或依赖未加载。')});window.addEventListener('unhandledrejection',e=>{const r=e?.reason?.message||String(e?.reason||'未知异步错误');msg('异步操作失败：'+r+'。排查：检查网络/API/CORS、权限、返回 JSON 格式以及浏览器控制台。')})}
function boot(){installErrors();setTimeout(check,1200);window.MOPlatformV8QA={check}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();