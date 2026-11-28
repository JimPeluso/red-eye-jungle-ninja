/* Mad moves: the extra attack a boss gets once it's mad (half health), built from reusable parts. */
'use strict';
/* ---------- mad moves ----------
   A boss with a mad move (BOSSES[i].mad) gets mad at half health: a banner names the move ("Moss is mad! Vine
   Grab!"), the move comes straight away, and from then on every 3rd attack is the mad move.
   Fair-play rules for every mad move (the designer's, keep them):
   - a warning of at least 45 frames (0.75 s) before anything can hurt,
   - one clear way to dodge it,
   - 1 heart of damage, never at the same time as another attack, and no flashing,
   - afterwards the boss is dazed (head down on the ground near Red Eye) and can be hit.
   Parts so far:
   - Ground spots (`zones`): a patch of ground warns, then erupts. Used by Moss's Vine Grab and Thunder's Lightning
     Call, and (with sky: true, a shadow that grows, then something drops into it) by Ember's Fire Rain and Shadow's
     Cave-in. Each zone: { kind, x (centre), w, h (how tall it erupts), t (frames so far), warn, act (frames it can
     hurt), sky? }.
   - The big wave (Tide's Tidal Wave): a `waves` entry with big: true. It rises during its warning, can't be
     blocked, and is jumped over or ridden out on a log.
   - Movers (Master Fang's Fang Slash, the Spike King's Spike Ball): `waves` entries with slash: true or ball: true,
     moved by stepMover() below. They wait out their warning, then fly or roll, and can only hurt once.
   Each move has a `tip`, the line under its name in the banner that says how to dodge it. */
const MAD = {
  vines: { name: 'Vine Grab!', tip: 'Step off the leaves!', start: vineGrab }, // Moss
  lightning: { name: 'Lightning Call!', tip: 'Get out of the circles!', start: lightningCall }, // Thunder
  // Tide stays mad (rearing) until its wave has rolled past Red Eye, then it's dazed
  tide: {
    name: 'Tidal Wave!',
    tip: 'Jump it, or get on a log!',
    start: tidalWave,
    busy: () => waves.some(w => w.big && w.x + 34 > p.x),
  },
  fire: { name: 'Fire Rain!', tip: 'Stay out of the shadows!', start: b => skyDrops(b, 'fireball', 4) }, // Ember
  rocks: { name: 'Cave-in!', tip: 'Stay out of the shadows!', start: b => skyDrops(b, 'rock', 5) }, // Shadow
  // Master Fang and the Spike King stay mad until their slash or ball is gone
  slash: { name: 'Fang Slash!', tip: 'Duck! (Sneak)', start: fangSlash, busy: () => waves.some(w => w.slash) },
  ball: { name: 'Spike Ball!', tip: 'Jump over it, there and back!', start: spikeBall, busy: () => curled() },
};
const MAD_EVERY = 3; // once mad, every 3rd attack is the mad move
const MAD_WARN = 48; // frames of warning (0.8 s); the fair-play minimum is 45
const MAD_DAZED = 100; // frames the boss stays dazed afterwards (1.7 s)

/** bossHit() calls this when a boss with a mad move reaches half health. */
function getMad(b) {
  showBanner(b.cfg.name + ' is mad!', MAD[b.cfg.mad].name, MAD[b.cfg.mad].tip, true);
  BN.t = 100;
  b.madIn = 1; // the first mad move comes straight away
}
/** pickAttack() calls this when it's time for the mad move. */
function startMad(b) {
  b.st = 'mad';
  MAD[b.cfg.mad].start(b);
}

/* Moss, Vine Grab: leaves rustle on two patches of ground (one right under Red Eye), then vines shoot up from them.
   Dodge: step off the leaves (or stand on a log). */
function vineGrab(b) {
  const at = Math.max(70, Math.min(b.hx - 120, p.x + 17));
  const other = at + 230 < b.hx - 40 ? at + 230 : Math.max(60, at - 230); // leaves safe ground in between
  for (const x of [at, other]) zones.push({ kind: 'vines', x, w: 92, h: 100, t: 0, warn: MAD_WARN, act: 40 });
  b.t = MAD_WARN + 40;
  sfx.rustle();
}

/** Spots for a mad move: one right under Red Eye, then others every `gap` px either side, staying in the arena and
    in front of the boss. */
