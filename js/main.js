/* Screen size, HUD, the main loop, keyboard, touch and game-controller input, buttons and start-up. */
'use strict';
/* ---------- screen, HUD, loop ---------- */
function resize() {
  cw = cv.clientWidth || innerWidth;
  ch = cv.clientHeight || innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(cw * dpr);
  cv.height = Math.round(ch * dpr);
  sc = Math.min(ch / WH, cw / 600);
  offY = ch - WH * sc;
  viewW = cw / sc;
  TOP = -offY / sc;
}
const HE = [...document.querySelectorAll('#hearts svg')];
let hk = '';
function hud() {
  const bn = BN.t > 0 && mode === 'play',
    k =
      p.hearts +
      '|' +
      p.coins +
      '|' +
      p.ammo +
      '|' +
      (B ? B.hp : -1) +
      '|' +
      bn +
      '|' +
      li +
      '|' +
      boss +
      '|' +
      Math.floor(p.sp || 0);
  if (k === hk) return;
  hk = k;
  HE.forEach((h, i) => h.classList.toggle('off', i >= p.hearts));
  $('hc').textContent = p.coins;
  $('ha').textContent = p.ammo;
  const sp = p.sp || 0;
  $('supfill').style.width = sp + '%';
  $('sup').classList.toggle('full', sp >= 100);
  $('bU').classList.toggle('ready', sp >= 100);
  $('bV').classList.toggle('ready', sp >= 100);
  $('lvtag').textContent = boss
    ? B && B.cfg.final
      ? 'Final boss'
      : B && B.cfg.rider
        ? 'Master Fang'
        : B && B.cfg.duel
          ? 'Boss duel'
          : 'Mini-boss'
    : 'Level ' + (li + 1);
  if (B) $('bossfill').style.width = Math.max(0, (B.hp / B.max) * 100) + '%';
  $('banner').hidden = !bn;
}
let last = performance.now(),
  acc = 0;
function frame(now) {
  pollPad();
  acc += Math.min(100, now - last);
  last = now;
  while (acc >= STEP) {
    step();
    acc -= STEP;
  }
  render();
  hud();
  requestAnimationFrame(frame);
}

/* ---------- controls ---------- */
function press(k) {
  if (p && p.frozen > 0 && mode === 'play') {
    p.frozen = Math.max(1, p.frozen - 7);
    sparkle(p.x + 17, p.y + 20);
    return;
  }
  if (k === 'J') jb = touchAssist ? 12 : 8; // a jump pressed just before landing still happens (longer on touch)
  if (k === 'S') swReq = 6;
  if (k === 'T') stReq = 6;
  if (k === 'U') suReq = 1;
  if (k === 'V') clReq = 1;
}
function newGame() {
  p = null;
  mode = 'title';
  startLevel(0);
}
function retry() {
  if (boss) {
    startBoss(bk);
    return;
  }
  initAudio();
  p.hearts = 6;
  p.ammo = Math.max(p.ammo, 3);
  respawnAt(p.cp.x, p.cp.y);
  go('play');
}
function pause() {
  if (mode !== 'play') return;
  $('pC').textContent = p.coins;
  go('paused');
}
function resume() {
  initAudio();
  go('play');
}
function primary() {
  if (mode === 'title' && readSave()) continueGame();
  else if (mode === 'title' || mode === 'champ') newGame();
  else if (mode === 'win') nextFromWin();
  else if (mode === 'over') retry();
  else if (mode === 'paused') resume();
}
const KM = {
  ArrowLeft: 'L',
  KeyA: 'L',
  ArrowRight: 'R',
  KeyD: 'R',
  ArrowDown: 'D',
  KeyS: 'D',
  Space: 'J',
  ArrowUp: 'J',
  KeyW: 'J',
  KeyZ: 'S',
  KeyJ: 'S',
  KeyX: 'T',
  KeyK: 'T',
  KeyC: 'U',
  KeyL: 'U',
  KeyV: 'V',
};
addEventListener('keydown', e => {
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (mode === 'play') pause();
    else if (mode === 'paused') resume();
    return;
  }
  if ((e.code === 'Enter' || e.code === 'Space') && mode !== 'play') {
    e.preventDefault();
    primary();
    return;
  }
  const k = KM[e.code];
  if (!k) return;
  e.preventDefault();
  if (e.repeat) return;
  touchAssist = false;
  key[k] = 1;
  press(k);
});
addEventListener('keyup', e => {
  const k = KM[e.code];
  if (k) key[k] = 0;
});
addEventListener('blur', () => releaseAll());
/* ---------- touch pads ----------
   Each pad is one big touch area, so a thumb never lands on a dead spot, and a thumb can slide onto another
   button without lifting: the button under it takes over.
   Left pad, like a d-pad: which side of the pad the thumb is on picks Left or Right, and pulling it down to the
   Sneak row adds Sneak. So sliding along the arrows never sneaks, and one thumb can sneak-walk (down + a side).
   Right pad: the nearest button wins, and the spot between Sword and Jump does both (an air attack, one thumb). */
