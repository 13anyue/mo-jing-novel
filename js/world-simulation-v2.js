/** 墨境世界模拟 v2：让群像 NPC 拥有可持续的生活圈、日程、目标、关系事件与离屏轨迹。 */
(function(){
  'use strict';
  const KEY='mo_world_sim_v2';
  const read=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(_){return d}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(_){return false}};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const toast=(m,t='info')=>{try{window.App?.toast?.(m,t);return}catch(_){};const x=document.createElement('div');x.className='mo-up-toast '+t;x.textContent=m;document.body.appendChild(x);setTimeout(()=>x.remove(),2600)};
  const uid=n=>String(n?.id||n?.npcId||n?.name||n?.title||'npc').replace(/[^\w\u4e00-\u9fff-]/g,'_').slice(0,80);
  const names=n=>String(n?.name||n?.title||'未命名角色');
  const getNpcs=()=>{try{const a=window.NPCManager?.getNPCs?.();if(Array.isArray(a)&&a.length)return a}catch(_){}for(const k of ['npcData','npcs']){const a=read(k,[]);if(Array.isArray(a)&&a.length)return a}return[]};
  const getLoc=()=>{try{return window.Storage?.get?.('currentLocation','未知地点')||'未知地点'}catch(_){return'未知地点'}};
  const shichen=()=>{try{return window.TimelineSystem?.getCurrentShichen?.()?.id||'chen'}catch(_){return'chen'}};
  const store=()=>read(KEY,{version:2,enabled:true,dayKey:'',profiles:{},logs:[],relations:{}});
  const save=s=>{write(KEY,s);return s};
  const slotByTime={yin:0,mao:0,chen:1,si:1,wu:2,wei:2,shen:3,you:3,xu:4,hai:5};
  const defaultRoutine=n=>[
    {id:'morning',label:'晨起',from:'05:00',to:'09:00',location:n.home||n.location||'居所',activity:'整理起居',energy:5},
    {id:'work',label:'日间',from:'09:00',to:'13:00',location:n.workplace||n.location||'工作地',activity:n.occupation?`处理${n.occupation}`:'处理日常事务',energy:-8},
    {id:'social',label:'午后',from:'13:00',to:'17:00',location:n.favoritePlace||n.location||'常去之处',activity:'与熟人往来',energy:-5},
    {id:'goal',label:'傍晚',from:'17:00',to:'20:00',location:n.goalPlace||n.location||'行动地点',activity:'推进个人目标',energy:-7},
    {id:'free',label:'夜间',from:'20:00',to:'23:00',location:n.home||n.location||'居所',activity:'自由活动',energy:-2},
    {id:'sleep',label:'深夜',from:'23:00',to:'05:00',location:n.home||n.location||'居所',activity:'休息',energy:18}
  ];
  function profile(n){const s=store(),id=uid(n);if(!s.profiles[id]){s.profiles[id]={id,npcId:n.id||id,name:names(n),home:n.home||n.location||'未知居所',occupation:n.occupation||n.job||'自由职业',faction:n.faction||'',goals:Array.isArray(n.goals)?n.goals.slice(0,8):[],circle:Array.isArray(n.relationships)?n.relationships.slice(0,20):[],routine:Array.isArray(n.routine)&&n.routine.length?n.routine:defaultRoutine(n),location:n.location||n.home||'未知地点',activity:'待机',mood:n.mood||'平静',energy:Number.isFinite(+n.energy)?+n.energy:80,trust:50,dayCount:0,lastTick:0,lastReason:'初始化',autonomous:true};save(s)}return s.profiles[id]}
  function mood(p){if(p.energy<25)return'疲惫';if(p.energy<45)return'倦怠';if(p.energy>85)return'精神';return p.mood||'平静'}
  function chooseRoutine(p){const map=slotByTime[shichen()];return p.routine[Math.max(0,Math.min(p.routine.length-1,map==null?1:map))]||p.routine[0]}
  function tick(reason='world-time',opts={}){const s=store();if(!s.enabled)return[];const now=Date.now(),people=getNpcs(),place=getLoc(),changed=[];people.forEach(n=>{const p=profile(n),r=chooseRoutine(p);p.location=r.location;p.activity=r.activity;p.energy=Math.max(0,Math.min(100,p.energy+(r.energy||0)));if(p.location===place){p.mood=p.mood==='疲惫'?'专注':(p.mood==='孤独'?'安心':p.mood)}else if(p.mood==='专注'&&p.energy<40)p.mood='疲惫';p.mood=mood(p);p.lastTick=now;p.lastReason=reason;p.dayCount=Math.max(p.dayCount,1);changed.push({...p})});
    if(changed.length){s.logs.unshift({at:now,reason,location:place,changes:changed.map(p=>({id:p.id,name:p.name,location:p.location,activity:p.activity,mood:p.mood,energy:p.energy}))});s.logs=s.logs.slice(0,1000)}save(s);return changed}
  function advance(minutes=30){const n=Math.max(5,Math.min(1440,Number(minutes)||30));const before=Date.now();const out=tick('advance-'+n);const s=store();s.lastAdvance={at:before,minutes:n};save(s);return out}
  function setProfile(id,patch){const s=store(),p=s.profiles[id];if(!p)throw Error('找不到角色生活档案');Object.assign(p,patch||{});p.lastTick=Date.now();save(s);return p}
  function setRoutine(id,routine){if(!Array.isArray(routine)||!routine.length)throw Error('日程不能为空');return setProfile(id,{routine:routine.slice(0,24)})}
  function getProfile(id){return store().profiles[id]||null}
  function getProfiles(){const s=store();return getNpcs().map(profile)}
  function recordRelation(a,b,delta,reason){const s=store(),key=[uid({id:a}),uid({id:b})].sort().join('|');const old=s.relations[key]||{a,b,score:50,events:[]};old.score=Math.max(0,Math.min(100,old.score+(Number(delta)||0)));old.events.unshift({at:Date.now(),delta:Number(delta)||0,reason:String(reason||'世界事件')});old.events=old.events.slice(0,30);s.relations[key]=old;save(s);return old}
  function getNearby(limit=6){const place=getLoc();return getProfiles().filter(p=>p.location===place).slice(0,limit)}
  function getGroupCast(limit=6){return getProfiles().sort((a,b)=>(b.location===getLoc())-(a.location===getLoc())||b.energy-a.energy).slice(0,Math.max(1,Math.min(12,limit)))}
  function addWorldEvent(text,people=[]){const s=store();s.logs.unshift({at:Date.now(),reason:'world-event',text:String(text||''),people:Array.isArray(people)?people.slice(0,12):[]});s.logs=s.logs.slice(0,1000);save(s);return s.logs[0]}
  function install(){window.WorldSimulation=Object.assign(window.WorldSimulation||{},{v2:true,profile,setProfile,setRoutine,getProfile,getProfiles,tick,advance,recordRelation,getNearby,getGroupCast,addWorldEvent,state:store});
    if(!document.getElementById('moWorldBackstageEntry')){const b=document.createElement('button');b.id='moWorldBackstageEntry';b.className='mo-world-fab';b.type='button';b.innerHTML='◌ <span>世界背面</span>';b.onclick=()=>{try{window.App?.navigate?.('world-backstage')}catch(_){}};document.body.appendChild(b)}
    if(window.EventBridge?.on)try{EventBridge.on('time:month',()=>tick('month-change'))}catch(_){}
  }
  window.MOWorldV2={profile,setProfile,setRoutine,getProfile,getProfiles,tick,advance,recordRelation,getNearby,getGroupCast,addWorldEvent};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
