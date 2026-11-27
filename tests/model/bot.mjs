// The bot: plays the real game frame by frame, using the level model's graph (reach.mjs) as its map.
//
// botInstall() runs in the page (page.evaluate) and adds window.__bot. The bot only presses the keys a player
// would (the key[] flags and press()) and moves time on with the game's own step(). To choose a jump it tries one
// in the real engine, checks where Red Eye actually landed, and rewinds (save/restore) if it went wrong, like a
// player retrying from a save. Red Eye is invincible during the run, so it tests the levels, not the bot's dodging.
import { RUNUPS } from './measure.mjs';

/** Adds run-up direction and distance to each model witness, for the bot. prof: measured paths. */
export function planWitnesses(model, prof) {
  const Xp = RUNUPS.map(d => prof.X[`${d},1`]);
  return model.graph.map(edges => {
    const out = {};
    for (const [b, list] of Object.entries(edges))
      out[b] = list.map(w => {
        if (w.type !== 'jump') return { ...w, runFrames: prof.runFrames[RUNUPS[w.type === 'off-right' ? w.iR : w.iL]] };
        const need = w.T - w.X;
        const dir = Math.abs(need) < 3 ? 0 : Math.sign(need);
        const maxI = dir > 0 ? w.iR : dir < 0 ? w.iL : 0;
        let i = 0;
        while (i < maxI && Xp[i][w.k] < Math.abs(need)) i++;
        return { ...w, dir, d: RUNUPS[i], runFrames: prof.runFrames[RUNUPS[i]] };
      });
    return out;
  });
}

