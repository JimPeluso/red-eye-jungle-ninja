// Mad moves (js/mad.js): each boss's extra attack once it's mad (half health).
// Moss (Vine Grab) gets the detailed tests; then every boss with a mad move gets the same checks, from the table at
// the bottom: the banner, the warning, standing still gets hit, a real dodge (tests/dodges.mjs), the dazed hit.
import { test, expect, openGame, tick, shot } from './helpers.mjs';
import { DODGES } from './dodges.mjs';

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

// Every boss with a mad move, and the dodge a player would use (tests/dodges.mjs): walk to safe ground, a log, duck,
// or jump it (with the jump's options).
const MOVES = [
  [1, 'Moss', 'Vine Grab!', 'walk'],
  [2, 'Thunder', 'Lightning Call!', 'walk'],
  [3, 'Tide', 'Tidal Wave!', 'log'],
  [4, 'Ember', 'Fire Rain!', 'walk'],
  [5, 'Shadow', 'Cave-in!', 'walk'],
  [10, 'Master Fang', 'Fang Slash!', 'duck'],
  // a standing jump clears the Spike Ball when it's 28 to 86px away; jump at 57, there and back
  [23, 'Spike King', 'Spike Ball!', 'jump', { at: 57, times: 2 }],
];

test('every mad move has a name, a tip, a part, a look and a sound, and is in the table below', async ({ page }) => {
  await openGame(page);
  const { problems, mad } = await page.evaluate(() => {
    const t = __t,
      problems = [],
      mad = [];
    t.LEVELS.forEach((L, i) => {
      const b = t.BOSSES[L.boss];
      if (!b.mad) return;
      mad.push([i + 1, b.name, t.MAD[b.mad]?.name]);
      const m = t.MAD[b.mad],
        part = m && t.PARTS[m.part];
      if (!m) return problems.push(`${b.name}: no move called "${b.mad}"`);
      if (!m.name || !m.tip) problems.push(`${b.name}: no name or tip`);
      if (!part) problems.push(`${b.name}: no part called "${m.part}"`);
      if (!t.LOOKS[m.look]) problems.push(`${b.name}: no look called "${m.look}"`);
      const sound = m.sound || part?.def.sound;
      if (typeof t.sfx[sound] !== 'function') problems.push(`${b.name}: no sound called "${sound}"`);
    });
    return { problems, mad };
  });
  expect(problems).toEqual([]);
  expect(mad, 'every boss with a mad move gets the fair-play tests').toEqual(MOVES.map(m => m.slice(0, 3)));
});

for (const [n, boss, move, how, opts] of MOVES)
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
      const dodged = await page.evaluate(DODGES[how], opts);
      expect(dodged, `the dodge (${how}) worked`).toBe(true);
      const [before, after] = await hitDazed(page);
      expect(await page.evaluate(() => __t.p.hearts), 'no heart lost').toBe(hearts);
      expect(after, 'the sword hits the dazed boss').toBeLessThan(before);
    });
  });
