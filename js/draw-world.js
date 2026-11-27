/* Drawing helpers and the world: trees, ground, water, logs, signs, lanterns, gate, coins, items. */
/* ---------- drawing helpers ---------- */
function rrp(x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function rr(x,y,w,h,r){rrp(x,y,w,h,r);ctx.fill()}
function circle(x,y,r){ctx.beginPath();ctx.arc(x,y,r,0,6.2832);ctx.fill()}
function ell(x,y,a,b){ctx.beginPath();ctx.ellipse(x,y,a,b,0,0,6.2832);ctx.fill()}
function star5(x,y,r){ctx.beginPath();for(let i=0;i<10;i++){const a=-1.5708+i*.6283,R=i%2?r*.45:r;ctx.lineTo(x+Math.cos(a)*R,y+Math.sin(a)*R)}ctx.fill()}
function heartP(x,y,s){ctx.beginPath();ctx.moveTo(x,y+s*.9);ctx.bezierCurveTo(x-s*1.5,y,x-s*.9,y-s*1.1,x,y-s*.35);ctx.bezierCurveTo(x+s*.9,y-s*1.1,x+s*1.5,y,x,y+s*.9);ctx.fill()}
function layer(f,T0,arr,fn){const o=((cam*f)%T0+T0)%T0;for(let k=-T0;k<viewW+T0;k+=T0){const bx=k-o;for(const it of arr){const x=bx+it.x;if(x>-260&&x<viewW+260)fn(it,x)}}}
function hills(f,col,base,a1,a2){ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(-10,WH+10);for(let x=-10;x<=viewW+20;x+=20){const w=x+cam*f;ctx.lineTo(x,base+a1*Math.sin(w*.0045)+a2*Math.sin(w*.013+1))}ctx.lineTo(viewW+20,WH+10);ctx.closePath();ctx.fill()}
function blobs(x,top,b,k,ox,oy){ctx.beginPath();for(const[dx,dy,r]of b){const R=r*k,X=x+dx+ox*r,Y=top+dy+oy*r;ctx.moveTo(X+R,Y);ctx.arc(X,Y,R,0,6.2832)}ctx.fill()}
function treeB(it,x){ctx.fillStyle=PAL.tB;ctx.fillRect(x-it.w/2,it.top,it.w,400-it.top);blobs(x,it.top,it.b,1,0,0);ctx.fillStyle='rgba(255,255,255,.08)';blobs(x,it.top,it.b,.6,-.2,-.3)}
function treeC(it,x){const c=PAL.tC;ctx.fillStyle=c[0];ctx.fillRect(x-it.w/2,it.top,it.w,440-it.top);ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(x,it.top,it.w/2,440-it.top); ctx.strokeStyle=c[3];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+it.li[0],it.top+20);ctx.quadraticCurveTo(x+it.li[0]+16,it.top+20+it.li[1]*.6,x+it.li[0]+4,it.top+20+it.li[1]);ctx.stroke();
 ctx.fillStyle=c[1];blobs(x,it.top,it.b,1,0,0);ctx.fillStyle=c[2];blobs(x,it.top,it.b,.55,-.25,-.35)}
function canopy(it,x){ctx.fillStyle=PAL.can[0];circle(x+18,TOP+it.r*.3,it.r*.75);ctx.fillStyle=PAL.can[1];circle(x,TOP-6,it.r)}
function vine(it,x){const sw=Math.sin(T*.02+it.ph)*6,y0=TOP-4,L=it.len;ctx.strokeStyle=PAL.vine[0];ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y0);ctx.quadraticCurveTo(x+sw*.4,y0+L*.5,x+sw,y0+L);ctx.stroke();
 ctx.fillStyle=PAL.vine[1];for(let k=1;k<=it.n;k++){const t=k/(it.n+1),s=k%2?1:-1;ctx.beginPath();ctx.ellipse(x+sw*t*t+s*7,y0+L*t,9,4.5,s*.6,0,6.2832);ctx.fill()}}

function ground(s,a,b){const w=s[1]-s[0],d=PAL.dirt,l=PAL.lip;
 ctx.fillStyle=d[0];ctx.fillRect(s[0],GY+4,w,WH-GY+60);
 ctx.fillStyle=d[1];ctx.fillRect(s[0],GY+58,w,WH);
 ctx.fillStyle=d[2];for(let x=Math.ceil(a/56)*56;x<b;x+=56){const r=hh(x);ctx.beginPath();ctx.ellipse(x+r*26,GY+32+hh(x+3)*80,6+r*5,4+r*3,0,0,6.2832);ctx.fill()}
 ctx.fillStyle=l[0];rr(s[0]-4,GY-6,w+8,22,10);
 for(let x=Math.max(s[0]+8,Math.floor(a/18)*18);x<Math.min(s[1]-6,b);x+=18)circle(x,GY+15,7);
 ctx.fillStyle=l[1];rr(s[0]-4,GY-9,w+8,13,6);
 ctx.fillStyle=l[2];ctx.fillRect(s[0]+4,GY-8,w-8,3)}
