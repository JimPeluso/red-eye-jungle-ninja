/* Drawing the giant cobra boss and its temple. */
'use strict';
/* ---------- the giant cobra and its temple ---------- */
function wall(xa,xb,cap){ctx.fillStyle='#6f7d76';ctx.fillRect(xa,GY-250,xb-xa,252);ctx.strokeStyle='rgba(20,30,26,.28)';ctx.lineWidth=2;ctx.beginPath();
 for(let r=0;r<6;r++){const y=GY-250+r*42;ctx.moveTo(xa,y);ctx.lineTo(xb,y);for(let x=880+(r%2?35:0);x<xb;x+=70)if(x>xa){ctx.moveTo(x,y);ctx.lineTo(x,y+42)}}ctx.stroke();
 ctx.fillStyle='#4cc75a';if(cap)rr(xa-6,GY-258,xb-xa+6,14,7);else ctx.fillRect(xa,GY-258,xb-xa,14)}
function torch(x){const y=GY-165,f=Math.sin(T*.3+x)*2;const g=ctx.createRadialGradient(x,y-8,2,x,y-8,46);g.addColorStop(0,'rgba(255,190,80,.6)');g.addColorStop(1,'rgba(255,190,80,0)');ctx.fillStyle=g;ctx.fillRect(x-46,y-54,92,92);
 ctx.fillStyle='#4a3421';ctx.fillRect(x-3,y,6,26);ctx.fillStyle='#ff8a1f';ell(x,y-8,6,11+f);ctx.fillStyle='#ffd36b';ell(x,y-5,3,6+f*.5)}
function templeBack(){wall(880,1700,true);ctx.fillStyle='#0b1a14';ctx.beginPath();ctx.moveTo(905,GY+2);ctx.lineTo(905,GY-120);ctx.quadraticCurveTo(960,GY-195,1015,GY-120);ctx.lineTo(1015,GY+2);ctx.fill();torch(893);
 ctx.fillStyle='#6f7d76';rr(-60,GY-210,70,214,4);ctx.fillStyle='#4cc75a';rr(-64,GY-218,78,14,7)}
function templeFront(){wall(1015,1700,false);torch(1040)}
function cobraBody(){const b=B,hx=b.hx,hy=b.hy,bx=hx+82,by=GY-26,pts=[];
 for(let i=0;i<=12;i++){const t=i/12,u=1-t;pts.push([u*u*(hx+14)+2*u*t*(hx+74)+t*t*bx,u*u*(hy+18)+2*u*t*(hy+34)+t*t*by,20+t*7])}
 for(let x=bx+22;x<1080;x+=22)pts.push([x,by+Math.sin(x*.03+b.tick*.08)*4,27]);
 const C=b.col,spk=b.phase===2?'#ff6a4d':'#efe3c2';if(b.cfg.spikes)pts.forEach(([x,y,r],j)=>{if(j%2)return;ctx.fillStyle=C.o;ctx.beginPath();ctx.moveTo(x-r*.45,y-r*.5);ctx.lineTo(x,y-r-19);ctx.lineTo(x+r*.45,y-r*.5);ctx.fill();ctx.fillStyle=spk;ctx.beginPath();ctx.moveTo(x-r*.3,y-r*.5);ctx.lineTo(x,y-r-15);ctx.lineTo(x+r*.3,y-r*.5);ctx.fill()});
 ctx.fillStyle=C.o;for(const[x,y,r]of pts)circle(x,y,r+3);
 pts.forEach(([x,y,r],j)=>{ctx.fillStyle=j%2?C.a:C.b;circle(x,y,r)}); ctx.fillStyle=C.m;pts.forEach(([x,y,r],j)=>{if(j%2===0){ctx.beginPath();ctx.moveTo(x,y-r*.8);ctx.lineTo(x+r*.4,y-r*.25);ctx.lineTo(x,y+r*.25);ctx.lineTo(x-r*.4,y-r*.25);ctx.fill()}});
 ctx.fillStyle=C.bl;for(let j=0;j<12;j++){const[x,y,r]=pts[j];circle(x-r*.42,y+2,r*.42)}}
