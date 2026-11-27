// Mad moves (js/mad.js): each boss's extra attack once it's mad (half health). So far: Moss's Vine Grab.
import { test, expect, openGame, tick, shot } from './helpers.mjs';

/** Starts the fight with Moss (Level 1's boss) and lets the entrance finish. */
async function fightMoss(page) {
  await openGame(page);
  await page.evaluate(() => {
    __t.startLevel(0);
    __t.startBoss(0);
  });
  await tick(page, 130);
  await page.evaluate(() => (__t.p.inv = 0));
}
/** Brings Moss to half health with one hit: Moss gets mad. */
const makeMad = page =>
  page.evaluate(() => {
    __t.B.hp = Math.floor(__t.B.max / 2) + 1;
    __t.bossHit(1);
  });
/** Makes Moss pick its next attack now and returns which one it picked. */
const nextAttack = page =>
  page.evaluate(() => {
    __t.zones.length = 0;
    Object.assign(__t.B, { st: 'idle', t: 1 });
    __t.step();
    return __t.B.st;
  });

test('Moss gets mad at half health: the banner names Vine Grab, and it comes straight away', async ({ page }) => {
  await fightMoss(page);
  await makeMad(page);
  await tick(page, 1);
  await expect(page.locator('#bnS')).toHaveText('Moss is mad!');
  await expect(page.locator('#bnB')).toHaveText('Vine Grab!');
  expect(await nextAttack(page)).toBe('mad');
  expect(await page.evaluate(() => __t.zones.map(z => z.kind))).toEqual(['vines', 'vines']);
});

test('Vine Grab only once Moss is mad, then every 3rd attack', async ({ page }) => {
  await fightMoss(page);
  const calm = [];
  for (let i = 0; i < 12; i++) calm.push(await nextAttack(page));
  expect(calm).not.toContain('mad');
  await makeMad(page);
  const mad = [];
  for (let i = 0; i < 7; i++) mad.push((await nextAttack(page)) === 'mad');
  expect(mad).toEqual([true, false, false, true, false, false, true]);
});

test('standing still on the leaves gets hit, but only after at least 0.75 s of warning', async ({ page }, testInfo) => {
  await fightMoss(page);
  await makeMad(page);
  await page.evaluate(() => (__t.p.inv = 0));
  expect(await nextAttack(page)).toBe('mad');
  await tick(page, 20);
  await shot(page, testInfo, 'vine-grab-warning');
  const hitAt = await page.evaluate(() => {
    const hearts = __t.p.hearts;
    for (let f = 21; f < 120; f++) {
      __t.step();
      if (__t.p.hearts < hearts) return f;
    }
    return null;
  });
  await tick(page, 4);
  await shot(page, testInfo, 'vine-grab-vines');
  expect(hitAt, 'the vines hit Red Eye standing on the leaves').not.toBe(null);
  expect(hitAt, 'frames of warning before they could hurt').toBeGreaterThanOrEqual(45);
});

test('stepping off the leaves dodges Vine Grab, then Moss is dazed and can be hit', async ({ page }) => {
  await fightMoss(page);
  await makeMad(page);
  expect(await nextAttack(page)).toBe('mad');
  const hearts = (await page.evaluate(() => __t.p)).hearts;
  await page.keyboard.down('ArrowLeft');
  await tick(page, 20);
  await page.keyboard.up('ArrowLeft');
  for (let i = 0; i < 12 && (await page.evaluate(() => __t.B.st)) === 'mad'; i++) await tick(page, 10);
  expect(await page.evaluate(() => __t.p.hearts), 'no heart lost').toBe(hearts);
  expect(await page.evaluate(() => __t.B.st)).toBe('dazed');
  await tick(page, 15); // the head flops down
  await page.evaluate(() => {
    __t.p.x = __t.B.hx - 80;
    __t.p.face = 1;
  });
  const hp = await page.evaluate(() => __t.B.hp);
  await page.keyboard.press('KeyZ');
  await tick(page, 12);
  expect(await page.evaluate(() => __t.B.hp), 'the sword hits a dazed Moss').toBeLessThan(hp);
});

test('bosses without a mad move still just get angry', async ({ page }) => {
  await openGame(page);
  await page.evaluate(() => {
    __t.startLevel(1);
    __t.startBoss(__t.LEVELS[1].boss);
  });
  await tick(page, 200);
  await page.evaluate(() => {
    __t.B.hp = Math.floor(__t.B.max / 2) + 1;
    __t.bossHit(1);
  });
  await tick(page, 1);
  await expect(page.locator('#banner')).toBeHidden();
  const picks = [];
  for (let i = 0; i < 9; i++) picks.push(await nextAttack(page));
  expect(picks).not.toContain('mad');
});
