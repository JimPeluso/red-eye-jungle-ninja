// Smoke test for Red Eye Jungle Ninja.
// Opens the game in headless Chromium (index.html?test), checks the level data,
// plays a bit of every level and boss, and saves screenshots to tests/shots/.
// Run:  npm test        (first time: npm install && npx playwright install chromium)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shots = path.join(root, 'tests', 'shots');
mkdirSync(shots, { recursive: true });
const url = pathToFileURL(path.join(root, 'index.html')).href + '?test';

const fails = [];
const check = (ok, msg) => { console.log((ok ? '  ok   ' : '  FAIL ') + msg); if (!ok) fails.push(msg); };
const wait = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } }); // iPad landscape
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|net::/.test(m.text())) errors.push(m.text()); });

await page.goto(url);
await wait(400);
check(await page.evaluate(() => !!window.__t), 'game loaded and test hook is there');
await page.screenshot({ path: path.join(shots, 'title.png') });

// 1. Level data: every level can be finished and points at a real boss and palette.
console.log('Level data');
const report = await page.evaluate(() => {
  const { LEVELS, BOSSES, PALS } = __t, out = [];
  LEVELS.forEach((L, i) => {
    const probs = [];
    // For each pit between two ground pieces, find the widest stretch with no ground or log to land on.
    // Generated levels (11+) also follow the stricter builder rules.
    for (let j = 0; j < L.segs.length - 1; j++) {
      const a = L.segs[j][1], b = L.segs[j + 1][0], gap = b - a;
      const iv = L.plats.map(q => [q[0] - (q[3] || 0), q[0] + q[2] + (q[3] || 0)]).filter(([x0, x1]) => x1 > a && x0 < b).sort((u, v) => u[0] - v[0]);
      let at = a, hole = 0;
      for (const [x0, x1] of iv) { hole = Math.max(hole, x0 - at); at = Math.max(at, x1); }
      hole = Math.max(hole, b - at);
      if (hole > 220) probs.push(`pit at x=${a}: ${Math.round(hole)}px with nothing to land on`);
      if (i >= 10 && gap > 260) probs.push(`gap ${gap} at x=${a} is wider than the builder allows`);
      if (i >= 10 && gap > 150 && !iv.some(([x0, x1]) => x0 < b && x1 > a)) probs.push(`gap ${gap} at x=${a} has no stepping log`);
    }
    if (!L.segs.some(s => s[0] <= L.gate && s[1] >= L.gate + 40)) probs.push('gate is not on solid ground');
    if (!(L.boss >= 0 && L.boss < BOSSES.length)) probs.push('boss index ' + L.boss + ' does not exist');
    else if (!PALS[BOSSES[L.boss].pal]) probs.push('boss palette missing: ' + BOSSES[L.boss].pal);
    if (!PALS[L.pal]) probs.push('palette missing: ' + L.pal);
    out.push({ n: i + 1, name: L.name, boss: BOSSES[L.boss]?.name, probs });
  });
  return out;
});
for (const r of report) check(!r.probs.length, `Level ${r.n} ${r.name} (boss: ${r.boss})${r.probs.length ? ': ' + r.probs.join('; ') : ''}`);

await page.click('#goT');
await wait(600);

// 2. Rock Snake: hidden = sword just clangs; out = it can be beaten.
console.log('Rock Snake');
await page.evaluate(() => { __t.snakes.length = 0; const s = __t.mkSnake([520, 430, 640, 460, 1.3, 10], 0); s.cd = 1e9; __t.snakes.push(s); __t.respawnAt(400, 460); __t.p.inv = 0; });
await page.keyboard.down('ArrowRight'); await wait(250); await page.keyboard.up('ArrowRight');
await page.keyboard.press('KeyZ'); await wait(150);
check(await page.evaluate(() => __t.snakes[0].hp === __t.snakes[0].mhp && __t.snakes[0].rk === 0), 'hidden Rock Snake takes no damage');
await page.evaluate(() => { __t.snakes[0].cd = 0; __t.p.inv = 9999; });
await wait(500);
check(await page.evaluate(() => __t.snakes[0].rk > 0), 'Rock Snake pops out when Red Eye is close');
for (let k = 0; k < 8; k++) { await page.keyboard.press('KeyZ'); await wait(250); }
check(await page.evaluate(() => !__t.snakes[0].alive), 'Rock Snake can be beaten once it is out');

// 3. Play a few seconds of every level.
console.log('Levels');
const n = await page.evaluate(() => __t.LEVELS.length);
for (let i = 0; i < n; i++) {
  await page.evaluate(i => { __t.startLevel(i); __t.p.inv = 9999; }, i);
  await wait(200);
  await page.keyboard.down('ArrowRight');
  for (let k = 0; k < 12; k++) { if (k % 4 === 0) await page.keyboard.press('Space'); if (k % 2 === 0) await page.keyboard.press('KeyZ'); await wait(70); }
  await page.keyboard.up('ArrowRight');
  await page.screenshot({ path: path.join(shots, `level-${String(i + 1).padStart(2, '0')}.png`) });
  check(await page.evaluate(i => __t.li === i && __t.mode === 'play', i), `Level ${i + 1} plays`);
}

// 4. Every boss used by a level starts; beating Master Fang goes on, beating the final boss wins the game.
console.log('Bosses');
const used = await page.evaluate(() => [...new Set(__t.LEVELS.map(L => L.boss))]);
for (const k of used) {
  await page.evaluate(k => { __t.startBoss(k); }, k);
  await wait(1300);
  await page.screenshot({ path: path.join(shots, `boss-${String(k).padStart(2, '0')}.png`) });
  check(await page.evaluate(() => !!__t.B && __t.mode === 'play'), `boss ${k} (${await page.evaluate(k => __t.BOSSES[k].name, k)}) starts`);
}
async function beat(levelIndex) {
  await page.evaluate(i => { __t.startLevel(i); __t.startBoss(__t.LEVELS[i].boss); __t.p.inv = 9999; }, levelIndex);
  await wait(1300);
  await page.evaluate(() => { __t.B.hp = 1; __t.bossHit(2); });
  for (let t = 0; t < 40; t++) { await wait(200); const m = await page.evaluate(() => __t.mode); if (m !== 'play') return m; }
  return page.evaluate(() => __t.mode);
}
check(await beat(9) === 'win', 'beating Master Fang (Level 10) leads to Level 11');
check(await beat(n - 1) === 'champ', `beating the final boss (Level ${n}) shows "You beat the game!"`);

check(!errors.length, 'no errors in the page' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
await browser.close();
console.log(fails.length ? `\n${fails.length} problem(s).` : '\nAll good. Screenshots are in tests/shots/.');
process.exit(fails.length ? 1 : 0);
