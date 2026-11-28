/* Giant cobra boss AI: picking attacks, summoning snakes, taking hits, the state machine. */
'use strict';
/* ---------- boss AI: every giant cobra, including Master Fang's ---------- */
function pickAttack() {
  const b = B,
    A = b.cfg.atk,
    small = snakes.filter(s => s.alive).length,
    r = Math.random();
  b.count++;
  if (b.phase === 2 && b.cfg.mad && --b.madIn <= 0) {
    b.madIn = MAD_EVERY;
    startMad(b);
    return;
  }
  if (A.includes('burrow') && (b.count === 2 || (b.count > 3 && r > 0.5 && r < 0.85))) {
    b.st = 'dive';
    b.t = 34;
    b.ug = true;
    b.sink = 0;
    b.hole = null;
    sfx.hiss();
    pop(b.hx - 10, b.hy - 100, 'Into the ground!', '#d9c2ff');
    return;
  }
  if (A.includes('summon') && small < (b.phase === 2 ? 3 : 2) && r < 0.24 && b.count > 1) {
    b.st = 'summon';
    b.t = 46;
    b.raise = b.cfg.rider ? 1 : 0;
    sfx.roar();
    pop(b.hx + 6, b.hy - 150, b.cfg.rider ? 'Snakes, attack!' : 'Hisssss!', '#d9c2ff');
    return;
  }
  const other = A.filter(a => a !== 'lunge' && a !== 'summon' && a !== 'burrow');
  if (!other.length || r < 0.6 || b.count % 3 === 0) {
    b.st = 'windup';
    b.t = b.phase === 2 ? 32 : 46;
    b.from = b.hx;
    sfx.hiss();
    return;
  }
  const k = other[Math.floor(Math.random() * other.length)];
  b.st = k;
  b.t = k === 'wave' ? 50 : k === 'slam' ? 40 : k === 'spikes' ? 46 : 30;
  if (k !== 'wave') sfx.hiss();
}
function summon() {
  const b = B,
    n = b.phase === 2 ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const hi = Math.max(150, b.hx - 150),
      x = 50 + Math.random() * (hi - 50);
    const s = mkSnake(
      [
        x,
        Math.max(30, x - 130),
        Math.max(x, Math.min(hi, x + 130)),
        GY,
        1.4 + Math.random() * 0.6,
        b.phase === 2 && i === 2 ? 3 : b.cfg.minion || 0,
      ],
      i,
    );
    s.dy = -380 - i * 90;
    s.dir = Math.random() < 0.5 ? -1 : 1;
    snakes.push(s);
  }
}
function bossHit(d) {
  const b = B;
  if (b.st === 'defeat') return; // already beaten (a Thunder Strike can land during the finish)
  b.hp -= d || 1;
  b.inv = 24;
  gain(4);
  shake = Math.max(shake, 6);
  sfx.bossHit();
  puff(b.hx, b.hy - 30, '#c7a2ff', 12);
  pop(b.hx, b.hy - 130, ['Ha!', 'Hiyah!', 'Take that!'][((b.hp % 3) + 3) % 3], '#fff');
  if (b.hp <= 0) {
    startDefeat(b);
    return;
  }
  if (b.phase === 1 && b.hp <= b.max / 2) {
    b.phase = 2;
    if (b.cfg.mad) getMad(b);
    else pop(b.hx, b.hy - 160, b.cfg.name + ' is angry!', '#ff6b5e');
    sfx.roar();
    if (p.hearts < 6) items.push({ x: 170, y: GY - 30, dy: -400, vy: 0, got: false });
  }
}
/* ---------- the big finish: a beaten boss ----------
   0-12 frames   the winning hit throws its head back; it trembles, eyes turn to X's
   12-52         dizzy: the head sways in circles with stars round it
   52-70         it topples forward and crashes onto the ground
   76 on         its body pops into fireworks from the tail to the head, then the head bursts in the biggest one,
                 with confetti raining down. The final boss gets extra fireworks in the sky.
   Then the win screen (or the champion screen). Master Fang flies off his cobra as soon as it's beaten. */
