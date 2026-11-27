/* Drawing ninjas: Red Eye (fig/ninja), Master Fang, and the old evil ninjas. */
'use strict';
/* a ninja: Red Eye, Master Fang, or one of Fang's clan */
function fig(o){
 const cr=o.crouch,ink=o.ink,acc=o.acc;
 ctx.save();ctx.translate(o.x,o.fy);if(o.rot)ctx.rotate(o.rot);ctx.scale(o.face*o.s,o.s);
 const lh=cr?6:18,th=cr?18:26,ty=-(lh+th),hy=ty-6;
 ctx.fillStyle=ink;
 if(!o.on){rr(-11,-lh-4,9,lh,4);rr(2,-lh-1,9,lh,4)}
 else{const s=Math.abs(o.vx)>.3?Math.sin(o.run)*7:0;rr(-10+s,-lh,9,lh,4);rr(1-s,-lh,9,lh,4)}
 const fl=Math.sin(T*.25),sp=o.flap!=null?o.flap:Math.min(1,Math.abs(o.vx)/5.6+(o.on?0:.5)),hang=(1-sp)*12;
 ctx.strokeStyle=acc;ctx.lineWidth=4;ctx.lineCap='round';
 ctx.beginPath();ctx.moveTo(-11,hy-8);ctx.quadraticCurveTo(-24,hy-9+fl*3*sp,-34-sp*8,hy-6+fl*5*sp+hang);ctx.stroke();
 ctx.beginPath();ctx.moveTo(-11,hy-6);ctx.quadraticCurveTo(-21,hy-2-fl*2*sp,-28-sp*6,hy+2-fl*4*sp+hang);ctx.stroke();
 if(o.sw<=0||o.armed){ctx.strokeStyle='#4a3421';ctx.lineWidth=4.5;ctx.beginPath();ctx.moveTo(-5,ty+10);ctx.lineTo(-17,ty-23);ctx.stroke();ctx.strokeStyle='#ffc928';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-17,ty-12);ctx.lineTo(-8,ty-9);ctx.stroke()}
 ctx.fillStyle=ink;rr(-13,ty,26,th+2,8);
 ctx.fillStyle=acc;ctx.fillRect(-13,ty+th-9,26,5);
 if(o.armed){ctx.fillStyle='#ffc928';ctx.beginPath();ctx.moveTo(-2,ty+4);ctx.lineTo(4,ty+4);ctx.lineTo(1,ty+12);ctx.fill()}
 ctx.fillStyle=ink;circle(1,hy,14);
 ctx.fillStyle=o.skin;rr(1,hy-4,13,7,3.5);
 ctx.fillStyle=o.glow;circle(9,hy-.5,5.2);ctx.fillStyle=o.eye;circle(9,hy-.5,2.8);ctx.fillStyle='#fff';circle(9.9,hy-1.5,.9);
 if(o.armed){ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(5,hy+3);ctx.lineTo(8,hy+3);ctx.lineTo(6.5,hy+8);ctx.moveTo(10,hy+3);ctx.lineTo(13,hy+3);ctx.lineTo(11.5,hy+8);ctx.fill()}
 ctx.fillStyle=acc;rr(-13,hy-12,27,5,2.5);
 let ang=null;const ax=5,ay=ty+8;
 if(o.sw>0){const k=1-o.sw/16;ang=-2.1+k*3;
  if(o.sw>=3&&o.sw<=13){ctx.lineCap='butt';ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=10;ctx.beginPath();ctx.arc(ax,ay,42,-2.1,ang);ctx.stroke();ctx.strokeStyle=o.slash||'rgba(160,225,255,.55)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(ax,ay,50,-2,ang);ctx.stroke()}}
 else if(o.raise)ang=-1.57;else if(o.ready)ang=-2.4;else if(o.armed)ang=.8;
 if(ang!==null){ctx.translate(ax,ay);ctx.rotate(ang);ctx.fillStyle=ink;rr(-2,-4,16,8,4);ctx.lineCap='round';ctx.strokeStyle='#4a3421';ctx.lineWidth=4.5;ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(20,0);ctx.stroke();
  ctx.strokeStyle='#ffc928';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(20,-5);ctx.lineTo(20,5);ctx.stroke();if(o.thunder){ctx.strokeStyle='rgba(120,220,255,.55)';ctx.lineWidth=11;ctx.beginPath();ctx.moveTo(22,0);ctx.lineTo(60,0);ctx.stroke()}
  ctx.strokeStyle=o.thunder?'#f4fdff':'#eef4f7';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(22,0);ctx.lineTo(58,0);ctx.stroke();
  if(o.thunder){ctx.strokeStyle='#fff59d';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(24,0);for(let k=1;k<=6;k++)ctx.lineTo(24+k*6,(k%2?-1:1)*(2+(T+k)%3));ctx.stroke()}
  if(o.raise){ctx.fillStyle=o.thunder?'rgba(150,230,255,.65)':'rgba(199,162,255,.5)';circle(60,0,12+Math.sin(T*.4)*4);ctx.fillStyle='#fff';circle(60,0,4)}}
 else if(o.stcd>8){ctx.fillStyle=ink;rr(2,ty+5,22,8,4)}
 else{ctx.fillStyle=o.arm;rr(-4,ty+5,9,th-7,4.5)}
 ctx.restore()}
function ninja(){const cx=p.x+p.w/2,fy=p.y+p.h;
 ctx.save();let a=1;if(p.hidden)a=.55;if(p.inv>0&&!p.dead&&(T>>2)%2)a*=.35;if(p.dead)a=Math.max(0,p.dead/45);ctx.globalAlpha=a;
 if(p.on){ctx.fillStyle='rgba(0,0,0,.22)';ell(cx,fy+1,17,4)}
 fig({x:cx,fy,face:p.face,s:1,crouch:p.crouch,on:p.on||p.dead>0,run:p.run,vx:p.vx,sw:p.sw,stcd:p.stcd,thunder:true,raise:p.sup>0,slash:'rgba(255,245,157,.85)',ink:'#1d2033',arm:'#2b3049',acc:'#e8302a',eye:'#ff2a2a',glow:'rgba(255,50,40,.35)',skin:'#f4c99b'});
 if(p.frozen>0){const top=fy-p.h-12,j=Math.sin(T*1.7)*(p.frozen<20?1.5:0);ctx.globalAlpha=1;ctx.fillStyle='rgba(170,225,255,.5)';rr(cx-25+j,top,50,p.h+14,9);ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=2.5;rrp(cx-25+j,top,50,p.h+14,9);ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx-16+j,top+10);ctx.lineTo(cx-8+j,top+22);ctx.moveTo(cx+10+j,top+p.h-6);ctx.lineTo(cx+16+j,top+p.h+2);ctx.stroke()}
 ctx.restore()}
