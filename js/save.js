/* Save and Continue: remembers where Red Eye got to, so the title screen can offer "Continue". */
'use strict';
/* ---------- save and continue ----------
   The game saves by itself (in localStorage, key 'redeye-save'):
   - when a level starts, at each lantern checkpoint and when a boss fight starts,
   - when a level is cleared (the save then points at the start of the next level),
   - when the player leaves the app (switching apps, closing the tab).
   Continue goes back to the last checkpoint (or the start of the boss fight) with the hearts, coins, stars, super
   meter and time Red Eye had. Snakes he beat stay beaten and coins he took stay taken, like "Try again" after a
   Game Over. Beating the game clears the save. "New game" starts over (unlocked levels are kept).
   Anyone can edit their browser's saved data, so readSave() checks every value and throws away anything odd. */
const SAVE_KEY = 'redeye-save';
const START = { x: 110, y: GY };

function saveGame({ next = false } = {}) {
  if (!p || mode === 'title' || mode === 'champ') return;
  const stats = {
    hearts: p.hearts,
    coins: p.coins,
    ammo: p.ammo,
    sp: Math.floor(p.sp || 0),
    time: p.time,
    kills: p.kills,
    sneaks: p.sneaks,
  };
  let s;
  if (next) {
    // a level was just cleared: Continue starts the next one
    if (li + 1 >= LEVELS.length) return;
    s = { v: 1, li: li + 1, boss: false, cp: START, ...stats };
  } else if (boss) {
    s = { v: 1, li, boss: true, cp: START, ...stats };
  } else {
    const L = LEVELS[li];
    const flags = (list, n) => list.slice(0, n).map(q => (q.got || q.alive === false ? 1 : 0));
    s = {
      v: 1,
      li,
      boss: false,
      cp: p.cp,
      ...stats,
      lit: lit.map(on => (on ? 1 : 0)),
      beaten: snakes.slice(0, L.sn.length).map(q => (q.alive ? 0 : 1)),
      gotCoins: flags(coins, L.coins.length),
      gotPouches: flags(pouches, L.pouch.length),
      gotHearts: flags(items, L.lant.length),
    };
  }
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch (e) {}
}

/** The saved game, checked and cleaned up, or null if there isn't a usable one. */
function readSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!s || s.v !== 1 || !Number.isInteger(s.li) || s.li < 0 || s.li >= LEVELS.length) return null;
    if (s.li > unlocked()) return null; // can't continue a level that isn't unlocked
    const L = LEVELS[s.li];
    const int = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.floor(Number(v)) || 0));
    const flags = (a, n) => (Array.isArray(a) && a.length === n ? a.map(v => v === 1 || v === true) : null);
    const lantern = s.cp && L.lant.findIndex(([x, y]) => x === s.cp.x && y === s.cp.y);
    return {
      li: s.li,
      boss: s.boss === true,
      checkpoint: lantern >= 0 ? lantern : -1, // -1: the start of the level
      hearts: int(s.hearts, 0, 6) || 6, // 0 means it was saved on Game Over: come back with full hearts
      coins: int(s.coins, 0, 1e7),
      ammo: int(s.ammo, 0, 999),
      sp: int(s.sp, 0, 100),
      time: int(s.time, 0, 1e9),
      kills: int(s.kills, 0, 1e7),
      sneaks: int(s.sneaks, 0, 1e7),
      // if the level has changed since the save (different numbers of snakes, coins...), these are left out
      lit: flags(s.lit, L.lant.length),
      beaten: flags(s.beaten, L.sn.length),
      gotCoins: flags(s.gotCoins, L.coins.length),
      gotPouches: flags(s.gotPouches, L.pouch.length),
      gotHearts: flags(s.gotHearts, L.lant.length),
    };
  } catch (e) {
    return null;
  }
}

function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {}
}

function continueGame() {
  const s = readSave();
  if (!s) {
    newGame();
    return;
  }
  p = null;
  mode = 'title';
  startLevel(s.li);
  if (s.boss) startBoss(LEVELS[s.li].boss);
  else {
    s.lit?.forEach((on, i) => (lit[i] = on));
    s.beaten?.forEach((gone, i) => gone && (snakes[i].alive = false));
    s.gotCoins?.forEach((got, i) => (coins[i].got = got));
    s.gotPouches?.forEach((got, i) => (pouches[i].got = got));
    s.gotHearts?.forEach((got, i) => (items[i].got = got));
  }
  Object.assign(p, {
    hearts: s.hearts,
    coins: s.coins,
    ammo: s.boss ? Math.max(8, s.ammo) : s.ammo,
    sp: s.sp,
    time: s.time,
    kills: s.kills,
    sneaks: s.sneaks,
  });
  if (!s.boss && s.checkpoint >= 0) {
    const [x, y] = LEVELS[s.li].lant[s.checkpoint];
    p.cp = { x, y };
    respawnAt(x, y);
  }
  saveGame();
}

/** Title screen: "Continue" (with where you got to) and "New game" when there's a save, otherwise just "Play". */
function showContinue() {
  const s = readSave();
  $('goT').hidden = !!s;
  $('goCont').hidden = !s;
  $('goN').hidden = !s;
  if (s)
    $('contInfo').textContent =
      `Level ${s.li + 1}: ${LEVELS[s.li].name}` +
      (s.boss ? ', boss fight' : s.checkpoint >= 0 ? `, checkpoint ${s.checkpoint + 1}` : '');
}
