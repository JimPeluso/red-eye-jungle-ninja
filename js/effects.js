/* Particles and pop-up text. */
'use strict';
/* ---------- effects ---------- */
function puff(x,y,c,n){for(let i=0;i<n;i++)parts.push({x,y,vx:rnd(-3,3),vy:rnd(-4,1),g:.15,life:rnd(20,34),max:34,r:rnd(3,7),c})}
function dust(x,y,n){for(let i=0;i<n;i++)parts.push({x:x+rnd(-10,10),y,vx:rnd(-1.5,1.5),vy:rnd(-1.8,-.4),g:.04,life:rnd(14,24),max:24,r:rnd(2,4),c:'rgba(240,230,200,.8)'})}
function sparkle(x,y){for(let i=0;i<8;i++){const a=i/8*6.283;parts.push({x,y,vx:Math.cos(a)*2.4,vy:Math.sin(a)*2.4,g:0,life:16,max:16,r:2.5,c:'#fff3a8'})}}
function pop(x,y,t,c){pops.push({x,y,t,c,life:60})}
function fx(){for(const q of parts){q.x+=q.vx;q.y+=q.vy;q.vy+=q.g;q.life--}parts=parts.filter(q=>q.life>0);for(const q of pops){q.y-=.7;q.life--}pops=pops.filter(q=>q.life>0);if(shake>0)shake--;for(const b of bolts)b.life--;bolts=bolts.filter(b=>b.life>0);if(flash>0)flash--}
