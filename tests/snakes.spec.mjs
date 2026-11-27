// The newer snakes, kinds 11-15 (js/snake-kinds.js): Drop, Spring, Fire, Shield and Ghost snakes.
// Each test puts one snake on Level 1's first stretch of ground and checks its warning, its attack and how to beat it.
import { test, expect, openGame, tick, shot } from './helpers.mjs';

/** Level 1 with only the given snakes, and Red Eye standing at x. Returns nothing; read state with snake(page). */
async function arena(page, sns, x = 300, inv = 1e6) {
  await openGame(page);
  await page.evaluate(
    ({ sns, x, inv }) => {
      __t.startLevel(0);
      __t.snakes.length = 0;
      sns.forEach((sn, i) => __t.snakes.push(__t.mkSnake(sn, i)));
      __t.respawnAt(x, 460);
      __t.p.inv = inv;
    },
    { sns, x, inv },
  );
  await tick(page, 2);
}
const snake = (page, i = 0) => page.evaluate(i => JSON.parse(JSON.stringify(__t.snakes[i])), i);
const moveTo = (page, x, inv = 1e6) =>
  page.evaluate(
    ({ x, inv }) => {
      __t.respawnAt(x, 460);
      __t.p.inv = inv;
    },
    { x, inv },
  );
/** Swings the sword until the snake is beaten (or 6 tries), facing it from where Red Eye stands. */
async function slash(page, times = 6) {
  for (let i = 0; i < times && (await snake(page)).alive; i++) {
    await page.evaluate(() => (__t.p.face = __t.snakes[0].x > __t.p.x + 17 ? 1 : -1));
    await page.keyboard.press('KeyZ');
    await tick(page, 26);
  }
  return (await snake(page)).alive;
}

test('Drop Snake: hangs, shakes for at least half a second, drops, then can be beaten', async ({ page }, testInfo) => {
  await arena(page, [[600, 520, 720, 460, 1.6, 11]]);
  await tick(page, 30);
  expect((await snake(page)).off, 'still up on its vine while Red Eye is far away').toBeGreaterThan(150);
  await moveTo(page, 560);
  await tick(page, 10);
  await shot(page, testInfo, 'drop-snake-shaking');
  // frame by frame inside the page: how long it shakes, then the fall
  const r = await page.evaluate(() => {
    const s = __t.snakes[0];
    let shaking = 10;
    while (s.ns === 1 && shaking < 100) {
      __t.step();
      shaking++;
    }
    for (let i = 0; i < 60 && s.off > 0; i++) __t.step();
    const landedAt = s.x;
    const landed = [s.off, s.ns];
    for (let i = 0; i < 20; i++) __t.step();
    return { shaking, landed, moved: s.x !== landedAt };
  });
  expect(r.shaking, 'frames of shaking before it drops').toBeGreaterThanOrEqual(30);
  expect(r.landed).toEqual([0, 3]);
  expect(r.moved, 'races off along the ground').toBe(true);
  await moveTo(page, (await snake(page)).x - 60);
  expect(await slash(page), 'beaten with the sword').toBe(false);
});

test('Spring Snake: coils for a moment, then hops at Red Eye, and can be beaten', async ({ page }, testInfo) => {
  await arena(page, [[600, 400, 760, 460, 1.6, 12]], 420);
  // like every snake, it waits a moment after appearing, then coils up when Red Eye is close
  const r = await page.evaluate(() => {
    const s = __t.snakes[0];
    for (let i = 0; i < 80 && s.ns !== 1; i++) __t.step();
    const coiling = s.ns === 1;
    let coil = 0;
    while (s.ns === 1 && coil < 60) {
      __t.step();
      coil++;
    }
    let high = 0;
    for (let i = 0; i < 60 && s.ns === 2; i++) {
      __t.step();
      high = Math.max(high, s.off);
    }
    return { coiling, coil, high, x: s.x, off: s.off };
  });
  expect(r.coiling, 'coiling up').toBe(true);
  expect(r.coil, 'frames of coiling before the hop').toBeGreaterThanOrEqual(20);
  expect(r.high, 'jumped up').toBeGreaterThan(60);
  expect(r.x, 'hopped towards Red Eye').toBeLessThan(600);
  expect(r.off, 'landed').toBe(0);
  await shot(page, testInfo, 'spring-snake-landed');
  await moveTo(page, r.x - 60);
  expect(await slash(page)).toBe(false);
});