function spotsAround(b, n, gap) {
  const at = Math.max(70, Math.min(b.hx - 120, p.x + 17)),
    out = [at];
  for (let i = 1; out.length < n && i < 8; i++)
    for (const side of [1, -1]) {
      const x = at + side * i * gap;
      if (x >= 60 && x <= b.hx - 40 && out.length < n) out.push(x);
    }
  return out;
}

/* Thunder, Lightning Call: three circles on the ground crackle and glow, then lightning strikes each one.
   Dodge: step out of the circles (lightning can't be jumped). */
function lightningCall(b) {
  for (const x of spotsAround(b, 3, 210))
    zones.push({ kind: 'lightning', x, w: 70, h: 700, t: 0, warn: MAD_WARN, act: 14 });
  b.t = MAD_WARN + 20;
  sfx.crackle();
}

/* Tide, Tidal Wave: water rises behind Tide, then a big wave rolls across the arena.
   Dodge: jump over it, or stand on a log. The wave is a `waves` entry with big: true (step.js, draw-mad.js). */
function tidalWave(b) {
  waves.push({ big: true, x: b.hx + 70, vx: -4.5, life: 600, warn: MAD_WARN, h: 0 });
  b.t = MAD_WARN + 20;
  sfx.rumble();
}

/* Part B, from the sky (Ember's Fire Rain, Shadow's Cave-in): shadows grow on the ground one after another, then a
   fireball or a rock drops into each. Dodge: stay out of the shadows. */
function skyDrops(b, kind, n) {
  spotsAround(b, n, 150).forEach((x, i) =>
    zones.push({ kind, x, w: 64, h: 60, t: 0, warn: MAD_WARN + i * 10, act: 10, sky: true }),
  );
  b.t = MAD_WARN + (n - 1) * 10 + 20;
  sfx.whoosh();
}

/* Master Fang, Fang Slash: he raises his sword while a purple sword wave forms in front of the cobra and a faint
   line shows how high it will fly, then it flies across the arena at head height.
   Dodge: duck (Sneak) and it goes over Red Eye's head. Standing on a log works too. */
function fangSlash(b) {
  waves.push({ slash: true, x: b.hx - 70, vx: -7.5, life: 400, warn: MAD_WARN });
  b.raise = 1;
  b.t = MAD_WARN + 20;
  sfx.crackle();
}
/** The part of Fang's sword wave that hurts: hits a standing Red Eye, flies 8px over a ducking one. */
const slashBox = w => ({ x: w.x - 28, y: GY - 96, w: 50, h: 52 });

/* Spike King, Spike Ball: poof, he curls up into a giant spiky ball that shakes and growls (the warning), rolls
   across the arena, bounces off the far wall and rolls back home, then uncurls, dizzy.
   Dodge: jump over it, there and back (a standing jump clears it with about 11 frames to spare). */
const BALL_R = 36,
  BALL_SPEED = 5.5;
const curled = () => waves.some(w => w.ball);
function spikeBall(b) {
  const x = b.hx + 30;
  waves.push({ ball: true, x, home: x, vx: 0, life: 900, warn: MAD_WARN, spin: 0 });
  b.t = MAD_WARN + 20;
  poof(b, x);
  sfx.rumble();
}
/** The part of the ball that hurts: its body, not the tips of its spikes. */
const ballBox = w => ({ x: w.x - BALL_R + 6, y: GY - 2 * BALL_R + 8, w: 2 * BALL_R - 12, h: 2 * BALL_R - 8 });
/** A puff of smoke in the boss's colours, where the cobra curls up into a ball or uncurls again. */
function poof(b, x) {
  puff(b.hx, b.hy, b.col.b, 14);
  puff(x, GY - BALL_R, b.col.a, 16);
  puff(x + 70, GY - 30, b.col.m, 10);
  sfx.whoosh();
}

