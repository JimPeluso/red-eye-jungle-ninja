/* Snake behaviour: hit boxes (ebox), movement and attacks (moveSnake), getting hit and dying. */
'use strict';
/* ---------- enemies ---------- */
function ebox(s) {
  if (s.type >= 4) return { x: s.x - 16, y: s.y - 60, w: 32, h: 60 };
  if (s.two) {
    const ext = s.bite >= 4 && s.bite <= 16 ? 22 : 0;
    return { x: s.x - 66 - (s.bdir < 0 ? ext : 0), y: s.y - 26, w: 132 + ext, h: 26 };
  }
  if (s.rock && !s.rk) return { x: s.x - 26, y: s.y - 30, w: 52, h: 30 };
  const r = s.type === 3 ? 24 * s.rear : 0;
  if (s.drop && s.off > 0) return { x: s.x - 13, y: s.y - s.off - 62, w: 26, h: 74 }; // hanging from its vine
  if (s.spring) return { x: s.x - 22, y: s.y - s.off - 64, w: 44, h: 64 };
  if (s.shield) return { x: s.x - 40, y: s.y - 36, w: 80, h: 36 };
  return { x: s.x - 38 * GS, y: s.y - (26 + r) * GS - s.off, w: 76 * GS, h: (26 + r) * GS };
}
function moveSnake(s) {
  s.t++;
  s.moving = false;
  if (s.inv > 0) s.inv--;
  if (s.dy < 0) {
    s.vy += 0.6;
    s.dy += s.vy;
    if (s.dy >= 0) {
      s.dy = 0;
      dust(s.x, s.y, 8);
    }
    return;
  }
  if (!s.alive) return;
  const play = mode === 'play' && p && !p.dead,
    pc = p ? p.x + 17 : -1e9,
    dxp = pc - s.x,
    same = p && Math.abs(p.y + p.h - s.y) < 70;
  if (isNewSnake(s)) {
    moveNewSnake(s, play, dxp, same);
    return;
  }
  if (s.type === 2) {
    s.dir = dxp < 0 ? -1 : 1;
    if (!play) return;
    if (s.spit > 0) {
      if (--s.spit === 0) {
        spits.push({ x: s.x + s.dir * 46 * GS, y: s.y - 15 * GS, vx: s.dir * 4.6, life: 150 });
        sfx.spit();
      }
      return;
    }
    if (Math.abs(dxp) < 440 && Math.abs(p.y + p.h - s.y) < 150 && --s.cd <= 0) {
      s.spit = 24;
      s.cd = (LEVELS[li] || L5).spit;
    }
    return;
  }
  if (s.type === 5) {
    s.dir = dxp < 0 ? -1 : 1;
    if (s.atk > 0) {
      if (--s.atk === 0) {
        spits.push({ x: s.x + s.dir * 20, y: s.y - 36, vx: s.dir * 6.5, life: 130, star: true });
        sfx.toss();
      }
      return;
    }
    if (play && Math.abs(dxp) < 480 && Math.abs(p.y + p.h - s.y) < 120 && --s.cd <= 0) {
      s.atk = 20;
      s.cd = 95;
    }
    return;
  }
  if (s.type === 4 || s.type === 6) {
    if (s.atk > 0) {
      if (--s.atk === 16) sfx.swish();
      return;
    }
    if (s.cd > 0) s.cd--;
    const near = play && same && Math.abs(dxp) < 320;
    if (near) {
      s.dir = dxp < 0 ? -1 : 1;
      if (Math.abs(dxp) < (s.type === 6 ? 84 : 64) && s.cd <= 0) {
        s.atk = 34;
        s.cd = 60;
        return;
      }
      s.x += s.dir * s.sp * 1.35;
    } else s.x += s.dir * s.sp * 0.7;
    s.moving = true;
    if (s.x < s.a) {
      s.x = s.a;
      if (!near) s.dir = 1;
    } else if (s.x > s.b) {
      s.x = s.b;
      if (!near) s.dir = -1;
    }
    return;
  }
  if (s.sleep) return;
  if (s.alert > 0) {
    s.alert--;
    return;
  }
  if (s.rock) {
    if (s.cd > 0) s.cd--;
    if (s.rk > 0) {
      s.rk--;
      if (!s.rk) s.cd = 90;
      const near = play && same && Math.abs(dxp) < 220;
      if (near) s.dir = dxp < 0 ? -1 : 1;
      if (s.rk > 20 && s.rk < 120 && near && Math.abs(dxp) > 36) {
        s.x = Math.max(s.a, Math.min(s.b, s.x + s.dir * s.sp * 1.3));
        s.moving = true;
      }
      return;
    }
    if (play && same && Math.abs(dxp) < 110 && s.cd <= 0) {
      s.rk = 150;
      s.dir = dxp < 0 ? -1 : 1;
      pop(s.x, s.y - 52, '!', '#ffe14d');
      sfx.hiss();
      dust(s.x, s.y, 10);
    }
    return;
  }
  if (s.two) {
    if (s.cd > 0) s.cd--;
    if (s.bite > 0) {
      s.bite--;
      return;
    }
    if (play && same && Math.abs(dxp) < 120 && s.cd <= 0) {
      s.bdir = dxp < 0 ? -1 : 1;
      s.bite = 28;
      s.cd = 70;
      sfx.hiss();
      return;
    }
  }
  if (s.fly) {
    if (s.cd > 0) s.cd--;
    const hov = s.home - 110 + Math.sin(s.t * 0.06) * 22;
    if (s.cs === 1) {
      s.ct--;
      if (s.ct > 55) s.y += (hov - s.y) * 0.2;
      else if (s.ct > 30) {
        s.x += s.dir * s.sp * 2.6;
        s.y += (s.ty - s.y) * 0.18;
      } else {
        s.y += (hov - s.y) * 0.08;
        s.x += s.dir * s.sp;
      }
      if (s.ct <= 0) {
        s.cs = 0;
        s.cd = 110;
      }
      s.x = Math.max(s.a, Math.min(s.b, s.x));
      s.moving = true;
      return;
    }
    s.y += (hov - s.y) * 0.1;
    if (play && s.cd <= 0 && Math.abs(dxp) < 240 && p.y + p.h > s.y) {
      s.dir = dxp < 0 ? -1 : 1;
      s.cs = 1;
      s.ct = 70;
      s.ty = Math.min(s.home - 4, p.y + p.h - 6);
      sfx.hiss();
      return;
    }
  }
  if (s.frost) {
    if (s.spit > 0) {
      if (--s.spit === 0) {
        spits.push({ x: s.x + s.dir * 46, y: s.y - 15, vx: s.dir * 5, life: 150, ice: true });
        sfx.ice();
      }
      return;
    }
    if (s.cd > 0) s.cd--;
    if (play && same && s.cs === 0 && Math.abs(dxp) < 420 && s.cd <= 0) {
      s.dir = dxp < 0 ? -1 : 1;
      s.spit = 26;
      s.cd = s.ice ? 130 : 170;
      return;
    }
  }
  if (s.type === 3) {
    if (s.cs === 1) {
      s.rear = Math.min(1, s.rear + 0.08);
      if (--s.ct <= 0) {
        s.cs = 2;
        s.ct = 12;
        sfx.lunge();
      }
      return;
    }
    if (s.cs === 2) {
      s.x = Math.max(s.a, Math.min(s.b, s.x + s.dir * 6));
      if (--s.ct <= 0) {
        s.cs = 3;
        s.ct = 40;
      }
      return;
    }
    if (s.cs === 3) {
      s.rear = Math.max(0, s.rear - 0.05);
      if (--s.ct <= 0) {
        s.cs = 0;
        s.cd = 70;
      }
      return;
    }
    if (s.cd > 0) s.cd--;
    if (play && same && Math.abs(dxp) < 170 && s.cd <= 0) {
      s.dir = dxp < 0 ? -1 : 1;
      s.cs = 1;
      s.ct = 30;
      sfx.hiss();
      return;
    }
  }
  s.x += s.dir * s.sp;
  s.moving = true;
  if (s.x < s.a) {
    s.x = s.a;
    s.dir = 1;
  } else if (s.x > s.b) {
    s.x = s.b;
    s.dir = -1;
  }
}
function hitEnemy(s, d) {
  if (s.inv > 0) return;
  if (s.sleep) {
    kill(s);
    return;
  }
  s.hp -= d || 1;
  gain(6);
  if (s.hp <= 0) {
    kill(s);
    return;
  }
  s.inv = 24;
  s.cs = s.type === 3 ? 3 : s.cs;
  s.ct = 30;
  s.atk = 0;
  s.x = Math.max(s.a, Math.min(s.b, s.x + (s.x < p.x + 17 ? -22 : 22)));
  puff(s.x, s.y - (s.type >= 4 ? 40 : 16), '#fff', 6);
  sfx.bossHit();
}
function kill(s) {
  const sneak = s.sleep;
  s.alive = false;
  p.kills++;
  gain(8);
  puff(
    s.x,
    s.y - (s.type >= 4 ? 30 : 12) - s.off,
    newSnakeColor(s) ||
      (s.type >= 4
        ? '#8a7aa8'
        : s.type === 3
          ? '#5aa8f0'
          : s.type === 2
            ? '#ffab55'
            : s.rock
              ? '#9aa09b'
              : s.two
                ? '#b84ad0'
                : s.ice
                  ? '#bfefff'
                  : '#9fe34d'),
    16,
  );
  // a beaten Fire Snake's flames go out
  if (s.fire) for (const z of zones) if (z.from === s.id) z.t = Math.max(z.t, z.warn + z.act - 6);
  sfx.pop();
  shake = Math.max(shake, 4);
  for (let i = 0; i < (s.type >= 4 ? 2 : 1); i++)
    coins.push({
      x: s.x + i * 16,
      y: s.y - 34,
      got: false,
      drop: true,
      landed: false,
      vy: -7 - i,
      vx: (Math.random() - 0.5) * 3,
      floor: (s.fly ? s.home : s.y) - 14,
    });
  if (boss && p.ammo < 6) pouches.push({ x: s.x, y: GY - 42, got: false });
  if (sneak) {
    p.sneaks++;
    p.coins += 3;
    pop(s.x, s.y - 60, 'Sneak attack! +3', '#ffc928');
    sfx.chime();
  } else pop(s.x, s.y - (s.type >= 4 ? 84 : 52), s.type >= 4 ? 'Ninja down!' : 'Hiyah!', '#fff');
}
function gain(n) {
  if (cloneT <= 0) p.sp = Math.min(100, (p.sp || 0) + n);
}
