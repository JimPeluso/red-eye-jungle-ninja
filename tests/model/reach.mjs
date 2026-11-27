// Level reachability model: works out everywhere Red Eye can get to in a level.
//
// It uses the jump and fall paths measured from the real engine (measure.mjs) and the landing rules of js/step.js:
//  - A "surface" is a piece of ground (L.segs) or a log (L.plats). Red Eye stands on it when his left edge X is in
//    (x0 - 28, x1 - 6): his feet must overlap it by more than 6px. Logs are one-way: he jumps up through them.
//  - He lands when falling (vy >= 0) and his feet cross the top: ground within 1px, still logs 1px, moving logs 8px.
//  - Once his feet are more than 4px below the ground line he's in a pit and can't land on ground any more.
//  - Up-down motion depends only on the jump button; sideways motion only on left/right (measure.mjs checks this),
//    so at every frame of a jump the places he can be form a range: [hardest left, hardest right].
// A jump from surface A can land on B if B's standing range meets that range at the frame his feet cross B's top.
// If one surface covers the whole range at that frame, every path lands there and the jump ends.
// Logs that move are sampled over their whole swing; Red Eye can wait on a surface for as long as he likes.
import { RUNUPS, HOLDS, COYOTE } from './measure.mjs';

const PW = 34;
const FOOT = 6;
const LO = -(PW - FOOT); // standing range is (x0 + LO, x1 + HI)
const HI = -FOOT;
const HALF = PW / 2;
export const PICK = { coin: { rx: 26, ry: 40 }, pouch: { rx: 30, ry: 44 }, heart: { rx: 28, ry: 44 } };

/** Same as pp() in js/state.js: where a log is at time t. levels.spec.mjs checks the two agree. */
export const pp = (q, t) => {
  if (!q[3] && !q[4]) return { x: q[0], y: q[1] };
  const a = (t * 6.2832) / (q[5] || 240) + (q[6] || 0);
  return { x: q[0] + (q[3] || 0) * Math.sin(a), y: q[1] + (q[4] || 0) * Math.sin(a) };
};

const VMAX = 5.6; // top running speed: the furthest Red Eye moves sideways in one frame
const range = n => [...Array(n).keys()];
/** Sorted, non-overlapping copy of a list of [l, r] ranges (empty ones dropped). */
function merge(list) {
  const out = [];
  for (const [l, r] of list.filter(([l, r]) => l < r).sort((u, v) => u[0] - v[0])) {
    const last = out[out.length - 1];
    if (last && l <= last[1]) last[1] = Math.max(last[1], r);
    else out.push([l, r]);
  }
  return out;
}
/** The ranges in `list` with every range in `cuts` removed. */
function subtract(list, cuts) {
  let out = list;
  for (const [a, b] of cuts)
    out = out.flatMap(([l, r]) => (b <= l || a >= r ? [[l, r]] : [[l, Math.min(r, a)], [Math.max(l, b), r]]));
  return merge(out);
}
/** The widest part of [l, r] not inside any of the `taken` ranges, or null. */
function widestFree(l, r, taken) {
  let best = null;
  let at = l;
  for (const [a, b] of [...taken].sort((u, v) => u[0] - v[0])) {
    if (b <= at) continue;
    if (a >= r) break;
    if (a > at && (!best || a - at > best[1] - best[0])) best = [at, a];
    at = Math.max(at, b);
  }
  if (r > at && (!best || r - at > best[1] - best[0])) best = [at, r];
  return best;
}
const runIdx = avail => {
  let i = 0;
  while (i + 1 < RUNUPS.length && RUNUPS[i + 1] <= avail) i++;
  return i;
};

export function surfacesOf(L, GY) {
  const S = L.segs.map((s, i) => ({ id: `ground ${i + 1}`, kind: 'ground', ref: i, x0: s[0], x1: s[1], w: s[1] - s[0], y: GY }));
  L.plats.forEach((q, i) => {
    const moving = !!(q[3] || q[4]);
    S.push({ id: `log ${i + 1}`, kind: 'log', ref: i, q, moving, x0: q[0], x1: q[0] + q[2], w: q[2], y: q[1], period: q[5] || 240 });
  });
  return S;
}

export function itemsOf(L) {
  const out = [];
  L.coins.forEach(([x, y], i) => out.push({ type: 'coin', i, x, y, ...PICK.coin }));
  L.pouch.forEach(([x, y], i) => out.push({ type: 'pouch', i, x, y, ...PICK.pouch }));
  L.lant.forEach(([x, y], i) => out.push({ type: 'heart', i, x: x + 50, y: y - 30, ...PICK.heart }));
  return out.map((it, id) => ({ ...it, id }));
}

/**
 * Builds the model for one level (or boss arena).
 * prof: measured paths from measureInPage(). Returns surfaces, edges (with "witnesses": concrete jumps the bot can
 * try), what's reachable, dead ends, items that can't be collected, lantern problems and snake problems.
 */
