// The bot plays the real game from the title screen to "You beat the game!", and checks the model against the engine.
// tests/model/bot.mjs explains how the bot plays. Chromium only (the engine is the same in every browser).
import { test, expect, openGame, shot, mode } from './helpers.mjs';
import { loadGameData } from './model/data.mjs';
import { measureInPage, RUNUPS, HOLDS, COYOTE } from './model/measure.mjs';
import { analyseLevel } from './model/reach.mjs';
import { botInstall, planWitnesses } from './model/bot.mjs';

const game = loadGameData();
const { GY } = game;

async function measured(page) {
  const other = await page.context().newPage();
  await openGame(other);
  const prof = await other.evaluate(measureInPage, { RUNUPS, HOLDS, COYOTE });
  await other.close();
  return prof;
}

const plan = (L, prof) => {
  const m = analyseLevel(L, prof, GY);
  return { graph: planWitnesses(m, prof), dist: m.dist };
};

test('the bot plays the whole game, Level 1 to "You beat the game!"', async ({ page }, testInfo) => {
  test.setTimeout(30 * 60_000);
  const prof = await measured(page);
  await openGame(page);
  await page.evaluate(botInstall);
  await page.locator('#goT').click(); // Play
  const n = game.LEVELS.length;
  for (let i = 0; i < n; i++) {
    const L = game.LEVELS[i];
    await test.step(`Level ${i + 1}: ${L.name}`, async () => {
      expect(await page.evaluate(() => [__t.li, __t.mode])).toEqual([i, 'play']);
      const run = await page.evaluate(m => __bot.playLevel(m), plan(L, prof));
      expect(run.ok, `got through Level ${i + 1} (${run.why || ''}) after ${run.log.join(', ')}`).toBe(true);
      const boss = game.BOSSES[L.boss];
      const fight = await page.evaluate(() => __bot.fightBoss());
      await shot(page, testInfo, `bot-level-${String(i + 1).padStart(2, '0')}-end`);
      expect(fight.ok, `beat ${boss.name} with real hits (${JSON.stringify(fight)})`).toBe(true);
      const coins = await page.evaluate(() => __t.p.coins);
      testInfo.annotations.push({
        type: `Level ${i + 1}`,
        description: `${run.log.length} jumps, ${boss.name} beaten in ${(fight.frames / 60).toFixed(0)}s, ${coins} coins so far`,
      });
      if (i < n - 1) {
        expect(await mode(page)).toBe('win');
        await expect(page.locator('#wC')).toHaveText(String(coins));
        await page.locator('#goW').click(); // Next level
        expect(await page.evaluate(() => __t.p.coins), 'coins carry over to the next level').toBe(coins);
      } else {
        expect(await mode(page)).toBe('champ');
        await expect(page.locator('#champ')).toBeVisible();
        await expect(page.locator('#cC')).toHaveText(String(coins));
        await page.locator('#goC').click(); // Back to the start
        expect(await mode(page)).toBe('title');
      }
    });
  }
});

test("the engine agrees with the model's widest gap", async ({ page }) => {
  const prof = await measured(page);
  const lvl = gap => ({
    name: 'test',
    pal: 'jungle',
    segs: [
      [-200, 1000],
      [1000 + gap, 6000],
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
    boss: 0,
  });
  let widest = 0;
  for (let g = 150; g <= 320; g += 2) if (analyseLevel(lvl(g), prof, GY).completable) widest = g;
  expect(widest).toBeGreaterThan(200);
  await openGame(page);
  await page.evaluate(botInstall);
  // Tries every take-off spot and every coyote timing in the real engine, with full speed and the jump held.
  const engineCrosses = gap =>
    page.evaluate(L => {
      const t = __t;
      t.startLevel(0);
      t.LEVELS[0] = { ...t.LEVELS[0], ...L };
      t.startLevel(0);
      const far = L.segs[1][0];
      const edge = L.segs[0][1] - 6;
      const snap = __bot.save();
      // c = 0: jump from every spot near the edge. c > 0: run off the edge and jump c frames later, starting the
      // run-up from slightly different spots so Red Eye leaves the edge at every point within a frame's step.
      for (const c of [0, 1, 2, 3, 4, 5, 6])
        for (let x = edge - 60; x <= edge; x += c ? 0.4 : 1) {
          if (c > 0 && x > edge - 54) break;
          __bot.restore(snap);
          t.respawnAt(c ? x - 440 : edge - 500, 460);
          t.p.inv = 1e6;
          for (const k in t.key) t.key[k] = 0;
          t.key.R = 1;
          if (c === 0) {
            for (let f = 0; f < 400 && t.p.on && t.p.x < x; f++) t.step();
            if (!t.p.on) continue;
          } else {
            for (let f = 0; f < 400 && t.p.on; f++) t.step();
            for (let f = 1; f < c; f++) t.step();
          }
          window.press('J');
          t.key.J = 1;
          for (let f = 0; f < 200; f++) {
            t.step();
            if (t.p.on && t.p.x > far - 40) return true;
            if (t.p.y > 600) break;
          }
        }
      return false;
    }, lvl(gap));
  expect(await engineCrosses(widest), `the engine can jump the ${widest}px gap the model says is the widest`).toBe(true);
  expect(await engineCrosses(widest + 4), `the engine can't jump ${widest + 4}px, which the model says is too wide`).toBe(
    false,
  );
});