/** One frame of a mover (Fang's sword wave or the Spike King's ball). Sword and stars clang off the ball. */
function stepMover(w, pb, swing, blade) {
  if (w.warn > 0) {
    if (--w.warn === 0) {
      if (w.slash) {
        B.raise = 0;
        B.sw = 16; // Fang swings his sword
        sfx.whoosh();
      } else {
        w.vx = -BALL_SPEED;
        sfx.roar();
      }
    } else if (w.ball && w.warn % 16 === 0) sfx.rumble();
    return;
  }
  w.x += w.vx;
  w.life--;
  if (w.slash) {
    if (w.x < -80) w.life = 0;
  } else {
    w.spin += w.vx / BALL_R;
    if (B.tick % 5 === 0) dust(w.x, GY, 2);
    if (w.vx < 0 && w.x <= 10 + BALL_R) {
      // bounces off the wall at the far end
      w.x = 10 + BALL_R;
      w.vx = BALL_SPEED;
      shake = Math.max(shake, 10);
      dust(w.x - 20, GY, 12);
      sfx.thud();
    } else if (w.vx > 0 && w.x >= w.home) {
      // home again: uncurls
      w.life = 0;
      poof(B, w.x);
      return;
    }
  }
  const box = w.slash ? slashBox(w) : ballBox(w);
  if (w.ball) {
    const clang = (x, y) => {
      pop(x, y - 24, 'Clang!', '#dfe6ea');
      sparkle(x, y);
      sfx.clang();
    };
    for (const st of stars)
      if (st.life > 0 && hit({ x: st.x - 8, y: st.y - 8, w: 16, h: 16 }, box)) {
        st.life = 0;
        clang(st.x, st.y);
      }
    if (swing && !w.cl && hit(blade, box)) clang(w.x, GY - BALL_R);
    w.cl = swing && hit(blade, box); // one clang per swing
  }
  if (!w.hurt && p.inv <= 0 && !p.dead && hit(pb, box)) {
    hurt(w);
    w.hurt = true; // a mad move costs at most 1 heart
  }
}

/** The boss during its mad move: rears up while the move plays out, then goes dazed. */
function madStep(b, rest) {
  b.hy += (rest - 26 - b.hy) * 0.1;
  const busy = MAD[b.cfg.mad].busy;
  if (--b.t <= 0 && !(busy && busy() && b.t > -300)) {
    b.st = 'dazed';
    b.t = MAD_DAZED;
    b.dazeTo = Math.max(170, b.hx - 90); // the head flops down a little closer to Red Eye
    sfx.thud();
    shake = Math.max(shake, 8);
  }
}
/** Dazed: head down on the ground, can be hit (step.js treats it like 'stuck'), then back up. Used after a mad move
    and after the burrow's burst (then it dives back down its hole). */
function dazedStep(b) {
  b.hx += (b.dazeTo - b.hx) * 0.12;
  b.hy += (GY - 34 - b.hy) * 0.25;
  if (--b.t > 0) return;
  if (b.hole != null) {
    b.st = 'redive';
    b.t = 26;
  } else {
    b.st = 'recover';
    b.t = 40;
    b.to = Math.min(700, b.hx + 260);
  }
}

/* ---------- ground spots ---------- */
/** The part of a zone that can hurt right now (it shoots up over 6 frames once the warning ends). */
function zoneBox(z) {
  const k = Math.min(1, Math.max(0, (z.t - z.warn) / 6));
  return { x: z.x - z.w / 2, y: GY - z.h * k, w: z.w, h: z.h * k };
}
/** The moment a zone goes off: shake, dust and sound to match. */
function erupt(z) {
  if (z.kind === 'vines') {
    shake = Math.max(shake, 6);
    dust(z.x, GY, 10);
    sfx.whoosh();
  } else if (z.kind === 'lightning') {
    shake = Math.max(shake, 5);
    sparkle(z.x, GY - 10);
    sfx.zap();
  } else if (z.kind === 'fireball' || z.kind === 'rock') {
    shake = Math.max(shake, z.kind === 'rock' ? 7 : 4);
    dust(z.x, GY, 10);
    const c = z.kind === 'rock' ? ['#6b6f6c', '#8a8f8b', '#4f5450'] : ['#ff6a2a', '#ffd24a', '#e8481c'];
    for (let i = 0; i < 10; i++)
      parts.push({
        x: z.x + rnd(-20, 20),
        y: GY - 8,
        vx: rnd(-3, 3),
        vy: rnd(-6, -2),
        g: 0.35,
        life: 30,
        max: 30,
        r: rnd(2, 5),
        c: c[i % 3],
      });
    sfx.thud();
  }
}
/** One frame of every zone: count up, erupt, hurt Red Eye if he's in it, then sink back and go. */
function stepZones(pb) {
  for (const z of zones) {
    z.t++;
    const up = z.t - z.warn;
    if (up === 0) erupt(z);
    if (up >= 0 && up < z.act && p.inv <= 0 && !p.dead && hit(pb, zoneBox(z))) hurt({ x: z.x });
  }
  zones = zones.filter(z => z.t < z.warn + z.act + 14); // 14 more frames to sink back into the ground
}