const KO = { shock: 12, dizzy: 52, fall: 70, pops: 76, end: 200, finalEnd: 270 };
function startDefeat(b) {
  b.st = 'defeat';
  b.dt = 0; // frames since the winning hit
  b.pop = 0; // body circles popped so far, from the tail end
  b.gone = false; // the head has burst
  b.kx = Math.max(300, Math.min(640, b.hx)); // where the head sways while dizzy
  b.t = 150; // only the dormant sword duel (duel.js) still counts this down
  b.inv = 0;
  b.ug = false;
  b.hole = null;
  b.sink = 0;
  b.fx = b.hx + 6;
  b.fy = b.hy - 40;
  b.fvy = -13;
  b.fr = 0;
  b.raise = 0;
  b.sw = 0;
  for (const s of snakes)
    if (s.alive) {
      s.alive = false;
      puff(s.x, s.y - 12, '#9fe34d', 8);
    }
  waves = [];
  spits = [];
  zones = [];
  shake = Math.max(shake, 16);
  firework(b.hx - 20, b.hy, ['#ffffff', '#ffe14d', '#fff3a8'], 20, 6); // the winning hit
  if (b.cfg.rider || b.cfg.duel) pop(b.hx, b.hy - 160, b.cfg.rider ? 'Nooo!' : 'Argh!', '#ffc928');
  sfx.roar();
}
function defeatStep(b) {
  const t = ++b.dt,
    end = b.cfg.final ? KO.finalEnd : KO.end;
  b.fvy += 0.5; // Master Fang tumbling through the air
  b.fy += b.fvy;
  b.fx += 4.5;
  b.fr += 0.22;
  if (!b.cfg.duel) {
    const cx = b.kx + 30,
      cy = GY - 160;
    if (t < KO.shock) {
      b.hx += (cx - b.hx) * 0.3;
      b.hy += (cy - b.hy) * 0.25;
    } else if (t < KO.dizzy) {
      const a = (t - KO.shock) * 0.22;
      b.hx = cx + Math.sin(a) * 16;
      b.hy = cy + (1 - Math.cos(a)) * 7;
      if (t === KO.shock) b.sx = b.hx;
    } else if (t <= KO.fall) {
      if (t === KO.dizzy) {
        b.sx = b.hx;
        b.sy = b.hy;
      }
      const k = (t - KO.dizzy) / (KO.fall - KO.dizzy),
        e = k * k; // falls faster and faster
      b.hx = b.sx + (b.kx - 50 - b.sx) * e;
      b.hy = b.sy + (GY - 32 - b.sy) * e;
      if (t === KO.fall) {
        shake = Math.max(shake, 14);
        dust(b.hx - 30, GY, 22);
        dust(b.hx + 50, GY, 14);
        sfx.thud();
      }
    } else if (t >= KO.pops && !b.gone && (t - KO.pops) % 5 === 0) popBody(b);
  }
  if (b.gone && t < end - 30) {
    // confetti in the boss's colours
    const C = b.col;
    for (let i = 0; i < 2; i++)
      parts.push({
        x: cam + rnd(0, viewW),
        y: TOP - 6,
        vx: rnd(-0.8, 0.8),
        vy: rnd(1.4, 2.8),
        g: 0.015,
        life: 110,
        max: 110,
        r: rnd(2.5, 4),
        c: [C.a, C.m, C.h, '#ffe14d', '#ffffff'][i + (t % 4)],
      });
    if (b.cfg.final && t % 14 === 0) {
      const cols = [
        ['#ff6a4d', '#ffe14d'],
        ['#7ad7ff', '#ffffff'],
        ['#c7a2ff', '#ffd1f0'],
        ['#9fe34d', '#ffe14d'],
      ][(t / 14) % 4];
      firework(cam + rnd(120, viewW - 120), rnd(Math.max(TOP + 60, 40), 260), cols, 28, 5);
      sfx.firework();
    }
  }
  if (t >= end) {
    if (b.cfg.final) champ();
    else levelClear();
  }
}
/** Pops the next few circles of a beaten boss's body, tail first, each in a little firework; the last pop bursts
    the head. Circles hidden behind the temple wall go without a firework. */
function popBody(b) {
  const pts = bodyPts(b),
    C = b.col,
    cols = ['#ffe14d', C.m, C.h, '#ffffff'];
  while (b.pop < pts.length && pts[pts.length - 1 - b.pop][0] > 1000) b.pop++;
  for (let i = 0; i < 3 && b.pop < pts.length; i++) {
    const [x, y] = pts[pts.length - 1 - b.pop];
    b.pop++;
    firework(x, y, cols, 14, 4);
  }
  sfx.firework();
  if (b.pop < pts.length) return;
  b.gone = true;
  firework(b.hx, b.hy, ['#ffffff', C.m, C.h, '#ffe14d', C.b, '#ff6a4d'], 44, 7.5);
  firework(b.hx, b.hy, ['#ffe14d', '#ffffff', '#fff3a8'], 22, 3.5);
  puff(b.hx, b.hy, C.b, 16);
  flash = 10; // one soft flash, not a flicker
  shake = Math.max(shake, 12);
  sfx.boom();
  pop(b.hx, b.hy - 70, b.cfg.name + ' is beaten!', '#ffc928');
}