function nunchuck(s){const sp=s.atk>0,d=s.dir,hx=s.x+d*(sp?24:5),hy=s.y-(sp?36:22),a=sp?T*.7:1.25+Math.sin(s.t*.12)*.35;
 const x1=hx+Math.cos(a)*16*d,y1=hy+Math.sin(a)*16,a2=sp?a+1.1:1.5+Math.sin(s.t*.12+1)*.3,x2=x1+Math.cos(a2)*6*d,y2=y1+Math.sin(a2)*6,a3=sp?a+.35:a2,x3=x2+Math.cos(a3)*18*d,y3=y2+Math.sin(a3)*18;
 if(sp&&s.atk>=4&&s.atk<=24){ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=8;ctx.beginPath();ctx.arc(hx,hy,40,0,6.2832);ctx.stroke()}
 ctx.lineCap='round';ctx.strokeStyle='#6b3d1a';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(x1,y1);ctx.stroke();
 ctx.strokeStyle='#c9ced6';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
 ctx.strokeStyle='#6b3d1a';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x3,y3);ctx.stroke();
 ctx.fillStyle='#ffd23f';circle(x3,y3,2.3);circle(hx,hy,2.3)}
function evilNinja(s){ctx.save();if(PAL.dark){const g=ctx.createRadialGradient(s.x,s.y-30,4,s.x,s.y-30,80);g.addColorStop(0,'rgba(199,162,255,.3)');g.addColorStop(1,'rgba(199,162,255,0)');ctx.fillStyle=g;ctx.fillRect(s.x-80,s.y-110,160,160)}if(s.inv>0&&(s.inv>>2)%2)ctx.globalAlpha=.45;ctx.fillStyle='rgba(0,0,0,.22)';ell(s.x,s.y+1,17,4);
 const th=s.type===5,nc=s.type===6,sword=!th&&!nc;fig({x:s.x,fy:s.y,face:s.dir,s:1.05,crouch:false,on:true,run:s.t*.32,vx:s.moving?3:0,sw:sword&&s.atk>0&&s.atk<=16?s.atk:0,ready:sword&&s.atk>16,stcd:!sword&&s.atk>0?12:0,armed:sword,ink:nc?'#2b6b3a':'#33303f',arm:nc?'#3a8a4c':'#45405a',acc:th?'#ff6b5e':nc?'#ffd23f':'#8f5ee0',eye:nc?'#ff3b30':'#ffe14d',glow:nc?'rgba(255,60,40,.4)':'rgba(255,225,77,.4)',skin:'#cdbfa3',slash:'rgba(199,162,255,.7)'});
 if(nc)nunchuck(s);
 if(th?s.atk>0:nc?s.atk>24:s.atk>16){ctx.font="28px 'Lilita One',system-ui,sans-serif";ctx.textAlign='center';ctx.lineJoin='round';ctx.lineWidth=5;ctx.strokeStyle='#14110f';ctx.strokeText('!',s.x,s.y-82);ctx.fillStyle='#ff6b5e';ctx.fillText('!',s.x,s.y-82)}
 ctx.restore()}
