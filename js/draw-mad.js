/* Drawing the mad moves: their looks (LOOKS), and each part's drawing: ground spots, sky drops, the big wave, the
   sweep and the roller. */
'use strict';
/* Looks: how each mad move looks and lands, by the name in its `look` (MAD in mad.js). A new move that reuses a part
   usually needs only a new look here: colours, and for something new one small drawing.
   - Ground spots: draw(z) draws the whole spot, the warning and the eruption.
   - Sky drops: ring is the colour of the warning ring and the bits trickling down ('r, g, b'), draw(x, y) draws the
     thing that falls.
   - Ground spots and sky drops, when they go off (erupt() in mad.js): shake (how hard the screen shakes), dust
     (puffs), spark, bits (the colours of the bits that fly up) and sound.
   - Big wave: draw(w) draws it, using cols (curlWave: edge, body, shine and foam; mudWave: edge, body, shine and
     blobs).
   - Sweep: glow is the colour of the guide line and trail ('r, g, b'), cols the thing's own colours (dark to
     light), and draw(w, y, r, L) draws it at height y and size r (r is 30 when it's fully formed).
   - Roller: draw(w) draws it all. */
const LOOKS = {
  vines: { draw: drawVines, shake: 6, dust: 10, sound: 'whoosh' }, // Moss
  lightning: { draw: drawLightning, shake: 5, spark: true, sound: 'zap' }, // Thunder
  flame: { draw: drawFlame }, // the Fire Snake's little flames are ground spots too (draw-snake-kinds.js)
  fireball: {
    ring: '255, 170, 60', // orange sparks
    draw: drawFireball,
    shake: 4,
    dust: 10,
    bits: ['#ff6a2a', '#ffd24a', '#e8481c'],
    sound: 'thud',
  }, // Ember
  rock: {
    ring: '232, 224, 200', // dusty pebbles
    draw: drawFallingRock,
    shake: 7,
    dust: 10,
    bits: ['#6b6f6c', '#8a8f8b', '#4f5450'],
    sound: 'thud',
  }, // Shadow
  water: { draw: curlWave, cols: ['#0b3a40', '#1f8f8a', '#56c7bf', '#e3fff7'] }, // Tide
  fang: { glow: '199, 162, 255', cols: ['#3a2258', '#c7a2ff', '#ffffff'], draw: crescent }, // Master Fang
  spikes: { draw: drawSpikeBall }, // the Spike King
  fog: { glow: '170, 120, 240', cols: ['#2e1656', '#8456cf', '#c4a2ff'], draw: cloud, bubbles: true }, // Venom
  mud: { draw: mudWave, cols: ['#2a1a0a', '#6b4a24', '#94703f', '#4a3016'] }, // Bog
  sand: { glow: '230, 190, 120', cols: ['#7a4a1a', '#d4a258', '#f6dca0'], draw: cloud, streaks: true }, // Dune
  crystal: {
    ring: '150, 225, 255', // glints of crystal light
    draw: drawCrystal,
    shake: 4,
    dust: 6,
    bits: ['#8ae0ff', '#ffffff', '#4a6ae0'],
    sound: 'clang',
  }, // Crystal
  firewall: { draw: fireWall, cols: ['#e8481c', '#ff9f43', '#ffe14d'] }, // Inferno
  gas: { glow: '150, 230, 80', cols: ['#1f4a0a', '#6cc22e', '#d4ff8a'], draw: cloud, bubbles: true }, // Toxic
};

function drawZones() {
  for (const z of zones)
    if (z.sky) drawSkyDrop(z, LOOKS[z.kind]);
    else LOOKS[z.kind].draw(z);
}
/* Moss's Vine Grab: a patch of leaves that rustles harder as the vines get closer, then four vines shoot up,
   sway, and sink back down. */
