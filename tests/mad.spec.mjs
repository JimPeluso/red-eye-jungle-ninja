// Mad moves (js/mad.js): each boss's extra attack once it's mad (half health).
// Moss (Vine Grab) gets the detailed tests; then every boss with a mad move gets the same four checks.
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
    __t.startLevel(5); // Venom, Level 6: no mad move yet
    __t.startBoss(__t.LEVELS[5].boss);
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

/** Starts a boss fight (level n, 1-based), makes the boss mad and starts its mad move. Returns the move's name. */
async function madBoss(page, n) {
  await openGame(page);
  await page.evaluate(n => {
    __t.startLevel(n - 1);
    __t.startBoss(__t.LEVELS[n - 1].boss);
  }, n);
  await tick(page, 130);
  await page.evaluate(() => (__t.p.inv = 0));
  await makeMad(page);
  await tick(page, 1);
  const name = await page.locator('#bnB').textContent();
  expect(await nextAttack(page)).toBe('mad');
  return name;
}
/** After a dodge (or a hit): waits for the boss to be dazed, then hits it with the sword. Returns [hp before, after]. */
async function hitDazed(page) {
  const dazed = await page.evaluate(() => {
    for (let i = 0; i < 600 && __t.B.st !== 'dazed'; i++) __t.step();
    for (let i = 0; i < 15; i++) __t.step(); // the head flops down
    __t.p.inv = 1e6;
    __t.respawnAt(__t.B.hx - 80, 460);
    __t.p.face = 1;
    return __t.B.st;
  });
  expect(dazed).toBe('dazed');
  const hp = await page.evaluate(() => __t.B.hp);
  await page.keyboard.press('KeyZ');
  await tick(page, 12);
  return [hp, await page.evaluate(() => __t.B.hp)];
}

// how: the dodge a player would use. walk = to safe ground, log = up onto a log, duck = hold Sneak, jump = jump it
for (const [n, boss, move, how] of [
  [1, 'Moss', 'Vine Grab!', 'walk'],
  [2, 'Thunder', 'Lightning Call!', 'walk'],
  [3, 'Tide', 'Tidal Wave!', 'log'],
  [4, 'Ember', 'Fire Rain!', 'walk'],
  [5, 'Shadow', 'Cave-in!', 'walk'],
  [10, 'Master Fang', 'Fang Slash!', 'duck'],
  [23, 'Spike King', 'Spike Ball!', 'jump'],
])
  test.describe(`Level ${n}: ${boss}'s ${move}`, () => {
    const file = boss.toLowerCase().replace(' ', '-');
    test('standing still gets hit, after at least 0.75 s of warning', async ({ page }, testInfo) => {
      expect(await madBoss(page, n)).toBe(move);
      await expect(page.locator('#bnU'), 'the banner says how to dodge it').not.toBeEmpty();
      await tick(page, 30);
      await shot(page, testInfo, `mad-${file}-warning`);
      const hitAt = await page.evaluate(() => {
        const hearts = __t.p.hearts;
        for (let f = 31; f < 400; f++) {
          __t.step();
          if (__t.p.hearts < hearts) return f;
        }
        return null;
      });
      await shot(page, testInfo, `mad-${file}-hit`);
      expect(hitAt, 'it hit Red Eye standing still').not.toBe(null);
      expect(hitAt, 'frames of warning before it could hurt').toBeGreaterThanOrEqual(45);
    });

    test('a real dodge works, then the boss is dazed and can be hit', async ({ page }) => {
      await madBoss(page, n);
      const hearts = await page.evaluate(() => __t.p.hearts);
      // The dodge, with real inputs (the same key flags the keyboard sets), frame by frame inside the page.
      const dodged = await page.evaluate(how => {
        const t = __t,
          k = t.key;
        if (how === 'duck') {
          // hold Sneak until the sword wave has flown past
          k.D = 1;
          for (let i = 0; i < 300 && t.waves.some(w => w.slash); i++) t.step();
          k.D = 0;
          return !t.waves.some(w => w.slash);
        }
        if (how === 'jump') {
          // jump when the ball is about 57px away (a standing jump works from about 28 to 86px), there and back
          const ball = () => t.waves.find(w => w.ball);
          let jumps = 0,
            hold = 0;
          for (let i = 0; i < 700 && ball(); i++) {
            const w = ball(),
              coming = w.warn === 0 && (w.vx < 0 ? w.x > t.p.x : w.x < t.p.x),
              gap = w.vx < 0 ? w.x - 30 - (t.p.x + 29) : t.p.x + 5 - (w.x + 30);
            if (t.p.on && coming && gap <= 57 && jumps < 2) {
              window.press('J');
              k.J = 1;
              hold = 16;
              jumps++;
            }
            if (hold > 0 && --hold === 0) k.J = 0;
            t.step();
          }
          k.J = 0;
          return jumps === 2 && !ball();
        }
        if (how === 'log') {
          // jump up onto the arena's first log (x 80-210, 108px up) and stay there while the wave rolls under
          t.respawnAt(150, 460);
          for (let i = 0; i < 3; i++) t.step();
          window.press('J');
          k.J = 1;
          for (let i = 0; i < 40; i++) t.step();
          k.J = 0;
          return t.p.on && !!t.p.plat;
        }
        // walk to the nearest safe ground: away from every danger spot
        const cx = () => t.p.x + 17;
        const safe = x => t.zones.every(z => Math.abs(x - z.x) > z.w / 2 + 17 + 10);
        let target = null;
        for (let d = 0; d < 800 && target == null; d += 4)
          for (const x of [cx() - d, cx() + d]) if (x > 30 && x < t.B.hx - 60 && safe(x)) target = x;
        let f = 0;
        for (; f < 44 && Math.abs(cx() - target) > 6; f++) {
          k.L = cx() > target ? 1 : 0;
          k.R = cx() < target ? 1 : 0;
          t.step();
        }
        k.L = k.R = 0;
        for (; f < 44; f++) t.step(); // let go and come to a stop, still inside the warning time
        // clear of every danger spot by the game's own rule: Red Eye's body (p.x+5 to p.x+29) outside each one
        return t.zones.every(z => t.p.x + 29 < z.x - z.w / 2 || t.p.x + 5 > z.x + z.w / 2);
      }, how);
      expect(dodged, 'reached safe ground in time').toBe(true);
      const [before, after] = await hitDazed(page);
      expect(await page.evaluate(() => __t.p.hearts), 'no heart lost').toBe(hearts);
      expect(after, 'the sword hits the dazed boss').toBeLessThan(before);
    });
  });
