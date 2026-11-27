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
   - Ground spots (`zones`): a patch of ground warns, then erupts. Used by Moss's Vine Grab.
     Each zone: { kind, x (centre), w, h (how tall it erupts), t (frames so far), warn, act (frames it can hurt) }. */
const MAD = {
  vines: { name: 'Vine Grab!', start: vineGrab },
};
const MAD_EVERY = 3; // once mad, every 3rd attack is the mad move
const MAD_WARN = 48; // frames of warning (0.8 s); the fair-play minimum is 45
const MAD_DAZED = 100; // frames the boss stays dazed afterwards (1.7 s)

/** bossHit() calls this when a boss with a mad move reaches half health. */
function getMad(b) {
  showBanner(b.cfg.name + ' is mad!', MAD[b.cfg.mad].name, '', true);
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

/** The boss during its mad move: rears up while the move plays out, then goes dazed. */
function madStep(b, rest) {
  b.hy += (rest - 26 - b.hy) * 0.1;
  if (--b.t <= 0) {
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
/** One frame of every zone: count up, erupt, hurt Red Eye if he's in it, then sink back and go. */
function stepZones(pb) {
  for (const z of zones) {
    z.t++;
    const up = z.t - z.warn;
    if (up === 0 && z.kind !== 'flame') {
      shake = Math.max(shake, 6);
      dust(z.x, GY, 10);
      sfx.whoosh();
    }
    if (up >= 0 && up < z.act && p.inv <= 0 && !p.dead && hit(pb, zoneBox(z))) hurt({ x: z.x });
  }
  zones = zones.filter(z => z.t < z.warn + z.act + 14); // 14 more frames to sink back into the ground
}