function drawVines(z) {
  const up = z.t - z.warn;
  if (up < 0) {
    const k = z.t / z.warn;
    ctx.fillStyle = 'rgba(40, 90, 20, 0.35)';
    ell(z.x, GY + 3, z.w / 2, 7);
    for (let i = 0; i < 5; i++) {
      const x = z.x - z.w / 2 + 10 + (i * (z.w - 20)) / 4;
      const wig = Math.sin(T * 0.9 + i * 1.7) * (0.08 + 0.3 * k);
      ctx.save();
      ctx.translate(x, GY + 2);
      ctx.rotate((i - 2) * 0.32 + wig);
      ctx.fillStyle = '#1d3d0f';
      ell(0, -9, 6.5, 12.5);
      ctx.fillStyle = i % 2 ? '#5aa52c' : '#7cc63f';
      ell(0, -9, 5, 11);
      ctx.restore();
    }
    return;
  }
  const rise = Math.min(1, up / 6);
  const sink = Math.min(1, (z.warn + z.act + 14 - z.t) / 14);
  const h = z.h * rise * sink;
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const x = z.x - z.w / 2 + 12 + (i * (z.w - 24)) / 3;
    const sway = Math.sin(T * 0.2 + i * 1.3) * 6;
    ctx.beginPath();
    ctx.moveTo(x, GY + 4);
    ctx.quadraticCurveTo(x - 12 + sway, GY - h * 0.5, x + sway, GY - h);
    ctx.strokeStyle = '#1d3d0f';
    ctx.lineWidth = 12;
    ctx.stroke();
    ctx.strokeStyle = i % 2 ? '#4f9a2a' : '#62b034';
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.fillStyle = '#86cc4e';
    ell(x + sway + 7, GY - h * 0.62, 7, 3.5);
    ell(x + sway - 7, GY - h * 0.34, 7, 3.5);
    ctx.fillStyle = '#d9f27a';
    circle(x + sway, GY - h, 3.5);
  }
}

