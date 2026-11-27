/* Drawing the newer snakes (kinds 11-15): their colours, sprites and animations, and the Fire Snake's flames. */
'use strict';
const NEW_SKIN = {
  drop: { o: '#2f4a12', a: '#a8c23a', b: '#c8d84a', s: '#5c7a1c', j: '#f0f5b0' },
  spring: { o: '#0e4a4a', a: '#ff9f43', b: '#2ec4b6', s: '#ffd166', j: '#ffe8c2' },
  fire: { o: '#5a1408', a: '#e8481c', b: '#ff6a2a', s: '#ffd24a', j: '#ffe0a0' },
  shield: { o: '#3a2410', a: '#8a6a3a', b: '#a07a4a', s: '#5c3e1c', j: '#e8d2a8' },
  ghost: { o: '#5a4a8a', a: '#d7c8ff', b: '#efe6ff', s: '#b8a6f0', j: '#ffffff' },
};
const newSkin = s =>
  s.drop
    ? NEW_SKIN.drop
    : s.spring
      ? NEW_SKIN.spring
      : s.fire
        ? NEW_SKIN.fire
        : s.shield
          ? NEW_SKIN.shield
          : s.ghost
            ? NEW_SKIN.ghost
            : null;

/** How see-through a Ghost Snake is right now (1 = solid). */
function ghostAlpha(s) {
  const k = ghostPhase(s);
  if (k < 110) return 1;
  if (k < 130) return 1 - ((k - 110) / 20) * 0.85;
  if (k < 180) return 0.15;
  return 0.15 + ((k - 180) / 20) * 0.85;
}

/* Drop Snake, still up on its vine: hangs head-down and sways; shakes hard just before it drops. */
function drawHanging(s, C) {
  const top = s.y - s.off - 62,
    shake = s.ns === 1 ? Math.sin(s.t * 1.4) * 3 : 0,
    sway = i => Math.sin(s.t * 0.05) * 5 * (i / 8) + shake;
  ctx.strokeStyle = '#2f5a14';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(s.x, TOP - 10);
  ctx.lineTo(s.x + sway(0), top);
  ctx.stroke();
  ctx.fillStyle = '#5aa52c';
  ell(s.x + 6, top - 40, 6, 3);
  ell(s.x - 6, top - 90, 6, 3);
  const pts = [];
  for (let i = 0; i <= 8; i++)
    pts.push([s.x + sway(i) + Math.sin(i * 0.9 + s.t * 0.1) * 2, top + i * 6.5, 8 - i * 0.25]);
  ctx.fillStyle = C.o;
  for (const [x, y, r] of pts) circle(x, y, r + 2.2);
  pts.forEach(([x, y, r], j) => {
    ctx.fillStyle = j % 2 ? C.a : C.b;
    circle(x, y, r);
  });
  const [hx, hy] = pts[8];
  ctx.fillStyle = C.o;
  ell(hx, hy + 8, 12, 14);
  ctx.fillStyle = C.b;
  ell(hx, hy + 8, 10, 12);
  ctx.fillStyle = s.ns === 1 ? '#ff3b30' : '#ffe14d';
  circle(hx - 4, hy + 10, 3);
  circle(hx + 4, hy + 10, 3);
  ctx.fillStyle = '#14110f';
  ell(hx - 4, hy + 10, 1, 2.4);
  ell(hx + 4, hy + 10, 1, 2.4);
  if (s.t % 70 < 12) {
    ctx.strokeStyle = '#e8302a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hx, hy + 20);
    ctx.lineTo(hx, hy + 28);
    ctx.lineTo(hx - 3, hy + 32);
    ctx.moveTo(hx, hy + 28);
    ctx.lineTo(hx + 3, hy + 32);
    ctx.stroke();
  }
}

