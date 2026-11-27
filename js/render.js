/* Lightning, health bars, shock waves, grass, then world() and render() put each frame together. */
'use strict';
function bolt(b) {
  const n = 10,
    top = TOP - 20,
    a = Math.min(1, b.life / 10),
    pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([
      b.x + (i === 0 || i === n ? 0 : (hh(b.x + i * 7 + Math.floor(b.life / 3)) - 0.5) * 40),
      top + (b.y - top) * t,
    ]);
  }
  ctx.globalAlpha = a;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.strokeStyle = 'rgba(120,220,255,.6)';
  ctx.lineWidth = 13;
  ctx.stroke();
  ctx.strokeStyle = '#fffde0';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,250,180,.5)';
  circle(b.x, b.y, 28);
  ctx.globalAlpha = 1;
}
function hpBar(s) {
  const y = s.y - (s.type >= 4 ? 96 : (s.type === 3 ? 56 + 26 * s.rear : 48) * GS),
    w = 46,
    f = s.hp / s.mhp;
  ctx.fillStyle = 'rgba(10,10,10,.65)';
  rr(s.x - w / 2 - 2, y - 2, w + 4, 9, 4);
  ctx.fillStyle = f > 0.5 ? '#7ddc4a' : f > 0.25 ? '#ffc928' : '#ff4a3d';
  rr(s.x - w / 2, y, Math.max(3, w * f), 5, 2.5);
}
function wave(w) {
  ctx.save();
  if (w.vx > 0) {
    ctx.translate(2 * w.x, 0);
    ctx.scale(-1, 1);
  }
  const y = GY - 22;
  ctx.lineCap = 'round';
  ctx.strokeStyle = w.c || 'rgba(199,162,255,.85)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(w.x + 12, y, 24, 2.1, 4.18);
  ctx.stroke();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(w.x + 12, y, 24, 2.3, 3.98);
  ctx.stroke();
  ctx.fillStyle = 'rgba(199,162,255,.35)';
  circle(w.x + 18, y, 6);
  circle(w.x + 30, y - 6, 4);
  ctx.restore();
}

function grass(v0, v1, cx) {
  for (const bl of BL) {
    if (bl.x < v0 || bl.x > v1) continue;
    let sw = Math.sin(T * 0.04 + bl.x * 0.05) * 3;
    const d = bl.x - cx;
    if (Math.abs(d) < 22 && p.on) sw += (d > 0 ? 1 : -1) * 7;
    ctx.fillStyle = bl.c;
    ctx.beginPath();
    ctx.moveTo(bl.x - 3.5, GY + 3);
    ctx.quadraticCurveTo(bl.x + bl.l * 0.3, GY - bl.h * 0.55, bl.x + bl.l + sw, GY - bl.h);
    ctx.quadraticCurveTo(bl.x + 2 + bl.l * 0.3, GY - bl.h * 0.5, bl.x + 3.5, GY + 3);
    ctx.fill();
  }
}

