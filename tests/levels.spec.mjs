// The level model: proves every level can be finished and everything in it can be reached.
// See tests/model/reach.mjs for how it works. Each level is its own test, so the report says which level is wrong.
import { test, expect, openGame } from './helpers.mjs';
import { loadGameData } from './model/data.mjs';
import { measureInPage, RUNUPS, HOLDS, COYOTE } from './model/measure.mjs';
import { analyseLevel, pp } from './model/reach.mjs';

const game = loadGameData();
const { GY } = game;
let prof;

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await openGame(page);
  prof = await page.evaluate(measureInPage, { RUNUPS, HOLDS, COYOTE });
  await page.close();
});

test.describe('the model itself', () => {
  test('the browser has the same level data the model reads', async ({ page }) => {
    await openGame(page);
    const inPage = await page.evaluate(() => JSON.parse(JSON.stringify({ LEVELS: __t.LEVELS, BOSSES: __t.BOSSES })));
    expect(inPage.LEVELS).toEqual(game.LEVELS);
    expect(inPage.BOSSES).toEqual(game.BOSSES);
  });

  test('jumps measured in the engine work the way the model assumes', async ({ page }) => {
    expect(prof.independent, 'left/right input never changes the up-down path').toBe(true);
    const apex = -Math.min(...prof.V['99,0'].dy);
    expect(apex, 'a full jump rises about 140px').toBeGreaterThan(120);
    expect(apex).toBeLessThan(160);
    // the model's copy of pp() (where a moving log is) matches the game's
    await openGame(page);
    const logs = game.LEVELS.flatMap(L => L.plats).filter(q => q[3] || q[4]);
    const times = [0, 17, 99, 250, 1234];
    const inPage = await page.evaluate(({ logs, times }) => logs.map(q => times.map(t => pp(q, t))), { logs, times });
    expect(logs.map(q => times.map(t => pp(q, t)))).toEqual(inPage);
  });

  test('the model catches broken levels', () => {
    const lvl = o => ({
      name: 'test',
      pal: 'jungle',
      segs: [
        [-200, 1000],
        [1200, 5000],
      ],
      plats: [],
      grass: [],
      signs: [],
      lant: [],
      pouch: [],
      sn: [],
      end: 4700,
      gate: 4500,
      coins: [],
      ...o,
    });
    const run = o => analyseLevel(lvl(o), prof, GY);
    expect(run({}).completable, 'a 200px gap can be jumped').toBe(true);
    const wide = run({
      segs: [
        [-200, 1000],
        [1400, 5000],
      ],
    });
    expect(wide.completable, 'a 400px pit cannot').toBe(false);
    expect(wide.deadEnds).toEqual(['ground 1']);
    expect(run({ coins: [[800, 150]] }).items.missed.length, 'a coin 310px up').toBe(1);
    expect(run({ plats: [[600, 260, 120]] }).unreachable, 'a log 200px up').toEqual(['log 1']);
    expect(run({ plats: [[600, 330, 120]] }).unreachable, 'a log 130px up').toEqual([]);
    expect(run({ lant: [[1100, GY]] }).lanterns[0].ok, 'a lantern over a pit').toBe(false);
    expect(run({ sn: [[1100, 950, 1300, GY, 1, 0]] }).snakeProblems.length, 'a snake over a pit').toBe(1);
  });
});

test.describe('every level', () => {
  for (const [i, L] of game.LEVELS.entries()) {
    test(`Level ${i + 1}: ${L.name}`, async ({}, testInfo) => {
      // data
      const B = game.BOSSES[L.boss];
      expect(B, `boss ${L.boss} exists`).toBeTruthy();
      expect(game.PALS[L.pal], `palette ${L.pal}`).toBeTruthy();
      expect(game.PALS[B.pal], `boss palette ${B.pal}`).toBeTruthy();
      expect(
        L.segs.some(s => s[0] <= L.gate && s[1] >= L.gate + 40),
        'the gate is on solid ground',
      ).toBe(true);
      if (i >= 10)
        for (let j = 0; j < L.segs.length - 1; j++) {
          const a = L.segs[j][1];
          const b = L.segs[j + 1][0];
          expect(b - a, `builder rule: gap at x=${a} is 260px or less`).toBeLessThanOrEqual(260);
          if (b - a > 150) {
            const log = L.plats.some(q => q[0] + q[2] + (q[3] || 0) > a && q[0] - (q[3] || 0) < b);
            expect(log, `builder rule: gap at x=${a} has a stepping log`).toBe(true);
          }
        }
      // reachability
      const m = analyseLevel(L, prof, GY);
      const missed = m.items.missed.map(it => `${it.type} ${it.i + 1} at (${Math.round(it.x)}, ${Math.round(it.y)})`);
      const summary =
        `${m.surfaces.length} surfaces, ${m.reach.length} reachable, ` +
        `${m.items.total - m.items.missed.length}/${m.items.total} coins, pouches and hearts collectible, ` +
        `${m.lanterns.filter(l => l.ok).length}/${m.lanterns.length} checkpoints safe`;
      testInfo.annotations.push({ type: 'model', description: summary });
      console.log(`Level ${String(i + 1).padStart(2)} ${L.name.padEnd(26)} ${summary}`);
      expect(m.completable, 'the boss gate can be reached from the start').toBe(true);
      expect(m.deadEnds, 'places you can get to but cannot get out of (except by falling)').toEqual([]);
      expect(m.unreachable, 'ground or logs you can never reach').toEqual([]);
      expect(missed, 'coins, pouches and hearts you can never collect').toEqual([]);
      expect(
        m.lanterns.filter(l => !l.ok),
        'checkpoints with nothing to stand on, or no way on',
      ).toEqual([]);
      expect(m.snakeProblems).toEqual([]);
    });
  }

  test('boss arena: both logs can be reached', () => {
    const m = analyseLevel(game.arena, prof, GY);
    expect(m.unreachable).toEqual([]);
  });

  test('sign text fits on the sign boards', async ({ page }) => {
    await openGame(page);
    const wide = await page.evaluate(async () => {
      await document.fonts.load("17px 'Lilita One'");
      const c = document.createElement('canvas').getContext('2d');
      c.font = "17px 'Lilita One',system-ui,sans-serif";
      const out = [];
      __t.LEVELS.forEach((L, i) =>
        L.signs.forEach(([, a, b]) =>
          [a, b].forEach(t => {
            const w = c.measureText(t).width;
            if (w > 116) out.push(`Level ${i + 1} "${t}" is ${Math.round(w)}px (board fits 116px)`);
          }),
        ),
      );
      return out;
    });
    expect(wide).toEqual([]);
  });
});
