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
   Each move in MAD is one part (PARTS below) with its options, drawn with a look (LOOKS in draw-mad.js, by name).
   A new move that reuses a part is one MAD line, plus a LOOKS entry if it needs a new look. Each move has a `tip`,
   the line under its name in the banner that says how to dodge it, and a `sound` when it starts.
   The parts and their options (a move only lists the options that differ from the part's `def`):
   - spots: ground spots (`zones`) appear around Red Eye, one right under him, warn, then erupt.
     n how many, gap px between them, w how wide, h how tall they erupt, act frames they can hurt, stay frames the
     boss stays mad after the warning. Dodge: step off them.
   - drops: shadows grow on the ground one after another, then something drops into each (zones with sky: true).
     n how many, gap px between them. Dodge: stay out of the shadows.
   - wave: a big wave rises behind the boss during the warning, then rolls across the arena (a `waves` entry with
     big: true). It can't be blocked. h how tall, speed px per frame. Dodge: jump it, or stand on a log (Tide's is
     95px tall: a jump only just clears it, so its tip says to use a log).
   - sweep: something forms in front of the boss, then flies across the arena (`waves`, sweep: true).
     y height of its middle above the ground (70 is head height), speed, sword (Master Fang raises his sword
     during the warning and swings it). Dodge at head height: duck.
   - roller: the boss curls up into a ball that shakes during the warning, rolls across the arena, bounces off the
     far wall and rolls back home, then the boss uncurls (`waves`, roll: true). While curled the cobra isn't drawn
     and can't be hit; sword and stars clang off the ball. r radius, speed. Dodge: jump it, there and back.
   Movers (wave, sweep, roller) are moved by stepMover() and can only hurt once. */
const MAD = {
  // Moss
  vines: {
    name: 'Vine Grab!',
    tip: 'Step off the leaves!',
    part: 'spots',
    look: 'vines',
    n: 2,
    gap: 230,
    w: 92,
    act: 40,
    stay: 40,
    sound: 'rustle',
  },
  // Thunder: lightning reaches the sky, so it can't be jumped
  lightning: { name: 'Lightning Call!', tip: 'Get out of the circles!', part: 'spots', look: 'lightning', h: 700 },
  // Tide stays mad (rearing) until its wave has rolled past Red Eye, then it's dazed
  tide: { name: 'Tidal Wave!', tip: 'Jump it, or get on a log!', part: 'wave', look: 'water' },
  fire: { name: 'Fire Rain!', tip: 'Stay out of the shadows!', part: 'drops', look: 'fireball' }, // Ember
  rocks: { name: 'Cave-in!', tip: 'Stay out of the shadows!', part: 'drops', look: 'rock', n: 5 }, // Shadow
  // Master Fang and the Spike King stay mad until their slash or ball is gone
  slash: { name: 'Fang Slash!', tip: 'Duck! (Sneak)', part: 'sweep', look: 'fang', sword: true },
  ball: { name: 'Spike Ball!', tip: 'Jump over it, there and back!', part: 'roller', look: 'spikes' },
  // Venom (Level 6), Dune (12) and Toxic (22): a cloud drifts across at head height
  fog: { name: 'Poison Fog!', tip: 'Duck! (Sneak)', part: 'sweep', look: 'fog', speed: 5, sound: 'hiss' },
  sand: { name: 'Sandstorm!', tip: 'Duck! (Sneak)', part: 'sweep', look: 'sand', speed: 7, sound: 'whoosh' },
  gas: { name: 'Poison Gas!', tip: 'Duck! (Sneak)', part: 'sweep', look: 'gas', speed: 6, sound: 'hiss' },
  // Bog (8) and Inferno (20): lower than Tide's wave, so a standing jump clears them. Timing slack: Mud Wave about
  // 10 frames, Fire Wall about 9 (Tide's about 1, so its tip says to use a log)
  mud: { name: 'Mud Wave!', tip: 'Jump it!', part: 'wave', look: 'mud', h: 52, speed: 5 },
  firewall: { name: 'Fire Wall!', tip: 'Jump it!', part: 'wave', look: 'firewall', h: 64, speed: 5, sound: 'roar' },
  // Crystal (13): closer together than Fire Rain and Cave-in, with gaps about two Red Eyes wide
  crystals: { name: 'Crystal Rain!', tip: 'Stay out of the shadows!', part: 'drops', look: 'crystal', n: 6, gap: 130 },
};
const PARTS = {
  spots: { def: { n: 3, gap: 210, w: 70, h: 100, act: 14, stay: 20, sound: 'crackle' }, start: groundSpots },
  drops: { def: { n: 4, gap: 150, sound: 'whoosh' }, start: skyDrops },
  wave: {
    def: { h: 95, speed: 4.5, sound: 'rumble' },
    start: bigWave,
    busy: () => waves.some(w => w.big && w.x + 34 > p.x),
  },
  sweep: { def: { y: 70, speed: 7.5, sound: 'crackle' }, start: sweep, busy: () => waves.some(w => w.sweep) },
  roller: { def: { r: 36, speed: 5.5, sound: 'rumble' }, start: roller, busy: () => curled() },
};
const MAD_EVERY = 3; // once mad, every 3rd attack is the mad move
const MAD_WARN = 48; // frames of warning (0.8 s); the fair-play minimum is 45
const MAD_DAZED = 100; // frames the boss stays dazed afterwards (1.7 s)