function world() {
  const v0 = cam - 120,
    v1 = cam + viewW + 120,
    cx = p.x + p.w / 2;
  for (let i = 0; i < SEGS.length - 1; i++) {
    const a = SEGS[i][1],
      b = SEGS[i + 1][0];
    if (b < v0 || a > v1) continue;
    if (PAL.water || PAL.lava) water(Math.max(a, v0), Math.min(b, v1));
    else if (PAL.clouds) clouds(Math.max(a, v0), Math.min(b, v1));
    else {
      ctx.fillStyle = ABYSS;
      ctx.fillRect(a - 4, GY - 6, b - a + 8, WH - GY + 60);
    }
  }
  for (const s of SEGS) if (s[1] > v0 && s[0] < v1) ground(s, Math.max(s[0], v0), Math.min(s[1], v1));
  if (boss && B) {
    templeBack();
    if (!B.cfg.duel) cobraBody();
    templeFront();
  }
  for (const q of PLATS) {
    const m = q[3] || 0;
    if (q[0] + q[2] + m < v0 || q[0] - m > v1) continue;
    const o = pp(q, LT);
    log(o.x, o.y, q[2], !!(q[3] || q[4]));
  }
  for (const [x, a, b] of SIGNS) if (x > v0 && x < v1) sign(x, a, b);
  LANT.forEach((l, i) => {
    if (l[0] > v0 && l[0] < v1) lantern(l[0], l[1], lit[i]);
  });
  if (GATE + 220 > v0 && GATE - 220 < v1) gate();
  for (const q of pouches) if (!q.got && q.x > v0 && q.x < v1) pouch(q);
  for (const it of items) if (!it.got) heartItem(it);
  for (const c of coins) if (!c.got && c.x > v0 && c.x < v1) coin(c);
  for (const s of snakes)
    if (s.alive && s.x > v0 - 60 && s.x < v1 + 60) {
      if (s.type >= 4) evilNinja(s);
      else snake(s);
      if (s.hp < s.mhp && !s.dy) hpBar(s);
    }
  if (boss && B && B.cfg.duel) duelFang();
  else if (boss && B) {
    if (B.st === 'defeat') {
      cobraHead();
      if (B.cfg.rider) fang();
    } else {
      if (B.cfg.rider) fang();
      cobraHead();
    }
  }
  if (PAL.dark) {
    const g = ctx.createRadialGradient(cx, p.y + 28, 6, cx, p.y + 28, 110);
    g.addColorStop(0, 'rgba(255,236,190,.35)');
    g.addColorStop(1, 'rgba(255,236,190,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - 110, p.y - 82, 220, 220);
  }
  ninja();
  for (const c of clones) drawClone(c);
  for (const v of spits) {
    if (v.star) shuriken(v.x, v.y, 9, T * 0.5);
    else if (v.spike) spikeShot(v);
    else if (v.ice) iceBall(v);
    else venom(v);
  }
  for (const w of waves) wave(w);
  for (const s of stars) shuriken(s.x, s.y, 9, s.r);
  for (const q of parts) {
    ctx.globalAlpha = Math.max(0, q.life / q.max);
    ctx.fillStyle = q.c;
    circle(q.x, q.y, q.r);
  }
  ctx.globalAlpha = 1;
  grass(v0, v1, cx);
  for (const b of bolts) bolt(b);
  ctx.font = "20px 'Lilita One',system-ui,sans-serif";
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  for (const q of pops) {
    ctx.globalAlpha = Math.min(1, q.life / 20);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#14110f';
    ctx.strokeText(q.t, q.x, q.y);
    ctx.fillStyle = q.c;
    ctx.fillText(q.t, q.x, q.y);
  }
  ctx.globalAlpha = 1;
}

function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = PAL.sky[0];
  ctx.fillRect(0, 0, cw, ch);
  ctx.setTransform(dpr * sc, 0, 0, dpr * sc, 0, dpr * offY);
  ctx.fillStyle = SKY;
  ctx.fillRect(0, TOP, viewW + 1, WH - TOP);
  const sun = ctx.createRadialGradient(viewW * 0.7, 210, 10, viewW * 0.7, 210, 300);
  sun.addColorStop(0, 'rgba(' + PAL.sun + ',' + PAL.sunA + ')');
  sun.addColorStop(1, 'rgba(' + PAL.sun + ',0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, TOP, viewW, WH - TOP);
  ctx.fillStyle = 'rgba(255,252,220,.07)';
  for (let i = 0; i < 3; i++) {
    const x = viewW * (0.45 + i * 0.14) - ((cam * 0.1) % 60);
    ctx.beginPath();
    ctx.moveTo(x, TOP);
    ctx.lineTo(x + 60, TOP);
    ctx.lineTo(x - 90, 440);
    ctx.lineTo(x - 170, 440);
    ctx.fill();
  }
  hills(0.12, PAL.hA, 300, 28, 14);
  layer(0.3, 520, TB, treeB);
  hills(0.3, PAL.tB, 372, 10, 6);
  const mist = ctx.createLinearGradient(0, 330, 0, 440);
  mist.addColorStop(0, 'rgba(' + PAL.mist + ',0)');
  mist.addColorStop(1, 'rgba(' + PAL.mist + ',.22)');
  ctx.fillStyle = mist;
  ctx.fillRect(0, 330, viewW, 110);
  layer(0.55, 760, TC, treeC);
  hills(0.55, PAL.hC, 424, 8, 5);
  ctx.save();
  const sx = shake ? (Math.random() - 0.5) * shake : 0,
    sy = shake ? (Math.random() - 0.5) * shake * 0.6 : 0;
  ctx.translate(-cam + sx, sy);
  world();
  ctx.restore();
  layer(0.9, 312, CF, canopy);
  layer(1.2, 820, VN, vine);
  if (flash > 0) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = 'rgba(255,255,235,' + ((flash / 14) * 0.65).toFixed(3) + ')';
    ctx.fillRect(0, 0, cw, ch);
  }
}
