// Smoke test: the game loads, the Rock Snake works, every level and boss starts, and beating a boss leads on.
// Fast checks that run on every change, in both browsers. The full playthrough is in playthrough.spec.mjs.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import * as espree from 'espree';
import { test, expect, openGame, tick, run, holdKey, tapKey, shot, mode, root } from './helpers.mjs';

test('no two game files declare the same top-level name (that would blank the game)', () => {
  const seen = {};
  const dupes = [];
  for (const f of readdirSync(path.join(root, 'js')).filter(f => f.endsWith('.js'))) {
    const ast = espree.parse(readFileSync(path.join(root, 'js', f), 'utf8'), {
      ecmaVersion: 2022,
      sourceType: 'script',
    });
    const names = [];
    for (const n of ast.body) {
      if (n.type === 'VariableDeclaration')
        n.declarations.forEach(d => d.id.type === 'Identifier' && names.push(d.id.name));
      else if (n.id) names.push(n.id.name);
    }
    for (const name of names) {
      if (seen[name]) dupes.push(`${name} in ${seen[name]} and ${f}`);
      seen[name] = f;
    }
  }
  expect(dupes).toEqual([]);
});

test('the title screen shows, and Play starts Level 1', async ({ page }, testInfo) => {
  await openGame(page);
  await expect(page.locator('#title')).toBeVisible();
  await expect(page.locator('.logo')).toHaveText('Red Eye');
  await shot(page, testInfo, 'title');
  await page.locator('#goT').click();
  expect(await page.evaluate(() => [__t.mode, __t.li])).toEqual(['play', 0]);
});

test('Rock Snake: hidden it just clangs, once it pops out it can be beaten', async ({ page }) => {
  await openGame(page);
  await page.locator('#goT').click();
  await tick(page, 36);
  await page.evaluate(() => {
    __t.snakes.length = 0;
    const s = __t.mkSnake([520, 430, 640, 460, 1.3, 10], 0);
    s.cd = 1e9; // stays hidden
    __t.snakes.push(s);
    __t.respawnAt(400, 460);
    __t.p.inv = 0;
  });
  await holdKey(page, 'ArrowRight', 15);
  await tapKey(page, 'KeyZ', 9);
  expect(await page.evaluate(() => __t.snakes[0].hp === __t.snakes[0].mhp && __t.snakes[0].rk === 0)).toBe(true);
  await page.evaluate(() => {
    __t.snakes[0].cd = 0;
    __t.p.inv = 9999;
  });
  await tick(page, 30);
  expect(await page.evaluate(() => __t.snakes[0].rk > 0), 'pops out when Red Eye is close').toBe(true);
  for (let k = 0; k < 8; k++) await tapKey(page, 'KeyZ', 15);
  expect(await page.evaluate(() => __t.snakes[0].alive), 'beaten once it is out').toBe(false);
});

test('bosses that burrow go underground, chase, burst up, lie dazed and can be hit', async ({ page }, testInfo) => {
  await openGame(page);
  const burrowers = await page.evaluate(() =>
    __t.LEVELS.map((L, i) => [i, L.boss]).filter(([, k]) => __t.BOSSES[k].atk.includes('burrow')),
  );
  expect(burrowers.length).toBeGreaterThan(0);
  for (const [lvl, k] of burrowers) {
    const name = await page.evaluate(k => __t.BOSSES[k].name, k);
    await page.evaluate(
      ([lvl, k]) => {
        __t.startLevel(lvl);
        __t.startBoss(k);
      },
      [lvl, k],
    );
    await tick(page, 132);
    await page.evaluate(() => {
      __t.respawnAt(250, 460);
      __t.p.inv = 9999;
      Object.assign(__t.B, { st: 'idle', t: 1, count: 1 });
    });
    // frame by frame inside the page (one round trip per frame is too slow in WebKit): every state the boss goes
    // through, stopping for a screenshot while it's underground and again once it's dazed
    const until = (stop, seen) =>
      page.evaluate(
        ({ stop, seen }) => {
          for (let i = 0; i < 600 && __t.B.st !== stop; i++) {
            __t.step();
            if (!seen.includes(__t.B.st)) seen.push(__t.B.st);
          }
          return seen;
        },
        { stop, seen },
      );
    let seen = await until('under', []);
    await shot(page, testInfo, `burrow-${name.toLowerCase()}`);
    seen = await until('dazed', seen);
    expect(
      ['dive', 'under', 'rumble', 'burst', 'dazed'].every(s => seen.includes(s)),
      `${name} (Level ${lvl + 1}) goes underground, chases, bursts up and lies dazed`,
    ).toBe(true);
    const hp = await page.evaluate(() => __t.B.hp);
    await page.evaluate(() => {
      __t.p.x = __t.B.hx - 80;
      __t.p.face = 1;
    });
    for (let n = 0; n < 3; n++) await tapKey(page, 'KeyZ', 15);
    expect(await page.evaluate(h => __t.B.hp < h, hp), `${name} can be hit while dazed`).toBe(true);
  }
});

test('every level starts and plays', async ({ page }, testInfo) => {
  test.setTimeout(5 * 60_000); // 20+ screenshots; WebKit at iPad resolution is slow
  await openGame(page);
  const n = await page.evaluate(() => __t.LEVELS.length);
  for (let i = 0; i < n; i++) {
    await page.evaluate(i => {
      __t.startLevel(i);
      __t.p.inv = 9999;
    }, i);
    await tick(page, 12);
    await page.keyboard.down('ArrowRight');
    for (let k = 0; k < 12; k++) {
      if (k % 4 === 0) await page.keyboard.press('Space');
      if (k % 2 === 0) await page.keyboard.press('KeyZ');
      await run(page, 4); // drawn once, for the screenshot below
    }
    await page.keyboard.up('ArrowRight');
    await shot(page, testInfo, `level-${String(i + 1).padStart(2, '0')}`);
    expect(await page.evaluate(i => __t.li === i && __t.mode === 'play', i), `Level ${i + 1} plays`).toBe(true);
  }
});

test('every boss a level uses starts', async ({ page }, testInfo) => {
  test.setTimeout(5 * 60_000); // 20+ screenshots; WebKit at iPad resolution is slow
  await openGame(page);
  const used = await page.evaluate(() => [...new Set(__t.LEVELS.map(L => L.boss))]);
  for (const k of used) {
    await page.evaluate(k => __t.startBoss(k), k);
    await tick(page, 78);
    await shot(page, testInfo, `boss-${String(k).padStart(2, '0')}`);
    const name = await page.evaluate(k => __t.BOSSES[k].name, k);
    expect(await page.evaluate(() => !!__t.B && __t.mode === 'play'), `boss ${k} (${name}) starts`).toBe(true);
  }
});

test('beating Master Fang leads to Level 11, beating the final boss wins the game', async ({ page }) => {
  await openGame(page);
  const beat = async levelIndex => {
    await page.evaluate(i => {
      __t.startLevel(i);
      __t.startBoss(__t.LEVELS[i].boss);
      __t.p.inv = 9999;
    }, levelIndex);
    await tick(page, 78);
    await page.evaluate(() => {
      __t.B.hp = 1;
      __t.bossHit(2);
    });
    for (let t = 0; t < 40 && (await mode(page)) === 'play'; t++) await tick(page, 12);
    return mode(page);
  };
  expect(await beat(9)).toBe('win');
  const n = await page.evaluate(() => __t.LEVELS.length);
  expect(await beat(n - 1)).toBe('champ');
});