function clouds(a,b){ctx.fillStyle='rgba(255,255,255,.92)';for(let x=Math.floor(a/60)*60;x<b+60;x+=60){if(x<a-40)continue;circle(x+hh(x+1)*20,GY+80+hh(x+2)*30,34+hh(x)*18)}}
function water(a,b){const w=PAL.wcol||['#3bb6d6','#0b4f6b','rgba(255,255,255,.65)'],top=GY+10,g=ctx.createLinearGradient(0,top,0,WH);g.addColorStop(0,w[0]);g.addColorStop(1,w[1]);ctx.fillStyle=g;ctx.fillRect(a-4,top,b-a+8,WH-top+60);
 if(PAL.lava){const gl=ctx.createLinearGradient(0,top-60,0,top);gl.addColorStop(0,'rgba(255,120,40,0)');gl.addColorStop(1,'rgba(255,120,40,.4)');ctx.fillStyle=gl;ctx.fillRect(a-4,top-60,b-a+8,60);
  ctx.fillStyle='rgba(255,230,150,.8)';for(let x=Math.floor(a/37)*37;x<b;x+=37){if(x<a)continue;const ph=(T*.02+hh(x))%1;circle(x+hh(x+5)*20,top+30-ph*28,2+3*(1-ph))}}
 ctx.strokeStyle=w[2];ctx.lineWidth=3;ctx.beginPath();for(let x=a-4;x<=b+4;x+=8){const y=top+Math.sin(x*.08+T*.08)*2.5;if(x===a-4)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke()}
function log(x,y,w,moving){const c=PAL.log;
 if(PAL.trunks&&!moving){ctx.fillStyle='#5b3a1e';ctx.fillRect(x+w/2-12,y+16,24,WH+60-y);ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(x+w/2,y+16,12,WH+60-y)}
 ctx.fillStyle=c[0];rr(x,y,w,22,11);ctx.fillStyle=c[1];rr(x+4,y+12,w-8,10,5);
 ctx.strokeStyle='rgba(30,20,10,.35)';ctx.lineWidth=2;ctx.beginPath();for(let k=x+22;k<x+w-20;k+=26){ctx.moveTo(k,y+7);ctx.lineTo(k+12,y+7)}ctx.stroke();
 if(PAL!==PALS.temple){ctx.fillStyle='#e0a868';ctx.beginPath();ctx.ellipse(x+w-7,y+11,6,10,0,0,6.2832);ctx.fill();ctx.strokeStyle='#a86f3c';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x+w-7,y+11,3,5.5,0,0,6.2832);ctx.stroke()}
 ctx.fillStyle=c[2];rr(x+3,y-4,w-14,9,4.5);
 if(moving){ctx.fillStyle='rgba(255,255,255,.55)';circle(x+w/2-8,y+11,2.5);circle(x+w/2,y+11,2.5);circle(x+w/2+8,y+11,2.5)}}
function sign(x,a,b){ctx.fillStyle='#6b4423';ctx.fillRect(x-4,GY-60,8,62);ctx.fillStyle='#d9a062';rr(x-62,GY-104,124,52,9);ctx.strokeStyle='#8a5a2e';ctx.lineWidth=3;rrp(x-62,GY-104,124,52,9);ctx.stroke();
 ctx.fillStyle='#3a2412';ctx.font="17px 'Lilita One',system-ui,sans-serif";ctx.textAlign='center';ctx.fillText(a,x,GY-82);ctx.fillText(b,x,GY-61)}
function lantern(x,g,on){
 if(on){const gl=ctx.createRadialGradient(x,g-60,4,x,g-60,70);gl.addColorStop(0,'rgba(255,214,110,.55)');gl.addColorStop(1,'rgba(255,214,110,0)');ctx.fillStyle=gl;ctx.fillRect(x-70,g-130,140,140)}
 ctx.fillStyle='#8c9692';rr(x-17,g-12,34,13,3);ctx.fillRect(x-5,g-46,10,36);rr(x-15,g-52,30,8,2);
 ctx.fillStyle=on?'#ffd36b':'#4f5856';ctx.fillRect(x-11,g-71,22,19);
 ctx.fillStyle='#8c9692';ctx.fillRect(x-12,g-71,5,19);ctx.fillRect(x+7,g-71,5,19);
 ctx.fillStyle='#737e7a';ctx.beginPath();ctx.moveTo(x-24,g-70);ctx.lineTo(x+24,g-70);ctx.lineTo(x+9,g-84);ctx.lineTo(x-9,g-84);ctx.closePath();ctx.fill();circle(x,g-87,4)}