/* Thunder's Lightning Call: a circle on the ground that glows and crackles (a gentle pulse, no flashing), then a bolt. */
function drawLightning(z) {
  const up = z.t - z.warn;
  if (up < 0) {
    const k = z.t / z.warn,
      pulse = 0.6 + 0.4 * Math.sin(z.t * 0.25);
    ctx.fillStyle = `rgba(255, 236, 120, ${(0.12 + 0.3 * k * pulse).toFixed(3)})`;
    ell(z.x, GY + 2, z.w / 2, 8);
    ctx.strokeStyle = `rgba(255, 245, 170, ${(0.35 + 0.5 * k).toFixed(3)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(z.x, GY + 2, z.w / 2, 8, 0, 0, 6.2832);
    ctx.stroke();
    if (z.t % 8 < 4) {
      ctx.strokeStyle = `rgba(255, 250, 200, ${(0.4 + 0.5 * k).toFixed(3)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const x = z.x + Math.sin(z.t * 1.7) * z.w * 0.3;
      ctx.moveTo(x, GY - 2);
      ctx.lineTo(x + 5, GY - 10);
      ctx.lineTo(x - 2, GY - 14);
      ctx.lineTo(x + 4, GY - 22);
      ctx.stroke();
    }
    return;
  }
  if (up < z.act) bolt({ x: z.x, y: GY, life: Math.max(1, z.act - up) });
}

/* Sky drops (Fire Rain, Cave-in): a shadow grows on the ground with bits trickling down onto it, then the thing
   drops in during the last 12 frames of the warning, lands, and fades. */
function drawSkyDrop(z, L) {
  const up = z.t - z.warn;
  if (up < 0) {
    const k = Math.min(1, z.t / Math.min(z.warn, 48)),
      rx = (z.w / 2) * (0.4 + 0.6 * k),
      rgb = L.ring;
    ctx.fillStyle = `rgba(0, 0, 0, ${(0.15 + 0.3 * k).toFixed(3)})`;
    ell(z.x, GY + 2, rx, 6);
    // a bright ring round the shadow, so it shows up on dark ground too (steady, never flashing)
    ctx.strokeStyle = `rgba(${rgb}, ${(0.35 + 0.55 * k).toFixed(3)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(z.x, GY + 2, rx + 2, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    if (-up <= 12) {
      const f = 1 - -up / 12;
      L.draw(z.x, TOP + (GY - 22 - TOP) * f * f);
    } else {
      // pebbles or sparks trickling down onto the spot: something is coming from up there
      ctx.fillStyle = `rgba(${rgb}, ${(0.4 + 0.5 * k).toFixed(3)})`;
      const fall = GY - 10 - TOP;
      for (let i = 0; i < 4; i++)
        circle(z.x + ((i * 23) % 36) - 18, TOP + ((z.t * 5 + i * fall * 0.25) % fall), 2.5 + (i % 2));
    }
    return;
  }
  const fade = Math.min(1, (z.warn + z.act + 14 - z.t) / 14);
  ctx.save();
  ctx.globalAlpha *= fade;
  L.draw(z.x, GY - 16);
  ctx.restore();
}
function drawFallingRock(x, y) {
  ctx.fillStyle = '#3e423f';
  ell(x, y, 22, 17);
  ctx.fillStyle = '#7a807b';
  ell(x - 1, y - 1, 19, 14);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ell(x - 7, y - 7, 7, 3);
  ctx.strokeStyle = '#3e423f';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x + 2, y - 10);
  ctx.lineTo(x + 6, y);
  ctx.lineTo(x + 2, y + 6);
  ctx.stroke();
}
/** Crystal Rain: a crystal shard, point down, outlined, with a pale facet and a shine. */
function drawCrystal(x, y) {
  const shard = (w, h, c) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x - w, y - h * 0.2);
    ctx.lineTo(x - w * 0.45, y - h);
    ctx.lineTo(x + w * 0.45, y - h);
    ctx.lineTo(x + w, y - h * 0.2);
    ctx.closePath();
    ctx.fill();
  };
  shard(14, 24, '#101040');
  shard(11, 20.5, '#5ab8f0');
  ctx.fillStyle = '#d8f4ff';
  ctx.beginPath();
  ctx.moveTo(x, y + 20.5);
  ctx.lineTo(x - 11, y - 4);
  ctx.lineTo(x - 5, y - 20.5);
  ctx.lineTo(x, y - 20.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ell(x - 4, y - 12, 2, 5);
}
function drawFireball(x, y) {
  ctx.fillStyle = '#e8481c';
  flameShape(x, y - 6, 9, 30);
  ctx.fillStyle = '#ff6a2a';
  circle(x, y, 15);
  ctx.fillStyle = '#ffd24a';
  circle(x - 2, y - 2, 8);
}

/* A curling wave (Tide's Tidal Wave, Bog's Mud Wave): front edge on the left. While it's still rising (the warning)
   it stands behind the boss. */
function curlWave(w) {
  const x = w.x,
    h = Math.max(4, w.h),
    [edge, body, shine, foam] = LOOKS[w.look].cols;
  ctx.fillStyle = edge;
  ctx.beginPath();
  ctx.moveTo(x + 80, GY + 6);
  ctx.lineTo(x + 80, GY - h * 0.75);
  ctx.quadraticCurveTo(x + 35, GY - h * 1.08, x - 8, GY - h);
  ctx.quadraticCurveTo(x - 40, GY - h * 0.92, x - 34, GY - h * 0.52);
  ctx.quadraticCurveTo(x - 20, GY - h * 0.62, x - 14, GY - h * 0.42);
  ctx.lineTo(x - 34, GY + 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(x + 76, GY + 6);
  ctx.lineTo(x + 76, GY - h * 0.7);
  ctx.quadraticCurveTo(x + 34, GY - h * 1.0, x - 6, GY - h * 0.92);
  ctx.quadraticCurveTo(x - 32, GY - h * 0.84, x - 28, GY - h * 0.55);
  ctx.lineTo(x - 28, GY + 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = shine;
  ell(x + 30, GY - h * 0.5, 24, h * 0.18);
  ctx.fillStyle = foam;
  for (let i = 0; i < 6; i++)
    circle(x - 26 + i * 16 + Math.sin(T * 0.3 + i) * 2, GY - h * (0.86 + 0.08 * Math.sin(i)), 4.5);
}

/* Bog's Mud Wave: a lumpy mound of mud with a sloping back and a lip curling forward, dark blobs in it and drips
   falling off the lip. Its crest is at its height (w.h) over the part that hurts. */
function mudWave(w) {
  const x = w.x,
    h = Math.max(4, w.h),
    [edge, body, shine, blob] = LOOKS[w.look].cols;
  const mound = grow => {
    ctx.beginPath();
    ctx.moveTo(x + 72 + grow, GY + 6);
    ctx.quadraticCurveTo(x + 50 + grow, GY - h * 0.6, x + 10, GY - h - grow);
    ctx.quadraticCurveTo(x - 24 - grow, GY - h * 1.06 - grow, x - 36 - grow, GY - h * 0.6);
    ctx.quadraticCurveTo(x - 24, GY - h * 0.66, x - 20 + grow, GY - h * 0.48);
    ctx.quadraticCurveTo(x - 34 - grow, GY - h * 0.15, x - 32 - grow, GY + 6);
    ctx.closePath();
    ctx.fill();
  };
  ctx.fillStyle = edge;
  mound(3);
  ctx.fillStyle = body;
  mound(0);
  ctx.fillStyle = shine;
  ell(x + 24, GY - h * 0.55, 18, h * 0.12);
  ctx.fillStyle = blob;
  for (const [dx, dy, r] of [
    [-8, 0.3, 6],
    [14, 0.75, 4.5],
    [36, 0.25, 5],
    [2, 0.85, 3.5],
  ])
    ell(x + dx, GY - h * dy, r, r * 0.7);
  // drips off the lip
  for (let i = 0; i < 3; i++) {
    const fall = (T * 1.6 + i * 9) % 26;
    circle(x - 34 + i * 5, GY - h * 0.6 + fall, 3 - fall * 0.08);
  }
}

/* Inferno's Fire Wall: a row of tall flickering flames on a glowing base, as wide as the part that hurts. The tips
   of the back flames never dip below its height, so it never looks lower than it is. */
function fireWall(w) {
  const h = Math.max(4, w.h),
    [red, orange, yellow] = LOOKS[w.look].cols;
  ctx.fillStyle = 'rgba(255, 120, 40, 0.35)';
  ell(w.x + 2, GY + 2, 42, 7);
  for (const [c, k, wide] of [
    [red, 1.2, 9],
    [orange, 0.85, 6.5],
    [yellow, 0.5, 3.5],
  ])
    for (let i = 0; i < 5; i++) {
      const flick = 0.95 + 0.07 * Math.sin(T * 0.5 + i * 2.1); // 0.88 to 1.02
      ctx.fillStyle = c;
      flameShape(w.x - 26 + i * 14, GY + 2, wide, h * k * flick * (i % 2 ? 0.95 : 1));
    }
}

/* The sweep (Master Fang's Fang Slash). While it forms (the warning) it grows in front of the boss and a dashed line
   shows how high it will fly; then it flies left with a fading trail. */
function drawSweep(w) {
  const L = LOOKS[w.look],
    y = GY - w.y,
    k = w.warn > 0 ? 1 - w.warn / MAD_WARN : 1,
    r = 30 * (0.35 + 0.65 * k);
  if (w.warn > 0) {
    ctx.save();
    ctx.strokeStyle = `rgba(${L.glow}, ${(0.25 + 0.4 * k).toFixed(3)})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([14, 12]);
    ctx.beginPath();
    ctx.moveTo(Math.max(0, cam), y);
    ctx.lineTo(w.x - 24, y);
    ctx.stroke();
    ctx.restore();
  } else
    for (let i = 1; i <= 3; i++) {
      ctx.fillStyle = `rgba(${L.glow}, ${(0.24 - i * 0.06).toFixed(3)})`;
      ell(w.x + 8 + i * 20, y, 24 - i * 4, 20 - i * 4);
    }
  L.draw(w, y, r, L);
}
/** Poison Fog, Poison Gas and the Sandstorm: a puffy cloud, outlined, with little bubbles (or streaks of sand). Its
    bottom stays 4px or more above a ducking Red Eye's head. */
function cloud(w, y, r, L) {
  const s = r / 30,
    cx = w.x - 3,
    [dark, mid, light] = L.cols,
    puffs = [
      [0, 0, 22],
      [-20, 3, 16],
      [20, 3, 16],
      [-9, -14, 15],
      [10, -13, 14],
    ];
  const bob = i => (Math.sin(T * 0.25 + i * 1.9) - 1) * 1.2; // only ever up, so the bottom stays put
  ctx.fillStyle = dark;
  puffs.forEach(([dx, dy, pr], i) => circle(cx + dx * s, y + (dy + bob(i)) * s, (pr + 3) * s));
  ctx.fillStyle = mid;
  puffs.forEach(([dx, dy, pr], i) => circle(cx + dx * s, y + (dy + bob(i)) * s, pr * s));
  ctx.fillStyle = light;
  puffs.forEach(([dx, dy, pr], i) => circle(cx + (dx - 3) * s, y + (dy - 4 + bob(i)) * s, pr * 0.45 * s));
  if (L.bubbles)
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 ? light : dark;
      circle(cx + (((T * 0.7 + i * 17) % 44) - 22) * s, y + (-18 - ((T * 0.4 + i * 11) % 14)) * s, 2.6 * s);
    }
  if (L.streaks) {
    ctx.strokeStyle = light;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const x = cx + (((T * 4 + i * 23) % 60) - 30) * s,
        yy = y + (i * 9 - 9) * s;
      ctx.beginPath();
      ctx.moveTo(x, yy);
      ctx.lineTo(x + 16 * s, yy);
      ctx.stroke();
    }
    ctx.fillStyle = dark;
    for (let i = 0; i < 5; i++) circle(cx + (((T * 5 + i * 29) % 70) - 35) * s, y + ((i * 13) % 34) * s - 17 * s, 1.5);
  }
}
/** Master Fang's sword wave: a crescent, outlined, with a bright edge. */
function crescent(w, y, r, L) {
  ctx.lineCap = 'round';
  for (const [c, lw, a0, a1] of [
    [L.cols[0], 13, 2.0, 4.28],
    [L.cols[1], 8, 2.0, 4.28],
    [L.cols[2], 3, 2.3, 3.98],
  ]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(w.x + r * 0.6, y, r, a0, a1);
    ctx.stroke();
  }
}

