/* Drawing snakes: normal, sleepy, spitter, cobra, flying, two-headed and rock snakes. */
const SKIN=[{o:'#2e5e17',a:'#86d13f',b:'#9fe34d',s:'#3f7f1f',j:'#dff58a'},null,{o:'#7a2e0c',a:'#ff8f3a',b:'#ffab55',s:'#c2410c',j:'#ffe0a8'},{o:'#123c6b',a:'#3a8dde',b:'#5aa8f0',s:'#0f2f57',j:'#cfe8ff'}];
const ROCKS={o:'#2e2a24',a:'#7a6a52',b:'#948468',s:'#4a3e30',j:'#d8cfb8'};
function drawRock(x,y,k,peek){ctx.save();ctx.translate(x,y);ctx.scale(k,k);
 if(k>=1){ctx.fillStyle='rgba(0,0,0,.22)';ell(0,1,30,5)}
 ctx.fillStyle='#4f5450';ctx.beginPath();ctx.moveTo(-30,0);ctx.quadraticCurveTo(-32,-22,-12,-30);ctx.quadraticCurveTo(8,-36,24,-24);ctx.quadraticCurveTo(34,-12,30,0);ctx.closePath();ctx.fill();
 ctx.fillStyle='#7a807b';ctx.beginPath();ctx.moveTo(-26,-2);ctx.quadraticCurveTo(-27,-20,-10,-27);ctx.quadraticCurveTo(6,-32,20,-22);ctx.quadraticCurveTo(28,-12,26,-2);ctx.closePath();ctx.fill();
 ctx.fillStyle='rgba(255,255,255,.22)';ell(-8,-22,10,4);ctx.strokeStyle='#3e423f';ctx.lineWidth=1.6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-6,-26);ctx.lineTo(-2,-16);ctx.lineTo(4,-12);ctx.moveTo(12,-20);ctx.lineTo(16,-8);ctx.stroke();
 ctx.fillStyle='#5f9a3a';ell(14,-26,8,3);
 if(peek){ctx.fillStyle='#1a1c1b';ell(-8,-6,11,4);ctx.fillStyle='#ffe14d';circle(-12,-6,2.2);circle(-4,-6,2.2);ctx.fillStyle='#14110f';ell(-12,-6,.7,1.8);ell(-4,-6,.7,1.8)}
 ctx.restore()}
