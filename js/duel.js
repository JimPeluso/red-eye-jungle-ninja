/* Master Fang sword duel. Not used right now (no level points at BOSSES[6]); kept in case it comes back. */
'use strict';
/* ---------- Master Fang on foot: the sword duel (NOT USED right now; BOSSES[6] would start it) ---------- */
function duelPick(dx) {
  const b = B,
    ad = Math.abs(dx),
    r = Math.random(),
    ph2 = b.phase === 2;
  b.count++;
  if (ph2 && !b.summoned && b.count > 2) {
    b.summoned = true;
    b.st = 'summon';
    b.t = 40;
    b.raise = 1;
    pop(b.x, GY - 140, 'Snakes, attack!', '#d9c2ff');
    sfx.roar();
    return;
  }
  if (ad < 90) {
    b.st = 'slash';
    b.t = 24;
    return;
  }
  if (r < 0.55) {
    b.st = 'dashwind';
    b.t = ph2 ? 14 : 22;
    b.dir = dx < 0 ? -1 : 1;
    sfx.hiss();
    return;
  }
  b.st = 'leap';
  b.t = 40;
}
function fangStar() {
  const b = B,
    sx = b.x + b.dir * 22,
    sy = b.y - 50,
    dx = p.x + 17 - sx,
    dy = p.y + p.h / 2 - sy,
    d = Math.hypot(dx, dy) || 1,
    v = b.phase === 2 ? 7.5 : 6.5;
  spits.push({ x: sx, y: sy, vx: (dx / d) * v, vy: (dy / d) * v + (Math.random() - 0.5) * 0.8, life: 160, star: true });
  sfx.toss();
}
function duelStep() {
  const b = B,
    ph2 = b.phase === 2,
    pc = p.x + 17,
    dx = pc - b.x;
  b.tick++;
  if (b.inv > 0) b.inv--;
  if (b.sw > 0) b.sw--;
  b.vy += 0.9;
  b.y += b.vy;
  if (b.y >= GY) {
    b.y = GY;
    b.vy = 0;
    b.on = true;
  } else b.on = false;
  b.moving = false;
  switch (b.st) {
    case 'intro':
      b.x += (700 - b.x) * 0.04;
      b.dir = -1;
      b.moving = true;
      if (--b.t <= 0) {
        b.st = 'idle';
        b.t = 50;
      }
      break;
    case 'idle': {
      b.dir = dx < 0 ? -1 : 1;
      const ad = Math.abs(dx),
        want = ad > 230 ? 1 : ad < 120 ? -1 : 0;
      b.x += b.dir * want * (ph2 ? 2.4 : 1.8);
      b.moving = want !== 0;
      if (--b.t <= 0) duelPick(dx);
      break;
    }
    case 'dashwind':
      if (--b.t <= 0) {
        b.st = 'dash';
        b.t = 22;
        sfx.whoosh();
      }
      break;
    case 'dash':
      b.x += b.dir * (ph2 ? 12 : 10.5);
      b.moving = true;
      if (b.t === 20) b.sw = 16;
      if (--b.t <= 0) {
        b.st = 'tired';
        b.t = ph2 ? 40 : 55;
      }
      break;
    case 'tired':
      if (--b.t <= 0) {
        b.st = 'idle';
        b.t = 40;
      }
      break;
    case 'slash':
      if (b.t === 14) {
        b.sw = 16;
        sfx.swish();
      }
      if (--b.t <= 0) {
        b.st = 'idle';
        b.t = ph2 ? 30 : 45;
      }
      break;
    case 'stars':
      b.dir = dx < 0 ? -1 : 1;
      if (b.t === 20 || b.t === 12 || b.t === 4 || (ph2 && (b.t === 16 || b.t === 8))) fangStar();
      if (--b.t <= -10) {
        b.st = 'idle';
        b.t = ph2 ? 35 : 55;
      }
      break;
    case 'leap':
      if (b.t === 30) {
        b.vy = -17;
        b.lx = pc;
        b.on = false;
        sfx.jump();
      }
      if (b.t < 30 && !b.on) b.x += (b.lx - b.x) * 0.08;
      b.t--;
      if (b.t <= 0 && b.on) {
        b.st = 'stuck';
        b.t = ph2 ? 45 : 60;
        shake = 12;
        dust(b.x, GY, 14);
        sfx.thud();
        waves.push({ x: b.x - 24, vx: -6, life: 150, c: '#c7a2ff' }, { x: b.x + 24, vx: 6, life: 150, c: '#c7a2ff' });
      }
      break;
    case 'stuck':
      if (--b.t <= 0) {
        b.st = 'idle';
        b.t = 35;
      }
      break;
    case 'summon':
      if (b.t === 20) {
        for (const [x, dy, k] of [
          [900, 0, 6],
          [120, -420, 4],
        ]) {
          const s = mkSnake([x, 40, 920, GY, 2, k], snakes.length);
          s.dy = dy;
          snakes.push(s);
        }
      }
      if (--b.t <= 0) {
        b.raise = 0;
        b.st = 'idle';
        b.t = 50;
      }
      break;
    case 'defeat':
      if (b.t === 120) {
        b.gone = true;
        for (let i = 0; i < 26; i++)
          parts.push({
            x: b.x + rnd(-20, 20),
            y: b.y - 40 + rnd(-30, 30),
            vx: rnd(-2, 2),
            vy: rnd(-2.5, 0.5),
            g: -0.02,
            life: rnd(30, 50),
            max: 50,
            r: rnd(6, 12),
            c: 'rgba(160,140,190,.7)',
          });
        pop(b.x, b.y - 110, 'This isn’t over!', '#d9c2ff');
        sfx.whoosh();
      }
      if (--b.t <= 0) levelClear();
      break;
  }
  b.x = Math.max(30, Math.min(930, b.x));
  b.hx = b.x;
  b.hy = b.y - 40;
}
function duelHits(swing, blade, pb, f0, cx) {
  const b = B;
  if (b.gone) return;
  const fb = { x: b.x - 19, y: b.y - 72, w: 38, h: 72 },
    guard = b.st === 'idle' && b.dir > 0 === cx > b.x;
  if (swing && b.inv <= 0 && hit(blade, fb)) {
    if (guard && Math.random() < (b.phase === 2 ? 0.75 : 0.6)) {
      b.inv = 14;
      pop(b.x, b.y - 96, 'Blocked!', '#d9c2ff');
      sparkle(b.x + b.dir * 16, b.y - 40);
      sfx.clang();
      b.st = 'slash';
      b.t = 18;
    } else bossHit();
  }
  for (const st of stars) {
    if (st.life <= 0 || !hit({ x: st.x - 8, y: st.y - 8, w: 16, h: 16 }, fb)) continue;
    st.life = 0;
    if (guard) {
      pop(st.x, st.y - 20, 'Clang!', '#dfe6ea');
      sparkle(st.x, st.y);
      sfx.clang();
    } else if (b.inv <= 0) bossHit();
  }
  if (p.inv > 0 || p.dead) return;
  if (hit(pb, fb)) {
    if (p.vy > 1 && f0 <= fb.y + 14) {
      if (b.inv <= 0) bossHit();
      p.vy = -12;
      p.on = false;
      return;
    }
    if (b.st === 'dash') {
      hurt({ x: b.x, dmg: 2 });
      return;
    }
  }
  if (b.sw >= 4 && b.sw <= 13 && hit(pb, { x: b.dir > 0 ? b.x + 8 : b.x - 74, y: b.y - 80, w: 66, h: 80 }))
    hurt({ x: b.x, dmg: 2 });
}