/* Spring Snake: a stack of rings with a head on top. Squashes while coiling, stretches in the air, wobbles on landing. */
function drawSpring(s, C) {
  const base = s.y - s.off;
  let k = 1;
  if (s.ns === 1) k = 1 - 0.42 * (1 - s.nt / 24);
  else if (s.ns === 2) k = 1.25;
  else if (s.nt > 0) k = 1 + Math.sin(s.nt * 0.9) * 0.12;
  if (!s.off) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ell(s.x, s.y + 1, 22, 4);
  }
  for (let i = 0; i < 5; i++) {
    const y = base - (6 + i * 9) * k;
    ctx.fillStyle = C.o;
    ell(s.x, y, 22 - i * 1.6, 7.5);
    ctx.fillStyle = i % 2 ? C.a : C.b;
    ell(s.x, y - 1, 20 - i * 1.6, 5.5);
  }
  const d = s.dir,
    hy = base - (6 + 5 * 9) * k - 8,
    hx = s.x + d * 6;
  ctx.fillStyle = C.o;
  ell(hx, hy, 15, 12);
  ctx.fillStyle = C.a;
  ell(hx, hy, 13, 10);
  ctx.fillStyle = C.j;
  ell(hx + d * 4, hy + 4, 8, 4);
  ctx.fillStyle = '#ffe14d';
  circle(hx + d * 5, hy - 3, 3.5);
  ctx.fillStyle = '#14110f';
  ell(hx + d * 5.5, hy - 3, 1.1, 2.6);
  if (s.ns === 1) {
    // "boing" lines while it winds up
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s.x + side * 28, base - 18);
      ctx.lineTo(s.x + side * 36, base - 30);
      ctx.stroke();
    }
  }
}

/** Extra bits drawn on top of a newer snake's body: the Fire Snake's flame crest, the shield, the ghost's glow. */
function decorateNewSnake(s, hx, hy, d) {
  if (s.fire) {
    for (let i = 0; i < 3; i++) {
      const x = s.x - d * (4 + i * 16),
        y = s.y - 20,
        h = 9 + Math.sin(T * 0.5 + i * 2) * 3;
      ctx.fillStyle = '#ff6a2a';
      flameShape(x, y, 6, h + 4);
      ctx.fillStyle = '#ffd24a';
      flameShape(x, y, 3.5, h);
    }
  }
  if (s.shield) {
    const near = p && Math.abs(p.x + 17 - s.x) < 220,
      x = hx + d * 10,
      y = hy - (near ? 8 : 4),
      r = near ? 19 : 17;
    ctx.fillStyle = s.inv > 0 ? '#fff6d0' : '#5c3e1c';
    circle(x, y, r + 3);
    ctx.fillStyle = '#b07a3c';
    circle(x, y, r);
    ctx.strokeStyle = '#7a5226';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.9, y - 5);
    ctx.lineTo(x + r * 0.9, y - 5);
    ctx.moveTo(x - r * 0.9, y + 5);
    ctx.lineTo(x + r * 0.9, y + 5);
    ctx.stroke();
    ctx.strokeStyle = '#c2261a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.45, 0.3, 5.6);
    ctx.stroke();
    ctx.fillStyle = '#ffd24a';
    circle(x, y, 3);
  }
  if (s.ghost) {
    // glowing eyes that stay visible even when it's faded
    const a = ctx.globalAlpha;
    ctx.globalAlpha = Math.max(a, 0.7);
    ctx.fillStyle = '#b8f2ff';
    circle(hx + d * 5, hy - 4, 5);
    ctx.fillStyle = '#ffffff';
    circle(hx + d * 5, hy - 4, 2.5);
    ctx.globalAlpha = a;
  }
}

/** A flame: a teardrop with its point up. */
function flameShape(x, y, w, h) {
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.quadraticCurveTo(x - w, y - h * 0.6, x, y - h);
  ctx.quadraticCurveTo(x + w, y - h * 0.6, x + w, y);
  ctx.quadraticCurveTo(x, y + w * 0.6, x - w, y);
  ctx.fill();
}
/* The Fire Snake's flames on the ground: flicker, then shrink away. */
function drawFlame(z) {
  const grow = Math.min(1, z.t / 6),
    left = Math.min(1, (z.warn + z.act + 14 - z.t) / 30),
    flick = 0.85 + Math.sin(T * 0.6 + z.x) * 0.15,
    h = z.h * grow * left * flick;
  ctx.fillStyle = '#e8481c';
  flameShape(z.x, GY + 2, z.w * 0.5, h);
  ctx.fillStyle = '#ff9f43';
  flameShape(z.x + 2, GY + 2, z.w * 0.34, h * 0.75);
  ctx.fillStyle = '#ffe14d';
  flameShape(z.x + 1, GY + 2, z.w * 0.18, h * 0.45);
}