const TWO={o:'#3a1040',a:'#9a3ab0',b:'#b84ad0',s:'#ffd23f',j:'#f6d0ff'};
function twoHead(s,C){const pts=[];for(let i=0;i<=12;i++){const t=i/12;pts.push([s.x-44+t*88,s.y-10+Math.sin(s.t*.18+i*.7)*2.5,9-Math.sin(t*Math.PI)*1.5])}
 ctx.fillStyle=C.o;for(const[x,y,r]of pts)circle(x,y,r+2.2);pts.forEach(([x,y,r],j)=>{ctx.fillStyle=j%2?C.a:C.b;circle(x,y,r)});
 ctx.fillStyle=C.s;pts.forEach(([x,y,r],j)=>{if(j%3===1)ctx.fillRect(x-2,y-r,4,r*1.7)});
 for(const side of[-1,1]){const ext=s.bite>=4&&s.bite<=16&&s.bdir===side?22:0,hx=s.x+side*(50+ext),hy=s.y-13;
  if(ext){ctx.fillStyle=C.o;circle(s.x+side*(46+ext/2),s.y-11,9.5);ctx.fillStyle=C.a;circle(s.x+side*(46+ext/2),s.y-11,7.5)}
  ctx.fillStyle=C.o;ell(hx,hy,15.5,12);ctx.fillStyle=C.b;ell(hx,hy,13.5,10);ctx.fillStyle=C.j;ell(hx+side*3,hy+5,9,4);
  ctx.fillStyle=ext?'#ff3b30':'#ffe14d';circle(hx+side*4,hy-4,3.6);ctx.fillStyle='#14110f';ell(hx+side*4.5,hy-4,1.1,2.9);
  ctx.strokeStyle=C.o;ctx.lineWidth=2.2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(hx-side,hy-10);ctx.lineTo(hx+side*8,hy-7.5);ctx.stroke();
  if(ext){ctx.fillStyle='#3a0d12';ctx.beginPath();ctx.moveTo(hx+side*15,hy);ctx.lineTo(hx+side*3,hy+3);ctx.lineTo(hx+side*15,hy+9);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(hx+side*12,hy+1);ctx.lineTo(hx+side*10,hy+1.4);ctx.lineTo(hx+side*11,hy+5);ctx.fill()}
  else if((s.t+(side>0?0:40))%80<14){const tx=hx+side*14;ctx.strokeStyle='#e8302a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(tx,hy+3);ctx.lineTo(tx+side*8,hy+3);ctx.lineTo(tx+side*12,hy);ctx.moveTo(tx+side*8,hy+3);ctx.lineTo(tx+side*12,hy+6);ctx.stroke()}}
 if(s.bite>16){const hx=s.x+s.bdir*50;ctx.font="30px 'Lilita One',system-ui,sans-serif";ctx.textAlign='center';ctx.lineJoin='round';ctx.lineWidth=5;ctx.strokeStyle='#14110f';ctx.strokeText('!',hx,s.y-40);ctx.fillStyle='#ffe14d';ctx.fillText('!',hx,s.y-40)}}
const GS=1;const FLY={o:'#5a3a08',a:'#e0a020',b:'#f4c040',s:'#7a4a10',j:'#fff0b0'};const ICE={o:'#1d4e75',a:'#8fcdf0',b:'#bfe9ff',s:'#ffffff',j:'#eaf8ff'};
function iceBall(v){ctx.fillStyle='rgba(191,239,255,.45)';circle(v.x-v.vx*2,v.y,5);circle(v.x-v.vx*3.6,v.y,3);ctx.fillStyle='#1d4e75';circle(v.x,v.y,8.5);ctx.fillStyle='#bfefff';circle(v.x,v.y,6.5);
 ctx.strokeStyle='#fff';ctx.lineWidth=1.6;ctx.beginPath();for(let i=0;i<3;i++){const a=T*.2+i*1.047;ctx.moveTo(v.x+Math.cos(a)*5,v.y+Math.sin(a)*5);ctx.lineTo(v.x-Math.cos(a)*5,v.y-Math.sin(a)*5)}ctx.stroke()}
function snake(s){
 const C=s.rock?ROCKS:s.two?TWO:s.fly?FLY:s.ice?ICE:SKIN[s.type===1?0:s.type]||SKIN[0];
 if(s.fly&&!s.dy){ctx.fillStyle='rgba(0,0,0,.18)';ell(s.x,s.home+1,Math.max(8,24-(s.home-s.y)*.08),4)}
 ctx.save();if(s.dy)ctx.translate(0,s.dy);if(s.inv>0&&(s.inv>>2)%2)ctx.globalAlpha=.45;ctx.translate(s.x,s.y);ctx.scale(GS,GS);ctx.translate(-s.x,-s.y);
 if(s.two){twoHead(s,C);ctx.restore();return}
 if(s.rock&&!s.rk){const near=p&&Math.abs(p.x+17-s.x)<260;drawRock(s.x,s.y,1,near&&(T%110)<70);ctx.restore();return}
 const d=s.dir,n=10,rear=s.type===3?s.rear:0,hx=s.x+d*30,hy=s.y-13-26*rear,wig=s.sleep?1:3.5,pts=[];
 for(let i=n;i>=1;i--)pts.push([s.x+d*30-d*(i*6.6+6),s.y-10+Math.sin(s.t*.18-i*.9)*wig*(i/n+.3)-26*rear*Math.max(0,1-i/4),Math.max(4.5,11-i*.6)]);
 ctx.fillStyle=C.o;for(const[x,y,r]of pts)circle(x,y,r+2.2);
 pts.forEach(([x,y,r],j)=>{ctx.fillStyle=j%2?C.a:C.b;circle(x,y,r)});
 ctx.fillStyle=C.s;pts.forEach(([x,y,r],j)=>{if(j%2===0&&r>6){ctx.beginPath();ctx.moveTo(x,y-r*.75);ctx.lineTo(x+r*.45,y-r*.2);ctx.lineTo(x,y+r*.35);ctx.lineTo(x-r*.45,y-r*.2);ctx.fill()}});
 if(s.type===3){const ry=11+11*rear;ctx.fillStyle=C.o;ell(hx-d*5,hy-2,16,ry+2);ctx.fillStyle=C.b;ell(hx-d*5,hy-2,14,ry);ctx.fillStyle='#fff';ell(hx-d*7,hy-4-ry*.25,3,4)}
 ctx.fillStyle=C.o;ell(hx,hy,17.2,13.2);ctx.fillStyle=C.b;ell(hx,hy,15,11);ctx.fillStyle=C.j;ell(hx+d*3,hy+5,10,4.5);
 if(s.sleep){ctx.strokeStyle=C.o;ctx.lineWidth=2;ctx.beginPath();ctx.arc(hx+d*5,hy-4,3,.2,Math.PI-.2);ctx.stroke();
  const z=(T%80)/80;ctx.fillStyle='rgba(255,255,255,'+(1-z).toFixed(2)+')';ctx.font="18px 'Lilita One',system-ui,sans-serif";ctx.textAlign='center';ctx.fillText('z',hx-d*2+z*10,hy-22-z*24);ctx.fillText('z',hx-d*2+z*10-10,hy-40-z*24)}
 else{const angry=s.type===3&&s.cs>0;ctx.fillStyle=angry?'#ff3b30':'#ffe14d';circle(hx+d*5,hy-4,4);ctx.fillStyle='#14110f';ell(hx+d*5.6,hy-4,1.2,3.2);
  ctx.strokeStyle=C.o;ctx.lineWidth=2.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(hx,hy-10.5);ctx.lineTo(hx+d*9,hy-8);ctx.stroke();
  if(s.spit>0||s.cs===1||s.cs===2){ctx.fillStyle='#3a0d12';ctx.beginPath();ctx.moveTo(hx+d*16,hy);ctx.lineTo(hx+d*4,hy+3);ctx.lineTo(hx+d*16,hy+9);ctx.fill();if(s.spit>0){ctx.fillStyle=s.ice||s.frost?'#dff6ff':'#c6ff3d';circle(hx+d*16,hy+4,2+(24-s.spit)*.2)}}
  else if(s.t%80<14){const tx=hx+d*15;ctx.strokeStyle='#e8302a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(tx,hy+3);ctx.lineTo(tx+d*9,hy+3);ctx.lineTo(tx+d*13,hy);ctx.moveTo(tx+d*9,hy+3);ctx.lineTo(tx+d*13,hy+6);ctx.stroke()}}
 if(s.fly){const f=Math.sin(s.t*.5),wx=s.x-d*6,wy=s.y-16;ctx.fillStyle=C.o;ctx.save();ctx.translate(wx,wy);ctx.rotate(-d*(.5+f*.45));ctx.beginPath();ctx.ellipse(-d*4,-12,9,22,0,0,6.2832);ctx.fill();ctx.fillStyle='rgba(255,240,170,.92)';ctx.beginPath();ctx.ellipse(-d*4,-12,6.5,19,0,0,6.2832);ctx.fill();ctx.restore()}
 if(s.rock)drawRock(s.x-d*10,s.y-8,.62,false);
 if(s.alert>0||(s.fly&&s.cs===1&&s.ct>55)){ctx.font="30px 'Lilita One',system-ui,sans-serif";ctx.textAlign='center';ctx.lineJoin='round';ctx.lineWidth=5;ctx.strokeStyle='#14110f';ctx.strokeText('!',hx,hy-24);ctx.fillStyle='#ffe14d';ctx.fillText('!',hx,hy-24)}
 ctx.restore()}
