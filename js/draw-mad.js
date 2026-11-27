/* Drawing the mad moves: ground spots (rustling leaves as the warning, then vines). */
'use strict';
function drawZones() {
  for (const z of zones)
    if (z.kind === 'vines') drawVines(z);
    else if (z.kind === 'flame') drawFlame(z);
    else if (z.kind === 'lightning') drawLightning(z);
    else if (z.sky) drawSkyDrop(z);
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

/* Fire Rain and Cave-in: a shadow grows on the ground (with a glint high above), then the fireball or rock drops in
   during the last 12 frames of the warning, lands, and fades. */
function drawSkyDrop(z) {
  const up = z.t - z.warn;
  if (up < 0) {
    const k = Math.min(1, z.t / Math.min(z.warn, 48)),
      rx = (z.w / 2) * (0.4 + 0.6 * k),
      rgb = z.kind === 'rock' ? '232, 224, 200' : '255, 170, 60'; // dusty pebbles, or orange sparks
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
      drawFaller(z, z.x, TOP + (GY - 22 - TOP) * f * f);
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
  drawFaller(z, z.x, GY - 16);
  ctx.restore();
}
function drawFaller(z, x, y) {
  if (z.kind === 'rock') {
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
  } else {
    ctx.fillStyle = '#e8481c';
    flameShape(x, y - 6, 9, 30);
    ctx.fillStyle = '#ff6a2a';
    circle(x, y, 15);
    ctx.fillStyle = '#ffd24a';
    circle(x - 2, y - 2, 8);
  }
}

/* Tide's Tidal Wave: a curling wall of water, front edge on the left. While it's still rising (the warning) it
   stands behind Tide. */
function drawTide(w) {
  const x = w.x,
    h = Math.max(4, w.h);
  ctx.fillStyle = '#0b3a40';
  ctx.beginPath();
  ctx.moveTo(x + 80, GY + 6);
  ctx.lineTo(x + 80, GY - h * 0.75);
  ctx.quadraticCurveTo(x + 35, GY - h * 1.08, x - 8, GY - h);
  ctx.quadraticCurveTo(x - 40, GY - h * 0.92, x - 34, GY - h * 0.52);
  ctx.quadraticCurveTo(x - 20, GY - h * 0.62, x - 14, GY - h * 0.42);
  ctx.lineTo(x - 34, GY + 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1f8f8a';
  ctx.beginPath();
  ctx.moveTo(x + 76, GY + 6);
  ctx.lineTo(x + 76, GY - h * 0.7);
  ctx.quadraticCurveTo(x + 34, GY - h * 1.0, x - 6, GY - h * 0.92);
  ctx.quadraticCurveTo(x - 32, GY - h * 0.84, x - 28, GY - h * 0.55);
  ctx.lineTo(x - 28, GY + 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#56c7bf';
  ell(x + 30, GY - h * 0.5, 24, h * 0.18);
  ctx.fillStyle = '#e3fff7';
  for (let i = 0; i < 6; i++)
    circle(x - 26 + i * 16 + Math.sin(T * 0.3 + i) * 2, GY - h * (0.86 + 0.08 * Math.sin(i)), 4.5);
}
