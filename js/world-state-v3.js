/** 墨境世界状态桥 v3：统一时间、地点、NPC、关系、任务、记忆、存档与视觉小说。 */
(function(){'use strict';
const KEY='mo_world_state_v3';
const read=(k,d)=>{try{const x=localStorage.getItem(k);return x==null?d:JSON.parse(x)}catch(_){return d}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(_){return false}};
const now=()=>Date.now();
const base=()=>read(KEY,{version:3,location:'',chapter:'',questIds:[],flags:{},events:[],snapshots:[]});
const save=s=>{write(KEY,s);window.dispatchEvent(new CustomEvent('mo:world-state',{detail:s}));return s};
function location(){try{return window.Storage?.get?.('currentLocation','')||''}catch(_){return base().location||''}}
function snapshot(label='自动存档'){const s=base();const snap={at:now(),label,location:location(),timeline:read('timelineData',null),vn:read('mo_vn_engine_v2',null),world:read('mo_world_sim_v2',null),memory:read('mo_long_memory_v1',null)};s.snapshots.unshift(snap);s.snapshots=s.snapshots.slice(0,20);save(s);return snap}
function flag(key,value=true){const s=base();s.flags[String(key)]=value;save(s);return value}
function event(type,text,data={}){const s=base();const e={id:'e_'+now()+'_'+Math.random().toString(36).slice(2,7),at:now(),type:String(type||'story'),text:String(text||''),data:data||{}};s.events.unshift(e);s.events=s.events.slice(0,300);save(s);try{window.LongMemory?.add?.({text:e.text,type:'event',importance:type==='story'?0.7:0.45})}catch(_){}return e}
function context(input=''){const s=base();const npcs=(()=>{try{return window.MOWorldV2?.getGroupCast?.(8)||[]}catch(_){return[]}})();const nearby=(()=>{try{return window.MOWorldV2?.getNearby?.(8)||[]}catch(_){return[]}})();let mem=[];try{mem=window.LongMemory?.search?.(input,8)||[]}catch(_){}return {location:location(),chapter:s.chapter,flags:s.flags,nearby:npcs.map(p=>({name:p.name,location:p.location,activity:p.activity,mood:p.mood,energy:p.energy,goals:p.goals})),samePlace:nearby.map(p=>p.name),recentEvents:s.events.slice(0,12),memories:mem.map(x=>x.text||x.content).filter(Boolean)}}
function setChapter(chapter){const s=base();s.chapter=String(chapter||'');save(s);event('chapter','进入章节：'+s.chapter);return s.chapter}
function bind(){window.MOWorldState= {state:base,save,snapshot,flag,event,context,setChapter,location};
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')snapshot('离开页面前自动存档')});
 window.addEventListener('beforeunload',()=>{try{snapshot('关闭前自动存档')}catch(_) {}});
 window.addEventListener('mo:world-state',e=>{const s=e.detail;document.querySelectorAll('[data-world-location]').forEach(x=>x.textContent=s.location||location()||'未知地点');});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