function bossStep() {
  const b = B,
    ph2 = b.phase === 2;
  b.tick++;
  if (b.inv > 0) b.inv--;
  if (b.sw > 0) b.sw--;
  const rest = GY - 130 + Math.sin(b.tick * 0.05) * 6;
  switch (b.st) {
    case 'intro':
      b.hx += (640 - b.hx) * 0.035;
      b.hy = rest;
      if (--b.t <= 0) {
        b.st = 'idle';
        b.t = 50;
      }
      break;
    case 'idle': {
      const tx = Math.max(420, Math.min(700, p.x + 17 + 280));
      b.hx += Math.sign(tx - b.hx) * Math.min(Math.abs(tx - b.hx), ph2 ? 1.8 : 1.1);
      b.hy = rest;
      if (--b.t <= 0) pickAttack();
      break;
    }
    case 'windup':
      b.hy += (GY - 168 - b.hy) * 0.12;
      b.hx += (b.from + 26 - b.hx) * 0.1;
      if (--b.t <= 0) {
        b.st = 'lunge';
        b.t = 16;
        b.from = b.hx;
        b.to = Math.max(110, b.hx - 300);
        sfx.lunge();
      }
      break;
    case 'lunge': {
      const k = 1 - b.t / 16,
        e = 1 - (1 - k) * (1 - k);
      b.hx = b.from + (b.to - b.from) * e;
      b.hy = GY - 168 + 134 * e;
      if (--b.t <= 0) {
        b.st = 'stuck';
        b.t = ph2 ? 80 : 105;
        shake = 12;
        dust(b.hx - 20, GY, 16);
        sfx.thud();
      }
      break;
    }
    case 'stuck':
      b.hy = GY - 34;
      if (--b.t <= 0) {
        b.st = 'recover';
        b.t = 40;
        b.to = Math.min(700, b.hx + 260);
      }
      break;
    case 'mad':
      madStep(b, rest);
      break;
    case 'dazed':
      dazedStep(b);
      break;
    case 'recover':
      b.hx += (b.to - b.hx) * 0.08;
      b.hy += (rest - b.hy) * 0.1;
      if (--b.t <= 0) {
        b.st = 'idle';
        b.t = ph2 ? 45 + rnd(0, 30) : 70 + rnd(0, 40);
      }
      break;
    case 'wave':
      b.hy = rest;
      b.t--;
      if (b.t === 24 || (ph2 && b.t === 2)) b.sw = 16;
      if (b.sw === 10) {
        waves.push({ x: b.hx - 30, vx: ph2 ? -7 : -6, life: 220 });
        sfx.whoosh();
      }
      if (b.t <= -16) {
        b.st = 'idle';
        b.t = ph2 ? 45 : 75;
      }
      break;
    case 'summon':
      b.hy = rest;
      if (b.t === 18) summon();
      if (--b.t <= 0) {
        b.raise = 0;
        b.st = 'idle';
        b.t = ph2 ? 55 : 85;
      }
      break;
    case 'slam':
      b.t--;
      if (b.t > 14) b.hy += (GY - 195 - b.hy) * 0.12;
      else if (b.t > 8) b.hy += (GY - 48 - b.hy) * 0.55;
      else b.hy += (rest - b.hy) * 0.06;
      if (b.t === 8) {
        waves.push({ x: b.hx - 46, vx: ph2 ? -7 : -6, life: 220, c: b.col.m });
        if (ph2) waves.push({ x: b.hx - 46, vx: -4, life: 280, c: b.col.m });
        shake = 12;
        dust(b.hx - 30, GY, 14);
        sfx.thud();
      }
      if (b.t <= -24) {
        b.st = 'idle';
        b.t = ph2 ? 45 : 75;
      }
      break;
    case 'spit':
      b.hy = rest;
      b.t--;
      if (b.t === 26 || b.t === 18 || b.t === 10 || (ph2 && b.t === 2)) {
        spits.push({
          x: b.hx - 40,
          y: b.hy + 12,
          vx: -(3.2 + ((26 - b.t) / 8) * 1.4 + Math.random() * 0.6),
          vy: -7.2,
          g: 0.25,
          life: 300,
        });
        sfx.spit();
      }
      if (b.t <= -16) {
        b.st = 'idle';
        b.t = ph2 ? 45 : 75;
      }
      break;
    case 'spikes':
      b.t--;
      if (b.t > 24) b.hy += (GY - 178 - b.hy) * 0.12;
      else b.hy += (rest - b.hy) * 0.08;
      if (b.t === 24) {
        const n = ph2 ? 7 : 5;
        for (let i = 0; i < n; i++)
          spits.push({
            x: b.hx + 90 + i * 42,
            y: GY - 64,
            vx: -(2.5 + i * 1.6 + Math.random() * 0.8),
            vy: -(9 + Math.random() * 2),
            g: 0.3,
            life: 260,
            spike: true,
          });
        shake = 6;
        sfx.clang();
        sfx.whoosh();
      }
      if (b.t === 10) {
        const sx = b.hx - 40,
          sy = b.hy + 10,
          dx = p.x + 17 - sx,
          dy = p.y + p.h / 2 - sy,
          d = Math.hypot(dx, dy) || 1;
        spits.push({ x: sx, y: sy, vx: (dx / d) * 7.5, vy: (dy / d) * 7.5, life: 160, spike: true });
        if (ph2) spits.push({ x: sx, y: sy, vx: (dx / d) * 7.5, vy: (dy / d) * 7.5 - 1.4, life: 160, spike: true });
        sfx.spit();
      }
      if (b.t <= -16) {
        b.st = 'idle';
        b.t = ph2 ? 45 : 70;
      }
      break;
    /* burrow (Shadow): sink into the ground, chase Red Eye as a dirt mound, burst up under him, lie dazed (hit it!), then dive back home */
    case 'dive': {
      const k = 1 - b.t / 34;
      b.hy = rest;
      b.sink = k < 0.2 ? -k * 0.3 : Math.pow((k - 0.2) / 0.8, 2);
      if (b.t === 24) {
        dust(b.hx, GY, 18);
        dust(b.hx + 150, GY, 12);
        shake = 8;
        sfx.whoosh();
      }
      if (--b.t <= 0) {
        b.sink = 1;
        b.st = 'under';
        b.t = ph2 ? 70 : 95;
        b.mx = b.hx - 30;
        b.hy = GY + 150;
      }
      break;
    }
    case 'under': {
      const tx = Math.max(60, Math.min(720, p.x + 17));
      b.mx += Math.sign(tx - b.mx) * Math.min(Math.abs(tx - b.mx), ph2 ? 4.2 : 3.2);
      if (b.tick % 5 === 0) dust(b.mx, GY, 3);
      if (b.tick % 24 === 0) sfx.rumble();
      shake = Math.max(shake, 2);
      if (--b.t <= 0 || Math.abs(tx - b.mx) < 4) {
        b.st = 'rumble';
        b.t = ph2 ? 26 : 38;
        pop(b.mx, GY - 70, '!', '#ffe14d');
        sfx.hiss();
      }
      break;
    }
    case 'rumble':
      shake = Math.max(shake, 4);
      if (b.tick % 4 === 0) dust(b.mx + rnd(-30, 30), GY, 2);
      if (--b.t <= 0) {
        b.st = 'burst';
        b.t = 22;
        b.hole = b.mx;
        b.hx = b.mx;
        b.hy = GY + 90;
        shake = 16;
        dust(b.mx, GY, 26);
        for (let i = 0; i < 12; i++)
          parts.push({
            x: b.mx + rnd(-30, 30),
            y: GY - 4,
            vx: rnd(-4, 4),
            vy: rnd(-10, -4),
            g: 0.4,
            life: 40,
            max: 40,
            r: rnd(3, 6),
            c: PAL.dirt[i % 3],
          });
        sfx.roar();
        sfx.thud();
      }
      break;
    case 'burst':
      if (b.t > 10) b.hy += (GY - 175 - b.hy) * 0.45;
      else b.hy += (GY - 34 - b.hy) * 0.35;
      if (
        b.t > 8 &&
        p.inv <= 0 &&
        !p.dead &&
        hit({ x: p.x, y: p.y, w: p.w, h: p.h }, { x: b.hole - 44, y: b.hy - 50, w: 88, h: GY - b.hy + 50 })
      )
        hurt({ x: b.hole });
      if (--b.t <= 0) {
        b.st = 'dazed';
        b.t = ph2 ? 75 : 100;
        b.dazeTo = b.hx; // stays by its hole
        b.hy = GY - 34;
        shake = 10;
        dust(b.hx - 20, GY, 12);
        sfx.thud();
      }
      break;
    case 'redive':
      b.hy += (GY + 120 - b.hy) * 0.18;
      if (b.t === 20) dust(b.hole, GY, 14);
      if (--b.t <= 0) {
        b.hole = null;
        b.hx = Math.max(460, Math.min(700, p.x + 17 + 300));
        b.hy = rest;
        b.sink = 1;
        b.st = 'rise';
        b.t = 40;
        dust(b.hx, GY, 16);
        dust(b.hx + 160, GY, 12);
        sfx.whoosh();
      }
      break;
    case 'rise': {
      const k = 1 - b.t / 40;
      b.hy = rest;
      b.sink = (1 - k) * (1 - k);
      if (--b.t <= 0) {
        b.sink = 0;
        b.ug = false;
        b.st = 'idle';
        b.t = ph2 ? 45 : 70;
      }
      break;
    }
    case 'defeat':
      defeatStep(b);
      break;
  }
}