/* The Spike King's Spike Ball: the cobra curled up tight (a coiled spiral) inside a ring of spikes, with its angry
   eyes peeking out on top. It pops out of the poof and shakes while the spikes bristle (the warning), then rolls:
   the coil and spikes turn, the eyes stay on top looking where it's going. */
function drawSpikeBall(w) {
  const C = B.col,
    R = w.r,
    warm = w.warn > 0,
    s = warm ? 0.5 + 0.5 * Math.min(1, (MAD_WARN - w.warn) / 10) : 1,
    x = w.x + (warm ? Math.sin(T * 1.7) * 2.5 : 0),
    y = GY - R * s;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ell(w.x, GY + 2, R * 0.95, 6);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.rotate(w.spin);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * 6.283,
      tip = R + 15 + (warm ? 2 + Math.sin(T * 0.8 + i) * 2 : 0);
    for (const [c, wide, out] of [
      [C.o, 0.24, 3],
      ['#ff6a4d', 0.17, 0],
    ]) {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - wide) * (R - 3), Math.sin(a - wide) * (R - 3));
      ctx.lineTo(Math.cos(a) * (tip + out), Math.sin(a) * (tip + out));
      ctx.lineTo(Math.cos(a + wide) * (R - 3), Math.sin(a + wide) * (R - 3));
      ctx.fill();
    }
  }
  ctx.fillStyle = C.o;
  circle(0, 0, R + 3);
  ctx.fillStyle = C.b;
  circle(0, 0, R);
  // the coiled body: a spiral, outlined, with its belly stripe
  for (const [c, lw] of [
    [C.o, 11],
    [C.a, 8],
    [C.bl, 2.5],
  ]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let a = 0; a <= 11.5; a += 0.25) {
      const r = 3 + a * 2.6;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.stroke();
  }
  ctx.restore();
  // the head peeking out on top
  const d = w.vx > 0 ? 1 : -1,
    hx = x + d * 10 * s,
    hy = y - 14 * s;
  ctx.fillStyle = C.o;
  ell(hx, hy, 20 * s, 14 * s);
  ctx.fillStyle = C.h;
  ell(hx, hy, 17 * s, 11 * s);
  for (const e of [-7, 7]) {
    ctx.fillStyle = '#ff3b30';
    circle(hx + e * s, hy, 4.6 * s);
    ctx.fillStyle = '#14110f';
    ell(hx + (e + d * 1.2) * s, hy, 1.3 * s, 3.4 * s);
  }
  ctx.strokeStyle = C.o;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(hx - 12 * s, hy - 9 * s);
  ctx.lineTo(hx - 3 * s, hy - 5 * s);
  ctx.moveTo(hx + 12 * s, hy - 9 * s);
  ctx.lineTo(hx + 3 * s, hy - 5 * s);
  ctx.stroke();
}
