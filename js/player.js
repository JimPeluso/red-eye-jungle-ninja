/* Super moves (Shadow Clones, Thunder Strike), Red Eye getting hurt, Game Over, Level Clear and You Win. */
'use strict';
/* Shadow Clones: two shadow Red Eyes fight for 8 seconds */
function doClones() {
  p.sp = 0;
  cloneT = 480;
  sfx.whoosh();
  sfx.chime();
  clones = [-60, 60].map(off => ({
    x: p.x + 17 + off,
    y: p.y + p.h,
    off,
    face: p.face,
    sw: 0,
    cd: 0,
    t: 0,
    mv: false,
  }));
  for (const c of clones)
    for (let i = 0; i < 14; i++)
      parts.push({
        x: c.x + rnd(-14, 14),
        y: c.y - rnd(0, 60),
        vx: rnd(-1.5, 1.5),
        vy: rnd(-2, 0.5),
        g: -0.02,
        life: rnd(24, 40),
        max: 40,
        r: rnd(5, 10),
        c: 'rgba(110,80,170,.6)',
      });
  pop(p.x + 17, p.y - 44, 'SHADOW CLONES!', '#c9b6ff');
}
function cloneTarget(c) {
  let best = null,
    bd = 300;
  for (const s of snakes) {
    if (!s.alive || s.dy < 0) continue;
    const d = Math.abs(s.x - c.x) + Math.abs(s.y - c.y) * 0.5;
    if (d < bd) {
      bd = d;
      best = { x: s.x, y: s.y, s };
    }
  }
  if (boss && B && B.st === 'stuck' && !B.cfg.duel && Math.abs(B.hx - c.x) < bd + 100)
    best = { x: B.hx - 20, y: GY, boss: true };
  return best;
}
function updClones() {
  cloneT--;
  for (const c of clones) {
    c.t++;
    if (c.sw > 0) c.sw--;
    if (c.cd > 0) c.cd--;
    const tg = cloneTarget(c),
      tx = tg ? tg.x + (c.x < tg.x ? -42 : 42) : p.x + 17 + c.off,
      ty = tg ? tg.y : p.y + p.h;
    const dx = Math.max(-6.5, Math.min(6.5, (tx - c.x) * 0.15));
    c.x += dx;
    c.y += (ty - c.y) * 0.15;
    c.mv = Math.abs(dx) > 0.6;
    c.face = tg ? (tg.x > c.x ? 1 : -1) : c.mv ? Math.sign(dx) : p.face;
    if (tg && Math.abs(tg.x - c.x) < 74 && Math.abs(tg.y - c.y) < 70 && c.cd <= 0) {
      c.sw = 16;
      c.cd = 26;
      sfx.swish();
    }
    if (c.sw === 10 && tg) {
      if (tg.boss) {
        if (B.inv <= 0) bossHit(1);
      } else if (tg.s.alive) hitEnemy(tg.s, 1);
    }
    if (c.t % 4 === 0)
      parts.push({
        x: c.x - c.face * 10,
        y: c.y - 30 + rnd(-10, 10),
        vx: -c.face * rnd(0.3, 1),
        vy: rnd(-0.6, 0.2),
        g: 0,
        life: 20,
        max: 20,
        r: rnd(3, 6),
        c: 'rgba(110,80,170,.45)',
      });
  }
  if (cloneT <= 0) {
    for (const c of clones) puff(c.x, c.y - 30, 'rgba(120,90,180,.7)', 14);
    clones = [];
    pop(p.x + 17, p.y - 30, 'Clones gone', '#c9b6ff');
  }
}
function drawClone(c) {
  ctx.save();
  ctx.globalAlpha = cloneT < 60 && (T >> 2) % 2 ? 0.35 : 0.8;
  ctx.fillStyle = 'rgba(60,30,110,.25)';
  ell(c.x, c.y + 1, 17, 4);
  fig({
    x: c.x,
    fy: c.y,
    face: c.face,
    s: 1,
    crouch: false,
    on: true,
    run: c.t * 0.3,
    vx: c.mv ? 4 : 0,
    sw: c.sw,
    stcd: 0,
    ink: '#251a38',
    arm: '#33264d',
    acc: '#8a63ff',
    eye: '#ff2a2a',
    glow: 'rgba(255,40,40,.45)',
    skin: '#9a8ab8',
    slash: 'rgba(170,130,255,.8)',
  });
  ctx.restore();
}
/* Thunder Strike: lightning hits every enemy on screen */
function doSuper() {
  p.sup = 36;
  p.inv = Math.max(p.inv, 50);
  flash = 14;
  shake = 16;
  sfx.thunder();
  bolts = [];
  const v0 = cam - 40,
    v1 = cam + viewW + 40;
  for (const s of snakes) {
    if (!s.alive || s.dy < 0 || s.x < v0 || s.x > v1) continue;
    bolts.push({ x: s.x, y: s.y - (s.type >= 4 ? 40 : 20), life: 24 });
    s.inv = 0;
    hitEnemy(s, 8);
  }
  if (boss && B && B.st !== 'intro' && B.st !== 'defeat' && !B.gone) {
    bolts.push({ x: B.hx, y: B.hy, life: 24 });
    B.inv = 0;
    bossHit(10);
  }
  for (const v of spits) sparkle(v.x, v.y);
  spits = [];
  waves = [];
  bolts.push({ x: p.x + 17, y: p.y - 34, life: 24 });
  p.sp = 0;
  pop(p.x + 17, p.y - 44, 'THUNDER STRIKE!', '#fff59d');
}
function freeze() {
  p.frozen = 60;
  p.vx = 0;
  pop(p.x + 17, p.y - 16, 'Frozen! Tap to break free', '#bfefff');
  sfx.ice();
  for (let i = 0; i < 10; i++)
    parts.push({
      x: p.x + 17 + rnd(-16, 16),
      y: p.y + rnd(0, p.h),
      vx: rnd(-1.5, 1.5),
      vy: rnd(-2, 0),
      g: 0.05,
      life: 24,
      max: 24,
      r: rnd(2, 4),
      c: '#dff6ff',
    });
}
function hurt(src) {
  p.hearts -= src.dmg || 1;
  p.inv = 90;
  p.vy = -8;
  p.on = false;
  p.vx = (p.x + 17 < src.x ? -1 : 1) * 7;
  shake = 10;
  sfx.hurt();
  puff(p.x + 17, p.y + 20, '#fff', 8);
  if (p.hearts <= 0) {
    p.hearts = 0;
    p.dead = 45;
    p.vy = -10;
  }
}
function fallen() {
  p.hearts--;
  sfx.hurt();
  shake = 8;
  if (PAL.water || PAL.lava)
    for (let i = 0; i < 14; i++)
      parts.push({
        x: p.x + 17 + rnd(-12, 12),
        y: GY + 12,
        vx: rnd(-2.5, 2.5),
        vy: rnd(-7, -3),
        g: 0.35,
        life: 30,
        max: 30,
        r: rnd(2, 4),
        c: PAL.lava ? '#ffb347' : '#bfefff',
      });
  if (p.hearts <= 0) {
    p.hearts = 0;
    over();
    return;
  }
  const s = p.safe;
  let x, y;
  if (s.plat) {
    x = s.plat[0] + s.plat[2] / 2 - 17;
    y = s.plat[1];
  } else {
    const g = s.seg || SEGS[0];
    x = Math.max(10, g[0] + 20, Math.min(s.x - 80, g[1] - 70));
    y = GY;
  }
  respawnAt(x, y);
  pop(p.x + 17, p.y - 14, PAL.lava ? 'Too hot!' : PAL.water ? 'Splash!' : 'Oops!', '#fff');
}
function over() {
  $('overMsg').textContent = boss
    ? B.cfg.name + ' got you this time. Take a breath and try the fight again.'
    : 'Red Eye got knocked out. Try again from your last checkpoint.';
  go('over');
}
const fmt = f => {
  const t = Math.floor(f / 60);
  return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
};
function levelClear() {
  sfx.win();
  unlock(li + 1);
  const last = li === LEVELS.length - 1;
  $('wH').textContent = 'Level ' + (li + 1) + ' clear!';
  $('wC').textContent = p.coins;
  $('wK').textContent = p.kills;
  $('wS').textContent = p.sneaks;
  $('wT').textContent = fmt(p.lt);
  $('wP').textContent = last
    ? 'The Spike King is waiting. Final battle!'
    : 'Next up: Level ' + (li + 2) + ', ' + LEVELS[li + 1].name + '.';
  const g = $('goW');
  g.textContent = last ? 'Face the Spike King' : 'Next level';
  g.classList.toggle('purple', last);
  go('win');
}
function nextFromWin() {
  if (li >= LEVELS.length - 1) startBoss(BOSSES.findIndex(b => b.final));
  else startLevel(li + 1);
}
function champ() {
  $('cC').textContent = p.coins;
  $('cH').textContent = p.hearts + ' of 6';
  $('cT').textContent = fmt(p.time);
  go('champ');
}
