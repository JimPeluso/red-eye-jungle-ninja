/* The newer snake kinds 11-15 (Drop, Spring, Fire, Shield and Ghost snakes): how they move and attack. */
'use strict';
/* ---------- newer snakes ----------
   The 6th number in a level's sn list picks the kind; mkSnake sets a flag for each:
   11 drop    Hangs head-down from a vine, DROP_HEIGHT up. When Red Eye comes near it shakes (30 frames, "!",
              leaves fall), drops onto the ground, then races along its patrol.
   12 spring  Coils up like a spring (24 frames, "boing"), then hops at Red Eye in an arc. Stomping it works.
   13 fire    Leaves little flames behind it (ground spots, kind 'flame', see mad.js) that burn for 2 seconds.
   14 shield  Sword and stars clang off its front (shieldFront); it turns slowly to face Red Eye (40 frames),
              so jump over it and hit its back. Stomping it works.
   15 ghost   Fades out and back in; while faded (ghostFaded) it can't hurt Red Eye and can't be hit.
   All five take 2 sword hits (health 2.2: the designer's "special snakes have 10% more health" rule).
   s.off is how high above its ground line a snake is (hanging, hopping or floating); ebox and drawing use it. */
const DROP_HEIGHT = 190;
const GHOST_CYCLE = 200; // frames: solid 0-109, fading 110-129, faded 130-179, coming back 180-199
const isNewSnake = s => s.drop || s.spring || s.fire || s.shield || s.ghost;
const ghostPhase = s => (s.t + s.ph) % GHOST_CYCLE;
const ghostFaded = s => s.ghost && ghostPhase(s) >= 118 && ghostPhase(s) < 186;
/** Is something at x in front of a shield snake (where its shield faces)? */
const shieldFront = (s, x) => s.shield && Math.sign(x - s.x) === s.dir;

/** Walks a snake along its patrol (a to b), turning at the ends. */
function patrol(s, speed) {
  s.x += s.dir * speed;
  s.moving = true;
  if (s.x < s.a) {
    s.x = s.a;
    s.dir = 1;
  } else if (s.x > s.b) {
    s.x = s.b;
    s.dir = -1;
  }
}

/** moveSnake() hands the newer kinds to this. play: Red Eye can be attacked; dxp: how far right of the snake he is. */
function moveNewSnake(s, play, dxp, same) {
  if (s.drop) {
    if (s.off > 0) {
      if (s.ns === 0) {
        // waiting on the vine for Red Eye to walk underneath
        if (play && Math.abs(dxp) < 140 && p.y + p.h > GY - 80) {
          s.ns = 1;
          s.nt = 30;
          pop(s.x, s.y - s.off - 78, '!', '#ffe14d');
          sfx.rustle();
        }
      } else if (s.ns === 1) {
        // shaking: the warning
        if (s.nt % 6 === 0)
          parts.push({
            x: s.x + rnd(-14, 14),
            y: s.y - s.off - 60,
            vx: rnd(-0.6, 0.6),
            vy: rnd(0.6, 1.4),
            g: 0.03,
            life: 40,
            max: 40,
            r: 3,
            c: '#7cc63f',
          });
        if (--s.nt <= 0) {
          s.ns = 2;
          s.vy = 0;
          sfx.whoosh();
        }
      } else {
        // falling
        s.vy += 0.9;
        s.off -= s.vy;
        if (s.off <= 0) {
          s.off = 0;
          s.vy = 0;
          s.ns = 3;
          s.dir = dxp < 0 ? -1 : 1;
          dust(s.x, s.y, 12);
          sfx.thud();
        }
      }
      return;
    }
    patrol(s, s.sp * 1.4);
    return;
  }

  if (s.spring) {
    if (s.cd > 0) s.cd--;
    if (s.ns === 1) {
      // coiling down: the warning
      if (--s.nt <= 0) {
        s.ns = 2;
        s.vy = -10.5;
        s.vx = s.dir * 3;
        sfx.jump();
      }
      return;
    }
    if (s.ns === 2) {
      // hopping: about 90px up and 100px forward
      s.vy += 0.6;
      s.off -= s.vy;
      s.x = Math.max(s.a, Math.min(s.b, s.x + s.vx));
      s.moving = true;
      if (s.off <= 0) {
        s.off = 0;
        s.ns = 0;
        s.cd = 70;
        s.nt = 14; // a wobble on landing
        dust(s.x, s.y, 8);
      }
      return;
    }
    if (s.nt > 0) s.nt--;
    if (play && same && Math.abs(dxp) < 260 && s.cd <= 0) {
      s.dir = dxp < 0 ? -1 : 1;
      s.ns = 1;
      s.nt = 24;
      sfx.boing();
      return;
    }
    patrol(s, s.sp * 0.5);
    return;
  }

  if (s.fire) {
    patrol(s, s.sp);
    // a little flame behind it every 24 frames, at most 6 burning at once
    if (play && s.t % 24 === 0 && zones.filter(z => z.from === s.id).length < 6)
      zones.push({ kind: 'flame', x: s.x - s.dir * 34, w: 22, h: 26, t: 0, warn: 0, act: 120, from: s.id });
    return;
  }

  if (s.shield) {
    const near = play && same && Math.abs(dxp) < 220,
      want = dxp < 0 ? -1 : 1;
    // turns to face Red Eye, but slowly: 40 frames to get round
    if (near && want !== s.dir) {
      if (++s.nt >= 40) {
        s.dir = want;
        s.nt = 0;
        sfx.hiss();
      }
    } else s.nt = 0;
    s.x += s.dir * s.sp * (near ? 0.8 : 0.6);
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

  if (s.ghost) {
    s.off = 8 + Math.sin(s.t * 0.08) * 6; // floats a little
    patrol(s, s.sp * 0.7);
    const k = ghostPhase(s);
    if (k > 180 && k % 4 === 0) sparkle(s.x + rnd(-30, 30), s.y - s.off - rnd(5, 30)); // shimmering back in
  }
}

/** Sword on a Shield Snake's front: clang, no damage. */
function clangOff(s) {
  if (s.inv > 0) return;
  s.inv = 14;
  pop(s.x, s.y - 50, 'Clang!', '#dfe6ea');
  sparkle(s.x + s.dir * 30, s.y - 20);
  sfx.clang();
}

/** The colour of the puff when a newer snake is beaten (null for the older kinds). */
function newSnakeColor(s) {
  return s.drop
    ? '#c8d84a'
    : s.spring
      ? '#ff9f43'
      : s.fire
        ? '#ff6a2a'
        : s.shield
          ? '#a07a4a'
          : s.ghost
            ? '#d7c8ff'
            : null;
}