function cobraHead(){const b=B,hx=b.hx,hy=b.hy,mad=b.phase===2||b.st==='windup'||b.st==='lunge',open=b.st==='windup'||b.st==='lunge'||b.st==='spit'||b.st==='spikes'||b.st==='burst';
 ctx.save();if(b.inv>0&&(b.inv>>2)%2)ctx.globalAlpha=.55;
 const shk=b.st==='windup'?Math.sin(b.tick*1.3)*2:0;ctx.translate(shk,0);
 const C=b.col,spk=b.phase===2?'#ff6a4d':'#efe3c2';if(b.cfg.spikes)for(const a of[-2.95,-2.6,-2.25,-.9,-.55,-.2]){const c=Math.cos(a),s=Math.sin(a),bx=hx+8+c*40,by=hy-6+s*48,tx=hx+8+c*68,ty=hy-6+s*76,nx=-s*7,ny=c*7;ctx.fillStyle=C.o;ctx.beginPath();ctx.moveTo(bx+nx*1.3,by+ny*1.3);ctx.lineTo(tx+c*4,ty+s*4);ctx.lineTo(bx-nx*1.3,by-ny*1.3);ctx.fill();ctx.fillStyle=spk;ctx.beginPath();ctx.moveTo(bx+nx,by+ny);ctx.lineTo(tx,ty);ctx.lineTo(bx-nx,by-ny);ctx.fill()}
 ctx.fillStyle=C.o;ell(hx+8,hy-6,45,53);ctx.fillStyle=C.b;ell(hx+8,hy-6,42,50);ctx.fillStyle=C.h;ell(hx+4,hy-2,28,38);
 ctx.strokeStyle=C.m;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(hx+4,hy-2,28,38,0,0,6.2832);ctx.stroke();ctx.fillStyle=C.m;ctx.beginPath();ctx.moveTo(hx+6,hy-38);ctx.lineTo(hx+13,hy-28);ctx.lineTo(hx+6,hy-18);ctx.lineTo(hx-1,hy-28);ctx.fill();
 ctx.fillStyle=C.o;ell(hx-16,hy+8,28,19);ctx.fillStyle=C.a;ell(hx-16,hy+8,25,16);ctx.fillStyle=C.bl;ell(hx-20,hy+16,16,6);
 if(open){ctx.fillStyle='#3a0d12';ctx.beginPath();ctx.moveTo(hx-42,hy+8);ctx.lineTo(hx-6,hy+12);ctx.lineTo(hx-40,hy+26);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(hx-34,hy+9);ctx.lineTo(hx-29,hy+9);ctx.lineTo(hx-31.5,hy+18);ctx.moveTo(hx-22,hy+10);ctx.lineTo(hx-17,hy+10.5);ctx.lineTo(hx-19.5,hy+18);ctx.fill()}
 ctx.fillStyle=mad||b.cfg.redEye?'#ff3b30':b.cfg.eye||'#ffe14d';circle(hx-24,hy+1,7.5);ctx.fillStyle='#14110f';ell(hx-23.4,hy+1,2,5.6);ctx.fillStyle='#fff';circle(hx-21.5,hy-2,1.6);
 ctx.strokeStyle=C.o;ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(hx-34,hy-8);ctx.lineTo(hx-14,hy-4);ctx.stroke();
 if(!open&&b.st!=='stuck'&&b.st!=='dazed'&&b.tick%90<16){ctx.strokeStyle='#e8302a';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(hx-40,hy+12);ctx.lineTo(hx-54,hy+12);ctx.lineTo(hx-60,hy+8);ctx.moveTo(hx-54,hy+12);ctx.lineTo(hx-60,hy+16);ctx.stroke()}
 if(b.st==='stuck'||b.st==='dazed'){ctx.fillStyle='#ffe14d';for(let i=0;i<3;i++){const a=b.tick*.12+i*2.094;star5(hx-12+Math.cos(a)*30,hy-30+Math.sin(a)*8,7)}}
 ctx.restore()}
