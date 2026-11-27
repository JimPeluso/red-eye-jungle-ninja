/* Sound effects, made with the Web Audio API (no sound files). */
'use strict';
/* ---------- sound ---------- */
let ac = null,
  nb = null,
  muted = false;
try {
  muted = localStorage.getItem('redeye-mute') === '1';
} catch (e) {}
function initAudio() {
  try {
    if (!ac) {
      const A = window.AudioContext || window.webkitAudioContext;
      if (A) ac = new A();
    }
    if (ac && ac.state === 'suspended') ac.resume();
  } catch (e) {}
}
function tone(f, d, type, v, f2, at) {
  if (!ac || muted) return;
  try {
    const t = ac.currentTime + (at || 0),
      o = ac.createOscillator(),
      g = ac.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(v || 0.06, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g);
    g.connect(ac.destination);
    o.start(t);
    o.stop(t + d + 0.05);
  } catch (e) {}
}
function noise(d, v, f) {
  if (!ac || muted) return;
  try {
    if (!nb) {
      nb = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
      const a = nb.getChannelData(0);
      for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1;
    }
    const t = ac.currentTime,
      s = ac.createBufferSource(),
      fl = ac.createBiquadFilter(),
      g = ac.createGain();
    s.buffer = nb;
    fl.type = 'bandpass';
    fl.frequency.setValueAtTime(f, t);
    fl.frequency.exponentialRampToValueAtTime(f * 3, t + d);
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(fl);
    fl.connect(g);
    g.connect(ac.destination);
    s.start(t);
    s.stop(t + d + 0.05);
  } catch (e) {}
}
const sfx = {
  jump: () => tone(280, 0.16, 'square', 0.05, 620),
  coin: () => {
    tone(988, 0.06, 'square', 0.045);
    tone(1319, 0.14, 'square', 0.045, 0, 0.06);
  },
  swish: () => noise(0.16, 0.25, 700),
  toss: () => {
    noise(0.1, 0.15, 1800);
    tone(900, 0.08, 'triangle', 0.04, 1400);
  },
  pop: () => {
    tone(220, 0.18, 'sawtooth', 0.05, 60);
    noise(0.15, 0.2, 400);
  },
  hurt: () => tone(330, 0.3, 'sawtooth', 0.07, 110),
  hiss: () => noise(0.35, 0.12, 3000),
  spit: () => {
    noise(0.12, 0.15, 2400);
    tone(600, 0.1, 'triangle', 0.04, 300);
  },
  ice: () => {
    tone(1800, 0.12, 'triangle', 0.04, 2600);
    tone(2400, 0.18, 'sine', 0.03, 1200, 0.05);
  },
  thunder: () => {
    noise(0.15, 0.3, 3000);
    noise(0.7, 0.35, 110);
    tone(70, 0.6, 'sawtooth', 0.1, 38);
  },
  chime: () => {
    tone(784, 0.12, 'triangle', 0.07);
    tone(1047, 0.12, 'triangle', 0.07, 0, 0.09);
    tone(1319, 0.25, 'triangle', 0.07, 0, 0.18);
  },
  empty: () => tone(160, 0.08, 'square', 0.04),
  win: () => {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i === 5 ? 0.5 : 0.14, 'square', 0.05, 0, i * 0.13));
  },
  roar: () => {
    tone(130, 0.6, 'sawtooth', 0.08, 55);
    noise(0.55, 0.18, 260);
  },
  thud: () => {
    tone(90, 0.25, 'sine', 0.16, 40);
    noise(0.2, 0.2, 200);
  },
  lunge: () => noise(0.25, 0.2, 500),
  clang: () => {
    tone(1400, 0.1, 'square', 0.035);
    tone(2100, 0.18, 'triangle', 0.04);
  },
  whoosh: () => noise(0.3, 0.18, 900),
  rustle: () => noise(0.5, 0.1, 1500),
  bossHit: () => {
    tone(520, 0.12, 'square', 0.06, 200);
    noise(0.12, 0.2, 1500);
  },
};
/* the icons are <svg>, which has no .hidden property, so set the attribute itself */
function setSnd() {
  $('sOn').toggleAttribute('hidden', muted);
  $('sOff').toggleAttribute('hidden', !muted);
  $('snd').setAttribute('aria-pressed', String(muted));
}
setSnd();
