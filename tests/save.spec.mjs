// Save and Continue (js/save.js): the game remembers where Red Eye got to, and the title screen offers Continue.
import { test, expect, openGame, tick, finishBoss, mode } from './helpers.mjs';

/** Reloads the page (like closing and reopening the game) and pauses the clock again. */
async function reopen(page) {
  await page.reload();
  await page.waitForFunction(() => !!window.__t);
  try {
    await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
  } catch {
    // already paused
  }
}
const hide = page =>
  page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
const state = page =>
  page.evaluate(() => ({
    mode: __t.mode,
    li: __t.li,
    x: Math.round(__t.p.x),
    hearts: __t.p.hearts,
    coins: __t.p.coins,
    ammo: __t.p.ammo,
    kills: __t.p.kills,
  }));

test('with no save, the title shows Play only', async ({ page }) => {
  await openGame(page);
  await expect(page.locator('#goT')).toBeVisible();
  await expect(page.locator('#goCont')).toBeHidden();
  await expect(page.locator('#goN')).toBeHidden();
});

test('Continue picks up at the last checkpoint; beaten snakes and taken coins stay gone', async ({ page }) => {
  await openGame(page);
  await page.locator('#goT').click();
  await page.evaluate(() => {
    __t.snakes[0].alive = false;
    __t.coins[0].got = true;
    Object.assign(__t.p, { hearts: 4, coins: 7, ammo: 2, kills: 1 });
    __t.respawnAt(2090, 460);
    __t.p.inv = 1e6;
  });
  await page.keyboard.down('ArrowRight');
  await tick(page, 6); // past the first lantern (x=2120): a checkpoint, which saves
  await page.keyboard.up('ArrowRight');
  expect(await page.evaluate(() => __t.lit[0])).toBe(true);

  await reopen(page);
  await expect(page.locator('#goCont')).toBeVisible();
  await expect(page.locator('#contInfo')).toHaveText('Level 1: The Jungle Floor, checkpoint 1');
  await expect(page.locator('#goT')).toBeHidden();
  await page.locator('#goCont').click();
  expect(await state(page)).toEqual({ mode: 'play', li: 0, x: 2120, hearts: 4, coins: 7, ammo: 2, kills: 1 });
  expect(await page.evaluate(() => [__t.snakes[0].alive, __t.coins[0].got, __t.lit[0]])).toEqual([false, true, true]);
});

test('clearing a level saves the start of the next one, with the coins', async ({ page }) => {
  await openGame(page);
  await page.locator('#goT').click();
  await page.evaluate(() => {
    __t.p.coins = 12;
    __t.startBoss(__t.LEVELS[0].boss);
  });
  await tick(page, 130);
  await page.evaluate(() => {
    __t.B.hp = 1;
    __t.bossHit(2);
  });
  await finishBoss(page);
  expect(await mode(page)).toBe('win');
  await reopen(page);
  await expect(page.locator('#contInfo')).toHaveText('Level 2: The Treetops');
  await page.locator('#goCont').click();
  const s = await state(page);
  expect([s.mode, s.li, s.coins, s.x]).toEqual(['play', 1, 12, 110]);
});

test('leaving the app in a boss fight: Continue starts that boss fight again', async ({ page }) => {
  await openGame(page);
  await page.locator('#goT').click();
  await page.evaluate(() => __t.startBoss(__t.LEVELS[0].boss));
  await tick(page, 130);
  await page.evaluate(() => (__t.B.hp = 5));
  await hide(page);
  await reopen(page);
  await expect(page.locator('#contInfo')).toHaveText('Level 1: The Jungle Floor, boss fight');
  await page.locator('#goCont').click();
  expect(await page.evaluate(() => [__t.mode, __t.li, !!__t.B && __t.B.hp === __t.B.max])).toEqual(['play', 0, true]);
});

test('leaving the app keeps the coins picked up since the last checkpoint', async ({ page }) => {
  await openGame(page);
  await page.locator('#goT').click();
  await page.evaluate(() => {
    __t.coins[3].got = true;
    __t.p.coins = 20;
  });
  await hide(page);
  await reopen(page);
  await page.locator('#goCont').click();
  expect(await page.evaluate(() => [__t.p.coins, __t.coins[3].got, Math.round(__t.p.x)])).toEqual([20, true, 110]);
});