/* Shadow's burrow attack. underground(fn) draws the cobra cut off at ground level: sunk by b.sink while diving or rising,
   or as a neck coming out of the hole at b.hole after it bursts up. */
function underground(fn){const b=B;if(!b||!b.ug){fn();return}
 ctx.save();ctx.beginPath();ctx.rect(cam-400,TOP-400,viewW+800,GY+3-(TOP-400));ctx.clip();if(b.hole==null)ctx.translate(0,b.sink*240);fn();ctx.restore()}
function burrowNeck(){const b=B,C=b.col,x=b.hole+14,pts=[];
 for(let y=GY+40;y>b.hy+18;y-=15)pts.push([x+Math.sin(y*.06+b.tick*.1)*3,y,23]);
 ctx.fillStyle=C.o;for(const[px,py,r]of pts)circle(px,py,r+3);
 pts.forEach(([px,py,r],j)=>{ctx.fillStyle=j%2?C.a:C.b;circle(px,py,r)});
 ctx.fillStyle=C.bl;for(const[px,py,r]of pts)circle(px-r*.45,py,r*.42)}
function burrowBack(){const b=B;
 if(b.st==='under'||b.st==='rumble'){const rm=b.st==='rumble',x=b.mx+(rm?Math.sin(b.tick*1.9)*3:0),h=rm?17:13,C=b.col;
  if(!rm){const bob=Math.sin(b.tick*.25)*3;ctx.fillStyle=C.o;ell(x+6,GY-h+2+bob,27,15);ctx.fillStyle=C.b;ell(x+6,GY-h+2+bob,24,12);
   ctx.fillStyle=C.m;ctx.beginPath();ctx.moveTo(x+6,GY-h-9+bob);ctx.lineTo(x+12,GY-h-2+bob);ctx.lineTo(x+6,GY-h+5+bob);ctx.lineTo(x,GY-h-2+bob);ctx.fill()}
  ctx.fillStyle='#4a3a2a';ell(x,GY+3,52,h+4);ctx.fillStyle='#8a7254';ell(x-20,GY,22,h-2);ell(x+24,GY+1,20,h-4);ctx.fillStyle='#b49a74';ell(x-24,GY-h*.45,10,3);ell(x+20,GY-h*.35,8,2.5);
  ctx.fillStyle='#6a5640';circle(x-40,GY-2,4.5);circle(x+44,GY-1,4);circle(x-6,GY-3,3);
  if(rm){ctx.fillStyle='#8a7254';ell(x,GY-2,30,h-3);ctx.strokeStyle='#14110f';ctx.lineWidth=2.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-16,GY-h+4);ctx.lineTo(x-4,GY-4);ctx.lineTo(x+8,GY-h+2);ctx.lineTo(x+18,GY-3);ctx.stroke();
   ctx.fillStyle='#14110f';ell(x,GY-6,14,4.5);ctx.fillStyle='#ff3b30';circle(x-5,GY-6,2.6);circle(x+5,GY-6,2.6)}}
 if(b.hole!=null){ctx.fillStyle='#4a3a2a';ell(b.hole,GY+1,60,15);ctx.fillStyle='#0d0806';ell(b.hole,GY+2,48,10)}}
function burrowFront(){const b=B;if(b.hole==null)return;
 ctx.fillStyle='#8a7254';ell(b.hole-44,GY+2,16,7);ell(b.hole+46,GY+3,14,6);ctx.fillStyle='#6a5640';circle(b.hole-60,GY-1,4.5);circle(b.hole+62,GY,4)}