const PADS = [$('padL'), $('padR')];
const thumbs = new Map(); // finger (pointerId) -> the keys it is holding
let thumbOn = new Set(); // keys held by any finger, to notice new presses
const centre = b => {
  const r = b.getBoundingClientRect();
  return { k: b.dataset.k, x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 };
};
function leftKeys(x, y) {
  const [L, D, R] = ['L', 'D', 'R'].map(k => centre(PADS[0].querySelector(`[data-k=${k}]`)));
  const mid = (L.x + R.x) / 2,
    side = ((R.x - L.x) / 2) * 0.25, // a narrow middle strip between the arrows means "don't run"
    keys = new Set();
  if (x < mid - side) keys.add('L');
  if (x > mid + side) keys.add('R');
  if (y > (L.y + D.y) / 2) keys.add('D');
  return keys;
}
function rightKeys(x, y) {
  const near = [...PADS[1].querySelectorAll('.b')]
    .map(centre)
    .map(c => ({ ...c, d: Math.hypot(x - c.x, y - c.y) }))
    .sort((a, b) => a.d - b.d);
  const keys = new Set([near[0].k]);
  const pair = near[0].k + near[1].k;
  if ((pair === 'SJ' || pair === 'JS') && near[1].d - near[0].d < Math.min(near[0].r, near[1].r) * 0.45)
    keys.add(near[1].k);
  return keys;
}
function syncThumbs() {
  const on = new Set();
  for (const ks of thumbs.values()) for (const k of ks) on.add(k);
  for (const k of on) if (!thumbOn.has(k)) press(k);
  thumbOn = on;
  for (const k of 'LRDJSTUV') tch[k] = on.has(k) ? 1 : 0;
  for (const b of document.querySelectorAll('.pad .b')) b.classList.toggle('on', on.has(b.dataset.k));
}
PADS.forEach((pad, i) => {
  const keysAt = e => (i ? rightKeys : leftKeys)(e.clientX, e.clientY);
  pad.addEventListener('pointerdown', e => {
    e.preventDefault();
    try {
      pad.setPointerCapture(e.pointerId);
    } catch (_) {}
    touchAssist = true;
    thumbs.set(e.pointerId, keysAt(e));
    syncThumbs();
    initAudio();
  });
  pad.addEventListener('pointermove', e => {
    if (!thumbs.has(e.pointerId)) return;
    thumbs.set(e.pointerId, keysAt(e));
    syncThumbs();
  });
  const up = e => {
    thumbs.delete(e.pointerId);
    syncThumbs();
  };
  pad.addEventListener('pointerup', up);
  pad.addEventListener('pointercancel', up);
  pad.addEventListener('lostpointercapture', up);
});

/* ---------- game controllers: Bluetooth Xbox or PlayStation pads, read with the Gamepad API ----------
   A / Cross jump, X / Square sword, B / Circle star, Y / Triangle Thunder Strike, LB RB / L1 R1 Shadow Clones,
   d-pad or left stick to run, down to sneak. Start / Options pauses; on a menu, A or Start picks. */
