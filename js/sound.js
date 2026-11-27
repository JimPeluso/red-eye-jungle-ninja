/* Sound effects, made with the Web Audio API (no sound files). */
/* ---------- sound ---------- */
let ac=null,nb=null,muted=false;
try{muted=localStorage.getItem('redeye-mute')==='1'}catch(e){}
function initAudio(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(A)ac=new A()}if(ac&&ac.state==='suspended')ac.resume()}catch(e){}}
function tone(f,d,type,v,f2,at){if(!ac||muted)return;try{const t=ac.currentTime+(at||0),o=ac.createOscillator(),g=ac.createGain();o.type=type||'square';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(v||.06,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.05)}catch(e){}}
function noise(d,v,f){if(!ac||muted)return;try{if(!nb){nb=ac.createBuffer(1,ac.sampleRate*.5,ac.sampleRate);const a=nb.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1}const t=ac.currentTime,s=ac.createBufferSource(),fl=ac.createBiquadFilter(),g=ac.createGain();s.buffer=nb;fl.type='bandpass';fl.frequency.setValueAtTime(f,t);fl.frequency.exponentialRampToValueAtTime(f*3,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(fl);fl.connect(g);g.connect(ac.destination);s.start(t);s.stop(t+d+.05)}catch(e){}}
const sfx={
 jump:()=>tone(280,.16,'square',.05,620),
 coin:()=>{tone(988,.06,'square',.045);tone(1319,.14,'square',.045,0,.06)},
 swish:()=>noise(.16,.25,700),
 toss:()=>{noise(.1,.15,1800);tone(900,.08,'triangle',.04,1400)},
 pop:()=>{tone(220,.18,'sawtooth',.05,60);noise(.15,.2,400)},
 hurt:()=>tone(330,.3,'sawtooth',.07,110),
 hiss:()=>noise(.35,.12,3000),
 spit:()=>{noise(.12,.15,2400);tone(600,.1,'triangle',.04,300)},
 ice:()=>{tone(1800,.12,'triangle',.04,2600);tone(2400,.18,'sine',.03,1200,.05)},
 thunder:()=>{noise(.15,.3,3000);noise(.7,.35,110);tone(70,.6,'sawtooth',.1,38)},
 chime:()=>{tone(784,.12,'triangle',.07);tone(1047,.12,'triangle',.07,0,.09);tone(1319,.25,'triangle',.07,0,.18)},
 empty:()=>tone(160,.08,'square',.04),
 win:()=>{[523,659,784,1047,784,1047].forEach((f,i)=>tone(f,i===5?.5:.14,'square',.05,0,i*.13))},
 roar:()=>{tone(130,.6,'sawtooth',.08,55);noise(.55,.18,260)},
 thud:()=>{tone(90,.25,'sine',.16,40);noise(.2,.2,200)},
 lunge:()=>noise(.25,.2,500),
 clang:()=>{tone(1400,.1,'square',.035);tone(2100,.18,'triangle',.04)},
 whoosh:()=>noise(.3,.18,900),
 bossHit:()=>{tone(520,.12,'square',.06,200);noise(.12,.2,1500)}
};
function setSnd(){$('sOn').hidden=muted;$('sOff').hidden=!muted}
setSnd();