export function analyseLevel(L, prof, GY, { maxWitnesses = 16 } = {}) {
  const S = surfacesOf(L, GY);
  const items = itemsOf(L);
  const Xp = RUNUPS.map(d => prof.X[`${d},1`]);
  const Xm = RUNUPS.map(d => prof.X[`${d},-1`]);
  const jumps = HOLDS.map(h => ({ h, c: 0, ...prof.V[`${h},0`] }));
  const offs = [
    ...HOLDS.flatMap(h => COYOTE.map(c => ({ h, c, ...prof.V[`${h},${c}`] }))),
    { h: null, c: null, ...prof.V.fall },
  ];
  const gateX = L.gate + 3; // the boss starts when Red Eye's middle passes gate + 20
  const edges = S.map(() => new Map());
  const touched = S.map(() => new Set());
  const reachesGate = S.map(() => false);
  const phasesOf = B => range(32).map(i => (i * B.period) / 32);

  function addEdge(a, b, w) {
    let list = edges[a].get(b);
    if (!list) edges[a].set(b, (list = []));
    if (list.length < maxWitnesses * 4) list.push(w);
  }

  // One jump or fall from (X, y0). loAt(k)/hiAt(k): leftmost/rightmost X at frame k with hardest steering.
  // t0: A's phase if A moves. `free` holds the spots Red Eye can still be in the air at: a spot over a surface he
  // lands on drops out, and the rest can only spread by one frame's top speed (VMAX) each frame.
  function fly(a, X, y0, t0, V, loAt, hiAt, how) {
    const A = S[a];
    const n = Math.min(V.dy.length, Xp[0].length);
    let F0 = y0;
    let free = null;
    for (let k = 0; k < n; k++) {
      const F1 = y0 + V.dy[k];
      const vy = V.vy[k];
      const pl = loAt(k);
      const ph = hiAt(k);
      free = merge((free || [[pl, ph]]).map(([l, r]) => [Math.max(l - VMAX, pl), Math.min(r + VMAX, ph)]));
      // Below the ground line (step.js) Red Eye is pushed sideways out of any ground he overlaps, so those spots
      // are out. He isn't lost yet: a coyote jump can still lift him back up onto the far side.
      if (F0 > GY + 4) free = subtract(free, L.segs.map(([s0, s1]) => [s0 - PW, s1]));
      if (!free.length) return;
      if (free[free.length - 1][1] > gateX) reachesGate[a] = true;
      for (const it of items)
        if (
          Math.abs(it.y - (F1 - 28)) < it.ry &&
          free.some(([l, r]) => it.x > l + HALF - it.rx && it.x < r + HALF + it.rx)
        )
          touched[a].add(it.id);
      if (vy >= 0) {
        // The engine checks ground first, then logs in list order (= the order of S), and stops at the first
        // one Red Eye lands on. So a spot already claimed by an earlier surface this frame isn't a landing on B.
        const taken = [];
        const groundY = F0 <= GY + 1 && F1 >= GY;
        const landOn = (b, l, r, extra) => {
          let best = null;
          for (const [fl, fr] of free) {
            const piece = widestFree(Math.max(l, fl), Math.min(r, fr), taken);
            if (piece && (!best || piece[1] - piece[0] > best[1] - best[0])) best = piece;
          }
          if (best && b !== a)
            addEdge(a, b, { ...how, k, T: (best[0] + best[1]) / 2, width: best[1] - best[0], h: V.h, c: V.c, ...extra });
          return best;
        };
        for (let b = 0; b < S.length; b++) {
          const B = S[b];
          if (!B.moving) {
            if (B.kind === 'ground' ? !groundY : !(F0 <= B.y + 1 && F1 >= B.y)) continue;
            landOn(b, B.x0 + LO, B.x1 + HI, {});
            taken.push([B.x0 + LO, B.x1 + HI]);
          } else {
            // A still surface lets Red Eye wait for any phase; from a moving log he can wait whole swings of it.
            // (Moving logs don't block other landings in the model: Red Eye can pick a moment they're elsewhere.)
            const phis = t0 == null ? phasesOf(B) : range(12).map(m => t0 + m * A.period + k + 1);
            for (const phi of phis) {
              const o = pp(B.q, phi);
              if (F0 <= o.y + 8 && F1 >= o.y && landOn(b, o.x + LO, o.x + B.w + HI, { phi })) break;
            }
          }
        }
        free = subtract(free, taken);
        if (!free.length) return;
      }
      F0 = F1;
      if (F1 > 720) return;
    }
  }

  for (let a = 0; a < S.length; a++) {
    const A = S[a];
    const phases = A.moving ? range(16).map(i => (i * A.period) / 16) : [null];
    for (const t0 of phases) {
      const base = A.moving ? pp(A.q, t0) : { x: A.x0, y: A.y };
      const xmin = base.x + LO + 0.5;
      const xmax = base.x + A.w + HI - 0.5;
      if (xmax > gateX) reachesGate[a] = true;
      // walking along it
      for (const it of items)
        if (Math.abs(it.y - (base.y - 28)) < it.ry && it.x > xmin + HALF - it.rx && it.x < xmax + HALF + it.rx) touched[a].add(it.id);
      // jumping from anywhere on it, with the longest run-up available each way
      const xs = [];
      for (let X = xmin; X < xmax; X += 6) xs.push(X);
      xs.push(xmax);
      for (const X of xs) {
        const iR = runIdx(X - xmin);
        const iL = runIdx(xmax - X);
        for (const V of jumps) {
          const how = { from: a, type: 'jump', X, rel: X - base.x, t0, iR, iL };
          fly(a, X, base.y, t0, V, k => X - Xp[iL][k], k => X + Xp[iR][k], how);
        }
      }
      // running off either end, then falling or a coyote jump
      const iAll = runIdx(xmax - xmin);
      if (RUNUPS[iAll] >= 2)
        for (const V of offs) {
          fly(a, xmax, base.y, t0, V, k => xmax + Xm[1][k], k => xmax + Xp[iAll][k], {
            from: a,
            type: 'off-right',
            X: xmax,
            rel: xmax - base.x,
            t0,
            iR: iAll,
          });
          fly(a, xmin, base.y, t0, V, k => xmin - Xp[iAll][k], k => xmin - Xm[1][k], {
            from: a,
            type: 'off-left',
            X: xmin,
            rel: xmin - base.x,
            t0,
            iL: iAll,
          });
        }
    }
  }

  // Keep the safest witnesses (widest landing range) for each edge, a variety of take-off points.
  const graph = edges.map(m => {
    const out = {};
    for (const [b, list] of m) {
      list.sort((u, v) => v.width - u.width);
      const seen = new Set();
      out[b] = list
        .filter(w => {
          const key = `${w.type}|${Math.round(w.X / 24)}|${w.h}|${w.c}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, maxWitnesses);
    }
    return out;
  });

  // Where can he get to from the start? From where can he still reach the boss gate?
  const start = S.findIndex(s => s.kind === 'ground' && 110 > s.x0 + LO && 110 < s.x1 + HI);
  const reach = new Set([start]);
  for (const queue = [start]; queue.length; ) {
    const a = queue.shift();
    for (const b of Object.keys(graph[a]).map(Number))
      if (!reach.has(b)) {
        reach.add(b);
        queue.push(b);
      }
  }
  const toGate = new Set(S.map((_, i) => i).filter(i => reachesGate[i]));
  for (let grew = true; grew; ) {
    grew = false;
    for (let a = 0; a < S.length; a++)
      if (!toGate.has(a) && Object.keys(graph[a]).some(b => toGate.has(Number(b)))) {
        toGate.add(a);
        grew = true;
      }
  }
  // distance (in hops) to the gate, for the bot's route
  const dist = S.map((_, i) => (reachesGate[i] ? 0 : Infinity));
  for (let changed = true; changed; ) {
    changed = false;
    for (let a = 0; a < S.length; a++)
      for (const b of Object.keys(graph[a]).map(Number))
        if (dist[b] + 1 < dist[a]) {
          dist[a] = dist[b] + 1;
          changed = true;
        }
  }

  const got = new Set();
  for (const a of reach) for (const id of touched[a]) got.add(id);
  const missed = items.filter(it => !got.has(it.id));

  const standOn = (x, y) =>
    S.findIndex(s => !s.moving && Math.abs(s.y - y) < 1 && x > s.x0 + LO && x < s.x1 + HI);
  const lanterns = L.lant.map(([x, y], i) => {
    const s = standOn(x, y);
    return { i, x, y, surface: s, ok: s >= 0 && reach.has(s) && toGate.has(s) };
  });

  const snakeProblems = [];
  L.sn.forEach(([x, a, b, y, , kind], i) => {
    if (kind === 8) return; // flying snakes hover
    const lo = Math.min(a, x);
    const hi = Math.max(b, x);
    const on = S.some(s => !s.moving && Math.abs(s.y - y) < 1 && s.x0 <= lo && hi <= s.x1);
    if (!on) snakeProblems.push(`snake ${i + 1} (kind ${kind}) at x=${x} patrols ${a}-${b} at y=${y}, not on one piece of ground or log`);
  });

  return {
    surfaces: S,
    graph,
    dist,
    start,
    reach: [...reach],
    toGate: [...toGate],
    completable: [...reach].some(a => reachesGate[a]),
    deadEnds: [...reach].filter(a => !toGate.has(a)).map(a => S[a].id),
    unreachable: S.filter((_, i) => !reach.has(i)).map(s => s.id),
    items: { total: items.length, missed },
    lanterns,
    snakeProblems,
  };
}
