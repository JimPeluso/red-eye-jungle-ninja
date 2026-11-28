/* Particles and pop-up text. */
'use strict';
/* ---------- effects ---------- */
function puff(x, y, c, n) {
  for (let i = 0; i < n; i++)
    parts.push({ x, y, vx: rnd(-3, 3), vy: rnd(-4, 1), g: 0.15, life: rnd(20, 34), max: 34, r: rnd(3, 7), c });
}
function dust(x, y, n) {
  for (let i = 0; i < n; i++)
    parts.push({
      x: x + rnd(-10, 10),
      y,
      vx: rnd(-1.5, 1.5),
      vy: rnd(-1.8, -0.4),
      g: 0.04,
      life: rnd(14, 24),
      max: 24,
      r: rnd(2, 4),
      c: 'rgba(240,230,200,.8)',
    });
}
function sparkle(x, y) {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 6.283;
    parts.push({ x, y, vx: Math.cos(a) * 2.4, vy: Math.sin(a) * 2.4, g: 0, life: 16, max: 16, r: 2.5, c: '#fff3a8' });
  }
}
/** A firework burst: an expanding ring, then sparks in the given colours that shoot out, slow down, droop and fade.
    Faster bursts (speed over 6) get bigger sparks. */
function firework(x, y, cols, n, speed) {
  parts.push({ ring: true, x, y, vx: 0, vy: 0, g: 0, r: 4, gr: speed * 1.7, lw: 5, life: 18, max: 18, c: cols[0] });
  const big = speed > 6 ? 1.5 : 1;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.283 + rnd(-0.12, 0.12),
      v = speed * rnd(0.75, 1.05);
    parts.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      g: 0.05,
      drag: 0.95,
      life: rnd(36, 52),
      max: 52,
      r: rnd(2.5, 4.5) * big,
      c: cols[i % cols.length],
    });
  }
}
function pop(x, y, t, c) {
  pops.push({ x, y, t, c, life: 60 });
}
function fx() {
  for (const q of parts) {
    q.x += q.vx;
    q.y += q.vy;
    q.vy += q.g;
    if (q.gr) q.r += q.gr * (q.life / q.max); // a firework's ring grows fast, then slows
    if (q.drag) {
      q.vx *= q.drag;
      q.vy *= q.drag;
    }
    q.life--;
  }
  parts = parts.filter(q => q.life > 0);
  for (const q of pops) {
    q.y -= 0.7;
    q.life--;
  }
  pops = pops.filter(q => q.life > 0);
  if (shake > 0) shake--;
  for (const b of bolts) b.life--;
  bolts = bolts.filter(b => b.life > 0);
  if (flash > 0) flash--;
}
