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
  if (A.includes('summon') && small < (b.phase === 2 ? 3 : 2) && r < 0.24 && b.count > 1) {
    b.st = 'summon';
    b.t = 46;
    b.raise = b.cfg.rider ? 1 : 0;
    sfx.roar();
    pop(b.hx + 6, b.hy - 150, b.cfg.rider ? 'Snakes, attack!' : 'Hisssss!', '#d9c2ff');
    return;
  }
  const other = A.filter(a => a !== 'lunge' && a !== 'summon');
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
  b.hp -= d || 1;
  b.inv = 24;
  gain(4);
  shake = Math.max(shake, 6);
  sfx.bossHit();
  puff(b.hx, b.hy - 30, '#c7a2ff', 12);
  pop(b.hx, b.hy - 130, ['Ha!', 'Hiyah!', 'Take that!'][((b.hp % 3) + 3) % 3], '#fff');
  if (b.hp <= 0) {
    b.st = 'defeat';
    b.t = 150;
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
    pop(b.hx, b.hy - 160, b.cfg.rider ? 'Nooo!' : b.cfg.duel ? 'Argh!' : b.cfg.name + ' is beaten!', '#ffc928');
    sfx.win();
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
    case 'defeat':
      b.hx += (1000 - b.hx) * 0.03;
      b.hy += (GY - 70 - b.hy) * 0.05;
      b.fvy += 0.5;
      b.fy += b.fvy;
      b.fx += 4.5;
      b.fr += 0.22;
      if (--b.t <= 0) {
        if (b.cfg.final) champ();
        else levelClear();
      }
      break;
  }
}