const GP = { 0: 'J', 1: 'T', 2: 'S', 3: 'U', 4: 'V', 5: 'V', 12: 'J', 13: 'D', 14: 'L', 15: 'R' };
let gpBefore = [];
function pollPad() {
  const pad = [...(navigator.getGamepads ? navigator.getGamepads() : [])].find(g => g && g.connected);
  if (!pad) return;
  const now = pad.buttons.map(b => b.pressed),
    ax = pad.axes[0] || 0,
    ay = pad.axes[1] || 0,
    want = {};
  for (const [i, k] of Object.entries(GP)) if (now[i]) want[k] = 1;
  if (ax < -0.5) want.L = 1;
  if (ax > 0.5) want.R = 1;
  if (ay > 0.6) want.D = 1;
  if (now.some(Boolean) || Math.abs(ax) > 0.5 || ay > 0.6) {
    document.documentElement.classList.add('gamepad'); // the touch buttons get out of the way
    touchAssist = false;
  }
  const before = gpBefore;
  gpBefore = now;
  const fresh = i => now[i] && !before[i]; // pressed since the last poll
  if (fresh(9)) {
    if (mode === 'play') pause();
    else primary();
    return;
  }
  if (mode !== 'play') {
    if (fresh(0)) primary();
    return;
  }
  for (const k of 'LRDJSTUV') {
    if (want[k] && !gp[k]) press(k);
    gp[k] = want[k] ? 1 : 0;
  }
}
/* let go of every key and button, e.g. when switching apps on the iPad, so Red Eye doesn't keep running */
function releaseAll() {
  for (const k in key) key[k] = 0;
  for (const k in gp) gp[k] = 0;
  thumbs.clear();
  syncThumbs();
}
addEventListener(
  'touchstart',
  () => {
    document.documentElement.classList.add('touch');
    document.documentElement.classList.remove('gamepad');
  },
  { passive: true },
);
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    releaseAll();
    pause();
    if (mode !== 'win') saveGame(); // on the win screen the save already points at the next level
  }
});
$('goT').onclick = newGame;
$('goCont').onclick = continueGame;
$('goN').onclick = newGame;
document.querySelectorAll('.chip').forEach(c =>
  c.addEventListener('click', () => {
    if (c.disabled) return;
    const i = +c.dataset.i;
    p = null;
    mode = 'title';
    startLevel(i);
  }),
);
$('goO').onclick = retry;
$('goW').onclick = nextFromWin;
$('goW2').onclick = () => startLevel(li);
$('goC').onclick = toTitle;
$('goP').onclick = resume;
$('goQ').onclick = toTitle;
$('pz').onclick = () => {
  if (mode === 'play') pause();
  else if (mode === 'paused') resume();
};
$('snd').onclick = () => {
  muted = !muted;
  try {
    localStorage.setItem('redeye-mute', muted ? '1' : '0');
  } catch (e) {}
  setSnd();
  initAudio();
};

/* ---------- start-up ---------- */
load(L1);
resize();
const ro = new ResizeObserver(resize);
ro.observe(cv);
/* test hook for the tests in tests/: only when the page is opened with ?test from this computer (file:// or localhost), never on the live site */
const local = location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
if (local && /[?&]test\b/.test(location.search))
  window.__t = {
    get p() {
      return p;
    },
    get snakes() {
      return snakes;
    },
    get B() {
      return B;
    },
    get mode() {
      return mode;
    },
    get li() {
      return li;
    },
    get lit() {
      return lit;
    },
    get coins() {
      return coins;
    },
    get LT() {
      return LT;
    },
    get spits() {
      return spits;
    },
    get waves() {
      return waves;
    },
    key,
    tch,
    gp,
    pollPad,
    LEVELS,
    BOSSES,
    PALS,
    mkSnake,
    startLevel,
    startBoss,
    respawnAt,
    bossHit,
    unlocked,
    step,
    draw() {
      render();
      hud();
    },
  };
toTitle();
requestAnimationFrame(frame);
