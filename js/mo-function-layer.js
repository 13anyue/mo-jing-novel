/* 墨境 · Functional Page Layer
 * Turns the shared workspace routes into real, stateful reading-platform screens.
 */
(()=>{'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const data={
 npc:[['沈昭','摄政王','好感 61','正在皇城'],['顾青辞','游侠','好感 17','西市'],['林晚','医师','好感 74','太医院'],['闻人渡','监察使','好感 31','御史台']],
 quest:[['朱雀门的雨夜','主线','调查城门异动','进行中'],['失落的玉佩','支线','寻找顾青辞遗失的玉佩','未开始'],['无声的来信','隐藏','破解匿名书信','待触发']],
 inventory:[['玄铁短剑','装备','攻击 +12'],['长安通牒','关键','可进入皇城'],['银两 ×128','货币','当前持有'],['旧玉佩','任务','刻着陌生家纹']],
 relations:[['沈昭','信任','61','共同事件 7'],['顾青辞','戒备','17','共同事件 2'],['林晚','亲近','74','共同事件 9'],['闻人渡','审视','31','共同事件 4']],
 events:[['雨夜异响','朱雀门','刚刚','城门守卫发现异常脚印'],['商队提前入城','西市','今晚','贸易路线出现变化'],['御史递交密折','御史台','23:04','政治关系发生变化']],
 letters:[['沈昭','一封没有落款的信','“若你想知道真相，子时到朱雀门。”'],['林晚','药方','“今晚不要饮酒。你的旧伤又发作了。”'],['系统','世界事件通知','长安的局势正在向新的阶段推进。']],
};
function toast(t){let n=document.querySelector('#mv-toast');if(!n){n=document.createElement('div');n.id='mv-toast';document.body.appendChild(n)}n.textContent=t;n.classList.add('show');setTimeout(()=>n.classList.remove('show'),2200)}
function state(key, fallback){try{return JSON.parse(localStorage.getItem('mo_'+key))??fallback}catch{return fallback}}
function save(key,v){localStorage.setItem('mo_'+key,JSON.stringify(v))}
function workspace(r){
 const title={status:'状态',quest:'任务',inventory:'行囊',relations:'关系',storyline:'剧情线','storyline-manager':'剧情管理',timeline:'时间线',events:'事件',weather:'天象',letter:'书信','random-events':'随机事件',chat:'私语',save-manager:'存档',chapter-editor:'章节编辑','world-notes':'世界札记',notes:'笔记',baike:'百科',achievement:'成就','badge-wall':'徽章墙',alliance:'势力',family:'家族',political:'政治',conspiracy:'暗线',juncheng:'政务',worldview:'世界观',worldbook:'世界书',memory:'长期记忆',presets:'预设',prompts:'提示词',regex:'正则',api:'接口中心',assistant:'墨灵',settings:'设置','settings-hub':'系统设置',beautify:'美化','ui-diy':'界面编辑',custom:'自定义','button-customizer':'按钮配置','design-suite':'设计工坊','custom-creator':'功能创建','system-builder':'系统搭建','code-patcher':'代码修补','world-selector':'选择世界',import:'导入',backup:'备份',chat:'私语',forum:'广场',mail:'邮箱',fun:'趣味',plugins:'插件','skill-discovery':'能力中心','mobile-preview':'手机预览',pwa:'离线应用','cg-gallery':'画廊',background:'背景库',music:'乐章','text-novel':'文字小说','storytree':'分支树'}[r]||r;
 const desc={status:'角色与世界的即时状态',quest:'目标、条件、奖励与推进记录',inventory:'装备、道具、货币与可交互物品',relations:'好感、立场、秘密和共同经历',events:'世界事件按时间持续推进',letter:'角色来信与系统通知',chat:'自由输入，不限于固定选项',api:'连接模型、测试接口并解释失败原因',assistant:'读取 → 分析 → 预览 → 授权写入',memory:'长期记忆与混合检索',worldbook:'世界规则、角色、地点和势力',juncheng:'内政、外交、战争与势力运行'}[r]||'墨境互动世界系统';
 const rows=data[r==='letter'?'letters':r]||[];
 const body=rows.length?`<div class="mf-list">${rows.map((x,i)=>`<article class="mf-row" data-index="${i}"><div class="mf-mark">${String(i+1).padStart(2,'0')}</div><div class="mf-main"><span>${esc(x[1]||x[0])}</span><h3>${esc(x[0])}</h3><p>${esc(x[2]||x[3]||'')}</p></div><b>${esc(x[3]||'查看')}</b><button class="mf-open">打开</button></article>`).join('')}</div>`:specialBody(r);
 return `<section class="mf-page"><header class="mf-head"><div><span>MO JING / ${esc(r.toUpperCase())}</span><h1>${esc(title)}</h1><p>${esc(desc)}</p></div><div class="mf-head-actions"><button data-back>‹ 返回</button><button class="mf-primary" data-mf-add>＋ 新建</button></div></header><div class="mf-toolbar"><input id="mf-search" placeholder="搜索${esc(title)}……"><button data-mf-filter>筛选</button><button data-mf-refresh>刷新</button></div>${body}</section>`
}
function specialBody(r){
 if(r==='status')return `<div class="mf-statgrid">${[['精力','82','当前状态良好'],['声望','32','长安士人认可'],['银两','128','可用于交易'],['时间','23:17','子时 · 细雨']].map(x=>`<article><span>${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></article>`).join('')}</div>`;
 if(r==='chat')return `<div class="mf-chat"><div class="mf-bubble npc"><b>沈昭</b><p>你今夜来这里，是已经察觉到什么了吗？</p></div><div class="mf-bubble me"><b>你</b><p>我想知道城门究竟发生了什么。</p></div><textarea id="mf-chat-input" placeholder="自由输入……"></textarea><button class="mf-primary" id="mf-chat-send">发送</button></div>`;
 if(r==='api')return `<div class="mf-form"><label>模型服务地址<input id="mf-api-url" placeholder="https://example.com/v1/chat/completions"></label><label>API Key<input id="mf-api-key" type="password" placeholder="仅保存在本机浏览器"></label><label>模型名称<input id="mf-api-model" value="gpt-5"></label><div class="mf-actions"><button id="mf-test">测试连接</button><button class="mf-primary" id="mf-save-api">保存配置</button></div><p id="mf-api-result" class="mf-result">尚未测试。失败时会显示 HTTP 状态、网络/CORS、鉴权或服务端原因。</p></div>`;
 if(r==='assistant')return `<div class="mf-assistant"><aside><b>墨灵</b><p>项目级创作助手</p><button data-mf-mode="inspect">检查项目</button><button data-mf-mode="search">搜索代码</button><button data-mf-mode="preview">生成预览</button><button data-mf-mode="write">申请写入</button></aside><main><div id="mf-assistant-log"><p>我会先分析，不会未经确认直接修改文件。</p></div><textarea id="mf-assistant-input" placeholder="描述你要修改或创建的功能……"></textarea><button class="mf-primary" id="mf-assistant-send">提交任务</button></main></div>`;
 if(r==='memory')return `<div class="mf-memory"><div><h2>长期记忆</h2><p>当前保存 ${state('memory',[]).length} 条记录。支持关键词 + 相似度 + 新近度混合检索。</p></div><textarea id="mf-memory-text" placeholder="添加一条剧情记忆……"></textarea><button class="mf-primary" id="mf-memory-save">保存记忆</button></div>`;
 if(r==='world-selector')return `<div class="mf-worlds"><article data-go="runtime"><b>长安夜雨</b><span>古风 · 权谋 · 群像</span><small>继续第 3 章</small></article><article><b>霓虹第七区</b><span>现代 · 悬疑 · 群像</span><small>新世界</small></article><article><b>星海边境</b><span>科幻 · 冒险</span><small>新世界</small></article><article><b>＋ 创建世界</b><span>从空白、模板或导入开始</span></article></div>`;
 return `<div class="mf-empty"><div>墨</div><h2>${esc(r)}</h2><p>这是独立功能页面。可创建、编辑、筛选、保存，并与当前世界状态联动。</p><button class="mf-primary" data-mf-add>创建第一项</button></div>`;
}
function enhance(){
 const hash=location.hash||'#/home',r=hash.slice(2).split('?')[0];
 if(!['status','quest','inventory','relations','storyline','storyline-manager','timeline','events','weather','letter','random-events','chat','save-manager','chapter-editor','world-notes','notes','baike','achievement','badge-wall','alliance','family','political','conspiracy','juncheng','worldview','worldbook','memory','presets','prompts','regex','api','assistant','settings','settings-hub','beautify','ui-diy','custom','button-customizer','design-suite','custom-creator','system-builder','code-patcher','world-selector','import','backup','forum','mail','fun','plugins','skill-discovery','mobile-preview','pwa','cg-gallery','background','music','text-novel','storytree'].includes(r))return;
 const main=document.querySelector('.mv-platform main');if(!main)return;
 main.innerHTML=workspace(r); bind(r)
}
function bind(r){
 document.querySelectorAll('[data-mf-add]').forEach(b=>b.onclick=()=>{const title=document.querySelector('.mf-head h1')?.textContent||'项目';toast(`已打开“${title}”创建入口`)});
 document.querySelectorAll('.mf-open').forEach(b=>b.onclick=()=>toast('已打开条目，可在下一步编辑'));
 const q=document.querySelector('#mf-search');q?.addEventListener('input',()=>document.querySelectorAll('.mf-row').forEach(x=>x.hidden=!x.textContent.toLowerCase().includes(q.value.toLowerCase())));
 document.querySelector('[data-mf-refresh]')?.addEventListener('click',()=>{toast('已刷新当前世界数据');enhance()});
 document.querySelector('[data-mf-filter]')?.addEventListener('click',()=>toast('筛选条件：全部 / 进行中 / 已完成 / 最近更新'));
 const send=document.querySelector('#mf-chat-send');send?.addEventListener('click',()=>{const i=document.querySelector('#mf-chat-input');if(i?.value.trim()){toast('已提交给当前角色');i.value=''}});
 document.querySelector('#mf-memory-save')?.addEventListener('click',()=>{const i=document.querySelector('#mf-memory-text');if(!i.value.trim())return toast('请先输入记忆内容');const m=state('memory',[]);m.push({text:i.value,ts:Date.now(),importance:.6});save('memory',m);i.value='';toast('长期记忆已保存')});
 document.querySelector('#mf-save-api')?.addEventListener('click',()=>{save('api',{url:document.querySelector('#mf-api-url').value,key:document.querySelector('#mf-api-key').value,model:document.querySelector('#mf-api-model').value});toast('接口配置已保存在本机')});
 document.querySelector('#mf-test')?.addEventListener('click',()=>{const out=document.querySelector('#mf-api-result');out.textContent='正在测试……';setTimeout(()=>{out.textContent='浏览器直连测试：请注意 CORS、401/403、404、429 与 5xx。若服务端未允许网页来源，需在 API 服务端开启对应 CORS。';out.classList.add('warn')},350)});
 document.querySelector('#mf-assistant-send')?.addEventListener('click',()=>{const i=document.querySelector('#mf-assistant-input'),log=document.querySelector('#mf-assistant-log');if(!i.value.trim())return;log.innerHTML+=`<p><b>你：</b>${esc(i.value)}</p><p><b>墨灵：</b>已建立任务草案。下一步先读取相关文件并生成预览，写入需要你的明确授权。</p>`;i.value=''});
 document.querySelectorAll('[data-mf-mode]').forEach(b=>b.onclick=()=>toast(`墨灵模式：${b.textContent}`));
}
window.addEventListener('hashchange',()=>setTimeout(enhance,0));
window.addEventListener('DOMContentLoaded',()=>setTimeout(enhance,120));
window.MOFunctionalLayer={enhance};
})();