function duelFang(){const b=B;if(b.gone)return;const ph2=b.phase===2;
 ctx.save();if(b.inv>0&&(b.inv>>2)%2)ctx.globalAlpha=.45;
 if(PAL.dark){const g=ctx.createRadialGradient(b.x,b.y-36,4,b.x,b.y-36,90);g.addColorStop(0,'rgba(199,162,255,.3)');g.addColorStop(1,'rgba(199,162,255,0)');ctx.fillStyle=g;ctx.fillRect(b.x-90,b.y-126,180,180)}
 if(b.on){ctx.fillStyle='rgba(0,0,0,.25)';ell(b.x,GY+1,20,5)}
 if(b.st==='dash'){ctx.fillStyle='rgba(199,162,255,.25)';for(let i=1;i<4;i++)ell(b.x-b.dir*i*18,b.y-38,14,30)}
 fig({x:b.x,fy:b.y,face:b.dir,s:1.15,crouch:(b.st==='leap'&&b.t>30)||b.st==='stuck',on:b.on,run:b.tick*.35,vx:b.moving?4:0,sw:b.sw,stcd:0,raise:b.raise,ready:b.st==='dashwind'||(b.st==='slash'&&b.t>14),armed:true,ink:'#2a1640',arm:'#3a2258',acc:'#3fd16b',eye:ph2?'#ff3b30':'#ffe14d',glow:ph2?'rgba(255,60,40,.45)':'rgba(255,225,77,.35)',skin:'#d9c9a8',slash:'rgba(199,162,255,.7)'});
 if(b.st==='tired'||b.st==='stuck'){ctx.fillStyle='#ffe14d';for(let i=0;i<3;i++){const a=b.tick*.12+i*2.094;star5(b.x+Math.cos(a)*22,b.y-88+Math.sin(a)*6,6)}}
 if(b.st==='dashwind'||(b.st==='leap'&&b.t>30)){ctx.font="30px 'Lilita One',system-ui,sans-serif";ctx.textAlign='center';ctx.lineJoin='round';ctx.lineWidth=5;ctx.strokeStyle='#14110f';ctx.strokeText('!',b.x,b.y-98);ctx.fillStyle='#ff6b5e';ctx.fillText('!',b.x,b.y-98)}
 ctx.restore()}
function fang(){const b=B,ang=b.phase===2;
 const o={face:-1,s:1.15,crouch:false,on:true,run:0,vx:0,flap:.7,sw:b.sw,stcd:0,raise:b.raise,ready:b.st==='wave'&&b.sw<=0&&b.t>0,armed:true,ink:'#2a1640',arm:'#3a2258',acc:'#3fd16b',eye:ang?'#ff3b30':'#ffe14d',glow:ang?'rgba(255,60,40,.45)':'rgba(255,225,77,.35)',skin:'#d9c9a8',slash:'rgba(199,162,255,.7)'};
 if(b.st==='defeat'){o.x=b.fx;o.fy=b.fy;o.rot=b.fr;o.on=false}else{o.x=b.hx+6;o.fy=b.hy-40}
 ctx.save();if(b.inv>0&&(b.inv>>2)%2)ctx.globalAlpha=.45;fig(o);ctx.restore()}
