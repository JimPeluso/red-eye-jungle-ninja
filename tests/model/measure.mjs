// Measures Red Eye's jumps and falls in the REAL game engine, frame by frame.
// measureInPage() runs inside the page (page.evaluate), so it uses the game's own step(): no physics is re-implemented.
// The world is swapped for one huge log high in the sky with no ground under it. The log vanishes the moment Red Eye
// leaves it, so every jump and fall is recorded all the way down.

/** Run-up distances (px of running before leaving a log or ground). */
export const RUNUPS = [0, 2, 5, 10, 15, 20, 30, 40, 60, 80, 120, 200];
/** How many frames the jump button is held (0 = a quick tap, 99 = held until landing). */
export const HOLDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 99];
/** Coyote jumps: jumping 1-6 frames after running off an edge (the engine allows up to 6). */
export const COYOTE = [1, 2, 3, 4, 5, 6];

/** Runs in the page. Returns { V, X, runFrames, independent }. */
export function measureInPage({ RUNUPS, HOLDS, COYOTE }) {
  const Y = 100;
  const sky = {
    name: '',
    pal: 'jungle',
    segs: [[-300000, -299000]],
    plats: [[-100000, Y, 200000]],
    grass: [],
    signs: [],
    lant: [],
    pouch: [],
    sn: [],
    end: 1e7,
    gate: 1e9,
    coins: [],
  };
  startLevel(0);
  load(sky);
  snakes = [];
  coins = [];
  pouches = [];
  items = [];
  lit = [];
  const r2 = v => Math.round(v * 100) / 100;
  const release = () => {
    for (const k in key) key[k] = 0;
    jb = 0;
  };
  const settle = () => {
    release();
    PLATS = sky.plats;
    respawnAt(0, Y);
    p.inv = 1e9;
    p.hearts = 99;
    for (let i = 0; i < 4; i++) step();
  };

  // One flight: run right `d` px from standing, then leave (frame 1 = the step Red Eye leaves on).
  // jumpAt: 0 = jump off, c = run off the edge and jump c frames later (coyote), null = just fall.
  // hold: frames the jump button is held from the jump step. steer: -1 / 0 / +1 from the leave step on.
  function flight({ d, jumpAt, hold, steer }) {
    settle();
    const x0 = p.x;
    let runFrames = 0;
    if (d > 0) {
      key.R = 1;
      while (p.x - x0 < d) {
        step();
        runFrames++;
      }
    }
    key.R = steer > 0 ? 1 : 0;
    key.L = steer < 0 ? 1 : 0;
    const xs = p.x;
    const fs = p.y + p.h;
    const out = [];
    let jumpStep = jumpAt === 0 ? 1 : jumpAt ? jumpAt + 1 : -1;
    PLATS = [];
    for (let k = 1; k <= 140; k++) {
      if (k === jumpStep) press('J');
      key.J = jumpStep > 0 && k >= jumpStep && k < jumpStep + hold ? 1 : 0;
      step();
      out.push([r2(p.x - xs), r2(p.y + p.h - fs), r2(p.vy)]);
      if (p.y + p.h - fs > 560 || p.on) break;
    }
    release();
    return { out, runFrames, landed: p.on };
  }

  // Vertical paths: depend only on the jump button (checked below), keyed 'hold,coyote' (coyote 0 = from standing).
  const V = {};
  for (const h of HOLDS) {
    const f = flight({ d: 0, jumpAt: 0, hold: h, steer: 0 });
    V[`${h},0`] = { dy: f.out.map(o => o[1]), vy: f.out.map(o => o[2]) };
    for (const c of COYOTE) {
      const g = flight({ d: 0, jumpAt: c, hold: h, steer: 0 });
      V[`${h},${c}`] = { dy: g.out.map(o => o[1]), vy: g.out.map(o => o[2]) };
    }
  }
  const fall = flight({ d: 0, jumpAt: null, hold: 0, steer: 0 });
  V.fall = { dy: fall.out.map(o => o[1]), vy: fall.out.map(o => o[2]) };

  // Sideways paths: run-up d to the right, then steer +1 or -1 the whole time, keyed 'd,steer'.
  const X = {};
  const runFrames = {};
  for (const d of RUNUPS)
    for (const s of [1, -1]) {
      const f = flight({ d, jumpAt: 0, hold: 99, steer: s });
      X[`${d},${s}`] = f.out.map(o => o[0]);
      runFrames[d] = f.runFrames;
    }

  // Check the model's key assumption: sideways input doesn't change the up-down path, and a jump and a
  // walk-off move sideways the same way.
  const a = flight({ d: 0, jumpAt: 0, hold: 3, steer: 0 });
  const b = flight({ d: 60, jumpAt: 0, hold: 3, steer: 1 });
  const c = flight({ d: 60, jumpAt: null, hold: 0, steer: 1 });
  const n = Math.min(a.out.length, b.out.length);
  const independent =
    a.out.slice(0, n).every((o, i) => o[1] === b.out[i][1] && o[2] === b.out[i][2]) &&
    c.out.slice(0, 20).every((o, i) => o[0] === X['60,1'][i]);
  return { V, X, runFrames, independent };
}
