/* Screen size, HUD, the main loop, keyboard and touch controls, buttons, save/restore and start-up. */
/* ---------- screen, HUD, loop ---------- */
function resize(){cw=cv.clientWidth||innerWidth;ch=cv.clientHeight||innerHeight;dpr=Math.min(window.devicePixelRatio||1,2);cv.width=Math.round(cw*dpr);cv.height=Math.round(ch*dpr);sc=Math.min(ch/WH,cw/600);offY=ch-WH*sc;viewW=cw/sc;TOP=-offY/sc}
const HE=[...document.querySelectorAll('#hearts svg')];let hk='';
function hud(){const bn=BN.t>0&&mode==='play',k=p.hearts+'|'+p.coins+'|'+p.ammo+'|'+(B?B.hp:-1)+'|'+bn+'|'+li+'|'+boss+'|'+Math.floor(p.sp||0);if(k===hk)return;hk=k;
 HE.forEach((h,i)=>h.classList.toggle('off',i>=p.hearts));$('hc').textContent=p.coins;$('ha').textContent=p.ammo;const sp=p.sp||0;$('supfill').style.width=sp+'%';$('sup').classList.toggle('full',sp>=100);$('bU').classList.toggle('ready',sp>=100);$('bV').classList.toggle('ready',sp>=100);$('lvtag').textContent=boss?(B&&B.cfg.final?'Final boss':B&&B.cfg.rider?'Master Fang':B&&B.cfg.duel?'Boss duel':'Mini-boss'):'Level '+(li+1);
 if(B)$('bossfill').style.width=Math.max(0,B.hp/B.max*100)+'%';$('banner').hidden=!bn}
let last=performance.now(),acc=0;
function frame(now){acc+=Math.min(100,now-last);last=now;while(acc>=STEP){step();acc-=STEP}render();hud();requestAnimationFrame(frame)}

/* ---------- controls ---------- */
function press(k){if(p&&p.frozen>0&&mode==='play'){p.frozen=Math.max(1,p.frozen-7);sparkle(p.x+17,p.y+20);return}if(k==='J')jb=8;if(k==='S')swReq=6;if(k==='T')stReq=6;if(k==='U')suReq=1;if(k==='V')clReq=1}
function newGame(){p=null;mode='title';startLevel(0)}
function retry(){if(boss){startBoss(bk);return}initAudio();p.hearts=6;p.ammo=Math.max(p.ammo,3);respawnAt(p.cp.x,p.cp.y);go('play')}
function pause(){if(mode!=='play')return;$('pC').textContent=p.coins;go('paused')}
function resume(){initAudio();go('play')}
function primary(){if(mode==='title'||mode==='champ')newGame();else if(mode==='win')nextFromWin();else if(mode==='over')retry();else if(mode==='paused')resume()}
const KM={ArrowLeft:'L',KeyA:'L',ArrowRight:'R',KeyD:'R',ArrowDown:'D',KeyS:'D',Space:'J',ArrowUp:'J',KeyW:'J',KeyZ:'S',KeyJ:'S',KeyX:'T',KeyK:'T',KeyC:'U',KeyL:'U',KeyV:'V'};
addEventListener('keydown',e=>{
 if(e.code==='KeyP'||e.code==='Escape'){if(mode==='play')pause();else if(mode==='paused')resume();return}
 if((e.code==='Enter'||e.code==='Space')&&mode!=='play'){e.preventDefault();primary();return}
 const k=KM[e.code];if(!k)return;e.preventDefault();if(e.repeat)return;key[k]=1;press(k)});
addEventListener('keyup',e=>{const k=KM[e.code];if(k)key[k]=0});
addEventListener('blur',()=>{for(const k in key)key[k]=0});
for(const b of document.querySelectorAll('#padR .b')){const k=b.dataset.k;
 b.addEventListener('pointerdown',e=>{e.preventDefault();try{b.setPointerCapture(e.pointerId)}catch(_){}tch[k]=1;b.classList.add('on');press(k);initAudio()});
 const up=()=>{tch[k]=0;b.classList.remove('on')};
 b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up)}
const padL=$('padL'),mv=new Map(),mvB=[...padL.querySelectorAll('.b')];
const keyAt=e=>{let best='L',bd=1e9;for(const b of mvB){const r=b.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),d=dx*dx+dy*dy;if(d<bd){bd=d;best=b.dataset.k}}return best};
const syncMv=()=>{const ks=new Set(mv.values());for(const b of mvB){const on=ks.has(b.dataset.k);b.classList.toggle('on',on);tch[b.dataset.k]=on?1:0}};
padL.addEventListener('pointerdown',e=>{e.preventDefault();try{padL.setPointerCapture(e.pointerId)}catch(_){}mv.set(e.pointerId,keyAt(e));syncMv();initAudio()});
padL.addEventListener('pointermove',e=>{if(mv.has(e.pointerId)){mv.set(e.pointerId,keyAt(e));syncMv()}});
const mvUp=e=>{mv.delete(e.pointerId);syncMv()};
padL.addEventListener('pointerup',mvUp);padL.addEventListener('pointercancel',mvUp);padL.addEventListener('lostpointercapture',mvUp);
addEventListener('touchstart',()=>document.documentElement.classList.add('touch'),{passive:true,once:true});
document.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('gesturestart',e=>e.preventDefault());
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
$('goT').onclick=newGame;
document.querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>{if(c.disabled)return;const i=+c.dataset.i;p=null;mode='title';startLevel(i)}));
$('goO').onclick=retry;$('goW').onclick=nextFromWin;$('goW2').onclick=()=>startLevel(li);$('goC').onclick=toTitle;$('goP').onclick=resume;$('goQ').onclick=toTitle;
$('pz').onclick=()=>{if(mode==='play')pause();else if(mode==='paused')resume()};
$('snd').onclick=()=>{muted=!muted;try{localStorage.setItem('redeye-mute',muted?'1':'0')}catch(e){}setSnd();initAudio()};

/* ---------- keep the game across page updates ---------- */
const snap=()=>({v:4,li,bk,boss,mode,coins:p.coins,kills:p.kills,sneaks:p.sneaks,time:p.time,ammo:p.ammo});
function restore(d){try{if(!d||d.v!==4)return false;
 if(d.mode==='title'){toTitle();return true}
 p=null;mode='title';li=Math.max(0,Math.min(LEVELS.length-1,d.li|0));if(d.boss)startBoss(Math.max(0,Math.min(BOSSES.length-1,d.bk|0)));else startLevel(li);
 Object.assign(p,{coins:d.coins|0,kills:d.kills|0,sneaks:d.sneaks|0,time:d.time|0,ammo:Math.max(5,d.ammo|0)});
 $('pC').textContent=p.coins;go('paused');return true}catch(e){return false}}
function start(d){if(!restore(d))toTitle();if(!running){running=true;requestAnimationFrame(frame)}}
load(L1);resize();
const ro=new ResizeObserver(resize);ro.observe(cv);
/* test hook: only exists when the page is opened with ?test (used by tests/smoke.mjs) */
if(/[?&]test\b/.test(location.search))window.__t={get p(){return p},get snakes(){return snakes},get B(){return B},get mode(){return mode},get li(){return li},get LT(){return LT},get spits(){return spits},get waves(){return waves},key,tch,LEVELS,BOSSES,PALS,mkSnake,startLevel,startBoss,respawnAt,bossHit,unlocked,step,draw(){render();hud()}};
try{window.claude?.hot?.snapshot?.(snap)}catch(e){}
window.claude?.hot?.ready?window.claude.hot.ready(start):start(window.claude?.hot?.data??{});