test('Fire Snake: leaves flames that hurt and burn out; beating it puts them out', async ({ page }, testInfo) => {
  await arena(page, [[600, 520, 720, 460, 1.6, 13]], 150);
  await tick(page, 100);
  await shot(page, testInfo, 'fire-snake-flames');
  const flames = await page.evaluate(() => __t.zones.filter(z => z.kind === 'flame').map(z => z.x));
  expect(flames.length, 'a trail of flames').toBeGreaterThanOrEqual(3);
  expect(flames.length).toBeLessThanOrEqual(6);
  const hearts = (await page.evaluate(() => __t.p)).hearts;
  await moveTo(page, flames[flames.length - 1] - 17, 0);
  await tick(page, 3);
  expect((await page.evaluate(() => __t.p)).hearts, 'standing in a flame hurts').toBe(hearts - 1);
  await moveTo(page, (await snake(page)).x - 70);
  expect(await slash(page)).toBe(false);
  await tick(page, 25);
  expect(await page.evaluate(() => __t.zones.filter(z => z.kind === 'flame').length), 'its flames went out').toBe(0);
});

test('Shield Snake: the sword and stars clang off its front, but its back can be hit', async ({ page }, testInfo) => {
  await arena(page, [[600, 400, 800, 460, 0.01, 14]], 540);
  await page.evaluate(() => (__t.snakes[0].dir = -1)); // facing Red Eye
  await page.evaluate(() => (__t.p.face = 1));
  await page.keyboard.press('KeyZ');
  await tick(page, 10);
  await shot(page, testInfo, 'shield-snake-clang');
  expect((await snake(page)).hp, 'sword from the front: clang').toBe(2.2);
  await tick(page, 20);
  await page.keyboard.press('KeyX');
  await tick(page, 12);
  expect((await snake(page)).hp, 'star from the front: clang').toBe(2.2);
  // jump over it: from behind (it's still facing left), before it turns round
  await moveTo(page, 660);
  await page.evaluate(() => (__t.p.face = -1));
  await tick(page, 16); // the clang's short invincibility wears off
  await page.keyboard.press('KeyZ');
  await tick(page, 8);
  expect((await snake(page)).hp, 'sword in the back hurts it').toBeLessThan(2.2);
});

test('Ghost Snake: when faded it can neither hurt nor be hurt; when solid it can', async ({ page }, testInfo) => {
  await arena(page, [[600, 590, 610, 460, 0.01, 15]], 150, 0);
  // faded: phase 140 of its 200-frame cycle
  await page.evaluate(() => {
    const s = __t.snakes[0];
    s.ph = (((140 - s.t) % 200) + 200) % 200;
  });
  await moveTo(page, 583, 0);
  const hearts = (await page.evaluate(() => __t.p)).hearts;
  await tick(page, 5);
  await shot(page, testInfo, 'ghost-snake-faded');
  expect((await page.evaluate(() => __t.p)).hearts, 'walking through a faded ghost is safe').toBe(hearts);
  await page.evaluate(() => (__t.p.face = 1));
  await page.keyboard.press('KeyZ');
  await tick(page, 10);
  expect((await snake(page)).hp, 'the sword goes straight through it').toBe(2.2);
  // solid again: phase 20
  await page.evaluate(() => {
    const s = __t.snakes[0];
    s.ph = (((20 - s.t) % 200) + 200) % 200;
  });
  await moveTo(page, 520, 1e6);
  await tick(page, 2);
  await shot(page, testInfo, 'ghost-snake-solid');
  expect(await slash(page), 'beaten while solid').toBe(false);
});

test('all five new snakes are placed in the levels', async ({ page }) => {
  await openGame(page);
  const kinds = await page.evaluate(() => __t.LEVELS.flatMap(L => L.sn.map(s => s[5])).filter(k => k >= 11));
  for (const k of [11, 12, 13, 14, 15])
    expect(kinds.filter(x => x === k).length, `kind ${k}`).toBeGreaterThanOrEqual(2);
});

test('snake zoo: all five side by side (screenshot)', async ({ page }, testInfo) => {
  await arena(
    page,
    [
      [380, 380, 380, 460, 0, 11],
      [520, 520, 520, 460, 0, 12],
      [660, 600, 720, 460, 1.2, 13],
      [800, 800, 800, 460, 0, 14],
      [940, 940, 940, 460, 0, 15],
    ],
    120,
  );
  await tick(page, 60);
  await page.evaluate(() => {
    __t.snakes[1].ns = 1; // the Spring Snake mid-coil
    __t.snakes[1].nt = 10;
    __t.snakes[3].dir = -1;
  });
  await tick(page, 1);
  await shot(page, testInfo, 'snake-zoo');
});
