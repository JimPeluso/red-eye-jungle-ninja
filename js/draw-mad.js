/* Drawing the mad moves: ground spots (rustling leaves as the warning, then vines). */
'use strict';
function drawZones() {
  for (const z of zones)
    if (z.kind === 'vines') drawVines(z);
    else if (z.kind === 'flame') drawFlame(z);
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
