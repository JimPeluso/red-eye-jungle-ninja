/* Coins (hand-placed for Level 1, autoCoins() for the rest), background scenery and load(level). */
'use strict';
/* coins: level 1 is hand placed, the rest are laid out from the level shape */
const CO=[];
const line=(a,b,y,n)=>{for(let i=0;i<n;i++)CO.push([a+(b-a)*i/(n-1),y])};
const arc=(a,b,top,n)=>{for(let i=0;i<n;i++){const t=i/(n-1);CO.push([a+(b-a)*t,GY-34-(GY-34-top)*Math.sin(Math.PI*t)])}};
line(110,210,428,3);line(405,495,345,3);arc(870,1050,330,5);line(1205,1325,335,3);line(1415,1485,250,3);line(1640,1840,428,5);arc(1880,2050,330,5);line(2270,2360,335,3);line(2470,2560,265,3);line(2670,2760,335,3);arc(2980,3160,330,5);line(3200,3360,428,4);line(3420,3480,335,2);line(3670,3770,265,3);line(3860,4020,428,4);
L1.coins=CO;
function autoCoins(L){const c=[];
 for(const q of L.plats){if(q[3]||q[4]||q[2]<70)continue;const n=Math.max(2,Math.min(4,Math.floor(q[2]/40)));for(let i=0;i<n;i++)c.push([q[0]+20+(q[2]-40)*i/(n-1),q[1]-34])}
 for(let i=0;i<L.segs.length-1;i++){const a=L.segs[i][1],b=L.segs[i+1][0];if(b-a>320)continue;for(let k=0;k<5;k++){const t=k/4;c.push([a-20+(b-a+40)*t,GY-40-90*Math.sin(Math.PI*t)])}}
 for(const s of L.segs)for(let x=Math.max(s[0],60)+140;x<Math.min(s[1],L.gate)-160;x+=420)for(let k=0;k<3;k++)c.push([x+k*40,428]);
 return c}
for(const L of LEVELS)if(!L.coins)L.coins=autoCoins(L);

/* ---------- scenery, seeded so it is the same every time ---------- */
let seed=11;const sr=()=>(seed=seed*16807%2147483647)/2147483647;
const hh=n=>{const s=Math.sin(n*127.1+.5)*43758.5453;return s-Math.floor(s)};
const TB=[],TC=[],VN=[],CF=[];
for(let i=0;i<6;i++){const top=150+sr()*80;TB.push({x:i*86+sr()*30,w:10+sr()*8,top,b:[0,1,2,3].map(()=>[(sr()-.5)*60,(sr()-.5)*30,26+sr()*18])})}
for(let i=0;i<4;i++){const top=80+sr()*70;TC.push({x:i*190+sr()*60,w:22+sr()*12,top,b:[0,1,2,3,4].map(()=>[(sr()-.5)*110,(sr()-.6)*40,36+sr()*26]),li:[(sr()-.5)*60,60+sr()*120]})}
for(let i=0;i<3;i++)VN.push({x:i*270+sr()*120,len:70+sr()*90,ph:sr()*6,n:4+Math.floor(sr()*3)});
for(let i=0;i<6;i++)CF.push({x:i*52+sr()*20,r:26+sr()*28});

let SEGS,PLATS,GRASS,SIGNS,LANT,END,GATE,PAL,SKY,ABYSS,BL=[],li=0,bk=0,boss=false,LT=0;
function load(L){SEGS=L.segs;PLATS=L.plats;GRASS=L.grass;SIGNS=L.signs;LANT=L.lant;END=L.end;GATE=L.gate;PAL=PALS[L.pal];
 SKY=ctx.createLinearGradient(0,0,0,WH);[0,.42,.7,.8].forEach((s,i)=>SKY.addColorStop(s,PAL.sky[i]));
 ABYSS=ctx.createLinearGradient(0,GY,0,WH);ABYSS.addColorStop(0,'rgba(4,20,16,0)');ABYSS.addColorStop(.6,'#03100c');
 let s2=97;const r2=()=>(s2=s2*16807%2147483647)/2147483647;BL=[];
 const cols=L.pal==='cave'?['#3f6b5a','#4f7d68','#2f5a4a']:L.pal==='temple'?['#5f8a3f','#73a04a','#4a7432']:['#2fa84f','#43c463','#238c3f'];
 for(const[g0,g1]of GRASS)for(let x=g0;x<g1;x+=9)BL.push({x:x+r2()*4,h:46+r2()*26,c:cols[Math.floor(r2()*3)],l:(r2()-.5)*10})}
