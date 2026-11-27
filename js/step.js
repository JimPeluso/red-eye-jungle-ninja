/* One game tick: input, Red Eye physics, collisions, enemies, items, camera. */
'use strict';
/* ---------- one game tick ---------- */
function step() {
  T++;
  if (mode === 'title') {
    for (const s of snakes) moveSnake(s);
    return;
  }
  if (mode !== 'play') return;
  if (BN.t > 0) BN.t--;
  if (p.dead > 0) {
    p.dead--;
    p.vy += 0.6;
    p.y += p.vy;
    fx();
    if (!p.dead) over();
    return;
  }
  p.time++;
  p.lt++;
  LT++;
  if (p.on && p.plat && (p.plat[3] || p.plat[4])) {
    const a = pp(p.plat, LT - 1),
      b = pp(p.plat, LT);
    p.x += b.x - a.x;
    p.y += b.y - a.y;
  }
  if (p.thaw > 0) p.thaw--;
  const fz = p.frozen > 0;
  if (fz) {
    p.frozen--;
    jb = swReq = stReq = 0;
    if (!p.frozen) {
      p.thaw = 50;
      pop(p.x + 17, p.y - 16, 'Free!', '#fff');
      for (let i = 0; i < 8; i++)
        parts.push({
          x: p.x + 17 + rnd(-18, 18),
          y: p.y + rnd(0, p.h),
          vx: rnd(-3, 3),
          vy: rnd(-4, -1),
          g: 0.25,
          life: 22,
          max: 22,
          r: rnd(2, 4),
          c: '#dff6ff',
        });
    }
  }
  const L = !fz && held('L'),
    R = !fz && held('R'),
    D = !fz && held('D');
  const cr = D && p.on;
  if (cr !== p.crouch) {
    const f = p.y + p.h;
    p.crouch = cr;
    p.h = cr ? 40 : 56;
    p.y = f - p.h;
  }
  const dx = (R ? 1 : 0) - (L ? 1 : 0);
  if (dx) p.face = dx;
  p.vx += (dx * (p.crouch ? 2.2 : 5.6) - p.vx) * (p.on ? 0.3 : 0.16);
  if (Math.abs(p.vx) < 0.05) p.vx = 0;
  // coyote time: Red Eye can still jump for a few frames after running off an edge (longer on touch screens)
  if (p.on) p.coy = touchAssist ? 10 : 7;
  else if (p.coy > 0) p.coy--;
  if (jb > 0) jb--;
  if (jb > 0 && p.coy > 0) {
    if (p.crouch) {
      const f = p.y + p.h;
      p.crouch = false;
      p.h = 56;
      p.y = f - 56;
    }
    p.vy = -16.2;
    p.coy = 0;
    jb = 0;
    p.on = false;
    sfx.jump();
    dust(p.x + 17, p.y + p.h, 6);
  }
  p.vy += 0.9;
  if (!held('J') && p.vy < -9) p.vy += 0.7;
  if (p.vy > 18) p.vy = 18;
  const vy0 = p.vy;
  p.x += p.vx;
  if (p.x < 0) {
    p.x = 0;
    p.vx = 0;
  }
  if (p.x > END + 200) p.x = END + 200;
  if (boss) {
    /* the cobra's neck blocks the way, but only near the ground; a lunge that catches you is a hit, not a bulldozer */
    let wall = ARENA - 20,
      soft = false;
    if (B && !B.cfg.duel && B.st !== 'defeat' && p.y + p.h > B.hy - 40) {
      const w = B.hx + 62;
      if (B.st === 'lunge' && p.x + p.w > w && p.inv <= 0 && !p.dead) {
        hurt({ x: p.x + 40 });
        p.vx = -8;
      }
      if (w < wall) {
        wall = w;
        soft = B.st !== 'lunge';
      }
    }
    if (p.x + p.w > wall) {
      p.x = soft ? Math.max(wall - p.w, p.x - 6) : wall - p.w;
      if (p.vx > 0) p.vx = 0;
    }
    if (p.x < 10) {
      p.x = 10;
      if (p.vx < 0) p.vx = 0;
    }
  }
  const f0 = p.y + p.h;
  if (f0 > GY + 4)
    for (const s of SEGS)
      if (p.x + p.w > s[0] && p.x < s[1]) {
        p.x = p.x + p.w / 2 < (s[0] + s[1]) / 2 ? s[0] - p.w : s[1];
        p.vx = 0;
      }
  p.y += p.vy;
  const f1 = p.y + p.h,
    was = p.on;
  p.on = false;
  p.plat = null;
  if (p.vy >= 0) {
    if (f0 <= GY + 1 && f1 >= GY)
      for (const s of SEGS)
        if (p.x + p.w - 6 > s[0] && p.x + 6 < s[1]) {
          p.y = GY - p.h;
          p.vy = 0;
          p.on = true;
          p.seg = s;
          break;
        }
    if (!p.on)
      for (const q of PLATS) {
        const o = pp(q, LT),
          tol = q[3] || q[4] ? 8 : 1;
        if (f0 <= o.y + tol && f1 >= o.y && p.x + p.w - 6 > o.x && p.x + 6 < o.x + q[2]) {
          p.y = o.y - p.h;
          p.vy = 0;
          p.on = true;
          p.plat = q;
          break;
        }
      }
  }
  if (p.on && !was && vy0 > 9) dust(p.x + 17, p.y + p.h, 5);
  if (p.on && p.inv < 60) {
    if (p.plat) {
      if (!p.plat[3] && !p.plat[4]) p.safe = { x: p.x, y: p.plat[1], plat: p.plat };
    } else p.safe = { x: p.x, y: GY, seg: p.seg };
  }
  if (p.y > WH + 60) {
    fallen();
    return;
  }
  if (p.inv > 0) p.inv--;
  if (p.swcd > 0) p.swcd--;
  if (p.stcd > 0) p.stcd--;
  if (p.sw > 0) p.sw--;
  if (swReq > 0) {
    swReq--;
    if (p.swcd <= 0) {
      p.sw = 16;
      p.swcd = 22;
      swReq = 0;
      sfx.swish();
    }
  }
  if (stReq > 0) {
    stReq--;
    if (p.stcd <= 0) {
      stReq = 0;
      if (p.ammo > 0) {
        p.ammo--;
        p.stcd = 16;
        stars.push({ x: p.x + 17 + p.face * 16, y: p.y + (p.crouch ? 18 : 24), vx: p.face * 11, life: 70, r: 0 });
        sfx.toss();
      } else {
        p.stcd = 40;
        pop(p.x + 17, p.y - 16, 'No stars left!', '#fff');
        sfx.empty();
      }
    }
  }
  if (p.sup > 0) p.sup--;
  if (suReq) {
    suReq = 0;
    if ((p.sp || 0) >= 100) doSuper();
    else {
      pop(p.x + 17, p.y - 16, 'Super not ready yet', '#fff');
      sfx.empty();
    }
  }
  if (clReq) {
    clReq = 0;
    if (cloneT <= 0) {
      if ((p.sp || 0) >= 100) doClones();
      else {
        pop(p.x + 17, p.y - 16, 'Super not ready yet', '#fff');
        sfx.empty();
      }
    }
  }
  if (cloneT > 0) updClones();
  if (p.on && Math.abs(p.vx) > 0.3) p.run += Math.abs(p.vx) * 0.09;
  const cx = p.x + p.w / 2,
    cy = p.y + p.h / 2;
  p.hidden = p.crouch && inGrass(cx);
  for (const s of stars) {
    s.x += s.vx;
    s.life--;
    s.r += 0.45;
  }
  const pb = { x: p.x + 5, y: p.y + 4, w: p.w - 10, h: p.h - 4 };
  const swing = p.sw >= 3 && p.sw <= 12;
  const blade = { x: p.face > 0 ? p.x + p.w - 6 : p.x - 70, y: p.y - 10, w: 76, h: p.h + 14 };
  for (const s of snakes) {
    if (!s.alive) continue;
    if (s.sleep && !p.hidden && Math.abs(cx - s.x) < 170 && Math.abs(p.y + p.h - s.y) < 90) {
      s.sleep = false;
      s.alert = 36;
      s.dir = cx < s.x ? -1 : 1;
      sfx.hiss();
    }
    moveSnake(s);
    if (s.dy < 0 || ghostFaded(s)) continue;
    const b = ebox(s);
    if (s.rock && !s.rk) {
      if (s.inv <= 0 && swing && hit(blade, b)) {
        s.inv = 14;
        pop(s.x, s.y - 46, 'Clang!', '#dfe6ea');
        sparkle(s.x, s.y - 20);
        sfx.clang();
      }
      const sr = stars.find(q => q.life > 0 && hit({ x: q.x - 8, y: q.y - 8, w: 16, h: 16 }, b));
      if (sr) {
        sr.life = 0;
        pop(s.x, s.y - 46, 'Clang!', '#dfe6ea');
        sfx.clang();
      }
      continue;
    }
    if (swing && hit(blade, b)) {
      if (shieldFront(s, cx)) clangOff(s);
      else {
        hitEnemy(s, 2);
        if (!s.alive) continue;
      }
    }
    const st = stars.find(q => q.life > 0 && hit({ x: q.x - 8, y: q.y - 8, w: 16, h: 16 }, b));
    if (st) {
      st.life = 0;
      if ((s.type === 6 && s.atk > 0) || (s.shield && Math.sign(st.vx) === -s.dir)) {
        pop(s.x, s.y - 92, 'Clang!', '#dfe6ea');
        sparkle(st.x, st.y);
        sfx.clang();
      } else hitEnemy(s);
      if (!s.alive) continue;
    }
    if (
      s.type === 4 &&
      s.atk >= 4 &&
      s.atk <= 13 &&
      p.inv <= 0 &&
      !p.dead &&
      hit(pb, { x: s.dir > 0 ? s.x + 8 : s.x - 68, y: s.y - 72, w: 60, h: 72 })
    ) {
      hurt(s);
      continue;
    }
    if (
      s.type === 6 &&
      s.atk >= 4 &&
      s.atk <= 24 &&
      p.inv <= 0 &&
      !p.dead &&
      hit(pb, { x: s.x - 74, y: s.y - 72, w: 148, h: 72 })
    ) {
      hurt(s);
      continue;
    }
    if (hit(pb, b)) {
      if (p.vy > 1 && f0 <= b.y + 12) {
        hitEnemy(s);
        p.vy = held('J') ? -14 : -10;
        p.on = false;
      } else if (p.inv <= 0 && s.inv <= 0 && !p.dead) hurt(s);
    }
  }
  for (const v of spits) {
    v.x += v.vx;
    v.life--;
    if (v.g) v.vy += v.g;
    if (v.vy) v.y += v.vy;
    if (v.y > GY - 4) {
      v.life = 0;
      if (!v.star) puff(v.x, GY - 4, v.ice ? '#dff6ff' : v.spike ? '#d8cdb0' : '#c6ff3d', 6);
      continue;
    }
    const vb = { x: v.x - 7, y: v.y - 7, w: 14, h: 14 };
    if (swing && hit(blade, vb)) {
      v.life = 0;
      pop(v.x, v.y - 20, 'Blocked!', '#d7ff7a');
      sparkle(v.x, v.y);
      sfx.clang();
      continue;
    }
    if (v.ice) {
      if (!p.frozen && !p.dead && hit(pb, vb)) {
        v.life = 0;
        if (p.thaw > 0) sparkle(v.x, v.y);
        else freeze();
      }
    } else if (p.inv <= 0 && !p.dead && hit(pb, vb)) {
      v.life = 0;
      hurt(v);
    }
  }
  spits = spits.filter(v => v.life > 0);
  stepZones(pb);
  if (boss && B) {
    if (B.cfg.duel) duelStep();
    else bossStep();
    const b = B,
      live = b.st !== 'intro' && b.st !== 'defeat';
    for (const w of waves) {
      w.x += w.vx;
      w.life--;
      if (w.x < -60) w.life = 0;
      const wb = { x: w.x - 14, y: GY - 46, w: 28, h: 46 };
      if (swing && hit(blade, wb)) {
        w.life = 0;
        pop(w.x, GY - 70, 'Blocked!', '#bfefff');
        sparkle(w.x, GY - 24);
        sfx.clang();
        continue;
      }
      if (p.inv <= 0 && !p.dead && hit(pb, wb)) hurt(w);
    }
    waves = waves.filter(w => w.life > 0);
    if (b.cfg.duel) {
      if (live) duelHits(swing, blade, pb, f0, cx);
    } else if (live) {
      const fb = b.cfg.rider ? { x: b.hx - 12, y: b.hy - 40 - 74, w: 36, h: 74 } : { x: -1e4, y: 0, w: 0, h: 0 },
        hb = { x: b.hx - 42, y: b.hy - 30, w: 74, h: 52 },
        stuck = b.st === 'stuck' || b.st === 'dazed';
      if (swing && b.inv <= 0 && (hit(blade, fb) || (stuck && hit(blade, hb)))) bossHit(2);
      for (const st of stars) {
        if (st.life <= 0) continue;
        const sb = { x: st.x - 8, y: st.y - 8, w: 16, h: 16 };
        if (hit(sb, fb)) {
          st.life = 0;
          if (b.inv <= 0) bossHit();
        } else if (hit(sb, hb) || (st.x > b.hx + 40 && st.y > b.hy)) {
          st.life = 0;
          if (stuck && hit(sb, hb)) {
            if (b.inv <= 0) bossHit();
          } else {
            pop(st.x, st.y - 20, 'Clang!', '#dfe6ea');
            sparkle(st.x, st.y);
            sfx.clang();
          }
        }
      }
      if (B.st !== 'defeat' && hit(pb, hb)) {
        if (stuck && p.vy > 1 && f0 <= hb.y + 14) {
          if (b.inv <= 0) bossHit();
          p.vy = -12;
          p.on = false;
        } else if (b.st === 'lunge' && p.inv <= 0 && !p.dead) hurt({ x: b.hx });
      }
    }
  }
  stars = stars.filter(q => q.life > 0);
  for (const c of coins) {
    if (c.got) continue;
    if (c.drop && !c.landed) {
      c.vy += 0.5;
      c.x += c.vx;
      c.y += c.vy;
      if (c.y >= c.floor) {
        c.y = c.floor;
        c.landed = true;
      }
      continue;
    }
    if (Math.abs(c.x - cx) < 26 && Math.abs(c.y - cy) < p.h / 2 + 12) {
      c.got = true;
      p.coins++;
      gain(1);
      sparkle(c.x, c.y);
      sfx.coin();
    }
  }
  for (const q of pouches)
    if (!q.got && Math.abs(q.x - cx) < 30 && Math.abs(q.y - cy) < p.h / 2 + 16) {
      q.got = true;
      p.ammo += 3;
      pop(q.x, q.y - 24, '+3 stars', '#fff');
      sparkle(q.x, q.y);
      sfx.chime();
    }
  for (const it of items) {
    if (it.got) continue;
    if (it.dy < 0) {
      it.vy += 0.5;
      it.dy = Math.min(0, it.dy + it.vy);
      continue;
    }
    if (p.hearts < 6 && Math.abs(it.x - cx) < 28 && Math.abs(it.y - cy) < p.h / 2 + 16) {
      it.got = true;
      p.hearts = Math.min(6, p.hearts + 1);
      pop(it.x, it.y - 24, '+1 heart', '#ff8a80');
      sparkle(it.x, it.y);
      sfx.chime();
    }
  }
  LANT.forEach((l, i) => {
    if (!lit[i] && cx > l[0] - 10) {
      lit[i] = true;
      p.cp = { x: l[0], y: l[1] };
      pop(l[0], l[1] - 104, 'Checkpoint!', '#ffd36b');
      sfx.chime();
      saveGame();
    }
  });
  cam += (clampCam(cx - viewW * (boss ? 0.45 : 0.4)) - cam) * 0.12;
  fx();
  if (!boss && cx > GATE + 20) {
    if (LEVELS[li].boss < 0) levelClear();
    else startBoss(LEVELS[li].boss);
  }
}