test('Enter on the title continues when there is a save', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('redeye-unlock', '2');
    localStorage.setItem('redeye-save', JSON.stringify({ v: 1, li: 2, boss: false, cp: { x: 110, y: 460 }, coins: 5 }));
  });
  await openGame(page);
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => [__t.mode, __t.li, __t.p.coins])).toEqual(['play', 2, 5]);
});

test('New game starts over at Level 1 and keeps the unlocked levels', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('redeye-unlock', '3');
    localStorage.setItem(
      'redeye-save',
      JSON.stringify({ v: 1, li: 3, boss: false, cp: { x: 110, y: 460 }, coins: 50 }),
    );
  });
  await openGame(page);
  await expect(page.locator('#goN')).toBeVisible();
  await page.locator('#goN').click();
  const s = await state(page);
  expect([s.mode, s.li, s.coins]).toEqual(['play', 0, 0]);
  await page.keyboard.press('Escape');
  await page.locator('#goQ').click();
  await expect(page.locator('.chip:not([disabled])')).toHaveCount(4);
  await expect(page.locator('#contInfo')).toHaveText('Level 1: The Jungle Floor');
});

test('beating the game clears the save', async ({ page }) => {
  await openGame(page);
  const n = await page.evaluate(() => __t.LEVELS.length);
  await page.evaluate(n => {
    __t.startLevel(n - 1);
    __t.startBoss(__t.LEVELS[n - 1].boss);
  }, n);
  await tick(page, 130);
  expect(await page.evaluate(() => localStorage.getItem('redeye-save'))).not.toBe(null);
  await page.evaluate(() => {
    __t.B.hp = 1;
    __t.bossHit(2);
  });
  await finishBoss(page);
  expect(await mode(page)).toBe('champ');
  expect(await page.evaluate(() => localStorage.getItem('redeye-save'))).toBe(null);
  await page.locator('#goC').click();
  await expect(page.locator('#goT')).toBeVisible();
  await expect(page.locator('#goCont')).toBeHidden();
});

test.describe('a broken or tampered save', () => {
  for (const [what, saved, unlock] of [
    ['not JSON', '{oops', '0'],
    ['a level that does not exist', JSON.stringify({ v: 1, li: 999 }), '22'],
    ['a level that is not unlocked yet', JSON.stringify({ v: 1, li: 5 }), '1'],
    ['an unknown save version', JSON.stringify({ v: 9, li: 0 }), '0'],
  ])
    test(`${what}: no Continue, just Play`, async ({ page }) => {
      await page.addInitScript(
        ([s, u]) => {
          localStorage.setItem('redeye-unlock', u);
          localStorage.setItem('redeye-save', s);
        },
        [saved, unlock],
      );
      await openGame(page);
      await expect(page.locator('#goT')).toBeVisible();
      await expect(page.locator('#goCont')).toBeHidden();
    });

  test('impossible numbers are fixed, and a fake checkpoint goes back to the start of the level', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'redeye-save',
        JSON.stringify({
          v: 1,
          li: 0,
          boss: 'yes',
          cp: { x: 4000, y: -50 },
          hearts: 99,
          coins: -5,
          ammo: 'lots',
          sp: 1e9,
          lit: [1, 1, 1, 1, 1],
          beaten: 'all',
        }),
      );
    });
    await openGame(page);
    await expect(page.locator('#contInfo')).toHaveText('Level 1: The Jungle Floor');
    await page.locator('#goCont').click();
    const s = await page.evaluate(() => ({
      boss: !!__t.B,
      x: Math.round(__t.p.x),
      hearts: __t.p.hearts,
      coins: __t.p.coins,
      ammo: __t.p.ammo,
      sp: __t.p.sp,
      lit: __t.lit,
      alive: __t.snakes.every(q => q.alive),
    }));
    expect(s).toEqual({ boss: false, x: 110, hearts: 6, coins: 0, ammo: 0, sp: 100, lit: [false, false], alive: true });
  });
});