function gate(){const x=GATE,g=GY;
 const gl=ctx.createRadialGradient(x,g-100,10,x,g-100,190);gl.addColorStop(0,'rgba(255,232,150,.5)');gl.addColorStop(1,'rgba(255,232,150,0)');ctx.fillStyle=gl;ctx.fillRect(x-200,g-300,400,300);
 ctx.fillStyle='#b8261d';rr(x-84,g-200,20,204,3);rr(x+64,g-200,20,204,3);
 ctx.fillStyle='#e8402f';ctx.fillRect(x-84,g-200,7,200);ctx.fillRect(x+64,g-200,7,200);
 ctx.fillStyle='#1d2033';rr(x-88,g-14,28,16,3);rr(x+60,g-14,28,16,3);
 ctx.fillStyle='#d8352a';ctx.fillRect(x-108,g-162,216,14);
 ctx.fillStyle='#c42d22';ctx.fillRect(x-102,g-204,204,15);
 ctx.fillStyle='#1d2033';ctx.beginPath();ctx.moveTo(x-134,g-232);ctx.quadraticCurveTo(x,g-206,x+134,g-232);ctx.lineTo(x+120,g-212);ctx.quadraticCurveTo(x,g-194,x-120,g-212);ctx.closePath();ctx.fill();
 rr(x-15,g-190,30,30,3);ctx.strokeStyle='#ffc928';ctx.lineWidth=2;rrp(x-10,g-185,20,20,2);ctx.stroke()}
function shuriken(x,y,R,a){ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.beginPath();for(let i=0;i<8;i++){const r=i%2?R*.34:R,t=i*Math.PI/4;ctx.lineTo(Math.cos(t)*r,Math.sin(t)*r)}ctx.closePath();ctx.fillStyle='#dfe6ea';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#4b5860';ctx.stroke();ctx.fillStyle='#4b5860';circle(0,0,R*.18);ctx.restore()}
function pouch(q){const y=q.y+Math.sin(T*.07+q.x)*4;ctx.fillStyle='rgba(255,255,255,.3)';circle(q.x,y,19);shuriken(q.x,y,13,T*.04)}
function coin(c){const s=Math.max(.2,Math.abs(Math.cos(T*.06+c.x*.013)));ctx.save();ctx.translate(c.x,c.y);ctx.scale(s,1);ctx.fillStyle='#d98a0b';circle(0,0,11);ctx.fillStyle='#ffc928';circle(0,0,8.4);ctx.fillStyle='#a8650a';ctx.fillRect(-3,-3,6,6);ctx.fillStyle='rgba(255,255,255,.75)';circle(-4.5,-4.5,1.8);ctx.restore()}
function heartItem(it){const y=it.y+it.dy+Math.sin(T*.08)*3;ctx.fillStyle='rgba(255,255,255,.3)';circle(it.x,y,19);ctx.fillStyle='#14110f';heartP(it.x,y+1,14);ctx.fillStyle='#ff3b30';heartP(it.x,y,11)}
function spikeShot(v){ctx.save();ctx.translate(v.x,v.y);ctx.rotate(Math.atan2(v.vy||0,v.vx));ctx.fillStyle='#1a0608';ctx.beginPath();ctx.moveTo(17,0);ctx.lineTo(-11,-6.5);ctx.lineTo(-7,0);ctx.lineTo(-11,6.5);ctx.closePath();ctx.fill();ctx.fillStyle=B&&B.phase===2?'#ff6a4d':'#efe3c2';ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-8,-4.5);ctx.lineTo(-5,0);ctx.lineTo(-8,4.5);ctx.closePath();ctx.fill();ctx.restore()}
function venom(v){ctx.fillStyle='#3d6b12';circle(v.x,v.y,8.5);ctx.fillStyle='#c6ff3d';circle(v.x,v.y,6.5);ctx.fillStyle='rgba(198,255,61,.5)';circle(v.x-v.vx*2,v.y+1,4);circle(v.x-v.vx*3.6,v.y+2,2.5);ctx.fillStyle='#fff';circle(v.x-2,v.y-2.5,1.8)}
