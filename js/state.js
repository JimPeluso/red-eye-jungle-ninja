/* Game state, small helpers, mkSnake(), starting levels and bosses, screens and level unlocks. */
'use strict';
/* ---------- state ---------- */
let p = null,
  B = null,
  bolts = [],
  flash = 0,
  suReq = 0,
  clones = [],
  cloneT = 0,
  clReq = 0,
  coins,
  snakes,
  stars,
  waves,
  spits,
  items,
  parts,
  pops,
  lit,
  pouches,
  mode = 'title',
  T = 0,
  cam = 0,
  shake = 0,
  sc = 1,
  offY = 0,
  viewW = 800,
  TOP = 0,
  cw = 1,
  ch = 1,
  dpr = 1,
  jb = 0,
  swReq = 0,
  stReq = 0,
  BN = { t: 0 };
/* What's held down right now, per input: keyboard keys, touch buttons and a game controller (main.js fills them).
   touchAssist: the last input was a touch, so jumping is a little more forgiving (see step.js and press()). */
const key = {},
  tch = {},
  gp = {};
let touchAssist = false;
const held = k => !!(key[k] || tch[k] || gp[k]);
const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const inGrass = x => GRASS.some(g => x > g[0] && x < g[1]);
const segAt = x => SEGS.find(s => x + 34 > s[0] && x < s[1]) || SEGS[0];
const pp = (q, t) => {
  if (!q[3] && !q[4]) return { x: q[0], y: q[1] };
  const a = (t * 6.2832) / (q[5] || 240) + (q[6] || 0);
  return { x: q[0] + (q[3] || 0) * Math.sin(a), y: q[1] + (q[4] || 0) * Math.sin(a) };
};
function camRange() {
  if (boss) {
    if (viewW >= ARENA) {
      const c = (ARENA - viewW) / 2;
      return [c, c];
    }
    return [0, ARENA - viewW];
  }
  return [0, Math.max(0, END + 260 - viewW)];
}
const clampCam = v => {
  const r = camRange();
  return Math.max(r[0], Math.min(r[1], v));
};
const rnd = (a, b) => a + Math.random() * (b - a);
const mkSnake = ([x, a, b, y, sp, k0], i) => {
  const k = k0 >= 4 && k0 <= 6 ? [3, 2, 0][k0 - 4] : k0;
  return {
    x,
    a,
    b,
    y,
    sp,
    type: k >= 7 && k <= 10 ? 0 : k || 0,
    fly: k === 8,
    two: k === 9,
    rock: k === 10,
    rk: 0,
    bite: 0,
    bdir: 1,
    home: y,
    ty: y,
    ice: false,
    frost: false,
    sleep: k === 1,
    alive: true,
    dir: -1,
    t: i * 37,
    alert: 0,
    dy: 0,
    vy: 0,
    hp: k === 2 || k === 3 || k === 9 || k === 10 ? 2.2 : 1,
    mhp: k === 2 || k === 3 || k === 9 || k === 10 ? 2.2 : 1,
    inv: 0,
    cd: 40 + i * 17,
    spit: 0,
    atk: 0,
    cs: 0,
    ct: 0,
    rear: 0,
    moving: false,
    ...(k === 8 ? { y: y - 110 } : {}),
  };
};
function newPlayer() {
  return {
    x: 110,
    y: GY - 56,
    vx: 0,
    vy: 0,
    w: 34,
    h: 56,
    face: 1,
    on: true,
    plat: null,
    seg: SEGS[0],
    crouch: false,
    hidden: false,
    coy: 0,
    sw: 0,
    swcd: 0,
    stcd: 0,
    inv: 0,
    run: 0,
    hearts: 6,
    ammo: 5,
    sp: 0,
    sup: 0,
    coins: 0,
    kills: 0,
    sneaks: 0,
    cp: { x: 110, y: GY },
    safe: { x: 110, y: GY, seg: SEGS[0] },
    time: 0,
    lt: 0,
    dead: 0,
  };
}
function clearFx() {
  stars = [];
  waves = [];
  spits = [];
  items = [];
  parts = [];
  pops = [];
  shake = 0;
  jb = swReq = stReq = suReq = clReq = 0;
  bolts = [];
  flash = 0;
  clones = [];
  cloneT = 0;
}
function keepStats() {
  return p && mode !== 'title'
    ? {
        coins: p.coins,
        kills: p.kills,
        sneaks: p.sneaks,
        time: p.time,
        lt: p.lt,
        sp: p.sp || 0,
        ammo: Math.max(5, p.ammo),
      }
    : null;
}
function setLevel(i) {
  li = i;
  boss = false;
  B = null;
  const L = LEVELS[i];
  load(L);
  document.body.dataset.lv = 'lvl';
  p = newPlayer();
  coins = L.coins.map(([x, y]) => ({ x, y, got: false }));
  snakes = L.sn.map(mkSnake);
  pouches = L.pouch.map(([x, y]) => ({ x, y, got: false }));
  lit = LANT.map(() => false);
  clearFx();
  items = LANT.map(l => ({ x: l[0] + 50, y: l[1] - 30, dy: 0, vy: 0, got: false }));
  LT = 0;
  cam = 0;
}
function startLevel(i) {
  initAudio();
  const k = keepStats();
  setLevel(i);
  if (k) Object.assign(p, k);
  p.lt = 0;
  hk = '';
  go('play');
  showBanner('Level ' + (i + 1), LEVELS[i].name, '', false);
  saveGame();
}
function startBoss(n) {
  initAudio();
  const k = keepStats();
  bk = n;
  const cfg = BOSSES[n];
  load(arena(n));
  boss = true;
  document.body.dataset.lv = 'boss';
  p = newPlayer();
  if (k) Object.assign(p, k);
  p.x = 120;
  p.cp = { x: 120, y: GY };
  p.safe = { x: 120, y: GY, seg: SEGS[0] };
  p.ammo = Math.max(8, p.ammo);
  coins = [];
  snakes = [];
  pouches = [];
  lit = [];
  clearFx();
  LT = 0;
  B = {
    cfg,
    col: cfg.col,
    hp: cfg.hp,
    max: cfg.hp,
    hx: 990,
    hy: GY - 130,
    from: 0,
    to: 0,
    st: 'intro',
    t: 120,
    inv: 0,
    sw: 0,
    raise: 0,
    phase: 1,
    count: 0,
    tick: 0,
    fx: 0,
    fy: 0,
    fvy: 0,
    fr: 0,
    x: 1000,
    y: GY,
    dir: -1,
    vy: 0,
    on: true,
    moving: false,
    summoned: false,
    gone: false,
    lx: 0,
  };
  $('bossName').textContent = cfg.name;
  $('bossfill').style.background = 'linear-gradient(' + cfg.col.h + ',' + cfg.col.a + ')';
  cam = clampCam(p.x + 17 - viewW * 0.45);
  hk = '';
  go('play');
  showBanner(
    cfg.final ? 'Final battle' : cfg.rider ? 'Boss battle' : cfg.duel ? 'Boss duel' : 'Mini-boss',
    cfg.name,
    cfg.sub,
    true,
  );
  sfx.roar();
  saveGame();
}
function toTitle() {
  p = null;
  setLevel(0);
  go('title');
}
function respawnAt(x, y) {
  y = y || GY;
  p.crouch = false;
  p.h = 56;
  p.x = x;
  p.y = y - 56;
  p.vx = 0;
  p.vy = 0;
  p.on = true;
  p.plat = null;
  p.seg = segAt(x);
  p.safe = { x, y, seg: p.seg };
  p.inv = 90;
  p.dead = 0;
  p.frozen = 0;
  cam = clampCam(x + 17 - viewW * 0.4);
}
function go(m) {
  mode = m;
  document.body.dataset.mode = m;
  for (const id of ['title', 'over', 'win', 'paused', 'champ']) $(id).hidden = id !== m;
  if (m === 'title') {
    chips();
    showContinue();
  }
}
function showBanner(s, b, u, isBoss) {
  BN = { t: 140 };
  $('bnS').textContent = s;
  $('bnB').textContent = b;
  $('bnU').textContent = u;
  $('bnU').hidden = !u;
  $('banner').classList.toggle('boss', isBoss);
}
function unlocked() {
  try {
    return Math.max(0, Math.min(LEVELS.length - 1, parseInt(localStorage.getItem('redeye-unlock'), 10) || 0));
  } catch (e) {
    return 0;
  }
}
function unlock(n) {
  try {
    if (n > unlocked()) localStorage.setItem('redeye-unlock', String(n));
  } catch (e) {}
}
function chips() {
  const u = unlocked();
  document.querySelectorAll('.chip').forEach(c => {
    c.disabled = +c.dataset.i > u;
  });
}