/** A boss's mad move with all its options: the part's defaults, then the move's own. */
const madMove = b => ({ ...PARTS[MAD[b.cfg.mad].part].def, ...MAD[b.cfg.mad] });
/** bossHit() calls this when a boss with a mad move reaches half health. */
function getMad(b) {
  showBanner(b.cfg.name + ' is mad!', MAD[b.cfg.mad].name, MAD[b.cfg.mad].tip, true);
  BN.t = 100;
  b.madIn = 1; // the first mad move comes straight away
}
/** pickAttack() calls this when it's time for the mad move. */
function startMad(b) {
  const m = madMove(b);
  b.st = 'mad';
  PARTS[m.part].start(b, m);
  sfx[m.sound]();
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

/* Part: ground spots. Moss's Vine Grab (leaves rustle on two patches, then vines shoot up) and Thunder's Lightning
   Call (three circles crackle and glow, then lightning strikes each one). */
function groundSpots(b, m) {
  for (const x of spotsAround(b, m.n, m.gap))
    zones.push({ kind: m.look, x, w: m.w, h: m.h, t: 0, warn: MAD_WARN, act: m.act });
  b.t = MAD_WARN + m.stay;
}

/* Part: from the sky. Ember's Fire Rain and Shadow's Cave-in: shadows grow on the ground one after another, then a
   fireball or a rock drops into each. */
function skyDrops(b, m) {
  spotsAround(b, m.n, m.gap).forEach((x, i) =>
    zones.push({ kind: m.look, x, w: 64, h: 60, t: 0, warn: MAD_WARN + i * 10, act: 10, sky: true }),
  );
  b.t = MAD_WARN + (m.n - 1) * 10 + 20;
}

/* Part: the big wave. Tide's Tidal Wave: water rises behind Tide, then a big wave rolls across the arena. */
function bigWave(b, m) {
  waves.push({ big: true, look: m.look, x: b.hx + 70, vx: -m.speed, life: 600, warn: MAD_WARN, h: 0, top: m.h });
  b.t = MAD_WARN + 20;
}

/* Part: the sweep. Master Fang's Fang Slash: he raises his sword while a purple sword wave forms in front of the
   cobra and a faint line shows how high it will fly, then it flies across the arena at head height. Ducking puts
   Red Eye 8px under it; a log works too. */
function sweep(b, m) {
  waves.push({
    sweep: true,
    look: m.look,
    x: b.hx - 70,
    y: m.y,
    vx: -m.speed,
    life: 400,
    warn: MAD_WARN,
    sword: m.sword,
  });
  if (m.sword) b.raise = 1;
  b.t = MAD_WARN + 20;
}

/* Part: the roller. The Spike King's Spike Ball: poof, he curls up into a giant spiky ball that shakes and growls
   (the warning), rolls across the arena, bounces off the far wall and rolls back home, then uncurls, dizzy.
   A standing jump clears the Spike Ball with about 11 frames to spare. */
const curled = () => waves.some(w => w.roll);
function roller(b, m) {
  const x = b.hx + 30;
  waves.push({
    roll: true,
    look: m.look,
    x,
    home: x,
    r: m.r,
    speed: m.speed,
    vx: 0,
    life: 900,
    warn: MAD_WARN,
    spin: 0,
  });
  b.t = MAD_WARN + 20;
  poof(b, x, m.r);
}
/** A puff of smoke in the boss's colours, where the cobra curls up into a ball or uncurls again. */
function poof(b, x, r) {
  puff(b.hx, b.hy, b.col.b, 14);
  puff(x, GY - r, b.col.a, 16);
  puff(x + 70, GY - 30, b.col.m, 10);
  sfx.whoosh();
}

/** The part of a mover that hurts. The sweep hits a standing Red Eye and flies over a ducking one; the roller's is
    its body, not the tips of its spikes. */
function moverBox(w) {
  if (w.big) return { x: w.x - 30, y: GY - w.h, w: 64, h: w.h };
  if (w.sweep) return { x: w.x - 28, y: GY - w.y - 26, w: 50, h: 52 };
  return { x: w.x - w.r + 6, y: GY - 2 * w.r + 8, w: 2 * w.r - 12, h: 2 * w.r - 8 };
}

/** One frame of a mover (the big wave, the sweep or the roller). Sword and stars clang off the roller. */
function stepMover(w, pb, swing, blade) {
  if (w.warn > 0) {
    w.warn--;
    if (w.big)
      w.h = w.top * (1 - w.warn / MAD_WARN); // the wave rises behind the boss
    else if (w.warn === 0) {
      if (w.sweep) {
        if (w.sword) {
          B.raise = 0;
          B.sw = 16; // Fang swings his sword
        }
        sfx.whoosh();
      } else {
        w.vx = -w.speed;
        sfx.roar();
      }
    } else if (w.roll && w.warn % 16 === 0) sfx.rumble();
    return;
  }
  w.x += w.vx;
  w.life--;
  if (w.big) {
    if (w.x < -60) w.life = 0;
  } else if (w.sweep) {
    if (w.x < -80) w.life = 0;
  } else {
    w.spin += w.vx / w.r;
    if (B.tick % 5 === 0) dust(w.x, GY, 2);
    if (w.vx < 0 && w.x <= 10 + w.r) {
      // bounces off the wall at the far end
      w.x = 10 + w.r;
      w.vx = w.speed;
      shake = Math.max(shake, 10);
      dust(w.x - 20, GY, 12);
      sfx.thud();
    } else if (w.vx > 0 && w.x >= w.home) {
      // home again: uncurls
      w.life = 0;
      poof(B, w.x, w.r);
      return;
    }
  }
  const box = moverBox(w);
  if (w.roll) {
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
    if (swing && !w.cl && hit(blade, box)) clang(w.x, GY - w.r);
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
  const busy = PARTS[MAD[b.cfg.mad].part].busy;
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
/** The moment a zone goes off: shake, dust, sparks, bits flying up and a sound, as its look says (LOOKS). */
function erupt(z) {
  const L = LOOKS[z.kind];
  if (L.shake) shake = Math.max(shake, L.shake);
  if (L.dust) dust(z.x, GY, L.dust);
  if (L.spark) sparkle(z.x, GY - 10);
  if (L.bits)
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
        c: L.bits[i % 3],
      });
  if (L.sound) sfx[L.sound]();
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
