// The big finish when a boss is beaten (startDefeat / defeatStep in js/boss.js): dizzy with X eyes, topples over,
// its body pops into fireworks from the tail to the head, confetti, then the win screen.
import { test, expect, openGame, tick, run, shot, mode } from './helpers.mjs';

const GY = 460;

/** Starts the boss fight of level n (1-based), lets the entrance finish and lands the winning hit. */
async function beatBoss(page, n) {
  await openGame(page);
  await page.evaluate(n => {
    __t.startLevel(n - 1);
    __t.startBoss(__t.LEVELS[n - 1].boss);
  }, n);
  await tick(page, 130);
  await page.evaluate(() => {
    __t.p.inv = 1e6;
    __t.B.hp = 1;
    __t.bossHit(2);
  });
}
/** Steps the game frame by frame inside the page until B.dt reaches dt, B.pop reaches pop, or the head has burst
    (gone), whichever is asked for; with none, until the finish is over. Returns B.dt. */
const stepUntil = (page, until = {}) =>
  page.evaluate(({ dt, pop, gone }) => {
    const done = b => (dt != null && b.dt >= dt) || (pop != null && b.pop >= pop) || (gone && b.gone);
    for (let i = 0; i < 400 && __t.mode === 'play' && !done(__t.B); i++) __t.step();
    return __t.B.dt;
  }, until);

test('a beaten boss gets dizzy, topples over, pops into fireworks tail to head, then the win screen', async ({
  page,
}, testInfo) => {
  await beatBoss(page, 1); // Moss
  expect(await page.evaluate(() => __t.B.st)).toBe('defeat');
  await run(page, 30);
  await shot(page, testInfo, 'finale-1-dizzy');
  const dizzy = await page.evaluate(() => [__t.B.hy, __t.B.pop, __t.B.gone]);
  expect(dizzy[0], 'still up, swaying').toBeLessThan(GY - 120);
  expect(dizzy.slice(1)).toEqual([0, false]);

  await stepUntil(page, { dt: 70 });
  expect(await page.evaluate(() => __t.B.hy), 'crashed down onto the ground').toBeGreaterThan(GY - 40);

  const firstPop = await stepUntil(page, { pop: 1 });
  expect(firstPop, 'the fireworks start after the crash').toBeGreaterThanOrEqual(76);
  await stepUntil(page, { pop: 15 });
  await shot(page, testInfo, 'finale-2-popping');

  const burst = await stepUntil(page, { gone: true });
  expect(burst, 'the head bursts last').toBeLessThan(160);
  await run(page, 12);
  await shot(page, testInfo, 'finale-3-fireworks');

  const end = await stepUntil(page);
  expect(await mode(page)).toBe('win');
  expect(end, 'about 3.3 seconds from the winning hit to the win screen').toBe(200);
});

test('a Thunder Strike during the finish does not start it over', async ({ page }) => {
  await beatBoss(page, 2);
  await run(page, 40);
  const [dt, hp] = await page.evaluate(() => {
    __t.bossHit(10);
    __t.step();
    return [__t.B.dt, __t.B.hp];
  });
  expect(dt).toBe(41);
  expect(hp, 'no more damage once beaten').toBe(-1);
});

test('Master Fang flies off his cobra, then the win screen', async ({ page }, testInfo) => {
  await beatBoss(page, 10);
  const fy = await page.evaluate(() => __t.B.fy);
  await run(page, 24);
  await shot(page, testInfo, 'finale-fang-flies-off');
  expect(await page.evaluate(() => __t.B.fy), 'up and away').not.toBe(fy);
  await stepUntil(page);
  expect(await mode(page)).toBe('win');
});

test('the final boss gets extra fireworks in the sky, then the champion screen', async ({ page }, testInfo) => {
  await beatBoss(page, 23); // the Spike King
  await stepUntil(page, { gone: true });
  const sparks = await page.evaluate(() => {
    let most = 0;
    for (let i = 0; i < 60; i++) {
      __t.step();
      most = Math.max(most, __t.parts.length);
    }
    return most;
  });
  expect(sparks, 'lots of sparks and confetti').toBeGreaterThan(80);
  await shot(page, testInfo, 'finale-final-fireworks');
  const end = await stepUntil(page);
  expect(await mode(page)).toBe('champ');
  expect(end, 'a bit longer than a normal boss').toBe(270);
});