/** Runs in the page: installs window.__bot. */
export function botInstall() {
  const sameArr = (a, b) => a && b && a.length === b.length && a.every((v, i) => v === b[i]);
  const relink = () => {
    if (p.plat) p.plat = PLATS.find(q => sameArr(q, p.plat)) || null;
    if (p.seg) p.seg = SEGS.find(s => sameArr(s, p.seg)) || p.seg;
    if (p.safe?.seg) p.safe.seg = SEGS.find(s => sameArr(s, p.safe.seg)) || p.safe.seg;
    if (p.safe?.plat) p.safe.plat = PLATS.find(q => sameArr(q, p.safe.plat)) || p.safe.plat;
  };
  const save = () =>
    structuredClone({
      p,
      B,
      bolts,
      flash,
      suReq,
      clones,
      cloneT,
      clReq,
      coins,
      snakes,
      stars,
      waves,
      spits,
      items,
      parts,
      pops,
      lit,
      pouches,
      mode,
      T,
      cam,
      shake,
      jb,
      swReq,
      stReq,
      BN,
      LT,
      li,
      bk,
      boss,
      key: { ...key },
      rng: window.__rng?.s,
    });
  const restore = s0 => {
    const s = structuredClone(s0);
    ({ p, B, bolts, flash, suReq, clones, cloneT, clReq, coins, snakes, stars, waves, spits, items, parts, pops, lit } =
      s);
    ({ pouches, mode, T, cam, shake, jb, swReq, stReq, BN, LT, li, bk, boss } = s);
    for (const k in key) key[k] = 0;
    Object.assign(key, s.key);
    if (window.__rng) window.__rng.s = s.rng;
    relink();
  };
  const release = () => {
    for (const k in key) key[k] = 0;
  };
  const surface = () => {
    if (!p.on) return -1;
    if (p.plat) {
      const j = PLATS.indexOf(p.plat);
      return j < 0 ? -1 : SEGS.length + j;
    }
    return SEGS.indexOf(p.seg);
  };
  const logOf = a => (a >= SEGS.length ? PLATS[a - SEGS.length] : null);
  const leftOf = a => {
    const q = logOf(a);
    return q ? pp(q, LT).x : SEGS[a][0];
  };
  const widthOf = a => {
    const q = logOf(a);
    return q ? q[2] : SEGS[a][1] - SEGS[a][0];
  };
  const periodOf = a => {
    const q = logOf(a);
    return q && (q[3] || q[4]) ? q[5] || 240 : 0;
  };
  const pos = a => p.x - leftOf(a);
  let ticks = 0;
  const frame = () => {
    p.inv = 1e6;
    if (++ticks % 24 === 0) press('S'); // keep swinging the sword at snakes
    step();
  };

  function walkTo(a, target) {
    for (let i = 0; i < 600; i++) {
      const err = target - pos(a);
      key.L = key.R = 0;
      if (Math.abs(err) < 2 && Math.abs(p.vx) < 0.5) return true;
      const stop = Math.abs(p.vx) * 2.4;
      if (err > stop + 1) key.R = 1;
      else if (err < -stop - 1) key.L = 1;
      frame();
      if (surface() !== a) return false;
    }
    return false;
  }

  /** Tries one witness from surface a. Returns { landed } or { fail }. */
  function attempt(a, w, offset) {
    release();
    const hearts = p.hearts;
    // where Red Eye can stand on surface a, keeping 6px from each end so walking there can't tip him off
    const LO = -28 + 6;
    const HI = widthOf(a) - 6 - 6;
    const clamp = x => Math.max(LO, Math.min(HI, x));
    let jumpIn = -1; // frames until pressing jump (-1 = not planned)
    if (w.type === 'jump') {
      if (!walkTo(a, clamp(w.rel - w.dir * w.d))) return { fail: 'walk' };
    } else if (!walkTo(a, w.type === 'off-right' ? LO : HI)) return { fail: 'walk' };
    // timing for moving logs: leave A at A's phase t0, or arrive on B at the phase the model found
    const PA = periodOf(a);
    const PB = periodOf(w.to);
    const runF = w.type === 'jump' ? w.runFrames : Math.round(Math.abs(HI - LO) / 5.6) + 4;
    let wait = 0;
    if (PA && w.t0 != null) wait = w.t0 - (LT + runF + 1);
    else if (PB && w.phi != null) wait = w.phi - w.k - (LT + runF + 1);
    const P = PA || PB;
    if (P) wait = ((Math.round(wait + offset) % P) + P) % P;
    else wait = Math.max(0, offset);
    key.L = key.R = 0;
    for (let i = 0; i < wait; i++) {
      frame();
      if (surface() !== a) return { fail: 'carried off' };
    }
    const dir = w.type === 'jump' ? w.dir : w.type === 'off-right' ? 1 : -1;
    key.R = dir > 0 ? 1 : 0;
    key.L = dir < 0 ? 1 : 0;
    if (w.type === 'jump') {
      for (let i = 0; dir && (pos(a) - w.rel) * dir < 0 && i < 200; i++) {
        frame();
        if (!p.on) return { fail: 'left early' };
      }
      press('J');
      jumpIn = 0;
    } else {
      for (let i = 0; p.on && i < 300; i++) frame();
      if (p.on) return { fail: 'never left' };
      if (w.c != null) jumpIn = w.c - 1;
    }
    let jumped = -1;
    for (let f = 0; f < 300; f++) {
      if (f === jumpIn && w.type !== 'jump') press('J');
      if (f === jumpIn) jumped = f;
      key.J = jumped >= 0 && w.h != null && f - jumped < w.h ? 1 : 0;
      const err = w.T - p.x;
      key.R = err > 3 ? 1 : 0;
      key.L = err < -3 ? 1 : 0;
      frame();
      if (p.hearts < hearts || mode !== 'play') return { fail: 'fell' };
      if (boss) return { landed: -2 };
      if (p.on) return { landed: surface() };
    }
    return { fail: 'still in the air' };
  }

  /** Plays the current level until the boss fight starts. model: { graph (planned witnesses), dist }. */
  function playLevel(model, { maxHops = 120 } = {}) {
    const log = [];
    release();
    for (let hop = 0; hop < maxHops; hop++) {
      if (boss) return { ok: true, log };
      for (let i = 0; i < 120 && !p.on; i++) frame();
      const a = surface();
      if (a < 0) return { ok: false, why: 'not standing on anything', log };
      if (model.dist[a] === 0) {
        // the gate is on this surface: run right to it (let go of everything first: Left + Right = stand still)
        release();
        key.R = 1;
        for (let i = 0; i < 1200 && !boss; i++) {
          frame();
          if (!p.on && surface() < 0 && p.y > 700) break;
        }
        release();
        if (boss) return { ok: true, log };
      }
      const options = [];
      for (const [b, list] of Object.entries(model.graph[a]))
        if (model.dist[b] < model.dist[a]) for (const w of list) options.push({ ...w, to: Number(b) });
      options.sort((u, v) => model.dist[u.to] - model.dist[v.to] || v.width - u.width);
      let moved = false;
      // Timing: for a moving log, small shifts around the moment the model found; otherwise wait a while, so a
      // log moving across the path (or a snake) is somewhere else.
      const timings = w => (periodOf(a) || periodOf(w.to) ? [0, 4, -4, 8, -8, 14, -14, 22] : [0, 30, 60, 90, 130, 180]);
      tries: for (const w of options.slice(0, 48))
        for (const offset of timings(w)) {
          const snap = save();
          const r = attempt(a, w, offset);
          if (r.landed === -2 || (r.landed >= 0 && model.dist[r.landed] < model.dist[a])) {
            log.push(`${a}->${r.landed === -2 ? 'gate' : r.landed} (${w.type} h${w.h} c${w.c})`);
            moved = true;
            break tries;
          }
          restore(snap);
        }
      if (!moved) return { ok: false, why: `stuck on surface ${a}`, at: a, log };
    }
    return { ok: false, why: 'too many hops', log };
  }

  /** Fights the current boss with real moves until it's beaten. */
  function fightBoss({ maxFrames = 30000 } = {}) {
    release();
    const start = B.hp;
    let f = 0;
    for (; f < maxFrames && mode === 'play'; f++) {
      p.inv = 1e6;
      const b = B;
      key.L = key.R = key.J = 0;
      if (b.st !== 'defeat') {
        const stuck = b.st === 'stuck' || b.st === 'dazed';
        const rider = !!b.cfg.rider;
        const tx = stuck ? b.hx - 82 : rider ? b.hx - 60 : 150;
        const err = tx - p.x;
        if (err > 4) key.R = 1;
        else if (err < -4) key.L = 1;
        else if (p.face < 0) key.R = 1;
        const close = Math.abs(err) < 30 && p.face > 0;
        if (stuck && close) {
          if (p.swcd <= 0) press('S');
          if (p.stcd <= 0 && p.ammo > 0) press('T');
        }
        if (rider && !stuck && Math.abs(err) < 30) {
          if (p.on) press('J');
          key.J = p.vy < 0 ? 1 : 0;
          if (!p.on && p.vy > -6 && p.swcd <= 0) press('S');
        }
        if ((p.sp || 0) >= 100) press('U');
      }
      step();
    }
    return { ok: mode === 'win' || mode === 'champ', mode, frames: f, hp: B ? B.hp : null, start };
  }

  window.__bot = { save, restore, surface, playLevel, fightBoss, attempt };
}
