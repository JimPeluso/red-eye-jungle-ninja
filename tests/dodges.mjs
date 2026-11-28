// The dodges a player uses against mad moves (js/mad.js), played with real inputs (the same key flags the keyboard
// sets), frame by frame inside the page. Each one returns true if Red Eye got through it.
// Run one with page.evaluate(DODGES[how], options). They're plain arrow functions because Playwright sends their
// source to the page, so they can only use what the page has (the __t hook and press).

export const DODGES = {
  /** walk: to the nearest safe ground, away from every danger spot (ground spots and sky drops). */
  walk: () => {
    const t = __t,
      k = t.key;
    const cx = () => t.p.x + 17;
    const safe = x => t.zones.every(z => Math.abs(x - z.x) > z.w / 2 + 17 + 10);
    let target = null;
    for (let d = 0; d < 800 && target == null; d += 4)
      for (const x of [cx() - d, cx() + d]) if (x > 30 && x < t.B.hx - 60 && safe(x)) target = x;
    let f = 0;
    for (; f < 44 && Math.abs(cx() - target) > 6; f++) {
      k.L = cx() > target ? 1 : 0;
      k.R = cx() < target ? 1 : 0;
      t.step();
    }
    k.L = k.R = 0;
    for (; f < 44; f++) t.step(); // let go and come to a stop, still inside the warning time
    // clear of every danger spot by the game's own rule: Red Eye's body (p.x+5 to p.x+29) outside each one
    return t.zones.every(z => t.p.x + 29 < z.x - z.w / 2 || t.p.x + 5 > z.x + z.w / 2);
  },

  /** log: jump up onto the arena's first log (x 80-210, 108px up) and stay there while the wave rolls under. */
  log: () => {
    const t = __t,
      k = t.key;
    t.respawnAt(150, 460);
    t.p.inv = 0; // respawning makes him invincible for a moment
    for (let i = 0; i < 3; i++) t.step();
    window.press('J');
    k.J = 1;
    for (let i = 0; i < 40; i++) t.step();
    k.J = 0;
    return t.p.on && !!t.p.plat;
  },

  /** duck: hold Sneak until the sweep has flown past. */
  duck: () => {
    const t = __t,
      k = t.key;
    k.D = 1;
    for (let i = 0; i < 300 && t.waves.some(w => w.sweep); i++) t.step();
    k.D = 0;
    return !t.waves.some(w => w.sweep);
  },

  /** jump: a standing jump each time a roller or big wave comes at Red Eye, when the part of it that hurts is `at`
      px from his body. `times`: how many jumps that should take (the Spike Ball: there and back). Done when he has
      landed after the last one and it has gone past him (the boss is dazed by then, or soon after).
      It starts on open ground (x 470): where Red Eye starts a fight, a jump lands him on the low log instead. */
  jump: ({ at, times }) => {
    const t = __t,
      k = t.key;
    t.respawnAt(470, 460);
    t.p.inv = 0; // respawning makes him invincible for a moment
    const mover = () => t.waves.find(w => w.big || w.roll);
    let jumps = 0,
      hold = 0,
      passed = false;
    for (let i = 0; i < 700 && mover(); i++) {
      const w = mover(),
        box = t.moverBox(w),
        left = w.vx < 0,
        coming = w.warn === 0 && (left ? w.x > t.p.x : w.x < t.p.x),
        gap = left ? box.x - (t.p.x + 29) : t.p.x + 5 - (box.x + box.w);
      passed = w.warn === 0 && (left ? box.x + box.w < t.p.x + 5 : box.x > t.p.x + 29);
      if (jumps === times && passed && t.p.on) break;
      if (t.p.on && coming && gap <= at && jumps < times) {
        window.press('J');
        k.J = 1;
        hold = 16;
        jumps++;
      }
      if (hold > 0 && --hold === 0) k.J = 0;
      t.step();
    }
    k.J = 0;
    return jumps === times && (passed || !mover());
  },
};
